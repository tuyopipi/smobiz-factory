// Content page: adding the local-business facts AI needs on top of Yoast SEO,
// Rank Math or All in One SEO, free, with Nurevo AEO.
//
// Every claim about Nurevo AEO here is one the plugin's readme makes
// (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt). Claims
// about the other plugins' plans are dated (October 2026): re-check them when
// those plans change, and update the date with them.
//
// Trademarks: no logos, no wording that suggests a partnership or endorsement,
// and the trademark note in every locale's footnote.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";

export default {
  slug: "local-business-schema-seo-plugins",
  targetQueries: [
    "Yoast local business schema free",
    "Rank Math opening hours schema",
    "AIOSEO local SEO free alternative",
    "Yoast 店舗情報 構造化データ 無料",
    "Rank Math 営業時間 構造化データ",
    "AIOSEO ローカルSEO 無料",
  ],
  related: ["aeo-wordpress", "what-is-aeo", "llms-txt", "aeo-vs-seo-vs-geo"],
  locales: {
    en: {
      title: "Free Local Business Schema for Yoast, Rank Math & AIOSEO | Nurevo",
      description: "Your SEO plugin's free tier publishes your name and logo. Add the address, phone, opening hours, business type, services and FAQ that AI needs, free, with Nurevo AEO.",
      h1: "Add local business schema to Yoast SEO, Rank Math or AIOSEO, free",
      lead: "Keep your SEO plugin. Nurevo AEO, a free WordPress plugin, adds the facts AI needs to describe a local business (address, telephone, opening hours, business type, services and FAQ) into the structured data Yoast SEO, Rank Math or All in One SEO already publishes, without duplicating it.",
      intro: ["Last checked: October 2026. SEO plugin plans change, so check each plugin's own pages for its current features."],
      sections: [
        {
          heading: "What the free tiers of Yoast SEO, Rank Math and AIOSEO publish",
          paragraphs: [
            "When an AI answers a question like \"which dentist near me is open on Saturday\", it needs facts it can read without guessing: what kind of business you are, where you are, how to call you and when you are open. On WordPress, those facts usually come from your SEO plugin's JSON-LD.",
            "The free tiers publish your site as an Organization with a name, a URL and a logo. Most of the local facts sit in paid local SEO add-ons or plans. As of October 2026:",
          ],
          table: {
            head: ["Fact", "Free tiers (October 2026)", "Added by Nurevo AEO (free)"],
            rows: [
              ["Business name, URL, logo", "Published as an Organization by Yoast SEO, Rank Math and AIOSEO", "Left exactly as your SEO plugin publishes it"],
              ["Address, telephone, opening hours", "Yoast SEO and AIOSEO: in their paid local SEO add-ons (Yoast Local SEO, AIOSEO Local SEO). Rank Math: one location's details if you fill in its Local SEO settings; more local SEO features are in its paid plans", "Added to your business node where missing, under the same @id"],
              ["Specific business type", "Organization, unless a local SEO feature sets a type", "A more specific type such as HairSalon or Dentist"],
              ["Services", "Not part of the Organization output", "The services you enter, linked to your business"],
              ["FAQ", "Any FAQPage your SEO plugin publishes is kept", "Your questions, added to the page's FAQPage where the Nurevo FAQ block is on that page"],
              ["WebSite, WebPage, Article, breadcrumbs", "Published by your SEO plugin", "Unchanged"],
            ],
            caption: "As of October 2026. Values your SEO plugin already sets are never overwritten.",
          },
          after: [
            "This is not a criticism of these plugins: they handle search ranking, and Nurevo AEO is built to run next to them, not instead of them.",
          ],
        },
        {
          heading: "How Nurevo AEO fills the gaps without duplicate schema",
          paragraphs: [
            "Nurevo AEO does not print a second set of structured data beside your SEO plugin's. It hooks the filter each plugin uses to build its JSON-LD graph (wpseo_schema_graph in Yoast SEO, rank_math/schema/validated_data in Rank Math, aioseo_schema_output in AIOSEO) and adds only what is missing:",
          ],
          list: [
            "Address, telephone, opening hours, description and email go onto your existing business node, under the same @id.",
            "A value your SEO plugin already sets is never overwritten. If you filled in Rank Math's Local SEO settings, those values stay.",
            "Services you enter are added and linked to your business.",
            "FAQ questions you enter are added to the page's FAQPage only on the page that shows the Nurevo FAQ block or the [nurevo_faq] shortcode, skipping questions it already answers.",
            "WebSite, WebPage, Article and breadcrumbs stay exactly as your SEO plugin publishes them.",
          ],
          after: [
            "The page ends up with one graph describing one business, with no duplicates. With any other setup (SEOPress, The SEO Framework, a theme's own schema, or no SEO plugin), Nurevo AEO prints its own graph and puts the business facts under the existing business @id, so the two still describe one business.",
          ],
        },
        {
          heading: "Set it up in five steps",
          list: [
            `Install Nurevo AEO from [WordPress.org](${WP_ORG}) (Plugins > Add New, search for "Nurevo AEO") and activate it. Keep your SEO plugin active.`,
            "The setup wizard opens once. Choose the kind of site (local business, online shop or B2B), confirm the name, address, telephone, opening hours and description, and choose what to publish for AI.",
            "Check the facts the plugin filled in from your existing settings. It only fills blank fields, so nothing you typed is replaced, and the wizard reads your opening hours back to you as they will be published.",
            "Enter your services and questions under Nurevo AEO > Settings, and place the Nurevo FAQ block (or [nurevo_faq]) on the page where the FAQ should appear.",
            "Open Nurevo AEO > AEO Score, read what the diagnosis sends, tick the consent box and press Run diagnosis. Then apply the one-click fixes the checklist offers.",
          ],
          after: [
            "To see what AI reads from the outside, run the [free AI readability check](/check?lang=en) on your home page. More on the WordPress side: [AEO for WordPress](/guide/aeo-wordpress/).",
          ],
        },
        {
          heading: "What is free",
          paragraphs: ["Everything on this page runs on the free plan, with no license key and no trial period:"],
          list: [
            "The AEO score: 0 to 100, with traffic-light alerts and a checklist of what to fix.",
            "One-click fixes for basic structured data, llms.txt and AI crawler access.",
            "Server-rendered schema.org JSON-LD, so crawlers that never run JavaScript still read it.",
            "llms.txt at /llms.txt, built inside the plugin from your WordPress content. [What is llms.txt?](/guide/llms-txt/)",
            "AI crawler rules in robots.txt for the crawlers AI search uses to read and cite pages.",
            "Site types for local businesses, online shops and B2B companies.",
          ],
          after: ["The paid plans add an always-current ruleset (Standard) and AI visibility measurement in beta (Pro). Nothing on this page needs them."],
        },
        {
          heading: "What structured data can and cannot do",
          paragraphs: [
            "Structured data helps AI read your facts correctly: the right hours, the right phone number, the right kind of business. It does not decide what an AI says. No tool can guarantee that an AI will mention you, and Nurevo does not promise that.",
          ],
        },
      ],
      faqs: [
        { q: "Does Nurevo AEO duplicate my SEO plugin's schema?", a: "No. With Yoast SEO, Rank Math or All in One SEO it adds only the missing facts into the graph your SEO plugin already publishes, under the same business @id, and never overwrites a value the plugin sets. The page keeps one graph describing one business." },
        { q: "Do I need to remove Yoast SEO, Rank Math or AIOSEO?", a: "No. Keep your SEO plugin for search ranking. Nurevo AEO adds the facts AI needs on top of it." },
        { q: "Is Nurevo AEO free?", a: "Yes. The business facts, services, FAQ, AEO score, one-click fixes, JSON-LD, llms.txt and AI crawler rules are all on the free plan. The paid plans only add an always-current ruleset and AI visibility measurement (beta)." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Add the missing facts to your SEO plugin's schema, free",
        body: "Nurevo AEO is free on WordPress.org. Not sure what AI reads today? Run the free check first. No sign-up required.",
        label: "Get Nurevo AEO on WordPress.org",
        href: WP_ORG,
        secondary: { label: "Free AI readability check", href: "/check" },
      },
      footnote: "Yoast SEO is a trademark of Yoast BV, Rank Math of Rank Math PVT. LTD., and All in One SEO (AIOSEO) of Awesome Motive. Nurevo is not affiliated with them.",
    },

    ja: {
      title: "Yoast・Rank Math・AIOSEOに店舗情報の構造化データを無料で追加 | Nurevo",
      description: "SEOプラグインの無料版が出すのは名前とロゴまで。AIが必要とする住所・電話番号・営業時間・業種・サービス・FAQを、Nurevo AEOで無料で追加する方法。",
      h1: "Yoast SEO・Rank Math・AIOSEOに店舗情報の構造化データを無料で足す方法",
      lead: "SEOプラグインはそのままで大丈夫です。無料のWordPressプラグイン「Nurevo AEO」が、AIが店舗を説明するのに必要な情報（住所・電話番号・営業時間・業種・サービス・FAQ）を、Yoast SEO・Rank Math・All in One SEOがすでに出している構造化データに、重複させずに追加します。",
      intro: ["最終確認：2026年10月。各SEOプラグインのプランは変わることがあるため、最新の機能は各プラグインの公式ページでご確認ください。"],
      sections: [
        {
          heading: "Yoast SEO・Rank Math・AIOSEOの無料版が出しているもの",
          paragraphs: [
            "AIが「近くで土曜に開いている歯医者は？」のような質問に答えるとき、推測せずに読める事実が必要です。何の業種か、どこにあるか、電話番号、営業時間。WordPressでは、こうした事実は通常SEOプラグインのJSON-LDから読まれます。",
            "無料版は、サイトを名前・URL・ロゴを持つOrganizationとして出力します。店舗情報の多くは有料のローカルSEOアドオンやプランに含まれています。2026年10月時点では次のとおりです。",
          ],
          table: {
            head: ["情報", "無料版（2026年10月時点）", "Nurevo AEOが追加（無料）"],
            rows: [
              ["事業名・URL・ロゴ", "Yoast SEO・Rank Math・AIOSEOともOrganizationとして出力", "SEOプラグインの出力をそのまま維持"],
              ["住所・電話番号・営業時間", "Yoast SEOとAIOSEO：有料のローカルSEOアドオン（Yoast Local SEO、AIOSEO Local SEO）に含まれる。Rank Math：Local SEO設定に入力すれば1拠点分を出力、それ以上のローカルSEO機能は有料プラン", "欠けている場合に、同じ@idの事業ノードへ追加"],
              ["具体的な業種", "ローカルSEO機能で設定しない限りOrganization", "HairSalon・Dentistなどの具体的な業種"],
              ["サービス", "Organizationの出力には含まれない", "入力したサービスを事業に紐づけて追加"],
              ["FAQ", "SEOプラグインが出すFAQPageはそのまま", "Nurevo FAQブロックを置いたページで、そのページのFAQPageに質問を追加"],
              ["WebSite・WebPage・Article・パンくず", "SEOプラグインが出力", "変更なし"],
            ],
            caption: "2026年10月時点。SEOプラグインがすでに設定している値は上書きしません。",
          },
          after: ["これらのプラグインを否定するものではありません。検索順位の対策はSEOプラグインの役割で、Nurevo AEOはその代わりではなく、隣で動くように作られています。"],
        },
        {
          heading: "Nurevo AEOが重複なしで不足分を埋める仕組み",
          paragraphs: [
            "Nurevo AEOは、SEOプラグインの構造化データの横に2つ目のセットを出しません。各プラグインがJSON-LDのグラフを組み立てるフィルター（Yoast SEOのwpseo_schema_graph、Rank Mathのrank_math/schema/validated_data、AIOSEOのaioseo_schema_output）にフックし、欠けているものだけを追加します。",
          ],
          list: [
            "住所・電話番号・営業時間・説明・メールアドレスを、既存の事業ノードに同じ@idで追加します。",
            "SEOプラグインがすでに設定している値は上書きしません。Rank MathのLocal SEO設定に入力済みなら、その値が残ります。",
            "入力したサービスを追加し、事業に紐づけます。",
            "入力したFAQの質問は、Nurevo FAQブロックか[nurevo_faq]ショートコードを置いたページでのみ、そのページのFAQPageに追加します。すでに回答済みの質問は追加しません。",
            "WebSite・WebPage・Article・パンくずは、SEOプラグインの出力のまま変えません。",
          ],
          after: [
            "結果として、ページには1つの事業を説明する1つのグラフだけが残り、重複はありません。それ以外の構成（SEOPress、The SEO Framework、テーマ独自のスキーマ、SEOプラグインなし）では、Nurevo AEOが自前のグラフを出力し、事業の情報は既存の事業@idの下に入れるので、やはり1つの事業として読まれます。",
          ],
        },
        {
          heading: "設定は5ステップ",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEOをインストールして有効化します（プラグイン > 新規追加で「Nurevo AEO」を検索）。SEOプラグインは有効のままにします。`,
            "初回だけセットアップウィザードが開きます。サイトの種類（店舗・ネットショップ・B2B）を選び、名前・住所・電話番号・営業時間・説明を確認し、AI向けに公開する内容を選びます。",
            "既存の設定から自動で入力された情報を確認します。空欄だけを埋めるので、あなたが入力した値は置き換わりません。営業時間は、公開される形でウィザードが読み上げて確認できます。",
            "Nurevo AEOの設定画面でサービスとFAQを入力し、FAQを載せたいページにNurevo FAQブロック（または[nurevo_faq]）を置きます。",
            "AEOスコア画面で診断が送信する内容を確認し、同意にチェックを入れて診断を実行します。チェックリストに出るワンクリック修正を適用します。",
          ],
          after: [
            "外からAIにどう読まれているかは、トップページのURLで[無料のAI可読チェック](/check)を試してください。WordPress全般の話は[WordPressのAEO](/ja/guide/aeo-wordpress/)へ。",
          ],
        },
        {
          heading: "無料でできること",
          paragraphs: ["このページの内容はすべて無料プランで動きます。ライセンスキーも試用期間もありません。"],
          list: [
            "AEOスコア：0〜100点、信号色のアラートと修正すべき項目のチェックリスト。",
            "基本の構造化データ・llms.txt・AIクローラ許可のワンクリック修正。",
            "サーバー側で出力するschema.org JSON-LD。JavaScriptを実行しないクローラにも読まれます。",
            "/llms.txt：WordPressのコンテンツからプラグイン内で生成。[llms.txtとは](/ja/guide/llms-txt/)",
            "AI検索がページを読み、引用するためのクローラをrobots.txtで許可するルール。",
            "店舗・ネットショップ・B2B企業それぞれのサイト種別。",
          ],
          after: ["有料プランで追加されるのは、常に最新の判定基準（Standard）とAI表示状況の計測（Pro、ベータ）だけです。このページの内容には必要ありません。"],
        },
        {
          heading: "構造化データでできること・できないこと",
          paragraphs: [
            "構造化データは、AIがあなたの情報を正しく読む助けになります。正しい営業時間、正しい電話番号、正しい業種。ただし、AIが何を答えるかを決めるものではありません。AIに必ず紹介されることを保証できるツールはなく、Nurevoもそれを約束しません。",
          ],
        },
      ],
      faqs: [
        { q: "Nurevo AEOはSEOプラグインのスキーマと重複しますか？", a: "しません。Yoast SEO・Rank Math・All in One SEOがある場合、そのプラグインがすでに出しているグラフに、欠けている情報だけを同じ事業@idで追加し、プラグインが設定した値は上書きしません。ページには1つの事業を説明する1つのグラフが残ります。" },
        { q: "Yoast SEO・Rank Math・AIOSEOを削除する必要はありますか？", a: "ありません。検索順位のためにSEOプラグインはそのまま使ってください。Nurevo AEOはその上に、AIが必要とする情報を足します。" },
        { q: "Nurevo AEOは無料ですか？", a: "はい。事業情報・サービス・FAQ・AEOスコア・ワンクリック修正・JSON-LD・llms.txt・AIクローラのルールは、すべて無料プランで使えます。有料プランで追加されるのは、常に最新の判定基準とAI表示状況の計測（ベータ）だけです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "SEOプラグインのスキーマに、足りない店舗情報を無料で追加",
        body: "Nurevo AEOはWordPress.orgで無料公開しています。今AIにどう読まれているか分からなければ、まず無料チェックを。登録は不要です。",
        label: "WordPress.orgでNurevo AEOを入手",
        href: WP_ORG,
        secondary: { label: "無料AI可読チェック", href: "/check" },
      },
      footnote: "Yoast SEOはYoast BVの、Rank MathはRank Math PVT. LTD.の、All in One SEO（AIOSEO）はAwesome Motiveの商標です。Nurevoはこれらの企業と提携関係にありません。",
    },

    zh: {
      title: "为 Yoast、Rank Math、AIOSEO 免费添加本地商家结构化数据 | Nurevo",
      description: "SEO 插件的免费版只输出名称和标志。用 Nurevo AEO 免费补上 AI 需要的地址、电话、营业时间、业态、服务和 FAQ。",
      h1: "免费为 Yoast SEO、Rank Math 或 AIOSEO 添加本地商家结构化数据",
      lead: "SEO 插件照常使用即可。免费的 WordPress 插件 Nurevo AEO 会把 AI 描述一家本地商家所需的信息（地址、电话、营业时间、业态、服务和 FAQ）添加到 Yoast SEO、Rank Math 或 All in One SEO 已经输出的结构化数据中，不会重复输出。",
      intro: ["最后核对：2026 年 10 月。各 SEO 插件的套餐可能变化，请以各插件官方页面的当前功能为准。"],
      sections: [
        {
          heading: "Yoast SEO、Rank Math、AIOSEO 免费版输出了什么",
          paragraphs: [
            "当 AI 回答“附近周六营业的牙科诊所”这类问题时，它需要无需猜测就能读取的事实：属于什么业态、在哪里、电话多少、何时营业。在 WordPress 上，这些事实通常来自 SEO 插件的 JSON-LD。",
            "免费版会把网站输出为带有名称、URL 和标志的 Organization。大部分本地信息属于付费的本地 SEO 插件或套餐。截至 2026 年 10 月：",
          ],
          table: {
            head: ["信息", "免费版（2026 年 10 月）", "Nurevo AEO 添加（免费）"],
            rows: [
              ["商家名称、URL、标志", "Yoast SEO、Rank Math、AIOSEO 均以 Organization 输出", "完全保留 SEO 插件的输出"],
              ["地址、电话、营业时间", "Yoast SEO 与 AIOSEO：包含在付费本地 SEO 扩展中（Yoast Local SEO、AIOSEO Local SEO）。Rank Math：在其 Local SEO 设置中填写后可输出一个地点，更多本地 SEO 功能在付费套餐中", "缺少时，以同一个 @id 添加到商家节点"],
              ["具体业态", "除非由本地 SEO 功能设置，否则为 Organization", "HairSalon、Dentist 等更具体的类型"],
              ["服务", "不属于 Organization 输出", "你填写的服务，并关联到商家"],
              ["FAQ", "保留 SEO 插件输出的 FAQPage", "在放置了 Nurevo FAQ 区块的页面，把问题添加到该页的 FAQPage"],
              ["WebSite、WebPage、Article、面包屑", "由 SEO 插件输出", "不变"],
            ],
            caption: "截至 2026 年 10 月。SEO 插件已设置的值绝不会被覆盖。",
          },
          after: ["这并非否定这些插件：它们负责搜索排名，Nurevo AEO 的设计是与它们并行工作，而不是取而代之。"],
        },
        {
          heading: "Nurevo AEO 如何补齐缺失信息而不重复",
          paragraphs: [
            "Nurevo AEO 不会在 SEO 插件的结构化数据旁边再输出一套。它挂接各插件构建 JSON-LD 图时使用的过滤器（Yoast SEO 的 wpseo_schema_graph、Rank Math 的 rank_math/schema/validated_data、AIOSEO 的 aioseo_schema_output），只添加缺少的部分：",
          ],
          list: [
            "地址、电话、营业时间、简介和邮箱以同一个 @id 添加到现有商家节点。",
            "SEO 插件已设置的值绝不覆盖。如果你已填写 Rank Math 的 Local SEO 设置，这些值会保留。",
            "你填写的服务会被添加并关联到商家。",
            "你填写的 FAQ 问题只会在显示 Nurevo FAQ 区块或 [nurevo_faq] 短代码的页面上添加到该页的 FAQPage，已回答的问题会跳过。",
            "WebSite、WebPage、Article 和面包屑保持 SEO 插件的原样输出。",
          ],
          after: [
            "最终页面只有一个图、描述一家商家，没有重复。其他配置下（SEOPress、The SEO Framework、主题自带的结构化数据或未使用 SEO 插件），Nurevo AEO 会输出自己的图，并把商家信息放在已有的商家 @id 下，两者仍描述同一家商家。",
          ],
        },
        {
          heading: "五步完成设置",
          list: [
            `从 [WordPress.org](${WP_ORG}) 安装并启用 Nurevo AEO（插件 > 安装插件，搜索“Nurevo AEO”）。SEO 插件保持启用。`,
            "设置向导只会打开一次。选择网站类型（本地商家、网店或 B2B），确认名称、地址、电话、营业时间和简介，并选择要向 AI 公开的内容。",
            "检查插件根据现有设置自动填写的信息。它只填写空白字段，不会替换你输入的内容；向导会按将要发布的形式复述营业时间。",
            "在 Nurevo AEO > Settings 中填写服务和问题，并在要显示 FAQ 的页面放置 Nurevo FAQ 区块（或 [nurevo_faq]）。",
            "打开 Nurevo AEO > AEO Score，阅读诊断会发送的内容，勾选同意并点击 Run diagnosis，然后应用清单中的一键修复。",
          ],
          after: ["想从外部查看 AI 读到了什么，可以用首页网址运行[免费的 AI 可读性检测](/check?lang=zh)。"],
        },
        {
          heading: "免费包含的功能",
          paragraphs: ["本页所述全部在免费套餐中运行，无需许可证密钥，也没有试用期："],
          list: [
            "AEO 评分：0 到 100 分，带红黄绿提醒和待修复清单。",
            "基础结构化数据、llms.txt 和 AI 爬虫访问的一键修复。",
            "服务器端输出的 schema.org JSON-LD，不运行 JavaScript 的爬虫也能读取。",
            "/llms.txt：由插件根据 WordPress 内容生成。",
            "在 robots.txt 中允许 AI 搜索用于读取和引用页面的爬虫。",
            "适用于本地商家、网店和 B2B 企业的网站类型。",
          ],
          after: ["付费套餐只增加始终最新的规则集（Standard）和 AI 曝光度测量（Pro，测试版），本页内容都不需要它们。"],
        },
        {
          heading: "结构化数据能做什么、不能做什么",
          paragraphs: [
            "结构化数据帮助 AI 正确读取你的信息：正确的营业时间、正确的电话、正确的业态。但它不能决定 AI 说什么。没有任何工具能保证 AI 一定会提到你，Nurevo 也不做这样的承诺。",
          ],
        },
      ],
      faqs: [
        { q: "Nurevo AEO 会与 SEO 插件的结构化数据重复吗？", a: "不会。使用 Yoast SEO、Rank Math 或 All in One SEO 时，它只把缺少的信息以同一个商家 @id 添加到 SEO 插件已输出的图中，绝不覆盖插件设置的值。页面始终只有一个描述一家商家的图。" },
        { q: "需要删除 Yoast SEO、Rank Math 或 AIOSEO 吗？", a: "不需要。SEO 插件继续负责搜索排名，Nurevo AEO 在其基础上补充 AI 需要的信息。" },
        { q: "Nurevo AEO 免费吗？", a: "免费。商家信息、服务、FAQ、AEO 评分、一键修复、JSON-LD、llms.txt 和 AI 爬虫规则都在免费套餐中。付费套餐只增加始终最新的规则集和 AI 曝光度测量（测试版）。" },
      ],
      relatedHeading: "相关指南",
      cta: {
        heading: "免费为 SEO 插件的结构化数据补上缺失的商家信息",
        body: "Nurevo AEO 在 WordPress.org 免费提供。不确定 AI 现在读到了什么？先做免费检测，无需注册。",
        label: "在 WordPress.org 获取 Nurevo AEO",
        href: WP_ORG,
        secondary: { label: "免费 AI 可读性检测", href: "/check" },
      },
      footnote: "Yoast SEO 是 Yoast BV 的商标，Rank Math 是 Rank Math PVT. LTD. 的商标，All in One SEO（AIOSEO）是 Awesome Motive 的商标。Nurevo 与上述公司无隶属关系。",
    },

    "zh-TW": {
      title: "為 Yoast、Rank Math、AIOSEO 免費加入在地商家結構化資料 | Nurevo",
      description: "SEO 外掛的免費版只輸出名稱和標誌。用 Nurevo AEO 免費補上 AI 需要的地址、電話、營業時間、業態、服務和 FAQ。",
      h1: "免費為 Yoast SEO、Rank Math 或 AIOSEO 加入在地商家結構化資料",
      lead: "SEO 外掛照常使用即可。免費的 WordPress 外掛 Nurevo AEO 會把 AI 描述一家在地商家所需的資訊（地址、電話、營業時間、業態、服務和 FAQ）加入 Yoast SEO、Rank Math 或 All in One SEO 已輸出的結構化資料中，不會重複輸出。",
      intro: ["最後核對：2026 年 10 月。各 SEO 外掛的方案可能變動，請以各外掛官方頁面的現行功能為準。"],
      sections: [
        {
          heading: "Yoast SEO、Rank Math、AIOSEO 免費版輸出了什麼",
          paragraphs: [
            "當 AI 回答「附近週六有營業的牙醫」這類問題時，它需要不必猜測就能讀取的事實：屬於什麼業態、在哪裡、電話多少、何時營業。在 WordPress 上，這些事實通常來自 SEO 外掛的 JSON-LD。",
            "免費版會把網站輸出為帶有名稱、URL 和標誌的 Organization。大部分在地資訊屬於付費的在地 SEO 擴充或方案。截至 2026 年 10 月：",
          ],
          table: {
            head: ["資訊", "免費版（2026 年 10 月）", "Nurevo AEO 加入（免費）"],
            rows: [
              ["商家名稱、URL、標誌", "Yoast SEO、Rank Math、AIOSEO 皆以 Organization 輸出", "完全保留 SEO 外掛的輸出"],
              ["地址、電話、營業時間", "Yoast SEO 與 AIOSEO：包含在付費的在地 SEO 擴充中（Yoast Local SEO、AIOSEO Local SEO）。Rank Math：在其 Local SEO 設定中填寫後可輸出一個據點，更多在地 SEO 功能在付費方案中", "缺少時，以同一個 @id 加入商家節點"],
              ["具體業態", "除非由在地 SEO 功能設定，否則為 Organization", "HairSalon、Dentist 等更具體的類型"],
              ["服務", "不屬於 Organization 輸出", "你填寫的服務，並連結到商家"],
              ["FAQ", "保留 SEO 外掛輸出的 FAQPage", "在放置了 Nurevo FAQ 區塊的頁面，把問題加入該頁的 FAQPage"],
              ["WebSite、WebPage、Article、麵包屑", "由 SEO 外掛輸出", "不變"],
            ],
            caption: "截至 2026 年 10 月。SEO 外掛已設定的值絕不會被覆寫。",
          },
          after: ["這並非否定這些外掛：它們負責搜尋排名，Nurevo AEO 的設計是與它們並行運作，而不是取而代之。"],
        },
        {
          heading: "Nurevo AEO 如何補齊缺少的資訊而不重複",
          paragraphs: [
            "Nurevo AEO 不會在 SEO 外掛的結構化資料旁邊再輸出一套。它掛接各外掛建立 JSON-LD 圖時使用的篩選器（Yoast SEO 的 wpseo_schema_graph、Rank Math 的 rank_math/schema/validated_data、AIOSEO 的 aioseo_schema_output），只加入缺少的部分：",
          ],
          list: [
            "地址、電話、營業時間、簡介和電子郵件以同一個 @id 加入現有的商家節點。",
            "SEO 外掛已設定的值絕不覆寫。如果你已填寫 Rank Math 的 Local SEO 設定，這些值會保留。",
            "你填寫的服務會被加入並連結到商家。",
            "你填寫的 FAQ 問題只會在顯示 Nurevo FAQ 區塊或 [nurevo_faq] 短代碼的頁面上加入該頁的 FAQPage，已回答的問題會略過。",
            "WebSite、WebPage、Article 和麵包屑維持 SEO 外掛的原樣輸出。",
          ],
          after: [
            "最終頁面只有一個圖、描述一家商家，沒有重複。其他配置下（SEOPress、The SEO Framework、佈景主題自帶的結構化資料，或未使用 SEO 外掛），Nurevo AEO 會輸出自己的圖，並把商家資訊放在既有的商家 @id 下，兩者仍描述同一家商家。",
          ],
        },
        {
          heading: "五個步驟完成設定",
          list: [
            `從 [WordPress.org](${WP_ORG}) 安裝並啟用 Nurevo AEO（外掛 > 安裝外掛，搜尋「Nurevo AEO」）。SEO 外掛保持啟用。`,
            "設定精靈只會開啟一次。選擇網站類型（在地商家、網路商店或 B2B），確認名稱、地址、電話、營業時間和簡介，並選擇要對 AI 公開的內容。",
            "檢查外掛依現有設定自動填入的資訊。它只填寫空白欄位，不會取代你輸入的內容；精靈會以實際發布的形式複述營業時間。",
            "在 Nurevo AEO > Settings 中填寫服務和問題，並在要顯示 FAQ 的頁面放置 Nurevo FAQ 區塊（或 [nurevo_faq]）。",
            "開啟 Nurevo AEO > AEO Score，閱讀診斷會傳送的內容，勾選同意並按下 Run diagnosis，然後套用清單中的一鍵修正。",
          ],
          after: ["想從外部查看 AI 讀到了什麼，可以用首頁網址執行[免費的 AI 可讀性檢測](/check?lang=zh-tw)。"],
        },
        {
          heading: "免費包含的功能",
          paragraphs: ["本頁所述全部在免費方案中運作，不需授權金鑰，也沒有試用期："],
          list: [
            "AEO 分數：0 到 100 分，附紅黃綠警示和待修正清單。",
            "基本結構化資料、llms.txt 和 AI 爬蟲存取的一鍵修正。",
            "伺服器端輸出的 schema.org JSON-LD，不執行 JavaScript 的爬蟲也能讀取。",
            "/llms.txt：由外掛依 WordPress 內容產生。",
            "在 robots.txt 中允許 AI 搜尋用來讀取和引用頁面的爬蟲。",
            "適用於在地商家、網路商店和 B2B 企業的網站類型。",
          ],
          after: ["付費方案只增加隨時更新的規則集（Standard）和 AI 曝光度測量（Pro，測試版），本頁內容都不需要它們。"],
        },
        {
          heading: "結構化資料能做什麼、不能做什麼",
          paragraphs: [
            "結構化資料幫助 AI 正確讀取你的資訊：正確的營業時間、正確的電話、正確的業態。但它無法決定 AI 說什麼。沒有任何工具能保證 AI 一定會提到你，Nurevo 也不做這樣的承諾。",
          ],
        },
      ],
      faqs: [
        { q: "Nurevo AEO 會與 SEO 外掛的結構化資料重複嗎？", a: "不會。使用 Yoast SEO、Rank Math 或 All in One SEO 時，它只把缺少的資訊以同一個商家 @id 加入 SEO 外掛已輸出的圖中，絕不覆寫外掛設定的值。頁面始終只有一個描述一家商家的圖。" },
        { q: "需要移除 Yoast SEO、Rank Math 或 AIOSEO 嗎？", a: "不需要。SEO 外掛繼續負責搜尋排名，Nurevo AEO 在其之上補充 AI 需要的資訊。" },
        { q: "Nurevo AEO 免費嗎？", a: "免費。商家資訊、服務、FAQ、AEO 分數、一鍵修正、JSON-LD、llms.txt 和 AI 爬蟲規則都在免費方案中。付費方案只增加隨時更新的規則集和 AI 曝光度測量（測試版）。" },
      ],
      relatedHeading: "相關指南",
      cta: {
        heading: "免費為 SEO 外掛的結構化資料補上缺少的商家資訊",
        body: "Nurevo AEO 在 WordPress.org 免費提供。不確定 AI 現在讀到什麼？先做免費檢測，不需註冊。",
        label: "在 WordPress.org 取得 Nurevo AEO",
        href: WP_ORG,
        secondary: { label: "免費 AI 可讀性檢測", href: "/check" },
      },
      footnote: "Yoast SEO 是 Yoast BV 的商標，Rank Math 是 Rank Math PVT. LTD. 的商標，All in One SEO（AIOSEO）是 Awesome Motive 的商標。Nurevo 與上述公司無任何關係。",
    },

    ko: {
      title: "Yoast·Rank Math·AIOSEO에 지역 비즈니스 스키마 무료 추가 | Nurevo",
      description: "SEO 플러그인 무료 버전은 이름과 로고까지만 출력합니다. AI에 필요한 주소·전화번호·영업시간·업종·서비스·FAQ를 Nurevo AEO로 무료로 추가하세요.",
      h1: "Yoast SEO·Rank Math·AIOSEO에 지역 비즈니스 스키마를 무료로 추가하는 방법",
      lead: "SEO 플러그인은 그대로 두세요. 무료 WordPress 플러그인 Nurevo AEO가 AI가 지역 비즈니스를 설명하는 데 필요한 정보(주소·전화번호·영업시간·업종·서비스·FAQ)를 Yoast SEO, Rank Math, All in One SEO가 이미 출력하는 구조화 데이터에 중복 없이 추가합니다.",
      intro: ["최종 확인: 2026년 10월. SEO 플러그인의 요금제는 바뀔 수 있으니 최신 기능은 각 플러그인 공식 페이지에서 확인하세요."],
      sections: [
        {
          heading: "Yoast SEO·Rank Math·AIOSEO 무료 버전이 출력하는 것",
          paragraphs: [
            "AI가 \"근처에서 토요일에 진료하는 치과\" 같은 질문에 답할 때는 추측 없이 읽을 수 있는 사실이 필요합니다. 어떤 업종인지, 어디에 있는지, 전화번호, 영업시간. WordPress에서는 이런 사실을 보통 SEO 플러그인의 JSON-LD에서 읽습니다.",
            "무료 버전은 사이트를 이름·URL·로고가 있는 Organization으로 출력합니다. 지역 정보의 대부분은 유료 로컬 SEO 애드온이나 요금제에 포함되어 있습니다. 2026년 10월 기준:",
          ],
          table: {
            head: ["정보", "무료 버전 (2026년 10월)", "Nurevo AEO가 추가 (무료)"],
            rows: [
              ["사업체 이름·URL·로고", "Yoast SEO, Rank Math, AIOSEO 모두 Organization으로 출력", "SEO 플러그인의 출력을 그대로 유지"],
              ["주소·전화번호·영업시간", "Yoast SEO와 AIOSEO: 유료 로컬 SEO 애드온에 포함 (Yoast Local SEO, AIOSEO Local SEO). Rank Math: Local SEO 설정을 입력하면 한 지점의 정보를 출력, 그 이상의 로컬 SEO 기능은 유료 요금제", "없을 때 같은 @id의 사업체 노드에 추가"],
              ["구체적인 업종", "로컬 SEO 기능으로 설정하지 않으면 Organization", "HairSalon, Dentist 같은 구체적인 유형"],
              ["서비스", "Organization 출력에 포함되지 않음", "입력한 서비스를 사업체에 연결해 추가"],
              ["FAQ", "SEO 플러그인이 출력하는 FAQPage는 그대로 유지", "Nurevo FAQ 블록을 둔 페이지에서 해당 페이지의 FAQPage에 질문 추가"],
              ["WebSite·WebPage·Article·브레드크럼", "SEO 플러그인이 출력", "변경 없음"],
            ],
            caption: "2026년 10월 기준. SEO 플러그인이 이미 설정한 값은 절대 덮어쓰지 않습니다.",
          },
          after: ["이 플러그인들을 비판하려는 것이 아닙니다. 검색 순위는 SEO 플러그인의 역할이고, Nurevo AEO는 그 대신이 아니라 옆에서 함께 동작하도록 만들어졌습니다."],
        },
        {
          heading: "Nurevo AEO가 중복 없이 빠진 정보를 채우는 방식",
          paragraphs: [
            "Nurevo AEO는 SEO 플러그인의 구조화 데이터 옆에 두 번째 세트를 출력하지 않습니다. 각 플러그인이 JSON-LD 그래프를 만들 때 쓰는 필터(Yoast SEO의 wpseo_schema_graph, Rank Math의 rank_math/schema/validated_data, AIOSEO의 aioseo_schema_output)에 연결해 빠진 것만 추가합니다.",
          ],
          list: [
            "주소·전화번호·영업시간·설명·이메일을 기존 사업체 노드에 같은 @id로 추가합니다.",
            "SEO 플러그인이 이미 설정한 값은 덮어쓰지 않습니다. Rank Math의 Local SEO 설정을 입력했다면 그 값이 유지됩니다.",
            "입력한 서비스를 추가하고 사업체에 연결합니다.",
            "입력한 FAQ 질문은 Nurevo FAQ 블록이나 [nurevo_faq] 단축 코드를 둔 페이지에서만 해당 페이지의 FAQPage에 추가되며, 이미 답한 질문은 건너뜁니다.",
            "WebSite·WebPage·Article·브레드크럼은 SEO 플러그인이 출력한 그대로 둡니다.",
          ],
          after: [
            "결과적으로 페이지에는 하나의 사업체를 설명하는 하나의 그래프만 남고 중복이 없습니다. 그 밖의 구성(SEOPress, The SEO Framework, 테마 자체 스키마, SEO 플러그인 없음)에서는 Nurevo AEO가 자체 그래프를 출력하고 사업체 정보를 기존 사업체 @id 아래에 넣으므로, 역시 하나의 사업체로 읽힙니다.",
          ],
        },
        {
          heading: "5단계로 설정하기",
          list: [
            `[WordPress.org](${WP_ORG})에서 Nurevo AEO를 설치하고 활성화합니다(플러그인 > 새로 추가에서 "Nurevo AEO" 검색). SEO 플러그인은 활성 상태로 둡니다.`,
            "설정 마법사가 한 번 열립니다. 사이트 유형(지역 비즈니스, 온라인 쇼핑몰, B2B)을 고르고 이름·주소·전화번호·영업시간·설명을 확인한 뒤, AI에 공개할 항목을 선택합니다.",
            "기존 설정에서 자동으로 채워진 정보를 확인합니다. 빈 칸만 채우므로 직접 입력한 값은 바뀌지 않으며, 마법사가 영업시간을 실제로 게시될 형태로 다시 보여 줍니다.",
            "Nurevo AEO > Settings에서 서비스와 질문을 입력하고, FAQ를 보여 줄 페이지에 Nurevo FAQ 블록(또는 [nurevo_faq])을 배치합니다.",
            "Nurevo AEO > AEO Score를 열어 진단이 보내는 내용을 읽고, 동의에 체크한 뒤 Run diagnosis를 누릅니다. 그다음 체크리스트의 원클릭 수정을 적용합니다.",
          ],
          after: ["외부에서 AI가 무엇을 읽는지 보려면 홈페이지 URL로 [무료 AI 가독성 점검](/check?lang=ko)을 실행해 보세요."],
        },
        {
          heading: "무료로 쓸 수 있는 기능",
          paragraphs: ["이 페이지의 내용은 모두 무료 요금제에서 동작합니다. 라이선스 키도, 체험 기간도 없습니다."],
          list: [
            "AEO 점수: 0~100점, 신호등 색 알림과 수정할 항목 체크리스트.",
            "기본 구조화 데이터, llms.txt, AI 크롤러 접근의 원클릭 수정.",
            "서버에서 출력하는 schema.org JSON-LD. JavaScript를 실행하지 않는 크롤러도 읽을 수 있습니다.",
            "/llms.txt: WordPress 콘텐츠로 플러그인 안에서 생성.",
            "AI 검색이 페이지를 읽고 인용할 때 쓰는 크롤러를 robots.txt에서 허용하는 규칙.",
            "지역 비즈니스, 온라인 쇼핑몰, B2B 기업용 사이트 유형.",
          ],
          after: ["유료 요금제가 추가하는 것은 항상 최신인 규칙 세트(Standard)와 AI 노출 측정(Pro, 베타)뿐이며, 이 페이지의 내용에는 필요하지 않습니다."],
        },
        {
          heading: "구조화 데이터로 할 수 있는 것과 없는 것",
          paragraphs: [
            "구조화 데이터는 AI가 정보를 정확히 읽도록 돕습니다. 정확한 영업시간, 정확한 전화번호, 정확한 업종. 하지만 AI가 무엇을 말할지는 결정하지 않습니다. AI가 반드시 당신을 언급하도록 보장할 수 있는 도구는 없으며, Nurevo도 그것을 약속하지 않습니다.",
          ],
        },
      ],
      faqs: [
        { q: "Nurevo AEO가 SEO 플러그인의 스키마와 중복되나요?", a: "아니요. Yoast SEO, Rank Math, All in One SEO를 쓰는 경우 SEO 플러그인이 이미 출력하는 그래프에 빠진 정보만 같은 사업체 @id로 추가하며, 플러그인이 설정한 값은 덮어쓰지 않습니다. 페이지에는 하나의 사업체를 설명하는 하나의 그래프가 유지됩니다." },
        { q: "Yoast SEO, Rank Math, AIOSEO를 삭제해야 하나요?", a: "아니요. 검색 순위를 위해 SEO 플러그인은 계속 사용하세요. Nurevo AEO는 그 위에 AI에 필요한 정보를 더합니다." },
        { q: "Nurevo AEO는 무료인가요?", a: "네. 사업체 정보, 서비스, FAQ, AEO 점수, 원클릭 수정, JSON-LD, llms.txt, AI 크롤러 규칙 모두 무료 요금제에 포함됩니다. 유료 요금제는 항상 최신인 규칙 세트와 AI 노출 측정(베타)만 추가합니다." },
      ],
      relatedHeading: "관련 가이드",
      cta: {
        heading: "SEO 플러그인의 스키마에 빠진 정보를 무료로 추가하세요",
        body: "Nurevo AEO는 WordPress.org에서 무료로 제공됩니다. 지금 AI가 무엇을 읽는지 모르겠다면 무료 점검부터 해 보세요. 가입은 필요 없습니다.",
        label: "WordPress.org에서 Nurevo AEO 받기",
        href: WP_ORG,
        secondary: { label: "무료 AI 가독성 점검", href: "/check" },
      },
      footnote: "Yoast SEO는 Yoast BV의, Rank Math는 Rank Math PVT. LTD.의, All in One SEO(AIOSEO)는 Awesome Motive의 상표입니다. Nurevo는 이들 회사와 제휴 관계가 없습니다.",
    },

    es: {
      title: "Schema de negocio local gratis en Yoast, Rank Math y AIOSEO | Nurevo",
      description: "Tu plugin SEO gratuito publica nombre y logo. Añade gratis con Nurevo AEO la dirección, teléfono, horario, tipo de negocio, servicios y FAQ que necesita la IA.",
      h1: "Añade schema de negocio local a Yoast SEO, Rank Math o AIOSEO, gratis",
      lead: "Conserva tu plugin SEO. Nurevo AEO, un plugin gratuito de WordPress, añade los datos que la IA necesita para describir un negocio local (dirección, teléfono, horario, tipo de negocio, servicios y FAQ) a los datos estructurados que Yoast SEO, Rank Math o All in One SEO ya publican, sin duplicarlos.",
      intro: ["Última revisión: octubre de 2026. Los planes de los plugins SEO cambian; consulta las páginas oficiales de cada plugin para conocer sus funciones actuales."],
      sections: [
        {
          heading: "Qué publican las versiones gratuitas de Yoast SEO, Rank Math y AIOSEO",
          paragraphs: [
            "Cuando una IA responde algo como \"qué dentista cerca de mí abre el sábado\", necesita datos que pueda leer sin adivinar: qué tipo de negocio eres, dónde estás, cómo llamarte y cuándo abres. En WordPress, esos datos suelen salir del JSON-LD de tu plugin SEO.",
            "Las versiones gratuitas publican tu sitio como una Organization con nombre, URL y logo. La mayoría de los datos locales están en complementos o planes de SEO local de pago. A octubre de 2026:",
          ],
          table: {
            head: ["Dato", "Versiones gratuitas (octubre de 2026)", "Lo que añade Nurevo AEO (gratis)"],
            rows: [
              ["Nombre del negocio, URL, logo", "Yoast SEO, Rank Math y AIOSEO lo publican como Organization", "Se mantiene tal como lo publica tu plugin SEO"],
              ["Dirección, teléfono, horario", "Yoast SEO y AIOSEO: en sus complementos de SEO local de pago (Yoast Local SEO, AIOSEO Local SEO). Rank Math: los datos de una ubicación si rellenas sus ajustes de Local SEO; más funciones de SEO local en sus planes de pago", "Se añaden al nodo de tu negocio si faltan, con el mismo @id"],
              ["Tipo de negocio específico", "Organization, salvo que una función de SEO local fije un tipo", "Un tipo más específico, como HairSalon o Dentist"],
              ["Servicios", "No forman parte de la Organization", "Los servicios que introduces, vinculados a tu negocio"],
              ["FAQ", "Se conserva cualquier FAQPage que publique tu plugin SEO", "Tus preguntas, añadidas a la FAQPage de la página donde está el bloque Nurevo FAQ"],
              ["WebSite, WebPage, Article, migas de pan", "Las publica tu plugin SEO", "Sin cambios"],
            ],
            caption: "A octubre de 2026. Los valores que tu plugin SEO ya define nunca se sobrescriben.",
          },
          after: ["No es una crítica a estos plugins: se ocupan del posicionamiento en buscadores, y Nurevo AEO está hecho para funcionar junto a ellos, no en su lugar."],
        },
        {
          heading: "Cómo Nurevo AEO completa lo que falta sin duplicar el schema",
          paragraphs: [
            "Nurevo AEO no imprime un segundo conjunto de datos estructurados junto al de tu plugin SEO. Se engancha al filtro que cada plugin usa para construir su grafo JSON-LD (wpseo_schema_graph en Yoast SEO, rank_math/schema/validated_data en Rank Math, aioseo_schema_output en AIOSEO) y añade solo lo que falta:",
          ],
          list: [
            "Dirección, teléfono, horario, descripción y correo se añaden al nodo de tu negocio existente, con el mismo @id.",
            "Un valor que tu plugin SEO ya define nunca se sobrescribe. Si rellenaste los ajustes de Local SEO de Rank Math, esos valores se mantienen.",
            "Los servicios que introduces se añaden y se vinculan a tu negocio.",
            "Las preguntas frecuentes que introduces se añaden a la FAQPage solo en la página que muestra el bloque Nurevo FAQ o el shortcode [nurevo_faq], omitiendo las que ya están respondidas.",
            "WebSite, WebPage, Article y las migas de pan quedan exactamente como las publica tu plugin SEO.",
          ],
          after: [
            "La página termina con un solo grafo que describe un solo negocio, sin duplicados. Con cualquier otra configuración (SEOPress, The SEO Framework, el schema del propio tema o sin plugin SEO), Nurevo AEO imprime su propio grafo y coloca los datos del negocio bajo el @id de negocio existente, de modo que ambos describen un solo negocio.",
          ],
        },
        {
          heading: "Configúralo en cinco pasos",
          list: [
            `Instala Nurevo AEO desde [WordPress.org](${WP_ORG}) (Plugins > Añadir nuevo, busca "Nurevo AEO") y actívalo. Deja activo tu plugin SEO.`,
            "El asistente de configuración se abre una vez. Elige el tipo de sitio (negocio local, tienda online o B2B), confirma nombre, dirección, teléfono, horario y descripción, y elige qué publicar para la IA.",
            "Revisa los datos que el plugin rellenó a partir de tus ajustes. Solo completa campos vacíos, así que no reemplaza nada de lo que escribiste, y el asistente te muestra el horario tal como se publicará.",
            "Introduce tus servicios y preguntas en Nurevo AEO > Settings y coloca el bloque Nurevo FAQ (o [nurevo_faq]) en la página donde debe aparecer la FAQ.",
            "Abre Nurevo AEO > AEO Score, lee qué envía el diagnóstico, marca la casilla de consentimiento y pulsa Run diagnosis. Después aplica las correcciones de un clic que ofrece la lista.",
          ],
          after: ["Para ver qué lee la IA desde fuera, ejecuta la [comprobación gratuita de legibilidad para IA](/check?lang=es) con la URL de tu página de inicio."],
        },
        {
          heading: "Qué es gratis",
          paragraphs: ["Todo lo de esta página funciona en el plan gratuito, sin clave de licencia ni periodo de prueba:"],
          list: [
            "La puntuación AEO: de 0 a 100, con alertas tipo semáforo y una lista de lo que hay que corregir.",
            "Correcciones de un clic para los datos estructurados básicos, llms.txt y el acceso de los rastreadores de IA.",
            "JSON-LD de schema.org generado en el servidor, que leen incluso los rastreadores que no ejecutan JavaScript.",
            "llms.txt en /llms.txt, creado dentro del plugin a partir de tu contenido de WordPress.",
            "Reglas en robots.txt para los rastreadores que la búsqueda con IA usa para leer y citar páginas.",
            "Tipos de sitio para negocios locales, tiendas online y empresas B2B.",
          ],
          after: ["Los planes de pago añaden un conjunto de reglas siempre actualizado (Standard) y la medición de visibilidad en IA en beta (Pro). Nada de esta página los necesita."],
        },
        {
          heading: "Qué pueden y qué no pueden hacer los datos estructurados",
          paragraphs: [
            "Los datos estructurados ayudan a la IA a leer correctamente tus datos: el horario correcto, el teléfono correcto, el tipo de negocio correcto. No deciden lo que dice una IA. Ninguna herramienta puede garantizar que una IA te mencione, y Nurevo no lo promete.",
          ],
        },
      ],
      faqs: [
        { q: "¿Nurevo AEO duplica el schema de mi plugin SEO?", a: "No. Con Yoast SEO, Rank Math o All in One SEO añade solo los datos que faltan al grafo que tu plugin SEO ya publica, con el mismo @id de negocio, y nunca sobrescribe un valor que el plugin define. La página mantiene un solo grafo que describe un solo negocio." },
        { q: "¿Tengo que quitar Yoast SEO, Rank Math o AIOSEO?", a: "No. Conserva tu plugin SEO para el posicionamiento. Nurevo AEO añade encima los datos que necesita la IA." },
        { q: "¿Nurevo AEO es gratis?", a: "Sí. Los datos del negocio, servicios, FAQ, puntuación AEO, correcciones de un clic, JSON-LD, llms.txt y reglas para rastreadores de IA están en el plan gratuito. Los planes de pago solo añaden un conjunto de reglas siempre actualizado y la medición de visibilidad en IA (beta)." },
      ],
      relatedHeading: "Guías relacionadas",
      cta: {
        heading: "Añade gratis los datos que faltan al schema de tu plugin SEO",
        body: "Nurevo AEO es gratuito en WordPress.org. ¿No sabes qué lee hoy la IA? Haz primero la comprobación gratuita. Sin registro.",
        label: "Obtener Nurevo AEO en WordPress.org",
        href: WP_ORG,
        secondary: { label: "Comprobación gratuita para IA", href: "/check" },
      },
      footnote: "Yoast SEO es una marca de Yoast BV; Rank Math, de Rank Math PVT. LTD.; y All in One SEO (AIOSEO), de Awesome Motive. Nurevo no está afiliado a ellas.",
    },

    fr: {
      title: "Schema d'entreprise locale gratuit : Yoast, Rank Math, AIOSEO | Nurevo",
      description: "Votre plugin SEO gratuit publie nom et logo. Ajoutez gratuitement avec Nurevo AEO adresse, téléphone, horaires, type d'activité, services et FAQ pour l'IA.",
      h1: "Ajoutez un schema d'entreprise locale à Yoast SEO, Rank Math ou AIOSEO, gratuitement",
      lead: "Gardez votre plugin SEO. Nurevo AEO, un plugin WordPress gratuit, ajoute les informations dont l'IA a besoin pour décrire une entreprise locale (adresse, téléphone, horaires, type d'activité, services et FAQ) aux données structurées que Yoast SEO, Rank Math ou All in One SEO publient déjà, sans les dupliquer.",
      intro: ["Dernière vérification : octobre 2026. Les offres des plugins SEO évoluent ; consultez les pages officielles de chaque plugin pour leurs fonctions actuelles."],
      sections: [
        {
          heading: "Ce que publient les versions gratuites de Yoast SEO, Rank Math et AIOSEO",
          paragraphs: [
            "Quand une IA répond à une question comme « quel dentiste près de chez moi est ouvert le samedi », elle a besoin de faits lisibles sans deviner : quel type d'activité, où, quel numéro appeler, quels horaires. Sur WordPress, ces faits viennent généralement du JSON-LD de votre plugin SEO.",
            "Les versions gratuites publient votre site comme une Organization avec un nom, une URL et un logo. La plupart des informations locales se trouvent dans des extensions ou offres de SEO local payantes. En octobre 2026 :",
          ],
          table: {
            head: ["Information", "Versions gratuites (octobre 2026)", "Ajouté par Nurevo AEO (gratuit)"],
            rows: [
              ["Nom de l'entreprise, URL, logo", "Publiés comme Organization par Yoast SEO, Rank Math et AIOSEO", "Conservés tels que votre plugin SEO les publie"],
              ["Adresse, téléphone, horaires", "Yoast SEO et AIOSEO : dans leurs extensions de SEO local payantes (Yoast Local SEO, AIOSEO Local SEO). Rank Math : les informations d'un établissement si vous remplissez ses réglages Local SEO ; d'autres fonctions de SEO local dans ses offres payantes", "Ajoutés au nœud de votre entreprise s'ils manquent, sous le même @id"],
              ["Type d'activité précis", "Organization, sauf si une fonction de SEO local définit un type", "Un type plus précis, comme HairSalon ou Dentist"],
              ["Services", "Ne font pas partie de l'Organization", "Les services que vous saisissez, liés à votre entreprise"],
              ["FAQ", "Toute FAQPage publiée par votre plugin SEO est conservée", "Vos questions, ajoutées à la FAQPage de la page où se trouve le bloc Nurevo FAQ"],
              ["WebSite, WebPage, Article, fil d'Ariane", "Publiés par votre plugin SEO", "Inchangés"],
            ],
            caption: "En octobre 2026. Les valeurs déjà définies par votre plugin SEO ne sont jamais écrasées.",
          },
          after: ["Ce n'est pas une critique de ces plugins : ils s'occupent du référencement, et Nurevo AEO est conçu pour fonctionner à côté d'eux, pas à leur place."],
        },
        {
          heading: "Comment Nurevo AEO complète les manques sans dupliquer le schema",
          paragraphs: [
            "Nurevo AEO n'imprime pas un second jeu de données structurées à côté de celui de votre plugin SEO. Il se branche sur le filtre que chaque plugin utilise pour construire son graphe JSON-LD (wpseo_schema_graph pour Yoast SEO, rank_math/schema/validated_data pour Rank Math, aioseo_schema_output pour AIOSEO) et n'ajoute que ce qui manque :",
          ],
          list: [
            "L'adresse, le téléphone, les horaires, la description et l'e-mail rejoignent le nœud existant de votre entreprise, sous le même @id.",
            "Une valeur déjà définie par votre plugin SEO n'est jamais écrasée. Si vous avez rempli les réglages Local SEO de Rank Math, ces valeurs restent.",
            "Les services que vous saisissez sont ajoutés et liés à votre entreprise.",
            "Les questions de FAQ que vous saisissez sont ajoutées à la FAQPage uniquement sur la page qui affiche le bloc Nurevo FAQ ou le shortcode [nurevo_faq], en ignorant celles qui ont déjà une réponse.",
            "WebSite, WebPage, Article et le fil d'Ariane restent exactement tels que votre plugin SEO les publie.",
          ],
          after: [
            "La page garde un seul graphe qui décrit une seule entreprise, sans doublon. Avec toute autre configuration (SEOPress, The SEO Framework, le schema du thème ou aucun plugin SEO), Nurevo AEO imprime son propre graphe et place les informations de l'entreprise sous l'@id d'entreprise existant, si bien que les deux décrivent une seule entreprise.",
          ],
        },
        {
          heading: "Mise en place en cinq étapes",
          list: [
            `Installez Nurevo AEO depuis [WordPress.org](${WP_ORG}) (Extensions > Ajouter, recherchez « Nurevo AEO ») et activez-le. Laissez votre plugin SEO actif.`,
            "L'assistant de configuration s'ouvre une fois. Choisissez le type de site (commerce local, boutique en ligne ou B2B), confirmez le nom, l'adresse, le téléphone, les horaires et la description, puis choisissez ce qui est publié pour l'IA.",
            "Vérifiez les informations que le plugin a reprises de vos réglages existants. Il ne remplit que les champs vides, donc rien de ce que vous avez saisi n'est remplacé, et l'assistant vous relit les horaires tels qu'ils seront publiés.",
            "Saisissez vos services et vos questions dans Nurevo AEO > Settings, et placez le bloc Nurevo FAQ (ou [nurevo_faq]) sur la page où la FAQ doit apparaître.",
            "Ouvrez Nurevo AEO > AEO Score, lisez ce que le diagnostic envoie, cochez la case de consentement et cliquez sur Run diagnosis. Appliquez ensuite les corrections en un clic proposées par la liste.",
          ],
          after: ["Pour voir ce que l'IA lit de l'extérieur, lancez le [test gratuit de lisibilité par l'IA](/check?lang=fr) avec l'URL de votre page d'accueil."],
        },
        {
          heading: "Ce qui est gratuit",
          paragraphs: ["Tout ce qui est décrit ici fonctionne avec l'offre gratuite, sans clé de licence ni période d'essai :"],
          list: [
            "Le score AEO : de 0 à 100, avec des alertes de type feu tricolore et une liste de points à corriger.",
            "Des corrections en un clic pour les données structurées de base, le llms.txt et l'accès des robots d'IA.",
            "Un JSON-LD schema.org rendu côté serveur, lu même par les robots qui n'exécutent pas JavaScript.",
            "Un llms.txt à l'adresse /llms.txt, généré dans le plugin à partir de votre contenu WordPress.",
            "Des règles robots.txt pour les robots que la recherche par IA utilise pour lire et citer les pages.",
            "Des types de site pour les commerces locaux, les boutiques en ligne et les entreprises B2B.",
          ],
          after: ["Les offres payantes ajoutent un jeu de règles toujours à jour (Standard) et la mesure de visibilité dans l'IA en bêta (Pro). Rien sur cette page n'en a besoin."],
        },
        {
          heading: "Ce que les données structurées peuvent et ne peuvent pas faire",
          paragraphs: [
            "Les données structurées aident l'IA à lire correctement vos informations : les bons horaires, le bon numéro, le bon type d'activité. Elles ne décident pas de ce que dit une IA. Aucun outil ne peut garantir qu'une IA vous mentionnera, et Nurevo ne le promet pas.",
          ],
        },
      ],
      faqs: [
        { q: "Nurevo AEO duplique-t-il le schema de mon plugin SEO ?", a: "Non. Avec Yoast SEO, Rank Math ou All in One SEO, il ajoute seulement les informations manquantes au graphe que votre plugin SEO publie déjà, sous le même @id d'entreprise, et n'écrase jamais une valeur définie par le plugin. La page garde un seul graphe qui décrit une seule entreprise." },
        { q: "Dois-je supprimer Yoast SEO, Rank Math ou AIOSEO ?", a: "Non. Gardez votre plugin SEO pour le référencement. Nurevo AEO ajoute par-dessus les informations dont l'IA a besoin." },
        { q: "Nurevo AEO est-il gratuit ?", a: "Oui. Les informations de l'entreprise, les services, la FAQ, le score AEO, les corrections en un clic, le JSON-LD, le llms.txt et les règles pour les robots d'IA sont dans l'offre gratuite. Les offres payantes ajoutent seulement un jeu de règles toujours à jour et la mesure de visibilité dans l'IA (bêta)." },
      ],
      relatedHeading: "Guides associés",
      cta: {
        heading: "Ajoutez gratuitement les informations manquantes au schema de votre plugin SEO",
        body: "Nurevo AEO est gratuit sur WordPress.org. Vous ne savez pas ce que l'IA lit aujourd'hui ? Faites d'abord le test gratuit, sans inscription.",
        label: "Obtenir Nurevo AEO sur WordPress.org",
        href: WP_ORG,
        secondary: { label: "Test gratuit de lisibilité par l'IA", href: "/check" },
      },
      footnote: "Yoast SEO est une marque de Yoast BV, Rank Math de Rank Math PVT. LTD., et All in One SEO (AIOSEO) d'Awesome Motive. Nurevo n'est pas affilié à ces sociétés.",
    },

    de: {
      title: "Local-Business-Schema für Yoast, Rank Math & AIOSEO gratis | Nurevo",
      description: "Die Gratisversion Ihres SEO-Plugins veröffentlicht Name und Logo. Ergänzen Sie mit Nurevo AEO kostenlos Adresse, Telefon, Öffnungszeiten, Branche, Leistungen und FAQ.",
      h1: "Local-Business-Schema für Yoast SEO, Rank Math oder AIOSEO kostenlos ergänzen",
      lead: "Behalten Sie Ihr SEO-Plugin. Nurevo AEO, ein kostenloses WordPress-Plugin, ergänzt die Angaben, die KI zur Beschreibung eines lokalen Unternehmens braucht (Adresse, Telefon, Öffnungszeiten, Unternehmensart, Leistungen und FAQ), in den strukturierten Daten, die Yoast SEO, Rank Math oder All in One SEO bereits ausgeben, ohne sie zu duplizieren.",
      intro: ["Zuletzt geprüft: Oktober 2026. Die Tarife der SEO-Plugins ändern sich; die aktuellen Funktionen stehen auf den Seiten der jeweiligen Plugins."],
      sections: [
        {
          heading: "Was die Gratisversionen von Yoast SEO, Rank Math und AIOSEO ausgeben",
          paragraphs: [
            "Wenn eine KI eine Frage wie „Welche Zahnarztpraxis in meiner Nähe hat samstags geöffnet?“ beantwortet, braucht sie Fakten, die sie ohne Raten lesen kann: welche Art Unternehmen, wo, welche Telefonnummer, welche Öffnungszeiten. Unter WordPress stammen diese Fakten meist aus dem JSON-LD Ihres SEO-Plugins.",
            "Die Gratisversionen geben Ihre Website als Organization mit Name, URL und Logo aus. Die meisten lokalen Angaben stecken in kostenpflichtigen Local-SEO-Erweiterungen oder -Tarifen. Stand Oktober 2026:",
          ],
          table: {
            head: ["Angabe", "Gratisversionen (Oktober 2026)", "Ergänzt durch Nurevo AEO (kostenlos)"],
            rows: [
              ["Unternehmensname, URL, Logo", "Von Yoast SEO, Rank Math und AIOSEO als Organization ausgegeben", "Bleibt genau so, wie Ihr SEO-Plugin es ausgibt"],
              ["Adresse, Telefon, Öffnungszeiten", "Yoast SEO und AIOSEO: in ihren kostenpflichtigen Local-SEO-Erweiterungen (Yoast Local SEO, AIOSEO Local SEO). Rank Math: die Angaben eines Standorts, wenn Sie die Local-SEO-Einstellungen ausfüllen; weitere Local-SEO-Funktionen in den kostenpflichtigen Tarifen", "Wo sie fehlen, am Unternehmensknoten unter derselben @id ergänzt"],
              ["Genaue Unternehmensart", "Organization, sofern keine Local-SEO-Funktion einen Typ setzt", "Ein genauerer Typ wie HairSalon oder Dentist"],
              ["Leistungen", "Nicht Teil der Organization", "Ihre eingegebenen Leistungen, mit Ihrem Unternehmen verknüpft"],
              ["FAQ", "Eine FAQPage Ihres SEO-Plugins bleibt erhalten", "Ihre Fragen, ergänzt in der FAQPage der Seite mit dem Nurevo-FAQ-Block"],
              ["WebSite, WebPage, Article, Breadcrumbs", "Von Ihrem SEO-Plugin ausgegeben", "Unverändert"],
            ],
            caption: "Stand Oktober 2026. Werte, die Ihr SEO-Plugin bereits setzt, werden nie überschrieben.",
          },
          after: ["Das ist keine Kritik an diesen Plugins: Sie kümmern sich um das Suchmaschinen-Ranking, und Nurevo AEO ist dafür gebaut, neben ihnen zu laufen, nicht an ihrer Stelle."],
        },
        {
          heading: "Wie Nurevo AEO Lücken ohne doppeltes Schema füllt",
          paragraphs: [
            "Nurevo AEO gibt keinen zweiten Satz strukturierter Daten neben dem Ihres SEO-Plugins aus. Es klinkt sich in den Filter ein, mit dem jedes Plugin seinen JSON-LD-Graphen baut (wpseo_schema_graph bei Yoast SEO, rank_math/schema/validated_data bei Rank Math, aioseo_schema_output bei AIOSEO), und ergänzt nur, was fehlt:",
          ],
          list: [
            "Adresse, Telefon, Öffnungszeiten, Beschreibung und E-Mail kommen unter derselben @id an Ihren bestehenden Unternehmensknoten.",
            "Ein Wert, den Ihr SEO-Plugin bereits setzt, wird nie überschrieben. Haben Sie die Local-SEO-Einstellungen von Rank Math ausgefüllt, bleiben diese Werte.",
            "Ihre eingegebenen Leistungen werden ergänzt und mit Ihrem Unternehmen verknüpft.",
            "Ihre FAQ-Fragen werden nur auf der Seite mit dem Nurevo-FAQ-Block oder dem Shortcode [nurevo_faq] in deren FAQPage ergänzt; bereits beantwortete Fragen werden übersprungen.",
            "WebSite, WebPage, Article und Breadcrumbs bleiben genau so, wie Ihr SEO-Plugin sie ausgibt.",
          ],
          after: [
            "Am Ende hat die Seite einen Graphen, der ein Unternehmen beschreibt, ohne Duplikate. Bei jedem anderen Aufbau (SEOPress, The SEO Framework, Schema des Themes oder kein SEO-Plugin) gibt Nurevo AEO einen eigenen Graphen aus und legt die Unternehmensangaben unter die vorhandene Unternehmens-@id, sodass beide ein Unternehmen beschreiben.",
          ],
        },
        {
          heading: "In fünf Schritten eingerichtet",
          list: [
            `Installieren Sie Nurevo AEO von [WordPress.org](${WP_ORG}) (Plugins > Neues Plugin hinzufügen, nach „Nurevo AEO“ suchen) und aktivieren Sie es. Ihr SEO-Plugin bleibt aktiv.`,
            "Der Einrichtungsassistent öffnet sich einmal. Wählen Sie die Art der Website (lokales Unternehmen, Onlineshop oder B2B), bestätigen Sie Name, Adresse, Telefon, Öffnungszeiten und Beschreibung und wählen Sie, was für KI veröffentlicht wird.",
            "Prüfen Sie die Angaben, die das Plugin aus Ihren bestehenden Einstellungen übernommen hat. Es füllt nur leere Felder, ersetzt also nichts, was Sie eingegeben haben, und der Assistent zeigt Ihnen die Öffnungszeiten so, wie sie veröffentlicht werden.",
            "Tragen Sie Ihre Leistungen und Fragen unter Nurevo AEO > Settings ein und platzieren Sie den Nurevo-FAQ-Block (oder [nurevo_faq]) auf der Seite, auf der die FAQ erscheinen soll.",
            "Öffnen Sie Nurevo AEO > AEO Score, lesen Sie, was die Diagnose sendet, setzen Sie das Häkchen zur Einwilligung und klicken Sie auf Run diagnosis. Wenden Sie danach die Ein-Klick-Korrekturen aus der Checkliste an.",
          ],
          after: ["Um zu sehen, was KI von außen liest, starten Sie den [kostenlosen KI-Lesbarkeitstest](/check?lang=de) mit der URL Ihrer Startseite."],
        },
        {
          heading: "Was kostenlos ist",
          paragraphs: ["Alles auf dieser Seite läuft im kostenlosen Tarif, ohne Lizenzschlüssel und ohne Testzeitraum:"],
          list: [
            "Der AEO-Score: 0 bis 100, mit Ampel-Hinweisen und einer Checkliste, was zu beheben ist.",
            "Ein-Klick-Korrekturen für grundlegende strukturierte Daten, llms.txt und den Zugang von KI-Crawlern.",
            "Serverseitig ausgegebenes schema.org-JSON-LD, das auch Crawler lesen, die kein JavaScript ausführen.",
            "llms.txt unter /llms.txt, im Plugin aus Ihren WordPress-Inhalten erzeugt.",
            "Regeln in der robots.txt für die Crawler, mit denen KI-Suche Seiten liest und zitiert.",
            "Website-Arten für lokale Unternehmen, Onlineshops und B2B-Unternehmen.",
          ],
          after: ["Die kostenpflichtigen Tarife ergänzen ein stets aktuelles Regelwerk (Standard) und die Messung der KI-Sichtbarkeit als Beta (Pro). Nichts auf dieser Seite setzt sie voraus."],
        },
        {
          heading: "Was strukturierte Daten können und was nicht",
          paragraphs: [
            "Strukturierte Daten helfen KI, Ihre Angaben richtig zu lesen: die richtigen Öffnungszeiten, die richtige Telefonnummer, die richtige Unternehmensart. Sie bestimmen nicht, was eine KI sagt. Kein Werkzeug kann garantieren, dass eine KI Sie erwähnt, und Nurevo verspricht das nicht.",
          ],
        },
      ],
      faqs: [
        { q: "Dupliziert Nurevo AEO das Schema meines SEO-Plugins?", a: "Nein. Mit Yoast SEO, Rank Math oder All in One SEO ergänzt es nur die fehlenden Angaben im Graphen, den Ihr SEO-Plugin bereits ausgibt, unter derselben Unternehmens-@id, und überschreibt nie einen Wert, den das Plugin setzt. Die Seite behält einen Graphen, der ein Unternehmen beschreibt." },
        { q: "Muss ich Yoast SEO, Rank Math oder AIOSEO entfernen?", a: "Nein. Behalten Sie Ihr SEO-Plugin für das Ranking. Nurevo AEO ergänzt darauf die Angaben, die KI braucht." },
        { q: "Ist Nurevo AEO kostenlos?", a: "Ja. Unternehmensangaben, Leistungen, FAQ, AEO-Score, Ein-Klick-Korrekturen, JSON-LD, llms.txt und die Regeln für KI-Crawler sind im kostenlosen Tarif enthalten. Die kostenpflichtigen Tarife ergänzen nur ein stets aktuelles Regelwerk und die Messung der KI-Sichtbarkeit (Beta)." },
      ],
      relatedHeading: "Verwandte Leitfäden",
      cta: {
        heading: "Ergänzen Sie fehlende Angaben im Schema Ihres SEO-Plugins, kostenlos",
        body: "Nurevo AEO ist kostenlos auf WordPress.org. Unsicher, was KI heute liest? Machen Sie zuerst den kostenlosen Test, ohne Anmeldung.",
        label: "Nurevo AEO auf WordPress.org holen",
        href: WP_ORG,
        secondary: { label: "Kostenloser KI-Lesbarkeitstest", href: "/check" },
      },
      footnote: "Yoast SEO ist eine Marke der Yoast BV, Rank Math der Rank Math PVT. LTD. und All in One SEO (AIOSEO) von Awesome Motive. Nurevo ist mit diesen Unternehmen nicht verbunden.",
    },
  },
};
