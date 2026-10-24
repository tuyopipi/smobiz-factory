/**
 * The dashboard's lazy dictionaries and right-to-left layout in a real browser
 * (Playwright/Chromium; npm run test:dashboard-browser). The static page and
 * its files come from public/, the API from fixtures.
 *
 *  - ja and en fetch no dictionary file; ko fetches ko.json once; es_AR fetches
 *    its chain (es_AR, es_MX, es) and shows Spanish; pt_BR, with no file yet,
 *    shows English and no raw keys;
 *  - switching in the picker loads the new language and re-renders, and the
 *    guide view follows;
 *  - ar and he_IL set dir="rtl": the menu moves to the right, nothing scrolls
 *    sideways at desktop or phone width; back to en is ltr again.
 */
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { chromium } from '@playwright/test';

const ko = JSON.parse(await readFile(new URL('../public/dashboard-i18n/ko.json', import.meta.url), 'utf8'));
const es = JSON.parse(await readFile(new URL('../public/dashboard-i18n/es.json', import.meta.url), 'utf8'));
const artifacts = process.env.DASH_I18N_QA_OUTPUT || `${tmpdir()}/nurevo-dashboard-i18n-qa`;
await mkdir(artifacts, { recursive: true });
const launch = { headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' };
const browser = await chromium.launch(launch);
const SITE = { id: 'abc123def456', url: 'example.com', key: 'nrv_k', install_type: 'wp', status: 'active', checklist: [], fill: { filled: 6, total: 6, pct: 100 }, plan: 'free', schema_types: 3, bound: true };

async function open(query, { viewport = { width: 1280, height: 900 }, hash = '#summary' } = {}) {
  const page = await browser.newPage({ viewport, locale: 'en-US' });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  const dicts = [];
  await page.route('https://nurevo.test/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith('/api/')) {
      let data = {};
      if (path === '/api/me') data = { email: 'qa@example.test', role: 'operator', language: null, dashboard_locale: null };
      if (path === '/api/sites') data = { sites: [SITE] };
      if (path === '/api/crawlers') data = { crawlers: [] };
      if (path === '/api/partner') data = { referrals: [] };
      return route.fulfill({ json: data });
    }
    const m = /^\/dashboard-i18n\/(\w+)\.json$/.exec(path);
    if (m) dicts.push(m[1]);
    try {
      const body = await readFile(new URL(path === '/dashboard' ? '../public/dashboard.html' : `../public${path}`, import.meta.url));
      return route.fulfill({ body, contentType: path === '/dashboard' ? 'text/html' : path.endsWith('.js') ? 'text/javascript' : path.endsWith('.json') ? 'application/json' : 'image/png' });
    } catch { return route.fulfill({ status: 404, body: '' }); }
  });
  await page.goto(`https://nurevo.test/dashboard${query}${hash}`);
  await page.locator('#main .top, #main h1').first().waitFor();
  await page.waitForLoadState('networkidle');
  return { page, errors, dicts };
}
const html = (page) => page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir, h1: document.querySelector('#main h1')?.textContent, nav: document.querySelector('[data-k="sites"]')?.textContent, text: document.querySelector('#main').innerText }));
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

try {
  {
    const { page, errors, dicts } = await open('?lang=ja');
    assert.deepEqual(dicts, [], 'ja: no dictionary fetch');
    assert.equal((await html(page)).nav, 'サイト');
    assert.deepEqual(errors, []);
    await page.close();
  }
  {
    const { page, errors, dicts } = await open('?lang=ko');
    const h = await html(page);
    assert.deepEqual(dicts, ['ko'], 'ko.json, once');
    assert.equal(h.lang, 'ko');
    assert.equal(h.nav, ko.sites, 'the menu is Korean');
    assert.equal(h.h1, ko.title);
    // The picker switches and loads on demand.
    await page.locator('#lang').selectOption('es_AR');
    await page.waitForFunction((w) => document.querySelector('[data-k="sites"]').textContent === w, es.sites);
    assert.deepEqual([...dicts].sort(), ['es', 'es_AR', 'es_MX', 'ko'], 'es_AR walks its chain');
    assert.equal((await html(page)).lang, 'es-AR');
    assert.equal(await page.evaluate(() => localStorage.getItem('nrv-dash-lang')), 'es_AR');
    // The guide follows the language.
    await page.locator('[data-view="guide"]').click();
    await page.locator('.nrv-guide').waitFor();
    assert.ok((await html(page)).h1 === es['guide.content.title'], 'the guide in Spanish');
    await page.locator('#lang').selectOption('ko');
    await page.waitForFunction((w) => document.querySelector('#main h1')?.textContent === w, ko['guide.content.title']);
    assert.deepEqual(errors, []);
    await page.close();
  }
  {
    const { page, errors, dicts } = await open('?lang=pt_BR');
    const h = await html(page);
    assert.deepEqual(dicts, ['pt_BR'], 'pt_BR is asked for');
    assert.equal(h.lang, 'pt-BR');
    assert.equal(h.nav, 'Sites', 'and shows English until it is translated');
    assert.ok(!/\b(?:am|sv|mb|pa|pt|pl|ob|os|rs)[A-Z]\w*\b/.test(h.text), 'no raw keys');
    assert.equal(await page.locator('#lang option').count(), 60, 'the picker lists all 60');
    assert.deepEqual(errors, []);
    await page.close();
  }
  for (const [code, viewport, name] of [['ar', { width: 1280, height: 900 }, 'desktop'], ['he_IL', { width: 390, height: 844 }, 'phone'], ['fa_IR', { width: 1280, height: 900 }, 'site']]) {
    const { page, errors } = await open(`?lang=${code}`, { viewport, hash: name === 'site' ? `#site:${SITE.id}` : '#summary' });
    const h = await html(page);
    assert.equal(h.dir, 'rtl', `${code}: dir=rtl`);
    assert.ok(await overflow(page) <= 1, `${code} (${name}): nothing scrolls sideways (${await overflow(page)}px)`);
    const side = await page.locator('.side').boundingBox();
    const main = await page.locator('#main').boundingBox();
    if (name !== 'phone') assert.ok(side.x > main.x, `${code}: the menu is on the right (${side.x} > ${main.x})`);
    else assert.ok(side.y < main.y, `${code}: the menu is the top bar on a phone`);
    await page.screenshot({ path: `${artifacts}/rtl-${code}-${name}.png`, fullPage: true });
    await page.locator('#lang').selectOption('en');
    await page.waitForFunction(() => document.documentElement.dir === 'ltr');
    const back = await page.locator('.side').boundingBox();
    if (name !== 'phone') assert.ok(back.x < (await page.locator('#main').boundingBox()).x, `${code} -> en: the menu is on the left again`);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(`PASS: dashboard lazy dictionaries (ja none, ko once, es_AR chain, pt_BR English fallback, picker switch, guide) and RTL layout (ar desktop, he_IL phone, fa_IR site page; no sideways scroll; back to ltr). Screenshots: ${artifacts}`);
} finally {
  await browser.close();
}
