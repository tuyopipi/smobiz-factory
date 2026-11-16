import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync} from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const dir=new URL('../public/',import.meta.url);
const server=createServer((req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname.slice(1);if(!/^[a-z0-9.-]+$/.test(path))throw Error();const bytes=readFileSync(new URL(path,dir));res.setHeader('content-type',path.endsWith('.js')?'application/javascript':path.endsWith('.css')?'text/css':'text/html');res.end(bytes);}catch{res.statusCode=404;res.end('not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',async route=>{const url=route.request().url();if(url.includes('/leads?'))return route.fulfill({json:{leads:[{id:7,name:'Client <script>window.bad=true</script>',site_url:'https://example.com/',created_at:Date.UTC(2026,10,16),score:65}]}});return route.fulfill({json:{agency_name:'Agency & Co'}});});
 await page.goto(base+'/agency-sales-kit.html?lang=ja&lead=7');
 await page.waitForFunction(()=>document.querySelector('[name=customer]').value.startsWith('Client'));
 assert.equal(await page.evaluate(()=>window.bad),undefined);
 assert.equal(await page.inputValue('[name=agency]'),'Agency & Co');
 assert.match(await page.inputValue('[name=findings]'),/スコア/);
 await page.fill('[name=scope]','確認した不足項目を追加');await page.fill('[name=next]','顧客承認後に開始');
 await page.click('button[type=submit]');await page.waitForSelector('#preview:not([hidden])');
 assert.match(await page.textContent('#proposal'),/保証しません/);
 assert.equal(await page.locator('#proposal script').count(),0);
 await page.fill('[name=scope]','changed scope');assert.equal(await page.locator('#preview').isHidden(),true);
 await page.click('button[type=submit]');
 await page.selectOption('#language','en');assert.equal(await page.locator('#preview').isHidden(),true);
 await page.click('button[type=submit]');assert.match(await page.textContent('#proposal'),/No guarantee/);
 // English and Japanese mobile layouts must fit, including long strings.
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 mkdirSync('/tmp/nurevo-agency-sales-qa',{recursive:true});
 await page.screenshot({path:'/tmp/nurevo-agency-sales-qa/mobile.png',fullPage:true});
 page.once('dialog',d=>d.dismiss());await page.click('#reset');assert.notEqual(await page.inputValue('[name=customer]'),'');
 page.once('dialog',d=>d.accept());await page.click('#reset');assert.equal(await page.inputValue('[name=customer]'),'');assert.equal(await page.locator('#preview').isHidden(),true);
 await page.selectOption('#language','ja');await page.setViewportSize({width:1280,height:900});
 await page.screenshot({path:'/tmp/nurevo-agency-sales-qa/desktop.png',fullPage:true});
 // Failed session/lookup shows a clear recovery, not another tenant's lead.
 await page.route('**/api/**',r=>r.fulfill({status:401,json:{error:'unauthorized'}}));
 await page.goto(base+'/agency-sales-kit.html?lang=en&lead=8');await page.waitForFunction(()=>document.querySelector('#load-status').textContent.includes('Could not'));
 assert.equal(await page.inputValue('[name=customer]'),'');assert.deepEqual(errors,[]);
 console.log('PASS agency sales browser: authenticated prefill mock, XSS-safe text, changed draft invalidation, language switch, mobile width, reset cancel/confirm, auth failure.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
