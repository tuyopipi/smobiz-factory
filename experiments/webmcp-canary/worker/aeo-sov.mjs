/**
 * Nurevo U2: AI Share-of-Voice (SoV) measurement. Upper plan (pro) only.
 *
 * What this measures, precisely: for a generated set of representative
 * questions a customer would ask an AI engine, how often the engine's answer
 * mentions this business, and how often it cites this business's domain.
 * Competitor comparison is share-of-voice by cited domain across the same
 * questions - it is computed from the engines' own citations, never guessed.
 *
 * Engines are opt-in through environment keys. With no key configured nothing
 * is called and the caller gets an explicit "unconfigured" result, so a canary
 * or local environment behaves correctly without any secret.
 *
 * BETA: answer sets vary run to run. Rates are reported with the sample size
 * that produced them so a small sample is never presented as precision.
 */

import {
  SOV_LANGUAGES, chineseLocality, foldLatin, koreanLocality, latinLocality, localizedBrandedQuestions,
  localizedDiscoveryQuestions, looksJapaneseAddress, resolveSovLanguage,
} from "./sov-locale.mjs";

import {
  ENGINE_ADAPTERS, ENGINE_DEFINITIONS, SMALL_SAMPLE_N, SovError, assumedMaxCallCost, engineConfigured, isProviderQuotaError,
  wilsonInterval,
} from "./ai-engines.mjs";

export { SOV_LANGUAGES, resolveSovLanguage } from "./sov-locale.mjs";
// The engine adapters and their plumbing live in ai-engines.mjs; these names
// stay importable from here for existing callers.
export {
  ENGINE_ADAPTERS, PERPLEXITY_PRESET_DEFAULT, SovError, engineUsage, parsePerplexityAgent, perplexityPreset,
  providerErrorDetail, wilsonInterval,
} from "./ai-engines.mjs";

export const SOV_MODEL_VERSION = "u2-v2";
export const SOV_BETA = true;

/**
 * Fewest answers that may produce a rate. A single answer is one data point,
 * not a percentage: reporting it as 0% or 100% would overstate what was
 * measured, so below this the rate is null with an explicit reason.
 */
export const SOV_MIN_SAMPLES_FOR_RATE = 2;

/**
 * The reasons a rate may be absent, which a reader must never collapse into 0%.
 * `measured` is the only one that carries a number; the other two mean nothing
 * was measurable, which is a different statement from "measured, and it is zero".
 */
export const RATE_BASES = Object.freeze(["measured", "insufficient_samples", "no_answers", "not_asked"]);

/**
 * The engine whose rate is the run-level ("headline") appearance rate. It is
 * Perplexity whenever Perplexity is configured, as it was for every run before
 * ChatGPT was added, so the stored series continues like for like. A run in
 * which the headline engine was not asked (say Perplexity is at its monthly
 * cap and only ChatGPT ran) stores no headline rate ("not_asked") rather than
 * quietly reporting ChatGPT's figure in its place; every engine's own rate is
 * still in by_engine.
 */
export const HEADLINE_ENGINE_DEFAULT = "perplexity";
export function headlineEngineFor(env = {}) {
  const configured = ENGINE_DEFINITIONS.filter((engine) => engineConfigured(env, engine.id)).map((engine) => engine.id);
  return configured.includes(HEADLINE_ENGINE_DEFAULT) ? HEADLINE_ENGINE_DEFAULT : configured[0] || HEADLINE_ENGINE_DEFAULT;
}

/**
 * Time bounds. A run stops issuing engine calls once its deadline passes (at
 * most this long after it started), keeps what it has, and refunds the rest of
 * its reservation. With one call in flight bounded by requestTimeoutMs, a run
 * holds its lock for at most SOV_RUN_TIME_BUDGET_MS + requestTimeoutMs plus
 * storage; the lock lease (pro-report.mjs) is set from these.
 */
export const SOV_RUN_TIME_BUDGET_MS = 10 * 60 * 1000;

/**
 * Cost control. These are hard limits enforced in code, not suggestions.
 * The batch is triggered daily but measures a pro site only every
 * SOV_MIN_INTERVAL_DAYS (3) days: ~10 scheduled runs x 10 calls = ~100 calls a
 * month, so the 200-call cap leaves headroom for manual runs on top.
 */
export const SOV_LIMITS = Object.freeze({
  maxQuestionsPerRun: 20,
  // Perplexity and ChatGPT. Each engine has its own monthly caps
  // (ai-engines.mjs engineCaps); this only bounds how many are asked per run.
  maxEnginesPerRun: 2,
  monthlyQueriesPerSite: 200,
  answerExcerptChars: 400,
  requestTimeoutMs: 20000,
  publicCacheTtlSeconds: 7 * 24 * 60 * 60,
});

/**
 * Domains that are directories/aggregators/platforms, not a competing business
 * site. The single list consulted when an answer is analysed and again when a
 * stored run is read back. Matching is by registrable suffix, so "yelp.com"
 * also covers "m.yelp.com"; country variants of the same brand are listed
 * because "yelp.co.uk" is not a subdomain of "yelp.com".
 */
export const AGGREGATOR_HOSTS = Object.freeze([
  // Japan
  "tabelog.com", "hotpepper.jp", "beauty.hotpepper.jp", "gurunavi.com", "gnavi.co.jp", "retty.me", "ikyu.com",
  "jalan.net", "rurubu.travel", "tripadvisor.jp", "note.com", "ameblo.jp", "epark.jp", "minimodel.jp",
  "ekiten.jp", "byoinnavi.jp", "rakuten.co.jp", "travel.rakuten.co.jp", "yahoo.co.jp", "goo.ne.jp",
  // Maps and search
  "google.com", "maps.google.com", "goo.gl", "maps.app.goo.gl", "g.page", "google.co.jp", "google.co.uk",
  "google.de", "google.fr", "google.es", "google.it", "google.com.br", "google.com.tw", "google.com.hk", "google.co.kr",
  "maps.apple.com", "bing.com", "mapquest.com", "waze.com", "here.com",
  // Global reviews, listings and bookings
  "yelp.com", "yelp.co.uk", "yelp.ca", "yelp.com.au", "yelp.de", "yelp.fr", "yelp.es", "yelp.it",
  "tripadvisor.com", "tripadvisor.co.uk", "tripadvisor.ca", "tripadvisor.com.au", "tripadvisor.de", "tripadvisor.fr",
  "tripadvisor.es", "tripadvisor.it", "tripadvisor.com.br", "tripadvisor.com.tw", "tripadvisor.com.hk", "tripadvisor.cn",
  "foursquare.com", "opentable.com", "opentable.co.uk", "opentable.de", "opentable.jp", "resy.com", "exploretock.com",
  "thefork.com", "thefork.co.uk", "thefork.fr", "thefork.it", "thefork.es", "lafourchette.com", "eltenedor.es",
  "quandoo.com", "quandoo.de", "zomato.com", "happycow.net", "michelin.com", "guide.michelin.com",
  "booking.com", "expedia.com", "hotels.com", "agoda.com", "trip.com", "airbnb.com", "kayak.com", "trivago.com",
  "groupon.com", "doordash.com", "ubereats.com", "grubhub.com", "deliveroo.co.uk", "just-eat.co.uk", "lieferando.de",
  "glovoapp.com", "ifood.com.br", "rappi.com", "foodpanda.com",
  "yellowpages.com", "yell.com", "pagesjaunes.fr", "paginasamarillas.es", "paginegialle.it", "gelbeseiten.de",
  "dasoertliche.de", "bbb.org", "angi.com", "thumbtack.com", "nextdoor.com", "trustpilot.com", "treatwell.com",
  "treatwell.co.uk", "treatwell.de", "treatwell.fr", "fresha.com", "booksy.com", "vagaro.com", "styleseat.com",
  "zocdoc.com", "doctolib.fr", "doctolib.de", "jameda.de", "healthgrades.com", "timeout.com", "eater.com",
  "restaurantguru.com", "wanderlog.com", "golocal.de", "11880.com", "cylex.de", "hotfrog.com", "restaurantes.com",
  "guiamais.com.br", "reclameaqui.com.br",
  // China, Taiwan, Hong Kong
  "dianping.com", "meituan.com", "ele.me", "baidu.com", "map.baidu.com", "amap.com", "gaode.com", "ctrip.com",
  "mafengwo.cn", "xiaohongshu.com", "openrice.com", "ipeen.com.tw", "ifoodie.tw", "eztable.com", "inline.app",
  "pixnet.net", "uber.com", "weibo.com", "zhihu.com", "douyin.com", "bilibili.com",
  // Korea
  "naver.com", "map.naver.com", "place.naver.com", "m.place.naver.com", "blog.naver.com", "naver.me",
  "kakao.com", "map.kakao.com", "place.map.kakao.com", "daum.net", "tistory.com", "mangoplate.com", "catchtable.co.kr",
  "diningcode.com", "yanolja.com", "yeogi.com",
  // Social, video, encyclopedias, blogs
  "facebook.com", "instagram.com", "x.com", "twitter.com", "youtube.com", "tiktok.com", "threads.net",
  "pinterest.com", "reddit.com", "linkedin.com", "line.me", "wikipedia.org", "ja.wikipedia.org", "wikivoyage.org",
  "medium.com", "quora.com",
]);

/* ------------------------------------------------------------------ *
 * Engine registry
 * ------------------------------------------------------------------ */

/**
 * Engine registry (ai-engines.mjs), in probe order. Both engines search
 * the live web and return sources. `key` names the secret binding and is the
 * only thing consulted to decide whether an engine is usable.
 */
const ENGINES = ENGINE_DEFINITIONS;

/** Engines whose secret is present. An engine without its key is never probed. */
export function availableEngines(env = {}) {
  return ENGINES
    .filter((engine) => engineConfigured(env, engine.id))
    .map(({ id, label, citations, live_search }) => ({ id, label, citations, live_search }))
    .slice(0, SOV_LIMITS.maxEnginesPerRun);
}

export function engineStatus(env = {}) {
  const engines = availableEngines(env);
  return {
    configured: engines.length > 0,
    engines: engines.map(({ id, label, citations, live_search }) => ({
      id, label, citations_available: citations, live_search,
    })),
    supported: ENGINES.map((engine) => engine.id),
  };
}

/* ------------------------------------------------------------------ *
 * Brand profile: who are we looking for in the answers
 * ------------------------------------------------------------------ */

const LOCALITY_KEYS = ["addressLocality", "addressRegion", "addressArea"];

/**
 * Derive the business name, type and locality used to build questions.
 *
 * Settings the owner typed win over anything inferred. The site's published
 * JSON-LD fills what is missing, which is why a site that already outputs good
 * schema (U1) gets better questions here.
 */
export function buildBrandProfile({ site = {}, settings = {}, schemas = [] } = {}) {
  const fromSchema = schemaProfile(schemas);
  const host = normalizeHost(site.website_uri || site.url || "");
  const name = firstNonEmpty(settings.name, fromSchema.name, host);
  if (!name) throw new SovError(422, "brand_name_unavailable");
  const businessType = firstNonEmpty(settings.business_type, fromSchema.businessType) || "";
  const address = String(settings.address || "");
  // Which language the questions are asked in. Every Japanese signal resolves
  // to "ja" first, so an existing Japanese site measures exactly as before.
  const decision = resolveSovLanguage({
    settingsLanguage: settings.language || settings.locale || "",
    address: firstNonEmpty(address, fromSchema.addressText),
    schemaCountry: fromSchema.country,
    siteLanguage: firstNonEmpty(site.language, site.locale, fromSchema.inLanguage),
    name,
    businessType,
    host,
  });
  return {
    name,
    businessType,
    locality: firstNonEmpty(localityFromAddress(settings.address), fromSchema.locality) || "",
    host,
    aliases: brandAliases(name, fromSchema.name, businessType),
    language: decision.language,
    language_source: decision.source,
    // Kept apart from `aliases` so a Japanese profile's identity (and with it
    // the measurement cache key and trend grouping) is unchanged.
    domain_alias: domainAlias(host, name, fromSchema.name, businessType),
  };
}

/**
 * The fields that identify a measurement setup. A Japanese profile hashes
 * exactly the fields it always did, so existing trend lines stay continuous;
 * other languages add the language so a language change starts a new series.
 */
export function profileIdentity(profile = {}) {
  const legacy = { name: profile.name, businessType: profile.businessType, locality: profile.locality, host: profile.host, aliases: profile.aliases };
  return !profile.language || profile.language === "ja" ? legacy : { ...legacy, language: profile.language };
}

/** Shortest alias that may be matched inside answer text. */
const MIN_ALIAS_CHARS = 2;

/**
 * Names that count as "this business was mentioned".
 *
 * The full name always counts. Derived forms (legal suffix stripped, the name
 * published in schema) only count when they survive two guards: they must be
 * long enough to be distinctive, and they must not simply be the business
 * type - a salon called "Cafe" must not match every answer containing "cafe".
 */
function brandAliases(name, schemaName, businessType) {
  const generic = normalizeForMatch(businessType || "");
  const candidates = dedupe([name, stripLegalSuffixes(name), schemaName].filter(Boolean));
  return candidates.filter((candidate, index) => {
    if (index === 0) return true; // the owner's own name, used as given
    const normalized = normalizeForMatch(candidate);
    if (normalized.length < MIN_ALIAS_CHARS) return false;
    return !(generic && normalized === generic);
  });
}

/**
 * The site's domain name without its TLD as an extra alias ("lumina-salon"
 * for lumina-salon.co.uk), or "" when it adds nothing or is too weak a signal:
 * shorter than MIN_DOMAIN_ALIAS_CHARS, an everyday word, the business type, or
 * already equal to a name alias once spacing/case/accents are ignored.
 */
function domainAlias(host, ...names) {
  const label = domainLabel(host);
  if (!label) return "";
  const normalized = normalizeForMatch(label);
  if (normalized.length < MIN_DOMAIN_ALIAS_CHARS || GENERIC_DOMAIN_LABELS.has(normalized)) return "";
  const loose = (value) => foldLatin(value).replace(/[^\p{L}\p{N}]+/gu, "");
  const looseLabel = loose(label);
  const nameForms = names.filter(Boolean).flatMap((value) => [value, stripLegalSuffixes(value)]);
  return nameForms.some((value) => loose(value) === looseLabel) ? "" : label;
}

/** Shortest domain label accepted as an alias ("ab.com" would match noise). */
const MIN_DOMAIN_ALIAS_CHARS = 4;
const GENERIC_DOMAIN_LABELS = new Set([
  "shop", "store", "cafe", "coffee", "salon", "hotel", "clinic", "restaurant", "bar", "bakery", "home", "info",
  "official", "online", "web", "site", "blog", "news", "food", "beauty", "hair", "spa", "dental", "travel",
  "example", "localhost", "nurevo",
]);

/**
 * The registrable label of a host without its TLD: "www.shiori-coffee.co.jp"
 * -> "shiori-coffee". Second-level public suffixes (co.jp, com.au, co.uk ...)
 * are skipped so the label is the brand, not "co".
 */
export function domainLabel(host) {
  const parts = normalizeHost(host).split(".").filter(Boolean);
  if (parts.length < 2 || parts.every((part) => /^\d+$/.test(part))) return "";
  let index = parts.length - 2;
  if (index > 0 && /^(?:co|com|net|org|ac|or|ne|go|gr|ed|lg|gov|edu|ltd|plc)$/.test(parts[index]) && parts[parts.length - 1].length === 2) index -= 1;
  return parts[index] || "";
}

function schemaProfile(schemas) {
  const result = { name: "", businessType: "", locality: "", country: "", addressText: "", inLanguage: "" };
  for (const node of Array.isArray(schemas) ? schemas : []) {
    if (!node || typeof node !== "object") continue;
    const types = (Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]]).filter(Boolean).map(String);
    const isBusiness = types.some((type) => /business|restaurant|store|organization|shop|hotel|clinic|dentist|service/i.test(type));
    if (!result.name && isBusiness && typeof node.name === "string") result.name = node.name.trim();
    if (!result.businessType && isBusiness) {
      result.businessType = String(node.additionalType || types.find((type) => !/^organization$/i.test(type)) || "").trim();
    }
    if (!result.locality && node.address && typeof node.address === "object") {
      for (const key of LOCALITY_KEYS) {
        if (typeof node.address[key] === "string" && node.address[key].trim()) {
          result.locality = node.address[key].trim();
          break;
        }
      }
    }
    if (!result.locality && typeof node.address === "string") result.locality = localityFromAddress(node.address);
    if (!result.inLanguage && typeof node.inLanguage === "string") result.inLanguage = node.inLanguage.trim();
    if (node.address && typeof node.address === "object" && !result.country && node.address.addressCountry) {
      result.country = typeof node.address.addressCountry === "string"
        ? node.address.addressCountry : String(node.address.addressCountry?.name || node.address.addressCountry?.identifier || "");
    }
    if (!result.addressText && node.address) {
      result.addressText = typeof node.address === "string" ? node.address
        : [node.address.streetAddress, node.address.addressLocality, node.address.addressRegion, node.address.postalCode]
          .filter((part) => typeof part === "string" && part.trim()).join(", ");
    }
  }
  return result;
}

/**
 * Pull a coarse locality out of a free-text address.
 *
 * A Japanese address keeps the original prefecture/ward/city parser exactly.
 * Hangul, Chinese and Latin-script addresses go to their own conservative
 * parsers, which return "" rather than a fragment when unsure, so the
 * questions are then asked without an area instead of with garbage.
 */
export function localityFromAddress(address) {
  const raw = String(address || "");
  if (!raw.trim()) return "";
  if (/[\uac00-\ud7af]/.test(raw)) return koreanLocality(raw);
  if (!looksJapaneseAddress(raw)) {
    if (/[\u3400-\u9fff]/.test(raw)) return chineseLocality(raw);
    return latinLocality(raw);
  }
  return japaneseLocality(raw);
}

function japaneseLocality(address) {
  const text = String(address || "").replace(/^\s*〒?\s*\d{3}-?\d{4}\s*/, "").trim();
  if (!text) return "";
  const match = text.match(/^(.{2,4}?[都道府県])?\s*(.{1,8}?[市区町村])?/);
  const ward = match?.[2]?.trim() || "";
  const prefecture = match?.[1]?.trim() || "";
  return ward || prefecture || text.slice(0, 12);
}

function stripLegalSuffixes(name) {
  return String(name).replace(/(株式会社|有限会社|合同会社|\bInc\.?|\bLLC\b|\bCo\.,? ?Ltd\.?)/gi, "").trim();
}

/* ------------------------------------------------------------------ *
 * Question set: 業種 × 地域
 * ------------------------------------------------------------------ */

/**
 * Representative questions a customer would actually ask, built from the
 * business type and locality.
 *
 * Discovery questions only. A question that already contains the business name
 * is almost always answered with that name, so mixing one in would measure the
 * question rather than the site's visibility. Branded questions exist solely as
 * a parser control - see brandedControlQuestions() - and never reach a
 * scheduled run.
 */
export function buildQuestionSet(profile, limit = SOV_LIMITS.maxQuestionsPerRun) {
  const localized = profile.language && profile.language !== "ja"
    ? localizedDiscoveryQuestions(profile.language, profile) : null;
  if (localized) return finishQuestions(localized, limit);
  const type = profile.businessType || "お店";
  const area = profile.locality || "";
  // Two forms are needed so the particle stays correct: "渋谷区の喫茶店" when
  // the area modifies the noun, "渋谷区で" when it modifies the verb phrase.
  const where = area ? `${area}の` : "";
  const inArea = area ? `${area}で` : "";
  const discovery = [
    `${where}${type}でおすすめはどこ？`,
    `${where}${type}を探しています。評判の良いところを教えて。`,
    `${inArea}人気の${type}を3つ挙げて。`,
    `${where}${type}の営業時間を知りたい。`,
    `${where}${type}で予約できるところは？`,
    `${where}${type}の料金相場と、おすすめの店を教えて。`,
    `${where}${type}で初めての人向けのところはどこ？`,
    `${where}${type}を駅から近い順に教えて。`,
    `${where}${type}の口コミが良いお店は？`,
    `今日${where}${type}に行きたい。候補を出して。`,
  ];
  return finishQuestions(discovery, limit);
}

function finishQuestions(discovery, limit) {
  const questions = discovery
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter((text, index, all) => text && all.indexOf(text) === index);
  return questions.slice(0, Math.max(1, Math.min(limit, SOV_LIMITS.maxQuestionsPerRun)));
}

/**
 * Brand-name questions used only to verify the mention parser against a known
 * answer. These are NOT part of any scheduled measurement: the answer is
 * guaranteed to contain the brand, so counting it would be circular. Results
 * are reported separately from the headline rate.
 */
export function brandedControlQuestions(profile, limit = 1) {
  const localized = profile.language && profile.language !== "ja"
    ? localizedBrandedQuestions(profile.language, profile) : null;
  const type = profile.businessType || "お店";
  const branded = localized || [
    `${profile.name}はどんな${type}？`,
    `${profile.name}の営業時間と住所を教えて。`,
    `${profile.name}の評判は？`,
  ];
  return branded
    .map((text) => ({ text: text.replace(/\s+/g, " ").trim(), kind: "branded" }))
    .slice(0, Math.max(1, limit));
}

/** Accept a plain string (discovery by default) or an explicit {text, kind}. */
function normalizeQuestion(question) {
  if (typeof question === "string") return { text: question, kind: "discovery" };
  return { text: String(question?.text || ""), kind: question?.kind === "branded" ? "branded" : "discovery" };
}

/* ------------------------------------------------------------------ *
 * Answer analysis
 * ------------------------------------------------------------------ */

/**
 * Decide whether an answer mentions and/or cites the brand, and collect the
 * other domains the engine cited so share-of-voice can be computed.
 */
export function analyzeAnswer({ answer = "", citations = [], profile }) {
  const text = String(answer);
  const aliases = profile.aliases || [profile.name];
  // A Japanese (or pre-language) profile keeps its original substring test as
  // a sufficient condition, so nothing it matched before stops matching.
  const legacy = !profile.language || profile.language === "ja";
  // The domain label counts as a name only outside URLs: a bare citation link
  // is citation evidence, not the business being named in the answer. Japanese
  // profiles do not use it, so their mention rule is exactly as before.
  const mentioned = (legacy && legacyMention(text, aliases))
    || mentionsBrand(text, aliases)
    || (!legacy && !!profile.domain_alias && mentionsBrand(text.replace(/https?:\/\/\S+/g, " "), [profile.domain_alias]));

  const providerUrls = citations.map((c) => typeof c === "string" ? c : c?.url);
  const citationUrls = dedupe([...providerUrls, ...urlsInText(text)].filter((u) => {
    try { return ["http:", "https:"].includes(new URL(u).protocol); } catch { return false; }
  }));
  const citedHosts = dedupe([
    ...citations.map((citation) => normalizeHost(typeof citation === "string" ? citation : citation?.url)),
    ...urlsInText(text).map(normalizeHost),
  ].filter(Boolean));

  const ownHost = profile.host ? normalizeHost(profile.host) : "";
  const owns = (host) => host === ownHost || host.endsWith(`.${ownHost}`);
  const cited = !!ownHost && citedHosts.some(owns);
  const competitorHosts = citedHosts.filter((host) => !sameSite(host, ownHost) && !isAggregator(host));

  return {
    mentioned,
    cited,
    citationUrls,
    citation_rank: ownHost ? (providerUrls.findIndex((u) => owns(normalizeHost(u))) + 1 || null) : null,
    rank_basis: "provider_source_order_not_search_ranking",
    citedHosts,
    competitorHosts,
    excerpt: text.replace(/\s+/g, " ").trim().slice(0, SOV_LIMITS.answerExcerptChars),
  };
}

/**
 * Whether the answer names the business.
 *
 * Exact containment of a vetted alias only. No stemming, no edit distance, no
 * partial scoring: an uncertain match is not an appearance.
 *
 * Aliases containing CJK/kana/Hangul keep the original NFKC substring test
 * (those scripts have no spaces to bound a word). A Latin-script alias is
 * compared case-insensitively with accents folded ("Café Müller" = "cafe
 * muller" = "Cafe Mueller") and must sit on word boundaries, so "Luna" does
 * not match "Lunatic". Spacing, hyphens and dots inside the name may differ
 * ("Blue-Bottle", "bluebottle.com") but the ends must not run into other letters.
 */
export function mentionsBrand(answer, aliases = []) {
  const text = String(answer || "");
  const compact = normalizeForMatch(text);
  const foldedTexts = [foldLatin(text), foldLatin(text, { german: true })];
  return aliases.filter(Boolean).some((alias) => {
    const value = String(alias);
    const normalized = normalizeForMatch(value);
    if (normalized.length < MIN_ALIAS_CHARS) return false;
    if (!isLatinAlias(value)) return compact.includes(normalized);
    return [foldLatin(value), foldLatin(value, { german: true })].some((folded) => {
      const pattern = latinAliasPattern(folded);
      return !!pattern && foldedTexts.some((candidate) => pattern.test(candidate));
    });
  });
}

/** The original matcher: NFKC/case/space-insensitive substring of any alias. */
function legacyMention(text, aliases) {
  const normalized = normalizeForMatch(text);
  return aliases.map(normalizeForMatch).filter((alias) => alias.length >= MIN_ALIAS_CHARS)
    .some((alias) => normalized.includes(alias));
}

function isLatinAlias(value) {
  const text = String(value).normalize("NFKC");
  return /\p{Script=Latin}/u.test(text) && !/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\uf900-\ufaff]/.test(text);
}

function latinAliasPattern(folded) {
  const tokens = folded.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (!tokens.length || tokens.join("").length < MIN_ALIAS_CHARS) return null;
  const escape = (token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Joined forms count too: "Blue Bottle" also matches "BlueBottle".
  const body = tokens.map(escape).join("[\\s\\-_.·/]*");
  // Bounded by Latin letters and digits only: "Nurevoです" is a mention in a
  // Japanese answer, "Lunatic" is not a mention of "Luna".
  return new RegExp(`(?<![\\p{Script=Latin}\\p{N}])${body}(?![\\p{Script=Latin}\\p{N}])`, "u");
}

/**
 * Aggregate per-question results into the reported rates and SoV ranking.
 *
 * The headline rate is computed from discovery questions only. A branded
 * control question names the business in the prompt, so its answer almost
 * always mentions it; including it would measure the question, not the site.
 * Controls are summarised separately under `parser_control`.
 *
 * It is also one engine's rate (`headlineEngine`, Perplexity by default; see
 * HEADLINE_ENGINE_DEFAULT): answers of different engines are never pooled into
 * it. `answers_received` still counts every engine's answers; each engine's
 * own figures are in `by_engine`, and the pooled named-or-cited figure is
 * `combined`.
 */
export function aggregateSov(samples, profile, { headlineEngine = null } = {}) {
  const discoverySamples = samples.filter((sample) => sample.kind !== "branded");
  const controlSamples = samples.filter((sample) => sample.kind === "branded");
  // A probe that failed (HTTP error, timeout, unconfigured engine) is excluded
  // from the denominator: an outage must lower confidence, never the rate.
  const answered = discoverySamples.filter((sample) => sample.ok);
  const total = answered.length;
  const rateAvailable = total >= SOV_MIN_SAMPLES_FOR_RATE;
  const rateOf = (count) => rateAvailable ? rate(count, total) : null;

  // The headline rate is one engine's (see HEADLINE_ENGINE_DEFAULT), never a
  // pool of engines: a sample without an engine is a Perplexity one (the only
  // engine before multi-engine runs). Without an explicit choice it is
  // Perplexity when Perplexity was asked, otherwise the one engine asked.
  const engineOf = (sample) => sample.engine || HEADLINE_ENGINE_DEFAULT;
  const askedEngines = dedupe(discoverySamples.map(engineOf));
  const headline = headlineEngine
    || (askedEngines.includes(HEADLINE_ENGINE_DEFAULT) || !askedEngines.length ? HEADLINE_ENGINE_DEFAULT : askedEngines[0]);
  const headlineAsked = discoverySamples.some((sample) => engineOf(sample) === headline);
  const headlineAnswered = answered.filter((sample) => engineOf(sample) === headline);
  const headlineTotal = headlineAnswered.length;
  const mentions = headlineAnswered.filter((sample) => sample.mentioned).length;
  const citations = headlineAnswered.filter((sample) => sample.cited).length;
  const headlineAvailable = headlineTotal >= SOV_MIN_SAMPLES_FOR_RATE;
  const headlineRate = (count) => headlineAvailable ? rate(count, headlineTotal) : null;

  const byHost = new Map();
  for (const sample of answered) {
    for (const host of dedupe(sample.competitorHosts || [])) {
      byHost.set(host, (byHost.get(host) || 0) + 1);
    }
  }
  const ownHost = normalizeHost(profile.host || "");
  const competitors = [...byHost.entries()]
    .map(([host, appearances]) => ({ host, appearances, appearance_rate: rateOf(appearances) }))
    .sort((a, b) => b.appearances - a.appearances || a.host.localeCompare(b.host))
    .slice(0, 10);

  return {
    model_version: SOV_MODEL_VERSION,
    beta: SOV_BETA,
    brand: { name: profile.name, host: ownHost || null },
    // The language the questions were asked in (null for a profile built
    // before languages existed, which was always Japanese).
    language: profile.language || null,
    language_source: profile.language_source || null,
    questions_asked: discoverySamples.length,
    // Every engine's answers; the rates below are the headline engine's.
    answers_received: total,
    appearance_rate: headlineRate(mentions),
    citation_rate: headlineRate(citations),
    // Distinguishes "measured 0%" from "could not be measured", and from "the
    // headline engine was not asked in this run".
    rate_basis: !headlineAsked && discoverySamples.length ? "not_asked"
      : headlineTotal === 0 ? "no_answers" : headlineAvailable ? "measured" : "insufficient_samples",
    min_samples_for_rate: SOV_MIN_SAMPLES_FOR_RATE,
    appearances: mentions,
    citations,
    headline: { engine: headline, asked: headlineAsked, answers: headlineTotal, appearances: mentions, citations },
    competitors,
    by_engine: engineBreakdown(discoverySamples, rateAvailable),
    // Every engine's answers pooled, with "appeared" meaning named in the
    // answer OR the site's domain among its sources. Named and cited are kept
    // apart so the reader can see which kind of appearance it was.
    combined: appearanceStats(answered),
    parser_control: controlSummary(controlSamples),
    // A handful of answers cannot support a confident rate. Say so instead of
    // letting the gauge imply precision it does not have.
    confidence: sovConfidence(headlineTotal),
  };
}

/** How far a rate from `answers` answers can be trusted (one engine's answers). */
export function sovConfidence(answers) {
  const total = Number(answers) || 0;
  return total < SOV_MIN_SAMPLES_FOR_RATE ? "none" : total < 5 ? "low" : total < 12 ? "medium" : "normal";
}

function rate(count, total) {
  return total > 0 ? Math.round((count / total) * 1000) / 1000 : null;
}

/**
 * Per-engine split of the same samples: each engine's answers, named, cited
 * and named-or-cited counts, rates and Wilson interval, so engines are always
 * reported side by side and never as one undifferentiated number.
 */
/**
 * Branded control questions, reported but never scored.
 *
 * `detected` is how often the parser found the brand in an answer that was
 * engineered to contain it: a low number means the matcher is broken, not that
 * visibility is low. Null when no control question was asked.
 */
function controlSummary(samples) {
  if (!samples.length) return null;
  const answered = samples.filter((sample) => sample.ok);
  return {
    asked: samples.length,
    answers: answered.length,
    detected: answered.filter((sample) => sample.mentioned).length,
    cited: answered.filter((sample) => sample.cited).length,
    excluded_from_rate: true,
    note: "Branded control question. Excluded from the appearance rate because the prompt names the business.",
  };
}

/**
 * Appearance counts for a set of answered samples: n answers, how many named
 * the business, how many cited its domain, how many did either ("appeared"),
 * with a Wilson 95% interval on the appeared rate. `small_sample` is true
 * below SMALL_SAMPLE_N answers, where the rate is reference only.
 */
export function appearanceStats(answered) {
  const n = answered.length;
  const named = answered.filter((sample) => sample.mentioned).length;
  const cited = answered.filter((sample) => sample.cited).length;
  const appeared = answered.filter((sample) => sample.mentioned || sample.cited).length;
  const measurable = n >= SOV_MIN_SAMPLES_FOR_RATE;
  return {
    n, named, cited, appeared,
    appearance_rate: measurable ? rate(appeared, n) : null,
    named_rate: measurable ? rate(named, n) : null,
    cited_rate: measurable ? rate(cited, n) : null,
    interval: measurable ? wilsonInterval(appeared, n) : null,
    small_sample: n < SMALL_SAMPLE_N,
  };
}

function engineBreakdown(samples, rateAvailable) {
  const byEngine = new Map();
  for (const sample of samples) {
    const id = sample.engine || "unknown";
    const row = byEngine.get(id) || { engine: id, answers: 0, failures: 0, appearances: 0, citations: 0, appeared: 0, est_cost_usd: 0 };
    if (sample.ok) {
      row.answers += 1;
      if (sample.mentioned) row.appearances += 1;
      if (sample.cited) row.citations += 1;
      if (sample.mentioned || sample.cited) row.appeared += 1;
    } else {
      row.failures += 1;
    }
    if (Number.isFinite(sample.cost?.est_usd)) row.est_cost_usd = Math.round((row.est_cost_usd + sample.cost.est_usd) * 1e6) / 1e6;
    byEngine.set(id, row);
  }
  return [...byEngine.values()].map((row) => {
    const meta = ENGINES.find((engine) => engine.id === row.engine);
    const measurable = rateAvailable && row.answers >= SOV_MIN_SAMPLES_FOR_RATE;
    return {
      ...row,
      live_search: meta ? meta.live_search : null,
      citations_available: meta ? meta.citations : null,
      // `appearance_rate` keeps its original meaning (named in the answer);
      // `any_rate` counts a citation of the site's domain as an appearance too.
      appearance_rate: measurable ? rate(row.appearances, row.answers) : null,
      citation_rate: measurable ? rate(row.citations, row.answers) : null,
      any_rate: measurable ? rate(row.appeared, row.answers) : null,
      interval: measurable ? wilsonInterval(row.appeared, row.answers) : null,
      small_sample: row.answers < SMALL_SAMPLE_N,
    };
  });
}

/* ------------------------------------------------------------------ *
 * Engine probes
 * ------------------------------------------------------------------ */

// The adapters (Perplexity, ChatGPT with web search) are in
// ai-engines.mjs and share one return shape.

/* ------------------------------------------------------------------ *
 * Measurement
 * ------------------------------------------------------------------ */

/**
 * Run the question set against the configured engines.
 *
 * `budget` caps how many engine calls may be made and is decremented as they
 * are issued, so the monthly cap holds even if a question set is large.
 * `deadline` (epoch ms) stops issuing calls once passed: the answers so far are
 * kept and the run says it was cut short (`stop_reason: "time_budget"`).
 * A call that timed out is costed at its assumed maximum (assumedMaxCallCost:
 * ChatGPT at max_tool_calls searches), since the provider may have done the
 * work and did not say how much.
 */
export async function measureSov(env, profile, {
  questions,
  budget = SOV_LIMITS.maxQuestionsPerRun * SOV_LIMITS.maxEnginesPerRun,
  engineBudgets = null,
  fetchImpl = fetch,
  repetitions = 1,
  engineIds,
  engineAdapters = ENGINE_ADAPTERS,
  deadline = null,
  clock = Date.now,
} = {}) {
  const engines = availableEngines(env).filter((e) => !engineIds || engineIds.includes(e.id));
  const headlineEngine = headlineEngineFor(env);
  if (!engines.length) {
    return {
      status: "unconfigured",
      ...engineStatus(env),
      ...aggregateSov([], profile, { headlineEngine }),
      samples: [],
      queries_used: 0,
      engines_run: [],
      engine_calls: {},
      limits: SOV_LIMITS,
    };
  }

  const questionSet = (questions && questions.length ? questions : buildQuestionSet(profile))
    .slice(0, SOV_LIMITS.maxQuestionsPerRun)
    .map(normalizeQuestion);
  const samples = [];
  let used = 0;
  let truncated = false;
  let stopReason = null;
  const outOfTime = () => Number.isFinite(deadline) && clock() >= deadline;
  // Calls issued per engine, checked against that engine's own allowance
  // (engineBudgets) so one engine reaching its cap never stops the others.
  const calls = Object.fromEntries(engines.map((engine) => [engine.id, 0]));
  const stopped = new Map();
  const allowanceOf = (id) => {
    const value = engineBudgets ? Number(engineBudgets[id]) : Infinity;
    return Number.isFinite(value) ? Math.max(0, value) : Infinity;
  };

  const repeats = Math.max(1, Math.min(3, Number.isInteger(repetitions) ? repetitions : 1));
  for (const question of questionSet.flatMap((q) => Array.from({ length: repeats }, (_, i) => ({ ...q, sample_index: i + 1 })))) {
    for (const engine of engines) {
      if (used >= budget) { truncated = true; break; }
      if (outOfTime()) { truncated = true; stopReason = "time_budget"; break; }
      if (stopped.has(engine.id)) continue;
      if (calls[engine.id] >= allowanceOf(engine.id)) { stopped.set(engine.id, "engine_budget_reached"); truncated = true; continue; }
      used += 1;
      calls[engine.id] += 1;
      try {
        const probe = await engineAdapters[engine.id](env, question.text, fetchImpl, { profile });
        if (!String(probe?.answer || "").trim()) throw Object.assign(new SovError(502, "empty_answer"), { cost: probe?.cost || null });
        const analysis = analyzeAnswer({ ...probe, profile });
        samples.push({
          ok: true, measured_at: new Date().toISOString(), sample_index: question.sample_index, engine_model: probe.model || null,
          usage: probe.usage || null, cost: probe.cost || null, engine: engine.id, question: question.text, kind: question.kind,
          business_mentions: Array.isArray(probe.mentions) ? probe.mentions.slice(0, 15) : [],
          sources: sourceTitles(probe.citations),
          ...analysis,
        });
      } catch (error) {
        // A failed probe is recorded but excluded from the rate denominator,
        // so an engine outage lowers confidence instead of the score.
        const timedOut = error?.name === "AbortError" || error?.name === "TimeoutError";
        const code = error instanceof SovError ? error.code : timedOut ? `${engine.id}_timeout` : "engine_request_failed";
        samples.push({
          ok: false, measured_at: new Date().toISOString(), sample_index: question.sample_index, engine: engine.id, question: question.text, kind: question.kind,
          error: code,
          error_detail: error instanceof SovError ? error.detail || null : null,
          cost: error?.cost || (timedOut ? assumedMaxCallCost(engine.id, env) : null),
        });
        // The provider says its quota is spent: asking again only adds failures.
        if (isProviderQuotaError(code)) stopped.set(engine.id, code);
      }
    }
    if (used >= budget) { truncated = true; break; }
    if (stopReason) break;
  }

  return {
    status: "measured",
    ...engineStatus(env),
    ...aggregateSov(samples, profile, { headlineEngine }),
    samples,
    repetitions: repeats,
    queries_used: used,
    engines_run: engines.map((engine) => engine.id),
    engine_calls: calls,
    engine_stops: Object.fromEntries(stopped),
    truncated,
    stop_reason: stopReason,
    limits: SOV_LIMITS,
  };
}

/** Source URLs with the title the engine gave them, for the reviewer. */
function sourceTitles(citations) {
  return (Array.isArray(citations) ? citations : [])
    .map((citation) => typeof citation === "string" ? { url: citation, title: null }
      : citation && typeof citation.url === "string" ? { url: citation.url, title: typeof citation.title === "string" ? citation.title.slice(0, 200) : null } : null)
    .filter(Boolean)
    .slice(0, 20);
}

/* ------------------------------------------------------------------ *
 * Monthly query cap (enforced, not advisory)
 * ------------------------------------------------------------------ */

export function sovMonthKey(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 7);
}

/** Remaining engine calls this site may spend this month. */
export async function sovRemainingBudget(env, siteId, now = Date.now()) {
  const month = sovMonthKey(now);
  const row = await env.DB.prepare("SELECT queries_used FROM aeo_sov_usage WHERE site_id=? AND month=?")
    .bind(siteId, month).first();
  const used = Number(row?.queries_used || 0);
  return { month, used, cap: SOV_LIMITS.monthlyQueriesPerSite, remaining: Math.max(0, SOV_LIMITS.monthlyQueriesPerSite - used) };
}

export async function sovRecordUsage(env, siteId, queries, now = Date.now()) {
  if (!queries) return;
  await env.DB.prepare(`
    INSERT INTO aeo_sov_usage (site_id,month,queries_used,updated_at) VALUES (?,?,?,?)
    ON CONFLICT(site_id,month) DO UPDATE SET queries_used=queries_used+excluded.queries_used,updated_at=excluded.updated_at
  `).bind(siteId, sovMonthKey(now), queries, new Date(now).toISOString()).run();
}

/* ------------------------------------------------------------------ *
 * Persistence
 * ------------------------------------------------------------------ */

export async function storeSovRun(env, siteId, result, { trigger = "manual", now = Date.now() } = {}) {
  const statements = [];
  const id = `sov_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const ranAt = new Date(now).toISOString();
  statements.push(env.DB.prepare(`
    INSERT INTO aeo_sov_runs
      (id,site_id,ran_at,status,trigger,model_version,engines_json,questions_asked,answers_received,
       queries_used,appearance_rate,citation_rate,confidence,competitors_json,detail_json)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    id, siteId, ranAt, result.status, trigger, SOV_MODEL_VERSION,
    JSON.stringify(result.engines || []), result.questions_asked || 0, result.answers_received || 0,
    result.queries_used || 0, result.appearance_rate, result.citation_rate, result.confidence,
    JSON.stringify(result.competitors || []),
    // Keep what the aggregation already worked out. Without these the reader
    // cannot tell a measured zero from an unmeasurable one, and cannot separate
    // the engine that searches the web from the one answering out of model
    // knowledge - it would have to recompute both from the mention rows and
    // get the branded controls wrong doing it.
    JSON.stringify({
      query_set: result.query_set || null,
      cache_key: result.cache_key || null,
      repetitions: result.repetitions || 1,
      beta: SOV_BETA,
      truncated: !!result.truncated,
      brand: result.brand,
      language: result.language ?? null,
      language_source: result.language_source ?? null,
      rate_basis: result.rate_basis,
      min_samples_for_rate: result.min_samples_for_rate,
      by_engine: result.by_engine || [],
      parser_control: result.parser_control ?? null,
      // Multi-engine: which engines were actually asked (the trend of each
      // engine and of the combined rate is keyed on this), the pooled
      // named-or-cited figures, and why any configured engine was not asked.
      engines_run: Array.isArray(result.engines_run) ? result.engines_run : null,
      combined: result.combined ?? null,
      engine_status: Array.isArray(result.engine_status) ? result.engine_status : null,
      engine_stops: result.engine_stops || null,
      // Whose rate the run-level appearance_rate / citation_rate columns are.
      headline: result.headline ?? null,
      stop_reason: result.stop_reason || null,
    }),
  ));

  const samples = (result.samples || []).slice(0, SOV_LIMITS.maxQuestionsPerRun * SOV_LIMITS.maxEnginesPerRun * 3);
  for (const sample of samples) {
    statements.push(env.DB.prepare(`
      INSERT INTO aeo_sov_mentions
        (run_id,site_id,engine,question,kind,ok,brand_mentioned,brand_cited,competitor_hosts_json,answer_excerpt,error)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      id, siteId, sample.engine, sample.question,
      // Recorded so a later reader can exclude the controls the aggregation
      // already excluded, instead of silently folding them into the rate.
      sample.kind === "branded" ? "branded" : "discovery",
      sample.ok ? 1 : 0,
      sample.mentioned ? 1 : 0, sample.cited ? 1 : 0,
      JSON.stringify(sample.competitorHosts || []), sample.excerpt || null, sample.error || null,
    ));
  }
  for (const sample of samples) {
    statements.push(env.DB.prepare(`INSERT INTO aeo_sov_evidence
      (id,run_id,site_id,measured_at,engine,question,sample_index,ok,answer_summary,citation_urls_json,brand_cited,citation_rank,accuracy_json,usage_json)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
        crypto.randomUUID(), id, siteId, sample.measured_at || ranAt, sample.engine, sample.question,
        sample.sample_index || 1, sample.ok ? 1 : 0, sample.excerpt || null,
        JSON.stringify(sample.citationUrls || []), sample.cited ? 1 : 0, sample.citation_rank || null,
        JSON.stringify({ mentioned: sample.ok ? !!sample.mentioned : null, status: "unreviewed", description: sample.excerpt || null,
          kind: sample.kind || "discovery", error: sample.error || null, error_detail: sample.error_detail || null, engine_model: sample.engine_model || null,
          // Evidence for the reviewer only; never scored.
          business_mentions: Array.isArray(sample.business_mentions) ? sample.business_mentions : [],
          sources: Array.isArray(sample.sources) ? sample.sources : [],
          est_cost_usd: Number.isFinite(sample.cost?.est_usd) ? sample.cost.est_usd : null }),
        sample.usage ? JSON.stringify(sample.usage) : null,
      ));
  }
  if (result.status === "measured") {
    statements.push(env.DB.prepare(`INSERT INTO aeo_learning_observations
      (run_id,site_id,measured_at,score_scanned_at,scoring_ruleset_version,delivered_ruleset_version,model_version,measurement_json)
      SELECT ?,?,?,s.scanned_at,s.ruleset_version,s.delivered_ruleset_version,s.score_model_version,?
      FROM (SELECT 1) seed LEFT JOIN aeo_scores s ON s.site_id=? AND s.scanned_at=(
        SELECT MAX(scanned_at) FROM aeo_scores WHERE site_id=? AND scanned_at<=?)`)
      .bind(id,siteId,ranAt,JSON.stringify({measurement_model:SOV_MODEL_VERSION,engines:result.engines || [],status:result.status,appearance_rate:result.appearance_rate ?? null,citation_rate:result.citation_rate ?? null,answers_received:result.answers_received || 0,query_set:result.query_set || null}),siteId,siteId,ranAt));
  }
  if (env.DB.batch) await env.DB.batch(statements);
  else for (const statement of statements) await statement.run();
  return { id, ran_at: ranAt };
}

/**
 * Why a run reports no rate.
 *
 * Runs written before 0022 did not store this, so it is recomputed from the
 * answer count using the same threshold the aggregation applied. That keeps an
 * old row readable without inventing anything: the answer count and the
 * threshold are exactly what decided the rate in the first place.
 */
export function deriveRateBasis(answersReceived) {
  const answers = Number(answersReceived || 0);
  if (answers === 0) return "no_answers";
  return answers >= SOV_MIN_SAMPLES_FOR_RATE ? "measured" : "insufficient_samples";
}

/** Latest run plus the trend series the dashboard graphs. */
export async function loadSovHistory(env, siteId, { limit = 26 } = {}) {
  const bounded = Math.min(52, Math.max(1, limit));
  const result = await env.DB.prepare(`
    SELECT id,ran_at,status,trigger,appearance_rate,citation_rate,confidence,
           questions_asked,answers_received,queries_used,competitors_json,engines_json,detail_json
      FROM aeo_sov_runs WHERE site_id=? ORDER BY ran_at DESC LIMIT ?
  `).bind(siteId, bounded).all();
  const rows = result.results || [];
  const latest = rows[0] || null;
  const detail = latest ? safeJsonObject(latest.detail_json) : {};
  return {
    latest: latest ? {
      ...latest,
      // Aggregators were already dropped when the answer was analysed. Applying
      // the same list again on the way out means a row written by an older
      // build - or edited by hand - cannot put tabelog back in front of the
      // operator as if it were a competitor.
      competitors: safeJsonArray(latest.competitors_json)
        .filter((entry) => entry && !isAggregator(String(entry.host || ""))),
      engines: safeJsonArray(latest.engines_json),
      // Stored since 0022; derived for anything older. A row that predates the
      // per-engine split reports an empty breakdown rather than one recomputed
      // from mention rows, which could not tell a branded control apart.
      rate_basis: RATE_BASES.includes(detail.rate_basis)
        ? detail.rate_basis
        : deriveRateBasis(latest.answers_received),
      rate_basis_derived: !RATE_BASES.includes(detail.rate_basis),
      min_samples_for_rate: Number(detail.min_samples_for_rate) || SOV_MIN_SAMPLES_FOR_RATE,
      by_engine: asArray(detail.by_engine),
      parser_control: detail.parser_control ?? null,
      truncated: !!detail.truncated,
      // Stored since multilingual questions; older runs were all Japanese.
      language: typeof detail.language === "string" ? detail.language : null,
      // Since multi-engine measurement; older runs asked Perplexity only.
      engines_run: Array.isArray(detail.engines_run) ? detail.engines_run : null,
      combined: detail.combined ?? null,
      engine_status: asArray(detail.engine_status),
      headline_engine: headlineEngineOf(detail),
      stop_reason: typeof detail.stop_reason === "string" ? detail.stop_reason : null,
    } : null,
    trend: rows.slice().reverse().map((row) => {
      const rowDetail = safeJsonObject(row.detail_json);
      return {
        ran_at: row.ran_at,
        engines_run: enginesRunOf(rowDetail),
        // The run-level rates are this engine's (headline_engine); compare a
        // point only with points of the same engine, or use engine_rates.
        headline_engine: headlineEngineOf(rowDetail),
        appearance_rate: row.appearance_rate,
        citation_rate: row.citation_rate,
        answers_received: row.answers_received,
        confidence: row.confidence,
        engine_rates: engineRatesOf(row, rowDetail),
      };
    }),
  };
}

/**
 * Whose rate a stored run's appearance_rate column is. Runs before the
 * headline was stored: Perplexity when Perplexity was asked (it always was
 * before multi-engine runs), otherwise the one engine asked; a run that pooled
 * several engines without saying so has no single headline (null).
 */
export function headlineEngineOf(detail = {}) {
  if (typeof detail?.headline?.engine === "string") return detail.headline.engine;
  const engines = enginesRunOf(detail);
  return engines.length === 1 ? engines[0] : null;
}

/**
 * One stored run's rates per engine, comparable across runs of that engine:
 * { [engine]: { answers, asked, appearance_rate, citation_rate } }, where
 * appearance_rate is "named in the answer" (the column's meaning) and the
 * rate is null below SOV_MIN_SAMPLES_FOR_RATE answers. Taken from the stored
 * per-engine split; a run without one that asked a single engine uses its
 * run-level figures for that engine.
 */
export function engineRatesOf(row = {}, detail = safeJsonObject(row.detail_json)) {
  const out = {};
  for (const entry of asArray(detail.by_engine)) {
    if (!entry || typeof entry.engine !== "string") continue;
    const answers = Number(entry.answers || 0);
    const measurable = answers >= SOV_MIN_SAMPLES_FOR_RATE;
    out[entry.engine] = {
      answers,
      asked: answers + Number(entry.failures || 0),
      appearance_rate: measurable ? rate(Number(entry.appearances || 0), answers) : null,
      citation_rate: measurable ? rate(Number(entry.citations || 0), answers) : null,
    };
  }
  const engines = enginesRunOf(detail);
  if (!Object.keys(out).length && engines.length === 1 && row.status !== "unconfigured") {
    out[engines[0]] = {
      answers: Number(row.answers_received || 0),
      asked: Number(row.questions_asked || 0),
      appearance_rate: row.appearance_rate ?? null,
      citation_rate: row.citation_rate ?? null,
    };
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/**
 * The engines a stored run asked, sorted. Runs written before multi-engine
 * measurement asked Perplexity only (the scheduled and manual runs were pinned
 * to it), so a missing list reads as ["perplexity"].
 */
export function enginesRunOf(detail = {}) {
  const list = Array.isArray(detail?.engines_run) ? detail.engines_run.filter((id) => typeof id === "string") : null;
  return list ? [...new Set(list)].sort() : ["perplexity"];
}

function safeJsonArray(value) {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

/** A stored JSON object, or {} for anything unreadable - including JSON that
 *  parses to an array or a scalar, which would otherwise read as an object with
 *  no keys and silently lose the distinction. */
function safeJsonObject(value) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/** An already-parsed value that should be a list. */
function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function dedupe(values) {
  return [...new Set(values)];
}

export function normalizeHost(value) {
  let text = String(value || "").trim().toLowerCase();
  if (!text) return "";
  if (!/^[a-z][a-z0-9+.-]*:\/\//.test(text)) text = `https://${text}`;
  try { return new URL(text).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function sameSite(a, b) {
  if (!a || !b) return false;
  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);
}

function isAggregator(host) {
  return AGGREGATOR_HOSTS.some((known) => sameSite(host, known));
}

function urlsInText(text) {
  return String(text).match(/https?:\/\/[^\s<>()[\]"'、。]+/g) || [];
}

/** Lowercase, strip spaces and width differences so brand matching is robust. */
export function normalizeForMatch(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s　]+/g, "")
    .replace(/[・･'’"“”`]/g, "");
}
