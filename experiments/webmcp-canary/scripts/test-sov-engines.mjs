/**
 * Multi-engine AI visibility: Perplexity and ChatGPT (OpenAI Responses API +
 * web_search). Gemini is not measured: its grounding terms forbid analysing
 * Grounded Results, so a GEMINI_API_KEY must enable nothing.
 *
 * No real API is called: every engine request goes to a stubbed fetch, and
 * the assertions count those requests where spend is what is being protected.
 * Covered per adapter: success, no mention, cited only, API error, provider
 * quota, missing key. Then the Wilson interval, the per-engine monthly caps
 * (site, global, disabled, migration pending), engine-specific trends, the
 * report rows and an end-to-end run through the API with a real SQLite schema.
 */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import {
  ENGINE_PRICING, SMALL_SAMPLE_N, engineCaps, estimateCallCost, extractBusinessMentions,
  monthlyCostSummary, openAiUserLocation, planEngineBudgets, probeOpenAiWebSearch, probePerplexity,
  recordEngineUsage, readEngineUsage, sanitizeProviderText, wilsonInterval, GLOBAL_SCOPE,
} from "../worker/ai-engines.mjs";
import { SovError, aggregateSov, analyzeAnswer, measureSov, storeSovRun } from "../worker/aeo-sov.mjs";
import { buildProReport, loadProReport, saveQuerySet, trendKey } from "../worker/pro-report.mjs";
import { handleApi, runSovDailyBatch } from "../worker/api.mjs";

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const profile = { name: "栞珈琲", businessType: "カフェ", locality: "渋谷区", host: "shiori-coffee.jp", aliases: ["栞珈琲"], language: "ja" };

/* Provider-shaped bodies ------------------------------------------------- */

const openAiBody = ({ text = "", citations = [], searches = 1, model = "gpt-6-luna" } = {}) => ({
  id: "resp_x", model, status: "completed",
  output: [
    ...Array.from({ length: searches }, (_, i) => ({ type: "web_search_call", id: `ws_${i}`, status: "completed", action: { type: "search", query: "渋谷 カフェ" } })),
    { type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text,
      annotations: citations.map((c, i) => ({ type: "url_citation", url: c.url, title: c.title || null, start_index: i, end_index: i + 1 })) }] },
  ],
  usage: { input_tokens: 4000, output_tokens: 600, total_tokens: 4600 },
});
const perplexityBody = ({ text = "", urls = [] } = {}) => ({
  model: "openai/gpt-6-luna", status: "completed",
  output: [{ type: "search_results", results: urls.map((url) => ({ url })) }, { type: "message", content: [{ type: "output_text", text }] }],
});

function recorder(responder) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init, body: init.body ? JSON.parse(init.body) : null });
    return responder(String(url), init, calls.length);
  };
  return { calls, fetchImpl };
}

/* ---------------- OpenAI adapter ---------------- */
{
  // Success, named: request shape and parsed answer.
  const r = recorder(() => json(openAiBody({
    text: "**栞珈琲**は渋谷区の人気カフェです。\n1. 栞珈琲 - 自家焙煎\n2. 青山ロースター：駅近",
    citations: [{ url: "https://tabelog.com/x", title: "食べログ" }, { url: "https://other-cafe.jp/", title: "Other" }],
  })));
  const probe = await probeOpenAiWebSearch({ OPENAI_API_KEY: "sk-test-not-real-000000" }, "渋谷区のカフェでおすすめはどこ？", r.fetchImpl, { profile });
  assert.equal(r.calls.length, 1);
  assert.equal(r.calls[0].url, "https://api.openai.com/v1/responses", "the Responses API is used");
  const body = r.calls[0].body;
  assert.equal(body.model, "gpt-6-luna", "the default model is the cheap web-search capable one");
  assert.equal(body.tools[0].type, "web_search", "the web_search tool is requested");
  assert.deepEqual(body.tools[0].user_location, { type: "approximate", country: "JP", timezone: "Asia/Tokyo", city: "渋谷区" }, "located in Japan, with the city");
  assert.equal(body.tool_choice, "required", "the engine must actually search");
  assert.equal(body.store, false, "responses are not stored at the provider");
  assert.equal(r.calls[0].init.headers.authorization, "Bearer sk-test-not-real-000000");
  assert.equal(probe.citations.length, 2);
  assert.deepEqual(probe.citations[1], { url: "https://other-cafe.jp/", title: "Other" });
  assert.ok(probe.mentions.includes("栞珈琲") && probe.mentions.includes("青山ロースター"), "raw business mentions are extracted");
  assert.equal(probe.cost.searches, 1);
  // 1 x $0.01 + 4000 x $0.10/M + 600 x $0.50/M = 0.0107
  assert.equal(probe.cost.est_usd, 0.0107, "cost = search calls + tokens at list price");
  const a = analyzeAnswer({ ...probe, profile });
  assert.equal(a.mentioned, true); assert.equal(a.cited, false);
  assert.deepEqual(a.competitorHosts, ["other-cafe.jp"], "aggregators are not competitors");

  // A prefecture becomes the region, a non-Japanese profile sends no location.
  assert.deepEqual(openAiUserLocation({ language: "ja", locality: "東京都" }), { type: "approximate", country: "JP", timezone: "Asia/Tokyo", region: "東京都" });
  assert.equal(openAiUserLocation({ language: "en", locality: "London" }), null);
  // A model override keeps the search price and says the token price is unknown.
  const custom = estimateCallCost("openai", { model: "some-other-model", searches: 2, inputTokens: 1e6, outputTokens: 1e6 });
  assert.equal(custom.est_usd, 0.02); assert.equal(custom.token_price_known, false);

  // No mention, cited only.
  const none = await probeOpenAiWebSearch({ OPENAI_API_KEY: "k" }, "q", recorder(() => json(openAiBody({ text: "青山ロースターがおすすめ。" }))).fetchImpl, { profile });
  const noneA = analyzeAnswer({ ...none, profile });
  assert.equal(noneA.mentioned || noneA.cited, false, "no mention and no citation is not an appearance");
  const citedOnly = await probeOpenAiWebSearch({ OPENAI_API_KEY: "k" }, "q",
    recorder(() => json(openAiBody({ text: "駅近の自家焙煎の店があります。", citations: [{ url: "https://www.shiori-coffee.jp/menu", title: "menu" }] }))).fetchImpl, { profile });
  const citedA = analyzeAnswer({ ...citedOnly, profile });
  assert.equal(citedA.mentioned, false); assert.equal(citedA.cited, true, "a citation of the domain is detected");

  // API error: detail kept, key never echoed.
  const err = await probeOpenAiWebSearch({ OPENAI_API_KEY: "k" }, "q",
    recorder(() => new Response('{"error":{"message":"Incorrect API key provided: sk-proj-abcdefghijklmnop"}}', { status: 401 })).fetchImpl, { profile }).catch((e) => e);
  assert.ok(err instanceof SovError); assert.equal(err.code, "openai_http_401");
  assert.ok(!err.detail.includes("abcdefghijklmnop"), "a key in the provider's error is redacted");
  // Provider quota.
  const quota = await probeOpenAiWebSearch({ OPENAI_API_KEY: "k" }, "q",
    recorder(() => new Response('{"error":{"code":"insufficient_quota","message":"You exceeded your current quota"}}', { status: 429 })).fetchImpl, { profile }).catch((e) => e);
  assert.equal(quota.code, "openai_quota_exhausted", "a spent provider quota has its own code");
  const rate = await probeOpenAiWebSearch({ OPENAI_API_KEY: "k" }, "q", recorder(() => new Response("slow down", { status: 429 })).fetchImpl, { profile }).catch((e) => e);
  assert.equal(rate.code, "openai_http_429", "a plain rate limit is not a quota");
  // A loopback override is honoured, a remote one is not.
  const remote = recorder(() => json(openAiBody({ text: "x" })));
  await probeOpenAiWebSearch({ OPENAI_API_KEY: "k", OPENAI_RESPONSES_SOV_API_URL: "https://evil.example/collect" }, "q", remote.fetchImpl, { profile });
  assert.equal(remote.calls[0].url, "https://api.openai.com/v1/responses", "the key is never sent to an injected host");
}

/* ---------------- Gemini: never measured ---------------- */
{
  let google = 0;
  const r = recorder((url) => { if (url.includes("googleapis")) google += 1; return json(perplexityBody({ text: "x" })); });
  const result = await measureSov({ GEMINI_API_KEY: "AIzaSyTESTONLY0000000000000000000000" }, profile, { questions: ["q"], fetchImpl: r.fetchImpl });
  assert.equal(result.status, "unconfigured", "a Gemini key alone configures nothing");
  assert.equal(r.calls.length + google, 0, "and no Google endpoint is ever contacted");
  assert.equal(engineCaps({}, "gemini"), null, "Gemini has no caps because it has no adapter");
}

/* ---------------- Perplexity adapter (behaviour unchanged) ---------------- */
{
  const r = recorder(() => json(perplexityBody({ text: "栞珈琲がおすすめ。", urls: ["https://shiori-coffee.jp/"] })));
  const probe = await probePerplexity({ PERPLEXITY_API_KEY: "pk" }, "q", r.fetchImpl);
  assert.equal(r.calls[0].url, "https://api.perplexity.ai/v1/agent");
  assert.deepEqual(Object.keys(r.calls[0].body).sort(), ["input", "instructions", "max_output_tokens", "preset"], "the request is exactly as before");
  assert.deepEqual(probe.citations, ["https://shiori-coffee.jp/"]);
  assert.equal(probe.cost.est_usd, 0.001, "one Fast Search when no tokens are reported");
  const err = await probePerplexity({ PERPLEXITY_API_KEY: "pk" }, "q", recorder(() => new Response("bad", { status: 500 })).fetchImpl).catch((e) => e);
  assert.equal(err.code, "perplexity_http_500");
}

/* ---------------- missing keys: not configured, zero calls ---------------- */
{
  const r = recorder(() => { throw new Error("must not be called"); });
  const result = await measureSov({}, profile, { questions: ["q"], fetchImpl: r.fetchImpl });
  assert.equal(result.status, "unconfigured"); assert.equal(r.calls.length, 0);
  const openAiOnly = recorder(() => json(openAiBody({ text: "栞珈琲" })));
  const o = await measureSov({ OPENAI_API_KEY: "o" }, profile, { questions: ["q1", "q2"], fetchImpl: openAiOnly.fetchImpl });
  assert.ok(openAiOnly.calls.every((c) => c.url.includes("api.openai.com")), "only the configured engine is contacted");
  assert.deepEqual(o.engines_run, ["openai"]);
  assert.equal(sanitizeProviderText("token pplx-abcdefghijk and sk-abcdefghijk and AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ"), "token [redacted] and [redacted] and [redacted]");
}

/* ---------------- two engines, repeat sampling, per-engine budget ---------------- */
// The Gemini key is present throughout to prove it is ignored.
const ALL_KEYS = { PERPLEXITY_API_KEY: "pk", OPENAI_API_KEY: "ok", GEMINI_API_KEY: "gk" };
function engineFetch({ openaiQuota = false } = {}) {
  return recorder((url) => {
    if (url.includes("perplexity")) return json(perplexityBody({ text: "栞珈琲が人気。", urls: ["https://other.example/"] }));
    if (url.includes("openai")) return openaiQuota
      ? new Response('{"error":{"code":"insufficient_quota"}}', { status: 429 })
      : json(openAiBody({ text: "駅近の店。", citations: [{ url: "https://shiori-coffee.jp/", title: "栞" }] }));
    throw new Error(`unexpected engine call: ${url}`);
  });
}
{
  const r = engineFetch();
  const result = await measureSov(ALL_KEYS, profile, { questions: ["q1", "q2", "q3"], repetitions: 2, fetchImpl: r.fetchImpl,
    engineBudgets: { perplexity: 6, openai: 4 } });
  assert.equal(result.engine_calls.perplexity, 6, "3 questions x 2 samples per engine");
  assert.equal(result.engine_calls.openai, 4, "an engine stops at its own allowance while the other goes on");
  assert.deepEqual(result.engines_run, ["perplexity", "openai"]);
  assert.equal(result.truncated, true);
  const by = Object.fromEntries(result.by_engine.map((row) => [row.engine, row]));
  assert.equal(by.perplexity.any_rate, 1); assert.equal(by.perplexity.appearances, 6);
  assert.equal(by.openai.appearances, 0, "ChatGPT never named it"); assert.equal(by.openai.citations, 4, "but cited the domain every time");
  assert.equal(by.openai.any_rate, 1, "a citation counts as an appearance");
  assert.deepEqual(by.openai.interval, wilsonInterval(4, 4));
  assert.equal(by.openai.small_sample, true);
  assert.equal(result.combined.n, 10); assert.equal(result.combined.appeared, 10); assert.equal(result.combined.named, 6); assert.equal(result.combined.cited, 4);
  assert.equal(result.combined.appearance_rate, 1);
  assert.equal(result.appearance_rate, 0.6, "the original named-only rate keeps its meaning");
  assert.ok(result.samples.find((s) => s.engine === "openai").sources[0].title === "栞", "source titles are kept as evidence");

  // No mention at all from either engine: 0, with an interval.
  const silent = await measureSov(ALL_KEYS, profile, { questions: ["q1", "q2"], fetchImpl: recorder((url) => url.includes("openai")
    ? json(openAiBody({ text: "青山ロースター。" })) : json(perplexityBody({ text: "青山ロースター。" }))).fetchImpl });
  assert.equal(silent.combined.appearance_rate, 0); assert.deepEqual(silent.combined.interval, wilsonInterval(0, 4));

  // Provider quota stops that engine for the rest of the run; the other goes on.
  const q = engineFetch({ openaiQuota: true });
  const quota = await measureSov(ALL_KEYS, profile, { questions: ["q1", "q2", "q3"], repetitions: 2, fetchImpl: q.fetchImpl });
  assert.equal(q.calls.filter((c) => c.url.includes("openai")).length, 1, "one quota error, no further ChatGPT calls");
  assert.equal(quota.engine_stops.openai, "openai_quota_exhausted");
  assert.equal(quota.engine_calls.perplexity, 6);
  assert.equal(quota.by_engine.find((row) => row.engine === "openai").answers, 0, "a quota failure is not a 0% answer");
}

/* ---------------- Wilson interval ---------------- */
{
  assert.equal(wilsonInterval(0, 0), null);
  assert.deepEqual(wilsonInterval(0, 10), { low: 0, high: 0.278, level: 0.95 });
  assert.deepEqual(wilsonInterval(5, 10), { low: 0.237, high: 0.763, level: 0.95 });
  assert.deepEqual(wilsonInterval(10, 10), { low: 0.722, high: 1, level: 0.95 });
  assert.deepEqual(wilsonInterval(1, 20), { low: 0.009, high: 0.236, level: 0.95 });
  assert.deepEqual(wilsonInterval(30, 100), { low: 0.219, high: 0.396, level: 0.95 });
  assert.equal(wilsonInterval(3, 2), null, "k > n is rejected");
  assert.equal(SMALL_SAMPLE_N, 20);
  const agg = aggregateSov(Array.from({ length: 20 }, (_, i) => ({ ok: true, engine: "openai", mentioned: i < 4, cited: i >= 18, competitorHosts: [] })), profile);
  assert.equal(agg.combined.small_sample, false, "n=20 is no longer reference-only");
  assert.deepEqual(agg.combined.interval, wilsonInterval(6, 20));
}

/* ---------------- SQLite with the real migrations ---------------- */
function sqliteDb({ withEngineUsage = true } = {}) {
  const sqlite = new DatabaseSync(":memory:");
  const files = ["0018_aeo_sov.sql", "0022_sov_engine_split.sql", "0031_pro_measurement.sql", "0034_sov_evidence_usage.sql", ...(withEngineUsage ? ["0041_sov_engine_usage.sql"] : [])];
  for (const file of files) sqlite.exec(readFileSync(new URL(`../nurevo-impl/db/${file}`, import.meta.url), "utf8"));
  if (withEngineUsage) sqlite.exec(readFileSync(new URL("../nurevo-impl/db/0041_sov_engine_usage.sql", import.meta.url), "utf8")); // re-applying is harmless
  sqlite.exec(`CREATE TABLE aeo_scores(site_id TEXT,scanned_at TEXT,ruleset_version INTEGER,delivered_ruleset_version INTEGER,score_model_version TEXT);
    CREATE TABLE aeo_learning_observations(run_id TEXT PRIMARY KEY,site_id TEXT,measured_at TEXT,score_scanned_at TEXT,scoring_ruleset_version INTEGER,delivered_ruleset_version INTEGER,model_version TEXT,measurement_json TEXT);`);
  const DB = {
    sqlite,
    prepare(sql) { return { bind(...args) { const run = () => sqlite.prepare(sql); return {
      async first() { return run().get(...args) || null; }, async all() { return { results: run().all(...args) }; }, async run() { return { meta: run().run(...args) }; },
    }; } }; },
    async batch(statements) { sqlite.exec("BEGIN"); try { for (const s of statements) await s.run(); sqlite.exec("COMMIT"); } catch (e) { sqlite.exec("ROLLBACK"); throw e; } },
  };
  return DB;
}

/* ---------------- caps ---------------- */
{
  const DB = sqliteDb();
  const env = { DB, ...ALL_KEYS };
  assert.deepEqual(engineCaps({}, "openai"), { site: 120, global: 3000 }, "conservative defaults");
  assert.deepEqual(engineCaps({ SOV_OPENAI_SITE_MONTHLY_CAP: "50", SOV_OPENAI_GLOBAL_MONTHLY_CAP: "900" }, "openai"), { site: 50, global: 900 }, "env overrides");
  assert.deepEqual(engineCaps({ SOV_PERPLEXITY_SITE_MONTHLY_CAP: "5" }, "perplexity").site, 200, "Perplexity's per-site cap stays the original constant");
  assert.equal(engineCaps({ SOV_OPENAI_SITE_MONTHLY_CAP: "abc" }, "openai").site, 120, "a malformed override falls back to the default");

  let plans = await planEngineBudgets(env, "s1", { perRunMax: 40, perplexitySite: { used: 0 } });
  assert.deepEqual(plans.map((p) => [p.engine, p.status, p.allowance]), [["perplexity", "ready", 40], ["openai", "ready", 40]]);

  await recordEngineUsage(env, "s1", "openai", { calls: 115, estCostUsd: 1.5, searches: 115 });
  plans = await planEngineBudgets(env, "s1", { perRunMax: 40, perplexitySite: { used: 0 } });
  assert.equal(plans.find((p) => p.engine === "openai").allowance, 5, "only what remains under the site cap");
  await recordEngineUsage(env, "s1", "openai", { calls: 5 });
  plans = await planEngineBudgets(env, "s1", { perRunMax: 40, perplexitySite: { used: 0 } });
  assert.deepEqual([plans[1].status, plans[1].scope], ["quota_reached", "site"]);
  assert.equal((await readEngineUsage(env, GLOBAL_SCOPE, "openai")).calls, 120, "the global row follows every site");

  await recordEngineUsage(env, "s2", "openai", { calls: 2880, searches: 2880, estCostUsd: 30 });
  plans = await planEngineBudgets(env, "s3", { perRunMax: 40, perplexitySite: { used: 0 } });
  assert.deepEqual([plans[1].status, plans[1].scope], ["quota_reached", "global"], "other sites' use counts toward the global cap");

  plans = await planEngineBudgets({ ...env, SOV_PERPLEXITY_GLOBAL_MONTHLY_CAP: "0" }, "s3", { perRunMax: 40, perplexitySite: { used: 0 } });
  assert.equal(plans[0].status, "disabled", "a cap of 0 switches an engine off without removing its key");
  plans = await planEngineBudgets(env, "s3", { perRunMax: 40, perplexitySite: { used: 200 } });
  assert.deepEqual([plans[0].status, plans[0].scope], ["quota_reached", "site"], "Perplexity's original counter still decides its site cap");
  plans = await planEngineBudgets({ DB }, "s1", { perRunMax: 40 });
  assert.ok(plans.every((p) => p.status === "not_configured"), "no keys: every engine is not configured, never an error");

  const summary = await monthlyCostSummary(env);
  assert.equal(summary.openai.calls, 3000); assert.equal(summary.openai.est_usd, 31.5);

  // Without 0041 ChatGPT is not run (its caps could not hold); Perplexity still is.
  const bare = { DB: sqliteDb({ withEngineUsage: false }), ...ALL_KEYS };
  plans = await planEngineBudgets(bare, "s1", { perRunMax: 40, perplexitySite: { used: 0 } });
  assert.deepEqual(plans.map((p) => p.status), ["ready", "migration_pending"]);
  assert.equal(await monthlyCostSummary(bare), null);
}

/* ---------------- report: per engine, engine-specific trends ---------------- */
{
  const DB = sqliteDb();
  const env = { DB, ...ALL_KEYS };
  const site = { id: "rep", url: "https://shiori-coffee.jp" };
  const config = await saveQuerySet(env, site.id, { questions: ["q1", "q2"], repetitions: 2, competitors: [] });
  const t0 = Date.now() - 10000;
  // A Perplexity-only run, as every run before this change was.
  const before = await measureSov({ PERPLEXITY_API_KEY: "pk" }, profile, { questions: config.questions, repetitions: 2, fetchImpl: engineFetch().fetchImpl });
  await storeSovRun(env, site.id, { ...before, query_set: config, cache_key: "k1", engines_run: undefined }, { now: t0 });
  // Then both engines.
  const after = await measureSov(ALL_KEYS, profile, { questions: config.questions, repetitions: 2, fetchImpl: engineFetch().fetchImpl });
  await storeSovRun(env, site.id, { ...after, query_set: config, cache_key: "k2" }, { now: t0 + 1000 });

  const report = await loadProReport(env, site);
  const rows = Object.fromEntries(report.engines.map((row) => [row.engine, row]));
  assert.deepEqual(report.engines.map((row) => row.label), ["Perplexity", "ChatGPT"], "Gemini has no row: it is not measured");
  assert.equal(rows.perplexity.n, 4); assert.equal(rows.perplexity.named, 4); assert.equal(rows.perplexity.appearance_rate, 1);
  assert.equal(rows.openai.named, 0); assert.equal(rows.openai.cited, 4); assert.equal(rows.openai.appearance_rate, 1, "cited only is an appearance");
  assert.equal(rows.openai.named_rate, 0); assert.equal(rows.openai.cited_rate, 1, "named and cited are reported separately");
  assert.deepEqual(rows.openai.interval, wilsonInterval(4, 4));
  assert.equal(rows.openai.note, "n が少ないため参考値", "n < 20 is marked as reference only");
  assert.equal(rows.perplexity.status, "measured"); assert.ok(rows.perplexity.last_run_at);
  assert.equal(rows.openai.usage.site_cap, 120);
  // Trends never mix engines: Perplexity continues across the change, ChatGPT
  // starts with the first run that asked it, and the combined series (keyed on
  // the engine set) starts again.
  assert.equal(rows.perplexity.trend.length, 2, "Perplexity's history continues");
  assert.equal(rows.openai.trend.length, 1);
  assert.equal(report.trend.length, 1, "the combined series restarts when the engine set changes");
  assert.equal(report.combined.n, 8); assert.equal(report.combined.appeared, 8);
  assert.deepEqual(report.combined.engines, ["openai", "perplexity"]);
  assert.equal(trendKey(config, ["perplexity"]), trendKey(config), "a Perplexity-only key is the key earlier runs had");
  assert.notEqual(trendKey(config, ["openai"]), trendKey(config, ["perplexity"]));

  const english = await loadProReport(env, site, { lang: "en" });
  assert.equal(english.engines[1].note, "Small n: for reference only");

  // Not configured: shown as such, never an error.
  const unkeyed = await loadProReport({ DB, PERPLEXITY_API_KEY: "pk" }, site);
  assert.equal(unkeyed.engines.find((r) => r.engine === "openai").status, "not_configured");
  // Site cap reached: shown, with the last measurement still dated.
  await recordEngineUsage(env, site.id, "openai", { calls: 120 });
  const capped = await loadProReport(env, site);
  const gpt = capped.engines.find((r) => r.engine === "openai");
  assert.equal(gpt.status, "quota_reached"); assert.equal(gpt.quota_scope, "site"); assert.equal(gpt.n, 4);

  // A report built from no data at all.
  const empty = buildProReport({ site, configured: true, configuredIds: ["perplexity"] });
  assert.equal(empty.engines[0].status, "no_data"); assert.equal(empty.engines[0].appearance_rate, null);
  assert.equal(empty.combined, null);
}

/* ---------------- end to end through the API ---------------- */
{
  const SITE = { id: "e2e", org_id: "o", url: "shiori-coffee.jp", website_uri: "https://shiori-coffee.jp", plan: "pro", delivery_status: "active", created_at: "2026-01-01" };
  const PAGE = '<!doctype html><html><head><script type="application/ld+json">{"@type":"CafeOrCoffeeShop","name":"栞珈琲","additionalType":"カフェ","address":{"addressLocality":"渋谷区"}}</script></head><body></body></html>';
  const base = sqliteDb();
  const DB = {
    prepare(sql) {
      if (/FROM sessions/.test(sql)) return fixed({ member_id: "m", org_id: "o", email: "e@x.test", role: "admin", status: "active", expires_at: Date.now() + 3.6e6 });
      if (/FROM sites WHERE id/.test(sql)) return fixed(SITE);
      if (/FROM sites s/.test(sql)) return fixed(null, [SITE]);
      if (/aeo_sov_|aeo_scores|aeo_learning_observations/.test(sql)) return base.prepare(sql);
      return fixed(null);
    },
    batch: (statements) => base.batch(statements),
  };
  function fixed(row, rows = []) { const s = { bind: () => s, async first() { return row; }, async all() { return { results: rows }; }, async run() { return { meta: { changes: 1 } }; } }; return s; }
  let engineCalls = { perplexity: 0, openai: 0, other: 0 };
  const logs = [];
  const realLog = console.log;
  globalThis.fetch = async (input, init = {}) => {
    const href = typeof input === "string" ? input : input.url;
    if (href.includes("api.perplexity.ai")) { engineCalls.perplexity += 1; return json(perplexityBody({ text: "栞珈琲", urls: [] })); }
    if (href.includes("api.openai.com")) { engineCalls.openai += 1; return json(openAiBody({ text: "x", citations: [{ url: "https://shiori-coffee.jp/" }] })); }
    if (href.includes("googleapis.com")) { engineCalls.other += 1; return json({}); }
    if (init.method === "HEAD") return new Response(null, { status: 200 });
    return new Response(PAGE, { status: 200, headers: { "content-type": "text/html" } });
  };
  const SECRETS = { PERPLEXITY_API_KEY: "E2E-SECRET-PPLX", OPENAI_API_KEY: "E2E-SECRET-OPENAI", GEMINI_API_KEY: "E2E-SECRET-GEMINI" };
  const env = { DB, ...SECRETS, SOV_OPENAI_SITE_MONTHLY_CAP: "4", WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp" };
  console.log = (...args) => { logs.push(args.join(" ")); };
  let batch;
  try { batch = await runSovDailyBatch(env, { now: Date.now() }); } finally { console.log = realLog; }
  assert.equal(batch.measured, 1);
  assert.deepEqual(engineCalls, { perplexity: 10, openai: 4, other: 0 }, "5 questions x 2 samples; ChatGPT stops at its site cap of 4; Google is never called");
  assert.equal((await readEngineUsage(env, "e2e", "openai")).calls, 4, "reserved calls are trued up to what was issued");
  assert.equal((await readEngineUsage(env, GLOBAL_SCOPE, "perplexity")).calls, 10, "Perplexity is counted toward its global cap too");
  assert.equal((await DB.prepare("SELECT queries_used FROM aeo_sov_usage WHERE site_id=?").bind("e2e").first()).queries_used, 10, "and its original per-site counter behaves as before");
  assert.ok(batch.est_cost_usd_month.openai.est_usd > 0, "the batch result carries this month's estimated cost");
  assert.ok(logs.some((line) => line.startsWith("sov-engine-cost")), "each run logs its estimated cost");
  assert.ok(!/E2E-SECRET/.test(logs.join("\n")), "no secret in the logs");

  // The next manual run: ChatGPT is at its cap, Perplexity is still asked.
  engineCalls = { perplexity: 0, openai: 0, other: 0 };
  base.sqlite.exec("UPDATE aeo_sov_runs SET ran_at='2026-01-01T00:00:00.000Z'"); // past the 1-minute guard and cache
  console.log = () => {};
  let response;
  const errors = [];
  const realError = console.error;
  console.error = (...args) => { errors.push(args.join(" ")); };
  try {
    response = await handleApi(new Request("https://w.test/api/sites/e2e/sov", { method: "POST", headers: { cookie: `nrv_session=t; nrv_csrf=${"a".repeat(64)}`, "x-csrf-token": "a".repeat(64) } }), env, { waitUntil() {} });
  } finally { console.log = realLog; console.error = realError; }
  assert.ok(!/E2E-SECRET/.test(errors.join("\n")), "no secret in error logs");
  const body = await response.json();
  assert.ok(!JSON.stringify(body).includes("E2E-SECRET"), "no secret in the response");
  assert.equal(response.status, 200);
  assert.equal(engineCalls.openai, 0, "an engine at its cap is not called");
  assert.equal(engineCalls.perplexity, 10);
  assert.equal(body.engine_status.find((e) => e.engine === "openai").status, "quota_reached");
  const report = (await (await handleApi(new Request("https://w.test/api/sites/e2e/sov/report?lang=ja", { headers: { cookie: "nrv_session=t" } }), env, {})).json()).report;
  const gpt = report.engines.find((r) => r.engine === "openai");
  assert.equal(gpt.status, "quota_reached", "the report shows the cap");
  assert.equal(gpt.n, 4, "with ChatGPT's last measurement");
  assert.equal(report.engines.find((r) => r.engine === "perplexity").n, 10);
  const status = await (await handleApi(new Request("https://w.test/api/sites/e2e/sov", { headers: { cookie: "nrv_session=t" } }), env, {})).json();
  assert.equal(status.engine_budgets.find((e) => e.engine === "openai").site.used, 4);
  assert.equal(status.engine_budgets.find((e) => e.engine === "perplexity").site.used, 20);
  assert.equal(status.limits.engines_per_run, 2);
}

/* ---------------- raw mentions, prices ---------------- */
{
  assert.deepEqual(extractBusinessMentions("おすすめは以下です。\n- **カフェA**：駅近\n- カフェB（老舗）\n「喫茶C」も人気 [1]"), ["カフェA", "喫茶C", "カフェB"]);
  assert.ok(ENGINE_PRICING.sources.every((url) => url.startsWith("https://")), "every price has its source URL");
}

console.log("SoV multi-engine tests passed (ChatGPT web search, Perplexity, Gemini excluded, Wilson, caps, trends, end to end)");
