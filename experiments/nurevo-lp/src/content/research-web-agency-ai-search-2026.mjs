// Content page: research report. How ready are Japanese web agencies' own
// websites for AI search? Survey of 2026-11-05.
//
// Every number here comes from nurevo-outreach/data/survey/summary_2026-11-05.json
// (produced by survey.js) or from counts over raw_2026-11-05.json. The raw file
// names companies and domains: never publish them. Publish aggregates only, and
// no group of fewer than 30 sites.

const PARTNER = "https://nurevo.jp/partner/";
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";

export default {
  slug: "research-web-agency-ai-search-2026",
  targetQueries: [
    "Web制作会社 AI検索 対応状況 調査",
    "llms.txt 導入率 日本",
    "AIクローラー ブロック 割合 日本",
    "構造化データ 導入率 調査 2026",
    "Japan web agencies AI search readiness survey",
    "llms.txt adoption rate Japan",
  ],
  related: ["llms-txt", "aeo-wordpress", "agency-aeo-monthly-service", "aeo-signals-ai-answers-study"],
  locales: {
    ja: {
      title: "Web制作会社サイトのAI検索対応状況 調査2026｜Nurevo",
      description: "国内Web制作会社の自社サイト2,357件を調査。llms.txt設置は13.6%、AIクローラーを拒否するのは1.3%、JSON-LD構造化データは68.9%でした。",
      h1: "国内Web制作会社の自社サイト2,357件のAI検索対応状況【2026年11月調査】",
      lead: "日本のWeb制作会社の自社サイト2,357件のトップページ・robots.txt・llms.txtを調べました。llms.txtを置いているのは13.6%、robots.txtでAIクローラーを拒否しているのは1.3%、JSON-LD形式の構造化データがあるのは68.9%でした。AIクローラーはほとんど拒否されていない一方で、AI向けの情報（llms.txt・FAQの構造化データ）を用意しているサイトはまだ少数です。",
      intro: [
        "公開：2026年11月5日。集計日：2026年11月5日。調査・執筆：Nurevo AEO（Bestie.合同会社）。Nurevo はAI検索対策のツールを提供しており、この分野に利害関係があります。",
      ],
      sections: [
        {
          heading: "要点",
          list: [
            "llms.txt を設置しているWeb制作会社のサイトは13.6%（2,357件中321件）。",
            "robots.txt で主要なAIクローラーのいずれかを拒否しているのは1.3%（robots.txtがある2,158件中28件）。GPTBotの拒否は1.3%、OAI-SearchBotの拒否は0件でした。",
            "JSON-LD形式の構造化データがあるのは68.9%（1,624件）。そのうち1.7%（27件）は構文が壊れていて読み取れませんでした。FAQPageの構造化データは3.9%。",
          ],
        },
        {
          heading: "調査概要",
          list: [
            "調査対象：日本のWeb制作会社の自社サイト。当社が収集したWeb制作会社のリストのうち日本の会社2,756件（同じドメインは1件として数えます）。",
            "到達件数：2,357件（トップページがHTMLで正常に返ったサイト。残りは接続できない、エラーを返すなど）。割合は特に断りがない限り2,357件に対する値です。",
            "集計日：2026年11月5日（取得は集計日までの1週間以内）。",
            "取得したもの：各サイトのトップページ、/robots.txt、/llms.txt、/llms-full.txt を各1回（User-Agent：NurevoSurvey/1.0）。",
            "判定方法：llms.txt・llms-full.txt は、ステータス200で、HTMLではなく、20文字を超える本文があるものを「あり」としました。構造化データはトップページのJSON-LD（application/ld+json）を解析し、@type を数えました。AIクローラーの拒否は、robots.txt を解析し、各ボットがトップページ（/）を取得できないかで判定しました（ボット名の指定がなければ User-agent: * の規則を適用、最長一致）。WordPress はトップページの wp-content / wp-includes / generator で判定しました。",
            "限界：調べたのはトップページだけで、下層ページの構造化データは含みません。robots.txt はトップページ（/）に対する判定で、一部のディレクトリだけの拒否は数えていません。サーバー側のファイアウォールなどでボットを止めている場合は分かりません。対象はWeb制作会社の自社サイトであり、日本の企業サイト全体の傾向ではありません。",
          ],
        },
        {
          heading: "結果1：基本的なSEOの設定はほぼ整っている",
          paragraphs: [
            "HTTPS・メタディスクリプション・canonical・robots.txt といった従来のSEOの基本は、大半のサイトで設定されていました。制作会社のサイトの91.9%がWordPressで作られていました。",
          ],
          table: {
            head: ["項目", "割合"],
            rows: [
              ["HTTPS", "99.9%"],
              ["WordPress で構築", "91.9%"],
              ["robots.txt がある", "91.6%"],
              ["robots.txt に sitemap の記載（robots.txt があるサイト中）", "92.1%"],
              ["メタディスクリプションがある", "90.8%"],
              ["canonical がある", "84.3%"],
              ["OGP（og:title）がある", "81.0%"],
            ],
            caption: "n＝2,357件（日本のWeb制作会社の自社サイト、2026年11月5日集計）。",
          },
        },
        {
          heading: "結果2：AI向けの情報はまだ少数",
          paragraphs: [
            "AIが内容を読み取りやすくするための項目は、構造化データ（JSON-LD）は約7割にある一方、llms.txt は13.6%、FAQPage の構造化データは3.9%でした。llms-full.txt は0.6%（14件）です。",
          ],
          table: {
            head: ["項目", "割合"],
            rows: [
              ["JSON-LD の構造化データがある", "68.9%"],
              ["Organization / LocalBusiness などの会社情報の構造化データ", "58.3%"],
              ["JSON-LD の構文が壊れている（JSON-LD があるサイト中）", "1.7%"],
              ["microdata（itemtype=schema.org）", "7.8%"],
              ["FAQPage の構造化データ", "3.9%"],
              ["llms.txt がある", "13.6%"],
              ["llms-full.txt がある", "0.6%"],
            ],
            caption: "n＝2,357件。構造化データはトップページのみ。",
          },
          after: [
            "トップページの構造化データで多かった @type は、WebSite（62.4%）、Organization（53.7%）、ListItem（43.4%）、BreadcrumbList（43.0%）、ImageObject（38.1%）、WebPage（34.1%）でした。llms.txt があるサイトの行数の中央値は96行でした。",
          ],
        },
        {
          heading: "結果3：AIクローラーを拒否するサイトはごく少数",
          paragraphs: [
            "robots.txt がある2,158件のうち、主要なAIクローラー（GPTBot・ClaudeBot・PerplexityBot・Google-Extended・CCBot・OAI-SearchBot）のいずれかを拒否していたのは1.3%（28件）でした。robots.txt の中でAIクローラーの名前を指定しているサイト自体が2.5%（54件）で、大半のサイトはAIクローラーについて特に指定していません（指定がなければ取得は許可されます）。",
          ],
          table: {
            head: ["ボット", "トップページを拒否している割合"],
            rows: [
              ["GPTBot（OpenAI）", "1.3%"],
              ["Google-Extended（Google）", "1.1%"],
              ["CCBot（Common Crawl）", "1.1%"],
              ["Bytespider（ByteDance）", "1.1%"],
              ["ClaudeBot（Anthropic）", "1.0%"],
              ["anthropic-ai", "1.0%"],
              ["Applebot-Extended（Apple）", "1.0%"],
              ["ChatGPT-User（OpenAI）", "0.1%"],
              ["PerplexityBot", "0.0%（1件）"],
              ["OAI-SearchBot（OpenAI）", "0%（0件）"],
              ["Claude-SearchBot（Anthropic）", "0%（0件）"],
              ["Googlebot / Bingbot", "0%（0件）"],
            ],
            caption: "n＝robots.txt がある2,158件。トップページ（/）に対する判定。",
          },
          after: [
            "拒否しているサイトでは、学習用のクローラー（GPTBot・Google-Extended・CCBot など）をまとめて拒否し、検索用のクローラー（OAI-SearchBot・Claude-SearchBot・PerplexityBot）は拒否していない形がほとんどでした。",
          ],
        },
        {
          heading: "結果4：WordPress と WordPress 以外の差",
          paragraphs: [
            "WordPress のサイト（2,166件）とそれ以外（191件）では、多くの項目で差がありました。WordPress 以外のサイトは robots.txt がないことが多く（45.0%のみ設置）、AIクローラーを拒否している割合は高めでした。",
          ],
          table: {
            head: ["項目", "WordPress（2,166件）", "WordPress 以外（191件）"],
            rows: [
              ["llms.txt", "14.3%", "6.3%"],
              ["JSON-LD の構造化データ", "72.5%", "28.3%"],
              ["会社情報の構造化データ", "61.3%", "23.6%"],
              ["robots.txt がある", "95.7%", "45.0%"],
              ["AIクローラーのいずれかを拒否（robots.txt があるサイト中）", "1.0%", "9.3%"],
              ["メタディスクリプション", "92.0%", "76.4%"],
              ["canonical", "88.0%", "42.9%"],
              ["AI対応スコアの平均（6点満点）", "4.2", "2.1"],
            ],
            caption: "日本のWeb制作会社の自社サイト。2026年11月5日集計。",
          },
          after: [
            "WordPress のサイトで使われているSEOプラグインは、All in One SEO が35.0%、Yoast SEO が14.4%、Rank Math が1.8%でした（トップページのHTMLから判定）。",
          ],
        },
        {
          heading: "結果5：AI対応スコアの分布",
          paragraphs: [
            "次の6項目を満たす数を「AI対応スコア」（0〜6点）として数えました：①llms.txt がある、②JSON-LD の構造化データがある、③Organization または LocalBusiness の構造化データがある、④robots.txt があり、GPTBot・ClaudeBot・PerplexityBot・OAI-SearchBot のどれも拒否していない、⑤メタディスクリプションがある、⑥canonical がある。平均は4.0点で、6点満点のサイトは10.5%でした。これは当社が今回の集計のために決めた簡易な指標で、AIの回答に登場するかを予測するものではありません。",
          ],
          table: {
            head: ["スコア", "割合"],
            rows: [
              ["6点", "10.5%"],
              ["5点", "41.2%"],
              ["4点", "15.3%"],
              ["3点", "15.7%"],
              ["2点", "10.8%"],
              ["1点", "4.9%"],
              ["0点", "1.7%"],
            ],
            caption: "n＝2,357件。平均4.0点。",
          },
        },
        {
          heading: "参考：海外のWeb制作会社（WordPress のサイト）",
          paragraphs: [
            "同じ方法で調べた海外のWeb制作会社の自社サイトのうち、WordPress のサイト10,033件では、llms.txt が33.1%、JSON-LD の構造化データが92.4%、AIクローラーのいずれかを拒否が4.3%（robots.txt があるサイト中）、AI対応スコアの平均は4.9点でした。日本の WordPress のサイト（14.3%・72.5%・1.0%・4.2点）と比べると、海外は llms.txt と構造化データが多く、AIクローラーの拒否もやや多い結果です。海外の対象リストは国によって集め方が異なるため、国ごとの比較は別のレポートで扱います。",
          ],
        },
        {
          heading: "結果から言えること（ここからは当社の見解です）",
          paragraphs: [
            "事実として、日本のWeb制作会社のサイトはAIクローラーをほとんど拒否しておらず、従来のSEOの設定も整っています。一方、llms.txt や FAQPage のような「AIに向けて情報を整理して渡す」項目は少数にとどまっています。",
            "当社の見解では、これは制作会社がクライアントにAI検索対策を提案する前に、自社サイトで試せる余地が大きいということです。ただし、llms.txt や構造化データがあればAIの回答に必ず登場するわけではありません。当社の別の調査では、サイト内の対策の度合いとPerplexityの回答への登場との間に関係は見られませんでした（[AEOシグナルとAI回答の調査](/ja/guide/aeo-signals-ai-answers-study/)）。サイト内の対策は、AIが会社の事実を正しく読むための土台と考えるのがよいと考えています。",
          ],
        },
        {
          heading: "引用・転載について",
          paragraphs: [
            "このレポートの数字・表は、出典「Nurevo AEO 調査（nurevo.jp）」とこのページへのリンクを明記すれば、自由に引用・転載できます。個別の会社名・サイトは公開しません。",
            "引用しやすい形の要約：",
          ],
          list: [
            "日本のWeb制作会社の自社サイトのうち、llms.txt を設置しているのは13.6%だった（Nurevo AEO 調査、2026年11月、2,357件）。",
            "日本のWeb制作会社の自社サイトで、robots.txt により主要なAIクローラーを拒否しているのは1.3%だった（Nurevo AEO 調査、2026年11月、robots.txt がある2,158件）。",
            "日本のWeb制作会社の自社サイトの68.9%がJSON-LDの構造化データを使っているが、FAQPageの構造化データは3.9%だった（Nurevo AEO 調査、2026年11月、2,357件）。",
            "日本のWeb制作会社の自社サイトの91.9%がWordPressで作られていた（Nurevo AEO 調査、2026年11月、2,357件）。",
            "海外のWeb制作会社のWordPressサイトでは llms.txt の設置が33.1%で、日本（14.3%）の2倍以上だった（Nurevo AEO 調査、2026年11月）。",
          ],
        },
        {
          heading: "自社サイトやクライアントのサイトを確認するには",
          paragraphs: [
            "[無料チェック](/check)で、URLを入れるだけで llms.txt・構造化データ・AIクローラーの許可を確認できます。WordPress なら [Nurevo AEO プラグイン](" + WP_ORG + ")で llms.txt と構造化データを設定できます。クライアントのサイトにまとめて導入したい制作会社向けには[パートナープログラム](" + PARTNER + ")があります。",
          ],
        },
      ],
      faqs: [
        { q: "日本のWeb制作会社のサイトで llms.txt はどのくらい使われていますか？", a: "2026年11月の当社調査では、日本のWeb制作会社の自社サイト2,357件のうち13.6%（321件）が llms.txt を設置していました。llms-full.txt は0.6%でした。" },
        { q: "AIクローラーを拒否している制作会社のサイトは多いですか？", a: "少数です。robots.txt がある2,158件のうち、主要なAIクローラーのいずれかを拒否していたのは1.3%（28件）でした。検索用の OAI-SearchBot を拒否しているサイトはありませんでした。" },
        { q: "この調査の数字は日本の企業サイト全体に当てはまりますか？", a: "当てはまるとは限りません。対象はWeb制作会社の自社サイトで、調べたのはトップページ・robots.txt・llms.txt だけです。一般企業のサイトでは割合が異なる可能性があります。" },
        { q: "数字を記事や資料に使ってもいいですか？", a: "はい。出典「Nurevo AEO 調査（nurevo.jp）」とこのページへのリンクを明記すれば自由に引用・転載できます。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "自社サイトのAI検索対応を無料で確認",
        body: "URLを入れるだけで、llms.txt・構造化データ・AIクローラーの許可などを確認できます。AIの回答に登場するかを保証するものではありません。",
        label: "無料でチェックする",
        href: "/check",
        secondary: { label: "制作会社向けパートナープログラム", href: PARTNER },
      },
      footnote: "調査：Nurevo AEO（Bestie.合同会社）。GPTBot・ClaudeBot などの名称は各社の商標です。Nurevo はこれらの会社と提携関係にありません。",
    },
    en: {
      title: "AI Search Readiness of Japanese Web Agencies: 2026 Survey | Nurevo",
      description: "We checked 2,357 websites of Japanese web agencies: 13.6% have llms.txt, 1.3% block AI crawlers in robots.txt and 68.9% use JSON-LD structured data.",
      h1: "AI search readiness of 2,357 Japanese web agency websites (November 2026 survey)",
      lead: "We fetched the home page, robots.txt and llms.txt of 2,357 websites belonging to web design and development agencies in Japan. 13.6% have an llms.txt file, 1.3% block AI crawlers in robots.txt, and 68.9% have JSON-LD structured data. AI crawlers are rarely blocked, but files and markup written for AI (llms.txt, FAQ structured data) are still uncommon.",
      intro: [
        "Published 2026-11-05. Data aggregated 2026-11-05. Research and writing: Nurevo AEO (Bestie. LLC). Nurevo makes AI-search tools, so we have an interest in this topic.",
      ],
      sections: [
        {
          heading: "Key findings",
          list: [
            "13.6% of Japanese web agency websites have an llms.txt file (321 of 2,357).",
            "1.3% block at least one major AI crawler in robots.txt (28 of the 2,158 sites with a robots.txt). 1.3% block GPTBot; none block OAI-SearchBot.",
            "68.9% have JSON-LD structured data (1,624 sites); 1.7% of those (27) contain JSON-LD that does not parse. Only 3.9% have FAQPage markup.",
          ],
        },
        {
          heading: "Methodology",
          list: [
            "Population: the company websites of web agencies in Japan: 2,756 Japanese companies from a list of web agencies we compiled (one domain counted once).",
            "Reached: 2,357 sites (home page returned HTML successfully; the rest failed to connect or returned errors). Percentages are of these 2,357 unless stated otherwise.",
            "Aggregated: 2026-11-05 (pages fetched within the week before).",
            "Fetched: each site's home page, /robots.txt, /llms.txt and /llms-full.txt, once each (User-Agent: NurevoSurvey/1.0).",
            "Rules: llms.txt and llms-full.txt count as present when they return status 200, are not HTML and have more than 20 characters. Structured data: JSON-LD (application/ld+json) on the home page was parsed and its @type values counted. AI crawler blocking: robots.txt was parsed and each bot checked for whether it may fetch the home page (/) (falling back to User-agent: * when the bot is not named; longest match wins). WordPress: detected from wp-content, wp-includes or the generator tag.",
            "Limits: home pages only, so structured data on inner pages is not counted. robots.txt is judged for / only; blocks on some directories are not counted. Blocking at the firewall or server level is not visible. These are web agencies' own websites, not Japanese business websites in general.",
          ],
        },
        {
          heading: "Finding 1: classic SEO basics are mostly in place",
          paragraphs: [
            "HTTPS, meta descriptions, canonical links and robots.txt are set on most sites. 91.9% of the agency websites run on WordPress.",
          ],
          table: {
            head: ["Item", "Share"],
            rows: [
              ["HTTPS", "99.9%"],
              ["Built on WordPress", "91.9%"],
              ["Has robots.txt", "91.6%"],
              ["Sitemap listed in robots.txt (of sites with robots.txt)", "92.1%"],
              ["Has a meta description", "90.8%"],
              ["Has a canonical link", "84.3%"],
              ["Has Open Graph (og:title)", "81.0%"],
            ],
            caption: "n = 2,357 Japanese web agency websites, aggregated 2026-11-05.",
          },
        },
        {
          heading: "Finding 2: AI-oriented information is still a minority",
          paragraphs: [
            "About seven in ten sites have JSON-LD structured data, but only 13.6% have llms.txt and 3.9% have FAQPage markup. 0.6% (14 sites) have llms-full.txt.",
          ],
          table: {
            head: ["Item", "Share"],
            rows: [
              ["Has JSON-LD structured data", "68.9%"],
              ["Organization / LocalBusiness or similar company markup", "58.3%"],
              ["JSON-LD that does not parse (of sites with JSON-LD)", "1.7%"],
              ["Microdata (itemtype=schema.org)", "7.8%"],
              ["FAQPage markup", "3.9%"],
              ["Has llms.txt", "13.6%"],
              ["Has llms-full.txt", "0.6%"],
            ],
            caption: "n = 2,357. Structured data on the home page only.",
          },
          after: [
            "The most common @type values on home pages were WebSite (62.4%), Organization (53.7%), ListItem (43.4%), BreadcrumbList (43.0%), ImageObject (38.1%) and WebPage (34.1%). The median llms.txt was 96 lines long.",
          ],
        },
        {
          heading: "Finding 3: very few sites block AI crawlers",
          paragraphs: [
            "Of the 2,158 sites with a robots.txt, 1.3% (28) block at least one of the major AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, OAI-SearchBot). Only 2.5% (54) mention any AI crawler by name at all; most sites say nothing about AI crawlers, which means they are allowed.",
          ],
          table: {
            head: ["Bot", "Share blocking the home page"],
            rows: [
              ["GPTBot (OpenAI)", "1.3%"],
              ["Google-Extended (Google)", "1.1%"],
              ["CCBot (Common Crawl)", "1.1%"],
              ["Bytespider (ByteDance)", "1.1%"],
              ["ClaudeBot (Anthropic)", "1.0%"],
              ["anthropic-ai", "1.0%"],
              ["Applebot-Extended (Apple)", "1.0%"],
              ["ChatGPT-User (OpenAI)", "0.1%"],
              ["PerplexityBot", "0.0% (1 site)"],
              ["OAI-SearchBot (OpenAI)", "0% (none)"],
              ["Claude-SearchBot (Anthropic)", "0% (none)"],
              ["Googlebot / Bingbot", "0% (none)"],
            ],
            caption: "n = 2,158 sites with robots.txt. Judged for the home page (/).",
          },
          after: [
            "Sites that do block mostly block training crawlers (GPTBot, Google-Extended, CCBot and similar) together, while leaving search crawlers (OAI-SearchBot, Claude-SearchBot, PerplexityBot) allowed.",
          ],
        },
        {
          heading: "Finding 4: WordPress versus other platforms",
          paragraphs: [
            "WordPress sites (2,166) and other sites (191) differ on most items. Non-WordPress sites often have no robots.txt (only 45.0% do) and block AI crawlers more often.",
          ],
          table: {
            head: ["Item", "WordPress (2,166)", "Not WordPress (191)"],
            rows: [
              ["llms.txt", "14.3%", "6.3%"],
              ["JSON-LD structured data", "72.5%", "28.3%"],
              ["Company markup", "61.3%", "23.6%"],
              ["Has robots.txt", "95.7%", "45.0%"],
              ["Blocks any AI crawler (of sites with robots.txt)", "1.0%", "9.3%"],
              ["Meta description", "92.0%", "76.4%"],
              ["Canonical link", "88.0%", "42.9%"],
              ["Average AI readiness score (out of 6)", "4.2", "2.1"],
            ],
            caption: "Japanese web agency websites, aggregated 2026-11-05.",
          },
          after: [
            "On the WordPress sites, the SEO plugins detected were All in One SEO 35.0%, Yoast SEO 14.4% and Rank Math 1.8% (detected from the home page HTML).",
          ],
        },
        {
          heading: "Finding 5: distribution of the AI readiness score",
          paragraphs: [
            "We counted how many of six items each site meets, as an \"AI readiness score\" from 0 to 6: (1) has llms.txt, (2) has JSON-LD, (3) has Organization or LocalBusiness markup, (4) has a robots.txt that blocks none of GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot, (5) has a meta description, (6) has a canonical link. The average is 4.0, and 10.5% of sites score 6. This is a simple measure we defined for this survey; it does not predict whether a site appears in AI answers.",
          ],
          table: {
            head: ["Score", "Share"],
            rows: [
              ["6", "10.5%"],
              ["5", "41.2%"],
              ["4", "15.3%"],
              ["3", "15.7%"],
              ["2", "10.8%"],
              ["1", "4.9%"],
              ["0", "1.7%"],
            ],
            caption: "n = 2,357. Average 4.0.",
          },
        },
        {
          heading: "For reference: web agencies outside Japan (WordPress sites)",
          paragraphs: [
            "Measured the same way, 10,033 WordPress websites of web agencies outside Japan show llms.txt on 33.1%, JSON-LD on 92.4%, at least one AI crawler blocked on 4.3% (of sites with robots.txt), and an average AI readiness score of 4.9. Compared with Japanese WordPress agency sites (14.3%, 72.5%, 1.0%, 4.2), agencies elsewhere use llms.txt and structured data more, and block AI crawlers slightly more often. The non-Japanese lists were collected differently from country to country, so country comparisons will be covered in separate reports.",
          ],
        },
        {
          heading: "What this suggests (our opinion from here on)",
          paragraphs: [
            "The facts: Japanese web agency websites rarely block AI crawlers and have their classic SEO settings in place, while items that organise information for AI, such as llms.txt and FAQPage markup, remain uncommon.",
            "In our view, this means agencies have plenty of room to try AI-search measures on their own sites before offering them to clients. Having llms.txt or structured data does not guarantee appearing in AI answers, though. In a separate study we found no relationship between on-site measures and appearing in Perplexity's answers ([AEO signals and AI answers study](/guide/aeo-signals-ai-answers-study/)). We see on-site work as the groundwork that lets AI read a company's facts correctly.",
          ],
        },
        {
          heading: "Citing this report",
          paragraphs: [
            "You may quote and republish the figures and tables in this report freely, as long as you credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page. We do not publish the names or websites of individual companies.",
            "Ready-to-quote summary:",
          ],
          list: [
            "13.6% of Japanese web agency websites have an llms.txt file (Nurevo AEO survey, November 2026, n = 2,357).",
            "1.3% of Japanese web agency websites block major AI crawlers in robots.txt (Nurevo AEO survey, November 2026, n = 2,158 sites with robots.txt).",
            "68.9% of Japanese web agency websites use JSON-LD structured data, but only 3.9% use FAQPage markup (Nurevo AEO survey, November 2026, n = 2,357).",
            "91.9% of Japanese web agency websites run on WordPress (Nurevo AEO survey, November 2026, n = 2,357).",
            "33.1% of WordPress websites of web agencies outside Japan have llms.txt, more than twice the Japanese rate of 14.3% (Nurevo AEO survey, November 2026).",
          ],
        },
        {
          heading: "Check your own site or your clients' sites",
          paragraphs: [
            "The [free check](/check) reads llms.txt, structured data and AI crawler access from a single URL. On WordPress, the [Nurevo AEO plugin](" + WP_ORG + ") sets up llms.txt and structured data. Agencies that want to roll it out across client sites can join the [partner program](" + PARTNER + ").",
          ],
        },
      ],
      faqs: [
        { q: "How many Japanese web agency websites use llms.txt?", a: "In our November 2026 survey, 13.6% (321) of 2,357 Japanese web agency websites had llms.txt. 0.6% had llms-full.txt." },
        { q: "Do many agency websites block AI crawlers?", a: "Very few. Of the 2,158 sites with a robots.txt, 1.3% (28) blocked at least one major AI crawler. None blocked the OAI-SearchBot search crawler." },
        { q: "Do these figures apply to all Japanese business websites?", a: "Not necessarily. The survey covers web agencies' own websites and checks only the home page, robots.txt and llms.txt. Other business websites may differ." },
        { q: "Can I use these figures in my article or slides?", a: "Yes. Credit \"Nurevo AEO survey (nurevo.jp)\" and link to this page, and you may quote and republish them freely." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Check your site's AI search readiness for free",
        body: "Enter a URL to check llms.txt, structured data, AI crawler access and more. It does not guarantee appearing in AI answers.",
        label: "Run the free check",
        href: "/check",
        secondary: { label: "Partner program for agencies", href: PARTNER },
      },
      footnote: "Research: Nurevo AEO (Bestie. LLC). GPTBot, ClaudeBot and other names are trademarks of their owners. Nurevo is not affiliated with these companies.",
    },
  },
};
