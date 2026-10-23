import { DEFAULT_SCORING } from "./aeo-rules.mjs";
import { ENTITY_SCHEMA_FIELDS, localizeFields, fieldsSummary, textHint } from "./aeo-fields.mjs";
import { DIAGNOSIS_LANGS, diagnosisText, resolveDiagnosisLang } from "./diagnosis-i18n.mjs";
// Keep these weights independent from extraction so layer-2 citation data can
// tune the model without changing the public scoring contract.
export const AEO_SCORE_WEIGHTS = DEFAULT_SCORING.weights;
// u1-v2: the schema component became proportional to the properties met,
// rather than one of three bands. Scores from v1 are not directly comparable.
export const AEO_SCORE_MODEL_VERSION = DEFAULT_SCORING.modelVersion;
// The public checker's cache. It was a week, so a WordPress owner who fixed
// what the checker flagged and pressed "check again" was shown the old result
// for days. Ten minutes still absorbs a burst of visitors checking one URL;
// a caller that needs the page as it is now passes fresh=1 (see api.mjs).
// Nothing else reads this constant.
export const AEO_CACHE_TTL_SECONDS = 10 * 60;
/** At most one fresh (cache-bypassing) scan per URL host in this window. */
export const AEO_FRESH_RATE_LIMIT = Object.freeze({ limit: 1, windowSeconds: 60 });
export const AEO_RATE_LIMIT = Object.freeze({ limit: 20, windowSeconds: 60 * 60 });


/**
 * The schema properties scored when nothing says otherwise.
 *
 * The six a local business cannot be understood without. A ruleset may widen
 * this - that is how the criteria move - but it is the floor a diagnosis with
 * no ruleset to consult is measured against.
 */
export const BASELINE_SCORED_PROPS = Object.freeze([
  "name", "url", "address", "telephone", "openinghours", "geo",
]);

/**
 * Types that count as "this page is about something an AI can use".
 *
 * This list has to include the business types the product itself offers, or it
 * penalises a site for following our own advice. A cafe that correctly declares
 * CafeOrCoffeeShop - a real schema.org subtype of LocalBusiness, and one of the
 * options in the plugin's own picker - was scored as though it had published no
 * recognisable type at all, capping its schema component at WARN however
 * complete the rest of its markup was. Being more specific is the right thing
 * to do and was costing points.
 */

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));
const statusFor = (value, okAt, warnAt) => value >= okAt ? "OK" : value >= warnAt ? "WARN" : "BAD";

export function scoreAeo(input = {}, scoring = DEFAULT_SCORING) {
  const r = scoring;
  const weights = r.weights;
  const signals = {
    aiCrawlersAllowed: input.aiCrawlersAllowed === true,
    edgeBlocked: input.edgeBlocked === true,
    serverRenderedHtml: input.serverRenderedHtml === true,
    jsonLdInRawHtml: input.jsonLdInRawHtml === true,
    schemaTypeMatches: input.schemaTypeMatches === true,
    schemaValid: input.schemaValid === true,
    schemaCoreProps: clamp01(input.schemaCoreProps),
    coreFieldsFilled: clamp01(input.coreFieldsFilled),
    bizSpecificFilled: clamp01(input.bizSpecificFilled),
    factsInText: clamp01(input.factsInText),
    hasHeadingStructure: input.hasHeadingStructure === true,
    hasFaq: input.hasFaq === true,
    llmsTxtPresent: input.llmsTxtPresent === true,
    llmsTxtQuality: clamp01(input.llmsTxtQuality),
    consistent: input.consistent === true,
    freshSignals: input.freshSignals === true,
  };
  /*
   * The schema component is proportional to the properties actually met.
   *
   * It used to be one of three bands, so a site meeting two thirds of the
   * criteria lost the same fifteen points as one meeting a third. That is fine
   * while the criteria never move. Once they do - which is the entire point of
   * a tier that follows them - a three-step band cannot express "slightly
   * behind": a site drops a whole band the moment a single new property is
   * added, and a site that is far behind stops being distinguishable from one
   * that is nearly current.
   *
   * Proportional credit is also simply the fairer reading of the same facts: a
   * deduction for each criterion genuinely unmet, and no more.
   *
   * Markup that is invalid or describes the wrong kind of thing earns half
   * credit on its properties - it exists, but nothing can rely on it.
   */
  const schemaFactor = !signals.jsonLdInRawHtml ? 0
    : signals.schemaValid && signals.schemaTypeMatches ? signals.schemaCoreProps
      : r.invalidSchemaFactor * signals.schemaCoreProps;
  const schema = schemaFactor >= r.schemaOk ? "OK" : schemaFactor > 0 ? "WARN" : "BAD";
  const coverageValue = input.schemaFields ? signals.schemaCoreProps : r.coverageMix[0] * signals.coreFieldsFilled + r.coverageMix[1] * signals.bizSpecificFilled;
  const coverage = input.schemaFields ? schema : statusFor(coverageValue, r.coverageOk, r.coverageWarn);
  const legibilityValue = r.legibilityMix[0] * signals.factsInText + r.legibilityMix[1] * Number(signals.hasHeadingStructure) + r.legibilityMix[2] * Number(signals.hasFaq);
  const legibility = statusFor(legibilityValue, r.legibilityOk, r.legibilityWarn);
  const llms = !signals.llmsTxtPresent ? "BAD" : signals.llmsTxtQuality >= r.llmsOk ? "OK" : "WARN";
  const consistency = signals.consistent && signals.freshSignals ? "OK"
    : signals.consistent || signals.freshSignals ? "WARN" : "BAD";
  const statuses = { schema, coverage, legibility, llms, consistency };
  // Every component but schema is still banded; schema carries its own factor
  // so a partial result is scored as partial rather than rounded to a band.
  const factors = { ...Object.fromEntries(Object.keys(weights).map((id) => [id, r.statusFactors[statuses[id]]])), schema: schemaFactor };
  const rawScore = Math.round(Object.entries(weights)
    .reduce((sum, [id, weight]) => sum + weight * factors[id], 0));
  const gatePassed = signals.aiCrawlersAllowed && !signals.edgeBlocked && signals.serverRenderedHtml;
  const score = gatePassed ? rawScore : Math.min(rawScore, r.gateCap);
  const band = !gatePassed ? "red" : score >= r.greenAt ? "green" : score >= r.yellowAt ? "yellow" : "red";
  return { score, band, gatePassed, statuses, metrics: { coverage: coverageValue, legibility: legibilityValue, schema: schemaFactor } };
}

export async function diagnoseAeoUrl(raw, { fetchImpl = fetch, scoredProps = null, schemaRules = null, entityType = null, catalog = null, scoring = DEFAULT_SCORING, rulesetVersion = null, fresh = false } = {}) {
  const target = publicUrl(raw);
  // fresh: ask any cache between us and the site (a WordPress page cache, a
  // CDN) for the current page, so a fix made a minute ago is what is scored.
  const page = await fetchBounded(fetchImpl, target.href, { userAgent: "Nurevo-AEO-Diagnostics/1.0 (+https://nurevo.jp)", noCache: fresh });
  const [robots, llms, edgeBlocked] = await Promise.all([
    fetchOptional(fetchImpl, new URL("/robots.txt", target.origin).href, { noCache: fresh }),
    fetchOptional(fetchImpl, new URL("/llms.txt", target.origin).href, { noCache: fresh }),
    detectEdgeBlock(fetchImpl, target.href),
  ]);
  const signals = extractAeoSignals(page.text, robots.text, llms.text, {
    edgeBlocked,
    llmsPresent: llms.ok,
    scoredProps, schemaRules, entityType, catalog, scoring,
  });
  const result = scoreAeo(signals, scoring);
  return {
    rulesetVersion,
    modelVersion: scoring.modelVersion,
    deliveryEvidence: deliveryEvidence(page.text, robots.text, llms.text),
    publicNodes: extractSchemaNodes(page.text),
    host: target.host,
    score: result.score,
    band: result.band,
    gatePassed: result.gatePassed,
    checks: buildAeoChecks(signals, result),
    structuredData: { fields: localizeFields(signals.schemaFields, "ja"), filled: signals.schemaFields.filter(f => f.present).length, total: signals.schemaFields.length },
    scannedAt: new Date().toISOString(),
    // What this score was measured against. Without it, "your score went down"
    // is unanswerable - the page may not have changed at all.
    scoredProps: Array.isArray(signals.scoredProps) ? signals.scoredProps : BASELINE_SCORED_PROPS,
    publishedProps: Array.isArray(signals.publishedProps) ? signals.publishedProps : [],
  };
}

/**
 * Flatten every JSON-LD node published in the raw HTML, including @graph
 * members. Shared with SoV measurement, which reads the business name, type
 * and locality out of the site's own schema.
 */
export function extractSchemaNodes(html = "") {
  const nodes = [];
  for (const match of String(html).matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    try { flattenSchemas(JSON.parse(match[1]), nodes); } catch { /* malformed JSON-LD contributes no nodes */ }
  }
  return nodes;
}

/**
 * Which of these properties the given JSON-LD nodes actually carry.
 *
 * The same test the scorer applies, exposed so advice can name the exact
 * properties a score was deducted for. Anything else would risk telling an
 * operator to fix something the scorer did not mark them down on.
 */
export function publishedSchemaProps(nodes = [], props = BASELINE_SCORED_PROPS) {
  const found = new Set();
  const visit = value => {
    if (!value || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      if (item != null && item !== "" && (!Array.isArray(item) || item.length)) found.add(key.toLowerCase());
      visit(item);
    }
  };
  visit(nodes);
  return (props || []).map(key => String(key).toLowerCase()).filter(key => found.has(key));
}

/** Fetch a public page and return the JSON-LD nodes it publishes. */
export async function fetchSchemaNodes(raw, { fetchImpl = fetch } = {}) {
  const target = publicUrl(raw);
  const page = await fetchBounded(fetchImpl, target.href, { userAgent: "Nurevo-AEO-Diagnostics/1.0 (+https://nurevo.jp)" });
  return extractSchemaNodes(page.text);
}

export function extractAeoSignals(html = "", robots = "", llms = "", options = {}) {
  const scoring = options.scoring || DEFAULT_SCORING;
  const scripts = [...String(html).matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)];
  const schemas = [];
  let schemaValid = scripts.length > 0;
  for (const match of scripts) {
    try { flattenSchemas(JSON.parse(match[1]), schemas); } catch { schemaValid = false; }
  }
  const types = schemas.flatMap((item) => Array.isArray(item?.["@type"]) ? item["@type"] : [item?.["@type"]]).filter(Boolean);
  const usefulTypes = new Set(scoring.usefulTypes);
  const schemaTypeMatches = types.some((type) => usefulTypes.has(String(type).toLowerCase()));
  const schemaText = JSON.stringify(schemas).toLowerCase();
  const visible = stripHtml(html).toLowerCase();
  const coreTests = [
    schemas.some((x) => x?.name) || /<title\b/i.test(html),
    schemas.some((x) => x?.address) || addressLike(visible),
    schemas.some((x) => x?.telephone) || /(?:tel|電話|phone)[\s:：]*[+()\d-]{7,}/i.test(visible),
    schemas.some((x) => x?.openingHours || x?.openingHoursSpecification) || /(営業時間|opening hours|月曜|monday)/i.test(visible),
    schemas.some((x) => x?.geo?.latitude != null && x?.geo?.longitude != null),
    schemas.some((x) => x?.url) || /<link\b[^>]*rel=["']canonical["']/i.test(html),
  ];
  const bizTests = [
    schemas.some((x) => x?.hasMenu || x?.menu) || /(メニュー|menu)/i.test(visible),
    schemas.some((x) => x?.makesOffer || x?.hasOfferCatalog || x?.serviceType) || /(サービス|service)/i.test(visible),
    schemas.some((x) => x?.priceRange || x?.offers) || /(料金|価格|price|¥|￥|\$)/i.test(visible),
  ];
  const factsTests = [visible.trim().length >= scoring.minFactText,
    ...scoring.factTextPatterns.map(pattern=>new RegExp(pattern,'i').test(visible))];
  // Which schema properties count is the ruleset's decision, not a constant
  // here. This is the hinge the whole plan model turns on: a free site keeps
  // emitting the fields it was installed with, every site is scored against
  // the criteria in force today, and the gap between the two is what advancing
  // the criteria actually costs. Falling back to the baseline list keeps the
  // public URL diagnosis - which has no site and therefore no ruleset -
  // scoring exactly as it did.
  const scoredProps = Array.isArray(options.scoredProps) && options.scoredProps.length
    ? options.scoredProps.map((key) => String(key).toLowerCase())
    : BASELINE_SCORED_PROPS;
  const publishedProps = publishedSchemaProps(schemas, scoredProps);
  const schemaFields = diagnoseSchemaFields(schemas, { ...options, commerceDetected: options.commerceDetected || /(?:class|id)=["'][^"']*woocommerce/i.test(html) });
  const llmsQualityTests = [llms.length >= scoring.minLlms, /^#\s+.+/m.test(llms), /https?:\/\//i.test(llms), /(住所|address|電話|phone|営業時間|hours)/i.test(llms)];
  return {
    aiCrawlersAllowed: gateCrawlers(scoring).every((bot) => robotsAllows(robots, bot)),
    edgeBlocked: options.edgeBlocked === true,
    serverRenderedHtml: visible.replace(/\s+/g, " ").trim().length >= scoring.minVisible || scripts.length > 0,
    jsonLdInRawHtml: scripts.length > 0,
    schemaTypeMatches,
    schemaValid,
    schemaCoreProps: schemaFields.reduce((sum, f) => sum + (f.present ? f.weight : 0), 0) / Math.max(1, schemaFields.reduce((sum, f) => sum + f.weight, 0)),
    schemaFields,
    scoredProps,
    publishedProps,
    coreFieldsFilled: average(coreTests),
    bizSpecificFilled: average(bizTests),
    factsInText: schemaFields.some(f => ['Product','Service','Article','SoftwareApplication'].includes(f.entityType))
      ? average(schemas.filter(n => [n['@type']].flat().some(t => ['product','service','article','blogposting','newsarticle','softwareapplication'].includes(String(t).toLowerCase()))).flatMap(n => [String(n.name || n.headline || '').trim(), String(n.description || '').trim()]).map(fact => Boolean(fact) && visible.includes(fact.toLowerCase())))
      : average(factsTests),
    hasHeadingStructure: /<h1\b/i.test(html) && /<h[2-6]\b/i.test(html),
    hasFaq: types.some((type) => String(type).toLowerCase() === "faqpage") || /(よくある質問|faq)/i.test(visible),
    llmsTxtPresent: options.llmsPresent === true,
    llmsTxtQuality: average(llmsQualityTests),
    consistent: schemas.length > 0 && schemas.every((item) => !item?.name || visible.includes(String(item.name).toLowerCase())),
    freshSignals: /(dateModified|datePublished|article:modified_time|last-modified)/i.test(`${html} ${schemaText}`)
      || new RegExp(String(new Date().getUTCFullYear())).test(visible),
  };
}

/* ------------------------------------------------------------------ *
 * Check wording
 *
 * The id and the status are the contract; the label and message are display.
 * Keeping them apart is what lets one cached diagnosis be rendered in any
 * language: the result stored in KV carries ids and statuses, and the wording is
 * applied on the way out. Localising before the cache would serve whichever
 * language happened to warm it to everyone afterwards.
 *
 * Every check also has a message per status, because "we found this" and "this
 * is fine" are different sentences and a single message has to fudge both.
 * ------------------------------------------------------------------ */

/** Stable order and fixability. Ids never change; they key everything else. */
export const AEO_CHECKS = Object.freeze([
  { id: "ai_crawlers_allowed", fixable: true, gate: true },
  { id: "edge_access", fixable: false, gate: true },
  { id: "server_rendered_html", fixable: true, gate: true },
  { id: "schema", fixable: true, gate: false },
  { id: "coverage", fixable: true, gate: false },
  { id: "legibility", fixable: false, gate: false },
  { id: "llms", fixable: true, gate: false },
  { id: "consistency", fixable: false, gate: false },
]);

/*
 * The wording itself lives in worker/i18n/diagnosis/<lang>.json as
 * check.<id>.label / .OK / .WARN / .BAD, one catalog per language the plugin
 * ships in. See diagnosis-i18n.mjs for the fallback chain.
 */

/**
 * Languages the diagnosis is written in: every catalog, so every one of the
 * plugin's WordPress locales resolves to its own language rather than English.
 */
export const AEO_CHECK_LANGS = DIAGNOSIS_LANGS;

/**
 * Pick a catalog. Accepts WordPress locales (de_DE, pt_BR, zh_HK), the plugin's
 * lower-cased form (es-ar) and BCP 47 tags; anything unknown falls back to
 * English rather than to Japanese, so an unwritten language reads as one most
 * visitors can act on.
 */
export function resolveAeoCheckLang(requested) {
  return resolveDiagnosisLang(requested);
}

function checkWording(lang, id) {
  const label = diagnosisText(lang, `check.${id}.label`);
  if (label === undefined) return null;
  return { label, OK: diagnosisText(lang, `check.${id}.OK`), WARN: diagnosisText(lang, `check.${id}.WARN`), BAD: diagnosisText(lang, `check.${id}.BAD`) };
}

/**
 * Apply wording to checks that already carry ids and statuses.
 *
 * Safe to run on a cached diagnosis, including one cached before this existed:
 * anything it cannot recognise keeps whatever label and message it arrived with,
 * so an unknown id degrades to the old behaviour rather than losing its row.
 */
export function localizeAeoChecks(checks, requested) {
  const lang = resolveAeoCheckLang(requested);
  return (Array.isArray(checks) ? checks : []).map((check) => {
    const wording = checkWording(lang, check?.id);
    if (!wording) return { ...check };
    const status = String(check?.status || "").toUpperCase();
    // An unrecognised status is a finding, not a pass.
    const fields = Array.isArray(check.fields) ? localizeFields(check.fields, lang) : null;
    const message = fields ? fieldsSummary(fields, lang) : wording[status] ?? wording.WARN;
    return { ...check, label: fields ? `${wording.label} (${fields.filter(f => f.present).length}/${fields.length})` : wording.label, message, ...(fields ? { fields } : {}), ...(check.id === "legibility" ? { hints: [textHint(lang)] } : {}) };
  });
}

/**
 * Build the check list for a scored diagnosis.
 *
 * `lang` defaults to Japanese so that every existing caller - the dashboard, the
 * stored history, the plugin's fallback path - keeps the wording it had before
 * this argument existed.
 */
export function buildAeoChecks(signals, result, lang = "ja") {
  const gateStatus = {
    ai_crawlers_allowed: signals.aiCrawlersAllowed,
    edge_access: !signals.edgeBlocked,
    server_rendered_html: signals.serverRenderedHtml,
  };
  const checks = AEO_CHECKS.map(({ id, fixable, gate }) => ({
    id,
    status: gate ? (gateStatus[id] ? "OK" : "BAD") : result.statuses[id],
    fixable,
    ...(["schema", "coverage"].includes(id) && signals.schemaFields ? { fields: signals.schemaFields } : {}),
  }));
  return localizeAeoChecks(checks, lang);
}

function publicUrl(raw) {
  let url;
  try { url = new URL(String(raw || "")); } catch { throw new AeoScoreError(400, "invalid_url"); }
  if (!["http:", "https:"].includes(url.protocol) || privateHost(url.hostname) || url.username || url.password) throw new AeoScoreError(400, "invalid_url");
  url.hash = "";
  return url;
}

async function fetchBounded(fetchImpl, href, { userAgent, noCache = false } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const headers = { accept: "text/html,text/plain,*/*", "user-agent": userAgent || "Nurevo-AEO-Diagnostics/1.0" };
    if (noCache) { headers["cache-control"] = "no-cache"; headers.pragma = "no-cache"; }
    const response = await fetchImpl(href, { redirect: "follow", signal: controller.signal, headers });
    if (!response.ok) throw new AeoScoreError(502, "unreachable");
    const length = Number(response.headers.get("content-length") || 0);
    if (length > 2_000_000) throw new AeoScoreError(413, "response_too_large");
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > 2_000_000) throw new AeoScoreError(413, "response_too_large");
    return { ok: true, status: response.status, text: new TextDecoder().decode(buffer) };
  } finally { clearTimeout(timer); }
}

/**
 * Model-training crawlers and opt-out tokens. A site may block these and still
 * be read and cited by AI search, so they never count against the gate - even
 * when an older ruleset stored in the database still lists them.
 */
export const AI_TRAINING_CRAWLERS = Object.freeze(["GPTBot", "ClaudeBot", "Claude-Web", "anthropic-ai", "Google-Extended", "Applebot-Extended", "CCBot", "Bytespider"]);
const AI_SEARCH_CRAWLERS = Object.freeze(["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User"]);

/** The crawlers the reachability gate checks: the ruleset's list minus training bots. */
export function gateCrawlers(scoring = DEFAULT_SCORING) {
  const training = new Set(AI_TRAINING_CRAWLERS.map((bot) => bot.toLowerCase()));
  const listed = (Array.isArray(scoring.aiCrawlers) ? scoring.aiCrawlers : []).filter((bot) => !training.has(String(bot).toLowerCase()));
  return listed.length ? listed : [...AI_SEARCH_CRAWLERS];
}

async function fetchOptional(fetchImpl, href, options = {}) {
  try { return await fetchBounded(fetchImpl, href, options); } catch { return { ok: false, text: "" }; }
}

async function detectEdgeBlock(fetchImpl, href) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetchImpl(href, { method: "HEAD", redirect: "follow", signal: controller.signal, headers: { "user-agent": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot" } });
    return [401, 403, 429, 451].includes(response.status);
  } catch { return true; } finally { clearTimeout(timer); }
}

function robotsAllows(text, bot) {
  if (!String(text).trim()) return true;
  const groups = [];
  let agents = [], rules = [];
  const flush = () => { if (agents.length) groups.push({ agents, rules }); agents = []; rules = []; };
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) { flush(); continue; }
    const index = line.indexOf(":");
    if (index < 0) continue;
    const key = line.slice(0, index).trim().toLowerCase(), value = line.slice(index + 1).trim();
    if (key === "user-agent") { if (rules.length) flush(); agents.push(value.toLowerCase()); }
    else if ((key === "allow" || key === "disallow") && agents.length) rules.push({ allow: key === "allow", path: value });
  }
  flush();
  const name = bot.toLowerCase();
  const exact = groups.filter((group) => group.agents.includes(name));
  const applicable = exact.length ? exact : groups.filter((group) => group.agents.includes("*"));
  const rootRules = applicable.flatMap((group) => group.rules).filter((rule) => rule.path === "/");
  return !rootRules.some((rule) => !rule.allow) || rootRules.some((rule) => rule.allow);
}

function flattenSchemas(value, output) {
  if (Array.isArray(value)) return value.forEach((item) => flattenSchemas(item, output));
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value["@graph"])) flattenSchemas(value["@graph"], output);
  if (value["@type"]) output.push(value);
}
function stripHtml(html) { return String(html).replace(/<script\b[\s\S]*?<\/script\s*>/gi, " ").replace(/<style\b[\s\S]*?<\/style\s*>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&"); }
function addressLike(text) { return /(住所|所在地|address|〒\s*\d{3})/i.test(text); }
function average(values) { return values.length ? values.filter(Boolean).length / values.length : 0; }
function privateHost(host) { const h = host.toLowerCase(); return h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h) || h === "0.0.0.0" || h === "::1" || h === "[::1]"; }

export class AeoScoreError extends Error {
  constructor(status, code) { super(code); this.name = "AeoScoreError"; this.status = status; this.code = code; }
}

// Match fields within the correct entity, never by a substring anywhere in JSON.
export function diagnoseSchemaFields(nodes, options = {}) {
  const USEFUL_SCHEMA_TYPES = new Set((options.scoring || DEFAULT_SCORING).usefulTypes);
  const typesOf = node => [node?.['@type']].flat().filter(Boolean).map(t => String(t).toLowerCase());
  const types = nodes.flatMap(typesOf);
  const families = new Set();
  const hint = String(options.entityType || '').toLowerCase();
  const software = types.includes('softwareapplication') || ['softwareapplication','saas','software'].includes(hint);
  if (software) families.add('SoftwareApplication');
  if (!software && (types.includes('product') || types.includes('onlinestore') || options.catalog?.products?.length || options.commerceDetected || /^(product|.*store|shop|ecommerce)$/.test(hint))) families.add('Product');
  if (types.includes('service') || options.catalog?.services?.length || hint === 'service') families.add('Service');
  if (types.some(t => ['article','blogposting','newsarticle'].includes(t)) || /article|blog/.test(hint)) families.add('Article');
  const isLocal = t => USEFUL_SCHEMA_TYPES.has(t) && !['product','service','article','blogposting','newsarticle','organization','website','faqpage','softwareapplication'].includes(t);
  if (isLocal(hint) || types.some(isLocal) || (!families.size && !types.some(t => ['organization','website','faqpage','softwareapplication'].includes(t)) && !['organization','website','faqpage'].includes(hint))) families.add('LocalBusiness');
  const rules = options.schemaRules || {};
  const definitions = rules.entityFields || ENTITY_SCHEMA_FIELDS;
  const selected = [...families, 'WebSite', 'FAQPage', 'Organization'];
  const match = (node, family) => {
    const tt = typesOf(node);
    if (family === 'Article') return tt.some(t => ['article','blogposting','newsarticle'].includes(t));
    if (family === 'LocalBusiness') return tt.some(t => USEFUL_SCHEMA_TYPES.has(t) && !['organization','product','service','article','blogposting','newsarticle','website','faqpage','softwareapplication'].includes(t));
    return tt.includes(family.toLowerCase());
  };
  const hasValue = value => value != null && (typeof value === 'string' ? value.trim().length > 0 : Array.isArray(value) ? value.length > 0 && value.every(hasValue) : typeof value === 'object' ? Object.keys(value).some(k => !k.startsWith('@') && hasValue(value[k])) : true);
  const resolve = value => value && typeof value === 'object' && value['@id'] ? nodes.find(n => n['@id'] === value['@id']) || value : value;
  const read = (value, parts) => {
    value = resolve(value);
    if (Array.isArray(value)) return value.length > 0 && value.every(v => read(v, parts));
    if (!parts.length) return hasValue(value);
    const [key,...rest] = parts;
    if (key === 'openingHoursSpecification' || key === 'openingHours' || key === 'openinghours') return read(value?.openingHoursSpecification ?? value?.openingHours, rest);
    if (key === 'geo' && !rest.length) return hasValue(value?.geo?.latitude) && hasValue(value?.geo?.longitude);
    if (key === 'mainEntity' && !rest.length) return Array.isArray(value?.mainEntity) && value.mainEntity.length > 0 && value.mainEntity.every(q => hasValue(q.name) && hasValue(resolve(q.acceptedAnswer)?.text));
    return read(value?.[key],rest);
  };
  return selected.flatMap(entityType => {
    let definition = definitions[entityType] || {};
    // Explicit legacy scoredProps remain authoritative for local entities.
    if (entityType === 'LocalBusiness' && !rules.entityFields) {
      const legacy = Array.isArray(options.scoredProps) && options.scoredProps.length ? options.scoredProps : rules.scoredProps;
      if (Array.isArray(legacy) && legacy.length) definition = Object.fromEntries(legacy.filter(f => f === 'name' || rules.fields?.[f] !== false).map(f => [f === 'openinghours' ? 'openingHours' : f, true]));
      else if (rules.fields) definition = {name:true,...rules.fields};
    }
    const entities = nodes.filter(n => match(n,entityType));
    return Object.entries(definition).filter(([field,enabled]) => enabled !== false && enabled?.enabled !== false && (entityType !== 'LocalBusiness' || rules.fields?.[field] !== false)).map(([field,config]) => ({entityType,field,weight: config && typeof config === 'object' && Number(config.weight) > 0 ? Number(config.weight) : 1,present: entities.length > 0 && entities.every(n => read(n,field.split('.')))}));
  });
}

// Evidence is read from raw HTML, never from a config fetch or client acknowledgement.
export function deliveryEvidence(html, robots = "", llms = "") {
  // robots.txt uses a '#' comment; llms.txt (Markdown) uses an HTML comment so it is not a second H1. Both are accepted.
  const artifactVersion = text => {const m=String(text).match(/^[ \t]*(?:# nurevo-aeo-ruleset:(\d+)|<!--\s*nurevo-aeo-ruleset:(\d+)\s*-->)\s*$/m); return m?Number(m[1]??m[2]):null;};
  const match = String(html).match(/<script\b[^>]*id=["']nurevo-aeo-delivery["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return null;
  try { const evidence = JSON.parse(match[1]); return { version: evidence.version, robotsVersion:artifactVersion(robots), llmsVersion:artifactVersion(llms), nodes: extractSchemaNodes(html).map(n=>({'@context':'https://schema.org',...n})) }; } catch { return null; }
}
