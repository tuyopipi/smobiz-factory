#!/usr/bin/env node

import assert from "node:assert/strict";
import { chromium } from "playwright";

const origin = process.env.NUREVO_LOCAL_ORIGIN || "http://127.0.0.1:8443";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
});
const page = await browser.newPage();
const site = {
  id: "0123456789abcdef01234567",
  url: "https://client.example",
  install_type: "wp",
  bound: false,
  plan: "free",
  schema_types: 0,
  crawler_allowed: 0,
  fill: { filled: 0, total: 5 }
};
let created = false;
let sitePolls = 0;
let detailPulled = false;
let diagnosisStarted = false;
let billingRequested = false;
let role = "member";

await page.route("**/api/**", async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  const path = url.pathname;
  const json = (body) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  if (path === "/api/me") return json({ email: "owner@example.com", role });
  if (path === "/api/crawlers") return json({ crawlers: [] });
  if (path === "/api/billing/summary") { billingRequested = true; return json({}); }
  if (path === "/api/sites" && request.method() === "POST") { created = true; return json(site); }
  if (path === "/api/sites" && request.method() === "GET") {
    if (!created) return json({ sites: [] });
    sitePolls += 1;
    if (sitePolls >= 2) Object.assign(site, { bound: true, domain_key: "client.example", bound_via: "pairing" });
    return json({ sites: [site] });
  }
  if (path.endsWith("/pairing-code")) return json({ pairing_code: "NRV-ABCDE-FGHIJ-KLMNO-PQRST" });
  if (path.endsWith("/aeo-score")) { diagnosisStarted = true; return json({ score: 62 }); }
  if (path === `/api/sites/${site.id}`) { detailPulled = true; return json({ site: { ...site, profile: { name: "QA Client" }, catalog: { items: [] } } }); }
  return json({});
});

try {
  await page.goto(`${origin}/dashboard`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "最初のクライアントサイトを追加" }).waitFor();
  assert.equal(await page.locator('.nav[data-view="billing"]:visible').count(), 0, "billing is hidden for a non-partner");

  await page.getByRole("button", { name: /クライアントのサイトを追加/ }).click();
  await page.locator('input[name="url"]').fill(site.url);
  await page.getByRole("button", { name: "次へ" }).click();
  await page.getByText("接続待ち…").waitFor();
  assert.equal(await page.locator('img[src="/assets/onboarding/wp-pairing-code.png"]').count(), 1, "the real WP screenshot is embedded");

  await page.getByRole("heading", { name: "接続済み" }).waitFor({ timeout: 10000 });
  assert.ok(detailPulled, "profile/catalog detail is pulled immediately");
  assert.ok(diagnosisStarted, "the first diagnosis starts immediately");
  assert.equal(billingRequested, false, "billing API is never called for a non-partner");

  await page.getByRole("button", { name: "サイト詳細を見る" }).click();
  await page.locator("#wpconn").waitFor({ timeout: 10000 });
  assert.equal(await page.locator(".card.panel h2", { hasText: "ライセンス接続" }).count(), 0, "the legacy duplicate connection card is removed");

  role = "agency";
  billingRequested = false;
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator('.nav[data-view="billing"]:visible').count(), 1, "billing is visible for an agency");
  assert.equal(billingRequested, true, "billing data is requested for an agency");

  console.log(JSON.stringify({ emptyState: true, waiting: true, connected: true, detailPulled, diagnosisStarted, memberBillingRequested: false, agencyBillingRequested: billingRequested, legacyConnectionCards: 0 }, null, 2));
} finally {
  await browser.close();
}
