// Content page: research report (country report: United States). AI search
// readiness of US web design agencies' own websites, compared with Japan,
// the UK, Canada, Australia and other overseas agencies. November 2026.
//
// Every number here comes from nurevo-outreach data/survey/raw_2026-11-12.json
// (survey.js; the same run as summary_2026-11-12.json — the US totals match
// summary.byCountry.US: 4,472 reached, llms.txt 23.1%, JSON-LD 69.0%,
// WordPress 74.5%, AI bot blocked 4.3%, 6-item average 3.7). Country = the
// "co" field of our collection list. Do not add a figure that is not in that
// data. The raw file holds company names and domains: never publish them.
// Definitions follow survey.js: llms.txt = 200, not HTML, >20 chars;
// Organization-type = an @type matching Organization|LocalBusiness|Corporation|
// ProfessionalService; "blocks an AI bot" = the robots.txt group for any of
// GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, OAI-SearchBot
// disallows "/" (longest match), base = sites with a robots.txt; the 6-item
// check is survey.js score() and is not Nurevo's 0–100 product score.
// "Excluding HTTP 202" = drops the 671 US home pages answered with status 202
// (none had JSON-LD or WordPress markers; 28 had a robots.txt).
// Chi-square, US vs Japan: llms.txt p<0.001, AI bot blocking p<0.001,
// 6 of 6 p<0.001. US vs other overseas: llms.txt p<0.001, blocking p=0.012.

// [ja label, en label, US, US excl. 202, UK, Canada, Australia, other overseas, Japan]
const COMPARE = [
  ["到達件数", "Sites reached", "4,472", "3,801", "942", "908", "1,719", "8,880", "2,486"],
  ["WordPress", "WordPress", "74.5%", "87.7%", "73.4%", "71.6%", "76.0%", "76.0%", "92.3%"],
  ["llms.txt", "llms.txt", "23.1%", "27.2%", "21.5%", "22.9%", "24.3%", "28.0%", "13.4%"],
  ["llms-full.txt", "llms-full.txt", "1.5%", "1.7%", "1.3%", "1.5%", "1.6%", "2.0%", "0.6%"],
  ["JSON-LD", "JSON-LD", "69.0%", "81.1%", "68.8%", "68.1%", "71.3%", "73.5%", "69.4%"],
  ["Organization系の型", "Organization-type", "59.4%", "69.9%", "59.6%", "60.7%", "62.2%", "65.7%", "58.9%"],
  ["FAQPage", "FAQPage", "6.2%", "7.3%", "8.0%", "8.0%", "10.3%", "10.9%", "3.9%"],
  ["meta description", "Meta description", "68.0%", "80.0%", "69.3%", "67.3%", "70.2%", "73.2%", "90.7%"],
  ["canonical", "Canonical link", "74.3%", "87.4%", "72.7%", "71.3%", "75.9%", "77.5%", "84.6%"],
  ["robots.txt", "robots.txt", "76.1%", "88.8%", "74.2%", "72.7%", "77.7%", "79.6%", "91.8%"],
  ["AIボットをブロック（robots.txt があるサイト中）", "Blocks an AI bot (of sites with robots.txt)", "4.3%", "4.0%", "4.7%", "3.5%", "4.7%", "5.5%", "1.3%"],
  ["robots.txt でAIボットに言及", "robots.txt names an AI bot", "8.8%", "8.6%", "9.3%", "9.8%", "10.7%", "13.2%", "2.5%"],
  ["6項目の平均", "6-item average", "3.65", "4.29", "3.61", "3.58", "3.77", "3.92", "4.05"],
  ["5項目以上", "5+ items", "54.6%", "64.2%", "55.1%", "55.2%", "56.7%", "60.0%", "52.2%"],
  ["6項目すべて", "All 6 items", "18.9%", "22.3%", "17.7%", "18.9%", "20.8%", "23.3%", "10.4%"],
];

// [bot, US blocked, US %, Japan %, other overseas %]  base = sites with robots.txt (US 3,404 / Japan 2,281 / other overseas 7,066)
const BOTS = [
  ["CCBot", "140", "4.1%", "1.1%", "5.3%"],
  ["Bytespider", "138", "4.1%", "1.1%", "5.2%"],
  ["GPTBot", "128", "3.8%", "1.2%", "4.8%"],
  ["Google-Extended", "124", "3.6%", "1.1%", "4.5%"],
  ["ClaudeBot", "120", "3.5%", "1.0%", "4.5%"],
  ["anthropic-ai", "116", "3.4%", "1.0%", "4.2%"],
  ["Applebot-Extended", "111", "3.3%", "1.0%", "4.3%"],
  ["ChatGPT-User", "12", "0.4%", "0.1%", "0.3%"],
  ["OAI-SearchBot", "9", "0.3%", "0.0%", "0.2%"],
  ["Claude-SearchBot", "10", "0.3%", "0.0%", "0.1%"],
  ["PerplexityBot", "11", "0.3%", "0.1%", "0.3%"],
  ["Googlebot", "4", "0.1%", "0.0%", "0.1%"],
  ["Bingbot", "5", "0.1%", "0.0%", "0.1%"],
];

// [plugin, US WordPress sites, llms.txt count (share), JSON-LD, 6-item average]
const PLUGINS = [
  ["All in One SEO (AIOSEO)", "236", "126 (53.4%)", "96.6%", "5.34"],
  ["Rank Math", "599", "229 (38.2%)", "99.3%", "5.27"],
  ["SEOPress", "39", "13 (33.3%)", "100.0%", "5.08"],
  ["Yoast SEO", "1,880", "527 (28.0%)", "99.0%", "4.91"],
  ["検出なし / none detected", "579", "108 (18.7%)", "56.0%", "3.72"],
];

// [score, US, US excl. 202, Japan]
const DIST = [
  ["0", "22.1%", "8.8%", "1.6%"],
  ["1", "2.5%", "2.5%", "4.8%"],
  ["2", "4.3%", "5.1%", "10.7%"],
  ["3", "3.6%", "4.3%", "15.4%"],
  ["4", "12.8%", "15.0%", "15.3%"],
  ["5", "35.7%", "42.0%", "41.8%"],
  ["6", "18.9%", "22.3%", "10.4%"],
];

const HEAD_JA = ["項目", "米国", "米国（202を除く）", "英国", "カナダ", "豪州", "米国以外の海外", "日本"];
const HEAD_EN = ["Item", "US", "US (excl. 202)", "UK", "Canada", "Australia", "Other overseas", "Japan"];

export default {
  slug: "research-us-web-agencies-ai-search-2026",
  targetQueries: [
    "米国 Web制作会社 AI検索 対応状況 調査",
    "アメリカ llms.txt 導入率",
    "US web design agencies AI search readiness survey",
    "llms.txt adoption rate United States 2026",
    "AI crawler blocking robots.txt US agencies",
  ],
  related: ["research-japan-web-agencies-ai-search-2026", "research-ai-readiness-score-distribution-2026", "research-wordpress-seo-plugins-2026", "llms-txt"],
  locales: {
    ja: {
      title: "米国のWeb制作会社4,472社のAI検索対応を調査【2026年11月】 | Nurevo",
      description: "米国のWeb制作会社の自社サイト4,472件を調査。llms.txt は23.1%（日本13.4%）、6項目すべて満たすサイトは18.9%（日本10.4%）、AIボットのブロックは4.3%で検索用ボットは0.3%でした。",
      h1: "米国のWeb制作会社の自社サイト4,472件に見るAI検索への対応（2026年11月）",
      lead: "米国のWeb制作会社の自社サイト4,472件のトップページ・robots.txt・llms.txt を調べたところ、llms.txt があったのは23.1%（1,032件）で、日本の13.4%より高く、英国（21.5%）・カナダ（22.9%）・豪州（24.3%）と同じくらいでした。AI学習用のボットを robots.txt でブロックしていたのは4.3%で、GPTBot をブロックしていた128件のうち119件は、ChatGPT の検索用ボット（OAI-SearchBot）をブロックしていませんでした。",
      intro: [
        "公開：2026年11月17日。データ：2026年11月12日集計。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策（AEO）のツールと WordPress プラグインを提供しており、この分野に利害があります。国別レポートの1本目です。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "米国のWeb制作会社の自社サイト4,472件のうち、llms.txt があったのは23.1%（1,032件）。日本（13.4%、2,486件中333件）より約10ポイント高く、統計的にもはっきりした差でした（p<0.001）。トップページが HTTP 202 を返した671件を除くと27.2%です。",
            "JSON-LD（構造化データ）は米国69.0%・日本69.4%でほぼ同じ。一方、AI検索に関わる6項目をすべて満たすサイトは米国18.9%（846件）で、日本（10.4%）の約1.8倍でした。",
            "robots.txt があるサイト3,404件のうち、AIボットをブロックしていたのは4.3%（147件、日本1.3%）。ブロックされていたのは CCBot・Bytespider（各4.1%）、GPTBot（3.8%）など学習用のボットが中心で、OAI-SearchBot・Claude-SearchBot・PerplexityBot といった検索用のボットは各0.3%（9〜11件）でした。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "対象：Web制作会社の自社サイト。当社の収集リストで国が米国となっている制作会社サイト6,646件のうち、トップページに到達できた4,472件です。一般企業のサイト全体ではありません。比較には同じ調査の日本（2,486件）・英国（942件）・カナダ（908件）・豪州（1,719件）、米国以外の海外（8,880件）を使いました。",
            "取得したもの：各サイトのトップページ、/robots.txt、/llms.txt、/llms-full.txt を1回ずつ（User-Agent：NurevoSurvey/1.0）。2026年11月上旬〜12日に取得し、11月12日に集計しました。",
            "判定方法：llms.txt は、ステータス200で中身がHTMLではなく20文字を超えるテキストを「あり」としました。JSON-LD はトップページにあるかどうか、Organization系は @type に Organization・LocalBusiness・Corporation・ProfessionalService を含むもの。WordPress はトップページのHTMLに wp-content/・wp-includes/、または generator の WordPress 表記があるもの。SEOプラグインはトップページのHTMLの文字列で判定しました。",
            "AIボットのブロック：robots.txt で、各ボットに当てはまるグループの規則がトップページ（/）を Disallow にするか（最長一致）で判定しました。分母は robots.txt があるサイトです。「AIボットをブロック」は GPTBot・ClaudeBot・PerplexityBot・Google-Extended・CCBot・OAI-SearchBot のどれかをブロックしているものです。",
            "「6項目」は、(1) llms.txt がある、(2) JSON-LD がある、(3) Organization または LocalBusiness の型がある、(4) robots.txt があり GPTBot・ClaudeBot・PerplexityBot・OAI-SearchBot のどれもブロックしていない、(5) meta description がある、(6) canonical がある、のうち当てはまる数（0〜6）です。この調査のための単純な数で、Nurevo の0〜100点のスコアとは別物です。",
            "HTTP 202：米国では671件のトップページがステータス202を返しました（日本は0件）。これらのページには JSON-LD も WordPress の痕跡もなく、ボット確認などの別のページが返った可能性があります。そのため、202を除いた値も並べています。",
          ],
        },
        {
          heading: "結果：米国と日本・英語圏の比較",
          paragraphs: [
            "米国の値は、英国・カナダ・豪州とほぼ同じ水準でした。日本と比べると、llms.txt・FAQPage・「6項目すべて」が高く、meta description・canonical・robots.txt は低めです。ただし米国の低い項目は、202を返した671件（ほぼすべての項目が「なし」になる）の影響を受けています。202を除くと meta description 80.0%、canonical 87.4%、robots.txt 88.8% で、日本との差は小さくなります。",
          ],
          table: {
            head: HEAD_JA,
            rows: COMPARE.map(([ja, , ...v]) => [ja, ...v]),
            caption: "Web制作会社の自社サイトで、トップページに到達できたもの。「AIボットをブロック」「AIボットに言及」の分母は robots.txt があるサイト（米国3,404件・202を除く3,376件・英国699件・カナダ660件・豪州1,336件・米国以外の海外7,066件・日本2,281件）。2026年11月12日集計。",
          },
        },
        {
          heading: "ボット別のブロック率",
          paragraphs: [
            "米国で robots.txt があるサイト3,404件について、ボットごとにトップページをブロックしている割合です。学習用とされるボット（CCBot・Bytespider・GPTBot・Google-Extended・ClaudeBot など）は3〜4%台、ユーザーの質問に答えるときや検索用に使われるボット（ChatGPT-User・OAI-SearchBot・Claude-SearchBot・PerplexityBot）は0.3〜0.4%でした。Googlebot をブロックしていたのは4件、Bingbot は5件です。",
          ],
          table: {
            head: ["ボット", "米国（件数）", "米国", "日本", "米国以外の海外"],
            rows: BOTS,
            caption: "分母は robots.txt があるサイト（米国3,404件・日本2,281件・米国以外の海外7,066件）。トップページ（/）に対する判定。",
          },
        },
        {
          heading: "ブロックの中身（事実）",
          list: [
            "GPTBot をブロックしていた128件のうち119件（93.0%）は、OAI-SearchBot をブロックしていませんでした。学習用のボットは止めて、検索用のボットは通している形です。",
            "上の11種のAIボットのどれかをブロックしていた159件のうち93件（58.5%）は、GPTBot・ClaudeBot・anthropic-ai・Google-Extended・CCBot・Bytespider・Applebot-Extended の7つをまとめてブロックする同じ組み合わせでした。",
            "robots.txt でAIボットの名前を挙げていながら、どれもブロックしていないサイトが149件ありました（robots.txt があるサイトの4.4%）。名前を挙げて許可しているか、トップページ以外だけを止めているものです。",
            "AIボットをブロックしていた159件のうち55件（34.6%）には llms.txt もありました。",
          ],
        },
        {
          heading: "WordPress とSEOプラグイン",
          paragraphs: [
            "米国の制作会社サイトの74.5%（3,333件）が WordPress でした（202を除くと87.7%）。WordPress のサイトは llms.txt 30.1%、JSON-LD 91.4%、6項目の平均4.8 で、WordPress 以外（1,139件、うち671件が202）は llms.txt 2.5%、6項目の平均0.28 でした。SEOプラグインは Yoast SEO が56.4%、Rank Math が18.0%、AIOSEO が7.1%で、日本（AIOSEO 35.2%・Yoast 14.4%）とは順位が逆でした。",
            "プラグイン別に llms.txt があった割合を見ると、AIOSEO 53.4%、Rank Math 38.2%、SEOPress 33.3%、Yoast SEO 28.0%、プラグインを検出できなかったサイト18.7%でした。この調査では llms.txt をプラグインで作ったのか手で置いたのかは見ていません。",
          ],
          table: {
            head: ["SEOプラグイン", "米国の WordPress サイト", "llms.txt", "JSON-LD", "6項目の平均"],
            rows: PLUGINS,
            caption: "米国の WordPress サイト3,333件。プラグインはトップページのHTMLの文字列で判定（Yoast → Rank Math → AIOSEO → SEOPress の順に最初に当てはまったもの）。SEOPress は39件と少なめです。",
          },
        },
        {
          heading: "6項目の分布",
          paragraphs: [
            "米国は「0項目」（22.1%）と「6項目すべて」（18.9%）の両方が日本より多く、二極に分かれていました。0項目の多くは202を返したサイトで、202を除くと0項目は8.8%です。日本は3〜4項目の層が厚く（合わせて30.7%）、6項目すべては10.4%でした。日本の5項目のサイトでは、欠けている項目の多くが llms.txt です（[スコア分布の調査](/guide/research-ai-readiness-score-distribution-2026)）。",
          ],
          table: {
            head: ["当てはまる項目数", "米国", "米国（202を除く）", "日本"],
            rows: DIST,
            caption: "到達できたサイトに占める割合。米国4,472件（202を除く3,801件）、日本2,486件。",
          },
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "この調査の数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。そのまま使える1文：",
          ],
          list: [
            "米国のWeb制作会社の自社サイトの23.1%に llms.txt があった（日本は13.4%）（Nurevo AEO 調査、2026年11月、4,472件）。",
            "米国のWeb制作会社の自社サイトで、AI検索に関わる6項目をすべて満たしていたのは18.9%で、日本（10.4%）の約1.8倍だった（Nurevo AEO 調査、2026年11月）。",
            "米国のWeb制作会社の自社サイトのうち、robots.txt でAIボットをブロックしていたのは4.3%で、ChatGPT の検索用ボット OAI-SearchBot をブロックしていたのは0.3%だった（Nurevo AEO 調査、2026年11月）。",
            "米国のWeb制作会社の WordPress サイトで最も多いSEOプラグインは Yoast SEO（56.4%）で、日本で最も多い AIOSEO（35.2%）とは異なった（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "限界",
          list: [
            "対象はWeb制作会社の自社サイトで、一般企業のサイト全体ではありません。国は当社の収集リストの記載によるもので、米国の制作会社全体を代表する標本ではありません。",
            "トップページだけを見ています。robots.txt はトップページ（/）に対する判定で、一部のディレクトリだけのブロックや、ファイアウォール・CDN によるブロックは数えていません。llms.txt は有無だけを見て、中身の質は見ていません。",
            "各サイト1回の取得で、到達できなかったサイトは除いています。HTTP 202 を返した671件は、実際のトップページとは違うページを見ている可能性があります。",
            "SEOプラグインはHTMLの文字列による判定で、痕跡を消している場合や複数入っている場合は正しく分けられません。",
            "今回の集計の一部には11月5日集計時の取得分を引き継いでいます。",
          ],
        },
        {
          heading: "当社の見方（意見）",
          paragraphs: [
            "ここからは事実ではなく当社の意見です。米国と日本の制作会社サイトは、構造化データの導入率はほぼ同じで、差が大きいのは llms.txt と、それを含めた「全部そろっているか」の部分でした。日本の制作会社にとっては、新しい対策を一から始めるより、すでにある構造化データに会社の事実を足し、llms.txt のような小さな抜けを埋めるほうが近道だと考えます。また米国のデータでは、学習用のボットは止めても検索用のボットは通すサイトがほとんどでした。どちらを止めるかは各社の判断ですが、AI検索に出たい場合は検索用のボットまで止めていないかを確かめる価値があります。どれを整えてもAIの回答に出ることが保証されるわけではありません（[別の調査](/guide/aeo-signals-ai-answers-study)では、サイト側の項目と登場の間に関係は見られませんでした）。",
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
        { q: "米国の制作会社は日本よりAI検索への対応が進んでいますか？", a: "llms.txt（米国23.1%・日本13.4%）と「6項目すべて」（18.9%・10.4%）は米国が高く、JSON-LD は69.0%と69.4%でほぼ同じでした。meta description や canonical は日本のほうが高めです（2026年11月、Web制作会社の自社サイト）。" },
        { q: "米国ではAIクローラーをブロックしているサイトが多いですか？", a: "robots.txt があるサイトの4.3%で、日本（1.3%）よりは多いものの少数でした。ブロックの多くは学習用のボットで、検索用の OAI-SearchBot をブロックしていたのは0.3%です。" },
        { q: "HTTP 202 とは何ですか？", a: "米国の671件のトップページが返したステータスです。JSON-LD などが見つからず、ボット確認などの別のページが返った可能性があるため、除いた値も載せています。" },
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
      title: "AI Search Readiness of 4,472 US Web Agency Websites (2026) | Nurevo",
      description: "4,472 US web agency sites: 23.1% have an llms.txt (Japan 13.4%), 18.9% meet all six AI search items, 4.3% block an AI bot, and only 0.3% block OAI-SearchBot.",
      h1: "AI search readiness of US web design agencies: 4,472 agency websites (November 2026)",
      lead: "We fetched the home page, robots.txt and llms.txt of 4,472 US web design agencies' own websites. 23.1% (1,032) had an llms.txt — higher than Japan (13.4%) and in line with the UK (21.5%), Canada (22.9%) and Australia (24.3%). 4.3% of sites with a robots.txt blocked at least one AI bot, and of the 128 sites blocking GPTBot, 119 did not block OpenAI's search crawler, OAI-SearchBot.",
      intro: [
        "Published 2026-11-17. Data aggregated 2026-11-12. Research by Nurevo AEO (Bestie.合同会社), Japan. Nurevo sells AI search optimization (AEO) tools and a WordPress plugin, and so has an interest in this topic. This is the first of our country reports.",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "23.1% (1,032) of 4,472 US web agency websites had an llms.txt, about 10 points more than Japan (13.4%, 333 of 2,486); the difference is statistically clear (p < 0.001). Excluding the 671 home pages that answered HTTP 202, the share is 27.2%.",
            "JSON-LD structured data was almost identical (US 69.0%, Japan 69.4%), but 18.9% (846) of US sites met all six AI-search items we checked — about 1.8 times Japan's 10.4%.",
            "Of 3,404 US sites with a robots.txt, 4.3% (147) blocked an AI bot (Japan 1.3%). Blocking targeted mainly training crawlers — CCBot and Bytespider (4.1% each), GPTBot (3.8%) — while search and retrieval bots such as OAI-SearchBot, Claude-SearchBot and PerplexityBot were blocked by 0.3% (9–11 sites) each.",
          ],
        },
        {
          heading: "Method",
          list: [
            "Population: web design agencies' own websites. Of 6,646 agency sites listed as US in our collection list, 4,472 home pages could be reached. This is not a sample of US businesses in general. For comparison we use the same survey's Japan (2,486), UK (942), Canada (908), Australia (1,719) and all overseas sites outside the US (8,880).",
            "Fetched: each site's home page, /robots.txt, /llms.txt and /llms-full.txt, once each (User-Agent: NurevoSurvey/1.0), early November to 12 November 2026; aggregated 2026-11-12.",
            "Classification: llms.txt = HTTP 200, not HTML, more than 20 characters. JSON-LD = present on the home page; Organization-type = an @type of Organization, LocalBusiness, Corporation or ProfessionalService. WordPress = the home page HTML contains wp-content/ or wp-includes/, or a WordPress generator tag. SEO plugins were identified from strings in the home page HTML.",
            "AI bot blocking: whether the robots.txt rules that apply to each bot disallow the home page (/) (longest match); the base is sites with a robots.txt. \"Blocks an AI bot\" = blocks any of GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot or OAI-SearchBot.",
            "The six items: (1) has an llms.txt; (2) has JSON-LD; (3) has an Organization or LocalBusiness type; (4) has a robots.txt that blocks none of GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot; (5) has a meta description; (6) has a canonical link. The count (0–6) is a simple measure made for this survey, not Nurevo's 0–100 product score.",
            "HTTP 202: 671 US home pages answered with status 202 (none in Japan). None of them had JSON-LD or WordPress markers, so they may have returned a bot-check or other interim page. We therefore also show figures excluding them.",
          ],
        },
        {
          heading: "Results: the US compared with Japan and other English-speaking markets",
          paragraphs: [
            "US figures were close to the UK, Canada and Australia. Compared with Japan, the US was higher on llms.txt, FAQPage and \"all six items\", and lower on meta descriptions, canonical links and robots.txt. The lower US values are partly due to the 671 HTTP 202 pages, which fail almost every item; excluding them, meta description is 80.0%, canonical 87.4% and robots.txt 88.8%, much closer to Japan.",
          ],
          table: {
            head: HEAD_EN,
            rows: COMPARE.map(([, en, ...v]) => [en, ...v]),
            caption: "Web design agencies' own websites whose home page could be reached. \"Blocks an AI bot\" and \"names an AI bot\" are shares of sites with a robots.txt (US 3,404; US excl. 202: 3,376; UK 699; Canada 660; Australia 1,336; other overseas 7,066; Japan 2,281). Aggregated 2026-11-12.",
          },
        },
        {
          heading: "Blocking by bot",
          paragraphs: [
            "Share of the 3,404 US sites with a robots.txt that block each bot from the home page. Crawlers generally described as training crawlers (CCBot, Bytespider, GPTBot, Google-Extended, ClaudeBot and others) were blocked by 3–4%; bots used for search or for fetching pages when a user asks (ChatGPT-User, OAI-SearchBot, Claude-SearchBot, PerplexityBot) by 0.3–0.4%. Googlebot was blocked by 4 sites and Bingbot by 5.",
          ],
          table: {
            head: ["Bot", "US (sites)", "US", "Japan", "Other overseas"],
            rows: BOTS,
            caption: "Base: sites with a robots.txt (US 3,404; Japan 2,281; other overseas 7,066). Judged for the home page (/).",
          },
        },
        {
          heading: "What the blocking looks like (facts)",
          list: [
            "Of the 128 sites blocking GPTBot, 119 (93.0%) did not block OAI-SearchBot — they keep out the training crawler but let the search crawler in.",
            "Of the 159 sites blocking any of the 11 AI bots above, 93 (58.5%) used the same combination: GPTBot, ClaudeBot, anthropic-ai, Google-Extended, CCBot, Bytespider and Applebot-Extended, all seven together.",
            "149 sites (4.4% of those with a robots.txt) named an AI bot in robots.txt but blocked none from the home page — they either allow it by name or restrict only other paths.",
            "55 of the 159 sites blocking an AI bot (34.6%) also had an llms.txt.",
          ],
        },
        {
          heading: "WordPress and SEO plugins",
          paragraphs: [
            "74.5% (3,333) of US agency sites ran WordPress (87.7% excluding HTTP 202). WordPress sites had llms.txt 30.1%, JSON-LD 91.4% and a 6-item average of 4.8; non-WordPress sites (1,139, of which 671 answered 202) had llms.txt 2.5% and an average of 0.28. Among WordPress sites, Yoast SEO was detected on 56.4%, Rank Math 18.0% and AIOSEO 7.1% — the reverse of Japan, where AIOSEO leads (35.2%) ahead of Yoast (14.4%).",
            "llms.txt adoption by SEO plugin: AIOSEO 53.4%, Rank Math 38.2%, SEOPress 33.3%, Yoast SEO 28.0%, no plugin detected 18.7%. We did not check whether the llms.txt was generated by a plugin or added by hand.",
          ],
          table: {
            head: ["SEO plugin", "US WordPress sites", "llms.txt", "JSON-LD", "6-item average"],
            rows: PLUGINS,
            caption: "3,333 US WordPress sites. Plugin = the first match in the home page HTML in the order Yoast → Rank Math → AIOSEO → SEOPress. SEOPress has only 39 sites.",
          },
        },
        {
          heading: "Distribution of the six items",
          paragraphs: [
            "The US had more sites at both ends than Japan: 0 items (22.1%) and all 6 (18.9%). Most of the zeros are HTTP 202 pages; excluding them, 0 items falls to 8.8%. Japan has a thicker middle (3–4 items, 30.7% combined) and 10.4% with all six. On Japanese sites with five items, the missing one is usually llms.txt ([score distribution study](/guide/research-ai-readiness-score-distribution-2026)).",
          ],
          table: {
            head: ["Items met", "US", "US (excl. 202)", "Japan"],
            rows: DIST,
            caption: "Share of reachable sites. US 4,472 (excl. 202: 3,801); Japan 2,486.",
          },
        },
        {
          heading: "Citing this survey",
          paragraphs: [
            "You may quote and republish the figures and tables freely, as long as you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. Sentences ready to quote:",
          ],
          list: [
            "23.1% of US web design agencies' own websites had an llms.txt file, compared with 13.4% in Japan (Nurevo AEO survey, November 2026, 4,472 US sites).",
            "18.9% of US web agency websites met all six AI-search readiness items checked, about 1.8 times the share in Japan (10.4%) (Nurevo AEO survey, November 2026).",
            "4.3% of US web agency websites with a robots.txt blocked an AI bot, but only 0.3% blocked OpenAI's search crawler OAI-SearchBot (Nurevo AEO survey, November 2026).",
            "Of US web agency sites blocking GPTBot, 93% still allowed OAI-SearchBot (Nurevo AEO survey, November 2026).",
            "Yoast SEO was detected on 56.4% of US web agencies' WordPress sites, Rank Math on 18.0% and AIOSEO on 7.1% (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Limitations",
          list: [
            "The population is web design agencies' own websites, not businesses in general. Country comes from our collection list, and the sample is not representative of all US agencies.",
            "Only the home page was examined. robots.txt was judged for / only; partial blocking and blocking by firewalls or CDNs were not counted. For llms.txt we checked only whether it exists, not its quality.",
            "One fetch per site; unreachable sites are excluded. The 671 HTTP 202 responses may not reflect the real home page.",
            "SEO plugins were detected from HTML strings; sites that hide plugin markers or run several plugins may be misclassified.",
            "Part of this aggregation reuses fetches from the 5 November run.",
          ],
        },
        {
          heading: "Our reading (opinion)",
          paragraphs: [
            "What follows is our opinion, not a finding. US and Japanese agency sites use structured data at almost the same rate; the gap is in llms.txt and in having everything in place. In the US data, nearly every site that blocks training crawlers still lets search crawlers in. Whether to block either is each site owner's decision, but sites that want to appear in AI search may want to confirm they are not blocking search crawlers by accident. None of this guarantees appearing in AI answers (in [another of our studies](/guide/aeo-signals-ai-answers-study), on-site signals showed no relationship with appearance).",
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
        { q: "Are US agencies ahead of Japan on AI search readiness?", a: "On llms.txt (US 23.1%, Japan 13.4%) and on meeting all six items (18.9% vs 10.4%), yes. JSON-LD is about the same (69.0% vs 69.4%), and Japan is higher on meta descriptions and canonical links (November 2026, agencies' own websites)." },
        { q: "Do many US sites block AI crawlers?", a: "4.3% of sites with a robots.txt, more than Japan (1.3%) but still a small minority. Most blocking targets training crawlers; only 0.3% block OAI-SearchBot." },
        { q: "What is the HTTP 202 issue?", a: "671 US home pages answered with status 202 and showed no JSON-LD or WordPress markers, so they may have returned an interim page. We show figures with and without them." },
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
