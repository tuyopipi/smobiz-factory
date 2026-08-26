import { ProductCandidate } from "../types.js";
import { slugify } from "../utils/env.js";

export interface CandidateGenerationRequest {
  count: number;
  avoidNames?: string[];
  focusAreas?: string[];
}

export interface LlmTextClient {
  complete(prompt: string): Promise<string>;
}

export interface ProductCandidateGenerator {
  generate(request: CandidateGenerationRequest): Promise<ProductCandidate[]>;
}

export class OpenAiTextClient implements LlmTextClient {
  constructor(private readonly apiKey: string, private readonly model = "gpt-4o-mini") {}

  async complete(prompt: string): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8
      })
    });
    if (!response.ok) throw new Error(`OpenAI generation failed: ${response.status}`);
    const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return body.choices?.[0]?.message?.content ?? "";
  }
}

export class CandidateGenerator implements ProductCandidateGenerator {
  private readonly forbiddenPermissions = new Set(["<all_urls>", "webRequestBlocking", "debugger", "nativeMessaging"]);
  private readonly saturatedTerms = [
    "tab management",
    "tab manager",
    "session saver",
    "bookmark",
    "screenshot",
    "screen recorder",
    "password",
    "todo",
    "to-do",
    "pomodoro",
    "dark mode",
    "ad blocker",
    "vpn",
    "grammar",
    "translator",
    "pdf",
    "coupon",
    "weather",
    "compliance management",
    "field service management",
    "academic administration"
  ];

  constructor(private readonly client: LlmTextClient) {}

  async generate(request: CandidateGenerationRequest): Promise<ProductCandidate[]> {
    const prompt = [
      `Generate ${request.count} narrow, single-purpose Chrome extension product candidates for underserved browser workflows.`,
      "Hard exclusions: do not propose generic or saturated categories such as tab management, session saver, bookmark tools, screenshot tools, screen recorders, PDF tools, password managers, todo lists, Pomodoro timers, dark mode, ad blockers, VPNs, grammar checkers, translators, coupon tools, or generic productivity helpers.",
      "Also reject broad business-software buckets such as compliance management, field service management, academic administration, generic automation, dashboards, reporting, checklists, CRM helpers, or generic form helpers.",
      "Target a specific profession and a concrete workflow pain that happens in a browser and is currently handled manually. The target user must be specific enough to name a job role and a work artifact.",
      "The niche must be a long-tail workflow phrase, not a broad category. It should mention the role, browser surface, and artifact, for example: insurance adjusters extracting roof-damage line items from carrier portals; recruiting coordinators reconciling interview scorecards in Greenhouse-like ATS pages; bookkeepers matching remittance notes to invoice rows in client portals.",
      "Candidate names must reflect the narrow workflow. Avoid generic names like Compliance Tracker, Invoice Validator, Review Helper, or Management Assistant.",
      "Prefer B2B or prosumer workflows with clear willingness to pay: compliance work, client deliverables, repetitive review/QA, regulated documentation, revenue operations, recruiting, bookkeeping, legal/admin intake, healthcare admin, education admin, procurement, or field-service back office tasks.",
      "Each candidate must describe a pain that a user already spends time or money solving manually, and the extension must save time, reduce errors, or create a billable/client-facing artifact.",
      "Prefer pains where a solo user or small team could pay $5-$29/month without enterprise procurement because the extension saves at least 20 minutes per use or prevents costly rework.",
      "For every candidate, self-report estimatedSimilarExtensionCount, differentiation, and willingnessToPayEvidence. Exclude your own candidates if estimatedSimilarExtensionCount is above 8, differentiation is weak/generic, or willingness-to-pay evidence is only speculative.",
      "Avoid broad permissions, trademark-like names, and vague productivity tools. Use the narrowest Chrome permissions that implement the workflow.",
      "Return JSON array only with fields: name,niche,targetUser,problem,solution,keywords,permissions,marketResearch,monetization.",
      "marketResearch shape: {estimatedSimilarExtensionCount:number,differentiation:string,willingnessToPayEvidence:string}.",
      `Avoid names: ${(request.avoidNames ?? []).join(", ") || "none"}.`,
      `Focus areas: ${(request.focusAreas ?? []).join(", ") || "specific paid professional workflows with weak Chrome extension competition"}.`
    ].join("\n");
    const text = await this.client.complete(prompt);
    const parsed = JSON.parse(extractJsonArray(text)) as Array<Partial<ProductCandidate>>;
    return parsed
      .map((item) => this.normalize(item))
      .filter((candidate) => candidate.permissions.every((permission) => !this.forbiddenPermissions.has(permission)))
      .filter((candidate) => !this.isSaturated(candidate))
      .filter((candidate) => (candidate.marketResearch?.estimatedSimilarExtensionCount ?? 0) <= 15)
      .filter((candidate) => Boolean(candidate.marketResearch?.differentiation.trim()))
      .filter((candidate) => Boolean(candidate.marketResearch?.willingnessToPayEvidence.trim()))
      .slice(0, request.count);
  }

  private normalize(item: Partial<ProductCandidate>): ProductCandidate {
    const name = String(item.name ?? "").trim();
    if (!name) throw new Error("Generated candidate is missing name");
    const keywords = Array.isArray(item.keywords) ? item.keywords.map(String).filter(Boolean) : [];
    const permissions = Array.isArray(item.permissions) ? item.permissions.map(String).filter(Boolean) : [];
    const marketResearch = item.marketResearch as ProductCandidate["marketResearch"] | undefined;
    return {
      name,
      slug: slugify(name),
      platform: "chrome",
      niche: String(item.niche ?? keywords[0] ?? name),
      targetUser: String(item.targetUser ?? "browser users"),
      problem: String(item.problem ?? ""),
      solution: String(item.solution ?? ""),
      keywords,
      permissions,
      marketResearch: {
        estimatedSimilarExtensionCount: Number(marketResearch?.estimatedSimilarExtensionCount ?? 0),
        differentiation: String(marketResearch?.differentiation ?? ""),
        willingnessToPayEvidence: String(marketResearch?.willingnessToPayEvidence ?? "")
      },
      monetization: {
        model: item.monetization?.model ?? "freemium",
        expectedPriceUsd: item.monetization?.expectedPriceUsd
      }
    };
  }

  private isSaturated(candidate: ProductCandidate): boolean {
    const haystack = [
      candidate.name,
      candidate.niche,
      candidate.problem,
      candidate.solution,
      ...candidate.keywords
    ].join(" ").toLowerCase();
    return this.saturatedTerms.some((term) => new RegExp(`\\b${escapeRegExp(term)}\\b`).test(haystack));
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractJsonArray(value: string): string {
  const start = value.indexOf("[");
  const end = value.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Could not parse generated candidate JSON array");
  }
  return value.slice(start, end + 1);
}
