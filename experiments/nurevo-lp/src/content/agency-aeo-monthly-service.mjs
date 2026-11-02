// Content page: how a web or SEO agency can offer AI search optimization (AEO)
// as a monthly service - scope, monthly work, reporting and pricing logic.
//
// Written 2026-10-30 (JST). Every claim about Nurevo AEO comes from the
// plugin's readme (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt)
// or the partner page (public/partner/index.html). Claims about Google, OpenAI
// and Perplexity come from their own documentation, checked on 2026-10-30 and
// linked in the copy. No market prices for agency services are given on
// purpose: we found no primary source for them.
//
// Agencies join as referral partners only (see the channel rule in
// scripts/check-static.mjs): the copy has the client hold its own Nurevo plan
// and the agency charge for its own work. Keep it that way in every language.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  openai: "https://developers.openai.com/api/docs/bots",
  perplexity: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers.md",
};

export default {
  slug: "agency-aeo-monthly-service",
  targetQueries: [
    "AEO service for agencies",
    "how to sell AI search optimization to clients",
    "AI search optimization monthly retainer",
    "制作会社 AI検索対策 月額",
    "AEO 月額サービス 作業範囲",
    "AI検索最適化 保守 レポート",
  ],
  related: ["aeo-tools-comparison", "local-business-schema-seo-plugins", "llms-txt", "appear-in-chatgpt", "aeo-vs-seo-vs-geo"],
  locales: {
    ja: {
      title: "制作会社がAI検索対策を月額サービスにする方法 | Nurevo",
      description: "制作会社・SEO会社がAI検索対策（AEO）を月額で提供するときの作業範囲、毎月の作業、レポートの中身、価格の決め方を解説。保証しない契約の書き方とツールの選び方も。",
      h1: "制作会社がAI検索対策（AEO）を月額サービスにする方法：作業範囲・レポート・価格の決め方",
      lead: "制作会社がAI検索対策を月額で提供するなら、「初回の実装」はスポットの作業として切り分け、月額の中身は「AIが読む事業情報を正しく保つ保守」と「決めた質問でAIでの見え方を確かめ、報告すること」にするのが現実的です。AIの回答は日々変わるため、掲載や順位は約束せず、作業内容と報告を約束する契約にします。",
      intro: [
        "作成日：2026年10月30日。Google・OpenAI・Perplexityの仕様は、同日に各社の公式ドキュメントで確認したものです。仕様は変わることがあるため、提案前に最新の情報をご確認ください。",
        "この記事は、Webサイトの制作・保守やSEOをすでに提供している会社が、既存のお客様にAI検索対策を追加するときの設計例です。制作会社向けの相場（いくらで売られているか）は、信頼できる一次情報が見つからなかったため書いていません。",
      ],
      sections: [
        {
          heading: "月額にできる作業と、できない約束",
          paragraphs: [
            "AI検索対策（AEO、GEOとも呼ばれます）は、ChatGPT・Perplexity・GoogleのAI Overviewsなどが事業について答えるとき、正しい情報を読める状態にする作業です。[AEOとは](/guide/what-is-aeo)",
            "Googleは、AI OverviewsやAI Modeに表示されるための追加の要件や特別な最適化はなく、通常のSEOのベストプラクティスがそのまま当てはまると説明しています（[Google検索セントラル：AI機能とウェブサイト](" + SRC.googleAi + ")）。つまり、AI検索対策は「SEOとは別の魔法」ではなく、事業の事実を正確に、読める形で出し続ける地道な作業です。だからこそ、月額の保守と相性がよいと言えます。",
            "一方で、AIの回答は同じ質問でも日や回によって変わります。「ChatGPTに必ず出る」「AIで1位」のような約束は、どの会社にもできません。契約書と提案書では、成果ではなく作業と報告を約束しましょう。",
          ],
        },
        {
          heading: "サービスを3つに分ける：初期実装・月次保守・計測と報告",
          table: {
            head: ["区分", "主な作業", "頻度", "お客様に渡すもの"],
            rows: [
              ["初期実装（スポット）", "構造化データ（schema.org JSON-LD）の整備、llms.txtの設置、AIクローラの許可設定、FAQの整備、既存SEOプラグインとの重複確認", "契約時に1回", "実装前後のチェック結果、設定した内容の一覧"],
              ["月次保守", "営業時間・料金・サービスの変更を反映、新しいページをllms.txtに反映、表示テキストと構造化データの食い違いの確認、プラグインの更新", "毎月", "変更した内容の記録"],
              ["計測と報告", "決めた質問をAIに投げて言及・引用を記録、前月との比較、次の改善案", "毎月（または四半期）", "月次レポート"],
            ],
            caption: "初期実装を月額に含める場合は、最低契約期間を設けるなどして回収の見通しを立てておくと安全です。",
          },
        },
        {
          heading: "初期実装のチェックリスト",
          list: [
            "構造化データ：会社や店舗の名前・住所・電話番号・営業時間・業種を、schema.orgのJSON-LDで出しているか。Googleは、LocalBusinessの構造化データで営業時間や部門などを伝えられると説明しています（[Google：LocalBusinessの構造化データ](" + SRC.googleLocal + ")）。HairSalonやDentistなど、より具体的な業種タイプも使えます。",
            "表示内容との一致：構造化データの内容が、ページに見えている文章と一致しているか。Googleも、構造化データを表示テキストと一致させることを推奨しています。",
            "AIクローラの許可：robots.txtで、AI検索が使うクローラを止めていないか。OpenAIは、OAI-SearchBotを拒否したサイトはChatGPTの検索回答に表示されないとしています（[OpenAI：クローラの概要](" + SRC.openai + ")）。PerplexityもPerplexityBotの許可を推奨しています（[Perplexity：クローラ](" + SRC.perplexity + ")）。",
            "学習用クローラは別の判断：GPTBotのようにAIモデルの学習に使うクローラを許可するかどうかは、AI検索への表示とは別の問題です。制作会社が決めず、お客様に選んでもらいましょう。",
            "llms.txt：サイトの概要と主要ページを、AIが読みやすい形で/llms.txtにまとめる。Googleは自社のAI機能のために新しいAI向けファイルは不要としているため、効果を約束せず、補助として扱います。[llms.txtの書き方](/guide/llms-txt)",
            "SEOプラグインとの重複：Yoast SEOやRank Mathがすでに出している構造化データと、二重に同じ事業を出していないか。[SEOプラグインに店舗の構造化データを足す方法](/guide/local-business-schema-seo-plugins)",
          ],
        },
        {
          heading: "毎月やること",
          list: [
            "事実の更新：営業時間、定休日、料金、メニュー、スタッフ、所在地の変更を、ページと構造化データの両方に反映する。AIが古い情報を答える原因の多くは、サイト側の情報が古いことです。",
            "新しいページの反映：お知らせ、導入事例、料金ページなどが増えたら、llms.txtとサイト内のリンクに反映する。",
            "決めた質問でのチェック：「渋谷 歯医者 土曜」のように、お客様の見込み客が実際に聞きそうな質問を数本決めておき、毎月同じ条件でAIに聞いて、言及・引用の有無を記録する。",
            "Search Consoleの確認：GoogleのAI機能からの表示やクリックは、Search Consoleの検索パフォーマンス（ウェブ）に含めて集計されます（[Google検索セントラル](" + SRC.googleAi + ")）。AI機能だけの数字は分けて見られないため、レポートではその旨を書いておきます。",
          ],
        },
        {
          heading: "月次レポートに入れる項目",
          table: {
            head: ["項目", "書き方の例"],
            rows: [
              ["今月の作業", "営業時間の変更を反映、FAQを2問追加、新しい事例ページをllms.txtに追加"],
              ["AIが読める状態か", "構造化データ・llms.txt・AIクローラ設定のチェック結果（前月との比較）"],
              ["AIでの見え方", "決めた質問ごとの言及・引用の有無。何回聞いた結果かも明記する"],
              ["検索からの流入", "Search Consoleの表示回数・クリック数の推移（AI機能分は区別できない旨を添える）"],
              ["来月の提案", "お客様に用意してもらいたい情報（写真、料金表、よくある質問など）"],
            ],
          },
          after: [
            "AIでの見え方は、すべての回答を観測したものではなく、決めた質問を何回か聞いたサンプルです。1回の結果で良し悪しを判断せず、同じ質問・同じ条件での推移を見るよう、最初の報告で説明しておくと誤解を防げます。[AEOツールの比較と選び方](/guide/aeo-tools-comparison)",
          ],
        },
        {
          heading: "価格の決め方：作業時間とツール代から積み上げる",
          paragraphs: [
            "月額の価格は、相場から逆算するより、毎月の作業時間 × 社内の時間単価 ＋ ツール代 ＋ 報告の手間から積み上げるほうが説明しやすく、赤字になりにくい方法です。最初の数か月は作業時間を記録し、見積もりと合っているか確かめましょう。",
            "プランは「保守だけ」「保守＋月次チェック」「保守＋継続計測」のように、計測の深さで分けると、お客様が選びやすくなります。ツール代は、お客様の名義で契約してもらい、制作会社は作業と報告に対して料金をいただく形にすると、費用の内訳が明確になります。",
            "参考までに、Nurevo AEOの場合、実装部分はFree（0円）、評価基準の自動更新はStandard（月3,000円）、AI登場率の継続計測（ベータ、現在はPerplexity）はPro（月14,800円〜）です。計測専門ツールの料金は[AEOツールの比較](/guide/aeo-tools-comparison)にまとめています。",
          ],
        },
        {
          heading: "Nurevoで月額サービスを回す場合",
          paragraphs: [
            "Nurevo AEOのWordPressプラグインは無料で、構造化データ・llms.txt・AIクローラ設定を管理画面から整えられ、Yoast SEO・Rank Math・All in One SEO・Slim SEOの構造化データを置き換えずに不足分だけを足します。初期実装を標準化しやすいのが利点です。",
            "制作会社・SEO会社向けには、社名・ロゴ・ブランドカラーで毎月自動送信できる月次レポート（PDFにも印刷可）、複数サイトを1つのダッシュボードで管理する機能、お客様に送れるStandardプランの支払いリンク、自社サイトに置けるAI診断ウィジェットがあります（ウィジェットは承認されたパートナー向け）。また、紹介したお客様の月額の40%（Stripe手数料控除後）をお支払いする紹介報酬があります（承認制・国内の事業者が対象）。詳しくは[パートナープログラム](/partner/)をご覧ください。",
            "正直に言うと、追えるAIの数やプロンプト数、競合分析の深さでは、計測を専門にするツールのほうが上です。実装と月次の報告はNurevo、計測は別のツール、という組み合わせも選択肢になります。",
          ],
        },
      ],
      faqs: [
        { q: "AI検索対策の月額サービスで成果を保証してよいですか？", a: "おすすめしません。AIの回答は同じ質問でも日や回によって変わり、どの会社も掲載や順位を保証できません。契約では作業内容と報告の頻度・項目を約束し、AIでの見え方は「計測した結果」として報告しましょう。" },
        { q: "SEOの保守契約と別にする必要はありますか？", a: "必須ではありません。GoogleはAI機能にも通常のSEOのベストプラクティスが当てはまるとしており、作業の多くは重なります。既存の保守契約に「構造化データ・llms.txt・AIクローラ設定の維持」と「AIでの見え方の月次チェック」を追加する形でも提供できます。[AEO・SEO・GEOの違い](/guide/aeo-vs-seo-vs-geo)" },
        { q: "何問くらいの質問を追えばよいですか？", a: "決まった正解はありません。お客様の見込み客が実際に聞きそうな質問を少数選び、毎月同じ条件で確かめるところから始めるのが無駄のない方法です。数を増やすほど計測ツールの費用と報告の手間も増えます。" },
        { q: "WordPress以外のサイトでも提供できますか？", a: `できます。構造化データやllms.txt、robots.txtはどのサイトでも設置できます。Nurevoでは、WordPressは無料プラグイン（[WordPress.org](${WP_ORG})）、それ以外のサイトはスニペット、サイトのないお店はホストページで対応しています。` },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、お客様のサイトをAIがどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラ設定の現状がわかります。提案前の診断にもお使いください。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "Google、ChatGPT、OpenAI、Perplexity、WordPress、Yoast SEO、Rank Math、All in One SEO、Slim SEOおよび各製品名は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },

    en: {
      title: "How Agencies Can Offer AI Search Optimization Monthly | Nurevo",
      description: "How a web or SEO agency can offer AI search optimization (AEO) as a monthly service: scope, monthly tasks, the monthly report, and pricing without promising rankings.",
      h1: "How agencies can offer AI search optimization (AEO) as a monthly service: scope, reporting and pricing",
      lead: "If you are an agency adding AI search optimization to your monthly services, treat the initial implementation as a one-off project and make the retainer about two things: keeping the business facts AI reads accurate, and checking a fixed set of questions in AI answers and reporting what you find. AI answers change from day to day, so contract for the work and the reporting, not for mentions or positions.",
      intro: [
        "Written October 30, 2026. What Google, OpenAI and Perplexity say was checked in their own documentation that day. Their guidance can change, so check the current pages before you pitch.",
        "This guide is a service design for agencies that already build, maintain or optimise websites. We do not quote market prices for agency AEO services: we found no reliable primary source for them.",
      ],
      sections: [
        {
          heading: "What a retainer can cover, and what it cannot promise",
          paragraphs: [
            "AI search optimization (AEO, also called GEO) means making sure ChatGPT, Perplexity, Google's AI Overviews and others can read correct facts when they answer questions about a business. [What is AEO?](/guide/what-is-aeo)",
            "Google says there are no additional requirements or special optimizations needed to appear in AI Overviews or AI Mode, and that SEO best practices still apply ([Google Search Central: AI features and your website](" + SRC.googleAi + ")). In other words, AEO is not a separate trick: it is the steady work of publishing a business's facts accurately and in readable form. That is exactly what suits a monthly retainer.",
            "AI answers, on the other hand, vary between days and between runs of the same question. Nobody can promise \"you will appear in ChatGPT\" or \"number one in AI\". In your proposal and contract, promise the work and the reporting, not the outcome.",
          ],
        },
        {
          heading: "Split the service in three: setup, monthly upkeep, measurement and reporting",
          table: {
            head: ["Part", "Main tasks", "How often", "What the client gets"],
            rows: [
              ["Setup (one-off)", "schema.org JSON-LD structured data, llms.txt, AI crawler access, FAQ content, and a check for duplicate markup from the existing SEO plugin", "Once, at the start", "Before-and-after check results and a list of what was set up"],
              ["Monthly upkeep", "Reflect changes to hours, prices and services, add new pages to llms.txt, check that structured data matches visible text, update plugins", "Monthly", "A log of what changed"],
              ["Measurement and reporting", "Ask a fixed set of questions in AI platforms, record mentions and citations, compare with last month, suggest next steps", "Monthly (or quarterly)", "A monthly report"],
            ],
            caption: "If you fold setup into the monthly fee, a minimum term helps you recover the setup work.",
          },
        },
        {
          heading: "Setup checklist",
          list: [
            "Structured data: does the site publish the business name, address, phone number, opening hours and business type as schema.org JSON-LD? Google explains that LocalBusiness structured data can tell it about business hours, departments and more ([Google: LocalBusiness structured data](" + SRC.googleLocal + ")). More specific types such as HairSalon or Dentist are available too.",
            "Matches the page: does the structured data match the text visitors can see? Google also recommends keeping structured data consistent with visible text.",
            "AI crawler access: is robots.txt blocking the crawlers AI search uses? OpenAI says sites that opt out of OAI-SearchBot will not be shown in ChatGPT search answers ([OpenAI: overview of crawlers](" + SRC.openai + ")), and Perplexity recommends allowing PerplexityBot ([Perplexity: crawlers](" + SRC.perplexity + ")).",
            "Training crawlers are a separate decision: whether to allow crawlers that collect content for AI model training, such as GPTBot, is a different question from appearing in AI search. Let the client decide; the agency should not decide it for them.",
            "llms.txt: summarise the site and its key pages for AI at /llms.txt. Google says you don't need new AI text files for its own AI features, so present llms.txt as a helpful extra, not a promise. [How to write llms.txt](/guide/llms-txt)",
            "Duplicates with the SEO plugin: make sure the site is not publishing the same business twice next to what Yoast SEO or Rank Math already outputs. [Adding local business schema to your SEO plugin](/guide/local-business-schema-seo-plugins)",
          ],
        },
        {
          heading: "Every month",
          list: [
            "Keep facts current: reflect changes to opening hours, closing days, prices, menus, staff and location on both the page and the structured data. Outdated answers from AI often start with outdated information on the site.",
            "Add new pages: when news, case studies or pricing pages are added, reflect them in llms.txt and internal links.",
            "Check a fixed set of questions: pick a few questions the client's prospects are likely to ask, such as \"dentist open Saturday in Austin\", ask them in AI platforms under the same conditions every month, and record whether the client is mentioned or cited.",
            "Look at Search Console: impressions and clicks from Google's AI features are included in the Search Console Performance report under the Web search type ([Google Search Central](" + SRC.googleAi + ")). They cannot be split out on their own, so say so in the report.",
          ],
        },
        {
          heading: "What goes in the monthly report",
          table: {
            head: ["Item", "Example"],
            rows: [
              ["Work done this month", "Updated opening hours, added two FAQ entries, added the new case study page to llms.txt"],
              ["Can AI read the site?", "Check results for structured data, llms.txt and AI crawler access, compared with last month"],
              ["How the client appears in AI answers", "Mentions and citations for each tracked question, with how many times each was asked"],
              ["Search traffic", "Search Console impressions and clicks over time, noting that AI feature traffic cannot be separated"],
              ["Next month", "What you need from the client: photos, a price list, common questions"],
            ],
          },
          after: [
            "AI visibility figures are samples from a set of questions asked a few times, not a view of every answer. Explain in the first report that you compare trends for the same questions under the same conditions and do not judge from a single run. [AEO tools compared](/guide/aeo-tools-comparison)",
          ],
        },
        {
          heading: "Pricing: build it up from hours and tool costs",
          paragraphs: [
            "Rather than working back from what others charge, build the monthly fee up from monthly hours × your internal hourly rate + tool costs + reporting time. It is easier to explain and harder to lose money on. Log your hours for the first few months and check them against the estimate.",
            "Tiers that differ by how much you measure, such as \"upkeep only\", \"upkeep + monthly check\" and \"upkeep + ongoing measurement\", are easy for clients to choose between. Having the client hold tool subscriptions in their own name, while you charge for your work and reporting, keeps the cost breakdown clear.",
            "For reference, with Nurevo AEO the implementation is Free ($0), automatic updates to the scoring criteria are Standard ($20/month), and ongoing AI visibility measurement (beta, currently on Perplexity) is Pro (from $99/month). Prices for dedicated monitoring tools are in [AEO tools compared](/guide/aeo-tools-comparison).",
          ],
        },
        {
          heading: "Running the service with Nurevo",
          paragraphs: [
            "The Nurevo AEO WordPress plugin is free. It sets up structured data, llms.txt and AI crawler rules from the admin screen, and adds only what is missing to the structured data of Yoast SEO, Rank Math, All in One SEO or Slim SEO instead of replacing it. That makes setup easy to standardise across client sites.",
            "For web and SEO agencies there are monthly client reports under your own name, logo and brand color, emailed automatically and printable as PDF; every client site in one dashboard; Standard plan payment links you can send to clients; and an AI check widget for your own site (for approved partners). There is also a referral commission of 40% of each referred customer's monthly fee, net of Stripe fees (approval required; payouts currently only to partners based in Japan). See the [partner program](/partner/?lang=en).",
            "To be fair about it: dedicated monitoring tools track more AI platforms and prompts and go deeper on competitor analysis. Using Nurevo for implementation and monthly reporting alongside a separate monitoring tool is a reasonable setup too.",
          ],
        },
      ],
      faqs: [
        { q: "Can an AI search optimization retainer guarantee results?", a: "We advise against it. AI answers vary between days and runs of the same question, and no one can guarantee a mention or a position. Contract for the work, the reporting schedule and what the report covers, and present AI visibility as measured results." },
        { q: "Does it need to be separate from an SEO maintenance contract?", a: "No. Google says SEO best practices apply to its AI features too, so much of the work overlaps. You can add \"maintaining structured data, llms.txt and AI crawler rules\" and \"a monthly AI visibility check\" to an existing maintenance plan. [AEO vs SEO vs GEO](/guide/aeo-vs-seo-vs-geo)" },
        { q: "How many questions should we track?", a: "There is no fixed number. Start with a few questions the client's prospects are likely to ask and check them under the same conditions each month. More questions mean higher monitoring costs and more reporting work." },
        { q: "Can we offer it for sites not built on WordPress?", a: `Yes. Structured data, llms.txt and robots.txt work on any site. Nurevo covers WordPress with a free plugin ([WordPress.org](${WP_ORG})), other sites with a snippet, and businesses without a website with a hosted page.` },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your client's site",
        body: "The free check shows the current state of structured data, llms.txt and AI crawler access, no sign-up required. Use it as a pre-pitch audit.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "Google, ChatGPT, OpenAI, Perplexity, WordPress, Yoast SEO, Rank Math, All in One SEO, Slim SEO and their product names are trademarks of their respective owners. Nurevo is not affiliated with them.",
    },
  },
};
