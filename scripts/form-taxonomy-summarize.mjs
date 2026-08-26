#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  aggregateSummaries,
  classifyRun,
  summarizeForm,
  summariesToCsv
} from "../dist/src/experiments/formFailureTaxonomy.js";

const root = process.cwd();
const experimentDir = join(root, "experiments", "form-failure-taxonomy");
const fixturesDir = join(experimentDir, "fixtures");
const resultsDir = join(experimentDir, "results");
const outDir = join(experimentDir, "summary");

const persona = await readJson(join(fixturesDir, "persona.json"));
const formDirs = await readdir(resultsDir, { withFileTypes: true });
const summaries = [];
const failuresByForm = {};

for (const entry of formDirs) {
  if (!entry.isDirectory()) continue;
  const formId = entry.name;
  const tracePath = join(resultsDir, formId, "trace.json");
  const groundTruthPath = join(fixturesDir, `ground_truth.${formId}.json`);
  if (!existsSync(tracePath) || !existsSync(groundTruthPath)) continue;

  const run = await readJson(tracePath);
  const groundTruth = await readJson(groundTruthPath);
  const failures = classifyRun(run, groundTruth, persona);
  failuresByForm[formId] = failures;
  summaries.push(summarizeForm(run, failures));
}

summaries.sort((a, b) => a.form_id.localeCompare(b.form_id));
const aggregate = aggregateSummaries(summaries, failuresByForm);

await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, "summary.csv"), summariesToCsv(summaries));
await writeFile(join(outDir, "summary.json"), JSON.stringify({ aggregate, forms: summaries, failuresByForm }, null, 2) + "\n");

console.log(JSON.stringify({
  forms: summaries.length,
  total_failures: aggregate.total_failures,
  star_failures: aggregate.star_failures,
  star_rate: aggregate.star_rate,
  outputs: [
    "experiments/form-failure-taxonomy/summary/summary.csv",
    "experiments/form-failure-taxonomy/summary/summary.json"
  ]
}, null, 2));

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}
