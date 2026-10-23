/**
 * Onboarding, language and checkout return, from the real dashboard code.
 *
 * The dashboard's inline script and dashboard-onboarding.js run together in one
 * VM context, the way the browser runs them, under a small DOM shim. These
 * cover what used to go wrong:
 *  - the language was only ever ja or an English alias, whatever the visitor
 *    asked for or registered in;
 *  - every new site was posted as WordPress;
 *  - the pairing wait spun forever after its 5 minutes;
 *  - ?checkout= and ?billing= from Stripe were never read;
 *  - API codes such as rate_limited were shown raw.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const HTML = readFileSync(new URL("../public/dashboard.html", import.meta.url), "utf8");
const SOURCE = [...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((b) => b.includes("function render"));
const ONBOARDING = readFileSync(new URL("../public/dashboard-onboarding.js", import.meta.url), "utf8");
const LANGS = ["ja", "en", "zh", "tw", "ko", "es", "fr", "de"];

function fakeNode(tag = "div") {
  const node = {
    tagName: tag.toUpperCase(), className: "", dataset: {}, value: "", textContent: "", style: {}, attrs: {},
    disabled: false, handlers: {}, children: new Map(), _html: "", hidden: false,
    classList: { toggle() {}, add() {}, remove() {} },
    get innerHTML() { return node._html; },
    set innerHTML(v) { node._html = String(v); node.children = new Map(); },
    setAttribute(k, v) { node.attrs[k] = String(v); }, getAttribute(k) { return node.attrs[k] ?? null; }, removeAttribute(k) { delete node.attrs[k]; },
    appendChild(child) { node.appended = child; return child; }, append(child) { node.appended = child; }, remove() { node.removed = true; },
    addEventListener(type, handler) { node.handlers[type] = handler; },
    removeEventListener() {}, closest: () => null, focus() {},
    querySelector(selector) {
      if (!node.children.has(selector)) node.children.set(selector, fakeNode());
      return node.children.get(selector);
    },
    // Enough of a selector engine for the wizard: [data-x] finds the elements
    // carrying that attribute in the markup most recently assigned.
    querySelectorAll(selector) {
      const m = /^\[([\w-]+)\]$/.exec(selector);
      if (!m) return [];
      return [...node._html.matchAll(new RegExp(`<\\w+[^>]*\\b${m[1]}(?:="([^"]*)")?[^>]*>`, "g"))].map((hit) => {
        const child = fakeNode("button"); child.attrs[m[1]] = hit[1] ?? ""; return child;
      });
    },
  };
  return node;
}

function boot({ search = "", storage = {}, languages, apiImpl } = {}) {
  const roots = new Map();
  const store = { ...storage };
  const calls = [];
  const timers = [];
  const location = { hash: "", pathname: "/dashboard", search, href: "https://nurevo.jp/dashboard" + search, origin: "https://nurevo.jp", reload() {} };
  const history = { replaceState(_s, _t, url) { const u = new URL(url, "https://nurevo.jp"); location.search = u.search; location.hash = u.hash; location.href = u.href; }, pushState() {} };
  const sandbox = {
    document: {
      createElement: (tag) => fakeNode(tag),
      querySelector(selector) { if (!roots.has(selector)) roots.set(selector, fakeNode()); return roots.get(selector); },
      querySelectorAll: () => [], addEventListener() {},
      head: { appendChild() {} }, body: fakeNode("body"), documentElement: { lang: "ja" }, cookie: "", activeElement: null,
    },
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    location, history,
    navigator: languages ? { languages } : {},
    URL, URLSearchParams, Promise,
    FormData: class { get() { return ""; } },
    addEventListener() {},
    MutationObserver: class { observe() {} },
    setTimeout(fn, ms) { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {},
    fetch: async () => ({ ok: true, json: async () => ({}) }),
    Number, Math, String, Date, JSON, Array, Object, Error, RegExp, console,
    encodeURIComponent, decodeURIComponent,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`${SOURCE}
;globalThis.__get = (n) => eval(n);
;globalThis.__set = (n, v) => { eval(n + ' = v'); };`, sandbox);
  sandbox.api = async (path, init = {}) => {
    calls.push({ path, method: init.method || "GET", body: init.body ? JSON.parse(init.body) : null });
    if (apiImpl) return apiImpl(path, init, calls);
    return {};
  };
  sandbox.load = async () => {};
  vm.runInContext(ONBOARDING, sandbox);
  return { sandbox, store, calls, timers, location, roots, get: (n) => sandbox.__get(n), set: (n, v) => sandbox.__set(n, v) };
}
const flush = () => new Promise((r) => setImmediate(r));

/* ---------------- 1. language ---------------- */

{
  assert.equal(boot().get("lang"), "ja", "nothing to go on means Japanese");
  assert.equal(boot({ languages: ["fr-FR", "en"] }).get("lang"), "fr", "the browser's language is used");
  assert.equal(boot({ languages: ["zh-TW"] }).get("lang"), "tw", "zh-TW is the dashboard's tw");
  assert.equal(boot({ languages: ["zh-Hant-HK"] }).get("lang"), "tw", "Traditional Chinese by script");
  assert.equal(boot({ languages: ["zh-CN"] }).get("lang"), "zh");
  assert.equal(boot({ languages: ["pt-BR", "ko"] }).get("lang"), "ko", "the first supported browser language wins");
  assert.equal(boot({ storage: { "nrv-dash-lang": "de" }, languages: ["fr"] }).get("lang"), "de", "a saved choice beats the browser");
  const q = boot({ search: "?lang=es", storage: { "nrv-dash-lang": "de" }, languages: ["fr"] });
  assert.equal(q.get("lang"), "es", "?lang beats everything");
  assert.equal(q.store["nrv-dash-lang"], "es", "and is remembered");
  assert.equal(boot({ search: "?lang=xx", languages: ["ko"] }).get("lang"), "ko", "an unsupported ?lang is ignored");
}
{
  // The member's own language comes after the saved choice and before the browser.
  const app = boot({ languages: ["fr"] });
  const pick = app.get("pickLang");
  assert.equal(pick({ registration_locale: "ko" }), "ko", "registration_locale is honoured when the server sends it");
  assert.equal(pick({ language: "zh-tw" }), "tw", "else the saved account language");
  assert.equal(pick({ registration_locale: "es", language: "de" }), "de", "a language chosen later beats the one registered in, as in email");
  assert.equal(pick({}), "fr", "absent fields fall through to the browser");
  assert.equal(pick(null), "fr");
  const saved = boot({ storage: { "nrv-dash-lang": "en" } }).get("pickLang");
  assert.equal(saved({ registration_locale: "ko" }), "en", "a choice made in this browser is not overridden");
}
{
  // Every language has its own words for the onboarding surfaces.
  const I = boot().get("I");
  const required = ["addSite", "emptyTitle", "emptyLead", "needsAction", "copy", "copied", "hostedNote", "del", "delConfirm", "authSent", "logout",
    "obType", "obWp", "obStatic", "obHosted", "obUrlLabel", "obWaiting", "obTimeoutTitle", "obCheck1", "obCheck2", "obCheck3", "obReissue", "obKeepWaiting",
    "obHostedTitle", "obStaticTitle", "coSuccess", "coCancelled", "coUpdated", "coPluginNote",
    "err_rate_limited", "err_invalid_email", "err_already_registered", "err_pending_approval", "err_network", "err_server",
    "err_subscription_exists", "err_payment_link_requires_automatic_tax", "err_international_requires_automatic_tax", "intlNote", "err_duplicate_site", "fixPro"];
  for (const lang of LANGS) {
    for (const key of required) {
      assert.ok(typeof I[lang][key] === "string" && I[lang][key].length > 1, `${lang}.${key} exists`);
      if (!["ja", "en"].includes(lang) && !["obWp"].includes(key)) assert.notEqual(I[lang][key], I.en[key], `${lang}.${key} is translated, not English`);
    }
  }
  assert.equal(I.ja.authSent, "メールを送りました", "existing Japanese wording is kept");
  assert.equal(I.ja.obWaiting, "接続待ち…");
  assert.equal(I.en.empty, "No sites yet.");
  assert.ok(!/Pro feature/.test(I.en.fixPro), "no claim that knowing what to fix is Pro-only");
  for (const lang of LANGS) assert.ok(I[lang].err_international_requires_automatic_tax.includes("info@nurevo.jp"), `${lang}: international purchases point to support`);
}
{
  for (const lang of LANGS) {
    const app = boot({ storage: { "nrv-dash-lang": lang } });
    const empty = app.sandbox.emptyStart();
    assert.ok(empty.includes(app.get("I")[lang].emptyTitle), `${lang}: translated empty state`);
    assert.ok(empty.includes("data-onboard"), `${lang}: wired to the wizard`);
    if (lang !== "ja") assert.ok(!/[぀-ヿ]/.test(empty), `${lang}: no Japanese kana left in the empty state`);
  }
}

/* ---------------- 6b. partner view and plan panel in every language ---------------- */

{
  // These were ja/en only: label(ja, en) picked English for zh/tw/ko/es/fr/de.
  for (const lang of LANGS) {
    const app = boot({ storage: { "nrv-dash-lang": lang } });
    const I = app.get("I")[lang];
    app.set("partnerData", { referral_code: null, payout: {}, referrals: [] });
    const partner = app.sandbox.partnerView();
    for (const key of ["ptCode", "ptNotIssued", "ptIssue", "ptRegenNote", "ptMonthly", "ptCumulative", "ptPaid", "ptRate", "ptReferred", "ptAccount", "ptNone", "ptUnavailable"]) {
      assert.ok(partner.includes(I[key]), `${lang}: partner view shows ${key}`);
    }
    const plan = app.sandbox.standardPaymentPanel({ id: "s1", plan: "free" });
    for (const key of ["plStdHead", "plSelf", "plOpen", "plClient", "plCopyLink", "intlNote"]) assert.ok(plan.includes(I[key]), `${lang}: plan panel shows ${key}`);
    app.set("PRO_CHECKOUT", true);
    const pro = app.sandbox.proOffer();
    // Yen in Japanese, the US price everywhere else.
    assert.ok(pro.includes(I.planProBuy) && !/\{(buy|yen|usd)\}/.test(pro), `${lang}: Pro heading filled in`);
    if (lang === "ja") assert.ok(pro.includes("¥14,800"), "ja: Pro heading in yen");
    else assert.ok(/\$\s?99|99\s?(\$|US\$)/.test(pro) && !pro.includes("14,800") && !pro.includes("¥"), `${lang}: Pro heading in US dollars`);
    const active = app.sandbox.standardPaymentPanel({ id: "s1", plan: "standard" });
    assert.ok(active.includes(I.plActive), `${lang}: active plan pill`);
    if (lang !== "ja") {
      for (const html of [partner, plan, pro, active]) assert.ok(!/[぀-ヺー-ヿ]/.test(html), `${lang}: no Japanese kana in the partner view or plan panel`);
    }
  }
}

/* ---------------- 7. errors in words ---------------- */

{
  for (const lang of LANGS) {
    const app = boot({ storage: { "nrv-dash-lang": lang } });
    const errText = app.get("errText");
    for (const code of ["rate_limited", "rate_limit_unavailable", "invalid_email", "already_registered", "pending_approval", "network", "server", "HTTP 503",
      "subscription_exists", "subscription_active", "payment_link_requires_automatic_tax", "international_requires_automatic_tax", "invalid_url", "stripe_not_configured"]) {
      const text = errText(code);
      assert.ok(text && !text.includes(code), `${lang}: ${code} becomes a sentence (${text})`);
    }
    assert.ok(errText("duplicate_site", { domain: "shop.example" }).includes("shop.example"), `${lang}: duplicate names the domain`);
    assert.ok(errText("weird_code").includes("weird_code"), `${lang}: an unknown code is still kept for support`);
  }
}

/* ---------------- 2. site address as people type it ---------------- */

{
  const n = boot().get("normalizeSiteUrl");
  assert.equal(n("example.com"), "https://example.com/");
  assert.equal(n("  shop.example.co.jp/menu "), "https://shop.example.co.jp/menu");
  assert.equal(n("http://example.com"), "http://example.com/");
  assert.equal(n("https://example.com/#top"), "https://example.com/");
  for (const bad of ["", "example", "javascript:alert(1)", "ftp://example.com", "mailto:a@b.co", "https://"]) assert.equal(n(bad), "", `${JSON.stringify(bad)} is refused`);
}

/* ---------------- 2. the wizard asks which site first ---------------- */

function wizard(apiImpl, options = {}) {
  const app = boot({ apiImpl, ...options });
  const ob = app.sandbox.__nrvOnboarding;
  ob.start();
  const box = app.sandbox.document.body.appended.querySelector(".nrv-onboard-box");
  return { app, ob, box };
}
{
  const { app, ob, box } = wizard();
  const wrapper = app.sandbox.document.body.appended;
  assert.ok(wrapper.innerHTML.includes('role="dialog"') && wrapper.innerHTML.includes('aria-modal="true"') && wrapper.innerHTML.includes('aria-labelledby="nrv-ob-title"'), "the wizard is a labelled modal dialog");
  assert.ok(box.innerHTML.includes('id="nrv-ob-title"'));
  const types = box.querySelectorAll("[data-type]").map((b) => b.getAttribute("data-type"));
  assert.deepEqual(types, ["wp", "static", "hosted"], "WordPress, other website, no website");
  for (const word of ["WordPress", "その他のサイト", "サイトがまだない"]) assert.ok(box.innerHTML.includes(word), word);
  assert.deepEqual([...ob.TYPES].map((x) => String(x[0])), ["wp", "static", "hosted"]);
}

async function submit(box, values) {
  const form = box.querySelector("form");
  for (const [sel, v] of Object.entries(values)) form.querySelector(sel).value = v;
  await form.onsubmit({ preventDefault() {} });
  await flush();
}
{
  // WordPress: example.com without a scheme is fine; a pairing code follows.
  const { app, ob, box } = wizard(async (path) => path === "/api/sites" ? { id: "s1", siteKey: "k" } : path.endsWith("/pairing-code") ? { pairing_code: "ABCD-1234" } : { sites: [] });
  ob.setup("wp");
  assert.ok(box.innerHTML.includes('type="text"') && box.innerHTML.includes('inputmode="url"'), "the address field takes a bare host");
  assert.ok(box.innerHTML.includes('<label for="nrv-ob-url">'), "and is labelled");
  await submit(box, { "#nrv-ob-url": "example.com" });
  assert.deepEqual(app.calls[0], { path: "/api/sites", method: "POST", body: { install_type: "wp", url: "https://example.com/" } });
  assert.equal(app.calls[1].path, "/api/sites/s1/pairing-code");
  assert.ok(box.innerHTML.includes("ABCD-1234"), "the code is shown");
  assert.ok(box.innerHTML.includes("接続待ち…"), "while waiting");
}
{
  // An address with no host is caught before anything is created.
  const { app, ob, box } = wizard();
  ob.setup("static");
  await submit(box, { "#nrv-ob-url": "not a site" });
  assert.equal(app.calls.length, 0, "nothing is posted");
  assert.equal(box.querySelector("#nrv-onboard-error").textContent, app.get("I").ja.err_url);
}
{
  // Other website: created as static, then the three paste-in blocks.
  let snippetAsked = false;
  const { app, ob, box } = wizard(async (path) => {
    if (path === "/api/sites") return { id: "s2", siteKey: "nrv_k2" };
    if (path === "/api/sites/s2/static-snippet?lang=ja") { snippetAsked = true; return { jsonld_html: "<script></script>", llms_txt: "# x", robots_txt_lines: "User-agent: X" }; }
    return {};
  });
  app.sandbox.__nrvStaticSnippetHtml = (snippet, site, lang) => `<section class="nrv-static" data-lang="${lang}" data-key="${site.key}">${snippet ? "blocks" : "failed"}</section>`;
  ob.setup("static");
  await submit(box, { "#nrv-ob-url": "wix-shop.example" });
  assert.deepEqual(app.calls[0].body, { install_type: "static", url: "https://wix-shop.example/" });
  assert.ok(snippetAsked, "the static snippet is fetched for the new site, in the dashboard's language");
  assert.ok(box.innerHTML.includes('class="nrv-static" data-lang="ja" data-key="nrv_k2">blocks'), "and rendered with the shared renderer");
  assert.ok(!box.innerHTML.includes("pairing"), "no WordPress pairing for a static site");
}
{
  // No website: a hosted page from the store name.
  const { app, ob, box } = wizard(async (path) => path === "/api/sites" ? { id: "s3", siteKey: "k3", hostedUrl: "/s/cafe-shiori" } : {});
  ob.setup("hosted");
  assert.ok(box.innerHTML.includes('id="nrv-ob-name"'), "it asks for the store name, not an address");
  await submit(box, { "#nrv-ob-name": "Cafe Shiori" });
  assert.deepEqual(app.calls[0].body, { install_type: "hosted", name: "Cafe Shiori" });
  assert.ok(box.innerHTML.includes("https://nurevo.jp/s/cafe-shiori"), "the hosted URL is shown to copy");
  assert.ok(box.innerHTML.includes("Googleビジネスプロフィール"), "with where to paste it");
}
{
  // An address that is already one of this account's sites: offer to go there.
  const { app, ob, box } = wizard(async () => { const e = Error("duplicate_site"); e.body = { error: "duplicate_site", site_id: "abc123", domain: "example.com" }; throw e; });
  ob.setup("wp");
  await submit(box, { "#nrv-ob-url": "example.com" });
  const error = box.querySelector("#nrv-onboard-error");
  assert.ok(error.textContent.includes("example.com"), "the duplicate is named");
  assert.equal(error.appended.textContent, app.get("I").ja.openExisting, "with a way to open it");
  error.appended.onclick();
  assert.equal(app.get("view"), "site:abc123", "which goes to that site");
}

/* ---------------- 3. the pairing wait ends in a checklist ---------------- */

{
  const { app, ob, box } = wizard(async (path) => path.endsWith("/pairing-code") ? { pairing_code: "NEW-0001" } : { sites: [{ id: "s1", bound: false }] });
  ob.connectStep("s1", "OLD-0001", "https://example.com/");
  const wrapper = app.sandbox.document.body.appended;
  await ob.poll("s1", ob.POLL_MAX, "https://example.com/");
  const wait = wrapper.querySelector(".nrv-wait");
  assert.ok(!wait.innerHTML.includes("接続待ち"), "the spinner text is gone after the time limit");
  assert.equal(wait.attrs.role, "alert");
  for (const word of ["有効化", "このサイトのAI向け情報を出力する", "example.com"]) assert.ok(wait.innerHTML.includes(word), `the checklist mentions ${word}`);
  assert.ok(wait.innerHTML.includes("data-reissue") && wait.innerHTML.includes("data-keepwait"), "with re-issue and keep-waiting buttons");
  const before = app.calls.length;
  await wait.querySelector("[data-reissue]").onclick.call({ disabled: false });
  await flush();
  assert.equal(app.calls[before].path, "/api/sites/s1/pairing-code", "re-issue asks for a new code");
  assert.ok(box.innerHTML.includes("NEW-0001"), "and shows it");
}
{
  // Within the limit the poll keeps going rather than giving up.
  const { app, ob } = wizard(async () => ({ sites: [{ id: "s1", bound: false }] }));
  ob.connectStep("s1", "C", "x.example");
  await flush();
  const scheduled = app.timers.filter((t) => t.ms === 2000).length;
  assert.ok(scheduled >= 1, "the next poll is scheduled every 2 s");
  assert.equal(ob.POLL_MAX, 150, "for 150 rounds");
}

{
  // The pairing-code help image is a screenshot of the Japanese plugin screen.
  // Only a Japanese reader sees it; every other language is told in words
  // where the field is, with the menu and field names its plugin translation
  // shows (read from the plugin's own catalogs, never edited here).
  const PLUGIN_LOCALE = { en: "_en", zh: "zh_CN", tw: "zh_TW", ko: "ko_KR", es: "es_ES", fr: "fr_FR", de: "de_DE" };
  const i18nDir = new URL("../wordpress-plugin/webmcp-canary/languages/i18n/", import.meta.url);
  const plugin = (locale) => locale === "_en" ? null : JSON.parse(readFileSync(new URL(`${locale}.json`, i18nDir), "utf8"));
  const word = (catalog, msgid) => catalog ? catalog[msgid] : msgid;
  for (const lang of LANGS) {
    const { app, ob, box } = wizard(async () => ({ sites: [{ id: "s1", bound: false }] }), { storage: { "nrv-dash-lang": lang } });
    assert.equal(app.get("lang"), lang);
    ob.connectStep("s1", "NRV-AAAAA", "https://example.com/");
    const I = app.get("I");
    const shot = box.innerHTML.includes("wp-pairing-code.png");
    if (lang === "ja") {
      assert.ok(shot, "ja keeps the screenshot");
      assert.ok(!box.innerHTML.includes("nrv-paste-where"), "and needs no text in its place");
      continue;
    }
    assert.ok(!shot && !box.innerHTML.includes("<figure"), `${lang}: no Japanese screenshot`);
    const text = I[lang].obPasteWhere;
    assert.ok(text && text !== I.en.obPasteWhere || lang === "en", `${lang}: obPasteWhere is its own translation`);
    assert.ok(box.innerHTML.includes(`<p class="nrv-paste-where">${app.get("esc")(text)}</p>`), `${lang}: the description is shown instead`);
    const catalog = plugin(PLUGIN_LOCALE[lang]);
    for (const msgid of ["Nurevo AEO", "Settings", "Pairing code", "Store / organization information"]) {
      assert.ok(text.includes(word(catalog, msgid)), `${lang}: names "${word(catalog, msgid)}" as the plugin does`);
    }
    // The numbered steps around it use the same names.
    assert.ok(I[lang].obI2.includes(word(catalog, "Settings")), `${lang}: obI2 names the plugin's Settings menu`);
    assert.ok(I[lang].obI3.includes(word(catalog, "Pairing code")), `${lang}: obI3 names the plugin's field`);
    assert.ok(!/[\u3040-\u30ff]/.test(text), `${lang}: no kana in the description`);
  }
}

/* ---------------- 4. back from Stripe ---------------- */

async function returning(search, { saved, rounds }) {
  let n = 0;
  const app = boot({
    search,
    storage: saved ? { "nrv-dash-checkout": JSON.stringify(saved) } : {},
    apiImpl: async (path) => path === "/api/sites" ? { sites: [{ id: "s1", plan: n++ >= rounds ? "standard" : "free" }] } : {},
  });
  // setTimeout fires at once so the minute of polling runs instantly.
  app.sandbox.setTimeout = (fn) => { Promise.resolve().then(fn); return 1; };
  app.set("sites", [{ id: "s1", plan: "free", url: "example.com" }]);
  const toast = app.sandbox.document.querySelector("#toast");
  await app.sandbox.handleCheckoutReturn();
  return { app, toast };
}
{
  const { app, toast } = await returning("?checkout=success", { saved: { id: "s1", plan: "free" }, rounds: 2 });
  assert.equal(app.get("view"), "site:s1", "the site that was being paid for is opened");
  assert.ok(toast.textContent.includes("Standard"), "the new plan is announced");
  assert.ok(toast.textContent.includes("プランを更新"), "with how to refresh it in WordPress");
  assert.equal(app.location.search, "", "and the query is cleaned up");
  assert.equal(app.store["nrv-dash-checkout"], undefined, "the hand-off is used once");
  assert.equal(app.calls.filter((c) => c.path === "/api/sites").length, 3, "polling stopped once the plan moved");
}
{
  const { toast, app } = await returning("?billing=success", { saved: null, rounds: 999 });
  assert.equal(app.calls.filter((c) => c.path === "/api/sites").length, 21, "a payment link return polls for up to a minute (3 s x 20)");
  assert.equal(toast.textContent, app.get("I").ja.coSlow, "then says it is still on its way");
}
{
  const { toast, app } = await returning("?checkout=cancelled", { saved: { id: "s1", plan: "free" }, rounds: 0 });
  assert.equal(toast.textContent, app.get("I").ja.coCancelled, "a cancelled checkout says nothing was charged");
  assert.equal(app.calls.length, 0, "and polls nothing");
}
{
  // An existing subscription opens the billing portal instead of an error.
  const app = boot({ apiImpl: async (path) => { if (path === "/api/billing/checkout") { const e = Error("subscription_active"); throw e; } return { url: "https://billing.stripe.com/p/session" }; } });
  const button = { textContent: "x", disabled: false };
  await app.sandbox.billingRedirect("/api/billing/checkout", { site_id: "s1", plan: "pro" }, button);
  assert.deepEqual(app.calls.map((c) => c.path), ["/api/billing/checkout", "/api/billing/portal"]);
  assert.equal(app.location.href, "https://billing.stripe.com/p/session");
}

/* ---------------- 9. accessibility basics in the markup ---------------- */

{
  const app = boot();
  app.set("sites", [{ id: "s1", url: "example.com", key: "k", install_type: "wp", status: "active", checklist: [], fill: {}, plan: "free" }]);
  const table = app.sandbox.rows(app.get("sites"));
  assert.ok(table.includes('<a class="rowlink" href="#site:s1" data-site-link>example.com</a>'), "each row has a real link to the site");
  assert.ok(app.sandbox.authPanel().includes('<label for="auth-email">') && app.sandbox.authPanel().includes('id="auth-email"'), "the sign-in email is labelled");
  assert.ok(!/🇯🇵|🇬🇧/.test(HTML), "no flag-only language options");
  assert.ok(/<option value="tw" lang="zh-TW">繁體中文<\/option>/.test(HTML));
  assert.ok(/@media\(max-width:760px\)\{\.app\{grid-template-columns:1fr\}\.side\{flex-direction:row/.test(HTML), "the side menu becomes a top bar on phones instead of disappearing");
}

console.log("onboarding flow tests passed");
