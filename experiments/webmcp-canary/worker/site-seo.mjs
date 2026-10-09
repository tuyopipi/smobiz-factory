/**
 * nurevo.jp's own robots.txt, sitemap, llms.txt and AI-referral count.
 *
 * These three files used to describe only the hosted store pages under /s/, as
 * if the site selling AEO had nothing of its own for an answer engine to read:
 * robots.txt allowed AI crawlers into /s/ and said nothing of the rest, the
 * sitemap listed no marketing page, and llms.txt did not say what Nurevo is.
 * The product's own advice applies to the product's own site.
 *
 * Pure functions, so the routes in api.mjs stay one line each and the output
 * can be tested without a database.
 */

export const SITE_ORIGIN = "https://nurevo.jp";

// Crawlers that fetch pages for AI answers, AI search or model training, plus
// the two search crawlers whose indexes AI answers are built on. Listed by name
// because several of them obey only a group that names them.
export const SITE_CRAWLERS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "Googlebot", "Bingbot",
  "Applebot", "Applebot-Extended",
  "Amazonbot", "Meta-ExternalAgent", "DuckAssistBot", "MistralAI-User", "CCBot", "Bytespider",
];

// Nothing under these is a page: the API, and the signed-in dashboard.
const DISALLOW = ["/api/", "/dashboard"];

export function siteRobotsTxt() {
  const rules = ["Allow: /", ...DISALLOW.map((path) => `Disallow: ${path}`)].join("\n");
  return [
    "# nurevo.jp - AI crawlers are welcome on every public page.",
    `${SITE_CRAWLERS.map((ua) => `User-agent: ${ua}`).join("\n")}\n${rules}`,
    `User-agent: *\n${rules}`,
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    "",
  ].join("\n\n").replace(/\n\n$/, "\n");
}

const escXml = (value) => String(value || "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** The index: marketing pages are built by Pages, store pages come from the database. */
export function sitemapIndexXml() {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <sitemap><loc>${SITE_ORIGIN}/sitemap-pages.xml</loc></sitemap>`,
    `  <sitemap><loc>${SITE_ORIGIN}/sitemap-stores.xml</loc></sitemap>`,
    "</sitemapindex>",
    "",
  ].join("\n");
}

export function storesSitemapXml(rows) {
  const urls = (rows || []).map((row) => `  <url><loc>${SITE_ORIGIN}/s/${escXml(encodeURI(row.slug))}</loc></url>`);
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, "</urlset>", ""].join("\n");
}

/**
 * llms.txt. Every statement here is one the landing page makes; `pages` is the
 * list the Pages build published (public/llms-pages.json), or null when it
 * could not be read, in which case the page list is left out rather than guessed.
 */
export function siteLlmsTxt(pages, stores) {
  const lines = [
    "# Nurevo",
    "",
    "> Nurevo is an AEO (answer engine optimization) tool. It measures how AI search engines such as ChatGPT and Perplexity read a website, and puts in place what they need to read and cite it: server-side schema.org structured data, llms.txt and AI crawler access. It is installed as the WordPress plugin \"Nurevo AEO\", or as a single tag on any other site, and works alongside Yoast SEO and Rank Math.",
    "",
    "Nurevoは、AI検索（ChatGPT・Perplexityなど）がサイトをどう読んでいるかを測り、引用される土台（サーバーサイドの構造化データ・llms.txt・AIクローラー許可）を整えるAEOツールです。",
    "",
    "## Product",
    "",
    "- Free (¥0 / month): AI-readability score, and schema.org, llms.txt and AI crawler rules output to the criteria in force at install time.",
    "- Standard (¥3,000 / month per site): everything in Free, kept up to date as the criteria change.",
    "- Pro: announced, in beta and not yet on sale. A prioritised fix list, and measurement of how often AI answers cite the site.",
    `- WordPress plugin: https://wordpress.org/plugins/nurevo-webmcp/`,
    `- Operator: Bestie.合同会社 (Tokyo, Japan). Contact: info@nurevo.jp`,
    "",
  ];
  if (pages && Array.isArray(pages.home) && pages.home.length) {
    lines.push("## Home", "");
    for (const page of pages.home) lines.push(`- [${page.title}](${page.url}) (${page.lang})`);
    lines.push("");
  }
  if (pages && Array.isArray(pages.pages) && pages.pages.length) {
    lines.push("## Pages", "");
    for (const page of pages.pages) lines.push(`- [${page.title}](${page.url})${page.summary ? `: ${page.summary}` : ""}`);
    lines.push("");
  }
  if (stores && stores.length) {
    lines.push("## Hosted stores", "", "Nurevoのホスト店舗ページ一覧です。", "");
    for (const store of stores) {
      lines.push(`### ${store.name || store.slug}`);
      lines.push(`- URL: ${SITE_ORIGIN}/s/${store.slug}`);
      if (store.business_type) lines.push(`- 業種: ${store.business_type}`);
      if (store.address) lines.push(`- 住所: ${store.address}`);
      if (store.hours) lines.push(`- 営業時間: ${store.hours}`);
      if (store.tel) lines.push(`- 電話: ${store.tel}`);
      lines.push("");
    }
  }
  return lines.join("\n");
}

/** The published page list, from the Pages build. Null when it cannot be read. */
export async function loadSitePages(env, fetcher = fetch) {
  try {
    const response = await fetcher(env?.LP_PAGES_URL || `${SITE_ORIGIN}/llms-pages.json`, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (!response.ok) return null;
    const body = await response.json();
    return body && typeof body === "object" ? body : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Visits that arrived from an AI answer engine
 * ------------------------------------------------------------------ */

// Must match AI_REFERRERS in nurevo-lp/src/site.mjs; scripts/test-site-seo.mjs
// fails if the two lists part.
export const AI_REFERRER_IDS = [
  "chatgpt", "perplexity", "gemini", "copilot", "claude", "you", "phind", "kagi",
  "duckduckgo-ai", "meta-ai", "grok", "deepseek", "mistral",
];

const REFERRAL_TTL_SECONDS = 400 * 24 * 60 * 60;
// A day's tally stops growing here. Real AI referrals to a marketing site are
// nowhere near this; a number that reaches it is someone posting at the endpoint.
const REFERRAL_DAILY_CAP = 5000;
const referralKey = (date) => `lp:ai-referral:${date}`;
const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10);

/**
 * Count one arrival. Stores a per-day tally by engine and landing path in KV -
 * no visitor identifier, IP or user agent is kept. Returns whether it counted.
 */
export async function recordAiReferral(env, payload, now = Date.now()) {
  const engine = String(payload?.engine || "");
  if (!AI_REFERRER_IDS.includes(engine) || !env?.WEBMCP_KV) return false;
  const rawPath = String(payload?.path || "/");
  const path = /^\/[\w\-./%]{0,120}$/.test(rawPath) ? rawPath : "/";
  const key = referralKey(dayOf(now));
  const day = (await env.WEBMCP_KV.get(key, "json")) || { total: 0, engines: {}, paths: {} };
  if (day.total >= REFERRAL_DAILY_CAP) return false;
  day.total += 1;
  day.engines[engine] = (day.engines[engine] || 0) + 1;
  // Bounded, so a flood of invented paths cannot grow the value without limit.
  if (day.paths[path] !== undefined || Object.keys(day.paths).length < 200) day.paths[path] = (day.paths[path] || 0) + 1;
  await env.WEBMCP_KV.put(key, JSON.stringify(day), { expirationTtl: REFERRAL_TTL_SECONDS });
  return true;
}

/** Tallies for the last `days` days, newest first, with totals by engine. */
export async function readAiReferrals(env, days = 30, now = Date.now()) {
  const span = Math.min(Math.max(Number(days) || 30, 1), 365);
  const daily = [];
  const engines = {};
  let total = 0;
  for (let back = 0; back < span; back += 1) {
    const date = dayOf(now - back * 86_400_000);
    const day = env?.WEBMCP_KV ? await env.WEBMCP_KV.get(referralKey(date), "json") : null;
    if (!day) continue;
    daily.push({ date, total: day.total, engines: day.engines, paths: day.paths });
    total += day.total;
    for (const [engine, count] of Object.entries(day.engines || {})) engines[engine] = (engines[engine] || 0) + count;
  }
  return { days: span, total, engines, daily };
}
