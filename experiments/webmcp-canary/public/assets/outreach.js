// Optional link-to-registration measurement. No cookies/localStorage or network requests.
(function(root){
  'use strict';
  function valid(v){return typeof v==='string'&&/^[a-f0-9]{32}$/.test(v)?v:null;}
  var url=new URL(root.location.href),id=valid(url.searchParams.get('o'));
  if(url.searchParams.has('o')){url.searchParams.delete('o');root.history.replaceState(root.history.state,'',url.pathname+url.search+url.hash);}
  function decorate(href){var u=new URL(href,root.location.href);if(u.origin===root.location.origin&&u.pathname===root.location.pathname&&u.search===root.location.search&&u.hash)return u.href;if(id&&u.origin===root.location.origin&&/^\/(signup\.html|member-register(?:\.html)?|partner\/?|check\/?)$/.test(u.pathname))u.searchParams.set('o',id);return u.href;}
  function addConsent(form,locale){
    if(!id||!form||form.querySelector('[name=outreach_consent]'))return;
    var label=document.createElement('label'),input=document.createElement('input'),span=document.createElement('span');
    input.type='checkbox';input.name='outreach_consent';input.checked=false;input.style.cssText='width:auto;margin:0 8px 0 0';
    span.textContent=String(locale||document.documentElement.lang).startsWith('ja')?
      '任意：この案内リンクと登録・利用・課金状況を関連付け、案内の改善に利用することに同意します。未選択でも登録できます。':
      'Optional: I agree to link this invitation with my registration, usage and billing status to improve outreach. You can register without agreeing.';
    label.style.cssText='font-size:13px;display:block;margin:16px 0';label.append(input,span);
    var a=document.createElement('a');a.href=String(locale||document.documentElement.lang).startsWith('ja')?'/privacy/':'/en/privacy/';a.textContent=' Privacy';label.append(a);
    form.insertBefore(label,form.querySelector('button[type=submit],button')||null);
  }
  function payload(form){var box=form&&form.querySelector('[name=outreach_consent]');return id&&box&&box.checked?{outreach_id:id,outreach_consent:true}:{};}
  root.nrvOutreach={decorate:decorate,addConsent:addConsent,payload:payload};
  document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(a)a.href=decorate(a.href);},true);
})(window);
