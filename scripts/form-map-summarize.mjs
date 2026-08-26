#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { scoreRun, summarizeLift } from "../dist/src/experiments/formMapLift.js";

const root = process.cwd();
const experimentDir = join(root, "experiments", "form-map-lift");
const resultsDir = join(experimentDir, "results");
const outDir = join(experimentDir, "summary");

const runs = [];
if (existsSync(resultsDir)) {
  for (const siteEntry of await readdir(resultsDir, { withFileTypes: true })) {
    if (!siteEntry.isDirectory()) continue;
    const siteDir = join(resultsDir, siteEntry.name);
    for (const armEntry of await readdir(siteDir, { withFileTypes: true })) {
      if (!armEntry.isDirectory()) continue;
      const armDir = join(siteDir, armEntry.name);
      for (const trialEntry of await readdir(armDir, { withFileTypes: true })) {
        if (!trialEntry.isDirectory()) continue;
        const scorePath = join(armDir, trialEntry.name, "score.json");
        if (!existsSync(scorePath)) continue;
        runs.push(scoreRun(JSON.parse(await readFile(scorePath, "utf8"))));
      }
    }
  }
}

const summary = summarizeLift(runs);
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, "summary.json"), JSON.stringify({ summary, runs }, null, 2) + "\n");
await writeFile(join(outDir, "site-lift.csv"), siteLiftCsv(summary.site_lift));
await writeFile(join(outDir, "vertical-lift.csv"), verticalLiftCsv(summary.vertical_lift));

console.log(JSON.stringify({
  runs: runs.length,
  x: summary.x,
  y: summary.y,
  y_minus_x: summary.y_minus_x,
  decision: summary.decision,
  outputs: [
    "experiments/form-map-lift/summary/summary.json",
    "experiments/form-map-lift/summary/site-lift.csv",
    "experiments/form-map-lift/summary/vertical-lift.csv"
  ]
}, null, 2));

function siteLiftCsv(rows) {
  return [
    "site_id,vertical,A_successes,B_successes,diff",
    ...rows.map((row) => [row.site_id, row.vertical, row.a_successes, row.b_successes, row.diff].join(","))
  ].join("\n") + "\n";
}

function verticalLiftCsv(rows) {
  return [
    "vertical,X,Y,Y_minus_X,valid_A_runs,valid_B_runs",
    ...rows.map((row) => [row.vertical, row.x, row.y, row.diff, row.valid_a_runs, row.valid_b_runs].join(","))
  ].join("\n") + "\n";
}
