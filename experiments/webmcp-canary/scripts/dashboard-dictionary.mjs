/**
 * The dashboard's word dictionary, read from the real files.
 *
 * Japanese and English are inline in dashboard.html (I and the I2..I5 blocks)
 * and in the ja/en tables of dashboard-guidance.js and dashboard-guide.js.
 * Every other language is public/dashboard-i18n/<code>.json: one flat object,
 * key -> string. Keys are the dashboard's own (summary, obI2, ...) plus the
 * module tables flattened by path (guidance.panel.wp.2.0, guide.content.steps.0.1).
 * public/dashboard-i18n/_source.json lists every key with its en and ja text.
 *
 * loadDictionary() returns I for the eight original languages exactly as the
 * page builds it (English, overlaid with the language's file), so tests that
 * load a module on its own can use `tFor` to give it the same t().
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import vm from "node:vm";
import { DASH_LOCALES } from "../worker/dashboard-locales.mjs";

/** The eight languages whose translations are complete and tested in depth. */
export const LANGS = ["ja", "en", "zh", "tw", "ko", "es", "fr", "de"];
export const LEGACY_LANGS = LANGS;
export const ALL_LOCALES = DASH_LOCALES.map((row) => row[0]);

const PUBLIC = new URL("../public/", import.meta.url);
export const I18N_DIR = new URL("dashboard-i18n/", PUBLIC);
const read = (path) => readFileSync(new URL(path, PUBLIC), "utf8");

/** The inline dashboard script (the one that defines render). */
export function dashboardSource() {
  const html = read("dashboard.html");
  return [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((b) => b.includes("function render"));
}

/** The raw file for a locale, or null when there is none. */
export function localeFile(code) {
  const url = new URL(`${code}.json`, I18N_DIR);
  return existsSync(url) ? JSON.parse(readFileSync(url, "utf8")) : null;
}
/** Locale codes that have a file (not _source.json). */
export function localeFiles() {
  return readdirSync(I18N_DIR).filter((f) => f.endsWith(".json") && !f.startsWith("_")).map((f) => f.slice(0, -5)).sort();
}
export function sourceKeys() {
  return JSON.parse(readFileSync(new URL("_source.json", I18N_DIR), "utf8"));
}

/** Japanese and English as the inline script defines them. */
export function inlineDictionary() {
  const source = dashboardSource();
  const merge = source.indexOf("I.ja=Object.assign");
  if (merge < 0) throw new Error("dashboard.html: dictionary merge line not found");
  const head = source.slice(0, source.indexOf("\n", merge));
  return new Function(`${head}\n;return { I, I2, I3, I4, I5, DASH_LOCALES };`)();
}

export function loadDictionary() {
  const { I, I2, I3, I4, I5 } = inlineDictionary();
  const files = {};
  for (const lang of LANGS.slice(2)) {
    files[lang] = localeFile(lang) || {};
    I[lang] = Object.assign({}, I.en, pick(files[lang], (k) => k in I.en));
  }
  return { I, I2, I3, I4, I5, LANGS, files };
}

function pick(obj, keep) { return Object.fromEntries(Object.entries(obj).filter(([k]) => keep(k))); }

/** Put the eight original languages into a page's I, as if it had fetched them. */
export function preloadInto(pageI) {
  const { I } = loadDictionary();
  for (const lang of LANGS.slice(2)) pageI[lang] = Object.assign({}, I[lang], pick(localeFile(lang) || {}, (k) => k.includes(".")));
  return pageI;
}

/** t() for one language, as the dashboard defines it. */
export function tFor(lang = "ja") {
  const { I } = loadDictionary();
  return (k) => (I[lang] || I.en)[k] || I.en[k] || I.ja[k] || k;
}

/* ---------- the nested tables of dashboard-guidance.js and dashboard-guide.js ---------- */

function moduleInternals(file, names) {
  const el = () => ({ style: {}, dataset: {}, classList: { toggle() {}, add() {}, remove() {} }, appendChild() {}, setAttribute() {}, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] });
  const sandbox = {
    document: { createElement: el, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, head: { appendChild() {} }, documentElement: {} },
    MutationObserver: class { observe() {} }, setTimeout() {}, localStorage: { getItem: () => null, setItem() {} }, console, Object, Array, String, JSON,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read(file).replace(/\}\)\(\);\s*$/, `  window.__x = {${names}};\n})();`), sandbox);
  return sandbox.window.__x;
}

/** prefix -> { ja, en } for every nested table, by the prefix its keys carry. */
export function moduleTables() {
  const gd = moduleInternals("dashboard-guidance.js", "checklistText, billingStatusText, deliveryText, staticText, G");
  const gu = moduleInternals("dashboard-guide.js", "GUIDE, PAYMENT, GUIDE_UI");
  return {
    "guidance.checklist": gd.checklistText, "guidance.billing": gd.billingStatusText, "guidance.delivery": gd.deliveryText,
    "guidance.static": gd.staticText, "guidance.panel": gd.G,
    "guide.content": gu.GUIDE, "guide.payment": gu.PAYMENT, "guide.ui": gu.GUIDE_UI,
  };
}

export function flatten(value, path, out = {}) {
  if (typeof value === "string") out[path] = value;
  else if (Array.isArray(value)) value.forEach((x, i) => flatten(x, `${path}.${i}`, out));
  else if (value && typeof value === "object") for (const [k, x] of Object.entries(value)) flatten(x, `${path}.${k}`, out);
  return out;
}

/**
 * Every translatable key with its en and ja text, from the live sources. A
 * nested leaf that is the same in Japanese and English and looks like an id or
 * a step number ("guide-install", "sites", "1") is not a word and is left out.
 */
export function liveSource() {
  const { I } = inlineDictionary();
  const out = {};
  for (const k of Object.keys(I.en)) out[k] = { en: I.en[k], ja: I.ja[k] };
  for (const [prefix, table] of Object.entries(moduleTables())) {
    const en = flatten(table.en, prefix), ja = flatten(table.ja, prefix);
    for (const k of Object.keys(en)) {
      if (en[k] === ja[k] && /^(?:[a-z]+(?:-[a-z]+)*|\d+)$/.test(en[k])) continue;
      out[k] = { en: en[k], ja: ja[k] };
    }
  }
  return out;
}
