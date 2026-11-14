// Content page: research report. WordPress SEO plugins (Yoast SEO, Rank Math,
// All in One SEO, SEOPress) on web design agencies' own websites: share by
// region / country, and AI-search-related items on the home page by plugin.
// November 2026.
//
// Every number here comes from nurevo-outreach data/survey/raw_2026-11-12.json
// (survey.js; the same run as summary_2026-11-12.json, whose percentages match).
// Do not add a figure that is not in that data. The raw file holds company names
// and domains: never publish them, nor any group under 30 sites (Japan SEOPress
// and Slim SEO had 1 site each and are omitted; country rows need 100+ WordPress
// sites). Definitions follow survey.js: WordPress = wp-content/ | wp-includes/ |
// generator WordPress in the home page HTML; SEO plugin = the FIRST of
// yoast / rank-math|rankmath / all in one seo|aioseo / seopress / slim seo whose
// string appears in that HTML (so a page with both Yoast and AIOSEO traces counts
// as Yoast); "blocked" = the robots.txt group for the bot disallows "/" (longest
// match), any of GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot,
// OAI-SearchBot; the 6-item check is survey.js score() and is not Nurevo's
// 0–100 product score.

const SHARE_JA = {
  head: ["SEOプラグイン", "日本（2,295件）", "海外（10,081件）"],
  rows: [
    ["All in One SEO", "807（35.2%）", "614（6.1%）"],
    ["Yoast SEO", "331（14.4%）", "5,356（53.1%）"],
    ["Rank Math", "40（1.7%）", "2,237（22.2%）"],
    ["SEOPress", "—（30件未満）", "76（0.8%）"],
    ["検出なし", "1,115（48.6%）", "1,798（17.8%）"],
  ],
  caption: "トップページに到達できたWeb制作会社の自社サイトのうち、WordPress で作られているもの。2026年11月12日集計。Slim SEO は日本1件・海外0件。",
};
const SHARE_EN = {
  head: ["SEO plugin", "Japan (2,295 sites)", "Outside Japan (10,081 sites)"],
  rows: [
    ["All in One SEO", "807 (35.2%)", "614 (6.1%)"],
    ["Yoast SEO", "331 (14.4%)", "5,356 (53.1%)"],
    ["Rank Math", "40 (1.7%)", "2,237 (22.2%)"],
    ["SEOPress", "— (under 30)", "76 (0.8%)"],
    ["None detected", "1,115 (48.6%)", "1,798 (17.8%)"],
  ],
  caption: "WordPress sites among web design agencies' own websites whose home page could be reached. Aggregated 2026-11-12. Slim SEO: 1 site in Japan, 0 outside.",
};

// [ja, en, WP sites, AIOSEO, Yoast, Rank Math, SEOPress, none]
const COUNTRY = [
  ["日本", "Japan", "2,295", "35.2%", "14.4%", "1.7%", "0.0%", "48.6%"],
  ["アメリカ", "United States", "3,333", "7.1%", "56.4%", "18.0%", "1.2%", "17.4%"],
  ["インド", "India", "1,383", "6.9%", "42.7%", "29.9%", "0.3%", "20.2%"],
  ["オーストラリア", "Australia", "1,306", "5.6%", "53.5%", "22.8%", "0.9%", "17.2%"],
  ["イギリス", "United Kingdom", "691", "3.6%", "58.0%", "20.7%", "0.6%", "17.1%"],
  ["カナダ", "Canada", "650", "7.1%", "53.7%", "21.4%", "0.5%", "17.4%"],
  ["シンガポール", "Singapore", "521", "6.0%", "50.3%", "23.0%", "0.2%", "20.5%"],
  ["フランス", "France", "374", "2.9%", "55.9%", "20.9%", "1.1%", "19.3%"],
  ["ニュージーランド", "New Zealand", "314", "5.1%", "52.2%", "20.7%", "0.6%", "21.3%"],
  ["南アフリカ", "South Africa", "294", "7.5%", "52.4%", "22.8%", "0.7%", "16.7%"],
  ["ブラジル", "Brazil", "200", "2.0%", "54.0%", "26.0%", "0.0%", "18.0%"],
  ["フィリピン", "Philippines", "198", "6.1%", "51.5%", "24.2%", "0.0%", "18.2%"],
  ["アイルランド", "Ireland", "172", "4.7%", "53.5%", "19.2%", "0.0%", "22.7%"],
  ["スペイン", "Spain", "167", "3.6%", "58.1%", "30.5%", "1.2%", "6.6%"],
];

// [group ja, group en, sites, llms.txt, JSON-LD, Org-type, BreadcrumbList, OGP, canonical, AI bot blocked, 6-item avg, all 6]
const ITEMS = [
  ["日本・All in One SEO", "Japan, All in One SEO", "807", "19.3%", "95.0%", "93.1%", "88.6%", "93.8%", "100.0%", "1.1%", "5.0", "17.0%"],
  ["日本・Yoast SEO", "Japan, Yoast SEO", "331", "20.5%", "99.1%", "71.6%", "92.7%", "97.6%", "99.1%", "0.3%", "4.8", "16.9%"],
  ["日本・Rank Math", "Japan, Rank Math", "40", "22.5%", "92.5%", "92.5%", "5.0%", "97.5%", "100.0%", "0.0%", "5.0", "22.5%"],
  ["日本・検出なし（WordPress）", "Japan, none detected (WordPress)", "1,115", "7.7%", "48.3%", "35.2%", "4.5%", "72.3%", "75.8%", "1.1%", "3.4", "4.0%"],
  ["日本・WordPress以外", "Japan, not WordPress", "191", "6.3%", "28.3%", "23.6%", "3.1%", "49.7%", "42.9%", "9.3%", "2.1", "4.7%"],
  ["海外・Yoast SEO", "Outside Japan, Yoast SEO", "5,356", "30.8%", "99.0%", "80.1%", "89.3%", "98.4%", "99.0%", "3.8%", "5.0", "26.0%"],
  ["海外・Rank Math", "Outside Japan, Rank Math", "2,237", "40.8%", "99.4%", "99.1%", "3.8%", "99.7%", "99.0%", "5.4%", "5.3", "37.2%"],
  ["海外・All in One SEO", "Outside Japan, All in One SEO", "614", "51.1%", "98.0%", "97.2%", "91.9%", "95.0%", "99.5%", "4.2%", "5.3", "43.8%"],
  ["海外・SEOPress", "Outside Japan, SEOPress", "76", "32.9%", "100.0%", "89.5%", "6.6%", "98.7%", "100.0%", "9.2%", "5.1", "26.3%"],
  ["海外・検出なし（WordPress）", "Outside Japan, none detected (WordPress)", "1,798", "24.2%", "62.0%", "58.0%", "13.8%", "65.1%", "92.4%", "4.4%", "3.9", "17.5%"],
  ["海外・WordPress以外", "Outside Japan, not WordPress", "3,271", "5.6%", "9.0%", "8.4%", "1.2%", "10.4%", "10.2%", "15.9%", "0.6", "2.6%"],
];

const LLMS_ROWS_JA = [
  ["日本・Rank Math", "9 / 40", "22.5%"],
  ["日本・Yoast SEO", "68 / 331", "20.5%"],
  ["日本・All in One SEO", "156 / 807", "19.3%"],
  ["日本・検出なし（WordPress）", "86 / 1,115", "7.7%"],
  ["海外・All in One SEO", "314 / 614", "51.1%"],
  ["海外・Rank Math", "913 / 2,237", "40.8%"],
  ["海外・SEOPress", "25 / 76", "32.9%"],
  ["海外・Yoast SEO", "1,650 / 5,356", "30.8%"],
  ["海外・検出なし（WordPress）", "436 / 1,798", "24.2%"],
];
const LLMS_ROWS_EN = LLMS_ROWS_JA.map(([g, k, s]) => [
  g.replace("日本・", "Japan, ").replace("海外・", "Outside Japan, ").replace("検出なし（WordPress）", "none detected (WordPress)"),
  k,
  s,
]);

const BLOCK_ROWS_JA = [
  ["日本・All in One SEO", "9 / 785", "1.1%"],
  ["日本・Yoast SEO", "1 / 327", "0.3%"],
  ["日本・Rank Math", "0 / 39", "0.0%"],
  ["日本・検出なし（WordPress）", "11 / 1,042", "1.1%"],
  ["海外・Yoast SEO", "199 / 5,221", "3.8%"],
  ["海外・Rank Math", "116 / 2,166", "5.4%"],
  ["海外・All in One SEO", "25 / 593", "4.2%"],
  ["海外・SEOPress", "7 / 76", "9.2%"],
  ["海外・検出なし（WordPress）", "76 / 1,708", "4.4%"],
];
const BLOCK_ROWS_EN = BLOCK_ROWS_JA.map(([g, k, s]) => [
  g.replace("日本・", "Japan, ").replace("海外・", "Outside Japan, ").replace("検出なし（WordPress）", "none detected (WordPress)"),
  k,
  s,
]);

export default {
  slug: "research-wordpress-seo-plugins-2026",
  targetQueries: [
    "SEOプラグイン シェア 日本 調査",
    "All in One SEO Yoast Rank Math 比較 調査",
    "WordPress SEOプラグイン 利用率",
    "SEOプラグイン llms.txt 導入率",
    "WordPress SEO plugin market share 2026",
    "Yoast vs Rank Math vs AIOSEO usage statistics",
    "SEO plugin llms.txt adoption",
  ],
  related: ["research-japan-web-agencies-ai-search-2026", "local-business-schema-seo-plugins", "aeo-wordpress", "llms-txt"],
  locales: {
    ja: {
      title: "SEOプラグイン別のAI検索対応調査【制作会社12,376件】 | Nurevo",
      description: "Web制作会社のWordPressサイト12,376件を調査。日本はAll in One SEOが35.2%で最多、海外はYoast SEOが53.1%。プラグイン別のllms.txt・構造化データ・AIボットのブロック率。",
      h1: "WordPressのSEOプラグイン別に見たAI検索対応：Web制作会社サイト12,376件を調査（2026年11月）",
      lead: "日本と海外のWeb制作会社の自社サイトのうち、WordPress で作られている12,376件のトップページを調べたところ、日本でいちばん多く検出されたSEOプラグインは All in One SEO（35.2%）、海外は Yoast SEO（53.1%）でした。日本では、SEOプラグインが検出されたサイトの19.3〜22.5%に llms.txt があった一方、検出されなかったサイトでは7.7%でした。",
      intro: [
        "公開：2026年11月14日。データ：2026年11月12日集計。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策（AEO）のツールと WordPress プラグインを提供しており、この分野に利害があります。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "日本の WordPress 制作会社サイト2,295件で検出されたSEOプラグインは、All in One SEO 35.2%（807件）、Yoast SEO 14.4%（331件）、Rank Math 1.7%（40件）。48.6%（1,115件）ではどれも検出されませんでした。海外10,081件では Yoast SEO 53.1%、Rank Math 22.2%、All in One SEO 6.1%です。",
            "llms.txt がある割合は、日本では SEOプラグイン検出ありの3区分で19.3〜22.5%、検出なしで7.7%。海外では All in One SEO 51.1%、Rank Math 40.8%、Yoast SEO 30.8%、検出なし24.2%でした。",
            "robots.txt でAIボットをトップページから締め出しているサイトは、どのプラグインの区分でも少数でした（日本0.0〜1.1%、海外3.8〜9.2%）。海外では WordPress 以外のサイトの方が高く15.9%でした。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "対象：Web制作会社の自社サイト。日本3,352件（制作会社であることを確認できたもの）と海外20,335件、計23,687件。一般企業のサイト全体ではありません。",
            "到達：トップページを取得できたのは15,838件（日本2,486件、海外13,352件）。このうち WordPress と判定した12,376件（日本2,295件、海外10,081件）がこのレポートの主な対象です。",
            "取得したもの：各サイトのトップページ、/robots.txt、/llms.txt、/llms-full.txt を1回ずつ（User-Agent：NurevoSurvey/1.0）。2026年11月上旬〜12日に取得し、11月12日に集計しました。",
            "判定方法：WordPress は、トップページのHTMLに wp-content/・wp-includes/、または generator の WordPress 表記があるもの。SEOプラグインは、同じHTMLに yoast、rank-math（rankmath）、all in one seo（aioseo）、seopress、slim seo の文字列があるかをこの順に調べ、最初に見つかったものとしました。llms.txt は、ステータス200で中身がHTMLではなく20文字を超えるテキストを「あり」としました。AIボットのブロックは、robots.txt で GPTBot・ClaudeBot・PerplexityBot・Google-Extended・CCBot・OAI-SearchBot のいずれかについて、トップページ（/）が Disallow になるか（最長一致）で判定し、分母は robots.txt があるサイトです。",
            "国は当社の収集リストでの所在国です。30件未満の区分は載せていません（国別のシェアは WordPress サイトが100件以上ある国だけ）。",
          ],
        },
        {
          heading: "結果：SEOプラグインのシェア",
          paragraphs: [
            "日本と海外で順位が入れ替わります。日本では All in One SEO が Yoast SEO の約2.4倍（807件と331件）で、Rank Math は1.7%でした。海外では Yoast SEO が半数を超え、Rank Math が2割強で続きます。日本では WordPress サイトの約半数でどのプラグインも検出されませんでした（理由は「限界」を参照）。",
          ],
          table: SHARE_JA,
        },
        {
          heading: "国別のシェア",
          paragraphs: [
            "WordPress サイトが100件以上ある13か国では、いずれも Yoast SEO が最多（42.7〜58.1%）で、Rank Math は18.0〜30.5%でした。All in One SEO が最多なのは、今回の対象では日本だけです。",
          ],
          table: {
            head: ["国・地域", "WordPress件数", "All in One SEO", "Yoast SEO", "Rank Math", "SEOPress", "検出なし"],
            rows: COUNTRY.map(([ja, , ...v]) => [ja, ...v]),
            caption: "各国の WordPress サイトに占める割合。Slim SEO はどの国でも0〜1件のため省略。",
          },
        },
        {
          heading: "プラグイン別：トップページの項目",
          paragraphs: [
            "SEOプラグインが検出された区分では、JSON-LD・OGP・canonical が9割以上でそろっていました。差が出たのは llms.txt と、パンくず（BreadcrumbList）です。BreadcrumbList は Rank Math・SEOPress の区分でトップページにはほとんど見られませんでした。これは各プラグインがトップページに何を出力するかの既定の違いとみられ、下層ページでの扱いはこの調査では見ていません。",
            "「6項目」は、(1) llms.txt がある、(2) JSON-LD がある、(3) Organization または LocalBusiness の型がある、(4) robots.txt があり GPTBot・ClaudeBot・PerplexityBot・OAI-SearchBot のどれもブロックしていない、(5) meta description がある、(6) canonical がある、のうち当てはまる数です。この調査のための単純な数で、Nurevo の0〜100点のスコアとは別物です。",
          ],
          table: {
            head: ["区分", "件数", "llms.txt", "JSON-LD", "Organization系", "BreadcrumbList", "OGP", "canonical", "AIボットをブロック", "6項目の平均", "6項目すべて"],
            rows: ITEMS.map(([ja, , ...v]) => [ja, ...v]),
            caption: "AIボットをブロックの分母は各区分で robots.txt があるサイト。Organization系は @type に Organization・LocalBusiness・Corporation・ProfessionalService を含むもの。",
          },
        },
        {
          heading: "llms.txt の導入率（プラグイン別）",
          paragraphs: [
            "日本では、SEOプラグインが検出されたサイトの llms.txt 導入率は、検出されなかったサイトの約2.5〜2.9倍でした。海外は全体に高く、All in One SEO の区分では半数を超えています。なお、この調査では llms.txt をどのプラグインやツールが作ったかは判定していません。",
          ],
          table: {
            head: ["区分", "llms.txt あり", "割合"],
            rows: LLMS_ROWS_JA,
            caption: "WordPress サイトのみ。30件未満の区分は省略。",
          },
        },
        {
          heading: "AIボットのブロック（プラグイン別）",
          paragraphs: [
            "日本ではどの区分でも1.1%以下でした。海外は3.8〜9.2%で、検索用の OAI-SearchBot をブロックしていたのは海外の Yoast SEO 区分11件、Rank Math・All in One SEO 区分各3件、検出なし2件と、ごく一部です。",
          ],
          table: {
            head: ["区分", "ブロックあり / robots.txt あり", "割合"],
            rows: BLOCK_ROWS_JA,
            caption: "GPTBot・ClaudeBot・PerplexityBot・Google-Extended・CCBot・OAI-SearchBot のいずれかでトップページ（/）が Disallow。",
          },
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "この調査の数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。そのまま使える1文：",
          ],
          list: [
            "国内Web制作会社の WordPress サイトで最も多く使われていたSEOプラグインは All in One SEO（35.2%、2,295件中807件）で、Yoast SEO は14.4%だった（Nurevo AEO 調査、2026年11月）。",
            "海外のWeb制作会社の WordPress サイトでは Yoast SEO が53.1%、Rank Math が22.2%、All in One SEO が6.1%だった（Nurevo AEO 調査、2026年11月）。",
            "国内の WordPress 制作会社サイトの llms.txt 導入率は、SEOプラグイン検出ありで19.3〜22.5%、検出なしで7.7%だった（Nurevo AEO 調査、2026年11月）。",
            "国内の WordPress 制作会社サイトの48.6%では、主要5つのSEOプラグインのいずれもトップページから検出されなかった（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "限界",
          list: [
            "プラグインはトップページのHTMLに残る文字列で判定しています。プラグイン名を出さない設定・キャッシュや最適化による除去があると「検出なし」になり、複数の名前が残るサイトは先に調べた方（Yoast SEO → Rank Math → All in One SEO → SEOPress → Slim SEO）に数えています。",
            "調べたのは5つのプラグインだけです。日本で使われている SEO SIMPLE PACK などの他のプラグインや、テーマに組み込まれたSEO機能は判定しておらず、「検出なし」に含まれます。日本で「検出なし」が多い理由の一部はこれと考えられます。",
            "トップページだけを見ています。robots.txt はトップページ（/）に対する判定で、一部のディレクトリだけのブロックや、ファイアウォール・CDN によるブロックは数えていません。",
            "対象はWeb制作会社の自社サイトで、一般企業のサイト全体ではありません。プラグインと各項目の関係は同時に見られたというだけで、プラグインが原因であることを示すものではありません（SEOに詳しい会社ほどプラグインを入れ、ほかの対策もしている、ということもありえます）。",
            "各サイト1回の取得で、到達できなかったサイトは除いています。llms.txt は有無だけを見て、中身の質は見ていません。",
          ],
        },
        {
          heading: "当社の見方（意見）",
          paragraphs: [
            "ここからは事実ではなく当社の意見です。どのSEOプラグインの区分でも、構造化データ・canonical・OGP といった基本の項目は高い割合でそろっていました。プラグインごとの差は、llms.txt のような新しい項目と、トップページに出す構造化データの中身に表れています。SEOプラグインを入れていない WordPress サイトや WordPress 以外のサイトでは、基本の項目から抜けていることが多いため、まずそこを確かめるのがよいと考えます。どれを整えてもAIの回答に出ることが保証されるわけではありません（[別の調査](/guide/aeo-signals-ai-answers-study)では、サイト側の項目と登場の間に関係は見られませんでした）。",
          ],
        },
        {
          heading: "自社やお客様のサイトを確かめる",
          paragraphs: [
            "[無料チェック](https://nurevo.jp/check)で、llms.txt・構造化データ・AIクローラーの許可状況を1分ほどで確認できます。WordPress なら [Nurevo WebMCP プラグイン](https://wordpress.org/plugins/nurevo-webmcp/)で llms.txt を出し、Yoast SEO・Rank Math・All in One SEO が出す構造化データに、足りない会社の事実を重複させずに加えられます。お客様のサイトにまとめて入れたい制作会社の方は[パートナー制度](https://nurevo.jp/partner/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "日本の制作会社でいちばん使われているSEOプラグインは？", a: "この調査では All in One SEO で、国内の WordPress 制作会社サイト2,295件中807件（35.2%）でした。Yoast SEO は331件（14.4%）、Rank Math は40件（1.7%）です（2026年11月）。" },
        { q: "海外ではどうですか？", a: "海外のWeb制作会社の WordPress サイト10,081件では、Yoast SEO 53.1%、Rank Math 22.2%、All in One SEO 6.1%、SEOPress 0.8%でした。WordPress サイトが100件以上ある13か国のすべてで Yoast SEO が最多です。" },
        { q: "SEOプラグインを入れると llms.txt やAI対応が良くなりますか？", a: "この調査は同時に見られた傾向を示すだけで、因果は示していません。日本では検出ありの区分で llms.txt が19.3〜22.5%、検出なしで7.7%でしたが、AIの回答に出ることを保証するものでもありません。" },
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
      footnote: "調査：Nurevo AEO（Bestie.合同会社）。Yoast SEO・Rank Math・All in One SEO・SEOPress・WordPress などの名称は各社・各団体の商標です。各プラグインの開発元とは関係のない独自調査です。個別の会社名・ドメインは公開しません。",
    },
    en: {
      title: "WordPress SEO Plugins and AI Search: 12,376 Agency Sites | Nurevo",
      description: "12,376 WordPress sites of web design agencies: All in One SEO leads in Japan (35.2%), Yoast SEO elsewhere (53.1%). llms.txt, schema and AI bot blocking by plugin.",
      h1: "WordPress SEO plugins and AI search readiness: 12,376 web agency websites (November 2026)",
      lead: "We examined the home pages of 12,376 WordPress websites of web design agencies in Japan and other countries. The most common SEO plugin in Japan was All in One SEO (35.2%); outside Japan it was Yoast SEO (53.1%). In Japan, 19.3–22.5% of sites with a detected SEO plugin had an llms.txt, against 7.7% of sites with none detected.",
      intro: [
        "Published 2026-11-14. Data aggregated 2026-11-12. Research by Nurevo AEO (Bestie.合同会社). Nurevo sells AI search optimization (AEO) tools and a WordPress plugin, and so has an interest in this topic.",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "Among 2,295 WordPress sites of Japanese web agencies, we detected All in One SEO on 35.2% (807), Yoast SEO on 14.4% (331) and Rank Math on 1.7% (40); none of the plugins was detected on 48.6% (1,115). Among 10,081 WordPress agency sites outside Japan: Yoast SEO 53.1%, Rank Math 22.2%, All in One SEO 6.1%.",
            "llms.txt adoption in Japan was 19.3–22.5% across the three detected-plugin groups and 7.7% with no plugin detected. Outside Japan: All in One SEO 51.1%, Rank Math 40.8%, Yoast SEO 30.8%, none detected 24.2%.",
            "Few sites in any plugin group blocked AI bots from the home page in robots.txt (Japan 0.0–1.1%, outside Japan 3.8–9.2%). Outside Japan, non-WordPress sites blocked more often (15.9%).",
          ],
        },
        {
          heading: "Method",
          list: [
            "Population: web design agencies' own websites — 3,352 in Japan (confirmed as agencies) and 20,335 in other countries, 23,687 in total. Not businesses in general.",
            "Reached: 15,838 home pages could be fetched (Japan 2,486, outside Japan 13,352). This report focuses on the 12,376 identified as WordPress (Japan 2,295, outside Japan 10,081).",
            "Fetched: each site's home page, /robots.txt, /llms.txt and /llms-full.txt, once each (User-Agent: NurevoSurvey/1.0), early November to 12 November 2026; aggregated 2026-11-12.",
            "Classification: WordPress = the home page HTML contains wp-content/ or wp-includes/, or a WordPress generator tag. SEO plugin = the first of the strings yoast, rank-math (rankmath), all in one seo (aioseo), seopress and slim seo found in that HTML, checked in that order. llms.txt = HTTP 200, not HTML, more than 20 characters. AI bot blocking = the robots.txt rules that apply to any of GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot or OAI-SearchBot disallow the home page (/) (longest match); the base is sites with a robots.txt.",
            "Country is the country in our own collection list. Groups under 30 sites are not shown (country shares only for countries with 100+ WordPress sites).",
          ],
        },
        {
          heading: "Results: plugin share",
          paragraphs: [
            "The ranking flips between Japan and elsewhere. In Japan All in One SEO appears about 2.4 times as often as Yoast SEO (807 vs 331 sites) and Rank Math is at 1.7%. Outside Japan Yoast SEO is on more than half of WordPress sites, followed by Rank Math at just over a fifth. About half of Japanese WordPress sites showed none of the five plugins (see Limitations).",
          ],
          table: SHARE_EN,
        },
        {
          heading: "Plugin share by country",
          paragraphs: [
            "In all 13 countries with 100+ WordPress sites, Yoast SEO is the most common (42.7–58.1%) and Rank Math is at 18.0–30.5%. Japan is the only country in this survey where All in One SEO leads.",
          ],
          table: {
            head: ["Country", "WordPress sites", "All in One SEO", "Yoast SEO", "Rank Math", "SEOPress", "None detected"],
            rows: COUNTRY.map(([, en, ...v]) => [en, ...v]),
            caption: "Share of each country's WordPress sites. Slim SEO (0–1 sites per country) omitted.",
          },
        },
        {
          heading: "Home page items by plugin",
          paragraphs: [
            "Where an SEO plugin was detected, JSON-LD, Open Graph and canonical links were present on more than 90% of sites. The differences are in llms.txt and in BreadcrumbList, which rarely appears on the home page in the Rank Math and SEOPress groups — most likely a difference in what each plugin outputs on the front page by default. We did not look at inner pages.",
            "The six items are: (1) has an llms.txt; (2) has JSON-LD; (3) has an Organization or LocalBusiness type; (4) has a robots.txt that blocks none of GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot; (5) has a meta description; (6) has a canonical link. This is a simple count made for this survey, not Nurevo's 0–100 product score.",
          ],
          table: {
            head: ["Group", "Sites", "llms.txt", "JSON-LD", "Organization-type", "BreadcrumbList", "Open Graph", "canonical", "Blocks an AI bot", "6-item average", "All 6"],
            rows: ITEMS.map(([, en, ...v]) => [en, ...v]),
            caption: "\"Blocks an AI bot\" uses sites with a robots.txt as the base. Organization-type = an @type of Organization, LocalBusiness, Corporation or ProfessionalService.",
          },
        },
        {
          heading: "llms.txt by plugin",
          paragraphs: [
            "In Japan, sites with a detected SEO plugin had an llms.txt about 2.5 to 2.9 times as often as sites with none detected. Adoption is higher overall outside Japan, and above half in the All in One SEO group. We did not determine which plugin or tool generated each llms.txt.",
          ],
          table: {
            head: ["Group", "Has llms.txt", "Share"],
            rows: LLMS_ROWS_EN,
            caption: "WordPress sites only. Groups under 30 sites omitted.",
          },
        },
        {
          heading: "AI bot blocking by plugin",
          paragraphs: [
            "In Japan no group exceeded 1.1%. Outside Japan the range was 3.8–9.2%; very few sites blocked the search crawler OAI-SearchBot (11 in the Yoast SEO group, 3 each in Rank Math and All in One SEO, 2 with none detected).",
          ],
          table: {
            head: ["Group", "Blocking / with robots.txt", "Share"],
            rows: BLOCK_ROWS_EN,
            caption: "Any of GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot or OAI-SearchBot disallowed from the home page (/).",
          },
        },
        {
          heading: "Citing this survey",
          paragraphs: [
            "You may quote and republish the figures and tables freely, as long as you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. Sentences ready to quote:",
          ],
          list: [
            "All in One SEO was the most common SEO plugin on Japanese web agencies' WordPress sites (35.2%, 807 of 2,295), ahead of Yoast SEO at 14.4% (Nurevo AEO survey, November 2026).",
            "Outside Japan, 53.1% of web agencies' WordPress sites used Yoast SEO, 22.2% Rank Math and 6.1% All in One SEO (Nurevo AEO survey, November 2026).",
            "In all 13 countries with 100+ WordPress agency sites in the survey, Yoast SEO was the most common SEO plugin (42.7–58.1%) (Nurevo AEO survey, November 2026).",
            "51.1% of web agency WordPress sites outside Japan using All in One SEO had an llms.txt, versus 30.8% of those using Yoast SEO (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Limitations",
          list: [
            "Plugins are identified from strings left in the home page HTML. Settings that hide the plugin name, or caching and minification that strip it, lead to \"none detected\"; sites with traces of more than one are counted under the first checked (Yoast SEO, Rank Math, All in One SEO, SEOPress, Slim SEO).",
            "Only five plugins were checked. Others (such as SEO SIMPLE PACK, used in Japan) and SEO features built into themes are counted as \"none detected\", which likely explains part of the high Japanese figure.",
            "Only the home page was examined. robots.txt was judged for / only; partial blocking and blocking by firewalls or CDNs were not counted.",
            "The population is web design agencies' own websites, not businesses in general. The plugin–item relationships are co-occurrences, not evidence that the plugin causes them (agencies more invested in SEO may both install a plugin and do other work).",
            "One fetch per site; unreachable sites are excluded. For llms.txt we checked only whether it exists, not its quality.",
          ],
        },
        {
          heading: "Our reading (opinion)",
          paragraphs: [
            "What follows is our opinion, not a finding. In every SEO plugin group, basic items such as structured data, canonical links and Open Graph were largely in place; the differences between plugins show up in newer items such as llms.txt and in what structured data is output on the home page. WordPress sites without a detected SEO plugin, and non-WordPress sites, more often miss the basics, so we think that is the first thing to check. None of this guarantees appearing in AI answers (in [another of our studies](/guide/aeo-signals-ai-answers-study), on-site signals showed no relationship with appearance).",
          ],
        },
        {
          heading: "Check your own or your clients' sites",
          paragraphs: [
            "The [free check](https://nurevo.jp/check) shows llms.txt, structured data and AI crawler access in about a minute. On WordPress, the [Nurevo WebMCP plugin](https://wordpress.org/plugins/nurevo-webmcp/) publishes an llms.txt and adds missing business facts into the structured data that Yoast SEO, Rank Math or All in One SEO already outputs, without duplicating it. Agencies that want to roll it out across client sites can see the [partner program](https://nurevo.jp/partner/).",
          ],
        },
      ],
      faqs: [
        { q: "Which SEO plugin do Japanese web agencies use most?", a: "In this survey, All in One SEO: 807 of 2,295 Japanese web agency WordPress sites (35.2%). Yoast SEO was on 331 (14.4%) and Rank Math on 40 (1.7%) (November 2026)." },
        { q: "What about other countries?", a: "Across 10,081 WordPress agency sites outside Japan: Yoast SEO 53.1%, Rank Math 22.2%, All in One SEO 6.1%, SEOPress 0.8%. Yoast SEO leads in all 13 countries with 100+ WordPress sites." },
        { q: "Does an SEO plugin improve llms.txt or AI readiness?", a: "The survey shows co-occurrence, not cause. In Japan llms.txt was on 19.3–22.5% of sites with a detected plugin and 7.7% without, and none of this guarantees appearing in AI answers." },
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
      footnote: "Research by Nurevo AEO (Bestie.合同会社). Yoast SEO, Rank Math, All in One SEO, SEOPress and WordPress are trademarks of their owners. This is independent research, not affiliated with the plugin developers. Individual companies and domains are not published.",
    },
  },
};
