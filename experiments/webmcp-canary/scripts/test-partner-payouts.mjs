/**
 * Partner commission payouts (worker/partner-payouts.mjs) against real SQL
 * (schema + migrations 0029, 0030, 0039) and a stubbed Stripe. No real Stripe
 * call is possible: fetch is replaced and anything unexpected fails the test.
 *
 * Covers: net-basis commission; signed webhook only; same event twice -> one
 * transfer; source_transaction on every transfer; held -> released; refunds
 * (partial, full, while unresolved, before the row exists, while the transfer
 * answer was lost); lost disputes; a transient charge read failure; the legacy
 * onboard route retired and legacy accounts held to the same checks; a lost
 * transfer answer plus an amount change -> still one transfer; idempotency
 * backoff, key revision and dead rows; offsets recovered once; multiple
 * charges held; self-referral; the hourly job not starved; GET is read-only.
 */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { handleApi } from "../worker/api.mjs";
import { runPartnerPayouts, payoutWindow, partnerLedgerTotals, keptYen, reconcileCommission } from "../worker/partner-payouts.mjs";

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
  accounts: new Map(), idem: new Map(), transfers: [], reversals: [], charges: new Map(), invoices: new Map(), invoicePayments: new Map(),
  disputes: new Map(), calls: [], failReversals: false, accountSeq: 0, loseTransferAnswer: 0, transferError: null, failChargeReads: new Set(),
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
  const fail = (status, code) => Response.json({ error: { code } }, { status });
  // Stripe replays the first answer for a key, errors included.
  const replay = (k, make) => { if (k && stripe.idem.has(k)) return stripe.idem.get(k)(); const r = make(); if (k) stripe.idem.set(k, r); return r(); };
  let m;
  if (method === "POST" && url.pathname === "/v1/accounts") {
    return replay(key, () => {
      const id = `acct_test_${++stripe.accountSeq}`;
      const account = { id, country: form.country, type: "none", controller: { stripe_dashboard: { type: form["controller[stripe_dashboard][type]"] }, losses: { payments: form["controller[losses][payments]"] } }, capabilities: { transfers: "inactive" }, details_submitted: false,
        requirements: { currently_due: ["external_account", "representative.first_name_kanji"], past_due: [], disabled_reason: "requirements.past_due" },
        settings: { payouts: { schedule: { interval: form["settings[payouts][schedule][interval]"], monthly_anchor: Number(form["settings[payouts][schedule][monthly_anchor]"]) } } },
        _form: form };
      stripe.accounts.set(id, account);
      return () => ok(account);
    });
  }
  if ((m = url.pathname.match(/^\/v1\/accounts\/([^/]+)$/))) {
    const account = stripe.accounts.get(m[1]);
    if (!account) return fail(404, "resource_missing");
    if (method === "POST") account.settings.payouts.schedule = { interval: form["settings[payouts][schedule][interval]"], monthly_anchor: Number(form["settings[payouts][schedule][monthly_anchor]"]) };
    return ok(account);
  }
  if (method === "POST" && (m = url.pathname.match(/^\/v1\/accounts\/([^/]+)\/login_links$/))) {
    // Login links exist only for accounts that use the Express Dashboard.
    if (stripe.accounts.get(m[1])?.controller?.stripe_dashboard?.type !== "express") return fail(400, "invalid_request_error");
    return ok({ url: `https://connect.stripe.com/express/${m[1]}` });
  }
  if (method === "POST" && url.pathname === "/v1/account_links") {
    assert.equal(form.type, "account_onboarding");
    assert.equal(form.return_url, "https://nurevo.jp/dashboard?payout=return#partner");
    assert.equal(form.refresh_url, "https://nurevo.jp/dashboard?payout=refresh#partner");
    return ok({ url: `https://connect.stripe.com/setup/e/${form.account}` });
  }
  if (method === "GET" && (m = url.pathname.match(/^\/v1\/charges\/([^/]+)$/))) {
    if (stripe.failChargeReads.has(m[1])) return fail(500, "api_error");
    const charge = stripe.charges.get(m[1]);
    return charge ? ok(charge) : fail(404, "resource_missing");
  }
  if (method === "GET" && url.pathname === "/v1/disputes") return ok({ data: stripe.disputes.get(url.searchParams.get("charge")) || [] });
  if (method === "GET" && url.pathname === "/v1/invoice_payments") {
    const ids = stripe.invoicePayments.get(url.searchParams.get("invoice")) || [];
    return ok({ data: ids.map((charge) => ({ status: "paid", payment: { type: "charge", charge } })) });
  }
  if (method === "GET" && (m = url.pathname.match(/^\/v1\/invoices\/([^/]+)$/))) {
    const invoice = stripe.invoices.get(m[1]);
    return invoice ? ok(invoice) : fail(404, "resource_missing");
  }
  if (url.pathname === "/v1/transfers" && method === "POST") {
    // The hard rule: Nurevo never advances money from its own balance.
    assert.ok(form.source_transaction, "every transfer carries source_transaction");
    assert.ok(stripe.charges.has(form.source_transaction), "source_transaction is the customer's charge");
    assert.equal(form.transfer_group, undefined, "no custom transfer_group with source_transaction");
    assert.equal(form.currency, "jpy");
    assert.match(key, /^nurevo-referral-ledger-\d+-k\d+$/, "a stable per-row Idempotency-Key");
    if (stripe.transferError) {
      const e = stripe.transferError;
      // Rate limiting is rejected before execution: Stripe does not cache it.
      if (e.status === 429) return fail(429, "rate_limit");
      return replay(key, () => () => fail(e.status, e.code));
    }
    const response = replay(key, () => {
      const transfer = { id: `tr_${stripe.transfers.length + 1}`, amount: Number(form.amount), destination: form.destination, source_transaction: form.source_transaction, created: Math.floor(Date.now() / 1000), metadata: { ledger_id: form["metadata[ledger_id]"] } };
      stripe.transfers.push(transfer);
      return () => ok(transfer);
    });
    if (stripe.loseTransferAnswer > 0) { stripe.loseTransferAnswer--; throw new TypeError("network lost"); }
    return response;
  }
  if (url.pathname === "/v1/transfers" && method === "GET") {
    assert.ok(url.searchParams.get("destination"), "earlier transfers are found by destination");
    assert.ok(url.searchParams.get("created[gte]"));
    return ok({ data: stripe.transfers.filter((t) => t.destination === url.searchParams.get("destination")), has_more: false });
  }
  if ((m = url.pathname.match(/^\/v1\/transfers\/([^/]+)\/reversals$/))) {
    if (method === "GET") return ok({ data: stripe.reversals.filter((r) => r.transfer === m[1]) });
    if (stripe.failReversals) return replay(key, () => () => fail(400, "balance_insufficient"));
    return replay(key, () => { const r = { id: `trr_${stripe.reversals.length + 1}`, transfer: m[1], amount: Number(form.amount), metadata: { ledger_id: form["metadata[ledger_id]"] } }; stripe.reversals.push(r); return () => ok(r); });
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
  sqlite.prepare("INSERT INTO members(id,org_id,email,status,role) VALUES (?,?,?,'active','admin')").run(id, `org_${id}`, email);
  sqlite.prepare("INSERT INTO accounts(member_id,email,created_at) VALUES (?,?,?)").run(id, email, Date.now());
  const token = `session-${id}`;
  sqlite.prepare("INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES (?,?,?,'session',?)").run(await sha256Hex(token), id, `org_${id}`, Date.now() + 3600_000);
  return { cookie: `nrv_session=${token}`, account: sqlite.prepare("SELECT * FROM accounts WHERE member_id=?").get(id) };
}
const CSRF = "c".repeat(64);
async function call(path, { cookie = "", csrf = true, method, body = {} } = {}) {
  const headers = { "content-type": "application/json", "cf-connecting-ip": "203.0.113.9" };
  if (cookie) headers.cookie = cookie + (csrf ? `; nrv_csrf=${CSRF}` : "");
  if (cookie && csrf) headers["x-csrf-token"] = CSRF;
  const m = method || "GET";
  const response = await handleApi(new Request(`https://nurevo.jp${path}`, { method: m, headers, ...(m === "POST" ? { body: JSON.stringify(body) } : {}) }), env, {});
  return { status: response.status, body: await response.json() };
}
function refer(child, partner) { sqlite.prepare("UPDATE accounts SET referred_by_account_id=? WHERE id=?").run(partner.account.id, child.account.id); }
function site(id, owner, sub, extra = {}) {
  sqlite.prepare("INSERT INTO sites(id,org_id,url,site_key,owner_member_id,plan,contract,stripe_subscription_id,channel,referred_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
    .run(id, `org_${owner}`, `${id}.example.test`, id, owner, extra.plan || "standard", "active", sub, extra.channel || "direct", extra.referred_by || null, Date.now());
}
function charge(id, { amount = 3000, fee = 108, currency = "jpy", net, availableOn = Math.floor(Date.now() / 1000) + 4 * 86400, refunded = 0 } = {}) {
  const c = { id, object: "charge", amount, amount_refunded: refunded, currency, disputed: false, balance_transaction: { id: `txn_${id}`, currency: "jpy", amount, fee, net: net ?? amount - fee, available_on: availableOn } };
  stripe.charges.set(id, c);
  return c;
}
const invoice = (id, chargeId, sub, extra = {}) => ({ id, object: "invoice", status: "paid", currency: "jpy", amount_paid: 3000, ...(chargeId ? { charge: chargeId } : {}), subscription: sub, ...extra });
const rows = () => sqlite.prepare("SELECT * FROM referral_payouts ORDER BY id").all();
const row = (invoiceId) => rows().find((x) => x.kind === "commission" && x.invoice_id === invoiceId);
const transfersFor = (chargeId) => stripe.transfers.filter((t) => t.source_transaction === chargeId);
const reversalsFor = (chargeId) => stripe.reversals.filter((r) => transfersFor(chargeId).some((t) => t.id === r.transfer));
const C = (net) => Math.floor(net * 0.4);
const quiet = async (fn) => { const e = console.error; console.error = () => {}; try { return await fn(); } finally { console.error = e; } };
const HOUR = 3600_000;

try {
  const partner = await member("partner", "partner@example.test");
  const customer = await member("customer", "customer@example.test");
  refer(customer, partner);
  site("site_a", "customer", "sub_a");

  /* --- commission math --- */
  assert.equal(keptYen(1156, { amount: 3000, refunded: 1500, disputeLost: false }), 578);
  assert.equal(keptYen(1156, { amount: 3000, refunded: 3000, disputeLost: false }), 0);
  assert.equal(keptYen(1156, { amount: 3000, refunded: 0, disputeLost: true }), 0);

  /* --- onboarding route: auth and CSRF --- */
  assert.equal((await call("/api/partner/payout/onboard", { method: "POST" })).status, 403, "no CSRF token, no session");
  assert.equal((await call("/api/partner/payout/onboard", { method: "POST", cookie: "nrv_session=nope" })).status, 401, "unknown session");
  assert.equal((await call("/api/partner/payout/onboard", { method: "POST", cookie: partner.cookie, csrf: false })).status, 403, "CSRF required");
  assert.equal(stripe.calls.length, 0, "nothing reached Stripe");

  /* --- commission while the partner has not onboarded: held, with real amounts --- */
  charge("ch_1");
  let r = await webhook("invoice.paid", invoice("in_1", "ch_1", "sub_a"));
  assert.equal(r.status, 200);
  assert.equal(row("in_1").status, "held");
  assert.equal(row("in_1").paid_yen, 2892, "basis: balance_transaction.net (3,000 - 108)");
  assert.equal(row("in_1").amount_yen, 1156, "floor(40% x 2,892)");
  assert.ok(row("in_1").available_at > Date.now(), "the charge's available_on is stored");
  assert.equal(stripe.transfers.length, 0);

  /* --- onboarding: one Express account, JP, transfers, monthly on the 25th --- */
  r = await call("/api/partner/payout/onboard", { method: "POST", cookie: partner.cookie });
  assert.equal(r.status, 200);
  assert.equal(r.body.kind, "onboarding");
  const created = stripe.calls.filter((c) => c.method === "POST" && c.path === "/v1/accounts");
  assert.equal(created.length, 1);
  assert.equal(created[0].form.type, undefined, "no deprecated account type");
  assert.equal(created[0].form["controller[stripe_dashboard][type]"], "express");
  assert.equal(created[0].form["controller[fees][payer]"], "application");
  assert.equal(created[0].form["controller[losses][payments]"], "application");
  assert.equal(created[0].form["controller[requirement_collection]"], "stripe");
  assert.equal(created[0].form.country, "JP", "partners are Japan-based");
  assert.equal(created[0].form["capabilities[transfers][requested]"], "true");
  assert.equal(created[0].form["settings[payouts][schedule][interval]"], "monthly");
  assert.equal(created[0].form["settings[payouts][schedule][monthly_anchor]"], "25");
  assert.match(created[0].key, new RegExp(`^nurevo-partner-account-${partner.account.id}-\\d{8}$`), "a daily key, so a cached failure does not block the next day");
  assert.equal(Object.keys(created[0].form).some((k) => /bank|external_account|routing|account_number/.test(k)), false, "Nurevo never sends or stores bank details");
  const acctId = sqlite.prepare("SELECT stripe_account_id FROM accounts WHERE id=?").get(partner.account.id).stripe_account_id;
  await call("/api/partner/payout/onboard", { method: "POST", cookie: partner.cookie });
  assert.equal(stripe.calls.filter((c) => c.method === "POST" && c.path === "/v1/accounts").length, 1, "the account is created once");

  /* --- GET /api/partner is read-only --- */
  let before = stripe.calls.length;
  let summary = (await call("/api/partner", { cookie: partner.cookie })).body;
  assert.equal(stripe.calls.slice(before).filter((c) => c.method === "POST").length, 0, "GET never moves money or changes Stripe settings");
  assert.equal(summary.payout.account.status, "in_progress");
  assert.equal(summary.payout.held_yen, 1156);
  assert.equal(summary.payout.cumulative_paid_yen, 0);

  /* --- hourly job while not ready: still held --- */
  await runPartnerPayouts(env, { now: Date.now() + 6 * 60_000 });
  assert.equal(stripe.transfers.length, 0);

  /* --- account.updated (Connect endpoint) makes it ready -> released --- */
  const acct = stripe.accounts.get(acctId);
  acct.capabilities.transfers = "active"; acct.details_submitted = true; acct.requirements = { currently_due: [], past_due: [] };
  r = await webhook("account.updated", acct, { secret: CONNECT_SECRET, account: acctId });
  assert.equal(r.status, 200);
  assert.equal(transfersFor("ch_1").length, 1, "held commission paid once the account can receive transfers");
  assert.equal(transfersFor("ch_1")[0].amount, 1156);
  assert.equal(transfersFor("ch_1")[0].destination, acctId);
  assert.equal(stripe.calls.find((c) => c.method === "POST" && c.path === "/v1/transfers").key, `nurevo-referral-ledger-${row("in_1").id}-k0`);
  await runPartnerPayouts(env, { now: Date.now() + HOUR });
  assert.equal(transfersFor("ch_1").length, 1, "released once, never again");

  /* --- a Connect event cannot create commission; unsigned is refused --- */
  r = await webhook("invoice.paid", invoice("in_conn", "ch_1", "sub_a"), { secret: CONNECT_SECRET, account: acctId });
  assert.equal(row("in_conn"), undefined);
  assert.equal((await webhook("invoice.paid", invoice("in_forged", "ch_1", "sub_a"), { secret: "whsec_wrong" })).status, 400);

  /* --- the same event twice, and a re-sent invoice.paid -> one transfer --- */
  charge("ch_2", { amount: 14800, fee: 533 });
  const event2 = `evt_same_${Date.now()}`;
  await webhook("invoice.paid", invoice("in_2", "ch_2", "sub_a", { amount_paid: 14800 }), { id: event2 });
  assert.equal((await webhook("invoice.paid", invoice("in_2", "ch_2", "sub_a", { amount_paid: 14800 }), { id: event2 })).body.duplicate, true);
  await webhook("invoice.paid", invoice("in_2", "ch_2", "sub_a", { amount_paid: 14800 }));
  assert.equal(transfersFor("ch_2").length, 1);
  assert.equal(transfersFor("ch_2")[0].amount, C(14800 - 533), "Pro: 40% of the net");

  /* --- zero invoice (coupon): nothing --- */
  await webhook("invoice.paid", invoice("in_zero", null, "sub_a", { amount_paid: 0 }));
  assert.equal(row("in_zero"), undefined);

  /* --- partial refund -> proportional reversal; full refund -> the rest --- */
  const c2 = stripe.charges.get("ch_2");
  const commission2 = C(14800 - 533);
  c2.amount_refunded = 7400;
  await webhook("charge.refunded", c2);
  assert.equal(reversalsFor("ch_2").length, 1);
  assert.equal(reversalsFor("ch_2")[0].amount, commission2 - Math.floor(commission2 * 7400 / 14800), "half refunded -> reversed in proportion");
  await webhook("charge.refunded", c2);
  assert.equal(reversalsFor("ch_2").length, 1, "the same refund state is reversed once");
  c2.amount_refunded = 14800;
  await webhook("charge.refunded", c2);
  assert.equal(reversalsFor("ch_2").reduce((n, x) => n + x.amount, 0), commission2, "fully refunded -> fully reversed");

  /* --- H1: the charge is known but its read fails, then recovers --- */
  charge("ch_h1");
  stripe.failChargeReads.add("ch_h1");
  await webhook("invoice.paid", invoice("in_h1", "ch_h1", "sub_a"));
  assert.equal(row("in_h1").status, "held");
  assert.equal(row("in_h1").charge_id, "ch_h1");
  assert.equal(row("in_h1").paid_yen, null);
  assert.equal(transfersFor("ch_h1").length, 0);
  stripe.failChargeReads.delete("ch_h1");
  await runPartnerPayouts(env, { now: Date.now() + 2 * HOUR });
  assert.equal(transfersFor("ch_h1").length, 1, "a transient read failure is retried, not stuck");
  assert.equal(transfersFor("ch_h1")[0].amount, 1156);

  /* --- H2a: refund while the row is unresolved (fee not known yet) --- */
  const cA = charge("ch_h2a");
  const btA = cA.balance_transaction;
  cA.balance_transaction = "txn_pending";
  await webhook("invoice.paid", invoice("in_h2a", "ch_h2a", "sub_a"));
  assert.equal(row("in_h2a").status, "held");
  cA.amount_refunded = 1500;
  await webhook("charge.refunded", cA);
  cA.balance_transaction = btA;
  await runPartnerPayouts(env, { now: Date.now() + 3 * HOUR });
  assert.equal(transfersFor("ch_h2a").length, 1);
  assert.equal(transfersFor("ch_h2a")[0].amount, keptYen(1156, { amount: 3000, refunded: 1500 }), "pays only what is kept after the refund");

  /* --- H2b: refund before the commission row exists --- */
  const cB = charge("ch_h2b");
  cB.amount_refunded = 1000;
  r = await webhook("charge.refunded", cB);
  assert.equal(r.status, 200);
  await webhook("invoice.paid", invoice("in_h2b", "ch_h2b", "sub_a"));
  assert.equal(transfersFor("ch_h2b").length, 1);
  assert.equal(transfersFor("ch_h2b")[0].amount, keptYen(1156, { amount: 3000, refunded: 1000 }), "the earlier refund is reflected from the charge's state");

  /* --- H2c + H4: the transfer answer is lost, then a refund changes the amount --- */
  charge("ch_h2c");
  stripe.loseTransferAnswer = 1;
  await quiet(() => webhook("invoice.paid", invoice("in_h2c", "ch_h2c", "sub_a")));
  assert.equal(row("in_h2c").status, "failed", "no answer -> failed, retried");
  assert.equal(transfersFor("ch_h2c").length, 1, "but Stripe did create it");
  stripe.charges.get("ch_h2c").amount_refunded = 3000;
  await webhook("charge.refunded", stripe.charges.get("ch_h2c"));
  await runPartnerPayouts(env, { now: Date.now() + 4 * HOUR });
  assert.equal(transfersFor("ch_h2c").length, 1, "the retry finds the transfer by metadata: never a second one");
  assert.equal(row("in_h2c").status, "sent");
  assert.equal(row("in_h2c").transfer_id, transfersFor("ch_h2c")[0].id);
  assert.equal(reversalsFor("ch_h2c").reduce((n, x) => n + x.amount, 0), 1156, "the refund is pulled back from the found transfer");

  /* --- M1: an HTTP error is cached by Stripe for the key: back off, then a new key revision --- */
  charge("ch_m1");
  stripe.transferError = { status: 400, code: "transfers_not_allowed" };
  await quiet(() => webhook("invoice.paid", invoice("in_m1", "ch_m1", "sub_a")));
  assert.equal(row("in_m1").status, "failed");
  let attempts = stripe.calls.filter((c) => c.path === "/v1/transfers" && c.method === "POST" && c.form.source_transaction === "ch_m1").length;
  await runPartnerPayouts(env, { now: Date.now() + 2 * HOUR });
  assert.equal(stripe.calls.filter((c) => c.path === "/v1/transfers" && c.method === "POST" && c.form.source_transaction === "ch_m1").length, attempts, "no retry inside Stripe's 24 h window");
  stripe.transferError = null;
  await runPartnerPayouts(env, { now: Date.now() + 26 * HOUR });
  assert.equal(transfersFor("ch_m1").length, 1);
  assert.equal(stripe.calls.filter((c) => c.path === "/v1/transfers" && c.method === "POST" && c.form.source_transaction === "ch_m1").at(-1).key, `nurevo-referral-ledger-${row("in_m1").id}-k1`, "a new key only after confirming no transfer exists");

  /* --- M1: retries exhausted -> dead, logged and counted --- */
  charge("ch_dead");
  stripe.transferError = { status: 400, code: "transfers_not_allowed" };
  await quiet(async () => {
    await webhook("invoice.paid", invoice("in_dead", "ch_dead", "sub_a"));
    for (let n = 1; n <= 6; n++) await runPartnerPayouts(env, { now: Date.now() + n * 26 * HOUR });
  });
  stripe.transferError = null;
  assert.equal(row("in_dead").status, "dead");
  assert.equal(transfersFor("ch_dead").length, 0);
  summary = (await call("/api/partner", { cookie: partner.cookie })).body;
  assert.equal(summary.payout.needs_attention, 1, "a dead row is surfaced, not silently dropped");

  /* --- lost dispute -> reversed like a full refund --- */
  const cD = charge("ch_disp");
  await webhook("invoice.paid", invoice("in_disp", "ch_disp", "sub_a"));
  assert.equal(transfersFor("ch_disp").length, 1);
  cD.disputed = true;
  stripe.disputes.set("ch_disp", [{ id: "dp_1", status: "lost", charge: "ch_disp" }]);
  await webhook("charge.dispute.closed", { id: "dp_1", object: "dispute", charge: "ch_disp", status: "lost" });
  assert.equal(reversalsFor("ch_disp").reduce((n, x) => n + x.amount, 0), 1156);
  // An open dispute holds an unpaid commission.
  const cO = charge("ch_open"); cO.disputed = true; stripe.disputes.set("ch_open", [{ id: "dp_2", status: "needs_response" }]);
  await webhook("invoice.paid", invoice("in_open", "ch_open", "sub_a"));
  assert.equal(row("in_open").status, "held");
  assert.equal(row("in_open").last_error, "dispute_open");

  /* --- M4: an invoice paid by several charges is held, not underpaid --- */
  charge("ch_multi_1"); charge("ch_multi_2");
  stripe.invoicePayments.set("in_multi", ["ch_multi_1", "ch_multi_2"]);
  await quiet(() => webhook("invoice.paid", invoice("in_multi", null, "sub_a")));
  assert.equal(row("in_multi").status, "held");
  assert.equal(row("in_multi").last_error, "multiple_charges");
  assert.equal(transfersFor("ch_multi_1").length + transfersFor("ch_multi_2").length, 0);
  summary = (await call("/api/partner", { cookie: partner.cookie })).body;
  assert.equal(summary.payout.needs_attention, 2, "an invoice paid by several charges also needs a person");

  /* --- H3: the legacy onboarding route is retired for everyone --- */
  sqlite.prepare("INSERT INTO referrers(id,name,email,stripe_account_id,created_at) VALUES ('ref_legacy','Legacy','legacy@example.test','acct_legacy',?)").run(Date.now());
  const attacker = await member("attacker", "attacker@example.test");
  r = await call("/api/billing/connect/onboard", { method: "POST", cookie: attacker.cookie, body: { referrer_id: "ref_legacy" } });
  assert.equal(r.status, 410, "another user cannot attach an account to someone's referrer");
  assert.equal(sqlite.prepare("SELECT stripe_account_id FROM referrers WHERE id='ref_legacy'").get().stripe_account_id, "acct_legacy");

  /* --- legacy + account referral on the same site -> paid once, to the account referral --- */
  site("site_both", "customer", "sub_both", { channel: "referral", referred_by: "ref_legacy" });
  charge("ch_3");
  await webhook("invoice.paid", invoice("in_3", "ch_3", "sub_both", { metadata: { siteId: "site_both" } }));
  await webhook("invoice.paid", invoice("in_3", "ch_3", "sub_both", { metadata: { siteId: "site_both" } }));
  assert.equal(transfersFor("ch_3").length, 1);
  assert.equal(transfersFor("ch_3")[0].destination, acctId);

  /* --- legacy-only: held until the stored account is ready and in Japan --- */
  await member("legacy_owner", "legacy-owner@example.test");
  site("site_legacy", "legacy_owner", "sub_legacy", { channel: "referral", referred_by: "ref_legacy" });
  stripe.accounts.set("acct_legacy", { id: "acct_legacy", country: "US", capabilities: { transfers: "active" }, requirements: {}, settings: { payouts: { schedule: { interval: "monthly", monthly_anchor: 25 } } } });
  charge("ch_4");
  await webhook("invoice.paid", invoice("in_4", "ch_4", "sub_legacy"));
  assert.equal(transfersFor("ch_4").length, 0, "a legacy account outside Japan is not paid");
  assert.equal(row("in_4").legacy_referrer_id, "ref_legacy");
  stripe.accounts.get("acct_legacy").country = "JP";
  await runPartnerPayouts(env, { now: Date.now() + 200 * HOUR });
  assert.equal(transfersFor("ch_4").length, 1);
  assert.equal(transfersFor("ch_4")[0].destination, "acct_legacy");

  /* --- self-referral: a legacy referrer with the owner's own email earns nothing --- */
  sqlite.prepare("INSERT INTO referrers(id,name,email,stripe_account_id,created_at) VALUES ('ref_self','Self','self@example.test','acct_legacy',?)").run(Date.now());
  await member("self", "self@example.test");
  site("site_self", "self", "sub_self", { channel: "referral", referred_by: "ref_self" });
  charge("ch_self");
  await webhook("invoice.paid", invoice("in_self", "ch_self", "sub_self"));
  assert.equal(row("in_self"), undefined);

  /* --- M3: an unrecovered reversal is withheld from the next transfer, exactly once --- */
  charge("ch_8");
  await webhook("invoice.paid", invoice("in_8", "ch_8", "sub_a"));
  assert.equal(row("in_8").status, "sent");
  stripe.failReversals = true;
  stripe.charges.get("ch_8").amount_refunded = 3000;
  await quiet(() => webhook("charge.refunded", stripe.charges.get("ch_8")));
  const debt = rows().find((x) => x.kind === "reversal" && x.parent_id === row("in_8").id);
  assert.equal(debt.status, "failed");
  stripe.failReversals = false;
  // The next payer's answer is lost: the retry that finds it applies the offset once.
  charge("ch_9", { amount: 14800, fee: 533 });
  stripe.loseTransferAnswer = 1;
  await quiet(() => webhook("invoice.paid", invoice("in_9", "ch_9", "sub_a", { amount_paid: 14800 })));
  await runPartnerPayouts(env, { now: Date.now() + 210 * HOUR });
  assert.equal(transfersFor("ch_9").length, 1);
  assert.equal(transfersFor("ch_9")[0].amount, C(14800 - 533) - 1156, "the debt is withheld from the next transfer");
  const offsets = rows().filter((x) => x.kind === "offset" && x.parent_id === row("in_8").id);
  assert.equal(offsets.length, 1);
  assert.equal(offsets[0].status, "applied");
  charge("ch_10");
  await webhook("invoice.paid", invoice("in_10", "ch_10", "sub_a"));
  assert.equal(transfersFor("ch_10")[0].amount, 1156, "a recovered debt is not withheld again");

  /* --- a row whose transfer withheld a debt is refunded: owed beyond its transfer becomes a debt --- */
  {
    const w = await member("withhold_partner", "withhold@example.test");
    const wc = await member("withhold_customer", "withhold-customer@example.test");
    refer(wc, w);
    site("site_w", "withhold_customer", "sub_w");
    sqlite.prepare("UPDATE accounts SET stripe_account_id='acct_w', payout_status='ready', payout_checked_at=? WHERE id=?").run(Date.now(), w.account.id);
    stripe.accounts.set("acct_w", { id: "acct_w", country: "JP", capabilities: { transfers: "active" }, requirements: {}, settings: { payouts: { schedule: { interval: "monthly", monthly_anchor: 25 } } } });
    charge("ch_w1");
    await webhook("invoice.paid", invoice("in_w1", "ch_w1", "sub_w"));
    stripe.failReversals = true;
    stripe.charges.get("ch_w1").amount_refunded = 3000;
    await quiet(() => webhook("charge.refunded", stripe.charges.get("ch_w1")));
    stripe.failReversals = false;
    charge("ch_w2");
    await webhook("invoice.paid", invoice("in_w2", "ch_w2", "sub_w"));
    assert.equal(row("in_w2").withheld_yen, 1156);
    assert.equal(transfersFor("ch_w2").length, 0, "fully withheld: nothing to transfer");
    stripe.charges.get("ch_w2").amount_refunded = 3000;
    await webhook("charge.refunded", stripe.charges.get("ch_w2"));
    charge("ch_w3", { amount: 14800, fee: 533 });
    await webhook("invoice.paid", invoice("in_w3", "ch_w3", "sub_w", { amount_paid: 14800 }));
    assert.equal(transfersFor("ch_w3")[0].amount, C(14800 - 533) - 1156, "the refunded withholding row's credit is recovered from the next transfer");
    const wTotals = (await call("/api/partner", { cookie: w.cookie })).body.payout;
    assert.equal(wTotals.cumulative_paid_yen, wTotals.cumulative_earned_yen, "paid equals earned once every debt is recovered");
  }

  /* --- N2: a 429 is retried soon (no 24 h wait, same key) --- */
  charge("ch_429");
  stripe.transferError = { status: 429, code: "rate_limit" };
  await quiet(() => webhook("invoice.paid", invoice("in_429", "ch_429", "sub_a")));
  stripe.transferError = null;
  assert.equal(row("in_429").status, "failed");
  assert.equal(row("in_429").http_failed, 0);
  await runPartnerPayouts(env, { now: Date.now() + 220 * HOUR });
  assert.equal(transfersFor("ch_429").length, 1, "retried on the next run");
  assert.equal(row("in_429").key_rev, 0, "same key: nothing was cached");

  /* --- N1: concurrent reconciles never pull back more than is owed --- */
  {
    const rp = await member("race_partner", "race@example.test");
    const rc = await member("race_customer", "race-customer@example.test");
    refer(rc, rp);
    site("site_race", "race_customer", "sub_race");
    sqlite.prepare("UPDATE accounts SET stripe_account_id='acct_race', payout_status='ready', payout_checked_at=? WHERE id=?").run(Date.now(), rp.account.id);
    stripe.accounts.set("acct_race", { id: "acct_race", country: "JP", capabilities: { transfers: "active" }, requirements: {}, settings: { payouts: { schedule: { interval: "monthly", monthly_anchor: 25 } } } });
    charge("ch_race");
    await webhook("invoice.paid", invoice("in_race", "ch_race", "sub_race"));
    const sentRow = row("in_race");
    assert.equal(sentRow.transferred_yen, 1156);
    // Two reconciles that read the charge at two refund levels run at once.
    sqlite.prepare("UPDATE referral_payouts SET kept_yen=0 WHERE id=?").run(sentRow.id);
    await Promise.all([
      reconcileCommission(env, { ...sentRow, kept_yen: 578 }, { sync: false }),
      reconcileCommission(env, { ...sentRow, kept_yen: 0 }, { sync: false }),
    ]);
    assert.ok(reversalsFor("ch_race").reduce((n, x) => n + x.amount, 0) <= 1156, "never over-reversed");
    await reconcileCommission(env, row("in_race"), { sync: false });
    assert.equal(reversalsFor("ch_race").reduce((n, x) => n + x.amount, 0), 1156, "and fully reversed once settled");
  }

  /* --- N3: a row that goes dead gives back the debts it had reserved --- */
  {
    charge("ch_n3a");
    await webhook("invoice.paid", invoice("in_n3a", "ch_n3a", "sub_a"));
    stripe.failReversals = true;
    stripe.charges.get("ch_n3a").amount_refunded = 3000;
    await quiet(() => webhook("charge.refunded", stripe.charges.get("ch_n3a")));
    stripe.failReversals = false;
    charge("ch_n3b", { amount: 14800, fee: 533 });
    stripe.transferError = { status: 400, code: "transfers_not_allowed" };
    await quiet(async () => {
      await webhook("invoice.paid", invoice("in_n3b", "ch_n3b", "sub_a", { amount_paid: 14800 }));
      for (let n = 1; n <= 6; n++) await runPartnerPayouts(env, { now: Date.now() + (230 + n * 26) * HOUR });
    });
    stripe.transferError = null;
    assert.equal(row("in_n3b").status, "dead");
    assert.equal(rows().filter((x) => x.kind === "offset" && x.payer_id === row("in_n3b").id && x.status === "pending").length, 0);
    charge("ch_n3c", { amount: 14800, fee: 533 });
    await webhook("invoice.paid", invoice("in_n3c", "ch_n3c", "sub_a", { amount_paid: 14800 }));
    assert.equal(transfersFor("ch_n3c")[0].amount, C(14800 - 533) - 1156, "the debt is still recovered by the next live transfer");
  }

  /* --- M2: permanently held rows do not starve the hourly job --- */
  const stuck = await member("stuck_partner", "stuck@example.test");
  sqlite.prepare("UPDATE accounts SET stripe_account_id='acct_stuck', payout_status='in_progress', payout_checked_at=? WHERE id=?").run(Date.now() + 300 * HOUR, stuck.account.id);
  const ins = sqlite.prepare("INSERT INTO referral_payouts(kind,source_key,invoice_id,charge_id,partner_account_id,amount_yen,status,created_at,updated_at) VALUES ('commission',?,?,?,?,100,'held',?,?)");
  for (let n = 0; n < 40; n++) ins.run(`invoice:stuck_${n}`, `stuck_${n}`, "ch_1", stuck.account.id, 1, 1);
  charge("ch_late");
  sqlite.prepare("INSERT INTO referral_payouts(kind,source_key,invoice_id,charge_id,partner_account_id,status,created_at,updated_at) VALUES ('commission','invoice:in_late','in_late','ch_late',?,'held',?,?)").run(partner.account.id, Date.now(), Date.now());
  await runPartnerPayouts(env, { now: Date.now() + 301 * HOUR });
  assert.equal(transfersFor("ch_late").length, 1, "a payable row behind 40 held rows is still paid");

  /* --- POST refresh after returning from Stripe: schedule corrected, read-only GET --- */
  acct.settings.payouts.schedule = { interval: "daily" };
  assert.equal((await call("/api/partner/payout/refresh", { method: "POST", cookie: partner.cookie, csrf: false })).status, 403);
  r = await call("/api/partner/payout/refresh", { method: "POST", cookie: partner.cookie });
  assert.equal(r.status, 200);
  assert.equal(r.body.payout_account.status, "ready");
  assert.deepEqual(acct.settings.payouts.schedule, { interval: "monthly", monthly_anchor: 25 }, "a differing schedule is set back to monthly on the 25th");
  r = await call("/api/partner/payout/onboard", { method: "POST", cookie: partner.cookie });
  assert.equal(r.body.kind, "dashboard");

  /* --- the hard rule over the whole run --- */
  const posted = stripe.calls.filter((c) => c.method === "POST" && c.path === "/v1/transfers");
  assert.ok(posted.length >= 10);
  for (const c of posted) assert.ok(c.form.source_transaction, "no /v1/transfers call is ever made without source_transaction");

  /* --- partner page totals from the ledger --- */
  summary = (await call("/api/partner", { cookie: partner.cookie })).body;
  assert.equal(summary.payout.paid_status, "ledger");
  assert.equal(summary.payout.monthly_estimate_yen, 2400, "two active Standard subscriptions (before Stripe fees)");
  const mine = rows().filter((x) => x.partner_account_id === partner.account.id);
  const pulled = mine.filter((x) => x.kind === "reversal" && x.status === "sent").reduce((n, x) => n + x.amount_yen, 0);
  assert.equal(summary.payout.cumulative_paid_yen, mine.filter((x) => x.kind === "commission").reduce((n, x) => n + x.transferred_yen, 0) - pulled);
  assert.equal(stripe.transfers.filter((t) => t.destination === acctId).reduce((n, t) => n + t.amount, 0) - stripe.reversals.filter((x) => stripe.transfers.find((t) => t.id === x.transfer)?.destination === acctId).reduce((n, x) => n + x.amount, 0),
    summary.payout.cumulative_paid_yen, "the ledger agrees with what Stripe moved");

  /* --- payout window (JST) --- */
  const jst = (s) => Date.parse(`${s}+09:00`);
  let w = payoutWindow(jst("2026-10-24T12:00:00"), 25);
  assert.equal(w.next, jst("2026-10-25T00:00:00")); assert.equal(w.nextIsThisMonth, true);
  w = payoutWindow(jst("2026-10-26T00:30:00"), 25);
  assert.equal(w.next, jst("2026-11-25T00:00:00")); assert.equal(w.previous, jst("2026-10-25T00:00:00")); assert.equal(w.nextIsThisMonth, false);
  assert.equal(payoutWindow(jst("2026-02-10T00:00:00"), 31).next, jst("2026-02-28T00:00:00"), "an anchor past month end falls on the last day");
  const now = jst("2026-10-20T12:00:00");
  const other = await member("window_partner", "window@example.test");
  const ins2 = sqlite.prepare("INSERT INTO referral_payouts(kind,source_key,invoice_id,charge_id,partner_account_id,paid_yen,amount_yen,kept_yen,transferred_yen,available_at,status,transfer_id,created_at,updated_at,sent_at) VALUES ('commission',?,?,?,?,2892,1156,1156,1156,?,'sent','tr_x',?,?,?)");
  ins2.run("invoice:wa", "wa", "ch_wa", other.account.id, jst("2026-10-22T00:00:00"), now, now, now);
  ins2.run("invoice:wb", "wb", "ch_wb", other.account.id, jst("2026-10-27T00:00:00"), now, now, now);
  const totals = await partnerLedgerTotals(env, other.account.id, { now, anchor: 25 });
  assert.equal(totals.next, 1156, "available before the 25th -> paid on this 25th");
  assert.equal(totals.later, 1156, "not settled by the 25th -> next month");

  console.log("PASS: net-basis commission; signed webhook only; idempotent event/invoice; source_transaction on every transfer, no custom transfer_group; held->released; H1 transient charge read; H2 refund while unresolved / before the row / after a lost answer; H3 legacy onboard retired, legacy accounts need ready+JP; H4 lost answer + amount change -> one transfer; M1 24 h backoff, key revision, dead rows surfaced; lost/open disputes; M2 no starvation; M3 offset applied once; M4 multiple charges held; self-referral; GET read-only; schedule fix on POST refresh; ledger totals and payout window. No real Stripe calls.");
} finally {
  globalThis.fetch = originalFetch;
  sqlite.close();
}
