/**
 * The license-binding panel and its release flow, from the real dashboard code.
 *
 * Releasing a binding is irreversible from this page and has effects elsewhere:
 * the seat is freed and the WordPress store-info sync stops until the plugin is
 * saved again. So the panel has to live outside the profile form - "save" must
 * never release anything - and the confirmation has to be read, not clicked
 * past. These assert both, and that a mismatched confirmation sends nothing.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const HTML = readFileSync(new URL("../public/dashboard.html", import.meta.url), "utf8");
const SOURCE = [...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1])
  .find((block) => block.includes("function render"));
assert.ok(SOURCE, "the dashboard inline script was found");

/** A DOM stub that remembers markup and handlers, keyed by selector. */
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

function makeSandbox({ fetchImpl } = {}) {
  const created = [];
  const calls = [];
  const roots = new Map();
  const sandbox = {
    document: {
      createElement() { const el = fakeNode(); created.push(el); return el; },
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
    localStorage: { getItem: () => null, setItem() {} },
    location: { reload() {}, search: "", href: "https://nurevo.jp/dashboard", origin: "https://nurevo.jp" },
    navigator: {},
    Headers: class { constructor() {} has() { return false; } set() {} },
    URL,
    FormData: class { constructor(form) { this.form = form; } get(key) { return (this.form?.values || {})[key] ?? ""; } },
    // The script registers a hashchange listener for deep linking.
    addEventListener() {},
    MutationObserver: class { observe() {} },
    setTimeout() {}, clearTimeout() {},
    fetch: fetchImpl || (async () => { calls.push("unexpected"); throw new Error("no network expected"); }),
    Number, Math, String, Date, JSON, Array, Object, Error, console,
    encodeURIComponent, decodeURIComponent,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`${SOURCE}\n;globalThis.__detail = detail;globalThis.__askUnbind = askUnbind;`, sandbox);
  return { sandbox, created, calls, roots };
}

const detailHtml = (site) => makeSandbox().sandbox.__detail(site);

const BOUND = (over = {}) => ({
  id: "site1", url: "example.com", key: "nrv_k", install_type: "wp", status: "active",
  checklist: [], fill: { filled: 6, total: 6, pct: 100 }, plan: "pro", crawler_allowed: 1,
  schema_types: 3, _settings: {}, _sources: {}, _serve: 1, _crawl: 1,
  bound: true, bound_at: 1_760_000_000_000, domain_key: "example.com", manual_plan: null, ...over,
});

/* ---------------- a bound site shows what it is bound to ---------------- */

{
  const html = detailHtml(BOUND());
  assert.ok(html.includes("ライセンス接続"), "the panel is titled");
  assert.ok(html.includes("example.com"), "the bound domain is shown");
  assert.ok(html.includes('id="unbind"'), "and the release button is offered");
  assert.ok(html.includes("接続日時"), "with the time it was bound");
}

{
  // A manual grant is worth surfacing: it explains why the site has a tier
  // without a subscription behind it.
  const html = detailHtml(BOUND({ manual_plan: "pro" }));
  assert.ok(html.includes("手動付与"), "a manual grant is labelled");

  const billed = detailHtml(BOUND({ manual_plan: null }));
  assert.equal(billed.includes("手動付与"), false, "a billed site shows no grant row");
}

{
  // The hash identifies a secret and must not travel to the page.
  const html = detailHtml(BOUND({ bound_license_hash: "f".repeat(64) }));
  assert.equal(html.includes("f".repeat(64)), false, "the licence hash is never rendered");
  assert.equal(/bound_license_hash/.test(html), false);
}

/* ---------------- an unbound site offers nothing to release ---------------- */

{
  const html = detailHtml(BOUND({ bound: false, bound_at: null, domain_key: null }));
  assert.equal(html.includes('id="unbind"'), false, "no release button on an unbound site");
  assert.ok(html.includes("未接続"), "it says it is not connected");
  assert.ok(html.includes("WordPress管理画面"), "and how to connect it");
}

/* ---------------- the panel is not part of the profile form ---------------- */

{
  const html = detailHtml(BOUND());
  const formStart = html.indexOf('<form id="form"');
  const formEnd = html.indexOf("</form>", formStart);
  const button = html.indexOf('id="unbind"');
  assert.ok(formStart !== -1 && formEnd !== -1 && button !== -1, "both exist");
  assert.ok(button > formEnd, "the release button sits outside the profile form");

  // And the profile form is still complete.
  for (const field of ["name", "address", "phone", "lat", "lng", "image", "reserve_url"]) {
    assert.ok(html.includes(`name="${field}"`), `${field} is still in the profile form`);
  }
  assert.ok(html.includes('name="serve_schema"'), "as are the output toggles");
}

/* ---------------- the surrounding panels are intact ---------------- */

{
  const html = detailHtml(BOUND());
  assert.ok(html.includes("対応AIクローラー"), "the crawler panel survives");
  assert.ok(html.includes("3"), "the schema count survives");
  assert.ok(html.includes("平均 情報充足率") || html.includes("6/6"), "the fill summary survives");
}

/* ---------------- untrusted values are escaped ---------------- */

{
  const html = detailHtml(BOUND({ domain_key: '"><img src=x onerror=alert(1)>', manual_plan: "<b>pro</b>" }));
  assert.equal(html.includes("<img src=x"), false, "no markup from the domain");
  assert.equal(html.includes("<b>pro</b>"), false, "no markup from the grant");
  assert.ok(html.includes("&lt;img"), "it is escaped instead");
  // The domain is also written into a data attribute the handler reads back.
  assert.equal(html.includes('data-domain=""><img'), false, "the data attribute does not break out");
}

/* ---------------- the confirmation must match before anything is sent ---------------- */

function runConfirm({ domain = "example.com", typed, fetchImpl }) {
  // The script boots itself and calls load(), so requests are only counted from
  // the moment the confirmation is submitted.
  const requests = [];
  let recording = false;
  const wrapped = async (url, init) => {
    if (recording) requests.push({ url, method: init?.method });
    return fetchImpl ? fetchImpl(url, init) : { ok: true, json: async () => ({}) };
  };
  const { sandbox, created } = makeSandbox({ fetchImpl: wrapped });
  sandbox.load = async () => {};
  sandbox.__askUnbind({ id: "site1", domain_key: domain });
  const modal = created[created.length - 1];
  const form = modal.querySelector("#unbindform");
  const error = modal.querySelector("#unbinderr");
  const submit = form.querySelector("button[type=submit]");
  return {
    modal, form, error, submit, requests,
    run: () => {
      recording = true;
      return form.handlers.submit({ preventDefault() {}, target: { values: { confirm: typed }, querySelector: () => submit } });
    },
  };
}

{
  // The modal has to state the consequences, not just ask.
  const { modal } = runConfirm({ typed: "" });
  for (const phrase of ["シート", "同期が止まります", "再接続", "保持されます", "課金を解約しません"]) {
    assert.ok(modal.innerHTML.includes(phrase), `the modal explains: ${phrase}`);
  }
  assert.ok(modal.innerHTML.includes("example.com"), "and names the domain to type");
}

{
  const confirm = runConfirm({ typed: "wrong.example" });
  await confirm.run();
  assert.equal(confirm.requests.length, 0, "a mismatched confirmation sends no request");
  assert.equal(confirm.error.textContent, "入力が接続ドメインと一致しません。", "and says why");
  assert.equal(confirm.modal.removed, undefined, "the modal stays open");
}

{
  // An empty box must not count as agreement.
  const confirm = runConfirm({ typed: "" });
  await confirm.run();
  assert.equal(confirm.requests.length, 0, "an empty confirmation sends nothing");
}

{
  // Nor may an unbound site be released by submitting an empty box against an
  // empty domain, where "" === "" would otherwise pass.
  const confirm = runConfirm({ domain: "", typed: "" });
  await confirm.run();
  assert.equal(confirm.requests.length, 0, "an empty domain can never be confirmed");
}

{
  const confirm = runConfirm({
    typed: "example.com",
    fetchImpl: async () => ({ ok: true, json: async () => ({ ok: true, bound: false, plan: "pro" }) }),
  });
  await confirm.run();
  assert.equal(confirm.requests.length, 1, "a matching confirmation sends exactly one request");
  assert.equal(confirm.requests[0].url, "/api/sites/site1/unbind", "to the unbind endpoint");
  assert.equal(confirm.requests[0].method, "POST");
  assert.ok(confirm.modal.removed, "and the modal closes");
}

{
  // Whitespace around a correct answer is forgiven; a wrong answer is not.
  const confirm = runConfirm({ typed: "  example.com  " });
  await confirm.run();
  assert.equal(confirm.requests.length, 1, "a trimmed match is accepted");
}

{
  // A refused request leaves the operator able to try again, and says what
  // happened rather than closing silently.
  const confirm = runConfirm({
    typed: "example.com",
    fetchImpl: async () => ({ ok: false, status: 403, json: async () => ({ error: "forbidden" }) }),
  });
  await confirm.run();
  assert.equal(confirm.modal.removed, undefined, "the modal stays open on failure");
  assert.equal(confirm.error.textContent, "forbidden", "and reports the error");
  assert.equal(confirm.submit.disabled, false, "the button is usable again");
}

console.log("unbind UI tests passed");

/* ---------------- the plan panel (Phase 1) ---------------- */

{
  // A site Stripe has never seen: both tiers are offered, and nothing claims to
  // manage a subscription that does not exist.
  const html = detailHtml(BOUND({ plan: "free", billing: { status: "pending", customer_id: null, subscription_id: null } }));
  assert.ok(html.includes("現在のプラン"), "the plan panel is titled");
  assert.ok(html.includes("FREE"), "and states the current plan");
  assert.ok(html.includes('data-buy="standard"') && html.includes('data-buy="pro"'), "both tiers can be bought");
  assert.ok(html.includes("¥3,000") && html.includes("¥14,800"), "at the price each actually costs");
  assert.equal(html.includes('id="planportal"'), false, "no portal button without a customer");
}

{
  // Once Stripe knows the customer, changing tier belongs to the portal: it
  // handles proration and the result comes back through the webhook, which is
  // the only thing allowed to decide a plan.
  const html = detailHtml(BOUND({ plan: "standard", billing: { status: "active", customer_id: "cus_1", subscription_id: "sub_1" } }));
  assert.ok(html.includes('id="planportal"'), "the portal is offered");
  assert.ok(html.includes("STANDARD"), "and the paid tier is shown");
  assert.equal(html.includes('data-buy="'), false, "a second checkout is not offered alongside it");
  assert.ok(html.includes("Stripe"), "and the page says where the change happens");
}

{
  // A granted tier has no subscription behind it, so it is labelled as granted.
  const granted = detailHtml(BOUND({ plan: "pro", manual_plan: "pro", billing: { status: "pending", customer_id: null } }));
  assert.ok(granted.includes("手動付与"), "a manual grant is called one");

  const billed = detailHtml(BOUND({ plan: "pro", manual_plan: null, billing: { status: "active", customer_id: "cus_1" } }));
  assert.equal(billed.includes("手動付与"), false, "a paid tier is not");
}

{
  // Wholesale sites are invoiced outside Stripe; offering checkout would be a
  // second bill for the same site.
  const html = detailHtml(BOUND({ payment_ui: false, plan: "standard", billing: { status: "active", customer_id: "cus_1" } }));
  assert.equal(html.includes('data-buy="'), false, "no checkout for a wholesale site");
  assert.equal(html.includes('id="planportal"'), false, "and no portal");
  assert.ok(html.includes("卸請求"), "it says why instead");
}

{
  // The panel must not sit inside the profile form, or saving the store details
  // would trip a redirect to Stripe.
  const html = detailHtml(BOUND({ billing: { status: "pending", customer_id: null } }));
  const formEnd = html.indexOf("</form>", html.indexOf('<form id="form"'));
  assert.ok(html.indexOf('data-buy="standard"') > formEnd, "the buy buttons are outside the profile form");
}

{
  // Untrusted values reach the panel like everything else.
  const html = detailHtml(BOUND({ plan: '"><script>alert(1)</script>', manual_plan: "<b>x</b>" }));
  assert.equal(html.includes("<script>alert(1)"), false, "the plan is escaped");
  assert.equal(html.includes("<b>x</b>"), false, "so is the grant");
}

console.log("plan panel tests passed");

/* ---------------- the binding panel after pairing replaced licences ---------------- */

{
  // A paired site is connected. The panel used to read the licence hash, which
  // /api/pair never sets, so every paired install was told it was not connected
  // and pointed at a licence field that no longer connects anything.
  const html = detailHtml(BOUND({ bound: true, bound_via: "pairing", domain_key: "example.com" }));
  assert.ok(html.includes("ペアリングコード"), "the panel says it was connected by pairing");
  assert.equal(html.includes("未接続"), false, "and does not claim otherwise");
  assert.ok(html.includes('id="unbind"'), "with the release control");
}

{
  const html = detailHtml(BOUND({ bound: true, bound_via: "license", domain_key: "example.com" }));
  assert.ok(html.includes("旧方式"), "a legacy licence link is named as legacy");
}

{
  // Not connected: the instructions are the ones that work, and the code can be
  // issued from here rather than only from the add dialog.
  const html = detailHtml(BOUND({ bound: false, bound_via: null, bound_at: null, domain_key: null }));
  assert.ok(html.includes("未接続"));
  assert.ok(html.includes("ペアリングコードを発行"), "a code can be issued from the panel");
  assert.ok(html.includes("貼り付けると接続されます"), "and the instructions describe pairing");
  assert.equal(html.includes("ライセンスキーを保存すると接続"), false, "the licence instruction is gone");
}

console.log("binding panel tests passed");
