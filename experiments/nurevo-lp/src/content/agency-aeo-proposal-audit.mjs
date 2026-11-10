// Content page: how a web or SEO agency runs a first AI search (AEO) audit for a
// prospect and turns it into an honest proposal. Agency page; companion to
// agency-aeo-monthly-service (which covers the service design, monthly work,
// reporting and pricing). This page covers the sales step only: what to check,
// how to read it, what goes in the proposal, and what not to promise.
//
// Written 2026-11-02 (JST). Every claim about Nurevo AEO comes from the
// plugin's readme (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt),
// the free checker (public/check/index.html: structured data, key facts, body
// text, llms.txt and consistency; 0-100; score capped when the reachability
// gate fails) or the partner page (public/partner/index.html).
//
// Outside facts, checked on the primary pages linked in the copy on 2026-11-02:
// - Google "Do you need an SEO?" (updated 2026-06-05): "No one can guarantee a
//   #1 ranking on Google"; questions to ask before hiring, including "Will you
//   share with me all the changes you make to my site".
// - Google "Optimizing for generative AI features" (updated 2026-07-10): built on
//   core Search systems, still SEO; a page must be indexed and eligible to be
//   shown with a snippet; no new machine-readable / AI text files needed; Google
//   Search ignores llms.txt; no special schema.org markup; no third-party tool
//   has access to Google's internal ranking or AI systems.
// - Google "Third-party SEO tools and advice" (updated 2026-06-05): tools can't
//   guarantee performance; promising improvements for AI experiences is listed
//   among the claims to evaluate carefully.
// - Search Console Help, Generative AI performance report (Search): impressions
//   only; AI Overviews and AI Mode; may not appear with too few impressions.
// - OpenAI crawlers overview / Perplexity crawlers: as in agency-aeo-monthly-service.
//
// Agencies join as referral partners only (see the channel rule in
// scripts/check-static.mjs): the client holds its own Nurevo plan and the agency
// charges for its own work. Keep it that way in every language.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  hireSeo: "https://developers.google.com/search/docs/fundamentals/do-i-need-seo",
  aiGuide: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide",
  thirdParty: "https://developers.google.com/search/docs/fundamentals/third-party-seo",
  gscGenAi: "https://support.google.com/webmasters/answer/16984139",
  openai: "https://developers.openai.com/api/docs/bots",
  perplexity: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers.md",
  richResults: "https://search.google.com/test/rich-results",
  schemaValidator: "https://validator.schema.org/",
};

export default {
  slug: "agency-aeo-proposal-audit",
  targetQueries: [
    "AI search audit for clients",
    "how to pitch AEO to clients",
    "GEO audit proposal template agency",
    "AI検索対策 提案書",
    "LLMO 提案 制作会社 診断",
    "AEO 初回診断 進め方",
  ],
  related: ["agency-aeo-monthly-service", "measure-ai-visibility", "aeo-tools-comparison", "llms-txt", "local-business-schema-seo-plugins"],
  locales: {
    ja: {
      title: "AI検索対策の提案書と初回診断の進め方（制作会社向け）| Nurevo",
      description: "制作会社・SEO会社がAI検索対策（AEO・LLMO）を提案する前の初回診断の手順、結果の読み方と優先順位、提案書の章立て、約束してはいけない表現の言い換えをGoogleの公式情報をもとに解説。",
      h1: "AI検索対策（AEO）の提案書と初回診断の進め方：制作会社のための手順とテンプレート",
      lead: "AI検索対策を提案する前の初回診断は、「AIがサイトを読める状態か」（技術の確認）と「AIの回答で今どう扱われているか」（決めた質問でのサンプル）の2つに分けて行い、提案書には、見つかった問題・直す作業・確かめ方・約束しないことの4つを書きます。AIの回答は日や回によって変わるため、掲載や順位は約束せず、作業と報告を約束する提案にするのが、あとで揉めない進め方です。",
      intro: [
        "作成日：2026年11月2日。Googleの説明は、同日に公式ドキュメント（Google検索セントラル、Search Consoleヘルプ）で確認したものです。仕様は変わることがあるため、提案前に最新の情報をご確認ください。",
        "この記事は「売る前」の手順です。月額サービスの作業範囲・月次レポート・価格の決め方は[制作会社がAI検索対策を月額サービスにする方法](/guide/agency-aeo-monthly-service)にまとめています。",
      ],
      sections: [
        {
          heading: "初回診断は2つに分ける：読めるか、どう見えているか",
          paragraphs: [
            "AI検索対策の相談を受けると、つい「ChatGPTで聞いてみたら出てこなかった」という1回の結果から話を始めがちです。しかし、AIの回答は同じ質問でも変わるうえ、出てこない理由が「サイトを読めていない」のか「読めているが選ばれていない」のかで、直す作業がまったく違います。初回診断では、この2つを分けて確かめます。",
          ],
          table: {
            head: ["区分", "確かめること", "直せる速さ"],
            rows: [
              ["A. 読める状態か（技術）", "AIクローラの許可、構造化データ、表示テキストとの一致、llms.txt、インデックスの状態", "多くはサイト側の作業で直せる"],
              ["B. どう見えているか（回答）", "決めた質問をAIに聞いたときの言及・引用の有無、事業の事実が正しく答えられているか", "すぐには変えられない。継続して確かめる"],
            ],
            caption: "提案書では、Aは「直す作業」、Bは「確かめ方と報告」として扱うと、約束できることとできないことが自然に分かれます。",
          },
        },
        {
          heading: "初回診断の手順（7ステップ）",
          list: [
            "1. ヒアリング：業種、営業地域、主なサービスや商品、見込み客がAIに聞きそうな質問を3〜5個、お客様自身に挙げてもらいます。お客様の言葉で質問を集めると、提案が「自分ごと」になります。",
            "2. URLの診断：登録不要の[無料チェック](/check)などで、構造化データ・重要な事業情報・本文・llms.txt・情報の一貫性を確認します。点数そのものより、赤や黄色になった項目の中身をメモします。",
            "3. AIクローラの確認：/robots.txtを開き、AI検索が使うクローラを止めていないか確かめます。OpenAIは、OAI-SearchBotを拒否したサイトはChatGPTの検索回答に表示されないとしています（[OpenAI：クローラの概要](" + SRC.openai + ")）。PerplexityもPerplexityBotの許可を案内しています（[Perplexity：クローラ](" + SRC.perplexity + ")）。学習用クローラ（GPTBotなど）を許可するかどうかは別の判断で、お客様が決めることです。",
            "4. 構造化データの確認：[リッチリザルトテスト](" + SRC.richResults + ")や[Schema Markup Validator](" + SRC.schemaValidator + ")で、会社・店舗の名前、住所、電話、営業時間、業種などが出ているか、SEOプラグインと二重になっていないかを見ます。[SEOプラグインに店舗の構造化データを足す方法](/guide/local-business-schema-seo-plugins)",
            "5. 表示内容との一致：構造化データ、トップページ、会社概要、Googleビジネスプロフィールで、営業時間・料金・住所が食い違っていないかを確認します。AIが古い情報を答える原因は、多くがここにあります。",
            "6. 決めた質問をAIに聞く：手順1の質問を、ChatGPT・Perplexity・GoogleのAIモードなどで聞き、日時・ログインの有無・地域などの条件と一緒に、言及・引用の有無と回答の要旨を記録します。1回の結果で判断しないことを、記録の段階から明記しておきます。[AIでの登場率の測り方](/guide/measure-ai-visibility)",
            "7. Search Consoleの確認（閲覧権限がある場合）：Search Consoleの生成AIパフォーマンスレポートでは、AIによる概要とAIモードに表示されたサイトへのリンクの表示回数を確認できます。クリック数や順位は出ず、表示が少ないサイトではレポート自体が表示されないことがあります（[Search Consoleヘルプ](" + SRC.gscGenAi + ")）。",
          ],
        },
        {
          heading: "どんな質問で確かめるか：3種類を混ぜる",
          paragraphs: [
            "初回診断で使う質問は、数を増やすより種類を混ぜるほうが、提案の材料になります。おすすめは次の3種類です。",
          ],
          list: [
            "業種×地域の質問：「横浜で土曜も開いている整骨院は？」のように、事業名を入れずに聞く質問。見込み客が実際に聞く形に近く、出てこなくても「読めていない」とは限らない点に注意します。",
            "比べる・選ぶ質問：「小さな会社のホームページ制作、どこに頼むか選び方は？」のように、比較や選び方を聞く質問。どんなサイトが引用されているかを見ると、作るべきページ（比較表、料金ページ、FAQなど）のヒントになります。",
            "事業名で事実を確かめる質問：「◯◯歯科の土曜の診療時間は？」のように、事業名を入れて事実を聞く質問。ここで営業時間や料金が間違っていれば、直す作業がはっきりしているため、お客様にとっていちばん納得しやすい診断結果になります。",
          ],
        },
        {
          heading: "診断結果の読み方と優先順位",
          table: {
            head: ["見つかったこと", "意味", "優先度"],
            rows: [
              ["robots.txtでOAI-SearchBotやPerplexityBotを拒否している", "そのAI検索に表示される前提が欠けている", "最優先（すぐ直せる）"],
              ["ページがインデックスされていない、スニペット表示を止めている", "GoogleのAI機能に表示される条件を満たしていない", "最優先"],
              ["事業名で聞くと、営業時間や料金が間違って答えられる", "サイト内外の情報が古いか、食い違っている", "高（原因の情報を直す）"],
              ["構造化データがない、または表示テキストと一致しない", "AIや検索エンジンが事業の事実を読み取りにくい", "高"],
              ["SEOプラグインとテーマで構造化データが二重に出ている", "同じ事業が2つあるように読まれるおそれ", "中"],
              ["llms.txtがない", "Google検索は使わないが、他のサービスが読む場合の補助", "低（効果は約束しない）"],
              ["業種×地域の質問で名前が出ない", "読めていても選ばれていない可能性。すぐには変えられない", "継続して確かめる"],
            ],
          },
          after: [
            "GoogleのAI機能に表示されるには、ページがインデックスされ、スニペット付きで表示できる状態であることが条件で、それ以外の特別な要件はないとGoogleは説明しています（[Google：生成AI機能のための最適化](" + SRC.aiGuide + ")）。同じページで、Google検索はllms.txtのようなファイルを使わないこと、AIのための特別なschema.orgのマークアップもないことが明記されています。初回診断の優先順位は、この公式の説明に合わせて並べると、お客様にも説明しやすくなります。",
          ],
        },
        {
          heading: "提案書の章立て（テンプレート）",
          list: [
            "1. 現状の要約（1ページ）：Aの技術の確認で見つかった問題の数と、Bの質問で分かったことを3行で。点数だけを大きく見せない。",
            "2. 診断の方法と条件：使ったツール、聞いた質問、日時と条件。AIの回答はサンプルであり、日や回によって変わることを書く。",
            "3. 見つかった問題と直す作業：上の表のように、問題・意味・作業・優先度を1行ずつ。",
            "4. 作業範囲と費用：初期の実装（スポット）と月額（保守と確認）を分けて書く。お客様名義で契約してもらうツールの費用は、制作会社の作業費と分けて示す。",
            "5. 確かめ方と報告：毎月（または四半期ごと）に何を確かめ、何を報告するか。[月次レポートの項目例](/guide/agency-aeo-monthly-service)",
            "6. お約束しないこと：AIへの掲載、AIでの順位、問い合わせの増加は約束できないこと。理由も一言添える。",
            "7. お客様にご用意いただくもの：最新の料金表、営業時間、よくある質問とその答え、写真など。AI検索対策は、お客様の事実がそろわないと進みません。",
            "8. スケジュール：初期実装の完了時期と、最初の報告の時期。",
          ],
        },
        {
          heading: "約束してはいけない表現と、言い換え",
          paragraphs: [
            "Googleは、SEO会社を選ぶ際のページで「Google検索で1位を保証できる人はいない」と明記し、1位を保証する業者は避けるよう勧めています（[Google：SEOの専門家が必要ですか？](" + SRC.hireSeo + ")）。第三者のツールやアドバイスについても、成果は保証できないこと、AIでの改善をうたうサービスは慎重に評価すべきことを説明しています（[Google：第三者のSEOツールとアドバイス](" + SRC.thirdParty + ")）。お客様が後でこれらのページを読んでも矛盾しない提案にしておきましょう。",
          ],
          table: {
            head: ["言いがちな表現", "言い換え"],
            rows: [
              ["ChatGPTに必ず載ります", "ChatGPTの検索がサイトを読める状態に整え、決めた質問での見え方を毎月確かめて報告します"],
              ["AIで1位にします", "AIの回答に順位はなく、同じ質問でも回答は変わります。言及・引用の有無を同じ条件で記録し、推移をお見せします"],
              ["llms.txtを置けばAIに出ます", "llms.txtは一部のサービス向けの補助です。Google検索は使わないと明言しているため、効果は約束しません"],
              ["AI専用の特別な構造化データを入れます", "GoogleはAI専用のマークアップはないとしています。通常の構造化データを、表示内容と一致させて整えます"],
              ["当社のツールはAIの内部評価がわかります", "外部のツールはAIの内部の仕組みを見られません。わかるのは、質問を投げた結果のサンプルです"],
            ],
          },
          after: [
            "Googleが採用前に聞くべき質問として挙げている「サイトに加えた変更をすべて共有してもらえるか」も、提案書の段階で答えておくと信頼につながります。作業の記録を毎月渡すことを、提案書の「確かめ方と報告」に入れておきましょう。",
          ],
        },
        {
          heading: "Nurevoで初回診断と提案を進める場合",
          paragraphs: [
            "URLの診断は、登録不要の[無料チェック](/check)で、構造化データ・重要な事業情報・本文・llms.txt・情報の一貫性を0〜100点で確認できます。AIがサイトに到達できない場合は、点数に上限がかかるため、手順3の問題もすぐにわかります。",
            "WordPressのサイトなら、無料のプラグイン（[WordPress.org](" + WP_ORG + ")）で、AEOスコアと直すべき項目のチェックリスト、構造化データ・llms.txt・AIクローラ設定の修正までを管理画面から行えます。Yoast SEO・Rank Math・All in One SEO・Slim SEOの構造化データは置き換えずに不足分だけを足し、SEO SIMPLE PACKやVK All in One Expansion Unitとも構造化データが重複しないため、既存の制作物を壊さずに実装を始められます。接続したFree・Standardのサイトでは、月に1回、業種と地域から作った3つの質問（事業名は使いません）をPerplexityに聞き、名前が出たか・サイトが引用されたかを表示します。",
            "制作会社・SEO会社向けには、自社サイトに置けるAI診断ウィジェット（診断した見込み客が御社のリードとして届きます）、社名・ロゴ入りの月次レポート、複数サイトの一括管理、紹介報酬があります（承認制）。詳しくは[パートナープログラム](/partner/)をご覧ください。",
            "正直に言うと、追えるAIの数や質問の数、競合の分析では、計測を専門にするツールのほうが上です。Nurevo ProのAI登場率の計測は現在Perplexityが対象（ベータ）です。提案の目的に合わせて、計測は別のツールを組み合わせるのも選択肢です。[AEOツールの比較と選び方](/guide/aeo-tools-comparison)",
          ],
        },
      ],
      faqs: [
        { q: "初回診断は無料で行うべきですか？", a: "決まりはありません。URLの診断や数問の確認のように短時間でできる範囲は無料にし、質問を増やした計測や競合の比較は有料の診断として分ける方法がよく使われます。どこまでが無料かを最初に伝えておくと、提案がスムーズになります。" },
        { q: "診断で「AIに出ていない」とわかったら、何と説明すればよいですか？", a: "1回の結果では判断できないこと、出ていない理由が「読めていない」のか「選ばれていない」のかで対策が違うことを説明します。そのうえで、読める状態を整える作業（すぐ直せること）と、見え方を継続して確かめること（すぐには変わらないこと）を分けて提案します。" },
        { q: "お客様に「SEOと同じでは？」と聞かれたら？", a: "Google自身が、生成AI機能のための最適化もSEOであると説明しています。作業の多くは重なることを認めたうえで、AIが読む事業の事実（営業時間・料金・サービス）を正確に保つことと、AIでの見え方を定期的に確かめることを加える、と説明するのが正確です。[AEO・SEO・GEOの違い](/guide/aeo-vs-seo-vs-geo)" },
        { q: "提案書に、AIからの流入数の見込みを書いてもよいですか？", a: "根拠のない予測はおすすめしません。Search Consoleの生成AIパフォーマンスレポートで確認できるのは表示回数で、AI機能からのクリックを分けて見ることはできません。数字を書く場合は、実際に計測した値と、その条件を書きましょう。" },
        { q: "WordPress以外のサイトでも同じ手順で診断できますか？", a: "できます。robots.txt、構造化データ、表示内容の確認、質問による確認はどのサイトでも同じです。Nurevoでは、WordPress以外のサイトはスニペット、サイトのないお店はホストページで対応しています。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "提案前に、お客様のサイトをAIがどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラ設定の現状がわかります。制作会社・SEO会社向けのパートナープログラムもご用意しています。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "パートナープログラムを見る", href: "/partner/" },
      },
      footnote: "Google、Search Console、ChatGPT、OpenAI、Perplexity、WordPress、Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitおよび各製品名は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },

    en: {
      title: "AI Search Audit and Proposal: A Guide for Agencies | Nurevo",
      description: "How a web or SEO agency runs a first AI search (AEO/GEO) audit for a prospect, reads the results, structures the proposal, and rewords promises no one can keep.",
      h1: "How to run a first AI search (AEO) audit and write the proposal: a guide for agencies",
      lead: "Run the first AI search audit in two parts: can AI read the site (a technical check), and how does the business show up in AI answers today (a sample from a fixed set of questions). Then write a proposal that covers four things: the problems found, the work to fix them, how you will check progress, and what you will not promise. AI answers change between days and runs, so promise the work and the reporting, not mentions or positions. That is what keeps the relationship clean later.",
      intro: [
        "Written November 2, 2026. Google's guidance was checked that day in its own documentation (Google Search Central and Search Console Help). It can change, so check the current pages before you pitch.",
        "This guide covers the step before the sale. For the scope, monthly work, report and pricing of the service itself, see [how agencies can offer AI search optimization monthly](/guide/agency-aeo-monthly-service).",
      ],
      sections: [
        {
          heading: "Split the audit in two: can AI read it, and how does it show up",
          paragraphs: [
            "Conversations about AI search often start with \"I asked ChatGPT and we weren't there\". That is a single run, and AI answers vary for the same question. More importantly, the fix depends on why the business is missing: AI cannot read the site, or it can read it but does not pick it. The first audit separates the two.",
          ],
          table: {
            head: ["Part", "What you check", "How fast it can change"],
            rows: [
              ["A. Can AI read the site? (technical)", "AI crawler access, structured data, consistency with visible text, llms.txt, indexing status", "Mostly fixable on the site itself"],
              ["B. How does it show up? (answers)", "Mentions and citations for a fixed set of questions, and whether AI gets the business's facts right", "Cannot be changed on demand. Keep checking"],
            ],
            caption: "In the proposal, treat A as \"work to fix\" and B as \"how we check and report\". What you can and cannot promise then separates on its own.",
          },
        },
        {
          heading: "The first audit in seven steps",
          list: [
            "1. Interview: ask for the business type, service area, main services or products, and three to five questions the client thinks prospects ask AI. Questions in the client's own words make the proposal about their business, not about AI in general.",
            "2. URL check: use a no-sign-up tool such as the [free check](/check) to look at structured data, key business facts, body text, llms.txt and consistency. Note what is red or yellow rather than the headline score.",
            "3. AI crawler access: open /robots.txt and make sure the crawlers AI search uses are not blocked. OpenAI says sites that opt out of OAI-SearchBot will not be shown in ChatGPT search answers ([OpenAI: overview of crawlers](" + SRC.openai + ")), and Perplexity recommends allowing PerplexityBot ([Perplexity: crawlers](" + SRC.perplexity + ")). Whether to allow training crawlers such as GPTBot is a separate decision, and it is the client's.",
            "4. Structured data: use the [Rich Results Test](" + SRC.richResults + ") or the [Schema Markup Validator](" + SRC.schemaValidator + ") to see whether the business name, address, phone, opening hours and type are published, and whether the SEO plugin and theme publish them twice. [Adding local business schema to your SEO plugin](/guide/local-business-schema-seo-plugins)",
            "5. Consistency: compare the structured data, the home page, the about page and the Google Business Profile for opening hours, prices and address. This is where most outdated AI answers start.",
            "6. Ask the fixed questions: put the questions from step 1 to ChatGPT, Perplexity, Google's AI Mode and so on, and record whether the business is mentioned or cited, a summary of the answer, and the conditions: date and time, signed in or not, location. Write down from the start that one run is not a verdict. [How to measure AI visibility](/guide/measure-ai-visibility)",
            "7. Search Console (if you have access): the Generative AI performance report shows impressions of links to the site in AI Overviews and AI Mode. It shows no clicks or positions, and it may not appear at all for sites with too few such impressions ([Search Console Help](" + SRC.gscGenAi + ")).",
          ],
        },
        {
          heading: "Which questions to use: mix three kinds",
          paragraphs: [
            "For a first audit, a mix of question types gives you more to work with than a long list of similar ones. We suggest three kinds.",
          ],
          list: [
            "Category and area: \"Which physio clinics in Leeds are open on Saturdays?\" No business name. This is close to how prospects ask, and a missing name here does not by itself mean AI cannot read the site.",
            "Compare and choose: \"How do I choose a web design agency for a small business?\" Look at which sites get cited. That points to the pages worth building: comparison tables, pricing pages, FAQs.",
            "Fact check by name: \"What are [business name]'s Saturday opening hours?\" If AI gets the hours or prices wrong here, the fix is concrete, which makes it the finding clients understand most readily.",
          ],
        },
        {
          heading: "Reading the results and setting priorities",
          table: {
            head: ["What you found", "What it means", "Priority"],
            rows: [
              ["robots.txt blocks OAI-SearchBot or PerplexityBot", "A precondition for that AI search is missing", "Top (quick fix)"],
              ["Pages not indexed, or snippets turned off", "The page does not meet the conditions for Google's AI features", "Top"],
              ["Asked by name, AI gives wrong hours or prices", "Information on or off the site is outdated or inconsistent", "High (fix the source)"],
              ["No structured data, or it does not match visible text", "AI and search engines struggle to read the business's facts", "High"],
              ["SEO plugin and theme both publish business markup", "May read as two businesses instead of one", "Medium"],
              ["No llms.txt", "Not used by Google Search; a helper for other services that read it", "Low (no promised effect)"],
              ["Business not named for category-and-area questions", "May be readable but not chosen. Cannot be changed on demand", "Keep checking"],
            ],
          },
          after: [
            "Google says a page must be indexed and eligible to be shown in Search with a snippet to appear in its generative AI features, with no further special requirements ([Google: optimizing for generative AI features](" + SRC.aiGuide + ")). The same page says Google Search ignores files such as llms.txt and that there is no special schema.org markup for AI. Ordering your priorities to match this official guidance makes them easier to explain to the client.",
          ],
        },
        {
          heading: "Proposal outline (template)",
          list: [
            "1. Summary (one page): in three lines, the number of technical problems from part A and what the questions in part B showed. Do not lead with a big score.",
            "2. Method and conditions: the tools, the questions, the dates and conditions. State that AI answers are a sample and vary between days and runs.",
            "3. Problems and the work to fix them: one row per problem, as in the table above: problem, meaning, work, priority.",
            "4. Scope and fees: separate the one-off setup from the monthly upkeep and checks. Show tool subscriptions the client holds in their own name apart from your own fees.",
            "5. How you will check and report: what you check every month (or quarter) and what goes in the report. [Example monthly report items](/guide/agency-aeo-monthly-service)",
            "6. What we do not promise: a mention in AI, a position in AI, more enquiries. Give the reason in one sentence.",
            "7. What we need from you: current prices, opening hours, common questions and their answers, photos. AI search work stalls without the client's facts.",
            "8. Timeline: when setup will be finished and when the first report arrives.",
          ],
        },
        {
          heading: "Promises to avoid, and what to say instead",
          paragraphs: [
            "In its page on hiring an SEO, Google states that no one can guarantee a #1 ranking on Google and advises finding someone else if an SEO guarantees first place ([Google: do you need an SEO?](" + SRC.hireSeo + ")). On third-party tools and advice, it says they cannot guarantee performance and lists services promising improvements for AI experiences among the claims to evaluate carefully ([Google: third-party SEO tools and advice](" + SRC.thirdParty + ")). Make sure your proposal still holds up if the client reads those pages later.",
          ],
          table: {
            head: ["Tempting claim", "Say instead"],
            rows: [
              ["You will appear in ChatGPT", "We will make sure ChatGPT search can read the site, check a fixed set of questions every month and report what we find"],
              ["We will get you to number one in AI", "AI answers have no positions and change for the same question. We record mentions and citations under the same conditions and show you the trend"],
              ["Add llms.txt and AI will find you", "llms.txt helps some services. Google says Search does not use it, so we do not promise an effect"],
              ["We will add special AI structured data", "Google says there is no special markup for AI. We tidy up ordinary structured data and keep it matching the page"],
              ["Our tool sees how AI ranks you internally", "No outside tool can see AI systems' internals. What we see is a sample of answers to the questions we ask"],
            ],
          },
          after: [
            "Google also suggests asking an SEO, \"Will you share with me all the changes you make to my site?\" Answer it in the proposal: commit to a monthly log of changes under \"How you will check and report\".",
          ],
        },
        {
          heading: "Running the audit and proposal with Nurevo",
          paragraphs: [
            "For the URL check, the [free check](/check) needs no sign-up and scores structured data, key business facts, body text, llms.txt and consistency from 0 to 100. If AI cannot reach the site, the score is capped, so a step 3 problem shows up straight away.",
            "On WordPress, the free plugin ([WordPress.org](" + WP_ORG + ")) gives an AEO score with a checklist of what to fix, and fixes structured data, llms.txt and AI crawler rules from the admin screen. It adds only what is missing to the structured data of Yoast SEO, Rank Math, All in One SEO or Slim SEO instead of replacing it, and avoids duplicate markup with SEO SIMPLE PACK and VK All in One Expansion Unit, so you can start without breaking a site you built. Connected Free and Standard sites get a monthly check: three questions built from the business type and area (never the business name) are put to Perplexity, and the screen shows whether the business was named or the site cited.",
            "For web and SEO agencies there is an AI check widget for your own site (prospects who run it arrive as your leads), monthly client reports under your own name and logo, every client site in one dashboard, and a referral commission (approval required). See the [partner program](/partner/?lang=en).",
            "To be fair about it: dedicated monitoring tools track more AI platforms and questions and go deeper on competitors. Nurevo Pro's AI visibility measurement currently covers Perplexity (beta). Depending on what the proposal needs, pairing Nurevo with a separate monitoring tool is a reasonable choice. [AEO tools compared](/guide/aeo-tools-comparison)",
          ],
        },
      ],
      faqs: [
        { q: "Should the first audit be free?", a: "There is no rule. A common split is to keep the quick part free (a URL check and a handful of questions) and charge for a deeper audit with more questions and competitor comparison. Saying up front where the free part ends makes the proposal easier." },
        { q: "The audit shows the business is not in AI answers. How do I explain it?", a: "Explain that one run is not a verdict, and that the fix depends on whether AI cannot read the site or reads it but does not pick it. Then propose the two separately: the work that makes the site readable (fixable now) and ongoing checks of how it shows up (which cannot be changed on demand)." },
        { q: "The client asks, \"Isn't this just SEO?\"", a: "Google itself says optimizing for generative AI features is still SEO. Accept that most of the work overlaps, then explain what you add: keeping the facts AI reads (hours, prices, services) accurate, and checking regularly how the business shows up in AI answers. [AEO vs SEO vs GEO](/guide/aeo-vs-seo-vs-geo)" },
        { q: "Can I put a forecast of AI traffic in the proposal?", a: "We advise against forecasts without a basis. The Search Console Generative AI performance report shows impressions; clicks from AI features cannot be separated out. If you include numbers, use values you actually measured and state the conditions." },
        { q: "Does the same audit work for sites not built on WordPress?", a: "Yes. robots.txt, structured data, consistency checks and question checks are the same on any site. Nurevo covers other sites with a snippet, and businesses without a website with a hosted page." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Before you pitch, see how AI reads your prospect's site",
        body: "The free check shows the current state of structured data, llms.txt and AI crawler access, no sign-up required. There is also a partner program for web and SEO agencies.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "See the partner program", href: "/partner/?lang=en" },
      },
      footnote: "Google, Search Console, ChatGPT, OpenAI, Perplexity, WordPress, Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit and their product names are trademarks of their respective owners. Nurevo is not affiliated with them.",
    },
  },
};
