import { authorizeSiteKey } from "./agent-authorization.mjs";
import { AI_CRAWLERS, buildLlmsTxt, robotsBlock, matchCrawler } from "./ai-crawlers.js";

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
});
const PLACES_SEARCH_FIELD_MASK = "places.id,places.displayName,places.formattedAddress,places.location,places.regularOpeningHours,places.nationalPhoneNumber,places.types,places.primaryType,places.primaryTypeDisplayName,places.priceLevel,places.websiteUri";
// Place Details (New) uses resource-relative field names (without the `places.` prefix).
const PLACES_DETAILS_FIELD_MASK = "id,displayName,formattedAddress,location,regularOpeningHours,nationalPhoneNumber,types,primaryType,primaryTypeDisplayName,priceLevel,websiteUri";
const PLACES_REFRESH_MS = 365 * 24 * 60 * 60 * 1000;
// Centralized defaults; later Stripe/admin settings can replace this object without changing billing logic.
const BILLING_DEFAULTS = Object.freeze({ direct_monthly_yen: 3000, referral_monthly_yen: 1200, wholesale_monthly_yen: 2000 });
const SUPER_ADMIN_EMAILS_ENV = "SUPER_ADMIN_EMAILS";
const REQ = ["name", "tel", "address", "hours", "geo", "business_type", "price_level"];
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

function completeness(settings = {}) {
  const has = {
    name: !!settings.name,
    tel: !!settings.tel,
    address: !!settings.address,
    hours: !!settings.hours,
    geo: settings.lat != null && settings.lng != null,
    business_type: !!settings.business_type,
    price_level: !!settings.price_level,
  };
  const filled = REQ.filter((key) => has[key]).length;
  return { filled, total: REQ.length, pct: Math.round((filled / REQ.length) * 100), has };
}

function rulesetDefinition(ruleset) {
  if (!ruleset) return INITIAL_AEO_RULESET.definition;
  if (ruleset.definition && typeof ruleset.definition === "object") return ruleset.definition;
  if (typeof ruleset.definition_json === "string") {
    try { return JSON.parse(ruleset.definition_json); } catch { return INITIAL_AEO_RULESET.definition; }
  }
  return ruleset;
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
  const ld = { "@context": schema.context || "https://schema.org", "@type": schema.type || defaults.schemaType || "LocalBusiness", name: settings.name || site.url };
  const hostedBaseUrl = defaults.hostedBaseUrl || "https://nurevo.jp/s/";
  const canonicalUrl = site?.website_uri || (site?.url ? (/^https?:\/\//i.test(site.url) ? site.url : `https://${site.url}`) : null) || (site?.slug ? `${hostedBaseUrl}${encodeURIComponent(site.slug)}` : null);
  if (fields.url !== false && canonicalUrl) ld.url = canonicalUrl;
  if (fields.additionalType !== false && settings.business_type) ld.additionalType = settings.business_type;
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
      `SELECT s.slug, ss.name, ss.business_type, ss.address, ss.hours, ss.tel
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
    const ruleset = await loadActiveRuleset(env);
    const store = {
      name: settings.name || site?.url || "",
      address: settings.address || "",
      tel: settings.tel || "",
      hours: settings.hours || "",
      reserve: settings.reserve_url || "",
      url: site?.url || "",
    };
    return json({
      ok: true,
      quality: auth.quality,
      crawlerAllowed: !!settings.allow_crawlers,
      jsonld: settings.serve_schema ? buildJsonLd(site, settings, ruleset) : null,
      ruleset_version: Number(ruleset.version || INITIAL_AEO_RULESET.version),
      store,
    }, 200, {
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
      "INSERT INTO sites (id, org_id, owner_member_id, url, site_key, install_type, status, plan, contract, slug, place_id, created_at) VALUES (?,?,?,?,?,?,'pending','pro','trial',?,?,?)",
    ).bind(id, member.org_id, member.member_id, siteUrl.replace(/^https?:\/\//, ""), siteKey, installType, slug, placeId, Date.now()).run();
    let imported = null;
    if (placeId) {
      const importedSite = await env.DB.prepare("SELECT * FROM sites WHERE id=? AND org_id=?").bind(id, member.org_id).first();
      const result = await importPlaceForSite(env, importedSite, { placeId });
      if (result.status !== 200) return json(result.body || { error: "places_unavailable" }, result.status);
      imported = result.body;
    }
    if (installType === "hosted" || installType === "static") {
      // Place import has already created this row.  Keep the imported address,
      // phone, hours and geo data instead of issuing a duplicate INSERT.
      await env.DB.prepare(
        "INSERT INTO site_settings (site_id,name,serve_schema,allow_crawlers) VALUES (?,?,1,1) ON CONFLICT(site_id) DO NOTHING",
      ).bind(id, body?.name || "").run();
    }
    const snippet = `<script src="https://nurevo.jp/tag.js" data-webmcp-site-key="${siteKey}" defer></` + "script>";
    return json({ id, siteKey, install_type: installType, slug: imported?.slug || slug, hostedUrl: (imported?.slug || slug) ? `/s/${imported?.slug || slug}` : null, snippet, imported, proposal: imported?.proposal || null });
  }

  if (path === "/api/sites" && method === "GET") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const { results } = await listOwnedSites(env, member);
    const now = Date.now();
    const sites = results.map((row) => {
      const fill = completeness({ name: row.s_name, tel: row.tel, address: row.address, hours: row.hours, lat: row.lat, lng: row.lng, business_type: row.business_type, price_level: row.price_level });
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
        billing: { status: row.contract === "active" ? "active" : row.contract === "unpaid" ? "unpaid" : row.contract === "cancelled" ? "stopped" : "pending", customer_id: row.stripe_customer_id || null, subscription_id: row.stripe_subscription_id || null },
        checklist,
      };
    });
    return json({ sites });
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
    await env.DB.prepare(
      `INSERT INTO site_settings (site_id,business_type,name,tel,address,hours,lat,lng,image,reserve_url,serve_schema,allow_crawlers)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(site_id) DO UPDATE SET business_type=excluded.business_type,name=excluded.name,tel=excluded.tel,
       address=excluded.address,hours=excluded.hours,lat=excluded.lat,lng=excluded.lng,image=excluded.image,
       reserve_url=excluded.reserve_url,serve_schema=excluded.serve_schema,allow_crawlers=excluded.allow_crawlers`,
    ).bind(id, body.type || null, body.name || null, body.tel || null, body.address || null, body.hours || null,
      body.lat ?? null, body.lng ?? null, body.image || null, body.reserve_url || null,
      body.serve_schema ? 1 : 0, body.allow_crawlers ? 1 : 0).run();
    const schemaTypes = body.serve_schema ? countSchemaTypes(body) : 0;
    if (Object.prototype.hasOwnProperty.call(body, "gbp_linked")) {
      await env.DB.prepare("UPDATE sites SET gbp_linked=? WHERE id=? AND org_id=?").bind(body.gbp_linked ? 1 : 0, id, member.org_id).run();
    }
    await env.DB.prepare("UPDATE sites SET schema_types=?,crawler_allowed=? WHERE id=? AND org_id=?")
      .bind(schemaTypes, body.allow_crawlers ? 1 : 0, id, member.org_id).run();
    return json({ ok: true, schema_types: schemaTypes });
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
    return json({ ok: true, url: response.data.url, amount_yen: BILLING_DEFAULTS.direct_monthly_yen, trial: false });
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
    return json({ ok: true, url: response.data.url, amount_yen: BILLING_DEFAULTS.direct_monthly_yen, trial: false, site_id: site.id });
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
    if (event.type === "checkout.session.completed" && siteId) {
      await env.DB.prepare("UPDATE sites SET stripe_customer_id=?,stripe_subscription_id=? WHERE id=?")
        .bind(object.customer || null, object.subscription || null, siteId).run();
      await env.DB.prepare("UPDATE sites SET contract='active' WHERE id=?").bind(siteId).run();
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
    if (event.type === "invoice.payment_failed" && siteId) {
      await env.DB.prepare("UPDATE sites SET contract='unpaid',delivery_status='stopped' WHERE id=?").bind(siteId).run();
    }
    if (event.type === "customer.subscription.deleted" && siteId) {
      await env.DB.prepare("UPDATE sites SET contract='cancelled',delivery_status='stopped' WHERE id=?").bind(siteId).run();
    }
    return json({ received: true });
  }
  return null;
}

function stripeTestSecret(env) {
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
  await env.DB.prepare(
    `INSERT INTO site_settings (site_id,business_type,name,tel,address,hours,hours_periods,lat,lng,image,reserve_url,serve_schema,allow_crawlers,price_level,price)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(site_id) DO UPDATE SET business_type=excluded.business_type,name=excluded.name,tel=excluded.tel,
     address=excluded.address,hours=excluded.hours,hours_periods=excluded.hours_periods,lat=excluded.lat,lng=excluded.lng,price_level=excluded.price_level,price=excluded.price`,
  ).bind(site.id, settings.business_type, settings.name, settings.tel, settings.address, settings.hours,
    settings.hours_periods, settings.lat, settings.lng, existing.image || null, existing.reserve_url || null,
    existing.serve_schema == null ? 1 : Number(existing.serve_schema),
    existing.allow_crawlers == null ? 1 : Number(existing.allow_crawlers), settings.price_level, settings.price_level).run();
  const schemaTypes = (existing.serve_schema == null || Number(existing.serve_schema) === 1) ? countSchemaTypes(settings) : 0;
  const fetchedAt = Date.now();
  const slug = site.slug || await uniqueSlug(env, settings.name || site.url, site.id);
  await env.DB.prepare("UPDATE sites SET place_id=?,fetched_at=?,schema_types=?,crawler_allowed=1,slug=?,website_uri=?,website_fingerprint=?,recommended_install_type=? WHERE id=?")
    .bind(place.id || placeId || null, fetchedAt, schemaTypes, slug, websiteUri, proposal.fingerprint, proposal.recommended_install_type, site.id).run();
  return { status: 200, body: { ok: true, place_id: place.id || placeId || null, fetched_at: fetchedAt, schema_types: schemaTypes, slug, website_uri: websiteUri, proposal, mock: !!place.mock } };
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
  const select = `SELECT s.*, o.plan AS org_plan, ss.name AS s_name, ss.tel, ss.address, ss.hours, ss.lat, ss.lng,
              ss.image, ss.reserve_url, ss.business_type
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
