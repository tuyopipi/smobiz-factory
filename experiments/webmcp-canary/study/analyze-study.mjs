#!/usr/bin/env node
/**
 * node study/analyze-study.mjs [--sample study/sample.csv] [--out study/out] [--dry-run] [--iterations 10000]
 *
 * Reads out/scores.jsonl and out/measurements.jsonl (or the .dry variants),
 * writes out/report.md, out/business_results.csv and out/raw_measurements.csv.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv, toCsv } from "./lib/csv.mjs";
import { readJsonl } from "./lib/runner.mjs";
import { ENGINE_INFO } from "./lib/engines.mjs";
import { analyzeStudy, renderReport } from "./lib/analysis.mjs";
import { parseArgs } from "./run-study.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

export async function main(argv = process.argv.slice(2), { stdout = console.log } = {}) {
  const { flags } = parseArgs(["analyze", ...argv]);
  const dry = flags["dry-run"] === true;
  const suffix = dry ? ".dry" : "";
  const outDir = resolve(flags.out || join(HERE, "out"));
  const businesses = parseCsv(readFileSync(resolve(flags.sample || join(HERE, "sample.csv")), "utf8")).filter((r) => String(r.exclude || "").toLowerCase() !== "yes");
  const scores = readJsonl(join(outDir, `scores${suffix}.jsonl`));
  const measurements = readJsonl(join(outDir, `measurements${suffix}.jsonl`));
  // Last answer wins if a task was retried after a failure.
  const latest = new Map();
  for (const m of measurements) if (m.ok) latest.set(m.key, m);
  const okMeasurements = [...latest.values()];
  const latestScores = [...new Map(scores.map((s) => [s.id, s])).values()];
  const engines = [...new Set(okMeasurements.map((m) => m.engine))].sort();
  const iterations = Number(flags.iterations || 10000);
  const results = engines.map((engine) => analyzeStudy({ businesses, scores: latestScores, measurements: okMeasurements, engine, iterations }));
  const labels = Object.fromEntries(Object.values(ENGINE_INFO).map((e) => [e.id, e.label]));
  writeFileSync(join(outDir, "report.md"), renderReport(results, { dryRun: dry, engineLabels: labels }));
  writeFileSync(join(outDir, "business_results.csv"), toCsv(results.flatMap((r) => r.all.map((row) => ({ engine: r.engine, ...row })))));
  const raw = okMeasurements.flatMap((m) => Object.entries(m.results || {}).map(([id, r]) => ({ engine: m.engine, model: m.engine_model || m.model, qid: m.qid, kind: m.kind, question: m.question, repeat: m.repeat, business_id: id, mentioned: r.mentioned ? 1 : 0, cited: r.cited ? 1 : 0, citation_rank: r.citation_rank ?? "", measured_at: m.measured_at })));
  writeFileSync(join(outDir, "raw_measurements.csv"), toCsv(raw));
  for (const r of results) stdout(`${r.engine}: n=${r.n} verdict=${r.verdict.code}${r.primary ? ` rho=${r.primary.rho.toFixed(3)} p=${r.primary.p.toFixed(4)}` : ""}`);
  if (!engines.length) stdout("no successful measurements yet");
  stdout(`wrote ${join(outDir, "report.md")}`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((code) => { process.exitCode = code; }, (error) => { console.error(String(error?.message || error)); process.exitCode = 1; });
}
