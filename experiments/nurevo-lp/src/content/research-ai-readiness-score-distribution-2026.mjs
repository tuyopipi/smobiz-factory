// Content page: research report. Distribution of a simple 6-item "AI readiness"
// count on web design agencies' own websites: Japan vs outside Japan, WordPress
// vs not, by country, and which item is missing on 5-of-6 sites. November 2026.
//
// Every number here comes from nurevo-outreach data/survey/raw_2026-11-12.json
// (survey.js; the same run as summary_2026-11-12.json, whose aiReady6 shares
// match). Do not add a figure that is not in that data. The raw file holds
// company names and domains: never publish them, nor any group under 30 sites
// (country rows here need 100+ reachable sites). The 6 items follow survey.js
// score(): (1) llms.txt (HTTP 200, not HTML, >20 chars); (2) any JSON-LD block;
// (3) an @type matching /Organization|LocalBusiness/ in parseable JSON-LD;
// (4) a robots.txt exists AND none of GPTBot, ClaudeBot, PerplexityBot,
// OAI-SearchBot is disallowed from "/" (longest match) — a site with no
// robots.txt scores 0 on this item; (5) meta description (10+ chars);
// (6) rel=canonical. Not Nurevo's 0–100 product score. "Excluding HTTP 202" =
// the 1,477 overseas home pages answered with status 202 (none in Japan).

const DIST = [
  // [score, JP count, JP %, overseas count, overseas %]
  ["0", "40", "1.6%", "2,622", "19.6%"],
  ["1", "120", "4.8%", "321", "2.4%"],
  ["2", "265", "10.7%", "548", "4.1%"],
  ["3", "384", "15.4%", "438", "3.3%"],
  ["4", "380", "15.3%", "1,658", "12.4%"],
  ["5", "1,039", "41.8%", "4,854", "36.4%"],
  ["6", "258", "10.4%", "2,911", "21.8%"],
];

// [ja, en, sites, average, median, 5+, all 6, 2 or less]
const GROUPS = [
  ["日本・全体", "Japan, all", "2,486", "4.05", "5", "52.2%", "10.4%", "17.1%"],
  ["日本・WordPress", "Japan, WordPress", "2,295", "4.21", "5", "55.4%", "10.8%", "13.1%"],
  ["日本・WordPress以外", "Japan, not WordPress", "191", "2.14", "2", "13.1%", "4.7%", "64.9%"],
  ["海外・全体", "Outside Japan, all", "13,352", "3.83", "5", "58.2%", "21.8%", "26.1%"],
  ["海外・全体（202応答を除く）", "Outside Japan, all (excl. HTTP 202)", "11,875", "4.30", "5", "65.4%", "24.5%", "17.0%"],
  ["海外・WordPress", "Outside Japan, WordPress", "10,081", "4.87", "5", "74.8%", "28.0%", "5.5%"],
  ["海外・WordPress以外", "Outside Japan, not WordPress", "3,271", "0.61", "0", "6.7%", "2.6%", "89.9%"],
  ["海外・WordPress以外（202応答を除く）", "Outside Japan, not WordPress (excl. HTTP 202)", "1,794", "1.09", "0", "12.3%", "4.7%", "81.5%"],
];

// [item ja, item en, JP all, JP WP, JP non-WP, overseas all, overseas excl. 202, overseas WP]
const ITEMS = [
  ["(1) llms.txt がある", "(1) Has llms.txt", "13.4%", "14.0%", "6.3%", "26.4%", "29.6%", "33.1%"],
  ["(2) JSON-LD がある", "(2) Has JSON-LD", "69.4%", "72.9%", "28.3%", "72.0%", "81.0%", "92.5%"],
  ["(3) Organization / LocalBusiness 型", "(3) Organization / LocalBusiness type", "56.1%", "59.2%", "18.8%", "61.6%", "69.3%", "79.4%"],
  ["(4) robots.txt があり主要AIボットを止めていない", "(4) robots.txt present, main AI bots not blocked", "90.6%", "94.7%", "41.4%", "74.8%", "83.8%", "93.2%"],
  ["(5) meta description がある", "(5) Has meta description", "90.7%", "91.9%", "76.4%", "71.5%", "80.3%", "91.1%"],
  ["(6) canonical がある", "(6) Has canonical", "84.6%", "88.1%", "42.9%", "76.4%", "85.9%", "97.9%"],
];

// [item ja, item en, JP count, JP %, overseas count, overseas %] — sites scoring exactly 5
const MISSING5 = [
  ["llms.txt", "llms.txt", "986", "94.9%", "4,403", "90.7%"],
  ["Organization / LocalBusiness 型", "Organization / LocalBusiness type", "38", "3.7%", "228", "4.7%"],
  ["robots.txt（無い、または主要AIボットを止めている）", "robots.txt (missing, or blocks a main AI bot)", "4", "0.4%", "156", "3.2%"],
  ["meta description", "meta description", "7", "0.7%", "53", "1.1%"],
  ["canonical", "canonical", "4", "0.4%", "14", "0.3%"],
];

// [ja, en, reachable, avg, 5+, all 6, 0, HTTP 202, avg excl. 202, 5+ excl. 202]
const COUNTRY = [
  ["アメリカ", "United States", "4,472", "3.65", "54.6%", "18.9%", "22.1%", "671", "4.29", "64.2%"],
  ["日本", "Japan", "2,486", "4.05", "52.2%", "10.4%", "1.6%", "0", "4.05", "52.2%"],
  ["オーストラリア", "Australia", "1,719", "3.77", "56.7%", "20.8%", "20.7%", "250", "4.40", "66.3%"],
  ["インド", "India", "1,554", "4.53", "70.4%", "29.9%", "7.5%", "23", "4.60", "71.5%"],
  ["イギリス", "United Kingdom", "942", "3.61", "55.1%", "17.7%", "23.6%", "140", "4.24", "64.7%"],
  ["カナダ", "Canada", "908", "3.58", "55.2%", "18.9%", "24.3%", "122", "4.14", "63.7%"],
  ["シンガポール", "Singapore", "641", "4.36", "69.7%", "32.4%", "13.9%", "47", "4.70", "75.3%"],
  ["ニュージーランド", "New Zealand", "417", "3.80", "57.8%", "20.9%", "18.7%", "37", "4.17", "63.4%"],
  ["フランス", "France", "405", "4.71", "74.3%", "24.0%", "3.7%", "7", "4.80", "75.6%"],
  ["南アフリカ", "South Africa", "389", "3.90", "57.8%", "24.4%", "18.5%", "16", "4.07", "60.3%"],
  ["アイルランド", "Ireland", "266", "3.28", "48.5%", "17.3%", "29.3%", "43", "3.90", "57.8%"],
  ["ブラジル", "Brazil", "261", "4.11", "63.2%", "25.3%", "14.2%", "9", "4.25", "65.5%"],
  ["スペイン", "Spain", "248", "3.67", "56.9%", "27.4%", "25.8%", "14", "3.89", "60.3%"],
  ["フィリピン", "Philippines", "241", "4.27", "68.5%", "27.0%", "12.4%", "16", "4.57", "73.3%"],
  ["オランダ", "Netherlands", "127", "3.66", "51.2%", "18.9%", "22.8%", "15", "4.15", "58.0%"],
  ["メキシコ", "Mexico", "116", "3.06", "47.4%", "18.1%", "33.6%", "12", "3.41", "52.9%"],
  ["イタリア", "Italy", "110", "2.70", "40.9%", "17.3%", "41.8%", "25", "3.48", "52.9%"],
];

export default {
  slug: "research-ai-readiness-score-distribution-2026",
  targetQueries: [
    "AI検索 対応状況 調査 スコア",
    "AI対応 サイト 調査 2026",
    "llms.txt 構造化データ 導入率 調査",
    "Web制作会社 AI検索 対策 調査",
    "AI search readiness survey websites 2026",
    "llms.txt adoption statistics web agencies",
    "AI crawler robots.txt structured data survey",
  ],
  related: ["research-japan-web-agencies-ai-search-2026", "research-wordpress-seo-plugins-2026", "llms-txt", "aeo-wordpress"],
  locales: {
    ja: {
      title: "AI検索対応6項目の達成度分布【制作会社15,838件】 | Nurevo",
      description: "Web制作会社サイト15,838件を6項目で採点。日本は平均4.05点・5点以上52.2%・満点10.4%、海外は満点21.8%。日本の5点サイトの94.9%は llms.txt だけが欠けていました。",
      h1: "AI検索への対応度（6項目）の分布：Web制作会社サイト15,838件を調査（2026年11月）",
      lead: "日本と海外のWeb制作会社の自社サイト15,838件のトップページを、AI検索に関係する6項目（llms.txt・JSON-LD・会社の型・robots.txt・meta description・canonical）で数えました。日本の2,486件は平均4.05点で、52.2%が5点以上でしたが、6項目すべてそろったのは10.4%でした。5点のサイトの94.9%は、欠けている1項目が llms.txt でした。",
      intro: [
        "公開：2026年11月15日。データ：2026年11月12日集計。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策（AEO）のツールと WordPress プラグインを提供しており、この分野に利害があります。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "国内Web制作会社サイト2,486件の6項目の平均は4.05点（中央値5点）。5点以上は52.2%（1,297件）、6項目すべては10.4%（258件）でした。海外13,352件は平均3.83点、5点以上58.2%、6項目すべて21.8%です。",
            "日本で5点だった1,039件のうち986件（94.9%）は、欠けていた1項目が llms.txt でした。llms.txt 以外の5項目がそろっているサイトは日本全体の50.0%（1,244件）です。",
            "WordPress かどうかで差が大きく、日本の WordPress サイトは平均4.21点、WordPress 以外（191件）は2.14点でした。海外でも WordPress は4.87点、WordPress 以外は0.61点です（海外の WordPress 以外にはHTTP 202の応答が多く、その分を除くと1.09点）。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "対象：Web制作会社の自社サイト。日本3,352件（制作会社であることを確認できたもの）と海外20,335件、計23,687件。一般企業のサイト全体ではありません。",
            "到達：トップページを取得できたのは15,838件（日本2,486件、海外13,352件）。これがこのレポートの分母です。",
            "取得したもの：各サイトのトップページ、/robots.txt、/llms.txt、/llms-full.txt を1回ずつ（User-Agent：NurevoSurvey/1.0）。2026年11月上旬〜12日に取得し、11月12日に集計しました。",
            "6項目：(1) llms.txt がある（ステータス200、HTMLではない、20文字超）、(2) トップページに JSON-LD がある、(3) 読み取れた JSON-LD に Organization または LocalBusiness を含む型がある、(4) robots.txt があり、GPTBot・ClaudeBot・PerplexityBot・OAI-SearchBot のどれもトップページ（/）を Disallow されていない（最長一致）、(5) 10文字以上の meta description がある、(6) canonical がある。当てはまる数を0〜6点としました。この調査のための単純な数で、Nurevo の0〜100点のスコアとは別物です。",
            "(4) は robots.txt が無いサイトを0点にしています。robots.txt が無ければクロールは原則として止められませんが、この数え方では「置いて、止めていないことを確かめられる」ことを1点としています。",
            "HTTP 202：海外の1,477件（海外到達の11.1%）はトップページがステータス202で返り、うち1,435件が0点でした。自動アクセスへの確認画面などで本来のページが取れていない可能性があるため、202を除いた値も併記しています。日本では202はありませんでした。",
            "国は当社の収集リストでの所在国です。30件未満の区分は載せていません（国別は到達100件以上の国だけ）。",
          ],
        },
        {
          heading: "結果：点数の分布",
          paragraphs: [
            "日本も海外も5点がいちばん多い山です。日本は2〜4点にも4割強（41.4%）が分かれる一方、0点は1.6%でした。海外は6点が日本の約2倍（21.8%と10.4%）ですが、0点も19.6%あり、二つの山に分かれています。海外の0点の多くはHTTP 202の応答でした（調査概要を参照）。",
          ],
          table: {
            head: ["点数", "日本（件）", "日本（割合）", "海外（件）", "海外（割合）"],
            rows: DIST,
            caption: "日本2,486件、海外13,352件。2026年11月12日集計。",
          },
        },
        {
          heading: "区分ごとの平均と分布",
          paragraphs: [
            "WordPress のサイトは日本・海外とも中央値5点でした。日本の WordPress 以外のサイトは中央値2点で、64.9%が2点以下です。WordPress と各項目の関係は同時に見られたというだけで、WordPress が原因であることを示すものではありません。",
          ],
          table: {
            head: ["区分", "件数", "平均", "中央値", "5点以上", "6点", "2点以下"],
            rows: GROUPS.map(([ja, , ...v]) => [ja, ...v]),
            caption: "202応答を除く行は、海外でトップページがステータス202だった1,477件を除いたもの（WordPress と判定したサイトに202はなし）。",
          },
        },
        {
          heading: "項目ごとの達成率",
          paragraphs: [
            "日本で最も低いのは llms.txt（13.4%）で、次が会社の型（56.1%）です。meta description と robots.txt は9割を超えています。日本の WordPress 以外のサイトでは、robots.txt の項目が41.4%と低く、その多くは robots.txt が置かれていないこと（55.0%）によるものでした。",
          ],
          table: {
            head: ["項目", "日本・全体", "日本・WordPress", "日本・WordPress以外", "海外・全体", "海外（202除く）", "海外・WordPress"],
            rows: ITEMS.map(([ja, , ...v]) => [ja, ...v]),
            caption: "各区分の到達サイトに占める割合。(3) の型は読み取れた JSON-LD の @type で判定（壊れた JSON-LD は数えない）。",
          },
        },
        {
          heading: "5点のサイトに欠けている1項目",
          paragraphs: [
            "あと1項目で6点になるサイトで、欠けているものはほぼ llms.txt でした。日本の4点のサイト（380件）でも95.8%に llms.txt がなく、67.6%に会社の型がありませんでした。",
          ],
          table: {
            head: ["欠けている項目", "日本（件）", "日本（割合）", "海外（件）", "海外（割合）"],
            rows: MISSING5.map(([ja, , ...v]) => [ja, ...v]),
            caption: "ちょうど5点だったサイト（日本1,039件、海外4,854件）が欠いている1項目。JSON-LD そのものが欠けて5点のサイトはありませんでした（JSON-LD が無いと型の項目も0点になるため）。",
          },
        },
        {
          heading: "国別",
          paragraphs: [
            "到達100件以上の17か国です。到達した全件で見ると、平均が高いのはフランス（4.71点）、インド（4.53点）、シンガポール（4.36点）でした。英語圏の多くの国は0点が2割前後あり、202応答を除くと平均は4.1〜4.4点に上がります。日本（4.05点）は0点が1.6%と少ない一方、6点は10.4%で17か国の中で最も低い割合でした。",
          ],
          table: {
            head: ["国・地域", "到達件数", "平均", "5点以上", "6点", "0点", "202応答", "平均（202除く）", "5点以上（202除く）"],
            rows: COUNTRY.map(([ja, , ...v]) => [ja, ...v]),
            caption: "国は当社の収集リストでの所在国。",
          },
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "この調査の数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。そのまま使える1文：",
          ],
          list: [
            "国内Web制作会社サイト2,486件のうち、AI検索に関係する6項目がすべてそろっていたのは10.4%（258件）、5項目以上は52.2%だった（Nurevo AEO 調査、2026年11月）。",
            "6項目中5項目がそろった国内Web制作会社サイトの94.9%は、欠けていた1項目が llms.txt だった（Nurevo AEO 調査、2026年11月）。",
            "国内Web制作会社サイトの6項目の平均は、WordPress で4.21点、WordPress 以外で2.14点だった（Nurevo AEO 調査、2026年11月）。",
            "海外のWeb制作会社サイト13,352件では、6項目すべてがそろったサイトが21.8%で、日本（10.4%）の約2倍だった（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "限界",
          list: [
            "6項目はこの調査のための単純な数で、項目の重みは同じにしています。どの項目がAIの回答にどれだけ効くかは示していません。",
            "トップページだけを見ています。下層ページの構造化データや canonical は見ていません。robots.txt はトップページ（/）に対する判定で、一部のディレクトリだけのブロックや、ファイアウォール・CDN によるブロックは数えていません。",
            "robots.txt が無いサイトは (4) を0点にしています。数え方を変えると、特に robots.txt を置かないことが多い WordPress 以外のサイトの点数は上がります。",
            "各サイト1回の取得です。HTTP 202 など、本来のページが取れていない可能性がある応答も到達に含めています（202を除いた値を併記）。",
            "llms.txt は有無だけで、中身の質は見ていません。型は JSON-LD のみで、microdata は数えていません。",
            "対象はWeb制作会社の自社サイトで、一般企業のサイト全体ではありません。国は当社の収集リストによるもので、各国の制作会社を無作為に抽出したものではありません。",
          ],
        },
        {
          heading: "当社の見方（意見）",
          paragraphs: [
            "ここからは事実ではなく当社の意見です。国内の制作会社サイトは、meta description・canonical・robots.txt といった基本はおおむねそろっており、差が出ているのは llms.txt と会社の型（Organization・LocalBusiness）でした。この2つはどちらも追加の作業で足せるものなので、点数を上げたい場合はまずそこから確かめるのがよいと考えます。ただし、どの項目を整えてもAIの回答に出ることが保証されるわけではありません（[別の調査](/guide/aeo-signals-ai-answers-study)では、サイト側の項目と登場の間に関係は見られませんでした）。",
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
        { q: "6項目とは何ですか？", a: "llms.txt がある、JSON-LD がある、Organization または LocalBusiness の型がある、robots.txt があり GPTBot・ClaudeBot・PerplexityBot・OAI-SearchBot を止めていない、meta description がある、canonical がある、の6つです。当てはまる数を0〜6点としました。Nurevo の0〜100点のスコアとは別物です。" },
        { q: "日本の制作会社サイトの平均は何点ですか？", a: "2,486件の平均は4.05点（中央値5点）でした。5点以上が52.2%、6点が10.4%です（2026年11月）。" },
        { q: "いちばん欠けている項目は？", a: "llms.txt です。日本の達成率は13.4%で、5点のサイト1,039件のうち94.9%は欠けている1項目が llms.txt でした。" },
        { q: "6点ならAIの回答に出ますか？", a: "保証はありません。この6項目はAIにサイトを読み取ってもらうための基本的な準備を数えたもので、回答に出るかどうかは質問や他の情報源にも左右されます。" },
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
      footnote: "調査：Nurevo AEO（Bestie.合同会社）。WordPress などの名称は各団体の商標です。個別の会社名・ドメインは公開しません。",
    },
    en: {
      title: "AI Search Readiness Scores: 15,838 Agency Sites | Nurevo",
      description: "15,838 web agency sites scored on 6 AI-search items. Japan averaged 4.05 and 10.4% met all 6 (21.8% elsewhere); 94.9% of Japan's 5/6 sites lacked only llms.txt.",
      h1: "How ready are websites for AI search? A 6-item score across 15,838 web agency sites (November 2026)",
      lead: "We scored the home pages of 15,838 web design agencies' own websites in Japan and other countries on six items related to AI search (llms.txt, JSON-LD, an organization type, robots.txt, meta description, canonical). The 2,486 Japanese sites averaged 4.05 of 6 and 52.2% scored 5 or more, but only 10.4% had all six. For 94.9% of the sites scoring 5, the missing item was llms.txt.",
      intro: [
        "Published 2026-11-15. Data aggregated 2026-11-12. Research by Nurevo AEO (Bestie.合同会社). Nurevo sells AI search optimization (AEO) tools and a WordPress plugin, and so has an interest in this topic.",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "Across 2,486 Japanese web agency sites, the average was 4.05 of 6 items (median 5). 52.2% (1,297) scored 5 or more and 10.4% (258) had all six. Across 13,352 agency sites outside Japan: average 3.83, 58.2% at 5+, 21.8% at 6/6.",
            "Of the 1,039 Japanese sites scoring exactly 5, 986 (94.9%) were missing llms.txt. Half of all Japanese sites (50.0%, 1,244) had every item except possibly llms.txt.",
            "WordPress made a large difference: Japanese WordPress sites averaged 4.21, non-WordPress sites (191) 2.14. Outside Japan WordPress sites averaged 4.87 and non-WordPress sites 0.61 (1.09 after excluding the many HTTP 202 responses in that group).",
          ],
        },
        {
          heading: "Method",
          list: [
            "Population: web design agencies' own websites — 3,352 in Japan (confirmed as agencies) and 20,335 in other countries, 23,687 in total. Not businesses in general.",
            "Reached: 15,838 home pages could be fetched (Japan 2,486, outside Japan 13,352). These are the base of this report.",
            "Fetched: each site's home page, /robots.txt, /llms.txt and /llms-full.txt, once each (User-Agent: NurevoSurvey/1.0), early November to 12 November 2026; aggregated 2026-11-12.",
            "The six items: (1) has an llms.txt (HTTP 200, not HTML, more than 20 characters); (2) the home page has JSON-LD; (3) the parseable JSON-LD has a type containing Organization or LocalBusiness; (4) a robots.txt exists and none of GPTBot, ClaudeBot, PerplexityBot or OAI-SearchBot is disallowed from the home page (/) (longest match); (5) a meta description of 10+ characters; (6) a canonical link. The score is the number of items met, 0–6. It is a simple count made for this survey, not Nurevo's 0–100 product score.",
            "Item (4) scores 0 when there is no robots.txt. Without one, crawling is generally not restricted, but this count gives the point only when a robots.txt is present and can be confirmed not to block those bots.",
            "HTTP 202: 1,477 home pages outside Japan (11.1% of those reached) answered with status 202, and 1,435 of them scored 0. These may be bot-check pages rather than the real page, so we also show figures excluding them. No Japanese site returned 202.",
            "Country is the country in our own collection list. Groups under 30 sites are not shown (country rows only for countries with 100+ reached sites).",
          ],
        },
        {
          heading: "Results: score distribution",
          paragraphs: [
            "In both Japan and elsewhere 5 is the most common score. In Japan more than four in ten sites (41.4%) sit at 2–4, while only 1.6% score 0. Outside Japan 6/6 is about twice as common as in Japan (21.8% vs 10.4%), but 19.6% score 0, giving two peaks; most of those zeros were HTTP 202 responses (see Method).",
          ],
          table: {
            head: ["Score", "Japan (sites)", "Japan (share)", "Outside Japan (sites)", "Outside Japan (share)"],
            rows: DIST,
            caption: "Japan 2,486 sites, outside Japan 13,352. Aggregated 2026-11-12.",
          },
        },
        {
          heading: "Average and spread by group",
          paragraphs: [
            "WordPress sites had a median of 5 in Japan and elsewhere. Non-WordPress sites in Japan had a median of 2, with 64.9% at 2 or below. These are co-occurrences; they do not show that WordPress causes the difference.",
          ],
          table: {
            head: ["Group", "Sites", "Average", "Median", "5 or more", "6", "2 or less"],
            rows: GROUPS.map(([, en, ...v]) => [en, ...v]),
            caption: "Rows marked excl. HTTP 202 drop the 1,477 overseas home pages that returned status 202 (none of them was identified as WordPress).",
          },
        },
        {
          heading: "Pass rate by item",
          paragraphs: [
            "In Japan the lowest item is llms.txt (13.4%), followed by an organization type (56.1%); meta description and robots.txt are above 90%. Among non-WordPress sites in Japan the robots.txt item is only 41.4%, mostly because no robots.txt was present (55.0%).",
          ],
          table: {
            head: ["Item", "Japan, all", "Japan, WordPress", "Japan, not WordPress", "Outside Japan, all", "Outside Japan (excl. 202)", "Outside Japan, WordPress"],
            rows: ITEMS.map(([, en, ...v]) => [en, ...v]),
            caption: "Share of reached sites in each group. Item (3) uses the @type of parseable JSON-LD (broken JSON-LD is not counted).",
          },
        },
        {
          heading: "The one item missing on 5/6 sites",
          paragraphs: [
            "Sites one item short of 6 were almost all missing llms.txt. Among the 380 Japanese sites scoring 4, 95.8% had no llms.txt and 67.6% had no organization type.",
          ],
          table: {
            head: ["Missing item", "Japan (sites)", "Japan (share)", "Outside Japan (sites)", "Outside Japan (share)"],
            rows: MISSING5.map(([, en, ...v]) => [en, ...v]),
            caption: "The single item missing on sites that scored exactly 5 (Japan 1,039, outside Japan 4,854). No site scored 5 by missing JSON-LD alone (without JSON-LD the type item also scores 0).",
          },
        },
        {
          heading: "By country",
          paragraphs: [
            "The 17 countries with 100+ reached sites. Counting every reached site, the highest averages were France (4.71), India (4.53) and Singapore (4.36). Many English-speaking countries have around a fifth of sites at 0; excluding HTTP 202 responses lifts their averages to 4.1–4.4. Japan (4.05) has few zeros (1.6%) but the lowest share of 6/6 sites among the 17 (10.4%).",
          ],
          table: {
            head: ["Country", "Reached", "Average", "5 or more", "6", "0", "HTTP 202", "Average (excl. 202)", "5 or more (excl. 202)"],
            rows: COUNTRY.map(([, en, ...v]) => [en, ...v]),
            caption: "Country is the country in our own collection list.",
          },
        },
        {
          heading: "Citing this survey",
          paragraphs: [
            "You may quote and republish the figures and tables freely, as long as you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. Sentences ready to quote:",
          ],
          list: [
            "Only 10.4% of 2,486 Japanese web agency websites met all six AI-search readiness items checked, while 52.2% met five or more (Nurevo AEO survey, November 2026).",
            "For 94.9% of Japanese web agency sites meeting five of six AI-search readiness items, the missing item was llms.txt (Nurevo AEO survey, November 2026).",
            "21.8% of 13,352 web agency websites outside Japan met all six AI-search readiness items, about twice the Japanese share of 10.4% (Nurevo AEO survey, November 2026).",
            "Web agency WordPress sites outside Japan averaged 4.87 of 6 AI-search readiness items; non-WordPress sites averaged 0.61 (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Limitations",
          list: [
            "The six items are a simple, equally weighted count made for this survey. They do not measure how much any item affects AI answers.",
            "Only the home page was examined; structured data and canonical links on inner pages were not. robots.txt was judged for / only; partial blocking and blocking by firewalls or CDNs were not counted.",
            "Item (4) scores 0 without a robots.txt. A different rule would raise scores, especially for non-WordPress sites, which more often have no robots.txt.",
            "One fetch per site. Responses that may not be the real page, such as HTTP 202, are counted as reached (figures excluding 202 are shown alongside).",
            "For llms.txt we checked only existence, not quality. Types come from JSON-LD only; microdata is not counted.",
            "The population is web design agencies' own websites, not businesses in general. Countries come from our collection list, not a random sample of each country's agencies.",
          ],
        },
        {
          heading: "Our reading (opinion)",
          paragraphs: [
            "What follows is our opinion, not a finding. Japanese agency sites mostly have the basics — meta description, canonical, robots.txt — and the gaps are in llms.txt and an organization type (Organization or LocalBusiness). Both can be added with some extra work, so they are where we would look first. None of this guarantees appearing in AI answers (in [another of our studies](/guide/aeo-signals-ai-answers-study), on-site signals showed no relationship with appearance).",
          ],
        },
        {
          heading: "Check your own or your clients' sites",
          paragraphs: [
            "The [free check](https://nurevo.jp/check) shows llms.txt, structured data and AI crawler access in about a minute. On WordPress, the [Nurevo WebMCP plugin](https://wordpress.org/plugins/nurevo-webmcp/) publishes an llms.txt and adds business facts to your structured data. Agencies that want to roll it out across client sites can see the [partner program](https://nurevo.jp/partner/).",
          ],
        },
      ],
      faqs: [
        { q: "What are the six items?", a: "Has an llms.txt; has JSON-LD; has an Organization or LocalBusiness type; has a robots.txt that does not block GPTBot, ClaudeBot, PerplexityBot or OAI-SearchBot; has a meta description; has a canonical link. The score is how many are met, 0–6. It is not Nurevo's 0–100 product score." },
        { q: "What is the average for Japanese agency sites?", a: "4.05 of 6 across 2,486 sites (median 5). 52.2% scored 5 or more and 10.4% scored 6 (November 2026)." },
        { q: "Which item is missing most often?", a: "llms.txt. Only 13.4% of Japanese sites had one, and for 94.9% of the 1,039 Japanese sites scoring 5 it was the missing item." },
        { q: "Does a score of 6 mean a site will appear in AI answers?", a: "No. The six items count basic preparation for AI systems to read a site; whether it appears in an answer also depends on the question and other sources." },
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
      footnote: "Research by Nurevo AEO (Bestie.合同会社). WordPress is a trademark of its owner. Individual companies and domains are not published.",
    },
  },
};
