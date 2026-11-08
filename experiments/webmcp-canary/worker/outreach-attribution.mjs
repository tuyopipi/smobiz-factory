// Optional first-party measurement only. Never an auth credential or referral commission input.
export const OUTREACH_CONSENT_VERSION = 'outreach-v1-20261108';
export function outreachId(value) { return typeof value === 'string' && /^[a-f0-9]{32}$/.test(value) ? value : null; }
export async function captureOutreach(env, memberId, body, now=Date.now()) {
  const id=outreachId(body?.outreach_id);
  if(!id || body?.outreach_consent !== true || !memberId) return false;
  try {
    await env.DB.prepare('INSERT OR IGNORE INTO outreach_attribution(member_id,outreach_id,captured_at,consent_version) VALUES (?,?,?,?)')
      .bind(memberId,id,now,OUTREACH_CONSENT_VERSION).run();
    return true;
  } catch(error) {
    // Measurement must not prevent signup; no bodies/IDs in logs.
    console.warn('outreach_capture_unavailable'); return false;
  }
}
export async function verifyOutreach(env, memberId, now=Date.now()) {
  try { await env.DB.prepare('UPDATE outreach_attribution SET verified_at=COALESCE(verified_at,?) WHERE member_id=?').bind(now,memberId).run(); }
  catch { console.warn('outreach_verify_unavailable'); }
}

export async function pendingOutreach(env, memberId) {
  try { return !!await env.DB.prepare('SELECT member_id FROM outreach_attribution WHERE member_id=? AND verified_at IS NULL').bind(memberId).first(); } catch { return false; }
}
export function outreachConfirmHtml(locale) {
  const text=String(locale).startsWith('ja')?'任意：案内リンクと登録・利用・課金状況を関連付け、案内の改善に利用することに同意します。未選択でもログインできます。':'Optional: I agree to associate this invitation with my registration, usage and billing status to improve outreach. Sign-in works without consent.';
  return '<label style="display:block;margin:16px 0;font-size:13px"><input type="checkbox" name="outreach_consent" value="yes"> '+text+'</label>';
}
