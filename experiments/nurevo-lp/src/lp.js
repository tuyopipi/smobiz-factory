/* Runtime for the landing page. The page is rendered per language at build
   time, so this no longer swaps text: it only handles the three things that
   need a script. STR is injected by the build with this page's own strings. */
function goLang(lang){
  const to=STR.homes[lang]; if(!to) return;
  try{ localStorage.setItem('nurevo_lang',lang); }catch(e){}
  location.href=to+location.hash;
}

/* Hero AI-readability checker: hand off to /check, which auto-diagnoses ?url=. */
(function(){
  const form=document.getElementById('heroCheck'); if(!form) return;
  const input=document.getElementById('heroCheckUrl'), err=document.getElementById('heroCheckErr');
  // Mirrors normalizeUrl() in /check so a bare host like "example.com" works
  // and the URL handed over is already valid.
  function normalize(value){
    let raw=String(value||'').trim();
    if(!raw) throw new Error('empty');
    if(!/^https?:\/\//i.test(raw)) raw='https://'+raw;
    const parsed=new URL(raw);
    if(parsed.protocol!=='http:'&&parsed.protocol!=='https:') throw new Error('scheme');
    if(!/^[^\s.]+(\.[^\s.]+)+$/.test(parsed.hostname)) throw new Error('host');
    parsed.hash='';
    return parsed.href;
  }
  function clearError(){ err.hidden=true; input.removeAttribute('aria-invalid'); }
  form.addEventListener('submit',function(event){
    event.preventDefault();
    let target;
    try{ target=normalize(input.value); }
    catch(e){
      err.textContent=STR.checkErr;
      err.hidden=false; input.setAttribute('aria-invalid','true'); input.focus();
      return;
    }
    clearError();
    // Hand the page's language over, so the checker and the checklist it
    // fetches both speak it rather than reverting to Japanese.
    location.href='/check?url='+encodeURIComponent(target)+(STR.lang!=='ja'?'&lang='+encodeURIComponent(STR.lang):'');
  });
  input.addEventListener('input',clearError);
}());
function copySnip(btn){
  const code=document.getElementById('snipCode'); const txt=code?code.textContent:'';
  const done=()=>{ btn.textContent=STR.copied; setTimeout(()=>{ btn.textContent=STR.copy; },1600); };
  try{ navigator.clipboard.writeText(txt).then(done).catch(()=>{ const r=document.createRange(); r.selectNode(code); const s=getSelection(); s.removeAllRanges(); s.addRange(r); done(); }); }
  catch(e){ try{ const r=document.createRange(); r.selectNode(code); const s=getSelection(); s.removeAllRanges(); s.addRange(r); done(); }catch(_){} }
}
