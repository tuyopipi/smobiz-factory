#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const mode = process.argv[2] || "check";
const root = new URL("..", import.meta.url).pathname;
const historyDir = join(root, "standards-history");
const statePath = join(historyDir, "state.json");
const reportsDir = join(historyDir, "reports");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

const SOURCES = [
  {
    id: "github-webmcp-commits",
    type: "json",
    url: "https://api.github.com/repos/webmachinelearning/webmcp/commits?per_page=10"
  },
  {
    id: "github-webmcp-issues",
    type: "json",
    url: "https://api.github.com/repos/webmachinelearning/webmcp/issues?state=all&per_page=20"
  },
  {
    id: "github-webmcp-prs",
    type: "json",
    url: "https://api.github.com/repos/webmachinelearning/webmcp/pulls?state=all&per_page=20"
  },
  {
    id: "webmcp-spec",
    type: "text",
    url: "https://webmachinelearning.github.io/webmcp/"
  },
  {
    id: "chrome-webmcp-imperative-api",
    type: "text",
    url: "https://developer.chrome.com/docs/ai/webmcp/imperative-api"
  },
  {
    id: "chrome-webmcp-best-practices",
    type: "text",
    url: "https://developer.chrome.com/docs/ai/webmcp/best-practices"
  },
  {
    id: "chrome-platform-status-webmcp-search",
    type: "text",
    url: "https://chromestatus.com/features#webmcp"
  },
  {
    id: "chrome-release-blog",
    type: "text",
    url: "https://developer.chrome.com/release-notes"
  },
  {
    id: "edge-release-notes",
    type: "text",
    url: "https://learn.microsoft.com/en-us/deployedge/microsoft-edge-relnote-stable-channel"
  }
];

await mkdir(reportsDir, { recursive: true });

const previous = await loadJson(statePath, { sources: {} });
const current = { checkedAt: new Date().toISOString(), sources: {} };
const changes = [];

for (const source of SOURCES) {
  const snapshot = await fetchSnapshot(source).catch((error) => ({
    url: source.url,
    status: "error",
    hash: `error:${sha256(error.message)}`,
    summary: { error: error.message },
    checkedAt: new Date().toISOString()
  }));
  current.sources[source.id] = snapshot;
  const before = previous.sources[source.id];
  if (!before || before.hash !== snapshot.hash) {
    changes.push({
      id: source.id,
      url: source.url,
      beforeHash: before?.hash ?? null,
      afterHash: snapshot.hash,
      beforeSummary: before?.summary ?? null,
      afterSummary: snapshot.summary
    });
  }
}

await writeFile(statePath, JSON.stringify(current, null, 2) + "\n");

if (!changes.length) {
  const report = { checkedAt: current.checkedAt, changed: false, changes: [] };
  await writeReport("no-change", report);
  console.log("No WebMCP standard/source changes detected.");
  process.exit(0);
}

const analysis = await analyzeChanges({ changes, current });
const report = {
  checkedAt: current.checkedAt,
  changed: true,
  mode,
  changes,
  analysis
};
const reportPath = await writeReport("change", report);
console.log(`Change report: ${reportPath}`);

if (mode !== "autofix") process.exit(2);

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is required for standards:autofix.");
  process.exit(1);
}

const patch = await generatePatch({ changes, analysis });
const patchPath = join(reportsDir, `${stamp}-autofix.patch`);
await writeFile(patchPath, patch + "\n");

if (!patch.trim()) {
  console.log("LLM returned no patch. Nothing to apply.");
  process.exit(0);
}

try {
  execFileSync("git", ["apply", "--check", patchPath], { cwd: root, stdio: "inherit" });
  execFileSync("git", ["apply", patchPath], { cwd: root, stdio: "inherit" });
} catch (error) {
  console.error(`Patch failed. Stored at ${patchPath}`);
  process.exit(1);
}

await writeFile(join(reportsDir, `${stamp}-applied.json`), JSON.stringify({ patchPath, reportPath }, null, 2) + "\n");
console.log(`Patch applied: ${patchPath}`);

async function fetchSnapshot(source) {
  const response = await fetch(source.url, {
    headers: {
      "user-agent": "webmcp-canary-standards-monitor/0.1",
      "accept": source.type === "json" ? "application/vnd.github+json, application/json" : "text/html, text/plain"
    }
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`${source.id} failed ${response.status}: ${body.slice(0, 300)}`);
  const normalized = source.type === "json" ? normalizeJson(body) : normalizeText(body);
  return {
    url: source.url,
    status: response.status,
    hash: sha256(normalized),
    summary: summarize(source, normalized),
    checkedAt: new Date().toISOString()
  };
}

function normalizeJson(body) {
  return JSON.stringify(JSON.parse(body), null, 2);
}

function normalizeText(body) {
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function summarize(source, normalized) {
  if (source.type === "json") {
    const parsed = JSON.parse(normalized);
    return parsed.slice(0, 8).map((item) => ({
      title: item.title || item.commit?.message?.split("\n")[0],
      state: item.state,
      url: item.html_url,
      sha: item.sha
    }));
  }
  const lowered = normalized.toLowerCase();
  const keywords = ["document.modelcontext", "navigator.modelcontext", "registertool", "abortcontroller", "inputschema", "execute", "toolcall", "exposedto", "schema"];
  return keywords.filter((keyword) => lowered.includes(keyword));
}

async function analyzeChanges(payload) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      skipped: true,
      reason: "OPENAI_API_KEY is not set. Change detection succeeded; LLM impact analysis was skipped."
    };
  }
  const response = await openaiJson([
    {
      role: "system",
      content: [
        "You analyze WebMCP standards changes for a JavaScript tag and Cloudflare Worker server.",
        "Return JSON only.",
        "Schema: {breaking:boolean, compatibility:string, impacted_api:[string], files:[{path:string, reason:string}], recommended_tests:[string], deploy_risk:string, summary:string}"
      ].join("\n")
    },
    {
      role: "user",
      content: JSON.stringify(payload, null, 2)
    }
  ]);
  return response;
}

async function generatePatch(payload) {
  const files = {
    "public/tag.js": await readFile(join(root, "public/tag.js"), "utf8"),
    "worker/index.mjs": await readFile(join(root, "worker/index.mjs"), "utf8"),
    "scripts/smoke-public-api.mjs": existsSync(join(root, "scripts/smoke-public-api.mjs")) ? await readFile(join(root, "scripts/smoke-public-api.mjs"), "utf8") : ""
  };
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: [
            "You update a WebMCP implementation for standards changes.",
            "Return a unified git diff only. No markdown.",
            "Keep changes minimal and backward compatible unless the change is clearly breaking.",
            "Do not modify secrets, lock files, generated data, or README unless required for API behavior."
          ].join("\n")
        },
        {
          role: "user",
          content: JSON.stringify({ ...payload, files }, null, 2)
        }
      ]
    })
  });
  if (!response.ok) throw new Error(`OpenAI patch generation failed ${response.status}: ${await response.text()}`);
  const body = await response.json();
  return (body.choices?.[0]?.message?.content || "").replace(/^```(?:diff)?\n?|\n?```$/g, "").trim();
}

async function openaiJson(messages) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages
    })
  });
  if (!response.ok) throw new Error(`OpenAI analysis failed ${response.status}: ${await response.text()}`);
  const body = await response.json();
  return JSON.parse(body.choices?.[0]?.message?.content || "{}");
}

async function loadJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeReport(prefix, report) {
  const path = join(reportsDir, `${stamp}-${prefix}.json`);
  await writeFile(path, JSON.stringify(report, null, 2) + "\n");
  return path;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
