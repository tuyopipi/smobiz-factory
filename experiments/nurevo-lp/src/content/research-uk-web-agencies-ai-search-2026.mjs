// Content page: research report (country report: United Kingdom). AI search
// readiness of UK web design agencies' own websites, compared with the US,
// Japan and other overseas agencies. November 2026.
//
// Every number here comes from nurevo-outreach data/survey/raw_2026-11-12.json
// (survey.js; the same run as summary_2026-11-12.json — the UK totals match
// summary.byCountry.GB: 942 reached, llms.txt 21.5%, JSON-LD 68.8%,
// WordPress 73.4%, AI bot blocked 4.7%, 6-item average 3.6). Country = the
// "co" field of our collection list (GB). Do not add a figure that is not in
// that data. The raw file holds company names and domains: never publish them.
// Definitions follow survey.js (see the US report for the full list).
// "Excluding HTTP 202" = drops the 140 UK home pages answered with status 202
// (none had JSON-LD or WordPress markers; 3 had a robots.txt).
// Groups under 30 sites are not shown (AIOSEO 25, SEOPress 4 UK WordPress sites).
// Chi-square, UK vs Japan: llms.txt p<0.001, AI bot blocking p<0.001,
// all 6 p<0.001. UK vs US: llms.txt p=0.31, all 6 p=0.39, blocking p=0.64.
// UK vs other overseas (excl. UK): llms.txt p<0.001, all 6 p=0.002, blocking p=0.63.

// [ja label, en label, UK, UK excl. 202, US, Japan, other overseas (excl. UK)]
const COMPARE = [
  ["到達件数", "Sites reached", "942", "802", "4,472", "2,486", "12,410"],
  ["WordPress", "WordPress", "73.4%", "86.2%", "74.5%", "92.3%", "75.7%"],
  ["llms.txt", "llms.txt", "21.5%", "25.3%", "23.1%", "13.4%", "26.7%"],
  ["llms-full.txt", "llms-full.txt", "1.3%", "1.5%", "1.5%", "0.6%", "1.8%"],
  ["JSON-LD", "JSON-LD", "68.8%", "80.8%", "69.0%", "69.4%", "72.3%"],
  ["JSON-LD が壊れている（JSON-LD があるサイト中）", "Broken JSON-LD (of sites with JSON-LD)", "2.0%", "2.0%", "1.6%", "1.7%", "1.8%"],
  ["Organization系の型", "Organization-type", "59.6%", "70.0%", "59.4%", "58.9%", "63.9%"],
  ["FAQPage", "FAQPage", "8.0%", "9.4%", "6.2%", "3.9%", "9.5%"],
  ["meta description", "Meta description", "69.3%", "81.4%", "68.0%", "90.7%", "71.6%"],
  ["Open Graph", "Open Graph", "69.1%", "81.2%", "69.1%", "81.3%", "72.7%"],
  ["canonical", "Canonical link", "72.7%", "85.4%", "74.3%", "84.6%", "76.7%"],
  ["robots.txt", "robots.txt", "74.2%", "86.8%", "76.1%", "91.8%", "78.7%"],
  ["AIボットをブロック（robots.txt があるサイト中）", "Blocks an AI bot (of sites with robots.txt)", "4.7%", "4.6%", "4.3%", "1.3%", "5.1%"],
  ["robots.txt でAIボットに言及", "robots.txt names an AI bot", "9.3%", "9.2%", "8.8%", "2.5%", "11.9%"],
  ["6項目の平均", "6-item average", "3.61", "4.24", "3.65", "4.05", "3.84"],
  ["5項目以上", "5+ items", "55.1%", "64.7%", "54.6%", "52.2%", "58.4%"],
  ["6項目すべて", "All 6 items", "17.7%", "20.8%", "18.9%", "10.4%", "22.1%"],
];

// [bot, UK blocked, UK %, US %, Japan %]  base = sites with robots.txt (UK 699 / US 3,404 / Japan 2,281)
const BOTS = [
  ["Bytespider", "33", "4.7%", "4.1%", "1.1%"],
  ["CCBot", "32", "4.6%", "4.1%", "1.1%"],
  ["anthropic-ai", "30", "4.3%", "3.4%", "1.0%"],
  ["ClaudeBot", "29", "4.1%", "3.5%", "1.0%"],
  ["Google-Extended", "29", "4.1%", "3.6%", "1.1%"],
  ["GPTBot", "28", "4.0%", "3.8%", "1.2%"],
  ["Applebot-Extended", "27", "3.9%", "3.3%", "1.0%"],
  ["OAI-SearchBot", "1", "0.1%", "0.3%", "0.0%"],
  ["ChatGPT-User", "0", "0.0%", "0.4%", "0.1%"],
  ["Claude-SearchBot", "0", "0.0%", "0.3%", "0.0%"],
  ["PerplexityBot", "0", "0.0%", "0.3%", "0.1%"],
  ["Googlebot", "0", "0.0%", "0.1%", "0.0%"],
  ["Bingbot", "0", "0.0%", "0.1%", "0.0%"],
];

// [type, UK, US, Japan]  share of reachable sites whose home page JSON-LD contains the @type
const TYPES = [
  ["WebSite", "66.2%", "65.7%", "63.0%"],
  ["SearchAction", "60.8%", "56.8%", "28.9%"],
  ["WebPage", "60.4%", "59.3%", "34.4%"],
  ["Organization", "56.1%", "55.4%", "54.4%"],
  ["ImageObject", "55.0%", "54.5%", "38.3%"],
  ["BreadcrumbList", "44.3%", "44.5%", "43.4%"],
  ["PostalAddress", "26.6%", "24.3%", "16.4%"],
  ["Person", "16.7%", "15.6%", "10.2%"],
  ["GeoCoordinates", "13.6%", "12.1%", "3.7%"],
  ["ProfessionalService", "12.1%", "10.1%", "5.6%"],
  ["LocalBusiness", "10.5%", "12.2%", "5.4%"],
  ["FAQPage", "8.0%", "6.2%", "3.9%"],
];

// [plugin, UK WordPress sites (share), llms.txt count (share), JSON-LD, 6-item average]
const PLUGINS = [
  ["Yoast SEO", "401 (58.0%)", "111 (27.7%)", "99.5%", "4.94"],
  ["Rank Math", "143 (20.7%)", "49 (34.3%)", "99.3%", "5.22"],
  ["検出なし / none detected", "118 (17.1%)", "24 (20.3%)", "59.3%", "3.77"],
];

// [score, UK, UK excl. 202, US, Japan]
const DIST = [
  ["0", "23.6%", "10.5%", "22.1%", "1.6%"],
  ["1", "1.9%", "2.0%", "2.5%", "4.8%"],
  ["2", "4.2%", "5.0%", "4.3%", "10.7%"],
  ["3", "3.1%", "3.6%", "3.6%", "15.4%"],
  ["4", "12.1%", "14.2%", "12.8%", "15.3%"],
  ["5", "37.4%", "43.9%", "35.7%", "41.8%"],
  ["6", "17.7%", "20.8%", "18.9%", "10.4%"],
];

const HEAD_JA = ["項目", "英国", "英国（202を除く）", "米国", "日本", "英国以外の海外"];
const HEAD_EN = ["Item", "UK", "UK (excl. 202)", "US", "Japan", "Other overseas"];

export default {
  slug: "research-uk-web-agencies-ai-search-2026",
  targetQueries: [
    "英国 Web制作会社 AI検索 対応状況 調査",
    "イギリス llms.txt 導入率",
    "UK web design agencies AI search readiness survey",
    "llms.txt adoption UK 2026",
    "UK agencies blocking AI crawlers robots.txt GPTBot",
  ],
  related: ["research-us-web-agencies-ai-search-2026", "research-japan-web-agencies-ai-search-2026", "research-ai-readiness-score-distribution-2026", "research-wordpress-seo-plugins-2026", "llms-txt"],
  locales: {
    ja: {
      title: "英国のWeb制作会社942社のAI検索対応を調査【2026年11月】 | Nurevo",
      description: "英国のWeb制作会社の自社サイト942件を調査。llms.txt は21.5%（日本13.4%）、6項目すべて満たすサイトは17.7%（日本10.4%）、AIボットのブロックは4.7%でした。",
      h1: "英国のWeb制作会社の自社サイト942件に見るAI検索への対応（2026年11月）",
      lead: "英国のWeb制作会社の自社サイト942件のトップページ・robots.txt・llms.txt を調べたところ、llms.txt があったのは21.5%（203件）で、日本の13.4%より高く、米国の23.1%とは統計的な差が見られませんでした。robots.txt でAIボットをブロックしていたのは4.7%（33件）で、GPTBot をブロックしていた28件はすべて、ChatGPT の検索用ボット（OAI-SearchBot）をブロックしていませんでした。",
      intro: [
        "公開：2026年11月18日。データ：2026年11月12日集計。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策（AEO）のツールと WordPress プラグインを提供しており、この分野に利害があります。国別レポートの2本目です（1本目は[米国](/guide/research-us-web-agencies-ai-search-2026)）。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "英国のWeb制作会社の自社サイト942件のうち、llms.txt があったのは21.5%（203件）。日本（13.4%）より高く（p<0.001）、米国（23.1%）とは差が見られませんでした（p=0.31）。トップページが HTTP 202 を返した140件を除くと25.3%です。",
            "AI検索に関わる6項目をすべて満たすサイトは17.7%（167件）で、日本（10.4%）の約1.7倍、米国（18.9%）とほぼ同じでした。JSON-LD は68.8%で、日本（69.4%）・米国（69.0%）と変わりません。",
            "robots.txt があるサイト699件のうち、AIボットをブロックしていたのは4.7%（33件、日本1.3%）。GPTBot をブロックしていた28件はすべて OAI-SearchBot を許可しており、PerplexityBot・Claude-SearchBot・ChatGPT-User をブロックしていたサイトは0件でした。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "対象：Web制作会社の自社サイト。当社の収集リストで国が英国となっている制作会社サイト1,555件のうち、トップページに到達できた942件です。一般企業のサイト全体ではありません。比較には同じ調査の米国（4,472件）・日本（2,486件）・英国以外の海外（12,410件）を使いました。",
            "取得したもの：各サイトのトップページ、/robots.txt、/llms.txt、/llms-full.txt を1回ずつ（User-Agent：NurevoSurvey/1.0）。2026年11月上旬〜12日に取得し、11月12日に集計しました。",
            "判定方法：llms.txt は、ステータス200で中身がHTMLではなく20文字を超えるテキストを「あり」としました。JSON-LD はトップページにあるかどうか、「壊れている」は JSON として読み込めないブロックが1つ以上あるもの。Organization系は @type に Organization・LocalBusiness・Corporation・ProfessionalService を含むもの。WordPress はトップページのHTMLに wp-content/・wp-includes/、または generator の WordPress 表記があるもの。SEOプラグインはトップページのHTMLの文字列で判定しました。",
            "AIボットのブロック：robots.txt で、各ボットに当てはまるグループの規則がトップページ（/）を Disallow にするか（最長一致）で判定しました。分母は robots.txt があるサイトです。「AIボットをブロック」は GPTBot・ClaudeBot・PerplexityBot・Google-Extended・CCBot・OAI-SearchBot のどれかをブロックしているものです。",
            "「6項目」は、(1) llms.txt がある、(2) JSON-LD がある、(3) Organization または LocalBusiness の型がある、(4) robots.txt があり GPTBot・ClaudeBot・PerplexityBot・OAI-SearchBot のどれもブロックしていない、(5) meta description がある、(6) canonical がある、のうち当てはまる数（0〜6）です。この調査のための単純な数で、Nurevo の0〜100点のスコアとは別物です。",
            "HTTP 202：英国では140件のトップページがステータス202を返しました（日本は0件）。これらのページには JSON-LD も WordPress の痕跡もなく、ボット確認などの別のページが返った可能性があります。そのため、202を除いた値も並べています。",
            "統計：英国と他の地域の差はカイ二乗検定で確かめました。30件未満の区分は載せていません。",
          ],
        },
        {
          heading: "結果：英国と米国・日本の比較",
          paragraphs: [
            "英国の値は、ほとんどの項目で米国と1〜2ポイント以内でした。日本と比べると、llms.txt・FAQPage・「6項目すべて」が高く、meta description・canonical・robots.txt は低めです。英国の低い項目は、202を返した140件（ほぼすべての項目が「なし」になる）の影響を受けています。202を除くと meta description 81.4%、canonical 85.4%、robots.txt 86.8% です。英国以外の海外全体（12,410件）と比べると、英国は llms.txt（21.5%と26.7%、p<0.001）と「6項目すべて」（17.7%と22.1%、p=0.002）が低めでした。",
          ],
          table: {
            head: HEAD_JA,
            rows: COMPARE.map(([ja, , ...v]) => [ja, ...v]),
            caption: "Web制作会社の自社サイトで、トップページに到達できたもの。「AIボットをブロック」「AIボットに言及」の分母は robots.txt があるサイト（英国699件・202を除く696件・米国3,404件・日本2,281件・英国以外の海外9,771件）。2026年11月12日集計。",
          },
        },
        {
          heading: "ボット別のブロック率",
          paragraphs: [
            "英国で robots.txt があるサイト699件について、ボットごとにトップページをブロックしている割合です。学習用とされるボット（Bytespider・CCBot・anthropic-ai・ClaudeBot・Google-Extended・GPTBot・Applebot-Extended）は3.9〜4.7%で、米国より少し高く、日本の3〜4倍でした。検索用やユーザーの質問に答えるときに使われるボットは、OAI-SearchBot の1件だけで、ChatGPT-User・Claude-SearchBot・PerplexityBot は0件。Googlebot・Bingbot も0件です。",
          ],
          table: {
            head: ["ボット", "英国（件数）", "英国", "米国", "日本"],
            rows: BOTS,
            caption: "分母は robots.txt があるサイト（英国699件・米国3,404件・日本2,281件）。トップページ（/）に対する判定。",
          },
        },
        {
          heading: "ブロックの中身（事実）",
          list: [
            "GPTBot をブロックしていた28件は、すべて（100%）OAI-SearchBot をブロックしていませんでした。米国では128件中119件（93.0%）です。",
            "上の11種のAIボットのどれかをブロックしていた35件のうち27件（77.1%）は、GPTBot・ClaudeBot・anthropic-ai・Google-Extended・CCBot・Bytespider・Applebot-Extended の7つをまとめてブロックする同じ組み合わせでした（米国は58.5%）。",
            "robots.txt でAIボットの名前を挙げていながら、どれもトップページをブロックしていないサイトが30件ありました（robots.txt があるサイトの4.3%）。",
            "AIボットをブロックしていた35件のうち12件（34.3%）には llms.txt もありました。",
          ],
        },
        {
          heading: "構造化データの型",
          paragraphs: [
            "トップページの JSON-LD に含まれる型を見ると、英国と米国はよく似た並びでした。日本との差が大きいのは SearchAction（英国60.8%・日本28.9%）、WebPage（60.4%・34.4%）、GeoCoordinates（13.6%・3.7%）などです。会社の所在地を示す PostalAddress は英国26.6%・日本16.4%でした。JSON-LD があるサイトのうち、JSON として読み込めないブロックがあったのは英国2.0%です。",
          ],
          table: {
            head: ["@type", "英国", "米国", "日本"],
            rows: TYPES,
            caption: "到達できたサイトのうち、トップページの JSON-LD にその型があった割合（入れ子の型も数えます）。英国942件・米国4,472件・日本2,486件。",
          },
        },
        {
          heading: "WordPress とSEOプラグイン",
          paragraphs: [
            "英国の制作会社サイトの73.4%（691件）が WordPress でした（202を除くと86.2%）。WordPress のサイトは llms.txt 28.1%、JSON-LD 92.6%、6項目の平均4.81 で、WordPress 以外（251件、うち140件が202）は llms.txt 3.6%、6項目の平均0.31 でした。SEOプラグインは Yoast SEO が58.0%、Rank Math が20.7%で、日本（AIOSEO 35.2%・Yoast 14.4%）とは傾向が違い、米国（Yoast 56.4%・Rank Math 18.0%）に近い構成です。AIOSEO（25件）と SEOPress（4件）は30件未満のため表に載せていません。",
            "llms.txt があった割合は Rank Math 34.3%、Yoast SEO 27.7%、プラグインを検出できなかったサイト20.3%でした。この調査では llms.txt をプラグインで作ったのか手で置いたのかは見ていません。",
          ],
          table: {
            head: ["SEOプラグイン", "英国の WordPress サイト", "llms.txt", "JSON-LD", "6項目の平均"],
            rows: PLUGINS,
            caption: "英国の WordPress サイト691件。プラグインはトップページのHTMLの文字列で判定（Yoast → Rank Math → AIOSEO → SEOPress の順に最初に当てはまったもの）。30件未満の区分は省略。",
          },
        },
        {
          heading: "6項目の分布",
          paragraphs: [
            "英国は米国と同じく「0項目」（23.6%）と「5〜6項目」（合わせて55.1%）に分かれていました。0項目の多くは202を返したサイトで、202を除くと10.5%です。日本は3〜4項目の層が厚く（合わせて30.7%）、英国の同じ層は15.2%でした。",
          ],
          table: {
            head: ["当てはまる項目数", "英国", "英国（202を除く）", "米国", "日本"],
            rows: DIST,
            caption: "到達できたサイトに占める割合。英国942件（202を除く802件）、米国4,472件、日本2,486件。",
          },
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "この調査の数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。そのまま使える1文：",
          ],
          list: [
            "英国のWeb制作会社の自社サイトの21.5%に llms.txt があった（日本13.4%、米国23.1%）（Nurevo AEO 調査、2026年11月、942件）。",
            "英国のWeb制作会社の自社サイトで、AI検索に関わる6項目をすべて満たしていたのは17.7%で、日本（10.4%）の約1.7倍だった（Nurevo AEO 調査、2026年11月）。",
            "英国のWeb制作会社の自社サイトのうち、robots.txt でAIボットをブロックしていたのは4.7%で、PerplexityBot をブロックしていたサイトは0件だった（Nurevo AEO 調査、2026年11月）。",
            "英国のWeb制作会社で GPTBot をブロックしていた28件は、すべて ChatGPT の検索用ボット OAI-SearchBot を許可していた（Nurevo AEO 調査、2026年11月）。",
            "英国のWeb制作会社の WordPress サイトの58.0%で Yoast SEO が検出された（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "限界",
          list: [
            "対象はWeb制作会社の自社サイトで、一般企業のサイト全体ではありません。国は当社の収集リストの記載によるもので、英国の制作会社全体を代表する標本ではありません。英国は942件で、米国（4,472件）より少ないため、ボット別の件数などは小さい数です。",
            "トップページだけを見ています。robots.txt はトップページ（/）に対する判定で、一部のディレクトリだけのブロックや、ファイアウォール・CDN によるブロックは数えていません。llms.txt は有無だけを見て、中身の質は見ていません。",
            "各サイト1回の取得で、到達できなかったサイト（613件）は除いています。HTTP 202 を返した140件は、実際のトップページとは違うページを見ている可能性があります。",
            "SEOプラグインはHTMLの文字列による判定で、痕跡を消している場合や複数入っている場合は正しく分けられません。",
            "今回の集計の一部には11月5日集計時の取得分を引き継いでいます。",
          ],
        },
        {
          heading: "当社の見方（意見）",
          paragraphs: [
            "ここからは事実ではなく当社の意見です。英国の制作会社サイトは、米国とほぼ同じ水準で、日本との差は llms.txt と「全部そろっているか」に表れていました。AIボットのブロックは少数で、ブロックしているサイトも学習用のボットに限り、検索用のボットはほぼ通していました。どのボットを止めるかは各社の判断ですが、AI検索に出たい場合は、検索用のボットまで止めていないかを確かめる価値があります。どれを整えてもAIの回答に出ることが保証されるわけではありません（[別の調査](/guide/aeo-signals-ai-answers-study)では、サイト側の項目と登場の間に関係は見られませんでした）。",
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
        { q: "英国の制作会社は日本よりAI検索への対応が進んでいますか？", a: "llms.txt（英国21.5%・日本13.4%）と「6項目すべて」（17.7%・10.4%）は英国が高く、JSON-LD は68.8%と69.4%でほぼ同じでした。meta description や canonical は日本のほうが高めです（2026年11月、Web制作会社の自社サイト）。" },
        { q: "英国と米国で違いはありますか？", a: "llms.txt（21.5%・23.1%）、6項目すべて（17.7%・18.9%）、AIボットのブロック（4.7%・4.3%）のどれも、統計的な差は見られませんでした。SEOプラグインもどちらも Yoast SEO が最多です。" },
        { q: "英国ではAIクローラーをブロックしているサイトが多いですか？", a: "robots.txt があるサイトの4.7%で、日本（1.3%）より多いものの少数でした。ブロックは学習用のボットに限られ、PerplexityBot・Claude-SearchBot をブロックしていたサイトは0件、OAI-SearchBot は1件です。" },
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
      title: "AI Search Readiness of 942 UK Web Agency Websites (2026) | Nurevo",
      description: "942 UK web agency sites: 21.5% have an llms.txt (Japan 13.4%, US 23.1%), 17.7% meet all six AI search items, 4.7% block an AI bot, and none block PerplexityBot.",
      h1: "AI search readiness of UK web design agencies: 942 agency websites (November 2026)",
      lead: "We fetched the home page, robots.txt and llms.txt of 942 UK web design agencies' own websites. 21.5% (203) had an llms.txt — higher than Japan (13.4%) and not statistically different from the US (23.1%). 4.7% of sites with a robots.txt blocked at least one AI bot, and all 28 sites blocking GPTBot still allowed OpenAI's search crawler, OAI-SearchBot.",
      intro: [
        "Published 2026-11-18. Data aggregated 2026-11-12. Research by Nurevo AEO (Bestie.合同会社), Japan. Nurevo sells AI search optimisation (AEO) tools and a WordPress plugin, and so has an interest in this topic. This is the second of our country reports (the first covered the [United States](/guide/research-us-web-agencies-ai-search-2026)).",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "21.5% (203) of 942 UK web agency websites had an llms.txt. That is higher than Japan (13.4%, p < 0.001) and not statistically different from the US (23.1%, p = 0.31). Excluding the 140 home pages that answered HTTP 202, the share is 25.3%.",
            "17.7% (167) of UK sites met all six AI-search items we checked — about 1.7 times Japan's 10.4% and close to the US (18.9%). JSON-LD use (68.8%) was the same as in Japan (69.4%) and the US (69.0%).",
            "Of 699 UK sites with a robots.txt, 4.7% (33) blocked an AI bot (Japan 1.3%). All 28 sites blocking GPTBot allowed OAI-SearchBot, and no site blocked PerplexityBot, Claude-SearchBot or ChatGPT-User.",
          ],
        },
        {
          heading: "Method",
          list: [
            "Population: web design agencies' own websites. Of 1,555 agency sites listed as UK in our collection list, 942 home pages could be reached. This is not a sample of UK businesses in general. For comparison we use the same survey's US (4,472), Japan (2,486) and all overseas sites outside the UK (12,410).",
            "Fetched: each site's home page, /robots.txt, /llms.txt and /llms-full.txt, once each (User-Agent: NurevoSurvey/1.0), early November to 12 November 2026; aggregated 2026-11-12.",
            "Classification: llms.txt = HTTP 200, not HTML, more than 20 characters. JSON-LD = present on the home page; \"broken\" = at least one block that does not parse as JSON. Organization-type = an @type of Organization, LocalBusiness, Corporation or ProfessionalService. WordPress = the home page HTML contains wp-content/ or wp-includes/, or a WordPress generator tag. SEO plugins were identified from strings in the home page HTML.",
            "AI bot blocking: whether the robots.txt rules that apply to each bot disallow the home page (/) (longest match); the base is sites with a robots.txt. \"Blocks an AI bot\" = blocks any of GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot or OAI-SearchBot.",
            "The six items: (1) has an llms.txt; (2) has JSON-LD; (3) has an Organization or LocalBusiness type; (4) has a robots.txt that blocks none of GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot; (5) has a meta description; (6) has a canonical link. The count (0–6) is a simple measure made for this survey, not Nurevo's 0–100 product score.",
            "HTTP 202: 140 UK home pages answered with status 202 (none in Japan). None of them had JSON-LD or WordPress markers, so they may have returned a bot-check or other interim page. We therefore also show figures excluding them.",
            "Statistics: differences between the UK and other groups were tested with chi-square tests. Groups with fewer than 30 sites are not shown.",
          ],
        },
        {
          heading: "Results: the UK compared with the US and Japan",
          paragraphs: [
            "On almost every item the UK was within one or two points of the US. Compared with Japan, the UK was higher on llms.txt, FAQPage and \"all six items\", and lower on meta descriptions, canonical links and robots.txt. The lower UK values are partly due to the 140 HTTP 202 pages, which fail almost every item; excluding them, meta description is 81.4%, canonical 85.4% and robots.txt 86.8%. Against all overseas sites outside the UK (12,410), the UK was lower on llms.txt (21.5% vs 26.7%, p < 0.001) and on all six items (17.7% vs 22.1%, p = 0.002).",
          ],
          table: {
            head: HEAD_EN,
            rows: COMPARE.map(([, en, ...v]) => [en, ...v]),
            caption: "Web design agencies' own websites whose home page could be reached. \"Blocks an AI bot\" and \"names an AI bot\" are shares of sites with a robots.txt (UK 699; UK excl. 202: 696; US 3,404; Japan 2,281; other overseas 9,771). Aggregated 2026-11-12.",
          },
        },
        {
          heading: "Blocking by bot",
          paragraphs: [
            "Share of the 699 UK sites with a robots.txt that block each bot from the home page. Crawlers generally described as training crawlers (Bytespider, CCBot, anthropic-ai, ClaudeBot, Google-Extended, GPTBot, Applebot-Extended) were blocked by 3.9–4.7% — slightly above the US and three to four times Japan. Among bots used for search or for fetching pages when a user asks, only OAI-SearchBot was blocked, by one site; ChatGPT-User, Claude-SearchBot and PerplexityBot were blocked by none. No site blocked Googlebot or Bingbot.",
          ],
          table: {
            head: ["Bot", "UK (sites)", "UK", "US", "Japan"],
            rows: BOTS,
            caption: "Base: sites with a robots.txt (UK 699; US 3,404; Japan 2,281). Judged for the home page (/).",
          },
        },
        {
          heading: "What the blocking looks like (facts)",
          list: [
            "All 28 sites blocking GPTBot (100%) did not block OAI-SearchBot. In the US the figure was 119 of 128 (93.0%).",
            "Of the 35 sites blocking any of the 11 AI bots above, 27 (77.1%) used the same combination: GPTBot, ClaudeBot, anthropic-ai, Google-Extended, CCBot, Bytespider and Applebot-Extended, all seven together (US 58.5%).",
            "30 sites (4.3% of those with a robots.txt) named an AI bot in robots.txt but blocked none from the home page.",
            "12 of the 35 sites blocking an AI bot (34.3%) also had an llms.txt.",
          ],
        },
        {
          heading: "Structured data types",
          paragraphs: [
            "The @types found in home page JSON-LD followed a very similar pattern in the UK and the US. The largest gaps with Japan were SearchAction (UK 60.8%, Japan 28.9%), WebPage (60.4% vs 34.4%) and GeoCoordinates (13.6% vs 3.7%). PostalAddress, which states the business address, appeared on 26.6% of UK sites and 16.4% in Japan. Of UK sites with JSON-LD, 2.0% had at least one block that did not parse.",
          ],
          table: {
            head: ["@type", "UK", "US", "Japan"],
            rows: TYPES,
            caption: "Share of reachable sites whose home page JSON-LD contains the type (nested types included). UK 942; US 4,472; Japan 2,486.",
          },
        },
        {
          heading: "WordPress and SEO plugins",
          paragraphs: [
            "73.4% (691) of UK agency sites ran WordPress (86.2% excluding HTTP 202). WordPress sites had llms.txt 28.1%, JSON-LD 92.6% and a 6-item average of 4.81; non-WordPress sites (251, of which 140 answered 202) had llms.txt 3.6% and an average of 0.31. Among WordPress sites, Yoast SEO was detected on 58.0% and Rank Math on 20.7% — close to the US (Yoast 56.4%, Rank Math 18.0%) and unlike Japan, where AIOSEO leads (35.2%) ahead of Yoast (14.4%). AIOSEO (25 sites) and SEOPress (4) are below our 30-site threshold and not shown.",
            "llms.txt adoption: Rank Math 34.3%, Yoast SEO 27.7%, no plugin detected 20.3%. We did not check whether the llms.txt was generated by a plugin or added by hand.",
          ],
          table: {
            head: ["SEO plugin", "UK WordPress sites", "llms.txt", "JSON-LD", "6-item average"],
            rows: PLUGINS,
            caption: "691 UK WordPress sites. Plugin = the first match in the home page HTML in the order Yoast → Rank Math → AIOSEO → SEOPress. Groups under 30 sites omitted.",
          },
        },
        {
          heading: "Distribution of the six items",
          paragraphs: [
            "Like the US, the UK split into 0 items (23.6%) and 5–6 items (55.1% combined). Most of the zeros are HTTP 202 pages; excluding them, 0 items falls to 10.5%. Japan has a thicker middle (3–4 items, 30.7% combined) where the UK has 15.2%.",
          ],
          table: {
            head: ["Items met", "UK", "UK (excl. 202)", "US", "Japan"],
            rows: DIST,
            caption: "Share of reachable sites. UK 942 (excl. 202: 802); US 4,472; Japan 2,486.",
          },
        },
        {
          heading: "Citing this survey",
          paragraphs: [
            "You may quote and republish the figures and tables freely, as long as you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. Sentences ready to quote:",
          ],
          list: [
            "21.5% of UK web design agencies' own websites had an llms.txt file, compared with 13.4% in Japan and 23.1% in the US (Nurevo AEO survey, November 2026, 942 UK sites).",
            "17.7% of UK web agency websites met all six AI-search readiness items checked, about 1.7 times the share in Japan (10.4%) (Nurevo AEO survey, November 2026).",
            "4.7% of UK web agency websites with a robots.txt blocked an AI bot, and none blocked PerplexityBot (Nurevo AEO survey, November 2026).",
            "All 28 UK web agency websites that blocked GPTBot still allowed OpenAI's search crawler OAI-SearchBot (Nurevo AEO survey, November 2026).",
            "Yoast SEO was detected on 58.0% of UK web agencies' WordPress sites and Rank Math on 20.7% (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Limitations",
          list: [
            "The population is web design agencies' own websites, not businesses in general. Country comes from our collection list, and the sample is not representative of all UK agencies. With 942 UK sites, counts such as per-bot blocking are small numbers.",
            "Only the home page was examined. robots.txt was judged for / only; partial blocking and blocking by firewalls or CDNs were not counted. For llms.txt we checked only whether it exists, not its quality.",
            "One fetch per site; unreachable sites (613) are excluded. The 140 HTTP 202 responses may not reflect the real home page.",
            "SEO plugins were detected from HTML strings; sites that hide plugin markers or run several plugins may be misclassified.",
            "Part of this aggregation reuses fetches from the 5 November run.",
          ],
        },
        {
          heading: "Our reading (opinion)",
          paragraphs: [
            "What follows is our opinion, not a finding. UK agency sites look much like US ones; the gap with Japan is in llms.txt and in having everything in place. AI bot blocking is a minority practice, and where it happens it is limited to training crawlers — search crawlers are almost always let in. Which bots to block is each site owner's decision, but sites that want to appear in AI search may want to confirm they are not blocking search crawlers by accident. None of this guarantees appearing in AI answers (in [another of our studies](/guide/aeo-signals-ai-answers-study), on-site signals showed no relationship with appearance).",
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
        { q: "Are UK agencies ahead of Japan on AI search readiness?", a: "On llms.txt (UK 21.5%, Japan 13.4%) and on meeting all six items (17.7% vs 10.4%), yes. JSON-LD is about the same (68.8% vs 69.4%), and Japan is higher on meta descriptions and canonical links (November 2026, agencies' own websites)." },
        { q: "How does the UK compare with the US?", a: "We found no statistically significant difference on llms.txt (21.5% vs 23.1%), all six items (17.7% vs 18.9%) or AI bot blocking (4.7% vs 4.3%). Yoast SEO is the most common plugin in both." },
        { q: "Do many UK sites block AI crawlers?", a: "4.7% of sites with a robots.txt, more than Japan (1.3%) but a small minority. Blocking is limited to training crawlers: no site blocked PerplexityBot or Claude-SearchBot, and one blocked OAI-SearchBot." },
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
