import { REFERRAL_SHARE, referralCommissionYen, payoutAnchor, refreshPayoutAccount, partnerLedgerTotals, wiseDue } from "./partner-payouts.mjs";
// Account identities are per member, independent of organization-level access.
export async function ensureAccount(env, memberId) {
  await env.DB.prepare(`INSERT INTO accounts(member_id,email,created_at)
    SELECT id,email,COALESCE(created_at,0) FROM members WHERE id=?
    ON CONFLICT(member_id) DO NOTHING`).bind(memberId).run();
  const account = await env.DB.prepare('SELECT * FROM accounts WHERE member_id=?').bind(memberId).first();
  if (!account) throw new Error('account_unavailable');
  return account;
}
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function newReferralCode() {
  // Rejection sampling avoids modulo bias; 12 characters provide >58 bits.
  let code = '';
  const cutoff = 256 - 256 % ALPHABET.length;
  while (code.length < 12) {
    for (const byte of crypto.getRandomValues(new Uint8Array(24))) {
      if (byte < cutoff) code += ALPHABET[byte % ALPHABET.length];
      if (code.length === 12) break;
    }
  }
  return code;
}
/**
 * Partner approval (migration 0040). Only an approved account can issue a
 * referral code, set up a payout account, attribute signups or earn
 * commission. none -> approved: applying approves at once (recorded with
 * partner_reviewed_by='system:auto') and issues the referral code. A super
 * admin can still revoke (approved -> rejected). A rejected (or revoked)
 * account that applies again goes to pending and waits for a super admin, so a
 * revoke cannot be undone by the member. Accounts already pending (0040
 * backfill, or applied before auto-approval) stay for a super admin to approve.
 */
export const PARTNER_STATUSES = Object.freeze(["none", "pending", "approved", "rejected"]);
export function partnerStatus(account) {
  const status = String(account?.partner_status || "none");
  return PARTNER_STATUSES.includes(status) ? status : "none";
}
export const isApprovedPartner = (account) => partnerStatus(account) === "approved" && Number(account?.partner_approved_at) > 0;
export class PartnerNotApprovedError extends Error {
  constructor() { super("partner_not_approved"); this.code = "partner_not_approved"; }
}
export const AUTO_REVIEWER = "system:auto";
export async function applyForPartner(env, account, { now = Date.now() } = {}) {
  // Auto-approval: none -> approved at once, the same effect as an admin's
  // approve (approved_at = now: only customers referred from now on earn).
  await env.DB.prepare(`UPDATE accounts SET partner_status='approved', partner_applied_at=?, partner_approved_at=?,
      partner_reviewed_at=?, partner_reviewed_by=? WHERE id=? AND partner_status='none'`)
    .bind(now, now, now, AUTO_REVIEWER, account.id).run();
  // A rejected / revoked account waits for a super admin again.
  await env.DB.prepare("UPDATE accounts SET partner_status='pending', partner_applied_at=?, partner_reviewed_at=NULL, partner_reviewed_by=NULL WHERE id=? AND partner_status='rejected'")
    .bind(now, account.id).run();
  let row = await env.DB.prepare("SELECT * FROM accounts WHERE id=?").bind(account.id).first();
  let referralCode = row?.referral_code || null;
  if (isApprovedPartner(row)) {
    try { referralCode = await issueReferralCode(env, row); } catch (error) {
      // The approval stands; the member can still press 発行 on the Partner page.
      console.error("partner_auto_code_failed", JSON.stringify({ account: account.id, message: String(error?.message || error).slice(0, 120) }));
    }
  }
  return { status: partnerStatus(row), applied_at: row?.partner_applied_at ?? null, approved_at: isApprovedPartner(row) ? Number(row.partner_approved_at) : null,
    referral_code: isApprovedPartner(row) ? referralCode : null };
}
/**
 * Approve or reject a pending application (super admin only; the route checks
 * that). Conditional on 'pending', so a double click or two admins cannot
 * approve twice or flip a decision already made.
 */
export async function reviewPartner(env, accountId, decision, reviewerMemberId, { now = Date.now() } = {}) {
  if (!["approve", "reject", "revoke"].includes(decision)) return { status: 400, body: { error: "invalid_decision" } };
  const id = Number(accountId);
  if (!Number.isInteger(id) || id <= 0) return { status: 404, body: { error: "not_found" } };
  // revoke: approved -> rejected. From then on no new code use, no new
  // commission and held rows stay held (destinationFor); the member may apply again.
  const result = decision === "approve"
    ? await env.DB.prepare("UPDATE accounts SET partner_status='approved', partner_approved_at=?, partner_reviewed_at=?, partner_reviewed_by=? WHERE id=? AND partner_status='pending'")
      .bind(now, now, reviewerMemberId, id).run()
    : await env.DB.prepare(`UPDATE accounts SET partner_status='rejected', partner_reviewed_at=?, partner_reviewed_by=? WHERE id=? AND partner_status='${decision === "revoke" ? "approved" : "pending"}'`)
      .bind(now, reviewerMemberId, id).run();
  const row = await env.DB.prepare("SELECT id, email, partner_status, partner_approved_at FROM accounts WHERE id=?").bind(id).first();
  if (!row) return { status: 404, body: { error: "not_found" } };
  if (Number(result.meta?.changes || 0) !== 1) return { status: 409, body: { error: decision === "revoke" ? "not_approved" : "not_pending", partner_status: partnerStatus(row) } };
  return { status: 200, body: { ok: true, id: row.id, partner_status: partnerStatus(row), approved_at: row.partner_approved_at ?? null } };
}
export async function listPartnerApplications(env, { now = Date.now() } = {}) {
  const { results: pending = [] } = await env.DB.prepare(`SELECT id, email, referral_code, partner_status, partner_applied_at, created_at FROM accounts
    WHERE partner_status='pending' ORDER BY partner_applied_at, id LIMIT 200`).all();
  const approvedSql = (extra) => `SELECT a.id, a.email, a.referral_code, a.partner_status, a.partner_approved_at, a.partner_reviewed_by,
      a.stripe_account_id, a.payout_status${extra},
      (SELECT COUNT(*) FROM accounts c WHERE c.referred_by_account_id=a.id AND c.created_at>=a.partner_approved_at) AS referrals
    FROM accounts a WHERE a.partner_status='approved' ORDER BY a.partner_approved_at DESC, a.id DESC LIMIT 200`;
  let approved, wiseAvailable = true;
  try {
    ({ results: approved = [] } = await env.DB.prepare(approvedSql(", a.payout_method, a.wise_account_name, a.wise_email, a.wise_currency, a.wise_country, a.wise_updated_at")).all());
  } catch (error) {
    // Deployed before 0050 (or 0039): no Wise columns; everyone is on Stripe.
    if (!/no such column/i.test(String(error?.message || error))) throw error;
    wiseAvailable = false;
    try { ({ results: approved = [] } = await env.DB.prepare(approvedSql("")).all()); } catch (inner) {
      if (!/no such column/i.test(String(inner?.message || inner))) throw inner;
      ({ results: approved = [] } = await env.DB.prepare(approvedSql("").replace("a.stripe_account_id, a.payout_status", "NULL AS stripe_account_id, NULL AS payout_status")).all());
    }
  }
  const anchor = payoutAnchor(env);
  const view = (r) => ({ account_id: r.id, email: r.email, has_referral_code: !!r.referral_code, partner_status: partnerStatus(r),
    applied_at: r.partner_applied_at ?? null, approved_at: r.partner_approved_at ?? null, ...(r.referrals != null ? { referrals: Number(r.referrals) } : {}) });
  const approvedView = [];
  for (const r of approved) {
    const method = payoutMethod(r);
    const item = { ...view(r), auto_approved: r.partner_reviewed_by === AUTO_REVIEWER, payout_method: method,
      stripe_payout_status: r.stripe_account_id ? (r.payout_status || "in_progress") : "not_started", wise: null };
    if (method === "wise") {
      let due = null;
      try { due = await wiseDue(env, r.id, { now, anchor }); } catch (error) {
        console.error("partner_wise_due_unavailable", JSON.stringify({ account: r.id, message: String(error?.message || error).slice(0, 120) }));
      }
      // The admin sends the money by hand, so the full address is shown here (super admins only).
      item.wise = { account_name: r.wise_account_name || null, email: r.wise_email || null, currency: r.wise_currency || null,
        country: r.wise_country || null, updated_at: r.wise_updated_at ?? null,
        due_yen: due ? due.due_yen : null, gross_yen: due ? due.gross_yen : null, debt_yen: due ? due.debt_yen : null,
        later_yen: due ? due.later_yen : null, due_rows: due ? due.rows.length : null, unconfirmed_rows: due ? due.unconfirmed : null,
        payout_at: due ? due.payout_at : null };
    }
    approvedView.push(item);
  }
  return { pending: pending.map(view), approved: approvedView, wise_available: wiseAvailable, payout_day: anchor };
}

/* ---------------- payout method: Stripe (Japan) or Wise (overseas), 0050 ---------------- */

export const PAYOUT_METHODS = Object.freeze(["stripe", "wise"]);
export const payoutMethod = (account) => account?.payout_method === "wise" ? "wise" : "stripe";
/** Currencies a partner may ask to receive through Wise. Commission is always computed in JPY. */
export const WISE_CURRENCIES = Object.freeze(["USD", "EUR", "GBP", "AUD", "CAD", "NZD", "SGD", "HKD", "INR", "JPY", "CHF", "SEK", "NOK", "DKK", "PLN", "KRW", "PHP", "THB", "MYR", "IDR", "BRL", "MXN"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Control characters and markup never belong in a name.
const BAD_NAME = /[\u0000-\u001f\u007f<>]/;

export function validateWiseDetails(body) {
  const errors = {};
  const name = String(body?.account_name ?? "").trim().replace(/\s+/g, " ");
  const email = String(body?.email ?? "").trim().toLowerCase();
  const currency = String(body?.currency ?? "").trim().toUpperCase();
  const country = String(body?.country ?? "").trim().toUpperCase();
  if (!name || name.length > 100 || BAD_NAME.test(name)) errors.account_name = "invalid";
  if (email.length > 254 || !EMAIL_RE.test(email)) errors.email = "invalid";
  if (!WISE_CURRENCIES.includes(currency)) errors.currency = "unsupported";
  if (!/^[A-Z]{2}$/.test(country)) errors.country = "invalid";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { account_name: name, email, currency, country } };
}

const columnMissing = (error) => /no such column/i.test(String(error?.message || error));
const WISE_UNAVAILABLE = { status: 503, body: { error: "wise_unavailable", reason: "migration_pending" } };

/** Save the partner's own Wise details and switch it to Wise. Approved partners only. */
export async function saveWiseDetails(env, account, body, { now = Date.now() } = {}) {
  if (!isApprovedPartner(account)) return { status: 403, body: { error: "partner_not_approved" } };
  const checked = validateWiseDetails(body);
  if (!checked.ok) return { status: 400, body: { error: "invalid_wise_details", fields: checked.errors } };
  const v = checked.value;
  try {
    await env.DB.prepare(`UPDATE accounts SET payout_method='wise', wise_account_name=?, wise_email=?, wise_currency=?, wise_country=?, wise_updated_at=? WHERE id=?`)
      .bind(v.account_name, v.email, v.currency, v.country, now, account.id).run();
  } catch (error) {
    if (columnMissing(error)) return WISE_UNAVAILABLE;
    throw error;
  }
  console.log("partner_wise_saved", JSON.stringify({ account: account.id, currency: v.currency, country: v.country }));
  const row = await env.DB.prepare("SELECT * FROM accounts WHERE id=?").bind(account.id).first();
  return { status: 200, body: { ok: true, method: "wise", wise: wiseView(row) } };
}

/** Switch between Stripe and Wise. Wise needs saved details first. */
export async function setPayoutMethod(env, account, method) {
  if (!isApprovedPartner(account)) return { status: 403, body: { error: "partner_not_approved" } };
  if (!PAYOUT_METHODS.includes(method)) return { status: 400, body: { error: "invalid_payout_method" } };
  if (!("payout_method" in (account || {}))) return WISE_UNAVAILABLE;
  if (method === "wise" && !account.wise_email) return { status: 409, body: { error: "wise_details_required" } };
  try {
    await env.DB.prepare("UPDATE accounts SET payout_method=? WHERE id=?").bind(method, account.id).run();
  } catch (error) {
    if (columnMissing(error)) return WISE_UNAVAILABLE;
    throw error;
  }
  console.log("partner_payout_method", JSON.stringify({ account: account.id, method }));
  return { status: 200, body: { ok: true, method } };
}

export function maskEmail(email) {
  const value = String(email || "");
  const at = value.lastIndexOf("@");
  if (at < 1) return value ? "***" : null;
  const local = value.slice(0, at);
  return `${local[0]}${"*".repeat(Math.max(2, Math.min(6, local.length - 1)))}@${value.slice(at + 1)}`;
}
/** What the partner's own page shows of its Wise details (the address masked). */
export function wiseView(account) {
  if (!account?.wise_email) return null;
  return { account_name: account.wise_account_name || null, email_masked: maskEmail(account.wise_email), currency: account.wise_currency || null,
    country: account.wise_country || null, updated_at: account.wise_updated_at ?? null };
}
export async function issueReferralCode(env, account, regenerate = false) {
  // A code exists only for an approved partner (an older code is kept but inactive).
  if (!isApprovedPartner(account)) throw new PartnerNotApprovedError();
  if (account.referral_code && !regenerate) return account.referral_code;
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = newReferralCode();
    if (code === account.referral_code) continue;
    if (await env.DB.prepare('SELECT id FROM accounts WHERE referral_code=?').bind(code).first()) continue;
    try {
      await env.DB.prepare(`UPDATE accounts SET referral_code=? WHERE id=?${regenerate ? '' : ' AND referral_code IS NULL'}`).bind(code, account.id).run();
      return (await env.DB.prepare('SELECT referral_code FROM accounts WHERE id=?').bind(account.id).first()).referral_code;
    } catch (error) {
      // Only retry an actual uniqueness collision, never swallow a DB outage.
      if (!await env.DB.prepare('SELECT id FROM accounts WHERE referral_code=?').bind(code).first()) throw error;
    }
  }
  throw new Error('referral_code_collision');
}
// Before Stripe fees: the real commission is 40% of the NET amount (after
// fees), so this is labelled as an estimate on the Partner page.
export const ESTIMATE_MONTHLY_YEN = Object.freeze({ standard: referralCommissionYen(3000, 'jpy'), pro: referralCommissionYen(14800, 'jpy') });
export function monthlyReferralPayout(sites) {
  // manual_plan, org grants, trials, grace periods and unpaid sites never qualify.
  const subscriptions = new Map();
  for (const s of sites) if (payingSite(s)) subscriptions.set(s.stripe_subscription_id, s.plan);
  let total = 0;
  for (const plan of subscriptions.values()) total += ESTIMATE_MONTHLY_YEN[plan];
  return total;
}
const payingSite = (s) => ['standard', 'pro'].includes(s.plan) && s.contract === 'active' && !!s.stripe_subscription_id;
/**
 * The referred customer that is (or, before any invoice, would most likely
 * be) the partner's first customer: the recorded one, else the earliest
 * eligible customer that already pays. Estimates leave it out.
 */
export function estimatedFirstCustomer(recordedFirst, eligibleAccounts, sites) {
  if (recordedFirst) return Number(recordedFirst);
  const paying = eligibleAccounts.filter((a) => sites.some((s) => s.owner_member_id === a.member_id && payingSite(s)))
    .sort((a, b) => Number(a.created_at) - Number(b.created_at) || Number(a.id) - Number(b.id));
  return paying[0]?.id ?? null;
}
export async function partnerSummary(env, account, { now = Date.now() } = {}) {
  const { results: accounts = [] } = await env.DB.prepare('SELECT id,member_id,email,created_at FROM accounts WHERE referred_by_account_id=? ORDER BY created_at DESC,id DESC').bind(account.id).all();
  const { results: sites = [] } = await env.DB.prepare(`SELECT s.id,s.url,s.created_at,s.plan,s.contract,s.stripe_subscription_id,s.owner_member_id,a.created_at AS account_registered_at
    FROM sites s JOIN accounts a ON a.member_id=s.owner_member_id WHERE a.referred_by_account_id=?`).bind(account.id).all();
  const anchor = payoutAnchor(env);
  let payoutAccount;
  try {
    payoutAccount = await refreshPayoutAccount(env, account, { now }); // read-only, cached
  } catch { payoutAccount = { status: 'unavailable', currently_due: 0, past_due: 0 }; }
  let totals = null;
  try {
    totals = await partnerLedgerTotals(env, account.id, { now, anchor });
  } catch (error) {
    console.error('partner_ledger_unavailable', JSON.stringify({ message: String(error?.message || error).slice(0, 120) }));
  }
  const status = partnerStatus(account);
  const approved = isApprovedPartner(account);
  const approvedAt = approved ? Number(account.partner_approved_at) : null;
  // Only customers referred after approval can ever earn; of those, the first
  // paying customer never does (recorded on its first paid invoice).
  const eligible = approved ? accounts.filter((a) => Number(a.created_at) >= approvedAt) : [];
  const recordedFirst = account.partner_first_customer_account_id ? Number(account.partner_first_customer_account_id) : null;
  const firstCustomer = approved ? estimatedFirstCustomer(recordedFirst, eligible, sites) : null;
  const earning = new Set(eligible.filter((a) => a.id !== firstCustomer).map((a) => a.member_id));
  return {
    referral_code: account.referral_code || null,
    referral_code_active: approved && !!account.referral_code,
    partner: { status, approved, applied_at: account.partner_applied_at ?? null, approved_at: approvedAt,
      first_customer_account_id: recordedFirst, first_customer_rule: 'first_referred_customer_earns_nothing' },
    payout: { currency: 'jpy', rate: REFERRAL_SHARE,
      standard_monthly_yen: ESTIMATE_MONTHLY_YEN.standard, pro_monthly_yen: ESTIMATE_MONTHLY_YEN.pro,
      monthly_estimate_yen: monthlyReferralPayout(sites.filter((s) => earning.has(s.owner_member_id))), estimate_basis: 'before_stripe_fees',
      estimate_excludes: 'first_customer_and_pre_approval_referrals',
      cumulative_earned_yen: totals ? totals.earned : null, cumulative_paid_yen: totals ? totals.paid : null,
      held_yen: totals ? totals.held : null, needs_attention: totals ? totals.attention : null,
      first_customer_invoices: totals ? totals.firstCustomer : null,
      next_payout_yen: totals ? totals.next : null, later_payout_yen: totals ? totals.later : null,
      next_payout_at: totals ? totals.window.next : null, next_payout_this_month: totals ? totals.window.nextIsThisMonth : null,
      payout_day: anchor, paid_status: totals ? 'ledger' : 'ledger_unavailable', basis: 'net_after_stripe_fees',
      onboarding_available: approved,
      // 0050: 'stripe' (Japan, Stripe Connect, automatic) or 'wise' (overseas,
      // sent by Nurevo by hand). wise_available is false before the migration.
      method: payoutMethod(account), wise_available: 'payout_method' in account, wise: wiseView(account),
      wise_currencies: WISE_CURRENCIES,
      account: { status: payoutAccount.status, currently_due: Number(payoutAccount.currently_due || 0) + Number(payoutAccount.past_due || 0),
        disabled_reason: payoutAccount.disabled_reason || null } },
    referrals: accounts.map(a => ({ account_id: a.id, email: a.email, registered_at: a.created_at,
      // first_customer: never earns (recorded, or the expected one before any invoice);
      // before_approval: referred before the partner was approved, never earns.
      commission: !approved ? 'not_approved' : Number(a.created_at) < approvedAt ? 'before_approval' : a.id === firstCustomer ? 'first_customer' : 'eligible',
      first_customer: approved && a.id === firstCustomer, first_customer_confirmed: approved && a.id === recordedFirst,
      sites: sites.filter(s => s.owner_member_id === a.member_id).map(s => ({ id: s.id, url: s.url, plan: s.plan, billing_status: s.contract, registered_at: s.created_at })) }))
  };
}
