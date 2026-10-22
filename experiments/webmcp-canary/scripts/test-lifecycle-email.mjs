/**
 * Lifecycle email (worker/lifecycle-email.mjs, migration 0038).
 *
 *  1. Language: stored preference, then registration locale, then the last
 *     magic link's locale, then en; unknown copy falls back to en.
 *  2. Content of every email in every language.
 *  3. Idempotency: one welcome per member, one payment-failed per invoice, one
 *     plan-ended per subscription, however often the trigger repeats.
 *  4. The 24 h / 72 h schedule, its stop after two, the per-run bound, and no
 *     resend after a partial failure.
 *  5. Opt-out: signed token, GET records nothing, POST records, reminders stop,
 *     transactional mail does not; List-Unsubscribe headers.
 *  6. With 0038 unapplied nothing is sent and nothing fails.
 *  7. A failing email provider does not fail the webhook or site creation.
 *
 * Real SQL (node:sqlite) behind a D1-shaped shim. fetch is replaced; nothing
 * leaves the process.
 */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { handleApi } from "../worker/api.mjs";
import {
  EMAIL_LOCALES,
} from "../worker/email-i18n.mjs";
import {
  lifecycleCopy, memberEmailLocale, welcomeEmail, reminderEmail, paymentFailedEmail, planEndedEmail,
  sendWelcomeEmail, runLifecycleReminders, dueReminderStep, unsubscribeToken, verifyUnsubscribeToken,
  unsubscribeUrl, HOUR_MS,
} from "../worker/lifecycle-email.mjs";

const dbDir = new URL("../nurevo-impl/db/", import.meta.url);
const sql = (name) => readFileSync(new URL(name, dbDir), "utf8");

function makeDb({ lifecycle = true } = {}) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(sql("schema.sql"));
  sqlite.exec("ALTER TABLE sites ADD COLUMN manual_plan TEXT");
  sqlite.exec("ALTER TABLE sites ADD COLUMN domain_key TEXT");
  sqlite.exec("ALTER TABLE sites ADD COLUMN bound_license_hash TEXT");
  sqlite.exec("ALTER TABLE sites ADD COLUMN bound_at INTEGER");
  sqlite.exec("ALTER TABLE orgs ADD COLUMN manual_plan TEXT");
  sqlite.exec(sql("0029_member_email_preferences.sql"));
  sqlite.exec(sql("0030_account_referrals.sql"));
  sqlite.exec(sql("0037_magic_link_intent.sql"));
  if (lifecycle) sqlite.exec(sql("0038_lifecycle_email.sql"));
  const DB = {
    prepare(text) {
      const stmt = sqlite.prepare(text);
      return { values: [], bind(...values) { return Object.assign(Object.create(this), { values }); },
        async first() { return stmt.get(...this.values) || null; },
        async all() { return { results: stmt.all(...this.values) }; },
        runSync() { const r = stmt.run(...this.values); return { meta: { changes: Number(r.changes) } }; },
        async run() { return this.runSync(); } };
    },
    async batch(statements) { return statements.map((s) => s.runSync()); },
  };
  return { sqlite, DB };
}

const SECRET = "whsec_lifecycle";
const baseEnv = (DB, extra = {}) => ({
  DB, RESEND_API_KEY: "re_test", MAIL_FROM: "Nurevo <hello@nurevo.test>", EMAIL_UNSUBSCRIBE_SECRET: "unsub-secret",
  STRIPE_WEBHOOK_SECRET: SECRET, STRIPE_PRICE_ID_STANDARD: "price_std", STRIPE_PRICE_ID_PRO: "price_pro",
  LIFECYCLE_EMAIL_SPACING_MS: "0", ...extra,
});

/** Captures every outgoing email; mode decides the provider's answer. */
const sent = [];
let providerMode = "ok";
globalThis.fetch = async (url, init = {}) => {
  assert.equal(String(url), "https://api.resend.com/emails", `unexpected fetch ${url}`);
  if (providerMode === "throw") throw new Error("network down");
  if (providerMode === "500") return Response.json({ name: "internal_error" }, { status: 500 });
  if (providerMode === "429") return Response.json({ name: "rate_limit_exceeded" }, { status: 429 });
  const body = JSON.parse(init.body);
  sent.push({ ...body, requestHeaders: init.headers });
  return Response.json({ id: `email_${sent.length}` });
};
const reset = () => { sent.length = 0; providerMode = "ok"; };

function seed(sqlite, { member = "m1", email = "owner@example.test", org = "o1", language = null, registration = null } = {}) {
  sqlite.prepare("INSERT OR IGNORE INTO orgs (id,name,plan,created_at) VALUES (?,?, 'free', 1)").run(org, "Org");
  sqlite.prepare("INSERT INTO members (id,org_id,email,role,status,created_at) VALUES (?,?,?,'admin','active',1)").run(member, org, email);
  if (language || registration) {
    sqlite.prepare("INSERT INTO member_email_preferences (email,language,registration_locale) VALUES (?,?,?)").run(email, language, registration);
  }
}
let siteSeq = 0;
function addSite(sqlite, { member = "m1", org = "o1", type = "wp", createdAt = Date.now(), url = "shop.example", plan = "free", sub = null, customer = null, slug = null, bound = null } = {}) {
  const id = `s${++siteSeq}`;
  sqlite.prepare("INSERT INTO sites (id,org_id,owner_member_id,url,site_key,install_type,plan,slug,created_at,stripe_subscription_id,stripe_customer_id,bound_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
    .run(id, org, member, url, `key-${id}`, type, plan, slug, createdAt, sub, customer, bound);
  return id;
}
const ledger = (sqlite) => sqlite.prepare("SELECT scope,subject_id,kind,step,status FROM lifecycle_emails ORDER BY created_at, rowid").all().map((r) => ({ ...r }));

/* ------------------------------ 1. language ------------------------------ */
{
  const { sqlite, DB } = makeDb();
  const env = baseEnv(DB);
  seed(sqlite, { member: "a", email: "a@example.test", language: "de", registration: "fr" });
  seed(sqlite, { member: "b", email: "b@example.test", registration: "ko" });
  seed(sqlite, { member: "c", email: "c@example.test" });
  seed(sqlite, { member: "d", email: "d@example.test" });
  sqlite.prepare("INSERT INTO sessions (token,member_id,org_id,kind,expires_at,locale) VALUES ('x','c','o1','magic',5,'zh-tw')").run();
  assert.equal(await memberEmailLocale(env, { id: "a", email: "a@example.test" }), "de", "explicit language wins");
  assert.equal(await memberEmailLocale(env, { id: "b", email: "B@Example.test" }), "ko", "then the registration locale");
  assert.equal(await memberEmailLocale(env, { id: "c", email: "c@example.test" }), "zh-tw", "then the last magic link's locale (0037)");
  assert.equal(await memberEmailLocale(env, { id: "d", email: "d@example.test" }), "en", "then en");
  assert.equal(lifecycleCopy("tw"), lifecycleCopy("zh-tw"));
  assert.equal(lifecycleCopy("zh-Hant-TW"), lifecycleCopy("zh-tw"));
  assert.equal(lifecycleCopy("pt-BR"), lifecycleCopy("en"), "unknown languages fall back to en");
  assert.equal(welcomeEmail({ locale: "xx", site: { id: "s", install_type: "wp", url: "a.test" } }).subject, "Next step for a.test on Nurevo AEO");
  // A schema without 0037 still answers.
  const broken = { DB: { prepare() { throw new Error("no such column: locale"); } } };
  assert.equal(await memberEmailLocale(broken, { id: "z", email: "z@example.test" }), "en");
}

/* ------------------------------ 2. content ------------------------------ */
{
  const wp = { id: "site9", install_type: "wp", url: "shop.example" };
  const stat = { id: "site8", install_type: "static", url: "static.example" };
  const hosted = { id: "site7", install_type: "hosted", url: "", slug: "my-cafe" };
  const subjects = { welcome: new Set(), r1: new Set(), r2: new Set(), pf: new Set(), pe: new Set() };
  for (const locale of EMAIL_LOCALES) {
    const all = [];
    const w = welcomeEmail({ locale, site: wp });
    assert.match(w.text, /Nurevo AEO/);
    assert.ok(w.text.includes("https://nurevo.jp/dashboard#site:site9"), `${locale} welcome links the site`);
    assert.ok(w.html.includes("https://nurevo.jp/dashboard#site:site9"));
    assert.ok(w.subject.includes("shop.example"), `${locale} subject names the site`);
    assert.match(w.text, /1\. .*\n2\. .*\n3\. /, `${locale} wp steps are numbered`);
    const s = welcomeEmail({ locale, site: stat });
    for (const needle of ["JSON-LD", "llms.txt", "robots"]) assert.ok(s.text.includes(needle), `${locale} static mentions ${needle}`);
    assert.notEqual(s.text, w.text);
    const h = welcomeEmail({ locale, site: hosted });
    assert.ok(h.text.includes("https://nurevo.jp/s/my-cafe"), `${locale} hosted gives the page URL`);
    assert.ok(h.text.includes("https://nurevo.jp/dashboard#site:site7"));
    const r1 = reminderEmail({ locale, site: wp, step: "1", unsubscribeUrl: "https://nurevo.jp/api/email/unsubscribe?t=abc" });
    const r2 = reminderEmail({ locale, site: wp, step: "2", unsubscribeUrl: "https://nurevo.jp/api/email/unsubscribe?t=abc" });
    for (const r of [r1, r2]) {
      assert.ok(r.text.includes("https://nurevo.jp/dashboard#site:site9"), `${locale} reminder links to re-issue`);
      assert.ok(r.text.includes("https://nurevo.jp/api/email/unsubscribe?t=abc"), `${locale} reminder can be unsubscribed`);
      assert.ok(r.html.includes("unsubscribe?t=abc"));
      assert.equal(r.text.split("\n").filter((l) => l.startsWith("- ")).length, 3, `${locale} three checklist items`);
      assert.ok(r.text.includes(locale === "ja" ? "AI向け情報を出力する" : "Output AI-facing information"), `${locale} names the setting as WordPress shows it`);
      assert.ok(r.text.includes("Nurevo AEO >"), `${locale} names the settings menu`);
    }
    assert.notEqual(r1.subject, r2.subject);
    assert.ok(r2.text.length > r1.text.length, `${locale} the second reminder says it is the last`);
    const pf = paymentFailedEmail({ locale, site: wp });
    assert.ok(pf.text.includes("Manage billing") && pf.text.includes("https://nurevo.jp/dashboard#site:site9"), `${locale} payment failed points at Manage billing`);
    const pe = planEndedEmail({ locale, site: wp, previousPlan: "pro" });
    assert.ok(pe.text.includes("Pro") && pe.text.includes("Free") && pe.text.includes("AEO"), `${locale} plan ended names Pro, Free and the AEO check`);
    assert.ok(pe.text.includes("https://nurevo.jp/dashboard#site:site9"));
    assert.ok(planEndedEmail({ locale, site: wp, previousPlan: "standard" }).text.includes("Standard"));
    all.push(w, s, h, r1, r2, pf, pe);
    for (const m of all) {
      assert.ok(m.subject && m.text && m.html.startsWith(`<html lang="${locale === "zh-tw" ? "zh-TW" : locale}">`), `${locale} complete message`);
      assert.doesNotMatch(m.text, /\{\w+\}/, `${locale} no unfilled placeholder`);
    }
    if (locale === "ja") for (const m of all) { assert.match(m.text, /(です|ます)[。：]/, "Japanese copy is です/ます"); assert.doesNotMatch(m.text, /(だ|である)。/, "no plain form"); };
    subjects.welcome.add(w.subject); subjects.r1.add(r1.subject); subjects.r2.add(r2.subject); subjects.pf.add(pf.subject); subjects.pe.add(pe.subject);
  }
  for (const [name, set] of Object.entries(subjects)) assert.equal(set.size, EMAIL_LOCALES.length, `${name}: a distinct subject in every language`);
  // HTML escapes what came from the site record.
  assert.ok(!welcomeEmail({ locale: "en", site: { id: "x", install_type: "wp", url: "<b>x</b>" } }).html.includes("<b>x</b>"));
}

/* ------------------- 3. welcome: first site only, once ------------------- */
{
  reset();
  const { sqlite, DB } = makeDb();
  const env = baseEnv(DB);
  seed(sqlite, { language: "ja" });
  const first = addSite(sqlite);
  assert.equal(await sendWelcomeEmail(env, { memberId: "m1", siteId: first }), "sent");
  assert.equal(await sendWelcomeEmail(env, { memberId: "m1", siteId: first }), "duplicate");
  const second = addSite(sqlite, { url: "two.example" });
  assert.equal(await sendWelcomeEmail(env, { memberId: "m1", siteId: second }), "not_first_site");
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to[0], "owner@example.test");
  assert.match(sent[0].subject, /shop\.example/);
  assert.ok(sent[0].text.includes("プラグイン"), "in the member's language");
  assert.equal(sent[0].headers, undefined, "transactional mail carries no unsubscribe header");
  assert.ok(sent[0].requestHeaders["idempotency-key"], "the provider gets an idempotency key too");
  assert.deepEqual(ledger(sqlite), [{ scope: "member", subject_id: "m1", kind: "welcome", step: "1", status: "sent" }]);
}

/* -------------- 3/7. through the real routes: sites + webhook -------------- */
async function stripeRequest(env, event) {
  const payload = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const sig = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return new Request("https://nurevo.jp/api/billing/webhook", { method: "POST", headers: { "stripe-signature": `t=${timestamp},v1=${sig}` }, body: payload });
}
let evSeq = 0;
const invoiceFailed = (invoice, extra = {}) => ({ id: `evt_${++evSeq}`, type: "invoice.payment_failed", data: { object: {
  id: invoice, object: "invoice", subscription: "sub_1", customer: "cus_1",
  payment_intent: { last_payment_error: { payment_method: { card: { last4: "4242", brand: "visa" } } } }, ...extra } } });
const subDeleted = (sub = "sub_1", siteId = undefined) => ({ id: `evt_${++evSeq}`, type: "customer.subscription.deleted", data: { object: {
  id: sub, object: "subscription", customer: "cus_1", status: "canceled", ...(siteId ? { metadata: { siteId } } : {}),
  items: { data: [{ price: { id: "price_pro" } }] } } } });

{
  reset();
  const { sqlite, DB } = makeDb();
  const env = baseEnv(DB);
  seed(sqlite, { registration: "fr" });
  const paid = addSite(sqlite, { plan: "pro", sub: "sub_1", customer: "cus_1" });
  const tasks = [];
  const ctx = { waitUntil(p) { tasks.push(p); } };
  const hook = async (event) => { const res = await handleApi(await stripeRequest(env, event), env, ctx); await Promise.all(tasks.splice(0)); return res; };

  // payment failed: Stripe retries the invoice, and replays events.
  const failed = invoiceFailed("in_1", { subscription_details: { metadata: { siteId: paid } } });
  assert.equal((await hook(failed)).status, 200);
  assert.deepEqual(await (await hook(failed)).json(), { received: true, duplicate: true }, "billing_events dedupe is kept");
  assert.equal((await hook(invoiceFailed("in_1"))).status, 200, "a Stripe retry of the same invoice, found by its subscription");
  assert.equal(sent.length, 1, "one email per failing invoice");
  assert.equal(sent[0].to[0], "owner@example.test");
  assert.match(sent[0].subject, /paiement/i, "French, from the registration locale");
  assert.ok(!JSON.stringify(sent[0]).includes("4242") && !/visa/i.test(JSON.stringify(sent[0])), "no card details");
  assert.ok(sent[0].text.includes(`https://nurevo.jp/dashboard#site:${paid}`));
  assert.equal(sqlite.prepare("SELECT contract FROM sites WHERE id=?").get(paid).contract, "past_due", "the webhook still did its job");
  await hook(invoiceFailed("in_2"));
  assert.equal(sent.length, 2, "a later failing invoice is a new email");

  // cancellation of a paid plan
  reset();
  assert.equal((await hook(subDeleted())).status, 200);
  assert.equal(sqlite.prepare("SELECT plan FROM sites WHERE id=?").get(paid).plan, "free");
  assert.equal(sent.length, 1);
  assert.ok(sent[0].text.includes("Pro") && sent[0].text.includes("Free"));
  await hook(subDeleted());
  assert.equal(sent.length, 1, "a second deleted event for the same subscription sends nothing");

  // cancellation of a site that was not paying, or that keeps a manual grant
  const free = addSite(sqlite, { url: "free.example", plan: "free", sub: "sub_free" });
  await hook(subDeleted("sub_free"));
  const comped = addSite(sqlite, { url: "comp.example", plan: "standard", sub: "sub_comp" });
  sqlite.prepare("UPDATE sites SET manual_plan='standard' WHERE id=?").run(comped);
  await hook(subDeleted("sub_comp"));
  assert.equal(sent.length, 1, "no plan-ended mail when the site was free or is still paid");
  assert.ok(free && comped);

  // 7. the provider failing does not fail the webhook, and is not retried
  reset();
  providerMode = "throw";
  const res = await hook(invoiceFailed("in_3"));
  assert.equal(res.status, 200, "network failure while emailing: webhook still 200");
  providerMode = "500";
  assert.equal((await hook(invoiceFailed("in_4"))).status, 200, "provider 500: webhook still 200");
  providerMode = "ok";
  await hook(invoiceFailed("in_3"));
  assert.equal(sent.length, 0, "a failed send is recorded and not resent");
  assert.equal(sqlite.prepare("SELECT status FROM lifecycle_emails WHERE step='in_3'").get().status, "failed");

  // Without ctx (no waitUntil) the email is awaited, and an exception inside
  // the lifecycle code still cannot escape.
  const exploding = { ...env, DB: { prepare(text) {
    if (/lifecycle_emails|FROM members|member_email_preferences/.test(text)) throw new Error("boom");
    return DB.prepare(text);
  } } };
  const res2 = await handleApi(await stripeRequest(exploding, invoiceFailed("in_5")), exploding);
  assert.equal(res2.status, 200, "an exception in the email path does not fail the webhook");

  // Site creation sends the welcome, and its failure does not fail creation.
  reset();
  sqlite.prepare("INSERT INTO members (id,org_id,email,role,status,created_at) VALUES ('m2','o1','new@example.test','operator','active',1)").run();
  const raw = "sess-raw";
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  sqlite.prepare("INSERT INTO sessions (token,member_id,org_id,kind,expires_at) VALUES (?, 'm2','o1','session',?)").run(hash, Date.now() + 3600e3);
  const csrf = "c".repeat(64);
  const create = (body) => handleApi(new Request("https://nurevo.jp/api/sites", { method: "POST", headers: {
    cookie: `nrv_session=${raw}; nrv_csrf=${csrf}`, "x-csrf-token": csrf, "content-type": "application/json", origin: "https://nurevo.jp",
  }, body: JSON.stringify(body) }), env, ctx);
  const created = await create({ install_type: "static", url: "brand-new.example" });
  assert.equal(created.status, 200, await created.clone().text());
  await Promise.all(tasks.splice(0));
  assert.equal(sent.length, 1, "first site: welcome sent");
  assert.ok(sent[0].text.includes("llms.txt") && sent[0].to[0] === "new@example.test");
  providerMode = "throw";
  const createdAgain = await create({ install_type: "wp", url: "second.example" });
  await Promise.all(tasks.splice(0));
  assert.equal(createdAgain.status, 200);
  assert.equal(sent.length, 1, "second site: no welcome");
}

/* ------------------ 4. reminders: 24 h, 72 h, then stop ------------------ */
{
  reset();
  const { sqlite, DB } = makeDb();
  const env = baseEnv(DB);
  seed(sqlite, { language: "en" });
  const T = Date.UTC(2026, 9, 22, 18, 17);
  const young = addSite(sqlite, { createdAt: T - 22 * HOUR_MS, url: "young.example" });
  const day = addSite(sqlite, { createdAt: T - 25 * HOUR_MS, url: "day.example" });
  const late = addSite(sqlite, { createdAt: T - 80 * HOUR_MS, url: "late.example" });
  addSite(sqlite, { createdAt: T - 30 * HOUR_MS, url: "paired.example", bound: T - 29 * HOUR_MS });
  const paired = addSite(sqlite, { createdAt: T - 30 * HOUR_MS, url: "coded.example" });
  sqlite.prepare("UPDATE sites SET pairing_code_used_at=? WHERE id=?").run(T - 1, paired);
  addSite(sqlite, { createdAt: T - 30 * HOUR_MS, url: "static.example", type: "static" });
  addSite(sqlite, { createdAt: T - 30 * 24 * HOUR_MS, url: "ancient.example" });

  assert.equal(dueReminderStep(T - 23 * HOUR_MS, T), null);
  assert.equal(dueReminderStep(T - 24 * HOUR_MS, T), "1");
  assert.equal(dueReminderStep(T - 72 * HOUR_MS, T), "2");

  let run = await runLifecycleReminders(env, { now: T });
  assert.deepEqual(sent.map((m) => m.subject).sort(), ["Reminder: late.example still isn't connected", "day.example isn't connected yet"].sort(),
    "24 h gets the first; a site first seen past 72 h gets only the second; young, paired, static and stale sites get none");
  assert.equal(run.sent, 2);
  const reminder = sent.find((m) => m.subject.startsWith("day"));
  assert.match(reminder.headers["List-Unsubscribe"], /^<https:\/\/nurevo\.jp\/api\/email\/unsubscribe\?t=[^>]+>$/);
  assert.equal(reminder.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");

  run = await runLifecycleReminders(env, { now: T + HOUR_MS });
  assert.equal(sent.length, 2, "a repeated run sends nothing new");
  await runLifecycleReminders(env, { now: T + 24 * HOUR_MS });
  assert.equal(sent.length, 3, "the young site's first reminder, a day later");
  assert.match(sent[2].subject, /^young/);
  await runLifecycleReminders(env, { now: T + 48 * HOUR_MS });
  assert.equal(sent.length, 4, "day.example reaches 72 h: its second reminder");
  assert.match(sent[3].subject, /^Reminder: day/);
  for (let d = 3; d <= 20; d += 1) await runLifecycleReminders(env, { now: T + d * 24 * HOUR_MS });
  const steps = sqlite.prepare("SELECT subject_id, group_concat(step) AS steps FROM lifecycle_emails WHERE kind='not_connected' GROUP BY subject_id").all();
  for (const row of steps) assert.ok(["1,2", "2"].includes(row.steps), `${row.subject_id}: at most two reminders, got ${row.steps}`);
  assert.equal(sent.length, 5, "then everything stops");
  assert.ok(young && day && late);
}

/* ------------- 4. bounded per run; no resend after a partial failure ------------- */
{
  reset();
  const { sqlite, DB } = makeDb();
  const env = baseEnv(DB);
  seed(sqlite);
  const T = Date.UTC(2026, 9, 22);
  for (let i = 0; i < 5; i += 1) addSite(sqlite, { createdAt: T - (25 + i) * HOUR_MS, url: `b${i}.example` });
  let calls = 0;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => { calls += 1; if (calls === 2) throw new Error("mid-run failure"); return realFetch(url, init); };
  const first = await runLifecycleReminders(env, { now: T, limit: 3 });
  assert.deepEqual({ sent: first.sent, failed: first.failed }, { sent: 2, failed: 1 }, "three attempted, one failed");
  const second = await runLifecycleReminders(env, { now: T, limit: 3 });
  assert.equal(second.sent, 2, "the next run takes the remaining two, not the failed one");
  const third = await runLifecycleReminders(env, { now: T, limit: 3 });
  assert.equal(third.considered, 0, "nothing left");
  assert.equal(calls, 5, "five provider calls for five sites: none resent");
  globalThis.fetch = realFetch;
  // A 429 is a definite non-send: the claim is released and the run stops.
  reset();
  addSite(sqlite, { createdAt: T - 26 * HOUR_MS, url: "rl.example" });
  providerMode = "429";
  const limited = await runLifecycleReminders(env, { now: T });
  assert.equal(limited.skipped, "rate_limited");
  providerMode = "ok";
  assert.equal((await runLifecycleReminders(env, { now: T })).sent, 1, "and goes out on the next run");
}

/* ------------------------------ 5. opt-out ------------------------------ */
{
  reset();
  const { sqlite, DB } = makeDb();
  const env = baseEnv(DB);
  seed(sqlite, { email: "Owner@Example.test", language: "ko" });
  const token = await unsubscribeToken(env, "Owner@Example.test");
  assert.equal(await verifyUnsubscribeToken(env, token), "owner@example.test");
  const [e, m] = token.split(".");
  assert.equal(await verifyUnsubscribeToken(env, `${e}.${m.slice(0, -2)}AA`), null, "tampered MAC");
  const other = (await unsubscribeToken(env, "other@example.test")).split(".")[0];
  assert.equal(await verifyUnsubscribeToken(env, `${other}.${m}`), null, "someone else's address");
  assert.equal(await verifyUnsubscribeToken({ ...env, EMAIL_UNSUBSCRIBE_SECRET: "different" }, token), null, "another secret");
  assert.equal(await verifyUnsubscribeToken(env, "garbage"), null);

  const link = await unsubscribeUrl(env, "owner@example.test", "ko");
  const page = await handleApi(new Request(link), env);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /lang="ko"/);
  assert.match(html, /method="post"/);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM lifecycle_email_opt_outs").get().n, 0, "GET (a mail scanner) records nothing");
  const bad = await handleApi(new Request(link.replace(/t=[^&]+/, "t=nope")), env);
  assert.equal(bad.status, 400);
  // RFC 8058 one-click: a POST with the form body, no cookies.
  const posted = await handleApi(new Request(link, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "List-Unsubscribe=One-Click" }), env);
  assert.equal(posted.status, 200);
  assert.equal(sqlite.prepare("SELECT category FROM lifecycle_email_opt_outs WHERE email='owner@example.test'").get().category, "reminders");
  assert.equal((await handleApi(new Request(link, { method: "POST" }), env)).status, 200, "repeating it is harmless");

  const T = Date.UTC(2026, 9, 22);
  addSite(sqlite, { createdAt: T - 25 * HOUR_MS });
  const run = await runLifecycleReminders(env, { now: T });
  assert.equal(run.suppressed, 1);
  assert.equal(sent.length, 0, "reminders stop after opting out");
  assert.equal((await runLifecycleReminders(env, { now: T + 48 * HOUR_MS })).sent, 0, "including the second one");
  const site = addSite(sqlite, { url: "first.example", createdAt: T });
  sqlite.prepare("DELETE FROM sites WHERE id<>?").run(site);
  assert.equal(await sendWelcomeEmail(env, { memberId: "m1", siteId: site }), "sent", "transactional mail still goes out");
  assert.equal(sent.length, 1);

  // No secret configured: reminders are not sent at all (no link to offer).
  assert.equal((await runLifecycleReminders({ ...env, EMAIL_UNSUBSCRIBE_SECRET: "" }, { now: T })).skipped, "unsubscribe_secret_missing");
}

/* ---------------------- 6. 0038 not applied yet ---------------------- */
{
  reset();
  const { sqlite, DB } = makeDb({ lifecycle: false });
  const env = baseEnv(DB);
  seed(sqlite);
  const site = addSite(sqlite, { plan: "pro", sub: "sub_1", customer: "cus_1", createdAt: Date.now() - 30 * HOUR_MS });
  assert.equal(await sendWelcomeEmail(env, { memberId: "m1", siteId: site }), "unavailable");
  assert.equal((await runLifecycleReminders(env)).skipped, "table_missing");
  const res = await handleApi(await stripeRequest(env, invoiceFailed("in_9")), env);
  assert.equal(res.status, 200);
  const res2 = await handleApi(await stripeRequest(env, subDeleted()), env);
  assert.equal(res2.status, 200);
  assert.equal(sqlite.prepare("SELECT plan FROM sites WHERE id=?").get(site).plan, "free", "billing still applied");
  const link = await unsubscribeUrl(env, "owner@example.test");
  assert.equal((await handleApi(new Request(link, { method: "POST" }), env)).status, 503, "opt-out cannot be stored yet: says so, does not crash");
  assert.equal(sent.length, 0, "nothing is sent without the ledger");
}

/* --------------------- mail not configured at all --------------------- */
{
  reset();
  const { sqlite, DB } = makeDb();
  seed(sqlite);
  const env = baseEnv(DB, { RESEND_API_KEY: "" });
  const site = addSite(sqlite);
  assert.equal(await sendWelcomeEmail(env, { memberId: "m1", siteId: site }), "not_configured");
  assert.equal((await runLifecycleReminders(env)).skipped, "mail_not_configured");
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM lifecycle_emails").get().n, 0, "nothing claimed when nothing can be sent");
}

console.log("lifecycle email tests passed");
