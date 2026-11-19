// Offline fixtures only: no real site keys or network requests.
import assert from 'node:assert/strict';
import {readFileSync, mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runInNewContext} from 'node:vm';
import {spawnSync} from 'node:child_process';
const root = new URL('../integration-kit/', import.meta.url);
const ld = {'@context':'https://schema.org', '@type':'LocalBusiness', name:'ONE-TEST:</script><script>alert(1)</script>'};
let calls=0, fail=false, withdrawn=false;
const context={module:{exports:{}},AbortController,setTimeout,clearTimeout,fetch:async()=>{calls++;if(fail)throw Error('offline fixture');return {ok:true,json:async()=>({ok:true,jsonld:withdrawn ? null : ld})};}};
runInNewContext(readFileSync(new URL('node/nurevo-aeo.js',root),'utf8'),context);
const {nurevoJsonLdTag}=context.module.exports;
assert.equal(await nurevoJsonLdTag(''),'');
const tag=await nurevoJsonLdTag('synthetic');
assert.equal((tag.match(/<script/g)||[]).length,1);
assert.equal((tag.match(/<\/script>/g)||[]).length,1);
assert.ok(tag.includes('\\u003c/script>'));
await nurevoJsonLdTag('synthetic');assert.equal(calls,1);
fail=true;
assert.equal(await nurevoJsonLdTag('synthetic',{ttlMs:-1}),tag);
assert.equal(await nurevoJsonLdTag('synthetic-empty'),'');
fail=false; withdrawn=true;
assert.equal(await nurevoJsonLdTag('synthetic',{ttlMs:-1}),'');
fail=true;
assert.equal(await nurevoJsonLdTag('synthetic'),'','withdrawn cache must not reappear');
// PHP populated-cache fixture never fetches: isolated temporary cache directory.
const tmp=mkdtempSync(join(tmpdir(),'nurevo-kit-fixture-'));
try {
 writeFileSync(join(tmp,'nurevo_synthetic.json'),JSON.stringify(ld));
 const php=new URL('php/nurevo-aeo.php',root).pathname;
 const run=spawnSync('php',['-d',`sys_temp_dir=${tmp}`,'-r',`require ${JSON.stringify(php)}; nurevo_render_jsonld('synthetic');`],{encoding:'utf8'});
 assert.equal(run.status,0,run.stderr);
 assert.equal((run.stdout.match(/<\/script>/g)||[]).length,1);
 assert.ok(run.stdout.includes('\\u003c/script>'));
 // Disable extensions; replace HTTPS with an in-process synthetic stream.
 const withdrawal=spawnSync('php',['-n','-d','disable_functions=curl_init','-d',`sys_temp_dir=${tmp}`,'-r',`
 class FixtureStream { public $context; private $pos=0; private $body='{"ok":true,"jsonld":null,"delivery":"stopped"}';
 public function stream_open($p,$m,$o,&$opened){return true;}
 public function stream_read($n){$s=substr($this->body,$this->pos,$n);$this->pos+=strlen($s);return $s;}
 public function stream_eof(){return $this->pos>=strlen($this->body);}
 public function stream_stat(){return [];}}
 stream_wrapper_unregister('https');stream_wrapper_register('https','FixtureStream');
 require ${JSON.stringify(php)};
 touch(sys_get_temp_dir().'/nurevo_synthetic.json',time()-1000);
 nurevo_render_jsonld('synthetic',1);
 if(is_file(sys_get_temp_dir().'/nurevo_synthetic.json'))exit(2);
 `],{encoding:'utf8'});
 assert.equal(withdrawal.status,0,withdrawal.stderr);
 assert.equal(withdrawal.stdout,'','explicit null must not emit stale PHP schema');

} finally {rmSync(tmp,{recursive:true,force:true});}
console.log('PASS offline Node: escape/cache/stale fallback/empty failure; PHP: cached payload escapes closing script. Next.js runtime not tested.');
