/**
 * AI engines the Pro "AI visibility" measurement asks, one adapter each.
 *
 *   perplexity  Perplexity Agent API, preset "fast" (web search). Unchanged
 *               from the original single-engine measurement.
 *   openai      ChatGPT: OpenAI Responses API with the built-in web_search
 *               tool, user location set to Japan (and the city when known).
 *
 * Gemini is deliberately absent. The Gemini API terms for Grounding with
 * Google Search forbid caching, analysing or monitoring Grounded Results and
 * require them to be shown, unmodified, to the end user who wrote the prompt
 * (https://ai.google.dev/gemini-api/terms). An automated appearance-rate
 * measurement is exactly that analysis, so grounded Gemini cannot be used
 * here; ungrounded Gemini would only measure model knowledge, not what a
 * Gemini user sees, and is left out rather than presented as comparable.
 *
 * Terms checked for the two engines used (2026-10-23): OpenAI's Services
 * Agreement assigns Output to the customer and does not restrict storing or
 * analysing it; the web search guide asks that citations shown to end users be
 * visible and clickable, which the dashboard does. Perplexity's API terms do
 * not restrict storing or analysing Responses.
 *
 * Every adapter returns the same shape:
 *   { answer, citations: [{url,title}] | [url], mentions: [names], model,
 *     usage, cost: { est_usd, searches, basis } }
 * so the appearance test downstream (aeo-sov.mjs analyzeAnswer) is identical
 * for every engine. `mentions` is the raw list of business-like names found in
 * the answer, kept as evidence for review only; it is never scored.
 *
 * An engine is usable only when its key is set. A missing key is "not
 * configured", never an error, and nothing is ever sent without a key.
 * ChatGPT reads its own key, SOV_OPENAI_API_KEY. The OPENAI_API_KEY that the
 * AEO learning job uses is only borrowed when SOV_OPENAI_USE_SHARED_KEY=1, so
 * this measurement cannot spend that job's quota unless the owner says so.
 *
 * Costs are estimates from the provider's published list prices (see
 * ENGINE_PRICING.sources) and from what the provider says each call consumed.
 * They are for budgeting and logs, not billing.
 */

export class SovError extends Error {
  constructor(status, code, detail = null) { super(code); this.name = "SovError"; this.status = status; this.code = code; this.detail = detail; }
}

/* ------------------------------------------------------------------ *
 * Registry
 * ------------------------------------------------------------------ */

/**
 * Engine registry, in probe order. `key` names the engine's own secret
 * binding. `shared_key` is a key owned by another job that may be borrowed
 * only when `shared_key_flag` is "1" (engineApiKey). Both search the live web
 * and return a source list.
 */
export const ENGINE_DEFINITIONS = Object.freeze([
  Object.freeze({ id: "perplexity", label: "Perplexity", citations: true, key: "PERPLEXITY_API_KEY", live_search: true }),
  Object.freeze({ id: "openai", label: "ChatGPT", citations: true, key: "SOV_OPENAI_API_KEY", live_search: true,
    shared_key: "OPENAI_API_KEY", shared_key_flag: "SOV_OPENAI_USE_SHARED_KEY" }),
]);
export const ENGINE_IDS = Object.freeze(ENGINE_DEFINITIONS.map((engine) => engine.id));

export function engineDefinition(id) {
  return ENGINE_DEFINITIONS.find((engine) => engine.id === id) || null;
}

/**
 * The API key an engine is called with, or "" when it has none. The engine's
 * own key wins; a shared key is used only when its opt-in flag is exactly "1".
 */
export function engineApiKey(env = {}, id) {
  const engine = engineDefinition(id);
  if (!engine) return "";
  const own = String(env?.[engine.key] || "").trim();
  if (own) return own;
  if (engine.shared_key && String(env?.[engine.shared_key_flag] || "").trim() === "1") {
    return String(env?.[engine.shared_key] || "").trim();
  }
  return "";
}

export function engineConfigured(env = {}, id) {
  return engineApiKey(env, id) !== "";
}

/* ------------------------------------------------------------------ *
 * Prices (USD), as published on 2026-10-23
 * ------------------------------------------------------------------ */

/**
 * List prices used for the cost estimate. Changing a model through env keeps
 * the search-call price (it is per tool call, not per model); token prices are
 * only known for the models listed here, and an unlisted model's estimate says
 * so (`token_price_known: false`) instead of guessing.
 */
export const ENGINE_PRICING = Object.freeze({
  as_of: "2026-10-23",
  perplexity: Object.freeze({
    // Fast Search web_search: $1.00 / 1,000 invocations. The "fast" preset runs
    // openai/gpt-6-luna on the priority tier; Perplexity does not publish that
    // rate on the pricing page, so tokens are estimated at twice OpenAI's
    // standard gpt-6-luna rate to stay on the safe side.
    search_per_call: 0.001,
    tokens: Object.freeze({ "*": Object.freeze({ input: 0.20, output: 1.00 }) }),
  }),
  openai: Object.freeze({
    // Web search tool: $10.00 / 1,000 calls, search content tokens billed at
    // the model's rates.
    search_per_call: 0.010,
    tokens: Object.freeze({ "gpt-6-luna": Object.freeze({ input: 0.10, output: 0.50 }) }),
  }),
  sources: Object.freeze([
    "https://docs.perplexity.ai/getting-started/pricing",
    "https://docs.perplexity.ai/docs/agent-api/presets",
    "https://developers.openai.com/api/docs/pricing",
    "https://developers.openai.com/api/docs/models/gpt-6-luna",
    "https://developers.openai.com/api/docs/guides/tools-web-search",
  ]),
});

export const OPENAI_SOV_MODEL_DEFAULT = "gpt-6-luna";
export const openAiSovModel = (env = {}) => String(env.SOV_OPENAI_MODEL || OPENAI_SOV_MODEL_DEFAULT).trim();

/**
 * Upper bound on built-in tool calls per ChatGPT answer, sent as the Responses
 * API's `max_tool_calls`: "The maximum number of total calls to built-in tools
 * that can be processed in a response. This maximum number applies across all
 * built-in tool calls, not per individual tool. Any further attempts to call a
 * tool by the model will be ignored."
 * (https://developers.openai.com/api/reference/terraform/resources/responses,
 * checked 2026-10-23). It counts every web_search_call, including the
 * open_page / find_in_page actions, so it also bounds the billed searches.
 * SOV_OPENAI_MAX_TOOL_CALLS overrides it (1-10).
 */
export const OPENAI_MAX_TOOL_CALLS_DEFAULT = 2;
export const OPENAI_MAX_TOOL_CALLS_LIMIT = 10;
export function openAiMaxToolCalls(env = {}) {
  const raw = env?.SOV_OPENAI_MAX_TOOL_CALLS;
  if (raw === undefined || raw === null || String(raw).trim() === "") return OPENAI_MAX_TOOL_CALLS_DEFAULT;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 1 ? Math.min(OPENAI_MAX_TOOL_CALLS_LIMIT, value) : OPENAI_MAX_TOOL_CALLS_DEFAULT;
}

/**
 * Tokens assumed for one call when the provider did not say (a timed-out call)
 * and when reserving budget before a run. Generous on purpose: at these list
 * prices the tokens are a small part of a call, the search fee dominates.
 */
export const ASSUMED_CALL_TOKENS = Object.freeze({
  perplexity: Object.freeze({ input: 10000, output: 500 }),
  openai: Object.freeze({ input: 20000, output: 1500 }),
});

/**
 * The most one call is assumed to cost: ChatGPT at max_tool_calls billed
 * searches, Perplexity at one Fast Search, both with ASSUMED_CALL_TOKENS. Used
 * to reserve USD before a run and as the cost of a call that timed out (the
 * provider may have done the work, and the search count is unknown).
 */
export function assumedMaxCallCost(engineId, env = {}) {
  const tokens = ASSUMED_CALL_TOKENS[engineId];
  if (!tokens) return null;
  const estimate = estimateCallCost(engineId, {
    model: engineId === "openai" ? openAiSovModel(env) : "",
    searches: engineId === "openai" ? openAiMaxToolCalls(env) : 1,
    inputTokens: tokens.input,
    outputTokens: tokens.output,
  });
  return { ...estimate, basis: "assumed_max" };
}

/**
 * Estimated USD for one call: searches x per-search price + tokens x token
 * price. Rounded to 1/1,000,000 USD. `token_price_known` is false when the
 * model is not in the price table; the figure then covers searches only.
 */
export function estimateCallCost(engineId, { model = "", searches = 0, inputTokens = 0, outputTokens = 0 } = {}) {
  const pricing = ENGINE_PRICING[engineId];
  if (!pricing) return null;
  const tokenPrice = pricing.tokens[model] || pricing.tokens["*"] || null;
  const searchUsd = Math.max(0, Number(searches) || 0) * pricing.search_per_call;
  const tokenUsd = tokenPrice
    ? (Math.max(0, Number(inputTokens) || 0) * tokenPrice.input + Math.max(0, Number(outputTokens) || 0) * tokenPrice.output) / 1e6
    : 0;
  return {
    est_usd: Math.round((searchUsd + tokenUsd) * 1e6) / 1e6,
    searches: Math.max(0, Number(searches) || 0),
    token_price_known: !!tokenPrice,
    basis: `list_price_${ENGINE_PRICING.as_of}`,
  };
}

/* ------------------------------------------------------------------ *
 * Shared request plumbing
 * ------------------------------------------------------------------ */

export const ENGINE_REQUEST_TIMEOUT_MS = 20000;

export const SYSTEM_PROMPT = "You are answering as a consumer-facing AI search assistant. Answer the user's question about local businesses concisely and factually. Name specific businesses when you can, and include source URLs when you have them.";

/**
 * Resolve an engine endpoint.
 *
 * The request carries the provider API key, so an environment-supplied
 * override is only honoured when it points at this machine. That keeps a
 * misconfigured or tampered variable from redirecting a live secret to a
 * third-party host; anything else silently uses the provider.
 */
export function engineEndpoint(override, providerUrl) {
  const raw = String(override || "").trim();
  if (!raw) return providerUrl;
  let url;
  try { url = new URL(raw); } catch { return providerUrl; }
  const host = url.hostname.toLowerCase();
  const loopback = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]"
    || host.endsWith(".localhost") || host.endsWith(".test");
  return loopback ? url.href : providerUrl;
}

export function withTimeout(run, timeoutMs = ENGINE_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return Promise.resolve(run(controller.signal)).finally(() => clearTimeout(timer));
}

/**
 * A provider's own error words, safe to store and log: tags stripped,
 * anything shaped like an API key redacted (Perplexity pplx-, OpenAI sk-,
 * Google AIza...), at most 200 characters. Never the request or its headers.
 */
export function sanitizeProviderText(text) {
  const clean = String(text || "")
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\b(?:pplx|sk|sk-proj|key)[-_][A-Za-z0-9_-]{8,}\b/g, "[redacted]")
    .replace(/\bAIza[0-9A-Za-z_-]{20,}\b/g, "[redacted]")
    .replace(/\bBearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\s+/g, " ")
    .trim();
  return clean ? clean.slice(0, 200) : null;
}

export async function providerErrorDetail(response) {
  let text = "";
  try { text = await response.text(); } catch { return null; }
  return sanitizeProviderText(text);
}

/**
 * Turn a failed provider response into a SovError. A spent provider quota
 * (OpenAI "insufficient_quota") gets its own code
 * so the run stops asking that engine instead of failing every question.
 */
async function providerFailure(engineId, response) {
  let raw = "";
  try { raw = await response.text(); } catch { raw = ""; }
  const detail = sanitizeProviderText(raw);
  console.error("sov-engine-error", JSON.stringify({ engine: engineId, status: response.status, detail }));
  const quota = response.status === 429 && /insufficient_quota|RESOURCE_EXHAUSTED|quota/i.test(raw);
  return new SovError(502, quota ? `${engineId}_quota_exhausted` : `${engineId}_http_${response.status}`, detail);
}

export function isProviderQuotaError(code) {
  return /_quota_exhausted$/.test(String(code || ""));
}

/**
 * What the provider says a call consumed: numbers and short labels only, plus
 * the provider's own cost breakdown when it reports one.
 */
export function engineUsage(raw) {
  if (!raw || typeof raw !== "object") return null;
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    else if (typeof value === "string" && value.length <= 40) out[key] = value;
    else if (key === "cost" && value && typeof value === "object") {
      out.cost = Object.fromEntries(Object.entries(value).filter(([, v]) => typeof v === "number" && Number.isFinite(v)));
    }
  }
  return Object.keys(out).length ? out : null;
}

/* ------------------------------------------------------------------ *
 * Raw business mentions (evidence only, never scored)
 * ------------------------------------------------------------------ */

/**
 * Business-like names an answer lists: **bold** names, 「quoted」 names and the
 * head of numbered or bulleted lines. A rough extraction for the reviewer, so
 * it can show "the answer recommended X, Y and Z". The appearance rate never
 * reads it; that is decided by the business-name matcher alone.
 */
export function extractBusinessMentions(answer, limit = 15) {
  const text = String(answer || "");
  const found = [];
  const push = (value) => {
    const name = String(value || "")
      .replace(/\[(\d+)\]/g, "")
      .replace(/[*_`#]+/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^[\s:：\-–—・]+|[\s:：\-–—・。、,.]+$/g, "");
    if (name.length >= 2 && name.length <= 60 && !found.includes(name)) found.push(name);
  };
  for (const match of text.matchAll(/\*\*([^*\n]{2,80})\*\*|__([^_\n]{2,80})__/g)) push(match[1] || match[2]);
  for (const match of text.matchAll(/「([^」\n]{2,60})」/g)) push(match[1]);
  for (const match of text.matchAll(/^\s*(?:\d{1,2}[.)．]|[-*・●■◆])\s+(?:\*\*)?([^\n:：（(—–|]{2,60})/gm)) push(match[1]);
  return found.slice(0, limit);
}

/* ------------------------------------------------------------------ *
 * Perplexity (unchanged behaviour)
 * ------------------------------------------------------------------ */

// Perplexity retired Sonar chat completions in favour of its Agent API: the
// old endpoint now answers 403 "Sonar is now the Agent API". The "fast"
// preset is the documented replacement for model "sonar" and searches the
// web by default, which is what a citation measurement needs.
export const PERPLEXITY_PRESET_DEFAULT = "fast";
export const perplexityPreset = (env = {}) => String(env.PERPLEXITY_PRESET || PERPLEXITY_PRESET_DEFAULT);

/** Answer text, cited URLs, model and usage from an Agent API response. */
export function parsePerplexityAgent(data) {
  const output = Array.isArray(data?.output) ? data.output : [];
  const answer = output
    .filter((item) => item?.type === "message")
    .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("\n")
    .trim();
  const citations = output
    .filter((item) => item?.type === "search_results")
    .flatMap((item) => (Array.isArray(item.results) ? item.results : []))
    .map((result) => result?.url)
    .filter((url) => typeof url === "string" && url);
  return { answer, citations: [...new Set(citations)], model: typeof data?.model === "string" ? data.model : null, status: data?.status || null };
}

export async function probePerplexity(env, question, fetchImpl) {
  const endpoint = engineEndpoint(env.PERPLEXITY_API_URL, "https://api.perplexity.ai/v1/agent");
  // The timeout covers reading the body too, so one call is bounded end to end.
  const data = await withTimeout(async (signal) => {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      signal,
      headers: { authorization: `Bearer ${engineApiKey(env, "perplexity")}`, "content-type": "application/json" },
      body: JSON.stringify({
        preset: perplexityPreset(env),
        instructions: SYSTEM_PROMPT,
        input: question,
        max_output_tokens: 500,
      }),
    });
    if (!response.ok) {
      const detail = await providerErrorDetail(response);
      console.error("sov-engine-error", JSON.stringify({ engine: "perplexity", status: response.status, detail }));
      throw new SovError(502, `perplexity_http_${response.status}`, detail);
    }
    return response.json();
  });
  if (data?.status === "failed" || data?.status === "cancelled") throw new SovError(502, `perplexity_${data.status}`, String(data?.error?.message || "").slice(0, 200) || null);
  const agent = parsePerplexityAgent(data);
  // A chat-completions shaped body is still read, so a local double written
  // for the old API keeps working; production only ever sees the Agent shape.
  const legacyAnswer = String(data?.choices?.[0]?.message?.content || "");
  const answer = agent.answer || legacyAnswer;
  const usage = engineUsage(data?.usage);
  // The provider's own total wins when it reports one; otherwise one Fast
  // Search plus the reported tokens at the list price.
  const reported = Number(usage?.cost?.total_cost);
  const estimate = estimateCallCost("perplexity", {
    searches: 1, inputTokens: usage?.input_tokens ?? usage?.prompt_tokens, outputTokens: usage?.output_tokens ?? usage?.completion_tokens,
  });
  return {
    model: agent.model || String(data?.model || `preset:${perplexityPreset(env)}`),
    answer,
    citations: agent.citations.length ? agent.citations
      : Array.isArray(data?.citations) ? data.citations : Array.isArray(data?.search_results) ? data.search_results : [],
    mentions: extractBusinessMentions(answer),
    usage,
    cost: Number.isFinite(reported) && reported >= 0 ? { ...estimate, est_usd: reported, basis: "provider_reported" } : estimate,
  };
}

/* ------------------------------------------------------------------ *
 * OpenAI: Responses API + web_search
 * ------------------------------------------------------------------ */

/**
 * The approximate user location sent with the web_search tool. A Japanese
 * profile is located in Japan (Asia/Tokyo); its locality becomes the city, or
 * the region when it is a prefecture. Other languages send no location rather
 * than a guessed one.
 */
export function openAiUserLocation(profile = {}) {
  if (profile.language && profile.language !== "ja") return null;
  const location = { type: "approximate", country: "JP", timezone: "Asia/Tokyo" };
  const area = String(profile.locality || "").trim();
  if (area) {
    if (/[都道府県]$/.test(area)) location.region = area;
    else location.city = area;
  }
  return location;
}

/** Answer text, url_citation annotations, search count and model from a Responses API body. */
export function parseOpenAiResponse(data) {
  const output = Array.isArray(data?.output) ? data.output : [];
  const parts = output
    .filter((item) => item?.type === "message")
    .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    .filter((part) => part?.type === "output_text" || typeof part?.text === "string");
  const answer = parts.map((part) => String(part.text || "")).join("\n").trim()
    || (typeof data?.output_text === "string" ? data.output_text.trim() : "");
  const seen = new Set();
  const citations = [];
  for (const part of parts) {
    for (const note of Array.isArray(part.annotations) ? part.annotations : []) {
      if (note?.type !== "url_citation" || typeof note.url !== "string" || seen.has(note.url)) continue;
      seen.add(note.url);
      citations.push({ url: note.url, title: typeof note.title === "string" ? note.title.slice(0, 200) : null });
    }
  }
  // Billing: the web search guide says "Search actions incur a tool call cost"
  // (https://developers.openai.com/api/docs/guides/tools-web-search, section
  // "Output and citations"); the open_page and find_in_page actions are named
  // there without a cost, and the pricing page prices web search per call
  // (https://developers.openai.com/api/docs/pricing). So only "search" actions
  // are counted as billed; an item without an action type is counted too, to
  // stay on the safe side. `tool_calls` keeps every web_search_call.
  const toolCalls = output.filter((item) => item?.type === "web_search_call");
  const searches = toolCalls.filter((item) => {
    const type = item?.action?.type;
    return type === undefined || type === null || type === "search";
  }).length;
  return { answer, citations, searches, tool_calls: toolCalls.length, model: typeof data?.model === "string" ? data.model : null, status: data?.status || null };
}

export async function probeOpenAiWebSearch(env, question, fetchImpl, { profile = {} } = {}) {
  const endpoint = engineEndpoint(env.OPENAI_RESPONSES_SOV_API_URL, "https://api.openai.com/v1/responses");
  const model = openAiSovModel(env);
  const tool = { type: "web_search", search_context_size: "low" };
  const location = openAiUserLocation(profile);
  if (location) tool.user_location = location;
  const data = await withTimeout(async (signal) => {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      signal,
      headers: { authorization: `Bearer ${engineApiKey(env, "openai")}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        instructions: SYSTEM_PROMPT,
        input: question,
        tools: [tool],
        // A ChatGPT-with-search measurement: the engine must actually search.
        tool_choice: "required",
        // ...but no more than this many tool calls (and so billed searches)
        // per answer. See openAiMaxToolCalls.
        max_tool_calls: openAiMaxToolCalls(env),
        reasoning: { effort: String(env.SOV_OPENAI_REASONING_EFFORT || "low") },
        max_output_tokens: 1500,
        store: false,
      }),
    });
    if (!response.ok) throw await providerFailure("openai", response);
    return response.json();
  });
  if (data?.status === "failed" || data?.status === "cancelled") {
    throw new SovError(502, `openai_${data.status}`, sanitizeProviderText(data?.error?.message || ""));
  }
  const parsed = parseOpenAiResponse(data);
  const usage = engineUsage(data?.usage);
  return {
    model: parsed.model || model,
    answer: parsed.answer,
    citations: parsed.citations,
    mentions: extractBusinessMentions(parsed.answer),
    usage,
    cost: estimateCallCost("openai", {
      model, searches: parsed.searches, inputTokens: usage?.input_tokens, outputTokens: usage?.output_tokens,
    }),
  };
}

export const ENGINE_ADAPTERS = Object.freeze({
  perplexity: probePerplexity,
  openai: probeOpenAiWebSearch,
});

/* ------------------------------------------------------------------ *
 * Statistics
 * ------------------------------------------------------------------ */

/** Below this many answers a rate is shown as reference only ("参考値"). */
export const SMALL_SAMPLE_N = 20;

/**
 * Wilson score interval for k successes out of n (95% by default). Unlike the
 * normal approximation it stays inside [0, 1] and is honest at 0/n and n/n,
 * which small local-business samples hit often. Null when n is 0.
 */
export function wilsonInterval(k, n, z = 1.959963984540054) {
  const total = Number(n);
  const hits = Number(k);
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(hits) || hits < 0 || hits > total) return null;
  const p = hits / total;
  const z2 = z * z;
  const denominator = 1 + z2 / total;
  const center = (p + z2 / (2 * total)) / denominator;
  const half = (z * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total))) / denominator;
  const round = (value) => Math.round(value * 1000) / 1000;
  return { low: round(Math.max(0, center - half)), high: round(Math.min(1, center + half)), level: 0.95 };
}

/* ------------------------------------------------------------------ *
 * Monthly caps per engine: calls and estimated USD, per site and for the
 * whole deployment
 * ------------------------------------------------------------------ */

/**
 * Call caps. A run is the query set's questions x repetitions per engine
 * (5 x 2 = 10 by default) every 3 days, about 100 calls a month per engine.
 * Perplexity keeps its original 200 per site (SOV_LIMITS.monthlyQueriesPerSite,
 * counted in aeo_sov_usage as before). ChatGPT is OFF by default: its per-site
 * cap is 0 until the owner sets SOV_OPENAI_SITE_MONTHLY_CAP (120 is the
 * suggested value, OPENAI_SITE_CAP_SUGGESTED). The global caps bound the whole
 * deployment.
 */
export const ENGINE_CAP_DEFAULTS = Object.freeze({
  perplexity: Object.freeze({ site: 200, global: 6000 }),
  openai: Object.freeze({ site: 0, global: 3000 }),
});
export const OPENAI_SITE_CAP_SUGGESTED = 120;

/**
 * Monthly USD caps, checked against the estimated cost already stored in
 * aeo_sov_engine_usage (reservations included) before any call is reserved.
 * SOV_<ENGINE>_SITE_MONTHLY_USD_CAP / SOV_<ENGINE>_GLOBAL_MONTHLY_USD_CAP
 * override them; 0 switches the engine off. Perplexity's are guard rails far
 * above what its call caps can spend at list price (~$0.0035 a call).
 */
export const ENGINE_USD_CAP_DEFAULTS = Object.freeze({
  perplexity: Object.freeze({ site: 5, global: 150 }),
  openai: Object.freeze({ site: 3, global: 40 }),
});
export const GLOBAL_SCOPE = "*";

function capFromEnv(raw, fallback) {
  if (raw === undefined || raw === null || String(raw).trim() === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}

function usdCapFromEnv(raw, fallback) {
  if (raw === undefined || raw === null || String(raw).trim() === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 1e6) / 1e6 : fallback;
}

/**
 * The call caps in force: SOV_<ENGINE>_SITE_MONTHLY_CAP and
 * SOV_<ENGINE>_GLOBAL_MONTHLY_CAP override the defaults; 0 switches the engine
 * off without removing its key. Perplexity's per-site cap is not overridable
 * here - it stays the original constant.
 */
export function engineCaps(env = {}, id) {
  const defaults = ENGINE_CAP_DEFAULTS[id];
  if (!defaults) return null;
  const upper = id.toUpperCase();
  return {
    site: id === "perplexity" ? defaults.site : capFromEnv(env[`SOV_${upper}_SITE_MONTHLY_CAP`], defaults.site),
    global: capFromEnv(env[`SOV_${upper}_GLOBAL_MONTHLY_CAP`], defaults.global),
  };
}

/** The USD caps in force (see ENGINE_USD_CAP_DEFAULTS). */
export function engineUsdCaps(env = {}, id) {
  const defaults = ENGINE_USD_CAP_DEFAULTS[id];
  if (!defaults) return null;
  const upper = id.toUpperCase();
  return {
    site: usdCapFromEnv(env[`SOV_${upper}_SITE_MONTHLY_USD_CAP`], defaults.site),
    global: usdCapFromEnv(env[`SOV_${upper}_GLOBAL_MONTHLY_USD_CAP`], defaults.global),
  };
}

export function monthKey(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 7);
}

const MISSING_TABLE = /no such table|no such column/i;
const round6 = (value) => Math.round((Number(value) || 0) * 1e6) / 1e6;
// Float slack when comparing stored REAL sums against a USD cap.
const USD_EPSILON = 1e-6;

/** Calls and estimated USD recorded for one scope (a site id or "*") this month. */
export async function readEngineUsage(env, scope, engine, now = Date.now()) {
  const row = await env.DB.prepare("SELECT calls,est_cost_usd FROM aeo_sov_engine_usage WHERE scope=? AND engine=? AND month=?")
    .bind(scope, engine, monthKey(now)).first();
  return { calls: Number(row?.calls || 0), est_cost_usd: round6(row?.est_cost_usd) };
}

/**
 * Add calls (negative to refund a reservation) and estimated cost to both the
 * site's row and the global row. Unconditional: used to true up after a run.
 */
export async function recordEngineUsage(env, siteId, engine, { calls = 0, estCostUsd = 0, searches = 0 } = {}, now = Date.now()) {
  if (!calls && !estCostUsd && !searches) return;
  const month = monthKey(now);
  const at = new Date(now).toISOString();
  const sql = `INSERT INTO aeo_sov_engine_usage (scope,engine,month,calls,searches,est_cost_usd,updated_at) VALUES (?,?,?,?,?,?,?)
    ON CONFLICT(scope,engine,month) DO UPDATE SET calls=calls+excluded.calls,searches=searches+excluded.searches,
      est_cost_usd=est_cost_usd+excluded.est_cost_usd,updated_at=excluded.updated_at`;
  const statements = [siteId, GLOBAL_SCOPE].map((scope) => env.DB.prepare(sql)
    .bind(scope, engine, month, Math.trunc(calls), Math.trunc(searches), round6(estCostUsd), at));
  if (env.DB.batch) await env.DB.batch(statements);
  else for (const statement of statements) await statement.run();
}

/**
 * Reserve `calls` and `estCostUsd` for one site, all or nothing, without ever
 * letting a row pass its cap - also when several runs reserve at once.
 *
 * Each row is taken with one conditional UPDATE
 *   ... SET calls=calls+n ... WHERE calls+n <= cap AND est_cost_usd+usd <= usdCap
 * which D1 (SQLite, one writer) applies atomically: two concurrent runs cannot
 * both see room that only one of them fits in. The global row is taken first,
 * then the site row; if the site row has no room, the global reservation is
 * handed back. A null cap is not checked (Perplexity's per-site call cap lives
 * in aeo_sov_usage, guarded by the per-site measurement lock).
 *
 * Returns { ok: true } or { ok: false, scope: "global" | "site" }.
 */
export async function reserveEngineUsage(env, siteId, engine, { calls = 0, estCostUsd = 0, caps = {} } = {}, now = Date.now()) {
  const month = monthKey(now);
  const at = new Date(now).toISOString();
  const n = Math.max(0, Math.trunc(calls));
  const usd = Math.max(0, round6(estCostUsd));
  if (!n && !usd) return { ok: true };
  const ensure = (scope) => env.DB.prepare(`INSERT INTO aeo_sov_engine_usage (scope,engine,month,calls,searches,est_cost_usd,updated_at)
    VALUES (?,?,?,0,0,0,?) ON CONFLICT(scope,engine,month) DO NOTHING`).bind(scope, engine, month, at);
  const ensureAll = [ensure(GLOBAL_SCOPE), ensure(siteId)];
  if (env.DB.batch) await env.DB.batch(ensureAll);
  else for (const statement of ensureAll) await statement.run();
  const take = async (scope, callCap, usdCap) => {
    const calls = callCap === null || callCap === undefined ? null : Number(callCap);
    const dollars = usdCap === null || usdCap === undefined ? null : Number(usdCap) + USD_EPSILON;
    const result = await env.DB.prepare(`UPDATE aeo_sov_engine_usage SET calls=calls+?, est_cost_usd=est_cost_usd+?, updated_at=?
      WHERE scope=? AND engine=? AND month=? AND (? IS NULL OR calls+?<=?) AND (? IS NULL OR est_cost_usd+?<=?)`)
      .bind(n, usd, at, scope, engine, month, calls, n, calls, dollars, usd, dollars).run();
    return Number(result?.meta?.changes ?? result?.changes ?? 0) > 0;
  };
  if (!await take(GLOBAL_SCOPE, caps.globalCalls ?? null, caps.globalUsd ?? null)) return { ok: false, scope: "global" };
  if (!await take(siteId, caps.siteCalls ?? null, caps.siteUsd ?? null)) {
    await env.DB.prepare(`UPDATE aeo_sov_engine_usage SET calls=calls-?, est_cost_usd=est_cost_usd-?, updated_at=?
      WHERE scope=? AND engine=? AND month=?`).bind(n, usd, at, GLOBAL_SCOPE, engine, month).run();
    return { ok: false, scope: "site" };
  }
  return { ok: true };
}

/**
 * Decide, for one engine, whether this site may be measured now and with how
 * many calls. Statuses:
 *   ready              configured and under every cap; `allowance` calls
 *   not_configured     no key (never an error)
 *   disabled           a call or USD cap is set to 0 (ChatGPT's per-site
 *                      call cap is 0 by default)
 *   quota_reached      a monthly cap is spent; `scope` says which:
 *                      site | global (calls), site_usd | global_usd (USD)
 *   migration_pending  the usage table (0041) is missing, so ChatGPT's caps
 *                      cannot be enforced; it is not run.
 *                      Perplexity keeps its original per-site cap and runs.
 * A call is budgeted at its assumed maximum cost (assumedMaxCallCost), so the
 * USD left buys floor(left / usd_per_call) calls.
 * `perplexitySite` is the existing aeo_sov_usage reading for Perplexity.
 */
export async function planEngineBudget(env, siteId, engine, { perRunMax, perplexitySite = null, now = Date.now() } = {}) {
  const caps = engineCaps(env, engine.id);
  const usdCaps = engineUsdCaps(env, engine.id);
  const usdPerCall = assumedMaxCallCost(engine.id, env)?.est_usd || 0;
  const plan = { engine: engine.id, label: engine.label, status: "ready", allowance: 0, scope: null,
    site: { used: null, cap: caps.site, usd_used: null, usd_cap: usdCaps.site },
    global: { used: null, cap: caps.global, usd_used: null, usd_cap: usdCaps.global },
    est_cost_usd_month: null, usd_per_call: usdPerCall, usage_tracked: false };
  if (!engineConfigured(env, engine.id)) return { ...plan, status: "not_configured" };
  if (caps.site === 0 || caps.global === 0 || usdCaps.site === 0 || usdCaps.global === 0) return { ...plan, status: "disabled" };
  let site;
  let global;
  try {
    site = await readEngineUsage(env, siteId, engine.id, now);
    global = await readEngineUsage(env, GLOBAL_SCOPE, engine.id, now);
  } catch (error) {
    if (!MISSING_TABLE.test(String(error?.message || error))) throw error;
    site = null;
    global = null;
  }
  if (engine.id !== "perplexity" && (!site || !global)) return { ...plan, status: "migration_pending" };
  const tracked = !!site && !!global;
  plan.usage_tracked = tracked;
  // Perplexity's original counter stays authoritative for its per-site cap.
  plan.site.used = engine.id === "perplexity" ? Number(perplexitySite?.used || 0) : site.calls;
  if (tracked) {
    plan.global.used = global.calls;
    plan.site.usd_used = round6(site.est_cost_usd);
    plan.global.usd_used = round6(global.est_cost_usd);
    plan.est_cost_usd_month = site.est_cost_usd;
  }
  if (engine.id === "perplexity") plan.global_cap_enforced = tracked;
  const byUsd = (cap, used) => usdPerCall > 0 ? Math.floor((cap - used + USD_EPSILON) / usdPerCall) : Infinity;
  const limits = [["site", caps.site - plan.site.used]];
  if (tracked) {
    limits.push(["global", caps.global - global.calls]);
    limits.push(["site_usd", byUsd(usdCaps.site, site.est_cost_usd)]);
    limits.push(["global_usd", byUsd(usdCaps.global, global.est_cost_usd)]);
  }
  const tightest = limits.reduce((low, entry) => (entry[1] < low[1] ? entry : low));
  if (tightest[1] <= 0) return { ...plan, status: "quota_reached", scope: tightest[0] };
  return { ...plan, allowance: Math.min(perRunMax, tightest[1]) };
}

/** planEngineBudget for every engine, in registry order. A read only. */
export async function planEngineBudgets(env, siteId, options = {}) {
  const plans = [];
  for (const engine of ENGINE_DEFINITIONS) plans.push(await planEngineBudget(env, siteId, engine, options));
  return plans;
}

/**
 * Reserve each ready plan's allowance (calls, and calls x usd_per_call USD)
 * with reserveEngineUsage. When another run took the room first, the plan is
 * re-read and the smaller allowance tried, a few times; an engine left with no
 * room is reported as quota_reached. Each returned plan carries `reserved`
 * ({ calls, usd, tracked }) for the true-up after the run. Perplexity without
 * the 0041 table is not tracked there (its site cap is aeo_sov_usage).
 */
export async function reserveEngineBudgets(env, siteId, plans, options = {}) {
  const out = [];
  for (const initial of plans) {
    let plan = initial;
    if (plan.status !== "ready" || !(plan.allowance > 0)) { out.push(plan); continue; }
    const engine = engineDefinition(plan.engine);
    let reserved = null;
    for (let attempt = 0; attempt < 3 && plan.status === "ready" && plan.allowance > 0; attempt += 1) {
      if (!plan.usage_tracked) { reserved = { calls: 0, usd: 0, tracked: false }; break; }
      const usd = round6(plan.allowance * plan.usd_per_call);
      const result = await reserveEngineUsage(env, siteId, plan.engine, {
        calls: plan.allowance,
        estCostUsd: usd,
        caps: {
          siteCalls: plan.engine === "perplexity" ? null : plan.site.cap,
          globalCalls: plan.global.cap,
          siteUsd: plan.site.usd_cap,
          globalUsd: plan.global.usd_cap,
        },
      }, options.now);
      if (result.ok) { reserved = { calls: plan.allowance, usd, tracked: true }; break; }
      plan = await planEngineBudget(env, siteId, engine, options);
      if (plan.status === "ready" && attempt === 2) plan = { ...plan, status: "quota_reached", scope: result.scope, allowance: 0 };
    }
    out.push(reserved ? { ...plan, reserved } : { ...plan, allowance: 0, reserved: null });
  }
  return out;
}

/**
 * This month's estimated cost per engine for the whole deployment, for the
 * scheduled-batch log. Null when 0041 is missing.
 */
export async function monthlyCostSummary(env, now = Date.now()) {
  try {
    const rows = (await env.DB.prepare("SELECT engine,calls,searches,est_cost_usd FROM aeo_sov_engine_usage WHERE scope=? AND month=?")
      .bind(GLOBAL_SCOPE, monthKey(now)).all()).results || [];
    return Object.fromEntries(rows.map((row) => {
      const entry = { calls: Number(row.calls || 0), searches: Number(row.searches || 0), est_usd: Math.round(Number(row.est_cost_usd || 0) * 100) / 100 };
      return [row.engine, entry];
    }));
  } catch (error) {
    if (MISSING_TABLE.test(String(error?.message || error))) return null;
    throw error;
  }
}
