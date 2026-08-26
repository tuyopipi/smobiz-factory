#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createServer } from "node:http";

const workerPort = Number(process.env.ORG_SCHEMA_WORKER_PORT || 8796);
const mockPort = Number(process.env.ORG_SCHEMA_MOCK_PORT || 8797);
const workerOrigin = `http://127.0.0.1:${workerPort}`;
const host = `org-schema-${Date.now()}.test`;
const adminToken = "org-schema-local-admin";
let openAiCalls = 0;

const mockOpenAi = createServer(async (request, response) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  openAiCalls += 1;
  const pageMeta = JSON.parse(payload.messages?.find((message) => message.role === "user")?.content || "{}");
  const extracted = pageMeta.title?.includes("Acme")
    ? {
        name: "Acme Inc.",
        url: "https://acme.example/about",
        logo: "javascript:alert(1)",
        description: "Clearly described Acme organization.",
        sameAs: ["https://social.example/acme", "not-a-url"]
      }
    : { name: "", url: "", logo: "", description: "", sameAs: [] };
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(extracted) } }] }));
});
await new Promise((resolve) => mockOpenAi.listen(mockPort, "127.0.0.1", resolve));

const worker = spawn("npx", [
  "wrangler", "dev", "--local", "--ip", "127.0.0.1", "--port", String(workerPort),
  "--show-interactive-dev-session=false",
  "--var", `WEBMCP_ADMIN_TOKEN:${adminToken}`,
  "--var", "OPENAI_API_KEY:local-mock-key",
  "--var", `OPENAI_API_URL:http://127.0.0.1:${mockPort}/v1/chat/completions`
], {
  cwd: new URL("..", import.meta.url).pathname,
  env: { ...process.env, WRANGLER_LOG_PATH: "/tmp/webmcp-org-schema-wrangler.log" },
  stdio: ["ignore", "pipe", "pipe"]
});
let workerLogs = "";
worker.stdout.on("data", (chunk) => { workerLogs += chunk; });
worker.stderr.on("data", (chunk) => { workerLogs += chunk; });

try {
  await waitFor(`${workerOrigin}/tag.js`);
  const issued = await post(`${workerOrigin}/api/site-key`, {
    siteUrl: `https://${host}/`,
    email: `owner-${Date.now()}@example.com`
  });
  await post(`${workerOrigin}/api/site-key/plan`, { siteKey: issued.siteKey, plan: "pro" }, adminHeaders());

  await post(`${workerOrigin}/api/page-meta`, {
    siteKey: issued.siteKey,
    host,
    pathname: "/company",
    meta: {
      title: "Acme Inc. | Company",
      description: "Official company profile for Acme Inc.",
      openGraph: { siteName: "Acme Inc." },
      canonicalUrl: "https://acme.example/about",
      headings: [{ level: "h1", text: "About Acme Inc." }],
      jsonLd: []
    }
  });
  const query = `site_key=${encodeURIComponent(issued.siteKey)}&host=${encodeURIComponent(host)}&pathname=%2Fcompany`;
  const first = await get(`${workerOrigin}/api/org-schema?${query}`);
  assert(first.status === 200 && first.body.name === "Acme Inc.", "clear organization metadata should produce a schema");
  assert(!("logo" in first.body), "invalid logo URL should be removed");
  assert(first.body.sameAs?.length === 1, "invalid sameAs URL should be removed");
  const second = await get(`${workerOrigin}/api/org-schema?${query}`);
  assert(second.status === 200 && openAiCalls === 1, "second request should use KV cache");

  await post(`${workerOrigin}/api/page-meta`, {
    siteKey: issued.siteKey,
    host,
    pathname: "/plain",
    meta: { title: "Welcome", description: "A page without company information." }
  });
  const emptyQuery = `site_key=${encodeURIComponent(issued.siteKey)}&host=${encodeURIComponent(host)}&pathname=%2Fplain`;
  const empty = await get(`${workerOrigin}/api/org-schema?${emptyQuery}`);
  assert(empty.status === 404, "metadata without clear organization info should not produce a schema");
  const emptyCached = await get(`${workerOrigin}/api/org-schema?${emptyQuery}`);
  assert(emptyCached.status === 404 && openAiCalls === 2, "empty extraction should also be cached");
  assert(workerLogs.includes("org_schema_openai_call") && workerLogs.includes("org_schema_cache_hit"), "worker logs should show calls and cache hits");
  console.log(JSON.stringify({ ok: true, openAiCalls, cacheVerified: true, emptyResultVerified: true }));
} finally {
  worker.kill("SIGTERM");
  await new Promise((resolve) => mockOpenAi.close(resolve));
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
  const body = await response.json();
  return { status: response.status, body };
}

function adminHeaders() {
  return { "x-webmcp-admin-token": adminToken };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
