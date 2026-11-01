/**
 * Wise payouts for overseas partners (migration 0050) and auto-approval,
 * against real SQL (schema + 0029, 0030, 0039, 0040, then 0050) and a stubbed
 * Stripe. No real Stripe call is possible: fetch is replaced, and a transfer
 * attempt fails the test.
 *
 * Covers: before 0050 the Worker keeps working (summary, admin list) and
 * refuses Wise saves with 503; validation; approved partners only; the
 * partner's own page shows the address masked; switching method; a Wise
 * partner is never paid by a Stripe transfer even with a ready Stripe account;
 * the admin list shows the amount due; recording it as sent (amount must
 * match, super admin only, CSRF, never twice); a refund after a Wise payout is
 * withheld from the next one; the 40% / first-customer rule is unchanged.
 */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { handleApi } from "../worker/api.mjs";
import { runPartnerPayouts, wiseDue } from "../worker/partner-payouts.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const sqlite = new DatabaseSync(":memory:");
sqlite.exec(read("../nurevo-impl/db/schema.sql"));
sqlite.exec("ALTER TABLE sites ADD COLUMN manual_plan TEXT");
for (const file of ["0029_member_email_preferences", "0030_account_referrals", "0039_partner_payouts", "0040_partner_approval_first_customer"]) sqlite.exec(read(`../nurevo-impl/db/${file}.sql`));
const DB = {
  prepare(sql) {
    const stmt = sqlite.prepare(sql);
    return { values: [], bind(...values) { return Object.assign(Object.create(this), { values }); },
      async first() { return stmt.get(...this.values) || null; },
      async all() { return { results: stmt.all(...this.values) }; },
      runSync() { const result = stmt.run(...this.values); return { meta: { changes: Number(result.changes) } }; },
      async run() { return this.runSync(); } };
  },
  async batch(statements) { return statements.map((s) => s.runSync()); },
};
const WEBHOOK_SECRET = "whsec_test_wise";
const env = { DB, DEV: "1", SUPER_ADMIN_EMAILS: "boss@example.test", STRIPE_SECRET_KEY: "sk_test_wise", STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET, STRIPE_PRICE_ID_STANDARD: "price_std" };

const charges = new Map(), calls = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(String(input));
  assert.equal(url.origin, "https://api.stripe.com", `unexpected network call ${url.origin}`);
  const method = options.method || "GET";
  calls.push(`${method} ${url.pathname}`);
  assert.notEqual(url.pathname, "/v1/transfers", "a Wise partner is never paid by a Stripe transfer");
  let m;
  if (method === "GET" && (m = url.pathname.match(/^\/v1\/charges\/([^/]+)$/))) {
    return charges.has(m[1]) ? Response.json(charges.get(m[1])) : Response.json({ error: { code: "resource_missing" } }, { status: 404 });
  }
  if ((m = url.pathname.match(/^\/v1\/accounts\/([^/]+)$/))) {
    return Response.json({ id: m[1], country: "JP", capabilities: { transfers: "active" }, details_submitted: true, requirements: {}, settings: { payouts: { schedule: { interval: "monthly", monthly_anchor: 25 } } } });
  }
  if (method === "GET" && url.pathname === "/v1/disputes") return Response.json({ data: [] });
  throw new Error(`unexpected Stripe call ${method} ${url.pathname}`);
};

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function sign(payload) {
  const t = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(WEBHOOK_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${payload}`));
  return `t=${t},v1=${[...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}
let eventSeq = 0;
async function webhook(type, object) {
  const payload = JSON.stringify({ id: `evt_wise_${++eventSeq}`, type, data: { object } });
  const response = await handleApi(new Request("https://nurevo.jp/api/billing/webhook", { method: "POST", headers: { "stripe-signature": await sign(payload) }, body: payload }), env, {});
  return response.status;
}
async function member(id, email, createdAt = Date.now()) {
  sqlite.prepare("INSERT INTO orgs(id) VALUES (?)").run(`org_${id}`);
  sqlite.prepare("INSERT INTO members(id,org_id,email,status,role) VALUES (?,?,?,'active','admin')").run(id, `org_${id}`, email);
  sqlite.prepare("INSERT INTO accounts(member_id,email,created_at) VALUES (?,?,?)").run(id, email, createdAt);
  const token = `session-${id}`;
  sqlite.prepare("INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES (?,?,?,'session',?)").run(await sha256Hex(token), id, `org_${id}`, Date.now() + 3600_000);
  return { cookie: `nrv_session=${token}`, id: sqlite.prepare("SELECT id FROM accounts WHERE member_id=?").get(id).id };
}
const CSRF = "d".repeat(64);
async function call(path, { cookie = "", csrf = true, body } = {}) {
  const headers = { "content-type": "application/json", "cf-connecting-ip": "203.0.113.20" };
  if (cookie) headers.cookie = cookie + (csrf ? `; nrv_csrf=${CSRF}` : "");
  if (cookie && csrf) headers["x-csrf-token"] = CSRF;
  const method = body === undefined ? "GET" : "POST";
  const response = await handleApi(new Request(`https://nurevo.jp${path}`, { method, headers, ...(method === "POST" ? { body: JSON.stringify(body) } : {}) }), env, {});
  return { status: response.status, body: await response.json() };
}
function charge(id, { amount = 3000, fee = 108, refunded = 0, availableOn = Math.floor(Date.now() / 1000) - 86400 } = {}) {
  charges.set(id, { id, object: "charge", amount, amount_refunded: refunded, currency: "jpy", disputed: false,
    balance_transaction: { id: `txn_${id}`, currency: "jpy", amount, fee, net: amount - fee, available_on: availableOn } });
}
function site(id, owner, sub) {
  sqlite.prepare("INSERT INTO sites(id,org_id,url,site_key,owner_member_id,plan,contract,stripe_subscription_id,channel,created_at) VALUES (?,?,?,?,?,'standard','active',?,'direct',?)")
    .run(id, `org_${owner}`, `${id}.example.test`, id, owner, sub, Date.now());
}
const invoice = (id, chargeId, sub) => ({ id, object: "invoice", status: "paid", currency: "jpy", amount_paid: 3000, charge: chargeId, subscription: sub });
const row = (invoiceId) => sqlite.prepare("SELECT * FROM referral_payouts WHERE kind='commission' AND invoice_id=?").get(invoiceId);
const quiet = async (fn) => { const e = console.error, l = console.log; console.error = console.log = () => {}; try { return await fn(); } finally { console.error = e; console.log = l; } };
const C = (net) => Math.floor(net * 0.4);
const WISE = { account_name: "Jane Doe", email: "Jane.Doe@Example.test", currency: "usd", country: "us" };

try {
  const partner = await member("wp", "wp@example.test", 1);
  const boss = await member("boss", "boss@example.test", 1);
  const outsider = await member("out", "out@example.test", 1);

  /* --- auto-approval through the route --- */
  const applied = await quiet(() => call("/api/partner/apply", { cookie: partner.cookie, body: {} }));
  assert.equal(applied.status, 200);
  assert.equal(applied.body.partner_status, "approved", "auto-approved");
  assert.match(applied.body.referral_code, /^[A-Z2-9]{12}$/, "a code is issued with the approval");

  /* --- before 0050: nothing breaks, Wise is refused with 503 --- */
  let summary = await quiet(() => call("/api/partner", { cookie: partner.cookie }));
  assert.equal(summary.status, 200);
  assert.equal(summary.body.payout.method, "stripe");
  assert.equal(summary.body.payout.wise_available, false);
  assert.equal(summary.body.payout.wise, null);
  let saved = await call("/api/partner/payout/wise", { cookie: partner.cookie, body: WISE });
  assert.equal(saved.status, 503); assert.equal(saved.body.error, "wise_unavailable");
  assert.equal((await call("/api/partner/payout/method", { cookie: partner.cookie, body: { method: "wise" } })).status, 503);
  let apps = await quiet(() => call("/api/admin/partner-applications", { cookie: boss.cookie }));
  assert.equal(apps.status, 200); assert.equal(apps.body.wise_available, false);
  assert.equal(apps.body.approved[0].payout_method, "stripe");
  assert.equal((await call(`/api/admin/partners/${partner.id}/wise-paid`, { cookie: boss.cookie, body: { expected_yen: 1 } })).status, 503);
  assert.equal((await quiet(() => runPartnerPayouts(env))).wise_synced, 0, "the hourly job runs before 0050");

  sqlite.exec(read("../nurevo-impl/db/0050_partner_wise_payout.sql"));
  assert.equal(sqlite.prepare("SELECT payout_method FROM accounts WHERE id=?").get(partner.id).payout_method, "stripe", "existing partners default to Stripe");

  /* --- saving Wise details --- */
  assert.equal((await call("/api/partner/payout/wise", { cookie: partner.cookie, csrf: false, body: WISE })).status, 403, "CSRF required");
  assert.equal((await call("/api/partner/payout/wise", { body: WISE })).status, 403, "signed out: refused");
  saved = await call("/api/partner/payout/wise", { cookie: outsider.cookie, body: WISE });
  assert.equal(saved.status, 403); assert.equal(saved.body.error, "partner_not_approved", "only approved partners");
  saved = await call("/api/partner/payout/wise", { cookie: partner.cookie, body: { account_name: "<b>x</b>", email: "nope", currency: "XYZ", country: "USA" } });
  assert.equal(saved.status, 400);
  assert.deepEqual(saved.body.fields, { account_name: "invalid", email: "invalid", currency: "unsupported", country: "invalid" });
  assert.equal(sqlite.prepare("SELECT payout_method FROM accounts WHERE id=?").get(partner.id).payout_method, "stripe", "an invalid save changes nothing");
  saved = await call("/api/partner/payout/wise", { cookie: partner.cookie, body: WISE });
  assert.equal(saved.status, 200);
  assert.deepEqual({ ...sqlite.prepare("SELECT payout_method, wise_account_name, wise_email, wise_currency, wise_country FROM accounts WHERE id=?").get(partner.id) },
    { payout_method: "wise", wise_account_name: "Jane Doe", wise_email: "jane.doe@example.test", wise_currency: "USD", wise_country: "US" });
  summary = await quiet(() => call("/api/partner", { cookie: partner.cookie }));
  assert.equal(summary.body.payout.method, "wise"); assert.equal(summary.body.payout.wise_available, true);
  assert.equal(summary.body.payout.wise.email_masked, "j******@example.test");
  assert.equal(JSON.stringify(summary.body).includes("jane.doe@example.test"), false, "the partner page never returns the full address");
  assert.ok(summary.body.payout.wise_currencies.includes("USD"));
  assert.equal(summary.body.payout.rate, 0.4, "the rate is unchanged");

  /* --- switching method --- */
  assert.equal((await call("/api/partner/payout/method", { cookie: partner.cookie, body: { method: "paypal" } })).status, 400);
  assert.equal((await call("/api/partner/payout/method", { cookie: partner.cookie, body: { method: "stripe" } })).body.method, "stripe");
  assert.equal(sqlite.prepare("SELECT payout_method FROM accounts WHERE id=?").get(partner.id).payout_method, "stripe");
  assert.equal((await call("/api/partner/payout/method", { cookie: partner.cookie, body: { method: "wise" } })).status, 200, "back to Wise with the saved details");
  const fresh = await member("fresh", "fresh@example.test", 1);
  await quiet(() => call("/api/partner/apply", { cookie: fresh.cookie, body: {} }));
  const noDetails = await call("/api/partner/payout/method", { cookie: fresh.cookie, body: { method: "wise" } });
  assert.equal(noDetails.status, 409); assert.equal(noDetails.body.error, "wise_details_required");

  /* --- commission: unchanged rules, never a Stripe transfer for Wise --- */
  // Even with a ready Stripe account, a Wise partner's rows stay held for the admin.
  sqlite.prepare("UPDATE accounts SET stripe_account_id='acct_wise', payout_status='ready', payout_checked_at=? WHERE id=?").run(Date.now(), partner.id);
  const first = await member("c1", "c1@example.test");
  const second = await member("c2", "c2@example.test");
  for (const c of [first, second]) sqlite.prepare("UPDATE accounts SET referred_by_account_id=? WHERE id=?").run(partner.id, c.id);
  site("s1", "c1", "sub_1"); site("s2", "c2", "sub_2");
  charge("ch_1"); charge("ch_2"); charge("ch_3");
  assert.equal(await quiet(() => webhook("invoice.paid", invoice("in_1", "ch_1", "sub_1"))), 200);
  assert.equal(row("in_1").status, "void", "the first customer earns nothing (unchanged)");
  assert.equal(await quiet(() => webhook("invoice.paid", invoice("in_2", "ch_2", "sub_2"))), 200);
  assert.equal(row("in_2").status, "held"); assert.equal(row("in_2").kept_yen, C(3000 - 108), "40% of the net (unchanged)");
  await quiet(() => runPartnerPayouts(env));
  assert.equal(row("in_2").status, "held", "the hourly job does not pay a Wise partner");
  assert.equal(calls.filter((c) => c.endsWith("/v1/transfers")).length, 0);

  /* --- the admin list shows the amount due --- */
  assert.equal((await call("/api/admin/partner-applications", { cookie: partner.cookie })).status, 403);
  apps = await quiet(() => call("/api/admin/partner-applications", { cookie: boss.cookie }));
  assert.equal(apps.body.wise_available, true);
  const listed = apps.body.approved.find((a) => a.account_id === partner.id);
  assert.equal(listed.payout_method, "wise"); assert.equal(listed.auto_approved, true);
  assert.equal(listed.wise.email, "jane.doe@example.test", "the super admin sees the full address to send to");
  assert.equal(listed.wise.currency, "USD"); assert.equal(listed.wise.country, "US");
  assert.equal(listed.wise.due_yen, C(2892)); assert.equal(listed.wise.due_rows, 1); assert.equal(listed.wise.debt_yen, 0);
  assert.equal(apps.body.approved.find((a) => a.account_id === fresh.id).wise, null, "a Stripe partner has no Wise block");

  /* --- recording the Wise payment --- */
  const paidPath = `/api/admin/partners/${partner.id}/wise-paid`;
  assert.equal((await call(paidPath, { cookie: partner.cookie, body: { expected_yen: C(2892) } })).status, 403, "super admin only");
  assert.equal((await call(paidPath, { cookie: boss.cookie, csrf: false, body: { expected_yen: C(2892) } })).status, 403, "CSRF required");
  let paid = await call(paidPath, { cookie: boss.cookie, body: { expected_yen: 1 } });
  assert.equal(paid.status, 409); assert.equal(paid.body.error, "amount_changed");
  assert.equal(row("in_2").status, "held", "a mismatched amount records nothing");
  assert.equal((await call(`/api/admin/partners/${fresh.id}/wise-paid`, { cookie: boss.cookie, body: { expected_yen: 0 } })).body.error, "not_wise_partner");
  paid = await quiet(() => call(paidPath, { cookie: boss.cookie, body: { expected_yen: C(2892), reference: "WISE-123" } }));
  assert.equal(paid.status, 200); assert.equal(paid.body.paid_yen, C(2892)); assert.equal(paid.body.rows, 1);
  const sent = row("in_2");
  assert.equal(sent.status, "sent"); assert.equal(sent.destination, "wise"); assert.equal(sent.transfer_id, null);
  assert.equal(sent.transferred_yen, C(2892)); assert.equal(sent.manual_reference, "WISE-123"); assert.equal(sent.manual_paid_by, "boss");
  paid = await call(paidPath, { cookie: boss.cookie, body: { expected_yen: C(2892) } });
  assert.equal(paid.status, 409); assert.equal(paid.body.error, "nothing_due", "never recorded twice");
  summary = await quiet(() => call("/api/partner", { cookie: partner.cookie }));
  assert.equal(summary.body.payout.cumulative_paid_yen, C(2892), "the partner page shows it as paid");

  /* --- a refund after the Wise payment is withheld from the next one --- */
  charges.get("ch_2").amount_refunded = 3000;
  assert.equal(await quiet(() => webhook("charge.refunded", charges.get("ch_2"))), 200);
  assert.equal(row("in_2").kept_yen, 0);
  assert.equal(calls.filter((c) => c.includes("/reversals")).length, 0, "no Stripe reversal for a Wise payment");
  assert.equal(await quiet(() => webhook("invoice.paid", invoice("in_3", "ch_3", "sub_2"))), 200);
  let due = await wiseDue(env, partner.id);
  assert.deepEqual([due.gross_yen, due.debt_yen, due.due_yen], [C(2892), C(2892), 0], "the refunded amount offsets the next payout");
  assert.equal((await call(paidPath, { cookie: boss.cookie, body: { expected_yen: 0 } })).body.error, "nothing_due");
  // Another month: a new invoice; the debt was already offset once only.
  charge("ch_4");
  assert.equal(await quiet(() => webhook("invoice.paid", invoice("in_4", "ch_4", "sub_2"))), 200);
  due = await wiseDue(env, partner.id);
  assert.deepEqual([due.gross_yen, due.debt_yen, due.due_yen], [2 * C(2892), C(2892), C(2892)]);
  paid = await quiet(() => call(paidPath, { cookie: boss.cookie, body: { expected_yen: C(2892) } }));
  assert.equal(paid.status, 200); assert.equal(paid.body.paid_yen, C(2892), "paid net of the refund");
  due = await wiseDue(env, partner.id);
  assert.deepEqual([due.gross_yen, due.debt_yen, due.due_yen], [0, 0, 0], "the debt is recovered exactly once");
  assert.equal(calls.filter((c) => c.endsWith("/v1/transfers")).length, 0);
  console.log("PASS: Wise payouts (0050): pre-migration tolerance (summary, admin list, hourly job; saves refused 503), validation, approved partners only, masked address on the partner page, method switch, unchanged 40%/first-customer rules, never a Stripe transfer or reversal for a Wise partner, admin list amount due, record-as-sent (super admin, CSRF, exact amount, once), refund offset on the next payout; auto-approval issues the code. No real Stripe calls.");
} finally { globalThis.fetch = originalFetch; sqlite.close(); }
