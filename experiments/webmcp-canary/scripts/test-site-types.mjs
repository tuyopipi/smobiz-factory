/**
 * Site types: local (default) / ec (online shop) / b2b (B2B, SaaS, services).
 *
 *  1. Local regression: every golden diagnosis captured from main before site
 *     types existed is reproduced exactly, with no type and with "local".
 *  2. Typed diagnosis: what an online shop / B2B site is scored on, with the
 *     same weights, bands and gate.
 *  3. Output: OnlineStore / Organization, OfferCatalog, services, llms.txt -
 *     nothing fabricated.
 *  4. Storage and endpoints against real SQLite: the new schema, and the old
 *     schema (migration 0044 not applied yet) still working.
 *  5. Measurement questions per type in every measured language, unbranded.
 *  6. Off-site checklist per type; the Google Maps check only for local.
 *
 * No network: every fetch is stubbed.
 */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { LOCAL_FIXTURES } from "./fixtures/aeo-local-fixtures.mjs";
import { snapshot } from "./fixtures/generate-aeo-local-golden.mjs";
import { AEO_SCORE_WEIGHTS, diagnoseAeoUrl, extractAeoSignals, scoreAeo, buildAeoChecks, localizeAeoChecks } from "../worker/aeo-score.mjs";
import { DEFAULT_SCORING } from "../worker/aeo-rules.mjs";
import { normalizeSiteType, typedSchemaFields, siteRequirements, deepSchemaNodes } from "../worker/site-types.mjs";
import { productNode, serviceNode, typedBusinessType, typedCatalogNodes, typedLlmsTxt } from "../worker/site-type-output.mjs";
import { typedDiscoveryQuestions, typedQuestionTerms, TYPED_QUESTION_LANGUAGES } from "../worker/sov-site-type.mjs";
import { buildBrandProfile, buildQuestionSet, brandedControlQuestions, profileIdentity, SOV_LANGUAGES } from "../worker/aeo-sov.mjs";
import { manualChecklist, runOffsiteAudit } from "../worker/offsite-audit.mjs";
import { handleApi, buildJsonLd, diagnosticOptions, loadSiteType } from "../worker/api.mjs";
import { INITIAL_AEO_RULESET } from "../worker/aeo-rules.mjs";

/* ================================================================== *
 * 1. Local regression against golden output from main
 * ================================================================== */
{
  const golden = JSON.parse(readFileSync(new URL("./fixtures/aeo-local.golden.json", import.meta.url), "utf8"));
  assert.equal(Object.keys(golden).length, LOCAL_FIXTURES.length, "every fixture has a golden result");
  for (const fixture of LOCAL_FIXTURES) {
    for (const siteType of [undefined, null, "", "local", "LOCAL", "restaurant"]) {
      const signals = extractAeoSignals(fixture.html, fixture.robots, fixture.llms, { ...fixture.options, siteType });
      assert.deepEqual(JSON.parse(JSON.stringify(snapshot(signals))), golden[fixture.id], `${fixture.id} (siteType ${JSON.stringify(siteType)}) is scored exactly as on main`);
      assert.equal(signals.siteRequirements, undefined, "a local diagnosis carries no site requirements");
    }
  }
  assert.deepEqual(AEO_SCORE_WEIGHTS, { schema: 30, coverage: 25, legibility: 20, llms: 15, consistency: 10 }, "weights unchanged");
  assert.equal(normalizeSiteType("ec"), "ec");
  assert.equal(normalizeSiteType("b2b"), "b2b");
  assert.equal(normalizeSiteType("anything"), "local");
}

/* ================================================================== *
 * 2. Typed diagnosis
 * ================================================================== */
const robotsOk = ["OAI-SearchBot", "ChatGPT-User", "PerplexityBot"].map((bot) => `User-agent: ${bot}\nAllow: /`).join("\n\n");
const ld = (value) => `<script type="application/ld+json">${JSON.stringify(value)}</script>`;
const shopNodes = [
  { "@context": "https://schema.org", "@type": "OnlineStore", "@id": "https://tea.example/#organization", name: "Tea Shop", url: "https://tea.example/", email: "hi@tea.example",
    hasMerchantReturnPolicy: { "@type": "MerchantReturnPolicy", merchantReturnLink: "https://tea.example/returns" }, hasOfferCatalog: { "@id": "https://tea.example/#offer-catalog" } },
  { "@type": "WebSite", name: "Tea Shop", url: "https://tea.example/" },
  { "@type": "OfferCatalog", "@id": "https://tea.example/#offer-catalog", itemListElement: [
    { "@type": "Product", name: "Sencha", image: "https://tea.example/s.jpg", offers: { "@type": "Offer", price: "1200", priceCurrency: "JPY", availability: "https://schema.org/InStock" } },
  ] },
  { "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "Shipping?", acceptedAnswer: { "@type": "Answer", text: "3 days." } }] },
];
const shopHtml = `<!doctype html><html><head><title>Tea Shop</title></head><body><h1>Tea Shop</h1><h2>Green tea</h2>
<p>Sencha ¥1,200 (税込). 送料無料 over ¥5,000. Updated ${new Date().getUTCFullYear()}.</p>
<footer><a href="/returns">返品・交換について</a> <a href="/shipping">配送・送料</a> <a href="/contact">お問い合わせ</a> <a href="/law">特定商取引法に基づく表記</a></footer>
${ld({ "@context": "https://schema.org", "@graph": shopNodes })}</body></html>`;
const shopLlms = "# Tea Shop\n\n> Japanese green tea.\n\n## Shop information\n- Website: https://tea.example/\n- Returns and refunds: https://tea.example/returns\n\n## Products\n- [Sencha](https://tea.example/p/sencha) — JPY 1200 · in stock\n";
{
  const signals = extractAeoSignals(shopHtml, robotsOk, shopLlms, { llmsPresent: true, siteType: "ec" });
  assert.equal(signals.siteType, "ec");
  const families = new Set(signals.schemaFields.map((f) => f.entityType));
  assert.ok(!families.has("LocalBusiness"), "an online shop is not asked for LocalBusiness");
  assert.ok(!signals.schemaFields.some((f) => ["address", "telephone", "openingHoursSpecification", "geo"].includes(f.field)), "no address / phone / hours / geo requirement");
  assert.ok(signals.schemaFields.every((f) => f.present), "a complete shop meets every typed field (nested products included)");
  assert.deepEqual(signals.siteRequirements.map((r) => [r.id, r.present]), [["product_offers", true], ["return_policy", true], ["shipping_policy", true], ["contact", true]]);
  assert.equal(signals.siteRequirements.find((r) => r.id === "return_policy").via, "schema", "credited with the reason");
  const result = scoreAeo(signals);
  assert.equal(result.gatePassed, true);
  assert.equal(result.statuses.coverage, "OK");
  assert.ok(result.score >= 80, `a complete shop scores green (${result.score})`);
  // The gate is untouched: blocking AI search still caps at 15.
  const blocked = scoreAeo(extractAeoSignals(shopHtml, "User-agent: OAI-SearchBot\nDisallow: /", shopLlms, { llmsPresent: true, siteType: "ec" }));
  assert.equal(blocked.score, Math.min(blocked.score, DEFAULT_SCORING.gateCap));
  assert.equal(blocked.gatePassed, false);

  // Missing pieces are named.
  const bare = extractAeoSignals(`<h1>Tea</h1>${ld({ "@type": "OnlineStore", name: "Tea", url: "https://tea.example/" })}`, robotsOk, "", { siteType: "ec" });
  const missing = bare.schemaFields.filter((f) => !f.present).map((f) => `${f.entityType}.${f.field}`);
  for (const key of ["Organization.contactPoint", "Organization.hasMerchantReturnPolicy", "Product.offers.price", "Product.offers.availability"]) assert.ok(missing.includes(key), `${key} reported missing`);
  assert.ok(bare.siteRequirements.every((r) => !r.present), "no policy pages, no products, no contact");
  assert.equal(scoreAeo(bare).statuses.coverage, "BAD");
  // The synced catalogue counts for product offers, the role pages for policies.
  const withCatalog = siteRequirements({ siteType: "ec", html: "", nodes: [], catalog: { products: [{ name: "Sencha", price: "1200", in_stock: true }], pages: [{ role: "return_policy", url: "https://tea.example/r" }] } });
  assert.deepEqual(withCatalog.filter((r) => r.present).map((r) => [r.id, r.via]), [["product_offers", "catalog"], ["return_policy", "page_role"]]);
  assert.ok(!siteRequirements({ siteType: "ec", catalog: { products: [{ name: "X", price: "", in_stock: true }] } })[0].present, "a product without a price does not count");

  // Checks carry the requirements, localised; local checks carry none.
  const checks = buildAeoChecks(signals, result, "ja");
  const coverage = checks.find((c) => c.id === "coverage");
  assert.equal(coverage.requirements.length, 4);
  assert.match(coverage.requirements[1].label, /返品/);
  assert.match(localizeAeoChecks(checks, "en").find((c) => c.id === "coverage").requirements[1].label, /Return and refund policy page/);
  assert.match(localizeAeoChecks(checks, "de").find((c) => c.id === "coverage").requirements[1].label, /Rückgabe/);
  assert.equal(localizeAeoChecks(checks, "pl").find((c) => c.id === "coverage").requirements[1].howTo.length > 0, true, "an unwritten language reads English");
  const fieldLabel = localizeAeoChecks(checks, "ja").find((c) => c.id === "schema").fields.find((f) => f.field === "hasMerchantReturnPolicy").label;
  assert.match(fieldLabel, /返品ポリシー/);
}
{
  const saasNodes = [
    { "@type": "Organization", "@id": "https://hr.example/#organization", name: "HR Cloud", url: "https://hr.example/", description: "Payroll software.", logo: "https://hr.example/logo.png",
      contactPoint: { "@type": "ContactPoint", email: "sales@hr.example" }, sameAs: ["https://www.linkedin.com/company/hrcloud"] },
    { "@type": "SoftwareApplication", name: "HR Cloud Payroll", description: "Payroll for SMEs.", applicationCategory: "BusinessApplication", provider: { "@id": "https://hr.example/#organization" } },
    { "@type": "WebSite", name: "HR Cloud", url: "https://hr.example/" },
  ];
  const html = `<h1>HR Cloud</h1><h2>Payroll</h2><p>給与計算サービス。料金プランと導入事例をご覧ください。お問い合わせ・資料請求はこちら。</p>
<nav><a href="/pricing">料金</a> <a href="/cases">導入事例</a> <a href="/company">会社概要</a></nav>${ld({ "@graph": saasNodes })}`;
  const signals = extractAeoSignals(html, robotsOk, "# HR Cloud\n\n## Services\n- Payroll — 料金 https://hr.example/pricing\n", { llmsPresent: true, siteType: "b2b" });
  const families = new Set(signals.schemaFields.map((f) => f.entityType));
  assert.ok(families.has("SoftwareApplication") && !families.has("Service") && !families.has("LocalBusiness"), "software is judged as software, never as a local business");
  assert.deepEqual(signals.siteRequirements.map((r) => r.present), [true, true, true, true]);
  assert.equal(signals.schemaFields.filter((f) => !f.present).map((f) => f.field).join(","), "mainEntity", "only the FAQ is missing");
  const services = typedSchemaFields([{ "@type": "Organization", name: "Firm", url: "https://f.example" }], "b2b");
  assert.ok(services.some((f) => f.entityType === "Service" && !f.present), "a B2B site with no services is told so");
  assert.deepEqual(deepSchemaNodes({ "@graph": [{ "@type": "A", x: { "@type": "B" } }] }).map((n) => n["@type"]), ["A", "B"]);
}
{
  // diagnoseAeoUrl passes the type through and reports it; a local result keeps its shape.
  const fetchImpl = async (url, init = {}) => {
    if (init.method === "HEAD") return new Response(null, { status: 200 });
    const href = String(url);
    if (href.endsWith("/robots.txt")) return new Response(robotsOk);
    if (href.endsWith("/llms.txt")) return new Response(shopLlms);
    return new Response(shopHtml, { headers: { "content-type": "text/html" } });
  };
  const typed = await diagnoseAeoUrl("https://tea.example/", { fetchImpl, siteType: "ec" });
  assert.equal(typed.siteType, "ec");
  assert.ok(typed.checks.find((c) => c.id === "coverage").requirements);
  const local = await diagnoseAeoUrl("https://tea.example/", { fetchImpl });
  assert.equal("siteType" in local, false, "a local result has no siteType key");
}

/* ================================================================== *
 * 3. Output: nothing fabricated
 * ================================================================== */
{
  assert.equal(typedBusinessType("ec", "HairSalon"), "OnlineStore");
  assert.equal(typedBusinessType("ec", "OnlineBusiness"), "OnlineBusiness");
  assert.equal(typedBusinessType("b2b", "LegalService"), "LegalService");
  assert.equal(typedBusinessType("b2b", "Restaurant"), "Organization");
  const bare = productNode({ name: "Gift box", price: "", in_stock: null });
  assert.deepEqual(bare, { "@type": "Product", name: "Gift box" }, "no price, no Offer; nothing else invented");
  const full = productNode({ name: "Sencha", url: "https://t.example/p", sku: "S1", price: "1200", currency: "jpy", in_stock: false, brand: "Uji", rating_value: "4.6", review_count: 12, image: "https://t.example/s.jpg" });
  assert.equal(full.offers.availability, "https://schema.org/OutOfStock");
  assert.equal(full.offers.priceCurrency, "JPY");
  assert.deepEqual(full.aggregateRating, { "@type": "AggregateRating", ratingValue: 4.6, reviewCount: 12 });
  assert.equal(productNode({ name: "X", rating_value: "4.6", review_count: 0 }).aggregateRating, undefined, "a rating needs reviews");
  assert.equal(productNode({ name: "X", rating_value: "9", review_count: 3 }).aggregateRating, undefined, "and must be on the 5-point scale");
  const software = serviceNode({ name: "Payroll", kind: "software", category: "BusinessApplication", description: "For SMEs" }, { id: "x#s1", providerId: "x#organization" });
  assert.equal(software["@type"], "SoftwareApplication");
  assert.equal(software.applicationCategory, "BusinessApplication");
  assert.equal(serviceNode({ name: "Audit" }).description, undefined);
  const ec = typedCatalogNodes({ siteType: "ec", base: "https://t.example/", businessId: "https://t.example/#organization",
    catalog: { products: [{ name: "Sencha", price: "1200", currency: "JPY", in_stock: true }], pages: [{ role: "return_policy", url: "https://t.example/returns" }] } });
  assert.equal(ec.nodes[0]["@type"], "OfferCatalog");
  assert.equal(ec.businessProps.hasOfferCatalog["@id"], "https://t.example/#offer-catalog");
  assert.deepEqual(ec.businessProps.hasMerchantReturnPolicy, { "@type": "MerchantReturnPolicy", merchantReturnLink: "https://t.example/returns" });
  assert.deepEqual(typedCatalogNodes({ siteType: "ec", base: "https://t.example/", catalog: { products: [] } }), { nodes: [], businessProps: {} }, "an empty shop publishes no catalogue");
  const b2b = typedCatalogNodes({ siteType: "b2b", base: "https://f.example/", businessId: "https://f.example/#organization", catalog: { services: [{ name: "Audit", description: "Annual audit." }] } });
  assert.equal(b2b.nodes[0]["@type"], "Service");
  assert.deepEqual(b2b.nodes[0].provider, { "@id": "https://f.example/#organization" });

  const llmsEc = typedLlmsTxt({ siteType: "ec", lang: "ja", values: { name: "Tea", url: "tea.example", email: "hi@tea.example" },
    catalog: { products: [{ name: "Sencha", url: "https://tea.example/p", price: "1200", currency: "JPY", in_stock: true }], pages: [{ role: "shipping_policy", url: "https://tea.example/ship" }] }, crawlerNames: "- OAI-SearchBot" });
  assert.match(llmsEc, /^# Tea/);
  assert.match(llmsEc, /## ショップ情報\n- サイト: https:\/\/tea\.example\/\n- メール: hi@tea\.example\n- 配送・送料: https:\/\/tea\.example\/ship/);
  assert.match(llmsEc, /## 商品\n- \[Sencha\]\(https:\/\/tea\.example\/p\) — JPY 1200 · 在庫あり/);
  assert.ok(!/営業時間|住所/.test(llmsEc), "no hours or address lines when none are held");
  const llmsB2b = typedLlmsTxt({ siteType: "b2b", lang: "en", values: { name: "Firm", url: "https://f.example" }, catalog: { services: [{ name: "Audit", description: "Annual audit." }] } });
  assert.match(llmsB2b, /## Services\n- Audit — Annual audit\./);
}

/* ================================================================== *
 * 4. Storage and endpoints, real SQLite
 * ================================================================== */
const sqlFile = (file) => readFileSync(new URL(`../nurevo-impl/db/${file}`, import.meta.url), "utf8");
const TOKEN = "nrvp_" + "a".repeat(64);
const CSRF = "c".repeat(64);
const sha = async (v) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v)))].map((b) => b.toString(16).padStart(2, "0")).join("");
async function makeEnv({ schema = sqlFile("schema.sql") } = {}) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(schema);
  for (const file of ["0013_aeo_rulesets.sql", "0016_aeo_learning.sql", "0032_continuous_optimization.sql"]) { try { sqlite.exec(sqlFile(file)); } catch { /* already in schema */ } }
  sqlite.exec(`INSERT INTO orgs(id) VALUES('o1');
    INSERT INTO members(id,org_id,email,role,status) VALUES('m1','o1','o@x.test','admin','active');
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,created_at,profile_token_hash) VALUES('s1','o1','tea.example','https://tea.example/','k1','wp','free',1,'${await sha(TOKEN)}');
    INSERT INTO site_settings(site_id,name,address,tel,hours,serve_schema,allow_crawlers) VALUES('s1','Tea Shop','東京都渋谷区1-1','03-1234-5678','Mo-Fr 10:00-18:00',1,1);
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${await sha("sess")}','m1','o1','session',${Date.now() + 3.6e6});`);
  const DB = {
    prepare(text) {
      const wrap = (args) => ({
        async first() { return sqlite.prepare(text).get(...args) || null; },
        async all() { return { results: sqlite.prepare(text).all(...args) }; },
        async run() { return { meta: sqlite.prepare(text).run(...args) }; },
      });
      return { ...wrap([]), bind: (...args) => wrap(args) };
    },
    async batch(statements) {
      sqlite.exec("BEGIN");
      try { const out = []; for (const s of statements) out.push(await s.run()); sqlite.exec("COMMIT"); return out; } catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    },
  };
  const kv = new Map();
  return { sqlite, env: { DB, WEBMCP_KV: { async get(k) { return kv.get(k) ?? null; }, async put(k, v) { kv.set(k, v); } }, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp" } };
}
const ctx = { waitUntil() {} };
const bearer = (env, path, method, body) => handleApi(new Request(`https://w.test${path}`, { method, headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) }), env, ctx);
const member = (env, path, method = "GET", body = null) => handleApi(new Request(`https://w.test${path}`, {
  method, headers: { cookie: `nrv_session=sess; nrv_csrf=${CSRF}`, "x-csrf-token": CSRF, origin: "https://nurevo.jp", "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}),
}), env, ctx);
const CATALOG = {
  product_source: "woocommerce",
  products: [{ name: "Sencha", url: "https://tea.example/p/sencha", price: "1200", currency: "jpy", in_stock: true, categories: ["緑茶"], brand: "Uji", rating_value: 4.5, review_count: 0 }],
  services: [{ name: "Payroll Cloud", description: "Payroll for SMEs.", url: "https://tea.example/payroll", kind: "software", category: "給与計算" }],
  pages: [{ title: "Returns", url: "https://tea.example/returns", role: "return_policy" }, { title: "About", url: "https://tea.example/about", role: "bogus" }],
};
{
  const { env, sqlite } = await makeEnv();
  assert.equal(await loadSiteType(env, "s1"), "local", "an untouched site is local");
  // The catalogue keeps the new columns, and drops a rating with no reviews.
  assert.equal((await bearer(env, "/api/sites/s1/catalog", "PUT", CATALOG)).status, 200);
  const product = sqlite.prepare("SELECT * FROM site_products WHERE site_id='s1'").get();
  assert.equal(product.brand, "Uji");
  assert.equal(product.rating_value, null, "a rating without reviews is not stored");
  assert.equal(sqlite.prepare("SELECT kind FROM site_services").get().kind, "software");
  assert.deepEqual(sqlite.prepare("SELECT role FROM site_pages ORDER BY position").all().map((r) => r.role), ["return_policy", null], "unknown roles are dropped");

  // A local site's output is unchanged by any of this.
  const localSnippet = await (await member(env, "/api/sites/s1/static-snippet")).json();
  assert.equal(localSnippet.jsonld["@type"], "LocalBusiness");
  assert.ok(localSnippet.jsonld.telephone && localSnippet.jsonld_nodes.every((n) => n["@type"] !== "OfferCatalog"));

  // The plugin's profile sync carries the type; an invalid one is refused.
  const put = await (await bearer(env, "/api/sites/s1/profile", "PUT", { name: "Tea Shop", site_type: "ec" })).json();
  assert.deepEqual(put.site_type_result, { ok: true, site_type: "ec" });
  assert.equal((await (await bearer(env, "/api/sites/s1/profile", "GET")).json()).site_type, "ec");
  assert.equal((await (await bearer(env, "/api/sites/s1/profile", "PUT", { site_type: "spaceship" })).json()).site_type_result.error, "invalid_site_type");
  assert.equal(await loadSiteType(env, "s1"), "ec", "and the stored type is unchanged");

  // The online shop's output: OnlineStore, no hours / geo, the catalogue.
  const snippet = await (await member(env, "/api/sites/s1/static-snippet?lang=en")).json();
  assert.equal(snippet.jsonld["@type"], "OnlineStore");
  assert.ok(!("openingHours" in snippet.jsonld) && !("openingHoursSpecification" in snippet.jsonld) && !("geo" in snippet.jsonld));
  assert.equal(snippet.jsonld.telephone, "03-1234-5678", "a phone number the owner entered is still published");
  assert.equal(snippet.jsonld.hasMerchantReturnPolicy.merchantReturnLink, "https://tea.example/returns");
  const catalogNode = snippet.jsonld_nodes.find((n) => n["@type"] === "OfferCatalog");
  assert.equal(catalogNode.itemListElement[0].offers.availability, "https://schema.org/InStock");
  assert.equal(catalogNode.itemListElement[0].aggregateRating, undefined);
  assert.match(snippet.llms_txt, /## Shop information/);
  assert.match(snippet.llms_txt, /## Products\n- \[Sencha\]/);
  const settings = sqlite.prepare("SELECT * FROM site_settings WHERE site_id='s1'").get();
  assert.equal(buildJsonLd({ url: "tea.example", website_uri: "https://tea.example/" }, settings, INITIAL_AEO_RULESET)["@type"], "OnlineStore");

  // The diagnosis is told the type; a local site's options are unchanged.
  assert.equal((await diagnosticOptions(env, "s1")).siteType, "ec");

  // The dashboard reads and writes the type.
  const detail = await (await member(env, "/api/sites/s1")).json();
  assert.equal(detail.site_type, "ec");
  assert.equal((await member(env, "/api/sites/s1", "PUT", { site_type: "nope", serve_schema: true })).status, 400);
  const saved = await (await member(env, "/api/sites/s1", "PUT", { site_type: "b2b", serve_schema: true, allow_crawlers: true })).json();
  assert.deepEqual(saved.site_type_result, { ok: true, site_type: "b2b" });
  const b2bSnippet = await (await member(env, "/api/sites/s1/static-snippet")).json();
  assert.equal(b2bSnippet.jsonld["@type"], "Organization");
  assert.equal(b2bSnippet.jsonld_nodes.find((n) => n["@type"] === "SoftwareApplication").description, "Payroll for SMEs.");
  assert.match(b2bSnippet.llms_txt, /## サービス/);
  await member(env, "/api/sites/s1", "PUT", { site_type: "local", serve_schema: true, allow_crawlers: true });
  assert.equal(await loadSiteType(env, "s1"), "local");
  assert.equal("siteType" in await diagnosticOptions(env, "s1"), false, "a local site's diagnosis options carry no type");
}
{
  // Before migration 0044: the old schema still syncs, reads and serves.
  const { env, sqlite } = await makeEnv();
  // Drop exactly what 0044 adds, which is the database production has today.
  for (const [table, column] of [["site_settings", "site_type"], ["site_products", "brand"], ["site_products", "image"], ["site_products", "rating_value"],
    ["site_products", "review_count"], ["site_services", "description"], ["site_services", "url"], ["site_services", "kind"], ["site_pages", "role"]]) {
    sqlite.exec(`ALTER TABLE ${table} DROP COLUMN ${column}`);
  }
  assert.equal((await bearer(env, "/api/sites/s1/catalog", "PUT", CATALOG)).status, 200, "a catalogue sync still lands");
  assert.equal(sqlite.prepare("SELECT name FROM site_products").get().name, "Sencha");
  assert.equal((await (await bearer(env, "/api/sites/s1/catalog", "GET")).json()).products[0].name, "Sencha");
  const put = await (await bearer(env, "/api/sites/s1/profile", "PUT", { name: "Tea Shop", site_type: "ec" })).json();
  assert.equal(put.ok, true, "the profile write itself succeeds");
  assert.equal(put.site_type_result.error, "migration_pending");
  assert.equal(await loadSiteType(env, "s1"), "local");
  assert.equal((await member(env, "/api/sites/s1/static-snippet")).status, 200);
  // And the migration applies on top of it.
  sqlite.exec(sqlFile("0044_site_types.sql"));
  assert.equal((await (await bearer(env, "/api/sites/s1/profile", "PUT", { site_type: "ec" })).json()).site_type_result.ok, true);
}

/* ================================================================== *
 * 5. Measurement questions
 * ================================================================== */
{
  assert.deepEqual([...TYPED_QUESTION_LANGUAGES].sort(), [...SOV_LANGUAGES].sort(), "every measured language has typed templates");
  const catalog = { products: [{ categories: ["緑茶"] }, { categories: ["緑茶", "Uncategorized"] }, { categories: ["ほうじ茶"] }],
    services: [{ category: "勤怠管理", kind: "software" }] };
  for (const language of SOV_LANGUAGES) {
    for (const siteType of ["ec", "b2b"]) {
      const settings = { name: "Acme 茶舗", business_type: siteType === "b2b" ? "勤怠管理システム" : "", site_type: siteType, catalog, language };
      const profile = buildBrandProfile({ site: { website_uri: "https://acme-tea.example/" }, settings });
      assert.equal(profile.siteType, siteType);
      const questions = buildQuestionSet(profile);
      assert.equal(questions.length, 10, `${language}/${siteType}: ten questions`);
      assert.equal(new Set(questions).size, 10, "all different");
      for (const q of questions) {
        assert.ok(!q.includes("Acme") && !q.includes("acme-tea"), `${language}/${siteType}: no business name in "${q}"`);
        assert.ok(!/undefined|null|\$\{/.test(q), `no template leak in "${q}"`);
      }
      assert.ok(brandedControlQuestions(profile, 3).every((q) => q.kind === "branded" && q.text.includes("Acme")), "branded controls name the brand");
    }
  }
  const ja = buildQuestionSet(buildBrandProfile({ site: { website_uri: "https://t.example/" }, settings: { name: "Tea", site_type: "ec", catalog } }));
  assert.equal(ja[0], "緑茶のおすすめ通販サイトは？", "the shop's most common category");
  assert.equal(ja[1], "緑茶でおすすめのブランドを教えて。");
  const jaB2b = buildQuestionSet(buildBrandProfile({ site: { website_uri: "https://h.example/" }, settings: { name: "HR", business_type: "勤怠管理システム", site_type: "b2b", catalog } }));
  assert.equal(jaB2b[0], "勤怠管理におすすめのツールは？");
  assert.equal(jaB2b[1], "勤怠管理システムを比較して。主な選択肢を教えて。");
  // A category that names the brand is not used.
  assert.equal(typedQuestionTerms({ siteType: "ec", catalog: { products: [{ categories: ["Acme Originals"] }] }, aliases: ["Acme"] }).category, "");
  assert.equal(typedDiscoveryQuestions({ siteType: "ec", language: "en" })[0], "What are the best online shops for popular products?", "neutral fallback when nothing is known");
  assert.equal(typedDiscoveryQuestions({ siteType: "local" }), null);
  // A local profile and its identity are exactly as before.
  const local = buildBrandProfile({ site: { website_uri: "https://cafe.example/" }, settings: { name: "栞珈琲", business_type: "喫茶店", address: "東京都渋谷区神宮前1-2-3" } });
  assert.equal("siteType" in local, false);
  assert.deepEqual(Object.keys(profileIdentity(local)), ["name", "businessType", "locality", "host", "aliases"]);
  assert.equal(buildQuestionSet(local)[0], "渋谷区の喫茶店でおすすめはどこ？");
  const typedIdentity = profileIdentity(buildBrandProfile({ site: { website_uri: "https://t.example/" }, settings: { name: "Tea", site_type: "ec", catalog } }));
  assert.equal(typedIdentity.siteType, "ec", "a typed site starts its own trend series");
}

/* ================================================================== *
 * 6. Off-site checklist
 * ================================================================== */
{
  const local = manualChecklist({ name: "Cafe" });
  assert.ok(local.some((i) => i.id === "bing") && !local.some((i) => i.id === "rakuten"), "local checklist unchanged");
  assert.deepEqual(manualChecklist({ name: "Cafe" }, { siteType: "local" }), local);
  const ec = manualChecklist({ name: "Tea Shop" }, { siteType: "ec" });
  assert.deepEqual(ec.map((i) => i.id), ["rakuten", "amazon", "yahoo_shopping", "merchant_center"]);
  const b2b = manualChecklist({ name: "HR Cloud" }, { siteType: "b2b" });
  assert.deepEqual(b2b.map((i) => i.id), ["itreview", "boxil", "g2", "capterra", "linkedin", "crunchbase", "wantedly"]);
  for (const item of [...ec, ...b2b]) {
    assert.equal(item.kind, "manual");
    assert.ok(item.verify.length >= 3 && item.steps.length >= 1, `${item.id} says what to verify and how`);
    assert.ok(/^https:\/\//.test(item.links.check) && /^https:\/\//.test(item.links.manage), `${item.id} links over https`);
  }
  assert.match(ec[0].links.check, /search\.rakuten\.co\.jp.*Tea%20Shop/);
  assert.match(b2b[2].links.check, /site%3Ag2\.com%20HR%20Cloud/);
  // No Google Maps check (and no Places call) for a typed site.
  const { env, sqlite } = await makeEnv();
  sqlite.exec("UPDATE site_settings SET site_type='ec' WHERE site_id='s1'");
  sqlite.exec(sqlFile("0042_offsite_listing_audit.sql").replace(/CREATE TABLE IF NOT EXISTS/g, "CREATE TABLE IF NOT EXISTS"));
  let called = 0;
  const result = await runOffsiteAudit({ ...env, GOOGLE_MAPS_API_KEY: "test" }, "s1", { fetchImpl: async () => { called += 1; return new Response("{}"); } });
  assert.equal(called, 0, "no Places call for an online shop");
  assert.equal(result.sources[0].status, "not_applicable");
  assert.deepEqual(result.manual.map((i) => i.id), ec.map((i) => i.id));
  assert.equal(result.id, null, "nothing is stored");
}

assert.ok(readFileSync(new URL("./build-plugin-zip.mjs", import.meta.url), "utf8").includes('"includes/site-types.php"'), "the plugin zip ships includes/site-types.php");

console.log("site type tests passed (local regression vs main golden, ec/b2b diagnosis, output without fabrication, storage before/after 0044, questions in every measured language, off-site checklists)");
