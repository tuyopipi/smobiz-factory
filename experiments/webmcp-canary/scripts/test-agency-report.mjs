/**
 * Agency white-label monthly client report (worker/agency-report.mjs,
 * migration 0046, the /api/agency/branding, /api/sites/:id/report-settings,
 * /api/sites/:id/agency-report, /api/agency/logo/:hash and
 * /api/email/report-unsubscribe endpoints, public/dashboard-agency-report.js).
 *
 * Real SQLite with the real schema and migrations; the email provider is a
 * fake fetch, so no email is sent and nothing reaches the network. Covers:
 *   1. branding validation (name, logo URL / upload by sniffed bytes, colour,
 *      contact, footer) and report-settings validation (recipients, consent)
 *   2. languages: the eight body languages, the English fallback
 *   3. the report model: score and change, fixed / still open, free check,
 *      Pro measurement, off-site, next actions; Powered-by policy
 *   4. rendering in every body language: no raw placeholders, escaping,
 *      print CSS, notice, Powered by Nurevo
 *   5. endpoints: auth, CSRF, viewer, other org, invalid input, logo serving,
 *      preview HTML headers, brand resolution (own, partner, re-checked access)
 *   6. monthly email: send window, one message per recipient, From / Reply-To /
 *      List-Unsubscribe, idempotency per site+month+recipient, month and year
 *      rollover, 429 release, other failures not retried, pacing limit,
 *      disabled / no consent / stopped sites skipped, no addresses in logs
 *   7. unsubscribe: GET records nothing, POST opts out that site+address only,
 *      tampered tokens refused
 *   8. before 0046: every endpoint and the cron degrade, nothing fails
 *   9. the dashboard cards, per language, and the wiring (slot, script, cron)
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import vm from "node:vm";
import {
  AGENCY_LOGO_MAX_BYTES, AGENCY_REPORT_MAX_RECIPIENTS, POWERED_BY_REMOVABLE_PLANS, REPORT_BODY_LANGS, REPORT_UNSUBSCRIBE_PATH,
  agencyFrom, agencyReportEmail, buildAgencyReport, parseLogoUpload, previousMonthKey, renderAgencyReportHtml, reportLanguage,
  reportUnsubscribeToken, runAgencyReportBatch as runBatchRaw, safeHttpsUrl, showPoweredBy, sniffImageType, validateBranding, validateReportSettings,
} from "../worker/agency-report.mjs";
import { REPORT_COPY } from "../worker/agency-report-i18n.mjs";
import { handleApi, runAgencyReportBatch } from "../worker/api.mjs";
import { SCHEDULED_JOBS, HOURLY_CRON } from "../worker/schedule.mjs";
import { LANGS, loadDictionary } from "./dashboard-dictionary.mjs";

const sql = (file) => readFileSync(new URL(`../nurevo-impl/db/${file}`, import.meta.url), "utf8");
// Saving recipients sends each new address a confirmation email (double
// opt-in, see test-agency-report-abuse.mjs). Those go through the global
// fetch: answer them here so nothing reaches the network.
const CONFIRMATIONS = [];
globalThis.fetch = async (url, init) => {
  if (String(url) === "https://api.resend.com/emails") { CONFIRMATIONS.push(JSON.parse(init.body)); return new Response(JSON.stringify({ id: "c" }), { status: 200 }); }
  throw new Error(`unexpected fetch ${url}`);
};
const sha = (v) => createHash("sha256").update(v).digest("hex");
const CSRF = "c".repeat(64);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40, 7)]);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(20, 1)]);
const dataUrl = (type, bytes) => `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
const htmlEsc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const quiet = async (fn, lines = []) => {
  const saved = [console.log, console.warn, console.error];
  console.log = console.warn = console.error = (...args) => lines.push(args.join(" "));
  try { return await fn(); } finally { [console.log, console.warn, console.error] = saved; }
};

/* ---------------- a database ---------------- */

function makeDb({ migrated = true, accounts = true } = {}) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(sql("schema.sql"));
  for (const stmt of ["ALTER TABLE sites ADD COLUMN manual_plan TEXT", "ALTER TABLE orgs ADD COLUMN manual_plan TEXT", "ALTER TABLE sites ADD COLUMN bound_at INTEGER", "ALTER TABLE sites ADD COLUMN domain_key TEXT"]) {
    try { sqlite.exec(stmt); } catch { /* already there */ }
  }
  sqlite.exec(sql("0029_member_email_preferences.sql"));
  if (accounts) {
    sqlite.exec(sql("0030_account_referrals.sql"));
    sqlite.exec(sql("0040_partner_approval_first_customer.sql"));
  }
  sqlite.exec(sql("0042_offsite_listing_audit.sql"));
  if (!migrated) for (const t of ["agency_branding", "agency_report_settings", "agency_report_sends", "agency_report_opt_outs", "agency_report_recipients", "agency_report_suppressions", "agency_report_counters"]) sqlite.exec(`DROP TABLE ${t}`);
  else sqlite.exec(sql("0046_agency_branding.sql")); // idempotent on top of schema.sql
  const later = Date.now() + 3.6e6;
  sqlite.exec(`INSERT INTO orgs(id) VALUES('o1'); INSERT INTO orgs(id) VALUES('o2'); INSERT INTO orgs(id) VALUES('o3');
    INSERT INTO members(id,org_id,email,role,status,created_at) VALUES('m1','o1','agency@acme.test','admin','active',1);
    INSERT INTO members(id,org_id,email,role,status,created_at) VALUES('m2','o1','viewer@acme.test','viewer','active',2);
    INSERT INTO members(id,org_id,email,role,status,created_at) VALUES('m3','o2','other@else.test','admin','active',3);
    INSERT INTO members(id,org_id,email,role,status,created_at) VALUES('m4','o3','owner@cafe.test','store','active',4);
    INSERT INTO members(id,org_id,email,role,status,created_at) VALUES('m5','o3','partner@agency2.test','store','active',5);
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("agency")}','m1','o1','session',${later});
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("viewer")}','m2','o1','session',${later});
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("other")}','m3','o2','session',${later});
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,owner_member_id,bound_at,created_at) VALUES('s1','o1','shop.test','https://shop.test/','k1','wp','standard','m1',1,1);
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,owner_member_id,bound_at,created_at) VALUES('s2','o1','pro.test','https://pro.test/','k2','wp','pro','m1',1,2);
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,owner_member_id,bound_at,created_at) VALUES('s3','o2','else.test','https://else.test/','k3','wp','free','m3',1,3);
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,owner_member_id,bound_at,created_at) VALUES('s4','o3','cafe.test','https://cafe.test/','k4','wp','standard','m4',1,4);
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,owner_member_id,bound_at,delivery_status,created_at) VALUES('s5','o1','stopped.test','https://stopped.test/','k5','wp','free','m1',1,'stopped',5);`);
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
  return { sqlite, env: { DB, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp", RESEND_API_KEY: "re_test", MAIL_FROM: "Nurevo <reports@nurevo.jp>", EMAIL_UNSUBSCRIBE_SECRET: "unsub-secret-test", ...extra } };
}

const call = (env, method, path, { token = "agency", csrf = true, body, headers = {} } = {}) => quiet(() => handleApi(new Request(`https://nurevo.jp${path}`, {
  method,
  headers: {
    ...(token ? { cookie: `nrv_session=${token}; nrv_csrf=${CSRF}` } : {}),
    origin: "https://nurevo.jp",
    ...(csrf && method !== "GET" ? { "x-csrf-token": CSRF } : {}),
    ...(body !== undefined ? { "content-type": "application/json" } : {}),
    ...headers,
  },
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
}), env, {}));

const BRAND = { display_name: "Acme Digital", brand_color: "#0a7d5a", contact_email: "Hello@Acme.test", contact_url: "https://acme.test/", footer_text: "Acme Digital Ltd.\nTokyo", logo_upload: dataUrl("image/png", PNG) };

/* ---------------- 1. validation ---------------- */
{
  const ok = await validateBranding(BRAND);
  assert.equal(ok.ok, true, JSON.stringify(ok.errors));
  assert.equal(ok.value.contact_email, "hello@acme.test", "the contact address is stored lower-case");
  assert.equal(ok.value.logo.type, "image/png");
  assert.match(ok.value.logo.hash, /^[a-f0-9]{40}$/);
  assert.equal(ok.value.footer_text, "Acme Digital Ltd.\nTokyo", "the footer keeps its line break, as plain text");

  const bad = async (patch) => (await validateBranding({ ...BRAND, ...patch })).errors;
  assert.deepEqual(await bad({ display_name: "" }), ["display_name"]);
  assert.deepEqual(await bad({ display_name: "x".repeat(81) }), ["display_name"]);
  assert.deepEqual(await bad({ display_name: "Acme\r\nBcc: x@y.z" }), [], "a newline in the name is flattened, never kept");
  assert.equal((await validateBranding({ ...BRAND, display_name: "Acme\r\nBcc: x@y.z" })).value.display_name, "Acme Bcc: x@y.z");
  for (const url of ["http://acme.test/logo.png", "javascript:alert(1)", "https://user:pw@acme.test/l.png", "data:image/png;base64,AAAA", "https://acme.test/a b.png", "//acme.test/x.png"]) {
    assert.deepEqual(await bad({ logo_url: url }), ["logo_url"], `logo URL refused: ${url}`);
  }
  assert.deepEqual(await bad({ logo_url: "https://cdn.acme.test/logo.png" }), []);
  assert.deepEqual(await bad({ logo_upload: "data:image/svg+xml;base64," + Buffer.from("<svg onload=alert(1)>").toString("base64") }), ["logo_upload"], "SVG is never accepted");
  assert.deepEqual(await bad({ logo_upload: dataUrl("image/png", JPEG) }), ["logo_upload"], "the declared type must match the bytes");
  assert.deepEqual(await bad({ logo_upload: dataUrl("image/png", Buffer.from("<html><script>x</script>")) }), ["logo_upload"], "HTML posing as an image is refused");
  assert.deepEqual(await bad({ logo_upload: dataUrl("image/png", Buffer.concat([PNG, Buffer.alloc(AGENCY_LOGO_MAX_BYTES)])) }), ["logo_size"]);
  assert.deepEqual(await bad({ brand_color: "red" }), ["brand_color"]);
  assert.deepEqual(await bad({ brand_color: "#12345g" }), ["brand_color"]);
  assert.deepEqual(await bad({ contact_email: "not-an-email" }), ["contact_email"]);
  assert.deepEqual(await bad({ contact_email: "a@b.c\r\nBcc: x@y.z" }), ["contact_email"]);
  assert.deepEqual(await bad({ contact_url: "http://acme.test" }), ["contact_url"]);
  assert.deepEqual(await bad({ footer_text: "x".repeat(301) }), ["footer_text"]);
  assert.equal((await parseLogoUpload(dataUrl("image/jpeg", JPEG))).logo.type, "image/jpeg");
  assert.equal(sniffImageType(Buffer.from("GIF89a....")), "image/gif");
  assert.equal(sniffImageType(Buffer.from("RIFF\0\0\0\0WEBPVP8 ")), "image/webp");
  assert.equal(sniffImageType(Buffer.from("<svg")), null);
  assert.equal(safeHttpsUrl("https://acme.test"), "https://acme.test/");

  const settings = validateReportSettings({ enabled: true, recipients: "Client@Cafe.test\nclient@cafe.test, boss@cafe.test", locale: "pt-BR", consent: true });
  assert.equal(settings.ok, true);
  assert.deepEqual(settings.value.recipients, ["client@cafe.test", "boss@cafe.test"], "lower-cased and de-duplicated");
  assert.equal(settings.value.locale, "pt_BR", "any dashboard locale is kept");
  assert.equal(settings.value.branding_source, "agency");
  assert.deepEqual(validateReportSettings({ enabled: true, recipients: ["a@b.test"] }).errors, ["consent_required"], "enabling with recipients needs the consent confirmation");
  assert.deepEqual(validateReportSettings({ enabled: true, recipients: [] , consent: true }).errors, ["recipients_required"]);
  assert.deepEqual(validateReportSettings({ enabled: false, recipients: ["x"] }).errors, ["recipients_invalid"]);
  assert.deepEqual(validateReportSettings({ enabled: false, recipients: Array.from({ length: 6 }, (_, i) => `c${i}@x.test`) }).errors, ["recipients_too_many"]);
  assert.equal(AGENCY_REPORT_MAX_RECIPIENTS, 5);
  assert.equal(validateReportSettings({ locale: "xx-YY" }).value.locale, "en", "an unknown language falls back to English");
  assert.equal(validateReportSettings({}).value.enabled, false, "off by default");
}

/* ---------------- 2. languages ---------------- */
{
  assert.deepEqual([...REPORT_BODY_LANGS], ["ja", "en", "zh", "tw", "ko", "es", "fr", "de"]);
  for (const lang of REPORT_BODY_LANGS) {
    assert.deepEqual(Object.keys(REPORT_COPY[lang]).sort(), Object.keys(REPORT_COPY.en).sort(), `${lang}: every sentence`);
    for (const [key, value] of Object.entries(REPORT_COPY[lang])) {
      const holes = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
      assert.equal(holes(value), holes(REPORT_COPY.en[key]), `${lang}.${key}: same placeholders as English`);
      assert.ok(!/[<>]/.test(value), `${lang}.${key}: no markup`);
    }
  }
  assert.notEqual(REPORT_COPY.de.title, REPORT_COPY.en.title, "German is its own text");
  assert.deepEqual(reportLanguage("tw"), { locale: "tw", lang: "tw", fallback: false });
  assert.deepEqual(reportLanguage("zh-Hant-TW"), { locale: "tw", lang: "tw", fallback: false });
  assert.deepEqual(reportLanguage("zh_HK"), { locale: "zh_HK", lang: "tw", fallback: false }, "Hong Kong reads Traditional Chinese");
  assert.deepEqual(reportLanguage("pt_BR"), { locale: "pt_BR", lang: "en", fallback: true }, "other locales get the English body");
  assert.deepEqual(reportLanguage("de_CH"), { locale: "de_CH", lang: "en", fallback: true });
  assert.deepEqual(reportLanguage(""), { locale: "en", lang: "en", fallback: false });
}

/* ---------------- 3. the model ---------------- */
const CHECKS_START = JSON.stringify([{ id: "schema", status: "BAD" }, { id: "llms", status: "BAD" }, { id: "ai_crawlers_allowed", status: "OK" }, { id: "coverage", status: "WARN" }]);
const CHECKS_END = JSON.stringify([{ id: "schema", status: "WARN" }, { id: "llms", status: "OK" }, { id: "ai_crawlers_allowed", status: "OK" }, { id: "coverage", status: "BAD" }]);
const SCORES = [
  { scanned_at: "2026-09-29T00:00:00.000Z", score: 55, checks_json: CHECKS_START },
  { scanned_at: "2026-10-05T00:00:00.000Z", score: 60, checks_json: CHECKS_START },
  { scanned_at: "2026-10-28T00:00:00.000Z", score: 71, checks_json: CHECKS_END },
];
const FREE = { status: "done", finished_at: "2026-10-12T04:00:00.000Z", result_json: JSON.stringify({
  asked: 3, answered: 3, appeared: 0,
  questions: [{ question: "Best cafe in <b>Shibuya</b>?", answered: true, named: false, cited: false }, { question: "q2", answered: true, named: false, cited: false }, { question: "q3", answered: false }],
  competitors: [{ label: "<img src=x onerror=alert(1)>" }, { label: "Rival Cafe" }],
}) };
const OFFSITE = { ran_at: Date.parse("2026-10-20T00:00:00Z"), sources: [{ id: "google", status: "mismatch", fields: { phone: { status: "mismatch" }, hours: { status: "variant" }, name: { status: "match" } } }] };
const BRANDING = { account_id: 1, display_name: "Acme <Digital> & Co", brand_color: "#0a7d5a", contact_email: "hello@acme.test", contact_url: "https://acme.test/", footer_text: "Line one\n<script>x</script>", logo_hash: "a".repeat(40), hide_powered_by: true };
const NOW = Date.parse("2026-11-02T05:00:00Z");
{
  const model = buildAgencyReport({ site: { id: "s1", website_uri: "https://shop.test/" }, plan: "free", month: "2026-10", locale: "en", scores: SCORES, freeCheck: FREE, offsite: OFFSITE, branding: BRANDING, now: NOW });
  assert.equal(model.month, "2026-10");
  assert.equal(model.score.latest, 71);
  assert.equal(model.score.delta, 16, "change against the last score of the previous month");
  assert.equal(model.score.samples, 2, "only the month's scans are counted");
  assert.deepEqual(model.fixed.map((f) => f.id), ["llms"], "fixed: not passing at the start, passing at the end");
  assert.deepEqual(model.open.map((f) => [f.id, f.status]), [["coverage", "bad"], ["schema", "warn"]], "open: problems first");
  assert.ok(model.open.every((f) => f.label && f.label !== f.id), "checks are named in words");
  assert.equal(model.ai.kind, "free");
  assert.equal(model.ai.appeared, 0);
  assert.deepEqual(model.offsite, { status: "mismatch", fields: ["phone", "hours"], checked_at: OFFSITE.ran_at });
  assert.deepEqual(model.next, ["nextFix", "nextFaq", "nextListing", "nextKeep"]);
  assert.equal(model.powered_by, true, "Free keeps Powered by Nurevo even when the agency asked to hide it");
  assert.equal(showPoweredBy("standard", BRANDING), true);
  assert.deepEqual([...POWERED_BY_REMOVABLE_PLANS], ["pro"]);
  assert.equal(showPoweredBy("pro", BRANDING), false, "a Pro site may hide it");
  assert.equal(showPoweredBy("pro", null), true);
  assert.equal(model.brand.name, "Acme <Digital> & Co");

  const empty = buildAgencyReport({ site: { id: "s1", url: "shop.test" }, plan: "standard", month: "2026-10", now: NOW });
  assert.equal(empty.score.available, false);
  assert.equal(empty.ai.kind, "free_none");
  assert.deepEqual(empty.next, ["nextRun", "nextKeep"]);
  assert.equal(empty.brand.agency, false, "no agency brand: Nurevo");
  assert.equal(empty.brand.name, "Nurevo");
  assert.equal(buildAgencyReport({ now: NOW }).month, "2026-10", "the default month is the previous one");
  assert.equal(previousMonthKey(Date.parse("2027-01-02T00:00:00Z")), "2026-12", "January reports on December");

  const pro = buildAgencyReport({ site: { id: "s2", url: "pro.test" }, plan: "pro", month: "2026-10", now: NOW, sov: [
    { ran_at: "2026-09-25T00:00:00Z", appearance_rate: 0.2, citation_rate: 0.1, answers_received: 20, detail_json: JSON.stringify({ headline: { engine: "perplexity" } }) },
    { ran_at: "2026-10-25T00:00:00Z", appearance_rate: 0.35, citation_rate: 0.15, answers_received: 24, competitors_json: JSON.stringify([{ host: "rival.test" }]), detail_json: JSON.stringify({ headline: { engine: "perplexity" } }) },
    { ran_at: "2026-11-01T00:00:00Z", appearance_rate: 0.9, citation_rate: 0.9, answers_received: 24 },
  ] });
  assert.equal(pro.ai.kind, "pro");
  assert.equal(pro.ai.appearance_rate, 0.35, "the month's last run, not a later one");
  assert.equal(pro.ai.delta, 0.15);
  assert.deepEqual(pro.ai.competitors, ["rival.test"]);
  assert.equal(buildAgencyReport({ plan: "pro", month: "2026-10", now: NOW }).ai.kind, "pro_none");
}

/* ---------------- 4. rendering, per language ---------------- */
{
  for (const locale of [...REPORT_BODY_LANGS, "pt_BR", "ar", "zh_HK"]) {
    const model = buildAgencyReport({ site: { id: "s1", website_uri: "https://shop.test/" }, plan: "free", month: "2026-10", locale, scores: SCORES, freeCheck: FREE, offsite: OFFSITE, branding: BRANDING, now: NOW });
    const c = REPORT_COPY[model.lang];
    const html = renderAgencyReportHtml(model, { origin: "https://nurevo.jp" });
    const mail = agencyReportEmail(model, { origin: "https://nurevo.jp", unsubscribeUrl: "https://nurevo.jp/api/email/report-unsubscribe?t=abc&l=en" });
    for (const [name, out] of [["html", html], ["email html", mail.html], ["text", mail.text], ["subject", mail.subject]]) {
      assert.ok(!/\{\w+\}/.test(out), `${locale} ${name}: every placeholder filled`);
    }
    assert.ok(html.includes(htmlEsc(c.title)) && html.includes(htmlEsc(c.notice)) && html.includes(htmlEsc(c.nextHeading)), `${locale}: title, notice, next actions`);
    assert.ok(html.includes("Powered by Nurevo"), `${locale}: Powered by Nurevo`);
    assert.ok(html.includes("@page{size:A4") && html.includes("@media print"), `${locale}: A4 print CSS`);
    assert.ok(!html.includes("<script") && !mail.html.includes("<script"), `${locale}: no script anywhere (the footer's <script> is text)`);
    assert.ok(html.includes("&lt;script&gt;x&lt;/script&gt;"), `${locale}: the footer is escaped`);
    assert.ok(html.includes("Acme &lt;Digital&gt; &amp; Co") && !html.includes("<Digital>"), `${locale}: the agency name is escaped`);
    assert.ok(html.includes("Best cafe in &lt;b&gt;Shibuya&lt;/b&gt;?") && !html.includes("<img src=x"), `${locale}: answer text escaped`);
    assert.ok(html.includes(`https://nurevo.jp/api/agency/logo/${"a".repeat(40)}`), `${locale}: the uploaded logo by its hash URL`);
    assert.ok(html.includes("background:#0a7d5a") && html.includes(".rp-sec h2{border-left-color:#0a7d5a}"), `${locale}: the brand colour`);
    assert.ok(mail.html.includes(htmlEsc(c.unsubscribe)) && mail.text.includes("report-unsubscribe?t=abc"), `${locale}: unsubscribe link`);
    assert.ok(mail.html.includes(htmlEsc(c.emailWhy.split("{")[0])), `${locale}: why the recipient gets it`);
    assert.ok(!/[\r\n]/.test(mail.subject), `${locale}: one-line subject`);
    if (model.lang === "en" && locale !== "en") assert.ok(html.startsWith('<!doctype html><html lang="en-US">'), `${locale}: English body, English lang`);
  }
  const ja = renderAgencyReportHtml(buildAgencyReport({ month: "2026-10", locale: "ja", scores: SCORES, now: NOW }));
  assert.ok(ja.includes('lang="ja-JP"') && ja.includes("2026年10月"), "Japanese month");
  const de = agencyReportEmail(buildAgencyReport({ site: { url: "shop.test" }, month: "2026-10", locale: "de", now: NOW }));
  assert.equal(de.subject, "shop.test: KI-Sichtbarkeitsbericht für Oktober 2026");
  assert.equal(agencyFrom("Acme Digital", "Nurevo <reports@nurevo.jp>"), '"Acme Digital via Nurevo" <reports@nurevo.jp>');
  assert.equal(agencyFrom('Evil" <x@evil.test>\r\nBcc: a@b.c', "reports@nurevo.jp"), '"Evil x@evil.test Bcc: a@b.c via Nurevo" <reports@nurevo.jp>', "the name cannot add an address or a header");
  assert.equal(agencyFrom("", "Nurevo <reports@nurevo.jp>"), '"Nurevo" <reports@nurevo.jp>');
}

/* ---------------- 5. endpoints ---------------- */
{
  const { sqlite, env } = makeEnv();
  assert.equal((await call(env, "GET", "/api/agency/branding", { token: null })).status, 401, "signed out");
  const empty = await (await call(env, "GET", "/api/agency/branding")).json();
  assert.equal(empty.available, true);
  assert.equal(empty.branding, null);
  assert.equal(empty.can_edit, true);
  assert.equal((await call(env, "PUT", "/api/agency/branding", { body: BRAND, csrf: false })).status, 403, "PUT needs the CSRF token");
  assert.equal((await call(env, "PUT", "/api/agency/branding", { token: "viewer", body: BRAND })).status, 403, "a viewer cannot change the brand");
  const invalid = await call(env, "PUT", "/api/agency/branding", { body: { ...BRAND, brand_color: "blue", logo_url: "http://x.test/l.png" } });
  assert.equal(invalid.status, 400);
  assert.deepEqual((await invalid.json()).fields, ["logo_url", "brand_color"]);
  const saved = await (await call(env, "PUT", "/api/agency/branding", { body: BRAND })).json();
  assert.equal(saved.branding.display_name, "Acme Digital");
  assert.match(saved.branding.logo_src, /^\/api\/agency\/logo\/[a-f0-9]{40}$/);
  assert.ok(!("logo_data" in saved.branding), "the logo bytes are not echoed");
  const logo = await call(env, "GET", saved.branding.logo_src, { token: null });
  assert.equal(logo.status, 200, "the logo is public (email clients load it)");
  assert.equal(logo.headers.get("content-type"), "image/png");
  assert.equal(logo.headers.get("x-content-type-options"), "nosniff");
  assert.match(logo.headers.get("content-security-policy"), /sandbox/);
  assert.deepEqual(Buffer.from(await logo.arrayBuffer()), PNG);
  assert.equal((await call(env, "GET", "/api/agency/logo/" + "0".repeat(40), { token: null })).status, 404);
  assert.equal((await call(env, "GET", "/api/agency/logo/ABC%3Cx%3E", { token: null })).status, 404);
  // Saving again without a new upload keeps the logo; removing clears it.
  const kept = await (await call(env, "PUT", "/api/agency/branding", { body: { ...BRAND, logo_upload: undefined } })).json();
  assert.equal(kept.branding.logo_hash, saved.branding.logo_hash);
  const removed = await (await call(env, "PUT", "/api/agency/branding", { body: { ...BRAND, logo_upload: undefined, logo_remove: true } })).json();
  assert.equal(removed.branding.logo_hash, null);
  await call(env, "PUT", "/api/agency/branding", { body: BRAND });

  // Report settings
  assert.equal((await call(env, "GET", "/api/sites/s3/report-settings")).status, 403, "another org's site");
  assert.equal((await call(env, "GET", "/api/sites/nope/report-settings")).status, 404);
  assert.equal((await call(env, "GET", "/api/sites/s3/agency-report?format=html")).status, 403, "another org's report");
  const first = await (await call(env, "GET", "/api/sites/s1/report-settings")).json();
  assert.equal(first.settings.enabled, false, "off by default");
  assert.equal(first.brand.agency, true, "the agency's own brand applies to its sites");
  assert.equal(first.brand.name, "Acme Digital");
  const SETTINGS = { enabled: true, recipients: ["client@cafe.test", "boss@cafe.test"], locale: "ja", branding_source: "agency", consent: true };
  const noConsent = await call(env, "PUT", "/api/sites/s1/report-settings", { body: { ...SETTINGS, consent: false } });
  assert.equal(noConsent.status, 400);
  assert.deepEqual((await noConsent.json()).fields, ["consent_required"]);
  assert.equal((await call(env, "PUT", "/api/sites/s1/report-settings", { body: SETTINGS, csrf: false })).status, 403, "CSRF");
  assert.equal((await call(env, "PUT", "/api/sites/s1/report-settings", { token: "viewer", body: SETTINGS })).status, 403, "viewer");
  assert.equal((await call(env, "PUT", "/api/sites/s3/report-settings", { body: SETTINGS })).status, 403, "another org's site");
  const badEmail = await call(env, "PUT", "/api/sites/s1/report-settings", { body: { ...SETTINGS, recipients: ["ok@x.test", "nope"] } });
  assert.deepEqual(await badEmail.json(), { error: "invalid_settings", fields: ["recipients_invalid"], invalid: ["nope"] });
  const put = await (await call(env, "PUT", "/api/sites/s1/report-settings", { body: SETTINGS })).json();
  assert.equal(put.settings.enabled, true);
  assert.deepEqual(put.settings.recipients, ["client@cafe.test", "boss@cafe.test"]);
  assert.ok(put.settings.consent_at > 0, "the consent confirmation is recorded");
  assert.equal(sqlite.prepare("SELECT consent_by FROM agency_report_settings WHERE site_id='s1'").get().consent_by, "m1", "and by whom");
  assert.equal(put.next_send_on.slice(8), "01", "next send: the 1st of next month");
  const viewerRead = await (await call(env, "GET", "/api/sites/s1/report-settings", { token: "viewer" })).json();
  assert.equal(viewerRead.can_edit, false, "a viewer reads but cannot edit");

  // Preview
  const preview = await call(env, "GET", "/api/sites/s1/agency-report?format=html&month=2026-10");
  assert.equal(preview.status, 200);
  assert.equal(preview.headers.get("content-type"), "text/html; charset=utf-8");
  const csp = preview.headers.get("content-security-policy");
  assert.ok(csp.includes("default-src 'none'") && !/script-src/.test(csp), "no script may run in the report page");
  assert.ok(csp.includes("frame-ancestors 'self'"), "only the dashboard may frame it");
  const page = await preview.text();
  assert.ok(page.includes('lang="ja-JP"') && page.includes("Acme Digital") && page.includes(REPORT_COPY.ja.title), "the saved language and the agency brand");
  assert.ok(page.includes('src="/api/agency/logo/'), "the uploaded logo, same origin");
  const en = await (await call(env, "GET", "/api/sites/s1/agency-report?format=html&month=2026-10&lang=pt_BR")).text();
  assert.ok(en.includes('lang="en-US"'), "a preview in another language: English body for pt_BR");
  const nurevo = await (await call(env, "GET", "/api/sites/s1/agency-report?format=json&brand=nurevo")).json();
  assert.equal(nurevo.report.brand.agency, false);
  const future = await (await call(env, "GET", "/api/sites/s1/agency-report?month=2999-01")).json();
  assert.equal(future.report.month, previousMonthKey(Date.now()), "a future month falls back to the previous one");
  assert.equal((await call(env, "GET", "/api/sites/s1/agency-report", { token: null })).status, 401);

  // Brand resolution: an owner referred by an approved partner gets the partner's brand.
  sqlite.exec(`INSERT INTO accounts(member_id,email,created_at) VALUES('m5','partner@agency2.test',5);
    UPDATE accounts SET partner_status='approved', partner_approved_at=10 WHERE member_id='m5';
    INSERT INTO accounts(member_id,email,created_at,referred_by_account_id) VALUES('m4','owner@cafe.test',4,(SELECT id FROM accounts WHERE member_id='m5'));
    INSERT INTO agency_branding(account_id,display_name,brand_color,updated_at) VALUES((SELECT id FROM accounts WHERE member_id='m5'),'Partner Two','#222222',1);`);
  const s4 = { id: "s4", owner_member_id: "m4", org_id: "o3", url: "cafe.test" };
  const { resolveBranding } = await import("../worker/agency-report.mjs");
  assert.equal((await resolveBranding(env, s4, null)).display_name, "Partner Two", "the referring approved partner's brand");
  sqlite.exec("UPDATE accounts SET partner_status='rejected' WHERE member_id='m5'");
  assert.equal(await resolveBranding(env, s4, null), null, "a revoked partner's brand is not used");
  // A brand chosen by a member who later lost access is not used at send time.
  const acme = sqlite.prepare("SELECT id FROM accounts WHERE member_id='m1'").get().id;
  const canManage = async (_env, accountId) => accountId !== acme;
  assert.equal(await resolveBranding(env, { id: "s9", url: "x.test" }, { branding_source: "agency", brand_account_id: acme }, { canManage }), null);
  assert.equal((await resolveBranding(env, { id: "s9", url: "x.test" }, { branding_source: "agency", brand_account_id: acme }, { canManage: async () => true })).display_name, "Acme Digital");
}

/* ---------------- 6. monthly email ---------------- */
function fakeResend(script = () => 200) {
  const sent = [];
  const fetchImpl = async (url, init) => {
    assert.equal(String(url), "https://api.resend.com/emails", "only the email provider is called");
    const body = JSON.parse(init.body);
    sent.push({ body, headers: init.headers });
    const status = script(body, sent.length);
    return new Response(JSON.stringify(status === 200 ? { id: `e${sent.length}` } : { name: `http_${status}` }), { status });
  };
  return { sent, fetchImpl };
}
async function setup() {
  const made = makeEnv();
  await call(made.env, "PUT", "/api/agency/branding", { body: BRAND });
  await call(made.env, "PUT", "/api/sites/s1/report-settings", { body: { enabled: true, recipients: ["client@cafe.test", "boss@cafe.test"], locale: "de", branding_source: "agency", consent: true } });
  // Both addresses confirmed (the confirmation flow itself: test-agency-report-abuse.mjs).
  made.sqlite.exec("UPDATE agency_report_recipients SET status='confirmed', confirmed_at=1");
  made.sqlite.exec(`INSERT INTO aeo_scores(site_id,scanned_at,score,verdict,checks_json) VALUES('s1','2026-10-28T00:00:00.000Z',71,'yellow','${CHECKS_END}')`);
  return made;
}
const batch = (env, now, opts = {}, lines = []) => quiet(() => runAgencyReportBatch(env, { now, spacingMs: 0, ...opts }), lines);
{
  const { sqlite, env } = await setup();
  const mail = fakeResend();
  assert.equal((await batch(env, Date.parse("2026-11-04T01:00:00Z"), { fetchImpl: mail.fetchImpl })).status, "outside_send_window", "only on the 1st-3rd");
  assert.equal(mail.sent.length, 0);
  const lines = [];
  const first = await batch(env, NOW, { fetchImpl: mail.fetchImpl }, lines);
  assert.equal(first.month, "2026-10");
  assert.equal(first.sent, 2);
  assert.equal(mail.sent.length, 2, "one message per recipient");
  for (const { body, headers } of mail.sent) {
    assert.equal(body.to.length, 1, "each message has exactly one recipient; nobody sees another address");
    assert.equal(body.from, '"Acme Digital via Nurevo" <reports@nurevo.jp>', "From: the agency via Nurevo, on the verified address");
    assert.equal(body.reply_to, "hello@acme.test", "Reply-To: the agency contact");
    assert.match(body.headers["List-Unsubscribe"], /^<https:\/\/nurevo\.jp\/api\/email\/report-unsubscribe\?t=[^>]+&l=de>$/);
    assert.equal(body.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
    assert.match(headers["idempotency-key"], /^nurevo-agency-report-s1-2026-10-[a-f0-9]{16}$/);
    assert.ok(body.subject.includes("KI-Sichtbarkeitsbericht") && body.subject.includes("Oktober 2026"), "German subject for the saved language");
    assert.ok(body.html.includes("Acme Digital") && body.html.includes("Powered by Nurevo") && body.text.includes("71 / 100"));
    const other = body.to[0] === "client@cafe.test" ? "boss@cafe.test" : "client@cafe.test";
    assert.ok(!body.html.includes(other) && !body.text.includes(other), "a recipient never sees the other recipient");
    assert.ok(!body.html.includes("else.test"), "nor another client's site");
  }
  assert.ok(!lines.join("\n").includes("@cafe.test"), "no recipient address in the logs");
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM agency_report_sends WHERE site_id='s1' AND month='2026-10' AND status='sent'").get().n, 2);
  assert.equal(sqlite.prepare("SELECT status FROM agency_report_sends WHERE site_id='s1' AND month='2026-10' AND email='*'").get().status, "done");
  const again = await batch(env, NOW + 3600e3, { fetchImpl: mail.fetchImpl });
  assert.equal(again.sites, 0, "a finished site is not even selected again");
  assert.equal(mail.sent.length, 2, "idempotent: no resend in the same month");
  // A recipient added later in the window still gets the month's report, once.
  sqlite.exec("DELETE FROM agency_report_sends WHERE email='*'");
  await batch(env, NOW + 7200e3, { fetchImpl: mail.fetchImpl });
  assert.equal(mail.sent.length, 2, "already-claimed recipients are skipped even without the site marker");
  // Month rollover, and the year.
  await batch(env, Date.parse("2026-12-01T00:30:00Z"), { fetchImpl: mail.fetchImpl });
  assert.equal(mail.sent.length, 4, "November's report on December 1st");
  assert.ok(mail.sent[3].body.subject.includes("November 2026"));
  await batch(env, Date.parse("2027-01-03T23:00:00Z"), { fetchImpl: mail.fetchImpl });
  assert.equal(mail.sent.length, 6, "December's report in January");
  assert.ok(mail.sent[5].body.subject.includes("Dezember 2026"));
  assert.ok(mail.sent[5].headers["idempotency-key"].includes("-2026-12-"));
}
{
  // 429: the claim is released and the run stops; the next run sends it.
  const { sqlite, env } = await setup();
  const limited = fakeResend((_, n) => (n === 1 ? 429 : 200));
  const r1 = await batch(env, NOW, { fetchImpl: limited.fetchImpl });
  assert.equal(r1.status, "rate_limited");
  assert.equal(r1.sent, 0);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM agency_report_sends").get().n, 0, "nothing left claimed");
  const r2 = await batch(env, NOW + 3600e3, { fetchImpl: limited.fetchImpl });
  assert.equal(r2.sent, 2);
  // Any other failure is not retried (the provider may have accepted it).
  const { sqlite: db2, env: env2 } = await setup();
  const broken = fakeResend((body) => (body.to[0] === "boss@cafe.test" ? 500 : 200));
  const r3 = await batch(env2, NOW, { fetchImpl: broken.fetchImpl });
  assert.equal(r3.failed, 1);
  assert.equal(db2.prepare("SELECT status FROM agency_report_sends WHERE email='boss@cafe.test'").get().status, "failed");
  await batch(env2, NOW + 3600e3, { fetchImpl: broken.fetchImpl });
  assert.equal(broken.sent.length, 2, "the failed one is not sent again");
  // Per-run email cap: the rest goes in the next run.
  const { env: env3 } = await setup();
  const capped = fakeResend();
  const r4 = await batch(env3, NOW, { fetchImpl: capped.fetchImpl, emailsPerRun: 1 });
  assert.equal(r4.status, "email_limit");
  assert.equal(capped.sent.length, 1);
  await batch(env3, NOW + 3600e3, { fetchImpl: capped.fetchImpl, emailsPerRun: 1 });
  assert.equal(capped.sent.length, 2);
  // Pacing between messages.
  const { env: env4 } = await setup();
  const waits = [];
  await batch(env4, NOW, { fetchImpl: fakeResend().fetchImpl, spacingMs: 550, sleep: async (ms) => { waits.push(ms); } });
  assert.deepEqual(waits, [550, 550], "paced like the other mail");
}
{
  // Disabled, no consent, stopped: nothing is sent. No mail config: skipped.
  const { sqlite, env } = await setup();
  sqlite.exec(`UPDATE agency_report_settings SET enabled=0 WHERE site_id='s1';
    INSERT INTO agency_report_settings(site_id,enabled,recipients_json,locale,updated_at) VALUES('s2',1,'["x@pro.test"]','en',1);
    INSERT INTO agency_report_settings(site_id,enabled,recipients_json,locale,consent_at,updated_at) VALUES('s5',1,'["x@stopped.test"]','en',1,1);`);
  const mail = fakeResend();
  const result = await batch(env, NOW, { fetchImpl: mail.fetchImpl });
  assert.equal(result.sites, 0);
  assert.equal(mail.sent.length, 0, "disabled, no-consent and stopped sites are not sent");
  assert.equal((await batch({ ...env, RESEND_API_KEY: "" }, NOW)).status, "mail_not_configured");
  assert.equal((await batch({ ...env, EMAIL_UNSUBSCRIBE_SECRET: "" }, NOW)).status, "unsubscribe_secret_missing", "never sent without a working unsubscribe link");
  // A Nurevo-branded report has no Reply-To and plain "Nurevo" as the name.
  sqlite.exec("UPDATE agency_report_settings SET enabled=1, branding_source='nurevo', brand_account_id=NULL WHERE site_id='s1'");
  sqlite.exec("DELETE FROM agency_branding");
  await batch(env, NOW, { fetchImpl: mail.fetchImpl });
  assert.equal(mail.sent[0].body.from, '"Nurevo" <reports@nurevo.jp>');
  assert.equal(mail.sent[0].body.reply_to, undefined);
}

/* ---------------- 7. unsubscribe ---------------- */
{
  const { sqlite, env } = await setup();
  sqlite.exec(`INSERT INTO agency_report_settings(site_id,enabled,recipients_json,locale,consent_at,updated_at,account_id) VALUES('s2',1,'["client@cafe.test"]','en',1,1,(SELECT id FROM accounts WHERE member_id='m1'));
    INSERT INTO agency_report_recipients(site_id,email,status,confirmed_at,created_at) VALUES('s2','client@cafe.test','confirmed',1,1);`);
  const token = await reportUnsubscribeToken(env, "s1", "Client@Cafe.test");
  const path = `${REPORT_UNSUBSCRIBE_PATH}?t=${encodeURIComponent(token)}&l=de`;
  const get = await call(env, "GET", path, { token: null });
  assert.equal(get.status, 200);
  const page = await get.text();
  assert.ok(page.includes(REPORT_COPY.de.unsubButton) && page.includes("shop.test"), "a German confirm page naming the site");
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM agency_report_opt_outs").get().n, 0, "GET records nothing (mail scanners open links)");
  const post = await call(env, "POST", path, { token: null, csrf: false });
  assert.equal(post.status, 200, "one-click POST works without a session or CSRF token");
  assert.ok((await post.text()).includes(REPORT_COPY.de.unsubDone));
  assert.deepEqual({ ...sqlite.prepare("SELECT site_id,email FROM agency_report_opt_outs").get() }, { site_id: "s1", email: "client@cafe.test" });
  const mail = fakeResend();
  const result = await batch(env, NOW, { fetchImpl: mail.fetchImpl });
  assert.equal(result.suppressed, 1);
  assert.deepEqual(mail.sent.map((m) => m.body.to[0]).sort(), ["boss@cafe.test", "client@cafe.test"], "suppressed for s1 only; the same address still gets s2's report");
  assert.ok(mail.sent.find((m) => m.body.to[0] === "client@cafe.test").body.subject.includes("pro.test"));
  const settings = await (await call(env, "GET", "/api/sites/s1/report-settings")).json();
  assert.deepEqual(settings.opted_out, ["client@cafe.test"], "the agency sees who unsubscribed");
  // Tampered and foreign tokens.
  const [site, email, mac] = token.split(".");
  const forged = `${Buffer.from("s2").toString("base64url")}.${email}.${mac}`;
  assert.equal((await call(env, "POST", `${REPORT_UNSUBSCRIBE_PATH}?t=${forged}`, { token: null, csrf: false })).status, 400, "the site cannot be swapped");
  assert.equal((await call(env, "GET", `${REPORT_UNSUBSCRIBE_PATH}?t=${site}.${email}`, { token: null })).status, 400);
  const otherSecret = await reportUnsubscribeToken({ EMAIL_UNSUBSCRIBE_SECRET: "other" }, "s1", "boss@cafe.test");
  assert.equal((await call(env, "POST", `${REPORT_UNSUBSCRIBE_PATH}?t=${encodeURIComponent(otherSecret)}`, { token: null, csrf: false })).status, 400);
  assert.equal((await call(env, "PUT", path, { token: null })).status, 405);
}

/* ---------------- 8. before 0046 ---------------- */
{
  const { env } = makeEnv({ migrated: false });
  const brand = await call(env, "GET", "/api/agency/branding");
  assert.equal(brand.status, 200);
  assert.deepEqual(await brand.json(), { available: false, reason: "migration_pending" });
  assert.equal((await call(env, "PUT", "/api/agency/branding", { body: BRAND })).status, 503);
  assert.deepEqual(await (await call(env, "GET", "/api/sites/s1/report-settings")).json(), { available: false, reason: "migration_pending" });
  assert.equal((await call(env, "PUT", "/api/sites/s1/report-settings", { body: { enabled: false } })).status, 503);
  assert.equal((await call(env, "GET", "/api/sites/s1/agency-report?format=html")).status, 200, "the preview endpoint answers (JSON: unavailable)");
  assert.equal((await batch(env, NOW)).status, "migration_pending");
  assert.equal((await call(env, "GET", "/api/agency/logo/" + "a".repeat(40), { token: null })).status, 404);
  const token = await reportUnsubscribeToken(env, "s1", "x@y.test");
  assert.equal((await call(env, "POST", `${REPORT_UNSUBSCRIBE_PATH}?t=${encodeURIComponent(token)}`, { token: null, csrf: false })).status, 503, "an unsubscribe is not lost silently");
  const noAccounts = makeEnv({ accounts: false }).env;
  assert.deepEqual(await (await call(noAccounts, "GET", "/api/agency/branding")).json(), { available: false, reason: "migration_pending" }, "before 0030 too");
  // The rest of the dashboard keeps working.
  assert.equal((await call(env, "GET", "/api/sites/s1/monthly-report")).status, 200);
  assert.equal((await quiet(() => runBatchRaw(env, { now: Date.parse("2026-11-20T00:00:00Z") }))).status, "outside_send_window");
}

/* ---------------- 9. the dashboard and the wiring ---------------- */
{
  const read = (file) => readFileSync(new URL(`../public/${file}`, import.meta.url), "utf8");
  const html = read("dashboard.html");
  assert.ok(html.includes('<script src="/dashboard-agency-report.js'), "the dashboard loads the module");
  assert.ok(html.includes('<div id="agency-branding-slot"></div>'), "the partner page has the branding slot");
  assert.ok(SCHEDULED_JOBS[HOURLY_CRON].includes("agency-reports"), "the hourly cron sends the reports");
  assert.ok(readFileSync(new URL("../worker/index.mjs", import.meta.url), "utf8").includes('"agency-reports": (env) => runAgencyReportBatch(env),'));
  const SRC = read("dashboard-agency-report.js");
  const { I } = loadDictionary();
  function load(lang) {
    const el = () => ({ className: "", innerHTML: "", dataset: {}, addEventListener() {}, querySelector: () => null, setAttribute() {} });
    const sandbox = {
      t: (k) => (I[lang] || I.ja)[k] || I.ja[k] || k,
      document: { createElement: el, querySelector: () => null, addEventListener() {}, head: { appendChild() {} }, documentElement: { lang } },
      location: { hash: "" }, MutationObserver: class { observe() {} }, setTimeout() {},
      fetch: async () => { throw new Error("render only"); },
      Number, Math, String, Date, JSON, Array, Object, console, Promise,
    };
    sandbox.window = sandbox;
    sandbox.window.nrvI18n = { locales: [["ja", "日本語"], ["en", "English (US)"], ["pt_BR", "Português (Brasil)"]], lang: () => lang };
    vm.createContext(sandbox);
    vm.runInContext(SRC.replace(/\}\)\(\);\s*$/, "  window.__x = { brandingCard: brandingCard, reportCard: reportCard };\n})();"), sandbox);
    return sandbox.window.__x;
  }
  const BRAND_VIEW = { available: true, can_edit: true, branding: { display_name: "<b>Acme</b>", logo_src: "/api/agency/logo/" + "a".repeat(40), logo_hash: "a".repeat(40), brand_color: "#0a7d5a", contact_email: "hello@acme.test", footer_text: "<script>x</script>" }, limits: { logo_max_bytes: 65536 } };
  const REPORT_VIEW = { available: true, can_edit: true, settings: { enabled: true, recipients: ["client@cafe.test", "<x>@y.test"], locale: "pt_BR", branding_source: "agency" }, opted_out: ["client@cafe.test"], last_sent: { month: "2026-10", recipients: 2 }, next_send_on: "2026-12-01", brand: { agency: false, name: "Nurevo" }, has_own_branding: false, max_recipients: 5,
    recipients_status: [{ email: "client@cafe.test", status: "opted_out" }, { email: "<x>@y.test", status: "pending" }, { email: "ok@y.test", status: "confirmed" }], eligibility: { ok: false, reason: "plan_or_partner" } };
  for (const lang of LANGS) {
    const x = load(lang);
    const b = x.brandingCard(BRAND_VIEW).innerHTML;
    const r = x.reportCard(REPORT_VIEW, "s1").innerHTML;
    for (const [name, out] of [["branding", b], ["report", r]]) {
      assert.ok(!/\b(?:ag|cr)[A-Z]\w*\b/.test(out.replace(/class="[^"]*"/g, "").replace(/data-[\w-]+/g, "")), `${lang}/${name}: no raw key`);
      assert.ok(!/\{\w+\}/.test(out), `${lang}/${name}: placeholders filled`);
    }
    assert.ok(b.includes(htmlEsc(I[lang].agHeading)) && r.includes(htmlEsc(I[lang].crHeading)), `${lang}: headings`);
    assert.ok(r.includes(htmlEsc(I[lang].crConsent)), `${lang}: the consent confirmation`);
    assert.ok(r.includes(htmlEsc(I[lang].crNoBrand.replace("{tab}", I[lang].partner))), `${lang}: the no-brand hint names the Partner page`);
    assert.ok(r.includes('value="pt_BR" selected'), `${lang}: any dashboard locale can be chosen`);
    assert.ok(!b.includes("<b>Acme") && !b.includes("<script>") && !r.includes("<x>"), `${lang}: values escaped`);
    assert.ok(r.includes(htmlEsc(I[lang].crPrint)) && r.includes(htmlEsc(I[lang].crPreview)), `${lang}: preview and print`);
    for (const key of ["crStatusConfirmed", "crStatusPending", "crStatusOptedOut", "crNotEligible", "crConfirmNote"]) assert.ok(r.includes(htmlEsc(I[lang][key])), `${lang}: ${key} (double opt-in status, eligibility)`);
  }
  assert.ok(SRC.includes('frame.setAttribute("sandbox", "")'), "the preview frame is sandboxed without scripts");
}

console.log("agency report tests passed (validation, languages, model, rendering in 8 languages + fallback, endpoints/auth/CSRF, brand resolution, monthly email idempotency/rollover/429/failures/pacing, unsubscribe, pre-migration, dashboard cards)");
