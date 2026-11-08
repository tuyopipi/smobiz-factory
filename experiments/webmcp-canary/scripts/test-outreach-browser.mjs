import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {chromium} from '@playwright/test';
const base=new URL('../../nurevo-lp/public/',import.meta.url);const id='a'.repeat(32);const browser=await chromium.launch({headless:true,channel:'chrome'});
try {const page=await browser.newPage();let payload=null;await page.route('https://example.test/**',async route=>{
const u=new URL(route.request().url());if(u.pathname==='/api/auth/signup'){payload=route.request().postDataJSON();return route.fulfill({json:{ok:true}});}
const file=u.pathname==='/'?'check/index.html':u.pathname.replace(/^\//,'');try{return route.fulfill({body:readFileSync(new URL(file,base)),contentType:file.endsWith('.js')?'application/javascript':'text/html'});}catch{return route.fulfill({status:404,body:'not found'});}});
await page.goto('https://example.test/check/index.html?o='+id+'&lang=en');assert(!page.url().includes('o='));
await page.locator('#signup-cta').evaluate(a=>a.click());await page.waitForURL('**/signup.html?lang=en');assert(!page.url().includes('o='));
assert.equal(await page.evaluate(()=>new URL(nrvOutreach.decorate('#apply')).searchParams.has('o')),false);
assert.equal(await page.evaluate(()=>new URL(nrvOutreach.decorate('/member-register.html')).searchParams.get('o')),'a'.repeat(32));
assert.equal(await page.locator('[name=outreach_consent]').isChecked(),false);assert.equal(await page.evaluate(()=>localStorage.length),0);
await page.locator('[name=email]').fill('person@example.test');await page.locator('#submit').click();await page.waitForFunction(()=>document.querySelector('#signup').hidden);assert.equal(payload.outreach_id,undefined);
await page.goto('https://example.test/signup.html?lang=en&o='+id);await page.locator('[name=email]').fill('person@example.test');await page.locator('[name=outreach_consent]').check();await page.locator('#submit').click();await page.waitForFunction(()=>document.querySelector('#signup').hidden);assert.equal(payload.outreach_id,id);assert.equal(payload.outreach_consent,true);
await page.goto('https://example.test/signup.html?lang=en&o=bad');assert.equal(await page.locator('[name=outreach_consent]').count(),0);
console.log('Browser: optional consent, no persistent storage, query removal and navigation preservation pass; only mocked requests.');
}finally{await browser.close();}
