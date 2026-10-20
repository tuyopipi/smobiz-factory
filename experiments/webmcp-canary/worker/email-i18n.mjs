import { renderMasterEmail } from './referral-email-copy.mjs';
// Canonical email locales; the dashboard historically calls zh-tw "tw".
export const EMAIL_LOCALES = ["ja", "en", "zh", "zh-tw", "ko", "es", "fr", "de"];
export function normalizeEmailLocale(value) {
  const tag = String(value || "").trim().toLowerCase().replaceAll("_", "-");
  if (tag === "tw" || /^(zh-(tw|hk|hant))($|-)/.test(tag)) return "zh-tw";
  const base = tag.split("-")[0];
  return EMAIL_LOCALES.includes(base) ? base : null;
}
export function headerEmailLocale(header) {
  return String(header || "").split(",").map((part, index) => {
    const [tag, ...params] = part.trim().split(";");
    const qParam = params.find(p => p.trim().startsWith("q="));
    const q = qParam ? Number(qParam.trim().slice(2)) : 1;
    return { locale: normalizeEmailLocale(tag), q, index };
  }).filter(x => x.locale && x.q > 0 && x.q <= 1)
    .sort((a, b) => b.q - a.q || a.index - b.index)[0]?.locale || null;
}
export function resolveEmailLocale({ language, registration_locale } = {}, header) {
  return normalizeEmailLocale(language) || normalizeEmailLocale(registration_locale) || headerEmailLocale(header) || "en";
}
export async function loadEmailPreferences(env, email) {
  if (!env.DB) return {};
  return await env.DB.prepare("SELECT language,registration_locale FROM member_email_preferences WHERE email=?")
    .bind(email.toLowerCase()).first() || {};
}
export function registrationLocaleStatement(env, email, locale) {
  return env.DB.prepare("INSERT INTO member_email_preferences (email,registration_locale) VALUES (?,?) ON CONFLICT(email) DO NOTHING")
    .bind(email.toLowerCase(), locale);
}
export function magicLinkEmail(link, locale, options = {}) {
 return renderMasterEmail(normalizeEmailLocale(locale) || 'en','magic',{magic_link:link,...options});
}
// Email verification and login use the supplied login/identity-verification master.
export function signupLinkEmail(link, locale, options = {}) {
 return magicLinkEmail(link,locale,options);
}
