import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import vm from 'node:vm';
import {handleApi} from '../worker/api.mjs';
import {listLeads,salesStatusAvailable,updateSalesStatus} from '../worker/agency-leadgen.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const db=new DatabaseSync(':memory:');
db.exec(read('nurevo-impl/db/schema.sql'));
for(const f of ['0029_member_email_preferences.sql','0030_account_referrals.sql','0040_partner_approval_first_customer.sql'])db.exec(read('nurevo-impl/db/'+f));
const DB={prepare(sql){const wrap=args=>({async all(){return {results:db.prepare(sql).all(...args)};},async first(){return db.prepare(sql).get(...args)||null;},async run(){return {meta:{changes:Number(db.prepare(sql).run(...args).changes)}};}});return {...wrap([]),bind:(...args)=>wrap(args)};}};
const env={DB,WEBMCP_ALLOWED_ORIGINS:'https://nurevo.jp'};
for(const [id,role,status] of [['a','admin','approved'],['b','admin','approved'],['v','viewer','approved'],['n','admin','none']]){
  db.prepare('INSERT INTO orgs(id) VALUES(?)').run(id);
  db.prepare('INSERT INTO members(id,org_id,email,role,status,created_at) VALUES(?,?,?,?,?,1)').run(id,id,id+'@test.example',role,'active');
  db.prepare('INSERT INTO accounts(member_id,email,created_at,partner_status,partner_approved_at) VALUES(?,?,1,?,10)').run(id,id+'@test.example',status);
  db.prepare('INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES(?,?,?,?,?)').run(createHash('sha256').update(id).digest('hex'),id,id,'session',Date.now()+3600000);
}
const acct=id=>db.prepare('SELECT id FROM accounts WHERE member_id=?').get(id).id;
const lead=id=>Number(db.prepare("INSERT INTO agency_leads(account_id,source,site_url,name,email,locale,consent_text,consent_at,created_at) VALUES(?,'widget','https://example.com','Customer','c@example.com','en','consented',1,1)").run(acct(id)).lastInsertRowid);
const a=lead('a'), b=lead('b');
const token='c'.repeat(64);
async function call(method,path,body,who='a',csrf=true){return handleApi(new Request('https://nurevo.jp'+path,{method,headers:{origin:'https://nurevo.jp',cookie:`${who?'nrv_session='+who+'; ':''}nrv_csrf=${token}`,...(csrf?{'x-csrf-token':token}:{}),'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})}),env);}
const path=id=>`/api/agency/leads/${id}/sales-status`;
assert.equal((await call('PUT',path(a),{status:'trial'},null)).status,401);
assert.equal((await call('PUT',path(a),{status:'trial'},'a',false)).status,403);
assert.equal((await call('PUT',path(a),{status:'trial'},'v')).status,403);
assert.equal((await call('PUT',path(a),{status:'trial'},'n')).status,403);
assert.equal((await call('PUT',path(b),{status:'trial'})).status,404);
assert.equal((await call('PUT',path(a),{status:'paid'})).status,400);
assert.equal((await call('PUT',path(a),null)).status,400);
assert.equal((await call('PUT',path(a),{status:'trial'})).status,200);
assert.equal((await listLeads(env,acct('a')))[0].sales_status,'trial');
assert.equal((await listLeads(env,acct('b')))[0].sales_status,'new');
assert.equal(await updateSalesStatus(env,acct('a'),a,'won',123),true);
assert.equal((await listLeads(env,acct('a')))[0].sales_updated_at,123);
assert.equal(await updateSalesStatus(env,acct('a'),-1,'new'),false);
assert.equal((await (await call('GET','/api/agency/leads')).json()).can_edit_sales,true);
// Applying the additive migration to a legacy table preserves old leads.
db.exec('ALTER TABLE agency_leads DROP COLUMN sales_status; ALTER TABLE agency_leads DROP COLUMN sales_updated_at;');
assert.equal(await salesStatusAvailable(env),false);
assert.equal((await listLeads(env,acct('a'))).length,1);
assert.equal((await call('PUT',path(a),{status:'trial'})).status,503);
db.exec(read('nurevo-impl/db/0051_agency_sales_status.sql'));
assert.equal(await salesStatusAvailable(env),true);
assert.equal((await listLeads(env,acct('a')))[0].sales_status,'new');
const context={};vm.runInNewContext(read('public/agency-sales-kit.js'),context);
const kit=context.NurevoSalesKit;
for(const language of ['en','ja']){
 const proposal=kit.build({agency:'Agency <script>alert(1)</script>',customer:'Client',url:'https://example.com',date:'2026-11-16',findings:'Observed only',scope:'Agreed scope',next:'Approval'},language);
 assert.ok(proposal.includes('Nurevo AIO'));assert.ok(proposal.includes(kit.copy[language].disclaimer));assert.ok(proposal.includes(kit.copy[language].emptyFees));
}
assert.ok(!read('public/agency-sales-kit.js').includes('localStorage'));
console.log('PASS agency sales: tenant isolation, roles, CSRF, status validation, legacy migration, safe proposal model. No external calls.');

// Production routing: a 200 LP fallback is not the proposal editor. Route all
// linked entry URLs, canonical redirects and assets to this Worker's ASSETS.
{
 const config=read('wrangler.jsonc');
 const patterns=[...config.matchAll(/"pattern"\s*:\s*"([^"\n]+)"/g)].map(m=>m[1]);
 const matches=(url)=>patterns.some(p=>p.endsWith('*')?url.startsWith(p.slice(0,-1)):url===p);
 for(const path of ['/agency-sales-kit.html','/agency-sales-kit','/agency-sales-kit.html?lead=7&lang=ja','/agency-sales-kit?lang=en','/agency-sales-kit.js','/agency-sales-kit.css'])assert.ok(matches('nurevo.jp'+path), `Worker route covers ${path}`);
 for(const path of ['/','/ja/','/en/','/ja/agency/','/assets/logo.png'])assert.equal(matches('nurevo.jp'+path),false, `Pages keeps ${path}`);
 const html=read('public/agency-sales-kit.html');
 assert.ok(html.includes('id="proposal-form"'));
 for(const file of ['agency-sales-kit.js','agency-sales-kit.css']){assert.ok(html.includes(file));assert.ok(read('public/'+file).length>100);}
 console.log('PASS agency sales production routes: editor, canonical URL, query strings and dependencies; unrelated LP paths untouched.');
}
