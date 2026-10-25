/**
 * Regression and hardening for the agency lead tools (review of PR #36).
 *
 *   1. The reviewer's repro (repro-leadgen-quota.mjs): 300 tokenless junk
 *      POSTs from 30 addresses used to spend the agency's 300/day per-key
 *      quota, so a real visitor with a valid form token got 429. Now the
 *      order is: a cheap per-IP limit on every request, then the token and
 *      honeypot, and only valid submissions count against the per-key limit.
 *   2. New-lead emails go to the branding contact address only once it was
 *      verified with a signed link; until then to the member's sign-in
 *      address. The dashboard shows which.
 *   3. Privacy: the widget needs the agency's privacy policy; the consent
 *      text and the pages name the agency (controller, its policy) and Nurevo
 *      (processor, nurevo.jp/privacy).
 *   4. The widget's diagnosis uses a cache scoped to the agency, never the
 *      shared /api/aeo/score cache.
 * Real SQLite with the real schema and migrations; every network call is a
 * stub.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  LEADGEN_LIMITS, LEADGEN_VERIFY_PATH, contactVerifyToken, issueFormToken, leadNotificationAddress,
} from "../worker/agency-leadgen.mjs";
import { LEADGEN_VERIFY_COPY } from "../worker/agency-leadgen-i18n.mjs";
import { handleApi } from "../worker/api.mjs";
import { INITIAL_AEO_RULESET } from "../worker/aeo-rules.mjs";
import vm from "node:vm";
import { LANGS, loadDictionary } from "./dashboard-dictionary.mjs";

const sql = (f) => readFileSync(new URL(`../nurevo-impl/db/${f}`, import.meta.url), "utf8");
const sha = (v) => createHash("sha256").update(v).digest("hex");
const CSRF = "c".repeat(64);
const PRIVACY = "https://acme.test/privacy";

const MAIL = [];
globalThis.fetch = async (url, init) => {
  const u = String(url?.url || url);
  if (u === "https://api.resend.com/emails") { MAIL.push(JSON.parse(init.body)); return new Response(JSON.stringify({ id: `m${MAIL.length}` }), { status: 200 }); }
  if (/perplexity|openai|anthropic|googleapis/.test(u)) throw new Error(`paid engine called: ${u}`);
  return new Response("<html><head><title>Real Cafe</title></head><body><h1>Real Cafe</h1></body></html>", { status: 200, headers: { "content-type": "text/html" } });
};

function setup() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(sql("schema.sql"));
  for (const s of ["ALTER TABLE sites ADD COLUMN manual_plan TEXT", "ALTER TABLE orgs ADD COLUMN manual_plan TEXT"]) { try { sqlite.exec(s); } catch { /* present */ } }
  for (const f of ["0029_member_email_preferences.sql", "0030_account_referrals.sql", "0040_partner_approval_first_customer.sql", "0046_agency_branding.sql", "0047_agency_leadgen.sql"]) sqlite.exec(sql(f));
  // schema.sql seeds the pre-scoring ruleset; production runs the current one.
  sqlite.prepare("UPDATE aeo_rulesets SET definition_json=? WHERE active=1").run(JSON.stringify(INITIAL_AEO_RULESET.definition));
  sqlite.exec(`INSERT INTO orgs(id) VALUES('o1');
    INSERT INTO members(id,org_id,email,role,status,created_at) VALUES('m1','o1','agency@acme.test','admin','active',1);
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("agency")}','m1','o1','session',${Date.now() + 3.6e6});
    INSERT INTO accounts(member_id,email,created_at,partner_status,partner_approved_at) VALUES('m1','agency@acme.test',1,'approved',10);`);
  const DB = {
    prepare(text) {
      const w = (a) => ({ async first() { return sqlite.prepare(text).get(...a) || null; }, async all() { return { results: sqlite.prepare(text).all(...a) }; }, async run() { const r = sqlite.prepare(text).run(...a); return { meta: { changes: Number(r.changes) } }; }, runSync() { return sqlite.prepare(text).run(...a); } });
      return { ...w([]), bind: (...a) => w(a) };
    },
    async batch(st) { sqlite.exec("BEGIN"); try { const o = st.map((s) => s.runSync()); sqlite.exec("COMMIT"); return o; } catch (e) { sqlite.exec("ROLLBACK"); throw e; } },
  };
  const kv = new Map();
  const env = {
    DB, WEBMCP_KV: { async get(k, type) { const v = kv.get(k) ?? null; return v && type === "json" ? JSON.parse(v) : v; }, async put(k, v) { kv.set(k, v); } },
    WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp", LEADGEN_FORM_SECRET: "s", RESEND_API_KEY: "re_test", MAIL_FROM: "Nurevo <hello@nurevo.jp>",
  };
  return { sqlite, env, kv };
}
const req = (env, method, path, body, headers = {}) => handleApi(new Request(`https://nurevo.jp${path}`, { method, headers: { origin: "https://nurevo.jp", "content-type": "application/json", ...headers }, body: body ? JSON.stringify(body) : undefined }), env, {});
const auth = { cookie: `nrv_session=agency; nrv_csrf=${CSRF}`, "x-csrf-token": CSRF };
const quiet = async (fn) => { const s = [console.log, console.warn, console.error]; console.log = console.warn = console.error = () => {}; try { return await fn(); } finally { [console.log, console.warn, console.error] = s; } };

/* ---------------- 1. the reviewer's repro ---------------- */
{
  const { env } = setup();
  const view = await quiet(async () => {
    await req(env, "PUT", "/api/agency/branding", { display_name: "Acme" }, auth);
    return (await req(env, "PUT", "/api/agency/leadgen", { widget_enabled: true, privacy_url: PRIVACY }, auth)).json();
  });
  const key = view.settings.widget_key;
  assert.ok(key, "widget on");
  const tally = {};
  await quiet(async () => {
    for (let i = 0; i < LEADGEN_LIMITS.key.limit; i += 1) {
      const r = await req(env, "POST", "/api/leadgen/submit", { key, token: "junk" }, { "cf-connecting-ip": `198.51.100.${Math.floor(i / 10) + 1}` });
      tally[r.status] = (tally[r.status] || 0) + 1;
    }
  });
  assert.deepEqual(tally, { 422: LEADGEN_LIMITS.key.limit }, "every junk request is refused as junk");
  const token = await issueFormToken(env, { key, now: Date.now() - 10_000 });
  const real = await quiet(() => req(env, "POST", "/api/leadgen/submit", { key, token, site_url: "realcafe.jp", name: "Hanako", email: "h@realcafe.jp", consent: true }, { "cf-connecting-ip": "203.0.113.77" }));
  assert.equal(real.status, 200, "a real visitor still gets through after the junk");
  assert.equal((await real.json()).ok, true);

  // One address flooding is stopped by the cheap pre-limit, before anything else.
  const statuses = [];
  await quiet(async () => {
    for (let i = 0; i < LEADGEN_LIMITS.ipAny.limit + 5; i += 1) statuses.push((await req(env, "POST", "/api/leadgen/submit", { key, token: "junk" }, { "cf-connecting-ip": "192.0.2.9" })).status);
  });
  assert.equal(statuses.filter((s) => s === 422).length, LEADGEN_LIMITS.ipAny.limit);
  assert.equal(statuses.filter((s) => s === 429).length, 5, "then 429 from that address");
  // And it did not touch the per-key quota: another real visitor gets through.
  const token2 = await issueFormToken(env, { key, now: Date.now() - 10_000 });
  assert.equal((await quiet(() => req(env, "POST", "/api/leadgen/submit", { key, token: token2, site_url: "othercafe.jp", name: "Taro", email: "t@othercafe.jp", consent: true }, { "cf-connecting-ip": "203.0.113.78" }))).status, 200);

  // Only valid submissions count against the per-key daily limit.
  const keyBucket = `leadgen-key:${sha(`leadgen-key:${key}`)}`;
  const counted = await env.DB.prepare("SELECT count FROM api_rate_limits WHERE bucket=?").bind(keyBucket).first();
  assert.equal(counted.count, 2, "two valid leads counted, no junk");
}

/* ---------------- 2. contact verification before lead emails ---------------- */
{
  const { sqlite, env } = setup();
  const view = await quiet(async () => {
    await req(env, "PUT", "/api/agency/branding", { display_name: "Acme", contact_email: "Sales@Acme.test" }, auth);
    return (await req(env, "PUT", "/api/agency/leadgen", { widget_enabled: true, privacy_url: PRIVACY, notify_email: true }, auth)).json();
  });
  assert.equal(view.contact_email, "sales@acme.test");
  assert.equal(view.contact_verified, false, "the dashboard shows the contact address as unverified");
  assert.equal(view.notify_to, "account");
  const key = view.settings.widget_key;
  const lead = async (ip) => {
    const token = await issueFormToken(env, { key, now: Date.now() - 10_000 });
    return quiet(() => req(env, "POST", "/api/leadgen/submit", { key, token, site_url: "cafe-a.jp", name: "Hanako", email: "h@cafe-a.jp", consent: true }, { "cf-connecting-ip": ip }));
  };
  MAIL.length = 0;
  assert.equal((await lead("203.0.113.1")).status, 200);
  assert.deepEqual(MAIL.map((m) => m.to[0]), ["agency@acme.test"], "unverified contact: the lead email goes to the sign-in address");

  // Ask for verification: an email to the contact address with a signed link.
  MAIL.length = 0;
  const sent = await quiet(() => req(env, "POST", "/api/agency/leadgen/verify-email", { lang: "de" }, auth));
  assert.equal(sent.status, 200);
  assert.ok((await sent.json()).contact_verify_sent_at > 0);
  assert.equal(MAIL.length, 1);
  assert.deepEqual(MAIL[0].to, ["sales@acme.test"]);
  assert.equal(MAIL[0].subject, "Nurevo: sales@acme.test für Lead-Benachrichtigungen bestätigen", "in the dashboard's language");
  const link = MAIL[0].text.match(/https:\/\/nurevo\.jp\/api\/agency\/verify-contact\?t=\S+/)[0];
  const path = link.replace("https://nurevo.jp", "");
  const page = await req(env, "GET", path, null, {});
  assert.equal(page.status, 200);
  assert.ok((await page.text()).includes(LEADGEN_VERIFY_COPY.de.verifyButton));
  assert.equal(sqlite.prepare("SELECT contact_verified_email FROM agency_leadgen").get().contact_verified_email, null, "GET records nothing");
  assert.equal((await quiet(() => req(env, "POST", path, null, {}))).status, 200, "POST verifies, no session needed");
  const after = await (await req(env, "GET", "/api/agency/leadgen", null, auth)).json();
  assert.equal(after.contact_verified, true);
  assert.equal(after.notify_to, "contact");
  MAIL.length = 0;
  assert.equal((await lead("203.0.113.2")).status, 200);
  assert.deepEqual(MAIL.map((m) => m.to[0]), ["sales@acme.test"], "verified: the lead email goes to the contact address");

  // Changing the contact address needs a new verification; old links die.
  await quiet(() => req(env, "PUT", "/api/agency/branding", { display_name: "Acme", contact_email: "new@acme.test" }, auth));
  assert.equal(leadNotificationAddress({ branding: { contact_email: "new@acme.test" }, settings: { contact_verified_email: "sales@acme.test" }, account: { email: "agency@acme.test" } }), "agency@acme.test");
  assert.equal((await req(env, "POST", path, null, {})).status, 400, "a link for the old address no longer verifies");
  MAIL.length = 0;
  assert.equal((await lead("203.0.113.3")).status, 200);
  assert.deepEqual(MAIL.map((m) => m.to[0]), ["agency@acme.test"]);
  // Tampered and expired links.
  const [a, e, x, m] = new URL(link).searchParams.get("t").split(".");
  assert.equal((await req(env, "POST", `${LEADGEN_VERIFY_PATH}?t=${a}.${e}.${Number(x) + 1e9}.${m}`, null, {})).status, 400, "the expiry cannot be extended");
  const expired = await contactVerifyToken(env, 1, "new@acme.test", Date.now() - 1000);
  assert.equal((await req(env, "POST", `${LEADGEN_VERIFY_PATH}?t=${encodeURIComponent(expired)}`, null, {})).status, 400, "expired");
  const otherAccount = await contactVerifyToken(env, 2, "new@acme.test", Date.now() + 3600e3);
  assert.equal((await req(env, "POST", `${LEADGEN_VERIFY_PATH}?t=${encodeURIComponent(otherAccount)}`, null, {})).status, 400, "another account's link");
  // Verification emails are limited per account per day.
  const codes = [];
  await quiet(async () => {
    for (let i = 0; i < LEADGEN_LIMITS.verify.limit + 1; i += 1) codes.push((await req(env, "POST", "/api/agency/leadgen/verify-email", {}, auth)).status);
  });
  assert.equal(codes.at(-1), 429, `limited (${codes})`);
  assert.equal((await req(env, "POST", "/api/agency/leadgen/verify-email", {}, { cookie: auth.cookie })).status, 403, "CSRF");
}

/* ---------------- 3. privacy ---------------- */
{
  const { sqlite, env } = setup();
  await quiet(() => req(env, "PUT", "/api/agency/branding", { display_name: "Acme" }, auth));
  const refused = await quiet(() => req(env, "PUT", "/api/agency/leadgen", { widget_enabled: true }, auth));
  assert.equal(refused.status, 400);
  assert.deepEqual((await refused.json()).fields, ["privacy_url_required"], "no privacy policy, no widget");
  assert.deepEqual((await (await quiet(() => req(env, "PUT", "/api/agency/leadgen", { widget_enabled: true, privacy_url: "http://acme.test/p" }, auth))).json()).fields, ["privacy_url"]);
  const view = await (await quiet(() => req(env, "PUT", "/api/agency/leadgen", { widget_enabled: true, privacy_url: PRIVACY, slug: "acme-tools", landing_enabled: true }, auth))).json();
  const key = view.settings.widget_key;
  const frame = await (await req(env, "GET", `/api/leadgen/frame/${key}?lang=en`, null, {})).text();
  assert.ok(frame.includes(`<a href="${PRIVACY}" target="_blank" rel="noopener">${PRIVACY}</a>`), "the consent text links the agency's policy");
  assert.ok(frame.includes('<a href="https://nurevo.jp/privacy" target="_blank" rel="noopener">https://nurevo.jp/privacy</a>'), "and Nurevo's, as processor");
  assert.ok(/controller[^<]*\(privacy policy: <a href="https:\/\/acme\.test\/privacy"/.test(frame) && frame.includes("as processor"), "controller and processor named");
  assert.ok(frame.includes("Acme privacy policy"), "the footer links the agency's policy too");
  const landing = await (await req(env, "GET", "/p/acme-tools?lang=ja", null, {})).text();
  assert.ok(landing.includes(`href="${PRIVACY}"`) && landing.includes("Acmeのプライバシーポリシー"), "the landing page links the agency's policy");
  // A stored consent text carries both policies.
  const token = await issueFormToken(env, { key, now: Date.now() - 10_000 });
  await quiet(() => req(env, "POST", "/api/leadgen/submit", { key, token, site_url: "cafe-b.jp", name: "B", email: "b@cafe-b.jp", consent: true, lang: "fr" }, { "cf-connecting-ip": "203.0.113.10" }));
  const consent = sqlite.prepare("SELECT consent_text FROM agency_leads").get().consent_text;
  assert.ok(consent.includes(PRIVACY) && consent.includes("https://nurevo.jp/privacy") && consent.includes("sous-traitant"));
  // A row without a policy (written around the API) shows no widget at all.
  sqlite.exec("UPDATE agency_leadgen SET privacy_url=NULL");
  assert.equal((await req(env, "GET", `/api/leadgen/frame/${key}`, null, {})).status, 404);
}

/* ---------------- 4. the widget's cache is scoped to the agency ---------------- */
{
  const { env, kv } = setup();
  const view = await quiet(async () => {
    await req(env, "PUT", "/api/agency/branding", { display_name: "Acme" }, auth);
    return (await req(env, "PUT", "/api/agency/leadgen", { widget_enabled: true, privacy_url: PRIVACY }, auth)).json();
  });
  const key = view.settings.widget_key;
  const token = await issueFormToken(env, { key, now: Date.now() - 10_000 });
  const res = await quiet(() => req(env, "POST", "/api/leadgen/submit", { key, token, site_url: "secret-client.jp", name: "C", email: "c@secret-client.jp", consent: true }, { "cf-connecting-ip": "203.0.113.20" }));
  assert.equal(res.status, 200);
  const resultKeys = () => [...kv.keys()].filter((k) => /^aeo-score:[^:]+:[^:]+:/.test(k) && k.includes("url:"));
  const scoreKeys = resultKeys();
  assert.ok(scoreKeys.length >= 1, "the widget's result is cached");
  assert.ok(scoreKeys.every((k) => /:ns:[a-f0-9]{64}:url:/.test(k)), `only under the agency's namespace (${scoreKeys})`);
  // The public endpoint does not see it: a miss, and its own shared entry.
  const pub = await quiet(() => req(env, "GET", "/api/aeo/score?url=https%3A%2F%2Fsecret-client.jp%2F", null, {}));
  assert.equal(pub.status, 200);
  assert.equal(pub.headers.get("x-aeo-cache"), "miss", "no cache hit from the widget's check");
  assert.equal(resultKeys().filter((k) => !k.includes(":ns:")).length, 1, "the public check made its own shared entry");
  // And a shared entry is never served to the widget.
  const token2 = await issueFormToken(env, { key, now: Date.now() - 10_000 });
  const sharedKey = resultKeys().find((k) => !k.includes(":ns:"));
  kv.set(sharedKey, JSON.stringify({ score: 99, band: "green", checks: [] }));
  const again = await (await quiet(() => req(env, "POST", "/api/leadgen/submit", { key, token: token2, site_url: "secret-client.jp", name: "C", email: "c@secret-client.jp", consent: true }, { "cf-connecting-ip": "203.0.113.21" }))).json();
  assert.notEqual(again.score, 99, "the widget reads its own cache only");
}

/* ---------------- 5. the dashboard card, per language ---------------- */
{
  const SRC = readFileSync(new URL("../public/dashboard-agency-leadgen.js", import.meta.url), "utf8");
  const { I } = loadDictionary();
  const htmlEsc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const render = (view, l) => {
    const sandbox = {
      t: (k) => (I[l] || I.ja)[k] || I.ja[k] || k, lang: l,
      document: { createElement: () => ({ className: "", innerHTML: "", addEventListener() {}, querySelector: () => null }), querySelector: () => null, addEventListener() {}, head: { appendChild() {} }, documentElement: {} },
      MutationObserver: class { observe() {} }, setTimeout() {}, fetch: async () => { throw new Error("render only"); },
      Number, Math, String, Date, JSON, Array, Object, console, Promise,
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(SRC.replace(/\}\)\(\);\s*$/, "  window.__x = { toolsCard: toolsCard, errorText: errorText };\n})();"), sandbox);
    return sandbox.window.__x;
  };
  const base = { available: true, approved: true, can_edit: true, has_branding: true, has_contact: true, contact_email: "sales@<acme>.test", landing_prefix: "https://nurevo.jp/p/", limits: {},
    settings: { widget_enabled: true, allowed_origins: [], privacy_url: "https://acme.test/privacy" }, embed: { script: "<script>", iframe: "<iframe>" } };
  for (const l of LANGS) {
    const x = render(base, l);
    const unverified = x.toolsCard({ ...base, contact_verified: false }).innerHTML;
    const verified = x.toolsCard({ ...base, contact_verified: true }).innerHTML;
    for (const out of [unverified, verified]) {
      assert.ok(!/\blg[A-Z]\w*\b/.test(out.replace(/class="[^"]*"/g, "").replace(/data-[\w-]+/g, "")), `${l}: no raw key`);
      assert.ok(!/\{\w+\}/.test(out), `${l}: placeholders filled`);
      assert.ok(out.includes(htmlEsc(I[l].lgPrivacyUrl)) && out.includes('name="privacy_url"') && out.includes('value="https://acme.test/privacy"'), `${l}: the privacy policy field`);
      assert.ok(!out.includes("<acme>"), `${l}: escaped`);
    }
    assert.ok(unverified.includes('data-lg-contact="unverified"') && unverified.includes("data-lg-verify") && unverified.includes(htmlEsc(I[l].lgVerifySend)), `${l}: unverified status and the verify button`);
    assert.ok(verified.includes('data-lg-contact="verified"') && !verified.includes("data-lg-verify>"), `${l}: verified status`);
    assert.equal(x.errorText({ fields: ["privacy_url_required"] }, base), I[l].lgErrPrivacyRequired, `${l}: the privacy error`);
  }
}

console.log("agency lead hardening passed (junk cannot spend the per-key quota, per-IP pre-limit, contact verification before lead emails, privacy policy required and named, agency-scoped cache)");
