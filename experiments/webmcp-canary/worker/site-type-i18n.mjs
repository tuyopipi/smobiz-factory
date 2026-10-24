/**
 * Wording for the site-type additions to the diagnosis: the site-level
 * requirements of an online shop / B2B site and the three schema properties
 * only typed sites are scored on.
 *
 * Kept apart from worker/i18n/diagnosis/*.json on purpose: those catalogs are
 * asserted complete in all 42 languages, and these strings are new. They are
 * written here in the dashboard's eight languages; every other language reads
 * English until they are added to the main catalogs (listed in
 * docs/industries.md under "strings").
 */
import { resolveDiagnosisLang } from "./diagnosis-i18n.mjs";

const TEXT = Object.freeze({
  en: {
    "field.contactPoint": "Contact (email, telephone or ContactPoint)",
    "field.hasMerchantReturnPolicy": "Return policy (MerchantReturnPolicy)",
    "field.logo": "Logo",
    "req.product_offers": "Products with a price and stock status",
    "req.product_offers.howto": "Publish each product's price, currency and availability (WooCommerce does this on product pages; Nurevo lists the catalogue on the front page).",
    "req.return_policy": "Return and refund policy page",
    "req.return_policy.howto": "Link a returns/refunds page from every page (footer) and enter its URL in the Nurevo settings.",
    "req.shipping_policy": "Shipping policy page",
    "req.shipping_policy.howto": "Link a shipping page (cost, delivery time, areas) from every page and enter its URL in the Nurevo settings.",
    "req.contact": "Shop contact details",
    "req.contact.howto": "Publish an email address or phone number for the shop, and link the contact page (in Japan, the 特定商取引法 page).",
    "req.service_descriptions": "Descriptions of what you offer",
    "req.service_descriptions.howto": "Enter each service or product with a one-sentence description in the Nurevo settings.",
    "req.pricing": "Pricing page",
    "req.pricing.howto": "Publish a pricing page (or how pricing works) and link it from the navigation; enter its URL in the Nurevo settings.",
    "req.proof": "Case studies or FAQ",
    "req.proof.howto": "Publish customer case studies or an FAQ that answers the questions buyers ask before choosing.",
    "req.identity": "Company identity (name, URL, logo or official profiles)",
    "req.identity.howto": "Publish the organisation's name, URL and logo, and link an About/company page and your official profiles.",
    "req.summary": "{filled}/{total} site requirements met",
    "type.local": "Local business",
    "type.ec": "Online shop (EC)",
    "type.b2b": "B2B / SaaS / professional services",
  },
  ja: {
    "field.contactPoint": "連絡先（メール・電話・ContactPoint）",
    "field.hasMerchantReturnPolicy": "返品ポリシー（MerchantReturnPolicy）",
    "field.logo": "ロゴ",
    "req.product_offers": "価格と在庫状況のある商品",
    "req.product_offers.howto": "商品ごとに価格・通貨・在庫状況を公開してください（商品ページはWooCommerceが出力し、Nurevoはトップページに商品一覧を出力します）。",
    "req.return_policy": "返品・返金ポリシーのページ",
    "req.return_policy.howto": "返品・返金のページを全ページ（フッター）からリンクし、Nurevoの設定にURLを入力してください。",
    "req.shipping_policy": "配送・送料のページ",
    "req.shipping_policy.howto": "送料・お届け日数・配送地域のページを全ページからリンクし、Nurevoの設定にURLを入力してください。",
    "req.contact": "ショップの連絡先",
    "req.contact.howto": "ショップのメールアドレスか電話番号を公開し、お問い合わせ（特定商取引法に基づく表記）のページをリンクしてください。",
    "req.service_descriptions": "提供内容の説明",
    "req.service_descriptions.howto": "Nurevoの設定で、サービス・製品ごとに1文の説明を入力してください。",
    "req.pricing": "料金ページ",
    "req.pricing.howto": "料金（または料金の考え方）のページを公開してナビゲーションからリンクし、Nurevoの設定にURLを入力してください。",
    "req.proof": "導入事例またはFAQ",
    "req.proof.howto": "導入事例や、検討中の企業が聞く質問に答えるFAQを公開してください。",
    "req.identity": "企業情報（社名・URL・ロゴまたは公式プロフィール）",
    "req.identity.howto": "社名・URL・ロゴを公開し、会社概要ページと公式プロフィールをリンクしてください。",
    "req.summary": "サイト要件 {filled}/{total} 件を満たしています",
    "type.local": "店舗・地域ビジネス",
    "type.ec": "ECサイト（通販）",
    "type.b2b": "BtoB・SaaS・専門サービス",
  },
  zh: {
    "field.contactPoint": "联系方式（邮箱、电话或 ContactPoint）", "field.hasMerchantReturnPolicy": "退货政策（MerchantReturnPolicy）", "field.logo": "标志",
    "req.product_offers": "有价格和库存状态的商品", "req.return_policy": "退货与退款政策页面", "req.shipping_policy": "配送政策页面", "req.contact": "店铺联系方式",
    "req.service_descriptions": "所提供内容的说明", "req.pricing": "价格页面", "req.proof": "客户案例或常见问题", "req.identity": "公司信息（名称、URL、标志或官方资料）",
    "req.summary": "已满足 {filled}/{total} 项网站要求", "type.local": "实体店铺", "type.ec": "电商网站", "type.b2b": "B2B / SaaS / 专业服务",
  },
  "zh-TW": {
    "field.contactPoint": "聯絡方式（電子郵件、電話或 ContactPoint）", "field.hasMerchantReturnPolicy": "退貨政策（MerchantReturnPolicy）", "field.logo": "標誌",
    "req.product_offers": "有價格與庫存狀態的商品", "req.return_policy": "退貨與退款政策頁面", "req.shipping_policy": "配送政策頁面", "req.contact": "商店聯絡方式",
    "req.service_descriptions": "所提供內容的說明", "req.pricing": "價格頁面", "req.proof": "客戶案例或常見問題", "req.identity": "公司資訊（名稱、URL、標誌或官方資料）",
    "req.summary": "已符合 {filled}/{total} 項網站要求", "type.local": "實體店家", "type.ec": "電商網站", "type.b2b": "B2B / SaaS / 專業服務",
  },
  ko: {
    "field.contactPoint": "연락처(이메일, 전화 또는 ContactPoint)", "field.hasMerchantReturnPolicy": "반품 정책(MerchantReturnPolicy)", "field.logo": "로고",
    "req.product_offers": "가격과 재고 상태가 있는 상품", "req.return_policy": "반품·환불 정책 페이지", "req.shipping_policy": "배송 정책 페이지", "req.contact": "쇼핑몰 연락처",
    "req.service_descriptions": "제공 내용 설명", "req.pricing": "요금 페이지", "req.proof": "도입 사례 또는 FAQ", "req.identity": "회사 정보(이름, URL, 로고 또는 공식 프로필)",
    "req.summary": "사이트 요건 {filled}/{total}개 충족", "type.local": "지역 매장", "type.ec": "온라인 쇼핑몰", "type.b2b": "B2B / SaaS / 전문 서비스",
  },
  es: {
    "field.contactPoint": "Contacto (email, teléfono o ContactPoint)", "field.hasMerchantReturnPolicy": "Política de devoluciones (MerchantReturnPolicy)", "field.logo": "Logotipo",
    "req.product_offers": "Productos con precio y disponibilidad", "req.return_policy": "Página de devoluciones y reembolsos", "req.shipping_policy": "Página de envíos", "req.contact": "Datos de contacto de la tienda",
    "req.service_descriptions": "Descripción de lo que ofreces", "req.pricing": "Página de precios", "req.proof": "Casos de éxito o preguntas frecuentes", "req.identity": "Identidad de la empresa (nombre, URL, logotipo o perfiles oficiales)",
    "req.summary": "{filled}/{total} requisitos del sitio cumplidos", "type.local": "Negocio local", "type.ec": "Tienda online", "type.b2b": "B2B / SaaS / servicios profesionales",
  },
  fr: {
    "field.contactPoint": "Contact (e-mail, téléphone ou ContactPoint)", "field.hasMerchantReturnPolicy": "Politique de retour (MerchantReturnPolicy)", "field.logo": "Logo",
    "req.product_offers": "Produits avec prix et disponibilité", "req.return_policy": "Page retours et remboursements", "req.shipping_policy": "Page livraison", "req.contact": "Coordonnées de la boutique",
    "req.service_descriptions": "Description de votre offre", "req.pricing": "Page tarifs", "req.proof": "Études de cas ou FAQ", "req.identity": "Identité de l’entreprise (nom, URL, logo ou profils officiels)",
    "req.summary": "{filled}/{total} exigences du site remplies", "type.local": "Commerce local", "type.ec": "Boutique en ligne", "type.b2b": "B2B / SaaS / services professionnels",
  },
  de: {
    "field.contactPoint": "Kontakt (E-Mail, Telefon oder ContactPoint)", "field.hasMerchantReturnPolicy": "Rückgaberichtlinie (MerchantReturnPolicy)", "field.logo": "Logo",
    "req.product_offers": "Produkte mit Preis und Verfügbarkeit", "req.return_policy": "Seite zu Rückgabe und Erstattung", "req.shipping_policy": "Seite zu Versand", "req.contact": "Kontaktdaten des Shops",
    "req.service_descriptions": "Beschreibung Ihres Angebots", "req.pricing": "Preisseite", "req.proof": "Fallstudien oder FAQ", "req.identity": "Unternehmensidentität (Name, URL, Logo oder offizielle Profile)",
    "req.summary": "{filled}/{total} Website-Anforderungen erfüllt", "type.local": "Lokales Geschäft", "type.ec": "Onlineshop", "type.b2b": "B2B / SaaS / professionelle Dienstleistungen",
  },
});

export const SITE_TYPE_TEXT_LANGS = Object.freeze(Object.keys(TEXT));

function catalogFor(requested) {
  const lang = resolveDiagnosisLang(requested);
  if (TEXT[lang]) return lang;
  const base = String(lang).split("-")[0];
  return TEXT[base] ? base : "en";
}

/** One string, falling back to English, or undefined when the key is unknown. */
export function siteTypeText(requested, key, params = null) {
  const lang = catalogFor(requested);
  const value = TEXT[lang][key] ?? TEXT.en[key];
  if (value === undefined) return undefined;
  return params ? value.replace(/\{(\w+)\}/g, (m, name) => (params[name] != null ? String(params[name]) : m)) : value;
}

/** Requirement rows with a label and a how-to in the asked language. */
export function localizeRequirements(requirements, requested) {
  return (Array.isArray(requirements) ? requirements : []).map((item) => ({
    ...item,
    label: siteTypeText(requested, `req.${item?.id}`) || String(item?.id || ""),
    howTo: siteTypeText(requested, `req.${item?.id}.howto`) || "",
  }));
}
