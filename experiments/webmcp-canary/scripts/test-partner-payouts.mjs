/**
 * Partner commission payouts (worker/partner-payouts.mjs) against real SQL
 * (schema + migrations 0029, 0030, 0039) and a stubbed Stripe. No real Stripe
 * call is possible: fetch is replaced and anything unexpected fails the test.
 *
 *  - commission = floor(40% × balance_transaction.net), per invoice
 *  - signed webhook only; the same event twice -> one transfer
 *  - every transfer carries source_transaction = the charge (never from the
 *    platform balance); an unresolved charge or fee stays held
 *  - held -> released (hourly job and account.updated)
 *  - refund reversal (partial, proportional; full), refund of a held row
 *  - legacy referrer + account referral on one site -> paid once
 *  - a reversal that cannot be pulled back is recovered from the next commission
 *  - onboarding route: auth, CSRF, one Express account (JP, transfers,
 *    monthly payout on the 25th), schedule corrected when it differs
 */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { handleApi } from "../worker/api.mjs";
import { runPartnerPayouts, payoutWindow, partnerLedgerTotals } from "../worker/partner-payouts.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const sqlite = new DatabaseSync(":memory:");
sqlite.exec(read("../nurevo-impl/db/schema.sql"));
sqlite.exec("ALTER TABLE sites ADD COLUMN manual_plan TEXT");
sqlite.exec(read("../nurevo-impl/db/0029_member_email_preferences.sql"));
sqlite.exec(read("../nurevo-impl/db/0030_account_referrals.sql"));
sqlite.exec(read("../nurevo-impl/db/0039_partner_payouts.sql"));
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
const WEBHOOK_SECRET = "whsec_test_partner", CONNECT_SECRET = "whsec_test_connect";
const env = { DB, DEV: "1", STRIPE_SECRET_KEY: "sk_test_partner_payouts", STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET, STRIPE_CONNECT_WEBHOOK_SECRET: CONNECT_SECRET, STRIPE_PRICE_ID_STANDARD: "price_std", STRIPE_PRICE_ID_PRO: "price_pro" };

/* ---------------- Stripe stub ---------------- */
const stripe = {
  accounts: new Map(), idem: new Map(), transfers: [], reversals: [], charges: new Map(), invoices: new Map(),
  calls: [], failReversals: false, accountSeq: 0,
};
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(String(input));
  assert.equal(url.origin, "https://api.stripe.com", `unexpected network call ${url.origin}`);
  const method = options.method || "GET";
  const headers = options.headers || {};
  const form = Object.fromEntries(new URLSearchParams(options.body || ""));
  const key = headers["idempotency-key"];
  stripe.calls.push({ method, path: url.pathname, query: url.search, form, key });
  const ok = (data) => Response.json(data);
  const replay = (k, make) => { if (k && stripe.idem.has(k)) return stripe.idem.get(k); const v = make(); if (k) stripe.idem.set(k, v); return v; };
  let m;
  if (method === "POST" && url.pathname === "/v1/accounts") {
    return ok(replay(key, () => {
      const id = `acct_test_${++stripe.accountSeq}`;
      const account = { id, country: form.country, type: form.type, capabilities: { transfers: "inactive" }, details_submitted: false,
        requirements: { currently_due: ["external_account", "representative.first_name_kanji"], past_due: [], disabled_reason: "requirements.past_due" },
        settings: { payouts: { schedule: { interval: form["settings[payouts][schedule][interval]"], monthly_anchor: Number(form["settings[payouts][schedule][monthly_anchor]"]) } } },
        _form: form };
      stripe.accounts.set(id, account);
      return account;
    }));
  }
  if ((m = url.pathname.match(/^\/v1\/accounts\/([^/]+)$/))) {
    const account = stripe.accounts.get(m[1]);
    if (!account) return Response.json({ error: { code: "resource_missing" } }, { status: 404 });
    if (method === "POST") {
      account.settings.payouts.schedule = { interval: form["settings[payouts][schedule][interval]"], monthly_anchor: Number(form["settings[payouts][schedule][monthly_anchor]"]) };
    }
    return ok(account);
  }
  if (method === "POST" && (m = url.pathname.match(/^\/v1\/accounts\/([^/]+)\/login_links$/))) return ok({ url: `https://connect.stripe.com/express/${m[1]}` });
  if (method === "POST" && url.pathname === "/v1/account_links") {
    assert.equal(form.type, "account_onboarding");
    assert.match(form.return_url, /^https:\/\/nurevo\.jp\/dashboard\?payout=return#partner$/);
    assert.match(form.refresh_url, /^https:\/\/nurevo\.jp\/dashboard\?payout=refresh#partner$/);
    return ok({ url: `https://connect.stripe.com/setup/e/${form.account}` });
  }
  if (method === "GET" && (m = url.pathname.match(/^\/v1\/charges\/([^/]+)$/))) {
    const charge = stripe.charges.get(m[1]);
    return charge ? ok(charge) : Response.json({ error: { code: "resource_missing" } }, { status: 404 });
  }
  if (method === "GET" && url.pathname === "/v1/invoice_payments") return ok({ data: [] });
  if (method === "GET" && (m = url.pathname.match(/^\/v1\/invoices\/([^/]+)$/))) {
    const invoice = stripe.invoices.get(m[1]);
    return invoice ? ok(invoice) : Response.json({ error: { code: "resource_missing" } }, { status: 404 });
  }
  if (url.pathname === "/v1/transfers" && method === "POST") {
    // The hard rule: Nurevo never advances money from its own balance.
    assert.ok(form.source_transaction, "every transfer carries source_transaction");
    assert.ok(stripe.charges.has(form.source_transaction), "source_transaction is the customer's charge");
    assert.equal(form.currency, "jpy");
    assert.ok(key, "every transfer has an Idempotency-Key");
    return ok(replay(key, () => {
      const transfer = { id: `tr_${stripe.transfers.length + 1}`, amount: Number(form.amount), destination: form.destination, source_transaction: form.source_transaction, transfer_group: form.transfer_group, metadata: { ledger_id: form["metadata[ledger_id]"] } };
      stripe.transfers.push(transfer);
      return transfer;
    }));
  }
  if (url.pathname === "/v1/transfers" && method === "GET") {
    const group = url.searchParams.get("transfer_group");
    return ok({ data: stripe.transfers.filter((t) => t.transfer_group === group) });
  }
  if (method === "POST" && (m = url.pathname.match(/^\/v1\/transfers\/([^/]+)\/reversals$/))) {
    if (stripe.failReversals) return Response.json({ error: { code: "balance_insufficient" } }, { status: 400 });
    return ok(replay(key, () => { const r = { id: `trr_${stripe.reversals.length + 1}`, transfer: m[1], amount: Number(form.amount) }; stripe.reversals.push(r); return r; }));
  }
  throw new Error(`unexpected Stripe call ${method} ${url.pathname}`);
};

/* ---------------- helpers ---------------- */
async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function sign(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  return `t=${timestamp},v1=${[...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}
let eventSeq = 0;
async function webhook(type, object, { secret = WEBHOOK_SECRET, id = `evt_${++eventSeq}`, account } = {}) {
  const payload = JSON.stringify({ id, type, ...(account ? { account } : {}), data: { object } });
  const response = await handleApi(new Request("https://nurevo.jp/api/billing/webhook", { method: "POST", headers: { "stripe-signature": await sign(payload, secret) }, body: payload }), env, {});
  return { status: response.status, body: await response.json() };
}
async function member(id, email) {
  sqlite.prepare("INSERT INTO orgs(id) VALUES (?)").run(`org_${id}`);
  sqlite.prepare("INSERT INTO members(id,org_id,email,status,role) VALUES (?,?,?,'active','store')").run(id, `org_${id}`, email);
  sqlite.prepare("INSERT INTO accounts(member_id,email,created_at) VALUES (?,?,?)").run(id, email, Date.now());
  const token = `session-${id}`;
  sqlite.prepare("INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES (?,?,?,'session',?)").run(await sha256Hex(token), id, `org_${id}`, Date.now() + 3600_000);
  return { cookie: `nrv_session=${token}`, account: sqlite.prepare("SELECT * FROM accounts WHERE member_id=?").get(id) };
}
const CSRF = "c".repeat(64);
async function call(path, { cookie = "", csrf = true, method } = {}) {
  const headers = { "content-type": "application/json", "cf-connecting-ip": "203.0.113.9" };
  if (cookie) headers.cookie = cookie + (csrf ? `; nrv_csrf=${CSRF}` : "");
  if (cookie && csrf) headers["x-csrf-token"] = CSRF;
  const m = method || "GET";
  const response = await handleApi(new Request(`https://nurevo.jp${path}`, { method: m, headers, ...(m === "POST" ? { body: "{}" } : {}) }), env, {});
  return { status: response.status, body: await response.json() };
}
function refer(child, partner) { sqlite.prepare("UPDATE accounts SET referred_by_account_id=? WHERE id=?").run(partner.account.id, child.account.id); }
function site(id, owner, sub, extra = {}) {
  sqlite.prepare("INSERT INTO sites(id,org_id,url,site_key,owner_member_id,plan,contract,stripe_subscription_id,channel,referred_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
    .run(id, `org_${owner}`, `${id}.example.test`, id, owner, extra.plan || "standard", "active", sub, extra.channel || "direct", extra.referred_by || null, Date.now());
}
function charge(id, { amount = 3000, fee = 108, currency = "jpy", net, availableOn = Math.floor(Date.now() / 1000) + 4 * 86400, refunded = 0 } = {}) {
  const c = { id, object: "charge", amount, amount_refunded: refunded, currency, balance_transaction: { id: `txn_${id}`, currency: "jpy", amount, fee, net: net ?? amount - fee, available_on: availableOn } };
  stripe.charges.set(id, c);
  return c;
}
const invoice = (id, chargeId, sub, extra = {}) => ({ id, object: "invoice", status: "paid", currency: "jpy", amount_paid: 3000, charge: chargeId, subscription: sub, ...extra });
const rows = () => sqlite.prepare("SELECT * FROM referral_payouts ORDER BY id").all();
const transfersPosted = () => stripe.calls.filter((c) => c.method === "POST" && c.path === "/v1/transfers");
const quiet = async (fn) => { const e = console.error; console.error = () => {}; try { return await fn(); } finally { console.error = e; } };

try {
  const partner = await member("partner", "partner@example.test");
  const customer = await member("customer", "customer@example.test");
  refer(customer, partner);
  site("site_a", "customer", "sub_a");

  /* --- onboarding route: auth and CSRF --- */
  assert.equal((await call("/api/partner/payout/onboard", { method: "POST" })).status, 403, "no CSRF token, no session -> refused before anything");
  assert.equal((await call("/api/partner/payout/onboard", { method: "POST", cookie: "nrv_session=nope" })).status, 401, "unknown session");
  assert.equal((await call("/api/partner/payout/onboard", { method: "POST", cookie: partner.cookie, csrf: false })).status, 403, "CSRF required");
  assert.equal(stripe.calls.length, 0, "nothing reached Stripe");

  /* --- commission while the partner has not onboarded: held --- */
  charge("ch_1");
  let r = await webhook("invoice.paid", invoice("in_1", "ch_1", "sub_a"));
  assert.equal(r.status, 200);
  let ledger = rows();
  assert.equal(ledger.length, 1);
  assert.equal(ledger[0].status, "held", "no payout account yet -> held");
  assert.equal(ledger[0].paid_yen, 2892, "basis: balance_transaction.net (3,000 - 108)");
  assert.equal(ledger[0].amount_yen, 1156, "floor(40% x 2,892)");
  assert.equal(ledger[0].partner_account_id, partner.account.id);
  assert.ok(ledger[0].available_at > Date.now(), "the charge's available_on is stored");
  assert.equal(transfersPosted().length, 0);

  /* --- onboarding: one Express account, JP, transfers, monthly on the 25th --- */
  r = await call("/api/partner/payout/onboard", { method: "POST", cookie: partner.cookie });
  assert.equal(r.status, 200);
  assert.equal(r.body.kind, "onboarding");
  assert.match(r.body.url, /^https:\/\/connect\.stripe\.com\/setup\//);
  const created = stripe.calls.filter((c) => c.method === "POST" && c.path === "/v1/accounts");
  assert.equal(created.length, 1);
  assert.equal(created[0].form.type, "express");
  assert.equal(created[0].form.country, "JP", "partners are Japan-based");
  assert.equal(created[0].form["capabilities[transfers][requested]"], "true");
  assert.equal(created[0].form["settings[payouts][schedule][interval]"], "monthly");
  assert.equal(created[0].form["settings[payouts][schedule][monthly_anchor]"], "25");
  assert.equal(created[0].key, `nurevo-partner-account-${partner.account.id}`);
  assert.equal(Object.keys(created[0].form).some((k) => /bank|external_account|routing|account_number/.test(k)), false, "Nurevo never sends or stores bank details");
  const acctId = sqlite.prepare("SELECT stripe_account_id FROM accounts WHERE id=?").get(partner.account.id).stripe_account_id;
  assert.equal(acctId, "acct_test_1");
  r = await call("/api/partner/payout/onboard", { method: "POST", cookie: partner.cookie });
  assert.equal(r.status, 200);
  assert.equal(stripe.calls.filter((c) => c.method === "POST" && c.path === "/v1/accounts").length, 1, "the account is created once");

  let summary = (await call("/api/partner", { cookie: partner.cookie })).body;
  assert.equal(summary.payout.account.status, "in_progress");
  assert.equal(summary.payout.account.currently_due, 2);
  assert.equal(summary.payout.held_yen, 1156);
  assert.equal(summary.payout.cumulative_paid_yen, 0);
  assert.equal(summary.payout.payout_day, 25);

  /* --- hourly job while not ready: still held --- */
  await runPartnerPayouts(env, { now: Date.now() + 6 * 60_000 });
  assert.equal(transfersPosted().length, 0);
  assert.equal(rows()[0].status, "held");

  /* --- account.updated (Connect endpoint) makes it ready -> released --- */
  const acct = stripe.accounts.get(acctId);
  acct.capabilities.transfers = "active"; acct.details_submitted = true; acct.requirements = { currently_due: [], past_due: [] };
  r = await webhook("account.updated", acct, { secret: CONNECT_SECRET, account: acctId });
  assert.equal(r.status, 200);
  assert.equal(transfersPosted().length, 1, "held commission paid once the account can receive transfers");
  let t = transfersPosted()[0].form;
  assert.equal(t.amount, "1156");
  assert.equal(t.destination, acctId);
  assert.equal(t.source_transaction, "ch_1");
  assert.equal(transfersPosted()[0].key, "nurevo-referral-in_1-1156");
  assert.equal(rows()[0].status, "sent");
  await runPartnerPayouts(env, { now: Date.now() + 60 * 60_000 });
  assert.equal(transfersPosted().length, 1, "released once, never again");

  /* --- a Connect event cannot create commission --- */
  r = await webhook("invoice.paid", invoice("in_conn", "ch_1", "sub_a"), { secret: CONNECT_SECRET, account: acctId });
  assert.equal(r.status, 200);
  assert.equal(rows().filter((x) => x.invoice_id === "in_conn").length, 0);
  assert.equal((await webhook("invoice.paid", invoice("in_forged", "ch_1", "sub_a"), { secret: "whsec_wrong" })).status, 400, "unsigned -> refused");

  /* --- ready partner: paid immediately; the same event twice -> one transfer --- */
  charge("ch_2", { amount: 14800, fee: 533 });
  const event2 = `evt_same_${Date.now()}`;
  r = await webhook("invoice.paid", invoice("in_2", "ch_2", "sub_a", { amount_paid: 14800 }), { id: event2 });
  assert.equal(r.status, 200);
  r = await webhook("invoice.paid", invoice("in_2", "ch_2", "sub_a", { amount_paid: 14800 }), { id: event2 });
  assert.equal(r.body.duplicate, true);
  r = await webhook("invoice.paid", invoice("in_2", "ch_2", "sub_a", { amount_paid: 14800 }));
  assert.equal(transfersPosted().length, 2, "a redelivered or re-sent invoice.paid never pays twice");
  t = transfersPosted()[1].form;
  assert.equal(t.amount, String(Math.floor((14800 - 533) * 0.4)), "Pro: 40% of the net");
  assert.equal(t.source_transaction, "ch_2");

  /* --- zero invoice (coupon): nothing --- */
  await webhook("invoice.paid", invoice("in_zero", null, "sub_a", { amount_paid: 0 }));
  assert.equal(rows().some((x) => x.invoice_id === "in_zero"), false);

  /* --- partial refund -> proportional reversal; full refund -> the rest --- */
  let c2 = stripe.charges.get("ch_2");
  const commission2 = Math.floor((14800 - 533) * 0.4);
  await webhook("charge.refunded", { ...c2, amount_refunded: 7400 });
  assert.equal(stripe.reversals.length, 1);
  const kept = Math.floor(commission2 * (14800 - 7400) / 14800);
  assert.equal(stripe.reversals[0].amount, commission2 - kept, "half refunded -> the commission reversed in proportion");
  await webhook("charge.refunded", { ...c2, amount_refunded: 7400 }); // a second delivery of the same state
  assert.equal(stripe.reversals.length, 1, "the same refund is reversed once");
  await webhook("charge.refunded", { ...c2, amount_refunded: 14800 });
  assert.equal(stripe.reversals.length, 2);
  assert.equal(stripe.reversals[0].amount + stripe.reversals[1].amount, commission2, "fully refunded -> fully reversed");
  assert.equal(rows().find((x) => x.invoice_id === "in_2" && x.kind === "commission").status, "reversed");

  /* --- legacy referrer + account referral on the same site -> paid once --- */
  sqlite.prepare("INSERT INTO referrers(id,name,email,stripe_account_id,created_at) VALUES ('ref_legacy','Legacy','legacy@example.test','acct_legacy',?)").run(Date.now());
  site("site_both", "customer", "sub_both", { channel: "referral", referred_by: "ref_legacy" });
  charge("ch_3");
  await webhook("invoice.paid", invoice("in_3", "ch_3", "sub_both", { metadata: { siteId: "site_both" } }));
  await webhook("invoice.paid", invoice("in_3", "ch_3", "sub_both", { metadata: { siteId: "site_both" } }));
  const both = transfersPosted().filter((c) => c.form.source_transaction === "ch_3");
  assert.equal(both.length, 1, "one invoice, one transfer, whichever path finds the partner");
  assert.equal(both[0].form.destination, acctId, "the account referral wins over the legacy referrer");
  assert.equal(rows().filter((x) => x.invoice_id === "in_3").length, 1);

  /* --- legacy-only site goes through the same ledger --- */
  const legacyOwner = await member("legacy_owner", "legacy-owner@example.test");
  site("site_legacy", "legacy_owner", "sub_legacy", { channel: "referral", referred_by: "ref_legacy" });
  void legacyOwner;
  charge("ch_4");
  await webhook("invoice.paid", invoice("in_4", "ch_4", "sub_legacy"));
  const legacy = transfersPosted().filter((c) => c.form.source_transaction === "ch_4");
  assert.equal(legacy.length, 1);
  assert.equal(legacy[0].form.destination, "acct_legacy");
  assert.equal(rows().find((x) => x.invoice_id === "in_4").legacy_referrer_id, "ref_legacy");

  /* --- charge not resolvable yet: held, never paid from the platform balance --- */
  stripe.invoices.set("in_5", invoice("in_5", null, "sub_a", { currency: "usd", amount_paid: 2000 }));
  await webhook("invoice.paid", invoice("in_5", null, "sub_a", { currency: "usd", amount_paid: 2000 }));
  let row5 = rows().find((x) => x.invoice_id === "in_5");
  assert.equal(row5.status, "held");
  assert.equal(row5.charge_id, null);
  assert.equal(row5.last_error, "charge_unresolved");
  assert.equal(transfersPosted().filter((c) => c.form.metadata?.invoice_id === "in_5" || c.form["metadata[invoice_id]"] === "in_5").length, 0);
  await runPartnerPayouts(env, { now: Date.now() + 61 * 60_000 });
  assert.equal(transfersPosted().filter((c) => c.form["metadata[invoice_id]"] === "in_5").length, 0, "still unresolved -> still held");
  // The charge appears (with its USD charge settled to JPY): the hourly job pays it.
  charge("ch_5", { amount: 2000, currency: "usd", net: 2890, fee: 110 });
  stripe.invoices.set("in_5", invoice("in_5", "ch_5", "sub_a", { currency: "usd", amount_paid: 2000 }));
  await runPartnerPayouts(env, { now: Date.now() + 62 * 60_000 });
  const paid5 = transfersPosted().filter((c) => c.form["metadata[invoice_id]"] === "in_5");
  assert.equal(paid5.length, 1);
  assert.equal(paid5[0].form.amount, String(Math.floor(2890 * 0.4)));
  assert.equal(paid5[0].form.source_transaction, "ch_5");

  /* --- JPY invoice whose fee is not readable yet: held, not paid on amount_paid --- */
  stripe.charges.set("ch_6", { id: "ch_6", amount: 3000, currency: "jpy", balance_transaction: "txn_pending" });
  await webhook("invoice.paid", invoice("in_6", "ch_6", "sub_a"));
  assert.equal(rows().find((x) => x.invoice_id === "in_6").status, "held");
  assert.equal(transfersPosted().filter((c) => c.form.source_transaction === "ch_6").length, 0);

  /* --- refund of a held row reduces it (no Stripe call) --- */
  const other = await member("partner2", "partner2@example.test");
  const customer2 = await member("customer2", "customer2@example.test");
  refer(customer2, other);
  site("site_c", "customer2", "sub_c");
  charge("ch_7");
  await webhook("invoice.paid", invoice("in_7", "ch_7", "sub_c"));
  assert.equal(rows().find((x) => x.invoice_id === "in_7").status, "held");
  const reversalsBefore = stripe.reversals.length;
  await webhook("charge.refunded", { ...stripe.charges.get("ch_7"), amount_refunded: 1000 });
  const row7 = rows().find((x) => x.invoice_id === "in_7" && x.kind === "commission");
  assert.equal(row7.refunded_yen, 1156 - Math.floor(1156 * 2000 / 3000), "a held commission is reduced in proportion");
  assert.equal(stripe.reversals.length, reversalsBefore);
  await webhook("charge.refunded", { ...stripe.charges.get("ch_7"), amount_refunded: 3000 });
  assert.equal(rows().find((x) => x.invoice_id === "in_7" && x.kind === "commission").status, "reversed", "a fully refunded held commission is never paid");

  /* --- a reversal that fails (balance already paid out) is recovered from the next commission --- */
  charge("ch_8");
  await webhook("invoice.paid", invoice("in_8", "ch_8", "sub_a"));
  assert.equal(rows().find((x) => x.invoice_id === "in_8").status, "sent");
  stripe.failReversals = true;
  await quiet(() => webhook("charge.refunded", { ...stripe.charges.get("ch_8"), amount_refunded: 3000 }));
  const debt = rows().find((x) => x.kind === "reversal" && x.charge_id === "ch_8");
  assert.equal(debt.status, "failed");
  assert.equal(debt.amount_yen, 1156);
  charge("ch_9", { amount: 14800, fee: 533 });
  await webhook("invoice.paid", invoice("in_9", "ch_9", "sub_a", { amount_paid: 14800 }));
  const t9 = transfersPosted().filter((c) => c.form.source_transaction === "ch_9");
  assert.equal(t9.length, 1);
  assert.equal(Number(t9[0].form.amount), Math.floor((14800 - 533) * 0.4) - 1156, "the unrecovered reversal is withheld from the next transfer");
  assert.equal(rows().find((x) => x.id === debt.id).status, "offset");
  stripe.failReversals = false;

  /* --- the hard rule over the whole run --- */
  assert.ok(transfersPosted().length >= 6);
  for (const call of transfersPosted()) assert.ok(call.form.source_transaction, "no /v1/transfers call is ever made without source_transaction");

  /* --- schedule corrected on refresh; ready -> update opens the Express dashboard --- */
  acct.settings.payouts.schedule = { interval: "daily" };
  summary = (await call("/api/partner?refresh=1", { cookie: partner.cookie })).body;
  assert.equal(summary.payout.account.status, "ready");
  assert.deepEqual(stripe.accounts.get(acctId).settings.payouts.schedule, { interval: "monthly", monthly_anchor: 25 }, "a differing schedule is set back to monthly on the 25th");
  r = await call("/api/partner/payout/onboard", { method: "POST", cookie: partner.cookie });
  assert.equal(r.body.kind, "dashboard");

  /* --- partner page totals from the ledger --- */
  const earned = rows().filter((x) => x.partner_account_id === partner.account.id).reduce((n, x) => n + (x.kind === "commission" ? (x.status === "void" ? 0 : x.amount_yen) : -x.amount_yen), 0);
  assert.equal(summary.payout.cumulative_earned_yen, earned);
  assert.equal(summary.payout.paid_status, "ledger");
  assert.equal(summary.payout.monthly_estimate_yen, 2400, "two active Standard subscriptions (before Stripe fees)");
  const paidNet = rows().filter((x) => x.partner_account_id === partner.account.id && x.kind === "commission").reduce((n, x) => n + x.transferred_yen - x.reversed_back_yen, 0);
  assert.equal(summary.payout.cumulative_paid_yen, paidNet);
  assert.ok(summary.payout.later_payout_yen >= summary.payout.held_yen, "held commission is counted as later");

  /* --- payout window (JST): before/after the 25th --- */
  const jst = (s) => Date.parse(`${s}+09:00`);
  let w = payoutWindow(jst("2026-10-24T12:00:00"), 25);
  assert.equal(w.next, jst("2026-10-25T00:00:00")); assert.equal(w.nextIsThisMonth, true);
  w = payoutWindow(jst("2026-10-26T00:30:00"), 25);
  assert.equal(w.next, jst("2026-11-25T00:00:00")); assert.equal(w.previous, jst("2026-10-25T00:00:00")); assert.equal(w.nextIsThisMonth, false);
  w = payoutWindow(jst("2026-02-10T00:00:00"), 31);
  assert.equal(w.next, jst("2026-02-28T00:00:00"), "an anchor past month end falls on the last day");
  // Settled before the 25th -> this payout; settling after it -> next month.
  const now = jst("2026-10-20T12:00:00");
  sqlite.exec("DELETE FROM referral_payouts");
  const ins = sqlite.prepare("INSERT INTO referral_payouts(kind,source_key,invoice_id,charge_id,partner_account_id,paid_yen,amount_yen,transferred_yen,available_at,status,transfer_id,created_at,updated_at,sent_at) VALUES ('commission',?,?,?,?,?,?,?,?,'sent','tr_x',?,?,?)");
  ins.run("invoice:a", "a", "ch_a", partner.account.id, 2892, 1156, 1156, jst("2026-10-22T00:00:00"), now, now, now);
  ins.run("invoice:b", "b", "ch_b", partner.account.id, 2892, 1156, 1156, jst("2026-10-27T00:00:00"), now, now, now);
  const totals = await partnerLedgerTotals(env, partner.account.id, { now, anchor: 25 });
  assert.equal(totals.next, 1156, "available before the 25th -> paid on this 25th");
  assert.equal(totals.later, 1156, "not settled by the 25th -> next month");

  console.log("PASS: net-basis commission, signed-webhook only, idempotent event/invoice, source_transaction on every transfer, held->released (account.updated, hourly), unresolved charge/fee held, proportional/full refund reversal, held-row refund, legacy+account referral paid once, failed reversal offset, onboarding auth/CSRF/JP/transfers/monthly 25th, schedule correction, ledger totals and payout window. No real Stripe calls.");
} finally {
  globalThis.fetch = originalFetch;
  sqlite.close();
}
