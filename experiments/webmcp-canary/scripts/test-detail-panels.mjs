/**
 * What the site page shows about its score, its comp and its pairing code.
 *
 * All three were reported as missing rather than wrong: the AEO score had no
 * row at all, a comped site said nothing about why it was not being billed,
 * and a connected site offered no way to get a fresh pairing code after its
 * WordPress had been rebuilt. Rendering is asserted against the real dashboard
 * source, so these cannot quietly disappear again.
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
    appendChild() {}, append(child) { node.appended = child; }, remove() { node.removed = true; },
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

function makeSandbox({ admin = false, search = "" } = {}) {
  const sandbox = {
    document: {
      createElement() { return fakeNode(); },
      querySelector() { return fakeNode(); },
      querySelectorAll: () => [],
      addEventListener() {}, head: { appendChild() {} }, body: fakeNode(),
      documentElement: { lang: "ja" }, cookie: "",
    },
    localStorage: { getItem: () => null, setItem() {} },
    location: { reload() {}, search, href: "https://nurevo.jp/dashboard", origin: "https://nurevo.jp" },
    navigator: {},
    Headers: class { has() { return false; } set() {} },
    URL, URLSearchParams,
    FormData: class { constructor(form) { this.form = form; } get(key) { return (this.form?.values || {})[key] ?? ""; } },
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
  vm.runInContext(`${SOURCE}\n;globalThis.__detail = detail;globalThis.__setAdmin = (v) => { isAdmin = v; };globalThis.__planIntent = () => PLAN_INTENT;`, sandbox);
  sandbox.__setAdmin(admin);
  return sandbox;
}

const SITE = (over = {}) => ({
  id: "site1", url: "example.com", key: "nrv_k", install_type: "wp", status: "active",
  website_uri: "https://example.com/", plan: "free", fill: { filled: 5, total: 5 },
  ...over,
});
const render = (site, opts) => makeSandbox(opts).__detail(SITE(site));

/* ---------------- the AEO score ---------------- */

{
  // A diagnosis that ran: the number, and when.
  const html = render({ _aeo: { scores: [{ score: 72, scanned_at: "2026-10-08T00:00:00.000Z" }] } });
  assert.ok(html.includes("AEOスコア"), "the score has a row of its own");
  assert.ok(html.includes("72"), "showing the number");
  assert.ok(html.includes("最終診断"), "and when it was taken");
  assert.ok(html.includes("再診断"), "with a way to take it again");
  assert.ok(!html.includes("まだ診断していません"));
}

{
  // The band, so a bad score reads as bad without doing the arithmetic.
  assert.ok(render({ _aeo: { scores: [{ score: 85 }] } }).includes('class="sig g"'), "80 and over is good");
  assert.ok(render({ _aeo: { scores: [{ score: 60 }] } }).includes('class="sig a"'), "the middle is a warning");
  assert.ok(render({ _aeo: { scores: [{ score: 20 }] } }).includes('class="sig n"'), "and a low score is neither");
}

{
  // Never diagnosed is not the same as nothing to show. This was the actual
  // complaint: a new site rendered no score row at all, which reads as broken.
  const html = render({ _aeo: { scores: [] } });
  assert.ok(html.includes("まだ診断していません"), "a site with no diagnosis says so");
  assert.ok(html.includes("診断を実行"), "and offers to run one");
}

{
  const html = render({ _aeo: null });
  assert.ok(html.includes("まだ診断していません"), "and so does one whose metrics could not be read");
}

{
  // A site with no address cannot be diagnosed at all, and saying "run a
  // diagnosis" would be an offer that always fails.
  const html = render({ url: "", website_uri: "", slug: null, _aeo: { scores: [] } });
  assert.ok(html.includes("URL未設定のため診断できません"), "no URL is its own answer");
  assert.ok(!html.includes("診断を実行"), "with no button that could not work");
}

{
  // Rows with no usable number are history, not a score.
  const html = render({ _aeo: { scores: [{ score: null }, { score: "n/a" }] } });
  assert.ok(html.includes("まだ診断していません"), "unusable history is not a score");
}

{
  const html = render({ _aeo: { scores: [{ score: 10 }, { score: 44 }] } });
  assert.ok(html.includes("44"), "the most recent diagnosis is the one shown");
}

/* ---------------- the comp ---------------- */

{
  // A site that is not being billed must say why, or a zero invoice looks
  // like a billing fault.
  const html = render({ manual_plan: "pro", manual_plan_note: "代理店契約により無償" });
  assert.ok(html.includes("無料枠"), "a comped site says so");
  assert.ok(html.includes("PRO"), "naming the tier");
  assert.ok(html.includes("代理店契約により無償"), "and the reason it was given");
  assert.ok(html.includes("このサイトに付与"), "and that the grant is this site's own");
}

{
  const html = render({ org_manual_plan: "standard", org_manual_plan_note: "卸パートナー" });
  assert.ok(html.includes("組織に付与"), "a grant made on the org says that instead");
  assert.ok(html.includes("STANDARD"));
  assert.ok(html.includes("卸パートナー"));
}

{
  const html = render({ manual_plan: "pro", org_manual_plan: "standard" });
  assert.ok(html.includes("このサイトに付与"), "the site's own grant is the one reported when both exist");
  assert.ok(html.includes("PRO"));
}

{
  const html = render({});
  assert.ok(!html.includes("無料枠（コンプ）"), "a site with no grant says nothing about one");
}

{
  // Granting is an admin act. A viewer seeing a form they cannot submit is
  // worse than not seeing it; the server checks this again regardless.
  const asAdmin = render({}, { admin: true });
  assert.ok(asAdmin.includes("compform"), "an admin gets the grant form");
  assert.ok(asAdmin.includes("無料で付与するプラン"));
  assert.ok(asAdmin.includes("組織全体に付与すると"), "and is told what an org grant covers");

  const asViewer = render({});
  assert.ok(!asViewer.includes("compform"), "a non-admin does not");
}

{
  const html = render({ manual_plan: "standard", manual_plan_note: "n" }, { admin: true });
  assert.ok(html.includes('value="standard" selected'), "the form opens on the grant already in force");
}

/* ---------------- the pairing code ---------------- */

{
  // The reason G exists: a connected site had no way to get a fresh code, so
  // a rebuilt WordPress could never be reconnected.
  const bound = render({ bound: true, domain_key: "example.com", bound_at: 1760000000000, bound_via: "pairing" });
  assert.ok(bound.includes("ペアリングコードを再発行"), "a connected site can re-issue its code");
  assert.ok(bound.includes("WordPressを作り直した場合"), "and is told when that is for");
  assert.ok(bound.includes("接続を解除"), "without losing the release control");
  assert.ok(bound.includes("issuecode"), "wired to the same handler as a first issue");
}

{
  const unbound = render({ bound: false });
  assert.ok(unbound.includes("未接続"), "an unconnected site still says so");
  assert.ok(unbound.includes("issuecode"), "and still offers a code");
  assert.ok(!unbound.includes("接続を解除"), "with nothing to release");
}

/* ---------------- the plan the landing page chose ---------------- */

{
  const chosen = render({}, { search: "?plan=standard" });
  assert.ok(chosen.includes("Standardを選択中"), "arriving from the Standard button says so");

  const plain = render({});
  assert.ok(!plain.includes("Standardを選択中"), "and arriving without one does not");
}

{
  // Pro is beta and its landing-page button is a detail link, not a purchase,
  // so it must never arrive here as a chosen plan. Asserted on the parse
  // itself, because the renderer guards on "standard" too and would hide a
  // mistake made here.
  assert.equal(makeSandbox({ search: "?plan=standard" }).__planIntent(), "standard", "the buyable plan is read");
  assert.equal(makeSandbox({ search: "?plan=pro" }).__planIntent(), null, "a plan that cannot be bought is not an intent");
  assert.equal(makeSandbox({ search: "?plan=enterprise" }).__planIntent(), null, "nor is one that does not exist");
  assert.equal(makeSandbox({ search: "" }).__planIntent(), null, "and no query is no intent");

  const pro = render({}, { search: "?plan=pro" });
  assert.ok(!pro.includes("選択中"), "so nothing is marked as chosen");
}

console.log("detail panel tests passed");
