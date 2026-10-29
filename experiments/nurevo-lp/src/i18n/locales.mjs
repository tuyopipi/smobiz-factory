// The site's languages: one row per language that has its own pages, and one
// row per regional variant that is served by its parent's pages.
//
// The product (WordPress plugin + dashboard) ships 59 locales plus US English
// (experiments/webmcp-canary/worker/dashboard-locales.mjs,
// wordpress-plugin/webmcp-canary/languages/i18n/locales.json). The site covers
// all 60 of them, but not with 60 copies of each page:
//
//   LOCALES  - a distinct language. It gets a home page, a guide hub and every
//              guide article whose block for it is complete. `code` is the key
//              used in src/i18n.mjs, src/i18n/home/<code>.json and the
//              `locales` of src/content/*.mjs; `path` is where its home page is
//              served (existing URLs are kept: Japanese at /, English at /en/
//              with guides at /guide/).
//   VARIANTS - a regional variant whose text would be the same as (or
//              trivially different from) its parent's. It gets no page of its
//              own - a second copy of the same text is duplicate content - but
//              it is named in every hreflang cluster, pointing at the page of
//              `page` (the nearest ancestor that has pages). `parent` is the
//              product's own fallback chain (es-AR -> es-MX -> es).
//
// Choices, and why:
//   - de-AT, de-CH (the plugin's de_CH is de_DE with ß -> ss, mechanically),
//     en-AU/CA/NZ/ZA (the plugin copies en_GB) and en-GB itself (British
//     spelling only), fr-BE, fr-CA, nl-BE, zh-HK (copied from zh_TW) and every
//     Latin-American Spanish locale: same text as the parent -> hreflang only.
//   - es-MX: the product has an es_MX dictionary, but for marketing copy it
//     differs from es in a handful of words; one Spanish page for all Spanish
//     readers avoids near-duplicates. Promote it to LOCALES (path /es-mx/) the
//     day it has its own copy.
//   - pt-BR and pt-PT have their own pages: the product translates them
//     separately and they differ in vocabulary and grammar.
export const LOCALES = [
  { code: "ja", path: "/", hreflang: "ja", htmlLang: "ja", ogLocale: "ja_JP", name: "日本語", wp: "ja", dash: "ja" },
  { code: "en", path: "/en/", hreflang: "en", htmlLang: "en", ogLocale: "en_US", name: "English", wp: "en_US", dash: "en" },
  { code: "ar", path: "/ar/", hreflang: "ar", htmlLang: "ar", ogLocale: "ar_AR", name: "العربية", wp: "ar", dash: "ar", dir: "rtl" },
  { code: "bg", path: "/bg/", hreflang: "bg", htmlLang: "bg", ogLocale: "bg_BG", name: "Български", wp: "bg_BG", dash: "bg_BG" },
  { code: "ca", path: "/ca/", hreflang: "ca", htmlLang: "ca", ogLocale: "ca_ES", name: "Català", wp: "ca", dash: "ca" },
  { code: "cs", path: "/cs/", hreflang: "cs", htmlLang: "cs", ogLocale: "cs_CZ", name: "Čeština", wp: "cs_CZ", dash: "cs_CZ" },
  { code: "da", path: "/da/", hreflang: "da", htmlLang: "da", ogLocale: "da_DK", name: "Dansk", wp: "da_DK", dash: "da_DK" },
  { code: "de", path: "/de/", hreflang: "de", htmlLang: "de", ogLocale: "de_DE", name: "Deutsch", wp: "de_DE", dash: "de" },
  { code: "el", path: "/el/", hreflang: "el", htmlLang: "el", ogLocale: "el_GR", name: "Ελληνικά", wp: "el", dash: "el" },
  { code: "es", path: "/es/", hreflang: "es", htmlLang: "es", ogLocale: "es_ES", name: "Español", wp: "es_ES", dash: "es" },
  { code: "et", path: "/et/", hreflang: "et", htmlLang: "et", ogLocale: "et_EE", name: "Eesti", wp: "et", dash: "et" },
  { code: "fa", path: "/fa/", hreflang: "fa", htmlLang: "fa", ogLocale: "fa_IR", name: "فارسی", wp: "fa_IR", dash: "fa_IR", dir: "rtl" },
  { code: "fi", path: "/fi/", hreflang: "fi", htmlLang: "fi", ogLocale: "fi_FI", name: "Suomi", wp: "fi", dash: "fi" },
  { code: "fr", path: "/fr/", hreflang: "fr", htmlLang: "fr", ogLocale: "fr_FR", name: "Français", wp: "fr_FR", dash: "fr" },
  { code: "fy", path: "/fy/", hreflang: "fy", htmlLang: "fy", ogLocale: "fy_NL", name: "Frysk", wp: "fy", dash: "fy" },
  { code: "gl", path: "/gl/", hreflang: "gl", htmlLang: "gl", ogLocale: "gl_ES", name: "Galego", wp: "gl_ES", dash: "gl_ES" },
  { code: "gu", path: "/gu/", hreflang: "gu", htmlLang: "gu", ogLocale: "gu_IN", name: "ગુજરાતી", wp: "gu", dash: "gu" },
  { code: "he", path: "/he/", hreflang: "he", htmlLang: "he", ogLocale: "he_IL", name: "עברית", wp: "he_IL", dash: "he_IL", dir: "rtl" },
  { code: "hi", path: "/hi/", hreflang: "hi", htmlLang: "hi", ogLocale: "hi_IN", name: "हिन्दी", wp: "hi_IN", dash: "hi_IN" },
  { code: "hr", path: "/hr/", hreflang: "hr", htmlLang: "hr", ogLocale: "hr_HR", name: "Hrvatski", wp: "hr", dash: "hr" },
  { code: "hu", path: "/hu/", hreflang: "hu", htmlLang: "hu", ogLocale: "hu_HU", name: "Magyar", wp: "hu_HU", dash: "hu_HU" },
  { code: "id", path: "/id/", hreflang: "id", htmlLang: "id", ogLocale: "id_ID", name: "Bahasa Indonesia", wp: "id_ID", dash: "id_ID" },
  { code: "it", path: "/it/", hreflang: "it", htmlLang: "it", ogLocale: "it_IT", name: "Italiano", wp: "it_IT", dash: "it_IT" },
  { code: "ko", path: "/ko/", hreflang: "ko", htmlLang: "ko", ogLocale: "ko_KR", name: "한국어", wp: "ko_KR", dash: "ko" },
  { code: "lo", path: "/lo/", hreflang: "lo", htmlLang: "lo", ogLocale: "lo_LA", name: "ລາວ", wp: "lo", dash: "lo" },
  { code: "nb", path: "/nb/", hreflang: "nb", htmlLang: "nb", ogLocale: "nb_NO", name: "Norsk bokmål", wp: "nb_NO", dash: "nb_NO" },
  { code: "nl", path: "/nl/", hreflang: "nl", htmlLang: "nl", ogLocale: "nl_NL", name: "Nederlands", wp: "nl_NL", dash: "nl_NL" },
  { code: "pl", path: "/pl/", hreflang: "pl", htmlLang: "pl", ogLocale: "pl_PL", name: "Polski", wp: "pl_PL", dash: "pl_PL" },
  { code: "pt-BR", path: "/pt-br/", hreflang: "pt-BR", htmlLang: "pt-BR", ogLocale: "pt_BR", name: "Português (Brasil)", wp: "pt_BR", dash: "pt_BR" },
  { code: "pt-PT", path: "/pt-pt/", hreflang: "pt-PT", htmlLang: "pt-PT", ogLocale: "pt_PT", name: "Português (Portugal)", wp: "pt_PT", dash: "pt_PT" },
  { code: "ro", path: "/ro/", hreflang: "ro", htmlLang: "ro", ogLocale: "ro_RO", name: "Română", wp: "ro_RO", dash: "ro_RO" },
  { code: "ru", path: "/ru/", hreflang: "ru", htmlLang: "ru", ogLocale: "ru_RU", name: "Русский", wp: "ru_RU", dash: "ru_RU" },
  { code: "sk", path: "/sk/", hreflang: "sk", htmlLang: "sk", ogLocale: "sk_SK", name: "Slovenčina", wp: "sk_SK", dash: "sk_SK" },
  { code: "sl", path: "/sl/", hreflang: "sl", htmlLang: "sl", ogLocale: "sl_SI", name: "Slovenščina", wp: "sl_SI", dash: "sl_SI" },
  { code: "sr", path: "/sr/", hreflang: "sr", htmlLang: "sr", ogLocale: "sr_RS", name: "Српски", wp: "sr_RS", dash: "sr_RS" },
  { code: "sv", path: "/sv/", hreflang: "sv", htmlLang: "sv", ogLocale: "sv_SE", name: "Svenska", wp: "sv_SE", dash: "sv_SE" },
  { code: "tr", path: "/tr/", hreflang: "tr", htmlLang: "tr", ogLocale: "tr_TR", name: "Türkçe", wp: "tr_TR", dash: "tr_TR" },
  { code: "uk", path: "/uk/", hreflang: "uk", htmlLang: "uk", ogLocale: "uk_UA", name: "Українська", wp: "uk", dash: "uk" },
  { code: "vi", path: "/vi/", hreflang: "vi", htmlLang: "vi", ogLocale: "vi_VN", name: "Tiếng Việt", wp: "vi", dash: "vi" },
  { code: "zh", path: "/zh/", hreflang: "zh-Hans", htmlLang: "zh-Hans", ogLocale: "zh_CN", name: "简体中文", wp: "zh_CN", dash: "zh" },
  { code: "zh-TW", path: "/zh-tw/", hreflang: "zh-Hant", htmlLang: "zh-Hant", ogLocale: "zh_TW", name: "繁體中文", wp: "zh_TW", dash: "tw" },
];

// parent links by hreflang, for the walk above (VARIANTS is built from it below).
const VARIANTS_RAW = { "de-AT": "de", "de-CH": "de", "en-GB": "en", "en-AU": "en-GB", "en-CA": "en-GB", "en-NZ": "en-GB", "en-ZA": "en-GB", "es-MX": "es", "es-AR": "es-MX", "es-CL": "es-MX", "es-CO": "es-MX", "es-CR": "es-MX", "es-EC": "es-MX", "es-PE": "es-MX", "es-VE": "es-MX", "fr-BE": "fr", "fr-CA": "fr", "nl-BE": "nl", "zh-HK": "zh-TW" };

export const VARIANTS = [
  { hreflang: "de-AT", wp: "de_AT", parent: "de", name: "Deutsch (Österreich)" },
  { hreflang: "de-CH", wp: "de_CH", parent: "de", name: "Deutsch (Schweiz)" },
  { hreflang: "en-GB", wp: "en_GB", parent: "en", name: "English (UK)" },
  { hreflang: "en-AU", wp: "en_AU", parent: "en-GB", name: "English (Australia)" },
  { hreflang: "en-CA", wp: "en_CA", parent: "en-GB", name: "English (Canada)" },
  { hreflang: "en-NZ", wp: "en_NZ", parent: "en-GB", name: "English (New Zealand)" },
  { hreflang: "en-ZA", wp: "en_ZA", parent: "en-GB", name: "English (South Africa)" },
  { hreflang: "es-MX", wp: "es_MX", parent: "es", name: "Español (México)" },
  { hreflang: "es-AR", wp: "es_AR", parent: "es-MX", name: "Español (Argentina)" },
  { hreflang: "es-CL", wp: "es_CL", parent: "es-MX", name: "Español (Chile)" },
  { hreflang: "es-CO", wp: "es_CO", parent: "es-MX", name: "Español (Colombia)" },
  { hreflang: "es-CR", wp: "es_CR", parent: "es-MX", name: "Español (Costa Rica)" },
  { hreflang: "es-EC", wp: "es_EC", parent: "es-MX", name: "Español (Ecuador)" },
  { hreflang: "es-PE", wp: "es_PE", parent: "es-MX", name: "Español (Perú)" },
  { hreflang: "es-VE", wp: "es_VE", parent: "es-MX", name: "Español (Venezuela)" },
  { hreflang: "fr-BE", wp: "fr_BE", parent: "fr", name: "Français (Belgique)" },
  { hreflang: "fr-CA", wp: "fr_CA", parent: "fr", name: "Français (Canada)" },
  { hreflang: "nl-BE", wp: "nl_BE", parent: "nl", name: "Nederlands (België)" },
  { hreflang: "zh-HK", wp: "zh_HK", parent: "zh-TW", name: "繁體中文（香港）" },
].map((variant) => ({ ...variant, page: pageLocaleOf(variant.parent) }));

/** The LOCALES code whose pages serve `code` (a LOCALES code or a VARIANTS hreflang). */
function pageLocaleOf(code) {
  for (let current = code, guard = 0; current && guard < 10; guard += 1) {
    if (LOCALES.some((locale) => locale.code === current)) return current;
    current = VARIANTS_RAW[current];
  }
  throw new Error(`locales: ${code} has no ancestor with pages`);
}

/** Scripts whose words are wider than Latin letters: titles and descriptions get a lower length limit. */
export const WIDE_SCRIPT = new Set(["ja", "zh", "zh-TW", "ko"]);

/** Every product locale the site covers (59 plugin locales + en_US). */
export const ALL_WP_LOCALES = [...LOCALES.map((locale) => locale.wp), ...VARIANTS.map((variant) => variant.wp)];
