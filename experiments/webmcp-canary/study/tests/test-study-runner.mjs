import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { planTasks, readJsonl, runMeasurements, quotaDay, studyProfile } from "../lib/runner.mjs";
import { EngineError, buildMeasure, geminiEngine, parseGeminiResponse, stubEngine } from "../lib/engines.mjs";
import { buildStudyQuestions } from "../lib/questions.mjs";
import { scoreSite } from "../lib/scorer.mjs";
import { diagnoseAeoUrl } from "../../worker/aeo-score.mjs";
import { INITIAL_AEO_RULESET } from "../../worker/aeo-rules.mjs";
import { main } from "../run-study.mjs";

const tmp = () => mkdtempSync(join(tmpdir(), "aeo-study-"));
const biz = (id, extra = {}) => ({ id, name: `テスト歯科${id}`, aliases: "", category: "歯科", service_term: "歯医者", city: "大阪", ward: "大阪市北区", area: "梅田", url: `https://${id}.example.jp/`, ...extra });
const sample = [biz("a"), biz("b"), biz("c", { area: "中崎町" })];

/* ---------------- questions & plan ---------------- */
{
  const qs = buildStudyQuestions(sample[0]);
  assert.equal(qs.filter((q) => q.kind === "discovery").length, 3);
  assert.equal(qs.filter((q) => q.kind === "branded").length, 1);
  assert.ok(qs.filter((q) => q.kind === "discovery").every((q) => !q.text.includes(sample[0].name)), "discovery questions never name the business");
  assert.ok(qs.find((q) => q.kind === "branded").text.includes(sample[0].name), "branded question names it");

  const tasks = planTasks({ businesses: sample, engines: ["stub"], repeats: 2 });
  // a and b share all discovery questions; c shares only the ward-level one.
  // unique texts: a/b d1,d3 (2) + c d1,d3 (2) + shared d2 (1) + 3 branded = 8
  assert.equal(tasks.length, 8 * 2, "shared discovery questions are asked once per repeat");
  assert.equal(tasks.find((t) => t.question.qid === "d2").businesses.length, 3, "ward question is shared by all three");
  assert.ok(tasks.slice(0, 8).every((t) => t.repeat === 1), "repeat-major order: every question once before any repeat");
}

/* ---------------- full run, resume, no duplicates ---------------- */
{
  const dir = tmp();
  const cachePath = join(dir, "m.jsonl"), ledgerPath = join(dir, "l.jsonl");
  let n = 0;
  const base = stubEngine();
  const measure = (engine, q, b, ctx) => { n += 1; return base(q, b, ctx); };
  const first = await runMeasurements({ businesses: sample, engines: ["stub"], repeats: 3, measure, cachePath, ledgerPath, maxCalls: 5 });
  assert.equal(first.calls, 5);
  assert.equal(first.stop.reason, "max_calls", "--max-calls stops the run");
  const second = await runMeasurements({ businesses: sample, engines: ["stub"], repeats: 3, measure, cachePath, ledgerPath });
  assert.equal(second.skipped, 5, "resume skips finished tasks");
  assert.equal(second.calls, 24 - 5);
  assert.equal(n, 24, "every task asked exactly once across two runs");
  const third = await runMeasurements({ businesses: sample, engines: ["stub"], repeats: 3, measure, cachePath, ledgerPath });
  assert.equal(third.calls, 0, "a finished study makes no calls");
  const keys = readJsonl(cachePath).map((r) => r.key);
  assert.equal(new Set(keys).size, keys.length, "no duplicate cache entries");
  const rec = readJsonl(cachePath)[0];
  assert.ok(rec.results && typeof rec.results[rec.kind === "branded" ? Object.keys(rec.results)[0] : "a"]?.mentioned === "boolean");
  assert.equal(rec.excerpt, undefined, "default store mode keeps no answer text");
}

/* ---------------- budget caps via ledger ---------------- */
{
  const dir = tmp();
  const opts = { businesses: sample, engines: ["stub"], repeats: 3, measure: (e, q, b, c) => stubEngine()(q, b, c), cachePath: join(dir, "m.jsonl"), ledgerPath: join(dir, "l.jsonl"), maxTotalCalls: 7 };
  const a = await runMeasurements(opts);
  assert.equal(a.calls, 7);
  assert.equal(a.stop.reason, "max_total_calls");
  const b = await runMeasurements(opts);
  assert.equal(b.calls, 0, "total cap holds across invocations");
  assert.equal(readJsonl(opts.ledgerPath).length, 7, "ledger records every attempted call");
}

/* ---------------- per-day cap, Pacific day ---------------- */
{
  const dir = tmp();
  let clock = new Date("2026-10-23T12:00:00Z");
  const opts = { businesses: sample, engines: ["stub"], repeats: 1, measure: (e, q, b, c) => stubEngine()(q, b, c), cachePath: join(dir, "m.jsonl"), ledgerPath: join(dir, "l.jsonl"), maxCallsPerDay: 3, now: () => clock };
  const a = await runMeasurements(opts);
  assert.equal(a.calls, 3);
  assert.equal(a.stop.reason, "max_calls_per_day");
  const again = await runMeasurements(opts);
  assert.equal(again.calls, 0, "same day: nothing more");
  clock = new Date("2026-10-24T12:00:00Z");
  const next = await runMeasurements(opts);
  assert.equal(next.calls, 3, "next Pacific day continues");
  assert.equal(quotaDay(new Date("2026-10-24T06:00:00Z")), "2026-10-23", "quota day is Pacific time");
}

/* ---------------- hard stop on quota, retry on resume ---------------- */
{
  const dir = tmp();
  let calls = 0, failNow = true;
  const measure = (e, q, b, c) => {
    calls += 1;
    if (calls === 3 && failNow) throw new EngineError("quota_exhausted", { hardStop: true, status: 429 });
    return stubEngine()(q, b, c);
  };
  const opts = { businesses: sample, engines: ["stub"], repeats: 1, measure, cachePath: join(dir, "m.jsonl"), ledgerPath: join(dir, "l.jsonl") };
  const a = await runMeasurements(opts);
  assert.equal(a.calls, 3, "stops immediately at the 429, no retry");
  assert.equal(a.stop.reason, "quota_exhausted");
  failNow = false;
  const b = await runMeasurements(opts);
  assert.equal(b.ok, 8 - 2, "the failed task is retried on the next run");
}

/* ---------------- transient failures stop after a streak ---------------- */
{
  const dir = tmp();
  const measure = () => { throw new EngineError("gemini_http_503"); };
  const r = await runMeasurements({ businesses: sample, engines: ["stub"], repeats: 1, measure, cachePath: join(dir, "m.jsonl"), ledgerPath: join(dir, "l.jsonl"), maxConsecutiveFailures: 3 });
  assert.equal(r.calls, 3);
  assert.equal(r.stop.reason, "consecutive_failures");
}

/* ---------------- mention detection uses aliases ---------------- */
{
  const p = studyProfile({ name: "梅田クローバー歯科クリニック", aliases: "梅田クローバー歯科|クローバー歯科", url: "https://www.umeda-clover.com/" });
  assert.deepEqual(p.aliases, ["梅田クローバー歯科クリニック", "梅田クローバー歯科", "クローバー歯科"]);
  assert.equal(p.host, "umeda-clover.com");
}

/* ---------------- Gemini adapter ---------------- */
{
  const geminiBody = {
    modelVersion: "gemini-2.5-flash",
    candidates: [{ content: { parts: [{ text: "梅田なら梅田クローバー歯科が人気です。" }] }, groundingMetadata: { webSearchQueries: ["梅田 歯医者"], groundingChunks: [{ web: { uri: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc", title: "umeda-clover.com" } }, { web: { uri: "https://x", title: "Some page title" } }] } }],
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20 },
  };
  const parsed = parseGeminiResponse(geminiBody);
  assert.deepEqual(parsed.citations, [{ url: "https://umeda-clover.com/", title: "umeda-clover.com" }], "domain titles become source URLs; redirect links are not followed");
  let seen;
  const fakeFetch = async (url, init) => { seen = { url, init }; return new Response(JSON.stringify(geminiBody), { status: 200 }); };
  const engine = geminiEngine({ apiKey: "SECRET-KEY-123", model: "gemini-2.5-flash", fetchImpl: fakeFetch });
  await engine({ text: "梅田で歯医者のおすすめを教えてください。" });
  assert.ok(!seen.url.includes("SECRET"), "key is not in the URL");
  assert.equal(seen.init.headers["x-goog-api-key"], "SECRET-KEY-123");
  assert.deepEqual(JSON.parse(seen.init.body).tools, [{ google_search: {} }], "grounding requested");

  for (const [status, body, code] of [[429, '{"error":{"status":"RESOURCE_EXHAUSTED"}}', "quota_exhausted"], [403, '{"error":{"status":"PERMISSION_DENIED"}}', "key_rejected"], [400, '{"error":{"message":"Billing account required"}}', "billing_issue"]]) {
    const failing = geminiEngine({ apiKey: "k", model: "gemini-2.5-flash", fetchImpl: async () => new Response(body, { status }) });
    await assert.rejects(failing({ text: "q" }), (e) => e.code === code && e.hardStop === true, `${status} is a hard stop`);
  }
  const flaky = geminiEngine({ apiKey: "k", model: "gemini-2.5-flash", fetchImpl: async () => new Response("oops", { status: 503 }) });
  await assert.rejects(flaky({ text: "q" }), (e) => e.hardStop === false, "5xx is transient");
}

/* ---------------- free-only policy ---------------- */
{
  assert.throws(() => buildMeasure({ engines: ["perplexity"], env: { PERPLEXITY_API_KEY: "x" } }), /paid API/);
  assert.throws(() => buildMeasure({ engines: ["openai"], env: { OPENAI_API_KEY: "x" } }), /paid API/);
  assert.throws(() => buildMeasure({ engines: ["gemini"], env: { GEMINI_API_KEY: "x" }, models: { gemini: "gemini-3-flash-preview" } }), /free-tier list/);
  assert.throws(() => buildMeasure({ engines: ["gemini"], env: {} }), /GEMINI_API_KEY is not set/);
  assert.doesNotThrow(() => buildMeasure({ engines: ["perplexity"], env: { PERPLEXITY_API_KEY: "x" }, freeOnly: false }));
  assert.throws(() => buildMeasure({ engines: ["custom"], env: {}, external: () => async () => ({}) }), /not known to be free/, "external engines need --allow-paid");
}

/* ---------------- CLI end to end with a fake Gemini; key never written ---------------- */
{
  const dir = tmp();
  const { writeFileSync } = await import("node:fs");
  const samplePath = join(dir, "sample.csv");
  writeFileSync(samplePath, "id,name,aliases,category,service_term,city,ward,area,url\na,梅田クローバー歯科クリニック,梅田クローバー歯科,歯科,歯医者,大阪,大阪市北区,梅田,https://www.umeda-clover.com/\n");
  const body = { candidates: [{ content: { parts: [{ text: "梅田クローバー歯科がおすすめです。" }] }, groundingMetadata: { webSearchQueries: ["q"], groundingChunks: [{ web: { uri: "https://r", title: "umeda-clover.com" } }] } }] };
  const lines = [];
  const env = { GEMINI_API_KEY: "TOPSECRET-gemini-key" };
  const common = ["--sample", samplePath, "--out", dir, "--min-interval-ms", "0", "--repeats", "1"];
  const refused = await main(["measure", ...common], { env, stdout: (l) => lines.push(l), fetchImpl: async () => new Response(JSON.stringify(body)) });
  assert.equal(refused, 2, "grounded Gemini needs --ack-grounding-terms");
  const code = await main(["measure", ...common, "--ack-grounding-terms"], { env, stdout: (l) => lines.push(l), fetchImpl: async () => new Response(JSON.stringify(body)) });
  assert.equal(code, 0);
  const rows = readJsonl(join(dir, "measurements.jsonl"));
  assert.equal(rows.length, 4);
  assert.ok(rows.every((r) => r.results.a.mentioned && r.results.a.cited));
  for (const f of ["measurements.jsonl", "calls-ledger.jsonl"]) assert.ok(!readFileSync(join(dir, f), "utf8").includes("TOPSECRET"), `${f} never contains the key`);
  assert.ok(!lines.join("\n").includes("TOPSECRET"), "stdout never contains the key");
  const quota = await main(["measure", ...common, "--ack-grounding-terms", "--repeats", "2"], { env, stdout: () => {}, fetchImpl: async () => new Response('{"error":{"status":"RESOURCE_EXHAUSTED"}}', { status: 429 }) });
  assert.equal(quota, 3, "a quota error exits non-zero");
  const paid = await main(["measure", ...common, "--engines", "perplexity"], { env: { PERPLEXITY_API_KEY: "x" }, stdout: () => {} });
  assert.equal(paid, 2, "paid engines refused by default");
}

/* ---------------- scorer matches /api/aeo/score and recovers components ---------------- */
{
  const html = `<!doctype html><html><head><title>テスト歯科</title><script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "Dentist", name: "テスト歯科", url: "https://t.example.jp/", telephone: "06-0000-0000", address: { "@type": "PostalAddress", streetAddress: "梅田1-1", addressLocality: "大阪市北区", postalCode: "530-0001", addressRegion: "大阪府", addressCountry: "JP" }, openingHours: "Mo-Fr 09:00-18:00" })}</script></head><body><h1>テスト歯科</h1><h2>診療時間</h2><p>${"大阪市北区梅田の歯科医院です。営業時間 9:00-18:00 電話 06-0000-0000 住所 〒530-0001 ".repeat(10)}</p></body></html>`;
  const fetchImpl = async (href, init = {}) => {
    const u = new URL(href);
    if ((init.method || "GET") === "HEAD") return new Response(null, { status: 200 });
    if (u.pathname === "/robots.txt") return new Response("User-agent: *\nAllow: /\n");
    if (u.pathname === "/llms.txt") return new Response("not found", { status: 404 });
    return new Response(html, { headers: { "content-type": "text/html" } });
  };
  const row = await scoreSite("https://t.example.jp/", { fetchImpl });
  const api = await diagnoseAeoUrl("https://t.example.jp/", { fetchImpl, schemaRules: INITIAL_AEO_RULESET.definition.schema, scoring: INITIAL_AEO_RULESET.definition.scoring, rulesetVersion: 1 });
  assert.equal(row.score, api.score, "same total as the public endpoint's code path");
  assert.equal(row.consistent_with_api, true);
  const sum = row.pts_schema + row.pts_coverage + row.pts_legibility + row.pts_llms + row.pts_consistency;
  assert.equal(Math.round(sum), row.raw_score, "component points add up to the raw score");
  assert.equal(row.st_llms, "BAD", "missing llms.txt is reflected");
  assert.equal(row.gate_passed, true);
}

console.log("study runner tests passed");
