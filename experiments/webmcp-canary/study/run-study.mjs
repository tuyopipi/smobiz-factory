#!/usr/bin/env node
/**
 * AEO validation study runner. See study/README.md.
 *
 *   node study/run-study.mjs plan    [--sample ...] [--repeats 3]
 *   node study/run-study.mjs score   [--sample ...] [--out study/out] [--rescore] [--dry-run]
 *   node study/run-study.mjs measure [--repeats 3] [--max-calls N] [--max-usd 3] [--dry-run]
 *
 * Engine: Perplexity (Agent API, preset "fast"), the Pro product's adapter.
 * --max-calls (default: the planned total) and --max-usd (default 3) are
 * cumulative over every run in the same --out directory.
 * The key comes from PERPLEXITY_API_KEY only; it is never printed, written to
 * disk, or put in a URL.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv } from "./lib/csv.mjs";
import { ENGINE_INFO, PER_CALL_ASSUMPTION, PRICING_SOURCES, buildMeasure, engineModel, perCallCeilingUsd } from "./lib/engines.mjs";
import { ledgerTotals, planTasks, readJsonl, runMeasurements } from "./lib/runner.mjs";
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

/** Budget defaults (owner decision: small paid budget on Perplexity). */
export const STUDY_DEFAULTS = Object.freeze({ repeats: 3, maxUsd: 3, minIntervalMs: 2000 });

export async function main(argv = process.argv.slice(2), { env = process.env, stdout = console.log, fetchImpl = fetch } = {}) {
  const { command, flags } = parseArgs(argv);
  const samplePath = resolve(flags.sample || join(HERE, "sample.csv"));
  const outDir = resolve(flags.out || join(HERE, "out"));
  const dry = flags["dry-run"] === true;
  const engines = dry ? ["stub"] : ["perplexity"];
  if (!dry && flags.engines !== undefined && String(flags.engines) !== "perplexity") {
    stdout("Refusing: the study measures with perplexity only (Gemini is excluded by its grounding terms; see study/README.md).");
    return 2;
  }
  const repeats = num(flags.repeats, STUDY_DEFAULTS.repeats);
  const models = Object.fromEntries(engines.map((id) => [id, engineModel(id)]));

  if (command === "help" || flags.help) {
    stdout(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(2, 15).map((l) => l.replace(/^ \* ?/, "")).join("\n"));
    return 0;
  }

  const businesses = loadSample(samplePath);
  mkdirSync(outDir, { recursive: true });

  if (command === "plan") {
    const tasks = planTasks({ businesses, engines, repeats, models });
    const perEngine = Object.fromEntries(engines.map((e) => [e, tasks.filter((t) => t.engine === e).length]));
    const unique = new Set(tasks.map((t) => t.question.text)).size;
    stdout(`businesses: ${businesses.length}\nunique questions: ${unique}\nrepeats: ${repeats}\ncalls per engine: ${JSON.stringify(perEngine)}\ntotal calls: ${tasks.length}`);
    for (const engine of engines.filter((e) => e !== "stub")) {
      const ceiling = perCallCeilingUsd(engine);
      stdout(`${ENGINE_INFO[engine].label}: <= $${ceiling.toFixed(4)} per call (1 Fast Search + ${PER_CALL_ASSUMPTION.inputTokens} input + ${PER_CALL_ASSUMPTION.outputTokens} output tokens at list price)`);
      stdout(`estimated ceiling for ${perEngine[engine]} calls: $${(ceiling * perEngine[engine]).toFixed(2)} (default --max-usd ${STUDY_DEFAULTS.maxUsd})`);
      stdout(`pricing: ${PRICING_SOURCES.join(" , ")}`);
    }
    const ledger = ledgerTotals(readJsonl(join(outDir, dry ? "calls-ledger.dry.jsonl" : "calls-ledger.jsonl")));
    stdout(`already in ledger: ${ledger.calls} call(s), $${ledger.usd.toFixed(4)} (est.)`);
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
    if (flags.store === true || (flags.store && !["flags", "full"].includes(flags.store))) { stdout("Refusing: --store must be flags or full"); return 2; }
    let measure;
    try {
      measure = buildMeasure({ engines, env, fetchImpl });
    } catch (error) { stdout(`Refusing: ${error.message}`); return 2; }
    const planned = planTasks({ businesses, engines, repeats, models }).length;
    const maxCalls = num(flags["max-calls"], planned);
    const maxUsd = num(flags["max-usd"], STUDY_DEFAULTS.maxUsd);
    if (!Number.isFinite(maxCalls) || maxCalls < 0 || !Number.isFinite(maxUsd) || maxUsd < 0) { stdout("Refusing: --max-calls and --max-usd must be non-negative numbers"); return 2; }
    const suffix = dry ? ".dry" : "";
    if (!dry) stdout(`budget: --max-calls ${maxCalls} (planned ${planned}), --max-usd ${maxUsd}, <= $${perCallCeilingUsd("perplexity").toFixed(4)} reserved per call`);
    const summary = await runMeasurements({
      businesses: dry ? businesses.map((b) => ({ ...b, __stubScore: dryScore(b).score })) : businesses,
      engines, repeats, models, measure,
      cachePath: join(outDir, `measurements${suffix}.jsonl`),
      ledgerPath: join(outDir, `calls-ledger${suffix}.jsonl`),
      maxCalls, maxUsd, perCallUsd: (engine) => perCallCeilingUsd(engine),
      minIntervalMs: dry ? 0 : num(flags["min-interval-ms"], STUDY_DEFAULTS.minIntervalMs),
      store: flags.store || "flags",
      log: (line) => stdout(line),
    });
    stdout(JSON.stringify(summary, null, 2));
    if (summary.stop && !["max_calls", "max_usd"].includes(summary.stop.reason)) return 3;
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
