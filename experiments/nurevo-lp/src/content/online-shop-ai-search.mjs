// Content page: AI search (AEO) for online shops (e-commerce). Industry page.
//
// Written 2026-11-02 (JST). Every claim about Nurevo AEO is one the plugin's
// readme makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt)
// or its code: the "Online shop" site type publishes an OnlineStore without
// address or opening hours, suggested when WooCommerce is active
// (includes/site-types.php); the 30 most recently published WooCommerce products
// go on the front page as an OfferCatalog (Product + Offer with price, currency,
// InStock/OutOfStock only when known, a rating only with real reviews), product
// pages keep WooCommerce's own Product markup (nurevo-webmcp.php); a return
// policy page becomes hasMerchantReturnPolicy with merchantReturnLink; the
// shipping page is listed in llms.txt only (docs/industries.md §3). The monthly
// free check and Pro measurement ask category questions without the shop's name
// (worker/free-ai-check.mjs, worker/sov-site-type.mjs); Pro runs on Perplexity.
//
// Outside facts, checked on the primary pages linked in the copy on 2026-11-02:
// - Google "AI features and your website" (updated 2025-12-10): no additional
//   requirements / no special schema.org markup for AI Overviews and AI Mode;
//   structured data should match visible text; keep Merchant Center and
//   Business Profile information up to date.
// - Google Organization (updated 2026-09-08): no required properties; use the
//   most specific subtype; OnlineStore rather than OnlineBusiness for e-commerce.
// - Google merchant listing: Product needs name, image, offers (an Offer);
//   Offer needs price (> 0) and priceCurrency; availability recommended; only
//   pages where a shopper can buy are eligible; mark up product pages rather
//   than listing pages; return/shipping recommended at Organization level.
// - Google return policy (updated 2026-09-08): Organization hasMerchantReturnPolicy;
//   merchantReturnLink alone is one of the two required options; precedence:
//   Content API > Merchant Center / Search Console > product markup > org markup.
// - Google shipping policy (updated 2026-09-08): Organization hasShippingService
//   -> ShippingService, shippingConditions required; same precedence.
// - OpenAI Help "Shopping with ChatGPT Search" (checked 2026-11-02): product
//   results selected independently, not ads; structured metadata from first-
//   and third-party providers; merchants ranked on availability, price, quality,
//   maker / primary seller; Shopify Catalog; direct product feeds by application.
// - Consumer Affairs Agency (Japan), Specified Commercial Transactions Act guide:
//   mail-order ads must show the price incl. tax, shipping, other costs, payment
//   and delivery timing, cancellation / return terms, business name, address,
//   phone, etc.; without displayed return terms the buyer can cancel within 8
//   days of receipt, return cost borne by the buyer.
// - Consumer Affairs Agency: stealth marketing is illegal from 2023-10-01;
//   posts a business asks or instructs third parties to make count as its ads,
//   including review posts.
// Re-check these when you update the page, and update the date with them.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleOrg: "https://developers.google.com/search/docs/appearance/structured-data/organization",
  merchantListing: "https://developers.google.com/search/docs/appearance/structured-data/merchant-listing",
  returnPolicy: "https://developers.google.com/search/docs/appearance/structured-data/return-policy",
  shippingPolicy: "https://developers.google.com/search/docs/appearance/structured-data/shipping-policy",
  chatgptShopping: "https://help.openai.com/en/articles/11128490",
  caaAds: "https://www.no-trouble.caa.go.jp/what/mailorder/advertising.html",
  caaReturn: "https://www.no-trouble.caa.go.jp/case/mailorder/case01.html",
  caaStealth: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/stealth_marketing",
};

export default {
  slug: "online-shop-ai-search",
  targetQueries: [
    "AI search optimization for online stores",
    "ecommerce AEO",
    "how to get products into ChatGPT shopping",
    "ネットショップ AI検索対策",
    "ECサイト AEO 構造化データ",
    "通販サイト ChatGPT 表示 対策",
  ],
  related: ["aeo-wordpress", "llms-txt", "what-is-aeo", "appear-in-chatgpt", "aeo-tools-comparison"],
  locales: {
    ja: {
      title: "ネットショップのAI検索対策：商品・在庫・返品をAIに伝える | Nurevo",
      description: "ECサイトのAI検索対策は、商品名・税込価格・在庫・送料・返品条件を、商品ページの本文と構造化データで正確に公開することから。必要な項目、手順、チェック表を解説します。",
      h1: "ネットショップ（EC）のAI検索対策：商品・価格・在庫・返品条件をAIに正しく読ませる手順",
      lead: "ネットショップのAI検索対策（AEO）の中心は、商品名・価格・在庫・送料・返品条件・運営者の情報を、商品ページの本文と構造化データ（schema.orgのProduct・Offer・OnlineStore）で正確に、矛盾なく公開することです。「◯◯のおすすめ通販サイトは？」「送料無料で返品できる◯◯の店は？」と聞かれたとき、AIが推測せずに答えられる材料をそろえます。AI専用の特別なタグを足すことではありません。",
      intro: [
        "作成日：2026年11月2日（JST）。Google・OpenAI・消費者庁の情報は、同日に各公式ページで確認したものです。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIがショップと商品の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "AIは通販について何を聞かれ、何を読んでいるか",
          paragraphs: [
            "通販についてAIに聞かれるのは、「敏感肌向けの日焼け止めを買える通販サイト」「国産の木製まな板を売っている店」「◯◯は在庫がある？送料はいくら？」「返品できる靴の通販は？」のように、商品・価格・在庫・送料・返品条件がからむ質問です。答えるには、どの商品をいくらで売っていて、今買えるのか、送料と返品の条件は何か、誰が売っているのかを、AIが文字として読み取れる必要があります。",
            `Googleは、AI OverviewsやAI Modeに出るための追加の要件や特別なschema.orgの構造化データはなく、構造化データをページの見える文章と一致させる、Merchant Centerやビジネスプロフィールの情報を最新にする、といった通常の基本が大切だとしています。[Google：AI features and your website](${SRC.googleAi})`,
            `ChatGPTについてOpenAIは、検索での商品の結果はChatGPTが独自に選ぶもので広告ではないとし、選ぶときに価格や商品説明などの構造化されたメタデータ（自社や第三者が提供するもの）を参考にすること、販売店は在庫・価格・品質・メーカーや主な販売元かどうかなどで並べることを説明しています。Shopifyの店舗はShopify Catalogを通じて商品データがすでに連携されており、それ以外の店舗は商品フィードの直接提供に申し込めるとしています（2026年11月2日確認）。[OpenAI：Shopping with ChatGPT Search](${SRC.chatgptShopping})`,
          ],
        },
        {
          heading: "ネットショップが公開しておきたい情報",
          paragraphs: [
            `Googleは、組織の構造化データに必須のプロパティはなく、できるだけ具体的な種類を使うよう案内し、ECサイトにはOnlineBusinessではなくOnlineStoreを勧めています。[Google：組織の構造化データ](${SRC.googleOrg})。商品については、Googleのショッピング向け（販売者のリスティング）の構造化データで、Productにname・image・offers、Offerにprice（0より大きい値）とpriceCurrencyが必須で、availability（在庫）は推奨です。[Google：販売者のリスティングの構造化データ](${SRC.merchantListing})`,
          ],
          table: {
            head: ["情報", "ページ本文での書き方", "構造化データ"],
            rows: [
              ["ショップ（運営者）", "ショップ名、運営会社、問い合わせ先。特定商取引法に基づく表記のページ", "OnlineStore（Organizationの一種）。必須項目はなし"],
              ["商品名・画像", "商品ページごとに、型番やサイズ・色の違いもわかる名前で", "Productのname・image（必須）"],
              ["価格", "税込の販売価格を文字で。セール価格はいつまでかも", "Offerのprice・priceCurrency（必須）"],
              ["在庫", "在庫あり・在庫切れ・予約受付などを、実際の状態に合わせて", "Offerのavailability（推奨）"],
              ["返品条件", "返品できる期間・条件・送料の負担を1つのページにまとめる", "OrganizationのhasMerchantReturnPolicy。返品ページのURL（merchantReturnLink）だけでも可"],
              ["送料・配送", "送料（地域・金額ごと）とお届けまでの日数", "OrganizationのhasShippingService（shippingConditionsが必須）"],
            ],
            caption: "必須・推奨の区分は、2026年11月2日に確認したGoogleの各ドキュメントによります。",
          },
          after: [
            `ショッピング向けの構造化データの対象は、その場で商品を買えるページです。Googleは、商品の一覧ページよりも商品ページに付けることを勧めています。返品と送料は、商品ごとではなく、店舗全体の方針としてOrganizationに書くことが推奨されています。[Google：返品ポリシー](${SRC.returnPolicy})／[Google：配送ポリシー](${SRC.shippingPolicy})`,
            "Googleでは、Merchant CenterやSearch Consoleで設定した返品・送料が、サイトの構造化データより優先されます。どこか1か所だけ直すと値が食い違うので、価格・送料・返品条件を変えたときは、商品ページ・構造化データ・Merchant Center・モールの店舗ページ・llms.txtを一緒に更新します。",
          ],
        },
        {
          heading: "日本の通販で、本文に書いておく事実",
          paragraphs: [
            `日本の通販では、特定商取引法により、広告に販売価格（消費税込み）、送料、それ以外に購入者が負担するお金、支払いの時期と方法、引き渡しの時期、返品（申込みの撤回・解除）に関すること、事業者の名称・住所・電話番号などを表示します。[消費者庁：通信販売広告について](${SRC.caaAds})。これらはAIが「送料はいくら？」「返品できる？」に答えるための材料そのものです。`,
            `返品特約を表示していない場合、購入者は商品を受け取った日から8日間は契約を解除でき、返品の費用は購入者の負担になると消費者庁は説明しています。[消費者庁：通信販売の返品の事例](${SRC.caaReturn})。返品を受けない、条件つきで受けるといった方針は、はっきり文字で書き、構造化データの返品ページと同じ内容にします。`,
            `口コミ・評価は、実際の購入者のものだけを載せます。2023年10月1日からステルスマーケティングは景品表示法違反となり、事業者が第三者に依頼・指示した投稿も広告に含まれ、レビュー投稿も対象です。[消費者庁：ステルスマーケティング](${SRC.caaStealth})`,
          ],
        },
        {
          heading: "WordPress（WooCommerce）のショップでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。`,
            "設定（またはセットアップウィザード）の「サイトの種類」で「オンラインショップ」を選びます。WooCommerceが有効なら提案されますが、保存するまで何も変わりません。ショップはOnlineStoreとして出力され、住所や営業時間の入力は不要です（入力済みの住所・電話番号は出力されます）。",
            "返品・返金ポリシーのページと配送ポリシーのページのURLを入れます。返品ページはショップのMerchantReturnPolicy（返品ページへのリンク）として構造化データに出力され、両方のページがllms.txtに載ります。送料は条件（金額・日数）がわからないため、構造化データにはせず、llms.txtにページを載せるだけです。",
            "商品ページのProductはWooCommerceが出すものをそのまま使い、Nurevo AEOは重複させません。トップページには、最近公開した30件までの商品を、価格・通貨と、わかる場合は在庫つきで一覧（OfferCatalog）として出力します。評価は、実際のレビューがある商品にだけ付きます。商品はllms.txtにも載ります。",
            "よくある質問（送料、届くまでの日数、ギフト包装、返品の手順など）を入力し、FAQを見せたいページにNurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。",
            "AEOスコアの画面で診断を実行します。オンラインショップでは、価格と在庫のある商品・返品ページ・配送ページ・連絡先がそろっているかを確認し、不足をチェックリストに出します。",
            "外からどう見えるかを[無料のAI可読性チェック](/check)で確認し、Merchant Centerやモールの店舗ページの価格・送料・返品条件と一致しているかも見直します。",
          ],
          after: [
            `WordPress以外（Shopifyなど）のショップでも、上の表の事実を商品ページの本文と構造化データで公開し、llms.txtにショップの概要・返品・配送・主な商品のページを載せる考え方は同じです。[llms.txtとは](/ja/guide/llms-txt/)`,
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "商品ページに、商品名・税込価格・在庫の状態が文字で書かれている（画像だけになっていない）。",
            "構造化データの価格・在庫が、ページに見えている値と同じ。在庫切れの商品が「在庫あり」のままになっていない。",
            "送料・お届け日数・返品条件のページがあり、商品ページやフッターからリンクされている。",
            "特定商取引法に基づく表記（事業者名・住所・電話番号・送料・返品など）のページがある。",
            "ショップの構造化データの種類が、OnlineStoreなど実態に合ったものになっている。",
            "評価・口コミの構造化データは、実際の購入者のレビューだけから作られている。",
            "Merchant Center・モール・SNSのショップ情報と、サイトの価格・送料・返品条件が一致している。",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、お客さんが聞きそうな質問（「◯◯のおすすめ通販サイトは？」「◯◯を送料無料で買える店は？」）をAIに投げて、ショップや商品が名前やURLで出てくるかを見ます。AIの回答は回ごとに変わるので、同じ質問を何度か、期間をあけて確かめるのが現実的です。",
            "Nurevo AEOのサービスにサイトを接続すると、Free・Standardプランでも月に1回、商品のカテゴリから作った3つの質問（ショップ名は含めません）をPerplexityに投げ、回答にショップの名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答にショップが出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "ネットショップのAI検索対策は、何から始めればいいですか？", a: "商品ページに商品名・税込価格・在庫を文字で正しく書き、送料・返品条件・運営者の情報をそれぞれのページにまとめることからです。そのうえで、同じ事実をProduct・Offer・OnlineStoreの構造化データとllms.txtで公開し、Merchant Centerやモールの情報と値をそろえます。" },
        { q: "ChatGPTに商品を載せるには、お金を払う必要がありますか？", a: "OpenAIは、ChatGPT検索の商品の結果は独自に選ぶもので広告ではないと説明しています。Shopifyの店舗はShopify Catalogで連携済みで、それ以外の店舗は商品フィードの直接提供に申し込めます。いずれの場合も、表示されるかどうかは保証されません。" },
        { q: "モール（楽天市場・Amazonなど）に出店していれば、自社サイトは整えなくてもいいですか？", a: "モールのページがAIの出典になることもありますが、自社サイトは、商品の説明・返品条件・よくある質問などをいちばん詳しく正しく出せる場所です。両方の価格・送料・返品条件をそろえておくのが確実です。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。オンラインショップの種類（OnlineStore）、商品一覧、返品ポリシー、FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すれば商品がAIの回答に必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが商品とショップの事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIがショップのサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、Google・Google Merchant CenterはGoogle LLCの商標です。WooCommerce、Shopify、Yoast SEO、Rank Math、All in One SEO、Slim SEO、楽天市場、Amazonはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },

    en: {
      title: "AI Search for Online Shops: Products, Stock, Returns | Nurevo",
      description: "AEO for online shops starts with publishing product names, prices, stock, shipping and return terms correctly, in product page text and structured data. With a checklist.",
      h1: "AI search for online shops: how to get AI to read your products, prices, stock and return terms correctly",
      lead: "AI search optimization (AEO) for an online shop comes down to publishing your product names, prices, stock, shipping costs, return terms and who runs the shop accurately and consistently, both in your product page text and in schema.org Product, Offer and OnlineStore structured data. That gives ChatGPT, Perplexity and Google's AI what they need to answer \"where can I buy X online?\" or \"which shop sells X with free returns?\" without guessing. It is not about adding special tags for AI.",
      intro: [
        "Written November 2, 2026 (JST). Information from Google, OpenAI and Japan's Consumer Affairs Agency was checked on each official page on that date.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your shop's and products' facts readable to AI. They do not guarantee that an AI will mention your shop or rank it anywhere.",
      ],
      sections: [
        {
          heading: "What shoppers ask AI, and what AI reads",
          paragraphs: [
            "Shopping questions put to AI mix product, price, stock, shipping and returns: \"where can I buy a sunscreen for sensitive skin online?\", \"a shop that sells wooden cutting boards made in Japan\", \"is X in stock, and how much is shipping?\", \"an online shoe store with easy returns\". To answer them, an AI has to be able to read, as text, which products you sell at what price, whether they can be bought now, what shipping and returns cost, and who is selling.",
            `Google says there are no additional requirements and no special schema.org structured data needed to appear in AI Overviews or AI Mode, and that the usual basics still matter, such as making structured data match the visible text and keeping your Merchant Center and Business Profile information up to date. [Google: AI features and your website](${SRC.googleAi})`,
            `For ChatGPT, OpenAI says product results in search are selected independently by ChatGPT and are not ads; that it considers structured metadata such as price and product description from first- and third-party providers; and that merchants are ranked on factors such as availability, price, quality and whether they are the maker or primary seller. Shopify merchants' product data is already integrated through Shopify Catalog, and other merchants can apply to provide a product feed directly (checked November 2, 2026). [OpenAI: Shopping with ChatGPT Search](${SRC.chatgptShopping})`,
          ],
        },
        {
          heading: "The facts an online shop should publish",
          paragraphs: [
            `Google's organization documentation has no required properties, asks you to use the most specific subtype, and recommends OnlineStore rather than OnlineBusiness for an e-commerce site. [Google: Organization structured data](${SRC.googleOrg}). For products, Google's merchant listing structured data requires name, image and offers on the Product, and price (greater than zero) and priceCurrency on the Offer; availability is recommended. [Google: Merchant listing structured data](${SRC.merchantListing})`,
          ],
          table: {
            head: ["Fact", "On the page", "In structured data"],
            rows: [
              ["The shop (who sells)", "Shop name, operating company and contact details, on an about or legal notice page", "OnlineStore (a kind of Organization); no required properties"],
              ["Product name and image", "On each product page, with a name that shows model, size or color differences", "Product name and image (required)"],
              ["Price", "The selling price as text, and when a sale price ends", "Offer price and priceCurrency (required)"],
              ["Stock", "In stock, out of stock or pre-order, matching the real state", "Offer availability (recommended)"],
              ["Return terms", "Return window, conditions and who pays return shipping, on one page", "Organization hasMerchantReturnPolicy; a link to the returns page (merchantReturnLink) alone is accepted"],
              ["Shipping", "Shipping costs (by region or order value) and delivery times", "Organization hasShippingService (shippingConditions required)"],
            ],
            caption: "Required and recommended properties as listed in Google's documentation on November 2, 2026.",
          },
          after: [
            `Merchant listing markup is for pages where a shopper can buy the product, and Google recommends adding it to product pages rather than pages that list products. Returns and shipping are best described once, as shop-wide policies on your Organization, rather than on every product. [Google: Return policy](${SRC.returnPolicy}) / [Google: Shipping policy](${SRC.shippingPolicy})`,
            "In Google, return and shipping settings in Merchant Center or Search Console take precedence over the structured data on your site. Changing a value in only one place leaves them in conflict, so when a price, shipping cost or return term changes, update your product pages, structured data, Merchant Center, marketplace store pages and llms.txt together.",
          ],
        },
        {
          heading: "Facts the law may already require on your pages",
          paragraphs: [
            `Rules for online selling differ by country, so check the ones that apply to you. In Japan, for example, the Act on Specified Commercial Transactions requires mail-order advertising to show the price including consumption tax, shipping costs, any other costs the buyer pays, when and how to pay, when the goods are delivered, terms for cancellation and returns, and the seller's name, address and phone number. [Consumer Affairs Agency: mail-order advertising (Japanese)](${SRC.caaAds}). These are exactly the facts an AI needs to answer \"how much is shipping?\" or \"can I return it?\".`,
            `Under the same law, if no return terms are displayed, the buyer may cancel within eight days of receiving the goods and pays the cost of returning them, the Consumer Affairs Agency explains. [Consumer Affairs Agency: mail-order return case (Japanese)](${SRC.caaReturn}). Whatever your policy is, state it plainly in text and keep the returns page you link from structured data saying the same.`,
            `Show ratings and reviews only from real customers. In Japan, stealth marketing has been a violation of the Act against Unjustifiable Premiums and Misleading Representations since October 1, 2023; posts a business asks or instructs third parties to make count as its advertising, review posts included. [Consumer Affairs Agency: stealth marketing (Japanese)](${SRC.caaStealth})`,
          ],
        },
        {
          heading: "Setting it up on a WordPress (WooCommerce) shop",
          list: [
            `Install Nurevo AEO (free) from [WordPress.org](${WP_ORG}) and activate it. Keep Yoast SEO, Rank Math, All in One SEO or Slim SEO if you use one.`,
            "Under Settings (or in the setup wizard), set the site type to \"Online shop\". It is suggested when WooCommerce is active, but nothing changes until you save. The shop is published as an OnlineStore, and no address or opening hours are needed (an address or phone you entered is still published).",
            "Enter the URLs of your return and refund policy page and your shipping policy page. The returns page is published as the shop's MerchantReturnPolicy (a link to that page), and both pages are listed in llms.txt. Shipping is not turned into structured data, because its conditions (costs and times) are not known to the plugin; the page is only listed in llms.txt.",
            "Product pages keep the Product markup WooCommerce prints; Nurevo AEO does not repeat it. On the front page it publishes up to the 30 most recently published products as a catalogue (OfferCatalog), with price, currency and stock where known. A rating is added only for products with real reviews. Products are also listed in llms.txt.",
            "Enter your FAQ (shipping costs, delivery times, gift wrapping, how to return) and place the Nurevo FAQ block or the [nurevo_faq] shortcode on the page where you want it shown.",
            "Run the diagnosis on the AEO Score screen. For an online shop it checks for products with price and stock, a returns page, a shipping page and contact details, and lists what is missing.",
            "See what AI reads from the outside with the [free AI readability check](/check?lang=en), and confirm that prices, shipping and return terms match Merchant Center and your marketplace store pages.",
          ],
          after: [
            "On shops not built with WordPress, such as Shopify, the same idea applies: publish the facts in the table above in your product page text and in structured data, and list your shop overview, returns, shipping and main product pages in llms.txt. [What is llms.txt?](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Each product page shows the product name, price and stock status as text, not only in an image.",
            "Prices and stock in the structured data match the values visible on the page, and sold-out products are not marked as in stock.",
            "Shipping costs, delivery times and return terms have their own pages, linked from product pages or the footer.",
            "The seller's name, address, phone number and other legally required details are published.",
            "The shop's structured data type fits the business, such as OnlineStore.",
            "Rating and review markup comes only from real customer reviews.",
            "Prices, shipping and return terms match across your site, Merchant Center, marketplaces and social shop pages.",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, ask AI the questions your customers would ask (\"best online shop for X\", \"where to buy X with free shipping\") and see whether your shop or products come up by name or URL. Answers change between runs, so ask the same questions a few times, spread over time.",
            "When your site is connected to the Nurevo service, the Free and Standard plans include a monthly check: three questions built from your product categories (never your shop's name) are put to Perplexity, and the plugin records whether the answers named your shop or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta: how often your shop appears in AI answers, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response.",
          ],
        },
      ],
      faqs: [
        { q: "Where should an online shop start with AI search?", a: "Write each product's name, price and stock status correctly as text on its product page, and put shipping, returns and seller details on their own pages. Then publish the same facts as Product, Offer and OnlineStore structured data and in llms.txt, and make sure they match Merchant Center and your marketplace listings." },
        { q: "Do I have to pay to get my products into ChatGPT?", a: "OpenAI says product results in ChatGPT search are selected independently and are not ads. Shopify merchants are already integrated through Shopify Catalog, and other merchants can apply to provide a product feed directly. In either case, appearing is not guaranteed." },
        { q: "If I sell on marketplaces such as Amazon, do I still need to fix my own site?", a: "Marketplace pages can be used as sources by AI, but your own site is where you can publish product descriptions, return terms and FAQ in the most detail and most accurately. Keeping prices, shipping and return terms in agreement in both places is the safest approach." },
        { q: "Is Nurevo AEO free?", a: `Yes. The online shop type (OnlineStore), product catalogue, return policy and FAQ structured data, llms.txt, AI crawler rules and the AEO score are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee my products appear in AI answers?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your products' and shop's facts easy for AI to read and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your shop's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google and Google Merchant Center of Google LLC. WooCommerce, Shopify, Amazon, Yoast SEO, Rank Math, All in One SEO and Slim SEO are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
