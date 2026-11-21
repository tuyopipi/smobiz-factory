// Content page: research report (country report: India). AI search readiness
// of Indian web design agencies' own websites, compared with the US, the UK,
// Singapore, Japan and other overseas agencies. November 2026.
//
// Every number here comes from nurevo-outreach data/survey/raw_2026-11-12.json
// (survey.js; the same run as summary_2026-11-12.json — the Indian totals
// match summary.byCountry.IN: 1,554 reached, llms.txt 36.6%, JSON-LD 84.4%,
// WordPress 89.0%, AI bot blocked 5.8%, 6-item average 4.5). Country = the
// "co" field of our collection list (IN; 2,316 listed). Do not add a figure
// that is not in that data. The raw file holds company names and domains:
// never publish them. Definitions follow survey.js (see the US report).
// HTTP 202: only 23 Indian home pages answered 202 (US 671, UK 140), so no
// "excluding 202" column; HTTP-200-only values are given in the text.
// "Other overseas" = all non-Japan sites except India (11,798 reached).
// Country ranking = the 17 countries (Japan included) with 100+ reached sites.
// Groups under 30 sites are not shown (SEOPress: 4 Indian WordPress sites).
// Chi-square, India vs Japan / US / UK / other overseas: llms.txt, all 6,
// FAQPage, JSON-LD all p<0.001. India vs Singapore: llms.txt p=0.35, all 6
// p=0.25, FAQPage p=0.85. AI bot blocking: vs Japan p<0.001, vs US p=0.04,
// vs UK p=0.37, vs Singapore p=1.00, vs other overseas p=0.26.
// HTTP 200 only, India vs US: llms.txt 37.2% vs 27.2%, all 6 30.3% vs 22.3%
// (both p<0.001). WordPress only: India llms.txt 39.5%, US 30.1% (p<0.001).
// Hindi translation: src/content/research-in-web-agencies-ai-search-2026/hi.json

// [ja label, en label, India, US, UK, Singapore, Japan, other overseas (excl. India)]
const COMPARE = [
  ["到達件数", "Sites reached", "1,554", "4,472", "942", "641", "2,486", "11,798"],
  ["WordPress", "WordPress", "89.0%", "74.5%", "73.4%", "81.3%", "92.3%", "73.7%"],
  ["llms.txt", "llms.txt", "36.6%", "23.1%", "21.5%", "38.8%", "13.4%", "25.0%"],
  ["llms-full.txt", "llms-full.txt", "2.3%", "1.5%", "1.3%", "2.8%", "0.6%", "1.7%"],
  ["JSON-LD", "JSON-LD", "84.4%", "69.0%", "68.8%", "80.8%", "69.4%", "70.4%"],
  ["JSON-LD が壊れている（JSON-LD があるサイト中）", "Broken JSON-LD (of sites with JSON-LD)", "2.9%", "1.6%", "2.0%", "4.1%", "1.7%", "1.7%"],
  ["Organization系の型", "Organization-type", "76.3%", "59.4%", "59.6%", "73.3%", "58.9%", "61.9%"],
  ["FAQPage", "FAQPage", "14.5%", "6.2%", "8.0%", "15.0%", "3.9%", "8.7%"],
  ["microdata（schema.org）", "Microdata (schema.org)", "27.7%", "19.1%", "16.9%", "13.4%", "7.8%", "18.5%"],
  ["meta description", "Meta description", "82.9%", "68.0%", "69.3%", "81.6%", "90.7%", "69.9%"],
  ["Open Graph", "Open Graph", "83.4%", "69.1%", "69.1%", "80.3%", "81.3%", "71.0%"],
  ["canonical", "Canonical link", "89.0%", "74.3%", "72.7%", "82.2%", "84.6%", "74.7%"],
  ["robots.txt", "robots.txt", "90.5%", "76.1%", "74.2%", "85.2%", "91.8%", "76.8%"],
  ["AIボットをブロック（robots.txt があるサイト中）", "Blocks an AI bot (of sites with robots.txt)", "5.8%", "4.3%", "4.7%", "5.7%", "1.3%", "5.0%"],
  ["robots.txt でAIボットに言及", "robots.txt names an AI bot", "15.0%", "8.8%", "9.3%", "22.0%", "2.5%", "11.3%"],
  ["6項目の平均", "6-item average", "4.53", "3.65", "3.61", "4.36", "4.05", "3.73"],
  ["5項目以上", "5+ items", "70.4%", "54.6%", "55.1%", "69.7%", "52.2%", "56.5%"],
  ["6項目すべて", "All 6 items", "29.9%", "18.9%", "17.7%", "32.4%", "10.4%", "20.7%"],
];

// [ja name, en name, reached, llms.txt, all 6, 6-item average]  17 countries with 100+ reached sites, by llms.txt
const COUNTRIES = [
  ["シンガポール", "Singapore", "641", "38.8%", "32.4%", "4.36"],
  ["インド", "India", "1,554", "36.6%", "29.9%", "4.53"],
  ["ブラジル", "Brazil", "261", "34.1%", "25.3%", "4.11"],
  ["スペイン", "Spain", "248", "31.9%", "27.4%", "3.67"],
  ["フィリピン", "Philippines", "241", "31.5%", "27.0%", "4.27"],
  ["南アフリカ", "South Africa", "389", "29.3%", "24.4%", "3.90"],
  ["フランス", "France", "405", "26.4%", "24.0%", "4.71"],
  ["ニュージーランド", "New Zealand", "417", "25.4%", "20.9%", "3.80"],
  ["オーストラリア", "Australia", "1,719", "24.3%", "20.8%", "3.77"],
  ["オランダ", "Netherlands", "127", "23.6%", "18.9%", "3.66"],
  ["米国", "United States", "4,472", "23.1%", "18.9%", "3.65"],
  ["カナダ", "Canada", "908", "22.9%", "18.9%", "3.58"],
  ["英国", "United Kingdom", "942", "21.5%", "17.7%", "3.61"],
  ["メキシコ", "Mexico", "116", "20.7%", "18.1%", "3.06"],
  ["イタリア", "Italy", "110", "20.0%", "17.3%", "2.70"],
  ["アイルランド", "Ireland", "266", "19.5%", "17.3%", "3.28"],
  ["日本", "Japan", "2,486", "13.4%", "10.4%", "4.05"],
];

// [bot, India blocked, India %, US %, UK %, Singapore %, Japan %]  base = sites with robots.txt (India 1,406 / US 3,404 / UK 699 / Singapore 546 / Japan 2,281)
const BOTS = [
  ["Bytespider", "79", "5.6%", "4.1%", "4.7%", "6.0%", "1.1%"],
  ["CCBot", "77", "5.5%", "4.1%", "4.6%", "5.5%", "1.1%"],
  ["GPTBot", "72", "5.1%", "3.8%", "4.0%", "5.1%", "1.2%"],
  ["Google-Extended", "66", "4.7%", "3.6%", "4.1%", "4.6%", "1.1%"],
  ["ClaudeBot", "65", "4.6%", "3.5%", "4.1%", "5.1%", "1.0%"],
  ["Applebot-Extended", "59", "4.2%", "3.3%", "3.9%", "4.9%", "1.0%"],
  ["anthropic-ai", "59", "4.2%", "3.4%", "4.3%", "4.6%", "1.0%"],
  ["PerplexityBot", "6", "0.4%", "0.3%", "0.0%", "0.2%", "0.1%"],
  ["ChatGPT-User", "4", "0.3%", "0.4%", "0.0%", "0.0%", "0.1%"],
  ["OAI-SearchBot", "2", "0.1%", "0.3%", "0.1%", "0.2%", "0.0%"],
  ["Claude-SearchBot", "1", "0.1%", "0.3%", "0.0%", "0.2%", "0.0%"],
  ["Googlebot", "2", "0.1%", "0.1%", "0.0%", "0.0%", "0.0%"],
  ["Bingbot", "1", "0.1%", "0.1%", "0.0%", "0.0%", "0.0%"],
];

// [type, India, US, UK, Singapore, Japan]  share of reachable sites whose home page JSON-LD contains the @type
const TYPES = [
  ["WebSite", "76.9%", "65.7%", "66.2%", "71.5%", "63.0%"],
  ["Organization", "72.7%", "55.4%", "56.1%", "69.3%", "54.4%"],
  ["WebPage", "68.6%", "59.3%", "60.4%", "61.6%", "34.4%"],
  ["ImageObject", "68.1%", "54.5%", "55.0%", "60.2%", "38.3%"],
  ["SearchAction", "66.7%", "56.8%", "60.8%", "59.3%", "28.9%"],
  ["BreadcrumbList", "42.9%", "44.5%", "44.3%", "41.7%", "43.4%"],
  ["PostalAddress", "35.6%", "24.3%", "26.6%", "40.7%", "16.4%"],
  ["ContactPoint", "25.0%", "12.5%", "12.5%", "29.2%", "6.5%"],
  ["Person", "24.7%", "15.6%", "16.7%", "20.9%", "10.2%"],
  ["GeoCoordinates", "16.0%", "12.1%", "13.6%", "14.7%", "3.7%"],
  ["LocalBusiness", "15.2%", "12.2%", "10.5%", "13.9%", "5.4%"],
  ["FAQPage", "14.5%", "6.2%", "8.0%", "15.0%", "3.9%"],
  ["ProfessionalService", "12.7%", "10.1%", "12.1%", "11.2%", "5.6%"],
  ["Service", "11.1%", "6.6%", "6.7%", "11.4%", "3.5%"],
  ["AggregateRating", "10.9%", "4.6%", "5.2%", "12.2%", "0.2%"],
];

// [plugin, India WordPress sites (share), llms.txt count (share), JSON-LD, 6-item average]
const PLUGINS = [
  ["Yoast SEO", "590 (42.7%)", "221 (37.5%)", "99.0%", "5.02"],
  ["Rank Math", "414 (29.9%)", "191 (46.1%)", "99.5%", "5.36"],
  ["AIOSEO", "96 (6.9%)", "44 (45.8%)", "99.0%", "5.28"],
  ["検出なし / none detected", "279 (20.2%)", "89 (31.9%)", "65.9%", "4.08"],
];

// [score, India, US, UK, Singapore, Japan]
const DIST = [
  ["0", "7.5%", "22.1%", "23.6%", "13.9%", "1.6%"],
  ["1", "1.5%", "2.5%", "1.9%", "1.4%", "4.8%"],
  ["2", "4.6%", "4.3%", "4.2%", "2.3%", "10.7%"],
  ["3", "3.5%", "3.6%", "3.1%", "2.0%", "15.4%"],
  ["4", "12.6%", "12.8%", "12.1%", "10.6%", "15.3%"],
  ["5", "40.5%", "35.7%", "37.4%", "37.3%", "41.8%"],
  ["6", "29.9%", "18.9%", "17.7%", "32.4%", "10.4%"],
];

const HEAD_JA = ["項目", "インド", "米国", "英国", "シンガポール", "日本", "インド以外の海外"];
const HEAD_EN = ["Item", "India", "US", "UK", "Singapore", "Japan", "Other overseas"];

export default {
  slug: "research-in-web-agencies-ai-search-2026",
  targetQueries: [
    "インド Web制作会社 AI検索 対応状況 調査",
    "インド llms.txt 導入率",
    "Indian web design agencies AI search readiness survey",
    "llms.txt adoption India 2026",
    "Indian websites blocking AI crawlers robots.txt GPTBot",
  ],
  related: ["research-us-web-agencies-ai-search-2026", "research-uk-web-agencies-ai-search-2026", "research-au-web-agencies-ai-search-2026", "research-japan-web-agencies-ai-search-2026", "llms-txt"],
  locales: {
    ja: {
      title: "インドのWeb制作会社1,554社のAI検索対応を調査【2026年11月】 | Nurevo",
      description: "インドのWeb制作会社の自社サイト1,554件を調査。llms.txt は36.6%（日本13.4%・米国23.1%）、6項目すべて満たすサイトは29.9%で、到達100件以上の17か国中どちらも2位でした。",
      h1: "インドのWeb制作会社の自社サイト1,554件に見るAI検索への対応（2026年11月）",
      lead: "インドのWeb制作会社の自社サイト1,554件のトップページ・robots.txt・llms.txt を調べたところ、llms.txt があったのは36.6%（569件）で、日本（13.4%）の2.7倍、米国（23.1%）・英国（21.5%）より高い値でした。AI検索に関わる6項目をすべて満たすサイトは29.9%で、到達100件以上の17か国の中でシンガポールに次ぐ2位です。robots.txt でAIボットをブロックしていたのは5.8%で、GPTBot をブロックしていた72件のうち70件は ChatGPT の検索用ボット（OAI-SearchBot）をブロックしていませんでした。",
      intro: [
        "公開：2026年11月21日。データ：2026年11月12日集計。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策（AEO）のツールと WordPress プラグインを提供しており、この分野に利害があります。国別レポートの4本目です（これまでに[米国](/guide/research-us-web-agencies-ai-search-2026)・[英国](/guide/research-uk-web-agencies-ai-search-2026)・[オーストラリア](/guide/research-au-web-agencies-ai-search-2026)）。英語版とヒンディー語版もあります。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "インドのWeb制作会社の自社サイト1,554件のうち、llms.txt があったのは36.6%（569件）。日本（13.4%）の2.7倍で、米国（23.1%）・英国（21.5%）・インド以外の海外全体（25.0%）より高く（いずれも p<0.001）、シンガポール（38.8%）とは差が見られませんでした（p=0.35）。",
            "AI検索に関わる6項目をすべて満たすサイトは29.9%（464件）、6項目の平均は4.53でした。到達100件以上の17か国で比べると、llms.txt と「6項目すべて」はどちらもシンガポールに次ぐ2位です。JSON-LD は84.4%、FAQPage は14.5%（米国6.2%）でした。",
            "robots.txt があるサイト1,406件のうち、AIボットをブロックしていたのは5.8%（81件、日本1.3%・米国4.3%）。GPTBot をブロックしていた72件のうち70件は OAI-SearchBot を許可していました。検索用・質問時の取得に使われる4つのボットのどれかをブロックしていたのは7件（0.5%）でした。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "対象：Web制作会社の自社サイト。当社の収集リストで国がインドとなっている制作会社サイト2,316件のうち、トップページに到達できた1,554件です。一般企業のサイト全体ではありません。比較には同じ調査の米国（4,472件）・英国（942件）・シンガポール（641件）・日本（2,486件）・インド以外の海外（11,798件）を使いました。",
            "取得したもの：各サイトのトップページ、/robots.txt、/llms.txt、/llms-full.txt を1回ずつ（User-Agent：NurevoSurvey/1.0）。2026年11月上旬〜12日に取得し、11月12日に集計しました。",
            "判定方法：llms.txt は、ステータス200で中身がHTMLではなく20文字を超えるテキストを「あり」としました。JSON-LD はトップページにあるかどうか、「壊れている」は JSON として読み込めないブロックが1つ以上あるもの。Organization系は @type に Organization・LocalBusiness・Corporation・ProfessionalService を含むもの。WordPress はトップページのHTMLに wp-content/・wp-includes/、または generator の WordPress 表記があるもの。SEOプラグインはトップページのHTMLの文字列で判定しました。",
            "AIボットのブロック：robots.txt で、各ボットに当てはまるグループの規則がトップページ（/）を Disallow にするか（最長一致）で判定しました。分母は robots.txt があるサイトです。「AIボットをブロック」は GPTBot・ClaudeBot・PerplexityBot・Google-Extended・CCBot・OAI-SearchBot のどれかをブロックしているものです。",
            "「6項目」は、(1) llms.txt がある、(2) JSON-LD がある、(3) Organization または LocalBusiness の型がある、(4) robots.txt があり GPTBot・ClaudeBot・PerplexityBot・OAI-SearchBot のどれもブロックしていない、(5) meta description がある、(6) canonical がある、のうち当てはまる数（0〜6）です。この調査のための単純な数で、Nurevo の0〜100点のスコアとは別物です。",
            "HTTP 202：インドでトップページがステータス202を返したのは23件で、米国（671件）・英国（140件）より少数でした。202のページはほとんどの項目が「なし」になるため、米国・英国の値を押し下げています。ステータス200のサイトだけで比べても、llms.txt はインド37.2%・米国27.2%、「6項目すべて」は30.3%・22.3%で、どちらもインドが高い結果でした（p<0.001）。",
            "統計：インドと他の地域の差はカイ二乗検定で確かめました。30件未満の区分は載せていません。",
          ],
        },
        {
          heading: "結果：インドと米国・英国・シンガポール・日本の比較",
          paragraphs: [
            "インドの値は、ほぼすべての項目で米国・英国を上回りました。差が大きいのは llms.txt（36.6%・米国23.1%）、JSON-LD（84.4%・69.0%）、Organization系の型（76.3%・59.4%）、FAQPage（14.5%・6.2%）です。シンガポールとはほとんどの項目で近い値で、llms.txt・「6項目すべて」・FAQPage に統計的な差は見られませんでした。日本と比べると、meta description（82.9%・90.7%）と robots.txt（90.5%・91.8%）を除いてインドが高く、llms.txt は2.7倍、「6項目すべて」は2.9倍でした。microdata（schema.org）も27.7%で、比べた地域の中でいちばん高い値です。",
          ],
          table: {
            head: HEAD_JA,
            rows: COMPARE.map(([ja, , ...v]) => [ja, ...v]),
            caption: "Web制作会社の自社サイトで、トップページに到達できたもの。「AIボットをブロック」「AIボットに言及」の分母は robots.txt があるサイト（インド1,406件・米国3,404件・英国699件・シンガポール546件・日本2,281件・インド以外の海外9,064件）。2026年11月12日集計。",
          },
        },
        {
          heading: "17か国の中での位置",
          paragraphs: [
            "到達できたサイトが100件以上ある17か国（日本を含む）を llms.txt の割合で並べました。インドは llms.txt・「6項目すべて」・FAQPage（14.5%）でシンガポールに次ぐ2位、6項目の平均ではフランス（4.71）に次ぐ2位でした。上位には、シンガポール・インド・ブラジル・スペイン・フィリピンが並び、英語圏の米国・英国・カナダ・オーストラリアは中位、日本は最下位です。国ごとの件数は収集リストによるもので、各国の制作会社全体の分布ではありません。",
          ],
          table: {
            head: ["国", "到達件数", "llms.txt", "6項目すべて", "6項目の平均"],
            rows: COUNTRIES.map(([ja, , ...v]) => [ja, ...v]),
            caption: "到達できたサイトが100件以上の国。llms.txt の割合の高い順。2026年11月12日集計。",
          },
        },
        {
          heading: "ボット別のブロック率",
          paragraphs: [
            "インドで robots.txt があるサイト1,406件について、ボットごとにトップページをブロックしている割合です。学習用とされるボット（Bytespider・CCBot・GPTBot・Google-Extended・ClaudeBot・Applebot-Extended・anthropic-ai）は4.2〜5.6%で、米国・英国よりやや高く、シンガポールとほぼ同じ、日本の4〜5倍でした。検索用やユーザーの質問に答えるときに使われるボットは、PerplexityBot 6件、ChatGPT-User 4件、OAI-SearchBot 2件、Claude-SearchBot 1件です。Googlebot をブロックしていたサイトが2件、Bingbot は1件でした。AIボットのブロック率（5.8%）は、米国（4.3%）よりわずかに高く（p=0.04）、英国・シンガポール・インド以外の海外とは差が見られませんでした。",
          ],
          table: {
            head: ["ボット", "インド（件数）", "インド", "米国", "英国", "シンガポール", "日本"],
            rows: BOTS,
            caption: "分母は robots.txt があるサイト（インド1,406件・米国3,404件・英国699件・シンガポール546件・日本2,281件）。トップページ（/）に対する判定。",
          },
        },
        {
          heading: "ブロックの中身（事実）",
          list: [
            "GPTBot をブロックしていた72件のうち70件（97.2%）は、OAI-SearchBot をブロックしていませんでした。米国は128件中119件、英国は28件中28件、シンガポールは28件中27件です。",
            "上の11種のAIボットのどれかをブロックしていた93件のうち52件（55.9%）は、GPTBot・ClaudeBot・anthropic-ai・Google-Extended・CCBot・Bytespider・Applebot-Extended の7つをまとめてブロックする同じ組み合わせでした（米国58.5%・英国77.1%・シンガポール73.5%）。次に多いのは Bytespider だけをブロックするもの（11件）です。",
            "OAI-SearchBot・ChatGPT-User・Claude-SearchBot・PerplexityBot のどれかをブロックしていたのは7件（robots.txt があるサイトの0.5%）でした。",
            "robots.txt でAIボットの名前を挙げていながら、どれもトップページをブロックしていないサイトが119件ありました（robots.txt があるサイトの8.5%、米国4.4%）。",
            "AIボットをブロックしていた81件のうち31件（38.3%）には llms.txt もありました（米国34.0%）。",
          ],
        },
        {
          heading: "構造化データの型",
          paragraphs: [
            "トップページの JSON-LD に含まれる型は、インドでは WebSite（76.9%）と Organization（72.7%）が多く、どちらも比べた地域の中でいちばん高い値でした。所在地・連絡先を示す PostalAddress（35.6%）・ContactPoint（25.0%）、担当者などを示す Person（24.7%）、評価を示す AggregateRating（10.9%）は、米国・英国の1.3〜2.4倍で、シンガポールと近い値です。この調査では AggregateRating の中身（自社への評価か、どこから集めた評価か）は見ていません。JSON-LD があるサイトのうち、JSON として読み込めないブロックがあったのは2.9%（38件）でした。",
          ],
          table: {
            head: ["@type", "インド", "米国", "英国", "シンガポール", "日本"],
            rows: TYPES,
            caption: "到達できたサイトのうち、トップページの JSON-LD にその型があった割合（入れ子の型も数えます）。インド1,554件・米国4,472件・英国942件・シンガポール641件・日本2,486件。",
          },
        },
        {
          heading: "WordPress とSEOプラグイン",
          paragraphs: [
            "インドの制作会社サイトの89.0%（1,383件）が WordPress で、米国（74.5%）・英国（73.4%）より高く、日本（92.3%）に近い値でした。WordPress のサイトは llms.txt 39.5%、JSON-LD 92.5%、6項目の平均4.95 で、WordPress 以外（171件、うち23件が202）は llms.txt 13.5%、JSON-LD 18.7%、平均1.17 でした。WordPress のサイトどうしで比べても、llms.txt はインド39.5%・米国30.1%・日本14.0%で、インドが高い結果です（対米国 p<0.001）。",
            "SEOプラグインは Yoast SEO が42.7%、Rank Math が29.9%、AIOSEO が6.9%でした。Rank Math の割合は、米国（18.0%）・英国（20.7%）・オーストラリア（22.8%）より高めです。llms.txt があった割合は Rank Math 46.1%、AIOSEO 45.8%、Yoast SEO 37.5%、プラグインを検出できなかったサイト31.9%でした。この調査では llms.txt をプラグインで作ったのか手で置いたのかは見ていません。SEOPress（4件）は30件未満のため表に載せていません。",
          ],
          table: {
            head: ["SEOプラグイン", "インドの WordPress サイト", "llms.txt", "JSON-LD", "6項目の平均"],
            rows: PLUGINS,
            caption: "インドの WordPress サイト1,383件。プラグインはトップページのHTMLの文字列で判定（Yoast → Rank Math → AIOSEO → SEOPress の順に最初に当てはまったもの）。30件未満の区分は省略。",
          },
        },
        {
          heading: "6項目の分布",
          paragraphs: [
            "インドは「5項目」（40.5%）と「6項目」（29.9%）で7割を占めました。「0項目」は7.5%で、202を返したサイトが多い米国（22.1%）・英国（23.6%）より少なめです。日本は3〜4項目の層が厚く（合わせて30.7%）、インドの同じ層は16.1%でした。",
          ],
          table: {
            head: ["当てはまる項目数", "インド", "米国", "英国", "シンガポール", "日本"],
            rows: DIST,
            caption: "到達できたサイトに占める割合。インド1,554件、米国4,472件、英国942件、シンガポール641件、日本2,486件。",
          },
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "この調査の数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。そのまま使える1文：",
          ],
          list: [
            "インドのWeb制作会社の自社サイトの36.6%に llms.txt があった（日本13.4%、米国23.1%、英国21.5%）（Nurevo AEO 調査、2026年11月、1,554件）。",
            "インドのWeb制作会社の自社サイトで、AI検索に関わる6項目をすべて満たしていたのは29.9%で、到達100件以上の17か国中2位だった（Nurevo AEO 調査、2026年11月）。",
            "インドのWeb制作会社の自社サイトの84.4%がトップページに JSON-LD の構造化データを置いていた（米国69.0%、日本69.4%）（Nurevo AEO 調査、2026年11月）。",
            "インドのWeb制作会社で GPTBot をブロックしていた72件のうち70件は、ChatGPT の検索用ボット OAI-SearchBot を許可していた（Nurevo AEO 調査、2026年11月）。",
            "インドのWeb制作会社の WordPress サイトの42.7%で Yoast SEO、29.9%で Rank Math が検出された（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "限界",
          list: [
            "対象はWeb制作会社の自社サイトで、一般企業のサイト全体ではありません。国は当社の収集リストの記載によるもので、インドの制作会社全体を代表する標本ではありません。ボット別の件数などは小さい数です。",
            "トップページだけを見ています。robots.txt はトップページ（/）に対する判定で、一部のディレクトリだけのブロックや、ファイアウォール・CDN によるブロックは数えていません。llms.txt は有無だけを見て、中身の質は見ていません。",
            "各サイト1回の取得で、到達できなかったサイト（762件）は除いています。HTTP 202 を返した23件は、実際のトップページとは違うページを見ている可能性があります。",
            "SEOプラグインはHTMLの文字列による判定で、痕跡を消している場合や複数入っている場合は正しく分けられません。",
            "今回の集計の一部には11月5日集計時の取得分を引き継いでいます。",
          ],
        },
        {
          heading: "当社の見方（意見）",
          paragraphs: [
            "ここからは事実ではなく当社の意見です。インドの制作会社サイトは、llms.txt・構造化データ・FAQPage のどれもが米国・英国より多く、AI検索向けの新しい項目を早く取り入れている様子がうかがえます。WordPress の割合が高く、Rank Math のように llms.txt を出せるプラグインの割合も高いことが、一因かもしれません（この調査では因果は確かめていません）。AIボットのブロックは少数で、ブロックしているサイトもほとんどが学習用のボットに限っていました。どのボットを止めるかは各社の判断ですが、AI検索に出たい場合は、検索用のボットまで止めていないかを確かめる価値があります。どれを整えてもAIの回答に出ることが保証されるわけではありません（[別の調査](/guide/aeo-signals-ai-answers-study)では、サイト側の項目と登場の間に関係は見られませんでした）。",
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
        { q: "インドの制作会社はAI検索への対応が進んでいますか？", a: "比べた17か国の中では上位です。llms.txt（36.6%）と「6項目すべて」（29.9%）はシンガポールに次ぐ2位で、米国（23.1%・18.9%）や日本（13.4%・10.4%）より高い値でした（2026年11月、Web制作会社の自社サイト）。" },
        { q: "米国で202を返すサイトが多いことが差の原因ではありませんか？", a: "一部は影響しますが、ステータス200のサイトだけで比べても llms.txt はインド37.2%・米国27.2%、「6項目すべて」は30.3%・22.3%で、インドが高い結果でした（p<0.001）。" },
        { q: "インドではAIクローラーをブロックしているサイトが多いですか？", a: "robots.txt があるサイトの5.8%で、日本（1.3%）・米国（4.3%）よりやや多いものの少数でした。ほとんどは学習用のボットで、検索用・質問時の取得に使われる4つのボットのどれかをブロックしていたのは7件（0.5%）です。" },
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
      title: "AI Search Readiness of 1,554 Indian Web Agency Websites (2026) | Nurevo",
      description: "1,554 Indian web agency sites: 36.6% have an llms.txt (US 23.1%, Japan 13.4%) and 29.9% meet all six AI search items: second of 17 countries on both. 5.8% block AI bots.",
      h1: "AI search readiness of Indian web design agencies: 1,554 agency websites (November 2026)",
      lead: "We fetched the home page, robots.txt and llms.txt of 1,554 Indian web design agencies' own websites. 36.6% (569) had an llms.txt — 2.7 times Japan (13.4%) and well above the US (23.1%) and the UK (21.5%). 29.9% met all six AI-search items we checked, second only to Singapore among the 17 countries with at least 100 sites in our survey. 5.8% of sites with a robots.txt blocked an AI bot, and 70 of the 72 sites blocking GPTBot still allowed OpenAI's search crawler, OAI-SearchBot.",
      intro: [
        "Published 2026-11-21. Data aggregated 2026-11-12. Research by Nurevo AEO (Bestie.合同会社), Japan. Nurevo sells AI search optimisation (AEO) tools and a WordPress plugin, and so has an interest in this topic. This is the fourth of our country reports (after the [United States](/guide/research-us-web-agencies-ai-search-2026), the [United Kingdom](/guide/research-uk-web-agencies-ai-search-2026) and [Australia](/guide/research-au-web-agencies-ai-search-2026)). A Hindi version is also available.",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "36.6% (569) of 1,554 Indian web agency websites had an llms.txt — 2.7 times Japan (13.4%) and higher than the US (23.1%), the UK (21.5%) and all overseas sites outside India (25.0%) (all p < 0.001). It was not statistically different from Singapore (38.8%, p = 0.35).",
            "29.9% (464) of Indian sites met all six AI-search items we checked, with an average of 4.53. Among the 17 countries with 100+ sites, India ranked second (after Singapore) on both llms.txt and all six items. JSON-LD appeared on 84.4% of home pages and FAQPage on 14.5% (US 6.2%).",
            "Of 1,406 Indian sites with a robots.txt, 5.8% (81) blocked an AI bot (Japan 1.3%, US 4.3%). 70 of the 72 sites blocking GPTBot allowed OAI-SearchBot. Only 7 sites (0.5%) blocked any of the four bots used for search or for fetching pages when a user asks.",
          ],
        },
        {
          heading: "Method",
          list: [
            "Population: web design agencies' own websites. Of 2,316 agency sites listed as Indian in our collection list, 1,554 home pages could be reached. This is not a sample of Indian businesses in general. For comparison we use the same survey's US (4,472), UK (942), Singapore (641), Japan (2,486) and all overseas sites outside India (11,798).",
            "Fetched: each site's home page, /robots.txt, /llms.txt and /llms-full.txt, once each (User-Agent: NurevoSurvey/1.0), early November to 12 November 2026; aggregated 2026-11-12.",
            "Classification: llms.txt = HTTP 200, not HTML, more than 20 characters. JSON-LD = present on the home page; \"broken\" = at least one block that does not parse as JSON. Organization-type = an @type of Organization, LocalBusiness, Corporation or ProfessionalService. WordPress = the home page HTML contains wp-content/ or wp-includes/, or a WordPress generator tag. SEO plugins were identified from strings in the home page HTML.",
            "AI bot blocking: whether the robots.txt rules that apply to each bot disallow the home page (/) (longest match); the base is sites with a robots.txt. \"Blocks an AI bot\" = blocks any of GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot or OAI-SearchBot.",
            "The six items: (1) has an llms.txt; (2) has JSON-LD; (3) has an Organization or LocalBusiness type; (4) has a robots.txt that blocks none of GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot; (5) has a meta description; (6) has a canonical link. The count (0–6) is a simple measure made for this survey, not Nurevo's 0–100 product score.",
            "HTTP 202: only 23 Indian home pages answered with status 202, compared with 671 in the US and 140 in the UK. Such pages fail almost every item and pull the US and UK figures down. Comparing HTTP 200 sites only, India still leads the US on llms.txt (37.2% vs 27.2%) and on all six items (30.3% vs 22.3%) (both p < 0.001).",
            "Statistics: differences between India and other groups were tested with chi-square tests. Groups with fewer than 30 sites are not shown.",
          ],
        },
        {
          heading: "Results: India compared with the US, the UK, Singapore and Japan",
          paragraphs: [
            "India was above the US and the UK on almost every item. The largest gaps were llms.txt (36.6% vs 23.1% in the US), JSON-LD (84.4% vs 69.0%), Organization-type markup (76.3% vs 59.4%) and FAQPage (14.5% vs 6.2%). India and Singapore were close on most items, with no statistically significant difference on llms.txt, all six items or FAQPage. Compared with Japan, India was higher on everything except meta descriptions (82.9% vs 90.7%) and robots.txt (90.5% vs 91.8%): 2.7 times on llms.txt and 2.9 times on all six items. India also had the highest share of schema.org microdata (27.7%) of the groups compared.",
          ],
          table: {
            head: HEAD_EN,
            rows: COMPARE.map(([, en, ...v]) => [en, ...v]),
            caption: "Web design agencies' own websites whose home page could be reached. \"Blocks an AI bot\" and \"names an AI bot\" are shares of sites with a robots.txt (India 1,406; US 3,404; UK 699; Singapore 546; Japan 2,281; other overseas 9,064). Aggregated 2026-11-12.",
          },
        },
        {
          heading: "Where India stands among 17 countries",
          paragraphs: [
            "The 17 countries (Japan included) with at least 100 reachable sites, sorted by llms.txt. India ranked second after Singapore on llms.txt, on all six items and on FAQPage (14.5%), and second after France (4.71) on the six-item average. Singapore, India, Brazil, Spain and the Philippines lead; the US, the UK, Canada and Australia sit in the middle; Japan is last. Country counts reflect our collection list, not the size of each country's agency market.",
          ],
          table: {
            head: ["Country", "Sites reached", "llms.txt", "All 6 items", "6-item average"],
            rows: COUNTRIES.map(([, en, ...v]) => [en, ...v]),
            caption: "Countries with 100+ reachable sites, sorted by llms.txt share. Aggregated 2026-11-12.",
          },
        },
        {
          heading: "Blocking by bot",
          paragraphs: [
            "Share of the 1,406 Indian sites with a robots.txt that block each bot from the home page. Crawlers generally described as training crawlers (Bytespider, CCBot, GPTBot, Google-Extended, ClaudeBot, Applebot-Extended, anthropic-ai) were blocked by 4.2–5.6% — a little above the US and the UK, about the same as Singapore, and four to five times Japan. Among bots used for search or for fetching pages when a user asks, PerplexityBot was blocked by 6 sites, ChatGPT-User by 4, OAI-SearchBot by 2 and Claude-SearchBot by 1. Two sites blocked Googlebot and one blocked Bingbot. India's overall AI-bot blocking rate (5.8%) was slightly higher than the US (4.3%, p = 0.04) and not different from the UK, Singapore or other overseas sites.",
          ],
          table: {
            head: ["Bot", "India (sites)", "India", "US", "UK", "Singapore", "Japan"],
            rows: BOTS,
            caption: "Base: sites with a robots.txt (India 1,406; US 3,404; UK 699; Singapore 546; Japan 2,281). Judged for the home page (/).",
          },
        },
        {
          heading: "What the blocking looks like (facts)",
          list: [
            "70 of the 72 sites blocking GPTBot (97.2%) did not block OAI-SearchBot. The figure was 119 of 128 in the US, 28 of 28 in the UK and 27 of 28 in Singapore.",
            "Of the 93 sites blocking any of the 11 AI bots above, 52 (55.9%) used the same combination: GPTBot, ClaudeBot, anthropic-ai, Google-Extended, CCBot, Bytespider and Applebot-Extended, all seven together (US 58.5%, UK 77.1%, Singapore 73.5%). The next most common was Bytespider alone (11 sites).",
            "7 sites (0.5% of those with a robots.txt) blocked any of OAI-SearchBot, ChatGPT-User, Claude-SearchBot or PerplexityBot.",
            "119 sites (8.5% of those with a robots.txt; US 4.4%) named an AI bot in robots.txt but blocked none from the home page.",
            "31 of the 81 sites blocking an AI bot (38.3%) also had an llms.txt (US 34.0%).",
          ],
        },
        {
          heading: "Structured data types",
          paragraphs: [
            "In India, WebSite (76.9%) and Organization (72.7%) were the most common @types in home page JSON-LD, both the highest of the groups compared. Types that state an address or contact details — PostalAddress (35.6%) and ContactPoint (25.0%) — as well as Person (24.7%) and AggregateRating (10.9%) were 1.3 to 2.4 times as common as in the US and the UK, and close to Singapore. We did not examine what the AggregateRating values refer to or where the ratings come from. Of Indian sites with JSON-LD, 2.9% (38) had at least one block that did not parse.",
          ],
          table: {
            head: ["@type", "India", "US", "UK", "Singapore", "Japan"],
            rows: TYPES,
            caption: "Share of reachable sites whose home page JSON-LD contains the type (nested types included). India 1,554; US 4,472; UK 942; Singapore 641; Japan 2,486.",
          },
        },
        {
          heading: "WordPress and SEO plugins",
          paragraphs: [
            "89.0% (1,383) of Indian agency sites ran WordPress — more than the US (74.5%) and the UK (73.4%), and close to Japan (92.3%). WordPress sites had llms.txt 39.5%, JSON-LD 92.5% and a 6-item average of 4.95; non-WordPress sites (171, of which 23 answered 202) had llms.txt 13.5%, JSON-LD 18.7% and an average of 1.17. Comparing WordPress sites only, llms.txt was 39.5% in India, 30.1% in the US and 14.0% in Japan (India vs US p < 0.001).",
            "Among WordPress sites, Yoast SEO was detected on 42.7%, Rank Math on 29.9% and AIOSEO on 6.9%. Rank Math's share is higher than in the US (18.0%), the UK (20.7%) and Australia (22.8%). llms.txt adoption: Rank Math 46.1%, AIOSEO 45.8%, Yoast SEO 37.5%, no plugin detected 31.9%. We did not check whether the llms.txt was generated by a plugin or added by hand. SEOPress (4 sites) is below our 30-site threshold and not shown.",
          ],
          table: {
            head: ["SEO plugin", "India WordPress sites", "llms.txt", "JSON-LD", "6-item average"],
            rows: PLUGINS,
            caption: "1,383 Indian WordPress sites. Plugin = the first match in the home page HTML in the order Yoast → Rank Math → AIOSEO → SEOPress. Groups under 30 sites omitted.",
          },
        },
        {
          heading: "Distribution of the six items",
          paragraphs: [
            "Seven in ten Indian sites met five (40.5%) or all six (29.9%) items. Only 7.5% met none — fewer than the US (22.1%) and the UK (23.6%), where many zeros are HTTP 202 pages. Japan has a thicker middle (3–4 items, 30.7% combined) where India has 16.1%.",
          ],
          table: {
            head: ["Items met", "India", "US", "UK", "Singapore", "Japan"],
            rows: DIST,
            caption: "Share of reachable sites. India 1,554; US 4,472; UK 942; Singapore 641; Japan 2,486.",
          },
        },
        {
          heading: "Citing this survey",
          paragraphs: [
            "You may quote and republish the figures and tables freely, as long as you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. Sentences ready to quote:",
          ],
          list: [
            "36.6% of Indian web design agencies' own websites had an llms.txt file, compared with 23.1% in the US, 21.5% in the UK and 13.4% in Japan (Nurevo AEO survey, November 2026, 1,554 Indian sites).",
            "29.9% of Indian web agency websites met all six AI-search readiness items checked, second among 17 countries surveyed (Nurevo AEO survey, November 2026).",
            "84.4% of Indian web agency websites had JSON-LD structured data on their home page, compared with 69.0% in the US (Nurevo AEO survey, November 2026).",
            "70 of the 72 Indian web agency websites that blocked GPTBot still allowed OpenAI's search crawler OAI-SearchBot (Nurevo AEO survey, November 2026).",
            "Yoast SEO was detected on 42.7% of Indian web agencies' WordPress sites and Rank Math on 29.9% (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Limitations",
          list: [
            "The population is web design agencies' own websites, not businesses in general. Country comes from our collection list, and the sample is not representative of all Indian agencies. Counts such as per-bot blocking are small numbers.",
            "Only the home page was examined. robots.txt was judged for / only; partial blocking and blocking by firewalls or CDNs were not counted. For llms.txt we checked only whether it exists, not its quality.",
            "One fetch per site; unreachable sites (762) are excluded. The 23 HTTP 202 responses may not reflect the real home page.",
            "SEO plugins were detected from HTML strings; sites that hide plugin markers or run several plugins may be misclassified.",
            "Part of this aggregation reuses fetches from the 5 November run.",
          ],
        },
        {
          heading: "Our reading (opinion)",
          paragraphs: [
            "What follows is our opinion, not a finding. Indian agency sites carry more llms.txt files, structured data and FAQPage markup than US or UK ones, which suggests they are quick to adopt new AI-search items. The high share of WordPress, and of plugins such as Rank Math that can publish an llms.txt, may be part of the reason (this survey does not test cause). AI bot blocking is a minority practice, and where it happens it is almost always limited to training crawlers. Which bots to block is each site owner's decision, but sites that want to appear in AI search may want to confirm they are not blocking search crawlers by accident. None of this guarantees appearing in AI answers (in [another of our studies](/guide/aeo-signals-ai-answers-study), on-site signals showed no relationship with appearance).",
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
        { q: "Are Indian agencies ahead on AI search readiness?", a: "Among the 17 countries we compared, yes. India ranked second after Singapore on llms.txt (36.6%) and on meeting all six items (29.9%), above the US (23.1%, 18.9%) and Japan (13.4%, 10.4%) (November 2026, agencies' own websites)." },
        { q: "Isn't the gap with the US just HTTP 202 pages?", a: "They explain part of it, but comparing HTTP 200 sites only, India still leads on llms.txt (37.2% vs 27.2%) and all six items (30.3% vs 22.3%) (p < 0.001)." },
        { q: "Do many Indian sites block AI crawlers?", a: "5.8% of sites with a robots.txt — a little more than the US (4.3%) and Japan (1.3%), but a small minority. Most blocking targets training crawlers: only 7 sites (0.5%) blocked any of OAI-SearchBot, ChatGPT-User, Claude-SearchBot or PerplexityBot." },
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
