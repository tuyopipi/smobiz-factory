/**
 * Build the static pages of nurevo.jp.
 *
 * The landing page used to be one URL that rewrote its own text in the browser
 * when a visitor picked a language. A crawler - and an AI answer engine that
 * does not run JavaScript at all - only ever saw the Japanese, with no head, no
 * canonical and nothing to say that seven other languages existed. This renders
 * one page per language from src/lp.html and src/i18n.mjs, each with its own
 * title, description, canonical, hreflang set and JSON-LD, and writes the
 * sitemap alongside.
 *
 *   node scripts/build-site.mjs            write into public/
 *   node scripts/build-site.mjs --check    fail if public/ is out of date
 *   node scripts/build-site.mjs --drafts --out .preview
 *                                          also render draft content pages,
 *                                          marked noindex, somewhere that is
 *                                          never deployed
 *
 * No dependencies: the template is transformed as text. The only structure the
 * transform relies on is that an element carrying data-i18n does not contain
 * another element of the same tag name left unclosed, which the build checks.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import I18N from "../src/i18n.mjs";
import {
  ORIGIN, LANGS, DEFAULT_LANG, OG_IMAGE, ORGANIZATION, PRODUCT, FAQ_KEYS, STATIC_PAGES, AI_REFERRERS,
} from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const DRAFTS = args.includes("--drafts");
const OUT = args.includes("--out") ? join(ROOT, args[args.indexOf("--out") + 1]) : join(ROOT, "public");

const read = (path) => readFileSync(join(ROOT, path), "utf8");
const esc = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (value) => esc(value).replace(/"/g, "&quot;");
const stripTags = (value) => String(value).replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
// JSON-LD sits inside a <script>; "<" is the only character that can end it early.
const jsonLd = (graph) =>
  `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c")}</script>`;

const langOf = (code) => LANGS.find((lang) => lang.code === code);

/** The string for a key in a language. A missing one is a build error, not a silent fallback. */
function t(key, lang) {
  const entry = I18N[key];
  if (!entry) throw new Error(`i18n: unknown key ${key}`);
  if (typeof entry[lang] !== "string" || !entry[lang].trim()) throw new Error(`i18n: ${key} has no ${lang} string`);
  return entry[lang];
}

/* ------------------------------------------------------------------ *
 * Template transform
 * ------------------------------------------------------------------ */

const ATTRIBUTE_TARGETS = { ph: "placeholder", alt: "alt", aria: "aria-label", badge: "data-badge" };

/** Index just past the close tag matching the open tag that ends at `from`. */
function closeOf(html, tag, from) {
  const pattern = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi");
  pattern.lastIndex = from;
  let depth = 1;
  for (let match; (match = pattern.exec(html)); ) {
    depth += match[1] ? -1 : 1;
    if (depth === 0) return { start: match.index, end: pattern.lastIndex };
  }
  throw new Error(`template: <${tag}> opened before offset ${from} is never closed`);
}

/** Replace every translated element and attribute with this language's text. */
function localize(template, lang) {
  let html = "";
  let cursor = 0;
  const open = /<([a-zA-Z][\w-]*)\b([^>]*\bdata-i18n[\w-]*="[^"]*"[^>]*)>/g;
  for (let match; (match = open.exec(template)); ) {
    const [whole, tag] = match;
    let attrs = match[2];
    let inner = null;

    attrs = attrs.replace(/\s*\bdata-i18n(-[a-z]+)?="([^"]*)"/g, (_all, kind, key) => {
      const value = t(key, lang);
      if (!kind) { inner = esc(value); return ""; }
      if (kind === "-html") { inner = value; return ""; }
      const target = ATTRIBUTE_TARGETS[kind.slice(1)];
      if (!target) throw new Error(`template: unknown data-i18n${kind}`);
      return ` ${target}="${escAttr(value)}"`;
    });
    // The template keeps the Japanese value in the real attribute, ahead of the
    // data-i18n-* one; now that the translated attribute is in, drop the original.
    for (const target of Object.values(ATTRIBUTE_TARGETS)) {
      const all = [...attrs.matchAll(new RegExp(`\\s${target}="[^"]*"`, "g"))];
      if (all.length > 1) attrs = attrs.replace(all[0][0], "");
    }

    html += template.slice(cursor, match.index) + `<${tag}${attrs}>`;
    cursor = open.lastIndex;
    if (inner !== null) {
      const close = closeOf(template, tag, cursor);
      html += inner;
      cursor = close.start;
      open.lastIndex = close.start;
    }
  }
  html += template.slice(cursor);
  if (/data-i18n/.test(html)) throw new Error("template: a data-i18n attribute survived the transform");
  return html;
}

/* ------------------------------------------------------------------ *
 * Head
 * ------------------------------------------------------------------ */

const FONT_BASE = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500";

/** Fonts load without blocking the first paint; only Japanese needs the Japanese face. */
function fontLinks(lang) {
  const href = `${FONT_BASE}${lang === "ja" ? "&family=Noto+Sans+JP:wght@500;700;900" : ""}&display=swap`;
  return [
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    `<link rel="preload" as="style" href="${escAttr(href)}" onload="this.onload=null;this.rel='stylesheet'">`,
    `<noscript><link rel="stylesheet" href="${escAttr(href)}"></noscript>`,
  ].join("\n");
}

/**
 * The tags every page carries. `alternates` is [{ hreflang, url }] for the
 * languages this page really exists in; a page in one language has none.
 */
function head({ lang, title, description, url, alternates = [], type = "website", noindex = false, extra = "" }) {
  const meta = langOf(lang);
  const lines = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${escAttr(description)}">`,
    noindex ? '<meta name="robots" content="noindex,nofollow">' : '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">',
    `<link rel="canonical" href="${escAttr(url)}">`,
    ...alternates.map((alt) => `<link rel="alternate" hreflang="${alt.hreflang}" href="${escAttr(alt.url)}">`),
    '<link rel="icon" href="/assets/favicon-64.png" type="image/png" sizes="64x64">',
    '<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">',
    '<meta name="theme-color" content="#6f4df6">',
    `<meta property="og:type" content="${type}">`,
    '<meta property="og:site_name" content="Nurevo">',
    `<meta property="og:title" content="${escAttr(title)}">`,
    `<meta property="og:description" content="${escAttr(description)}">`,
    `<meta property="og:url" content="${escAttr(url)}">`,
    `<meta property="og:image" content="${OG_IMAGE.url}">`,
    `<meta property="og:image:width" content="${OG_IMAGE.width}">`,
    `<meta property="og:image:height" content="${OG_IMAGE.height}">`,
    `<meta property="og:locale" content="${meta.ogLocale}">`,
    ...alternates
      .filter((alt) => alt.ogLocale && alt.ogLocale !== meta.ogLocale)
      .map((alt) => `<meta property="og:locale:alternate" content="${alt.ogLocale}">`),
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escAttr(title)}">`,
    `<meta name="twitter:description" content="${escAttr(description)}">`,
    `<meta name="twitter:image" content="${OG_IMAGE.url}">`,
    fontLinks(lang),
    extra,
  ];
  return lines.filter(Boolean).join("\n");
}

/** hreflang entries for a page that exists at `pathFor(lang)` in each of `codes`. */
function alternatesFor(codes, pathFor) {
  const list = codes.map((code) => ({ hreflang: langOf(code).hreflang, ogLocale: langOf(code).ogLocale, url: ORIGIN + pathFor(code) }));
  const fallback = codes.includes(DEFAULT_LANG) ? DEFAULT_LANG : codes.includes("en") ? "en" : codes[0];
  if (codes.length > 1) list.push({ hreflang: "x-default", url: ORIGIN + pathFor(fallback) });
  return codes.length > 1 ? list : [];
}

/* ------------------------------------------------------------------ *
 * Structured data
 * ------------------------------------------------------------------ */

const ORG_ID = `${ORIGIN}/#organization`;
const SITE_ID = `${ORIGIN}/#website`;
const APP_ID = `${ORIGIN}/#software`;

function organizationNode() {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: ORGANIZATION.legalName,
    legalName: ORGANIZATION.legalName,
    alternateName: ORGANIZATION.brand,
    brand: { "@type": "Brand", name: ORGANIZATION.brand },
    url: `${ORIGIN}/`,
    logo: { "@type": "ImageObject", ...ORGANIZATION.logo },
    email: ORGANIZATION.email,
    foundingDate: ORGANIZATION.foundingDate,
    founder: { "@type": "Person", name: ORGANIZATION.founder },
    address: { "@type": "PostalAddress", ...ORGANIZATION.address },
    sameAs: ORGANIZATION.sameAs,
  };
}

function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    name: ORGANIZATION.brand,
    url: `${ORIGIN}/`,
    publisher: { "@id": ORG_ID },
    inLanguage: LANGS.map((lang) => lang.hreflang),
  };
}

function softwareNode(lang) {
  return {
    "@type": "SoftwareApplication",
    "@id": APP_ID,
    name: PRODUCT.name,
    description: t("meta.desc", lang),
    applicationCategory: PRODUCT.category,
    operatingSystem: PRODUCT.operatingSystem,
    url: ORIGIN + langOf(lang).path,
    downloadUrl: PRODUCT.downloadUrl,
    publisher: { "@id": ORG_ID },
    offers: PRODUCT.offers.map((offer) => ({
      "@type": "Offer",
      name: t(offer.nameKey, lang),
      description: t(offer.descKey, lang),
      price: String(offer.price),
      priceCurrency: "JPY",
      availability: "https://schema.org/InStock",
      url: ORIGIN + offer.url,
      ...(offer.monthly
        ? { priceSpecification: { "@type": "UnitPriceSpecification", price: String(offer.price), priceCurrency: "JPY", billingDuration: "P1M", unitText: "site" } }
        : {}),
    })),
  };
}

function breadcrumbNode(url, items) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })),
  };
}

function faqNode(url, pairs) {
  return {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: pairs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

function webPageNode({ url, title, description, lang, about }) {
  return {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: langOf(lang).hreflang,
    isPartOf: { "@id": SITE_ID },
    publisher: { "@id": ORG_ID },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    primaryImageOfPage: { "@type": "ImageObject", url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height },
    ...(about ? { about } : {}),
  };
}

/* ------------------------------------------------------------------ *
 * Landing page
 * ------------------------------------------------------------------ */

const TEMPLATE = read("src/lp.html");
const RUNTIME = read("src/lp.js");

function landingPage(lang) {
  const meta = langOf(lang);
  const url = ORIGIN + meta.path;
  const title = t("meta.title", lang);
  const description = t("meta.desc", lang);

  let body = localize(TEMPLATE, lang).replaceAll("{{home}}", meta.path);
  // Mark the page's own language in the switcher.
  body = body.replace(/(<select class="lang"[^>]*>)[\s\S]*?(<\/select>)/, (_all, open, close) =>
    `${open}${LANGS.map((item) => `<option value="${item.code}"${item.code === lang ? " selected" : ""}>${item.label}</option>`).join("")}${close}`);
  // Section links stay on this language's page; site links are absolute already.
  if (!/<h1[\s>]/.test(body) || body.match(/<h1[\s>]/g).length !== 1) throw new Error(`${lang}: the page must have exactly one h1`);

  const faq = FAQ_KEYS.map(([q, a]) => [t(q, lang), t(a, lang)]);
  const graph = [
    organizationNode(),
    websiteNode(),
    webPageNode({ url, title, description, lang, about: { "@id": APP_ID } }),
    breadcrumbNode(url, [{ name: t("nav.home", lang), url }]),
    softwareNode(lang),
    faqNode(url, faq),
  ];

  const strings = {
    lang,
    homes: Object.fromEntries(LANGS.map((item) => [item.code, item.path])),
    checkErr: t("herocheck.err", lang),
    copy: t("install.copy", lang),
    copied: t("install.copied", lang),
  };
  const headHtml = head({
    lang, title, description, url,
    alternates: alternatesFor(LANGS.map((item) => item.code), (code) => langOf(code).path),
    extra: [
      '<link rel="preload" as="image" href="/assets/img/hero-store-1100.webp" imagesrcset="/assets/img/hero-store-640.webp 640w, /assets/img/hero-store-1100.webp 1100w" imagesizes="(max-width:960px) 92vw, 520px" fetchpriority="high">',
      jsonLd(graph),
    ].join("\n"),
  });

  return `<!doctype html>
<html lang="${meta.htmlLang}">
<head>
${headHtml}
</head>
<body>
${body.trim()}
<script>
const STR=${JSON.stringify(strings).replace(/</g, "\\u003c")};
${RUNTIME.trim()}
</script>
<script src="/assets/ai-referral.js" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ *
 * Content pages
 * ------------------------------------------------------------------ */

const ARTICLE_CSS = read("src/article.css");

/** Paragraphs of an answer, as HTML. Copy is plain text; blank lines split paragraphs. */
const paragraphs = (text) => String(text).split(/\n\s*\n/).map((p) => `<p>${esc(p.trim())}</p>`).join("\n");
const inline = (text) => esc(text).replace(/\[([^\]]+)\]\((\/[^)]+)\)/g, '<a href="$2">$1</a>');
const richParagraphs = (items = []) => items.map((item) => `<p>${inline(item)}</p>`).join("\n");
const contentPath = (lang, slug) => `${lang === "en" ? "/guide/" : `/${lang}/guide/`}${slug}/`;
function richSections(copy) {
  return (copy.sections || []).map((section) => `<section class="qa"><h2>${esc(section.heading)}</h2>${richParagraphs(section.paragraphs)}${section.list?.length ? `<ol>${section.list.map((item) => `<li>${inline(item)}</li>`).join("")}</ol>` : ""}${richParagraphs(section.after)}</section>`).join("\n");
}

/** One content page in one language. `copy` is that language's block of the content file. */
function contentPage(page, lang, { draft }) {
  const meta = langOf(lang);
  const copy = page.locales[lang];
  const pathFor = (code) => contentPath(code, page.slug);
  const url = ORIGIN + pathFor(lang);
  const home = ORIGIN + meta.path;
  const published = Object.keys(page.locales).filter((code) => draft || isComplete(page.locales[code]));
  const questions = copy.faqs || copy.questions;
  const faq = questions.map((item) => [item.q, item.a.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\n\s*\n/g, " ")]);
  const graph = [
    organizationNode(),
    websiteNode(),
    webPageNode({ url, title: copy.title, description: copy.description, lang }),
    breadcrumbNode(url, [{ name: t("nav.home", lang), url: home }, { name: lang === "ja" ? "AEOガイド" : "AEO Guides", url: ORIGIN + (lang === "en" ? "/guide/" : `/${lang}/guide/`) }, { name: copy.h1, url }]),
    faqNode(url, faq),
  ];
  const related = (page.related || [])
    .map((slug) => ALL_CONTENT.find((other) => other.slug === slug))
    .filter((other) => other && other.locales[lang] && (draft || isComplete(other.locales[lang])))
    .map((other) => `<li><a href="${contentPath(lang, other.slug)}">${esc(other.locales[lang].h1)}</a></li>`);

  return `<!doctype html>
<html lang="${meta.htmlLang}">
<head>
${head({ lang, title: copy.title, description: copy.description, url, type: "article", noindex: draft, alternates: alternatesFor(published, pathFor), extra: `<style>${ARTICLE_CSS}</style>\n${jsonLd(graph)}` })}
</head>
<body>
<header class="nav"><div class="wrap">
  <a class="brand" href="${meta.path}"><img src="/assets/logo.png" alt="" width="28" height="28">Nurevo</a>
  <a class="btn primary" href="${copy.cta.href}">${esc(copy.cta.label)}</a>
</div></header>
<main class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="${meta.path}">${esc(t("nav.home", lang))}</a> <span aria-hidden="true">›</span> <a href="${lang === "en" ? "/guide/" : `/${lang}/guide/`}">${lang === "ja" ? "AEOガイド" : "AEO Guides"}</a> <span aria-hidden="true">›</span> <span>${esc(copy.h1)}</span></nav>
  <article>
    <h1>${esc(copy.h1)}</h1>
    <p class="lead">${esc(copy.lead)}</p>
${richParagraphs(copy.intro)}
${copy.sections ? richSections(copy) : copy.questions.map((item) => `    <section class="qa">\n      <h2>${esc(item.q)}</h2>\n${paragraphs(item.a)}\n    </section>`).join("\n")}
    <section class="qa"><h2>FAQ</h2>${questions.map((item) => `<h3>${esc(item.q)}</h3>${richParagraphs([item.a])}`).join("\n")}</section>
  </article>
  <aside class="cta">
    <h2>${esc(copy.cta.heading)}</h2>
    <p>${esc(copy.cta.body)}</p>
    <a class="btn primary lg" href="${copy.cta.href}">${esc(copy.cta.label)}</a>
  </aside>
${related.length ? `  <nav class="related" aria-label="${escAttr(copy.relatedHeading)}"><h2>${esc(copy.relatedHeading)}</h2><ul>${related.join("")}</ul></nav>` : ""}
</main>
<footer class="foot"><div class="wrap"><a href="${meta.path}">Nurevo</a> ・ <a href="${lang === "en" ? "/en/terms" : "/terms"}">${esc(t("foot.terms", lang))}</a> ・ <a href="${lang === "en" ? "/en/privacy" : "/privacy"}">${esc(t("foot.privacy", lang))}</a></div></footer>
<script src="/assets/ai-referral.js" defer></script>
</body>
</html>
`;
}

/** A locale block is publishable when every field a visitor would read has copy in it. */
function isComplete(copy) {
  if (!copy) return false;
  const filled = (value) => typeof value === "string" && value.trim() !== "";
  return ["title", "description", "h1", "lead", "relatedHeading"].every((key) => filled(copy[key]))
    && copy.cta && ["heading", "body", "label", "href"].every((key) => filled(copy.cta[key]))
    && Array.isArray(copy.faqs || copy.questions) && (copy.faqs || copy.questions).length > 0
    && (copy.faqs || copy.questions).every((item) => filled(item.q) && filled(item.a));
}

const ALL_CONTENT = [];
for (const file of readdirSync(join(ROOT, "src/content")).filter((name) => name.endsWith(".mjs")).sort()) {
  ALL_CONTENT.push((await import(pathToFileURL(join(ROOT, "src/content", file)).href)).default);
}

/* ------------------------------------------------------------------ *
 * Assemble
 * ------------------------------------------------------------------ */

const files = new Map();
const sitemap = [];

for (const lang of LANGS) {
  files.set(`${lang.path.slice(1)}index.html`, landingPage(lang.code));
}
sitemap.push({
  alternates: alternatesFor(LANGS.map((lang) => lang.code), (code) => langOf(code).path),
  urls: LANGS.map((lang) => ORIGIN + lang.path),
});

const publishedContent = [];
for (const page of ALL_CONTENT) {
  const codes = Object.keys(page.locales).filter((code) => DRAFTS || isComplete(page.locales[code]));
  if (!codes.length) continue;
  const pathFor = (code) => contentPath(code, page.slug);
  for (const code of codes) {
    const draft = !isComplete(page.locales[code]);
    files.set(`${pathFor(code).slice(1)}index.html`, contentPage(page, code, { draft }));
    if (!draft) publishedContent.push({ path: pathFor(code), lang: code, title: page.locales[code].h1, summary: page.locales[code].description });
  }
  const live = codes.filter((code) => isComplete(page.locales[code]));
  if (live.length) sitemap.push({ alternates: alternatesFor(live, pathFor), urls: live.map((code) => ORIGIN + pathFor(code)) });
}

function guideHub(lang) {
  const ja = lang === "ja";
  const path = ja ? "/ja/guide/" : "/guide/";
  const url = ORIGIN + path;
  const pillar = ALL_CONTENT.find((page) => page.slug === "what-is-aeo").locales[lang];
  const planned = ja
    ? ["WordPressのAEO", "llms.txt", "ChatGPTに表示される方法", "AI可視性チェック"]
    : ["AEO for WordPress", "llms.txt", "How to appear in ChatGPT", "AI visibility check"];
  const title = ja ? "AEOガイド | Nurevo" : "AEO Guides | Nurevo";
  const description = ja ? "AIに読まれ、引用されるサイトを作るためのAEOガイド。" : "Practical guides to making your website readable and citable by AI.";
  const extra = `<style>${ARTICLE_CSS}</style>\n${jsonLd([organizationNode(), websiteNode(), webPageNode({ url, title, description, lang }), breadcrumbNode(url, [{ name: title, url }])])}`;
  return `<!doctype html><html lang="${ja ? "ja" : "en"}"><head>${head({ lang, title, description, url, extra })}</head><body><header class="nav"><div class="wrap"><a class="brand" href="${ja ? "/" : "/en/"}"><img src="/assets/logo.png" alt="" width="28" height="28">Nurevo</a><a class="btn primary" href="/check">${ja ? "無料チェック" : "Free check"}</a></div></header><main class="wrap"><article><h1>${ja ? "AEOガイド" : "AEO Guides"}</h1><p class="lead">${ja ? "AIの答えの中で選ばれるための基礎から実装まで。" : "From the fundamentals to implementation: get your business into AI answers."}</p><section class="qa"><h2>${ja ? "まず読む" : "Start here"}</h2><p><a href="${contentPath(lang, "what-is-aeo")}">${esc(pillar.h1)}</a></p></section><section class="qa"><h2>${ja ? "準備中の実践ガイド" : "Practical guides in progress"}</h2><ul>${planned.map((name) => `<li>${esc(name)}</li>`).join("")}</ul></section></article></main><script src="/assets/ai-referral.js" defer></script></body></html>`;
}
for (const code of ["en", "ja"]) {
  const path = code === "en" ? "/guide/" : "/ja/guide/";
  files.set(`${path.slice(1)}index.html`, guideHub(code));
  sitemap.push({ alternates: [], urls: [ORIGIN + path] });
}
for (const page of STATIC_PAGES) sitemap.push({ alternates: [], urls: [ORIGIN + page.path] });

/* ------------------------------------------------------------------ *
 * Hand-written pages: keep their head tags in step
 * ------------------------------------------------------------------ */

const SEO_OPEN = "<!-- seo:generated by scripts/build-site.mjs - do not edit between these markers -->";
const SEO_CLOSE = "<!-- /seo -->";
const BEACON = '<script src="/assets/ai-referral.js" defer></script>';
const unescape = (value) => value.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/** The page's own title and description stay where they are; this adds what was missing around them. */
function withSeoBlock(source, page) {
  const title = unescape((source.match(/<title>([^<]*)<\/title>/) || [])[1] || "");
  const description = unescape((source.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "");
  if (!title || !description) throw new Error(`${page.file}: needs a <title> and a meta description`);
  const url = ORIGIN + page.path;
  const meta = langOf(page.lang);
  const home = ORIGIN + meta.path;
  const block = [
    SEO_OPEN,
    `<link rel="canonical" href="${escAttr(url)}">`,
    '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Nurevo">',
    `<meta property="og:title" content="${escAttr(title)}">`,
    `<meta property="og:description" content="${escAttr(description)}">`,
    `<meta property="og:url" content="${escAttr(url)}">`,
    `<meta property="og:image" content="${OG_IMAGE.url}">`,
    `<meta property="og:image:width" content="${OG_IMAGE.width}">`,
    `<meta property="og:image:height" content="${OG_IMAGE.height}">`,
    `<meta property="og:locale" content="${meta.ogLocale}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escAttr(title)}">`,
    `<meta name="twitter:description" content="${escAttr(description)}">`,
    `<meta name="twitter:image" content="${OG_IMAGE.url}">`,
    jsonLd([
      organizationNode(),
      websiteNode(),
      webPageNode({ url, title, description, lang: page.lang }),
      breadcrumbNode(url, [{ name: t("nav.home", page.lang), url: home }, { name: page.title, url }]),
    ]),
    SEO_CLOSE,
  ].join("\n");
  let html = source;
  const start = html.indexOf(SEO_OPEN);
  if (start !== -1) html = html.slice(0, start) + html.slice(html.indexOf(SEO_CLOSE, start) + SEO_CLOSE.length).replace(/^\n/, "");
  if (!html.includes("</head>")) throw new Error(`${page.file}: has no </head>`);
  html = html.replace("</head>", `${block}\n</head>`);
  if (!html.includes(BEACON)) html = html.replace("</body>", `${BEACON}\n</body>`);
  return html;
}

for (const page of STATIC_PAGES.filter((item) => item.file)) {
  files.set(page.file, withSeoBlock(readFileSync(join(ROOT, "public", page.file), "utf8"), page));
}

const xml = (value) => esc(value).replace(/"/g, "&quot;");
files.set("sitemap-pages.xml", [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...sitemap.flatMap((group) => group.urls.map((loc) => [
    "  <url>",
    `    <loc>${xml(loc)}</loc>`,
    ...group.alternates.map((alt) => `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${xml(alt.url)}"/>`),
    "  </url>",
  ].join("\n"))),
  "</urlset>",
  "",
].join("\n"));

// What the worker's /llms.txt lists above the hosted stores. It is fetched from
// here so the page list cannot drift from what the build actually published.
files.set("llms-pages.json", `${JSON.stringify({
  home: LANGS.map((lang) => ({ lang: lang.hreflang, url: ORIGIN + lang.path, title: t("meta.title", lang.code) })),
  pages: [...publishedContent, ...STATIC_PAGES.filter((page) => page.summary)]
    .map((page) => ({ lang: langOf(page.lang).hreflang, url: ORIGIN + page.path, title: page.title, summary: page.summary })),
}, null, 1)}\n`);

files.set("assets/ai-referral.js", `var ENGINES=${JSON.stringify(AI_REFERRERS)};\n${read("src/ai-referral.js")}`);

let stale = 0;
for (const [name, content] of files) {
  const target = join(OUT, name);
  if (CHECK) {
    if (!existsSync(target) || readFileSync(target, "utf8") !== content) { stale += 1; console.error(`out of date: ${name}`); }
    continue;
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}
if (CHECK && stale) { console.error(`${stale} generated file(s) differ from the source. Run: npm run build`); process.exit(1); }
console.log(`${CHECK ? "checked" : "built"} ${files.size} files (${LANGS.length} languages, ${publishedContent.length} content pages${DRAFTS ? ", drafts included" : ""})`);
