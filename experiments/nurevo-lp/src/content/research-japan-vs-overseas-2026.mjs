// Content page: research report (Japan vs overseas). AI search readiness of
// web design agencies' own websites in Japan compared with 25 overseas
// countries/regions combined and one by one. November 2026.
//
// Every number here comes from nurevo-outreach data/survey/raw_2026-11-12.json
// (survey.js; the same run as summary_2026-11-12.json — Japan = summary.japan:
// 2,486 reached, llms.txt 13.4%, JSON-LD 69.4%; overseas = summary.intl:
// 13,352 reached, llms.txt 26.4%, JSON-LD 72.0%). "Overseas excl. HTTP 202"
// drops the 1,477 overseas home pages answered with status 202 (none had
// JSON-LD or WordPress markers; 63 had a robots.txt). Japan had none.
// English-speaking 6 = US, GB, CA, AU, NZ, IE (country = the "co" field of our
// collection list). Country table: excl. 202, 30+ reachable sites (Belgium,
// 28, left out); the blocking column needs 30+ sites with robots.txt.
// Definitions follow survey.js (see the US report header). p = 2x2 chi-square,
// Japan vs overseas excl. 202. Do not add a figure that is not in that data.
// The raw file holds company names and domains: never publish them.

const COMPARE = [
  ["到達件数", "Sites reached", "2,486", "13,352", "11,875", "7,461", "4,414", "—"],
  ["WordPress", "WordPress", "92.3%", "75.5%", "84.9%", "86.7%", "81.9%", "<0.001"],
  ["llms.txt", "llms.txt", "13.4%", "26.4%", "29.6%", "27.0%", "34.0%", "<0.001"],
  ["llms-full.txt", "llms-full.txt", "0.6%", "1.8%", "2.0%", "1.7%", "2.6%", "<0.001"],
  ["JSON-LD", "JSON-LD", "69.4%", "72.0%", "81.0%", "80.9%", "81.1%", "<0.001"],
  ["JSON-LD が壊れている（JSON-LD があるサイト中）", "Broken JSON-LD (of sites with JSON-LD)", "1.7%", "1.8%", "1.8%", "1.6%", "2.2%", "0.65"],
  ["Organization系の型", "Organization-type", "58.9%", "63.6%", "71.5%", "70.3%", "73.5%", "<0.001"],
  ["LocalBusiness", "LocalBusiness", "5.4%", "12.3%", "13.9%", "14.3%", "13.1%", "<0.001"],
  ["FAQPage", "FAQPage", "3.9%", "9.4%", "10.5%", "8.7%", "13.5%", "<0.001"],
  ["microdata（schema.org）", "Microdata (schema.org)", "7.8%", "19.6%", "22.0%", "21.7%", "22.7%", "<0.001"],
  ["meta description", "Meta description", "90.7%", "71.5%", "80.3%", "79.9%", "81.0%", "<0.001"],
  ["og:title", "og:title", "81.3%", "72.4%", "81.4%", "81.4%", "81.4%", "0.93"],
  ["canonical", "Canonical link", "84.6%", "76.4%", "85.9%", "86.5%", "84.8%", "0.11"],
  ["robots.txt", "robots.txt", "91.8%", "78.4%", "87.6%", "87.9%", "87.1%", "<0.001"],
  ["robots.txt に Sitemap（robots.txt があるサイト中）", "Sitemap line in robots.txt (of sites with robots.txt)", "92.4%", "86.9%", "87.0%", "85.1%", "90.4%", "<0.001"],
  ["robots.txt でAIボットに言及（同）", "robots.txt names an AI bot (same base)", "2.5%", "11.8%", "11.6%", "9.2%", "15.5%", "<0.001"],
  ["AIボットをブロック（同）", "Blocks an AI bot (same base)", "1.3%", "5.1%", "4.9%", "4.2%", "6.2%", "<0.001"],
  ["6項目の平均", "6-item average", "4.05", "3.83", "4.30", "4.27", "4.34", "—"],
  ["6項目すべて", "All 6 items", "10.4%", "21.8%", "24.5%", "22.5%", "28.0%", "<0.001"],
  ["5項目以上", "5+ items", "52.2%", "58.2%", "65.4%", "64.4%", "67.1%", "<0.001"],
];
// [rank, ja, en, sites, llms.txt, JSON-LD, all 6, blocks AI bot, 6-item avg]
const COUNTRIES = [
  ["1", "シンガポール", "Singapore", "594", "41.9%", "87.2%", "35.0%", "5.4%", "4.70"],
  ["2", "インド", "India", "1,531", "37.2%", "85.6%", "30.3%", "5.8%", "4.60"],
  ["3", "ブラジル", "Brazil", "252", "35.3%", "77.4%", "26.2%", "5.5%", "4.25"],
  ["4", "フィリピン", "Philippines", "225", "33.8%", "85.8%", "28.9%", "7.2%", "4.57"],
  ["5", "スペイン", "Spain", "234", "33.8%", "73.1%", "29.1%", "5.6%", "3.89"],
  ["6", "コロンビア", "Colombia", "79", "31.6%", "62.0%", "22.8%", "10.2%", "3.53"],
  ["7", "南アフリカ", "South Africa", "373", "30.6%", "77.7%", "25.5%", "7.5%", "4.07"],
  ["8", "台湾", "Taiwan", "59", "30.5%", "71.2%", "20.3%", "13.0%", "3.90"],
  ["9", "アルゼンチン", "Argentina", "74", "29.7%", "59.5%", "21.6%", "12.5%", "3.43"],
  ["10", "豪州", "Australia", "1,469", "28.4%", "83.5%", "24.3%", "4.4%", "4.40"],
  ["11", "ニュージーランド", "New Zealand", "380", "27.9%", "77.1%", "22.9%", "5.8%", "4.17"],
  ["12", "米国", "United States", "3,801", "27.2%", "81.1%", "22.3%", "4.0%", "4.29"],
  ["13", "フランス", "France", "398", "26.9%", "91.7%", "24.4%", "1.9%", "4.80"],
  ["14", "オランダ", "Netherlands", "112", "26.8%", "83.9%", "21.4%", "7.6%", "4.15"],
  ["15", "ポルトガル", "Portugal", "45", "26.7%", "57.8%", "24.4%", "—", "3.09"],
  ["16", "カナダ", "Canada", "786", "26.5%", "78.6%", "21.9%", "3.5%", "4.14"],
  ["17", "香港", "Hong Kong", "65", "26.2%", "81.5%", "21.5%", "5.2%", "4.28"],
  ["18", "イタリア", "Italy", "85", "25.9%", "63.5%", "22.4%", "8.2%", "3.48"],
  ["19", "韓国", "South Korea", "35", "25.7%", "62.9%", "20.0%", "15.6%", "3.74"],
  ["20", "英国", "United Kingdom", "802", "25.3%", "80.8%", "20.8%", "4.6%", "4.24"],
  ["21", "マレーシア", "Malaysia", "78", "24.4%", "52.6%", "19.2%", "16.7%", "2.86"],
  ["22", "アイルランド", "Ireland", "223", "23.3%", "74.9%", "20.6%", "3.3%", "3.90"],
  ["23", "メキシコ", "Mexico", "104", "23.1%", "61.5%", "20.2%", "4.1%", "3.41"],
  ["24", "チリ", "Chile", "43", "16.3%", "46.5%", "9.3%", "—", "2.49"],
  ["25", "日本", "Japan", "2,486", "13.4%", "69.4%", "10.4%", "1.3%", "4.05"],
];
const BOTS = [
  ["CCBot", "25", "1.1%", "490", "4.7%"],
  ["Bytespider", "25", "1.1%", "484", "4.7%"],
  ["GPTBot", "28", "1.2%", "448", "4.3%"],
  ["Google-Extended", "25", "1.1%", "418", "4.0%"],
  ["ClaudeBot", "22", "1.0%", "418", "4.0%"],
  ["anthropic-ai", "23", "1.0%", "391", "3.8%"],
  ["Applebot-Extended", "22", "1.0%", "394", "3.8%"],
  ["ChatGPT-User", "2", "0.1%", "31", "0.3%"],
  ["PerplexityBot", "2", "0.1%", "29", "0.3%"],
  ["OAI-SearchBot", "0", "0.0%", "21", "0.2%"],
  ["Claude-SearchBot", "0", "0.0%", "18", "0.2%"],
  ["Googlebot", "0", "0.0%", "9", "0.1%"],
  ["Bingbot", "0", "0.0%", "9", "0.1%"],
];
const WP = [
  ["日本・WordPress", "Japan, WordPress", "2,295", "14.0%", "72.9%", "10.8%", "4.21"],
  ["海外・WordPress", "Overseas, WordPress", "10,081", "33.1%", "92.5%", "28.0%", "4.87"],
  ["日本・WordPress以外", "Japan, not WordPress", "191", "6.3%", "28.3%", "4.7%", "2.14"],
  ["海外・WordPress以外", "Overseas, not WordPress", "1,794", "10.1%", "16.4%", "4.7%", "1.09"],
];
const PLUGINS = [
  ["Yoast SEO", "331 (14.4%)", "20.5%", "5,356 (53.1%)", "30.8%"],
  ["All in One SEO (AIOSEO)", "807 (35.2%)", "19.3%", "614 (6.1%)", "51.1%"],
  ["Rank Math", "40 (1.7%)", "22.5%", "2,237 (22.2%)", "40.8%"],
  ["検出なし / none detected", "1,115 (48.6%)", "7.7%", "1,798 (17.8%)", "24.2%"],
];
const DIST = [
  ["0", "1.6%", "10.0%", "19.6%"],
  ["1", "4.8%", "2.4%", "2.4%"],
  ["2", "10.7%", "4.6%", "4.1%"],
  ["3", "15.4%", "3.7%", "3.3%"],
  ["4", "15.3%", "14.0%", "12.4%"],
  ["5", "41.8%", "40.9%", "36.4%"],
  ["6", "10.4%", "24.5%", "21.8%"],
];

const HEAD_JA = ["項目", "日本", "海外（全体）", "海外（202を除く）", "英語圏6か国", "その他の国・地域", "p値"];
const HEAD_EN = ["Item", "Japan", "Overseas (all)", "Overseas (excl. 202)", "English-speaking 6", "Other countries", "p"];

export default {
  slug: "research-japan-vs-overseas-2026",
  targetQueries: [
    "日本 海外 Web制作会社 AI検索 対応 比較 調査",
    "llms.txt 導入率 日本 海外 比較",
    "AI検索対策 日本 遅れ 調査データ",
    "Japan vs overseas web agencies AI search readiness",
    "llms.txt adoption by country 2026",
  ],
  related: ["research-japan-web-agencies-ai-search-2026", "research-us-web-agencies-ai-search-2026", "research-wordpress-seo-plugins-2026", "research-ai-readiness-score-distribution-2026", "llms-txt"],
  locales: {
    ja: {
      title: "日本と海外のWeb制作会社1.5万件のAI検索対応を比較【2026年11月】 | Nurevo",
      description: "日本と海外25の国・地域のWeb制作会社サイト15,838件を比較。llms.txt は日本13.4%・海外29.6%で日本は最下位。meta description と robots.txt は日本が上でした。",
      h1: "日本と海外のWeb制作会社の自社サイト15,838件に見るAI検索への対応の差（2026年11月）",
      lead: "日本のWeb制作会社の自社サイト2,486件と、海外25の国・地域の制作会社サイト13,352件のトップページ・robots.txt・llms.txt を同じ方法で調べました。llms.txt があったのは日本13.4%、海外29.6%（トップページが HTTP 202 を返したサイトを除く）で、比べた25の国・地域の中で日本が最も低い値でした。一方、meta description（日本90.7%・海外80.3%）や robots.txt（91.8%・87.6%）は日本のほうが高く、日本の「5項目は満たしているサイト」1,039件の94.9%は、欠けているのが llms.txt だけでした。",
      intro: [
        "公開：2026年11月26日。データ：2026年11月12日集計。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策（AEO）のツールと WordPress プラグインを提供しており、この分野に利害があります。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "llms.txt があったのは、日本の制作会社サイトで13.4%（2,486件中333件）、海外で26.4%（13,352件中3,522件）、HTTP 202 を返した1,477件を除くと29.6%でした（p<0.001）。30件以上ある25の国・地域で比べると、日本は最下位（25位）で、1位はシンガポール（41.9%）でした。",
            "AI検索に関わる6項目をすべて満たすサイトは、日本10.4%、海外24.5%（202を除く）。ただし日本で5項目を満たすサイト1,039件のうち986件（94.9%）は、足りないのが llms.txt だけでした。6項目の平均は日本4.05、海外（202を除く）4.30です。",
            "meta description（日本90.7%・海外80.3%）、robots.txt（91.8%・87.6%）は日本のほうが高く、og:title（81.3%・81.4%）と canonical（84.6%・85.9%）は統計的な差がありませんでした。robots.txt でAIボットをブロックしていたのは日本1.3%・海外4.9%で、検索用のボット（OAI-SearchBot・Claude-SearchBot・PerplexityBot）をブロックしていたのはどちらも0.3%以下でした。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "対象：Web制作会社の自社サイト。当社の収集リストにある日本の制作会社サイト3,352件と、海外の制作会社サイト20,335件のうち、トップページに到達できた日本2,486件・海外13,352件（合計15,838件）です。一般企業のサイト全体ではありません。国・地域は収集リストの記載によります。",
            "取得したもの：各サイトのトップページ、/robots.txt、/llms.txt、/llms-full.txt を1回ずつ（User-Agent：NurevoSurvey/1.0）。2026年11月上旬〜12日に取得し、11月12日に集計しました。",
            "判定方法：llms.txt は、ステータス200で中身がHTMLではなく20文字を超えるテキストを「あり」としました。JSON-LD はトップページにあるかどうか、「壊れている」は JSON として読み込めないブロックが1つ以上あるもの。Organization系は @type に Organization・LocalBusiness・Corporation・ProfessionalService を含むもの。WordPress はトップページのHTMLに wp-content/・wp-includes/、または generator の WordPress 表記があるもの。",
            "AIボットのブロック：robots.txt で、各ボットに当てはまるグループの規則がトップページ（/）を Disallow にするか（最長一致）で判定しました。分母は robots.txt があるサイトです。「AIボットをブロック」は GPTBot・ClaudeBot・PerplexityBot・Google-Extended・CCBot・OAI-SearchBot のどれかをブロックしているものです。",
            "「6項目」は、(1) llms.txt がある、(2) JSON-LD がある、(3) Organization または LocalBusiness の型がある、(4) robots.txt があり GPTBot・ClaudeBot・PerplexityBot・OAI-SearchBot のどれもブロックしていない、(5) meta description がある、(6) canonical がある、のうち当てはまる数（0〜6）です。この調査のための単純な数え方で、Nurevo の製品のスコア（0〜100）とは別のものです。",
            "HTTP 202：海外では1,477件（米国671件・豪州250件・英国140件など）のトップページがステータス202を返しました（日本は0件）。これらのページには JSON-LD も WordPress の痕跡もなく、ボット確認などの別のページが返った可能性があります。そのため、海外は「全体」と「202を除く（11,875件）」の両方を載せ、日本との比較と国別の表は202を除いた値を使っています。",
            "英語圏6か国は米国・英国・カナダ・豪州・ニュージーランド・アイルランド（202を除いて7,461件）、その他の国・地域はそれ以外の19の国・地域（4,414件）です。p値は日本と海外（202を除く）の2×2のカイ二乗検定です。",
          ],
        },
        {
          heading: "結果：日本と海外の比較",
          paragraphs: [
            "日本が低かったのは llms.txt・JSON-LD・Organization系の型・LocalBusiness・FAQPage・microdata で、高かったのは WordPress の割合・meta description・robots.txt と、その中の Sitemap の記載でした。og:title・canonical と、JSON-LD が壊れている割合（日本1.7%・海外1.8%）には統計的な差がありませんでした。英語圏6か国とその他の国・地域を比べると、llms.txt（27.0%・34.0%）・FAQPage（8.7%・13.5%）・6項目すべて（22.5%・28.0%）は英語圏以外のほうが高めでした。",
          ],
          table: {
            head: HEAD_JA,
            rows: COMPARE.map(([ja, , ...v]) => [ja, ...v]),
            caption: "Web制作会社の自社サイトで、トップページに到達できたもの。「（robots.txt があるサイト中）」「（同）」の分母は robots.txt があるサイト（日本2,281件・海外全体10,470件・202を除く10,407件・英語圏6か国6,561件・その他3,846件）。JSON-LD が壊れている割合の分母は JSON-LD があるサイト（日本1,726件・海外9,615件）。p値は日本と海外（202を除く）の比較。2026年11月12日集計。",
          },
        },
        {
          heading: "国・地域別：llms.txt の導入率の順位",
          paragraphs: [
            "到達できたサイトが30件以上ある25の国・地域を、llms.txt の導入率の高い順に並べました（海外は202を除いた値）。日本は llms.txt（13.4%）と「6項目すべて」（10.4%）で25の中で最も低いか、それに近い値でした（6項目すべては24位、最下位はチリの9.3%）。JSON-LD は17位、6項目の平均は14位で、中位でした。AIボットのブロック（1.3%）は25の中で最も低い値でした。",
          ],
          table: {
            head: ["順位", "国・地域", "サイト数", "llms.txt", "JSON-LD", "6項目すべて", "AIボットをブロック", "6項目の平均"],
            rows: COUNTRIES.map(([r, ja, , ...v]) => [r, ja, ...v]),
            caption: "海外は HTTP 202 を除いた値。「AIボットをブロック」の分母は robots.txt があるサイトで、30件未満のポルトガル・チリは「—」。サイト数が100件未満の国・地域は値の振れが大きいので、順位は目安として見てください。",
          },
        },
        {
          heading: "ボット別のブロック率",
          paragraphs: [
            "robots.txt があるサイトについて、ボットごとにトップページをブロックしている割合です。海外も日本も、ブロックされていたのは学習用とされるボット（CCBot・Bytespider・GPTBot・Google-Extended・ClaudeBot など）が中心で、ユーザーの質問に答えるときや検索用に使われるボット（ChatGPT-User・PerplexityBot・OAI-SearchBot・Claude-SearchBot）は0.3%以下でした。",
            "GPTBot をブロックしていたサイトのうち、OAI-SearchBot はブロックしていなかったのは、日本で28件中28件、海外（202を除く）で448件中429件（95.8%）でした。",
          ],
          table: {
            head: ["ボット", "日本（件数）", "日本", "海外（件数）", "海外"],
            rows: BOTS,
            caption: "分母は robots.txt があるサイト（日本2,281件・海外〔202を除く〕10,407件）。トップページ（/）に対する判定。",
          },
        },
        {
          heading: "WordPress かどうかで分けた比較",
          paragraphs: [
            "日本の制作会社サイトは92.3%が WordPress で、海外（202を除く）の84.9%より多くありました。WordPress のサイトどうしで比べても、llms.txt（日本14.0%・海外33.1%）と JSON-LD（72.9%・92.5%）は日本のほうが低く、差は WordPress の割合の違いだけでは説明できませんでした。",
          ],
          table: {
            head: ["区分", "サイト数", "llms.txt", "JSON-LD", "6項目すべて", "6項目の平均"],
            rows: WP.map(([ja, , ...v]) => [ja, ...v]),
            caption: "海外は HTTP 202 を除いた値。",
          },
        },
        {
          heading: "SEOプラグインの違い",
          paragraphs: [
            "WordPress のサイトで検出したSEOプラグインは、日本では AIOSEO（35.2%）が最も多く、プラグインを検出できなかったサイトが48.6%ありました。海外では Yoast SEO（53.1%）と Rank Math（22.2%）が多く、検出できなかったサイトは17.8%でした。同じプラグインどうしでも llms.txt の割合は日本のほうが低く、AIOSEO では日本19.3%・海外51.1%でした。この調査では llms.txt をプラグインで作ったのか手で置いたのかは見ていません。",
          ],
          table: {
            head: ["SEOプラグイン", "日本：サイト数（WordPress中）", "日本：llms.txt", "海外：サイト数（WordPress中）", "海外：llms.txt"],
            rows: PLUGINS,
            caption: "WordPress のサイト（日本2,295件・海外〔202を除く〕10,081件）。プラグインはトップページのHTMLの文字列で判定（Yoast → Rank Math → AIOSEO → SEOPress の順に最初に当てはまったもの）。SEOPress は日本1件のため表から外しました。",
          },
        },
        {
          heading: "6項目の分布",
          paragraphs: [
            "日本は3〜5項目の層が厚く（合わせて72.5%）、0項目は1.6%、6項目すべては10.4%でした。海外（202を除く）は5〜6項目が65.4%と多い一方、0項目も10.0%ありました。日本で5項目のサイト1,039件のうち、欠けていた項目は llms.txt が986件（94.9%）、Organization系の型が38件、それ以外は各10件未満でした。",
          ],
          table: {
            head: ["当てはまる項目数", "日本", "海外（202を除く）", "海外（全体）"],
            rows: DIST,
            caption: "到達できたサイトに占める割合。日本2,486件、海外（202を除く）11,875件、海外（全体）13,352件。",
          },
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "この調査の数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。そのまま使える1文：",
          ],
          list: [
            "日本のWeb制作会社の自社サイトで llms.txt があったのは13.4%で、海外（29.6%）の半分以下だった（Nurevo AEO 調査、2026年11月、日本2,486件・海外11,875件）。",
            "llms.txt の導入率を25の国・地域で比べると、日本のWeb制作会社サイトは最下位だった（Nurevo AEO 調査、2026年11月）。",
            "日本のWeb制作会社サイトのうち、AI検索に関わる6項目のうち5項目を満たすサイトの94.9%は、欠けているのが llms.txt だけだった（Nurevo AEO 調査、2026年11月）。",
            "meta description があるWeb制作会社サイトは日本90.7%・海外80.3%で、日本のほうが高かった（Nurevo AEO 調査、2026年11月）。",
            "robots.txt でAIボットをブロックしていたWeb制作会社サイトは日本1.3%・海外4.9%で、検索用ボットのブロックはどちらも0.3%以下だった（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "限界",
          list: [
            "対象はWeb制作会社の自社サイトで、一般企業のサイト全体ではありません。国・地域は当社の収集リストの記載によるもので、各国の制作会社全体を代表する標本ではありません。国によって件数の差が大きく、100件未満の国・地域もあります。",
            "トップページだけを見ています。robots.txt はトップページ（/）に対する判定で、一部のディレクトリだけのブロックや、ファイアウォール・CDN によるブロックは数えていません。llms.txt は有無だけを見て、中身の質は見ていません。",
            "各サイト1回の取得で、到達できなかったサイトは除いています。HTTP 202 を返した1,477件は、実際のトップページとは違うページを見ている可能性があり、202以外でもボット確認のページなどが混じっている可能性はあります。",
            "SEOプラグインはHTMLの文字列による判定で、痕跡を消している場合や複数入っている場合は正しく分けられません。",
            "今回の集計の一部には11月5日集計時の取得分を引き継いでいます。",
          ],
        },
        {
          heading: "当社の見方（意見）",
          paragraphs: [
            "ここからは事実ではなく当社の意見です。日本の制作会社サイトは、meta description や robots.txt といった従来のSEOの基本は海外より整っている一方、llms.txt と構造化データの一部（LocalBusiness・FAQPage）で差がありました。5項目を満たすサイトの大半は llms.txt だけが欠けている形なので、日本の差は「基本ができていない」というより「新しい項目にまだ手を付けていない」ことによる部分が大きいと見ています。llms.txt や構造化データがあればAIの回答に出る、というものではありません（[当社の別の調査](/guide/aeo-signals-ai-answers-study)では、サイト側の対策と回答への登場に関係は見られませんでした）。それでも、会社の事実を機械が読める形で置いておくことは、手間の小さい準備として検討に値すると考えます。",
          ],
        },
        {
          heading: "自社やお客様のサイトを確かめる",
          paragraphs: [
            "[無料チェック](https://nurevo.jp/check)で、llms.txt・構造化データ・AIクローラーの許可状況を1分ほどで確認できます。WordPress なら [Nurevo WebMCP プラグイン](https://wordpress.org/plugins/nurevo-webmcp/)で llms.txt を出し、会社の事実を構造化データに足せます。お客様のサイトにまとめて入れたい制作会社の方は[パートナー制度](https://nurevo.jp/partner/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "日本の制作会社は海外よりAI検索への対応が遅れていますか？", a: "llms.txt（日本13.4%・海外29.6%）、6項目すべて（10.4%・24.5%）、JSON-LD（69.4%・81.0%）は日本が低く、meta description（90.7%・80.3%）と robots.txt（91.8%・87.6%）は日本が高い結果でした（海外は HTTP 202 を除く、2026年11月、制作会社の自社サイト）。" },
        { q: "日本は何位でしたか？", a: "30件以上ある25の国・地域のうち、llms.txt の導入率は25位（最下位）、6項目すべては24位、JSON-LD は17位、6項目の平均は14位でした。" },
        { q: "海外ではAIクローラーをブロックしているサイトが多いですか？", a: "robots.txt があるサイトの4.9%で、日本（1.3%）より多いものの少数でした。ブロックの多くは学習用のボットで、検索用の OAI-SearchBot をブロックしていたのは0.2%でした。" },
        { q: "HTTP 202 とは何ですか？", a: "海外の1,477件のトップページが返したステータスです。JSON-LD などが見つからず、ボット確認などの別のページが返った可能性があるため、除いた値も載せています。" },
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
      title: "Japan vs 25 Countries: AI Search Readiness of 15,838 Web Agency Sites (Nov 2026) | Nurevo",
      description: "15,838 web agency sites compared: llms.txt in Japan 13.4% vs overseas 29.6%, last of 25 countries. Japan led on meta descriptions and robots.txt (Nov 2026).",
      h1: "Japan vs overseas: AI search readiness of 15,838 web design agency websites (November 2026)",
      lead: "We checked the home page, robots.txt and llms.txt of 2,486 Japanese web design agencies' own websites and 13,352 agency websites in 25 other countries and regions, using the same method. 13.4% of Japanese sites had an llms.txt, against 29.6% overseas (excluding sites whose home page returned HTTP 202) — the lowest of the 25 countries and regions compared. Japan was ahead on meta descriptions (90.7% vs 80.3%) and robots.txt (91.8% vs 87.6%), and for 94.9% of the 1,039 Japanese sites meeting five of our six items, the only missing item was llms.txt.",
      intro: [
        "Published 26 November 2026. Data aggregated 12 November 2026. Research and writing: Nurevo AEO (Bestie.合同会社, Japan). Nurevo sells AI search optimisation (AEO) tools and a WordPress plugin, so we have an interest in this topic.",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "13.4% of Japanese web agency sites (333 of 2,486) had an llms.txt, against 26.4% overseas (3,522 of 13,352), or 29.6% excluding 1,477 HTTP 202 responses (p<0.001). Among 25 countries and regions with 30+ sites, Japan ranked last; Singapore ranked first (41.9%).",
            "10.4% of Japanese sites met all six AI-search readiness items, against 24.5% overseas (excl. 202). But 986 of the 1,039 Japanese sites meeting five items (94.9%) were missing only llms.txt. The 6-item average was 4.05 in Japan and 4.30 overseas (excl. 202).",
            "Japan was higher on meta descriptions (90.7% vs 80.3%) and robots.txt (91.8% vs 87.6%); og:title (81.3% vs 81.4%) and canonical links (84.6% vs 85.9%) showed no significant difference. 1.3% of Japanese and 4.9% of overseas sites blocked an AI bot in robots.txt; blocking of search crawlers (OAI-SearchBot, Claude-SearchBot, PerplexityBot) was 0.3% or less in both.",
          ],
        },
        {
          heading: "Methodology",
          list: [
            "Population: web design agencies' own websites. From our collection list of 3,352 Japanese and 20,335 overseas agency sites, 2,486 Japanese and 13,352 overseas home pages were reachable (15,838 in total). This is not a sample of businesses in general. Country comes from our collection list.",
            "What we fetched: each site's home page, /robots.txt, /llms.txt and /llms-full.txt, once each (User-Agent: NurevoSurvey/1.0), from early November to 12 November 2026; aggregated on 12 November.",
            "Definitions: llms.txt = status 200, not HTML, more than 20 characters. JSON-LD = present on the home page; \"broken\" = at least one block that does not parse as JSON. Organization-type = an @type containing Organization, LocalBusiness, Corporation or ProfessionalService. WordPress = wp-content/, wp-includes/ or a WordPress generator tag in the home page HTML.",
            "AI bot blocking: whether the robots.txt group that applies to each bot disallows the home page (/), by longest match. The base is sites with a robots.txt. \"Blocks an AI bot\" = blocks any of GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot or OAI-SearchBot.",
            "The six items: (1) llms.txt, (2) JSON-LD, (3) an Organization or LocalBusiness type, (4) a robots.txt that blocks none of GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot, (5) a meta description, (6) a canonical link. It is a simple count for this survey, not Nurevo's 0–100 product score.",
            "HTTP 202: 1,477 overseas home pages (US 671, Australia 250, UK 140 and others) returned status 202; Japan had none. None of them showed JSON-LD or WordPress markers, so they may have served a bot-check or interim page. We show overseas figures both in full and excluding 202 (11,875 sites); the Japan comparison and the country table use the figures excluding 202.",
            "English-speaking 6 = US, UK, Canada, Australia, New Zealand and Ireland (7,461 sites excl. 202); other countries = the remaining 19 countries and regions (4,414). p values are 2×2 chi-square tests of Japan vs overseas (excl. 202).",
          ],
        },
        {
          heading: "Results: Japan vs overseas",
          paragraphs: [
            "Japan was lower on llms.txt, JSON-LD, Organization-type, LocalBusiness, FAQPage and microdata, and higher on WordPress share, meta descriptions, robots.txt and Sitemap lines in robots.txt. og:title, canonical links and the share of broken JSON-LD (1.7% vs 1.8%) showed no significant difference. Outside the English-speaking six, llms.txt (34.0% vs 27.0%), FAQPage (13.5% vs 8.7%) and all six items (28.0% vs 22.5%) were higher.",
          ],
          table: {
            head: HEAD_EN,
            rows: COMPARE.map(([, en, ...v]) => [en, ...v]),
            caption: "Reachable web agency websites. Rows marked \"of sites with robots.txt\" / \"same base\" use sites with a robots.txt (Japan 2,281; overseas all 10,470; excl. 202 10,407; English-speaking 6,561; other 3,846). Broken JSON-LD uses sites with JSON-LD (Japan 1,726; overseas 9,615). p = Japan vs overseas excl. 202. Aggregated 12 November 2026.",
          },
        },
        {
          heading: "By country: llms.txt adoption ranking",
          paragraphs: [
            "The 25 countries and regions with 30+ reachable sites, sorted by llms.txt adoption (overseas figures exclude HTTP 202). Japan was last on llms.txt (13.4%) and second to last on all six items (10.4%; Chile last at 9.3%), mid-table on JSON-LD (17th) and the 6-item average (14th), and lowest on AI bot blocking (1.3%).",
          ],
          table: {
            head: ["Rank", "Country / region", "Sites", "llms.txt", "JSON-LD", "All 6 items", "Blocks an AI bot", "6-item average"],
            rows: COUNTRIES.map(([r, , en, ...v]) => [r, en, ...v]),
            caption: "Overseas figures exclude HTTP 202. \"Blocks an AI bot\" uses sites with a robots.txt; Portugal and Chile have fewer than 30 and show \"—\". Countries with fewer than 100 sites vary more, so treat their rank as indicative.",
          },
        },
        {
          heading: "Blocking by bot",
          paragraphs: [
            "Share of sites with a robots.txt that block the home page, per bot. In both Japan and overseas, blocking mostly targeted crawlers described as training crawlers (CCBot, Bytespider, GPTBot, Google-Extended, ClaudeBot and others); crawlers used for answering user requests or search (ChatGPT-User, PerplexityBot, OAI-SearchBot, Claude-SearchBot) were blocked by 0.3% or less.",
            "Of sites blocking GPTBot, 28 of 28 in Japan and 429 of 448 overseas (95.8%, excl. 202) did not block OAI-SearchBot.",
          ],
          table: {
            head: ["Bot", "Japan (sites)", "Japan", "Overseas (sites)", "Overseas"],
            rows: BOTS,
            caption: "Base: sites with a robots.txt (Japan 2,281; overseas excl. 202 10,407). Judged for / only.",
          },
        },
        {
          heading: "WordPress vs other sites",
          paragraphs: [
            "92.3% of Japanese agency sites ran WordPress, against 84.9% overseas (excl. 202). Comparing WordPress sites only, Japan was still lower on llms.txt (14.0% vs 33.1%) and JSON-LD (72.9% vs 92.5%), so the gap is not explained by WordPress share alone.",
          ],
          table: {
            head: ["Group", "Sites", "llms.txt", "JSON-LD", "All 6 items", "6-item average"],
            rows: WP.map(([, en, ...v]) => [en, ...v]),
            caption: "Overseas figures exclude HTTP 202.",
          },
        },
        {
          heading: "SEO plugins",
          paragraphs: [
            "On WordPress sites, the most common SEO plugin detected in Japan was AIOSEO (35.2%), and 48.6% had no plugin we could detect. Overseas, Yoast SEO (53.1%) and Rank Math (22.2%) led, and 17.8% had none detected. Even with the same plugin, llms.txt was less common in Japan — for AIOSEO, 19.3% vs 51.1%. We did not check whether llms.txt was made by a plugin or placed by hand.",
          ],
          table: {
            head: ["SEO plugin", "Japan: sites (of WordPress)", "Japan: llms.txt", "Overseas: sites (of WordPress)", "Overseas: llms.txt"],
            rows: PLUGINS.map(([p, ...v]) => [p.replace("検出なし / ", ""), ...v]),
            caption: "WordPress sites (Japan 2,295; overseas excl. 202 10,081). Plugins detected from HTML strings (first match in the order Yoast → Rank Math → AIOSEO → SEOPress). SEOPress omitted (1 site in Japan).",
          },
        },
        {
          heading: "Distribution of the six items",
          paragraphs: [
            "Japan clustered at 3–5 items (72.5% combined), with 1.6% at zero and 10.4% at six. Overseas (excl. 202), 65.4% met five or six items, but 10.0% met none. Of the 1,039 Japanese sites meeting five items, the missing item was llms.txt for 986 (94.9%), Organization-type for 38, and fewer than 10 each for the rest.",
          ],
          table: {
            head: ["Items met", "Japan", "Overseas (excl. 202)", "Overseas (all)"],
            rows: DIST,
            caption: "Share of reachable sites. Japan 2,486; overseas excl. 202 11,875; overseas all 13,352.",
          },
        },
        {
          heading: "Citing this survey",
          paragraphs: [
            "You may quote and republish the figures and tables freely, as long as you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. Sentences ready to quote:",
          ],
          list: [
            "13.4% of Japanese web design agencies' own websites had an llms.txt file, less than half the overseas share of 29.6% (Nurevo AEO survey, November 2026, 2,486 Japanese and 11,875 overseas sites).",
            "Among 25 countries and regions, Japan's web agency websites ranked last for llms.txt adoption; Singapore ranked first at 41.9% (Nurevo AEO survey, November 2026).",
            "94.9% of Japanese web agency sites meeting five of six AI-search readiness items were missing only llms.txt (Nurevo AEO survey, November 2026).",
            "90.7% of Japanese web agency sites had a meta description, against 80.3% overseas (Nurevo AEO survey, November 2026).",
            "1.3% of Japanese and 4.9% of overseas web agency sites with a robots.txt blocked an AI bot; 0.3% or less blocked search crawlers (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Limitations",
          list: [
            "The population is web design agencies' own websites, not businesses in general. Country comes from our collection list, and the samples do not represent all agencies in each country. Sample sizes vary widely; some countries have fewer than 100 sites.",
            "Only the home page was examined. robots.txt was judged for / only; partial blocking and blocking by firewalls or CDNs were not counted. For llms.txt we checked only whether it exists, not its quality.",
            "One fetch per site; unreachable sites are excluded. The 1,477 HTTP 202 responses may not reflect the real home page, and bot-check pages may exist among other responses too.",
            "SEO plugins were detected from HTML strings; sites that hide plugin markers or run several plugins may be misclassified.",
            "Part of this aggregation reuses fetches from the 5 November run.",
          ],
        },
        {
          heading: "Our reading (opinion)",
          paragraphs: [
            "What follows is our opinion, not a finding. Japanese agency sites are ahead on classic SEO basics such as meta descriptions and robots.txt, and behind on llms.txt and some structured data (LocalBusiness, FAQPage). Since most Japanese sites meeting five items lack only llms.txt, we read the gap less as missing basics and more as newer items not yet adopted. Having llms.txt or structured data does not guarantee appearing in AI answers (in [another of our studies](/guide/aeo-signals-ai-answers-study), on-site signals showed no relationship with appearance), but publishing company facts in machine-readable form is a low-effort step worth considering.",
          ],
        },
        {
          heading: "Check your own or your clients' sites",
          paragraphs: [
            "The [free check](https://nurevo.jp/check) shows llms.txt, structured data and AI crawler access in about a minute. On WordPress, the [Nurevo WebMCP plugin](https://wordpress.org/plugins/nurevo-webmcp/) publishes an llms.txt and adds business facts to structured data. Agencies that want to roll it out across clients' sites can see the [partner program](https://nurevo.jp/partner/).",
          ],
        },
      ],
      faqs: [
        { q: "Is Japan behind other countries on AI search readiness?", a: "On llms.txt (Japan 13.4%, overseas 29.6%), all six items (10.4% vs 24.5%) and JSON-LD (69.4% vs 81.0%), yes. Japan is ahead on meta descriptions (90.7% vs 80.3%) and robots.txt (91.8% vs 87.6%) (overseas excl. HTTP 202, November 2026, agencies' own websites)." },
        { q: "Where did Japan rank?", a: "Among 25 countries and regions with 30+ sites: last on llms.txt, 24th on all six items, 17th on JSON-LD and 14th on the 6-item average." },
        { q: "Do many overseas sites block AI crawlers?", a: "4.9% of sites with a robots.txt, more than Japan (1.3%) but a small minority. Most blocking targets training crawlers; only 0.2% block OAI-SearchBot." },
        { q: "What is the HTTP 202 issue?", a: "1,477 overseas home pages answered with status 202 and showed no JSON-LD or WordPress markers, so they may have returned an interim page. We show figures with and without them." },
        { q: "Can I use these figures in an article?", a: "Yes. Credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page, and you may quote and republish them freely." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Check your site's AI readiness",
        body: "The free check shows your llms.txt, structured data and AI crawler access. It does not guarantee appearing in AI answers.",
        label: "Run the free check",
        href: "/check",
        secondary: { label: "Partner program for agencies", href: "/partner/" },
      },
      footnote: "Research by Nurevo AEO (Bestie.合同会社). WordPress is a trademark of the WordPress Foundation; SEO plugin names are trademarks of their owners. Individual companies and domains are not published.",
    },
  },
};
