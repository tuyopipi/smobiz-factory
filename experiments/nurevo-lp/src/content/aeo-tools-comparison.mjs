// Content page: AEO tools compared, and how to choose one.
//
// Written 2026-10-28 (JST). Every claim about Nurevo AEO is one the plugin's
// readme makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt)
// or experiments/webmcp-canary/docs/pro-measurement-implementation.md (Pro
// measurement runs on Perplexity). Claims about other tools come from each
// vendor's own page, checked on 2026-10-28 and linked in the copy. Prices and
// covered AI platforms change often: re-check them and update the date with them.
//
// Trademarks: no logos, no wording that suggests a partnership or endorsement,
// and the trademark note in every locale's footnote.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  otterly: "https://otterly.ai/blog/the-25-best-ai-seo-tools/",
  peec: "https://peec.ai/pricing",
  profound: "https://www.tryprofound.com/pricing",
  semrush: "https://www.semrush.com/kb/1493-ai-visibility-toolkit",
  ahrefs: "https://help.ahrefs.com/en/articles/11064852-what-is-brand-radar-and-how-to-use-it",
};

export default {
  slug: "aeo-tools-comparison",
  targetQueries: [
    "AEO tools comparison",
    "best AEO tools",
    "AI search visibility tools compared",
    "AEOツール 比較",
    "AEOツール おすすめ 選び方",
    "AI検索最適化 ツール",
  ],
  related: ["what-is-aeo", "aeo-vs-seo-vs-geo", "aeo-wordpress", "llms-txt", "appear-in-chatgpt"],
  locales: {
    ja: {
      title: "AEOツール比較と選び方【2026年版】計測型と実装型の違い | Nurevo",
      description: "AEOツールは「AIでの見え方を測る計測型」と「AIが読む情報をサイトに出す実装型」の2種類。Otterly.AI・Peec AI・Profound・Semrush・Ahrefs・Nurevoの対象AIと価格を比べ、選び方を解説。",
      h1: "AEOツールの比較と選び方：計測型と実装型、どちらから始めるか",
      lead: "AEOツールは大きく2種類あります。ChatGPTやGoogleのAIの回答に自社が出ているかを測る「計測型」と、AIが読める形で事業の情報をサイトに載せる「実装型」です。AIが読めない状態で測っても改善につながらないため、多くの中小事業者は、まず実装（無料でできる部分が多い）を整え、そのあと追いたいAIの数と予算に合わせて計測ツールを選ぶのが現実的です。",
      intro: [
        "作成日：2026年10月28日。他社ツールの価格・対象AIは、各社の公式ページで同日に確認したものです。料金や対応AIはよく変わるため、契約前に必ず各社の最新情報をご確認ください。",
        "なお、AIの回答は日によって変わります。どのツールを使っても、AIに必ず掲載される・順位が保証されるということはありません。",
      ],
      sections: [
        {
          heading: "AEOツールは「計測型」と「実装型」の2種類",
          paragraphs: [
            "AEO（Answer Engine Optimization、AIの回答に正しく引用されるための対策。GEOとも呼ばれます）のツールは、役割で分けると次の2つです。[AEOとは](/ja/guide/what-is-aeo/)",
          ],
          table: {
            head: ["", "計測型（AI可視性モニタリング）", "実装型（サイト側の対策）"],
            rows: [
              ["何をするか", "決めた質問（プロンプト）をAIに定期的に投げ、自社名の言及・引用、競合との比較、推移を記録する", "構造化データ（schema.org JSON-LD）・llms.txt・AIクローラの許可など、AIがサイトを読むための情報を出力する"],
              ["わかること・変わること", "「今、AIの回答に出ているか」がわかる。サイト自体は変わらない", "AIが事業の事実（業種・住所・営業時間・サービスなど）を読める状態になる。出ているかどうかは別途確認が必要"],
              ["主なツール", "Otterly.AI、Peec AI、Profound、Semrush AI Visibility Toolkit、Ahrefs Brand Radar", "WordPressプラグイン（Nurevo AEOなど）、手作業での実装"],
              ["向いている人", "すでにサイトの基礎が整っていて、競合と比べた見え方を継続的に追いたい企業・制作会社", "これから対策を始める店舗・中小企業、WordPressで運用している事業者"],
            ],
            caption: "両方の機能を持つツールもあります。表は主な役割での分類です。",
          },
        },
        {
          heading: "主なAEOツールの比較（2026年10月時点）",
          paragraphs: [
            "公式ページで確認できた事実だけを並べています。確認できなかった項目は「公式ページで確認」としています。",
          ],
          table: {
            head: ["ツール", "タイプ", "対象のAI（公式ページの記載）", "公開されている料金", "強み"],
            rows: [
              [`[Otterly.AI](${SRC.otterly})`, "計測型", "ChatGPT、Google AI Overviews、Google AI Mode、Gemini、Perplexity、Microsoft Copilot（有料プラン共通で6つ）", "Lite 月29ドル（15プロンプト）、Standard 月189ドル（100）、Pro 月989ドル（1,000）。14日間の無料トライアル", "低価格から始められ、主要6つのAIを1プランで追える"],
              [`[Peec AI](${SRC.peec})`, "計測型", "ChatGPT、AI Mode、AI Overviews、Copilot、Gemini、Naver AIから3つを選択。Enterpriseは最大13モデル", "Starter・Pro・Advanced（50／150／350プロンプト）とEnterprise。金額は公式ページで確認", "追うAIを選べる。制作会社向けの料金ページもある"],
              [`[Profound](${SRC.profound})`, "計測型（企業向け）", "Enterpriseで最大9つ（ChatGPT、Perplexity、Google AI Mode、Gemini、Copilot、DeepSeek、Claude、Google AI Overviews、Exa Search）", "無料トライアル（50プロンプトを7日間）。Enterpriseは個別見積り", "対象AIが多く、SSOなど大企業向けの機能がある"],
              [`[Semrush AI Visibility Toolkit](${SRC.semrush})`, "計測型", "Google AI Mode、ChatGPT", "月99ドル（1プロジェクト、25プロンプト）。追加プロンプト50件で月60ドル", "プロンプト調査やAIクローラ向けのサイト監査もあり、Semrushの他機能と一緒に使える"],
              [`[Ahrefs Brand Radar](${SRC.ahrefs})`, "計測型", "Google AI Overviews・AI Mode、ChatGPT、Perplexity、Gemini、Copilot", "AIインデックスは有料プランへのアドオン：1プラットフォーム月199ドル、全プラットフォーム月699ドル。Lite以上のプランでカスタムプロンプト追跡", "4億件超のプロンプトのデータで、自社や競合の見え方を広く調べられる"],
              [`[Nurevo AEO](${WP_ORG})`, "実装型＋計測（ベータ）", "実装はAI全般向け（構造化データ・llms.txt・AIクローラ設定）。計測はPerplexity", "Free 0円、Standard 月3,000円（海外は月20ドル）、Pro 月14,800円〜（海外は月99ドル）", "WordPressに無料で実装まで行える。SEOプラグインと重複しない。日本円で契約できる"],
            ],
            caption: "2026年10月28日に各社公式ページで確認。金額は各社ページに記載の通貨・表示のままです。",
          },
          after: [
            "正直に言うと、追えるAIの数・プロンプト数・競合分析やレポートの深さは、計測を専門にするツールのほうが上です。Nurevo AEOの計測（Pro）はベータで、現在はPerplexityの回答をサンプルとして測るものです。一方、サイトに構造化データやllms.txtを実装する部分は計測ツールの多くが担っておらず、Nurevo AEOはそこを無料で行います。",
          ],
        },
        {
          heading: "AEOツールの選び方：5つの確認ポイント",
          list: [
            "まずAIがサイトを読めるか。構造化データ・llms.txt・AIクローラの許可が整っていないなら、計測より先に実装です。現状は[無料のAI可読性チェック](/check)で確かめられます。",
            "どのAIを追いたいか。お客様がChatGPTを使うのか、GoogleのAI Overviewsを見るのかで、必要な対象AIは変わります。対象AIの数は料金に直結します。",
            "何問（プロンプト）を追うか。「渋谷 美容室 おすすめ」のような質問を何本追うかで、必要なプランが決まります。少数から始めて、意味のある質問に絞るのが無駄のない方法です。",
            "すでに契約しているSEOツールがあるか。SemrushやAhrefsを使っているなら、そのアドオンや追加ツールが最も手間が少ない選択肢になることがあります。",
            "予算・通貨・運用する人。ドル建てか円建てか、レポートを誰が読むか、複数サイトをまとめて管理するか（制作会社の場合）も確認しましょう。",
          ],
        },
        {
          heading: "規模・目的別の組み合わせ例",
          table: {
            head: ["こんな場合", "始め方の例"],
            rows: [
              ["WordPressで運用する店舗・中小企業", "Nurevo AEO（無料）で構造化データ・llms.txt・AIクローラ設定を整え、無料チェックで確認。継続的に測りたくなったら、低価格の計測ツールかNurevoのProを検討"],
              ["すでにSemrushやAhrefsを使うマーケティング担当", "契約中ツールのAI可視性機能から始め、足りない対象AIを別ツールで補う"],
              ["多数のAI・多数の質問を追う企業ブランド", "対象AIとプロンプト数の多いPeec AIやProfoundなどを比較検討"],
              ["複数のクライアントサイトを持つ制作会社", "実装はプラグインで標準化し、計測は制作会社向けプランのあるツールでまとめる"],
            ],
          },
          after: ["いずれの場合も、ツールより先に「AIに読んでほしい事実が、サイトに正しく書かれているか」を確認するのが近道です。[ChatGPTに自社が出る仕組み](/ja/guide/appear-in-chatgpt/)も参考にしてください。"],
        },
        {
          heading: "計測ツールの数字を読むときの注意",
          paragraphs: [
            "AIの回答は、同じ質問でも日や回によって変わります。計測ツールの数字は、すべての回答を観測したものではなく、決めた質問を何回か投げたサンプルです。比べるときは、同じ質問・同じAI・同じ条件で測った推移を見て、1回の結果で判断しないようにしましょう。",
            "また、AIの回答に出ていない理由をツールが断定できるわけではありません。サイト側の情報の整備（実装）と、出ているかの確認（計測）を両輪で続けることが大切です。",
          ],
        },
      ],
      faqs: [
        { q: "無料で使えるAEOツールはありますか？", a: `あります。Nurevo AEOはWordPress.orgで無料公開されており、AEOスコア、構造化データ、llms.txt、AIクローラ設定まで無料プランで使えます。計測ツールにも無料トライアルを用意しているものがあります（Otterly.AIは14日間、Profoundは7日間など。2026年10月時点）。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "計測ツールだけ入れれば十分ですか？", a: "計測ツールは「今どう見えているか」を教えてくれますが、サイトを変えるわけではありません。構造化データやllms.txtが整っていない場合は、実装もあわせて行う必要があります。" },
        { q: "SEOツールとAEOツールは何が違いますか？", a: "SEOツールは検索結果の順位を、AEOツールはAIの回答の中で引用・言及されるかを扱います。両方が必要で、AEOはSEOの代わりではありません。[AEO・SEO・GEOの違い](/ja/guide/aeo-vs-seo-vs-geo/)" },
        { q: "AEOツールを使えばAIに必ず表示されますか？", a: "いいえ。AIの回答は日々変わり、どのツールも掲載や順位を保証できません。ツールは、AIが読みやすい状態をつくることと、変化を確かめることを助けるものです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがあなたのサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで現状がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "Otterly.AI、Peec AI、Profound、Semrush、Ahrefsおよび各製品名は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },

    en: {
      title: "AEO Tools Compared (2026): Monitoring vs Implementation | Nurevo",
      description: "AEO tools either measure how you appear in AI answers or publish the facts AI reads on your site. Compare Otterly.AI, Peec AI, Profound, Semrush, Ahrefs and Nurevo.",
      h1: "AEO tools compared: monitoring tools vs implementation tools, and how to choose",
      lead: "AEO tools come in two kinds: monitoring tools that measure whether ChatGPT, Google's AI and others mention you, and implementation tools that publish your business facts in a form AI can read. Measuring a site AI cannot read tells you little, so for most small businesses the practical order is to fix the implementation first (much of it is free), then pick a monitoring tool by how many AI platforms you need to track and your budget.",
      intro: [
        "Written October 28, 2026. Prices and platforms for other tools were checked on each vendor's own page that day. They change often, so check each vendor's current page before you buy.",
        "AI answers also change from day to day. No tool can guarantee that an AI will mention you or rank you anywhere.",
      ],
      sections: [
        {
          heading: "Two kinds of AEO tool: monitoring and implementation",
          paragraphs: [
            "AEO (Answer Engine Optimization, also called GEO) is about being read and cited correctly in AI answers. [What is AEO?](/guide/what-is-aeo/) By what they do, AEO tools split into two groups:",
          ],
          table: {
            head: ["", "Monitoring (AI visibility tracking)", "Implementation (on your site)"],
            rows: [
              ["What it does", "Sends a fixed set of questions (prompts) to AI platforms on a schedule and records mentions, citations, competitors and trends", "Publishes what AI needs to read your site: schema.org JSON-LD, llms.txt and AI crawler access"],
              ["What you get", "Whether you appear in AI answers today. Your site does not change", "AI can read your facts (business type, address, hours, services). Whether you appear still has to be checked"],
              ["Examples", "Otterly.AI, Peec AI, Profound, Semrush AI Visibility Toolkit, Ahrefs Brand Radar", "WordPress plugins such as Nurevo AEO, or hand-built markup"],
              ["Best for", "Teams whose site basics are in place and who want to track visibility against competitors over time", "Local and small businesses starting out, and sites run on WordPress"],
            ],
            caption: "Some tools do a little of both. The table groups them by their main job.",
          },
        },
        {
          heading: "The main AEO tools compared (October 2026)",
          paragraphs: [
            "Only facts we could confirm on each vendor's own page are listed. Where a page did not show a figure, the table says so.",
          ],
          table: {
            head: ["Tool", "Type", "AI platforms (as the vendor lists them)", "Published pricing", "Strengths"],
            rows: [
              [`[Otterly.AI](${SRC.otterly})`, "Monitoring", "ChatGPT, Google AI Overviews, Google AI Mode, Gemini, Perplexity, Microsoft Copilot (six on every paid plan)", "Lite $29/month (15 prompts), Standard $189 (100), Pro $989 (1,000). 14-day free trial", "Low entry price, six major platforms on one plan"],
              [`[Peec AI](${SRC.peec})`, "Monitoring", "Choose 3 of ChatGPT, AI Mode, AI Overviews, Copilot, Gemini and Naver AI. Up to 13 models on Enterprise", "Starter, Pro, Advanced (50 / 150 / 350 prompts) and Enterprise. See the vendor's page for amounts", "Choose which platforms to track. Separate agency pricing"],
              [`[Profound](${SRC.profound})`, "Monitoring (enterprise)", "Up to 9 on Enterprise: ChatGPT, Perplexity, Google AI Mode, Gemini, Copilot, DeepSeek, Claude, Google AI Overviews, Exa Search", "Free trial (50 prompts for 7 days). Enterprise is custom-priced", "Broad platform coverage, SSO and other enterprise features"],
              [`[Semrush AI Visibility Toolkit](${SRC.semrush})`, "Monitoring", "Google AI Mode, ChatGPT", "$99/month (1 project, 25 prompts). 50 more prompts for $60/month", "Prompt research and an AI search site audit, alongside the rest of Semrush"],
              [`[Ahrefs Brand Radar](${SRC.ahrefs})`, "Monitoring", "Google AI Overviews and AI Mode, ChatGPT, Perplexity, Gemini, Copilot", "AI indexes are an add-on to a paid plan: $199/month per platform, $699/month for all. Custom prompt tracking on Lite and above", "Research across 405+ million prompts for your brand and competitors"],
              [`[Nurevo AEO](${WP_ORG})`, "Implementation + monitoring (beta)", "Implementation works for any AI (structured data, llms.txt, crawler rules). Measurement uses Perplexity", "Free $0, Standard $20/month (3,000 JPY in Japan), Pro from $99/month (from 14,800 JPY in Japan)", "Free implementation on WordPress, no duplicate schema with your SEO plugin"],
            ],
            caption: "Checked on each vendor's page on October 28, 2026. Amounts are as each page shows them.",
          },
          after: [
            "To be fair about it: dedicated monitoring tools track more AI platforms, more prompts and go deeper on competitor analysis and reporting than Nurevo. Nurevo AEO's measurement (Pro) is a beta that samples Perplexity answers. What most monitoring tools do not do is publish structured data and llms.txt on your site, and that is the part Nurevo AEO does for free.",
          ],
        },
        {
          heading: "How to choose an AEO tool: five questions",
          list: [
            "Can AI read your site yet? If your structured data, llms.txt and AI crawler access are not in place, implement before you measure. The [free AI readability check](/check?lang=en) shows where you stand.",
            "Which AI platforms matter to you? Whether your customers ask ChatGPT or read Google's AI Overviews decides which platforms you need, and platform count drives price.",
            "How many questions do you need to track? The number of prompts, such as \"best hair salon in Austin\", decides the plan. Start with a few questions that matter and grow from there.",
            "Do you already pay for an SEO suite? If you use Semrush or Ahrefs, their AI visibility features may be the lowest-effort option.",
            "Budget, currency and who uses it. Check the billing currency, who will read the reports, and whether you need to manage many sites at once (agencies).",
          ],
        },
        {
          heading: "Example setups by size and goal",
          table: {
            head: ["If you are", "One way to start"],
            rows: [
              ["A local or small business on WordPress", "Set up structured data, llms.txt and crawler rules with Nurevo AEO (free) and confirm with the free check. Add a low-cost monitoring tool or Nurevo Pro when you want ongoing measurement"],
              ["A marketer already on Semrush or Ahrefs", "Start with your suite's AI visibility features and fill missing platforms with another tool"],
              ["A brand tracking many platforms and prompts", "Compare tools with wide platform and prompt coverage, such as Peec AI or Profound"],
              ["An agency with many client sites", "Standardise implementation with a plugin, and measure with a tool that has agency plans"],
            ],
          },
          after: ["Whichever you pick, the shortest path is to check first that the facts you want AI to repeat are written correctly on your site. See also [how businesses appear in ChatGPT](/guide/appear-in-chatgpt/)."],
        },
        {
          heading: "Reading the numbers from monitoring tools",
          paragraphs: [
            "AI answers vary between days and between runs of the same question. Monitoring figures are samples from a set of questions asked a few times, not a view of every answer. Compare trends measured with the same questions, platform and settings, and do not act on a single run.",
            "A tool also cannot tell you for certain why you are missing from an answer. Keep improving what your site publishes (implementation) and checking whether you appear (monitoring) side by side.",
          ],
        },
      ],
      faqs: [
        { q: "Are there free AEO tools?", a: `Yes. Nurevo AEO is free on WordPress.org, and its free plan includes the AEO score, structured data, llms.txt and AI crawler rules. Several monitoring tools offer free trials (for example 14 days for Otterly.AI and 7 days for Profound, as of October 2026). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Is a monitoring tool enough on its own?", a: "A monitoring tool tells you how you appear today, but it does not change your site. If your structured data or llms.txt are missing, you need implementation as well." },
        { q: "How are AEO tools different from SEO tools?", a: "SEO tools deal with rankings in search results; AEO tools deal with whether AI answers cite or mention you. You need both: AEO does not replace SEO. [AEO vs SEO vs GEO](/guide/aeo-vs-seo-vs-geo/)" },
        { q: "Will an AEO tool guarantee that AI shows my business?", a: "No. AI answers change daily and no tool can guarantee a mention or a position. Tools help you make your site easy for AI to read and see how that changes over time." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your site",
        body: "The free check shows where you stand, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "Otterly.AI, Peec AI, Profound, Semrush, Ahrefs and their product names are trademarks of their respective owners. Nurevo is not affiliated with them.",
    },
  },
};
