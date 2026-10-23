/**
 * What each engine call consumed is kept with its evidence, so the cost of a
 * measurement can be summed from what the provider reported rather than
 * estimated from list prices.
 */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { engineUsage, measureSov, storeSovRun } from "../worker/aeo-sov.mjs";

const sqlite = new DatabaseSync(":memory:");
sqlite.exec(readFileSync(new URL("../nurevo-impl/db/schema.sql", import.meta.url), "utf8"));
// As production has it: the scores table and 0032's learning observations.
for (const file of ["0014_aeo_scores.sql", "0013_aeo_rulesets.sql", "0015_aeo_ruleset_activations.sql", "0032_continuous_optimization.sql"]) {
  sqlite.exec(readFileSync(new URL(`../nurevo-impl/db/${file}`, import.meta.url), "utf8"));
}
const DB = {
  prepare(sql) {
    const wrap = (args) => ({ async first() { return sqlite.prepare(sql).get(...args) || null; }, async all() { return { results: sqlite.prepare(sql).all(...args) }; }, async run() { return { meta: sqlite.prepare(sql).run(...args) }; } });
    return { ...wrap([]), bind: (...args) => wrap(args) };
  },
  async batch(statements) { for (const s of statements) await s.run(); return []; },
};

const usage = { prompt_tokens: 31, completion_tokens: 212, total_tokens: 243, search_context_size: "low", cost: { input_tokens_cost: 0.00003, output_tokens_cost: 0.00021, request_cost: 0.005, total_cost: 0.00524 }, citations: ["not", "kept"], nested: { dropped: true } };
assert.deepEqual(engineUsage(usage), { prompt_tokens: 31, completion_tokens: 212, total_tokens: 243, search_context_size: "low", cost: { input_tokens_cost: 0.00003, output_tokens_cost: 0.00021, request_cost: 0.005, total_cost: 0.00524 } }, "numbers, short labels and the cost breakdown only");
assert.equal(engineUsage(null), null);

const fetchImpl = async () => ({ ok: true, status: 200, json: async () => ({ model: "sonar", choices: [{ message: { content: "Nurevo is an AEO tool. https://nurevo.jp/" } }], citations: ["https://nurevo.jp/"], usage }) });
const profile = { name: "Nurevo", host: "nurevo.jp", aliases: ["Nurevo"] };
const result = await measureSov({ PERPLEXITY_API_KEY: "pk" }, profile, { questions: ["What is an AEO tool for WordPress?"], engineIds: ["perplexity"], fetchImpl });
assert.equal(result.queries_used, 1);
assert.deepEqual(result.samples[0].usage.cost.total_cost, 0.00524);

const failing = await measureSov({ PERPLEXITY_API_KEY: "pk" }, profile, { questions: ["q"], engineIds: ["perplexity"], fetchImpl: async () => ({ ok: false, status: 500, json: async () => ({}) }) });
await storeSovRun({ DB }, "s1", result, { trigger: "manual" });
await storeSovRun({ DB }, "s1", failing, { trigger: "manual" });
const rows = sqlite.prepare("SELECT ok, usage_json FROM aeo_sov_evidence ORDER BY ok DESC").all();
assert.equal(JSON.parse(rows[0].usage_json).cost.total_cost, 0.00524, "the provider's own cost is stored with the evidence");
assert.equal(rows[1].usage_json, null, "a failed call records no usage");
console.log("SoV usage tests passed");

/* ---------------- a failed call says why, without leaking anything ---------------- */
{
  const { providerErrorDetail } = await import("../worker/aeo-sov.mjs");
  const html = { text: async () => `<html><head><style>x{}</style></head><body><h1>403 Forbidden</h1><p>Request blocked. Bearer pplx-ABCDEFGHIJKLMNOP1234 and key_abcdefghijk</p></body></html>` };
  const detail = await providerErrorDetail(html);
  assert.match(detail, /403 Forbidden Request blocked\./, "tags stripped, the provider's words kept");
  assert.equal(/pplx-|key_abc/.test(detail), false, "anything shaped like a key is redacted");
  assert.ok((await providerErrorDetail({ text: async () => "x".repeat(1000) })).length <= 200, "at most 200 characters");

  const body = JSON.stringify({ error: { message: "insufficient credits", type: "insufficient_quota", code: 403 } });
  const failed = await measureSov({ PERPLEXITY_API_KEY: "pplx-secretsecretsecret" }, profile, { questions: ["q"], engineIds: ["perplexity"],
    fetchImpl: async () => ({ ok: false, status: 403, text: async () => body, json: async () => JSON.parse(body) }) });
  assert.equal(failed.samples[0].error, "perplexity_http_403");
  assert.match(failed.samples[0].error_detail, /insufficient credits/);
  await storeSovRun({ DB }, "s2", failed, { trigger: "manual" });
  const row = sqlite.prepare("SELECT accuracy_json FROM aeo_sov_evidence WHERE site_id='s2'").get();
  assert.match(JSON.parse(row.accuracy_json).error_detail, /insufficient credits/, "the reason is kept with the evidence");
  assert.equal(row.accuracy_json.includes("secretsecret"), false, "the key never reaches storage");
}
console.log("SoV error detail tests passed");

/* ---------------- the Agent API: request and response ---------------- */
{
  const { parsePerplexityAgent } = await import("../worker/aeo-sov.mjs");
  const agent = {
    id: "resp_1", model: "openai/gpt-6-luna", status: "completed",
    output: [
      { type: "search_results", queries: ["aeo plugin"], results: [{ title: "Nurevo", url: "https://nurevo.jp/" }, { title: "Other", url: "https://other.example/" }] },
      { type: "message", content: [{ type: "output_text", text: "Nurevo AEO is a WordPress plugin [1]." }] },
    ],
    usage: { input_tokens: 120, output_tokens: 40, total_tokens: 160, cost: { input_cost: 0.0001, output_cost: 0.0002, total_cost: 0.0053 } },
  };
  assert.deepEqual(parsePerplexityAgent(agent), { answer: "Nurevo AEO is a WordPress plugin [1].", citations: ["https://nurevo.jp/", "https://other.example/"], model: "openai/gpt-6-luna", status: "completed" });

  let sent = null;
  const result = await measureSov({ PERPLEXITY_API_KEY: "pk" }, profile, { questions: ["Best AEO plugin?"], engineIds: ["perplexity"],
    fetchImpl: async (url, init) => { sent = { url: String(url), body: JSON.parse(init.body), auth: init.headers.authorization }; return { ok: true, status: 200, json: async () => agent }; } });
  assert.equal(sent.url, "https://api.perplexity.ai/v1/agent", "the Agent API endpoint");
  assert.equal(sent.body.preset, "fast", "the documented replacement for sonar");
  assert.equal(sent.body.input, "Best AEO plugin?");
  assert.ok(sent.body.instructions && sent.body.max_output_tokens === 500);
  assert.equal("messages" in sent.body || "model" in sent.body, false, "no chat-completions fields");
  const s = result.samples[0];
  assert.equal(s.ok, true);
  assert.equal(s.cited, true, "the site's URL among the search results counts as a citation");
  assert.equal(s.usage.cost.total_cost, 0.0053, "the provider's own cost is kept");
  assert.equal(s.engine_model, "openai/gpt-6-luna");

  const failed = await measureSov({ PERPLEXITY_API_KEY: "pk" }, profile, { questions: ["q"], engineIds: ["perplexity"],
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ status: "failed", error: { message: "upstream failed" }, output: [] }) }) });
  assert.equal(failed.samples[0].ok, false);
  assert.equal(failed.samples[0].error, "perplexity_failed");
}
console.log("Perplexity Agent API tests passed");
