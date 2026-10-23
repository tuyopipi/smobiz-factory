/**
 * Onboarding and billing fixes on the backend (fix/onboarding-backend).
 *
 *  1. /api/aeo/score: 10-minute cache, fresh=1 bypass, one fresh scan per host
 *     per minute; /api/sites/:id/aeo-score accepts fresh=1 too.
 *  2. /api/tag/config tells a known key whose delivery is stopped that it is
 *     free and stopped (200), and keeps 404 for unknown keys.
 *  3. DELETE /api/sites/:id is refused while a subscription is live.
 *  4. Payment links are single-use and refused for a site already paying.
 *  5. The landing plan survives the magic link (next/plan, migration 0037).
 *  6. GET on a magic link does not sign in; the confirm page's POST does, and
 *     failures carry a reason code.
 *  7. POST /api/sites normalises and validates the URL and refuses duplicates.
 *  8. A new org is created with plan "free".
 *  9. Distinct machine codes for auth failures.
 *
 * No network: fetch is replaced for every call that would leave the process.
 */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { handleApi, hasLiveSubscription, safeAuthNext, renderMagicConfirmPage } from "../worker/api.mjs";
import { AEO_CACHE_TTL_SECONDS, AEO_FRESH_RATE_LIMIT } from "../worker/aeo-score.mjs";
import { INITIAL_AEO_RULESET } from "../worker/aeo-rules.mjs";

const originalFetch = globalThis.fetch;
const CSRF = "c".repeat(64);
const SESSION_HEADERS = { cookie: `nrv_session=t; nrv_csrf=${CSRF}`, "x-csrf-token": CSRF, "content-type": "application/json", origin: "https://nurevo.jp" };

class MemoryKv {
  constructor() { this.values = new Map(); }
  async get(key, type) { const v = this.values.get(key) ?? null; return type === "json" && v ? JSON.parse(v) : v; }
  async put(key, value) { this.values.set(key, value); }
}

const fixtureHtml = "<!doctype html><html><head><title>F</title></head><body><h1>F</h1><p>Server-rendered fixture text long enough for scoring.</p></body></html>";
const pageFetches = [];
function stubSiteFetch() {
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === "string" ? input : input.url);
    pageFetches.push({ url: url.href, headers: init.headers || {} });
    if (init.method === "HEAD") return new Response(null, { status: 200 });
    if (url.pathname === "/robots.txt") return new Response("User-agent: *\nAllow: /", { status: 200 });
    if (url.pathname === "/llms.txt") return new Response("nf", { status: 404 });
    return new Response(fixtureHtml, { status: 200, headers: { "content-type": "text/html" } });
  };
}

/* ------------------------------ 1. fresh=1 ------------------------------ */
{
  stubSiteFetch();
  assert.equal(AEO_CACHE_TTL_SECONDS, 600, "public cache is ten minutes");
  assert.deepEqual({ ...AEO_FRESH_RATE_LIMIT }, { limit: 1, windowSeconds: 60 });
  const kv = new MemoryKv();
  const env = { WEBMCP_KV: kv };
  const tasks = [];
  const ctx = { waitUntil(t) { tasks.push(t); } };
  const get = async (qs, ip = "198.51.100.1") => {
    const res = await handleApi(new Request(`https://w.test/api/aeo/score?${qs}`, { headers: { "cf-connecting-ip": ip } }), env, ctx);
    await Promise.all(tasks);
    return res;
  };
  const first = await get("url=https%3A%2F%2Fshop.example%2F");
  assert.equal(first.headers.get("x-aeo-cache"), "miss");
  assert.equal(first.headers.get("cache-control"), "public, max-age=600");
  const hit = await get("url=https%3A%2F%2Fshop.example%2F");
  assert.equal(hit.headers.get("x-aeo-cache"), "hit", "an ordinary re-check is served from KV");

  pageFetches.length = 0;
  const fresh = await get("url=https%3A%2F%2Fshop.example%2F&fresh=1");
  assert.equal(fresh.status, 200);
  assert.equal(fresh.headers.get("x-aeo-cache"), "bypass", "fresh=1 skips KV");
  assert.equal(fresh.headers.get("cache-control"), "no-store", "and is never edge/browser cached");
  assert.ok(pageFetches.length > 0, "the page was really fetched again");
  const pageFetch = pageFetches.find((f) => f.url === "https://shop.example/");
  assert.equal(pageFetch.headers["cache-control"], "no-cache", "and the site's own cache is asked for a current copy");

  const again = await get("url=https%3A%2F%2Fshop.example%2Fother&fresh=1", "203.0.113.9");
  assert.equal(again.status, 429, "a second fresh scan of the same host inside a minute is refused, whoever asks");
  assert.deepEqual(await again.json(), { error: "rate_limited", scope: "fresh_host" });
  assert.equal(again.headers.get("retry-after"), "60");
  const otherHost = await get("url=https%3A%2F%2Fother.example%2F&fresh=1");
  assert.equal(otherHost.status, 200, "the limit is per host");
  const plain = await get("url=https%3A%2F%2Fshop.example%2F");
  assert.equal(plain.status, 200, "ordinary checks are not affected by the fresh limit");
  const badFresh = await get("url=nope&fresh=1");
  assert.equal(badFresh.status, 400, "an invalid URL is still a 400 with fresh=1");

  // /api/sites/:id/aeo-score?fresh=1 - the plugin's endpoint.
  const statements = [];
  const DB = {
    prepare(sql) {
      const first = async () => {
        if (sql.includes("FROM sites WHERE site_key")) return { id: "s1", plan: "free", status: "active", delivery_status: "active" };
        if (sql.includes("FROM sites WHERE id")) return { id: "s1", url: "https://wp.example", website_uri: null, slug: null };
        if (sql.includes("FROM aeo_rulesets")) return INITIAL_AEO_RULESET;
        return null;
      };
      return { bind() { return { first, async all() { return { results: [] }; }, async run() { statements.push(sql); return { success: true }; } }; }, first };
    },
  };
  const siteEnv = { DB, WEBMCP_KV: new MemoryKv() };
  const siteGet = (qs) => handleApi(new Request(`https://w.test/api/sites/s1/aeo-score?site_key=nrv_k${qs}`), siteEnv, ctx);
  pageFetches.length = 0;
  const s1 = await siteGet("&fresh=1");
  assert.equal(s1.status, 200);
  assert.equal(s1.headers.get("x-aeo-cache"), "bypass");
  assert.equal(pageFetches.find((f) => f.url === "https://wp.example/").headers["cache-control"], "no-cache");
  assert.equal((await siteGet("&fresh=1")).status, 429, "site endpoint shares the per-host fresh limit");
  assert.equal((await siteGet("")).status, 200, "without fresh it is unlimited as before");
}

/* --------------------------- 2. tag/config stopped --------------------------- */
{
  const makeEnv = (row) => ({
    DB: {
      prepare(sql) {
        const first = async () => {
          if (sql.includes("FROM sites WHERE site_key")) return row;
          if (sql.includes("SELECT delivery_status FROM sites")) return row ? { delivery_status: row.delivery_status } : null;
          return null;
        };
        return { bind() { return { first, async all() { return { results: [] }; }, async run() { throw new Error(`no write expected: ${sql}`); } }; }, first };
      },
    },
  });
  const res = await handleApi(new Request("https://w.test/api/tag/config?k=nrv_stopped"), makeEnv({ id: "s1", plan: "free", manual_plan: null, status: "active", delivery_status: "stopped" }), {});
  assert.equal(res.status, 200, "a known key whose delivery stopped gets 200");
  assert.deepEqual(await res.json(), { ok: true, plan: "free", delivery: "stopped", ruleset_version: INITIAL_AEO_RULESET.version, jsonld: null, autofix: null });
  assert.equal(res.headers.get("x-aeo-ruleset-version"), String(INITIAL_AEO_RULESET.version));
  // Even when billing had last granted a paid plan, a stopped site is free.
  const paid = await handleApi(new Request("https://w.test/api/tag/config?k=nrv_stopped"), makeEnv({ id: "s1", plan: "pro", manual_plan: null, status: "active", delivery_status: "stopped" }), {});
  assert.equal((await paid.json()).plan, "free");
  const unknown = await handleApi(new Request("https://w.test/api/tag/config?k=nrv_nobody"), makeEnv(null), {});
  assert.equal(unknown.status, 404, "an unknown key still gets 404");
  const missing = await handleApi(new Request("https://w.test/api/tag/config"), makeEnv(null), {});
  assert.equal(missing.status, 404);
}

/* -------------------- 3 & 4. live subscriptions: delete, link -------------------- */
assert.equal(hasLiveSubscription({ stripe_subscription_id: "sub_1", contract: "active" }), true);
assert.equal(hasLiveSubscription({ stripe_subscription_id: "sub_1", contract: "past_due" }), true);
assert.equal(hasLiveSubscription({ stripe_subscription_id: "sub_1", contract: null }), true);
for (const contract of ["cancelled", "canceled", "stopped", "Cancelled"]) assert.equal(hasLiveSubscription({ stripe_subscription_id: "sub_1", contract }), false);
assert.equal(hasLiveSubscription({ stripe_subscription_id: null, contract: "active" }), false);
assert.equal(hasLiveSubscription({ stripe_subscription_id: "  ", contract: "active" }), false);
{
  const makeEnv = (site) => {
    const batches = [];
    const stripeCalls = [];
    const row = { id: "site1", org_id: "org1", site_key: "nrv_k", channel: "direct", url: "example.com", contract: null, stripe_subscription_id: null, ...site };
    const DB = {
      prepare(sql) {
        const first = async (...values) => {
          if (/FROM sessions/.test(sql)) return { member_id: "m1", org_id: "org1", email: "o@x.test", role: "admin", status: "active", expires_at: Date.now() + 3.6e6 };
          if (/FROM sites/.test(sql)) return values.includes(row.id) || values.includes(row.site_key) ? { ...row } : null;
          return null;
        };
        return { bind(...values) { return { sql, first: () => first(...values), async all() { return { results: [] }; }, async run() { return { success: true }; } }; } };
      },
      async batch(statements) { batches.push(statements.map((s) => s.sql)); return []; },
    };
    globalThis.fetch = async (url, init) => {
      stripeCalls.push({ url: String(url), form: Object.fromEntries(new URLSearchParams(String(init?.body || ""))) });
      return Response.json({ url: "https://buy.stripe.test/link" });
    };
    return { env: { DB, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp", STRIPE_SECRET_KEY: "sk_test_x", STRIPE_PRICE_ID_STANDARD: "price_std" }, batches, stripeCalls };
  };
  const del = (env) => handleApi(new Request("https://w.test/api/sites/site1", { method: "DELETE", headers: SESSION_HEADERS }), env, {});
  let t = makeEnv({ stripe_subscription_id: "sub_live", contract: "active" });
  let res = await del(t.env);
  assert.equal(res.status, 409);
  assert.deepEqual(await res.json(), { error: "subscription_active", manage: "portal" });
  assert.equal(t.batches.length, 0, "nothing is deleted");
  t = makeEnv({ stripe_subscription_id: "sub_old", contract: "cancelled" });
  res = await del(t.env);
  assert.equal(res.status, 200, "a cancelled subscription does not block deletion");
  assert.equal(t.batches.length, 1);
  t = makeEnv({});
  assert.equal((await del(t.env)).status, 200, "a free site deletes as before");

  const link = (env) => handleApi(new Request("https://w.test/api/billing/payment-link", { method: "POST", headers: SESSION_HEADERS, body: JSON.stringify({ site_id: "site1" }) }), env, {});
  t = makeEnv({ stripe_subscription_id: "sub_live", contract: "trial" });
  res = await link(t.env);
  assert.equal(res.status, 409);
  assert.deepEqual(await res.json(), { error: "subscription_exists", plan: "standard", manage: "portal" });
  assert.equal(t.stripeCalls.length, 0, "Stripe is not called for a site already paying");
  t = makeEnv({});
  res = await link(t.env);
  assert.equal(res.status, 200);
  assert.equal(t.stripeCalls.length, 1);
  assert.equal(t.stripeCalls[0].form["restrictions[completed_sessions][limit]"], "1", "the link deactivates after one payment");
  t = makeEnv({ stripe_subscription_id: "sub_old", contract: "canceled" });
  assert.equal((await link(t.env)).status, 200, "a cancelled site may buy again");
}

/* ------------------------- 7. site creation validation ------------------------- */
{
  const makeEnv = (existing = []) => {
    const inserted = [];
    const DB = {
      prepare(sql) {
        const first = async () => /FROM sessions/.test(sql)
          ? { member_id: "m1", org_id: "org1", email: "o@x.test", role: "admin", status: "active", expires_at: Date.now() + 3.6e6 }
          : null;
        return {
          bind(...values) {
            return {
              first,
              async all() { return { results: /FROM sites WHERE org_id=\?/.test(sql) ? existing.filter((s) => s.org_id === values[0]) : [] }; },
              async run() { if (/INSERT INTO sites/.test(sql)) inserted.push(values); return { success: true }; },
            };
          },
          first, async all() { return { results: [] }; }, async run() { return { success: true }; },
        };
      },
    };
    return { env: { DB, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp" }, inserted };
  };
  const create = async (env, body) => {
    const res = await handleApi(new Request("https://w.test/api/sites", { method: "POST", headers: SESSION_HEADERS, body: JSON.stringify(body) }), env, { waitUntil() {} });
    return { status: res.status, body: await res.json() };
  };
  let t = makeEnv();
  let r = await create(t.env, { install_type: "wp", url: "example.com" });
  assert.equal(r.status, 200, "a bare domain is accepted");
  assert.equal(t.inserted[0][3], "example.com");
  for (const bad of ["not a url", "localhost", "intranet", "ftp://example.com", "javascript:alert(1)", "http://", "192.168.0.1", "exa mple.com"]) {
    t = makeEnv();
    r = await create(t.env, { install_type: "tag", url: bad });
    assert.equal(r.status, 400, `${bad} is refused`);
    assert.equal(r.body.error, "invalid_url");
    assert.equal(t.inserted.length, 0);
  }
  t = makeEnv([{ id: "old", org_id: "org1", url: "example.com", website_uri: null, domain_key: null }]);
  for (const spelling of ["https://www.Example.com/", "example.com", "http://example.com/shop"]) {
    r = await create(t.env, { install_type: "wp", url: spelling });
    assert.equal(r.status, 409, `${spelling} duplicates example.com`);
    assert.deepEqual(r.body, { error: "duplicate_site", site_id: "old", domain: "example.com" });
  }
  r = await create(t.env, { install_type: "wp", url: "shop.example.com" });
  assert.equal(r.status, 200, "a subdomain is a different site");
  t = makeEnv([{ id: "theirs", org_id: "org2", url: "example.com" }]);
  assert.equal((await create(t.env, { install_type: "wp", url: "example.com" })).status, 200, "another org's site is not a duplicate");
  t = makeEnv([{ id: "old", org_id: "org1", url: null, website_uri: "https://dup.example/", domain_key: null }]);
  assert.equal((await create(t.env, { install_type: "tag", url: "dup.example" })).status, 409, "website_uri counts");
  t = makeEnv();
  assert.equal((await create(t.env, { install_type: "hosted", name: "Cafe" })).status, 200, "hosted needs no URL");
  t = makeEnv();
  assert.equal((await create(t.env, { install_type: "tag" })).body.error, "url required");
}

/* ----------------------------- 5. safeAuthNext ----------------------------- */
assert.equal(safeAuthNext("/dashboard?plan=standard"), "/dashboard?plan=standard");
assert.equal(safeAuthNext(null, "pro"), "/dashboard?plan=pro");
assert.equal(safeAuthNext("/dashboard", "PRO"), "/dashboard?plan=pro");
assert.equal(safeAuthNext("/dashboard?plan=enterprise"), null, "unknown plans are dropped");
assert.equal(safeAuthNext("/dashboard"), null, "the default needs no storing");
assert.equal(safeAuthNext("/dashboard/sites?plan=pro&x=<script>"), "/dashboard/sites?plan=pro", "other params are dropped");
for (const evil of ["https://evil.example/dashboard?plan=pro", "//evil.example/dashboard", "/\\evil.example", "javascript:alert(1)", "/admin?plan=pro", "/dashboard/../admin"]) {
  const out = safeAuthNext(evil);
  assert.ok(out === null || /^\/dashboard(\/[A-Za-z0-9_-]+)*\/?(\?plan=(standard|pro))?$/.test(out), `${evil} -> ${out}`);
}
assert.equal(safeAuthNext("https://evil.example/", "standard"), "/dashboard?plan=standard", "an off-site next keeps only the plan");
assert.match(renderMagicConfirmPage({ locale: "en", action: "/api/auth/callback", token: "a".repeat(64), confirm: "b".repeat(64) }), /lang="en".*Sign in to Nurevo.*method="post"/s);
assert.doesNotMatch(renderMagicConfirmPage({ locale: "ja", action: "/x\"><script>", token: "t", confirm: "c" }), /<script>/, "attributes are escaped");

/* -------------------- 5, 6, 8, 9. magic links against real SQL -------------------- */
{
  const sqlite = new DatabaseSync(":memory:");
  const dbDir = new URL("../nurevo-impl/db/", import.meta.url);
  sqlite.exec(readFileSync(new URL("schema.sql", dbDir), "utf8"));
  sqlite.exec("ALTER TABLE sites ADD COLUMN manual_plan TEXT");
  sqlite.exec(readFileSync(new URL("0029_member_email_preferences.sql", dbDir), "utf8"));
  sqlite.exec(readFileSync(new URL("0030_account_referrals.sql", dbDir), "utf8"));
  sqlite.exec(readFileSync(new URL("0037_magic_link_intent.sql", dbDir), "utf8"));
  const DB = {
    prepare(sql) {
      const stmt = sqlite.prepare(sql);
      return { values: [], bind(...values) { return Object.assign(Object.create(this), { values }); },
        async first() { return stmt.get(...this.values) || null; },
        async all() { return { results: stmt.all(...this.values) }; },
        runSync() { const r = stmt.run(...this.values); return { meta: { changes: Number(r.changes) } }; },
        async run() { return this.runSync(); } };
    },
    async batch(statements) { sqlite.exec("BEGIN"); try { const r = statements.map((s) => s.runSync()); sqlite.exec("COMMIT"); return r; } catch (e) { sqlite.exec("ROLLBACK"); throw e; } },
  };
  const env = { DB, DEV: "1", RESEND_API_KEY: "test-only", MAIL_FROM: "test@example.test" };
  globalThis.fetch = async (url) => {
    assert.ok(String(url).startsWith("https://api.resend.com/"), `unexpected fetch ${url}`);
    return Response.json({ id: "test" });
  };
  let ip = 0;
  const request = async (path, body, extraHeaders = {}) => handleApi(new Request(`https://nurevo.jp${path}`, {
    method: "POST", headers: { "content-type": "application/json", "cf-connecting-ip": `ip-${++ip}`, ...extraHeaders }, body: JSON.stringify(body),
  }), env, {});
  const linkFor = async (path, body, headers) => { const res = await request(path, body, headers); assert.equal(res.status, 200, await res.clone().text()); return (await res.json()).loginLink; };
  const open = (link) => handleApi(new Request(link, { headers: { "cf-connecting-ip": `ip-${++ip}` } }), env, {});
  const confirmParts = async (page) => {
    const html = await page.text();
    return {
      html,
      token: html.match(/name="token" value="([a-f0-9]{64})"/)[1],
      confirm: html.match(/name="confirm" value="([a-f0-9]{64})"/)[1],
      cookie: page.headers.get("set-cookie").match(/nrv_magic_confirm=[^;]+/)[0],
    };
  };
  const post = (link, { token, confirm, cookie }, headers = { origin: "https://nurevo.jp" }) => handleApi(new Request(new URL(link).origin + new URL(link).pathname, {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", "cf-connecting-ip": `ip-${++ip}`, ...(cookie ? { cookie } : {}), ...headers },
    body: new URLSearchParams({ token, confirm }).toString(),
  }), env, {});
  const reasonOf = (res) => new URL(res.headers.get("location")).searchParams.get("reason");

  // The dashboard flow, carrying the LP's plan.
  const link = await linkFor("/api/auth/request", { email: "owner@example.test", locale: "en", next: "/dashboard?plan=pro" });
  assert.match(link, /\/api\/auth\/callback\?token=/);
  assert.equal(sqlite.prepare("SELECT plan FROM orgs o JOIN members m ON m.org_id=o.id WHERE m.email=?").get("owner@example.test").plan, "free", "a new org is created free");
  const stored = sqlite.prepare("SELECT next_path,locale FROM sessions WHERE kind='magic'").get();
  assert.deepEqual({ ...stored }, { next_path: "/dashboard?plan=pro", locale: "en" });

  // A scanner's GET (twice, even) consumes nothing.
  const scanned = await open(link);
  assert.equal(scanned.status, 200);
  assert.equal(scanned.headers.get("cache-control"), "no-store");
  // Not "no-referrer": with it the browser sends "Origin: null" on the form's
  // POST and the Worker's origin allowlist refuses it, so nobody can sign in
  // (production incident 2026-10-23). "same-origin" still keeps the token in
  // the URL from leaking to other sites.
  assert.equal(scanned.headers.get("referrer-policy"), "same-origin");
  assert.equal(scanned.headers.get("set-cookie").includes("nrv_session"), false, "GET never signs in");
  await open(link);
  assert.equal(sqlite.prepare("SELECT kind FROM sessions WHERE next_path IS NOT NULL").get().kind, "magic", "the token survives GETs");
  const page = await open(link);
  const parts = await confirmParts(page);
  assert.match(parts.html, /lang="en"/, "the page speaks the email's language");
  assert.match(parts.html, /<form method="post" action="\/api\/auth\/callback">/);

  // Login CSRF: no confirm cookie, wrong cookie, or a cross-site POST.
  let res = await post(link, { ...parts, cookie: null });
  assert.equal(res.status, 303); assert.equal(reasonOf(res), "invalid");
  res = await post(link, { ...parts, cookie: `nrv_magic_confirm=${"0".repeat(64)}` });
  assert.equal(reasonOf(res), "invalid");
  res = await post(link, parts, { origin: "https://evil.example" });
  assert.equal(reasonOf(res), "invalid");
  res = await post(link, parts, { origin: "https://nurevo.jp", "sec-fetch-site": "cross-site" });
  assert.equal(reasonOf(res), "invalid");
  assert.equal(sqlite.prepare("SELECT kind FROM sessions WHERE next_path IS NOT NULL").get().kind, "magic", "refused POSTs consume nothing");

  // Through the real Worker entry point (not handleApi alone, which skipped the
  // global origin gate and hid the incident): the Origin a browser sends for
  // this page's policy must pass, and "null" - what no-referrer produced - is
  // what the gate refuses.
  {
    const worker = (await import("../worker/index.mjs")).default;
    const gateEnv = { ...env, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp,https://www.nurevo.jp" };
    const browserOrigin = (policy, pageOrigin) => (policy === "no-referrer" ? "null" : pageOrigin);
    const sent = browserOrigin(scanned.headers.get("referrer-policy"), new URL(link).origin.replace(/^https?:\/\/[^/]+/, "https://nurevo.jp"));
    const through = await worker.fetch(new Request("https://nurevo.jp/api/auth/callback", {
      method: "POST", headers: { origin: sent, "content-type": "application/x-www-form-urlencoded" }, body: "token=x&confirm=y",
    }), gateEnv, { waitUntil() {} });
    const body = await through.clone().text();
    assert.ok(!/origin_not_allowed/.test(body), `the sign-in POST passes the origin gate (Origin: ${sent})`);
    const refused = await worker.fetch(new Request("https://nurevo.jp/api/auth/callback", {
      method: "POST", headers: { origin: "null", "content-type": "application/x-www-form-urlencoded" }, body: "token=x&confirm=y",
    }), gateEnv, { waitUntil() {} });
    assert.match(await refused.text(), /origin_not_allowed/, "an Origin: null POST is what the gate refuses");
  }

  // The person's click.
  res = await post(link, parts);
  assert.equal(res.status, 303);
  assert.equal(res.headers.get("location"), "/dashboard?plan=pro", "the plan survives sign-in");
  assert.match(res.headers.get("set-cookie"), /nrv_session=/);
  assert.match(res.headers.get("set-cookie"), /nrv_magic_confirm=;/, "the confirm cookie is cleared");
  // Second use, by GET or POST, says "used".
  const reopened = await open(link);
  assert.equal(reopened.status, 303); assert.equal(reasonOf(reopened), "used");
  assert.equal(new URL(reopened.headers.get("location")).searchParams.get("lang"), "en");
  assert.equal(reasonOf(await post(link, parts)), "used");

  // Expired.
  const expiredLink = await linkFor("/api/auth/request", { email: "late@example.test", locale: "ja" });
  sqlite.prepare("UPDATE sessions SET expires_at=? WHERE member_id=(SELECT id FROM members WHERE email=?)").run(Date.now() - 1, "late@example.test");
  const expired = await open(expiredLink);
  assert.equal(reasonOf(expired), "expired");
  assert.match(expired.headers.get("location"), /\/auth-error\.html\?lang=ja&reason=expired$/);

  // Invalid.
  assert.equal(reasonOf(await open("https://nurevo.jp/api/auth/callback?token=" + "f".repeat(64))), "invalid");
  assert.equal(reasonOf(await open("https://nurevo.jp/api/auth/callback?token=short")), "invalid");

  // Pending approval: refused at request time, and a link issued before the
  // member was put under review says so too.
  const pendingLink = await linkFor("/api/auth/request", { email: "partner@example.test" });
  sqlite.prepare("UPDATE members SET status='pending' WHERE email=?").run("partner@example.test");
  assert.equal(reasonOf(await open(pendingLink)), "pending");
  res = await request("/api/auth/request", { email: "partner@example.test" });
  assert.equal(res.status, 403);
  assert.deepEqual(await res.json(), { error: "pending_approval" });

  // Error codes the dashboard maps.
  res = await request("/api/auth/request", { email: "nope" });
  assert.equal(res.status, 400); assert.deepEqual(await res.json(), { error: "invalid_email" });
  res = await request("/api/auth/signup", { email: "x".repeat(250) + "@a.io" });
  assert.equal((await res.json()).error, "invalid_email");
  for (let n = 0; n < 10; n++) await request("/api/auth/request", { email: `burst${n}@example.test` }, { "cf-connecting-ip": "one-ip" });
  res = await request("/api/auth/request", { email: "burst-final@example.test" }, { "cf-connecting-ip": "one-ip" });
  assert.equal(res.status, 429); assert.deepEqual(await res.json(), { error: "rate_limited" });

  // The account flow (/api/auth/signup -> /api/auth/verify) carries plan too.
  const signupLink = await linkFor("/api/auth/signup", { email: "new@example.test", locale: "ja", plan: "standard" });
  assert.match(signupLink, /\/api\/auth\/verify\?token=/);
  const signupPage = await open(signupLink);
  assert.equal(signupPage.status, 200);
  const signupParts = await confirmParts(signupPage);
  assert.match(signupParts.html, /lang="ja"/);
  res = await post(signupLink, signupParts);
  assert.equal(res.headers.get("location"), "/dashboard?plan=standard");
  assert.equal(reasonOf(await open(signupLink)), "used");
  // An off-site next is never followed.
  const evilLink = await linkFor("/api/auth/signup", { email: "evil@example.test", next: "https://evil.example/" });
  res = await post(evilLink, await confirmParts(await open(evilLink)));
  assert.equal(res.headers.get("location"), "/dashboard");
  sqlite.close();
}

/* ------------------------- public/auth-error.html reasons ------------------------- */
{
  const html = readFileSync(new URL("../public/auth-error.html", import.meta.url), "utf8");
  for (const reason of ["used", "pending", "invalid"]) assert.ok(html.includes(`${reason}:[`), `auth-error.html words ${reason}`);
  assert.match(html, /q\.get\('reason'\)/);
}

globalThis.fetch = originalFetch;
console.log("onboarding backend tests passed (fresh scans, stopped config, live-subscription guards, single-use links, site validation, magic-link confirm/intent/reasons, auth codes)");
