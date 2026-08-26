const negativeTerms = [
  "problem",
  "problems",
  "issue",
  "issues",
  "slow",
  "broken",
  "limit",
  "limits",
  "expensive",
  "pricing",
  "ads",
  "watermark",
  "login",
  "account",
  "privacy",
  "bug",
  "bugs",
  "crash",
  "not working"
];

const reviewSources = ["review", "reviews", "reddit", "forum", "product hunt", "chrome web store"];

const painPatterns = [
  {
    id: "too-many-ads",
    terms: ["ads", "advertising", "popup", "pop up"],
    pain: "Existing tools interrupt the workflow with ads or popups.",
    feature: "Keep the core workflow ad-light and focused, with no popup gates around the primary action."
  },
  {
    id: "paywall-or-limits",
    terms: ["limit", "limits", "limited", "paywall", "pricing", "expensive", "subscription", "trial"],
    pain: "Users run into free-plan limits, paywalls, or unclear pricing before finishing the task.",
    feature: "Make the main conversion/generation path usable without account setup and show clear output before any checkout."
  },
  {
    id: "slow-or-broken",
    terms: ["slow", "broken", "not working", "bug", "bugs", "crash", "error", "failed"],
    pain: "Competing tools are reported as slow, buggy, or unreliable.",
    feature: "Run the workflow client-side where possible, show validation errors inline, and avoid network-dependent steps for the core task."
  },
  {
    id: "login-required",
    terms: ["login", "sign in", "account", "registration", "email required"],
    pain: "Users dislike being forced to create an account before using the tool.",
    feature: "Allow immediate use in the browser before asking for an email or checkout."
  },
  {
    id: "privacy-concerns",
    terms: ["privacy", "upload", "uploaded", "data", "secure", "security"],
    pain: "Users worry about uploading sensitive business data to third-party tools.",
    feature: "Process pasted data locally in the browser when practical and state that input is not uploaded for the core operation."
  },
  {
    id: "hard-to-use",
    terms: ["hard to use", "confusing", "complicated", "bloated", "too many features", "clunky"],
    pain: "Existing products feel complicated or overbuilt for a small business workflow.",
    feature: "Use a single-page, task-specific interface with copy-ready output and concise inline guidance."
  },
  {
    id: "watermark",
    terms: ["watermark", "branded", "branding"],
    pain: "Free outputs from competitors include watermarks or unwanted branding.",
    feature: "Produce clean, copy-ready output without forced watermarking in the basic flow."
  }
];

export async function competitorPainForKeyword(keyword, competition, helpers) {
  const competitors = identifyCompetitors(keyword, competition).slice(0, 3);
  if (competitors.length === 0) {
    return emptyPain("no-competitor-identified");
  }

  const signals = [];
  for (const competitor of competitors.filter((value) => !genericCompetitor(value)).slice(0, 2)) {
    signals.push(await competitorSignals(competitor, helpers));
    await helpers.delay?.(80);
  }

  return scoreCompetitorPain(competitors, signals, competition);
}

export function identifyCompetitors(keyword, competition = {}) {
  const text = normalizeText([keyword, ...(competition.examples ?? [])].join(" "));
  const known = [
    "adobe",
    "smallpdf",
    "ilovepdf",
    "canva",
    "jotform",
    "typeform",
    "zapier",
    "calendly",
    "docusign",
    "pandadoc",
    "invoice ninja",
    "freshbooks",
    "quickbooks",
    "regex101",
    "jsonformatter",
    "cloudconvert",
    "pdf24"
  ];
  const output = new Set((competition.competitors ?? []).map((value) => cleanCompetitor(value)).filter((value) => value && !genericCompetitor(value)));
  for (const name of known) {
    if (text.includes(name) && !genericCompetitor(name)) output.add(name);
  }
  for (const example of competition.examples ?? []) {
    const title = cleanCompetitor(String(example).split(/[|-]/)[0]);
    if (title && !genericCompetitor(title)) output.add(title);
  }
  return filterRelevantCompetitors(keyword, [...output], competition).slice(0, 5);
}

export function filterRelevantCompetitors(keyword, competitors, competition = {}) {
  const examples = competition.examples ?? [];
  return competitors
    .map((competitor) => ({
      competitor,
      relevance: competitorRelevance(keyword, competitor, examples)
    }))
    .filter((item) => item.relevance >= 0.34)
    .sort((a, b) => b.relevance - a.relevance)
    .map((item) => item.competitor);
}

export function competitorRelevance(keyword, competitor, examples = []) {
  const normalizedCompetitor = normalizeText(competitor);
  if (genericCompetitor(normalizedCompetitor)) return 0;
  if (broadBrandForKeyword(keyword, normalizedCompetitor)) return 0;

  const keywordTokens = meaningfulTokens(keyword);
  const competitorTokens = meaningfulTokens(normalizedCompetitor);
  const context = normalizeText(examples.filter((example) => normalizeText(example).includes(normalizedCompetitor.split(" ")[0] ?? normalizedCompetitor)).join(" "));
  const contextTokens = meaningfulTokens(context);
  const overlap = tokenOverlap(keywordTokens, [...competitorTokens, ...contextTokens]);
  const nichePhraseBoost = keywordTokens.length >= 2 && keywordTokens.some((token) => context.includes(token)) ? 0.14 : 0;
  const knownToolBoost = /\b(tool|generator|converter|formatter|builder|template|form|invoice|contract|pdf|resize|booking|appointment|cleaning|cleaner)\b/.test(context) ? 0.18 : 0;
  const brandSpecificBoost = competitorTokens.some((token) => keywordTokens.includes(token)) ? 0.22 : 0;
  const categoryBrandBoost = categoryBrandMatch(keywordTokens, normalizedCompetitor) ? 0.42 : 0;
  const genericPenalty = broadBrandForKeyword(keyword, normalizedCompetitor) ? 0.5 : 0;

  return clamp(overlap * 0.68 + nichePhraseBoost + knownToolBoost + brandSpecificBoost + categoryBrandBoost - genericPenalty, 0, 1);
}

export async function competitorSignals(competitor, helpers) {
  const suggest = helpers.googleSuggest ?? (async () => []);
  const webSearch = helpers.webSearchSnippets ?? (async () => []);
  const alternativeSuggestions = await suggest(`${competitor} alternative`);
  const negativeSuggestions = [];
  for (const term of ["problem", "issue", "slow", "broken", "limit"]) {
    negativeSuggestions.push(...await suggest(`${competitor} ${term}`));
  }
  const problemSnippets = await webSearch(`${competitor} problem issue slow broken limit`);
  const reviewSnippets = await webSearch(`${competitor} reviews complaints reddit forum`);
  const snippets = [...problemSnippets, ...reviewSnippets];
  const painPoints = extractPainPoints([...alternativeSuggestions, ...negativeSuggestions, ...snippets].join(" "));

  return {
    competitor,
    alternativeDemand: alternativeSuggestions.length,
    negativeSearchDemand: negativeSuggestions.length,
    reviewComplaintMentions: reviewSources.reduce((sum, term) => sum + occurrences(normalizeText(snippets.join(" ")), term), 0),
    snippets: snippets.slice(0, 5),
    painPoints
  };
}

export function scoreCompetitorPain(competitors, signals, competition = {}) {
  const competitorPresence = clamp(
    (competition.topToolResults ?? 0) / 6 * 0.55 +
      (competition.knownCompetitorMentions ?? 0) / 8 * 0.25 +
      competitors.length / 4 * 0.2,
    0,
    1
  );
  const alternativeDemand = clamp(sum(signals, "alternativeDemand") / Math.max(6, signals.length * 6), 0, 1);
  const negativeDemand = clamp(sum(signals, "negativeSearchDemand") / Math.max(12, signals.length * 12), 0, 1);
  const reviewComplaintSignal = clamp(sum(signals, "reviewComplaintMentions") / Math.max(4, signals.length * 4), 0, 1);
  const painPoints = uniquePainPoints(signals.flatMap((signal) => signal.painPoints ?? []));
  const concretePainBonus = clamp(painPoints.length / 4, 0, 1);
  const competitorPainScore = clamp(
    competitorPresence * 0.28 +
      alternativeDemand * 0.2 +
      negativeDemand * 0.24 +
      reviewComplaintSignal * 0.1 +
      concretePainBonus * 0.18,
    0,
    1
  );

  return {
    competitors,
    competitorPainScore: round(competitorPainScore),
    alternativeDemand: round(alternativeDemand),
    negativeDemand: round(negativeDemand),
    reviewComplaintSignal: round(reviewComplaintSignal),
    painPoints: painPoints.map(({ pain }) => pain),
    differentiationPoints: painPoints.map(({ feature }) => feature),
    evidence: signals.map((signal) => ({
      competitor: signal.competitor,
      alternativeDemand: signal.alternativeDemand,
      negativeSearchDemand: signal.negativeSearchDemand,
      snippets: signal.snippets ?? []
    }))
  };
}

export function extractPainPoints(text) {
  const normalized = normalizeText(text);
  return painPatterns.filter((pattern) => pattern.terms.some((term) => normalized.includes(term)));
}

export function combineOpportunityScore(gapScore, competitorPainScore, hasConcretePain) {
  return round(clamp(Math.max(gapScore * 0.92, competitorPainScore * 0.86) + (hasConcretePain ? 0.06 : 0), 0, 1));
}

function emptyPain(reason) {
  return {
    competitors: [],
    competitorPainScore: 0,
    alternativeDemand: 0,
    negativeDemand: 0,
    reviewComplaintSignal: 0,
    painPoints: [],
    differentiationPoints: [],
    evidence: [],
    reason
  };
}

function uniquePainPoints(points) {
  const seen = new Set();
  const output = [];
  for (const point of points) {
    if (seen.has(point.id)) continue;
    seen.add(point.id);
    output.push(point);
  }
  return output.slice(0, 4);
}

function cleanCompetitor(value) {
  const normalized = normalizeText(value);
  const domain = normalized.match(/\b([a-z0-9-]+\.(?:com|io|ai|co|net|org))\b/)?.[1] ?? "";
  if (domain) {
    const base = domain.replace(/^www\./, "");
    if (!genericCompetitor(base)) return base;
  }
  return normalized
    .replace(/^https?:\/\/\S+\s*/g, " ")
    .replace(/\b(free|online|tool|tools|review|reviews|best|top)\b/g, " ")
    .replace(/[^a-z0-9. ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

function genericCompetitor(value) {
  const normalized = normalizeText(value).trim();
  if (!normalized || normalized.length < 3) return true;
  if (/^\d/.test(normalized)) return true;
  if (["best", "top", "free", "online", "tool", "tools", "login", "sign", "create", "download"].includes(normalized)) return true;
  if ([
    "google",
    "google.com",
    "google images",
    "bing",
    "bing.com",
    "pixabay",
    "pixabay.com",
    "pexels",
    "pexels.com",
    "unsplash",
    "unsplash.com",
    "wikipedia",
    "wikipedia.org",
    "amazon",
    "amazon.com",
    "screenshot"
  ].includes(normalized)) return true;
  if (/\b(login|sign in|sign-in|your account|templates? in|access|definition|meaning|what does)\b/.test(normalized)) return true;
  if (/^(how to|what is|use |download |create |take )\b/.test(normalized)) return true;
  if (/^(consultant|sole|bookkeeper|tax preparer|freelancer|contractor|developer|coach|therapist|notary|paralegal|landlord|realtor)$/.test(normalized)) return true;
  if (/\b(free images|stock photos|pictures|search engine|google search|microsoft bing)\b/.test(normalized)) return true;
  if (/^(invoice|contract|pdf|csv|json|form|forms|generator|converter|template|templates)$/.test(normalized)) return true;
  return false;
}

function broadBrandForKeyword(keyword, competitor) {
  const keywordTokens = meaningfulTokens(keyword);
  const canonicalCompetitor = competitor.replace(/^www\./, "");
  const isBookingNiche = keywordTokens.includes("booking") || keywordTokens.includes("appointment");
  const isImageNiche = keywordTokens.includes("image") || keywordTokens.includes("thumbnail") || keywordTokens.includes("resize");
  const isFormNiche = keywordTokens.includes("form") || keywordTokens.includes("database");
  const broadBrands = [
    "booking.com",
    "airbnb",
    "google",
    "google forms",
    "microsoft forms",
    "microsoft",
    "amazon",
    "bing",
    "pixabay",
    "pexels",
    "unsplash",
    "linkedin"
  ];
  if (!broadBrands.includes(canonicalCompetitor) && !broadBrands.includes(canonicalCompetitor.replace(/\.com$/, ""))) return false;
  if (canonicalCompetitor === "google forms" && isFormNiche && (keywordTokens.includes("survey") || keywordTokens.includes("forms"))) return false;
  if (canonicalCompetitor === "microsoft forms" && isFormNiche && (keywordTokens.includes("survey") || keywordTokens.includes("forms"))) return false;
  if (canonicalCompetitor === "booking.com" && isBookingNiche && !keywordTokens.includes("hotel") && !keywordTokens.includes("travel")) return true;
  if (canonicalCompetitor === "airbnb" && isBookingNiche && !keywordTokens.includes("rental") && !keywordTokens.includes("travel")) return true;
  if ((["pixabay", "pixabay.com", "pexels", "pexels.com", "unsplash", "unsplash.com", "google images", "google.com", "bing", "bing.com"].includes(canonicalCompetitor)) && isImageNiche) return true;
  return true;
}

function categoryBrandMatch(keywordTokens, competitor) {
  const has = (token) => keywordTokens.includes(token);
  if (has("pdf") && ["smallpdf", "ilovepdf", "adobe", "pdf24"].includes(competitor)) return true;
  if (has("invoice") && ["invoice ninja", "freshbooks", "quickbooks", "canva"].includes(competitor)) return true;
  if (has("json") && ["jsonformatter"].includes(competitor)) return true;
  if (has("regex") && ["regex101"].includes(competitor)) return true;
  if ((has("csv") || has("converter")) && ["cloudconvert"].includes(competitor)) return true;
  if ((has("form") || has("booking") || has("appointment")) && ["jotform", "typeform", "calendly"].includes(competitor)) return true;
  if (has("contract") && ["docusign", "pandadoc"].includes(competitor)) return true;
  return false;
}

function meaningfulTokens(value) {
  const stop = new Set([
    "a",
    "an",
    "and",
    "for",
    "from",
    "in",
    "of",
    "on",
    "the",
    "to",
    "with",
    "free",
    "online",
    "best",
    "top",
    "tool",
    "tools",
    "app",
    "software",
    "service",
    "services",
    "www",
    "com",
    "https"
  ]);
  return normalizeText(value)
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !stop.has(token));
}

function tokenOverlap(left, right) {
  if (left.length === 0 || right.length === 0) return 0;
  const rightSet = new Set(right);
  const hits = left.filter((token) => rightSet.has(token)).length;
  return hits / Math.min(4, left.length);
}

function sum(items, key) {
  return items.reduce((total, item) => total + Number(item[key] ?? 0), 0);
}

function normalizeText(value) {
  return String(value).normalize("NFKC").toLowerCase();
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
