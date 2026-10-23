// Run only after Hashimoto approves live QA. Does not deploy or modify remote D1.
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { measureSov, buildBrandProfile } from '../worker/aeo-sov.mjs';
import { buildProReport } from '../worker/pro-report.mjs';
const vars = {};
for (const path of ['.env','.dev.vars']) {
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path,'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if(m) vars[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
const key=String(process.env.PERPLEXITY_API_KEY || vars.PERPLEXITY_API_KEY || '').trim();
if (!key) { console.log(JSON.stringify({status:'unconfigured',message:'Perplexity未設定。実APIを呼んでいません。',citation_rate:null})); process.exit(0); }
if (!process.argv.includes('--live-approved')) { console.error('橋本確認後に --live-approved を指定してください。実APIを呼んでいません。'); process.exit(1); }
const env={PERPLEXITY_API_KEY:key};
const site={id:'qa-nurevo',url:'https://nurevo.jp'};
const profile=buildBrandProfile({site,settings:{name:'Nurevo',business_type:'AI検索対策サービス'}});
const config={version:1,questions:['WordPressサイトのAI検索対策に使えるサービスを教えて。','日本語サイトのAEO対策サービスを比較して。'],repetitions:2,competitors:[],engine:'perplexity'};
let calls=0;
const measurement=await measureSov(env,profile,{questions:config.questions,repetitions:2,engineIds:['perplexity'],budget:4,fetchImpl:(...args)=>{ if(++calls > 4) throw Error('QA call cap'); return fetch(...args); }});
const run={id:'qa-'+crypto.randomUUID(),ran_at:new Date().toISOString(),status:measurement.status,citation_rate:measurement.citation_rate,answers_received:measurement.answers_received,detail_json:JSON.stringify({query_set:config,cache_key:'qa-nurevo-v1'})};
const evidence=measurement.samples.map((s,i)=>({id:'qa-'+i,run_id:run.id,site_id:site.id,measured_at:s.measured_at,engine:s.engine,question:s.question,sample_index:s.sample_index,ok:s.ok?1:0,answer_summary:s.excerpt || null,citation_urls_json:JSON.stringify(s.citationUrls || []),brand_cited:s.cited?1:0,citation_rank:s.citation_rank || null,accuracy_json:JSON.stringify({status:'unreviewed',mentioned:s.ok?!!s.mentioned:null,description:s.excerpt || null,error:s.error || null,engine_model:s.engine_model || null})}));
const report=buildProReport({site,run,runs:[run],evidence,config,configured:true});
mkdirSync('qa/pro-reports',{recursive:true});
const path='qa/pro-reports/nurevo-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';
writeFileSync(path,JSON.stringify({...report,qa:{live:true,engine_calls:calls,remote_database_modified:false}},null,2));
console.log(JSON.stringify({status:report.status,answers:report.summary.answers,engine_calls:calls,report:path}));
if (!measurement.answers_received) process.exitCode=1;
