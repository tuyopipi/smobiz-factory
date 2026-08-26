export type Platform = "chrome";

export interface ProductCandidate {
  name: string;
  slug: string;
  platform: Platform;
  niche: string;
  targetUser: string;
  problem: string;
  solution: string;
  keywords: string[];
  permissions: string[];
  marketResearch?: {
    estimatedSimilarExtensionCount: number;
    differentiation: string;
    willingnessToPayEvidence: string;
    gapScore?: number;
    implementationFitScore?: number;
  };
  monetization: {
    model: "free" | "freemium" | "paid" | "subscription";
    expectedPriceUsd?: number;
  };
}

export interface ChromeStoreSignal {
  query: string;
  extensionCount: number;
  medianUsers: number;
  medianRating: number;
  medianReviewCount: number;
}

export interface SearchSignal {
  keyword: string;
  suggestions: string[];
  relatedKeywords: string[];
  score: number;
}

export interface ProfitabilityScore {
  score: number;
  rationale: string;
  revenueRangeUsd: {
    low: number;
    high: number;
  };
  costDrivers: string[];
}

export interface DemandEvidence {
  chromeStore: ChromeStoreSignal[];
  search: SearchSignal[];
  profitability: ProfitabilityScore;
  prelaunchScore: number;
  passed: boolean;
  reasons: string[];
}

export interface ProductRecord {
  id: string;
  candidate: ProductCandidate;
  fingerprint: string;
  status: "draft" | "pending_ship" | "published" | "watch" | "retired";
  createdAt: string;
  updatedAt: string;
}

export interface ExtensionBuild {
  files: Record<string, string | Buffer>;
  manifest: Record<string, unknown>;
  storeListing: {
    title: string;
    summary: string;
    description: string;
    category: string;
  };
}

export interface PackagedExtension {
  zipPath: string;
  sizeBytes: number;
  sha256: string;
}

export type DecisionType = "ship" | "double-down" | "retire";
export type DecisionStatus = "pending" | "approved" | "rejected";

export interface Decision {
  id: string;
  type: DecisionType;
  status: DecisionStatus;
  productId: string;
  preview: Record<string, unknown>;
  evidence: DemandEvidence | Record<string, unknown>;
  revenueRangeUsd: { low: number; high: number };
  revenueBreakdown: Record<string, number | string>;
  diffFromExisting: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetricsSnapshot {
  id: string;
  productId: string;
  installs: number;
  firstWeekRepeatRate: number;
  freeToPaidConversionRate: number;
  refundRate: number;
  averageRating: number;
  platformWarnings: number;
  maintenanceCostUsd: number;
  projectedRevenueUsd: number;
  reviews: number;
  capturedAt: string;
}

export interface Judgment {
  action: "double-down" | "watch" | "retire";
  reasons: string[];
}

export interface CandidateScoreRecord {
  id: string;
  candidate: ProductCandidate;
  prelaunchScore: number;
  profitabilityScore: number;
  gapScore: number;
  implementationFitScore: number;
  overallScore: number;
  rationale: string;
  reasons: string[];
  createdAt: string;
}
