import { DocumentStore } from "../db/firestore.js";
import { DemandEvidence, MetricsSnapshot, ProductCandidate, ProductRecord } from "../types.js";

export interface RankedCandidate {
  candidate: ProductCandidate;
  evidence: DemandEvidence;
  fingerprint: string;
  finalScore: number;
  demandScore: number;
  feedbackScore: number;
  feedbackApplied: boolean;
  feedbackMatches: number;
}

export interface GenerationHints {
  focusAreas: string[];
  avoidNames: string[];
}

interface HistoricalOutcome {
  product: ProductRecord;
  metrics: MetricsSnapshot | undefined;
  weight: number;
}

export class CandidateFeedbackScorer {
  constructor(
    private readonly products: DocumentStore<ProductRecord>,
    private readonly metrics: DocumentStore<MetricsSnapshot>,
    private readonly options = {
      minRepeatRate: 0.3,
      minConversionRate: 0.02,
      minFeedbackInstalls: 50,
      maxPositiveBoost: 0.35,
      maxNegativePenalty: 0.45
    }
  ) {}

  async generationHints(): Promise<GenerationHints> {
    const outcomes = await this.loadOutcomes();
    const winners = outcomes
      .filter((outcome) => outcome.weight > 0)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map((outcome) => `${outcome.product.candidate.niche} for ${outcome.product.candidate.targetUser}`);
    const avoidNames = outcomes
      .filter((outcome) => outcome.weight < 0)
      .map((outcome) => outcome.product.candidate.name)
      .slice(0, 20);
    return { focusAreas: winners, avoidNames };
  }

  async rank(input: Array<{ candidate: ProductCandidate; evidence: DemandEvidence; fingerprint: string }>): Promise<RankedCandidate[]> {
    const outcomes = await this.loadOutcomes();
    return input
      .map((item) => {
        const demandScore = demandScoreOf(item.evidence);
        const feedback = this.feedbackFor(item.candidate, outcomes);
        return {
          ...item,
          demandScore,
          feedbackScore: feedback.score,
          feedbackApplied: feedback.applied,
          feedbackMatches: feedback.matches,
          finalScore: clamp(demandScore + feedback.score, 0, 1)
        };
      })
      .sort((a, b) => {
        if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
        return b.demandScore - a.demandScore;
      });
  }

  private feedbackFor(candidate: ProductCandidate, outcomes: HistoricalOutcome[]): { score: number; applied: boolean; matches: number } {
    if (outcomes.length === 0) return { score: 0, applied: false, matches: 0 };
    const candidateFeatures = featureSet(candidate);
    let weighted = 0;
    let matches = 0;
    for (const outcome of outcomes) {
      const similarity = jaccard(candidateFeatures, featureSet(outcome.product.candidate));
      if (similarity <= 0) continue;
      weighted += similarity * outcome.weight;
      matches += 1;
    }
    if (matches === 0) return { score: 0, applied: true, matches: 0 };
    return {
      score: clamp(weighted, -this.options.maxNegativePenalty, this.options.maxPositiveBoost),
      applied: true,
      matches
    };
  }

  private async loadOutcomes(): Promise<HistoricalOutcome[]> {
    const [products, snapshots] = await Promise.all([this.products.list("products"), this.metrics.list("metrics")]);
    const latestMetrics = latestMetricsByProduct(snapshots);
    return products
      .map((product) => {
        const metrics = latestMetrics.get(product.id);
        const weight = outcomeWeight(product, metrics, this.options);
        return weight === 0 ? undefined : { product, metrics, weight };
      })
      .filter((value): value is HistoricalOutcome => value !== undefined);
  }
}

function demandScoreOf(evidence: DemandEvidence): number {
  return clamp(evidence.prelaunchScore, 0, 1);
}

function outcomeWeight(
  product: ProductRecord,
  metrics: MetricsSnapshot | undefined,
  options: {
    minRepeatRate: number;
    minConversionRate: number;
    minFeedbackInstalls: number;
    maxPositiveBoost: number;
    maxNegativePenalty: number;
  }
): number {
  if (!metrics) return 0;
  if (metrics.installs < options.minFeedbackInstalls) return 0;
  if (product.status === "retired") return -options.maxNegativePenalty;
  const hit =
    metrics.firstWeekRepeatRate >= options.minRepeatRate &&
    metrics.freeToPaidConversionRate >= options.minConversionRate;
  if (hit) {
    const repeatSignal = Math.min(1, metrics.firstWeekRepeatRate / Math.max(options.minRepeatRate, 0.001));
    const conversionSignal = Math.min(1, metrics.freeToPaidConversionRate / Math.max(options.minConversionRate, 0.001));
    return ((repeatSignal + conversionSignal) / 2) * options.maxPositiveBoost;
  }
  const miss =
    metrics.refundRate > 0.15 ||
    metrics.platformWarnings > 0 ||
    (metrics.averageRating > 0 && metrics.averageRating < 3.2) ||
    metrics.maintenanceCostUsd > metrics.projectedRevenueUsd;
  if (miss) return -options.maxNegativePenalty;
  return 0;
}

function latestMetricsByProduct(snapshots: MetricsSnapshot[]): Map<string, MetricsSnapshot> {
  const latest = new Map<string, MetricsSnapshot>();
  for (const snapshot of snapshots) {
    const existing = latest.get(snapshot.productId);
    if (!existing || snapshot.capturedAt > existing.capturedAt) {
      latest.set(snapshot.productId, snapshot);
    }
  }
  return latest;
}

function featureSet(candidate: ProductCandidate): Set<string> {
  const parts = [
    `niche:${candidate.niche}`,
    `target:${candidate.targetUser}`,
    `model:${candidate.monetization.model}`,
    ...candidate.permissions.map((permission) => `permission:${permission}`),
    ...candidate.keywords.map((keyword) => `keyword:${keyword}`)
  ];
  return new Set(
    parts
      .join(" ")
      .toLowerCase()
      .split(/[^a-z0-9:]+/)
      .filter((token) => token.length > 2)
  );
}

function jaccard(left: Set<string>, right: Set<string>): number {
  const union = new Set([...left, ...right]);
  if (union.size === 0) return 0;
  let intersection = 0;
  for (const value of left) {
    if (right.has(value)) intersection += 1;
  }
  return intersection / union.size;
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}
