// Content page: research report (country report: New Zealand). AI search
// readiness of New Zealand web design agencies' own websites, compared with
// Australia, the US, the UK, Japan and other overseas agencies. November 2026.
//
// Every number here comes from nurevo-outreach data/survey/raw_2026-11-12.json
// (survey.js; the same run as summary_2026-11-12.json — the New Zealand totals
// match summary.byCountry.NZ: 417 reached, llms.txt 25.4%, JSON-LD 70.3%,
// WordPress 75.3%, AI bot blocked 5.8%, all six 20.9%). Country = the "co"
// field of our collection list (NZ; 544 listed). Do not add a figure that is
// not in that data. The raw file holds company names and domains: never
// publish them. Definitions follow survey.js (see the US report).
// "Excluding HTTP 202" = drops the 37 NZ home pages answered with status 202
// (none had JSON-LD, WordPress markers, a robots.txt or an llms.txt).
// "Other overseas" = all non-Japan sites except New Zealand (12,935 reached).
// Groups under 30 sites are not shown (AIOSEO 16 and SEOPress 2 NZ WordPress
// sites; .nz other than .co.nz 27 sites). Regions: 470 of 544 blank, not split.
// Chi-square, NZ vs Japan: llms.txt, all 6, blocking p<0.001, FAQPage p=0.002.
// NZ vs AU: llms.txt p=0.68, all 6 p=1.00, blocking p=0.50, FAQPage p=0.09.
// NZ vs US: llms.txt p=0.31, all 6 p=0.37, blocking p=0.27.
// NZ vs UK: llms.txt p=0.13, all 6 p=0.20, blocking p=0.56.
// NZ vs other overseas: llms.txt p=0.69, all 6 p=0.68, blocking p=0.65.
// .co.nz (132) vs .com (122): llms.txt p=0.005, all 6 p<0.001; WordPress
// only (91 vs 102) llms.txt p=0.004; excluding 202 (120 vs 116) p=0.009.
// NZ WordPress llms.txt vs US WP p=0.56, AU WP p=0.74, Japan WP p<0.001.

// [ja label, en label, NZ, NZ excl. 202, AU, US, UK, Japan, other overseas (excl. NZ)]
const COMPARE = [
  ["到達件数", "Sites reached", "417", "380", "1,719", "4,472", "942", "2,486", "12,935"],
  ["WordPress", "WordPress", "75.3%", "82.6%", "76.0%", "74.5%", "73.4%", "92.3%", "75.5%"],
  ["llms.txt", "llms.txt", "25.4%", "27.9%", "24.3%", "23.1%", "21.5%", "13.4%", "26.4%"],
  ["llms-full.txt", "llms-full.txt", "1.2%", "1.3%", "1.6%", "1.5%", "1.3%", "0.6%", "1.8%"],
  ["JSON-LD", "JSON-LD", "70.3%", "77.1%", "71.3%", "69.0%", "68.8%", "69.4%", "72.1%"],
  ["JSON-LD が壊れている（JSON-LD があるサイト中）", "Broken JSON-LD (of sites with JSON-LD)", "1.0%", "1.0%", "2.1%", "1.6%", "2.0%", "1.7%", "1.9%"],
  ["Organization系の型", "Organization-type", "63.5%", "69.7%", "62.2%", "59.4%", "59.6%", "58.9%", "63.6%"],
  ["FAQPage", "FAQPage", "7.4%", "8.2%", "10.3%", "6.2%", "8.0%", "3.9%", "9.4%"],
  ["meta description", "Meta description", "69.5%", "76.3%", "70.2%", "68.0%", "69.3%", "90.7%", "71.5%"],
  ["Open Graph", "Open Graph", "72.9%", "80.0%", "72.4%", "69.1%", "69.1%", "81.3%", "72.4%"],
  ["canonical", "Canonical link", "77.7%", "85.3%", "75.9%", "74.3%", "72.7%", "84.6%", "76.3%"],
  ["robots.txt", "robots.txt", "78.4%", "86.1%", "77.7%", "76.1%", "74.2%", "91.8%", "78.4%"],
  ["AIボットをブロック（robots.txt があるサイト中）", "Blocks an AI bot (of sites with robots.txt)", "5.8%", "5.8%", "4.7%", "4.3%", "4.7%", "1.3%", "5.1%"],
  ["robots.txt でAIボットに言及", "robots.txt names an AI bot", "10.1%", "10.1%", "10.7%", "8.8%", "9.3%", "2.5%", "11.8%"],
  ["6項目の平均", "6-item average", "3.80", "4.17", "3.77", "3.65", "3.61", "4.05", "3.83"],
  ["5項目以上", "5+ items", "57.8%", "63.4%", "56.7%", "54.6%", "55.1%", "52.2%", "58.2%"],
  ["6項目すべて", "All 6 items", "20.9%", "22.9%", "20.8%", "18.9%", "17.7%", "10.4%", "21.8%"],
];

// [bot, NZ blocked, NZ %, AU %, US %, UK %, Japan %]  base = sites with robots.txt (NZ 327 / AU 1,336 / US 3,404 / UK 699 / Japan 2,281)
const BOTS = [
  ["CCBot", "19", "5.8%", "4.3%", "4.1%", "4.6%", "1.1%"],
  ["Bytespider", "18", "5.5%", "4.2%", "4.1%", "4.7%", "1.1%"],
  ["ClaudeBot", "16", "4.9%", "3.8%", "3.5%", "4.1%", "1.0%"],
  ["Google-Extended", "16", "4.9%", "3.8%", "3.6%", "4.1%", "1.1%"],
  ["GPTBot", "15", "4.6%", "4.2%", "3.8%", "4.0%", "1.2%"],
  ["anthropic-ai", "15", "4.6%", "3.4%", "3.4%", "4.3%", "1.0%"],
  ["Applebot-Extended", "15", "4.6%", "3.6%", "3.3%", "3.9%", "1.0%"],
  ["OAI-SearchBot", "2", "0.6%", "0.1%", "0.3%", "0.1%", "0.0%"],
  ["ChatGPT-User", "2", "0.6%", "0.3%", "0.4%", "0.0%", "0.1%"],
  ["PerplexityBot", "2", "0.6%", "0.1%", "0.3%", "0.0%", "0.1%"],
  ["Claude-SearchBot", "1", "0.3%", "0.1%", "0.3%", "0.0%", "0.0%"],
  ["Googlebot", "1", "0.3%", "0.1%", "0.1%", "0.0%", "0.0%"],
  ["Bingbot", "1", "0.3%", "0.0%", "0.1%", "0.0%", "0.0%"],
];

// [type, NZ, AU, US, UK, Japan]  share of reachable sites whose home page JSON-LD contains the @type
const TYPES = [
  ["WebSite", "67.4%", "68.4%", "65.7%", "66.2%", "63.0%"],
  ["WebPage", "60.2%", "61.9%", "59.3%", "60.4%", "34.4%"],
  ["Organization", "59.7%", "58.8%", "55.4%", "56.1%", "54.4%"],
  ["SearchAction", "58.0%", "59.7%", "56.8%", "60.8%", "28.9%"],
  ["ImageObject", "55.4%", "57.4%", "54.5%", "55.0%", "38.3%"],
  ["BreadcrumbList", "41.2%", "43.5%", "44.5%", "44.3%", "43.4%"],
  ["PostalAddress", "24.9%", "28.7%", "24.3%", "26.6%", "16.4%"],
  ["Person", "16.1%", "16.9%", "15.6%", "16.7%", "10.2%"],
  ["ContactPoint", "13.2%", "14.7%", "12.5%", "12.5%", "6.5%"],
  ["ProfessionalService", "13.2%", "13.6%", "10.1%", "12.1%", "5.6%"],
  ["LocalBusiness", "10.6%", "14.2%", "12.2%", "10.5%", "5.4%"],
  ["OpeningHoursSpecification", "10.6%", "11.6%", "8.8%", "9.8%", "4.8%"],
  ["GeoCoordinates", "10.1%", "14.4%", "12.1%", "13.6%", "3.7%"],
  ["FAQPage", "7.4%", "10.3%", "6.2%", "8.0%", "3.9%"],
];

// [plugin, NZ WordPress sites (share), llms.txt count (share), JSON-LD, 6-item average]
const PLUGINS = [
  ["Yoast SEO", "164 (52.2%)", "48 (29.3%)", "99.4%", "4.98"],
  ["Rank Math", "65 (20.7%)", "27 (41.5%)", "100.0%", "5.26"],
  ["検出なし / none detected", "67 (21.3%)", "16 (23.9%)", "53.7%", "3.69"],
];

// [domain ja, domain en, sites, WordPress, llms.txt, all 6, 6-item average, HTTP 202]
const DOMAINS = [
  [".co.nz", ".co.nz", "132", "68.9%", "18.2% (24)", "13.6% (18)", "3.72", "12"],
  [".com", ".com", "122", "83.6%", "34.4% (42)", "32.8% (40)", "4.09", "6"],
];

// [score, NZ, NZ excl. 202, AU, US, UK, Japan]
const DIST = [
  ["0", "18.7%", "10.8%", "20.7%", "22.1%", "23.6%", "1.6%"],
  ["1", "3.4%", "3.7%", "2.5%", "2.5%", "1.9%", "4.8%"],
  ["2", "5.3%", "5.8%", "3.8%", "4.3%", "4.2%", "10.7%"],
  ["3", "3.6%", "3.9%", "3.0%", "3.6%", "3.1%", "15.4%"],
  ["4", "11.3%", "12.4%", "13.4%", "12.8%", "12.1%", "15.3%"],
  ["5", "36.9%", "40.5%", "35.9%", "35.7%", "37.4%", "41.8%"],
  ["6", "20.9%", "22.9%", "20.8%", "18.9%", "17.7%", "10.4%"],
];

const HEAD_JA = ["項目", "ニュージーランド", "NZ（202を除く）", "オーストラリア", "米国", "英国", "日本", "NZ以外の海外"];
const HEAD_EN = ["Item", "New Zealand", "NZ (excl. 202)", "Australia", "US", "UK", "Japan", "Other overseas"];

export default {
  slug: "research-nz-web-agencies-ai-search-2026",
  targetQueries: [
    "ニュージーランド Web制作会社 AI検索 対応状況 調査",
    "ニュージーランド llms.txt 導入率",
    "New Zealand web design agencies AI search readiness survey",
    "llms.txt adoption New Zealand 2026",
    "New Zealand websites blocking AI crawlers robots.txt GPTBot",
  ],
  related: ["research-au-web-agencies-ai-search-2026", "research-japan-vs-overseas-2026", "research-us-web-agencies-ai-search-2026", "research-uk-web-agencies-ai-search-2026", "llms-txt"],
  locales: {
    ja: {
      title: "ニュージーランドのWeb制作会社417社のAI検索対応を調査【2026年11月】 | Nurevo",
      description: "NZのWeb制作会社の自社サイト417件を調査。llms.txt は25.4%（日本13.4%）、6項目すべて満たすのは20.9%（日本10.4%）。.co.nz は .com より llms.txt が少なめ（18.2%・34.4%）。",
      h1: "ニュージーランドのWeb制作会社の自社サイト417件に見るAI検索への対応（2026年11月）",
      lead: "ニュージーランドのWeb制作会社の自社サイト417件のトップページ・robots.txt・llms.txt を調べたところ、llms.txt があったのは25.4%（106件）で、日本の13.4%より高く、オーストラリア（24.3%）・米国（23.1%）・英国（21.5%）とは統計的な差が見られませんでした。AI検索に関わる6項目をすべて満たすサイトは20.9%で、オーストラリア（20.8%）とほぼ同じ、日本の2倍です。国内向けの .co.nz ドメインのサイトは、.com のサイトより llms.txt（18.2%・34.4%）も「6項目すべて」（13.6%・32.8%）も低めでした。",
      intro: [
        "公開：2026年11月28日。データ：2026年11月12日集計。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策（AEO）のツールと WordPress プラグインを提供しており、この分野に利害があります。国別レポートの10本目です（これまでに[米国](/guide/research-us-web-agencies-ai-search-2026)・[英国](/guide/research-uk-web-agencies-ai-search-2026)・[オーストラリア](/guide/research-au-web-agencies-ai-search-2026)など）。日本と海外25の国・地域の全体の比較は[こちら](/guide/research-japan-vs-overseas-2026)です。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "ニュージーランドのWeb制作会社の自社サイト417件のうち、llms.txt があったのは25.4%（106件）。日本（13.4%）より高く（p<0.001）、オーストラリア（24.3%、p=0.68）・米国（23.1%、p=0.31）・英国（21.5%、p=0.13）とは差が見られませんでした。トップページが HTTP 202 を返した37件を除くと27.9%です。",
            "AI検索に関わる6項目をすべて満たすサイトは20.9%（87件）で、日本（10.4%）の2.0倍、オーストラリア（20.8%）とほぼ同じでした。6項目の平均は3.80（オーストラリア3.77・日本4.05）です。",
            "ドメイン別では、.co.nz のサイト132件の llms.txt は18.2%、.com のサイト122件は34.4%でした（p=0.005）。WordPress のサイトどうしで比べても20.9%と41.2%で（p=0.004）、差が残りました。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "対象：Web制作会社の自社サイト。当社の収集リストで国がニュージーランドとなっている制作会社サイト544件のうち、トップページに到達できた417件です。一般企業のサイト全体ではありません。比較には同じ調査のオーストラリア（1,719件）・米国（4,472件）・英国（942件）・日本（2,486件）・ニュージーランド以外の海外（12,935件）を使いました。",
            "取得したもの：各サイトのトップページ、/robots.txt、/llms.txt、/llms-full.txt を1回ずつ（User-Agent：NurevoSurvey/1.0）。2026年11月上旬〜12日に取得し、11月12日に集計しました。",
            "判定方法：llms.txt は、ステータス200で中身がHTMLではなく20文字を超えるテキストを「あり」としました。JSON-LD はトップページにあるかどうか、「壊れている」は JSON として読み込めないブロックが1つ以上あるもの。Organization系は @type に Organization・LocalBusiness・Corporation・ProfessionalService を含むもの。WordPress はトップページのHTMLに wp-content/・wp-includes/、または generator の WordPress 表記があるもの。SEOプラグインはトップページのHTMLの文字列で判定しました。",
            "AIボットのブロック：robots.txt で、各ボットに当てはまるグループの規則がトップページ（/）を Disallow にするか（最長一致）で判定しました。分母は robots.txt があるサイトです。「AIボットをブロック」は GPTBot・ClaudeBot・PerplexityBot・Google-Extended・CCBot・OAI-SearchBot のどれかをブロックしているものです。",
            "「6項目」は、(1) llms.txt がある、(2) JSON-LD がある、(3) Organization または LocalBusiness の型がある、(4) robots.txt があり GPTBot・ClaudeBot・PerplexityBot・OAI-SearchBot のどれもブロックしていない、(5) meta description がある、(6) canonical がある、のうち当てはまる数（0〜6）です。この調査のための単純な数で、Nurevo の0〜100点のスコアとは別物です。",
            "HTTP 202：ニュージーランドでは37件（到達した417件の8.9%）のトップページがステータス202を返しました（オーストラリア14.5%・米国15.0%・英国14.9%・日本0件）。これらには JSON-LD も WordPress の痕跡も robots.txt も llms.txt もなく、ボット確認などの別のページが返った可能性があります。そのため、202を除いた値も並べています。",
            "統計：ニュージーランドと他の地域の差はカイ二乗検定で確かめました。30件未満の区分は載せていません。地域（都市）は544件中470件が空欄のため分けていません。",
          ],
        },
        {
          heading: "結果：ニュージーランドとオーストラリア・米国・英国・日本の比較",
          paragraphs: [
            "ニュージーランドの値は、ほとんどの項目でオーストラリアと1ポイント前後の差しかなく、llms.txt・「6項目すべて」・AIボットのブロックのどれも、オーストラリア・米国・英国・ニュージーランド以外の海外全体との間に統計的な差は見られませんでした。FAQPage は7.4%で、オーストラリア（10.3%）より低めでしたが差ははっきりしません（p=0.09）。JSON-LD が壊れていたのは JSON-LD があるサイトの1.0%で、比べた地域の中ではいちばん低い値です。日本と比べると、llms.txt・FAQPage・「6項目すべて」が高く、meta description・canonical・robots.txt は低めです。低めの項目は202を返した37件の影響を受けており、202を除くと meta description 76.3%、canonical 85.3%、robots.txt 86.1% です。",
          ],
          table: {
            head: HEAD_JA,
            rows: COMPARE.map(([ja, , ...v]) => [ja, ...v]),
            caption: "Web制作会社の自社サイトで、トップページに到達できたもの。「AIボットをブロック」「AIボットに言及」の分母は robots.txt があるサイト（ニュージーランド327件〔202を除いても327件〕・オーストラリア1,336件・米国3,404件・英国699件・日本2,281件・ニュージーランド以外の海外10,143件）。2026年11月12日集計。",
          },
        },
        {
          heading: "ボット別のブロック率",
          paragraphs: [
            "ニュージーランドで robots.txt があるサイト327件について、ボットごとにトップページをブロックしている割合です。学習用とされるボット（CCBot・Bytespider・ClaudeBot・Google-Extended・GPTBot・anthropic-ai・Applebot-Extended）は4.6〜5.8%で、オーストラリア・米国・英国よりわずかに高く、日本の4〜5倍でした。ただし件数は15〜19件と小さい数です。検索用やユーザーの質問に答えるときに使われるボットは、OAI-SearchBot・ChatGPT-User・PerplexityBot が各2件、Claude-SearchBot が1件でした。Googlebot と Bingbot をブロックしていたのは同じ1件で、このサイトは調べた13のボットすべてをブロックしていました。",
          ],
          table: {
            head: ["ボット", "NZ（件数）", "ニュージーランド", "オーストラリア", "米国", "英国", "日本"],
            rows: BOTS,
            caption: "分母は robots.txt があるサイト（ニュージーランド327件・オーストラリア1,336件・米国3,404件・英国699件・日本2,281件）。トップページ（/）に対する判定。",
          },
        },
        {
          heading: "ブロックの中身（事実）",
          list: [
            "GPTBot をブロックしていた15件のうち13件（86.7%）は、OAI-SearchBot をブロックしていませんでした（オーストラリア56件中55件、米国128件中119件）。",
            "11種のAIボット（表の Googlebot・Bingbot 以外）のどれかをブロックしていた21件のうち13件（61.9%）は、GPTBot・ClaudeBot・anthropic-ai・Google-Extended・CCBot・Bytespider・Applebot-Extended の7つをまとめてブロックする同じ組み合わせでした（オーストラリア64.6%・米国58.5%）。CCBot だけ・Bytespider だけが各2件です。",
            "OAI-SearchBot・ChatGPT-User・Claude-SearchBot・PerplexityBot のどれかをブロックしていたのは2件（robots.txt があるサイトの0.6%）でした。",
            "robots.txt でAIボットの名前を挙げていながら、どれもトップページをブロックしていないサイトが13件ありました（robots.txt があるサイトの4.0%）。",
            "AIボットをブロックしていた21件のうち4件（19.0%）には llms.txt もありました。",
          ],
        },
        {
          heading: "ドメイン別：.co.nz と .com",
          paragraphs: [
            "到達できた417件のドメインは、.co.nz が132件、.com が122件、そのほかが163件でした（.co.nz 以外の .nz は27件で30件未満のため表に載せていません）。.co.nz のサイトは .com のサイトより llms.txt（18.2%・34.4%、p=0.005）も「6項目すべて」（13.6%・32.8%、p<0.001）も低めでした。WordPress の割合も .co.nz のほうが低い（68.9%・83.6%）ため、WordPress のサイトどうしでも比べましたが、llms.txt は20.9%（91件中）と41.2%（102件中）で差が残りました（p=0.004）。202を除いても20.0%と36.2%です（p=0.009）。",
            "この調査では、ドメインと取引先の地域（国内中心か海外中心か）の関係は調べていません。",
          ],
          table: {
            head: ["ドメイン", "件数", "WordPress", "llms.txt", "6項目すべて", "6項目の平均", "HTTP 202"],
            rows: DOMAINS.map(([ja, , ...v]) => [ja, ...v]),
            caption: "ニュージーランドで到達できた417件のうち、ドメインが .co.nz または .com のもの。括弧内は件数。",
          },
        },
        {
          heading: "構造化データの型",
          paragraphs: [
            "トップページの JSON-LD に含まれる型は、ニュージーランド・オーストラリア・米国・英国でよく似た並びでした。ニュージーランドは Organization（59.7%）が4か国でいちばん高い一方、LocalBusiness（10.6%）・GeoCoordinates（10.1%）・FAQPage（7.4%）はオーストラリアより低めです。日本との差が大きいのは WebPage（60.2%・34.4%）、SearchAction（58.0%・28.9%）、ProfessionalService（13.2%・5.6%）などです。",
          ],
          table: {
            head: ["@type", "ニュージーランド", "オーストラリア", "米国", "英国", "日本"],
            rows: TYPES,
            caption: "到達できたサイトのうち、トップページの JSON-LD にその型があった割合（入れ子の型も数えます）。ニュージーランド417件・オーストラリア1,719件・米国4,472件・英国942件・日本2,486件。",
          },
        },
        {
          heading: "WordPress とSEOプラグイン",
          paragraphs: [
            "ニュージーランドの制作会社サイトの75.3%（314件）が WordPress でした（202を除くと82.6%）。WordPress のサイトは llms.txt 31.8%、JSON-LD 89.8%、6項目の平均4.79 で、0項目のサイトはありませんでした。WordPress 以外（103件、うち37件が202）は llms.txt 5.8%、JSON-LD 10.7%、6項目の平均0.78 で、78件が0項目です。WordPress のサイトどうしの llms.txt は、米国（30.1%、p=0.56）・オーストラリア（30.7%、p=0.74）と差がなく、日本（14.0%）より高い値でした（p<0.001）。",
            "SEOプラグインは Yoast SEO が52.2%、Rank Math が20.7%、検出なしが21.3%でした。AIOSEO（16件）と SEOPress（2件）は30件未満のため表に載せていません。llms.txt があった割合は Rank Math 41.5%、Yoast SEO 29.3%、検出なし23.9% です。この調査では llms.txt をプラグインで作ったのか手で置いたのかは見ていません。",
          ],
          table: {
            head: ["SEOプラグイン", "NZの WordPress サイト", "llms.txt", "JSON-LD", "6項目の平均"],
            rows: PLUGINS,
            caption: "ニュージーランドの WordPress サイト314件。プラグインはトップページのHTMLの文字列で判定（Yoast → Rank Math → AIOSEO → SEOPress の順に最初に当てはまったもの）。30件未満の区分は省略。",
          },
        },
        {
          heading: "6項目の分布",
          paragraphs: [
            "ニュージーランドも、オーストラリア・米国・英国と同じく「0項目」（18.7%）と「5〜6項目」（合わせて57.8%）に分かれていました。0項目の一部は202を返したサイトで、202を除くと10.8%です。5項目のサイト154件のうち140件（90.9%）は、欠けていたのが llms.txt だけでした。llms.txt があった106件の行数の中央値は75行です。",
          ],
          table: {
            head: ["当てはまる項目数", "ニュージーランド", "NZ（202を除く）", "オーストラリア", "米国", "英国", "日本"],
            rows: DIST,
            caption: "到達できたサイトに占める割合。ニュージーランド417件（202を除く380件）、オーストラリア1,719件、米国4,472件、英国942件、日本2,486件。",
          },
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "この調査の数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。そのまま使える1文：",
          ],
          list: [
            "ニュージーランドのWeb制作会社の自社サイトの25.4%に llms.txt があった（日本13.4%、オーストラリア24.3%、米国23.1%）（Nurevo AEO 調査、2026年11月、417件）。",
            "ニュージーランドのWeb制作会社の自社サイトで、AI検索に関わる6項目をすべて満たしていたのは20.9%で、日本（10.4%）の2.0倍だった（Nurevo AEO 調査、2026年11月）。",
            "ニュージーランドのWeb制作会社のうち、.co.nz ドメインのサイトの llms.txt 導入率は18.2%で、.com ドメインのサイト（34.4%）より低かった（Nurevo AEO 調査、2026年11月）。",
            "ニュージーランドのWeb制作会社の自社サイトで robots.txt によりAIボットをブロックしていたのは5.8%で、検索用ボットのどれかをブロックしていたのは0.6%だった（Nurevo AEO 調査、2026年11月）。",
            "ニュージーランドのWeb制作会社の WordPress サイトの52.2%で Yoast SEO、20.7%で Rank Math が検出された（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "限界",
          list: [
            "対象はWeb制作会社の自社サイトで、一般企業のサイト全体ではありません。国は当社の収集リストの記載によるもので、ニュージーランドの制作会社全体を代表する標本ではありません。417件は米国やオーストラリアより小さく、ボット別やドメイン別の件数は小さい数です。",
            "トップページだけを見ています。robots.txt はトップページ（/）に対する判定で、一部のディレクトリだけのブロックや、ファイアウォール・CDN によるブロックは数えていません。llms.txt は有無と行数だけを見て、中身の質は見ていません。",
            "各サイト1回の取得で、到達できなかったサイト（127件）は除いています。HTTP 202 を返した37件は、実際のトップページとは違うページを見ている可能性があります。",
            "SEOプラグインはHTMLの文字列による判定で、痕跡を消している場合や複数入っている場合は正しく分けられません。",
            "今回の集計の一部には11月5日集計時の取得分を引き継いでいます。",
          ],
        },
        {
          heading: "当社の見方（意見）",
          paragraphs: [
            "ここからは事実ではなく当社の意見です。ニュージーランドの制作会社サイトは、どの項目でもオーストラリアとよく似た水準でした。目立ったのは .co.nz と .com の差で、.com のサイトに国外の取引先を意識した会社が多いといった理由が考えられますが、この調査では確かめていません。5項目のサイトの9割は llms.txt だけが欠けており、残りの1項目は比較的足しやすいものです。AIボットのブロックは少数で、ほとんどが学習用のボットに限っていました。どのボットを止めるかは各社の判断ですが、AI検索に出たい場合は、検索用のボットまで止めていないかを確かめる価値があります。どれを整えてもAIの回答に出ることが保証されるわけではありません（[別の調査](/guide/aeo-signals-ai-answers-study)では、サイト側の項目と登場の間に関係は見られませんでした）。",
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
        { q: "ニュージーランドの制作会社は日本よりAI検索への対応が進んでいますか？", a: "llms.txt（ニュージーランド25.4%・日本13.4%）と「6項目すべて」（20.9%・10.4%）はニュージーランドが高く、JSON-LD は70.3%と69.4%で差は見られませんでした。meta description や canonical は日本のほうが高めです（2026年11月、Web制作会社の自社サイト）。" },
        { q: "ニュージーランドとオーストラリアで違いはありますか？", a: "llms.txt（25.4%・24.3%）、6項目すべて（20.9%・20.8%）、AIボットのブロック（5.8%・4.7%）のどれも、統計的な差は見られませんでした。FAQPage はオーストラリアが高め（7.4%・10.3%）ですが、差ははっきりしません。" },
        { q: ".co.nz と .com で違いはありますか？", a: ".co.nz のサイト132件の llms.txt は18.2%、.com のサイト122件は34.4%で、.co.nz が低めでした（p=0.005）。WordPress のサイトどうしでも20.9%と41.2%で差が残りました。理由は調べていません。" },
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
      title: "AI Search Readiness of 417 New Zealand Web Agency Websites (2026) | Nurevo",
      description: "417 New Zealand web agency sites: 25.4% have an llms.txt (Japan 13.4%), 20.9% meet all six AI search items, and .co.nz sites trail .com on llms.txt (18.2% vs 34.4%).",
      h1: "AI search readiness of New Zealand web design agencies: 417 agency websites (November 2026)",
      lead: "We fetched the home page, robots.txt and llms.txt of 417 New Zealand web design agencies' own websites. 25.4% (106) had an llms.txt — higher than Japan (13.4%) and not statistically different from Australia (24.3%), the US (23.1%) or the UK (21.5%). 20.9% met all six AI-search items we checked, almost exactly Australia's 20.8% and twice Japan's share. Sites on a .co.nz domain trailed .com sites on both llms.txt (18.2% vs 34.4%) and meeting all six items (13.6% vs 32.8%).",
      intro: [
        "Published 2026-11-28. Data aggregated 2026-11-12. Research by Nurevo AEO (Bestie.合同会社), Japan. Nurevo sells AI search optimisation (AEO) tools and a WordPress plugin, and so has an interest in this topic. This is the tenth of our country reports (earlier ones include the [United States](/guide/research-us-web-agencies-ai-search-2026), the [United Kingdom](/guide/research-uk-web-agencies-ai-search-2026) and [Australia](/guide/research-au-web-agencies-ai-search-2026)). For Japan against all 25 overseas countries and regions, see [our comparison](/guide/research-japan-vs-overseas-2026).",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "25.4% (106) of 417 New Zealand web agency websites had an llms.txt. That is higher than Japan (13.4%, p < 0.001) and not statistically different from Australia (24.3%, p = 0.68), the US (23.1%, p = 0.31) or the UK (21.5%, p = 0.13). Excluding the 37 home pages that answered HTTP 202, the share is 27.9%.",
            "20.9% (87) of New Zealand sites met all six AI-search items we checked — 2.0 times Japan's 10.4% and almost identical to Australia (20.8%). The 6-item average was 3.80 (Australia 3.77, Japan 4.05).",
            "By domain, 18.2% of 132 .co.nz sites had an llms.txt, against 34.4% of 122 .com sites (p = 0.005). Comparing WordPress sites only, the gap remained: 20.9% vs 41.2% (p = 0.004).",
          ],
        },
        {
          heading: "Method",
          list: [
            "Population: web design agencies' own websites. Of 544 agency sites listed as New Zealand in our collection list, 417 home pages could be reached. This is not a sample of New Zealand businesses in general. For comparison we use the same survey's Australia (1,719), US (4,472), UK (942), Japan (2,486) and all overseas sites outside New Zealand (12,935).",
            "Fetched: each site's home page, /robots.txt, /llms.txt and /llms-full.txt, once each (User-Agent: NurevoSurvey/1.0), early November to 12 November 2026; aggregated 2026-11-12.",
            "Classification: llms.txt = HTTP 200, not HTML, more than 20 characters. JSON-LD = present on the home page; \"broken\" = at least one block that does not parse as JSON. Organization-type = an @type of Organization, LocalBusiness, Corporation or ProfessionalService. WordPress = the home page HTML contains wp-content/ or wp-includes/, or a WordPress generator tag. SEO plugins were identified from strings in the home page HTML.",
            "AI bot blocking: whether the robots.txt rules that apply to each bot disallow the home page (/) (longest match); the base is sites with a robots.txt. \"Blocks an AI bot\" = blocks any of GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot or OAI-SearchBot.",
            "The six items: (1) has an llms.txt; (2) has JSON-LD; (3) has an Organization or LocalBusiness type; (4) has a robots.txt that blocks none of GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot; (5) has a meta description; (6) has a canonical link. The count (0–6) is a simple measure made for this survey, not Nurevo's 0–100 product score.",
            "HTTP 202: 37 New Zealand home pages (8.9% of the 417 reached) answered with status 202 (Australia 14.5%, US 15.0%, UK 14.9%, Japan none). None of them had JSON-LD, WordPress markers, a robots.txt or an llms.txt, so they may have returned a bot-check or other interim page. We therefore also show figures excluding them.",
            "Statistics: differences between New Zealand and other groups were tested with chi-square tests. Groups with fewer than 30 sites are not shown. Region or city was blank for 470 of the 544 listed sites, so we did not split by region.",
          ],
        },
        {
          heading: "Results: New Zealand compared with Australia, the US, the UK and Japan",
          paragraphs: [
            "On most items New Zealand was within about a point of Australia. On llms.txt, all six items and AI bot blocking we found no statistically significant difference from Australia, the US, the UK or all overseas sites outside New Zealand. FAQPage was 7.4%, below Australia's 10.3%, but the difference was not clear-cut (p = 0.09). Broken JSON-LD affected 1.0% of sites with JSON-LD, the lowest of the groups compared. Against Japan, New Zealand was higher on llms.txt, FAQPage and all six items, and lower on meta descriptions, canonical links and robots.txt. Those lower values partly reflect the 37 HTTP 202 pages; excluding them, meta description is 76.3%, canonical 85.3% and robots.txt 86.1%.",
          ],
          table: {
            head: HEAD_EN,
            rows: COMPARE.map(([, en, ...v]) => [en, ...v]),
            caption: "Web design agencies' own websites whose home page could be reached. \"Blocks an AI bot\" and \"names an AI bot\" are shares of sites with a robots.txt (New Zealand 327, also 327 excluding 202; Australia 1,336; US 3,404; UK 699; Japan 2,281; other overseas 10,143). Aggregated 2026-11-12.",
          },
        },
        {
          heading: "Blocking by bot",
          paragraphs: [
            "Share of the 327 New Zealand sites with a robots.txt that block each bot from the home page. Crawlers generally described as training crawlers (CCBot, Bytespider, ClaudeBot, Google-Extended, GPTBot, anthropic-ai, Applebot-Extended) were blocked by 4.6–5.8% — slightly above Australia, the US and the UK, and four to five times Japan — though these are small counts of 15 to 19 sites. Among bots used for search or for fetching pages when a user asks, OAI-SearchBot, ChatGPT-User and PerplexityBot were each blocked by 2 sites and Claude-SearchBot by 1. The single site blocking Googlebot and Bingbot blocked all 13 bots we checked.",
          ],
          table: {
            head: ["Bot", "NZ (sites)", "New Zealand", "Australia", "US", "UK", "Japan"],
            rows: BOTS,
            caption: "Base: sites with a robots.txt (New Zealand 327; Australia 1,336; US 3,404; UK 699; Japan 2,281). Judged for the home page (/).",
          },
        },
        {
          heading: "What the blocking looks like (facts)",
          list: [
            "13 of the 15 sites blocking GPTBot (86.7%) did not block OAI-SearchBot (Australia 55 of 56, US 119 of 128).",
            "Of the 21 sites blocking any of the 11 AI bots in the table (all except Googlebot and Bingbot), 13 (61.9%) used the same combination: GPTBot, ClaudeBot, anthropic-ai, Google-Extended, CCBot, Bytespider and Applebot-Extended, all seven together (Australia 64.6%, US 58.5%). CCBot alone and Bytespider alone accounted for 2 sites each.",
            "2 sites (0.6% of those with a robots.txt) blocked any of OAI-SearchBot, ChatGPT-User, Claude-SearchBot or PerplexityBot.",
            "13 sites (4.0% of those with a robots.txt) named an AI bot in robots.txt but blocked none from the home page.",
            "4 of the 21 sites blocking an AI bot (19.0%) also had an llms.txt.",
          ],
        },
        {
          heading: "By domain: .co.nz and .com",
          paragraphs: [
            "Of the 417 reachable sites, 132 used .co.nz, 122 used .com and 163 used other domains (other .nz domains numbered 27, below our 30-site threshold, and are not shown). .co.nz sites were lower than .com sites on both llms.txt (18.2% vs 34.4%, p = 0.005) and meeting all six items (13.6% vs 32.8%, p < 0.001). Because WordPress was also less common on .co.nz (68.9% vs 83.6%), we compared WordPress sites only: llms.txt was 20.9% (of 91) vs 41.2% (of 102), so the gap remained (p = 0.004). Excluding HTTP 202, the figures were 20.0% and 36.2% (p = 0.009).",
            "We did not examine how domain choice relates to where an agency's clients are (mainly domestic or mainly overseas).",
          ],
          table: {
            head: ["Domain", "Sites", "WordPress", "llms.txt", "All 6 items", "6-item average", "HTTP 202"],
            rows: DOMAINS.map(([, en, ...v]) => [en, ...v]),
            caption: "New Zealand sites reached whose domain is .co.nz or .com. Counts in brackets.",
          },
        },
        {
          heading: "Structured data types",
          paragraphs: [
            "The @types found in home page JSON-LD followed a very similar pattern in New Zealand, Australia, the US and the UK. New Zealand had the highest Organization share of the four (59.7%), while LocalBusiness (10.6%), GeoCoordinates (10.1%) and FAQPage (7.4%) were below Australia. The largest gaps with Japan were WebPage (60.2% vs 34.4%), SearchAction (58.0% vs 28.9%) and ProfessionalService (13.2% vs 5.6%).",
          ],
          table: {
            head: ["@type", "New Zealand", "Australia", "US", "UK", "Japan"],
            rows: TYPES,
            caption: "Share of reachable sites whose home page JSON-LD contains the type (nested types included). New Zealand 417; Australia 1,719; US 4,472; UK 942; Japan 2,486.",
          },
        },
        {
          heading: "WordPress and SEO plugins",
          paragraphs: [
            "75.3% (314) of New Zealand agency sites ran WordPress (82.6% excluding HTTP 202). WordPress sites had llms.txt 31.8%, JSON-LD 89.8% and a 6-item average of 4.79, and none scored zero. Non-WordPress sites (103, of which 37 answered 202) had llms.txt 5.8%, JSON-LD 10.7% and an average of 0.78; 78 of them scored zero. Among WordPress sites, New Zealand's llms.txt share was in line with the US (30.1%, p = 0.56) and Australia (30.7%, p = 0.74) and above Japan (14.0%, p < 0.001).",
            "Yoast SEO was detected on 52.2% of WordPress sites, Rank Math on 20.7%, and no plugin on 21.3%. AIOSEO (16 sites) and SEOPress (2) are below our 30-site threshold and not shown. llms.txt adoption: Rank Math 41.5%, Yoast SEO 29.3%, no plugin detected 23.9%. We did not check whether the llms.txt was generated by a plugin or added by hand.",
          ],
          table: {
            head: ["SEO plugin", "NZ WordPress sites", "llms.txt", "JSON-LD", "6-item average"],
            rows: PLUGINS,
            caption: "314 New Zealand WordPress sites. Plugin = the first match in the home page HTML in the order Yoast → Rank Math → AIOSEO → SEOPress. Groups under 30 sites omitted.",
          },
        },
        {
          heading: "Distribution of the six items",
          paragraphs: [
            "Like Australia, the US and the UK, New Zealand split into 0 items (18.7%) and 5–6 items (57.8% combined). Part of the zeros are HTTP 202 pages; excluding them, 0 items falls to 10.8%. Of the 154 sites with five items, 140 (90.9%) were missing only the llms.txt. The 106 llms.txt files had a median length of 75 lines.",
          ],
          table: {
            head: ["Items met", "New Zealand", "NZ (excl. 202)", "Australia", "US", "UK", "Japan"],
            rows: DIST,
            caption: "Share of reachable sites. New Zealand 417 (excl. 202: 380); Australia 1,719; US 4,472; UK 942; Japan 2,486.",
          },
        },
        {
          heading: "Citing this survey",
          paragraphs: [
            "You may quote and republish the figures and tables freely, as long as you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. Sentences ready to quote:",
          ],
          list: [
            "25.4% of New Zealand web design agencies' own websites had an llms.txt file, compared with 13.4% in Japan, 24.3% in Australia and 23.1% in the US (Nurevo AEO survey, November 2026, 417 New Zealand sites).",
            "20.9% of New Zealand web agency websites met all six AI-search readiness items checked, twice the share in Japan (10.4%) (Nurevo AEO survey, November 2026).",
            "Among New Zealand web agencies, 18.2% of .co.nz websites had an llms.txt file, compared with 34.4% of .com websites (Nurevo AEO survey, November 2026).",
            "5.8% of New Zealand web agency websites blocked an AI bot in robots.txt, and 0.6% blocked any AI search crawler (Nurevo AEO survey, November 2026).",
            "Yoast SEO was detected on 52.2% of New Zealand web agencies' WordPress sites and Rank Math on 20.7% (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Limitations",
          list: [
            "The population is web design agencies' own websites, not businesses in general. Country comes from our collection list, and the sample is not representative of all New Zealand agencies. At 417 sites it is smaller than the US or Australian samples, and per-bot and per-domain counts are small numbers.",
            "Only the home page was examined. robots.txt was judged for / only; partial blocking and blocking by firewalls or CDNs were not counted. For llms.txt we checked only whether it exists and its line count, not its quality.",
            "One fetch per site; unreachable sites (127) are excluded. The 37 HTTP 202 responses may not reflect the real home page.",
            "SEO plugins were detected from HTML strings; sites that hide plugin markers or run several plugins may be misclassified.",
            "Part of this aggregation reuses fetches from the 5 November run.",
          ],
        },
        {
          heading: "Our reading (opinion)",
          paragraphs: [
            "What follows is our opinion, not a finding. New Zealand agency sites look very much like Australian ones on every item. The notable pattern is the .co.nz vs .com gap; one possible explanation is that agencies on .com are more often aiming at overseas clients, but this survey did not test that. Nine in ten sites with five items lacked only an llms.txt, which is a relatively easy item to add. AI bot blocking is a minority practice, and where it happens it is almost always limited to training crawlers. Which bots to block is each site owner's decision, but sites that want to appear in AI search may want to confirm they are not blocking search crawlers by accident. None of this guarantees appearing in AI answers (in [another of our studies](/guide/aeo-signals-ai-answers-study), on-site signals showed no relationship with appearance).",
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
        { q: "Are New Zealand agencies ahead of Japan on AI search readiness?", a: "On llms.txt (New Zealand 25.4%, Japan 13.4%) and on meeting all six items (20.9% vs 10.4%), yes. JSON-LD is about the same (70.3% vs 69.4%), and Japan is higher on meta descriptions and canonical links (November 2026, agencies' own websites)." },
        { q: "How does New Zealand compare with Australia?", a: "We found no statistically significant difference on llms.txt (25.4% vs 24.3%), all six items (20.9% vs 20.8%) or AI bot blocking (5.8% vs 4.7%). FAQPage markup was somewhat more common in Australia (10.3% vs 7.4%), but the difference was not clear-cut." },
        { q: "Is there a difference between .co.nz and .com agency sites?", a: "Yes. 18.2% of 132 .co.nz sites had an llms.txt, against 34.4% of 122 .com sites (p = 0.005), and the gap remained among WordPress sites only (20.9% vs 41.2%). We did not investigate why." },
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
