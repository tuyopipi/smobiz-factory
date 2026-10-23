/**
 * The WordPress connection item at the top of the site page, from the real
 * dashboard code.
 *
 * An unpaired site has nothing to diagnose, so the page has to say so - and say
 * how to connect - before it shows a score or a checklist. Once the site is
 * bound the instructions are noise and must go, leaving the confirmation and
 * what it is bound to. These assert the position, both states, and that the
 * issue button is wired to the existing pairing-code action.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const HTML = readFileSync(new URL("../public/dashboard.html", import.meta.url), "utf8");
const SOURCE = [...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1])
  .find((block) => block.includes("function render"));
assert.ok(SOURCE, "the dashboard inline script was found");

function fakeNode() {
  const node = {
    className: "", dataset: {}, innerHTML: "", value: "", textContent: "", style: {},
    disabled: false, handlers: {}, children: new Map(),
    classList: { toggle() {}, add() {}, remove() {} },
    appendChild() {}, append() {}, remove() {},
    addEventListener(type, handler) { node.handlers[type] = handler; },
    removeEventListener() {}, closest: () => null,
    querySelector(selector) {
      if (!node.children.has(selector)) node.children.set(selector, fakeNode());
      return node.children.get(selector);
    },
    querySelectorAll: () => [],
  };
  return node;
}

function makeSandbox(lang = null) {
  const roots = new Map();
  const sandbox = {
    document: {
      createElement: () => fakeNode(),
      querySelector(selector) {
        if (!roots.has(selector)) roots.set(selector, fakeNode());
        return roots.get(selector);
      },
      querySelectorAll: () => [],
      addEventListener() {},
      head: { appendChild() {} },
      body: fakeNode(),
      documentElement: { lang: "ja" },
      cookie: "",
    },
    localStorage: { getItem: () => lang, setItem() {} },
    location: { reload() {}, search: "", hash: "", href: "https://nurevo.jp/dashboard", origin: "https://nurevo.jp" },
    navigator: {},
    Headers: class { constructor() {} has() { return false; } set() {} },
    URL, URLSearchParams,
    FormData: class { get() { return ""; } },
    addEventListener() {},
    MutationObserver: class { observe() {} },
    setTimeout() {}, clearTimeout() {},
    fetch: async () => { throw new Error("no network expected"); },
    Number, Math, String, Date, JSON, Array, Object, Error, console,
    encodeURIComponent, decodeURIComponent,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`${SOURCE}\n;globalThis.__detail = detail;`, sandbox);
  return sandbox;
}

const detailHtml = (site, lang) => makeSandbox(lang).__detail(site);

const SITE = (over = {}) => ({
  id: "site1", url: "example.com", key: "nrv_k", install_type: "wp", status: "active",
  checklist: [], fill: { filled: 6, total: 6, pct: 100 }, plan: "free", crawler_allowed: 1,
  schema_types: 3, _settings: {}, _sources: {}, _serve: 1, _crawl: 1,
  bound: false, bound_at: null, domain_key: null, bound_via: null, manual_plan: null, ...over,
});
const BOUND = { bound: true, bound_at: 1_760_000_000_000, domain_key: "example.com", bound_via: "pairing" };

/** The connection card alone, so assertions cannot be satisfied by other panels. */
function card(html) {
  const start = html.indexOf('id="wpconn"');
  if (start === -1) return "";
  return html.slice(start, html.indexOf('<div class="detail">'));
}

/* ---------------- unconnected: the way to connect comes first ---------------- */

{
  const html = detailHtml(SITE());
  const at = html.indexOf('id="wpconn"');
  assert.ok(at !== -1, "the connection item is rendered");
  assert.ok(at < html.indexOf('<div class="detail">'), "above the profile, score and plan panels");
  assert.ok(at < html.indexOf("AEOスコア"), "and above the score");

  const c = card(html);
  assert.ok(c.includes("⚠️") && c.includes("WordPressと未接続"), "it warns that the site is not connected");
  assert.ok(c.includes("ここでインストールして導入し、ペアリングしてください。"), "with the lead sentence");
  const steps = [
    "WordPress管理画面 → プラグイン → 新規追加 →「Nurevo AEO」で検索 → インストール → 有効化",
    "発行されたペアリングコードをプラグイン設定画面に貼り付け",
    "接続完了",
  ];
  let last = -1;
  for (const step of steps) {
    const i = c.indexOf(`<li>${step}</li>`);
    assert.ok(i > last, `step in order: ${step}`);
    last = i;
  }
  assert.ok(c.includes('href="https://wordpress.org/plugins/nurevo-webmcp/"'), "links to the plugin in the directory");
  assert.ok(c.includes('id="issuecodetop"'), "and offers to issue this site's pairing code");
  assert.equal(c.includes("WordPressと接続済み"), false, "it does not also claim to be connected");
}

/* ---------------- connected: the instructions go, the confirmation stays ---------------- */

{
  const html = detailHtml(SITE(BOUND));
  const c = card(html);
  assert.ok(c.includes("✅") && c.includes("WordPressと接続済み"), "it confirms the connection");
  assert.ok(c.includes("<code>example.com</code>"), "shows the connected domain");
  assert.ok(c.includes("接続方法") && c.includes("ペアリングコード"), "and how it was connected");
  assert.equal(c.includes("WordPressと未接続"), false, "the warning is gone");
  assert.equal(c.includes("ペアリングしてください"), false, "as are the instructions");
  assert.equal(c.includes("issuecodetop"), false, "and the issue button");
  assert.ok(html.indexOf('id="wpconn"') < html.indexOf('<div class="detail">'), "still at the top");

  const legacy = card(detailHtml(SITE({ ...BOUND, bound_via: "license" })));
  assert.ok(legacy.includes("ライセンスキー（旧方式）"), "a licence-bound site names its own method");
}

/* ---------------- the state follows bound, as the server computes it ---------------- */

{
  // bound is domain_key AND bound_at on the server; a stray domain alone is not a connection.
  const c = card(detailHtml(SITE({ domain_key: "example.com" })));
  assert.ok(c.includes("WordPressと未接続"), "a domain without a binding is still unconnected");
}

/* ---------------- sites with no WordPress are not told to connect one ---------------- */

for (const install_type of ["hosted", "static"]) {
  const html = detailHtml(SITE({ install_type }));
  assert.equal(html.includes('id="wpconn"'), false, `${install_type}: no warning`);
}

/* ---------------- the button reuses the existing issue action ---------------- */

{
  assert.ok(
    /const issueCode=async[\s\S]*?\/pairing-code'[\s\S]*?\$\('#issuecode'\)\?\.addEventListener\('click',issueCode\);\$\('#issuecodetop'\)\?\.addEventListener\('click',issueCode\)/.test(SOURCE),
    "both issue buttons share one handler that posts to /pairing-code",
  );
}

/* ---------------- English stays English, Japanese stays Japanese ---------------- */

{
  const en = card(detailHtml(SITE(), "en"));
  assert.ok(en.includes("Not connected to WordPress"), "the English dictionary has the item");
  assert.equal(/[぀-ヿ一-龯]/.test(en), false, "with no Japanese left in it");
  const ja = card(detailHtml(SITE(), "ja"));
  assert.equal(ja.includes("Not connected"), false, "and Japanese does not fall back to English");
}

console.log("wp-connection: ok");
