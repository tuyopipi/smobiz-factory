/**
 * Regression: the white-label agency report must not be usable to send spam
 * or phishing from Nurevo's address (review of PR #35).
 *
 *   A. eligibility: only connected sites on a paid plan, or set up by an
 *      approved partner, can switch the report on, and the cron re-checks it
 *   B. double opt-in: each new address gets a localized confirmation email
 *      ("<Agency> via Nurevo wants to send you monthly reports for <site>")
 *      with an HMAC-signed, expiring link; reports go only to confirmed
 *      addresses; the dashboard shows pending / confirmed
 *   C. confirmation emails are capped per site and per account per day, and
 *      a pending address is asked at most once a day
 *   D. reserved brand / institution names are refused as agency names
 *   E. global suppression: "all Nurevo reports" on the unsubscribe page stops
 *      every report and confirmation to that address; kept on site deletion
 *   F. report emails are capped per account per month
 *   G. deleting a site deletes its report settings, recipients, opt-outs and
 *      send ledger
 * Real SQLite with the real schema and migrations; the email provider is a
 * fake, nothing reaches the network.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  REPORT_CONFIRM_PATH, REPORT_CONFIRM_TTL_MS, REPORT_UNSUBSCRIBE_PATH, RESERVED_BRAND_TERMS, reportConfirmToken, reportUnsubscribeToken,
  requestConfirmations, reservedBrandTerm, loadReportSettings, validateBranding,
} from "../worker/agency-report.mjs";
import { REPORT_CONSENT_COPY } from "../worker/agency-report-i18n.mjs";
import { handleApi, runAgencyReportBatch } from "../worker/api.mjs";

const sql = (file) => readFileSync(new URL(`../nurevo-impl/db/${file}`, import.meta.url), "utf8");
const sha = (v) => createHash("sha256").update(v).digest("hex");
const CSRF = "c".repeat(64);
const NOW = Date.parse("2026-11-02T05:00:00Z");
const DAY = 86400e3;

const MAIL = [];
let mailStatus = 200;
globalThis.fetch = async (url, init) => {
  if (String(url) === "https://api.resend.com/emails") {
    MAIL.push({ body: JSON.parse(init.body), headers: init.headers });
    return new Response(JSON.stringify({ id: `e${MAIL.length}` }), { status: mailStatus });
  }
  throw new Error(`unexpected fetch ${url}`);
};
const quiet = async (fn) => {
  const saved = [console.log, console.warn, console.error];
  console.log = console.warn = console.error = () => {};
  try { return await fn(); } finally { [console.log, console.warn, console.error] = saved; }
};

function makeEnv(extra = {}) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(sql("schema.sql"));
  for (const stmt of ["ALTER TABLE sites ADD COLUMN manual_plan TEXT", "ALTER TABLE orgs ADD COLUMN manual_plan TEXT", "ALTER TABLE sites ADD COLUMN bound_at INTEGER", "ALTER TABLE sites ADD COLUMN domain_key TEXT"]) {
    try { sqlite.exec(stmt); } catch { /* already there */ }
  }
  for (const f of ["0029_member_email_preferences.sql", "0030_account_referrals.sql", "0040_partner_approval_first_customer.sql", "0046_agency_branding.sql"]) sqlite.exec(sql(f));
  const later = Date.now() + 3.6e6;
  sqlite.exec(`INSERT INTO orgs(id) VALUES('o1'); INSERT INTO orgs(id) VALUES('o2');
    INSERT INTO members(id,org_id,email,role,status,created_at) VALUES('m1','o1','agency@acme.test','admin','active',1);
    INSERT INTO members(id,org_id,email,role,status,created_at) VALUES('m2','o2','spammer@bad.test','admin','active',2);
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("agency")}','m1','o1','session',${later});
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("spammer")}','m2','o2','session',${later});
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,owner_member_id,bound_at,created_at) VALUES('std','o1','shop.test','https://shop.test/','k1','wp','standard','m1',1,1);
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,owner_member_id,bound_at,created_at) VALUES('std2','o1','shop2.test','https://shop2.test/','k2','wp','standard','m1',1,1);
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,owner_member_id,bound_at,created_at) VALUES('free','o1','free.test','https://free.test/','k3','wp','free','m1',1,1);
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,owner_member_id,created_at) VALUES('unpaired','o1','unpaired.test','https://unpaired.test/','k4','wp','standard','m1',1);
    INSERT INTO sites(id,org_id,url,site_key,install_type,plan,slug,owner_member_id,created_at) VALUES('hosted','o2','','k5','hosted','free','fresh-page','m2',${Date.now()});
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,owner_member_id,bound_at,created_at) VALUES('spamfree','o2','victim.test','https://victim.test/','k6','wp','free','m2',1,1);`);
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
  return { sqlite, env: { DB, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp", RESEND_API_KEY: "re_test", MAIL_FROM: "Nurevo <reports@nurevo.jp>", EMAIL_UNSUBSCRIBE_SECRET: "unsub-secret-test", ...extra } };
}

const call = (env, method, path, { token = "agency", body, csrf = true, form } = {}) => quiet(() => handleApi(new Request(`https://nurevo.jp${path}`, {
  method,
  headers: {
    ...(token ? { cookie: `nrv_session=${token}; nrv_csrf=${CSRF}` } : {}),
    origin: "https://nurevo.jp",
    ...(token && csrf && method !== "GET" ? { "x-csrf-token": CSRF } : {}),
    ...(body !== undefined ? { "content-type": "application/json" } : {}),
    ...(form !== undefined ? { "content-type": "application/x-www-form-urlencoded" } : {}),
  },
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  ...(form !== undefined ? { body: form } : {}),
}), env, {}));
const SETTINGS = (recipients, extra = {}) => ({ enabled: true, recipients, locale: "en", branding_source: "agency", consent: true, ...extra });
const linkIn = (text, path) => (text.match(new RegExp(`https://nurevo\\.jp${path.replace(/\//g, "\\/")}\\?t=[^\\s"<>]+`)) || [])[0];
const statuses = (view) => Object.fromEntries((view.recipients_status || []).map((r) => [r.email, r.status]));
const batch = (env, now = NOW, opts = {}) => quiet(() => runAgencyReportBatch(env, { now, spacingMs: 0, ...opts }));

/* ---------------- D. reserved names ---------------- */
{
  for (const name of ["PayPal Japan", "Ｐａｙｐａｌ", "pаypal support", "Google Partners", "Apple Care", "AMAZON jp", "Microsoft 365 Team", "Stripe Billing", "VISA Help Desk", "Mastercard", "My Bank", "Nurevo", "楽天カード", "ﾔﾏﾄ運輸", "やまと運輸", "佐川急便", "日本郵便", "国税庁", "三井住友銀行"]) {
    assert.ok(reservedBrandTerm(name), `reserved: ${name}`);
    assert.deepEqual((await validateBranding({ display_name: name })).errors, ["display_name_reserved"], `refused: ${name}`);
  }
  for (const name of ["Acme Digital", "Pineapple Studio", "Visalia Web Works", "Bankside Marketing", "Up Studio", "カフェ栞デザイン"]) {
    assert.equal(reservedBrandTerm(name), null, `allowed: ${name}`);
  }
  assert.ok(RESERVED_BRAND_TERMS.length >= 40, "one list in one constant");
  const { env } = makeEnv();
  const res = await call(env, "PUT", "/api/agency/branding", { body: { display_name: "PayPal Security Team" } });
  assert.equal(res.status, 400);
  assert.deepEqual((await res.json()).fields, ["display_name_reserved"]);
}

/* ---------------- A. eligibility ---------------- */
{
  const { sqlite, env } = makeEnv();
  await call(env, "PUT", "/api/agency/branding", { body: { display_name: "Acme Digital", contact_email: "hello@acme.test" } });
  // A Free site of a member who is not an approved partner: refused.
  const free = await call(env, "PUT", "/api/sites/free/report-settings", { body: SETTINGS(["client@free.test"]) });
  assert.equal(free.status, 409);
  assert.deepEqual(await free.json(), { error: "report_not_eligible", reason: "plan_or_partner" });
  const view = await (await call(env, "GET", "/api/sites/free/report-settings")).json();
  assert.deepEqual(view.eligibility, { ok: false, reason: "plan_or_partner" }, "the dashboard says why");
  // Not connected: an unpaired plugin, or a fresh hosted page.
  assert.deepEqual(await (await call(env, "PUT", "/api/sites/unpaired/report-settings", { body: SETTINGS(["a@b.test"]) })).json(), { error: "report_not_eligible", reason: "not_connected" });
  await call(env, "PUT", "/api/agency/branding", { token: "spammer", body: { display_name: "Totally Legit" } });
  assert.deepEqual(await (await call(env, "PUT", "/api/sites/hosted/report-settings", { token: "spammer", body: SETTINGS(["victim@x.test"]) })).json(), { error: "report_not_eligible", reason: "not_connected" }, "a hosted page created a minute ago is not connected");
  assert.equal(MAIL.length, 0, "nothing was emailed for an ineligible site");
  // Switching it off is always allowed.
  assert.equal((await call(env, "PUT", "/api/sites/free/report-settings", { body: SETTINGS([], { enabled: false }) })).status, 200);
  // A paid (Standard) site: allowed.
  assert.equal((await call(env, "PUT", "/api/sites/std/report-settings", { body: SETTINGS(["client@shop.test"]) })).status, 200);
  // An approved partner may send for a Free site.
  sqlite.exec("UPDATE accounts SET partner_status='approved', partner_approved_at=10 WHERE member_id='m1'");
  assert.equal((await call(env, "PUT", "/api/sites/free/report-settings", { body: SETTINGS(["client@free.test"]) })).status, 200, "approved partner");
  // The cron re-checks: a revoked partner's Free site gets nothing.
  sqlite.exec("UPDATE agency_report_recipients SET status='confirmed'");
  sqlite.exec("UPDATE accounts SET partner_status='rejected' WHERE member_id='m1'");
  MAIL.length = 0;
  const run = await batch(env);
  assert.equal(run.not_eligible, 1, "the Free site is skipped once the partner is no longer approved");
  assert.deepEqual(MAIL.map((m) => m.body.to[0]), ["client@shop.test"], "the Standard site still sends");
  // A settings row written around the API (no account, ineligible site) never sends.
  const other = makeEnv();
  other.sqlite.exec(`INSERT INTO agency_report_settings(site_id,enabled,recipients_json,locale,consent_at,updated_at) VALUES('spamfree',1,'["victim@x.test"]','en',1,1);
    INSERT INTO agency_report_recipients(site_id,email,status,created_at) VALUES('spamfree','victim@x.test','confirmed',1);`);
  MAIL.length = 0;
  assert.equal((await batch(other.env)).not_eligible, 1);
  assert.equal(MAIL.length, 0);
}

/* ---------------- B. double opt-in ---------------- */
{
  const { sqlite, env } = makeEnv();
  MAIL.length = 0;
  await call(env, "PUT", "/api/agency/branding", { body: { display_name: "Acme Digital", contact_email: "hello@acme.test" } });
  const put = await (await call(env, "PUT", "/api/sites/std/report-settings", { body: SETTINGS(["client@shop.test", "boss@shop.test"]) })).json();
  assert.deepEqual(put.confirmations, { sent: 2, limited: 0, failed: 0, skipped: 0 });
  assert.deepEqual(statuses(put), { "client@shop.test": "pending", "boss@shop.test": "pending" }, "the dashboard shows both as waiting");
  assert.equal(MAIL.length, 2, "one confirmation per new address");
  const confirm = MAIL.find((m) => m.body.to[0] === "client@shop.test").body;
  assert.equal(confirm.subject, "Acme Digital via Nurevo wants to send you monthly reports for shop.test");
  assert.equal(confirm.from, '"Acme Digital via Nurevo" <reports@nurevo.jp>');
  assert.equal(confirm.reply_to, undefined, "no agency Reply-To on the confirmation");
  assert.ok(confirm.text.includes(REPORT_CONSENT_COPY.en.confirmFooter.replace("{agency}", "Acme Digital")), "says who asked and that Nurevo sent it");
  assert.ok(!confirm.text.includes("boss@shop.test"), "never names the other recipient");
  const link = linkIn(confirm.text, REPORT_CONFIRM_PATH);
  assert.ok(link, "a confirmation link");
  assert.ok(linkIn(confirm.text, REPORT_UNSUBSCRIBE_PATH)?.includes("scope=all"), "and a 'never send me reports' link");
  // Nothing is sent before confirmation.
  MAIL.length = 0;
  const before = await batch(env);
  assert.equal(before.sent, 0);
  assert.equal(before.unconfirmed, 2);
  assert.equal(MAIL.length, 0, "unconfirmed addresses get no report");
  // GET (a mail scanner) records nothing; POST confirms.
  const path = link.replace("https://nurevo.jp", "");
  const page = await call(env, "GET", path, { token: null });
  assert.equal(page.status, 200);
  assert.ok((await page.text()).includes("Acme Digital"));
  assert.equal(sqlite.prepare("SELECT status FROM agency_report_recipients WHERE email='client@shop.test'").get().status, "pending");
  const post = await call(env, "POST", path, { token: null, csrf: false });
  assert.equal(post.status, 200, "no session or CSRF token: the signed link is the authority");
  assert.equal(sqlite.prepare("SELECT status FROM agency_report_recipients WHERE email='client@shop.test'").get().status, "confirmed");
  const after = await (await call(env, "GET", "/api/sites/std/report-settings")).json();
  assert.deepEqual(statuses(after), { "client@shop.test": "confirmed", "boss@shop.test": "pending" });
  // The report goes to the confirmed address only.
  MAIL.length = 0;
  const run = await batch(env, Date.parse("2026-12-01T05:00:00Z"));
  assert.equal(run.sent, 1);
  assert.deepEqual(MAIL.map((m) => m.body.to[0]), ["client@shop.test"]);
  // Tampered, foreign, expired, removed.
  const token = new URL(link).searchParams.get("t");
  const parts = token.split(".");
  const swapped = [Buffer.from("std2").toString("base64url"), ...parts.slice(1)].join(".");
  assert.equal((await call(env, "POST", `${REPORT_CONFIRM_PATH}?t=${swapped}`, { token: null, csrf: false })).status, 400, "the site cannot be swapped");
  const longer = [parts[0], parts[1], String(Number(parts[2]) + 1e9), parts[3]].join(".");
  assert.equal((await call(env, "POST", `${REPORT_CONFIRM_PATH}?t=${longer}`, { token: null, csrf: false })).status, 400, "the expiry cannot be extended");
  const expired = await reportConfirmToken(env, "std", "boss@shop.test", Date.now() - 1000);
  assert.equal((await call(env, "POST", `${REPORT_CONFIRM_PATH}?t=${encodeURIComponent(expired)}`, { token: null, csrf: false })).status, 400, "expired");
  const foreign = await reportConfirmToken({ EMAIL_UNSUBSCRIBE_SECRET: "other" }, "std", "boss@shop.test", Date.now() + DAY);
  assert.equal((await call(env, "POST", `${REPORT_CONFIRM_PATH}?t=${encodeURIComponent(foreign)}`, { token: null, csrf: false })).status, 400, "another secret");
  const stale = sqlite.prepare("SELECT confirm_expires_at FROM agency_report_recipients WHERE email='boss@shop.test'").get().confirm_expires_at;
  const bossToken = await reportConfirmToken(env, "std", "boss@shop.test", stale);
  await call(env, "PUT", "/api/sites/std/report-settings", { body: SETTINGS(["client@shop.test"]) });
  assert.equal((await call(env, "POST", `${REPORT_CONFIRM_PATH}?t=${encodeURIComponent(bossToken)}`, { token: null, csrf: false })).status, 400, "a removed recipient cannot confirm");
  assert.ok(Math.abs(stale - (Date.now() + REPORT_CONFIRM_TTL_MS)) < 60e3, "links expire after a week");

  // Localized: a Japanese report asks in Japanese.
  MAIL.length = 0;
  await call(env, "PUT", "/api/sites/std2/report-settings", { body: SETTINGS(["kunde@shop2.test"], { locale: "ja" }) });
  assert.equal(MAIL[0].body.subject, "Acme Digital via Nurevo から shop2.test の月次レポートの受け取り確認");
  // A locale without its own text falls back to English.
  MAIL.length = 0;
  await call(env, "PUT", "/api/sites/std2/report-settings", { body: SETTINGS(["kunde@shop2.test", "neu@shop2.test"], { locale: "pt_BR" }) });
  assert.equal(MAIL.length, 1, "only the new address; the pending one was asked less than a day ago");
  assert.equal(MAIL[0].body.subject, "Acme Digital via Nurevo wants to send you monthly reports for shop2.test");
  // A day later a still-pending address is asked again.
  const settings = await loadReportSettings(env, "std2");
  MAIL.length = 0;
  const again = await quiet(() => requestConfirmations(env, { id: "std2", url: "shop2.test", website_uri: "https://shop2.test/" }, settings, { now: Date.now() + DAY + 60e3 }));
  assert.equal(again.sent, 2);
}

/* ---------------- C. confirmation limits ---------------- */
{
  const { sqlite, env } = makeEnv({ AGENCY_REPORT_CONFIRMS_PER_SITE_DAY: "2", AGENCY_REPORT_CONFIRMS_PER_ACCOUNT_DAY: "3" });
  MAIL.length = 0;
  const five = ["a@x.test", "b@x.test", "c@x.test", "d@x.test", "e@x.test"];
  const first = await (await call(env, "PUT", "/api/sites/std/report-settings", { body: SETTINGS(five) })).json();
  assert.deepEqual(first.confirmations, { sent: 2, limited: 3, failed: 0, skipped: 0 }, "per site per day");
  const second = await (await call(env, "PUT", "/api/sites/std2/report-settings", { body: SETTINGS(["f@y.test", "g@y.test"]) })).json();
  assert.deepEqual(second.confirmations, { sent: 1, limited: 1, failed: 0, skipped: 0 }, "per account per day, across sites");
  assert.equal(MAIL.length, 3);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM agency_report_recipients WHERE requested_at IS NULL").get().n, 4, "the others wait for tomorrow");
  // Tomorrow the limits start again.
  const tomorrow = await quiet(() => requestConfirmations(env, { id: "std", url: "shop.test" }, { recipients: five, locale: "en" }, { accountId: 1, now: Date.now() + DAY }));
  assert.equal(tomorrow.sent, 2);
}

/* ---------------- E. global suppression ---------------- */
{
  const { sqlite, env } = makeEnv();
  MAIL.length = 0;
  for (const site of ["std", "std2"]) await call(env, "PUT", `/api/sites/${site}/report-settings`, { body: SETTINGS(["client@shop.test"]) });
  sqlite.exec("UPDATE agency_report_recipients SET status='confirmed'");
  const token = await reportUnsubscribeToken(env, "std", "client@shop.test");
  const path = `${REPORT_UNSUBSCRIBE_PATH}?t=${encodeURIComponent(token)}&l=en`;
  const page = await (await call(env, "GET", path, { token: null })).text();
  assert.ok(page.includes(REPORT_CONSENT_COPY.en.unsubAllButton) && page.includes('name="scope" value="all"'), "the unsubscribe page offers all Nurevo reports");
  const res = await call(env, "POST", path, { token: null, csrf: false, form: "scope=all" });
  assert.ok((await res.text()).includes(REPORT_CONSENT_COPY.en.unsubAllDone.replace("'", "&#39;")));
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM agency_report_suppressions WHERE email='client@shop.test'").get().n, 1);
  MAIL.length = 0;
  const run = await batch(env);
  assert.equal(run.sent, 0);
  assert.equal(run.suppressed, 2, "neither site's report goes to the address");
  const view = await (await call(env, "GET", "/api/sites/std2/report-settings")).json();
  assert.deepEqual(statuses(view), { "client@shop.test": "opted_out" }, "the agency sees the address unsubscribed");
  // No new confirmation emails to it either, from any agency.
  await call(env, "PUT", "/api/agency/branding", { token: "spammer", body: { display_name: "Other Agency" } });
  sqlite.exec("UPDATE accounts SET partner_status='approved', partner_approved_at=10 WHERE member_id='m2'");
  const spam = await (await call(env, "PUT", "/api/sites/spamfree/report-settings", { token: "spammer", body: SETTINGS(["client@shop.test"]) })).json();
  assert.deepEqual(spam.confirmations, { sent: 0, limited: 0, failed: 0, skipped: 1 });
  assert.equal(MAIL.length, 0);
  // The "never send me reports" link of a confirmation one-click POSTs scope=all.
  const neverToken = await reportUnsubscribeToken(env, "std2", "other@shop.test");
  await call(env, "POST", `${REPORT_UNSUBSCRIBE_PATH}?t=${encodeURIComponent(neverToken)}&l=en&scope=all`, { token: null, csrf: false, form: "List-Unsubscribe=One-Click" });
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM agency_report_suppressions WHERE email='other@shop.test'").get().n, 1);
  // A plain one-click (the report's List-Unsubscribe) stops that site only.
  const siteToken = await reportUnsubscribeToken(env, "std2", "third@shop.test");
  await call(env, "POST", `${REPORT_UNSUBSCRIBE_PATH}?t=${encodeURIComponent(siteToken)}&l=en`, { token: null, csrf: false, form: "List-Unsubscribe=One-Click" });
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM agency_report_suppressions WHERE email='third@shop.test'").get().n, 0);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM agency_report_opt_outs WHERE email='third@shop.test'").get().n, 1);

  /* ---------------- G. site deletion ---------------- */
  assert.ok(sqlite.prepare("SELECT COUNT(*) n FROM agency_report_sends WHERE site_id='std'").get().n > 0, "the site has send-ledger rows");
  const del = await call(env, "DELETE", "/api/sites/std");
  assert.equal(del.status, 200);
  for (const table of ["agency_report_settings", "agency_report_recipients", "agency_report_opt_outs", "agency_report_sends"]) {
    assert.equal(sqlite.prepare(`SELECT COUNT(*) n FROM ${table} WHERE site_id='std'`).get().n, 0, `${table} rows of the deleted site are gone`);
  }
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM agency_report_settings WHERE site_id='std2'").get().n, 1, "other sites keep theirs");
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM agency_report_suppressions WHERE email='client@shop.test'").get().n, 1, "the global suppression list is kept");
}

/* ---------------- F. per-account monthly cap ---------------- */
{
  const { env } = makeEnv({ AGENCY_REPORT_ACCOUNT_MONTHLY_EMAILS: "2" });
  for (const site of ["std", "std2"]) await call(env, "PUT", `/api/sites/${site}/report-settings`, { body: SETTINGS([`a@${site}.test`, `b@${site}.test`]) });
  await env.DB.prepare("UPDATE agency_report_recipients SET status='confirmed'").run();
  MAIL.length = 0;
  const run = await batch(env);
  assert.equal(run.sent, 2, "two emails a month for the account");
  assert.equal(run.account_capped, 2, "the rest are recorded, not sent");
  assert.equal(MAIL.length, 2);
  MAIL.length = 0;
  const later = await batch(env, NOW + 3600e3);
  assert.equal(later.sites, 0, "and not retried every hour");
  assert.equal(MAIL.length, 0);
}

console.log("agency report abuse regression passed (eligibility, double opt-in, confirmation limits, reserved names, global suppression, account cap, site deletion)");
