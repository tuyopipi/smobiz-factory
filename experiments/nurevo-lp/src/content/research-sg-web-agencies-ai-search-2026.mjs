// Content page: research report (country report: Singapore). AI search
// readiness of Singapore web design agencies' own websites, compared with
// India, the Philippines, Australia, the US, Japan, other Asia-Pacific
// countries and all other overseas agencies. November 2026.
//
// Every number here comes from nurevo-outreach data/survey/raw_2026-11-12.json
// (survey.js; the same run as summary_2026-11-12.json — the Singapore totals
// match summary.byCountry.SG: 641 reached, llms.txt 38.8%, JSON-LD 80.8%,
// WordPress 81.3%, AI bot blocked 5.7%, all 6 items 32.4%, 6-item average
// 4.4). Country = the "co" field of our collection list (SG; 974 listed, 333
// not reached). Do not add a figure that is not in that data. The raw file
// holds company names and domains: never publish them. Definitions follow
// survey.js (see the US report).
// HTTP 202: 47 Singapore home pages answered 202 (7.3% of reached), all of
// them counted as non-WordPress. HTTP-200-only: Singapore 594, llms.txt 41.9%,
// all 6 35.0%, average 4.70; India 200: 37.2% (p=0.043) / 30.3% (p=0.036);
// US 200: 27.2% / 22.3% (p<0.001).
// "Other overseas" = all non-Japan sites except Singapore (12,711 reached;
// 9,924 with robots.txt).
// Chi-square (no continuity correction), Singapore vs India: llms.txt p=0.33,
// all 6 p=0.23, JSON-LD p=0.042, FAQPage p=0.79. vs Philippines: llms.txt
// p=0.045, all 6 p=0.12. vs Australia / US / UK / NZ / Japan / other
// overseas: llms.txt and all 6 p<0.001. vs Malaysia: llms.txt p=0.008; vs
// Hong Kong p=0.003.
// AI bot blocking (Fisher's exact test): vs India p=1.00, Philippines 0.50,
// Australia 0.41, US 0.18, UK 0.52, other overseas 0.55, Malaysia 0.009,
// Japan p<0.001.
// robots.txt naming an AI bot: 120/546 (22.0%), vs other overseas 11.2%,
// US 8.8%, India 15.0%, Japan 2.5% (all p<0.001). Naming without blocking any
// of 11 AI bots: 86 (15.8%; other overseas 579/9,924 = 5.8%, p<0.001); 62 of
// those 86 have llms.txt (72.1% vs 40.4% of sites naming no AI bot, p<0.001).
// Broken JSON-LD: 21/518 (4.1%) vs US 49/3,084 (p<0.001), other overseas
// 156/9,097 (p<0.001), India 38/1,311 (p=0.24).
// WordPress only: Singapore 521, llms.txt 46.3%, all 6 39.3%, average 5.15;
// other overseas WP 32.4% / 27.4% (p<0.001), India WP 39.5% (p=0.007) /
// 32.7% (p=0.006), US WP 30.1%.
// Domain split (.sg incl. .com.sg 50 / .com 413 / other 178): llms.txt 26.0%
// vs 39.7% (p=0.060), all 6 20.0% vs 33.4% (p=0.055), JSON-LD 64.0% vs 83.1%
// (p=0.001). .com.sg (25) and .sg (25) are not shown separately (<30).
// Groups under 30 sites are not shown (SEOPress 1 Singapore WordPress site).

// [ja label, en label, Singapore, India, Philippines, Australia, US, Japan, other overseas (excl. Singapore)]
const COMPARE = [
  ["到達件数", "Sites reached", "641", "1,554", "241", "1,719", "4,472", "2,486", "12,711"],
  ["HTTP 202 を返した割合", "Answered HTTP 202", "7.3%", "1.5%", "6.6%", "14.5%", "15.0%", "0.0%", "11.3%"],
  ["WordPress", "WordPress", "81.3%", "89.0%", "82.2%", "76.0%", "74.5%", "92.3%", "75.2%"],
  ["llms.txt", "llms.txt", "38.8%", "36.6%", "31.5%", "24.3%", "23.1%", "13.4%", "25.7%"],
  ["llms-full.txt", "llms-full.txt", "2.8%", "2.3%", "2.5%", "1.6%", "1.5%", "0.6%", "1.7%"],
  ["JSON-LD", "JSON-LD", "80.8%", "84.4%", "80.1%", "71.3%", "69.0%", "69.4%", "71.6%"],
  ["JSON-LD が壊れている（JSON-LD があるサイト中）", "Broken JSON-LD (of sites with JSON-LD)", "4.1%", "2.9%", "1.0%", "2.1%", "1.6%", "1.7%", "1.7%"],
  ["Organization系の型", "Organization-type", "73.3%", "76.3%", "73.9%", "62.2%", "59.4%", "58.9%", "63.1%"],
  ["FAQPage", "FAQPage", "15.0%", "14.5%", "12.0%", "10.3%", "6.2%", "3.9%", "9.1%"],
  ["microdata（schema.org）", "Microdata (schema.org)", "13.4%", "27.7%", "21.6%", "19.1%", "19.1%", "7.8%", "19.9%"],
  ["meta description", "Meta description", "81.6%", "82.9%", "79.7%", "70.2%", "68.0%", "90.7%", "70.9%"],
  ["Open Graph", "Open Graph", "80.3%", "83.4%", "80.5%", "72.4%", "69.1%", "81.3%", "72.0%"],
  ["canonical", "Canonical link", "82.2%", "89.0%", "83.8%", "75.9%", "74.3%", "84.6%", "76.1%"],
  ["robots.txt", "robots.txt", "85.2%", "90.5%", "86.7%", "77.7%", "76.1%", "91.8%", "78.1%"],
  ["AIボットをブロック（robots.txt があるサイト中）", "Blocks an AI bot (of sites with robots.txt)", "5.7%", "5.8%", "7.2%", "4.7%", "4.3%", "1.3%", "5.1%"],
  ["robots.txt でAIボットに言及", "robots.txt names an AI bot", "22.0%", "15.0%", "12.0%", "10.7%", "8.8%", "2.5%", "11.2%"],
  ["6項目の平均", "6-item average", "4.36", "4.53", "4.27", "3.77", "3.65", "4.05", "3.80"],
  ["5項目以上", "5+ items", "69.7%", "70.4%", "68.5%", "56.7%", "54.6%", "52.2%", "57.6%"],
  ["6項目すべて", "All 6 items", "32.4%", "29.9%", "27.0%", "20.8%", "18.9%", "10.4%", "21.3%"],
];

// [bot, Singapore blocked, Singapore %, India %, Australia %, US %, Japan %]  base = sites with robots.txt (Singapore 546 / India 1406 / Australia 1,336 / US 3,404 / Japan 2,281)
const BOTS = [
  ["Bytespider", "33", "6.0%", "5.6%", "4.2%", "4.1%", "1.1%"],
  ["CCBot", "30", "5.5%", "5.5%", "4.3%", "4.1%", "1.1%"],
  ["GPTBot", "28", "5.1%", "5.1%", "4.2%", "3.8%", "1.2%"],
  ["ClaudeBot", "28", "5.1%", "4.6%", "3.8%", "3.5%", "1.0%"],
  ["Applebot-Extended", "27", "4.9%", "4.2%", "3.6%", "3.3%", "1.0%"],
  ["anthropic-ai", "25", "4.6%", "4.2%", "3.4%", "3.4%", "1.0%"],
  ["Google-Extended", "25", "4.6%", "4.7%", "3.8%", "3.6%", "1.1%"],
  ["OAI-SearchBot", "1", "0.2%", "0.1%", "0.1%", "0.3%", "0.0%"],
  ["Claude-SearchBot", "1", "0.2%", "0.1%", "0.1%", "0.3%", "0.0%"],
  ["PerplexityBot", "1", "0.2%", "0.4%", "0.1%", "0.3%", "0.1%"],
  ["ChatGPT-User", "0", "0.0%", "0.3%", "0.3%", "0.4%", "0.1%"],
  ["Googlebot", "0", "0.0%", "0.1%", "0.1%", "0.1%", "0.0%"],
  ["Bingbot", "0", "0.0%", "0.1%", "0.0%", "0.1%", "0.0%"],
];

// [type, Singapore, India, Australia, US, Japan]  share of reachable sites whose home page JSON-LD contains the @type
const TYPES = [
  ["WebSite", "71.5%", "76.9%", "68.4%", "65.7%", "63.0%"],
  ["Organization", "69.3%", "72.7%", "58.8%", "55.4%", "54.4%"],
  ["WebPage", "61.6%", "68.6%", "61.9%", "59.3%", "34.4%"],
  ["ImageObject", "60.2%", "68.1%", "57.4%", "54.5%", "38.3%"],
  ["SearchAction", "59.3%", "66.7%", "59.7%", "56.8%", "28.9%"],
  ["BreadcrumbList", "41.7%", "42.9%", "43.5%", "44.5%", "43.4%"],
  ["PostalAddress", "40.7%", "35.6%", "28.7%", "24.3%", "16.4%"],
  ["ContactPoint", "29.2%", "25.0%", "14.7%", "12.5%", "6.5%"],
  ["Person", "20.9%", "24.7%", "16.9%", "15.6%", "10.2%"],
  ["FAQPage", "15.0%", "14.5%", "10.3%", "6.2%", "3.9%"],
  ["GeoCoordinates", "14.7%", "16.0%", "14.4%", "12.1%", "3.7%"],
  ["LocalBusiness", "13.9%", "15.2%", "14.2%", "12.2%", "5.4%"],
  ["AggregateRating", "12.2%", "10.9%", "6.9%", "4.6%", "0.2%"],
  ["Service", "11.4%", "11.1%", "7.6%", "6.6%", "3.5%"],
  ["ProfessionalService", "11.2%", "12.7%", "13.6%", "10.1%", "5.6%"],
  ["Offer", "10.5%", "8.9%", "6.7%", "5.9%", "3.1%"],
  ["Review", "4.7%", "3.9%", "1.9%", "1.8%", "0.1%"],
];

// [score, Singapore, India, Australia, US, Japan]
const DIST = [
  ["0", "13.9%", "7.5%", "20.7%", "22.1%", "1.6%"],
  ["1", "1.4%", "1.5%", "2.5%", "2.5%", "4.8%"],
  ["2", "2.3%", "4.6%", "3.8%", "4.3%", "10.7%"],
  ["3", "2.0%", "3.5%", "3.0%", "3.6%", "15.4%"],
  ["4", "10.6%", "12.6%", "13.4%", "12.8%", "15.3%"],
  ["5", "37.3%", "40.5%", "35.9%", "35.7%", "41.8%"],
  ["6", "32.4%", "29.9%", "20.8%", "18.9%", "10.4%"],
];

// [ja name, en name, reached, llms.txt, all 6, 6-item average, JSON-LD, AI bot blocked]  17 countries with 100+ reached sites, by llms.txt (same data as the France report)
const COUNTRIES = [
  ["シンガポール", "Singapore", "641", "38.8%", "32.4%", "4.36", "80.8%", "5.7%"],
  ["インド", "India", "1,554", "36.6%", "29.9%", "4.53", "84.4%", "5.8%"],
  ["ブラジル", "Brazil", "261", "34.1%", "25.3%", "4.11", "74.7%", "5.5%"],
  ["スペイン", "Spain", "248", "31.9%", "27.4%", "3.67", "69.0%", "5.6%"],
  ["フィリピン", "Philippines", "241", "31.5%", "27.0%", "4.27", "80.1%", "7.2%"],
  ["南アフリカ", "South Africa", "389", "29.3%", "24.4%", "3.90", "74.6%", "7.5%"],
  ["フランス", "France", "405", "26.4%", "24.0%", "4.71", "90.1%", "1.9%"],
  ["ニュージーランド", "New Zealand", "417", "25.4%", "20.9%", "3.80", "70.3%", "5.8%"],
  ["オーストラリア", "Australia", "1,719", "24.3%", "20.8%", "3.77", "71.3%", "4.7%"],
  ["オランダ", "Netherlands", "127", "23.6%", "18.9%", "3.66", "74.0%", "7.6%"],
  ["米国", "United States", "4,472", "23.1%", "18.9%", "3.65", "69.0%", "4.3%"],
  ["カナダ", "Canada", "908", "22.9%", "18.9%", "3.58", "68.1%", "3.5%"],
  ["英国", "United Kingdom", "942", "21.5%", "17.7%", "3.61", "68.8%", "4.7%"],
  ["メキシコ", "Mexico", "116", "20.7%", "18.1%", "3.06", "55.2%", "4.1%"],
  ["イタリア", "Italy", "110", "20.0%", "17.3%", "2.70", "49.1%", "9.5%"],
  ["アイルランド", "Ireland", "266", "19.5%", "17.3%", "3.28", "62.8%", "3.3%"],
  ["日本", "Japan", "2,486", "13.4%", "10.4%", "4.05", "69.4%", "1.3%"],
];

// [ja name, en name, reached, HTTP 202, WordPress, llms.txt, JSON-LD, all 6, 6-item average, AI bot blocked (blocked / with robots.txt)]  Asia-Pacific countries with 30+ reached sites
const APAC = [
  ["シンガポール", "Singapore", "641", "7.3%", "81.3%", "38.8%", "80.8%", "32.4%", "4.36", "5.7%（31/546）"],
  ["インド", "India", "1,554", "1.5%", "89.0%", "36.6%", "84.4%", "29.9%", "4.53", "5.8%（81/1,406）"],
  ["フィリピン", "Philippines", "241", "6.6%", "82.2%", "31.5%", "80.1%", "27.0%", "4.27", "7.2%（15/209）"],
  ["台湾", "Taiwan", "60", "1.7%", "45.0%", "30.0%", "70.0%", "20.0%", "3.83", "13.0%（7/54）"],
  ["ニュージーランド", "New Zealand", "417", "8.9%", "75.3%", "25.4%", "70.3%", "20.9%", "3.80", "5.8%（19/327）"],
  ["韓国", "South Korea", "36", "2.8%", "55.6%", "25.0%", "61.1%", "19.4%", "3.64", "15.6%（5/32）"],
  ["オーストラリア", "Australia", "1,719", "14.5%", "76.0%", "24.3%", "71.3%", "20.8%", "3.77", "4.7%（63/1,336）"],
  ["マレーシア", "Malaysia", "80", "2.5%", "45.0%", "23.8%", "51.3%", "18.8%", "2.79", "16.7%（8/48）"],
  ["香港", "Hong Kong", "79", "17.7%", "54.4%", "21.5%", "67.1%", "17.7%", "3.52", "9.8%（6/61）"],
  ["日本", "Japan", "2,486", "0.0%", "92.3%", "13.4%", "69.4%", "10.4%", "4.05", "1.3%（29/2,281）"],
];

// [plugin, Singapore WordPress sites (share), llms.txt count (share), JSON-LD, 6-item average]
const PLUGINS = [
  ["Yoast SEO", "262 (50.3%)", "123 (46.9%)", "99.2%", "5.21"],
  ["Rank Math", "120 (23.0%)", "56 (46.7%)", "99.2%", "5.35"],
  ["AIOSEO", "31 (6.0%)", "20 (64.5%)", "100.0%", "5.52"],
  ["検出なし / none detected", "107 (20.5%)", "41 (38.3%)", "81.3%", "4.65"],
];

// [domain, reached, HTTP 202, llms.txt, JSON-LD, all 6, 6-item average]  Singapore sites by the end of the host name
const DOMAINS = [
  [".sg（.com.sg を含む） / .sg (incl. .com.sg)", "50", "3 (6.0%)", "26.0%", "64.0%", "20.0%", "3.42"],
  [".com", "413", "25 (6.1%)", "39.7%", "83.1%", "33.4%", "4.45"],
  ["その他 / other", "178", "19 (10.7%)", "40.4%", "80.3%", "33.7%", "4.40"],
];

const HEAD_JA = ["項目", "シンガポール", "インド", "フィリピン", "オーストラリア", "米国", "日本", "シンガポール以外の海外"];
const HEAD_EN = ["Item", "Singapore", "India", "Philippines", "Australia", "US", "Japan", "Other overseas"];

export default {
  slug: "research-sg-web-agencies-ai-search-2026",
  targetQueries: [
    "シンガポール Web制作会社 AI検索 対応状況 調査",
    "シンガポール llms.txt 導入率",
    "Singapore web design agencies AI search readiness survey",
    "llms.txt adoption Singapore 2026",
    "Singapore agency websites robots.txt GPTBot blocking",
    "Asia Pacific web agencies llms.txt structured data study",
  ],
  related: ["research-in-web-agencies-ai-search-2026", "research-au-web-agencies-ai-search-2026", "research-us-web-agencies-ai-search-2026", "research-wordpress-vs-non-wordpress-2026", "research-japan-web-agencies-ai-search-2026", "llms-txt"],
  locales: {
    ja: {
      title: "シンガポールのWeb制作会社641社のAI検索対応を調査【2026年11月】 | Nurevo",
      description: "シンガポールのWeb制作会社の自社サイト641件を調査。llms.txt 38.8%と6項目すべて32.4%は17か国で最も高い値（日本13.4%・10.4%）。AIボットのブロックは5.7%でした。",
      h1: "シンガポールのWeb制作会社の自社サイト641件に見るAI検索への対応（2026年11月）",
      lead: "シンガポールのWeb制作会社の自社サイト641件のトップページ・robots.txt・llms.txt を調べたところ、llms.txt があったのは38.8%（249件）、AI検索に関わる6項目をすべて満たしたのは32.4%で、どちらも到達100件以上の17か国の中で最も高い値でした（日本は13.4%・10.4%）。robots.txt でAIボットに言及しているサイトも22.0%と17か国で最も多い一方、実際にAIボットをブロックしていたのは5.7%（31件）で、海外の他の国と統計的な差は見られませんでした。",
      intro: [
        "公開：2026年11月24日。データ：2026年11月12日集計。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策（AEO）のツールと WordPress プラグインを提供しており、この分野に利害があります。国別レポートの7本目で、アジアの国では[インド](/guide/research-in-web-agencies-ai-search-2026)に続く2本目です（これまでに[米国](/guide/research-us-web-agencies-ai-search-2026)・[英国](/guide/research-uk-web-agencies-ai-search-2026)・[オーストラリア](/guide/research-au-web-agencies-ai-search-2026)・[カナダ](/guide/research-ca-web-agencies-ai-search-2026)・[フランス](/guide/research-fr-web-agencies-ai-search-2026)）。英語版もあります。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "シンガポールのWeb制作会社の自社サイト641件では、llms.txt があったのが38.8%（249件）、AI検索に関わる6項目をすべて満たしたのが32.4%で、どちらも到達100件以上の17か国で最も高い値でした。インド（36.6%・29.9%）とは統計的な差が見られず（p=0.33・p=0.23）、オーストラリア（24.3%・20.8%）・米国（23.1%・18.9%）・日本（13.4%・10.4%）より高い値です（いずれも p<0.001）。",
            "WordPress のサイトどうしで比べても、シンガポールの llms.txt は46.3%で、シンガポール以外の海外の WordPress サイト（32.4%）やインドの WordPress サイト（39.5%）より高い値でした（p<0.001・p=0.007）。",
            "robots.txt があるサイト546件のうち、AIボットの名前を挙げていたのは22.0%（120件）で17か国で最も多く、そのうち86件はどのAIボットもブロックしていませんでした。実際にAIボットをブロックしていたのは5.7%（31件）で、インド（5.8%）・米国（4.3%）・シンガポール以外の海外（5.1%）と統計的な差はなく、日本（1.3%）より高い値です。GPTBot をブロックしていた28件のうち27件は OAI-SearchBot を許可していました。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "対象：Web制作会社の自社サイト。当社の収集リストで国がシンガポールとなっている制作会社サイト974件のうち、トップページに到達できた641件です。一般企業のサイト全体ではありません。比較には同じ調査のインド（1,554件）・フィリピン（241件）・オーストラリア（1,719件）・米国（4,472件）・日本（2,486件）・シンガポール以外の海外（12,711件）と、アジア太平洋で到達30件以上の国を使いました。",
            "取得したもの：各サイトのトップページ、/robots.txt、/llms.txt、/llms-full.txt を1回ずつ（User-Agent：NurevoSurvey/1.0）。2026年11月上旬〜12日に取得し、11月12日に集計しました。",
            "判定方法：llms.txt は、ステータス200で中身がHTMLではなく20文字を超えるテキストを「あり」としました。JSON-LD はトップページにあるかどうか、「壊れている」は JSON として読み込めないブロックが1つ以上あるもの。Organization系は @type に Organization・LocalBusiness・Corporation・ProfessionalService を含むもの。WordPress はトップページのHTMLに wp-content/・wp-includes/、または generator の WordPress 表記があるもの。SEOプラグインはトップページのHTMLの文字列で判定しました。",
            "AIボットのブロック：robots.txt で、各ボットに当てはまるグループの規則がトップページ（/）を Disallow にするか（最長一致）で判定しました。分母は robots.txt があるサイトです。「AIボットをブロック」は GPTBot・ClaudeBot・PerplexityBot・Google-Extended・CCBot・OAI-SearchBot のどれかをブロックしているもの。「AIボットに言及」は、Googlebot・Bingbot 以外の調査対象のボット名を User-agent 行に書いているものです。",
            "「6項目」は、(1) llms.txt がある、(2) JSON-LD がある、(3) Organization または LocalBusiness の型がある、(4) robots.txt があり GPTBot・ClaudeBot・PerplexityBot・OAI-SearchBot のどれもブロックしていない、(5) meta description がある、(6) canonical がある、のうち当てはまる数（0〜6）です。この調査のための単純な数で、Nurevo の0〜100点のスコアとは別物です。",
            "HTTP 202：シンガポールでトップページがステータス202を返したのは47件（到達件数の7.3%）で、オーストラリア（14.5%）・米国（15.0%）・シンガポール以外の海外（11.3%）より少なく、インド（1.5%）より多い割合でした。202のページはほとんどの項目が「なし」になるため、国どうしの比較に影響します。ステータス200のサイト（594件）だけで見ると、シンガポールは llms.txt 41.9%・6項目すべて35.0%・平均4.70で、インドの200のサイト（37.2%・30.3%）よりやや高く（p=0.043・p=0.036）、米国の200のサイト（27.2%・22.3%）より高い値でした（p<0.001）。",
            "統計：シンガポールと他の地域の差はカイ二乗検定で、件数が小さいAIボットのブロックや JSON-LD の壊れ率はフィッシャーの正確検定で確かめました。30件未満の区分は載せていません。",
          ],
        },
        {
          heading: "結果：シンガポールとインド・フィリピン・オーストラリア・米国・日本の比較",
          paragraphs: [
            "シンガポールは llms.txt（38.8%）・FAQPage（15.0%）・「6項目すべて」（32.4%）が比較した地域の中で最も高く、JSON-LD（80.8%）・Organization系の型（73.3%）・meta description（81.6%）・canonical（82.2%）は、インド・フィリピンと近く、オーストラリア・米国・シンガポール以外の海外より6〜14ポイント高い値でした。インドとの差は小さく、llms.txt・6項目すべて・FAQPage は統計的な差が見られず、JSON-LD はインドのほうがやや高い値です（84.4%、p=0.042）。フィリピンとは llms.txt に差がありました（31.5%、p=0.045）。",
            "日本と比べると、llms.txt は2.9倍（38.8%・13.4%）、「6項目すべて」は3.1倍（32.4%・10.4%）、FAQPage は3.8倍（15.0%・3.9%）でした。一方で meta description（81.6%・90.7%）・robots.txt（85.2%・91.8%）・WordPress の割合（81.3%・92.3%）は日本のほうが高く、日本は「0項目」のサイトが少ない（1.6%）ため、6項目の平均の差（4.36・4.05）は「6項目すべて」の差ほど大きくありません。",
          ],
          table: {
            head: HEAD_JA,
            rows: COMPARE.map(([ja, , ...v]) => [ja, ...v]),
            caption: "Web制作会社の自社サイトで、トップページに到達できたもの。「AIボットをブロック」「AIボットに言及」の分母は robots.txt があるサイト（シンガポール546件・インド1,406件・フィリピン209件・オーストラリア1,336件・米国3,404件・日本2,281件・シンガポール以外の海外9,924件）。2026年11月12日集計。",
          },
        },
        {
          heading: "17か国の中での位置",
          paragraphs: [
            "到達できたサイトが100件以上ある17か国（日本を含む）を llms.txt の割合で並べました。シンガポールは llms.txt と「6項目すべて」で1位、6項目の平均（4.36）はフランス（4.71）・インド（4.53）に次ぐ3位、JSON-LD（80.8%）もフランス・インドに次ぐ3位でした。表にはありませんが、FAQPage（15.0%）・robots.txt でAIボットに言及している割合（22.0%）・JSON-LD が壊れている割合（4.1%）も17か国で最も高い値です。AIボットのブロック率（5.7%）は17か国の中で低いほうから9番目でした。国ごとの件数は収集リストによるもので、各国の制作会社全体の分布ではありません。",
          ],
          table: {
            head: ["国", "到達件数", "llms.txt", "6項目すべて", "6項目の平均", "JSON-LD", "AIボットをブロック"],
            rows: COUNTRIES.map(([ja, , ...v]) => [ja, ...v]),
            caption: "到達できたサイトが100件以上の国。llms.txt の割合の高い順。「AIボットをブロック」の分母は robots.txt があるサイト。2026年11月12日集計。",
          },
        },
        {
          heading: "アジア太平洋の国どうしの比較",
          paragraphs: [
            "アジア太平洋で到達できたサイトが30件以上ある10か国です。llms.txt と「6項目すべて」はシンガポール・インド・フィリピンが上位で、WordPress の割合も80%を超えています。マレーシア（80件）・香港（79件）・台湾（60件）・韓国（36件）は件数が小さく、WordPress の割合が45.0〜55.6%と低い国です。シンガポールの llms.txt はマレーシア（23.8%、p=0.008）・香港（21.5%、p=0.003）より高い値でした。AIボットのブロックはマレーシア（16.7%、8件）が高く、シンガポールとの差はフィッシャーの正確検定で p=0.009 でしたが、件数は小さい数です。",
          ],
          table: {
            head: ["国・地域", "到達件数", "HTTP 202", "WordPress", "llms.txt", "JSON-LD", "6項目すべて", "6項目の平均", "AIボットをブロック"],
            rows: APAC.map(([ja, , ...v]) => [ja, ...v]),
            caption: "アジア太平洋で到達できたサイトが30件以上の国・地域。llms.txt の割合の高い順。「AIボットをブロック」は（ブロックしていた件数／robots.txt があるサイト）。台湾・韓国・マレーシア・香港は件数が小さく、ブロックの件数は1桁です。",
          },
        },
        {
          heading: "ボット別のブロック率",
          paragraphs: [
            "シンガポールで robots.txt があるサイト546件について、ボットごとにトップページをブロックしている割合です。学習用とされるボット（Bytespider・CCBot・GPTBot・ClaudeBot・Applebot-Extended・anthropic-ai・Google-Extended）は4.6〜6.0%で、インド（4.2〜5.6%）と近く、オーストラリア・米国（3.3〜4.3%）よりやや高く、日本（1.0〜1.2%）より高い値でした。検索用やユーザーの質問に答えるときに使われる OAI-SearchBot・Claude-SearchBot・PerplexityBot は各1件（同じ1サイト）、ChatGPT-User・Googlebot・Bingbot は0件です。AIボットのブロック率（5.7%）は、インド（p=1.00）・オーストラリア（p=0.41）・米国（p=0.18）・シンガポール以外の海外（p=0.55）と統計的な差は見られず、日本より高い値でした（p<0.001）。",
          ],
          table: {
            head: ["ボット", "シンガポール（件数）", "シンガポール", "インド", "オーストラリア", "米国", "日本"],
            rows: BOTS,
            caption: "分母は robots.txt があるサイト（シンガポール546件・インド1,406件・オーストラリア1,336件・米国3,404件・日本2,281件）。トップページ（/）に対する判定。シンガポールの件数は小さい数です。",
          },
        },
        {
          heading: "ブロックと言及の中身（事実）",
          list: [
            "GPTBot をブロックしていた28件のうち27件は、OAI-SearchBot をブロックしていませんでした。",
            "上の11種のAIボットのどれかをブロックしていた34件のうち25件は、GPTBot・ClaudeBot・anthropic-ai・Google-Extended・CCBot・Bytespider・Applebot-Extended の7つをまとめてブロックする同じ組み合わせでした。Bytespider だけが3件、CCBot と Bytespider が2件、CCBot だけが1件、そのほかの組み合わせが3件です。検索用の OAI-SearchBot・Claude-SearchBot・PerplexityBot までブロックしていたのは、そのうちの1件でした。",
            "robots.txt でAIボットの名前を挙げていたのは120件（robots.txt があるサイトの22.0%）で、シンガポール以外の海外（11.2%）・インド（15.0%）・米国（8.8%）・日本（2.5%）より多い割合でした（いずれも p<0.001）。そのうち86件（robots.txt があるサイトの15.8%）は、名前を挙げながらどのAIボットもトップページをブロックしていませんでした（シンガポール以外の海外は5.8%）。",
            "名前を挙げてもブロックしていない86件のうち62件（72.1%）には llms.txt もありました。AIボットの名前がない robots.txt のサイトでは40.4%です（p<0.001）。この調査では、robots.txt や llms.txt をプラグインで作ったのか手で書いたのかは見ていません。",
            "AIボットのどれかをブロックしていた34件のうち11件には llms.txt もありました。",
            "robots.txt に Sitemap の行があったのは、robots.txt があるサイトの92.1%でした。",
          ],
        },
        {
          heading: "構造化データの型と壊れ率",
          paragraphs: [
            "トップページの JSON-LD に含まれる型は、シンガポールでは WebSite（71.5%）・Organization（69.3%）・WebPage（61.6%）・ImageObject（60.2%）・SearchAction（59.3%）が多く、インドに近い構成でした。米国と比べると、PostalAddress（40.7%・24.3%）・ContactPoint（29.2%・12.5%）・FAQPage（15.0%・6.2%）・AggregateRating（12.2%・4.6%）が高い値です。日本と比べると、ほとんどの型が高く、BreadcrumbList（41.7%・43.4%）だけはほぼ同じでした。",
            "JSON-LD があるサイト518件のうち、JSON として読み込めないブロックがあったのは4.1%（21件）で、17か国で最も高い割合でした。米国（1.6%）・シンガポール以外の海外（1.7%）より高く（p<0.001）、インド（2.9%）とは統計的な差が見られませんでした（p=0.24）。どの部分が壊れているかは、この調査では見ていません。",
          ],
          table: {
            head: ["@type", "シンガポール", "インド", "オーストラリア", "米国", "日本"],
            rows: TYPES,
            caption: "到達できたサイトのうち、トップページの JSON-LD にその型があった割合（入れ子の型も数えます）。シンガポール641件・インド1,554件・オーストラリア1,719件・米国4,472件・日本2,486件。",
          },
        },
        {
          heading: "WordPress とSEOプラグイン",
          paragraphs: [
            "シンガポールの制作会社サイトの81.3%（521件）が WordPress で、オーストラリア（76.0%）・米国（74.5%）より高く、インド（89.0%）・日本（92.3%）より低い値でした。WordPress のサイトは llms.txt 46.3%、JSON-LD 95.6%、6項目すべて39.3%、平均5.15 です。WordPress 以外の120件は llms.txt 8件（6.7%）・JSON-LD 16.7%・平均0.93 でしたが、この120件には202を返した47件がすべて含まれます（202のページでは WordPress と判定できないため）。ステータス200の WordPress 以外73件では、llms.txt 11.0%・JSON-LD 27.4%・平均1.49 でした。",
            "WordPress のサイトどうしで比べても、シンガポールの llms.txt（46.3%）は、シンガポール以外の海外（32.4%、p<0.001）・インド（39.5%、p=0.007）・米国（30.1%）より高く、「6項目すべて」（39.3%）もシンガポール以外の海外（27.4%、p<0.001）・インド（32.7%、p=0.006）より高い値でした。WordPress の割合の高さだけでは説明しにくい差です。",
            "SEOプラグインは Yoast SEO が50.3%、Rank Math が23.0%、AIOSEO が6.0%で、英国・オーストラリアと似た構成です。llms.txt があった割合は AIOSEO 64.5%（31件中20件）、Yoast SEO 46.9%、Rank Math 46.7%、プラグインを検出できなかったサイト38.3%でした。SEOPress（1件）は30件未満のため表に載せていません。",
          ],
          table: {
            head: ["SEOプラグイン", "シンガポールの WordPress サイト", "llms.txt", "JSON-LD", "6項目の平均"],
            rows: PLUGINS.map(([p, ...v]) => [p.replace("検出なし / none detected", "検出なし"), ...v]),
            caption: "シンガポールの WordPress サイト521件。プラグインはトップページのHTMLの文字列で判定（Yoast → Rank Math → AIOSEO → SEOPress の順に最初に当てはまったもの）。30件未満の区分（SEOPress）は省略。",
          },
        },
        {
          heading: ".sg と .com",
          paragraphs: [
            "シンガポールの制作会社サイトを、ドメインの末尾で分けました。到達641件のうち .sg（.com.sg を含む）が50件、.com が413件、それ以外が178件で、.com が多数でした（.com.sg と .sg はそれぞれ25件で30件未満のため、まとめています）。JSON-LD は .com のほうが高く（83.1%・64.0%、p=0.001）、llms.txt（39.7%・26.0%）と「6項目すべて」（33.4%・20.0%）も .com が高い値でしたが、統計的にははっきりした差ではありません（p=0.060・p=0.055）。.sg は50件と小さい数です。差が生まれる理由（顧客層や制作体制など）は、この調査では分かりません。",
          ],
          table: {
            head: ["ドメイン", "到達件数", "HTTP 202", "llms.txt", "JSON-LD", "6項目すべて", "6項目の平均"],
            rows: DOMAINS.map(([d, ...v]) => [d.split(" / ")[0], ...v]),
            caption: "シンガポールの到達641件を、ホスト名の末尾で分けたもの。HTTP 202 の割合はその区分の到達件数に対するもの。",
          },
        },
        {
          heading: "6項目の分布",
          paragraphs: [
            "シンガポールは「5項目」（37.3%）と「6項目」（32.4%）で69.7%を占めました。5項目を満たす239件のうち207件（86.6%）は、欠けていた1項目が llms.txt でした（次いで Organization系の型が19件、robots.txt が9件）。「0項目」は13.9%（89件）で、そのうち44件は202を返したサイトです。日本は「0項目」が1.6%と少ない一方、3〜4項目の層が厚い（合わせて30.7%、シンガポール12.6%）形でした。",
            "llms.txt の行数の中央値は、シンガポールで88行（249件）、インドで80行、米国で64行、日本で93行でした。行数は中身の質を表すものではありません。",
          ],
          table: {
            head: ["当てはまる項目数", "シンガポール", "インド", "オーストラリア", "米国", "日本"],
            rows: DIST,
            caption: "到達できたサイトに占める割合。シンガポール641件、インド1,554件、オーストラリア1,719件、米国4,472件、日本2,486件。",
          },
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "この調査の数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。そのまま使える1文：",
          ],
          list: [
            "シンガポールのWeb制作会社の自社サイトの38.8%に llms.txt があり、到達100件以上の17か国で最も高い割合だった（インド36.6%、オーストラリア24.3%、米国23.1%、日本13.4%）（Nurevo AEO 調査、2026年11月、641件）。",
            "シンガポールのWeb制作会社の自社サイトの32.4%が、AI検索に関わる6項目（llms.txt・JSON-LD・Organization系の型・AIボットを拒否しない robots.txt・meta description・canonical）をすべて満たしていた（日本10.4%）（Nurevo AEO 調査、2026年11月）。",
            "シンガポールのWeb制作会社の自社サイトの22.0%が robots.txt でAIボットに言及していたが、実際にAIボットをブロックしていたのは5.7%だった（Nurevo AEO 調査、2026年11月）。",
            "シンガポールのWeb制作会社の WordPress サイトの46.3%に llms.txt があった（シンガポール以外の海外の WordPress サイトは32.4%）（Nurevo AEO 調査、2026年11月）。",
            "シンガポールのWeb制作会社の自社サイトの15.0%のトップページに FAQPage の構造化データがあった（米国6.2%、日本3.9%）（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "限界",
          list: [
            "対象はWeb制作会社の自社サイトで、一般企業のサイト全体ではありません。国は当社の収集リストの記載によるもので、シンガポールの制作会社全体を代表する標本ではありません。シンガポールに拠点を置く地域統括の会社や、他国の会社のシンガポール向けサイトが含まれている可能性があります。ボット別の件数やアジア太平洋の小さい国の値は小さい数です。",
            "トップページだけを見ています。robots.txt はトップページ（/）に対する判定で、一部のディレクトリだけのブロックや、ファイアウォール・CDN によるブロックは数えていません。llms.txt は有無と行数だけを見て、中身の質は見ていません。",
            "各サイト1回の取得で、到達できなかったサイト（333件）は除いています。HTTP 202 を返した47件は、実際のトップページとは違うページを見ている可能性があります。",
            "SEOプラグインはHTMLの文字列による判定で、痕跡を消している場合や複数入っている場合は正しく分けられません。JavaScript で後から出す構造化データは数えていません。",
            "今回の数字は2026年11月12日の集計です。週ごとに取り直すため、次の集計では値が変わることがあります。",
          ],
        },
        {
          heading: "読み方（意見）",
          paragraphs: [
            "ここからは当社の解釈です。シンガポールの制作会社サイトは、基本の項目のそろい方はインド・フィリピンと近く、llms.txt と「6項目すべて」で17か国の先頭にいました。WordPress のサイトどうしでも差があったので、プラグインの普及だけでなく、新しい仕組みを自社サイトで先に試す傾向がある可能性もありますが、この調査は原因を確かめていません。robots.txt でAIボットの名前を挙げながらブロックしないサイトが多いことは、AIボットの扱いを意識して書いているサイトが多いことを示しているのかもしれません。どのボットをブロックするかは各サイトの判断です。これらの項目がそろっていても、AIの回答に必ず出るわけではありません（[別の調査](/guide/aeo-signals-ai-answers-study)では、サイト側の項目と回答への登場に関係は見られませんでした）。",
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
        { q: "シンガポールの制作会社サイトはAI検索への対応が進んでいますか？", a: "llms.txt（38.8%）と6項目すべて（32.4%）は、到達100件以上の17か国で最も高い値でした。インドとは統計的な差が見られません（2026年11月、制作会社の自社サイト）。" },
        { q: "日本と比べるとどうですか？", a: "llms.txt は日本の2.9倍（38.8%・13.4%）、6項目すべては3.1倍（32.4%・10.4%）、FAQPage は3.8倍（15.0%・3.9%）でした。meta description と robots.txt の設置は日本のほうが高い値です。" },
        { q: "シンガポールではAIクローラーをブロックするサイトが多いですか？", a: "robots.txt があるサイトの5.7%（31件）で、インド・米国・他の海外と統計的な差はありませんでした。AIボットに言及する robots.txt は22.0%と多いものの、その多くはブロックしていません。検索用のボットまでブロックしていたのは1件でした。" },
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
      title: "AI Search Readiness of 641 Singapore Web Agency Websites (2026) | Nurevo",
      description: "641 Singapore web agency sites: 38.8% have an llms.txt and 32.4% meet all six AI-search items, both the highest of 17 countries (Japan: 13.4%, 10.4%). 5.7% block AI bots.",
      h1: "AI search readiness of Singapore web design agencies: 641 agency websites (November 2026)",
      lead: "We fetched the home page, robots.txt and llms.txt of 641 Singapore web design agencies' own websites. 38.8% (249 sites) had an llms.txt and 32.4% met all six AI-search items — both the highest among the 17 countries with 100+ sites in our survey (Japan: 13.4% and 10.4%). Singapore sites were also the most likely to name AI bots in robots.txt (22.0%), yet only 5.7% (31 sites) actually blocked one, no different statistically from other overseas countries.",
      intro: [
        "Published 24 November 2026. Data aggregated 12 November 2026. Research and writing: Nurevo AEO (Bestie.合同会社, Japan). Nurevo sells AI search optimisation (AEO) tools and a WordPress plugin, so we have an interest in this topic. This is the seventh of our country reports and the second in Asia after [India](/guide/research-in-web-agencies-ai-search-2026) (the others: the [US](/guide/research-us-web-agencies-ai-search-2026), the [UK](/guide/research-uk-web-agencies-ai-search-2026), [Australia](/guide/research-au-web-agencies-ai-search-2026), [Canada](/guide/research-ca-web-agencies-ai-search-2026) and [France](/guide/research-fr-web-agencies-ai-search-2026)).",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "Of 641 Singapore web agency websites, 38.8% (249) had an llms.txt and 32.4% met all six AI-search items — the highest of the 17 countries with 100+ reached sites. There was no statistically significant difference from India (36.6%, 29.9%; p=0.33, p=0.23), while Singapore was ahead of Australia (24.3%, 20.8%), the US (23.1%, 18.9%) and Japan (13.4%, 10.4%) (all p<0.001).",
            "The lead holds among WordPress sites: 46.3% of Singapore's WordPress agency sites had an llms.txt, against 32.4% of WordPress sites in all other overseas countries and 39.5% in India (p<0.001, p=0.007).",
            "Of the 546 sites with a robots.txt, 22.0% (120) named an AI bot — the most of the 17 countries — and 86 of them blocked none. 5.7% (31) actually blocked an AI bot, with no significant difference from India (5.8%), the US (4.3%) or other overseas sites (5.1%), but more than Japan (1.3%). 27 of the 28 sites blocking GPTBot still allowed OAI-SearchBot.",
          ],
        },
        {
          heading: "Methodology",
          list: [
            "Population: web design agencies' own websites. Of 974 agency sites listed as Singapore in our collection list, 641 home pages were reachable. This is not a sample of all Singapore businesses. For comparison we use India (1,554), the Philippines (241), Australia (1,719), the US (4,472), Japan (2,486) and all other overseas sites excluding Singapore (12,711) from the same survey, plus Asia-Pacific countries with 30+ reached sites.",
            "What we fetched: each site's home page, /robots.txt, /llms.txt and /llms-full.txt, once each (User-Agent: NurevoSurvey/1.0), between early November and 12 November 2026; aggregated on 12 November.",
            "How we judged: llms.txt counts if it returned status 200 with non-HTML text longer than 20 characters. JSON-LD means at least one block on the home page; \"broken\" means at least one block that does not parse as JSON. Organization-type means an @type containing Organization, LocalBusiness, Corporation or ProfessionalService. WordPress means wp-content/, wp-includes/ or a WordPress generator tag in the home page HTML. SEO plugins were identified from strings in the home page HTML.",
            "AI bot blocking: whether the robots.txt group that applies to each bot disallows the home page (/), using longest match. The base is sites with a robots.txt. \"Blocks an AI bot\" means blocking any of GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot or OAI-SearchBot. \"Names an AI bot\" means a User-agent line for any surveyed bot other than Googlebot and Bingbot.",
            "The \"six items\" are: (1) has an llms.txt, (2) has JSON-LD, (3) has an Organization or LocalBusiness type, (4) has a robots.txt that blocks none of GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot, (5) has a meta description, (6) has a canonical link. It is a simple count (0–6) for this survey, not Nurevo's 0–100 score.",
            "HTTP 202: 47 Singapore home pages answered with status 202 (7.3% of reached) — fewer than Australia (14.5%), the US (15.0%) or other overseas sites (11.3%), more than India (1.5%). A 202 page scores \"no\" on almost everything, which affects country comparisons. Among the 594 Singapore sites that answered 200, llms.txt was 41.9%, all six items 35.0% and the average 4.70 — slightly above India's 200 sites (37.2%, 30.3%; p=0.043, p=0.036) and above the US (27.2%, 22.3%; p<0.001).",
            "Statistics: differences were tested with chi-square tests; AI bot blocking and broken JSON-LD (small counts) with Fisher's exact test. Groups with fewer than 30 sites are not shown.",
          ],
        },
        {
          heading: "Results: Singapore vs India, the Philippines, Australia, the US and Japan",
          paragraphs: [
            "Singapore had the highest llms.txt (38.8%), FAQPage (15.0%) and all-six (32.4%) shares of the regions compared. JSON-LD (80.8%), Organization-type (73.3%), meta descriptions (81.6%) and canonical links (82.2%) were close to India and the Philippines, and 6–14 points above Australia, the US and other overseas sites. The gap with India is small: llms.txt, all six and FAQPage showed no significant difference, and India was slightly higher on JSON-LD (84.4%, p=0.042). Singapore was ahead of the Philippines on llms.txt (31.5%, p=0.045).",
            "Compared with Japan, Singapore had 2.9 times the llms.txt share (38.8% vs 13.4%), 3.1 times the all-six share (32.4% vs 10.4%) and 3.8 times the FAQPage share (15.0% vs 3.9%). Japan was higher on meta descriptions (90.7% vs 81.6%), robots.txt (91.8% vs 85.2%) and WordPress (92.3% vs 81.3%), and has very few zero-item sites (1.6%), so the gap in the six-item average (4.36 vs 4.05) is smaller than the gap in the all-six share.",
          ],
          table: {
            head: HEAD_EN,
            rows: COMPARE.map(([, en, ...v]) => [en, ...v]),
            caption: "Web design agencies' own websites whose home page was reachable. Base for \"blocks\" and \"names an AI bot\" is sites with a robots.txt (Singapore 546, India 1,406, Philippines 209, Australia 1,336, US 3,404, Japan 2,281, other overseas 9,924). Aggregated 12 November 2026.",
          },
        },
        {
          heading: "Where Singapore sits among 17 countries",
          paragraphs: [
            "The 17 countries (Japan included) with 100+ reached sites, ordered by llms.txt share. Singapore ranked first on llms.txt and on all six items, third on the six-item average (4.36, after France 4.71 and India 4.53) and third on JSON-LD (80.8%, after France and India). Not shown in the table: Singapore also had the highest FAQPage share (15.0%), the highest share of robots.txt files naming an AI bot (22.0%) and the highest share of broken JSON-LD (4.1%) of the 17. Its AI bot blocking rate (5.7%) was ninth-lowest. Country counts reflect our collection list, not the distribution of all agencies in each country.",
          ],
          table: {
            head: ["Country", "Reached", "llms.txt", "All 6 items", "6-item average", "JSON-LD", "Blocks an AI bot"],
            rows: COUNTRIES.map(([, en, ...v]) => [en, ...v]),
            caption: "Countries with 100+ reachable sites, by llms.txt share. Base for \"blocks an AI bot\" is sites with a robots.txt. Aggregated 12 November 2026.",
          },
        },
        {
          heading: "Asia-Pacific comparison",
          paragraphs: [
            "The ten Asia-Pacific countries and territories with 30+ reached sites. Singapore, India and the Philippines lead on llms.txt and all six items, and more than 80% of their agency sites run WordPress. Malaysia (80 sites), Hong Kong (79), Taiwan (60) and South Korea (36) are small samples with lower WordPress shares (45.0–55.6%). Singapore's llms.txt share was higher than Malaysia's (23.8%, p=0.008) and Hong Kong's (21.5%, p=0.003). Malaysia had a high AI bot blocking rate (16.7%, 8 sites; vs Singapore p=0.009 by Fisher's exact test), but the counts are small.",
          ],
          table: {
            head: ["Country / territory", "Reached", "HTTP 202", "WordPress", "llms.txt", "JSON-LD", "All 6 items", "6-item average", "Blocks an AI bot"],
            rows: APAC.map(([, en, ...v]) => [en, ...v.slice(0, -1), v[v.length - 1].replace("（", " (").replace("）", ")")]),
            caption: "Asia-Pacific countries and territories with 30+ reachable sites, by llms.txt share. \"Blocks an AI bot\" shows blocked / sites with a robots.txt. Taiwan, South Korea, Malaysia and Hong Kong are small samples with single-digit blocking counts.",
          },
        },
        {
          heading: "Blocking by bot",
          paragraphs: [
            "For the 546 Singapore sites with a robots.txt, the share blocking the home page for each bot. Crawlers described as training crawlers (Bytespider, CCBot, GPTBot, ClaudeBot, Applebot-Extended, anthropic-ai, Google-Extended) were blocked by 4.6–6.0% — close to India (4.2–5.6%), slightly above Australia and the US (3.3–4.3%) and above Japan (1.0–1.2%). Bots used for search or to fetch pages when a user asks — OAI-SearchBot, Claude-SearchBot and PerplexityBot — were each blocked by one site (the same site); ChatGPT-User, Googlebot and Bingbot by none. Singapore's AI bot blocking rate (5.7%) showed no significant difference from India (p=1.00), Australia (p=0.41), the US (p=0.18) or other overseas sites (p=0.55), and was higher than Japan's (p<0.001).",
          ],
          table: {
            head: ["Bot", "Singapore (sites)", "Singapore", "India", "Australia", "US", "Japan"],
            rows: BOTS,
            caption: "Base: sites with a robots.txt (Singapore 546, India 1,406, Australia 1,336, US 3,404, Japan 2,281). Judged for the home page (/). Singapore counts are small.",
          },
        },
        {
          heading: "What the blocking and naming look like (facts)",
          list: [
            "27 of the 28 sites blocking GPTBot did not block OAI-SearchBot.",
            "Of the 34 sites blocking any of the 11 AI bots above, 25 used the same combination of seven: GPTBot, ClaudeBot, anthropic-ai, Google-Extended, CCBot, Bytespider and Applebot-Extended. Three blocked Bytespider only, two CCBot and Bytespider, one CCBot only, and three used other combinations. One of the 34 also blocked the search bots OAI-SearchBot, Claude-SearchBot and PerplexityBot.",
            "120 sites (22.0% of those with a robots.txt) named an AI bot — more than other overseas sites (11.2%), India (15.0%), the US (8.8%) and Japan (2.5%) (all p<0.001). 86 of them (15.8% of sites with a robots.txt) named AI bots but blocked none of them from the home page (other overseas: 5.8%).",
            "62 of those 86 sites (72.1%) also had an llms.txt, against 40.4% of sites whose robots.txt names no AI bot (p<0.001). This survey does not check whether robots.txt or llms.txt was written by hand or generated by a plugin.",
            "11 of the 34 sites blocking an AI bot also had an llms.txt.",
            "92.1% of robots.txt files included a Sitemap line.",
          ],
        },
        {
          heading: "Structured data types and broken JSON-LD",
          paragraphs: [
            "The most common JSON-LD types on Singapore home pages were WebSite (71.5%), Organization (69.3%), WebPage (61.6%), ImageObject (60.2%) and SearchAction (59.3%), a profile close to India's. Compared with the US, Singapore had more PostalAddress (40.7% vs 24.3%), ContactPoint (29.2% vs 12.5%), FAQPage (15.0% vs 6.2%) and AggregateRating (12.2% vs 4.6%). Compared with Japan almost every type was more common; only BreadcrumbList was about the same (41.7% vs 43.4%).",
            "Of the 518 sites with JSON-LD, 4.1% (21) had a block that does not parse as JSON — the highest share of the 17 countries, above the US (1.6%) and other overseas sites (1.7%) (p<0.001), with no significant difference from India (2.9%, p=0.24). This survey does not record which part is broken.",
          ],
          table: {
            head: ["@type", "Singapore", "India", "Australia", "US", "Japan"],
            rows: TYPES,
            caption: "Share of reachable sites whose home page JSON-LD contains the type (nested types included). Singapore 641, India 1,554, Australia 1,719, US 4,472, Japan 2,486.",
          },
        },
        {
          heading: "WordPress and SEO plugins",
          paragraphs: [
            "81.3% (521) of Singapore agency sites run WordPress — more than Australia (76.0%) and the US (74.5%), fewer than India (89.0%) and Japan (92.3%). The WordPress sites had llms.txt 46.3%, JSON-LD 95.6%, all six 39.3% and an average of 5.15. The 120 non-WordPress sites had llms.txt 8 (6.7%), JSON-LD 16.7% and an average of 0.93, but they include all 47 sites that answered 202 (WordPress cannot be detected on a 202 page). Among the 73 non-WordPress sites that answered 200: llms.txt 11.0%, JSON-LD 27.4%, average 1.49.",
            "Among WordPress sites alone, Singapore's llms.txt share (46.3%) was still higher than other overseas (32.4%, p<0.001), India (39.5%, p=0.007) and the US (30.1%), and so was its all-six share (39.3% vs 27.4%, p<0.001, and vs India 32.7%, p=0.006). So the difference is not explained by the WordPress share alone.",
            "Yoast SEO was detected on 50.3%, Rank Math on 23.0% and AIOSEO on 6.0% of WordPress sites — similar to the UK and Australia. llms.txt shares were AIOSEO 64.5% (20 of 31), Yoast SEO 46.9%, Rank Math 46.7% and no plugin detected 38.3%. SEOPress (1 site) is below 30 and not shown.",
          ],
          table: {
            head: ["SEO plugin", "Singapore WordPress sites", "llms.txt", "JSON-LD", "6-item average"],
            rows: PLUGINS.map(([p, ...v]) => [p.replace("検出なし / none detected", "None detected"), ...v]),
            caption: "521 Singapore WordPress sites. Plugin identified from strings in the home page HTML (first match in the order Yoast → Rank Math → AIOSEO → SEOPress). Groups under 30 (SEOPress) omitted.",
          },
        },
        {
          heading: ".sg vs .com",
          paragraphs: [
            "We split Singapore agency sites by the end of the host name: of 641 reached, 50 were .sg (including .com.sg), 413 .com and 178 other — .com is the majority (.com.sg and .sg have 25 sites each, under 30, so they are combined). JSON-LD was higher on .com (83.1% vs 64.0%, p=0.001); llms.txt (39.7% vs 26.0%) and all six (33.4% vs 20.0%) were also higher on .com, but not clearly significant (p=0.060, p=0.055). The .sg group is small (50). This survey cannot tell why (client base, how sites are built, and so on).",
          ],
          table: {
            head: ["Domain", "Reached", "HTTP 202", "llms.txt", "JSON-LD", "All 6 items", "6-item average"],
            rows: DOMAINS.map(([d, ...v]) => [d.includes(" / ") ? d.split(" / ")[1].replace("other", "Other") : d, ...v]),
            caption: "The 641 reachable Singapore sites split by the end of the host name. HTTP 202 share is of the group's reached sites.",
          },
        },
        {
          heading: "Distribution of the six items",
          paragraphs: [
            "In Singapore, five items (37.3%) and six items (32.4%) together made up 69.7%. Of the 239 sites meeting five items, 207 (86.6%) were missing only the llms.txt (then Organization-type 19, robots.txt 9). Zero items accounted for 13.9% (89 sites), 44 of which answered 202. Japan has very few zero-item sites (1.6%) but a thick middle at three to four items (30.7% combined; Singapore 12.6%).",
            "The median llms.txt length was 88 lines in Singapore (249 files), 80 in India, 64 in the US and 93 in Japan. Length says nothing about quality.",
          ],
          table: {
            head: ["Items met", "Singapore", "India", "Australia", "US", "Japan"],
            rows: DIST,
            caption: "Share of reachable sites. Singapore 641, India 1,554, Australia 1,719, US 4,472, Japan 2,486.",
          },
        },
        {
          heading: "Citing this research",
          paragraphs: [
            "You may quote and republish the figures and tables freely if you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. Ready-to-use sentences:",
          ],
          list: [
            "38.8% of Singapore web design agencies' own websites had an llms.txt, the highest of 17 countries surveyed (India 36.6%, Australia 24.3%, US 23.1%, Japan 13.4%) (Nurevo AEO survey, November 2026, 641 sites).",
            "32.4% of Singapore web agency websites met all six AI-search items (llms.txt, JSON-LD, an Organization-type schema, a robots.txt that does not block AI search bots, a meta description and a canonical link), against 10.4% in Japan (Nurevo AEO survey, November 2026).",
            "22.0% of Singapore web agency websites named AI bots in robots.txt, but only 5.7% actually blocked one (Nurevo AEO survey, November 2026).",
            "46.3% of Singapore web agencies' WordPress sites had an llms.txt, against 32.4% of WordPress agency sites in other countries outside Japan (Nurevo AEO survey, November 2026).",
            "15.0% of Singapore web agency home pages carried FAQPage structured data (US 6.2%, Japan 3.9%) (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Limitations",
          list: [
            "The population is web design agencies' own websites, not all businesses. Country is as recorded in our collection list, which is not a representative sample of all agencies in Singapore; it may include regional headquarters based in Singapore and Singapore-facing sites of agencies from other countries. Per-bot counts and the smaller Asia-Pacific samples are small numbers.",
            "Only the home page was examined. robots.txt was judged for the home page (/) only; partial-directory blocks and firewall or CDN blocking are not counted. For llms.txt we recorded presence and line count, not quality.",
            "Each site was fetched once; the 333 unreachable sites are excluded. The 47 sites that answered 202 may have served something other than the real home page.",
            "SEO plugins were identified from HTML strings and may be misclassified if traces are removed or several plugins are installed. Structured data injected later by JavaScript is not counted.",
            "Figures are from the 12 November 2026 aggregation. The survey is re-run weekly, so later figures may differ.",
          ],
        },
        {
          heading: "How to read this (opinion)",
          paragraphs: [
            "This section is our interpretation. Singapore agency sites have the basics in place about as often as India and the Philippines, and lead the 17 countries on llms.txt and on meeting all six items. Because the lead holds among WordPress sites, it may reflect more than plugin adoption — perhaps a tendency to try new conventions on their own sites first — but this survey does not test cause. The many robots.txt files that name AI bots without blocking them may suggest that many agencies are writing deliberate AI bot rules. Which bots to block is each site owner's decision. None of this guarantees appearing in AI answers (in [another of our studies](/guide/aeo-signals-ai-answers-study), on-site signals showed no relationship with appearance).",
          ],
        },
        {
          heading: "Check your own or your clients' sites",
          paragraphs: [
            "The [free check](https://nurevo.jp/check) shows llms.txt, structured data and AI crawler access in about a minute. On WordPress, the [Nurevo WebMCP plugin](https://wordpress.org/plugins/nurevo-webmcp/) publishes an llms.txt and adds business facts to structured data. Agencies that want to roll it out across clients' sites can see the [partner programme](https://nurevo.jp/partner/).",
          ],
        },
      ],
      faqs: [
        { q: "Are Singapore agencies ahead on AI search readiness?", a: "On llms.txt (38.8%) and meeting all six items (32.4%), Singapore was the highest of 17 countries. The difference from India was not statistically significant (November 2026, agencies' own websites)." },
        { q: "How does Singapore compare with Japan?", a: "Singapore had 2.9 times Japan's llms.txt share (38.8% vs 13.4%), 3.1 times the all-six share (32.4% vs 10.4%) and 3.8 times the FAQPage share (15.0% vs 3.9%). Japan was higher on meta descriptions and robots.txt." },
        { q: "Do many Singapore sites block AI crawlers?", a: "5.7% of sites with a robots.txt (31 sites), no different statistically from India, the US or other overseas sites. 22.0% name AI bots in robots.txt, but most of those do not block them. Only one site blocked search bots." },
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
