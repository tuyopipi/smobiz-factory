/**
 * Partner commission payouts through Stripe Connect (Express, Japan only).
 *
 * Commission basis (the contract):
 *   commission_yen = floor(0.4 × net_yen), per paid invoice, where
 *   net_yen = the NET JPY Nurevo received for the invoice's charge, i.e. the
 *   charge's balance_transaction.net (= amount − Stripe fees), for JPY and
 *   non-JPY invoices alike. invoice.amount_paid is never the basis. If the
 *   balance transaction (or its fee) is not known yet, the row stays held and
 *   the hourly job retries; nothing is estimated. A zero invoice (coupon)
 *   earns nothing. Refunds reverse it in proportion to the refunded share of
 *   the charge:
 *   kept_yen = floor(commission_yen × (charge.amount − amount_refunded) / charge.amount).
 *
 * Money rules:
 *   - Only a verified Stripe webhook (or the hourly job / the partner's own
 *     summary refresh releasing rows that a webhook created) moves money. No
 *     amount or destination ever comes from a client.
 *   - Nurevo never advances money: every transfer carries
 *     source_transaction = the customer's charge, so the partner's funds become
 *     available only when that charge's funds are available in Nurevo's
 *     balance. A row whose charge cannot be resolved stays held; nothing is
 *     transferred from the platform balance.
 *   - Partners receive a per-invoice transfer into their Stripe balance; the
 *     Express account pays its available balance out to the bank once a month
 *     (PARTNER_PAYOUT_MONTHLY_ANCHOR, default the 25th). Funds not yet
 *     available on that day roll to the next month by themselves.
 *   - referral_payouts has one row per invoice (source_key 'invoice:<id>') no
 *     matter which referral path (account referral or legacy referrers table)
 *     found the partner, so an invoice can never be paid twice. Stripe
 *     Idempotency-Keys and a transfer_group lookup before any retry guard the
 *     API side.
 */

export const REFERRAL_SHARE = 0.4;
export function referralCommissionYen(amountPaid, currency) {
  if (String(currency || "").toLowerCase() !== "jpy") return 0;
  const paid = Math.floor(Number(amountPaid) || 0);
  return paid > 0 ? Math.floor(paid * REFERRAL_SHARE) : 0;
}

export const DEFAULT_PAYOUT_ANCHOR = 25;
export function payoutAnchor(env) {
  const n = Number.parseInt(String(env?.PARTNER_PAYOUT_MONTHLY_ANCHOR ?? ""), 10);
  return Number.isInteger(n) && n >= 1 && n <= 31 ? n : DEFAULT_PAYOUT_ANCHOR;
}

export const DASHBOARD_PARTNER_URL = "https://nurevo.jp/dashboard#partner";
const ONBOARD_RETURN_URL = "https://nurevo.jp/dashboard?payout=return#partner";
const ONBOARD_REFRESH_URL = "https://nurevo.jp/dashboard?payout=refresh#partner";
const STATUS_CACHE_MS = 5 * 60 * 1000;
const STALE_CLAIM_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const INVOICE_PAYMENTS_API_VERSION = "2025-03-31.basil";

export function stripeKey(env) {
  const value = String(env?.STRIPE_SECRET_KEY || "").trim();
  return /^(sk|rk)_(test|live)_/.test(value) ? value : "";
}

export async function stripeGet(secret, path, { version } = {}) {
  const headers = { authorization: `Bearer ${secret}` };
  if (version) headers["stripe-version"] = version;
  try {
    const response = await fetch(`https://api.stripe.com${path}`, { method: "GET", headers });
    let data = {};
    try { data = await response.json(); } catch { data = {}; }
    return { ok: response.ok, status: response.status, data };
  } catch { return { ok: false, status: 0, data: {} }; }
}

export async function stripePost(secret, path, form, { idempotencyKey, version } = {}) {
  const headers = { authorization: `Bearer ${secret}`, "content-type": "application/x-www-form-urlencoded" };
  if (idempotencyKey) headers["idempotency-key"] = idempotencyKey;
  if (version) headers["stripe-version"] = version;
  try {
    const response = await fetch(`https://api.stripe.com${path}`, { method: "POST", headers, body: form });
    let data = {};
    try { data = await response.json(); } catch { data = {}; }
    return { ok: response.ok, status: response.status, data };
  } catch { return { ok: false, status: 0, data: {} }; }
}

const errorText = (result) => String(result?.data?.error?.code || result?.data?.error?.message || `http_${result?.status ?? 0}`).slice(0, 200);

async function invoiceChargeId(secret, invoice, get) {
  if (typeof invoice?.charge === "string") return invoice.charge;
  if (invoice?.charge?.id) return invoice.charge.id;
  if (!invoice?.id) return null;
  const list = await get(secret, `/v1/invoice_payments?invoice=${encodeURIComponent(invoice.id)}&limit=3`, { version: INVOICE_PAYMENTS_API_VERSION });
  const row = (list.data?.data || []).find((item) => item?.status === "paid" && item?.payment?.type === "charge");
  return typeof row?.payment?.charge === "string" ? row.payment.charge : row?.payment?.charge?.id || null;
}

/**
 * The commission basis of a paid invoice: the NET JPY Nurevo received for its
 * charge (balance_transaction.net = amount − Stripe fees), the charge id (the
 * transfer's source_transaction) and when those funds become available.
 * The same for JPY and non-JPY invoices; invoice.amount_paid is never used.
 * amountYen is null while the charge or its balance transaction (with its
 * fee) is not readable yet; the row then stays held and is retried. Never
 * estimated.
 */
export async function referralPaidYen(secret, invoice, { get = stripeGet } = {}) {
  const chargeId = secret ? await invoiceChargeId(secret, invoice, get) : null;
  if (!chargeId) return { amountYen: null, chargeId: null, availableAt: null };
  const charge = await get(secret, `/v1/charges/${encodeURIComponent(chargeId)}?expand[]=balance_transaction`);
  const bt = charge.ok && charge.data?.balance_transaction && typeof charge.data.balance_transaction === "object" ? charge.data.balance_transaction : null;
  const availableAt = Number(bt?.available_on) > 0 ? Number(bt.available_on) * 1000 : null;
  const known = bt && String(bt.currency || "").toLowerCase() === "jpy" && Number.isFinite(Number(bt.net)) && Number.isFinite(Number(bt.fee));
  return { amountYen: known ? Number(bt.net) : null, chargeId, availableAt };
}
export const resolveInvoiceCharge = referralPaidYen;

/* ---------------- payout account (Express, JP) ---------------- */

export function payoutAccountState(stripeAccount) {
  if (!stripeAccount?.id) return { status: "not_started", currently_due: 0, past_due: 0, disabled_reason: null, details_submitted: false };
  const req = stripeAccount.requirements || {};
  const ready = stripeAccount.capabilities?.transfers === "active" && String(stripeAccount.country || "JP").toUpperCase() === "JP";
  return {
    status: ready ? "ready" : "in_progress",
    currently_due: (req.currently_due || []).length,
    past_due: (req.past_due || []).length,
    disabled_reason: req.disabled_reason || null,
    details_submitted: !!stripeAccount.details_submitted,
  };
}

function scheduleForm(env) {
  const form = new URLSearchParams();
  form.set("settings[payouts][schedule][interval]", "monthly");
  form.set("settings[payouts][schedule][monthly_anchor]", String(payoutAnchor(env)));
  return form;
}

function scheduleMatches(env, stripeAccount) {
  const schedule = stripeAccount?.settings?.payouts?.schedule;
  if (!schedule) return true; // not readable: do not keep rewriting it
  return schedule.interval === "monthly" && Number(schedule.monthly_anchor) === payoutAnchor(env);
}

async function saveAccountState(env, accountId, state, now) {
  try {
    await env.DB.prepare("UPDATE accounts SET payout_status=?, payout_due_count=?, payout_checked_at=? WHERE id=?")
      .bind(state.status, state.currently_due + state.past_due, now, accountId).run();
  } catch (error) {
    console.error("partner_payout_state_save_failed", JSON.stringify({ message: String(error?.message || error).slice(0, 120) }));
  }
}

/**
 * The partner's payout account status, from a short cache or from Stripe.
 * `stripeAccount` (an account.updated payload) skips the read. A schedule that
 * differs from the monthly one is corrected here.
 */
export async function refreshPayoutAccount(env, account, { force = false, now = Date.now(), stripeAccount = null } = {}) {
  if (!account?.stripe_account_id) return { status: "not_started", currently_due: 0, past_due: 0, disabled_reason: null, details_submitted: false };
  const cached = { status: account.payout_status || "in_progress", currently_due: Number(account.payout_due_count || 0), past_due: 0, disabled_reason: null, details_submitted: account.payout_status === "ready", cached: true };
  if (!force && !stripeAccount && account.payout_checked_at && now - Number(account.payout_checked_at) < STATUS_CACHE_MS) return cached;
  const secret = stripeKey(env);
  let data = stripeAccount;
  if (!data) {
    if (!secret) return { ...cached, status: account.payout_status || "unavailable" };
    const read = await stripeGet(secret, `/v1/accounts/${encodeURIComponent(account.stripe_account_id)}`);
    if (!read.ok) return { ...cached, status: account.payout_status || "unavailable" };
    data = read.data;
  }
  const state = payoutAccountState(data);
  if (secret && !scheduleMatches(env, data)) {
    const fixed = await stripePost(secret, `/v1/accounts/${encodeURIComponent(account.stripe_account_id)}`, scheduleForm(env));
    if (!fixed.ok) console.error("partner_payout_schedule_failed", JSON.stringify({ account: account.id, error: errorText(fixed) }));
  }
  await saveAccountState(env, account.id, state, now);
  return state;
}

/**
 * Create (once) the partner's Express account and return the Stripe-hosted
 * URL to continue: onboarding while transfers are not active, the Express
 * dashboard (bank details, payouts) once they are.
 */
export async function startPayoutOnboarding(env, account) {
  const secret = stripeKey(env);
  if (!secret) return { status: 503, body: { error: "stripe_not_configured" } };
  let stripeAccountId = account.stripe_account_id || null;
  let state = null;
  if (!stripeAccountId) {
    const form = scheduleForm(env);
    form.set("type", "express");
    form.set("country", "JP");
    form.set("capabilities[transfers][requested]", "true");
    // Some platforms are asked by Stripe to request card_payments alongside
    // transfers for JP accounts; opt in without a code change.
    if (String(env.STRIPE_CONNECT_REQUEST_CARD_PAYMENTS || "") === "1") form.set("capabilities[card_payments][requested]", "true");
    if (account.email) form.set("email", account.email);
    form.set("business_profile[product_description]", "Nurevo referral partner (commission recipient)");
    form.set("metadata[nurevo_account_id]", String(account.id));
    const created = await stripePost(secret, "/v1/accounts", form, { idempotencyKey: `nurevo-partner-account-${account.id}` });
    if (!created.ok || !created.data?.id) return { status: 502, body: { error: "stripe_account_failed", detail: errorText(created) } };
    const saved = await env.DB.prepare("UPDATE accounts SET stripe_account_id=?, payout_status='in_progress', payout_checked_at=NULL WHERE id=? AND stripe_account_id IS NULL")
      .bind(created.data.id, account.id).run();
    if (Number(saved.meta?.changes || 0) !== 1) {
      const current = await env.DB.prepare("SELECT stripe_account_id FROM accounts WHERE id=?").bind(account.id).first();
      stripeAccountId = current?.stripe_account_id || created.data.id;
    } else stripeAccountId = created.data.id;
    state = { status: "in_progress" };
  } else {
    state = await refreshPayoutAccount(env, account, { force: true });
  }
  if (state.status === "ready") {
    const login = await stripePost(secret, `/v1/accounts/${encodeURIComponent(stripeAccountId)}/login_links`, new URLSearchParams());
    if (login.ok && login.data?.url) return { status: 200, body: { ok: true, kind: "dashboard", url: login.data.url, payout_account: state } };
  }
  const link = await stripePost(secret, "/v1/account_links", new URLSearchParams({
    account: stripeAccountId, refresh_url: ONBOARD_REFRESH_URL, return_url: ONBOARD_RETURN_URL, type: "account_onboarding",
  }));
  if (!link.ok || !link.data?.url) return { status: 502, body: { error: "stripe_account_link_failed", detail: errorText(link) } };
  return { status: 200, body: { ok: true, kind: "onboarding", url: link.data.url, payout_account: state } };
}

/* ---------------- ledger: commissions ---------------- */

async function resolveSite(env, invoice, siteId) {
  let id = siteId || invoice?.parent?.subscription_details?.metadata?.siteId || null;
  if (!id) {
    const sub = typeof invoice?.subscription === "string" ? invoice.subscription
      : invoice?.subscription?.id || invoice?.parent?.subscription_details?.subscription || null;
    if (sub) id = (await env.DB.prepare("SELECT id FROM sites WHERE stripe_subscription_id=? LIMIT 1").bind(sub).first())?.id || null;
  }
  return id ? env.DB.prepare("SELECT * FROM sites WHERE id=?").bind(id).first() : null;
}

/** Who is owed commission for this site: the account referral first, else the legacy referrer. */
export async function resolvePartner(env, site) {
  if (!site) return null;
  if (site.owner_member_id) {
    const partner = await env.DB.prepare(`SELECT p.id FROM accounts c JOIN accounts p ON p.id=c.referred_by_account_id
      WHERE c.member_id=? AND p.id<>c.id`).bind(site.owner_member_id).first();
    if (partner?.id) return { partnerAccountId: partner.id, legacyReferrerId: null };
  }
  if (site.channel === "referral" && site.referred_by) {
    const referrer = await env.DB.prepare("SELECT id FROM referrers WHERE id=?").bind(site.referred_by).first();
    if (referrer?.id) return { partnerAccountId: null, legacyReferrerId: referrer.id };
  }
  return null;
}

/**
 * invoice.paid (verified webhook only): record the commission once and pay it
 * if the partner can receive transfers; otherwise it stays held.
 */
export async function recordInvoiceCommission(env, { invoice, siteId = null, now = Date.now(), get = stripeGet } = {}) {
  if (!invoice?.id || invoice.object && invoice.object !== "invoice") return { skipped: "no_invoice" };
  if (!(Number(invoice.amount_paid) > 0)) return { skipped: "zero_invoice" };
  // Partner first: an invoice with no partner never touches the ledger.
  const site = await resolveSite(env, invoice, siteId);
  const partner = await resolvePartner(env, site);
  if (!partner) return { skipped: "no_partner" };
  const existing = await env.DB.prepare("SELECT id FROM referral_payouts WHERE source_key=?").bind(`invoice:${invoice.id}`).first();
  if (existing) return { duplicate: true, ...(await payCommission(env, existing.id, { now, get })) };
  const resolved = await resolveInvoiceCharge(stripeKey(env), invoice, { get });
  const amountYen = resolved.amountYen == null ? 0 : referralCommissionYen(resolved.amountYen, "jpy");
  if (resolved.amountYen != null && amountYen <= 0) return { skipped: "zero_commission" };
  const inserted = await env.DB.prepare(`INSERT OR IGNORE INTO referral_payouts
      (kind, source_key, invoice_id, charge_id, partner_account_id, legacy_referrer_id, site_id, paid_yen, amount_yen, available_at, status, last_error, created_at, updated_at)
      VALUES ('commission', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'held', ?, ?, ?)`)
    .bind(`invoice:${invoice.id}`, invoice.id, resolved.chargeId, partner.partnerAccountId, partner.legacyReferrerId, site.id,
      resolved.amountYen, amountYen, resolved.availableAt, resolved.chargeId && resolved.amountYen != null ? null : "charge_unresolved", now, now).run();
  const row = await env.DB.prepare("SELECT id FROM referral_payouts WHERE source_key=?").bind(`invoice:${invoice.id}`).first();
  if (!row) return { skipped: "ledger_unavailable" };
  return { recorded: Number(inserted.meta?.changes || 0) === 1, ...(await payCommission(env, row.id, { now, get })) };
}

/** A held row whose charge (or non-JPY amount) was not known yet. */
async function resolveHeldRow(env, row, { get, now }) {
  const secret = stripeKey(env);
  if (!secret) return row;
  const invoice = await get(secret, `/v1/invoices/${encodeURIComponent(row.invoice_id)}`);
  if (!invoice.ok || invoice.data?.status !== "paid") return row;
  const resolved = await resolveInvoiceCharge(secret, invoice.data, { get });
  if (!resolved.chargeId || resolved.amountYen == null) return row;
  const amountYen = referralCommissionYen(resolved.amountYen, "jpy");
  await env.DB.prepare(`UPDATE referral_payouts SET charge_id=?, paid_yen=?, amount_yen=?, available_at=COALESCE(?,available_at),
      status=CASE WHEN ?<=0 THEN 'void' ELSE status END, last_error=NULL, updated_at=? WHERE id=? AND status IN ('held','failed') AND charge_id IS NULL`)
    .bind(resolved.chargeId, resolved.amountYen, amountYen, resolved.availableAt, amountYen, now, row.id).run();
  return env.DB.prepare("SELECT * FROM referral_payouts WHERE id=?").bind(row.id).first();
}

async function destinationFor(env, row, { now, readiness }) {
  if (row.partner_account_id) {
    const account = await env.DB.prepare("SELECT * FROM accounts WHERE id=?").bind(row.partner_account_id).first();
    if (!account?.stripe_account_id) return null;
    const key = `a:${account.id}`;
    if (!readiness.has(key)) readiness.set(key, await refreshPayoutAccount(env, account, { now }));
    return readiness.get(key).status === "ready" ? account.stripe_account_id : null;
  }
  if (row.legacy_referrer_id) {
    const referrer = await env.DB.prepare("SELECT stripe_account_id FROM referrers WHERE id=?").bind(row.legacy_referrer_id).first();
    return referrer?.stripe_account_id || null;
  }
  return null;
}

/** Reversals that could not be pulled back (the partner's balance was already paid out) for this partner. */
async function outstandingDebts(env, row) {
  const { results = [] } = await env.DB.prepare(`SELECT r.* FROM referral_payouts r JOIN referral_payouts c ON c.id=r.parent_id
      WHERE r.kind='reversal' AND r.status='failed' AND r.amount_yen>r.offset_yen
        AND ((? IS NOT NULL AND c.partner_account_id=?) OR (? IS NOT NULL AND c.legacy_referrer_id=?))
      ORDER BY r.id LIMIT 20`).bind(row.partner_account_id, row.partner_account_id, row.legacy_referrer_id, row.legacy_referrer_id).all();
  return results;
}

/**
 * Transfer one commission row to the partner, at most once.
 * Never without source_transaction: an unresolved charge keeps the row held.
 */
export async function payCommission(env, id, { now = Date.now(), get = stripeGet, readiness = new Map() } = {}) {
  let row = await env.DB.prepare("SELECT * FROM referral_payouts WHERE id=? AND kind='commission'").bind(id).first();
  if (!row) return { status: "missing" };
  const stale = row.status === "sending" && now - Number(row.updated_at || 0) > STALE_CLAIM_MS;
  if (!["held", "failed"].includes(row.status) && !stale) return { status: row.status };
  if (row.status === "failed" && Number(row.attempts || 0) >= MAX_ATTEMPTS) return { status: "failed" };
  const secret = stripeKey(env);
  if (!secret) return { status: row.status };
  if (!row.charge_id || row.paid_yen == null) row = await resolveHeldRow(env, row, { get, now });
  if (!row.charge_id || row.paid_yen == null || row.status === "void") return { status: row.status, reason: "charge_unresolved" };
  const destination = await destinationFor(env, row, { now, readiness });
  if (!destination) return { status: row.status, reason: "account_not_ready" };
  const claim = await env.DB.prepare("UPDATE referral_payouts SET status='sending', attempts=attempts+1, updated_at=? WHERE id=? AND status=? AND updated_at=?")
    .bind(now, row.id, row.status, row.updated_at).run();
  if (Number(claim.meta?.changes || 0) !== 1) return { status: "busy" };
  row = await env.DB.prepare("SELECT * FROM referral_payouts WHERE id=?").bind(row.id).first();
  const group = `nurevo-referral-${row.invoice_id}`;
  // A retry first looks for a transfer an earlier attempt may have created.
  if (Number(row.attempts) > 1) {
    const found = await get(secret, `/v1/transfers?transfer_group=${encodeURIComponent(group)}&limit=10`);
    if (!found.ok) {
      await env.DB.prepare("UPDATE referral_payouts SET status='failed', last_error=?, updated_at=? WHERE id=?").bind("transfer_lookup_failed", now, row.id).run();
      return { status: "failed" };
    }
    const prior = (found.data?.data || []).find((t) => t?.destination === destination && t?.metadata?.ledger_id === String(row.id));
    if (prior) {
      await env.DB.prepare("UPDATE referral_payouts SET status='sent', transfer_id=?, destination=?, transferred_yen=?, sent_at=?, last_error=NULL, updated_at=? WHERE id=?")
        .bind(prior.id, destination, Number(prior.amount) || 0, now, now, row.id).run();
      return { status: "sent", transfer_id: prior.id };
    }
  }
  const payable = Math.max(0, Number(row.amount_yen) - Number(row.refunded_yen || 0));
  if (payable <= 0) {
    await env.DB.prepare("UPDATE referral_payouts SET status='reversed', updated_at=? WHERE id=?").bind(now, row.id).run();
    return { status: "reversed" };
  }
  // Refunds that could not be pulled back earlier are recovered from this one.
  const debts = await outstandingDebts(env, row);
  const offsets = [];
  let withheld = 0;
  for (const debt of debts) {
    const take = Math.min(payable - withheld, Number(debt.amount_yen) - Number(debt.offset_yen || 0));
    if (take <= 0) break;
    offsets.push({ id: debt.id, take, full: take === Number(debt.amount_yen) - Number(debt.offset_yen || 0) });
    withheld += take;
  }
  const amount = payable - withheld;
  let transferId = null;
  if (amount > 0) {
    const form = new URLSearchParams({
      amount: String(amount), currency: "jpy", destination, source_transaction: row.charge_id, transfer_group: group,
      "metadata[ledger_id]": String(row.id), "metadata[invoice_id]": row.invoice_id, "metadata[site_id]": String(row.site_id || ""),
    });
    const sent = await stripePost(secret, "/v1/transfers", form, { idempotencyKey: `nurevo-referral-${row.invoice_id}-${amount}` });
    if (!sent.ok || !sent.data?.id) {
      await env.DB.prepare("UPDATE referral_payouts SET status='failed', last_error=?, updated_at=? WHERE id=?").bind(errorText(sent), now, row.id).run();
      console.error("referral_transfer_failed", JSON.stringify({ ledger: row.id, invoiceId: row.invoice_id, error: errorText(sent) }));
      return { status: "failed" };
    }
    transferId = sent.data.id;
  }
  await env.DB.prepare("UPDATE referral_payouts SET status='sent', transfer_id=?, destination=?, transferred_yen=?, withheld_yen=?, sent_at=?, last_error=NULL, updated_at=? WHERE id=?")
    .bind(transferId, destination, amount, withheld, now, now, row.id).run();
  for (const o of offsets) {
    await env.DB.prepare(`UPDATE referral_payouts SET offset_yen=offset_yen+?, status=CASE WHEN ? THEN 'offset' ELSE status END,
        reversal_id=COALESCE(reversal_id, ?), updated_at=? WHERE id=?`).bind(o.take, o.full ? 1 : 0, `offset:${row.id}`, now, o.id).run();
  }
  return { status: "sent", transfer_id: transferId, amount_yen: amount, withheld_yen: withheld };
}

/* ---------------- ledger: refunds ---------------- */

/** charge.refunded (verified webhook only): reverse the commission in proportion. */
export async function recordChargeRefund(env, { charge, now = Date.now(), get = stripeGet } = {}) {
  if (!charge?.id) return { skipped: "no_charge" };
  let parent;
  try {
    parent = await env.DB.prepare("SELECT * FROM referral_payouts WHERE kind='commission' AND charge_id=?").bind(charge.id).first();
  } catch (error) {
    // No ledger yet (0039 unapplied) means no commission to reverse.
    if (/no such table/i.test(String(error?.message || error))) return { skipped: "ledger_unavailable" };
    throw error;
  }
  if (!parent && typeof charge.invoice === "string") parent = await env.DB.prepare("SELECT * FROM referral_payouts WHERE kind='commission' AND invoice_id=?").bind(charge.invoice).first();
  if (!parent) return { skipped: "no_commission" };
  const amount = Number(charge.amount) || 0, refunded = Math.min(amount, Number(charge.amount_refunded) || 0);
  if (amount <= 0 || refunded <= 0) return { skipped: "no_refund" };
  const commission = Number(parent.amount_yen) || 0;
  const target = commission - Math.floor(commission * (amount - refunded) / amount);
  const claimed = await env.DB.prepare("SELECT COALESCE(SUM(amount_yen),0) AS n FROM referral_payouts WHERE kind='reversal' AND parent_id=?").bind(parent.id).first();
  const delta = target - Number(claimed?.n || 0);
  if (delta <= 0) return { skipped: "already_reversed" };
  const key = `refund:${charge.id}:${refunded}`;
  const refundId = charge.refunds?.data?.[0]?.id || null;
  await env.DB.prepare(`INSERT OR IGNORE INTO referral_payouts
      (kind, source_key, parent_id, invoice_id, charge_id, refund_id, partner_account_id, legacy_referrer_id, site_id, amount_yen, status, created_at, updated_at)
      VALUES ('reversal', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`)
    .bind(key, parent.id, parent.invoice_id, charge.id, refundId, parent.partner_account_id, parent.legacy_referrer_id, parent.site_id, delta, now, now).run();
  const row = await env.DB.prepare("SELECT id FROM referral_payouts WHERE source_key=?").bind(key).first();
  return row ? settleReversal(env, row.id, { now, get }) : { skipped: "ledger_unavailable" };
}

export async function settleReversal(env, id, { now = Date.now() } = {}) {
  let row = await env.DB.prepare("SELECT * FROM referral_payouts WHERE id=? AND kind='reversal'").bind(id).first();
  if (!row) return { status: "missing" };
  const stale = row.status === "processing" && now - Number(row.updated_at || 0) > STALE_CLAIM_MS;
  if (!["pending", "failed"].includes(row.status) && !stale) return { status: row.status };
  if (row.status === "failed" && Number(row.attempts || 0) >= MAX_ATTEMPTS) return { status: "failed" };
  const parent = await env.DB.prepare("SELECT * FROM referral_payouts WHERE id=?").bind(row.parent_id).first();
  if (!parent) return { status: row.status };
  const remaining = Number(row.amount_yen) - Number(row.offset_yen || 0);
  // Not transferred yet: just reduce what will be paid.
  if (["held", "failed"].includes(parent.status)) {
    const reduced = await env.DB.prepare(`UPDATE referral_payouts SET refunded_yen=refunded_yen+?,
        status=CASE WHEN refunded_yen+?>=amount_yen THEN 'reversed' ELSE status END, updated_at=? WHERE id=? AND status IN ('held','failed')`)
      .bind(remaining, remaining, now, parent.id).run();
    if (Number(reduced.meta?.changes || 0) === 1) {
      await env.DB.prepare("UPDATE referral_payouts SET status='applied', updated_at=? WHERE id=?").bind(now, row.id).run();
      return { status: "applied" };
    }
    return { status: row.status };
  }
  if (parent.status === "reversed" || parent.status === "void") {
    await env.DB.prepare("UPDATE referral_payouts SET status='applied', updated_at=? WHERE id=?").bind(now, row.id).run();
    return { status: "applied" };
  }
  if (parent.status !== "sent") return { status: row.status }; // in flight: the hourly job settles it
  const secret = stripeKey(env);
  const transferred = Number(parent.transferred_yen || 0) - Number(parent.reversed_back_yen || 0);
  const pull = Math.min(remaining, Math.max(0, transferred));
  if (!secret || !parent.transfer_id || pull <= 0) {
    // Nothing on Stripe to pull back from: recover it from the next commission.
    await env.DB.prepare("UPDATE referral_payouts SET status='failed', attempts=attempts+1, last_error=?, updated_at=? WHERE id=?").bind(parent.transfer_id ? "nothing_to_reverse" : "no_transfer", now, row.id).run();
    return { status: "failed" };
  }
  const claim = await env.DB.prepare("UPDATE referral_payouts SET status='processing', attempts=attempts+1, updated_at=? WHERE id=? AND status=? AND updated_at=?")
    .bind(now, row.id, row.status, row.updated_at).run();
  if (Number(claim.meta?.changes || 0) !== 1) return { status: "busy" };
  const form = new URLSearchParams({ amount: String(pull), "metadata[ledger_id]": String(row.id), "metadata[charge_id]": String(row.charge_id || "") });
  const reversed = await stripePost(secret, `/v1/transfers/${encodeURIComponent(parent.transfer_id)}/reversals`, form, { idempotencyKey: `nurevo-${row.source_key}-${pull}` });
  if (!reversed.ok || !reversed.data?.id) {
    // Typically the partner's balance was already paid out on the 25th.
    await env.DB.prepare("UPDATE referral_payouts SET status='failed', last_error=?, updated_at=? WHERE id=?").bind(errorText(reversed), now, row.id).run();
    return { status: "failed" };
  }
  await env.DB.prepare("UPDATE referral_payouts SET status=?, reversal_id=?, offset_yen=offset_yen+?, updated_at=? WHERE id=?")
    .bind(pull === remaining ? "sent" : "failed", reversed.data.id, pull, now, row.id).run();
  await env.DB.prepare(`UPDATE referral_payouts SET reversed_back_yen=reversed_back_yen+?, refunded_yen=refunded_yen+?,
      status=CASE WHEN refunded_yen+?>=amount_yen THEN 'reversed' ELSE status END, updated_at=? WHERE id=?`)
    .bind(pull, pull, pull, now, parent.id).run();
  return { status: pull === remaining ? "sent" : "failed", reversal_id: reversed.data.id };
}

/* ---------------- release (hourly, onboarding return, account.updated) ---------------- */

export async function releaseHeldPayouts(env, { partnerAccountId = null, limit = 25, now = Date.now(), get = stripeGet } = {}) {
  const result = { checked: 0, sent: 0, held: 0, failed: 0, reversals: 0 };
  if (!stripeKey(env)) return { ...result, skipped: "stripe_not_configured" };
  const staleBefore = now - STALE_CLAIM_MS;
  const filter = partnerAccountId == null ? "" : " AND partner_account_id=?";
  const binds = partnerAccountId == null ? [] : [partnerAccountId];
  const { results: reversals = [] } = await env.DB.prepare(`SELECT id FROM referral_payouts WHERE kind='reversal'
      AND (status='pending' OR (status='failed' AND attempts<? AND last_error NOT IN ('no_transfer','nothing_to_reverse')) OR (status='processing' AND updated_at<?))${filter} ORDER BY id LIMIT ?`)
    .bind(MAX_ATTEMPTS, staleBefore, ...binds, limit).all();
  for (const r of reversals) { await settleReversal(env, r.id, { now }); result.reversals++; }
  const { results: rows = [] } = await env.DB.prepare(`SELECT id FROM referral_payouts WHERE kind='commission'
      AND (status='held' OR (status='failed' AND attempts<?) OR (status='sending' AND updated_at<?))${filter} ORDER BY id LIMIT ?`)
    .bind(MAX_ATTEMPTS, staleBefore, ...binds, limit).all();
  const readiness = new Map();
  for (const r of rows) {
    result.checked++;
    const outcome = await payCommission(env, r.id, { now, get, readiness });
    if (outcome.status === "sent") result.sent++;
    else if (outcome.status === "failed") result.failed++;
    else result.held++;
  }
  return result;
}

/** Hourly job. Skips quietly until migration 0039 is applied. */
export async function runPartnerPayouts(env, { now = Date.now() } = {}) {
  try {
    return await releaseHeldPayouts(env, { now });
  } catch (error) {
    if (/no such table|no such column/i.test(String(error?.message || error))) return { skipped: "migration_0039_not_applied" };
    throw error;
  }
}

/** account.updated (Connect webhook): cache the state and release held commission once ready. */
export async function handleConnectedAccountUpdated(env, stripeAccount, { now = Date.now() } = {}) {
  if (!stripeAccount?.id) return { skipped: "no_account" };
  const account = await env.DB.prepare("SELECT * FROM accounts WHERE stripe_account_id=?").bind(stripeAccount.id).first();
  if (!account) return { skipped: "unknown_account" };
  const state = await refreshPayoutAccount(env, account, { stripeAccount, now });
  if (state.status !== "ready") return { status: state.status };
  return { status: state.status, ...(await releaseHeldPayouts(env, { partnerAccountId: account.id, limit: 10, now })) };
}

/* ---------------- partner page totals ---------------- */

const JST_MS = 9 * 60 * 60 * 1000;
function anchorDayUtcMs(year, month, anchor) {
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Date.UTC(year, month, Math.min(anchor, last)) - JST_MS; // 00:00 JST on the payout day
}
/** The next monthly payout day (00:00 JST) and the one before it. */
export function payoutWindow(now, anchor) {
  const jst = new Date(now + JST_MS);
  let y = jst.getUTCFullYear(), m = jst.getUTCMonth();
  let next = anchorDayUtcMs(y, m, anchor);
  const thisMonth = now < next + 24 * 60 * 60 * 1000;
  if (!thisMonth) { m += 1; if (m > 11) { m = 0; y += 1; } next = anchorDayUtcMs(y, m, anchor); }
  const pm = m === 0 ? 11 : m - 1, py = m === 0 ? y - 1 : y;
  return { next, previous: anchorDayUtcMs(py, pm, anchor), nextIsThisMonth: thisMonth };
}

export async function partnerLedgerTotals(env, accountId, { now = Date.now(), anchor = DEFAULT_PAYOUT_ANCHOR } = {}) {
  const { results: rows = [] } = await env.DB.prepare(`SELECT kind, status, amount_yen, refunded_yen, transferred_yen, reversed_back_yen,
      offset_yen, available_at, sent_at FROM referral_payouts WHERE partner_account_id=?`).bind(accountId).all();
  const window = payoutWindow(now, anchor);
  const totals = { earned: 0, paid: 0, held: 0, next: 0, later: 0 };
  for (const r of rows) {
    const n = (k) => Number(r[k] || 0);
    if (r.kind === "reversal") {
      totals.earned -= n("amount_yen");
      continue;
    }
    if (r.status === "void") continue;
    totals.earned += n("amount_yen");
    if (["held", "failed", "sending"].includes(r.status)) {
      const payable = Math.max(0, n("amount_yen") - n("refunded_yen"));
      totals.held += payable; totals.later += payable;
      continue;
    }
    const net = n("transferred_yen") - n("reversed_back_yen");
    totals.paid += net;
    const effective = Math.max(n("available_at"), n("sent_at"));
    if (effective > window.next) totals.later += net;
    else if (effective > window.previous) totals.next += net;
  }
  return { ...totals, window };
}
