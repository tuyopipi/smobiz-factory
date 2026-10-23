import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {extractAeoSignals, scoreAeo, buildAeoChecks} from '../worker/aeo-score.mjs';
const signals = extractAeoSignals('<h1>Tea</h1><script type="application/ld+json">{"@type":"Product","name":"Tea","offers":{"price":0}}</script>');
const checks = buildAeoChecks(signals,scoreAeo(signals));
const payload = {score:20,band:'red',gatePassed:true,checks};
const browser = await chromium.launch({headless:true,channel:process.env.AEO_BROWSER_CHANNEL || undefined});
try {
  const page = await browser.newPage();
  await page.route('https://nurevo.jp/**',async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/aeo/score') return route.fulfill({json:payload});
    if (url.pathname === '/check/') return route.fulfill({contentType:'text/html',body:await readFile(new URL('../../nurevo-lp/public/check/index.html',import.meta.url),'utf8')});
    return route.fulfill({body:''});
  });
  await page.goto('https://nurevo.jp/check/?url=https://example.com');
  await page.waitForSelector('#checks details');
  assert.ok(await page.locator('#checks').getByText(/✗ Product.offers.priceCurrency/).count());
  assert.ok(await page.locator('#checks').getByText(/✓ Product.offers.price/).count());
  assert.equal(await page.locator('#checks details').count(),2);
  const script = await readFile(new URL('../public/dashboard-aeo-metrics.js',import.meta.url),'utf8');
  await page.route('https://dashboard.test/**',async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/sites') return route.fulfill({json:{sites:[{id:'site-1',url:'example.com'}]}});
    if (url.pathname.includes('/aeo-metrics')) return route.fulfill({json:{site_id:'site-1',checks,scores:[],ai_referrals:[],crawler_hits:[]}});
    return route.fulfill({contentType:'text/html',body:'<html lang="ja"><head></head><body><main id="main"><div class="top"><h1>example.com</h1></div><div class="detail"></div></main></body></html>'});
  });
  await page.goto('https://dashboard.test/');
  await page.addScriptTag({content:script});
  await page.waitForSelector('.nrv-aeo-metrics details');
  assert.equal(await page.locator('.nrv-aeo-metrics details').count(),2);
  assert.ok(await page.locator('.nrv-aeo-metrics').getByText(/✗ Product.offers.availability/).count());
  console.log('Browser verified dashboard and /check present/missing field lists');
} finally {await browser.close();}
