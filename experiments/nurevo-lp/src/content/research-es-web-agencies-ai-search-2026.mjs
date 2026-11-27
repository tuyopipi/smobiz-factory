// Content page: research report (country report: Spain). AI search
// readiness of Spanish web design agencies' own websites, compared with
// Spanish-speaking Latin America (Mexico, Colombia, Argentina, Chile),
// France, Italy, Portugal, the UK, the US, Japan and all other overseas
// agencies. November 2026.
//
// Every number here comes from nurevo-outreach data/survey/raw_2026-11-12.json
// (survey.js; the same run as summary_2026-11-12.json — the Spain totals
// match summary.byCountry.ES: 248 reached, llms.txt 31.9%, JSON-LD 69.0%,
// WordPress 67.3%, AI bot blocked 5.6%). Country = the "co" field of our
// collection list (ES; 485 listed, 237 not reached). Do not add a figure that
// is not in that data. The raw file holds company names and domains: never
// publish them. Definitions follow survey.js (see the US report).
// HTTP 202: 14 Spanish home pages answered 202 (5.6% of reached), all of them
// non-WordPress. Score 0: 64 sites = 14 answering 202 + 50 answering 200 that
// met none of the 6 items (all 50 non-WordPress, none with a robots.txt).
// HTTP-200-only: Spain 234, llms.txt 33.8%, all 6 29.1%, average 3.89;
// US 200: 27.2% (p=0.028) / 22.3% (p=0.016); UK 200: 25.3% (p=0.011) / 20.8%
// (p=0.008); other overseas 200: 29.6% (p=0.16) / 24.4% (p=0.10); France
// 200: 26.9% (p=0.067); Spanish-speaking LatAm 200: 26.0% (p=0.051) / 19.7%
// (p=0.011).
// "Spanish-speaking Latin America" = MX 116 + CO 81 + AR 76 + CL 50 = 323.
// "Other overseas" = all non-Japan sites except Spain (13,104 reached;
// 10,292 with robots.txt).
// Chi-square (no continuity correction), Spain vs: LatAm4 llms.txt p=0.050,
// all 6 p=0.009, JSON-LD p<0.001; France llms.txt p=0.14, all 6 p=0.32,
// JSON-LD / meta description / canonical / robots.txt p<0.001; Italy
// llms.txt p=0.022, all 6 p=0.039, JSON-LD p<0.001, FAQPage p=0.004; Portugal
// llms.txt p=0.44; UK llms.txt p<0.001, all 6 p<0.001, JSON-LD p=0.96; US
// llms.txt p=0.002, all 6 p=0.001, JSON-LD p=1.00, FAQPage p<0.001; other
// overseas llms.txt p=0.048, all 6 p=0.031; Japan llms.txt / all 6 p<0.001.
// AI bot blocking (Fisher's exact test): France p=0.031, Japan p<0.001,
// US 0.45, UK 0.57, LatAm4 0.14, Italy 0.38, other overseas 0.73.
// WordPress only: Spain 167, llms.txt 42.5%, all 6 37.7%, average 5.11;
// US WP 30.1% (p<0.001) / 25.2% (p<0.001); other overseas WP 33.0%
// (p=0.009) / 27.9% (p=0.005); France WP 27.5% (p<0.001) / 25.9% (p=0.006);
// LatAm4 WP 38.3% (p=0.44); Italy WP 36.8% (p=0.45).
// Domain split (.es 73 / .com 145 / other 30): .es vs .com llms.txt p=0.39,
// all 6 p=0.31, JSON-LD p=0.78.
// Groups under 30 sites are not shown (AIOSEO 6, SEOPress 2 and "none
// detected" 11 Spanish WordPress sites; AI bot blocking for Portugal, 27
// sites with robots.txt). Region: 198 of 248 have no city in our list, so no
// regional split.
// Spanish translation: src/content/research-es-web-agencies-ai-search-2026/es.json

// [ja label, en label, Spain, Spanish-speaking Latin America (MX+CO+AR+CL), France, Italy, Portugal, UK, US, Japan, other overseas (excl. Spain)]
const COMPARE = [
  ["到達件数", "Sites reached", "248", "323", "405", "110", "46", "942", "4,472", "2,486", "13,104"],
  ["HTTP 202 を返した割合", "Answered HTTP 202", "5.6%", "7.1%", "1.7%", "22.7%", "2.2%", "14.9%", "15.0%", "0.0%", "11.2%"],
  ["WordPress", "WordPress", "67.3%", "47.7%", "92.3%", "51.8%", "47.8%", "73.4%", "74.5%", "92.3%", "75.7%"],
  ["llms.txt", "llms.txt", "31.9%", "24.5%", "26.4%", "20.0%", "26.1%", "21.5%", "23.1%", "13.4%", "26.3%"],
  ["llms-full.txt", "llms-full.txt", "3.6%", "1.9%", "1.2%", "1.8%", "10.9%", "1.3%", "1.5%", "0.6%", "1.8%"],
  ["JSON-LD", "JSON-LD", "69.0%", "54.8%", "90.1%", "49.1%", "56.5%", "68.8%", "69.0%", "69.4%", "72.1%"],
  ["JSON-LD が壊れている（JSON-LD があるサイト中）", "Broken JSON-LD (of sites with JSON-LD)", "1.2%", "0.6%", "1.1%", "0.0%", "0.0%", "2.0%", "1.6%", "1.7%", "1.9%"],
  ["Organization系の型", "Organization-type", "62.9%", "51.4%", "81.2%", "44.5%", "56.5%", "59.6%", "59.4%", "58.9%", "63.6%"],
  ["FAQPage", "FAQPage", "12.5%", "11.8%", "13.1%", "2.7%", "15.2%", "8.0%", "6.2%", "3.9%", "9.3%"],
  ["microdata（schema.org）", "Microdata (schema.org)", "22.2%", "18.6%", "24.7%", "15.5%", "8.7%", "16.9%", "19.1%", "7.8%", "19.6%"],
  ["meta description", "Meta description", "65.7%", "60.4%", "90.4%", "51.8%", "54.3%", "69.3%", "68.0%", "90.7%", "71.6%"],
  ["Open Graph", "Open Graph", "67.3%", "59.4%", "90.9%", "50.0%", "56.5%", "69.1%", "69.1%", "81.3%", "72.5%"],
  ["canonical", "Canonical link", "70.6%", "60.4%", "93.6%", "52.7%", "58.7%", "72.7%", "74.3%", "84.6%", "76.5%"],
  ["robots.txt", "robots.txt", "71.8%", "67.2%", "93.3%", "57.3%", "58.7%", "74.2%", "76.1%", "91.8%", "78.5%"],
  ["AIボットをブロック（robots.txt があるサイト中）", "Blocks an AI bot (of sites with robots.txt)", "5.6%", "10.1%", "1.9%", "9.5%", "—", "4.7%", "4.3%", "1.3%", "5.1%"],
  ["robots.txt でAIボットに言及", "robots.txt names an AI bot", "14.0%", "23.0%", "7.4%", "14.3%", "—", "9.3%", "8.8%", "2.5%", "11.7%"],
  ["6項目の平均", "6-item average", "3.67", "3.09", "4.71", "2.70", "3.02", "3.61", "3.65", "4.05", "3.83"],
  ["5項目以上", "5+ items", "56.9%", "43.7%", "74.3%", "40.9%", "47.8%", "55.1%", "54.6%", "52.2%", "58.2%"],
  ["6項目すべて", "All 6 items", "27.4%", "18.3%", "24.0%", "17.3%", "23.9%", "17.7%", "18.9%", "10.4%", "21.7%"],
  ["0項目", "No items", "25.8%", "30.7%", "3.7%", "41.8%", "39.1%", "23.6%", "22.1%", "1.6%", "19.5%"],
];

// [ja, en, reached, llms.txt, all 6, 6-item average, JSON-LD, FAQPage, AI bot blocked]  countries with 100+ reached, by llms.txt share
const COUNTRIES = [
  ["シンガポール", "Singapore", "641", "38.8%", "32.4%", "4.36", "80.8%", "15.0%", "5.7%"],
  ["インド", "India", "1,554", "36.6%", "29.9%", "4.53", "84.4%", "14.5%", "5.8%"],
  ["ブラジル", "Brazil", "261", "34.1%", "25.3%", "4.11", "74.7%", "13.4%", "5.5%"],
  ["スペイン", "Spain", "248", "31.9%", "27.4%", "3.67", "69.0%", "12.5%", "5.6%"],
  ["フィリピン", "Philippines", "241", "31.5%", "27.0%", "4.27", "80.1%", "12.0%", "7.2%"],
  ["南アフリカ", "South Africa", "389", "29.3%", "24.4%", "3.90", "74.6%", "9.5%", "7.5%"],
  ["フランス", "France", "405", "26.4%", "24.0%", "4.71", "90.1%", "13.1%", "1.9%"],
  ["ニュージーランド", "New Zealand", "417", "25.4%", "20.9%", "3.80", "70.3%", "7.4%", "5.8%"],
  ["オーストラリア", "Australia", "1,719", "24.3%", "20.8%", "3.77", "71.3%", "10.3%", "4.7%"],
  ["オランダ", "Netherlands", "127", "23.6%", "18.9%", "3.66", "74.0%", "3.9%", "7.6%"],
  ["米国", "US", "4,472", "23.1%", "18.9%", "3.65", "69.0%", "6.2%", "4.3%"],
  ["カナダ", "Canada", "908", "22.9%", "18.9%", "3.58", "68.1%", "8.0%", "3.5%"],
  ["英国", "UK", "942", "21.5%", "17.7%", "3.61", "68.8%", "8.0%", "4.7%"],
  ["メキシコ", "Mexico", "116", "20.7%", "18.1%", "3.06", "55.2%", "10.3%", "4.1%"],
  ["イタリア", "Italy", "110", "20.0%", "17.3%", "2.70", "49.1%", "2.7%", "9.5%"],
  ["アイルランド", "Ireland", "266", "19.5%", "17.3%", "3.28", "62.8%", "6.8%", "3.3%"],
  ["日本", "Japan", "2,486", "13.4%", "10.4%", "4.05", "69.4%", "3.9%", "1.3%"],
];

// [ja group, en group, sites, HTTP 202, llms.txt, JSON-LD, all 6, 6-item average]
const WPSPLIT = [
  ["スペイン：WordPress", "Spain: WordPress", "167", "0", "42.5%", "97.0%", "37.7%", "5.11"],
  ["スペイン：WordPress 以外", "Spain: not WordPress", "81", "14", "9.9%", "11.1%", "6.2%", "0.72"],
  ["中南米4か国：WordPress", "Spanish-speaking LatAm: WordPress", "154", "0", "38.3%", "91.6%", "31.8%", "4.93"],
  ["中南米4か国：WordPress 以外", "Spanish-speaking LatAm: not WordPress", "169", "23", "11.8%", "21.3%", "5.9%", "1.41"],
  ["フランス：WordPress", "France: WordPress", "374", "0", "27.5%", "94.1%", "25.9%", "4.91"],
  ["イタリア：WordPress", "Italy: WordPress", "57", "0", "36.8%", "93.0%", "33.3%", "4.95"],
  ["イタリア：WordPress 以外", "Italy: not WordPress", "53", "25", "1.9%", "1.9%", "0.0%", "0.28"],
  ["米国：WordPress", "US: WordPress", "3,333", "0", "30.1%", "91.4%", "25.2%", "4.80"],
  ["スペイン以外の海外：WordPress", "Other overseas: WordPress", "9,914", "0", "33.0%", "92.4%", "27.9%", "4.87"],
  ["日本：WordPress", "Japan: WordPress", "2,295", "0", "14.0%", "72.9%", "10.8%", "4.21"],
];

// [bot, Spain blocked, Spain %, Spanish-speaking LatAm %, France %, Italy %, US %, Japan %]  base = sites with robots.txt (ES 178 / LAT4 217 / FR 378 / IT 63 / US 3,404 / JP 2,281)
const BOTS = [
  ["CCBot", "10", "5.6%", "9.2%", "1.9%", "9.5%", "4.1%", "1.1%"],
  ["Bytespider", "10", "5.6%", "8.8%", "1.3%", "7.9%", "4.1%", "1.1%"],
  ["GPTBot", "9", "5.1%", "8.8%", "1.3%", "7.9%", "3.8%", "1.2%"],
  ["Applebot-Extended", "9", "5.1%", "8.3%", "1.3%", "6.3%", "3.3%", "1.0%"],
  ["ClaudeBot", "8", "4.5%", "8.3%", "1.1%", "6.3%", "3.5%", "1.0%"],
  ["Google-Extended", "8", "4.5%", "7.4%", "1.3%", "6.3%", "3.6%", "1.1%"],
  ["anthropic-ai", "7", "3.9%", "7.8%", "1.1%", "4.8%", "3.4%", "1.0%"],
  ["OAI-SearchBot", "2", "1.1%", "0.5%", "0.0%", "0.0%", "0.3%", "0.0%"],
  ["ChatGPT-User", "2", "1.1%", "0.9%", "0.0%", "0.0%", "0.4%", "0.1%"],
  ["Claude-SearchBot", "2", "1.1%", "0.0%", "0.0%", "0.0%", "0.3%", "0.0%"],
  ["PerplexityBot", "2", "1.1%", "0.5%", "0.0%", "0.0%", "0.3%", "0.1%"],
  ["Googlebot", "0", "0.0%", "0.0%", "0.0%", "0.0%", "0.1%", "0.0%"],
  ["Bingbot", "0", "0.0%", "0.0%", "0.0%", "0.0%", "0.1%", "0.0%"],
];

// [type, Spain, Spanish-speaking LatAm, France, Italy, US, Japan]  share of reached sites whose home page JSON-LD has the @type
const TYPES = [
  ["WebSite", "66.9%", "49.8%", "87.7%", "48.2%", "65.7%", "63.0%"],
  ["WebPage", "60.5%", "40.9%", "74.1%", "45.5%", "59.3%", "34.4%"],
  ["Organization", "60.5%", "45.5%", "77.3%", "42.7%", "55.4%", "54.4%"],
  ["ImageObject", "60.1%", "44.3%", "73.8%", "44.5%", "54.5%", "38.3%"],
  ["SearchAction", "59.7%", "36.8%", "74.1%", "44.5%", "56.8%", "28.9%"],
  ["ListItem", "40.7%", "29.1%", "53.8%", "32.7%", "44.6%", "43.8%"],
  ["BreadcrumbList", "39.9%", "28.5%", "53.6%", "31.8%", "44.5%", "43.4%"],
  ["ReadAction", "37.1%", "21.4%", "49.9%", "30.9%", "38.3%", "8.5%"],
  ["EntryPoint", "36.3%", "22.0%", "50.6%", "29.1%", "40.1%", "17.7%"],
  ["PropertyValueSpecification", "33.1%", "18.6%", "44.9%", "25.5%", "35.1%", "10.9%"],
  ["PostalAddress", "29.4%", "22.6%", "32.3%", "20.9%", "24.3%", "16.4%"],
  ["Person", "18.1%", "14.9%", "26.4%", "16.4%", "15.6%", "10.2%"],
  ["GeoCoordinates", "17.3%", "10.8%", "13.6%", "10.9%", "12.1%", "3.7%"],
  ["ContactPoint", "15.7%", "13.9%", "15.1%", "9.1%", "12.5%", "6.5%"],
  ["Place", "15.3%", "8.7%", "13.3%", "8.2%", "9.2%", "1.3%"],
  ["ProfessionalService", "14.5%", "18.0%", "15.3%", "6.4%", "10.1%", "5.6%"],
];

// [plugin, Spain WP sites, share, llms.txt, JSON-LD, all 6, 6-item average]  Spain WordPress 167; groups under 30 omitted
const PLUGINS = [
  ["Yoast SEO", "97", "58.1%", "38.1%", "100.0%", "33.0%", "5.10"],
  ["Rank Math", "51", "30.5%", "54.9%", "100.0%", "49.0%", "5.47"],
];

// [domain, reached, HTTP 202, WordPress, llms.txt, JSON-LD, all 6, 6-item average]
const DOMAINS = [
  [".es", "73", "4.1%", "65.8%", "27.4%", "67.1%", "21.9%", "3.45"],
  [".com", "145", "6.2%", "66.9%", "33.1%", "69.0%", "28.3%", "3.73"],
  ["その他 / other", "30", "6.7%", "73.3%", "36.7%", "73.3%", "36.7%", "3.93"],
];

// [items met, Spain, Spanish-speaking LatAm, France, Italy, US, Japan]
const DIST = [
  ["0", "25.8%", "30.7%", "3.7%", "41.8%", "22.1%", "1.6%"],
  ["1", "2.4%", "4.3%", "0.5%", "4.5%", "2.5%", "4.8%"],
  ["2", "2.8%", "6.2%", "4.0%", "2.7%", "4.3%", "10.7%"],
  ["3", "0.8%", "5.0%", "2.7%", "1.8%", "3.6%", "15.4%"],
  ["4", "11.3%", "10.2%", "14.8%", "8.2%", "12.8%", "15.3%"],
  ["5", "29.4%", "25.4%", "50.4%", "23.6%", "35.7%", "41.8%"],
  ["6", "27.4%", "18.3%", "24.0%", "17.3%", "18.9%", "10.4%"],
];

const HEAD_JA = ["項目", "スペイン", "スペイン語圏の中南米4か国", "フランス", "イタリア", "ポルトガル", "英国", "米国", "日本", "スペイン以外の海外"];
const HEAD_EN = ["Item", "Spain", "Spanish-speaking Latin America (4)", "France", "Italy", "Portugal", "UK", "US", "Japan", "Other overseas"];
const COMPARE_JA = COMPARE.map(([ja, , ...v]) => [ja, ...v]);
const COMPARE_EN = COMPARE.map(([, en, ...v]) => [en, ...v]);

export default {
  slug: "research-es-web-agencies-ai-search-2026",
  targetQueries: [
    "スペイン Web制作会社 AI検索 対応状況 調査",
    "スペイン llms.txt 導入率",
    "Spain web design agencies AI search readiness survey",
    "llms.txt adoption Spain Europe 2026",
    "agencias de diseño web España búsqueda con IA llms.txt estudio",
    "agencias web robots.txt GPTBot bloqueo España",
  ],
  related: ["research-br-web-agencies-ai-search-2026", "research-fr-web-agencies-ai-search-2026", "research-uk-web-agencies-ai-search-2026", "research-japan-vs-overseas-2026", "research-wordpress-vs-non-wordpress-2026", "llms-txt"],
  locales: {
    ja: {
      title: "スペインのWeb制作会社248社のAI検索対応を調査【2026年11月】 | Nurevo",
      description: "スペインのWeb制作会社の自社サイト248件を調査。llms.txt は31.9%で17か国中4位、6項目すべては27.4%で3位。一方で25.8%は6項目に1つも当てはまらず、WordPress かどうかで大きく分かれました。",
      h1: "スペインのWeb制作会社の自社サイト248件に見るAI検索への対応（2026年11月）",
      lead: "スペインのWeb制作会社の自社サイト248件のトップページ・robots.txt・llms.txt を調べたところ、llms.txt があったのは31.9%（79件）で、到達100件以上の17か国の中でシンガポール・インド・ブラジルに次ぐ4位でした（米国23.1%、英国21.5%、日本13.4%）。AI検索に関わる6項目をすべて満たしたのは27.4%で17か国中3位でしたが、1つも当てはまらないサイトも25.8%あり、6項目の平均（3.67）は10位でした。WordPress のサイト167件は0項目が1件もなく5項目以上が80.2%だったのに対し、WordPress 以外の81件は79.0%が0項目と、はっきり二つに分かれていました。",
      intro: [
        "公開：2026年11月27日。データ：2026年11月12日集計。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策（AEO）のツールと WordPress プラグインを提供しており、この分野に利害があります。国別レポートの9本目です（これまでに[米国](/guide/research-us-web-agencies-ai-search-2026)・[英国](/guide/research-uk-web-agencies-ai-search-2026)・[オーストラリア](/guide/research-au-web-agencies-ai-search-2026)・[インド](/guide/research-in-web-agencies-ai-search-2026)・[カナダ](/guide/research-ca-web-agencies-ai-search-2026)・[フランス](/guide/research-fr-web-agencies-ai-search-2026)・[シンガポール](/guide/research-sg-web-agencies-ai-search-2026)・[ブラジル](/guide/research-br-web-agencies-ai-search-2026)）。英語版とスペイン語版もあります。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "スペインのWeb制作会社の自社サイト248件のうち、llms.txt があったのは31.9%（79件）で、到達100件以上の17か国で4位でした。米国（23.1%、p=0.002）・英国（21.5%、p<0.001）・イタリア（20.0%、p=0.022）より高く、フランス（26.4%、p=0.14）・ブラジル（34.1%）とは統計的な差が見られませんでした。日本（13.4%）の2.4倍です。",
            "AI検索に関わる6項目をすべて満たしたのは27.4%（68件）で、17か国中シンガポール・インドに次ぐ3位でした。一方で6項目に1つも当てはまらないサイトが25.8%（64件）あり、6項目の平均は3.67（10位）、JSON-LD は69.0%（12位）でした。",
            "分かれ目は WordPress かどうかでした。WordPress のサイト167件は llms.txt 42.5%・JSON-LD 97.0%・6項目の平均5.11 で、0項目のサイトはありませんでした。WordPress 以外の81件は JSON-LD 11.1%・平均0.72 で、64件（79.0%）が0項目でした。WordPress のサイトどうしで比べると、スペインの llms.txt（42.5%）は米国（30.1%）・フランス（27.5%）・スペイン以外の海外（33.0%）より高い値でした（p<0.001・p<0.001・p=0.009）。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "対象：Web制作会社の自社サイト。当社の収集リストで国がスペインとなっている制作会社サイト485件のうち、トップページに到達できた248件です。一般企業のサイト全体ではありません。比較には同じ調査のスペイン語圏の中南米4か国（メキシコ116件・コロンビア81件・アルゼンチン76件・チリ50件、計323件）・フランス（405件）・イタリア（110件）・ポルトガル（46件）・英国（942件）・米国（4,472件）・日本（2,486件）・スペイン以外の海外（13,104件）を使いました。",
            "取得したもの：各サイトのトップページ、/robots.txt、/llms.txt、/llms-full.txt を1回ずつ（User-Agent：NurevoSurvey/1.0）。2026年11月上旬〜12日に取得し、11月12日に集計しました。",
            "判定方法：llms.txt は、ステータス200で中身がHTMLではなく20文字を超えるテキストを「あり」としました。JSON-LD はトップページにあるかどうか、「壊れている」は JSON として読み込めないブロックが1つ以上あるもの。Organization系は @type に Organization・LocalBusiness・Corporation・ProfessionalService を含むもの。WordPress はHTMLに wp-content・wp-includes・WordPress の generator があるものです。",
            "AIボットのブロック：robots.txt で、各ボットに当てはまるグループの規則がトップページ（/）を Disallow にするか（最長一致）で判定しました。分母は robots.txt があるサイトです。「AIボットをブロック」は GPTBot・ClaudeBot・PerplexityBot・Google-Extended・CCBot・OAI-SearchBot のどれかをブロックしているもの。「AIボットに言及」は Googlebot・Bingbot 以外の11種のAIボットのどれかを User-agent で名指ししているものです。",
            "「6項目」は、(1) llms.txt がある、(2) JSON-LD がある、(3) Organization または LocalBusiness の型がある、(4) robots.txt があり GPTBot・ClaudeBot・PerplexityBot・OAI-SearchBot のどれもブロックしていない、(5) meta description がある、(6) canonical がある、のうち当てはまる数（0〜6）です。この調査のための単純な目安で、AIの回答に載るかどうかを示すものではありません。",
            "HTTP 202：スペインでトップページがステータス202を返したのは14件（到達件数の5.6%）で、すべて WordPress 以外のサイトでした。米国（15.0%）・英国（14.9%）より少ない割合です。202のページはほとんどの項目が「なし」になるため、ステータス200のサイトだけで比べた値も本文に書きました。",
            "統計：スペインと他の地域の差はカイ二乗検定で、件数が小さいAIボットのブロックはフィッシャーの正確検定で確かめました。30件未満の区分は載せていません（ポルトガルのAIボットのブロック率は robots.txt があるサイトが27件のため「—」）。地域（州・都市）は収集リストの248件中198件で空欄だったため、地域別の分析はしていません。",
          ],
        },
        {
          heading: "結果：スペインと中南米・フランス・イタリア・ポルトガル・英国・米国・日本の比較",
          paragraphs: [
            "スペインは llms.txt（31.9%）・FAQPage（12.5%）・6項目すべて（27.4%）で、米国・英国より高い値でした（llms.txt は対米国 p=0.002・対英国 p<0.001、FAQPage は対米国 p<0.001・対英国 p=0.026、6項目すべては対米国 p=0.001・対英国 p<0.001）。JSON-LD（69.0%）は米国（69.0%）・英国（68.8%）と同じ水準でした。スペイン以外の海外と比べると、llms.txt（p=0.048）と6項目すべて（p=0.031）は高く、meta description・canonical・robots.txt はやや低い値でした（p=0.044・0.029・0.010）。",
            "隣のフランスとは形が違いました。フランスは JSON-LD（90.1%）・meta description（90.4%）・canonical（93.6%）・robots.txt（93.3%）が20ポイント前後高く（いずれも p<0.001）、0項目のサイトは3.7%だけでした。一方で llms.txt（26.4%、p=0.14）と6項目すべて（24.0%、p=0.32）にはスペインとの統計的な差が見られませんでした。イタリアに対しては、スペインは llms.txt（p=0.022）・6項目すべて（p=0.039）・JSON-LD（p<0.001）で高い値でした。",
            "スペイン語圏の中南米4か国と比べると、スペインは JSON-LD（69.0%・54.8%、p<0.001）・6項目すべて（27.4%・18.3%、p=0.009）が高く、llms.txt は31.9%と24.5%でした（p=0.050）。ステータス200のサイトだけ（スペイン234件）で比べると、llms.txt は33.8%で米国（27.2%、p=0.028）・英国（25.3%、p=0.011）より高く、スペイン以外の海外（29.6%、p=0.16）とは差がはっきりしませんでした。6項目すべては29.1%で、米国（22.3%、p=0.016）より高い値でした。",
          ],
          table: {
            head: HEAD_JA,
            rows: COMPARE_JA,
            caption: "Web制作会社の自社サイトで、トップページに到達できたもの。「AIボットをブロック」「AIボットに言及」の分母は robots.txt があるサイト（スペイン178件・中南米4か国217件・フランス378件・イタリア63件・英国699件・米国3,404件・日本2,281件・スペイン以外の海外10,292件。ポルトガルは27件で30件未満のため省略）。2026年11月12日集計。",
          },
        },
        {
          heading: "17か国の中での位置",
          paragraphs: [
            "到達できたサイトが100件以上ある17か国（日本を含む）を llms.txt の割合で並べました。スペインは llms.txt で4位、6項目すべてで3位、FAQPage で5位でした。一方、6項目の平均は10位、JSON-LD は12位で、上位の項目と中位の項目が混ざっています。これは次の章で見るように、項目のそろったサイトと、ほとんど何もないサイトに分かれているためです。",
          ],
          table: {
            head: ["国", "到達件数", "llms.txt", "6項目すべて", "6項目の平均", "JSON-LD", "FAQPage", "AIボットをブロック"],
            rows: COUNTRIES.map(([ja, , ...v]) => [ja, ...v]),
            caption: "到達できたサイトが100件以上の国。llms.txt の割合の高い順。「AIボットをブロック」の分母は robots.txt があるサイト。2026年11月12日集計。",
          },
        },
        {
          heading: "WordPress かどうかで二つに分かれる",
          paragraphs: [
            "スペインの制作会社サイトの67.3%（167件）が WordPress でした。WordPress のサイトは JSON-LD 97.0%・6項目の平均5.11 で、0項目のサイトはなく、96.4%が4項目以上、80.2%が5項目以上でした。WordPress 以外の81件は JSON-LD 11.1%・平均0.72 で、64件（79.0%）が0項目でした。0項目の64件は、ステータス202を返した14件と、ステータス200で返ったものの構造化データ・meta description・canonical・robots.txt・llms.txt のどれも見つからなかった50件です。JavaScript で後から中身を出すサイトや、ホスティング側で robots.txt を出さないサイトは、この調査では「なし」になります。",
            "WordPress のサイトどうしで比べると、スペインは llms.txt 42.5%・6項目すべて37.7% で、米国（30.1%・25.2%）・フランス（27.5%・25.9%）・スペイン以外の海外（33.0%・27.9%）より高い値でした（llms.txt p<0.001・p<0.001・p=0.009）。中南米4か国（38.3%、p=0.44）・イタリア（36.8%、p=0.45）とは差が見られませんでした。WordPress 以外のサイトで項目が少ない傾向は、米国・イタリア・中南米4か国でも同じでした。",
          ],
          table: {
            head: ["区分", "件数", "HTTP 202（件）", "llms.txt", "JSON-LD", "6項目すべて", "6項目の平均"],
            rows: WPSPLIT.map(([ja, , ...v]) => [ja, ...v]),
            caption: "到達できたサイトを WordPress かどうかで分けたもの。米国・スペイン以外の海外・日本・フランスの WordPress 以外は、他のレポートを参照してください（フランスの WordPress 以外は31件）。",
          },
        },
        {
          heading: "ボット別のブロック率",
          paragraphs: [
            "スペインで robots.txt があるサイト178件について、ボットごとにトップページをブロックしている割合です。学習用とされるボット（CCBot・Bytespider・GPTBot・Applebot-Extended・ClaudeBot・Google-Extended・anthropic-ai）は3.9〜5.6%（7〜10件）で、米国（3.3〜4.1%）よりやや高く、中南米4か国（7.4〜9.2%）・イタリア（4.8〜9.5%）より低く、フランス（1.1〜1.9%）より高い値でした。AIボットのブロック率はフランス（1.9%）より高く（p=0.031）、米国（4.3%、p=0.45）・英国（4.7%、p=0.57）とは差が見られませんでした。検索用・質問時の取得に使われる OAI-SearchBot・ChatGPT-User・Claude-SearchBot・PerplexityBot は、どれも同じ2件（1.1%）でした。",
          ],
          table: {
            head: ["ボット", "スペイン（件数）", "スペイン", "中南米4か国", "フランス", "イタリア", "米国", "日本"],
            rows: BOTS,
            caption: "分母は robots.txt があるサイト（スペイン178件・中南米4か国217件・フランス378件・イタリア63件・米国3,404件・日本2,281件）。トップページ（/）に対する判定。スペインの件数は小さい数です。",
          },
        },
        {
          heading: "ブロックの中身（事実）",
          list: [
            "GPTBot をブロックしていた9件のうち7件は、OAI-SearchBot をブロックしていませんでした。残りの2件は、Googlebot・Bingbot 以外の11種のAIボットをすべてブロックしていました。",
            "11種のAIボットのどれかをブロックしていた11件のうち5件は、GPTBot・ClaudeBot・anthropic-ai・Google-Extended・CCBot・Bytespider・Applebot-Extended の7つをまとめてブロックする同じ組み合わせでした。11種すべてが2件、残りの4件は Bytespider だけ・GPTBot と CCBot など、それぞれ別の組み合わせでした。",
            "Googlebot・Bingbot をブロックしていたサイトはありませんでした。",
            "robots.txt でAIボットの名前を挙げていたのは25件（robots.txt があるサイトの14.0%）で、そのうち16件はどのAIボットもトップページをブロックしていませんでした。",
            "AIボットをブロックしていた10件のうち6件には llms.txt もありました。",
            "robots.txt に Sitemap の行があったのは、robots.txt があるサイトの87.6%でした。",
          ],
        },
        {
          heading: "llms.txt の中身と、5項目のサイトに欠けていたもの",
          list: [
            "llms.txt があった79件の行数の中央値は60行でした。llms-full.txt があったのは9件（3.6%）です。",
            "6項目のうち5項目を満たしたサイトは73件で、そのうち66件（90.4%）は欠けていた1項目が llms.txt でした。",
          ],
        },
        {
          heading: "構造化データの型",
          paragraphs: [
            "トップページの JSON-LD に含まれる型は、スペインでは WebSite（66.9%）・WebPage（60.5%）・Organization（60.5%）・ImageObject（60.1%）・SearchAction（59.7%）が多く、米国と近く、中南米4か国・イタリアより高く、フランスより低い値でした。これらは WordPress のSEOプラグインがよく出す型です。位置情報の GeoCoordinates（17.3%）と Place（15.3%）は、表の6地域の中で最も高い値でした。",
          ],
          table: {
            head: ["@type", "スペイン", "中南米4か国", "フランス", "イタリア", "米国", "日本"],
            rows: TYPES,
            caption: "到達できたサイトのうち、トップページの JSON-LD にその型があった割合（入れ子の型も数えます）。スペイン248件・中南米4か国323件・フランス405件・イタリア110件・米国4,472件・日本2,486件。",
          },
        },
        {
          heading: "SEOプラグイン",
          paragraphs: [
            "スペインの WordPress サイト167件では、Yoast SEO が58.1%、Rank Math が30.5%で検出されました。AIOSEO（6件）・SEOPress（2件）・検出なし（11件）は30件未満のため表に載せていません。llms.txt があった割合は Rank Math 54.9%、Yoast SEO 38.1%でした。プラグインごとの差には、llms.txt を出す機能の有無や設定が関わっている可能性がありますが、この調査では原因を確かめていません。",
          ],
          table: {
            head: ["SEOプラグイン", "スペインの WordPress サイト", "割合", "llms.txt", "JSON-LD", "6項目すべて", "6項目の平均"],
            rows: PLUGINS,
            caption: "スペインの WordPress サイト167件。プラグインはトップページのHTMLの文字列で判定（Yoast → Rank Math → AIOSEO → SEOPress の順に最初に当てはまったもの）。30件未満の区分は省略。",
          },
        },
        {
          heading: ".es と .com",
          paragraphs: [
            "スペインの制作会社サイトを、ドメインの末尾で分けました。到達248件のうち .com が145件、.es が73件、それ以外が30件です。.es は llms.txt 27.4%・6項目すべて21.9%、.com は33.1%・28.3% で、統計的な差は見られませんでした（p=0.39・0.31）。WordPress の割合も同じ程度でした（65.8%・66.9%）。",
          ],
          table: {
            head: ["ドメイン", "到達件数", "HTTP 202", "WordPress", "llms.txt", "JSON-LD", "6項目すべて", "6項目の平均"],
            rows: DOMAINS.map(([d, ...v]) => [d.replace("その他 / other", "その他"), ...v]),
            caption: "スペインの到達248件を、ホスト名の末尾で分けたもの。HTTP 202 の割合はその区分の到達件数に対するもの。",
          },
        },
        {
          heading: "6項目の分布",
          paragraphs: [
            "スペインは「6項目」（27.4%）と「5項目」（29.4%）が多い一方、「0項目」も25.8%あり、1〜3項目は合わせて6.0%だけでした。フランスは「5項目」が50.4%で「0項目」が3.7%、日本は「0項目」が1.6%で2〜4項目の層が厚い（41.4%）形です。イタリア（0項目41.8%）・中南米4か国（30.7%）・米国（22.1%）はスペインと同じく両端に分かれる形でした。",
          ],
          table: {
            head: ["当てはまる項目数", "スペイン", "中南米4か国", "フランス", "イタリア", "米国", "日本"],
            rows: DIST,
            caption: "到達できたサイトに占める割合。スペイン248件、中南米4か国323件、フランス405件、イタリア110件、米国4,472件、日本2,486件。",
          },
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "この調査の数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。そのまま使える1文：",
          ],
          list: [
            "スペインのWeb制作会社の自社サイトの31.9%に llms.txt があり、到達100件以上の17か国で4位だった（米国23.1%、英国21.5%、日本13.4%）（Nurevo AEO 調査、2026年11月、248件）。",
            "スペインのWeb制作会社の自社サイトの27.4%が、AI検索に関わる6項目をすべて満たしていた一方、25.8%は1つも満たしていなかった（Nurevo AEO 調査、2026年11月）。",
            "スペインのWeb制作会社の WordPress サイトの42.5%に llms.txt があり、米国（30.1%）・フランス（27.5%）の WordPress サイトより高かった（Nurevo AEO 調査、2026年11月）。",
            "スペインのWeb制作会社のサイトで WordPress 以外の81件のうち79.0%は、構造化データ・meta description・canonical・robots.txt・llms.txt のどれも確認できなかった（Nurevo AEO 調査、2026年11月）。",
            "スペインのWeb制作会社の自社サイトで robots.txt でAIボットをブロックしていたのは5.6%で、検索用のボットをブロックしていたのは178件中2件だった（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "限界",
          list: [
            "対象はWeb制作会社の自社サイトで、一般企業のサイト全体ではありません。国は当社の収集リストの記載によるもので、スペインの制作会社全体を代表する標本ではありません。到達248件は17か国の中では小さく、地域ごとの分析は行っていません。ボット別の件数などは小さい数です。",
            "トップページだけを見ています。robots.txt はトップページ（/）に対する判定で、一部のディレクトリだけのブロックや、ファイアウォール・CDN によるブロックは数えていません。llms.txt は有無だけを見て、中身の質は見ていません。",
            "各サイト1回の取得で、到達できなかったサイト（237件）は除いています。HTTP 202 を返した14件は、実際のトップページとは違うページを見ている可能性があります。JavaScript で後から出す中身や構造化データは数えていないため、WordPress 以外のサイトの値は低めに出ている可能性があります。",
            "SEOプラグインはHTMLの文字列による判定で、痕跡を消している場合や複数入っている場合は正しく分けられません。",
            "今回の数字は2026年11月12日の集計です。週ごとに取り直すため、次の集計では値が変わることがあります。",
          ],
        },
        {
          heading: "読み方（意見）",
          paragraphs: [
            "ここからは当社の解釈です。スペインの制作会社サイトは、llms.txt と「6項目すべて」で17か国の上位に入りました。WordPress のサイトだけを見ると、llms.txt の割合は米国やフランスより高い値です。一方、WordPress 以外のサイトの多くはこの調査の方法では項目を確認できず、平均を下げています。これが実際に項目がないのか、JavaScript での表示など調査の方法で見えていないだけなのかは、この調査では区別できません。AIボットのブロックは少数で、ほとんどが学習用のボットに限られていました。どのボットをブロックするかは各サイトの判断です。これらの項目がそろっていても、AIの回答に載ることが保証されるわけではありません。",
          ],
        },
        {
          heading: "自社や顧客のサイトを確かめる",
          paragraphs: [
            "[無料チェック](https://nurevo.jp/check)で、llms.txt・構造化データ・AIクローラーの許可を1分ほどで確かめられます。WordPress なら [Nurevo WebMCP プラグイン](https://wordpress.org/plugins/nurevo-webmcp/)で llms.txt の公開と構造化データへの事業情報の追加ができます。顧客のサイトにまとめて入れたい制作会社は[パートナープログラム](https://nurevo.jp/partner/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "スペインの制作会社サイトはAI検索への対応が進んでいますか？", a: "llms.txt では上位です。31.9%で、到達100件以上の17か国で4位でした。6項目すべてを満たしたのは27.4%で3位です。ただし25.8%は6項目に1つも当てはまらず、平均（3.67）は10位でした（2026年11月、制作会社の自社サイト）。" },
        { q: "なぜ上位の項目と中位の項目が混ざっているのですか？", a: "WordPress のサイト（67.3%）とそれ以外で大きく分かれているためです。WordPress のサイトは6項目の平均5.11、WordPress 以外は0.72で、WordPress 以外の79.0%が0項目でした。JavaScript で中身を出すサイトはこの調査では「なし」になるため、低めに出ている可能性があります。" },
        { q: "スペインではAIクローラーをブロックするサイトが多いですか？", a: "少数です。robots.txt があるサイトの5.6%（10件）で、米国（4.3%）・英国（4.7%）と統計的な差はありませんでした。フランス（1.9%）よりは高い値です。検索用のボットをブロックしていたのは2件でした。" },
        { q: "数字を記事で使ってもいいですか？", a: "はい。出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば自由に引用・転載できます。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "自社サイトのAI対応を確かめる",
        body: "無料チェックで llms.txt・構造化データ・AIクローラーの許可を確かめられます。AIの回答への掲載を保証するものではありません。",
        label: "無料でチェックする",
        href: "/check",
        secondary: { label: "制作会社向けパートナープログラム", href: "/partner/" },
      },
      footnote: "調査：Nurevo AEO（Bestie.合同会社）。WordPress は WordPress Foundation の商標です。SEOプラグイン名は各社の商標です。個別の会社名・ドメインは公開していません。",
    },
    en: {
      title: "AI Search Readiness of 248 Spanish Web Agency Websites (2026) | Nurevo",
      description: "248 Spanish web agency sites: 31.9% have an llms.txt (4th of 17 countries) and 27.4% meet all six AI-search items (3rd), yet 25.8% meet none. The split follows WordPress.",
      h1: "AI search readiness of Spanish web design agencies: 248 agency websites (November 2026)",
      lead: "We fetched the home page, robots.txt and llms.txt of 248 Spanish web design agencies' own websites. 31.9% (79 sites) had an llms.txt — fourth among the 17 countries with 100+ sites in our survey, after Singapore, India and Brazil (US 23.1%, UK 21.5%, Japan 13.4%). 27.4% met all six AI-search items we checked, third of 17, but 25.8% met none, so the six-item average (3.67) ranked only tenth. The split follows the CMS: none of the 167 WordPress sites met zero items and 80.2% met five or more, while 79.0% of the 81 non-WordPress sites met none.",
      intro: [
        "Published 27 November 2026. Data aggregated 12 November 2026. Research and writing: Nurevo AEO (Bestie.合同会社, Japan). Nurevo sells AI search optimisation (AEO) tools and a WordPress plugin, so we have an interest in this topic. This is the ninth of our country reports (after the [US](/guide/research-us-web-agencies-ai-search-2026), the [UK](/guide/research-uk-web-agencies-ai-search-2026), [Australia](/guide/research-au-web-agencies-ai-search-2026), [India](/guide/research-in-web-agencies-ai-search-2026), [Canada](/guide/research-ca-web-agencies-ai-search-2026), [France](/guide/research-fr-web-agencies-ai-search-2026), [Singapore](/guide/research-sg-web-agencies-ai-search-2026) and [Brazil](/guide/research-br-web-agencies-ai-search-2026)). A Spanish version is also available.",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "Of 248 Spanish web agency websites, 31.9% (79) had an llms.txt — fourth of the 17 countries with 100+ reached sites. That is higher than the US (23.1%, p=0.002), the UK (21.5%, p<0.001) and Italy (20.0%, p=0.022), with no statistically significant difference from France (26.4%, p=0.14) or Brazil (34.1%), and 2.4 times Japan (13.4%).",
            "27.4% (68) met all six AI-search items, third of 17 after Singapore and India. At the same time 25.8% (64) met none, so the six-item average was 3.67 (tenth) and JSON-LD 69.0% (twelfth).",
            "The dividing line was WordPress. The 167 WordPress sites had llms.txt 42.5%, JSON-LD 97.0% and a six-item average of 5.11, and none scored zero. The 81 non-WordPress sites had JSON-LD 11.1% and an average of 0.72, and 64 of them (79.0%) met no items. Among WordPress sites only, Spain's llms.txt share (42.5%) was higher than in the US (30.1%), France (27.5%) and all other overseas agencies (33.0%) (p<0.001, p<0.001, p=0.009).",
          ],
        },
        {
          heading: "Method",
          list: [
            "Population: web design agencies' own websites. Of the 485 agency sites listed as Spain in our collection list, 248 home pages could be reached. This is not a sample of all business websites. For comparison we use the same survey's four Spanish-speaking Latin American countries (Mexico 116, Colombia 81, Argentina 76, Chile 50; 323 in total), France (405), Italy (110), Portugal (46), the UK (942), the US (4,472), Japan (2,486) and all overseas sites except Spain (13,104).",
            "What we fetched: each site's home page, /robots.txt, /llms.txt and /llms-full.txt, once each (User-Agent: NurevoSurvey/1.0), between early November and 12 November 2026, aggregated on 12 November.",
            "Definitions: an llms.txt counts if it returned status 200 with non-HTML text over 20 characters. JSON-LD means at least one JSON-LD block on the home page; \"broken\" means at least one block that does not parse as JSON. Organization-type means an @type containing Organization, LocalBusiness, Corporation or ProfessionalService. WordPress means wp-content, wp-includes or a WordPress generator tag in the HTML.",
            "AI bot blocking: for each bot, we apply the matching robots.txt group's rules to the home page (/) using longest match. The base is sites with a robots.txt. \"Blocks an AI bot\" means blocking any of GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot or OAI-SearchBot. \"Names an AI bot\" means naming any of the 11 AI bots (all listed bots except Googlebot and Bingbot) in a User-agent line.",
            "\"Six items\" counts how many of these a site meets (0–6): (1) has an llms.txt; (2) has JSON-LD; (3) has an Organization or LocalBusiness type; (4) has a robots.txt that blocks none of GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot; (5) has a meta description; (6) has a canonical link. It is a simple yardstick for this survey and does not show whether a site appears in AI answers.",
            "HTTP 202: 14 Spanish home pages (5.6% of reached) answered with status 202, all of them non-WordPress — fewer than in the US (15.0%) or the UK (14.9%). A 202 page scores \"no\" on almost every item, so we also report figures for status-200 sites only.",
            "Statistics: differences between Spain and other groups were tested with the chi-square test, and AI bot blocking (small counts) with Fisher's exact test. Groups under 30 sites are not shown (AI bot blocking for Portugal, with 27 sites with a robots.txt, is shown as \"—\"). 198 of the 248 sites have no city in our list, so we did not split by region.",
          ],
        },
        {
          heading: "Results: Spain compared with Latin America, France, Italy, Portugal, the UK, the US and Japan",
          paragraphs: [
            "Spain was higher than the US and the UK on llms.txt (31.9%), FAQPage (12.5%) and all six items (27.4%) (llms.txt: vs US p=0.002, vs UK p<0.001; FAQPage: p<0.001, p=0.026; all six: p=0.001, p<0.001). JSON-LD (69.0%) was at the same level as the US (69.0%) and the UK (68.8%). Against all other overseas agencies, Spain was higher on llms.txt (p=0.048) and all six items (p=0.031) and slightly lower on meta descriptions, canonical links and robots.txt (p=0.044, 0.029, 0.010).",
            "Neighbouring France looks different. France was around 20 points higher on JSON-LD (90.1%), meta descriptions (90.4%), canonical links (93.6%) and robots.txt (93.3%) (all p<0.001), and only 3.7% of French sites met no items. Yet there was no statistically significant difference on llms.txt (26.4%, p=0.14) or all six items (24.0%, p=0.32). Against Italy, Spain was higher on llms.txt (p=0.022), all six items (p=0.039) and JSON-LD (p<0.001).",
            "Compared with the four Spanish-speaking Latin American countries, Spain was higher on JSON-LD (69.0% vs 54.8%, p<0.001) and all six items (27.4% vs 18.3%, p=0.009); llms.txt was 31.9% vs 24.5% (p=0.050). Among status-200 sites only (Spain 234), llms.txt was 33.8%, higher than the US (27.2%, p=0.028) and the UK (25.3%, p=0.011), with no clear difference from other overseas agencies (29.6%, p=0.16). All six items was 29.1%, higher than the US (22.3%, p=0.016).",
          ],
          table: {
            head: HEAD_EN,
            rows: COMPARE_EN,
            caption: "Web design agencies' own websites whose home page could be reached. The base for \"blocks\" and \"names an AI bot\" is sites with a robots.txt (Spain 178, Spanish-speaking Latin America 217, France 378, Italy 63, UK 699, US 3,404, Japan 2,281, other overseas 10,292; Portugal has 27, under 30, so not shown). Aggregated 12 November 2026.",
          },
        },
        {
          heading: "Where Spain sits among 17 countries",
          paragraphs: [
            "The 17 countries with 100+ reached sites (including Japan), sorted by llms.txt share. Spain ranks fourth on llms.txt, third on all six items and fifth on FAQPage, but tenth on the six-item average and twelfth on JSON-LD. The mix of high and middling ranks reflects a split between well-equipped sites and sites with almost nothing, shown in the next section.",
          ],
          table: {
            head: ["Country", "Reached", "llms.txt", "All 6 items", "6-item average", "JSON-LD", "FAQPage", "Blocks an AI bot"],
            rows: COUNTRIES.map(([, en, ...v]) => [en, ...v]),
            caption: "Countries with 100+ reached sites, by llms.txt share. The base for \"blocks an AI bot\" is sites with a robots.txt. Aggregated 12 November 2026.",
          },
        },
        {
          heading: "Two groups: WordPress and the rest",
          paragraphs: [
            "67.3% (167) of Spanish agency sites run WordPress. WordPress sites had JSON-LD 97.0% and a six-item average of 5.11; none scored zero, 96.4% met four or more items and 80.2% met five or more. The 81 non-WordPress sites had JSON-LD 11.1% and an average of 0.72, and 64 (79.0%) met no items. Those 64 are the 14 that answered 202 and 50 that answered 200 but had no structured data, meta description, canonical link, robots.txt or llms.txt that we could find. Sites that render content with JavaScript, or whose host serves no robots.txt, score \"no\" in this survey.",
            "Among WordPress sites only, Spain had llms.txt 42.5% and all six items 37.7%, higher than the US (30.1%, 25.2%), France (27.5%, 25.9%) and other overseas agencies (33.0%, 27.9%) (llms.txt p<0.001, p<0.001, p=0.009). There was no significant difference from Spanish-speaking Latin America (38.3%, p=0.44) or Italy (36.8%, p=0.45). Non-WordPress sites scoring low is a pattern we also see in the US, Italy and Spanish-speaking Latin America.",
          ],
          table: {
            head: ["Group", "Sites", "HTTP 202 (sites)", "llms.txt", "JSON-LD", "All 6 items", "6-item average"],
            rows: WPSPLIT.map(([, en, ...v]) => [en, ...v]),
            caption: "Reached sites split by WordPress or not. For non-WordPress sites in the US, other overseas, Japan and France, see our other reports (France has 31 non-WordPress sites).",
          },
        },
        {
          heading: "Blocking by bot",
          paragraphs: [
            "For Spain's 178 sites with a robots.txt, the share blocking each bot from the home page. Bots generally described as training crawlers (CCBot, Bytespider, GPTBot, Applebot-Extended, ClaudeBot, Google-Extended, anthropic-ai) were blocked by 3.9–5.6% (7–10 sites) — slightly above the US (3.3–4.1%), below Spanish-speaking Latin America (7.4–9.2%) and Italy (4.8–9.5%), and above France (1.1–1.9%). Spain's AI bot blocking rate was higher than France's (1.9%, p=0.031) and not significantly different from the US (4.3%, p=0.45) or the UK (4.7%, p=0.57). OAI-SearchBot, ChatGPT-User, Claude-SearchBot and PerplexityBot, used for search or for fetching pages when a user asks, were each blocked by the same two sites (1.1%).",
          ],
          table: {
            head: ["Bot", "Spain (sites)", "Spain", "Spanish-speaking LatAm", "France", "Italy", "US", "Japan"],
            rows: BOTS,
            caption: "Base: sites with a robots.txt (Spain 178, Spanish-speaking Latin America 217, France 378, Italy 63, US 3,404, Japan 2,281). Judged for the home page (/). Spain's counts are small.",
          },
        },
        {
          heading: "What the blocking looks like (facts)",
          list: [
            "7 of the 9 sites blocking GPTBot did not block OAI-SearchBot. The other 2 blocked all 11 AI bots except Googlebot and Bingbot.",
            "Of the 11 sites blocking any of the 11 AI bots, 5 used the same combination of seven: GPTBot, ClaudeBot, anthropic-ai, Google-Extended, CCBot, Bytespider and Applebot-Extended. 2 blocked all 11, and the other 4 each used a different combination (for example Bytespider only, or GPTBot and CCBot).",
            "No site blocked Googlebot or Bingbot.",
            "25 sites (14.0% of sites with a robots.txt) named an AI bot; 16 of them blocked none of the AI bots from the home page.",
            "6 of the 10 sites blocking an AI bot also had an llms.txt.",
            "87.6% of robots.txt files included a Sitemap line.",
          ],
        },
        {
          heading: "llms.txt contents and what five-item sites were missing",
          list: [
            "The median llms.txt among the 79 sites that had one was 60 lines. 9 sites (3.6%) had an llms-full.txt.",
            "73 sites met five of the six items; for 66 of them (90.4%) the missing item was the llms.txt.",
          ],
        },
        {
          heading: "Structured data types",
          paragraphs: [
            "The most common types in Spanish home-page JSON-LD were WebSite (66.9%), WebPage (60.5%), Organization (60.5%), ImageObject (60.1%) and SearchAction (59.7%) — close to the US, above Spanish-speaking Latin America and Italy, and below France. These are the types WordPress SEO plugins typically output. Location types GeoCoordinates (17.3%) and Place (15.3%) were the highest of the six groups in the table.",
          ],
          table: {
            head: ["@type", "Spain", "Spanish-speaking LatAm", "France", "Italy", "US", "Japan"],
            rows: TYPES,
            caption: "Share of reached sites whose home-page JSON-LD includes the type (nested types counted). Spain 248, Spanish-speaking Latin America 323, France 405, Italy 110, US 4,472, Japan 2,486.",
          },
        },
        {
          heading: "SEO plugins",
          paragraphs: [
            "Among Spain's 167 WordPress sites, Yoast SEO was detected on 58.1% and Rank Math on 30.5%. AIOSEO (6 sites), SEOPress (2) and no plugin detected (11) are under 30 and not shown. llms.txt was present on 54.9% of Rank Math sites and 38.1% of Yoast SEO sites. Plugin features or settings for llms.txt may play a part, but this survey did not test causes.",
          ],
          table: {
            head: ["SEO plugin", "Spanish WordPress sites", "Share", "llms.txt", "JSON-LD", "All 6 items", "6-item average"],
            rows: PLUGINS,
            caption: "Spain's 167 WordPress sites. Plugin detected from strings in the home-page HTML (first match in the order Yoast → Rank Math → AIOSEO → SEOPress). Groups under 30 omitted.",
          },
        },
        {
          heading: ".es and .com",
          paragraphs: [
            "Splitting Spanish agency sites by domain ending: of 248 reached, 145 were .com, 73 .es and 30 other. .es sites had llms.txt 27.4% and all six items 21.9%; .com sites 33.1% and 28.3%. Neither difference was statistically significant (p=0.39, 0.31), and the WordPress shares were similar (65.8%, 66.9%).",
          ],
          table: {
            head: ["Domain", "Reached", "HTTP 202", "WordPress", "llms.txt", "JSON-LD", "All 6 items", "6-item average"],
            rows: DOMAINS.map(([d, ...v]) => [d.replace("その他 / other", "Other"), ...v]),
            caption: "Spain's 248 reached sites by host name ending. HTTP 202 share is of the reached sites in each group.",
          },
        },
        {
          heading: "Distribution of the six items",
          paragraphs: [
            "In Spain, six items (27.4%) and five items (29.4%) are common, but so is zero (25.8%); one to three items together account for only 6.0%. France has 50.4% at five items and 3.7% at zero; Japan has 1.6% at zero and a thick middle of two to four items (41.4%). Italy (41.8% at zero), Spanish-speaking Latin America (30.7%) and the US (22.1%) share Spain's two-ended shape.",
          ],
          table: {
            head: ["Items met", "Spain", "Spanish-speaking LatAm", "France", "Italy", "US", "Japan"],
            rows: DIST,
            caption: "Share of reached sites. Spain 248, Spanish-speaking Latin America 323, France 405, Italy 110, US 4,472, Japan 2,486.",
          },
        },
        {
          heading: "Citing this survey",
          paragraphs: [
            "You may quote and republish the figures and tables freely, provided you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. Ready-to-use sentences:",
          ],
          list: [
            "31.9% of Spanish web design agencies' own websites had an llms.txt, fourth among 17 countries (US 23.1%, UK 21.5%, Japan 13.4%) (Nurevo AEO survey, November 2026, 248 sites).",
            "27.4% of Spanish web agency websites met all six AI-search items checked, while 25.8% met none (Nurevo AEO survey, November 2026).",
            "42.5% of Spanish web agencies' WordPress sites had an llms.txt, more than WordPress agency sites in the US (30.1%) or France (27.5%) (Nurevo AEO survey, November 2026).",
            "For 79.0% of the 81 non-WordPress Spanish web agency sites, we found no structured data, meta description, canonical link, robots.txt or llms.txt (Nurevo AEO survey, November 2026).",
            "5.6% of Spanish web agency websites blocked an AI bot in robots.txt, and 2 of 178 blocked a search crawler (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Limitations",
          list: [
            "The population is web design agencies' own websites, not all business websites. Country comes from our collection list, which is not a representative sample of Spanish agencies. 248 reached sites is small among the 17 countries, and we did not analyse by region. Some counts (e.g. by bot) are small.",
            "Only the home page was examined. robots.txt is judged for the home page (/); partial blocks and firewall or CDN blocking are not counted. We checked whether an llms.txt exists, not its quality.",
            "Each site was fetched once; unreachable sites (237) are excluded. The 14 sites answering 202 may have served something other than their real home page. Content or structured data added by JavaScript is not counted, so non-WordPress figures may be understated.",
            "SEO plugins are detected from HTML strings; sites that hide traces or run several plugins may be misclassified.",
            "These figures are from the 12 November 2026 aggregation. We re-run the survey weekly, so later figures may differ.",
          ],
        },
        {
          heading: "How to read this (opinion)",
          paragraphs: [
            "This section is our interpretation. Spanish agency sites rank near the top of 17 countries on llms.txt and on meeting all six items, and Spanish WordPress sites have a higher llms.txt share than those in the US or France. Many non-WordPress sites, however, showed none of the items with our method, which pulls the average down. This survey cannot tell whether those items are truly missing or simply invisible to our method (for example, content rendered with JavaScript). AI bot blocking was rare and mostly limited to training crawlers. Which bots to block is each site's own decision. Having these items in place does not guarantee appearing in AI answers.",
          ],
        },
        {
          heading: "Check your own or your clients' sites",
          paragraphs: [
            "The [free check](https://nurevo.jp/check) shows llms.txt, structured data and AI crawler access in about a minute. On WordPress, the [Nurevo WebMCP plugin](https://wordpress.org/plugins/nurevo-webmcp/) publishes an llms.txt and adds business facts to structured data. Agencies that want to roll this out across client sites can see the [partner programme](https://nurevo.jp/partner/).",
          ],
        },
      ],
      faqs: [
        { q: "Are Spanish agencies ahead on AI search readiness?", a: "On llms.txt, yes: 31.9%, fourth of 17 countries. 27.4% met all six items, third of 17. But 25.8% met none, so the average (3.67) ranked tenth (November 2026, agencies' own websites)." },
        { q: "Why are Spain's ranks a mix of high and middling?", a: "Because WordPress sites (67.3%) and the rest are far apart: a six-item average of 5.11 versus 0.72, with 79.0% of non-WordPress sites meeting no items. Sites that render content with JavaScript score \"no\" in this survey, so they may be understated." },
        { q: "Do many Spanish sites block AI crawlers?", a: "Few: 5.6% of sites with a robots.txt (10 sites), not significantly different from the US (4.3%) or the UK (4.7%), and higher than France (1.9%). Two sites blocked search crawlers." },
        { q: "Can I use these figures in an article?", a: "Yes. Credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page, and you may quote and republish them freely." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Check your site's AI readiness",
        body: "The free check shows your llms.txt, structured data and AI crawler access. It does not guarantee appearing in AI answers.",
        label: "Run the free check",
        href: "/check",
        secondary: { label: "Partner programme for agencies", href: "/partner/" },
      },
      footnote: "Research by Nurevo AEO (Bestie.合同会社). WordPress is a trademark of the WordPress Foundation; SEO plugin names are trademarks of their owners. Individual companies and domains are not published.",
    },
  },
};
