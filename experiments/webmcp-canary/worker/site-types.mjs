/**
 * Site types: what kind of business a site is, and what that changes.
 *
 *   local  a business people visit or call (the default, and everything Nurevo
 *          did before site types existed). LocalBusiness, name / address /
 *          phone / hours, "近くの◯◯" questions, the Google Maps check.
 *   ec     an online shop. OnlineStore + Product / Offer from the synced
 *          catalogue; no address or opening hours are required.
 *   b2b    B2B, SaaS and professional services sold to companies. Organization
 *          + Service / SoftwareApplication from the services the owner entered;
 *          no address or opening hours are required.
 *
 * The rule that keeps existing customers safe: anything that is not "ec" or
 * "b2b" is "local", and every local code path is the one that existed before -
 * nothing in this module is consulted for a local site. scripts/test-site-types
 * compares the local diagnosis with golden output captured from main.
 *
 * Never fabricate: every node and property built here comes from a value the
 * owner entered or the shop's own catalogue (WooCommerce). A rating appears only
 * when the catalogue carries a real rating with a real review count.
 *
 * See docs/industries.md for the reasoning and the sources.
 */

// A function declaration, so the import cycle with aeo-score.mjs is safe.
import { schemaFieldPresent } from "./aeo-score.mjs";

export const SITE_TYPES = Object.freeze(["local", "ec", "b2b"]);
export const DEFAULT_SITE_TYPE = "local";

/** Any input to one of SITE_TYPES; unknown, empty and null are "local". */
export function normalizeSiteType(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "ec" || raw === "ecommerce" || raw === "shop" || raw === "online_store") return "ec";
  if (raw === "b2b" || raw === "saas" || raw === "btob") return "b2b";
  return DEFAULT_SITE_TYPE;
}

/** True for a value that names a site type exactly (used to validate writes). */
export function isSiteType(value) {
  return SITE_TYPES.includes(String(value ?? ""));
}

export const isTypedSite = (siteType) => normalizeSiteType(siteType) !== "local";

/* ------------------------------------------------------------------ *
 * Reading published JSON-LD for a typed site
 * ------------------------------------------------------------------ */

const typesOf = (node) => [node?.["@type"]].flat().filter(Boolean).map((t) => String(t).toLowerCase());

/**
 * Every typed object in a JSON-LD tree, nested ones included.
 *
 * The local scorer reads top-level nodes only (and must keep doing so). A shop's
 * products are normally nested - OnlineStore.hasOfferCatalog.itemListElement,
 * or Offer.itemOffered - so a typed diagnosis walks the whole tree.
 */
export function deepSchemaNodes(nodes, limit = 500) {
  const out = [];
  const seen = new Set();
  const walk = (value, depth) => {
    if (out.length >= limit || depth > 12 || value == null || typeof value !== "object") return;
    if (Array.isArray(value)) { value.forEach((item) => walk(item, depth + 1)); return; }
    if (seen.has(value)) return;
    seen.add(value);
    if (value["@type"]) out.push(value);
    for (const [key, child] of Object.entries(value)) if (!key.startsWith("@") || key === "@graph") walk(child, depth + 1);
  };
  walk(nodes, 0);
  return out;
}

/** Organization and its subtypes a typed site uses as its identity node. */
const ORGANIZATION_TYPES = new Set([
  "organization", "corporation", "onlinestore", "onlinebusiness", "localbusiness", "store", "professionalservice",
  "ngo", "educationalorganization", "medicalorganization", "sportsorganization", "newsmediaorganization",
]);
const PRODUCT_TYPES = new Set(["product", "productmodel", "productgroup", "individualproduct"]);
const SOFTWARE_TYPES = new Set(["softwareapplication", "webapplication", "mobileapplication"]);
const SERVICE_TYPES = new Set(["service", "professionalservice", "financialproduct"]);

const isOrganization = (node) => typesOf(node).some((t) => ORGANIZATION_TYPES.has(t)) && !typesOf(node).some((t) => PRODUCT_TYPES.has(t));
const isProduct = (node) => typesOf(node).some((t) => PRODUCT_TYPES.has(t));
const isSoftware = (node) => typesOf(node).some((t) => SOFTWARE_TYPES.has(t));
const isService = (node) => typesOf(node).some((t) => t === "service");

/** Any way of reaching the business: email, telephone or a ContactPoint. */
function hasContact(node, nodes) {
  if (!node || typeof node !== "object") return false;
  if (schemaFieldPresent(node, "email", nodes) || schemaFieldPresent(node, "telephone", nodes)) return true;
  const points = [node.contactPoint].flat().filter(Boolean);
  return points.some((point) => ["email", "telephone", "url"].some((key) => schemaFieldPresent(point, key, nodes)));
}

/** Pseudo-fields with their own presence rule; everything else is schemaFieldPresent. */
const PSEUDO_FIELDS = {
  contactPoint: hasContact,
  // Logo, or any image standing in for one.
  logo: (node, nodes) => schemaFieldPresent(node, "logo", nodes) || schemaFieldPresent(node, "image", nodes),
};

function fieldPresent(node, field, nodes) {
  return PSEUDO_FIELDS[field] ? PSEUDO_FIELDS[field](node, nodes) : schemaFieldPresent(node, field, nodes);
}

/**
 * The properties a typed site is scored on, per entity.
 *
 * Deliberately short: each one is a property Google documents for that type
 * (Organization, Product / merchant listing, Service, SoftwareApplication) AND
 * one Nurevo can actually publish from data the owner has. brand, gtin and
 * aggregateRating are published when real data exists but are not scored -
 * a shop with no reviews yet must not lose points for not inventing any.
 */
export const TYPED_SCHEMA_FIELDS = Object.freeze({
  ec: Object.freeze({
    Organization: ["name", "url", "contactPoint", "hasMerchantReturnPolicy"],
    Product: ["name", "image", "offers.price", "offers.priceCurrency", "offers.availability"],
    WebSite: ["name", "url"],
    FAQPage: ["mainEntity"],
  }),
  b2b: Object.freeze({
    Organization: ["name", "url", "description", "contactPoint", "logo"],
    Service: ["name", "description", "provider"],
    SoftwareApplication: ["name", "description", "applicationCategory"],
    WebSite: ["name", "url"],
    FAQPage: ["mainEntity"],
  }),
});

/**
 * Field list for a typed site, in the same shape the local scorer produces
 * ({entityType, field, weight, present}), so every reader - the checklist, the
 * fix list, the monthly report - handles it without knowing about site types.
 */
export function typedSchemaFields(nodes, siteType) {
  const type = normalizeSiteType(siteType);
  const definition = TYPED_SCHEMA_FIELDS[type];
  if (!definition) return [];
  const all = deepSchemaNodes(nodes);
  const matchers = {
    Organization: isOrganization,
    Product: isProduct,
    Service: isService,
    SoftwareApplication: isSoftware,
    WebSite: (node) => typesOf(node).includes("website"),
    FAQPage: (node) => typesOf(node).includes("faqpage"),
  };
  let entities = Object.keys(definition);
  if (type === "b2b") {
    // One offering family: software when the site publishes software, a service
    // otherwise (also when it publishes nothing yet - that is the gap to show).
    const software = all.some(isSoftware);
    entities = entities.filter((entity) => (software ? entity !== "Service" : entity !== "SoftwareApplication"));
  }
  return entities.flatMap((entityType) => {
    const matched = all.filter(matchers[entityType]);
    // The identity node is one entity: judge the most complete one rather than
    // requiring every Organization-like node (a publisher stub, a brand) to
    // carry a return policy.
    const judged = entityType === "Organization" && matched.length > 1
      ? [matched.slice().sort((a, b) => Object.keys(b).length - Object.keys(a).length)[0]]
      : matched;
    return definition[entityType].map((field) => ({
      entityType, field, weight: 1,
      present: judged.length > 0 && judged.every((node) => fieldPresent(node, field, all)),
    }));
  });
}

/* ------------------------------------------------------------------ *
 * What the page offers beyond markup: policies, pricing, proof
 * ------------------------------------------------------------------ */

const LINK_PATTERNS = Object.freeze({
  return_policy: /返品|返金|交換|キャンセル|return|refund|retour|rembourse|devoluci|reembolso|rückgabe|widerruf|erstattung|退货|退貨|退款|반품|환불/i,
  shipping_policy: /配送|送料|発送|お届け|shipping|delivery|livraison|envío|envio|versand|lieferung|运费|運費|配送|배송/i,
  contact: /お問い?合わ?せ|問合せ|特定商取引|会社概要|contact|impressum|kontakt|legal notice|mentions légales|aviso legal|联系|聯絡|문의|연락/i,
  pricing: /料金|価格|プラン|費用|pricing|prices|plans|tarif|precio|preise|kosten|价格|價格|定价|요금|가격/i,
  proof: /導入事例|事例|実績|お客様の声|case.?stud|customer.?stor|success.?stor|testimonial|références|casos de éxito|referenzen|kundenstimmen|案例|客户|사례|고객 후기|よくある質問|\bfaq\b/i,
  identity: /会社概要|企業情報|会社案内|about|company|über uns|à propos|quiénes somos|sobre nosotros|关于我们|關於我們|회사 소개/i,
});

/** Anchor texts and hrefs on the page, lower-cased. */
export function pageLinks(html = "") {
  const links = [];
  for (const match of String(html).matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
    const href = (match[1].match(/\bhref\s*=\s*["']([^"']*)["']/i) || [])[1] || "";
    const text = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    links.push({ href: href.toLowerCase(), text: text.toLowerCase() });
    if (links.length >= 1000) break;
  }
  return links;
}

const linked = (links, id) => links.some((link) => LINK_PATTERNS[id].test(link.text) || LINK_PATTERNS[id].test(decodeSafe(link.href)));
function decodeSafe(value) { try { return decodeURIComponent(value); } catch { return value; } }
const pageWithRole = (catalog, role) => (Array.isArray(catalog?.pages) ? catalog.pages : []).some((page) => page?.role === role && String(page.url || "").trim());

/** The requirement ids per type, in display order. */
export const SITE_REQUIREMENTS = Object.freeze({
  ec: Object.freeze(["product_offers", "return_policy", "shipping_policy", "contact"]),
  b2b: Object.freeze(["service_descriptions", "pricing", "proof", "identity"]),
});

/**
 * Site-level requirements for a typed site: [{id, present, via}].
 *
 * `via` says what satisfied it ("schema", "catalog", "page_role", "link"), so
 * nothing is credited without saying why. Read from the page's own HTML and
 * JSON-LD and from the synced catalogue only; no other page is fetched.
 */
export function siteRequirements({ siteType, html = "", nodes = [], catalog = null } = {}) {
  const type = normalizeSiteType(siteType);
  const ids = SITE_REQUIREMENTS[type];
  if (!ids) return [];
  const all = deepSchemaNodes(nodes);
  const links = pageLinks(html);
  const org = all.filter(isOrganization);
  const checks = {
    product_offers: () => {
      if (all.filter(isProduct).some((node) => schemaFieldPresent(node, "offers.price", all) && schemaFieldPresent(node, "offers.availability", all))) return "schema";
      const products = Array.isArray(catalog?.products) ? catalog.products : [];
      if (products.some((p) => String(p?.price ?? "").trim() !== "" && (p?.in_stock === true || p?.in_stock === false))) return "catalog";
      return null;
    },
    return_policy: () => {
      if (all.some((node) => schemaFieldPresent(node, "hasMerchantReturnPolicy", all))) return "schema";
      if (pageWithRole(catalog, "return_policy")) return "page_role";
      return linked(links, "return_policy") ? "link" : null;
    },
    shipping_policy: () => {
      if (all.some((node) => schemaFieldPresent(node, "hasShippingService", all) || schemaFieldPresent(node, "offers.shippingDetails", all))) return "schema";
      if (pageWithRole(catalog, "shipping_policy")) return "page_role";
      return linked(links, "shipping_policy") ? "link" : null;
    },
    contact: () => {
      if (org.some((node) => hasContact(node, all))) return "schema";
      return linked(links, "contact") ? "link" : null;
    },
    service_descriptions: () => {
      if (all.filter((node) => isService(node) || isSoftware(node)).some((node) => schemaFieldPresent(node, "description", all))) return "schema";
      const services = Array.isArray(catalog?.services) ? catalog.services : [];
      return services.some((s) => String(s?.description || "").trim()) ? "catalog" : null;
    },
    pricing: () => {
      if (pageWithRole(catalog, "pricing")) return "page_role";
      return linked(links, "pricing") ? "link" : null;
    },
    proof: () => {
      if (all.some((node) => typesOf(node).includes("faqpage") && schemaFieldPresent(node, "mainEntity", all))) return "schema";
      if (pageWithRole(catalog, "case_studies")) return "page_role";
      return linked(links, "proof") ? "link" : null;
    },
    identity: () => {
      if (org.some((node) => schemaFieldPresent(node, "name", all) && schemaFieldPresent(node, "url", all)
        && (schemaFieldPresent(node, "logo", all) || schemaFieldPresent(node, "sameAs", all)))) return "schema";
      return linked(links, "identity") ? "link" : null;
    },
  };
  return ids.map((id) => {
    const via = checks[id]();
    return { id, present: via !== null, ...(via ? { via } : {}) };
  });
}

/** Text a reader of a typed site expects to find in the page body. */
const FACT_TEXT = Object.freeze({
  ec: [/(¥|￥|円|\$|€|£|税込|price|価格|prix|precio|preis|价格|價格|가격)/i, LINK_PATTERNS.shipping_policy, LINK_PATTERNS.return_policy, LINK_PATTERNS.contact],
  b2b: [/(サービス|service|solution|ソリューション|製品|機能|feature|leistung|servicio|服务|服務|서비스)/i, LINK_PATTERNS.pricing, LINK_PATTERNS.proof, /(お問い?合わ?せ|資料請求|デモ|無料トライアル|contact|demo|trial|kontakt|démo|prueba|联系|聯絡|문의)/i],
});

export function typedFactsInText(visible, siteType, minFactText = 20) {
  const patterns = FACT_TEXT[normalizeSiteType(siteType)] || [];
  const tests = [String(visible).trim().length >= minFactText, ...patterns.map((pattern) => pattern.test(visible))];
  return tests.filter(Boolean).length / tests.length;
}

/** The fourth llms.txt quality test for a typed site (the local one looks for an address). */
const LLMS_FACTS = Object.freeze({
  ec: /(商品|products?|price|価格|送料|shipping|返品|returns?|produits?|productos?|produkte|商品|产品|產品|상품)/i,
  b2b: /(サービス|services?|料金|pricing|導入事例|case stud|会社|company|about|leistungen|servicios|服务|服務|서비스)/i,
});
export function typedLlmsFacts(llms, siteType) {
  const pattern = LLMS_FACTS[normalizeSiteType(siteType)];
  return pattern ? pattern.test(String(llms)) : false;
}
