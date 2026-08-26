import { ChromeStoreDataProvider, SearchDemandProvider } from "../demand/providers.js";
import { ChromeStoreSignal, ProductCandidate, SearchSignal } from "../types.js";
import { slugify } from "../utils/env.js";
import { CandidateGenerationRequest, LlmTextClient, ProductCandidateGenerator } from "./candidateGenerator.js";

export interface DemandGap {
  keyword: string;
  demandScore: number;
  competitionScore: number;
  ratingGapScore: number;
  purchaseIntentScore: number;
  b2bScore: number;
  implementationFitScore: number;
  gapScore: number;
  search: SearchSignal[];
  chromeStore: ChromeStoreSignal[];
}

const defaultSeeds = [
  "invoice reconciliation",
  "remittance advice",
  "prior authorization",
  "interview scorecard",
  "vendor invoice approval",
  "purchase order matching",
  "insurance estimate",
  "claim denial codes",
  "clinical intake form",
  "legal discovery review",
  "customer support macros",
  "sales call prep"
];

const saturatedTerms = [
  "tab manager",
  "session saver",
  "bookmark",
  "screenshot",
  "screen recorder",
  "password manager",
  "todo",
  "pomodoro",
  "dark mode",
  "ad blocker",
  "vpn",
  "translator",
  "coupon"
];

const purchaseIntentTerms = [
  "software",
  "tool",
  "template",
  "workflow",
  "portal",
  "automation",
  "service",
  "pricing",
  "subscription",
  "jobs",
  "salary",
  "form",
  "report",
  "dashboard",
  "integrations",
  "api",
  "process",
  "checklist",
  "excel",
  "download"
];

const b2bTerms = [
  "invoice",
  "remittance",
  "prior authorization",
  "authorization",
  "claim",
  "insurance",
  "billing",
  "procurement",
  "purchase order",
  "vendor",
  "compliance",
  "legal",
  "clinical",
  "healthcare",
  "recruiting",
  "ats",
  "scorecard",
  "sales",
  "crm",
  "support",
  "accounting",
  "bookkeeping",
  "payroll",
  "denial",
  "codes"
];

const lightweightTerms = [
  "template",
  "excel",
  "csv",
  "checklist",
  "form",
  "report",
  "extract",
  "copy",
  "download",
  "summary",
  "scorecard",
  "invoice",
  "remittance",
  "macro",
  "portal"
];

const heavyRiskTerms = [
  "hipaa",
  "ehr",
  "emr",
  "medical",
  "clinical",
  "patient",
  "insurance",
  "prior authorization",
  "legal compliance",
  "compliance",
  "regulated",
  "api integration",
  "oauth",
  "bank",
  "payment",
  "claims"
];

export class DataDrivenCandidateGenerator implements ProductCandidateGenerator {
  constructor(
    private readonly client: LlmTextClient,
    private readonly searchProvider: SearchDemandProvider,
    private readonly chromeStoreProvider: ChromeStoreDataProvider,
    private readonly seeds = defaultSeeds
  ) {}

  async generate(request: CandidateGenerationRequest): Promise<ProductCandidate[]> {
    const gaps = await this.discoverGaps(Math.max(request.count * 3, 8));
    if (gaps.length === 0) return [];
    const prompt = buildGapPrompt(request, gaps);
    const text = await this.client.complete(prompt);
    const parsed = JSON.parse(extractJsonArray(text)) as Array<Partial<ProductCandidate>>;
    return parsed
      .map((item, index) => normalizeCandidate(item, gaps[index] ?? gaps[0]))
      .filter((candidate) => !isSaturated(candidate))
      .slice(0, request.count);
  }

  async discoverGaps(limit: number): Promise<DemandGap[]> {
    const keywords = await this.collectKeywords(limit * 4);
    const gaps: DemandGap[] = [];
    for (const keyword of keywords) {
      const candidate = keywordCandidate(keyword);
      const [search, chromeStore] = await Promise.all([
        this.searchProvider.collect(candidate),
        this.chromeStoreProvider.collect(candidate)
      ]);
      const gap = scoreGap(keyword, search, chromeStore);
      if (gap.demandScore > 0 && gap.gapScore > 0) gaps.push(gap);
    }
    return gaps
      .sort((a, b) => b.gapScore - a.gapScore)
      .slice(0, limit);
  }

  private async collectKeywords(limit: number): Promise<string[]> {
    const output = new Set<string>();
    for (const seed of this.seeds) {
      output.add(seed);
      const signals = await this.searchProvider.collect(keywordCandidate(seed));
      for (const signal of signals) {
        for (const suggestion of signal.suggestions) {
          const keyword = normalizeKeyword(suggestion);
          if (keyword && !hasSaturatedTerm(keyword)) output.add(keyword);
          if (output.size >= limit) return [...output];
        }
      }
    }
    return [...output].slice(0, limit);
  }
}

function buildGapPrompt(request: CandidateGenerationRequest, gaps: DemandGap[]): string {
  return [
    `Generate ${request.count} Chrome extension product candidates only from the demand-supply gaps below.`,
    "Do not invent broad ideas. Each candidate must directly solve one listed keyword gap.",
    "Choose gaps with high demandScore, low competitionScore, or weak median ratings.",
    "Target a specific professional workflow, artifact, and buyer with willingness to pay.",
    "Return JSON array only with fields: name,niche,targetUser,problem,solution,keywords,permissions,marketResearch,monetization.",
    "marketResearch.estimatedSimilarExtensionCount must come from the supplied chromeStore extension counts.",
    "marketResearch.differentiation must explain why existing extensions are weak or absent.",
    "marketResearch.willingnessToPayEvidence must cite saved time, avoided errors, or paid manual work.",
    `Avoid names: ${(request.avoidNames ?? []).join(", ") || "none"}.`,
    `Focus areas: ${(request.focusAreas ?? []).join(", ") || "none"}.`,
    JSON.stringify({
      demandGaps: gaps.map((gap) => ({
        keyword: gap.keyword,
        gapScore: Number(gap.gapScore.toFixed(3)),
        demandScore: Number(gap.demandScore.toFixed(3)),
        competitionScore: Number(gap.competitionScore.toFixed(3)),
        ratingGapScore: Number(gap.ratingGapScore.toFixed(3)),
        purchaseIntentScore: Number(gap.purchaseIntentScore.toFixed(3)),
        b2bScore: Number(gap.b2bScore.toFixed(3)),
        implementationFitScore: Number(gap.implementationFitScore.toFixed(3)),
        chromeStore: gap.chromeStore.map((signal) => ({
          query: signal.query,
          extensionCount: signal.extensionCount,
          medianRating: signal.medianRating,
          medianUsers: signal.medianUsers,
          medianReviewCount: signal.medianReviewCount
        })),
        suggestions: gap.search
          .flatMap((signal) => signal.suggestions)
          .map(normalizeKeyword)
          .filter((keyword) => keyword && !hasSaturatedTerm(keyword))
          .slice(0, 8)
      }))
    })
  ].join("\n");
}

function scoreGap(keyword: string, search: SearchSignal[], chromeStore: ChromeStoreSignal[]): DemandGap {
  const demandScore = average(search.map((signal) => signal.score));
  const averageExtensionCount = average(chromeStore.map((signal) => signal.extensionCount));
  const competitionScore = clamp(averageExtensionCount / 20, 0, 1);
  const ratingGapScore = average(chromeStore.map((signal) => signal.medianRating > 0 ? clamp((4.7 - signal.medianRating) / 2, 0, 1) : 0.7));
  const purchaseIntentScore = intentScore(keyword, search, purchaseIntentTerms);
  const b2bScore = intentScore(keyword, search, b2bTerms);
  const implementationFitScore = implementationFit(keyword, search);
  const gapScore = clamp(
    demandScore *
      (0.45 + purchaseIntentScore * 0.35 + b2bScore * 0.2) *
      (0.55 + implementationFitScore * 0.45) *
      (1 - competitionScore * 0.7) *
      (0.7 + ratingGapScore * 0.3),
    0,
    1
  );
  return { keyword, demandScore, competitionScore, ratingGapScore, purchaseIntentScore, b2bScore, implementationFitScore, gapScore, search, chromeStore };
}

function normalizeCandidate(item: Partial<ProductCandidate>, gap: DemandGap): ProductCandidate {
  const name = String(item.name ?? gap.keyword).trim();
  const keywords = Array.isArray(item.keywords) ? item.keywords.map(String).filter(Boolean) : [gap.keyword];
  const permissions = Array.isArray(item.permissions) ? item.permissions.map(String).filter(Boolean) : ["activeTab", "storage"];
  const marketResearch = item.marketResearch as ProductCandidate["marketResearch"] | undefined;
  const similarCount = Math.round(average(gap.chromeStore.map((signal) => signal.extensionCount)));
  return {
    name,
    slug: slugify(name),
    platform: "chrome",
    niche: String(item.niche ?? gap.keyword),
    targetUser: String(item.targetUser ?? "browser-based professionals"),
    problem: String(item.problem ?? `Users search for ${gap.keyword}, but Chrome Web Store supply is weak.`),
    solution: String(item.solution ?? `Provide a focused workflow helper for ${gap.keyword}.`),
    keywords,
    permissions,
    marketResearch: {
      estimatedSimilarExtensionCount: Number(marketResearch?.estimatedSimilarExtensionCount ?? similarCount),
      differentiation: String(marketResearch?.differentiation ?? `Demand gap score ${gap.gapScore.toFixed(2)} with competition score ${gap.competitionScore.toFixed(2)}.`),
      willingnessToPayEvidence: String(marketResearch?.willingnessToPayEvidence ?? "Targets paid manual workflow time and error reduction."),
      gapScore: Number(marketResearch?.gapScore ?? gap.gapScore),
      implementationFitScore: Number(marketResearch?.implementationFitScore ?? gap.implementationFitScore)
    },
    monetization: {
      model: item.monetization?.model ?? "freemium",
      expectedPriceUsd: item.monetization?.expectedPriceUsd
    }
  };
}

function keywordCandidate(keyword: string): ProductCandidate {
  return {
    name: keyword,
    slug: slugify(keyword),
    platform: "chrome",
    niche: keyword,
    targetUser: "browser users",
    problem: keyword,
    solution: keyword,
    keywords: [],
    permissions: ["activeTab", "storage"],
    monetization: { model: "freemium" }
  };
}

function normalizeKeyword(value: string): string {
  const keyword = value.toLowerCase().replace(/\s+/g, " ").trim();
  if (keyword.length < 8 || keyword.length > 90) return "";
  if (!/[a-z]/.test(keyword)) return "";
  return keyword;
}

function isSaturated(candidate: ProductCandidate): boolean {
  return hasSaturatedTerm([candidate.name, candidate.niche, candidate.problem, candidate.solution, ...candidate.keywords].join(" "));
}

function hasSaturatedTerm(value: string): boolean {
  const normalized = value.toLowerCase();
  return saturatedTerms.some((term) => normalized.includes(term));
}

function intentScore(keyword: string, search: SearchSignal[], terms: string[]): number {
  const context = [
    keyword,
    ...search.flatMap((signal) => [signal.keyword, ...signal.suggestions, ...signal.relatedKeywords])
  ].join(" ").toLowerCase();
  const matches = terms.filter((term) => new RegExp(`\\b${escapeRegExp(term)}\\b`).test(context)).length;
  return clamp(matches / 5, 0, 1);
}

function implementationFit(keyword: string, search: SearchSignal[]): number {
  const light = intentScore(keyword, search, lightweightTerms);
  const heavy = intentScore(keyword, search, heavyRiskTerms);
  return clamp(0.45 + light * 0.45 - heavy * 0.55, 0, 1);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

function extractJsonArray(value: string): string {
  const start = value.indexOf("[");
  const end = value.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Could not parse generated candidate JSON array");
  }
  return value.slice(start, end + 1);
}
