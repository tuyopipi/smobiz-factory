import { authorizeSiteKey } from "./agent-authorization.mjs";
import { AI_CRAWLERS, buildLlmsTxt, robotsBlock, matchCrawler } from "./ai-crawlers.js";
import { AEO_CACHE_TTL_SECONDS, AEO_RATE_LIMIT, AEO_SCORE_MODEL_VERSION, AeoScoreError, diagnoseAeoUrl, fetchSchemaNodes, localizeAeoChecks, resolveAeoCheckLang } from "./aeo-score.mjs";
import { storeAeoScore } from "./diagnose.mjs";
import {
  SOV_BETA, SOV_LIMITS, SOV_MODEL_VERSION, SovError,
  availableEngines, buildBrandProfile, buildQuestionSet,
  engineStatus, loadSovHistory, measureSov, sovRecordUsage, sovRemainingBudget, storeSovRun,
} from "./aeo-sov.mjs";
import { buildMonthlyReport, renderMonthlyReportHtml, renderMonthlyReportText } from "./aeo-report.mjs";
import {
  PROFILE_FIELD_NAMES, mergeProfile, parseFieldSources, profileResponse,
  profileToColumns, rowToProfile, serializeFieldSources,
} from "./site-profile.mjs";
import { normalizeDomainKey } from "./domain-key.mjs";
import { planFromSubscription, pricesFromEnv, resolveSitePlan } from "./billing-plan.mjs";

const LIVE_AEO_CACHE_CONTROL = "public, max-age=60, s-maxage=60, stale-while-revalidate=240";
const json = (obj, status = 200, extraHeaders = {}) => new Response(JSON.stringify(obj), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
    ...extraHeaders,
  },
});
const uid = () => crypto.randomUUID().replace(/-/g, "").slice(0, 12);
const newKey = () => `nrv_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
const AUTH_MAGIC_TTL_MS = 15 * 60 * 1000;
const AUTH_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CSRF_TTL_SECONDS = Math.floor(AUTH_SESSION_TTL_MS / 1000);
const API_RATE_LIMITS = Object.freeze({
  authIp: { limit: 10, windowMs: 10 * 60 * 1000 },
  authEmail: { limit: 5, windowMs: 60 * 60 * 1000 },
  memberIp: { limit: 10, windowMs: 60 * 60 * 1000 },
  memberEmail: { limit: 3, windowMs: 60 * 60 * 1000 },
  crawlerHit: { limit: 120, windowMs: 60 * 1000 },
  siteProfile: { limit: 60, windowMs: 60 * 60 * 1000 },
  // Binding is unauthenticated by necessity - the license key is the only
  // credential the plugin holds - so it is limited twice: per caller, to slow
  // key guessing from one place, and per key, so a leaked key cannot be redeemed
  // across the internet faster than a human would notice.
  licenseBindIp: { limit: 10, windowMs: 60 * 60 * 1000 },
  licenseBindKey: { limit: 20, windowMs: 24 * 60 * 60 * 1000 },
});
const PLACES_SEARCH_FIELD_MASK = "places.id,places.displayName,places.formattedAddress,places.location,places.regularOpeningHours,places.nationalPhoneNumber,places.types,places.primaryType,places.primaryTypeDisplayName,places.priceLevel,places.websiteUri";
// Place Details (New) uses resource-relative field names (without the `places.` prefix).
const PLACES_DETAILS_FIELD_MASK = "id,displayName,formattedAddress,location,regularOpeningHours,nationalPhoneNumber,types,primaryType,primaryTypeDisplayName,priceLevel,websiteUri";
const PLACES_REFRESH_MS = 365 * 24 * 60 * 60 * 1000;
// Centralized defaults; later Stripe/admin settings can replace this object without changing billing logic.
const BILLING_DEFAULTS = Object.freeze({ direct_monthly_yen: 3000, referral_monthly_yen: 1200, wholesale_monthly_yen: 2000 });
const SUPER_ADMIN_EMAILS_ENV = "SUPER_ADMIN_EMAILS";
/*
 * What has to be filled in before a profile counts as complete.
 *
 * Every entry is something the owner can actually type into the dashboard. The
 * old list required price_level, which only Google Places ever writes and the
 * listing query did not even select - so the bar could never be cleared, and a
 * site sat at "incomplete" with nothing the operator could do about it.
 *
 * business_type is judged on the schema.org type, which is the field WordPress
 * edits and the one that reaches @type. business_type_label is a display string
 * Places fills in and no human owns.
 */
const PROFILE_REQUIRED = Object.freeze(["name", "phone", "address", "hours", "geo", "business_type_schema"]);

/* Reported so the form can encourage them, but they never block completion. */
const PROFILE_OPTIONAL = Object.freeze(["description", "email", "url", "image", "reserve_url", "price_level"]);
const INITIAL_AEO_RULESET = Object.freeze({
  version: 1,
  created_at: "2026-09-30T00:00:00.000Z",
  active: 1,
  notes: "Initial ruleset matching the pre-AEO-brain JSON-LD output.",
  definition: Object.freeze({
    schema: Object.freeze({
      context: "https://schema.org",
      type: "LocalBusiness",
      required: ["@context", "@type", "name"],
      recommended: ["url", "additionalType", "address", "telephone", "openingHours", "openingHoursSpecification", "geo", "priceRange", "image", "potentialAction"],
      fields: Object.freeze({ url: true, additionalType: true, address: true, telephone: true, openingHours: true, openingHoursSpecification: true, geo: true, priceRange: true, image: true, potentialAction: true }),
      hostedFields: ["address", "openingHoursSpecification", "geo", "telephone", "priceRange"],
      priceLevelMap: Object.freeze({ PRICE_LEVEL_FREE: "Free", PRICE_LEVEL_INEXPENSIVE: "¥", PRICE_LEVEL_MODERATE: "¥¥", PRICE_LEVEL_EXPENSIVE: "¥¥¥", PRICE_LEVEL_VERY_EXPENSIVE: "¥¥¥¥" }),
      hostedPriceLevelMap: Object.freeze({ PRICE_LEVEL_FREE: "¥", PRICE_LEVEL_INEXPENSIVE: "¥", PRICE_LEVEL_MODERATE: "¥¥", PRICE_LEVEL_EXPENSIVE: "¥¥¥", PRICE_LEVEL_VERY_EXPENSIVE: "¥¥¥" }),
    }),
    llmsTxt: Object.freeze({ format: "markdown", sections: ["identity", "store_information", "supported_ai_crawlers"] }),
    robots: Object.freeze({ defaultAllow: true, aiCrawlerIds: ["gptbot", "oai-search", "chatgpt-user", "claudebot", "perplexity", "google-ext", "applebot-ext", "bytespider"] }),
    defaults: Object.freeze({ schemaType: "LocalBusiness", nameSource: "settings.name_or_site.url", hostedBaseUrl: "https://nurevo.jp/s/" }),
  }),
});

/**
 * Completeness of a canonical profile.
 *
 * Takes the canonical field names, so the dashboard form, the site listing and
 * the new read endpoint all score the same record the same way instead of each
 * inspecting raw columns.
 */
function profileCompleteness(values = {}) {
  const filledValue = (field) => {
    const value = values[field];
    return value !== null && value !== undefined && String(value).trim() !== "";
  };
  const has = {
    geo: values.lat != null && values.lng != null,
  };
  for (const field of [...PROFILE_REQUIRED, ...PROFILE_OPTIONAL]) {
    if (field === "geo") continue;
    has[field] = filledValue(field);
  }
  const filled = PROFILE_REQUIRED.filter((field) => has[field]).length;
  return {
    filled,
    total: PROFILE_REQUIRED.length,
    pct: Math.round((filled / PROFILE_REQUIRED.length) * 100),
    has,
    required: PROFILE_REQUIRED,
    optional: PROFILE_OPTIONAL,
    // The fields still blocking completion, so a caller can say which.
    missing: PROFILE_REQUIRED.filter((field) => !has[field]),
  };
}

function rulesetDefinition(ruleset) {
  if (!ruleset) return INITIAL_AEO_RULESET.definition;
  if (ruleset.definition && typeof ruleset.definition === "object") return ruleset.definition;
  if (typeof ruleset.definition_json === "string") {
    try { return JSON.parse(ruleset.definition_json); } catch { return INITIAL_AEO_RULESET.definition; }
  }
  return ruleset;
}

function normalizeRulesetDefinition(value) {
  let definition = value;
  const errors = [];
  if (typeof definition === "string") {
    try { definition = JSON.parse(definition); } catch { return { ok: false, errors: ["definition_json must be valid JSON"] }; }
  }
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
    return { ok: false, errors: ["definition_json must be a JSON object"] };
  }
  const schema = definition.schema;
  const llmsTxt = definition.llmsTxt;
  const robots = definition.robots;
  const defaults = definition.defaults;
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) errors.push("schema is required");
  if (!llmsTxt || typeof llmsTxt !== "object" || Array.isArray(llmsTxt)) errors.push("llmsTxt is required");
  if (!robots || typeof robots !== "object" || Array.isArray(robots)) errors.push("robots is required");
  if (!defaults || typeof defaults !== "object" || Array.isArray(defaults)) errors.push("defaults is required");
  if (schema) {
    if (typeof schema.context !== "string" || !schema.context.trim()) errors.push("schema.context is required");
    if (typeof schema.type !== "string" || !schema.type.trim()) errors.push("schema.type is required");
    if (!Array.isArray(schema.required) || !["@context", "@type", "name"].every((key) => schema.required.includes(key))) errors.push("schema.required must include @context, @type and name");
    if (!schema.fields || typeof schema.fields !== "object" || Array.isArray(schema.fields)) errors.push("schema.fields is required");
  }
  if (llmsTxt) {
    if (typeof llmsTxt.format !== "string" || !llmsTxt.format.trim()) errors.push("llmsTxt.format is required");
    if (!Array.isArray(llmsTxt.sections) || !llmsTxt.sections.length) errors.push("llmsTxt.sections must be a non-empty array");
  }
  if (robots) {
    if (typeof robots.defaultAllow !== "boolean") errors.push("robots.defaultAllow must be boolean");
    const crawlerIds = new Set(AI_CRAWLERS.map((crawler) => crawler.id));
    if (!Array.isArray(robots.aiCrawlerIds) || !robots.aiCrawlerIds.length || robots.aiCrawlerIds.some((id) => !crawlerIds.has(id))) errors.push("robots.aiCrawlerIds must contain supported crawler ids");
  }
  if (defaults) {
    if (typeof defaults.schemaType !== "string" || !defaults.schemaType.trim()) errors.push("defaults.schemaType is required");
    if (typeof defaults.hostedBaseUrl !== "string" || !/^https:\/\//i.test(defaults.hostedBaseUrl)) errors.push("defaults.hostedBaseUrl must be an https URL");
  }
  if (errors.length) return { ok: false, errors };
  const serialized = JSON.stringify(definition);
  if (new TextEncoder().encode(serialized).byteLength > 64 * 1024) return { ok: false, errors: ["definition_json exceeds 64 KiB"] };
  return { ok: true, definition, json: serialized };
}

async function loadActiveRuleset(env) {
  if (!env?.DB) return INITIAL_AEO_RULESET;
  try {
    const row = await env.DB.prepare(
      "SELECT version, created_at, definition_json, active, notes FROM aeo_rulesets WHERE active = 1 ORDER BY version DESC LIMIT 1",
    ).first();
    return row || INITIAL_AEO_RULESET;
  } catch (error) {
    if (!String(error?.message || error).includes("no such table")) throw error;
    return INITIAL_AEO_RULESET;
  }
}

function buildJsonLd(site, settings, ruleset) {
  const definition = rulesetDefinition(ruleset);
  const schema = definition?.schema || INITIAL_AEO_RULESET.definition.schema;
  const fields = schema.fields || INITIAL_AEO_RULESET.definition.schema.fields;
  const defaults = definition?.defaults || INITIAL_AEO_RULESET.definition.defaults;
  // A site-specific schema.org type wins over the ruleset default: it is the
  // owner's own statement about what the business is.
  const schemaType = settings.business_type_schema || schema.type || defaults.schemaType || "LocalBusiness";
  const ld = { "@context": schema.context || "https://schema.org", "@type": schemaType, name: settings.name || site.url };
  const hostedBaseUrl = defaults.hostedBaseUrl || "https://nurevo.jp/s/";
  const canonicalUrl = site?.website_uri || (site?.url ? (/^https?:\/\//i.test(site.url) ? site.url : `https://${site.url}`) : null) || (site?.slug ? `${hostedBaseUrl}${encodeURIComponent(site.slug)}` : null);
  if (fields.url !== false && canonicalUrl) ld.url = canonicalUrl;
  // additionalType carries the human-facing label (e.g. 美容室). Fall back to the
  // schema type so a site migrated from the single-column layout is not blank.
  const typeLabel = settings.business_type || settings.business_type_schema;
  if (fields.additionalType !== false && typeLabel) ld.additionalType = typeLabel;
  if (fields.address !== false && settings.address) ld.address = { "@type": "PostalAddress", streetAddress: settings.address };
  if (fields.telephone !== false && settings.tel) ld.telephone = settings.tel;
  if (fields.openingHours !== false && settings.hours) ld.openingHours = settings.hours;
  const hours = openingHoursSpecification(settings.hours_periods, settings.hours);
  if (fields.openingHoursSpecification !== false && hours.length) ld.openingHoursSpecification = hours;
  if (fields.geo !== false && settings.lat != null && settings.lng != null) ld.geo = { "@type": "GeoCoordinates", latitude: settings.lat, longitude: settings.lng };
  const priceRange = (schema.priceLevelMap || INITIAL_AEO_RULESET.definition.schema.priceLevelMap)[settings.price_level] || settings.price;
  if (fields.priceRange !== false && priceRange) ld.priceRange = priceRange;
  if (fields.image !== false && settings.image) ld.image = settings.image;
  if (fields.potentialAction !== false && settings.reserve_url) ld.potentialAction = { "@type": "ReserveAction", target: settings.reserve_url };
  return ld;
}

export async function handleApi(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (path === "/api/aeo/score" && method === "GET") {
    const raw = url.searchParams.get("url") || "";
    const rate = await aeoPublicRateLimit(request, env);
    if (!rate.allowed) return json({ error: "rate_limited" }, 429, { "retry-after": String(rate.retryAfter) });
    try {
      const lang = requestedAeoLang(request, url);
      // The cache key deliberately excludes the language: one diagnosis is
      // reused for every language, and the wording is applied on the way out.
      // Caching per language would multiply the entries and let the first
      // visitor's language decide what everyone else sees until it expired.
      const cacheKey = `aeo-score:${AEO_SCORE_MODEL_VERSION}:url:${await aeoSha256Hex(normalizeAeoCacheUrl(raw))}`;
      const cached = await env.WEBMCP_KV?.get(cacheKey, "json");
      const vary = { "cache-control": `public, max-age=${AEO_CACHE_TTL_SECONDS}`, "vary": "accept-language" };
      if (cached) return json(aeoResponse(cached, lang), 200, { ...vary, "x-aeo-cache": "hit" });
      const result = await diagnoseAeoUrl(raw);
      const write = env.WEBMCP_KV?.put(cacheKey, JSON.stringify(aeoResponse(result)), { expirationTtl: AEO_CACHE_TTL_SECONDS });
      if (write && ctx?.waitUntil) ctx.waitUntil(write); else if (write) await write;
      return json(aeoResponse(result, lang), 200, { ...vary, "x-aeo-cache": "miss" });
    } catch (error) {
      if (error instanceof AeoScoreError) return json({ error: error.code }, error.status);
      throw error;
    }
  }

  // Public checker, lightweight sample: one question against one engine.
  // Always cached, and explicitly "preparing" when no engine key is set, so the
  // public page never burns engine quota per visitor.
  if (path === "/api/aeo/mention" && method === "GET") {
    const raw = url.searchParams.get("url") || "";
    const rate = await aeoPublicRateLimit(request, env);
    if (!rate.allowed) return json({ error: "rate_limited" }, 429, { "retry-after": String(rate.retryAfter) });

    const engines = availableEngines(env);
    if (!engines.length) {
      return json({
        status: "preparing",
        beta: SOV_BETA,
        message: "AI登場チェックは準備中です。",
        ...engineStatus(env),
      }, 200, { "cache-control": "public, max-age=300" });
    }

    let target;
    try { target = normalizeAeoCacheUrl(raw); } catch (error) {
      if (error instanceof AeoScoreError) return json({ error: error.code }, error.status);
      throw error;
    }
    const engine = engines[0];
    const cacheKey = `aeo-mention:${SOV_MODEL_VERSION}:${engine.id}:${await aeoSha256Hex(target)}`;
    const cached = await env.WEBMCP_KV?.get(cacheKey, "json");
    if (cached) {
      return json(cached, 200, { "cache-control": `public, max-age=${SOV_LIMITS.publicCacheTtlSeconds}`, "x-aeo-cache": "hit" });
    }

    let body;
    try {
      const schemas = await fetchSchemaNodes(target);
      const profile = buildBrandProfile({ site: { website_uri: target }, settings: {}, schemas });
      const question = buildQuestionSet(profile, 1)[0];
      const probe = await measureSov(env, profile, { questions: [question], budget: 1 });
      const sample = probe.samples[0];
      body = {
        status: sample?.ok ? "measured" : "unavailable",
        beta: SOV_BETA,
        engine: { id: engine.id, label: engine.label, citations_available: engine.citations },
        brand: profile.name,
        question,
        mentioned: sample?.ok ? sample.mentioned : null,
        cited: sample?.ok ? sample.cited : null,
        sample_size: 1,
        // One answer is one data point, not a rate. The caller is told so it
        // cannot present this as a measured appearance rate.
        note: "1質問×1エンジンの参考サンプルです。登場率の測定はProプランで行います。",
        upgrade_url: "https://nurevo.jp/dashboard",
      };
    } catch (error) {
      if (error instanceof SovError || error instanceof AeoScoreError) {
        return json({ error: error.code }, error.status);
      }
      throw error;
    }

    const write = env.WEBMCP_KV?.put(cacheKey, JSON.stringify(body), { expirationTtl: SOV_LIMITS.publicCacheTtlSeconds });
    if (write && ctx?.waitUntil) ctx.waitUntil(write); else if (write) await write;
    return json(body, 200, { "cache-control": `public, max-age=${SOV_LIMITS.publicCacheTtlSeconds}`, "x-aeo-cache": "miss" });
  }

  const siteAeoScoreMatch = path.match(/^\/api\/sites\/([^/]+)\/aeo-score$/i);
  if (siteAeoScoreMatch && method === "GET") {
    const siteId = decodeURIComponent(siteAeoScoreMatch[1]);
    const siteKey = url.searchParams.get("site_key") || url.searchParams.get("siteKey") || url.searchParams.get("k");
    const auth = await authorizeSiteKey(env, siteKey, { touch: false });
    if (!auth.registered || String(auth.siteId) !== siteId) return json({ error: "invalid_site_key" }, 404);
    const site = await env.DB.prepare("SELECT id,url,website_uri,slug FROM sites WHERE id=? LIMIT 1").bind(siteId).first();
    if (!site) return json({ error: "not_found" }, 404);
    const target = String(site.website_uri || site.url || "").trim()
      || (site.slug ? `https://nurevo.jp/s/${encodeURIComponent(site.slug)}` : "");
    try {
      const result = await diagnoseAeoUrl(/^https?:\/\//i.test(target) ? target : `https://${target}`);
      // Stored history keeps the default wording; only the reply is localised,
      // so the archive stays comparable across requests from different locales.
      await storeAeoScore(env, site.id, { ...result, verdict: result.band });
      return json(aeoResponse(result, requestedAeoLang(request, url)), 200, { "vary": "accept-language" });
    } catch (error) {
      if (error instanceof AeoScoreError) return json({ error: error.code }, error.status);
      throw error;
    }
  }

  if (path === "/api/license/verify" && method === "POST") {
    const payload = await readLicensePayload(request);
    if (!payload.ok) return json({ error: payload.error, plan: "free" }, payload.status);
    const licenseHash = await sha256Hex(String(payload.value.license || "").trim());
    const license = await env.DB.prepare(
      "SELECT plan FROM licenses WHERE license_hash=? AND active=1 LIMIT 1",
    ).bind(licenseHash).first();
    const plan = normalizeAeoPlan(license?.plan);
    if (!license || plan === "free") return json({ ok: false, error: "invalid_license", plan: "free" }, 404);
    const siteKey = String(payload.value.site_key || payload.value.siteKey || "").trim();
    if (siteKey) {
      const auth = await authorizeSiteKey(env, siteKey, { touch: false });
      if (!auth.registered) return json({ ok: false, error: "invalid_site_key", plan: "free" }, 404);
      // The license no longer sets the plan; billing does. Report what the site
      // actually has rather than what the key would once have granted, so a
      // cancelled customer is not told they are still on pro.
      const site = await env.DB.prepare("SELECT plan, manual_plan FROM sites WHERE id=? LIMIT 1").bind(auth.siteId).first();
      return json({ ok: true, plan: resolveSitePlan(site || {}) });
    }
    return json({ ok: true, plan });
  }

  // Bind-on-license: redeem a license against a domain and get back everything
  // the plugin needs to act as a registered site. This is the only path that
  // creates a sites row from a self-installed plugin, so it is also the only
  // place a site_id and profile token are minted without a dashboard session.
  //
  // Unauthenticated by necessity: the license key is the credential. It is never
  // compared against anything the caller also supplies, and every failure that
  // could reveal whether a key exists answers with the same shape.
  if (path === "/api/license/bind" && method === "POST") {
    const payload = await readLicensePayload(request);
    if (!payload.ok) return json({ ok: false, error: payload.error }, payload.status);

    const ipLimit = await checkApiRateLimit(env, "license-bind-ip", requestClientIp(request), API_RATE_LIMITS.licenseBindIp);
    if (!ipLimit.allowed) {
      return json({ ok: false, error: ipLimit.unavailable ? "rate_limit_unavailable" : "rate_limited" }, ipLimit.unavailable ? 503 : 429);
    }

    const licenseHash = await sha256Hex(String(payload.value.license || "").trim());
    const keyLimit = await checkApiRateLimit(env, "license-bind-key", licenseHash, API_RATE_LIMITS.licenseBindKey);
    if (!keyLimit.allowed) {
      return json({ ok: false, error: keyLimit.unavailable ? "rate_limit_unavailable" : "rate_limited" }, keyLimit.unavailable ? 503 : 429);
    }

    // Local installs are a real development case, so loopback is accepted only
    // when the request itself is not from the public internet.
    const allowReserved = env.WEBMCP_ALLOW_LOCAL_BIND === "1";
    const domainKey = normalizeDomainKey(payload.value.domain ?? payload.value.site_url ?? "", { allowReserved })
      ?? normalizeDomainKey(payload.value.site_url ?? "", { allowReserved });
    if (!domainKey) return json({ ok: false, error: "invalid_domain" }, 400);

    const license = await env.DB.prepare(
      "SELECT license_hash, plan, org_id, seats, manual FROM licenses WHERE license_hash=? AND active=1 LIMIT 1",
    ).bind(licenseHash).first();
    const plan = normalizeAeoPlan(license?.plan);
    // One answer for "no such key", "inactive key" and "free key": a caller must
    // not be able to probe which licenses exist.
    if (!license || plan === "free") return json({ ok: false, error: "invalid_license" }, 404);
    // A key with no org cannot create a site; refusing is honest, inventing an
    // org would attach a paying customer to nothing.
    if (!license.org_id) return json({ ok: false, error: "license_not_provisioned" }, 409);

    const installType = ["wp", "tag", "hosted"].includes(String(payload.value.install_type || "").trim())
      ? String(payload.value.install_type).trim()
      : "wp";
    const siteUrl = String(payload.value.site_url || "").trim().slice(0, 2048);

    const bound = await bindLicenseToDomain(env, { license, plan, domainKey, siteUrl, installType });
    if (!bound.ok) return json({ ok: false, error: bound.error }, bound.status);
    return json(bound.body);
  }

  if (["POST", "PUT", "DELETE"].includes(method) && csrfRequired(path) && !csrfValid(request)) {
    return json({ error: "csrf_failed" }, 403);
  }

  const hostedMatch = path.match(/^\/s\/([^/]+)(?:\/(llms\.txt))?$/i);
  if (hostedMatch && method === "GET") {
    const slug = decodeURIComponent(hostedMatch[1]);
    const hosted = await loadHostedStore(env, slug);
    if (!hosted) return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
    if (hosted.delivery_status === "stopped") return new Response("Gone", { status: 410, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
    const crawler = matchCrawler(request.headers.get("user-agent") || "");
    if (crawler) {
      const hit = recordRateLimitedCrawlerHit(env, hosted.id, crawler.id);
      if (ctx?.waitUntil) ctx.waitUntil(hit);
      else await hit;
    }
    const ruleset = await loadActiveRuleset(env);
    const rulesetVersion = String(ruleset.version || INITIAL_AEO_RULESET.version);
    if (hostedMatch[2]) return new Response(buildHostedLlms(hosted, ruleset), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": LIVE_AEO_CACHE_CONTROL, "x-aeo-ruleset-version": rulesetVersion } });
    const locale = preferredHostedLocale(url, request);
    return new Response(localizeHostedMarkup(renderHostedStore(hosted, locale, ruleset), HOSTED_LABELS[locale] || HOSTED_LABELS.ja, locale), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": LIVE_AEO_CACHE_CONTROL, "vary": "accept-language", "x-aeo-ruleset-version": rulesetVersion } });
  }

  if (path === "/robots.txt" && method === "GET") {
    const allow = AI_CRAWLERS.map((crawler) => `User-agent: ${crawler.ua}\nAllow: /s/`).join("\n\n");
    return new Response(`${allow}\n\nSitemap: https://nurevo.jp/sitemap.xml\n`, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" } });
  }

  if (path === "/sitemap.xml" && method === "GET") {
    const { results } = await env.DB.prepare("SELECT slug FROM sites WHERE install_type='hosted' AND (delivery_status IS NULL OR delivery_status='active') AND slug IS NOT NULL AND slug<>'' ORDER BY slug").all();
    const escXml = (value) => String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
    const urls = (results || []).map((row) => `  <url><loc>https://nurevo.jp/s/${escXml(row.slug)}</loc></url>`).join("\n");
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=300" } });
  }

  if (path === "/llms.txt" && method === "GET") {
    const { results } = await env.DB.prepare(
      `SELECT s.slug, ss.name, COALESCE(ss.business_type, ss.business_type_schema) AS business_type, ss.address, ss.hours, ss.tel
         FROM sites s JOIN site_settings ss ON ss.site_id=s.id
        WHERE s.install_type='hosted' AND (s.delivery_status IS NULL OR s.delivery_status='active') AND s.slug IS NOT NULL AND s.slug<>''
        ORDER BY s.slug`,
    ).all();
    const lines = ["# Nurevo hosted stores", "", "Nurevoのホスト店舗ページ一覧です。", ""];
    for (const store of results || []) {
      lines.push(`## ${store.name || store.slug}`);
      lines.push(`- URL: https://nurevo.jp/s/${store.slug}`);
      if (store.business_type) lines.push(`- 業種: ${store.business_type}`);
      if (store.address) lines.push(`- 住所: ${store.address}`);
      if (store.hours) lines.push(`- 営業時間: ${store.hours}`);
      if (store.tel) lines.push(`- 電話: ${store.tel}`);
      lines.push("");
    }
    return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" } });
  }

  if (path === "/api/auth/request" && method === "POST") {
    return handleMagicRequest(request, env);
  }

  if (path === "/api/auth/callback" && method === "GET") {
    return handleMagicCallback(request, env);
  }

  if (path === "/api/auth/logout" && method === "POST") {
    return handleMagicLogout(request, env);
  }

  if (path === "/api/csrf" && method === "GET") {
    return csrfResponse(request);
  }

  if (path === "/api/members/register" && method === "POST") {
    return handleMemberRegistration(request, env);
  }
  if (path === "/api/members" && method === "GET") {
    const admin = await requireMember(request, env);
    if (!admin) return json({ error: "forbidden" }, 403);
    const { results } = await env.DB.prepare("SELECT id,email,role,status,created_at,org_id FROM members WHERE org_id=? ORDER BY created_at").bind(admin.org_id).all();
    return json({ members: results || [] });
  }
  if (path === "/api/admin/pending" && method === "GET") {
    const superAdmin = await requireSuperAdmin(request, env);
    if (!superAdmin) return json({ error: "forbidden" }, 403);
    const { results } = await env.DB.prepare(
      "SELECT m.id,m.email,m.role,m.status,m.created_at,m.org_id,o.name AS org_name FROM members m LEFT JOIN orgs o ON o.id=m.org_id WHERE m.status='pending' ORDER BY m.created_at",
    ).all();
    return json({ pending: results || [] });
  }
  if (path === "/api/admin/partners" && method === "GET") {
    const superAdmin = await requireSuperAdmin(request, env);
    if (!superAdmin) return json({ error: "forbidden" }, 403);
    const { results } = await env.DB.prepare(
      `SELECT r.id,r.name,r.type,r.email,r.created_at AS joined_at,
              COUNT(CASE WHEN s.status='active' THEN 1 END) AS active_sites
         FROM referrers r
         LEFT JOIN sites s ON s.referred_by=r.id
        GROUP BY r.id,r.name,r.type,r.email,r.created_at
        ORDER BY r.created_at DESC`,
    ).all();
    return json({ partners: (results || []).map((row) => {
      const activeSites = Number(row.active_sites || 0);
      const unit = row.type === "agency" || row.type === "wholesale" ? BILLING_DEFAULTS.wholesale_monthly_yen : 1800;
      return { id: row.id, name: row.name, type: row.type === "agency" || row.type === "wholesale" ? "agency" : "individual", active_sites: activeSites, monthly_amount_yen: activeSites * unit, joined_at: row.joined_at };
    }) });
  }
  if (path === "/api/admin/orgs" && method === "GET") {
    const superAdmin = await requireSuperAdmin(request, env);
    if (!superAdmin) return json({ error: "forbidden" }, 403);
    const { results } = await env.DB.prepare(
      "SELECT o.id,o.name,o.plan,o.wholesale_min,COUNT(s.id) AS site_count,SUM(CASE WHEN s.status='active' THEN 1 ELSE 0 END) AS active_sites FROM orgs o LEFT JOIN sites s ON s.org_id=o.id GROUP BY o.id,o.name,o.plan,o.wholesale_min ORDER BY o.created_at",
    ).all();
    return json({ orgs: results || [] });
  }
  if (path === "/api/admin/aeo/rulesets" && method === "GET") {
    const superAdmin = await requireSuperAdmin(request, env);
    if (!superAdmin) return json({ error: "forbidden" }, 403);
    const { results } = await env.DB.prepare(`
      SELECT r.version,r.active,r.created_at,r.notes,
             h.activated_at,h.activated_by
        FROM aeo_rulesets r
        LEFT JOIN aeo_ruleset_activations h ON h.id = (
          SELECT id FROM aeo_ruleset_activations
           WHERE ruleset_version=r.version
           ORDER BY activated_at DESC,id DESC LIMIT 1
        )
       ORDER BY r.version DESC
    `).all();
    return json({ rulesets: results || [] });
  }
  if (path === "/api/admin/aeo/rulesets" && method === "POST") {
    const superAdmin = await requireSuperAdmin(request, env);
    if (!superAdmin) return json({ error: "forbidden" }, 403);
    const body = await safeJson(request);
    const normalized = normalizeRulesetDefinition(body.definition_json);
    if (!normalized.ok) return json({ error: "invalid_definition_json", details: normalized.errors }, 400);
    const notes = String(body.notes || "").trim();
    if (notes.length > 2000) return json({ error: "notes_too_long" }, 400);
    const createdAt = new Date().toISOString();
    const created = await env.DB.prepare(`
      INSERT INTO aeo_rulesets (version,created_at,definition_json,active,notes)
      SELECT COALESCE(MAX(version),0)+1,?,?,0,? FROM aeo_rulesets
      RETURNING version,created_at,active,notes
    `).bind(createdAt, normalized.json, notes || null).first();
    return json({ ok: true, ruleset: created }, 201);
  }
  const rulesetDetailMatch = path.match(/^\/api\/admin\/aeo\/rulesets\/(\d+)$/);
  if (rulesetDetailMatch && method === "GET") {
    const superAdmin = await requireSuperAdmin(request, env);
    if (!superAdmin) return json({ error: "forbidden" }, 403);
    const version = Number(rulesetDetailMatch[1]);
    const ruleset = await env.DB.prepare(
      "SELECT version,created_at,definition_json,active,notes FROM aeo_rulesets WHERE version=?",
    ).bind(version).first();
    if (!ruleset) return json({ error: "not_found" }, 404);
    const { results } = await env.DB.prepare(
      "SELECT id,activated_at,activated_by,notes FROM aeo_ruleset_activations WHERE ruleset_version=? ORDER BY activated_at DESC,id DESC",
    ).bind(version).all();
    return json({ ruleset, activations: results || [] });
  }
  const rulesetActivateMatch = path.match(/^\/api\/admin\/aeo\/rulesets\/(\d+)\/activate$/);
  if (rulesetActivateMatch && method === "POST") {
    const superAdmin = await requireSuperAdmin(request, env);
    if (!superAdmin) return json({ error: "forbidden" }, 403);
    const version = Number(rulesetActivateMatch[1]);
    const ruleset = await env.DB.prepare(
      "SELECT version,definition_json,active,notes FROM aeo_rulesets WHERE version=?",
    ).bind(version).first();
    if (!ruleset) return json({ error: "not_found" }, 404);
    const normalized = normalizeRulesetDefinition(ruleset.definition_json);
    if (!normalized.ok) return json({ error: "invalid_ruleset_definition", details: normalized.errors }, 409);
    const body = await safeJson(request);
    const activationNotes = String(body.notes || "").trim();
    if (activationNotes.length > 2000) return json({ error: "notes_too_long" }, 400);
    const activatedAt = new Date().toISOString();
    const activationId = `act_${uid()}`;
    await env.DB.batch([
      env.DB.prepare("UPDATE aeo_rulesets SET active=0 WHERE active=1"),
      env.DB.prepare("UPDATE aeo_rulesets SET active=1 WHERE version=?").bind(version),
      env.DB.prepare("INSERT INTO aeo_ruleset_activations (id,ruleset_version,activated_at,activated_by,notes) VALUES (?,?,?,?,?)")
        .bind(activationId, version, activatedAt, superAdmin.member_id, activationNotes || ruleset.notes || null),
    ]);
    return json({ ok: true, version, active: 1, activated_at: activatedAt, activated_by: superAdmin.member_id });
  }
  if (path === "/api/members/invites" && method === "POST") {
    const admin = await requireMember(request, env);
    if (!admin) return json({ error: "forbidden" }, 403);
    const inviteBody = await safeJson(request);
    const inviteOrgId = admin.is_super_admin ? String(inviteBody.org_id || "").trim() : admin.org_id;
    if (!inviteOrgId) return json({ error: "org_id_required" }, 400);
    if (!admin.is_super_admin) {
      const ownOrg = await env.DB.prepare("SELECT id FROM orgs WHERE id=?").bind(inviteOrgId).first();
      if (!ownOrg) return json({ error: "forbidden" }, 403);
    }
    const rawCode = randomHex(12);
    const codeHash = await sha256Hex(rawCode);
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await env.DB.prepare("INSERT INTO sessions (token,member_id,org_id,kind,expires_at) VALUES (?,?,?,?,?)")
      .bind(codeHash, admin.member_id, inviteOrgId, "member_invite", expiresAt).run();
    return json({ ok: true, code: rawCode, expires_at: expiresAt }, 201);
  }
  const memberMatch = path.match(/^\/api\/members\/([^/]+)$/i);
  if (memberMatch && method === "GET") {
    const admin = await requireAdmin(request, env);
    if (!admin) return json({ error: "forbidden" }, 403);
    const member = await loadOwnedMember(env, admin, memberMatch[1]);
    if (!member) {
      const exists = await env.DB.prepare("SELECT id FROM members WHERE id=?").bind(memberMatch[1]).first();
      return exists ? json({ error: "forbidden" }, 403) : json({ error: "not_found" }, 404);
    }
    return json({ member });
  }
  const approveMatch = path.match(/^\/api\/members\/([^/]+)\/approve$/i);
  if (approveMatch && method === "POST") {
    const admin = await requireAdmin(request, env);
    if (!admin) return json({ error: "forbidden" }, 403);
    const result = admin.is_super_admin
      ? await env.DB.prepare("UPDATE members SET status='active' WHERE id=? AND status='pending'").bind(approveMatch[1]).run()
      : await env.DB.prepare("UPDATE members SET status='active' WHERE id=? AND org_id=? AND status='pending'").bind(approveMatch[1], admin.org_id).run();
    if (Number(result?.meta?.changes || 0) !== 1) {
      const foreignMember = await env.DB.prepare("SELECT id,org_id,status FROM members WHERE id=?").bind(approveMatch[1]).first();
      if (foreignMember && !admin.is_super_admin && foreignMember.org_id !== admin.org_id) return json({ error: "forbidden" }, 403);
      return json({ error: "member_not_pending" }, 409);
    }
    return json({ ok: true, id: approveMatch[1], status: "active" });
  }

  if (path === "/api/me" && method === "GET") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const row = await env.DB.prepare("SELECT email, role FROM members WHERE id=? AND org_id=?")
      .bind(member.member_id, member.org_id).first();
    if (!row) return json({ error: "unauthorized" }, 401);
    return attachCsrf(json({ email: row.email, role: row.role, org_id: member.org_id, is_super_admin: !!member.is_super_admin }), request);
  }

  if (path === "/api/tag/config" && method === "GET") {
    const auth = await authorizeSiteKey(env, url.searchParams.get("k") || url.searchParams.get("siteKey"));
    if (!auth.registered) return json({ ok: false }, 404);
    const siteState = await env.DB.prepare("SELECT delivery_status FROM sites WHERE id = ?").bind(auth.siteId).first();
    if (!siteState || siteState.delivery_status === "stopped") return json({ ok: false }, 404);
    const settings = await env.DB.prepare("SELECT * FROM site_settings WHERE site_id = ?").bind(auth.siteId).first() || {};
    const site = await env.DB.prepare("SELECT url, website_uri, slug FROM sites WHERE id = ?").bind(auth.siteId).first();
    const plan = normalizeAeoPlan(auth.plan);
    const ruleset = plan === "free" ? INITIAL_AEO_RULESET : await loadActiveRuleset(env);
    const store = {
      name: settings.name || site?.url || "",
      address: settings.address || "",
      tel: settings.tel || "",
      hours: settings.hours || "",
      reserve: settings.reserve_url || "",
      url: site?.url || "",
    };
    const body = {
      ok: true,
      plan,
      quality: auth.quality,
      crawlerAllowed: !!settings.allow_crawlers,
      jsonld: settings.serve_schema ? buildJsonLd(site, settings, ruleset) : null,
      ruleset_version: Number(ruleset.version || INITIAL_AEO_RULESET.version),
      store,
    };
    return json(body, 200, {
      "cache-control": LIVE_AEO_CACHE_CONTROL,
      "access-control-expose-headers": "x-aeo-ruleset-version",
      "x-aeo-ruleset-version": String(ruleset.version || INITIAL_AEO_RULESET.version),
    });
  }

  if (path === "/api/tag/hit") {
    if (method !== "POST") return json({ error: "method_not_allowed" }, 405, { allow: "POST" });
    const auth = await authorizeSiteKey(env, url.searchParams.get("k") || url.searchParams.get("siteKey"), { touch: false });
    if (!auth.registered) return json({ error: "invalid_site_key" }, 404);

    const crawler = matchCrawler(request.headers.get("user-agent") || "");
    if (!crawler) return json({ ok: true, recorded: false });

    const limit = await crawlerHitRateLimit(env, auth.siteId, crawler.id);
    if (limit.unavailable) return json({ error: "rate_limit_unavailable" }, 503);
    if (!limit.allowed) return json({ error: "rate_limited" }, 429, { "retry-after": String(Math.ceil(API_RATE_LIMITS.crawlerHit.windowMs / 1000)) });

    await recordCrawlerHit(env, auth.siteId, crawler.id);
    return json({ ok: true, recorded: true, crawler_id: crawler.id });
  }

  if (path === "/api/places/search" && method === "GET") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const query = String(url.searchParams.get("q") || "").trim();
    if (query.length < 2) return json({ error: "query_required" }, 400);
    try {
      const places = await searchPlaces(env, query);
      return json({ places });
    } catch (error) {
      const detail = error?.detail && typeof error.detail === "object" ? error.detail : { googleMessage: "places_search_failed" };
      console.error("nurevo_places_search_error", JSON.stringify({
        message: error?.message || "places_search_failed",
        upstreamStatus: error?.status || null,
        detail,
      }));
      return json({
        error: "places_unavailable",
        reason: "google_places_error",
        upstreamStatus: error?.status || null,
        detail,
        message: "Googleマップから店舗候補を取得できませんでした。しばらくしてから再試行してください。",
      }, 502);
    }
  }

  if (path === "/api/sites" && method === "POST") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    if (!member.is_super_admin && !["admin", "store", "referrer", "agency"].includes(member.role)) return json({ error: "forbidden" }, 403);
    const body = await request.json();
    const installType = ["wp", "tag", "hosted", "static"].includes(body?.install_type) ? body.install_type : "tag";
    const siteUrl = String(body?.url || "").trim();
    if (!["hosted"].includes(installType) && !siteUrl) return json({ error: "url required" }, 400);
    const placeId = String(body?.place_id || "").trim();
    if (!placeId) return json({ error: "place_selection_required", message: "Googleマップの候補を選択してください。" }, 400);
    const id = uid();
    const siteKey = newKey();
    const slug = installType === "hosted" ? await uniqueSlug(env, body?.name || "store", id) : null;
    await env.DB.prepare(
      "INSERT INTO sites (id, org_id, owner_member_id, url, site_key, install_type, status, plan, contract, slug, place_id, created_at) VALUES (?,?,?,?,?,?,'pending','free','free',?,?,?)",
    ).bind(id, member.org_id, member.member_id, siteUrl.replace(/^https?:\/\//, ""), siteKey, installType, slug, placeId, Date.now()).run();
    let imported = null;
    if (placeId) {
      const importedSite = await env.DB.prepare("SELECT * FROM sites WHERE id=? AND org_id=?").bind(id, member.org_id).first();
      const result = await importPlaceForSite(env, importedSite, { placeId });
      if (result.status !== 200) return json(result.body || { error: "places_unavailable" }, result.status);
      imported = result.body;
    }
    if (installType === "hosted" || installType === "static") {
      // Place import may already have created this row. Ensure it exists with
      // the output toggles on, then record the registrant's name through the
      // merger so it carries provenance like every other profile write.
      await env.DB.prepare(
        "INSERT INTO site_settings (site_id,serve_schema,allow_crawlers) VALUES (?,1,1) ON CONFLICT(site_id) DO NOTHING",
      ).bind(id).run();
      if (body?.name) await writeSiteProfile(env, id, { name: body.name }, "dashboard");
    }
    // Issued with the site so the store-profile sync works immediately. Returned
    // once in plaintext; only the hash is kept. Unlike site_key - which the tag
    // prints into public markup - this one must never reach a public page.
    const profileToken = await issueProfileToken(env, id);
    const snippet = `<script src="https://nurevo.jp/tag.js" data-webmcp-site-key="${siteKey}" defer></` + "script>";
    return json({ id, siteKey, profile_token: profileToken, install_type: installType, slug: imported?.slug || slug, hostedUrl: (imported?.slug || slug) ? `/s/${imported?.slug || slug}` : null, snippet, imported, proposal: imported?.proposal || null });
  }

  if (path === "/api/sites" && method === "GET") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const { results } = await listOwnedSites(env, member);
    const now = Date.now();
    const sites = results.map((row) => {
      // Scored on the canonical field names, the same way /api/sites/:id and
      // the edit form score it.
      const fill = profileCompleteness({
        name: row.s_name, phone: row.tel, address: row.address, hours: row.hours,
        lat: row.lat, lng: row.lng, business_type_schema: row.business_type_schema,
        description: row.description, email: row.email, url: row.website_uri,
        image: row.image, reserve_url: row.reserve_url, price_level: row.price_level,
      });
      const stale = row.last_seen_at && now - row.last_seen_at > 24 * 3600e3;
      const checklist = [
        { key: "map", done: !!row.place_id, manual: false },
        { key: "website", done: row.fetched_at != null, manual: false },
        { key: "site_type", done: !!row.website_fingerprint, manual: false },
        { key: "tag_schema", done: row.install_type === "hosted" ? true : row.tag_detected === true && row.schema_in_html === true, manual: false },
        { key: "gbp_linked", done: !!row.gbp_linked, manual: true },
      ].sort((a, b) => Number(a.done) - Number(b.done));
      return {
        id: row.id,
        url: row.url,
        install_type: row.install_type || (row.url ? "tag" : "hosted"),
        channel: row.channel || "direct",
        delivery_status: row.delivery_status || "active",
        payment_ui: row.channel !== "wholesale" && row.org_plan !== "wholesale",
        gbp_linked: !!row.gbp_linked,
        key: row.site_key,
        status: stale ? "error" : row.status,
        schema_types: row.schema_types || 0,
        crawler_allowed: !!row.crawler_allowed,
        place_id: row.place_id || null,
        fetchedAt: row.fetched_at || null,
        slug: row.slug || null,
        hostedUrl: row.slug ? `/s/${row.slug}` : null,
        tag_detected: row.tag_detected == null ? null : !!row.tag_detected,
        schema_in_html: row.schema_in_html == null ? null : !!row.schema_in_html,
        scanned_at: row.scanned_at || null,
        scan_error: row.scan_error || null,
        fill: { filled: fill.filled, total: fill.total, pct: fill.pct },
        lastSeen: row.last_seen_at,
        website_uri: row.website_uri || null,
        website_fingerprint: row.website_fingerprint || null,
        recommended_install_type: row.recommended_install_type || null,
        // What the site is entitled to, decided the same way every other reader
        // decides it. billed_plan and manual_plan are reported separately so the
        // dashboard can say *why*: "pro, because it is paid for" reads very
        // differently from "pro, because we granted it".
        plan: resolveSitePlan(row),
        billed_plan: normalizeAeoPlan(row.plan),
        manual_plan: row.manual_plan || null,
        contract: row.contract || null,
        billing: { status: row.contract === "active" ? "active" : row.contract === "unpaid" ? "unpaid" : row.contract === "cancelled" ? "stopped" : row.contract === "past_due" ? "past_due" : "pending", customer_id: row.stripe_customer_id || null, subscription_id: row.stripe_subscription_id || null },
        // The licence binding. The hash itself is never exposed - it identifies
        // a secret - but whether a site is bound, to which domain and since when
        // is what the operator needs to see.
        bound: !!row.bound_license_hash,
        bound_at: row.bound_at || null,
        domain_key: row.domain_key || null,
        checklist,
      };
    });
    return json({ sites });
  }

  const aeoMetricsMatch = path.match(/^\/api\/sites\/([^/]+)\/aeo-metrics$/i);
  if (aeoMetricsMatch && method === "GET") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const siteId = decodeURIComponent(aeoMetricsMatch[1]);
    const site = await loadOwnedSite(env, member, siteId);
    if (!site) {
      const exists = await env.DB.prepare("SELECT id FROM sites WHERE id=?").bind(siteId).first();
      return exists ? json({ error: "forbidden" }, 403) : json({ error: "not_found" }, 404);
    }
    const scoreLimit = Math.min(180, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "30", 10) || 30));
    const hitDays = Math.min(365, Math.max(1, Number.parseInt(url.searchParams.get("days") || "30", 10) || 30));
    const hitCutoff = new Date(Date.now() - (hitDays - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const [scoreResult, hitResult, activeRuleset] = await Promise.all([
      env.DB.prepare(`
        SELECT site_id,scanned_at,host,score,verdict,ruleset_version,checks_json
          FROM (
            SELECT site_id,scanned_at,host,score,verdict,ruleset_version,checks_json
              FROM aeo_scores WHERE site_id=?
             ORDER BY scanned_at DESC LIMIT ?
          ) ORDER BY scanned_at ASC
      `).bind(site.id, scoreLimit).all(),
      env.DB.prepare(`
        SELECT date,crawler_id,hits
          FROM crawler_hits
         WHERE site_id=? AND date>=?
         ORDER BY date ASC,crawler_id ASC
      `).bind(site.id, hitCutoff).all(),
      env.DB.prepare("SELECT version FROM aeo_rulesets WHERE active=1 ORDER BY version DESC LIMIT 1").first(),
    ]);
    const liveDelivery = site.install_type !== "static";
    // The checklist of the most recent diagnosis: what this site should actually
    // fix. History rows keep carrying only their score, because sending every
    // past checklist would be a lot of payload for a chart.
    //
    // Every stored row was written with Japanese wording baked in, from before
    // diagnoses localised. The ids and statuses are the durable part, so the
    // wording is re-applied per request and the stored text is overwritten
    // rather than trusted - the same reason /api/aeo/score localises on the way
    // out. An id this build has no wording for keeps what it was stored with.
    const scoreRows = scoreResult.results || [];
    const latestRow = scoreRows.length ? scoreRows[scoreRows.length - 1] : null;
    let latestChecks = [];
    if (latestRow?.checks_json) {
      try {
        const parsed = JSON.parse(latestRow.checks_json);
        if (Array.isArray(parsed)) latestChecks = localizeAeoChecks(parsed, requestedAeoLang(request, url));
      } catch {
        // A row written by an older or broken build is not worth failing the
        // whole panel over; the history and crawler hits still render.
        latestChecks = [];
      }
    }

    return json({
      site_id: site.id,
      install_type: site.install_type,
      checks: latestChecks,
      checked_at: latestRow?.scanned_at || null,
      scores: scoreRows.map(({ checks_json, ...row }) => row),
      crawler_hits: liveDelivery ? (hitResult.results || []) : [],
      crawler_measurement: liveDelivery,
      ruleset: {
        version: liveDelivery ? Number(activeRuleset?.version || INITIAL_AEO_RULESET.version) : null,
        latest_version: Number(activeRuleset?.version || INITIAL_AEO_RULESET.version),
        auto_updates: liveDelivery,
        status: liveDelivery ? "latest" : "static",
      },
      limits: { scores: scoreLimit, hit_days: hitDays },
    });
  }

  /* ---------------- U2: AI Share-of-Voice (pro plan) ---------------- */

  const sovMatch = path.match(/^\/api\/sites\/([^/]+)\/sov$/i);
  if (sovMatch && method === "GET") {
    const access = await requireProSite(request, env, decodeURIComponent(sovMatch[1]));
    if (!access.ok) return access.response;
    const site = access.site;
    const [history, budget] = await Promise.all([
      loadSovHistory(env, site.id, { limit: Number.parseInt(url.searchParams.get("limit") || "26", 10) || 26 }),
      sovRemainingBudget(env, site.id),
    ]);
    return json({
      site_id: site.id,
      plan: "pro",
      beta: SOV_BETA,
      model_version: SOV_MODEL_VERSION,
      // engineStatus() reports which engines are configured right now. The
      // latest run carries the engines that actually produced it, which is what
      // its numbers mean - a key added or removed since then does not
      // retroactively change what was measured.
      ...engineStatus(env),
      latest: history.latest,
      trend: history.trend,
      limits: {
        questions_per_run: SOV_LIMITS.maxQuestionsPerRun,
        engines_per_run: SOV_LIMITS.maxEnginesPerRun,
        monthly_queries: SOV_LIMITS.monthlyQueriesPerSite,
        schedule: "weekly",
      },
      usage: budget,
    });
  }

  if (sovMatch && method === "POST") {
    const access = await requireProSite(request, env, decodeURIComponent(sovMatch[1]));
    if (!access.ok) return access.response;
    const result = await runSiteSov(env, access.site, { trigger: "manual" });
    if (result.error) return json({ error: result.error, usage: result.usage }, result.status || 429);
    return json({
      site_id: access.site.id,
      beta: SOV_BETA,
      status: result.measurement.status,
      run: result.run,
      appearance_rate: result.measurement.appearance_rate,
      citation_rate: result.measurement.citation_rate,
      confidence: result.measurement.confidence,
      answers_received: result.measurement.answers_received,
      questions_asked: result.measurement.questions_asked,
      competitors: result.measurement.competitors,
      queries_used: result.measurement.queries_used,
      truncated: !!result.measurement.truncated,
      usage: result.usage,
      ...engineStatus(env),
    });
  }

  const reportMatch = path.match(/^\/api\/sites\/([^/]+)\/monthly-report$/i);
  if (reportMatch && method === "GET") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const siteId = decodeURIComponent(reportMatch[1]);
    const site = await loadOwnedSite(env, member, siteId);
    if (!site) {
      const exists = await env.DB.prepare("SELECT id FROM sites WHERE id=?").bind(siteId).first();
      return exists ? json({ error: "forbidden" }, 403) : json({ error: "not_found" }, 404);
    }
    const plan = resolveSitePlan(site);
    const month = (url.searchParams.get("month") || "").match(/^\d{4}-\d{2}$/)
      ? url.searchParams.get("month")
      : undefined;
    const scoreResult = await env.DB.prepare(
      "SELECT scanned_at,score,verdict FROM aeo_scores WHERE site_id=? ORDER BY scanned_at DESC LIMIT 180",
    ).bind(site.id).all();
    // Only a pro site has SoV data to include; the report says so for others.
    const sov = plan === "pro" ? await loadSovHistory(env, site.id, { limit: 8 }) : null;
    const report = buildMonthlyReport({ site, plan, month, scores: scoreResult.results || [], sov });

    const format = (url.searchParams.get("format") || "json").toLowerCase();
    if (format === "html") {
      return new Response(renderMonthlyReportHtml(report), {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
      });
    }
    if (format === "text") {
      return new Response(renderMonthlyReportText(report), {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
      });
    }
    return json({
      report,
      preview: { text: renderMonthlyReportText(report) },
      // Generation only. Delivery is enabled separately.
      delivery: { email_enabled: false, status: "generation_only" },
    });
  }

  /* ---------------- Store profile (SSOT) ---------------- */

  const profileMatch = path.match(/^\/api\/sites\/([^/]+)\/profile$/i);
  if (profileMatch && (method === "GET" || method === "PUT")) {
    const siteId = decodeURIComponent(profileMatch[1]);
    const auth = await requireProfileToken(request, env, siteId);
    if (!auth.ok) return auth.response;

    if (method === "GET") {
      const current = await loadSiteProfile(env, siteId);
      if (!current) return json({ error: "not_found" }, 404);
      return json(profileResponse(current.values, current.sources, current.updated_at));
    }

    const body = await safeJson(request);
    const result = await writeSiteProfile(env, siteId, pickProfileFields(body), "wordpress");
    if (result.error) return json({ error: result.error }, result.status || 400);
    return json(result);
  }

  // Issue or rotate the per-site profile token. Member-authenticated and
  // CSRF-protected; the plaintext is returned once and only the hash is stored.
  const profileTokenMatch = path.match(/^\/api\/sites\/([^/]+)\/profile-token$/i);
  if (profileTokenMatch && method === "POST") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const siteId = decodeURIComponent(profileTokenMatch[1]);
    const site = await loadOwnedSite(env, member, siteId);
    if (!site) {
      const exists = await env.DB.prepare("SELECT id FROM sites WHERE id=?").bind(siteId).first();
      return json({ error: exists ? "forbidden" : "not_found" }, exists ? 403 : 404);
    }
    const token = await issueProfileToken(env, siteId);
    return json({ ok: true, site_id: siteId, profile_token: token, note: "Store this now; it is not retrievable again." });
  }

  // Release a site's claim on its license, freeing the seat.
  //
  // Member-authenticated, not license-authenticated: the person who can see the
  // site in the dashboard is the one entitled to release it. Holding the license
  // key is not sufficient, or anyone who learned a key could detach a customer's
  // site from it.
  const unbindMatch = path.match(/^\/api\/sites\/([^/]+)\/unbind$/i);
  if (unbindMatch && method === "POST") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const siteId = decodeURIComponent(unbindMatch[1]);
    const site = await loadOwnedSite(env, member, siteId);
    if (!site) {
      const exists = await env.DB.prepare("SELECT id FROM sites WHERE id=?").bind(siteId).first();
      return json({ error: exists ? "forbidden" : "not_found" }, exists ? 403 : 404);
    }
    // domain_key is cleared along with the binding so the site stops occupying
    // (org_id, domain_key); the same domain can then be bound again, here or
    // under another license. The row itself is kept: it carries the diagnosis
    // history and the store profile, which the operator has not asked to lose.
    // The profile token is revoked because it was handed out on bind.
    await env.DB.prepare(
      "UPDATE sites SET bound_license_hash=NULL, bound_at=NULL, domain_key=NULL, profile_token_hash=NULL, plan='free' WHERE id=?",
    ).bind(siteId).run();
    return json({ ok: true, site_id: siteId, bound: false, plan: "free" });
  }

  const scanMatch = path.match(/^\/api\/sites\/([^/]+)\/scan$/i);
  if (scanMatch && method === "POST") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const site = await loadOwnedSite(env, member, scanMatch[1]);
    if (!site) {
      const exists = await env.DB.prepare("SELECT id FROM sites WHERE id=?").bind(scanMatch[1]).first();
      return exists ? json({ error: "forbidden" }, 403) : json({ error: "not_found" }, 404);
    }
    const installType = site.install_type || (site.url ? "tag" : "hosted");
    if (!["wp", "tag"].includes(installType)) return json({ error: "scan_not_supported_for_install_type" }, 400);
    const target = String(site.url || "").trim();
    if (!target) return json({ error: "url required" }, 400);
    const scannedAt = Date.now();
    let timer;
    try {
      const targetUrl = /^https?:\/\//i.test(target) ? target : `https://${target}`;
      const controller = new AbortController();
      timer = setTimeout(() => controller.abort(), 8000);
      const fetched = await fetchPublicHtml(targetUrl, { signal: controller.signal });
      let response = fetched.response;
      // Cloudflare's self-fetch can bypass the static-asset route after its extension redirect.
      if (response.status === 404 && new URL(targetUrl).host === url.host && env.ASSETS) {
        response = await env.ASSETS.fetch(new Request(targetUrl, { headers: { accept: "text/html,application/xhtml+xml" } }));
      }
      if (!response.ok) throw new Error(`http_${response.status}`);
      const html = fetched.html;
      const tagDetected = /<script\b[^>]*\bsrc\s*=\s*["'][^"']*tag\.js(?:[?#][^"']*)?["'][^>]*>/i.test(html);
      const schemaInHtml = extractLocalBusinessSchema(html);
      await env.DB.prepare("UPDATE sites SET tag_detected=?,schema_in_html=?,scanned_at=?,scan_error=NULL WHERE id=? AND org_id=?")
        .bind(tagDetected ? 1 : 0, schemaInHtml ? 1 : 0, scannedAt, site.id, member.org_id).run();
      return json({ ok: true, tag_detected: tagDetected, schema_in_html: schemaInHtml, scanned_at: scannedAt });
    } catch (error) {
      const message = error?.name === "AbortError" ? "timeout" : String(error?.message || "fetch_failed").slice(0, 200);
      await env.DB.prepare("UPDATE sites SET tag_detected=NULL,schema_in_html=NULL,scanned_at=?,scan_error=?,status='error' WHERE id=? AND org_id=?")
        .bind(scannedAt, message, site.id, member.org_id).run();
      return json({ error: "site_unreachable", scan_error: message, scanned_at: scannedAt }, 502);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  const deliveryMatch = path.match(/^\/api\/sites\/([a-z0-9]+)\/(deactivate|reactivate)$/i);
  if (deliveryMatch && method === "POST") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const site = await loadOwnedSite(env, member, deliveryMatch[1]);
    if (!site) {
      const exists = await env.DB.prepare("SELECT id FROM sites WHERE id=?").bind(deliveryMatch[1]).first();
      return exists ? json({ error: "forbidden" }, 403) : json({ error: "not_found" }, 404);
    }
    const deliveryStatus = deliveryMatch[2] === "deactivate" ? "stopped" : "active";
    await env.DB.prepare("UPDATE sites SET delivery_status=? WHERE id=?").bind(deliveryStatus, site.id).run();
    return json({ ok: true, id: site.id, delivery_status: deliveryStatus });
  }

  const match = path.match(/^\/api\/sites\/([a-z0-9]+)$/i);
  const placesMatch = path.match(/^\/api\/sites\/([a-z0-9]+)\/(import|refresh)$/i);
  if (placesMatch && (method === "POST")) {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const site = await loadOwnedSite(env, member, placesMatch[1]);
    if (!site) {
      const exists = await env.DB.prepare("SELECT id FROM sites WHERE id=?").bind(placesMatch[1]).first();
      return exists ? json({ error: "forbidden" }, 403) : json({ error: "not_found" }, 404);
    }
    if (placesMatch[2] === "import" && site.fetched_at) {
      return json({ error: "already_imported", fetched_at: site.fetched_at }, 409);
    }
    const body = method === "POST" ? await safeJson(request) : {};
    const result = await importPlaceForSite(env, site, body, placesMatch[2] === "refresh");
    return json(result.body, result.status);
  }
  /*
   * The store profile, for the member who owns the site.
   *
   * The dashboard edit form used to populate itself from /api/tag/config, which
   * is the public tag-delivery payload and carries six keys. Four of the form's
   * own inputs - lat, lng, image, reserve_url - are not among them, so they
   * rendered blank no matter what was stored, and saving the blank form sent
   * lat/lng as an explicit null and deleted the geo Places had imported.
   *
   * This returns the whole canonical record, so the form can round-trip every
   * field it offers to edit. It is member-authenticated and ownership-checked;
   * /api/sites/:id/profile stays bearer-authenticated for the WordPress sync.
   */
  if (match && method === "GET") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const site = await loadOwnedSite(env, member, match[1]);
    if (!site) {
      const exists = await env.DB.prepare("SELECT id FROM sites WHERE id=?").bind(match[1]).first();
      return exists ? json({ error: "forbidden" }, 403) : json({ error: "not_found" }, 404);
    }
    const current = await loadSiteProfile(env, site.id);
    if (!current) return json({ error: "not_found" }, 404);
    const settings = await env.DB.prepare("SELECT serve_schema,allow_crawlers FROM site_settings WHERE site_id=?").bind(site.id).first();
    return json({
      id: site.id,
      // field_sources travels too: the form needs to know that a value came
      // from Places rather than from a person, because re-saving it as human
      // would switch off the refresh that maintains it.
      ...profileResponse(current.values, current.sources, current.updated_at),
      completeness: profileCompleteness(current.values),
      // Output toggles are not profile fields - they switch delivery here and
      // page output in WordPress - but the same form owns them.
      serve_schema: settings?.serve_schema == null ? 1 : Number(settings.serve_schema),
      allow_crawlers: settings?.allow_crawlers == null ? 0 : Number(settings.allow_crawlers),
    });
  }

  if (match && method === "PUT") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const id = match[1];
    const ownedSite = await loadOwnedSite(env, member, id);
    if (!ownedSite) {
      const exists = await env.DB.prepare("SELECT id FROM sites WHERE id=?").bind(id).first();
      return exists ? json({ error: "forbidden" }, 403) : json({ error: "not_found" }, 404);
    }
    const body = await safeJson(request);
    if (Object.keys(body || {}).length === 1 && Object.prototype.hasOwnProperty.call(body, "gbp_linked")) {
      await env.DB.prepare("UPDATE sites SET gbp_linked=? WHERE id=? AND org_id=?")
        .bind(body.gbp_linked ? 1 : 0, id, member.org_id).run();
      return json({ ok: true, gbp_linked: !!body.gbp_linked });
    }
    // Store fields go through the shared merger so this screen cannot diverge
    // from wp-admin. Only the keys the request actually carries are passed on:
    // naming every field here meant an absent one arrived as undefined, and a
    // form that could not read lat/lng sent them as null - an explicit delete.
    const profileResult = await writeSiteProfile(env, id, pickDashboardProfileFields(body), "dashboard");
    if (profileResult.error) return json({ error: profileResult.error }, profileResult.status || 400);

    // Output toggles are deliberately NOT part of the profile: they control tag
    // delivery here and page output in WordPress, which are different switches.
    await env.DB.prepare(
      `INSERT INTO site_settings (site_id,serve_schema,allow_crawlers) VALUES (?,?,?)
       ON CONFLICT(site_id) DO UPDATE SET serve_schema=excluded.serve_schema,allow_crawlers=excluded.allow_crawlers`,
    ).bind(id, body.serve_schema ? 1 : 0, body.allow_crawlers ? 1 : 0).run();
    // Counted from the merged record, not from the request: a partial save must
    // not report fewer schema types just because the form left a key out.
    const schemaTypes = body.serve_schema ? countSchemaTypes(profileResult.profile || {}) : 0;
    if (Object.prototype.hasOwnProperty.call(body, "gbp_linked")) {
      await env.DB.prepare("UPDATE sites SET gbp_linked=? WHERE id=? AND org_id=?").bind(body.gbp_linked ? 1 : 0, id, member.org_id).run();
    }
    await env.DB.prepare("UPDATE sites SET schema_types=?,crawler_allowed=? WHERE id=? AND org_id=?")
      .bind(schemaTypes, body.allow_crawlers ? 1 : 0, id, member.org_id).run();
    return json({ ok: true, schema_types: schemaTypes, changed: profileResult.changed, rejected: profileResult.rejected });
  }
  if (match && method === "DELETE") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const site = await loadOwnedSite(env, member, match[1]);
    if (!site) {
      const exists = await env.DB.prepare("SELECT id FROM sites WHERE id=?").bind(match[1]).first();
      return exists ? json({ error: "forbidden" }, 403) : json({ error: "not_found" }, 404);
    }
    await env.DB.batch([
      env.DB.prepare("DELETE FROM site_settings WHERE site_id=?").bind(site.id),
      env.DB.prepare("DELETE FROM sites WHERE id=?").bind(site.id),
    ]);
    return json({ ok: true, id: site.id });
  }

  if (path === "/api/crawlers" && method === "GET") return json({ crawlers: AI_CRAWLERS });

  if (path === "/api/billing/summary" && method === "GET") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    return json(await billingSummary(env, member.org_id, member));
  }

  if (path === "/api/billing/checkout" && method === "POST") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const body = await safeJson(request);
    const siteRef = String(body.site_id || body.siteKey || body.site_key || "").trim();
    if (!siteRef) return json({ error: "site_id_or_site_key_required" }, 400);
    const site = await loadOwnedSiteByRef(env, member, siteRef);
    if (!site) return json({ error: "not_found" }, 404);
    if (!["direct", "referral"].includes(site.channel || "direct")) return json({ error: "channel_not_checkoutable" }, 400);
    const secret = stripeTestSecret(env);
    if (!secret) return json({ error: "stripe_test_key_required" }, 503);
    const memberRow = await env.DB.prepare("SELECT email FROM members WHERE id=?").bind(member.member_id).first();
    const form = new URLSearchParams({ mode: "subscription", "line_items[0][price]": String(env.STRIPE_PRICE_ID_PRO || ""), "line_items[0][quantity]": "1", success_url: "https://nurevo.jp/dashboard?checkout=success", cancel_url: "https://nurevo.jp/dashboard?checkout=cancelled", customer_email: memberRow?.email || "", "metadata[siteId]": site.id, "metadata[orgId]": member.org_id, "subscription_data[metadata][siteId]": site.id, "subscription_data[metadata][orgId]": member.org_id });
    if (!env.STRIPE_PRICE_ID_PRO) return json({ error: "STRIPE_PRICE_ID_PRO is required" }, 503);
    const response = await stripeRequest(secret, "/v1/checkout/sessions", form);
    if (!response.ok || !response.data?.url) return json({ error: response.data?.error?.message || "stripe_checkout_failed" }, 502);
    return json({ ok: true, url: response.data.url, amount_yen: BILLING_DEFAULTS.direct_monthly_yen });
  }

  if (path === "/api/billing/payment-link" && method === "POST") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const body = await safeJson(request);
    const siteRef = String(body.site_id || body.siteKey || body.site_key || "").trim();
    if (!siteRef) return json({ error: "site_id_or_site_key_required" }, 400);
    const site = await loadOwnedSiteByRef(env, member, siteRef);
    if (!site) return json({ error: "not_found" }, 404);
    if (!['direct', 'referral'].includes(site.channel || 'direct')) return json({ error: "channel_not_checkoutable" }, 400);
    const secret = stripeTestSecret(env);
    if (!secret) return json({ error: "stripe_test_key_required" }, 503);
    if (!env.STRIPE_PRICE_ID_PRO) return json({ error: "STRIPE_PRICE_ID_PRO is required" }, 503);
    const form = new URLSearchParams({
      "line_items[0][price]": String(env.STRIPE_PRICE_ID_PRO),
      "line_items[0][quantity]": "1",
      "metadata[siteId]": site.id,
      "metadata[orgId]": member.org_id,
      "subscription_data[metadata][siteId]": site.id,
      "subscription_data[metadata][orgId]": member.org_id,
      "after_completion[type]": "redirect",
      "after_completion[redirect][url]": "https://nurevo.jp/dashboard?billing=success",
    });
    const response = await stripeRequest(secret, "/v1/payment_links", form);
    if (!response.ok || !response.data?.url) return json({ error: response.data?.error?.message || "stripe_payment_link_failed" }, 502);
    return json({ ok: true, url: response.data.url, amount_yen: BILLING_DEFAULTS.direct_monthly_yen, site_id: site.id });
  }

  if (path === "/api/billing/connect/onboard" && method === "POST") {
    const member = await requireOrgRole(request, env, ["admin", "referrer"]);
    if (!member) return json({ error: "forbidden" }, 403);
    const secret = stripeTestSecret(env);
    if (!secret) return json({ error: "stripe_test_key_required" }, 503);
    const body = await safeJson(request);
    const referrer = await env.DB.prepare("SELECT * FROM referrers WHERE id=?").bind(body.referrer_id).first();
    if (!referrer) return json({ error: "referrer_not_found" }, 404);
    let accountId = referrer.stripe_account_id;
    if (!accountId) {
      const account = await stripeRequest(secret, "/v1/accounts", new URLSearchParams({ type: "express", "metadata[referrerId]": referrer.id }));
      if (!account.ok) return json({ error: account.data?.error?.message || "stripe_account_failed" }, 502);
      accountId = account.data.id;
      await env.DB.prepare("UPDATE referrers SET stripe_account_id=? WHERE id=?").bind(accountId, referrer.id).run();
    }
    const link = await stripeRequest(secret, "/v1/account_links", new URLSearchParams({ account: accountId, refresh_url: "https://nurevo.jp/dashboard?connect=refresh", return_url: "https://nurevo.jp/dashboard?connect=complete", type: "account_onboarding" }));
    if (!link.ok) return json({ error: link.data?.error?.message || "stripe_account_link_failed" }, 502);
    return json({ ok: true, account_id: accountId, url: link.data.url });
  }

  if (path === "/api/billing/webhook" && method === "POST") {
    const secret = String(env.STRIPE_WEBHOOK_SECRET || "").trim();
    if (!secret) return json({ error: "stripe_webhook_secret_required" }, 503);
    const rawBody = await request.text();
    if (!await verifyStripeSignature(rawBody, request.headers.get("stripe-signature") || "", secret)) return json({ error: "invalid_webhook_signature" }, 400);
    let event;
    try { event = JSON.parse(rawBody); } catch { return json({ error: "invalid_json" }, 400); }
    if (!event?.id) return json({ error: "event_id_required" }, 400);
    const claim = await env.DB.prepare("INSERT OR IGNORE INTO billing_events (event_id,kind,created_at) VALUES (?,?,?)").bind(event.id, event.type || "unknown", Date.now()).run();
    if (Number(claim.meta?.changes || 0) !== 1) return json({ received: true, duplicate: true });
    const object = event.data?.object || {};
    const siteId = object.metadata?.siteId || object.subscription_details?.metadata?.siteId || object.lines?.data?.[0]?.metadata?.siteId;
    // Checkout only records the identifiers. The tier comes from the
    // subscription object, which arrives in its own event and is the thing that
    // actually says what was bought and whether it is still paid for.
    if (event.type === "checkout.session.completed" && siteId) {
      await env.DB.prepare("UPDATE sites SET stripe_customer_id=?,stripe_subscription_id=? WHERE id=?")
        .bind(object.customer || null, object.subscription || null, siteId).run();
    }

    // The subscription is the source of truth for the plan.
    if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      // deleted does not always carry a status we can act on, so treat it as the
      // cancellation it is.
      const subscription = event.type === "customer.subscription.deleted"
        ? { ...object, status: "canceled" }
        : object;
      const derived = planFromSubscription(subscription, pricesFromEnv(env));
      // A site referenced by metadata, or failing that by the subscription we
      // already stored - a subscription changed from the Stripe dashboard does
      // not necessarily carry our metadata.
      const target = siteId
        || (object.id ? (await env.DB.prepare("SELECT id FROM sites WHERE stripe_subscription_id=? LIMIT 1").bind(object.id).first())?.id : null);
      if (derived && target) {
        await env.DB.prepare(
          "UPDATE sites SET plan=?, contract=?, delivery_status=?, stripe_customer_id=COALESCE(?,stripe_customer_id), stripe_subscription_id=COALESCE(?,stripe_subscription_id) WHERE id=?",
        ).bind(derived.plan, derived.contract, derived.delivery_status, object.customer || null, object.id || null, target).run();
      }
    }

    if (event.type === "invoice.paid" && siteId) {
      await env.DB.prepare("UPDATE sites SET contract='active' WHERE id=?").bind(siteId).run();
      const site = await env.DB.prepare("SELECT * FROM sites WHERE id=?").bind(siteId).first();
      const referrer = site?.channel === "referral" ? await env.DB.prepare("SELECT * FROM referrers WHERE id=?").bind(site.referred_by).first() : null;
      if (referrer?.stripe_account_id && stripeTestSecret(env)) {
        // Executed only by a verified Stripe webhook; no client-supplied destination is trusted.
        await stripeRequest(stripeTestSecret(env), "/v1/transfers", new URLSearchParams({ amount: String(BILLING_DEFAULTS.referral_monthly_yen), currency: "jpy", destination: referrer.stripe_account_id, "metadata[siteId]": siteId, "metadata[eventId]": event.id }));
      }
    }
    // A failed payment no longer stops the site. Stripe retries for days before
    // giving up, and that retry window is the grace period; cutting service on
    // the first failure gave the customer no grace at all. The subscription
    // moving to unpaid is what stops it, handled above.
    if (event.type === "invoice.payment_failed" && siteId) {
      await env.DB.prepare("UPDATE sites SET contract='past_due' WHERE id=?").bind(siteId).run();
    }
    return json({ received: true });
  }
  return null;
}

/**
 * Shape the diagnosis for the wire, in the requested language.
 *
 * Wording is applied here rather than inside the diagnosis so that one cached
 * result serves every language. `lang` is undefined for callers that never ask,
 * which keeps their responses byte-identical to before.
 */
function aeoResponse(result, lang) {
  const checks = lang === undefined ? result.checks : localizeAeoChecks(result.checks, lang);
  return { score: result.score, band: result.band, gatePassed: result.gatePassed, checks };
}

/**
 * Which language to word the checks in.
 *
 * Returns undefined when the caller expressed no preference at all, so that
 * existing integrations keep the Japanese wording they were built against
 * instead of silently switching to the English fallback.
 */
function requestedAeoLang(request, url) {
  const query = url.searchParams.get("lang");
  if (query) return resolveAeoCheckLang(query);
  const header = String(request.headers.get("accept-language") || "").trim();
  if (header === "") return undefined;
  const first = header.split(",")[0].trim().split(";")[0];
  return first ? resolveAeoCheckLang(first) : undefined;
}

/* ---------------- Store profile: the single write path ---------------- */

/** Read the canonical profile for a site, with its provenance map. */
async function loadSiteProfile(env, siteId) {
  const [settingsRow, siteRow] = await Promise.all([
    env.DB.prepare("SELECT * FROM site_settings WHERE site_id=?").bind(siteId).first(),
    env.DB.prepare("SELECT id,website_uri FROM sites WHERE id=? LIMIT 1").bind(siteId).first(),
  ]);
  if (!siteRow) return null;
  return {
    values: rowToProfile(settingsRow || {}, siteRow),
    sources: parseFieldSources(settingsRow?.field_sources),
    updated_at: settingsRow?.updated_at ?? null,
    exists: !!settingsRow,
  };
}

/**
 * Apply a profile write. Every writer - wp-admin, the dashboard and the Places
 * import - goes through here, so the merge rules are enforced in exactly one
 * place and cannot be bypassed by adding another route.
 *
 * `now` is taken from the worker's own clock. A caller may not supply a
 * timestamp, which is what stops a client from forging merge order.
 */
async function writeSiteProfile(env, siteId, incoming, source) {
  const current = await loadSiteProfile(env, siteId);
  if (!current) return { error: "not_found", status: 404 };

  const now = Date.now();
  let merged;
  try {
    merged = mergeProfile({ current: current.values, sources: current.sources, incoming, source, now });
  } catch (error) {
    return { error: "invalid_profile_source", status: 400, detail: String(error?.message || error) };
  }

  if (!merged.changed.length && current.exists) {
    // Nothing moved: skip the write but still report what was refused so a
    // caller can tell "no-op" from "blocked by a human value".
    return { ok: true, changed: [], rejected: merged.rejected, ...profileResponse(merged.values, merged.sources, current.updated_at) };
  }

  const { settings, site } = profileToColumns(merged.values);
  const columns = Object.keys(settings);
  const assignments = columns.map((column) => `${column}=excluded.${column}`).join(",");
  const placeholders = columns.map(() => "?").join(",");
  await env.DB.prepare(
    `INSERT INTO site_settings (site_id,${columns.join(",")},updated_at,field_sources)
     VALUES (?,${placeholders},?,?)
     ON CONFLICT(site_id) DO UPDATE SET ${assignments},updated_at=excluded.updated_at,field_sources=excluded.field_sources`,
  ).bind(siteId, ...columns.map((column) => settings[column]), merged.updated_at, serializeFieldSources(merged.sources)).run();

  // url lives on the sites row; only write it when the merge actually moved it.
  if (merged.changed.includes("url")) {
    await env.DB.prepare("UPDATE sites SET website_uri=? WHERE id=?").bind(site.website_uri ?? null, siteId).run();
  }

  return { ok: true, changed: merged.changed, rejected: merged.rejected, ...profileResponse(merged.values, merged.sources, merged.updated_at) };
}

/**
 * Mint a profile write token for a site and store only its hash.
 *
 * The plaintext is returned to the caller once and is not recoverable
 * afterwards, so a leak of the database does not yield working tokens.
 */
/**
 * Claim (org, domain) for a license, creating the site row if it is new.
 *
 * Idempotent on purpose. The plugin calls this every time the license field is
 * saved, and a reinstall or a settings re-save must land on the same site rather
 * than minting a second one. The uniqueness of (org_id, domain_key) is what
 * makes that safe: the lookup below and the database agree on what "same site"
 * means, because both use the normalised key.
 *
 * A fresh profile token is issued on every bind. The caller has just proved it
 * holds the license, and the plugin stores whatever it gets back, so rotating
 * costs nothing and limits how long a leaked token stays useful.
 */
async function bindLicenseToDomain(env, { license, plan, domainKey, siteUrl, installType }) {
  const now = Date.now();
  const existing = await env.DB.prepare(
    "SELECT id, site_key, bound_license_hash FROM sites WHERE org_id=? AND domain_key=? LIMIT 1",
  ).bind(license.org_id, domainKey).first();

  if (existing) {
    // Re-binding a site that this key already holds is a no-op plus a fresh
    // token. Taking over a site bound to a different key of the same org is
    // allowed: both keys belong to the org, and refusing would strand a site
    // when a customer upgrades from standard to pro.
    // Binding links the install to the site. It does not grant a tier - billing
    // does that - so plan is not written here. A key marked manual is the one
    // exception: those are issued outside Stripe (wholesale, partner, canary)
    // and the grant is recorded on the site so resolveSitePlan can honour it.
    await env.DB.prepare(
      "UPDATE sites SET bound_license_hash=?, bound_at=?, install_type=?, website_uri=COALESCE(NULLIF(?,''), website_uri) WHERE id=?",
    ).bind(license.license_hash, now, installType, siteUrl, existing.id).run();
    if (Number(license.manual || 0) === 1) {
      await env.DB.prepare(
        "UPDATE sites SET manual_plan=?, manual_plan_note=COALESCE(manual_plan_note,'granted by a manually issued license') WHERE id=?",
      ).bind(plan, existing.id).run();
    }
    const token = await issueProfileToken(env, existing.id);
    const site = await env.DB.prepare("SELECT plan, manual_plan FROM sites WHERE id=? LIMIT 1").bind(existing.id).first();
    return {
      ok: true,
      body: {
        ok: true, plan: resolveSitePlan(site || {}), site_id: existing.id, site_key: existing.site_key,
        profile_token: token, bound: true, domain: domainKey,
        reused: existing.bound_license_hash === license.license_hash,
      },
    };
  }

  // A new domain costs a seat. Count distinct sites already bound to this key.
  const seats = Math.max(1, Number(license.seats || 1));
  const used = await env.DB.prepare(
    "SELECT count(*) AS n FROM sites WHERE bound_license_hash=?",
  ).bind(license.license_hash).first();
  if (Number(used?.n || 0) >= seats) {
    return { ok: false, status: 409, error: "seat_limit_reached" };
  }

  const siteId = uid();
  const siteKey = newKey();
  // plan starts at free: a new site has no subscription yet, and billing is
  // what grants a tier. manual_plan carries the grant for keys issued outside
  // Stripe, so a wholesale or canary install still works on day one.
  // Declared outside the try because the success path below reports it.
  const manualPlan = Number(license.manual || 0) === 1 ? plan : null;
  try {
    await env.DB.prepare(`
      INSERT INTO sites (id, org_id, url, site_key, install_type, plan, manual_plan, manual_plan_note, domain_key, bound_license_hash, bound_at, website_uri, created_at)
      VALUES (?, ?, ?, ?, ?, 'free', ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      siteId, license.org_id, domainKey, siteKey, installType,
      manualPlan, manualPlan ? 'granted by a manually issued license' : null,
      domainKey, license.license_hash, now, siteUrl || null, now,
    ).run();
  } catch (error) {
    // Two installs redeeming the same key against the same domain at once: the
    // unique index rejects the loser, which then finds the winner's row.
    const raced = await env.DB.prepare(
      "SELECT id, site_key FROM sites WHERE org_id=? AND domain_key=? LIMIT 1",
    ).bind(license.org_id, domainKey).first();
    if (!raced) {
      console.error("license_bind_insert_failed", JSON.stringify({ error: String(error?.message || "d1_error").slice(0, 160) }));
      return { ok: false, status: 500, error: "bind_failed" };
    }
    const token = await issueProfileToken(env, raced.id);
    const racedSite = await env.DB.prepare("SELECT plan, manual_plan FROM sites WHERE id=? LIMIT 1").bind(raced.id).first();
    return { ok: true, body: { ok: true, plan: resolveSitePlan(racedSite || {}), site_id: raced.id, site_key: raced.site_key, profile_token: token, bound: true, domain: domainKey, reused: true } };
  }

  const token = await issueProfileToken(env, siteId);
  return {
    ok: true,
    body: { ok: true, plan: resolveSitePlan({ plan: "free", manual_plan: manualPlan }), site_id: siteId, site_key: siteKey, profile_token: token, bound: true, domain: domainKey, reused: false },
  };
}

async function issueProfileToken(env, siteId) {
  const token = `nrvp_${randomHex(32)}`;
  await env.DB.prepare("UPDATE sites SET profile_token_hash=? WHERE id=?").bind(await sha256Hex(token), siteId).run();
  return token;
}

/** Keep only the canonical fields from an untrusted request body. */
function pickProfileFields(body) {
  const incoming = {};
  for (const field of PROFILE_FIELD_NAMES) {
    if (Object.prototype.hasOwnProperty.call(body || {}, field)) incoming[field] = body[field];
  }
  return incoming;
}

/*
 * What the dashboard edit form is allowed to write.
 *
 * Deliberately not the whole field set:
 *   business_type_label  a display string Places maintains; the human-editable
 *                        type is business_type_schema, which is also the one
 *                        WordPress edits and the one that reaches @type.
 *   hours_periods        machine-readable hours, Places-owned (the merger
 *                        rejects human writes to it anyway).
 *   price_level, price   no editor on either side; Places owns price_level.
 *
 * `tel` is accepted as an alias for phone because that is what the form field
 * has always been called.
 */
const DASHBOARD_PROFILE_FIELDS = Object.freeze([
  "name", "description", "address", "phone", "hours",
  "business_type_schema", "email", "url", "lat", "lng", "image", "reserve_url",
]);

/**
 * Build the merge input from a dashboard PUT.
 *
 * Presence, not value, decides what is touched: a key the body does not carry
 * is left out, and mergeProfile then skips the field entirely. This is what
 * makes a partial save safe - the form sends only what it actually holds, and
 * an absent key can no longer be mistaken for an instruction.
 */
function pickDashboardProfileFields(body) {
  const source = body || {};
  const incoming = {};
  for (const field of DASHBOARD_PROFILE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(source, field)) incoming[field] = source[field];
  }
  if (!Object.prototype.hasOwnProperty.call(incoming, "phone")
      && Object.prototype.hasOwnProperty.call(source, "tel")) {
    incoming.phone = source.tel;
  }
  return incoming;
}

/**
 * Authorise a profile read/write with the per-site profile token.
 *
 * site_key deliberately does not work here: the plugin prints it into public
 * page markup, so it identifies a site but proves nothing. The token is sent as
 * a bearer header rather than a query parameter so it does not land in logs.
 */
async function requireProfileToken(request, env, siteId) {
  const header = String(request.headers.get("authorization") || "");
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) return { ok: false, response: json({ error: "missing_profile_token" }, 401) };

  const site = await env.DB.prepare("SELECT id,profile_token_hash,delivery_status FROM sites WHERE id=? LIMIT 1")
    .bind(siteId).first();
  if (!site || !site.profile_token_hash) return { ok: false, response: json({ error: "profile_token_not_issued" }, 404) };

  const presented = await sha256Hex(token);
  // Constant-time-ish compare on equal-length hex digests.
  if (presented.length !== site.profile_token_hash.length) {
    return { ok: false, response: json({ error: "invalid_profile_token" }, 403) };
  }
  let diff = 0;
  for (let index = 0; index < presented.length; index += 1) {
    diff |= presented.charCodeAt(index) ^ site.profile_token_hash.charCodeAt(index);
  }
  if (diff !== 0) return { ok: false, response: json({ error: "invalid_profile_token" }, 403) };

  const limit = await checkApiRateLimit(env, "site-profile", siteId, API_RATE_LIMITS.siteProfile);
  if (!limit.allowed) {
    return { ok: false, response: json({ error: limit.unavailable ? "rate_limit_unavailable" : "rate_limited" }, limit.unavailable ? 503 : 429) };
  }
  return { ok: true, site };
}

/* ---------------- U2: SoV access control and runner ---------------- */

const SOV_UPGRADE = Object.freeze({
  required_plan: "pro",
  plan_label: "Pro",
  price_yen_monthly: 14800,
  price_label: "¥14,800/月〜",
  upgrade_url: "https://nurevo.jp/dashboard",
  beta: SOV_BETA,
  message: "AI登場率の測定はProプラン（¥14,800/月〜・β）の機能です。",
});

/**
 * Resolve the target site and require the pro plan.
 *
 * Two callers exist and both are supported: the dashboard authenticates with a
 * member session, while the WordPress plugin authenticates with its site key
 * (the same pattern /api/sites/:id/aeo-score already uses). A site key only
 * ever resolves to its own site.
 *
 * A non-pro site gets 402 with the upgrade information - the pricing and link
 * only, never a locked payload - so wp-admin and the dashboard can render the
 * upgrade path without guessing at it.
 */
async function requireProSite(request, env, siteId) {
  const url = new URL(request.url);
  const siteKey = url.searchParams.get("site_key") || url.searchParams.get("siteKey") || url.searchParams.get("k");

  let site = null;
  let member = null;
  if (siteKey) {
    const auth = await authorizeSiteKey(env, siteKey, { touch: false });
    if (!auth.registered || String(auth.siteId) !== siteId) {
      return { ok: false, response: json({ error: "invalid_site_key" }, 404) };
    }
    site = await env.DB.prepare("SELECT * FROM sites WHERE id=? LIMIT 1").bind(siteId).first();
  } else {
    member = await requireMember(request, env);
    if (!member) return { ok: false, response: json({ error: "unauthorized" }, 401) };
    site = await loadOwnedSite(env, member, siteId);
    if (!site) {
      const exists = await env.DB.prepare("SELECT id FROM sites WHERE id=?").bind(siteId).first();
      return { ok: false, response: exists ? json({ error: "forbidden" }, 403) : json({ error: "not_found" }, 404) };
    }
  }
  if (!site) return { ok: false, response: json({ error: "not_found" }, 404) };

  const plan = resolveSitePlan(site);
  if (plan !== "pro") {
    return {
      ok: false,
      response: json({ error: "upgrade_required", plan, upgrade: SOV_UPGRADE }, 402),
    };
  }
  return { ok: true, member, site, plan };
}

/**
 * Measure one site, enforcing the monthly engine-call cap.
 *
 * The remaining monthly budget caps the run, so a site can never exceed
 * SOV_LIMITS.monthlyQueriesPerSite regardless of how it is triggered. Usage is
 * recorded from the calls actually issued, not from the planned question count.
 */
async function runSiteSov(env, site, { trigger = "scheduled" } = {}) {
  const budget = await sovRemainingBudget(env, site.id);
  const perRunMax = SOV_LIMITS.maxQuestionsPerRun * SOV_LIMITS.maxEnginesPerRun;
  const allowance = Math.min(perRunMax, budget.remaining);
  if (allowance <= 0) {
    return { error: "monthly_quota_exhausted", status: 429, usage: budget };
  }

  // Measure the business as its owner describes it: the canonical record is the
  // same one wp-admin and the dashboard write, so the brand and locality used
  // here cannot drift from what the operator entered.
  const canonical = await loadSiteProfile(env, site.id);
  const settings = {
    name: canonical?.values?.name || "",
    business_type: canonical?.values?.business_type_label || canonical?.values?.business_type_schema || "",
    address: canonical?.values?.address || "",
  };
  const target = sovTargetUrl(site);

  let schemas = [];
  if (target) {
    // Published schema only fills gaps the record does not cover; it never
    // overrides what the owner stated.
    try { schemas = await fetchSchemaNodes(target); } catch { schemas = []; }
  }

  let profile;
  try {
    profile = buildBrandProfile({ site, settings, schemas });
  } catch (error) {
    if (error instanceof SovError) return { error: error.code, status: error.status, usage: budget };
    throw error;
  }

  const measurement = await measureSov(env, profile, { budget: allowance });
  if (measurement.queries_used > 0) {
    await sovRecordUsage(env, site.id, measurement.queries_used);
  }
  const run = await storeSovRun(env, site.id, measurement, { trigger });
  const usage = await sovRemainingBudget(env, site.id);
  return { measurement, run, usage, profile };
}

function sovTargetUrl(site) {
  const raw = String(site.website_uri || site.url || "").trim()
    || (site.slug ? `https://nurevo.jp/s/${encodeURIComponent(site.slug)}` : "");
  if (!raw) return "";
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

/**
 * Weekly pro batch. Cost control is structural: only pro sites are selected,
 * each run is capped, and each site's monthly counter gates it independently.
 */
export async function runSovWeeklyBatch(env, { limit = 50 } = {}) {
  if (!env?.DB) throw new Error("DB binding is required for the SoV batch");
  const engines = availableEngines(env);
  if (!engines.length) {
    return { ok: true, status: "unconfigured", sites: 0, measured: 0, skipped: 0, engines: [] };
  }
  const bounded = Math.min(200, Math.max(1, Number(env.SOV_BATCH_LIMIT || limit)));
  const result = await env.DB.prepare(`
    SELECT * FROM sites
     WHERE plan='pro' AND (delivery_status IS NULL OR delivery_status='active')
     ORDER BY created_at LIMIT ?
  `).bind(bounded).all();

  let measured = 0;
  let skipped = 0;
  const errors = [];
  for (const site of result.results || []) {
    try {
      const outcome = await runSiteSov(env, site, { trigger: "scheduled" });
      if (outcome.error) { skipped += 1; errors.push({ site_id: site.id, error: outcome.error }); continue; }
      measured += 1;
    } catch (error) {
      skipped += 1;
      errors.push({ site_id: site.id, error: String(error?.message || error).slice(0, 120) });
    }
  }
  return {
    ok: true,
    status: "measured",
    model_version: SOV_MODEL_VERSION,
    engines: engines.map((engine) => engine.id),
    sites: (result.results || []).length,
    measured,
    skipped,
    errors: errors.slice(0, 20),
  };
}

function normalizeAeoPlan(value) {
  return ["standard", "pro"].includes(String(value || "").toLowerCase()) ? String(value).toLowerCase() : "free";
}

async function readLicensePayload(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 4096) return { ok: false, status: 413, error: "request_too_large" };
  let raw = "";
  try { raw = await request.text(); } catch { return { ok: false, status: 400, error: "invalid_json" }; }
  if (new TextEncoder().encode(raw).byteLength > 4096) return { ok: false, status: 413, error: "request_too_large" };
  let value;
  try { value = JSON.parse(raw); } catch { return { ok: false, status: 400, error: "invalid_json" }; }
  const license = String(value?.license || "").trim();
  if (!license || license.length > 256) return { ok: false, status: 400, error: "invalid_license" };
  return { ok: true, value };
}

function normalizeAeoCacheUrl(raw) {
  let target;
  try { target = new URL(String(raw || "")); } catch { throw new AeoScoreError(400, "invalid_url"); }
  target.hash = "";
  return target.href;
}

async function aeoSha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function aeoPublicRateLimit(request, env) {
  if (!env.WEBMCP_KV) return { allowed: false, retryAfter: AEO_RATE_LIMIT.windowSeconds };
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const bucket = Math.floor(Date.now() / (AEO_RATE_LIMIT.windowSeconds * 1000));
  const key = `aeo-score:rate:${await aeoSha256Hex(ip)}:${bucket}`;
  const current = Number(await env.WEBMCP_KV.get(key) || 0);
  if (current >= AEO_RATE_LIMIT.limit) {
    const retryAfter = AEO_RATE_LIMIT.windowSeconds - Math.floor((Date.now() / 1000) % AEO_RATE_LIMIT.windowSeconds);
    return { allowed: false, retryAfter };
  }
  await env.WEBMCP_KV.put(key, String(current + 1), { expirationTtl: AEO_RATE_LIMIT.windowSeconds + 60 });
  return { allowed: true, retryAfter: 0 };
}

function stripeTestSecret(env) {
  // TODO(U4-production): 本番キー投入待ち（要確認・橋本確認後）。
  // Keep sk_live, production Price IDs, and the production webhook secret out until approval.
  const value = String(env.STRIPE_SECRET_KEY || "").trim();
  return value.startsWith("sk_test_") ? value : "";
}

async function stripeRequest(secret, path, form) {
  const response = await fetch(`https://api.stripe.com${path}`, { method: "POST", headers: { authorization: `Bearer ${secret}`, "content-type": "application/x-www-form-urlencoded" }, body: form });
  let data = {};
  try { data = await response.json(); } catch { data = {}; }
  return { ok: response.ok, status: response.status, data };
}

async function verifyStripeSignature(payload, header, secret) {
  const parts = String(header || "").split(",").map((part) => part.trim().split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const data = new TextEncoder().encode(`${timestamp}.${payload}`);
  for (const signature of signatures) {
    if (!/^[a-f0-9]{64}$/i.test(signature)) continue;
    const bytes = new Uint8Array(signature.match(/.{2}/g).map((pair) => Number.parseInt(pair, 16)));
    if (await crypto.subtle.verify("HMAC", key, bytes, data)) return true;
  }
  return false;
}

async function billingSummary(env, orgId, actor = { role: "admin" }) {
  if (actor.is_super_admin) {
    const { results: orgs } = await env.DB.prepare("SELECT id FROM orgs ORDER BY created_at").all();
    const summaries = [];
    for (const org of orgs || []) summaries.push(await billingSummary(env, org.id, { role: "admin" }));
    return {
      currency: "jpy",
      unit_prices: { ...BILLING_DEFAULTS },
      mrr_yen: summaries.reduce((sum, item) => sum + Number(item.mrr_yen || 0), 0),
      active_billing_sites: summaries.reduce((sum, item) => sum + Number(item.active_billing_sites || 0), 0),
      referral_payments: summaries.flatMap((item) => item.referral_payments || []),
      wholesale: { eligible: summaries.some((item) => item.wholesale?.eligible), monthly_invoice_yen: summaries.reduce((sum, item) => sum + Number(item.wholesale?.monthly_invoice_yen || 0), 0) },
      scope: "all_orgs",
    };
  }
  const org = await env.DB.prepare("SELECT plan,wholesale_min FROM orgs WHERE id=?").bind(orgId).first() || { plan: "standard", wholesale_min: 50 };
  const scope = actor.role === "store"
    ? { clause: " AND owner_member_id=?", binds: [actor.member_id] }
    : actor.role === "referrer"
      ? { clause: " AND channel='referral' AND referred_by IN (SELECT id FROM referrers WHERE lower(email)=lower(?))", binds: [actor.email] }
      : { clause: "", binds: [] };
  const active = await env.DB.prepare(`SELECT channel,COUNT(*) AS count FROM sites WHERE org_id=? AND status='active' AND (delivery_status IS NULL OR delivery_status='active')${scope.clause} GROUP BY channel`).bind(orgId, ...scope.binds).all();
  const counts = Object.fromEntries((active.results || []).map((row) => [row.channel || "direct", Number(row.count || 0)]));
  const directCount = (counts.direct || 0) + (counts.referral || 0);
  const activeCount = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);
  const referrers = actor.role === "referrer"
    ? await env.DB.prepare("SELECT r.id,r.name,r.email,COUNT(s.id) AS active_sites FROM referrers r LEFT JOIN sites s ON s.referred_by=r.id AND s.org_id=? AND s.channel='referral' AND s.status='active' AND (s.delivery_status IS NULL OR s.delivery_status='active') WHERE lower(r.email)=lower(?) GROUP BY r.id,r.name,r.email ORDER BY r.name").bind(orgId, actor.email).all()
    : actor.role === "store"
      ? { results: [] }
      : await env.DB.prepare("SELECT r.id,r.name,r.email,COUNT(s.id) AS active_sites FROM referrers r LEFT JOIN sites s ON s.referred_by=r.id AND s.org_id=? AND s.channel='referral' AND s.status='active' AND (s.delivery_status IS NULL OR s.delivery_status='active') GROUP BY r.id,r.name,r.email ORDER BY r.name").bind(orgId).all();
  const referralPayments = (referrers.results || []).map((row) => ({ id: row.id, name: row.name, email: row.email, active_sites: Number(row.active_sites || 0), monthly_amount_yen: Number(row.active_sites || 0) * BILLING_DEFAULTS.referral_monthly_yen }));
  const wholesaleEligible = org.plan === "wholesale" && activeCount >= Number(org.wholesale_min || 50);
  if (actor.role === "referrer") {
    const partnerSites = Number(counts.referral || 0);
    return {
      currency: "jpy",
      scope: "referrer",
      active_sites: partnerSites,
      incentive_per_site_yen: BILLING_DEFAULTS.referral_monthly_yen,
      partner_incentive_yen: partnerSites * BILLING_DEFAULTS.referral_monthly_yen,
    };
  }
  if (actor.role === "agency") {
    return {
      currency: "jpy",
      scope: "agency",
      active_sites: activeCount,
      wholesale_per_site_yen: BILLING_DEFAULTS.wholesale_monthly_yen,
      monthly_invoice_yen: activeCount * BILLING_DEFAULTS.wholesale_monthly_yen,
    };
  }
  const roleScoped = actor.role === "store";
  return { currency: "jpy", unit_prices: { ...BILLING_DEFAULTS }, mrr_yen: actor.role === "store" || actor.role === "referrer" ? 0 : wholesaleEligible ? 0 : directCount * BILLING_DEFAULTS.direct_monthly_yen, active_billing_sites: activeCount, channel_counts: counts, referral_payments: referralPayments, wholesale: { eligible: !roleScoped && wholesaleEligible, active_sites: roleScoped ? 0 : activeCount, minimum_sites: Number(org.wholesale_min || 50), monthly_invoice_yen: !roleScoped && wholesaleEligible ? activeCount * BILLING_DEFAULTS.wholesale_monthly_yen : 0, reason: roleScoped ? null : wholesaleEligible ? null : `稼働${Number(org.wholesale_min || 50)}店以上が必要` }, scope: actor.role };
}

async function safeJson(request) {
  try { return await request.json(); } catch { return {}; }
}

function extractLocalBusinessSchema(html) {
  const scripts = String(html || "").match(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  return scripts.some((script) => {
    const body = script.replace(/^<[\s\S]*?>/i, "").replace(/<\/script>$/i, "").trim();
    try {
      const value = JSON.parse(body);
      const nodes = Array.isArray(value) ? value : (value?.["@graph"] || [value]);
      return nodes.some((node) => (Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]]).some((type) => String(type).toLowerCase() === "localbusiness"));
    } catch {
      return /"@type"\s*:\s*"LocalBusiness"/i.test(body);
    }
  });
}

async function importPlaceForSite(env, site, body = {}, refresh = false) {
  const placeId = String(body.placeId || site.place_id || "").trim();
  const query = String(body.query || site.url || "").trim();
  let place;
  try {
    place = await fetchPlace(env, { placeId, query });
  } catch (error) {
    const detail = error?.detail && typeof error.detail === "object" ? error.detail : { googleMessage: "places_failed" };
    console.error("nurevo_places_error", JSON.stringify({ siteId: site.id, refresh, message: error?.message || "places_failed", upstreamStatus: error?.status || null, detail }));
    return { status: 502, body: { error: "places_unavailable", reason: "google_places_error", upstreamStatus: error?.status || null, detail, message: "Googleマップから店舗情報を取得できませんでした。" } };
  }
  if (!place) return { status: 404, body: { error: "place_not_found" } };
  const websiteUri = String(place.websiteUri || "").trim() || null;
  const proposal = await inspectWebsite(websiteUri);
  const existing = await env.DB.prepare("SELECT * FROM site_settings WHERE site_id=?").bind(site.id).first() || {};
  const settings = placeToSettings(place, existing);
  // Places is an assistant, not an authority: the merger refuses any field a
  // person has edited. Before this, a /refresh silently replaced hand-entered
  // addresses and phone numbers.
  const placesResult = await writeSiteProfile(env, site.id, {
    name: settings.name,
    business_type_label: settings.business_type,
    phone: settings.tel,
    address: settings.address,
    hours: settings.hours,
    hours_periods: settings.hours_periods,
    lat: settings.lat,
    lng: settings.lng,
    price_level: settings.price_level,
  }, "places");
  const applied = placesResult.error ? {} : placesResult.profile;
  const schemaTypes = (existing.serve_schema == null || Number(existing.serve_schema) === 1)
    ? countSchemaTypes({
        name: applied.name, tel: applied.phone, address: applied.address, hours: applied.hours,
        lat: applied.lat, lng: applied.lng, image: applied.image, reserve_url: applied.reserve_url,
      })
    : 0;
  const fetchedAt = Date.now();
  const slug = site.slug || await uniqueSlug(env, settings.name || site.url, site.id);
  if (websiteUri) {
    await writeSiteProfile(env, site.id, { url: websiteUri }, "places");
  }
  await env.DB.prepare("UPDATE sites SET place_id=?,fetched_at=?,schema_types=?,crawler_allowed=1,slug=?,website_fingerprint=?,recommended_install_type=? WHERE id=?")
    .bind(place.id || placeId || null, fetchedAt, schemaTypes, slug, proposal.fingerprint, proposal.recommended_install_type, site.id).run();
  return { status: 200, body: { ok: true, place_id: place.id || placeId || null, fetched_at: fetchedAt, schema_types: schemaTypes, slug, website_uri: websiteUri, proposal, mock: !!place.mock, changed: placesResult.changed || [], rejected: placesResult.rejected || [] } };
}

function isSocialWebsite(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/^www\./, "");
  return ["instagram.com", "facebook.com", "x.com", "twitter.com", "youtube.com", "youtu.be", "tiktok.com", "line.me", "linktr.ee"].some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function safePublicUrl(raw) {
  let url;
  try { url = new URL(String(raw || "")); } catch { throw new Error("unsafe_url_invalid"); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || !["", "80", "443"].includes(url.port)) throw new Error("unsafe_url_scheme_or_port");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host === "metadata.google.internal" || host === "metadata.google") throw new Error("unsafe_url_private_host");
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:")) throw new Error("unsafe_url_private_host");
  const octets = host.split(".").map((part) => Number(part));
  if (octets.length === 4 && octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    const [a, b] = octets;
    if (a === 0 || a === 10 || a === 127 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168 || a === 100 && b >= 64 && b <= 127 || a === 198 && (b === 18 || b === 19)) throw new Error("unsafe_url_private_host");
  }
  return url;
}

async function fetchPublicHtml(rawUrl, { signal, maxRedirects = 3 } = {}) {
  let current = safePublicUrl(rawUrl);
  for (let redirects = 0; redirects <= maxRedirects; redirects++) {
    const response = await fetch(current.toString(), { redirect: "manual", signal, headers: { accept: "text/html,application/xhtml+xml" } });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirects === maxRedirects) throw new Error("unsafe_url_redirect");
      current = safePublicUrl(new URL(location, current).toString());
      continue;
    }
    if (!response.ok) throw new Error(`http_${response.status}`);
    const html = await response.text();
    if (html.length > 1024 * 1024) throw new Error("response_too_large");
    return { response, html, url: current.toString() };
  }
  throw new Error("unsafe_url_redirect");
}

async function inspectWebsite(websiteUri) {
  if (!websiteUri) return { fingerprint: "none", recommended_install_type: "hosted", reachable: false };
  let target;
  try { target = safePublicUrl(websiteUri); } catch (error) { return { fingerprint: "unsafe_or_invalid", recommended_install_type: "hosted", reachable: false, error: error.message }; }
  if (isSocialWebsite(target.hostname)) return { fingerprint: "social", recommended_install_type: "hosted", reachable: false };
  try {
    const { html } = await fetchPublicHtml(target.toString());
    const wordpress = /wp-content|wp-json|<meta[^>]+name=["']generator["'][^>]+content=["'][^"']*wordpress/i.test(html);
    return { fingerprint: wordpress ? "wordpress" : "other_cms_or_site", recommended_install_type: wordpress ? "wp" : "tag", reachable: true };
  } catch (error) {
    return { fingerprint: "unreachable_or_unknown", recommended_install_type: "hosted", reachable: false, error: String(error?.message || "fetch_failed").slice(0, 200) };
  }
}

async function fetchPlace(env, { placeId, query }) {
  const apiKey = String(env.GOOGLE_MAPS_API_KEY || "").trim();
  if (!apiKey) {
    if (String(env.DEV || "") !== "1") throw new Error("GOOGLE_MAPS_API_KEY is not configured");
    return mockPlace(placeId || query);
  }
  let resolvedId = placeId;
  if (!resolvedId) {
    const searchUrl = "https://places.googleapis.com/v1/places:searchText";
    console.log("nurevo_places_search_request", JSON.stringify({ endpoint: searchUrl, fieldMask: PLACES_SEARCH_FIELD_MASK, hasApiKey: true }));
    const search = await fetch(searchUrl, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey, "x-goog-fieldmask": PLACES_SEARCH_FIELD_MASK },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1, languageCode: "ja" }),
    });
    const searchBody = await search.text();
    const searchSummary = summarizeGoogleResponse(searchBody);
    console.log("nurevo_places_search_response", JSON.stringify({ status: search.status, ok: search.ok, ...searchSummary }));
    if (!search.ok) {
      const error = new Error(`places_search_${search.status}`);
      error.status = search.status;
      error.detail = searchSummary;
      throw error;
    }
    const data = JSON.parse(searchBody);
    resolvedId = data.places?.[0]?.id;
    if (!resolvedId) return null;
    return data.places[0];
  }
  const detailsUrl = `https://places.googleapis.com/v1/places/${encodeURIComponent(resolvedId)}?languageCode=ja`;
  console.log("nurevo_places_details_request", JSON.stringify({ endpoint: "https://places.googleapis.com/v1/places/{place_id}", fieldMask: PLACES_DETAILS_FIELD_MASK, hasPlaceId: !!resolvedId, hasApiKey: true }));
  const details = await fetch(detailsUrl, {
    headers: { "x-goog-api-key": apiKey, "x-goog-fieldmask": PLACES_DETAILS_FIELD_MASK },
  });
  const detailsBody = await details.text();
  const detailsSummary = summarizeGoogleResponse(detailsBody);
  console.log("nurevo_places_details_response", JSON.stringify({ status: details.status, ok: details.ok, ...detailsSummary }));
  if (details.status === 404) return null;
  if (!details.ok) {
    const error = new Error(`places_details_${details.status}`);
    error.status = details.status;
    error.detail = detailsSummary;
    throw error;
  }
  return { ...(JSON.parse(detailsBody)), id: resolvedId };
}

async function searchPlaces(env, query) {
  const apiKey = String(env.GOOGLE_MAPS_API_KEY || "").trim();
  if (!apiKey) {
    if (String(env.DEV || "") !== "1") throw new Error("GOOGLE_MAPS_API_KEY is not configured");
    const mock = mockPlace(query);
    return [{ id: mock.id || `mock-${query}`, name: mock.displayName?.text || query, type: mock.primaryTypeDisplayName?.text || "", address: mock.formattedAddress || "", website_uri: mock.websiteUri || null, suggested_install_type: "hosted" }];
  }
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey, "x-goog-fieldmask": PLACES_SEARCH_FIELD_MASK },
    body: JSON.stringify({ textQuery: query, maxResultCount: 5, languageCode: "ja" }),
  });
  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`places_search_${response.status}`);
    error.status = response.status;
    error.detail = summarizeGoogleResponse(detail);
    throw error;
  }
  const data = await response.json();
  return (data.places || []).map((place) => ({
    id: place.id,
    name: place.displayName?.text || "",
    type: place.primaryTypeDisplayName?.text || placeTypeLabel(place.primaryType || place.types?.[0]) || "",
    address: place.formattedAddress || "",
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
    website_uri: place.websiteUri || null,
    suggested_install_type: place.websiteUri ? (isSocialWebsite(new URL(place.websiteUri).hostname) ? "hosted" : "tag") : "hosted",
  }));
}

function summarizeGoogleResponse(raw) {
  try {
    const parsed = JSON.parse(raw);
    const error = parsed?.error;
    return {
      responseKeys: Object.keys(parsed || {}).slice(0, 20),
      resultCount: Array.isArray(parsed?.places) ? parsed.places.length : undefined,
      googleStatus: error?.status || parsed?.status || undefined,
      googleMessage: error?.message || undefined,
    };
  } catch {
    return { responseKeys: [], googleStatus: undefined, googleMessage: "invalid_google_response" };
  }
}

function placeToSettings(place, existing = {}) {
  const location = place.location || {};
  const hours = Array.isArray(place.regularOpeningHours?.weekdayDescriptions)
    ? place.regularOpeningHours.weekdayDescriptions.join("; ")
    : (existing.hours || null);
  return {
    business_type: place.primaryTypeDisplayName?.text || placeTypeLabel(place.primaryType || place.types?.[0]) || existing.business_type || null,
    name: place.displayName?.text || existing.name || null,
    tel: place.nationalPhoneNumber || existing.tel || null,
    address: place.formattedAddress || existing.address || null,
    hours,
    lat: location.latitude ?? existing.lat ?? null,
    lng: location.longitude ?? existing.lng ?? null,
    price_level: place.priceLevel || existing.price_level || null,
    hours_periods: Array.isArray(place.regularOpeningHours?.periods)
      ? JSON.stringify(place.regularOpeningHours.periods)
      : (existing.hours_periods || null),
  };
}

function mockPlace(seed) {
  const source = String(seed || "canary");
  const suffix = source.replace(/^mock-/, "").replace(/[^a-z0-9]+/gi, " ").trim() || "Canary";
  return {
    id: source.startsWith("mock-") ? source : `mock-${suffix.toLowerCase().replace(/\s+/g, "-")}`,
    mock: true,
    displayName: { text: `Nurevo ${suffix}` },
    formattedAddress: "東京都千代田区1-1",
    location: { latitude: 35.6812, longitude: 139.7671 },
    regularOpeningHours: {
      weekdayDescriptions: ["月曜日: 09:00–18:00", "火曜日: 09:00–18:00"],
      periods: [
        { open: { day: 1, hour: 9, minute: 0 }, close: { day: 1, hour: 18, minute: 0 } },
        { open: { day: 2, hour: 9, minute: 0 }, close: { day: 2, hour: 18, minute: 0 } },
      ],
    },
    nationalPhoneNumber: "03-1234-5678",
    types: ["cafe"],
    primaryType: "cafe",
    primaryTypeDisplayName: { text: "カフェ", languageCode: "ja" },
    priceLevel: "PRICE_LEVEL_MODERATE",
  };
}

function placeTypeLabel(type) {
  const labels = { cafe: "カフェ", restaurant: "レストラン", bar: "バー", bakery: "ベーカリー", beauty_salon: "美容院", hair_care: "美容院", clothing_store: "衣料品店", store: "店舗", pharmacy: "薬局", dentist: "歯科", lodging: "宿泊施設" };
  return labels[String(type || "").toLowerCase()] || null;
}

async function uniqueSlug(env, name, siteId) {
  const base = String(name || "store").normalize("NFKC").trim().toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-+|-+$/g, "") || `store-${siteId.slice(0, 8)}`;
  let slug = base;
  let suffix = 2;
  while (true) {
    const row = await env.DB.prepare("SELECT id FROM sites WHERE slug=? AND id<>?").bind(slug, siteId).first();
    if (!row) return slug;
    slug = `${base}-${suffix++}`;
  }
}

async function loadHostedStore(env, slug) {
  return env.DB.prepare(
    `SELECT s.id,s.url,s.slug,s.place_id,s.delivery_status,ss.name,ss.business_type,ss.address,ss.hours,ss.hours_periods,ss.lat,ss.lng,ss.tel,ss.price,ss.price_level
       FROM sites s JOIN site_settings ss ON ss.site_id=s.id WHERE s.slug=? LIMIT 1`,
  ).bind(slug).first();
}

function priceRange(value, ruleset) {
  const definition = rulesetDefinition(ruleset);
  const map = definition?.schema?.hostedPriceLevelMap || INITIAL_AEO_RULESET.definition.schema.hostedPriceLevelMap;
  return map[String(value || "").toUpperCase()] || "";
}

function todayOpening(hours, now = new Date()) {
  const day = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"][now.getDay()];
  const line = String(hours || "").split(/;\s*/).find((item) => item.startsWith(`${day}:`));
  if (!line) return { label: "営業時間情報なし", open: false };
  const range = line.slice(day.length + 1).trim();
  const match = range.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  if (!match) return { label: range, open: false };
  const current = now.getHours() * 60 + now.getMinutes();
  const start = Number(match[1]) * 60 + Number(match[2]);
  const end = Number(match[3]) * 60 + Number(match[4]);
  return { label: range, open: current >= start && current < end };
}

function openingHoursSpecification(periods, hoursText) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let parsed = periods;
  if (typeof parsed === "string") {
    try { parsed = JSON.parse(parsed); } catch { parsed = null; }
  }
  const specs = [];
  for (const period of Array.isArray(parsed) ? parsed : []) {
    const open = period?.open;
    const close = period?.close;
    if (!open || !close || days[open.day] == null || days[close.day] == null) continue;
    const clock = (value) => `${String(value.hour ?? 0).padStart(2, "0")}:${String(value.minute ?? 0).padStart(2, "0")}`;
    specs.push({ "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${days[open.day]}`, opens: clock(open), closes: clock(close) });
  }
  if (specs.length) return specs;
  const japaneseDays = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
  for (const line of String(hoursText || "").split(/;\s*/)) {
    const match = line.match(/^(.+?):\s*(\d{1,2}):(\d{2})\s*[–—〜-]\s*(\d{1,2}):(\d{2})/);
    if (!match) continue;
    const day = japaneseDays.indexOf(match[1]);
    if (day < 0) continue;
    specs.push({ "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${days[day]}`, opens: `${String(match[2]).padStart(2, "0")}:${match[3]}`, closes: `${String(match[4]).padStart(2, "0")}:${match[5]}` });
  }
  return specs;
}

function hostedSchema(store, price, ruleset) {
  const definition = rulesetDefinition(ruleset);
  const rules = definition?.schema || INITIAL_AEO_RULESET.definition.schema;
  const fields = new Set(rules.hostedFields || INITIAL_AEO_RULESET.definition.schema.hostedFields);
  const schema = { "@context": rules.context || "https://schema.org", "@type": rules.type || "LocalBusiness", name: store.name };
  if (fields.has("address") && store.address) schema.address = { "@type": "PostalAddress", streetAddress: store.address };
  const hours = openingHoursSpecification(store.hours_periods, store.hours);
  if (fields.has("openingHoursSpecification") && hours.length) schema.openingHoursSpecification = hours;
  if (fields.has("geo") && store.lat != null && store.lng != null) schema.geo = { "@type": "GeoCoordinates", latitude: store.lat, longitude: store.lng };
  if (fields.has("telephone") && store.tel) schema.telephone = store.tel;
  if (fields.has("priceRange") && price) schema.priceRange = price;
  return schema;
}

const HOSTED_LABELS = {
  ja: { open: "本日営業中", today: "本日営業時間", address: "住所", hours: "営業時間", tel: "電話", price: "価格帯", terms: "利用規約", privacy: "プライバシーポリシー", legal: "特定商取引法に基づく表記", local: "地域のお店" },
  en: { open: "Open today", today: "Today's hours", address: "Address", hours: "Hours", tel: "Phone", price: "Price range", terms: "Terms", privacy: "Privacy", legal: "Legal notice", local: "Local business" },
  zh: { open: "今日营业", today: "今日营业时间", address: "地址", hours: "营业时间", tel: "电话", price: "价格区间", terms: "服务条款", privacy: "隐私政策", legal: "法律声明", local: "本地商家" },
  tw: { open: "今日營業中", today: "今日營業時間", address: "地址", hours: "營業時間", tel: "電話", price: "價格區間", terms: "服務條款", privacy: "隱私政策", legal: "法律聲明", local: "本地商家" },
  ko: { open: "오늘 영업 중", today: "오늘 영업시간", address: "주소", hours: "영업시간", tel: "전화", price: "가격대", terms: "이용약관", privacy: "개인정보처리방침", legal: "법적 고지", local: "지역 사업자" },
  es: { open: "Abierto hoy", today: "Horario de hoy", address: "Dirección", hours: "Horario", tel: "Teléfono", price: "Rango de precios", terms: "Términos", privacy: "Privacidad", legal: "Aviso legal", local: "Negocio local" },
  fr: { open: "Ouvert aujourd’hui", today: "Horaires du jour", address: "Adresse", hours: "Horaires", tel: "Téléphone", price: "Prix", terms: "Conditions", privacy: "Confidentialité", legal: "Mentions légales", local: "Commerce local" },
  de: { open: "Heute geöffnet", today: "Heutige Öffnungszeiten", address: "Adresse", hours: "Öffnungszeiten", tel: "Telefon", price: "Preisspanne", terms: "Nutzungsbedingungen", privacy: "Datenschutz", legal: "Impressum", local: "Lokales Geschäft" },
};
function preferredHostedLocale(url, request) {
  const q = (url.searchParams.get("lang") || "").toLowerCase().replace("_", "-");
  if (q.startsWith("zh-tw") || q === "tw") return "tw";
  if (HOSTED_LABELS[q.slice(0, 2)]) return q.slice(0, 2);
  for (const token of (request.headers.get("accept-language") || "").split(",")) {
    const code = token.trim().split(";")[0].toLowerCase().replace("_", "-");
    if (code.startsWith("zh-tw")) return "tw";
    if (HOSTED_LABELS[code.slice(0, 2)]) return code.slice(0, 2);
  }
  return "ja";
}
function localizeHostedMarkup(html, labels, locale) {
  return html.replace('<html lang="ja">', `<html lang="${locale}">`)
    .replace('<div class="eyebrow">Local business</div>', `<div class="eyebrow">${labels.local}</div>`)
    .replace("本日営業中", labels.open).replace("本日営業時間", labels.today)
    .replace('<span class="label">住所</span>', `<span class="label">${labels.address}</span>`)
    .replace('<span class="label">営業時間</span>', `<span class="label">${labels.hours}</span>`)
    .replace('<span class="label">電話</span>', `<span class="label">${labels.tel}</span>`)
    .replace('<span class="label">価格帯</span>', `<span class="label">${labels.price}</span>`)
    .replace('>利用規約</a>', `>${labels.terms}</a>`).replace('>プライバシーポリシー</a>', `>${labels.privacy}</a>`).replace('>特定商取引法に基づく表記</a>', `>${labels.legal}</a>`);
}
function renderHostedStore(store, locale = "ja", ruleset) {
  const labels = HOSTED_LABELS[locale] || HOSTED_LABELS.ja;
  const price = priceRange(store.price || store.price_level, ruleset);
  const today = todayOpening(store.hours);
  const schema = JSON.stringify(hostedSchema(store, price, ruleset)).replace(/</g, "\\u003c");
  const esc = (value) => String(value ?? "").replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(store.name)} | Nurevo</title><link rel="icon" href="/assets/favicon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet"><script type="application/ld+json">${schema}</script><style>:root{--purple:#6f4df6;--ink:#241b3a;--muted:#716983;--line:#e9e4f5}*{box-sizing:border-box}body{margin:0;background:#faf9fe;color:var(--ink);font-family:Inter,system-ui,sans-serif}.wrap{max-width:760px;margin:0 auto;padding:28px 20px 56px}.brand{display:flex;align-items:center;gap:8px;color:var(--purple);font-weight:800;text-decoration:none}.brand img{width:28px;height:28px}.hero{margin-top:64px}.eyebrow{color:var(--purple);font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.hero h1{font-size:clamp(32px,8vw,60px);line-height:1.05;margin:12px 0}.type{color:var(--muted);font-size:18px}.badge{display:inline-flex;margin-top:22px;padding:8px 12px;border-radius:999px;background:${today.open ? "#dcfce7;color:#166534" : "#f1eafa;color:#6f4df6"};font-size:13px;font-weight:700}.info{margin-top:34px;border-top:1px solid var(--line)}.row{display:flex;justify-content:space-between;gap:20px;padding:17px 0;border-bottom:1px solid var(--line)}.label{color:var(--muted)}.value{text-align:right;white-space:pre-wrap}.footer{margin-top:38px;color:var(--muted);font-size:12px;display:flex;flex-wrap:wrap;gap:12px}.footer a{color:var(--muted);text-decoration:none}.footer a:hover{color:var(--purple)}@media(max-width:560px){.row{display:block}.value{text-align:left;margin-top:4px}}</style></head><body><main class="wrap"><a class="brand" href="https://nurevo.jp/"><img src="/assets/logo.png" alt="Nurevo">Nurevo</a><section class="hero"><div class="eyebrow">Local business</div><h1>${esc(store.name)}</h1><div class="type">${esc(store.business_type || "")}</div><span class="badge">${today.open ? "本日営業中" : "本日営業時間"} · ${esc(today.label)}</span></section><section class="info">${store.address ? `<div class="row"><span class="label">住所</span><span class="value">${esc(store.address)}</span></div>` : ""}${store.hours ? `<div class="row"><span class="label">営業時間</span><span class="value">${esc(store.hours)}</span></div>` : ""}${store.tel ? `<div class="row"><span class="label">電話</span><span class="value">${esc(store.tel)}</span></div>` : ""}${price ? `<div class="row"><span class="label">価格帯</span><span class="value">${price}</span></div>` : ""}</section><p class="footer"><span>Information provided by Nurevo.</span><a href="/terms">利用規約</a><a href="/privacy">プライバシーポリシー</a><a href="/tokushoho">特定商取引法に基づく表記</a></p></main></body></html>`;
}

function buildHostedLlms(store, _ruleset) {
  return buildLlmsTxt({ name: store.name, address: store.address, tel: store.tel, hours: store.hours, url: store.url });
}

export { INITIAL_AEO_RULESET, LIVE_AEO_CACHE_CONTROL, PLACES_SEARCH_FIELD_MASK, PLACES_DETAILS_FIELD_MASK, buildJsonLd, hostedSchema, importPlaceForSite, loadActiveRuleset, renderHostedStore };

export async function refreshDuePlaceSites(env) {
  const cutoff = Date.now() - PLACES_REFRESH_MS;
  const { results } = await env.DB.prepare(
    "SELECT * FROM sites WHERE place_id IS NOT NULL AND (fetched_at IS NULL OR fetched_at<=?) ORDER BY fetched_at LIMIT 100",
  ).bind(cutoff).all();
  const outcomes = [];
  for (const site of results || []) {
    const result = await importPlaceForSite(env, site, { placeId: site.place_id }, true);
    outcomes.push({ siteId: site.id, status: result.status });
  }
  return outcomes;
}

function countSchemaTypes(settings) {
  let count = 1;
  if (settings.hours) count++;
  if (settings.lat != null && settings.lng != null) count++;
  if (settings.reserve_url) count++;
  if (settings.image) count++;
  return count;
}

async function requireMember(request, env) {
  const cookie = request.headers.get("cookie") || "";
  const token = (cookie.match(/(?:^|;\s*)nrv_session=([^;]+)/) || [])[1];
  if (!token) return null;
  const tokenHash = await sha256Hex(decodeURIComponent(token));
  const session = await env.DB.prepare("SELECT se.member_id,se.org_id,se.expires_at,m.email,m.role,m.status FROM sessions se JOIN members m ON m.id=se.member_id AND m.org_id=se.org_id WHERE se.token=? AND se.kind='session'").bind(tokenHash).first();
  if (!session || Number(session.expires_at) <= Date.now()) return null;
  if (session.status !== "active") return null;
  const superEmails = String(env[SUPER_ADMIN_EMAILS_ENV] || "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  return { member_id: session.member_id, org_id: session.org_id, email: session.email, role: session.role, is_super_admin: superEmails.includes(String(session.email || "").toLowerCase()) };
}

// Explicit name used by role-aware handlers. requireMember already rejects
// expired sessions and non-active members, so this alias keeps that invariant
// visible at call sites without creating a second authentication path.
async function requireActiveMember(request, env) {
  return requireMember(request, env);
}

async function requireAdmin(request, env) {
  const member = await requireActiveMember(request, env);
  if (!member) return null;
  if (!member.is_super_admin && member.role !== "admin") return null;
  return member;
}

async function requireSuperAdmin(request, env) {
  const member = await requireMember(request, env);
  return member?.is_super_admin ? member : null;
}

async function requireOrgRole(request, env, roles = []) {
  const member = await requireMember(request, env);
  if (!member) return null;
  if (member.is_super_admin || roles.includes(member.role)) return member;
  return null;
}

async function loadOwnedSite(env, actor, siteId) {
  if (!actor) return null;
  if (actor.is_super_admin) return env.DB.prepare("SELECT * FROM sites WHERE id=?").bind(siteId).first();
  if (actor.role === "store") {
    return env.DB.prepare("SELECT * FROM sites WHERE id=? AND org_id=? AND owner_member_id=?").bind(siteId, actor.org_id, actor.member_id).first();
  }
  if (actor.role === "referrer") {
    return env.DB.prepare("SELECT s.* FROM sites s JOIN referrers r ON r.id=s.referred_by WHERE s.id=? AND s.org_id=? AND s.channel='referral' AND lower(r.email)=lower(?)").bind(siteId, actor.org_id, actor.email).first();
  }
  return env.DB.prepare("SELECT * FROM sites WHERE id=? AND org_id=?").bind(siteId, actor.org_id).first();
}

async function loadOwnedSiteByRef(env, actor, reference) {
  if (!actor) return null;
  if (actor.is_super_admin) return env.DB.prepare("SELECT * FROM sites WHERE id=? OR site_key=? LIMIT 1").bind(reference, reference).first();
  if (actor.role === "store") return env.DB.prepare("SELECT * FROM sites WHERE org_id=? AND owner_member_id=? AND (id=? OR site_key=?) LIMIT 1").bind(actor.org_id, actor.member_id, reference, reference).first();
  if (actor.role === "referrer") return env.DB.prepare("SELECT s.* FROM sites s JOIN referrers r ON r.id=s.referred_by WHERE s.org_id=? AND s.channel='referral' AND lower(r.email)=lower(?) AND (s.id=? OR s.site_key=?) LIMIT 1").bind(actor.org_id, actor.email, reference, reference).first();
  return env.DB.prepare("SELECT * FROM sites WHERE org_id=? AND (id=? OR site_key=?) LIMIT 1").bind(actor.org_id, reference, reference).first();
}

async function listOwnedSites(env, actor) {
  // business_type_schema, description, email and price_level are selected
  // because completeness scores them. price_level in particular was required
  // but never fetched, so every site's fill percentage was short by one.
  const select = `SELECT s.*, o.plan AS org_plan, ss.name AS s_name, ss.tel, ss.address, ss.hours, ss.lat, ss.lng,
              ss.image, ss.reserve_url, ss.business_type, ss.business_type_schema, ss.description,
              ss.email, ss.price_level
         FROM sites s JOIN orgs o ON o.id=s.org_id LEFT JOIN site_settings ss ON ss.site_id = s.id`;
  if (actor.is_super_admin) return env.DB.prepare(`${select} ORDER BY s.created_at`).all();
  if (actor.role === "store") return env.DB.prepare(`${select} WHERE s.org_id=? AND s.owner_member_id=? ORDER BY s.created_at`).bind(actor.org_id, actor.member_id).all();
  if (actor.role === "referrer") return env.DB.prepare(`${select} JOIN referrers r ON r.id=s.referred_by WHERE s.org_id=? AND s.channel='referral' AND lower(r.email)=lower(?) ORDER BY s.created_at`).bind(actor.org_id, actor.email).all();
  return env.DB.prepare(`${select} WHERE s.org_id=? ORDER BY s.created_at`).bind(actor.org_id).all();
}

async function loadOwnedMember(env, actor, memberId) {
  if (!actor) return null;
  if (actor.is_super_admin) return env.DB.prepare("SELECT id,email,org_id,role,status,created_at FROM members WHERE id=?").bind(memberId).first();
  return env.DB.prepare("SELECT id,email,org_id,role,status,created_at FROM members WHERE id=? AND org_id=?").bind(memberId, actor.org_id).first();
}

async function handleMagicRequest(request, env) {
  const ipLimit = await checkApiRateLimit(env, "auth-ip", requestClientIp(request), API_RATE_LIMITS.authIp);
  if (!ipLimit.allowed) return json({ error: ipLimit.unavailable ? "rate_limit_unavailable" : "rate_limited" }, ipLimit.unavailable ? 503 : 429);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const email = String(body?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "invalid_email" }, 400);

  const emailLimit = await checkApiRateLimit(env, "auth-email", email, API_RATE_LIMITS.authEmail);
  if (!emailLimit.allowed) return json({ error: emailLimit.unavailable ? "rate_limit_unavailable" : "rate_limited" }, emailLimit.unavailable ? 503 : 429);

  const member = await findOrCreateMember(env, email);
  const now = Date.now();
  const outstanding = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM sessions WHERE member_id=? AND kind='magic' AND expires_at>?",
  ).bind(member.id, now).first();
  if (Number(outstanding?.count || 0) >= 5) return json({ error: "rate_limited" }, 429);

  const rawToken = randomHex(32);
  const tokenHash = await sha256Hex(rawToken);
  await env.DB.prepare(
    "INSERT INTO sessions (token,member_id,org_id,kind,expires_at) VALUES (?,?,?,?,?)",
  ).bind(tokenHash, member.id, member.orgId, "magic", now + AUTH_MAGIC_TTL_MS).run();

  const loginLink = `${new URL(request.url).origin}/api/auth/callback?token=${encodeURIComponent(rawToken)}`;
  const mailResult = await sendMagicLinkEmail(env, email, loginLink);
  if (!mailResult.ok) {
    // Do not leave an unusable magic credential behind when the provider rejects
    // the message. A new request may then issue a fresh, single-use token.
    await env.DB.prepare("DELETE FROM sessions WHERE token=? AND kind='magic'").bind(tokenHash).run();
    console.error("nurevo_magic_email_failed", JSON.stringify({ code: mailResult.code }));
    return json({ error: mailResult.code }, mailResult.status || 503);
  }
  const response = { ok: true, message: authMessage(request, "sent") };
  if (String(env.DEV || "") === "1") {
    response.loginLink = loginLink;
  }
  return json(response, 200);
}

async function sendMagicLinkEmail(env, email, loginLink) {
  const apiKey = String(env.RESEND_API_KEY || "").trim();
  const from = String(env.MAIL_FROM || "").trim();
  if (!apiKey || !from) return { ok: false, code: "mail_provider_not_configured", status: 503 };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [email], subject: "Nurevoへのログインリンク", text: `Nurevoにログインするには、次のリンクを開いてください。\n\n${loginLink}\n\nこのリンクは15分間有効です。`, html: `<p>Nurevoにログインするには、次のボタンを押してください。</p><p><a href="${loginLink}">ログインする</a></p><p>このリンクは15分間有効です。</p>` }),
  });
  if (response.ok) return { ok: true };
  let detail = {};
  try { detail = await response.json(); } catch { detail = {}; }
  return { ok: false, code: detail?.name || "mail_send_failed", status: 502 };
}

async function handleMagicCallback(request, env) {
  const rawToken = new URL(request.url).searchParams.get("token") || "";
  if (!/^[a-f0-9]{64}$/i.test(rawToken)) return authErrorRedirect(request);
  const tokenHash = await sha256Hex(rawToken);
  const now = Date.now();
  const magic = await env.DB.prepare(
    "SELECT se.member_id,se.org_id,m.status FROM sessions se JOIN members m ON m.id=se.member_id AND m.org_id=se.org_id WHERE se.token=? AND se.kind='magic' AND se.expires_at>?",
  ).bind(tokenHash, now).first();
  if (!magic || magic.status !== "active") return authErrorRedirect(request);
  const consumed = await env.DB.prepare(
    "DELETE FROM sessions WHERE token=? AND kind='magic' AND expires_at>?",
  ).bind(tokenHash, now).run();
  if (Number(consumed?.meta?.changes || 0) !== 1) return authErrorRedirect(request);

  const rawSession = randomHex(32);
  const sessionHash = await sha256Hex(rawSession);
  const expiresAt = now + AUTH_SESSION_TTL_MS;
  await env.DB.prepare(
    "INSERT INTO sessions (token,member_id,org_id,kind,expires_at) VALUES (?,?,?,?,?)",
  ).bind(sessionHash, magic.member_id, magic.org_id, "session", expiresAt).run();
  const headers = new Headers({
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
  });
  headers.set("set-cookie", sessionCookie(rawSession, Math.floor(AUTH_SESSION_TTL_MS / 1000)));
  headers.append("set-cookie", csrfCookie(randomHex(32), CSRF_TTL_SECONDS));
  headers.set("location", "/dashboard");
  return new Response(null, { status: 302, headers });
}

function authErrorRedirect(request) {
  const url = new URL(request.url);
  url.pathname = "/auth-error.html";
  url.search = `?lang=${encodeURIComponent(preferredAuthLocale(request))}`;
  return Response.redirect(url.toString(), 302);
}

function preferredAuthLocale(request) {
  const requested = new URL(request.url).searchParams.get("lang") || String(request.headers.get("accept-language") || "").split(",")[0].split("-")[0];
  return ["ja", "en", "zh", "tw", "ko", "es", "fr", "de"].includes(requested) ? requested : "ja";
}

function authMessage(request, key) {
  const messages = {
    sent: {
      ja: "ログイン用メールを送付しました。メールをご確認ください。",
      en: "A sign-in email has been sent. Please check your inbox.",
      zh: "登录邮件已发送，请查收邮件。", tw: "登入郵件已寄出，請查收郵件。", ko: "로그인 이메일을 보냈습니다. 메일을 확인해 주세요.",
      es: "Hemos enviado un correo de inicio de sesión. Revisa tu correo.", fr: "Un e-mail de connexion a été envoyé. Consultez votre boîte de réception.", de: "Eine Anmelde-E-Mail wurde gesendet. Bitte prüfen Sie Ihren Posteingang."
    }
  };
  return messages[key]?.[preferredAuthLocale(request)] || messages[key]?.ja || "";
}

async function handleMemberRegistration(request, env) {
  const ipLimit = await checkApiRateLimit(env, "member-register-ip", requestClientIp(request), API_RATE_LIMITS.memberIp);
  if (!ipLimit.allowed) return json({ error: ipLimit.unavailable ? "rate_limit_unavailable" : "rate_limited" }, ipLimit.unavailable ? 503 : 429);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const email = String(body?.email || "").trim().toLowerCase();
  const role = String(body?.role || "");
  const invite = String(body?.invite || "").trim();
  const roleMap = { store: "store", referrer: "referrer", agency: "agency" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !roleMap[role]) return json({ error: "email_and_role_required" }, 400);
  const emailLimit = await checkApiRateLimit(env, "member-register-email", email, API_RATE_LIMITS.memberEmail);
  if (!emailLimit.allowed) return json({ error: emailLimit.unavailable ? "rate_limit_unavailable" : "rate_limited" }, emailLimit.unavailable ? 503 : 429);
  let invitation = null;
  let inviteHash = null;
  if (invite) {
    inviteHash = await sha256Hex(invite);
    invitation = await env.DB.prepare("SELECT token,org_id FROM sessions WHERE token=? AND kind='member_invite' AND expires_at>? ")
      .bind(inviteHash, Date.now()).first();
    if (!invitation) return json({ error: "invalid_invite" }, 403);
  } else if (role === "store") {
    return json({ error: "invite_required_for_store" }, 403);
  }
  const existing = await env.DB.prepare("SELECT id FROM members WHERE lower(email)=?").bind(email).first();
  if (existing) return json({ error: "member_exists" }, 409);
  let orgId = invitation?.org_id || env.PARTNER_REVIEW_ORG_ID || null;
  if (!orgId) {
    const reviewer = await env.DB.prepare("SELECT org_id FROM members WHERE role='admin' AND status='active' ORDER BY created_at LIMIT 1").first();
    orgId = reviewer?.org_id || null;
  }
  if (!orgId) return json({ error: "partner_review_org_unavailable" }, 503);
  const memberId = `mem_${uid()}`;
  const now = Date.now();
  const statements = [env.DB.prepare("INSERT INTO members (id,org_id,email,role,status,created_at) VALUES (?,?,?,?,?,?)").bind(memberId, orgId, email, roleMap[role], "pending", now)];
  if (inviteHash) statements.push(env.DB.prepare("DELETE FROM sessions WHERE token=? AND kind='member_invite'").bind(inviteHash));
  await env.DB.batch(statements);
  return json({ ok: true, status: "pending", member_id: memberId, role: roleMap[role] }, 201);
}

async function handleMagicLogout(request, env) {
  const match = (request.headers.get("cookie") || "").match(/(?:^|;\s*)nrv_session=([^;]+)/);
  if (match?.[1]) {
    const tokenHash = await sha256Hex(decodeURIComponent(match[1]));
    await env.DB.prepare("DELETE FROM sessions WHERE token=? AND kind='session'").bind(tokenHash).run();
  }
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "set-cookie": sessionCookie("", 0),
  });
  headers.append("set-cookie", csrfCookie("", 0));
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

async function findOrCreateMember(env, email) {
  const existing = await env.DB.prepare("SELECT id,org_id FROM members WHERE lower(email)=?").bind(email).first();
  if (existing) return { id: existing.id, orgId: existing.org_id };
  const orgId = `org_${uid()}`;
  const memberId = `mem_${uid()}`;
  try {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO orgs (id,name,plan,created_at) VALUES (?,?,?,?)").bind(orgId, email, "pro", Date.now()),
      env.DB.prepare("INSERT INTO members (id,org_id,email,role,status,created_at) VALUES (?,?,?,?,?,?)").bind(memberId, orgId, email, "admin", "active", Date.now()),
    ]);
    return { id: memberId, orgId };
  } catch (error) {
    const raced = await env.DB.prepare("SELECT id,org_id FROM members WHERE lower(email)=?").bind(email).first();
    if (!raced) throw error;
    return { id: raced.id, orgId: raced.org_id };
  }
}

function randomHex(bytes) {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16).padStart(2, "0")).join("");
}

function requestClientIp(request) {
  // In production Cloudflare sets this header from the connecting client. Do
  // not trust user-controlled X-Forwarded-For values for the security key.
  return String(request.headers.get("cf-connecting-ip") || "unknown").trim() || "unknown";
}

async function checkApiRateLimit(env, scope, value, { limit, windowMs }) {
  if (!env.DB) return { allowed: false, unavailable: true };
  const keyHash = await sha256Hex(`${scope}:${String(value || "")}`);
  const key = `${scope}:${keyHash}`;
  const now = Date.now();
  const cutoff = now - windowMs;
  try {
    const row = await env.DB.prepare(`
      INSERT INTO api_rate_limits (bucket, window_started_at, count, updated_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(bucket) DO UPDATE SET
        count = CASE WHEN api_rate_limits.window_started_at <= ? THEN 1 ELSE api_rate_limits.count + 1 END,
        window_started_at = CASE WHEN api_rate_limits.window_started_at <= ? THEN ? ELSE api_rate_limits.window_started_at END,
        updated_at = excluded.updated_at
      RETURNING count, window_started_at
    `).bind(key, now, now, cutoff, cutoff, now).first();
    return { allowed: Number(row?.count || 0) <= limit, count: Number(row?.count || 0) };
  } catch (error) {
    console.error("api_rate_limit_storage_error", JSON.stringify({ scope, error: String(error?.message || "d1_error").slice(0, 120) }));
    return { allowed: false, unavailable: true };
  }
}

async function crawlerHitRateLimit(env, siteId, crawlerId) {
  return checkApiRateLimit(env, "crawler-hit", `${siteId}:${crawlerId}`, API_RATE_LIMITS.crawlerHit);
}

async function recordCrawlerHit(env, siteId, crawlerId, date = new Date().toISOString().slice(0, 10)) {
  await env.DB.prepare(`
    INSERT INTO crawler_hits (site_id, date, crawler_id, hits)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(site_id, date, crawler_id) DO UPDATE SET hits = crawler_hits.hits + 1
  `).bind(siteId, date, crawlerId).run();
}

async function recordRateLimitedCrawlerHit(env, siteId, crawlerId) {
  try {
    const limit = await crawlerHitRateLimit(env, siteId, crawlerId);
    if (limit.allowed) await recordCrawlerHit(env, siteId, crawlerId);
  } catch (error) {
    console.error("crawler_hit_record_error", JSON.stringify({ siteId, crawlerId, error: String(error?.message || error).slice(0, 120) }));
  }
}

function csrfRequired(path) {
  // These endpoints are intentionally unauthenticated. Browser-origin checks
  // and the dedicated IP/email limiter protect public signup/auth requests;
  // every authenticated state-changing endpoint still requires the token.
  // /api/sites/:id/profile is bearer-authenticated server-to-server (the
  // WordPress plugin). It reads no cookie, so a CSRF token is meaningless there
  // and would only block the sync.
  if (/^\/api\/sites\/[^/]+\/profile$/i.test(path)) return false;
  // /api/license/bind is server-to-server from the plugin, authenticated by the
  // license key itself. It reads no cookie, so a CSRF token proves nothing; the
  // IP and per-key limiters are what protect it. Stated here rather than relying
  // on the route sitting above this check, so moving the route cannot silently
  // start rejecting every plugin that saves a license.
  if (path === "/api/license/bind") return false;
  return path !== "/api/auth/request" && path !== "/api/members/register" && path !== "/api/billing/webhook" && path !== "/api/tag/hit";
}

function readCookie(request, name) {
  const match = (request.headers.get("cookie") || "").match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

function csrfValid(request) {
  const cookie = readCookie(request, "nrv_csrf");
  const header = String(request.headers.get("x-csrf-token") || "");
  return /^[a-f0-9]{64}$/i.test(cookie) && cookie === header;
}

function csrfCookie(value, maxAge) {
  return `nrv_csrf=${encodeURIComponent(value)}; Path=/; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function attachCsrf(response, request) {
  const headers = new Headers(response.headers);
  if (!readCookie(request, "nrv_csrf")) headers.append("set-cookie", csrfCookie(randomHex(32), CSRF_TTL_SECONDS));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function csrfResponse(request) {
  const token = readCookie(request, "nrv_csrf") || randomHex(32);
  const response = json({ ok: true, csrf_token: token });
  const headers = new Headers(response.headers);
  headers.append("set-cookie", csrfCookie(token, CSRF_TTL_SECONDS));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

function sessionCookie(value, maxAge) {
  return `nrv_session=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export { buildLlmsTxt, matchCrawler, robotsBlock };
