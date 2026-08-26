import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PlatformAdapter } from "../adapters/platform.js";
import { DecisionService } from "../decisions/decisionService.js";
import { DocumentStore } from "../db/firestore.js";
import { JudgmentEngine, MetricsService } from "../metrics/judgment.js";
import { Decision, MetricsSnapshot, ProductCandidate, ProductRecord } from "../types.js";
import { nowIso } from "../utils/env.js";

export interface DoubleDownResult {
  decision?: Decision;
  judgmentReason: string;
}

export interface DoubleDownExecutionResult {
  product: ProductRecord;
  submissionId: string;
  status: string;
  packageSha256: string;
}

export interface ProductExpansionGenerator {
  expand(product: ProductRecord, decision: Decision): Promise<ProductCandidate>;
}

export class RuleBasedProductExpansionGenerator implements ProductExpansionGenerator {
  async expand(product: ProductRecord, decision: Decision): Promise<ProductCandidate> {
    const candidate = product.candidate;
    const proposal = String(decision.diffFromExisting || "Add deeper workflow automation for the strongest user segment.");
    return {
      ...candidate,
      name: candidate.name.endsWith("Pro") ? candidate.name : `${candidate.name} Pro`,
      slug: candidate.slug.endsWith("-pro") ? candidate.slug : `${candidate.slug}-pro`,
      problem: `${candidate.problem} Winning product metrics indicate this workflow deserves deeper automation.`,
      solution: `${candidate.solution} Double-down update: ${proposal}`,
      keywords: [...new Set([...candidate.keywords, "workflow automation", "quality review"])],
      monetization: {
        model: candidate.monetization.model === "free" ? "freemium" : candidate.monetization.model,
        expectedPriceUsd: candidate.monetization.expectedPriceUsd ?? 9
      }
    };
  }
}

export class DoubleDownWorkflow {
  constructor(
    private readonly products: DocumentStore<ProductRecord>,
    private readonly metrics: MetricsService,
    private readonly decisions: DecisionService,
    private readonly adapter: PlatformAdapter,
    private readonly engine = new JudgmentEngine(),
    private readonly expansionGenerator: ProductExpansionGenerator = new RuleBasedProductExpansionGenerator()
  ) {}

  async scanPublishedProducts(): Promise<DoubleDownResult[]> {
    const products = await this.products.query("products", "status", "published");
    const results: DoubleDownResult[] = [];
    for (const product of products) {
      const snapshot = await this.metrics.latestForProduct(product.id);
      if (!snapshot) {
        results.push({ judgmentReason: "missing-metrics" });
        continue;
      }
      results.push(await this.evaluateProduct(product, snapshot));
    }
    return results;
  }

  async evaluateProduct(product: ProductRecord, snapshot: MetricsSnapshot): Promise<DoubleDownResult> {
    const judgment = this.engine.judge(snapshot);
    if (judgment.action !== "double-down") {
      return { judgmentReason: judgment.reasons.join(",") || "not-double-down" };
    }
    const proposal = deepeningProposal(product, snapshot);
    const decision = await this.decisions.create({
      type: "double-down",
      product,
      candidate: product.candidate,
      evidence: {
        metrics: snapshot,
        reasons: judgment.reasons,
        proposal
      },
      revenueRangeUsd: { low: Math.round(snapshot.projectedRevenueUsd * 0.25), high: Math.round(snapshot.projectedRevenueUsd * 1.5) },
      revenueBreakdown: {
        installs: snapshot.installs,
        firstWeekRepeatRate: snapshot.firstWeekRepeatRate,
        freeToPaidConversionRate: snapshot.freeToPaidConversionRate,
        projectedRevenueUsd: snapshot.projectedRevenueUsd
      },
      diffFromExisting: proposal
    });
    return { decision, judgmentReason: judgment.reasons.join(",") };
  }

  async executeApprovedDecision(decision: Decision): Promise<DoubleDownExecutionResult | undefined> {
    if (decision.type !== "double-down" || decision.status !== "approved") return undefined;
    const product = await this.products.get("products", decision.productId);
    if (!product) throw new Error(`Product not found for double-down decision: ${decision.productId}`);
    const expanded = await this.expansionGenerator.expand(product, decision);
    const build = await this.adapter.build(expanded);
    const outputDir = await mkdtemp(join(tmpdir(), "smobiz-double-down-"));
    const packaged = await this.adapter.package(build, outputDir);
    const submission = await this.adapter.submit(packaged, build.storeListing);
    const updated = await this.products.save("products", {
      ...product,
      candidate: expanded,
      status: "published",
      updatedAt: nowIso()
    });
    return {
      product: updated,
      submissionId: submission.submissionId,
      status: submission.status,
      packageSha256: packaged.sha256
    };
  }
}

function deepeningProposal(product: ProductRecord, snapshot: MetricsSnapshot): string {
  return [
    `Double down on ${product.candidate.name} because first-week repeat rate ${(snapshot.firstWeekRepeatRate * 100).toFixed(1)}% and paid conversion ${(snapshot.freeToPaidConversionRate * 100).toFixed(1)}% cleared thresholds.`,
    "Add deeper workflow automation for the highest-intent users: saved review templates, richer extraction/validation, exportable client-ready summaries, and clearer upgrade prompts."
  ].join(" ");
}
