#!/usr/bin/env node

import { chromium } from "playwright";

const wpOrigin = process.env.WP_ORIGIN || "http://127.0.0.1:8080";
const adminUser = process.env.WP_ADMIN_USER || "admin";
const adminPassword = process.env.WP_ADMIN_PASSWORD || "password";
const apiOrigin = process.env.WEBMCP_ORIGIN || "https://webmcp-canary.nurevo.workers.dev";

const browser = await chromium.launch({ headless: true });
const adminContext = await browser.newContext();
const page = await adminContext.newPage();
const footprints = [];
const consoleLines = [];
const failedRequests = [];

page.on("console", (message) => {
  const text = message.text();
  if (text.includes("webmcp") || text.includes("wpcf7")) consoleLines.push(text);
});
page.on("requestfailed", (request) => {
  failedRequests.push({ url: request.url(), failure: request.failure()?.errorText || "" });
});
page.on("request", async (request) => {
  if (request.url().startsWith(`${apiOrigin}/api/footprint`)) {
    const data = request.postData() || "";
    try {
      footprints.push(JSON.parse(data));
    } catch {
      footprints.push({ parseError: true, rawLength: data.length });
    }
  }
});

try {
  await page.goto(`${wpOrigin}/wp-login.php`, { waitUntil: "networkidle" });
  await page.fill("#user_login", adminUser);
  await page.fill("#user_pass", adminPassword);
  await page.click("#wp-submit");
  await page.waitForURL(/wp-admin/);

  await page.goto(`${wpOrigin}/wp-admin/admin.php?page=webmcp-canary-settings`, { waitUntil: "networkidle" });
  const settingsTitle = await page.locator("h1").first().textContent();
  const issueButton = page.getByRole("button", { name: /Issue free site key/i });
  if (await issueButton.count()) {
    await Promise.all([
      page.waitForLoadState("networkidle"),
      issueButton.click()
    ]);
  }
  await page.goto(`${wpOrigin}/wp-admin/admin.php?page=webmcp-canary-settings`, { waitUntil: "networkidle" });
  const siteKey = await page.locator('input[name="webmcp_canary_settings[site_key]"]').inputValue();
  const tagUrl = await page.locator('input[name="webmcp_canary_settings[tag_url]"]').inputValue();
  const enabled = await page.locator('input[name="webmcp_canary_settings[enabled]"]').isChecked();
  if (!enabled) {
    await page.locator('input[name="webmcp_canary_settings[enabled]"]').check();
    await Promise.all([
      page.waitForLoadState("networkidle"),
      page.getByRole("button", { name: /^Save Changes$/i }).click()
    ]);
  }

  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();
  publicPage.on("console", (message) => {
    const text = message.text();
    if (text.includes("webmcp") || text.includes("wpcf7")) consoleLines.push(text);
  });
  publicPage.on("requestfailed", (request) => {
    failedRequests.push({ url: request.url(), failure: request.failure()?.errorText || "" });
  });
  publicPage.on("request", async (request) => {
    if (request.url().startsWith(`${apiOrigin}/api/footprint`)) {
      const data = request.postData() || "";
      try {
        footprints.push(JSON.parse(data));
      } catch {
        footprints.push({ parseError: true, rawLength: data.length });
      }
    }
  });

  await publicPage.goto(`${wpOrigin}/?page_id=7`, { waitUntil: "networkidle" });
  const noFormScripts = await publicPage.locator('script[src*="tag.js"]').count();

  await publicPage.goto(`${wpOrigin}/?page_id=10`, { waitUntil: "networkidle" });
  await publicPage.waitForSelector('form.wpcf7-form, form');
  await publicPage.waitForTimeout(1500);
  const tagPresent = await publicPage.locator('script[src*="tag.js"]').count();
  const declarative = await publicPage.evaluate(() => ({
    toolname: document.querySelector("form")?.getAttribute("toolname") || "",
    fields: [...document.querySelectorAll("input, textarea")].map((el) => ({
      name: el.getAttribute("name"),
      toolparamdescription: el.getAttribute("toolparamdescription") || "",
      pattern: el.getAttribute("pattern") || ""
    }))
  }));

  const cf7Submit = 'form.wpcf7-form input[type="submit"], form.wpcf7-form button[type="submit"], .wpcf7-submit';
  await publicPage.click(cf7Submit);
  await publicPage.waitForTimeout(2500);

  await publicPage.fill('input[name="your-name"]', "山田 太郎");
  await publicPage.fill('input[name="your-email"]', "not-an-email");
  await publicPage.fill('input[name="your-subject"]', "QA subject 090-1234-5678");
  await publicPage.fill('textarea[name="your-message"]', "メール test@example.com 電話 090-1234-5678 を含むQA");
  await publicPage.click(cf7Submit);
  await publicPage.waitForTimeout(2500);

  await publicPage.fill('input[name="your-email"]', "qa@example.com");
  await publicPage.click(cf7Submit);
  await publicPage.waitForTimeout(2500);

  await publicPage.click('input[name="your-name"]');
  await publicPage.waitForTimeout(300);
  await publicPage.click('body');
  await publicPage.waitForTimeout(500);

  await publicPage.goto(`${wpOrigin}/?page_id=11`, { waitUntil: "networkidle" });
  await publicPage.waitForTimeout(1500);
  await publicPage.fill("#std-name", "Success User");
  await publicPage.fill("#std-email", "success@example.com");
  await publicPage.click("#std-submit");
  await publicPage.waitForTimeout(1500);

  await publicPage.goto(`${wpOrigin}/?page_id=7`, { waitUntil: "networkidle" });
  await publicPage.waitForTimeout(1000);
  await publicContext.close();

  await page.goto(`${wpOrigin}/wp-admin/admin.php?page=webmcp-canary&webmcp_refresh=1`, { waitUntil: "networkidle" });
  const dashboardText = await page.locator("body").innerText();

  const summary = {
    settingsTitle,
    siteKey,
    tagUrl,
    tagPresent,
    noFormScripts,
    declarative,
    footprints: footprints.map((fp) => ({
      status: fp.result?.status,
      host: fp.site?.host,
      pathname: fp.site?.pathname,
      eventCount: fp.events?.length || 0,
      eventSamples: (fp.events || []).slice(0, 3)
    })),
    dashboard: {
      collecting: dashboardText.includes("Collecting data"),
      suggestions: dashboardText.includes("Improvement suggestions"),
      warning: dashboardText.includes("Could not connect") || dashboardText.includes("not configured"),
      textSample: dashboardText.slice(0, 1000)
    },
    failedRequests,
    consoleLines: consoleLines.slice(-30)
  };

  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
