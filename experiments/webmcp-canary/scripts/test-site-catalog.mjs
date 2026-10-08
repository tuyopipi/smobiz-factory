/**
 * The catalogue: what a site sells, offers, answers and publishes.
 *
 * The plugin already read all four - WooCommerce products, the hand-entered
 * services and FAQ, and the pages it scans - and none of it reached the service.
 * The dashboard could show an operator their phone number and nothing about the
 * shop it belongs to.
 *
 * The rule that matters most here is the same one the profile learned the hard
 * way: a list the payload does not carry is left alone. A sync that mentions
 * only products must not empty the FAQ.
 */
import assert from "node:assert/strict";
import { handleApi } from "../worker/api.mjs";

const SITE_ID = "site1";
const TOKEN = "nrvp_" + "a".repeat(64);
const CSRF = "c".repeat(64);
const SESSION = { cookie: `nrv_session=t; nrv_csrf=${CSRF}` };

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function makeEnv(tokenHash, { orgId = "org1" } = {}) {
  const db = { site_products: [], site_services: [], site_faqs: [], site_pages: [], state: null };
  const tableOf = (sql) => ["site_products", "site_services", "site_faqs", "site_pages"].find((t) => sql.includes(t));
  const DB = {
    prepare(sql) {
      const first = async (...values) => {
        if (/FROM sessions/.test(sql)) {
          return { member_id: "m1", org_id: orgId, email: "o@x.test", role: "admin", status: "active", expires_at: Date.now() + 3.6e6 };
        }
        if (/FROM site_catalog_state/.test(sql)) return db.state;
        if (/FROM site_settings/.test(sql)) return { site_id: SITE_ID };
        if (/FROM sites WHERE id=\?/.test(sql)) {
          if (values[0] !== SITE_ID) return null;
          if (/org_id=\?/.test(sql) && values[1] !== "org1") return null;
          return { id: SITE_ID, org_id: "org1", url: "example.com", site_key: "nrv_k", install_type: "wp", profile_token_hash: tokenHash, plan: "free" };
        }
        return null;
      };
      const statement = {
        bind(...values) {
          return {
            first: () => first(...values),
            async all() {
              const table = tableOf(sql);
              return { results: table ? db[table].filter((r) => r.site_id === values[0]).sort((a, b) => a.position - b.position) : [] };
            },
            async run() {
              const table = tableOf(sql);
              const statement = sql.trim();
              if (/^DELETE FROM/.test(statement) && table) db[table] = db[table].filter((r) => r.site_id !== values[0]);
              else if (/^INSERT INTO site_catalog_state/.test(statement)) {
                const [site_id, source, product_source, product_count, service_count, faq_count, page_count, updated_at] = values;
                db.state = { site_id, source, product_source, product_count, service_count, faq_count, page_count, updated_at };
              } else if (/^INSERT INTO/.test(statement) && table) {
                const columns = (sql.match(/\(site_id,position,([^)]*)\)/) || [])[1].split(",");
                const row = { site_id: values[0], position: values[1] };
                columns.forEach((c, i) => { row[c] = values[i + 2]; });
                db[table].push(row);
              }
              return { success: true };
            },
            sql, values,
          };
        },
        first, async all() { return { results: [] }; }, async run() { return { success: true }; },
      };
      return statement;
    },
    async batch(statements) { for (const s of statements) await s.run(); return []; },
  };
  return { DB, db, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp" };
}

const ctx = { waitUntil() {} };
const put = (env, body, token = TOKEN) => handleApi(
  new Request(`https://w.test/api/sites/${SITE_ID}/catalog`, {
    method: "PUT", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body),
  }), env, ctx);
const get = (env, token = TOKEN) => handleApi(
  new Request(`https://w.test/api/sites/${SITE_ID}/catalog`, { headers: { authorization: `Bearer ${token}` } }), env, ctx);

const hash = await sha256Hex(TOKEN);

const FULL = {
  product_source: "woocommerce",
  products: [
    { name: "Ethiopia Yirgacheffe", url: "https://x.test/p/1", sku: "ETH-1", price: "1800", currency: "jpy", in_stock: true, categories: ["Coffee", "Beans"] },
    { name: "Decaf", price: "1200", currency: "jpy", in_stock: false, categories: [] },
  ],
  services: [{ name: "カット", minutes: 45, price: "4500", currency: "JPY", category: "ヘア", reserve_url: "https://x.test/book" }],
  faqs: [{ question: "駐車場は？", answer: "3台あります。" }],
  pages: [{ title: "About", url: "https://x.test/about" }],
};

/* ---------------- a full sync lands ---------------- */

{
  const env = makeEnv(hash);
  const response = await put(env, FULL);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).written, { products: 2, services: 1, faqs: 1, pages: 1 });

  const body = await (await get(env)).json();
  assert.equal(body.products[0].name, "Ethiopia Yirgacheffe");
  assert.equal(body.products[0].currency, "JPY", "the currency is normalised");
  assert.deepEqual(body.products[0].categories, ["Coffee", "Beans"], "categories survive the round trip");
  assert.equal(body.products[0].in_stock, true);
  assert.equal(body.products[1].in_stock, false, "out of stock is not the same as unknown");
  assert.equal(body.services[0].minutes, 45, "the duration keeps its unit");
  assert.equal(body.services[0].reserve_url, "https://x.test/book", "the booking URL is the entered one");
  assert.equal(body.faqs[0].question, "駐車場は？");
  assert.equal(body.pages[0].title, "About");

  assert.equal(body.state.product_source, "woocommerce", "where the products came from is recorded");
  assert.equal(body.state.product_count, 2);
  assert.ok(body.state.updated_at, "with a time");
}

{
  // Order is the operator's, not the database's.
  const env = makeEnv(hash);
  await put(env, { pages: [{ title: "C" }, { title: "A" }, { title: "B" }] });
  const body = await (await get(env)).json();
  assert.deepEqual(body.pages.map((p) => p.title), ["C", "A", "B"], "the order sent is the order stored");
}

/* ---------------- a list not mentioned is left alone ---------------- */

{
  // The rule the profile learned the hard way. A sync carrying only products
  // must not empty the FAQ someone typed in.
  const env = makeEnv(hash);
  await put(env, FULL);
  await put(env, { products: [{ name: "Only product now" }] });
  const body = await (await get(env)).json();
  assert.equal(body.products.length, 1, "the list that was sent is replaced");
  assert.equal(body.faqs.length, 1, "the list that was not sent survives");
  assert.equal(body.services.length, 1, "and so does this one");
  assert.equal(body.pages.length, 1);
}

{
  // An empty list IS a statement: this shop has no products.
  const env = makeEnv(hash);
  await put(env, FULL);
  await put(env, { products: [], product_source: "none" });
  const body = await (await get(env)).json();
  assert.deepEqual(body.products, [], "an explicitly empty list clears that list");
  assert.equal(body.state.product_source, "none", "and says the shop is gone");
  assert.equal(body.faqs.length, 1, "without touching anything else");
}

{
  // Never synced is not the same as nothing to sync.
  const env = makeEnv(hash);
  const body = await (await get(env)).json();
  assert.equal(body.state, null, "no state row means the plugin has not synced");
  assert.deepEqual(body.products, []);
}

/* ---------------- replacement, not accumulation ---------------- */

{
  const env = makeEnv(hash);
  await put(env, { products: [{ name: "A" }, { name: "B" }] });
  await put(env, { products: [{ name: "C" }] });
  const body = await (await get(env)).json();
  assert.deepEqual(body.products.map((p) => p.name), ["C"], "a sync replaces rather than appends");
  assert.equal(body.state.product_count, 1, "and the count follows");
}

/* ---------------- rubbish in a list does not become a row ---------------- */

{
  const env = makeEnv(hash);
  await put(env, {
    products: [{ name: "" }, { name: "   " }, { url: "https://x.test/no-name" }, { name: "Real" }],
    faqs: [{ question: "Q", answer: "" }, { question: "", answer: "A" }, { question: "Q2", answer: "A2" }],
    services: [{ name: "Good" }, { minutes: 30 }],
  });
  const body = await (await get(env)).json();
  assert.deepEqual(body.products.map((p) => p.name), ["Real"], "an unnamed product is not a product");
  assert.deepEqual(body.faqs.map((f) => f.question), ["Q2"], "half a pair answers nothing");
  assert.deepEqual(body.services.map((v) => v.name), ["Good"], "an unnamed service is not a service");
}

{
  // A number where a flag belongs, a string where a list belongs.
  const env = makeEnv(hash);
  await put(env, { products: [{ name: "Odd", in_stock: "yes", categories: "Coffee", minutes: "lots" }] });
  const body = await (await get(env)).json();
  assert.equal(body.products[0].in_stock, null, "a non-boolean stock flag reads as unknown");
  assert.deepEqual(body.products[0].categories, [], "a non-list of categories is dropped");
}

{
  const env = makeEnv(hash);
  await put(env, { services: [{ name: "S", minutes: -5 }, { name: "T", minutes: "x" }] });
  const body = await (await get(env)).json();
  assert.equal(body.services[0].minutes, null, "a negative duration is not a duration");
  assert.equal(body.services[1].minutes, null, "nor is a word");
}

{
  // A catalogue is not a sitemap.
  const env = makeEnv(hash);
  await put(env, { pages: Array.from({ length: 250 }, (_, i) => ({ title: `p${i}` })) });
  const body = await (await get(env)).json();
  assert.equal(body.pages.length, 100, "the row cap is a cap");
}

{
  // Untrusted text is stored as text, and whitespace is collapsed.
  const env = makeEnv(hash);
  await put(env, { pages: [{ title: "  A\n\nB  ", url: "https://x.test/" }] });
  const body = await (await get(env)).json();
  assert.equal(body.pages[0].title, "A B", "newlines do not survive into a title");
}

/* ---------------- access control ---------------- */

{
  const env = makeEnv(hash);
  const wrong = await put(env, FULL, "nrvp_" + "b".repeat(64));
  assert.equal(wrong.status, 403, "another token cannot write this catalogue");
  assert.equal((await wrong.json()).error, "invalid_profile_token");
  assert.equal(env.db.site_products.length, 0, "and writes nothing");
}

{
  const env = makeEnv(hash);
  const noAuth = await handleApi(
    new Request(`https://w.test/api/sites/${SITE_ID}/catalog`, { method: "PUT", headers: { "content-type": "application/json" }, body: "{}" }),
    env, ctx);
  assert.equal(noAuth.status, 401, "the catalogue is not public");
}

{
  // The site key is printed into public markup, so it proves nothing here -
  // the same rule the profile sync follows.
  const env = makeEnv(hash);
  const siteKey = await put(env, FULL, "nrv_k");
  assert.equal(siteKey.status, 403, "a site key is not a write credential");
}

/* ---------------- the dashboard reads it through the member session ---------------- */

{
  const env = makeEnv(hash);
  await put(env, FULL);
  const response = await handleApi(new Request(`https://w.test/api/sites/${SITE_ID}`, { headers: SESSION }), env, ctx);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.catalog, "the site a member fetches carries its catalogue");
  assert.equal(body.catalog.products.length, 2);
  assert.equal(body.catalog.state.product_source, "woocommerce");
  // The profile is still there beside it.
  assert.ok(body.profile, "and the profile is unaffected");
}

{
  const env = makeEnv(hash, { orgId: "other-org" });
  await put(env, FULL);
  const response = await handleApi(new Request(`https://w.test/api/sites/${SITE_ID}`, { headers: SESSION }), env, ctx);
  assert.equal(response.status, 403, "another org cannot read this catalogue");
}

console.log("site catalog tests passed");
