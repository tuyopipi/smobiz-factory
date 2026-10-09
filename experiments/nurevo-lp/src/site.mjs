// Facts about the site that the build turns into head tags, JSON-LD, the
// sitemap and llms.txt. Everything here is something the page itself states -
// structured data that says more than the page does is a fabrication, so a
// fact is added to the page first and here second.

export const ORIGIN = "https://nurevo.jp";

// code: the key used in src/i18n.mjs. path: where that language's home page is
// served. hreflang: what search engines are told. The Chinese pages are told
// apart by script, which is what actually differs between them.
export const LANGS = [
  { code: "ja", path: "/", hreflang: "ja", htmlLang: "ja", ogLocale: "ja_JP", label: "🇯🇵 日本語" },
  { code: "en", path: "/en/", hreflang: "en", htmlLang: "en", ogLocale: "en_US", label: "🇬🇧 English" },
  { code: "zh", path: "/zh/", hreflang: "zh-Hans", htmlLang: "zh-Hans", ogLocale: "zh_CN", label: "🇨🇳 简体中文" },
  { code: "zh-TW", path: "/zh-tw/", hreflang: "zh-Hant", htmlLang: "zh-Hant", ogLocale: "zh_TW", label: "🇹🇼 繁體中文" },
  { code: "ko", path: "/ko/", hreflang: "ko", htmlLang: "ko", ogLocale: "ko_KR", label: "🇰🇷 한국어" },
  { code: "es", path: "/es/", hreflang: "es", htmlLang: "es", ogLocale: "es_ES", label: "🇪🇸 Español" },
  { code: "fr", path: "/fr/", hreflang: "fr", htmlLang: "fr", ogLocale: "fr_FR", label: "🇫🇷 Français" },
  { code: "de", path: "/de/", hreflang: "de", htmlLang: "de", ogLocale: "de_DE", label: "🇩🇪 Deutsch" },
];

// The page a visitor gets when none of the languages is theirs.
export const DEFAULT_LANG = "ja";

export const OG_IMAGE = { url: `${ORIGIN}/ogp.png`, width: 1200, height: 630 };

// The operator, as the company profile in the footer states it.
export const ORGANIZATION = {
  legalName: "Bestie.合同会社",
  brand: "Nurevo",
  email: "info@nurevo.jp",
  founder: "橋本 剛",
  foundingDate: "2025-05",
  address: {
    streetAddress: "神田三崎町3-2-6",
    addressLocality: "千代田区",
    addressRegion: "東京都",
    addressCountry: "JP",
  },
  logo: { url: `${ORIGIN}/assets/logo.png`, width: 128, height: 128 },
  sameAs: ["https://wordpress.org/plugins/nurevo-webmcp/"],
};

export const PRODUCT = {
  name: "Nurevo AEO",
  category: "BusinessApplication",
  operatingSystem: "WordPress",
  downloadUrl: "https://wordpress.org/plugins/nurevo-webmcp/",
  // Only what can be bought, or used for nothing, today. Pro is announced with a
  // planned figure and is not on sale, so it is not an Offer.
  offers: [
    { nameKey: "price.free.nm", descKey: "price.free.desc", price: 0, url: "/#pricing" },
    { nameKey: "price.std.nm", descKey: "price.std.desc", price: 3000, monthly: true, url: "/dashboard?plan=standard" },
  ],
};

// The questions the page answers, in page order.
export const FAQ_KEYS = [
  ["faq.1.q", "faq.1.a"],
  ["faq.2.q", "faq.2.a"],
  ["faq.3.q", "faq.3.a"],
  ["faq.4.q", "faq.4.a"],
];

// Hand-written pages under public/. The build does not write their content; it
// keeps a block of head tags in each (canonical, Open Graph, JSON-LD) between
// the seo markers, and lists them in the sitemap and llms.txt. `file` is
// omitted for the two English legal pages, which the worker serves.
export const STATIC_PAGES = [
  { path: "/check/", file: "check/index.html", lang: "ja", title: "AI可読チェッカー", summary: "URLを入れるだけで、AIがそのサイトを読めるかを無料で診断するツール（登録不要）。" },
  { path: "/partner/", file: "partner/index.html", lang: "ja", title: "販売パートナー募集", summary: "個人紹介パートナーと企業向け販売代理店の募集、登録申請。" },
  { path: "/guide/integration", file: "guide/integration.html", lang: "ja", title: "サーバーサイド連携ガイド", summary: "WordPress以外のサイトにschema.orgを埋め込み、最新に保つための連携手順（PHP / Node.js / Next.js）。" },
  { path: "/privacy", file: "privacy.html", lang: "ja", title: "プライバシーポリシー" },
  { path: "/terms", file: "terms.html", lang: "ja", title: "利用規約" },
  { path: "/tokushoho", file: "tokushoho.html", lang: "ja", title: "特定商取引法に基づく表記" },
  { path: "/en/privacy", lang: "en", title: "Privacy Policy" },
  { path: "/en/terms", lang: "en", title: "Terms of Service" },
];

// Where a visitor who arrived from an AI answer came from. Matched against the
// referring host, or against utm_source for engines that strip the referrer.
export const AI_REFERRERS = [
  { id: "chatgpt", hosts: ["chatgpt.com", "chat.openai.com"] },
  { id: "perplexity", hosts: ["perplexity.ai"] },
  { id: "gemini", hosts: ["gemini.google.com", "bard.google.com"] },
  { id: "copilot", hosts: ["copilot.microsoft.com"] },
  { id: "claude", hosts: ["claude.ai"] },
  { id: "you", hosts: ["you.com"] },
  { id: "phind", hosts: ["phind.com"] },
  { id: "kagi", hosts: ["kagi.com"] },
  { id: "duckduckgo-ai", hosts: ["duck.ai"] },
  { id: "meta-ai", hosts: ["meta.ai"] },
  { id: "grok", hosts: ["grok.com"] },
  { id: "deepseek", hosts: ["chat.deepseek.com"] },
  { id: "mistral", hosts: ["chat.mistral.ai"] },
];
