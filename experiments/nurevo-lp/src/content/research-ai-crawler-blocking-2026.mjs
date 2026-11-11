// Content page: research report. How web design agencies' own websites treat
// AI crawlers in robots.txt, bot by bot, Japan vs. other countries (Nov 2026).
//
// Every number here comes from nurevo-outreach data/survey/raw_2026-11-05.json
// (survey.js robots() output, aggregated; it matches summary_2026-11-05.json
// where both exist). Do not add a figure that is not in that data. The raw file
// holds company names and domains: never publish them, nor any group under 30
// sites.
// Definitions: "blocked" = the robots.txt group that applies to the bot (its own
// group, or "*" when it has none) disallows "/" (longest match), as survey.js.
// "AI bots" here = the 11 AI user agents below (7 training + 4 search/user).
// The overview report counted 6 bots (GPTBot, ClaudeBot, PerplexityBot,
// Google-Extended, CCBot, OAI-SearchBot), which gives Japan 28 (1.3%) instead
// of 30 (1.4%); say so wherever the two could be compared.

const BOTS_JA = {
  head: ["ボット（運営）", "本調査での分類", "国内：件数", "国内：割合", "海外：件数", "海外：割合"],
  rows: [
    ["GPTBot（OpenAI）", "学習用", "27", "1.3%", "468", "4.5%"],
    ["CCBot（Common Crawl）", "学習用", "24", "1.1%", "510", "4.9%"],
    ["Bytespider（ByteDance）", "学習用", "24", "1.1%", "505", "4.8%"],
    ["Google-Extended（Google）", "学習用", "24", "1.1%", "439", "4.2%"],
    ["ClaudeBot（Anthropic）", "学習用", "21", "1.0%", "438", "4.2%"],
    ["anthropic-ai（Anthropic）", "学習用", "22", "1.0%", "412", "4.0%"],
    ["Applebot-Extended（Apple）", "学習用", "21", "1.0%", "415", "4.0%"],
    ["ChatGPT-User（OpenAI）", "検索・ユーザー操作用", "2", "0.09%", "31", "0.3%"],
    ["PerplexityBot（Perplexity）", "検索・ユーザー操作用", "1", "0.05%", "29", "0.3%"],
    ["OAI-SearchBot（OpenAI）", "検索・ユーザー操作用", "0", "0%", "21", "0.2%"],
    ["Claude-SearchBot（Anthropic）", "検索・ユーザー操作用", "0", "0%", "18", "0.2%"],
    ["Googlebot（Google、比較用）", "通常の検索", "0", "0%", "9", "0.09%"],
    ["Bingbot（Microsoft、比較用）", "通常の検索", "0", "0%", "9", "0.09%"],
  ],
  caption: "分母：robots.txt がある国内2,158件・海外10,423件。「ブロック」は、そのボットに当てはまるグループ（専用のグループがなければ User-agent: *）でトップページ（/）が Disallow になること。2026年11月5日集計。",
};

const BOTS_EN = {
  head: ["Bot (operator)", "Class in this survey", "Japan: sites", "Japan: share", "Other countries: sites", "Other countries: share"],
  rows: [
    ["GPTBot (OpenAI)", "Training", "27", "1.3%", "468", "4.5%"],
    ["CCBot (Common Crawl)", "Training", "24", "1.1%", "510", "4.9%"],
    ["Bytespider (ByteDance)", "Training", "24", "1.1%", "505", "4.8%"],
    ["Google-Extended (Google)", "Training", "24", "1.1%", "439", "4.2%"],
    ["ClaudeBot (Anthropic)", "Training", "21", "1.0%", "438", "4.2%"],
    ["anthropic-ai (Anthropic)", "Training", "22", "1.0%", "412", "4.0%"],
    ["Applebot-Extended (Apple)", "Training", "21", "1.0%", "415", "4.0%"],
    ["ChatGPT-User (OpenAI)", "Search / user-initiated", "2", "0.09%", "31", "0.3%"],
    ["PerplexityBot (Perplexity)", "Search / user-initiated", "1", "0.05%", "29", "0.3%"],
    ["OAI-SearchBot (OpenAI)", "Search / user-initiated", "0", "0%", "21", "0.2%"],
    ["Claude-SearchBot (Anthropic)", "Search / user-initiated", "0", "0%", "18", "0.2%"],
    ["Googlebot (Google, for reference)", "Regular search", "0", "0%", "9", "0.09%"],
    ["Bingbot (Microsoft, for reference)", "Regular search", "0", "0%", "9", "0.09%"],
  ],
  caption: "Base: sites with a robots.txt, 2,158 in Japan and 10,423 in other countries. \"Blocked\" means the group that applies to the bot (its own group, or User-agent: * if it has none) disallows the home page (/). Aggregated 2026-11-05.",
};

// [code, ja, en, sites with robots.txt, blocking >=1 AI bot, share, GPTBot share]
const COUNTRIES = [
  ["KR", "韓国", "South Korea", "32", "6", "18.8%", "15.6%"],
  ["MY", "マレーシア", "Malaysia", "48", "8", "16.7%", "14.6%"],
  ["TW", "台湾", "Taiwan", "54", "7", "13.0%", "13.0%"],
  ["AR", "アルゼンチン", "Argentina", "56", "7", "12.5%", "10.7%"],
  ["CO", "コロンビア", "Colombia", "59", "7", "11.9%", "6.8%"],
  ["HK", "香港", "Hong Kong", "61", "7", "11.5%", "9.8%"],
  ["IT", "イタリア", "Italy", "63", "6", "9.5%", "7.9%"],
  ["ZA", "南アフリカ", "South Africa", "305", "24", "7.9%", "7.2%"],
  ["PH", "フィリピン", "Philippines", "209", "16", "7.7%", "6.2%"],
  ["NL", "オランダ", "Netherlands", "92", "7", "7.6%", "5.4%"],
  ["IN", "インド", "India", "1,405", "92", "6.5%", "5.1%"],
  ["NZ", "ニュージーランド", "New Zealand", "327", "21", "6.4%", "4.6%"],
  ["SG", "シンガポール", "Singapore", "546", "34", "6.2%", "5.1%"],
  ["ES", "スペイン", "Spain", "178", "11", "6.2%", "5.1%"],
  ["BR", "ブラジル", "Brazil", "217", "13", "6.0%", "5.1%"],
  ["MX", "メキシコ", "Mexico", "74", "4", "5.4%", "4.1%"],
  ["GB", "イギリス", "United Kingdom", "699", "35", "5.0%", "4.0%"],
  ["AU", "オーストラリア", "Australia", "1,336", "65", "4.9%", "4.2%"],
  ["US", "アメリカ", "United States", "3,404", "159", "4.7%", "3.8%"],
  ["IE", "アイルランド", "Ireland", "183", "8", "4.4%", "3.3%"],
  ["CA", "カナダ", "Canada", "660", "25", "3.8%", "2.9%"],
  ["FR", "フランス", "France", "332", "6", "1.8%", "1.2%"],
  ["JP", "日本", "Japan", "2,158", "30", "1.4%", "1.3%"],
];

const COUNTRY_JA = {
  head: ["国・地域", "robots.txt あり", "AIボットを1つ以上ブロック", "割合", "GPTBot をブロック"],
  rows: COUNTRIES.map(([, ja, , n, k, s, g]) => [ja, n, k, s, g]),
  caption: "robots.txt があるサイトが30件以上の国・地域のみ。AIボットは本文の11種。件数の少ない国は1件の違いで割合が大きく動きます。",
};
const COUNTRY_EN = {
  head: ["Country / region", "Sites with robots.txt", "Block ≥1 AI bot", "Share", "Block GPTBot"],
  rows: COUNTRIES.map(([, , en, n, k, s, g]) => [en, n, k, s, g]),
  caption: "Only countries and regions with at least 30 sites that have a robots.txt. AI bots = the 11 listed above. In small groups one site moves the share noticeably.",
};

const WP_JA = {
  head: ["区分", "robots.txt あり", "AIボットを1つ以上ブロック", "割合"],
  rows: [
    ["国内・WordPress", "2,072", "22", "1.1%"],
    ["国内・WordPress 以外", "86", "8", "9.3%"],
    ["海外・WordPress", "9,717", "463", "4.8%"],
    ["海外・WordPress 以外", "706", "116", "16.4%"],
  ],
  caption: "WordPress かどうかはトップページのHTML（wp-content・wp-includes・generator）で判定。",
};
const WP_EN = {
  head: ["Group", "Sites with robots.txt", "Block ≥1 AI bot", "Share"],
  rows: [
    ["Japan, WordPress", "2,072", "22", "1.1%"],
    ["Japan, not WordPress", "86", "8", "9.3%"],
    ["Other countries, WordPress", "9,717", "463", "4.8%"],
    ["Other countries, not WordPress", "706", "116", "16.4%"],
  ],
  caption: "WordPress was detected from the home page HTML (wp-content, wp-includes or the generator tag).",
};

export default {
  slug: "research-ai-crawler-blocking-2026",
  targetQueries: [
    "AIクローラー ブロック 割合 調査",
    "GPTBot ブロック 割合 robots.txt",
    "robots.txt AIボット 拒否 実態 2026",
    "OAI-SearchBot GPTBot 違い ブロック",
    "AI crawler blocking robots.txt survey 2026",
    "GPTBot block rate websites",
    "how many websites block GPTBot",
  ],
  related: ["research-japan-web-agencies-ai-search-2026", "llms-txt", "appear-in-chatgpt", "agency-aeo-monthly-service"],
  locales: {
    ja: {
      title: "AIクローラーのブロック実態：ボット別・国別【2026年11月・12,581件調査】 | Nurevo",
      description: "Web制作会社の自社サイトの robots.txt 12,581件を調査。AIボットをブロックしていたのは国内1.4%・海外5.6%。ブロックの93.3%は学習用だけで、検索用のボットはほぼ許可されていました。",
      h1: "AIクローラーのブロック実態：ボット別・国別に12,581件の robots.txt を調査（2026年11月）",
      lead: "Web制作会社の自社サイトの robots.txt を調べたところ、AIボット（11種）を1つ以上ブロックしていたのは、国内で1.4%（2,158件中30件）、海外で5.6%（10,423件中579件）でした。ブロックしていたサイトの93.3%（609件中568件）は学習用のクローラーだけを止め、検索・ユーザー操作用のボット（OAI-SearchBot、Claude-SearchBot、PerplexityBot、ChatGPT-User）は許可していました。",
      intro: [
        "公開：2026年11月11日。データ：2026年11月5日集計。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策（AEO）のツールを提供しており、この分野に利害があります。",
        "国内の結果全体は[総論レポート](/ja/guide/research-japan-web-agencies-ai-search-2026)にまとめています。このレポートは robots.txt のAIボットの扱いだけを、ボット別・国別に詳しく見たものです。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "AIボットを1つ以上ブロックしていたのは、国内の制作会社サイトで1.4%（2,158件中30件）、海外で5.6%（10,423件中579件）。国内は調べた23の国・地域の中で最も低い割合でした。",
            "ブロックの中心は学習用クローラーです。全体で GPTBot をブロックしていたのは495件（3.9%）でしたが、同じ OpenAI の検索用 OAI-SearchBot は21件（0.2%）でした。ブロックしていたサイトの93.3%（609件中568件）は、検索・ユーザー操作用の4種をどれもブロックしていませんでした。",
            "最も多いのは「学習用7種をちょうど全部ブロック」する形で、ブロックしていたサイトの62.4%（609件中380件）。また、robots.txt にAIボットの名前を書いているサイトの53.6%（1,280件中686件）は、名前を書いたうえでブロックしていませんでした。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "対象：Web制作会社の自社サイト。国内は制作会社であることを確認できたもの、海外は当社が集めた制作会社のリストです。一般企業のサイト全体ではありません。",
            "件数：取得を試みたのは20,720件、トップページに到達できたのは15,657件（国内2,357件・海外13,300件）。そのうち robots.txt があった12,581件（国内2,158件・海外10,423件）が、このレポートの分母です。",
            "取得したもの：各サイトのトップページと /robots.txt を1回ずつ（User-Agent：NurevoSurvey/1.0）。2026年11月上旬に取得し、11月5日に集計しました。",
            "判定方法：robots.txt は、ステータス200で中身がHTMLではなく20文字を超えるテキストを「あり」としました。各ボットについて、そのボット名を含む User-agent のグループ（なければ User-agent: *）の規則で、トップページ（/）が Disallow になるかを最長一致で判定しました。",
            "AIボット：学習用7種（GPTBot、ClaudeBot、anthropic-ai、Google-Extended、CCBot、Bytespider、Applebot-Extended）と、検索・ユーザー操作用4種（OAI-SearchBot、ChatGPT-User、Claude-SearchBot、PerplexityBot）の計11種。分類は各社の公開説明をもとにした本調査での区分です。比較のため Googlebot・Bingbot も判定しました。",
            "総論レポートの「AIボットを1つ以上ブロック：1.3%（28件）」は6種（GPTBot、ClaudeBot、PerplexityBot、Google-Extended、CCBot、OAI-SearchBot）で数えた値です。このレポートでは11種で数えているため、国内は1.4%（30件）になります。",
          ],
        },
        {
          heading: "結果：ボット別のブロック率",
          paragraphs: [
            "どのボットも、国内のブロック率は1.3%以下で、海外（4〜5%）より低い水準でした。学習用7種のブロック率はどれも近い値で、同じサイトがまとめてブロックしていることが多いためです。検索・ユーザー操作用の4種は、国内・海外とも0.3%以下でした。",
          ],
          table: BOTS_JA,
        },
        {
          heading: "学習用は止め、検索用は通す",
          paragraphs: [
            "AIボットを1つ以上ブロックしていた609件（国内30件・海外579件）のブロックの仕方を見ました。",
          ],
          list: [
            "学習用だけをブロックし、検索・ユーザー操作用の4種はどれもブロックしていない：568件（93.3%）。国内は30件中28件、海外は579件中540件。",
            "学習用7種をちょうど全部ブロックし、ほかはブロックしていない：380件（62.4%）。国内は30件中19件、海外は579件中361件。",
            "GPTBot をブロックしていた495件のうち、OAI-SearchBot は許可していた：476件（国内27件中27件、海外468件中449件）。",
            "ClaudeBot をブロックしていた459件のうち、Claude-SearchBot は許可していた：441件（国内21件中21件、海外438件中420件）。",
            "Googlebot もブロックしていた（サイト全体を Disallow にしている）サイト：海外9件（0.09%）。国内は0件。",
          ],
        },
        {
          heading: "名前を書いても、ブロックするとは限らない",
          paragraphs: [
            "robots.txt にAIボットの名前（User-agent）を書いていたのは、国内で2.5%（54件）、海外で11.8%（1,226件）でした。そのうちブロックしていたのは国内30件（55.6%）、海外564件（46.0%）で、残りの国内24件・海外662件は、名前を書いたうえでトップページへのアクセスを許可していました。AIボットを個別に「許可」と書いているサイトも一定数あるということです。",
            "また、AIボットをブロックしていたサイトでも llms.txt を置いている割合は低くありませんでした。海外では、ブロックしていた579件のうち200件（34.5%）に llms.txt があり、ブロックしていない9,844件（33.1%）と同程度でした。国内はブロックしていた30件のうち5件（16.7%）です。",
          ],
        },
        {
          heading: "国・地域別",
          paragraphs: [
            "robots.txt があるサイトが30件以上の23の国・地域を比べると、AIボットを1つ以上ブロックしていた割合は日本が1.4%で最も低く、フランス（1.8%）が続きました。件数の多い国では、アメリカ4.7%、オーストラリア4.9%、イギリス5.0%、インド6.5%でした。韓国・マレーシアなど件数の少ない国は、1件の違いで割合が大きく動く点に注意してください。",
          ],
          table: COUNTRY_JA,
        },
        {
          heading: "WordPress とそれ以外",
          paragraphs: [
            "WordPress 以外で作られたサイトのほうが、AIボットをブロックしている割合が高い結果でした（国内9.3%・海外16.4%、WordPress は国内1.1%・海外4.8%）。WordPress 以外の国内サイトは86件と少ない区分です。",
          ],
          table: WP_JA,
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "この調査の数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」と、このページへのリンクを明記すれば、自由に引用・転載できます。そのまま使える1文：",
          ],
          list: [
            "国内Web制作会社の自社サイトで、robots.txt でAIボットを1つ以上ブロックしていたのは1.4%（2,158件中30件）、海外の制作会社サイトでは5.6%（10,423件中579件）だった（Nurevo AEO 調査、2026年11月）。",
            "Web制作会社サイト12,581件のうち、GPTBot をブロックしていたのは3.9%（495件）だったが、OAI-SearchBot は0.2%（21件）だった（Nurevo AEO 調査、2026年11月）。",
            "AIボットをブロックしていたWeb制作会社サイトの93.3%（609件中568件）は、学習用クローラーだけをブロックし、検索用のボットは許可していた（Nurevo AEO 調査、2026年11月）。",
            "robots.txt があるWeb制作会社サイトでAIボットを1つ以上ブロックしていた割合は、調べた23の国・地域のうち日本が1.4%で最も低かった（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "この調査の限界",
          list: [
            "robots.txt の判定はトップページ（/）に対するものです。特定のディレクトリだけをブロックしている場合は「ブロックなし」と数えています。",
            "robots.txt 以外の方法（ファイアウォール、CDNのボット対策、IPでの拒否など）によるブロックは測っていません。実際にAIボットがアクセスできるかどうかとは一致しない場合があります。",
            "robots.txt は「お願い」の仕組みで、ボットが従うかどうかは運営者によります。また、ボット名とその役割は各社が変更することがあります。分類は2026年11月時点の本調査での区分です。",
            "対象はWeb制作会社の自社サイトで、一般企業や店舗のサイト全体の傾向ではありません。リストは当社が集めたもので、すべての制作会社を網羅していません。国によって集めた件数に差があります。",
            "各サイト1回の取得による結果です。トップページに到達できなかったサイトと、robots.txt がなかったサイトは分母に含みません。",
          ],
        },
        {
          heading: "Nurevo の見方（意見）",
          paragraphs: [
            "ここからは事実ではなく当社の意見です。AIボットをブロックしている制作会社サイトはどの国でも少数で、ブロックしているサイトも、多くは学習用だけを止めて検索用は通していました。「AIの学習には使われたくないが、AI検索で紹介されるのは構わない」という線引きをしているサイトが多いように見えます。学習用と検索用でボット名が分かれていることを知らずに一括で拒否すると、意図せずAI検索からも見えにくくなる可能性があります。ただし、robots.txt を整えてもAIの回答に必ず登場するわけではありません。自社の方針に合った設定になっているかを確認しておく価値はあると考えています。",
          ],
        },
        {
          heading: "自社サイト・お客様のサイトを確認するには",
          paragraphs: [
            "[無料チェック](https://nurevo.jp/check)で、AIクローラーの許可状況・llms.txt・構造化データを1分で確認できます。WordPress なら [Nurevo WebMCP プラグイン](https://wordpress.org/plugins/nurevo-webmcp/)で llms.txt と構造化データを出せます。お客様のサイトにまとめて導入したい制作会社の方は[パートナープログラム](https://nurevo.jp/partner/)をご覧ください。",
          ],
        },
      ],
      faqs: [
        { q: "AIクローラーを robots.txt でブロックしているサイトはどのくらいありますか？", a: "この調査では、Web制作会社の自社サイトのうち、国内は2,158件中30件（1.4%）、海外は10,423件中579件（5.6%）がAIボットを1つ以上ブロックしていました（2026年11月）。" },
        { q: "GPTBot と OAI-SearchBot の扱いに違いはありますか？", a: "あります。全体で GPTBot をブロックしていたのは495件（3.9%）でしたが、OAI-SearchBot は21件（0.2%）でした。GPTBot をブロックしていたサイトの96.2%（495件中476件）は OAI-SearchBot を許可していました。" },
        { q: "この数字は一般企業のサイトにも当てはまりますか？", a: "当てはまるとは限りません。対象はWeb制作会社の自社サイトで、robots.txt のトップページ（/）に対する判定だけを見ています。" },
        { q: "数字を記事で使ってもいいですか？", a: "はい。出典「Nurevo AEO 調査（nurevo.jp）」とこのページへのリンクを明記すれば、自由に引用・転載できます。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "あなたのサイトのAIクローラー設定を確認",
        body: "無料チェックで、AIクローラーの許可状況・llms.txt・構造化データが分かります。AIの回答に出ることを保証するものではありません。",
        label: "無料でチェックする",
        href: "/check",
        secondary: { label: "制作会社向けパートナー", href: "/partner/" },
      },
      footnote: "調査：Nurevo AEO（Bestie.合同会社）。記載の社名・サービス名は各社の商標です。個別の会社名・ドメインは公開しません。",
    },
    en: {
      title: "AI Crawler Blocking by Bot and Country (Nov 2026 Survey) | Nurevo",
      description: "12,581 web agency robots.txt files: 1.4% in Japan and 5.6% elsewhere block an AI bot. 93.3% of blockers stop only training crawlers, not search bots.",
      h1: "How web agencies block AI crawlers: 12,581 robots.txt files by bot and country (November 2026)",
      lead: "We read the robots.txt files of web design agencies' own websites. 1.4% in Japan (30 of 2,158) and 5.6% in other countries (579 of 10,423) blocked at least one of 11 AI bots. 93.3% of the blocking sites (568 of 609) blocked only training crawlers and still allowed the search and user-initiated bots (OAI-SearchBot, Claude-SearchBot, PerplexityBot, ChatGPT-User).",
      intro: [
        "Published 2026-11-11. Data aggregated 2026-11-05. Research and writing: Nurevo AEO (Bestie.合同会社). Nurevo sells AI search optimisation (AEO) tools and has an interest in this field.",
        "Our [overview report](/guide/research-japan-web-agencies-ai-search-2026) covers all items for Japan. This report looks only at how robots.txt treats AI bots, bot by bot and country by country.",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "1.4% of Japanese agency websites (30 of 2,158) and 5.6% of agency websites in other countries (579 of 10,423) blocked at least one AI bot. Japan had the lowest share of the 23 countries and regions compared.",
            "Blocking targets training crawlers. Across all sites, 495 (3.9%) blocked GPTBot, but only 21 (0.2%) blocked OpenAI's search crawler OAI-SearchBot. 93.3% of blocking sites (568 of 609) blocked none of the four search or user-initiated bots.",
            "The most common pattern was blocking exactly the seven training crawlers: 62.4% of blocking sites (380 of 609). And 53.6% of sites that name an AI bot in robots.txt (686 of 1,280) name it without blocking it.",
          ],
        },
        {
          heading: "About the survey",
          list: [
            "Population: web design agencies' own websites. In Japan, sites we confirmed as agencies; elsewhere, our own list of agencies. Not business websites in general.",
            "Counts: 20,720 sites attempted; 15,657 home pages reached (2,357 in Japan, 13,300 elsewhere). The base for this report is the 12,581 of those with a robots.txt (2,158 in Japan, 10,423 elsewhere).",
            "What we fetched: each site's home page and /robots.txt, once each (User-Agent: NurevoSurvey/1.0), in early November 2026, aggregated on 5 November.",
            "Method: a robots.txt counts if it returns status 200, is not HTML and has more than 20 characters. For each bot we took the User-agent group that names it (or User-agent: * if none does) and checked, by longest match, whether the home page (/) is disallowed.",
            "AI bots: seven training crawlers (GPTBot, ClaudeBot, anthropic-ai, Google-Extended, CCBot, Bytespider, Applebot-Extended) and four search or user-initiated bots (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, PerplexityBot), 11 in total. The split follows the operators' public descriptions and is our own classification. Googlebot and Bingbot were checked for reference.",
            "The overview report's \"blocks at least one AI bot: 1.3% (28 sites)\" counted six bots (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, OAI-SearchBot). This report counts 11, which gives 1.4% (30 sites) for Japan.",
          ],
        },
        {
          heading: "Results: block rate by bot",
          paragraphs: [
            "Every bot was blocked by 1.3% or fewer of Japanese sites, below the 4–5% seen elsewhere. The seven training crawlers have similar rates because the same sites tend to block them together. The four search and user-initiated bots were blocked by 0.3% or fewer in both groups.",
          ],
          table: BOTS_EN,
        },
        {
          heading: "Stop training, let search through",
          paragraphs: ["We looked at how the 609 sites that block at least one AI bot (30 in Japan, 579 elsewhere) do it."],
          list: [
            "Block only training crawlers, none of the four search or user-initiated bots: 568 (93.3%). Japan 28 of 30, elsewhere 540 of 579.",
            "Block exactly the seven training crawlers and nothing else: 380 (62.4%). Japan 19 of 30, elsewhere 361 of 579.",
            "Of the 495 sites blocking GPTBot, 476 allow OAI-SearchBot (Japan 27 of 27, elsewhere 449 of 468).",
            "Of the 459 sites blocking ClaudeBot, 441 allow Claude-SearchBot (Japan 21 of 21, elsewhere 420 of 438).",
            "Sites that also block Googlebot (the whole site disallowed): 9 outside Japan (0.09%), none in Japan.",
          ],
        },
        {
          heading: "Naming a bot is not the same as blocking it",
          paragraphs: [
            "2.5% of Japanese sites (54) and 11.8% of sites elsewhere (1,226) name at least one AI bot as a User-agent. Of these, 30 in Japan (55.6%) and 564 elsewhere (46.0%) block one; the other 24 and 662 name AI bots but allow them to reach the home page. A fair number of sites explicitly allow AI bots.",
            "Blocking sites were not less likely to have an llms.txt. Outside Japan, 200 of the 579 blocking sites (34.5%) had one, similar to 33.1% of the 9,844 non-blocking sites. In Japan it was 5 of 30 blocking sites (16.7%).",
          ],
        },
        {
          heading: "By country and region",
          paragraphs: [
            "Among the 23 countries and regions with at least 30 sites that have a robots.txt, Japan had the lowest share blocking an AI bot (1.4%), followed by France (1.8%). In the larger groups: United States 4.7%, Australia 4.9%, United Kingdom 5.0%, India 6.5%. In small groups such as South Korea or Malaysia, a single site moves the share noticeably.",
          ],
          table: COUNTRY_EN,
        },
        {
          heading: "WordPress and other platforms",
          paragraphs: [
            "Sites not built on WordPress were more likely to block AI bots (Japan 9.3%, elsewhere 16.4%, against 1.1% and 4.8% on WordPress). The Japanese non-WordPress group is small (86 sites).",
          ],
          table: WP_EN,
        },
        {
          heading: "Citing this research",
          paragraphs: ["You may quote and republish the figures and tables freely if you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. Ready-to-use sentences:"],
          list: [
            "1.4% of Japanese web agency websites (30 of 2,158) blocked at least one AI bot in robots.txt, against 5.6% of agency websites in other countries (579 of 10,423) (Nurevo AEO survey, November 2026).",
            "Of 12,581 web agency websites, 3.9% (495) blocked GPTBot, but only 0.2% (21) blocked OAI-SearchBot (Nurevo AEO survey, November 2026).",
            "93.3% of web agency websites that block AI bots (568 of 609) block only training crawlers and allow AI search bots (Nurevo AEO survey, November 2026).",
            "Among 23 countries and regions, Japan had the lowest share of web agency websites blocking AI bots in robots.txt, at 1.4% (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Limitations",
          list: [
            "The robots.txt check is for the home page (/) only. A site that blocks only certain directories counts as not blocking.",
            "Blocking by other means (firewalls, CDN bot protection, IP rules) is not measured, so the result may differ from whether a bot can actually reach the site.",
            "robots.txt is a request; whether a bot follows it depends on its operator. Operators may also rename bots or change their roles. The classification reflects this survey as of November 2026.",
            "The population is web design agencies' own websites, not businesses in general. The lists are ours and do not cover every agency, and the number of sites differs a lot by country.",
            "Each site was fetched once. Sites whose home page could not be reached, or with no robots.txt, are not in the base.",
          ],
        },
        {
          heading: "Our reading (opinion)",
          paragraphs: [
            "What follows is our opinion, not a finding. In every country, few agency websites block AI bots, and most of those that do stop training crawlers while letting search bots through. Many sites seem to draw the line at \"don't train on us, but do show us in AI search\". Blocking every AI bot without knowing that training and search use different names could make a site harder to find in AI search without meaning to. A tidy robots.txt does not guarantee appearing in AI answers, but we think it is worth checking that the settings match the site's intent.",
          ],
        },
        {
          heading: "Check your own or your clients' sites",
          paragraphs: [
            "The [free check](https://nurevo.jp/check) shows AI crawler access, llms.txt and structured data in about a minute. On WordPress, the [Nurevo WebMCP plugin](https://wordpress.org/plugins/nurevo-webmcp/) publishes an llms.txt and structured data. Agencies that want to roll it out across client sites can see the [partner program](https://nurevo.jp/partner/).",
          ],
        },
      ],
      faqs: [
        { q: "How many websites block AI crawlers in robots.txt?", a: "In this survey of web design agencies' own websites, 30 of 2,158 in Japan (1.4%) and 579 of 10,423 elsewhere (5.6%) blocked at least one AI bot (November 2026)." },
        { q: "Do sites treat GPTBot and OAI-SearchBot differently?", a: "Yes. 495 sites (3.9%) blocked GPTBot but only 21 (0.2%) blocked OAI-SearchBot. 96.2% of the sites blocking GPTBot (476 of 495) allowed OAI-SearchBot." },
        { q: "Do these figures apply to business websites in general?", a: "Not necessarily. The survey covers web design agencies' own websites and checks robots.txt for the home page (/) only." },
        { q: "Can I use these figures in an article?", a: "Yes. Credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page, and you may quote and republish them freely." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Check your site's AI crawler settings",
        body: "The free check shows AI crawler access, llms.txt and structured data. It does not guarantee appearing in AI answers.",
        label: "Run the free check",
        href: "/check",
        secondary: { label: "Partner program for agencies", href: "/partner/" },
      },
      footnote: "Research by Nurevo AEO (Bestie.合同会社). Product and company names are trademarks of their owners. Individual companies and domains are not published.",
    },
  },
};
