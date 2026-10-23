/**
 * Cost and rollout guards for the multi-engine AI visibility measurement
 * (PR #26 review):
 *   1. ChatGPT: max_tool_calls on every request, only "search" actions
 *      counted as billed, monthly USD caps per engine (site and global).
 *   2. ChatGPT off by default: per-site cap 0, its own key
 *      (SOV_OPENAI_API_KEY); the learning job's OPENAI_API_KEY only with
 *      SOV_OPENAI_USE_SHARED_KEY=1.
 *   3. The daily batch keeps to a time budget, stores a cut-short run, refunds
 *      the unused reservation, remembers an attempt that was killed, and costs a
 *      timed-out call at its assumed maximum (not null). Lock lease vs worst case.
 *   4. The reservation is atomic: concurrent runs cannot overshoot a cap.
 *   5. The run-level ("headline") rate, the monthly report and calibration
 *      are per engine (Perplexity by default) and never pool engines; a run
 *      in which Perplexity was not asked does not replace its headline.
 *
 * No real API is called: every engine request goes to a stubbed fetch.
 */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import {
  ENGINE_USD_CAP_DEFAULTS, GLOBAL_SCOPE, OPENAI_MAX_TOOL_CALLS_DEFAULT, assumedMaxCallCost, engineApiKey, engineCaps,
  engineConfigured, engineUsdCaps, estimateCallCost, openAiMaxToolCalls, parseOpenAiResponse, planEngineBudgets,
  probeOpenAiWebSearch, readEngineUsage, recordEngineUsage, reserveEngineBudgets, reserveEngineUsage,
} from "../worker/ai-engines.mjs";
import {
  SOV_LIMITS, SOV_RUN_TIME_BUDGET_MS, headlineEngineFor, loadSovHistory, measureSov, storeSovRun,
} from "../worker/aeo-sov.mjs";
import { MEASUREMENT_LOCK_LEASE_MS } from "../worker/pro-report.mjs";
import { buildMonthlyReport, renderMonthlyReportHtml, renderMonthlyReportText } from "../worker/aeo-report.mjs";
import { collectCalibrationSamples } from "../worker/aeo-calibration.mjs";
import { AEO_SCORE_WEIGHTS } from "../worker/aeo-score.mjs";
import { SOV_BATCH_HARD_STOP_MS, SOV_BATCH_TIME_BUDGET_MS, runSovDailyBatch } from "../worker/api.mjs";
import { REQUIRED_SECRETS } from "./pro-golive-check.mjs";

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const profile = { name: "栞珈琲", businessType: "カフェ", locality: "渋谷区", host: "shiori-coffee.jp", aliases: ["栞珈琲"], language: "ja" };
const abortError = () => Object.assign(new Error("The operation was aborted"), { name: "AbortError" });

const openAiBody = ({ text = "栞珈琲", citations = [], actions = ["search"] } = {}) => ({
  id: "resp_x", model: "gpt-6-luna", status: "completed",
  output: [
    ...actions.map((type, i) => ({ type: "web_search_call", id: `ws_${i}`, status: "completed", ...(type ? { action: { type } } : {}) })),
    { type: "message", content: [{ type: "output_text", text, annotations: citations.map((url) => ({ type: "url_citation", url })) }] },
  ],
  usage: { input_tokens: 4000, output_tokens: 600 },
});
const perplexityBody = (text = "栞珈琲が人気。") => ({ model: "openai/gpt-6-luna", status: "completed", output: [{ type: "message", content: [{ type: "output_text", text }] }] });

function sqliteDb() {
  const sqlite = new DatabaseSync(":memory:");
  for (const file of ["0018_aeo_sov.sql", "0022_sov_engine_split.sql", "0031_pro_measurement.sql", "0034_sov_evidence_usage.sql", "0041_sov_engine_usage.sql"]) {
    sqlite.exec(readFileSync(new URL(`../nurevo-impl/db/${file}`, import.meta.url), "utf8"));
  }
  sqlite.exec(`CREATE TABLE aeo_scores(site_id TEXT,scanned_at TEXT,ruleset_version INTEGER,delivered_ruleset_version INTEGER,score_model_version TEXT);
    CREATE TABLE aeo_learning_observations(run_id TEXT PRIMARY KEY,site_id TEXT,measured_at TEXT,score_scanned_at TEXT,scoring_ruleset_version INTEGER,delivered_ruleset_version INTEGER,model_version TEXT,measurement_json TEXT);`);
  return {
    sqlite,
    prepare(sql) { return { bind(...args) { const st = () => sqlite.prepare(sql); return {
      async first() { return st().get(...args) || null; }, async all() { return { results: st().all(...args) }; }, async run() { return { meta: st().run(...args) }; },
      runSync() { return st().run(...args); },
    }; } }; },
    // Like D1, a batch is one transaction applied without interleaving.
    async batch(statements) { sqlite.exec("BEGIN"); try { for (const s of statements) s.runSync(); sqlite.exec("COMMIT"); } catch (e) { sqlite.exec("ROLLBACK"); throw e; } },
  };
}

/* ---------------- 1. max_tool_calls, billed searches, USD caps ---------------- */
{
  assert.equal(OPENAI_MAX_TOOL_CALLS_DEFAULT, 2);
  assert.equal(openAiMaxToolCalls({}), 2);
  assert.equal(openAiMaxToolCalls({ SOV_OPENAI_MAX_TOOL_CALLS: "5" }), 5, "env override");
  assert.equal(openAiMaxToolCalls({ SOV_OPENAI_MAX_TOOL_CALLS: "50" }), 10, "clamped to 10");
  assert.equal(openAiMaxToolCalls({ SOV_OPENAI_MAX_TOOL_CALLS: "0" }), 2, "0 or junk falls back to the default");
  assert.equal(openAiMaxToolCalls({ SOV_OPENAI_MAX_TOOL_CALLS: "abc" }), 2);

  const calls = [];
  const fetchImpl = async (url, init) => { calls.push(JSON.parse(init.body)); return json(openAiBody({ actions: ["search", "open_page", "find_in_page", "search"] })); };
  const probe = await probeOpenAiWebSearch({ SOV_OPENAI_API_KEY: "k", SOV_OPENAI_MAX_TOOL_CALLS: "4" }, "q", fetchImpl, { profile });
  assert.equal(calls[0].max_tool_calls, 4, "max_tool_calls is sent with the request");
  assert.equal(calls[0].tool_choice, "required");
  assert.equal(probe.cost.searches, 2, "only search actions are billed searches; open_page / find_in_page are not");
  // 2 x $0.01 + 4000 x $0.10/M + 600 x $0.50/M
  assert.equal(probe.cost.est_usd, 0.0207);
  const parsed = parseOpenAiResponse(openAiBody({ actions: ["search", "open_page", null] }));
  assert.equal(parsed.tool_calls, 3); assert.equal(parsed.searches, 2, "an action without a type is counted as a search, to be safe");

  // The assumed maximum: max_tool_calls searches plus generous tokens.
  assert.equal(assumedMaxCallCost("openai", {}).est_usd, 0.02275);
  assert.equal(assumedMaxCallCost("openai", { SOV_OPENAI_MAX_TOOL_CALLS: "4" }).searches, 4);
  assert.equal(assumedMaxCallCost("perplexity", {}).est_usd, 0.0035);
  assert.equal(estimateCallCost("openai", { model: "gpt-6-luna", searches: 2 }).est_usd, 0.02);

  // USD caps: defaults, overrides, 0 = off.
  assert.deepEqual(engineUsdCaps({}, "openai"), { site: 3, global: 40 });
  assert.deepEqual(engineUsdCaps({ SOV_OPENAI_SITE_MONTHLY_USD_CAP: "1.5", SOV_OPENAI_GLOBAL_MONTHLY_USD_CAP: "10" }, "openai"), { site: 1.5, global: 10 });
  assert.deepEqual(engineUsdCaps({}, "perplexity"), ENGINE_USD_CAP_DEFAULTS.perplexity);

  const DB = sqliteDb();
  const env = { DB, PERPLEXITY_API_KEY: "pk", SOV_OPENAI_API_KEY: "ok", SOV_OPENAI_SITE_MONTHLY_CAP: "120" };
  const opts = { perRunMax: 40, perplexitySite: { used: 0 } };
  await recordEngineUsage(env, "u1", "openai", { calls: 10, estCostUsd: 2.5, searches: 20 });
  let plans = await planEngineBudgets(env, "u1", opts);
  assert.equal(plans[1].allowance, 21, "the site's USD left buys floor(0.5 / 0.02275) = 21 calls");
  assert.deepEqual([plans[1].site.usd_used, plans[1].site.usd_cap], [2.5, 3]);
  await recordEngineUsage(env, "u1", "openai", { estCostUsd: 0.49 });
  plans = await planEngineBudgets(env, "u1", opts);
  assert.deepEqual([plans[1].status, plans[1].scope], ["quota_reached", "site_usd"], "under one call's worth of USD left: stopped");
  await recordEngineUsage(env, "u2", "openai", { calls: 5, estCostUsd: 37.0 });
  plans = await planEngineBudgets(env, "u3", opts);
  assert.deepEqual([plans[1].status, plans[1].scope], ["quota_reached", "global_usd"], "the deployment-wide USD cap is counted from every site");
  plans = await planEngineBudgets({ ...env, SOV_OPENAI_GLOBAL_MONTHLY_USD_CAP: "0" }, "u3", opts);
  assert.equal(plans[1].status, "disabled", "a USD cap of 0 switches the engine off");
  plans = await planEngineBudgets({ ...env, SOV_PERPLEXITY_SITE_MONTHLY_USD_CAP: "0.01" }, "u3", opts);
  assert.equal(plans[0].allowance, 2, "Perplexity has USD caps too (0.01 / 0.0035 = 2 calls)");
}

/* ---------------- 2. ChatGPT off by default, its own key ---------------- */
{
  assert.equal(engineCaps({}, "openai").site, 0, "per-site cap defaults to 0 (off)");
  assert.equal(engineConfigured({ OPENAI_API_KEY: "shared" }, "openai"), false, "the learning job's key alone does not configure ChatGPT");
  assert.equal(engineApiKey({ OPENAI_API_KEY: "shared", SOV_OPENAI_USE_SHARED_KEY: "1" }, "openai"), "shared", "borrowed only on opt-in");
  assert.equal(engineApiKey({ OPENAI_API_KEY: "shared", SOV_OPENAI_API_KEY: "own", SOV_OPENAI_USE_SHARED_KEY: "1" }, "openai"), "own", "the own key wins");
  const sent = [];
  await probeOpenAiWebSearch({ SOV_OPENAI_API_KEY: "own-key", OPENAI_API_KEY: "shared-key" }, "q",
    async (url, init) => { sent.push(init.headers.authorization); return json(openAiBody()); }, { profile });
  assert.deepEqual(sent, ["Bearer own-key"], "the request carries the SoV key, never the shared one");

  const DB = sqliteDb();
  let plans = await planEngineBudgets({ DB, PERPLEXITY_API_KEY: "pk", SOV_OPENAI_API_KEY: "ok" }, "d1", { perRunMax: 40, perplexitySite: { used: 0 } });
  assert.deepEqual(plans.map((p) => p.status), ["ready", "disabled"], "a key without a per-site cap leaves ChatGPT off");
  plans = await planEngineBudgets({ DB, PERPLEXITY_API_KEY: "pk", OPENAI_API_KEY: "shared", SOV_OPENAI_SITE_MONTHLY_CAP: "120" }, "d1", { perRunMax: 40, perplexitySite: { used: 0 } });
  assert.equal(plans[1].status, "not_configured", "a cap with only the shared key is still not configured");

  assert.ok(!REQUIRED_SECRETS.some((s) => /GEMINI_API_KEY|OPENAI_API_KEY \//.test(s.why)), "the go-live check no longer offers Gemini");
  assert.ok(REQUIRED_SECRETS.some((s) => /SOV_OPENAI_API_KEY/.test(s.why)), "and names ChatGPT's own key");
  assert.ok(!/GEMINI_API_KEY/.test(readFileSync(new URL("./pro-golive-check.mjs", import.meta.url), "utf8")));
}

/* ---------------- 3a. timeouts are costed, run deadline ---------------- */
{
  const env = { PERPLEXITY_API_KEY: "pk", SOV_OPENAI_API_KEY: "ok", SOV_OPENAI_MAX_TOOL_CALLS: "3" };
  const result = await measureSov(env, profile, {
    questions: ["q1"],
    fetchImpl: async (url) => { if (String(url).includes("openai")) throw abortError(); return json(perplexityBody()); },
  });
  const timedOut = result.samples.find((s) => s.engine === "openai");
  assert.equal(timedOut.ok, false); assert.equal(timedOut.error, "openai_timeout");
  assert.equal(timedOut.cost.searches, 3, "search count unknown: assumed max_tool_calls");
  assert.equal(timedOut.cost.est_usd, assumedMaxCallCost("openai", env).est_usd, "a timed-out call is costed, not null");
  assert.equal(timedOut.cost.basis, "assumed_max");
  assert.equal(result.by_engine.find((r) => r.engine === "openai").est_cost_usd, timedOut.cost.est_usd);
  const plain = await measureSov(env, profile, { questions: ["q1"], engineIds: ["openai"], fetchImpl: async () => new Response("bad", { status: 500 }) });
  assert.equal(plain.samples[0].cost, null, "a refused request (HTTP error) is not costed");

  // The deadline stops new calls; what was answered is kept.
  let t = 0;
  let issued = 0;
  const cut = await measureSov({ PERPLEXITY_API_KEY: "pk" }, profile, {
    questions: ["q1", "q2", "q3", "q4", "q5"], repetitions: 2, deadline: 30, clock: () => t,
    fetchImpl: async () => { issued += 1; t += 10; return json(perplexityBody()); },
  });
  assert.equal(issued, 3, "no call is started once the deadline has passed");
  assert.equal(cut.stop_reason, "time_budget"); assert.equal(cut.truncated, true);
  assert.equal(cut.answers_received, 3); assert.equal(cut.appearance_rate, 1);

  // Lock lease: covers the longest a live run can hold the lock.
  assert.equal(SOV_RUN_TIME_BUDGET_MS, 10 * 60 * 1000);
  assert.ok(MEASUREMENT_LOCK_LEASE_MS >= SOV_RUN_TIME_BUDGET_MS + SOV_LIMITS.requestTimeoutMs, "lease >= run budget + one in-flight call");
  assert.ok(MEASUREMENT_LOCK_LEASE_MS <= 16 * 60 * 1000, "and is no longer the fixed 30 minutes");
  assert.ok(SOV_BATCH_HARD_STOP_MS + SOV_LIMITS.requestTimeoutMs < 15 * 60 * 1000, "the batch ends inside the 15-minute cron limit");
  assert.ok(SOV_BATCH_TIME_BUDGET_MS <= SOV_BATCH_HARD_STOP_MS);
}

/* ---------------- 4. atomic reservation ---------------- */
{
  const DB = sqliteDb();
  const env = { DB };
  const caps = { globalCalls: 50, siteCalls: null, globalUsd: null, siteUsd: null };
  const outcomes = await Promise.all(["a", "b", "c"].map((site) => reserveEngineUsage(env, site, "openai", { calls: 20, estCostUsd: 0.4, caps })));
  assert.equal(outcomes.filter((o) => o.ok).length, 2, "three concurrent 20-call reservations under a 50 cap: two fit");
  assert.equal((await readEngineUsage(env, GLOBAL_SCOPE, "openai")).calls, 40, "the global row never passes its cap");
  const usd = await Promise.all(["d", "e", "f"].map((site) => reserveEngineUsage(env, site, "perplexity", { calls: 1, estCostUsd: 0.4, caps: { globalUsd: 1 } })));
  assert.equal(usd.filter((o) => o.ok).length, 2, "the USD cap is held the same way");
  assert.ok((await readEngineUsage(env, GLOBAL_SCOPE, "perplexity")).est_cost_usd <= 1);
  // A site row without room hands the global reservation back.
  const before = await readEngineUsage(env, GLOBAL_SCOPE, "openai");
  const refused = await reserveEngineUsage(env, "g", "openai", { calls: 5, estCostUsd: 0.1, caps: { globalCalls: 100, siteCalls: 3 } });
  assert.deepEqual(refused, { ok: false, scope: "site" });
  assert.deepEqual(await readEngineUsage(env, GLOBAL_SCOPE, "openai"), before, "the global row is restored");

  // Two runs planned from the same reading: the second gets only what is left.
  const DB2 = sqliteDb();
  const env2 = { DB: DB2, SOV_OPENAI_API_KEY: "ok", SOV_OPENAI_SITE_MONTHLY_CAP: "40", SOV_OPENAI_GLOBAL_MONTHLY_CAP: "50" };
  const opts = { perRunMax: 40 };
  const [p1, p2] = await Promise.all([planEngineBudgets(env2, "s1", opts), planEngineBudgets(env2, "s2", opts)]);
  assert.equal(p1[1].allowance, 40); assert.equal(p2[1].allowance, 40, "both plans saw 50 left");
  const [r1, r2] = await Promise.all([reserveEngineBudgets(env2, "s1", p1, opts), reserveEngineBudgets(env2, "s2", p2, opts)]);
  const got = [r1[1].reserved?.calls || 0, r2[1].reserved?.calls || 0];
  assert.deepEqual(got.slice().sort((a, b) => a - b), [10, 40], "the loser re-plans and takes the 10 that are left");
  assert.equal((await readEngineUsage(env2, GLOBAL_SCOPE, "openai")).calls, 50, "never above the global cap");
  const r3 = await reserveEngineBudgets(env2, "s3", await planEngineBudgets(env2, "s3", opts), opts);
  assert.deepEqual([r3[1].status, r3[1].scope, r3[1].allowance], ["quota_reached", "global", 0]);
}

/* ---------------- batch harness ---------------- */
const PAGE = '<!doctype html><html><head><script type="application/ld+json">{"@type":"CafeOrCoffeeShop","name":"栞珈琲","additionalType":"カフェ","address":{"addressLocality":"渋谷区"}}</script></head><body></body></html>';
function harness(siteIds) {
  const base = sqliteDb();
  const sites = siteIds.map((id, i) => ({ id, org_id: "o", url: `${id}.example.jp`, website_uri: `https://${id}.example.jp`, plan: "pro", delivery_status: "active", created_at: `2026-01-0${i + 1}` }));
  const fixed = (row, rows = []) => { const s = { bind: () => s, async first() { return row; }, async all() { return { results: rows }; }, async run() { return { meta: { changes: 1 } }; } }; return s; };
  const DB = {
    prepare(sql) {
      if (/FROM sites s/.test(sql)) return fixed(null, sites);
      if (/aeo_sov_|aeo_scores|aeo_learning_observations/.test(sql)) return base.prepare(sql);
      return fixed(null);
    },
    batch: (statements) => base.batch(statements),
  };
  return { base, DB, sites };
}
function installFetch({ onEngine }) {
  const counts = { perplexity: 0, openai: 0 };
  globalThis.fetch = async (input, init = {}) => {
    const href = typeof input === "string" ? input : input.url;
    if (href.includes("api.perplexity.ai")) { counts.perplexity += 1; return onEngine("perplexity", counts); }
    if (href.includes("api.openai.com")) { counts.openai += 1; return onEngine("openai", counts); }
    if (init.method === "HEAD") return new Response(null, { status: 200 });
    return new Response(PAGE, { status: 200, headers: { "content-type": "text/html" } });
  };
  return counts;
}
async function quiet(run) {
  const log = console.log; const warn = console.warn; const error = console.error;
  console.log = () => {}; console.warn = () => {}; console.error = () => {};
  try { return await run(); } finally { console.log = log; console.warn = warn; console.error = error; }
}

/* ---------------- 3b. batch time budget, partial runs, refunds ---------------- */
{
  const { base, DB } = harness(["t1", "t2", "t3"]);
  const env = { DB, PERPLEXITY_API_KEY: "pk", SOV_BATCH_TIME_BUDGET_MS: "60000", SOV_BATCH_HARD_STOP_MS: "90000" };
  let t = 0;
  let step = 10000;
  const counts = installFetch({ onEngine: () => { t += step; return json(perplexityBody()); } });
  const batch = await quiet(() => runSovDailyBatch(env, { clock: () => t }));
  assert.equal(counts.perplexity, 9, "the hard stop (90 s) cuts the first site after 9 calls of 10 s");
  assert.deepEqual([batch.measured, batch.cut_short, batch.deferred], [1, 1, 2], "the other two sites wait for the next trigger");
  const run = base.sqlite.prepare("SELECT answers_received, detail_json FROM aeo_sov_runs WHERE site_id='t1'").get();
  assert.equal(run.answers_received, 9, "the cut-short run is stored with what it measured");
  assert.equal(JSON.parse(run.detail_json).stop_reason, "time_budget");
  assert.equal(base.sqlite.prepare("SELECT queries_used FROM aeo_sov_usage WHERE site_id='t1'").get().queries_used, 9, "the unused reservation is refunded");
  const usage = await readEngineUsage(env, "t1", "perplexity");
  assert.equal(usage.calls, 9); assert.equal(usage.est_cost_usd, 0.009, "the reserved USD is trued up to the calls made");
  assert.ok(base.sqlite.prepare("SELECT finished_at FROM aeo_sov_attempts WHERE site_id='t1'").get().finished_at, "the attempt is marked finished");

  // Next day: t1 is not due (its cut-short run counts), t2 and t3 are measured.
  t = 0;
  step = 0;
  counts.perplexity = 0;
  const next = await quiet(() => runSovDailyBatch(env, { clock: () => t, now: Date.now() + 86400000 }));
  assert.deepEqual([next.not_due, next.measured, next.deferred], [1, 2, 0]);
}
{
  // A Worker killed mid-run leaves an unfinished attempt: the site is not
  // asked (and billed) again the next day.
  const { base, DB } = harness(["k1", "k2"]);
  const env = { DB, PERPLEXITY_API_KEY: "pk" };
  const hourAgo = new Date(Date.now() - 3600e3).toISOString();
  base.sqlite.prepare("INSERT INTO aeo_sov_attempts (site_id,trigger,started_at,finished_at,reserved_json) VALUES (?,?,?,NULL,?)").run("k1", "scheduled", hourAgo, "{}");
  base.sqlite.prepare("INSERT INTO aeo_sov_attempts (site_id,trigger,started_at,finished_at,reserved_json) VALUES (?,?,?,?,?)").run("k2", "scheduled", hourAgo, hourAgo, "{}");
  const counts = installFetch({ onEngine: () => json(perplexityBody()) });
  const batch = await quiet(() => runSovDailyBatch(env));
  assert.equal(batch.not_due, 1, "the cut-off attempt counts as that day's run");
  assert.equal(batch.measured, 1, "a finished attempt without a stored answer does not hold a site back");
  assert.equal(counts.perplexity, 10);
  assert.equal(base.sqlite.prepare("SELECT COUNT(*) AS n FROM aeo_sov_runs WHERE site_id='k1'").get().n, 0);
}
{
  // ChatGPT calls that time out are charged at their assumed maximum.
  const { DB } = harness(["o1"]);
  const env = { DB, PERPLEXITY_API_KEY: "pk", SOV_OPENAI_API_KEY: "ok", SOV_OPENAI_SITE_MONTHLY_CAP: "4" };
  const counts = installFetch({ onEngine: (engine) => { if (engine === "openai") throw abortError(); return json(perplexityBody()); } });
  await quiet(() => runSovDailyBatch(env));
  assert.equal(counts.openai, 4);
  const usage = await readEngineUsage(env, "o1", "openai");
  assert.equal(usage.calls, 4);
  assert.equal(Math.round(usage.est_cost_usd * 1e6) / 1e6, Math.round(4 * assumedMaxCallCost("openai", env).est_usd * 1e6) / 1e6, "4 timed-out calls x the assumed maximum");
  const searches = DB.prepare("SELECT searches FROM aeo_sov_engine_usage WHERE scope=? AND engine='openai'").bind("o1");
  assert.equal((await searches.first()).searches, 8, "search count assumed at max_tool_calls (2) each");
}

/* ---------------- 5. headline, monthly report, calibration ---------------- */
{
  const { base, DB } = harness(["h1"]);
  const env = { DB, PERPLEXITY_API_KEY: "pk", SOV_OPENAI_API_KEY: "ok", SOV_OPENAI_SITE_MONTHLY_CAP: "40" };
  assert.equal(headlineEngineFor(env), "perplexity");
  assert.equal(headlineEngineFor({ SOV_OPENAI_API_KEY: "ok" }), "openai", "with only ChatGPT configured it is the headline");
  // Run 1: Perplexity only, named in half the answers.
  let n = 0;
  installFetch({ onEngine: (engine) => engine === "perplexity" ? json(perplexityBody((n++ % 2) ? "栞珈琲" : "他の店")) : json(openAiBody({ text: "他の店" })) });
  await quiet(() => runSovDailyBatch({ DB, PERPLEXITY_API_KEY: "pk" }));
  base.sqlite.exec("UPDATE aeo_sov_runs SET ran_at='2026-10-01T00:00:00.000Z'");
  // Run 2: both engines. Perplexity always names it, ChatGPT never does.
  installFetch({ onEngine: (engine) => engine === "perplexity" ? json(perplexityBody("栞珈琲")) : json(openAiBody({ text: "他の店" })) });
  await quiet(() => runSovDailyBatch(env, { now: Date.now() + 4 * 86400000 }));
  const both = base.sqlite.prepare("SELECT appearance_rate FROM aeo_sov_runs ORDER BY ran_at DESC LIMIT 1").get();
  assert.equal(both.appearance_rate, 1, "the stored headline is Perplexity's 100%, not the pooled 50%");
  base.sqlite.exec("UPDATE aeo_sov_runs SET ran_at='2026-10-05T00:00:00.000Z' WHERE ran_at>'2026-10-02'");
  // Run 3: Perplexity is at its monthly cap; only ChatGPT is asked.
  base.sqlite.prepare("INSERT INTO aeo_sov_usage (site_id,month,queries_used,updated_at) VALUES (?,?,?,?) ON CONFLICT(site_id,month) DO UPDATE SET queries_used=excluded.queries_used")
    .run("h1", new Date().toISOString().slice(0, 7), 200, new Date().toISOString());
  const counts = installFetch({ onEngine: (engine) => engine === "perplexity" ? json(perplexityBody("栞珈琲")) : json(openAiBody({ text: "他の店" })) });
  await quiet(() => runSovDailyBatch(env, { now: Date.now() + 8 * 86400000 }));
  assert.deepEqual([counts.perplexity, counts.openai], [0, 10], "Perplexity at its cap is not asked; ChatGPT is");
  const capped = base.sqlite.prepare("SELECT appearance_rate, detail_json FROM aeo_sov_runs ORDER BY ran_at DESC LIMIT 1").get();
  assert.equal(capped.appearance_rate, null, "a ChatGPT-only run does not become the headline");
  assert.equal(JSON.parse(capped.detail_json).rate_basis, "not_asked");
  assert.equal(JSON.parse(capped.detail_json).headline.engine, "perplexity");

  const sov = await loadSovHistory({ DB }, "h1");
  assert.equal(sov.trend.length, 3);
  assert.deepEqual(sov.trend.map((p) => p.engine_rates.perplexity?.appearance_rate ?? null), [0.5, 1, null]);
  assert.deepEqual(sov.trend.map((p) => p.engine_rates.openai?.appearance_rate ?? null), [null, 0, 0]);
  const report = buildMonthlyReport({ site: { id: "h1" }, plan: "pro", month: "2026-10", scores: [], sov });
  const v = report.visibility;
  assert.equal(v.available, true); assert.equal(v.engine, "perplexity");
  assert.equal(v.appearance_rate, 1, "the headline stays Perplexity's last measurement");
  assert.equal(v.delta, 0.5, "compared with Perplexity's previous point, not with ChatGPT");
  assert.equal(v.from_earlier_run, true);
  assert.equal(v.answers_received, 10); assert.equal(v.questions_asked, 10);
  assert.deepEqual(v.by_engine.map((r) => [r.engine, r.appearance_rate]), [["openai", 0]], "the latest run's engines are listed per engine");
  const text = renderMonthlyReportText(report);
  assert.ok(text.includes("100%") && text.includes("前回比: +50pt"));
  assert.ok(text.includes("基準エンジン: Perplexity") && text.includes("ChatGPT: 0%"), "the text names the headline engine and lists ChatGPT separately");
  assert.ok(renderMonthlyReportHtml(report).includes("基準エンジン: Perplexity"));

  // With no Perplexity measurement at all, ChatGPT's figure is not promoted.
  const onlyGpt = buildMonthlyReport({ site: { id: "x" }, plan: "pro", month: "2026-10", scores: [], sov: {
    latest: { ...sov.latest }, trend: [sov.trend[2]] } });
  assert.equal(onlyGpt.visibility.available, false);
  assert.match(onlyGpt.visibility.message, /Perplexity/);
  assert.ok(renderMonthlyReportText(onlyGpt).includes("ChatGPT: 0%"));
}
{
  // Calibration takes one engine's rate per run, never a pool.
  const checkId = Object.keys(AEO_SCORE_WEIGHTS)[0];
  const checks = JSON.stringify([{ id: checkId, status: "OK" }]);
  const byEngine = (rows) => JSON.stringify({ engines_run: rows.map((r) => r.engine), by_engine: rows });
  const rows = [
    { site_id: "a", ran_at: "2026-10-01", status: "measured", appearance_rate: 0.4, citation_rate: 0.1, answers_received: 10, questions_asked: 10, detail_json: "{}", checks_json: checks, plan: "pro" },
    { site_id: "b", ran_at: "2026-10-02", status: "measured", appearance_rate: 0.6, answers_received: 14, questions_asked: 14, checks_json: checks, plan: "pro",
      detail_json: byEngine([{ engine: "perplexity", answers: 10, failures: 0, appearances: 6, citations: 1 }, { engine: "openai", answers: 4, failures: 0, appearances: 0, citations: 4 }]) },
    { site_id: "c", ran_at: "2026-10-03", status: "measured", appearance_rate: null, answers_received: 4, questions_asked: 4, checks_json: checks, plan: "pro",
      detail_json: JSON.stringify({ engines_run: ["openai"], headline: { engine: "perplexity" }, by_engine: [{ engine: "openai", answers: 4, appearances: 1, citations: 0 }] }) },
  ];
  const DB = { prepare: () => ({ bind: () => ({ async all() { return { results: rows }; } }) }) };
  const perplexity = await collectCalibrationSamples({ DB });
  assert.deepEqual(perplexity.map((s) => [s.site_id, s.appearance_rate, s.answers_received]), [["a", 0.4, 10], ["b", 0.6, 10]],
    "Perplexity samples only, each with Perplexity's own rate and n");
  const gpt = await collectCalibrationSamples({ DB }, { engine: "openai" });
  assert.deepEqual(gpt.map((s) => [s.site_id, s.appearance_rate]), [["b", 0], ["c", 0.25]], "ChatGPT is calibrated as its own series");
  assert.ok(gpt.every((s) => s.engine === "openai"));
}

console.log("SoV budget tests passed (max_tool_calls, USD caps, default off, own key, time budget, partial runs, atomic reservation, per-engine headline/report/calibration)");
