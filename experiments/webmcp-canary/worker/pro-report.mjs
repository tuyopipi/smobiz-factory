import { SovError, normalizeHost, buildQuestionSet, availableEngines } from './aeo-sov.mjs';

export const VARIABILITY_NOTICE = 'AI回答・引用は実行日時やモデルで変動します。小規模サンプルの観測値であり、絶対値・順位・正確性を保証しません。引用順位は提供元の出典URL一覧の順序です。';
export const PRO_CACHE_MS = 60 * 60 * 1000;
export const parseJson = (s, fallback = {}) => { try { return JSON.parse(s); } catch { return fallback; } };
export function validateQuerySet(input) {
  if (!input || !Array.isArray(input.questions) || !input.questions.length || input.questions.length > 20
      || input.questions.some(q => typeof q !== 'string' || !q.trim() || q.length > 500)) throw new SovError(422, 'invalid_questions');
  if (!Number.isInteger(input.repetitions) || input.repetitions < 1 || input.repetitions > 3) throw new SovError(422, 'invalid_repetitions');
  if (!Array.isArray(input.competitors) || input.competitors.length > 10) throw new SovError(422, 'invalid_competitors');
  const competitors = input.competitors.map(value => {
    if (typeof value !== 'string' || !/^(?:[a-z0-9\u0080-\uffff-]+\.)+[a-z\u0080-\uffff]{2,}$/i.test(value.replace(/^www\./, ''))) throw new SovError(422, 'invalid_competitor_domain');
    return normalizeHost(value);
  });
  return { questions: [...new Set(input.questions.map(q => q.trim()))], repetitions: input.repetitions,
    competitors: [...new Set(competitors)], engine: 'perplexity' };
}
export async function loadQuerySet(env, siteId) {
  const row = await env.DB.prepare('SELECT * FROM aeo_sov_query_sets WHERE site_id=?').bind(siteId).first();
  return row ? { ...parseJson(row.config_json), version: row.version, updated_at: row.updated_at } : null;
}
export async function saveQuerySet(env, siteId, input) {
  const config = validateQuerySet(input);
  await env.DB.prepare(`INSERT INTO aeo_sov_query_sets(site_id,version,config_json,updated_at) VALUES (?,1,?,?)
    ON CONFLICT(site_id) DO UPDATE SET version=version+1,config_json=excluded.config_json,updated_at=excluded.updated_at`)
    .bind(siteId, JSON.stringify(config), new Date().toISOString()).run();
  return loadQuerySet(env, siteId);
}
export async function ensureQuerySet(env, siteId, profile) {
  const existing = await loadQuerySet(env, siteId);
  if (existing) return existing;
  const config = validateQuerySet({ questions: buildQuestionSet(profile).slice(0, 5), repetitions: 2, competitors: [] });
  await env.DB.prepare('INSERT OR IGNORE INTO aeo_sov_query_sets(site_id,version,config_json,updated_at) VALUES (?,1,?,?)')
    .bind(siteId, JSON.stringify(config), new Date().toISOString()).run();
  return await loadQuerySet(env, siteId) || { ...config, version: 1 }; // test doubles may not read writes
}
export async function measurementKey(env, config, profile) {
  const raw = JSON.stringify({ config, profile, model: `agent:${env.PERPLEXITY_PRESET || 'fast'}`, engines: availableEngines(env).filter(e => e.id === 'perplexity') });
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)))].map(b => b.toString(16).padStart(2,'0')).join('');
}
export async function loadCachedRun(env, siteId, cacheKey) {
  const row = await env.DB.prepare('SELECT * FROM aeo_sov_runs WHERE site_id=? ORDER BY ran_at DESC LIMIT 1').bind(siteId).first();
  if (!row || row.status !== 'measured' || !row.answers_received || Date.now() - Date.parse(row.ran_at) >= PRO_CACHE_MS) return null;
  const detail = parseJson(row.detail_json);
  if (detail.cache_key !== cacheKey) return null;
  return { run: { id: row.id, ran_at: row.ran_at }, measurement: { ...row, competitors: parseJson(row.competitors_json, []), queries_used: 0 }, cached: true };
}
export async function acquireMeasurementLock(env, siteId) {
  const token = crypto.randomUUID();
  // Maximum run is 40 sequential calls, each with a 20s timeout. Lock lease exceeds that.
  const row = await env.DB.prepare(`INSERT INTO aeo_sov_locks(site_id,token,expires_at) VALUES (?,?,?)
    ON CONFLICT(site_id) DO UPDATE SET token=excluded.token,expires_at=excluded.expires_at
    WHERE aeo_sov_locks.expires_at<?`).bind(siteId, token, Date.now()+30*60*1000, Date.now()).run();
  return row.meta?.changes === 0 ? null : token;
}
export async function releaseMeasurementLock(env, siteId, token) {
  await env.DB.prepare('DELETE FROM aeo_sov_locks WHERE site_id=? AND token=?').bind(siteId, token).run();
}
export async function reviewEvidence(env, siteId, evidenceId, input, reviewerId) {
  if (!['confirmed_error','checked_no_obvious_error','uncertain'].includes(input.status)
      || typeof input.note !== 'string' || !input.note.trim() || input.note.length > 2000) throw new SovError(422, 'invalid_accuracy_review');
  const row = await env.DB.prepare('SELECT accuracy_json FROM aeo_sov_evidence WHERE id=? AND site_id=?').bind(evidenceId, siteId).first();
  if (!row) throw new SovError(404, 'evidence_not_found');
  const review = { ...parseJson(row.accuracy_json), status: input.status, note: input.note.trim(), reviewed_by: reviewerId, reviewed_at: new Date().toISOString() };
  await env.DB.prepare('UPDATE aeo_sov_evidence SET accuracy_json=? WHERE id=? AND site_id=?').bind(JSON.stringify(review), evidenceId, siteId).run();
  return review;
}
const matches = (url, host) => { const h = normalizeHost(url); return h === host || h.endsWith('.'+host); };
export function buildProReport({ site, run = null, evidence = [], runs = [], config = null, configured = false }) {
  const detail = parseJson(run?.detail_json);
  const snapshot = detail.query_set || null;
  const entries = evidence.map(e => ({ ...e, citation_urls: parseJson(e.citation_urls_json, []), accuracy: parseJson(e.accuracy_json) }));
  const discovery = entries.filter(e => e.ok && e.accuracy.kind !== 'branded');
  const domain = normalizeHost(site.website_uri || site.url);
  // Competitors registered after a run are counted against that run's stored
  // evidence: every cited URL of every answer is kept, so this is a recount of
  // what was observed, not a new measurement. Each row says which it is.
  const measuredWith = new Set(snapshot?.competitors || []);
  const hosts = [...new Set([domain, ...(snapshot?.competitors || []), ...(config?.competitors || [])])].filter(Boolean);
  const counts = hosts.map(host => ({ host, own: host === domain, recounted: host !== domain && !measuredWith.has(host),
    citations: discovery.filter(e => e.citation_urls.some(u => matches(u,host))).length }));
  const total = counts.reduce((n,r) => n+r.citations, 0);
  const competitors = counts.map(r => ({ ...r, frequency: discovery.length >= 2 ? r.citations/discovery.length : null, share_of_voice: total && discovery.length >= 2 ? r.citations/total : null }));
  const presence = (snapshot?.questions || []).map(question => {
    const rows = discovery.filter(e => e.question === question);
    return { question, answers: rows.length, citations: rows.filter(e=>e.brand_cited).length,
      frequency: rows.length >= 2 ? rows.filter(e=>e.brand_cited).length/rows.length : null };
  });
  const trend = snapshot ? runs.filter(r => { const d = parseJson(r.detail_json); return d.cache_key && d.cache_key === detail.cache_key; })
    .map(r => ({ id:r.id, ran_at:r.ran_at, citation_rate:r.citation_rate, answers_received:r.answers_received })).reverse() : [];
  return { version:'pro-report-v1', site_id:site.id, generated_at:new Date().toISOString(), notice:VARIABILITY_NOTICE,
    status:run?.status || (configured ? 'no_data' : 'unconfigured'), configured, run_id:run?.id || null,
    summary:{ answers:discovery.length, citation_rate:discovery.length >= 2 ? discovery.filter(e=>e.brand_cited).length/discovery.length : null,
      evidence_available:entries.length > 0, legacy_data:!!run && !snapshot },
    query_set:snapshot, current_query_set:config, presence, competitors, trend,
    sov_basis:'自社＋指定競合の回答単位の引用回数合計。1回答で同じドメインを複数引用しても1回。失敗は分母から除外。サブドメインは同じ競合として数える。',
    recount_note: counts.some(r => r.recounted) ? '測定後に登録した競合は、保存済みの引用URL一覧から再集計しています（新たなAI問い合わせはしていません）。' : null,
    gaps:presence.filter(r=>r.answers >= 2 && r.citations === 0).map(r=>({ question:r.question, reason:'このサンプルでは引用なし。原因は未判定。' })),
    accuracy:entries.map(e=>({ evidence_id:e.id, question:e.question, ...e.accuracy })), evidence:entries };
}
export async function loadProReport(env, site) {
  const result = await env.DB.prepare('SELECT * FROM aeo_sov_runs WHERE site_id=? ORDER BY ran_at DESC LIMIT 52').bind(site.id).all();
  const runs = result.results || [], run = runs[0] || null;
  const evidence = run ? (await env.DB.prepare('SELECT * FROM aeo_sov_evidence WHERE site_id=? AND run_id=? ORDER BY measured_at,id').bind(site.id,run.id).all()).results || [] : [];
  return buildProReport({ site,run,runs,evidence,config:await loadQuerySet(env,site.id),configured:!!String(env.PERPLEXITY_API_KEY || '').trim() });
}
