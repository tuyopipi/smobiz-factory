// Content page: AI search (AEO) for B2B, SaaS and professional-services
// companies. Industry page.
//
// Written 2026-11-02 (JST). Every claim about Nurevo AEO comes from the plugin's
// readme (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt,
// 0.9.1), its code and experiments/webmcp-canary/docs/industries.md:
// - the "B2B / SaaS" site type publishes an Organization (the owner's type is
//   kept when it is an Organization kind such as ProfessionalService), drops
//   openingHours / geo / priceRange / potentialAction (includes/site-types.php);
// - each entered service becomes a Service, or a SoftwareApplication when "This
//   is software (SaaS or an app)" is ticked, with description, URL, category
//   (applicationCategory for software) and an Offer only when a price is
//   entered; no rating is ever added (nurevo-webmcp.php);
// - pricing and case-study page URLs are listed in llms.txt (site-types.php);
// - the diagnosis checks, for B2B: a description of what is offered, a pricing
//   page, case studies or FAQ, and company identity (industries.md §4);
// - Pro measurement asks B2B discovery questions such as "{task}におすすめの
//   {tool}は？", "導入事例が多い…は？", "…の乗り換え先としておすすめは？", never
//   with the company name (worker/sov-site-type.mjs); currently on Perplexity.
//
// Outside facts, checked on the primary pages linked in the copy on 2026-11-02:
// - Google "AI features and your website" (updated 2025-12-10): no additional
//   requirements; no special schema.org markup; structured data should match
//   visible text; AI feature traffic is counted in the Performance report (Web).
// - Google "Optimizing for generative AI features" (updated 2026-07-10): Google
//   Search doesn't use llms.txt or AI text files (neither helps nor harms);
//   structured data not required for AI features; no need to split content into
//   small pieces; warns against pages for every query variation (scaled content
//   abuse); inauthentic "mentions" are not as helpful as they might seem.
// - Google Organization (updated 2026-09-08): no required properties; recommended
//   name, url, logo, description, sameAs, contactPoint, etc.; home page or one
//   about page is enough.
// - Google Software app (updated 2026-09-08): required name, offers.price (0 for
//   free) and one of aggregateRating / review; recommended applicationCategory
//   (e.g. BusinessApplication) and operatingSystem.
// - Google Review snippet (updated 2026-09-08): fake reviews and incentivized
//   reviews without clear disclosure must not be included; self-serving reviews
//   on Organization pages are ineligible for stars.
// - Google Search updates: FAQ rich result no longer shown; documentation
//   removed 2026-06-15.
// - Search Console Help, Generative AI performance report: impressions of links
//   in AI Overviews / AI Mode; no clicks; may not appear with few impressions.
// - OpenAI crawlers: sites that opt out of OAI-SearchBot are not shown in
//   ChatGPT search answers; GPTBot is for training. Perplexity: PerplexityBot
//   surfaces and links sites in Perplexity search; allow it in robots.txt.
// - National Tax Agency: the corporate number (法人番号) is 13 digits, designated
//   by the NTA Commissioner; name, head-office address and number are published
//   and can be used by anyone.
// Re-check these when you update the page, and update the date with them.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  aiGuide: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide",
  googleOrg: "https://developers.google.com/search/docs/appearance/structured-data/organization",
  softwareApp: "https://developers.google.com/search/docs/appearance/structured-data/software-app",
  reviewSnippet: "https://developers.google.com/search/docs/appearance/structured-data/review-snippet",
  searchUpdates: "https://developers.google.com/search/updates",
  gscGenAiJa: "https://support.google.com/webmasters/answer/16984139?hl=ja",
  gscGenAiEn: "https://support.google.com/webmasters/answer/16984139?hl=en",
  openai: "https://developers.openai.com/api/docs/bots",
  perplexity: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers",
  houjinBangou: "https://www.houjin-bangou.nta.go.jp/setsumei/index.html",
};

export default {
  slug: "b2b-saas-ai-search",
  targetQueries: [
    "AI search optimization for B2B SaaS",
    "how to get your SaaS recommended by ChatGPT",
    "B2B AEO pricing page case studies",
    "BtoB SaaS AI検索対策",
    "SaaS LLMO 対策 方法",
    "法人向けサービス ChatGPT おすすめ 表示",
  ],
  related: ["aeo-tools-comparison", "measure-ai-visibility", "llms-txt", "aeo-wordpress", "aeo-vs-seo-vs-geo"],
  locales: {
    ja: {
      title: "BtoB・SaaSのAI検索対策：会社・料金・導入事例をAIに伝える | Nurevo",
      description: "BtoB・SaaSのAI検索対策は、何を誰にいくらで提供しているか、導入事例、会社の実体を、本文と構造化データで正確に公開することから。質問の型、ページの書き方、WordPressでの手順を解説。",
      h1: "BtoB・SaaSのAI検索対策：サービス・料金・導入事例・会社情報をAIに正しく読ませる手順",
      lead: "BtoB・SaaSのAI検索対策（AEO・LLMO）の中心は、「何を・どんな会社に・いくらで・どんな条件で提供しているか」と「実際にどこで使われたか」「どんな会社が提供しているか」を、自社サイトの本文と構造化データ（Organization・Service・SoftwareApplication）で正確に公開し、レビューサイトなど社外の情報とそろえることです。買い手がAIに「◯◯におすすめのツールは？」「◯◯の料金相場は？」と聞いたとき、AIが推測せずに答えられる材料をつくります。AI専用のタグや、質問ごとに量産したページは必要ありません。",
      intro: [
        "作成日：2026年11月2日（JST）。Google・OpenAI・Perplexity・国税庁の情報は、同日に各公式ページで確認したものです。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが自社とサービスの事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・おすすめに入ることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "BtoBの買い手はAIに何を聞くか",
          paragraphs: [
            "法人向けのサービスやSaaSについてAIに聞かれる質問は、店舗やネットショップと違い、比較と条件がからむものが中心です。Nurevo AEOのAI登場率の計測でBtoB向けに用意している質問も、次のような型になっています（どれも社名を含めずに聞きます）。",
          ],
          table: {
            head: ["質問の型", "例", "AIが答えるのに必要な事実"],
            rows: [
              ["業務からツールを探す", "「経費精算を効率化したい。どのツールがいい？」", "何の業務に使うものか、対象の会社規模"],
              ["カテゴリの比較", "「勤怠管理システムを比較して。主な選択肢は？」", "機能・対応範囲・他との違い"],
              ["料金", "「◯◯の料金相場と、おすすめを教えて」", "料金の単位（ユーザー数・件数など）、初期費用、最低契約期間"],
              ["実績", "「導入事例が多い◯◯は？」", "業種・規模がわかる導入事例"],
              ["乗り換え", "「◯◯の乗り換え先としておすすめは？」", "移行の方法、データの移し方、連携先"],
              ["社名で事実確認", "「（社名）はどんな会社？料金は？」", "会社概要、提供内容、料金ページ、問い合わせ先"],
            ],
            caption: "質問の型は Nurevo AEO の計測用の質問（BtoB・SaaS）をもとにまとめたものです。",
          },
          after: [
            `Googleは、AIによる概要やAIモードに出るための追加の要件や特別なschema.orgのマークアップはなく、構造化データはページに見える文章と一致させるよう案内しています。[Google：AI features and your website](${SRC.googleAi})。さらに2026年の生成AI向けガイドでは、Google検索はllms.txtなどのAI用ファイルを使わないこと、内容を細かく分ける必要はないこと、質問の言い回しごとにページを量産するのは大量生成コンテンツの不正使用にあたることを明記し、自社の経験や専門性にもとづく独自の内容を勧めています。[Google：生成AI機能向けの最適化ガイド](${SRC.aiGuide})`,
            "つまりBtoBで効くのは「AI向けの書き方」ではなく、比較・検討の段階で買い手が知りたい事実を、自社サイトにきちんと書いてあることです。",
          ],
        },
        {
          heading: "BtoB・SaaSのサイトで公開しておきたい情報",
          paragraphs: [
            `会社の情報はOrganization（組織）の構造化データで表します。Googleは、Organizationに必須のプロパティはなく、name・url・logo・description・sameAs（他サイトの公式プロフィールへのリンク）・contactPointなどを推奨し、トップページか会社概要ページの1か所に付ければよいとしています。[Google：組織の構造化データ](${SRC.googleOrg})`,
          ],
          table: {
            head: ["情報", "ページ本文での書き方", "構造化データ・llms.txt"],
            rows: [
              ["会社の実体", "正式な社名、所在地、設立年、代表者、問い合わせ先。法人番号も書くと照合しやすい", "Organization（必須項目なし）。sameAsでLinkedIn等の公式ページを示す"],
              ["提供内容", "サービスごとに、何の業務の何を解決するか、対象の業種・規模を1〜2文で", "サービスはService、ソフトウェアはSoftwareApplication"],
              ["料金", "プラン名、料金の単位、含まれるもの、初期費用、最低契約期間、税込か税抜か", "llms.txtに料金ページを載せる。価格をOfferに入れるのは決まった価格がある場合だけ"],
              ["導入事例", "業種・規模・導入前の課題・使った機能・結果（測った条件つき）", "llms.txtに導入事例ページを載せる"],
              ["よくある質問", "無料トライアル、契約・解約、データの扱い、連携、サポート体制", "ページに見えるFAQにだけFAQPageを付ける"],
              ["選び方・比較", "自社に向く会社・向かない会社、選ぶときの基準、他の選択肢との違い", "構造化データではなく本文で"],
            ],
            caption: "Googleの推奨プロパティは、2026年11月2日に確認した組織の構造化データのドキュメントによります。",
          },
          after: [
            `日本の法人には国税庁長官が13桁の法人番号を指定し、商号・本店所在地・法人番号が公表されていて、誰でも自由に利用できます。[国税庁：法人番号とは](${SRC.houjinBangou})。会社概要に法人番号を書いておくと、同じ名前の別会社と区別しやすくなります。`,
          ],
        },
        {
          heading: "SoftwareApplicationを付ける前に知っておくこと",
          paragraphs: [
            `SaaSならSoftwareApplicationを付けたくなりますが、Googleのソフトウェアアプリのリッチリザルトには、name、offers.price（無料なら0）に加えて、aggregateRating（評価の集計）かreview（レビュー）のどちらかが必須です。推奨はapplicationCategory（BusinessApplicationなど）とoperatingSystemです。[Google：ソフトウェアアプリの構造化データ](${SRC.softwareApp})。評価やレビューがない状態でSoftwareApplicationを付けても、構造化データとしては読めますが、リッチリザルトの対象にはなりません。`,
            `評価を付けるために、レビューを作ったり、謝礼と引き換えに書いてもらったレビューを開示せずに載せたりしてはいけません。Googleは、実際の体験にもとづかないレビューや、金銭・割引・無料提供などの見返りがあることをはっきり示していないレビューを、ページにも構造化データにも含めないよう定めています。また、自社が管理しているレビューを自社のOrganizationのページに付けても、星の表示の対象にはなりません。[Google：レビュースニペット](${SRC.reviewSnippet})`,
            `FAQについては、Googleの検索結果でFAQのリッチリザルトは表示されなくなり、2026年6月15日にそのドキュメントも削除されました。[Google：検索ドキュメントの更新履歴](${SRC.searchUpdates})。それでも、ページに見えるFAQの文章は、買い手が知りたい契約・解約・データの扱いなどへの答えとして残す価値があります。構造化データを付ける場合も、ページに見えているQ&Aだけにします。`,
          ],
        },
        {
          heading: "料金ページ・比較ページ・導入事例の書き方",
          paragraphs: [
            "料金を公開していないと、AIは料金について何も言えないか、第三者のサイトの古い情報で答えることになります。全部の価格を出せない場合でも、次のことは書けます。",
          ],
          list: [
            "料金の単位：1ユーザーあたり、1拠点あたり、処理件数あたり、固定額など。",
            "プランごとの違い：何が含まれ、何が上位プランだけか。上限（ユーザー数・件数・容量）は機能と分けて書く。",
            "サブスクリプション以外の費用：初期費用、導入支援、オプション、データ移行の費用の有無。",
            "契約の条件：最低契約期間、月払い・年払い、無料トライアルの期間と終了後の扱い、解約方法。",
            "「お問い合わせ」のプラン：どんな規模・条件の会社が対象か、見積もりで何が決まるか。",
            "改定日：料金を変えたら日付を書き、料金ページ・資料・レビューサイトのプロフィールを同じ日に直す。",
          ],
          after: [
            "比較ページは、自社を1位にするランキングではなく、選ぶときの基準（対象の規模、必要な機能、連携先、サポート、料金の単位）を示し、どんな会社には他の選択肢のほうが合うかも書くと、買い手にもAIにも使える内容になります。他社の機能や価格を書くときは、確認した日付と相手の公式ページへのリンクを付け、古くなったら直します。",
            "導入事例は、業種・従業員規模・導入前の課題・使った機能・導入後に変わったことを書きます。数字を出すときは、何を、いつからいつまで、どう測ったかを添えます。社名を出してよいかは、必ず導入企業の許可を取ってください。",
          ],
        },
        {
          heading: "サイトの外の情報をそろえる",
          paragraphs: [
            `BtoBでは、AIが自社サイト以外の情報も参照して答えることがあります。Googleも、AI機能がブログ・動画・フォーラムなどでの言及を表示しうる一方、作られた「言及」を集めるのは思われているほど役に立たないとしています。[Google：生成AI機能向けの最適化ガイド](${SRC.aiGuide})`,
            "やることは、社外にある公式の情報を正しくそろえることです。ITreview・BOXIL・G2・Capterraなどのレビュー・比較サイトのプロフィール、LinkedInの会社ページ、プレスリリース、連携先のアプリ一覧などで、社名・URL・サービスの説明・カテゴリ・料金が自社サイトと食い違っていないかを確かめます。レビューを依頼するときは、各サイトの規約に従い、見返りがある場合はそれを開示します。",
          ],
        },
        {
          heading: "AIのクローラが読めるか確かめる",
          paragraphs: [
            `OpenAIは、robots.txtでOAI-SearchBotを拒否したサイトはChatGPTの検索回答に表示されないとしています。学習用のGPTBotは別のクローラで、拒否しても検索とは関係ありません。[OpenAI：クローラの概要](${SRC.openai})。PerplexityもPerplexityBotを、Perplexityの検索結果にサイトを表示しリンクするためのクローラとし、robots.txtで許可するよう案内しています。[Perplexity：クローラ](${SRC.perplexity})`,
            "SaaSのサイトでよくあるのは、料金表や機能一覧をJavaScriptだけで描画している、ヘルプセンターや資料がログインやフォーム入力の後ろにある、という状態です。AIに読ませたい事実は、ログインなしで開けるページに、HTMLの文字として置いておきます。",
          ],
        },
        {
          heading: "WordPressでの設定手順（Nurevo AEO）",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使え、Nurevo AEOは足りない事実をそれらの構造化データの中に足します。SEO SIMPLE PACK・VK All in One Expansion Unitとも、構造化データを重複させずに併用できます（0.9.1から）。`,
            "セットアップウィザードか設定の「サイトの種類」で「BtoB・SaaS・専門サービス」を選びます。会社はOrganizationとして出力され（ProfessionalServiceなど、組織の種類を選んでいればそれを使います）、営業時間・地図の座標・価格帯など店舗向けの項目は出力されません。住所や営業時間の入力も不要です。",
            "会社名・説明・問い合わせ先を確認します。プラグインは既存のSEOプラグインの設定などから空欄だけを埋め、入力済みの値は上書きしません。",
            "提供しているサービスを入力します。説明（1文）・サービスページのURL・カテゴリを入れ、ソフトウェアなら「ソフトウェア（SaaS・アプリ）」にチェックします。チェックしたものはSoftwareApplication（カテゴリはapplicationCategory）、それ以外はServiceとして、会社にひも付けて出力されます。決まった価格を入れたときだけOfferが付きます。",
            "料金ページと導入事例ページのURLを入れます。どちらもllms.txtに載ります。llms.txtはGoogle検索では使われませんが、他のAIサービスやツールが読む場合に備えたものです。",
            "よくある質問を入力し、見せたいページにNurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。FAQPageの構造化データは、そのページにだけ出力されます。",
            "AEOスコアの画面で診断を実行します。BtoBのサイトでは、提供内容の説明・料金ページ・導入事例またはFAQ・会社を識別できる情報がそろっているかを確認し、不足をチェックリストに出します。",
          ],
          after: [
            "Nurevo AEOは評価（aggregateRating）やレビューを作らないため、出力するSoftwareApplicationは、Googleのソフトウェアアプリのリッチリザルトの対象にはなりません。AIや検索エンジンに、何を提供しているかを正しく伝えるための出力です。WordPress以外のサイトでも、上の表の事実を本文と構造化データで公開する考え方は同じです。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "トップページか会社概要に、正式な社名・所在地・問い合わせ先・提供しているサービスが文字で書かれている。",
            "サービスごとのページに、何の業務に使うものか、対象の業種・規模が最初の数文で書かれている。",
            "料金ページに、料金の単位・含まれるもの・初期費用・契約条件・改定日がある（価格を出さない場合も条件は書く）。",
            "導入事例に、業種・規模・課題・結果と、数字を測った条件がある。社名の掲載許可を取っている。",
            "評価・レビューの構造化データは、実在のレビューだけから作られ、見返りのあるレビューは開示している。",
            "robots.txtでOAI-SearchBotやPerplexityBotを止めていない。料金・機能・FAQがログインなしでHTMLとして読める。",
            "レビュー・比較サイト、LinkedIn、プレスリリースの社名・URL・説明・料金が、自社サイトと一致している。",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、上の表の質問の型で、自社名を入れない質問を10問ほど決め、ChatGPT・Perplexity・GoogleのAIに投げて、社名やURLが出るか、説明が正しいかを記録します。AIの回答は回ごとに変わるので、同じ質問を何度か、期間をあけて確かめます。手順は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。",
            `Google検索については、Search Consoleの生成AIパフォーマンスレポートで、AIによる概要とAIモードにサイトへのリンクが表示された回数を確認できます。クリック数は出ず、表示が少ないサイトではレポートが表示されないことがあります。[Search Consoleヘルプ：生成AIパフォーマンスレポート](${SRC.gscGenAiJa})`,
            "Nurevo AEOのサービスにサイトを接続すると、Free・Standardプランでも月に1回、業種から作った3つの質問（社名は含めません）をPerplexityに投げ、回答に社名やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、BtoB向けの10問について、AIの回答に自社が出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "BtoB・SaaSのAI検索対策は、何から始めればいいですか？", a: "会社概要・サービスページ・料金ページ・導入事例・FAQの5つに、買い手が比較・検討で知りたい事実（対象、機能、料金の単位、契約条件、実績）を文字で書くことからです。そのうえで、OrganizationとService・SoftwareApplicationの構造化データを付け、レビューサイトなど社外の情報とそろえます。" },
        { q: "料金を公開していないと、AIに不利ですか？", a: "AIが料金について答えられる材料がなくなるため、料金を聞かれたときに名前が出にくくなったり、第三者の古い情報で答えられたりすることがあります。価格を出せない場合も、料金の単位・初期費用の有無・契約条件・対象の規模は書いておけます。" },
        { q: "SaaSにSoftwareApplicationの構造化データを付ければ、リッチリザルトが出ますか？", a: "Googleのソフトウェアアプリのリッチリザルトには、名前と価格に加えて、評価の集計かレビューが必須です。実在するレビューがない場合は対象になりません。レビューを作ったり、見返りを開示せずに載せたりしてはいけません。" },
        { q: "llms.txtは作ったほうがいいですか？", a: "Googleは、Google検索はllms.txtを使わず、検索での表示に良くも悪くも影響しないとしています。他のAIサービスやツールが読む場合に備えて置くのは問題ありません。まず本文と構造化データを整えるのが先です。[llms.txtとは](/guide/llms-txt)" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。BtoB・SaaSのサイトの種類、Organization・Service・SoftwareApplication・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すれば、AIのおすすめに必ず入りますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが自社とサービスの事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが自社サイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPT・GPTBot・OAI-SearchBotはOpenAI、Perplexity・PerplexityBotはPerplexity AI、Google・Search ConsoleはGoogle LLCの商標です。ITreview、BOXIL、G2、Capterra、LinkedIn、Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },

    en: {
      title: "AI Search for B2B and SaaS: Services, Pricing, Proof | Nurevo",
      description: "AEO for B2B and SaaS starts with publishing what you offer, to whom and at what price, with case studies and company facts, in page text and structured data.",
      h1: "AI search for B2B and SaaS companies: how to get AI to read your services, pricing, case studies and company facts correctly",
      lead: "AI search optimization (AEO, sometimes called GEO or LLMO) for a B2B or SaaS company comes down to publishing what you offer, to which companies, at what price and on what terms, where it has actually been used, and who you are, accurately in your page text and in Organization, Service and SoftwareApplication structured data, and keeping review sites and other outside profiles in agreement. That gives ChatGPT, Perplexity and Google's AI what they need to answer \"what's the best tool for X?\" or \"how much does X usually cost?\" without guessing. You do not need special AI tags, and you should not mass-produce a page for every question.",
      intro: [
        "Written November 2, 2026 (JST). Information from Google, OpenAI, Perplexity and Japan's National Tax Agency was checked on each official page on that date.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your company's and services' facts readable to AI. They do not guarantee that an AI will mention or recommend you.",
      ],
      sections: [
        {
          heading: "What B2B buyers ask AI",
          paragraphs: [
            "Questions about business services and software differ from questions about a shop or a restaurant: they are mostly about comparing options under conditions. The B2B questions Nurevo AEO uses for its AI visibility measurement follow the patterns below, and none of them contains the company's name.",
          ],
          table: {
            head: ["Question type", "Example", "Facts the AI needs to answer"],
            rows: [
              ["Find a tool for a task", "\"I want to speed up expense reports. Which tool should I use?\"", "Which job it does, and for what size of company"],
              ["Compare a category", "\"Compare the main time-tracking systems.\"", "Features, scope, how it differs from others"],
              ["Price", "\"What does X usually cost, and which do you recommend?\"", "Pricing unit (per user, per transaction), setup fees, minimum term"],
              ["Proof", "\"Which X has the most customer case studies?\"", "Case studies that show industry and company size"],
              ["Switching", "\"What's a good alternative to switch to from X?\"", "Migration path, data import, integrations"],
              ["Checking a company", "\"What does (company) offer? How much is it?\"", "Company overview, services, pricing page, contact"],
            ],
            caption: "Question types summarized from Nurevo AEO's measurement questions for B2B and SaaS sites.",
          },
          after: [
            `Google says there are no additional requirements and no special schema.org markup needed to appear in AI Overviews or AI Mode, and that structured data should match the visible text. [Google: AI features and your website](${SRC.googleAi}). Its 2026 guide to generative AI features adds that Google Search does not use llms.txt or other AI text files, that content does not need to be broken into tiny pieces, and that creating pages for every variation of a query to manipulate rankings or AI responses is scaled content abuse; it recommends unique content based on first-hand experience or expertise. [Google: Optimizing for generative AI features](${SRC.aiGuide})`,
            "So what works for B2B is not \"writing for AI\". It is having the facts buyers look for while comparing and evaluating written clearly on your own site.",
          ],
        },
        {
          heading: "The facts a B2B or SaaS site should publish",
          paragraphs: [
            `Your company is described with Organization structured data. Google lists no required properties for it, recommends properties such as name, url, logo, description, sameAs (links to your official profiles on other sites) and contactPoint, and says it is enough to put it on the home page or one page that describes the organization, such as an about page. [Google: Organization structured data](${SRC.googleOrg})`,
          ],
          table: {
            head: ["Fact", "On the page", "Structured data and llms.txt"],
            rows: [
              ["Who you are", "Legal name, address, founding year, leadership, contact details, and a company registration number where one exists", "Organization (no required properties); sameAs to your LinkedIn and other official pages"],
              ["What you offer", "For each service, one or two sentences on which job it does, for which industries and company sizes", "Service for services, SoftwareApplication for software"],
              ["Pricing", "Plan names, pricing unit, what is included, setup fees, minimum term, whether tax is included", "List the pricing page in llms.txt; put a price in an Offer only when there is a fixed one"],
              ["Case studies", "Industry, size, the problem before, features used, the result (with how it was measured)", "List the case studies page in llms.txt"],
              ["FAQ", "Free trial, contract and cancellation, data handling, integrations, support", "FAQPage only for questions visible on the page"],
              ["How to choose", "Who you fit and who you don't, selection criteria, how you differ from alternatives", "In page text, not structured data"],
            ],
            caption: "Recommended properties as listed in Google's Organization documentation on November 2, 2026.",
          },
          after: [
            `In Japan, for example, every corporation is assigned a 13-digit corporate number by the Commissioner of the National Tax Agency, and its name, head-office address and number are published for anyone to use. [National Tax Agency: corporate number (Japanese)](${SRC.houjinBangou}). Showing a registration number like this on your about page makes it easier to tell you apart from another company with a similar name.`,
          ],
        },
        {
          heading: "Before you add SoftwareApplication markup",
          paragraphs: [
            `SoftwareApplication looks like the obvious markup for SaaS, but Google's software app rich result requires name, offers.price (0 for a free app) and either aggregateRating or review; applicationCategory (such as BusinessApplication) and operatingSystem are recommended. [Google: Software app structured data](${SRC.softwareApp}). Without ratings or reviews, SoftwareApplication is still readable structured data, but it is not eligible for that rich result.`,
            `Do not create reviews to get stars, or publish reviews written in exchange for a reward without saying so. Google's guidelines say not to include, on the page or in markup, reviews that are not based on a genuine experience, or reviews given in exchange for money, discounts or free products without clear and prominent disclosure. Reviews a company controls about itself, placed on its own Organization pages, are not eligible for star ratings either. [Google: Review snippet](${SRC.reviewSnippet})`,
            `As for FAQ, Google no longer shows the FAQ rich result in Search and removed its documentation on June 15, 2026. [Google: Search documentation updates](${SRC.searchUpdates}). A visible FAQ is still worth keeping as plain answers to what buyers ask about contracts, cancellation and data handling. If you mark it up, mark up only the questions shown on the page.`,
          ],
        },
        {
          heading: "Writing pricing, comparison and case study pages",
          paragraphs: [
            "If you don't publish pricing, an AI either cannot say anything about your price or answers from an outdated third-party page. Even if you can't show every number, you can state the following.",
          ],
          list: [
            "The pricing unit: per user, per location, per transaction, or a flat fee.",
            "What changes between plans: what is included and what only higher plans have. State limits (users, volume, storage) separately from features.",
            "Costs outside the subscription: setup, onboarding, add-ons, data migration.",
            "Contract terms: minimum term, monthly or annual billing, free trial length and what happens after it, how to cancel.",
            "\"Contact sales\" plans: which company sizes or conditions they are for, and what the quote depends on.",
            "The date: when pricing changes, date it, and update the pricing page, sales materials and review site profiles on the same day.",
          ],
          after: [
            "A comparison page is more useful to buyers and to AI when it is not a ranking with you on top, but a set of selection criteria (company size, required features, integrations, support, pricing unit) that also says which companies would be better served by another option. When you state another vendor's features or prices, add the date you checked and a link to their official page, and fix it when it goes out of date.",
            "A case study should give the customer's industry, employee count, the problem before, the features used and what changed. When you quote a number, say what was measured, over what period and how. Always get the customer's permission before naming them.",
          ],
        },
        {
          heading: "Making outside profiles agree",
          paragraphs: [
            `In B2B, AI answers may draw on sources beyond your own site. Google notes that its AI features can surface what is said about brands on blogs, videos and forums, while seeking inauthentic \"mentions\" across the web isn't as helpful as it might seem. [Google: Optimizing for generative AI features](${SRC.aiGuide})`,
            "The work here is making your official outside information correct and consistent: profiles on review and comparison sites such as G2, Capterra, ITreview and BOXIL, your LinkedIn company page, press releases and integration marketplaces. Check that your name, URL, service description, category and pricing match your own site. When you ask customers for reviews, follow each site's rules and disclose any incentive.",
          ],
        },
        {
          heading: "Making sure AI crawlers can read your pages",
          paragraphs: [
            `OpenAI says sites that opt out of OAI-SearchBot in robots.txt will not be shown in ChatGPT search answers; GPTBot is a separate crawler for training, and blocking it is a different decision. [OpenAI: overview of crawlers](${SRC.openai}). Perplexity describes PerplexityBot as the crawler that surfaces and links websites in Perplexity search results, and asks site owners to allow it in robots.txt. [Perplexity: crawlers](${SRC.perplexity})`,
            "Two problems are common on SaaS sites: pricing tables or feature lists drawn only by JavaScript, and help centers or documents behind a login or a form. Put the facts you want AI to read on pages that open without a login, as text in the HTML.",
          ],
        },
        {
          heading: "Setting it up on WordPress (Nurevo AEO)",
          list: [
            `Install Nurevo AEO (free) from [WordPress.org](${WP_ORG}) and activate it. Keep Yoast SEO, Rank Math, All in One SEO or Slim SEO if you use one: Nurevo AEO adds the missing facts inside the structured data they already publish. Since 0.9.1 it also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicate structured data.`,
            "In the setup wizard or under Settings, set the site type to \"B2B / SaaS / professional services\". Your company is published as an Organization (or the organization type you chose, such as ProfessionalService), and properties meant for places people visit, such as opening hours, map coordinates and price range, are left out. No address or opening hours are needed.",
            "Check the company name, description and contact details. The plugin fills only blank fields from your SEO plugin and other settings, and never overwrites values you typed.",
            "Enter the services you offer, each with a one-sentence description, its page URL and a category. Tick \"This is software (SaaS or an app)\" for software. Ticked entries are published as SoftwareApplication (the category as applicationCategory) and the rest as Service, linked to your company. An Offer is added only when you enter a fixed price.",
            "Enter the URLs of your pricing page and case studies page. Both are listed in llms.txt. Google Search does not use llms.txt; it is there for other AI services and tools that may read it.",
            "Enter your FAQ and place the Nurevo FAQ block or the [nurevo_faq] shortcode on the page where you want it shown. FAQPage structured data is published on that page only.",
            "Run the diagnosis on the AEO Score screen. For a B2B site it checks for a description of what you offer, a pricing page, case studies or an FAQ, and information that identifies the company, and lists what is missing.",
          ],
          after: [
            "Nurevo AEO never creates ratings or reviews, so the SoftwareApplication it publishes is not eligible for Google's software app rich result. Its purpose is to tell AI and search engines correctly what you offer. On sites not built with WordPress, the same idea applies: publish the facts in the table above in page text and structured data.",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "The home or about page states your legal name, address, contact details and services as text.",
            "Each service page says, in its first few sentences, which job it does and for which industries and company sizes.",
            "The pricing page gives the pricing unit, what is included, setup fees, contract terms and the date it was last changed (terms are stated even if prices are not).",
            "Case studies give industry, size, problem and result, with how any number was measured, and customers have agreed to be named.",
            "Rating and review markup comes only from real reviews, and incentivized reviews are disclosed.",
            "robots.txt does not block OAI-SearchBot or PerplexityBot, and pricing, features and FAQ can be read as HTML without logging in.",
            "Your name, URL, description and pricing match across review and comparison sites, LinkedIn, press releases and your own site.",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, write about ten questions in the patterns above, without your company's name, put them to ChatGPT, Perplexity and Google's AI, and record whether your name or URL appears and whether the description is correct. Answers change between runs, so ask the same questions several times, spread over time. The method is in [how to measure AI visibility](/guide/measure-ai-visibility).",
            `For Google Search, the Generative AI performance report in Search Console shows how often links to your site appeared in AI Overviews and AI Mode. It shows impressions, not clicks, and may not appear for sites with few impressions. [Search Console Help: Generative AI performance report](${SRC.gscGenAiEn})`,
            "When your site is connected to the Nurevo service, the Free and Standard plans include a monthly check: three questions built from your business type (never your company's name) are put to Perplexity, and the plugin records whether the answers named you or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta: how often you appear in AI answers to ten B2B questions, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a B2B or SaaS company start with AI search?", a: "Write the facts buyers compare on (who it is for, features, pricing unit, contract terms, proof) as text on five pages: about, services, pricing, case studies and FAQ. Then add Organization and Service or SoftwareApplication structured data, and make review sites and other outside profiles agree." },
        { q: "Does hiding our pricing hurt us in AI answers?", a: "It leaves AI with nothing to say about your price, so you may be left out of answers to pricing questions, or described from an outdated third-party page. Even without prices, you can state the pricing unit, whether there are setup fees, the contract terms and which company sizes each plan is for." },
        { q: "Will SoftwareApplication markup get my SaaS a rich result?", a: "Google's software app rich result requires a name and price plus either aggregate ratings or reviews. Without real reviews it is not eligible. Never create reviews or publish incentivized ones without disclosure." },
        { q: "Should we create an llms.txt file?", a: "Google says Google Search does not use llms.txt and it neither helps nor harms your visibility there. Having one for other AI services and tools that may read it is fine, but fix your page text and structured data first. [What is llms.txt?](/guide/llms-txt)" },
        { q: "Is Nurevo AEO free?", a: `Yes. The B2B / SaaS site type, Organization, Service, SoftwareApplication and FAQ structured data, llms.txt, AI crawler rules and the AEO score are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee that AI recommends us?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your company's and services' facts easy for AI to read and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your company's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT, GPTBot and OAI-SearchBot are trademarks of OpenAI, Perplexity and PerplexityBot of Perplexity AI, and Google and Search Console of Google LLC. G2, Capterra, ITreview, BOXIL, LinkedIn, Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them.",
    },
  },
};
