// Content page: research report. llms.txt adoption on web design agencies' own
// websites, Japan and 24 other countries, November 2026.
//
// Every number here comes from nurevo-outreach data/survey/raw_2026-11-12.json
// (survey.js; summary_2026-11-12.json holds the same totals). Do not add a
// figure that is not in that data. The raw file holds company names and
// domains: never publish them, nor any group under 30 reachable sites.
// Definitions follow survey.js: llms.txt "present" = /llms.txt returns 200,
// non-HTML, more than 20 characters of text; lines = split on "\n"; SEO plugin
// = first of yoast / rank-math / aioseo / seopress found in the home page HTML
// (WordPress sites only); country = the country of the list the site came from.

const C = {
  SG: ["シンガポール", "Singapore"], IN: ["インド", "India"], BR: ["ブラジル", "Brazil"], ES: ["スペイン", "Spain"],
  PH: ["フィリピン", "Philippines"], CO: ["コロンビア", "Colombia"], TW: ["台湾", "Taiwan"], ZA: ["南アフリカ", "South Africa"],
  AR: ["アルゼンチン", "Argentina"], FR: ["フランス", "France"], PT: ["ポルトガル", "Portugal"], NZ: ["ニュージーランド", "New Zealand"],
  KR: ["韓国", "South Korea"], AU: ["オーストラリア", "Australia"], MY: ["マレーシア", "Malaysia"], NL: ["オランダ", "Netherlands"],
  US: ["アメリカ", "United States"], CA: ["カナダ", "Canada"], GB: ["イギリス", "United Kingdom"], HK: ["香港", "Hong Kong"],
  MX: ["メキシコ", "Mexico"], IT: ["イタリア", "Italy"], IE: ["アイルランド", "Ireland"], CL: ["チリ", "Chile"], JP: ["日本", "Japan"],
};
const COUNTRY = [
  ["SG", "641", "249", "38.8%"],
  ["IN", "1,554", "569", "36.6%"],
  ["BR", "261", "89", "34.1%"],
  ["ES", "248", "79", "31.9%"],
  ["PH", "241", "76", "31.5%"],
  ["CO", "81", "25", "30.9%"],
  ["TW", "60", "18", "30.0%"],
  ["ZA", "389", "114", "29.3%"],
  ["AR", "76", "22", "28.9%"],
  ["FR", "405", "107", "26.4%"],
  ["PT", "46", "12", "26.1%"],
  ["NZ", "417", "106", "25.4%"],
  ["KR", "36", "9", "25.0%"],
  ["AU", "1,719", "418", "24.3%"],
  ["MY", "80", "19", "23.8%"],
  ["NL", "127", "30", "23.6%"],
  ["US", "4,472", "1,032", "23.1%"],
  ["CA", "908", "208", "22.9%"],
  ["GB", "942", "203", "21.5%"],
  ["HK", "79", "17", "21.5%"],
  ["MX", "116", "24", "20.7%"],
  ["IT", "110", "22", "20.0%"],
  ["IE", "266", "52", "19.5%"],
  ["CL", "50", "8", "16.0%"],
  ["JP", "2,486", "333", "13.4%"],
];
const countryRows = (i) => COUNTRY.map(([k, n, l, s]) => [C[k][i], n, l, s]);

const MAIN_JA = {
  head: ["区分", "llms.txt あり", "割合", "llms-full.txt あり"],
  rows: [
    ["日本：全体", "333 / 2,486", "13.4%", "14（0.6%）"],
    ["日本：WordPress", "321 / 2,295", "14.0%", "—"],
    ["日本：WordPress 以外", "12 / 191", "6.3%", "—"],
    ["海外：全体", "3,522 / 13,352", "26.4%", "240（1.8%）"],
    ["海外：WordPress", "3,338 / 10,081", "33.1%", "—"],
    ["海外：WordPress 以外", "184 / 3,271", "5.6%", "—"],
  ],
  caption: "分母：トップページに到達できたWeb制作会社の自社サイト。2026年11月12日集計。",
};
const MAIN_EN = {
  head: ["Group", "Has llms.txt", "Share", "Has llms-full.txt"],
  rows: [
    ["Japan: all", "333 / 2,486", "13.4%", "14 (0.6%)"],
    ["Japan: WordPress", "321 / 2,295", "14.0%", "—"],
    ["Japan: not WordPress", "12 / 191", "6.3%", "—"],
    ["Outside Japan: all", "3,522 / 13,352", "26.4%", "240 (1.8%)"],
    ["Outside Japan: WordPress", "3,338 / 10,081", "33.1%", "—"],
    ["Outside Japan: not WordPress", "184 / 3,271", "5.6%", "—"],
  ],
  caption: "Base: web design agencies' own websites whose home page could be reached. Aggregated 2026-11-12.",
};

const PLUGIN_JA = {
  head: ["SEOプラグイン", "日本：llms.txt あり", "日本：割合", "海外：llms.txt あり", "海外：割合"],
  rows: [
    ["Yoast SEO", "68 / 331", "20.5%", "1,650 / 5,356", "30.8%"],
    ["Rank Math", "9 / 40", "22.5%", "913 / 2,237", "40.8%"],
    ["All in One SEO（AIOSEO）", "156 / 807", "19.3%", "314 / 614", "51.1%"],
    ["SEOPress", "—（30件未満）", "—", "25 / 76", "32.9%"],
    ["検出なし", "86 / 1,115", "7.7%", "436 / 1,798", "24.2%"],
  ],
  caption: "WordPress のサイトのみ。プラグインはトップページのHTMLに残る名前で判定（複数ある場合は Yoast → Rank Math → AIOSEO → SEOPress の順で1つ）。",
};
const PLUGIN_EN = {
  head: ["SEO plugin", "Japan: has llms.txt", "Japan: share", "Outside Japan: has llms.txt", "Outside Japan: share"],
  rows: [
    ["Yoast SEO", "68 / 331", "20.5%", "1,650 / 5,356", "30.8%"],
    ["Rank Math", "9 / 40", "22.5%", "913 / 2,237", "40.8%"],
    ["All in One SEO (AIOSEO)", "156 / 807", "19.3%", "314 / 614", "51.1%"],
    ["SEOPress", "— (under 30 sites)", "—", "25 / 76", "32.9%"],
    ["None detected", "86 / 1,115", "7.7%", "436 / 1,798", "24.2%"],
  ],
  caption: "WordPress sites only. The plugin is identified by its name in the home page HTML (if several, the first of Yoast → Rank Math → AIOSEO → SEOPress).",
};

const WITH_JA = {
  head: ["サイトの状態（日本）", "llms.txt あり", "割合"],
  rows: [
    ["トップページに JSON-LD がある", "317 / 1,726", "18.4%"],
    ["トップページに JSON-LD がない", "16 / 760", "2.1%"],
    ["Organization 系の構造化データがある", "291 / 1,464", "19.9%"],
    ["Organization 系の構造化データがない", "42 / 1,022", "4.1%"],
    ["FAQPage の構造化データがある", "41 / 96", "42.7%"],
    ["robots.txt がある", "329 / 2,281", "14.4%"],
    ["robots.txt がない", "4 / 205", "2.0%"],
  ],
  caption: "分母：日本のWeb制作会社の自社サイト2,486件の内訳。同時に見られるという事実で、どちらが原因かは示しません。",
};
const WITH_EN = {
  head: ["Site state (Japan)", "Has llms.txt", "Share"],
  rows: [
    ["Home page has JSON-LD", "317 / 1,726", "18.4%"],
    ["Home page has no JSON-LD", "16 / 760", "2.1%"],
    ["Has Organization-type structured data", "291 / 1,464", "19.9%"],
    ["No Organization-type structured data", "42 / 1,022", "4.1%"],
    ["Has FAQPage structured data", "41 / 96", "42.7%"],
    ["Has a robots.txt", "329 / 2,281", "14.4%"],
    ["No robots.txt", "4 / 205", "2.0%"],
  ],
  caption: "Breakdown of the 2,486 Japanese agency websites. This shows co-occurrence only, not which causes which.",
};

const LINES_JA = {
  head: ["llms.txt の行数", "件数（日本）"],
  rows: [["10行以下", "0"], ["11〜30行", "35"], ["31〜100行", "137"], ["101〜300行", "89"], ["301行以上", "72"]],
  caption: "分母：llms.txt がある日本の333件。中央値93行（海外の3,522件では中央値65行）。",
};
const LINES_EN = {
  head: ["llms.txt length", "Sites (Japan)"],
  rows: [["10 lines or fewer", "0"], ["11–30 lines", "35"], ["31–100 lines", "137"], ["101–300 lines", "89"], ["301 lines or more", "72"]],
  caption: "Base: the 333 Japanese sites with an llms.txt. Median 93 lines (65 lines across the 3,522 sites outside Japan).",
};

export default {
  slug: "research-llms-txt-adoption-2026",
  targetQueries: [
    "llms.txt 導入率",
    "llms.txt 普及率 日本 調査",
    "llms.txt 設置 割合 Web制作会社",
    "llms.txt Yoast AIOSEO Rank Math",
    "llms.txt adoption rate 2026",
    "llms.txt adoption by country survey",
  ],
  related: ["llms-txt", "research-japan-web-agencies-ai-search-2026", "aeo-wordpress", "aeo-signals-ai-answers-study"],
  locales: {
    ja: {
      title: "llms.txt 導入率は日本13.4%・海外26.4%【制作会社15,838サイト調査】 | Nurevo",
      description: "Web制作会社の自社サイト15,838件を調査。llms.txt があったのは日本13.4%、海外26.4%。25か国の比較、WordPress・SEOプラグイン別、行数の分布。方法・数値・限界。",
      h1: "llms.txt の導入率：Web制作会社の自社サイト15,838件を調査（2026年11月）",
      lead: "国内外のWeb制作会社の自社サイト15,838件で /llms.txt を確認したところ、llms.txt を置いていたのは日本で13.4%（2,486件中333件）、海外で26.4%（13,352件中3,522件）でした。30件以上の到達があった25か国・地域の中で、日本の割合は最も低い値でした。",
      intro: [
        "公開：2026年11月12日。データ：2026年11月12日集計。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策（AEO）のツールを提供しており、llms.txt を出す機能も持っているため、この分野に利害があります。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "llms.txt があったWeb制作会社サイトは、日本13.4%（2,486件中333件）、海外26.4%（13,352件中3,522件）。WordPress のサイトに限ると日本14.0%、海外33.1%でした。",
            "30件以上到達できた25か国・地域では、シンガポール38.8%、インド36.6%、ブラジル34.1%が高く、アメリカ23.1%、イギリス21.5%、日本13.4%でした。",
            "日本のWordPressサイトでは、SEOプラグインが検出されたサイトの llms.txt 導入率は19〜23%、検出されなかったサイトは7.7%でした。全文版の llms-full.txt は日本0.6%（14件）、海外1.8%（240件）でした。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "対象：Web制作会社の自社サイト。日本は制作会社であることを確認できた3,352件、海外は当社が集めた制作会社のリスト20,335件（合計23,687件）。一般企業のサイト全体ではありません。",
            "到達：トップページを取得できたのは15,838件（日本2,486件、海外13,352件）。結果はこの到達件数についての数字です。",
            "取得したもの：各サイトのトップページ、/robots.txt、/llms.txt、/llms-full.txt を1回ずつ（User-Agent：NurevoSurvey/1.0）。2026年11月上旬から11月12日にかけて取得し、11月12日に集計しました。",
            "判定方法：/llms.txt がステータス200で、中身がHTMLではなく20文字を超えるテキストのとき「あり」としました（llms-full.txt も同じ）。トップページが別のURLに転送される場合は、転送先のドメイン直下を確認しています。WordPress かどうか、SEOプラグインはトップページのHTMLで判定しました。国は、サイトを集めたリストの国です。",
            "11月10日公開の[総論レポート](/guide/research-japan-web-agencies-ai-search-2026)（11月5日集計、日本2,357件）と同じ調査の続きで、その後に追加した対象を含みます。日本の数字の違い（13.6% → 13.4%）は対象が増えたためで、同じサイトの変化を測ったものではありません。",
          ],
        },
        {
          heading: "結果：日本と海外",
          paragraphs: ["WordPress のサイトでは llms.txt の割合が高く、WordPress 以外では日本・海外とも1割未満でした。日本と海外の差は、主に WordPress のサイトで開いています（14.0% と 33.1%）。"],
          table: MAIN_JA,
        },
        {
          heading: "国・地域別の llms.txt 導入率",
          paragraphs: ["トップページに到達できたサイトが30件以上ある25か国・地域を、導入率の高い順に並べました。件数の少ない国は数字の振れ幅が大きいので、件数とあわせて見てください。"],
          table: {
            head: ["国・地域", "到達件数", "llms.txt あり", "割合"],
            rows: countryRows(0),
            caption: "Web制作会社の自社サイト。国はサイトを集めたリストの国。到達30件未満の国は載せていません。",
          },
        },
        {
          heading: "SEOプラグイン別",
          paragraphs: [
            "WordPress のサイトを、トップページのHTMLから分かるSEOプラグインで分けました。日本ではプラグインが検出されたサイトの導入率が19〜23%、検出されなかったサイトが7.7%でした。海外では AIOSEO 51.1%、Rank Math 40.8%、Yoast SEO 30.8% です。llms.txt がプラグインの機能で作られたものかどうかは、この調査では判定していません。",
          ],
          table: PLUGIN_JA,
        },
        {
          heading: "ほかの項目との関係（日本）",
          paragraphs: [
            "トップページに構造化データ（JSON-LD）があるサイトでは18.4%、ないサイトでは2.1%に llms.txt がありました。FAQPage の構造化データがある96件では42.7%です。AI向けの設定を1つ入れているサイトは、ほかの設定も入れている傾向があります。ただし、これは同時に見られるという事実で、どちらかが原因だという意味ではありません。",
          ],
          table: WITH_JA,
        },
        {
          heading: "llms.txt の長さ",
          paragraphs: [
            "llms.txt がある日本の333件の行数の中央値は93行で、10行以下のものはありませんでした。301行以上のものが72件（21.6%）あります。内容の質や書式が正しいかどうかは評価していません。",
          ],
          table: LINES_JA,
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "この調査の数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。そのまま使える1文：",
          ],
          list: [
            "国内Web制作会社の自社サイト2,486件のうち、llms.txt を設置していたのは13.4%（333件）だった（Nurevo AEO 調査、2026年11月）。",
            "海外のWeb制作会社の自社サイトでは26.4%（13,352件中3,522件）が llms.txt を設置しており、日本の13.4%の約2倍だった（Nurevo AEO 調査、2026年11月）。",
            "到達30件以上の25か国・地域のうち、Web制作会社サイトの llms.txt 導入率が最も高かったのはシンガポール（38.8%）、最も低かったのは日本（13.4%）だった（Nurevo AEO 調査、2026年11月）。",
            "llms-full.txt を設置していたWeb制作会社サイトは、日本で0.6%、海外で1.8%だった（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "この調査の限界",
          list: [
            "トップページと、ドメイン直下の /llms.txt・/llms-full.txt だけを見ています。別の場所に置かれた llms.txt は「なし」と数えます。",
            "llms.txt は「置いてあるか」だけを見ており、内容の質、書式、AIサービスが実際に読んでいるかは評価していません。",
            "対象はWeb制作会社の自社サイトで、一般企業や店舗のサイト全体の傾向ではありません。リストは当社が集めたもので、国ごとに集め方や件数が異なり、各国の制作会社を網羅していません。国どうしの比較は目安です。",
            "各サイト1回の取得による結果で、トップページに到達できなかったサイト（一時的なエラーやボット対策で拒否されたものを含む）は集計に含みません。",
          ],
        },
        {
          heading: "Nurevo の見方（意見）",
          paragraphs: [
            "ここからは事実ではなく当社の意見です。llms.txt は、AIにサイトの要点を伝えるための比較的新しい提案で、主要なAIサービスがどう使っているかはまだはっきりしていません。置いてもAIの回答に必ず登場するわけではありません（当社の[別の調査](/guide/aeo-signals-ai-answers-study)では、サイト側の対策と登場率の関係は見られませんでした）。それでも、制作会社がお客様のサイトで扱う項目として、海外では日本の約2倍の割合で自社サイトに入れている、という事実は参考になると考えています。",
          ],
        },
        {
          heading: "自社サイト・お客様のサイトを確認するには",
          paragraphs: [
            "[無料チェック](https://nurevo.jp/check)で、llms.txt・構造化データ・AIクローラーの許可状況を1分で確認できます。WordPress なら [Nurevo WebMCP プラグイン](https://wordpress.org/plugins/nurevo-webmcp/)で llms.txt と構造化データを出せます。書き方は[llms.txt のガイド](/guide/llms-txt)にまとめています。お客様のサイトにまとめて導入したい制作会社の方は[パートナープログラム](https://nurevo.jp/partner/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "llms.txt はどのくらい普及していますか？", a: "この調査では、Web制作会社の自社サイトのうち日本で13.4%（2,486件中333件）、海外で26.4%（13,352件中3,522件）に llms.txt がありました（2026年11月）。" },
        { q: "日本の llms.txt 導入率は海外と比べて低いですか？", a: "この調査の対象では低い値でした。到達30件以上の25か国・地域のうち、日本の13.4%は最も低く、最も高いシンガポールは38.8%でした。ただし国ごとにリストの集め方や件数が違うため、比較は目安です。" },
        { q: "SEOプラグインを使っているサイトのほうが llms.txt を置いていますか？", a: "日本の WordPress サイトでは、Yoast SEO・Rank Math・AIOSEO が検出されたサイトの導入率は19〜23%、検出されなかったサイトは7.7%でした。プラグインの機能で作られたかどうかは判定していません。" },
        { q: "数字を記事で使ってもいいですか？", a: "はい。出典「Nurevo AEO 調査（nurevo.jp）」とこのページへのリンクを明記すれば、自由に引用・転載できます。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "あなたのサイトの llms.txt を確認",
        body: "無料チェックで、llms.txt・構造化データ・AIクローラーの許可状況が分かります。AIの回答に出ることを保証するものではありません。",
        label: "無料でチェックする",
        href: "/check",
        secondary: { label: "制作会社向けパートナー", href: "/partner/" },
      },
      footnote: "調査：Nurevo AEO（Bestie.合同会社）。記載の社名・サービス名は各社の商標です。個別の会社名・ドメインは公開しません。",
    },
    en: {
      title: "llms.txt Adoption: 13.4% in Japan, 26.4% Abroad (2026 Survey) | Nurevo",
      description: "We checked 15,838 web design agency websites: 13.4% in Japan and 26.4% elsewhere have an llms.txt. 25 countries, WordPress and SEO plugins compared.",
      h1: "llms.txt adoption on 15,838 web design agency websites in 25 countries (November 2026)",
      lead: "We checked /llms.txt on 15,838 websites of web design agencies. 13.4% of agency sites in Japan (333 of 2,486) and 26.4% of those outside Japan (3,522 of 13,352) had an llms.txt. Among the 25 countries and territories with at least 30 reachable sites, Japan had the lowest share.",
      intro: [
        "Published 2026-11-12. Data aggregated 2026-11-12. Research by Nurevo AEO (Bestie.合同会社). Nurevo sells AI search optimization (AEO) tools, including one that publishes an llms.txt, and so has an interest in this topic.",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "26.4% of web design agency websites outside Japan (3,522 of 13,352) and 13.4% in Japan (333 of 2,486) have an llms.txt. On WordPress sites the shares are 33.1% and 14.0%.",
            "Among 25 countries and territories with 30+ reachable sites, Singapore (38.8%), India (36.6%) and Brazil (34.1%) lead; the United States is at 23.1%, the United Kingdom at 21.5% and Japan at 13.4%.",
            "Outside Japan, WordPress agency sites running AIOSEO have an llms.txt in 51.1% of cases, Rank Math 40.8% and Yoast SEO 30.8%, against 24.2% where no SEO plugin is detected. The full-text llms-full.txt is rare: 1.8% outside Japan, 0.6% in Japan.",
          ],
        },
        {
          heading: "About the survey",
          list: [
            "Population: web design agencies' own websites. 3,352 in Japan that we could confirm are agencies, and 20,335 from our lists of agencies elsewhere (23,687 in total). This is not a sample of all business websites.",
            "Reached: the home page could be fetched for 15,838 sites (2,486 in Japan, 13,352 elsewhere). All results refer to these sites.",
            "Fetched: each site's home page, /robots.txt, /llms.txt and /llms-full.txt, once each (User-Agent: NurevoSurvey/1.0), between early November and 2026-11-12, aggregated on 2026-11-12.",
            "How things were judged: an llms.txt counts if /llms.txt returns status 200 with non-HTML text longer than 20 characters (the same for llms-full.txt). If the home page redirects, the root of the final domain is checked. WordPress and SEO plugins are identified from the home page HTML. The country is the country of the list the site came from.",
            "This continues the run behind our [overview report](/guide/research-japan-web-agencies-ai-search-2026) published 2026-11-10 (aggregated 2026-11-05, 2,357 Japanese sites), with more sites added since. The small difference for Japan (13.6% → 13.4%) comes from the larger population, not from changes on the same sites.",
          ],
        },
        {
          heading: "Results: Japan and elsewhere",
          paragraphs: ["WordPress sites are much more likely to have an llms.txt; on other platforms the share is under 10% both in Japan and elsewhere. The gap between Japan and other countries is mostly on WordPress sites (14.0% vs 33.1%)."],
          table: MAIN_EN,
        },
        {
          heading: "llms.txt adoption by country",
          paragraphs: ["The 25 countries and territories with at least 30 reachable sites, ordered by share. Small groups move more from site to site, so read the share together with the count."],
          table: {
            head: ["Country / territory", "Sites reached", "Has llms.txt", "Share"],
            rows: countryRows(1),
            caption: "Web design agencies' own websites. Country = country of the source list. Countries with fewer than 30 reachable sites are not shown.",
          },
        },
        {
          heading: "By SEO plugin",
          paragraphs: [
            "WordPress sites grouped by the SEO plugin visible in the home page HTML. Outside Japan, AIOSEO sites have the highest share (51.1%), followed by Rank Math (40.8%) and Yoast SEO (30.8%). In Japan, sites with a detected plugin are at 19–23% and those without at 7.7%. We did not check whether the llms.txt was generated by the plugin.",
          ],
          table: PLUGIN_EN,
        },
        {
          heading: "Relationship with other items (Japan)",
          paragraphs: [
            "18.4% of sites with JSON-LD on the home page have an llms.txt, against 2.1% of those without. Among the 96 sites with FAQPage structured data, 42.7% do. Sites that add one AI-oriented item tend to add others. This is co-occurrence only and says nothing about cause.",
          ],
          table: WITH_EN,
        },
        {
          heading: "How long the files are",
          paragraphs: [
            "The median llms.txt among the 333 Japanese sites is 93 lines; none is 10 lines or shorter, and 72 (21.6%) run to 301 lines or more. Outside Japan the median is 65 lines. We did not assess content quality or format.",
          ],
          table: LINES_EN,
        },
        {
          heading: "Citing this survey",
          paragraphs: [
            "You may quote and republish the figures and tables freely, as long as you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. Sentences ready to quote:",
          ],
          list: [
            "26.4% of 13,352 web design agency websites outside Japan had an llms.txt file, against 13.4% in Japan (Nurevo AEO survey, November 2026).",
            "Among web design agency websites, llms.txt adoption was highest in Singapore (38.8%) and India (36.6%); it was 23.1% in the United States and 21.5% in the United Kingdom (Nurevo AEO survey, November 2026).",
            "51.1% of WordPress agency websites running All in One SEO had an llms.txt, versus 24.2% where no SEO plugin was detected (Nurevo AEO survey, November 2026, outside Japan).",
            "Only 1.8% of web design agency websites outside Japan had an llms-full.txt (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Limitations",
          list: [
            "Only the home page and /llms.txt and /llms-full.txt at the domain root were checked. An llms.txt placed elsewhere counts as missing.",
            "We checked only whether an llms.txt exists, not its quality, format, or whether AI services actually read it.",
            "The population is web design agencies' own websites, not businesses in general. The lists are our own; how they were built and their size differ by country, and they do not cover every agency. Treat country comparisons as indicative.",
            "One fetch per site: sites whose home page could not be reached (including temporary errors and bot protection) are excluded.",
          ],
        },
        {
          heading: "Our reading (opinion)",
          paragraphs: [
            "What follows is our opinion, not a finding. llms.txt is a fairly new proposal for telling AI systems what a site is about, and how the major AI services use it is not yet clear. Having one does not guarantee appearing in AI answers (in [another of our studies](/guide/aeo-signals-ai-answers-study), on-site signals showed no relationship with appearance). Still, it is useful to know that agencies outside Japan already put it on their own sites at about twice the rate of Japanese agencies.",
          ],
        },
        {
          heading: "Check your own or your clients' sites",
          paragraphs: [
            "The [free check](https://nurevo.jp/check) shows llms.txt, structured data and AI crawler access in about a minute. On WordPress, the [Nurevo WebMCP plugin](https://wordpress.org/plugins/nurevo-webmcp/) publishes an llms.txt and structured data. See the [llms.txt guide](/guide/llms-txt) for how to write one. Agencies that want to roll it out across client sites can see the [partner program](https://nurevo.jp/partner/).",
          ],
        },
      ],
      faqs: [
        { q: "How widely is llms.txt adopted?", a: "In this survey of web design agencies' own websites, 26.4% outside Japan (3,522 of 13,352) and 13.4% in Japan (333 of 2,486) had an llms.txt (November 2026)." },
        { q: "Which countries have the highest llms.txt adoption?", a: "Among 25 countries and territories with at least 30 reachable agency sites, Singapore (38.8%), India (36.6%) and Brazil (34.1%) were highest. Lists differ by country, so treat comparisons as indicative." },
        { q: "Do sites with an SEO plugin have an llms.txt more often?", a: "Yes in this data. Outside Japan, 51.1% of WordPress sites with AIOSEO, 40.8% with Rank Math and 30.8% with Yoast SEO had one, against 24.2% with no SEO plugin detected. We did not check whether the plugin generated the file." },
        { q: "Can I use these figures in an article?", a: "Yes. Credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page, and you may quote and republish them freely." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Check your site's llms.txt",
        body: "The free check shows your llms.txt, structured data and AI crawler access. It does not guarantee appearing in AI answers.",
        label: "Run the free check",
        href: "/check",
        secondary: { label: "Partner program for agencies", href: "/partner/" },
      },
      footnote: "Research by Nurevo AEO (Bestie.合同会社). Product and company names are trademarks of their owners. Individual companies and domains are not published.",
    },
  },
};
