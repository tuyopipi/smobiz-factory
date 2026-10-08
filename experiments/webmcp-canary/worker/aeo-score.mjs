// Keep these weights independent from extraction so layer-2 citation data can
// tune the model without changing the public scoring contract.
export const AEO_SCORE_WEIGHTS = Object.freeze({ schema: 30, coverage: 25, legibility: 20, llms: 15, consistency: 10 });
// u1-v2: the schema component became proportional to the properties met,
// rather than one of three bands. Scores from v1 are not directly comparable.
export const AEO_SCORE_MODEL_VERSION = "u1-v2";
const STATUS_FACTOR = Object.freeze({ OK: 1, WARN: 0.5, BAD: 0 });
export const AEO_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;
export const AEO_RATE_LIMIT = Object.freeze({ limit: 20, windowSeconds: 60 * 60 });

const AI_CRAWLERS = Object.freeze([
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web",
  "PerplexityBot", "Google-Extended", "Applebot-Extended",
]);
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
const USEFUL_SCHEMA_TYPES = new Set([
  // Content and generic entities.
  "organization", "localbusiness", "product", "service",
  "article", "newsarticle", "blogposting", "faqpage", "website",
  // Food and drink.
  "restaurant", "cafeorcoffeeshop", "bakery", "barorpub", "fastfoodrestaurant",
  "icecreamshop", "winery", "brewery", "distillery",
  // Retail.
  "store", "clothingstore", "grocerystore", "pharmacy", "petstore",
  "furniturestore", "shoppingcenter", "bookstore", "florist", "hardwarestore",
  "jewelrystore", "liquorstore", "mobilephonestore", "officeequipmentstore",
  "shoestore", "sportinggoodsstore", "toystore", "conveniencestore",
  "departmentstore", "electronicsstore", "homegoodsstore",
  // Health and beauty.
  "healthandbeautybusiness", "hairsalon", "beautysalon", "dayspa", "nailsalon",
  "medicalbusiness", "dentist", "physician", "hospital", "veterinarycare",
  "optician", "healthclub", "tattooparlor",
  // Lodging and travel.
  "lodgingbusiness", "hotel", "motel", "hostel", "bedandbreakfast", "resort",
  "campground", "travelagency", "touristinformationcenter",
  // Professional and trade.
  "professionalservice", "legalservice", "accountingservice", "financialservice",
  "insuranceagency", "realestateagent", "notary", "employmentagency",
  "homeandconstructionbusiness", "plumber", "electrician", "generalcontractor",
  "roofingcontractor", "movingcompany", "housepainter", "locksmith",
  "autorepair", "automotivebusiness", "autodealer", "autobodyshop",
  "autopartsstore", "autorental", "autowash", "gasstation", "motorcycledealer",
  // Activity, education and the rest.
  "sportsactivitylocation", "exercisegym", "golfcourse", "skiresort",
  "swimmingpool", "tenniscomplex", "bowlingalley",
  "entertainmentbusiness", "movietheater", "nightclub", "casino", "amusementpark",
  "childcare", "educationalorganization", "school", "preschool", "library",
  "museum", "touristattraction", "selfstorage", "drycleaningorlaundry",
  "emergencyservice", "governmentoffice", "internetcafe", "recyclingcenter",
]);

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));
const statusFor = (value, okAt, warnAt) => value >= okAt ? "OK" : value >= warnAt ? "WARN" : "BAD";

export function scoreAeo(input = {}) {
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
      : 0.5 * signals.schemaCoreProps;
  const schema = schemaFactor >= 0.8 ? "OK" : schemaFactor > 0 ? "WARN" : "BAD";
  const coverageValue = 0.6 * signals.coreFieldsFilled + 0.4 * signals.bizSpecificFilled;
  const coverage = statusFor(coverageValue, 0.8, 0.4);
  const legibilityValue = 0.6 * signals.factsInText + 0.2 * Number(signals.hasHeadingStructure) + 0.2 * Number(signals.hasFaq);
  const legibility = statusFor(legibilityValue, 0.75, 0.4);
  const llms = !signals.llmsTxtPresent ? "BAD" : signals.llmsTxtQuality >= 0.7 ? "OK" : "WARN";
  const consistency = signals.consistent && signals.freshSignals ? "OK"
    : signals.consistent || signals.freshSignals ? "WARN" : "BAD";
  const statuses = { schema, coverage, legibility, llms, consistency };
  // Every component but schema is still banded; schema carries its own factor
  // so a partial result is scored as partial rather than rounded to a band.
  const factors = { ...Object.fromEntries(Object.keys(AEO_SCORE_WEIGHTS).map((id) => [id, STATUS_FACTOR[statuses[id]]])), schema: schemaFactor };
  const rawScore = Math.round(Object.entries(AEO_SCORE_WEIGHTS)
    .reduce((sum, [id, weight]) => sum + weight * factors[id], 0));
  const gatePassed = signals.aiCrawlersAllowed && !signals.edgeBlocked && signals.serverRenderedHtml;
  const score = gatePassed ? rawScore : Math.min(rawScore, 15);
  const band = !gatePassed ? "red" : score >= 80 ? "green" : score >= 50 ? "yellow" : "red";
  return { score, band, gatePassed, statuses, metrics: { coverage: coverageValue, legibility: legibilityValue, schema: schemaFactor } };
}

export async function diagnoseAeoUrl(raw, { fetchImpl = fetch, scoredProps = null } = {}) {
  const target = publicUrl(raw);
  const page = await fetchBounded(fetchImpl, target.href, { userAgent: "Nurevo-AEO-Diagnostics/1.0 (+https://nurevo.jp)" });
  const [robots, llms, edgeBlocked] = await Promise.all([
    fetchOptional(fetchImpl, new URL("/robots.txt", target.origin).href),
    fetchOptional(fetchImpl, new URL("/llms.txt", target.origin).href),
    detectEdgeBlock(fetchImpl, target.href),
  ]);
  const signals = extractAeoSignals(page.text, robots.text, llms.text, {
    edgeBlocked,
    llmsPresent: llms.ok,
    scoredProps,
  });
  const result = scoreAeo(signals);
  return {
    host: target.host,
    score: result.score,
    band: result.band,
    gatePassed: result.gatePassed,
    checks: buildAeoChecks(signals, result),
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
  const schemaText = JSON.stringify(Array.isArray(nodes) ? nodes : []).toLowerCase();
  return (props || [])
    .map((key) => String(key).toLowerCase())
    .filter((key) => key && schemaText.includes(`"${key}`));
}

/** Fetch a public page and return the JSON-LD nodes it publishes. */
export async function fetchSchemaNodes(raw, { fetchImpl = fetch } = {}) {
  const target = publicUrl(raw);
  const page = await fetchBounded(fetchImpl, target.href, { userAgent: "Nurevo-AEO-Diagnostics/1.0 (+https://nurevo.jp)" });
  return extractSchemaNodes(page.text);
}

export function extractAeoSignals(html = "", robots = "", llms = "", options = {}) {
  const scripts = [...String(html).matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)];
  const schemas = [];
  let schemaValid = scripts.length > 0;
  for (const match of scripts) {
    try { flattenSchemas(JSON.parse(match[1]), schemas); } catch { schemaValid = false; }
  }
  const types = schemas.flatMap((item) => Array.isArray(item?.["@type"]) ? item["@type"] : [item?.["@type"]]).filter(Boolean);
  const schemaTypeMatches = types.some((type) => USEFUL_SCHEMA_TYPES.has(String(type).toLowerCase()));
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
  const factsTests = [
    visible.trim().length >= 20,
    addressLike(visible),
    /(?:tel|電話|phone)[\s:：]*[+()\d-]{7,}/i.test(visible),
    /(営業時間|opening hours|月曜|monday)/i.test(visible),
    /(?:latitude|longitude|緯度|経度)/i.test(visible),
    /https?:\/\//i.test(visible) || /(公式サイト|website)/i.test(visible),
  ];
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
  const publishedProps = scoredProps.filter((key) => schemaText.includes(`"${key}`));
  const propTests = scoredProps.map((key) => publishedProps.includes(key));
  const llmsQualityTests = [llms.length >= 120, /^#\s+.+/m.test(llms), /https?:\/\//i.test(llms), /(住所|address|電話|phone|営業時間|hours)/i.test(llms)];
  return {
    aiCrawlersAllowed: AI_CRAWLERS.every((bot) => robotsAllows(robots, bot)),
    edgeBlocked: options.edgeBlocked === true,
    serverRenderedHtml: visible.replace(/\s+/g, " ").trim().length >= 100 || scripts.length > 0,
    jsonLdInRawHtml: scripts.length > 0,
    schemaTypeMatches,
    schemaValid,
    schemaCoreProps: average(propTests),
    scoredProps,
    publishedProps,
    coreFieldsFilled: average(coreTests),
    bizSpecificFilled: average(bizTests),
    factsInText: average(factsTests),
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

const CHECK_WORDING = Object.freeze({
  ja: {
    ai_crawlers_allowed: { label: "AIクローラー到達性", OK: "主要AIクローラー8種をrobots.txtで許可しています。", WARN: "一部のAIクローラーがrobots.txtで明示的に許可されていません。", BAD: "robots.txtでAIクローラーを許可していないため、このサイトは読まれません。" },
    edge_access: { label: "CDN・エッジ到達性", OK: "CDN・WAFはAIボットの通過を許可しています。", WARN: "エッジでAIボットが妨げられている可能性があります。", BAD: "AIボットがサイトに到達する前に遮断されています。" },
    server_rendered_html: { label: "サーバー側HTML", OK: "生HTMLに本文とschemaが出力されています。", WARN: "生HTMLに本文の一部しか出力されていません。", BAD: "生HTMLに本文もschemaも無いため、JavaScriptを実行しないクローラーには空のページに見えます。" },
    schema: { label: "構造化データ", OK: "JSON-LDが妥当で、型と主要プロパティが揃っています。", WARN: "JSON-LDにAIが参照する主要プロパティの一部が欠けています。", BAD: "生HTMLに利用できるJSON-LDが見つかりません。" },
    coverage: { label: "重要情報の網羅", OK: "名称・住所・電話・営業時間・位置情報・URLがすべて公開されています。", WARN: "名称・住所・電話・営業時間・位置情報・URLのいずれかが不足しています。", BAD: "AIが必要とする基本情報（名称・住所・電話・営業時間・位置情報・URL）がほとんどありません。" },
    legibility: { label: "本文の機械可読性", OK: "重要な事実・見出し構造・FAQが本文で読める状態です。", WARN: "重要な事実が本文から読み取りにくい状態です。", BAD: "本文に重要な事実が書かれておらず、AIはマークアップだけを頼りにしています。" },
    llms: { label: "llms.txt", OK: "llms.txtが配信され、サイトを説明しています。", WARN: "llms.txtはありますが、内容が不十分です。", BAD: "llms.txtが配信されていません。" },
    consistency: { label: "一貫性・鮮度", OK: "schemaと本文が一致し、更新シグナルもあります。", WARN: "schemaと本文に食い違いがあるか、更新シグナルがありません。", BAD: "schemaと本文が矛盾しており、AIはどちらも信頼しにくくなっています。" },
  },
  en: {
    ai_crawlers_allowed: { label: "AI crawler access", OK: "The major AI crawlers are allowed in robots.txt.", WARN: "Some AI crawlers are not clearly allowed in robots.txt.", BAD: "AI crawlers are not allowed in robots.txt, so they will not read this site." },
    edge_access: { label: "CDN and edge access", OK: "Your CDN or WAF is letting AI bots through.", WARN: "Something at the edge may be slowing AI bots down.", BAD: "AI bots are being blocked before they reach your site." },
    server_rendered_html: { label: "Server-rendered HTML", OK: "Your content and schema are in the raw HTML.", WARN: "Only part of your content is in the raw HTML.", BAD: "The raw HTML carries neither your content nor your schema, so crawlers that skip JavaScript see an empty page." },
    schema: { label: "Structured data", OK: "Valid JSON-LD with the right type and the key properties filled in.", WARN: "Your JSON-LD is missing some of the properties AI looks for.", BAD: "No usable JSON-LD was found in the raw HTML." },
    coverage: { label: "Key information coverage", OK: "Name, address, phone, hours, location and URL are all published.", WARN: "Some of your name, address, phone, hours, location or URL is missing.", BAD: "The basics AI needs - name, address, phone, hours, location, URL - are mostly missing." },
    legibility: { label: "Readable page text", OK: "Your key facts, headings and FAQ are readable in the page text.", WARN: "Your key facts are hard to find in the page text.", BAD: "The page text does not state your key facts, so AI has only your markup to go on." },
    llms: { label: "llms.txt", OK: "llms.txt is published and describes this site.", WARN: "llms.txt is published but thin on detail.", BAD: "No llms.txt is published." },
    consistency: { label: "Consistency and freshness", OK: "Your schema agrees with your page text and carries a freshness signal.", WARN: "Your schema and page text disagree in places, or the freshness signal is missing.", BAD: "Your schema contradicts your page text, which makes AI distrust both." },
  },
});

/**
 * Languages the mechanism accepts. Only ja and en are written; the rest resolve
 * to English rather than to Japanese, so an unfinished translation reads as a
 * language most visitors can act on instead of one they cannot.
 */
export const AEO_CHECK_LANGS = Object.freeze(["ja", "en", "zh", "zh-TW", "ko", "es", "fr", "de"]);
const TRANSLATED_LANGS = Object.freeze(Object.keys(CHECK_WORDING));

/** Pick a wording table. Anything unknown or unwritten falls back to English. */
export function resolveAeoCheckLang(requested) {
  const value = String(requested || "").trim().toLowerCase().replace("_", "-");
  if (value === "") return "en";
  if (TRANSLATED_LANGS.includes(value)) return value;
  const base = value.split("-")[0];
  if (TRANSLATED_LANGS.includes(base)) return base;
  return "en";
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
  const table = CHECK_WORDING[lang] || CHECK_WORDING.en;
  return (Array.isArray(checks) ? checks : []).map((check) => {
    const wording = table[check?.id];
    if (!wording) return { ...check };
    const status = String(check?.status || "").toUpperCase();
    // An unrecognised status is a finding, not a pass.
    const message = wording[status] ?? wording.WARN;
    return { ...check, label: wording.label, message };
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

async function fetchBounded(fetchImpl, href, { userAgent } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetchImpl(href, { redirect: "follow", signal: controller.signal, headers: { accept: "text/html,text/plain,*/*", "user-agent": userAgent || "Nurevo-AEO-Diagnostics/1.0" } });
    if (!response.ok) throw new AeoScoreError(502, "unreachable");
    const length = Number(response.headers.get("content-length") || 0);
    if (length > 2_000_000) throw new AeoScoreError(413, "response_too_large");
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > 2_000_000) throw new AeoScoreError(413, "response_too_large");
    return { ok: true, status: response.status, text: new TextDecoder().decode(buffer) };
  } finally { clearTimeout(timer); }
}

async function fetchOptional(fetchImpl, href) {
  try { return await fetchBounded(fetchImpl, href); } catch { return { ok: false, text: "" }; }
}

async function detectEdgeBlock(fetchImpl, href) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetchImpl(href, { method: "HEAD", redirect: "follow", signal: controller.signal, headers: { "user-agent": "GPTBot/1.2 (+https://openai.com/gptbot)" } });
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
