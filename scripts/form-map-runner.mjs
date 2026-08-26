#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { buildPrompt, mapForArm, postBlockRoutePattern, scoreRun } from "../dist/src/experiments/formMapLift.js";

const root = process.cwd();
const experimentDir = join(root, "experiments", "form-map-lift");
const fixturesDir = join(experimentDir, "fixtures");
const resultsDir = join(experimentDir, "results");

const siteId = requiredArg("--site-id");
const arm = arg("--arm") ?? "A";
const trial = Number(arg("--trial") ?? "1");
const headless = (arg("--headless") ?? "false") === "true";

const persona = await readJson(join(fixturesDir, "persona.json"));
const manifest = await readJson(join(fixturesDir, "sites.manifest.json"));
const site = manifest.find((entry) => entry.site_id === siteId);
if (!site) throw new Error(`Unknown site_id: ${siteId}`);
if (!site.url) throw new Error(`Site ${siteId} has no URL. Human target selection is required first.`);
if (site.submit_policy !== "block_submit") throw new Error(`Site ${siteId} must use submit_policy=block_submit.`);
if (!site.robots_checked) throw new Error(`Site ${siteId} must have robots_checked=true before execution.`);

const siteMap = arm === "A" ? undefined : mapForArm(await readJson(join(fixturesDir, "maps", `${siteId}.json`)), arm);
const prompt = buildPrompt(site.url, persona, siteMap);
const runDir = join(resultsDir, siteId, arm, String(trial));
await mkdir(runDir, { recursive: true });
await writeFile(join(runDir, "prompt.txt"), prompt);

const browser = await chromium.launch({ headless });
const context = await browser.newContext();
const page = await context.newPage();
const blockedRequests = [];

await page.route(postBlockRoutePattern(site.url), async (route) => {
  const request = route.request();
  const method = request.method().toUpperCase();
  if (method === "POST" || method === "PUT" || method === "PATCH") {
    blockedRequests.push({ method, url: request.url(), postData: request.postData() });
    await route.abort("blockedbyclient");
    return;
  }
  await route.continue();
});

await page.goto(site.url, { waitUntil: "domcontentloaded" });
await page.screenshot({ path: join(runDir, "initial.png"), fullPage: true });

await writeFile(join(runDir, "runner-state.json"), JSON.stringify({
  site_id: siteId,
  arm,
  trial,
  status: "manual_or_agent_action_required",
  headless,
  prompt_path: join(runDir, "prompt.txt"),
  blocked_requests: blockedRequests,
  note: "This safety runner opens the page and blocks submit requests. Wire browser-use or manual Playwright actions before final scoring."
}, null, 2) + "\n");

if (process.env.FORM_MAP_KEEP_OPEN === "1") {
  console.log(`Browser left open for inspection. Run dir: ${runDir}`);
} else {
  await browser.close();
  const score = scoreRun({
    site_id: site.site_id,
    vertical: site.vertical,
    arm,
    trial,
    fields_expected: 0,
    fields_correct: 0,
    fields_wrong_value: 0,
    fields_empty: 0,
    traps_triggered: [],
    visible_errors: [],
    step_reached: 0,
    step_total: 0,
    submitted: blockedRequests.length > 0
  });
  await writeFile(join(runDir, "score.placeholder.json"), JSON.stringify(score, null, 2) + "\n");
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function requiredArg(name) {
  const value = arg(name);
  if (!value) throw new Error(`Missing required argument: ${name}`);
  return value;
}
