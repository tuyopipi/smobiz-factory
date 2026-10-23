import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { measureSov, storeSovRun, sovRecordUsage, sovRemainingBudget } from '../worker/aeo-sov.mjs';
import { saveQuerySet, loadQuerySet, loadProReport, reviewEvidence, acquireMeasurementLock, releaseMeasurementLock, loadCachedRun, measurementKey } from '../worker/pro-report.mjs';
const sqlite = new DatabaseSync(':memory:');
for (const file of ['0018_aeo_sov.sql','0022_sov_engine_split.sql','0031_pro_measurement.sql','0034_sov_evidence_usage.sql']) sqlite.exec(readFileSync(new URL('../nurevo-impl/db/'+file,import.meta.url),'utf8'));
sqlite.exec(`CREATE TABLE aeo_scores(site_id TEXT,scanned_at TEXT,ruleset_version INTEGER,delivered_ruleset_version INTEGER,score_model_version TEXT);
CREATE TABLE aeo_learning_observations(run_id TEXT PRIMARY KEY,site_id TEXT,measured_at TEXT,score_scanned_at TEXT,scoring_ruleset_version INTEGER,delivered_ruleset_version INTEGER,model_version TEXT,measurement_json TEXT);`);
// Applying the additive migration a second time must be harmless.
sqlite.exec(readFileSync(new URL('../nurevo-impl/db/0031_pro_measurement.sql',import.meta.url),'utf8'));
const DB = { prepare(sql) { return { bind(...args) { const stmt=sqlite.prepare(sql); return {
  async first() { return stmt.get(...args) || null; }, async all() { return {results:stmt.all(...args)}; },
  async run() { return {meta:stmt.run(...args)}; }
}; } }; }, async batch(statements) { sqlite.exec('BEGIN'); try { for(const s of statements) await s.run(); sqlite.exec('COMMIT'); } catch(e) { sqlite.exec('ROLLBACK'); throw e; } } };
const env={DB,PERPLEXITY_API_KEY:'mock-only'};
const site={id:'nurevo-qa',url:'https://nurevo.jp'};
const profile={name:'Nurevo',host:'nurevo.jp',aliases:['Nurevo']};
const config=await saveQuerySet(env,site.id,{questions:['AI検索対策サービスは？','WordPressのAEO対策は？'],repetitions:2,competitors:['other.example']});
assert.equal((await loadQuerySet(env,site.id)).version,1);
await assert.rejects(()=>saveQuerySet(env,site.id,{questions:['ok'],repetitions:50,competitors:[]}),/invalid_repetitions/);
await assert.rejects(()=>saveQuerySet(env,site.id,{questions:['ok'],repetitions:2,competitors:['https://invalid.test/path']}),/invalid_competitor_domain/);
const token=await acquireMeasurementLock(env,site.id);
assert.ok(token); assert.equal(await acquireMeasurementLock(env,site.id),null);
await releaseMeasurementLock(env,site.id,'wrong-token'); assert.equal(await acquireMeasurementLock(env,site.id),null);
await releaseMeasurementLock(env,site.id,token); assert.ok(await acquireMeasurementLock(env,site.id));
let calls=0;
const fetchImpl=async()=>{ calls++; return new Response(JSON.stringify({choices:[{message:{content:'NurevoはAI検索対策サービスです。'}}],citations:calls%2 ? ['https://other.example/a','https://nurevo.jp/a','https://nurevo.jp/b'] : ['https://other.example/a']})); };
const result=await measureSov(env,profile,{questions:config.questions,repetitions:2,engineIds:['perplexity'],fetchImpl});
assert.equal(calls,4); assert.equal(result.citation_rate,0.5); assert.equal(result.samples[0].citation_rank,2);
assert.deepEqual(result.samples.map(s=>s.sample_index),[1,2,1,2]);
result.query_set=config; result.cache_key=await measurementKey(env,config,profile);
await storeSovRun(env,site.id,result,{now:Date.now()-2000});
let report=await loadProReport(env,site);
assert.equal(report.evidence.length,4); assert.equal(report.presence[0].frequency,0.5);
// Headline Pro metric: appearance rate (the mock answer names "Nurevo" every
// time); the citation rate (our URL among sources, half the time) is secondary.
assert.equal(report.summary.headline,'appearance_rate');
assert.equal(report.summary.appearance_rate,1); assert.equal(report.summary.citation_rate,0.5);
assert.equal(report.presence[0].appearances,2); assert.equal(report.presence[0].appearance_rate,1);
assert.equal(report.trend[0].appearance_rate,1); assert.equal(report.trend[0].citation_rate,0.5);
assert.equal(report.competitors.find(c=>c.own).share_of_voice,2/6);
assert.equal(report.competitors.find(c=>!c.own).citations,4);
assert.ok(report.accuracy.every(e=>e.status==='unreviewed'));
assert.equal((await loadCachedRun(env,site.id,result.cache_key)).cached,true);
assert.equal(await loadCachedRun(env,site.id,'changed'),null);
await storeSovRun(env,site.id,result,{now:Date.now()-1000});
assert.equal((await loadProReport(env,site)).trend.length,2);
// History survives a competitor edit: the query-set row's version, updated_at
// and competitors change (and so does the cache key), but the series measured
// - engine, language, questions - does not. This used to reset the trend to 1.
const edited=await saveQuerySet(env,site.id,{questions:config.questions,repetitions:2,competitors:['other.example','third.example']});
assert.equal(edited.version,2);
const editedKey=await measurementKey(env,edited,profile);
assert.notEqual(editedKey,result.cache_key,'the cache key does change on an edit');
await storeSovRun(env,site.id,{...result,query_set:edited,cache_key:editedKey},{now:Date.now()-500});
assert.equal((await loadProReport(env,site)).trend.length,3,'the trend keeps all three runs across the competitor edit');
// Re-ordering or re-spacing the same questions is the same series too.
await storeSovRun(env,site.id,{...result,query_set:{...edited,questions:[...edited.questions].reverse().map(q=>' '+q+' ')},cache_key:'whitespace'},{now:Date.now()-400});
assert.equal((await loadProReport(env,site)).trend.length,4);
// Different questions or a different language are a different series.
await storeSovRun(env,site.id,{...result,query_set:{...edited,questions:['別の質問は？']},cache_key:'different-questions'},{now:Date.now()-300});
report=await loadProReport(env,site); assert.equal(report.trend.length,1);
await storeSovRun(env,site.id,{...result,query_set:{...config,language:'en'},cache_key:'english'},{now:Date.now()-200});
report=await loadProReport(env,site); assert.equal(report.trend.length,1,'a language change starts a new series');
// A row from before snapshots existed (no query_set) still joins on its exact cache key.
await storeSovRun(env,site.id,{...result,query_set:null,cache_key:'english'},{now:Date.now()-250});
await storeSovRun(env,site.id,{...result,query_set:null,cache_key:'unrelated'},{now:Date.now()-240});
report=await loadProReport(env,site); assert.equal(report.trend.length,2,'legacy rows fall back to the exact cache key');
await reviewEvidence(env,site.id,report.evidence[0].id,{status:'confirmed_error',note:'QA fixture: factual comparison pending'},'reviewer');
assert.equal((await loadProReport(env,site)).accuracy.filter(e=>e.status==='confirmed_error').length,1);
await assert.rejects(()=>reviewEvidence(env,'other-site',report.evidence[0].id,{status:'confirmed_error',note:'x'},'reviewer'),/evidence_not_found/);
await sovRecordUsage(env,site.id,40); await sovRecordUsage(env,site.id,-36);
assert.equal((await sovRemainingBudget(env,site.id)).used,4);
let forbiddenCalls=0;
const missing=await measureSov({OPENAI_API_KEY:'unused'},profile,{engineIds:['perplexity'],fetchImpl:async()=>{ forbiddenCalls++; throw Error('must not call'); }});
assert.equal(missing.status,'unconfigured'); assert.equal(missing.citation_rate,null); assert.equal(forbiddenCalls,0);
const failure=await measureSov(env,profile,{questions:['one'],fetchImpl:async()=>new Response('{}')});
assert.equal(failure.answers_received,0); assert.equal(failure.samples[0].error,'empty_answer');
const capped=await measureSov(env,profile,{questions:config.questions,repetitions:3,budget:3,fetchImpl});
assert.equal(capped.queries_used,3); assert.equal(capped.truncated,true);
sqlite.close();
console.log('Pro report tests passed (mock engine + real SQLite migration/persistence/locking/review/history)');
