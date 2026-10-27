/**
 * The learning change log (migration 0049, docs/learning.md).
 *
 * What changed on a site, and when: per site, timestamped, typed events with a
 * small JSON payload. Two writers:
 *
 *   plugin   the WordPress plugin queues events locally (an option) as its
 *            settings change and sends them with its existing sync, in
 *            batches, each with its own id: POST /api/sites/{id}/events with
 *            the profile token (ingestPluginEvents). Only once the site is
 *            connected and the owner has agreed - the same rule as the
 *            profile and catalogue sync.
 *   service  the Worker records what it did or measured: scores, plans,
 *            measurements, audits, recommendations shown (recordServiceEvent).
 *
 * No personal data, by construction: every event type has an allowlist of
 * keys, and each key a validator that only lets through a boolean, a bounded
 * integer, a value from a fixed list, or a short token of [a-z0-9_.-]. Field
 * NAMES are recorded ("address was filled in"), never the values. Anything
 * not on the list is dropped before it is written, and an event of an
 * unknown type is rejected. So even a plugin that sent an address by mistake
 * could not get it stored.
 *
 * Idempotent: (site_id, event_id) is the primary key and every insert is
 * INSERT ... ON CONFLICT DO NOTHING, so a batch re-sent after a lost response
 * stores nothing twice; the reply lists the ids as accepted either way, so the
 * plugin can drop them from its queue.
 *
 * Every writer is best-effort: a missing table (before 0049) or any other
 * failure is swallowed and logged, never failing the request that caused it.
 */

export const LEARNING_EVENTS_VERSION = "learn-events-v1";

/** Profile fields whose presence (not value) the plugin reports. Mirrors PROFILE_FIELDS / the plugin's field map. */
export const LEARNING_PROFILE_FIELDS = Object.freeze(["name", "description", "address", "phone", "hours", "business_type_schema", "email", "url"]);
/** The fields that make a local business's facts complete (the "LocalBusiness facts completed" treatment). */
export const LOCAL_FACT_FIELDS = Object.freeze(["name", "address", "phone", "hours", "business_type_schema"]);
/** The plugin's output switches, by the name the events use. */
export const LEARNING_SWITCHES = Object.freeze(["enabled", "schema", "llms_txt", "crawlers", "browser_tag", "schema_dedupe"]);
export const SEO_PLUGIN_IDS = Object.freeze(["yoast", "rankmath", "aioseo", "slimseo", "seopress", "tsf", "none"]);
export const SITE_TYPE_VALUES = Object.freeze(["local", "ec", "b2b", "unset"]);
export const PLAN_VALUES = Object.freeze(["free", "standard", "pro"]);
export const CHECK_STATUSES = Object.freeze(["OK", "WARN", "BAD", "NA"]);
export const AEO_COMPONENTS = Object.freeze(["schema", "coverage", "legibility", "llms", "consistency"]);
export const ENGINE_IDS_FOR_LEARNING = Object.freeze(["perplexity", "openai", "chatgpt", "gemini", "claude"]);

const MAX_EVENTS_PER_REQUEST = 100;
const MAX_COUNT = 100000;
/** Plugin clocks are trusted only within this window around the server's. */
const MAX_PAST_MS = 400 * 86400e3;
const MAX_FUTURE_MS = 86400e3;

/* ------------------------------------------------------------------ *
 * Validators: each returns the clean value, or undefined to drop the key.
 * ------------------------------------------------------------------ */

const v = {
  bool: () => (value) => (typeof value === "boolean" ? value : value === 1 || value === "1" ? true : value === 0 || value === "0" ? false : undefined),
  int: (min = 0, max = MAX_COUNT) => (value) => {
    const n = typeof value === "number" ? value : typeof value === "string" && /^-?\d+$/.test(value) ? Number(value) : NaN;
    return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
  },
  num: (min, max) => (value) => (typeof value === "number" && Number.isFinite(value) && value >= min && value <= max ? Math.round(value * 1e4) / 1e4 : undefined),
  oneOf: (values) => (value) => (typeof value === "string" && values.includes(value) ? value : undefined),
  /** A short identifier: lower-case letters, digits, _ . - only. Cannot carry an address or a phone number in any useful form. */
  token: (max = 40) => (value) => (typeof value === "string" && value.length <= max && /^[a-z][a-z0-9_.-]*$/.test(value) ? value : undefined),
  version: () => (value) => (typeof value === "string" && value.length <= 20 && /^\d+(\.\d+){0,3}([.-][a-z0-9]+)*$/i.test(value) ? value : undefined),
  list: (item, max = 20) => (value) => {
    if (!Array.isArray(value)) return undefined;
    const out = [];
    for (const entry of value.slice(0, max)) {
      const clean = item(entry);
      if (clean !== undefined && !out.includes(clean)) out.push(clean);
    }
    return out;
  },
  /** An object with a fixed set of keys, each with its own validator. */
  shape: (spec) => (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    const out = {};
    for (const [key, check] of Object.entries(spec)) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
      const clean = check(value[key]);
      if (clean !== undefined) out[key] = clean;
    }
    return out;
  },
  /** An object whose keys come from a list, all with one validator. */
  keyed: (keys, check) => (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    const out = {};
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
      const clean = check(value[key]);
      if (clean !== undefined) out[key] = clean;
    }
    return out;
  },
};

const field = v.oneOf(LEARNING_PROFILE_FIELDS);
const count = v.int(0, MAX_COUNT);
const fromToSpec = (check) => ({ from: check, to: check });
const fromTo = (check) => v.shape(fromToSpec(check));
const switches = v.keyed(LEARNING_SWITCHES, v.bool());
const counts = v.shape({ faq: count, services: count, products: count, pages: count });
const engineCounts = v.shape({ n: count, named: count, cited: count, appeared: count });
const components = v.keyed(AEO_COMPONENTS, v.oneOf(CHECK_STATUSES));

/**
 * Every event type, who may send it, and its payload allowlist. A type that is
 * not here is rejected; a key that is not in its spec is dropped.
 */
export const LEARNING_EVENT_TYPES = Object.freeze({
  /* ---- plugin ---- */
  // The state at the first observation after the site connected (or after the
  // queue was introduced by an update): the "before" of every later change.
  snapshot: { source: "plugin", spec: {
    switches, ai_training: v.oneOf(["default", "allow", "block"]), fields_filled: v.list(field, 10), facts_complete: v.bool(),
    site_type: v.oneOf(SITE_TYPE_VALUES), seo_plugins: v.list(v.oneOf(SEO_PLUGIN_IDS), 8), plugin_version: v.version(),
    counts, installed_days: v.int(0, 36500), woocommerce: v.bool(),
  } },
  output_toggled: { source: "plugin", spec: { switch: v.oneOf(LEARNING_SWITCHES), on: v.bool() } },
  ai_training_changed: { source: "plugin", spec: fromToSpec(v.oneOf(["default", "allow", "block"])) },
  fields_changed: { source: "plugin", spec: { filled: v.list(field, 10), cleared: v.list(field, 10), facts_complete: v.bool(), became_complete: v.bool() } },
  site_type_changed: { source: "plugin", spec: fromToSpec(v.oneOf(SITE_TYPE_VALUES)) },
  fix_applied: { source: "plugin", spec: { check: v.token(40), via: v.oneOf(["one_click", "autofix"]), actions: v.list(v.token(40), 10) } },
  plugin_version_changed: { source: "plugin", spec: fromToSpec(v.version()) },
  seo_plugin_changed: { source: "plugin", spec: { from: v.list(v.oneOf(SEO_PLUGIN_IDS), 8), to: v.list(v.oneOf(SEO_PLUGIN_IDS), 8) } },
  counts_changed: { source: "plugin", spec: { faq: fromTo(count), services: fromTo(count), products: fromTo(count) } },
  /* ---- service ---- */
  site_created: { source: "service", spec: { install_type: v.oneOf(["wp", "tag", "hosted", "static"]), plan: v.oneOf(PLAN_VALUES) } },
  site_connected: { source: "service", spec: { via: v.oneOf(["pairing", "license"]), install_type: v.oneOf(["wp", "tag", "hosted", "static"]) } },
  plan_changed: { source: "service", spec: fromToSpec(v.oneOf(PLAN_VALUES)) },
  score_changed: { source: "service", spec: {
    readiness: v.int(0, 100), readiness_from: v.int(0, 100), components, changed: v.list(v.oneOf(AEO_COMPONENTS), 5),
    score_version: v.token(20), headline: v.int(0, 100), model_version: v.token(20), first: v.bool(),
  } },
  sov_run: { source: "service", spec: { status: v.token(30), trigger: v.token(20), engines: v.keyed(ENGINE_IDS_FOR_LEARNING, engineCounts) } },
  free_check: { source: "service", spec: { status: v.oneOf(["done", "failed"]), trigger: v.token(20), engine: v.oneOf(ENGINE_IDS_FOR_LEARNING), n: count, named: count, cited: count, appeared: count } },
  baseline_measured: { source: "service", spec: {
    status: v.oneOf(["done", "failed", "skipped"]), reason: v.token(40), engine: v.oneOf(ENGINE_IDS_FOR_LEARNING), n: count, named: count, cited: count, appeared: count,
    readiness: v.int(0, 100), components, connected_before: v.bool(),
  } },
  offsite_audit: { source: "service", spec: { counts: v.keyed(["audited", "found", "not_found", "ambiguous", "error", "rate_limited", "not_applicable", "skipped", "not_configured", "unconfigured", "missing_listing", "manual_check"], count), mismatched_fields: count, trigger: v.token(20) } },
  recommendations_shown: { source: "service", spec: { count, kinds: v.list(v.token(40), 20) } },
});

/** The payload of one event, reduced to its allowlist. Unknown types give null. */
export function sanitizeEventData(type, data) {
  const definition = LEARNING_EVENT_TYPES[type];
  if (!definition) return null;
  return v.shape(definition.spec)(data && typeof data === "object" ? data : {}) || {};
}

const MISSING = /no such table|no such column/i;

function isoOrNull(value) {
  const ms = typeof value === "number" ? value : Date.parse(String(value || ""));
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

/**
 * Record one service-side event. Never throws. `eventId` makes it idempotent
 * where one event per thing is meant (default: a random id).
 */
export async function recordServiceEvent(env, siteId, type, data = {}, { at = Date.now(), eventId = null } = {}) {
  try {
    if (!env?.DB || !siteId) return { ok: false, reason: "no_db" };
    const definition = LEARNING_EVENT_TYPES[type];
    if (!definition || definition.source !== "service") return { ok: false, reason: "unknown_type" };
    const clean = sanitizeEventData(type, data);
    const occurred = isoOrNull(at) || new Date().toISOString();
    const id = String(eventId || `svc:${type}:${crypto.randomUUID()}`).slice(0, 120);
    const result = await env.DB.prepare(`INSERT INTO learning_events (site_id,event_id,source,type,occurred_at,received_at,data_json)
      VALUES (?,?,?,?,?,?,?) ON CONFLICT(site_id,event_id) DO NOTHING`)
      .bind(String(siteId), id, "service", type, occurred, new Date().toISOString(), JSON.stringify(clean)).run();
    return { ok: true, inserted: Number(result?.meta?.changes ?? result?.changes ?? 0) > 0 };
  } catch (error) {
    if (!MISSING.test(String(error?.message || error))) {
      console.warn("learning_event_error", JSON.stringify({ type, error: String(error?.message || error).slice(0, 120) }));
    }
    return { ok: false, reason: "error" };
  }
}

/**
 * Ingest a batch from the plugin. Body: { events: [{ id, type, at, data }] }.
 * Returns { status, body }: accepted = ids stored now or already stored (the
 * plugin drops them); rejected = ids the service will never take (unknown
 * type, bad id or time) - the plugin drops those too, so one bad event cannot
 * block the queue.
 */
export async function ingestPluginEvents(env, siteId, body, { now = Date.now() } = {}) {
  const events = Array.isArray(body?.events) ? body.events : null;
  if (!events) return { status: 400, body: { error: "events_required" } };
  if (events.length > MAX_EVENTS_PER_REQUEST) return { status: 413, body: { error: "too_many_events", max: MAX_EVENTS_PER_REQUEST } };
  const accepted = [];
  const rejected = [];
  const statements = [];
  const receivedAt = new Date(now).toISOString();
  for (const event of events) {
    const id = typeof event?.id === "string" ? event.id : "";
    if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) { rejected.push({ id: id.slice(0, 64), reason: "bad_id" }); continue; }
    const definition = LEARNING_EVENT_TYPES[event?.type];
    if (!definition || definition.source !== "plugin") { rejected.push({ id, reason: "unknown_type" }); continue; }
    const at = Date.parse(String(event.at || ""));
    if (!Number.isFinite(at) || at < now - MAX_PAST_MS || at > now + MAX_FUTURE_MS) { rejected.push({ id, reason: "bad_time" }); continue; }
    const clean = sanitizeEventData(event.type, event.data);
    statements.push(env.DB.prepare(`INSERT INTO learning_events (site_id,event_id,source,type,occurred_at,received_at,data_json)
      VALUES (?,?,?,?,?,?,?) ON CONFLICT(site_id,event_id) DO NOTHING`)
      .bind(String(siteId), id, "plugin", event.type, new Date(at).toISOString(), receivedAt, JSON.stringify(clean)));
    accepted.push(id);
  }
  try {
    if (statements.length) {
      if (env.DB.batch) await env.DB.batch(statements);
      else for (const statement of statements) await statement.run();
    }
  } catch (error) {
    // Before 0049 nothing can be stored: say so, and the plugin keeps its queue.
    if (MISSING.test(String(error?.message || error))) return { status: 503, body: { error: "migration_pending" } };
    throw error;
  }
  return { status: 200, body: { ok: true, version: LEARNING_EVENTS_VERSION, accepted, rejected } };
}

/* ------------------------------------------------------------------ *
 * Helpers for the service-side hooks
 * ------------------------------------------------------------------ */

/** {schema: "OK", ...} from a diagnosis's checks, components only. */
export function componentStatuses(checks) {
  let list = checks;
  if (typeof list === "string") { try { list = JSON.parse(list); } catch { list = null; } }
  const out = {};
  for (const check of Array.isArray(list) ? list : []) {
    if (!check || !AEO_COMPONENTS.includes(check.id)) continue;
    const status = String(check.status || "").toUpperCase();
    out[check.id] = CHECK_STATUSES.includes(status) ? status : "NA";
  }
  return out;
}

/**
 * A score_changed event after a diagnosis is stored, when the readiness score
 * or a component status moved (or for the site's first score). Reads the
 * previous row itself; never throws.
 */
export async function recordScoreChange(env, siteId, result, { scannedAt, scoreVersion = null, headline = null } = {}) {
  try {
    if (!env?.DB || !siteId || result?.score == null) return null;
    const previous = await env.DB.prepare("SELECT score,checks_json FROM aeo_scores WHERE site_id=? AND scanned_at<? AND score IS NOT NULL ORDER BY scanned_at DESC LIMIT 1")
      .bind(siteId, scannedAt).first();
    const now = componentStatuses(result.checks);
    const before = previous ? componentStatuses(previous.checks_json) : {};
    const changed = AEO_COMPONENTS.filter((id) => (now[id] || null) !== (before[id] || null) && (now[id] || before[id]));
    const readiness = Math.round(Number(result.score));
    if (previous && Number(previous.score) === readiness && !changed.length) return null;
    return recordServiceEvent(env, siteId, "score_changed", {
      readiness, ...(previous ? { readiness_from: Math.round(Number(previous.score)) } : { first: true }),
      components: now, changed, score_version: scoreVersion || undefined, headline: headline ?? undefined,
      model_version: result.modelVersion ? String(result.modelVersion).toLowerCase() : undefined,
    }, { at: scannedAt });
  } catch {
    return null;
  }
}

/** Per-engine discovery counts of one stored SoV run (aeo_sov_runs row or measurement). */
export function sovEngineCounts(detail = {}) {
  const out = {};
  for (const entry of Array.isArray(detail?.by_engine) ? detail.by_engine : []) {
    if (!entry || !ENGINE_IDS_FOR_LEARNING.includes(entry.engine)) continue;
    const n = Number(entry.answers || 0);
    if (!n) continue;
    const named = Number(entry.appearances || 0);
    const cited = Number(entry.citations || 0);
    out[entry.engine] = { n, named, cited, appeared: entry.appeared == null ? Math.max(named, cited) : Number(entry.appeared) };
  }
  return out;
}
