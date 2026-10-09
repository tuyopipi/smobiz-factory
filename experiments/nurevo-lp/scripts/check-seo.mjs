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
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ORIGIN, LANGS, STATIC_PAGES } from "../src/site.mjs";

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const problems = [];
const fail = (page, message) => problems.push(`${page}: ${message}`);

const decode = (value) => value
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const visibleText = (html) => decode(html
  .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/g, " ")
  .replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
const squash = (value) => String(value).replace(/\s+/g, "");

/** Where a URL of this site lives under public/. */
function fileFor(url) {
  const path = url.slice(ORIGIN.length);
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
  if (title.length < 8 || title.length > 70) fail(url, `title is ${title.length} characters`);
  if (description.length < 20 || description.length > 170) fail(url, `description is ${description.length} characters`);

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
    for (const offer of app.offers || []) {
      if (offer.priceCurrency !== "JPY" || !/^\d+$/.test(offer.price)) fail(url, `offer ${offer.name} has no usable price`);
      const shown = `¥${Number(offer.price).toLocaleString("en-US")}`;
      if (!text.includes(shown)) fail(url, `offer price ${shown} is not shown on the page`);
      if (!squash(text).includes(squash(offer.name))) fail(url, `offer name ${offer.name} is not shown on the page`);
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
    if (declared !== hreflang) fail(url, `hreflang ${hreflang} points at a page whose lang is ${declared}`);
  }
}
for (const lang of LANGS) {
  const home = pages.get(ORIGIN + lang.path);
  if (!home) { fail(lang.path, "language home page is missing from the sitemap"); continue; }
  if (home.alternates.size !== LANGS.length + 1) fail(home.url, `${home.alternates.size} hreflang links, expected ${LANGS.length + 1}`);
  // A page in one language must not carry another's script. Japanese kana in a
  // non-Japanese page means a string fell back instead of being translated.
  if (lang.code !== "ja" && /[぀-ヿ]/.test(home.text.replace(/日本語/g, ""))) fail(home.url, "contains Japanese text");
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} problem(s) in ${pages.size} pages`);
  process.exit(1);
}
console.log(`seo check: ${pages.size} pages, ${sitemapUrls.length} sitemap URLs, no problems`);
