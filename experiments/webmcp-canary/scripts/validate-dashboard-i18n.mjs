/**
 * Validates the dashboard's dictionary files.
 *
 *   node scripts/validate-dashboard-i18n.mjs            check, exit 1 on any error
 *   node scripts/validate-dashboard-i18n.mjs --pending  also list locales still to translate
 *   node scripts/validate-dashboard-i18n.mjs --json     the report as JSON
 *
 * public/dashboard-i18n/_source.json is every key with its English and
 * Japanese text ({ "<key>": { "en": "...", "ja": "..." } }). It must equal what
 * dashboard.html and the ja/en tables of dashboard-guidance.js and
 * dashboard-guide.js define, so it cannot drift from the page.
 *
 * public/dashboard-i18n/<code>.json is one locale: a flat { "<key>": "<text>" }.
 * <code> is a dashboard locale (worker/dashboard-locales.mjs) other than ja/en.
 * For each file:
 *  - every value is a non-empty string, and every key is in _source.json;
 *  - a base locale (one the plugin does not derive from another) has every key;
 *    a derived one (de_AT, es_AR, en_AU, zh_HK, ...) may list only what differs;
 *  - placeholders match English: {name}, and printf-style %s %d %1$s;
 *  - HTML markup matches English (same b/a/code/br/... tags, same number of
 *    each; a tag named in prose, like <head>, is a word and may be translated);
 *  - the onboarding text names the plugin's menu and field the way that
 *    locale's plugin translation does (obPasteWhere, obI2, obI3).
 * A locale without a file is not an error: the dashboard shows English for it.
 */
import { readFileSync, existsSync } from "node:fs";
import { DASH_LOCALES } from "../worker/dashboard-locales.mjs";
import { liveSource, sourceKeys, localeFile, localeFiles, LEGACY_LANGS } from "./dashboard-dictionary.mjs";

const WP = new URL("../wordpress-plugin/webmcp-canary/languages/i18n/", import.meta.url);
const WP_LOCALES = JSON.parse(readFileSync(new URL("locales.json", WP), "utf8"));
/** The plugin's locale for a dashboard code. */
export const WP_CODE = { ja: "ja", en: "en_US", zh: "zh_CN", tw: "zh_TW", ko: "ko_KR", es: "es_ES", fr: "fr_FR", de: "de_DE" };
export const wpCode = (code) => WP_CODE[code] || code;
/** Derived locales: the plugin builds them from another locale. */
export const isDerived = (code) => Boolean(WP_LOCALES[wpCode(code)]?.from);

export const placeholders = (s) => [...String(s).matchAll(/\{(\w+)\}|%(?:\d+\$)?[sd]/g)].map((m) => m[0]).sort().join(" ");
// Markup the page renders. Names such as <head> in prose ("paste it into <head>")
// are words, translated like any other.
const MARKUP = new Set(["a", "b", "br", "code", "em", "i", "kbd", "li", "ol", "p", "small", "span", "strong", "u", "ul"]);
export const tags = (s) => [...String(s).matchAll(/<\/?([a-zA-Z][\w-]*)\b[^>]*>/g)].filter((m) => MARKUP.has(m[1].toLowerCase())).map((m) => (m[0][1] === "/" ? "/" : "") + m[1].toLowerCase()).sort().join(" ");

function pluginCatalog(code) {
  for (let wp = wpCode(code); wp; wp = WP_LOCALES[wp]?.from) {
    const url = new URL(`${wp}.json`, WP);
    if (existsSync(url)) return JSON.parse(readFileSync(url, "utf8"));
  }
  return null;
}
const PLUGIN_TERMS = { obPasteWhere: ["Nurevo AEO", "Settings", "Pairing code", "Store / organization information"], obI2: ["Settings"], obI3: ["Pairing code"] };

export function validate() {
  const errors = [];
  const source = sourceKeys();
  const live = liveSource();
  const keys = Object.keys(source);
  for (const k of Object.keys(live)) {
    if (!(k in source)) errors.push(`_source.json: missing key ${k}`);
    else if (source[k].en !== live[k].en || source[k].ja !== live[k].ja) errors.push(`_source.json: ${k} differs from the page (run the source sync: en/ja must match dashboard.html and the modules)`);
  }
  for (const k of keys) if (!(k in live)) errors.push(`_source.json: ${k} is not used by the page`);
  const codes = DASH_LOCALES.map((r) => r[0]);
  const files = localeFiles();
  const report = { keys: keys.length, files: {}, pending: [], derived: [] };
  for (const code of files) {
    const where = `${code}.json`;
    if (!codes.includes(code) || code === "ja" || code === "en") { errors.push(`${where}: not a dashboard locale that takes a file`); continue; }
    let dict;
    try { dict = localeFile(code); } catch (e) { errors.push(`${where}: not JSON (${e.message})`); continue; }
    if (!dict || typeof dict !== "object" || Array.isArray(dict)) { errors.push(`${where}: must be one flat object`); continue; }
    const present = Object.keys(dict);
    for (const k of present) {
      const v = dict[k];
      if (!(k in source)) { errors.push(`${where}: unknown key ${k}`); continue; }
      if (typeof v !== "string" || !v.trim()) { errors.push(`${where}: ${k} must be a non-empty string`); continue; }
      const en = source[k].en;
      // The plan price is the one intended difference from Japanese, not from English.
      if (placeholders(v) !== placeholders(en)) errors.push(`${where}: ${k} placeholders [${placeholders(v)}] != English [${placeholders(en)}]`);
      if (tags(v) !== tags(en)) errors.push(`${where}: ${k} HTML tags [${tags(v)}] != English [${tags(en)}]`);
    }
    const missing = keys.filter((k) => !(k in dict));
    if (missing.length && !isDerived(code)) errors.push(`${where}: ${missing.length} of ${keys.length} keys missing (first: ${missing.slice(0, 5).join(", ")})`);
    const catalog = pluginCatalog(code);
    if (catalog) {
      for (const [key, msgids] of Object.entries(PLUGIN_TERMS)) {
        if (!(key in dict)) continue;
        for (const msgid of msgids) {
          const word = catalog[msgid] || msgid;
          if (!dict[key].includes(word)) errors.push(`${where}: ${key} should name "${word}" as the plugin's ${wpCode(code)} translation does (msgid "${msgid}")`);
        }
      }
    }
    report.files[code] = { keys: present.length, missing: missing.length };
  }
  for (const code of codes) {
    if (code === "ja" || code === "en" || files.includes(code)) continue;
    (isDerived(code) ? report.derived : report.pending).push(code);
  }
  return { errors, report, legacy: LEGACY_LANGS };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { errors, report } = validate();
  if (process.argv.includes("--json")) console.log(JSON.stringify({ errors, ...report }, null, 1));
  else {
    for (const e of errors.slice(0, 200)) console.error(`  ✗ ${e}`);
    if (errors.length > 200) console.error(`  ... and ${errors.length - 200} more`);
    console.log(`dashboard i18n: ${report.keys} keys; files: ${Object.keys(report.files).join(" ") || "none"}`);
    if (process.argv.includes("--pending")) {
      console.log(`to translate (${report.pending.length}): ${report.pending.join(" ")}`);
      console.log(`derived, fall back to their parent (${report.derived.length}): ${report.derived.join(" ")}`);
    }
  }
  if (errors.length) { console.error(`dashboard i18n: ${errors.length} error(s)`); process.exit(1); }
  console.log("dashboard i18n files valid");
}
