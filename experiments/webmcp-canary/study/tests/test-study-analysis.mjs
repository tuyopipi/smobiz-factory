import assert from "node:assert/strict";
import { binomialGlm, designMatrix, minimumDetectableRho, mulberry32, ranks, spearman, spearmanPermutation } from "../lib/stats.mjs";
import { analyzeStudy, renderReport } from "../lib/analysis.mjs";
import { parseCsv, toCsv } from "../lib/csv.mjs";

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

/* ---------------- basic statistics ---------------- */
assert.deepEqual(ranks([10, 20, 20, 30]), [1, 2.5, 2.5, 4], "ties get average ranks");
close(spearman([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]), 1, 1e-12, "monotone = 1");
close(spearman([1, 2, 3, 4, 5], [5, 4, 3, 2, 1]), -1, 1e-12, "reversed = -1");
close(spearman([1, 2, 2, 3], [1, 3, 2, 4]), 4.5 / Math.sqrt(22.5), 1e-12, "hand-computed value with ties");
close(minimumDetectableRho(60), 0.355, 0.01, "n=60 detects |rho| >= ~0.36 at 80% power");
{
  const rand = mulberry32(3);
  const x = Array.from({ length: 40 }, () => rand()), y = Array.from({ length: 40 }, () => rand());
  const p = spearmanPermutation(x, y, { iterations: 2000 }).p;
  assert.ok(p > 0.05, `independent data is usually not significant (p=${p})`);
}
{
  // GLM recovers a known slope.
  const rand = mulberry32(42);
  const rows = Array.from({ length: 400 }, () => ({ x: rand() * 4 - 2 }));
  const trials = rows.map(() => 30);
  const successes = rows.map((r, i) => { const p = 1 / (1 + Math.exp(-(-0.5 + 1.0 * r.x))); let s = 0; for (let k = 0; k < trials[i]; k += 1) if (rand() < p) s += 1; return s; });
  const { X } = designMatrix(rows, { numeric: ["x"] });
  const fit = binomialGlm(X, successes, trials);
  close(fit.beta[1], 1.0, 0.1, "slope recovered");
  close(fit.beta[0], -0.5, 0.1, "intercept recovered");
}

/* ---------------- CSV round trip ---------------- */
{
  const rows = [{ a: "x,y", b: 'say "hi"', c: "line\nbreak" }];
  assert.deepEqual(parseCsv(toCsv(rows)), rows);
}

/* ---------------- synthetic studies ---------------- */
const CATS = ["飲食", "美容", "歯科", "士業", "宿泊"], CITIES = ["東京", "大阪", "福岡", "札幌"];

function synth({ n = 60, seed = 1, prob, scoreFn, trials = 9, brandedMention = 0.95 }) {
  const rand = mulberry32(seed);
  const businesses = [], scores = [], measurements = [];
  for (let i = 0; i < n; i += 1) {
    const id = `s${i}`;
    const category = CATS[i % CATS.length], city = CITIES[Math.floor(i / CATS.length) % CITIES.length];
    businesses.push({ id, name: `店${i}`, category, city, url: `https://s${i}.example.jp/` });
    const score = scoreFn ? scoreFn(i, category, rand) : Math.round(10 + rand() * 85);
    scores.push({ id, ok: true, score, raw_score: score, band: score >= 80 ? "green" : score >= 50 ? "yellow" : "red", gate_passed: score > 15, pts_schema: score * 0.3, pts_coverage: score * 0.25 + rand() * 5, pts_legibility: rand() * 20, pts_llms: rand() < 0.3 ? 15 : 0, pts_consistency: rand() * 10 });
    const p = prob(score, category, rand);
    for (let t = 0; t < trials; t += 1) {
      const hit = rand() < p;
      measurements.push({ ok: true, engine: "gemini", kind: "discovery", key: `${id}-${t}`, results: { [id]: { mentioned: hit, cited: false } } });
    }
    for (let t = 0; t < 3; t += 1) measurements.push({ ok: true, engine: "gemini", kind: "branded", key: `${id}-b${t}`, results: { [id]: { mentioned: rand() < brandedMention, cited: rand() < score / 100 } } });
  }
  return { businesses, scores, measurements };
}

{
  // Known positive relationship: logit(p) rises steeply with score.
  const data = synth({ seed: 7, prob: (s) => 1 / (1 + Math.exp(-(-3 + 0.05 * s))) });
  const r = analyzeStudy({ ...data, engine: "gemini", iterations: 2000 });
  assert.equal(r.n, 60);
  assert.ok(r.primary.rho > 0.4, `strong synthetic relation gives high rho (${r.primary.rho})`);
  assert.ok(r.primary.p < 0.01);
  assert.ok(r.glmScore.ok && r.glmScore.oddsRatio > 1.5, "odds ratio per SD > 1");
  assert.equal(r.verdict.code, "support", JSON.stringify(r.verdict));
  const md = renderReport([r], { engineLabels: { gemini: "Gemini" } });
  assert.ok(md.includes("結論: 支持"), "report states the conclusion in Japanese");
  assert.ok(md.includes("相関は因果ではありません"));
}
{
  // Null: appearance unrelated to score.
  const data = synth({ seed: 8, prob: () => 0.3 });
  const r = analyzeStudy({ ...data, engine: "gemini", iterations: 2000 });
  assert.ok(Math.abs(r.primary.rho) < 0.3, `null rho small (${r.primary.rho})`);
  assert.notEqual(r.verdict.code, "support", "null data is never 'support'");
}
{
  // Confounded: category drives both score and appearance; no within-category relation.
  const base = { 飲食: 20, 美容: 35, 歯科: 50, 士業: 65, 宿泊: 80 };
  const data = synth({ seed: 9, scoreFn: (i, c, rand) => Math.round(base[c] + rand() * 10), prob: (s, c) => base[c] / 120 });
  const r = analyzeStudy({ ...data, engine: "gemini", iterations: 2000 });
  assert.ok(r.primary.rho > 0.5, `raw rho is inflated by category (${r.primary.rho})`);
  assert.ok(Math.abs(r.fe.rho) < 0.3, `fixed effects remove it (${r.fe.rho})`);
  assert.notEqual(r.verdict.code, "support", "a pure category confound does not count as support");
}
{
  // Floor effect: almost nobody appears -> inconclusive, not "no effect".
  const data = synth({ seed: 10, prob: () => 0.005 });
  const r = analyzeStudy({ ...data, engine: "gemini", iterations: 500 });
  assert.equal(r.verdict.code, "inconclusive");
}
{
  // Broken alias detection (branded questions rarely detected) -> inconclusive.
  const data = synth({ seed: 11, prob: (s) => s / 150, brandedMention: 0.2 });
  const r = analyzeStudy({ ...data, engine: "gemini", iterations: 500 });
  assert.equal(r.verdict.code, "inconclusive");
  assert.ok(r.verdict.reasons.some((x) => x.includes("名指し")));
}
{
  // Drop-outs: unscored or under-measured businesses are excluded and listed.
  const data = synth({ n: 40, seed: 12, prob: () => 0.3 });
  data.scores[0].ok = false;
  data.measurements = data.measurements.filter((m) => !(m.results.s1 && m.kind === "discovery"));
  const r = analyzeStudy({ ...data, engine: "gemini", iterations: 200 });
  assert.equal(r.n, 38);
  assert.deepEqual(r.excluded.map((e) => e.reason).sort(), ["score_failed", "too_few_answers"]);
}

console.log("study analysis tests passed");
