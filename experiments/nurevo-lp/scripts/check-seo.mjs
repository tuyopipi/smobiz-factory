/**
 * Check what the build published, page by page.
 *
 * Structured data is a set of claims, and the easy mistake is a claim the page
 * does not make: an FAQ answer nobody can read, a price that is not on the
 * page, an hreflang link to a page that does not link back. This reads the
 * built files as a crawler would - no JavaScript - and fails on any of those.
 *
 * Per page: one h1, a title and description of usable length, a canonical that
 * points at itself, valid JSON-LD whose @id references resolve and whose
 * required properties (as Google's rich-result documentation lists them) are
 * present, every FAQ question and answer present in the visible text, every
 * offer price visible, every image with an alt. Across pages: hreflang sets
 * that agree with each other, and a sitemap that lists exactly those pages.
 *
 * Translation gates (one page per language, 41 languages): title and
 * description lengths per script (CJK and Korean count shorter), no template
 * placeholder left in the text, no paragraph left in English on a page in
 * another language, one canonical per page, every internal link resolving to a
 * built page or a route the Worker serves, regional hreflang variants pointing
 * at their parent's page, and every indexable built page listed in the sitemap.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ORIGIN, LANGS, VARIANTS, STATIC_PAGES } from "../src/site.mjs";
import { WIDE_SCRIPT } from "../src/i18n/locales.mjs";
import GLOSSARY from "../src/i18n/glossary.json" with { type: "json" };

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const problems = [];
const fail = (page, message) => problems.push(`${page}: ${message}`);

const decode = (value) => value
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const visibleText = (html) => decode(html
  .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/g, " ")
  .replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
const squash = (value) => String(value).replace(/\s+/g, "");

// Words that only English uses among the site's languages. A block of text in a
// non-English page with several of them is a paragraph nobody translated.
const ENGLISH_ONLY = new Set("the and with your that this which from have what when does into their about would should there these those than been were also".split(" "));
const KEEP = new RegExp(GLOSSARY.keep.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g");
function englishBlocks(html) {
  const body = html.replace(/<(script|style|noscript|code|pre|cite|select)\b[\s\S]*?<\/\1>/g, " ");
  const blocks = [];
  for (const match of body.matchAll(/<(p|li|h[1-6]|td|th|summary)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    // A quoted source title stays in its own language; anything in a lang="en" element or link is meant to be English.
    const inner = match[2].replace(/<a\b[^>]*hreflang="en"[^>]*>[\s\S]*?<\/a>/g, " ").replace(/<[^>]*\blang="en"[^>]*>[\s\S]*?<\/[a-z]+>/g, " ").replace(/“[^”]*”|"[^"]*"/g, " ");
    const text = decode(inner.replace(/<[^>]+>/g, " ")).replace(KEEP, " ");
    const words = text.toLowerCase().match(/[a-z']+/g) || [];
    const hits = new Set(words.filter((word) => ENGLISH_ONLY.has(word)));
    if (hits.size >= 3 && words.length >= 6) blocks.push(text.replace(/\s+/g, " ").trim());
  }
  return blocks;
}

// Paths the Worker answers on nurevo.jp (wrangler.jsonc routes) and the pages
// it serves itself; a link to one of them is valid without a file here.
const WORKER_PATHS = [/^\/api\//, /^\/dashboard/, /^\/check\/?$/, /^\/en\/(privacy|terms)\/?$/, /^\/s\//, /^\/p\//, /^\/tag\.js$/, /^\/(sitemap|sitemap-stores)\.xml$/, /^\/(robots|llms)\.txt$/, /^\/assets\/onboarding\//];
const resolved = new Map();
function internalLinkResolves(href) {
  const path = href.replace(/[?#].*$/, "") || "/";
  if (resolved.has(path)) return resolved.get(path);
  const ok = WORKER_PATHS.some((pattern) => pattern.test(path))
    || existsSync(join(PUBLIC, path, "index.html"))
    || (!path.endsWith("/") && (existsSync(join(PUBLIC, path)) && !path.endsWith("/") || existsSync(join(PUBLIC, `${path}.html`))));
  resolved.set(path, ok);
  return ok;
}


/** Where a URL of this site lives under public/. */
function fileFor(url) {
  const path = url.slice(ORIGIN.length);
  const declared = STATIC_PAGES.find((page) => page.path === path && page.file);
  if (declared) return join(PUBLIC, declared.file);
  if (path.endsWith("/")) return join(PUBLIC, path, "index.html");
  return existsSync(join(PUBLIC, `${path}.html`)) ? join(PUBLIC, `${path}.html`) : join(PUBLIC, path, "index.html");
}

const sitemap = readFileSync(join(PUBLIC, "sitemap-pages.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decode(match[1]));
const workerServed = new Set(STATIC_PAGES.filter((page) => !page.file).map((page) => ORIGIN + page.path));
const pages = new Map();

for (const url of sitemapUrls) {
  if (workerServed.has(url)) continue;
  const file = fileFor(url);
  if (!existsSync(file)) { fail(url, "listed in the sitemap but not built"); continue; }
  const html = readFileSync(file, "utf8");
  const text = visibleText(html);
  const page = { url, html, text, alternates: new Map() };
  pages.set(url, page);

  if (!/^<!doctype html>/i.test(html)) fail(url, "no doctype");
  const lang = (html.match(/<html lang="([^"]+)"/) || [])[1];
  if (!lang) fail(url, "no lang on <html>");

  const h1 = html.match(/<h1[\s>]/g) || [];
  if (h1.length !== 1) fail(url, `${h1.length} h1 elements, expected 1`);
  // Headings may not skip a level on the way down.
  let previous = 0;
  for (const match of html.matchAll(/<h([1-6])[\s>]/g)) {
    const level = Number(match[1]);
    if (previous && level > previous + 1) fail(url, `heading jumps from h${previous} to h${level}`);
    previous = level;
  }

  const title = decode((html.match(/<title>([^<]*)<\/title>/) || [])[1] || "");
  const description = decode((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "");
  const code = LANGS.find((item) => item.htmlLang === lang)?.code;
  const [titleMax, descriptionMax] = WIDE_SCRIPT.has(code) ? [55, 120] : [70, 170];
  if (title.length < 8 || title.length > titleMax) fail(url, `title is ${title.length} characters (max ${titleMax} for ${lang})`);
  if (description.length < 20 || description.length > descriptionMax) fail(url, `description is ${description.length} characters (max ${descriptionMax} for ${lang})`);
  if ((html.match(/<link rel="canonical"/g) || []).length !== 1) fail(url, "must have exactly one canonical link");
  // Hand-written pages (they carry the seo marker) are checked for the head
  // tags above; the translation gates below are for the pages the build writes.
  const generated = !html.includes("<!-- seo:generated");
  if (generated && /\{\{?[A-Za-z_][\w.]*\}\}?/.test(visibleText(html.replace(/<(pre|code)\b[\s\S]*?<\/\1>/g, " ")) + title + description)) fail(url, "a template placeholder is left in the text");
  if (code && code !== "en") for (const block of englishBlocks(html)) fail(url, `paragraph left in English: ${block.slice(0, 60)}…`);
  if (generated) for (const link of html.matchAll(/<a\b[^>]*\bhref="(\/[^"]*)"/g)) {
    if (!internalLinkResolves(decode(link[1]))) fail(url, `internal link does not resolve: ${link[1]}`);
  }

  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (canonical !== url) fail(url, `canonical is ${canonical}`);
  if (/name="robots" content="[^"]*noindex/.test(html)) fail(url, "is in the sitemap but marked noindex");
  for (const property of ["og:title", "og:description", "og:url", "og:image", "og:locale", "og:type"]) {
    if (!new RegExp(`<meta property="${property}" content="[^"]+"`).test(html)) fail(url, `no ${property}`);
  }
  if (!/<meta name="twitter:card" content="summary_large_image"/.test(html)) fail(url, "no twitter card");
  if ((html.match(/<meta property="og:url" content="([^"]+)"/) || [])[1] !== url) fail(url, "og:url is not the canonical");

  for (const match of html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)) page.alternates.set(match[1], match[2]);

  for (const img of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt="/.test(img[0])) fail(url, `image without alt: ${img[0].slice(0, 80)}`);
    if (!/\bwidth="\d+"/.test(img[0]) || !/\bheight="\d+"/.test(img[0])) fail(url, `image without dimensions: ${img[0].slice(0, 80)}`);
  }
  for (const link of html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)) {
    if (link[1] === "#" || link[1] === "") fail(url, "a link that goes nowhere");
  }

  // ---- JSON-LD ----
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!blocks.length) { fail(url, "no JSON-LD"); continue; }
  const nodes = [];
  for (const block of blocks) {
    try {
      const data = JSON.parse(block[1]);
      if (data["@context"] !== "https://schema.org") fail(url, "JSON-LD @context is not https://schema.org");
      nodes.push(...(data["@graph"] || [data]));
    } catch (error) { fail(url, `JSON-LD does not parse: ${error.message}`); }
  }
  const byType = (type) => nodes.filter((node) => [].concat(node["@type"]).includes(type));
  const ids = new Set(nodes.map((node) => node["@id"]).filter(Boolean));
  (function refs(value, path) {
    if (Array.isArray(value)) return value.forEach((item) => refs(item, path));
    if (!value || typeof value !== "object") return;
    const keys = Object.keys(value);
    if (keys.length === 1 && keys[0] === "@id" && !ids.has(value["@id"])) fail(url, `JSON-LD ${path} points at ${value["@id"]}, which is not defined`);
    for (const key of keys) refs(value[key], `${path}.${key}`);
  })(nodes, "graph");

  for (const type of ["Organization", "WebSite", "WebPage", "BreadcrumbList"]) {
    if (byType(type).length !== 1) fail(url, `${byType(type).length} ${type} nodes, expected 1`);
  }
  const organization = byType("Organization")[0];
  if (organization) {
    for (const key of ["name", "url", "logo"]) if (!organization[key]) fail(url, `Organization has no ${key}`);
    // The operator is whoever the company profile on the home page names.
    for (const value of [organization.name, organization.address?.streetAddress, organization.founder?.name]) {
      if (!squash(pagesHomeText()).includes(squash(value || "∅"))) fail(url, `Organization states "${value}", which the company profile does not`);
    }
  }
  const webPage = byType("WebPage")[0];
  if (webPage && (webPage.url !== url || webPage.name !== title || webPage.description !== description)) fail(url, "WebPage node disagrees with the page's own url/title/description");
  const breadcrumb = byType("BreadcrumbList")[0];
  if (breadcrumb) {
    breadcrumb.itemListElement.forEach((item, index) => {
      if (item.position !== index + 1 || !item.name || !/^https:\/\//.test(item.item || "")) fail(url, `breadcrumb item ${index + 1} is incomplete`);
    });
    if (breadcrumb.itemListElement.at(-1).item !== url) fail(url, "the breadcrumb does not end at this page");
  }
  for (const faq of byType("FAQPage")) {
    if (!faq.mainEntity?.length) fail(url, "FAQPage with no questions");
    for (const question of faq.mainEntity || []) {
      const answer = question.acceptedAnswer?.text;
      if (question["@type"] !== "Question" || !question.name || !answer) { fail(url, "FAQ entry is missing its question or answer"); continue; }
      if (!squash(text).includes(squash(question.name))) fail(url, `FAQ question is not on the page: ${question.name}`);
      if (!squash(text).includes(squash(answer))) fail(url, `FAQ answer is not on the page: ${answer.slice(0, 40)}…`);
    }
  }
  for (const app of byType("SoftwareApplication")) {
    for (const key of ["name", "applicationCategory", "operatingSystem", "offers"]) if (!app[key]) fail(url, `SoftwareApplication has no ${key}`);
    // No rating exists, so none may be stated - in any form.
    if (app.aggregateRating || app.review) fail(url, "SoftwareApplication carries a rating or review that nothing measured");
    // JPY is the canonical price and Japanese pages show it; every other
    // language shows the US-dollar price. Each page must show the offers in
    // its own currency, and every plan must have a JPY offer.
    const pageCurrency = lang === "ja" ? "JPY" : "USD";
    const symbol = { JPY: "¥", USD: "$" };
    const offers = app.offers || [];
    for (const offer of offers) {
      if (!symbol[offer.priceCurrency] || !/^\d+$/.test(offer.price)) fail(url, `offer ${offer.name} has no usable price`);
      if (offer.priceCurrency === "USD" && offer.eligibleRegion?.name !== "US") fail(url, `USD offer ${offer.name} is not limited to the US`);
      if (offer.priceCurrency === pageCurrency || (offer.priceCurrency === "JPY" && Number(offer.price) === 0)) {
        const shown = `${symbol[pageCurrency]}${Number(offer.price).toLocaleString("en-US")}`;
        if (!text.includes(shown)) fail(url, `offer price ${shown} is not shown on the page`);
      }
      if (!squash(text).includes(squash(offer.name))) fail(url, `offer name ${offer.name} is not shown on the page`);
    }
    for (const offer of offers.filter((o) => o.priceCurrency === "USD")) {
      if (!offers.some((o) => o.priceCurrency === "JPY" && o.name === offer.name)) fail(url, `offer ${offer.name} has no canonical JPY offer`);
    }
  }
  if (/aggregateRating|"review"/.test(blocks.map((block) => block[1]).join(""))) fail(url, "a rating or review appears in the structured data");
}

function pagesHomeText() {
  return visibleText(readFileSync(join(PUBLIC, "index.html"), "utf8"));
}

/* ---- hreflang: every member of a set lists the same set, itself included ---- */
for (const [url, page] of pages) {
  if (!page.alternates.size) continue;
  if (![...page.alternates.values()].includes(url)) fail(url, "its hreflang set does not include itself");
  if (!page.alternates.has("x-default")) fail(url, "no x-default");
  for (const [hreflang, target] of page.alternates) {
    const other = pages.get(target);
    if (!other) { fail(url, `hreflang ${hreflang} points at ${target}, which is not a built page`); continue; }
    if (hreflang === "x-default") continue;
    if (JSON.stringify([...other.alternates]) !== JSON.stringify([...page.alternates])) fail(url, `hreflang set differs from the one on ${target}`);
    const declared = (other.html.match(/<html lang="([^"]+)"/) || [])[1];
    // A regional variant without pages of its own points at its parent's page.
    const variant = VARIANTS.find((item) => item.hreflang === hreflang);
    const expected = variant ? LANGS.find((item) => item.code === variant.page).htmlLang : hreflang;
    if (declared !== expected) fail(url, `hreflang ${hreflang} points at a page whose lang is ${declared}, expected ${expected}`);
  }
}
for (const lang of LANGS) {
  const home = pages.get(ORIGIN + lang.path);
  if (!home) { fail(lang.path, "language home page is missing from the sitemap"); continue; }
  if (home.alternates.size !== LANGS.length + VARIANTS.length + 1) fail(home.url, `${home.alternates.size} hreflang links, expected ${LANGS.length + VARIANTS.length + 1}`);
  const dir = (home.html.match(/<html [^>]*dir="([^"]+)"/) || [])[1] || "ltr";
  if (dir !== lang.dir) fail(home.url, `dir is ${dir}, expected ${lang.dir}`);
  // A page in one language must not carry another's script. Japanese kana in a
  // non-Japanese page means a string fell back instead of being translated.
  if (lang.code !== "ja" && /[぀-ヿ]/.test(home.text.replace(/日本語/g, ""))) fail(home.url, "contains Japanese text");
}

/* ---- sitemap == pages: every indexable page the build wrote is listed ---- */
(function walk(dir, rel) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) { if (!["assets", "gtm-test", "static-jsonld-test"].includes(entry.name)) walk(join(dir, entry.name), `${rel}${entry.name}/`); continue; }
    if (entry.name !== "index.html") continue;
    const html = readFileSync(join(dir, entry.name), "utf8");
    if (!html.includes("<!-- seo:generated") && !/<link rel="canonical"/.test(html)) continue;
    if (/name="robots" content="[^"]*noindex/.test(html)) continue;
    const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    if (canonical && !sitemapUrls.includes(canonical)) fail(`/${rel}`, `indexable page ${canonical} is not in the sitemap`);
  }
})(PUBLIC, "");
if (new Set(sitemapUrls).size !== sitemapUrls.length) fail("sitemap", "lists a URL twice");
for (const variant of VARIANTS) {
  if (!sitemap.includes(`hreflang="${variant.hreflang}"`)) fail("sitemap", `no alternate for ${variant.hreflang}`);
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} problem(s) in ${pages.size} pages`);
  process.exit(1);
}
console.log(`seo check: ${pages.size} pages, ${sitemapUrls.length} sitemap URLs, no problems`);
