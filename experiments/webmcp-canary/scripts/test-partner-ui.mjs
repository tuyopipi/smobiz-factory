import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
const artifacts = process.env.PARTNER_QA_OUTPUT || '/private/tmp/nurevo-partner-qa';
await mkdir(artifacts, { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  let code = null;
  const partner = () => ({ referral_code: code, registered:!!code, payout:{rate:0.4,duration_months:null,totals:[{currency:'jpy',amount_minor:1200}]},
    referrals: [{ email: 'referred@example.test', registered_at: 1791986400000, sites: [{ url: 'shop.example.test', plan: 'standard', billing_status: 'active' }] }] });
  await page.route('https://nurevo.test/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith('/api/')) {
      let data = {};
      if (path === '/api/me') data = { email: 'parent@example.test', role: 'store' };
      if (path === '/api/partner') data = partner();
      if (path === '/api/partner/register' || path.startsWith('/api/partner/code')) { code = path.endsWith('regenerate') ? 'BCDEFGHJKMNP' : 'ABCDEFGHJKMN'; data = { referral_code: code }; }
      if (path === '/api/sites') data = { sites: [] };
      if (path === '/api/crawlers') data = { crawlers: [] };
      return route.fulfill({ json: data });
    }
    try {
      const root = new URL('../public/', import.meta.url);
      const file = new URL(path === '/dashboard' ? 'dashboard.html' : path.slice(1), root);
      const body = await readFile(file);
      return route.fulfill({ body, contentType: path === '/dashboard' ? 'text/html' : /\.m?js$/.test(path) ? 'text/javascript' : 'image/png' });
    } catch { return route.fulfill({ status: 404, body: '' }); }
  });
  await page.goto('https://nurevo.test/dashboard#partner');
  await page.getByRole('heading', { name: 'パートナー紹介', exact: true }).waitFor();
  assert.equal(await page.locator('[data-view="partner"]').isVisible(), true, 'store accounts see Partner');
  await page.getByRole('button', { name: 'パートナーに登録', exact: true }).click();
  await page.getByText('ABCDEFGHJKMN', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'コードを再発行', exact: true }).last().click();
  await page.getByText('BCDEFGHJKMNP', { exact: true }).waitFor();
  assert.ok(await page.getByText('referred@example.test', { exact: true }).isVisible());
  assert.ok(await page.getByText('shop.example.test', { exact: true }).isVisible());
  assert.ok(await page.getByText(/[¥￥]1,200/, { exact: true }).isVisible());
  await page.screenshot({ path: `${artifacts}/partner-ja.png`, fullPage: true });
  await page.locator('#lang').selectOption('en');
  assert.ok(await page.getByRole('heading', { name: 'Partner referrals', exact: true }).isVisible());
  await page.screenshot({ path: `${artifacts}/partner-en.png`, fullPage: true });
  for(const language of ['zh','tw','ko','es','fr','de']) {
    await page.locator('#lang').selectOption(language);
    await page.locator('#referral-share').waitFor();
    assert.equal(await page.locator('#referral-share button').count(),1);
  }
  assert.deepEqual(errors, []);
  const lp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  let submitted;
  await lp.route('https://nurevo.test/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/signup') { submitted = route.request().postDataJSON(); return route.fulfill({ json: { ok: true } }); }
    if (path.startsWith('/api/')) return route.fulfill({ json: {} });
    try {
      const file = new URL(path === '/' ? 'index.html' : path.slice(1), new URL('../../nurevo-lp/public/', import.meta.url));
      return route.fulfill({ body: await readFile(file), contentType: /\.m?js$/.test(path) ? 'text/javascript' : path.endsWith('.png') ? 'image/png' : 'text/html' });
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
  console.log(`PASS: JP/EN Partner routing for store accounts, issue/regenerate, automatic referral table, payout values, LP header/mobile button, signup payload/success, localized form. Screenshots: ${artifacts}`);
} finally { await browser.close(); }
