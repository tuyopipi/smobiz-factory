import { observedBusinessFacts } from "./aeo-harvest.mjs";
import { resolveSitePlan } from './billing-plan.mjs';

// The daily cron fires exactly 24 h apart, so a strict 24 h window turned
// a few seconds of jitter into "every other day". An hour of slack, as the SoV
// batch has, keeps it daily while still refusing a second run the same day.
export const AUTOFIX_MIN_INTERVAL_MS = 24 * 60 * 60 * 1000 - 60 * 60 * 1000;

// A bounded daily request. The WP adapter applies the settings; a later public
// diagnosis proves success. Missing facts are never inferred by this job.
export async function requestAutoFix(env, site, result, {now = Date.now()} = {}) {
  const entitlement = await env.DB.prepare(`SELECT s.*,o.manual_plan AS org_manual_plan FROM sites s LEFT JOIN orgs o ON o.id=s.org_id WHERE s.id=?`).bind(site.id).first();
  if (!entitlement || entitlement.delivery_status === 'stopped' || resolveSitePlan(entitlement,{manual_plan:entitlement.org_manual_plan}) === 'free') return {status:'ineligible'};
  const previous = await env.DB.prepare('SELECT requested_at FROM aeo_autofix_jobs WHERE site_id=?').bind(site.id).first();
  if (previous && now-Date.parse(previous.requested_at) < AUTOFIX_MIN_INTERVAL_MS) return {status:'rate_limited'};
  const claim = await env.DB.prepare(`INSERT INTO aeo_autofix_jobs(site_id,ruleset_version,requested_at,actions_json,missing_json,status)
    VALUES(?,?,?,'[]','{}','planning') ON CONFLICT(site_id) DO UPDATE SET requested_at=excluded.requested_at,status='planning'
    WHERE aeo_autofix_jobs.requested_at<=?`)
    .bind(site.id,result.rulesetVersion,new Date(now).toISOString(),new Date(now-AUTOFIX_MIN_INTERVAL_MS).toISOString()).run();
  if (claim.meta?.changes === 0) return {status:'rate_limited'};
  const current = await env.DB.prepare('SELECT * FROM site_settings WHERE site_id=?').bind(site.id).first() || {};
  const facts = observedBusinessFacts(result.publicNodes, entitlement, current);
  const {sameAs, ...profileFacts} = facts;
  if (Object.keys(profileFacts).length) {
    const {writeSiteProfile} = await import('./api.mjs');
    await writeSiteProfile(env, site.id, profileFacts, 'autofill');
  }
  if (sameAs?.length) await env.DB.prepare(`INSERT INTO aeo_harvested_facts(site_id,same_as_json,observed_at,source_url) VALUES(?,?,?,?)
    ON CONFLICT(site_id) DO UPDATE SET same_as_json=excluded.same_as_json,observed_at=excluded.observed_at,source_url=excluded.source_url`)
    .bind(site.id,JSON.stringify(sameAs),new Date(now).toISOString(),entitlement.website_uri || entitlement.url).run();
  const failed = (result.checks || []).filter(c=>c.status !== 'OK' && c.unknown !== true); // an unrun check is not a finding
  const actionFor = {schema:'publish_schema',coverage:'harvest_profile',llms:'publish_llms',ai_crawlers_allowed:'allow_crawlers',server_rendered_html:'publish_schema'};
  const supported = entitlement.install_type === 'wp' ? ['publish_schema','harvest_profile','publish_llms','allow_crawlers']
    : entitlement.install_type === 'hosted' ? ['publish_schema','harvest_profile','publish_llms'] : ['harvest_profile'];
  const actions = [...new Set(failed.filter(c=>c.fixable && supported.includes(actionFor[c.id])).map(c=>actionFor[c.id]))];
  const missing = [...new Map(failed.flatMap(c=>c.fields || []).filter(f=>!f.present).map(f=>[`${f.entityType}.${f.field}`,{entityType:f.entityType,field:f.field}])).values()];
  const manualChecks = failed.filter(c=>!c.fixable || !supported.includes(actionFor[c.id])).map(c=>c.id);
  const stamp = new Date(now).toISOString();
  const detail = {missing_fields:missing,manual_checks:manualChecks,action_required:!!(missing.length || manualChecks.length),reason:'公開情報の不足です。既存データのみ抽出し、不明な事実はオーナーに確認します。'};
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO aeo_autofix_jobs(site_id,ruleset_version,requested_at,actions_json,missing_json,status) VALUES(?,?,?,?,?,?)
      ON CONFLICT(site_id) DO UPDATE SET ruleset_version=excluded.ruleset_version,requested_at=excluded.requested_at,actions_json=excluded.actions_json,missing_json=excluded.missing_json,status=excluded.status`)
      .bind(site.id,result.rulesetVersion,stamp,JSON.stringify(actions),JSON.stringify(detail),actions.length?'pending':detail.action_required?'needs_owner':'verified'),
    env.DB.prepare(`INSERT INTO aeo_site_recommendations(site_id,kind,created_at,updated_at,detail_json,status,ruleset_version)
      VALUES(?,'daily_autofix',?,?,?,?,?) ON CONFLICT(site_id,kind) DO UPDATE SET updated_at=excluded.updated_at,detail_json=excluded.detail_json,status=excluded.status,ruleset_version=excluded.ruleset_version`)
      .bind(site.id,stamp,stamp,JSON.stringify(detail),detail.action_required?'open':'resolved',result.rulesetVersion),
  ]);
  // The hosted/tag adapter reads these settings directly; WP receives the same job
  // with its existing twice-daily config sync. No new cron or paid API calls.
  if (actions.includes('publish_schema') || actions.includes('allow_crawlers')) {
    await env.DB.prepare(`UPDATE site_settings SET serve_schema=CASE WHEN ? THEN 1 ELSE serve_schema END,
      allow_crawlers=CASE WHEN ? THEN 1 ELSE allow_crawlers END WHERE site_id=?`)
      .bind(actions.includes('publish_schema')?1:0,actions.includes('allow_crawlers')?1:0,site.id).run();
  }
  return {status:actions.length?'pending':detail.action_required?'needs_owner':'verified',actions,missing,harvested:Object.keys(facts)};
}
