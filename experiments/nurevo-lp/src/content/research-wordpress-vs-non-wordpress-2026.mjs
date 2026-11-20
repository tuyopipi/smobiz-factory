// Content page: research report. WordPress vs non-WordPress web agency
// websites — AI search readiness item by item, Japan and overseas. Nov 2026.
//
// Every number here comes from nurevo-outreach data/survey/raw_2026-11-12.json
// (survey.js; the same run as summary_2026-11-12.json — the Japan WordPress /
// non-WordPress and overseas WordPress totals match summary.japanWP,
// summary.japanNonWP and summary.intlWP). Figures were computed with
// survey.js summarize() on each group. Do not add a figure that is not in that
// data. The raw file holds company names and domains: never publish them.
// WordPress = home page HTML contains wp-content/ or wp-includes/ or a
// WordPress generator tag (survey.js home()).
// "Non-WordPress (excl. 202)": 1,477 overseas non-WordPress home pages answered
// HTTP 202 (no viewport, JSON-LD or WordPress markers; Japan had 0). They are
// excluded from the main non-WordPress columns; overseas incl. 202 is in the text.
// Tests: chi-square; Japan non-WordPress (191 / 86 with robots.txt) uses Fisher.
// Japan WP vs non-WP: llms.txt p=0.002, JSON-LD p<0.001, robots.txt p<0.001,
// AI bot blocking p<0.001, all 6 p=0.006, FAQPage p=0.73.
// Overseas WP vs non-WP (excl. 202): all items above p<0.001.
// Japan WP vs overseas WP: llms.txt, JSON-LD, all 6 p<0.001.
// Japan non-WP vs overseas non-WP (excl. 202): llms.txt p=0.11, all 6 p=1.00,
// blocking p=0.31.

// [ja label, en label, WP all, non-WP all excl. 202, Japan WP, Japan non-WP, overseas WP, overseas non-WP excl. 202]
const COMPARE = [
  ["到達件数", "Sites reached", "12,376", "1,985", "2,295", "191", "10,081", "1,794"],
  ["llms.txt", "llms.txt", "29.6%", "9.8%", "14.0%", "6.3%", "33.1%", "10.1%"],
  ["llms-full.txt", "llms-full.txt", "1.8%", "1.4%", "0.5%", "1.0%", "2.1%", "1.4%"],
  ["JSON-LD", "JSON-LD", "88.8%", "17.6%", "72.9%", "28.3%", "92.5%", "16.4%"],
  ["JSON-LD が壊れている（JSON-LD があるサイト中）", "Broken JSON-LD (of sites with JSON-LD)", "1.8%", "1.4%", "1.7%", "1.9%", "1.9%", "1.4%"],
  ["Organization系の型", "Organization-type", "77.8%", "16.1%", "61.8%", "23.6%", "81.5%", "15.3%"],
  ["FAQPage", "FAQPage", "10.1%", "5.1%", "3.9%", "3.1%", "11.4%", "5.3%"],
  ["マイクロデータ（schema.org）", "Microdata (schema.org)", "22.5%", "1.1%", "8.3%", "1.6%", "25.8%", "1.1%"],
  ["meta description", "Meta description", "91.2%", "25.5%", "91.9%", "76.4%", "91.1%", "20.1%"],
  ["Open Graph", "Open Graph", "91.0%", "21.9%", "84.0%", "49.7%", "92.5%", "18.9%"],
  ["canonical", "Canonical link", "96.1%", "20.9%", "88.1%", "42.9%", "97.9%", "18.6%"],
  ["robots.txt", "robots.txt", "96.6%", "36.7%", "95.6%", "45.0%", "96.9%", "35.8%"],
  ["robots.txt に Sitemap 行（robots.txt があるサイト中）", "Sitemap line in robots.txt (of sites with robots.txt)", "88.5%", "79.7%", "93.2%", "73.3%", "87.4%", "80.6%"],
  ["AIボットをブロック（robots.txt があるサイト中）", "Blocks an AI bot (of sites with robots.txt)", "3.7%", "13.3%", "1.0%", "9.3%", "4.3%", "13.8%"],
  ["robots.txt でAIボットに言及", "robots.txt names an AI bot", "9.0%", "24.3%", "2.1%", "11.6%", "10.6%", "26.0%"],
  ["6項目の平均", "6-item average", "4.75", "1.19", "4.21", "2.14", "4.87", "1.09"],
  ["5項目以上", "5+ items", "71.2%", "12.3%", "55.4%", "13.1%", "74.8%", "12.3%"],
  ["6項目すべて", "All 6 items", "24.9%", "4.7%", "10.8%", "4.7%", "28.0%", "4.7%"],
];

// [bot, Japan WP, Japan non-WP, overseas WP, overseas non-WP excl. 202]  "% (sites)"
// base = sites with robots.txt (2,195 / 86 / 9,764 / 643)
const BOTS = [
  ["Bytespider", "0.8%（18）", "8.1%（7）", "4.0%（393）", "14.2%（91）"],
  ["CCBot", "0.8%（18）", "8.1%（7）", "4.1%（401）", "13.8%（89）"],
  ["GPTBot", "1.0%（21）", "8.1%（7）", "3.7%（363）", "13.2%（85）"],
  ["ClaudeBot", "0.7%（16）", "7.0%（6）", "3.4%（334）", "13.1%（84）"],
  ["Google-Extended", "0.8%（18）", "8.1%（7）", "3.4%（334）", "13.1%（84）"],
  ["anthropic-ai", "0.8%（17）", "7.0%（6）", "3.2%（310）", "12.6%（81）"],
  ["Applebot-Extended", "0.7%（16）", "7.0%（6）", "3.2%（315）", "12.3%（79）"],
  ["ChatGPT-User", "0.1%（2）", "0.0%（0）", "0.3%（26）", "0.8%（5）"],
  ["PerplexityBot", "0.1%（2）", "0.0%（0）", "0.2%（24）", "0.8%（5）"],
  ["OAI-SearchBot", "0.0%（0）", "0.0%（0）", "0.2%（19）", "0.3%（2）"],
  ["Claude-SearchBot", "0.0%（0）", "0.0%（0）", "0.2%（16）", "0.3%（2）"],
  ["Googlebot", "0.0%（0）", "0.0%（0）", "0.1%（8）", "0.2%（1）"],
  ["Bingbot", "0.0%（0）", "0.0%（0）", "0.1%（8）", "0.2%（1）"],
];

// [type, WP all, non-WP all excl. 202, Japan WP, Japan non-WP, overseas WP, overseas non-WP excl. 202]
const TYPES = [
  ["WebSite", "84.0%", "12.5%", "66.8%", "16.8%", "87.9%", "12.0%"],
  ["Organization", "73.6%", "10.9%", "57.6%", "15.7%", "77.2%", "10.4%"],
  ["WebPage", "71.5%", "6.0%", "36.8%", "5.2%", "79.4%", "6.1%"],
  ["SearchAction", "68.7%", "2.9%", "31.2%", "1.6%", "77.2%", "3.0%"],
  ["ImageObject", "68.7%", "6.2%", "40.8%", "8.4%", "75.0%", "6.0%"],
  ["BreadcrumbList", "54.6%", "2.3%", "46.8%", "3.1%", "56.4%", "2.2%"],
  ["PostalAddress", "31.4%", "13.0%", "16.1%", "19.9%", "34.8%", "12.3%"],
  ["Person", "20.7%", "5.0%", "10.7%", "3.7%", "22.9%", "5.2%"],
  ["LocalBusiness", "13.7%", "4.5%", "5.5%", "4.7%", "15.5%", "4.5%"],
  ["ProfessionalService", "12.7%", "7.4%", "5.4%", "7.3%", "14.4%", "7.4%"],
  ["Article", "10.7%", "0.5%", "2.7%", "0.5%", "12.6%", "0.5%"],
  ["FAQPage", "10.1%", "5.1%", "3.9%", "3.1%", "11.4%", "5.3%"],
];

// [score, Japan WP, Japan non-WP, overseas WP, overseas non-WP excl. 202]
const DIST = [
  ["0", "0.1%", "19.4%", "0.1%", "65.7%"],
  ["1", "3.3%", "23.0%", "0.7%", "11.4%"],
  ["2", "9.7%", "22.5%", "4.6%", "4.4%"],
  ["3", "15.7%", "12.0%", "3.9%", "2.6%"],
  ["4", "15.7%", "9.9%", "15.8%", "3.7%"],
  ["5", "44.6%", "8.4%", "46.8%", "7.6%"],
  ["6", "10.8%", "4.7%", "28.0%", "4.7%"],
];

const HEAD_JA = ["項目", "WordPress（全体）", "WordPress以外（全体・202除く）", "日本 WordPress", "日本 WordPress以外", "海外 WordPress", "海外 WordPress以外（202除く）"];
const HEAD_EN = ["Item", "WordPress (all)", "Non-WordPress (all, excl. 202)", "Japan WordPress", "Japan non-WordPress", "Overseas WordPress", "Overseas non-WordPress (excl. 202)"];

export default {
  slug: "research-wordpress-vs-non-wordpress-2026",
  targetQueries: [
    "WordPress 非WordPress AI検索 対応 比較 調査",
    "WordPress以外 サイト llms.txt 構造化データ 導入率",
    "Web制作会社 WordPress 割合 調査 2026",
    "WordPress vs non-WordPress AI search readiness survey",
    "non-WordPress websites structured data llms.txt adoption 2026",
  ],
  related: ["research-wordpress-seo-plugins-2026", "research-ai-readiness-score-distribution-2026", "research-japan-web-agencies-ai-search-2026", "aeo-for-wordpress", "llms-txt"],
  locales: {
    ja: {
      title: "WordPressと非WordPressのAI検索対応比較【制作会社14,361件】 | Nurevo",
      description: "Web制作会社の自社サイトを WordPress とそれ以外に分けて調査。JSON-LD は88.8%と17.6%、llms.txt は29.6%と9.8%、AIボットのブロックは3.7%と13.3%。日本と海外の結果を掲載。",
      h1: "WordPress と WordPress 以外で比べたAI検索への対応：Web制作会社の自社サイト14,361件（2026年11月）",
      lead: "Web制作会社の自社サイトのうち、トップページが通常どおり（HTTP 200）返った14,361件を WordPress（12,376件）とそれ以外（1,985件）に分けて比べました。トップページに構造化データ（JSON-LD）があったのは WordPress で88.8%、それ以外で17.6%、llms.txt は29.6%と9.8%でした。一方、robots.txt でAIボットをブロックしていたのは WordPress 以外のほうが多く（13.3%と3.7%）、そのほとんどは学習用とされるボットでした。日本だけを見ても、WordPress 以外（191件）は JSON-LD 28.3%、robots.txt 45.0%で、WordPress（72.9%・95.6%）との差がはっきりしていました。",
      intro: [
        "公開：2026年11月20日。データ：2026年11月12日集計。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策（AEO）のツールと WordPress プラグインを提供しており、この分野、とくに WordPress に利害があります。WordPress サイトの中でのSEOプラグイン別の違いは[別のレポート](/guide/research-wordpress-seo-plugins-2026)にまとめています。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "Web制作会社の自社サイトで、トップページに JSON-LD の構造化データがあったのは WordPress で88.8%（12,376件中）、WordPress 以外で17.6%（1,985件中）。llms.txt は29.6%と9.8%、AI検索に関わる6項目をすべて満たすのは24.9%と4.7%でした。",
            "日本の WordPress 以外のサイト（191件）は、JSON-LD 28.3%（WordPress 72.9%）、robots.txt 45.0%（同95.6%）、canonical 42.9%（同88.1%）、llms.txt 6.3%（同14.0%）。FAQPage だけは3.1%と3.9%で差が見られませんでした（p=0.73）。",
            "robots.txt でAIボットをブロックしていたのは WordPress 以外のほうが多く、日本9.3%（86件中8件、WordPress 1.0%）、海外13.8%（643件中89件、WordPress 4.3%）。ブロックはほぼ学習用とされるボットで、検索用・質問時の取得に使われる4つのボットのどれかをブロックしていたのは、海外の WordPress 以外で5件（0.8%）、日本の WordPress 以外で0件でした。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "対象：Web制作会社の自社サイト。当社の収集リストにある制作会社サイト23,687件のうち、トップページに到達できた15,838件（日本2,486件・海外13,352件）です。一般企業のサイト全体ではありません。",
            "取得したもの：各サイトのトップページ、/robots.txt、/llms.txt、/llms-full.txt を1回ずつ（User-Agent：NurevoSurvey/1.0）。2026年11月上旬〜12日に取得し、11月12日に集計しました。",
            "WordPress の判定：トップページのHTMLに wp-content/・wp-includes/、または generator の WordPress 表記があるものを WordPress としました。到達できた15,838件のうち12,376件（78.1%）が WordPress で、日本は92.3%（2,295件）、海外は75.5%（10,081件）です。WordPress 以外の内訳（独自開発、ほかのCMSやノーコードツールなど）はこの調査では判定していません。",
            "HTTP 202：海外の WordPress 以外のサイトのうち1,477件は、トップページがステータス202を返しました（日本と WordPress のサイトは0件）。これらには viewport・JSON-LD・WordPress の痕跡がどれもなく、ボット確認などの別のページが返った可能性が高いため、表の「WordPress 以外」からは除き、含めた値は本文で示します。",
            "判定方法：llms.txt は、ステータス200で中身がHTMLではなく20文字を超えるテキストを「あり」としました。JSON-LD はトップページにあるかどうか、「壊れている」は JSON として読み込めないブロックが1つ以上あるもの。Organization系は @type に Organization・LocalBusiness・Corporation・ProfessionalService を含むもの。",
            "AIボットのブロック：robots.txt で、各ボットに当てはまるグループの規則がトップページ（/）を Disallow にするか（最長一致）で判定しました。分母は robots.txt があるサイトです。「AIボットをブロック」は GPTBot・ClaudeBot・PerplexityBot・Google-Extended・CCBot・OAI-SearchBot のどれかをブロックしているものです。",
            "「6項目」は、(1) llms.txt がある、(2) JSON-LD がある、(3) Organization または LocalBusiness の型がある、(4) robots.txt があり GPTBot・ClaudeBot・PerplexityBot・OAI-SearchBot のどれもブロックしていない、(5) meta description がある、(6) canonical がある、のうち当てはまる数（0〜6）です。この調査のための単純な数で、Nurevo の0〜100点のスコアとは別物です。",
            "統計：差はカイ二乗検定で確かめ、件数の少ない日本の WordPress 以外はフィッシャーの正確確率検定を使いました。30件未満の区分は載せていません。",
          ],
        },
        {
          heading: "結果：項目ごとの比較",
          paragraphs: [
            "ほぼすべての項目で WordPress のサイトが高く、差がいちばん大きいのは JSON-LD・Organization系の型・canonical・robots.txt でした。逆に WordPress 以外のほうが高かったのは「AIボットをブロック」と「AIボットに言及」の2つだけです。JSON-LD が壊れている割合（1.4〜1.9%）は、どの区分でもほぼ同じでした。",
            "日本の WordPress 以外のサイトは、meta description（76.4%）は WordPress（91.9%）に近い一方、JSON-LD・canonical・robots.txt が低く、6項目では1〜2項目の層が厚くなっています（下の分布）。海外の WordPress 以外のサイトは、meta description も20.1%と低い値でした。この差には、判定方法の限界（後述）が影響している可能性があります。",
            "海外の WordPress 以外を202を返した1,477件も含めて数えると（3,271件）、llms.txt 5.6%、JSON-LD 9.0%、6項目すべて2.6%、6項目の平均0.61 になります。",
            "WordPress どうしで比べても、日本と海外の差は残ります。llms.txt は日本の WordPress 14.0%、海外の WordPress 33.1%、6項目すべては10.8%と28.0%でした（どちらも p<0.001）。WordPress 以外どうしでは、llms.txt（6.3%と10.1%、p=0.11）、6項目すべて（どちらも4.7%）、AIボットのブロック（9.3%と13.8%、p=0.31）に差は見られませんでした。",
          ],
          table: {
            head: HEAD_JA,
            rows: COMPARE.map(([ja, , ...v]) => [ja, ...v]),
            caption: "Web制作会社の自社サイトで、トップページに到達できたもの（海外の WordPress 以外は HTTP 202 の1,477件を除く）。「Sitemap 行」「AIボットをブロック」「AIボットに言及」の分母は robots.txt があるサイト（WordPress 全体11,959件・WordPress 以外全体729件・日本 WordPress 2,195件・日本 WordPress 以外86件・海外 WordPress 9,764件・海外 WordPress 以外643件）。2026年11月12日集計。",
          },
        },
        {
          heading: "robots.txt が無いサイト",
          paragraphs: [
            "WordPress 以外のサイトで最も目立つのは robots.txt が無いことでした。日本の WordPress 以外191件のうち105件（55.0%）、海外の WordPress 以外（202除く）1,794件のうち1,151件（64.2%）で、/robots.txt にテキストの robots.txt がありませんでした（HTMLのページが返った場合も「なし」に数えています）。WordPress では日本4.4%、海外3.1%です。",
            "robots.txt が無いことは、それだけでAIボットを拒否していることにはなりません。この調査の「6項目」では (4) を満たさない扱いにしているため、WordPress 以外のサイトの点数が低めに出る一因になっています。",
          ],
        },
        {
          heading: "ボット別のブロック率",
          paragraphs: [
            "robots.txt があるサイトについて、ボットごとにトップページをブロックしている割合と件数です。学習用とされるボット（Bytespider・CCBot・GPTBot・ClaudeBot・Google-Extended・anthropic-ai・Applebot-Extended）は、海外の WordPress 以外で12.3〜14.2%、海外の WordPress で3.2〜4.1%でした。日本の WordPress 以外は7.0〜8.1%ですが、件数は6〜7件です。検索用や質問時の取得に使われるボット（ChatGPT-User・PerplexityBot・OAI-SearchBot・Claude-SearchBot）は、どの区分でも1%未満でした。",
          ],
          table: {
            head: ["ボット", "日本 WordPress", "日本 WordPress以外", "海外 WordPress", "海外 WordPress以外（202除く）"],
            rows: BOTS,
            caption: "割合（件数）。分母は robots.txt があるサイト（日本 WordPress 2,195件・日本 WordPress 以外86件・海外 WordPress 9,764件・海外 WordPress 以外643件）。トップページ（/）に対する判定。",
          },
        },
        {
          heading: "ブロックの中身（事実）",
          list: [
            "海外の WordPress 以外で11種のAIボットのどれかをブロックしていた93件のうち73件（78.5%）は、GPTBot・ClaudeBot・anthropic-ai・Google-Extended・CCBot・Bytespider・Applebot-Extended の7つをまとめてブロックする同じ組み合わせでした。海外の WordPress では465件中268件（57.6%）です。",
            "GPTBot をブロックしていたサイトのうち、ChatGPT の検索用ボット OAI-SearchBot はブロックしていなかったのは、海外の WordPress 以外で85件中83件、海外の WordPress で363件中346件（95.3%）、日本では WordPress 21件・WordPress 以外7件のすべてでした。",
            "robots.txt でAIボットの名前を挙げていながら、どれもトップページをブロックしていないサイトは、海外の WordPress 以外で75件（robots.txt があるサイトの11.7%）、海外の WordPress で585件（6.0%）でした。",
            "AIボットをブロックしていたサイトのうち llms.txt もあったのは、海外の WordPress で423件中162件（38.3%）、海外の WordPress 以外で89件中9件でした。",
          ],
        },
        {
          heading: "構造化データの型",
          paragraphs: [
            "WordPress のサイトでは WebSite・WebPage・SearchAction・BreadcrumbList など、SEOプラグインがサイト全体に出すことの多い型が多く見られました。WordPress 以外のサイトでは型そのものが少なく、いちばん多いのは PostalAddress（13.0%）と WebSite（12.5%）です。PostalAddress（日本の WordPress 以外19.9%・WordPress 16.1%）と ProfessionalService（7.3%・5.4%）は、日本では WordPress 以外のほうがやや多い値でした。",
          ],
          table: {
            head: HEAD_JA,
            rows: TYPES,
            caption: "到達できたサイトのうち、トップページの JSON-LD にその型があった割合（入れ子の型も数えます）。件数は上の表と同じ。",
          },
        },
        {
          heading: "6項目の分布",
          paragraphs: [
            "WordPress のサイトは日本・海外とも5項目に山があり、海外では6項目すべても28.0%ありました。日本の WordPress 以外は0〜2項目に分かれ（合わせて64.9%）、海外の WordPress 以外（202除く）は0項目が65.7%でした。",
          ],
          table: {
            head: ["当てはまる項目数", "日本 WordPress", "日本 WordPress以外", "海外 WordPress", "海外 WordPress以外（202除く）"],
            rows: DIST,
            caption: "到達できたサイトに占める割合。日本 WordPress 2,295件、日本 WordPress 以外191件、海外 WordPress 10,081件、海外 WordPress 以外1,794件。",
          },
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "この調査の数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。そのまま使える1文：",
          ],
          list: [
            "Web制作会社の自社サイトで、トップページに構造化データ（JSON-LD）があったのは WordPress で88.8%、WordPress 以外で17.6%だった（Nurevo AEO 調査、2026年11月、14,361件）。",
            "Web制作会社の自社サイトの llms.txt 導入率は、WordPress で29.6%、WordPress 以外で9.8%だった（Nurevo AEO 調査、2026年11月）。",
            "国内Web制作会社の自社サイトの92.3%が WordPress で、WordPress 以外のサイト（191件）の55.0%には robots.txt が無かった（Nurevo AEO 調査、2026年11月）。",
            "robots.txt でAIボットをブロックしていたWeb制作会社サイトは、WordPress で3.7%、WordPress 以外で13.3%だった（Nurevo AEO 調査、2026年11月）。",
            "WordPress どうしで比べても、llms.txt があるWeb制作会社サイトは日本14.0%、海外33.1%だった（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "限界",
          list: [
            "対象はWeb制作会社の自社サイトで、一般企業のサイト全体ではありません。収集リストは代表標本ではありません。日本の WordPress 以外は191件（robots.txt があるのは86件）と少なく、ボット別の件数は小さい数です。",
            "トップページのHTMLだけを、JavaScript を実行せずに見ています。表示の後で JavaScript が構造化データやメタタグを足すサイトでは「なし」になります。WordPress 以外のサイトにはこの影響を受けるものが含まれる可能性があります。",
            "meta description は、name 属性が content 属性より前にある書き方だけを数えています。逆の順で書くツールで作られたサイトは「なし」になるため、WordPress 以外の meta description の値は低めに出ている可能性があります。",
            "WordPress の判定はHTMLの痕跡によるもので、痕跡を消している WordPress や、WordPress をデータの管理だけに使う構成は「WordPress 以外」に入ります。",
            "robots.txt はトップページ（/）に対する判定で、一部のディレクトリだけのブロックや、ファイアウォール・CDN によるブロックは数えていません。llms.txt は有無だけを見ています。各サイト1回の取得で、到達できなかったサイトは除いています。今回の集計の一部には11月5日集計時の取得分を引き継いでいます。",
            "WordPress かどうかと各項目の関係は同時に見られたというだけで、WordPress が原因であることを示すものではありません。",
          ],
        },
        {
          heading: "当社の見方（意見）",
          paragraphs: [
            "ここからは事実ではなく当社の意見です。WordPress のサイトで構造化データや canonical がそろっているのは、SEOプラグインやテーマがこれらを自動で出すことが多いためと考えます。WordPress は robots.txt のファイルを置かなくても応答する仕組みを持っており、robots.txt の有無の差もその影響が大きいと見ています。WordPress 以外のサイトでは、同じことを手で、またはツールの設定で入れる必要があるため、抜けが出やすいのかもしれません。",
            "AIボットのブロックが WordPress 以外で多い理由は、この調査からは分かりません。7つの学習用ボットをまとめて止める同じ組み合わせが多いことから、ホスティングやCDNの機能、ひな形の robots.txt が使われている可能性もあります。どのボットを止めるかは各社の判断ですが、AI検索に出たい場合は、検索用のボットまで止めていないかを確かめる価値があります。どれを整えてもAIの回答に出ることが保証されるわけではありません（[別の調査](/guide/aeo-signals-ai-answers-study)では、サイト側の項目と登場の間に関係は見られませんでした）。",
          ],
        },
        {
          heading: "自社やお客様のサイトを確かめる",
          paragraphs: [
            "[無料チェック](https://nurevo.jp/check)で、llms.txt・構造化データ・AIクローラーの許可状況を1分ほどで確認できます。WordPress 以外のサイトでも使えます。WordPress なら [Nurevo WebMCP プラグイン](https://wordpress.org/plugins/nurevo-webmcp/)で llms.txt を出し、会社の事実を構造化データに加えられます。お客様のサイトにまとめて入れたい制作会社の方は[パートナー制度](https://nurevo.jp/partner/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "WordPress のサイトはAI検索に有利ですか？", a: "この調査では、WordPress のサイトのほうが構造化データ・llms.txt・canonical などがそろっている割合が高いことが分かりました（JSON-LD 88.8%と17.6%）。ただし、これはサイトの状態の違いで、AIの回答に出やすいかどうかを測ったものではありません。" },
        { q: "WordPress 以外のサイトでいちばん多い抜けは何ですか？", a: "robots.txt が無いこと（日本の WordPress 以外の55.0%）と、トップページに構造化データが無いこと（同71.7%）でした。日本では meta description は76.4%にありました。" },
        { q: "WordPress 以外のサイトはAIクローラーをブロックしていますか？", a: "robots.txt があるサイトのうち、日本9.3%（8件）、海外13.8%で、WordPress（1.0%・4.3%）より多い値でした。ほとんどは学習用とされるボットで、検索用のボットまでブロックしていたのは1%未満です。" },
        { q: "この数字を記事で使えますか？", a: "はい。出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "あなたのサイトのAI対応を確認",
        body: "無料チェックで、llms.txt・構造化データ・AIクローラーの許可状況が分かります。WordPress 以外のサイトでも使えます。AIの回答に出ることを保証するものではありません。",
        label: "無料でチェックする",
        href: "/check",
        secondary: { label: "制作会社向けパートナー", href: "/partner/" },
      },
      footnote: "調査：Nurevo AEO（Bestie.合同会社）。WordPress は WordPress Foundation の商標です。個別の会社名・ドメインは公開しません。",
    },
    en: {
      title: "WordPress vs Non-WordPress AI Search Readiness (2026) | Nurevo",
      description: "Web agency websites split by WordPress or not: JSON-LD 88.8% vs 17.6%, llms.txt 29.6% vs 9.8%, AI bot blocking 3.7% vs 13.3%. Japan and overseas results, November 2026.",
      h1: "WordPress vs non-WordPress: AI search readiness of 14,361 web agency websites (November 2026)",
      lead: "We split 14,361 web design agencies' own websites whose home page answered normally (HTTP 200) into WordPress (12,376) and non-WordPress (1,985). JSON-LD structured data appeared on the home page of 88.8% of WordPress sites and 17.6% of non-WordPress sites; llms.txt on 29.6% and 9.8%. Non-WordPress sites blocked AI bots in robots.txt more often (13.3% vs 3.7%), almost always training crawlers only. In Japan alone, non-WordPress sites (191) had JSON-LD on 28.3% and a robots.txt on 45.0%, against 72.9% and 95.6% for WordPress.",
      intro: [
        "Published 2026-11-20. Data aggregated 2026-11-12. Research by Nurevo AEO (Bestie.合同会社), Japan. Nurevo sells AI search optimisation (AEO) tools and a WordPress plugin, and so has an interest in this topic, and in WordPress in particular. Differences between SEO plugins within WordPress are covered in [a separate report](/guide/research-wordpress-seo-plugins-2026).",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "88.8% of web agency WordPress sites (of 12,376) had JSON-LD structured data on the home page, against 17.6% of non-WordPress sites (of 1,985). llms.txt: 29.6% vs 9.8%. All six AI-search items: 24.9% vs 4.7%.",
            "In Japan, non-WordPress agency sites (191) had JSON-LD on 28.3% (WordPress 72.9%), a robots.txt on 45.0% (95.6%), a canonical link on 42.9% (88.1%) and an llms.txt on 6.3% (14.0%). Only FAQPage showed no difference (3.1% vs 3.9%, p = 0.73).",
            "Non-WordPress sites blocked AI bots more often: 9.3% in Japan (8 of 86 with a robots.txt; WordPress 1.0%) and 13.8% overseas (89 of 643; WordPress 4.3%). Almost all of it targeted training crawlers: 5 overseas non-WordPress sites (0.8%) and no Japanese ones blocked any of the four bots used for search or for fetching pages when a user asks.",
          ],
        },
        {
          heading: "Method",
          list: [
            "Population: web design agencies' own websites. Of 23,687 agency sites in our collection list, 15,838 home pages could be reached (Japan 2,486; overseas 13,352). This is not a sample of businesses in general.",
            "Fetched: each site's home page, /robots.txt, /llms.txt and /llms-full.txt, once each (User-Agent: NurevoSurvey/1.0), early November to 12 November 2026; aggregated 2026-11-12.",
            "WordPress = the home page HTML contains wp-content/ or wp-includes/, or a WordPress generator tag. 12,376 of the 15,838 reachable sites (78.1%) were WordPress: 92.3% in Japan (2,295) and 75.5% overseas (10,081). We did not identify what the non-WordPress sites run on (custom builds, other CMSs, no-code tools and so on).",
            "HTTP 202: 1,477 overseas non-WordPress home pages answered with status 202 (none in Japan, none among WordPress sites). None of them had a viewport tag, JSON-LD or WordPress markers, so they most likely returned a bot-check or other interim page. They are excluded from the non-WordPress columns of the tables; figures including them are given in the text.",
            "Classification: llms.txt = HTTP 200, not HTML, more than 20 characters. JSON-LD = present on the home page; \"broken\" = at least one block that does not parse as JSON. Organization-type = an @type of Organization, LocalBusiness, Corporation or ProfessionalService.",
            "AI bot blocking: whether the robots.txt rules that apply to each bot disallow the home page (/) (longest match); the base is sites with a robots.txt. \"Blocks an AI bot\" = blocks any of GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot or OAI-SearchBot.",
            "The six items: (1) has an llms.txt; (2) has JSON-LD; (3) has an Organization or LocalBusiness type; (4) has a robots.txt that blocks none of GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot; (5) has a meta description; (6) has a canonical link. The count (0–6) is a simple measure made for this survey, not Nurevo's 0–100 product score.",
            "Statistics: chi-square tests; Fisher's exact test for the small Japanese non-WordPress group. Groups with fewer than 30 sites are not shown.",
          ],
        },
        {
          heading: "Results: item by item",
          paragraphs: [
            "WordPress sites were higher on almost every item; the largest gaps were JSON-LD, Organization-type markup, canonical links and robots.txt. Non-WordPress sites were higher on only two: blocking an AI bot and naming an AI bot in robots.txt. The share of sites with broken JSON-LD (1.4–1.9%) was about the same in every group.",
            "Japanese non-WordPress sites came close to WordPress on meta descriptions (76.4% vs 91.9%) but were low on JSON-LD, canonical links and robots.txt, leaving many of them with one or two of the six items (see the distribution below). Overseas non-WordPress sites were also low on meta descriptions (20.1%); this may partly reflect a limitation of our method (see Limitations).",
            "Counting the 1,477 HTTP 202 pages as well (3,271 overseas non-WordPress sites), the figures are llms.txt 5.6%, JSON-LD 9.0%, all six items 2.6% and a 6-item average of 0.61.",
            "The gap between Japan and overseas remains among WordPress sites: llms.txt 14.0% in Japan vs 33.1% overseas, all six items 10.8% vs 28.0% (both p < 0.001). Among non-WordPress sites we found no difference on llms.txt (6.3% vs 10.1%, p = 0.11), all six items (4.7% each) or AI bot blocking (9.3% vs 13.8%, p = 0.31).",
          ],
          table: {
            head: HEAD_EN,
            rows: COMPARE.map(([, en, ...v]) => [en, ...v]),
            caption: "Web design agencies' own websites whose home page could be reached (overseas non-WordPress excludes 1,477 HTTP 202 responses). \"Sitemap line\", \"Blocks an AI bot\" and \"names an AI bot\" are shares of sites with a robots.txt (WordPress all 11,959; non-WordPress all 729; Japan WordPress 2,195; Japan non-WordPress 86; overseas WordPress 9,764; overseas non-WordPress 643). Aggregated 2026-11-12.",
          },
        },
        {
          heading: "Sites without a robots.txt",
          paragraphs: [
            "The most visible gap for non-WordPress sites was a missing robots.txt: 105 of 191 in Japan (55.0%) and 1,151 of 1,794 overseas (64.2%, excluding 202) returned no plain-text robots.txt at /robots.txt (an HTML page counts as none). Among WordPress sites the figures were 4.4% in Japan and 3.1% overseas.",
            "Having no robots.txt does not mean refusing AI bots. In our six items, however, item (4) is not met without one, which is one reason non-WordPress sites score lower.",
          ],
        },
        {
          heading: "Blocking by bot",
          paragraphs: [
            "Share and number of sites with a robots.txt that block each bot from the home page. Crawlers generally described as training crawlers (Bytespider, CCBot, GPTBot, ClaudeBot, Google-Extended, anthropic-ai, Applebot-Extended) were blocked by 12.3–14.2% of overseas non-WordPress sites and 3.2–4.1% of overseas WordPress sites. Japanese non-WordPress sites show 7.0–8.1%, but that is 6–7 sites. Bots used for search or for fetching pages when a user asks (ChatGPT-User, PerplexityBot, OAI-SearchBot, Claude-SearchBot) were blocked by under 1% in every group.",
          ],
          table: {
            head: ["Bot", "Japan WordPress", "Japan non-WordPress", "Overseas WordPress", "Overseas non-WordPress (excl. 202)"],
            rows: BOTS,
            caption: "Share (sites). Base: sites with a robots.txt (Japan WordPress 2,195; Japan non-WordPress 86; overseas WordPress 9,764; overseas non-WordPress 643). Judged for the home page (/).",
          },
        },
        {
          heading: "What the blocking looks like (facts)",
          list: [
            "Of the 93 overseas non-WordPress sites blocking any of the 11 AI bots, 73 (78.5%) used the same combination: GPTBot, ClaudeBot, anthropic-ai, Google-Extended, CCBot, Bytespider and Applebot-Extended, all seven together. Among overseas WordPress sites it was 268 of 465 (57.6%).",
            "Of the sites blocking GPTBot, those that did not block OpenAI's search crawler OAI-SearchBot were 83 of 85 overseas non-WordPress sites, 346 of 363 overseas WordPress sites (95.3%), and all of them in Japan (21 WordPress, 7 non-WordPress).",
            "Sites that named an AI bot in robots.txt but blocked none from the home page: 75 overseas non-WordPress sites (11.7% of those with a robots.txt) and 585 overseas WordPress sites (6.0%).",
            "Among sites blocking an AI bot, 162 of 423 overseas WordPress sites (38.3%) and 9 of 89 overseas non-WordPress sites also had an llms.txt.",
          ],
        },
        {
          heading: "Structured data types",
          paragraphs: [
            "WordPress sites often carried types that SEO plugins typically output site-wide, such as WebSite, WebPage, SearchAction and BreadcrumbList. Non-WordPress sites had far fewer types; the most common were PostalAddress (13.0%) and WebSite (12.5%). In Japan, PostalAddress (19.9% non-WordPress vs 16.1% WordPress) and ProfessionalService (7.3% vs 5.4%) were slightly more common on non-WordPress sites.",
          ],
          table: {
            head: HEAD_EN,
            rows: TYPES,
            caption: "Share of reachable sites whose home page JSON-LD contains the type (nested types included). Group sizes as in the table above.",
          },
        },
        {
          heading: "Distribution of the six items",
          paragraphs: [
            "WordPress sites peak at five items in both Japan and overseas, and 28.0% of overseas WordPress sites meet all six. Japanese non-WordPress sites spread across 0–2 items (64.9% combined); 65.7% of overseas non-WordPress sites (excluding 202) meet none.",
          ],
          table: {
            head: ["Items met", "Japan WordPress", "Japan non-WordPress", "Overseas WordPress", "Overseas non-WordPress (excl. 202)"],
            rows: DIST,
            caption: "Share of reachable sites. Japan WordPress 2,295; Japan non-WordPress 191; overseas WordPress 10,081; overseas non-WordPress 1,794.",
          },
        },
        {
          heading: "Citing this survey",
          paragraphs: [
            "You may quote and republish the figures and tables freely, as long as you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. Sentences ready to quote:",
          ],
          list: [
            "88.8% of web design agencies' WordPress websites had JSON-LD structured data on the home page, compared with 17.6% of non-WordPress agency websites (Nurevo AEO survey, November 2026, 14,361 sites).",
            "29.6% of web agency WordPress websites had an llms.txt file, compared with 9.8% of non-WordPress agency websites (Nurevo AEO survey, November 2026).",
            "3.7% of web agency WordPress websites blocked an AI bot in robots.txt, compared with 13.3% of non-WordPress agency websites (Nurevo AEO survey, November 2026).",
            "92.3% of Japanese web design agencies' own websites run WordPress, and 55.0% of the non-WordPress ones had no robots.txt (Nurevo AEO survey, November 2026).",
            "Even among WordPress sites, 14.0% of Japanese web agency websites had an llms.txt, against 33.1% overseas (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Limitations",
          list: [
            "The population is web design agencies' own websites, not businesses in general, and our collection list is not a representative sample. The Japanese non-WordPress group is small (191 sites, 86 with a robots.txt), and per-bot counts are small numbers.",
            "Only the home page HTML was examined, without running JavaScript. Sites that add structured data or meta tags with JavaScript after loading count as \"none\"; some non-WordPress sites may be affected.",
            "Meta descriptions were counted only when the name attribute comes before the content attribute. Sites built with tools that write them the other way round count as \"none\", so the non-WordPress meta description figures may be understated.",
            "WordPress detection relies on markers in the HTML. WordPress sites that remove them, and set-ups that use WordPress only as a back-end for content, fall into \"non-WordPress\".",
            "robots.txt was judged for / only; partial blocking and blocking by firewalls or CDNs were not counted. For llms.txt we checked only whether it exists. One fetch per site; unreachable sites are excluded. Part of this aggregation reuses fetches from the 5 November run.",
            "The relationship between WordPress and each item is an association, not evidence that WordPress causes it.",
          ],
        },
        {
          heading: "Our reading (opinion)",
          paragraphs: [
            "What follows is our opinion, not a finding. We think WordPress sites have structured data and canonical links in place so often because SEO plugins and themes output them automatically. WordPress also answers /robots.txt even when no file has been uploaded, which we think explains much of the robots.txt gap. On other platforms the same things have to be added by hand or through the tool's settings, which may be why they are missed more often.",
            "This survey cannot tell why non-WordPress sites block AI bots more often. The frequent identical seven-bot combination suggests hosting or CDN features or template robots.txt files may play a part. Which bots to block is each site owner's decision, but sites that want to appear in AI search may want to confirm they are not blocking search crawlers too. None of this guarantees appearing in AI answers (in [another of our studies](/guide/aeo-signals-ai-answers-study), on-site signals showed no relationship with appearance).",
          ],
        },
        {
          heading: "Check your own or your clients' sites",
          paragraphs: [
            "The [free check](https://nurevo.jp/check) shows llms.txt, structured data and AI crawler access in about a minute, for WordPress and non-WordPress sites alike. On WordPress, the [Nurevo WebMCP plugin](https://wordpress.org/plugins/nurevo-webmcp/) publishes an llms.txt and adds business facts to structured data. Agencies that want to roll it out across clients' sites can see the [partner programme](https://nurevo.jp/partner/).",
          ],
        },
      ],
      faqs: [
        { q: "Are WordPress sites better for AI search?", a: "In this survey WordPress sites more often had structured data, llms.txt and canonical links in place (JSON-LD 88.8% vs 17.6%). That describes the state of the sites; it does not measure how likely they are to appear in AI answers." },
        { q: "What do non-WordPress sites most often miss?", a: "A robots.txt (missing on 55.0% of Japanese non-WordPress agency sites) and home page structured data (missing on 71.7%). Meta descriptions were present on 76.4% in Japan." },
        { q: "Do non-WordPress sites block AI crawlers?", a: "9.3% (8 sites) in Japan and 13.8% overseas of those with a robots.txt, more than WordPress (1.0% and 4.3%). Most of it targets training crawlers; under 1% also blocked search crawlers." },
        { q: "Can I use these figures in an article?", a: "Yes. Credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page, and you may quote and republish them freely." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Check your site's AI readiness",
        body: "The free check shows your llms.txt, structured data and AI crawler access, on any platform. It does not guarantee appearing in AI answers.",
        label: "Run the free check",
        href: "/check",
        secondary: { label: "Partner programme for agencies", href: "/partner/" },
      },
      footnote: "Research by Nurevo AEO (Bestie.合同会社). WordPress is a trademark of the WordPress Foundation. Individual companies and domains are not published.",
    },
  },
};
