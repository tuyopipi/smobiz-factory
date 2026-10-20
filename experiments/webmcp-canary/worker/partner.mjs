import { referralConfig } from './referral-config.mjs';
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
export async function partnerSummary(env, account) {
  const {results:accounts=[]} = await env.DB.prepare('SELECT id,member_id,email,created_at FROM accounts WHERE referred_by_account_id=? ORDER BY created_at DESC,id DESC').bind(account.id).all();
  const {results:sites=[]} = await env.DB.prepare('SELECT s.id,s.url,s.plan,s.contract,s.owner_member_id FROM sites s JOIN accounts a ON a.member_id=s.owner_member_id WHERE a.referred_by_account_id=?').bind(account.id).all();
  const config = referralConfig(env);
  const {results:totals=[]} = await env.DB.prepare(`SELECT l.currency,SUM(l.commission_minor) AS amount_minor FROM referral_ledger l JOIN referral_ledger_runs r ON r.id=l.run_id
    WHERE l.partner_id=? AND r.status='ready' AND r.id=(SELECT r2.id FROM referral_ledger_runs r2 WHERE r2.period=r.period ORDER BY r2.created_at DESC,r2.rowid DESC LIMIT 1)
    GROUP BY l.currency`).bind(account.id).all();
  return {referral_code:account.referral_code,registered:!!account.partner_registered_at,
    payout:{rate:config.rateBp/10000,rate_bp:config.rateBp,duration_months:config.durationMonths,totals,status:'calculated',paid_status:'manual_payment_not_recorded'},
    referrals:accounts.map(a=>({account_id:a.id,email:a.email,registered_at:a.created_at,sites:sites.filter(s=>s.owner_member_id===a.member_id).map(s=>({...s,billing_status:s.contract}))}))};
}
