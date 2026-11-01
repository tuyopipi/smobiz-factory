import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
const artifacts = process.env.PARTNER_QA_OUTPUT || '/private/tmp/nurevo-partner-qa';
await mkdir(artifacts, { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'ja-JP' });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  let code = null;
  let payoutStatus = 'not_started', onboardCalls = 0, refreshCalls = 0, applyCalls = 0, partnerStatus = 'none', payoutMethod = 'stripe', wise = null, wiseSaves = [], methodCalls = [];
  const partner = () => ({ referral_code: partnerStatus === 'approved' ? code : 'OLDCODE23456', referral_code_active: partnerStatus === 'approved', partner: { status: partnerStatus, approved: partnerStatus === 'approved' }, payout: { first_customer_invoices: partnerStatus === 'approved' ? 2 : 0, onboarding_available: partnerStatus === 'approved', monthly_estimate_yen: 1200, cumulative_earned_yen: 2400, cumulative_paid_yen: 0, held_yen: 1156, next_payout_yen: 0, later_payout_yen: 1156, next_payout_this_month: true, payout_day: 25, method: payoutMethod, wise_available: true, wise, wise_currencies: ['USD', 'EUR', 'GBP'], account: { status: payoutStatus, currently_due: payoutStatus === 'in_progress' ? 2 : 0 } },
    referrals: [{ email: 'referred@example.test', registered_at: 1791986400000, commission: partnerStatus === 'approved' ? 'eligible' : 'not_approved', sites: [{ url: 'shop.example.test', plan: 'standard', billing_status: 'active' }] },
      ...(partnerStatus === 'approved' ? [{ email: 'first@example.test', registered_at: 1791900000000, commission: 'first_customer', sites: [{ url: 'first.example.test', plan: 'standard', billing_status: 'active' }] }] : [])] });
  await page.route('https://nurevo.test/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith('/api/')) {
      let data = {};
      if (path === '/api/me') data = { email: 'parent@example.test', role: 'store' };
      if (path === '/api/partner') data = partner();
      if (path === '/api/partner/apply') { assert.equal(route.request().method(), 'POST'); applyCalls++; partnerStatus = 'approved'; code = 'ABCDEFGHJKMN'; data = { ok: true, partner_status: 'approved', applied_at: 1, approved_at: 1, referral_code: code }; }
      if (path === '/api/partner/payout/wise') { assert.equal(route.request().method(), 'POST'); const b = route.request().postDataJSON(); wiseSaves.push(b); payoutMethod = 'wise'; wise = { account_name: b.account_name, email_masked: 'j******@example.test', currency: b.currency, country: b.country, updated_at: 1 }; data = { ok: true, method: 'wise', wise }; }
      if (path === '/api/partner/payout/method') { assert.equal(route.request().method(), 'POST'); const b = route.request().postDataJSON(); methodCalls.push(b.method); payoutMethod = b.method; data = { ok: true, method: b.method }; }
      if (path === '/api/partner/payout/refresh') { assert.equal(route.request().method(), 'POST'); refreshCalls++; data = { ok: true }; }
      if (path === '/api/partner/payout/onboard') { assert.equal(route.request().method(), 'POST'); onboardCalls++; data = { ok: true, kind: 'onboarding', url: 'https://connect.stripe.com/setup/e/acct_test' }; }
      if (path.startsWith('/api/partner/code')) { code = path.endsWith('regenerate') ? 'BCDEFGHJKMNP' : 'ABCDEFGHJKMN'; data = { referral_code: code }; }
      if (path === '/api/sites') data = { sites: [] };
      if (path === '/api/crawlers') data = { crawlers: [] };
      return route.fulfill({ json: data });
    }
    try {
      const root = new URL('../public/', import.meta.url);
      const file = new URL(path === '/dashboard' ? 'dashboard.html' : path.slice(1), root);
      const body = await readFile(file);
      return route.fulfill({ body, contentType: path === '/dashboard' ? 'text/html' : path.endsWith('.js') ? 'text/javascript' : 'image/png' });
    } catch { return route.fulfill({ status: 404, body: '' }); }
  });
  await page.goto('https://nurevo.test/dashboard#partner');
  await page.getByRole('heading', { name: 'パートナー', exact: true }).waitFor();
  assert.equal(await page.locator('[data-view="partner"]').isVisible(), true, 'store accounts see Partner');
  // Rule 1: not approved -> apply button, inactive code, no issue/onboarding buttons.
  assert.ok(await page.getByText('未申請', { exact: true }).isVisible());
  assert.equal(await page.getByRole('button', { name: '発行', exact: true }).count(), 0, 'no code before approval');
  assert.equal(await page.locator('#payout-onboard').count(), 0, 'no payout onboarding before approval');
  assert.ok(await page.getByText('OLDCODE23456 — 無効（未承認）', { exact: true }).isVisible(), 'an older code is shown as inactive');
  assert.ok(await page.getByText('紹介したお客様の1社目は報酬の対象外です。2社目から報酬が発生します。', { exact: true }).isVisible());
  assert.ok(await page.getByText('承認前の紹介（報酬対象外）', { exact: true }).isVisible());
  await page.screenshot({ path: `${artifacts}/partner-not-approved.png`, fullPage: true });
  // Auto-approval: applying approves at once and the code is already issued.
  await page.getByRole('button', { name: 'パートナー申請', exact: true }).click();
  await page.getByText('承認済み', { exact: true }).waitFor();
  assert.equal(applyCalls, 1);
  assert.ok(await page.getByText('パートナーとして承認されました。紹介コードを発行しました。', { exact: true }).isVisible());
  assert.equal(await page.getByRole('button', { name: 'パートナー申請', exact: true }).count(), 0, 'no second application once approved');
  assert.ok(await page.getByText('1社目（報酬対象外）', { exact: true }).isVisible(), 'the first customer is labelled, not hidden');
  assert.ok(await page.getByText('1社目（報酬対象外）のお支払い：2件', { exact: true }).isVisible());
  await page.getByText('ABCDEFGHJKMN', { exact: true }).waitFor();
  await page.getByRole('button', { name: '更新', exact: true }).last().click();
  await page.getByText('BCDEFGHJKMNP', { exact: true }).waitFor();
  assert.ok(await page.getByText('referred@example.test', { exact: true }).isVisible());
  assert.ok(await page.getByText('shop.example.test', { exact: true }).isVisible());
  assert.ok(await page.getByText('¥1,200', { exact: true }).isVisible());
  // Payout account card: status, schedule, notes, and the onboarding button.
  assert.ok(await page.getByRole('heading', { name: '報酬の受け取り口座', exact: true }).isVisible());
  assert.ok(await page.getByText('毎月25日にまとめて口座へ入金', { exact: true }).isVisible());
  assert.ok(await page.getByText('未登録', { exact: true }).isVisible());
  assert.ok(await page.getByText(/Nurevoは口座番号を保存・閲覧しません/).isVisible());
  assert.ok(await page.getByText(/Stripeでの受け取りは日本国内の銀行口座のみです/).isVisible());
  assert.ok(await page.getByRole('heading', { name: '受け取り方法', exact: true }).isVisible(), 'the payout method choice sits with the Stripe setup');
  assert.ok(await page.getByText('現在の受け取り方法：国内の銀行口座（Stripe）', { exact: true }).isVisible());
  assert.ok(await page.getByText('今月25日に入金予定', { exact: true }).isVisible());
  assert.ok(await page.getByText('来月以降', { exact: true }).isVisible());
  assert.ok(await page.getByText('月額報酬見込み（手数料控除前の目安）', { exact: true }).isVisible());
  await page.screenshot({ path: `${artifacts}/partner-ja.png`, fullPage: true });
  // Every payout string exists in all 8 languages. Languages other than ja/en
  // are fetched from /dashboard-i18n/ when first needed; load them here.
  await page.evaluate(() => Promise.all(['zh', 'tw', 'ko', 'es', 'fr', 'de'].map((l) => window.nrvI18n.ready(l))));
  const missing = await page.evaluate(() => {
    const keys = ['ptStatusTitle','ptStatusNone','ptStatusPending','ptStatusApproved','ptStatusRejected','ptApply','ptApplied','ptApplyNote','ptPendingNote','ptApprovedNote','ptRejectedNote','ptCodeInactive','ptCodeNeedsApproval','ptFirstFree','ptFirstCustomer','ptBeforeApproval','ptFirstCustomerInvoices','err_partner_not_approved','paApps','paAppsLead','paReject','paRevoke','paRevokeNote','paNoApps','paApprovedList','ptPayoutTitle','ptPayoutNotStarted','ptPayoutInProgress','ptPayoutReady','ptPayoutUnavailable','ptPayoutDue','ptPayoutStart','ptPayoutContinue','ptPayoutUpdate','ptPayoutSchedule','ptPayoutSecure','ptPayoutJapan','ptPayoutHeldNote','ptHeld','ptNextThisMonth','ptLaterThisMonth','ptNextNextMonth','ptLaterNextMonth','ptPayoutExpired','ptPayoutOpening','ptMonthly','ptRate','ptMethodTitle','ptMethodStripe','ptMethodWise','ptWiseTitle','ptWiseName','ptWiseEmail','ptWiseCurrency','ptWiseCountry','ptWiseSave','ptWiseNote','paMethod','paWiseDue','paWisePaid'];
    const out = [];
    for (const lang of ['ja','en','zh','tw','ko','es','fr','de']) for (const k of keys) if (!I[lang] || !I[lang][k]) out.push(lang + ':' + k);
    for (const lang of ['en','zh','tw','ko','es','fr','de']) if (I[lang].ptPayoutTitle === I.ja.ptPayoutTitle) out.push(lang + ':untranslated');
    for (const lang of ['ja','en','zh','tw','ko','es','fr','de']) if (!I[lang].ptPayoutSchedule.includes('{d}')) out.push(lang + ':schedule-day');
    return out;
  });
  assert.deepEqual(missing, [], 'payout strings in all 8 languages');
  for (const lang of ['zh', 'tw', 'ko', 'es', 'fr', 'de']) {
    await page.locator('#lang').selectOption(lang);
    const schedule = await page.locator('#payout-card').innerText();
    assert.match(schedule, /25/, `${lang}: the payout day is shown`);
    assert.equal(/ptPayout/.test(schedule), false, `${lang}: no raw keys`);
  }
  await page.locator('#lang').selectOption('ja');
  // The button asks the server for a Stripe-hosted link and goes there.
  await page.route('https://connect.stripe.com/**', route => route.fulfill({ body: '<title>Stripe</title>', contentType: 'text/html' }));
  await Promise.all([page.waitForURL('https://connect.stripe.com/**'), page.getByRole('button', { name: '受け取り口座を登録', exact: true }).click()]);
  assert.equal(onboardCalls, 1);
  payoutStatus = 'in_progress';
  await page.goto('https://nurevo.test/dashboard?payout=return#partner');
  await page.getByRole('heading', { name: '報酬の受け取り口座', exact: true }).waitFor();
  assert.ok(await page.getByText('登録手続き中', { exact: true }).isVisible());
  assert.ok(await page.getByRole('button', { name: '登録を続ける', exact: true }).isVisible());
  assert.ok(await page.getByText('あと2項目の入力が必要です。', { exact: true }).isVisible());
  assert.equal(new URL(page.url()).searchParams.get('payout'), null, 'the return marker is removed from the address bar');
  assert.equal(refreshCalls, 1, 'returning from Stripe asks the server (POST) to re-check the account once');
  payoutStatus = 'ready';
  await page.reload();
  await page.getByRole('heading', { name: '報酬の受け取り口座', exact: true }).waitFor();
  assert.ok(await page.getByRole('button', { name: '口座情報を確認・変更', exact: true }).isVisible());
  await page.screenshot({ path: `${artifacts}/partner-payout-ready.png`, fullPage: true });
  await page.locator('#lang').selectOption('en');
  assert.ok(await page.getByRole('heading', { name: 'Partner', exact: true }).isVisible());
  await page.screenshot({ path: `${artifacts}/partner-en.png`, fullPage: true });
  // Overseas: choose Wise, fill the form, save; the Stripe card makes way for the Wise card.
  await page.locator('#lang').selectOption('ja');
  await page.getByLabel('海外（Wise）').check();
  await page.getByRole('heading', { name: 'Wiseの受け取り情報', exact: true }).waitFor();
  assert.equal(await page.locator('#payout-card').count(), 0, 'the Stripe card is replaced by the Wise form');
  await page.getByLabel('受取人名').fill('Jane Doe');
  await page.getByLabel('Wiseに登録したメールアドレス').fill('jane.doe@example.test');
  await page.getByLabel('受け取り通貨').selectOption('EUR');
  await page.getByLabel(/^国（2文字の国コード/).fill('de');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await page.getByText('Wiseの受け取り情報を保存しました。今後の報酬はWiseでお支払いします。', { exact: true }).waitFor();
  assert.deepEqual(wiseSaves, [{ account_name: 'Jane Doe', email: 'jane.doe@example.test', currency: 'EUR', country: 'DE' }]);
  assert.ok(await page.getByText('現在の受け取り方法：海外（Wise）', { exact: true }).isVisible());
  assert.ok(await page.getByText('Jane Doe · j******@example.test · EUR · DE', { exact: true }).isVisible(), 'saved details shown with the address masked');
  await page.screenshot({ path: `${artifacts}/partner-wise.png`, fullPage: true });
  await page.reload();
  await page.getByRole('heading', { name: 'Wiseの受け取り情報', exact: true }).waitFor();
  assert.equal(await page.getByLabel('受け取り通貨').inputValue(), 'EUR');
  // Back to Stripe: choosing it shows the Stripe card and a switch button.
  await page.getByLabel('国内の銀行口座（Stripe）').check();
  await page.getByRole('heading', { name: '報酬の受け取り口座', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Stripeでの受け取りに切り替える', exact: true }).click();
  await page.getByText('受け取り方法を切り替えました。', { exact: true }).waitFor();
  assert.deepEqual(methodCalls, ['stripe']);
  assert.ok(await page.getByText('現在の受け取り方法：国内の銀行口座（Stripe）', { exact: true }).isVisible());
  assert.deepEqual(errors, []);
  // Super admin: Partner admin -> "パートナー申請（紹介報酬）" -> 承認 (POST with the CSRF header).
  const admin = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'ja-JP' });
  await admin.context().addCookies([{ name: 'nrv_csrf', value: 'f'.repeat(64), url: 'https://nurevo.test/' }]);
  const reviews = [];
  let pendingApps = [{ account_id: 7, email: 'applicant@example.test', has_referral_code: true, partner_status: 'pending', applied_at: 1791986400000 }, { account_id: 8, email: 'spam@example.test', has_referral_code: false, partner_status: 'pending', applied_at: 1791986400000 }];
  let approvedApps = [{ account_id: 9, email: 'overseas@example.test', partner_status: 'approved', approved_at: 1791990000000, referrals: 3, auto_approved: true, payout_method: 'wise', stripe_payout_status: 'not_started', wise: { account_name: 'Jane Doe', email: 'jane.doe@example.test', currency: 'EUR', country: 'DE', due_yen: 2313, gross_yen: 2313, debt_yen: 0, later_yen: 1156, due_rows: 2, unconfirmed_rows: 0, payout_at: 1795575600000 } }];
  const wisePaid = [];
  await admin.route('https://nurevo.test/**', async route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    if (path.startsWith('/api/')) {
      let data = {};
      if (path === '/api/me') data = { email: 'boss@example.test', role: 'admin', is_super_admin: true, org_id: 'org' };
      if (path === '/api/partner') data = partner();
      if (path === '/api/sites') data = { sites: [] };
      if (path === '/api/crawlers') data = { crawlers: [] };
      if (path === '/api/admin/pending') data = { pending: [] };
      if (path === '/api/admin/partners') data = { partners: [] };
      if (path === '/api/admin/partner-applications') data = { pending: pendingApps, approved: approvedApps };
      const wp = path.match(/^\/api\/admin\/partners\/(\d+)\/wise-paid$/);
      if (wp) {
        assert.equal(req.method(), 'POST');
        assert.equal(req.headers()['x-csrf-token'], 'f'.repeat(64), 'recording a Wise payout carries the CSRF token');
        wisePaid.push({ id: wp[1], ...req.postDataJSON() });
        approvedApps = approvedApps.map(a => String(a.account_id) === wp[1] ? { ...a, wise: { ...a.wise, due_yen: 0, due_rows: 0 } } : a);
        return route.fulfill({ json: { ok: true, paid_yen: 2313, rows: 2 } });
      }
      const m = path.match(/^\/api\/admin\/partner-applications\/(\d+)\/(approve|reject|revoke)$/);
      if (m) {
        assert.equal(req.method(), 'POST');
        assert.equal(req.headers()['x-csrf-token'], 'f'.repeat(64), 'approval carries the CSRF token');
        reviews.push(m[2] + ':' + m[1]);
        if (m[2] === 'revoke') { approvedApps = approvedApps.filter(a => String(a.account_id) !== m[1]); return route.fulfill({ json: { ok: true, partner_status: 'rejected' } }); }
        const app = pendingApps.find(a => String(a.account_id) === m[1]);
        pendingApps = pendingApps.filter(a => a !== app);
        if (m[2] === 'approve') approvedApps.push({ ...app, partner_status: 'approved', approved_at: 1791990000000, referrals: 0, auto_approved: false, payout_method: 'stripe', stripe_payout_status: 'not_started', wise: null });
        data = { ok: true };
      }
      return route.fulfill({ json: data });
    }
    try {
      const file = new URL(path === '/dashboard' ? 'dashboard.html' : path.slice(1), new URL('../public/', import.meta.url));
      return route.fulfill({ body: await readFile(file), contentType: path === '/dashboard' ? 'text/html' : path.endsWith('.js') ? 'text/javascript' : 'image/png' });
    } catch { return route.fulfill({ status: 404, body: '' }); }
  });
  await admin.goto('https://nurevo.test/dashboard');
  await admin.locator('[data-member-nav="partners"]').click();
  await admin.getByRole('heading', { name: 'パートナー申請（紹介報酬）', exact: true }).waitFor();
  await admin.getByText('applicant@example.test', { exact: true }).waitFor();
  await admin.locator('[data-partner-approve="7"]').click();
  await admin.locator('[data-approved-partner-rows]').getByText('applicant@example.test', { exact: true }).waitFor();
  await admin.locator('[data-partner-reject="8"]').click();
  await admin.getByText('審査待ちのパートナー申請はありません。', { exact: true }).waitFor();
  assert.ok(await admin.getByText(/承認を取り消すと/).isVisible(), 'the revoke note is shown');
  await admin.screenshot({ path: `${artifacts}/partner-admin-approval.png`, fullPage: true });
  // A Wise partner: payout details and the amount to send by hand, then "Wiseで送金済みにする".
  const wiseCell = admin.locator('[data-partner-payout="9"]');
  assert.ok(await wiseCell.getByText('Wise（海外）', { exact: true }).isVisible());
  assert.ok(await wiseCell.getByText('Jane Doe / jane.doe@example.test / EUR / DE', { exact: true }).isVisible());
  assert.equal(await wiseCell.locator('[data-wise-due]').innerText(), '¥2,313');
  assert.ok(await admin.locator('[data-approved-partner-rows]').getByText('自動承認', { exact: true }).first().isVisible());
  assert.match(await admin.locator('[data-partner-payout="7"]').innerText(), /^Stripe（国内）\s+未登録$/, 'a Stripe partner shows its Stripe status');
  admin.once('dialog', d => { assert.match(d.message(), /¥2,313 を jane\.doe@example\.test に送金済み/); d.accept('WISE-42'); });
  await wiseCell.getByRole('button', { name: 'Wiseで送金済みにする', exact: true }).click();
  await admin.getByText('¥2,313を送金済みとして記録しました。', { exact: true }).waitFor();
  assert.deepEqual(wisePaid, [{ id: '9', expected_yen: 2313, reference: 'WISE-42' }]);
  assert.equal(await admin.locator('[data-partner-payout="9"]').getByRole('button').count(), 0, 'nothing left to send');
  await admin.screenshot({ path: `${artifacts}/partner-admin-wise.png`, fullPage: true });
  await admin.locator('[data-partner-revoke="7"]').click();
  await admin.locator('[data-partner-revoke="9"]').click();
  await admin.getByText('承認済みパートナーはいません。', { exact: true }).waitFor();
  assert.deepEqual(reviews, ['approve:7', 'reject:8', 'revoke:7', 'revoke:9']);
  await admin.close();
  const lp = await browser.newPage({ viewport: { width: 1280, height: 800 }, locale: 'ja-JP' });
  let submitted;
  await lp.route('https://nurevo.test/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/signup') { submitted = route.request().postDataJSON(); return route.fulfill({ json: { ok: true } }); }
    if (path.startsWith('/api/')) return route.fulfill({ json: {} });
    try {
      const file = new URL(path === '/' ? 'index.html' : path.slice(1), new URL('../../nurevo-lp/public/', import.meta.url));
      return route.fulfill({ body: await readFile(file), contentType: path.endsWith('.js') ? 'text/javascript' : path.endsWith('.png') ? 'image/png' : 'text/html' });
    } catch { return route.fulfill({ status: 404, body: '' }); }
  });
  await lp.goto('https://nurevo.test/');
  const signupButton = lp.locator('header').getByRole('link', { name: '新規登録', exact: true });
  assert.ok(await signupButton.isVisible());
  assert.equal(await signupButton.getAttribute('href'), '/signup.html?lang=ja');
  await lp.screenshot({ path: `${artifacts}/lp-signup-button.png` });
  await signupButton.click();
  await lp.locator('[name="email"]').fill('new@example.test');
  await lp.locator('[name="referral_code"]').fill('BCDEFGHJKMNP');
  await lp.screenshot({ path: `${artifacts}/signup-form.png` });
  await lp.getByRole('button', { name: '確認メールを送信' }).click();
  await lp.getByText('確認メールを送りました。メールをご確認ください。', { exact: true }).waitFor();
  assert.deepEqual(submitted, { email: 'new@example.test', referral_code: 'BCDEFGHJKMNP', locale: 'ja' });
  await lp.screenshot({ path: `${artifacts}/signup-sent.png` });
  await lp.goto('https://nurevo.test/signup.html?lang=ko');
  assert.equal(await lp.locator('html').getAttribute('lang'), 'ko');
  await lp.setViewportSize({ width: 390, height: 844 });
  await lp.goto('https://nurevo.test/');
  assert.ok(await lp.locator('header').getByRole('link', { name: '新規登録', exact: true }).isVisible());
  await lp.screenshot({ path: `${artifacts}/lp-mobile.png` });
  console.log(`PASS: partner approval states (apply auto-approves with the code issued; inactive old code; no issue/onboarding before approval), first-customer note and labels, super-admin approve/reject/revoke UI with CSRF, payout account card (status, button, monthly 25th, Stripe Japan-only, bank details on Stripe), payout method choice (Wise form save with masked address, switch back to Stripe), admin Wise details and record-as-sent with CSRF, payout strings in 8 languages, JP/EN Partner routing for store accounts, issue/regenerate, automatic referral table, payout values, LP header/mobile button, signup payload/success, localized form. Screenshots: ${artifacts}`);
} finally { await browser.close(); }
