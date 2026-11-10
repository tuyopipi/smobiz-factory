// Content page: AI search checks for WordPress maintenance providers - the
// routine maintenance jobs (migrations, security / CDN settings, SEO plugin and
// theme changes, robots.txt edits, caching) that silently stop AI from reading
// a client site, and how to catch them every month.
//
// Written 2026-11-10 (JST). Every claim about Nurevo AEO comes from the
// plugin's readme (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt)
// or the partner page (public/partner/index.html). Cloudflare and WordPress
// facts were checked in their own documentation on 2026-11-10. The Google and
// OpenAI statements are the same ones used (and checked) in
// agency-aeo-monthly-service. Third-party claims about Cloudflare changing its
// defaults on a given date are deliberately NOT used: Cloudflare's own docs
// (updated 2026-11-02) say new domains default to Allow, and we could not read
// the announcement itself.
//
// Agencies join as referral partners only (see scripts/check-static.mjs).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  openai: "https://developers.openai.com/api/docs/bots",
  perplexity: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers.md",
  cfPolicies: "https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/",
  cfVerified: "https://developers.cloudflare.com/bots/concepts/bot/verified-bots/",
  wp53: "https://make.wordpress.org/core/2019/09/02/changes-to-prevent-search-engines-indexing-sites/",
};

export default {
  slug: "wordpress-maintenance-ai-search",
  targetQueries: [
    "WordPress maintenance AI search",
    "WordPress care plan AEO checklist",
    "AI crawlers blocked Cloudflare WordPress",
    "WordPress保守 AI検索対策",
    "保守会社 AIクローラ ブロック 確認",
    "WordPress 保守 チェックリスト AI",
  ],
  related: ["agency-aeo-monthly-service", "local-business-schema-seo-plugins", "measure-ai-visibility", "aeo-wordpress", "llms-txt"],
  locales: {
    ja: {
      title: "WordPress保守会社のAI検索対策：保守作業の事故を防ぐ確認表 | Nurevo",
      description: "WordPress保守会社向けに、サーバー移転・WAFやCDNの設定・SEOプラグインの変更・robots.txtの編集などの保守作業で、AIがサイトを読めなくなる事故を防ぐ確認方法と、月次報告に足す項目を解説。",
      h1: "WordPress保守会社のAI検索対策：保守作業でAIに読めなくなる事故を防ぐチェックリスト",
      lead: "WordPress保守会社がAI検索対策でまずやるべきことは、新しい施策を足すことより、日々の保守作業（移転、セキュリティ・CDNの設定、プラグインやテーマの変更、robots.txtの編集）が、AIのクローラや構造化データを壊していないかを毎回確かめることです。確認は「作業のたび」「毎月」「移転のとき」の3つのタイミングに分けると、既存の保守の流れに無理なく入ります。",
      intro: [
        "作成日：2026年11月10日（JST）。Cloudflare と WordPress の仕様は同日に各公式ドキュメントで確認したものです。仕様は変わることがあるため、作業の前に最新の情報をご確認ください。",
        "この記事は、すでにWordPressの保守・運用を請けている会社やフリーランスの方向けです。AI検索対策を月額サービスとして設計する方法（作業範囲・価格）は[制作会社がAI検索対策を月額サービスにする方法](/guide/agency-aeo-monthly-service)にまとめています。ここでは、保守の現場で起きやすい「気づかないうちにAIから見えなくなる」事故と、その見つけ方に絞ります。",
      ],
      sections: [
        {
          heading: "なぜ保守会社がAI検索対策の要になるのか",
          paragraphs: [
            "ChatGPT・Perplexity・GoogleのAI機能が事業について答えるとき、使われるのはクローラが読めたページと、そこに書かれた事実です。Googleは、AI OverviewsやAI Modeに表示されるための追加の要件や特別な最適化はなく、通常のSEOのベストプラクティスが当てはまると説明しています（[Google検索セントラル：AI機能とウェブサイト](" + SRC.googleAi + ")）。OpenAIは、OAI-SearchBotを拒否したサイトはChatGPTの検索回答に表示されないとしています（[OpenAI：クローラの概要](" + SRC.openai + ")）。",
            "つまり、AIに読まれるかどうかは「クローラが入れるか」「インデックスを拒否していないか」「構造化データと本文の事実が正しいか」で決まり、これらはどれも保守作業で変わるものです。サーバー移転のときに残った設定、セキュリティを強めたときのボット対策、SEOプラグインの乗り換えなど、善意の作業がAIからの見え方を止めてしまうことがあります。",
            "しかも、この種の事故はサイトを人が見ても気づけません。表示は普段どおりで、問い合わせが少し減ったように見えるだけです。だからこそ、サイトの中を定期的に触っている保守会社が確認を持つのがいちばん確実です。なお、AIの回答は同じ質問でも日や回によって変わります。ここでの確認は「AIが読める状態を保つ」ためのもので、AIに必ず表示されることを約束するものではありません。",
          ],
        },
        {
          heading: "保守作業ごとに起きやすい事故と確認方法",
          table: {
            head: ["保守作業", "起きやすい事故", "確認方法"],
            rows: [
              ["ステージングからの本番反映・サーバー移転", "「設定 › 表示設定」の「検索エンジンがサイトをインデックスしないようにする」にチェックが入ったまま公開される", "本番のHTMLソースに noindex の robots メタタグがないか確認。設定画面のチェックも外れているか見る"],
              ["移転・新しいホスティングへの切り替え", "ステージング用の Basic 認証や X-Robots-Tag ヘッダー、IP制限がそのまま残る", "ログインしていない状態・別の回線から主要ページを開き、レスポンスヘッダーに X-Robots-Tag: noindex がないか確認"],
              ["セキュリティプラグイン・WAF・CDNの設定変更", "ボット対策やレート制限で、AI検索のクローラまで止める", "CDN・WAFのボット設定を確認し、サーバーのアクセスログで OAI-SearchBot・PerplexityBot などの応答コードを見る"],
              ["robots.txt の手編集・ファイルの設置", "サーバーに robots.txt ファイルを置いたことで、WordPress やプラグインが出していた robots.txt の記述が使われなくなる", "/robots.txt を開き、意図した内容が返っているか、AI検索のクローラを Disallow していないか確認"],
              ["SEOプラグインの乗り換え・テーマの変更", "店舗・会社の構造化データが消える、または2つの事業として二重に出る", "主要ページのHTMLソースで application/ld+json の数と中身（名前・住所・電話・営業時間）を確認"],
              ["キャッシュ・高速化プラグインの設定変更", "古いHTMLが配信され続ける、最適化の設定で構造化データや本文が意図どおりに出ない", "キャッシュを消したあと、ログアウト状態でHTMLソースを確認"],
              ["お客様からの情報変更の依頼（営業時間・料金・住所）", "ページの文章だけ直し、構造化データ・llms.txt・Googleビジネスプロフィールが古いまま", "変更した項目を、ページ・構造化データ・llms.txt・外部のプロフィールで突き合わせる"],
              ["SSL証明書・ドメインの更新", "期限切れで誰も読めなくなる", "期限の監視。保守の通常業務の範囲"],
            ],
            caption: "どれも特別なツールなしで確認できます。作業の記録に「確認した」欄を1つ足すだけでも、見落としは減ります。",
          },
        },
        {
          heading: "移転のあとに残りやすい「インデックスしない」設定",
          paragraphs: [
            "WordPressの「検索エンジンがサイトをインデックスしないようにする」は、WordPress 5.3 から robots.txt に Disallow を書く方法をやめ、ページに robots メタタグ（noindex, nofollow）を出す方法に変わりました（[Make WordPress Core：検索エンジンにインデックスさせない仕組みの変更](" + SRC.wp53 + ")）。そのため、robots.txt だけを見て「問題なし」と判断すると見落とします。HTMLソースで meta name='robots' を確認しましょう。",
            "同じ記事では、開発・ステージング環境には、画像やPDFも含めてサーバー側で X-Robots-Tag: noindex, nofollow のヘッダーを付ける方法を勧めています。これはWordPressの設定ではなくサーバーやホスティングの設定なので、本番に切り替えたあとにヘッダーが残っていないか、レスポンスヘッダーで確かめる必要があります。",
          ],
        },
        {
          heading: "セキュリティ・CDN・WAFでAIのクローラを止めていないか",
          paragraphs: [
            "保守会社がセキュリティを強めるときに、いちばん気づきにくいのがここです。ボット対策の多くは、AIのクローラを「よくわからない自動アクセス」としてまとめて止められます。",
            "例えば Cloudflare には、AIのクローラとエージェントへの対応を、用途ごとに「Search（質問に答えるために収集・インデックスするもの）」「Agent（人の代わりにリアルタイムで動くもの）」「Training（モデルの学習に使うもの）」に分けて、ブロック・広告のあるページだけブロック・許可から選ぶ設定があります。公式ドキュメントでは、新しいドメインは3つとも「許可（ブロックしない）」が初期値とされています。一方で、Training には学習と検索の両方に使う「兼用のクローラ」も含まれると説明されています（[Cloudflare：AI Crawler and Agent access policies](" + SRC.cfPolicies + ")、2026年11月2日更新）。学習を止めるつもりで設定を変えたとき、何が止まるのかを設定画面の説明で確認してから適用しましょう。",
            "確認には、サーバーのアクセスログがいちばん確実です。OAI-SearchBot や PerplexityBot などのリクエストが来ているか、応答が 200 か 403 かを見ます。curl でユーザーエージェントだけを名乗って試す方法もありますが、Cloudflare は「検証済みボット」を署名・公開されたIPアドレスの一覧・逆引きDNSなどで見分けるとしているため（[Cloudflare：Verified bots](" + SRC.cfVerified + ")）、名乗っただけのリクエストは本物のクローラと同じ扱いにならないことがあります。テストの結果だけで判断しないようにしましょう。",
            "クローラの名前と用途は、各社のページで確認できます（[OpenAI](" + SRC.openai + ")、[Perplexity](" + SRC.perplexity + ")）。学習用のクローラ（GPTBot など）を許可するかどうかはAI検索への表示とは別の判断なので、保守会社が決めず、お客様に選んでもらうのが安全です。",
          ],
        },
        {
          heading: "保守チェックリスト：作業のたび・毎月・移転のとき",
          paragraphs: ["次の3つに分けて、今の保守の手順書にそのまま足せる形にしています。"],
          list: [
            "【作業のたび】プラグイン・テーマの更新や設定変更のあと、トップページと主要ページ（サービス・料金・アクセス・FAQ）のHTMLソースで、noindex がないこと、application/ld+json が1つの事業として出ていることを確認する。",
            "【作業のたび】セキュリティ・CDN・WAFの設定を変えたら、変えた内容と日付を記録し、翌日以降のアクセスログでAI検索のクローラの応答コードを見る。",
            "【毎月】/robots.txt と /llms.txt が 200 で返り、内容が意図どおりか確認する。[llms.txtの書き方](/guide/llms-txt)",
            "【毎月】お客様の営業時間・料金・住所・サービスに変更がなかったか聞き、ページ・構造化データ・llms.txt・外部のプロフィールを突き合わせる。",
            "【毎月】決めた質問をAIに聞き、事業が名前で出たか、サイトが引用されたかを記録する（任意。手順は[AIでの登場率の測り方](/guide/measure-ai-visibility)）。",
            "【移転のとき】「検索エンジンがサイトをインデックスしないようにする」のチェック、X-Robots-Tag ヘッダー、Basic認証、IP制限が本番に残っていないかを確認する。",
            "【移転のとき】サーバーに robots.txt ファイルを持ち込んでいないか、持ち込んだならその内容が意図どおりかを確認する。",
            "【SEOプラグインを変えるとき】構造化データの出し方が変わるので、重複と抜けを確認する。[SEOプラグインに店舗の構造化データを足す方法](/guide/local-business-schema-seo-plugins)",
          ],
        },
        {
          heading: "月次報告に足す「AIが読めるか」の行",
          table: {
            head: ["項目", "書き方の例"],
            rows: [
              ["インデックスの拒否", "主要5ページで noindex なし（前月と同じ）"],
              ["robots.txt", "AI検索のクローラの拒否なし。今月の変更なし"],
              ["AIクローラのアクセス", "OAI-SearchBot・PerplexityBot のリクエストあり、応答は200（アクセスログで確認）"],
              ["構造化データ", "トップページに事業の情報が1件。営業時間の変更を反映"],
              ["llms.txt", "200で返る。新しいお知らせページを反映"],
              ["今月の設定変更", "WAFのボット対策を強化（日付）。AI検索のクローラへの影響なしを確認"],
              ["AIでの見え方（任意）", "決めた質問ごとの言及・引用の有無と、何回聞いた結果か"],
            ],
          },
          after: [
            "多くの保守報告にはすでに「更新したプラグイン」「バックアップ」「稼働状況」の行があります。そこに上の数行を足すだけで、AI検索対策を保守の一部として説明できます。AIでの見え方は、すべての回答を観測したものではなくサンプルなので、1回の結果で判断しないことも報告に書き添えましょう。",
          ],
        },
        {
          heading: "お客様への説明と契約で気をつけること",
          list: [
            "AIに表示されること・順位は約束しない。約束するのは、確認の頻度と項目、見つけたときの対応です。",
            "学習用クローラの許可・拒否は、お客様の判断として記録する。AI検索のクローラとは分けて説明します。",
            "プラグインの導入や robots.txt の変更は、事前にお客様に知らせる。導入のお知らせ文の例は[パートナープログラム](/partner/)のページにあります。",
            "CDN・WAFの契約がお客様名義のときは、誰が設定を変えてよいかを決めておく。",
          ],
        },
        {
          heading: "Nurevo AEOで確認を回す場合",
          paragraphs: [
            "Nurevo AEOのWordPressプラグイン（[WordPress.org](" + WP_ORG + ")）は無料で、0〜100のAEOスコアと直すべき項目のチェックリスト、構造化データ・llms.txt・AIクローラの許可設定を管理画面から整えられます。robots.txt に追加する記述は、/wp-admin/ などサイトの既存のルールをAIのクローラにも繰り返して適用します。Yoast SEO・Rank Math・All in One SEO・Slim SEO の構造化データには不足分だけを足し、二重に出しません。0.9.1 からは SEO SIMPLE PACK・VK All in One Expansion Unit とも、構造化データが重ならないように併用できます。",
            "多くのサイトを保守している場合は、WP-CLI の wp nurevo status で、そのサイトの出力が有効か、構造化データ・llms.txt・AIクローラの設定のどれを公開しているかを確かめられます。設定は wp nurevo export / import でほかのサイトへ写せます（キーや接続情報は含まれません）。管理者は REST の GET /wp-json/nurevo/v1/status でも状態を読めます。まとめて導入する手順は[パートナープログラム](/partner/)のページにあります。",
            "正直に書くと、Nurevoの診断は、Nurevoのサービスがサイトのトップページ・robots.txt・llms.txtを取得して行うもので、AIのクローラとして取得するわけではありません。CDNやWAFがAIのクローラだけを止めている場合は、診断では分からないことがあります。その確認は、上のとおりアクセスログで行ってください。",
            "AIでの見え方は、接続したFree・Standardのサイトなら毎月の無料AIチェック（Perplexityに3問）、Pro（月14,800円〜、ベータ）ならPerplexityでのAI登場率を継続して計測できます。評価基準の自動更新はStandard（月3,000円）です。制作会社・保守会社向けには、自社ブランドの月次レポートや、紹介したお客様の有料プランの月額の40%（Stripe手数料控除後）をお支払いする紹介報酬があります（条件は[パートナープログラム](/partner/)をご覧ください）。",
          ],
        },
      ],
      faqs: [
        { q: "保守契約にAI検索対策を入れるには、何から始めればよいですか？", a: "まず今の保守の手順書に、作業のあとの確認（noindex がないか、構造化データが出ているか）と、毎月の robots.txt・llms.txt の確認を足すところからです。新しい施策より、今のサイトがAIに読める状態を保つことが先です。" },
        { q: "セキュリティを強めると、AI検索に出にくくなりますか？", a: "設定しだいです。ボット対策やWAFがAI検索のクローラまで止めると、そのAIはページを読めません。用途ごとに許可・拒否を選べる設定もあるので、何を止めるのかを確認してから適用し、アクセスログで応答コードを確かめましょう。" },
        { q: "robots.txt に問題がなければ、インデックスの拒否はしていないと言えますか？", a: "言えません。WordPress 5.3 以降、「検索エンジンがサイトをインデックスしないようにする」は robots.txt ではなく robots メタタグで伝えます。サーバーの X-Robots-Tag ヘッダーでも拒否できるので、HTMLソースとレスポンスヘッダーの両方を確認します。" },
        { q: "学習用のAIクローラは止めてもよいですか？", a: "お客様の方針しだいです。学習用クローラ（GPTBot など）の扱いは、AI検索のクローラ（OAI-SearchBot など）とは別の判断です。保守会社が決めず、お客様に選んでもらい、その内容を記録しておきましょう。" },
        { q: "AIでの見え方まで毎月測る必要がありますか？", a: "必須ではありません。保守として最低限やるべきなのは「AIが読める状態か」の確認です。見え方の計測は、お客様が希望する場合に、決めた質問を同じ条件で確かめる形で追加すると無理がありません。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "保守しているサイトを、AIがどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラ設定の現状がわかります。保守の月次確認の入口にお使いください。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "Google、ChatGPT、OpenAI、Perplexity、Cloudflare、WordPress、Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitおよび各製品名は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },

    en: {
      title: "AI Search for WordPress Maintenance Providers: Checklist | Nurevo",
      description: "For WordPress care-plan providers: how migrations, WAF/CDN settings, SEO plugin changes and robots.txt edits stop AI reading a site, and how to check every month.",
      h1: "AI search for WordPress maintenance providers: a checklist so routine work does not stop AI reading your clients' sites",
      lead: "For a WordPress maintenance provider, the first job in AI search optimization is not adding new tactics but checking that routine maintenance (migrations, security and CDN settings, plugin and theme changes, robots.txt edits) has not broken AI crawler access or structured data. Split the checks into three moments, after each job, every month and at migration, and they fit into the maintenance process you already run.",
      intro: [
        "Written November 10, 2026 (JST). What Cloudflare and WordPress say was checked in their own documentation that day. Their behaviour can change, so check the current pages before you work.",
        "This guide is for companies and freelancers who already maintain WordPress sites. How to design AI search as a monthly service (scope and pricing) is covered in [How agencies can offer AI search optimization monthly](/guide/agency-aeo-monthly-service). Here we focus on the accidents that quietly make a site invisible to AI during everyday maintenance, and how to catch them.",
      ],
      sections: [
        {
          heading: "Why maintenance providers hold the key to AI search",
          paragraphs: [
            "When ChatGPT, Perplexity or Google's AI features answer a question about a business, they work from the pages their crawlers could read and the facts on them. Google says there are no additional requirements or special optimizations needed to appear in AI Overviews or AI Mode, and that SEO best practices still apply ([Google Search Central: AI features and your website](" + SRC.googleAi + ")). OpenAI says sites that disallow OAI-SearchBot will not be shown in ChatGPT search answers ([OpenAI: overview of crawlers](" + SRC.openai + ")).",
            "So whether AI can read a site comes down to whether crawlers can get in, whether indexing is refused, and whether the structured data and page text state the right facts. Every one of those can change during maintenance. A setting left over from a migration, bot protection added while hardening security, a switch of SEO plugin: well-meant work can stop AI from seeing a site.",
            "These accidents are invisible to a person looking at the site. It looks normal; enquiries just dip a little. That is why the people who touch the site every month are best placed to own the checks. AI answers also vary between days and runs of the same question: these checks keep a site readable for AI, they do not guarantee that an AI will mention it.",
          ],
        },
        {
          heading: "Maintenance jobs, the accidents they cause, and how to check",
          table: {
            head: ["Maintenance job", "Typical accident", "How to check"],
            rows: [
              ["Pushing staging to production, server migration", "The site goes live with \"Discourage search engines from indexing this site\" (Settings › Reading) still ticked", "Look for a noindex robots meta tag in the production HTML source, and check the setting itself"],
              ["Moving to new hosting", "Staging Basic auth, an X-Robots-Tag header or IP restrictions are carried over", "Open key pages logged out and from another network; check the response headers for X-Robots-Tag: noindex"],
              ["Changing security plugin, WAF or CDN settings", "Bot protection or rate limits also stop the crawlers AI search uses", "Review the CDN/WAF bot settings and read the server access log for the status codes returned to OAI-SearchBot, PerplexityBot and similar"],
              ["Hand-editing robots.txt or uploading a file", "A physical robots.txt on the server means the robots.txt WordPress and its plugins generated is no longer used", "Open /robots.txt: is it what you intended, and does it Disallow AI search crawlers?"],
              ["Switching SEO plugin or theme", "The business structured data disappears, or appears twice as two businesses", "Count the application/ld+json blocks in the source of key pages and read their facts (name, address, phone, hours)"],
              ["Changing caching or performance plugin settings", "Stale HTML keeps being served, or optimisation settings change how structured data or text is output", "Clear the cache, then read the HTML source while logged out"],
              ["Client asks to change hours, prices or address", "Only the page text is changed; structured data, llms.txt and the Google Business Profile stay out of date", "Compare the changed facts across the page, structured data, llms.txt and external profiles"],
              ["SSL certificate and domain renewals", "An expiry makes the site unreadable to everyone", "Expiry monitoring, already part of normal maintenance"],
            ],
            caption: "None of this needs special tools. Even one \"checked\" column in your job log cuts down on misses.",
          },
        },
        {
          heading: "The \"do not index\" setting that survives migrations",
          paragraphs: [
            "Since WordPress 5.3, \"Discourage search engines from indexing this site\" no longer adds Disallow to robots.txt; it outputs a robots meta tag (noindex, nofollow) on the pages instead ([Make WordPress Core: changes to prevent search engines indexing sites](" + SRC.wp53 + ")). If you only look at robots.txt and see nothing wrong, you will miss it. Check for meta name='robots' in the HTML source.",
            "The same post recommends that development and staging sites send an X-Robots-Tag: noindex, nofollow header from the server, covering images and PDFs too. That is a server or hosting setting, not a WordPress one, so after switching to production, check the response headers to make sure it has not been left on.",
          ],
        },
        {
          heading: "Are security, CDN or WAF settings blocking AI crawlers?",
          paragraphs: [
            "This is the hardest one to notice when a maintenance provider tightens security. Many bot protections can lump AI crawlers in with \"unknown automated traffic\" and stop them all.",
            "Cloudflare, for example, has a setting that groups AI crawlers and agents by behaviour: Search (collecting or indexing content to answer questions later), Agent (acting in real time on a person's behalf) and Training (using content to train models). For each you choose Block, Block on pages with ads, or Allow. Its documentation says new domains use Allow for all three by default, and that Training also covers mixed-purpose crawlers used for both training and search ([Cloudflare: AI Crawler and Agent access policies](" + SRC.cfPolicies + "), updated November 2, 2026). If you change the setting to stop training, read what it will stop before applying it.",
            "The server access log is the most reliable check. Are requests from OAI-SearchBot, PerplexityBot and similar arriving, and do they get 200 or 403? You can also test with curl by sending only a crawler's user agent, but Cloudflare says it identifies verified bots by a cryptographic signature, a published IP list or reverse DNS ([Cloudflare: Verified bots](" + SRC.cfVerified + ")), so a request that merely claims to be a crawler may not be treated like the real one. Do not rely on that test alone.",
            "Crawler names and purposes are documented by each company ([OpenAI](" + SRC.openai + "), [Perplexity](" + SRC.perplexity + ")). Whether to allow training crawlers such as GPTBot is a separate decision from appearing in AI search, so let the client make it rather than deciding for them.",
          ],
        },
        {
          heading: "Maintenance checklist: after each job, monthly, at migration",
          paragraphs: ["Written so you can paste it into your existing maintenance runbook."],
          list: [
            "[After each job] After plugin or theme updates and setting changes, check the HTML source of the home page and key pages (services, pricing, location, FAQ): no noindex, and application/ld+json describing one business.",
            "[After each job] When you change security, CDN or WAF settings, log what and when, and check the status codes AI search crawlers get in the access log over the following days.",
            "[Monthly] Check that /robots.txt and /llms.txt return 200 with the content you intend. [How to write llms.txt](/guide/llms-txt)",
            "[Monthly] Ask the client whether hours, prices, address or services changed, and compare the page, structured data, llms.txt and external profiles.",
            "[Monthly] Ask AI your fixed set of questions and record whether the business was named and the site cited (optional; see [How to measure AI visibility](/guide/measure-ai-visibility)).",
            "[At migration] Make sure \"Discourage search engines\", X-Robots-Tag headers, Basic auth and IP restrictions have not reached production.",
            "[At migration] Check whether a robots.txt file came across to the server and, if so, that its content is what you intend.",
            "[When changing SEO plugin] Structured data output changes, so check for duplicates and gaps. [Adding business schema to your SEO plugin](/guide/local-business-schema-seo-plugins)",
          ],
        },
        {
          heading: "\"Can AI read it?\" rows for the monthly report",
          table: {
            head: ["Item", "Example entry"],
            rows: [
              ["Indexing refused", "No noindex on the 5 key pages (same as last month)"],
              ["robots.txt", "No AI search crawlers disallowed. No changes this month"],
              ["AI crawler access", "Requests from OAI-SearchBot and PerplexityBot, answered with 200 (from the access log)"],
              ["Structured data", "One business entity on the home page. New opening hours reflected"],
              ["llms.txt", "Returns 200. New news page added"],
              ["Setting changes this month", "Tightened WAF bot protection (date). Confirmed no effect on AI search crawlers"],
              ["AI visibility (optional)", "For each fixed question, whether the business was mentioned or cited, and how many runs that is based on"],
            ],
          },
          after: [
            "Most maintenance reports already have rows for plugins updated, backups and uptime. Adding the rows above is enough to present AI search as part of maintenance. AI visibility is a sample rather than every answer, so say in the report that one run should not be read on its own.",
          ],
        },
        {
          heading: "What to tell clients and put in the contract",
          list: [
            "Do not promise appearances or positions in AI. Promise how often you check, what you check and what you do when you find something.",
            "Record the client's decision on training crawlers, and explain it separately from AI search crawlers.",
            "Tell clients before installing plugins or changing robots.txt. A sample notice is on the [partner program](/partner/?lang=en) page.",
            "When the CDN or WAF account is in the client's name, agree who may change its settings.",
          ],
        },
        {
          heading: "Running the checks with Nurevo AEO",
          paragraphs: [
            "The Nurevo AEO WordPress plugin ([WordPress.org](" + WP_ORG + ")) is free. It gives a 0 to 100 AEO score with a checklist of what to fix, and sets up structured data, llms.txt and AI crawler access from the admin screen. The robots.txt entries it adds repeat the site's existing rules, such as /wp-admin/, for AI crawlers. With Yoast SEO, Rank Math, All in One SEO and Slim SEO it adds only the missing facts to their structured data instead of publishing a second set. From 0.9.1 it also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicate structured data.",
            "If you maintain many sites, wp nurevo status in WP-CLI shows whether a site's output is on and which of structured data, llms.txt and AI crawler rules it publishes. Settings can be copied to other sites with wp nurevo export / import (keys and connection details are not included), and administrators can read the state from GET /wp-json/nurevo/v1/status. The bulk rollout steps are on the [partner program](/partner/?lang=en) page.",
            "To be clear about the limits: Nurevo's diagnosis is made by the Nurevo service fetching the site's front page, robots.txt and llms.txt, not by fetching as an AI crawler. If a CDN or WAF blocks only AI crawlers, the diagnosis may not show it. Use the access log for that, as described above.",
            "For AI visibility, connected Free and Standard sites get a monthly free AI check (three questions to Perplexity), and Pro (from $99/month, beta) measures how often the business appears in Perplexity answers over time. Automatic updates to the scoring criteria are Standard ($20/month). For agencies and maintenance providers there are branded monthly client reports and a referral commission of 40% of each referred customer's paid plan, net of Stripe fees (see the [partner program](/partner/?lang=en) for the conditions).",
          ],
        },
      ],
      faqs: [
        { q: "Where should a maintenance provider start with AI search?", a: "Add two things to your current runbook: a check after each job (no noindex, structured data present) and a monthly check of robots.txt and llms.txt. Keeping the site readable for AI comes before any new tactic." },
        { q: "Does tightening security make a site less likely to appear in AI search?", a: "It depends on the settings. If bot protection or a WAF also stops AI search crawlers, those AIs cannot read the pages. Some services let you allow or block by purpose, so check what a setting stops before applying it, then confirm the status codes in the access log." },
        { q: "If robots.txt looks fine, is the site definitely not refusing indexing?", a: "No. Since WordPress 5.3, \"Discourage search engines\" works through a robots meta tag, not robots.txt, and a server can also refuse indexing with an X-Robots-Tag header. Check both the HTML source and the response headers." },
        { q: "Is it fine to block AI training crawlers?", a: "That is the client's call. Training crawlers such as GPTBot are a separate decision from AI search crawlers such as OAI-SearchBot. Let the client choose, and record what they chose." },
        { q: "Do we need to measure AI visibility every month?", a: "Not necessarily. The minimum for maintenance is checking that AI can read the site. Measuring visibility can be added for clients who want it, by asking a fixed set of questions under the same conditions." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See how AI reads the sites you maintain",
        body: "The free check needs no sign-up and shows the current state of structured data, llms.txt and AI crawler settings. Use it as the starting point for your monthly checks.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "Google, ChatGPT, OpenAI, Perplexity, Cloudflare, WordPress, Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit and their product names are trademarks or registered trademarks of their respective owners. Nurevo is not affiliated with them.",
    },
  },
};
