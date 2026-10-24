/**
 * Writes aeo-local.golden.json: the scorer's output for every case in
 * aeo-local-fixtures.mjs. Run once, against the scorer as it was before site
 * types existed; scripts/test-site-types.mjs compares the current scorer with it.
 *
 *   node scripts/fixtures/generate-aeo-local-golden.mjs
 */
import { writeFileSync } from "node:fs";
import { LOCAL_FIXTURES } from "./aeo-local-fixtures.mjs";
import { extractAeoSignals, scoreAeo, buildAeoChecks } from "../../worker/aeo-score.mjs";

export function snapshot(signals) {
  const result = scoreAeo(signals);
  return {
    score: result.score,
    band: result.band,
    gatePassed: result.gatePassed,
    statuses: result.statuses,
    metrics: result.metrics,
    schemaFields: signals.schemaFields,
    publishedProps: signals.publishedProps,
    llmsTxtQuality: signals.llmsTxtQuality,
    factsInText: signals.factsInText,
    checks: buildAeoChecks(signals, result, "ja").map((check) => ({ id: check.id, status: check.status, label: check.label, message: check.message })),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const golden = Object.fromEntries(LOCAL_FIXTURES.map((fixture) => [fixture.id,
    snapshot(extractAeoSignals(fixture.html, fixture.robots, fixture.llms, fixture.options))]));
  writeFileSync(new URL("./aeo-local.golden.json", import.meta.url), JSON.stringify(golden, null, 1) + "\n");
  console.log(`wrote ${Object.keys(golden).length} golden diagnoses`);
}
