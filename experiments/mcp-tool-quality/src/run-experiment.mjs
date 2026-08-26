#!/usr/bin/env node

process.on("uncaughtException", (error) => {
  console.error(`mcp-quality-bench: ${error.message}`);
  process.exit(1);
});
process.on("unhandledRejection", (error) => {
  console.error(`mcp-quality-bench: ${error?.message || error}`);
  process.exit(1);
});

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { QUALITIES, loadBenchmarkConfig } from "./config.mjs";
import { runAgentOnForm, loadJson } from "./agent.mjs";
import { startStaticServer } from "./server.mjs";
import { providerFromEnv } from "./providers.mjs";

const projectDir = dirname(dirname(fileURLToPath(import.meta.url)));
const args = parseArgs(process.argv.slice(2));
const benchmarkConfig = await loadBenchmarkConfig({ configPath: args.config, projectDir });
const defaults = benchmarkConfig.defaults;
const mock = Boolean(args.mock);
const smoke = Boolean(args.smoke);
const headed = Boolean(args.headed);
const runsPerCombo = Number(args.runs ?? (smoke ? defaults.smokeRuns : defaults.runs));
const maxSteps = Number(args.maxSteps ?? defaults.maxSteps);
const provider = providerFromEnv({ provider: args.provider ?? defaults.provider, model: args.model ?? defaults.model, temperature: args.temperature ?? defaults.temperature });
const delayMs = Number(args.delayMs ?? "1500");
const selectedForms = selectForms(args.forms, smoke, benchmarkConfig.forms);
const selectedQualities = selectQualities(args.qualities);
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const runRoot = join(projectDir, "results", stamp);

await mkdir(runRoot, { recursive: true });
const staticServer = await startStaticServer({ rootDir: projectDir });
const browser = await chromium.launch({ headless: !headed });
const results = [];

try {
  for (const form of selectedForms) {
    for (const quality of selectedQualities) {
      const mcpDefinition = await loadJson(resolveMcpPath(form, quality));
      for (let trial = 1; trial <= runsPerCombo; trial += 1) {
        const context = await browser.newContext();
        const page = await context.newPage();
        const url = form.url || `${staticServer.origin}${form.path}`;
        await page.goto(url, { waitUntil: "domcontentloaded" });
        const result = await runAgentOnForm({
          page,
          form,
          quality,
          mcpDefinition,
          task: form.task,
          maxSteps,
          provider,
          mock
        });
        result.trial = trial;
        result.url = url;
        result.mode = mock ? "mock" : provider.name;
        result.provider = provider.name;
        result.model = provider.model;
        results.push(result);
        const runDir = join(runRoot, `${form.id}-${quality}-${trial}`);
        await mkdir(runDir, { recursive: true });
        await page.screenshot({ path: join(runDir, "final.png"), fullPage: true }).catch(() => {});
        await writeFile(join(runDir, "log.json"), JSON.stringify(result, null, 2) + "\n");
        await context.close();
        console.log(`${result.success ? "PASS" : "FAIL"} ${form.id} ${quality} trial=${trial} steps=${result.steps} tokens=${result.tokens} result=${result.finalResult}`);
        if (delayMs > 0) await sleep(delayMs);
      }
    }
  }
} finally {
  await browser.close().catch(() => {});
  await staticServer.close().catch(() => {});
}

const summary = summarize(results, benchmarkConfig.forms);
await writeFile(join(runRoot, "results.json"), JSON.stringify({ config: { mock, smoke, runsPerCombo, maxSteps, provider, delayMs }, results, summary }, null, 2) + "\n");
await writeFile(join(runRoot, "summary.csv"), summaryToCsv(summary.rows));
await writeFile(join(runRoot, "report.md"), summaryToMarkdown(summary));
await writeFile(join(projectDir, "results", "latest.json"), JSON.stringify({ runRoot, summary }, null, 2) + "\n");
await writeFile(join(projectDir, "results", "latest-summary.csv"), summaryToCsv(summary.rows));
await writeFile(join(projectDir, "results", "latest-report.md"), summaryToMarkdown(summary));

printSummary(summary);

function summarize(items, forms) {
  const groups = new Map();
  for (const item of items) {
    const key = `${item.form}|${item.quality}`;
    const group = groups.get(key) ?? { form: item.form, formName: item.formName, quality: item.quality, runs: 0, successes: 0, steps: 0, tokens: 0, failureReasons: {} };
    group.runs += 1;
    group.successes += item.success ? 1 : 0;
    group.steps += item.steps;
    group.tokens += item.tokens;
    if (!item.success) group.failureReasons[item.failureReason] = (group.failureReasons[item.failureReason] ?? 0) + 1;
    groups.set(key, group);
  }
  const rows = [...groups.values()].map((group) => ({
    form: group.form,
    formName: group.formName,
    quality: group.quality,
    runs: group.runs,
    successRate: round(100 * group.successes / group.runs),
    avgSteps: round(group.steps / group.runs),
    avgTokens: round(group.tokens / group.runs),
    failureReasons: group.failureReasons
  })).sort((a, b) => a.form.localeCompare(b.form) || a.quality.localeCompare(b.quality));

  const lowRows = rows.filter((row) => row.quality === "low");
  const highRows = rows.filter((row) => row.quality === "high");
  const avgLowSuccess = average(lowRows.map((row) => row.successRate));
  const avgHighSuccess = average(highRows.map((row) => row.successRate));
  const avgLowTokens = average(lowRows.map((row) => row.avgTokens));
  const avgHighTokens = average(highRows.map((row) => row.avgTokens));
  return {
    rows,
    comparison: forms.filter((form) => rows.some((row) => row.form === form.id)).map((form) => {
      const low = rows.find((row) => row.form === form.id && row.quality === "low");
      const high = rows.find((row) => row.form === form.id && row.quality === "high");
      return {
        form: form.id,
        formName: form.name,
        lowSuccessRate: low?.successRate ?? 0,
        highSuccessRate: high?.successRate ?? 0,
        liftPoints: round((high?.successRate ?? 0) - (low?.successRate ?? 0)),
        lowAvgTokens: low?.avgTokens ?? 0,
        highAvgTokens: high?.avgTokens ?? 0
      };
    }),
    overall: {
      avgLowSuccess,
      avgHighSuccess,
      liftPoints: round(avgHighSuccess - avgLowSuccess),
      avgLowTokens,
      avgHighTokens,
      tokenChangePercent: avgLowTokens === 0 ? 0 : round(100 * (avgHighTokens - avgLowTokens) / avgLowTokens)
    }
  };
}

function printSummary(summary) {
  console.log("\nフォーム / 品質 / 成功率(%) / 平均ステップ数 / 平均トークン数");
  console.table(summary.rows.map((row) => ({
    form: row.form,
    quality: row.quality,
    "success %": row.successRate,
    "avg steps": row.avgSteps,
    "avg tokens": row.avgTokens
  })));
  console.log("\nlow vs high");
  console.table(summary.comparison.map((row) => ({
    form: row.form,
    "low %": row.lowSuccessRate,
    "high %": row.highSuccessRate,
    "lift pt": row.liftPoints,
    "low tokens": row.lowAvgTokens,
    "high tokens": row.highAvgTokens
  })));
  console.log(`\n全体: high は low より成功率が ${summary.overall.liftPoints} pt 高い。トークン変化は ${summary.overall.tokenChangePercent}% です。`);
}

function summaryToCsv(rows) {
  return [
    "form,quality,success_rate_percent,avg_steps,avg_tokens,runs,failure_reasons_json",
    ...rows.map((row) => [row.form, row.quality, row.successRate, row.avgSteps, row.avgTokens, row.runs, csvEscape(JSON.stringify(row.failureReasons))].join(","))
  ].join("\n") + "\n";
}

function summaryToMarkdown(summary) {
  return [
    "# MCP Quality Bench Report",
    "",
    "## Summary",
    "",
    `- Low average success: ${summary.overall.avgLowSuccess}%`,
    `- High average success: ${summary.overall.avgHighSuccess}%`,
    `- Lift: ${summary.overall.liftPoints} pt`,
    `- Token change: ${summary.overall.tokenChangePercent}%`,
    "",
    "## Results",
    "",
    "| Form | Quality | Runs | Success % | Avg steps | Avg tokens | Failure reasons |",
    "|---|---:|---:|---:|---:|---:|---|",
    ...summary.rows.map((row) => `| ${row.form} | ${row.quality} | ${row.runs} | ${row.successRate} | ${row.avgSteps} | ${row.avgTokens} | ${markdownReasons(row.failureReasons)} |`),
    "",
    "## Low vs High",
    "",
    "| Form | Low % | High % | Lift pt | Low tokens | High tokens |",
    "|---|---:|---:|---:|---:|---:|",
    ...summary.comparison.map((row) => `| ${row.form} | ${row.lowSuccessRate} | ${row.highSuccessRate} | ${row.liftPoints} | ${row.lowAvgTokens} | ${row.highAvgTokens} |`),
    ""
  ].join("\n");
}

function selectForms(value, smokeMode, forms) {
  if (value) {
    const ids = String(value).split(",").map((item) => item.trim()).filter(Boolean);
    return forms.filter((form) => ids.includes(form.id));
  }
  return smokeMode ? [forms[0]] : forms;
}

function selectQualities(value) {
  if (!value) return QUALITIES;
  const selected = String(value).split(",").map((item) => item.trim()).filter(Boolean);
  return QUALITIES.filter((quality) => selected.includes(quality));
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function average(values) {
  return values.length === 0 ? 0 : round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function round(value) {
  return Number(value.toFixed(2));
}

function resolveMcpPath(form, quality) {
  const value = form.mcp?.[quality] || form.mcpPath?.replace("{quality}", quality);
  if (!value) throw new Error(`Missing MCP definition path for form=${form.id} quality=${quality}`);
  return value.startsWith("/") ? value : join(projectDir, value);
}

function csvEscape(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function markdownReasons(reasons = {}) {
  const entries = Object.entries(reasons);
  return entries.length ? entries.map(([key, value]) => `${key}: ${value}`).join("<br>") : "";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
