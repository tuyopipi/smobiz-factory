import assert from "node:assert/strict";
import test from "node:test";
import { ChromeAdapter } from "../src/adapters/chrome.js";
import { PlatformAdapter } from "../src/adapters/platform.js";
import { DecisionService } from "../src/decisions/decisionService.js";
import { DemandValidator } from "../src/demand/validator.js";
import { InMemoryDocumentStore } from "../src/db/firestore.js";
import { CandidateGenerator } from "../src/generation/candidateGenerator.js";
import { FingerprintService } from "../src/generation/fingerprint.js";
import { JudgmentEngine, JudgmentWorkflow, MetricsService } from "../src/metrics/judgment.js";
import { DoubleDownWorkflow } from "../src/orchestrator/doubleDown.js";
import { FactoryPipeline } from "../src/orchestrator/pipeline.js";
import { Decision, ExtensionBuild, MetricsSnapshot, ProductCandidate, ProductRecord } from "../src/types.js";

function marketResearch(workflow: string) {
  return {
    estimatedSimilarExtensionCount: 4,
    differentiation: `Targets ${workflow} instead of a generic browser utility.`,
    willingnessToPayEvidence: `Users already spend paid work time handling ${workflow} manually.`
  };
}

function candidate(overrides: Partial<ProductCandidate> = {}): ProductCandidate {
  return {
    name: "Invoice Row Matchmaker",
    slug: "invoice-row-matchmaker",
    platform: "chrome",
    niche: "bookkeepers matching remittance notes to invoice rows in client portals",
    targetUser: "bookkeepers preparing client portal invoice reconciliations",
    problem: "bookkeepers manually compare remittance text against invoice rows before marking paid items",
    solution: "highlight matching invoice rows from selected remittance text and save the last review state",
    keywords: ["bookkeeping", "remittance", "invoice reconciliation"],
    permissions: ["tabs", "storage"],
    marketResearch: marketResearch("invoice reconciliation"),
    monetization: { model: "subscription", expectedPriceUsd: 9 },
    ...overrides
  };
}

function functionalBuild(input: ProductCandidate): ExtensionBuild {
  const manifest = {
    manifest_version: 3,
    name: input.name,
    version: "0.1.0",
    permissions: input.permissions,
    icons: { "128": "icons/icon.png" },
    action: {
      default_popup: "popup.html",
      default_icon: { "128": "icons/icon.png" }
    }
  };
  return {
    manifest,
    files: {
      "manifest.json": JSON.stringify(manifest),
      "popup.html": "<input id=\"search\"><button id=\"go\">Go</button><script src=\"popup.js\"></script>",
      "popup.js": "document.querySelector('#go').addEventListener('click', async () => { await chrome.tabs.query({}); await chrome.storage.local.set({ ok: true }); });",
      "icons/icon.png": Buffer.from([137, 80, 78, 71])
    },
    storeListing: {
      title: input.name,
      summary: input.solution,
      description: input.problem,
      category: "productivity"
    }
  };
}

test("FactoryPipeline creates pending ship decisions for validated non-duplicate candidates", async () => {
  const products = new InMemoryDocumentStore<ProductRecord>();
  const metrics = new InMemoryDocumentStore<MetricsSnapshot>();
  const decisions = new InMemoryDocumentStore<Decision>();
  const decisionService = new DecisionService(decisions);
  const generator = new CandidateGenerator({
    async complete() {
      return JSON.stringify([
        {
          name: "Receipt Focus Mode",
          niche: "receipt review",
          targetUser: "bookkeepers",
          problem: "receipt tabs distract",
          solution: "dim unrelated receipt tabs",
          keywords: ["receipt review"],
          permissions: ["tabs", "storage"],
          marketResearch: marketResearch("receipt review"),
          monetization: { model: "freemium" }
        }
      ]);
    }
  });
  const demand = new DemandValidator(
    { async collect() { return [{ query: "receipt", extensionCount: 4, medianUsers: 1000, medianRating: 4, medianReviewCount: 20 }]; } },
    { async collect() { return [{ keyword: "receipt", suggestions: ["receipt review extension"], relatedKeywords: [], score: 0.7 }]; } },
    { async score() { return { score: 0.8, rationale: "good", revenueRangeUsd: { low: 100, high: 500 }, costDrivers: [] }; } }
  );
  const pipeline = new FactoryPipeline(generator, demand, new FingerprintService(products), products, metrics, new ChromeAdapter(), decisionService);

  const result = await pipeline.run(1);
  const pending = await decisionService.listPending();
  assert.equal(result.decisionsCreated, 1);
  assert.equal(pending.length, 1);
  assert.equal(pending[0].type, "ship");
});

test("FactoryPipeline auto-approves and submits ship decisions when quality checks pass", async () => {
  const products = new InMemoryDocumentStore<ProductRecord>();
  const metrics = new InMemoryDocumentStore<MetricsSnapshot>();
  const decisions = new InMemoryDocumentStore<Decision>();
  const decisionService = new DecisionService(decisions);
  const generated = candidate();
  const generator = new CandidateGenerator({
    async complete() {
      return JSON.stringify([generated]);
    }
  });
  const demand = new DemandValidator(
    { async collect() { return [{ query: "invoice reconciliation", extensionCount: 3, medianUsers: 1000, medianRating: 4.4, medianReviewCount: 20 }]; } },
    { async collect() { return [{ keyword: "invoice reconciliation", suggestions: ["invoice reconciliation process"], relatedKeywords: [], score: 0.7 }]; } },
    { async score() { return { score: 0.8, rationale: "good", revenueRangeUsd: { low: 100, high: 500 }, costDrivers: [] }; } }
  );
  let submitCount = 0;
  const adapter: PlatformAdapter = {
    platform: "chrome",
    async build(input) {
      return functionalBuild(input);
    },
    async package() {
      return { zipPath: "/tmp/test.zip", sizeBytes: 100, sha256: "abc" };
    },
    async submit() {
      submitCount += 1;
      return { submissionId: "submitted-1", status: "submitted" };
    }
  };
  const pipeline = new FactoryPipeline(
    generator,
    demand,
    new FingerprintService(products),
    products,
    metrics,
    adapter,
    decisionService,
    undefined,
    { autoApprove: true }
  );

  const result = await pipeline.run(1);
  const pending = await decisionService.listPending();
  const storedProducts = await products.list("products");

  assert.equal(result.autoApproved, true);
  assert.equal(result.submitted, true);
  assert.deepEqual(result.autoApprovalReasons, []);
  assert.equal(submitCount, 1);
  assert.equal(pending.length, 0);
  assert.equal(storedProducts[0].status, "published");
});

test("FactoryPipeline leaves failed auto-approval checks pending for human review", async () => {
  const products = new InMemoryDocumentStore<ProductRecord>();
  const metrics = new InMemoryDocumentStore<MetricsSnapshot>();
  const decisions = new InMemoryDocumentStore<Decision>();
  const decisionService = new DecisionService(decisions);
  const generated = candidate({ name: "Notion Invoice Matchmaker", slug: "notion-invoice-matchmaker" });
  const generator = new CandidateGenerator({
    async complete() {
      return JSON.stringify([generated]);
    }
  });
  const demand = new DemandValidator(
    { async collect() { return [{ query: "invoice reconciliation", extensionCount: 3, medianUsers: 1000, medianRating: 4.4, medianReviewCount: 20 }]; } },
    { async collect() { return [{ keyword: "invoice reconciliation", suggestions: ["invoice reconciliation process"], relatedKeywords: [], score: 0.7 }]; } },
    { async score() { return { score: 0.8, rationale: "good", revenueRangeUsd: { low: 100, high: 500 }, costDrivers: [] }; } }
  );
  let submitCount = 0;
  const adapter: PlatformAdapter = {
    platform: "chrome",
    async build(input) {
      return functionalBuild(input);
    },
    async package() {
      return { zipPath: "/tmp/test.zip", sizeBytes: 100, sha256: "abc" };
    },
    async submit() {
      submitCount += 1;
      return { submissionId: "unused", status: "submitted" };
    }
  };
  const pipeline = new FactoryPipeline(
    generator,
    demand,
    new FingerprintService(products),
    products,
    metrics,
    adapter,
    decisionService,
    undefined,
    { autoApprove: true }
  );

  const result = await pipeline.run(1);
  const pending = await decisionService.listPending();

  assert.equal(result.autoApproved, false);
  assert.equal(result.submitted, false);
  assert.match(result.autoApprovalReasons?.join(",") ?? "", /protected-mark-in-name:notion/);
  assert.equal(submitCount, 0);
  assert.equal(pending.length, 1);
  assert.equal(pending[0].status, "pending");
});

test("FactoryPipeline ranks validated candidates and builds only the top one", async () => {
  const products = new InMemoryDocumentStore<ProductRecord>();
  const metrics = new InMemoryDocumentStore<MetricsSnapshot>();
  const decisions = new InMemoryDocumentStore<Decision>();
  const decisionService = new DecisionService(decisions);
  const generator = new CandidateGenerator({
    async complete() {
      return JSON.stringify([
        {
          name: "Receipt Focus Mode",
          niche: "receipt review",
          targetUser: "bookkeepers",
          problem: "receipt tabs distract",
          solution: "dim unrelated receipt tabs",
          keywords: ["receipt review"],
          permissions: ["tabs", "storage"],
          marketResearch: marketResearch("receipt review"),
          monetization: { model: "freemium" }
        },
        {
          name: "Invoice Export Helper",
          niche: "invoice export",
          targetUser: "freelancers",
          problem: "invoice exports are repetitive",
          solution: "prepare invoice export tabs",
          keywords: ["invoice export"],
          permissions: ["tabs"],
          marketResearch: marketResearch("invoice export"),
          monetization: { model: "freemium" }
        }
      ]);
    }
  });
  const demand = new DemandValidator(
    { async collect() { return [{ query: "test", extensionCount: 4, medianUsers: 1000, medianRating: 4, medianReviewCount: 20 }]; } },
    { async collect() { return [{ keyword: "test", suggestions: ["test extension"], relatedKeywords: [], score: 0.7 }]; } },
    {
      async score(candidate) {
        return {
          score: candidate.niche.includes("invoice") ? 0.9 : 0.7,
          rationale: "candidate-specific",
          revenueRangeUsd: { low: 100, high: 500 },
          costDrivers: []
        };
      }
    }
  );
  let buildCount = 0;
  const adapter: PlatformAdapter = {
    platform: "chrome",
    async build(candidate) {
      buildCount += 1;
      return new ChromeAdapter().build(candidate);
    },
    async package(build, outputDir) {
      return new ChromeAdapter().package(build, outputDir);
    },
    async submit() {
      return { submissionId: "unused", status: "unused" };
    }
  };
  const pipeline = new FactoryPipeline(generator, demand, new FingerprintService(products), products, metrics, adapter, decisionService);

  const result = await pipeline.run(2);
  const pending = await decisionService.listPending();
  assert.equal(buildCount, 1);
  assert.equal(result.ranked, 2);
  assert.equal(result.decisionsCreated, 1);
  assert.equal(result.feedbackApplied, false);
  assert.equal(result.selectedCandidateSlug, "invoice-export-helper");
  assert.equal(pending.length, 1);
  assert.equal(pending[0].preview.slug, "invoice-export-helper");
});

test("FactoryPipeline uses historical wins to rank similar candidates first", async () => {
  const products = new InMemoryDocumentStore<ProductRecord>();
  const metrics = new InMemoryDocumentStore<MetricsSnapshot>();
  const decisions = new InMemoryDocumentStore<Decision>();
  await products.save("products", {
    id: "winner",
    candidate: {
      name: "Receipt Review Booster",
      slug: "receipt-review-booster",
      platform: "chrome",
      niche: "receipt review",
      targetUser: "bookkeepers",
      problem: "receipt tabs are slow",
      solution: "organize receipt review tabs",
      keywords: ["receipt review", "bookkeeping"],
      permissions: ["tabs", "storage"],
      marketResearch: marketResearch("receipt review"),
      monetization: { model: "freemium" }
    },
    fingerprint: "winner-fp",
    status: "published",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  });
  await metrics.save("metrics", {
    id: "winner-metrics",
    productId: "winner",
    installs: 500,
    firstWeekRepeatRate: 0.55,
    freeToPaidConversionRate: 0.06,
    refundRate: 0,
    averageRating: 4.6,
    platformWarnings: 0,
    maintenanceCostUsd: 5,
    projectedRevenueUsd: 300,
    reviews: 30,
    capturedAt: "2026-01-08T00:00:00.000Z"
  });
  const decisionService = new DecisionService(decisions);
  const generator = new CandidateGenerator({
    async complete() {
      return JSON.stringify([
        {
          name: "Receipt Batch Focus",
          niche: "receipt review",
          targetUser: "bookkeepers",
          problem: "receipt tabs interrupt review",
          solution: "batch receipt tabs by client",
          keywords: ["receipt review", "bookkeeping"],
          permissions: ["tabs", "storage"],
          marketResearch: marketResearch("receipt review"),
          monetization: { model: "freemium" }
        },
        {
          name: "Meeting Link Cleaner",
          niche: "meeting links",
          targetUser: "sales reps",
          problem: "meeting links clutter the browser",
          solution: "clean old meeting tabs",
          keywords: ["meeting links"],
          permissions: ["tabs"],
          marketResearch: marketResearch("meeting link cleanup"),
          monetization: { model: "freemium" }
        }
      ]);
    }
  });
  const demand = new DemandValidator(
    { async collect() { return [{ query: "test", extensionCount: 4, medianUsers: 1000, medianRating: 4, medianReviewCount: 20 }]; } },
    { async collect() { return [{ keyword: "test", suggestions: ["test extension"], relatedKeywords: [], score: 0.7 }]; } },
    {
      async score(candidate) {
        return {
          score: candidate.niche.includes("meeting") ? 0.82 : 0.64,
          rationale: "meeting has stronger raw demand, receipt has historical fit",
          revenueRangeUsd: { low: 100, high: 500 },
          costDrivers: []
        };
      }
    }
  );
  const pipeline = new FactoryPipeline(
    generator,
    demand,
    new FingerprintService(products, 1.1),
    products,
    metrics,
    new ChromeAdapter(),
    decisionService
  );

  const result = await pipeline.run(2);
  const pending = await decisionService.listPending();
  assert.equal(result.feedbackApplied, true);
  assert.equal(result.selectedCandidateSlug, "receipt-batch-focus");
  assert.equal(pending.length, 1);
  assert.equal(pending[0].preview.slug, "receipt-batch-focus");
  assert.match(String(pending[0].revenueBreakdown.feedbackScore), /^0\./);
});

test("FactoryPipeline ignores historical feedback from products with fewer than 50 installs", async () => {
  const products = new InMemoryDocumentStore<ProductRecord>();
  const metrics = new InMemoryDocumentStore<MetricsSnapshot>();
  const decisions = new InMemoryDocumentStore<Decision>();
  await products.save("products", {
    id: "tiny-winner",
    candidate: {
      name: "Receipt Tiny Winner",
      slug: "receipt-tiny-winner",
      platform: "chrome",
      niche: "receipt review",
      targetUser: "bookkeepers",
      problem: "receipt tabs are slow",
      solution: "organize receipt review tabs",
      keywords: ["receipt review", "bookkeeping"],
      permissions: ["tabs", "storage"],
      marketResearch: marketResearch("receipt review"),
      monetization: { model: "freemium" }
    },
    fingerprint: "tiny-fp",
    status: "published",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  });
  await metrics.save("metrics", {
    id: "tiny-metrics",
    productId: "tiny-winner",
    installs: 49,
    firstWeekRepeatRate: 0.9,
    freeToPaidConversionRate: 0.2,
    refundRate: 0,
    averageRating: 5,
    platformWarnings: 0,
    maintenanceCostUsd: 1,
    projectedRevenueUsd: 500,
    reviews: 3,
    capturedAt: "2026-01-08T00:00:00.000Z"
  });
  const decisionService = new DecisionService(decisions);
  const generator = new CandidateGenerator({
    async complete() {
      return JSON.stringify([
        {
          name: "Receipt Batch Focus",
          niche: "receipt review",
          targetUser: "bookkeepers",
          problem: "receipt tabs interrupt review",
          solution: "batch receipt tabs by client",
          keywords: ["receipt review", "bookkeeping"],
          permissions: ["tabs", "storage"],
          marketResearch: marketResearch("receipt review"),
          monetization: { model: "freemium" }
        },
        {
          name: "Meeting Link Cleaner",
          niche: "meeting links",
          targetUser: "sales reps",
          problem: "meeting links clutter the browser",
          solution: "clean old meeting tabs",
          keywords: ["meeting links"],
          permissions: ["tabs"],
          marketResearch: marketResearch("meeting link cleanup"),
          monetization: { model: "freemium" }
        }
      ]);
    }
  });
  const demand = new DemandValidator(
    { async collect() { return [{ query: "test", extensionCount: 4, medianUsers: 1000, medianRating: 4, medianReviewCount: 20 }]; } },
    { async collect() { return [{ keyword: "test", suggestions: ["test extension"], relatedKeywords: [], score: 0.7 }]; } },
    {
      async score(candidate) {
        return {
          score: candidate.niche.includes("meeting") ? 0.82 : 0.64,
          rationale: "tiny receipt history should not override demand",
          revenueRangeUsd: { low: 100, high: 500 },
          costDrivers: []
        };
      }
    }
  );
  const pipeline = new FactoryPipeline(
    generator,
    demand,
    new FingerprintService(products, 1.1),
    products,
    metrics,
    new ChromeAdapter(),
    decisionService
  );

  const result = await pipeline.run(2);
  const pending = await decisionService.listPending();
  assert.equal(result.feedbackApplied, false);
  assert.equal(result.selectedCandidateSlug, "meeting-link-cleaner");
  assert.equal(pending[0].preview.slug, "meeting-link-cleaner");
  assert.equal(pending[0].revenueBreakdown.feedbackScore, 0);
});

test("JudgmentEngine separates double-down, watch, low-sample hold, and retire", () => {
  const engine = new JudgmentEngine({ minRepeatRate: 0.3, minConversionRate: 0.02, minInstalls: 50, maxRefundRate: 0.15, minAverageRating: 3.2 });
  const base: MetricsSnapshot = {
    id: "m1",
    productId: "p1",
    installs: 100,
    firstWeekRepeatRate: 0.1,
    freeToPaidConversionRate: 0.01,
    refundRate: 0,
    averageRating: 4,
    platformWarnings: 0,
    maintenanceCostUsd: 1,
    projectedRevenueUsd: 10,
    reviews: 3,
    capturedAt: "2026-01-01T00:00:00.000Z"
  };
  assert.equal(engine.judge({ ...base, firstWeekRepeatRate: 0.4, freeToPaidConversionRate: 0.03 }).action, "double-down");
  assert.deepEqual(engine.judge({ ...base, installs: 49, firstWeekRepeatRate: 0.9, freeToPaidConversionRate: 0.5 }), {
    action: "watch",
    reasons: ["sample-size-below-threshold"]
  });
  assert.equal(engine.judge(base).action, "watch");
  assert.equal(engine.judge({ ...base, refundRate: 0.3 }).action, "retire");
});

test("MetricsService and JudgmentWorkflow create approval decisions", async () => {
  const metricsStore = new InMemoryDocumentStore<MetricsSnapshot>();
  const products = new InMemoryDocumentStore<ProductRecord>();
  const decisions = new InMemoryDocumentStore<Decision>();
  const metrics = new MetricsService(metricsStore);
  const decisionService = new DecisionService(decisions);
  const product: ProductRecord = {
    id: "p1",
    candidate: {
      name: "Receipt Focus Mode",
      slug: "receipt-focus-mode",
      platform: "chrome",
      niche: "receipt review",
      targetUser: "bookkeepers",
      problem: "receipt tabs distract",
      solution: "dim unrelated receipt tabs",
      keywords: ["receipt review"],
      permissions: ["tabs"],
      monetization: { model: "freemium" }
    },
    fingerprint: "fp",
    status: "published",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  };
  await products.save("products", product);
  const snapshot = await metrics.record({
    id: "m1",
    productId: "p1",
    installs: 100,
    firstWeekRepeatRate: 0.5,
    freeToPaidConversionRate: 0.04,
    refundRate: 0,
    averageRating: 4.5,
    platformWarnings: 0,
    maintenanceCostUsd: 1,
    projectedRevenueUsd: 100,
    reviews: 12,
    capturedAt: "2026-01-02T00:00:00.000Z"
  });
  const workflow = new JudgmentWorkflow(products, decisionService, new JudgmentEngine({ minRepeatRate: 0.3, minConversionRate: 0.02, minInstalls: 50, maxRefundRate: 0.15, minAverageRating: 3.2 }));

  const judgment = await workflow.evaluate(product, snapshot);
  const pending = await decisionService.listPending();
  assert.equal(judgment.action, "double-down");
  assert.equal(pending[0].type, "double-down");
});

test("DoubleDownWorkflow scans published products and creates decisions only with enough samples", async () => {
  const products = new InMemoryDocumentStore<ProductRecord>();
  const metricsStore = new InMemoryDocumentStore<MetricsSnapshot>();
  const decisionsStore = new InMemoryDocumentStore<Decision>();
  const metrics = new MetricsService(metricsStore);
  const decisions = new DecisionService(decisionsStore);
  await products.save("products", {
    id: "winner",
    candidate: candidate(),
    fingerprint: "fp",
    status: "published",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  });
  await products.save("products", {
    id: "too-small",
    candidate: candidate({ name: "Small Sample Tool", slug: "small-sample-tool" }),
    fingerprint: "fp2",
    status: "published",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  });
  await metrics.record({
    id: "m1",
    productId: "winner",
    installs: 80,
    firstWeekRepeatRate: 0.4,
    freeToPaidConversionRate: 0.04,
    refundRate: 0,
    averageRating: 4.5,
    platformWarnings: 0,
    maintenanceCostUsd: 10,
    projectedRevenueUsd: 1000,
    reviews: 10,
    capturedAt: "2026-01-08T00:00:00.000Z"
  });
  await metrics.record({
    id: "m2",
    productId: "too-small",
    installs: 49,
    firstWeekRepeatRate: 0.9,
    freeToPaidConversionRate: 0.2,
    refundRate: 0,
    averageRating: 5,
    platformWarnings: 0,
    maintenanceCostUsd: 1,
    projectedRevenueUsd: 1000,
    reviews: 2,
    capturedAt: "2026-01-08T00:00:00.000Z"
  });
  const adapter: PlatformAdapter = {
    platform: "chrome",
    async build(input) { return functionalBuild(input); },
    async package() { return { zipPath: "/tmp/test.zip", sizeBytes: 100, sha256: "abc" }; },
    async submit() { return { submissionId: "unused", status: "submitted" }; }
  };
  const workflow = new DoubleDownWorkflow(
    products,
    metrics,
    decisions,
    adapter,
    new JudgmentEngine({ minRepeatRate: 0.3, minConversionRate: 0.02, minInstalls: 50, maxRefundRate: 0.15, minAverageRating: 3.2 })
  );

  const results = await workflow.scanPublishedProducts();
  const pending = await decisions.listPending();

  assert.equal(results.length, 2);
  assert.equal(pending.length, 1);
  assert.equal(pending[0].type, "double-down");
  assert.match(pending[0].diffFromExisting, /Double down on/);
  assert.equal(results.some((result) => result.judgmentReason === "sample-size-below-threshold"), true);
});

test("DoubleDownWorkflow executes approved double-down decisions by rebuilding and submitting", async () => {
  const products = new InMemoryDocumentStore<ProductRecord>();
  const metricsStore = new InMemoryDocumentStore<MetricsSnapshot>();
  const decisionsStore = new InMemoryDocumentStore<Decision>();
  const metrics = new MetricsService(metricsStore);
  const decisions = new DecisionService(decisionsStore);
  const product = await products.save("products", {
    id: "winner",
    candidate: candidate(),
    fingerprint: "fp",
    status: "published",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  });
  const decision = await decisions.create({
    type: "double-down",
    product,
    candidate: product.candidate,
    evidence: { reasons: ["repeat-and-conversion-above-threshold"] },
    revenueRangeUsd: { low: 100, high: 1000 },
    revenueBreakdown: { projectedRevenueUsd: 1000 },
    diffFromExisting: "Add exportable client-ready summaries."
  });
  const approved = await decisions.updateStatus(decision.id, "approved");
  let submittedName = "";
  const adapter: PlatformAdapter = {
    platform: "chrome",
    async build(input) {
      submittedName = input.name;
      return functionalBuild(input);
    },
    async package() {
      return { zipPath: "/tmp/test.zip", sizeBytes: 100, sha256: "double-sha" };
    },
    async submit() {
      return { submissionId: "double-1", status: "submitted" };
    }
  };
  const workflow = new DoubleDownWorkflow(products, metrics, decisions, adapter);

  const result = await workflow.executeApprovedDecision(approved);
  const updated = await products.get("products", "winner");

  assert.equal(result?.submissionId, "double-1");
  assert.equal(result?.packageSha256, "double-sha");
  assert.equal(submittedName, "Invoice Row Matchmaker Pro");
  assert.equal(updated?.candidate.name, "Invoice Row Matchmaker Pro");
  assert.match(updated?.candidate.solution ?? "", /Add exportable client-ready summaries/);
});
