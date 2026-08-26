import { DemandEvidence, ProductCandidate } from "../types.js";
import { ChromeStoreDataProvider, ProfitabilityScorer, SearchDemandProvider } from "./providers.js";

export interface DemandThresholds {
  minSearchScore: number;
  minProfitabilityScore: number;
  minPrelaunchScore: number;
  chromeStoreUserSignalThreshold: number;
}

export class DemandValidator {
  constructor(
    private readonly chromeStoreProvider: ChromeStoreDataProvider,
    private readonly searchProvider: SearchDemandProvider,
    private readonly profitabilityScorer: ProfitabilityScorer,
    private readonly thresholds: DemandThresholds = {
      minSearchScore: 0.12,
      minProfitabilityScore: 0.25,
      minPrelaunchScore: 0.28,
      chromeStoreUserSignalThreshold: 500
    }
  ) {}

  async validate(candidate: ProductCandidate): Promise<DemandEvidence> {
    const chromeStore = await this.chromeStoreProvider.collect(candidate);
    const search = await this.searchProvider.collect(candidate);
    const profitability = await this.profitabilityScorer.score(candidate, chromeStore, search);
    const prelaunchScore = this.prelaunchScore(search, profitability.score, chromeStore);
    const reasons: string[] = [];

    if (!search.some((signal) => signal.score >= this.thresholds.minSearchScore)) {
      reasons.push("search-demand-below-threshold");
    }
    if (profitability.score < this.thresholds.minProfitabilityScore) {
      reasons.push("profitability-below-threshold");
    }
    if (prelaunchScore < this.thresholds.minPrelaunchScore) {
      reasons.push("prelaunch-score-below-threshold");
    }

    return {
      chromeStore,
      search,
      profitability,
      prelaunchScore,
      passed: reasons.length === 0,
      reasons
    };
  }

  private prelaunchScore(search: Awaited<ReturnType<SearchDemandProvider["collect"]>>, profitabilityScore: number, chromeStore: Awaited<ReturnType<ChromeStoreDataProvider["collect"]>>): number {
    const searchScore = average(search.map((signal) => signal.score));
    const chromeAdjustment = chromeStoreAdjustment(chromeStore, this.thresholds.chromeStoreUserSignalThreshold);
    return clamp(profitabilityScore * 0.65 + searchScore * 0.35 + chromeAdjustment, 0, 1);
  }
}

function chromeStoreAdjustment(chromeStore: Awaited<ReturnType<ChromeStoreDataProvider["collect"]>>, userSignalThreshold: number): number {
  const usable = chromeStore.filter((signal) => signal.medianUsers > 0 || signal.medianReviewCount > 0);
  if (usable.length === 0) return 0;
  const userScore = average(usable.map((signal) => Math.min(1, signal.medianUsers / userSignalThreshold)));
  const reviewScore = average(usable.map((signal) => Math.min(1, signal.medianReviewCount / 50)));
  const ratingScore = average(usable.map((signal) => signal.medianRating > 0 ? (signal.medianRating - 3.5) / 10 : 0));
  return clamp((userScore * 0.04) + (reviewScore * 0.03) + ratingScore, -0.05, 0.08);
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}
