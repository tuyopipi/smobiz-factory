/**
 * Statistics for the AEO validation study. Plain JS, deterministic (seeded
 * PRNG), small-n oriented. Nothing here is clever: ranks with average ties,
 * Spearman as Pearson on ranks, permutation p-values, percentile bootstrap,
 * OLS residualisation for fixed effects, and a binomial GLM fitted by IRLS
 * with a quasi-binomial dispersion correction.
 */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;

export function ranks(xs) {
  const idx = xs.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]);
  const out = new Array(xs.length);
  for (let i = 0; i < idx.length;) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j += 1;
    const r = (i + j) / 2 + 1;
    for (let k = i; k <= j; k += 1) out[idx[k][1]] = r;
    i = j + 1;
  }
  return out;
}

export function pearson(xs, ys) {
  const mx = mean(xs), my = mean(ys);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < xs.length; i += 1) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return NaN;
  return sxy / Math.sqrt(sxx * syy);
}

export const spearman = (xs, ys) => pearson(ranks(xs), ranks(ys));

function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Two-sided permutation p-value for Spearman's rho. `strata` (optional) is a
 * label per observation; y is then permuted only within each stratum, which
 * is the permutation analogue of a fixed effect for that label.
 */
export function spearmanPermutation(xs, ys, { iterations = 10000, seed = 1, strata = null } = {}) {
  const observed = spearman(xs, ys);
  if (!Number.isFinite(observed)) return { rho: NaN, p: NaN, iterations: 0 };
  const rand = mulberry32(seed);
  const rx = ranks(xs);
  const ry = ranks(ys);
  const groups = new Map();
  ys.forEach((_, i) => {
    const key = strata ? strata[i] : "_";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(i);
  });
  let extreme = 0;
  for (let it = 0; it < iterations; it += 1) {
    const perm = new Array(ys.length);
    for (const idx of groups.values()) {
      const shuffled = shuffle(idx.map((i) => ry[i]), rand);
      idx.forEach((i, k) => { perm[i] = shuffled[k]; });
    }
    if (Math.abs(pearson(rx, perm)) >= Math.abs(observed) - 1e-12) extreme += 1;
  }
  return { rho: observed, p: (extreme + 1) / (iterations + 1), iterations };
}

/** Percentile bootstrap CI for Spearman's rho (resampling businesses). */
export function spearmanBootstrapCi(xs, ys, { iterations = 5000, seed = 2, level = 0.95 } = {}) {
  const rand = mulberry32(seed);
  const n = xs.length;
  const values = [];
  for (let it = 0; it < iterations; it += 1) {
    const bx = [], by = [];
    for (let i = 0; i < n; i += 1) { const j = Math.floor(rand() * n); bx.push(xs[j]); by.push(ys[j]); }
    const r = spearman(bx, by);
    if (Number.isFinite(r)) values.push(r);
  }
  values.sort((a, b) => a - b);
  const q = (p) => values[Math.min(values.length - 1, Math.max(0, Math.floor(p * values.length)))];
  const alpha = (1 - level) / 2;
  return { low: q(alpha), high: q(1 - alpha), iterations: values.length };
}

/** Smallest |rho| detectable with the given power (Fisher z approximation). */
export function minimumDetectableRho(n, { alpha = 0.05, power = 0.8 } = {}) {
  if (n <= 3) return NaN;
  const z = normalQuantile(1 - alpha / 2) + normalQuantile(power);
  return Math.tanh(z / Math.sqrt(n - 3));
}

export function normalCdf(x) {
  // Abramowitz-Stegun 7.1.26 via erf.
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2);
  return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

export function normalQuantile(p) {
  // Acklam's rational approximation.
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425, hi = 1 - lo;
  if (p < lo) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > hi) { const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  const q = p - 0.5, r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/** Solve A x = b by Gaussian elimination with partial pivoting; null if singular. */
export function solve(A, b) {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < n; r += 1) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    if (Math.abs(M[pivot][col]) < 1e-12) return null;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    for (let r = 0; r < n; r += 1) {
      if (r === col) continue;
      const f = M[r][col] / M[col][col];
      for (let k = col; k <= n; k += 1) M[r][k] -= f * M[col][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

export function invert(A) {
  const n = A.length;
  const cols = [];
  for (let j = 0; j < n; j += 1) {
    const e = Array.from({ length: n }, (_, i) => (i === j ? 1 : 0));
    const x = solve(A, e);
    if (!x) return null;
    cols.push(x);
  }
  return A.map((_, i) => cols.map((col) => col[i]));
}

/**
 * Dummy-code categorical columns (first level is the reference) and return
 * design rows with an intercept. Levels with a single observation still get
 * a column; the solver reports singularity instead of silently dropping it.
 */
export function designMatrix(rows, { numeric = [], factors = [] } = {}) {
  const levels = Object.fromEntries(factors.map((f) => [f, [...new Set(rows.map((r) => r[f]))].sort()]));
  const names = ["(intercept)", ...numeric];
  for (const f of factors) for (const level of levels[f].slice(1)) names.push(`${f}=${level}`);
  const X = rows.map((r) => {
    const out = [1, ...numeric.map((k) => Number(r[k]))];
    for (const f of factors) for (const level of levels[f].slice(1)) out.push(r[f] === level ? 1 : 0);
    return out;
  });
  return { X, names };
}

/** OLS residuals of y on X (used to partial out category/city fixed effects). */
export function olsResiduals(X, y) {
  const p = X[0].length;
  const XtX = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (_, j) => X.reduce((s, row) => s + row[i] * row[j], 0)));
  const Xty = Array.from({ length: p }, (_, i) => X.reduce((s, row, k) => s + row[i] * y[k], 0));
  const beta = solve(XtX, Xty);
  if (!beta) return null;
  return y.map((v, k) => v - X[k].reduce((s, x, i) => s + x * beta[i], 0));
}

/**
 * Binomial GLM (logit link) on aggregated data: successes[k] of trials[k].
 * Returns coefficients, Wald SEs scaled by the quasi-binomial dispersion
 * (Pearson chi^2 / df, floored at 1) so repeated answers to the same question
 * are not treated as independent evidence.
 */
export function binomialGlm(X, successes, trials, { maxIter = 50, tol = 1e-8, ridge = 1e-6 } = {}) {
  const n = X.length, p = X[0].length;
  let beta = new Array(p).fill(0);
  const total = successes.reduce((a, b) => a + b, 0) / Math.max(1, trials.reduce((a, b) => a + b, 0));
  beta[0] = Math.log(Math.max(1e-4, total) / Math.max(1e-4, 1 - total));
  let converged = false, info = null;
  for (let iter = 0; iter < maxIter; iter += 1) {
    const XtWX = Array.from({ length: p }, () => new Array(p).fill(0));
    const score = new Array(p).fill(0);
    for (let k = 0; k < n; k += 1) {
      if (!trials[k]) continue;
      const eta = X[k].reduce((s, x, i) => s + x * beta[i], 0);
      const mu = 1 / (1 + Math.exp(-eta));
      const w = trials[k] * mu * (1 - mu);
      for (let i = 0; i < p; i += 1) {
        score[i] += X[k][i] * (successes[k] - trials[k] * mu);
        for (let j = 0; j < p; j += 1) XtWX[i][j] += X[k][i] * X[k][j] * w;
      }
    }
    for (let i = 0; i < p; i += 1) XtWX[i][i] += ridge;
    const step = solve(XtWX, score);
    if (!step) return { ok: false, reason: "singular" };
    beta = beta.map((b, i) => b + step[i]);
    info = XtWX;
    if (Math.max(...step.map(Math.abs)) < tol) { converged = true; break; }
  }
  const cov = invert(info);
  if (!cov) return { ok: false, reason: "singular" };
  let pearsonChi2 = 0, used = 0;
  for (let k = 0; k < n; k += 1) {
    if (!trials[k]) continue;
    used += 1;
    const mu = 1 / (1 + Math.exp(-X[k].reduce((s, x, i) => s + x * beta[i], 0)));
    const v = trials[k] * mu * (1 - mu);
    if (v > 1e-12) pearsonChi2 += (successes[k] - trials[k] * mu) ** 2 / v;
  }
  const df = Math.max(1, used - p);
  const dispersion = Math.max(1, pearsonChi2 / df);
  const se = cov.map((row, i) => Math.sqrt(Math.max(0, row[i]) * dispersion));
  const separated = beta.some((b) => Math.abs(b) > 15);
  return { ok: true, converged, beta, se, dispersion, df, separated };
}

export function waldSummary(beta, se, { level = 0.95 } = {}) {
  const z = normalQuantile(1 - (1 - level) / 2);
  const stat = beta / se;
  return {
    estimate: beta, se, oddsRatio: Math.exp(beta),
    ciLow: Math.exp(beta - z * se), ciHigh: Math.exp(beta + z * se),
    p: 2 * (1 - normalCdf(Math.abs(stat))),
  };
}

/** Mann-Whitney U with normal approximation (two-sided). */
export function mannWhitney(a, b) {
  if (!a.length || !b.length) return { u: NaN, p: NaN };
  const all = [...a, ...b];
  const r = ranks(all);
  const ra = r.slice(0, a.length).reduce((s, x) => s + x, 0);
  const u = ra - (a.length * (a.length + 1)) / 2;
  const mu = (a.length * b.length) / 2;
  const sd = Math.sqrt((a.length * b.length * (a.length + b.length + 1)) / 12);
  const z = sd ? (u - mu) / sd : 0;
  return { u, z, p: 2 * (1 - normalCdf(Math.abs(z))) };
}
