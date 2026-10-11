// Real Worker + local D1 + browser regression. Start wrangler dev --local
// --port 8778 --local-protocol https --var WEBMCP_ALLOWED_ORIGINS:https://127.0.0.1:8778
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
const origin = process.env.NUREVO_LOCAL_ORIGIN || 'https://127.0.0.1:8778';
assert.ok(['localhost','127.0.0.1'].includes(new URL(origin).hostname), 'fixtures are local only');
const tag = 'qa_access_' + randomBytes(5).toString('hex');
const org = tag + '_org', member = tag + '_member', foreignOrg = tag + '_foreign';
const token = randomBytes(32).toString('hex');
const hash = createHash('sha256').update(token).digest('hex');
const temp = mkdtempSync(join(tmpdir(), 'nurevo-access-'));
function sql(text) {
 const file = join(temp, 'fixture.sql'); writeFileSync(file, text);
 execFileSync('./node_modules/.bin/wrangler',['d1','execute','nurevo-db','--local','--file',file], { stdio:'pipe' });
}
const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try {
 sql(`INSERT INTO orgs (id,name,plan,created_at) VALUES ('${org}','QA access','free',${Date.now()}),('${foreignOrg}','QA foreign','free',${Date.now()});
 INSERT INTO members (id,org_id,email,role,status,created_at) VALUES ('${member}','${org}','${tag}@example.test','referrer','active',${Date.now()});
 INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES ('${hash}','${member}','${org}','magic',${Date.now()+600000});
 INSERT INTO referrers(id,name,email,created_at) VALUES ('${tag}_ref','QA referrer','${tag}@example.test',${Date.now()});
 INSERT INTO sites(id,org_id,owner_member_id,url,site_key,install_type,status,plan,channel,referred_by) VALUES
 ('${tag}_other','${org}','other','other.example','${tag}_other_key','wp','pending','free','direct',NULL),
 ('${tag}_foreign','${foreignOrg}','${member}','foreign.example','${tag}_foreign_key','wp','pending','free','direct',NULL),
 ('${tag}_referred','${org}','other','referred.example','${tag}_referred_key','wp','pending','free','referral','${tag}_ref');`);
 const context = await browser.newContext({ignoreHTTPSErrors:true});
 const page = await context.newPage();
 page.on("pageerror",error=>console.log("Browser error:",error.message));
 page.setDefaultTimeout(10000);
 await page.goto(`${origin}/api/auth/callback?token=${token}`, {waitUntil:'networkidle'});
 const me = await context.request.get(origin+'/api/me'); assert.equal(me.status(),200);assert.equal((await me.json()).role,'referrer');
 const before = await (await context.request.get(origin+'/api/sites')).json();
 assert.ok(before.sites.some(s=>s.id===tag+'_referred'),'existing referral remains visible');
 assert.ok(!before.sites.some(s=>s.id===tag+'_other'||s.id===tag+'_foreign'),'unrelated sites hidden');
 async function addViaBrowser(){
  await page.goto(origin+'/dashboard#sites',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelector('#add,[data-onboard]')?.dataset.onboardBound === '1');
  await page.getByRole('button',{name:/クライアントのサイトを追加/}).click();
  await page.locator('input[name="url"]').fill('https://happiris-design.com/');
  const created = page.waitForResponse(r=>new URL(r.url()).pathname==='/api/sites' && r.request().method()==='POST');
  const paired = page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/pairing-code') && r.request().method()==='POST');
  await page.getByRole('button',{name:'次へ',exact:true}).click();
  const a=await created,b=await paired;assert.equal(a.status(),200);assert.equal(b.status(),200);
  const result=await a.json();const code=await b.json();assert.match(code.pairing_code,/^NRV(-[A-Z0-9]{5}){4}$/);
  await page.getByText('接続待ち…',{exact:true}).waitFor();
  const listed=await(await context.request.get(origin+'/api/sites')).json();assert.ok(listed.sites.some(s=>s.id===result.id));
  assert.equal((await context.request.get(origin+'/api/sites/'+result.id)).status(),200);
  await page.getByRole("button",{name:"あとで続ける",exact:true}).click();
  return result.id;
 }
 const id = await addViaBrowser();
 const csrf=(await context.cookies()).find(c=>c.name==='nrv_csrf').value;
 for(const suffix of ['_other','_foreign']){
  const denied=await context.request.post(origin+'/api/sites/'+tag+suffix+'/pairing-code',{headers:{'x-csrf-token':csrf}});assert.equal(denied.status(),403);
 }
 const badCsrf=await context.request.post(origin+'/api/sites',{data:{url:'x.example'},headers:{'x-csrf-token':'wrong'}});assert.equal(badCsrf.status(),403);assert.equal((await badCsrf.json()).error,'csrf_failed');
 const badOrigin=await context.request.post(origin+'/api/sites',{data:{url:'x.example'},headers:{Origin:'https://evil.example','x-csrf-token':csrf}});assert.equal(badOrigin.status(),403);assert.equal((await badOrigin.json()).error,'origin_not_allowed');
 sql(`UPDATE members SET role='member' WHERE id='${member}';`);
 await addViaBrowser();
 sql(`UPDATE members SET status='disabled' WHERE id='${member}';`);
 const disabled=await context.request.post(origin+'/api/sites',{data:{url:'x.example'},headers:{'x-csrf-token':csrf}});assert.equal(disabled.status(),401);
 console.log('Real login → referrer/member site creation → pairing UI → listing/detail: passed; own/referral scope, foreign/unrelated denial, CSRF, Origin, disabled member: passed');
 await context.close();
} finally {
 await browser.close();
 sql(`DELETE FROM site_settings WHERE site_id IN (SELECT id FROM sites WHERE org_id IN ('${org}','${foreignOrg}'));
 DELETE FROM sites WHERE org_id IN ('${org}','${foreignOrg}'); DELETE FROM sessions WHERE member_id='${member}'; DELETE FROM members WHERE id='${member}'; DELETE FROM referrers WHERE id='${tag}_ref'; DELETE FROM orgs WHERE id IN ('${org}','${foreignOrg}');`);
 rmSync(temp,{recursive:true,force:true});
}
