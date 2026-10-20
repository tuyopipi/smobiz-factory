const enc = new TextEncoder();
const hex = bytes => [...new Uint8Array(bytes)].map(v => v.toString(16).padStart(2,'0')).join('');
export async function digest(value) { return hex(await crypto.subtle.digest('SHA-256',enc.encode(value))); }
async function key(env, usage) {
 const secret = String(env.REFERRAL_TOKEN_SECRET || '');
 if (secret.length < 32) throw new Error('referral_secret_not_configured');
 return crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC',hash:'SHA-256'},false,[usage]);
}
export async function signReferral(env, id, purpose, expires) {
 const payload = `${id}.${purpose}.${expires}`;
 return payload + '.' + hex(await crypto.subtle.sign('HMAC',await key(env,'sign'),enc.encode(payload)));
}
export async function verifyReferral(env, token, purpose, now = Date.now()) {
 if (typeof token !== 'string' || token.length > 256) return null;
 const parts = token.split('.');
 if (parts.length !== 4 || !/^[a-f0-9]{32}$/.test(parts[0]) || parts[1] !== purpose || !/^\d{13}$/.test(parts[2]) || Number(parts[2]) <= now || !/^[a-f0-9]{64}$/.test(parts[3])) return null;
 const signature = Uint8Array.from(parts[3].match(/../g), s => parseInt(s,16));
 return await crypto.subtle.verify('HMAC',await key(env,'verify'),signature,enc.encode(parts.slice(0,3).join('.'))) ? parts[0] : null;
}
