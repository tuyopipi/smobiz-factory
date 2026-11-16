// Content page: research report. AI search readiness of Japanese web design
// agencies' own websites by prefecture and region. November 2026.
//
// Every number here comes from nurevo-outreach data/survey/raw_2026-11-12.json
// (survey.js; the same run as summary_2026-11-12.json — the Japan totals match
// it: 2,486 reached, llms.txt 13.4%, JSON-LD 69.4%). Prefecture = the "pref"
// field of our collection list, normalised to the prefecture name (values such
// as "鹿児島県鹿児島市" are counted under 鹿児島県), which is why there are more
// prefectures with 30+ sites here (23) than in summary.byPref (16, unnormalised).
// Do not add a figure that is not in that data. The raw file holds company names
// and domains: never publish them, nor any prefecture under 30 reached sites
// (24 prefectures; they are counted only in the regional rows).
// Definitions follow survey.js: llms.txt = 200, not HTML, >20 chars;
// Organization-type = an @type matching Organization|LocalBusiness|Corporation|
// ProfessionalService; "blocks an AI bot" = the robots.txt group for any of
// GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, OAI-SearchBot
// disallows "/" (longest match), base = sites with a robots.txt; the 6-item
// check is survey.js score() and is not Nurevo's 0–100 product score.
// Chi-square tests across the 23 prefectures: llms.txt p=0.36, 5+ items p=0.56,
// JSON-LD p=0.79; across the 6 regions, llms.txt p=0.90.

// [rank, ja, en, reached, llms.txt, JSON-LD, Organization-type, canonical, WordPress, AI bot blocked / with robots.txt, 6-item average, 5+ items]
const PREF = [
  ["1", "広島県", "Hiroshima", "40", "9 (22.5%)", "75.0%", "65.0%", "85.0%", "90.0%", "0 / 38", "4.38", "62.5%"],
  ["2", "岐阜県", "Gifu", "50", "9 (18.0%)", "82.0%", "64.0%", "94.0%", "96.0%", "2 / 48", "4.36", "58.0%"],
  ["3", "神奈川県", "Kanagawa", "80", "6 (7.5%)", "78.8%", "71.2%", "96.2%", "97.5%", "0 / 74", "4.35", "65.0%"],
  ["4", "栃木県", "Tochigi", "40", "6 (15.0%)", "70.0%", "60.0%", "87.5%", "92.5%", "1 / 38", "4.20", "55.0%"],
  ["5", "兵庫県", "Hyogo", "56", "9 (16.1%)", "75.0%", "58.9%", "87.5%", "91.1%", "0 / 52", "4.20", "51.8%"],
  ["6", "群馬県", "Gunma", "53", "6 (11.3%)", "75.5%", "60.4%", "88.7%", "94.3%", "0 / 50", "4.19", "56.6%"],
  ["7", "愛知県", "Aichi", "64", "11 (17.2%)", "71.9%", "60.9%", "85.9%", "96.9%", "1 / 62", "4.16", "56.2%"],
  ["8", "東京都", "Tokyo", "299", "49 (16.4%)", "72.6%", "63.9%", "86.0%", "95.7%", "1 / 278", "4.16", "55.5%"],
  ["9", "埼玉県", "Saitama", "84", "8 (9.5%)", "69.0%", "60.7%", "89.3%", "95.2%", "1 / 79", "4.15", "57.1%"],
  ["10", "滋賀県", "Shiga", "33", "5 (15.2%)", "75.8%", "60.6%", "75.8%", "87.9%", "0 / 31", "4.15", "54.5%"],
  ["11", "北海道", "Hokkaido", "129", "27 (20.9%)", "71.3%", "58.9%", "86.0%", "95.3%", "0 / 109", "4.15", "53.5%"],
  ["12", "大阪府", "Osaka", "104", "14 (13.5%)", "70.2%", "57.7%", "88.5%", "94.2%", "1 / 100", "4.14", "55.8%"],
  ["13", "長野県", "Nagano", "43", "7 (16.3%)", "72.1%", "58.1%", "86.0%", "88.4%", "3 / 41", "4.14", "51.2%"],
  ["14", "静岡県", "Shizuoka", "62", "7 (11.3%)", "69.4%", "56.5%", "88.7%", "90.3%", "1 / 54", "4.06", "54.8%"],
  ["15", "岡山県", "Okayama", "33", "4 (12.1%)", "66.7%", "54.5%", "81.8%", "93.9%", "2 / 32", "4.03", "42.4%"],
  ["16", "千葉県", "Chiba", "85", "8 (9.4%)", "71.8%", "58.8%", "84.7%", "91.8%", "0 / 75", "4.01", "56.5%"],
  ["17", "山形県", "Yamagata", "33", "5 (15.2%)", "66.7%", "57.6%", "84.8%", "90.9%", "0 / 29", "3.91", "45.5%"],
  ["18", "宮城県", "Miyagi", "34", "5 (14.7%)", "64.7%", "58.8%", "82.4%", "79.4%", "1 / 28", "3.88", "47.1%"],
  ["19", "福岡県", "Fukuoka", "57", "4 (7.0%)", "63.2%", "56.1%", "78.9%", "89.5%", "2 / 52", "3.84", "45.6%"],
  ["20", "茨城県", "Ibaraki", "54", "7 (13.0%)", "61.1%", "50.0%", "81.5%", "96.3%", "2 / 47", "3.76", "40.7%"],
  ["21", "沖縄県", "Okinawa", "33", "2 (6.1%)", "69.7%", "54.5%", "81.8%", "90.9%", "1 / 30", "3.76", "39.4%"],
  ["22", "新潟県", "Niigata", "34", "2 (5.9%)", "64.7%", "55.9%", "79.4%", "88.2%", "0 / 29", "3.74", "50.0%"],
  ["23", "京都府", "Kyoto", "39", "4 (10.3%)", "59.0%", "43.6%", "79.5%", "76.9%", "0 / 34", "3.69", "43.6%"],
];

// [ja, en, reached, llms.txt, JSON-LD, Organization-type, canonical, WordPress, AI bot blocked / with robots.txt, 6-item average, 5+ items]
const REGION = [
  ["北海道・東北", "Hokkaido & Tohoku", "295", "42 (14.2%)", "66.8%", "56.9%", "84.4%", "90.5%", "2 / 252", "3.97", "48.8%"],
  ["関東", "Kanto", "695", "90 (12.9%)", "71.9%", "62.2%", "87.3%", "95.1%", "5 / 641", "4.14", "55.8%"],
  ["中部", "Chubu", "360", "48 (13.3%)", "70.3%", "59.4%", "85.6%", "90.3%", "8 / 335", "4.06", "53.1%"],
  ["近畿", "Kinki", "301", "45 (15.0%)", "67.1%", "53.5%", "83.4%", "88.7%", "3 / 281", "4.01", "49.8%"],
  ["中国・四国", "Chugoku & Shikoku", "228", "27 (11.8%)", "66.2%", "53.9%", "77.6%", "84.2%", "3 / 202", "3.86", "46.5%"],
  ["九州・沖縄", "Kyushu & Okinawa", "219", "27 (12.3%)", "68.9%", "59.4%", "83.1%", "92.2%", "3 / 200", "4.00", "47.9%"],
  ["所在地不明", "Location unknown", "388", "54 (13.9%)", "70.1%", "60.8%", "85.1%", "98.2%", "5 / 370", "4.11", "54.9%"],
  ["日本全体", "All of Japan", "2,486", "333 (13.4%)", "69.4%", "58.9%", "84.6%", "92.3%", "29 / 2,281", "4.05", "52.2%"],
];

const HEAD_JA = ["順位", "都道府県", "到達件数", "llms.txt", "JSON-LD", "Organization系", "canonical", "WordPress", "AIボットをブロック", "6項目の平均", "5項目以上"];
const HEAD_EN = ["Rank", "Prefecture", "Sites reached", "llms.txt", "JSON-LD", "Organization-type", "canonical", "WordPress", "Blocks an AI bot", "6-item average", "5+ items"];
const RHEAD_JA = ["地方", "到達件数", "llms.txt", "JSON-LD", "Organization系", "canonical", "WordPress", "AIボットをブロック", "6項目の平均", "5項目以上"];
const RHEAD_EN = ["Region", "Sites reached", "llms.txt", "JSON-LD", "Organization-type", "canonical", "WordPress", "Blocks an AI bot", "6-item average", "5+ items"];

export default {
  slug: "research-prefecture-ranking-2026",
  targetQueries: [
    "都道府県別 AI検索対策 調査",
    "Web制作会社 都道府県 ランキング AI対応",
    "llms.txt 導入率 都道府県",
    "地方 ホームページ制作会社 AI検索 対応状況",
    "Japan web agencies AI search readiness by prefecture",
  ],
  related: ["research-japan-web-agencies-ai-search-2026", "research-ai-readiness-score-distribution-2026", "research-wordpress-seo-plugins-2026", "llms-txt"],
  locales: {
    ja: {
      title: "都道府県別のAI検索対応ランキング【制作会社2,098件】 | Nurevo",
      description: "国内Web制作会社の自社サイトを都道府県別に調査。30件以上ある23都道府県で、6項目の平均は3.69〜4.38、llms.txt は5.9〜22.5%。差は統計的にははっきりしませんでした。",
      h1: "都道府県別に見たAI検索対応：国内Web制作会社の自社サイト2,098件を調査（2026年11月）",
      lead: "所在地が分かる国内Web制作会社の自社サイト2,098件を都道府県別に集計したところ、到達件数が30件以上ある23都道府県では、AI検索に関わる6項目の平均は3.69（京都府）〜4.38（広島県）、llms.txt の導入率は5.9%（新潟県）〜22.5%（広島県）でした。ただし1都道府県あたりの件数が少なく、この差は統計的にははっきりしません（カイ二乗検定 p＝0.36）。地方別では、llms.txt は11.8〜15.0%の範囲に収まりました。",
      intro: [
        "公開：2026年11月16日。データ：2026年11月12日集計。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策（AEO）のツールと WordPress プラグインを提供しており、この分野に利害があります。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "到達件数30件以上の23都道府県で、6項目の平均がいちばん高かったのは広島県（4.38、40件）、次いで岐阜県（4.36、50件）、神奈川県（4.35、80件）。いちばん低かったのは京都府（3.69、39件）でした。国内全体の平均は4.05です。",
            "llms.txt の導入率は、広島県22.5%（40件中9件）、北海道20.9%（129件中27件）、岐阜県18.0%（50件中9件）が高く、新潟県5.9%（34件中2件）、沖縄県6.1%（33件中2件）、福岡県7.0%（57件中4件）が低めでした。",
            "ただし都道府県による差は統計的にははっきりしません（23都道府県の比較で、llms.txt は p＝0.36、5項目以上の割合は p＝0.56、JSON-LD は p＝0.79）。6つの地方で比べても llms.txt は11.8〜15.0%（p＝0.90）で、東京都（16.4%）と東京都以外（12.8%）の差も数ポイントでした。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "対象：Web制作会社の自社サイト。国内では制作会社であることを確認できた3,352件で、そのうちトップページに到達できたのは2,486件。このうち当社の収集リストで所在地（都道府県）が分かる2,098件を都道府県別に集計しました（所在地不明は388件）。一般企業のサイト全体ではありません。",
            "取得したもの：各サイトのトップページ、/robots.txt、/llms.txt、/llms-full.txt を1回ずつ（User-Agent：NurevoSurvey/1.0）。2026年11月上旬〜12日に取得し、11月12日に集計しました。",
            "判定方法：llms.txt は、ステータス200で中身がHTMLではなく20文字を超えるテキストを「あり」としました。JSON-LD はトップページにあるかどうか、Organization系は @type に Organization・LocalBusiness・Corporation・ProfessionalService を含むもの。WordPress は、トップページのHTMLに wp-content/・wp-includes/、または generator の WordPress 表記があるもの。AIボットのブロックは、robots.txt で GPTBot・ClaudeBot・PerplexityBot・Google-Extended・CCBot・OAI-SearchBot のいずれかについて、トップページ（/）が Disallow になるか（最長一致）で判定し、分母は robots.txt があるサイトです。",
            "「6項目」は、(1) llms.txt がある、(2) JSON-LD がある、(3) Organization または LocalBusiness の型がある、(4) robots.txt があり GPTBot・ClaudeBot・PerplexityBot・OAI-SearchBot のどれもブロックしていない、(5) meta description がある、(6) canonical がある、のうち当てはまる数（0〜6）です。この調査のための単純な数で、Nurevo の0〜100点のスコアとは別物です。",
            "都道府県は収集リストの所在地で、「鹿児島県鹿児島市」のような市区町村つきの表記は都道府県にまとめました。到達件数が30件未満の24県は表に載せず、地方別の集計にだけ含めています。地方は、北海道・東北（7道県）、関東（7都県）、中部（新潟・富山・石川・福井・山梨・長野・岐阜・静岡・愛知）、近畿（三重を含む7府県）、中国・四国（9県）、九州・沖縄（8県）としました。",
          ],
        },
        {
          heading: "結果：都道府県別ランキング（到達30件以上の23都道府県）",
          paragraphs: [
            "6項目の平均で並べました（同じ値のときは5項目以上の割合が高い順）。上位と下位の差は0.69点で、多くの都道府県が4.0〜4.2の間に集まっています。項目ごとに見ると順位は入れ替わり、たとえば神奈川県は JSON-LD・Organization系・canonical が高い一方、llms.txt は7.5%でした。",
          ],
          table: {
            head: HEAD_JA,
            rows: PREF.map(([rank, ja, , ...v]) => [rank, ja, ...v]),
            caption: "国内Web制作会社の自社サイトで、トップページに到達できたもの。llms.txt は件数（割合）。AIボットをブロックは「ブロックあり / robots.txt あり」の件数。2026年11月12日集計。",
          },
        },
        {
          heading: "地方別",
          paragraphs: [
            "地方別にすると件数が200〜700件になり、値はさらに近づきます。6項目の平均は3.86（中国・四国）〜4.14（関東）、llms.txt は11.8%（中国・四国）〜15.0%（近畿）、JSON-LD は66.2〜71.9%でした。中国・四国は canonical（77.6%）と WordPress の割合（84.2%）がやや低めです。",
          ],
          table: {
            head: RHEAD_JA,
            rows: REGION.map(([ja, , ...v]) => [ja, ...v]),
            caption: "地方別の値には、到達30件未満で上の表に載せていない24県も含みます。所在地不明は当社の収集リストに都道府県の記載がないもの。",
          },
        },
        {
          heading: "差はどのくらい確かか",
          paragraphs: [
            "1都道府県あたりの件数は30〜299件で、40件の県では1件の違いが2.5ポイントになります。そこで、都道府県ごとの割合の違いが偶然の範囲を超えるかをカイ二乗検定で確かめました。23都道府県の比較では llms.txt が p＝0.36、5項目以上の割合が p＝0.56、JSON-LD が p＝0.79、6つの地方の llms.txt は p＝0.90 で、いずれも「差がある」とは言えない水準でした。",
            "つまり、このデータからは「どの都道府県の制作会社がAI検索への対応で進んでいるか」ははっきり言えません。ランキングは目安として読み、順位の上下を地域の実力差と受け取らないでください。",
          ],
        },
        {
          heading: "ほかに見えたこと（事実）",
          list: [
            "AIボットを robots.txt でブロックしていたのは、どの都道府県でも0〜3件でした（国内全体で robots.txt がある2,281件中29件、1.3%）。",
            "6項目の平均が低めだった京都府（76.9%）と宮城県（79.4%）は、WordPress の割合も低めでした。国内全体では WordPress のサイトの6項目の平均は4.2、WordPress 以外は2.1です（[スコア分布の調査](/guide/research-ai-readiness-score-distribution-2026)）。WordPress かどうかの違いが都道府県の値に表れている可能性がありますが、この調査ではそれ以上は確かめていません。",
            "東京都（299件）と東京都以外（1,799件）を比べると、llms.txt は16.4%と12.8%、6項目の平均は4.16と4.02、5項目以上は55.5%と51.0%でした。",
          ],
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "この調査の数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。そのまま使える1文：",
          ],
          list: [
            "国内Web制作会社の自社サイトのAI検索対応（6項目の平均）は、到達30件以上の23都道府県で3.69〜4.38で、都道府県による差は統計的にははっきりしなかった（Nurevo AEO 調査、2026年11月）。",
            "国内Web制作会社の自社サイトの llms.txt 導入率は、地方別で11.8%（中国・四国）〜15.0%（近畿）だった（Nurevo AEO 調査、2026年11月）。",
            "都道府県別で llms.txt 導入率が最も高かったのは広島県（22.5%、40件中9件）、次いで北海道（20.9%、129件中27件）だった（Nurevo AEO 調査、2026年11月、到達30件以上の23都道府県）。",
            "東京都のWeb制作会社の自社サイトの llms.txt 導入率は16.4%、東京都以外は12.8%だった（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "限界",
          list: [
            "対象はWeb制作会社の自社サイトで、一般企業のサイト全体ではありません。都道府県ごとの件数は当社の収集リストに載っている数で、その都道府県の制作会社の数や分布を表すものではありません（たとえば東京都は299件で、実際の事業者数の比率とは異なります）。",
            "所在地は収集リストの記載によるもので、本社と制作拠点が違う会社や、記載の誤りがありえます。所在地不明の388件は都道府県別には入っていません。",
            "トップページだけを見ています。robots.txt はトップページ（/）に対する判定で、一部のディレクトリだけのブロックや、ファイアウォール・CDN によるブロックは数えていません。llms.txt は有無だけを見て、中身の質は見ていません。",
            "各サイト1回の取得で、到達できなかったサイトは除いています。今回の集計の一部には11月5日集計時の取得分を引き継いでいます。",
            "件数が30〜299件と少なく、順位は数件の違いで入れ替わります。統計的な検定でも、都道府県の差ははっきりしませんでした。",
          ],
        },
        {
          heading: "当社の見方（意見）",
          paragraphs: [
            "ここからは事実ではなく当社の意見です。今回のデータでは、AI検索への対応は「どこにある制作会社か」より、「個々のサイトで何をしているか」の違いのほうが大きいように見えます。都道府県や地方の平均で比べるより、自社やお客様のサイトで llms.txt・構造化データ・canonical などが抜けていないかを1つずつ確かめるほうが役に立つと考えます。どれを整えてもAIの回答に出ることが保証されるわけではありません（[別の調査](/guide/aeo-signals-ai-answers-study)では、サイト側の項目と登場の間に関係は見られませんでした）。",
          ],
        },
        {
          heading: "自社やお客様のサイトを確かめる",
          paragraphs: [
            "[無料チェック](https://nurevo.jp/check)で、llms.txt・構造化データ・AIクローラーの許可状況を1分ほどで確認できます。WordPress なら [Nurevo WebMCP プラグイン](https://wordpress.org/plugins/nurevo-webmcp/)で llms.txt を出し、会社の事実を構造化データに加えられます。地域のお客様のサイトにまとめて入れたい制作会社の方は[パートナー制度](https://nurevo.jp/partner/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "AI検索への対応が進んでいる都道府県はどこですか？", a: "到達30件以上の23都道府県のうち、6項目の平均が高かったのは広島県（4.38）・岐阜県（4.36）・神奈川県（4.35）でした。ただし件数が少なく、都道府県による差は統計的にははっきりしません（2026年11月）。" },
        { q: "東京の制作会社のほうが進んでいますか？", a: "東京都の llms.txt 導入率は16.4%、東京都以外は12.8%、6項目の平均は4.16と4.02で、差は小さめでした。" },
        { q: "載っていない県があるのはなぜですか？", a: "到達できたサイトが30件未満の24県は、数字が数件で大きく動くため表に載せていません。地方別の集計には含めています。" },
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
      footnote: "調査：Nurevo AEO（Bestie.合同会社）。WordPress は WordPress Foundation の商標です。個別の会社名・ドメインは公開しません。",
    },
    en: {
      title: "AI Search Readiness by Prefecture: 2,098 Japanese Agency Sites | Nurevo",
      description: "Japanese web agencies' sites by prefecture: in 23 prefectures with 30+ sites, the 6-item average was 3.69–4.38 and llms.txt 5.9–22.5%; no clear statistical difference.",
      h1: "AI search readiness by prefecture: 2,098 websites of Japanese web design agencies (November 2026)",
      lead: "We grouped 2,098 websites of Japanese web design agencies by prefecture. Across the 23 prefectures with at least 30 reachable sites, the average of six AI-search-related items ranged from 3.69 (Kyoto) to 4.38 (Hiroshima), and llms.txt adoption from 5.9% (Niigata) to 22.5% (Hiroshima). With so few sites per prefecture, these differences are not statistically clear (chi-square p = 0.36). By region, llms.txt adoption stayed between 11.8% and 15.0%.",
      intro: [
        "Published 2026-11-16. Data aggregated 2026-11-12. Research by Nurevo AEO (Bestie.合同会社). Nurevo sells AI search optimization (AEO) tools and a WordPress plugin, and so has an interest in this topic.",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "Among the 23 prefectures with 30+ reachable sites, the highest 6-item average was Hiroshima (4.38, 40 sites), followed by Gifu (4.36, 50) and Kanagawa (4.35, 80); the lowest was Kyoto (3.69, 39). The national average was 4.05.",
            "llms.txt adoption was highest in Hiroshima (22.5%, 9 of 40), Hokkaido (20.9%, 27 of 129) and Gifu (18.0%, 9 of 50), and lowest in Niigata (5.9%, 2 of 34), Okinawa (6.1%, 2 of 33) and Fukuoka (7.0%, 4 of 57).",
            "The differences between prefectures are not statistically clear (across 23 prefectures: llms.txt p = 0.36, share with 5+ items p = 0.56, JSON-LD p = 0.79). Across six regions, llms.txt ranged 11.8–15.0% (p = 0.90), and Tokyo (16.4%) differed from the rest of Japan (12.8%) by only a few points.",
          ],
        },
        {
          heading: "Method",
          list: [
            "Population: web design agencies' own websites. In Japan, 3,352 sites confirmed as agencies, of which 2,486 home pages could be reached. Of these, 2,098 have a known prefecture in our collection list and are grouped by prefecture (388 have no location). Not businesses in general.",
            "Fetched: each site's home page, /robots.txt, /llms.txt and /llms-full.txt, once each (User-Agent: NurevoSurvey/1.0), early November to 12 November 2026; aggregated 2026-11-12.",
            "Classification: llms.txt = HTTP 200, not HTML, more than 20 characters. JSON-LD = present on the home page; Organization-type = an @type of Organization, LocalBusiness, Corporation or ProfessionalService. WordPress = the home page HTML contains wp-content/ or wp-includes/, or a WordPress generator tag. AI bot blocking = the robots.txt rules that apply to any of GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot or OAI-SearchBot disallow the home page (/) (longest match); the base is sites with a robots.txt.",
            "The six items: (1) has an llms.txt; (2) has JSON-LD; (3) has an Organization or LocalBusiness type; (4) has a robots.txt that blocks none of GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot; (5) has a meta description; (6) has a canonical link. The count (0–6) is a simple measure made for this survey, not Nurevo's 0–100 product score.",
            "Prefecture is the location in our collection list; entries that include a city were assigned to their prefecture. The 24 prefectures with fewer than 30 reachable sites are not shown individually but are included in the regional figures. Regions: Hokkaido & Tohoku (7 prefectures), Kanto (7), Chubu (Niigata, Toyama, Ishikawa, Fukui, Yamanashi, Nagano, Gifu, Shizuoka, Aichi), Kinki (7, including Mie), Chugoku & Shikoku (9), Kyushu & Okinawa (8).",
          ],
        },
        {
          heading: "Results: prefecture ranking (23 prefectures with 30+ sites)",
          paragraphs: [
            "Sorted by the 6-item average (ties broken by the share with 5+ items). The gap between top and bottom is 0.69 points, and most prefectures sit between 4.0 and 4.2. The order changes item by item: Kanagawa, for example, is high on JSON-LD, Organization-type and canonical, but its llms.txt adoption is 7.5%.",
          ],
          table: {
            head: HEAD_EN,
            rows: PREF.map(([rank, , en, ...v]) => [rank, en, ...v]),
            caption: "Japanese web design agencies' own websites whose home page could be reached. llms.txt shows count (share). \"Blocks an AI bot\" shows blocking / with robots.txt. Aggregated 2026-11-12.",
          },
        },
        {
          heading: "By region",
          paragraphs: [
            "Grouped by region (200–700 sites each), the values move even closer together: 6-item average 3.86 (Chugoku & Shikoku) to 4.14 (Kanto), llms.txt 11.8% (Chugoku & Shikoku) to 15.0% (Kinki), JSON-LD 66.2–71.9%. Chugoku & Shikoku is somewhat lower on canonical links (77.6%) and WordPress share (84.2%).",
          ],
          table: {
            head: RHEAD_EN,
            rows: REGION.map(([, en, ...v]) => [en, ...v]),
            caption: "Regional figures include the 24 prefectures with fewer than 30 sites that are not shown above. \"Location unknown\" = no prefecture in our collection list.",
          },
        },
        {
          heading: "How solid are the differences?",
          paragraphs: [
            "Prefectures have 30 to 299 sites each; with 40 sites, one site moves a share by 2.5 points. We used chi-square tests to see whether the differences go beyond chance. Across the 23 prefectures, llms.txt gave p = 0.36, the share with 5+ items p = 0.56 and JSON-LD p = 0.79; across the six regions, llms.txt gave p = 0.90. None of these supports a real difference.",
            "In other words, this data cannot tell which prefecture's agencies are ahead on AI search readiness. Read the ranking as a rough guide, not as a measure of regional capability.",
          ],
        },
        {
          heading: "Other observations (facts)",
          list: [
            "Every prefecture had between 0 and 3 sites blocking an AI bot in robots.txt (29 of 2,281 sites with a robots.txt nationwide, 1.3%).",
            "Kyoto (76.9%) and Miyagi (79.4%), both lower on the 6-item average, also had lower WordPress shares. Nationally, WordPress sites average 4.2 on the six items and non-WordPress sites 2.1 ([score distribution study](/guide/research-ai-readiness-score-distribution-2026)). The WordPress mix may show up in prefecture figures, but we did not test this further.",
            "Tokyo (299 sites) vs the rest of Japan (1,799): llms.txt 16.4% vs 12.8%, 6-item average 4.16 vs 4.02, 5+ items 55.5% vs 51.0%.",
          ],
        },
        {
          heading: "Citing this survey",
          paragraphs: [
            "You may quote and republish the figures and tables freely, as long as you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. Sentences ready to quote:",
          ],
          list: [
            "Across 23 Japanese prefectures with 30+ web agency websites, the average AI search readiness (six items) ranged from 3.69 to 4.38, with no statistically clear difference between prefectures (Nurevo AEO survey, November 2026).",
            "llms.txt adoption among Japanese web agencies' own websites ranged from 11.8% (Chugoku & Shikoku) to 15.0% (Kinki) by region (Nurevo AEO survey, November 2026).",
            "16.4% of Tokyo web agencies' own websites had an llms.txt, compared with 12.8% elsewhere in Japan (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Limitations",
          list: [
            "The population is web design agencies' own websites, not businesses in general. Counts per prefecture reflect our collection list, not the number or distribution of agencies in each prefecture (Tokyo's 299 sites, for instance, do not match its real share of businesses).",
            "Location comes from our list; companies whose head office and studio differ, or listing errors, are possible. The 388 sites without a location are not in the prefecture figures.",
            "Only the home page was examined. robots.txt was judged for / only; partial blocking and blocking by firewalls or CDNs were not counted. For llms.txt we checked only whether it exists, not its quality.",
            "One fetch per site; unreachable sites are excluded. Part of this aggregation reuses fetches from the 5 November run.",
            "With 30 to 299 sites per prefecture, ranks change with a few sites, and statistical tests did not show clear differences.",
          ],
        },
        {
          heading: "Our reading (opinion)",
          paragraphs: [
            "What follows is our opinion, not a finding. In this data, AI search readiness seems to depend far more on what each site does than on where the agency is. Checking whether your own or your clients' sites are missing llms.txt, structured data or canonical links, one by one, is likely more useful than comparing prefecture averages. None of this guarantees appearing in AI answers (in [another of our studies](/guide/aeo-signals-ai-answers-study), on-site signals showed no relationship with appearance).",
          ],
        },
        {
          heading: "Check your own or your clients' sites",
          paragraphs: [
            "The [free check](https://nurevo.jp/check) shows llms.txt, structured data and AI crawler access in about a minute. On WordPress, the [Nurevo WebMCP plugin](https://wordpress.org/plugins/nurevo-webmcp/) publishes an llms.txt and adds business facts to structured data. Agencies that want to roll it out across local clients' sites can see the [partner program](https://nurevo.jp/partner/).",
          ],
        },
      ],
      faqs: [
        { q: "Which prefectures are furthest ahead?", a: "Among the 23 prefectures with 30+ sites, Hiroshima (4.38), Gifu (4.36) and Kanagawa (4.35) had the highest 6-item averages. With so few sites per prefecture, the differences are not statistically clear (November 2026)." },
        { q: "Are Tokyo agencies ahead?", a: "Slightly: llms.txt 16.4% in Tokyo vs 12.8% elsewhere, 6-item average 4.16 vs 4.02." },
        { q: "Why are some prefectures missing?", a: "The 24 prefectures with fewer than 30 reachable sites are not shown, because a few sites would swing their figures. They are included in the regional totals." },
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
      footnote: "Research by Nurevo AEO (Bestie.合同会社). WordPress is a trademark of the WordPress Foundation. Individual companies and domains are not published.",
    },
  },
};
