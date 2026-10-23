var ENGINES=[{"id":"chatgpt","hosts":["chatgpt.com","chat.openai.com"]},{"id":"perplexity","hosts":["perplexity.ai"]},{"id":"gemini","hosts":["gemini.google.com","bard.google.com"]},{"id":"copilot","hosts":["copilot.microsoft.com"]},{"id":"claude","hosts":["claude.ai"]},{"id":"you","hosts":["you.com"]},{"id":"phind","hosts":["phind.com"]},{"id":"kagi","hosts":["kagi.com"]},{"id":"duckduckgo-ai","hosts":["duck.ai"]},{"id":"meta-ai","hosts":["meta.ai"]},{"id":"grok","hosts":["grok.com"]},{"id":"deepseek","hosts":["chat.deepseek.com"]},{"id":"mistral","hosts":["chat.mistral.ai"]}];
/* Counts a visit that arrived from an AI answer engine.
 *
 * "Does AI send us anyone" is the question the product asks of its customers'
 * sites, so the site asks it of itself. One beacon per arrival, carrying the
 * engine's id, the page path and the page language - no cookie, no visitor id,
 * nothing about the person. ENGINES is injected by the build from src/site.mjs.
 */
(function(){
  try{
    var engine='';
    var ref=document.referrer?new URL(document.referrer).hostname.toLowerCase():'';
    var utm=(new URLSearchParams(location.search).get('utm_source')||'').toLowerCase();
    for(var i=0;i<ENGINES.length&&!engine;i++){
      for(var j=0;j<ENGINES[i].hosts.length;j++){
        var host=ENGINES[i].hosts[j];
        // An engine that strips the referrer usually tags the link instead.
        if(ref===host||ref.slice(-host.length-1)==='.'+host||utm===host||utm===ENGINES[i].id){ engine=ENGINES[i].id; break; }
      }
    }
    if(!engine) return;
    // Once per arrival: moving between pages of the site is not a new referral.
    try{ if(sessionStorage.getItem('nrv_ai_ref')) return; sessionStorage.setItem('nrv_ai_ref',engine); }catch(e){}
    var body=JSON.stringify({engine:engine,path:location.pathname,lang:document.documentElement.lang||''});
    if(navigator.sendBeacon) navigator.sendBeacon('/api/lp/ai-referral',new Blob([body],{type:'text/plain'}));
    else fetch('/api/lp/ai-referral',{method:'POST',body:body,keepalive:true});
  }catch(e){}
})();
