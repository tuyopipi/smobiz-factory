// Content page: research report. Structured data (JSON-LD / microdata) on the
// home pages of web design agencies' own websites: types used, how often it is
// broken, WordPress vs not, SEO plugin, country. November 2026.
//
// Every number here comes from nurevo-outreach data/survey/raw_2026-11-12.json
// (survey.js; the same run as summary_2026-11-12.json, whose percentages match).
// Do not add a figure that is not in that data. The raw file holds company names
// and domains: never publish them, nor any group under 30 sites (broken-rate
// cells are shown only where at least 30 sites in the group have JSON-LD).
// Definitions follow survey.js: "has JSON-LD" = at least one
// <script type="application/ld+json"> on the home page; "broken" = at least one
// of those blocks fails JSON.parse; "Organization-type" = an @type matching
// Organization|LocalBusiness|Corporation|ProfessionalService (nested included);
// SEO plugin = the first of yoast / rank-math / aioseo / seopress / slim seo
// whose string appears in the home page HTML of a WordPress site.

const COUNTRY_ROWS = [["フランス", "France", "405", "90.1%", "81.2%", "13.1%"], ["インド", "India", "1,554", "84.4%", "76.3%", "14.5%"], ["シンガポール", "Singapore", "641", "80.8%", "73.3%", "15.0%"], ["フィリピン", "Philippines", "241", "80.1%", "73.9%", "12.0%"], ["ブラジル", "Brazil", "261", "74.7%", "68.2%", "13.4%"], ["南アフリカ", "South Africa", "389", "74.6%", "66.8%", "9.5%"], ["オランダ", "Netherlands", "127", "74.0%", "58.3%", "3.9%"], ["オーストラリア", "Australia", "1,719", "71.3%", "62.2%", "10.3%"], ["ニュージーランド", "New Zealand", "417", "70.3%", "63.5%", "7.4%"], ["台湾", "Taiwan", "60", "70.0%", "65.0%", "16.7%"], ["日本", "Japan", "2,486", "69.4%", "58.9%", "3.9%"], ["アメリカ", "United States", "4,472", "69.0%", "59.4%", "6.2%"], ["スペイン", "Spain", "248", "69.0%", "62.9%", "12.5%"], ["イギリス", "United Kingdom", "942", "68.8%", "59.6%", "8.0%"], ["カナダ", "Canada", "908", "68.1%", "60.7%", "8.0%"], ["香港", "Hong Kong", "79", "67.1%", "62.0%", "10.1%"], ["アイルランド", "Ireland", "266", "62.8%", "54.5%", "6.8%"], ["韓国", "South Korea", "36", "61.1%", "52.8%", "8.3%"], ["コロンビア", "Colombia", "81", "60.5%", "56.8%", "16.0%"], ["アルゼンチン", "Argentina", "76", "57.9%", "53.9%", "7.9%"], ["ポルトガル", "Portugal", "46", "56.5%", "56.5%", "15.2%"], ["メキシコ", "Mexico", "116", "55.2%", "51.7%", "10.3%"], ["マレーシア", "Malaysia", "80", "51.2%", "47.5%", "13.8%"], ["イタリア", "Italy", "110", "49.1%", "44.5%", "2.7%"], ["チリ", "Chile", "50", "40.0%", "38.0%", "14.0%"]];
const TYPE_ROWS = [["WebSite", "63.0%", "68.0%"], ["Organization", "54.4%", "59.7%"], ["BreadcrumbList", "43.4%", "42.9%"], ["WebPage", "34.4%", "60.8%"], ["ImageObject", "38.3%", "57.4%"], ["PostalAddress", "16.4%", "28.0%"], ["Person", "10.2%", "18.0%"], ["ContactPoint", "6.5%", "15.6%"], ["LocalBusiness", "5.4%", "12.3%"], ["ProfessionalService", "5.6%", "11.9%"], ["OpeningHoursSpecification", "4.8%", "9.6%"], ["FAQPage", "3.9%", "9.4%"], ["Article", "2.5%", "9.6%"], ["Service", "3.5%", "7.9%"], ["AggregateRating", "0.2%", "6.2%"], ["Product", "0.1%", "1.5%"]];

const MAIN_JA = {
  head: ["項目", "日本（2,486件）", "海外（13,352件）"],
  rows: [
    ["構造化データ（JSON-LD）がある", "1,726 / 2,486（69.4%）", "9,615 / 13,352（72.0%）"],
    ["Organization系の型がある", "1,464 / 2,486（58.9%）", "8,489 / 13,352（63.6%）"],
    ["住所（PostalAddress）がある", "407 / 2,486（16.4%）", "3,734 / 13,352（28.0%）"],
    ["LocalBusiness がある", "135 / 2,486（5.4%）", "1,647 / 13,352（12.3%）"],
    ["FAQPage がある", "96 / 2,486（3.9%）", "1,249 / 13,352（9.4%）"],
    ["microdata（schema.org）がある", "193 / 2,486（7.8%）", "2,618 / 13,352（19.6%）"],
    ["JSON-LD も microdata もない", "714 / 2,486（28.7%）", "3,535 / 13,352（26.5%）"],
    ["壊れたJSON-LDを含む（JSON-LDがあるサイト中）", "29 / 1,726（1.7%）", "177 / 9,615（1.8%）"],
  ],
  caption: "トップページに到達できたWeb制作会社の自社サイト。2026年11月12日集計。",
};
const MAIN_EN = {
  head: ["Item", "Japan (2,486 sites)", "Outside Japan (13,352 sites)"],
  rows: [
    ["Has structured data (JSON-LD)", "1,726 / 2,486 (69.4%)", "9,615 / 13,352 (72.0%)"],
    ["Has an Organization-type node", "1,464 / 2,486 (58.9%)", "8,489 / 13,352 (63.6%)"],
    ["Has an address (PostalAddress)", "407 / 2,486 (16.4%)", "3,734 / 13,352 (28.0%)"],
    ["Has LocalBusiness", "135 / 2,486 (5.4%)", "1,647 / 13,352 (12.3%)"],
    ["Has FAQPage", "96 / 2,486 (3.9%)", "1,249 / 13,352 (9.4%)"],
    ["Has schema.org microdata", "193 / 2,486 (7.8%)", "2,618 / 13,352 (19.6%)"],
    ["Has neither JSON-LD nor microdata", "714 / 2,486 (28.7%)", "3,535 / 13,352 (26.5%)"],
    ["Includes broken JSON-LD (of sites with JSON-LD)", "29 / 1,726 (1.7%)", "177 / 9,615 (1.8%)"],
  ],
  caption: "Web design agencies' own websites whose home page could be reached. Aggregated 2026-11-12.",
};

const WP_JA = {
  head: ["区分", "件数", "JSON-LD", "Organization系", "FAQPage", "どちらもなし", "壊れ率"],
  rows: [
    ["日本・WordPress", "2,295", "72.9%", "61.8%", "3.9%", "25.2%", "1.7%"],
    ["日本・WordPress以外", "191", "28.3%", "23.6%", "3.1%", "71.2%", "1.9%"],
    ["海外・WordPress", "10,081", "92.5%", "81.5%", "11.4%", "5.6%", "1.9%"],
    ["海外・WordPress以外", "3,271", "9.0%", "8.4%", "2.9%", "90.7%", "1.4%"],
  ],
  caption: "「どちらもなし」は JSON-LD も microdata もないサイト。壊れ率の分母は各区分で JSON-LD があるサイト（日本・WordPress以外は54件）。",
};
const WP_EN = {
  head: ["Group", "Sites", "JSON-LD", "Organization-type", "FAQPage", "Neither", "Broken"],
  rows: [
    ["Japan, WordPress", "2,295", "72.9%", "61.8%", "3.9%", "25.2%", "1.7%"],
    ["Japan, not WordPress", "191", "28.3%", "23.6%", "3.1%", "71.2%", "1.9%"],
    ["Outside Japan, WordPress", "10,081", "92.5%", "81.5%", "11.4%", "5.6%", "1.9%"],
    ["Outside Japan, not WordPress", "3,271", "9.0%", "8.4%", "2.9%", "90.7%", "1.4%"],
  ],
  caption: "Neither = no JSON-LD and no microdata. The broken rate uses the sites in each group that have JSON-LD (54 for Japan, not WordPress).",
};

const PLUGIN_JA = {
  head: ["WordPressのSEOプラグイン", "件数", "JSON-LD", "Organization系", "FAQPage", "壊れ率"],
  rows: [
    ["日本・All in One SEO", "807", "95.0%", "93.1%", "3.3%", "1.2%"],
    ["日本・Yoast SEO", "331", "99.1%", "71.6%", "4.2%", "1.8%"],
    ["日本・Rank Math", "40", "92.5%", "92.5%", "12.5%", "2.7%"],
    ["日本・検出なし", "1,115", "48.3%", "35.2%", "3.9%", "2.2%"],
    ["海外・Yoast SEO", "5,356", "99.0%", "80.1%", "9.0%", "1.8%"],
    ["海外・Rank Math", "2,237", "99.4%", "99.1%", "17.5%", "1.3%"],
    ["海外・All in One SEO", "614", "98.0%", "97.2%", "8.1%", "1.0%"],
    ["海外・SEOPress", "76", "100.0%", "89.5%", "17.1%", "3.9%"],
    ["海外・検出なし", "1,798", "62.0%", "58.0%", "12.1%", "3.3%"],
  ],
  caption: "WordPressのサイトのみ。プラグインはトップページのHTMLに残る名前で判定（30件未満の区分は省略）。壊れ率の分母は JSON-LD があるサイト。",
};
const PLUGIN_EN = {
  head: ["WordPress SEO plugin", "Sites", "JSON-LD", "Organization-type", "FAQPage", "Broken"],
  rows: [
    ["Japan, All in One SEO", "807", "95.0%", "93.1%", "3.3%", "1.2%"],
    ["Japan, Yoast SEO", "331", "99.1%", "71.6%", "4.2%", "1.8%"],
    ["Japan, Rank Math", "40", "92.5%", "92.5%", "12.5%", "2.7%"],
    ["Japan, none detected", "1,115", "48.3%", "35.2%", "3.9%", "2.2%"],
    ["Outside Japan, Yoast SEO", "5,356", "99.0%", "80.1%", "9.0%", "1.8%"],
    ["Outside Japan, Rank Math", "2,237", "99.4%", "99.1%", "17.5%", "1.3%"],
    ["Outside Japan, All in One SEO", "614", "98.0%", "97.2%", "8.1%", "1.0%"],
    ["Outside Japan, SEOPress", "76", "100.0%", "89.5%", "17.1%", "3.9%"],
    ["Outside Japan, none detected", "1,798", "62.0%", "58.0%", "12.1%", "3.3%"],
  ],
  caption: "WordPress sites only. The plugin is identified from its name in the home page HTML (groups under 30 sites omitted). The broken rate uses sites with JSON-LD.",
};

export default {
  slug: "research-structured-data-2026",
  targetQueries: [
    "構造化データ 導入率 調査",
    "JSON-LD 導入率 日本",
    "FAQPage 構造化データ 割合",
    "構造化データ エラー 割合",
    "structured data adoption survey 2026",
    "JSON-LD adoption by country",
    "schema markup usage statistics web agencies",
  ],
  related: ["research-japan-web-agencies-ai-search-2026", "local-business-schema-seo-plugins", "aeo-wordpress", "llms-txt"],
  locales: {
    ja: {
      title: "構造化データの導入率・壊れ率調査【制作会社15,838件】 | Nurevo",
      description: "Web制作会社の自社サイト15,838件のトップページを調査。JSON-LDは日本69.4%・海外72.0%、FAQPageは3.9%・9.4%、壊れたJSON-LDは1.7%。型・SEOプラグイン・国別の表つき。",
      h1: "構造化データの導入率・種類・壊れ率：Web制作会社サイト15,838件を調査（2026年11月）",
      lead: "日本と海外のWeb制作会社の自社サイト15,838件のトップページを調べたところ、構造化データ（JSON-LD）があったのは日本69.4%（2,486件中1,726件）、海外72.0%でした。FAQPage は日本3.9%・海外9.4%、LocalBusiness は5.4%・12.3%と、日本は会社の事実を細かく書く型が少なめです。JSON-LD があるサイトのうち、読み取れない（壊れた）JSON-LD を含むのは日本1.7%・海外1.8%でした。",
      intro: [
        "公開：2026年11月13日。データ：2026年11月12日集計。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策（AEO）のツールを提供しており、この分野に利害があります。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "トップページに構造化データ（JSON-LD）がある制作会社サイトは、日本69.4%（1,726 / 2,486）、海外72.0%（9,615 / 13,352）。差は小さい一方、FAQPage は日本3.9%・海外9.4%、LocalBusiness は5.4%・12.3%、住所（PostalAddress）は16.4%・28.0%でした。",
            "JSON-LD があるサイトのうち、壊れた（JSON として読めない）JSON-LD を含むのは日本1.7%（29件）、海外1.8%（177件）。JSON-LD がすべて壊れていたのは日本9件・海外10件でした。",
            "日本の WordPress サイトでは、SEOプラグインが検出されたサイトの92.5〜99.1%に JSON-LD がある一方、プラグインが検出されなかった1,115件では48.3%でした。WordPress 以外のサイトは日本28.3%・海外9.0%です。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "対象：Web制作会社の自社サイト。日本3,352件（制作会社であることを確認できたもの）と、海外20,335件、計23,687件。一般企業のサイト全体ではありません。",
            "到達：トップページを取得できたのは15,838件（日本2,486件、海外13,352件）。結果はこの15,838件についての数字です。",
            "取得したもの：各サイトのトップページ（あわせて /robots.txt、/llms.txt、/llms-full.txt）を1回ずつ（User-Agent：NurevoSurvey/1.0）。2026年11月上旬〜12日に取得し、11月12日に集計しました。",
            "判定方法：トップページの <script type=\"application/ld+json\"> をすべて JSON として解析し、@type を入れ子も含めて数えました。1つでも解析できないブロックがあれば「壊れたJSON-LDを含む」としています。Organization系は @type に Organization・LocalBusiness・Corporation・ProfessionalService を含むもの。microdata は itemtype に schema.org の URL があるもの。WordPress とSEOプラグインは、トップページのHTMLに残る文字列（wp-content、yoast、rank-math、aioseo など）で判定しました。",
            "国は当社の収集リストでの所在国です。30件未満の区分は載せていません。",
          ],
        },
        {
          heading: "結果：日本と海外",
          paragraphs: ["JSON-LD の有無では日本と海外の差は2.6ポイントです。差が大きいのは中身で、住所・LocalBusiness・FAQPage・microdata はいずれも海外の方が1.7〜2.5倍多く見られました。"],
          table: MAIN_JA,
        },
        {
          heading: "よく使われている型",
          paragraphs: [
            "日本も海外も WebSite・Organization・BreadcrumbList が上位です。WebPage・ImageObject は海外で多く、これは SEOプラグインが自動で出力する「グラフ」形式の構造化データの違いが表れているとみられます。会社の連絡先にあたる ContactPoint は日本6.5%・海外15.6%、口コミの評価（AggregateRating）は0.2%・6.2%でした。",
          ],
          table: {
            head: ["@type", "日本", "海外"],
            rows: TYPE_ROWS,
            caption: "トップページのJSON-LDに含まれる @type（入れ子を含む）があるサイトの割合。分母は日本2,486件・海外13,352件。",
          },
        },
        {
          heading: "壊れたJSON-LD",
          paragraphs: [
            "JSON-LD のブロック単位では、日本2,352個中34個（1.4%）、海外15,609個中193個（1.2%）が JSON として解析できませんでした。サイト単位では日本1.7%・海外1.8%で、JSON-LD がすべて壊れていて構造化データとして何も読めないサイトは日本9件（JSON-LDがあるサイトの0.5%）、海外10件（0.1%）でした。壊れたJSON-LDを含むサイトの多く（日本29件中20件、海外177件中167件）は、ほかに正しく読めるブロックも持っていました。",
          ],
        },
        {
          heading: "WordPress とそれ以外",
          paragraphs: [
            "WordPress のサイトは JSON-LD がある割合が高く、海外では92.5%でした。WordPress 以外のサイトでは、日本28.3%・海外9.0%にとどまります。",
          ],
          table: WP_JA,
        },
        {
          heading: "SEOプラグイン別",
          paragraphs: [
            "WordPress のサイトで、SEOプラグインが検出されたサイトはどのプラグインでも9割以上に JSON-LD がありました。日本では All in One SEO が807件と最も多く、Organization系の型がある割合は93.1%です。プラグインが検出されなかった日本の WordPress サイト（1,115件）では JSON-LD は48.3%でした。FAQPage は、海外の Rank Math（17.5%）・SEOPress（17.1%）で多く見られました。",
          ],
          table: PLUGIN_JA,
        },
        {
          heading: "国・地域別",
          paragraphs: [
            "到達30件以上の25の国・地域を JSON-LD がある割合の順に並べました。日本は11番目（69.4%）で、FAQPage（3.9%）はオランダと並び、イタリア（2.7%）に次いで低い値でした。",
          ],
          table: {
            head: ["国・地域", "件数", "JSON-LD", "Organization系", "FAQPage"],
            rows: COUNTRY_ROWS.map(([ja, , n, a, b, c]) => [ja, n, a, b, c]),
            caption: "到達できたWeb制作会社の自社サイト。30件未満の国・地域は省略。",
          },
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "この調査の数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。そのまま使える1文：",
          ],
          list: [
            "国内Web制作会社の自社サイトの69.4%（2,486件中1,726件）がトップページに構造化データ（JSON-LD）を入れていた（Nurevo AEO 調査、2026年11月）。",
            "FAQPage の構造化データがある制作会社サイトは、日本3.9%・海外9.4%だった（Nurevo AEO 調査、2026年11月）。",
            "JSON-LD を入れている制作会社サイトの1.7%（日本）・1.8%（海外）が、JSON として読めない壊れた構造化データを含んでいた（Nurevo AEO 調査、2026年11月）。",
            "SEOプラグインが検出されない国内の WordPress 制作会社サイトでは、JSON-LD がある割合は48.3%だった（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "この調査の限界",
          list: [
            "トップページだけを見ています。下層ページ（会社概要、よくある質問など）に構造化データがあっても数えていません。",
            "JavaScript で後から入れる構造化データは、取得したHTMLに含まれないため数えていません。1サイトにつき記録した @type は最大40種類です。",
            "「壊れた」は JSON として解析できないものだけです。必須項目の不足や、schema.org の仕様・Google のリッチリザルトの要件に合っているかは検証していません。",
            "SEOプラグインはHTMLに残る名前で判定しており、名前を出さない設定や、別のプラグイン・テーマが出力する構造化データは区別できません。",
            "対象はWeb制作会社の自社サイトで、一般企業や店舗のサイト全体の傾向ではありません。制作会社のリストは当社が集めたもので、すべてを網羅していません。各サイト1回の取得で、到達できなかったサイトは含みません。",
          ],
        },
        {
          heading: "Nurevo の見方（意見）",
          paragraphs: [
            "ここからは事実ではなく当社の意見です。JSON-LD の有無だけを見ると日本と海外の差は小さく、多くは SEOプラグインが自動で出力しているものとみられます。差が出ているのは、住所・営業時間・よくある質問のように、会社ごとに中身を入れる必要がある型でした。構造化データがあっても AI の回答に必ず登場するわけではありませんが（当社の[別の調査](/guide/aeo-signals-ai-answers-study)では、サイト側の対策と登場率の関係は見られませんでした）、会社の事実を機械が正しく読めるようにする基本として、自社とお客様のサイトで一度確認しておく価値はあると考えています。",
          ],
        },
        {
          heading: "自社サイト・お客様のサイトを確認するには",
          paragraphs: [
            "[無料チェック](https://nurevo.jp/check)で、構造化データ・llms.txt・AIクローラーの許可状況を1分で確認できます。WordPress なら [Nurevo WebMCP プラグイン](https://wordpress.org/plugins/nurevo-webmcp/)で、SEOプラグインの出力と重複させずに会社情報の構造化データと llms.txt を出せます。お客様のサイトにまとめて導入したい制作会社の方は[パートナープログラム](https://nurevo.jp/partner/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "Web制作会社のサイトで構造化データはどのくらい使われていますか？", a: "この調査では、トップページに JSON-LD があったのは日本の制作会社サイトの69.4%（2,486件中1,726件）、海外の72.0%（13,352件中9,615件）でした（2026年11月）。" },
        { q: "FAQPage の構造化データはどのくらい普及していますか？", a: "日本の制作会社サイトの3.9%（96件）、海外の9.4%（1,249件）でした。トップページだけの数字です。" },
        { q: "構造化データが壊れているサイトはどのくらいありますか？", a: "JSON-LD があるサイトのうち、JSON として読めないブロックを含むのは日本1.7%・海外1.8%でした。仕様に合っているかまでは検証していません。" },
        { q: "数字を記事で使ってもいいですか？", a: "はい。出典「Nurevo AEO 調査（nurevo.jp）」とこのページへのリンクを明記すれば、自由に引用・転載できます。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "あなたのサイトの構造化データを確認",
        body: "無料チェックで、構造化データ・llms.txt・AIクローラーの許可状況が分かります。AIの回答に出ることを保証するものではありません。",
        label: "無料でチェックする",
        href: "/check",
        secondary: { label: "制作会社向けパートナー", href: "/partner/" },
      },
      footnote: "調査：Nurevo AEO（Bestie.合同会社）。記載の社名・サービス名は各社の商標です。個別の会社名・ドメインは公開しません。",
    },
    en: {
      title: "Structured Data Adoption: 15,838 Agency Sites (2026) | Nurevo",
      description: "15,838 web agency home pages: JSON-LD on 69.4% (Japan) and 72.0% (elsewhere), FAQPage on 3.9% and 9.4%. By type, plugin and country.",
      h1: "Structured data adoption, types and errors: 15,838 web design agency websites (November 2026)",
      lead: "We examined the home pages of 15,838 websites of web design agencies in Japan and elsewhere. 69.4% of Japanese agency sites (1,726 of 2,486) and 72.0% of agency sites outside Japan had structured data (JSON-LD). FAQPage appeared on 3.9% and 9.4%, LocalBusiness on 5.4% and 12.3%. Among sites with JSON-LD, 1.7% (Japan) and 1.8% (elsewhere) included JSON-LD that cannot be parsed.",
      intro: [
        "Published 2026-11-13. Data aggregated 2026-11-12. Research by Nurevo AEO (Bestie.合同会社). Nurevo sells AI search optimization (AEO) tools and so has an interest in this topic.",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "JSON-LD structured data is on the home page of 69.4% of Japanese agency websites (1,726 / 2,486) and 72.0% of those outside Japan (9,615 / 13,352). The gap is small, but FAQPage is on 3.9% vs 9.4%, LocalBusiness on 5.4% vs 12.3%, and PostalAddress on 16.4% vs 28.0%.",
            "Of sites with JSON-LD, 1.7% in Japan (29) and 1.8% elsewhere (177) include a block that is not valid JSON. On 9 Japanese and 10 non-Japanese sites, every JSON-LD block was broken.",
            "Among Japanese WordPress sites, 92.5% to 99.1% of those with a detected SEO plugin have JSON-LD, against 48.3% of the 1,115 where no plugin was detected. Sites not built on WordPress: 28.3% in Japan, 9.0% elsewhere.",
          ],
        },
        {
          heading: "About the survey",
          list: [
            "Population: the company websites of web design agencies: 3,352 in Japan (confirmed as agencies) and 20,335 elsewhere, 23,687 in total. This is not a sample of all business websites.",
            "Reached: the home page could be fetched for 15,838 (2,486 in Japan, 13,352 elsewhere). All results refer to these sites.",
            "Fetched: each site's home page (plus /robots.txt, /llms.txt and /llms-full.txt), once each (User-Agent: NurevoSurvey/1.0), between early November and 2026-11-12, aggregated on 2026-11-12.",
            "How things were judged: every <script type=\"application/ld+json\"> on the home page was parsed as JSON and its @type values counted, nested ones included. A site counts as having broken JSON-LD if any block fails to parse. Organization-type means an @type containing Organization, LocalBusiness, Corporation or ProfessionalService. Microdata means an itemtype with a schema.org URL. WordPress and SEO plugins were identified from strings in the home page HTML (wp-content, yoast, rank-math, aioseo and so on).",
            "Country is the agency's country in our collection list. Groups under 30 sites are not shown.",
          ],
        },
        {
          heading: "Results: Japan and elsewhere",
          paragraphs: ["Whether a site has JSON-LD at all differs by only 2.6 points. The difference is in what it contains: address, LocalBusiness, FAQPage and microdata are each 1.7 to 2.5 times as common outside Japan."],
          table: MAIN_EN,
        },
        {
          heading: "Most common types",
          paragraphs: [
            "In both groups WebSite, Organization and BreadcrumbList lead. WebPage and ImageObject are more common outside Japan, which likely reflects the \"graph\" output that SEO plugins generate automatically. ContactPoint appears on 6.5% in Japan vs 15.6% elsewhere, and AggregateRating on 0.2% vs 6.2%.",
          ],
          table: {
            head: ["@type", "Japan", "Outside Japan"],
            rows: TYPE_ROWS,
            caption: "Share of sites whose home page JSON-LD includes the @type (nested included). Base: 2,486 sites in Japan, 13,352 elsewhere.",
          },
        },
        {
          heading: "Broken JSON-LD",
          paragraphs: [
            "Counted per block, 34 of 2,352 JSON-LD blocks in Japan (1.4%) and 193 of 15,609 elsewhere (1.2%) could not be parsed as JSON. Per site, the rates are 1.7% and 1.8%. Sites where every JSON-LD block was broken, so that no structured data could be read at all, numbered 9 in Japan (0.5% of sites with JSON-LD) and 10 elsewhere (0.1%). Most sites with a broken block (20 of 29 in Japan, 167 of 177 elsewhere) also had at least one block that parsed correctly.",
          ],
        },
        {
          heading: "WordPress and other platforms",
          paragraphs: [
            "WordPress sites are much more likely to have JSON-LD: 92.5% outside Japan. Among sites not on WordPress, the share is 28.3% in Japan and 9.0% elsewhere.",
          ],
          table: WP_EN,
        },
        {
          heading: "By SEO plugin",
          paragraphs: [
            "On WordPress, more than 90% of sites with any detected SEO plugin have JSON-LD. In Japan, All in One SEO is the most common (807 sites), and 93.1% of those have an Organization-type node. Japanese WordPress sites with no plugin detected (1,115) have JSON-LD 48.3% of the time. FAQPage is most common with Rank Math (17.5%) and SEOPress (17.1%) outside Japan.",
          ],
          table: PLUGIN_EN,
        },
        {
          heading: "By country or region",
          paragraphs: [
            "The 25 countries and regions with at least 30 reachable sites, ordered by JSON-LD share. Japan ranks 11th (69.4%). Its FAQPage share (3.9%) is tied with the Netherlands and above only Italy (2.7%).",
          ],
          table: {
            head: ["Country or region", "Sites", "JSON-LD", "Organization-type", "FAQPage"],
            rows: COUNTRY_ROWS.map(([, en, n, a, b, c]) => [en, n, a, b, c]),
            caption: "Web design agencies' own websites that could be reached. Countries and regions under 30 sites omitted.",
          },
        },
        {
          heading: "Citing this survey",
          paragraphs: [
            "You may quote and republish the figures and tables freely, as long as you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. Sentences ready to quote:",
          ],
          list: [
            "69.4% of Japanese web design agency websites (1,726 of 2,486) had JSON-LD structured data on the home page, against 72.0% of agency sites elsewhere (Nurevo AEO survey, November 2026).",
            "FAQPage structured data appeared on 3.9% of Japanese and 9.4% of non-Japanese web agency websites (Nurevo AEO survey, November 2026).",
            "1.7% (Japan) and 1.8% (elsewhere) of web agency websites with JSON-LD included structured data that is not valid JSON (Nurevo AEO survey, November 2026).",
            "In France, 90.1% of web design agency websites had JSON-LD on the home page, the highest of 25 countries and regions surveyed (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Limitations",
          list: [
            "Only the home page was examined. Structured data on inner pages (about, FAQ and so on) is not counted.",
            "Structured data injected by JavaScript after load is not in the fetched HTML and is not counted. Up to 40 @type values were recorded per site.",
            "\"Broken\" means only that the block is not valid JSON. We did not check required properties, conformance with schema.org, or Google's rich result requirements.",
            "SEO plugins were identified by their names in the HTML. Plugins configured not to show their name, and structured data from other plugins or themes, cannot be told apart.",
            "The population is web design agencies' own websites, not businesses in general. The agency list is our own and not exhaustive. One fetch per site; unreachable sites are excluded.",
          ],
        },
        {
          heading: "Our reading (opinion)",
          paragraphs: [
            "What follows is our opinion, not a finding. Whether a site has JSON-LD at all differs little between Japan and elsewhere, and much of it appears to be generated automatically by SEO plugins. The gap is in types that need company-specific content, such as address, opening hours and FAQs. Structured data does not guarantee appearing in AI answers (in [another of our studies](/guide/aeo-signals-ai-answers-study), on-site signals showed no relationship with appearance), but we think it is worth checking on your own and your clients' sites as a basis for machines reading a company's facts correctly.",
          ],
        },
        {
          heading: "Check your own or your clients' sites",
          paragraphs: [
            "The [free check](https://nurevo.jp/check) shows structured data, llms.txt and AI crawler access in about a minute. On WordPress, the [Nurevo WebMCP plugin](https://wordpress.org/plugins/nurevo-webmcp/) adds company structured data and an llms.txt without duplicating your SEO plugin's output. Agencies that want to roll it out across client sites can see the [partner program](https://nurevo.jp/partner/).",
          ],
        },
      ],
      faqs: [
        { q: "How common is structured data on web agency websites?", a: "In this survey, 69.4% of Japanese web design agency websites (1,726 of 2,486) and 72.0% of agency websites elsewhere (9,615 of 13,352) had JSON-LD on the home page (November 2026)." },
        { q: "How common is FAQPage structured data?", a: "It was on 3.9% of Japanese agency sites (96) and 9.4% of those elsewhere (1,249), counting home pages only." },
        { q: "How many sites have broken structured data?", a: "Of sites with JSON-LD, 1.7% in Japan and 1.8% elsewhere included a block that is not valid JSON. We did not check conformance with the schema.org specification." },
        { q: "Can I use these figures in an article?", a: "Yes. Credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page, and you may quote and republish them freely." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Check your site's structured data",
        body: "The free check shows your structured data, llms.txt and AI crawler access. It does not guarantee appearing in AI answers.",
        label: "Run the free check",
        href: "/check",
        secondary: { label: "Partner program for agencies", href: "/partner/" },
      },
      footnote: "Research by Nurevo AEO (Bestie.合同会社). Product and company names are trademarks of their owners. Individual companies and domains are not published.",
    },
  },
};
