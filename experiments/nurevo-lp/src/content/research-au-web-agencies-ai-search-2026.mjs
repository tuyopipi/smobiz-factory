// Content page: research report (country report: Australia). AI search
// readiness of Australian web design agencies' own websites, compared with the
// US, the UK, New Zealand, Japan and other overseas agencies. November 2026.
//
// Every number here comes from nurevo-outreach data/survey/raw_2026-11-12.json
// (survey.js; the same run as summary_2026-11-12.json — the Australian totals
// match summary.byCountry.AU: 1,719 reached, llms.txt 24.3%, JSON-LD 71.3%,
// WordPress 76.0%, AI bot blocked 4.7%). Country = the "co" field of our
// collection list (AU; 2,289 listed). Do not add a figure that is not in that
// data. The raw file holds company names and domains: never publish them.
// Definitions follow survey.js (see the US report for the full list).
// "Excluding HTTP 202" = drops the 250 AU home pages answered with status 202
// (none had JSON-LD or WordPress markers; 11 had a robots.txt, 1 an llms.txt).
// "Other overseas" = all non-Japan sites except Australia (11,633 reached).
// Groups under 30 sites are not shown (SEOPress 12 AU WordPress sites).
// Chi-square, AU vs Japan: llms.txt, all 6, AI bot blocking, FAQPage p<0.001.
// AU vs US: llms.txt p=0.32, all 6 p=0.11, blocking p=0.60, FAQPage p<0.001.
// AU vs UK: llms.txt p=0.12, all 6 p=0.07, blocking p=1.00.
// AU vs NZ (417): llms.txt p=0.68, all 6 p=1.00, blocking p=0.50.
// AU vs other overseas: llms.txt p=0.04, all 6 p=0.28, blocking p=0.53.

// [ja label, en label, AU, AU excl. 202, US, UK, Japan, other overseas (excl. AU)]
const COMPARE = [
  ["到達件数", "Sites reached", "1,719", "1,469", "4,472", "942", "2,486", "11,633"],
  ["WordPress", "WordPress", "76.0%", "88.9%", "74.5%", "73.4%", "92.3%", "75.4%"],
  ["llms.txt", "llms.txt", "24.3%", "28.4%", "23.1%", "21.5%", "13.4%", "26.7%"],
  ["llms-full.txt", "llms-full.txt", "1.6%", "1.9%", "1.5%", "1.3%", "0.6%", "1.8%"],
  ["JSON-LD", "JSON-LD", "71.3%", "83.5%", "69.0%", "68.8%", "69.4%", "72.1%"],
  ["JSON-LD が壊れている（JSON-LD があるサイト中）", "Broken JSON-LD (of sites with JSON-LD)", "2.1%", "2.1%", "1.6%", "2.0%", "1.7%", "1.8%"],
  ["Organization系の型", "Organization-type", "62.2%", "72.8%", "59.4%", "59.6%", "58.9%", "63.8%"],
  ["FAQPage", "FAQPage", "10.3%", "12.0%", "6.2%", "8.0%", "3.9%", "9.2%"],
  ["meta description", "Meta description", "70.2%", "82.2%", "68.0%", "69.3%", "90.7%", "71.6%"],
  ["Open Graph", "Open Graph", "72.4%", "84.7%", "69.1%", "69.1%", "81.3%", "72.4%"],
  ["canonical", "Canonical link", "75.9%", "88.8%", "74.3%", "72.7%", "84.6%", "76.5%"],
  ["robots.txt", "robots.txt", "77.7%", "90.2%", "76.1%", "74.2%", "91.8%", "78.5%"],
  ["AIボットをブロック（robots.txt があるサイト中）", "Blocks an AI bot (of sites with robots.txt)", "4.7%", "4.4%", "4.3%", "4.7%", "1.3%", "5.2%"],
  ["robots.txt でAIボットに言及", "robots.txt names an AI bot", "10.7%", "10.3%", "8.8%", "9.3%", "2.5%", "11.9%"],
  ["6項目の平均", "6-item average", "3.77", "4.40", "3.65", "3.61", "4.05", "3.84"],
  ["5項目以上", "5+ items", "56.7%", "66.3%", "54.6%", "55.1%", "52.2%", "58.4%"],
  ["6項目すべて", "All 6 items", "20.8%", "24.3%", "18.9%", "17.7%", "10.4%", "22.0%"],
];

// [bot, AU blocked, AU %, US %, UK %, Japan %]  base = sites with robots.txt (AU 1,336 / US 3,404 / UK 699 / Japan 2,281)
const BOTS = [
  ["CCBot", "58", "4.3%", "4.1%", "4.6%", "1.1%"],
  ["GPTBot", "56", "4.2%", "3.8%", "4.0%", "1.2%"],
  ["Bytespider", "56", "4.2%", "4.1%", "4.7%", "1.1%"],
  ["ClaudeBot", "51", "3.8%", "3.5%", "4.1%", "1.0%"],
  ["Google-Extended", "51", "3.8%", "3.6%", "4.1%", "1.1%"],
  ["Applebot-Extended", "48", "3.6%", "3.3%", "3.9%", "1.0%"],
  ["anthropic-ai", "46", "3.4%", "3.4%", "4.3%", "1.0%"],
  ["ChatGPT-User", "4", "0.3%", "0.4%", "0.0%", "0.1%"],
  ["PerplexityBot", "2", "0.1%", "0.3%", "0.0%", "0.1%"],
  ["OAI-SearchBot", "1", "0.1%", "0.3%", "0.1%", "0.0%"],
  ["Claude-SearchBot", "1", "0.1%", "0.3%", "0.0%", "0.0%"],
  ["Googlebot", "1", "0.1%", "0.1%", "0.0%", "0.0%"],
  ["Bingbot", "0", "0.0%", "0.1%", "0.0%", "0.0%"],
];

// [type, AU, US, UK, Japan]  share of reachable sites whose home page JSON-LD contains the @type
const TYPES = [
  ["WebSite", "68.4%", "65.7%", "66.2%", "63.0%"],
  ["WebPage", "61.9%", "59.3%", "60.4%", "34.4%"],
  ["SearchAction", "59.7%", "56.8%", "60.8%", "28.9%"],
  ["Organization", "58.8%", "55.4%", "56.1%", "54.4%"],
  ["ImageObject", "57.4%", "54.5%", "55.0%", "38.3%"],
  ["BreadcrumbList", "43.5%", "44.5%", "44.3%", "43.4%"],
  ["PostalAddress", "28.7%", "24.3%", "26.6%", "16.4%"],
  ["Person", "16.9%", "15.6%", "16.7%", "10.2%"],
  ["ContactPoint", "14.7%", "12.5%", "12.5%", "6.5%"],
  ["GeoCoordinates", "14.4%", "12.1%", "13.6%", "3.7%"],
  ["LocalBusiness", "14.2%", "12.2%", "10.5%", "5.4%"],
  ["ProfessionalService", "13.6%", "10.1%", "12.1%", "5.6%"],
  ["FAQPage", "10.3%", "6.2%", "8.0%", "3.9%"],
];

// [plugin, AU WordPress sites (share), llms.txt count (share), JSON-LD, 6-item average]
const PLUGINS = [
  ["Yoast SEO", "699 (53.5%)", "198 (28.3%)", "99.1%", "4.95"],
  ["Rank Math", "298 (22.8%)", "112 (37.6%)", "99.7%", "5.24"],
  ["AIOSEO", "73 (5.6%)", "36 (49.3%)", "98.6%", "5.23"],
  ["検出なし / none detected", "224 (17.2%)", "51 (22.8%)", "58.5%", "3.83"],
];

// [score, AU, AU excl. 202, US, UK, Japan]
const DIST = [
  ["0", "20.7%", "7.6%", "22.1%", "23.6%", "1.6%"],
  ["1", "2.5%", "2.5%", "2.5%", "1.9%", "4.8%"],
  ["2", "3.8%", "4.4%", "4.3%", "4.2%", "10.7%"],
  ["3", "3.0%", "3.5%", "3.6%", "3.1%", "15.4%"],
  ["4", "13.4%", "15.7%", "12.8%", "12.1%", "15.3%"],
  ["5", "35.9%", "42.0%", "35.7%", "37.4%", "41.8%"],
  ["6", "20.8%", "24.3%", "18.9%", "17.7%", "10.4%"],
];

const HEAD_JA = ["項目", "オーストラリア", "豪州（202を除く）", "米国", "英国", "日本", "豪州以外の海外"];
const HEAD_EN = ["Item", "Australia", "AU (excl. 202)", "US", "UK", "Japan", "Other overseas"];

export default {
  slug: "research-au-web-agencies-ai-search-2026",
  targetQueries: [
    "オーストラリア Web制作会社 AI検索 対応状況 調査",
    "豪州 llms.txt 導入率",
    "Australian web design agencies AI search readiness survey",
    "llms.txt adoption Australia 2026",
    "Australian websites blocking AI crawlers robots.txt GPTBot",
  ],
  related: ["research-uk-web-agencies-ai-search-2026", "research-us-web-agencies-ai-search-2026", "research-japan-web-agencies-ai-search-2026", "research-ai-readiness-score-distribution-2026", "llms-txt"],
  locales: {
    ja: {
      title: "オーストラリアのWeb制作会社1,719社のAI検索対応を調査【2026年11月】 | Nurevo",
      description: "オーストラリアのWeb制作会社の自社サイト1,719件を調査。llms.txt は24.3%（日本13.4%）、6項目すべて満たすサイトは20.8%（日本10.4%）、FAQPage は10.3%（米国6.2%）でした。",
      h1: "オーストラリアのWeb制作会社の自社サイト1,719件に見るAI検索への対応（2026年11月）",
      lead: "オーストラリアのWeb制作会社の自社サイト1,719件のトップページ・robots.txt・llms.txt を調べたところ、llms.txt があったのは24.3%（418件）で、日本の13.4%より高く、米国（23.1%）・英国（21.5%）・ニュージーランド（25.4%）とは統計的な差が見られませんでした。AI検索に関わる6項目をすべて満たすサイトは20.8%で、日本のちょうど2倍です。robots.txt でAIボットをブロックしていたのは4.7%で、GPTBot をブロックしていた56件のうち55件は ChatGPT の検索用ボット（OAI-SearchBot）をブロックしていませんでした。",
      intro: [
        "公開：2026年11月19日。データ：2026年11月12日集計。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策（AEO）のツールと WordPress プラグインを提供しており、この分野に利害があります。国別レポートの3本目です（これまでに[米国](/guide/research-us-web-agencies-ai-search-2026)・[英国](/guide/research-uk-web-agencies-ai-search-2026)）。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "オーストラリアのWeb制作会社の自社サイト1,719件のうち、llms.txt があったのは24.3%（418件）。日本（13.4%）より高く（p<0.001）、米国（23.1%、p=0.32）・英国（21.5%、p=0.12）・ニュージーランド（25.4%、p=0.68）とは差が見られませんでした。トップページが HTTP 202 を返した250件を除くと28.4%です。",
            "AI検索に関わる6項目をすべて満たすサイトは20.8%（357件）で、日本（10.4%）の2.0倍でした。FAQPage の構造化データは10.3%で、米国（6.2%）・日本（3.9%）より高い値です（どちらも p<0.001）。",
            "robots.txt があるサイト1,336件のうち、AIボットをブロックしていたのは4.7%（63件、日本1.3%）。GPTBot をブロックしていた56件のうち55件は OAI-SearchBot を許可していました。検索用・質問時の取得に使われる4つのボットのどれかをブロックしていたのは5件（0.4%）でした。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "対象：Web制作会社の自社サイト。当社の収集リストで国がオーストラリアとなっている制作会社サイト2,289件のうち、トップページに到達できた1,719件です。一般企業のサイト全体ではありません。比較には同じ調査の米国（4,472件）・英国（942件）・ニュージーランド（417件）・日本（2,486件）・オーストラリア以外の海外（11,633件）を使いました。",
            "取得したもの：各サイトのトップページ、/robots.txt、/llms.txt、/llms-full.txt を1回ずつ（User-Agent：NurevoSurvey/1.0）。2026年11月上旬〜12日に取得し、11月12日に集計しました。",
            "判定方法：llms.txt は、ステータス200で中身がHTMLではなく20文字を超えるテキストを「あり」としました。JSON-LD はトップページにあるかどうか、「壊れている」は JSON として読み込めないブロックが1つ以上あるもの。Organization系は @type に Organization・LocalBusiness・Corporation・ProfessionalService を含むもの。WordPress はトップページのHTMLに wp-content/・wp-includes/、または generator の WordPress 表記があるもの。SEOプラグインはトップページのHTMLの文字列で判定しました。",
            "AIボットのブロック：robots.txt で、各ボットに当てはまるグループの規則がトップページ（/）を Disallow にするか（最長一致）で判定しました。分母は robots.txt があるサイトです。「AIボットをブロック」は GPTBot・ClaudeBot・PerplexityBot・Google-Extended・CCBot・OAI-SearchBot のどれかをブロックしているものです。",
            "「6項目」は、(1) llms.txt がある、(2) JSON-LD がある、(3) Organization または LocalBusiness の型がある、(4) robots.txt があり GPTBot・ClaudeBot・PerplexityBot・OAI-SearchBot のどれもブロックしていない、(5) meta description がある、(6) canonical がある、のうち当てはまる数（0〜6）です。この調査のための単純な数で、Nurevo の0〜100点のスコアとは別物です。",
            "HTTP 202：オーストラリアでは250件のトップページがステータス202を返しました（日本は0件）。これらのページには JSON-LD も WordPress の痕跡もなく、ボット確認などの別のページが返った可能性があります。そのため、202を除いた値も並べています。",
            "統計：オーストラリアと他の地域の差はカイ二乗検定で確かめました。30件未満の区分は載せていません。",
          ],
        },
        {
          heading: "結果：オーストラリアと米国・英国・日本の比較",
          paragraphs: [
            "オーストラリアの値は、ほとんどの項目で米国・英国より1〜3ポイント程度高く、なかでも FAQPage（10.3%）は米国（6.2%）との差がはっきりしていました。llms.txt・「6項目すべて」・AIボットのブロックは、米国・英国・ニュージーランドとの間に統計的な差は見られません。日本と比べると、llms.txt・FAQPage・「6項目すべて」が高く、meta description・canonical・robots.txt は低めです。低めの項目は、202を返した250件（ほぼすべての項目が「なし」になる）の影響を受けており、202を除くと meta description 82.2%、canonical 88.8%、robots.txt 90.2% です。オーストラリア以外の海外全体（11,633件）と比べると、llms.txt は少し低めでした（24.3%と26.7%、p=0.04）。",
          ],
          table: {
            head: HEAD_JA,
            rows: COMPARE.map(([ja, , ...v]) => [ja, ...v]),
            caption: "Web制作会社の自社サイトで、トップページに到達できたもの。「AIボットをブロック」「AIボットに言及」の分母は robots.txt があるサイト（オーストラリア1,336件・202を除く1,325件・米国3,404件・英国699件・日本2,281件・オーストラリア以外の海外9,134件）。2026年11月12日集計。",
          },
        },
        {
          heading: "ボット別のブロック率",
          paragraphs: [
            "オーストラリアで robots.txt があるサイト1,336件について、ボットごとにトップページをブロックしている割合です。学習用とされるボット（CCBot・GPTBot・Bytespider・ClaudeBot・Google-Extended・Applebot-Extended・anthropic-ai）は3.4〜4.3%で、米国・英国とほぼ同じ、日本の3〜4倍でした。検索用やユーザーの質問に答えるときに使われるボットは、ChatGPT-User 4件、PerplexityBot 2件、OAI-SearchBot・Claude-SearchBot 各1件です。Googlebot をブロックしていたサイトが1件、Bingbot は0件でした。",
          ],
          table: {
            head: ["ボット", "豪州（件数）", "オーストラリア", "米国", "英国", "日本"],
            rows: BOTS,
            caption: "分母は robots.txt があるサイト（オーストラリア1,336件・米国3,404件・英国699件・日本2,281件）。トップページ（/）に対する判定。",
          },
        },
        {
          heading: "ブロックの中身（事実）",
          list: [
            "GPTBot をブロックしていた56件のうち55件（98.2%）は、OAI-SearchBot をブロックしていませんでした。米国は128件中119件（93.0%）、英国は28件中28件です。",
            "上の11種のAIボットのどれかをブロックしていた65件のうち42件（64.6%）は、GPTBot・ClaudeBot・anthropic-ai・Google-Extended・CCBot・Bytespider・Applebot-Extended の7つをまとめてブロックする同じ組み合わせでした（米国58.5%・英国77.1%）。次に多いのは CCBot と Bytespider の2つだけ（6件）です。",
            "OAI-SearchBot・ChatGPT-User・Claude-SearchBot・PerplexityBot のどれかをブロックしていたのは5件（robots.txt があるサイトの0.4%）でした。",
            "robots.txt でAIボットの名前を挙げていながら、どれもトップページをブロックしていないサイトが79件ありました（robots.txt があるサイトの5.9%）。",
            "AIボットをブロックしていた65件のうち14件（21.5%）には llms.txt もありました。",
          ],
        },
        {
          heading: "構造化データの型",
          paragraphs: [
            "トップページの JSON-LD に含まれる型は、オーストラリア・米国・英国でよく似た並びでした。オーストラリアは PostalAddress（28.7%）、ContactPoint（14.7%）、LocalBusiness（14.2%）、FAQPage（10.3%）など、所在地や連絡先、よくある質問を示す型がいずれも3か国の中でいちばん高い値です。日本との差が大きいのは WebPage（61.9%・34.4%）、SearchAction（59.7%・28.9%）、GeoCoordinates（14.4%・3.7%）などです。JSON-LD があるサイトのうち、JSON として読み込めないブロックがあったのは2.1%でした。",
          ],
          table: {
            head: ["@type", "オーストラリア", "米国", "英国", "日本"],
            rows: TYPES,
            caption: "到達できたサイトのうち、トップページの JSON-LD にその型があった割合（入れ子の型も数えます）。オーストラリア1,719件・米国4,472件・英国942件・日本2,486件。",
          },
        },
        {
          heading: "WordPress とSEOプラグイン",
          paragraphs: [
            "オーストラリアの制作会社サイトの76.0%（1,306件）が WordPress でした（202を除くと88.9%）。WordPress のサイトは llms.txt 30.7%、JSON-LD 92.3%、6項目の平均4.84 で、WordPress 以外（413件、うち250件が202）は llms.txt 4.1%、6項目の平均0.37 でした。SEOプラグインは Yoast SEO が53.5%、Rank Math が22.8%、AIOSEO が5.6%で、米国・英国と近い構成です（日本は AIOSEO 35.2%・Yoast 14.4%）。SEOPress（12件）は30件未満のため表に載せていません。",
            "llms.txt があった割合は AIOSEO 49.3%、Rank Math 37.6%、Yoast SEO 28.3%、プラグインを検出できなかったサイト22.8%でした。この調査では llms.txt をプラグインで作ったのか手で置いたのかは見ていません。",
          ],
          table: {
            head: ["SEOプラグイン", "豪州の WordPress サイト", "llms.txt", "JSON-LD", "6項目の平均"],
            rows: PLUGINS,
            caption: "オーストラリアの WordPress サイト1,306件。プラグインはトップページのHTMLの文字列で判定（Yoast → Rank Math → AIOSEO → SEOPress の順に最初に当てはまったもの）。30件未満の区分は省略。",
          },
        },
        {
          heading: "6項目の分布",
          paragraphs: [
            "オーストラリアも米国・英国と同じく「0項目」（20.7%）と「5〜6項目」（合わせて56.7%）に分かれていました。0項目の多くは202を返したサイトで、202を除くと7.6%です。日本は3〜4項目の層が厚く（合わせて30.7%）、オーストラリアの同じ層は16.4%でした。",
          ],
          table: {
            head: ["当てはまる項目数", "オーストラリア", "豪州（202を除く）", "米国", "英国", "日本"],
            rows: DIST,
            caption: "到達できたサイトに占める割合。オーストラリア1,719件（202を除く1,469件）、米国4,472件、英国942件、日本2,486件。",
          },
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "この調査の数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。そのまま使える1文：",
          ],
          list: [
            "オーストラリアのWeb制作会社の自社サイトの24.3%に llms.txt があった（日本13.4%、米国23.1%、英国21.5%）（Nurevo AEO 調査、2026年11月、1,719件）。",
            "オーストラリアのWeb制作会社の自社サイトで、AI検索に関わる6項目をすべて満たしていたのは20.8%で、日本（10.4%）の2.0倍だった（Nurevo AEO 調査、2026年11月）。",
            "オーストラリアのWeb制作会社の自社サイトの10.3%が FAQPage の構造化データを使っていた（米国6.2%、日本3.9%）（Nurevo AEO 調査、2026年11月）。",
            "オーストラリアのWeb制作会社で GPTBot をブロックしていた56件のうち55件は、ChatGPT の検索用ボット OAI-SearchBot を許可していた（Nurevo AEO 調査、2026年11月）。",
            "オーストラリアのWeb制作会社の WordPress サイトの53.5%で Yoast SEO、22.8%で Rank Math が検出された（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "限界",
          list: [
            "対象はWeb制作会社の自社サイトで、一般企業のサイト全体ではありません。国は当社の収集リストの記載によるもので、オーストラリアの制作会社全体を代表する標本ではありません。ボット別の件数などは小さい数です。",
            "トップページだけを見ています。robots.txt はトップページ（/）に対する判定で、一部のディレクトリだけのブロックや、ファイアウォール・CDN によるブロックは数えていません。llms.txt は有無だけを見て、中身の質は見ていません。",
            "各サイト1回の取得で、到達できなかったサイト（570件）は除いています。HTTP 202 を返した250件は、実際のトップページとは違うページを見ている可能性があります。",
            "SEOプラグインはHTMLの文字列による判定で、痕跡を消している場合や複数入っている場合は正しく分けられません。",
            "今回の集計の一部には11月5日集計時の取得分を引き継いでいます。",
          ],
        },
        {
          heading: "当社の見方（意見）",
          paragraphs: [
            "ここからは事実ではなく当社の意見です。オーストラリアの制作会社サイトは、米国・英国とほぼ同じ水準で、FAQPage や所在地・連絡先の型がやや多いのが特徴でした。日本との差は llms.txt と「全部そろっているか」に表れています。AIボットのブロックは少数で、ブロックしているサイトもほとんどが学習用のボットに限っていました。どのボットを止めるかは各社の判断ですが、AI検索に出たい場合は、検索用のボットまで止めていないかを確かめる価値があります。どれを整えてもAIの回答に出ることが保証されるわけではありません（[別の調査](/guide/aeo-signals-ai-answers-study)では、サイト側の項目と登場の間に関係は見られませんでした）。",
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
        { q: "オーストラリアの制作会社は日本よりAI検索への対応が進んでいますか？", a: "llms.txt（オーストラリア24.3%・日本13.4%）と「6項目すべて」（20.8%・10.4%）はオーストラリアが高く、JSON-LD は71.3%と69.4%で差は見られませんでした。meta description や canonical は日本のほうが高めです（2026年11月、Web制作会社の自社サイト）。" },
        { q: "オーストラリアと米国・英国で違いはありますか？", a: "llms.txt、6項目すべて、AIボットのブロックのどれも、統計的な差は見られませんでした。FAQPage の構造化データはオーストラリア10.3%・米国6.2%で、オーストラリアが高めです。SEOプラグインは3か国とも Yoast SEO が最多です。" },
        { q: "オーストラリアではAIクローラーをブロックしているサイトが多いですか？", a: "robots.txt があるサイトの4.7%で、日本（1.3%）より多いものの少数でした。ほとんどは学習用のボットで、検索用・質問時の取得に使われる4つのボットのどれかをブロックしていたのは5件（0.4%）です。" },
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
      title: "AI Search Readiness of 1,719 Australian Web Agency Websites (2026) | Nurevo",
      description: "1,719 Australian web agency sites: 24.3% have an llms.txt (Japan 13.4%, US 23.1%), 20.8% meet all six AI search items, 10.3% use FAQPage markup, and 4.7% block an AI bot.",
      h1: "AI search readiness of Australian web design agencies: 1,719 agency websites (November 2026)",
      lead: "We fetched the home page, robots.txt and llms.txt of 1,719 Australian web design agencies' own websites. 24.3% (418) had an llms.txt — higher than Japan (13.4%) and not statistically different from the US (23.1%), the UK (21.5%) or New Zealand (25.4%). 20.8% met all six AI-search items we checked, exactly twice Japan's share. 4.7% of sites with a robots.txt blocked an AI bot, and 55 of the 56 sites blocking GPTBot still allowed OpenAI's search crawler, OAI-SearchBot.",
      intro: [
        "Published 2026-11-19. Data aggregated 2026-11-12. Research by Nurevo AEO (Bestie.合同会社), Japan. Nurevo sells AI search optimisation (AEO) tools and a WordPress plugin, and so has an interest in this topic. This is the third of our country reports (after the [United States](/guide/research-us-web-agencies-ai-search-2026) and the [United Kingdom](/guide/research-uk-web-agencies-ai-search-2026)).",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "24.3% (418) of 1,719 Australian web agency websites had an llms.txt. That is higher than Japan (13.4%, p < 0.001) and not statistically different from the US (23.1%, p = 0.32), the UK (21.5%, p = 0.12) or New Zealand (25.4%, p = 0.68). Excluding the 250 home pages that answered HTTP 202, the share is 28.4%.",
            "20.8% (357) of Australian sites met all six AI-search items we checked — 2.0 times Japan's 10.4%. FAQPage structured data appeared on 10.3% of sites, above the US (6.2%) and Japan (3.9%) (both p < 0.001).",
            "Of 1,336 Australian sites with a robots.txt, 4.7% (63) blocked an AI bot (Japan 1.3%). 55 of the 56 sites blocking GPTBot allowed OAI-SearchBot. Only 5 sites (0.4%) blocked any of the four bots used for search or for fetching pages when a user asks.",
          ],
        },
        {
          heading: "Method",
          list: [
            "Population: web design agencies' own websites. Of 2,289 agency sites listed as Australian in our collection list, 1,719 home pages could be reached. This is not a sample of Australian businesses in general. For comparison we use the same survey's US (4,472), UK (942), New Zealand (417), Japan (2,486) and all overseas sites outside Australia (11,633).",
            "Fetched: each site's home page, /robots.txt, /llms.txt and /llms-full.txt, once each (User-Agent: NurevoSurvey/1.0), early November to 12 November 2026; aggregated 2026-11-12.",
            "Classification: llms.txt = HTTP 200, not HTML, more than 20 characters. JSON-LD = present on the home page; \"broken\" = at least one block that does not parse as JSON. Organization-type = an @type of Organization, LocalBusiness, Corporation or ProfessionalService. WordPress = the home page HTML contains wp-content/ or wp-includes/, or a WordPress generator tag. SEO plugins were identified from strings in the home page HTML.",
            "AI bot blocking: whether the robots.txt rules that apply to each bot disallow the home page (/) (longest match); the base is sites with a robots.txt. \"Blocks an AI bot\" = blocks any of GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot or OAI-SearchBot.",
            "The six items: (1) has an llms.txt; (2) has JSON-LD; (3) has an Organization or LocalBusiness type; (4) has a robots.txt that blocks none of GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot; (5) has a meta description; (6) has a canonical link. The count (0–6) is a simple measure made for this survey, not Nurevo's 0–100 product score.",
            "HTTP 202: 250 Australian home pages answered with status 202 (none in Japan). None of them had JSON-LD or WordPress markers, so they may have returned a bot-check or other interim page. We therefore also show figures excluding them.",
            "Statistics: differences between Australia and other groups were tested with chi-square tests. Groups with fewer than 30 sites are not shown.",
          ],
        },
        {
          heading: "Results: Australia compared with the US, the UK and Japan",
          paragraphs: [
            "On most items Australia was roughly one to three points above the US and the UK; the clearest gap was FAQPage (10.3% vs 6.2% in the US). On llms.txt, all six items and AI bot blocking we found no statistically significant difference from the US, the UK or New Zealand. Compared with Japan, Australia was higher on llms.txt, FAQPage and all six items, and lower on meta descriptions, canonical links and robots.txt. Those lower values are partly due to the 250 HTTP 202 pages, which fail almost every item; excluding them, meta description is 82.2%, canonical 88.8% and robots.txt 90.2%. Against all overseas sites outside Australia (11,633), Australia was slightly lower on llms.txt (24.3% vs 26.7%, p = 0.04).",
          ],
          table: {
            head: HEAD_EN,
            rows: COMPARE.map(([, en, ...v]) => [en, ...v]),
            caption: "Web design agencies' own websites whose home page could be reached. \"Blocks an AI bot\" and \"names an AI bot\" are shares of sites with a robots.txt (Australia 1,336; AU excl. 202: 1,325; US 3,404; UK 699; Japan 2,281; other overseas 9,134). Aggregated 2026-11-12.",
          },
        },
        {
          heading: "Blocking by bot",
          paragraphs: [
            "Share of the 1,336 Australian sites with a robots.txt that block each bot from the home page. Crawlers generally described as training crawlers (CCBot, GPTBot, Bytespider, ClaudeBot, Google-Extended, Applebot-Extended, anthropic-ai) were blocked by 3.4–4.3% — about the same as the US and the UK, and three to four times Japan. Among bots used for search or for fetching pages when a user asks, ChatGPT-User was blocked by 4 sites, PerplexityBot by 2, and OAI-SearchBot and Claude-SearchBot by 1 each. One site blocked Googlebot; none blocked Bingbot.",
          ],
          table: {
            head: ["Bot", "AU (sites)", "Australia", "US", "UK", "Japan"],
            rows: BOTS,
            caption: "Base: sites with a robots.txt (Australia 1,336; US 3,404; UK 699; Japan 2,281). Judged for the home page (/).",
          },
        },
        {
          heading: "What the blocking looks like (facts)",
          list: [
            "55 of the 56 sites blocking GPTBot (98.2%) did not block OAI-SearchBot. The figure was 119 of 128 (93.0%) in the US and 28 of 28 in the UK.",
            "Of the 65 sites blocking any of the 11 AI bots above, 42 (64.6%) used the same combination: GPTBot, ClaudeBot, anthropic-ai, Google-Extended, CCBot, Bytespider and Applebot-Extended, all seven together (US 58.5%, UK 77.1%). The next most common was CCBot and Bytespider only (6 sites).",
            "5 sites (0.4% of those with a robots.txt) blocked any of OAI-SearchBot, ChatGPT-User, Claude-SearchBot or PerplexityBot.",
            "79 sites (5.9% of those with a robots.txt) named an AI bot in robots.txt but blocked none from the home page.",
            "14 of the 65 sites blocking an AI bot (21.5%) also had an llms.txt.",
          ],
        },
        {
          heading: "Structured data types",
          paragraphs: [
            "The @types found in home page JSON-LD followed a very similar pattern in Australia, the US and the UK. Australia had the highest share of the three for types that state an address, contact details or common questions: PostalAddress (28.7%), ContactPoint (14.7%), LocalBusiness (14.2%) and FAQPage (10.3%). The largest gaps with Japan were WebPage (61.9% vs 34.4%), SearchAction (59.7% vs 28.9%) and GeoCoordinates (14.4% vs 3.7%). Of Australian sites with JSON-LD, 2.1% had at least one block that did not parse.",
          ],
          table: {
            head: ["@type", "Australia", "US", "UK", "Japan"],
            rows: TYPES,
            caption: "Share of reachable sites whose home page JSON-LD contains the type (nested types included). Australia 1,719; US 4,472; UK 942; Japan 2,486.",
          },
        },
        {
          heading: "WordPress and SEO plugins",
          paragraphs: [
            "76.0% (1,306) of Australian agency sites ran WordPress (88.9% excluding HTTP 202). WordPress sites had llms.txt 30.7%, JSON-LD 92.3% and a 6-item average of 4.84; non-WordPress sites (413, of which 250 answered 202) had llms.txt 4.1% and an average of 0.37. Among WordPress sites, Yoast SEO was detected on 53.5%, Rank Math on 22.8% and AIOSEO on 5.6% — close to the US and the UK, and unlike Japan, where AIOSEO leads (35.2%) ahead of Yoast (14.4%). SEOPress (12 sites) is below our 30-site threshold and not shown.",
            "llms.txt adoption: AIOSEO 49.3%, Rank Math 37.6%, Yoast SEO 28.3%, no plugin detected 22.8%. We did not check whether the llms.txt was generated by a plugin or added by hand.",
          ],
          table: {
            head: ["SEO plugin", "AU WordPress sites", "llms.txt", "JSON-LD", "6-item average"],
            rows: PLUGINS,
            caption: "1,306 Australian WordPress sites. Plugin = the first match in the home page HTML in the order Yoast → Rank Math → AIOSEO → SEOPress. Groups under 30 sites omitted.",
          },
        },
        {
          heading: "Distribution of the six items",
          paragraphs: [
            "Like the US and the UK, Australia split into 0 items (20.7%) and 5–6 items (56.7% combined). Most of the zeros are HTTP 202 pages; excluding them, 0 items falls to 7.6%. Japan has a thicker middle (3–4 items, 30.7% combined) where Australia has 16.4%.",
          ],
          table: {
            head: ["Items met", "Australia", "AU (excl. 202)", "US", "UK", "Japan"],
            rows: DIST,
            caption: "Share of reachable sites. Australia 1,719 (excl. 202: 1,469); US 4,472; UK 942; Japan 2,486.",
          },
        },
        {
          heading: "Citing this survey",
          paragraphs: [
            "You may quote and republish the figures and tables freely, as long as you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. Sentences ready to quote:",
          ],
          list: [
            "24.3% of Australian web design agencies' own websites had an llms.txt file, compared with 13.4% in Japan, 23.1% in the US and 21.5% in the UK (Nurevo AEO survey, November 2026, 1,719 Australian sites).",
            "20.8% of Australian web agency websites met all six AI-search readiness items checked, twice the share in Japan (10.4%) (Nurevo AEO survey, November 2026).",
            "10.3% of Australian web agency websites used FAQPage structured data on their home page, compared with 6.2% in the US (Nurevo AEO survey, November 2026).",
            "55 of the 56 Australian web agency websites that blocked GPTBot still allowed OpenAI's search crawler OAI-SearchBot (Nurevo AEO survey, November 2026).",
            "Yoast SEO was detected on 53.5% of Australian web agencies' WordPress sites and Rank Math on 22.8% (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Limitations",
          list: [
            "The population is web design agencies' own websites, not businesses in general. Country comes from our collection list, and the sample is not representative of all Australian agencies. Counts such as per-bot blocking are small numbers.",
            "Only the home page was examined. robots.txt was judged for / only; partial blocking and blocking by firewalls or CDNs were not counted. For llms.txt we checked only whether it exists, not its quality.",
            "One fetch per site; unreachable sites (570) are excluded. The 250 HTTP 202 responses may not reflect the real home page.",
            "SEO plugins were detected from HTML strings; sites that hide plugin markers or run several plugins may be misclassified.",
            "Part of this aggregation reuses fetches from the 5 November run.",
          ],
        },
        {
          heading: "Our reading (opinion)",
          paragraphs: [
            "What follows is our opinion, not a finding. Australian agency sites look much like US and UK ones, with slightly more FAQPage, address and contact markup; the gap with Japan is in llms.txt and in having everything in place. AI bot blocking is a minority practice, and where it happens it is almost always limited to training crawlers. Which bots to block is each site owner's decision, but sites that want to appear in AI search may want to confirm they are not blocking search crawlers by accident. None of this guarantees appearing in AI answers (in [another of our studies](/guide/aeo-signals-ai-answers-study), on-site signals showed no relationship with appearance).",
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
        { q: "Are Australian agencies ahead of Japan on AI search readiness?", a: "On llms.txt (Australia 24.3%, Japan 13.4%) and on meeting all six items (20.8% vs 10.4%), yes. JSON-LD is about the same (71.3% vs 69.4%), and Japan is higher on meta descriptions and canonical links (November 2026, agencies' own websites)." },
        { q: "How does Australia compare with the US and the UK?", a: "We found no statistically significant difference on llms.txt, all six items or AI bot blocking. FAQPage markup was more common in Australia (10.3%) than in the US (6.2%). Yoast SEO is the most common plugin in all three countries." },
        { q: "Do many Australian sites block AI crawlers?", a: "4.7% of sites with a robots.txt, more than Japan (1.3%) but a small minority. Most blocking targets training crawlers: only 5 sites (0.4%) blocked any of OAI-SearchBot, ChatGPT-User, Claude-SearchBot or PerplexityBot." },
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
