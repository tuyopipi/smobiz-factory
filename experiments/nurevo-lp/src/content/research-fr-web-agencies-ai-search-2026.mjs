// Content page: research report (country report: France). AI search readiness
// of French web design agencies' own websites, compared with the UK, Spain,
// Italy, Japan and other overseas agencies. November 2026.
//
// Every number here comes from nurevo-outreach data/survey/raw_2026-11-12.json
// (survey.js; the same run as summary_2026-11-12.json — the French totals
// match summary.byCountry.FR: 405 reached, llms.txt 26.4%, JSON-LD 90.1%,
// WordPress 92.3%, AI bot blocked 1.9%, all 6 items 24.0%, 6-item average
// 4.7). Country = the "co" field of our collection list (FR; 821 listed, 416
// not reached). Do not add a figure that is not in that data. The raw file
// holds company names and domains: never publish them. Definitions follow
// survey.js (see the US report).
// HTTP 202: only 7 French home pages answered 202 (1.7% of reached; UK 14.9%,
// Spain 5.6%, Italy 22.7%, other overseas 11.4%). HTTP-200-only values are in
// the text (France 398: llms.txt 26.9%, all 6 24.4%, average 4.80).
// "Other overseas" = all non-Japan sites except France (12,947 reached).
// Country ranking = the 17 countries (Japan included) with 100+ reached sites.
// Groups under 30 sites are not shown (AIOSEO 11 and SEOPress 4 French
// WordPress sites).
// Chi-square, France vs UK: llms.txt p=0.06, all 6 p=0.01, 5+ p<0.001,
// JSON-LD p<0.001, FAQPage p=0.005. vs Spain: llms.txt p=0.16, all 6 p=0.37,
// FAQPage p=0.92. vs Italy: llms.txt p=0.21, all 6 p=0.17. vs US: llms.txt
// p=0.14, all 6 p=0.017. vs Japan: llms.txt, all 6, JSON-LD p<0.001,
// meta description p=0.92. vs other overseas: llms.txt p=1.00, all 6 p=0.32,
// JSON-LD p<0.001, FAQPage p=0.011.
// AI bot blocking (Fisher's exact test, small counts): vs UK p=0.018, vs Spain
// p=0.031, vs Italy p=0.005, vs US p=0.019, vs other overseas p=0.002, vs
// Japan p=0.34.
// HTTP 200 only, France vs US: llms.txt 26.9% vs 27.2% (p=0.96), all 6 24.4%
// vs 22.3% (p=0.37); vs other overseas 29.7% (p=0.24) / 24.5% (p=0.99).
// WordPress only: France llms.txt 27.5%, US 30.1% (p=0.34), other overseas
// 33.3% (p=0.023), Japan 14.0% (p<0.001); all 6 France 25.9% vs other
// overseas 28.1% (p=0.39).
// Domain split (.fr 209 / .com 143 / other 53): llms.txt 21.5% vs 33.6%
// (p=0.017), all 6 18.2% vs 32.2% (p=0.004), JSON-LD 91.4% vs 86.7% (p=0.22).
// French translation: src/content/research-fr-web-agencies-ai-search-2026/fr.json

// [ja label, en label, France, UK, Spain, Italy, Japan, other overseas (excl. France)]
const COMPARE = [
  ["到達件数", "Sites reached", "405", "942", "248", "110", "2,486", "12,947"],
  ["HTTP 202 を返した割合", "Answered HTTP 202", "1.7%", "14.9%", "5.6%", "22.7%", "0.0%", "11.4%"],
  ["WordPress", "WordPress", "92.3%", "73.4%", "67.3%", "51.8%", "92.3%", "75.0%"],
  ["llms.txt", "llms.txt", "26.4%", "21.5%", "31.9%", "20.0%", "13.4%", "26.4%"],
  ["llms-full.txt", "llms-full.txt", "1.2%", "1.3%", "3.6%", "1.8%", "0.6%", "1.8%"],
  ["JSON-LD", "JSON-LD", "90.1%", "68.8%", "69.0%", "49.1%", "69.4%", "71.4%"],
  ["JSON-LD が壊れている（JSON-LD があるサイト中）", "Broken JSON-LD (of sites with JSON-LD)", "1.1%", "2.0%", "1.2%", "0.0%", "1.7%", "1.9%"],
  ["Organization系の型", "Organization-type", "81.2%", "59.6%", "62.9%", "44.5%", "58.9%", "63.0%"],
  ["FAQPage", "FAQPage", "13.1%", "8.0%", "12.5%", "2.7%", "3.9%", "9.2%"],
  ["microdata（schema.org）", "Microdata (schema.org)", "24.7%", "16.9%", "22.2%", "15.5%", "7.8%", "19.4%"],
  ["meta description", "Meta description", "90.4%", "69.3%", "65.7%", "51.8%", "90.7%", "70.9%"],
  ["Open Graph", "Open Graph", "90.9%", "69.1%", "67.3%", "50.0%", "81.3%", "71.8%"],
  ["canonical", "Canonical link", "93.6%", "72.7%", "70.6%", "52.7%", "84.6%", "75.8%"],
  ["robots.txt", "robots.txt", "93.3%", "74.2%", "71.8%", "57.3%", "91.8%", "77.9%"],
  ["AIボットをブロック（robots.txt があるサイト中）", "Blocks an AI bot (of sites with robots.txt)", "1.9%", "4.7%", "5.6%", "9.5%", "1.3%", "5.2%"],
  ["robots.txt でAIボットに言及", "robots.txt names an AI bot", "7.4%", "9.3%", "14.0%", "14.3%", "2.5%", "11.9%"],
  ["6項目の平均", "6-item average", "4.71", "3.61", "3.67", "2.70", "4.05", "3.80"],
  ["5項目以上", "5+ items", "74.3%", "55.1%", "56.9%", "40.9%", "52.2%", "57.7%"],
  ["6項目すべて", "All 6 items", "24.0%", "17.7%", "27.4%", "17.3%", "10.4%", "21.7%"],
];

// [ja name, en name, reached, llms.txt, all 6, 6-item average, JSON-LD, AI bot blocked]  17 countries with 100+ reached sites, by llms.txt
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

// [bot, France blocked, France %, UK %, Spain %, Italy %, Japan %]  base = sites with robots.txt (France 378 / UK 699 / Spain 178 / Italy 63 / Japan 2,281)
const BOTS = [
  ["CCBot", "7", "1.9%", "4.6%", "5.6%", "9.5%", "1.1%"],
  ["GPTBot", "5", "1.3%", "4.0%", "5.1%", "7.9%", "1.2%"],
  ["Google-Extended", "5", "1.3%", "4.1%", "4.5%", "6.3%", "1.1%"],
  ["Bytespider", "5", "1.3%", "4.7%", "5.6%", "7.9%", "1.1%"],
  ["Applebot-Extended", "5", "1.3%", "3.9%", "5.1%", "6.3%", "1.0%"],
  ["ClaudeBot", "4", "1.1%", "4.1%", "4.5%", "6.3%", "1.0%"],
  ["anthropic-ai", "4", "1.1%", "4.3%", "3.9%", "4.8%", "1.0%"],
  ["OAI-SearchBot", "0", "0.0%", "0.1%", "1.1%", "0.0%", "0.0%"],
  ["ChatGPT-User", "0", "0.0%", "0.0%", "1.1%", "0.0%", "0.1%"],
  ["Claude-SearchBot", "0", "0.0%", "0.0%", "1.1%", "0.0%", "0.0%"],
  ["PerplexityBot", "0", "0.0%", "0.0%", "1.1%", "0.0%", "0.1%"],
  ["Googlebot", "0", "0.0%", "0.0%", "0.0%", "0.0%", "0.0%"],
  ["Bingbot", "0", "0.0%", "0.0%", "0.0%", "0.0%", "0.0%"],
];

// [type, France, UK, Spain, Italy, Japan]  share of reachable sites whose home page JSON-LD contains the @type
const TYPES = [
  ["WebSite", "87.7%", "66.2%", "66.9%", "48.2%", "63.0%"],
  ["Organization", "77.3%", "56.1%", "60.5%", "42.7%", "54.4%"],
  ["WebPage", "74.1%", "60.4%", "60.5%", "45.5%", "34.4%"],
  ["SearchAction", "74.1%", "60.8%", "59.7%", "44.5%", "28.9%"],
  ["ImageObject", "73.8%", "55.0%", "60.1%", "44.5%", "38.3%"],
  ["BreadcrumbList", "53.6%", "44.3%", "39.9%", "31.8%", "43.4%"],
  ["ReadAction", "49.9%", "40.4%", "37.1%", "30.9%", "8.5%"],
  ["PostalAddress", "32.3%", "26.6%", "29.4%", "20.9%", "16.4%"],
  ["Person", "26.4%", "16.7%", "18.1%", "16.4%", "10.2%"],
  ["ProfessionalService", "15.3%", "12.1%", "14.5%", "6.4%", "5.6%"],
  ["ContactPoint", "15.1%", "12.5%", "15.7%", "9.1%", "6.5%"],
  ["GeoCoordinates", "13.6%", "13.6%", "17.3%", "10.9%", "3.7%"],
  ["FAQPage", "13.1%", "8.0%", "12.5%", "2.7%", "3.9%"],
  ["LocalBusiness", "12.6%", "10.5%", "10.1%", "11.8%", "5.4%"],
  ["Service", "9.4%", "6.7%", "11.3%", "4.5%", "3.5%"],
  ["AggregateRating", "6.2%", "5.2%", "6.9%", "9.1%", "0.2%"],
];

// [plugin, French WordPress sites (share), llms.txt count (share), JSON-LD, 6-item average]
const PLUGINS = [
  ["Yoast SEO", "209 (55.9%)", "54 (25.8%)", "100.0%", "5.03"],
  ["Rank Math", "78 (20.9%)", "29 (37.2%)", "100.0%", "5.28"],
  ["検出なし / none detected", "72 (19.3%)", "13 (18.1%)", "69.4%", "4.10"],
];

// [domain, reached, HTTP 202, llms.txt, JSON-LD, all 6, 6-item average]  French sites by the last label of the host name
const DOMAINS = [
  [".fr", "209", "2 (1.0%)", "21.5%", "91.4%", "18.2%", "4.72"],
  [".com", "143", "4 (2.8%)", "33.6%", "86.7%", "32.2%", "4.66"],
  ["その他 / other", "53", "1 (1.9%)", "26.4%", "94.3%", "24.5%", "4.85"],
];

// [score, France, UK, Spain, Italy, Japan]
const DIST = [
  ["0", "3.7%", "23.6%", "25.8%", "41.8%", "1.6%"],
  ["1", "0.5%", "1.9%", "2.4%", "4.5%", "4.8%"],
  ["2", "4.0%", "4.2%", "2.8%", "2.7%", "10.7%"],
  ["3", "2.7%", "3.1%", "0.8%", "1.8%", "15.4%"],
  ["4", "14.8%", "12.1%", "11.3%", "8.2%", "15.3%"],
  ["5", "50.4%", "37.4%", "29.4%", "23.6%", "41.8%"],
  ["6", "24.0%", "17.7%", "27.4%", "17.3%", "10.4%"],
];

const HEAD_JA = ["項目", "フランス", "英国", "スペイン", "イタリア", "日本", "フランス以外の海外"];
const HEAD_EN = ["Item", "France", "UK", "Spain", "Italy", "Japan", "Other overseas"];

export default {
  slug: "research-fr-web-agencies-ai-search-2026",
  targetQueries: [
    "フランス Web制作会社 AI検索 対応状況 調査",
    "フランス llms.txt 導入率",
    "French web design agencies AI search readiness survey",
    "llms.txt adoption France 2026",
    "agences web françaises recherche IA llms.txt étude",
    "agences web France robots.txt GPTBot blocage",
  ],
  related: ["research-uk-web-agencies-ai-search-2026", "research-us-web-agencies-ai-search-2026", "research-ca-web-agencies-ai-search-2026", "research-wordpress-vs-non-wordpress-2026", "research-japan-web-agencies-ai-search-2026", "llms-txt"],
  locales: {
    ja: {
      title: "フランスのWeb制作会社405社のAI検索対応を調査【2026年11月】 | Nurevo",
      description: "フランスのWeb制作会社の自社サイト405件を調査。6項目の平均4.71と JSON-LD 90.1%は17か国で最も高い値。llms.txt は26.4%（日本13.4%）、AIボットのブロックは1.9%でした。",
      h1: "フランスのWeb制作会社の自社サイト405件に見るAI検索への対応（2026年11月）",
      lead: "フランスのWeb制作会社の自社サイト405件のトップページ・robots.txt・llms.txt を調べたところ、AI検索に関わる6項目の平均は4.71、JSON-LD があるサイトは90.1%で、どちらも到達100件以上の17か国の中で最も高い値でした。llms.txt があったのは26.4%（107件）で、フランス以外の海外全体（26.4%）と同じ、日本（13.4%）の2.0倍です。robots.txt でAIボットをブロックしていたのは1.9%（7件）で、日本（1.3%）に次いで低く、検索用のボットをブロックしていたサイトはありませんでした。",
      intro: [
        "公開：2026年11月23日。データ：2026年11月12日集計。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策（AEO）のツールと WordPress プラグインを提供しており、この分野に利害があります。国別レポートの6本目です（これまでに[米国](/guide/research-us-web-agencies-ai-search-2026)・[英国](/guide/research-uk-web-agencies-ai-search-2026)・[オーストラリア](/guide/research-au-web-agencies-ai-search-2026)・[インド](/guide/research-in-web-agencies-ai-search-2026)・[カナダ](/guide/research-ca-web-agencies-ai-search-2026)）。英語版とフランス語版もあります。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "フランスのWeb制作会社の自社サイト405件では、AI検索に関わる6項目の平均が4.71、5項目以上を満たすサイトが74.3%、JSON-LD があるサイトが90.1%で、平均と JSON-LD は到達100件以上の17か国で最も高い値でした（英国は3.61・55.1%・68.8%、日本は4.05・52.2%・69.4%）。",
            "llms.txt があったのは26.4%（107件）。フランス以外の海外全体（26.4%）と同じで、英国（21.5%、p=0.06）・スペイン（31.9%、p=0.16）とも統計的な差は見られず、日本（13.4%）の2.0倍でした（p<0.001）。5項目を満たすサイト204件のうち196件（96.1%）は、欠けていた1項目が llms.txt でした。",
            "robots.txt があるサイト378件のうち、AIボットをブロックしていたのは1.9%（7件）で、17か国の中では日本（1.3%）に次いで低い値です。GPTBot をブロックしていた5件はすべて OAI-SearchBot を許可しており、検索用・質問時の取得に使われる4つのボットをブロックしていたサイトはありませんでした。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "対象：Web制作会社の自社サイト。当社の収集リストで国がフランスとなっている制作会社サイト821件のうち、トップページに到達できた405件です。一般企業のサイト全体ではありません。比較には同じ調査の英国（942件）・スペイン（248件）・イタリア（110件）・日本（2,486件）・フランス以外の海外（12,947件）を使いました。",
            "取得したもの：各サイトのトップページ、/robots.txt、/llms.txt、/llms-full.txt を1回ずつ（User-Agent：NurevoSurvey/1.0）。2026年11月上旬〜12日に取得し、11月12日に集計しました。",
            "判定方法：llms.txt は、ステータス200で中身がHTMLではなく20文字を超えるテキストを「あり」としました。JSON-LD はトップページにあるかどうか、「壊れている」は JSON として読み込めないブロックが1つ以上あるもの。Organization系は @type に Organization・LocalBusiness・Corporation・ProfessionalService を含むもの。WordPress はトップページのHTMLに wp-content/・wp-includes/、または generator の WordPress 表記があるもの。SEOプラグインはトップページのHTMLの文字列で判定しました。",
            "AIボットのブロック：robots.txt で、各ボットに当てはまるグループの規則がトップページ（/）を Disallow にするか（最長一致）で判定しました。分母は robots.txt があるサイトです。「AIボットをブロック」は GPTBot・ClaudeBot・PerplexityBot・Google-Extended・CCBot・OAI-SearchBot のどれかをブロックしているものです。",
            "「6項目」は、(1) llms.txt がある、(2) JSON-LD がある、(3) Organization または LocalBusiness の型がある、(4) robots.txt があり GPTBot・ClaudeBot・PerplexityBot・OAI-SearchBot のどれもブロックしていない、(5) meta description がある、(6) canonical がある、のうち当てはまる数（0〜6）です。この調査のための単純な数で、Nurevo の0〜100点のスコアとは別物です。",
            "HTTP 202：フランスでトップページがステータス202を返したのは7件（到達件数の1.7%）だけで、英国（14.9%）・イタリア（22.7%）・フランス以外の海外（11.4%）より少ない割合でした。202のページはほとんどの項目が「なし」になるため、国どうしの平均の比較に影響します。ステータス200のサイト（398件）だけで見ると、フランスは llms.txt 26.9%・6項目すべて24.4%・平均4.80で、米国の200のサイト（27.2%・22.3%）と差は見られませんでした（p=0.96・p=0.37）。",
            "統計：フランスと他の地域の差はカイ二乗検定で、件数が小さいAIボットのブロックはフィッシャーの正確検定で確かめました。30件未満の区分は載せていません。",
          ],
        },
        {
          heading: "結果：フランスと英国・スペイン・イタリア・日本の比較",
          paragraphs: [
            "フランスは、JSON-LD（90.1%）・Organization系の型（81.2%）・meta description（90.4%）・Open Graph（90.9%）・canonical（93.6%）・robots.txt（93.3%）が、フランス以外の海外より15〜20ポイント、英国より19〜22ポイント高い値でした。llms.txt（26.4%）は英国・スペイン・イタリアとの間に統計的な差は見られず、フランス以外の海外とも同じ値です（p=1.00）。「6項目すべて」（24.0%）は英国（17.7%、p=0.01）より高く、スペイン（27.4%、p=0.37）とは差が見られませんでした。日本と比べると、WordPress の割合（92.3%）と meta description（90.4%・90.7%、p=0.92）はほぼ同じで、llms.txt は2.0倍、JSON-LD は90.1%・69.4%、「6項目すべて」は2.3倍でした。",
            "フランスの高い値には、WordPress の割合が高いこと（92.3%、フランス以外の海外75.0%）と、202を返すサイトが少ないこと（1.7%）が関わっています。WordPress のサイトどうしで比べると、フランスの llms.txt は27.5%で、米国（30.1%、p=0.34）と差はなく、フランス以外の海外（33.3%）よりやや低い値でした（p=0.023）。「6項目すべて」は WordPress どうしでフランス25.9%・フランス以外の海外28.1%で差は見られません（p=0.39）。",
          ],
          table: {
            head: HEAD_JA,
            rows: COMPARE.map(([ja, , ...v]) => [ja, ...v]),
            caption: "Web制作会社の自社サイトで、トップページに到達できたもの。「AIボットをブロック」「AIボットに言及」の分母は robots.txt があるサイト（フランス378件・英国699件・スペイン178件・イタリア63件・日本2,281件・フランス以外の海外10,092件）。2026年11月12日集計。",
          },
        },
        {
          heading: "17か国の中での位置",
          paragraphs: [
            "到達できたサイトが100件以上ある17か国（日本を含む）を llms.txt の割合で並べました。フランスは llms.txt で7位、「6項目すべて」はシンガポール・インド・スペイン・フィリピン・ブラジル・南アフリカに次ぐ7位でした。6項目の平均（4.71）と JSON-LD（90.1%）は17か国で最も高く、AIボットのブロック率（1.9%）は日本（1.3%）に次いで2番目に低い値です。同じ欧州のスペインは llms.txt が高く（31.9%）、イタリアは202を返すサイトが多いこともあって平均が最も低い値（2.70）でした。国ごとの件数は収集リストによるもので、各国の制作会社全体の分布ではありません。",
          ],
          table: {
            head: ["国", "到達件数", "llms.txt", "6項目すべて", "6項目の平均", "JSON-LD", "AIボットをブロック"],
            rows: COUNTRIES.map(([ja, , ...v]) => [ja, ...v]),
            caption: "到達できたサイトが100件以上の国。llms.txt の割合の高い順。「AIボットをブロック」の分母は robots.txt があるサイト。2026年11月12日集計。",
          },
        },
        {
          heading: "ボット別のブロック率",
          paragraphs: [
            "フランスで robots.txt があるサイト378件について、ボットごとにトップページをブロックしている割合です。学習用とされるボット（CCBot・GPTBot・Google-Extended・Bytespider・Applebot-Extended・ClaudeBot・anthropic-ai）は1.1〜1.9%で、英国（3.9〜4.7%）・スペイン（3.9〜5.6%）・イタリア（4.8〜9.5%）より低く、日本（1.0〜1.2%）に近い値でした。検索用やユーザーの質問に答えるときに使われる OAI-SearchBot・ChatGPT-User・Claude-SearchBot・PerplexityBot、そして Googlebot・Bingbot をブロックしていたサイトはありませんでした。AIボットのブロック率（1.9%）は、英国・スペイン・イタリア・フランス以外の海外より低く（p=0.018・0.031・0.005・0.002）、日本との間に統計的な差は見られませんでした（p=0.34）。",
          ],
          table: {
            head: ["ボット", "フランス（件数）", "フランス", "英国", "スペイン", "イタリア", "日本"],
            rows: BOTS,
            caption: "分母は robots.txt があるサイト（フランス378件・英国699件・スペイン178件・イタリア63件・日本2,281件）。トップページ（/）に対する判定。フランス・イタリアの件数は小さい数です。",
          },
        },
        {
          heading: "ブロックの中身（事実）",
          list: [
            "GPTBot をブロックしていた5件は、すべて OAI-SearchBot をブロックしていませんでした。",
            "上の11種のAIボットのどれかをブロックしていた7件のうち4件は、GPTBot・ClaudeBot・anthropic-ai・Google-Extended・CCBot・Bytespider・Applebot-Extended の7つをまとめてブロックする同じ組み合わせでした。残りは CCBot だけ、GPTBot と CCBot、Google-Extended・CCBot・Bytespider・Applebot-Extended の組み合わせが1件ずつです。",
            "robots.txt でAIボットの名前を挙げていながら、どれもトップページをブロックしていないサイトが21件ありました（robots.txt があるサイトの5.6%）。",
            "AIボットをブロックしていた7件のうち3件には llms.txt もありました。",
            "robots.txt に Sitemap の行があったのは、robots.txt があるサイトの88.1%でした。",
          ],
        },
        {
          heading: "構造化データの型",
          paragraphs: [
            "トップページの JSON-LD に含まれる型は、フランスでは WebSite（87.7%）・Organization（77.3%）・WebPage（74.1%）・SearchAction（74.1%）・ImageObject（73.8%）が多く、上位の型は英国・スペイン・イタリアより高い値でした。これらは WordPress のSEOプラグインがよく出す型で、WordPress の割合の高さと合っています。日本と比べると、Person（26.4%・10.2%）・PostalAddress（32.3%・16.4%）・GeoCoordinates（13.6%・3.7%）・FAQPage（13.1%・3.9%）・AggregateRating（6.2%・0.2%）が高い値です。JSON-LD があるサイトのうち、JSON として読み込めないブロックがあったのは1.1%（4件）でした。",
          ],
          table: {
            head: ["@type", "フランス", "英国", "スペイン", "イタリア", "日本"],
            rows: TYPES,
            caption: "到達できたサイトのうち、トップページの JSON-LD にその型があった割合（入れ子の型も数えます）。フランス405件・英国942件・スペイン248件・イタリア110件・日本2,486件。",
          },
        },
        {
          heading: "WordPress とSEOプラグイン",
          paragraphs: [
            "フランスの制作会社サイトの92.3%（374件）が WordPress で、日本（92.3%）と同じ割合、英国（73.4%）・スペイン（67.3%）・イタリア（51.8%）より高い値でした。WordPress のサイトは llms.txt 27.5%、JSON-LD 94.1%、6項目の平均4.91 で、WordPress 以外の31件（うち7件が202）は llms.txt 4件・JSON-LD 13件・平均2.29でした。",
            "SEOプラグインは Yoast SEO が55.9%、Rank Math が20.9%で、英国（58.0%・20.7%）と似た構成です。AIOSEO（11件）と、フランスで開発されている SEOPress（4件）は30件未満のため表に載せていません。llms.txt があった割合は Rank Math 37.2%、Yoast SEO 25.8%、プラグインを検出できなかったサイト18.1%でした。この調査では llms.txt をプラグインで作ったのか手で置いたのかは見ていません。",
          ],
          table: {
            head: ["SEOプラグイン", "フランスの WordPress サイト", "llms.txt", "JSON-LD", "6項目の平均"],
            rows: PLUGINS.map(([p, ...v]) => [p.replace("検出なし / none detected", "検出なし"), ...v]),
            caption: "フランスの WordPress サイト374件。プラグインはトップページのHTMLの文字列で判定（Yoast → Rank Math → AIOSEO → SEOPress の順に最初に当てはまったもの）。30件未満の区分（AIOSEO・SEOPress）は省略。",
          },
        },
        {
          heading: ".fr と .com",
          paragraphs: [
            "フランスの制作会社サイトを、ドメインの末尾で分けました。到達405件のうち .fr が209件、.com が143件、それ以外が53件です。llms.txt（21.5%・33.6%）と「6項目すべて」（18.2%・32.2%）は .com が高く、統計的な差がありました（p=0.017・p=0.004）。JSON-LD（91.4%・86.7%、p=0.22）と6項目の平均（4.72・4.66）はほぼ同じです。差が生まれる理由（顧客層や制作体制など）は、この調査では分かりません。",
          ],
          table: {
            head: ["ドメイン", "到達件数", "HTTP 202", "llms.txt", "JSON-LD", "6項目すべて", "6項目の平均"],
            rows: DOMAINS.map(([d, ...v]) => [d.replace("その他 / other", "その他"), ...v]),
            caption: "フランスの到達405件を、ホスト名の末尾で分けたもの。HTTP 202 の割合はその区分の到達件数に対するもの。",
          },
        },
        {
          heading: "6項目の分布",
          paragraphs: [
            "フランスは「5項目」（50.4%）と「6項目」（24.0%）で74.3%を占め、「0項目」は3.7%でした。英国・スペイン・イタリアは「0項目」が23.6〜41.8%あり、その多くはステータス202を返したサイトです。日本は「0項目」が1.6%と少ない一方、3〜4項目の層が厚い（合わせて30.7%、フランス17.5%）形でした。",
          ],
          table: {
            head: ["当てはまる項目数", "フランス", "英国", "スペイン", "イタリア", "日本"],
            rows: DIST,
            caption: "到達できたサイトに占める割合。フランス405件、英国942件、スペイン248件、イタリア110件、日本2,486件。",
          },
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "この調査の数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。そのまま使える1文：",
          ],
          list: [
            "フランスのWeb制作会社の自社サイトの90.1%に JSON-LD があり、到達100件以上の17か国で最も高い割合だった（英国68.8%、日本69.4%）（Nurevo AEO 調査、2026年11月、405件）。",
            "フランスのWeb制作会社の自社サイトの26.4%に llms.txt があった（英国21.5%、スペイン31.9%、イタリア20.0%、日本13.4%）（Nurevo AEO 調査、2026年11月）。",
            "フランスのWeb制作会社の自社サイトで、AI検索に関わる6項目の平均は4.71で、17か国で最も高かった（Nurevo AEO 調査、2026年11月）。",
            "フランスのWeb制作会社の自社サイトで robots.txt でAIボットをブロックしていたのは1.9%で、検索用のボットをブロックしていたサイトは378件中0件だった（Nurevo AEO 調査、2026年11月）。",
            "フランスのWeb制作会社のサイトの92.3%が WordPress で、そのうち55.9%で Yoast SEO、20.9%で Rank Math が検出された（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "限界",
          list: [
            "対象はWeb制作会社の自社サイトで、一般企業のサイト全体ではありません。国は当社の収集リストの記載によるもので、フランスの制作会社全体を代表する標本ではありません。WordPress の割合が高い（92.3%）ことも、収集の経路による偏りの可能性があります。地域（レジオン）ごとの分析は行っていません。ボット別の件数などは小さい数です。",
            "トップページだけを見ています。robots.txt はトップページ（/）に対する判定で、一部のディレクトリだけのブロックや、ファイアウォール・CDN によるブロックは数えていません。llms.txt は有無だけを見て、中身の質は見ていません。",
            "各サイト1回の取得で、到達できなかったサイト（416件）は除いています。HTTP 202 を返した7件は、実際のトップページとは違うページを見ている可能性があります。",
            "SEOプラグインはHTMLの文字列による判定で、痕跡を消している場合や複数入っている場合は正しく分けられません。JavaScript で後から出す構造化データは数えていません。",
            "今回の数字は2026年11月12日の集計です。週ごとに取り直すため、次の集計では値が変わることがあります。",
          ],
        },
        {
          heading: "読み方（意見）",
          paragraphs: [
            "ここからは当社の解釈です。フランスの制作会社サイトは、構造化データ・meta description・canonical・robots.txt といった基本の項目がよくそろっている一方、llms.txt は他の海外と同じくらいで、5項目のサイトのほとんどが llms.txt だけ欠けていました。WordPress とSEOプラグインの普及が基本項目の高さに関わっている可能性がありますが、この調査は原因を確かめていません。AIボットのブロックは少数で、学習用のボットに限られていました。どのボットをブロックするかは各サイトの判断です。これらの項目がそろっていても、AIの回答に必ず出るわけではありません（[別の調査](/guide/aeo-signals-ai-answers-study)では、サイト側の項目と回答への登場に関係は見られませんでした）。",
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
        { q: "フランスの制作会社サイトはAI検索への対応が進んでいますか？", a: "基本の項目はよくそろっています。JSON-LD 90.1%、6項目の平均4.71で、どちらも到達100件以上の17か国で最も高い値でした。llms.txt は26.4%で、フランス以外の海外（26.4%）と同じでした（2026年11月、制作会社の自社サイト）。" },
        { q: "日本と比べるとどうですか？", a: "WordPress の割合（92.3%）と meta description（90.4%・90.7%）はほぼ同じでした。llms.txt は日本の2.0倍（26.4%・13.4%）、JSON-LD は90.1%・69.4%、6項目すべては2.3倍（24.0%・10.4%）です。" },
        { q: "フランスではAIクローラーをブロックするサイトが多いですか？", a: "少数です。robots.txt があるサイトの1.9%（7件）で、日本（1.3%）に次いで低い値でした。すべて学習用のボットで、検索用の OAI-SearchBot・ChatGPT-User・Claude-SearchBot・PerplexityBot をブロックしていたサイトはありませんでした。" },
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
      title: "AI Search Readiness of 405 French Web Agency Websites (2026) | Nurevo",
      description: "405 French web agency sites: 90.1% have JSON-LD and the 6-item average is 4.71, both the highest of 17 countries. 26.4% have an llms.txt; 1.9% block AI bots.",
      h1: "AI search readiness of French web design agencies: 405 agency websites (November 2026)",
      lead: "We fetched the home page, robots.txt and llms.txt of 405 French web design agencies' own websites. They averaged 4.71 of six AI-search items and 90.1% had JSON-LD structured data — both the highest among the 17 countries with 100+ sites in our survey. 26.4% (107 sites) had an llms.txt, exactly the same as all other overseas agencies (26.4%) and 2.0 times Japan (13.4%). Only 1.9% (7 sites) blocked an AI bot in robots.txt, the second-lowest rate after Japan (1.3%), and none blocked a search crawler.",
      intro: [
        "Published 23 November 2026. Data aggregated 12 November 2026. Research and writing: Nurevo AEO (Bestie.合同会社, Japan). Nurevo sells AI search optimisation (AEO) tools and a WordPress plugin, so we have an interest in this topic. This is the sixth of our country reports (after the [US](/guide/research-us-web-agencies-ai-search-2026), the [UK](/guide/research-uk-web-agencies-ai-search-2026), [Australia](/guide/research-au-web-agencies-ai-search-2026), [India](/guide/research-in-web-agencies-ai-search-2026) and [Canada](/guide/research-ca-web-agencies-ai-search-2026)). A French version is also available.",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "French web agency websites (405 reached) averaged 4.71 of six AI-search items, 74.3% met five or more, and 90.1% had JSON-LD. The average and the JSON-LD share were the highest of the 17 countries with 100+ reached sites (UK: 3.61, 55.1%, 68.8%; Japan: 4.05, 52.2%, 69.4%).",
            "26.4% (107 sites) had an llms.txt — the same as all other overseas agencies (26.4%), with no statistically significant difference from the UK (21.5%, p=0.06) or Spain (31.9%, p=0.16), and 2.0 times Japan (13.4%, p<0.001). Of the 204 sites meeting five items, 196 (96.1%) were missing only the llms.txt.",
            "Of the 378 sites with a robots.txt, 1.9% (7) blocked an AI bot — second-lowest of the 17 countries after Japan (1.3%). All 5 sites blocking GPTBot still allowed OAI-SearchBot, and no site blocked any of the four bots used for search or for fetching pages when a user asks.",
          ],
        },
        {
          heading: "Methodology",
          list: [
            "Population: web design agencies' own websites. Of 821 agency sites listed as France in our collection list, 405 home pages were reachable. This is not a sample of all French businesses. For comparison we use the UK (942), Spain (248), Italy (110), Japan (2,486) and all other overseas sites excluding France (12,947) from the same survey.",
            "What we fetched: each site's home page, /robots.txt, /llms.txt and /llms-full.txt, once each (User-Agent: NurevoSurvey/1.0), between early November and 12 November 2026; aggregated on 12 November.",
            "How we judged: llms.txt counts if it returned status 200 with non-HTML text longer than 20 characters. JSON-LD means at least one block on the home page; \"broken\" means at least one block that does not parse as JSON. Organization-type means an @type containing Organization, LocalBusiness, Corporation or ProfessionalService. WordPress means wp-content/, wp-includes/ or a WordPress generator tag in the home page HTML. SEO plugins were identified from strings in the home page HTML.",
            "AI bot blocking: whether the robots.txt group that applies to each bot disallows the home page (/), using longest match. The base is sites with a robots.txt. \"Blocks an AI bot\" means blocking any of GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot or OAI-SearchBot.",
            "The \"six items\" are: (1) has an llms.txt, (2) has JSON-LD, (3) has an Organization or LocalBusiness type, (4) has a robots.txt that blocks none of GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot, (5) has a meta description, (6) has a canonical link. It is a simple count (0–6) for this survey, not Nurevo's 0–100 score.",
            "HTTP 202: only 7 French home pages answered with status 202 (1.7% of reached), far fewer than the UK (14.9%), Italy (22.7%) or other overseas sites (11.4%). A 202 page scores \"no\" on almost everything, which affects country averages. Among the 398 French sites that answered 200, llms.txt was 26.9%, all six items 24.4% and the average 4.80 — no significant difference from US sites that answered 200 (27.2%, 22.3%; p=0.96, p=0.37).",
            "Statistics: differences were tested with chi-square tests, and AI bot blocking (small counts) with Fisher's exact test. Groups with fewer than 30 sites are not shown.",
          ],
        },
        {
          heading: "Results: France vs the UK, Spain, Italy and Japan",
          paragraphs: [
            "France was 15–20 points higher than other overseas sites, and 19–22 points higher than the UK, on JSON-LD (90.1%), Organization-type markup (81.2%), meta descriptions (90.4%), Open Graph (90.9%), canonical links (93.6%) and robots.txt (93.3%). On llms.txt (26.4%) there was no significant difference from the UK, Spain or Italy, and it equalled other overseas sites (p=1.00). The share meeting all six items (24.0%) was higher than the UK (17.7%, p=0.01) and not different from Spain (27.4%, p=0.37). Compared with Japan, the WordPress share (92.3%) and meta descriptions (90.4% vs 90.7%, p=0.92) were almost identical, while llms.txt was 2.0 times higher, JSON-LD 90.1% vs 69.4%, and all six items 2.3 times higher.",
            "France's high figures go with a high WordPress share (92.3% vs 75.0% for other overseas sites) and few 202 responses (1.7%). Comparing WordPress sites only, France's llms.txt share (27.5%) did not differ from the US (30.1%, p=0.34) and was a little lower than other overseas WordPress sites (33.3%, p=0.023); all six items did not differ (25.9% vs 28.1%, p=0.39).",
          ],
          table: {
            head: HEAD_EN,
            rows: COMPARE.map(([, en, ...v]) => [en, ...v]),
            caption: "Web design agencies' own websites whose home page was reachable. Base for AI bot blocking and mentions: sites with a robots.txt (France 378, UK 699, Spain 178, Italy 63, Japan 2,281, other overseas 10,092). Aggregated 12 November 2026.",
          },
        },
        {
          heading: "France among 17 countries",
          paragraphs: [
            "The 17 countries (Japan included) with 100 or more reached sites, ranked by llms.txt. France was 7th on llms.txt and 7th on all six items, behind Singapore, India, Spain, the Philippines, Brazil and South Africa. Its six-item average (4.71) and JSON-LD share (90.1%) were the highest of all 17, and its AI bot blocking rate (1.9%) the second-lowest after Japan (1.3%). Within Europe, Spain had a higher llms.txt share (31.9%), while Italy — where many sites answered 202 — had the lowest average (2.70). Country counts reflect our collection list, not the distribution of agencies in each country.",
          ],
          table: {
            head: ["Country", "Reached", "llms.txt", "All 6 items", "6-item average", "JSON-LD", "Blocks an AI bot"],
            rows: COUNTRIES.map(([, en, ...v]) => [en, ...v]),
            caption: "Countries with 100+ reached sites, by llms.txt share. Base for AI bot blocking: sites with a robots.txt. Aggregated 12 November 2026.",
          },
        },
        {
          heading: "Blocking by bot",
          paragraphs: [
            "Share of the 378 French sites with a robots.txt that block each bot from the home page. Bots described as training crawlers (CCBot, GPTBot, Google-Extended, Bytespider, Applebot-Extended, ClaudeBot, anthropic-ai) were blocked by 1.1–1.9%, lower than the UK (3.9–4.7%), Spain (3.9–5.6%) and Italy (4.8–9.5%) and close to Japan (1.0–1.2%). No French site blocked OAI-SearchBot, ChatGPT-User, Claude-SearchBot or PerplexityBot — the bots used for search and for fetching pages when a user asks — nor Googlebot or Bingbot. France's AI bot blocking rate (1.9%) was lower than the UK, Spain, Italy and other overseas sites (p=0.018, 0.031, 0.005, 0.002) and not significantly different from Japan (p=0.34).",
          ],
          table: {
            head: ["Bot", "France (sites)", "France", "UK", "Spain", "Italy", "Japan"],
            rows: BOTS,
            caption: "Base: sites with a robots.txt (France 378, UK 699, Spain 178, Italy 63, Japan 2,281). Judged for the home page (/). Counts for France and Italy are small.",
          },
        },
        {
          heading: "What the blocking looks like (facts)",
          list: [
            "All 5 sites that blocked GPTBot did not block OAI-SearchBot.",
            "Of the 7 sites blocking any of the 11 AI bots above, 4 used the same set of seven: GPTBot, ClaudeBot, anthropic-ai, Google-Extended, CCBot, Bytespider and Applebot-Extended. The others blocked CCBot only, GPTBot and CCBot, or Google-Extended, CCBot, Bytespider and Applebot-Extended (one site each).",
            "21 sites (5.6% of those with a robots.txt) named an AI bot in robots.txt without blocking the home page for any of them.",
            "3 of the 7 sites blocking an AI bot also had an llms.txt.",
            "88.1% of robots.txt files included a Sitemap line.",
          ],
        },
        {
          heading: "Structured data types",
          paragraphs: [
            "The most common JSON-LD types on French agency home pages were WebSite (87.7%), Organization (77.3%), WebPage (74.1%), SearchAction (74.1%) and ImageObject (73.8%), each higher than in the UK, Spain and Italy. These are types WordPress SEO plugins commonly output, consistent with the high WordPress share. Compared with Japan, Person (26.4% vs 10.2%), PostalAddress (32.3% vs 16.4%), GeoCoordinates (13.6% vs 3.7%), FAQPage (13.1% vs 3.9%) and AggregateRating (6.2% vs 0.2%) were higher. 1.1% of French sites with JSON-LD (4 sites) had a block that did not parse.",
          ],
          table: {
            head: ["@type", "France", "UK", "Spain", "Italy", "Japan"],
            rows: TYPES,
            caption: "Share of reachable sites whose home page JSON-LD contains the type (nested types included). France 405, UK 942, Spain 248, Italy 110, Japan 2,486.",
          },
        },
        {
          heading: "WordPress and SEO plugins",
          paragraphs: [
            "92.3% of French agency sites (374) ran WordPress — the same share as Japan (92.3%) and higher than the UK (73.4%), Spain (67.3%) and Italy (51.8%). WordPress sites had llms.txt 27.5%, JSON-LD 94.1% and a six-item average of 4.91; the 31 non-WordPress sites (7 of which answered 202) had 4 llms.txt files, 13 with JSON-LD and an average of 2.29.",
            "Yoast SEO was detected on 55.9% and Rank Math on 20.9% of French WordPress sites, a mix similar to the UK (58.0%, 20.7%). AIOSEO (11 sites) and the French-developed SEOPress (4 sites) are below 30 sites and not shown. llms.txt was present on 37.2% of Rank Math sites, 25.8% of Yoast SEO sites and 18.1% of sites with no plugin detected. We did not check whether an llms.txt was generated by a plugin or placed by hand.",
          ],
          table: {
            head: ["SEO plugin", "French WordPress sites", "llms.txt", "JSON-LD", "6-item average"],
            rows: PLUGINS.map(([p, ...v]) => [p.replace("検出なし / none detected", "None detected"), ...v]),
            caption: "374 French WordPress sites. Plugin identified from home page HTML strings (first match in the order Yoast → Rank Math → AIOSEO → SEOPress). Groups under 30 sites (AIOSEO, SEOPress) omitted.",
          },
        },
        {
          heading: ".fr vs .com",
          paragraphs: [
            "We split French agency sites by the last label of the host name: of 405 reached, 209 were .fr, 143 .com and 53 other. .com sites were more likely to have an llms.txt (33.6% vs 21.5%) and to meet all six items (32.2% vs 18.2%), both statistically significant (p=0.017, p=0.004). JSON-LD (91.4% vs 86.7%, p=0.22) and the six-item average (4.72 vs 4.66) were about the same. This survey cannot tell why (client base, how agencies build sites, or something else).",
          ],
          table: {
            head: ["Domain", "Reached", "HTTP 202", "llms.txt", "JSON-LD", "All 6 items", "6-item average"],
            rows: DOMAINS.map(([d, ...v]) => [d.replace("その他 / other", "Other"), ...v]),
            caption: "The 405 reached French sites by the last label of the host name. HTTP 202 share is of the group's reached sites.",
          },
        },
        {
          heading: "Distribution of the six items",
          paragraphs: [
            "In France, five items (50.4%) and six items (24.0%) together made up 74.3% of sites, and only 3.7% scored zero. In the UK, Spain and Italy 23.6–41.8% scored zero, mostly sites that answered 202. Japan had few zeros (1.6%) but a thicker middle at three to four items (30.7% combined, France 17.5%).",
          ],
          table: {
            head: ["Items met", "France", "UK", "Spain", "Italy", "Japan"],
            rows: DIST,
            caption: "Share of reachable sites. France 405, UK 942, Spain 248, Italy 110, Japan 2,486.",
          },
        },
        {
          heading: "Citing this research",
          paragraphs: [
            "You may freely quote and republish the figures and tables in this survey, provided you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. Ready-to-use sentences:",
          ],
          list: [
            "90.1% of French web design agencies' own websites had JSON-LD structured data, the highest of 17 countries surveyed (UK 68.8%, Japan 69.4%) (Nurevo AEO survey, November 2026, 405 sites).",
            "26.4% of French web design agencies' own websites had an llms.txt file (UK 21.5%, Spain 31.9%, Italy 20.0%, Japan 13.4%) (Nurevo AEO survey, November 2026).",
            "French web agency websites averaged 4.71 of six AI-search readiness items, the highest of 17 countries surveyed (Nurevo AEO survey, November 2026).",
            "1.9% of French web agency websites blocked an AI bot in robots.txt, and none of 378 blocked a search crawler (Nurevo AEO survey, November 2026).",
            "92.3% of French web agency websites ran WordPress; of those, 55.9% used Yoast SEO and 20.9% Rank Math (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Limitations",
          list: [
            "The population is web design agencies' own websites, not all businesses. Country comes from our collection list, which is not a representative sample of French agencies; the high WordPress share (92.3%) may partly reflect how the list was collected. We did not analyse regions. Some counts (for example per bot) are small.",
            "Only home pages were checked. robots.txt was judged for the home page (/), so partial-directory blocks and firewall or CDN blocking are not counted. We checked whether an llms.txt exists, not its quality.",
            "Each site was fetched once; unreachable sites (416) are excluded. The 7 sites that answered 202 may have shown us something other than their real home page.",
            "SEO plugins were identified from HTML strings, so sites that hide traces or run several plugins may be misclassified. Structured data added later by JavaScript is not counted.",
            "Figures are from the 12 November 2026 aggregation. We re-run the survey weekly, so later figures may differ.",
          ],
        },
        {
          heading: "How to read this (opinion)",
          paragraphs: [
            "This section is our interpretation. French agency sites have the basics — structured data, meta descriptions, canonical links, robots.txt — in place unusually often, while llms.txt adoption is at the overseas average, and almost every five-item site lacked only an llms.txt. The spread of WordPress and SEO plugins may be part of the reason, but this survey does not test cause. AI bot blocking is rare and limited to training crawlers; which bots to block is each site owner's decision. None of this guarantees appearing in AI answers (in [another of our studies](/guide/aeo-signals-ai-answers-study), on-site signals showed no relationship with appearance).",
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
        { q: "Are French agencies ahead on AI search readiness?", a: "On the basics, yes: 90.1% had JSON-LD and the six-item average was 4.71, both the highest of 17 countries. llms.txt (26.4%) was exactly the overseas average (November 2026, agencies' own websites)." },
        { q: "How does France compare with Japan?", a: "The WordPress share (92.3%) and meta descriptions (90.4% vs 90.7%) were almost identical. France had 2.0 times Japan's llms.txt share (26.4% vs 13.4%), more JSON-LD (90.1% vs 69.4%) and 2.3 times the share meeting all six items (24.0% vs 10.4%)." },
        { q: "Do many French sites block AI crawlers?", a: "Very few: 1.9% of sites with a robots.txt (7 sites), the second-lowest after Japan. All targeted training crawlers; none blocked OAI-SearchBot, ChatGPT-User, Claude-SearchBot or PerplexityBot." },
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
