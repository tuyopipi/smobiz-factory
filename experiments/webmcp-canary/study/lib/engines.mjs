/**
 * Engines the study can ask, behind one pluggable function:
 *
 *   measure(engine, question, business) -> { answer, citations, model?, usage? }
 *
 * `engine` is an engine id string, `question` is { qid, kind, text }, and
 * `business` is a sample row (the first business the question belongs to;
 * discovery questions are shared by every business in the same area and
 * category, so an answer is fetched once and scored for each of them).
 * `citations` is an array of URL strings or { url, title } objects.
 *
 * Errors: throw EngineError. `hardStop: true` means "stop the whole run now"
 * (quota exhausted, billing problem, key rejected) - the runner never retries
 * those, because on a billed project a retry is exactly how a free study turns
 * into a paid one.
 *
 * The multi-engine adapters being built in worker/ai-engines.mjs can be
 * plugged in with --engines-module; see loadExternalEngines() below.
 */
import { ENGINE_ADAPTERS } from "../../worker/aeo-sov.mjs";

export class EngineError extends Error {
  constructor(code, { hardStop = false, status = null, detail = null } = {}) {
    super(code);
    this.code = code;
    this.hardStop = hardStop;
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Models whose Grounding with Google Search is free on the Gemini API free
 * tier (no billing account), per https://ai.google.dev/gemini-api/docs/pricing
 * as read on 2026-10-23: Gemini 2.5 Flash and 2.5 Flash-Lite, "Free of charge,
 * up to 500 RPD (limit shared ...)". Gemini 3 and newer list grounding as
 * "Not available" on the free tier - their "5,000 free search requests per
 * month" is a paid-tier allowance. Re-check the page before a run.
 */
export const GEMINI_FREE_GROUNDED_MODELS = Object.freeze(["gemini-2.5-flash", "gemini-2.5-flash-lite"]);
export const GEMINI_FREE_GROUNDED_RPD = 500;

export const ENGINE_INFO = Object.freeze({
  gemini: { id: "gemini", label: "Gemini + Google検索グラウンディング", paid: false, keyEnv: "GEMINI_API_KEY", defaultModel: "gemini-2.5-flash", freeModels: GEMINI_FREE_GROUNDED_MODELS, grounded: true, citations: true },
  "gemini-ungrounded": { id: "gemini-ungrounded", label: "Gemini（検索なし・モデル知識のみ）", paid: false, keyEnv: "GEMINI_API_KEY", defaultModel: "gemini-2.5-flash", freeModels: GEMINI_FREE_GROUNDED_MODELS, grounded: false, citations: false },
  perplexity: { id: "perplexity", label: "Perplexity", paid: true, keyEnv: "PERPLEXITY_API_KEY", citations: true },
  openai: { id: "openai", label: "ChatGPT (OpenAI API)", paid: true, keyEnv: "OPENAI_API_KEY", citations: false },
  stub: { id: "stub", label: "stub (dry run)", paid: false, keyEnv: null, citations: true },
});

const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

/**
 * Gemini answer -> { answer, citations }.
 *
 * Grounding chunk URIs are Google redirect links, not the source URL; the
 * chunk title carries the source's domain. A title that is a bare domain is
 * therefore turned into "https://<domain>/" so citation matching works on the
 * source host. Nothing here follows the redirect links.
 */
export function parseGeminiResponse(data) {
  const candidate = data?.candidates?.[0] || {};
  const answer = (candidate.content?.parts || []).map((p) => (typeof p?.text === "string" ? p.text : "")).join("").trim();
  const chunks = candidate.groundingMetadata?.groundingChunks || [];
  const citations = chunks.map((c) => {
    const title = String(c?.web?.title || "").trim().toLowerCase();
    if (DOMAIN_RE.test(title)) return { url: `https://${title}/`, title };
    return null;
  }).filter(Boolean);
  return {
    answer,
    citations,
    searchQueries: candidate.groundingMetadata?.webSearchQueries?.length || 0,
    finishReason: candidate.finishReason || null,
    model: data?.modelVersion || null,
    usage: data?.usageMetadata ? {
      prompt: data.usageMetadata.promptTokenCount ?? null,
      output: data.usageMetadata.candidatesTokenCount ?? null,
      thoughts: data.usageMetadata.thoughtsTokenCount ?? null,
    } : null,
  };
}

/** Map an HTTP failure from the Gemini API to an EngineError. */
export function geminiError(status, bodyText = "") {
  const text = String(bodyText || "").slice(0, 600);
  const lower = text.toLowerCase();
  if (status === 429 || lower.includes("resource_exhausted") || lower.includes("quota")) {
    return new EngineError("quota_exhausted", { hardStop: true, status, detail: "429/RESOURCE_EXHAUSTED: free-tier limit reached. Stopping; do not retry into a billed project." });
  }
  if (lower.includes("billing")) return new EngineError("billing_issue", { hardStop: true, status, detail: "The API mentions billing. Stopping." });
  if (status === 401 || status === 403) return new EngineError("key_rejected", { hardStop: true, status, detail: "Key rejected or API not enabled for this project." });
  if (status === 400 && (lower.includes("failed_precondition") || lower.includes("location is not supported") || lower.includes("free tier"))) {
    return new EngineError("free_tier_unavailable", { hardStop: true, status, detail: "Free tier not available for this request/location." });
  }
  if (status === 400 || status === 404) return new EngineError(`gemini_http_${status}`, { hardStop: true, status, detail: "Bad request or unknown model; fix the configuration before continuing." });
  return new EngineError(`gemini_http_${status}`, { hardStop: false, status });
}

export function geminiEngine({ apiKey, model, grounded = true, fetchImpl = fetch, timeoutMs = 60000 }) {
  if (!apiKey) throw new EngineError("missing_key", { hardStop: true });
  return async (question) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const body = {
        contents: [{ role: "user", parts: [{ text: question.text }] }],
        generationConfig: { maxOutputTokens: 1024, ...(model.startsWith("gemini-2.5-flash") ? { thinkingConfig: { thinkingBudget: 0 } } : {}) },
        ...(grounded ? { tools: [{ google_search: {} }] } : {}),
      };
      let response;
      try {
        response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: "POST",
          signal: controller.signal,
          // The key travels only in this header; it is never put in the URL,
          // logged, or written to the cache.
          headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify(body),
        });
      } catch (error) {
        throw new EngineError("network_error", { hardStop: false, detail: String(error?.name || "error") });
      }
      if (!response.ok) throw geminiError(response.status, await response.text().catch(() => ""));
      const parsed = parseGeminiResponse(await response.json());
      if (grounded && parsed.searchQueries === 0 && parsed.citations.length === 0) parsed.groundingUsed = false;
      return parsed;
    } finally { clearTimeout(timer); }
  };
}

/** Paid engines reuse Nurevo's own SoV adapters (worker/aeo-sov.mjs), unchanged. */
function sovAdapterEngine(id, env, fetchImpl = fetch) {
  const adapter = ENGINE_ADAPTERS[id];
  return async (question) => {
    try {
      return await adapter(env, question.text, fetchImpl);
    } catch (error) {
      const code = String(error?.code || error?.message || "engine_error");
      const hard = /_http_(401|402|403|429)$/.test(code);
      throw new EngineError(code, { hardStop: hard, detail: error?.detail || null });
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
    if (failOn && failOn(question, business, context)) throw failOn.error || new EngineError("quota_exhausted", { hardStop: true, status: 429 });
    const members = context.businesses || [business];
    const names = [];
    const citations = [];
    for (const b of members) {
      const p = question.kind === "branded" ? 0.95 : Math.min(0.9, Math.max(0.02, Number(b.__stubScore ?? 50) / 100 * 0.6));
      const h = hash(`${seed}|${b.id}|${question.text}|${context.repeat || 1}`) / 4294967296;
      if (h < p) { names.push(b.name); if (h < p / 2) citations.push(b.url); }
    }
    return { answer: names.length ? `おすすめは ${names.join("、")} です。` : "該当する情報が見つかりませんでした。", citations, model: "stub-1" };
  };
}

export function hash(text) {
  let h = 2166136261 >>> 0;
  for (const ch of String(text)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}

/**
 * Load measure() adapters from another module (e.g. worker/ai-engines.mjs
 * once it lands). Accepted shapes, in order:
 *   export async function measure(engine, question, business) {...}
 *   export const ENGINE_ADAPTERS = { id: (env, questionText, fetchImpl) => ... }
 */
export async function loadExternalEngines(modulePath, env) {
  const mod = await import(new URL(modulePath, `file://${process.cwd()}/`).href);
  if (typeof mod.measure === "function") return (engine) => (question, business) => mod.measure(engine, question, business);
  if (mod.ENGINE_ADAPTERS && typeof mod.ENGINE_ADAPTERS === "object") {
    return (engine) => {
      const adapter = mod.ENGINE_ADAPTERS[engine];
      if (typeof adapter !== "function") throw new EngineError(`unknown_engine_${engine}`, { hardStop: true });
      return (question) => adapter(env, question.text, fetch);
    };
  }
  throw new Error("engines module exports neither measure() nor ENGINE_ADAPTERS");
}

/**
 * Build the measure(engine, question, business, context) function the runner
 * calls, enforcing the free-only policy before anything is called.
 */
export function buildMeasure({ engines, env = process.env, models = {}, freeOnly = true, allowModels = [], external = null, fetchImpl = fetch, stubOptions = {} }) {
  const impls = {};
  for (const id of engines) {
    const info = ENGINE_INFO[id];
    if (external && id !== "stub") {
      if (freeOnly && (!info || info.paid)) throw new Error(`engine "${id}" is not known to be free; refusing under --free-only (pass --allow-paid to override)`);
      impls[id] = external(id);
      continue;
    }
    if (!info) throw new Error(`unknown engine "${id}"`);
    if (freeOnly && info.paid) throw new Error(`engine "${id}" is a paid API; refusing under --free-only (the default). Pass --allow-paid only after deciding to spend money.`);
    if (id === "stub") { impls[id] = stubEngine(stubOptions); continue; }
    const key = env[info.keyEnv];
    if (!key || !String(key).trim()) throw new Error(`${info.keyEnv} is not set (needed for engine "${id}")`);
    if (id === "gemini" || id === "gemini-ungrounded") {
      const model = models[id] || info.defaultModel;
      if (freeOnly && !info.freeModels.includes(model) && !allowModels.includes(model)) {
        throw new Error(`model "${model}" is not on the free-tier list for ${id} (${info.freeModels.join(", ")}); refusing under --free-only`);
      }
      impls[id] = geminiEngine({ apiKey: String(key).trim(), model, grounded: info.grounded, fetchImpl });
      continue;
    }
    impls[id] = sovAdapterEngine(id, env, fetchImpl);
  }
  return (engine, question, business, context) => impls[engine](question, business, context);
}

export function engineModel(id, models = {}) {
  const info = ENGINE_INFO[id];
  return models[id] || info?.defaultModel || id;
}
