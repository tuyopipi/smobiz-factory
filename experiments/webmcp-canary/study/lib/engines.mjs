/**
 * The engine the study asks, behind one pluggable function:
 *
 *   measure(engine, question, business, context) -> { answer, citations, model?, usage?, cost? }
 *
 * `engine` is an engine id string, `question` is { qid, kind, text }, and
 * `business` is a sample row (the first business the question belongs to;
 * discovery questions are shared by every business in the same area and
 * category, so an answer is fetched once and scored for each of them).
 *
 * The study measures with Perplexity only, through the very adapter the Pro
 * "AI visibility" product uses (worker/ai-engines.mjs probePerplexity: Agent
 * API, preset "fast"), so the study measures exactly what the product
 * measures. Appearance is decided downstream by the product's own
 * analyzeAnswer (named OR own domain cited, both kept separately).
 *
 * Gemini is not here on purpose. The Gemini API terms ("Grounding with Google
 * Search", https://ai.google.dev/gemini-api/terms) forbid caching, analysing
 * or monitoring Grounded Results, which is what this study does; ungrounded
 * Gemini would only measure model memory. See study/README.md.
 *
 * Errors: throw EngineError. `hardStop: true` means "stop the whole run now"
 * (rate limit, quota, credits/billing, key rejected, bad request) - the runner
 * never retries those, because a retry is how a small budget becomes a bigger
 * one.
 */
import { ENGINE_PRICING, PERPLEXITY_PRESET_DEFAULT, estimateCallCost, probePerplexity } from "../../worker/ai-engines.mjs";

export class EngineError extends Error {
  constructor(code, { hardStop = false, status = null, detail = null, cost = null } = {}) {
    super(code);
    this.code = code;
    this.hardStop = hardStop;
    this.status = status;
    this.detail = detail;
    this.cost = cost;
  }
}

export const STUDY_PERPLEXITY_PRESET = PERPLEXITY_PRESET_DEFAULT;

export const ENGINE_INFO = Object.freeze({
  perplexity: { id: "perplexity", label: `Perplexity (Agent API, preset ${STUDY_PERPLEXITY_PRESET})`, paid: true, keyEnv: "PERPLEXITY_API_KEY", model: `preset:${STUDY_PERPLEXITY_PRESET}`, citations: true },
  stub: { id: "stub", label: "stub (dry run)", paid: false, keyEnv: null, model: "stub-1", citations: true },
});

/**
 * Token assumptions for the per-call budget ceiling. The adapter asks for at
 * most 500 output tokens; the "fast" preset makes at most one Fast Search
 * (max steps 1) whose results become input tokens. 8,000 input tokens is a
 * deliberately high allowance for instructions + question + 10 search
 * results, so the ceiling over-estimates a typical call.
 */
export const PER_CALL_ASSUMPTION = Object.freeze({ searches: 1, inputTokens: 8000, outputTokens: 500 });

/**
 * Upper estimate of one Perplexity call in USD, from the adapter's own price
 * table (worker/ai-engines.mjs ENGINE_PRICING). The runner reserves this much
 * before every call and refuses a call that could cross --max-usd.
 */
export function perCallCeilingUsd(engine = "perplexity") {
  if (engine === "stub") return 0;
  const est = estimateCallCost(engine, PER_CALL_ASSUMPTION);
  if (!est) throw new Error(`no price for engine "${engine}"`);
  return est.est_usd;
}

export const PRICING_SOURCES = ENGINE_PRICING.sources.filter((url) => url.includes("perplexity"));

/**
 * Map an adapter failure to an EngineError. Any 4xx (bad request, key
 * rejected, out of credits, forbidden, rate limited) and any message about
 * quota, credits or billing is a hard stop. 5xx, timeouts and a failed or
 * cancelled agent run are transient: recorded, not retried in this run, and
 * asked again on the next invocation.
 */
export function classifyAdapterError(error) {
  const code = String(error?.code || error?.name || error?.message || "engine_error");
  const detail = error?.detail ? String(error.detail).slice(0, 200) : null;
  const status = Number((code.match(/_http_(\d{3})$/) || [])[1]) || null;
  const text = `${code} ${detail || ""}`;
  if (status === 401 || status === 403) return new EngineError("key_rejected", { hardStop: true, status, detail: "Perplexity rejected the key (401/403). Check PERPLEXITY_API_KEY; stopping." });
  if (status === 402 || /insufficient|credit|billing|payment/i.test(text)) return new EngineError("billing_or_credits", { hardStop: true, status, detail: "Perplexity reports a billing/credit problem. Stopping; no retries." });
  if (status === 429 || /quota|rate.?limit/i.test(text)) return new EngineError("rate_limited_or_quota", { hardStop: true, status, detail: "429 / quota from Perplexity. Stopping; re-run later (finished answers are kept)." });
  if (status && status >= 400 && status < 500) return new EngineError(code, { hardStop: true, status, detail: `HTTP ${status}: fix the request/configuration before continuing.${detail ? ` (${detail})` : ""}` });
  return new EngineError(code, { hardStop: false, status, detail });
}

/**
 * The Pro product's Perplexity adapter, unchanged. Only the key and the preset
 * are passed in, so a stray PERPLEXITY_API_URL or PERPLEXITY_PRESET in the
 * shell cannot change what is measured or what it costs.
 */
export function perplexityEngine({ apiKey, fetchImpl = fetch }) {
  if (!apiKey) throw new EngineError("missing_key", { hardStop: true });
  const env = { PERPLEXITY_API_KEY: apiKey, PERPLEXITY_PRESET: STUDY_PERPLEXITY_PRESET };
  return async (question) => {
    try {
      return await probePerplexity(env, question.text, fetchImpl);
    } catch (error) {
      throw classifyAdapterError(error);
    }
  };
}

/**
 * Deterministic fake engine for dry runs and tests. Each business "appears"
 * with a probability that rises with `business.__stubScore` (if a test sets
 * it) so a dry run produces data with a known relationship.
 */
export function stubEngine({ seed = 7, failOn = null } = {}) {
  return async (question, business, context = {}) => {
    if (failOn && failOn(question, business, context)) throw failOn.error || new EngineError("rate_limited_or_quota", { hardStop: true, status: 429 });
    const members = context.businesses || [business];
    const names = [];
    const citations = [];
    for (const b of members) {
      const p = question.kind === "branded" ? 0.95 : Math.min(0.9, Math.max(0.02, Number(b.__stubScore ?? 50) / 100 * 0.6));
      const h = hash(`${seed}|${b.id}|${question.text}|${context.repeat || 1}`) / 4294967296;
      if (h < p) { names.push(b.name); if (h < p / 2) citations.push(b.url); }
    }
    return { answer: names.length ? `おすすめは ${names.join("、")} です。` : "該当する情報が見つかりませんでした。", citations, model: "stub-1", cost: { est_usd: 0, basis: "stub" } };
  };
}

export function hash(text) {
  let h = 2166136261 >>> 0;
  for (const ch of String(text)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}

/**
 * Build the measure(engine, question, business, context) function the runner
 * calls. Only "perplexity" (real) and "stub" (dry run) exist.
 */
export function buildMeasure({ engines, env = process.env, fetchImpl = fetch, stubOptions = {} }) {
  const impls = {};
  for (const id of engines) {
    const info = ENGINE_INFO[id];
    if (!info) throw new Error(`unknown engine "${id}" (the study measures with perplexity only; Gemini is excluded by its grounding terms)`);
    if (id === "stub") { impls[id] = stubEngine(stubOptions); continue; }
    const key = String(env[info.keyEnv] || "").trim();
    if (!key) throw new Error(`${info.keyEnv} is not set (needed for engine "${id}")`);
    impls[id] = perplexityEngine({ apiKey: key, fetchImpl });
  }
  return (engine, question, business, context) => impls[engine](question, business, context);
}

export function engineModel(id) {
  return ENGINE_INFO[id]?.model || id;
}
