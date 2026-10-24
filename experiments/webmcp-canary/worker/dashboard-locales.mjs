/**
 * The dashboard's languages: the 59 locales the WordPress plugin ships
 * (wordpress-plugin/webmcp-canary/languages/i18n/locales.json) plus US
 * English, the source language.
 *
 * Eight codes predate this list and are kept as they were, because they are
 * stored in browsers (nrv-dash-lang) and sent to the API (?lang=tw):
 *   ja, en (en_US), zh (zh_CN), tw (zh_TW), ko (ko_KR), es (es_ES), fr (fr_FR),
 *   de (de_DE).
 * Every other locale uses the plugin's code (pt_BR, he_IL, ...).
 *
 * Each row: [code, native name, BCP 47 tag, parent]. A missing word falls
 * back along the parent chain and then to English (es_AR -> es_MX -> es -> en).
 * public/dashboard.html carries the same table inline (DASH_LOCALES), and
 * scripts/test-dashboard-locales.mjs keeps the two and the plugin's list equal.
 */
export const DASH_LOCALES = [
  ["ja", "日本語", "ja"],
  ["ar", "العربية", "ar"],
  ["bg_BG", "Български", "bg-BG"],
  ["ca", "Català", "ca"],
  ["cs_CZ", "Čeština", "cs-CZ"],
  ["da_DK", "Dansk", "da-DK"],
  ["de", "Deutsch", "de"],
  ["de_AT", "Deutsch (Österreich)", "de-AT", "de"],
  ["de_CH", "Deutsch (Schweiz)", "de-CH", "de"],
  ["el", "Ελληνικά", "el"],
  ["en", "English (US)", "en"],
  ["en_AU", "English (Australia)", "en-AU", "en_GB"],
  ["en_CA", "English (Canada)", "en-CA", "en_GB"],
  ["en_GB", "English (UK)", "en-GB", "en"],
  ["en_NZ", "English (New Zealand)", "en-NZ", "en_GB"],
  ["en_ZA", "English (South Africa)", "en-ZA", "en_GB"],
  ["es", "Español (España)", "es"],
  ["es_AR", "Español (Argentina)", "es-AR", "es_MX"],
  ["es_CL", "Español (Chile)", "es-CL", "es_MX"],
  ["es_CO", "Español (Colombia)", "es-CO", "es_MX"],
  ["es_CR", "Español (Costa Rica)", "es-CR", "es_MX"],
  ["es_EC", "Español (Ecuador)", "es-EC", "es_MX"],
  ["es_MX", "Español (México)", "es-MX", "es"],
  ["es_PE", "Español (Perú)", "es-PE", "es_MX"],
  ["es_VE", "Español (Venezuela)", "es-VE", "es_MX"],
  ["et", "Eesti", "et"],
  ["fa_IR", "فارسی", "fa-IR"],
  ["fi", "Suomi", "fi"],
  ["fr", "Français (France)", "fr"],
  ["fr_BE", "Français (Belgique)", "fr-BE", "fr"],
  ["fr_CA", "Français (Canada)", "fr-CA", "fr"],
  ["fy", "Frysk", "fy"],
  ["gl_ES", "Galego", "gl-ES"],
  ["gu", "ગુજરાતી", "gu"],
  ["he_IL", "עברית", "he-IL"],
  ["hi_IN", "हिन्दी", "hi-IN"],
  ["hr", "Hrvatski", "hr"],
  ["hu_HU", "Magyar", "hu-HU"],
  ["id_ID", "Bahasa Indonesia", "id-ID"],
  ["it_IT", "Italiano", "it-IT"],
  ["ko", "한국어", "ko"],
  ["lo", "ລາວ", "lo"],
  ["nb_NO", "Norsk bokmål", "nb-NO"],
  ["nl_BE", "Nederlands (België)", "nl-BE", "nl_NL"],
  ["nl_NL", "Nederlands", "nl-NL"],
  ["pl_PL", "Polski", "pl-PL"],
  ["pt_BR", "Português (Brasil)", "pt-BR"],
  ["pt_PT", "Português (Portugal)", "pt-PT"],
  ["ro_RO", "Română", "ro-RO"],
  ["ru_RU", "Русский", "ru-RU"],
  ["sk_SK", "Slovenčina", "sk-SK"],
  ["sl_SI", "Slovenščina", "sl-SI"],
  ["sr_RS", "Српски", "sr-RS"],
  ["sv_SE", "Svenska", "sv-SE"],
  ["tr_TR", "Türkçe", "tr-TR"],
  ["uk", "Українська", "uk"],
  ["vi", "Tiếng Việt", "vi"],
  ["zh", "简体中文", "zh-CN"],
  ["tw", "繁體中文（台灣）", "zh-TW"],
  ["zh_HK", "繁體中文（香港）", "zh-HK", "tw"],
];

export const DASH_LOCALE_CODES = DASH_LOCALES.map((row) => row[0]);
/** Written right to left. */
export const DASH_RTL = ["ar", "fa_IR", "he_IL"];
/** The plugin's code for each dashboard code (en is the plugin's source, en_US). */
export const LEGACY_TO_WP = { ja: "ja", en: "en_US", zh: "zh_CN", tw: "zh_TW", ko: "ko_KR", es: "es_ES", fr: "fr_FR", de: "de_DE" };

const BY_TAG = {};
for (const [code, , tag, from] of DASH_LOCALES) {
  BY_TAG[code.toLowerCase().replace(/_/g, "-")] = code;
  BY_TAG[tag.toLowerCase()] = code;
  const base = tag.toLowerCase().split("-")[0];
  if (!from && !(base in BY_TAG)) BY_TAG[base] = code;
}
for (const [code, wp] of Object.entries(LEGACY_TO_WP)) BY_TAG[wp.toLowerCase().replace(/_/g, "-")] = code;
// Bases whose first listed locale is not the right default, and old ISO codes.
Object.assign(BY_TAG, { pt: "pt_PT", iw: "he_IL", in: "id_ID", no: "nb_NO", nn: "nb_NO" });

/**
 * Any language tag (a dashboard code, a WordPress locale, BCP 47 from the
 * browser or Accept-Language) to the dashboard locale that serves it best, or
 * null. A region the list has is kept (es-MX, pt-BR, fr-CA); a region it does
 * not have falls back to the language (fr-CH -> fr), except that Spanish
 * outside Spain reads as Latin American (es-419, es-US -> es_MX) and
 * Liechtenstein German as Swiss. Chinese is decided by script, then region:
 * zh-Hant / zh-TW / zh-MO -> tw, zh-HK -> zh_HK, everything else -> zh.
 */
export function normalizeDashboardLocale(value) {
  const s = String(value ?? "").trim().toLowerCase().replace(/_/g, "-").replace(/[.@].*$/, "");
  if (!s) return null;
  const parts = s.split("-");
  const base = parts[0];
  if (base === "tw") return "tw";
  if (base === "zh") {
    if (parts.includes("hk")) return "zh_HK";
    if (parts.includes("hant") || parts.includes("tw") || parts.includes("mo")) return "tw";
    return "zh";
  }
  if (BY_TAG[s]) return BY_TAG[s];
  const region = parts.slice(1).find((p) => !/^[a-z]{4}$/.test(p));
  if (region && BY_TAG[`${base}-${region}`]) return BY_TAG[`${base}-${region}`];
  if (base === "es" && region && region !== "es") return "es_MX";
  if (base === "de" && region === "li") return "de_CH";
  return BY_TAG[base] || null;
}

/** RTL locales. */
export function isRtlLocale(code) { return DASH_RTL.includes(code); }
