/**
 * AEO score v2: the on-site readiness score blended with measured AI visibility.
 *
 * Why: a validation study found no measurable correlation between the on-site
 * score (schema / coverage / legibility / llms.txt / consistency + gate) and
 * whether Perplexity actually names or cites the site - nurevo.jp scored 97/100
 * and appeared in 0% of answers. A headline built from the page alone therefore
 * overstated what it measured. v2 keeps that score unchanged as the sub-score
 * "AI readiness" (AI対応度) and adds "AI visibility" (AI登場度) from real AI
 * answers, shrunk so a handful of answers barely moves the headline.
 *
 * Formula (docs/score-v2.md has the rationale and limitations):
 *
 *   Inputs, pooled over the last VISIBILITY_WINDOW_DAYS (90) before the
 *   diagnosis: every discovery answer of the headline engine (Perplexity) from
 *   Pro measurement runs, and every answer of the free monthly check.
 *     n         answers received (failures excluded)
 *     appeared  answers that named the business OR cited its site
 *     cited     answers that cited its site
 *
 *   p      = (0.75 * appeared + 0.25 * cited) / n         per-answer value: named only
 *                                                         0.75, cited 1.0 (citation bonus)
 *   V      = 100 * WilsonCentre(p, n, z = 1.96)           AI visibility sub-score
 *          = 100 * (p + z^2/2n) / (1 + z^2/n)
 *   w      = n / (n + K),  K = 20 answers                 credibility of the measurement
 *   share  = 0.5 * w                                      visibility's weight (50/50 at full credibility)
 *   AEO    = round(R * (1 - share) + V * share)           R = AI readiness (unchanged on-site score)
 *
 *   n = 0: AEO = R, labelled "AI readiness only - visibility not measured".
 *   R unknown (diagnosis failed): AEO is unknown too; V is still reported.
 *
 * Bands use the readiness thresholds: green >= 80, yellow >= 50, else red.
 */

export const AEO_SCORE_VERSION = "aeo-v2";
/** What a stored row with no score_version is: the on-site score as the headline. */
export const LEGACY_SCORE_VERSION = "aeo-v1";
export const VISIBILITY_WINDOW_DAYS = 90;
/** Answers at which the measurement gets half its full weight. */
export const CREDIBILITY_K = 20;
/** Visibility's share of the headline at full credibility. */
export const VISIBILITY_MAX_SHARE = 0.5;
/** Value of an answer that names the business without citing its site. */
export const NAMED_VALUE = 0.75;
/** Extra value of an answer that cites the site (named-and-cited and cited-only answers are worth 1). */
export const CITATION_BONUS = 0.25;
export const WILSON_Z = 1.96;
export const GREEN_AT = 80;
export const YELLOW_AT = 50;

const round1 = (value) => Math.round(value * 10) / 10;
const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));
const count = (value) => (Number.isFinite(Number(value)) && Number(value) > 0 ? Math.floor(Number(value)) : 0);

export function aeoBand(score) {
  if (score == null || !Number.isFinite(Number(score))) return null;
  return score >= GREEN_AT ? "green" : score >= YELLOW_AT ? "yellow" : "red";
}

/** Wilson score interval for a (possibly fractional) proportion p over n answers. */
export function wilsonCentre(p, n, z = WILSON_Z) {
  if (!(n > 0)) return null;
  const z2 = z * z;
  const denominator = 1 + z2 / n;
  const centre = (p + z2 / (2 * n)) / denominator;
  const half = (z / denominator) * Math.sqrt(Math.max(0, (p * (1 - p)) / n + z2 / (4 * n * n)));
  return { centre, low: Math.max(0, centre - half), high: Math.min(1, centre + half) };
}

/**
 * The AI visibility sub-score from answer counts.
 * { n, named, cited, appeared } -> { measured, answers, ..., score (0-100), weight, share }
 */
export function visibilityFromCounts({ n = 0, named = 0, cited = 0, appeared = null } = {}) {
  const answers = count(n);
  const c = Math.min(count(cited), answers);
  const nm = Math.min(count(named), answers);
  // "appeared" is named OR cited; when a source could only give the two
  // separately, the larger is the safe lower bound.
  const ap = Math.min(answers, Math.max(appeared == null ? 0 : count(appeared), nm, c));
  if (!answers) {
    return { measured: false, answers: 0, named: 0, cited: 0, appeared: 0, observed_rate: null, cited_rate: null, value: null, score: null, interval: null, weight: 0, share: 0 };
  }
  const value = (NAMED_VALUE * ap + CITATION_BONUS * c) / answers;
  const wilson = wilsonCentre(value, answers);
  const weight = answers / (answers + CREDIBILITY_K);
  return {
    measured: true,
    answers,
    named: nm,
    cited: c,
    appeared: ap,
    // What was observed, for display beside the shrunk sub-score.
    observed_rate: Math.round((ap / answers) * 1000) / 1000,
    cited_rate: Math.round((c / answers) * 1000) / 1000,
    value: Math.round(value * 1000) / 1000,
    score: Math.round(wilson.centre * 100),
    score_exact: round1(wilson.centre * 100),
    interval: { low: Math.round(wilson.low * 100), high: Math.round(wilson.high * 100) },
    weight: Math.round(weight * 1000) / 1000,
    share: Math.round(VISIBILITY_MAX_SHARE * weight * 1000) / 1000,
  };
}

/**
 * The headline from a readiness score and a visibility (visibilityFromCounts).
 * basis: "combined" | "readiness_only" (nothing measured) | "none" (no readiness).
 */
export function combineAeoScore({ readiness = null, visibility = null } = {}) {
  const r = readiness == null || readiness === "" || !Number.isFinite(Number(readiness)) ? null : clamp(Number(readiness), 0, 100);
  const v = visibility && visibility.measured ? visibility : visibilityFromCounts({});
  let score = null;
  let basis = "none";
  if (r != null && v.measured) {
    const share = VISIBILITY_MAX_SHARE * (v.answers / (v.answers + CREDIBILITY_K));
    const exact = (100 * wilsonCentre(v.value, v.answers).centre);
    score = Math.round(clamp(r * (1 - share) + exact * share, 0, 100));
    basis = "combined";
  } else if (r != null) {
    score = Math.round(r);
    basis = "readiness_only";
  }
  return {
    score_version: AEO_SCORE_VERSION,
    score,
    band: aeoBand(score),
    basis,
    readiness: { score: r == null ? null : Math.round(r), band: aeoBand(r) },
    visibility: v,
  };
}

/* ------------------------------------------------------------------ *
 * Evidence: what the AI answers said, read from the database
 * ------------------------------------------------------------------ */

const MISSING = /no such table|no such column/i;
const parse = (value, fallback) => { try { const parsed = typeof value === "string" ? JSON.parse(value) : value; return parsed ?? fallback; } catch { return fallback; } };
const toMs = (value) => (typeof value === "number" ? value : Date.parse(String(value ?? "")));

/**
 * Counts from one stored Pro run: the headline engine's discovery answers.
 * Runs that stored a per-engine split use it; older runs (Perplexity only) are
 * read from their run-level rates, with appeared = the larger of named and
 * cited (a lower bound). Null when the run says nothing usable.
 */
export function proRunCounts(row = {}) {
  if (!row || row.status !== "measured") return null;
  const detail = parse(row.detail_json, {}) || {};
  const engine = detail?.headline?.engine || "perplexity";
  const split = Array.isArray(detail.by_engine) ? detail.by_engine.find((entry) => entry && entry.engine === engine) : null;
  if (split && count(split.answers) > 0) {
    return { n: count(split.answers), named: count(split.appearances), cited: count(split.citations), appeared: split.appeared == null ? null : count(split.appeared) };
  }
  if (split) return null;
  const n = count(detail?.headline?.answers ?? row.answers_received);
  if (!n || row.appearance_rate == null) return null;
  const named = Math.round(Number(row.appearance_rate) * n);
  const cited = row.citation_rate == null ? 0 : Math.round(Number(row.citation_rate) * n);
  return { n, named, cited, appeared: null };
}

/** Counts from one free monthly check row (aeo_free_checks). */
export function freeCheckCounts(row = {}) {
  if (!row || !["done", "failed"].includes(row.status)) return null;
  const result = parse(row.result_json, {}) || {};
  const questions = Array.isArray(result.questions) ? result.questions : [];
  const answered = questions.filter((q) => q && q.answered);
  const n = answered.length || count(result.answered);
  if (!n) return null;
  if (answered.length) {
    return { n, named: answered.filter((q) => q.named).length, cited: answered.filter((q) => q.cited).length, appeared: answered.filter((q) => q.named || q.cited).length };
  }
  return { n, named: count(result.appeared), cited: 0, appeared: count(result.appeared) };
}

/**
 * Every AI answer about the site in the window ending at `asOf`, pooled.
 * Tables that are not migrated yet contribute nothing.
 */
export async function collectVisibilityEvidence(env, siteId, { asOf = Date.now(), windowDays = VISIBILITY_WINDOW_DAYS } = {}) {
  const end = Number.isFinite(toMs(asOf)) ? toMs(asOf) : Date.now();
  const start = end - windowDays * 86400e3;
  const startIso = new Date(start).toISOString();
  const endIso = new Date(end).toISOString();
  const sources = [];
  if (env?.DB && siteId) {
    try {
      const { results } = await env.DB.prepare(`SELECT id,ran_at,status,appearance_rate,citation_rate,answers_received,detail_json
        FROM aeo_sov_runs WHERE site_id=? AND ran_at>? AND ran_at<=? AND status='measured' ORDER BY ran_at DESC LIMIT 60`).bind(siteId, startIso, endIso).all();
      for (const row of results || []) {
        const counts = proRunCounts(row);
        if (counts) sources.push({ kind: "pro", at: row.ran_at, ...counts });
      }
    } catch (error) { if (!MISSING.test(String(error?.message || error))) throw error; }
    try {
      const { results } = await env.DB.prepare(`SELECT month,status,started_at,finished_at,result_json
        FROM aeo_free_checks WHERE site_id=? AND status IN ('done','failed') ORDER BY month DESC LIMIT 4`).bind(siteId).all();
      for (const row of results || []) {
        const at = toMs(row.finished_at || row.started_at);
        if (!Number.isFinite(at) || at <= start || at > end) continue;
        const counts = freeCheckCounts(row);
        if (counts) sources.push({ kind: "free", at: row.finished_at || row.started_at, ...counts });
      }
    } catch (error) { if (!MISSING.test(String(error?.message || error))) throw error; }
  }
  const total = { n: 0, named: 0, cited: 0, appeared: 0 };
  for (const source of sources) {
    total.n += source.n;
    total.named += source.named;
    total.cited += source.cited;
    total.appeared += source.appeared == null ? Math.max(source.named, source.cited) : source.appeared;
  }
  sources.sort((a, b) => toMs(b.at) - toMs(a.at));
  return {
    window_days: windowDays,
    from: startIso,
    to: endIso,
    ...total,
    runs: sources.length,
    kinds: [...new Set(sources.map((s) => s.kind))],
    latest_at: sources[0]?.at || null,
  };
}

/** The v2 score for a readiness value, with the evidence it was built from. */
export async function scoreV2For(env, siteId, readiness, { asOf = Date.now() } = {}) {
  const evidence = await collectVisibilityEvidence(env, siteId, { asOf });
  const visibility = visibilityFromCounts(evidence);
  const combined = combineAeoScore({ readiness, visibility });
  return { ...combined, visibility: { ...combined.visibility, window_days: evidence.window_days, runs: evidence.runs, kinds: evidence.kinds, latest_at: evidence.latest_at } };
}

/**
 * The v2 view of a stored aeo_scores row. A row stored with score_version
 * aeo-v2 is read as stored; an older row is labelled aeo-v1 (its headline was
 * the readiness score) - never silently relabelled as v2.
 */
export function storedScoreView(row = {}) {
  if (!row) return null;
  const readiness = row.score == null || !Number.isFinite(Number(row.score)) ? null : Number(row.score);
  if (row.score_version === AEO_SCORE_VERSION) {
    const detail = parse(row.visibility_json, null);
    const visibility = detail && typeof detail === "object" ? detail : visibilityFromCounts({});
    const headline = row.headline_score == null || !Number.isFinite(Number(row.headline_score)) ? null : Number(row.headline_score);
    return {
      score_version: AEO_SCORE_VERSION,
      score: headline,
      band: aeoBand(headline),
      basis: headline == null ? "none" : visibility.measured ? "combined" : "readiness_only",
      readiness: { score: readiness, band: aeoBand(readiness) },
      visibility,
      scanned_at: row.scanned_at || null,
    };
  }
  return {
    score_version: LEGACY_SCORE_VERSION,
    score: readiness,
    band: aeoBand(readiness),
    basis: readiness == null ? "none" : "readiness_only",
    readiness: { score: readiness, band: aeoBand(readiness) },
    visibility: visibilityFromCounts({}),
    scanned_at: row.scanned_at || null,
  };
}

/**
 * The current v2 score of a site, from its latest stored diagnosis. A latest
 * row stored before v2 (no score_version) is combined now with the evidence as
 * of its scan time - the same inputs the store would have used - so every
 * surface shows the v2 headline from the first day. Null without a diagnosis.
 */
export async function currentAeoScore(env, siteId, latestRow = undefined) {
  let row = latestRow;
  if (row === undefined) {
    row = await readLatestScoreRow(env, siteId);
  }
  if (!row) return null;
  const stored = storedScoreView(row);
  if (stored.score_version === AEO_SCORE_VERSION) return stored;
  const live = await scoreV2For(env, siteId, stored.readiness.score, { asOf: row.scanned_at || Date.now() });
  return { ...live, scanned_at: row.scanned_at || null, computed_from_legacy_row: true };
}

export const SCORE_V2_COLUMNS = "score_version,headline_score,visibility_score,visibility_answers,visibility_json";

/** The latest aeo_scores row, with the v2 columns when the table has them. */
export async function readLatestScoreRow(env, siteId) {
  if (!env?.DB || !siteId) return null;
  try {
    return await env.DB.prepare(`SELECT scanned_at,score,verdict,${SCORE_V2_COLUMNS} FROM aeo_scores WHERE site_id=? ORDER BY scanned_at DESC LIMIT 1`).bind(siteId).first() || null;
  } catch (error) {
    if (!MISSING.test(String(error?.message || error))) throw error;
  }
  try {
    return await env.DB.prepare("SELECT scanned_at,score,verdict FROM aeo_scores WHERE site_id=? ORDER BY scanned_at DESC LIMIT 1").bind(siteId).first() || null;
  } catch (error) {
    if (MISSING.test(String(error?.message || error))) return null;
    throw error;
  }
}

/**
 * Run a SELECT that names the v2 columns, falling back to the same query
 * without them on a database not yet migrated (0048).
 * `sql` contains the token {V2} where ",<v2 columns>" goes.
 */
export async function selectWithScoreV2(env, sql, binds = [], { first = false } = {}) {
  const run = async (text) => {
    const statement = env.DB.prepare(text).bind(...binds);
    return first ? statement.first() : (await statement.all()).results || [];
  };
  try {
    return await run(sql.replace("{V2}", `,${SCORE_V2_COLUMNS}`));
  } catch (error) {
    if (!/no such column/i.test(String(error?.message || error))) throw error;
    return run(sql.replace("{V2}", ""));
  }
}

/**
 * Where the version changes in a series of stored rows (oldest first):
 * [{ at, from, to }]. Charts mark these instead of joining the lines.
 */
export function scoreVersionSwitches(rows = []) {
  const out = [];
  let previous = null;
  for (const row of rows) {
    const version = row?.score_version === AEO_SCORE_VERSION ? AEO_SCORE_VERSION : LEGACY_SCORE_VERSION;
    if (previous && version !== previous) out.push({ at: row.scanned_at || null, from: previous, to: version });
    previous = version;
  }
  return out;
}

/** A stored row as a chart point: its headline under its own version. */
export function scorePoint(row = {}) {
  const view = storedScoreView(row);
  return { at: row.scanned_at || null, score: view.score, score_version: view.score_version, readiness: view.readiness.score, visibility: view.visibility.measured ? view.visibility.score : null };
}

/** The columns storeAeoScore writes for a result (score = readiness). */
export async function scoreV2Columns(env, siteId, result, scannedAt) {
  const v2 = await scoreV2For(env, siteId, result?.score ?? null, { asOf: scannedAt });
  const visibility = v2.visibility;
  return {
    v2,
    values: [
      AEO_SCORE_VERSION,
      v2.score,
      visibility.measured ? visibility.score : null,
      visibility.answers || 0,
      JSON.stringify(visibility),
    ],
  };
}

/** The v2 score as the API returns it (dashboard, reports, plugin). */
export function publicAeoScore(view) {
  if (!view) return null;
  const v = view.visibility || {};
  return {
    score_version: view.score_version,
    score: view.score ?? null,
    band: view.band ?? null,
    basis: view.basis,
    scanned_at: view.scanned_at || null,
    readiness: { score: view.readiness?.score ?? null, band: view.readiness?.band ?? null },
    visibility: {
      measured: !!v.measured,
      score: v.measured ? v.score : null,
      answers: v.answers || 0,
      named: v.named || 0,
      cited: v.cited || 0,
      appeared: v.appeared || 0,
      observed_rate: v.measured ? v.observed_rate : null,
      interval: v.measured ? v.interval || null : null,
      weight: v.weight || 0,
      share: v.share || 0,
      window_days: v.window_days || VISIBILITY_WINDOW_DAYS,
      kinds: Array.isArray(v.kinds) ? v.kinds : [],
    },
  };
}
