#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { DEFAULTS, FORMS } from "./config.mjs";
import { loadJson, runAgentOnForm } from "./agent.mjs";
import { startStaticServer } from "./server.mjs";
import { completeJson, providerFromEnv } from "./providers.mjs";

const projectDir = dirname(dirname(fileURLToPath(import.meta.url)));
const args = parseArgs(process.argv.slice(2));
const selectedFormIds = String(args.forms ?? "a,c,e").split(",").map((item) => item.trim()).filter(Boolean);
const selectedForms = FORMS.filter((form) => selectedFormIds.includes(form.id));
const mockAgent = Boolean(args.mockAgent ?? args.mock);
const mockRepair = Boolean(args.mockRepair ?? args.mock);
const headed = Boolean(args.headed);
const maxSteps = Number(args.maxSteps ?? DEFAULTS.maxSteps);
const maxRepairAttempts = Number(args.maxRepairAttempts ?? "3");
const model = String(args.model ?? DEFAULTS.model);
const temperature = Number(args.temperature ?? DEFAULTS.temperature);
const provider = providerFromEnv({ provider: args.provider ?? DEFAULTS.provider, model, temperature });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const runRoot = join(projectDir, "results", `repair-${stamp}`);

await mkdir(runRoot, { recursive: true });
const staticServer = await startStaticServer({ rootDir: projectDir });
const browser = await chromium.launch({ headless: !headed });
const rows = [];

try {
  for (const form of selectedForms) {
    const lowMcp = await loadJson(join(projectDir, "samples", "mcp", `${form.id}-low.json`));

    const formDir = join(runRoot, form.id);
    await mkdir(formDir, { recursive: true });

    const before = await runOnce({ browser, origin: staticServer.origin, form, quality: "low", mcpDefinition: lowMcp, mock: mockAgent, maxSteps, model, temperature });
    await writeFile(join(formDir, "before-low-log.json"), JSON.stringify(before, null, 2) + "\n");

    let currentRun = before;
    let currentMcp = lowMcp;
    const attempts = [];
    for (let attempt = 1; attempt <= maxRepairAttempts && !currentRun.success; attempt += 1) {
      const analysisInput = summarizeFailureForRepair(currentRun, currentMcp);
      const repair = mockRepair
        ? mockRepairMcp(form.id, currentMcp, analysisInput, attempt)
        : await repairMcpWithProvider({ provider, form, task: form.task, lowMcp: currentMcp, failedRun: analysisInput, attempt });

      currentMcp = repair.mcp_definition;
      await writeFile(join(formDir, `attempt-${attempt}-failure-analysis-input.json`), JSON.stringify(analysisInput, null, 2) + "\n");
      await writeFile(join(formDir, `attempt-${attempt}-repair.json`), JSON.stringify(repair, null, 2) + "\n");
      await writeFile(join(formDir, `attempt-${attempt}-mcp.json`), JSON.stringify(currentMcp, null, 2) + "\n");

      currentRun = await runOnce({ browser, origin: staticServer.origin, form, quality: "repaired", mcpDefinition: currentMcp, mock: mockAgent, maxSteps, model, temperature });
      await writeFile(join(formDir, `attempt-${attempt}-after-log.json`), JSON.stringify(currentRun, null, 2) + "\n");
      attempts.push({ attempt, repair, result: { success: currentRun.success, finalResult: currentRun.finalResult, steps: currentRun.steps } });
    }

    const repairedPath = join(runRoot, `${form.id}-repaired-mcp.json`);
    await writeFile(repairedPath, JSON.stringify(currentMcp, null, 2) + "\n");
    const after = currentRun;
    await writeFile(join(formDir, "attempts.json"), JSON.stringify(attempts, null, 2) + "\n");

    rows.push({
      form: form.id,
      low_success: before.success,
      low_result: before.finalResult,
      low_steps: before.steps,
      repaired_success: after.success,
      repaired_result: after.finalResult,
      repaired_steps: after.steps,
      attempts: attempts.length,
      repair_notes: attempts.map((attempt) => attempt.repair.notes.join(" / ")).join(" | ")
    });

    console.log(`${form.id}: low=${before.finalResult}/${before.success ? "PASS" : "FAIL"} -> repaired=${after.finalResult}/${after.success ? "PASS" : "FAIL"} attempts=${attempts.length}`);
    for (const attempt of attempts) for (const note of attempt.repair.notes) console.log(`  - attempt ${attempt.attempt}: ${note}`);
  }
} finally {
  await browser.close().catch(() => {});
  await staticServer.close().catch(() => {});
}

await writeFile(join(runRoot, "summary.csv"), toCsv(rows));
await writeFile(join(runRoot, "summary.json"), JSON.stringify({ config: { forms: selectedFormIds, mockAgent, mockRepair, maxSteps, maxRepairAttempts, model, temperature }, rows }, null, 2) + "\n");
await writeFile(join(projectDir, "results", "latest-repair.json"), JSON.stringify({ runRoot, rows }, null, 2) + "\n");

console.log("\n修復ループ結果");
console.table(rows);
console.log(`outputs: ${runRoot}`);

async function runOnce({ browser, origin, form, quality, mcpDefinition, mock, maxSteps, model, temperature }) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${origin}${form.path}`, { waitUntil: "domcontentloaded" });
  const result = await runAgentOnForm({ page, form, quality, mcpDefinition, task: form.task, maxSteps, provider, mock });
  await context.close();
  return result;
}

function summarizeFailureForRepair(run, lowMcp) {
  const lastEntry = run.log.at(-1);
  const last = lastEntry?.domAfter ?? lastEntry?.dom;
  const controls = last?.controls?.map((control) => ({
    selector: control.selector,
    label: control.label,
    placeholder: control.placeholder,
    value: control.value,
    visible: control.visible,
    text: control.text
  })) ?? [];
  return {
    form: run.form,
    formName: run.formName,
    success: run.success,
    finalResult: run.finalResult,
    steps: run.steps,
    lowMcp,
    visibleErrors: last?.visibleErrors ?? [],
    finalControls: controls,
    actions: run.log.map((entry) => ({
      step: entry.step,
      action: entry.action,
      execution: entry.execution,
      visibleErrorsAfter: entry.domAfter?.visibleErrors ?? []
    }))
  };
}

async function repairMcpWithProvider({ provider, form, task, lowMcp, failedRun, attempt }) {
  const messages = [
    {
      role: "system",
      content: [
        "You repair MCP tool definitions from failed browser form runs.",
        "Return only JSON with this exact shape:",
        "{\"mcp_definition\": {...}, \"notes\": [\"short reason\"]}",
        "The repaired MCP must be JSON Schema style and must add only information justified by the failure log and DOM snapshot.",
        "Trust the visible validation errors over your prior assumptions. If an error says a value must be digits-only, do not add a hyphenated format.",
        "Prefer precise selectors, required fields, format constraints, step order, and submit instructions.",
        "If a field was repeatedly missed, explicitly name its selector and required value.",
        "If this is a later repair attempt, explain what changed from the previous repaired MCP."
      ].join("\n")
    },
    {
      role: "user",
      content: JSON.stringify({ form: form.id, attempt, task, current_mcp: lowMcp, failed_run: failedRun }, null, 2)
    }
  ];
  const parsed = (await completeJson({ provider, messages })).json;
  return {
    mcp_definition: parsed.mcp_definition,
    notes: parsed.notes ?? [`${provider.name} returned repaired MCP`]
  };
}

function mockRepairMcp(formId, lowMcp, analysisInput, attempt) {
  const repaired = structuredClone(lowMcp);
  repaired.quality = "repaired";
  repaired.name = `${lowMcp.name}_repaired_from_failure`;
  repaired.description = `${lowMcp.description} Repaired from execution failure. Use exact selectors, normalize formats, fill every visible required business field, and click the submit button once all target values are present.`;
  repaired.repair_source = {
    finalResult: analysisInput.finalResult,
    steps: analysisInput.steps,
    visibleErrors: analysisInput.visibleErrors
  };

  if (formId === "a") {
    repaired.description += " Phone #phone must be digits only with no hyphens. Step order: #destination, #checkin, #nights, #guests, #next1, #familyName, #givenName, #email, #phone, #next2, #submit.";
    repaired.input_schema.required = ["destination", "checkin", "nights", "guests", "familyName", "givenName", "email", "phone"];
    repaired.input_schema.properties.phone = { type: "string", pattern: "^[0-9]{10,11}$", examples: ["09012345678"], description: "Remove hyphens before filling #phone." };
    repaired.repair_plan = [["select", "#destination", "tokyo"], ["fill", "#checkin", "2026-03-15"], ["fill", "#nights", "2"], ["fill", "#guests", "2"], ["click", "#next1"], ["fill", "#familyName", "山田"], ["fill", "#givenName", "太郎"], ["fill", "#email", "taro.yamada.test@example.com"], ["fill", "#phone", "09012345678"], ["click", "#next2"], ["click", "#submit"]];
    return { mcp_definition: repaired, notes: [`Visible errors: ${formatErrors(analysisInput.visibleErrors)}`, "Detected phone validation requires digits-only, not hyphenated format.", "Added #phone digits-only constraint and exact multi-step order."] };
  }

  if (formId === "c") {
    repaired.description += " The ambiguous labels require an explicit selector map: #f1 family name, #f2 given name, #f3 email, #f4 phone digits only, #f5 postal code digits only, #f6 prefecture, #f7 city, #f8 company. Do not repeat completed fields; after #f8 is filled, click #submit.";
    repaired.input_schema.required = ["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8"];
    repaired.input_schema.properties = {
      f1: { type: "string", examples: ["山田"], description: "family_name" },
      f2: { type: "string", examples: ["太郎"], description: "given_name" },
      f3: { type: "string", format: "email", examples: ["taro.yamada.test@example.com"] },
      f4: { type: "string", pattern: "^[0-9]{10,11}$", examples: ["09012345678"] },
      f5: { type: "string", pattern: "^[0-9]{7}$", examples: ["1500001"] },
      f6: { type: "string", examples: ["東京都"] },
      f7: { type: "string", examples: ["渋谷区"] },
      f8: { type: "string", examples: ["株式会社テスト"], description: "company; was empty in failed run" }
    };
    repaired.repair_plan = [["fill", "#f1", "山田"], ["fill", "#f2", "太郎"], ["fill", "#f3", "taro.yamada.test@example.com"], ["fill", "#f4", "09012345678"], ["fill", "#f5", "1500001"], ["fill", "#f6", "東京都"], ["fill", "#f7", "渋谷区"], ["fill", "#f8", "株式会社テスト"], ["click", "#submit"]];
    return { mcp_definition: repaired, notes: [`Visible errors: ${formatErrors(analysisInput.visibleErrors)}`, "Detected missing/wrong ambiguous fields, especially #f8 company.", "Added explicit selector map, #f8 requirement, normalized phone/postal formats, and submit instruction."] };
  }

  if (formId === "e") {
    repaired.description += " Do not fill hidden #website; it is a honeypot. Select #accountType business first, fill #x1 company and #x2 job title, click #next1. Select #country JP, fill #zip digits only, #pref, #city, click #next2. Fill #n1 family, #n2 given, #mail email, #tel digits-only phone, #birth YYYY-MM-DD, then #submit.";
    repaired.input_schema.required = ["accountType", "company", "jobTitle", "country", "zip", "pref", "city", "familyName", "givenName", "email", "phone", "birth"];
    repaired.input_schema.properties.website = { type: "string", description: "Honeypot. Never fill this field." };
    repaired.input_schema.properties.phone = { type: "string", pattern: "^[0-9]{10,11}$", examples: ["09012345678"] };
    repaired.input_schema.properties.zip = { type: "string", pattern: "^[0-9]{7}$", examples: ["1500001"] };
    repaired.input_schema.properties.birth = { type: "string", format: "date", examples: ["1995-04-01"] };
    repaired.repair_plan = [["select", "#accountType", "business"], ["fill", "#x1", "株式会社テスト"], ["fill", "#x2", "エンジニア"], ["click", "#next1"], ["select", "#country", "JP"], ["fill", "#zip", "1500001"], ["fill", "#pref", "東京都"], ["fill", "#city", "渋谷区"], ["click", "#next2"], ["fill", "#n1", "山田"], ["fill", "#n2", "太郎"], ["fill", "#mail", "taro.yamada.test@example.com"], ["fill", "#tel", "09012345678"], ["fill", "#birth", "1995-04-01"], ["click", "#submit"]];
    return { mcp_definition: repaired, notes: [`Visible errors: ${formatErrors(analysisInput.visibleErrors)}`, "Detected combined failure from honeypot, missing fields, and unnormalized formats.", "Added honeypot prohibition, exact step order, missing #x2/#n2 fields, and strict formats."] };
  }

  return { mcp_definition: repaired, notes: ["Generic repaired MCP produced."] };
}

function toCsv(rows) {
  return [
    "form,low_success,low_result,low_steps,repaired_success,repaired_result,repaired_steps,attempts,repair_notes",
    ...rows.map((row) => [row.form, row.low_success, row.low_result, row.low_steps, row.repaired_success, row.repaired_result, row.repaired_steps, row.attempts, JSON.stringify(row.repair_notes)].join(","))
  ].join("\n") + "\n";
}

function formatErrors(errors) {
  return errors?.length ? errors.map((error) => `${error.selector ?? "unknown"}=${error.text}`).join("; ") : "none";
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
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
