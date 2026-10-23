/**
 * Measurement runner: asks each engine each question `repeats` times, scores
 * every answer for every business the question belongs to, and appends the
 * outcome to a JSONL cache. Resume-safe: a finished (engine, model, question,
 * repeat) is never asked again. Budget-safe: every attempted call is written
 * to a ledger *before* it is made, and the caps are checked against the
 * ledger, so a crash, a Ctrl-C or a second run can never exceed them.
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

/** Google's free-tier daily quotas reset at midnight Pacific time. */
export function quotaDay(date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
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
 * Run the plan. Options:
 *   measure(engine, question, business, context) - the pluggable engine call
 *   cachePath / ledgerPath - JSONL files (results / every attempted call)
 *   maxCalls       - hard cap on calls made by THIS invocation
 *   maxTotalCalls  - hard cap on calls across all invocations (ledger)
 *   maxCallsPerDay - hard cap per engine per Pacific day (ledger)
 *   minIntervalMs  - spacing between calls (rate limiting)
 *   store          - "flags" (default: only derived booleans/counts) | "full"
 */
export async function runMeasurements({
  businesses, engines, repeats = 3, models = {}, measure, cachePath, ledgerPath,
  maxCalls = Infinity, maxTotalCalls = Infinity, maxCallsPerDay = Infinity, minIntervalMs = 0,
  store = "flags", now = () => new Date(), sleep = (ms) => new Promise((r) => setTimeout(r, ms)), log = () => {},
  questionsFor = buildStudyQuestions, maxConsecutiveFailures = 5,
}) {
  if (!STORE_MODES.includes(store)) throw new Error(`store must be one of ${STORE_MODES.join(", ")}`);
  const tasks = planTasks({ businesses, engines, repeats, models, questionsFor });
  const done = new Set(readJsonl(cachePath).filter((r) => r.ok).map((r) => r.key));
  const ledger = readJsonl(ledgerPath);
  const perDay = new Map();
  for (const entry of ledger) perDay.set(`${entry.engine}|${entry.day}`, (perDay.get(`${entry.engine}|${entry.day}`) || 0) + 1);
  let totalCalls = ledger.length;
  let calls = 0, ok = 0, failed = 0, skipped = 0, lastCall = 0;
  const pending = tasks.filter((t) => !done.has(t.key));
  skipped = tasks.length - pending.length;
  let stop = null;
  let consecutive = 0;

  for (const task of pending) {
    const today = quotaDay(now());
    const dayKey = `${task.engine}|${today}`;
    if (calls >= maxCalls) { stop = { reason: "max_calls", detail: `--max-calls ${maxCalls} reached` }; break; }
    if (totalCalls >= maxTotalCalls) { stop = { reason: "max_total_calls", detail: `--max-total-calls ${maxTotalCalls} reached (ledger)` }; break; }
    if ((perDay.get(dayKey) || 0) >= maxCallsPerDay) { stop = { reason: "max_calls_per_day", detail: `--max-calls-per-day ${maxCallsPerDay} reached for ${task.engine} on ${today} (Pacific). Run again tomorrow; finished answers are kept.` }; break; }

    const wait = lastCall + minIntervalMs - now().getTime();
    if (wait > 0) await sleep(wait);
    lastCall = now().getTime();
    // Ledger first: the call counts against the caps even if it never returns.
    appendJsonl(ledgerPath, { at: now().toISOString(), day: today, engine: task.engine, task: task.id });
    calls += 1; totalCalls += 1;
    perDay.set(dayKey, (perDay.get(dayKey) || 0) + 1);

    const base = { key: task.key, task: task.id, engine: task.engine, model: task.model, qid: task.question.qid, kind: task.question.kind, question: task.question.text, question_version: task.question.version, repeat: task.repeat, measured_at: now().toISOString() };
    try {
      const probe = await measure(task.engine, task.question, task.businesses[0], { businesses: task.businesses, repeat: task.repeat });
      const answer = String(probe?.answer || "");
      if (!answer.trim()) throw Object.assign(new Error("empty_answer"), { code: "empty_answer" });
      const citations = Array.isArray(probe.citations) ? probe.citations : [];
      const results = {};
      for (const b of task.businesses) {
        const a = analyzeAnswer({ answer, citations, profile: studyProfile(b) });
        results[b.id] = { mentioned: a.mentioned, cited: a.cited, citation_rank: a.citation_rank };
      }
      const record = { ...base, ok: true, engine_model: probe.model || null, results, n_citations: citations.length, answer_chars: answer.length, grounding_used: probe.groundingUsed !== false };
      if (store === "full") {
        const hosts = [...new Set(citations.map((c) => normalizeHost(typeof c === "string" ? c : c?.url)).filter(Boolean))];
        Object.assign(record, { excerpt: answer.replace(/\s+/g, " ").slice(0, 400), cited_hosts: hosts });
      }
      appendJsonl(cachePath, record);
      ok += 1;
      consecutive = 0;
    } catch (error) {
      failed += 1;
      const code = String(error?.code || error?.message || "error");
      appendJsonl(cachePath, { ...base, ok: false, error: code, hard_stop: !!error?.hardStop });
      log(`call failed: ${task.engine} ${task.question.qid} r${task.repeat}: ${code}`);
      if (error?.hardStop) { stop = { reason: code, detail: error.detail || "hard stop", status: error.status ?? null }; break; }
      consecutive += 1;
      if (consecutive >= maxConsecutiveFailures) { stop = { reason: "consecutive_failures", detail: `${consecutive} failures in a row (last: ${code}); stopping rather than burning quota` }; break; }
    }
  }
  const remaining = tasks.filter((t) => !done.has(t.key)).length - ok;
  return { planned: tasks.length, skipped, calls, ok, failed, remaining, stop };
}
