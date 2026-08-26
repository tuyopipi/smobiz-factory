#!/usr/bin/env node

import { spawn } from "node:child_process";

const port = Number(process.env.FAQ_SCHEMA_WORKER_PORT || 8798);
const origin = `http://127.0.0.1:${port}`;
const host = `faq-schema-${Date.now()}.test`;
const adminToken = "faq-schema-local-admin";
let workerLogs = "";

const worker = spawn("npx", [
  "wrangler", "dev", "--local", "--ip", "127.0.0.1", "--port", String(port),
  "--show-interactive-dev-session=false",
  "--var", `WEBMCP_ADMIN_TOKEN:${adminToken}`
], {
  cwd: new URL("..", import.meta.url).pathname,
  env: { ...process.env, WRANGLER_LOG_PATH: "/tmp/webmcp-faq-schema-wrangler.log" },
  stdio: ["ignore", "pipe", "pipe"]
});
worker.stdout.on("data", (chunk) => { workerLogs += chunk; });
worker.stderr.on("data", (chunk) => { workerLogs += chunk; });

try {
  await waitFor(`${origin}/tag.js`);
  const issued = await post(`${origin}/api/site-key`, {
    siteUrl: `https://${host}/`,
    email: `faq-owner-${Date.now()}@example.com`
  });
  await post(`${origin}/api/site-key/plan`, { siteKey: issued.siteKey, plan: "pro" }, adminHeaders());

  await post(`${origin}/api/page-meta`, {
    siteKey: issued.siteKey,
    host,
    pathname: "/faq",
    meta: {
      title: "Shipping FAQ",
      description: "Frequently asked questions and answers about shipping.",
      headings: [
        { level: "h1", text: "Shipping FAQ" },
        { level: "h2", text: "Q: How long does delivery take?" },
        { level: "h3", text: "A: Standard delivery takes three business days." },
        { level: "h2", text: "Q: Can I track my order?" },
        { level: "h3", text: "A: Yes. Use the tracking link in your shipping email." }
      ],
      jsonLd: [JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How long does delivery take?",
            acceptedAnswer: { "@type": "Answer", text: "Standard delivery takes three business days." }
          },
          {
            "@type": "Question",
            name: "Can I track my order?",
            acceptedAnswer: { "@type": "Answer", text: "Yes. Use the tracking link in your shipping email." }
          }
        ]
      })]
    }
  });

  const faqQuery = query(issued.siteKey, host, "/faq");
  const faq = await get(`${origin}/api/faq-schema?${faqQuery}`);
  assert(faq.status === 200, `FAQ metadata should return 200, got ${faq.status}`);
  assert(faq.body?.["@type"] === "FAQPage", "response should be FAQPage JSON-LD");
  assert(faq.body.mainEntity?.length >= 1, "FAQPage should contain at least one validated pair");
  assert(faq.body.mainEntity.every((item) => item.name && item.acceptedAnswer?.text), "every FAQ must have question and answer");
  const faqCached = await get(`${origin}/api/faq-schema?${faqQuery}`);
  assert(faqCached.status === 200, "cached FAQ request should return 200");

  await post(`${origin}/api/page-meta`, {
    siteKey: issued.siteKey,
    host,
    pathname: "/about",
    meta: {
      title: "About our laboratory",
      description: "This page introduces the laboratory history and location.",
      headings: [{ level: "h1", text: "About the laboratory" }],
      jsonLd: []
    }
  });
  const emptyQuery = query(issued.siteKey, host, "/about");
  const empty = await get(`${origin}/api/faq-schema?${emptyQuery}`);
  assert(empty.status === 404, `non-FAQ metadata should return 404, got ${empty.status}`);
  const emptyCached = await get(`${origin}/api/faq-schema?${emptyQuery}`);
  assert(emptyCached.status === 404, "cached empty FAQ request should remain 404");

  await new Promise((resolve) => setTimeout(resolve, 100));
  assert(countLog("faq_schema_openai_call") === 2, "OpenAI should be called once per distinct page-meta content hash");
  assert(countLog("faq_schema_cache_hit") === 2, "second request for both results should hit cache");
  console.log(JSON.stringify({
    ok: true,
    modelCalls: countLog("faq_schema_openai_call"),
    cacheHits: countLog("faq_schema_cache_hit"),
    faqCount: faq.body.mainEntity.length,
    emptyResultVerified: true
  }));
} finally {
  worker.kill("SIGTERM");
}

function query(siteKey, requestedHost, pathname) {
  return new URLSearchParams({ site_key: siteKey, host: requestedHost, pathname }).toString();
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

async function get(url) {
  const response = await fetch(url);
  return { status: response.status, body: await response.json() };
}

function adminHeaders() {
  return { "x-webmcp-admin-token": adminToken };
}

function assert(condition, message) {
  if (!condition) throw new Error(`${message}\n${workerLogs}`);
}
