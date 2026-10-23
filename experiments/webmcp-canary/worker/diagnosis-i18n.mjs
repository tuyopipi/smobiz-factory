/**
 * Message catalogs for the AEO diagnosis wording.
 *
 * Everything the diagnosis says to a person - check labels and per-status
 * messages, schema field labels, meanings and how-to text, the summaries and
 * hints - lives in worker/i18n/diagnosis/<code>.json, keyed by a stable message
 * id. The diagnosis itself carries only ids and statuses; this module turns
 * them into words on the way out.
 *
 * Catalog codes are language bases (de, fr, it ...) plus the regional variants
 * that genuinely read differently: zh-TW (Traditional Chinese), pt-BR / pt-PT,
 * and es-MX (Latin American Spanish, stored as overrides on top of es). That
 * keeps the bundle to one file per written variant rather than one per locale,
 * while every one of the plugin's 59 WordPress locales still resolves to a
 * catalog in its own language.
 *
 * Lookups walk a fallback chain per key - e.g. es-AR -> es-MX -> es -> en - so
 * a variant catalog only has to carry what differs from its parent, and a key
 * missing anywhere still reads in English rather than vanishing.
 */
import ar from "./i18n/diagnosis/ar.json" with { type: "json" };
import bg from "./i18n/diagnosis/bg.json" with { type: "json" };
import ca from "./i18n/diagnosis/ca.json" with { type: "json" };
import cs from "./i18n/diagnosis/cs.json" with { type: "json" };
import da from "./i18n/diagnosis/da.json" with { type: "json" };
import de from "./i18n/diagnosis/de.json" with { type: "json" };
import el from "./i18n/diagnosis/el.json" with { type: "json" };
import en from "./i18n/diagnosis/en.json" with { type: "json" };
import es from "./i18n/diagnosis/es.json" with { type: "json" };
import esMX from "./i18n/diagnosis/es-MX.json" with { type: "json" };
import et from "./i18n/diagnosis/et.json" with { type: "json" };
import fa from "./i18n/diagnosis/fa.json" with { type: "json" };
import fi from "./i18n/diagnosis/fi.json" with { type: "json" };
import fr from "./i18n/diagnosis/fr.json" with { type: "json" };
import fy from "./i18n/diagnosis/fy.json" with { type: "json" };
import gl from "./i18n/diagnosis/gl.json" with { type: "json" };
import gu from "./i18n/diagnosis/gu.json" with { type: "json" };
import he from "./i18n/diagnosis/he.json" with { type: "json" };
import hi from "./i18n/diagnosis/hi.json" with { type: "json" };
import hr from "./i18n/diagnosis/hr.json" with { type: "json" };
import hu from "./i18n/diagnosis/hu.json" with { type: "json" };
import id from "./i18n/diagnosis/id.json" with { type: "json" };
import it from "./i18n/diagnosis/it.json" with { type: "json" };
import ja from "./i18n/diagnosis/ja.json" with { type: "json" };
import ko from "./i18n/diagnosis/ko.json" with { type: "json" };
import lo from "./i18n/diagnosis/lo.json" with { type: "json" };
import nb from "./i18n/diagnosis/nb.json" with { type: "json" };
import nl from "./i18n/diagnosis/nl.json" with { type: "json" };
import pl from "./i18n/diagnosis/pl.json" with { type: "json" };
import ptBR from "./i18n/diagnosis/pt-BR.json" with { type: "json" };
import ptPT from "./i18n/diagnosis/pt-PT.json" with { type: "json" };
import ro from "./i18n/diagnosis/ro.json" with { type: "json" };
import ru from "./i18n/diagnosis/ru.json" with { type: "json" };
import sk from "./i18n/diagnosis/sk.json" with { type: "json" };
import sl from "./i18n/diagnosis/sl.json" with { type: "json" };
import sr from "./i18n/diagnosis/sr.json" with { type: "json" };
import sv from "./i18n/diagnosis/sv.json" with { type: "json" };
import tr from "./i18n/diagnosis/tr.json" with { type: "json" };
import uk from "./i18n/diagnosis/uk.json" with { type: "json" };
import vi from "./i18n/diagnosis/vi.json" with { type: "json" };
import zh from "./i18n/diagnosis/zh.json" with { type: "json" };
import zhTW from "./i18n/diagnosis/zh-TW.json" with { type: "json" };

/** Swiss Standard German is German without ß - the same rule the plugin's own de_CH build applies. */
const deCH = Object.fromEntries(Object.entries(de).map(([key, value]) => [key, value.replace(/ß/g, "ss")]));

export const DIAGNOSIS_CATALOGS = Object.freeze({
  ar, bg, ca, cs, da, de, "de-CH": deCH, el, en, es, "es-MX": esMX, et, fa, fi, fr, fy, gl, gu, he, hi, hr, hu, id, it,
  ja, ko, lo, nb, nl, pl, "pt-BR": ptBR, "pt-PT": ptPT, ro, ru, sk, sl, sr, sv, tr, uk, vi, zh, "zh-TW": zhTW,
});

/** Catalogs that hold only the strings that differ from their parent. */
export const PARTIAL_CATALOGS = Object.freeze(["es-MX"]);

/** Every catalog falls back through its parent to English. */
const PARENTS = Object.freeze({ "es-MX": "es", "de-CH": "de" });

export const DIAGNOSIS_LANGS = Object.freeze(Object.keys(DIAGNOSIS_CATALOGS));
const BY_LOWER = new Map(DIAGNOSIS_LANGS.map((code) => [code.toLowerCase(), code]));

/**
 * Codes that are not the catalog's own name but mean one of them. WordPress
 * and browsers both send a few of these (nn/no for Norwegian, zh-hans/zh-hant
 * scripts, ISO 639-2 fil etc. are not needed here).
 */
const ALIASES = Object.freeze({
  no: "nb", nn: "nb",
  pt: "pt-BR",
  "zh-hans": "zh", "zh-cn": "zh", "zh-sg": "zh", "zh-my": "zh",
  "zh-hant": "zh-TW", "zh-tw": "zh-TW", "zh-hk": "zh-TW", "zh-mo": "zh-TW",
  "de-ch": "de-CH", "de-li": "de-CH",
  "es-es": "es",
});

/**
 * Turn whatever the caller sent - a WordPress locale (de_DE, pt_BR), a BCP 47
 * tag (zh-Hant-HK), the plugin's lower-cased form (es-ar) or an Accept-Language
 * entry - into a catalog code. Unknown or empty input resolves to English.
 */
export function resolveDiagnosisLang(requested) {
  let value = String(requested ?? "").trim().toLowerCase().replace(/_/g, "-");
  value = value.replace(/[.@].*$/, ""); // de_DE.UTF-8, sr_RS@latin
  if (value === "") return "en";
  if (BY_LOWER.has(value)) return BY_LOWER.get(value);
  if (ALIASES[value]) return ALIASES[value];
  const parts = value.split("-");
  const base = parts[0];
  // Script subtags decide Chinese before any region does: zh-Hant-* is Traditional.
  if (base === "zh") {
    if (parts.includes("hant")) return "zh-TW";
    if (parts.includes("hans")) return "zh";
    const region = parts[parts.length - 1];
    return ["tw", "hk", "mo"].includes(region) ? "zh-TW" : "zh";
  }
  // Spanish outside Spain reads as Latin American Spanish, as the plugin's
  // es_AR/es_CL/es_CO/... locales are built from es_MX.
  if (base === "es") return parts.slice(1).some((p) => p === "es") ? "es" : "es-MX";
  // Portuguese: Brazil is its own written standard; every other region follows Portugal.
  if (base === "pt") return parts.slice(1).some((p) => p === "br") ? "pt-BR" : "pt-PT";
  if (base === "de" && parts.slice(1).some((p) => p === "ch" || p === "li")) return "de-CH";
  if (BY_LOWER.has(base)) return BY_LOWER.get(base);
  if (ALIASES[base]) return ALIASES[base];
  return "en";
}

/** The ordered catalogs a key is looked up in for this language. */
export function diagnosisFallbackChain(requested) {
  const chain = [];
  for (let code = resolveDiagnosisLang(requested); code; code = PARENTS[code]) chain.push(code);
  if (!chain.includes("en")) chain.push("en");
  return chain;
}

/**
 * One message, or undefined when no catalog in the chain has the key. Callers
 * that need "is this a known message" rely on the undefined.
 */
export function diagnosisText(requested, key, params) {
  for (const code of diagnosisFallbackChain(requested)) {
    const catalog = DIAGNOSIS_CATALOGS[code];
    if (Object.prototype.hasOwnProperty.call(catalog, key)) return params ? formatMessage(catalog[key], params) : catalog[key];
  }
  return undefined;
}

/** Fill {name} placeholders. Literal replacement: no `$&` surprises from String.replace. */
export function formatMessage(template, params = {}) {
  let out = String(template);
  for (const [name, value] of Object.entries(params)) out = out.split(`{${name}}`).join(String(value));
  return out;
}
