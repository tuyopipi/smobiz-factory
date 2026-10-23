import { SovError, normalizeHost, buildQuestionSet, availableEngines, profileIdentity, SOV_LANGUAGES } from './aeo-sov.mjs';

export const VARIABILITY_NOTICE = 'AI回答・引用は実行日時やモデルで変動します。小規模サンプルの観測値であり、絶対値・順位・正確性を保証しません。引用順位は提供元の出典URL一覧の順序です。';

/*
 * The report's own sentences, in the dashboard's eight languages. Japanese is
 * the original wording and must stay byte-identical (a golden test holds it);
 * a request with no language at all keeps Japanese, as it always was.
 * The monthly report HTML (aeo-report.mjs) is still Japanese-only.
 */
export const PRO_REPORT_LANGS = Object.freeze(['ja', 'en', 'zh', 'zh-TW', 'ko', 'es', 'fr', 'de']);
const PRO_REPORT_TEXT = Object.freeze({
  ja: {
    notice: VARIABILITY_NOTICE,
    sov_basis: '自社＋指定競合の回答単位の引用回数合計。1回答で同じドメインを複数引用しても1回。失敗は分母から除外。サブドメインは同じ競合として数える。',
    recount_note: '測定後に登録した競合は、保存済みの引用URL一覧から再集計しています（新たなAI問い合わせはしていません）。',
    gap_reason: 'このサンプルでは引用なし。原因は未判定。',
  },
  en: {
    notice: 'AI answers and citations vary with the time of the run and the model. These are observations from a small sample and do not guarantee absolute values, rankings or accuracy. Citation rank is the order of the provider’s list of source URLs.',
    sov_basis: 'Total citations per answer across your site and the listed competitors. A domain cited several times in one answer counts once. Failed answers are excluded from the denominator. Subdomains count as the same competitor.',
    recount_note: 'Competitors added after the measurement are recounted from the stored citation URLs (no new AI queries were made).',
    gap_reason: 'Not cited in this sample. Cause not determined.',
  },
  zh: {
    notice: 'AI 回答和引用会因执行时间和模型而变化。这些是小样本的观测值，不保证绝对数值、排名或准确性。引用排名是服务提供方来源 URL 列表中的顺序。',
    sov_basis: '自有网站与指定竞争对手按回答计的引用次数合计。同一回答中多次引用同一域名只计 1 次。失败的回答不计入分母。子域名按同一竞争对手计算。',
    recount_note: '测量后添加的竞争对手是根据已保存的引用 URL 列表重新统计的（未进行新的 AI 查询）。',
    gap_reason: '本次样本中未被引用。原因尚未判定。',
  },
  'zh-TW': {
    notice: 'AI 回答與引用會因執行時間和模型而變動。這些是小樣本的觀測值，不保證絕對數值、排名或正確性。引用排名是服務提供者來源 URL 清單中的順序。',
    sov_basis: '自家網站與指定競爭對手以回答為單位的引用次數合計。同一回答中多次引用同一網域只計 1 次。失敗的回答不計入分母。子網域視為同一競爭對手。',
    recount_note: '測量後新增的競爭對手是依已儲存的引用 URL 清單重新統計（未進行新的 AI 查詢）。',
    gap_reason: '本次樣本中未被引用。原因尚未判定。',
  },
  ko: {
    notice: 'AI 답변과 인용은 실행 시점과 모델에 따라 달라집니다. 소규모 표본의 관측값이며 절대값, 순위, 정확성을 보장하지 않습니다. 인용 순위는 제공자의 출처 URL 목록 순서입니다.',
    sov_basis: '자사와 지정한 경쟁사의 답변 단위 인용 횟수 합계입니다. 한 답변에서 같은 도메인을 여러 번 인용해도 1회로 셉니다. 실패한 답변은 분모에서 제외합니다. 하위 도메인은 같은 경쟁사로 셉니다.',
    recount_note: '측정 후 등록한 경쟁사는 저장된 인용 URL 목록으로 다시 집계했습니다(새 AI 질의는 하지 않았습니다).',
    gap_reason: '이 표본에서는 인용되지 않았습니다. 원인은 판단하지 않았습니다.',
  },
  es: {
    notice: 'Las respuestas y citas de la IA varían según el momento de la ejecución y el modelo. Son observaciones de una muestra pequeña y no garantizan valores absolutos, posiciones ni exactitud. La posición de cita es el orden de la lista de URL de fuentes del proveedor.',
    sov_basis: 'Total de citas por respuesta entre su sitio y los competidores indicados. Un dominio citado varias veces en una respuesta cuenta una vez. Las respuestas fallidas se excluyen del denominador. Los subdominios cuentan como el mismo competidor.',
    recount_note: 'Los competidores añadidos después de la medición se recuentan a partir de las URL de citas guardadas (no se hicieron nuevas consultas a la IA).',
    gap_reason: 'Sin citas en esta muestra. Causa no determinada.',
  },
  fr: {
    notice: 'Les réponses et citations de l’IA varient selon le moment de l’exécution et le modèle. Ce sont des observations sur un petit échantillon, sans garantie de valeurs absolues, de classement ni d’exactitude. Le rang de citation correspond à l’ordre de la liste des URL sources du fournisseur.',
    sov_basis: 'Total des citations par réponse pour votre site et les concurrents indiqués. Un domaine cité plusieurs fois dans une même réponse compte une fois. Les réponses en échec sont exclues du dénominateur. Les sous-domaines comptent comme le même concurrent.',
    recount_note: 'Les concurrents ajoutés après la mesure sont recomptés à partir des URL de citation enregistrées (aucune nouvelle requête IA).',
    gap_reason: 'Aucune citation dans cet échantillon. Cause non déterminée.',
  },
  de: {
    notice: 'KI-Antworten und Zitate schwanken je nach Ausführungszeitpunkt und Modell. Es handelt sich um Beobachtungen aus einer kleinen Stichprobe ohne Gewähr für absolute Werte, Rangfolge oder Richtigkeit. Der Zitierrang ist die Reihenfolge in der Quell-URL-Liste des Anbieters.',
    sov_basis: 'Summe der Zitate pro Antwort für Ihre Website und die angegebenen Wettbewerber. Eine Domain, die in einer Antwort mehrfach zitiert wird, zählt einmal. Fehlgeschlagene Antworten werden nicht in den Nenner gerechnet. Subdomains zählen als derselbe Wettbewerber.',
    recount_note: 'Nach der Messung hinzugefügte Wettbewerber werden aus den gespeicherten Zitat-URLs neu gezählt (keine neuen KI-Abfragen).',
    gap_reason: 'In dieser Stichprobe nicht zitiert. Ursache nicht ermittelt.',
  },
});

/**
 * One of PRO_REPORT_LANGS. Accepts the dashboard's own codes ("tw"), BCP 47
 * tags and WordPress locales. Nothing requested means Japanese; a language
 * the report is not written in means English.
 */
export function resolveProReportLang(requested) {
  const raw = String(requested ?? '').trim().replace(/_/g, '-').toLowerCase();
  if (!raw) return 'ja';
  if (raw === 'tw' || raw === 'zh-tw' || raw === 'zh-hk' || raw === 'zh-mo' || raw.startsWith('zh-hant')) return 'zh-TW';
  const base = raw.split('-')[0];
  return PRO_REPORT_LANGS.includes(base) ? base : 'en';
}
export function proReportText(lang) { return PRO_REPORT_TEXT[resolveProReportLang(lang)]; }
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
  if (input.language != null && !SOV_LANGUAGES.includes(input.language)) throw new SovError(422, 'invalid_language');
  // `language` is recorded only for a non-Japanese set, so a Japanese config
  // (and the cache key hashed from it) is byte-identical to before.
  return { questions: [...new Set(input.questions.map(q => q.trim()))], repetitions: input.repetitions,
    competitors: [...new Set(competitors)], engine: 'perplexity',
    ...(input.language && input.language !== 'ja' ? { language: input.language } : {}) };
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
  if (existing && !isStaleDefaultSet(existing, profile)) return existing;
  const config = validateQuerySet({ questions: buildQuestionSet(profile).slice(0, 5), repetitions: 2, competitors: [], language: profile.language });
  if (existing) {
    // Replace only the untouched Japanese default of a site now known to be
    // non-Japanese; the owner's competitors and repetitions are kept.
    return saveQuerySet(env, siteId, { ...config, repetitions: existing.repetitions, competitors: existing.competitors || [] });
  }
  await env.DB.prepare('INSERT OR IGNORE INTO aeo_sov_query_sets(site_id,version,config_json,updated_at) VALUES (?,1,?,?)')
    .bind(siteId, JSON.stringify(config), new Date().toISOString()).run();
  return await loadQuerySet(env, siteId) || { ...config, version: 1 }; // test doubles may not read writes
}

/**
 * A stored set that is exactly the auto-generated Japanese default, for a site
 * whose questions should now be asked in another language. Sets written before
 * languages existed were always Japanese; one the owner edited never matches
 * and is left alone.
 */
function isStaleDefaultSet(existing, profile) {
  if (!profile?.language || profile.language === 'ja' || existing.language) return false;
  // Matched by the template wording rather than by regenerating it: the area
  // in an old set came from the Japanese-only parser and cannot be rebuilt.
  return Array.isArray(existing.questions) && existing.questions.length === JA_DEFAULT_ENDINGS.length
    && existing.questions.every((q, i) => typeof q === 'string' && q.endsWith(JA_DEFAULT_ENDINGS[i]));
}
const JA_DEFAULT_ENDINGS = ['でおすすめはどこ？', 'を探しています。評判の良いところを教えて。', 'を3つ挙げて。', 'の営業時間を知りたい。', 'で予約できるところは？'];
export async function measurementKey(env, config, profile) {
  const raw = JSON.stringify({ config, profile: profileIdentity(profile), model: `agent:${env.PERPLEXITY_PRESET || 'fast'}`, engines: availableEngines(env).filter(e => e.id === 'perplexity') });
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
/**
 * The stable identity of a measurement series: engine + language + the
 * normalised question texts. Competitors, repetitions and the row's
 * version/updated_at are deliberately left out - editing them does not change
 * what the citation and appearance rates measure.
 */
export function trendKey(querySet) {
  if (!querySet || !Array.isArray(querySet.questions) || !querySet.questions.length) return null;
  const questions = [...new Set(querySet.questions.map(q => String(q).normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()).filter(Boolean))].sort();
  return JSON.stringify({ engine: querySet.engine || 'perplexity', language: querySet.language || 'ja', questions });
}
const matches = (url, host) => { const h = normalizeHost(url); return h === host || h.endsWith('.'+host); };
export function buildProReport({ site, run = null, evidence = [], runs = [], config = null, configured = false, lang = 'ja' }) {
  const text = proReportText(lang);
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
  // History is keyed on what is being measured - engine, language and the
  // questions asked - not on the cache key, which hashes the whole query-set
  // row (version, updated_at, competitors) and so reset the trend whenever the
  // owner edited a competitor. Rows are compared by the query_set snapshot
  // every run already stores, so old rows join the history with no migration;
  // a row with no snapshot can still match on its exact cache key.
  const currentTrendKey = trendKey(snapshot);
  const trend = snapshot ? runs.filter(r => {
    const d = parseJson(r.detail_json);
    const key = trendKey(d.query_set);
    return key ? key === currentTrendKey : !!d.cache_key && d.cache_key === detail.cache_key;
  })
    .map(r => ({ id:r.id, ran_at:r.ran_at, citation_rate:r.citation_rate, answers_received:r.answers_received })).reverse() : [];
  return { version:'pro-report-v1', site_id:site.id, generated_at:new Date().toISOString(), notice:text.notice,
    status:run?.status || (configured ? 'no_data' : 'unconfigured'), configured, run_id:run?.id || null,
    summary:{ answers:discovery.length, citation_rate:discovery.length >= 2 ? discovery.filter(e=>e.brand_cited).length/discovery.length : null,
      evidence_available:entries.length > 0, legacy_data:!!run && !snapshot },
    query_set:snapshot, current_query_set:config, presence, competitors, trend,
    sov_basis:text.sov_basis,
    recount_note: counts.some(r => r.recounted) ? text.recount_note : null,
    gaps:presence.filter(r=>r.answers >= 2 && r.citations === 0).map(r=>({ question:r.question, reason:text.gap_reason })),
    accuracy:entries.map(e=>({ evidence_id:e.id, question:e.question, ...e.accuracy })), evidence:entries };
}
export async function loadProReport(env, site, { lang = 'ja' } = {}) {
  const result = await env.DB.prepare('SELECT * FROM aeo_sov_runs WHERE site_id=? ORDER BY ran_at DESC LIMIT 52').bind(site.id).all();
  const runs = result.results || [], run = runs[0] || null;
  const evidence = run ? (await env.DB.prepare('SELECT * FROM aeo_sov_evidence WHERE site_id=? AND run_id=? ORDER BY measured_at,id').bind(site.id,run.id).all()).results || [] : [];
  return buildProReport({ site,run,runs,evidence,config:await loadQuerySet(env,site.id),configured:!!String(env.PERPLEXITY_API_KEY || '').trim(), lang });
}
