// Content page: research report (country report: Brazil). AI search
// readiness of Brazilian web design agencies' own websites, compared with
// Spanish-speaking Latin America (Mexico, Colombia, Argentina, Chile),
// Spain, Portugal, the US, Japan and all other overseas agencies.
// November 2026.
//
// Every number here comes from nurevo-outreach data/survey/raw_2026-11-12.json
// (survey.js; the same run as summary_2026-11-12.json — the Brazil totals
// match summary.byCountry.BR: 261 reached, llms.txt 34.1%, JSON-LD 74.7%,
// WordPress 76.6%, AI bot blocked 5.5%, all 6 items 25.3%, 6-item average
// 4.1). Country = the "co" field of our collection list (BR; 383 listed, 122
// not reached). Do not add a figure that is not in that data. The raw file
// holds company names and domains: never publish them. Definitions follow
// survey.js (see the US report).
// HTTP 202: 9 Brazilian home pages answered 202 (3.4% of reached). Score 0:
// 37 sites = 9 answering 202 + 28 answering 200 that met none of the 6 items.
// HTTP-200-only: Brazil 252, llms.txt 35.3%, all 6 26.2%, average 4.25;
// US 200: 27.2% (p=0.005) / 22.3% (p=0.15); other overseas 200: 29.5%
// (p=0.046) / 24.5% (p=0.53); Spain 200: 33.8% (p=0.72); Spanish-speaking
// LatAm 200: 26.0% (p=0.018) / 19.7% (p=0.068).
// "Spanish-speaking Latin America" = MX 116 + CO 81 + AR 76 + CL 50 = 323
// reached (no other Latin American country had sites in the list).
// "Other overseas" = all non-Japan sites except Brazil (13,091 reached;
// 10,253 with robots.txt).
// Chi-square (no continuity correction), Brazil vs: Spanish-speaking LatAm
// llms.txt p=0.011, all 6 p=0.040, JSON-LD p<0.001, FAQPage p=0.55;
// Spain llms.txt p=0.59, all 6 p=0.59, JSON-LD p=0.15; Portugal llms.txt
// p=0.29; US llms.txt p<0.001, all 6 p=0.011, JSON-LD p=0.050, FAQPage
// p<0.001; other overseas llms.txt p=0.004, all 6 p=0.17, FAQPage p=0.023;
// Japan llms.txt / all 6 / FAQPage p<0.001, JSON-LD p=0.077.
// AI bot blocking (Fisher's exact test): vs Japan p<0.001, US 0.39, Spanish-
// speaking LatAm 0.11, Spain 1.00, other overseas 0.75.
// WordPress only: Brazil 200, llms.txt 38.5%, all 6 29.0%, average 4.80;
// other overseas WP 33.0% (p=0.10) / 28.0% (p=0.76); US WP 30.1% (p=0.012);
// Spain WP 42.5% (p=0.43); Spanish-speaking LatAm WP 38.3%; Japan WP 14.0%.
// Domain split (.com.br 127 / .com 58 / other 76): llms.txt p=0.66, all 6
// p=0.12, JSON-LD p=0.23 (.com.br vs .com).
// Groups under 30 sites are not shown (AIOSEO 4 Brazilian WordPress sites;
// AI bot blocking for Portugal 27 and Chile 28 sites with robots.txt).
// Portuguese (Brazil) translation:
// src/content/research-br-web-agencies-ai-search-2026/pt-BR.json

// [ja label, en label, pt label, Brazil, Spanish-speaking Latin America (MX+CO+AR+CL), Spain, Portugal, US, Japan, other overseas (excl. Brazil)]
const COMPARE = [
  ["到達件数", "Sites reached", "Sites alcançados", "261", "323", "248", "46", "4,472", "2,486", "13,091"],
  ["HTTP 202 を返した割合", "Answered HTTP 202", "Responderam HTTP 202", "3.4%", "7.1%", "5.6%", "2.2%", "15.0%", "0.0%", "11.2%"],
  ["WordPress", "WordPress", "WordPress", "76.6%", "47.7%", "67.3%", "47.8%", "74.5%", "92.3%", "75.5%"],
  ["llms.txt", "llms.txt", "llms.txt", "34.1%", "24.5%", "31.9%", "26.1%", "23.1%", "13.4%", "26.2%"],
  ["llms-full.txt", "llms-full.txt", "llms-full.txt", "3.4%", "1.9%", "3.6%", "10.9%", "1.5%", "0.6%", "1.8%"],
  ["JSON-LD", "JSON-LD", "JSON-LD", "74.7%", "54.8%", "69.0%", "56.5%", "69.0%", "69.4%", "72.0%"],
  ["JSON-LD が壊れている（JSON-LD があるサイト中）", "Broken JSON-LD (of sites with JSON-LD)", "JSON-LD com erro (entre os sites com JSON-LD)", "1.5%", "0.6%", "1.2%", "0.0%", "1.6%", "1.7%", "1.8%"],
  ["Organization系の型", "Organization-type", "Tipo Organization", "68.2%", "51.4%", "62.9%", "56.5%", "59.4%", "58.9%", "63.5%"],
  ["FAQPage", "FAQPage", "FAQPage", "13.4%", "11.8%", "12.5%", "15.2%", "6.2%", "3.9%", "9.3%"],
  ["microdata（schema.org）", "Microdata (schema.org)", "Microdata (schema.org)", "16.5%", "18.6%", "22.2%", "8.7%", "19.1%", "7.8%", "19.7%"],
  ["meta description", "Meta description", "Meta description", "77.4%", "60.4%", "65.7%", "54.3%", "68.0%", "90.7%", "71.3%"],
  ["Open Graph", "Open Graph", "Open Graph", "78.9%", "59.4%", "67.3%", "56.5%", "69.1%", "81.3%", "72.3%"],
  ["canonical", "Canonical link", "Link canonical", "79.7%", "60.4%", "70.6%", "58.7%", "74.3%", "84.6%", "76.3%"],
  ["robots.txt", "robots.txt", "robots.txt", "83.1%", "67.2%", "71.8%", "58.7%", "76.1%", "91.8%", "78.3%"],
  ["AIボットをブロック（robots.txt があるサイト中）", "Blocks an AI bot (of sites with robots.txt)", "Bloqueia um robô de IA (entre os sites com robots.txt)", "5.5%", "10.1%", "5.6%", "—", "4.3%", "1.3%", "5.1%"],
  ["robots.txt でAIボットに言及", "robots.txt names an AI bot", "O robots.txt cita um robô de IA", "13.4%", "23.0%", "14.0%", "—", "8.8%", "2.5%", "11.7%"],
  ["6項目の平均", "6-item average", "Média dos 6 critérios", "4.11", "3.09", "3.67", "3.02", "3.65", "4.05", "3.82"],
  ["5項目以上", "5+ items", "5 critérios ou mais", "63.2%", "43.7%", "56.9%", "47.8%", "54.6%", "52.2%", "58.1%"],
  ["6項目すべて", "All 6 items", "Todos os 6 critérios", "25.3%", "18.3%", "27.4%", "23.9%", "18.9%", "10.4%", "21.7%"],
];

// [ja, en, pt, reached, llms.txt, all 6, 6-item average, JSON-LD, FAQPage, AI bot blocked]  countries with 100+ reached, by llms.txt share
const COUNTRIES = [
  ["シンガポール", "Singapore", "Singapura", "641", "38.8%", "32.4%", "4.36", "80.8%", "15.0%", "5.7%"],
  ["インド", "India", "Índia", "1,554", "36.6%", "29.9%", "4.53", "84.4%", "14.5%", "5.8%"],
  ["ブラジル", "Brazil", "Brasil", "261", "34.1%", "25.3%", "4.11", "74.7%", "13.4%", "5.5%"],
  ["スペイン", "Spain", "Espanha", "248", "31.9%", "27.4%", "3.67", "69.0%", "12.5%", "5.6%"],
  ["フィリピン", "Philippines", "Filipinas", "241", "31.5%", "27.0%", "4.27", "80.1%", "12.0%", "7.2%"],
  ["南アフリカ", "South Africa", "África do Sul", "389", "29.3%", "24.4%", "3.90", "74.6%", "9.5%", "7.5%"],
  ["フランス", "France", "França", "405", "26.4%", "24.0%", "4.71", "90.1%", "13.1%", "1.9%"],
  ["ニュージーランド", "New Zealand", "Nova Zelândia", "417", "25.4%", "20.9%", "3.80", "70.3%", "7.4%", "5.8%"],
  ["オーストラリア", "Australia", "Austrália", "1,719", "24.3%", "20.8%", "3.77", "71.3%", "10.3%", "4.7%"],
  ["オランダ", "Netherlands", "Países Baixos", "127", "23.6%", "18.9%", "3.66", "74.0%", "3.9%", "7.6%"],
  ["米国", "US", "EUA", "4,472", "23.1%", "18.9%", "3.65", "69.0%", "6.2%", "4.3%"],
  ["カナダ", "Canada", "Canadá", "908", "22.9%", "18.9%", "3.58", "68.1%", "8.0%", "3.5%"],
  ["英国", "UK", "Reino Unido", "942", "21.5%", "17.7%", "3.61", "68.8%", "8.0%", "4.7%"],
  ["メキシコ", "Mexico", "México", "116", "20.7%", "18.1%", "3.06", "55.2%", "10.3%", "4.1%"],
  ["イタリア", "Italy", "Itália", "110", "20.0%", "17.3%", "2.70", "49.1%", "2.7%", "9.5%"],
  ["アイルランド", "Ireland", "Irlanda", "266", "19.5%", "17.3%", "3.28", "62.8%", "6.8%", "3.3%"],
  ["日本", "Japan", "Japão", "2,486", "13.4%", "10.4%", "4.05", "69.4%", "3.9%", "1.3%"],
];

// [ja, en, pt, reached, HTTP 202, WordPress, llms.txt, all 6, 6-item average, JSON-LD, AI bot blocked (— = under 30 sites with robots.txt)]
const IBERO = [
  ["ブラジル", "Brazil", "Brasil", "261", "3.4%", "76.6%", "34.1%", "25.3%", "4.11", "74.7%", "5.5%"],
  ["ポルトガル", "Portugal", "Portugal", "46", "2.2%", "47.8%", "26.1%", "23.9%", "3.02", "56.5%", "—"],
  ["スペイン", "Spain", "Espanha", "248", "5.6%", "67.3%", "31.9%", "27.4%", "3.67", "69.0%", "5.6%"],
  ["メキシコ", "Mexico", "México", "116", "10.3%", "56.9%", "20.7%", "18.1%", "3.06", "55.2%", "4.1%"],
  ["コロンビア", "Colombia", "Colômbia", "81", "2.5%", "48.1%", "30.9%", "22.2%", "3.44", "60.5%", "10.2%"],
  ["アルゼンチン", "Argentina", "Argentina", "76", "2.6%", "43.4%", "28.9%", "21.1%", "3.34", "57.9%", "12.5%"],
  ["チリ", "Chile", "Chile", "50", "14.0%", "32.0%", "16.0%", "8.0%", "2.20", "40.0%", "—"],
];

// [bot, Brazil blocked, Brazil %, Spanish-speaking LatAm %, Spain %, US %, Japan %]  base = sites with robots.txt (BR 217 / LAT4 217 / ES 178 / US 3,404 / JP 2,281)
const BOTS = [
  ["Bytespider", "11", "5.1%", "8.8%", "5.6%", "4.1%", "1.1%"],
  ["CCBot", "12", "5.5%", "9.2%", "5.6%", "4.1%", "1.1%"],
  ["GPTBot", "11", "5.1%", "8.8%", "5.1%", "3.8%", "1.2%"],
  ["ClaudeBot", "10", "4.6%", "8.3%", "4.5%", "3.5%", "1.0%"],
  ["Google-Extended", "10", "4.6%", "7.4%", "4.5%", "3.6%", "1.1%"],
  ["anthropic-ai", "9", "4.1%", "7.8%", "3.9%", "3.4%", "1.0%"],
  ["Applebot-Extended", "9", "4.1%", "8.3%", "5.1%", "3.3%", "1.0%"],
  ["OAI-SearchBot", "1", "0.5%", "0.5%", "1.1%", "0.3%", "0.0%"],
  ["ChatGPT-User", "1", "0.5%", "0.9%", "1.1%", "0.4%", "0.1%"],
  ["Claude-SearchBot", "1", "0.5%", "0.0%", "1.1%", "0.3%", "0.0%"],
  ["PerplexityBot", "1", "0.5%", "0.5%", "1.1%", "0.3%", "0.1%"],
  ["Googlebot", "1", "0.5%", "0.0%", "0.0%", "0.1%", "0.0%"],
  ["Bingbot", "1", "0.5%", "0.0%", "0.0%", "0.1%", "0.0%"],
];

// [type, Brazil, Spanish-speaking LatAm, Spain, US, Japan]  share of reached sites whose home page JSON-LD has the @type
const TYPES = [
  ["WebSite", "70.9%", "49.8%", "66.9%", "65.7%", "63.0%"],
  ["Organization", "64.8%", "45.5%", "60.5%", "55.4%", "54.4%"],
  ["WebPage", "64.0%", "40.9%", "60.5%", "59.3%", "34.4%"],
  ["SearchAction", "62.8%", "36.8%", "59.7%", "56.8%", "28.9%"],
  ["ImageObject", "62.1%", "44.3%", "60.1%", "54.5%", "38.3%"],
  ["ListItem", "43.7%", "29.1%", "40.7%", "44.6%", "43.8%"],
  ["BreadcrumbList", "42.5%", "28.5%", "39.9%", "44.5%", "43.4%"],
  ["EntryPoint", "40.6%", "22.0%", "36.3%", "40.1%", "17.7%"],
  ["ReadAction", "38.7%", "21.4%", "37.1%", "38.3%", "8.5%"],
  ["PropertyValueSpecification", "32.6%", "18.6%", "33.1%", "35.1%", "10.9%"],
  ["PostalAddress", "28.4%", "22.6%", "29.4%", "24.3%", "16.4%"],
  ["Person", "17.6%", "14.9%", "18.1%", "15.6%", "10.2%"],
  ["ContactPoint", "15.3%", "13.9%", "15.7%", "12.5%", "6.5%"],
  ["Question", "13.4%", "11.8%", "12.5%", "6.2%", "3.9%"],
];

// [plugin, Brazil WP sites, share, llms.txt, JSON-LD, all 6, 6-item average]  Brazil WordPress 200; AIOSEO (4) omitted
const PLUGINS = [
  ["Yoast SEO", "108", "54.0%", "28.7%", "99.1%", "23.1%", "4.96"],
  ["Rank Math", "52", "26.0%", "55.8%", "98.1%", "44.2%", "5.33"],
  ["検出なし / none detected", "36", "18.0%", "36.1%", "44.4%", "16.7%", "3.44"],
];

// [domain, reached, HTTP 202, llms.txt, JSON-LD, all 6, 6-item average]
const DOMAINS = [
  [".com.br", "127", "0.0%", "37.8%", "80.3%", "29.9%", "4.42"],
  [".com", "58", "6.9%", "34.5%", "72.4%", "19.0%", "4.12"],
  ["その他 / other", "76", "6.6%", "27.6%", "67.1%", "22.4%", "3.58"],
];

// [items met, Brazil, Spanish-speaking LatAm, Spain, US, Japan]
const DIST = [
  ["0", "14.2%", "30.7%", "25.8%", "22.1%", "1.6%"],
  ["1", "2.3%", "4.3%", "2.4%", "2.5%", "4.8%"],
  ["2", "5.0%", "6.2%", "2.8%", "4.3%", "10.7%"],
  ["3", "4.2%", "5.0%", "0.8%", "3.6%", "15.4%"],
  ["4", "11.1%", "10.2%", "11.3%", "12.8%", "15.3%"],
  ["5", "37.9%", "25.4%", "29.4%", "35.7%", "41.8%"],
  ["6", "25.3%", "18.3%", "27.4%", "18.9%", "10.4%"],
];

const HEAD_JA = ["項目", "ブラジル", "スペイン語圏の中南米4か国", "スペイン", "ポルトガル", "米国", "日本", "ブラジル以外の海外"];
const HEAD_EN = ["Item", "Brazil", "Spanish-speaking Latin America (4)", "Spain", "Portugal", "US", "Japan", "Other overseas"];

export default {
  slug: "research-br-web-agencies-ai-search-2026",
  targetQueries: [
    "ブラジル Web制作会社 AI検索 対応状況 調査",
    "ブラジル llms.txt 導入率",
    "Brazil web design agencies AI search readiness survey",
    "llms.txt adoption Brazil Latin America 2026",
    "agências web brasileiras busca por IA llms.txt pesquisa",
    "agências de criação de sites robots.txt GPTBot bloqueio",
  ],
  related: ["research-us-web-agencies-ai-search-2026", "research-fr-web-agencies-ai-search-2026", "research-sg-web-agencies-ai-search-2026", "research-wordpress-vs-non-wordpress-2026", "research-japan-web-agencies-ai-search-2026", "llms-txt"],
  locales: {
    ja: {
      title: "ブラジルのWeb制作会社261社のAI検索対応を調査【2026年11月】 | Nurevo",
      description: "ブラジルのWeb制作会社の自社サイト261件を調査。llms.txt は34.1%で17か国中3位（日本13.4%・米国23.1%）。スペイン語圏の中南米4か国（24.5%）より高く、AIボットのブロックは5.5%でした。",
      h1: "ブラジルのWeb制作会社の自社サイト261件に見るAI検索への対応（2026年11月）",
      lead: "ブラジルのWeb制作会社の自社サイト261件のトップページ・robots.txt・llms.txt を調べたところ、llms.txt があったのは34.1%（89件）で、到達100件以上の17か国の中でシンガポール・インドに次ぐ3位でした（米国23.1%、日本13.4%）。AI検索に関わる6項目をすべて満たしたのは25.3%で、スペイン語圏の中南米4か国（メキシコ・コロンビア・アルゼンチン・チリ、18.3%）や米国（18.9%）より高く、スペイン（27.4%）とは統計的な差が見られませんでした。AIボットをブロックしていたのは5.5%（12件）で、検索用のボットをブロックしていたのは、すべてのボットを拒否していた1件だけでした。",
      intro: [
        "公開：2026年11月25日。データ：2026年11月12日集計。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策（AEO）のツールと WordPress プラグインを提供しており、この分野に利害があります。国別レポートの8本目で、中南米の国では初めてです（これまでに[米国](/guide/research-us-web-agencies-ai-search-2026)・[英国](/guide/research-uk-web-agencies-ai-search-2026)・[オーストラリア](/guide/research-au-web-agencies-ai-search-2026)・[インド](/guide/research-in-web-agencies-ai-search-2026)・[カナダ](/guide/research-ca-web-agencies-ai-search-2026)・[フランス](/guide/research-fr-web-agencies-ai-search-2026)・[シンガポール](/guide/research-sg-web-agencies-ai-search-2026)）。英語版とポルトガル語（ブラジル）版もあります。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "ブラジルのWeb制作会社の自社サイト261件のうち、llms.txt があったのは34.1%（89件）で、到達100件以上の17か国でシンガポール（38.8%）・インド（36.6%）に次ぐ3位でした。米国（23.1%）・ブラジル以外の海外全体（26.2%）より高く（p<0.001・p=0.004）、日本（13.4%）の2.5倍です。スペイン（31.9%、p=0.59）との間に統計的な差は見られませんでした。",
            "AI検索に関わる6項目をすべて満たしたのは25.3%（66件）、6項目の平均は4.11でした。スペイン語圏の中南米4か国（18.3%・3.09）より高く（6項目すべて p=0.040）、JSON-LD（74.7%・54.8%）・meta description・canonical・robots.txt でも差が大きく（いずれも p<0.001）、WordPress の割合（76.6%・47.7%）も大きく違いました。WordPress のサイトどうしで比べると、llms.txt はブラジル38.5%、中南米4か国38.3%とほぼ同じでした。",
            "robots.txt があるサイト217件のうち、AIボットをブロックしていたのは5.5%（12件）で、米国（4.3%、p=0.39）・ブラジル以外の海外（5.1%）と統計的な差はなく、日本（1.3%）より高い値です。GPTBot をブロックしていた11件のうち10件は OAI-SearchBot を許可しており、検索用・質問時の取得に使われる4つのボットをブロックしていたのは、Googlebot も含めてすべてのボットを拒否していた1件だけでした。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "対象：Web制作会社の自社サイト。当社の収集リストで国がブラジルとなっている制作会社サイト383件のうち、トップページに到達できた261件です。一般企業のサイト全体ではありません。比較には同じ調査のスペイン語圏の中南米4か国（メキシコ116件・コロンビア81件・アルゼンチン76件・チリ50件、計323件）・スペイン（248件）・ポルトガル（46件）・米国（4,472件）・日本（2,486件）・ブラジル以外の海外（13,091件）を使いました。",
            "取得したもの：各サイトのトップページ、/robots.txt、/llms.txt、/llms-full.txt を1回ずつ（User-Agent：NurevoSurvey/1.0）。2026年11月上旬〜12日に取得し、11月12日に集計しました。",
            "判定方法：llms.txt は、ステータス200で中身がHTMLではなく20文字を超えるテキストを「あり」としました。JSON-LD はトップページにあるかどうか、「壊れている」は JSON として読み込めないブロックが1つ以上あるもの。Organization系は @type に Organization・LocalBusiness・Corporation・ProfessionalService を含むもの。WordPress はHTMLに wp-content・wp-includes・WordPress の generator があるものです。",
            "AIボットのブロック：robots.txt で、各ボットに当てはまるグループの規則がトップページ（/）を Disallow にするか（最長一致）で判定しました。分母は robots.txt があるサイトです。「AIボットをブロック」は GPTBot・ClaudeBot・PerplexityBot・Google-Extended・CCBot・OAI-SearchBot のどれかをブロックしているもの。「AIボットに言及」は Googlebot・Bingbot 以外の11種のAIボットのどれかを User-agent で名指ししているものです。",
            "「6項目」は、(1) llms.txt がある、(2) JSON-LD がある、(3) Organization または LocalBusiness の型がある、(4) robots.txt があり GPTBot・ClaudeBot・PerplexityBot・OAI-SearchBot のどれもブロックしていない、(5) meta description がある、(6) canonical がある、のうち当てはまる数（0〜6）です。この調査のための単純な目安で、AIの回答に載るかどうかを示すものではありません。",
            "HTTP 202：ブラジルでトップページがステータス202を返したのは9件（到達件数の3.4%）で、米国（15.0%）・ブラジル以外の海外（11.2%）より少ない割合でした。202のページはほとんどの項目が「なし」になるため、国どうしの比較に影響します。ステータス200のサイトだけで比べた値も本文に書きました。",
            "統計：ブラジルと他の地域の差はカイ二乗検定で、件数が小さいAIボットのブロックはフィッシャーの正確検定で確かめました。30件未満の区分は載せていません（ポルトガルとチリのAIボットのブロック率は、robots.txt があるサイトが30件未満のため「—」）。",
          ],
        },
        {
          heading: "結果：ブラジルと中南米・スペイン・ポルトガル・米国・日本の比較",
          paragraphs: [
            "ブラジルは llms.txt（34.1%）・FAQPage（13.4%）・6項目すべて（25.3%）で、米国とブラジル以外の海外より高い値でした（llms.txt は対米国 p<0.001・対海外 p=0.004、FAQPage は対米国 p<0.001・対海外 p=0.023、6項目すべては対米国 p=0.011・対海外 p=0.17）。スペインとは llms.txt・6項目すべて・JSON-LD のどれも統計的な差がなく（p=0.59・0.59・0.15）、ポルトガル（46件）とも llms.txt に差は見られませんでした（26.1%、p=0.29）。",
            "スペイン語圏の中南米4か国と比べると、ブラジルは JSON-LD（74.7%・54.8%）・Organization系の型（68.2%・51.4%）・meta description（77.4%・60.4%）・canonical（79.7%・60.4%）・robots.txt（83.1%・67.2%）が16〜20ポイント高く（いずれも p<0.001）、WordPress の割合も76.6%と47.7%で大きく違いました。WordPress のサイトだけで比べると、llms.txt はブラジル38.5%・中南米4か国38.3%とほぼ同じで、全体の差の多くは WordPress の割合の違いと重なっています。",
            "ステータス200のサイトだけ（ブラジル252件）で比べても、llms.txt は35.3%で米国（27.2%、p=0.005）・ブラジル以外の海外（29.5%、p=0.046）より高く、スペイン（33.8%、p=0.72）とは差がありませんでした。6項目すべては26.2%で、米国（22.3%、p=0.15）・海外（24.5%、p=0.53）との差ははっきりしなくなります。",
          ],
          table: {
            head: HEAD_JA,
            rows: COMPARE.map(([ja, , , ...v]) => [ja, ...v]),
            caption: "Web制作会社の自社サイトで、トップページに到達できたもの。「AIボットをブロック」「AIボットに言及」の分母は robots.txt があるサイト（ブラジル217件・中南米4か国217件・スペイン178件・米国3,404件・日本2,281件・ブラジル以外の海外10,253件。ポルトガルは27件で30件未満のため省略）。2026年11月12日集計。",
          },
        },
        {
          heading: "17か国の中での位置",
          paragraphs: [
            "到達できたサイトが100件以上ある17か国（日本を含む）を llms.txt の割合で並べました。ブラジルは llms.txt で3位、FAQPage（13.4%）でシンガポール・インドに次ぐ3位、6項目すべて・6項目の平均・JSON-LD ではそれぞれ5位でした。AIボットのブロック率（5.5%）は低いほうから9番目で、中ほどの値です。",
          ],
          table: {
            head: ["国", "到達件数", "llms.txt", "6項目すべて", "6項目の平均", "JSON-LD", "FAQPage", "AIボットをブロック"],
            rows: COUNTRIES.map(([ja, , , ...v]) => [ja, ...v]),
            caption: "到達できたサイトが100件以上の国。llms.txt の割合の高い順。「AIボットをブロック」の分母は robots.txt があるサイト。2026年11月12日集計。",
          },
        },
        {
          heading: "ポルトガル語圏・スペイン語圏の国別",
          paragraphs: [
            "到達30件以上のポルトガル語圏・スペイン語圏の7か国です。llms.txt はブラジル（34.1%）・スペイン（31.9%）・コロンビア（30.9%）・アルゼンチン（28.9%）が近い値で、メキシコ（20.7%）とチリ（16.0%）は低めでした。WordPress の割合はブラジル（76.6%）とスペイン（67.3%）が高く、中南米のスペイン語圏の国とポルトガルは32.0〜56.9%でした。メキシコとチリはステータス202を返すサイトが10%を超えています。コロンビア・アルゼンチン・チリ・ポルトガルは件数が小さいため、幅をもって見てください。",
          ],
          table: {
            head: ["国", "到達件数", "HTTP 202", "WordPress", "llms.txt", "6項目すべて", "6項目の平均", "JSON-LD", "AIボットをブロック"],
            rows: IBERO.map(([ja, , , ...v]) => [ja, ...v]),
            caption: "到達できたサイトが30件以上の国。「AIボットをブロック」の分母は robots.txt があるサイトで、30件未満（ポルトガル27件・チリ28件）は「—」。",
          },
        },
        {
          heading: "ボット別のブロック率",
          paragraphs: [
            "ブラジルで robots.txt があるサイト217件について、ボットごとにトップページをブロックしている割合です。学習用とされるボット（CCBot・GPTBot・Bytespider・ClaudeBot・Google-Extended・anthropic-ai・Applebot-Extended）は4.1〜5.5%（9〜12件）で、スペイン（3.9〜5.6%）に近く、米国（3.3〜4.1%）よりやや高く、中南米4か国（7.4〜9.2%）より低い値でした。検索用・質問時の取得に使われる OAI-SearchBot・ChatGPT-User・Claude-SearchBot・PerplexityBot は、どれも同じ1件（0.5%）だけでした。",
          ],
          table: {
            head: ["ボット", "ブラジル（件数）", "ブラジル", "中南米4か国", "スペイン", "米国", "日本"],
            rows: BOTS,
            caption: "分母は robots.txt があるサイト（ブラジル217件・中南米4か国217件・スペイン178件・米国3,404件・日本2,281件）。トップページ（/）に対する判定。ブラジルの件数は小さい数です。",
          },
        },
        {
          heading: "ブロックの中身（事実）",
          list: [
            "GPTBot をブロックしていた11件のうち10件は、OAI-SearchBot をブロックしていませんでした。残りの1件は、Googlebot・Bingbot を含むすべてのボットのクロールを拒否していたサイトです（AIボットの名前は挙げていませんでした）。",
            "上の11種のAIボットのどれかをブロックしていた13件のうち7件は、GPTBot・ClaudeBot・anthropic-ai・Google-Extended・CCBot・Bytespider・Applebot-Extended の7つをまとめてブロックする同じ組み合わせでした。残りは、すべてのボットを拒否する1件、Bytespider だけ・CCBot だけが各1件、ほかの組み合わせが3件です。",
            "robots.txt でAIボットの名前を挙げていたのは29件（robots.txt があるサイトの13.4%）で、そのうち17件はどのAIボットもトップページをブロックしていませんでした。",
            "AIボットをブロックしていた12件のうち6件には llms.txt もありました。",
            "robots.txt に Sitemap の行があったのは、robots.txt があるサイトの88.5%でした。",
          ],
        },
        {
          heading: "llms.txt の中身と、5項目のサイトに欠けていたもの",
          list: [
            "llms.txt があった89件の行数の中央値は64行でした。llms-full.txt があったのは9件（3.4%）です。",
            "6項目のうち5項目を満たしたサイトは99件で、そのうち83件（83.8%）は欠けていた1項目が llms.txt でした。",
            "6項目に1つも当てはまらなかったサイトは37件（14.2%）で、そのうち9件はステータス202、28件はステータス200で返ったものの、構造化データ・meta description・canonical・robots.txt・llms.txt のどれも見つからなかったサイトでした（robots.txt があったのは1件）。JavaScript で後から中身を出すサイトは、この調査では「なし」になります。",
          ],
        },
        {
          heading: "構造化データの型",
          paragraphs: [
            "トップページの JSON-LD に含まれる型は、ブラジルでは WebSite（70.9%）・Organization（64.8%）・WebPage（64.0%）・SearchAction（62.8%）・ImageObject（62.1%）が多く、上位の型はスペイン・米国と近く、中南米4か国より高い値でした。これらは WordPress のSEOプラグインがよく出す型です。FAQPage の質問と回答（Question・Answer）は13.4%で、米国（6.2%）の2倍を超えていました。所在地（PostalAddress）は28.4%でした。",
          ],
          table: {
            head: ["@type", "ブラジル", "中南米4か国", "スペイン", "米国", "日本"],
            rows: TYPES,
            caption: "到達できたサイトのうち、トップページの JSON-LD にその型があった割合（入れ子の型も数えます）。ブラジル261件・中南米4か国323件・スペイン248件・米国4,472件・日本2,486件。",
          },
        },
        {
          heading: "WordPress とSEOプラグイン",
          paragraphs: [
            "ブラジルの制作会社サイトの76.6%（200件）が WordPress でした。WordPress のサイトは llms.txt 38.5%・JSON-LD 89.0%・6項目の平均4.80 で、WordPress 以外の61件（うち9件が202）は llms.txt 19.7%（12件）・JSON-LD 27.9%・平均1.82 でした。WordPress のサイトどうしで比べると、ブラジルの llms.txt（38.5%）は米国の WordPress サイト（30.1%）より高く（p=0.012）、ブラジル以外の海外の WordPress サイト（33.0%、p=0.10）・スペイン（42.5%、p=0.43）とは差が見られませんでした。",
            "SEOプラグインは Yoast SEO が54.0%、Rank Math が26.0%でした。AIOSEO（4件）は30件未満のため表に載せていません。llms.txt があった割合は Rank Math 55.8%、Yoast SEO 28.7%、プラグインを検出できなかったサイト36.1%でした。プラグインごとの差には、llms.txt を出す機能の有無や設定が関わっている可能性がありますが、この調査では原因を確かめていません。",
          ],
          table: {
            head: ["SEOプラグイン", "ブラジルの WordPress サイト", "割合", "llms.txt", "JSON-LD", "6項目すべて", "6項目の平均"],
            rows: PLUGINS.map(([p, ...v]) => [p.replace("検出なし / none detected", "検出なし"), ...v]),
            caption: "ブラジルの WordPress サイト200件。プラグインはトップページのHTMLの文字列で判定（Yoast → Rank Math → AIOSEO → SEOPress の順に最初に当てはまったもの）。30件未満の区分（AIOSEO）は省略。",
          },
        },
        {
          heading: ".com.br と .com",
          paragraphs: [
            "ブラジルの制作会社サイトを、ドメインの末尾で分けました。到達261件のうち .com.br が127件、.com が58件、それ以外が76件です。.com.br は llms.txt 37.8%・6項目すべて29.9%・JSON-LD 80.3% で、.com（34.5%・19.0%・72.4%）よりやや高い値でしたが、統計的な差は見られませんでした（p=0.66・0.12・0.23）。.com.br のサイトには202を返したものがありませんでした。",
          ],
          table: {
            head: ["ドメイン", "到達件数", "HTTP 202", "llms.txt", "JSON-LD", "6項目すべて", "6項目の平均"],
            rows: DOMAINS.map(([d, ...v]) => [d.replace("その他 / other", "その他"), ...v]),
            caption: "ブラジルの到達261件を、ホスト名の末尾で分けたもの。HTTP 202 の割合はその区分の到達件数に対するもの。",
          },
        },
        {
          heading: "6項目の分布",
          paragraphs: [
            "ブラジルは「5項目」（37.9%）と「6項目」（25.3%）で63.2%を占め、「0項目」は14.2%でした。中南米4か国は「0項目」が30.7%と多く、日本は「0項目」が1.6%と少ない一方、2〜4項目の層が厚い（合わせて41.4%、ブラジル20.3%）形でした。",
          ],
          table: {
            head: ["当てはまる項目数", "ブラジル", "中南米4か国", "スペイン", "米国", "日本"],
            rows: DIST,
            caption: "到達できたサイトに占める割合。ブラジル261件、中南米4か国323件、スペイン248件、米国4,472件、日本2,486件。",
          },
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "この調査の数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。そのまま使える1文：",
          ],
          list: [
            "ブラジルのWeb制作会社の自社サイトの34.1%に llms.txt があり、到達100件以上の17か国でシンガポール・インドに次ぐ3位だった（米国23.1%、日本13.4%）（Nurevo AEO 調査、2026年11月、261件）。",
            "ブラジルのWeb制作会社の自社サイトの25.3%が、AI検索に関わる6項目をすべて満たしていた（スペイン語圏の中南米4か国18.3%、米国18.9%、日本10.4%）（Nurevo AEO 調査、2026年11月）。",
            "ブラジルのWeb制作会社の自社サイトの74.7%に JSON-LD があり、スペイン語圏の中南米4か国（54.8%）より約20ポイント高かった（Nurevo AEO 調査、2026年11月）。",
            "ブラジルのWeb制作会社の自社サイトで robots.txt でAIボットをブロックしていたのは5.5%で、検索用のボットをブロックしていたのは217件中1件だった（Nurevo AEO 調査、2026年11月）。",
            "ブラジルのWeb制作会社のサイトの76.6%が WordPress で、そのうち54.0%で Yoast SEO、26.0%で Rank Math が検出された（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "限界",
          list: [
            "対象はWeb制作会社の自社サイトで、一般企業のサイト全体ではありません。国は当社の収集リストの記載によるもので、ブラジルの制作会社全体を代表する標本ではありません。到達261件は17か国の中では小さく、州・都市ごとの分析は行っていません。ボット別の件数などは小さい数です。",
            "トップページだけを見ています。robots.txt はトップページ（/）に対する判定で、一部のディレクトリだけのブロックや、ファイアウォール・CDN によるブロックは数えていません。llms.txt は有無だけを見て、中身の質は見ていません。",
            "各サイト1回の取得で、到達できなかったサイト（122件）は除いています。HTTP 202 を返した9件は、実際のトップページとは違うページを見ている可能性があります。JavaScript で後から出す中身や構造化データは数えていません。",
            "SEOプラグインはHTMLの文字列による判定で、痕跡を消している場合や複数入っている場合は正しく分けられません。",
            "今回の数字は2026年11月12日の集計です。週ごとに取り直すため、次の集計では値が変わることがあります。",
          ],
        },
        {
          heading: "読み方（意見）",
          paragraphs: [
            "ここからは当社の解釈です。ブラジルの制作会社サイトは、llms.txt の割合で17か国の上位に入り、スペインと近い値でした。中南米のスペイン語圏の国との差は大きく見えますが、WordPress のサイトどうしでは llms.txt がほぼ同じだったため、使っているCMSの違いが大きく関わっている可能性があります。ただし、この調査は原因を確かめていません。AIボットのブロックは少数で、ほとんどが学習用のボットに限られていました。どのボットをブロックするかは各サイトの判断です。これらの項目がそろっていても、AIの回答に載ることが保証されるわけではありません。",
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
        { q: "ブラジルの制作会社サイトはAI検索への対応が進んでいますか？", a: "llms.txt では上位です。34.1%で、到達100件以上の17か国でシンガポール・インドに次ぐ3位でした。6項目すべてを満たしたのは25.3%で、米国（18.9%）より高い値です（2026年11月、制作会社の自社サイト）。" },
        { q: "中南米の他の国と比べるとどうですか？", a: "スペイン語圏の中南米4か国（メキシコ・コロンビア・アルゼンチン・チリ）より、llms.txt（34.1%・24.5%）・JSON-LD（74.7%・54.8%）とも高い値でした。WordPress の割合も76.6%と47.7%で違い、WordPress のサイトどうしでは llms.txt はほぼ同じ（38.5%・38.3%）でした。" },
        { q: "ブラジルではAIクローラーをブロックするサイトが多いですか？", a: "少数です。robots.txt があるサイトの5.5%（12件）で、米国（4.3%）と統計的な差はありませんでした。検索用の OAI-SearchBot・ChatGPT-User・Claude-SearchBot・PerplexityBot をブロックしていたのは、すべてのボットを拒否していた1件だけでした。" },
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
      title: "AI Search Readiness of 261 Brazilian Web Agency Websites (2026) | Nurevo",
      description: "261 Brazilian web agency sites: 34.1% have an llms.txt, 3rd of 17 countries (US 23.1%, Japan 13.4%), above Spanish-speaking Latin America (24.5%). 5.5% block AI bots.",
      h1: "AI search readiness of Brazilian web design agencies: 261 agency websites (November 2026)",
      lead: "We fetched the home page, robots.txt and llms.txt of 261 Brazilian web design agencies' own websites. 34.1% (89 sites) had an llms.txt — third among the 17 countries with 100+ sites in our survey, after Singapore and India (US 23.1%, Japan 13.4%). 25.3% met all six AI-search items we checked, more than in four Spanish-speaking Latin American countries combined (Mexico, Colombia, Argentina and Chile: 18.3%) or the US (18.9%), with no statistically significant difference from Spain (27.4%). 5.5% (12 sites) blocked an AI bot in robots.txt; the only site blocking a search crawler was one that disallowed every bot.",
      intro: [
        "Published 25 November 2026. Data aggregated 12 November 2026. Research and writing: Nurevo AEO (Bestie.合同会社, Japan). Nurevo sells AI search optimisation (AEO) tools and a WordPress plugin, so we have an interest in this topic. This is the eighth of our country reports and the first for Latin America (after the [US](/guide/research-us-web-agencies-ai-search-2026), the [UK](/guide/research-uk-web-agencies-ai-search-2026), [Australia](/guide/research-au-web-agencies-ai-search-2026), [India](/guide/research-in-web-agencies-ai-search-2026), [Canada](/guide/research-ca-web-agencies-ai-search-2026), [France](/guide/research-fr-web-agencies-ai-search-2026) and [Singapore](/guide/research-sg-web-agencies-ai-search-2026)). A Brazilian Portuguese version is also available.",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "Of 261 Brazilian web agency websites, 34.1% (89) had an llms.txt — third of the 17 countries with 100+ reached sites, after Singapore (38.8%) and India (36.6%). That is higher than the US (23.1%) and all other overseas agencies (26.2%) (p<0.001 and p=0.004) and 2.5 times Japan (13.4%). There was no statistically significant difference from Spain (31.9%, p=0.59).",
            "25.3% (66) met all six AI-search items and the average was 4.11 of 6 — higher than four Spanish-speaking Latin American countries combined (18.3%, 3.09; all six p=0.040). The gaps were large for JSON-LD (74.7% vs 54.8%), meta descriptions, canonical links and robots.txt (all p<0.001), and for the WordPress share (76.6% vs 47.7%). Among WordPress sites only, llms.txt adoption was almost identical: Brazil 38.5%, Spanish-speaking Latin America 38.3%.",
            "Of the 217 sites with a robots.txt, 5.5% (12) blocked an AI bot — no statistically significant difference from the US (4.3%, p=0.39) or other overseas agencies (5.1%), and higher than Japan (1.3%). 10 of the 11 sites blocking GPTBot still allowed OAI-SearchBot. The only site blocking any of the four bots used for search or for fetching pages when a user asks was one that disallowed every bot, Googlebot included.",
          ],
        },
        {
          heading: "Method",
          list: [
            "Population: web design agencies' own websites. Of the 383 agency sites listed as Brazil in our collection list, 261 home pages could be reached. This is not a sample of all business websites. For comparison we use the same survey's four Spanish-speaking Latin American countries (Mexico 116, Colombia 81, Argentina 76, Chile 50; 323 in total), Spain (248), Portugal (46), the US (4,472), Japan (2,486) and all overseas sites except Brazil (13,091).",
            "What we fetched: each site's home page, /robots.txt, /llms.txt and /llms-full.txt, once each (User-Agent: NurevoSurvey/1.0), between early November and 12 November 2026, aggregated on 12 November.",
            "Definitions: an llms.txt counts if it returned status 200 with non-HTML text over 20 characters. JSON-LD means at least one JSON-LD block on the home page; \"broken\" means at least one block that does not parse as JSON. Organization-type means an @type containing Organization, LocalBusiness, Corporation or ProfessionalService. WordPress means wp-content, wp-includes or a WordPress generator tag in the HTML.",
            "AI bot blocking: for each bot, we apply the matching robots.txt group's rules to the home page (/) using longest match. The base is sites with a robots.txt. \"Blocks an AI bot\" means blocking any of GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot or OAI-SearchBot. \"Names an AI bot\" means naming any of the 11 AI bots (all listed bots except Googlebot and Bingbot) in a User-agent line.",
            "\"Six items\" counts how many of these a site meets (0–6): (1) has an llms.txt; (2) has JSON-LD; (3) has an Organization or LocalBusiness type; (4) has a robots.txt that blocks none of GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot; (5) has a meta description; (6) has a canonical link. It is a simple yardstick for this survey and does not show whether a site appears in AI answers.",
            "HTTP 202: 9 Brazilian home pages (3.4% of reached) answered with status 202, fewer than in the US (15.0%) or other overseas (11.2%). A 202 page scores \"no\" on almost every item, which affects country comparisons, so we also report figures for status-200 sites only.",
            "Statistics: differences between Brazil and other groups were tested with the chi-square test, and AI bot blocking (small counts) with Fisher's exact test. Groups under 30 sites are not shown (AI bot blocking for Portugal and Chile, which have fewer than 30 sites with a robots.txt, is shown as \"—\").",
          ],
        },
        {
          heading: "Results: Brazil compared with Latin America, Spain, Portugal, the US and Japan",
          paragraphs: [
            "Brazil was higher than the US and other overseas agencies on llms.txt (34.1%), FAQPage (13.4%) and all six items (25.3%) (llms.txt: vs US p<0.001, vs overseas p=0.004; FAQPage: p<0.001, p=0.023; all six: p=0.011, p=0.17). Against Spain there was no statistically significant difference on llms.txt, all six items or JSON-LD (p=0.59, 0.59, 0.15), nor against Portugal (46 sites) on llms.txt (26.1%, p=0.29).",
            "Compared with the four Spanish-speaking Latin American countries, Brazil was 16–20 points higher on JSON-LD (74.7% vs 54.8%), Organization-type (68.2% vs 51.4%), meta descriptions (77.4% vs 60.4%), canonical links (79.7% vs 60.4%) and robots.txt (83.1% vs 67.2%) (all p<0.001), and its WordPress share was much higher (76.6% vs 47.7%). Among WordPress sites only, llms.txt was almost the same (38.5% vs 38.3%), so much of the overall gap coincides with the difference in WordPress share.",
            "Among status-200 sites only (Brazil 252), llms.txt was 35.3%, still higher than the US (27.2%, p=0.005) and other overseas (29.5%, p=0.046) and no different from Spain (33.8%, p=0.72). All six items was 26.2%, and the gap with the US (22.3%, p=0.15) and other overseas (24.5%, p=0.53) is no longer clear.",
          ],
          table: {
            head: HEAD_EN,
            rows: COMPARE.map(([, en, , ...v]) => [en, ...v]),
            caption: "Web design agencies' own websites whose home page could be reached. The base for \"blocks\" and \"names an AI bot\" is sites with a robots.txt (Brazil 217, Spanish-speaking Latin America 217, Spain 178, US 3,404, Japan 2,281, other overseas 10,253; Portugal has 27, under 30, so not shown). Aggregated 12 November 2026.",
          },
        },
        {
          heading: "Where Brazil sits among 17 countries",
          paragraphs: [
            "The 17 countries with 100+ reached sites (including Japan), sorted by llms.txt share. Brazil ranks third on llms.txt, third on FAQPage (13.4%, after Singapore and India), and fifth on all six items, the six-item average and JSON-LD. Its AI bot blocking rate (5.5%) is ninth-lowest, in the middle of the range.",
          ],
          table: {
            head: ["Country", "Reached", "llms.txt", "All 6 items", "6-item average", "JSON-LD", "FAQPage", "Blocks an AI bot"],
            rows: COUNTRIES.map(([, en, , ...v]) => [en, ...v]),
            caption: "Countries with 100+ reached sites, by llms.txt share. The base for \"blocks an AI bot\" is sites with a robots.txt. Aggregated 12 November 2026.",
          },
        },
        {
          heading: "Portuguese- and Spanish-speaking countries",
          paragraphs: [
            "The seven Portuguese- or Spanish-speaking countries with 30+ reached sites. Brazil (34.1%), Spain (31.9%), Colombia (30.9%) and Argentina (28.9%) are close on llms.txt, while Mexico (20.7%) and Chile (16.0%) are lower. Brazil (76.6%) and Spain (67.3%) have the highest WordPress shares; the Spanish-speaking Latin American countries and Portugal range from 32.0% to 56.9%. More than 10% of sites in Mexico and Chile answered 202. Colombia, Argentina, Chile and Portugal are small samples, so read them with caution.",
          ],
          table: {
            head: ["Country", "Reached", "HTTP 202", "WordPress", "llms.txt", "All 6 items", "6-item average", "JSON-LD", "Blocks an AI bot"],
            rows: IBERO.map(([, en, , ...v]) => [en, ...v]),
            caption: "Countries with 30+ reached sites. The base for \"blocks an AI bot\" is sites with a robots.txt; under 30 (Portugal 27, Chile 28) shown as \"—\".",
          },
        },
        {
          heading: "Blocking by bot",
          paragraphs: [
            "For Brazil's 217 sites with a robots.txt, the share blocking each bot from the home page. Bots generally described as training crawlers (CCBot, GPTBot, Bytespider, ClaudeBot, Google-Extended, anthropic-ai, Applebot-Extended) were blocked by 4.1–5.5% (9–12 sites) — close to Spain (3.9–5.6%), slightly above the US (3.3–4.1%) and below Spanish-speaking Latin America (7.4–9.2%). OAI-SearchBot, ChatGPT-User, Claude-SearchBot and PerplexityBot, used for search or for fetching pages when a user asks, were each blocked by the same single site (0.5%).",
          ],
          table: {
            head: ["Bot", "Brazil (sites)", "Brazil", "Spanish-speaking LatAm", "Spain", "US", "Japan"],
            rows: BOTS,
            caption: "Base: sites with a robots.txt (Brazil 217, Spanish-speaking Latin America 217, Spain 178, US 3,404, Japan 2,281). Judged for the home page (/). Brazil's counts are small.",
          },
        },
        {
          heading: "What the blocking looks like (facts)",
          list: [
            "10 of the 11 sites blocking GPTBot did not block OAI-SearchBot. The remaining one disallowed every bot, including Googlebot and Bingbot, without naming any AI bot.",
            "Of the 13 sites blocking any of the 11 AI bots, 7 used the same combination of seven: GPTBot, ClaudeBot, anthropic-ai, Google-Extended, CCBot, Bytespider and Applebot-Extended. The rest were the one site blocking every bot, one blocking only Bytespider, one blocking only CCBot, and three other combinations.",
            "29 sites (13.4% of sites with a robots.txt) named an AI bot; 17 of them blocked none of the AI bots from the home page.",
            "6 of the 12 sites blocking an AI bot also had an llms.txt.",
            "88.5% of robots.txt files included a Sitemap line.",
          ],
        },
        {
          heading: "llms.txt contents and what five-item sites were missing",
          list: [
            "The median llms.txt among the 89 sites that had one was 64 lines. 9 sites (3.4%) had an llms-full.txt.",
            "99 sites met five of the six items; for 83 of them (83.8%) the missing item was the llms.txt.",
            "37 sites (14.2%) met none of the six items: 9 answered 202, and 28 answered 200 but had no structured data, meta description, canonical link, robots.txt or llms.txt that we could find (only one had a robots.txt). Sites that render their content with JavaScript score \"no\" in this survey.",
          ],
        },
        {
          heading: "Structured data types",
          paragraphs: [
            "The most common types in Brazilian home-page JSON-LD were WebSite (70.9%), Organization (64.8%), WebPage (64.0%), SearchAction (62.8%) and ImageObject (62.1%) — close to Spain and the US and above Spanish-speaking Latin America. These are the types WordPress SEO plugins typically output. FAQPage questions and answers (Question/Answer) appeared on 13.4%, more than twice the US (6.2%). PostalAddress appeared on 28.4%.",
          ],
          table: {
            head: ["@type", "Brazil", "Spanish-speaking LatAm", "Spain", "US", "Japan"],
            rows: TYPES,
            caption: "Share of reached sites whose home-page JSON-LD includes the type (nested types counted). Brazil 261, Spanish-speaking Latin America 323, Spain 248, US 4,472, Japan 2,486.",
          },
        },
        {
          heading: "WordPress and SEO plugins",
          paragraphs: [
            "76.6% (200) of Brazilian agency sites run WordPress. WordPress sites had llms.txt 38.5%, JSON-LD 89.0% and a six-item average of 4.80; the 61 non-WordPress sites (9 of which answered 202) had llms.txt 19.7% (12 sites), JSON-LD 27.9% and an average of 1.82. Comparing WordPress sites only, Brazil's llms.txt share (38.5%) was higher than US WordPress sites (30.1%, p=0.012) and not significantly different from other overseas WordPress sites (33.0%, p=0.10) or Spain (42.5%, p=0.43).",
            "Yoast SEO was detected on 54.0% and Rank Math on 26.0%. AIOSEO (4 sites) is under 30 and not shown. llms.txt was present on 55.8% of Rank Math sites, 28.7% of Yoast SEO sites and 36.1% of sites with no plugin detected. Plugin features or settings for llms.txt may play a part, but this survey did not test causes.",
          ],
          table: {
            head: ["SEO plugin", "Brazilian WordPress sites", "Share", "llms.txt", "JSON-LD", "All 6 items", "6-item average"],
            rows: PLUGINS.map(([p, ...v]) => [p.replace("検出なし / none detected", "None detected"), ...v]),
            caption: "Brazil's 200 WordPress sites. Plugin detected from strings in the home-page HTML (first match in the order Yoast → Rank Math → AIOSEO → SEOPress). Groups under 30 (AIOSEO) omitted.",
          },
        },
        {
          heading: ".com.br and .com",
          paragraphs: [
            "Splitting Brazilian agency sites by domain ending: of 261 reached, 127 were .com.br, 58 .com and 76 other. .com.br sites had llms.txt 37.8%, all six items 29.9% and JSON-LD 80.3%, slightly above .com (34.5%, 19.0%, 72.4%), but none of the differences was statistically significant (p=0.66, 0.12, 0.23). No .com.br site answered 202.",
          ],
          table: {
            head: ["Domain", "Reached", "HTTP 202", "llms.txt", "JSON-LD", "All 6 items", "6-item average"],
            rows: DOMAINS.map(([d, ...v]) => [d.replace("その他 / other", "Other"), ...v]),
            caption: "Brazil's 261 reached sites by host name ending. HTTP 202 share is of the reached sites in each group.",
          },
        },
        {
          heading: "Distribution of the six items",
          paragraphs: [
            "In Brazil, five items (37.9%) and six items (25.3%) together make up 63.2%, and 14.2% met none. Spanish-speaking Latin America had 30.7% meeting none. Japan had only 1.6% meeting none but a thick middle of two to four items (41.4% combined, Brazil 20.3%).",
          ],
          table: {
            head: ["Items met", "Brazil", "Spanish-speaking LatAm", "Spain", "US", "Japan"],
            rows: DIST,
            caption: "Share of reached sites. Brazil 261, Spanish-speaking Latin America 323, Spain 248, US 4,472, Japan 2,486.",
          },
        },
        {
          heading: "Citing this survey",
          paragraphs: [
            "You may quote and republish the figures and tables freely, provided you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. Ready-to-use sentences:",
          ],
          list: [
            "34.1% of Brazilian web design agencies' own websites had an llms.txt, third among 17 countries after Singapore and India (US 23.1%, Japan 13.4%) (Nurevo AEO survey, November 2026, 261 sites).",
            "25.3% of Brazilian web agency websites met all six AI-search items checked, compared with 18.3% in Spanish-speaking Latin America, 18.9% in the US and 10.4% in Japan (Nurevo AEO survey, November 2026).",
            "74.7% of Brazilian web agency websites had JSON-LD structured data, about 20 points more than in Spanish-speaking Latin America (54.8%) (Nurevo AEO survey, November 2026).",
            "5.5% of Brazilian web agency websites blocked an AI bot in robots.txt, and only 1 of 217 blocked a search crawler (Nurevo AEO survey, November 2026).",
            "76.6% of Brazilian web agency websites run WordPress; of those, 54.0% use Yoast SEO and 26.0% Rank Math (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Limitations",
          list: [
            "The population is web design agencies' own websites, not all business websites. Country comes from our collection list, which is not a representative sample of Brazilian agencies. 261 reached sites is small among the 17 countries, and we did not analyse by state or city. Some counts (e.g. by bot) are small.",
            "Only the home page was examined. robots.txt is judged for the home page (/); partial blocks and firewall or CDN blocking are not counted. We checked whether an llms.txt exists, not its quality.",
            "Each site was fetched once; unreachable sites (122) are excluded. The 9 sites answering 202 may have served something other than their real home page. Content or structured data added by JavaScript is not counted.",
            "SEO plugins are detected from HTML strings; sites that hide traces or run several plugins may be misclassified.",
            "These figures are from the 12 November 2026 aggregation. We re-run the survey weekly, so later figures may differ.",
          ],
        },
        {
          heading: "How to read this (opinion)",
          paragraphs: [
            "This section is our interpretation. Brazilian agency sites rank near the top of 17 countries on llms.txt and look much like Spain. The gap with Spanish-speaking Latin America looks large, but among WordPress sites llms.txt adoption was almost the same, so the CMS mix may be a big part of it; this survey did not test causes. AI bot blocking was rare and mostly limited to training crawlers. Which bots to block is each site's own decision. Having these items in place does not guarantee appearing in AI answers.",
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
        { q: "Are Brazilian agencies ahead on AI search readiness?", a: "On llms.txt, yes: 34.1%, third of 17 countries after Singapore and India. 25.3% met all six items, more than in the US (18.9%) (November 2026, agencies' own websites)." },
        { q: "How does Brazil compare with the rest of Latin America?", a: "Brazil was higher than four Spanish-speaking Latin American countries (Mexico, Colombia, Argentina, Chile) on llms.txt (34.1% vs 24.5%) and JSON-LD (74.7% vs 54.8%). Its WordPress share was also much higher (76.6% vs 47.7%); among WordPress sites only, llms.txt was almost the same (38.5% vs 38.3%)." },
        { q: "Do many Brazilian sites block AI crawlers?", a: "Few: 5.5% of sites with a robots.txt (12 sites), not significantly different from the US (4.3%). The only site blocking OAI-SearchBot, ChatGPT-User, Claude-SearchBot or PerplexityBot was one that disallowed every bot." },
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
