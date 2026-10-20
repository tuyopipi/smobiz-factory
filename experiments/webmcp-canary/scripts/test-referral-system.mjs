import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleApi } from '../worker/api.mjs';
import { runReferralLedger, ledgerExport, ledgerCsv, commissionLine, paymentEvidence, wiseSummaryCsv, decimalAmount } from '../worker/referral-ledger.mjs';
import { referralConfig, periodBounds } from '../worker/referral-config.mjs';
import { signReferral, verifyReferral } from '../worker/referral-tokens.mjs';
import { referralLocale, renderReferralReport } from '../worker/referral-flow.mjs';
import { COPY, referralCopy } from '../public/dashboard-referral-copy.mjs';
import { EMAIL_LOCALES, signupLinkEmail } from '../worker/email-i18n.mjs';
const sqlite = new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('../nurevo-impl/db/schema.sql', import.meta.url), 'utf8'));
// schema.sql predates the manual-plan column added by migration 0021.
sqlite.exec('ALTER TABLE sites ADD COLUMN manual_plan TEXT');
sqlite.exec(readFileSync(new URL('../nurevo-impl/db/0029_member_email_preferences.sql', import.meta.url), 'utf8'));
// A preexisting member is backfilled by migration 0030.
sqlite.exec("INSERT INTO orgs(id) VALUES ('old'); INSERT INTO members(id,org_id,email,status) VALUES ('old','old','old@example.test','active')");
sqlite.exec(readFileSync(new URL('../nurevo-impl/db/0030_account_referrals.sql', import.meta.url), 'utf8'));
assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM accounts').get().n, 1);
sqlite.exec(readFileSync(new URL('../nurevo-impl/db/0035_referral_ledger.sql', import.meta.url), 'utf8'));
const DB = {
  prepare(sql) {
    const stmt = sqlite.prepare(sql);
    return { values: [], bind(...values) { return Object.assign(Object.create(this), { values }); },
      async first() { return stmt.get(...this.values) || null; },
      async all() { return { results: stmt.all(...this.values) }; },
      runSync() { const result = stmt.run(...this.values); return { meta: { changes: Number(result.changes) } }; },
      async run() { return this.runSync(); } };
  },
  async batch(statements) { sqlite.exec('BEGIN'); try { const results = statements.map(s => s.runSync()); sqlite.exec('COMMIT'); return results; } catch (e) { sqlite.exec('ROLLBACK'); throw e; } }
};
sqlite.exec(readFileSync(new URL('../nurevo-impl/db/0014_aeo_scores.sql', import.meta.url), 'utf8'));
const env={DB,DEV:'1',REFERRAL_TOKEN_SECRET:'local-test-secret-must-be-at-least-32-characters',RESEND_API_KEY:'test',MAIL_FROM:'test@example.test',STRIPE_SECRET_KEY:'sk_test_fake',STRIPE_PRICE_ID_PRO:'price_pro',SUPER_ADMIN_EMAILS:'parent@example.test'};
const messages=[]; let refund=false, failStripe=false, mixed=false, unknownPayment=false, pagination=false, metadataUpdates=0;
const realFetch=globalThis.fetch;
const paidAt=Date.parse('2026-09-16T00:00:00Z')/1000;
const invoice=(id,currency='jpy',amount=14800)=>({id,number:id,status:'paid',amount_paid:amount,currency,customer:'cus_test',parent:{subscription_details:{subscription:'sub_pro'}},status_transitions:{paid_at:paidAt},lines:{data:[{pricing:{price_details:{price:'price_pro'}}}],has_more:false}});
globalThis.fetch=async(url,options={})=>{
 const u=new URL(url);
 if(u.hostname==='api.resend.com'){messages.push(JSON.parse(options.body));return Response.json({id:'mail'});}
 if(options.method==='POST'){
   assert.match(u.pathname,/^\/v1\/subscriptions\/sub_pro$/);
   assert.deepEqual([...new URLSearchParams(options.body).keys()],['metadata[referred_by]'],'metadata-only update');
   metadataUpdates++;return Response.json({id:'sub_pro'});
 }
 assert.equal(options.method||'GET','GET','no Stripe mutations in reconciliation');
 if(failStripe)return Response.json({error:{}},{status:503});
 if(u.pathname==='/v1/invoices'&&pagination&&!u.searchParams.has('starting_after'))return Response.json({data:[invoice('in_1')],has_more:true});
 if(u.pathname==='/v1/invoices'&&pagination)return Response.json({data:[invoice('in_2','usd',1001)],has_more:false});
 if(u.pathname==='/v1/invoices')return Response.json({data:[invoice('in_1'),invoice('in_2','usd',1001),{...invoice('in_unpaid'),status:'open',amount_paid:0},...(mixed?[{...invoice('in_mixed'),lines:{data:[{price:{id:'price_pro'}},{price:{id:'price_std'}}],has_more:false}}]:[])],has_more:false});
 if(u.pathname==='/v1/invoice_payments'){const id=u.searchParams.get('invoice');return Response.json({data:[{id:'pay_'+id,status:'paid',invoice:id,currency:id==='in_2'?'usd':'jpy',amount_paid:id==='in_2'?1001:14800,payment:unknownPayment?{type:'payment_record'}:{type:'payment_intent',payment_intent:id==='in_2'?'pi_usd':'pi_jpy'}}],has_more:false});}
 if(u.pathname.startsWith('/v1/payment_intents/'))return Response.json({status:'succeeded',latest_charge:u.pathname.endsWith('pi_usd')?'ch_usd':'ch_jpy'});
 if(u.pathname.startsWith('/v1/charges/'))return Response.json({id:u.pathname.split('/').at(-1),status:'succeeded',paid:true,customer:'cus_test',amount:20000,currency:u.pathname.endsWith('ch_usd')?'usd':'jpy',amount_refunded:refund?1:0,refunded:false,disputed:false});
 throw Error('unexpected_request '+u.pathname);
};
let sequence=0;
async function call(path,body,cookie='',fixedIp){const headers={'cf-connecting-ip':fixedIp||`ip-${++sequence}`};if(cookie){headers.cookie=cookie+'; nrv_csrf='+'a'.repeat(64);headers['x-csrf-token']='a'.repeat(64);}let method='GET',payload;
 if(body!==undefined){method='POST';if(body instanceof URLSearchParams){headers['content-type']='application/x-www-form-urlencoded';payload=body;}else{headers['content-type']='application/json';payload=JSON.stringify(body);}}
 return handleApi(new Request('https://nurevo.jp'+path,{method,headers,...(payload?{body:payload}:{})}),env,{});}
const pathOf=link=>new URL(link).pathname+new URL(link).search;
const extractLink=mail=>mail.text.match(/https:\/\/\S+/g).at(-1);
try{
 const signup=await (await call('/api/auth/signup',{email:'parent@example.test',locale:'de'})).json();
 const logged=await call(pathOf(signup.loginLink));const cookie=logged.headers.get('set-cookie').match(/nrv_session=[^;]+/)[0];
 assert.equal((await call('/api/partner/register',{},cookie)).status,200);
 const parent=sqlite.prepare("SELECT * FROM accounts WHERE email='parent@example.test'").get();
 sqlite.prepare('INSERT INTO sites(id,org_id,url,site_key,owner_member_id,detected_language) SELECT ?,org_id,?,?,id,? FROM members WHERE id=?').run('site','https://shop.example.test','key','fr',parent.member_id);
 sqlite.prepare('INSERT INTO aeo_scores(site_id,scanned_at,score,checks_json) VALUES (?,?,?,?)').run('site','2026-09-01T00:00:00Z',72,'[]');
 assert.equal((await call('/api/partner/share',{site_id:'site',email:parent.email},cookie)).status,400,'self referral blocked');
 assert.equal((await call('/api/partner/share',{site_id:'absent',email:'customer@example.test'},cookie)).status,404);
 async function share(email){assert.equal((await call('/api/partner/share',{site_id:'site',email},cookie)).status,200);return extractLink(messages.at(-1));}
 const open=await share('customer@example.test');assert.equal(messages.at(-1).subject,referralCopy('fr').shareSubject);
 assert.equal(sqlite.prepare("SELECT count(*) n FROM members WHERE email='customer@example.test'").get().n,0,'share creates no account');
 const openResponse=await call(pathOf(open));const markup=await openResponse.text();assert.match(markup,/lang="fr"/);assert.ok(!markup.includes('shop.example.test'),'report private until verification');
 const inviteToken=new URL(open).searchParams.get('token');
 await call('/api/referral/verify-email',new URLSearchParams({token:inviteToken,email:'wrong@example.test'}));assert.equal(messages.length,2,'wrong address sends no credential');
 await call('/api/referral/verify-email',new URLSearchParams({token:inviteToken,email:'customer@example.test'}));const redeem=extractLink(messages.at(-1));
 assert.match(messages.at(-1).subject,/connexion/);
 await call('/api/partner/code/regenerate',{},cookie);
 const results=await Promise.all([call(pathOf(redeem)),call(pathOf(redeem))]);
 assert.equal(results.filter(r=>r.headers.get('set-cookie')?.includes('nrv_session=')).length,1,'single atomic redemption');
 const winner=results.find(r=>r.headers.get('set-cookie'));assert.match(await winner.text(),/Bienvenue/);
 const child=sqlite.prepare("SELECT * FROM accounts WHERE email='customer@example.test'").get();assert.equal(child.referred_by_account_id,parent.id,'code regeneration keeps invite attribution');
 sqlite.prepare('UPDATE accounts SET created_at=? WHERE id=?').run(Date.parse('2026-08-01T00:00:00Z'),child.id);
 sqlite.prepare('UPDATE sites SET owner_member_id=?,stripe_subscription_id=? WHERE id=?').run(child.member_id,'sub_pro','site');
 // Existing organic accounts are never reattributed through an invite.
 const old=await share('old@example.test');
 await call('/api/referral/verify-email',new URLSearchParams({token:new URL(old).searchParams.get('token'),email:'old@example.test'}));
 await call(pathOf(extractLink(messages.at(-1))));
 assert.equal(sqlite.prepare("SELECT referred_by_account_id FROM accounts WHERE email='old@example.test'").get().referred_by_account_id,null);
 // Expiry and tampering are checked cryptographically as well as in SQL.
 const id='a'.repeat(32),expired=await signReferral(env,id,'verify',Date.now()-1000);
 assert.equal(await verifyReferral(env,expired,'verify'),null);
 const signed=await signReferral(env,id,'verify',Date.now()+60000);
 assert.equal(await verifyReferral(env,signed.replace('aaaa','baaa'),'verify'),null);
 assert.equal(await verifyReferral(env,signed,'invite'),null);
 assert.equal(referralLocale('fr-CA','ja'),'fr');assert.equal(referralLocale('xx','de'),'de');assert.equal(referralLocale(null,null),'en');
 for(const locale of EMAIL_LOCALES){const c=referralCopy(locale);assert.ok(Object.values(c).every(v=>typeof v==='string'&&v.length>0));assert.equal(COPY[locale].length,37);assert.ok(!renderReferralReport({url:'<script>',score:1,checks:[]},locale).includes('<script>'));}
 assert.throws(()=>referralConfig({REFERRAL_RATE_BP:'bad'}));assert.throws(()=>periodBounds('2026-13'));
 assert.equal((await call('/api/admin/referral-metadata',{},cookie)).status,200);assert.equal(metadataUpdates,1);
 const result=await runReferralLedger(env,'2026-09');assert.equal(result.status,'ready');
 const report=await ledgerExport(env,'2026-09');assert.equal(report.lines.length,2);assert.deepEqual(report.summary.map(g=>[g.currency,g.amount_minor]),[['jpy',5920],['usd',400]]);
 assert.equal(decimalAmount(5920,'jpy'),'5920');assert.equal(decimalAmount(400,'usd'),'4.00');assert.equal(decimalAmount(500,'isk'),'5.00');assert.match(wiseSummaryCsv(report),/4.00/);
 assert.match(ledgerCsv(report),/payout_minor/);assert.match(ledgerCsv(report),/in_1/);
 pagination=true;await runReferralLedger(env,'2026-09');assert.equal((await ledgerExport(env,'2026-09')).lines.length,2,'full pagination');pagination=false;
 const again=await runReferralLedger(env,'2026-09');assert.notEqual(again.run_id,result.run_id);
 assert.equal((await ledgerExport(env,'2026-09')).lines.length,2,'reruns replace the selected snapshot, no double counting');
 env.REFERRAL_RATE_BP='2500';assert.equal((await runReferralLedger(env,'2026-09')).status,'ready');assert.equal((await ledgerExport(env,'2026-09')).summary[0].amount_minor,3700);
 env.REFERRAL_DURATION_MONTHS='1';await runReferralLedger(env,'2026-09');assert.equal((await ledgerExport(env,'2026-09')).lines.length,0);delete env.REFERRAL_DURATION_MONTHS;
 refund=true;await runReferralLedger(env,'2026-09');assert.equal((await ledgerExport(env,'2026-09')).lines.length,0,'partial refund excludes entire invoice');refund=false;
 mixed=true;await assert.rejects(runReferralLedger(env,'2026-09'),/mixed_pro/);mixed=false;
 unknownPayment=true;await assert.rejects(runReferralLedger(env,'2026-09'),/unsupported_invoice_payment/);unknownPayment=false;
 failStripe=true;await assert.rejects(runReferralLedger(env,'2026-09'),/stripe_read_failed/);failStripe=false;
 assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM referral_ledger_runs WHERE status='failed'").get().n,3);
 assert.equal((await call('/api/admin/referral-ledger?period=2026-09')).status,403);
 const childCookie=winner.headers.get('set-cookie').match(/nrv_session=[^;]+/)[0];
 assert.equal((await call('/api/admin/referral-ledger?period=2026-09',undefined,childCookie)).status,403);
 assert.equal(await ledgerExport(env,'2026-09'),null,'failed latest reconciliation blocks stale export');
 await runReferralLedger(env,'2026-09');
 assert.equal((await call('/api/admin/referral-ledger?period=2026-09&format=csv',undefined,cookie)).status,200);
 console.log('PASS referral flow + real SQLite: mailbox verification, self/organic/immutable attribution, signed expiry/tamper/purpose/concurrent single use, 8 locale resources, invoice-based Pro ledger, currencies, reruns, rates/duration, refunds, failed evidence, export authorization. Mock mail/Stripe only.');
}finally{globalThis.fetch=realFetch;sqlite.close();}
