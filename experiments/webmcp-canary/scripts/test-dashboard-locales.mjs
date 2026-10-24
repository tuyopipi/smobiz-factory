/**
 * The dashboard's 60 locales: the WordPress plugin's 59 plus US English.
 *
 * Japanese and English are inline in dashboard.html; every other language is
 * public/dashboard-i18n/<code>.json, fetched the first time it is shown. These
 * run the real inline script under a DOM shim and check:
 *  - the locale table matches worker/dashboard-locales.mjs and the plugin's
 *    locales.json, and the picker lists every locale by its native name;
 *  - browser tags map to the best locale, the same way in the page and in the
 *    worker (regional variants, pt_BR vs pt_PT, zh_TW / zh_HK, es_419 ...);
 *  - a language is fetched lazily, once, along its parent chain, and nothing is
 *    fetched for ja/en; a missing file or key, or a failed fetch, is English;
 *  - the module tables (guide, guidance) are overlaid from the same files;
 *  - ar / fa_IR / he_IL set dir="rtl" on <html>, everything else ltr;
 *  - the files and _source.json pass the validator.
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";
import { DASH_LOCALES, DASH_RTL, normalizeDashboardLocale, LEGACY_TO_WP } from "../worker/dashboard-locales.mjs";
import { dashboardSource, inlineDictionary, localeFile, moduleTables, sourceKeys } from "./dashboard-dictionary.mjs";
import { validate } from "./validate-dashboard-i18n.mjs";

const HTML = readFileSync(new URL("../public/dashboard.html", import.meta.url), "utf8");
const SOURCE = dashboardSource();
const WP_LOCALES = JSON.parse(readFileSync(new URL("../wordpress-plugin/webmcp-canary/languages/i18n/locales.json", import.meta.url), "utf8"));
const CODES = DASH_LOCALES.map((r) => r[0]);

/* ---------------- 1. the locale table ---------------- */

{
  assert.equal(CODES.length, 60, "59 plugin locales plus US English");
  assert.equal(new Set(CODES).size, 60, "no code twice");
  assert.deepEqual(inlineDictionary().DASH_LOCALES, DASH_LOCALES, "dashboard.html carries the worker's table");
  const wp = (code) => LEGACY_TO_WP[code] || code;
  assert.deepEqual(CODES.filter((c) => c !== "en").map(wp).sort(), Object.keys(WP_LOCALES).sort(), "the same locales the plugin ships");
  for (const [code, name, tag, from] of DASH_LOCALES) {
    assert.ok(name && name.trim(), `${code} has a native name`);
    assert.match(tag, /^[a-z]{2,3}(-[A-Z]{2})?$/, `${code}: BCP 47 tag ${tag}`);
    if (from) assert.ok(CODES.includes(from), `${code}: parent ${from} is a locale`);
    const wpFrom = WP_LOCALES[wp(code)]?.from;
    if (wpFrom) assert.equal(wp(from), wpFrom, `${code}: falls back to what the plugin builds it from`);
  }
  assert.equal(new Set(DASH_LOCALES.map((r) => r[1])).size, 60, "every native name is distinct");
  for (const [code, sample] of [["ja", "日本語"], ["ko", "한국어"], ["ar", "العربية"], ["he_IL", "עברית"], ["pt_BR", "Português (Brasil)"], ["pt_PT", "Português (Portugal)"], ["tw", "繁體中文（台灣）"], ["zh_HK", "繁體中文（香港）"]]) {
    assert.equal(DASH_LOCALES.find((r) => r[0] === code)[1], sample, `${code} is called ${sample}`);
  }
  const options = [...HTML.matchAll(/<option value="([^"]+)" lang="([^"]+)"( dir="rtl")?>([^<]+)<\/option>/g)];
  assert.deepEqual(options.map((m) => m[1]), CODES, "the picker lists all 60, in table order");
  for (const m of options) {
    const row = DASH_LOCALES.find((r) => r[0] === m[1]);
    assert.equal(m[2], row[2], `${m[1]}: option lang`);
    assert.equal(m[4], row[1], `${m[1]}: option shows the native name`);
    assert.equal(Boolean(m[3]), DASH_RTL.includes(m[1]), `${m[1]}: dir=rtl only for RTL scripts`);
  }
  assert.deepEqual([...DASH_RTL].sort(), ["ar", "fa_IR", "he_IL"]);
}

/* ---------------- 2. the page under a shim ---------------- */

function fakeNode() {
  const node = {
    className: "", dataset: {}, innerHTML: "", value: "", textContent: "", style: {}, attrs: {},
    classList: { toggle() {}, add() {}, remove() {} },
    setAttribute(k, v) { node.attrs[k] = String(v); }, removeAttribute(k) { delete node.attrs[k]; },
    appendChild() {}, append() {}, remove() {}, addEventListener() {}, removeEventListener() {}, closest: () => null,
    querySelector(selector) { if (!node.children.has(selector)) node.children.set(selector, fakeNode()); return node.children.get(selector); },
    querySelectorAll: () => [], children: new Map(),
  };
  return node;
}
const tick = () => new Promise((resolve) => setImmediate(resolve));
async function settle() { for (let i = 0; i < 6; i++) await tick(); }

/**
 * files: code -> object to serve, "fail" to reject, or absent (404). Default:
 * the real files in public/dashboard-i18n/.
 */
function boot({ storage = {}, languages, files } = {}) {
  const roots = new Map();
  const store = { ...storage };
  const fetched = [];
  const serve = (code) => {
    if (files) return files[code];
    return localeFile(code) || undefined;
  };
  const html = { lang: "ja", dir: "" };
  const sandbox = {
    document: {
      createElement: () => fakeNode(), querySelector(s) { if (!roots.has(s)) roots.set(s, fakeNode()); return roots.get(s); },
      querySelectorAll: () => [], addEventListener() {}, head: { appendChild() {} }, body: fakeNode(), documentElement: html, cookie: "",
    },
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
    location: { hash: "", pathname: "/dashboard", search: "", href: "https://nurevo.jp/dashboard", origin: "https://nurevo.jp", reload() {} },
    history: { replaceState() {}, pushState() {} },
    addEventListener() {}, navigator: languages ? { languages } : {},
    Headers: class { has() { return false; } set() {} }, URL, URLSearchParams, Promise,
    FormData: class { get() { return ""; } }, MutationObserver: class { observe() {} },
    setTimeout() {}, clearTimeout() {},
    fetch: async (url) => {
      const m = /^\/dashboard-i18n\/([\w]+)\.json\?v=/.exec(String(url));
      if (!m) return { ok: true, json: async () => ({}) };
      fetched.push(m[1]);
      const body = serve(m[1]);
      if (body === "fail") throw new TypeError("network");
      return body === undefined ? { ok: false, status: 404, json: async () => ({}) } : { ok: true, json: async () => JSON.parse(JSON.stringify(body)) };
    },
    Number, Math, String, Date, JSON, Array, Object, Error, RegExp, console, encodeURIComponent, decodeURIComponent,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`${SOURCE}
;globalThis.__get = (n) => eval(n);
;globalThis.__setLang = (v) => { lang = v; };`, sandbox);
  return { sandbox, html, store, fetched, roots, get: (n) => sandbox.__get(n), setLang: (v) => sandbox.__setLang(v) };
}

/* ---------------- 3. browser language -> locale, page and worker alike ---------------- */

{
  const app = boot();
  const normLang = app.get("normLang");
  const CASES = {
    ja: "ja", "ja-JP": "ja", en: "en", "en-US": "en", "en-GB": "en_GB", "en-AU": "en_AU", "en-IE": "en", en_ZA: "en_ZA",
    es: "es", "es-ES": "es", "es-MX": "es_MX", es_MX: "es_MX", "es-AR": "es_AR", "es-419": "es_MX", "es-US": "es_MX", "es-UY": "es_MX",
    pt: "pt_PT", "pt-PT": "pt_PT", "pt-BR": "pt_BR", pt_BR: "pt_BR", "pt-AO": "pt_PT",
    zh: "zh", "zh-CN": "zh", "zh-SG": "zh", "zh-Hans": "zh", "zh-Hans-CN": "zh", "zh-TW": "tw", zh_TW: "tw", tw: "tw", "zh-Hant": "tw", "zh-MO": "tw",
    "zh-HK": "zh_HK", zh_HK: "zh_HK", "zh-Hant-HK": "zh_HK", "zh-Hant-TW": "tw",
    fr: "fr", "fr-FR": "fr", "fr-CA": "fr_CA", "fr-BE": "fr_BE", "fr-CH": "fr", de: "de", "de-DE": "de", "de-AT": "de_AT", "de-CH": "de_CH", "de-LI": "de_CH", de_DE: "de",
    ko: "ko", "ko-KR": "ko", ko_KR: "ko", nl: "nl_NL", "nl-BE": "nl_BE", "nl-NL": "nl_NL",
    ar: "ar", "ar-EG": "ar", he: "he_IL", iw: "he_IL", "he-IL": "he_IL", fa: "fa_IR", "fa-IR": "fa_IR", "fa-AF": "fa_IR",
    it: "it_IT", "it-CH": "it_IT", nb: "nb_NO", no: "nb_NO", nn: "nb_NO", id: "id_ID", in: "id_ID", sr: "sr_RS", "sr-Latn-RS": "sr_RS", "sr-Cyrl": "sr_RS",
    uk: "uk", "uk-UA": "uk", vi: "vi", "hi-IN": "hi_IN", gu: "gu", lo: "lo", fy: "fy", ca: "ca", "ca-ES": "ca", gl: "gl_ES", "de_DE.UTF-8": "de", "sr_RS@latin": "sr_RS",
    xx: null, "": null, klingon: null, "x-pig-latin": null,
  };
  for (const [tag, want] of Object.entries(CASES)) {
    assert.equal(normLang(tag), want, `page: ${tag || "(empty)"} -> ${want}`);
    assert.equal(normalizeDashboardLocale(tag), want, `worker: ${tag || "(empty)"} -> ${want}`);
  }
  // Every code, tag and plugin code maps to itself, in both.
  for (const [code, , tag] of DASH_LOCALES) {
    for (const v of [code, tag, LEGACY_TO_WP[code] || code]) {
      assert.equal(normLang(v), code, `page: ${v} is ${code}`);
      assert.equal(normalizeDashboardLocale(v), code, `worker: ${v} is ${code}`);
    }
  }
  // pickLang order is unchanged, and the stored dashboard locale wins over the email language.
  const pick = boot({ languages: ["pt-BR"] }).get("pickLang");
  assert.equal(pick(null), "pt_BR", "the browser's pt-BR");
  assert.equal(pick({ dashboard_locale: "he_IL", language: "en" }), "he_IL", "the dashboard locale the member chose");
  assert.equal(pick({ dashboard_locale: null, language: "zh-tw" }), "tw", "else the email language");
  assert.equal(boot({ storage: { "nrv-dash-lang": "es_AR" }, languages: ["de"] }).get("lang"), "es_AR", "a saved choice beats the browser");
  assert.equal(boot({ languages: ["xx", "sv-SE"] }).get("lang"), "sv_SE");
}

/* ---------------- 4. lazy loading and fallback ---------------- */

{
  // ja and en are inline: nothing is fetched, ever.
  for (const lang of ["ja", "en"]) {
    const app = boot({ storage: { "nrv-dash-lang": lang } });
    app.sandbox.render();
    await settle();
    assert.deepEqual(app.fetched, [], `${lang}: no dictionary fetch`);
    assert.equal(app.html.lang, lang);
    assert.equal(app.html.dir, "ltr");
  }
}
{
  // A legacy language is fetched on first render, then the page renders again in it.
  const app = boot({ storage: { "nrv-dash-lang": "ko" } });
  const I = app.get("I");
  assert.equal(I.ko, undefined, "ko is not in the page until it is needed");
  app.sandbox.render();
  assert.equal(app.html.lang, "ko");
  await settle();
  assert.deepEqual(app.fetched, ["ko"], "ko.json, once");
  assert.equal(app.get("t")("summary"), localeFile("ko").summary, "Korean words once loaded");
  app.sandbox.render(); await settle();
  assert.deepEqual(app.fetched, ["ko"], "not fetched again");
  // Every module table key comes back through tree(), exactly as the file has it.
  const tables = moduleTables();
  const tree = app.sandbox.nrvI18n.tree;
  const file = localeFile("ko");
  const flat = (v, p, out = {}) => (typeof v === "string" ? (out[p] = v, out) : (Object.entries(v).forEach(([k, x]) => flat(x, `${p}.${k}`, out)), out));
  for (const [prefix, table] of Object.entries(tables)) {
    const got = flat(tree(prefix, table.en, table.ja, "ko"), prefix);
    for (const [k, v] of Object.entries(got)) assert.equal(v, file[k] ?? flat(table.en, prefix)[k], `ko ${k}`);
    assert.equal(tree(prefix, table.en, table.ja, "ja"), table.ja, "ja is the module's own table");
    assert.equal(tree(prefix, table.en, table.ja, "en"), table.en, "en is the module's own table");
  }
}
{
  // A derived locale walks its parent chain: es_AR -> es_MX -> es (en and ja never fetched).
  const app = boot({ storage: { "nrv-dash-lang": "es_AR" } });
  const words = await app.sandbox.nrvI18n.ready();
  assert.deepEqual([...app.fetched].sort(), ["es", "es_AR", "es_MX"], "the chain, in parallel");
  assert.equal(words.summary, localeFile("es").summary, "Spain's words until es_MX/es_AR have their own");
  assert.equal(app.html.dir, "", "nothing rendered yet");
  // Two at once: one request each.
  const two = boot({ storage: { "nrv-dash-lang": "zh_HK" } });
  await Promise.all([two.sandbox.nrvI18n.ready(), two.sandbox.nrvI18n.ready("zh_HK"), two.sandbox.ensureLocale("zh_HK")]);
  assert.deepEqual([...two.fetched].sort(), ["tw", "zh_HK"], "zh_HK and its parent tw, once each");
  assert.equal(two.get("t")("summary"), localeFile("tw").summary, "Hong Kong reads Taiwan's words");
}
{
  // A locale with no file yet (the 35 awaiting translation) is English, key by key, with no raw keys.
  const app = boot({ storage: { "nrv-dash-lang": "pt_BR" } });
  await app.sandbox.nrvI18n.ready();
  assert.deepEqual(app.fetched, ["pt_BR"]);
  const { I } = inlineDictionary();
  for (const k of Object.keys(I.en)) assert.equal(app.get("t")(k), I.en[k], `pt_BR.${k} falls back to English`);
  assert.equal(app.get("tf")("plProHead", { buy: "X", usd: 40 }), I.en.plProHead.replace("{buy}", "X").replace("{usd}", "40"), "US prices, as in English");
}
{
  // A partial file: what it has is used, the rest is English. Junk values are ignored.
  const files = { it_IT: { summary: "Riepilogo", sites: "", partner: 7, "guide.ui.more": "Scopri di più", notAKey: "x" } };
  const app = boot({ storage: { "nrv-dash-lang": "it_IT" }, files });
  await app.sandbox.nrvI18n.ready();
  const { I } = inlineDictionary();
  assert.equal(app.get("t")("summary"), "Riepilogo");
  assert.equal(app.get("t")("sites"), I.en.sites, "an empty string is not a translation");
  assert.equal(app.get("t")("partner"), I.en.partner, "nor is a number");
  const ui = moduleTables()["guide.ui"];
  assert.deepEqual(JSON.parse(JSON.stringify(app.sandbox.nrvI18n.tree("guide.ui", ui.en, ui.ja))), { ...ui.en, more: "Scopri di più" });
}
{
  // A failed fetch is English, and the page does not wait forever.
  const app = boot({ storage: { "nrv-dash-lang": "ru_RU" }, files: { ru_RU: "fail" } });
  const words = await app.sandbox.nrvI18n.ready();
  assert.equal(words.summary, inlineDictionary().I.en.summary);
  // An unknown code is English.
  assert.equal(await app.sandbox.ensureLocale("xx"), app.get("I").en);
}
{
  // de_CH writes ss for ß, as the plugin's de-CH transform does.
  const de = localeFile("de");
  const key = Object.keys(de).find((k) => de[k].includes("ß"));
  assert.ok(key, "German has a word with ß");
  const app = boot({ storage: { "nrv-dash-lang": "de_CH" } });
  await app.sandbox.nrvI18n.ready();
  assert.equal(app.get("t")(key), de[key].replace(/ß/g, "ss"));
  assert.ok(!Object.values(app.get("I").de_CH).some((v) => v.includes("ß")));
  const at = boot({ storage: { "nrv-dash-lang": "de_AT" } });
  await at.sandbox.nrvI18n.ready();
  assert.equal(at.get("t")(key), de[key], "Austria keeps ß");
}
{
  // Switching language in the picker loads the language before rendering it.
  const app = boot({ storage: { "nrv-dash-lang": "ja" } });
  app.sandbox.render();
  const select = app.sandbox.document.querySelector("#lang");
  app.sandbox.bind();
  assert.equal(typeof select.onchange, "function");
  select.onchange({ target: { value: "fr-CA" } });
  assert.equal(app.get("lang"), "fr_CA", "the picked locale, normalised");
  assert.equal(app.store["nrv-dash-lang"], "fr_CA", "and remembered");
  await settle();
  assert.deepEqual([...app.fetched].sort(), ["fr", "fr_CA"]);
  assert.equal(app.html.lang, "fr-CA");
  assert.equal(app.sandbox.document.querySelector("#main").innerHTML.includes(localeFile("fr").title), true, "rendered in French once loaded");
}

/* ---------------- 5. right to left ---------------- */

{
  for (const [code, , tag] of DASH_LOCALES) {
    const app = boot({ storage: { "nrv-dash-lang": code }, files: {} });
    app.sandbox.render();
    assert.equal(app.html.dir, DASH_RTL.includes(code) ? "rtl" : "ltr", `${code}: dir`);
    assert.equal(app.html.lang, tag, `${code}: <html lang>`);
  }
  const app = boot({ storage: { "nrv-dash-lang": "ar" }, files: {} });
  app.sandbox.render();
  assert.equal(app.html.dir, "rtl");
  app.setLang("en"); app.sandbox.render();
  assert.equal(app.html.dir, "ltr", "and back");
  assert.ok(app.sandbox.nrvI18n.rtl("he_IL") && !app.sandbox.nrvI18n.rtl("ja"));
  // The stylesheet mirrors what was written for one side.
  for (const rule of ["[dir=rtl] .side{border-right:0;border-left:1px solid var(--line)}", "[dir=rtl] .nav,[dir=rtl] th"]) assert.ok(HTML.includes(rule), `CSS: ${rule}`);
}

/* ---------------- 6. the files ---------------- */

{
  const { errors, report } = validate();
  assert.deepEqual(errors, [], "validate-dashboard-i18n.mjs passes");
  for (const lang of ["zh", "tw", "ko", "es", "fr", "de"]) assert.equal(report.files[lang].missing, 0, `${lang}.json is complete`);
  assert.equal(report.pending.length + report.derived.length + Object.keys(report.files).length + 2, 60);
  const source = sourceKeys();
  assert.ok(Object.keys(source).length > 700, "every key in _source.json");
  for (const [k, v] of Object.entries(source)) assert.ok(typeof v.en === "string" && typeof v.ja === "string", `_source ${k}`);
  assert.ok(!existsSync(new URL("../public/dashboard-i18n/ja.json", import.meta.url)) && !existsSync(new URL("../public/dashboard-i18n/en.json", import.meta.url)), "ja and en stay inline");
  // Served by the worker's assets under the existing nurevo.jp/dashboard* route
  // (an /i18n/* path would fall through to the Pages site).
  const wrangler = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");
  assert.ok(wrangler.includes('"pattern": "nurevo.jp/dashboard*"'), "the /dashboard* route covers /dashboard-i18n/");
  assert.match(readFileSync(new URL("../public/_headers", import.meta.url), "utf8"), /\/dashboard-i18n\/\*\n  Content-Type: application\/json/);
  // The page shrank: only ja and en are inline.
  assert.ok(HTML.length < 160_000, `dashboard.html is ${HTML.length} bytes`);
  assert.ok(!/osKicker:"Außerhalb/.test(HTML) && !/rsNav:'AEO-Regeln'/.test(HTML), "no German left inline");
}

console.log("dashboard locale tests passed (60-locale table and picker, browser-language mapping page = worker, lazy loading with parent-chain and English fallback, module tables, de_CH, RTL, file validation)");
