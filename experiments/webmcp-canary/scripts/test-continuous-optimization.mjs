import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {handleApi,diagnosticOptions,buildJsonLd,renderHostedStore,hostedSchema,centralLlmsForKey} from '../worker/api.mjs';
import {diagnoseAeoUrl,extractAeoSignals,scoreAeo} from '../worker/aeo-score.mjs';
import {storeAeoScore,runAeoScoreCron} from '../worker/diagnose.mjs';
import {recordFetched,verifyDelivery} from '../worker/aeo-delivery.mjs';
import {requestAutoFix} from '../worker/aeo-autofix.mjs';
import {observedBusinessFacts} from '../worker/aeo-harvest.mjs';
import {storeSovRun} from '../worker/aeo-sov.mjs';
import {DEFAULT_SCORING,DEFAULT_GENERATION} from '../worker/aeo-rules.mjs';
const sqlite=new DatabaseSync(':memory:');
const sqlFile=f=>readFileSync(new URL('../nurevo-impl/db/'+f,import.meta.url),'utf8');
sqlite.exec(sqlFile('schema.sql'));
sqlite.exec('ALTER TABLE sites ADD COLUMN manual_plan TEXT; ALTER TABLE orgs ADD COLUMN manual_plan TEXT;');
for (const f of ['0013_aeo_rulesets.sql','0014_aeo_scores.sql','0015_aeo_ruleset_activations.sql','0016_aeo_learning.sql','0026_ruleset_v3_schema_advance.sql','0031_pro_measurement.sql']) sqlite.exec(sqlFile(f));
const legacy=JSON.parse(sqlite.prepare('SELECT definition_json FROM aeo_rulesets WHERE active=1').get().definition_json);
sqlite.exec(sqlFile('0032_continuous_optimization.sql'));
const DB={prepare(sql){const wrap=args=>({async first(){return sqlite.prepare(sql).get(...args)||null;},async all(){return {results:sqlite.prepare(sql).all(...args)};},async run(){return {meta:sqlite.prepare(sql).run(...args)};}});return {...wrap([]),bind(...args){return wrap(args);}};},async batch(statements){sqlite.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());sqlite.exec('COMMIT');return out;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
const env={DB};
sqlite.exec(`INSERT INTO orgs(id) VALUES('o1'); INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,created_at) VALUES('s1','o1','example.test','https://example.test/','nrv_test','wp','standard',1);
INSERT INTO site_settings(site_id,name,business_type_schema,serve_schema,allow_crawlers,description,email,tel,address,hours,lat,lng) VALUES('s1','Fixture Cafe','CafeOrCoffeeShop',1,1,'Real description','owner@example.test','0312345678','〒100-0001 東京都千代田区千代田1-1','Mon 9-17',35.6,139.7);`);
const active=()=>sqlite.prepare('SELECT * FROM aeo_rulesets WHERE active=1').get();
assert.equal(active().version,4);
const definition=JSON.parse(active().definition_json);
assert.deepEqual(definition.scoring,DEFAULT_SCORING);
assert.deepEqual(definition.generation,DEFAULT_GENERATION);
assert.equal(sqlite.prepare('SELECT definition_json FROM aeo_rulesets WHERE version=3').get().definition_json.includes('scoring'),false,'historical definition untouched');
const profile=sqlite.prepare('SELECT * FROM site_settings WHERE site_id=?').get('s1');
const site=sqlite.prepare('SELECT * FROM sites WHERE id=?').get('s1');
const schema=buildJsonLd(site,profile,active());
const html=`<h1>Fixture Cafe</h1><h2>Address</h2><p>Fixture Cafe Tokyo phone:0312345678 Mon 9-17 2026 Real description website https://example.test</p><script type="application/ld+json">${JSON.stringify(schema)}</script>`;
// Migration preserves the old criteria and scoring for every entity family.
for(const type of ['CafeOrCoffeeShop','SoftwareApplication','Product','Service','Article']) {
  const page=html.replaceAll('CafeOrCoffeeShop',type);
  const before=extractAeoSignals(page,'','',{schemaRules:legacy.schema,entityType:type});
  const after=extractAeoSignals(page,'','',{schemaRules:definition.schema,scoring:definition.scoring,entityType:type});
  assert.deepEqual(after.schemaFields,before.schemaFields,'criteria preserved for '+type);
  assert.deepEqual(scoreAeo(after,definition.scoring),scoreAeo(before),'score preserved for '+type);
}
const config=async()=>{const res=await handleApi(new Request('https://nurevo.jp/api/tag/config?k=nrv_test'),env,{});assert.equal(res.status,200);return res.json();};
const first=await config();
assert.equal(first.ruleset_version,4);
assert.equal(sqlite.prepare('SELECT * FROM aeo_site_delivery').get(),undefined,'fetch alone never verifies delivery');
const fetchFixture=(body,version=5)=>async(url,init={})=>init.method==='HEAD'?new Response(null,{status:200}):new Response(String(url).endsWith('/robots.txt')?'User-agent: *\nAllow: /\n# nurevo-aeo-ruleset:'+version:String(url).endsWith('/llms.txt')?'# Fixture Cafe\nAddress: Tokyo phone:0312345678 https://example.test/\n'+ 'real information '.repeat(12)+'\n# nurevo-aeo-ruleset:'+version:body);
let result=await diagnoseAeoUrl('https://example.test/',{...await diagnosticOptions(env,'s1'),fetchImpl:fetchFixture(html)});
result.scannedAt='2026-10-20T01:00:00.000Z';
assert.equal((await storeAeoScore(env,'s1',result)).deliveredRulesetVersion,null,'no marker means unverified');
const rule5=structuredClone(definition);
rule5.generation.properties.contactPoint={object:{'@type':{literal:'ContactPoint'},email:{source:'email'}},requires:['email'],optIn:true};
rule5.schema.fields.contactPoint=true;
rule5.generation.entityTemplates.WebSite.alternateName={source:"name"};
rule5.scoring.weights={schema:35,coverage:20,legibility:20,llms:15,consistency:10};
rule5.scoring.llmsOk=0.9;
sqlite.prepare('INSERT INTO aeo_rulesets VALUES(?,?,?,?,?)').run(5,'2026-10-20',JSON.stringify(rule5),0,'test newer rule');
sqlite.exec('UPDATE aeo_rulesets SET active=0; UPDATE aeo_rulesets SET active=1 WHERE version=5;');
const second=await config();
assert.equal(second.ruleset_version,5);
const llmsOutput=await centralLlmsForKey(env,"nrv_test");
assert.match(llmsOutput,/# nurevo-aeo-ruleset:5/);
assert.match(llmsOutput,/Real description/);
assert.equal(second.jsonld.contactPoint.email,profile.email,'new declarative property generated without JS changes');
assert.equal(sqlite.prepare('SELECT * FROM aeo_site_delivery').get(),undefined,'new version fetched still not verified');
const tmp=mkdtempSync(join(tmpdir(),'aeo-delivery-'));
let wp;
try{
  // Send a real config payload through actual PHP sync + schema emitter.
  const job={requested_at:'2026-10-20T01:30:00.000Z',actions_json:JSON.stringify(['publish_schema','harvest_profile','publish_llms','allow_crawlers']),missing_json:JSON.stringify({action_required:true,missing_fields:[{entityType:'LocalBusiness',field:'geo'}]})};
  writeFileSync(join(tmp,'config.json'),JSON.stringify({...second,autofix:job}));
  wp=JSON.parse(execFileSync('php',['scripts/render-aeo-delivery-fixture.php',join(tmp,'config.json')],{encoding:'utf8'}));
}finally{rmSync(tmp,{recursive:true,force:true});}
assert.equal(wp.state.version,5);
assert.match(wp.html,/"alternateName":"Fixture Cafe"/,"new central template changes local WP content generation too");
assert.match(wp.robots,/# nurevo-aeo-ruleset:5/);
assert.equal(wp.flushes,1);
const served=html.replace(/<script[\s\S]*<\/script>/,'')+wp.html;
result=await diagnoseAeoUrl('https://example.test/',{...await diagnosticOptions(env,'s1'),fetchImpl:fetchFixture(served)});
result.scannedAt='2026-10-20T02:00:00.000Z';
assert.equal((await storeAeoScore(env,'s1',result)).deliveredRulesetVersion,5);
let stored=sqlite.prepare('SELECT * FROM aeo_scores ORDER BY scanned_at DESC LIMIT 1').get();
assert.equal(stored.ruleset_version,5);assert.equal(stored.delivered_ruleset_version,5);assert.equal(stored.score_model_version,'u1-v4');
const mixed=await diagnoseAeoUrl('https://example.test/',{...await diagnosticOptions(env,'s1'),fetchImpl:fetchFixture(served,4)});
assert.equal(await verifyDelivery(env,'s1',mixed),null,'schema/robots/llms versions must agree');
const wrong=await diagnoseAeoUrl('https://example.test/',{...await diagnosticOptions(env,'s1'),fetchImpl:fetchFixture(served.replace('owner@example.test','wrong@example.test'))});
assert.equal(await verifyDelivery(env,'s1',wrong),null,'marker with wrong generated payload is rejected');
const cachedOld=await diagnoseAeoUrl('https://example.test/',{...await diagnosticOptions(env,'s1'),fetchImpl:fetchFixture(html+'<script id="nurevo-aeo-delivery" type="application/json">{"version":4}</script>',4)});
assert.equal(await verifyDelivery(env,'s1',cachedOld),4,'old cached HTML records old delivered version despite newly fetched v5');
assert.equal(cachedOld.rulesetVersion,5,'scoring snapshot remains the current criterion');
// Central rule inputs change weights and thresholds, not only labels.
assert.notDeepEqual(scoreAeo({aiCrawlersAllowed:true,serverRenderedHtml:true,jsonLdInRawHtml:true,schemaValid:true,schemaTypeMatches:true,schemaCoreProps:1},definition.scoring),scoreAeo({aiCrawlersAllowed:true,serverRenderedHtml:true,jsonLdInRawHtml:true,schemaValid:true,schemaTypeMatches:true,schemaCoreProps:1},rule5.scoring));
// Unknown facts remain missing; the existing job is bounded to once per day.
const jobResult=await requestAutoFix(env,site,result,{now:Date.parse('2026-10-20T03:00:00Z')});
assert.ok(jobResult.actions.length>0);
assert.equal((await requestAutoFix(env,site,result,{now:Date.parse('2026-10-20T03:00:01Z')})).status,'rate_limited');
assert.equal(JSON.parse(sqlite.prepare('SELECT missing_json FROM aeo_autofix_jobs').get().missing_json).action_required,true);
sqlite.exec("UPDATE sites SET plan='free' WHERE id='s1';");
assert.equal((await requestAutoFix(env,site,result,{now:Date.parse('2026-10-22T03:00:00Z')})).status,'ineligible');
sqlite.exec("UPDATE sites SET plan='pro' WHERE id='s1';");
const explicit={'@type':'LocalBusiness',name:'Fixture Cafe',url:'https://example.test/',address:{streetAddress:'Actual address'},geo:{latitude:0,longitude:139},sameAs:['https://instagram.com/real','javascript:bad']};
assert.deepEqual(observedBusinessFacts([explicit],site,{name:'Fixture Cafe'}),{address:'Actual address',lat:0,lng:139,sameAs:['https://instagram.com/real']});
assert.deepEqual(observedBusinessFacts([{...explicit,url:'https://other.test'}],site,{}),{});
assert.deepEqual(observedBusinessFacts([explicit,explicit],site,{}),{});
assert.equal(observedBusinessFacts([{...explicit,geo:{latitude:91,longitude:139}}],site,{}).lat,undefined);
assert.equal(observedBusinessFacts([{...explicit,geo:{latitude:'',longitude:139}}],site,{}).lat,undefined,'empty coordinate is never converted to zero');
assert.equal(observedBusinessFacts([explicit],site,{address:'Different owner address'}).lat,undefined,'conflicting address needs owner confirmation');
// Hosted output is subject to the same public verification, never just render().
const hosted={...site,...profile,slug:'fixture',id:'s1'};
const hostedPayload=hostedSchema(hosted,'',active());
await recordFetched(env,'s1',5,hostedPayload);
const hostedResult=await diagnoseAeoUrl('https://example.test/',{...await diagnosticOptions(env,'s1'),fetchImpl:fetchFixture(renderHostedStore(hosted,'ja',active()))});
assert.equal(await verifyDelivery(env,'s1',hostedResult),5);
// Pro results are persisted beside the closest prior score, with both versions.
const observation=await storeSovRun(env,'s1',{status:'measured',confidence:'low',answers_received:2,appearance_rate:0.5,citation_rate:0,engines:['mock'],samples:[]},{now:Date.parse('2026-10-20T02:01:00Z')});
const evidence=sqlite.prepare('SELECT * FROM aeo_learning_observations WHERE run_id=?').get(observation.id);
assert.equal(evidence.scoring_ruleset_version,5);assert.equal(evidence.delivered_ruleset_version,5);
await storeSovRun(env,'s1',{status:'unconfigured',appearance_rate:null,citation_rate:null,confidence:'none',samples:[]},{now:Date.parse('2026-10-20T02:02:00Z')});
assert.equal(sqlite.prepare('SELECT count(*) AS n FROM aeo_learning_observations').get().n,1);
assert.equal(active().version,5,'measurements never mutate the active rules');
// Daily scheduled path creates the job through the existing diagnosis cron.
sqlite.exec("DELETE FROM aeo_autofix_jobs WHERE site_id='s1';");
const previousFetch=globalThis.fetch;
globalThis.fetch=fetchFixture(served);
try {
  const cron=await runAeoScoreCron(env,{limit:1});
  assert.equal(cron.processed,1);
  assert.equal(cron.outcomes[0].ok,true);
  assert.ok(cron.outcomes[0].autofix.actions.includes('publish_schema'));
  assert.equal('publicNodes' in cron.outcomes[0].result,false,'cron does not accumulate raw public graphs');
} finally {globalThis.fetch=previousFetch;}
// Rejected score writes cannot advance central delivery state independently.
sqlite.exec("UPDATE aeo_site_delivery SET delivered_version=4,verified_at='2026-10-19T00:00:00.000Z' WHERE site_id='s1';");
await recordFetched(env,'s1',5,second.jsonld);
await assert.rejects(()=>storeAeoScore(env,'s1',result),/UNIQUE constraint/);
assert.equal(sqlite.prepare("SELECT delivered_version FROM aeo_site_delivery WHERE site_id='s1'").get().delivered_version,4);
// Invalid central definitions fail closed rather than silently labelling defaults v5.
const invalid=structuredClone(rule5);invalid.scoring.weights.schema=-1;
sqlite.prepare('UPDATE aeo_rulesets SET definition_json=? WHERE version=5').run(JSON.stringify(invalid));
await assert.rejects(()=>diagnosticOptions(env,'s1'),/active_ruleset_invalid/);
sqlite.prepare('UPDATE aeo_rulesets SET definition_json=? WHERE version=5').run(JSON.stringify(rule5));
console.log('Continuous optimization passed: migration parity, real PHP config→output→public verification→score tags, old cache/mismatch rejection, daily fixes/owner notice/limits, explicit factual harvesting, hosted output, Pro learning persistence.');
