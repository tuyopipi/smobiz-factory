/**
 * Agency lead-generation tools (worker/agency-leadgen.mjs, migration 0047,
 * public/dashboard-agency-leadgen.js).
 *
 * Real SQLite with the real schema and migrations. Every network call is a
 * fake: the scored "customer site" is a stub page, the email provider is a
 * stub, and anything else (a paid AI engine above all) fails the test.
 * Covers:
 *   1. validation: language, origins, slugs (format, reserved), settings,
 *      the visitor's URL, name, email and consent; widget keys; form tokens
 *      (valid, too fast, expired, forged, for another widget, no secret)
 *   2. dashboard endpoints: auth, CSRF, viewer, not-approved partner, branding
 *      required, origins, slug format / reserved / uniqueness across agencies,
 *      key rotation, referral code issued on enable, embed code
 *   3. the frame: unknown / disabled key, frame-ancestors from the allowed
 *      origins, Referer from another site refused, escaping, nonce CSP, no
 *      third-party script, eight languages
 *   4. the submit: own origin only, honeypot, timing, consent required, input
 *      validation, rate limits per IP and per widget key, single-use form,
 *      only the on-site score (no paid AI call), result with the agency CTA,
 *      lead stored with its consent text, email to the agency (Reply-To the
 *      lead, no addresses in logs)
 *   5. leads: isolation between agencies, list, delete, CSV escaping
 *      including formula injection
 *   6. attribution: the signup links carry the referral code, and a signup
 *      through one is credited to the agency
 *   7. the landing page: brand, escaping, meta, index by default / noindex,
 *      languages and fallback, revoked partner, unknown slug
 *   8. before 0047: every endpoint degrades, nothing fails
 *   9. wiring: routes, test:canary, the dashboard slot and script, loader JS
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  LEADGEN_LIMITS, LEADGEN_LANGS, MAX_FORM_AGE_MS, MIN_FILL_MS, RESERVED_SLUGS, consentText, csvCell, embedSnippets, frameAncestors,
  issueFormToken, isWidgetKey, leadgenLang, leadgenRateLimit, leadsCsv, newWidgetKey, normalizeLeadUrl, normalizeOrigin, renderLandingHtml,
  signupUrl, slugProblem, textOn, validateLead, validateLeadgenSettings, verifyFormToken, widgetLoaderJs,
} from "../worker/agency-leadgen.mjs";
import { LEADGEN_COPY } from "../worker/agency-leadgen-i18n.mjs";
import { handleApi } from "../worker/api.mjs";
import { INITIAL_AEO_RULESET } from "../worker/aeo-rules.mjs";

const sql = (file) => readFileSync(new URL(`../nurevo-impl/db/${file}`, import.meta.url), "utf8");
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const sha = (v) => createHash("sha256").update(v).digest("hex");
const CSRF = "c".repeat(64);
const ORIGIN = "https://nurevo.jp";
const lines = [];
const quiet = async (fn) => {
  const saved = [console.log, console.warn, console.error];
  console.log = console.warn = console.error = (...args) => lines.push(args.join(" "));
  try { return await fn(); } finally { [console.log, console.warn, console.error] = saved; }
};

/* ---------------- the network: a stub customer site and a stub mail provider ---------------- */

const SITE_HTML = `<!doctype html><html><head><title>Cafe</title></head><body><h1>Cafe Sakura</h1><p>We are a small cafe serving coffee and cake every day from nine to six near the station.</p></body></html>`;
const fetched = [];
const mail = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === "string" ? input : input.url);
  fetched.push(url.href);
  if (url.hostname === "api.resend.com") { mail.push(JSON.parse(init.body)); return Response.json({ id: "test" }); }
  if (url.hostname === "cafe-sakura.com" || url.hostname === "www.cafe-sakura.com") {
    if (init.method === "HEAD") return new Response(null, { status: 200 });
    if (url.pathname === "/robots.txt") return new Response("User-agent: *\nAllow: /", { status: 200 });
    if (url.pathname === "/llms.txt") return new Response("not found", { status: 404 });
    return new Response(SITE_HTML, { status: 200, headers: { "content-type": "text/html" } });
  }
  if (url.hostname === "down-site.com") return new Response("err", { status: 503 });
  throw new Error(`unexpected network call: ${url.href}`);
};
class MemoryKv {
  constructor() { this.values = new Map(); }
  async get(key, type) { const v = this.values.get(key) ?? null; return type === "json" && v ? JSON.parse(v) : v; }
  async put(key, value) { this.values.set(key, value); }
}

/* ---------------- a database ---------------- */

function makeDb({ migrated = true } = {}) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(sql("schema.sql"));
  for (const stmt of ["ALTER TABLE sites ADD COLUMN manual_plan TEXT", "ALTER TABLE orgs ADD COLUMN manual_plan TEXT"]) { try { sqlite.exec(stmt); } catch { /* there */ } }
  sqlite.exec(sql("0029_member_email_preferences.sql"));
  sqlite.exec(sql("0030_account_referrals.sql"));
  sqlite.exec(sql("0040_partner_approval_first_customer.sql"));
  sqlite.exec(sql("0046_agency_branding.sql"));
  if (migrated) sqlite.exec(sql("0047_agency_leadgen.sql")); // idempotent on top of schema.sql
  else for (const t of ["agency_leads", "agency_leadgen"]) sqlite.exec(`DROP TABLE ${t}`);
  // schema.sql seeds the pre-scoring ruleset; production runs the current one.
  sqlite.prepare("UPDATE aeo_rulesets SET definition_json=? WHERE active=1").run(JSON.stringify(INITIAL_AEO_RULESET.definition));
  const later = Date.now() + 3.6e6;
  sqlite.exec(`INSERT INTO orgs(id) VALUES('o1'); INSERT INTO orgs(id) VALUES('o2'); INSERT INTO orgs(id) VALUES('o3');
    INSERT INTO members(id,org_id,email,role,status,created_at) VALUES('m1','o1','agency@acme-digital.com','admin','active',1);
    INSERT INTO members(id,org_id,email,role,status,created_at) VALUES('m2','o1','viewer@acme-digital.com','viewer','active',2);
    INSERT INTO members(id,org_id,email,role,status,created_at) VALUES('m3','o2','boss@other-agency.com','admin','active',3);
    INSERT INTO members(id,org_id,email,role,status,created_at) VALUES('m4','o3','new@not-partner.com','admin','active',4);
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("agency")}','m1','o1','session',${later});
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("viewer")}','m2','o1','session',${later});
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("other")}','m3','o2','session',${later});
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("newbie")}','m4','o3','session',${later});
    INSERT INTO accounts(member_id,email,created_at,partner_status,partner_approved_at) VALUES('m1','agency@acme-digital.com',1,'approved',10);
    INSERT INTO accounts(member_id,email,created_at,partner_status,partner_approved_at) VALUES('m2','viewer@acme-digital.com',2,'approved',10);
    INSERT INTO accounts(member_id,email,created_at,partner_status,partner_approved_at,referral_code) VALUES('m3','boss@other-agency.com',3,'approved',10,'OTHERCODE234');
    INSERT INTO accounts(member_id,email,created_at,partner_status) VALUES('m4','new@not-partner.com',4,'none');`);
  const DB = {
    prepare(text) {
      const wrap = (args) => ({
        async first() { return sqlite.prepare(text).get(...args) || null; },
        async all() { return { results: sqlite.prepare(text).all(...args) }; },
        async run() { const r = sqlite.prepare(text).run(...args); return { meta: { changes: Number(r.changes) } }; },
        runSync() { const r = sqlite.prepare(text).run(...args); return { meta: { changes: Number(r.changes) } }; },
      });
      return { ...wrap([]), bind: (...args) => wrap(args) };
    },
    async batch(statements) { sqlite.exec("BEGIN"); try { const out = statements.map((s) => s.runSync()); sqlite.exec("COMMIT"); return out; } catch (e) { sqlite.exec("ROLLBACK"); throw e; } },
  };
  return { sqlite, DB };
}
function makeEnv(options = {}, extra = {}) {
  const { sqlite, DB } = makeDb(options);
  return { sqlite, env: { DB, WEBMCP_KV: new MemoryKv(), WEBMCP_ALLOWED_ORIGINS: ORIGIN, RESEND_API_KEY: "re_test", MAIL_FROM: "Nurevo <hello@nurevo.jp>", LEADGEN_FORM_SECRET: "form-secret-test", ...extra } };
}
const accountId = (sqlite, member) => sqlite.prepare("SELECT id FROM accounts WHERE member_id=?").get(member).id;

let ipSeq = 0;
const call = (env, method, path, { token = "agency", csrf = true, body, headers = {}, raw = false } = {}) => quiet(() => handleApi(new Request(`${ORIGIN}${path}`, {
  method,
  headers: {
    ...(token ? { cookie: `nrv_session=${token}; nrv_csrf=${CSRF}` } : {}),
    origin: ORIGIN,
    "cf-connecting-ip": `198.51.100.${(ipSeq++ % 250) + 1}`,
    ...(csrf && method !== "GET" ? { "x-csrf-token": CSRF } : {}),
    ...(body !== undefined ? { "content-type": "application/json" } : {}),
    ...headers,
  },
  ...(body !== undefined ? { body: raw ? body : JSON.stringify(body) } : {}),
}), env, {}));
const get = (env, path, headers = {}) => quiet(() => handleApi(new Request(`${ORIGIN}${path}`, { headers: { "cf-connecting-ip": "203.0.113.9", ...headers } }), env, {}));

// The agency's privacy policy: the widget cannot be switched on without one.
const PRIVACY = "https://acme-digital.com/privacy";
const BRAND = { display_name: "Acme <Digital> & Co", brand_color: "#0a7d5a", contact_email: "hello@acme-digital.com", contact_url: "https://acme-digital.com/contact", footer_text: "Acme Digital Ltd.\nTokyo" };

/* ---------------- 1. validation ---------------- */
{
  assert.equal(leadgenLang("ja"), "ja");
  assert.equal(leadgenLang("zh_TW"), "tw");
  assert.equal(leadgenLang("zh-HK"), "tw");
  assert.equal(leadgenLang("zh-CN"), "zh");
  assert.equal(leadgenLang("de-AT"), "de");
  assert.equal(leadgenLang("pt_BR"), "en", "a language we do not write falls back to English");
  assert.equal(leadgenLang("", "fr-CA,fr;q=0.9"), "fr");
  assert.equal(leadgenLang(null, "it-IT,it"), "en");
  assert.deepEqual(LEADGEN_LANGS, ["ja", "en", "zh", "tw", "ko", "es", "fr", "de"]);
  for (const lang of LEADGEN_LANGS) {
    assert.deepEqual(Object.keys(LEADGEN_COPY[lang]).sort(), Object.keys(LEADGEN_COPY.en).sort(), `${lang}: every string`);
    for (const [k, v] of Object.entries(LEADGEN_COPY[lang])) {
      const ph = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join();
      assert.equal(ph(v), ph(LEADGEN_COPY.en[k]), `${lang}.${k} placeholders`);
      assert.ok(String(v).trim(), `${lang}.${k} not empty`);
    }
  }

  assert.equal(normalizeOrigin("https://www.Acme-Digital.com/contact?x=1"), "https://www.acme-digital.com");
  assert.equal(normalizeOrigin("acme-digital.com"), "https://acme-digital.com");
  assert.equal(normalizeOrigin("https://acme-digital.com:8443"), "https://acme-digital.com:8443");
  for (const bad of ["http://acme-digital.com", "*", "https://*.acme.com", "javascript:alert(1)", "https://user:pw@acme.com", "https://localhost", "https://10.0.0.1", "https://a.com; script-src *", "https://a.com'"]) {
    assert.equal(normalizeOrigin(bad), null, `origin refused: ${bad}`);
  }
  assert.equal(frameAncestors(["https://a-agency.com", "bogus value;", "https://b-agency.com"]), "'self' https://a-agency.com https://b-agency.com");

  assert.equal(slugProblem("acme-digital"), null);
  assert.equal(slugProblem("a1b"), null);
  for (const bad of ["ab", "x".repeat(41), "Acme", "acme_digital", "-acme", "acme-", "ac--me", "acme digital", "acmé", "../x", "xn--abc"]) assert.ok(slugProblem(bad), `slug refused: ${bad}`);
  for (const word of ["admin", "api", "dashboard", "nurevo", "login", "support", "openai", "perplexity", "official", "nurevo-tokyo", "admin-team"]) assert.equal(slugProblem(word), "slug_reserved", `reserved: ${word}`);
  assert.ok(RESERVED_SLUGS.has("signup") && RESERVED_SLUGS.has("privacy"));

  assert.deepEqual(validateLeadgenSettings({ widget_enabled: true }).errors, ["privacy_url_required"], "no privacy policy, no widget");
  assert.deepEqual(validateLeadgenSettings({ widget_enabled: true, privacy_url: "http://acme.com/privacy" }).errors, ["privacy_url"], "https only");
  const ok = validateLeadgenSettings({ privacy_url: PRIVACY, widget_enabled: true, allowed_origins: "https://www.acme-digital.com\nacme-digital.com\nhttps://www.acme-digital.com/", notify_email: true, slug: " Acme-Digital ", landing_enabled: true, landing_intro: "Hi\r\n\r\n\r\n\r\nthere\u0007" });
  assert.equal(ok.ok, true, JSON.stringify(ok.errors));
  assert.deepEqual(ok.value.allowed_origins, ["https://www.acme-digital.com", "https://acme-digital.com"], "normalised and de-duplicated");
  assert.equal(ok.value.slug, "acme-digital", "lower-cased");
  assert.equal(ok.value.landing_intro, "Hi\n\nthere", "control characters removed, blank lines collapsed");
  assert.deepEqual(validateLeadgenSettings({ allowed_origins: ["http://acme.com", "https://ok.com"] }).invalid, ["http://acme.com"]);
  assert.deepEqual(validateLeadgenSettings({ allowed_origins: Array.from({ length: 11 }, (_, i) => `https://a${i}.com`) }).errors, ["allowed_origins_count"]);
  assert.deepEqual(validateLeadgenSettings({ landing_enabled: true }).errors, ["slug_required"]);
  assert.deepEqual(validateLeadgenSettings({ slug: "admin" }).errors, ["slug_reserved"]);
  assert.deepEqual(validateLeadgenSettings({ landing_intro: "x".repeat(501) }).errors, ["landing_intro"]);
  assert.equal(validateLeadgenSettings({ widget_enabled: "true" }).value.widget_enabled, false, "only a real true turns it on");

  assert.equal(normalizeLeadUrl("cafe-sakura.com/menu"), "https://cafe-sakura.com/menu");
  assert.equal(normalizeLeadUrl("http://cafe-sakura.com#x"), "http://cafe-sakura.com/");
  for (const bad of ["", "javascript:alert(1)", "ftp://cafe.com", "https://localhost/", "https://127.0.0.1/", "https://intranet/", "https://user:pw@cafe.com", "https://a.com/<script>", "data:text/html,x", "https://shop.test/", "x".repeat(501)]) {
    assert.equal(normalizeLeadUrl(bad), null, `lead URL refused: ${bad}`);
  }
  const lead = { site_url: "cafe-sakura.com", name: "  Hanako\r\nBcc: x  ", email: "Hanako@Cafe-Sakura.com", consent: true };
  assert.deepEqual(validateLead(lead), { ok: true, errors: [], value: { site_url: "https://cafe-sakura.com/", name: "Hanako Bcc: x", email: "hanako@cafe-sakura.com" } });
  assert.deepEqual(validateLead({ ...lead, consent: "true" }).errors, ["consent"], "consent must be exactly true");
  assert.deepEqual(validateLead({ ...lead, consent: undefined }).errors, ["consent"]);
  assert.deepEqual(validateLead({ ...lead, email: "nope", name: "", site_url: "x" }).errors, ["site_url", "name", "email"]);
  assert.deepEqual(validateLead({ ...lead, name: "n".repeat(101) }).errors, ["name"]);
  assert.match(consentText("en", "Acme", PRIVACY), /Acme may contact me.*controller \(privacy policy: https:\/\/acme-digital\.com\/privacy\).*Nurevo processes it on Acme's behalf as processor \(privacy policy: https:\/\/nurevo\.jp\/privacy\)/);
  assert.match(consentText("ja", "Acme", PRIVACY), /Acmeから連絡を受けることに同意.*管理者.*acme-digital\.com\/privacy.*Nurevoが.*nurevo\.jp\/privacy/);
  for (const l of LEADGEN_LANGS) {
    const text = consentText(l, "Acme", PRIVACY);
    assert.ok(text.includes(PRIVACY) && text.includes("https://nurevo.jp/privacy") && !/\{\w+\}/.test(text), `${l}: both policies named in the consent text`);
  }

  const keys = new Set(Array.from({ length: 500 }, newWidgetKey));
  assert.equal(keys.size, 500);
  for (const k of keys) assert.ok(isWidgetKey(k), k);
  assert.equal(isWidgetKey("ABCDEFGHJKMN"), false, "a referral code is not a widget key");

  const env = { LEADGEN_FORM_SECRET: "s" };
  const t0 = 1_800_000_000_000;
  const token = await issueFormToken(env, { key: "wk_" + "a".repeat(24), origin: "https://acme-digital.com", now: t0 });
  assert.equal((await verifyFormToken(env, token, { key: "wk_" + "a".repeat(24), now: t0 + 500 })).reason, "too_fast");
  const good = await verifyFormToken(env, token, { key: "wk_" + "a".repeat(24), now: t0 + MIN_FILL_MS });
  assert.equal(good.ok, true);
  assert.equal(good.origin, "https://acme-digital.com");
  assert.equal((await verifyFormToken(env, token, { key: "wk_" + "a".repeat(24), now: t0 + MAX_FORM_AGE_MS + 1 })).reason, "expired");
  assert.equal((await verifyFormToken(env, token, { key: "wk_" + "b".repeat(24), now: t0 + 5000 })).ok, false, "another widget's token");
  assert.equal((await verifyFormToken({ LEADGEN_FORM_SECRET: "other" }, token, { key: "wk_" + "a".repeat(24), now: t0 + 5000 })).ok, false, "another secret");
  const [payload, mac] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ k: "wk_" + "a".repeat(24), t: t0 - 60_000, n: "x", o: null, s: "widget" })).toString("base64url");
  assert.equal((await verifyFormToken(env, `${forged}.${mac}`, { key: "wk_" + "a".repeat(24), now: t0 + 5000 })).ok, false, "a changed time is caught");
  assert.equal((await verifyFormToken(env, `${payload}.${mac}x`, { key: "wk_" + "a".repeat(24), now: t0 + 5000 })).ok, false);
  assert.equal((await verifyFormToken(env, `${payload}.${mac}.x`, { key: "wk_" + "a".repeat(24), now: t0 + 5000 })).ok, false);
  assert.equal(await issueFormToken({}, { key: "wk_" + "a".repeat(24) }), null, "no secret, no token");
  assert.ok(await issueFormToken({ EMAIL_UNSUBSCRIBE_SECRET: "fallback" }, { key: "wk_" + "a".repeat(24) }), "falls back to the existing unsubscribe secret");

  assert.equal(csvCell("=HYPERLINK(\"http://x\")"), `"'=HYPERLINK(""http://x"")"`);
  for (const c of ["+1", "-1", "@SUM(A1)", "\tx", "\rx"]) assert.ok(csvCell(c).startsWith(`"'`), `formula prefix neutralised: ${JSON.stringify(c)}`);
  assert.equal(csvCell("a\"b,c\nd"), `"a""b,c\nd"`);
  assert.equal(csvCell(null), `""`);
  assert.equal(csvCell(42), `"42"`);

  assert.equal(textOn("#ffffff"), "#111111");
  assert.equal(textOn("#0a3d2a"), "#ffffff");
  assert.equal(textOn("javascript"), "#ffffff", "an invalid colour uses the default");
  console.log("PASS 1: validation, languages, origins, slugs, lead fields, consent, keys, form tokens, CSV cells");
}

/* ---------------- 2. dashboard endpoints ---------------- */
const { sqlite, env } = makeEnv();
const A = accountId(sqlite, "m1");
const B = accountId(sqlite, "m3");
let widgetKey;
{
  assert.equal((await call(env, "GET", "/api/agency/leadgen", { token: null })).status, 401);
  const first = await (await call(env, "GET", "/api/agency/leadgen")).json();
  assert.equal(first.available, true);
  assert.equal(first.approved, true);
  assert.equal(first.settings, null, "nothing saved yet");
  assert.equal(first.has_branding, false);

  const SETTINGS = { privacy_url: PRIVACY, widget_enabled: true, allowed_origins: "https://www.acme-digital.com\nhttps://acme-digital.com", notify_email: true, slug: "acme-digital", landing_enabled: true, landing_noindex: false, landing_intro: "We help <cafés> & shops." };
  let res = await call(env, "PUT", "/api/agency/leadgen", { body: SETTINGS });
  assert.equal(res.status, 400);
  assert.deepEqual((await res.json()).fields, ["branding"], "the tools show the agency's brand, so it comes first");
  assert.equal((await call(env, "PUT", "/api/agency/branding", { body: BRAND })).status, 200);

  assert.equal((await call(env, "PUT", "/api/agency/leadgen", { body: SETTINGS, csrf: false })).status, 403, "CSRF");
  assert.equal((await call(env, "PUT", "/api/agency/leadgen", { body: SETTINGS, token: "viewer" })).status, 403, "viewer");
  assert.equal((await call(env, "PUT", "/api/agency/leadgen", { body: SETTINGS, token: "newbie" })).status, 403, "not an approved partner");
  const newbie = await (await call(env, "GET", "/api/agency/leadgen", { token: "newbie" })).json();
  assert.equal(newbie.approved, false);
  assert.equal(newbie.can_edit, false);
  assert.equal(newbie.signup_url, null);

  res = await call(env, "PUT", "/api/agency/leadgen", { body: { ...SETTINGS, allowed_origins: "http://acme-digital.com\nhttps://ok-site.com" } });
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: "invalid_settings", fields: ["allowed_origins"], invalid: ["http://acme-digital.com"] });
  res = await call(env, "PUT", "/api/agency/leadgen", { body: { ...SETTINGS, slug: "dashboard" } });
  assert.deepEqual((await res.json()).fields, ["slug_reserved"]);
  res = await call(env, "PUT", "/api/agency/leadgen", { body: { ...SETTINGS, slug: "Bad Slug" } });
  assert.deepEqual((await res.json()).fields, ["slug_invalid"]);

  res = await call(env, "PUT", "/api/agency/leadgen", { body: SETTINGS });
  assert.equal(res.status, 200);
  const saved = await res.json();
  widgetKey = saved.settings.widget_key;
  assert.ok(isWidgetKey(widgetKey));
  assert.deepEqual(saved.settings.allowed_origins, ["https://www.acme-digital.com", "https://acme-digital.com"]);
  assert.equal(saved.settings.slug, "acme-digital");
  assert.equal(saved.landing_url, "https://nurevo.jp/p/acme-digital");
  assert.equal(saved.referral_code_active, true, "a referral code is issued when a tool is turned on");
  const code = sqlite.prepare("SELECT referral_code FROM accounts WHERE id=?").get(A).referral_code;
  assert.match(code, /^[A-Z2-9]{12}$/);
  assert.notEqual(code, widgetKey);
  assert.ok(saved.signup_url.includes(`referral_code=${code}`));
  assert.equal(saved.embed.script, `<script src="https://nurevo.jp/api/leadgen/widget.js" data-key="${widgetKey}" data-lang="en" async></script>`);
  assert.match(saved.embed.iframe, new RegExp(`src="https://nurevo.jp/api/leadgen/frame/${widgetKey}\\?lang=en"`));
  const jaEmbed = await (await call(env, "GET", "/api/agency/leadgen?lang=ja")).json();
  assert.match(jaEmbed.embed.script, /data-lang="ja"/);

  // Another agency cannot take the same address (any case), nor a reserved one.
  assert.equal((await call(env, "PUT", "/api/agency/branding", { token: "other", body: { ...BRAND, display_name: "Other Agency" } })).status, 200);
  res = await call(env, "PUT", "/api/agency/leadgen", { token: "other", body: { ...SETTINGS, slug: "ACME-DIGITAL" } });
  assert.equal(res.status, 409);
  assert.deepEqual((await res.json()).fields, ["slug_taken"]);
  res = await call(env, "PUT", "/api/agency/leadgen", { token: "other", body: { privacy_url: "https://other-agency.com/privacy", widget_enabled: true, allowed_origins: "https://other-agency.com", slug: "other-agency", landing_enabled: true } });
  assert.equal(res.status, 200);
  const otherKey = (await res.json()).settings.widget_key;
  assert.notEqual(otherKey, widgetKey, "one key per agency");
  // Saving again with the same slug is not a conflict with oneself.
  assert.equal((await call(env, "PUT", "/api/agency/leadgen", { body: SETTINGS })).status, 200);

  // Rotation: a new key, the old one dead.
  res = await call(env, "POST", "/api/agency/leadgen/rotate-key");
  assert.equal(res.status, 200);
  const rotated = (await res.json()).settings.widget_key;
  assert.ok(isWidgetKey(rotated) && rotated !== widgetKey);
  assert.equal((await get(env, `/api/leadgen/frame/${widgetKey}`)).status, 404, "the old key stops working at once");
  assert.equal((await call(env, "POST", "/api/agency/leadgen/rotate-key", { token: "viewer" })).status, 403);
  assert.equal((await call(env, "POST", "/api/agency/leadgen/rotate-key", { csrf: false })).status, 403);
  widgetKey = rotated;
  console.log("PASS 2: dashboard settings (auth, CSRF, viewer, approval, branding first, origins, slug format/reserved/unique, rotation, referral code, embed code)");
}

/* ---------------- 3. the frame ---------------- */
let frameToken;
{
  assert.equal((await get(env, "/api/leadgen/frame/wk_nope")).status, 404);
  assert.equal((await get(env, `/api/leadgen/frame/wk_${"z".repeat(24)}`)).status, 404);
  const res = await get(env, `/api/leadgen/frame/${widgetKey}?lang=ja`, { referer: "https://www.acme-digital.com/services/ai" });
  assert.equal(res.status, 200);
  const csp = res.headers.get("content-security-policy");
  assert.match(csp, /frame-ancestors 'self' https:\/\/www\.acme-digital\.com https:\/\/acme-digital\.com$/);
  const nonce = csp.match(/script-src 'nonce-([\w-]+)'/)[1];
  assert.match(csp, /default-src 'none'/);
  assert.match(csp, /connect-src 'self'/);
  assert.equal(res.headers.get("x-frame-options"), null, "frame-ancestors, not X-Frame-Options, decides");
  assert.equal(res.headers.get("cache-control"), "no-store");
  const html = await res.text();
  assert.ok(html.includes("Acme &lt;Digital&gt; &amp; Co"), "agency name escaped");
  assert.ok(!html.includes("Acme <Digital>"), "never raw");
  assert.ok(html.includes('<html lang="ja">'));
  assert.ok(html.includes(LEADGEN_COPY.ja.title));
  assert.ok(html.includes("Acme &lt;Digital&gt; &amp; Coから連絡を受けることに同意"), "consent names the agency");
  assert.ok(html.includes("https://nurevo.jp/privacy"), "privacy notice linked");
  assert.ok(html.includes('name="hp_comment"') && html.includes('tabindex="-1"'), "honeypot present and out of tab order");
  assert.ok(html.includes('src="https://nurevo.jp/api/agency/logo/') || !html.includes("<img"), "logo only from https / our own path");
  for (const tag of html.matchAll(/<script\b([^>]*)>/g)) assert.ok(/nonce="/.test(tag[1]) || /type="application\/json"/.test(tag[1]), `every script is nonce'd or data: ${tag[0]}`);
  assert.ok(!/<script[^>]+src=/.test(html), "no external script in the frame");
  assert.ok(html.includes(`nonce="${nonce}"`));
  const cfg = JSON.parse(html.match(/<script id="cfg" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(cfg.key, widgetKey);
  assert.equal(cfg.links.contact, "https://acme-digital.com/contact", "the CTA is the agency's contact");
  assert.match(cfg.links.plugin, /^https:\/\/nurevo\.jp\/p\/acme-digital\?lang=ja$/, "the plugin link goes through the agency's page");
  assert.ok(!/<\/script/i.test(html.match(/<script id="cfg"[^>]*>([\s\S]*?)<\/script>/)[1]), "the config JSON cannot close its element");
  assert.ok(cfg.copy.ask.includes("Acme <Digital> & Co"), "the CTA names the agency (set as text in the browser)");
  frameToken = cfg.token;
  assert.equal((await verifyFormToken(env, frameToken, { key: widgetKey, now: Date.now() + MIN_FILL_MS })).origin, "https://www.acme-digital.com", "the embedding origin rides in the token");

  // Another site embedding the frame (Referer) is refused outright.
  assert.equal((await get(env, `/api/leadgen/frame/${widgetKey}`, { referer: "https://evil-copycat.com/page" })).status, 403);
  // No Referer (a strict referrer policy): served, the browser enforces frame-ancestors.
  assert.equal((await get(env, `/api/leadgen/frame/${widgetKey}`)).status, 200);
  // Languages: eight, and English for the rest.
  for (const lang of LEADGEN_LANGS) {
    const page = await (await get(env, `/api/leadgen/frame/${widgetKey}?lang=${lang}`)).text();
    assert.ok(page.includes(LEADGEN_COPY[lang].submit.replace(/'/g, "&#39;")), `${lang}: submit button`);
    assert.ok(!/\{agency\}|\{score\}/.test(page.replace(/<script\b[\s\S]*?<\/script>/g, "")), `${lang}: no raw placeholder in the page`);
  }
  assert.ok((await (await get(env, `/api/leadgen/frame/${widgetKey}?lang=pt_BR`)).text()).includes(LEADGEN_COPY.en.submit));
  assert.ok((await (await get(env, `/api/leadgen/frame/${widgetKey}`, { "accept-language": "de-DE,de;q=0.9" })).text()).includes(LEADGEN_COPY.de.submit));

  // Without a form secret there is no token, so no form.
  assert.equal((await quiet(() => handleApi(new Request(`${ORIGIN}/api/leadgen/frame/${widgetKey}`), { ...env, LEADGEN_FORM_SECRET: "", EMAIL_UNSUBSCRIBE_SECRET: "" }, {}))).status, 503);
  console.log("PASS 3: frame (key checks, frame-ancestors, Referer, escaping, nonce CSP, no third-party script, agency CTA, 8 languages + fallback)");
}

/* ---------------- 4. the submit ---------------- */
const later = (ms = MIN_FILL_MS + 1000) => issueFormToken(env, { key: widgetKey, origin: "https://www.acme-digital.com", now: Date.now() - ms });
const submit = (body, { headers = {}, ip } = {}) => call(env, "POST", "/api/leadgen/submit", { token: null, csrf: false, body, headers: { ...(ip ? { "cf-connecting-ip": ip } : {}), ...headers } });
const LEAD = { site_url: "cafe-sakura.com", name: "Hanako Sato", email: "hanako@cafe-sakura.com", consent: true, hp_comment: "", lang: "en" };
{
  assert.equal((await submit({ ...LEAD, key: widgetKey, token: await later() }, { headers: { origin: "https://www.acme-digital.com" } })).status, 403, "not our frame");
  assert.equal((await submit({ ...LEAD, key: widgetKey, token: await later() }, { headers: { "sec-fetch-site": "cross-site" } })).status, 403);
  assert.equal((await call(env, "POST", "/api/leadgen/submit", { token: null, csrf: false, body: "{nope", raw: true })).status, 400);
  assert.equal((await submit({ ...LEAD, key: "wk_unknown", token: await later() })).status, 404);
  assert.equal((await submit({ ...LEAD, key: widgetKey, token: await later(), hp_comment: "http://spam.example" })).status, 422, "honeypot");
  assert.equal((await submit({ ...LEAD, key: widgetKey, token: await later(500) })).status, 422, "sent faster than a person can");
  assert.equal((await submit({ ...LEAD, key: widgetKey, token: await later(MAX_FORM_AGE_MS + 5000) })).status, 422, "expired form");
  assert.equal((await submit({ ...LEAD, key: widgetKey, token: "forged.token" })).status, 422, "forged token");
  let res = await submit({ ...LEAD, key: widgetKey, token: await later(), consent: false });
  assert.equal(res.status, 400);
  assert.deepEqual((await res.json()).fields, ["consent"], "consent is required");
  res = await submit({ ...LEAD, key: widgetKey, token: await later(), site_url: "https://127.0.0.1/admin", email: "bad" });
  assert.deepEqual((await res.json()).fields, ["site_url", "email"]);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM agency_leads").get().n, 0, "nothing stored for any refusal");
  assert.ok(lines.some((l) => l.includes("agency_lead_rejected") && l.includes("honeypot")));

  fetched.length = 0;
  mail.length = 0;
  // The contact address was verified (the flow itself: test-agency-leadgen-hardening.mjs);
  // until it is, new-lead emails go to the member's own sign-in address.
  sqlite.prepare("UPDATE agency_leadgen SET contact_verified_email='hello@acme-digital.com', contact_verified_at=1 WHERE account_id=?").run(A);
  const tok = await later();
  res = await submit({ ...LEAD, key: widgetKey, token: tok, lang: "ja" });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.ok(Number.isInteger(body.score) && body.score >= 0 && body.score <= 100);
  assert.ok(["green", "yellow", "red"].includes(body.band));
  assert.ok(body.issues.length > 0 && body.issues.length <= 3);
  assert.ok(body.issues.every((i) => typeof i.label === "string" && i.label));
  assert.ok(!JSON.stringify(body).includes("hanako@"), "the answer does not echo personal data");
  assert.ok(fetched.every((u) => /^https:\/\/(www\.)?cafe-sakura\.com\//.test(u) || u.startsWith("https://api.resend.com/")), `only the visitor's site (and the mail stub) were fetched: ${fetched.join(", ")}`);
  assert.ok(!fetched.some((u) => /perplexity|openai|anthropic|googleapis/.test(u)), "no paid AI engine call");
  const row = sqlite.prepare("SELECT * FROM agency_leads").get();
  assert.equal(row.account_id, A);
  assert.equal(row.site_url, "https://cafe-sakura.com/");
  assert.equal(row.email, "hanako@cafe-sakura.com");
  assert.equal(row.score, body.score);
  assert.equal(row.source, "widget");
  assert.equal(row.page_origin, "https://www.acme-digital.com");
  assert.equal(row.locale, "ja");
  assert.equal(row.consent_text, consentText("ja", "Acme <Digital> & Co", PRIVACY), "the exact consent text, with both privacy policies, stored as plain text");
  assert.ok(row.consent_at > 0 && row.created_at > 0);

  // Email to the agency: its contact address, Reply-To the lead, escaped HTML.
  assert.equal(mail.length, 1);
  assert.deepEqual(mail[0].to, ["hello@acme-digital.com"]);
  assert.equal(mail[0].reply_to, "hanako@cafe-sakura.com");
  assert.match(mail[0].subject, /cafe-sakura\.com/);
  assert.ok(mail[0].text.includes("Hanako Sato") && mail[0].text.includes(row.consent_text));
  assert.ok(mail[0].html.includes("Acme &lt;Digital&gt; &amp; Co") || mail[0].html.includes("&lt;Digital&gt;"));
  assert.ok(sqlite.prepare("SELECT notified_at FROM agency_leads WHERE id=?").get(row.id).notified_at > 0);
  assert.ok(!lines.some((l) => l.includes("hanako@") || l.includes("Hanako")), "no lead data in logs");

  // The same rendering of the form cannot be sent twice.
  assert.equal((await submit({ ...LEAD, key: widgetKey, token: tok })).status, 422, "single use");

  // An unreachable site still reaches the agency, without a score.
  res = await submit({ ...LEAD, key: widgetKey, token: await later(), site_url: "https://down-site.com/" });
  assert.equal(res.status, 200);
  const down = await res.json();
  assert.equal(down.score, null);
  assert.deepEqual(down.issues, []);

  // Per-IP limits. Invalid submissions never count against the lead limit...
  const ip = "192.0.2.77";
  let last;
  for (let i = 0; i <= LEADGEN_LIMITS.ip.limit + 1; i += 1) last = await submit({ ...LEAD, key: widgetKey, token: await later(), consent: false }, { ip });
  assert.equal(last.status, 400, "invalid submissions are refused, not counted as leads");
  // ...valid ones do, per IP...
  const ipBucket = `leadgen-ip:${sha(`leadgen-ip:${ip}`)}`;
  sqlite.prepare("INSERT OR REPLACE INTO api_rate_limits (bucket, window_started_at, count, updated_at) VALUES (?,?,?,?)").run(ipBucket, Date.now(), LEADGEN_LIMITS.ip.limit, Date.now());
  last = await submit({ ...LEAD, key: widgetKey, token: await later() }, { ip });
  assert.equal(last.status, 429, "per IP, valid leads");
  assert.ok(last.headers.get("retry-after"));
  // ...and every request from one address is limited first, cheaply.
  const anyBucket = `leadgen-ip-any:${sha(`leadgen-ip-any:${ip}`)}`;
  sqlite.prepare("INSERT OR REPLACE INTO api_rate_limits (bucket, window_started_at, count, updated_at) VALUES (?,?,?,?)").run(anyBucket, Date.now(), LEADGEN_LIMITS.ipAny.limit, Date.now());
  assert.equal((await submit({ key: widgetKey, token: "junk" }, { ip })).status, 429, "the per-IP pre-limit comes before anything else");
  // Per-key limit: every visitor of this agency together.
  const bucket = `leadgen-key:${sha(`leadgen-key:${widgetKey}`)}`;
  sqlite.prepare("INSERT OR REPLACE INTO api_rate_limits (bucket, window_started_at, count, updated_at) VALUES (?,?,?,?)").run(bucket, Date.now(), LEADGEN_LIMITS.key.limit, Date.now());
  assert.equal((await submit({ ...LEAD, key: widgetKey, token: await later() }, { ip: "192.0.2.200" })).status, 429, "per widget key");
  sqlite.prepare("DELETE FROM api_rate_limits WHERE bucket=?").run(bucket);
  // The limiter itself.
  const small = { limit: 2, windowMs: 1000 };
  assert.equal((await leadgenRateLimit(env, "t", "v", small, 5000)).allowed, true);
  assert.equal((await leadgenRateLimit(env, "t", "v", small, 5001)).allowed, true);
  assert.equal((await leadgenRateLimit(env, "t", "v", small, 5002)).allowed, false);
  assert.equal((await leadgenRateLimit(env, "t", "v", small, 6100)).allowed, true, "a new window");
  assert.equal((await quiet(() => leadgenRateLimit({ DB: { prepare() { throw new Error("d1 down"); } } }, "t", "v", small))).unavailable, true, "fails closed");

  // Widget turned off: the frame and the submit stop.
  const settings = { privacy_url: PRIVACY, widget_enabled: false, allowed_origins: "https://www.acme-digital.com", notify_email: true, slug: "acme-digital", landing_enabled: true, landing_intro: "We help <cafés> & shops." };
  assert.equal((await call(env, "PUT", "/api/agency/leadgen", { body: settings })).status, 200);
  assert.equal((await get(env, `/api/leadgen/frame/${widgetKey}`)).status, 404);
  assert.equal((await submit({ ...LEAD, key: widgetKey, token: await later() }, { ip: "192.0.2.201" })).status, 404);
  assert.equal((await call(env, "PUT", "/api/agency/leadgen", { body: { ...settings, widget_enabled: true } })).status, 200);
  console.log("PASS 4: submit (own origin, honeypot, timing, forged/expired/single-use token, consent, validation, per-IP and per-key limits, on-site score only, consent text stored, agency email)");
}

/* ---------------- 5. leads: isolation, list, delete, CSV ---------------- */
{
  // A lead whose fields would run as spreadsheet formulas.
  const res = await submit({ ...LEAD, key: widgetKey, token: await later(), name: "=HYPERLINK(\"https://evil.example\",\"x\")", email: "+evil@cafe-sakura.com", site_url: "https://cafe-sakura.com/?a=b" }, { ip: "192.0.2.150" });
  assert.equal(res.status, 200);
  const mine = await (await call(env, "GET", "/api/agency/leads")).json();
  assert.equal(mine.total, 3);
  assert.equal(mine.leads.length, 3);
  assert.ok(mine.leads[0].id > mine.leads[1].id, "newest first");
  const theirs = await (await call(env, "GET", "/api/agency/leads", { token: "other" })).json();
  assert.deepEqual(theirs.leads, [], "another agency sees none of these leads");
  assert.equal((await call(env, "GET", "/api/agency/leads.csv", { token: "other" })).status, 200);
  assert.ok(!(await (await call(env, "GET", "/api/agency/leads.csv", { token: "other" })).text()).includes("hanako"));
  assert.equal((await call(env, "DELETE", `/api/agency/leads/${mine.leads[0].id}`, { token: "other" })).status, 404, "cannot delete another agency's lead");
  assert.equal((await call(env, "GET", "/api/agency/leads", { token: null })).status, 401);

  const csvRes = await call(env, "GET", "/api/agency/leads.csv");
  assert.equal(csvRes.status, 200);
  assert.match(csvRes.headers.get("content-type"), /^text\/csv/);
  assert.match(csvRes.headers.get("content-disposition"), /^attachment; filename="nurevo-leads-\d{4}-\d{2}-\d{2}\.csv"$/);
  const bytes = new Uint8Array(await csvRes.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf], "UTF-8 BOM for spreadsheet apps");
  const csv = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes).slice(1);
  assert.ok(csv.startsWith("\"created_at\",\"source\""), "header");
  assert.ok(csv.includes(`"'=HYPERLINK(""https://evil.example"",""x"")"`), "formula neutralised and quotes doubled");
  assert.ok(csv.includes(`"'+evil@cafe-sakura.com"`));
  assert.ok(csv.includes(`"https://cafe-sakura.com/?a=b"`));
  assert.equal(csv.trim().split("\r\n").length, 4);
  assert.equal(leadsCsv([]), "\ufeff" + ["created_at", "source", "page_origin", "site_url", "name", "email", "score", "band", "locale", "consent_text", "consent_at"].map((c) => `"${c}"`).join(",") + "\r\n");

  assert.equal((await call(env, "DELETE", `/api/agency/leads/${mine.leads[0].id}`, { token: "viewer" })).status, 403, "viewer");
  assert.equal((await call(env, "DELETE", `/api/agency/leads/${mine.leads[0].id}`, { csrf: false })).status, 403, "CSRF");
  assert.equal((await call(env, "DELETE", `/api/agency/leads/${mine.leads[0].id}`)).status, 200);
  assert.equal((await (await call(env, "GET", "/api/agency/leads")).json()).total, 2);
  console.log("PASS 5: leads (isolation between agencies, list, delete, CSV with BOM, quoting and formula-injection guard)");
}

/* ---------------- 6. attribution ---------------- */
{
  const code = sqlite.prepare("SELECT referral_code FROM accounts WHERE id=?").get(A).referral_code;
  const page = await (await get(env, "/p/acme-digital?lang=ja")).text();
  const href = page.match(/id="signup" href="([^"]+)"/)[1].replace(/&amp;/g, "&");
  assert.equal(href, `https://nurevo.jp/signup.html?referral_code=${code}&lang=ja`);
  assert.equal(signupUrl(ORIGIN, { referral_code: code, partner_status: "approved", partner_approved_at: 1 }, "tw"), `https://nurevo.jp/signup.html?referral_code=${code}&lang=zh-tw`);
  assert.equal(signupUrl(ORIGIN, { referral_code: code, partner_status: "rejected" }, "en"), "https://nurevo.jp/signup.html?lang=en", "an inactive code is never put in a link");
  // A visitor follows the link and signs up with the code it carries.
  const params = new URL(href).searchParams;
  const res = await call(env, "POST", "/api/auth/signup", { token: null, csrf: false, body: { email: "hanako@cafe-sakura.com", referral_code: params.get("referral_code"), locale: "ja" } });
  assert.equal(res.status, 200);
  const child = sqlite.prepare("SELECT referred_by_account_id, referred_by_code FROM accounts WHERE email=?").get("hanako@cafe-sakura.com");
  assert.equal(child.referred_by_account_id, A, "the signup is credited to the agency");
  assert.equal(child.referred_by_code, code);
  console.log("PASS 6: attribution (signup links carry the active referral code; a signup through one is credited to the agency)");
}

/* ---------------- 7. the landing page ---------------- */
{
  let res = await get(env, "/p/acme-digital");
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("x-robots-tag"), null, "indexed by default");
  const csp = res.headers.get("content-security-policy");
  assert.match(csp, /default-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /frame-src 'self'/);
  let html = await res.text();
  assert.ok(html.includes('<html lang="en">'));
  assert.ok(html.includes('<meta name="robots" content="index,follow">'));
  assert.ok(html.includes("<title>Acme &lt;Digital&gt; &amp; Co recommends Nurevo | Nurevo</title>"));
  assert.ok(html.includes('<link rel="canonical" href="https://nurevo.jp/p/acme-digital">'));
  assert.ok(html.includes('hreflang="ja" href="https://nurevo.jp/p/acme-digital?lang=ja"'));
  assert.ok(html.includes('hreflang="x-default"'));
  assert.ok(html.includes('<meta property="og:title"') && html.includes('<meta name="description"'));
  assert.ok(html.includes("We help &lt;cafés&gt; &amp; shops."), "the agency's intro, escaped");
  assert.ok(!html.includes("<cafés>"));
  assert.ok(html.includes('id="install" href="https://wordpress.org/plugins/nurevo-webmcp/"'));
  assert.ok(html.includes(`/api/leadgen/frame/${widgetKey}?lang=en&amp;via=landing`), "the check itself, credited to the landing page");
  assert.ok(html.includes('href="https://acme-digital.com/contact"') && html.includes("mailto:hello@acme-digital.com"), "the agency's contact");
  assert.ok(html.includes("Acme Digital Ltd.<br>Tokyo"));
  assert.ok(!/<script[^>]+src=/.test(html), "no external script");
  for (const tag of html.matchAll(/<(script|style)\b([^>]*)>/g)) assert.ok(/nonce="/.test(tag[2]), `nonce on ${tag[1]}`);
  for (const lang of LEADGEN_LANGS) {
    html = await (await get(env, `/p/acme-digital?lang=${lang}`)).text();
    assert.ok(html.includes(LEADGEN_COPY[lang].lpInstall.replace(/'/g, "&#39;")), `${lang}: page chrome`);
    assert.ok(!/\{agency\}/.test(html), `${lang}: no raw placeholder`);
  }
  assert.ok((await (await get(env, "/p/acme-digital?lang=it")).text()).includes(LEADGEN_COPY.en.lpInstall), "other languages read English");
  assert.ok((await (await get(env, "/p/acme-digital", { "accept-language": "ko-KR,ko;q=0.9" })).text()).includes(LEADGEN_COPY.ko.lpInstall));
  assert.equal((await get(env, "/p/ACME-DIGITAL")).status, 200, "the address is case-insensitive");
  assert.equal((await get(env, "/p/no-such-agency")).status, 404);
  assert.equal((await get(env, "/p/%3Cscript%3E")).status, 404);
  const extra = await get(env, "/p/acme-digital/extra");
  assert.ok(extra === null || extra.status !== 200, "nothing below a landing page");

  // A visitor's landing-page check is stored as such.
  const landingToken = await issueFormToken(env, { key: widgetKey, origin: null, source: "landing", now: Date.now() - 5000 });
  assert.equal((await submit({ ...LEAD, key: widgetKey, token: landingToken }, { ip: "192.0.2.151" })).status, 200);
  const lastLead = sqlite.prepare("SELECT source, page_origin FROM agency_leads ORDER BY id DESC LIMIT 1").get();
  assert.deepEqual({ ...lastLead }, { source: "landing", page_origin: ORIGIN });

  // noindex on request.
  const settings = { privacy_url: PRIVACY, widget_enabled: true, allowed_origins: "https://www.acme-digital.com", notify_email: false, slug: "acme-digital", landing_enabled: true, landing_noindex: true };
  assert.equal((await call(env, "PUT", "/api/agency/leadgen", { body: settings })).status, 200);
  res = await get(env, "/p/acme-digital");
  assert.equal(res.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.ok((await res.text()).includes('<meta name="robots" content="noindex,nofollow">'));
  // Page off: gone.
  assert.equal((await call(env, "PUT", "/api/agency/leadgen", { body: { ...settings, landing_enabled: false } })).status, 200);
  assert.equal((await get(env, "/p/acme-digital")).status, 404);
  assert.equal((await call(env, "PUT", "/api/agency/leadgen", { body: { ...settings, landing_noindex: false } })).status, 200);
  // Partner revoked: the page, the frame and the submit all stop.
  sqlite.prepare("UPDATE accounts SET partner_status='rejected' WHERE id=?").run(A);
  assert.equal((await get(env, "/p/acme-digital")).status, 404);
  assert.equal((await get(env, `/api/leadgen/frame/${widgetKey}`)).status, 404);
  assert.equal((await submit({ ...LEAD, key: widgetKey, token: await later() }, { ip: "192.0.2.152" })).status, 404);
  const revoked = await (await call(env, "GET", "/api/agency/leads")).json();
  assert.ok(revoked.leads.length > 0, "the agency keeps its own leads");
  sqlite.prepare("UPDATE accounts SET partner_status='approved' WHERE id=?").run(A);
  // The other agency's page is its own.
  const other = await (await get(env, "/p/other-agency")).text();
  assert.ok(other.includes("Other Agency") && other.includes("referral_code=OTHERCODE234"));
  // Rendering is pure: a hostile brand stays inert.
  const hostile = renderLandingHtml({ origin: ORIGIN, lang: "en", nonce: "n", agency: {
    account: { referral_code: "X\"><script>", partner_status: "approved", partner_approved_at: 1 },
    settings: { slug: "x-y", widget_enabled: false, landing_noindex: false, landing_intro: "</blockquote><script>alert(1)</script>" },
    branding: { display_name: "\"><img src=x onerror=alert(1)>", brand_color: "red;}</style><script>", contact_url: "javascript:alert(1)", contact_email: "a@b.com\"><x", footer_text: "<b>x</b>", logo_url: "javascript:x" },
  } });
  assert.ok(!/<script>alert|<img src=x|javascript:|<b>x<\/b>|red;\}/.test(hostile), "nothing from the brand escapes into markup");
  console.log("PASS 7: landing page (brand, meta, canonical/hreflang, index default and noindex, 8 languages + fallback, escaping, widget inside, revoked partner, unknown slug)");
}

/* ---------------- 8. before 0047 ---------------- */
{
  const { env: old } = makeEnv({ migrated: false });
  const view = await (await call(old, "GET", "/api/agency/leadgen")).json();
  assert.deepEqual(view, { available: false, reason: "migration_pending" });
  assert.equal((await call(old, "PUT", "/api/agency/leadgen", { body: {} })).status, 503);
  assert.equal((await call(old, "GET", "/api/agency/leads")).status, 200);
  assert.equal((await call(old, "GET", "/api/agency/leads.csv")).status, 503);
  assert.equal((await call(old, "POST", "/api/agency/leadgen/rotate-key")).status, 503);
  assert.equal((await get(old, `/api/leadgen/frame/${widgetKey}`)).status, 404);
  assert.equal((await get(old, "/p/acme-digital")).status, 404);
  assert.equal((await call(old, "POST", "/api/leadgen/submit", { token: null, csrf: false, body: { ...LEAD, key: widgetKey, token: "x" } })).status, 503);
  assert.equal((await get(old, "/api/leadgen/widget.js")).status, 200, "the loader is static");
  // The existing pages are untouched.
  assert.equal((await call(old, "GET", "/api/agency/branding")).status, 200);
  console.log("PASS 8: before 0047 everything degrades (available:false / 404 / 503), nothing throws");
}

/* ---------------- 9. wiring ---------------- */
{
  const res = await get(env, "/api/leadgen/widget.js");
  assert.match(res.headers.get("content-type"), /^application\/javascript/);
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  const js = await res.text();
  assert.equal(js, widgetLoaderJs(ORIGIN));
  assert.ok(js.includes("/^wk_[a-z0-9]{24}$/"), "the loader checks the key's shape");
  assert.ok(js.includes("e.origin !== ORIGIN || e.source !== f.contentWindow"), "only our frame may resize itself");
  assert.ok(!/innerHTML|eval\(|document\.write/.test(js), "the loader writes no markup");
  assert.deepEqual([...js.matchAll(/https?:\/\/[^\s"'`)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith(ORIGIN)), [], "no third-party URL");
  assert.equal(embedSnippets(ORIGIN, "wk_x", "xx").script.includes('data-lang="en"'), true);

  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts["test:agency-leadgen"], "node scripts/test-agency-leadgen.mjs && node scripts/test-agency-leadgen-hardening.mjs");
  assert.ok(pkg.scripts["test:canary"].includes("npm run test:agency-leadgen"));
  const wrangler = read("wrangler.jsonc");
  assert.ok(wrangler.includes('"pattern": "nurevo.jp/p/*"'), "the landing pages are routed to the worker");
  assert.ok(/"\/p\/\*"/.test(wrangler), "and run the worker first");
  const dash = read("public/dashboard.html");
  assert.ok(dash.includes('<div id="agency-leadgen-slot"></div>'));
  assert.ok(dash.includes('<script src="/dashboard-agency-leadgen.js?v='));
  assert.ok(read("worker/api.mjs").includes("if (path === LEADGEN_SUBMIT_PATH) return false;"), "the public submit is exempt from the session CSRF token");
  const schema = sql("schema.sql");
  assert.ok(schema.includes("CREATE TABLE IF NOT EXISTS agency_leadgen") && schema.includes("CREATE TABLE IF NOT EXISTS agency_leads"));
  console.log("PASS 9: wiring (loader JS, routes, test:canary, dashboard slot and script, CSRF exemption, schema.sql)");
}

globalThis.fetch = originalFetch;
console.log("agency lead-generation tests passed. No real network call was made.");
