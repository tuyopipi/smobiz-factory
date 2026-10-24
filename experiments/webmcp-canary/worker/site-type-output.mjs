/**
 * What the worker publishes for an online shop (ec) or a B2B site (b2b):
 * the business node's type and properties, the catalogue nodes beside it and
 * llms.txt. Local sites never reach this module (see site-types.mjs).
 *
 * Everything comes from the owner's profile or the catalogue the plugin synced
 * (site_products / site_services / site_pages). No property is filled with a
 * guess: a product without a price gets no Offer, a product without reviews
 * gets no rating, a service without a description gets no description.
 */
import { normalizeSiteType } from "./site-types.mjs";

/** schema.org types a configured business_type_schema may keep, per site type. */
const EC_TYPES = new Set(["OnlineStore", "OnlineBusiness", "Organization", "Corporation"]);
const B2B_TYPES = new Set([
  "Organization", "Corporation", "OnlineBusiness", "ProfessionalService", "LegalService", "AccountingService",
  "FinancialService", "EmploymentAgency", "InsuranceAgency", "NGO", "EducationalOrganization", "ResearchOrganization",
]);

/**
 * The @type for a typed site's business node. The owner's own type is kept when
 * it fits the site type; otherwise OnlineStore (Google recommends the most
 * specific Organization subtype, and OnlineStore for e-commerce) or
 * Organization.
 */
export function typedBusinessType(siteType, configured) {
  const type = normalizeSiteType(siteType);
  const value = String(configured || "").trim();
  if (type === "ec") return EC_TYPES.has(value) ? value : "OnlineStore";
  if (type === "b2b") return B2B_TYPES.has(value) ? value : "Organization";
  return value || "LocalBusiness";
}

/**
 * Properties that describe a place people visit. Organization has no
 * openingHours, and a shop with no counter has no geo, price range or
 * table reservation; they are dropped even when the profile holds them.
 */
export const NON_LOCAL_DROPPED_PROPS = Object.freeze(["openingHours", "openingHoursSpecification", "geo", "priceRange", "potentialAction"]);

export function typedBusinessNode(node, siteType) {
  if (!node || typeof node !== "object") return node;
  const out = { ...node, "@type": typedBusinessType(siteType, node["@type"]) };
  for (const key of NON_LOCAL_DROPPED_PROPS) delete out[key];
  return out;
}

const text = (value, max = 2000) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const httpUrl = (value) => (/^https?:\/\/[^\s]+$/i.test(text(value)) ? text(value) : "");

/** A page the owner pointed at for a role ("return_policy", "pricing" ...). */
export function rolePage(catalog, role) {
  const page = (Array.isArray(catalog?.pages) ? catalog.pages : []).find((p) => p?.role === role && httpUrl(p.url));
  return page ? httpUrl(page.url) : "";
}

/**
 * hasMerchantReturnPolicy for an online shop, when the owner gave a return
 * policy page. Google accepts merchantReturnLink alone as a return policy
 * ("Option B" in its MerchantReturnPolicy documentation); nothing else about
 * the policy is stated, because nothing else is known.
 */
export function returnPolicyProps(siteType, catalog) {
  if (normalizeSiteType(siteType) !== "ec") return {};
  const link = rolePage(catalog, "return_policy");
  return link ? { hasMerchantReturnPolicy: { "@type": "MerchantReturnPolicy", merchantReturnLink: link } } : {};
}

const MAX_PRODUCT_NODES = 30;

/** One synced product as a Product, with an Offer only when it has a price. */
export function productNode(product) {
  const name = text(product?.name, 200);
  if (!name) return null;
  const node = { "@type": "Product", name };
  const url = httpUrl(product.url);
  if (url) node.url = url;
  if (text(product.sku, 120)) node.sku = text(product.sku, 120);
  if (httpUrl(product.image)) node.image = httpUrl(product.image);
  if (text(product.description, 500)) node.description = text(product.description, 500);
  if (text(product.brand, 120)) node.brand = { "@type": "Brand", name: text(product.brand, 120) };
  const rating = Number(product.rating_value);
  const reviews = Number(product.review_count);
  // Real reviews only: a rating needs a value in range AND at least one review.
  if (Number.isFinite(rating) && rating > 0 && rating <= 5 && Number.isInteger(reviews) && reviews > 0) {
    node.aggregateRating = { "@type": "AggregateRating", ratingValue: rating, reviewCount: reviews };
  }
  const price = text(product.price, 60);
  if (price !== "") {
    const offer = { "@type": "Offer", price };
    if (text(product.currency, 12)) offer.priceCurrency = text(product.currency, 12).toUpperCase();
    if (product.in_stock === true) offer.availability = "https://schema.org/InStock";
    else if (product.in_stock === false) offer.availability = "https://schema.org/OutOfStock";
    if (url) offer.url = url;
    node.offers = offer;
  }
  return node;
}

/** One entered service as a Service or SoftwareApplication. */
export function serviceNode(service, { id, providerId } = {}) {
  const name = text(service?.name, 200);
  if (!name) return null;
  const software = service.kind === "software";
  const node = { "@type": software ? "SoftwareApplication" : "Service", ...(id ? { "@id": id } : {}), name };
  if (text(service.description, 1000)) node.description = text(service.description, 1000);
  const url = httpUrl(service.url);
  if (url) node.url = url;
  const category = text(service.category, 120);
  if (category) node[software ? "applicationCategory" : "serviceType"] = category;
  if (providerId) node.provider = { "@id": providerId };
  const price = text(service.price, 60);
  if (price !== "") {
    node.offers = { "@type": "Offer", price, ...(text(service.currency, 12) ? { priceCurrency: text(service.currency, 12).toUpperCase() } : {}) };
  }
  return node;
}

/**
 * Nodes published beside a typed business node.
 *
 *   ec   one OfferCatalog (hasOfferCatalog of the store) listing the synced
 *        products. Product markup for rich results belongs on each product
 *        page - WooCommerce prints it there; this list is for readers of the
 *        front page and is not a substitute.
 *   b2b  one Service / SoftwareApplication per entered service.
 *
 * Returns { nodes, businessProps } - businessProps are added to the business
 * node (the catalogue reference, the return policy).
 */
export function typedCatalogNodes({ siteType, catalog, base, businessId, name = "" } = {}) {
  const type = normalizeSiteType(siteType);
  const nodes = [];
  const businessProps = { ...returnPolicyProps(type, catalog) };
  if (!base) return { nodes, businessProps };
  if (type === "ec") {
    const products = (Array.isArray(catalog?.products) ? catalog.products : []).map(productNode).filter(Boolean).slice(0, MAX_PRODUCT_NODES);
    if (products.length) {
      const id = `${base}#offer-catalog`;
      nodes.push({ "@context": "https://schema.org", "@type": "OfferCatalog", "@id": id, ...(name ? { name } : {}), numberOfItems: products.length, itemListElement: products });
      businessProps.hasOfferCatalog = { "@id": id };
    }
  } else if (type === "b2b") {
    (Array.isArray(catalog?.services) ? catalog.services : []).forEach((service, index) => {
      const node = serviceNode(service, { id: `${base}#service-${index + 1}`, providerId: businessId });
      if (node) nodes.push({ "@context": "https://schema.org", ...node });
    });
  }
  return { nodes, businessProps };
}

/* ------------------------------------------------------------------ *
 * llms.txt
 * ------------------------------------------------------------------ */

const LLMS_WORDING = Object.freeze({
  ja: { shop: "## ショップ情報", company: "## 会社情報", products: "## 商品", services: "## サービス", website: "サイト", email: "メール", phone: "電話", address: "所在地", returns: "返品・返金", shipping: "配送・送料", pricing: "料金", cases: "導入事例", inStock: "在庫あり", outOfStock: "在庫なし", crawlers: "## 対応AIクローラー" },
  en: { shop: "## Shop information", company: "## Company information", products: "## Products", services: "## Services", website: "Website", email: "Email", phone: "Phone", address: "Address", returns: "Returns and refunds", shipping: "Shipping", pricing: "Pricing", cases: "Case studies", inStock: "in stock", outOfStock: "out of stock", crawlers: "## Supported AI crawlers" },
  zh: { shop: "## 店铺信息", company: "## 公司信息", products: "## 商品", services: "## 服务", website: "网站", email: "邮箱", phone: "电话", address: "地址", returns: "退货与退款", shipping: "配送", pricing: "价格", cases: "客户案例", inStock: "有货", outOfStock: "缺货", crawlers: "## 支持的AI爬虫" },
  "zh-TW": { shop: "## 商店資訊", company: "## 公司資訊", products: "## 商品", services: "## 服務", website: "網站", email: "電子郵件", phone: "電話", address: "地址", returns: "退貨與退款", shipping: "配送", pricing: "價格", cases: "客戶案例", inStock: "有庫存", outOfStock: "缺貨", crawlers: "## 支援的AI爬蟲" },
  ko: { shop: "## 쇼핑몰 정보", company: "## 회사 정보", products: "## 상품", services: "## 서비스", website: "웹사이트", email: "이메일", phone: "전화", address: "주소", returns: "반품·환불", shipping: "배송", pricing: "요금", cases: "도입 사례", inStock: "재고 있음", outOfStock: "품절", crawlers: "## 지원하는 AI 크롤러" },
  es: { shop: "## Información de la tienda", company: "## Información de la empresa", products: "## Productos", services: "## Servicios", website: "Sitio web", email: "Email", phone: "Teléfono", address: "Dirección", returns: "Devoluciones y reembolsos", shipping: "Envíos", pricing: "Precios", cases: "Casos de éxito", inStock: "en stock", outOfStock: "agotado", crawlers: "## Rastreadores de IA admitidos" },
  fr: { shop: "## Informations sur la boutique", company: "## Informations sur l’entreprise", products: "## Produits", services: "## Services", website: "Site web", email: "E-mail", phone: "Téléphone", address: "Adresse", returns: "Retours et remboursements", shipping: "Livraison", pricing: "Tarifs", cases: "Études de cas", inStock: "en stock", outOfStock: "en rupture", crawlers: "## Robots d’IA pris en charge" },
  de: { shop: "## Shop-Informationen", company: "## Unternehmensinformationen", products: "## Produkte", services: "## Leistungen", website: "Website", email: "E-Mail", phone: "Telefon", address: "Adresse", returns: "Rückgabe und Erstattung", shipping: "Versand", pricing: "Preise", cases: "Fallstudien", inStock: "auf Lager", outOfStock: "nicht vorrätig", crawlers: "## Unterstützte KI-Crawler" },
});

const line = (value) => text(value, 500).replace(/[\r\n]+/g, " ");

/**
 * llms.txt for a typed site: identity, the shop's or company's facts, the
 * products or services, the crawler list. Only lines with a value are written.
 */
export function typedLlmsTxt({ siteType, values = {}, catalog = null, lang = "ja", crawlerNames = "" } = {}) {
  const type = normalizeSiteType(siteType);
  const w = LLMS_WORDING[lang] || LLMS_WORDING.en;
  let canonical = values.url;
  try { if (canonical) canonical = new URL(/^https?:\/\//i.test(canonical) ? canonical : `https://${canonical}`).href; } catch { canonical = ""; }
  const sections = [];
  const name = line(values.name || values.url);
  const identity = [name ? `# ${name}` : null, line(values.description) ? `> ${line(values.description)}` : null].filter(Boolean);
  if (identity.length) sections.push(identity.join("\n"));
  const facts = [
    [w.website, canonical], [w.email, values.email], [w.phone, values.tel ?? values.phone], [w.address, values.address],
    ...(type === "ec"
      ? [[w.returns, rolePage(catalog, "return_policy")], [w.shipping, rolePage(catalog, "shipping_policy")]]
      : [[w.pricing, rolePage(catalog, "pricing")], [w.cases, rolePage(catalog, "case_studies")]]),
  ].filter(([, value]) => line(value)).map(([label, value]) => `- ${label}: ${line(value)}`);
  if (facts.length) sections.push([type === "ec" ? w.shop : w.company, ...facts].join("\n"));
  if (type === "ec") {
    const products = (Array.isArray(catalog?.products) ? catalog.products : []).filter((p) => line(p?.name)).slice(0, 50).map((p) => {
      const label = httpUrl(p.url) ? `[${line(p.name)}](${httpUrl(p.url)})` : line(p.name);
      const notes = [
        line(p.price) ? `${line(p.currency)} ${line(p.price)}`.trim() : null,
        p.in_stock === true ? w.inStock : p.in_stock === false ? w.outOfStock : null,
        line(p.brand) || null,
        Array.isArray(p.categories) && p.categories.length ? p.categories.map(line).filter(Boolean).join(" / ") : null,
      ].filter(Boolean);
      return `- ${label}${notes.length ? ` — ${notes.join(" · ")}` : ""}`;
    });
    if (products.length) sections.push([w.products, ...products].join("\n"));
  } else {
    const services = (Array.isArray(catalog?.services) ? catalog.services : []).filter((s) => line(s?.name)).slice(0, 50).map((s) => {
      const label = httpUrl(s.url) ? `[${line(s.name)}](${httpUrl(s.url)})` : line(s.name);
      const notes = [line(s.description) || null, line(s.price) ? `${line(s.currency)} ${line(s.price)}`.trim() : null, line(s.category) || null].filter(Boolean);
      return `- ${label}${notes.length ? ` — ${notes.join(" · ")}` : ""}`;
    });
    if (services.length) sections.push([w.services, ...services].join("\n"));
  }
  if (crawlerNames) sections.push(`${w.crawlers}\n${crawlerNames}`);
  return sections.join("\n\n") + "\n";
}
