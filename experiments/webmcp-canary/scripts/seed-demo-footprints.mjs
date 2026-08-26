#!/usr/bin/env node

const origin = process.env.WEBMCP_ORIGIN || "http://127.0.0.1:8443";
const siteKey = process.env.WEBMCP_SITE_KEY || "local-wp-demo-key";
const siteHost = process.env.WEBMCP_SITE_HOST || "localhost:8080";
const adminToken = process.env.WEBMCP_ADMIN_TOKEN || "local-wordpress-demo-admin-token";
const sitePathname = process.env.WEBMCP_SITE_PATHNAME || "/webmcp-demo/";
const count = Number(process.env.SEED_COUNT || 26);

const formStructure = {
  formId: "wpcf7-f-webmcp-demo-form",
  fields: [
    { selector: "input[name=\"your-name\"]", key: "your_name", tag: "input", type: "text", label: "お名前", hidden: false, visible: true, optionsCount: 0 },
    { selector: "input[name=\"your-email\"]", key: "your_email", tag: "input", type: "email", label: "メールアドレス", hidden: false, visible: true, optionsCount: 0 },
    { selector: "input[name=\"your-tel\"]", key: "your_tel", tag: "input", type: "tel", label: "電話番号", hidden: false, visible: true, optionsCount: 0 },
    { selector: "textarea[name=\"your-message\"]", key: "your_message", tag: "textarea", type: "textarea", label: "お問い合わせ内容", hidden: false, visible: true, optionsCount: 0 }
  ]
};

const patterns = [
  "success", "success", "success", "success", "success", "success", "success", "success", "success", "success", "success", "success",
  "phone_pattern", "phone_pattern", "phone_pattern", "phone_pattern", "phone_pattern", "phone_pattern", "phone_pattern", "phone_pattern",
  "email_type", "email_type",
  "missing_name", "missing_phone",
  "abandoned_message",
  "success"
].slice(0, count);

await ensureReachable();

let posted = 0;
for (let index = 0; index < patterns.length; index += 1) {
  const status = patterns[index];
  const payload = footprintFor(status, index);
  const result = await postJson("/api/footprint", payload);
  if (!result.ok) throw new Error(`footprint ${index + 1} failed: ${JSON.stringify(result)}`);
  posted += 1;
}

const insights = await fetchJson(`/api/site-insights?site_key=${encodeURIComponent(siteKey)}&host=${encodeURIComponent(siteHost)}`, {
  "x-webmcp-admin-token": adminToken
});

console.log(JSON.stringify({
  ok: true,
  posted,
  origin,
  siteHost,
  dataSufficiency: insights.dataSufficiency,
  basicStats: insights.basicStats,
  benchmark: insights.benchmark ? {
    locked: insights.benchmark.locked,
    currentCompletionRate: insights.benchmark.currentCompletionRate
  } : null,
  suggestions: insights.suggestions.map((suggestion) => ({
    title: suggestion.title,
    fieldKey: suggestion.fieldKey,
    expectedEffect: suggestion.expectedEffect,
    free: suggestion.free,
    locked: suggestion.locked
  }))
}, null, 2));

if (!insights.dataSufficiency?.sufficient) {
  throw new Error("Seed completed, but site-insights is still insufficient.");
}
if (!insights.basicStats || !insights.benchmark) {
  throw new Error("Seed completed, but basicStats/benchmark were not returned.");
}
if (!Array.isArray(insights.suggestions) || insights.suggestions.length === 0) {
  throw new Error("Seed completed, but no improvement suggestions were generated.");
}

function footprintFor(kind, index) {
  const success = kind === "success";
  const events = [];
  if (kind === "phone_pattern") {
    events.push(invalidEvent("input[name=\"your-tel\"]", "your_tel", "ハイフンは使用できません。数字のみで入力してください。", { patternMismatch: true }));
  }
  if (kind === "email_type") {
    events.push(invalidEvent("input[name=\"your-email\"]", "your_email", "メールアドレスの形式が正しくありません。", { typeMismatch: true }));
  }
  if (kind === "missing_name") {
    events.push(invalidEvent("input[name=\"your-name\"]", "your_name", "お名前は必須です。", { valueMissing: true }));
  }
  if (kind === "missing_phone") {
    events.push(invalidEvent("input[name=\"your-tel\"]", "your_tel", "電話番号は必須です。", { valueMissing: true }));
  }
  if (kind === "abandoned_message") {
    events.push(invalidEvent("textarea[name=\"your-message\"]", "your_message", "お問い合わせ内容の入力途中で離脱しました。", { valueMissing: true }));
  }
  return {
    siteKey,
    site: { host: siteHost, pathname: sitePathname },
    formStructure,
    result: {
      status: success ? "success" : "failure",
      completedStep: success ? 4 : Math.max(1, 4 - events.length),
      durationMs: 18000 + index * 1700
    },
    events
  };
}

function invalidEvent(selector, key, errorText, validityPatch) {
  return {
    type: "invalid",
    selector,
    key,
    timestampOffsetMs: 9000,
    errorText,
    validity: {
      valueMissing: false,
      typeMismatch: false,
      patternMismatch: false,
      tooShort: false,
      tooLong: false,
      rangeUnderflow: false,
      rangeOverflow: false,
      stepMismatch: false,
      badInput: false,
      customError: false,
      valid: false,
      ...validityPatch
    }
  };
}

async function ensureReachable() {
  try {
    await fetchJson(`/api/agent-authorization?site_key=${encodeURIComponent(siteKey)}`);
  } catch (error) {
    throw new Error(`WebMCP server is not reachable at ${origin}. Start it with npm run wp:demo or WEBMCP_ORIGIN=... npm run seed:demo. ${error.message}`);
  }
}

async function fetchJson(path, headers = {}) {
  const response = await fetch(new URL(path, origin), { headers });
  const text = await response.text();
  if (!response.ok) throw new Error(`${path} failed ${response.status}: ${text}`);
  return JSON.parse(text);
}

async function postJson(path, body) {
  const response = await fetch(new URL(path, origin), {
    method: "POST",
    headers: { "content-type": "application/json", origin: `http://${siteHost}` },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${path} failed ${response.status}: ${text}`);
  return JSON.parse(text);
}
