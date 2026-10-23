/**
 * The store-profile edit form, rendered by the real dashboard script.
 *
 * The endpoint tests prove the payload carries every field; these prove the form
 * actually shows them, and that it no longer puts the site URL in the name box -
 * the prefill that made an untouched save commit the URL as the store name.
 *
 * The inline script from dashboard.html is executed under a DOM shim, so what is
 * asserted is the markup that ships.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const HTML = readFileSync(new URL("../public/dashboard.html", import.meta.url), "utf8");
const SOURCE = [...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1])
  .find((block) => block.includes("function render"));
assert.ok(SOURCE, "the dashboard inline script was found");

const EDITABLE = ["name", "description", "address", "phone", "hours",
  "business_type_schema", "email", "url", "lat", "lng", "image", "reserve_url"];

function detailHtml(site) {
  const node = () => ({
    className: "", dataset: {}, innerHTML: "", value: "", textContent: "", style: {},
    classList: { toggle() {}, add() {}, remove() {} },
    appendChild() {}, append() {}, querySelector: () => null, querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {}, closest: () => null, remove() {},
  });
  const sandbox = {
    document: {
      createElement: () => node(),
      querySelector: () => node(),
      querySelectorAll: () => [],
      addEventListener() {},
      head: { appendChild() {} },
      body: node(),
      documentElement: { lang: "ja" },
    },
    localStorage: { getItem: () => null, setItem() {} },
    location: { reload() {}, search: "", href: "https://nurevo.jp/dashboard" },
    navigator: {},
    // The script registers a hashchange listener for deep linking.
    addEventListener() {},
    MutationObserver: class { observe() {} },
    setTimeout() {}, clearTimeout() {},
    fetch: async () => { throw new Error("rendering must not call the network"); },
    Number, Math, String, Date, JSON, Array, Object, Error, console, encodeURIComponent, decodeURIComponent,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`${SOURCE}\n;globalThis.__detail = detail;`, sandbox);
  return sandbox.__detail(site);
}

const SITE = (over = {}) => ({
  id: "site1", url: "example.com", key: "nrv_k", install_type: "tag", status: "active",
  checklist: [], fill: { filled: 6, total: 6, pct: 100 }, plan: "free", crawler_allowed: 1,
  _settings: {}, _sources: {}, _serve: 1, _crawl: 1, ...over,
});

/* ---------------- every editable field has an input ---------------- */

{
  const html = detailHtml(SITE());
  for (const field of EDITABLE) {
    assert.ok(html.includes(`name="${field}"`), `${field} has an input`);
  }
  // The fields that are not the owner's to edit must not get one.
  for (const field of ["business_type_label", "hours_periods", "price_level", "price"]) {
    assert.equal(html.includes(`name="${field}"`), false, `${field} has no input`);
  }
}

/* ---------------- values are shown ---------------- */

{
  const html = detailHtml(SITE({ _settings: {
    name: "栞珈琲", description: "渋谷の喫茶店", address: "東京都渋谷区1-2-3", phone: "03-1234-5678",
    hours: "9:00-18:00", business_type_schema: "CafeOrCoffeeShop", email: "hello@example.com",
    url: "https://example.com", lat: 35.6586, lng: 139.7454,
    image: "https://example.com/i.jpg", reserve_url: "https://example.com/book",
  } }));
  // These four are the ones that always rendered blank before, because
  // /api/tag/config never carried them.
  assert.ok(html.includes('name="lat" value="35.6586"'), "the latitude is shown");
  assert.ok(html.includes('name="lng" value="139.7454"'), "the longitude is shown");
  assert.ok(html.includes('value="https://example.com/i.jpg"'), "the image is shown");
  assert.ok(html.includes('value="https://example.com/book"'), "the reservation URL is shown");
  // And the ones the dashboard could not edit at all.
  assert.ok(html.includes("渋谷の喫茶店"), "the description is shown");
  assert.ok(html.includes("CafeOrCoffeeShop"), "the schema type is shown");
  assert.ok(html.includes("hello@example.com"), "the store email is shown");
}

/* ---------------- the name is never prefilled with the URL ---------------- */

{
  const html = detailHtml(SITE({ url: "example.com", _settings: { name: null } }));
  const nameInput = html.slice(html.indexOf('name="name"'), html.indexOf('name="name"') + 200);
  assert.ok(nameInput.includes('value=""'), "an unset name renders empty");
  assert.ok(nameInput.includes('placeholder="example.com"'), "the URL is only a suggestion");
  assert.equal(nameInput.includes('value="example.com"'), false, "and never a value");
}

{
  // A stored name still wins over the placeholder.
  const html = detailHtml(SITE({ _settings: { name: "栞珈琲" } }));
  const nameInput = html.slice(html.indexOf('name="name"'), html.indexOf('name="name"') + 200);
  assert.ok(nameInput.includes('value="栞珈琲"'));
}

/* ---------------- a value of zero is not treated as missing ---------------- */

{
  // The equator and the prime meridian are real coordinates; `||` would have
  // rendered them as blank and the save would then have dropped them.
  const html = detailHtml(SITE({ _settings: { lat: 0, lng: 0 } }));
  assert.ok(html.includes('name="lat" value="0"'), "latitude 0 is shown");
  assert.ok(html.includes('name="lng" value="0"'), "longitude 0 is shown");
}

/* ---------------- untrusted values are escaped ---------------- */

{
  const html = detailHtml(SITE({ _settings: {
    name: '"><script>alert(1)</script>',
    description: "<img src=x onerror=alert(2)>",
    reserve_url: '" onfocus="alert(3)',
  } }));
  assert.equal(html.includes("<script>alert(1)"), false, "no script injected through the name");
  assert.equal(html.includes("<img src=x"), false, "no markup injected through the description");
  assert.equal(html.includes('" onfocus="alert(3)'), false, "no attribute break-out");
  assert.ok(html.includes("&lt;script&gt;") || html.includes("&quot;&gt;&lt;script"), "it is escaped instead");
  assert.ok(html.includes("&quot;"), "quotes are escaped so attributes stay intact");
}

{
  // The placeholder is interpolated too, so a hostile URL must not escape it.
  const html = detailHtml(SITE({ url: '" autofocus onfocus="alert(1)', _settings: { name: null } }));
  assert.equal(html.includes('" autofocus onfocus="alert(1)'), false, "the placeholder is escaped");
}

/* ---------------- the toggles reflect the stored settings ---------------- */

{
  const on = detailHtml(SITE({ _serve: 1, _crawl: 1 }));
  assert.ok(/name="serve_schema"[^>]*checked/.test(on), "serve_schema is checked when on");
  assert.ok(/name="allow_crawlers"[^>]*checked/.test(on), "allow_crawlers is checked when on");

  const off = detailHtml(SITE({ _serve: 0, _crawl: 0, crawler_allowed: 0 }));
  assert.equal(/name="serve_schema"[^>]*checked/.test(off), false, "and unchecked when off");
  assert.equal(/name="allow_crawlers"[^>]*checked/.test(off), false);
}

/* ---------------- the rest of the detail view is intact ---------------- */

{
  const html = detailHtml(SITE());
  assert.ok(html.includes('id="form"'), "the form is still there");
  assert.ok(html.includes("btn primary"), "with its save button");
  assert.ok(html.length > 1200, "and the surrounding panels still render");
}

/* ---------------- missing or damaged input ---------------- */

{
  for (const [label, site] of [
    ["no settings at all", SITE({ _settings: undefined })],
    ["null settings", SITE({ _settings: null })],
    ["no url", SITE({ url: undefined, _settings: {} })],
    ["no checklist", SITE({ checklist: undefined })],
    ["no fill", SITE({ fill: undefined })],
  ]) {
    const html = detailHtml(site);
    assert.ok(typeof html === "string" && html.includes('id="form"'), `${label} still renders the form`);
    assert.equal(html.includes("undefined"), false, `${label} leaks no undefined`);
    assert.equal(html.includes("NaN"), false, `${label} leaks no NaN`);
  }
}

console.log("profile form render tests passed");
