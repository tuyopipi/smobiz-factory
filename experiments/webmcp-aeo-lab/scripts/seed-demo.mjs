#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const root = new URL("..", import.meta.url).pathname;
const origin = process.env.WEBMCP_ORIGIN || "http://127.0.0.1:8443";
const adminToken = process.env.WEBMCP_ADMIN_TOKEN || "local-wordpress-demo-admin-token";
const siteKey = process.env.WEBMCP_SITE_KEY || await findLocalDemoSiteKey(origin);

if (!siteKey) {
  console.error(`No active local WordPress site key found at ${origin}. Run npm run wp:demo first, or set WEBMCP_SITE_KEY.`);
  process.exit(1);
}

const direct = spawnSync(process.execPath, ["scripts/seed-demo-footprints.mjs"], {
  cwd: root,
  env: {
    ...process.env,
    WEBMCP_ORIGIN: origin,
    WEBMCP_SITE_KEY: siteKey,
    WEBMCP_ADMIN_TOKEN: adminToken
  },
  stdio: "inherit"
});

process.exit(direct.status ?? 1);

async function findLocalDemoSiteKey(origin) {
  try {
    const response = await fetch(new URL("/api/site-keys", origin), {
      headers: { "x-webmcp-admin-token": adminToken }
    });
    if (!response.ok) return "";
    const body = await response.json();
    const keys = Array.isArray(body.siteKeys) ? body.siteKeys : [];
    const local = keys.find((record) =>
      record.status === "active" &&
      (record.siteHost === "localhost:8080" || record.siteUrl === "http://localhost:8080")
    );
    return local?.siteKey || "";
  } catch {
    return "";
  }
}
