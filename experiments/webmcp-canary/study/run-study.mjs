#!/usr/bin/env node
/**
 * AEO validation study runner. See study/README.md.
 *
 *   node study/run-study.mjs plan    [--sample ...] [--repeats 3] [--engines gemini]
 *   node study/run-study.mjs score   [--sample ...] [--out study/out] [--rescore] [--dry-run]
 *   node study/run-study.mjs measure [--engines gemini] [--repeats 3] [--max-calls N] ... [--dry-run]
 *
 * Keys come from environment variables only (GEMINI_API_KEY, and for paid
 * engines PERPLEXITY_API_KEY / OPENAI_API_KEY). They are never printed,
 * written to disk, or put in a URL.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv } from "./lib/csv.mjs";
import { ENGINE_INFO, GEMINI_FREE_GROUNDED_RPD, buildMeasure, loadExternalEngines } from "./lib/engines.mjs";
import { planTasks, readJsonl, runMeasurements } from "./lib/runner.mjs";
import { scoreSite } from "./lib/scorer.mjs";
import { INITIAL_AEO_RULESET } from "../worker/aeo-rules.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

export function parseArgs(argv) {
  const [command = "help", ...rest] = argv;
  const flags = {};
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (!arg.startsWith("--")) continue;
    const [name, inline] = arg.slice(2).split("=", 2);
    if (inline !== undefined) flags[name] = inline;
    else if (rest[i + 1] !== undefined && !rest[i + 1].startsWith("--")) { flags[name] = rest[i + 1]; i += 1; }
    else flags[name] = true;
  }
  return { command, flags };
}

const num = (value, fallback) => (value === undefined || value === true ? fallback : Number(value));

export function loadSample(path) {
  const rows = parseCsv(readFileSync(path, "utf8"));
  const bad = rows.filter((r) => !r.id || !r.name || !r.url || !r.category);
  if (bad.length) throw new Error(`sample rows missing id/name/url/category: ${bad.map((r) => r.id || "?").join(", ")}`);
  return rows.filter((r) => String(r.exclude || "").toLowerCase() !== "yes");
}

/** Defaults sized to stay well inside the Gemini free tier (500 grounded RPD). */
export const FREE_DEFAULTS = Object.freeze({ repeats: 3, maxCallsPerDay: 450, maxTotalCalls: 1200, minIntervalMs: 7000 });

export async function main(argv = process.argv.slice(2), { env = process.env, stdout = console.log, fetchImpl = fetch } = {}) {
  const { command, flags } = parseArgs(argv);
  const samplePath = resolve(flags.sample || join(HERE, "sample.csv"));
  const outDir = resolve(flags.out || join(HERE, "out"));
  const dry = flags["dry-run"] === true;
  const freeOnly = flags["allow-paid"] !== true;
  const engines = dry ? ["stub"] : String(flags.engines || "gemini").split(",").map((s) => s.trim()).filter(Boolean);
  const repeats = num(flags.repeats, FREE_DEFAULTS.repeats);
  const models = {};
  if (flags.model) for (const id of engines) if (id.startsWith("gemini")) models[id] = String(flags.model);
  for (const id of engines) if (!models[id] && ENGINE_INFO[id]?.defaultModel) models[id] = ENGINE_INFO[id].defaultModel;

  if (command === "help" || flags.help) {
    stdout(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(2, 13).map((l) => l.replace(/^ \* ?/, "")).join("\n"));
    return 0;
  }

  const businesses = loadSample(samplePath);
  mkdirSync(outDir, { recursive: true });

  if (command === "plan") {
    const tasks = planTasks({ businesses, engines, repeats, models });
    const perEngine = Object.fromEntries(engines.map((e) => [e, tasks.filter((t) => t.engine === e).length]));
    const unique = new Set(tasks.map((t) => t.question.text)).size;
    stdout(`businesses: ${businesses.length}\nunique questions: ${unique}\nrepeats: ${repeats}\ncalls per engine: ${JSON.stringify(perEngine)}\ntotal calls: ${tasks.length}`);
    if (engines.includes("gemini")) stdout(`gemini free tier: ${GEMINI_FREE_GROUNDED_RPD} grounded requests/day (shared Flash/Flash-Lite) -> at --max-calls-per-day ${FREE_DEFAULTS.maxCallsPerDay}, about ${Math.ceil(perEngine.gemini / FREE_DEFAULTS.maxCallsPerDay)} day(s)`);
    return 0;
  }

  if (command === "score") {
    const scoresPath = join(outDir, dry ? "scores.dry.jsonl" : "scores.jsonl");
    const existing = new Map(readJsonl(scoresPath).filter((r) => r.ok).map((r) => [r.id, r]));
    let definition = INITIAL_AEO_RULESET.definition, rulesetVersion = INITIAL_AEO_RULESET.version;
    if (flags["ruleset-json"]) {
      const raw = JSON.parse(readFileSync(resolve(flags["ruleset-json"]), "utf8"));
      definition = raw.definition || (raw.definition_json ? JSON.parse(raw.definition_json) : raw);
      rulesetVersion = raw.version ?? "custom";
    }
    const lines = [];
    let n = 0;
    for (const b of businesses) {
      if (existing.has(b.id) && flags.rescore !== true) continue;
      let row;
      if (dry) row = dryScore(b);
      else {
        try { row = await scoreSite(b.url, { fetchImpl, definition, rulesetVersion }); }
        catch (error) { row = { ok: false, url: b.url, error: String(error?.code || error?.message || error) }; }
        await new Promise((r) => setTimeout(r, num(flags["score-interval-ms"], 1500)));
      }
      row = { id: b.id, ...row };
      lines.push(JSON.stringify(row));
      writeFileSync(scoresPath, `${JSON.stringify(row)}\n`, { flag: "a" });
      n += 1;
      stdout(`${b.id} ${row.ok ? `score=${row.score} band=${row.band} gate=${row.gate_passed}` : `ERROR ${row.error}`}`);
    }
    stdout(`scored ${n} site(s) -> ${scoresPath}`);
    return 0;
  }

  if (command === "measure") {
    if (!dry && engines.includes("gemini") && flags["ack-grounding-terms"] !== true) {
      stdout("Refusing: Gemini grounded answers are covered by the 'Grounding with Google Search' section of the Gemini API Additional Terms, which restricts storing and analysing Grounded Results. Read study/README.md (利用規約の注意) and decide; then re-run with --ack-grounding-terms.");
      return 2;
    }
    if (!dry && engines.includes("gemini") && flags.store === "full") {
      stdout("Refusing: --store full would keep Grounded Result text and source hosts; the Grounding terms restrict storing them. Use the default --store flags for engine gemini.");
      return 2;
    }
    let external = null;
    if (flags["engines-module"]) external = await loadExternalEngines(String(flags["engines-module"]), env);
    let measure;
    try {
      measure = buildMeasure({ engines, env, models, freeOnly, allowModels: flags["allow-model"] ? String(flags["allow-model"]).split(",") : [], external, fetchImpl });
    } catch (error) { stdout(`Refusing: ${error.message}`); return 2; }
    const suffix = dry ? ".dry" : "";
    const summary = await runMeasurements({
      businesses: dry ? businesses.map((b) => ({ ...b, __stubScore: dryScore(b).score })) : businesses,
      engines, repeats, models, measure,
      cachePath: join(outDir, `measurements${suffix}.jsonl`),
      ledgerPath: join(outDir, `calls-ledger${suffix}.jsonl`),
      maxCalls: num(flags["max-calls"], Infinity),
      maxTotalCalls: num(flags["max-total-calls"], freeOnly && !dry ? FREE_DEFAULTS.maxTotalCalls : Infinity),
      maxCallsPerDay: num(flags["max-calls-per-day"], freeOnly && !dry ? FREE_DEFAULTS.maxCallsPerDay : Infinity),
      minIntervalMs: dry ? 0 : num(flags["min-interval-ms"], FREE_DEFAULTS.minIntervalMs),
      store: flags.store || "flags",
      log: (line) => stdout(line),
    });
    stdout(JSON.stringify(summary, null, 2));
    if (summary.stop && !["max_calls", "max_calls_per_day", "max_total_calls"].includes(summary.stop.reason)) return 3;
    return 0;
  }

  stdout(`unknown command "${command}" (plan | score | measure)`);
  return 1;
}

/** Fake but deterministic scores for --dry-run, so analysis can be exercised. */
export function dryScore(b) {
  let h = 0;
  for (const ch of `${b.id}${b.url}`) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  const score = 10 + (h % 81);
  const pts = (w, k) => Math.round(w * (((h >>> k) % 3) / 2) * 100) / 100;
  return { ok: true, url: b.url, score, band: score >= 80 ? "green" : score >= 50 ? "yellow" : "red", gate_passed: score > 15, raw_score: score, pts_schema: pts(30, 2), pts_coverage: pts(25, 4), pts_legibility: pts(20, 6), pts_llms: pts(15, 8), pts_consistency: pts(10, 10), dry_run: true };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((code) => { process.exitCode = code; }, (error) => { console.error(String(error?.message || error)); process.exitCode = 1; });
}
