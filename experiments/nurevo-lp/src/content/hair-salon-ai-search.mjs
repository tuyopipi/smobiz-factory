// Content page: AI search (AEO) for hair and beauty salons. Industry page.
//
// Written 2026-11-01 (JST). Every claim about Nurevo AEO is one the plugin's
// readme makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt)
// or its code: the "Beauty salon" wizard card sets BeautySalon and keeps
// HairSalon / NailSalon / DaySpa (includes/setup-wizard.php); Settings has a
// free "Business type (schema.org type)" field; each service takes a name,
// duration (minutes), price, currency, category, booking URL and description,
// published as a Service with an Offer, a ReserveAction and an llms.txt line
// (nurevo-webmcp.php, webmcp_canary_service_nodes / _service_llms_line).
// Pro measurement runs on Perplexity (docs/pro-measurement-implementation.md).
//
// Outside facts, checked on the primary pages linked in the copy:
// - Google "AI features and your website" (checked 2026-11-01, page updated
//   2025-12-10): no additional requirements or special schema.org markup for
//   AI Overviews / AI Mode; structured data should match the visible text; keep
//   Business Profile information up to date.
// - Google LocalBusiness structured data (checked 2026-10-29 for the dental
//   page): name + address required; openingHoursSpecification, telephone, url
//   recommended; use the most specific LocalBusiness sub-type.
// - schema.org: HairSalon extends HealthAndBeautyBusiness, which extends
//   LocalBusiness (checked 2026-11-01 on Google's mirror of the schema.org types).
// - Google Search Central blog 2019-09-16: self-serving reviews aren't allowed
//   for LocalBusiness and Organization; review snippets are not displayed for them.
// - Consumer Affairs Agency (Japan): stealth marketing is a violation of the
//   Act against Unjustifiable Premiums and Misleading Representations from
//   2023-10-01; posts a business asks third parties to make count as its ads.
// - National Tax Agency (Japan), tax answer 6902: prices shown to consumers in
//   advance must include consumption tax, on any medium (e.g. "11,000円（税込）").
// Re-check these when you update the page, and update the date with them.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  hairSalon: "https://schema.org/HairSalon",
  reviews2019: "https://developers.google.com/search/blog/2019/09/making-review-rich-results-more-helpful",
  caaStealth: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/stealth_marketing/",
  ntaTotal: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6902.htm",
};

export default {
  slug: "hair-salon-ai-search",
  targetQueries: [
    "AI search optimization for hair salons",
    "beauty salon ChatGPT visibility",
    "hair salon schema markup",
    "美容室 AI検索対策",
    "美容院 ChatGPT 表示 対策",
    "サロン 構造化データ HairSalon",
  ],
  related: ["local-business-schema-seo-plugins", "what-is-aeo", "llms-txt", "appear-in-chatgpt", "aeo-wordpress"],
  locales: {
    ja: {
      title: "美容室・サロンのAI検索対策：メニューと予約をAIに伝える | Nurevo",
      description: "美容室・サロンのAI検索対策は、メニュー・料金・所要時間・定休日・予約方法をページ本文とHairSalonなどの構造化データで正確に公開することから。口コミの扱い、手順、チェック表を解説します。",
      h1: "美容室・サロンのAI検索対策：メニュー・料金・予約をAIに正しく読ませる手順",
      lead: "美容室・サロンのAI検索対策（AEO）の中心は、メニュー・税込料金・所要時間・営業時間・定休日・住所・予約方法を、ページ本文と構造化データ（schema.orgのHairSalonやBeautySalon）で正確に、矛盾なく公開することです。「駅の近くで日曜の夜も空いている美容室」「縮毛矯正をしてくれるサロン」のような質問に、AIが推測せずに答えられる材料をそろえます。口コミをサイトに自分で載せても、AIや検索での評価が上がる近道にはなりません。",
      intro: [
        "作成日：2026年11月1日（JST）。Google・schema.org・消費者庁・国税庁の情報は、本文に記した日に各公式ページで確認したものです。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIがサロンの事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "お客さんはAIに何を聞き、AIは何を読んでいるか",
          paragraphs: [
            "ChatGPT、Perplexity、GoogleのAI Overviewsなどにサロンを探す質問をすると、AIはウェブ上の情報を読んで答えをまとめます。美容室やサロンについて聞かれるのは、「◯◯駅の近くで縮毛矯正が得意な美容室」「日曜の19時以降に予約できるヘアサロン」「キッズカットができる美容院」「ネイルとまつげを同じ日に頼めるサロン」のように、場所・曜日・時間・メニュー・料金がからむ質問です。",
            "答えるには、サロンがどこにあり、何曜日の何時まで開いていて、どんなメニューをいくらで、どのくらいの時間で受けられ、どこから予約できるかを、AIが文字として読み取れる必要があります。メニュー表が画像だけ、料金が「〜」ばかりで基準がない、定休日がページごとに違う、予約ページへのリンクがない、といった状態では答えに使いにくくなります。",
            `Googleは、AI OverviewsやAI Modeに出るための追加の要件や特別なschema.orgの構造化データはなく、構造化データをページの見える文章と一致させる、ビジネスプロフィールの情報を最新にする、といった通常の基本が大切だとしています（2026年11月1日確認）。[Google：AI features and your website](${SRC.googleAi})。AI向けの裏技ではなく、サロンの事実をそろえて正しく出すことが対策の本体です。`,
          ],
        },
        {
          heading: "サロンがサイトで公開しておきたい情報",
          paragraphs: [
            `構造化データでは、美容室を[schema.orgのHairSalon](${SRC.hairSalon})として表します。HairSalonはHealthAndBeautyBusiness（LocalBusinessの一種）の下にあり、同じ仲間にBeautySalon（エステなど）、NailSalon、DaySpaがあります。Googleのローカルビジネスの構造化データでは、nameとaddressが必須、openingHoursSpecification・telephone・urlなどが推奨で、できるだけ具体的な種類を使うよう案内されています（2026年10月29日確認）。[Google：ローカルビジネスの構造化データ](${SRC.googleLocal})`,
          ],
          table: {
            head: ["情報", "ページ本文での書き方", "構造化データ"],
            rows: [
              ["サロン名", "正式名称を表記ゆれなく。看板・Googleビジネスプロフィール・予約サイトと同じに", "name（必須）"],
              ["住所・アクセス", "番地・建物名・階まで。最寄り駅からの道順と徒歩分数も文字で", "address（必須）、geo（推奨）"],
              ["営業時間・定休日", "画像にせず文字で。最終受付の時刻、カラーやパーマの最終受付が違う場合はそれも", "openingHoursSpecification（推奨）"],
              ["メニュー・料金・所要時間", "カット・カラー・パーマ・縮毛矯正などを、税込の料金と目安の所要時間つきで", "メニューごとにService、料金はOffer"],
              ["予約方法", "電話番号を文字で。ウェブ予約のページへのリンク", "telephone（推奨）、予約URL"],
              ["よくある質問", "駐車場、子ども連れ、当日予約、キャンセルの扱いなど、実際によく聞かれること", "FAQPage（ページに見えているFAQにだけ付ける）"],
            ],
            caption: "必須・推奨の区分は、2026年10月29日に確認したGoogleのローカルビジネスのドキュメントによります。メニューのServiceとOfferはschema.orgの型で、Googleの必須・推奨項目ではありません。",
          },
          after: [
            `料金は税込で書きます。国税庁は、消費者に対してあらかじめ価格を表示する場合は、表示する媒体を問わず消費税込みの総額を表示するよう定めています（例：「11,000円（税込）」）。[国税庁：総額表示の義務](${SRC.ntaTotal})。「カット ◯円〜」のように幅がある場合は、何によって変わるか（長さ、指名など）を一言書くと、AIも人も誤解しにくくなります。`,
            "大切なのは、サイト本文・構造化データ・Googleビジネスプロフィール・予約サイト・llms.txtで、同じ事実が同じ値になっていることです。料金改定や臨時休業のときは、すべてを一緒に更新します。",
          ],
        },
        {
          heading: "口コミ・レビューの扱い：AI向けに足してはいけないもの",
          paragraphs: [
            `サロンのサイトに、お客さんの口コミや星の評価を構造化データとして自分で載せても、Googleでは評価の星（レビュー スニペット）として表示されません。Googleは2019年に、ある事業者についての口コミをその事業者自身のサイトに載せるもの（自己言及的なレビュー）は、LocalBusinessとOrganizationでは認めないとしています。[Google検索セントラル ブログ（2019年9月16日）](${SRC.reviews2019})`,
            `日本では、2023年10月1日からステルスマーケティングが景品表示法違反になりました。消費者庁は、事業者がインフルエンサーなどの第三者に依頼・指示して投稿させた口コミやレビューも、その事業者の広告に含まれるとしています。[消費者庁：ステルスマーケティング](${SRC.caaStealth})。AIに良く書いてもらうために、広告であることを隠した口コミを増やすのは避けてください。`,
            "AIに伝えるべきなのは評判の言葉ではなく、メニュー・料金・時間・場所といった確かめられる事実です。「地域No.1」のような根拠を示せない表現も、本文にも構造化データにも入れないのが安全です。",
          ],
        },
        {
          heading: "WordPressのサロンサイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。`,
            "初回の設定ウィザードで「美容サロン」を選びます。業種はBeautySalonになります。美容室なら、設定画面の「業種（schema.org型）」をHairSalonに、ネイルサロンならNailSalonにします。サロン名・住所・電話番号・営業時間・説明を確認します。空欄の項目だけがSEOプラグインなどの既存の設定から補われ、入力済みの値は上書きされません。",
            "設定画面でメニューをサービスとして1つずつ登録します。サービス名・所要時間（分）・料金・通貨（JPY）・カテゴリ・予約URL・説明を入れると、サロンに紐づいたServiceとして構造化データ（料金はOffer、予約URLは予約のアクション）に出力され、llms.txtにもメニューの1行として載ります。料金欄には「円」や「,」を付けず、数字だけを入れます。",
            "よくある質問を入力し、FAQを見せたいページにNurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。そのページのFAQPageに追加されます。",
            "AEOスコアの画面で診断を実行し、チェックリストに出た不足をワンクリック修正で直します。構造化データ・llms.txt・AIクローラの許可（OAI-SearchBot、PerplexityBot、Claude-SearchBotなど）は無料プランで出力されます。",
            "外からどう見えるかを[無料のAI可読性チェック](/check)で確認し、Googleビジネスプロフィールと予約サイトの営業時間・料金と一致しているかも見直します。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の構造化データを出さず、SEOプラグインが出しているグラフに足りない住所・電話番号・営業時間・HairSalonなどの種類・サービスだけを追加します。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/ja/guide/local-business-schema-seo-plugins/)をご覧ください。WordPress以外のサイトでも、上の表の情報を本文と構造化データで公開する考え方は同じです。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "メニュー表が画像だけでなく、文字で書かれている。",
            "料金が税込で書かれ、幅がある場合は何で変わるかが書かれている。",
            "営業時間・定休日・最終受付が、サイト・Googleビジネスプロフィール・予約サイトで一致している。",
            "構造化データの種類がOrganizationのままではなく、HairSalon・BeautySalon・NailSalonなど実態に合ったものになっている。",
            "構造化データの料金や営業時間が、ページに見えている値と同じ。",
            "自分のサイトに載せた口コミを、評価の構造化データにしていない。広告であることを隠した口コミを使っていない。",
            "llms.txtに、サロンの概要・メニューと料金・アクセス・予約のページが載っている。[llms.txtとは](/ja/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、お客さんが聞きそうな質問（地域＋メニュー＋曜日や時間）をAIに投げて、サロンが名前やURLで出てくるかを見ます。AIの回答は回ごとに変わるので、同じ質問を何度か、期間をあけて確かめるのが現実的です。予約サイトのページが出典に使われることもあるので、そこに載っている情報も最新にしておきます。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（サロン名は含めません）をPerplexityに投げ、回答にサロンの名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答にサロンが出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "美容室のAI検索対策は、何から始めればいいですか？", a: "メニュー・税込料金・所要時間・営業時間・定休日・住所・予約方法を、ページ本文に文字で正しく書くことからです。そのうえで、同じ事実をHairSalonの構造化データとllms.txtで公開し、Googleビジネスプロフィールや予約サイトと値をそろえます。" },
        { q: "HairSalonとBeautySalonはどう使い分けますか？", a: "schema.orgでは、どちらもHealthAndBeautyBusinessの一種です。ヘアカットやカラーが中心の美容室ならHairSalon、エステなどの美容サロンならBeautySalon、ネイル専門ならNailSalonのように、実態にいちばん近い種類を選びます。Googleはできるだけ具体的な種類を使うよう案内しています。" },
        { q: "予約サイトに載っていれば、自分のサイトは整えなくてもいいですか？", a: "予約サイトのページがAIの出典になることもありますが、サロン自身のサイトは、メニューの説明・アクセス・よくある質問など、お店の情報をいちばん詳しく正しく出せる場所です。両方の値をそろえておくのが確実です。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種（HairSalonなど）・住所・営業時間・メニュー（サービス）・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTにサロンが必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIがサロンの事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがサロンのサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEOはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的・税務上の助言ではありません。",
    },

    en: {
      title: "AI Search for Hair & Beauty Salons: Menus, Prices, Booking | Nurevo",
      description: "AEO for salons starts with publishing your menu, prices, durations, hours and booking link correctly, in page text and HairSalon structured data. Steps and checklist.",
      h1: "AI search for hair and beauty salons: how to get AI to read your menu, prices and booking correctly",
      lead: "AI search optimization (AEO) for a hair or beauty salon comes down to publishing the facts clients ask about (your menu, prices, how long each service takes, opening hours, days closed, address and how to book) accurately and consistently, both in your page text and in schema.org HairSalon or BeautySalon structured data. That gives ChatGPT, Perplexity and Google's AI what they need to answer \"a salon near the station open on Sunday evening\" or \"who does keratin straightening near me\" without guessing. Posting your own reviews on your site is not a shortcut to better AI or search results.",
      intro: [
        "Written November 1, 2026 (JST). Information from Google, schema.org and Japanese government agencies was checked on each official page on the dates given in the text.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your salon's facts readable to AI. They do not guarantee that an AI will mention your salon or rank it anywhere.",
      ],
      sections: [
        {
          heading: "What clients ask AI, and what AI reads",
          paragraphs: [
            "When someone asks ChatGPT, Perplexity or Google's AI Overviews to find a salon, the AI reads what it can find on the web and builds an answer. Salon questions mix place, day, time, service and price: \"a hair salon near the station that is good at straightening\", \"a salon I can book on Sunday after 7pm\", \"a hairdresser that does kids' cuts\", \"a place that does nails and lashes on the same day\".",
            "To answer them, an AI has to be able to read, as text, where your salon is, which days and until what time it is open, which services you offer at what price and for how long, and where to book. If your menu exists only as an image, every price is \"from\" with no basis, your days closed differ between pages, or there is no link to booking, your salon is harder to use in an answer.",
            `Google says there are no additional requirements and no special schema.org structured data needed to appear in AI Overviews or AI Mode, and that the usual basics still matter, such as making structured data match the visible text and keeping your Business Profile up to date (checked November 1, 2026). [Google: AI features and your website](${SRC.googleAi}). The work is not an AI trick: it is publishing your salon's facts correctly and consistently.`,
          ],
        },
        {
          heading: "The facts a salon should publish",
          paragraphs: [
            `In structured data, a hair salon is described as a [schema.org HairSalon](${SRC.hairSalon}). HairSalon sits under HealthAndBeautyBusiness, a kind of LocalBusiness, alongside BeautySalon, NailSalon and DaySpa. Google's local business documentation lists name and address as required, recommends openingHoursSpecification, telephone, url and others, and asks you to use the most specific LocalBusiness sub-type possible (checked October 29, 2026). [Google: Local business structured data](${SRC.googleLocal})`,
          ],
          table: {
            head: ["Fact", "On the page", "In structured data"],
            rows: [
              ["Salon name", "Your official name, spelled the same way everywhere: sign, Business Profile and booking sites", "name (required)"],
              ["Address and directions", "The full address including floor, plus walking directions from the nearest station or parking, as text", "address (required), geo (recommended)"],
              ["Opening hours and days closed", "As text, not an image, including last booking times, and different last times for color or perms if they apply", "openingHoursSpecification (recommended)"],
              ["Menu, prices and durations", "Cut, color, perm, straightening and so on, each with its price and typical duration", "A Service per menu item, with an Offer for the price"],
              ["How to book", "The phone number as text and a link to your online booking page", "telephone (recommended), booking URL"],
              ["Frequently asked questions", "What clients really ask: parking, bringing children, same-day booking, cancellations", "FAQPage, only on the page where the FAQ is visible"],
            ],
            caption: "Required and recommended properties as listed in Google's local business documentation on October 29, 2026. Service and Offer for menu items are schema.org types, not Google required or recommended properties.",
          },
          after: [
            `Show prices the way local rules require. In Japan, for example, the National Tax Agency requires prices shown to consumers in advance to include consumption tax, whatever the medium (for example \"11,000円（税込）\"). [National Tax Agency: total price display (Japanese)](${SRC.ntaTotal}). Where a price is a range (\"from\" a base price), say in a few words what it depends on (hair length, senior stylist), so neither AI nor people misread it.`,
            "What matters most is that the same fact has the same value everywhere: your site, structured data, Google Business Profile, booking sites and llms.txt. When prices or hours change, update all of them together.",
          ],
        },
        {
          heading: "Reviews: what not to add for AI",
          paragraphs: [
            `Marking up client reviews or star ratings on your own salon site will not get you review stars in Google. In 2019 Google said that self-serving reviews, meaning reviews about a business placed on that business's own website, aren't allowed for LocalBusiness and Organization, and that review snippets are not displayed for them. [Google Search Central blog, September 16, 2019](${SRC.reviews2019})`,
            `Rules on undisclosed advertising differ by country, so check the ones that apply to you. In Japan, stealth marketing has been a violation of the Act against Unjustifiable Premiums and Misleading Representations since October 1, 2023, and the Consumer Affairs Agency treats reviews and posts that a business asks or instructs third parties to make as that business's advertising. [Consumer Affairs Agency: stealth marketing (Japanese)](${SRC.caaStealth}). Do not grow undisclosed sponsored reviews in the hope that AI will speak well of you.`,
            "What AI needs from you is not praise but facts it can check: services, prices, times and place. Claims you cannot back up, such as \"No. 1 in the area\", are safest left out of both your text and your markup.",
          ],
        },
        {
          heading: "Setting it up on a WordPress salon site",
          list: [
            `Install Nurevo AEO (free) from [WordPress.org](${WP_ORG}) and activate it. Keep Yoast SEO, Rank Math, All in One SEO or Slim SEO if you use one.`,
            "In the setup wizard, choose \"Beauty salon\". The business type becomes BeautySalon; for a hair salon, change \"Business type (schema.org type)\" in Settings to HairSalon, or to NailSalon for a nail salon. Confirm the name, address, phone, opening hours and description. Only blank fields are filled in from your existing settings; nothing you typed is overwritten.",
            "Under Settings, add each menu item as a service. With a service name, duration (minutes), price, currency, category, booking URL and description, it is published as a Service linked to your salon (the price as an Offer, the booking URL as a reservation action) and listed as a menu line in llms.txt. Enter the price as digits only, without a currency symbol.",
            "Enter your FAQ and place the Nurevo FAQ block or the [nurevo_faq] shortcode on the page where you want it shown. The questions are added to that page's FAQPage.",
            "Run the diagnosis on the AEO Score screen and apply the one-click fixes the checklist offers. Structured data, llms.txt and AI crawler access (OAI-SearchBot, PerplexityBot, Claude-SearchBot and others) are all on the free plan.",
            "See what AI reads from the outside with the [free AI readability check](/check?lang=en), and confirm that hours and prices match your Google Business Profile and booking sites.",
          ],
          after: [
            "With an SEO plugin active, Nurevo AEO does not print a second set of structured data. It adds only the missing address, phone, opening hours, a specific type such as HairSalon, and your services into the graph your SEO plugin already publishes. See [adding local business schema to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins/). On sites not built with WordPress, the same idea applies: publish the facts in the table above in your page text and in structured data.",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Your menu is written as text, not only shown as an image.",
            "Prices are shown as local rules require, and ranges say what they depend on.",
            "Hours, days closed and last booking times match across your site, Google Business Profile and booking sites.",
            "The structured data type fits the business, such as HairSalon, BeautySalon or NailSalon, not a generic Organization.",
            "Prices and hours in the structured data match the values visible on the page.",
            "Reviews on your own site are not marked up as ratings, and no undisclosed sponsored reviews are used.",
            "llms.txt lists your salon overview, menu and prices, directions and booking pages. [What is llms.txt?](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, ask AI the questions your clients would ask (area plus service plus day or time) and see whether your salon comes up by name or URL. Answers change between runs, so ask the same questions a few times, spread over time. Booking-site pages are sometimes used as sources too, so keep the information there current as well.",
            "Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your salon's name) are put to Perplexity, and the plugin records whether the answers named your salon or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta: how often your salon appears in AI answers, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a hair salon start with AI search?", a: "Write your menu, prices, durations, opening hours, days closed, address and how to book correctly as text on your pages. Then publish the same facts as HairSalon structured data and in llms.txt, and make sure they match your Google Business Profile and booking sites." },
        { q: "HairSalon or BeautySalon: which should I use?", a: "In schema.org both are kinds of HealthAndBeautyBusiness. Choose the type closest to what you do: HairSalon for cuts and color, BeautySalon for beauty treatments, NailSalon for a nail studio. Google asks you to use the most specific type possible." },
        { q: "If I am on booking sites, do I still need to fix my own site?", a: "Booking-site pages can be used as sources by AI, but your own site is where you can publish your salon's information in the most detail and most accurately: service descriptions, directions and FAQ. Keeping both in agreement is the safest approach." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type (HairSalon and others), address, hours, services and FAQ structured data, llms.txt, AI crawler rules and the AEO score are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee my salon appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your salon's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO and Slim SEO are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal or tax advice.",
    },
  },
};
