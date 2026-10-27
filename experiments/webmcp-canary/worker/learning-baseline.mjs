/**
 * The pre-install baseline (migration 0049, docs/learning.md).
 *
 * When a WordPress site is added in the dashboard - dashboard-first
 * onboarding, before the plugin is paired - one baseline is scheduled. The
 * hourly job then takes, once per site ever:
 *
 *   1. an AI appearance check exactly like the free monthly check
 *      (free-ai-check.mjs): the first FREE_SOV_QUESTIONS (default 3)
 *      non-branded discovery questions for the site, put to Perplexity once
 *      each, with the same question builder, summary and engine adapter;
 *   2. the public readiness score of the site's URL at that moment (the same
 *      scorer as /api/aeo/score), components included.
 *
 * That is the "before" point the learning dataset needs: without it, the
 * first measurement of most sites is taken after the plugin is already
 * publishing.
 *
 * Who: only a site whose owner account passed the existing anti-abuse rules -
 * an active (approved) member, within the daily site-creation limit (enforced
 * when the site was created), and within the account's monthly free-check
 * allowance (FREE_SOV_SITES_PER_ACCOUNT, the "free:sites" ledger row): the
 * baseline takes one of those slots. A site on Pro is not baselined (it is
 * measured by its plan). A site older than BASELINE_MAX_AGE_DAYS when the job
 * reaches it is skipped: it is no longer "before".
 *
 * Cost: it counts against the free budget. The calls and estimated USD are
 * reserved on the global free row (scope "*", engine "free:perplexity") under
 * FREE_SOV_MONTHLY_USD with the same atomic conditional UPDATE, so baselines
 * and free checks share one monthly cap and can never spend Pro budget. They
 * are ALSO recorded under their own ledger reason, engine "free:baseline"
 * (site row and global row), so baseline spend can be read separately; the
 * site's own "free:perplexity" row is not touched, so a baseline does not use
 * up the site's first monthly free check. When any cap is reached nothing is
 * called and the baseline is recorded as skipped (used_up:<scope>); it is not
 * retried later, because a late baseline is not a baseline.
 *
 * The readiness score is taken whenever the site is eligible, even when the
 * AI part was skipped for budget: it costs one fetch of the site's own page.
 */
import {
  GLOBAL_SCOPE, engineConfigured, monthKey, readEngineUsage, recordEngineUsage,
} from "./ai-engines.mjs";
import { SovError, buildQuestionSet, measureSov } from "./aeo-sov.mjs";
import { resolveSitePlan } from "./billing-plan.mjs";
import {
  FREE_CHECK_ENGINE, FREE_CHECK_PLANS, FREE_USAGE_ENGINE, freeCheckAccountBudget, freeCheckConfig,
  releaseAccountSlot, reserveAccountSlot, summarizeFreeCheck,
} from "./free-ai-check.mjs";
import { componentStatuses, recordServiceEvent } from "./learning-events.mjs";

/** The separate ledger reason for baseline spend (aeo_sov_engine_usage.engine). */
export const BASELINE_USAGE_ENGINE = "free:baseline";
/** A site older than this when the job reaches it is not baselined. */
export const BASELINE_MAX_AGE_DAYS = 7;
/** Most baselines run per hourly job. */
export const BASELINE_BATCH_LIMIT = 25;
export const BASELINE_RUN_DEADLINE_MS = 90 * 1000;
const MISSING = /no such table|no such column/i;
const USD_EPSILON = 1e-6;
const round6 = (value) => Math.round((Number(value) || 0) * 1e6) / 1e6;

/**
 * Schedule the baseline for a site just added in the dashboard. Only WordPress
 * sites (the plugin is the "treatment"); idempotent; never throws.
 */
export async function scheduleBaseline(env, site, { now = Date.now() } = {}) {
  try {
    if (!env?.DB || !site?.id) return { scheduled: false, reason: "no_db" };
    if (String(site.install_type || "") !== "wp") return { scheduled: false, reason: "not_wordpress" };
    const result = await env.DB.prepare(`INSERT INTO learning_baselines (site_id,status,scheduled_at) VALUES (?,?,?)
      ON CONFLICT(site_id) DO NOTHING`).bind(site.id, "scheduled", new Date(now).toISOString()).run();
    return { scheduled: Number(result?.meta?.changes ?? result?.changes ?? 0) > 0 };
  } catch (error) {
    if (!MISSING.test(String(error?.message || error))) console.warn("baseline_schedule_error", String(error?.message || error).slice(0, 120));
    return { scheduled: false, reason: "error" };
  }
}

async function finish(env, siteId, fields) {
  const keys = Object.keys(fields);
  await env.DB.prepare(`UPDATE learning_baselines SET ${keys.map((key) => `${key}=?`).join(",")} WHERE site_id=?`)
    .bind(...keys.map((key) => fields[key]), siteId).run();
}

/**
 * Reserve on the global free row only (scope "*", engine free:perplexity), so
 * baselines count against FREE_SOV_MONTHLY_USD. Atomic, like reserveEngineUsage.
 */
async function reserveGlobalFree(env, { calls, usd, capUsd }, now) {
  const month = monthKey(now);
  const at = new Date(now).toISOString();
  await env.DB.prepare(`INSERT INTO aeo_sov_engine_usage (scope,engine,month,calls,searches,est_cost_usd,updated_at)
    VALUES (?,?,?,0,0,0,?) ON CONFLICT(scope,engine,month) DO NOTHING`).bind(GLOBAL_SCOPE, FREE_USAGE_ENGINE, month, at).run();
  const result = await env.DB.prepare(`UPDATE aeo_sov_engine_usage SET calls=calls+?, est_cost_usd=est_cost_usd+?, updated_at=?
    WHERE scope=? AND engine=? AND month=? AND est_cost_usd+?<=?`)
    .bind(calls, usd, at, GLOBAL_SCOPE, FREE_USAGE_ENGINE, month, usd, capUsd + USD_EPSILON).run();
  return Number(result?.meta?.changes ?? result?.changes ?? 0) > 0;
}

async function adjustGlobalFree(env, { calls = 0, usd = 0, searches = 0 }, now) {
  if (!calls && !usd && !searches) return;
  await env.DB.prepare(`UPDATE aeo_sov_engine_usage SET calls=MAX(0,calls+?), searches=searches+?, est_cost_usd=MAX(0,est_cost_usd+?), updated_at=?
    WHERE scope=? AND engine=? AND month=?`).bind(Math.trunc(calls), Math.trunc(searches), round6(usd), new Date(now).toISOString(), GLOBAL_SCOPE, FREE_USAGE_ENGINE, monthKey(now)).run();
}

/** Whether the owner account passes the existing anti-abuse rules: an active member who owns the site. */
async function ownerActive(env, site) {
  if (!site.owner_member_id) return false;
  const member = await env.DB.prepare("SELECT status FROM members WHERE id=? LIMIT 1").bind(site.owner_member_id).first();
  return member?.status === "active";
}

/**
 * Run one scheduled baseline. Returns { status, reason?, ... }; the row ends
 * done | failed | skipped. `diagnose(env, site)` returns the public scorer's
 * result for the site's URL ({ score, checks, modelVersion }); `loadProfile`
 * is the free check's brand profile builder.
 */
export async function runBaseline(env, siteId, {
  loadProfile, diagnose = null, now = Date.now(), clock = Date.now, fetchImpl = fetch, engineAdapters, deadline = null,
} = {}) {
  let row;
  try {
    row = await env.DB.prepare("SELECT * FROM learning_baselines WHERE site_id=? LIMIT 1").bind(siteId).first();
  } catch (error) {
    if (MISSING.test(String(error?.message || error))) return { status: "migration_pending" };
    throw error;
  }
  if (!row) return { status: "not_scheduled" };
  if (row.status !== "scheduled") return { status: row.status, already: true };
  const startedAt = new Date(now).toISOString();
  // Claim it: exactly one runner moves it out of "scheduled".
  const claim = await env.DB.prepare("UPDATE learning_baselines SET status='running', started_at=? WHERE site_id=? AND status='scheduled'").bind(startedAt, siteId).run();
  if (!(Number(claim?.meta?.changes ?? claim?.changes ?? 0) > 0)) return { status: "running", already: true };

  const skip = async (reason, extra = {}) => {
    await finish(env, siteId, { status: "skipped", reason, measured_at: new Date(clock()).toISOString(), ...extra });
    await recordServiceEvent(env, siteId, "baseline_measured", { status: "skipped", reason: reason.replace(/[^a-z0-9_.-]/g, "_") }, { eventId: `svc:baseline:${siteId}` });
    return { status: "skipped", reason };
  };

  const site = await env.DB.prepare("SELECT s.*, o.manual_plan AS org_manual_plan FROM sites s LEFT JOIN orgs o ON o.id=s.org_id WHERE s.id=? LIMIT 1").bind(siteId).first();
  if (!site) { await finish(env, siteId, { status: "skipped", reason: "deleted" }); return { status: "skipped", reason: "deleted" }; }
  if (site.delivery_status && site.delivery_status !== "active") return skip("stopped");
  if (String(site.install_type || "") !== "wp") return skip("not_wordpress");
  const created = Number(site.created_at);
  if (Number.isFinite(created) && created > 0 && now - created > BASELINE_MAX_AGE_DAYS * 86400e3) return skip("too_late");
  if (!await ownerActive(env, site)) return skip("owner_not_active");
  const plan = resolveSitePlan(site, { manual_plan: site.org_manual_plan });
  if (!FREE_CHECK_PLANS.includes(plan)) return skip("not_eligible");
  const connectedBefore = !!(site.bound_at || site.pairing_code_used_at);

  // 2. The readiness score at this moment (cheap; taken even when the AI part is skipped).
  let readiness = null;
  let readinessComponents = {};
  let modelVersion = null;
  if (typeof diagnose === "function") {
    try {
      const result = await diagnose(env, site);
      if (result && result.score != null) {
        readiness = Math.round(Number(result.score));
        readinessComponents = componentStatuses(result.checks);
        modelVersion = result.modelVersion || null;
      }
    } catch { readiness = null; }
  }
  const readinessFields = {
    connected_before: connectedBefore ? 1 : 0,
    readiness_score: readiness,
    readiness_json: JSON.stringify({ components: readinessComponents, model_version: modelVersion }),
  };
  const skipAi = async (reason) => {
    await finish(env, siteId, { status: "skipped", reason, measured_at: new Date(clock()).toISOString(), ...readinessFields });
    await recordServiceEvent(env, siteId, "baseline_measured", {
      status: "skipped", reason: reason.replace(/[^a-z0-9_.-]/g, "_"), readiness: readiness ?? undefined, components: readinessComponents, connected_before: connectedBefore,
    }, { eventId: `svc:baseline:${siteId}` });
    return { status: "skipped", reason, readiness };
  };

  // 1. The AI appearance check, inside the free budget.
  const config = freeCheckConfig(env);
  if (!config.enabled) return skipAi("disabled");
  if (!engineConfigured(env, FREE_CHECK_ENGINE)) return skipAi("not_configured");
  let account;
  try {
    const global = await readEngineUsage(env, GLOBAL_SCOPE, FREE_USAGE_ENGINE, now);
    if (global.est_cost_usd + config.reserveUsd > config.globalUsd + USD_EPSILON) return skipAi("used_up:global");
    account = await freeCheckAccountBudget(env, site, plan, now);
  } catch (error) {
    if (MISSING.test(String(error?.message || error))) return skipAi("migration_pending");
    throw error;
  }
  if (!account.ok) return skipAi("used_up:account");

  let profile;
  try {
    profile = await loadProfile(env, site);
  } catch (error) {
    if (error instanceof SovError) return skipAi("brand_unavailable");
    throw error;
  }
  const questions = buildQuestionSet(profile, config.questions).slice(0, config.questions);
  if (!questions.length) return skipAi("no_questions");

  if (account.applies && !await reserveAccountSlot(env, account.scope, account.cap, now)) return skipAi("used_up:account");
  const reserveUsd = round6(questions.length * config.usdPerCall);
  if (!await reserveGlobalFree(env, { calls: questions.length, usd: reserveUsd, capUsd: config.globalUsd }, now)) {
    if (account.applies) await releaseAccountSlot(env, account.scope, now);
    return skipAi("used_up:global");
  }
  // The separate ledger reason: what baselines spent, by site and in total.
  await recordEngineUsage(env, siteId, BASELINE_USAGE_ENGINE, { calls: questions.length, estCostUsd: reserveUsd }, now);

  let measurement;
  try {
    const own = clock() + BASELINE_RUN_DEADLINE_MS;
    measurement = await measureSov(env, profile, {
      questions, budget: questions.length, engineBudgets: { [FREE_CHECK_ENGINE]: questions.length }, engineIds: [FREE_CHECK_ENGINE],
      repetitions: 1, fetchImpl, ...(engineAdapters ? { engineAdapters } : {}),
      deadline: Number.isFinite(deadline) ? Math.min(deadline, own) : own, clock,
    });
  } catch (error) {
    // The reservation stays charged: calls may have been billed.
    await finish(env, siteId, { status: "failed", reason: "engine_error", measured_at: new Date(clock()).toISOString(), ...readinessFields });
    throw error;
  }
  const used = Number(measurement.engine_calls?.[FREE_CHECK_ENGINE] || 0);
  const summary = summarizeFreeCheck(measurement, profile);
  const searches = (measurement.samples || []).reduce((sum, sample) => sum + (Number.isFinite(sample.cost?.searches) ? sample.cost.searches : 0), 0);
  // True up both ledgers: what was not used goes back.
  const delta = { calls: used - questions.length, usd: summary.est_cost_usd - reserveUsd, searches };
  await adjustGlobalFree(env, delta, now);
  await recordEngineUsage(env, siteId, BASELINE_USAGE_ENGINE, { calls: delta.calls, estCostUsd: delta.usd, searches }, now);
  if (account.applies && used === 0) await releaseAccountSlot(env, account.scope, now);

  const answered = summary.questions.filter((q) => q.answered);
  const result = {
    engine: FREE_CHECK_ENGINE,
    asked: summary.asked,
    answered: summary.answered,
    appeared: summary.appeared,
    named: answered.filter((q) => q.named).length,
    cited: answered.filter((q) => q.cited).length,
    language: summary.language,
  };
  const status = result.answered > 0 ? "done" : "failed";
  await finish(env, siteId, {
    status, reason: null, measured_at: new Date(clock()).toISOString(), result_json: JSON.stringify(result), est_cost_usd: summary.est_cost_usd, ...readinessFields,
  });
  await recordServiceEvent(env, siteId, "baseline_measured", {
    status, engine: FREE_CHECK_ENGINE, n: result.answered, named: result.named, cited: result.cited, appeared: result.appeared,
    readiness: readiness ?? undefined, components: readinessComponents, connected_before: connectedBefore,
  }, { eventId: `svc:baseline:${siteId}` });
  console.log("learning-baseline", JSON.stringify({ site_id: siteId, status, calls: used, est_usd: summary.est_cost_usd, appeared: result.appeared, readiness }));
  return { status, result, readiness, calls: used, est_cost_usd: summary.est_cost_usd };
}

/**
 * The hourly job: run the baselines scheduled in the last
 * BASELINE_MAX_AGE_DAYS days, oldest first, a bounded number per run. Older
 * scheduled rows are closed as too_late.
 */
export async function runBaselineBatch(env, { loadProfile, diagnose = null, now = Date.now(), clock = Date.now, fetchImpl = fetch, engineAdapters, limit = BASELINE_BATCH_LIMIT } = {}) {
  if (!env?.DB) throw new Error("DB binding is required for the baseline batch");
  const summary = { ok: true, status: "ran", due: 0, done: 0, failed: 0, skipped: 0, errors: [] };
  const horizon = new Date(now - BASELINE_MAX_AGE_DAYS * 86400e3).toISOString();
  let rows;
  try {
    await env.DB.prepare("UPDATE learning_baselines SET status='skipped', reason='too_late' WHERE status='scheduled' AND scheduled_at<?").bind(horizon).run();
    ({ results: rows } = await env.DB.prepare("SELECT site_id FROM learning_baselines WHERE status='scheduled' ORDER BY scheduled_at LIMIT ?")
      .bind(Math.max(1, Math.min(200, Math.floor(Number(limit) || BASELINE_BATCH_LIMIT)))).all());
  } catch (error) {
    if (MISSING.test(String(error?.message || error))) return { ...summary, status: "migration_pending" };
    throw error;
  }
  summary.due = (rows || []).length;
  for (const row of rows || []) {
    try {
      const outcome = await runBaseline(env, row.site_id, { loadProfile, diagnose, now, clock, fetchImpl, engineAdapters });
      if (outcome.status === "done") summary.done += 1;
      else if (outcome.status === "failed") summary.failed += 1;
      else summary.skipped += 1;
    } catch (error) {
      summary.failed += 1;
      summary.errors.push({ site_id: row.site_id, error: String(error?.message || error).slice(0, 120) });
    }
  }
  summary.errors = summary.errors.slice(0, 20);
  return summary;
}
