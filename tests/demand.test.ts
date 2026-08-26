import assert from "node:assert/strict";
import test from "node:test";
import { DemandValidator } from "../src/demand/validator.js";
import { ProductCandidate } from "../src/types.js";

const candidate: ProductCandidate = {
  name: "Invoice Tab Cleaner",
  slug: "invoice-tab-cleaner",
  platform: "chrome",
  niche: "invoice browser workflow",
  targetUser: "freelancers",
  problem: "invoice tabs pile up",
  solution: "group and close invoice tabs",
  keywords: ["invoice tabs", "freelance workflow"],
  permissions: ["tabs", "storage"],
  monetization: { model: "freemium", expectedPriceUsd: 4 }
};

test("DemandValidator passes when search demand and profitability are strong", async () => {
  const validator = new DemandValidator(
    { async collect() { return [{ query: "invoice", extensionCount: 5, medianUsers: 1200, medianRating: 4.1, medianReviewCount: 80 }]; } },
    { async collect() { return [{ keyword: "invoice", suggestions: ["invoice tabs chrome"], relatedKeywords: ["tabs"], score: 0.6 }]; } },
    { async score() { return { score: 0.8, rationale: "evidence-backed", revenueRangeUsd: { low: 100, high: 900 }, costDrivers: [] }; } }
  );

  const result = await validator.validate(candidate);
  assert.equal(result.passed, true);
  assert.ok(result.prelaunchScore > 0.7);
  assert.deepEqual(result.reasons, []);
});

test("DemandValidator passes when Chrome Web Store layer returns zero data", async () => {
  const validator = new DemandValidator(
    { async collect() { return [{ query: "invoice", extensionCount: 0, medianUsers: 0, medianRating: 0, medianReviewCount: 0 }]; } },
    { async collect() { return [{ keyword: "invoice", suggestions: ["invoice tabs chrome"], relatedKeywords: ["tabs"], score: 0.55 }]; } },
    { async score() { return { score: 0.72, rationale: "search and economics are enough", revenueRangeUsd: { low: 100, high: 900 }, costDrivers: [] }; } }
  );

  const result = await validator.validate(candidate);
  assert.equal(result.passed, true);
  assert.equal(result.prelaunchScore, 0.6605);
  assert.deepEqual(result.reasons, []);
});

test("DemandValidator reports only search/profitability/prelaunch failures for obvious bad ideas", async () => {
  const validator = new DemandValidator(
    { async collect() { return [{ query: "invoice", extensionCount: 1, medianUsers: 0, medianRating: 0, medianReviewCount: 0 }]; } },
    { async collect() { return [{ keyword: "invoice", suggestions: [], relatedKeywords: [], score: 0 }]; } },
    { async score() { return { score: 0.2, rationale: "weak", revenueRangeUsd: { low: 0, high: 10 }, costDrivers: [] }; } }
  );

  const result = await validator.validate(candidate);
  assert.equal(result.passed, false);
  assert.deepEqual(result.reasons, [
    "search-demand-below-threshold",
    "profitability-below-threshold",
    "prelaunch-score-below-threshold"
  ]);
});
