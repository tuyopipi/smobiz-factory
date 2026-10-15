import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const output = process.env.PAYMENT_QA_OUTPUT || '/private/tmp/nurevo-standard-payment-qa';
await mkdir(output, {recursive:true});
const browser = await chromium.launch({headless:true, channel:'chrome'});
const context = await browser.newContext({permissions:['clipboard-read','clipboard-write']});
const errors=[];
let paid=false, linkCalls=0, requestedSites=[];
const site = () => ({id:'site1',url:'qa.example.test',install_type:'wp',plan:paid?'standard':'free',payment_ui:true,
  fill:{filled:0,total:5},billing:{status:paid?'active':'pending',customer_id:paid?'cus_fixture':null}});
await context.route('https://nurevo.jp/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path.startsWith('/api/')){
    let data={};
    if(path==='/api/me') data={email:'qa@example.test',role:'admin'};
    if(path==='/api/sites') data={sites:[site()]};
    if(path==='/api/partner') data={referrals:[]};
    if(path==='/api/crawlers') data={crawlers:[]};
    if(path==='/api/billing/payment-link'){
      linkCalls++;requestedSites.push(route.request().postDataJSON().site_id);
      data={url:'https://buy.stripe.com/test_site_specific_fixture'};
    }
    return route.fulfill({json:data});
  }
  if(process.env.PAYMENT_QA_DEPLOYED==='1')return route.continue();
  try{
    const body=await readFile(new URL(path==='/dashboard'?'../public/dashboard.html':'../public/'+path.slice(1),import.meta.url));
    return route.fulfill({body,contentType:path.endsWith('.js')?'text/javascript':path.endsWith('.png')?'image/png':'text/html'});
  }catch{return route.fulfill({status:404,body:''});}
});
try{
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.stack));
  await page.goto('https://nurevo.jp/dashboard#site:site1');
  const panel=page.locator('#standard-payment');await panel.waitFor();
  assert.equal(await page.locator('#compform').count(),0,'admin has no complimentary grant form');
  await panel.getByText('自社利用の場合は下記リンクから支払い',{exact:true}).waitFor();
  await panel.getByText('顧客に導入する場合はリンクをコピーして支払いを依頼してください',{exact:true}).waitFor();
  await panel.screenshot({path:output+'/self-and-client.png'});
  await page.locator('#standard-pay-copy').click();
  await page.getByText('リンクをコピーしました',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'https://buy.stripe.com/test_site_specific_fixture');
  await panel.screenshot({path:output+'/client-copied.png'});
  await page.route('https://buy.stripe.com/**',r=>r.fulfill({body:'Stripe fixture payment page'}));
  await page.locator('#standard-pay-open').click();await page.waitForURL('https://buy.stripe.com/**');
  assert.equal(linkCalls,1,'open and copy reuse the same site link');
  assert.deepEqual(requestedSites,['site1']);
  paid=true;await page.goto('https://nurevo.jp/dashboard#site:site1');
  await page.getByText('Standard 有効',{exact:true}).waitFor();
  assert.equal(await page.locator('#standard-payment, #standard-pay-open, #standard-pay-copy').count(),0);
  assert.equal(linkCalls,1,'paid site does not create a payment link');
  await page.locator('#standard-active').locator('..').screenshot({path:output+'/standard-active.png'});
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({ok:true,assets:process.env.PAYMENT_QA_DEPLOYED==='1'?'production':'local',api:'fixtures',linkCalls,requestedSites,errors,screenshots:output}));
}finally{await browser.close();}
