import { ChromeStoreSignal, ProductCandidate, ProfitabilityScore, SearchSignal } from "../types.js";

export interface ChromeStoreDataProvider {
  collect(candidate: ProductCandidate): Promise<ChromeStoreSignal[]>;
}

export interface SearchDemandProvider {
  collect(candidate: ProductCandidate): Promise<SearchSignal[]>;
}

export interface ProfitabilityScorer {
  score(candidate: ProductCandidate, chromeStore: ChromeStoreSignal[], search: SearchSignal[]): Promise<ProfitabilityScore>;
}

export class PublicChromeStoreProvider implements ChromeStoreDataProvider {
  async collect(candidate: ProductCandidate): Promise<ChromeStoreSignal[]> {
    const queries = [candidate.niche, ...candidate.keywords].slice(0, 5);
    return Promise.all(
      queries.map(async (query) => {
        const url = `https://chromewebstore.google.com/search/${encodeURIComponent(query)}`;
        const response = await fetch(url, { headers: { "User-Agent": "smobiz-factory/0.1" } });
        if (!response.ok) {
          throw new Error(`Chrome Web Store public search failed for ${query}: ${response.status}`);
        }
        const html = await response.text();
        const userMatches = [...html.matchAll(/([\d,]+)\s+users?/gi)].map((match) => Number(match[1].replace(/,/g, "")));
        const ratingMatches = [...html.matchAll(/([1-5]\.\d)\s*(?:out of|stars?)/gi)].map((match) => Number(match[1]));
        const reviewMatches = [...html.matchAll(/([\d,]+)\s+reviews?/gi)].map((match) => Number(match[1].replace(/,/g, "")));
        return {
          query,
          extensionCount: Math.max(userMatches.length, ratingMatches.length, reviewMatches.length),
          medianUsers: median(userMatches),
          medianRating: median(ratingMatches),
          medianReviewCount: median(reviewMatches)
        };
      })
    );
  }
}

export class GoogleSuggestProvider implements SearchDemandProvider {
  async collect(candidate: ProductCandidate): Promise<SearchSignal[]> {
    const keywords = [candidate.niche, ...candidate.keywords].slice(0, 8);
    return Promise.all(
      keywords.map(async (keyword) => {
        const response = await fetch(
          `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(keyword)}`
        );
        if (!response.ok) throw new Error(`Google suggest failed for ${keyword}: ${response.status}`);
        const body = (await response.json()) as [string, string[]];
        const suggestions = body[1] ?? [];
        const relatedKeywords = suggestions
          .flatMap((suggestion) => suggestion.split(/\s+/))
          .filter((word) => word.length > 3 && !keyword.includes(word))
          .slice(0, 12);
        return {
          keyword,
          suggestions,
          relatedKeywords,
          score: Math.min(1, suggestions.length / 10)
        };
      })
    );
  }
}

export interface AnthropicOptions {
  apiKey: string;
  model?: string;
}

export class AnthropicProfitabilityScorer implements ProfitabilityScorer {
  constructor(private readonly options: AnthropicOptions) {}

  async score(candidate: ProductCandidate, chromeStore: ChromeStoreSignal[], search: SearchSignal[]): Promise<ProfitabilityScore> {
    const response = await retryFetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.options.apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: this.options.model ?? "claude-sonnet-5",
        max_tokens: 1200,
        messages: [
          {
            role: "user",
            content: [
              "Score this Chrome extension business only from the supplied evidence.",
              "Return valid JSON only. No markdown.",
              "Shape: {\"score\":0..1,\"rationale\":\"30 words or fewer\",\"revenueRangeUsd\":{\"low\":number,\"high\":number},\"costDrivers\":[string]}",
              JSON.stringify({ candidate, chromeStore, search })
            ].join("\n")
          }
        ]
      })
    });
    if (!response.ok) throw new Error(`Anthropic scoring failed: ${response.status}`);
    const body = (await response.json()) as { content?: Array<{ text?: string }> };
    const text = body.content?.map((part) => part.text ?? "").join("\n") ?? "";
    const json = extractJson(text);
    return normalizeProfitability(JSON.parse(json));
  }
}

async function retryFetch(url: string, init: RequestInit, attempts = 3): Promise<Response> {
  let response: Response | undefined;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    response = await fetch(url, init);
    if (![429, 500, 502, 503, 529].includes(response.status)) return response;
    if (attempt < attempts) await delay(500 * attempt);
  }
  return response!;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class HeuristicProfitabilityScorer implements ProfitabilityScorer {
  async score(_candidate: ProductCandidate, chromeStore: ChromeStoreSignal[], search: SearchSignal[]): Promise<ProfitabilityScore> {
    const competition = average(chromeStore.map((item) => Math.min(1, item.medianUsers / 100000)));
    const demand = average(search.map((item) => item.score));
    const ratingGap = average(chromeStore.map((item) => (item.medianRating > 0 ? Math.max(0, 4.5 - item.medianRating) / 4.5 : 0.4)));
    const score = clamp(demand * 0.5 + competition * 0.25 + ratingGap * 0.25, 0, 1);
    return {
      score,
      rationale: `Heuristic score from search demand ${demand.toFixed(2)}, market size ${competition.toFixed(2)}, rating gap ${ratingGap.toFixed(2)}.`,
      revenueRangeUsd: {
        low: Math.round(score * 100),
        high: Math.round(score * 2000)
      },
      costDrivers: ["support", "store-review", "minor-maintenance"]
    };
  }
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

function extractJson(value: string): string {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Could not parse profitability JSON");
  }
  return value.slice(start, end + 1);
}

function normalizeProfitability(raw: unknown): ProfitabilityScore {
  const value = raw as ProfitabilityScore;
  return {
    score: clamp(Number(value.score), 0, 1),
    rationale: String(value.rationale ?? ""),
    revenueRangeUsd: {
      low: Number(value.revenueRangeUsd?.low ?? 0),
      high: Number(value.revenueRangeUsd?.high ?? 0)
    },
    costDrivers: Array.isArray(value.costDrivers) ? value.costDrivers.map(String) : []
  };
}
