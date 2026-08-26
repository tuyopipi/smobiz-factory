#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

const root = new URL("..", import.meta.url).pathname;
const port = Number(process.env.HEADLESS_PORT || 8766);
const origin = `http://127.0.0.1:${port}`;
let issuedSiteKey = "";

const child = spawn("npx", [
  "wrangler@latest",
  "dev",
  "--ip", "127.0.0.1",
  "--port", String(port),
  "--local",
  "--var", "WEBMCP_ADMIN_TOKEN:headless-admin-token",
  "--show-interactive-dev-session=false"
], {
  cwd: root,
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"]
});

try {
  await waitFor(`${origin}/`);
  let issued = await fetch(`${origin}/api/site-key`, {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": "127.0.0.2" },
    body: JSON.stringify({ siteUrl: origin, email: `headless-${Date.now()}@example.test` })
  }).then((response) => response.json());
  if (!issued.siteKey && issued.error === "duplicate_site_host") {
    const list = await fetch(`${origin}/api/site-keys`, {
      headers: { "x-webmcp-admin-token": "headless-admin-token" }
    }).then((response) => response.json());
    issued = list.siteKeys.find((item) => item.status === "active" && item.siteHost === new URL(origin).host) || issued;
  }
  assert(issued.siteKey, "headless test site key should be issued");
  issuedSiteKey = issued.siteKey;
  await fetch(`${origin}/api/site-key/plan`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-webmcp-admin-token": "headless-admin-token" },
    body: JSON.stringify({ siteKey: issued.siteKey, plan: "pro" })
  });
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  });
  const page = await browser.newPage();
  await page.route(`${origin}/`, async (route) => {
    const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: html.replace('<script src="/tag.js" async></script>', `<script src="/tag.js" async data-webmcp-site-key="${issued.siteKey}"></script>`)
    });
  });
  await page.addInitScript(() => {
    const registered = [];
    const beacons = [];
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value(url, data) {
        Promise.resolve(data?.text ? data.text() : String(data || "")).then((text) => {
          beacons.push({ url, body: JSON.parse(text) });
        });
        return true;
      }
    });
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        async registerTool(tool, options) {
          registered.push({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema, annotations: tool.annotations, execute: tool.execute });
          options?.signal?.addEventListener("abort", () => {
            const index = registered.findIndex((item) => item.name === tool.name);
            if (index >= 0) registered.splice(index, 1);
          });
        }
      }
    });
    window.__registeredWebMcpTools = registered;
    window.__webmcpBeacons = beacons;
  });
  await page.goto(`${origin}/`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__webmcpDemo?.mcpDefinition?.tools?.length > 0);
  const result = await page.evaluate(() => ({
    demo: window.__webmcpDemo,
    aeo: window.__webmcpAeo,
    registered: window.__registeredWebMcpTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: tool.annotations
    })),
    forms: window.__webmcpDemo.forms,
    excludedForms: window.__webmcpDemo.excludedForms,
    declarative: {
      contactToolname: document.querySelector("#contact-form")?.getAttribute("toolname"),
      newsletterToolname: document.querySelector("#newsletter-form")?.getAttribute("toolname"),
      searchToolname: document.querySelector("#search-form")?.getAttribute("toolname"),
      tooldescription: document.querySelector("#contact-form")?.getAttribute("tooldescription"),
      phoneParam: document.querySelector("#phone")?.getAttribute("toolparamdescription")
    }
  }));
  await page.click("#add-company");
  await page.waitForFunction(() => {
    const contactTool = window.__registeredWebMcpTools.find((tool) => tool.name.includes("contact_form"));
    return Boolean(contactTool?.inputSchema?.properties?.company);
  });
  const dynamicUpdate = await page.evaluate(() => {
    const contactTool = window.__registeredWebMcpTools.find((tool) => tool.name.includes("contact_form"));
    return {
      toolCount: window.__registeredWebMcpTools.length,
      hasCompany: Boolean(contactTool?.inputSchema?.properties?.company)
    };
  });
  const execution = await page.evaluate(async () => {
    const contactTool = window.__registeredWebMcpTools.find((tool) => tool.name.includes("contact_form"));
    const newsletterTool = window.__registeredWebMcpTools.find((tool) => tool.name.includes("newsletter_form"));
    return {
      contact: await contactTool.execute({ name: "山田 太郎", email: "test@example.com", phone: "09012345678", message: "テスト問い合わせ", company: "株式会社テスト" }),
      newsletter: await newsletterTool.execute({ newsletter_email: "news@example.com", newsletter_name: "ニュース 太郎" })
    };
  });
  const footprints = await page.evaluate(async () => {
    document.querySelector("#contact-form").requestSubmit();
    document.querySelector("#newsletter-form").requestSubmit();
    await new Promise((resolve) => setTimeout(resolve, 100));
    return window.__webmcpBeacons.map((beacon) => beacon.body);
  });
  await browser.close();

  assert(result.demo.available === true, "document.modelContext should be detected");
  assert(result.registered.length === 2, "contact and newsletter tools should register");
  assert(result.forms.length === 2, "two eligible forms should be exposed in debug state");
  assert(result.excludedForms.some((form) => form.reason === "search-only-form"), "search form should be excluded");
  assert(new Set(result.registered.map((tool) => tool.name)).size === 2, "registered tool names should be unique");
  assert(result.registered[0].inputSchema?.type === "object", "registered tool should include inputSchema");
  assert(typeof result.registered[0].annotations?.readOnlyHint === "boolean", "registered tool should include MCP annotations");
  assert(result.declarative.contactToolname, "contact form should include declarative toolname");
  assert(result.declarative.newsletterToolname, "newsletter form should include declarative toolname");
  assert(!result.declarative.searchToolname, "search form should not include declarative toolname");
  assert(result.declarative.tooldescription, "form should include declarative tooldescription");
  assert(result.declarative.phoneParam, "field should include declarative toolparamdescription");
  assert(dynamicUpdate.toolCount === 2 && dynamicUpdate.hasCompany, "toolchange should update the contact form schema without duplicating tools");
  assert(execution?.contact?.structuredContent?.formId === "contact-form", "contact execution should target contact form");
  assert(execution?.newsletter?.structuredContent?.formId === "newsletter-form", "newsletter execution should target newsletter form");
  assert(footprints.length === 2, "two form footprints should be recorded independently");
  assert(new Set(footprints.map((footprint) => footprint.formHash)).size === 2, "footprints should use distinct form hashes");
  assert(footprints.some((footprint) => footprint.formStructure?.formId === "contact-form"), "contact footprint should keep its form identity");
  assert(footprints.some((footprint) => footprint.formStructure?.formId === "newsletter-form"), "newsletter footprint should keep its form identity");
  assert(Array.isArray(result.aeo) && result.aeo.length === 2, "AEO metadata should be injected per eligible form");
  console.log("headless-webmcp-registration: ok");
} finally {
  if (issuedSiteKey) {
    await fetch(`${origin}/api/site-key/disable`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-webmcp-admin-token": "headless-admin-token" },
      body: JSON.stringify({ siteKey: issuedSiteKey })
    }).catch(() => {});
  }
  child.kill("SIGTERM");
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
