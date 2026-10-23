import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ledgerTotals, planTasks, readJsonl, runMeasurements, studyProfile } from "../lib/runner.mjs";
import { EngineError, ENGINE_INFO, buildMeasure, classifyAdapterError, perCallCeilingUsd, perplexityEngine, stubEngine } from "../lib/engines.mjs";
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

/* ---------------- call cap is cumulative across invocations (ledger) ---------------- */
{
  const dir = tmp();
  const opts = { businesses: sample, engines: ["stub"], repeats: 3, measure: (e, q, b, c) => stubEngine()(q, b, c), cachePath: join(dir, "m.jsonl"), ledgerPath: join(dir, "l.jsonl"), maxCalls: 7 };
  const a = await runMeasurements(opts);
  assert.equal(a.calls, 7);
  assert.equal(a.stop.reason, "max_calls");
  const b = await runMeasurements(opts);
  assert.equal(b.calls, 0, "call cap holds across invocations");
  assert.equal(ledgerTotals(readJsonl(opts.ledgerPath)).calls, 7, "ledger records every attempted call");
}

/* ---------------- USD cap: reserve the ceiling, never cross the cap ---------------- */
{
  const ceiling = perCallCeilingUsd("perplexity");
  // 1 Fast Search ($1/1000) + 8,000 in x $0.20/M + 500 out x $1.00/M (priority tier)
  assert.equal(ceiling, 0.0031, "per-call ceiling comes from the adapter's price table");
  const dir = tmp();
  let n = 0;
  // List-price estimate below the ceiling: the reservation is kept (estimates may only raise it).
  const measure = async () => { n += 1; return { answer: "回答", citations: [], cost: { est_usd: 0.0012, basis: "list_price" } }; };
  const opts = { businesses: sample, engines: ["perplexity"], repeats: 3, measure, cachePath: join(dir, "m.jsonl"), ledgerPath: join(dir, "l.jsonl"), maxUsd: 0.01, perCallUsd: () => ceiling };
  const a = await runMeasurements(opts);
  assert.equal(a.calls, 3, "0.0031 x 3 = 0.0093; a 4th call could reach 0.0124 > 0.01");
  assert.equal(a.stop.reason, "max_usd");
  assert.ok(a.usd_total <= 0.01);
  const b = await runMeasurements(opts);
  assert.equal(b.calls, 0, "USD cap holds across invocations");

  // A provider-reported cost replaces the reservation, so the cap counts real spend.
  const dir2 = tmp();
  const reported = async () => ({ answer: "回答", citations: [], cost: { est_usd: 0.002, basis: "provider_reported" } });
  const c = await runMeasurements({ ...opts, measure: reported, cachePath: join(dir2, "m.jsonl"), ledgerPath: join(dir2, "l.jsonl") });
  assert.equal(c.calls, 4, "0.002 x 4 = 0.008, + 0.0031 reserve > 0.01 stops before the 5th");
  assert.equal(c.usd_total, 0.008);
  assert.equal(readJsonl(join(dir2, "m.jsonl"))[0].est_usd, 0.002, "cost kept on each record");

  // A failed call keeps its full reservation (it may have been billed).
  const dir3 = tmp();
  const failing = async () => { throw new EngineError("perplexity_http_503"); };
  const d = await runMeasurements({ ...opts, measure: failing, maxUsd: 1, cachePath: join(dir3, "m.jsonl"), ledgerPath: join(dir3, "l.jsonl") });
  assert.equal(d.stop.reason, "consecutive_failures", "transient failures stop after a short streak (default 3)");
  assert.equal(d.calls, 3);
  assert.equal(d.usd_total, 0.0093);

  // A call far above the ceiling means the estimate is wrong: stop.
  const dir4 = tmp();
  const pricey = async () => ({ answer: "回答", citations: [], cost: { est_usd: 0.05, basis: "provider_reported" } });
  const e = await runMeasurements({ ...opts, measure: pricey, maxUsd: 1, cachePath: join(dir4, "m.jsonl"), ledgerPath: join(dir4, "l.jsonl") });
  assert.equal(e.calls, 1);
  assert.equal(e.stop.reason, "cost_above_estimate");
}

/* ---------------- hard stop on 429, retry on resume ---------------- */
{
  const dir = tmp();
  let calls = 0, failNow = true;
  const measure = (e, q, b, c) => {
    calls += 1;
    if (calls === 3 && failNow) throw new EngineError("rate_limited_or_quota", { hardStop: true, status: 429 });
    return stubEngine()(q, b, c);
  };
  const opts = { businesses: sample, engines: ["stub"], repeats: 1, measure, cachePath: join(dir, "m.jsonl"), ledgerPath: join(dir, "l.jsonl") };
  const a = await runMeasurements(opts);
  assert.equal(a.calls, 3, "stops immediately at the 429, no retry");
  assert.equal(a.stop.reason, "rate_limited_or_quota");
  failNow = false;
  const b = await runMeasurements(opts);
  assert.equal(b.ok, 8 - 2, "the failed task is retried on the next run");
}

/* ---------------- mention detection uses aliases ---------------- */
{
  const p = studyProfile({ name: "梅田クローバー歯科クリニック", aliases: "梅田クローバー歯科|クローバー歯科", url: "https://www.umeda-clover.com/" });
  assert.deepEqual(p.aliases, ["梅田クローバー歯科クリニック", "梅田クローバー歯科", "クローバー歯科"]);
  assert.equal(p.host, "umeda-clover.com");
}

/* ---------------- Perplexity adapter (the Pro product's probePerplexity) ---------------- */
const agentBody = (text, urls = [], extra = {}) => ({
  model: "openai/gpt-6-luna", status: "completed",
  output: [{ type: "search_results", results: urls.map((url) => ({ url })) }, { type: "message", content: [{ type: "output_text", text }] }],
  usage: { input_tokens: 3000, output_tokens: 300, ...extra },
});
{
  let seen;
  const fakeFetch = async (url, init) => { seen = { url, init }; return new Response(JSON.stringify(agentBody("梅田なら梅田クローバー歯科が人気です。", ["https://www.umeda-clover.com/access/"]))); };
  const engine = perplexityEngine({ apiKey: "pplx-SECRETKEY12345", fetchImpl: fakeFetch });
  const probe = await engine({ text: "梅田で歯医者のおすすめを教えてください。" });
  assert.equal(seen.url, "https://api.perplexity.ai/v1/agent", "Agent API endpoint");
  assert.ok(!seen.url.includes("SECRET"), "key is not in the URL");
  assert.equal(seen.init.headers.authorization, "Bearer pplx-SECRETKEY12345", "key only in the Authorization header");
  assert.equal(JSON.parse(seen.init.body).preset, "fast", "preset fast, as in the product");
  assert.deepEqual(probe.citations, ["https://www.umeda-clover.com/access/"]);
  // 1 search ($0.001) + 3000 x 0.20/M + 300 x 1.00/M = 0.0019
  assert.equal(probe.cost.est_usd, 0.0019);
  assert.equal(ENGINE_INFO.perplexity.model, "preset:fast");

  // A shell PERPLEXITY_PRESET / PERPLEXITY_API_URL cannot change what is measured.
  const measure = buildMeasure({ engines: ["perplexity"], env: { PERPLEXITY_API_KEY: "k", PERPLEXITY_PRESET: "deep-research", PERPLEXITY_API_URL: "https://evil.example/" }, fetchImpl: fakeFetch });
  await measure("perplexity", { text: "q" }, {}, {});
  assert.equal(JSON.parse(seen.init.body).preset, "fast");
  assert.equal(seen.url, "https://api.perplexity.ai/v1/agent");

  const origError = console.error;
  console.error = () => {};
  try {
    for (const [status, body, code] of [
      [401, '{"error":"invalid api key"}', "key_rejected"],
      [403, "forbidden", "key_rejected"],
      [402, "payment required", "billing_or_credits"],
      [400, '{"error":{"message":"insufficient credits"}}', "billing_or_credits"],
      [429, '{"error":"rate limit"}', "rate_limited_or_quota"],
      [400, '{"error":"bad preset"}', "perplexity_http_400"],
    ]) {
      const failing = perplexityEngine({ apiKey: "k", fetchImpl: async () => new Response(body, { status }) });
      await assert.rejects(failing({ text: "q" }), (e) => e.code === code && e.hardStop === true, `${status} ${body} is a hard stop (${code})`);
    }
    const flaky = perplexityEngine({ apiKey: "k", fetchImpl: async () => new Response("oops", { status: 503 }) });
    await assert.rejects(flaky({ text: "q" }), (e) => e.hardStop === false, "5xx is transient");
    const timeout = perplexityEngine({ apiKey: "k", fetchImpl: async () => { throw Object.assign(new Error("aborted"), { name: "AbortError" }); } });
    await assert.rejects(timeout({ text: "q" }), (e) => e.hardStop === false, "a timeout is transient");
  } finally { console.error = origError; }
  assert.equal(classifyAdapterError({ code: "perplexity_failed" }).hardStop, false);
}

/* ---------------- engine policy ---------------- */
{
  assert.throws(() => buildMeasure({ engines: ["gemini"], env: { GEMINI_API_KEY: "x" } }), /perplexity only/);
  assert.throws(() => buildMeasure({ engines: ["openai"], env: { OPENAI_API_KEY: "x" } }), /perplexity only/);
  assert.throws(() => buildMeasure({ engines: ["perplexity"], env: {} }), /PERPLEXITY_API_KEY is not set/);
  assert.throws(() => buildMeasure({ engines: ["perplexity"], env: { PERPLEXITY_API_KEY: "  " } }), /PERPLEXITY_API_KEY is not set/);
}

/* ---------------- CLI end to end with a fake Perplexity; key never written ---------------- */
{
  const dir = tmp();
  const { writeFileSync } = await import("node:fs");
  const samplePath = join(dir, "sample.csv");
  writeFileSync(samplePath, "id,name,aliases,category,service_term,city,ward,area,url\na,梅田クローバー歯科クリニック,梅田クローバー歯科,歯科,歯医者,大阪,大阪市北区,梅田,https://www.umeda-clover.com/\n");
  const body = agentBody("梅田クローバー歯科がおすすめです。", ["https://www.umeda-clover.com/"]);
  const lines = [];
  const env = { PERPLEXITY_API_KEY: "pplx-TOPSECRETkey987654" };
  const common = ["--sample", samplePath, "--out", dir, "--min-interval-ms", "0", "--repeats", "1"];
  let fetches = 0;
  const okFetch = async () => { fetches += 1; return new Response(JSON.stringify(body)); };

  const planLines = [];
  assert.equal(await main(["plan", ...common, "--repeats", "3"], { env, stdout: (l) => planLines.push(l) }), 0);
  assert.match(planLines.join("\n"), /total calls: 12/);
  assert.match(planLines.join("\n"), /\$0\.0031 per call/);
  assert.match(planLines.join("\n"), /estimated ceiling for 12 calls: \$0\.04/);

  assert.equal(await main(["measure", ...common, "--engines", "gemini"], { env, stdout: () => {}, fetchImpl: okFetch }), 2, "gemini refused");
  assert.equal(await main(["measure", ...common], { env: {}, stdout: () => {}, fetchImpl: okFetch }), 2, "missing key refused");
  assert.equal(fetches, 0, "refusals make no calls");

  // Trial: --max-calls 2 of 4 planned.
  assert.equal(await main(["measure", ...common, "--max-calls", "2"], { env, stdout: (l) => lines.push(l), fetchImpl: okFetch }), 0);
  assert.equal(fetches, 2);
  // Full: default --max-calls = planned total (4), cumulative -> 2 more, then nothing.
  assert.equal(await main(["measure", ...common], { env, stdout: (l) => lines.push(l), fetchImpl: okFetch }), 0);
  assert.equal(fetches, 4);
  assert.equal(await main(["measure", ...common], { env, stdout: (l) => lines.push(l), fetchImpl: okFetch }), 0);
  assert.equal(fetches, 4, "a finished study makes no calls");
  const rows = readJsonl(join(dir, "measurements.jsonl"));
  assert.equal(rows.length, 4);
  assert.ok(rows.every((r) => r.results.a.mentioned && r.results.a.cited), "named and cited are both detected, as in the product");
  assert.ok(rows.every((r) => r.model === "preset:fast" && r.est_usd > 0));
  for (const f of ["measurements.jsonl", "calls-ledger.jsonl"]) assert.ok(!readFileSync(join(dir, f), "utf8").includes("TOPSECRET"), `${f} never contains the key`);
  assert.ok(!lines.join("\n").includes("TOPSECRET"), "stdout never contains the key");

  // More repeats: a 429 hard-stops with exit code 3 after exactly one call.
  let quotaCalls = 0;
  const origError = console.error;
  console.error = () => {};
  const quota = await main(["measure", ...common, "--repeats", "2"], { env, stdout: () => {}, fetchImpl: async () => { quotaCalls += 1; return new Response('{"error":"rate limit"}', { status: 429 }); } });
  console.error = origError;
  assert.equal(quota, 3, "a 429 exits non-zero");
  assert.equal(quotaCalls, 1, "no retry after a 429");

  // USD cap from the CLI: $0.005 allows one call at the $0.0031 ceiling.
  const dir2 = tmp();
  let usdCalls = 0;
  const capped = await main(["measure", "--sample", samplePath, "--out", dir2, "--min-interval-ms", "0", "--repeats", "1", "--max-usd", "0.005"], { env, stdout: () => {}, fetchImpl: async () => { usdCalls += 1; return new Response(JSON.stringify(body)); } });
  assert.equal(capped, 0);
  assert.equal(usdCalls, 1, "--max-usd stops before a call that could cross it");
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
