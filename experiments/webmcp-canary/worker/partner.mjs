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
export async function issueReferralCode(env, account, regenerate = false) {
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
  for (const s of sites) if (['standard', 'pro'].includes(s.plan) && s.contract === 'active' && s.stripe_subscription_id) subscriptions.set(s.stripe_subscription_id, s.plan);
  let total = 0;
  for (const plan of subscriptions.values()) total += ESTIMATE_MONTHLY_YEN[plan];
  return total;
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
  return {
    referral_code: account.referral_code,
    payout: { currency: 'jpy', rate: REFERRAL_SHARE,
      standard_monthly_yen: ESTIMATE_MONTHLY_YEN.standard, pro_monthly_yen: ESTIMATE_MONTHLY_YEN.pro,
      monthly_estimate_yen: monthlyReferralPayout(sites), estimate_basis: 'before_stripe_fees',
      cumulative_earned_yen: totals ? totals.earned : null, cumulative_paid_yen: totals ? totals.paid : null,
      held_yen: totals ? totals.held : null, needs_attention: totals ? totals.attention : null,
      next_payout_yen: totals ? totals.next : null, later_payout_yen: totals ? totals.later : null,
      next_payout_at: totals ? totals.window.next : null, next_payout_this_month: totals ? totals.window.nextIsThisMonth : null,
      payout_day: anchor, paid_status: totals ? 'ledger' : 'ledger_unavailable', basis: 'net_after_stripe_fees',
      account: { status: payoutAccount.status, currently_due: Number(payoutAccount.currently_due || 0) + Number(payoutAccount.past_due || 0),
        disabled_reason: payoutAccount.disabled_reason || null } },
    referrals: accounts.map(a => ({ account_id: a.id, email: a.email, registered_at: a.created_at,
      sites: sites.filter(s => s.owner_member_id === a.member_id).map(s => ({ id: s.id, url: s.url, plan: s.plan, billing_status: s.contract, registered_at: s.created_at })) }))
  };
}
