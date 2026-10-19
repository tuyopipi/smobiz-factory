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
const profile = { name: "Nurevo", domain: "nurevo.jp", hosts: ["nurevo.jp"], aliases: ["Nurevo"] };
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
