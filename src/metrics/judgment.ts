import { DecisionService } from "../decisions/decisionService.js";
import { DocumentStore } from "../db/firestore.js";
import { Judgment, MetricsSnapshot, ProductRecord } from "../types.js";
import { numberEnv } from "../utils/env.js";
import { randomUUID } from "node:crypto";

export interface JudgmentThresholds {
  minRepeatRate: number;
  minConversionRate: number;
  minInstalls: number;
  maxRefundRate: number;
  minAverageRating: number;
}

export class MetricsService {
  constructor(private readonly metrics: DocumentStore<MetricsSnapshot>) {}

  async record(snapshot: MetricsSnapshot): Promise<MetricsSnapshot> {
    return this.metrics.save("metrics", { ...snapshot, id: snapshot.id || randomUUID() });
  }

  async latestForProduct(productId: string): Promise<MetricsSnapshot | undefined> {
    const snapshots = await this.metrics.query("metrics", "productId", productId);
    return snapshots.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0];
  }
}

export class JudgmentEngine {
  constructor(
    private readonly thresholds: JudgmentThresholds = {
      minRepeatRate: numberEnv("DOUBLE_DOWN_REPEAT_RATE", 0.3),
      minConversionRate: numberEnv("DOUBLE_DOWN_CONVERSION_RATE", 0.02),
      minInstalls: numberEnv("DOUBLE_DOWN_MIN_INSTALLS", 50),
      maxRefundRate: numberEnv("RETIRE_MAX_REFUND_RATE", 0.15),
      minAverageRating: numberEnv("RETIRE_MIN_AVERAGE_RATING", 3.2)
    }
  ) {}

  judge(snapshot: MetricsSnapshot): Judgment {
    const reasons: string[] = [];
    if (snapshot.installs < this.thresholds.minInstalls) {
      return { action: "watch", reasons: ["sample-size-below-threshold"] };
    }
    if (
      snapshot.firstWeekRepeatRate >= this.thresholds.minRepeatRate &&
      snapshot.freeToPaidConversionRate >= this.thresholds.minConversionRate
    ) {
      reasons.push("repeat-and-conversion-above-threshold");
      return { action: "double-down", reasons };
    }
    if (snapshot.refundRate > this.thresholds.maxRefundRate) reasons.push("refund-rate-high");
    if (snapshot.averageRating > 0 && snapshot.averageRating < this.thresholds.minAverageRating) reasons.push("average-rating-low");
    if (snapshot.platformWarnings > 0) reasons.push("platform-warning-present");
    if (snapshot.maintenanceCostUsd > snapshot.projectedRevenueUsd) reasons.push("maintenance-cost-exceeds-projected-revenue");
    if (reasons.length > 0) return { action: "retire", reasons };
    return { action: "watch", reasons: ["signals-below-double-down-but-no-retire-trigger"] };
  }
}

export class JudgmentWorkflow {
  constructor(
    private readonly products: DocumentStore<ProductRecord>,
    private readonly decisionService: DecisionService,
    private readonly engine = new JudgmentEngine()
  ) {}

  async evaluate(product: ProductRecord, snapshot: MetricsSnapshot): Promise<Judgment> {
    const judgment = this.engine.judge(snapshot);
    if (judgment.action === "watch") {
      await this.products.save("products", { ...product, status: "watch", updatedAt: snapshot.capturedAt });
      return judgment;
    }
    await this.decisionService.create({
      type: judgment.action === "double-down" ? "double-down" : "retire",
      product,
      candidate: product.candidate,
      evidence: { metrics: snapshot, reasons: judgment.reasons },
      revenueRangeUsd: { low: 0, high: snapshot.projectedRevenueUsd },
      revenueBreakdown: { projectedRevenueUsd: snapshot.projectedRevenueUsd, maintenanceCostUsd: snapshot.maintenanceCostUsd },
      diffFromExisting: "Decision generated from product metrics."
    });
    return judgment;
  }
}
