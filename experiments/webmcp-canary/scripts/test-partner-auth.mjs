import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleApi } from '../worker/api.mjs';
import { newReferralCode } from '../worker/partner.mjs';
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
sqlite.exec(readFileSync(new URL('../nurevo-impl/db/0035_referral_ledger.sql', import.meta.url), 'utf8'));
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
const env = { DB, REFERRAL_TOKEN_SECRET:'test-secret-referral-more-than-32-characters', DEV: '1', RESEND_API_KEY: 'test-only', MAIL_FROM: 'test@example.test', STRIPE_SECRET_KEY: 'test-only', STRIPE_PRICE_ID_STANDARD: 'price_standard' };
const messages = [], stripeCalls = [];
let mailFailure = false, invoicePages = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  if (String(url).startsWith('https://api.resend.com/')) {
    messages.push(JSON.parse(options.body));
    return Response.json(mailFailure ? { name: 'send_failed' } : { id: 'test' }, { status: mailFailure ? 500 : 200 });
  }
  assert.match(String(url), /^https:\/\/api.stripe.com\/v1\/invoices\?/);
  assert.equal(options.method || 'GET', 'GET', 'partner never changes billing');
  stripeCalls.push(String(url));
  return Response.json(invoicePages.shift() || { data: [], has_more: false });
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
async function verify(link) { return call(new URL(link).pathname + new URL(link).search); }
try {
  const parent = await signup('parent@example.test');
  const token = new URL(parent.loginLink).searchParams.get('token');
  assert.equal(sqlite.prepare('SELECT token FROM auth_tokens WHERE email=?').get('parent@example.test').token === token, false, 'token stored hashed');
  const loggedIn = await verify(parent.loginLink);
  assert.equal(loggedIn.status, 302); assert.equal(loggedIn.headers.get('location'), '/dashboard');
  const cookie = loggedIn.headers.get('set-cookie').match(/nrv_session=[^;]+/)[0];
  assert.ok(sqlite.prepare('SELECT used_at FROM auth_tokens WHERE email=?').get('parent@example.test').used_at);
  assert.match((await verify(parent.loginLink)).headers.get('location'), /auth-error/);
  assert.equal((await call('/api/partner')).status, 401);
  assert.equal((await call('/api/partner/code', {})).status, 403, 'CSRF required');
  sqlite.prepare("UPDATE accounts SET referral_code='AAAAAAAAAAAA' WHERE member_id='old'").run();
  const originalRandom = crypto.getRandomValues.bind(crypto);
  let draws = 0;
  crypto.getRandomValues = buffer => ++draws === 1 ? buffer.fill(0) : originalRandom(buffer);
  const code = (await (await call('/api/partner/code', {}, cookie)).json()).referral_code;
  crypto.getRandomValues = originalRandom;
  assert.ok(draws > 1, 'a forced duplicate is retried');
  assert.match(code, /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{12}$/);
  assert.equal((await (await call('/api/partner/code', {}, cookie)).json()).referral_code, code, 'issue is idempotent');
  const child = await signup('child@example.test', code.toLowerCase());
  assert.equal(sqlite.prepare("SELECT referred_by_account_id FROM accounts WHERE email='child@example.test'").get().referred_by_account_id,null,'attribution waits for verification');
  await verify(child.loginLink);
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
  assert.equal(messages.at(-1).subject, 'Nurevo ログインリンク', 'existing email gets login copy');
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
  assert.equal(partner.payout.rate_bp, 4000);
  assert.equal(partner.payout.duration_months, null);
  assert.deepEqual(partner.payout.totals, [], 'no invented commission before a reconciled ledger');
  assert.equal(partner.payout.paid_status, 'manual_payment_not_recorded');
  assert.equal(partner.referrals[0].sites.length, 7);
  assert.deepEqual(stripeCalls, [], 'summary reads the reconciled ledger, not Stripe');
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
  console.log('PASS: migration/backfill, referral signup, regeneration, invalid/self/immutable referral, token hash/single-use/expiry/concurrency, session/CSRF, shared email/IP limits, provider failure, real SQL ledger summary, 8-language confirmation. No real mail or Stripe calls.');
} finally { globalThis.fetch = originalFetch; sqlite.close(); }
