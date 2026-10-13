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
const COPY = {
  ja: ["Nurevoへのログインリンク", "Nurevoにログインするには、次のリンクを開いてください。", "ログインする", "このリンクは15分間有効です。", "このメールに心当たりがない場合は、無視してください。"],
  en: ["Sign in to Nurevo", "Open the following link to sign in to Nurevo.", "Sign in to Nurevo", "This link expires in 15 minutes.", "If you did not request this email, you can ignore it."],
  zh: ["Nurevo 登录链接", "请打开以下链接登录 Nurevo。", "登录 Nurevo", "此链接在15分钟内有效。", "如果您未请求此邮件，请忽略。"],
  "zh-tw": ["Nurevo 登入連結", "請開啟以下連結登入 Nurevo。", "登入 Nurevo", "此連結在15分鐘內有效。", "如果您未要求此郵件，請忽略。"],
  ko: ["Nurevo 로그인 링크", "Nurevo에 로그인하려면 아래 링크를 열어 주세요.", "Nurevo에 로그인", "이 링크는 15분 동안 유효합니다.", "이 이메일을 요청하지 않으셨다면 무시해 주세요."],
  es: ["Enlace para iniciar sesión en Nurevo", "Abre el siguiente enlace para iniciar sesión en Nurevo.", "Iniciar sesión en Nurevo", "Este enlace caduca en 15 minutos.", "Si no has solicitado este correo, puedes ignorarlo."],
  fr: ["Lien de connexion à Nurevo", "Ouvrez le lien suivant pour vous connecter à Nurevo.", "Se connecter à Nurevo", "Ce lien expire dans 15 minutes.", "Si vous n’avez pas demandé cet e-mail, vous pouvez l’ignorer."],
  de: ["Anmeldelink für Nurevo", "Öffnen Sie den folgenden Link, um sich bei Nurevo anzumelden.", "Bei Nurevo anmelden", "Dieser Link läuft nach 15 Minuten ab.", "Wenn Sie diese E-Mail nicht angefordert haben, können Sie sie ignorieren."]
};
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[c]));
export function magicLinkEmail(link, locale) {
  const lang = normalizeEmailLocale(locale) || "en";
  const [subject, intro, action, expiry, ignore] = COPY[lang];
  return { subject, text: `${intro}\n\n${link}\n\n${expiry}\n${ignore}`,
    html: `<html lang="${lang}"><body><p>${escapeHtml(intro)}</p><p><a href="${escapeHtml(link)}">${escapeHtml(action)}</a></p><p>${escapeHtml(expiry)}</p><p>${escapeHtml(ignore)}</p></body></html>` };
}
