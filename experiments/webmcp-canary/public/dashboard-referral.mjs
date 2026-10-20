import { referralCopy } from './dashboard-referral-copy.mjs';
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function partnerView(b,lang,sites) {
 const c=referralCopy(lang),p=b.payout || {};
 return `<h1>${c.partner}</h1><section class="card panel"><h2>${c.code}</h2><code>${esc(b.referral_code || '—')}</code> <button class="btn" id="referral-register">${b.registered?c.registered:c.register}</button><button class="btn" id="referral-regenerate">${c.regenerate}</button><button class="btn" id="referral-code-copy">${c.copy}</button><p>${esc(c.terms.replace('{rate}',String((p.rate || 0)*100)))}</p><p>${esc(p.duration_months === null ? c.lifetime : c.months.replace('{months}',p.duration_months))}</p><p>${c.paidOnly}</p><p>${c.existing}</p></section><section class="card panel"><h2>${c.share}</h2><form id="referral-share"><label>${c.partnerName}<input class="input" name="partner_name" maxlength="200" autocomplete="name"></label><label>${c.clientName}<input class="input" name="client_name" maxlength="200" autocomplete="off"></label><label>${c.site}<select class="input" name="site_id" required>${sites.map(s=>`<option value="${esc(s.id)}">${esc(s.url)}</option>`).join('')}</select></label><label>${c.customerEmail}<input class="input" name="email" type="email" required maxlength="254"></label><button class="btn primary">${c.send}</button></form><p id="referral-status" role="status"></p></section><section class="card panel"><h2>${c.ledger}</h2>${(p.totals || []).map(g=>`<p>${esc(g.currency.toUpperCase())}: <span>${esc(formatAmount(g.amount_minor,g.currency,lang))}</span></p>`).join('') || '—'}</section><section class="card panel"><h2>${c.customers}</h2>${(b.referrals || []).map(a=>`<p><span>${esc(a.email)}</span> — ${a.sites.map(s=>`<span>${esc(s.url)}</span>`).join(', ')}</p>`).join('') || c.empty}</section>`;
}
function formatAmount(minor,currency,lang) {
 const formatter = new Intl.NumberFormat(lang==='tw'?'zh-TW':lang,{style:'currency',currency});
 const zero=['bif','clp','djf','gnf','jpy','kmf','krw','mga','pyg','rwf','vnd','vuv','xaf','xof','xpf'];
 const decimals=zero.includes(currency)?0:['bhd','jod','kwd','omr','tnd'].includes(currency)?3:2;
 return formatter.format(minor / 10**decimals);
}
export function bindReferral(api,load,lang,code) {
 const c = referralCopy(lang),status=document.querySelector('#referral-status');
 document.querySelector('#referral-code-copy')?.addEventListener('click',()=>navigator.clipboard.writeText(code || ''));
 document.querySelector('#referral-regenerate')?.addEventListener('click',async()=>{try{await api('/api/partner/code/regenerate',{method:'POST'});await load();}catch{status.textContent=c.unavailable;}});
 document.querySelector('#referral-register')?.addEventListener('click',async event=>{
  event.target.disabled=true;
  try { await api('/api/partner/register',{method:'POST'}); await load(); } catch { status.textContent=c.unavailable; event.target.disabled=false; }
 });
 document.querySelector('#referral-share')?.addEventListener('submit',async event=>{
  event.preventDefault(); const button=event.target.querySelector('button');button.disabled=true;
  try { await api('/api/partner/share',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(event.target)))});status.textContent=c.shared; }
  catch {status.textContent=c.unavailable;} finally {button.disabled=false;}
 });
}
