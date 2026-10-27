/**
 * AEO score v2 (worker/aeo-score-v2.mjs, docs/score-v2.md, migration 0048).
 *
 *   1. the formula: no measurement, tiny n, large n, 0% and 100%, monotonic,
 *      no readiness, bands
 *   2. evidence from real SQLite: Pro runs (per-engine split and older rows),
 *      the free check, the 90-day window; the store writes the v2 columns and
 *      falls back before 0048; a v1 row is read as v1, never relabelled
 *   3. API shape: /aeo-metrics (aeo_score, per-row version, switches) and the
 *      Pro report's aeo_score
 *   4. dashboard rendering in the eight languages: headline + two sub-scores
 *      + "based on N AI answers" + variability notice, or "not measured";
 *      the trend never joins v1 and v2 and marks the switch; no NaN/undefined
 *   5. reports: the monthly report and the agency report show the same
 *      headline and sub-scores
 *   6. Pro questions: questions_asked vs distinct_questions x repetitions,
 *      stored and shown as "5問 × 2回"
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import vm from "node:vm";
import {
  AEO_SCORE_VERSION, CREDIBILITY_K, LEGACY_SCORE_VERSION, aeoBand, collectVisibilityEvidence, combineAeoScore, currentAeoScore,
  freeCheckCounts, proRunCounts, publicAeoScore, scoreVersionSwitches, storedScoreView, visibilityFromCounts, wilsonCentre,
} from "../worker/aeo-score-v2.mjs";
import { storeAeoScore } from "../worker/diagnose.mjs";
import { aggregateSov, loadSovHistory, maxRepetitions, storeSovRun } from "../worker/aeo-sov.mjs";
import { buildMonthlyReport, renderMonthlyReportHtml, renderMonthlyReportText } from "../worker/aeo-report.mjs";
import { buildAgencyReport, renderAgencyReportHtml, renderAgencyReportText } from "../worker/agency-report.mjs";
import { REPORT_BODY_LANGS, REPORT_COPY } from "../worker/agency-report-i18n.mjs";
import { loadProReport } from "../worker/pro-report.mjs";
import { handleApi } from "../worker/api.mjs";
import { LANGS, tFor } from "./dashboard-dictionary.mjs";

const sql = (file) => readFileSync(new URL(`../nurevo-impl/db/${file}`, import.meta.url), "utf8");
const DAY = 86400e3;
const NOW = Date.parse("2026-10-27T00:00:00Z");
const iso = (ms) => new Date(ms).toISOString();

/* ================================================================== *
 * 1. The formula
 * ================================================================== */
{
  // No measurement: the headline is the readiness score, labelled as such.
  const none = combineAeoScore({ readiness: 97, visibility: visibilityFromCounts({ n: 0 }) });
  assert.equal(none.score, 97);
  assert.equal(none.basis, "readiness_only");
  assert.equal(none.visibility.measured, false);
  assert.equal(none.visibility.score, null, "not measured is null, never 0");
  assert.equal(none.score_version, AEO_SCORE_VERSION);
  assert.deepEqual(combineAeoScore({ readiness: 97 }).score, 97, "no visibility at all is the same");

  // The owner's example: nurevo.jp, readiness 97, appeared in 0 of 10 answers.
  const nurevo = visibilityFromCounts({ n: 10, named: 0, cited: 0, appeared: 0 });
  assert.equal(nurevo.score, 14, "Wilson centre of 0/10 (z=1.96)");
  assert.equal(nurevo.weight, 0.333);
  assert.equal(nurevo.share, 0.167);
  const nurevoScore = combineAeoScore({ readiness: 97, visibility: nurevo });
  assert.equal(nurevoScore.score, 83, "97 * (1 - 1/6) + 13.9 * 1/6");
  assert.equal(nurevoScore.band, "green");
  assert.equal(nurevoScore.basis, "combined");
  // Three weekly runs of 0/10 move it into yellow; sustained evidence counts.
  assert.equal(combineAeoScore({ readiness: 97, visibility: visibilityFromCounts({ n: 30 }) }).score, 70);
  assert.equal(combineAeoScore({ readiness: 97, visibility: visibilityFromCounts({ n: 30 }) }).band, "yellow");

  // Tiny n barely moves it, either way.
  const oneHit = combineAeoScore({ readiness: 60, visibility: visibilityFromCounts({ n: 1, named: 1, cited: 1, appeared: 1 }) });
  const oneMiss = combineAeoScore({ readiness: 60, visibility: visibilityFromCounts({ n: 1 }) });
  assert.ok(Math.abs(oneHit.score - 60) <= 1 && Math.abs(oneMiss.score - 60) <= 1, "one answer moves the headline by at most a point");
  const freeZero = combineAeoScore({ readiness: 97, visibility: visibilityFromCounts({ n: 3 }) });
  assert.equal(freeZero.score, 93, "the free check's 3 answers at 0%");

  // Large n: visibility gets close to half the weight.
  const big0 = combineAeoScore({ readiness: 97, visibility: visibilityFromCounts({ n: 1000 }) });
  const big100 = combineAeoScore({ readiness: 40, visibility: visibilityFromCounts({ n: 1000, named: 1000, cited: 1000, appeared: 1000 }) });
  assert.ok(big0.visibility.weight > 0.97 && big0.score >= 48 && big0.score <= 50, `0% at n=1000 -> ~49 (got ${big0.score})`);
  assert.ok(big100.score >= 69 && big100.score <= 71, `100% at n=1000 -> ~70 (got ${big100.score})`);
  assert.equal(big100.visibility.score, 100);
  assert.equal(big0.visibility.score, 0);
  assert.equal(visibilityFromCounts({ n: 1000 }).observed_rate, 0);

  // 100% at small n is shrunk, not reported as 100.
  const ten = visibilityFromCounts({ n: 10, named: 10, cited: 10, appeared: 10 });
  assert.equal(ten.score, 86, "10/10 cited: Wilson centre 86");
  assert.ok(ten.interval.low < ten.score && ten.interval.high === 100);

  // Named only is worth less than cited (citation bonus); more is better.
  const named = visibilityFromCounts({ n: 40, named: 20, cited: 0, appeared: 20 });
  const cited = visibilityFromCounts({ n: 40, named: 20, cited: 20, appeared: 20 });
  assert.ok(cited.score > named.score, "a citation adds to an appearance");
  assert.equal(named.value, 0.375, "20 named of 40 = 0.75 * 0.5");
  assert.equal(cited.value, 0.5);
  let previous = -1;
  for (let k = 0; k <= 20; k += 5) {
    const s = combineAeoScore({ readiness: 70, visibility: visibilityFromCounts({ n: 20, named: k, appeared: k }) }).score;
    assert.ok(s >= previous, "more appearances never lower the headline");
    previous = s;
  }
  // Credibility: K answers give half of the full weight.
  assert.equal(visibilityFromCounts({ n: CREDIBILITY_K }).weight, 0.5);

  // No readiness: no headline, the visibility is still reported.
  const noReady = combineAeoScore({ readiness: null, visibility: visibilityFromCounts({ n: 10, named: 3 }) });
  assert.equal(noReady.score, null);
  assert.equal(noReady.basis, "none");
  assert.equal(noReady.visibility.measured, true);

  // Bands use the readiness thresholds.
  assert.deepEqual([aeoBand(80), aeoBand(79), aeoBand(50), aeoBand(49), aeoBand(null)], ["green", "yellow", "yellow", "red", null]);
  assert.equal(wilsonCentre(0, 0), null);
  // Garbage in stays finite.
  for (const bad of [{ n: "x" }, { n: -3 }, { n: 5, named: 99, cited: -1 }, { n: NaN }]) {
    const v = visibilityFromCounts(bad);
    assert.ok(!JSON.stringify(v).includes("NaN"), `no NaN from ${JSON.stringify(bad)}`);
    assert.ok(v.appeared <= v.answers);
  }

  // Counting a stored run / free check.
  assert.deepEqual(proRunCounts({ status: "measured", detail_json: JSON.stringify({ headline: { engine: "perplexity" }, by_engine: [{ engine: "perplexity", answers: 10, appearances: 2, citations: 1, appeared: 3 }, { engine: "openai", answers: 10, appearances: 9 }] }) }),
    { n: 10, named: 2, cited: 1, appeared: 3 }, "the headline engine's answers only");
  assert.deepEqual(proRunCounts({ status: "measured", appearance_rate: 0.5, citation_rate: 0.25, answers_received: 8, detail_json: "{}" }),
    { n: 8, named: 4, cited: 2, appeared: null }, "an older run is read from its rates");
  assert.equal(proRunCounts({ status: "unconfigured" }), null);
  assert.equal(proRunCounts({ status: "measured", answers_received: 1, appearance_rate: null, detail_json: "{}" }), null, "no rate, nothing to count");
  assert.deepEqual(freeCheckCounts({ status: "done", result_json: JSON.stringify({ questions: [{ answered: true, named: true }, { answered: true, cited: true }, { answered: false }] }) }),
    { n: 2, named: 1, cited: 1, appeared: 2 });
  assert.equal(freeCheckCounts({ status: "running" }), null);
}

/* ================================================================== *
 * 2. Evidence and storage on real SQLite
 * ================================================================== */
function makeDb({ v2 = true } = {}) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(sql("0014_aeo_scores.sql"));
  sqlite.exec("ALTER TABLE aeo_scores ADD COLUMN delivered_ruleset_version INTEGER; ALTER TABLE aeo_scores ADD COLUMN score_model_version TEXT;");
  if (v2) sqlite.exec(sql("0048_aeo_score_v2.sql"));
  for (const file of ["0018_aeo_sov.sql", "0022_sov_engine_split.sql", "0031_pro_measurement.sql", "0034_sov_evidence_usage.sql", "0045_free_ai_check.sql"]) sqlite.exec(sql(file));
  sqlite.exec(`CREATE TABLE aeo_learning_observations(run_id TEXT PRIMARY KEY,site_id TEXT,measured_at TEXT,score_scanned_at TEXT,scoring_ruleset_version INTEGER,delivered_ruleset_version INTEGER,model_version TEXT,measurement_json TEXT);`);
  const DB = {
    prepare(text) {
      const bound = (args) => {
        const stmt = sqlite.prepare(text);
        return { async first() { return stmt.get(...args) || null; }, async all() { return { results: stmt.all(...args) }; }, async run() { return { meta: stmt.run(...args) }; } };
      };
      return { bind: (...args) => bound(args), ...bound([]) };
    },
    async batch(statements) { sqlite.exec("BEGIN"); try { for (const s of statements) await s.run(); sqlite.exec("COMMIT"); } catch (e) { sqlite.exec("ROLLBACK"); throw e; } },
  };
  return { sqlite, env: { DB } };
}
const run = (sqlite, id, at, byEngine, extra = {}) => sqlite.prepare(`INSERT INTO aeo_sov_runs(id,site_id,ran_at,status,trigger,model_version,questions_asked,answers_received,appearance_rate,citation_rate,detail_json)
  VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(id, extra.site || "s1", at, extra.status || "measured", "scheduled", "u2-v2", 10, byEngine?.answers ?? 10, extra.rate ?? 0, extra.cite ?? 0,
  JSON.stringify(byEngine ? { headline: { engine: "perplexity" }, by_engine: [{ engine: "perplexity", ...byEngine }] } : {}));
{
  const { sqlite, env } = makeDb();
  run(sqlite, "r-old", iso(NOW - 120 * DAY), { answers: 10, appearances: 10, citations: 10, appeared: 10 });
  run(sqlite, "r1", iso(NOW - 20 * DAY), { answers: 10, appearances: 0, citations: 0, appeared: 0 });
  run(sqlite, "r-other", iso(NOW - 5 * DAY), { answers: 10, appearances: 10, citations: 10, appeared: 10 }, { site: "s2" });
  run(sqlite, "r-unconf", iso(NOW - 4 * DAY), null, { status: "unconfigured" });
  sqlite.prepare("INSERT INTO aeo_free_checks(site_id,month,trigger,status,started_at,finished_at,result_json) VALUES(?,?,?,?,?,?,?)")
    .run("s1", "2026-10", "scheduled", "done", iso(NOW - 3 * DAY), iso(NOW - 3 * DAY), JSON.stringify({ asked: 3, answered: 3, appeared: 1, questions: [{ answered: true, named: true }, { answered: true }, { answered: true }] }));
  const evidence = await collectVisibilityEvidence(env, "s1", { asOf: NOW });
  assert.equal(evidence.n, 13, "10 Pro answers + 3 free answers in the window; the 120-day-old run and other sites are out");
  assert.equal(evidence.appeared, 1);
  assert.equal(evidence.named, 1);
  assert.deepEqual(evidence.kinds.sort(), ["free", "pro"]);
  assert.equal((await collectVisibilityEvidence(env, "s1", { asOf: NOW - 30 * DAY })).n, 0, "as of a month ago, nothing in the window");

  // The store writes the readiness score unchanged and the v2 headline beside it.
  const stored = await storeAeoScore(env, "s1", { score: 97, band: "green", verdict: "green", gatePassed: true, checks: [], scannedAt: iso(NOW), modelVersion: "u1-v4", rulesetVersion: 5 });
  const expected = combineAeoScore({ readiness: 97, visibility: visibilityFromCounts({ n: 13, named: 1, cited: 0, appeared: 1 }) });
  const row = sqlite.prepare("SELECT * FROM aeo_scores WHERE site_id='s1'").get();
  assert.equal(row.score, 97, "score stays AI readiness");
  assert.equal(row.score_model_version, "u1-v4", "with the same model version");
  assert.equal(row.score_version, AEO_SCORE_VERSION);
  assert.equal(row.headline_score, expected.score);
  assert.equal(row.visibility_answers, 13);
  assert.equal(row.visibility_score, expected.visibility.score);
  assert.equal(stored.aeoScore.score, expected.score);
  assert.equal(stored.aeoScore.stored, true);
  const view = storedScoreView(row);
  assert.equal(view.score, expected.score, "read back as stored");
  assert.equal(view.readiness.score, 97);
  assert.equal(view.visibility.answers, 13);
  assert.equal((await currentAeoScore(env, "s1")).score, expected.score, "the current score is the stored one");

  // A failed diagnosis stores no headline.
  await storeAeoScore(env, "s1", { score: null, verdict: "fetch_failed", checks: [], scannedAt: iso(NOW + 1000) });
  const failed = sqlite.prepare("SELECT * FROM aeo_scores WHERE site_id='s1' ORDER BY scanned_at DESC").get();
  assert.equal(failed.headline_score, null);
  assert.equal(failed.score_version, AEO_SCORE_VERSION);

  // Pro report carries the same object.
  const report = await loadProReport(env, { id: "s1", url: "https://s1.example" });
  assert.equal(report.aeo_score.score_version, AEO_SCORE_VERSION);
  assert.ok("readiness" in report.aeo_score && "visibility" in report.aeo_score, "the Pro report shows both sub-scores");
}
{
  // Before 0048 the store keeps working, and the headline is worked out on read.
  const { sqlite, env } = makeDb({ v2: false });
  run(sqlite, "r1", iso(NOW - 2 * DAY), { answers: 10, appearances: 0, citations: 0, appeared: 0 });
  const stored = await storeAeoScore(env, "s1", { score: 97, band: "green", verdict: "green", checks: [], scannedAt: iso(NOW) });
  assert.equal(stored.aeoScore.stored, false);
  assert.equal(sqlite.prepare("SELECT score FROM aeo_scores").get().score, 97);
  const current = await currentAeoScore(env, "s1");
  assert.equal(current.score, 83, "the owner's example, computed from a pre-0048 row");
  assert.equal(current.computed_from_legacy_row, true);
  // A v1 row on its own is v1 - its headline was the readiness score.
  const legacy = storedScoreView({ score: 97, scanned_at: iso(NOW) });
  assert.equal(legacy.score_version, LEGACY_SCORE_VERSION);
  assert.equal(legacy.score, 97);
  assert.equal(legacy.basis, "readiness_only");
  assert.deepEqual(scoreVersionSwitches([{ scanned_at: "a" }, { scanned_at: "b" }, { scanned_at: "c", score_version: AEO_SCORE_VERSION }]),
    [{ at: "c", from: LEGACY_SCORE_VERSION, to: AEO_SCORE_VERSION }]);
}

/* ================================================================== *
 * 3. API shape: /api/sites/:id/aeo-metrics
 * ================================================================== */
const CSRF = "c".repeat(64);
const SESSION = { cookie: `nrv_session=t; nrv_csrf=${CSRF}`, "x-csrf-token": CSRF };
function fakeEnv(scoreRows) {
  const DB = {
    prepare(text) {
      const first = async () => {
        if (/FROM sessions/.test(text)) return { member_id: "m", org_id: "org1", email: "e@x.test", role: "admin", status: "active", expires_at: Date.now() + 3.6e6 };
        if (/FROM aeo_rulesets WHERE active=1/.test(text)) return { version: 7 };
        if (/FROM sites WHERE id=\?/.test(text)) return { id: "s1", org_id: "org1", install_type: "wp" };
        return null;
      };
      return {
        bind() { return { first, async all() { return { results: /FROM aeo_scores/.test(text) ? scoreRows : [] }; }, async run() { return {}; } }; },
        first, async all() { return { results: [] }; }, async run() { return {}; },
      };
    },
  };
  return { DB, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp" };
}
const VIS = visibilityFromCounts({ n: 10, named: 0, cited: 0, appeared: 0 });
const V2ROW = (at, readiness, headline, vis = VIS) => ({ site_id: "s1", scanned_at: at, score: readiness, verdict: "green", ruleset_version: 7, delivered_ruleset_version: 7, score_model_version: "u1-v4",
  checks_json: "[]", score_version: AEO_SCORE_VERSION, headline_score: headline, visibility_score: vis.measured ? vis.score : null, visibility_answers: vis.answers, visibility_json: JSON.stringify({ ...vis, window_days: 90 }) });
const V1ROW = (at, score) => ({ site_id: "s1", scanned_at: at, score, verdict: "green", ruleset_version: 7, delivered_ruleset_version: 7, score_model_version: "u1-v4", checks_json: "[]" });
const ROWS = [V1ROW("2026-10-20T00:00:00Z", 95), V1ROW("2026-10-21T00:00:00Z", 97), V2ROW("2026-10-26T00:00:00Z", 97, 83), V2ROW("2026-10-27T00:00:00Z", 97, 83)];
{
  const response = await handleApi(new Request("https://w.test/api/sites/s1/aeo-metrics", { headers: SESSION }), fakeEnv(ROWS), { waitUntil() {} });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(Object.keys(body.aeo_score).sort(), ["band", "basis", "readiness", "scanned_at", "score", "score_version", "visibility"]);
  assert.equal(body.aeo_score.score, 83);
  assert.equal(body.aeo_score.band, "green");
  assert.equal(body.aeo_score.basis, "combined");
  assert.deepEqual(body.aeo_score.readiness, { score: 97, band: "green" });
  assert.equal(body.aeo_score.visibility.answers, 10);
  assert.equal(body.aeo_score.visibility.score, 14);
  assert.deepEqual(body.scores.map((r) => r.score_version), ["aeo-v1", "aeo-v1", "aeo-v2", "aeo-v2"], "every point says its version");
  assert.ok(body.scores.every((r) => !("visibility_json" in r) && !("checks_json" in r)), "history rows stay small");
  assert.deepEqual(body.score_version_switches, [{ at: "2026-10-26T00:00:00Z", from: "aeo-v1", to: "aeo-v2" }]);
  assert.ok(!JSON.stringify(body).includes("NaN"));

  // Nothing measured: the headline is the readiness score and says so.
  const plain = await (await handleApi(new Request("https://w.test/api/sites/s1/aeo-metrics", { headers: SESSION }), fakeEnv([V2ROW("2026-10-27T00:00:00Z", 64, 64, visibilityFromCounts({}))]), { waitUntil() {} })).json();
  assert.equal(plain.aeo_score.score, 64);
  assert.equal(plain.aeo_score.basis, "readiness_only");
  assert.equal(plain.aeo_score.visibility.measured, false);
  assert.equal(plain.aeo_score.visibility.score, null);
  // No diagnosis at all.
  const empty = await (await handleApi(new Request("https://w.test/api/sites/s1/aeo-metrics", { headers: SESSION }), fakeEnv([]), { waitUntil() {} })).json();
  assert.equal(empty.aeo_score, null);
}

/* ================================================================== *
 * 4. Dashboard rendering
 * ================================================================== */
const MEASURED = publicAeoScore(storedScoreView(ROWS[3]));
const UNMEASURED = publicAeoScore(storedScoreView(V2ROW("2026-10-27T00:00:00Z", 64, 64, visibilityFromCounts({}))));
function metricsUi(lang) {
  const sandbox = { t: tFor(lang), document: { createElement: () => ({ dataset: {} }), addEventListener() {}, head: { appendChild() {} }, documentElement: {} }, MutationObserver: class { observe() {} }, setTimeout() {}, Number, Math, String, Date, JSON, Array, Object };
  vm.runInNewContext(readFileSync(new URL("../public/dashboard-aeo-metrics.js", import.meta.url), "utf8").replace("  document.head.appendChild(style);", "  globalThis.ui={scoreSummary,breakdown,sparkline};\n  document.head.appendChild(style);"), sandbox);
  return sandbox.ui;
}
const HTML = readFileSync(new URL("../public/dashboard.html", import.meta.url), "utf8");
const INLINE = [...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((b) => b.includes("function render"));
function detailRow(lang, site) {
  const t = tFor(lang);
  const body = INLINE.slice(INLINE.indexOf("function aeoBand(v)"), INLINE.indexOf("/* Existing complimentary entitlements"));
  const fn = new Function("t", "tf", "esc", "siteHref", `${body}\nreturn aeoScoreRow;`);
  const tf = (k, v) => String(t(k)).replace(/\{(\w+)\}/g, (m, n) => (v && v[n] != null ? String(v[n]) : m));
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  return fn(t, tf, esc, () => "https://example.com/")(site);
}
const CLEAN = (html, where) => {
  assert.ok(!/NaN|undefined|\bnull\b/.test(html.replace(/<[^>]*>/g, " ")), `${where}: no NaN / undefined / null in the text`);
  assert.ok(!/\{(?:n|k|d|p|q|r|v|score|date)\}/.test(html), `${where}: every placeholder filled`);
};
for (const lang of LANGS) {
  const t = tFor(lang);
  const ui = metricsUi(lang);
  const html = ui.scoreSummary(ROWS, MEASURED);
  CLEAN(html, `${lang} metrics`);
  assert.ok(html.includes("data-aeo-headline>83<"), `${lang}: the headline`);
  assert.ok(html.includes(t("scReadiness")) && html.includes("97 / 100"), `${lang}: AI readiness`);
  assert.ok(html.includes(t("scVisibility")) && html.includes("14 / 100"), `${lang}: AI visibility`);
  assert.ok(html.includes(String(t("scBasedOn")).split("{")[0].trim().slice(0, 6)), `${lang}: based on N AI answers`);
  assert.ok(html.includes(t("scVariability").slice(0, 10)), `${lang}: the variability notice`);
  assert.ok(html.includes("data-score-switch="), `${lang}: the switch is marked on the chart`);
  assert.ok(html.includes("data-score-switch-note"), `${lang}: and said in words`);
  assert.equal((html.match(/<polyline/g) || []).length, 2, `${lang}: one line per version, never joined`);
  assert.ok(!/↗|↘/.test(html), `${lang}: no change across versions`);

  const plain = ui.scoreSummary([V2ROW("2026-10-26T00:00:00Z", 64, 64, visibilityFromCounts({})), V2ROW("2026-10-27T00:00:00Z", 64, 64, visibilityFromCounts({}))], UNMEASURED);
  CLEAN(plain, `${lang} unmeasured`);
  assert.ok(plain.includes(t("scNotMeasured")) && plain.includes(t("scReadinessOnly")), `${lang}: not measured, and the headline is readiness only`);
  assert.ok(!plain.includes(t("scVariability").slice(0, 10)), `${lang}: no notice about answers there are not`);

  const row = detailRow(lang, { _aeo: { aeo_score: MEASURED, scores: ROWS } });
  CLEAN(row, `${lang} detail`);
  assert.ok(row.includes('class="sig g">83<'), `${lang}: detail headline with its band`);
  assert.ok(row.includes(t("scReadiness")) && row.includes(t("scVisibility")), `${lang}: detail sub-scores`);
  const rowPlain = detailRow(lang, { _aeo: { aeo_score: UNMEASURED, scores: [] } });
  assert.ok(rowPlain.includes('class="sig a">64<') && rowPlain.includes(t("scNotMeasured")), `${lang}: detail not measured`);
  CLEAN(rowPlain, `${lang} detail unmeasured`);
}
// Legacy payload (no aeo_score): unchanged behaviour.
assert.ok(detailRow("ja", { _aeo: { scores: [{ score: 72 }] } }).includes('class="sig a">72<'));
assert.ok(metricsUi("ja").scoreSummary([V1ROW("2026-10-20T00:00:00Z", 60)], null).includes(">60<"));
// Same version, same criteria: the change is stated.
assert.match(metricsUi("ja").scoreSummary([V2ROW("2026-10-26T00:00:00Z", 97, 80), V2ROW("2026-10-27T00:00:00Z", 97, 83)], MEASURED), /↗ \+3/);

/* ================================================================== *
 * 5. Reports show the same numbers
 * ================================================================== */
{
  const monthly = buildMonthlyReport({ site: { id: "s1" }, plan: "free", month: "2026-10", scores: ROWS, aeoScore: MEASURED, now: NOW });
  assert.equal(monthly.aeo_score.score, 83);
  const text = renderMonthlyReportText(monthly);
  assert.ok(text.includes("■ AEOスコア（総合）") && text.includes("83 / 100") && text.includes("AI対応度（サイト上の準備）: 97 / 100") && text.includes("AI登場度（実測）: 14 / 100") && text.includes("AIの回答 10件にもとづく"), "monthly text");
  const html = renderMonthlyReportHtml(monthly);
  assert.ok(html.includes("<strong>83</strong>") && html.includes("AI登場度（実測）: 14 / 100"), "monthly html");
  const plainText = renderMonthlyReportText(buildMonthlyReport({ month: "2026-10", scores: ROWS, aeoScore: UNMEASURED, now: NOW }));
  assert.ok(plainText.includes("まだ測定していません") && plainText.includes("AI対応度のみ"), "monthly: not measured");
  CLEAN(html, "monthly html");

  for (const lang of REPORT_BODY_LANGS) {
    const c = REPORT_COPY[lang];
    const model = buildAgencyReport({ site: { id: "s1", url: "s1.test" }, plan: "standard", month: "2026-10", locale: lang, scores: ROWS, aeoScore: MEASURED, now: Date.parse("2026-11-02T00:00:00Z") });
    assert.equal(model.score.latest, 83, `${lang}: the agency report's headline is the dashboard's`);
    assert.equal(model.score.readiness, 97);
    assert.equal(model.score.delta, null, `${lang}: no change across score versions`);
    assert.equal(model.score.version_changed, false, "the baseline before the month is absent here");
    const page = renderAgencyReportHtml(model);
    const fill = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => v[k] ?? m);
    const esc = (v) => String(v).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
    assert.ok(page.includes(esc(fill(c.readinessLine, { n: 97 }))), `${lang}: readiness line`);
    assert.ok(page.includes(esc(fill(c.visibilityLine, { n: 14, answers: 10, k: 0 }))), `${lang}: visibility line with its answers`);
    assert.ok(page.includes(esc(c.scoreSmallSample)), `${lang}: small-sample note`);
    assert.ok(!/\{\w+\}/.test(page) && !/NaN|undefined/.test(page), `${lang}: clean`);
    const unmeasured = renderAgencyReportText(buildAgencyReport({ site: { id: "s1" }, month: "2026-10", locale: lang, scores: [V2ROW("2026-10-27T00:00:00Z", 64, 64, visibilityFromCounts({}))], now: Date.parse("2026-11-02T00:00:00Z") }));
    assert.ok(unmeasured.includes(c.visibilityNone), `${lang}: not measured`);
  }
  // A month whose baseline is v1: no change figure, and the report says why.
  const switched = buildAgencyReport({ site: { id: "s1" }, month: "2026-10", locale: "ja", now: Date.parse("2026-11-02T00:00:00Z"),
    scores: [V1ROW("2026-09-29T00:00:00Z", 95), V2ROW("2026-10-27T00:00:00Z", 97, 83)] });
  assert.equal(switched.score.delta, null);
  assert.equal(switched.score.version_changed, true);
  assert.ok(renderAgencyReportText(switched).includes(REPORT_COPY.ja.deltaVersion));
  assert.deepEqual(switched.score.points.map((p) => p.score), [83], "the chart follows one version");
}

/* ================================================================== *
 * 6. Questions vs answers: "5問 × 2回"
 * ================================================================== */
{
  const samples = [];
  for (let q = 1; q <= 5; q += 1) for (let i = 1; i <= 2; i += 1) samples.push({ ok: true, engine: "perplexity", question: `q${q}`, sample_index: i, mentioned: q === 1, cited: false });
  const agg = aggregateSov(samples, { name: "Acme", host: "acme.test" });
  assert.equal(agg.questions_asked, 10, "questions_asked keeps counting probes (compatibility)");
  assert.equal(agg.distinct_questions, 5);
  assert.equal(agg.repetitions, 2);
  assert.equal(maxRepetitions([]), 0);
  const { sqlite, env } = makeDb();
  await storeSovRun(env, "s9", { status: "measured", ...agg, repetitions: 2, samples, query_set: { questions: ["q1", "q2", "q3", "q4", "q5"] } });
  const history = await loadSovHistory(env, "s9");
  assert.equal(history.latest.questions_asked, 10);
  assert.equal(history.latest.distinct_questions, 5);
  assert.equal(history.latest.repetitions, 2);
  // An older run without the stored count reads it from its question set.
  sqlite.prepare("INSERT INTO aeo_sov_runs(id,site_id,ran_at,status,trigger,model_version,questions_asked,answers_received,detail_json) VALUES('old','s8','2026-01-01T00:00:00Z','measured','manual','u2-v1',6,6,?)")
    .run(JSON.stringify({ repetitions: 2, query_set: { questions: ["a", "b", "c"] } }));
  assert.equal((await loadSovHistory(env, "s8")).latest.distinct_questions, 3);

  // The panel shows them apart.
  const SOURCE = readFileSync(new URL("../public/dashboard-sov.js", import.meta.url), "utf8");
  const render = (lang, latest) => {
    let built = null;
    const element = () => ({ className: "", dataset: {}, innerHTML: "", style: {}, textContent: "", appendChild() {}, querySelector: () => null, isConnected: false, replaceWith() {} });
    const sandbox = { document: { createElement(tag) { const el = element(); if (tag === "section") built = el; return el; }, querySelector: () => null, addEventListener() {}, head: { appendChild() {} }, documentElement: { lang } },
      MutationObserver: class { observe() {} }, setTimeout() {}, fetch: async () => { throw new Error("no network"); }, Number, Math, String, Date, JSON, Array, Object, console, t: tFor(lang) };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(SOURCE.replace("})();", "  window.__panel = panel; window.__line = aeoScoreLine;\n})();"), sandbox);
    sandbox.window.__panel({ kind: "measured", data: { latest, beta: true } });
    return { html: built.innerHTML, line: sandbox.window.__line };
  };
  const latest = { ran_at: "2026-10-05T00:00:00.000Z", questions_asked: 10, distinct_questions: 5, repetitions: 2, answers_received: 10, queries_used: 10, by_engine: [], competitors: [], engines: [] };
  const ja = render("ja", latest);
  assert.ok(ja.html.includes("5問 × 2回"), "ja: 5問 × 2回");
  assert.ok(render("en", latest).html.includes("5 questions × 2 runs"), "en");
  assert.ok(render("ja", { ...latest, distinct_questions: undefined, repetitions: undefined }).html.includes("<dd>10</dd>"), "an older run keeps its number");
  for (const lang of LANGS) {
    const { html, line } = render(lang, latest);
    CLEAN(html, `${lang} sov panel`);
    const pro = line(MEASURED);
    CLEAN(pro, `${lang} pro report score line`);
    assert.ok(pro.includes("83") && pro.includes("97") && pro.includes("14"), `${lang}: the Pro report shows the headline and both sub-scores`);
    assert.ok(line(UNMEASURED).includes(tFor(lang)("scNotMeasured")), `${lang}: Pro report, not measured`);
    assert.equal(line(null), "", "no diagnosis, no line");
  }
}

console.log("score v2 tests passed (formula: none / tiny / large n, 0% / 100%, monotonic; SQLite evidence + store + pre-0048 fallback; API shape; dashboard + detail + Pro panel in 8 languages without NaN/undefined and with the version switch; monthly + agency + Pro reports; 5問 × 2回)");
