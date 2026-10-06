/**
 * Nurevo U2: AI Share-of-Voice (SoV) measurement. Upper plan (pro) only.
 *
 * What this measures, precisely: for a generated set of representative
 * questions a customer would ask an AI engine, how often the engine's answer
 * mentions this business, and how often it cites this business's domain.
 * Competitor comparison is share-of-voice by cited domain across the same
 * questions - it is computed from the engines' own citations, never guessed.
 *
 * Engines are opt-in through environment keys. With no key configured nothing
 * is called and the caller gets an explicit "unconfigured" result, so a canary
 * or local environment behaves correctly without any secret.
 *
 * BETA: answer sets vary run to run. Rates are reported with the sample size
 * that produced them so a small sample is never presented as precision.
 */

export const SOV_MODEL_VERSION = "u2-v1";
export const SOV_BETA = true;

/**
 * Fewest answers that may produce a rate. A single answer is one data point,
 * not a percentage: reporting it as 0% or 100% would overstate what was
 * measured, so below this the rate is null with an explicit reason.
 */
export const SOV_MIN_SAMPLES_FOR_RATE = 2;

/**
 * The reasons a rate may be absent, which a reader must never collapse into 0%.
 * `measured` is the only one that carries a number; the other two mean nothing
 * was measurable, which is a different statement from "measured, and it is zero".
 */
export const RATE_BASES = Object.freeze(["measured", "insufficient_samples", "no_answers"]);

/**
 * Cost control. These are hard limits enforced in code, not suggestions.
 * A pro site is measured weekly, so the monthly cap leaves headroom for a
 * small number of manual runs on top of the four scheduled ones.
 */
export const SOV_LIMITS = Object.freeze({
  maxQuestionsPerRun: 20,
  maxEnginesPerRun: 2,
  monthlyQueriesPerSite: 200,
  answerExcerptChars: 400,
  requestTimeoutMs: 20000,
  publicCacheTtlSeconds: 7 * 24 * 60 * 60,
});

/** Domains that are directories/aggregators, not a competing business site. */
const AGGREGATOR_HOSTS = Object.freeze([
  "google.com", "maps.google.com", "goo.gl", "tabelog.com", "hotpepper.jp",
  "gurunavi.com", "gnavi.co.jp", "retty.me", "ikyu.com", "jalan.net",
  "rurubu.travel", "tripadvisor.com", "tripadvisor.jp", "yelp.com",
  "facebook.com", "instagram.com", "x.com", "twitter.com", "youtube.com",
  "wikipedia.org", "ja.wikipedia.org", "note.com", "ameblo.jp",
]);

export class SovError extends Error {
  constructor(status, code) { super(code); this.name = "SovError"; this.status = status; this.code = code; }
}

/* ------------------------------------------------------------------ *
 * Engine registry
 * ------------------------------------------------------------------ */

/**
 * Engines usable in this environment, in probe priority order.
 *
 * `citations` records whether the engine returns a citation list. Engines
 * without one can only evidence a text mention, and the response says so
 * rather than implying citation data exists.
 */
/**
 * Engine registry, in probe order.
 *
 * `citations` records whether the provider returns a source list. Perplexity
 * searches the live web and cites it; the OpenAI chat endpoint answers from
 * model knowledge and returns no sources, so it can only evidence a text
 * mention. Citation-capable engines are probed first so the single-sample
 * public checker gets the stronger signal. `key` names the secret binding and
 * is the only thing consulted to decide whether an engine is usable.
 */
const ENGINES = Object.freeze([
  { id: "perplexity", label: "Perplexity", citations: true, key: "PERPLEXITY_API_KEY", live_search: true },
  { id: "openai", label: "ChatGPT (OpenAI)", citations: false, key: "OPENAI_API_KEY", live_search: false },
]);

/** Engines whose secret is present. An engine without its key is never probed. */
export function availableEngines(env = {}) {
  return ENGINES
    .filter((engine) => String(env[engine.key] || "").trim() !== "")
    .map(({ id, label, citations, live_search }) => ({ id, label, citations, live_search }))
    .slice(0, SOV_LIMITS.maxEnginesPerRun);
}

export function engineStatus(env = {}) {
  const engines = availableEngines(env);
  return {
    configured: engines.length > 0,
    engines: engines.map(({ id, label, citations, live_search }) => ({
      id, label, citations_available: citations, live_search,
    })),
    supported: ENGINES.map((engine) => engine.id),
  };
}

/* ------------------------------------------------------------------ *
 * Brand profile: who are we looking for in the answers
 * ------------------------------------------------------------------ */

const LOCALITY_KEYS = ["addressLocality", "addressRegion", "addressArea"];

/**
 * Derive the business name, type and locality used to build questions.
 *
 * Settings the owner typed win over anything inferred. The site's published
 * JSON-LD fills what is missing, which is why a site that already outputs good
 * schema (U1) gets better questions here.
 */
export function buildBrandProfile({ site = {}, settings = {}, schemas = [] } = {}) {
  const fromSchema = schemaProfile(schemas);
  const host = normalizeHost(site.website_uri || site.url || "");
  const name = firstNonEmpty(settings.name, fromSchema.name, host);
  if (!name) throw new SovError(422, "brand_name_unavailable");
  return {
    name,
    businessType: firstNonEmpty(settings.business_type, fromSchema.businessType) || "",
    locality: firstNonEmpty(localityFromAddress(settings.address), fromSchema.locality) || "",
    host,
    aliases: brandAliases(name, fromSchema.name, firstNonEmpty(settings.business_type, fromSchema.businessType)),
  };
}

/** Shortest alias that may be matched inside answer text. */
const MIN_ALIAS_CHARS = 2;

/**
 * Names that count as "this business was mentioned".
 *
 * The full name always counts. Derived forms (legal suffix stripped, the name
 * published in schema) only count when they survive two guards: they must be
 * long enough to be distinctive, and they must not simply be the business
 * type - a salon called "Cafe" must not match every answer containing "cafe".
 */
function brandAliases(name, schemaName, businessType) {
  const generic = normalizeForMatch(businessType || "");
  const candidates = dedupe([name, stripLegalSuffixes(name), schemaName].filter(Boolean));
  return candidates.filter((candidate, index) => {
    if (index === 0) return true; // the owner's own name, used as given
    const normalized = normalizeForMatch(candidate);
    if (normalized.length < MIN_ALIAS_CHARS) return false;
    return !(generic && normalized === generic);
  });
}

function schemaProfile(schemas) {
  const result = { name: "", businessType: "", locality: "" };
  for (const node of Array.isArray(schemas) ? schemas : []) {
    if (!node || typeof node !== "object") continue;
    const types = (Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]]).filter(Boolean).map(String);
    const isBusiness = types.some((type) => /business|restaurant|store|organization|shop|hotel|clinic|dentist|service/i.test(type));
    if (!result.name && isBusiness && typeof node.name === "string") result.name = node.name.trim();
    if (!result.businessType && isBusiness) {
      result.businessType = String(node.additionalType || types.find((type) => !/^organization$/i.test(type)) || "").trim();
    }
    if (!result.locality && node.address && typeof node.address === "object") {
      for (const key of LOCALITY_KEYS) {
        if (typeof node.address[key] === "string" && node.address[key].trim()) {
          result.locality = node.address[key].trim();
          break;
        }
      }
    }
    if (!result.locality && typeof node.address === "string") result.locality = localityFromAddress(node.address);
  }
  return result;
}

/** Pull a coarse locality (prefecture/ward/city) out of a free-text address. */
export function localityFromAddress(address) {
  const text = String(address || "").replace(/^\s*〒?\s*\d{3}-?\d{4}\s*/, "").trim();
  if (!text) return "";
  const match = text.match(/^(.{2,4}?[都道府県])?\s*(.{1,8}?[市区町村])?/);
  const ward = match?.[2]?.trim() || "";
  const prefecture = match?.[1]?.trim() || "";
  return ward || prefecture || text.slice(0, 12);
}

function stripLegalSuffixes(name) {
  return String(name).replace(/(株式会社|有限会社|合同会社|\bInc\.?|\bLLC\b|\bCo\.,? ?Ltd\.?)/gi, "").trim();
}

/* ------------------------------------------------------------------ *
 * Question set: 業種 × 地域
 * ------------------------------------------------------------------ */

/**
 * Representative questions a customer would actually ask, built from the
 * business type and locality.
 *
 * Discovery questions only. A question that already contains the business name
 * is almost always answered with that name, so mixing one in would measure the
 * question rather than the site's visibility. Branded questions exist solely as
 * a parser control - see brandedControlQuestions() - and never reach a
 * scheduled run.
 */
export function buildQuestionSet(profile, limit = SOV_LIMITS.maxQuestionsPerRun) {
  const type = profile.businessType || "お店";
  const area = profile.locality || "";
  // Two forms are needed so the particle stays correct: "渋谷区の喫茶店" when
  // the area modifies the noun, "渋谷区で" when it modifies the verb phrase.
  const where = area ? `${area}の` : "";
  const inArea = area ? `${area}で` : "";
  const discovery = [
    `${where}${type}でおすすめはどこ？`,
    `${where}${type}を探しています。評判の良いところを教えて。`,
    `${inArea}人気の${type}を3つ挙げて。`,
    `${where}${type}の営業時間を知りたい。`,
    `${where}${type}で予約できるところは？`,
    `${where}${type}の料金相場と、おすすめの店を教えて。`,
    `${where}${type}で初めての人向けのところはどこ？`,
    `${where}${type}を駅から近い順に教えて。`,
    `${where}${type}の口コミが良いお店は？`,
    `今日${where}${type}に行きたい。候補を出して。`,
  ];
  const questions = discovery
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter((text, index, all) => text && all.indexOf(text) === index);
  return questions.slice(0, Math.max(1, Math.min(limit, SOV_LIMITS.maxQuestionsPerRun)));
}

/**
 * Brand-name questions used only to verify the mention parser against a known
 * answer. These are NOT part of any scheduled measurement: the answer is
 * guaranteed to contain the brand, so counting it would be circular. Results
 * are reported separately from the headline rate.
 */
export function brandedControlQuestions(profile, limit = 1) {
  const type = profile.businessType || "お店";
  const branded = [
    `${profile.name}はどんな${type}？`,
    `${profile.name}の営業時間と住所を教えて。`,
    `${profile.name}の評判は？`,
  ];
  return branded
    .map((text) => ({ text: text.replace(/\s+/g, " ").trim(), kind: "branded" }))
    .slice(0, Math.max(1, limit));
}

/** Accept a plain string (discovery by default) or an explicit {text, kind}. */
function normalizeQuestion(question) {
  if (typeof question === "string") return { text: question, kind: "discovery" };
  return { text: String(question?.text || ""), kind: question?.kind === "branded" ? "branded" : "discovery" };
}

/* ------------------------------------------------------------------ *
 * Answer analysis
 * ------------------------------------------------------------------ */

/**
 * Decide whether an answer mentions and/or cites the brand, and collect the
 * other domains the engine cited so share-of-voice can be computed.
 */
export function analyzeAnswer({ answer = "", citations = [], profile }) {
  const text = String(answer);
  const normalized = normalizeForMatch(text);
  // Exact containment of a vetted alias only. No stemming, no edit distance,
  // no partial scoring: an uncertain match is not an appearance.
  const mentioned = (profile.aliases || [profile.name])
    .map(normalizeForMatch)
    .filter((alias) => alias.length >= MIN_ALIAS_CHARS)
    .some((alias) => normalized.includes(alias));

  const citedHosts = dedupe([
    ...citations.map((citation) => normalizeHost(typeof citation === "string" ? citation : citation?.url)),
    ...urlsInText(text).map(normalizeHost),
  ].filter(Boolean));

  const ownHost = profile.host ? normalizeHost(profile.host) : "";
  const cited = !!ownHost && citedHosts.some((host) => sameSite(host, ownHost));
  const competitorHosts = citedHosts.filter((host) => !sameSite(host, ownHost) && !isAggregator(host));

  return {
    mentioned,
    cited,
    citedHosts,
    competitorHosts,
    excerpt: text.replace(/\s+/g, " ").trim().slice(0, SOV_LIMITS.answerExcerptChars),
  };
}

/**
 * Aggregate per-question results into the reported rates and SoV ranking.
 *
 * The headline rate is computed from discovery questions only. A branded
 * control question names the business in the prompt, so its answer almost
 * always mentions it; including it would measure the question, not the site.
 * Controls are summarised separately under `parser_control`.
 */
export function aggregateSov(samples, profile) {
  const discoverySamples = samples.filter((sample) => sample.kind !== "branded");
  const controlSamples = samples.filter((sample) => sample.kind === "branded");
  // A probe that failed (HTTP error, timeout, unconfigured engine) is excluded
  // from the denominator: an outage must lower confidence, never the rate.
  const answered = discoverySamples.filter((sample) => sample.ok);
  const total = answered.length;
  const mentions = answered.filter((sample) => sample.mentioned).length;
  const citations = answered.filter((sample) => sample.cited).length;
  const rateAvailable = total >= SOV_MIN_SAMPLES_FOR_RATE;
  const rateOf = (count) => rateAvailable ? rate(count, total) : null;

  const byHost = new Map();
  for (const sample of answered) {
    for (const host of dedupe(sample.competitorHosts || [])) {
      byHost.set(host, (byHost.get(host) || 0) + 1);
    }
  }
  const ownHost = normalizeHost(profile.host || "");
  const competitors = [...byHost.entries()]
    .map(([host, appearances]) => ({ host, appearances, appearance_rate: rateOf(appearances) }))
    .sort((a, b) => b.appearances - a.appearances || a.host.localeCompare(b.host))
    .slice(0, 10);

  return {
    model_version: SOV_MODEL_VERSION,
    beta: SOV_BETA,
    brand: { name: profile.name, host: ownHost || null },
    questions_asked: discoverySamples.length,
    answers_received: total,
    appearance_rate: rateOf(mentions),
    citation_rate: rateOf(citations),
    // Distinguishes "measured 0%" from "could not be measured".
    rate_basis: total === 0 ? "no_answers" : rateAvailable ? "measured" : "insufficient_samples",
    min_samples_for_rate: SOV_MIN_SAMPLES_FOR_RATE,
    appearances: mentions,
    citations,
    competitors,
    by_engine: engineBreakdown(discoverySamples, rateAvailable),
    parser_control: controlSummary(controlSamples),
    // A handful of answers cannot support a confident rate. Say so instead of
    // letting the gauge imply precision it does not have.
    confidence: !rateAvailable ? "none" : total < 5 ? "low" : total < 12 ? "medium" : "normal",
  };
}

function rate(count, total) {
  return total > 0 ? Math.round((count / total) * 1000) / 1000 : null;
}

/**
 * Per-engine split of the same samples.
 *
 * The headline rate mixes every configured engine. Perplexity searches the web
 * while the OpenAI chat endpoint answers from model knowledge, so the operator
 * is shown which engine contributed what instead of one undifferentiated number.
 */
/**
 * Branded control questions, reported but never scored.
 *
 * `detected` is how often the parser found the brand in an answer that was
 * engineered to contain it: a low number means the matcher is broken, not that
 * visibility is low. Null when no control question was asked.
 */
function controlSummary(samples) {
  if (!samples.length) return null;
  const answered = samples.filter((sample) => sample.ok);
  return {
    asked: samples.length,
    answers: answered.length,
    detected: answered.filter((sample) => sample.mentioned).length,
    cited: answered.filter((sample) => sample.cited).length,
    excluded_from_rate: true,
    note: "Branded control question. Excluded from the appearance rate because the prompt names the business.",
  };
}

function engineBreakdown(samples, rateAvailable) {
  const byEngine = new Map();
  for (const sample of samples) {
    const id = sample.engine || "unknown";
    const row = byEngine.get(id) || { engine: id, answers: 0, failures: 0, appearances: 0, citations: 0 };
    if (sample.ok) {
      row.answers += 1;
      if (sample.mentioned) row.appearances += 1;
      if (sample.cited) row.citations += 1;
    } else {
      row.failures += 1;
    }
    byEngine.set(id, row);
  }
  return [...byEngine.values()].map((row) => {
    const meta = ENGINES.find((engine) => engine.id === row.engine);
    return {
      ...row,
      live_search: meta ? meta.live_search : null,
      citations_available: meta ? meta.citations : null,
      appearance_rate: rateAvailable && row.answers >= SOV_MIN_SAMPLES_FOR_RATE
        ? rate(row.appearances, row.answers) : null,
    };
  });
}

/* ------------------------------------------------------------------ *
 * Engine probes
 * ------------------------------------------------------------------ */

const SYSTEM_PROMPT = "You are answering as a consumer-facing AI search assistant. Answer the user's question about local businesses concisely and factually. Name specific businesses when you can, and include source URLs when you have them.";

/**
 * Resolve an engine endpoint.
 *
 * The request carries the provider API key in its Authorization header, so an
 * environment-supplied override is only honoured when it points at this
 * machine. That keeps a misconfigured or tampered variable from redirecting a
 * live secret to a third-party host; anything else silently uses the provider.
 */
function engineEndpoint(override, providerUrl) {
  const raw = String(override || "").trim();
  if (!raw) return providerUrl;
  let url;
  try { url = new URL(raw); } catch { return providerUrl; }
  const host = url.hostname.toLowerCase();
  const loopback = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]"
    || host.endsWith(".localhost") || host.endsWith(".test");
  return loopback ? url.href : providerUrl;
}

async function probePerplexity(env, question, fetchImpl) {
  const endpoint = engineEndpoint(env.PERPLEXITY_API_URL, "https://api.perplexity.ai/chat/completions");
  const response = await withTimeout((signal) => fetchImpl(endpoint, {
    method: "POST",
    signal,
    headers: { authorization: `Bearer ${env.PERPLEXITY_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: String(env.PERPLEXITY_MODEL || "sonar"),
      messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: question }],
      max_tokens: 500,
    }),
  }));
  if (!response.ok) throw new SovError(502, `perplexity_http_${response.status}`);
  const data = await response.json();
  return {
    answer: String(data?.choices?.[0]?.message?.content || ""),
    citations: Array.isArray(data?.citations) ? data.citations : Array.isArray(data?.search_results) ? data.search_results : [],
  };
}

async function probeOpenAi(env, question, fetchImpl) {
  const endpoint = engineEndpoint(env.OPENAI_CHAT_API_URL, "https://api.openai.com/v1/chat/completions");
  const response = await withTimeout((signal) => fetchImpl(endpoint, {
    method: "POST",
    signal,
    headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: String(env.OPENAI_MODEL || "gpt-4.1-mini"),
      messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: question }],
      max_tokens: 500,
    }),
  }));
  if (!response.ok) throw new SovError(502, `openai_http_${response.status}`);
  const data = await response.json();
  // No citation list is returned here, so only URLs inside the answer text can
  // serve as citation evidence. engineStatus() reports citations_available:false.
  return { answer: String(data?.choices?.[0]?.message?.content || ""), citations: [] };
}

const PROBES = Object.freeze({ perplexity: probePerplexity, openai: probeOpenAi });

/* ------------------------------------------------------------------ *
 * Measurement
 * ------------------------------------------------------------------ */

/**
 * Run the question set against the configured engines.
 *
 * `budget` caps how many engine calls may be made and is decremented as they
 * are issued, so the monthly cap holds even if a question set is large.
 */
export async function measureSov(env, profile, {
  questions,
  budget = SOV_LIMITS.maxQuestionsPerRun * SOV_LIMITS.maxEnginesPerRun,
  fetchImpl = fetch,
} = {}) {
  const engines = availableEngines(env);
  if (!engines.length) {
    return {
      status: "unconfigured",
      ...engineStatus(env),
      ...aggregateSov([], profile),
      samples: [],
      queries_used: 0,
      limits: SOV_LIMITS,
    };
  }

  const questionSet = (questions && questions.length ? questions : buildQuestionSet(profile))
    .slice(0, SOV_LIMITS.maxQuestionsPerRun)
    .map(normalizeQuestion);
  const samples = [];
  let used = 0;
  let truncated = false;

  for (const question of questionSet) {
    for (const engine of engines) {
      if (used >= budget) { truncated = true; break; }
      used += 1;
      try {
        const probe = await PROBES[engine.id](env, question.text, fetchImpl);
        const analysis = analyzeAnswer({ ...probe, profile });
        samples.push({ ok: true, engine: engine.id, question: question.text, kind: question.kind, ...analysis });
      } catch (error) {
        // A failed probe is recorded but excluded from the rate denominator,
        // so an engine outage lowers confidence instead of the score.
        samples.push({
          ok: false, engine: engine.id, question: question.text, kind: question.kind,
          error: String(error?.code || error?.message || error).slice(0, 120),
        });
      }
    }
    if (used >= budget) { truncated = true; break; }
  }

  return {
    status: "measured",
    ...engineStatus(env),
    ...aggregateSov(samples, profile),
    samples,
    queries_used: used,
    truncated,
    limits: SOV_LIMITS,
  };
}

/* ------------------------------------------------------------------ *
 * Monthly query cap (enforced, not advisory)
 * ------------------------------------------------------------------ */

export function sovMonthKey(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 7);
}

/** Remaining engine calls this site may spend this month. */
export async function sovRemainingBudget(env, siteId, now = Date.now()) {
  const month = sovMonthKey(now);
  const row = await env.DB.prepare("SELECT queries_used FROM aeo_sov_usage WHERE site_id=? AND month=?")
    .bind(siteId, month).first();
  const used = Number(row?.queries_used || 0);
  return { month, used, cap: SOV_LIMITS.monthlyQueriesPerSite, remaining: Math.max(0, SOV_LIMITS.monthlyQueriesPerSite - used) };
}

export async function sovRecordUsage(env, siteId, queries, now = Date.now()) {
  if (!queries) return;
  await env.DB.prepare(`
    INSERT INTO aeo_sov_usage (site_id,month,queries_used,updated_at) VALUES (?,?,?,?)
    ON CONFLICT(site_id,month) DO UPDATE SET queries_used=queries_used+excluded.queries_used,updated_at=excluded.updated_at
  `).bind(siteId, sovMonthKey(now), queries, new Date(now).toISOString()).run();
}

/* ------------------------------------------------------------------ *
 * Persistence
 * ------------------------------------------------------------------ */

export async function storeSovRun(env, siteId, result, { trigger = "manual", now = Date.now() } = {}) {
  const id = `sov_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const ranAt = new Date(now).toISOString();
  await env.DB.prepare(`
    INSERT INTO aeo_sov_runs
      (id,site_id,ran_at,status,trigger,model_version,engines_json,questions_asked,answers_received,
       queries_used,appearance_rate,citation_rate,confidence,competitors_json,detail_json)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    id, siteId, ranAt, result.status, trigger, SOV_MODEL_VERSION,
    JSON.stringify(result.engines || []), result.questions_asked || 0, result.answers_received || 0,
    result.queries_used || 0, result.appearance_rate, result.citation_rate, result.confidence,
    JSON.stringify(result.competitors || []),
    // Keep what the aggregation already worked out. Without these the reader
    // cannot tell a measured zero from an unmeasurable one, and cannot separate
    // the engine that searches the web from the one answering out of model
    // knowledge - it would have to recompute both from the mention rows and
    // get the branded controls wrong doing it.
    JSON.stringify({
      beta: SOV_BETA,
      truncated: !!result.truncated,
      brand: result.brand,
      rate_basis: result.rate_basis,
      min_samples_for_rate: result.min_samples_for_rate,
      by_engine: result.by_engine || [],
      parser_control: result.parser_control ?? null,
    }),
  ).run();

  const samples = (result.samples || []).slice(0, SOV_LIMITS.maxQuestionsPerRun * SOV_LIMITS.maxEnginesPerRun);
  for (const sample of samples) {
    await env.DB.prepare(`
      INSERT INTO aeo_sov_mentions
        (run_id,site_id,engine,question,kind,ok,brand_mentioned,brand_cited,competitor_hosts_json,answer_excerpt,error)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      id, siteId, sample.engine, sample.question,
      // Recorded so a later reader can exclude the controls the aggregation
      // already excluded, instead of silently folding them into the rate.
      sample.kind === "branded" ? "branded" : "discovery",
      sample.ok ? 1 : 0,
      sample.mentioned ? 1 : 0, sample.cited ? 1 : 0,
      JSON.stringify(sample.competitorHosts || []), sample.excerpt || null, sample.error || null,
    ).run();
  }
  return { id, ran_at: ranAt };
}

/**
 * Why a run reports no rate.
 *
 * Runs written before 0022 did not store this, so it is recomputed from the
 * answer count using the same threshold the aggregation applied. That keeps an
 * old row readable without inventing anything: the answer count and the
 * threshold are exactly what decided the rate in the first place.
 */
export function deriveRateBasis(answersReceived) {
  const answers = Number(answersReceived || 0);
  if (answers === 0) return "no_answers";
  return answers >= SOV_MIN_SAMPLES_FOR_RATE ? "measured" : "insufficient_samples";
}

/** Latest run plus the trend series the dashboard graphs. */
export async function loadSovHistory(env, siteId, { limit = 26 } = {}) {
  const bounded = Math.min(52, Math.max(1, limit));
  const result = await env.DB.prepare(`
    SELECT id,ran_at,status,trigger,appearance_rate,citation_rate,confidence,
           questions_asked,answers_received,queries_used,competitors_json,engines_json,detail_json
      FROM aeo_sov_runs WHERE site_id=? ORDER BY ran_at DESC LIMIT ?
  `).bind(siteId, bounded).all();
  const rows = result.results || [];
  const latest = rows[0] || null;
  const detail = latest ? safeJsonObject(latest.detail_json) : {};
  return {
    latest: latest ? {
      ...latest,
      // Aggregators were already dropped when the answer was analysed. Applying
      // the same list again on the way out means a row written by an older
      // build - or edited by hand - cannot put tabelog back in front of the
      // operator as if it were a competitor.
      competitors: safeJsonArray(latest.competitors_json)
        .filter((entry) => entry && !isAggregator(String(entry.host || ""))),
      engines: safeJsonArray(latest.engines_json),
      // Stored since 0022; derived for anything older. A row that predates the
      // per-engine split reports an empty breakdown rather than one recomputed
      // from mention rows, which could not tell a branded control apart.
      rate_basis: RATE_BASES.includes(detail.rate_basis)
        ? detail.rate_basis
        : deriveRateBasis(latest.answers_received),
      rate_basis_derived: !RATE_BASES.includes(detail.rate_basis),
      min_samples_for_rate: Number(detail.min_samples_for_rate) || SOV_MIN_SAMPLES_FOR_RATE,
      by_engine: asArray(detail.by_engine),
      parser_control: detail.parser_control ?? null,
      truncated: !!detail.truncated,
    } : null,
    trend: rows.slice().reverse().map((row) => ({
      ran_at: row.ran_at,
      appearance_rate: row.appearance_rate,
      citation_rate: row.citation_rate,
      answers_received: row.answers_received,
      confidence: row.confidence,
    })),
  };
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function safeJsonArray(value) {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

/** A stored JSON object, or {} for anything unreadable - including JSON that
 *  parses to an array or a scalar, which would otherwise read as an object with
 *  no keys and silently lose the distinction. */
function safeJsonObject(value) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/** An already-parsed value that should be a list. */
function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function dedupe(values) {
  return [...new Set(values)];
}

export function normalizeHost(value) {
  let text = String(value || "").trim().toLowerCase();
  if (!text) return "";
  if (!/^[a-z][a-z0-9+.-]*:\/\//.test(text)) text = `https://${text}`;
  try { return new URL(text).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function sameSite(a, b) {
  if (!a || !b) return false;
  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);
}

function isAggregator(host) {
  return AGGREGATOR_HOSTS.some((known) => sameSite(host, known));
}

function urlsInText(text) {
  return String(text).match(/https?:\/\/[^\s<>()[\]"'、。]+/g) || [];
}

/** Lowercase, strip spaces and width differences so brand matching is robust. */
export function normalizeForMatch(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s　]+/g, "")
    .replace(/[・･'’"“”`]/g, "");
}

function withTimeout(run, timeoutMs = SOV_LIMITS.requestTimeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return Promise.resolve(run(controller.signal)).finally(() => clearTimeout(timer));
}
