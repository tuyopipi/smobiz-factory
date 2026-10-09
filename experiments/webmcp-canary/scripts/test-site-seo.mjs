/**
 * nurevo.jp's own robots.txt, sitemap, llms.txt and AI-referral tally.
 *
 * The site that sells AEO has to pass its own advice: AI crawlers allowed on
 * every public page (not only the hosted stores), a sitemap that lists the
 * marketing pages, an llms.txt that says what the product is, and a way to
 * count the visits AI answers send. Checked through the real routes.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { handleApi } from "../worker/api.mjs";
import {
  AI_REFERRER_IDS, SITE_CRAWLERS, readAiReferrals, recordAiReferral, siteLlmsTxt, siteRobotsTxt,
} from "../worker/site-seo.mjs";
import { AI_REFERRERS } from "../../nurevo-lp/src/site.mjs";

const STORES = [{ slug: "自家製麺no11", name: "自家製麺No11", business_type: "ラーメン", address: "東京都", hours: null, tel: null }];

function makeEnv({ member = null } = {}) {
  const kv = new Map();
  return {
    kv,
    DEV: "0",
    LP_PAGES_URL: "https://pages.invalid/llms-pages.json",
    WEBMCP_KV: {
      async get(key, type) { const v = kv.get(key); return v === undefined ? null : type === "json" ? JSON.parse(v) : v; },
      async put(key, value) { kv.set(key, value); },
    },
    DB: {
      prepare(sql) {
        const statement = {
          bind: () => statement,
          async all() { return { results: /FROM sites/.test(sql) ? STORES : [] }; },
          async first() { return /FROM sessions/.test(sql) ? member : null; },
          async run() { return { meta: { changes: 0 } }; },
        };
        return statement;
      },
    },
  };
}

const get = (path, env, init = {}) => handleApi(new Request(`https://nurevo.jp${path}`, init), env, { waitUntil() {} });

/* ---------------- robots.txt ---------------- */

{
  const response = await get("/robots.txt", makeEnv());
  assert.equal(response.status, 200);
  const robots = await response.text();
  assert.equal(robots, siteRobotsTxt());
  for (const ua of ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "Bingbot", "Applebot-Extended"]) {
    assert.ok(robots.includes(`User-agent: ${ua}\n`), `${ua} is named`);
  }
  // Every named crawler shares one group, and that group opens the whole site.
  const group = robots.split("\n\n").find((block) => block.includes("User-agent: GPTBot"));
  assert.ok(group.includes("\nAllow: /\n"), "named crawlers may read every public page");
  assert.equal(/Allow: \/s\/$/m.test(robots), false, "no longer limited to the store pages");
  assert.equal(group.split("\n").filter((line) => line.startsWith("User-agent:")).length, SITE_CRAWLERS.length);
  assert.ok(robots.includes("User-agent: *\nAllow: /"), "and so may everyone else");
  assert.ok(group.includes("Disallow: /api/") && group.includes("Disallow: /dashboard"), "but not the API or the dashboard");
  assert.ok(robots.trimEnd().endsWith("Sitemap: https://nurevo.jp/sitemap.xml"), "the sitemap is declared");
}

/* ---------------- sitemap ---------------- */

{
  const index = await (await get("/sitemap.xml", makeEnv())).text();
  assert.ok(index.includes("<sitemapindex"), "the root sitemap is an index");
  assert.ok(index.includes("<loc>https://nurevo.jp/sitemap-pages.xml</loc>"), "pointing at the marketing pages");
  assert.ok(index.includes("<loc>https://nurevo.jp/sitemap-stores.xml</loc>"), "and at the store pages");

  const stores = await (await get("/sitemap-stores.xml", makeEnv())).text();
  assert.ok(stores.includes("<urlset"));
  assert.ok(stores.includes(`<loc>https://nurevo.jp/s/${encodeURI("自家製麺no11")}</loc>`), "store URLs are percent-encoded");

  const routes = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");
  assert.ok(routes.includes('"nurevo.jp/sitemap-stores.xml"'), "the store sitemap has a route");
  assert.equal(routes.includes('"pattern": "nurevo.jp/en/*"'), false, "the worker no longer claims the English landing page");
  assert.ok(routes.includes('"nurevo.jp/en/privacy*"') && routes.includes('"nurevo.jp/en/terms*"'), "but still serves the English legal pages");
}

/* ---------------- llms.txt ---------------- */

{
  const pages = {
    home: [{ lang: "ja", url: "https://nurevo.jp/", title: "Nurevo" }, { lang: "en", url: "https://nurevo.jp/en/", title: "Nurevo EN" }],
    pages: [{ lang: "ja", url: "https://nurevo.jp/check/", title: "AI可読チェッカー", summary: "無料診断" }],
  };
  const text = siteLlmsTxt(pages, STORES);
  assert.ok(text.startsWith("# Nurevo\n\n> "), "opens with the name and a summary, as llms.txt asks");
  assert.ok(text.includes("answer engine optimization"), "says what the product is");
  assert.ok(text.includes("- [Nurevo EN](https://nurevo.jp/en/) (en)"), "links the language home pages");
  assert.ok(text.includes("- [AI可読チェッカー](https://nurevo.jp/check/): 無料診断"), "and the main pages");
  assert.ok(text.includes("### 自家製麺No11") && text.includes("https://nurevo.jp/s/自家製麺no11"), "the hosted stores are still listed");
  // Only what is on sale is priced; Pro is announced, not sold.
  assert.ok(text.includes("¥3,000") && text.includes("¥0"));
  assert.equal(text.includes("14,800"), false, "a planned figure is not presented as a price");
  assert.equal(/rating|review|customers?\b/i.test(text), false, "nothing the page does not claim");

  // The page list comes from the Pages build; when it cannot be read the file
  // still says what Nurevo is, and lists no page it could not confirm.
  const fallback = siteLlmsTxt(null, []);
  assert.ok(fallback.startsWith("# Nurevo"));
  assert.equal(fallback.includes("## Pages"), false);
  assert.equal(fallback.includes("## Hosted stores"), false);

  const served = await get("/llms.txt", makeEnv());
  assert.equal(served.status, 200);
  assert.ok((await served.text()).startsWith("# Nurevo"), "served even with the page list unreachable");
}

/* ---------------- AI referrals ---------------- */

{
  assert.deepEqual([...AI_REFERRER_IDS].sort(), AI_REFERRERS.map((engine) => engine.id).sort(), "the worker accepts exactly the engines the page reports");

  const env = makeEnv();
  const beacon = (body, origin = "https://nurevo.jp") => get("/api/lp/ai-referral", env, {
    method: "POST", headers: { origin, "content-type": "text/plain" }, body: typeof body === "string" ? body : JSON.stringify(body),
  });

  assert.equal((await beacon({ engine: "chatgpt", path: "/en/", lang: "en" })).status, 204, "accepted without a CSRF token");
  await beacon({ engine: "chatgpt", path: "/en/", lang: "en" });
  await beacon({ engine: "perplexity", path: "/", lang: "ja" });
  // None of these count, and none is told so.
  assert.equal((await beacon({ engine: "google", path: "/" })).status, 204);
  assert.equal((await beacon("not json")).status, 204);
  assert.equal((await beacon({ engine: "chatgpt", path: "/" }, "https://evil.example")).status, 204);

  const tally = await readAiReferrals(env, 7);
  assert.equal(tally.total, 3, "three real arrivals, nothing else");
  assert.deepEqual(tally.engines, { chatgpt: 2, perplexity: 1 });
  assert.deepEqual(tally.daily[0].paths, { "/en/": 2, "/": 1 });
  const stored = [...env.kv.values()].join("");
  assert.equal(/ip|user-agent|cookie/i.test(stored), false, "no visitor detail is stored");

  // A path that is not a path is counted against "/" rather than stored.
  await recordAiReferral(env, { engine: "claude", path: "/<script>alert(1)</script>" });
  assert.equal(JSON.stringify([...env.kv.values()]).includes("script"), false);

  // The tally is for the operator only.
  assert.equal((await get("/api/lp/ai-referrals", makeEnv())).status, 401, "signed out: no tally");
}

console.log("site SEO tests passed");
