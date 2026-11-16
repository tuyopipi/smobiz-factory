/** Real panel mount/identity code in a minimal DOM; no network or production data. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
const modules = ['aeo-metrics', 'sov', 'free-check', 'offsite'];
const flush = async () => { for (let n=0;n<8;n++) await Promise.resolve(); };
for (const name of modules) {
  const file = `public/dashboard-${name}.js`;
  const source = process.env.BASELINE ? execFileSync('git',['show',`a4eda5d:experiments/webmcp-canary/${file}`],{encoding:'utf8'}) : readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
  const requests=[]; let detail; const nodes=[];
  const element=()=>({className:'',innerHTML:'',dataset:{},isConnected:false,querySelector:()=>null,addEventListener(){},getAttribute(k){return k==='data-site-id'?this.id:null;},replaceWith(other){this.isConnected=false;const i=nodes.indexOf(this);if(i>=0)nodes.splice(i,1,other);other.isConnected=true;}});
  const main={querySelector(s){if(s==='.detail')return detail;return nodes.find(n=>'.'+n.className===s)||null;},appendChild(n){n.isConnected=true;nodes.push(n);},insertBefore(n){this.appendChild(n);}};
  const context={location:{hash:''},document:{querySelector(s){if(s==='#main')return main;if(s==='#main .detail')return detail;if(s==='#main > .top h1')return {textContent:'same.example'};return null;},createElement:element,head:{appendChild(){}},documentElement:{lang:'ja'},addEventListener(){}},MutationObserver:class{observe(){}},setTimeout(){},fetch(url){if(url==='/api/sites')return Promise.resolve({ok:true,json:async()=>({sites:[{id:'static-free',url:'same.example'},{id:'wp-pro',url:'same.example'}]})});return new Promise(resolve=>requests.push({url,resolve}));},console,URL,Number,Math,String,Date,JSON,Array,Object,encodeURIComponent,decodeURIComponent};
  context.window=context;vm.createContext(context);
  const selector={ 'aeo-metrics':'nrv-aeo-metrics',sov:'nrv-sov','free-check':'nrv-free-check',offsite:'nrv-offsite'}[name];
  let hooks=`window.test={resolveSiteId,mount};\n`;
  hooks+=`function makeTestPanel(data){var el=document.createElement('section');el.className='${selector}';el.marker=data.marker||(data.data&&data.data.marker);return el;}\n`;
  hooks+=(name==='free-check'?'card=makeTestPanel;attach=function(){};':'panel=makeTestPanel;');
  if(name==='offsite')hooks+='attach=function(){};';
  if(name==='sov')hooks+='addProReport=async function(){};';
  vm.runInContext(source.replace(/\}\)\(\);\s*$/,hooks+'})();'),context);
  function navigate(id){nodes.forEach(n=>n.isConnected=false);nodes.length=0;detail=id?Object.assign(element(),{id,isConnected:true}):null;context.location.hash=id?'#site:'+id:'#summary';}
  function reply(req,marker){req.resolve({ok:true,status:200,json:async()=>({marker,free_check:{marker,status:'ready'}})});}
  navigate('static-free');
  assert.equal(await context.test.resolveSiteId(),'static-free',`${name}: route identity, not duplicate heading`);
  const old=context.test.mount();await flush();assert.equal(requests.length,1);
  navigate('wp-pro');const fresh=context.test.mount();await flush();assert.equal(requests.length,2);
  assert.match(requests[1].url,/\/wp-pro\//);
  reply(requests[0],'OLD');await old;
  assert.equal(nodes.some(n=>n.marker==='OLD'),false,`${name}: old response cannot paint new page`);
  await context.test.mount();await flush();assert.equal(requests.length,2,`${name}: old finally cannot clear new load`);
  reply(requests[1],'CURRENT');await fresh;assert.equal(nodes.some(n=>n.marker==='CURRENT'),true);
  // Same-site rerenders and back/forward must not be blocked by a request for the old DOM.
  navigate('wp-pro');const rerender=context.test.mount();await flush();assert.equal(requests.length,3);
  navigate(null);reply(requests[2],'LEFT');await rerender;assert.equal(nodes.length,0,`${name}: late response cannot mount on summary`);
  navigate('static-free');const back=context.test.mount();await flush();reply(requests[3],'BACK');await back;assert.equal(nodes.some(n=>n.marker==='BACK'),true);
  navigate('wp-pro');const sameOld=context.test.mount();await flush();
  navigate('wp-pro');const sameNew=context.test.mount();await flush();
  assert.equal(requests.length,6,`${name}: same-site new DOM starts its own request`);
  reply(requests[4],'SAME_OLD');await sameOld;assert.equal(nodes.some(n=>n.marker==='SAME_OLD'),false);
  reply(requests[5],'SAME_NEW');await sameNew;assert.equal(nodes.some(n=>n.marker==='SAME_NEW'),true);
  context.location.hash='#site:other';assert.equal(await context.test.resolveSiteId(),null,`${name}: route/DOM mismatch is not a usable identity`);
  console.log(`PASS ${name}: duplicate domains, direct hash, out-of-order responses, rerender, navigation away, back`);
}
const html=readFileSync(new URL('../public/dashboard.html',import.meta.url),'utf8');
assert.ok(html.includes('class="detail" data-site-id="${esc(s.id)}"'));
console.log('site panel lifecycle regression passed');
