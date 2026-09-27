import { authorizeSiteKey } from "./agent-authorization.mjs";
import { AI_CRAWLERS, buildLlmsTxt, robotsBlock, matchCrawler } from "./ai-crawlers.js";

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
  },
});
const uid = () => crypto.randomUUID().replace(/-/g, "").slice(0, 12);
const newKey = () => `nrv_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
const AUTH_MAGIC_TTL_MS = 15 * 60 * 1000;
const AUTH_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PLACES_FIELD_MASK = "places.displayName,places.formattedAddress,places.location,places.regularOpeningHours,places.nationalPhoneNumber,places.types,places.primaryType,places.primaryTypeDisplayName,places.priceLevel";
const PLACES_REFRESH_MS = 365 * 24 * 60 * 60 * 1000;
const REQ = ["name", "tel", "address", "hours", "geo", "image", "reserve"];

function completeness(settings = {}) {
  const has = {
    name: !!settings.name,
    tel: !!settings.tel,
    address: !!settings.address,
    hours: !!settings.hours,
    geo: settings.lat != null && settings.lng != null,
    image: !!settings.image,
    reserve: !!settings.reserve_url,
  };
  const filled = REQ.filter((key) => has[key]).length;
  return { filled, total: REQ.length, pct: Math.round((filled / REQ.length) * 100), has };
}

function buildJsonLd(site, settings) {
  const ld = { "@context": "https://schema.org", "@type": "LocalBusiness", name: settings.name || site.url };
  if (settings.address) ld.address = { "@type": "PostalAddress", streetAddress: settings.address };
  if (settings.tel) ld.telephone = settings.tel;
  if (settings.hours) ld.openingHours = settings.hours;
  if (settings.lat != null && settings.lng != null) ld.geo = { "@type": "GeoCoordinates", latitude: settings.lat, longitude: settings.lng };
  if (settings.image) ld.image = settings.image;
  if (settings.reserve_url) ld.potentialAction = { "@type": "ReserveAction", target: settings.reserve_url };
  return ld;
}

export async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const hostedMatch = path.match(/^\/s\/([^/]+)(?:\/(llms\.txt))?$/i);
  if (hostedMatch && method === "GET") {
    const slug = decodeURIComponent(hostedMatch[1]);
    const hosted = await loadHostedStore(env, slug);
    if (!hosted) return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
    if (hostedMatch[2]) return new Response(buildHostedLlms(hosted), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" } });
    return new Response(renderHostedStore(hosted), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
  }

  if (path === "/robots.txt" && method === "GET") {
    const allow = AI_CRAWLERS.map((crawler) => `User-agent: ${crawler.ua}\nAllow: /s/`).join("\n\n");
    return new Response(`${allow}\n\nSitemap: https://nurevo.jp/sitemap.xml\n`, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" } });
  }

  if (path === "/sitemap.xml" && method === "GET") {
    const { results } = await env.DB.prepare("SELECT slug FROM sites WHERE install_type='hosted' AND slug IS NOT NULL AND slug<>'' ORDER BY slug").all();
    const escXml = (value) => String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
    const urls = (results || []).map((row) => `  <url><loc>https://nurevo.jp/s/${escXml(row.slug)}</loc></url>`).join("\n");
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=300" } });
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

  if (path === "/api/tag/config" && method === "GET") {
    const auth = await authorizeSiteKey(env, url.searchParams.get("k"));
    if (!auth.registered) return json({ ok: false }, 404);
    const settings = await env.DB.prepare("SELECT * FROM site_settings WHERE site_id = ?").bind(auth.siteId).first() || {};
    const site = await env.DB.prepare("SELECT url FROM sites WHERE id = ?").bind(auth.siteId).first();
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
      jsonld: settings.serve_schema ? buildJsonLd(site, settings) : null,
      store,
    });
  }

  if (path === "/api/sites" && method === "POST") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const body = await request.json();
    const installType = ["wp", "tag", "hosted"].includes(body?.install_type) ? body.install_type : "tag";
    const siteUrl = String(body?.url || "").trim();
    if (installType !== "hosted" && !siteUrl) return json({ error: "url required" }, 400);
    const id = uid();
    const siteKey = newKey();
    const slug = installType === "hosted" ? await uniqueSlug(env, body?.name || "store", id) : null;
    await env.DB.prepare(
      "INSERT INTO sites (id, org_id, url, site_key, install_type, status, plan, contract, slug, created_at) VALUES (?,?,?,?,?,'pending','pro','trial',?,?)",
    ).bind(id, member.org_id, siteUrl.replace(/^https?:\/\//, ""), siteKey, installType, slug, Date.now()).run();
    if (installType === "hosted") {
      await env.DB.prepare("INSERT INTO site_settings (site_id,name,serve_schema,allow_crawlers) VALUES (?,?,1,1)").bind(id, body?.name || "",).run();
    }
    const snippet = `<script src="https://nurevo.jp/tag.js" data-webmcp-site-key="${siteKey}" defer></` + "script>";
    return json({ id, siteKey, install_type: installType, slug, hostedUrl: slug ? `/s/${slug}` : null, snippet });
  }

  if (path === "/api/sites" && method === "GET") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const { results } = await env.DB.prepare(
      `SELECT s.*, ss.name AS s_name, ss.tel, ss.address, ss.hours, ss.lat, ss.lng,
              ss.image, ss.reserve_url, ss.business_type
         FROM sites s LEFT JOIN site_settings ss ON ss.site_id = s.id
        WHERE s.org_id = ?`,
    ).bind(member.org_id).all();
    const now = Date.now();
    const sites = results.map((row) => {
      const fill = completeness({ name: row.s_name, tel: row.tel, address: row.address, hours: row.hours, lat: row.lat, lng: row.lng, image: row.image, reserve_url: row.reserve_url });
      const stale = row.last_seen_at && now - row.last_seen_at > 24 * 3600e3;
      return {
        id: row.id,
        url: row.url,
        install_type: row.install_type || (row.url ? "tag" : "hosted"),
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
      };
    });
    return json({ sites });
  }

  const scanMatch = path.match(/^\/api\/sites\/([^/]+)\/scan$/i);
  if (scanMatch && method === "POST") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const site = await env.DB.prepare("SELECT * FROM sites WHERE id=? AND org_id=?").bind(scanMatch[1], member.org_id).first();
    if (!site) return json({ error: "not_found" }, 404);
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
      let response = await fetch(targetUrl, { redirect: "follow", signal: controller.signal, headers: { accept: "text/html,application/xhtml+xml" } });
      // Cloudflare's self-fetch can bypass the static-asset route after its extension redirect.
      if (response.status === 404 && new URL(targetUrl).host === url.host && env.ASSETS) {
        response = await env.ASSETS.fetch(new Request(targetUrl, { headers: { accept: "text/html,application/xhtml+xml" } }));
      }
      if (!response.ok) throw new Error(`http_${response.status}`);
      const html = await response.text();
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

  const match = path.match(/^\/api\/sites\/([a-z0-9]+)$/i);
  const placesMatch = path.match(/^\/api\/sites\/([a-z0-9]+)\/(import|refresh)$/i);
  if (placesMatch && (method === "POST")) {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const site = await env.DB.prepare("SELECT * FROM sites WHERE id=? AND org_id=?").bind(placesMatch[1], member.org_id).first();
    if (!site) return json({ error: "not_found" }, 404);
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
    const body = await request.json();
    const id = match[1];
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

  if (path === "/api/crawlers" && method === "GET") return json({ crawlers: AI_CRAWLERS });

  if (path === "/api/billing/summary" && method === "GET") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    return json(await billingSummary(env, member.org_id));
  }

  if (path === "/api/billing/checkout" && method === "POST") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
    const body = await safeJson(request);
    const site = await env.DB.prepare("SELECT * FROM sites WHERE id=? AND org_id=?").bind(body.site_id, member.org_id).first();
    if (!site) return json({ error: "not_found" }, 404);
    if (!["direct", "referral"].includes(site.channel || "direct")) return json({ error: "channel_not_checkoutable" }, 400);
    const secret = stripeTestSecret(env);
    if (!secret) return json({ error: "stripe_test_key_required" }, 503);
    const memberRow = await env.DB.prepare("SELECT email FROM members WHERE id=?").bind(member.member_id).first();
    const form = new URLSearchParams({ mode: "subscription", "line_items[0][price]": String(env.STRIPE_PRICE_ID_PRO || ""), "line_items[0][quantity]": "1", success_url: "https://nurevo.jp/dashboard?checkout=success", cancel_url: "https://nurevo.jp/dashboard?checkout=cancelled", customer_email: memberRow?.email || "", "metadata[siteId]": site.id, "metadata[orgId]": member.org_id, "subscription_data[metadata][siteId]": site.id, "subscription_data[metadata][orgId]": member.org_id });
    if (!env.STRIPE_PRICE_ID_PRO) return json({ error: "STRIPE_PRICE_ID_PRO is required" }, 503);
    const response = await stripeRequest(secret, "/v1/checkout/sessions", form);
    if (!response.ok || !response.data?.url) return json({ error: response.data?.error?.message || "stripe_checkout_failed" }, 502);
    return json({ ok: true, url: response.data.url, amount_yen: 3000, trial: false });
  }

  if (path === "/api/billing/connect/onboard" && method === "POST") {
    const member = await requireMember(request, env);
    if (!member) return json({ error: "unauthorized" }, 401);
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
    const siteId = object.metadata?.siteId || object.lines?.data?.[0]?.metadata?.siteId;
    if (event.type === "checkout.session.completed" && siteId) {
      await env.DB.prepare("UPDATE sites SET stripe_customer_id=?,stripe_subscription_id=? WHERE id=?")
        .bind(object.customer || null, object.subscription || null, siteId).run();
    }
    if (event.type === "invoice.paid" && siteId) {
      const site = await env.DB.prepare("SELECT * FROM sites WHERE id=?").bind(siteId).first();
      const referrer = site?.channel === "referral" ? await env.DB.prepare("SELECT * FROM referrers WHERE id=?").bind(site.referred_by).first() : null;
      if (referrer?.stripe_account_id && stripeTestSecret(env)) {
        // Executed only by a verified Stripe webhook; no client-supplied destination is trusted.
        await stripeRequest(stripeTestSecret(env), "/v1/transfers", new URLSearchParams({ amount: "1200", currency: "jpy", destination: referrer.stripe_account_id, "metadata[siteId]": siteId, "metadata[eventId]": event.id }));
      }
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

async function billingSummary(env, orgId) {
  const org = await env.DB.prepare("SELECT plan,wholesale_min FROM orgs WHERE id=?").bind(orgId).first() || { plan: "standard", wholesale_min: 50 };
  const active = await env.DB.prepare("SELECT channel,COUNT(*) AS count FROM sites WHERE org_id=? AND status='active' GROUP BY channel").bind(orgId).all();
  const counts = Object.fromEntries((active.results || []).map((row) => [row.channel || "direct", Number(row.count || 0)]));
  const directCount = (counts.direct || 0) + (counts.referral || 0);
  const activeCount = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);
  const referrers = await env.DB.prepare("SELECT r.id,r.name,r.email,COUNT(s.id) AS active_sites FROM referrers r LEFT JOIN sites s ON s.referred_by=r.id AND s.org_id=? AND s.channel='referral' AND s.status='active' GROUP BY r.id,r.name,r.email ORDER BY r.name").bind(orgId).all();
  const referralPayments = (referrers.results || []).map((row) => ({ id: row.id, name: row.name, email: row.email, active_sites: Number(row.active_sites || 0), monthly_amount_yen: Number(row.active_sites || 0) * 1200 }));
  const wholesaleEligible = org.plan === "wholesale" && activeCount >= Number(org.wholesale_min || 50);
  return { currency: "jpy", unit_prices: { direct_monthly_yen: 3000, referral_monthly_yen: 1200, wholesale_monthly_yen: 2000 }, mrr_yen: wholesaleEligible ? 0 : directCount * 3000, active_billing_sites: activeCount, channel_counts: counts, referral_payments: referralPayments, wholesale: { eligible: wholesaleEligible, active_sites: activeCount, minimum_sites: Number(org.wholesale_min || 50), monthly_invoice_yen: wholesaleEligible ? activeCount * 2000 : 0, reason: wholesaleEligible ? null : `稼働${Number(org.wholesale_min || 50)}店以上が必要` } };
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
    console.error("nurevo_places_error", JSON.stringify({ siteId: site.id, refresh, message: error?.message || "places_failed" }));
    return { status: 502, body: { error: "places_unavailable" } };
  }
  if (!place) return { status: 404, body: { error: "place_not_found" } };
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
  await env.DB.prepare("UPDATE sites SET place_id=?,fetched_at=?,schema_types=?,crawler_allowed=1,slug=? WHERE id=?")
    .bind(place.id || placeId || null, fetchedAt, schemaTypes, slug, site.id).run();
  return { status: 200, body: { ok: true, place_id: place.id || placeId || null, fetched_at: fetchedAt, schema_types: schemaTypes, slug, mock: !!place.mock } };
}

async function fetchPlace(env, { placeId, query }) {
  const apiKey = String(env.GOOGLE_MAPS_API_KEY || "").trim();
  if (!apiKey) {
    if (String(env.DEV || "") !== "1") throw new Error("GOOGLE_MAPS_API_KEY is not configured");
    return mockPlace(placeId || query);
  }
  let resolvedId = placeId;
  if (!resolvedId) {
    const search = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey, "x-goog-fieldmask": PLACES_FIELD_MASK },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1, languageCode: "ja" }),
    });
    if (!search.ok) throw new Error(`places_search_${search.status}`);
    const data = await search.json();
    resolvedId = data.places?.[0]?.id;
    if (!resolvedId) return null;
    return data.places[0];
  }
  const details = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(resolvedId)}?languageCode=ja`, {
    headers: { "x-goog-api-key": apiKey, "x-goog-fieldmask": PLACES_FIELD_MASK },
  });
  if (details.status === 404) return null;
  if (!details.ok) throw new Error(`places_details_${details.status}`);
  return { ...(await details.json()), id: resolvedId };
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
    `SELECT s.id,s.url,s.slug,s.place_id,ss.name,ss.business_type,ss.address,ss.hours,ss.hours_periods,ss.lat,ss.lng,ss.tel,ss.price,ss.price_level
       FROM sites s JOIN site_settings ss ON ss.site_id=s.id WHERE s.slug=? LIMIT 1`,
  ).bind(slug).first();
}

function priceRange(value) {
  const map = { PRICE_LEVEL_FREE: "¥", PRICE_LEVEL_INEXPENSIVE: "¥", PRICE_LEVEL_MODERATE: "¥¥", PRICE_LEVEL_EXPENSIVE: "¥¥¥", PRICE_LEVEL_VERY_EXPENSIVE: "¥¥¥" };
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

function hostedSchema(store, price) {
  const schema = { "@context": "https://schema.org", "@type": "LocalBusiness", name: store.name };
  if (store.address) schema.address = { "@type": "PostalAddress", streetAddress: store.address };
  const hours = openingHoursSpecification(store.hours_periods, store.hours);
  if (hours.length) schema.openingHoursSpecification = hours;
  if (store.lat != null && store.lng != null) schema.geo = { "@type": "GeoCoordinates", latitude: store.lat, longitude: store.lng };
  if (store.tel) schema.telephone = store.tel;
  if (price) schema.priceRange = price;
  return schema;
}

function renderHostedStore(store) {
  const price = priceRange(store.price || store.price_level);
  const today = todayOpening(store.hours);
  const schema = JSON.stringify(hostedSchema(store, price)).replace(/</g, "\\u003c");
  const esc = (value) => String(value ?? "").replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(store.name)} | Nurevo</title><link rel="icon" href="/assets/favicon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet"><script type="application/ld+json">${schema}</script><style>:root{--purple:#6f4df6;--ink:#241b3a;--muted:#716983;--line:#e9e4f5}*{box-sizing:border-box}body{margin:0;background:#faf9fe;color:var(--ink);font-family:Inter,system-ui,sans-serif}.wrap{max-width:760px;margin:0 auto;padding:28px 20px 56px}.brand{display:flex;align-items:center;gap:8px;color:var(--purple);font-weight:800;text-decoration:none}.brand img{width:28px;height:28px}.hero{margin-top:64px}.eyebrow{color:var(--purple);font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.hero h1{font-size:clamp(32px,8vw,60px);line-height:1.05;margin:12px 0}.type{color:var(--muted);font-size:18px}.badge{display:inline-flex;margin-top:22px;padding:8px 12px;border-radius:999px;background:${today.open ? "#dcfce7;color:#166534" : "#f1eafa;color:#6f4df6"};font-size:13px;font-weight:700}.info{margin-top:34px;border-top:1px solid var(--line)}.row{display:flex;justify-content:space-between;gap:20px;padding:17px 0;border-bottom:1px solid var(--line)}.label{color:var(--muted)}.value{text-align:right;white-space:pre-wrap}.footer{margin-top:38px;color:var(--muted);font-size:12px;display:flex;flex-wrap:wrap;gap:12px}.footer a{color:var(--muted);text-decoration:none}.footer a:hover{color:var(--purple)}@media(max-width:560px){.row{display:block}.value{text-align:left;margin-top:4px}}</style></head><body><main class="wrap"><a class="brand" href="https://nurevo.jp/"><img src="/assets/logo.png" alt="Nurevo">Nurevo</a><section class="hero"><div class="eyebrow">Local business</div><h1>${esc(store.name)}</h1><div class="type">${esc(store.business_type || "")}</div><span class="badge">${today.open ? "本日営業中" : "本日営業時間"} · ${esc(today.label)}</span></section><section class="info">${store.address ? `<div class="row"><span class="label">住所</span><span class="value">${esc(store.address)}</span></div>` : ""}${store.hours ? `<div class="row"><span class="label">営業時間</span><span class="value">${esc(store.hours)}</span></div>` : ""}${store.tel ? `<div class="row"><span class="label">電話</span><span class="value">${esc(store.tel)}</span></div>` : ""}${price ? `<div class="row"><span class="label">価格帯</span><span class="value">${price}</span></div>` : ""}</section><p class="footer"><span>Information provided by Nurevo.</span><a href="/terms">利用規約</a><a href="/privacy">プライバシーポリシー</a><a href="/tokushoho">特定商取引法に基づく表記</a></p></main></body></html>`;
}

function buildHostedLlms(store) {
  return buildLlmsTxt({ name: store.name, address: store.address, tel: store.tel, hours: store.hours, url: store.url });
}

export { PLACES_FIELD_MASK, importPlaceForSite };

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
  const session = await env.DB.prepare("SELECT member_id,org_id,expires_at FROM sessions WHERE token=? AND kind='session'").bind(tokenHash).first();
  if (!session || Number(session.expires_at) <= Date.now()) return null;
  return { member_id: session.member_id, org_id: session.org_id };
}

async function handleMagicRequest(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const email = String(body?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "invalid_email" }, 400);

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
  const response = { ok: true, message: "If the address is valid, a sign-in link has been issued." };
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
  if (!/^[a-f0-9]{64}$/i.test(rawToken)) return json({ error: "invalid_or_expired_token" }, 401);
  const tokenHash = await sha256Hex(rawToken);
  const now = Date.now();
  const magic = await env.DB.prepare(
    "SELECT member_id,org_id FROM sessions WHERE token=? AND kind='magic' AND expires_at>?",
  ).bind(tokenHash, now).first();
  if (!magic) return json({ error: "invalid_or_expired_token" }, 401);
  const consumed = await env.DB.prepare(
    "DELETE FROM sessions WHERE token=? AND kind='magic' AND expires_at>?",
  ).bind(tokenHash, now).run();
  if (Number(consumed?.meta?.changes || 0) !== 1) return json({ error: "invalid_or_expired_token" }, 401);

  const rawSession = randomHex(32);
  const sessionHash = await sha256Hex(rawSession);
  const expiresAt = now + AUTH_SESSION_TTL_MS;
  await env.DB.prepare(
    "INSERT INTO sessions (token,member_id,org_id,kind,expires_at) VALUES (?,?,?,?,?)",
  ).bind(sessionHash, magic.member_id, magic.org_id, "session", expiresAt).run();
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
  });
  headers.set("set-cookie", sessionCookie(rawSession, Math.floor(AUTH_SESSION_TTL_MS / 1000)));
  return new Response(JSON.stringify({ ok: true, authenticated: true }), { status: 200, headers });
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

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

function sessionCookie(value, maxAge) {
  return `nrv_session=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export { buildLlmsTxt, matchCrawler, robotsBlock };
