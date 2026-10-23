import { pricesFromEnv, tierPriceIds } from "./billing-plan.mjs";
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
export function monthlyReferralPayout(sites) {
  // manual_plan, org grants, trials, grace periods and unpaid sites never qualify.
  const subscriptions = new Set(sites.filter(s => s.plan === 'standard' && s.contract === 'active' && s.stripe_subscription_id).map(s => s.stripe_subscription_id));
  return subscriptions.size * 1200;
}
async function paidInvoiceCommission(env, subscriptionIds, registeredAt) {
  const key = String(env.STRIPE_SECRET_KEY || '').trim();
  if (!key) return { amount: null, reason: 'payment_history_unavailable' };
  if (subscriptionIds.length > 20) return { amount: null, reason: 'payment_history_incomplete' };
  let total = 0, requests = 0;
  try {
    for (const subscription of subscriptionIds) {
      let cursor = '';
      for (let page = 0; page < 10; page++) {
        if (++requests > 20) return { amount: null, reason: 'payment_history_incomplete' };
        const params = new URLSearchParams({ subscription, status: 'paid', limit: '100' });
        if (cursor) params.set('starting_after', cursor);
        const response = await fetch(`https://api.stripe.com/v1/invoices?${params}`, { headers: { authorization: `Bearer ${key}` } });
        if (!response.ok) throw new Error('invoice_read_failed');
        const result = await response.json();
        for (const invoice of result.data || []) {
          const created = Number(invoice.created);
          if (!Number.isFinite(created)) return { amount: null, reason: 'payment_history_incomplete' };
          if (created * 1000 < registeredAt.get(subscription)) continue;
          // A history entry must identify the Standard price, not a manual tier.
          // Mixed/truncated invoices cannot safely attribute a commission.
          const lines = invoice.lines;
          if (invoice.currency !== 'jpy' || lines?.has_more || !lines?.data?.length
            || Number(invoice.pre_payment_credit_notes_amount || 0) || Number(invoice.post_payment_credit_notes_amount || 0))
            return { amount: null, reason: 'payment_history_incomplete' };
          // The current Standard price plus any legacy Standard prices that
          // older subscriptions are still billed on (STRIPE_PRICE_IDS_LEGACY_STANDARD).
          const configured = pricesFromEnv(env);
          if (!configured.standard) return { amount: null, reason: 'payment_history_unavailable' };
          const standardPrices = tierPriceIds(configured, 'standard');
          const isStandard = price => standardPrices.includes(price);
          const prices = lines.data.map(line => line.price?.id || line.pricing?.price_details?.price);
          if (prices.some(price => !price) || (prices.some(isStandard) && !prices.every(isStandard)))
            return { amount: null, reason: 'payment_history_incomplete' };
          const standardOnly = prices.every(isStandard);
          if (standardOnly) total += Math.floor(Number(invoice.amount_paid || 0) * 0.4);
        }
        if (!result.has_more) break;
        cursor = result.data?.at(-1)?.id;
        if (!cursor || page === 9) return { amount: null, reason: 'payment_history_incomplete' };
      }
    }
    return { amount: total, reason: null };
  } catch {
    return { amount: null, reason: 'payment_history_unavailable' };
  }
}
export async function partnerSummary(env, account) {
  const { results: accounts = [] } = await env.DB.prepare('SELECT id,member_id,email,created_at FROM accounts WHERE referred_by_account_id=? ORDER BY created_at DESC,id DESC').bind(account.id).all();
  const { results: sites = [] } = await env.DB.prepare(`SELECT s.id,s.url,s.created_at,s.plan,s.contract,s.stripe_subscription_id,s.owner_member_id,a.created_at AS account_registered_at
    FROM sites s JOIN accounts a ON a.member_id=s.owner_member_id WHERE a.referred_by_account_id=?`).bind(account.id).all();
  const subscriptionIds = [...new Set(sites.map(s => s.stripe_subscription_id).filter(Boolean))];
  const registeredAt = new Map(subscriptionIds.map(id => [id, Math.min(...sites.filter(s => s.stripe_subscription_id === id).map(s => s.account_registered_at))]));
  const history = subscriptionIds.length
    ? await paidInvoiceCommission(env, subscriptionIds, registeredAt)
    : { amount: 0, reason: null };
  return {
    referral_code: account.referral_code,
    payout: { currency: 'jpy', rate: 0.4, standard_monthly_yen: 1200,
      monthly_estimate_yen: monthlyReferralPayout(sites),
      cumulative_earned_yen: history.amount, cumulative_paid_yen: null,
      history_status: history.reason || 'available', paid_status: 'no_payout_ledger',
      basis: 'subscription_webhook_state_and_paid_invoices' },
    referrals: accounts.map(a => ({ account_id: a.id, email: a.email, registered_at: a.created_at,
      sites: sites.filter(s => s.owner_member_id === a.member_id).map(s => ({ id: s.id, url: s.url, plan: s.plan, billing_status: s.contract, registered_at: s.created_at })) }))
  };
}
