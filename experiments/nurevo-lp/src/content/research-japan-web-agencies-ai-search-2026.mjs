// Content page: research report. AI-search readiness of Japanese web design
// agencies' own websites (home page, robots.txt, llms.txt), November 2026.
//
// Every number here comes from nurevo-outreach data/survey/summary_2026-11-05.json
// and, for counts (numerators), from raw_2026-11-05.json of the same run
// (survey.js). Do not add a figure that is not in that data. The raw file holds
// company names and domains: never publish them, nor any group under 30 sites.
// Definitions follow survey.js: "blocked" = the robots.txt group that applies to
// the bot disallows "/" (longest match); "Organization-type" = an @type matching
// Organization|LocalBusiness|Corporation|ProfessionalService; the 6-item check
// is survey.js score() and is not Nurevo's 0–100 product score.

const MAIN_JA = {
  head: ["項目", "該当", "割合"],
  rows: [
    ["HTTPSで表示", "2,355 / 2,357", "99.9%"],
    ["WordPressで作られている", "2,166 / 2,357", "91.9%"],
    ["meta description がある", "2,139 / 2,357", "90.8%"],
    ["robots.txt がある", "2,158 / 2,357", "91.6%"],
    ["robots.txt に Sitemap の記載がある", "1,988 / 2,158", "92.1%"],
    ["canonical がある", "1,988 / 2,357", "84.3%"],
    ["OGP（og:title）がある", "1,909 / 2,357", "81.0%"],
    ["構造化データ（JSON-LD）がある", "1,624 / 2,357", "68.9%"],
    ["Organization系の構造化データがある", "1,373 / 2,357", "58.3%"],
    ["llms.txt がある", "321 / 2,357", "13.6%"],
    ["microdata（schema.org）がある", "184 / 2,357", "7.8%"],
    ["FAQPage の構造化データがある", "92 / 2,357", "3.9%"],
    ["robots.txt でAIボットを1つ以上ブロック", "28 / 2,158", "1.3%"],
    ["llms-full.txt がある", "14 / 2,357", "0.6%"],
  ],
  caption: "対象：国内Web制作会社の自社サイトで、トップページに到達できた2,357件。robots.txt 関連は robots.txt がある2,158件が分母。2026年11月5日集計。",
};

const MAIN_EN = {
  head: ["Item", "Sites", "Share"],
  rows: [
    ["Served over HTTPS", "2,355 / 2,357", "99.9%"],
    ["Built on WordPress", "2,166 / 2,357", "91.9%"],
    ["Has a meta description", "2,139 / 2,357", "90.8%"],
    ["Has a robots.txt", "2,158 / 2,357", "91.6%"],
    ["robots.txt lists a Sitemap", "1,988 / 2,158", "92.1%"],
    ["Has a canonical link", "1,988 / 2,357", "84.3%"],
    ["Has Open Graph (og:title)", "1,909 / 2,357", "81.0%"],
    ["Has structured data (JSON-LD)", "1,624 / 2,357", "68.9%"],
    ["Has Organization-type structured data", "1,373 / 2,357", "58.3%"],
    ["Has an llms.txt", "321 / 2,357", "13.6%"],
    ["Has schema.org microdata", "184 / 2,357", "7.8%"],
    ["Has FAQPage structured data", "92 / 2,357", "3.9%"],
    ["robots.txt blocks at least one AI bot", "28 / 2,158", "1.3%"],
    ["Has an llms-full.txt", "14 / 2,357", "0.6%"],
  ],
  caption: "Base: the 2,357 websites of Japanese web design agencies whose home page could be reached. robots.txt rows use the 2,158 sites with a robots.txt. Aggregated 2026-11-05.",
};

const BOT_ROWS = [
  ["GPTBot（OpenAI）", "27", "1.3%"],
  ["Google-Extended（Google）", "24", "1.1%"],
  ["CCBot（Common Crawl）", "24", "1.1%"],
  ["Bytespider（ByteDance）", "24", "1.1%"],
  ["anthropic-ai（Anthropic）", "22", "1.0%"],
  ["ClaudeBot（Anthropic）", "21", "1.0%"],
  ["Applebot-Extended（Apple）", "21", "1.0%"],
  ["ChatGPT-User（OpenAI）", "2", "0.1%"],
  ["PerplexityBot（Perplexity）", "1", "0.05%"],
  ["OAI-SearchBot（OpenAI）", "0", "0%"],
  ["Claude-SearchBot（Anthropic）", "0", "0%"],
  ["Googlebot（Google）", "0", "0%"],
  ["Bingbot（Microsoft）", "0", "0%"],
];
const BOT_EN_ROWS = BOT_ROWS.map(([bot, k, s]) => [bot.replace("（", " (").replace("）", ")"), k, s]);

const TYPES_JA = {
  head: ["@type", "割合"],
  rows: [
    ["WebSite", "62.4%"],
    ["Organization", "53.7%"],
    ["BreadcrumbList", "43.0%"],
    ["ImageObject", "38.1%"],
    ["WebPage", "34.1%"],
    ["SearchAction", "28.6%"],
    ["PostalAddress", "16.3%"],
    ["Person", "10.1%"],
    ["ContactPoint", "6.4%"],
    ["ProfessionalService", "5.6%"],
    ["LocalBusiness", "5.3%"],
    ["FAQPage", "3.9%"],
  ],
  caption: "トップページのJSON-LDに含まれる @type（入れ子を含む）。分母は2,357件。",
};
const TYPES_EN = { ...TYPES_JA, head: ["@type", "Share"], caption: "@type values found in the home page's JSON-LD, nested ones included. Base: 2,357 sites." };

const SCORE_ROWS = [
  ["0", "40", "1.7%"],
  ["1", "116", "4.9%"],
  ["2", "254", "10.8%"],
  ["3", "369", "15.7%"],
  ["4", "360", "15.3%"],
  ["5", "971", "41.2%"],
  ["6", "247", "10.5%"],
];

export default {
  slug: "research-japan-web-agencies-ai-search-2026",
  targetQueries: [
    "Web制作会社 AI検索 対応状況 調査",
    "llms.txt 導入率 日本",
    "AIクローラー ブロック 割合 robots.txt 調査",
    "構造化データ 導入率 調査 2026",
    "AI search readiness Japan web agencies survey",
    "llms.txt adoption rate Japan",
  ],
  related: ["llms-txt", "aeo-wordpress", "agency-aeo-monthly-service", "aeo-signals-ai-answers-study"],
  locales: {
    ja: {
      title: "国内Web制作会社サイトのAI検索対応状況【2026年11月・2,357件調査】 | Nurevo",
      description: "国内Web制作会社の自社サイト2,357件を調査。llms.txtは13.6%、JSON-LDは68.9%、robots.txtでAIボットをブロックしているのは1.3%でした。方法・数値・限界。",
      h1: "国内Web制作会社サイトのAI検索対応状況：2,357件を調査（2026年11月）",
      lead: "国内のWeb制作会社の自社サイト2,357件のトップページ・robots.txt・llms.txtを調べたところ、llms.txt を置いていたのは13.6%（321件）、構造化データ（JSON-LD）があったのは68.9%（1,624件）、robots.txt でAIボットを1つ以上ブロックしていたのは1.3%（robots.txt がある2,158件中28件）でした。",
      intro: [
        "公開：2026年11月7日。データ：2026年11月5日集計。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策（AEO）のツールを提供しており、この分野に利害があります。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "llms.txt を設置している制作会社サイトは13.6%（2,357件中321件）。llms-full.txt は0.6%（14件）でした。",
            "robots.txt でAIボットを1つ以上ブロックしていたのは1.3%（robots.txt がある2,158件中28件）。ほとんどのサイトはAIクローラーを拒否していません。",
            "構造化データ（JSON-LD）があるのは68.9%、会社情報にあたる Organization 系の型があるのは58.3%、FAQPage は3.9%でした。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "対象：日本のWeb制作会社の自社サイト（制作会社であることを確認できたもの）2,756件。一般企業のサイト全体ではありません。",
            "到達：トップページを取得できたのは2,357件（85.5%）。結果はこの2,357件についての数字です。",
            "取得したもの：各サイトのトップページ、/robots.txt、/llms.txt、/llms-full.txt を1回ずつ（User-Agent：NurevoSurvey/1.0）。2026年11月上旬に取得し、11月5日に集計しました。",
            "判定方法：構造化データはトップページの JSON-LD を解析し、@type を数えました（解析できないものは「壊れている」と数えます）。llms.txt は、ステータス200で中身がHTMLではなく20文字を超えるテキストを「あり」としました。robots.txt は、各ボットに当てはまるグループの規則で、トップページ（/）が Disallow になるかを判定しました（最長一致）。",
            "同じ調査で海外の制作会社サイトも取得しています（全体で20,720件、到達15,657件）。海外との比較は別のレポートで出します。",
          ],
        },
        {
          heading: "結果：主な項目",
          paragraphs: ["基本的なSEOの設定（HTTPS、meta description、robots.txt、canonical）は8〜9割以上のサイトで整っていました。AI向けの新しい項目（llms.txt、FAQPage）はまだ少数です。"],
          table: MAIN_JA,
        },
        {
          heading: "AIクローラーへの robots.txt の扱い",
          paragraphs: [
            "robots.txt がある2,158件のうち、AIボットの名前を書いていたのは2.5%（54件）、何らかのAIボットについてトップページを Disallow にしていたのは1.3%（28件）でした。ブロックの多くは学習用のクローラー（GPTBot、Google-Extended、CCBot など）向けで、検索用の OAI-SearchBot・Claude-SearchBot をブロックしていたサイトはありませんでした。",
          ],
          table: {
            head: ["ボット", "ブロック件数", "割合"],
            rows: BOT_ROWS,
            caption: "分母：robots.txt がある2,158件。「ブロック」はそのボットに当てはまるグループで / が Disallow になること。",
          },
        },
        {
          heading: "llms.txt",
          paragraphs: [
            "llms.txt は2,357件中321件（13.6%）にありました。置いているサイトの llms.txt の行数の中央値は96行です。全文版の llms-full.txt は14件（0.6%）でした。",
          ],
        },
        {
          heading: "構造化データの種類",
          paragraphs: [
            "JSON-LD があった1,624件のうち、解析できない（壊れている）JSON-LD を含むのは1.7%（27件）でした。型では WebSite・Organization・BreadcrumbList が多く、住所（PostalAddress）は16.3%、LocalBusiness は5.3%、FAQPage は3.9%です。",
          ],
          table: TYPES_JA,
        },
        {
          heading: "6項目チェックの分布",
          paragraphs: [
            "次の6項目のうち、いくつ満たしているかを数えました：①llms.txt がある ②JSON-LD がある ③Organization または LocalBusiness の型がある ④robots.txt があり、GPTBot・ClaudeBot・PerplexityBot・OAI-SearchBot のどれもブロックしていない ⑤meta description がある ⑥canonical がある。この調査のための簡易な数え方で、Nurevo の製品のスコア（0〜100点）とは別のものです。平均は4.0項目、6項目すべてを満たしたのは10.5%でした。",
          ],
          table: {
            head: ["満たした項目数", "件数", "割合"],
            rows: SCORE_ROWS,
            caption: "分母：2,357件。",
          },
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "この調査の数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。そのまま使える1文：",
          ],
          list: [
            "国内Web制作会社の自社サイト2,357件のうち、llms.txt を設置していたのは13.6%だった（Nurevo AEO 調査、2026年11月）。",
            "国内Web制作会社の自社サイトで、robots.txt でAIボットを1つ以上ブロックしていたのは1.3%（2,158件中28件）だった（Nurevo AEO 調査、2026年11月）。",
            "国内Web制作会社の自社サイトの68.9%がトップページに構造化データ（JSON-LD）を入れていたが、FAQPage は3.9%にとどまった（Nurevo AEO 調査、2026年11月）。",
            "国内Web制作会社の自社サイトの91.9%が WordPress で作られていた（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "この調査の限界",
          list: [
            "トップページだけを見ています。下層ページの構造化データや、サイト全体の状態は含みません。",
            "robots.txt は、トップページ（/）に対する判定です。特定のディレクトリだけをブロックしている場合は「ブロックなし」と数えています。また、robots.txt 以外の方法（ファイアウォール、CDNのボット対策など）でのブロックは測っていません。",
            "対象はWeb制作会社の自社サイトで、一般企業や店舗のサイト全体の傾向ではありません。制作会社のリストは当社が集めたもので、すべての制作会社を網羅していません。",
            "1回の取得による結果で、一時的なエラーで到達できなかったサイト（399件）は含みません。llms.txt は「置いてあるか」だけを見ており、内容の質は評価していません。",
          ],
        },
        {
          heading: "Nurevo の見方（意見）",
          paragraphs: [
            "ここからは事実ではなく当社の意見です。制作会社のサイトは、基本的なSEOの設定はほぼ整っており、AIクローラーを拒否しているサイトもごく少数でした。一方で llms.txt や FAQPage のような、AIに情報を読み取ってもらうための項目は、まだ一部のサイトにしかありません。これらを整えても、AIの回答に必ず登場するわけではありません（当社の[別の調査](/guide/aeo-signals-ai-answers-study)では、サイト側の対策と登場率の関係は見られませんでした）。ただ、AIが会社の事実を正しく読めるようにする基本として、確認しておく価値はあると考えています。",
          ],
        },
        {
          heading: "自社サイト・お客様のサイトを確認するには",
          paragraphs: [
            "[無料チェック](https://nurevo.jp/check)で、llms.txt・構造化データ・AIクローラーの許可状況を1分で確認できます。WordPress なら [Nurevo WebMCP プラグイン](https://wordpress.org/plugins/nurevo-webmcp/)で llms.txt と構造化データを出せます。お客様のサイトにまとめて導入したい制作会社の方は[パートナープログラム](https://nurevo.jp/partner/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "国内Web制作会社のサイトで llms.txt はどのくらい普及していますか？", a: "この調査では、国内Web制作会社の自社サイト2,357件のうち321件（13.6%）に llms.txt がありました（2026年11月）。" },
        { q: "AIクローラーを robots.txt でブロックしている制作会社は多いですか？", a: "少数です。robots.txt がある2,158件のうち、AIボットを1つ以上ブロックしていたのは28件（1.3%）でした。検索用の OAI-SearchBot・Claude-SearchBot をブロックしていたサイトはありませんでした。" },
        { q: "この数字は一般企業のサイトにも当てはまりますか？", a: "当てはまるとは限りません。対象はWeb制作会社の自社サイトで、トップページだけを調べています。" },
        { q: "数字を記事で使ってもいいですか？", a: "はい。出典「Nurevo AEO 調査（nurevo.jp）」とこのページへのリンクを明記すれば、自由に引用・転載できます。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "あなたのサイトのAI対応を確認",
        body: "無料チェックで、llms.txt・構造化データ・AIクローラーの許可状況が分かります。AIの回答に出ることを保証するものではありません。",
        label: "無料でチェックする",
        href: "/check",
        secondary: { label: "制作会社向けパートナー", href: "/partner/" },
      },
      footnote: "調査：Nurevo AEO（Bestie.合同会社）。記載の社名・サービス名は各社の商標です。個別の会社名・ドメインは公開しません。",
    },
    en: {
      title: "AI Search Readiness of 2,357 Japanese Web Agency Sites (2026) | Nurevo",
      description: "We checked 2,357 websites of Japanese web design agencies: 13.6% have an llms.txt, 68.9% have JSON-LD, and 1.3% block an AI bot in robots.txt. Method, data, limits.",
      h1: "AI search readiness of Japanese web design agencies' own websites: 2,357 sites (November 2026)",
      lead: "We fetched the home page, robots.txt and llms.txt of 2,357 websites of Japanese web design agencies. 13.6% (321) had an llms.txt, 68.9% (1,624) had structured data (JSON-LD), and 1.3% (28 of the 2,158 with a robots.txt) blocked at least one AI bot in robots.txt.",
      intro: [
        "Published 2026-11-07. Data aggregated 2026-11-05. Research by Nurevo AEO (Bestie.合同会社). Nurevo sells AI search optimization (AEO) tools and so has an interest in this topic.",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "13.6% of Japanese web agency websites (321 of 2,357) have an llms.txt; 0.6% (14) have an llms-full.txt.",
            "1.3% (28 of the 2,158 with a robots.txt) block at least one AI bot in robots.txt. Almost none turn AI crawlers away.",
            "68.9% have structured data (JSON-LD), 58.3% have an Organization-type node, and 3.9% have FAQPage.",
          ],
        },
        {
          heading: "About the survey",
          list: [
            "Population: the company websites of 2,756 web design agencies in Japan that we could confirm are agencies. This is not a sample of all business websites.",
            "Reached: the home page could be fetched for 2,357 (85.5%). All results refer to these 2,357 sites.",
            "Fetched: each site's home page, /robots.txt, /llms.txt and /llms-full.txt, once each (User-Agent: NurevoSurvey/1.0), in early November 2026, aggregated on 2026-11-05.",
            "How things were judged: structured data by parsing the home page's JSON-LD and counting @type values (JSON-LD that does not parse counts as broken). An llms.txt counts if it returns status 200 with non-HTML text longer than 20 characters. For robots.txt, a bot counts as blocked if the group that applies to it disallows the home page (/), using the longest matching rule.",
            "The same run also covered agencies outside Japan (20,720 sites in total, 15,657 reached). A comparison will follow in a separate report.",
          ],
        },
        {
          heading: "Results: main items",
          paragraphs: ["Basic SEO settings (HTTPS, meta description, robots.txt, canonical) are in place on more than 80 to 90 percent of sites. Newer items aimed at AI, such as llms.txt and FAQPage, are still in a minority."],
          table: MAIN_EN,
        },
        {
          heading: "How robots.txt treats AI crawlers",
          paragraphs: [
            "Of the 2,158 sites with a robots.txt, 2.5% (54) mention an AI bot by name, and 1.3% (28) disallow the home page for at least one AI bot. Most blocks target training crawlers (GPTBot, Google-Extended, CCBot and similar). No site blocked the search crawlers OAI-SearchBot or Claude-SearchBot.",
          ],
          table: {
            head: ["Bot", "Sites blocking", "Share"],
            rows: BOT_EN_ROWS,
            caption: "Base: the 2,158 sites with a robots.txt. Blocked means the group that applies to the bot disallows /.",
          },
        },
        {
          heading: "llms.txt",
          paragraphs: [
            "321 of 2,357 sites (13.6%) have an llms.txt. Among them, the median llms.txt is 96 lines long. 14 sites (0.6%) also have the full-text llms-full.txt.",
          ],
        },
        {
          heading: "Types of structured data",
          paragraphs: [
            "Of the 1,624 sites with JSON-LD, 1.7% (27) include JSON-LD that does not parse. WebSite, Organization and BreadcrumbList are the most common types; PostalAddress appears on 16.3% of sites, LocalBusiness on 5.3% and FAQPage on 3.9%.",
          ],
          table: TYPES_EN,
        },
        {
          heading: "Six-item check",
          paragraphs: [
            "We counted how many of six items each site meets: (1) has an llms.txt; (2) has JSON-LD; (3) has an Organization or LocalBusiness type; (4) has a robots.txt that blocks none of GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot; (5) has a meta description; (6) has a canonical link. This is a simple count made for this survey, not Nurevo's 0–100 product score. The average is 4.0 items; 10.5% meet all six.",
          ],
          table: {
            head: ["Items met", "Sites", "Share"],
            rows: SCORE_ROWS,
            caption: "Base: 2,357 sites.",
          },
        },
        {
          heading: "Citing this survey",
          paragraphs: [
            "You may quote and republish the figures and tables freely, as long as you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. Sentences ready to quote:",
          ],
          list: [
            "13.6% of 2,357 Japanese web design agency websites had an llms.txt file (Nurevo AEO survey, November 2026).",
            "Only 1.3% of Japanese web design agency websites (28 of 2,158 with a robots.txt) blocked an AI bot in robots.txt (Nurevo AEO survey, November 2026).",
            "68.9% of Japanese web design agency websites had JSON-LD structured data on the home page, but only 3.9% had FAQPage (Nurevo AEO survey, November 2026).",
            "91.9% of Japanese web design agency websites run on WordPress (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Limitations",
          list: [
            "Only the home page was examined. Structured data on inner pages, and the state of the site as a whole, are not included.",
            "robots.txt was judged for the home page (/) only. A site that blocks only some directories counts as not blocking. Blocking by other means (firewalls, CDN bot protection) was not measured.",
            "The population is web design agencies' own websites, not businesses in general. The list of agencies is our own and does not cover every agency in Japan.",
            "One fetch per site: 399 sites that could not be reached, including temporary errors, are excluded. For llms.txt we checked only whether it exists, not its quality.",
          ],
        },
        {
          heading: "Our reading (opinion)",
          paragraphs: [
            "What follows is our opinion, not a finding. Agency websites have their basic SEO settings largely in place, and very few turn AI crawlers away. Items that help AI read a company's information, such as llms.txt and FAQPage, are still on only some sites. Adding them does not guarantee appearing in AI answers (in [another of our studies](/guide/aeo-signals-ai-answers-study), on-site signals showed no relationship with appearance), but we think they are worth checking as a basis for AI reading a company's facts correctly.",
          ],
        },
        {
          heading: "Check your own or your clients' sites",
          paragraphs: [
            "The [free check](https://nurevo.jp/check) shows llms.txt, structured data and AI crawler access in about a minute. On WordPress, the [Nurevo WebMCP plugin](https://wordpress.org/plugins/nurevo-webmcp/) publishes an llms.txt and structured data. Agencies that want to roll it out across client sites can see the [partner program](https://nurevo.jp/partner/).",
          ],
        },
      ],
      faqs: [
        { q: "How common is llms.txt on Japanese web agency websites?", a: "In this survey, 321 of 2,357 websites of Japanese web design agencies (13.6%) had an llms.txt (November 2026)." },
        { q: "Do many agencies block AI crawlers in robots.txt?", a: "Few do. Of the 2,158 sites with a robots.txt, 28 (1.3%) blocked at least one AI bot. None blocked the search crawlers OAI-SearchBot or Claude-SearchBot." },
        { q: "Do these figures apply to business websites in general?", a: "Not necessarily. The survey covers web design agencies' own websites, and only their home pages." },
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
      footnote: "Research by Nurevo AEO (Bestie.合同会社). Product and company names are trademarks of their owners. Individual companies and domains are not published.",
    },
  },
};
