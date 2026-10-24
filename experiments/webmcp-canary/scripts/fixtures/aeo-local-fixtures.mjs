/**
 * Pages diagnosed by scripts/test-site-types.mjs to prove that adding site
 * types (local / ec / b2b) left the local diagnosis exactly as it was.
 *
 * aeo-local.golden.json holds what the scorer returned for each case on
 * origin/main before site types existed (generated once with
 * scripts/fixtures/generate-aeo-local-golden.mjs). Each case runs with no
 * siteType and with siteType "local"; both must match the golden output field
 * for field. Do not regenerate the golden file to make a failing test pass:
 * a difference here is a change to every existing customer's score.
 */
import { ENTITY_SCHEMA_FIELDS } from "../../worker/aeo-fields.mjs";
import { INITIAL_AEO_RULESET } from "../../worker/aeo-rules.mjs";

const crawlersOk = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "PerplexityBot", "Google-Extended", "Applebot-Extended"]
  .map((bot) => `User-agent: ${bot}\nAllow: /`).join("\n\n");
const ld = (value) => `<script type="application/ld+json">${JSON.stringify(value)}</script>`;

const sushi = `<!doctype html><html><head><title>鮨なみ</title><meta name="last-modified" content="2026-10-01">
<link rel="canonical" href="https://example.com"><script type="application/ld+json">{
"@context":"https://schema.org","@type":"Restaurant","name":"鮨なみ","url":"https://example.com",
"address":"東京都千代田区1-1","telephone":"03-1234-5678","openingHours":"Mo-Su 11:00-22:00",
"geo":{"latitude":35,"longitude":139},"hasMenu":"https://example.com/menu","priceRange":"¥¥","serviceType":"飲食"
}</script></head><body><h1>鮨なみ</h1><h2>店舗情報</h2><p>住所: 東京都千代田区1-1 電話: 03-1234-5678 営業時間: 月曜 11:00-22:00 公式サイト https://example.com 緯度35 経度139</p><h2>FAQ よくある質問</h2><p>メニューとサービス、価格 ¥¥ を掲載しています。</p></body></html>`;
const sushiLlms = "# 鮨なみ\n\n公式情報です。店舗とメニューを案内します。\n- URL: https://example.com\n- 住所: 東京都千代田区1-1\n- 電話: 03-1234-5678\n- 営業時間: 11:00-22:00\n";

const salon = `<!doctype html><html><head><title>Lumina Hair</title></head><body><h1>Lumina Hair</h1><h2>Salon</h2>
<p>Address: 12 High Street, Leeds. Phone: +44 113 496 0000. Opening hours: Monday to Saturday 9:00-18:00.</p>
${ld({ "@context": "https://schema.org", "@graph": [
  { "@type": "HairSalon", "@id": "https://lumina.example/#biz", name: "Lumina Hair", url: "https://lumina.example/",
    address: { "@type": "PostalAddress", streetAddress: "12 High Street", addressLocality: "Leeds" }, telephone: "+44 113 496 0000",
    openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: "https://schema.org/Monday", opens: "09:00", closes: "18:00" }] },
  { "@type": "WebSite", name: "Lumina Hair", url: "https://lumina.example/" },
] })}</body></html>`;

const product = { "@type": "Product", name: "Tea", image: "https://example.com/tea.jpg", description: "Green tea", brand: { name: "Tea farm" }, sku: "T1",
  offers: { "@type": "Offer", price: 0, priceCurrency: "JPY", availability: "https://schema.org/InStock" }, aggregateRating: { ratingValue: 4, ratingCount: 2 } };
const teaNodes = [product, { "@type": "WebSite", name: "Tea shop", url: "https://example.com" }, { "@type": "Organization", sameAs: ["https://example.com/about"] },
  { "@type": "FAQPage", mainEntity: [{ name: "Shipping?", acceptedAnswer: { text: "Free" } }] }];
const graph = (nodes) => `<h1>Tea</h1><h2>Green tea</h2>${ld({ "@graph": nodes })}`;

const software = { "@type": ["SoftwareApplication"], name: "Nurevo", description: "AEO tool", applicationCategory: "BusinessApplication", operatingSystem: "WordPress",
  offers: [{ "@type": "Offer", price: 0, priceCurrency: "JPY" }, { "@type": "Offer", price: 3000, priceCurrency: "JPY" }] };

const v1Schema = INITIAL_AEO_RULESET.definition.schema;

export const LOCAL_FIXTURES = Object.freeze([
  { id: "sushi-full", html: sushi, robots: crawlersOk, llms: sushiLlms, options: { llmsPresent: true } },
  { id: "sushi-blocked", html: sushi, robots: "User-agent: OAI-SearchBot\nDisallow: /", llms: sushiLlms, options: { llmsPresent: true } },
  { id: "sushi-no-llms", html: sushi, robots: crawlersOk, llms: "", options: { llmsPresent: false } },
  { id: "sushi-ruleset-v1", html: sushi, robots: crawlersOk, llms: sushiLlms, options: { llmsPresent: true, schemaRules: v1Schema } },
  { id: "sushi-scored-props", html: sushi, robots: crawlersOk, llms: sushiLlms, options: { llmsPresent: true, scoredProps: ["name", "url", "address", "telephone", "openingHours", "geo", "image"] } },
  { id: "salon-graph", html: salon, robots: crawlersOk, llms: "# Lumina Hair\n\n- Address: 12 High Street\n- Phone: +44 113 496 0000\n- Hours: Mon-Sat 9-18\nhttps://lumina.example/\n", options: { llmsPresent: true, entityType: "HairSalon" } },
  { id: "salon-entity-rules", html: salon, robots: crawlersOk, llms: "", options: { schemaRules: { entityFields: ENTITY_SCHEMA_FIELDS } } },
  { id: "tea-shop", html: graph(teaNodes), robots: "", llms: "", options: {} },
  { id: "tea-shop-catalog", html: "<h1>Shop</h1>", robots: "", llms: "", options: { catalog: { products: [{ name: "Tea" }] } } },
  { id: "woocommerce-body", html: '<body class="woocommerce">Shop</body>', robots: "", llms: "", options: {} },
  { id: "clothing-hint", html: graph([{ "@type": "WebSite", name: "Shop" }]), robots: "", llms: "", options: { entityType: "ClothingStore" } },
  { id: "saas", html: graph([software]), robots: crawlersOk, llms: "# Nurevo\n\nAEO tool for WordPress. https://nurevo.jp/ pricing and setup.\n".repeat(3), options: { llmsPresent: true } },
  { id: "software-hint", html: "<h1>Software</h1>", robots: "", llms: "", options: { entityType: "SoftwareApplication" } },
  { id: "service-offer", html: graph([{ "@type": "Service", offers: { "@type": "Offer", price: 10 } }]), robots: "", llms: "", options: { catalog: { services: [{ name: "Cut" }] } } },
  { id: "empty-page", html: "", robots: "", llms: "", options: {} },
  { id: "invalid-json", html: graph(teaNodes) + '<script type="application/ld+json">{broken}</script>', robots: crawlersOk, llms: "", options: {} },
]);

export { crawlersOk };
