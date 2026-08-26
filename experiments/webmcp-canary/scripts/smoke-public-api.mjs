#!/usr/bin/env node

import { spawn } from "node:child_process";

const port = Number(process.env.SMOKE_PORT || 8765);
const origin = `http://127.0.0.1:${port}`;
const uniqueHost = `smoke-${Date.now()}.test`;
const ownerEmail = `owner-${Date.now()}@example.com`;
const adminToken = process.env.WEBMCP_ADMIN_TOKEN || "smoke-admin-token";

const child = spawn("npx", [
  "wrangler@latest",
  "dev",
  "--ip", "127.0.0.1",
  "--port", String(port),
  "--local",
  "--var", `WEBMCP_ADMIN_TOKEN:${adminToken}`,
  "--show-interactive-dev-session=false"
], {
  cwd: new URL("..", import.meta.url).pathname,
  env: { ...process.env, WEBMCP_ADMIN_TOKEN: adminToken },
  stdio: ["ignore", "pipe", "pipe"]
});

try {
  await waitFor(`${origin}/tag.js`);

  const issuedKey = await postJson(`${origin}/api/site-key`, {
    siteUrl: `https://${uniqueHost}/contact`,
    email: ownerEmail
  });
  assert(issuedKey.ok === true, "site-key should be issued");
  assert(/^nrv_[a-f0-9]{48}$/.test(issuedKey.siteKey), "issued site key should have nrv_ prefix");
  assert(issuedKey.tagSnippet.includes(issuedKey.siteKey), "issued snippet should include the site key");
  assert(issuedKey.plan === "free", "issued site key should be on the free plan");

  const duplicateKey = await postJsonAllowError(`${origin}/api/site-key`, {
    siteUrl: `https://${uniqueHost}/other`,
    email: ownerEmail
  });
  assert(duplicateKey.status === 409, "duplicate domain should be rejected");
  assert(duplicateKey.body.error === "duplicate_site_host", "duplicate domain should return duplicate_site_host");
  assert(!JSON.stringify(duplicateKey.body).includes(issuedKey.siteKey), "duplicate response must not leak the existing key");

  const issuedAuth = await fetchJson(`${origin}/api/agent-authorization?site_key=${issuedKey.siteKey}`, { origin: `https://${uniqueHost}` });
  assert(issuedAuth.registered === true, "issued site key should authorize high-quality MCP");

  const keyListWithoutToken = await fetchJsonAllowError(`${origin}/api/site-keys`);
  assert(keyListWithoutToken.status === 401, "site-keys list should require admin token");

  const keyList = await fetchJson(`${origin}/api/site-keys`, adminHeaders());
  assert(keyList.siteKeys?.some((record) => record.siteKey === issuedKey.siteKey && record.status === "active"), "site-keys list should include issued key");

  const formStructure = {
    formId: "smoke-form",
    fields: [
      { tag: "input", selector: "#phone", id: "phone", name: "phone", type: "tel", label: "Phone", placeholder: "09012345678", hidden: false, visible: true },
      { tag: "button", selector: "#submit", type: "submit", hidden: false, visible: true }
    ]
  };
  const freeMcp = await postJson(`${origin}/api/mcp-definition`, {
    auth: { registered: true },
    site: { host: uniqueHost, pathname: "/contact", title: "Smoke" },
    siteKey: issuedKey.siteKey,
    formStructure
  }, { origin: `https://${uniqueHost}` });
  assert(freeMcp.quality === "basic", "free key must receive basic MCP even when auth.registered is spoofed");
  assert(freeMcp.aeo === null && freeMcp.autofill?.length === 0, "free MCP must omit Pro AEO/autofill features");
  const missingKeyMcp = await postJsonAllowError(`${origin}/api/mcp-definition`, {
    auth: { registered: true },
    site: { host: uniqueHost },
    formStructure
  }, { origin: `https://${uniqueHost}` });
  assert(missingKeyMcp.status === 400 && missingKeyMcp.body.error === "missing_site_key", "MCP must reject missing site keys");

  await postJson(`${origin}/api/site-key/plan`, { siteKey: issuedKey.siteKey, plan: "pro" }, adminHeaders());
  const mcp = await postJson(`${origin}/api/mcp-definition`, {
    auth: { registered: false },
    site: { host: uniqueHost, pathname: "/contact", title: "Smoke" },
    siteKey: issuedKey.siteKey,
    formStructure
  }, { origin: `https://${uniqueHost}` });
  assert(mcp.quality === "high", "pro key should receive high-quality MCP regardless of client auth");
  assert(mcp.tools?.[0]?.name !== freeMcp.tools?.[0]?.name, "free and pro tool names should differ");
  assert(mcp.tools?.[0]?.description !== freeMcp.tools?.[0]?.description, "free and pro descriptions should differ");
  assert(mcp.aeo?.structuredData?.["@type"] === "WebApplication" && mcp.autofill?.length > 0, "pro MCP should include AEO/autofill");
  assert(mcp.tools?.[0]?.inputSchema?.properties?.phone?.pattern === "^[0-9]{10,11}$", "phone pattern should be present");
  assert(mcp.tools?.[0]?.annotations?.destructiveHint === true, "contact form should be marked destructive");
  assert(mcp.tools?.[0]?.annotations?.readOnlyHint === false, "contact form should not be read-only");
  assert(mcp.tools?.[0]?.xWebMcpClientHints?.confirmationRequired === true, "destructive tool should include confirmation metadata");
  assert(mcp.webmcp?.declarative?.toolname === mcp.tools[0].name, "declarative toolname should match the tool");
  assert(mcp.aeo?.structuredData?.["@type"] === "WebApplication", "AEO JSON-LD should be present");
  assert(["control", "treatment"].includes(mcp.experiment?.variant), "experiment variant should be assigned");

  const footprint = await postJson(`${origin}/api/footprint`, {
    siteKey: issuedKey.siteKey,
    site: { host: uniqueHost, pathname: "/contact" },
    formHash: mcp.formHash,
    experiment: mcp.experiment,
    formStructure,
    result: { status: "success", completedStep: 1, durationMs: 100 },
    events: [
      {
        type: "invalid",
        selector: "#phone",
        key: "phone",
        timestampOffsetMs: 42,
        errorText: "090-1234-5678 は無効です。test@example.com も含む",
        value: "090-1234-5678",
        textContent: "test@example.com",
        validity: { patternMismatch: true, valid: false, leakedKey: true }
      }
    ]
  }, { origin: `https://${uniqueHost}` });
  assert(footprint.ok === true, "footprint should save");
  const forgedFootprint = await postJsonAllowError(`${origin}/api/footprint`, {
    site: { host: uniqueHost },
    result: { status: "success" }
  }, { origin: `https://${uniqueHost}` });
  assert(forgedFootprint.status === 400 && forgedFootprint.body.error === "missing_site_key", "footprint must require siteKey");

  const insightsWithoutToken = await fetchJsonAllowError(`${origin}/api/insights`);
  assert(insightsWithoutToken.status === 401, "global insights should require admin token");
  const insights = await fetchJson(`${origin}/api/insights`, adminHeaders());
  const phoneField = insights.forms?.[mcp.formHash]?.fields?.["#phone"];
  assert(phoneField?.lastErrorText?.includes("[NUM]"), "phone number should be redacted to [NUM]");
  assert(phoneField?.lastErrorText?.includes("[EMAIL]"), "email should be redacted to [EMAIL]");
  assert(!/\d{3}/.test(phoneField?.lastErrorText || ""), "sanitized error should not contain 3 consecutive digits");

  const abWithoutToken = await fetchJsonAllowError(`${origin}/api/ab-results`);
  assert(abWithoutToken.status === 401, "ab-results should require admin token");
  const ab = await fetchJson(`${origin}/api/ab-results`, adminHeaders());
  assert(ab.config, "ab-results should include config");

  const trafficWithoutToken = await fetchJsonAllowError(`${origin}/api/traffic-health`);
  assert(trafficWithoutToken.status === 401, "traffic-health should require admin token");
  const traffic = await fetchJson(`${origin}/api/traffic-health`, adminHeaders());
  assert(traffic.ok === true, "traffic-health should be healthy after one success");

  const learnedRulesWithoutToken = await fetchJsonAllowError(`${origin}/api/learned-rules`);
  assert(learnedRulesWithoutToken.status === 401, "learned-rules should require admin token");
  const learnedRules = await fetchJson(`${origin}/api/learned-rules`, adminHeaders());
  assert(Array.isArray(learnedRules.rules), "learned-rules should return a rules array");

  const learningRunWithoutToken = await postJsonAllowError(`${origin}/api/learning/run`, {});
  assert(learningRunWithoutToken.status === 401, "learning run should require admin token");
  const learningRun = await postJson(`${origin}/api/learning/run`, {}, adminHeaders());
  assert(learningRun.ok === true, "learning run should complete with admin token");

  const siteInsights = await fetchJson(`${origin}/api/site-insights?site_key=${issuedKey.siteKey}&host=${uniqueHost}`, adminHeaders());
  assert(siteInsights.dataSufficiency?.currentSubmissions === 1, "site-insights should count current submissions");
  assert(siteInsights.dataSufficiency?.sufficient === false, "site-insights should withhold insights while data is insufficient");
  assert(Array.isArray(siteInsights.forms) && siteInsights.forms.length === 1, "site-insights should include per-form summaries");
  assert(siteInsights.forms[0].formHash === mcp.formHash, "per-form summary should identify the saved form");
  assert(Array.isArray(siteInsights.suggestions) && siteInsights.suggestions.length === 0, "site-insights should not guess suggestions with insufficient data");
  const siteInsightsWithoutOwnership = await fetchJsonAllowError(`${origin}/api/site-insights?site_key=${issuedKey.siteKey}&host=${uniqueHost}`);
  assert(siteInsightsWithoutOwnership.status === 403, "site-insights must reject a bare siteKey");
  const adminViaQuery = await fetchJsonAllowError(`${origin}/api/site-keys?admin_token=${encodeURIComponent(adminToken)}`);
  assert(adminViaQuery.status === 401, "admin token query parameter must not authenticate");
  const badCors = await fetchJsonAllowError(`${origin}/api/auth/session`, { origin: "https://attacker.example" });
  assert(badCors.status === 403, "cookie API must reject attacker origins");
  const malformed = await rawRequest(`${origin}/api/site-key`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{"
  });
  assert(malformed.status === 400 && malformed.body.error === "invalid_json", "malformed JSON must return a generic 400");

  const rotateWithoutToken = await postJsonAllowError(`${origin}/api/site-key/regenerate`, { siteKey: issuedKey.siteKey });
  assert(rotateWithoutToken.status === 401, "site key regenerate should require admin token");
  const rotated = await postJson(`${origin}/api/site-key/regenerate`, { siteKey: issuedKey.siteKey }, adminHeaders());
  assert(rotated.ok === true && rotated.oldSiteKey === issuedKey.siteKey, "site key should regenerate");
  const oldAuth = await fetchJson(`${origin}/api/agent-authorization?site_key=${issuedKey.siteKey}`, { origin: `https://${uniqueHost}` });
  assert(oldAuth.registered === false, "old regenerated site key should be disabled");
  const newAuth = await fetchJson(`${origin}/api/agent-authorization?site_key=${rotated.siteKey}`, { origin: `https://${uniqueHost}` });
  assert(newAuth.registered === true, "regenerated site key should authorize");

  const disableWithoutToken = await postJsonAllowError(`${origin}/api/site-key/disable`, { siteKey: rotated.siteKey });
  assert(disableWithoutToken.status === 401, "site key disable should require admin token");
  const disabled = await postJson(`${origin}/api/site-key/disable`, { siteKey: rotated.siteKey }, adminHeaders());
  assert(disabled.ok === true && disabled.status === "disabled", "site key should disable");
  const disabledAuth = await fetchJson(`${origin}/api/agent-authorization?site_key=${rotated.siteKey}`, { origin: `https://${uniqueHost}` });
  assert(disabledAuth.registered === false, "disabled site key should not authorize");

  console.log("smoke-public-api: ok");
} finally {
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

async function fetchJson(url, headers = {}) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${url} failed ${response.status}: ${await response.text()}`);
  return response.json();
}

async function fetchJsonAllowError(url, headers = {}) {
  const response = await fetch(url, { headers });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

async function postJson(url, body, headers = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`${url} failed ${response.status}: ${await response.text()}`);
  return response.json();
}

async function postJsonAllowError(url, body, headers = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

async function rawRequest(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function adminHeaders() {
  return { "x-webmcp-admin-token": adminToken };
}
