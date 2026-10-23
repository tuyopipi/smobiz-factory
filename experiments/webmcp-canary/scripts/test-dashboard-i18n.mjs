/**
 * Every dashboard word in all eight languages (including the super-admin
 * ruleset screen, dashboard-rulesets.js), and the sign-in error page.
 *
 * zh/tw/ko/es/fr/de used to fall back to English for anything their own
 * blocks did not list (the partner view, the plan panel, the site page), and
 * dashboard-aeo-metrics.js, dashboard-sov.js and dashboard-members.js wrote
 * Japanese straight into the page whatever the language. This fails when:
 *  - any key of the dashboard dictionary is missing in any language (an
 *    English fallback counts as missing for zh/tw/ko/es/fr/de);
 *  - a translation drops or invents a {placeholder};
 *  - one of those modules uses a key the dictionary does not have, or still
 *    carries a Japanese literal;
 *  - a module renders Japanese for a non-Japanese reader;
 *  - auth-error.html lacks a reason, the generic error or the button in any
 *    language, or picks its language in the wrong order.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { loadDictionary, LANGS } from "./dashboard-dictionary.mjs";

const read = (path) => readFileSync(new URL(`../public/${path}`, import.meta.url), "utf8");
// U+30FB (\u30fb) is left out: the existing English plan heading uses it as a separator.
const KANA = /[\u3040-\u30fa\u30fc-\u30ff]/;
const JAPANESE = /[\u3040-\u30fa\u30fc-\u30ff\u3400-\u9fff]/;
const placeholders = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

/* ---------------- 1. the dictionary is complete ---------------- */

const { I, I2, I3, I4 } = loadDictionary();
assert.deepEqual(Object.keys(I).sort(), [...LANGS].sort(), "the dictionary has exactly the eight languages");
// zh..de are built on top of English, so a key they do not list themselves
// would silently show English. Look only at their own blocks.
const own = (lang) => new Set(["ja", "en"].includes(lang) ? Object.keys(I[lang])
  : [...Object.keys(I2[lang] || {}), ...Object.keys(I3[lang] || {}), ...Object.keys(I4[lang] || {})]);
const keys = Object.keys(I.ja);
for (const lang of LANGS) {
  const mine = own(lang);
  const missing = keys.filter((k) => !mine.has(k));
  assert.deepEqual(missing, [], `${lang}: every dashboard key has its own translation`);
  for (const key of keys) {
    const value = I[lang][key];
    assert.ok(typeof value === "string" && value.trim().length > 0, `${lang}.${key} is a non-empty string`);
    // The price slot is the one intended difference: ja shows {yen}, every
    // other language the US price {usd}. The page passes both.
    const slot = (v) => placeholders(v).replace(/\b(yen|usd)\b/g, "price");
    assert.equal(slot(value), slot(I.ja[key]), `${lang}.${key} keeps the placeholders of ja`);
    if (lang !== "ja" && !["zh", "tw"].includes(lang)) assert.ok(!JAPANESE.test(value), `${lang}.${key} has no Japanese (${value})`);
    if (["zh", "tw"].includes(lang)) assert.ok(!KANA.test(value), `${lang}.${key} has no kana (${value})`);
  }
}
for (const key of Object.keys(I.en)) assert.ok(key in I.ja, `en.${key} also exists in ja`);
// The I4 block itself, which this change added, lists every key in every language.
const i4Keys = new Set(LANGS.flatMap((l) => Object.keys(I4[l])));
for (const lang of LANGS) for (const key of i4Keys) assert.ok(own(lang).has(key), `${lang}.${key} (I4)`);
// Existing ja/en wording is untouched.
assert.equal(I.ja.ptCode, "紹介コード");
// Plan prices: yen in Japanese, US dollars everywhere else.
assert.equal(I.ja.plStdHead, "スタンダードにする（¥3,000/月）");
assert.equal(I.ja.plProHead, "{buy}（¥{yen}/月）");
assert.equal(I.en.plStdHead, "Choose Standard ($20/month)");
assert.equal(I.en.plProHead, "{buy} (${usd}/month)");
for (const lang of LANGS.filter((l) => l !== "ja")) {
  assert.ok(/20/.test(I[lang].plStdHead) && /\$/.test(I[lang].plStdHead) && !/¥|3,000|3 000/.test(I[lang].plStdHead), `${lang}.plStdHead shows $20`);
  assert.ok(I[lang].plProHead.includes("{usd}") && /\$/.test(I[lang].plProHead) && !/¥|\{yen\}/.test(I[lang].plProHead), `${lang}.plProHead shows the USD amount`);
}
assert.equal(I.ja.plLinkCopied, "リンクをコピーしました");
// Commission is 40% of what Nurevo received after Stripe fees; the monthly
// figure is an estimate before fees, and says so in every language.
assert.equal(I.en.ptRate, "For each payment by a referred customer you earn 40% of what Nurevo received after Stripe fees (rounded down to the yen). Refunds reverse it in proportion. The monthly estimate uses Standard ¥1,200 and Pro ¥5,920 and is before Stripe fees.");
for (const lang of LANGS) assert.ok(/5,920|5 920/.test(I[lang].ptRate) && /40/.test(I[lang].ptRate), `${lang}.ptRate states 40% and the Pro estimate`);
assert.equal(I.ja.planGrantOrg && I.ja.planGrantOrg !== "planGrantOrg", true, "planGrantOrg is a word, not its key");

/* ---------------- 2. the modules use the dictionary ---------------- */

const MODULES = ["dashboard-aeo-metrics.js", "dashboard-sov.js", "dashboard-members.js", "dashboard-rulesets.js"];
for (const file of MODULES) {
  const src = read(file);
  // Comments may be Japanese-free prose; literals are what reach the page.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert.ok(!JAPANESE.test(code), `${file}: no Japanese literal left (${(code.match(/.{0,30}[\u3040-\u30fa\u3400-\u9fff].{0,30}/) || [""])[0]})`);
  const used = [...code.matchAll(/\btr\(\s*["']([\w]+)["']/g)].map((m) => m[1]);
  assert.ok(used.length > 5, `${file}: reads its words through tr()`);
  for (const key of used) for (const lang of LANGS) assert.ok(own(lang).has(key), `${file}: ${lang}.${key} exists`);
}
{
  // The partner view and the plan panel in dashboard.html.
  const html = read("dashboard.html");
  const body = html.slice(html.indexOf("function standardPaymentPanel"), html.indexOf("const standardPaymentLinks"))
    + html.slice(html.indexOf("function partnerView"), html.indexOf("async function load()"));
  assert.ok(!/label\(/.test(body), "no ja/en-only label() left in the partner view or plan panel");
  assert.ok(!JAPANESE.test(body), "no Japanese literal left in the partner view or plan panel");
  for (const key of [...body.matchAll(/\bt[f]?\('(\w+)'/g)].map((m) => m[1])) for (const lang of LANGS) assert.ok(own(lang).has(key), `plan/partner: ${lang}.${key} exists`);
}

/* ---------------- 3. what the modules draw, per language ---------------- */

function element() {
  return { className: "", dataset: {}, innerHTML: "", style: {}, textContent: "", appendChild() {}, querySelector: () => null, isConnected: false, replaceWith() {} };
}
function loadModule(file, expose, lang) {
  const t = (k) => (I[lang] || I.ja)[k] || I.ja[k] || k;
  const sandbox = {
    t,
    document: { createElement: element, querySelector: () => null, addEventListener() {}, head: { appendChild() {} }, documentElement: { lang } },
    MutationObserver: class { observe() {} }, setTimeout() {},
    fetch: async () => { throw new Error("render only"); },
    Number, Math, String, Date, JSON, Array, Object, console,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read(file).replace(/\}\)\(\);\s*$/, `  window.__x = {${expose}};\n})();`), sandbox);
  return sandbox.window.__x;
}
const SCORE = { score: 60, ruleset_version: 5, score_model_version: "u1-v4", delivered_ruleset_version: 5, scanned_at: "2026-10-20" };
const METRICS = {
  site_id: "s1", scores: [SCORE, { ...SCORE, score: 70 }], crawler_measurement: true, crawler_hits: [{ date: "2026-10-20", crawler_id: "GPTBot", hits: 3 }],
  ai_referrals: [{ date: "2026-10-20", hits: 2 }, { date: "2026-10-21", hits: 4 }], ruleset: { auto_updates: true, status: "unverified", latest_version: 5, version: 4 },
  optimization: { action_required: true, missing_fields: [{ entityType: "LocalBusiness", field: "geo" }] }, checks: [], checked_at: "2026-10-21T00:00:00Z",
};
const ENGINE = (over = {}) => ({ engine: "perplexity", answers: 5, failures: 2, appearances: 2, live_search: true, appearance_rate: 0.4, ...over });
const LATEST = { ran_at: "2026-10-05T00:00:00.000Z", questions_asked: 5, answers_received: 5, queries_used: 10,
  by_engine: [ENGINE(), ENGINE({ engine: "openai", live_search: false, appearance_rate: null, answers: 2 })],
  competitors: [{ host: "rival.example", appearances: 3 }], engines: [], parser_control: { answers: 4, detected: 3 } };
for (const lang of LANGS) {
  const am = loadModule("dashboard-aeo-metrics.js", "panel, rulesetStatus, scoreSummary", lang);
  const sov = loadModule("dashboard-sov.js", "panel", lang);
  const pages = [
    am.panel(METRICS).innerHTML,
    am.panel({ ...METRICS, scores: [], crawler_measurement: false, ai_referrals: [], ruleset: { auto_updates: false, latest_version: 5 } }).innerHTML,
    am.rulesetStatus({ ruleset: { auto_updates: true, status: "latest", version: 5 } }),
    sov.panel({ kind: "measured", data: { latest: LATEST } }).innerHTML,
    sov.panel({ kind: "measured", data: { latest: { ...LATEST, by_engine: [], engines: [{ id: "perplexity", live_search: true }, { id: "openai", live_search: false }] } } }).innerHTML,
    sov.panel({ kind: "measured", data: { latest: null } }).innerHTML,
    sov.panel({ kind: "locked", data: { plan: "free", upgrade: { purchasable: false, details_url: "https://nurevo.jp/#pro-detail" } } }).innerHTML,
  ];
  for (const html of pages) {
    assert.ok(!/\b(?:am|sv|mb|pa|pt|pl)[A-Z]\w*\b/.test(html.replace(/class="[^"]*"/g, "")), `${lang}: no raw dictionary key in the markup (${html.slice(0, 120)})`);
    assert.ok(!/\{\w+\}/.test(html), `${lang}: every placeholder filled`);
    if (lang !== "ja") assert.ok(!(["zh", "tw"].includes(lang) ? KANA : JAPANESE).test(html), `${lang}: no Japanese in the module markup (${(html.match(/.{0,40}[\u3040-\u30fa\u3400-\u9fff].{0,20}/) || [""])[0]})`);
  }
  assert.ok(pages[0].includes(I[lang].amHeading) && pages[0].includes(I[lang].amChecklist), `${lang}: AEO panel headings`);
  assert.ok(pages[3].includes(I[lang].svLiveTag) && pages[3].includes(I[lang].svNotLive), `${lang}: SoV keeps the live / not-live labels`);
  assert.ok(pages[6].includes(I[lang].svLockedHead) && pages[6].includes(I[lang].svLockedMsg), `${lang}: SoV locked state`);
}

/* ---------------- 3b. the super-admin ruleset screen, per language ---------------- */

{
  // Drive the real script: a super admin, two rulesets, every button pressed.
  const RS_KEYS = [...read("dashboard-rulesets.js").matchAll(/\btr\(\s*"(\w+)"/g)].map((m) => m[1]);
  assert.ok(RS_KEYS.length >= 20 && RS_KEYS.every((k) => k.startsWith("rs")), "dashboard-rulesets.js reads its rs* words through tr()");
  // Short labels (Status, Version, Notes) can be the same word in English;
  // the sentences cannot.
  for (const lang of LANGS.filter((l) => !["ja", "en"].includes(l))) {
    for (const key of ["rsTitle", "rsNotice", "rsLoadActive", "rsHistory", "rsNone", "rsLoaded", "rsConfirm", "rsNoActive", "rsLoadedActive", "rsCreated"]) {
      assert.notEqual(I[lang][key], I.en[key], `${lang}.${key} is not the English string`);
    }
  }
  const tick = () => new Promise((resolve) => setImmediate(resolve));
  async function drive(lang) {
    const t = (k) => (I[lang] || I.ja)[k] || I.ja[k] || k;
    const said = [];
    const node = (extra = {}) => ({ innerHTML: "", textContent: "", value: "", dataset: {}, disabled: false, onclick: null, classList: { add() {}, remove() {} }, querySelectorAll: () => [], ...extra });
    const fields = {};
    const field = (sel) => (fields[sel] ||= node());
    const main = node({
      querySelector: (sel) => field(sel),
    });
    const nav = [];
    const side = { querySelector: () => null, insertBefore: (el) => nav.push(el) };
    const RULESETS = [{ version: 7, active: 1, created_at: "2026-10-01", notes: "n", activated_at: "2026-10-02" }, { version: 8, active: 0, created_at: "2026-10-20", notes: null }];
    const DEF = JSON.stringify({ schema: {} });
    const fetch = async (path, init = {}) => {
      const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
      if (path === "/api/me") return json({ is_super_admin: true });
      if (path === "/api/admin/aeo/rulesets" && init.method === "POST") return json({ ruleset: { version: 9 } }, 201);
      if (path === "/api/admin/aeo/rulesets") return json({ rulesets: RULESETS });
      if (/\/activate$/.test(path)) return json({ ok: true });
      const v = Number(path.split("/").pop());
      return json({ ruleset: { version: v, notes: "x", definition_json: DEF } });
    };
    const sandbox = {
      t, fetch, JSON, Promise, Number, String, Object, encodeURIComponent,
      document: { querySelector: (sel) => (sel === "#main" ? main : sel === ".side" ? side : null), createElement: () => node(), querySelectorAll: () => [] },
      confirm: (text) => { said.push(text); return false; },
      alert: (text) => said.push(text),
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(read("dashboard-rulesets.js"), sandbox);
    await tick(); await tick();
    assert.equal(nav.length, 1, `${lang}: the nav entry is added for a super admin`);
    const html = [nav[0].innerHTML];
    // Render, then capture the row buttons as the page would expose them.
    const rows = field("[data-ruleset-rows]");
    const buttons = { detail: node({ dataset: { rulesetDetail: "7" } }), activate: node({ dataset: { rulesetActivate: "8" } }) };
    rows.querySelectorAll = (sel) => (sel === "[data-ruleset-detail]" ? [buttons.detail] : sel === "[data-ruleset-activate]" ? [buttons.activate] : []);
    nav[0].onclick();
    html.push(main.innerHTML);
    await tick(); await tick();
    html.push(rows.innerHTML);
    const result = field("[data-ruleset-result]");
    await buttons.detail.onclick(); said.push(result.textContent);
    await buttons.activate.onclick();
    await field("[data-ruleset-copy-active]").onclick(); said.push(result.textContent);
    field("[data-ruleset-definition]").value = DEF;
    await field("[data-ruleset-create]").onclick();
    await tick();
    return { html, said };
  }
  for (const lang of LANGS) {
    const { html, said } = await drive(lang);
    const all = [...html, ...said].join("\n");
    for (const key of ["rsNav", "rsTitle", "rsRefresh", "rsNotice", "rsLoadActive", "rsCreate", "rsHistory", "rsState", "rsCreatedAt", "rsActivatedAt", "rsLoading", "rsActive", "rsCandidate", "rsDetail", "rsActivate"]) {
      assert.ok(all.includes(I[lang][key].replace(/&/g, "&amp;")), `${lang}: ruleset screen shows ${key} (${I[lang][key]})`);
    }
    assert.deepEqual(said, [
      I[lang].rsLoaded.replace("{version}", "7"), I[lang].rsConfirm.replace("{version}", "8"),
      I[lang].rsLoadedActive.replace("{version}", "7"), I[lang].rsCreated.replace("{version}", "9"),
    ], `${lang}: every message, with its version filled in`);
    assert.ok(!/\brs[A-Z]\w*\b/.test(all.replace(/data-k="rs\w+"/g, "")), `${lang}: no raw rs* key on the screen`);
    assert.ok(!/\{\w+\}/.test(all), `${lang}: every placeholder filled`);
    if (lang !== "ja") assert.ok(!(["zh", "tw"].includes(lang) ? KANA : JAPANESE).test(all), `${lang}: no Japanese on the ruleset screen (${(all.match(/.{0,30}[\u3040-\u30fa\u3400-\u9fff].{0,20}/) || [""])[0]})`);
    if (lang === "ja") {
      // The Japanese screen reads as it did before.
      for (const s of ["AEOルール管理", "新版はcandidateとして保存されます。activate後、約5分以内に生きた接続へ反映されます。", "現在版の定義を読み込む", "candidateを作成", "バージョン履歴", "最終activate", "v7 を編集欄へ読み込みました。保存時は新版になります。", "v8 をactiveに切り替えますか？", "v9 をcandidateとして作成しました。"]) {
        assert.ok(all.includes(s), `ja keeps "${s}"`);
      }
    }
  }
  const empty = (lang) => I[lang].rsNone;
  for (const lang of LANGS) assert.ok(empty(lang) && I[lang].rsNoActive, `${lang}: empty-list and no-active messages`);
}

/* ---------------- 4. auth-error.html ---------------- */

const AUTH = read("auth-error.html");
const AUTH_SCRIPT = AUTH.match(/<script>([\s\S]*?)<\/script>/)[1];
const REASONS = ["expired", "used", "pending", "invalid", "generic"];
function authPage({ search = "", storage, languages, throwStorage = false } = {}) {
  const nodes = {};
  const node = () => ({ textContent: "", href: "", value: "", attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } });
  const store = { ...(storage || {}) };
  const sandbox = {
    location: { search }, URLSearchParams,
    navigator: languages ? { languages, language: languages[0] } : { language: "" },
    document: { documentElement: { lang: "" }, querySelector: (s) => (nodes[s] ||= node()) },
    localStorage: throwStorage ? { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } }
      : { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    encodeURIComponent, Array, String,
  };
  vm.createContext(sandbox);
  vm.runInContext(`${AUTH_SCRIPT}\n;globalThis.__T = T;`, sandbox);
  return { title: nodes["#title"].textContent, copy: nodes["#copy"].textContent, button: nodes["#login"].textContent, href: nodes["#login"].href, lang: sandbox.document.documentElement.lang, select: nodes["#lang"], T: sandbox.__T, store };
}
{
  const { T } = authPage();
  assert.deepEqual(Object.keys(T).sort(), [...LANGS].sort(), "auth-error.html speaks the eight languages");
  for (const lang of LANGS) {
    for (const reason of REASONS) {
      const pair = T[lang][reason];
      assert.ok(Array.isArray(pair) && pair.length === 2 && pair.every((s) => typeof s === "string" && s.length > 1), `auth-error ${lang}.${reason}`);
      if (lang !== "ja") assert.ok(!(["zh", "tw"].includes(lang) ? KANA : JAPANESE).test(pair.join("")), `auth-error ${lang}.${reason} is not Japanese`);
      if (!["ja", "en"].includes(lang)) assert.notEqual(pair[0], T.en[reason][0], `auth-error ${lang}.${reason} is translated`);
    }
    assert.ok(T[lang].button && T[lang].langLabel, `auth-error ${lang}: button and language label`);
    for (const reason of ["expired", "used", "pending", "invalid"]) {
      const page = authPage({ search: `?lang=${lang}&reason=${reason}` });
      assert.equal(page.title, T[lang][reason][0], `auth-error ${lang}: ${reason} title`);
      assert.equal(page.copy, T[lang][reason][1], `auth-error ${lang}: ${reason} text`);
      assert.equal(page.button, T[lang].button);
      assert.equal(page.href, `/dashboard?lang=${lang}`);
    }
    assert.equal(authPage({ search: `?lang=${lang}&reason=weird` }).title, T[lang].generic[0], `auth-error ${lang}: an unknown reason is the generic error`);
    assert.equal(authPage({ search: `?lang=${lang}` }).title, T[lang].expired[0], `auth-error ${lang}: no reason keeps the expired text`);
  }
  // Existing ja/en wording is kept.
  assert.equal(T.ja.used[0], "このリンクは使用済みです");
  assert.equal(T.en.expired[1], "This sign-in link has expired. Please request a new one.");
  assert.equal(T.ja.button, "再ログイン");
  // Language order: ?lang, the dashboard's saved choice, the browser, Japanese.
  assert.equal(authPage({ search: "?lang=ko", storage: { "nrv-dash-lang": "de" }, languages: ["fr"] }).lang, "ko", "?lang first");
  assert.equal(authPage({ storage: { "nrv-dash-lang": "de" }, languages: ["fr"] }).lang, "de", "then the saved dashboard choice");
  assert.equal(authPage({ languages: ["pt-BR", "fr-CA"] }).lang, "fr", "then the browser's languages");
  assert.equal(authPage({ languages: ["zh-TW"] }).lang, "zh-TW", "zh-TW is tw");
  assert.equal(authPage({ search: "?lang=zh-tw" }).select.value, "tw");
  assert.equal(authPage({ search: "?lang=xx", languages: ["es"] }).lang, "es", "an unsupported ?lang is ignored");
  assert.equal(authPage().lang, "ja", "and Japanese last");
  assert.equal(authPage({ throwStorage: true, languages: ["de"] }).lang, "de", "blocked storage does not break the page");
  assert.equal(authPage({ search: "?reason=pending", languages: ["es"] }).title, T.es.pending[0]);
}

console.log("dashboard i18n tests passed (complete 8-language dictionary, module markup per language, auth-error reasons and language order)");
