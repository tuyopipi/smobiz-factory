/**
 * Dashboard routing, the deep-link handoff across login, and the outbound link.
 *
 * `view` used to be pure memory: the address bar never changed, so a site could
 * not be linked to, a reload always returned to the summary, and the back button
 * did nothing. These exercise the real inline script under a DOM shim.
 *
 * The property that matters most is that an unknown or someone else's site id
 * still renders the ordinary empty state - the hash is untrusted input, and it
 * must not become a way to probe which site ids exist.
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

/**
 * Boot the dashboard script with a given address bar and a given set of sites.
 *
 * `sites` is injected after the script runs, standing in for what load() would
 * have fetched, then render() is driven directly.
 */
function boot({ hash = "", sites = [], storage = {}, fetchImpl } = {}) {
  const roots = new Map();
  const created = [];
  const store = { ...storage };
  const history = [];
  const location = {
    hash, pathname: "/dashboard", search: "", href: "https://nurevo.jp/dashboard",
    origin: "https://nurevo.jp", reload() {},
  };
  const listeners = {};
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
    localStorage: {
      getItem: (key) => (key in store ? store[key] : null),
      setItem: (key, value) => { store[key] = String(value); },
      removeItem: (key) => { delete store[key]; },
    },
    location,
    history: {
      replaceState(_state, _title, url) { history.push(["replace", url]); const index = String(url).indexOf("#"); location.hash = index === -1 ? "" : String(url).slice(index); },
      pushState(_state, _title, url) { history.push(["push", url]); },
    },
    addEventListener(type, handler) { listeners[type] = handler; },
    navigator: {},
    Headers: class { has() { return false; } set() {} },
    URL,
    FormData: class { constructor(form) { this.form = form; } get(key) { return (this.form?.values || {})[key] ?? ""; } },
    MutationObserver: class { observe() {} },
    setTimeout() {}, clearTimeout() {},
    fetch: fetchImpl || (async () => ({ ok: true, json: async () => ({}) })),
    Number, Math, String, Date, JSON, Array, Object, Error, console,
    encodeURIComponent, decodeURIComponent,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`${SOURCE}
;globalThis.__get = (name) => globalThis[name];
;globalThis.__setSites = (rows) => { sites = rows; };
;globalThis.__setView = (v) => { view = v; };
;globalThis.__view = () => view;`, sandbox);
  sandbox.__setSites(sites);
  return {
    sandbox, location, store, history, listeners, roots,
    main: () => roots.get("#main")?.innerHTML || "",
    view: () => sandbox.__view(),
    render: () => sandbox.render(),
    load: () => sandbox.load(),
  };
}

const SITE = (over = {}) => ({
  id: "abc123def456", url: "example.com", key: "nrv_k", install_type: "wp", status: "active",
  checklist: [], fill: { filled: 6, total: 6, pct: 100 }, plan: "free", crawler_allowed: 1,
  schema_types: 3, _settings: {}, _sources: {}, _serve: 1, _crawl: 1,
  bound: true, bound_at: 1_760_000_000_000, domain_key: "example.com", manual_plan: null,
  website_uri: "https://example.com/", ...over,
});

/* ---------------- A1: the hash decides the opening view ---------------- */

{
  const app = boot({ hash: "#site:abc123def456", sites: [SITE()] });
  assert.equal(app.view(), "site:abc123def456", "the view comes from the hash");
  app.render();
  assert.ok(app.main().includes('id="form"'), "and the site detail is what renders");
  assert.ok(app.main().includes("example.com"));
}

{
  const app = boot({ hash: "", sites: [SITE()] });
  assert.equal(app.view(), "summary", "no hash means the summary");
}

for (const view of ["summary", "sites", "billing"]) {
  const app = boot({ hash: `#${view}`, sites: [SITE()] });
  assert.equal(app.view(), view, `#${view} opens that view`);
}

/* ---------------- A1: the hash is untrusted input ---------------- */

{
  // A site id that is not in this member's list renders the ordinary empty
  // state. /api/sites only ever returns the member's own sites, so this is the
  // same answer for "does not exist" and "belongs to someone else" - no probe.
  const app = boot({ hash: "#site:ffffffffffff", sites: [SITE()] });
  app.render();
  assert.ok(app.main().includes("サイトがありません"), "an unknown id shows the empty state");
  assert.equal(app.main().includes('id="form"'), false, "and no site detail");
}

{
  const other = boot({ hash: "#site:aaaaaaaaaaaa", sites: [] });
  other.render();
  assert.ok(other.main().includes("サイトがありません"), "another org's id is indistinguishable");
}

for (const bad of [
  "#site:../../etc/passwd",
  "#site:<script>alert(1)</script>",
  '#site:" onload="alert(1)',
  "#site:abc-123",
  "#site:",
  "#nonsense",
  "#guide",
  "#site:" + "a".repeat(200),
]) {
  const app = boot({ hash: bad, sites: [SITE()] });
  assert.equal(app.view(), "summary", `${bad} is rejected and falls back to the summary`);
  app.render();
  const html = app.main();
  assert.equal(html.includes("<script>alert"), false, `${bad} injects no markup`);
  assert.equal(html.includes('onload="alert'), false, `${bad} injects no attribute`);
}

{
  // A percent-encoded id is accepted once decoded, and a broken escape does not
  // throw out of decodeURIComponent.
  const app = boot({ hash: "#site:%61bc123def456", sites: [SITE()] });
  assert.equal(app.view(), "site:abc123def456", "a valid encoded id decodes");

  const broken = boot({ hash: "#site:%E0%A4%A", sites: [SITE()] });
  assert.equal(broken.view(), "summary", "a malformed escape is rejected, not thrown");
}

/* ---------------- A2: rendering keeps the address bar in step ---------------- */

{
  const app = boot({ hash: "", sites: [SITE()] });
  app.render();
  assert.equal(app.location.hash, "#summary", "arriving writes the current view");
  assert.deepEqual(app.history[0][0], "replace", "and replaces rather than pushing, so back still leaves");
}

{
  const app = boot({ hash: "#summary", sites: [SITE()] });
  app.sandbox.__setView("site:abc123def456");
  app.render();
  assert.equal(app.location.hash, "#site:abc123def456", "navigating updates the hash");
}

{
  // The guide is rendered by dashboard-guide.js without touching `view`, so the
  // hash must not be rewritten on its behalf.
  const app = boot({ hash: "#summary", sites: [SITE()] });
  app.sandbox.__setView("guide");
  app.render();
  assert.equal(app.location.hash, "#summary", "an unroutable view leaves the hash alone");
}

/* ---------------- A2: hashchange re-renders ---------------- */

{
  const app = boot({ hash: "#summary", sites: [SITE()] });
  app.render();
  assert.ok(app.listeners.hashchange, "a hashchange listener is registered");

  app.location.hash = "#site:abc123def456";
  app.listeners.hashchange();
  assert.equal(app.view(), "site:abc123def456", "the back button changes the view");
  assert.ok(app.main().includes('id="form"'), "and re-renders");

  app.location.hash = "#summary";
  app.listeners.hashchange();
  assert.equal(app.view(), "summary", "and back again");
}

{
  // syncHash() writes the hash and hashchange reads it. The guard is that a
  // hash which already matches the view does nothing, so the two cannot drive
  // each other.
  const app = boot({ hash: "#site:abc123def456", sites: [SITE()] });
  app.render();
  let renders = 0;
  const original = app.sandbox.render;
  app.sandbox.render = () => { renders += 1; original(); };
  app.listeners.hashchange();
  assert.equal(renders, 0, "a hashchange matching the current view re-renders nothing");
}

/* ---------------- B: the deep link survives login ---------------- */

{
  // 401 on the first fetch: the target is stashed before the auth form replaces
  // the page, because the magic link returns to a bare /dashboard and the hash
  // is gone by then.
  const app = boot({
    hash: "#site:abc123def456",
    fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({ error: "unauthorized" }) }),
  });
  await app.load();
  assert.equal(app.store["nrv-dash-pending-site"], "abc123def456", "the wanted site is stashed");
  assert.ok(app.main().includes("ログインが必要です"), "and the auth form is shown");
}

{
  // Not every 401 carries an intent.
  const app = boot({ hash: "", fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({ error: "unauthorized" }) }) });
  await app.load();
  assert.equal(app.store["nrv-dash-pending-site"], undefined, "nothing is stashed without a deep link");
}

{
  // After login, a fresh /dashboard load with no hash picks the intent back up.
  // localStorage rather than sessionStorage, because the email client opens a
  // new tab.
  const rows = [SITE()];
  const app = boot({
    hash: "",
    storage: { "nrv-dash-pending-site": "abc123def456" },
    fetchImpl: async (url) => ({
      ok: true,
      json: async () => (String(url).startsWith("/api/sites?") || String(url) === "/api/sites"
        ? { sites: rows } : { crawlers: [], profile: {}, field_sources: {} }),
    }),
  });
  await app.load();
  assert.equal(app.view(), "site:abc123def456", "the stashed site is opened");
  assert.equal(app.store["nrv-dash-pending-site"], undefined, "and the stash is cleared");
}

{
  // Whatever is in storage is untrusted: another page on this origin could have
  // written it. A malformed value is discarded rather than routed to.
  const app = boot({
    hash: "",
    storage: { "nrv-dash-pending-site": '<script>alert(1)</script>' },
    fetchImpl: async () => ({ ok: true, json: async () => ({ sites: [] }) }),
  });
  await app.load();
  assert.equal(app.store["nrv-dash-pending-site"], undefined, "a malformed stash is cleared");
  assert.equal(app.view(), "summary", "and ignored");
  assert.equal(app.main().includes("<script>alert"), false, "and never reaches the page");
}

{
  // A stash is single use, so a stale one cannot hijack a later visit. The id
  // here is well-formed but belongs to no site, which is the ordinary case once
  // a site has been deleted.
  const app = boot({
    hash: "",
    storage: { "nrv-dash-pending-site": "ffffffffffff" },
    fetchImpl: async () => ({ ok: true, json: async () => ({ sites: [] }) }),
  });
  await app.load();
  assert.equal(app.store["nrv-dash-pending-site"], undefined, "the stash is consumed");
  assert.ok(app.main().includes("サイトがありません"), "and a vanished site shows the empty state");
}

{
  // An explicit hash beats a stash.
  const app = boot({
    hash: "#billing",
    storage: { "nrv-dash-pending-site": "abc123def456" },
    fetchImpl: async () => ({ ok: true, json: async () => ({ sites: [] }) }),
  });
  await app.load();
  assert.equal(app.view(), "billing", "the address bar wins over the stash");
  assert.equal(app.store["nrv-dash-pending-site"], undefined, "which is consumed either way");
}

/* ---------------- D: the outbound link to the store's own site ---------------- */

{
  const app = boot({ hash: "#site:abc123def456", sites: [SITE()] });
  app.render();
  const html = app.main();
  assert.ok(html.includes('href="https://example.com/"'), "website_uri is the link target");
  assert.ok(html.includes('target="_blank"'), "it opens in a new tab");
  assert.ok(html.includes('rel="noopener"'), "with noopener");
  assert.ok(html.includes("サイトを開く"), "and a label");
}

{
  // sites.url holds a bare normalised domain for bound sites, so it needs a
  // scheme before it is a link at all.
  const app = boot({ hash: "#site:abc123def456", sites: [SITE({ website_uri: null, url: "shop.example" })] });
  app.render();
  assert.ok(app.main().includes('href="https://shop.example"'), "a bare domain gets a scheme");
}

{
  const app = boot({ hash: "#site:abc123def456", sites: [SITE({ website_uri: null, url: "http://legacy.example/" })] });
  app.render();
  assert.ok(app.main().includes('href="http://legacy.example/"'), "an existing scheme is kept");
}

{
  // F6: nothing to link to.
  const app = boot({ hash: "#site:abc123def456", sites: [SITE({ website_uri: null, url: null, slug: "demo" })] });
  app.render();
  assert.equal(app.main().includes("サイトを開く"), false, "no link when there is no URL");
  assert.ok(app.main().includes('id="form"'), "but the page still renders");
}

{
  // A stored URL is untrusted text like any other.
  const app = boot({ hash: "#site:abc123def456", sites: [SITE({ website_uri: '" onmouseover="alert(1)' })] });
  app.render();
  const html = app.main();
  assert.equal(html.includes('" onmouseover="alert(1)'), false, "the href cannot break out");
  assert.equal(html.includes("<script"), false);
}

/* ---------------- E1: the fill denominator matches the required set ---------------- */

{
  const app = boot({ hash: "#site:abc123def456", sites: [SITE({ fill: null })] });
  app.render();
  assert.equal(app.main().includes("/7"), false, "the stale denominator of 7 is gone");
  // geo left the required set when Google Places did, so five remain.
  assert.ok(app.main().includes("/5"), "five required fields is what is shown");
}

/* ---------------- the rest of the detail view is intact ---------------- */

{
  const app = boot({ hash: "#site:abc123def456", sites: [SITE()] });
  app.render();
  const html = app.main();
  assert.ok(html.includes('id="unbind"'), "the binding panel survives");
  assert.ok(html.includes('name="reserve_url"'), "the profile form survives");
  assert.ok(html.includes("対応AIクローラー"), "the crawler panel survives");
  assert.ok(html.includes('data-view="sites"'), "the back button survives");
}

console.log("dashboard routing tests passed");
