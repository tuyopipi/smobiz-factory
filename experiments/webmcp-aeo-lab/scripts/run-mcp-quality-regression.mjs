#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required for real mcp-tool-quality regression. This test does not use mock mode.");
}

const root = new URL("../../mcp-tool-quality", import.meta.url).pathname;
const minHighSuccessRate = Number(process.env.MCP_REGRESSION_MIN_HIGH_SUCCESS_RATE || 0.66);

execFileSync("node", [
  "src/run-experiment.mjs",
  "--forms",
  "a,e",
  "--qualities",
  "high",
  "--runs",
  "3",
  "--model",
  process.env.OPENAI_MODEL || "gpt-4.1-mini",
  "--delay-ms",
  process.env.MCP_REGRESSION_DELAY_MS || "1500"
], {
  cwd: root,
  stdio: "inherit",
  env: process.env
});

const latest = JSON.parse(await readFile(join(root, "results/latest.json"), "utf8"));
const rows = latest.summary?.rows || [];
const highRows = rows.filter((row) => row.quality === "high");
const rate = highRows.length
  ? highRows.reduce((sum, row) => sum + Number(row.successRate ?? 0), 0) / highRows.length / 100
  : 0;
const runs = highRows.reduce((sum, row) => sum + Number(row.runs ?? 0), 0);

if (!runs) throw new Error("Could not read mcp-tool-quality regression results from results/latest.json");
if (rate < minHighSuccessRate) {
  throw new Error(`mcp-tool-quality regression failed: high success rate ${rate} < ${minHighSuccessRate}`);
}

console.log(`mcp-tool-quality regression: ok highSuccessRate=${rate}`);
