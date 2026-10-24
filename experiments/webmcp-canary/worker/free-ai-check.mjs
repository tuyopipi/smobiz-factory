/**
 * Free AI check: a small monthly "does AI mention you?" check for Free and
 * Standard sites.
 *
 * What it is: once a month, the first FREE_SOV_QUESTIONS (default 3)
 * non-branded discovery questions the Pro measurement would ask for this site
 * (same builder, so the site's type, language and city/category decide them)
 * are put to Perplexity once each. For every question it records whether the
 * answer named the business or cited its site, and which other businesses or
 * sites appeared. That is all: three answers are a glimpse, not a rate, so no
 * percentage is computed and the result carries the same variability notice as
 * the Pro report.
 *
 * What it is not: the Pro measurement. Pro sites never take this path, and
 * nothing here reads or writes Pro's counters (aeo_sov_usage, or the
 * "perplexity" rows of aeo_sov_engine_usage), so free usage can never use up
 * Pro budget.
 *
 * Cost control, all enforced before any engine call:
 *   - One check per site per calendar month (UTC), claimed atomically with the
 *     (site_id, month) primary key of aeo_free_checks (0045). Whether the
 *     scheduled run or the owner's "check now" comes first, it is the month's
 *     only check; the other finds it already claimed.
 *   - Calls and estimated USD are reserved in aeo_sov_engine_usage (0041)
 *     under their own engine bucket, FREE_USAGE_ENGINE, with the same atomic
 *     conditional UPDATE the Pro measurement uses (ai-engines.mjs
 *     reserveEngineUsage): a per-site cap (the question count, and
 *     FREE_SOV_SITE_MONTHLY_USD) and a global cap (FREE_SOV_MONTHLY_USD,
 *     default 20 USD). Unused reservation is refunded after the run.
 *   - Each call is reserved at its assumed maximum cost (assumedMaxCallCost),
 *     so the caps hold even when the provider reports nothing.
 *   - When a cap is reached nothing is called, and the screen says the month's
 *     free checks are used up and when the next one runs.
 *
 * Only connected sites whose owner has agreed to Nurevo contacting services on
 * their behalf are checked (siteConnection): a WordPress site once it has been
 * paired (pairing records the plugin's consent), a tag site once its tag is
 * seen, a hosted page always; tag and hosted sites must belong to a registered
 * owner.
 *
 * Before migration 0045 (or 0041) is applied the feature reports
 * "migration_pending" and never calls anything.
 *
 * Env:
 *   FREE_SOV_QUESTIONS          questions per monthly check (default 3, 1-5)
 *   FREE_SOV_MONTHLY_USD        global monthly USD cap for all free checks (default 20; 0 = off)
 *   FREE_SOV_SITE_MONTHLY_USD   per-site monthly USD cap (default 0.05; 0 = off)
 *   FREE_SOV_CRON_LIMIT         most sites checked per daily cron run (default 300)
 *   FREE_SOV_BATCH_TIME_BUDGET_MS / FREE_SOV_BATCH_HARD_STOP_MS  cron time budget
 */

import {
  GLOBAL_SCOPE, assumedMaxCallCost, engineConfigured, monthKey, readEngineUsage, recordEngineUsage, reserveEngineUsage,
} from "./ai-engines.mjs";
import { SovError, buildQuestionSet, mentionsBrand, measureSov, normalizeForMatch, normalizeHost } from "./aeo-sov.mjs";
import { resolveSitePlan } from "./billing-plan.mjs";

export const FREE_CHECK_ENGINE = "perplexity";
/** The ledger bucket in aeo_sov_engine_usage. Never "perplexity": that is Pro's. */
export const FREE_USAGE_ENGINE = "free:perplexity";
export const FREE_CHECK_PLANS = Object.freeze(["free", "standard"]);
export const FREE_SOV_QUESTIONS_DEFAULT = 3;
export const FREE_SOV_QUESTIONS_MAX = 5;
export const FREE_SOV_MONTHLY_USD_DEFAULT = 20;
export const FREE_SOV_SITE_MONTHLY_USD_DEFAULT = 0.05;
export const FREE_SOV_CRON_LIMIT_DEFAULT = 300;
export const FREE_CHECK_BATCH_TIME_BUDGET_MS = 10 * 60 * 1000;
export const FREE_CHECK_BATCH_HARD_STOP_MS = 13 * 60 * 1000;
/** One check is at most this many calls of ~20 s each; an on-demand run stops issuing calls after this. */
export const FREE_CHECK_RUN_DEADLINE_MS = 90 * 1000;
/** A "running" row older than this was cut off (the Worker stopped); it still counts as the month's check. */
export const FREE_CHECK_STALE_MS = 30 * 60 * 1000;
/** Most other businesses/sites kept per question, and overall. */
export const FREE_CHECK_TOP_PER_QUESTION = 3;
export const FREE_CHECK_TOP_OVERALL = 5;
export const FREE_CHECK_DETAILS_URL = "https://nurevo.jp/#pro-detail";

const MISSING_TABLE = /no such table|no such column/i;
const round6 = (value) => Math.round((Number(value) || 0) * 1e6) / 1e6;
const USD_EPSILON = 1e-6;

function numberFromEnv(raw, fallback, { min = 0, max = Infinity, integer = false } = {}) {
  if (raw === undefined || raw === null || String(raw).trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min) return fallback;
  const bounded = Math.min(max, value);
  return integer ? Math.floor(bounded) : round6(bounded);
}

/** The settings in force. `enabled` is false when either USD cap is 0. */
export function freeCheckConfig(env = {}) {
  const questions = numberFromEnv(env.FREE_SOV_QUESTIONS, FREE_SOV_QUESTIONS_DEFAULT, { min: 1, max: FREE_SOV_QUESTIONS_MAX, integer: true });
  const globalUsd = numberFromEnv(env.FREE_SOV_MONTHLY_USD, FREE_SOV_MONTHLY_USD_DEFAULT);
  const siteUsd = numberFromEnv(env.FREE_SOV_SITE_MONTHLY_USD, FREE_SOV_SITE_MONTHLY_USD_DEFAULT);
  const usdPerCall = assumedMaxCallCost(FREE_CHECK_ENGINE, env)?.est_usd || 0;
  return {
    questions,
    siteCalls: questions,
    globalUsd,
    siteUsd,
    usdPerCall,
    reserveUsd: round6(questions * usdPerCall),
    enabled: globalUsd > 0 && siteUsd > 0,
  };
}

/* ------------------------------------------------------------------ *
 * Calendar: one check a month, spread over the month
 * ------------------------------------------------------------------ */

/**
 * The day of the month (1-28) a site's scheduled check falls on, from a hash of
 * its id, so the sites spread evenly over the month instead of all running on
 * the 1st. Stable: the same site always gets the same day.
 */
export function freeCheckDueDay(siteId) {
  let hash = 0x811c9dc5;
  for (const char of String(siteId || "")) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return 1 + (hash % 28);
}

export function nextMonthKey(month) {
  const [year, mon] = String(month).split("-").map(Number);
  return mon >= 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, "0")}`;
}

/** The site's scheduled date in a month, YYYY-MM-DD (UTC). */
export function freeCheckDueDate(siteId, month) {
  return `${month}-${String(freeCheckDueDay(siteId)).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ *
 * Who may be checked
 * ------------------------------------------------------------------ */

/**
 * Whether a site is connected and its owner has agreed to Nurevo contacting
 * outside services for it. The existing rules, nothing new:
 *   wp      paired or bound (the plugin records consent when it pairs)
 *   tag     the tag has been seen on the site
 *   hosted  the page is served by Nurevo
 * A tag or hosted site must also belong to a registered owner (who accepted the
 * terms when registering). A stopped site is never checked.
 */
export function siteConnection(site = {}) {
  if (!site || !site.id) return { connected: false, consent: false, reason: "unknown_site" };
  if (site.delivery_status && site.delivery_status !== "active") return { connected: false, consent: false, reason: "stopped" };
  const type = String(site.install_type || (site.url ? "tag" : "hosted"));
  if (type === "wp") {
    const paired = !!(site.bound_at || site.pairing_code_used_at);
    return { connected: paired, consent: paired, reason: paired ? null : "not_paired", via: paired ? "pairing" : null };
  }
  const owner = !!site.owner_member_id;
  if (type === "hosted") return { connected: true, consent: owner, reason: owner ? null : "no_owner", via: owner ? "owner" : null };
  const seen = Number(site.tag_detected) === 1 || ["detected", "active"].includes(String(site.status || ""));
  if (!seen) return { connected: false, consent: owner, reason: "tag_not_seen" };
  return { connected: true, consent: owner, reason: owner ? null : "no_owner", via: owner ? "owner" : null };
}

/* ------------------------------------------------------------------ *
 * Storage (0045)
 * ------------------------------------------------------------------ */

function parseJson(value, fallback = null) {
  try { const parsed = JSON.parse(value); return parsed ?? fallback; } catch { return fallback; }
}

/** This site's rows, newest month first. Throws "no such table" before 0045. */
export async function readFreeChecks(env, siteId, limit = 3) {
  const { results } = await env.DB.prepare(
    "SELECT site_id,month,trigger,status,started_at,finished_at,result_json,est_cost_usd FROM aeo_free_checks WHERE site_id=? ORDER BY month DESC LIMIT ?",
  ).bind(siteId, limit).all();
  return results || [];
}

/**
 * Claim this month's check for a site. Atomic: the (site_id, month) primary key
 * lets exactly one caller in; a row left at cap_reached may be claimed again
 * (nothing was called, and the cap may have been raised). Returns true when the
 * caller holds the claim.
 */
async function claimMonth(env, siteId, month, trigger, at) {
  const result = await env.DB.prepare(`INSERT INTO aeo_free_checks (site_id,month,trigger,status,started_at,finished_at,reserved_json,result_json,est_cost_usd)
    VALUES (?,?,?,'running',?,NULL,NULL,NULL,NULL)
    ON CONFLICT(site_id,month) DO UPDATE SET trigger=excluded.trigger,status='running',started_at=excluded.started_at,
      finished_at=NULL,reserved_json=NULL,result_json=NULL,est_cost_usd=NULL
    WHERE aeo_free_checks.status='cap_reached'`).bind(siteId, month, trigger, at).run();
  return Number(result?.meta?.changes ?? result?.changes ?? 0) > 0;
}

async function updateMonth(env, siteId, month, fields) {
  const keys = Object.keys(fields);
  await env.DB.prepare(`UPDATE aeo_free_checks SET ${keys.map((key) => `${key}=?`).join(",")} WHERE site_id=? AND month=?`)
    .bind(...keys.map((key) => fields[key]), siteId, month).run();
}

/* ------------------------------------------------------------------ *
 * Budget
 * ------------------------------------------------------------------ */

/**
 * Whether one more check fits this month, from the ledger alone (a read).
 * { ok, scope: null | "global" | "site", global, site } or throws before 0041.
 */
export async function freeCheckBudget(env, siteId, now = Date.now()) {
  const config = freeCheckConfig(env);
  const global = await readEngineUsage(env, GLOBAL_SCOPE, FREE_USAGE_ENGINE, now);
  const site = await readEngineUsage(env, siteId, FREE_USAGE_ENGINE, now);
  let scope = null;
  if (global.est_cost_usd + config.reserveUsd > config.globalUsd + USD_EPSILON) scope = "global";
  else if (site.calls + config.siteCalls > config.siteCalls || site.est_cost_usd + config.reserveUsd > config.siteUsd + USD_EPSILON) scope = "site";
  return { ok: scope === null, scope, global, site };
}

/* ------------------------------------------------------------------ *
 * Result
 * ------------------------------------------------------------------ */

/**
 * What one check found, kept small: per question whether the business was
 * named or its site cited and up to three other businesses or sites in the
 * answer; overall, the few that appeared most. No rate: three answers are not
 * a sample that supports one.
 */
export function summarizeFreeCheck(measurement = {}, profile = {}) {
  const aliases = [...(profile.aliases || [profile.name]), profile.domain_alias].filter(Boolean);
  const ownHost = normalizeHost(profile.host || "");
  const ownNames = aliases.map(normalizeForMatch).filter((alias) => alias.length >= 2);
  const isOwn = (label) => {
    const normalized = normalizeForMatch(label);
    return mentionsBrand(label, aliases) || ownNames.some((alias) => normalized === alias || normalized.includes(alias));
  };
  const tally = new Map();
  const samples = (measurement.samples || []).filter((sample) => sample.kind !== "branded");
  const questions = samples.map((sample) => {
    const others = [];
    const push = (label, kind) => {
      const text = String(label || "").trim();
      if (!text || others.some((entry) => entry.label.toLowerCase() === text.toLowerCase())) return;
      if (kind === "name" && isOwn(text)) return;
      if (kind === "domain" && ownHost && (text === ownHost || text.endsWith(`.${ownHost}`))) return;
      others.push({ label: text.slice(0, 80), kind });
    };
    if (sample.ok) {
      for (const name of Array.isArray(sample.business_mentions) ? sample.business_mentions : []) push(name, "name");
      for (const host of Array.isArray(sample.competitorHosts) ? sample.competitorHosts : []) push(host, "domain");
    }
    for (const entry of others) {
      const key = `${entry.kind}:${entry.label.toLowerCase()}`;
      const row = tally.get(key) || { ...entry, count: 0 };
      row.count += 1;
      tally.set(key, row);
    }
    return {
      question: String(sample.question || "").slice(0, 300),
      answered: !!sample.ok,
      named: !!(sample.ok && sample.mentioned),
      cited: !!(sample.ok && sample.cited),
      others: others.slice(0, FREE_CHECK_TOP_PER_QUESTION),
      error: sample.ok ? null : String(sample.error || "engine_request_failed").slice(0, 60),
    };
  });
  const competitors = [...tally.values()]
    .sort((a, b) => b.count - a.count || (a.kind === b.kind ? 0 : a.kind === "name" ? -1 : 1) || a.label.localeCompare(b.label))
    .slice(0, FREE_CHECK_TOP_OVERALL);
  const answered = questions.filter((row) => row.answered).length;
  const appeared = questions.filter((row) => row.named || row.cited).length;
  const estUsd = round6(samples.reduce((sum, sample) => sum + (Number.isFinite(sample.cost?.est_usd) ? sample.cost.est_usd : 0), 0));
  return {
    engine: FREE_CHECK_ENGINE,
    language: profile.language || null,
    asked: questions.length,
    answered,
    appeared,
    questions,
    competitors,
    est_cost_usd: estUsd,
  };
}

/* ------------------------------------------------------------------ *
 * Run one check
 * ------------------------------------------------------------------ */

/**
 * Run this month's free check for one site, or say why not. Never calls an
 * engine unless every gate passes and the month is claimed and the budget
 * reserved. Returns { status, ... } where status is one of
 *   done | failed                  the check ran (failed: no answer came back)
 *   already_checked | running      this month's check exists
 *   used_up                        a monthly cap is reached (`scope`)
 *   pro | disabled | not_configured | migration_pending | not_connected |
 *   consent_required | brand_unavailable
 *
 * `loadProfile(env, site)` builds the brand profile (api.mjs passes the same
 * builder the Pro measurement uses). `plan` may be passed when already known.
 */
export async function runFreeCheck(env, site, {
  trigger = "manual", plan = null, loadProfile, now = Date.now(), clock = Date.now, deadline = null,
  fetchImpl = fetch, engineAdapters, resolvePlan = null,
} = {}) {
  const config = freeCheckConfig(env);
  const month = monthKey(now);
  const sitePlan = plan || (resolvePlan ? await resolvePlan(env, site) : resolveSitePlan(site, { manual_plan: site?.org_manual_plan }));
  if (!FREE_CHECK_PLANS.includes(sitePlan)) return { status: sitePlan === "pro" ? "pro" : "not_eligible", plan: sitePlan };
  if (!config.enabled) return { status: "disabled" };
  if (!engineConfigured(env, FREE_CHECK_ENGINE)) return { status: "not_configured" };
  const connection = siteConnection(site);
  if (!connection.connected) return { status: "not_connected", reason: connection.reason };
  if (!connection.consent) return { status: "consent_required", reason: connection.reason };

  let existing;
  try {
    existing = (await readFreeChecks(env, site.id, 1)).find((row) => row.month === month) || null;
    await freeCheckBudget(env, site.id, now);
  } catch (error) {
    if (MISSING_TABLE.test(String(error?.message || error))) return { status: "migration_pending" };
    throw error;
  }
  if (existing && existing.status !== "cap_reached") {
    return { status: existing.status === "running" ? "running" : "already_checked", month };
  }
  const budget = await freeCheckBudget(env, site.id, now);
  if (!budget.ok) {
    if (existing) await updateMonth(env, site.id, month, { result_json: JSON.stringify({ scope: budget.scope }) });
    return { status: "used_up", scope: budget.scope, month };
  }

  let profile;
  try {
    profile = await loadProfile(env, site);
  } catch (error) {
    if (error instanceof SovError) return { status: "brand_unavailable", error: error.code };
    throw error;
  }
  const questions = buildQuestionSet(profile, config.questions).slice(0, config.questions);

  const startedAt = new Date(now).toISOString();
  if (!await claimMonth(env, site.id, month, trigger, startedAt)) {
    const row = (await readFreeChecks(env, site.id, 1)).find((entry) => entry.month === month);
    return { status: row?.status === "running" ? "running" : "already_checked", month };
  }
  const reserveUsd = round6(questions.length * config.usdPerCall);
  const reservation = await reserveEngineUsage(env, site.id, FREE_USAGE_ENGINE, {
    calls: questions.length,
    estCostUsd: reserveUsd,
    caps: { siteCalls: config.siteCalls, globalCalls: null, siteUsd: config.siteUsd, globalUsd: config.globalUsd },
  }, now);
  if (!reservation.ok) {
    await updateMonth(env, site.id, month, { status: "cap_reached", result_json: JSON.stringify({ scope: reservation.scope }) });
    return { status: "used_up", scope: reservation.scope, month };
  }
  await updateMonth(env, site.id, month, { reserved_json: JSON.stringify({ calls: questions.length, usd: reserveUsd }) });

  let measurement = null;
  try {
    const own = clock() + FREE_CHECK_RUN_DEADLINE_MS;
    measurement = await measureSov(env, profile, {
      questions,
      budget: questions.length,
      engineBudgets: { [FREE_CHECK_ENGINE]: questions.length },
      engineIds: [FREE_CHECK_ENGINE],
      repetitions: 1,
      fetchImpl,
      ...(engineAdapters ? { engineAdapters } : {}),
      deadline: Number.isFinite(deadline) ? Math.min(deadline, own) : own,
      clock,
    });
  } catch (error) {
    // The reservation stays charged: calls may have been billed.
    await updateMonth(env, site.id, month, { status: "failed", finished_at: new Date(clock()).toISOString(),
      result_json: JSON.stringify({ error: String(error?.message || error).slice(0, 120) }) });
    throw error;
  }
  const used = Number(measurement.engine_calls?.[FREE_CHECK_ENGINE] || 0);
  const result = summarizeFreeCheck(measurement, profile);
  const searches = (measurement.samples || []).reduce((sum, sample) => sum + (Number.isFinite(sample.cost?.searches) ? sample.cost.searches : 0), 0);
  // True up: calls and USD not used are given back to both caps.
  await recordEngineUsage(env, site.id, FREE_USAGE_ENGINE, { calls: used - questions.length, estCostUsd: result.est_cost_usd - reserveUsd, searches }, now);
  const status = result.answered > 0 ? "done" : "failed";
  await updateMonth(env, site.id, month, {
    status, finished_at: new Date(clock()).toISOString(), result_json: JSON.stringify(result), est_cost_usd: result.est_cost_usd,
  });
  console.log("free-ai-check", JSON.stringify({ site_id: site.id, trigger, status, calls: used, est_usd: result.est_cost_usd, appeared: result.appeared, asked: result.asked }));
  return { status, month, result };
}

/* ------------------------------------------------------------------ *
 * What the dashboard and plugin show (a read; never calls an engine)
 * ------------------------------------------------------------------ */

export async function freeCheckView(env, site, { plan = null, now = Date.now() } = {}) {
  const config = freeCheckConfig(env);
  const month = monthKey(now);
  const sitePlan = plan || resolveSitePlan(site, { manual_plan: site?.org_manual_plan });
  const base = {
    plan: sitePlan,
    month,
    engine: FREE_CHECK_ENGINE,
    engine_label: "Perplexity",
    questions_per_check: config.questions,
    can_run_now: false,
    scheduled_on: null,
    next_check_on: null,
    result: null,
    upsell: { plan: "pro", details_url: FREE_CHECK_DETAILS_URL },
  };
  if (!FREE_CHECK_PLANS.includes(sitePlan)) return { ...base, status: sitePlan === "pro" ? "pro" : "not_eligible" };
  if (!config.enabled) return { ...base, status: "disabled" };
  if (!engineConfigured(env, FREE_CHECK_ENGINE)) return { ...base, status: "not_configured" };
  const connection = siteConnection(site);
  if (!connection.connected) return { ...base, status: "not_connected", reason: connection.reason };
  if (!connection.consent) return { ...base, status: "consent_required", reason: connection.reason };

  let rows;
  let budget;
  try {
    rows = await readFreeChecks(env, site.id, 3);
    budget = await freeCheckBudget(env, site.id, now);
  } catch (error) {
    if (MISSING_TABLE.test(String(error?.message || error))) return { ...base, status: "migration_pending" };
    throw error;
  }
  const nextCheckOn = freeCheckDueDate(site.id, nextMonthKey(month));
  const latest = rows.find((row) => ["done", "failed"].includes(row.status) && row.result_json);
  const latestResult = latest ? publicResult(latest) : null;
  const current = rows.find((row) => row.month === month) || null;
  if (current && ["done", "failed"].includes(current.status)) {
    return { ...base, status: current.status, result: publicResult(current), next_check_on: nextCheckOn };
  }
  if (current && current.status === "running") {
    const stale = now - Date.parse(current.started_at) > FREE_CHECK_STALE_MS;
    return { ...base, status: stale ? "failed" : "running", result: latestResult, next_check_on: stale ? nextCheckOn : null };
  }
  if (!budget.ok) return { ...base, status: "used_up", scope: budget.scope, result: latestResult, next_check_on: nextCheckOn };
  const today = new Date(now).toISOString().slice(0, 10);
  const due = freeCheckDueDate(site.id, month);
  return { ...base, status: "scheduled", result: latestResult, scheduled_on: due > today ? due : today, can_run_now: true };
}

function publicResult(row) {
  const result = parseJson(row.result_json, {}) || {};
  return {
    month: row.month,
    checked_at: row.finished_at || row.started_at || null,
    trigger: row.trigger,
    status: row.status,
    asked: Number(result.asked || 0),
    answered: Number(result.answered || 0),
    appeared: Number(result.appeared || 0),
    questions: Array.isArray(result.questions) ? result.questions : [],
    competitors: Array.isArray(result.competitors) ? result.competitors : [],
    language: result.language || null,
  };
}

/* ------------------------------------------------------------------ *
 * Scheduled batch (its own daily cron)
 * ------------------------------------------------------------------ */

/**
 * Check the Free and Standard sites due today. A site is due from its
 * freeCheckDueDay until it has this month's check, so a site connected late in
 * the month is checked the next day. Stops when the global cap is reached, and
 * keeps to a time budget like the Pro batch.
 */
export async function runFreeCheckBatch(env, { loadProfile, now = Date.now(), clock = Date.now, fetchImpl = fetch, engineAdapters, limit } = {}) {
  if (!env?.DB) throw new Error("DB binding is required for the free AI check batch");
  const config = freeCheckConfig(env);
  const summary = { ok: true, status: "checked", candidates: 0, due: 0, checked: 0, failed: 0, skipped: 0, used_up: false, deferred: 0, errors: [] };
  if (!config.enabled) return { ...summary, status: "disabled" };
  if (!engineConfigured(env, FREE_CHECK_ENGINE)) return { ...summary, status: "not_configured" };
  const month = monthKey(now);
  try {
    const global = await readEngineUsage(env, GLOBAL_SCOPE, FREE_USAGE_ENGINE, now);
    if (global.est_cost_usd + config.reserveUsd > config.globalUsd + USD_EPSILON) return { ...summary, status: "used_up", used_up: true };
  } catch (error) {
    if (MISSING_TABLE.test(String(error?.message || error))) return { ...summary, status: "migration_pending" };
    throw error;
  }
  let rows;
  try {
    ({ results: rows } = await env.DB.prepare(`
      SELECT s.*, o.manual_plan AS org_manual_plan FROM sites s
        LEFT JOIN orgs o ON o.id = s.org_id
       WHERE (s.delivery_status IS NULL OR s.delivery_status='active')
         AND (s.bound_at IS NOT NULL OR s.pairing_code_used_at IS NOT NULL OR s.install_type IN ('tag','hosted'))
         AND NOT EXISTS (SELECT 1 FROM aeo_free_checks f WHERE f.site_id=s.id AND f.month=? AND f.status<>'cap_reached')
       ORDER BY s.created_at LIMIT 5000`).bind(month).all());
  } catch (error) {
    if (MISSING_TABLE.test(String(error?.message || error))) return { ...summary, status: "migration_pending" };
    throw error;
  }
  const day = new Date(now).getUTCDate();
  const bounded = Math.max(1, Math.min(1000, Math.floor(Number(limit || env.FREE_SOV_CRON_LIMIT || FREE_SOV_CRON_LIMIT_DEFAULT))));
  const eligible = (rows || []).filter((site) => {
    if (!FREE_CHECK_PLANS.includes(resolveSitePlan(site, { manual_plan: site.org_manual_plan }))) return false;
    const connection = siteConnection(site);
    return connection.connected && connection.consent;
  });
  summary.candidates = eligible.length;
  const due = eligible.filter((site) => freeCheckDueDay(site.id) <= day).slice(0, bounded);
  summary.due = due.length;
  const startedAt = clock();
  const soft = numberFromEnv(env.FREE_SOV_BATCH_TIME_BUDGET_MS, FREE_CHECK_BATCH_TIME_BUDGET_MS);
  const hard = Math.max(soft, numberFromEnv(env.FREE_SOV_BATCH_HARD_STOP_MS, FREE_CHECK_BATCH_HARD_STOP_MS));
  for (const [index, site] of due.entries()) {
    if (clock() - startedAt >= soft) { summary.deferred = due.length - index; break; }
    try {
      const outcome = await runFreeCheck(env, site, {
        trigger: "scheduled", loadProfile, now, clock, deadline: startedAt + hard, fetchImpl, engineAdapters,
        plan: resolveSitePlan(site, { manual_plan: site.org_manual_plan }),
      });
      if (outcome.status === "done") summary.checked += 1;
      else if (outcome.status === "failed") summary.failed += 1;
      else if (outcome.status === "used_up" && outcome.scope === "global") { summary.used_up = true; summary.deferred = due.length - index - 1; break; }
      else summary.skipped += 1;
    } catch (error) {
      summary.skipped += 1;
      summary.errors.push({ site_id: site.id, error: String(error?.message || error).slice(0, 120) });
    }
  }
  try {
    const global = await readEngineUsage(env, GLOBAL_SCOPE, FREE_USAGE_ENGINE, now);
    summary.month_usd = Math.round(global.est_cost_usd * 1e4) / 1e4;
    summary.month_calls = global.calls;
  } catch { /* logged figures only */ }
  summary.errors = summary.errors.slice(0, 20);
  summary.elapsed_ms = clock() - startedAt;
  return summary;
}
