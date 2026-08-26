#!/usr/bin/env node

const origin = process.env.PUBLIC_ORIGIN;
if (!origin) {
  console.error("PUBLIC_ORIGIN is required, for example https://webmcp-canary.example.workers.dev");
  process.exit(2);
}

const url = new URL("/api/traffic-health", origin);
const headers = {};
if (process.env.WEBMCP_ADMIN_TOKEN) {
  headers["x-webmcp-admin-token"] = process.env.WEBMCP_ADMIN_TOKEN;
}
const response = await fetch(url, { headers });
const body = await response.json().catch(() => ({}));

if (!response.ok || body.ok !== true) {
  console.error("traffic-rollback-guard: unhealthy traffic detected");
  console.error(JSON.stringify(body, null, 2));
  process.exit(1);
}

console.log("traffic-rollback-guard: ok");
console.log(JSON.stringify({
  generatedAt: body.generatedAt,
  config: body.config,
  sites: Object.keys(body.sites || {}).length
}, null, 2));
