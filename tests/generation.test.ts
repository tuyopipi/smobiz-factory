import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryDocumentStore } from "../src/db/firestore.js";
import { CandidateHistoryService } from "../src/generation/candidateHistory.js";
import { CandidateGenerator } from "../src/generation/candidateGenerator.js";
import { DataDrivenCandidateGenerator } from "../src/generation/dataDrivenCandidateGenerator.js";
import { FingerprintService } from "../src/generation/fingerprint.js";
import { CandidateScoreRecord, ProductCandidate, ProductRecord } from "../src/types.js";

test("CandidateGenerator normalizes candidates and drops broad permissions", async () => {
  let prompt = "";
  const generator = new CandidateGenerator({
    async complete(value) {
      prompt = value;
      return JSON.stringify([
        {
          name: "Receipt Focus Mode",
          niche: "receipt review",
          targetUser: "bookkeepers",
          problem: "receipt tabs distract",
          solution: "dim unrelated tabs",
          keywords: ["receipt review", "bookkeeping"],
          permissions: ["tabs", "storage"],
          marketResearch: {
            estimatedSimilarExtensionCount: 4,
            differentiation: "focuses on receipt review batches for bookkeepers",
            willingnessToPayEvidence: "bookkeepers already spend billable time reviewing receipt tabs"
          },
          monetization: { model: "freemium", expectedPriceUsd: 5 }
        },
        {
          name: "Everything Watcher",
          keywords: ["monitor all pages"],
          permissions: ["<all_urls>"],
          monetization: { model: "free" }
        }
      ]);
    }
  });

  const result = await generator.generate({ count: 5 });
  assert.equal(result.length, 1);
  assert.equal(result[0].slug, "receipt-focus-mode");
  assert.deepEqual(result[0].permissions, ["tabs", "storage"]);
  assert.equal(result[0].marketResearch?.estimatedSimilarExtensionCount, 4);
  assert.match(prompt, /Hard exclusions/);
  assert.match(prompt, /estimatedSimilarExtensionCount/);
  assert.match(prompt, /willingness to pay/i);
  assert.match(prompt, /Exclude your own candidates if estimatedSimilarExtensionCount is above 8/);
});

test("CandidateGenerator filters saturated categories and weak market self-reports", async () => {
  const generator = new CandidateGenerator({
    async complete() {
      return JSON.stringify([
        {
          name: "Session Saver Pro",
          niche: "tab management",
          targetUser: "browser users",
          problem: "too many tabs",
          solution: "save browsing sessions",
          keywords: ["session saver"],
          permissions: ["tabs"],
          marketResearch: {
            estimatedSimilarExtensionCount: 3,
            differentiation: "simple session saving",
            willingnessToPayEvidence: "users dislike tab clutter"
          },
          monetization: { model: "freemium" }
        },
        {
          name: "Clinic Intake Code Helper",
          niche: "healthcare admin intake coding",
          targetUser: "clinic billing coordinators preparing payer intake forms",
          problem: "billing coordinators manually copy payer-specific intake codes from portals into claim prep notes",
          solution: "detect payer portal fields and build a reusable intake-code checklist for the coordinator",
          keywords: ["payer intake checklist", "clinic billing admin"],
          permissions: ["activeTab", "storage"],
          marketResearch: {
            estimatedSimilarExtensionCount: 8,
            differentiation: "targets payer intake-code checklisting rather than generic form filling",
            willingnessToPayEvidence: "clinics already pay coordinators for repetitive claim-prep cleanup"
          },
          monetization: { model: "subscription", expectedPriceUsd: 9 }
        },
        {
          name: "Generic Form Helper",
          niche: "form helper",
          targetUser: "office workers",
          problem: "forms take time",
          solution: "helps with forms",
          keywords: ["forms"],
          permissions: ["storage"],
          marketResearch: {
            estimatedSimilarExtensionCount: 30,
            differentiation: "",
            willingnessToPayEvidence: ""
          },
          monetization: { model: "freemium" }
        }
      ]);
    }
  });

  const result = await generator.generate({ count: 3 });
  assert.deepEqual(result.map((candidate) => candidate.slug), ["clinic-intake-code-helper"]);
});

test("DataDrivenCandidateGenerator builds candidates from demand-supply gaps", async () => {
  let prompt = "";
  const generator = new DataDrivenCandidateGenerator(
    {
      async complete(value) {
        prompt = value;
        return JSON.stringify([
          {
            name: "Remittance Portal Matcher",
            niche: "remittance matching client portal",
            targetUser: "bookkeepers reconciling client portal invoices",
            problem: "bookkeepers manually match remittance notes to open invoice rows",
            solution: "extract selected remittance text and highlight likely invoice row matches",
            keywords: ["remittance matching client portal", "invoice reconciliation"],
            permissions: ["activeTab", "storage"],
            marketResearch: {
              estimatedSimilarExtensionCount: 1,
              differentiation: "Chrome Store has sparse supply for the remittance matching keyword despite search suggestions.",
              willingnessToPayEvidence: "Bookkeepers already spend paid time reconciling client invoices manually."
            },
            monetization: { model: "subscription", expectedPriceUsd: 9 }
          }
        ]);
      }
    },
    {
      async collect(candidate) {
        const keyword = candidate.niche;
        if (keyword === "seed") {
          return [{ keyword, suggestions: ["remittance matching client portal", "tab manager"], relatedKeywords: [], score: 0.5 }];
        }
        return [{ keyword, suggestions: [`${keyword} software`], relatedKeywords: [], score: keyword.includes("remittance") ? 0.9 : 0.2 }];
      }
    },
    {
      async collect(candidate) {
        const count = candidate.niche.includes("remittance") ? 1 : 20;
        const rating = candidate.niche.includes("remittance") ? 3.2 : 4.8;
        return [{ query: candidate.niche, extensionCount: count, medianUsers: 100, medianRating: rating, medianReviewCount: 5 }];
      }
    },
    ["seed"]
  );

  const result = await generator.generate({ count: 1 });

  assert.equal(result[0].slug, "remittance-portal-matcher");
  assert.equal(result[0].marketResearch?.estimatedSimilarExtensionCount, 1);
  assert.match(prompt, /demand-supply gaps/);
  assert.match(prompt, /remittance matching client portal/);
  assert.doesNotMatch(prompt, /tab manager/);
});

test("DataDrivenCandidateGenerator ranks purchase-intent B2B gaps above generic zero-competition gaps", async () => {
  const generator = new DataDrivenCandidateGenerator(
    {
      async complete() {
        return JSON.stringify([
          {
            name: "Prior Auth Portal Pack",
            niche: "prior authorization portal workflow",
            targetUser: "prior authorization specialists",
            problem: "specialists manually collect payer forms and status details across portals",
            solution: "capture payer portal status fields and produce a prior authorization follow-up checklist",
            keywords: ["prior authorization portal", "prior authorization form"],
            permissions: ["activeTab", "storage"],
            marketResearch: {
              estimatedSimilarExtensionCount: 0,
              differentiation: "No Chrome Store supply for high-intent prior authorization portal searches.",
              willingnessToPayEvidence: "Jobs, forms, portals, and salary searches show paid operational work."
            },
            monetization: { model: "subscription", expectedPriceUsd: 12 }
          }
        ]);
      }
    },
    {
      async collect(candidate) {
        const keyword = candidate.niche;
        const suggestions = keyword === "seed"
          ? ["prior authorization portal", "remittance meaning"]
          : keyword.includes("prior")
            ? ["prior authorization portal", "prior authorization software", "prior authorization jobs", "prior authorization salary", "prior authorization form"]
            : ["remittance meaning", "remittance definition"];
        return [{ keyword, suggestions, relatedKeywords: suggestions.flatMap((item) => item.split(/\s+/)), score: 1 }];
      }
    },
    {
      async collect(candidate) {
        return [{ query: candidate.niche, extensionCount: 0, medianUsers: 0, medianRating: 0, medianReviewCount: 0 }];
      }
    },
    ["seed"]
  );

  const gaps = await generator.discoverGaps(3);
  const priorGap = gaps.find((gap) => gap.keyword === "prior authorization portal");
  const genericGap = gaps.find((gap) => gap.keyword === "remittance meaning");

  assert.equal(gaps[0].keyword, "prior authorization portal");
  assert.ok(priorGap);
  assert.ok(genericGap);
  assert.ok(priorGap.purchaseIntentScore > genericGap.purchaseIntentScore);
  assert.ok(priorGap.b2bScore > genericGap.b2bScore);
});

test("DataDrivenCandidateGenerator favors lightweight Chrome-extension-solvable gaps over regulated integration-heavy gaps", async () => {
  const generator = new DataDrivenCandidateGenerator(
    { async complete() { return "[]"; } },
    {
      async collect(candidate) {
        const keyword = candidate.niche;
        const suggestions = keyword === "seed"
          ? ["invoice reconciliation template csv", "prior authorization medical insurance api integration"]
          : keyword.includes("invoice")
            ? ["invoice reconciliation template excel", "invoice csv checklist", "invoice reconciliation workflow"]
            : ["prior authorization medical insurance api integration", "hipaa ehr prior authorization", "patient insurance claims"];
        return [{ keyword, suggestions, relatedKeywords: suggestions.flatMap((item) => item.split(/\s+/)), score: 1 }];
      }
    },
    {
      async collect(candidate) {
        return [{ query: candidate.niche, extensionCount: 0, medianUsers: 0, medianRating: 0, medianReviewCount: 0 }];
      }
    },
    ["seed"]
  );

  const gaps = await generator.discoverGaps(3);
  const invoice = gaps.find((gap) => gap.keyword === "invoice reconciliation template csv");
  const regulated = gaps.find((gap) => gap.keyword === "prior authorization medical insurance api integration");

  assert.ok(invoice);
  assert.ok(regulated);
  assert.ok(invoice.implementationFitScore > regulated.implementationFitScore);
  assert.ok(invoice.gapScore > regulated.gapScore);
});

test("CandidateHistoryService keeps and chooses historical best when new scores are lower", async () => {
  const store = new InMemoryDocumentStore<CandidateScoreRecord>();
  const history = new CandidateHistoryService(store);
  const baseCandidate: ProductCandidate = {
    name: "Invoice CSV Helper",
    slug: "invoice-csv-helper",
    platform: "chrome",
    niche: "invoice reconciliation template csv",
    targetUser: "bookkeepers",
    problem: "manual invoice reconciliation",
    solution: "extract invoice rows to CSV checklist",
    keywords: ["invoice reconciliation", "csv"],
    permissions: ["activeTab", "storage"],
    marketResearch: { estimatedSimilarExtensionCount: 1, differentiation: "low competition", willingnessToPayEvidence: "paid bookkeeping time", gapScore: 0.8, implementationFitScore: 0.9 },
    monetization: { model: "subscription", expectedPriceUsd: 9 }
  };
  const older = await history.record({
    candidate: baseCandidate,
    evidence: {
      chromeStore: [],
      search: [],
      profitability: { score: 0.6, rationale: "strong", revenueRangeUsd: { low: 100, high: 1000 }, costDrivers: [] },
      prelaunchScore: 0.7,
      passed: true,
      reasons: []
    }
  });
  const newer = await history.record({
    candidate: { ...baseCandidate, name: "Weaker Helper", slug: "weaker-helper", marketResearch: { ...baseCandidate.marketResearch!, gapScore: 0.2, implementationFitScore: 0.3 } },
    evidence: {
      chromeStore: [],
      search: [],
      profitability: { score: 0.2, rationale: "weak", revenueRangeUsd: { low: 0, high: 100 }, costDrivers: [] },
      prelaunchScore: 0.3,
      passed: true,
      reasons: []
    }
  });

  const chosen = await history.chooseBestCandidate([newer]);

  assert.equal(chosen?.id, older.id);
  assert.ok(older.overallScore > newer.overallScore);
});

test("FingerprintService detects structurally similar products", async () => {
  const store = new InMemoryDocumentStore<ProductRecord>();
  await store.save("products", {
    id: "p1",
    candidate: {
      name: "Receipt Focus Mode",
      slug: "receipt-focus-mode",
      platform: "chrome",
      niche: "receipt review",
      targetUser: "bookkeepers",
      problem: "receipt tabs distract",
      solution: "dim unrelated tabs",
      keywords: ["receipt review", "bookkeeping"],
      permissions: ["tabs", "storage"],
      monetization: { model: "freemium" }
    },
    fingerprint: "old",
    status: "published",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  });

  const service = new FingerprintService(store, 0.6);
  const result = await service.check({
    name: "Receipt Review Focus",
    slug: "receipt-review-focus",
    platform: "chrome",
    niche: "receipt review",
    targetUser: "bookkeepers",
    problem: "receipt tabs distract",
    solution: "hide unrelated tabs",
    keywords: ["receipt review", "bookkeeping"],
    permissions: ["tabs", "storage"],
    monetization: { model: "freemium" }
  });

  assert.equal(result.duplicate, true);
  assert.equal(result.matchedProduct?.id, "p1");
});
