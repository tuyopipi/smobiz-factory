/**
 * Self-calibration wiring: feed measured AI appearance rates (U2) back into the
 * U1 score weights.
 *
 * Deliberately a scaffold. It collects the paired samples and computes what the
 * weights *would* become, but `applied` is always false and
 * `AEO_SCORE_WEIGHTS` stays fixed. Changing live scoring on a handful of beta
 * SoV samples would move every customer's score on noise, so the proposal is
 * recorded for review and a later explicit switch-over.
 */

import { AEO_SCORE_WEIGHTS } from "./aeo-score.mjs";

export const CALIBRATION_VERSION = "u2-calib-v1";

/** Below this many paired samples a proposal is not even computed. */
export const CALIBRATION_MIN_SAMPLES = 30;

/** No single weight may move more than this fraction of its current value. */
export const CALIBRATION_MAX_DRIFT = 0.25;

/**
 * Pair each site's latest AEO check statuses with its measured appearance rate.
 *
 * Only pro sites with a measured (not unconfigured) run contribute, because
 * only they have an outcome variable to correlate against.
 */
export async function collectCalibrationSamples(env, { limit = 500 } = {}) {
  if (!env?.DB) throw new Error("DB binding is required for calibration");
  const bounded = Math.min(2000, Math.max(1, limit));
  const result = await env.DB.prepare(`
    SELECT r.site_id, r.ran_at, r.appearance_rate, r.answers_received, r.confidence,
           s.checks_json, s.score, s.scanned_at
      FROM aeo_sov_runs r
      JOIN sites si ON si.id = r.site_id AND si.plan = 'pro'
      LEFT JOIN aeo_scores s ON s.site_id = r.site_id
       AND s.scanned_at = (SELECT MAX(scanned_at) FROM aeo_scores WHERE site_id = r.site_id AND scanned_at <= r.ran_at)
     WHERE r.status = 'measured' AND r.appearance_rate IS NOT NULL
     ORDER BY r.ran_at DESC LIMIT ?
  `).bind(bounded).all();

  const samples = [];
  for (const row of result.results || []) {
    const statuses = checkStatuses(row.checks_json);
    if (!statuses) continue;
    samples.push({
      site_id: row.site_id,
      ran_at: row.ran_at,
      appearance_rate: Number(row.appearance_rate),
      answers_received: Number(row.answers_received || 0),
      confidence: row.confidence,
      score: row.score == null ? null : Number(row.score),
      statuses,
    });
  }
  return samples;
}

function checkStatuses(checksJson) {
  let checks;
  try { checks = JSON.parse(checksJson); } catch { return null; }
  if (!Array.isArray(checks)) return null;
  const statuses = {};
  for (const check of checks) {
    if (!check || typeof check.id !== "string") continue;
    if (Object.prototype.hasOwnProperty.call(AEO_SCORE_WEIGHTS, check.id)) {
      statuses[check.id] = String(check.status || "").toUpperCase();
    }
  }
  return Object.keys(statuses).length ? statuses : null;
}

/**
 * Compute a weight proposal from the paired samples.
 *
 * For each weighted dimension, compare the mean appearance rate of sites that
 * passed it against those that did not. A dimension that separates outcomes
 * more than average argues for more weight. The result is normalized back to
 * the current total and clamped by CALIBRATION_MAX_DRIFT.
 */
export function proposeWeights(samples, currentWeights = AEO_SCORE_WEIGHTS) {
  const dimensions = Object.keys(currentWeights);
  const total = dimensions.reduce((sum, id) => sum + currentWeights[id], 0);

  if (!Array.isArray(samples) || samples.length < CALIBRATION_MIN_SAMPLES) {
    return {
      version: CALIBRATION_VERSION,
      applied: false,
      reason: "insufficient_samples",
      samples: Array.isArray(samples) ? samples.length : 0,
      min_samples: CALIBRATION_MIN_SAMPLES,
      current_weights: { ...currentWeights },
      proposed_weights: { ...currentWeights },
      lift: {},
    };
  }

  const lift = {};
  for (const id of dimensions) {
    const passed = samples.filter((sample) => sample.statuses[id] === "OK").map((sample) => sample.appearance_rate);
    const failed = samples.filter((sample) => ["WARN", "BAD"].includes(sample.statuses[id])).map((sample) => sample.appearance_rate);
    lift[id] = passed.length && failed.length
      ? Math.round((mean(passed) - mean(failed)) * 1000) / 1000
      : null;
  }

  const measurable = dimensions.filter((id) => lift[id] != null);
  if (!measurable.length) {
    return {
      version: CALIBRATION_VERSION,
      applied: false,
      reason: "no_measurable_lift",
      samples: samples.length,
      current_weights: { ...currentWeights },
      proposed_weights: { ...currentWeights },
      lift,
    };
  }

  // Positive lift only: a negative separation is noise at this sample size, not
  // evidence that a dimension should count against the score.
  const signals = {};
  for (const id of dimensions) {
    signals[id] = lift[id] != null && lift[id] > 0 ? lift[id] : 0;
  }
  const signalTotal = dimensions.reduce((sum, id) => sum + signals[id], 0);

  const proposed = {};
  for (const id of dimensions) {
    const target = signalTotal > 0 ? total * (signals[id] / signalTotal) : currentWeights[id];
    const maxDelta = currentWeights[id] * CALIBRATION_MAX_DRIFT;
    const clamped = Math.max(currentWeights[id] - maxDelta, Math.min(currentWeights[id] + maxDelta, target));
    proposed[id] = Math.round(clamped * 10) / 10;
  }

  return {
    version: CALIBRATION_VERSION,
    // Fixed weights are retained. Flipping this on is a separate, explicit step.
    applied: false,
    reason: "proposal_recorded",
    samples: samples.length,
    current_weights: { ...currentWeights },
    proposed_weights: proposed,
    lift,
    max_drift: CALIBRATION_MAX_DRIFT,
  };
}

/**
 * Collect samples and produce a proposal. Returned verbatim to the weekly
 * learning job, which records it as evidence without acting on it.
 */
export async function runCalibration(env, options = {}) {
  const samples = await collectCalibrationSamples(env, options);
  const proposal = proposeWeights(samples);
  return {
    ...proposal,
    sites: new Set(samples.map((sample) => sample.site_id)).size,
    generated_at: new Date().toISOString(),
  };
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
