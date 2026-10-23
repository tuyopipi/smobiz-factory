/**
 * Measurement runner: asks each engine each question `repeats` times, scores
 * every answer for every business the question belongs to, and appends the
 * outcome to a JSONL cache. Resume-safe: a finished (engine, model, question,
 * repeat) is never asked again. Budget-safe: every attempted call is written
 * to a ledger *before* it is made, with the per-call USD ceiling reserved,
 * and both caps (calls and USD) are checked against the whole ledger, so a
 * crash, a Ctrl-C or a second run can never exceed them.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { analyzeAnswer, normalizeHost } from "../../worker/aeo-sov.mjs";
import { buildStudyQuestions } from "./questions.mjs";
import { hash } from "./engines.mjs";

export const STORE_MODES = Object.freeze(["flags", "full"]);

export function readJsonl(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8").split("\n").filter(Boolean).map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
}

function appendJsonl(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(value)}\n`);
}

export function studyProfile(business) {
  const aliases = [business.name, ...String(business.aliases || "").split("|").map((s) => s.trim()).filter(Boolean)];
  return { name: business.name, aliases: [...new Set(aliases)], host: normalizeHost(business.url), language: "ja", businessType: business.service_term || "" };
}

/**
 * The task list. Discovery questions with identical text (same area, same
 * category) are asked once per repeat and scored for every business that
 * shares them - the same answer is the fair comparison between neighbours,
 * and it saves calls. Ordered repeat-major, so a run cut short by a budget
 * cap still covers every question at least once before any is repeated.
 */
export function planTasks({ businesses, engines, repeats, models = {}, questionsFor = buildStudyQuestions }) {
  const byText = new Map();
  for (const b of businesses) {
    for (const q of questionsFor(b)) {
      const key = `${q.kind}|${q.version}|${q.text}`;
      if (!byText.has(key)) byText.set(key, { question: q, businesses: [] });
      byText.get(key).businesses.push(b);
    }
  }
  const tasks = [];
  for (let repeat = 1; repeat <= repeats; repeat += 1) {
    for (const engine of engines) {
      for (const { question, businesses: members } of byText.values()) {
        const model = models[engine] || null;
        const key = `${engine}|${model || ""}|${question.version}|${question.text}|r${repeat}`;
        tasks.push({ key, id: hash(key).toString(16), engine, model, question, repeat, businesses: members });
      }
    }
  }
  return tasks;
}

/**
 * Spend so far from the ledger. Every call line reserves `reserved_usd` (the
 * per-call ceiling) before the call is made; a later cost line for the same
 * call replaces the reservation with the adapter's figure (provider-reported
 * when Perplexity reports one, else list-price estimate). A call that failed,
 * timed out or was interrupted keeps its full reservation, because it may
 * still have been billed. Lines written before this format (no `type`) count
 * as calls with no reservation.
 */
export function ledgerTotals(entries) {
  const reserved = new Map();
  const actual = new Map();
  let calls = 0;
  for (const entry of entries) {
    if (entry.type === "cost") { actual.set(entry.call, Number(entry.est_usd) || 0); continue; }
    calls += 1;
    reserved.set(entry.call ?? `legacy-${calls}`, Number(entry.reserved_usd) || 0);
  }
  let usd = 0;
  for (const [call, value] of reserved) usd += actual.has(call) ? actual.get(call) : value;
  return { calls, usd: Math.round(usd * 1e6) / 1e6 };
}

/**
 * Run the plan. Options:
 *   measure(engine, question, business, context) - the pluggable engine call
 *   cachePath / ledgerPath - JSONL files (results / every attempted call and its cost)
 *   maxCalls      - hard cap on calls across ALL invocations (ledger)
 *   maxUsd        - hard cap on estimated USD across ALL invocations (ledger)
 *   perCallUsd(engine) - USD reserved before each call (the ceiling)
 *   minIntervalMs - spacing between calls (rate limiting)
 *   store         - "flags" (default: only derived booleans/counts) | "full"
 */
export async function runMeasurements({
  businesses, engines, repeats = 3, models = {}, measure, cachePath, ledgerPath,
  maxCalls = Infinity, maxUsd = Infinity, perCallUsd = () => 0, minIntervalMs = 0,
  store = "flags", now = () => new Date(), sleep = (ms) => new Promise((r) => setTimeout(r, ms)), log = () => {},
  questionsFor = buildStudyQuestions, maxConsecutiveFailures = 3,
}) {
  if (!STORE_MODES.includes(store)) throw new Error(`store must be one of ${STORE_MODES.join(", ")}`);
  const tasks = planTasks({ businesses, engines, repeats, models, questionsFor });
  const done = new Set(readJsonl(cachePath).filter((r) => r.ok).map((r) => r.key));
  const totals = ledgerTotals(readJsonl(ledgerPath));
  let totalCalls = totals.calls;
  let spentUsd = totals.usd;
  const startUsd = spentUsd;
  let calls = 0, ok = 0, failed = 0, skipped = 0, lastCall = 0;
  const pending = tasks.filter((t) => !done.has(t.key));
  skipped = tasks.length - pending.length;
  let stop = null;
  let consecutive = 0;
  const round = (v) => Math.round(v * 1e6) / 1e6;

  for (const task of pending) {
    const reserve = Number(perCallUsd(task.engine)) || 0;
    if (totalCalls >= maxCalls) { stop = { reason: "max_calls", detail: `--max-calls ${maxCalls} reached (${totalCalls} calls in the ledger)` }; break; }
    if (spentUsd + reserve > maxUsd + 1e-9) { stop = { reason: "max_usd", detail: `--max-usd ${maxUsd}: $${spentUsd.toFixed(4)} spent (est.), the next call may cost up to $${reserve.toFixed(4)}` }; break; }

    const wait = lastCall + minIntervalMs - now().getTime();
    if (wait > 0) await sleep(wait);
    lastCall = now().getTime();
    // Ledger first: the call and its full ceiling count against the caps even
    // if it never returns.
    const callId = `${task.id}-${totalCalls + 1}-${now().getTime()}`;
    appendJsonl(ledgerPath, { type: "call", call: callId, at: now().toISOString(), engine: task.engine, task: task.id, reserved_usd: reserve });
    calls += 1; totalCalls += 1; spentUsd = round(spentUsd + reserve);

    // Only a provider-reported cost may lower the reservation; a list-price
    // estimate (which can miss tokens the response did not report) can only
    // raise it.
    const settle = (cost) => {
      const raw = Number(cost?.est_usd);
      if (!Number.isFinite(raw) || raw < 0) return reserve;
      const value = cost.basis === "provider_reported" ? raw : Math.max(raw, reserve);
      appendJsonl(ledgerPath, { type: "cost", call: callId, est_usd: value, basis: cost.basis || null });
      spentUsd = round(spentUsd - reserve + value);
      return value;
    };

    const base = { key: task.key, task: task.id, engine: task.engine, model: task.model, qid: task.question.qid, kind: task.question.kind, question: task.question.text, question_version: task.question.version, repeat: task.repeat, measured_at: now().toISOString() };
    try {
      const probe = await measure(task.engine, task.question, task.businesses[0], { businesses: task.businesses, repeat: task.repeat });
      const costUsd = settle(probe?.cost);
      const answer = String(probe?.answer || "");
      if (!answer.trim()) throw Object.assign(new Error("empty_answer"), { code: "empty_answer", settled: true });
      const citations = Array.isArray(probe.citations) ? probe.citations : [];
      const results = {};
      for (const b of task.businesses) {
        const a = analyzeAnswer({ answer, citations, profile: studyProfile(b) });
        results[b.id] = { mentioned: a.mentioned, cited: a.cited, citation_rank: a.citation_rank };
      }
      const record = { ...base, ok: true, engine_model: probe.model || null, results, n_citations: citations.length, answer_chars: answer.length, est_usd: costUsd, cost_basis: probe?.cost?.basis || null };
      if (store === "full") {
        const hosts = [...new Set(citations.map((c) => normalizeHost(typeof c === "string" ? c : c?.url)).filter(Boolean))];
        Object.assign(record, { excerpt: answer.replace(/\s+/g, " ").slice(0, 400), cited_hosts: hosts });
      }
      appendJsonl(cachePath, record);
      ok += 1;
      consecutive = 0;
      // The ceiling is an estimate; if a call costs far more, the estimate is
      // wrong and the USD cap can no longer be trusted to hold. Stop.
      if (reserve > 0 && costUsd > reserve * 2) { stop = { reason: "cost_above_estimate", detail: `one call cost $${costUsd.toFixed(4)}, more than twice the $${reserve.toFixed(4)} ceiling; review pricing before continuing` }; break; }
    } catch (error) {
      failed += 1;
      if (!error?.settled) settle(error?.cost);
      const code = String(error?.code || error?.message || "error");
      appendJsonl(cachePath, { ...base, ok: false, error: code, hard_stop: !!error?.hardStop });
      log(`call failed: ${task.engine} ${task.question.qid} r${task.repeat}: ${code}`);
      if (error?.hardStop) { stop = { reason: code, detail: error.detail || "hard stop", status: error.status ?? null }; break; }
      consecutive += 1;
      if (consecutive >= maxConsecutiveFailures) { stop = { reason: "consecutive_failures", detail: `${consecutive} failures in a row (last: ${code}); stopping rather than spending more` }; break; }
    }
  }
  const remaining = tasks.filter((t) => !done.has(t.key)).length - ok;
  return {
    planned: tasks.length, skipped, calls, ok, failed, remaining, stop,
    usd_this_run: round(spentUsd - startUsd), usd_total: spentUsd, calls_total: totalCalls,
    caps: { max_calls: Number.isFinite(maxCalls) ? maxCalls : null, max_usd: Number.isFinite(maxUsd) ? maxUsd : null },
  };
}
