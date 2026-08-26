import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const niche = await import(pathToFileURL(join(process.cwd(), "scripts/niche-criteria.mjs")).href) as any;

test("paid niche criteria accepts browser-only repeat workflows for owner-operators", () => {
  const item = {
    keyword: "bookkeeper monthly close checklist",
    suggestions: ["bookkeeper monthly close checklist", "bookkeeper client checklist software"],
    searchDemand: 2,
    demandScore: 0.6,
    competitorPainScore: 0.72,
    competition: { topToolResults: 2, knownCompetitorMentions: 1 },
    competitorPain: { competitors: ["canopy"] },
    painPoints: ["Users run into free-plan limits, paywalls, or unclear pricing before finishing the task."]
  };
  const score = niche.scorePaidNiche(item);
  assert.ok(score.paidNicheScore >= 0.45);
  assert.equal(niche.passesPaidNicheCriteria({ ...item, paidNiche: score }), true);
});

test("paid niche criteria rejects commodity free alternatives", () => {
  const item = {
    keyword: "csv to json converter",
    suggestions: ["csv to json converter free", "csv to json online"],
    searchDemand: 2,
    demandScore: 1,
    competitorPainScore: 0.5,
    painPoints: ["Some tools have limits."]
  };
  assert.equal(niche.passesPaidNicheCriteria(item), false);
});

test("paid niche criteria rejects enterprise integration workflows", () => {
  const item = {
    keyword: "salesforce slack approval workflow tool",
    suggestions: ["salesforce slack approval workflow tool"],
    searchDemand: 1,
    demandScore: 0.7,
    competitorPainScore: 0.8,
    painPoints: ["Expensive pricing and limits."]
  };
  const score = niche.scorePaidNiche(item);
  assert.equal(score.browserOnlyScore, 0);
  assert.equal(niche.passesPaidNicheCriteria({ ...item, paidNiche: score }), false);
});
