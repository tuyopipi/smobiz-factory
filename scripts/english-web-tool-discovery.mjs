import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { combineOpportunityScore, competitorPainForKeyword } from "./discovery-pain.mjs";
import { passesPaidNicheCriteria, scorePaidNiche } from "./niche-criteria.mjs";

const count = Number(process.env.COUNT ?? 5);
const keywordLimit = Number(process.env.KEYWORD_LIMIT ?? 45);
const outDir = "artifacts/english-web-tool-discovery";

const seeds = [
  "tax preparer client document checklist",
  "tax preparer client organizer template",
  "tax preparer client checklist",
  "bookkeeper monthly close checklist",
  "bookkeeper client onboarding checklist",
  "bookkeeper client onboarding form",
  "freelancer retainer scope template",
  "freelance retainer agreement template",
  "consultant client intake form template",
  "consultant proposal template",
  "consultant client report template",
  "notary appointment checklist",
  "landlord rent ledger template",
  "cleaning business quote calculator",
  "realtor open house follow up tracker",
  "therapist private pay invoice template",
  "coach client progress tracker",
  "paralegal case intake checklist",
  "small business owner cash flow worksheet",
  "contractor change order template",
  "agency client onboarding checklist",
  "developer maintenance retainer calculator",
  "sole proprietor quarterly tax worksheet",
  "bookkeeper client onboarding checklist",
  "tax preparer fee calculator",
  "consultant project estimate template",
  "freelancer late payment reminder template"
];

const allowedCategoryTerms = [
  "pdf",
  "invoice",
  "quote",
  "estimate",
  "contract",
  "signature",
  "booking",
  "appointment",
  "schedule",
  "form",
  "spreadsheet",
  "email",
  "screenshot",
  "image",
  "thumbnail",
  "csv",
  "json",
  "xml",
  "api",
  "regex",
  "checklist",
  "calculator",
  "tracker",
  "worksheet",
  "intake",
  "retainer",
  "client",
  "bookkeeper",
  "tax preparer",
  "consultant",
  "freelancer",
  "contractor",
  "notary",
  "landlord",
  "realtor",
  "therapist",
  "coach",
  "paralegal",
  "developer"
];

const purchaseIntentTerms = [
  "tool",
  "generator",
  "converter",
  "template",
  "software",
  "pricing",
  "free",
  "online",
  "download",
  "create",
  "maker",
  "formatter",
  "tester",
  "builder",
  "automation",
  "checklist",
  "calculator",
  "tracker",
  "worksheet",
  "intake",
  "retainer",
  "client"
];

const easyTerms = [
  "generator",
  "converter",
  "formatter",
  "template",
  "tester",
  "builder",
  "resize",
  "compress",
  "annotate",
  "csv",
  "json",
  "xml",
  "pdf",
  "screenshot",
  "thumbnail",
  "form",
  "checklist",
  "calculator",
  "tracker",
  "worksheet",
  "intake"
];

const hardTerms = [
  "bank",
  "payment processor",
  "oauth",
  "ehr",
  "hipaa",
  "medical",
  "legal advice",
  "tax filing",
  "payroll filing",
  "accounting integration",
  "salesforce",
  "quickbooks api"
];

const knownCompetitors = [
  "adobe",
  "smallpdf",
  "ilovepdf",
  "canva",
  "jotform",
  "typeform",
  "zapier",
  "make.com",
  "calendly",
  "docuSign",
  "pandadoc",
  "stripe",
  "quickbooks",
  "freshbooks",
  "invoice ninja",
  "regex101",
  "jsonformatter",
  "cloudconvert",
  "taxdome",
  "canopy",
  "jetpack workflow",
  "ignition",
  "honeybook",
  "dubsado",
  "bidsketch",
  "jobber",
  "housecall pro",
  "notary gadget",
  "stessa"
].map((value) => value.toLowerCase());

const toolWords = ["tool", "generator", "converter", "template", "software", "free", "online", "app", "builder", "formatter", "tester"];

await mkdir(outDir, { recursive: true });

const keywords = await collectKeywords();
const scored = [];
for (const keyword of keywords) {
  const suggestions = await googleSuggest(keyword);
  const competition = await webToolCompetition(keyword);
  const baseScore = scoreKeyword(keyword, suggestions, competition);
  const competitorPain = await competitorPainForKeyword(keyword, competition, {
    googleSuggest,
    webSearchSnippets,
    delay
  });
  scored.push(enrichWithCompetitorPain(baseScore, competitorPain));
  await delay(150);
}

const ranked = uniqueByKeyword(scored)
  .filter((item) => passesPaidNicheCriteria(item))
  .sort((a, b) => b.paidNiche.paidNicheScore - a.paidNiche.paidNicheScore || b.opportunityScore - a.opportunityScore)
  .slice(0, count)
  .map((item) => ({ ...item, candidate: candidateFor(item) }));

const rejected = process.env.DEBUG_REJECTS
  ? uniqueByKeyword(scored)
    .filter((item) => !passesPaidNicheCriteria(item))
    .sort((a, b) => b.paidNiche.paidNicheScore - a.paidNiche.paidNicheScore)
    .slice(0, 12)
    .map((item) => ({
      keyword: item.keyword,
      searchDemand: item.searchDemand,
      demandScore: item.demandScore,
      topToolResults: item.competition?.topToolResults ?? 0,
      knownCompetitorMentions: item.competition?.knownCompetitorMentions ?? 0,
      competitors: item.competitorPain?.competitors ?? [],
      paidNiche: item.paidNiche
    }))
  : undefined;

const payload = {
  generatedAt: new Date().toISOString(),
  count,
  spec: "SPEC_BIBLE.md",
  source: {
    demand: "Google Suggest en-US",
    competition: "Bing web search en-US",
    competitorPain: "Google Suggest + Bing snippets for alternatives, negative searches, reviews, Reddit/forums",
    marketing: "Paid niche self-serve workflow: buyer = user, browser-only, repeat use, proven paid market"
  },
  results: ranked,
  ...(rejected ? { rejected } : {})
};

await writeFile(join(outDir, "latest.json"), JSON.stringify(payload, null, 2));
console.log(JSON.stringify(payload, null, 2));

async function collectKeywords() {
  const output = new Set(seeds);
  for (const seed of seeds) {
    const suggestions = await googleSuggest(seed);
    for (const suggestion of suggestions) {
      const keyword = normalizeKeyword(suggestion);
      if (keyword && allowedCategoryTerms.some((term) => keyword.includes(term))) output.add(keyword);
    }
  }
  return [...output].slice(0, keywordLimit);
}

async function googleSuggest(keyword) {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=${encodeURIComponent(keyword)}`;
  const response = await retryFetch(url, { headers: { "User-Agent": "smobiz-factory/0.1" } });
  if (!response.ok) return [];
  const body = await response.json();
  return Array.isArray(body?.[1]) ? body[1].map(String).slice(0, 10) : [];
}

async function webToolCompetition(keyword) {
  const query = `${keyword} software tool pricing`;
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&cc=us&mkt=en-US&setlang=en`;
  const response = await retryFetch(url, { headers: { "User-Agent": "Mozilla/5.0 smobiz-factory/0.1" } });
  if (!response.ok) {
    return {
      query,
      resultCount: 0,
      topToolResults: 5,
      toolMentions: 30,
      knownCompetitorMentions: 3,
      examples: [`competition check unavailable: HTTP ${response.status}`],
      unavailable: true
    };
  }
  const html = await response.text();
  const text = normalizeText(stripTags(html));
  const blocks = [...html.matchAll(/<li class="b_algo"[\s\S]*?<\/li>/g)]
    .map((match) => stripTags(match[0]).replace(/\s+/g, " ").trim())
    .filter((block) => block.length > 20)
    .slice(0, 10);
  const competitors = extractCompetitorsFromBing(html, blocks);
  const topToolResults = blocks.filter((block) => {
    const normalized = normalizeText(block);
    return toolWords.some((term) => normalized.includes(term)) || knownCompetitors.some((term) => normalized.includes(term));
  }).length;
  return {
    query,
    resultCount: blocks.length,
    topToolResults,
    toolMentions: toolWords.reduce((sum, term) => sum + occurrences(text, term), 0),
    knownCompetitorMentions: knownCompetitors.reduce((sum, term) => sum + occurrences(text, term), 0),
    competitors,
    examples: blocks.slice(0, 4).map((block) => block.slice(0, 160))
  };
}

async function webSearchSnippets(query) {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&cc=us&mkt=en-US&setlang=en`;
  const response = await retryFetch(url, { headers: { "User-Agent": "Mozilla/5.0 smobiz-factory/0.1" } });
  if (!response.ok) return [`snippet check unavailable: HTTP ${response.status}`];
  const html = await response.text();
  return [...html.matchAll(/<li class="b_algo"[\s\S]*?<\/li>/g)]
    .map((match) => stripTags(match[0]).replace(/\s+/g, " ").trim())
    .filter((block) => block.length > 20)
    .slice(0, 5);
}

function scoreKeyword(keyword, suggestions, competition) {
  const context = normalizeText([keyword, ...suggestions].join(" "));
  const demandScore = clamp((suggestions.length / 10) * 0.72 + exactSuggestionBoost(keyword, suggestions) * 0.28, 0, 1);
  const purchaseIntentScore = termScore(context, purchaseIntentTerms);
  const categoryFitScore = termScore(context, allowedCategoryTerms);
  const implementationEaseScore = clamp(0.4 + termScore(context, easyTerms) * 0.6 - termScore(context, hardTerms) * 0.55, 0, 1);
  const seoSpecificityScore = longTailScore(keyword);
  const competitionFullness = clamp(
    competition.topToolResults / 8 * 0.45 +
      competition.knownCompetitorMentions / 10 * 0.35 +
      competition.toolMentions / 70 * 0.2,
    0,
    1
  );
  const competitionThinnessScore = 1 - competitionFullness;
  const gapScore = clamp(
    demandScore *
      (0.25 + purchaseIntentScore * 0.25 + categoryFitScore * 0.25 + seoSpecificityScore * 0.25) *
      (0.45 + implementationEaseScore * 0.55) *
      (0.35 + competitionThinnessScore * 0.65),
    0,
    1
  );
  return {
    keyword,
    suggestions,
    searchDemand: suggestions.length,
    demandScore: round(demandScore),
    purchaseIntentScore: round(purchaseIntentScore),
    categoryFitScore: round(categoryFitScore),
    seoSpecificityScore: round(seoSpecificityScore),
    implementationEaseScore: round(implementationEaseScore),
    competitionThinnessScore: round(competitionThinnessScore),
    gapScore: round(gapScore),
    competition,
    risk: riskFor(keyword, suggestions)
  };
}

function enrichWithCompetitorPain(item, competitorPain) {
  const competitorPainScore = competitorPain.competitorPainScore ?? 0;
  const hasConcretePain = (competitorPain.painPoints ?? []).length > 0;
  const enriched = {
    ...item,
    competitorPainScore,
    opportunityScore: combineOpportunityScore(item.gapScore, competitorPainScore, hasConcretePain),
    competitorPain,
    differentiationPoints: competitorPain.differentiationPoints ?? [],
    painPoints: competitorPain.painPoints ?? []
  };
  return {
    ...enriched,
    paidNiche: scorePaidNiche(enriched)
  };
}

function candidateFor(item) {
  const keyword = item.keyword;
  const lower = normalizeText(keyword);
  const base = {
    primaryKeyword: keyword,
    seoTitle: `${titleCase(keyword)} | Fast Online Tool`,
    metaDescription: `Use this ${keyword} tool to finish the task online without installing software. Simple UX, inline help, FAQ, and export-ready output.`,
    h1: titleCase(keyword),
    indieHackersPost: `I built a tiny ${keyword} tool because the existing options felt too broad or overbuilt. It is focused on one workflow, has inline help, and is meant to be useful without a sales call.`,
    painPoints: item.painPoints ?? [],
    differentiationPoints: item.differentiationPoints ?? [],
    painSolvingFeatures: item.differentiationPoints ?? []
  };
  if (lower.includes("tax preparer") || lower.includes("quarterly tax")) {
    return {
      ...base,
      name: "Tax Preparer Client Document Checklist",
      category: "Tax workflow",
      concept: "Build a repeatable client document request checklist with missing-item follow-up text and monthly or seasonal reuse."
    };
  }
  if (lower.includes("bookkeeper") || lower.includes("monthly close")) {
    return {
      ...base,
      name: "Bookkeeper Monthly Close Checklist",
      category: "Bookkeeping workflow",
      concept: "Track recurring close tasks, missing client documents, review notes, and copy-ready follow-up messages."
    };
  }
  if (lower.includes("bookkeeping") && lower.includes("onboarding")) {
    return {
      ...base,
      name: "Bookkeeper Client Onboarding Checklist Builder",
      category: "Bookkeeping workflow",
      concept: "Build a repeatable bookkeeping client onboarding checklist, missing-document list, and follow-up message without practice-management software."
    };
  }
  if (lower.includes("retainer") || lower.includes("maintenance retainer")) {
    return {
      ...base,
      name: "Retainer Scope Calculator",
      category: "Client billing",
      concept: "Estimate recurring retainer scope, included hours, overage terms, and a client-ready scope summary."
    };
  }
  if (lower.includes("client intake") || lower.includes("case intake") || lower.includes("onboarding checklist")) {
    return {
      ...base,
      name: "Client Intake Checklist Builder",
      category: "Client workflow",
      concept: "Create a profession-specific client intake checklist and follow-up message without CRM setup."
    };
  }
  if (lower.includes("quote calculator") || lower.includes("estimate template") || lower.includes("change order")) {
    return {
      ...base,
      name: "Small Business Quote Calculator",
      category: "Client billing",
      concept: "Calculate line items, margin, change order notes, and a client-ready quote summary for repeat service work."
    };
  }
  if (lower.includes("rent ledger")) {
    return {
      ...base,
      name: "Landlord Rent Ledger Builder",
      category: "Property workflow",
      concept: "Build a monthly rent ledger, late fee notes, and copy-ready tenant balance summary."
    };
  }
  if (lower.includes("progress tracker") || lower.includes("follow up tracker")) {
    return {
      ...base,
      name: "Client Follow-up Tracker",
      category: "Client workflow",
      concept: "Track repeat client follow-ups, next actions, due dates, and copy-ready reminder text."
    };
  }
  if (lower.includes("csv") && lower.includes("json")) {
    return {
      ...base,
      name: "CSV to JSON Schema Mapper",
      category: "Data formatting",
      concept: "Paste CSV, infer column types, map fields, and export JSON or sample API payloads."
    };
  }
  if (lower.includes("api") || lower.includes("json")) {
    return {
      ...base,
      name: "API Response Formatter",
      category: "Data formatting",
      concept: "Paste raw API responses, format JSON/XML, collapse noisy fields, and copy clean examples for docs or debugging."
    };
  }
  if (lower.includes("invoice")) {
    return {
      ...base,
      name: "Freelancer Invoice PDF Generator",
      category: "Documents",
      concept: "Generate clean invoice PDFs for freelancers with saved line items, tax fields, and Stripe payment-link placeholders."
    };
  }
  if (lower.includes("contract")) {
    return {
      ...base,
      name: "Freelance Contract Template Builder",
      category: "Documents",
      concept: "Build a plain-English freelance contract draft from project scope, fee, revision, deadline, and ownership choices."
    };
  }
  if (lower.includes("screenshot")) {
    return {
      ...base,
      name: "Screenshot Annotation Generator",
      category: "Image and screenshot tools",
      concept: "Upload a screenshot, add numbered callouts/arrows, resize for docs, and export a clean annotated PNG."
    };
  }
  return {
    ...base,
    name: `${titleCase(keyword)} Mini Tool`,
    category: "Simple web tool",
    concept: `A focused online tool for ${keyword} with export-ready output, FAQ, and inline help.`
  };
}

function riskFor(keyword, suggestions) {
  const context = normalizeText([keyword, ...suggestions].join(" "));
  if (["hipaa", "medical", "tax filing", "legal advice", "bank", "payroll filing"].some((term) => context.includes(term))) return "high";
  if (["contract", "signature", "tax", "payment"].some((term) => context.includes(term))) return "medium";
  return "low";
}

function extractCompetitorsFromBing(html, blocks) {
  const output = new Set();
  const titleMatches = [...html.matchAll(/<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/g)].slice(0, 8);
  for (const match of titleMatches) {
    const href = decodeHtml(match[1]);
    const title = stripTags(match[2]).replace(/\s+/g, " ").trim();
    const host = hostFromUrl(href);
    const hostName = host.replace(/^www\./, "").split(".")[0];
    if (hostName && !["bing", "google", "youtube", "office", "docs", "workspace"].includes(hostName)) output.add(hostName);
    const titleName = title.split(/[|-]/)[0].trim().toLowerCase();
    if (titleName && titleName.length <= 40) output.add(titleName);
  }
  const joined = normalizeText(blocks.join(" "));
  for (const name of knownCompetitors) {
    if (joined.includes(name)) output.add(name);
  }
  return [...output].slice(0, 5);
}

async function retryFetch(url, init) {
  let response;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(15000) });
    if (![429, 500, 502, 503].includes(response.status)) return response;
    await delay(700 * attempt);
  }
  return response;
}

function uniqueByKeyword(items) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = item.keyword.replace(/\b(free|online|tool)\b/g, "").replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

function exactSuggestionBoost(keyword, suggestions) {
  const normalized = normalizeText(keyword);
  return suggestions.some((suggestion) => normalizeText(suggestion) === normalized) ? 1 : 0.4;
}

function termScore(context, terms) {
  const hits = terms.filter((term) => context.includes(term)).length;
  return clamp(hits / Math.min(5, terms.length), 0, 1);
}

function longTailScore(keyword) {
  const words = keyword.trim().split(/\s+/).length;
  return clamp((words - 2) / 5, 0.25, 1);
}

function normalizeKeyword(value) {
  return normalizeText(value).replace(/\s+/g, " ").trim();
}

function normalizeText(value) {
  return String(value).normalize("NFKC").toLowerCase();
}

function titleCase(value) {
  return value.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

function stripTags(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

function hostFromUrl(value) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function decodeHtml(value) {
  return String(value)
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function occurrences(value, needle) {
  if (!needle) return 0;
  return value.split(needle).length - 1;
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

function round(value) {
  return Number(value.toFixed(3));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
