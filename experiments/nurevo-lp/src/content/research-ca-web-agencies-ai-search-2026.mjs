// Content page: research report (country report: Canada). AI search readiness
// of Canadian web design agencies' own websites, compared with the US, the UK,
// Australia, Japan and other overseas agencies. November 2026.
//
// Every number here comes from nurevo-outreach data/survey/raw_2026-11-12.json
// (survey.js; the same run as summary_2026-11-12.json — the Canadian totals
// match summary.byCountry.CA: 908 reached, llms.txt 22.9%, JSON-LD 68.1%,
// WordPress 71.6%, AI bot blocked 3.5%, 6-item average 3.6). Country = the
// "co" field of our collection list (CA; 1,335 listed). Do not add a figure
// that is not in that data. The raw file holds company names and domains:
// never publish them. Definitions follow survey.js (see the US report).
// HTTP 202: 122 Canadian home pages answered 202 (13.4% of reached; US 15.0%,
// UK 14.9%, AU 14.5%). HTTP-200-only values are given in the text.
// "Other overseas" = all non-Japan sites except Canada (12,444 reached).
// Country ranking = the 17 countries (Japan included) with 100+ reached sites.
// Groups under 30 sites are not shown (SEOPress: 3 Canadian WordPress sites).
// Chi-square, Canada vs US: llms.txt p=0.95, all 6 p=1.00, JSON-LD p=0.62,
// FAQPage p=0.048, AI bot blocking p=0.38. vs UK: llms.txt p=0.52, all 6
// p=0.54, blocking p=0.31. vs AU: llms.txt p=0.45, all 6 p=0.29, blocking
// p=0.25. vs Japan: llms.txt, all 6, FAQPage, blocking p<0.001; JSON-LD
// p=0.47. vs other overseas: llms.txt p=0.016, all 6 p=0.034, JSON-LD
// p=0.007, blocking p=0.06.
// HTTP 200 only, Canada vs US: llms.txt 26.5% vs 27.2% (p=0.73), all 6 21.9%
// vs 22.3% (p=0.85). WordPress only: Canada llms.txt 30.8%, US 30.1% (p=0.77),
// Japan 14.0% (p<0.001).
// Domain split (.ca 301 reached / .com 499 / other 108): llms.txt 20.3% vs
// 24.4% (p=0.20), all 6 16.3% vs 20.0% (p=0.22), JSON-LD 62.8% vs 70.3%
// (p=0.03), HTTP 202 14.6% vs 12.6% (p=0.49); HTTP 200 only llms.txt 23.7% vs
// 28.0% (p=0.26).
// French translation: src/content/research-ca-web-agencies-ai-search-2026/fr.json

// [ja label, en label, Canada, US, UK, Australia, Japan, other overseas (excl. Canada)]
const COMPARE = [
  ["到達件数", "Sites reached", "908", "4,472", "942", "1,719", "2,486", "12,444"],
  ["WordPress", "WordPress", "71.6%", "74.5%", "73.4%", "76.0%", "92.3%", "75.8%"],
  ["llms.txt", "llms.txt", "22.9%", "23.1%", "21.5%", "24.3%", "13.4%", "26.6%"],
  ["llms-full.txt", "llms-full.txt", "1.5%", "1.5%", "1.3%", "1.6%", "0.6%", "1.8%"],
  ["JSON-LD", "JSON-LD", "68.1%", "69.0%", "68.8%", "71.3%", "69.4%", "72.3%"],
  ["JSON-LD が壊れている（JSON-LD があるサイト中）", "Broken JSON-LD (of sites with JSON-LD)", "1.1%", "1.6%", "2.0%", "2.1%", "1.7%", "1.9%"],
  ["Organization系の型", "Organization-type", "60.7%", "59.4%", "59.6%", "62.2%", "58.9%", "63.8%"],
  ["FAQPage", "FAQPage", "8.0%", "6.2%", "8.0%", "10.3%", "3.9%", "9.5%"],
  ["microdata（schema.org）", "Microdata (schema.org)", "17.5%", "19.1%", "16.9%", "19.1%", "7.8%", "19.8%"],
  ["meta description", "Meta description", "67.3%", "68.0%", "69.3%", "70.2%", "90.7%", "71.8%"],
  ["Open Graph", "Open Graph", "68.0%", "69.1%", "69.1%", "72.4%", "81.3%", "72.7%"],
  ["canonical", "Canonical link", "71.3%", "74.3%", "72.7%", "75.9%", "84.6%", "76.8%"],
  ["robots.txt", "robots.txt", "72.7%", "76.1%", "74.2%", "77.7%", "91.8%", "78.8%"],
  ["AIボットをブロック（robots.txt があるサイト中）", "Blocks an AI bot (of sites with robots.txt)", "3.5%", "4.3%", "4.7%", "4.7%", "1.3%", "5.2%"],
  ["robots.txt でAIボットに言及", "robots.txt names an AI bot", "9.8%", "8.8%", "9.3%", "10.7%", "2.5%", "11.9%"],
  ["6項目の平均", "6-item average", "3.58", "3.65", "3.61", "3.77", "4.05", "3.84"],
  ["5項目以上", "5+ items", "55.2%", "54.6%", "55.1%", "56.7%", "52.2%", "58.4%"],
  ["6項目すべて", "All 6 items", "18.9%", "18.9%", "17.7%", "20.8%", "10.4%", "22.0%"],
];

// [ja name, en name, reached, llms.txt, all 6, 6-item average, AI bot blocked]  17 countries with 100+ reached sites, by llms.txt
const COUNTRIES = [
  ["シンガポール", "Singapore", "641", "38.8%", "32.4%", "4.36", "5.7%"],
  ["インド", "India", "1,554", "36.6%", "29.9%", "4.53", "5.8%"],
  ["ブラジル", "Brazil", "261", "34.1%", "25.3%", "4.11", "5.5%"],
  ["スペイン", "Spain", "248", "31.9%", "27.4%", "3.67", "5.6%"],
  ["フィリピン", "Philippines", "241", "31.5%", "27.0%", "4.27", "7.2%"],
  ["南アフリカ", "South Africa", "389", "29.3%", "24.4%", "3.90", "7.5%"],
  ["フランス", "France", "405", "26.4%", "24.0%", "4.71", "1.9%"],
  ["ニュージーランド", "New Zealand", "417", "25.4%", "20.9%", "3.80", "5.8%"],
  ["オーストラリア", "Australia", "1,719", "24.3%", "20.8%", "3.77", "4.7%"],
  ["オランダ", "Netherlands", "127", "23.6%", "18.9%", "3.66", "7.6%"],
  ["米国", "United States", "4,472", "23.1%", "18.9%", "3.65", "4.3%"],
  ["カナダ", "Canada", "908", "22.9%", "18.9%", "3.58", "3.5%"],
  ["英国", "United Kingdom", "942", "21.5%", "17.7%", "3.61", "4.7%"],
  ["メキシコ", "Mexico", "116", "20.7%", "18.1%", "3.06", "4.1%"],
  ["イタリア", "Italy", "110", "20.0%", "17.3%", "2.70", "9.5%"],
  ["アイルランド", "Ireland", "266", "19.5%", "17.3%", "3.28", "3.3%"],
  ["日本", "Japan", "2,486", "13.4%", "10.4%", "4.05", "1.3%"],
];

// [bot, Canada blocked, Canada %, US %, UK %, Australia %, Japan %]  base = sites with robots.txt (Canada 660 / US 3,404 / UK 699 / Australia 1,336 / Japan 2,281)
const BOTS = [
  ["CCBot", "23", "3.5%", "4.1%", "4.6%", "4.3%", "1.1%"],
  ["Bytespider", "21", "3.2%", "4.1%", "4.7%", "4.2%", "1.1%"],
  ["Google-Extended", "20", "3.0%", "3.6%", "4.1%", "3.8%", "1.1%"],
  ["GPTBot", "19", "2.9%", "3.8%", "4.0%", "4.2%", "1.2%"],
  ["Applebot-Extended", "17", "2.6%", "3.3%", "3.9%", "3.6%", "1.0%"],
  ["ClaudeBot", "16", "2.4%", "3.5%", "4.1%", "3.8%", "1.0%"],
  ["anthropic-ai", "16", "2.4%", "3.4%", "4.3%", "3.4%", "1.0%"],
  ["ChatGPT-User", "1", "0.2%", "0.4%", "0.0%", "0.3%", "0.1%"],
  ["PerplexityBot", "1", "0.2%", "0.3%", "0.0%", "0.1%", "0.1%"],
  ["OAI-SearchBot", "0", "0.0%", "0.3%", "0.1%", "0.1%", "0.0%"],
  ["Claude-SearchBot", "0", "0.0%", "0.3%", "0.0%", "0.1%", "0.0%"],
  ["Googlebot", "0", "0.0%", "0.1%", "0.0%", "0.1%", "0.0%"],
  ["Bingbot", "0", "0.0%", "0.1%", "0.0%", "0.0%", "0.0%"],
];

// [type, Canada, US, UK, Australia, Japan]  share of reachable sites whose home page JSON-LD contains the @type
const TYPES = [
  ["WebSite", "64.8%", "65.7%", "66.2%", "68.4%", "63.0%"],
  ["WebPage", "57.8%", "59.3%", "60.4%", "61.9%", "34.4%"],
  ["Organization", "56.9%", "55.4%", "56.1%", "58.8%", "54.4%"],
  ["SearchAction", "55.3%", "56.8%", "60.8%", "59.7%", "28.9%"],
  ["ImageObject", "55.2%", "54.5%", "55.0%", "57.4%", "38.3%"],
  ["BreadcrumbList", "41.4%", "44.5%", "44.3%", "43.5%", "43.4%"],
  ["PostalAddress", "26.2%", "24.3%", "26.6%", "28.7%", "16.4%"],
  ["Person", "16.3%", "15.6%", "16.7%", "16.9%", "10.2%"],
  ["ContactPoint", "14.1%", "12.5%", "12.5%", "14.7%", "6.5%"],
  ["LocalBusiness", "11.8%", "12.2%", "10.5%", "14.2%", "5.4%"],
  ["ProfessionalService", "11.2%", "10.1%", "12.1%", "13.6%", "5.6%"],
  ["GeoCoordinates", "11.0%", "12.1%", "13.6%", "14.4%", "3.7%"],
  ["FAQPage", "8.0%", "6.2%", "8.0%", "10.3%", "3.9%"],
  ["Service", "7.8%", "6.6%", "6.7%", "7.6%", "3.5%"],
  ["AggregateRating", "4.0%", "4.6%", "5.2%", "6.9%", "0.2%"],
];

// [plugin, Canadian WordPress sites (share), llms.txt count (share), JSON-LD, 6-item average]
const PLUGINS = [
  ["Yoast SEO", "349 (53.7%)", "95 (27.2%)", "98.0%", "4.88"],
  ["Rank Math", "139 (21.4%)", "51 (36.7%)", "98.6%", "5.24"],
  ["AIOSEO", "46 (7.1%)", "19 (41.3%)", "97.8%", "5.24"],
  ["検出なし / none detected", "113 (17.4%)", "34 (30.1%)", "69.9%", "4.19"],
];

// [domain, reached, HTTP 202, llms.txt, JSON-LD, all 6, 6-item average]  Canadian sites by the last label of the host name
const DOMAINS = [
  [".ca", "301", "44 (14.6%)", "20.3%", "62.8%", "16.3%", "3.32"],
  [".com", "499", "63 (12.6%)", "24.4%", "70.3%", "20.0%", "3.70"],
  ["その他 / other", "108", "15 (13.9%)", "23.1%", "72.2%", "21.3%", "3.79"],
];

// [score, Canada, US, UK, Australia, Japan]
const DIST = [
  ["0", "24.3%", "22.1%", "23.6%", "20.7%", "1.6%"],
  ["1", "2.4%", "2.5%", "1.9%", "2.5%", "4.8%"],
  ["2", "4.0%", "4.3%", "4.2%", "3.8%", "10.7%"],
  ["3", "3.1%", "3.6%", "3.1%", "3.0%", "15.4%"],
  ["4", "11.0%", "12.8%", "12.1%", "13.4%", "15.3%"],
  ["5", "36.2%", "35.7%", "37.4%", "35.9%", "41.8%"],
  ["6", "18.9%", "18.9%", "17.7%", "20.8%", "10.4%"],
];

const HEAD_JA = ["項目", "カナダ", "米国", "英国", "オーストラリア", "日本", "カナダ以外の海外"];
const HEAD_EN = ["Item", "Canada", "US", "UK", "Australia", "Japan", "Other overseas"];

export default {
  slug: "research-ca-web-agencies-ai-search-2026",
  targetQueries: [
    "カナダ Web制作会社 AI検索 対応状況 調査",
    "カナダ llms.txt 導入率",
    "Canadian web design agencies AI search readiness survey",
    "llms.txt adoption Canada 2026",
    "Canadian websites blocking AI crawlers robots.txt GPTBot",
    "agences web Canada recherche IA llms.txt",
  ],
  related: ["research-us-web-agencies-ai-search-2026", "research-uk-web-agencies-ai-search-2026", "research-au-web-agencies-ai-search-2026", "research-in-web-agencies-ai-search-2026", "research-japan-web-agencies-ai-search-2026", "llms-txt"],
  locales: {
    ja: {
      title: "カナダのWeb制作会社908社のAI検索対応を調査【2026年11月】 | Nurevo",
      description: "カナダのWeb制作会社の自社サイト908件を調査。llms.txt は22.9%（米国23.1%・日本13.4%）、6項目すべて満たすサイトは18.9%で米国と同じ値。AIボットのブロックは3.5%でした。",
      h1: "カナダのWeb制作会社の自社サイト908件に見るAI検索への対応（2026年11月）",
      lead: "カナダのWeb制作会社の自社サイト908件のトップページ・robots.txt・llms.txt を調べたところ、llms.txt があったのは22.9%（208件）で、米国（23.1%）・英国（21.5%）・オーストラリア（24.3%）とほぼ同じ、日本（13.4%）の1.7倍でした。AI検索に関わる6項目をすべて満たすサイトは18.9%で、米国と同じ値です。robots.txt でAIボットをブロックしていたのは3.5%で、GPTBot をブロックしていた19件はすべて ChatGPT の検索用ボット（OAI-SearchBot）をブロックしていませんでした。",
      intro: [
        "公開：2026年11月22日。データ：2026年11月12日集計。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策（AEO）のツールと WordPress プラグインを提供しており、この分野に利害があります。国別レポートの5本目です（これまでに[米国](/guide/research-us-web-agencies-ai-search-2026)・[英国](/guide/research-uk-web-agencies-ai-search-2026)・[オーストラリア](/guide/research-au-web-agencies-ai-search-2026)・[インド](/guide/research-in-web-agencies-ai-search-2026)）。英語版とフランス語版もあります。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "カナダのWeb制作会社の自社サイト908件のうち、llms.txt があったのは22.9%（208件）。米国（23.1%、p=0.95）・英国（21.5%、p=0.52）・オーストラリア（24.3%、p=0.45）と差は見られず、日本（13.4%）の1.7倍でした（p<0.001）。",
            "AI検索に関わる6項目をすべて満たすサイトは18.9%（172件）で米国と同じ値、6項目の平均は3.58でした。到達100件以上の17か国の中では llms.txt が12位で、英語圏の米国・英国・オーストラリアと同じ中位にいます。",
            "robots.txt があるサイト660件のうち、AIボットをブロックしていたのは3.5%（23件、米国4.3%・日本1.3%）。GPTBot をブロックしていた19件はすべて OAI-SearchBot を許可しており、検索用・質問時の取得に使われる4つのボットのどれかをブロックしていたのは1件（0.2%）でした。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "対象：Web制作会社の自社サイト。当社の収集リストで国がカナダとなっている制作会社サイト1,335件のうち、トップページに到達できた908件です。一般企業のサイト全体ではありません。比較には同じ調査の米国（4,472件）・英国（942件）・オーストラリア（1,719件）・日本（2,486件）・カナダ以外の海外（12,444件）を使いました。",
            "取得したもの：各サイトのトップページ、/robots.txt、/llms.txt、/llms-full.txt を1回ずつ（User-Agent：NurevoSurvey/1.0）。2026年11月上旬〜12日に取得し、11月12日に集計しました。",
            "判定方法：llms.txt は、ステータス200で中身がHTMLではなく20文字を超えるテキストを「あり」としました。JSON-LD はトップページにあるかどうか、「壊れている」は JSON として読み込めないブロックが1つ以上あるもの。Organization系は @type に Organization・LocalBusiness・Corporation・ProfessionalService を含むもの。WordPress はトップページのHTMLに wp-content/・wp-includes/、または generator の WordPress 表記があるもの。SEOプラグインはトップページのHTMLの文字列で判定しました。",
            "AIボットのブロック：robots.txt で、各ボットに当てはまるグループの規則がトップページ（/）を Disallow にするか（最長一致）で判定しました。分母は robots.txt があるサイトです。「AIボットをブロック」は GPTBot・ClaudeBot・PerplexityBot・Google-Extended・CCBot・OAI-SearchBot のどれかをブロックしているものです。",
            "「6項目」は、(1) llms.txt がある、(2) JSON-LD がある、(3) Organization または LocalBusiness の型がある、(4) robots.txt があり GPTBot・ClaudeBot・PerplexityBot・OAI-SearchBot のどれもブロックしていない、(5) meta description がある、(6) canonical がある、のうち当てはまる数（0〜6）です。この調査のための単純な数で、Nurevo の0〜100点のスコアとは別物です。",
            "HTTP 202：カナダでトップページがステータス202を返したのは122件（到達件数の13.4%）で、米国（15.0%）・英国（14.9%）・オーストラリア（14.5%）と近い割合です。202のページはほとんどの項目が「なし」になります。ステータス200のサイト（786件）だけで見ると、llms.txt は26.5%、「6項目すべて」は21.9%、JSON-LD は78.6%で、米国の200のサイト（27.2%・22.3%）とも差は見られませんでした（p=0.73・p=0.85）。",
            "統計：カナダと他の地域の差はカイ二乗検定で確かめました。30件未満の区分は載せていません。",
          ],
        },
        {
          heading: "結果：カナダと米国・英国・オーストラリア・日本の比較",
          paragraphs: [
            "カナダの値は、ほとんどの項目で米国・英国・オーストラリアと1〜3ポイント以内でした。llms.txt・「6項目すべて」・JSON-LD・AIボットのブロックのどれも、米国・英国・オーストラリアとの間に統計的な差は見られません。FAQPage（8.0%）は米国（6.2%）よりわずかに高い値でした（p=0.048）。カナダ以外の海外全体（llms.txt 26.6%・6項目すべて22.0%）と比べると、llms.txt と「6項目すべて」はやや低い値です（p=0.016・p=0.034）。日本と比べると、llms.txt は1.7倍、「6項目すべて」は1.8倍で、JSON-LD は同じくらい（68.1%・69.4%、p=0.47）でした。一方、meta description（67.3%・90.7%）・canonical（71.3%・84.6%）・robots.txt（72.7%・91.8%）は日本が高く、これには202を返すサイトや WordPress 以外のサイトの割合の違いが関わっています。",
          ],
          table: {
            head: HEAD_JA,
            rows: COMPARE.map(([ja, , ...v]) => [ja, ...v]),
            caption: "Web制作会社の自社サイトで、トップページに到達できたもの。「AIボットをブロック」「AIボットに言及」の分母は robots.txt があるサイト（カナダ660件・米国3,404件・英国699件・オーストラリア1,336件・日本2,281件・カナダ以外の海外9,810件）。2026年11月12日集計。",
          },
        },
        {
          heading: "17か国の中での位置",
          paragraphs: [
            "到達できたサイトが100件以上ある17か国（日本を含む）を llms.txt の割合で並べました。カナダは llms.txt で12位、「6項目すべて」は米国・オランダと同じ18.9%、6項目の平均（3.58）は14位でした。AIボットのブロック率（3.5%）は、日本（1.3%）・フランス（1.9%）・アイルランド（3.3%）に次いで4番目に低い値です。上位にはシンガポール・インド・ブラジル・スペイン・フィリピンが並び、英語圏の米国・英国・カナダ・オーストラリアは中位にまとまっています。国ごとの件数は収集リストによるもので、各国の制作会社全体の分布ではありません。",
          ],
          table: {
            head: ["国", "到達件数", "llms.txt", "6項目すべて", "6項目の平均", "AIボットをブロック"],
            rows: COUNTRIES.map(([ja, , ...v]) => [ja, ...v]),
            caption: "到達できたサイトが100件以上の国。llms.txt の割合の高い順。「AIボットをブロック」の分母は robots.txt があるサイト。2026年11月12日集計。",
          },
        },
        {
          heading: "ボット別のブロック率",
          paragraphs: [
            "カナダで robots.txt があるサイト660件について、ボットごとにトップページをブロックしている割合です。学習用とされるボット（CCBot・Bytespider・Google-Extended・GPTBot・Applebot-Extended・ClaudeBot・anthropic-ai）は2.4〜3.5%で、米国・英国・オーストラリアよりやや低く、日本の2〜3倍でした。検索用やユーザーの質問に答えるときに使われるボットでは、ChatGPT-User と PerplexityBot をブロックしていたのが同じ1件だけで、OAI-SearchBot・Claude-SearchBot をブロックしていたサイトはありませんでした。Googlebot・Bingbot をブロックしていたサイトもありません。AIボットのブロック率（3.5%）は、米国・英国・オーストラリアとの間に統計的な差は見られず（p=0.38・0.31・0.25）、日本よりは高い値です（p<0.001）。",
          ],
          table: {
            head: ["ボット", "カナダ（件数）", "カナダ", "米国", "英国", "オーストラリア", "日本"],
            rows: BOTS,
            caption: "分母は robots.txt があるサイト（カナダ660件・米国3,404件・英国699件・オーストラリア1,336件・日本2,281件）。トップページ（/）に対する判定。カナダの件数は小さい数です。",
          },
        },
        {
          heading: "ブロックの中身（事実）",
          list: [
            "GPTBot をブロックしていた19件は、すべて OAI-SearchBot をブロックしていませんでした。米国は128件中119件、英国は28件中28件、オーストラリアは56件中55件です。",
            "上の11種のAIボットのどれかをブロックしていた25件のうち15件（60.0%）は、GPTBot・ClaudeBot・anthropic-ai・Google-Extended・CCBot・Bytespider・Applebot-Extended の7つをまとめてブロックする同じ組み合わせでした（米国58.5%・英国77.1%・オーストラリア64.6%）。",
            "OAI-SearchBot・ChatGPT-User・Claude-SearchBot・PerplexityBot のどれかをブロックしていたのは1件（robots.txt があるサイトの0.2%）でした。",
            "robots.txt でAIボットの名前を挙げていながら、どれもトップページをブロックしていないサイトが41件ありました（robots.txt があるサイトの6.2%、米国4.4%）。",
            "AIボットをブロックしていた23件のうち8件（34.8%）には llms.txt もありました（米国34.0%）。",
          ],
        },
        {
          heading: "構造化データの型",
          paragraphs: [
            "トップページの JSON-LD に含まれる型は、カナダでは WebSite（64.8%）・WebPage（57.8%）・Organization（56.9%）が多く、どの型も米国・英国・オーストラリアと近い値でした。日本と比べると、WebPage・SearchAction・ImageObject（WordPress のSEOプラグインがよく出す型）、PostalAddress（26.2%・日本16.4%）、ContactPoint（14.1%・6.5%）、GeoCoordinates（11.0%・3.7%）が高い値です。BreadcrumbList は日本と同じくらい（41.4%・43.4%）でした。JSON-LD があるサイトのうち、JSON として読み込めないブロックがあったのは1.1%（7件）で、比べた地域の中でいちばん低い値です。",
          ],
          table: {
            head: ["@type", "カナダ", "米国", "英国", "オーストラリア", "日本"],
            rows: TYPES,
            caption: "到達できたサイトのうち、トップページの JSON-LD にその型があった割合（入れ子の型も数えます）。カナダ908件・米国4,472件・英国942件・オーストラリア1,719件・日本2,486件。",
          },
        },
        {
          heading: "WordPress とSEOプラグイン",
          paragraphs: [
            "カナダの制作会社サイトの71.6%（650件）が WordPress で、米国（74.5%）・英国（73.4%）と近く、日本（92.3%）より低い値でした。WordPress のサイトは llms.txt 30.8%、JSON-LD 93.2%、6項目の平均4.87 で、WordPress 以外（258件、うち122件が202）は llms.txt 3.1%、JSON-LD 4.7%、平均0.35 でした。WordPress 以外のうちステータス200の136件だけでも、llms.txt は5.9%（8件）、JSON-LD は8.8%（12件）です。WordPress のサイトどうしで比べると、llms.txt はカナダ30.8%・米国30.1%で差はなく（p=0.77）、日本（14.0%）より高い結果でした（p<0.001）。",
            "SEOプラグインは Yoast SEO が53.7%、Rank Math が21.4%、AIOSEO が7.1%で、米国（56.4%・18.0%・7.1%）と似た構成です。llms.txt があった割合は AIOSEO 41.3%、Rank Math 36.7%、プラグインを検出できなかったサイト30.1%、Yoast SEO 27.2%でした。この調査では llms.txt をプラグインで作ったのか手で置いたのかは見ていません。SEOPress（3件）は30件未満のため表に載せていません。",
          ],
          table: {
            head: ["SEOプラグイン", "カナダの WordPress サイト", "llms.txt", "JSON-LD", "6項目の平均"],
            rows: PLUGINS.map(([p, ...v]) => [p.replace("検出なし / none detected", "検出なし"), ...v]),
            caption: "カナダの WordPress サイト650件。プラグインはトップページのHTMLの文字列で判定（Yoast → Rank Math → AIOSEO → SEOPress の順に最初に当てはまったもの）。30件未満の区分は省略。",
          },
        },
        {
          heading: ".ca と .com",
          paragraphs: [
            "カナダの制作会社サイトを、ドメインの末尾で分けました。到達908件のうち .ca が301件、.com が499件、それ以外が108件です。llms.txt（20.3%・24.4%）と「6項目すべて」（16.3%・20.0%）は .com がやや高いものの、統計的な差は見られませんでした（p=0.20・p=0.22）。JSON-LD は .com が高く（62.8%・70.3%、p=0.03）、202を返した割合には差がありません（14.6%・12.6%、p=0.49）。ステータス200のサイトだけで比べても、llms.txt は .ca 23.7%・.com 28.0%（p=0.26）でした。",
          ],
          table: {
            head: ["ドメイン", "到達件数", "HTTP 202", "llms.txt", "JSON-LD", "6項目すべて", "6項目の平均"],
            rows: DOMAINS.map(([d, ...v]) => [d.replace("その他 / other", "その他"), ...v]),
            caption: "カナダの到達908件を、ホスト名の末尾で分けたもの。HTTP 202 の割合は到達件数に対するもの。",
          },
        },
        {
          heading: "6項目の分布",
          paragraphs: [
            "カナダは「5項目」（36.2%）と「6項目」（18.9%）で55.2%を占め、「0項目」が24.3%でした。この分布は米国・英国・オーストラリアとほぼ同じ形です。「0項目」の多くはステータス202を返したサイトで（122件、到達件数の13.4%）、実際のページを読めていない可能性があります。日本は「0項目」が1.6%と少なく、3〜4項目の層が厚い（合わせて30.7%、カナダ14.1%）形でした。",
          ],
          table: {
            head: ["当てはまる項目数", "カナダ", "米国", "英国", "オーストラリア", "日本"],
            rows: DIST,
            caption: "到達できたサイトに占める割合。カナダ908件、米国4,472件、英国942件、オーストラリア1,719件、日本2,486件。",
          },
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "この調査の数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。そのまま使える1文：",
          ],
          list: [
            "カナダのWeb制作会社の自社サイトの22.9%に llms.txt があった（米国23.1%、英国21.5%、オーストラリア24.3%、日本13.4%）（Nurevo AEO 調査、2026年11月、908件）。",
            "カナダのWeb制作会社の自社サイトで、AI検索に関わる6項目をすべて満たしていたのは18.9%で、米国と同じ値だった（Nurevo AEO 調査、2026年11月）。",
            "カナダのWeb制作会社の自社サイトで robots.txt でAIボットをブロックしていたのは3.5%で、検索用のボットまでブロックしていたのは660件中1件だった（Nurevo AEO 調査、2026年11月）。",
            "カナダのWeb制作会社で GPTBot をブロックしていた19件は、すべて ChatGPT の検索用ボット OAI-SearchBot を許可していた（Nurevo AEO 調査、2026年11月）。",
            "カナダのWeb制作会社の WordPress サイトの53.7%で Yoast SEO、21.4%で Rank Math が検出された（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "限界",
          list: [
            "対象はWeb制作会社の自社サイトで、一般企業のサイト全体ではありません。国は当社の収集リストの記載によるもので、カナダの制作会社全体を代表する標本ではありません。州・言語（英語・フランス語）ごとの分析は、所在地や言語が分かるサイトが少ないため行っていません。ボット別の件数などは小さい数です。",
            "トップページだけを見ています。robots.txt はトップページ（/）に対する判定で、一部のディレクトリだけのブロックや、ファイアウォール・CDN によるブロックは数えていません。llms.txt は有無だけを見て、中身の質は見ていません。",
            "各サイト1回の取得で、到達できなかったサイト（427件）は除いています。HTTP 202 を返した122件は、実際のトップページとは違うページを見ている可能性があります。",
            "SEOプラグインはHTMLの文字列による判定で、痕跡を消している場合や複数入っている場合は正しく分けられません。",
            "今回の集計の一部には11月5日集計時の取得分を引き継いでいます。",
          ],
        },
        {
          heading: "当社の見方（意見）",
          paragraphs: [
            "ここからは事実ではなく当社の意見です。カナダの制作会社サイトは、llms.txt・構造化データ・AIボットの扱いのどれも米国・英国・オーストラリアとほとんど同じで、英語圏の制作会社がよく似た道具（WordPress と Yoast SEO・Rank Math など）を使っていることの表れかもしれません（この調査では因果は確かめていません）。AIボットのブロックは少数で、ブロックしているサイトも学習用のボットに限っており、検索用のボットまで止めていたのは1件だけでした。どのボットを止めるかは各社の判断です。WordPress 以外のサイトでは、llms.txt や構造化データがほとんど見つかりませんでした（202を除いても llms.txt 5.9%）。どれを整えてもAIの回答に出ることが保証されるわけではありません（[別の調査](/guide/aeo-signals-ai-answers-study)では、サイト側の項目と登場の間に関係は見られませんでした）。",
          ],
        },
        {
          heading: "自社やお客様のサイトを確かめる",
          paragraphs: [
            "[無料チェック](https://nurevo.jp/check)で、llms.txt・構造化データ・AIクローラーの許可状況を1分ほどで確認できます。WordPress なら [Nurevo WebMCP プラグイン](https://wordpress.org/plugins/nurevo-webmcp/)で llms.txt を出し、会社の事実を構造化データに加えられます。お客様のサイトにまとめて入れたい制作会社の方は[パートナー制度](https://nurevo.jp/partner/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "カナダの制作会社のAI検索への対応は米国と違いますか？", a: "ほとんど同じでした。llms.txt はカナダ22.9%・米国23.1%、「6項目すべて」はどちらも18.9%で、AIボットのブロック率（3.5%・4.3%）にも統計的な差は見られませんでした（2026年11月、Web制作会社の自社サイト）。" },
        { q: "日本と比べるとどうですか？", a: "llms.txt は日本（13.4%）の1.7倍、「6項目すべて」は日本（10.4%）の1.8倍でした。JSON-LD は同じくらい（68.1%・69.4%）で、meta description・canonical・robots.txt は日本のほうが高い値でした。" },
        { q: "カナダではAIクローラーをブロックしているサイトが多いですか？", a: "robots.txt があるサイトの3.5%（23件）で少数です。ほとんどは学習用のボットで、検索用・質問時の取得に使われる4つのボットのどれかをブロックしていたのは1件だけでした。" },
        { q: "この数字を記事で使えますか？", a: "はい。出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "あなたのサイトのAI対応を確認",
        body: "無料チェックで、llms.txt・構造化データ・AIクローラーの許可状況が分かります。AIの回答に出ることを保証するものではありません。",
        label: "無料でチェックする",
        href: "/check",
        secondary: { label: "制作会社向けパートナー", href: "/partner/" },
      },
      footnote: "調査：Nurevo AEO（Bestie.合同会社）。WordPress は WordPress Foundation の商標です。各SEOプラグイン名はそれぞれの権利者の商標です。個別の会社名・ドメインは公開しません。",
    },
    en: {
      title: "AI Search Readiness of 908 Canadian Web Agency Websites (2026) | Nurevo",
      description: "908 Canadian web agency sites: 22.9% have an llms.txt (US 23.1%, Japan 13.4%) and 18.9% meet all six AI search items, the same as the US. 3.5% block AI bots.",
      h1: "AI search readiness of Canadian web design agencies: 908 agency websites (November 2026)",
      lead: "We fetched the home page, robots.txt and llms.txt of 908 Canadian web design agencies' own websites. 22.9% (208) had an llms.txt — level with the US (23.1%), the UK (21.5%) and Australia (24.3%), and 1.7 times Japan (13.4%). 18.9% met all six AI-search items we checked, exactly the US figure. 3.5% of sites with a robots.txt blocked an AI bot, and all 19 sites blocking GPTBot still allowed OpenAI's search crawler, OAI-SearchBot.",
      intro: [
        "Published 2026-11-22. Data aggregated 2026-11-12. Research by Nurevo AEO (Bestie.合同会社), Japan. Nurevo sells AI search optimisation (AEO) tools and a WordPress plugin, and so has an interest in this topic. This is the fifth of our country reports (after the [United States](/guide/research-us-web-agencies-ai-search-2026), the [United Kingdom](/guide/research-uk-web-agencies-ai-search-2026), [Australia](/guide/research-au-web-agencies-ai-search-2026) and [India](/guide/research-in-web-agencies-ai-search-2026)). A French version is also available.",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "22.9% (208) of 908 Canadian web agency websites had an llms.txt. That is not statistically different from the US (23.1%, p = 0.95), the UK (21.5%, p = 0.52) or Australia (24.3%, p = 0.45), and is 1.7 times Japan (13.4%, p < 0.001).",
            "18.9% (172) of Canadian sites met all six AI-search items we checked — the same as the US — with an average of 3.58. Among the 17 countries with 100+ sites, Canada ranked 12th on llms.txt, in the same middle band as the US, the UK and Australia.",
            "Of 660 Canadian sites with a robots.txt, 3.5% (23) blocked an AI bot (US 4.3%, Japan 1.3%). All 19 sites blocking GPTBot allowed OAI-SearchBot, and only one site (0.2%) blocked any of the four bots used for search or for fetching pages when a user asks.",
          ],
        },
        {
          heading: "Method",
          list: [
            "Population: web design agencies' own websites. Of 1,335 agency sites listed as Canadian in our collection list, 908 home pages could be reached. This is not a sample of Canadian businesses in general. For comparison we use the same survey's US (4,472), UK (942), Australia (1,719), Japan (2,486) and all overseas sites outside Canada (12,444).",
            "Fetched: each site's home page, /robots.txt, /llms.txt and /llms-full.txt, once each (User-Agent: NurevoSurvey/1.0), early November to 12 November 2026; aggregated 2026-11-12.",
            "Classification: llms.txt = HTTP 200, not HTML, more than 20 characters. JSON-LD = present on the home page; \"broken\" = at least one block that does not parse as JSON. Organization-type = an @type of Organization, LocalBusiness, Corporation or ProfessionalService. WordPress = the home page HTML contains wp-content/ or wp-includes/, or a WordPress generator tag. SEO plugins were identified from strings in the home page HTML.",
            "AI bot blocking: whether the robots.txt rules that apply to each bot disallow the home page (/) (longest match); the base is sites with a robots.txt. \"Blocks an AI bot\" = blocks any of GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot or OAI-SearchBot.",
            "The six items: (1) has an llms.txt; (2) has JSON-LD; (3) has an Organization or LocalBusiness type; (4) has a robots.txt that blocks none of GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot; (5) has a meta description; (6) has a canonical link. The count (0–6) is a simple measure made for this survey, not Nurevo's 0–100 product score.",
            "HTTP 202: 122 Canadian home pages (13.4% of those reached) answered with status 202, a similar share to the US (15.0%), the UK (14.9%) and Australia (14.5%). Such pages fail almost every item. Among the 786 Canadian sites that answered HTTP 200, 26.5% had an llms.txt, 21.9% met all six items and 78.6% had JSON-LD — again not different from US HTTP 200 sites (27.2% and 22.3%; p = 0.73 and 0.85).",
            "Statistics: differences between Canada and other groups were tested with chi-square tests. Groups with fewer than 30 sites are not shown.",
          ],
        },
        {
          heading: "Results: Canada compared with the US, the UK, Australia and Japan",
          paragraphs: [
            "Canada was within one to three percentage points of the US, the UK and Australia on almost every item. None of llms.txt, all six items, JSON-LD or AI bot blocking differed significantly from those three countries. FAQPage (8.0%) was slightly higher than in the US (6.2%, p = 0.048). Compared with all overseas sites outside Canada (llms.txt 26.6%, all six 22.0%), Canada was a little lower on llms.txt and all six items (p = 0.016 and 0.034). Compared with Japan, Canada had 1.7 times the llms.txt share and 1.8 times the share meeting all six items, with about the same JSON-LD share (68.1% vs 69.4%, p = 0.47). Japan was higher on meta descriptions (90.7% vs 67.3%), canonical links (84.6% vs 71.3%) and robots.txt (91.8% vs 72.7%); differences in the share of HTTP 202 and non-WordPress sites are part of that gap.",
          ],
          table: {
            head: HEAD_EN,
            rows: COMPARE.map(([, en, ...v]) => [en, ...v]),
            caption: "Web design agencies' own websites whose home page could be reached. For \"blocks an AI bot\" and \"names an AI bot\", the base is sites with a robots.txt (Canada 660, US 3,404, UK 699, Australia 1,336, Japan 2,281, other overseas 9,810). Aggregated 2026-11-12.",
          },
        },
        {
          heading: "Where Canada stands among 17 countries",
          paragraphs: [
            "The 17 countries (Japan included) with at least 100 reached sites, ranked by llms.txt. Canada was 12th on llms.txt, tied with the US and the Netherlands at 18.9% on all six items, and 14th on the six-item average (3.58). Its AI bot blocking rate (3.5%) was the fourth lowest, after Japan (1.3%), France (1.9%) and Ireland (3.3%). Singapore, India, Brazil, Spain and the Philippines lead; the English-speaking US, UK, Canada and Australia sit together in the middle. Country counts reflect our collection list, not the distribution of agencies in each country.",
          ],
          table: {
            head: ["Country", "Sites reached", "llms.txt", "All 6 items", "6-item average", "Blocks an AI bot"],
            rows: COUNTRIES.map(([, en, ...v]) => [en, ...v]),
            caption: "Countries with 100+ reached sites, by llms.txt share. \"Blocks an AI bot\" is a share of sites with a robots.txt. Aggregated 2026-11-12.",
          },
        },
        {
          heading: "Blocking by bot",
          paragraphs: [
            "For the 660 Canadian sites with a robots.txt, the share blocking the home page for each bot. Bots described as training crawlers (CCBot, Bytespider, Google-Extended, GPTBot, Applebot-Extended, ClaudeBot, anthropic-ai) were blocked by 2.4–3.5%, slightly below the US, the UK and Australia and two to three times Japan. Among bots used for search or for fetching pages when a user asks, a single site blocked both ChatGPT-User and PerplexityBot; no site blocked OAI-SearchBot or Claude-SearchBot. No site blocked Googlebot or Bingbot. Canada's AI bot blocking rate (3.5%) did not differ significantly from the US, the UK or Australia (p = 0.38, 0.31, 0.25) and was higher than Japan's (p < 0.001).",
          ],
          table: {
            head: ["Bot", "Canada (sites)", "Canada", "US", "UK", "Australia", "Japan"],
            rows: BOTS,
            caption: "Base: sites with a robots.txt (Canada 660, US 3,404, UK 699, Australia 1,336, Japan 2,281). Judged for the home page (/). Canadian counts are small numbers.",
          },
        },
        {
          heading: "What the blocking looks like (facts)",
          list: [
            "All 19 sites blocking GPTBot did not block OAI-SearchBot. In the US it was 119 of 128, in the UK 28 of 28 and in Australia 55 of 56.",
            "Of the 25 sites blocking any of the 11 AI bots above, 15 (60.0%) used the same set: GPTBot, ClaudeBot, anthropic-ai, Google-Extended, CCBot, Bytespider and Applebot-Extended, all blocked together (US 58.5%, UK 77.1%, Australia 64.6%).",
            "One site (0.2% of sites with a robots.txt) blocked any of OAI-SearchBot, ChatGPT-User, Claude-SearchBot or PerplexityBot.",
            "41 sites (6.2% of sites with a robots.txt; US 4.4%) named an AI bot in robots.txt without blocking the home page for any of them.",
            "8 of the 23 sites blocking an AI bot (34.8%) also had an llms.txt (US 34.0%).",
          ],
        },
        {
          heading: "Structured data types",
          paragraphs: [
            "The most common types in Canadian home page JSON-LD were WebSite (64.8%), WebPage (57.8%) and Organization (56.9%); every type was close to the US, UK and Australian figures. Compared with Japan, Canada was higher on WebPage, SearchAction and ImageObject (types WordPress SEO plugins commonly output), PostalAddress (26.2% vs 16.4%), ContactPoint (14.1% vs 6.5%) and GeoCoordinates (11.0% vs 3.7%). BreadcrumbList was about the same as Japan (41.4% vs 43.4%). Only 1.1% (7) of Canadian sites with JSON-LD had a block that did not parse as JSON — the lowest of the groups compared.",
          ],
          table: {
            head: ["@type", "Canada", "US", "UK", "Australia", "Japan"],
            rows: TYPES,
            caption: "Share of reached sites whose home page JSON-LD contains the type (nested types included). Canada 908, US 4,472, UK 942, Australia 1,719, Japan 2,486.",
          },
        },
        {
          heading: "WordPress and SEO plugins",
          paragraphs: [
            "71.6% (650) of Canadian agency sites run WordPress, close to the US (74.5%) and the UK (73.4%) and below Japan (92.3%). WordPress sites had llms.txt 30.8%, JSON-LD 93.2% and a six-item average of 4.87; non-WordPress sites (258, of which 122 answered 202) had llms.txt 3.1%, JSON-LD 4.7% and an average of 0.35. Even among the 136 non-WordPress sites that answered HTTP 200, only 5.9% (8) had an llms.txt and 8.8% (12) had JSON-LD. Comparing WordPress sites only, llms.txt was 30.8% in Canada and 30.1% in the US (p = 0.77), both above Japan (14.0%, p < 0.001).",
            "Yoast SEO was detected on 53.7% of Canadian WordPress sites, Rank Math on 21.4% and AIOSEO on 7.1% — a mix similar to the US (56.4%, 18.0%, 7.1%). The llms.txt share was 41.3% with AIOSEO, 36.7% with Rank Math, 30.1% where no plugin was detected and 27.2% with Yoast SEO. This survey does not tell whether an llms.txt was generated by a plugin or placed by hand. SEOPress (3 sites) is under 30 and not shown.",
          ],
          table: {
            head: ["SEO plugin", "Canadian WordPress sites", "llms.txt", "JSON-LD", "6-item average"],
            rows: PLUGINS.map(([p, ...v]) => [p.replace("検出なし / none detected", "none detected"), ...v]),
            caption: "650 Canadian WordPress sites. Plugins detected from home page HTML strings (first match in the order Yoast → Rank Math → AIOSEO → SEOPress). Groups under 30 omitted.",
          },
        },
        {
          heading: ".ca versus .com",
          paragraphs: [
            "We split Canadian agency sites by the end of their domain name: of 908 reached, 301 were .ca, 499 .com and 108 other. .com sites were slightly ahead on llms.txt (24.4% vs 20.3%) and all six items (20.0% vs 16.3%), but neither difference was statistically significant (p = 0.20 and 0.22). JSON-LD was higher on .com (70.3% vs 62.8%, p = 0.03), and the share answering HTTP 202 did not differ (12.6% vs 14.6%, p = 0.49). Among HTTP 200 sites only, llms.txt was 23.7% on .ca and 28.0% on .com (p = 0.26).",
          ],
          table: {
            head: ["Domain", "Sites reached", "HTTP 202", "llms.txt", "JSON-LD", "All 6 items", "6-item average"],
            rows: DOMAINS.map(([d, ...v]) => [d.replace("その他 / other", "other"), ...v]),
            caption: "The 908 reached Canadian sites, split by the last label of the host name. HTTP 202 share is of sites reached.",
          },
        },
        {
          heading: "Distribution of the six items",
          paragraphs: [
            "In Canada, five items (36.2%) and six items (18.9%) together made up 55.2% of sites, and 24.3% met none. The shape is almost the same as in the US, the UK and Australia. Most zero-item sites are those that answered HTTP 202 (122 sites, 13.4% of those reached), where we may not have seen the real page. Japan has very few zero-item sites (1.6%) and a thicker band at three to four items (30.7% combined, Canada 14.1%).",
          ],
          table: {
            head: ["Items met", "Canada", "US", "UK", "Australia", "Japan"],
            rows: DIST,
            caption: "Share of reached sites. Canada 908, US 4,472, UK 942, Australia 1,719, Japan 2,486.",
          },
        },
        {
          heading: "Citing this survey",
          paragraphs: [
            "You may quote and republish the figures and tables freely, as long as you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. Sentences ready to quote:",
          ],
          list: [
            "22.9% of Canadian web design agencies' own websites had an llms.txt file, compared with 23.1% in the US, 21.5% in the UK, 24.3% in Australia and 13.4% in Japan (Nurevo AEO survey, November 2026, 908 Canadian sites).",
            "18.9% of Canadian web agency websites met all six AI-search readiness items checked — the same share as in the US (Nurevo AEO survey, November 2026).",
            "3.5% of Canadian web agency websites with a robots.txt blocked an AI bot, and only 1 of 660 blocked a search crawler such as OAI-SearchBot, ChatGPT-User or PerplexityBot (Nurevo AEO survey, November 2026).",
            "All 19 Canadian web agency websites that blocked GPTBot still allowed OpenAI's search crawler OAI-SearchBot (Nurevo AEO survey, November 2026).",
            "Yoast SEO was detected on 53.7% of Canadian web agencies' WordPress sites and Rank Math on 21.4% (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Limitations",
          list: [
            "The population is web design agencies' own websites, not businesses in general. Country comes from our collection list, and the sample is not representative of all Canadian agencies. We did not break results down by province or by language (English or French) because too few sites have a known location or language. Counts such as per-bot blocking are small numbers.",
            "Only the home page was examined. robots.txt was judged for / only; partial blocking and blocking by firewalls or CDNs were not counted. For llms.txt we checked only whether it exists, not its quality.",
            "One fetch per site; unreachable sites (427) are excluded. The 122 HTTP 202 responses may not reflect the real home page.",
            "SEO plugins were detected from HTML strings; sites that hide plugin markers or run several plugins may be misclassified.",
            "Part of this aggregation reuses fetches from the 5 November run.",
          ],
        },
        {
          heading: "Our reading (opinion)",
          paragraphs: [
            "What follows is our opinion, not a finding. On llms.txt, structured data and AI bot handling, Canadian agency sites look almost identical to those in the US, the UK and Australia, which may reflect English-speaking agencies using much the same tools (WordPress with Yoast SEO, Rank Math and similar plugins); this survey does not test cause. AI bot blocking is a minority practice, almost always limited to training crawlers — only one site also blocked search crawlers. Which bots to block is each site owner's decision. Non-WordPress sites rarely had an llms.txt or structured data (5.9% llms.txt even excluding HTTP 202). None of this guarantees appearing in AI answers (in [another of our studies](/guide/aeo-signals-ai-answers-study), on-site signals showed no relationship with appearance).",
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
        { q: "Are Canadian agencies different from US agencies on AI search readiness?", a: "Hardly. llms.txt was 22.9% in Canada and 23.1% in the US, both had 18.9% meeting all six items, and AI bot blocking (3.5% vs 4.3%) did not differ significantly (November 2026, agencies' own websites)." },
        { q: "How does Canada compare with Japan?", a: "Canada had 1.7 times Japan's llms.txt share (22.9% vs 13.4%) and 1.8 times its share meeting all six items (18.9% vs 10.4%). JSON-LD was about the same (68.1% vs 69.4%), while Japan was higher on meta descriptions, canonical links and robots.txt." },
        { q: "Do many Canadian sites block AI crawlers?", a: "3.5% of sites with a robots.txt (23 sites) — a small minority. Almost all of it targets training crawlers: only one site blocked any of OAI-SearchBot, ChatGPT-User, Claude-SearchBot or PerplexityBot." },
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
