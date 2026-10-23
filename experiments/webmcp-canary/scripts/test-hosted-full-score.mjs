// A paid site that is not on WordPress can reach a full score.
//
// The scorer always reads WebSite, FAQPage and Organization.sameAs beside the
// business node. Hosted, tag and static output used to publish the business
// node alone, so a Standard hosted store with every fact entered could not
// reach 100. These run the real hosted page through the real diagnosis.
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { companionNodes, diagnosticOptions, handleApi } from "../worker/api.mjs";
import { diagnoseAeoUrl, extractSchemaNodes } from "../worker/aeo-score.mjs";

const dir = new URL("../nurevo-impl/db/", import.meta.url);
const sqlite = new DatabaseSync(":memory:");
sqlite.exec(readFileSync(new URL("schema.sql", dir), "utf8"));
for (const file of readdirSync(dir).filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort()) {
  for (const stmt of readFileSync(new URL(file, dir), "utf8").split(/;\s*\n/)) {
    try { if (stmt.trim()) sqlite.exec(stmt); } catch (error) { if (!/duplicate column/.test(error.message)) throw error; }
  }
}
const wrap = (sql, args) => ({
  async first() { return sqlite.prepare(sql).get(...args) || null; },
  async all() { return { results: sqlite.prepare(sql).all(...args) }; },
  async run() { return { meta: sqlite.prepare(sql).run(...args) }; },
});
const DB = { prepare(sql) { return { ...wrap(sql, []), bind: (...args) => wrap(sql, args) }; }, async batch(list) { for (const s of list) await s.run(); } };
const env = { DB };
const ctx = { waitUntil() {} };

const UPDATED = Date.now() - 86400000;
sqlite.exec(`INSERT INTO orgs(id) VALUES('o1');
  INSERT INTO sites(id,org_id,url,website_uri,slug,site_key,install_type,plan,created_at,delivery_status) VALUES
    ('h1','o1','','https://shiori-coffee.example/','shiori','k_h1','hosted','standard',1,'active'),
    ('h2','o1','','','bare','k_h2','hosted','standard',2,'active');`);
const settings = (id) => sqlite.prepare(`INSERT INTO site_settings(site_id,name,business_type,business_type_schema,address,hours,tel,lat,lng,price_level,description,email,serve_schema,allow_crawlers,updated_at)
  VALUES(?,?,?,?,?,?,?,?,?,?,?,?,1,1,?)`).run(id, "栞珈琲", "喫茶店", "CafeOrCoffeeShop", "東京都千代田区神田三崎町3-2-6", "火-日 11:00-20:00", "03-1234-5678", 35.6997, 139.7536, "PRICE_LEVEL_MODERATE", "神田の自家焙煎コーヒー店", "hello@shiori-coffee.example", UPDATED);
settings("h1"); settings("h2");
sqlite.prepare("INSERT INTO aeo_harvested_facts(site_id,same_as_json,observed_at,source_url) VALUES(?,?,?,?)").run("h1", JSON.stringify(["https://www.instagram.com/shiori_coffee"]), new Date().toISOString(), "https://shiori-coffee.example/");
for (const [i, [q, a]] of [["予約はできますか？", "はい、電話で承ります。"], ["Wi-Fiはありますか？", "無料Wi-Fiがあります。"]].entries()) {
  sqlite.prepare("INSERT INTO site_faqs(site_id,position,question,answer) VALUES(?,?,?,?)").run("h1", i, q, a);
}

// Every request the diagnosis makes - the page, robots.txt, llms.txt, the
// edge probe - is answered by the worker itself, as nurevo.jp would.
const fetchImpl = async (url, init = {}) => {
  if (init.method === "HEAD") return new Response(null, { status: 200 });
  const res = await handleApi(new Request(String(url), { headers: { "user-agent": "OAI-SearchBot/1.0" } }), env, ctx);
  return res || new Response("not found", { status: 404 });
};

/* ---------------- a complete Standard hosted store scores 100 ---------------- */
{
  const page = await (await fetchImpl("https://nurevo.jp/s/shiori")).text();
  const types = extractSchemaNodes(page).map((n) => n["@type"]);
  assert.deepEqual(types, ["CafeOrCoffeeShop", "WebSite", "Organization", "FAQPage"], "business node plus the companions");
  // Google's FAQ rule: the FAQ marked up is visible on the page.
  assert.ok(page.includes("<h3>予約はできますか？</h3>") && page.includes("無料Wi-Fiがあります。"), "the FAQ is rendered visibly");
  const result = await diagnoseAeoUrl("https://nurevo.jp/s/shiori", { ...(await diagnosticOptions(env, "h1")), fetchImpl });
  const missing = result.structuredData.fields.filter((f) => !f.present).map((f) => `${f.entityType}.${f.field}`);
  assert.deepEqual(missing, [], "every scored property is met");
  assert.deepEqual(result.checks.filter((c) => c.status !== "OK").map((c) => c.id), [], "every check passes");
  assert.equal(result.score, 100, `a complete Standard hosted store reaches 100 (got ${result.score})`);
}

/* ---------------- no links, no FAQ: the exact residual ---------------- */
{
  // Without official/social links or FAQs there is nothing true to publish for
  // Organization.sameAs or FAQPage, so those two criteria stay unmet.
  const result = await diagnoseAeoUrl("https://nurevo.jp/s/bare", { ...(await diagnosticOptions(env, "h2")), fetchImpl });
  const missing = result.structuredData.fields.filter((f) => !f.present).map((f) => `${f.entityType}.${f.field}`);
  assert.deepEqual(missing.sort(), ["FAQPage.mainEntity", "Organization.sameAs"]);
  // Exact residual: schema 11/13 of 30 (-4.6) and legibility WARN (-10): with
  // no visible FAQ and no official link shown, the page itself says less.
  assert.deepEqual(result.checks.filter((c) => c.status !== "OK").map((c) => c.id), ["legibility"]);
  assert.equal(result.score, 85, `residual: ${result.score}`);
}

/* ---------------- static and tag output: WebSite always, FAQPage never ---------------- */
{
  const site = { id: "h1", url: "", website_uri: "https://shiori-coffee.example/" };
  const nodes = companionNodes(site, { name: "栞珈琲", same_as: ["https://www.instagram.com/shiori_coffee", "javascript:alert(1)"] }, { faqs: [{ question: "Q", answer: "A" }] });
  assert.deepEqual(nodes.map((n) => n["@type"]), ["WebSite", "Organization"], "no FAQPage unless the caller shows it");
  assert.deepEqual(nodes[1].sameAs, ["https://www.instagram.com/shiori_coffee"], "only http(s) links");
  assert.equal(nodes[1]["@id"], "https://shiori-coffee.example/#organization", "the same entity as the business node");
  assert.deepEqual(companionNodes(site, { name: "x" }).map((n) => n["@type"]), ["WebSite"], "WebSite even with no links");

  const cfg = await (await handleApi(new Request("https://nurevo.jp/api/tag/config?k=k_h1"), env, ctx)).json();
  assert.deepEqual(cfg.jsonld_nodes.map((n) => n["@type"]), ["CafeOrCoffeeShop", "WebSite", "Organization"]);
  assert.equal(cfg.jsonld["@type"], "CafeOrCoffeeShop", "jsonld stays the single business node");
}

console.log("hosted full-score tests passed");
