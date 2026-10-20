import { renderMasterEmail } from './referral-email-copy.mjs';
import { ensureAccount, issueReferralCode } from './partner.mjs';
import { normalizeEmailLocale, loadEmailPreferences, magicLinkEmail } from './email-i18n.mjs';
import { referralCopy } from '../public/dashboard-referral-copy.mjs';
import { signReferral, verifyReferral, digest } from './referral-tokens.mjs';
import { localizeAeoChecks } from './aeo-score.mjs';
const TTL = 15 * 60 * 1000;
export const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function referralLocale(siteLanguage, partnerLanguage) { return normalizeEmailLocale(siteLanguage) || normalizeEmailLocale(partnerLanguage) || 'en'; }
function page(locale, body, title = 'Nurevo') {
 return new Response(`<!doctype html><html lang="${escape(locale)}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(title)}</title><main>${body}</main></html>`, {headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",'x-content-type-options':'nosniff'}});
}
export function renderReferralReport(report, locale) {
 const c = referralCopy(locale);
 const checks = localizeAeoChecks(report.checks || [],locale === 'zh-tw' ? 'tw' : locale);
 return `<h2>${escape(report.url)}</h2><p>${escape(c.score)}: ${escape(report.score)}</p><p>${escape(c.measured)}: ${escape(report.scanned_at)}</p><ul>${checks.map(ch=>`<li><strong>${escape(ch.label)}</strong> — ${escape(ch.message)}</li>`).join('')}</ul>`;
}
async function send(env,email,mail) {
 if (!env.RESEND_API_KEY || !env.MAIL_FROM) throw new Error('mail_provider_not_configured');
 const response = await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:`Bearer ${env.RESEND_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({from:env.MAIL_FROM,to:[email],...mail})});
 if (!response.ok) throw new Error('mail_send_failed');
}
export async function shareReferralReport(env, request, actor, site, email, names = {}) {
 email = String(email || '').trim().toLowerCase();
 if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('invalid_email');
 if (await env.DB.prepare('SELECT email FROM referral_email_suppressions WHERE email=?').bind(email).first()) throw new Error('email_unsubscribed');
 const account = await ensureAccount(env,actor.member_id);
 if (String(account.email).toLowerCase() === email) throw new Error('self_referral');
 const code = await issueReferralCode(env,account);
 const score = await env.DB.prepare('SELECT * FROM aeo_scores WHERE site_id=? ORDER BY scanned_at DESC LIMIT 1').bind(site.id).first();
 if (!score) throw new Error('report_not_available');
 const preferences = await loadEmailPreferences(env,account.email);
 const locale = referralLocale(site.detected_language,preferences.language || preferences.registration_locale);
 const report = {url:site.url,score:score.score,scanned_at:score.scanned_at,checks:JSON.parse(score.checks_json || '[]')};
 const id = crypto.randomUUID().replaceAll('-',''), expires = Date.now() + TTL;
 const token = await signReferral(env,id,'invite',expires);
 await env.DB.prepare('INSERT INTO referral_invites(id,partner_id,email,ref_code,locale,report_json,expires_at) VALUES (?,?,?,?,?,?,?)').bind(id,account.id,email,code,locale,JSON.stringify(report),expires).run();
 const link = `${new URL(request.url).origin}/api/referral/open?token=${encodeURIComponent(token)}&ref=${code}`;
 const unsubToken = await signReferral(env,id,'unsubscribe',Date.now()+365*24*60*60*1000);
 const unsub = `${new URL(request.url).origin}/api/referral/unsubscribe?token=${encodeURIComponent(unsubToken)}`;
 const cleanName = (value,fallback) => String(value || fallback).replace(/[\r\n]/g,' ').trim().slice(0,200) || fallback;
 try {
  await send(env,email,renderMasterEmail(locale,'share',{
   partner_name:cleanName(names.partner_name,account.email),client_name:cleanName(names.client_name,email),
   client_site:site.url,score:score.score,magic_link:link,unsub
  }));
 } catch(error) { await env.DB.prepare('DELETE FROM referral_invites WHERE id=?').bind(id).run(); throw error; }
 return {ok:true,locale};
}
async function inviteFor(env,token,purpose) {
 const id = await verifyReferral(env,token,purpose);
 if (!id) return null;
 return env.DB.prepare('SELECT * FROM referral_invites WHERE id=? AND used_at IS NULL AND expires_at>?').bind(id,Date.now()).first();
}
export async function openReferral(request,env) {
 const token = new URL(request.url).searchParams.get('token');
 const row = await inviteFor(env,token,'invite');
 if (!row) return page('en',`<p>${escape(referralCopy('en').invalid)}</p>`);
 const c = referralCopy(row.locale);
 // The recipient address and report are not revealed before mailbox verification.
 return page(row.locale,`<h1>${escape(c.view)}</h1><p>${escape(c.verifyIntro)}</p><form method="post" action="/api/referral/verify-email"><input type="hidden" name="token" value="${escape(token)}"><label>${escape(c.email)}<input type="email" name="email" required maxlength="254" autocomplete="email"></label><button>${escape(c.verify)}</button></form>`);
}
export async function requestReferralVerification(request,env) {
 const form = await request.formData();
 const row = await inviteFor(env,form.get('token'),'invite');
 if (!row) return page('en',`<p>${escape(referralCopy('en').invalid)}</p>`);
 const c = referralCopy(row.locale), email = String(form.get('email') || '').trim().toLowerCase();
 if (email === row.email) {
  const expires = Math.min(Date.now()+TTL,row.expires_at);
  const nonce = crypto.randomUUID().replaceAll('-','');
  // A fresh id in the signed payload invalidates all earlier verification emails.
  const token = await signReferral(env,nonce,'verify',expires);
  await env.DB.prepare('UPDATE referral_invites SET verify_hash=?,verify_expires_at=? WHERE id=? AND used_at IS NULL').bind(await digest(token),expires,row.id).run();
  const link = `${new URL(request.url).origin}/api/referral/redeem?token=${encodeURIComponent(token)}`;
  try { await send(env,email,magicLinkEmail(link,row.locale,{minutes:Math.max(1,Math.floor((expires-Date.now())/60000))})); }
  catch(error) { await env.DB.prepare('UPDATE referral_invites SET verify_hash=NULL WHERE id=? AND verify_hash=?').bind(row.id,await digest(token)).run(); throw error; }
 }
 return page(row.locale,`<h1>${escape(c.sent)}</h1>`);
}
export async function consumeReferral(request,env) {
 const token = new URL(request.url).searchParams.get('token');
 if (!await verifyReferral(env,token,'verify')) return null;
 const hash = await digest(token), now = Date.now();
 const row = await env.DB.prepare('SELECT * FROM referral_invites WHERE verify_hash=? AND used_at IS NULL AND verify_expires_at>? AND expires_at>?').bind(hash,now,now).first();
 if (!row) return null;
 const consumed = await env.DB.prepare('UPDATE referral_invites SET used_at=? WHERE id=? AND verify_hash=? AND used_at IS NULL AND verify_expires_at>? AND expires_at>?').bind(now,row.id,hash,now,now).run();
 return consumed.meta.changes === 1 ? row : null;
}
export function referralWelcome(row,cookies) {
 const c = referralCopy(row.locale);
 const response = page(row.locale,`<h1>${escape(c.welcome)}</h1><p>${escape(c.ready)}</p>${renderReferralReport(JSON.parse(row.report_json),row.locale)}<a href="/dashboard?lang=${encodeURIComponent(row.locale === 'zh-tw' ? 'tw' : row.locale)}">${escape(c.dashboard)}</a>`);
 for (const cookie of cookies) response.headers.append('set-cookie',cookie);
 return response;
}

// Signed capability only affects report sharing, never essential login messages.
// GET confirms intent; email link scanners cannot unsubscribe a recipient.
export async function unsubscribeReferral(request,env) {
 const token = request.method === 'POST' ? (await request.formData()).get('token') : new URL(request.url).searchParams.get('token');
 const id = await verifyReferral(env,token,'unsubscribe');
 const row = id && await env.DB.prepare('SELECT email,locale FROM referral_invites WHERE id=?').bind(id).first();
 if (!row) return new Response('Invalid or expired link',{status:400,headers:{'cache-control':'no-store'}});
 const label = {ja:'配信停止',en:'Unsubscribe',zh:'退订','zh-tw':'取消訂閱',ko:'수신 거부',es:'Cancelar suscripción',fr:'Se désabonner',de:'Abmelden'}[row.locale] || 'Unsubscribe';
 if (request.method === 'POST') {
  await env.DB.prepare('INSERT INTO referral_email_suppressions(email,created_at) VALUES (?,?) ON CONFLICT(email) DO NOTHING').bind(row.email,Date.now()).run();
  return page(row.locale,`<h1>${escape(label)}</h1><p>✓</p>`);
 }
 return page(row.locale,`<h1>${escape(label)}</h1><form method="post" action="/api/referral/unsubscribe"><input type="hidden" name="token" value="${escape(token)}"><button>${escape(label)}</button></form>`);
}
