/**
 * The paste-in copy for a site without the WordPress plugin.
 *
 * tag.js and GTM inject the JSON-LD from the browser, and most AI crawlers do
 * not run JavaScript, so a non-WordPress site has to carry the graph in its own
 * HTML. /api/sites/:id/static-snippet hands the owner that block, the llms.txt
 * and the robots lines. It must be the owner's alone, must parse as JSON-LD
 * with a stable @id, and must not be able to close its own <script> early.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { INITIAL_AEO_RULESET } from "../worker/aeo-rules.mjs";
import { handleApi } from "../worker/api.mjs";
import { AI_SEARCH_CRAWLERS, searchCrawlerRobotsLines } from "../worker/ai-crawlers.js";

const SESSION = { cookie: "nrv_session=t", origin: "https://nurevo.jp" };
const UPDATED = Date.parse("2026-10-20T03:04:05.000Z");

function makeEnv({ settings = {}, site = {}, signedIn = true, org = "org1" } = {}) {
  const row = { id: "site1", org_id: "org1", url: "shop.example", website_uri: "https://shop.example/", slug: null, site_key: "nrv_k", plan: "free", manual_plan: null, install_type: "tag", delivery_status: "active", ...site };
  const DB = {
    prepare(sql) {
      const first = async (...values) => {
        if (/FROM sessions/.test(sql)) {
          return signedIn ? { member_id: "m1", org_id: org, email: "o@x.test", role: "admin", status: "active", expires_at: Date.now() + 3.6e6 } : null;
        }
        if (/FROM aeo_rulesets/.test(sql)) return INITIAL_AEO_RULESET;
        if (/FROM aeo_harvested_facts/.test(sql)) return null;
        if (/FROM site_settings/.test(sql)) {
          return { site_id: "site1", serve_schema: 1, allow_crawlers: 1, name: "栞珈琲", tel: "03-1234-5678", address: "東京都千代田区1-1", hours: "11:00-20:00", description: "自家焙煎", updated_at: UPDATED, ...settings };
        }
        if (/FROM sites WHERE id=\?/.test(sql)) {
          if (values[0] !== row.id) return null;
          if (/org_id=\?/.test(sql) && values[1] !== row.org_id) return null;
          return row;
        }
        if (/SELECT id FROM sites/.test(sql)) return values[0] === row.id ? { id: row.id } : null;
        return null;
      };
      return {
        bind(...values) { return { first: () => first(...values), async all() { return { results: [] }; }, async run() { return { success: true }; } }; },
        first, async all() { return { results: [] }; }, async run() { return { success: true }; },
      };
    },
  };
  return { DB, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp" };
}

async function ask(env, { id = "site1", headers = SESSION, method = "GET" } = {}) {
  const response = await handleApi(new Request(`https://w.test/api/sites/${id}/static-snippet`, { method, headers }), env, { waitUntil() {} });
  const text = await response.text();
  let body = null; try { body = JSON.parse(text); } catch {}
  return { status: response.status, body };
}

/* ---------------- authentication ---------------- */

{
  const { status, body } = await ask(makeEnv({ signedIn: false }), { headers: { origin: "https://nurevo.jp" } });
  assert.equal(status, 401, "no session, no snippet");
  assert.equal(body.error, "unauthorized");
}
{
  const { status } = await ask(makeEnv({ org: "someone-else" }));
  assert.equal(status, 403, "a member of another org cannot read this site's profile");
}
{
  const { status } = await ask(makeEnv(), { id: "nope" });
  assert.equal(status, 404, "an unknown site is not found");
}
{
  // The site key is public (it is printed in the tag) and is not a credential here.
  const env = makeEnv({ signedIn: false });
  const response = await handleApi(new Request("https://w.test/api/sites/site1/static-snippet?site_key=nrv_k", { headers: { origin: "https://nurevo.jp" } }), env, {});
  assert.equal(response.status, 401, "a site key alone does not unlock it");
}
{
  const { status, body } = await ask(makeEnv({ site: { delivery_status: "stopped" } }));
  assert.equal(status, 409, "a stopped site gets nothing to paste");
  assert.equal(body.error, "delivery_stopped");
}

/* ---------------- the payload ---------------- */

{
  const { status, body } = await ask(makeEnv());
  assert.equal(status, 200);
  assert.equal(body.site_id, "site1");
  assert.equal(body.updated_at, new Date(UPDATED).toISOString(), "says when the profile behind it last changed");
  assert.ok(body.generated_at, "and when it was generated");

  // The JSON-LD object and the pasteable block describe the same thing.
  assert.equal(body.jsonld["@id"], "https://shop.example/#organization", "the business node has a stable @id");
  assert.equal(body.jsonld["@type"], "LocalBusiness");
  assert.equal(body.jsonld.name, "栞珈琲");
  const match = body.jsonld_html.match(/^<script type="application\/ld\+json">\n([\s\S]*)\n<\/script>$/);
  assert.ok(match, "a complete application/ld+json script block");
  const parsed = JSON.parse(match[1]);
  assert.deepEqual(parsed, body.jsonld, "whose body parses back to the same graph");
  assert.equal(parsed["@context"], "https://schema.org");

  assert.match(body.llms_txt, /栞珈琲/, "llms.txt is the site's own");
  assert.equal(body.robots_txt_lines, searchCrawlerRobotsLines());
  for (const ua of ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User"]) {
    assert.match(body.robots_txt_lines, new RegExp(`^User-agent: ${ua}$`, "m"), `${ua} is allowed`);
  }
  assert.deepEqual(body.search_crawlers, [...AI_SEARCH_CRAWLERS]);
  for (const ua of ["GPTBot", "ClaudeBot", "Google-Extended", "CCBot", "Bytespider"]) {
    assert.ok(!body.robots_txt_lines.includes(ua), `training crawler ${ua} is left as it is`);
  }
  assert.ok(!/Disallow/.test(body.robots_txt_lines), "nothing is blocked");
  assert.match(body.robots_txt_lines, /^Allow: \/$/m);
}

{
  // A bare host still gets an absolute @id, without query or fragment.
  const { body } = await ask(makeEnv({ site: { website_uri: "", url: "bare.example/menu?x=1#top" } }));
  assert.equal(body.jsonld["@id"], "https://bare.example/menu#organization");
}

/* ---------------- it cannot break out of its script ---------------- */

{
  const hostile = "Cafe </script><script>alert(1)</script><!--  ";
  const { body } = await ask(makeEnv({ settings: { name: hostile, description: "</SCRIPT >x" } }));
  assert.equal(body.jsonld.name, hostile, "the value itself is kept exactly");
  const inner = body.jsonld_html.slice(body.jsonld_html.indexOf(">") + 1, body.jsonld_html.lastIndexOf("</script>"));
  assert.ok(!/<\/script/i.test(inner), "no closing script tag inside the block");
  assert.ok(!inner.includes("<"), "no '<' at all inside the block");
  assert.ok(!inner.includes(" "), "line separators are escaped");
  assert.equal(body.jsonld_html.match(/<\/script>/g).length, 1, "exactly one closing tag, the real one");
  assert.equal(JSON.parse(inner).name, hostile, "and it still parses to the original value");
}

/* ---------------- serve_schema off ---------------- */

{
  const { status, body } = await ask(makeEnv({ settings: { serve_schema: 0 } }));
  assert.equal(status, 200);
  assert.equal(body.jsonld, null, "an owner who turned schema off is not handed one");
  assert.equal(body.jsonld_html, "");
  assert.ok(body.llms_txt && body.robots_txt_lines, "llms.txt and robots lines still come back");
}

/* ---------------- tag config carries the same @id ---------------- */

{
  const env = makeEnv();
  const base = env.DB.prepare;
  env.DB.prepare = (sql) => /SELECT id, plan, manual_plan, status, delivery_status, .* FROM sites WHERE site_key/.test(sql)
    ? { bind: () => ({ first: async () => ({ id: "site1", plan: "free", manual_plan: null, status: "active", delivery_status: "active" }), run: async () => ({}) }) }
    : /FROM sites WHERE id = \?/.test(sql)
      ? { bind: () => ({ first: async () => ({ url: "shop.example", website_uri: "https://shop.example/", slug: null, delivery_status: "active" }) }) }
      : base(sql);
  const response = await handleApi(new Request("https://w.test/api/tag/config?k=nrv_k"), env, {});
  const config = await response.json();
  assert.equal(config.jsonld["@id"], "https://shop.example/#organization", "tag.js injects the same entity id");
}

/* ---------------- dashboard rendering ---------------- */

{
  const source = readFileSync(new URL("../public/dashboard-guidance.js", import.meta.url), "utf8");
  const sandbox = {
    document: { createElement: () => ({ style: {}, set textContent(v) {} }), head: { appendChild() {} }, addEventListener() {}, documentElement: {}, querySelector: () => null },
    localStorage: { getItem: () => null }, MutationObserver: class { observe() {} }, setTimeout() {},
    Object, Array, String, Number, Date, JSON, isNaN,
  };
  sandbox.window = sandbox;
  vm.runInNewContext(source, sandbox);
  const render = sandbox.__nrvStaticSnippetHtml;
  assert.equal(typeof render, "function", "the static block renderer is exposed for tests");

  const { body } = await ask(makeEnv({ settings: { name: "A </script> B" } }));
  const site = { id: "site1", key: "nrv_k" };
  const ja = render(body, site, "ja");
  for (const field of ["jsonld", "llms", "robots"]) {
    assert.ok(ja.includes(`nrv-static-${field}`), `${field} is shown`);
    assert.ok(ja.includes(`data-field="${field}"`), `${field} has a copy button`);
  }
  assert.ok(ja.includes("&lt;head&gt;"), "tells the owner to paste into <head>");
  assert.match(ja, /GTM|タグマネージャー/, "and not through a tag manager");
  assert.ok(ja.includes("ルート"), "llms.txt goes to the site root");
  assert.ok(ja.includes(`datetime="${new Date(UPDATED).toISOString()}"`), "shows the last-updated time");
  assert.ok(ja.includes("コピーし直"), "and says the copy must be refreshed after changes");
  assert.ok(ja.includes("JavaScriptを実行しない"), "the tag is described for what it does");
  assert.ok(!ja.includes("CMSを問わず"), "and never as working everywhere");
  assert.ok(!ja.includes("A </script> B"), "raw markup from the profile never reaches the DOM unescaped");

  const en = render(body, site, "en");
  assert.ok(en.includes("do not run JavaScript"), "English copy is honest too");
  assert.ok(en.includes("Copy"));

  const failed = render(null, site, "ja");
  assert.ok(failed.includes("取得できませんでした"), "a failed load says so instead of rendering empty boxes");
  assert.ok(failed.includes("nrv-snippet"), "the optional tag is still offered");

  const off = render({ ...body, jsonld: null, jsonld_html: "" }, site, "ja");
  assert.ok(off.includes("JSON-LDを配信"), "schema off points at the setting");
  assert.ok(!off.includes("nrv-static-jsonld"), "rather than an empty JSON-LD box");
}

console.log("static snippet tests passed");
