import { REFERRAL_SHARE, referralCommissionYen, payoutAnchor, refreshPayoutAccount, partnerLedgerTotals } from "./partner-payouts.mjs";
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
 * Partner approval (migration 0040). Only an account Nurevo approved can issue
 * a referral code, set up a payout account, attribute signups or earn
 * commission. none -> pending (the member applies) -> approved | rejected (a
 * super admin decides); approved -> rejected (a super admin revokes); a
 * rejected account may apply again.
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
export async function applyForPartner(env, account, { now = Date.now() } = {}) {
  await env.DB.prepare("UPDATE accounts SET partner_status='pending', partner_applied_at=?, partner_reviewed_at=NULL, partner_reviewed_by=NULL WHERE id=? AND partner_status IN ('none','rejected')")
    .bind(now, account.id).run();
  const row = await env.DB.prepare("SELECT partner_status, partner_applied_at FROM accounts WHERE id=?").bind(account.id).first();
  return { status: partnerStatus(row), applied_at: row?.partner_applied_at ?? null };
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
export async function listPartnerApplications(env) {
  const { results: pending = [] } = await env.DB.prepare(`SELECT id, email, referral_code, partner_status, partner_applied_at, created_at FROM accounts
    WHERE partner_status='pending' ORDER BY partner_applied_at, id LIMIT 200`).all();
  const { results: approved = [] } = await env.DB.prepare(`SELECT a.id, a.email, a.referral_code, a.partner_status, a.partner_approved_at,
      (SELECT COUNT(*) FROM accounts c WHERE c.referred_by_account_id=a.id AND c.created_at>=a.partner_approved_at) AS referrals
    FROM accounts a WHERE a.partner_status='approved' ORDER BY a.partner_approved_at DESC, a.id DESC LIMIT 200`).all();
  const view = (r) => ({ account_id: r.id, email: r.email, has_referral_code: !!r.referral_code, partner_status: partnerStatus(r),
    applied_at: r.partner_applied_at ?? null, approved_at: r.partner_approved_at ?? null, ...(r.referrals != null ? { referrals: Number(r.referrals) } : {}) });
  return { pending: pending.map(view), approved: approved.map(view) };
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
