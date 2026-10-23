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
 *   earns nothing. Refunds and lost disputes reduce it in proportion to the
 *   refunded share of the charge:
 *   kept_yen = floor(commission_yen × (charge.amount − amount_refunded) / charge.amount),
 *   or 0 when a dispute on the charge was lost.
 *
 * kept_yen is always recomputed from the charge's CURRENT state (read from
 * Stripe when paying, when a refund/dispute event arrives and by the hourly
 * reconcile), never from the order events arrived in, so a refund that comes
 * before the commission row, while it is unresolved or while a transfer is in
 * flight is still accounted for.
 *
 * Money rules:
 *   - Only a verified Stripe webhook creates commission. The hourly job and
 *     the partner's own POST /api/partner/payout/refresh only release or
 *     reconcile rows a webhook created. No amount or destination ever comes
 *     from a client.
 *   - Nurevo never advances money: every transfer carries
 *     source_transaction = the customer's charge, so the partner's funds become
 *     available only when that charge's funds are available in Nurevo's
 *     balance. A row whose charge cannot be resolved stays held.
 *   - Per-invoice transfers go to the partner's Stripe balance; the Express
 *     account pays its AVAILABLE balance to the bank once a month
 *     (PARTNER_PAYOUT_MONTHLY_ANCHOR, default the 25th), so funds not yet
 *     settled on that day roll to the next month by themselves.
 *   - At most one transfer per ledger row: the amount is frozen on the row
 *     before the first attempt, the Idempotency-Key is stable
 *     (nurevo-referral-ledger-<row>-k<rev>), and before any retry the
 *     partner's transfers are searched for metadata.ledger_id. The key
 *     revision only changes after that search confirms no transfer exists and
 *     Stripe's 24 h idempotency window has passed.
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

const ONBOARD_RETURN_URL = "https://nurevo.jp/dashboard?payout=return#partner";
const ONBOARD_REFRESH_URL = "https://nurevo.jp/dashboard?payout=refresh#partner";
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const STATUS_CACHE_MS = 5 * 60 * 1000;
const REFRESH_THROTTLE_MS = 60 * 1000;
const STALE_CLAIM_MS = 15 * 60 * 1000;
const IDEMPOTENCY_WINDOW_MS = DAY_MS + HOUR_MS; // Stripe keeps keys at least 24 h
const MAX_KEY_REVISIONS = 4;
const RECONCILE_DAYS = 180;
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
// No answer, Stripe's own failure, rate limiting or an idempotency conflict:
// the request may or may not have run, or may simply be retried soon.
const ambiguous = (result) => !result?.status || result.status >= 500 || result.status === 409 || result.status === 429
  || result?.data?.error?.type === "idempotency_error";
const deadLog = (row, reason) => console.error("referral_payout_dead", JSON.stringify({ ledger: row.id, invoice: row.invoice_id, reason }));

/* ---------------- the charge behind an invoice ---------------- */

async function invoiceChargeIds(secret, invoice, get) {
  if (typeof invoice?.charge === "string") return [invoice.charge];
  if (invoice?.charge?.id) return [invoice.charge.id];
  if (!invoice?.id) return [];
  const list = await get(secret, `/v1/invoice_payments?invoice=${encodeURIComponent(invoice.id)}&limit=10`, { version: INVOICE_PAYMENTS_API_VERSION });
  if (!list.ok) return null;
  return (list.data?.data || []).filter((item) => item?.status === "paid" && item?.payment?.type === "charge")
    .map((item) => typeof item.payment.charge === "string" ? item.payment.charge : item.payment.charge?.id).filter(Boolean);
}

/**
 * The commission basis of a paid invoice: the NET JPY of its charge's balance
 * transaction (amount − Stripe fees), the charge id and when the funds become
 * available. amountYen is null while it is not readable yet. Never estimated.
 */
export async function referralPaidYen(secret, invoice, { get = stripeGet } = {}) {
  const ids = secret ? await invoiceChargeIds(secret, invoice, get) : null;
  const chargeId = ids?.[0] || null;
  if (!chargeId) return { amountYen: null, chargeId: null, availableAt: null };
  const state = await chargeState(secret, chargeId, get);
  return { amountYen: state.ok ? state.net : null, chargeId, availableAt: state.availableAt ?? null };
}

const CLOSED_DISPUTE = new Set(["won", "warning_closed", "prevented"]);
/** The charge as it is now: net JPY, refunded share, dispute outcome. */
async function chargeState(secret, chargeId, get) {
  const charge = await get(secret, `/v1/charges/${encodeURIComponent(chargeId)}?expand[]=balance_transaction`);
  const c = charge.data || {};
  const bt = charge.ok && c.balance_transaction && typeof c.balance_transaction === "object" ? c.balance_transaction : null;
  const availableAt = Number(bt?.available_on) > 0 ? Number(bt.available_on) * 1000 : null;
  if (!bt || String(bt.currency || "").toLowerCase() !== "jpy" || !Number.isFinite(Number(bt.net)) || !Number.isFinite(Number(bt.fee))) {
    return { ok: false, reason: charge.ok ? "fee_unknown" : "charge_unreadable", availableAt };
  }
  let disputeLost = false, disputeOpen = false;
  if (c.disputed) {
    const disputes = await get(secret, `/v1/disputes?charge=${encodeURIComponent(chargeId)}&limit=10`);
    if (!disputes.ok) return { ok: false, reason: "dispute_unreadable", availableAt };
    for (const d of disputes.data?.data || []) {
      if (d.status === "lost") disputeLost = true;
      else if (!CLOSED_DISPUTE.has(d.status)) disputeOpen = true;
    }
  }
  return { ok: true, net: Number(bt.net), amount: Number(c.amount) || 0, refunded: Math.min(Number(c.amount) || 0, Number(c.amount_refunded) || 0),
    disputeLost, disputeOpen, availableAt };
}

export function keptYen(commission, { amount, refunded, disputeLost }) {
  if (disputeLost || !(amount > 0) || refunded >= amount) return 0;
  return refunded > 0 ? Math.floor(commission * (amount - refunded) / amount) : commission;
}

/* ---------------- payout account (Express, JP) ---------------- */

export function payoutAccountState(stripeAccount) {
  if (!stripeAccount?.id) return { status: "not_started", currently_due: 0, past_due: 0, disabled_reason: null, details_submitted: false };
  const req = stripeAccount.requirements || {};
  // A missing country is not Japan.
  const ready = stripeAccount.capabilities?.transfers === "active" && String(stripeAccount.country || "").toUpperCase() === "JP";
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
 * Reading never changes anything on Stripe; `fixSchedule` (POST/webhook/cron
 * only) sets a differing payout schedule back to monthly.
 */
export async function refreshPayoutAccount(env, account, { force = false, now = Date.now(), stripeAccount = null, fixSchedule = false } = {}) {
  if (!account?.stripe_account_id) return { status: "not_started", currently_due: 0, past_due: 0, disabled_reason: null, details_submitted: false };
  const cached = { status: account.payout_status || "in_progress", currently_due: Number(account.payout_due_count || 0), past_due: 0, disabled_reason: null, details_submitted: account.payout_status === "ready", cached: true };
  const age = now - Number(account.payout_checked_at || 0);
  if (!force && !stripeAccount && account.payout_checked_at && age >= 0 && age < STATUS_CACHE_MS) return cached;
  const secret = stripeKey(env);
  let data = stripeAccount;
  if (!data) {
    if (!secret) return { ...cached, status: account.payout_status || "unavailable" };
    const read = await stripeGet(secret, `/v1/accounts/${encodeURIComponent(account.stripe_account_id)}`);
    if (!read.ok) return { ...cached, status: account.payout_status || "unavailable" };
    data = read.data;
  }
  const state = payoutAccountState(data);
  if (fixSchedule && secret && !scheduleMatches(env, data)) {
    const fixed = await stripePost(secret, `/v1/accounts/${encodeURIComponent(account.stripe_account_id)}`, scheduleForm(env));
    if (!fixed.ok) console.error("partner_payout_schedule_failed", JSON.stringify({ account: account.id, error: errorText(fixed) }));
  }
  await saveAccountState(env, account.id, state, now);
  return state;
}

function jstDay(now) { return new Date(now + 9 * HOUR_MS).toISOString().slice(0, 10).replace(/-/g, ""); }

/**
 * Create (once) the partner's connected account (Express Dashboard) and return the Stripe-hosted
 * URL to continue: onboarding while transfers are not active, the Express
 * dashboard (bank details, payouts) once they are.
 */
export async function startPayoutOnboarding(env, account, { now = Date.now() } = {}) {
  const secret = stripeKey(env);
  if (!secret) return { status: 503, body: { error: "stripe_not_configured" } };
  let stripeAccountId = account.stripe_account_id || null;
  let state;
  if (!stripeAccountId) {
    const form = scheduleForm(env);
    // Accounts v1 controller properties equivalent to Express (`type` is
    // deprecated for new platforms): Express Dashboard, Nurevo pays Stripe's
    // fees and is liable for losses (which is also what lets it set the payout
    // schedule), Stripe collects and keeps the KYC/bank requirements.
    form.set("controller[stripe_dashboard][type]", "express");
    form.set("controller[fees][payer]", "application");
    form.set("controller[losses][payments]", "application");
    form.set("controller[requirement_collection]", "stripe");
    form.set("country", "JP");
    form.set("capabilities[transfers][requested]", "true");
    // Opt in if Stripe asks this platform to request card_payments with
    // transfers for JP accounts.
    if (String(env.STRIPE_CONNECT_REQUEST_CARD_PAYMENTS || "") === "1") form.set("capabilities[card_payments][requested]", "true");
    if (account.email) form.set("email", account.email);
    form.set("business_profile[product_description]", "Nurevo referral partner (commission recipient)");
    form.set("metadata[nurevo_account_id]", String(account.id));
    // The key changes daily (JST) so a failure Stripe cached for 24 h does not
    // block a retry the next day; a double click on one day is one account.
    const created = await stripePost(secret, "/v1/accounts", form, { idempotencyKey: `nurevo-partner-account-${account.id}-${jstDay(now)}` });
    if (!created.ok || !created.data?.id) {
      console.error("partner_account_create_failed", JSON.stringify({ account: account.id, error: errorText(created) }));
      return { status: 502, body: { error: "stripe_account_failed", detail: errorText(created) } };
    }
    const saved = await env.DB.prepare("UPDATE accounts SET stripe_account_id=?, payout_status='in_progress', payout_checked_at=NULL WHERE id=? AND stripe_account_id IS NULL")
      .bind(created.data.id, account.id).run();
    if (Number(saved.meta?.changes || 0) !== 1) {
      const current = await env.DB.prepare("SELECT stripe_account_id FROM accounts WHERE id=?").bind(account.id).first();
      stripeAccountId = current?.stripe_account_id || created.data.id;
    } else stripeAccountId = created.data.id;
    state = { status: "in_progress" };
  } else {
    state = await refreshPayoutAccount(env, account, { force: true, fixSchedule: true, now });
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

/**
 * After Stripe sends the partner back (POST, CSRF): re-read the account at
 * most once a minute, correct the schedule, and pay held commission if ready.
 */
export async function refreshPayoutAfterReturn(env, account, { now = Date.now() } = {}) {
  const age = now - Number(account.payout_checked_at || 0);
  const throttled = !!account.payout_checked_at && age >= 0 && age < REFRESH_THROTTLE_MS;
  const state = await refreshPayoutAccount(env, account, { force: !throttled, fixSchedule: !throttled, now });
  let released = null;
  if (state.status === "ready" && !throttled) released = await releaseHeldPayouts(env, { partnerAccountId: account.id, limit: 10, now });
  return { payout_account: state, released };
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

/**
 * Who is owed commission for this site: the account referral first, else the
 * legacy referrer. Nobody earns commission on their own payments.
 */
export async function resolvePartner(env, site) {
  if (!site) return null;
  const owner = site.owner_member_id
    ? await env.DB.prepare("SELECT id, email FROM members WHERE id=?").bind(site.owner_member_id).first()
    : null;
  if (site.owner_member_id) {
    const partner = await env.DB.prepare(`SELECT p.id FROM accounts c JOIN accounts p ON p.id=c.referred_by_account_id
      WHERE c.member_id=? AND p.id<>c.id AND p.member_id<>? AND lower(p.email)<>lower(c.email)`).bind(site.owner_member_id, site.owner_member_id).first();
    if (partner?.id) return { partnerAccountId: partner.id, legacyReferrerId: null };
  }
  if (site.channel === "referral" && site.referred_by) {
    const referrer = await env.DB.prepare("SELECT id, email FROM referrers WHERE id=?").bind(site.referred_by).first();
    const self = owner?.email && referrer?.email && owner.email.toLowerCase() === referrer.email.toLowerCase();
    if (referrer?.id && !self) return { partnerAccountId: null, legacyReferrerId: referrer.id };
  }
  return null;
}

/**
 * invoice.paid (verified webhook only): record the commission once and pay it
 * if the partner can receive transfers; otherwise it stays held.
 */
export async function recordInvoiceCommission(env, { invoice, siteId = null, now = Date.now(), get = stripeGet } = {}) {
  if (!invoice?.id || (invoice.object && invoice.object !== "invoice")) return { skipped: "no_invoice" };
  if (!(Number(invoice.amount_paid) > 0)) return { skipped: "zero_invoice" };
  // Partner first: an invoice with no partner never touches the ledger.
  const site = await resolveSite(env, invoice, siteId);
  const partner = await resolvePartner(env, site);
  if (!partner) return { skipped: "no_partner" };
  const key = `invoice:${invoice.id}`;
  let row = await env.DB.prepare("SELECT id FROM referral_payouts WHERE source_key=?").bind(key).first();
  if (!row) {
    const secret = stripeKey(env);
    const ids = secret ? await invoiceChargeIds(secret, invoice, get) : (typeof invoice.charge === "string" ? [invoice.charge] : null);
    const chargeId = ids?.length === 1 ? ids[0] : null;
    const note = ids && ids.length > 1 ? "multiple_charges" : chargeId ? null : "charge_unresolved";
    if (note === "multiple_charges") console.error("referral_multiple_charges", JSON.stringify({ invoice: invoice.id, charges: ids.length }));
    await env.DB.prepare(`INSERT OR IGNORE INTO referral_payouts
        (kind, source_key, invoice_id, charge_id, partner_account_id, legacy_referrer_id, site_id, status, last_error, created_at, updated_at)
        VALUES ('commission', ?, ?, ?, ?, ?, ?, 'held', ?, ?, ?)`)
      .bind(key, invoice.id, chargeId, partner.partnerAccountId, partner.legacyReferrerId, site.id, note, now, now).run();
    row = await env.DB.prepare("SELECT id FROM referral_payouts WHERE source_key=?").bind(key).first();
    if (!row) return { skipped: "ledger_unavailable" };
  }
  return payCommission(env, row.id, { now, get, sync: true });
}

const loadRow = (env, id) => env.DB.prepare("SELECT * FROM referral_payouts WHERE id=?").bind(id).first();

/**
 * Bring a commission row up to date with its charge: resolve the charge if
 * unknown (or a previous read failed), then net, refunds and disputes.
 * Returns the reason it cannot be paid yet, or null.
 */
async function syncCommission(env, row, { get, now }) {
  const secret = stripeKey(env);
  if (!secret) return "stripe_not_configured";
  if (row.last_error === "multiple_charges") return "multiple_charges";
  let chargeId = row.charge_id;
  if (!chargeId) {
    const invoice = await get(secret, `/v1/invoices/${encodeURIComponent(row.invoice_id)}`);
    if (invoice.ok && invoice.data?.status === "paid") {
      const ids = await invoiceChargeIds(secret, invoice.data, get);
      if (ids && ids.length > 1) {
        await env.DB.prepare("UPDATE referral_payouts SET last_error='multiple_charges', checked_at=?, updated_at=? WHERE id=?").bind(now, now, row.id).run();
        console.error("referral_multiple_charges", JSON.stringify({ invoice: row.invoice_id, charges: ids.length }));
        return "multiple_charges";
      }
      chargeId = ids?.[0] || null;
    }
  }
  if (!chargeId) {
    await env.DB.prepare("UPDATE referral_payouts SET last_error='charge_unresolved', checked_at=?, updated_at=? WHERE id=?").bind(now, now, row.id).run();
    return "charge_unresolved";
  }
  const state = await chargeState(secret, chargeId, get);
  if (!state.ok) {
    await env.DB.prepare("UPDATE referral_payouts SET charge_id=COALESCE(charge_id, ?), available_at=COALESCE(?, available_at), last_error=?, checked_at=?, updated_at=? WHERE id=?")
      .bind(chargeId, state.availableAt, state.reason, now, now, row.id).run();
    return state.reason;
  }
  const commission = referralCommissionYen(state.net, "jpy");
  const kept = keptYen(commission, state);
  await env.DB.prepare(`UPDATE referral_payouts SET charge_id=COALESCE(charge_id, ?), paid_yen=?, amount_yen=?, kept_yen=?, charge_amount=?,
      charge_refunded=?, dispute_lost=?, available_at=COALESCE(?, available_at), last_error=?, checked_at=?, updated_at=? WHERE id=?`)
    .bind(chargeId, state.net, commission, kept, state.amount, state.refunded, state.disputeLost ? 1 : 0, state.availableAt,
      state.disputeOpen ? "dispute_open" : null, now, now, row.id).run();
  return state.disputeOpen ? "dispute_open" : null;
}

const legacyReadiness = async (env, stripeAccountId, readiness) => {
  const key = `l:${stripeAccountId}`;
  if (!readiness.has(key)) {
    const read = await stripeGet(stripeKey(env), `/v1/accounts/${encodeURIComponent(stripeAccountId)}`);
    readiness.set(key, read.ok ? payoutAccountState(read.data).status : "unavailable");
  }
  return readiness.get(key) === "ready";
};

/** Where this row may be paid: only an account that can receive transfers, in Japan. */
async function destinationFor(env, row, { now, readiness }) {
  if (row.partner_account_id) {
    const account = await env.DB.prepare("SELECT * FROM accounts WHERE id=?").bind(row.partner_account_id).first();
    if (!account?.stripe_account_id) return null;
    const key = `a:${account.id}`;
    if (!readiness.has(key)) readiness.set(key, await refreshPayoutAccount(env, account, { now }));
    return readiness.get(key).status === "ready" ? account.stripe_account_id : null;
  }
  if (row.legacy_referrer_id) {
    // Legacy referrers are paid only if their stored account passes the same
    // readiness and Japan checks as a partner's own.
    const referrer = await env.DB.prepare("SELECT stripe_account_id FROM referrers WHERE id=?").bind(row.legacy_referrer_id).first();
    if (!referrer?.stripe_account_id) return null;
    return await legacyReadiness(env, referrer.stripe_account_id, readiness) ? referrer.stripe_account_id : null;
  }
  return null;
}

/** A transfer an earlier attempt made for this row, found by destination and metadata. */
async function findTransfer(env, row, destination, get) {
  const secret = stripeKey(env);
  let after = "";
  for (let page = 0; page < 5; page++) {
    const params = new URLSearchParams({ destination, limit: "100", "created[gte]": String(Math.floor(Number(row.created_at) / 1000) - 3600) });
    if (after) params.set("starting_after", after);
    const list = await get(secret, `/v1/transfers?${params}`);
    if (!list.ok) return { error: true };
    const found = (list.data?.data || []).find((t) => t?.metadata?.ledger_id === String(row.id));
    if (found) return { transfer: found };
    if (!list.data?.has_more) return { transfer: null };
    after = list.data.data.at(-1)?.id;
    if (!after) return { error: true };
  }
  return { error: true }; // too many to be sure
}

/** Partner rows whose transfer exceeds what they keep and is not yet recovered. */
async function debtsFor(env, row) {
  const { results = [] } = await env.DB.prepare(`SELECT c.id, c.transferred_yen, c.withheld_yen, c.kept_yen,
      (SELECT COALESCE(SUM(amount_yen),0) FROM referral_payouts r WHERE r.parent_id=c.id AND r.kind='reversal' AND r.status IN ('sent','pending','processing')) AS reversing,
      (SELECT COALESCE(SUM(amount_yen),0) FROM referral_payouts o WHERE o.parent_id=c.id AND o.kind='offset') AS offset
      FROM referral_payouts c WHERE c.kind='commission' AND c.status IN ('sent','reversed') AND c.id<>?
        AND ((? IS NOT NULL AND c.partner_account_id=?) OR (? IS NOT NULL AND c.legacy_referrer_id=?)) ORDER BY c.id LIMIT 50`)
    .bind(row.id, row.partner_account_id, row.partner_account_id, row.legacy_referrer_id, row.legacy_referrer_id).all();
  // Credited = transferred plus what this row withheld for older debts.
  return results.map((d) => ({ id: d.id, owed: Number(d.transferred_yen) + Number(d.withheld_yen) - Number(d.kept_yen ?? (Number(d.transferred_yen) + Number(d.withheld_yen))) - Number(d.reversing) - Number(d.offset) }))
    .filter((d) => d.owed > 0);
}

/**
 * Freeze what this row will transfer, reserving any unrecovered debts of the
 * same partner as offsets (one offset row per payer/debtor pair, so a retry
 * or a concurrent run cannot reserve the same debt twice).
 */
async function freezeTransfer(env, row, now) {
  let withheld = 0;
  const kept = Number(row.kept_yen || 0);
  for (const debt of await debtsFor(env, row)) {
    const take = Math.min(kept - withheld, debt.owed);
    if (take <= 0) break;
    const ins = await env.DB.prepare(`INSERT OR IGNORE INTO referral_payouts (kind, source_key, parent_id, payer_id, invoice_id, partner_account_id, legacy_referrer_id, amount_yen, status, created_at, updated_at)
        SELECT 'offset', ?, id, ?, invoice_id, partner_account_id, legacy_referrer_id, ?, 'pending', ?, ? FROM referral_payouts WHERE id=?`)
      .bind(`offset:${row.id}:${debt.id}:${row.key_rev}`, row.id, take, now, now, debt.id).run();
    if (Number(ins.meta?.changes || 0) !== 1) continue;
    // A concurrent payer may have reserved the same debt: give ours back.
    const debtor = await loadRow(env, debt.id);
    const reserved = await childSum(env, debt.id, "offset", ["pending", "applied"]) + await childSum(env, debt.id, "reversal", ["sent", "pending", "processing"]);
    const credited = Number(debtor.transferred_yen) + Number(debtor.withheld_yen);
    if (reserved > credited - Number(debtor.kept_yen ?? credited)) {
      await env.DB.prepare("DELETE FROM referral_payouts WHERE source_key=? AND status='pending'").bind(`offset:${row.id}:${debt.id}:${row.key_rev}`).run();
      continue;
    }
    withheld += take;
  }
  await env.DB.prepare("UPDATE referral_payouts SET transfer_amount_yen=?, withheld_yen=?, updated_at=? WHERE id=? AND transfer_amount_yen IS NULL")
    .bind(kept - withheld, withheld, now, row.id).run();
  return loadRow(env, row.id);
}

async function markSent(env, row, { transferId, amount, destination, now }) {
  await env.DB.prepare(`UPDATE referral_payouts SET status='sent', transfer_id=?, destination=?, transferred_yen=?, sent_at=?, http_failed=0,
      last_error=NULL, updated_at=? WHERE id=?`).bind(transferId, destination, amount, now, now, row.id).run();
  // The reserved offsets were withheld from this very transfer: now recovered.
  await env.DB.prepare("UPDATE referral_payouts SET status='applied', updated_at=? WHERE kind='offset' AND payer_id=? AND status='pending'").bind(now, row.id).run();
}

async function failAttempt(env, row, result, now) {
  const http = ambiguous(result) ? 0 : 1;
  await env.DB.prepare("UPDATE referral_payouts SET status='failed', http_failed=?, last_error=?, updated_at=? WHERE id=?").bind(http, errorText(result), now, row.id).run();
  console.error("referral_transfer_failed", JSON.stringify({ ledger: row.id, invoice: row.invoice_id, error: errorText(result) }));
  return { status: "failed" };
}

/**
 * Pay one commission row, at most once; for a row already sent, reconcile it
 * with the charge (refunds, lost disputes). Never without source_transaction.
 */
export async function payCommission(env, id, { now = Date.now(), get = stripeGet, readiness = new Map(), sync = false } = {}) {
  let row = await loadRow(env, id);
  if (!row || row.kind !== "commission") return { status: "missing" };
  if (row.status === "sent" || row.status === "reversed") return reconcileCommission(env, row, { now, get });
  const stale = row.status === "sending" && now - Number(row.updated_at || 0) > STALE_CLAIM_MS;
  if (!["held", "failed"].includes(row.status) && !stale) return { status: row.status };
  if (!stripeKey(env)) return { status: row.status, reason: "stripe_not_configured" };
  // Stripe replays a cached error for the same key for 24 h: wait it out.
  if (row.status === "failed" && row.http_failed && now - Number(row.last_attempt_at || 0) < IDEMPOTENCY_WINDOW_MS) {
    await env.DB.prepare("UPDATE referral_payouts SET checked_at=? WHERE id=?").bind(now, row.id).run();
    return { status: "failed", reason: "backoff" };
  }
  const destination = await destinationFor(env, row, { now, readiness });
  if (!destination) {
    // Keep what the Partner page shows current (refunds included); the
    // amount is read again from the charge when it is actually paid.
    if (row.transfer_amount_yen == null && (sync || now - Number(row.checked_at || 0) > HOUR_MS)) await syncCommission(env, row, { get, now });
    else await env.DB.prepare("UPDATE referral_payouts SET checked_at=? WHERE id=?").bind(now, row.id).run();
    return { status: row.status, reason: "account_not_ready" };
  }
  const claim = await env.DB.prepare("UPDATE referral_payouts SET status='sending', updated_at=? WHERE id=? AND status=? AND updated_at=?")
    .bind(now, row.id, row.status, row.updated_at).run();
  if (Number(claim.meta?.changes || 0) !== 1) return { status: "busy" };
  const release = async (reason) => {
    await env.DB.prepare("UPDATE referral_payouts SET status=?, checked_at=?, updated_at=? WHERE id=? AND status='sending'")
      .bind(row.attempts > 0 ? "failed" : "held", now, now, row.id).run();
    return { status: row.attempts > 0 ? "failed" : "held", reason };
  };
  // Any earlier attempt may have created a transfer whose answer was lost.
  if (Number(row.attempts) > 0) {
    const found = await findTransfer(env, row, destination, get);
    if (found.error) return release("transfer_lookup_failed");
    if (found.transfer) {
      await markSent(env, row, { transferId: found.transfer.id, amount: Number(found.transfer.amount) || 0, destination, now });
      return reconcileCommission(env, await loadRow(env, row.id), { now, get });
    }
    // Confirmed: nothing was transferred. After an HTTP error (cached by
    // Stripe under this key), start a new key revision and re-freeze.
    if (row.http_failed) {
      if (Number(row.key_rev) + 1 > MAX_KEY_REVISIONS) {
        await env.DB.prepare("UPDATE referral_payouts SET status='dead', updated_at=? WHERE id=?").bind(now, row.id).run();
        // Its reserved offsets never happened: the debts are still owed.
        await env.DB.prepare("DELETE FROM referral_payouts WHERE kind='offset' AND payer_id=? AND status='pending'").bind(row.id).run();
        deadLog(row, row.last_error);
        return { status: "dead" };
      }
      await env.DB.prepare("DELETE FROM referral_payouts WHERE kind='offset' AND payer_id=? AND status='pending'").bind(row.id).run();
      await env.DB.prepare("UPDATE referral_payouts SET key_rev=key_rev+1, transfer_amount_yen=NULL, withheld_yen=0, http_failed=0 WHERE id=?").bind(row.id).run();
      row = await loadRow(env, row.id);
    }
  }
  if (row.transfer_amount_yen == null) {
    // Amounts come from the charge as it is now (refunds, disputes included).
    const blocked = await syncCommission(env, row, { get, now });
    row = await loadRow(env, row.id);
    if (blocked) return release(blocked);
    if (Number(row.amount_yen) <= 0) {
      await env.DB.prepare("UPDATE referral_payouts SET status='void', updated_at=? WHERE id=?").bind(now, row.id).run();
      return { status: "void" };
    }
    if (Number(row.kept_yen) <= 0) {
      await env.DB.prepare("UPDATE referral_payouts SET status='reversed', updated_at=? WHERE id=?").bind(now, row.id).run();
      return { status: "reversed" };
    }
    row = await freezeTransfer(env, row, now);
  }
  if (!row.charge_id) return release("charge_unresolved"); // never without source_transaction
  const amount = Number(row.transfer_amount_yen);
  await env.DB.prepare("UPDATE referral_payouts SET attempts=attempts+1, last_attempt_at=? WHERE id=?").bind(now, row.id).run();
  if (amount <= 0) {
    await markSent(env, row, { transferId: null, amount: 0, destination, now });
    return reconcileCommission(env, await loadRow(env, row.id), { now, get });
  }
  // No transfer_group: with source_transaction Stripe uses the charge's group.
  const form = new URLSearchParams({
    amount: String(amount), currency: "jpy", destination, source_transaction: row.charge_id,
    "metadata[ledger_id]": String(row.id), "metadata[invoice_id]": row.invoice_id, "metadata[site_id]": String(row.site_id || ""),
  });
  const sent = await stripePost(stripeKey(env), "/v1/transfers", form, { idempotencyKey: `nurevo-referral-ledger-${row.id}-k${row.key_rev}` });
  if (!sent.ok || !sent.data?.id) return failAttempt(env, await loadRow(env, row.id), sent, now);
  await markSent(env, row, { transferId: sent.data.id, amount: Number(sent.data.amount) || amount, destination, now });
  // A refund may have arrived while the transfer was in flight.
  return reconcileCommission(env, await loadRow(env, row.id), { now, get });
}

/* ---------------- refunds, disputes: reconcile a sent row ---------------- */

async function childSum(env, id, kind, statuses) {
  const marks = statuses.map(() => "?").join(",");
  const r = await env.DB.prepare(`SELECT COALESCE(SUM(amount_yen),0) AS n FROM referral_payouts WHERE parent_id=? AND kind=? AND status IN (${marks})`).bind(id, kind, ...statuses).first();
  return Number(r?.n || 0);
}

/**
 * A sent row: re-read the charge and pull back what the partner should no
 * longer keep. A reversal Stripe refuses (the balance was already paid out)
 * becomes a debt that the partner's next transfer withholds.
 */
export async function reconcileCommission(env, row, { now = Date.now(), get = stripeGet, sync = true } = {}) {
  if (!row || row.kind !== "commission" || !["sent", "reversed"].includes(row.status)) return { status: row?.status };
  if (sync && row.charge_id && stripeKey(env)) {
    const state = await chargeState(stripeKey(env), row.charge_id, get);
    if (state.ok) {
      await env.DB.prepare("UPDATE referral_payouts SET kept_yen=?, charge_refunded=?, dispute_lost=?, checked_at=?, updated_at=? WHERE id=?")
        .bind(keptYen(Number(row.amount_yen), state), state.refunded, state.disputeLost ? 1 : 0, now, now, row.id).run();
    } else {
      await env.DB.prepare("UPDATE referral_payouts SET checked_at=? WHERE id=?").bind(now, row.id).run();
    }
    row = await loadRow(env, row.id);
  }
  const transferred = Number(row.transferred_yen || 0);
  const credited = transferred + Number(row.withheld_yen || 0);
  const kept = Number(row.kept_yen ?? row.amount_yen);
  const reversing = await childSum(env, row.id, "reversal", ["sent", "pending", "processing"]);
  const settled = reversing + await childSum(env, row.id, "offset", ["pending", "applied"]);
  const owed = credited - kept - settled;
  if (owed <= 0) return { status: row.status };
  // Only what reached this transfer can be pulled back from it; the rest is
  // a debt the partner's next transfer withholds.
  const need = Math.min(owed, transferred - reversing);
  if (!row.transfer_id || need <= 0) return { status: row.status, owed };
  const target = settled + need;
  const key = `reversal:${row.id}:${target}`;
  const ins = await env.DB.prepare(`INSERT OR IGNORE INTO referral_payouts (kind, source_key, parent_id, invoice_id, charge_id, partner_account_id, legacy_referrer_id, site_id, amount_yen, status, created_at, updated_at)
      VALUES ('reversal', ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`)
    .bind(key, row.id, row.invoice_id, row.charge_id, row.partner_account_id, row.legacy_referrer_id, row.site_id, need, now, now).run();
  if (Number(ins.meta?.changes || 0) !== 1) return { status: row.status, owed: need }; // refused before: offsets recover it
  // A concurrent reconcile or offset reservation may have claimed the same
  // debt meanwhile: re-sum against the row's latest state and give ours back
  // if the total would pull back more than the partner owes.
  const latest = await loadRow(env, row.id);
  const latestCredited = Number(latest.transferred_yen || 0) + Number(latest.withheld_yen || 0);
  const claimed = await childSum(env, row.id, "reversal", ["sent", "pending", "processing"]) + await childSum(env, row.id, "offset", ["pending", "applied"]);
  if (claimed > latestCredited - Number(latest.kept_yen ?? latest.amount_yen)) {
    await env.DB.prepare("DELETE FROM referral_payouts WHERE source_key=? AND status='pending'").bind(key).run();
    return { status: row.status, reason: "busy" };
  }
  const reversal = await env.DB.prepare("SELECT * FROM referral_payouts WHERE source_key=?").bind(key).first();
  return settleReversal(env, reversal.id, { now, get });
}

/** Attempt (or retry, for an unanswered attempt) one transfer reversal. */
export async function settleReversal(env, id, { now = Date.now(), get = stripeGet } = {}) {
  let row = await loadRow(env, id);
  if (!row || row.kind !== "reversal") return { status: "missing" };
  const stale = row.status === "processing" && now - Number(row.updated_at || 0) > STALE_CLAIM_MS;
  if (row.status !== "pending" && !stale) return { status: row.status };
  const parent = await loadRow(env, row.parent_id);
  const secret = stripeKey(env);
  if (!secret || !parent?.transfer_id) return { status: row.status };
  const claim = await env.DB.prepare("UPDATE referral_payouts SET status='processing', updated_at=? WHERE id=? AND status=? AND updated_at=?")
    .bind(now, row.id, row.status, row.updated_at).run();
  if (Number(claim.meta?.changes || 0) !== 1) return { status: "busy" };
  // Past Stripe's idempotency window, look for a reversal an unanswered
  // attempt made before trying again.
  if (row.attempts > 0 && now - Number(row.last_attempt_at || 0) >= IDEMPOTENCY_WINDOW_MS) {
    const list = await get(secret, `/v1/transfers/${encodeURIComponent(parent.transfer_id)}/reversals?limit=100`);
    if (!list.ok) {
      await env.DB.prepare("UPDATE referral_payouts SET status='pending', updated_at=? WHERE id=?").bind(now, row.id).run();
      return { status: "pending" };
    }
    const found = (list.data?.data || []).find((r) => r?.metadata?.ledger_id === String(row.id));
    if (found) {
      await env.DB.prepare("UPDATE referral_payouts SET status='sent', reversal_id=?, updated_at=? WHERE id=?").bind(found.id, now, row.id).run();
      return { status: "sent", reversal_id: found.id };
    }
    await env.DB.prepare("UPDATE referral_payouts SET status='failed', last_error='no_answer', updated_at=? WHERE id=?").bind(now, row.id).run();
    return { status: "failed" };
  }
  await env.DB.prepare("UPDATE referral_payouts SET attempts=attempts+1, last_attempt_at=COALESCE(last_attempt_at, ?) WHERE id=?").bind(now, row.id).run();
  const form = new URLSearchParams({ amount: String(row.amount_yen), "metadata[ledger_id]": String(row.id), "metadata[charge_id]": String(row.charge_id || "") });
  const reversed = await stripePost(secret, `/v1/transfers/${encodeURIComponent(parent.transfer_id)}/reversals`, form, { idempotencyKey: `nurevo-reversal-ledger-${row.id}` });
  if (reversed.ok && reversed.data?.id) {
    await env.DB.prepare("UPDATE referral_payouts SET status='sent', reversal_id=?, last_error=NULL, updated_at=? WHERE id=?").bind(reversed.data.id, now, row.id).run();
    return { status: "sent", reversal_id: reversed.data.id };
  }
  // Unanswered: retried hourly under the same key. Refused (typically the
  // balance was already paid out on the 25th): a debt for the next transfer.
  const next = ambiguous(reversed) ? "pending" : "failed";
  await env.DB.prepare("UPDATE referral_payouts SET status=?, last_error=?, updated_at=? WHERE id=?").bind(next, errorText(reversed), now, row.id).run();
  if (next === "failed") console.error("referral_reversal_refused", JSON.stringify({ ledger: row.id, error: errorText(reversed) }));
  return { status: next };
}

/**
 * charge.refunded / charge.dispute.* (verified webhook only): re-read the
 * charge and settle the row. A refund that arrives before the commission row
 * needs nothing here: the row is created from the charge's current state.
 */
export async function recordChargeEvent(env, { chargeId, now = Date.now(), get = stripeGet } = {}) {
  if (!chargeId) return { skipped: "no_charge" };
  let row;
  try {
    row = await env.DB.prepare("SELECT id FROM referral_payouts WHERE kind='commission' AND charge_id=?").bind(chargeId).first();
  } catch (error) {
    // No ledger yet (0039 unapplied) means no commission to reverse.
    if (/no such table/i.test(String(error?.message || error))) return { skipped: "ledger_unavailable" };
    throw error;
  }
  if (!row) return { skipped: "no_commission" };
  return payCommission(env, row.id, { now, get, sync: true });
}
export const recordChargeRefund = (env, { charge, ...rest } = {}) => recordChargeEvent(env, { chargeId: charge?.id, ...rest });

/* ---------------- the hourly job, onboarding return, account.updated ---------------- */

export async function releaseHeldPayouts(env, { partnerAccountId = null, limit = 25, now = Date.now(), get = stripeGet } = {}) {
  const result = { checked: 0, sent: 0, held: 0, failed: 0, reversals: 0, reconciled: 0, dead: 0 };
  if (!stripeKey(env)) return { ...result, skipped: "stripe_not_configured" };
  const staleBefore = now - STALE_CLAIM_MS;
  const filter = partnerAccountId == null ? "" : " AND r.partner_account_id=?";
  const binds = partnerAccountId == null ? [] : [partnerAccountId];
  const { results: reversals = [] } = await env.DB.prepare(`SELECT r.id FROM referral_payouts r WHERE r.kind='reversal'
      AND (r.status='pending' OR (r.status='processing' AND r.updated_at<?))${filter} ORDER BY IFNULL(r.updated_at,0) LIMIT ?`)
    .bind(staleBefore, ...binds, limit).all();
  for (const r of reversals) { await settleReversal(env, r.id, { now, get }); result.reversals++; }
  // Oldest-checked first, and only partners who can (or may now) receive
  // transfers, so permanently held rows cannot starve the rest.
  const { results: rows = [] } = await env.DB.prepare(`SELECT r.id FROM referral_payouts r LEFT JOIN accounts a ON a.id=r.partner_account_id
      WHERE r.kind='commission' AND (r.status IN ('held','failed') OR (r.status='sending' AND r.updated_at<?))
        AND (r.legacy_referrer_id IS NOT NULL OR a.payout_status='ready' OR a.payout_checked_at IS NULL OR a.payout_checked_at<?)
        AND (a.id IS NULL OR a.stripe_account_id IS NOT NULL)${filter}
      ORDER BY IFNULL(r.checked_at,0), r.id LIMIT ?`)
    .bind(staleBefore, now - 6 * HOUR_MS, ...binds, limit).all();
  const readiness = new Map();
  for (const r of rows) {
    result.checked++;
    const outcome = await payCommission(env, r.id, { now, get, readiness });
    if (outcome.status === "sent") result.sent++;
    else if (outcome.status === "failed") result.failed++;
    else if (outcome.status === "dead") result.dead++;
    else result.held++;
  }
  return result;
}

/** Hourly job. Also re-reads recent sent rows so a lost refund/dispute event is still reversed. */
export async function runPartnerPayouts(env, { now = Date.now(), get = stripeGet } = {}) {
  try {
    const result = await releaseHeldPayouts(env, { now, get });
    if (result.skipped) return result;
    const { results: sent = [] } = await env.DB.prepare(`SELECT * FROM referral_payouts WHERE kind='commission' AND status IN ('sent','reversed')
        AND sent_at>? ORDER BY IFNULL(checked_at,0), id LIMIT 10`).bind(now - RECONCILE_DAYS * DAY_MS).all();
    for (const row of sent) { await reconcileCommission(env, row, { now, get }); result.reconciled++; }
    const dead = await env.DB.prepare("SELECT COUNT(*) AS n FROM referral_payouts WHERE kind='commission' AND (status='dead' OR (status='held' AND last_error='multiple_charges'))").first();
    result.dead_total = Number(dead?.n || 0);
    if (result.dead_total) console.error("referral_payout_dead_rows", JSON.stringify({ count: result.dead_total }));
    return result;
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
  const state = await refreshPayoutAccount(env, account, { stripeAccount, now, fixSchedule: true });
  if (state.status !== "ready") return { status: state.status };
  return { status: state.status, ...(await releaseHeldPayouts(env, { partnerAccountId: account.id, limit: 10, now })) };
}

/* ---------------- partner page totals ---------------- */

const JST_MS = 9 * HOUR_MS;
function anchorDayUtcMs(year, month, anchor) {
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Date.UTC(year, month, Math.min(anchor, last)) - JST_MS; // 00:00 JST on the payout day
}
/** The next monthly payout day (00:00 JST) and the one before it. */
export function payoutWindow(now, anchor) {
  const jst = new Date(now + JST_MS);
  let y = jst.getUTCFullYear(), m = jst.getUTCMonth();
  let next = anchorDayUtcMs(y, m, anchor);
  const thisMonth = now < next + DAY_MS;
  if (!thisMonth) { m += 1; if (m > 11) { m = 0; y += 1; } next = anchorDayUtcMs(y, m, anchor); }
  const pm = m === 0 ? 11 : m - 1, py = m === 0 ? y - 1 : y;
  return { next, previous: anchorDayUtcMs(py, pm, anchor), nextIsThisMonth: thisMonth };
}

export async function partnerLedgerTotals(env, accountId, { now = Date.now(), anchor = DEFAULT_PAYOUT_ANCHOR } = {}) {
  const { results: rows = [] } = await env.DB.prepare(`SELECT id, kind, status, parent_id, amount_yen, kept_yen, transferred_yen,
      available_at, sent_at, last_error FROM referral_payouts WHERE partner_account_id=?`).bind(accountId).all();
  const window = payoutWindow(now, anchor);
  const pulled = new Map();
  for (const r of rows) if (r.kind === "reversal" && r.status === "sent") pulled.set(r.parent_id, (pulled.get(r.parent_id) || 0) + Number(r.amount_yen));
  const totals = { earned: 0, paid: 0, held: 0, next: 0, later: 0, attention: 0 };
  for (const r of rows) {
    if (r.kind !== "commission" || r.status === "void") continue;
    const kept = Number(r.kept_yen ?? r.amount_yen ?? 0);
    totals.earned += kept;
    if (r.status === "dead" || (r.status === "held" && r.last_error === "multiple_charges")) totals.attention++;
    if (["held", "failed", "sending", "dead"].includes(r.status)) { totals.held += kept; totals.later += kept; continue; }
    const net = Number(r.transferred_yen || 0) - (pulled.get(r.id) || 0);
    totals.paid += net;
    const effective = Math.max(Number(r.available_at || 0), Number(r.sent_at || 0));
    if (effective > window.next) totals.later += net;
    else if (effective > window.previous) totals.next += net;
  }
  return { ...totals, window };
}
