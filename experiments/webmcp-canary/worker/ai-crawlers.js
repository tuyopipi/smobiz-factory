import { INITIAL_AEO_RULESET } from "./aeo-rules.mjs";
export const AI_CRAWLERS = [
  { id: "gptbot", ua: "GPTBot", owner: "OpenAI", engine: "ChatGPT", purpose: "学習・インデックス" },
  { id: "oai-search", ua: "OAI-SearchBot", owner: "OpenAI", engine: "ChatGPT Search", purpose: "検索インデックス" },
  { id: "chatgpt-user", ua: "ChatGPT-User", owner: "OpenAI", engine: "ChatGPT（ブラウズ）", purpose: "ユーザー操作での取得" },
  { id: "claudebot", ua: "ClaudeBot", owner: "Anthropic", engine: "Claude", purpose: "学習・インデックス" },
  { id: "perplexity", ua: "PerplexityBot", owner: "Perplexity", engine: "Perplexity", purpose: "検索・回答" },
  { id: "google-ext", ua: "Google-Extended", owner: "Google", engine: "Gemini / AI Overviews", purpose: "AI用途の学習許可" },
  { id: "applebot-ext", ua: "Applebot-Extended", owner: "Apple", engine: "Apple Intelligence", purpose: "AI用途の学習許可" },
  { id: "bytespider", ua: "Bytespider", owner: "ByteDance", engine: "Doubao 等", purpose: "学習・インデックス" },
];

// The crawlers that fetch pages to answer a search or a user's question, as
// opposed to the ones collecting training data. Owners who have not decided
// about training can still let these in; the robots lines Nurevo recommends
// for a non-WordPress site name only these and leave every other group alone.
export const AI_SEARCH_CRAWLERS = Object.freeze([
  "OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User",
]);

/** robots.txt lines that allow the AI search crawlers and nothing else. */
export function searchCrawlerRobotsLines() {
  return [
    "# Nurevo AEO: allow AI search crawlers (training crawlers are not changed)",
    ...AI_SEARCH_CRAWLERS.map((ua) => `User-agent: ${ua}`),
    "Allow: /",
    "",
  ].join("\n");
}

export function matchCrawler(uaString = "") {
  const ua = String(uaString).toLowerCase();
  return AI_CRAWLERS.find((crawler) => ua.includes(crawler.ua.toLowerCase())) || null;
}

export const isAICrawler = (ua) => !!matchCrawler(ua);
export function robotsBlock(allow = true, definition = INITIAL_AEO_RULESET.definition) {
  const rule = allow && definition.robots.defaultAllow ? "Allow: /" : "Disallow: /";
  return AI_CRAWLERS.filter(c=>definition.robots.aiCrawlerIds.includes(c.id)).map(c=>`User-agent: ${c.ua}\n${rule}`).join("\n\n") + "\n";
}

/**
 * The llms.txt headings and labels in the eight dashboard languages, keyed by
 * the Japanese literal or template the ruleset carries. A ruleset line that is
 * not listed here (a learned or edited one) is written as the ruleset has it.
 * Japanese is the ruleset's own wording and is never looked up, so the
 * Japanese file stays byte-for-byte what it was.
 */
export const LLMS_TXT_LANGS = Object.freeze(["ja", "en", "zh", "zh-TW", "ko", "es", "fr", "de"]);
const LLMS_TXT_WORDING = Object.freeze({
  en: { "## 店舗情報": "## Store information", "- 住所: {value}": "- Address: {value}", "- 電話: {value}": "- Phone: {value}", "- 営業時間: {value}": "- Hours: {value}", "- 予約: {value}": "- Reservations: {value}", "- サイト: {value}": "- Website: {value}", "## 対応AIクローラー": "## Supported AI crawlers" },
  zh: { "## 店舗情報": "## 店铺信息", "- 住所: {value}": "- 地址: {value}", "- 電話: {value}": "- 电话: {value}", "- 営業時間: {value}": "- 营业时间: {value}", "- 予約: {value}": "- 预约: {value}", "- サイト: {value}": "- 网站: {value}", "## 対応AIクローラー": "## 支持的AI爬虫" },
  "zh-TW": { "## 店舗情報": "## 店家資訊", "- 住所: {value}": "- 地址: {value}", "- 電話: {value}": "- 電話: {value}", "- 営業時間: {value}": "- 營業時間: {value}", "- 予約: {value}": "- 預約: {value}", "- サイト: {value}": "- 網站: {value}", "## 対応AIクローラー": "## 支援的AI爬蟲" },
  ko: { "## 店舗情報": "## 매장 정보", "- 住所: {value}": "- 주소: {value}", "- 電話: {value}": "- 전화: {value}", "- 営業時間: {value}": "- 영업시간: {value}", "- 予約: {value}": "- 예약: {value}", "- サイト: {value}": "- 웹사이트: {value}", "## 対応AIクローラー": "## 지원하는 AI 크롤러" },
  es: { "## 店舗情報": "## Información del negocio", "- 住所: {value}": "- Dirección: {value}", "- 電話: {value}": "- Teléfono: {value}", "- 営業時間: {value}": "- Horario: {value}", "- 予約: {value}": "- Reservas: {value}", "- サイト: {value}": "- Sitio web: {value}", "## 対応AIクローラー": "## Rastreadores de IA admitidos" },
  fr: { "## 店舗情報": "## Informations sur l’établissement", "- 住所: {value}": "- Adresse: {value}", "- 電話: {value}": "- Téléphone: {value}", "- 営業時間: {value}": "- Horaires: {value}", "- 予約: {value}": "- Réservation: {value}", "- サイト: {value}": "- Site web: {value}", "## 対応AIクローラー": "## Robots d’IA pris en charge" },
  de: { "## 店舗情報": "## Geschäftsinformationen", "- 住所: {value}": "- Adresse: {value}", "- 電話: {value}": "- Telefon: {value}", "- 営業時間: {value}": "- Öffnungszeiten: {value}", "- 予約: {value}": "- Reservierung: {value}", "- サイト: {value}": "- Website: {value}", "## 対応AIクローラー": "## Unterstützte KI-Crawler" },
});

/**
 * One of LLMS_TXT_LANGS for a ?lang= value or Accept-Language tag. No
 * preference at all keeps Japanese, the wording existing callers were built
 * against; a language outside the eight reads in English.
 */
export function resolveLlmsTxtLang(requested) {
  const value = String(requested ?? "").trim().toLowerCase().replace(/_/g, "-");
  if (!value) return "ja";
  const parts = value.split("-");
  if (value === "tw") return "zh-TW"; // the dashboard's own code for Traditional Chinese
  if (parts[0] === "zh") return parts.includes("hant") || ["tw", "hk", "mo"].includes(parts[parts.length - 1]) ? "zh-TW" : "zh";
  return LLMS_TXT_LANGS.includes(parts[0]) ? parts[0] : "en";
}

export function buildLlmsTxt(site = {}, definition = INITIAL_AEO_RULESET.definition, lang = "ja") {
  const wording = LLMS_TXT_WORDING[lang] || {};
  const say = (text) => (Object.hasOwn(wording, text) ? wording[text] : text);
  let canonical = site.url;
  try { if (canonical) canonical = new URL(/^https?:\/\//i.test(canonical) ? canonical : `https://${canonical}`).href; } catch { canonical = null; }
  const values = {...site,url:canonical,name:site.name || site.url,description:site.description || site.summary,
    reserve_url:site.reserve_url || site.reserve,
    crawlerNames:AI_CRAWLERS.filter(c=>definition.robots.aiCrawlerIds.includes(c.id)).map(c=>`- ${c.ua}`).join('\n')};
  const clean = value => String(value ?? '').replace(/[\r\n]+/g,' ');
  return definition.llmsTxt.sections.map(section=>(definition.generation.llmsSections[section] || []).map(spec=>{
    if (spec.literal) return say(spec.literal);
    const value = values[spec.source];
    return value ? say(spec.template).replace('{value}',spec.source === 'crawlerNames' ? value : clean(value)) : null;
  }).filter(Boolean).join('\n')).filter(Boolean).join('\n\n') + '\n';
}
