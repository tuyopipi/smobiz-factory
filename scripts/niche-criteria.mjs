const buyerOperatorTerms = [
  "accountant",
  "bookkeeper",
  "bookkeeping",
  "tax preparer",
  "notary",
  "paralegal",
  "attorney",
  "lawyer",
  "consultant",
  "freelancer",
  "contractor",
  "developer",
  "agency owner",
  "agency",
  "small business",
  "sole proprietor",
  "landlord",
  "cleaner",
  "therapist",
  "coach",
  "realtor",
  "real estate agent"
];

const selfServeToolTerms = [
  "calculator",
  "template",
  "checklist",
  "generator",
  "tracker",
  "worksheet",
  "planner",
  "form",
  "intake",
  "invoice",
  "quote",
  "estimate",
  "retainer",
  "scope",
  "client"
];

const recurringTerms = [
  "monthly",
  "weekly",
  "daily",
  "recurring",
  "client",
  "invoice",
  "cash flow",
  "bookkeeping",
  "tax",
  "case",
  "intake",
  "lead",
  "quote",
  "estimate",
  "retainer",
  "maintenance",
  "checklist",
  "report"
];

const enterpriseTerms = [
  "enterprise",
  "salesforce",
  "slack",
  "jira",
  "sap",
  "oracle",
  "sharepoint",
  "sso",
  "oauth",
  "api integration",
  "webhook",
  "internal database",
  "data warehouse",
  "erp",
  "hris",
  "procurement",
  "approval workflow",
  "soc 2",
  "hipaa",
  "e-signature platform",
  "payment processor"
];

const freeCommodityTerms = [
  "csv to json",
  "json formatter",
  "regex tester",
  "pdf converter",
  "image resize",
  "thumbnail generator",
  "screenshot annotation",
  "qr code",
  "word counter",
  "unit converter"
];

const paidPainTerms = ["paywall", "pricing", "price", "expensive", "limit", "limited", "subscription", "trial"];

export function scorePaidNiche(item) {
  const keyword = normalizeText(item.keyword);
  const suggestions = normalizeText((item.suggestions ?? []).join(" "));
  const context = `${keyword} ${suggestions}`;
  const painText = normalizeText([
    ...(item.painPoints ?? []),
    ...(item.competitorPain?.painPoints ?? []),
    ...(item.competitorPain?.differentiationPoints ?? [])
  ].join(" "));
  const buyerOperatorScore = termScore(context, buyerOperatorTerms);
  const selfServeScore = termScore(context, selfServeToolTerms);
  const recurringScore = termScore(context, recurringTerms);
  const nicheScore = clamp((buyerOperatorScore * 0.55) + (longTailScore(keyword) * 0.25) + (specificWorkflowScore(context) * 0.2), 0, 1);
  const paidMarketScore = clamp(
    termScore(painText, paidPainTerms) * 0.65 +
      Number(item.competitorPainScore ?? 0) * 0.25 +
      termScore(context, ["pricing", "software", "paid", "subscription"]) * 0.1,
    0,
    1
  );
  const browserOnlyScore = enterpriseTerms.some((term) => context.includes(term)) ? 0 : 1;
  const commodityPenalty = freeCommodityTerms.some((term) => keyword.includes(term)) ? 0.55 : 0;
  const demandScore = Number(item.demandScore ?? 0);
  const paidNicheScore = clamp(
    demandScore * 0.1 +
      buyerOperatorScore * 0.2 +
      selfServeScore * 0.12 +
      paidMarketScore * 0.22 +
      recurringScore * 0.16 +
      nicheScore * 0.25 +
      browserOnlyScore * 0.1 -
      commodityPenalty,
    0,
    1
  );

  return {
    buyerOperatorScore: round(buyerOperatorScore),
    selfServeScore: round(selfServeScore),
    paidMarketScore: round(paidMarketScore),
    recurringScore: round(recurringScore),
    browserOnlyScore: round(browserOnlyScore),
    nicheScore: round(nicheScore),
    commodityPenalty: round(commodityPenalty),
    paidNicheScore: round(paidNicheScore)
  };
}

export function passesPaidNicheCriteria(item) {
  const score = item.paidNiche ?? scorePaidNiche(item);
  const hasToolCompetition = Number(item.competition?.topToolResults ?? 0) > 0 || Number(item.competition?.knownCompetitorMentions ?? 0) > 0;
  const hasRelevantCompetitor = (item.competitorPain?.competitors ?? []).length > 0;
  return Number(item.searchDemand ?? 0) > 0 &&
    hasToolCompetition &&
    hasRelevantCompetitor &&
    score.buyerOperatorScore >= 0.18 &&
    score.selfServeScore >= 0.18 &&
    score.paidMarketScore >= 0.45 &&
    score.recurringScore >= 0.18 &&
    score.browserOnlyScore === 1 &&
    score.nicheScore >= 0.25 &&
    score.commodityPenalty < 0.5 &&
    score.paidNicheScore >= 0.45;
}

function specificWorkflowScore(context) {
  const tokens = normalizeText(context).split(/\s+/).filter(Boolean);
  const hasProfession = buyerOperatorTerms.some((term) => context.includes(term));
  const hasWorkflow = selfServeToolTerms.some((term) => context.includes(term));
  return clamp((tokens.length >= 4 ? 0.35 : 0) + (hasProfession ? 0.35 : 0) + (hasWorkflow ? 0.3 : 0), 0, 1);
}

function termScore(context, terms) {
  const hits = terms.filter((term) => context.includes(normalizeText(term))).length;
  return clamp(hits / Math.min(4, terms.length), 0, 1);
}

function longTailScore(keyword) {
  const words = keyword.trim().split(/\s+/).filter(Boolean).length;
  return clamp((words - 2) / 5, 0, 1);
}

function normalizeText(value) {
  return String(value).normalize("NFKC").toLowerCase();
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

function round(value) {
  return Number(value.toFixed(3));
}
