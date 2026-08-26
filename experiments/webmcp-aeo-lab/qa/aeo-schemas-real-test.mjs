#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const port = Number(process.env.AEO_SCHEMAS_WORKER_PORT || 8800);
const origin = `http://127.0.0.1:${port}`;
const host = `aeo-schemas-${Date.now()}.test`;
const adminToken = "aeo-schemas-local-admin";
let workerLogs = "";

const worker = spawn("npx", [
  "wrangler", "dev", "--local", "--ip", "127.0.0.1", "--port", String(port),
  "--show-interactive-dev-session=false",
  "--var", `WEBMCP_ADMIN_TOKEN:${adminToken}`
], {
  cwd: new URL("..", import.meta.url).pathname,
  env: { ...process.env, WRANGLER_LOG_PATH: "/tmp/webmcp-aeo-schemas-wrangler.log" },
  stdio: ["ignore", "pipe", "pipe"]
});
worker.stdout.on("data", (chunk) => { workerLogs += chunk; });
worker.stderr.on("data", (chunk) => { workerLogs += chunk; });

let browser;
try {
  await waitFor(`${origin}/tag.js`);
  const issued = await post(`${origin}/api/site-key`, {
    siteUrl: `https://${host}/`,
    email: `aeo-owner-${Date.now()}@example.com`
  });
  await post(`${origin}/api/site-key/plan`, { siteKey: issued.siteKey, plan: "pro" }, adminHeaders());

  await storeMeta(issued.siteKey, "/complete", completeMeta());
  const complete = await getSchemas(issued.siteKey, "/complete");
  assert(complete.status === 200, "complete metadata should return 200");
  assertTypes(complete.body.schemas, ["Organization", "FAQPage", "BlogPosting"]);
  const completeCached = await getSchemas(issued.siteKey, "/complete");
  assertTypes(completeCached.body.schemas, ["Organization", "FAQPage", "BlogPosting"]);

  await storeMeta(issued.siteKey, "/company", organizationMeta());
  const partial = await getSchemas(issued.siteKey, "/company");
  assert(partial.status === 200, "partial metadata should return 200");
  assertTypes(partial.body.schemas, ["Organization"]);
  const partialCached = await getSchemas(issued.siteKey, "/company");
  assertTypes(partialCached.body.schemas, ["Organization"]);

  await storeMeta(issued.siteKey, "/plain", plainMeta());
  const empty = await getSchemas(issued.siteKey, "/plain");
  assert(empty.status === 200 && Array.isArray(empty.body.schemas) && empty.body.schemas.length === 0, "plain metadata should return an empty schema array");
  const emptyCached = await getSchemas(issued.siteKey, "/plain");
  assert(emptyCached.status === 200 && emptyCached.body.schemas.length === 0, "empty schema result should be cached");

  await new Promise((resolve) => setTimeout(resolve, 100));
  assert(countLog("_schema_openai_call") === 9, "three extractors should run once for each of three distinct metadata hashes");
  assert(countLog("_schema_cache_hit") === 9, "the second integrated request should reuse all three caches");

  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  });
  const page = await browser.newPage();
  const sourceHtml = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const html = sourceHtml.replace("</head>", '<script id="webmcp-aeo-content" type="application/ld+json">{"stale":true}</script></head>');
  await page.route(`${origin}/`, (route) => route.fulfill({ status: 200, contentType: "text/html", body: html }));
  await page.route("**/api/agent-authorization*", (route) => route.fulfill({ json: { registered: true, quality: "high", reason: "local test" } }));
  await page.route("**/api/page-meta", (route) => route.fulfill({ json: { ok: true } }));
  await page.route("**/api/aeo-schemas*", (route) => route.fulfill({ json: complete.body }));
  await page.route("**/api/mcp-definition", (route) => route.fulfill({ json: { tools: [], autofill: [], webmcp: {}, aeo: null, formHash: "test" } }));
  await page.goto(`${origin}/`);
  await page.waitForFunction(() => window.__webmcpAeoContent?.length === 3);
  const injection = await page.evaluate(() => {
    const scripts = [...document.querySelectorAll("#webmcp-aeo-content")];
    const metadataScript = document.getElementById("webmcp-aeo-metadata");
    return {
      count: scripts.length,
      parsed: JSON.parse(scripts[0]?.textContent || "{}"),
      contentState: window.__webmcpAeoContent,
      metadataIdIsSeparate: !metadataScript || metadataScript.id !== scripts[0]?.id
    };
  });
  assert(injection.count === 1, "tag.js should overwrite the existing content script without duplication");
  assert(injection.parsed?.["@graph"]?.length === 3, "multiple content schemas should be injected as @graph");
  assert(injection.metadataIdIsSeparate, "content schema ID must remain separate from WebApplication metadata ID");

  console.log(JSON.stringify({
    ok: true,
    completeTypes: complete.body.schemas.map((schema) => schema["@type"]),
    partialTypes: partial.body.schemas.map((schema) => schema["@type"]),
    emptyCount: empty.body.schemas.length,
    modelCalls: countLog("_schema_openai_call"),
    cacheHits: countLog("_schema_cache_hit"),
    injectedScriptCount: injection.count,
    injectedGraphCount: injection.parsed["@graph"].length
  }));
} finally {
  if (browser) await browser.close();
  worker.kill("SIGTERM");
}

function completeMeta() {
  return {
    title: "Nurevo Edge AI FAQ and Release Article",
    description: "A release article from Nurevo Inc. with answers about the Edge AI launch.",
    openGraph: { type: "article", siteName: "Nurevo Inc." },
    headings: [
      { level: "h1", text: "Nurevo launches Edge AI" },
      { level: "h2", text: "Q: When is Edge AI available?" },
      { level: "h3", text: "A: Edge AI is available on August 20, 2026." }
    ],
    canonicalUrl: `https://${host}/complete`,
    jsonLd: [
      JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "Nurevo Inc.", url: `https://${host}/`, logo: `https://${host}/logo.png` }),
      JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "When is Edge AI available?", acceptedAnswer: { "@type": "Answer", text: "Edge AI is available on August 20, 2026." } }] }),
      JSON.stringify({ "@context": "https://schema.org", "@type": "BlogPosting", headline: "Nurevo launches Edge AI", author: { "@type": "Person", name: "Aiko Tanaka" }, datePublished: "2026-08-20" })
    ]
  };
}

function organizationMeta() {
  return {
    title: "About Nurevo Inc.",
    description: "Official company profile for Nurevo Inc.",
    openGraph: { type: "website", siteName: "Nurevo Inc." },
    headings: [{ level: "h1", text: "About Nurevo Inc." }],
    canonicalUrl: `https://${host}/company`,
    jsonLd: [JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "Nurevo Inc.", url: `https://${host}/` })]
  };
}

function plainMeta() {
  return {
    title: "Welcome",
    description: "A generic landing page.",
    openGraph: { type: "website" },
    headings: [{ level: "h1", text: "Welcome" }],
    jsonLd: []
  };
}

async function storeMeta(siteKey, pathname, meta) {
  return post(`${origin}/api/page-meta`, { siteKey, host, pathname, meta });
}

async function getSchemas(siteKey, pathname) {
  const query = new URLSearchParams({ site_key: siteKey, host, pathname });
  const response = await fetch(`${origin}/api/aeo-schemas?${query}`);
  return { status: response.status, body: await response.json() };
}

function assertTypes(schemas, expected) {
  const actual = schemas.map((schema) => schema["@type"]).sort();
  const wanted = [...expected].sort();
  assert(JSON.stringify(actual) === JSON.stringify(wanted), `expected schema types ${wanted}, got ${actual}`);
}

function countLog(marker) {
  return workerLogs.split(marker).length - 1;
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}\n${workerLogs}`);
}

async function post(url, body, headers = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`${url} failed ${response.status}: ${JSON.stringify(result)}`);
  return result;
}

function adminHeaders() {
  return { "x-webmcp-admin-token": adminToken };
}

function assert(condition, message) {
  if (!condition) throw new Error(`${message}\n${workerLogs}`);
}
