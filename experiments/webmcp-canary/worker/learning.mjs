/**
 * What changes make a business appear in AI answers? (docs/learning.md)
 *
 * Builds a before/after dataset from the natural rollout across installed
 * sites - no cooperating-site programme, no experiment anyone was asked to
 * join - and estimates, honestly, what a specific change did:
 *
 *   panels     one per site, in weekly buckets (UTC, Monday start): readiness
 *              score and its components, the change-log events of that week,
 *              and the AI appearance measured that week, per engine and never
 *              pooled across engines (Pro SoV runs, free monthly checks and the
 *              pre-install baseline), with the site's type, industry,
 *              coarse area and plan.
 *
 *   estimator  staggered-adoption difference-in-differences: for every site
 *              that made the change (treated) in week g, its change in
 *              appearance rate from the PRE window [g-12, g-1] to the POST
 *              window [g+2, g+13] (two weeks' lag for answers to catch up),
 *              minus the mean change over the same calendar weeks of sites
 *              that had NOT made it yet (not-yet-treated: never, or only after
 *              the post window), of the same site type, measured by the same
 *              kind of measurement on the same engine. The ATT is the mean of
 *              those differences. Uncertainty: cluster bootstrap by site
 *              (resampling whole sites, so a site's repeated measurements are
 *              never treated as independent), 95% percentile interval.
 *              Plus a placebo on the pre-period (should be ~0) and an
 *              event-study by post-period bin.
 *
 *   gate       below LEARNING_MIN_TREATED treated sites with pre AND post
 *              measurements (and LEARNING_MIN_CONTROLS comparison sites), no
 *              number is reported: status "insufficient_data" and the counts.
 *
 * Scope (owner decision, docs/learning.md "Scope"): learning stays within what
 * Nurevo - the plugin and the service - can actually change. Only those
 * changes are treatments (LEARNING_TREATMENTS, all `lever: true`): structured
 * data and business-facts completeness, site type, llms.txt, AI crawler
 * rules, FAQ / services / products content, one-click fixes, the schema merge
 * with SEO plugins, the plugin itself and its version. Things Nurevo cannot
 * change - plan, industry, area, the off-site listing audit, reviews,
 * popularity - are used only to stratify the comparison (CONTEXT_ONLY) and
 * are never reported as a lever or proposed. No Google Maps / Places data is
 * collected for this.
 *
 * Outcomes, per engine, in this order: "own site cited" (the answer lists the
 * site's own domain among its sources - the outcome most within Nurevo's
 * influence, shown first), then "appeared" (named or cited), then "named".
 *
 * Nothing here changes a score. The output is a report with a "proposals"
 * list for a human to review (docs/learning.md, "How a proposal is
 * reviewed"); `applied` is always false. The cross-sectional calibration
 * (aeo-calibration.mjs) is included, labelled exploratory.
 */
import { localityFromAddress } from "./aeo-sov.mjs";
import { freeCheckCounts } from "./aeo-score-v2.mjs";
import { resolveSitePlan } from "./billing-plan.mjs";
import { ENGINE_IDS_FOR_LEARNING, sovEngineCounts } from "./learning-events.mjs";

export const LEARNING_REPORT_VERSION = "learn-did-v1";
export const LEARNING_MIN_TREATED = 30;
export const LEARNING_MIN_CONTROLS = 30;
export const LEARNING_DEFAULTS = Object.freeze({ preWeeks: 12, lagWeeks: 2, postWeeks: 12, bootstrap: 400, seed: 20261027, alpha: 0.05 });
/** A plugin flag that is on in the first snapshot counts as switched on then only for an install this fresh. */
export const FRESH_INSTALL_DAYS = 14;

const DAY = 86400e3;
const WEEK = 7 * DAY;
const MISSING = /no such table|no such column/i;

/** Week index (Monday-start, UTC) of a time. */
export function weekOf(at) {
  const ms = typeof at === "number" ? at : Date.parse(String(at || ""));
  return Number.isFinite(ms) ? Math.floor((ms + 3 * DAY) / WEEK) : null;
}
/** The Monday (YYYY-MM-DD) a week index starts on. */
export function weekStart(week) {
  return new Date(week * WEEK - 3 * DAY).toISOString().slice(0, 10);
}

function parse(value, fallback = null) {
  if (value && typeof value === "object") return value;
  try { const parsed = JSON.parse(value); return parsed ?? fallback; } catch { return fallback; }
}

/* ------------------------------------------------------------------ *
 * The changes we estimate
 * ------------------------------------------------------------------ */

/**
 * Each treatment: from a site's ordered events, when it first happened.
 * Returns { status: "treated", at } | { status: "always" } (already so before
 * we could see a change) | { status: "never" } | { status: "unknown" }
 * (no plugin snapshot, so its state is not known).
 */
const switchOn = (name) => (events) => {
  const snapshot = events.find((e) => e.type === "snapshot");
  if (!snapshot) return { status: "unknown" };
  const fresh = Number(snapshot.data?.installed_days ?? Infinity) <= FRESH_INSTALL_DAYS;
  if (snapshot.data?.switches?.[name] === true) return fresh ? { status: "treated", at: snapshot.at, via: "fresh_install" } : { status: "always" };
  const on = events.find((e) => e.type === "output_toggled" && e.data?.switch === name && e.data?.on === true && e.ms >= snapshot.ms);
  return on ? { status: "treated", at: on.at } : { status: "never" };
};
const countAdded = (key) => (events) => {
  const snapshot = events.find((e) => e.type === "snapshot");
  if (!snapshot) return { status: "unknown" };
  const fresh = Number(snapshot.data?.installed_days ?? Infinity) <= FRESH_INSTALL_DAYS;
  if (Number(snapshot.data?.counts?.[key] || 0) > 0) return fresh ? { status: "treated", at: snapshot.at, via: "fresh_install" } : { status: "always" };
  const added = events.find((e) => e.type === "counts_changed" && Number(e.data?.[key]?.from || 0) === 0 && Number(e.data?.[key]?.to || 0) > 0 && e.ms >= snapshot.ms);
  return added ? { status: "treated", at: added.at } : { status: "never" };
};

const firstAfterSnapshot = (match) => (events) => {
  const snapshot = events.find((e) => e.type === "snapshot");
  if (!snapshot) return { status: "unknown" };
  const hit = events.find((e) => e.ms >= snapshot.ms && match(e));
  return hit ? { status: "treated", at: hit.at } : { status: "never" };
};

/** Context, never a lever: used to stratify comparisons only, never estimated or proposed. */
export const CONTEXT_ONLY = Object.freeze(["plan", "industry", "country", "city", "offsite_audit"]);
/** The outcomes, in the order the report shows them. */
export const LEARNING_OUTCOMES = Object.freeze([
  { id: "cited", label: { en: "Own site cited", ja: "自サイトが引用された" } },
  { id: "appeared", label: { en: "Named or cited", ja: "名前または引用で登場" } },
  { id: "named", label: { en: "Business named", ja: "店名・社名が登場" } },
]);

export const LEARNING_TREATMENTS = Object.freeze([
  {
    id: "plugin_connected",
    label: { en: "Plugin installed and connected", ja: "プラグイン導入・接続" },
    // Every WordPress site added in the dashboard is a candidate; the change is pairing.
    population: (panel) => panel.install_type === "wp",
    first: (events) => {
      const connected = events.find((e) => e.type === "site_connected");
      return connected ? { status: "treated", at: connected.at } : { status: "never" };
    },
  },
  { id: "llms_txt_enabled", label: { en: "llms.txt enabled", ja: "llms.txt を有効化" }, first: switchOn("llms_txt") },
  { id: "schema_enabled", label: { en: "Structured data enabled", ja: "構造化データを有効化" }, first: switchOn("schema") },
  { id: "schema_merge_enabled", label: { en: "Schema merged with the SEO plugin", ja: "SEOプラグインの構造化データと統合" }, first: switchOn("schema_dedupe") },
  { id: "crawlers_allowed", label: { en: "AI crawlers allowed", ja: "AIクローラーを許可" }, first: switchOn("crawlers") },
  {
    id: "site_type_set",
    label: { en: "Site type chosen", ja: "サイト種別を選択" },
    first: (events) => {
      const snapshot = events.find((e) => e.type === "snapshot");
      if (!snapshot) return { status: "unknown" };
      const fresh = Number(snapshot.data?.installed_days ?? Infinity) <= FRESH_INSTALL_DAYS;
      if (snapshot.data?.site_type && snapshot.data.site_type !== "unset") return fresh ? { status: "treated", at: snapshot.at, via: "fresh_install" } : { status: "always" };
      return firstAfterSnapshot((e) => e.type === "site_type_changed" && e.data?.to && e.data.to !== "unset")(events);
    },
  },
  { id: "one_click_fix", label: { en: "One-click fix applied", ja: "ワンクリック修正を適用" }, first: firstAfterSnapshot((e) => e.type === "fix_applied") },
  { id: "plugin_updated", label: { en: "Plugin updated", ja: "プラグインを更新" }, first: firstAfterSnapshot((e) => e.type === "plugin_version_changed") },
  {
    id: "local_facts_completed",
    label: { en: "LocalBusiness facts completed", ja: "店舗の基本情報（LocalBusiness）を完成" },
    first: (events) => {
      const snapshot = events.find((e) => e.type === "snapshot");
      if (!snapshot) return { status: "unknown" };
      const fresh = Number(snapshot.data?.installed_days ?? Infinity) <= FRESH_INSTALL_DAYS;
      if (snapshot.data?.facts_complete === true) return fresh ? { status: "treated", at: snapshot.at, via: "fresh_install" } : { status: "always" };
      const done = events.find((e) => e.type === "fields_changed" && e.data?.became_complete === true && e.ms >= snapshot.ms);
      return done ? { status: "treated", at: done.at } : { status: "never" };
    },
  },
  { id: "faq_added", label: { en: "FAQ added", ja: "FAQを追加" }, first: countAdded("faq") },
  { id: "services_added", label: { en: "Services added", ja: "サービスを追加" }, first: countAdded("services") },
  { id: "products_added", label: { en: "Products added", ja: "商品を追加" }, first: countAdded("products") },
].map((treatment) => Object.freeze({ ...treatment, lever: true })));

/* ------------------------------------------------------------------ *
 * Loading (reads only; bounded)
 * ------------------------------------------------------------------ */

async function tryAll(env, sql, binds = []) {
  try {
    const statement = env.DB.prepare(sql);
    const { results } = binds.length ? await statement.bind(...binds).all() : await statement.all();
    return results || [];
  } catch (error) {
    if (MISSING.test(String(error?.message || error))) return null;
    throw error;
  }
}

/** Everything the panels are built from, since `sinceDays` ago. */
export async function loadLearningData(env, { now = Date.now(), sinceDays = 400 } = {}) {
  if (!env?.DB) throw new Error("DB binding is required for learning");
  const since = new Date(now - sinceDays * DAY).toISOString();
  let sites = await tryAll(env, `SELECT s.*, o.manual_plan AS org_manual_plan, ss.site_type AS profile_site_type, ss.business_type AS profile_business_type,
      ss.business_type_schema AS profile_business_type_schema, ss.address AS profile_address
      FROM sites s LEFT JOIN orgs o ON o.id=s.org_id LEFT JOIN site_settings ss ON ss.site_id=s.id ORDER BY s.created_at LIMIT 20000`);
  if (sites === null) {
    // Before orgs.manual_plan / site_settings.site_type exist.
    sites = await tryAll(env, `SELECT s.*, ss.business_type AS profile_business_type, ss.business_type_schema AS profile_business_type_schema, ss.address AS profile_address
      FROM sites s LEFT JOIN site_settings ss ON ss.site_id=s.id ORDER BY s.created_at LIMIT 20000`) || [];
  }
  const events = await tryAll(env, `SELECT site_id,source,type,occurred_at,data_json FROM learning_events
      WHERE type IN ('snapshot','output_toggled','fields_changed','counts_changed','site_connected','plan_changed','site_type_changed','score_changed','fix_applied')
        AND occurred_at>=? ORDER BY occurred_at LIMIT 200000`, [since]);
  const scores = await tryAll(env, `SELECT site_id, strftime('%Y-%W', scanned_at) AS wk, AVG(score) AS score, MAX(scanned_at) AS last_at, COUNT(*) AS n
      FROM aeo_scores WHERE score IS NOT NULL AND scanned_at>=? GROUP BY site_id, wk`, [since]) || [];
  const sov = await tryAll(env, `SELECT site_id,ran_at,status,appearance_rate,citation_rate,answers_received,detail_json
      FROM aeo_sov_runs WHERE status='measured' AND ran_at>=? ORDER BY ran_at LIMIT 100000`, [since]) || [];
  const free = await tryAll(env, `SELECT site_id,month,status,started_at,finished_at,result_json FROM aeo_free_checks
      WHERE status IN ('done','failed') AND started_at>=? LIMIT 100000`, [since]) || [];
  const baselines = await tryAll(env, "SELECT * FROM learning_baselines LIMIT 100000");
  return {
    now, since, migrationPending: events === null || baselines === null,
    sites, events: events || [], scores, sov, free, baselines: baselines || [],
  };
}

/* ------------------------------------------------------------------ *
 * Panels
 * ------------------------------------------------------------------ */

function countryOf(address) {
  const raw = String(address || "");
  if (!raw.trim()) return null;
  if (/[぀-ヿ]|[都道府県]/.test(raw) || /\bjapan\b/i.test(raw)) return "JP";
  if (/[가-힯]/.test(raw)) return "KR";
  if (/[㐀-鿿]/.test(raw)) return "CN/TW";
  const tail = raw.split(",").map((part) => part.trim()).filter(Boolean).pop() || "";
  return /^[A-Za-z .]{2,40}$/.test(tail) ? tail.toUpperCase().slice(0, 20) : null;
}

function legacySovCounts(row) {
  const n = Number(row.answers_received || 0);
  if (!n || row.appearance_rate == null) return {};
  const named = Math.round(Number(row.appearance_rate) * n);
  const cited = row.citation_rate == null ? 0 : Math.round(Number(row.citation_rate) * n);
  return { perplexity: { n, named, cited, appeared: Math.max(named, cited) } };
}

/**
 * Build one panel per site from loaded rows (pure). Each panel:
 *   { site_id, install_type, site_type, industry, city, country, plan,
 *     events: [{type, at, ms, week, data}], measurements: [{at, week, engine,
 *     family: "sov" | "free", baseline, n, named, cited, appeared}],
 *     weeks: { [week]: { readiness, components, events: [types], plan,
 *              outcomes: { [engine]: { [family]: {n, named, cited, appeared} } } } },
 *     baseline: { status, readiness } | null }
 */
export function buildPanels(data) {
  const panels = new Map();
  for (const site of data.sites || []) {
    panels.set(site.id, {
      site_id: site.id,
      install_type: site.install_type || null,
      site_type: site.profile_site_type || "local",
      industry: site.profile_business_type_schema || site.profile_business_type || null,
      city: localityFromAddress(site.profile_address || "") || null,
      country: countryOf(site.profile_address),
      plan: resolveSitePlan(site, { manual_plan: site.org_manual_plan }),
      created_at: site.created_at ? new Date(Number(site.created_at)).toISOString() : null,
      events: [],
      measurements: [],
      weeks: {},
      baseline: null,
    });
  }
  const week = (panel, w) => (panel.weeks[w] ||= { readiness: null, components: null, events: [], plan: null, outcomes: {} });
  for (const row of data.events || []) {
    const panel = panels.get(row.site_id);
    if (!panel) continue;
    const ms = Date.parse(row.occurred_at);
    if (!Number.isFinite(ms)) continue;
    panel.events.push({ type: row.type, source: row.source, at: row.occurred_at, ms, week: weekOf(ms), data: parse(row.data_json, {}) || {} });
  }
  const addMeasurement = (panel, at, engine, family, counts, baseline = false) => {
    const ms = Date.parse(at);
    if (!Number.isFinite(ms) || !counts || !(counts.n > 0)) return;
    const m = { at: new Date(ms).toISOString(), ms, week: weekOf(ms), engine, family, baseline, n: counts.n, named: counts.named || 0, cited: counts.cited || 0,
      appeared: counts.appeared == null ? Math.max(counts.named || 0, counts.cited || 0) : counts.appeared };
    panel.measurements.push(m);
    const cell = ((week(panel, m.week).outcomes[engine] ||= {})[family] ||= { n: 0, named: 0, cited: 0, appeared: 0 });
    cell.n += m.n; cell.named += m.named; cell.cited += m.cited; cell.appeared += m.appeared;
  };
  for (const row of data.sov || []) {
    const panel = panels.get(row.site_id);
    if (!panel) continue;
    const detail = parse(row.detail_json, {}) || {};
    let byEngine = sovEngineCounts(detail);
    if (!Object.keys(byEngine).length && !Array.isArray(detail.by_engine)) byEngine = legacySovCounts(row);
    for (const [engine, counts] of Object.entries(byEngine)) addMeasurement(panel, row.ran_at, engine, "sov", counts);
  }
  for (const row of data.free || []) {
    const panel = panels.get(row.site_id);
    if (!panel) continue;
    addMeasurement(panel, row.finished_at || row.started_at, "perplexity", "free", freeCheckCounts(row));
  }
  for (const row of data.baselines || []) {
    const panel = panels.get(row.site_id);
    if (!panel) continue;
    const readiness = parse(row.readiness_json, {}) || {};
    panel.baseline = { status: row.status, reason: row.reason || null, readiness: row.readiness_score == null ? null : Number(row.readiness_score), components: readiness.components || {}, connected_before: !!row.connected_before, at: row.measured_at || null };
    const result = parse(row.result_json, null);
    if (row.status === "done" && result) {
      addMeasurement(panel, row.measured_at, result.engine || "perplexity", "free", { n: Number(result.answered || 0), named: Number(result.named || 0), cited: Number(result.cited || 0), appeared: Number(result.appeared || 0) }, true);
    }
    if (panel.baseline.readiness != null && row.measured_at) {
      const cell = week(panel, weekOf(row.measured_at));
      if (cell.readiness == null) { cell.readiness = panel.baseline.readiness; cell.components = panel.baseline.components; }
    }
  }
  for (const row of data.scores || []) {
    const panel = panels.get(row.site_id);
    if (!panel) continue;
    const w = weekOf(row.last_at);
    if (w == null) continue;
    week(panel, w).readiness = Math.round(Number(row.score));
  }
  for (const panel of panels.values()) {
    panel.events.sort((a, b) => a.ms - b.ms);
    panel.measurements.sort((a, b) => a.ms - b.ms);
    let components = null;
    for (const event of panel.events) {
      const cell = week(panel, event.week);
      cell.events.push(event.type);
      if (event.type === "score_changed" && event.data?.components) { components = event.data.components; cell.components = components; }
    }
    // Plan per week: carried back from the first change, forward from each.
    const planChanges = panel.events.filter((e) => e.type === "plan_changed" && e.data?.to);
    for (const [w, cell] of Object.entries(panel.weeks)) {
      let plan = planChanges.length ? planChanges[0].data.from || panel.plan : panel.plan;
      for (const change of planChanges) if (change.week <= Number(w)) plan = change.data.to;
      cell.plan = plan;
    }
  }
  return [...panels.values()];
}

/* ------------------------------------------------------------------ *
 * The estimator
 * ------------------------------------------------------------------ */

/** Pooled appearance rate of a panel's measurements of one engine and family in [from, to] (weeks, inclusive). */
function windowRate(panel, engine, family, from, to, outcome = "appeared") {
  let n = 0, hits = 0;
  for (const m of panel.measurements) {
    if (m.engine !== engine || m.family !== family || m.week < from || m.week > to) continue;
    n += m.n; hits += Number(m[outcome] || 0);
  }
  return n > 0 ? { rate: hits / n, n } : null;
}

/** The family both windows have, Pro SoV first. */
function pairedRates(panel, engine, pre, post, outcome) {
  for (const family of ["sov", "free"]) {
    const before = windowRate(panel, engine, family, pre[0], pre[1], outcome);
    const after = before && windowRate(panel, engine, family, post[0], post[1], outcome);
    if (before && after) return { family, before, after, delta: after.rate - before.rate };
  }
  return null;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function quantile(sorted, q) {
  if (!sorted.length) return null;
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

const r4 = (x) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 1e4) / 1e4);

/**
 * The comparisons one window choice gives: for each treated site, its delta
 * and the deltas of its not-yet-treated comparison sites (same engine, same
 * measurement family, same site type).
 */
/** A site's plan in a given week, from its plan_changed events (context only: a stratum). */
export function planAt(panel, week) {
  const changes = panel.events.filter((e) => e.type === "plan_changed" && e.data?.to);
  let plan = changes.length ? changes[0].data.from || panel.plan : panel.plan;
  for (const change of changes) if (change.week <= week) plan = change.data.to;
  return plan;
}

/** The stratum a site is compared within: context variables only, never levers. */
function stratumOf(panel, week, strata) {
  return strata.map((key) => (key === "plan" ? planAt(panel, week) : panel[key] ?? null)).join("|");
}

function buildComparisons(units, engine, windowFor, { outcome = "appeared", strata = ["site_type", "plan"] } = {}) {
  const comparisons = [];
  for (const unit of units) {
    if (unit.status !== "treated") continue;
    const { pre, post } = windowFor(unit.week);
    const own = pairedRates(unit.panel, engine, pre, post, outcome);
    if (!own) continue;
    const stratum = stratumOf(unit.panel, unit.week, strata);
    const controls = [];
    for (const other of units) {
      if (other === unit) continue;
      if (stratumOf(other.panel, unit.week, strata) !== stratum) continue;
      const clean = other.status === "never" || (other.status === "treated" && other.week > post[1]);
      if (!clean) continue;
      const before = windowRate(other.panel, engine, own.family, pre[0], pre[1], outcome);
      const after = before && windowRate(other.panel, engine, own.family, post[0], post[1], outcome);
      if (before && after) controls.push({ site_id: other.panel.site_id, delta: after.rate - before.rate });
    }
    if (controls.length) comparisons.push({ site_id: unit.panel.site_id, family: own.family, delta: own.delta, controls });
  }
  return comparisons;
}

function attOf(comparisons, weight = null) {
  let total = 0, weightSum = 0;
  for (const comparison of comparisons) {
    const wi = weight ? weight.get(comparison.site_id) || 0 : 1;
    if (!wi) continue;
    let controlSum = 0, controlWeight = 0;
    for (const control of comparison.controls) {
      const wj = weight ? weight.get(control.site_id) || 0 : 1;
      controlSum += wj * control.delta;
      controlWeight += wj;
    }
    if (!controlWeight) continue;
    total += wi * (comparison.delta - controlSum / controlWeight);
    weightSum += wi;
  }
  return weightSum ? total / weightSum : null;
}

/** Point estimate, cluster-bootstrap CI and the gate for one set of comparisons. */
function summarize(comparisons, { minTreated, minControls, bootstrap: draws0, seed, alpha }) {
  let bootstrap = draws0;
  const treatedSites = new Set(comparisons.map((c) => c.site_id));
  const controlSites = new Set(comparisons.flatMap((c) => c.controls.map((control) => control.site_id)));
  const n = { treated: treatedSites.size, controls: controlSites.size, comparisons: comparisons.reduce((sum, c) => sum + c.controls.length, 0) };
  if (n.treated < minTreated || n.controls < minControls) {
    return { status: "insufficient_data", n, estimate: null, ci: null, gate: { min_treated: minTreated, min_controls: minControls } };
  }
  const estimate = attOf(comparisons);
  // The bootstrap is O(draws x comparisons); keep one request bounded.
  if (n.comparisons > 200000) bootstrap = Math.min(bootstrap, 100);
  const clusters = [...new Set([...treatedSites, ...controlSites])];
  const random = mulberry32(seed);
  const draws = [];
  for (let b = 0; b < bootstrap; b += 1) {
    const weight = new Map();
    for (let k = 0; k < clusters.length; k += 1) {
      const pick = clusters[Math.floor(random() * clusters.length)];
      weight.set(pick, (weight.get(pick) || 0) + 1);
    }
    const value = attOf(comparisons, weight);
    if (value != null) draws.push(value);
  }
  draws.sort((a, b) => a - b);
  const low = quantile(draws, alpha / 2);
  const high = quantile(draws, 1 - alpha / 2);
  const mean = draws.reduce((s, x) => s + x, 0) / (draws.length || 1);
  const se = Math.sqrt(draws.reduce((s, x) => s + (x - mean) ** 2, 0) / Math.max(1, draws.length - 1));
  return { status: "estimated", n, estimate: r4(estimate), ci: [r4(low), r4(high)], se: r4(se), bootstrap: draws.length, gate: { min_treated: minTreated, min_controls: minControls } };
}

/**
 * Estimate one treatment's effect on the appearance rate (named or cited,
 * share of answers) of one engine. Returns the main estimate, the pre-period
 * placebo, an event-study by post bin, and counts - or insufficient_data.
 */
export function estimateEffect(panels, treatment, options = {}) {
  const o = { ...LEARNING_DEFAULTS, minTreated: LEARNING_MIN_TREATED, minControls: LEARNING_MIN_CONTROLS, engine: "perplexity", outcome: "cited", strata: ["site_type", "plan"], ...options };
  const definition = typeof treatment === "string" ? LEARNING_TREATMENTS.find((t) => t.id === treatment) : treatment;
  if (!definition) throw new Error(`unknown treatment ${treatment}`);
  // Only what Nurevo can change is ever estimated as a lever (docs/learning.md, Scope).
  if (!definition.lever) throw new Error(`not a lever: ${definition.id}`);
  if (o.strata.some((key) => !["site_type", ...CONTEXT_ONLY].includes(key))) throw new Error("strata must be context variables");
  const cmp = { outcome: o.outcome, strata: o.strata };
  const units = [];
  const statusCounts = { treated: 0, never: 0, always: 0, unknown: 0 };
  for (const panel of panels) {
    if (definition.population && !definition.population(panel)) continue;
    const first = definition.first(panel.events);
    statusCounts[first.status] = (statusCounts[first.status] || 0) + 1;
    if (first.status !== "treated" && first.status !== "never") continue;
    units.push({ panel, status: first.status, week: first.status === "treated" ? weekOf(first.at) : null });
  }
  const main = (g) => ({ pre: [g - o.preWeeks, g - 1], post: [g + o.lagWeeks, g + o.lagWeeks + o.postWeeks - 1] });
  const comparisons = buildComparisons(units, o.engine, main, cmp);
  const result = summarize(comparisons, o);
  const half = Math.max(1, Math.floor(o.preWeeks / 2));
  const placebo = summarize(buildComparisons(units, o.engine, (g) => ({ pre: [g - o.preWeeks, g - half - 1], post: [g - half, g - 1] }), cmp), o);
  const binWidth = Math.max(1, Math.floor(o.postWeeks / 3));
  const eventStudy = [0, 1, 2].map((index) => {
    const from = o.lagWeeks + index * binWidth;
    const to = from + binWidth - 1;
    const bin = summarize(buildComparisons(units, o.engine, (g) => ({ pre: [g - o.preWeeks, g - 1], post: [g + from, g + to] }), cmp), o);
    return { weeks: [from, to], ...bin };
  });
  return {
    treatment: definition.id,
    label: definition.label,
    lever: true,
    engine: o.engine,
    outcome: o.outcome,
    strata: o.strata,
    windows: { pre_weeks: o.preWeeks, lag_weeks: o.lagWeeks, post_weeks: o.postWeeks },
    sites: statusCounts,
    ...result,
    placebo: { status: placebo.status, estimate: placebo.estimate, ci: placebo.ci, n: placebo.n },
    event_study: eventStudy.map((bin) => ({ weeks: bin.weeks, status: bin.status, estimate: bin.estimate, ci: bin.ci, n: bin.n })),
  };
}

/* ------------------------------------------------------------------ *
 * The report
 * ------------------------------------------------------------------ */

/** How much data there is: what the gate will eventually need. */
export function dataVolume(panels, data) {
  const measured = (panel) => new Set(panel.measurements.map((m) => m.at)).size;
  const engines = {};
  for (const panel of panels) for (const m of panel.measurements) {
    const key = `${m.engine}:${m.family}${m.baseline ? ":baseline" : ""}`;
    engines[key] = (engines[key] || 0) + 1;
  }
  const answers = {};
  for (const panel of panels) for (const m of panel.measurements) {
    const row = (answers[m.engine] ||= { answers: 0, own_cited: 0, appeared: 0, named: 0 });
    row.answers += m.n; row.own_cited += m.cited; row.appeared += m.appeared; row.named += m.named;
  }
  const baselines = {};
  for (const row of data.baselines || []) baselines[row.status] = (baselines[row.status] || 0) + 1;
  const eventsByType = {};
  const eventSites = {};
  for (const panel of panels) for (const event of panel.events) {
    eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    (eventSites[event.type] ||= new Set()).add(panel.site_id);
  }
  const bucket = (key) => {
    const out = {};
    for (const panel of panels) { const k = panel[key] || "unknown"; out[k] = (out[k] || 0) + 1; }
    return out;
  };
  return {
    sites: panels.length,
    wordpress_sites: panels.filter((p) => p.install_type === "wp").length,
    sites_with_baseline: panels.filter((p) => p.baseline?.status === "done").length,
    baselines_by_status: baselines,
    sites_with_snapshot: panels.filter((p) => p.events.some((e) => e.type === "snapshot")).length,
    sites_with_2plus_measurements: panels.filter((p) => measured(p) >= 2).length,
    measurements_by_engine: engines,
    answers_by_engine: answers,
    events_by_type: Object.fromEntries(Object.entries(eventsByType).sort()),
    sites_by_event_type: Object.fromEntries(Object.entries(eventSites).map(([k, s]) => [k, s.size]).sort()),
    by_site_type: bucket("site_type"),
    by_plan: bucket("plan"),
    by_country: bucket("country"),
  };
}

/**
 * The learning report. Never applies anything: `proposals` is a list for a
 * human to review, each with applied: false.
 */
export function learningReport(panels, data, options = {}) {
  const engines = options.engines || ENGINE_IDS_FOR_LEARNING.filter((engine) => panels.some((p) => p.measurements.some((m) => m.engine === engine)));
  const list = engines.length ? engines : ["perplexity"];
  const outcomes = (options.outcomes || LEARNING_OUTCOMES.map((o) => o.id)).filter((id) => LEARNING_OUTCOMES.some((o) => o.id === id));
  const estimates = [];
  // Own site cited first: the outcome most within Nurevo's influence.
  for (const outcome of outcomes) {
    for (const treatment of LEARNING_TREATMENTS) {
      for (const engine of list) estimates.push(estimateEffect(panels, treatment, { ...options, engine, outcome }));
    }
  }
  const proposals = estimates
    .filter((e) => e.lever === true)
    .filter((e) => e.status === "estimated" && e.ci && (e.ci[0] > 0 || e.ci[1] < 0))
    .filter((e) => e.placebo.status !== "estimated" || !e.placebo.ci || (e.placebo.ci[0] <= 0 && e.placebo.ci[1] >= 0))
    .map((e) => ({
      treatment: e.treatment,
      engine: e.engine,
      outcome: e.outcome,
      direction: e.estimate > 0 ? "raises" : "lowers",
      estimate: e.estimate,
      ci: e.ci,
      n: e.n,
      suggestion: "review_weight",
      applied: false,
      note: "A proposal for review only (docs/learning.md). Nothing changes a score until a reviewed ruleset is activated by hand.",
    }));
  return {
    version: LEARNING_REPORT_VERSION,
    generated_at: new Date(data.now || Date.now()).toISOString(),
    migration_pending: !!data.migrationPending,
    applied: false,
    auto_apply: false,
    scope: {
      levers: LEARNING_TREATMENTS.map((t) => t.id),
      context_only: [...CONTEXT_ONLY],
      note: "Only changes Nurevo (plugin or service) can make are estimated or proposed; context variables only stratify comparisons.",
    },
    outcomes: outcomes.map((id) => LEARNING_OUTCOMES.find((o) => o.id === id)),
    gate: { min_treated: options.minTreated ?? LEARNING_MIN_TREATED, min_controls: options.minControls ?? LEARNING_MIN_CONTROLS },
    method: {
      estimator: "staggered difference-in-differences vs not-yet-treated sites in the same stratum (site type, plan), same engine, same measurement kind",
      windows: { pre_weeks: options.preWeeks ?? LEARNING_DEFAULTS.preWeeks, lag_weeks: options.lagWeeks ?? LEARNING_DEFAULTS.lagWeeks, post_weeks: options.postWeeks ?? LEARNING_DEFAULTS.postWeeks },
      ci: "95% percentile interval, cluster bootstrap by site",
      outcome: "share of AI answers: own site cited (first), named or cited, named",
    },
    volume: dataVolume(panels, data),
    estimates,
    proposals,
  };
}

/** Load, build and report. `calibration` (the old cross-sectional scaffold) is added, marked exploratory. */
export async function runLearningReport(env, options = {}) {
  const data = await loadLearningData(env, options);
  const panels = buildPanels(data);
  const report = learningReport(panels, data, options);
  let exploratory;
  try {
    const { runCalibration } = await import("./aeo-calibration.mjs");
    exploratory = { exploratory: true, note: "cross-sectional, confounded by site differences; not a causal estimate", ...(await runCalibration(env)) };
  } catch (error) {
    exploratory = { exploratory: true, reason: "calibration_failed", error: String(error?.message || error).slice(0, 120) };
  }
  return { ...report, exploratory_cross_sectional: exploratory };
}
