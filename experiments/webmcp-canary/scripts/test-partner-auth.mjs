import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleApi } from '../worker/api.mjs';
import { monthlyReferralPayout, newReferralCode } from '../worker/partner.mjs';
import { EMAIL_LOCALES, signupLinkEmail } from '../worker/email-i18n.mjs';
const sqlite = new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('../nurevo-impl/db/schema.sql', import.meta.url), 'utf8'));
// schema.sql predates the manual-plan column added by migration 0021.
sqlite.exec('ALTER TABLE sites ADD COLUMN manual_plan TEXT');
sqlite.exec(readFileSync(new URL('../nurevo-impl/db/0029_member_email_preferences.sql', import.meta.url), 'utf8'));
// A preexisting member is backfilled by migration 0030.
sqlite.exec("INSERT INTO orgs(id) VALUES ('old'); INSERT INTO members(id,org_id,email,status) VALUES ('old','old','old@example.test','active')");
sqlite.exec(readFileSync(new URL('../nurevo-impl/db/0030_account_referrals.sql', import.meta.url), 'utf8'));
assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM accounts').get().n, 1);
// 0040: an account that already had a code keeps it but is NOT approved (queued for review).
sqlite.prepare("UPDATE accounts SET referral_code='AAAAAAAAAAAA' WHERE member_id='old'").run();
sqlite.exec(readFileSync(new URL('../nurevo-impl/db/0040_partner_approval_first_customer.sql', import.meta.url), 'utf8'));
assert.deepEqual({ ...sqlite.prepare("SELECT referral_code, partner_status, partner_approved_at FROM accounts WHERE member_id='old'").get() },
  { referral_code: 'AAAAAAAAAAAA', partner_status: 'pending', partner_approved_at: null }, 'existing code kept, pending, not approved');
const DB = {
  prepare(sql) {
    const stmt = sqlite.prepare(sql);
    return { values: [], bind(...values) { return Object.assign(Object.create(this), { values }); },
      async first() { return stmt.get(...this.values) || null; },
      async all() { return { results: stmt.all(...this.values) }; },
      runSync() { const result = stmt.run(...this.values); return { meta: { changes: Number(result.changes) } }; },
      async run() { return this.runSync(); } };
  },
  async batch(statements) { sqlite.exec('BEGIN'); try { const results = statements.map(s => s.runSync()); sqlite.exec('COMMIT'); return results; } catch (e) { sqlite.exec('ROLLBACK'); throw e; } }
};
const env = { DB, DEV: '1', SUPER_ADMIN_EMAILS: 'boss@example.test', RESEND_API_KEY: 'test-only', MAIL_FROM: 'test@example.test', STRIPE_SECRET_KEY: 'test-only', STRIPE_PRICE_ID_STANDARD: 'price_standard' };
const messages = [], stripeCalls = [];
let mailFailure = false;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  if (String(url).startsWith('https://api.resend.com/')) {
    messages.push(JSON.parse(options.body));
    return Response.json(mailFailure ? { name: 'send_failed' } : { id: 'test' }, { status: mailFailure ? 500 : 200 });
  }
  stripeCalls.push(String(url));
  throw new Error(`unexpected network call ${url}`);
};
let ip = 0;
async function call(path, body, cookie = '', fixedIp) {
  const headers = { 'content-type': 'application/json', 'cf-connecting-ip': fixedIp || `test-${++ip}` };
  if (cookie) { headers.cookie = cookie + '; nrv_csrf=' + 'a'.repeat(64); headers['x-csrf-token'] = 'a'.repeat(64); }
  return handleApi(new Request('https://nurevo.jp' + path, { method: body === undefined ? 'GET' : 'POST', headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }), env, {});
}
async function signup(email, referral_code) {
  const response = await call('/api/auth/signup', { email, referral_code, locale: 'ja' });
  assert.equal(response.status, 200); return response.json();
}
// A magic link no longer signs in on GET (mail scanners prefetch it): GET
// renders a confirm page, and its form POSTs the token back.
async function verify(link) {
  const target = new URL(link);
  const page = await call(target.pathname + target.search);
  if (page.status !== 200) return page;
  const html = await page.text();
  const token = html.match(/name="token" value="([a-f0-9]{64})"/)[1];
  const confirm = html.match(/name="confirm" value="([a-f0-9]{64})"/)[1];
  const cookie = page.headers.get('set-cookie').match(/nrv_magic_confirm=[^;]+/)[0];
  return handleApi(new Request('https://nurevo.jp' + target.pathname, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', origin: 'https://nurevo.jp', cookie, 'cf-connecting-ip': `test-${++ip}` }, body: new URLSearchParams({ token, confirm }).toString() }), env, {});
}
try {
  const parent = await signup('parent@example.test');
  const token = new URL(parent.loginLink).searchParams.get('token');
  assert.equal(sqlite.prepare('SELECT token FROM auth_tokens WHERE email=?').get('parent@example.test').token === token, false, 'token stored hashed');
  const loggedIn = await verify(parent.loginLink);
  assert.equal(loggedIn.status, 303); assert.equal(loggedIn.headers.get('location'), '/dashboard');
  const cookie = loggedIn.headers.get('set-cookie').match(/nrv_session=[^;]+/)[0];
  assert.ok(sqlite.prepare('SELECT used_at FROM auth_tokens WHERE email=?').get('parent@example.test').used_at);
  assert.match((await verify(parent.loginLink)).headers.get('location'), /auth-error/);
  assert.equal((await call('/api/partner')).status, 401);
  assert.equal((await call('/api/partner/code', {})).status, 403, 'CSRF required');
  /* --- Rule 1: only a partner Nurevo approved gets a code, onboarding or referrals --- */
  let r = await call('/api/partner/code', {}, cookie);
  assert.equal(r.status, 403); assert.equal((await r.json()).error, 'partner_not_approved', 'no code before approval');
  r = await call('/api/partner/payout/onboard', {}, cookie);
  assert.equal(r.status, 403); assert.equal((await r.json()).error, 'partner_not_approved', 'no payout onboarding before approval');
  let summary = await (await call('/api/partner', undefined, cookie)).json();
  assert.equal(summary.partner.status, 'none'); assert.equal(summary.partner.approved, false);
  assert.equal(summary.referral_code, null); assert.equal(summary.referral_code_active, false);
  assert.equal(summary.payout.onboarding_available, false);
  await signup('viaoldcode@example.test', 'AAAAAAAAAAAA');
  assert.equal(sqlite.prepare('SELECT referred_by_account_id FROM accounts WHERE email=?').get('viaoldcode@example.test').referred_by_account_id, null, 'a code of a non-approved account attributes nothing');
  assert.equal((await call('/api/partner/apply', {})).status, 403, 'apply needs CSRF');
  r = await call('/api/partner/apply', {}, cookie);
  assert.equal(r.status, 200); assert.equal((await r.json()).partner_status, 'pending');
  assert.equal((await (await call('/api/partner/apply', {}, cookie)).json()).partner_status, 'pending', 'applying twice stays pending');
  const parentAccountId = sqlite.prepare('SELECT id FROM accounts WHERE email=?').get('parent@example.test').id;
  // Approval: super admin only, CSRF-protected.
  assert.equal((await call('/api/admin/partner-applications')).status, 403);
  assert.equal((await call('/api/admin/partner-applications', undefined, cookie)).status, 403, 'a member cannot list applications');
  assert.equal((await call(`/api/admin/partner-applications/${parentAccountId}/approve`, {}, cookie)).status, 403, 'a member cannot approve itself');
  const boss = await signup('boss@example.test');
  const bossCookie = (await verify(boss.loginLink)).headers.get('set-cookie').match(/nrv_session=[^;]+/)[0];
  const apps = await (await call('/api/admin/partner-applications', undefined, bossCookie)).json();
  assert.deepEqual(apps.pending.map(a => a.email).sort(), ['old@example.test', 'parent@example.test'], 'the existing code holder and the applicant await review');
  assert.equal(apps.pending.find(a => a.email === 'old@example.test').has_referral_code, true);
  const noCsrf = await handleApi(new Request(`https://nurevo.jp/api/admin/partner-applications/${parentAccountId}/approve`, { method: 'POST', headers: { cookie: bossCookie, 'cf-connecting-ip': 'test-csrf' } }), env, {});
  assert.equal(noCsrf.status, 403, 'approval without CSRF is refused');
  assert.equal(sqlite.prepare('SELECT partner_status FROM accounts WHERE id=?').get(parentAccountId).partner_status, 'pending');
  const oldAccountId = sqlite.prepare("SELECT id FROM accounts WHERE member_id='old'").get().id;
  r = await call(`/api/admin/partner-applications/${oldAccountId}/reject`, {}, bossCookie);
  assert.equal(r.status, 200); assert.equal((await r.json()).partner_status, 'rejected');
  assert.equal((await call(`/api/admin/partner-applications/${oldAccountId}/approve`, {}, bossCookie)).status, 409, 'a decision is not flipped without a new application');
  r = await call(`/api/admin/partner-applications/${parentAccountId}/approve`, {}, bossCookie);
  assert.equal(r.status, 200); assert.equal((await r.json()).partner_status, 'approved');
  assert.equal((await call(`/api/admin/partner-applications/${parentAccountId}/approve`, {}, bossCookie)).status, 409, 'approved once');
  assert.equal((await call('/api/admin/partner-applications/999999/approve', {}, bossCookie)).status, 404);
  assert.equal(sqlite.prepare('SELECT partner_reviewed_by FROM accounts WHERE id=?').get(parentAccountId).partner_reviewed_by, sqlite.prepare('SELECT id FROM members WHERE email=?').get('boss@example.test').id);
  summary = await (await call('/api/partner', undefined, cookie)).json();
  assert.equal(summary.partner.status, 'approved'); assert.equal(summary.payout.onboarding_available, true);

  const originalRandom = crypto.getRandomValues.bind(crypto);
  let draws = 0;
  crypto.getRandomValues = buffer => ++draws === 1 ? buffer.fill(0) : originalRandom(buffer);
  const code = (await (await call('/api/partner/code', {}, cookie)).json()).referral_code;
  crypto.getRandomValues = originalRandom;
  assert.ok(draws > 1, 'a forced duplicate is retried');
  assert.match(code, /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{12}$/);
  assert.equal((await (await call('/api/partner/code', {}, cookie)).json()).referral_code, code, 'issue is idempotent');
  const child = await signup('child@example.test', code.toLowerCase());
  let partner = await (await call('/api/partner', undefined, cookie)).json();
  assert.equal(partner.referrals.length, 1); assert.equal(partner.referrals[0].email, 'child@example.test');
  const oldParentId = sqlite.prepare('SELECT referred_by_account_id FROM accounts WHERE email=?').get('child@example.test').referred_by_account_id;
  const code2 = (await (await call('/api/partner/code/regenerate', {}, cookie)).json()).referral_code;
  assert.notEqual(code2, code);
  assert.equal(sqlite.prepare('SELECT referred_by_account_id FROM accounts WHERE email=?').get('child@example.test').referred_by_account_id, oldParentId);
  assert.equal(sqlite.prepare('SELECT referred_by_code FROM accounts WHERE email=?').get('child@example.test').referred_by_code, code);
  await signup('invalid@example.test', 'NO-SUCH-CODE');
  await signup('oldcode@example.test', code);
  for (const email of ['invalid@example.test', 'oldcode@example.test']) assert.equal(sqlite.prepare('SELECT referred_by_account_id FROM accounts WHERE email=?').get(email).referred_by_account_id, null);
  await signup('parent@example.test', code2);
  assert.equal(messages.at(-1).subject, 'Nurevoへのログインリンク', 'existing email gets login copy');
  assert.equal(sqlite.prepare('SELECT referred_by_account_id FROM accounts WHERE email=?').get('parent@example.test').referred_by_account_id, null, 'self-referral ignored');
  await signup('child@example.test', code2);
  assert.equal(sqlite.prepare('SELECT referred_by_code FROM accounts WHERE email=?').get('child@example.test').referred_by_code, code, 'existing registration is immutable');
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM members WHERE email=?').get('child@example.test').n, 1);
  const expired = await signup('expired@example.test');
  sqlite.prepare('UPDATE auth_tokens SET expires_at=? WHERE email=?').run(Date.now() - 1, 'expired@example.test');
  assert.match((await verify(expired.loginLink)).headers.get('location'), /auth-error/);
  assert.equal(sqlite.prepare('SELECT used_at FROM auth_tokens WHERE email=?').get('expired@example.test').used_at, null);
  const childMember = sqlite.prepare('SELECT id,org_id FROM members WHERE email=?').get('child@example.test');
  const insert = sqlite.prepare('INSERT INTO sites(id,org_id,url,site_key,owner_member_id,plan,contract,stripe_subscription_id,created_at) VALUES (?,?,?,?,?,?,?,?,?)');
  for (const [id, plan, contract, sub] of [['paid','standard','active','sub_paid'],['trial','standard','trial','sub_trial'],['unpaid','standard','unpaid','sub_unpaid'],['cancel','free','cancelled','sub_cancel'],['comp','free','trial',null],['grace','standard','past_due','sub_grace'],['duplicate','standard','active','sub_paid']]) {
    insert.run(id, childMember.org_id, `${id}.example.test`, id, childMember.id, plan, contract, sub, Date.now());
  }
  sqlite.prepare("UPDATE sites SET manual_plan='standard' WHERE id='comp'").run();
  partner = await (await call('/api/partner', undefined, cookie)).json();
  // Rule 2: the first paying customer never earns, so the estimate leaves it out.
  assert.equal(partner.payout.monthly_estimate_yen, 0, 'the only paying customer is the expected first customer: excluded from the estimate');
  assert.equal(partner.referrals[0].commission, 'first_customer');
  assert.equal(partner.referrals[0].first_customer_confirmed, false, 'expected, not yet recorded');
  await signup('firstcust@example.test', code2);
  const firstCustId = sqlite.prepare('SELECT id FROM accounts WHERE email=?').get('firstcust@example.test').id;
  sqlite.prepare('UPDATE accounts SET partner_first_customer_account_id=? WHERE id=?').run(firstCustId, parentAccountId); // as its first paid invoice records it
  partner = await (await call('/api/partner', undefined, cookie)).json();
  assert.equal(partner.payout.monthly_estimate_yen, 1200, 'one active Standard subscription (duplicates and trials/unpaid/comp excluded)');
  assert.equal(partner.referrals.find(a => a.email === 'firstcust@example.test').commission, 'first_customer');
  assert.equal(partner.referrals.find(a => a.email === 'firstcust@example.test').first_customer_confirmed, true);
  assert.equal(partner.referrals.find(a => a.email === 'child@example.test').commission, 'eligible');
  assert.equal(partner.payout.cumulative_earned_yen, null, 'no ledger yet (0039 unapplied) -> never a guessed amount');
  assert.equal(partner.payout.cumulative_paid_yen, null, 'never invent disbursements');
  assert.equal(partner.payout.paid_status, 'ledger_unavailable');
  assert.equal(partner.payout.account.status, 'not_started');
  assert.equal(partner.referrals.find(a => a.email === 'child@example.test').sites.length, 7);
  sqlite.exec(readFileSync(new URL('../nurevo-impl/db/0039_partner_payouts.sql', import.meta.url), 'utf8'));
  insert.run('pro', childMember.org_id, 'pro.example.test', 'pro', childMember.id, 'pro', 'active', 'sub_pro', Date.now());
  partner = await (await call('/api/partner', undefined, cookie)).json();
  assert.equal(partner.payout.monthly_estimate_yen, 1200 + 5920, 'Pro counts at 40% too (estimate before Stripe fees)');
  assert.equal(partner.payout.estimate_basis, 'before_stripe_fees');
  assert.equal(partner.payout.cumulative_earned_yen, 0, 'the ledger is the only source of earned/paid');
  assert.equal(partner.payout.cumulative_paid_yen, 0);
  assert.equal(partner.payout.paid_status, 'ledger');
  assert.equal(partner.payout.payout_day, 25);
  assert.equal(monthlyReferralPayout([{ plan: 'standard', contract: 'active', stripe_subscription_id: null }]), 0);
  assert.equal(monthlyReferralPayout([{ plan: 'pro', contract: 'active', stripe_subscription_id: 's' }, { plan: 'pro', contract: 'trial', stripe_subscription_id: 't' }]), 5920);
  assert.equal((await call('/api/partner/payout/onboard', {})).status, 403, 'payout onboarding needs CSRF');
  assert.equal((await call('/api/partner/payout/onboard', {}, cookie)).status, 503, 'no Stripe key -> not configured, nothing created');
  assert.equal(stripeCalls.length, 0, 'the partner page never calls Stripe without a configured key');
  mailFailure = true;
  assert.equal((await call('/api/auth/signup', { email: 'failure@example.test' })).status, 502);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM auth_tokens WHERE email=?').get('failure@example.test').n, 0);
  mailFailure = false;
  for (let n = 0; n < 5; n++) assert.equal((await call(n % 2 ? '/api/auth/magic-link' : '/api/auth/signup', { email: 'rate@example.test' })).status, 200);
  assert.equal((await call('/api/auth/magic-link', { email: 'rate@example.test' })).status, 429, 'shared email limit');
  for (let n = 0; n < 10; n++) assert.equal((await call('/api/auth/signup', { email: `ip${n}@example.test` }, '', 'one-ip')).status, 200);
  assert.equal((await call('/api/auth/signup', { email: 'ip-final@example.test' }, '', 'one-ip')).status, 429, 'IP rate limit');
  const concurrent = await call('/api/auth/magic-link', { email: 'concurrent@example.test' });
  const link = (await concurrent.json()).loginLink;
  const responses = await Promise.all([verify(link), verify(link)]);
  assert.equal(responses.filter(r => r.headers.get('location') === '/dashboard').length, 1, 'only one concurrent verification wins');
  for (const lang of EMAIL_LOCALES) { const email = signupLinkEmail('https://nurevo.jp/?a="<>', lang); assert.ok(email.subject && email.text.includes('15')); assert.match(email.html, /&quot;&lt;&gt;/); }
  assert.equal(new Set(Array.from({ length: 1000 }, newReferralCode)).size, 1000);
  console.log('PASS: 0040 approval (no code/onboarding/attribution before approval, apply, super-admin-only CSRF-protected approve/reject, existing codes pending), migration/backfill, referral signup, regeneration, invalid/self/immutable referral, token hash/single-use/expiry/concurrency, session/CSRF, shared email/IP limits, provider failure, real SQL payout states (ledger only, estimate counts Standard and Pro), onboarding CSRF/unconfigured, 8-language confirmation. No real mail or Stripe calls.');
} finally { globalThis.fetch = originalFetch; sqlite.close(); }
