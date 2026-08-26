#!/usr/bin/env node

import { spawn } from "node:child_process";

const port = Number(process.env.ARTICLE_SCHEMA_WORKER_PORT || 8799);
const origin = `http://127.0.0.1:${port}`;
const host = `article-schema-${Date.now()}.test`;
const adminToken = "article-schema-local-admin";
let workerLogs = "";

const worker = spawn("npx", [
  "wrangler", "dev", "--local", "--ip", "127.0.0.1", "--port", String(port),
  "--show-interactive-dev-session=false",
  "--var", `WEBMCP_ADMIN_TOKEN:${adminToken}`
], {
  cwd: new URL("..", import.meta.url).pathname,
  env: { ...process.env, WRANGLER_LOG_PATH: "/tmp/webmcp-article-schema-wrangler.log" },
  stdio: ["ignore", "pipe", "pipe"]
});
worker.stdout.on("data", (chunk) => { workerLogs += chunk; });
worker.stderr.on("data", (chunk) => { workerLogs += chunk; });

try {
  await waitFor(`${origin}/tag.js`);
  const issued = await post(`${origin}/api/site-key`, {
    siteUrl: `https://${host}/`,
    email: `article-owner-${Date.now()}@example.com`
  });
  await post(`${origin}/api/site-key/plan`, { siteKey: issued.siteKey, plan: "pro" }, adminHeaders());

  await storeMeta(issued.siteKey, "/blog/edge-ai", {
    title: "Building Reliable Edge AI | Engineering Blog",
    description: "A technical article about reliable AI workloads at the edge.",
    openGraph: { type: "article", title: "Building Reliable Edge AI" },
    headings: [{ level: "h1", text: "Building Reliable Edge AI" }],
    jsonLd: [JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: "Building Reliable Edge AI",
      description: "A technical article about reliable AI workloads at the edge.",
      author: { "@type": "Person", name: "Aiko Tanaka" },
      datePublished: "2026-08-20"
    })]
  });
  const full = await getSchema(issued.siteKey, "/blog/edge-ai");
  assert(full.status === 200 && full.body?.["@type"] === "BlogPosting", "article should return BlogPosting");
  assert(full.body.headline === "Building Reliable Edge AI", "article headline should be preserved");
  assert(full.body.author?.name === "Aiko Tanaka", "clearly stated author should be included");
  assert(full.body.datePublished === "2026-08-20", "valid ISO date should be included");
  assert(full.body.url === `https://${host}/blog/edge-ai`, "URL should be built from authorized host and pathname");
  assert((await getSchema(issued.siteKey, "/blog/edge-ai")).status === 200, "second article request should succeed from cache");

  await storeMeta(issued.siteKey, "/blog/cache-design", {
    title: "Designing Content-Addressed Caches | Engineering Blog",
    description: "An engineering blog post explaining content-addressed cache design.",
    openGraph: { type: "article", title: "Designing Content-Addressed Caches" },
    headings: [{ level: "h1", text: "Designing Content-Addressed Caches" }],
    jsonLd: [JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: "Designing Content-Addressed Caches",
      description: "An engineering blog post explaining content-addressed cache design."
    })]
  });
  const noByline = await getSchema(issued.siteKey, "/blog/cache-design");
  assert(noByline.status === 200 && noByline.body.headline === "Designing Content-Addressed Caches", "article without byline should still produce schema");
  assert(!("author" in noByline.body), "missing author must not be invented");
  assert(!("datePublished" in noByline.body), "missing publication date must not be invented");
  assert((await getSchema(issued.siteKey, "/blog/cache-design")).status === 200, "second no-byline request should succeed from cache");

  await storeMeta(issued.siteKey, "/about", {
    title: "About Example Company",
    description: "Company profile, office location, and business overview.",
    openGraph: { type: "website", title: "About Example Company" },
    headings: [{ level: "h1", text: "About the company" }],
    jsonLd: [JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "Example Company" })]
  });
  const nonArticle = await getSchema(issued.siteKey, "/about");
  assert(nonArticle.status === 404, `non-article should return 404, got ${nonArticle.status}`);
  assert((await getSchema(issued.siteKey, "/about")).status === 404, "cached non-article should remain 404");

  await new Promise((resolve) => setTimeout(resolve, 100));
  assert(countLog("article_schema_openai_call") === 3, "OpenAI should be called once for each distinct page-meta hash");
  assert(countLog("article_schema_cache_hit") === 3, "each second request should hit cache");
  console.log(JSON.stringify({
    ok: true,
    modelCalls: countLog("article_schema_openai_call"),
    cacheHits: countLog("article_schema_cache_hit"),
    articleWithAuthorAndDate: true,
    articleWithoutAuthorAndDate: true,
    nonArticleVerified: true
  }));
} finally {
  worker.kill("SIGTERM");
}

async function storeMeta(siteKey, pathname, meta) {
  return post(`${origin}/api/page-meta`, { siteKey, host, pathname, meta });
}

async function getSchema(siteKey, pathname) {
  const query = new URLSearchParams({ site_key: siteKey, host, pathname });
  const response = await fetch(`${origin}/api/article-schema?${query}`);
  return { status: response.status, body: await response.json() };
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
