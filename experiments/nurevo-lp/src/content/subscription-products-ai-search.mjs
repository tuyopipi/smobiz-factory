// Content page (EC): how a shop selling subscriptions / 定期便 makes the
// conditions of the contract (price per delivery, interval, minimum number of
// deliveries, total, skip/pause, how and by when to cancel) readable by AI
// answers, and keeps them identical to the legally required final
// confirmation screen. Separate from online-shop-ai-search (shop-level facts),
// ec-product-variants-specs-ai-search (size/colour/spec of one product),
// chatgpt-shopping-product-feed (feeds) and pricing-page-ai-search (B2B/SaaS
// plan pages).
//
// Written 2026-11-28 20時 (JST).
//
// Outside facts and where they were read (2026-11-28):
// - Consumer Affairs Agency, 令和3年特定商取引法等改正 page: Act No. 72 of
//   2021, promulgated 2021-06-16, in force 2022-06-01 except listed
//   provisions; links the guideline 「通信販売の申込み段階における表示について
//   のガイドライン」 (別添9 of the 施行通達). Public comment notices
//   2021-11-24 (entry 026648) and results 2022-02-09 (entry 027532, 259
//   comments).
// - Saitama Prefecture consumer centre, 定期購入 page (掲載 2026-02-19):
//   第12条の6 (display duty and ban on misleading display), 第13条の2 (ban on
//   false statements about cancellation), 第15条の4 (consumer may cancel the
//   application when misled), in force 2022-06-01; six items on the final
//   confirmation screen: 分量（数量、回数、期間等）, 価格（各回の代金と総額）,
//   支払時期と支払方法, 引渡し時期, 申込期限, 申込みの撤回・解除（解約の申込
//   期限、解約料等）; must be shown so the whole contract is visible on that
//   screen; hard-to-use cancellation methods must be on the screen itself;
//   examples: small 定期購入 notice beside large 「初回無料」, 「いつでも解約
//   可能」 with hidden conditions, falsely saying "あと〇回買わないと解約でき
//   ない"; 「行政処分や罰則の対象」.
// - schema.org UnitPriceSpecification (V30.1): billingDuration ("model the
//   contractual duration of a subscription or payment plan"), billingIncrement,
//   billingStart, referenceQuantity, unitCode (UN/CEFACT).
// - Google merchant listing structured data: no subscription property; the
//   UnitPriceSpecification uses documented are unit pricing, strikethrough
//   (priceType must be StrikethroughPrice) and member prices.
// - WooCommerce Subscriptions doc "Creating a subscription product" (modified
//   2026-11-25): subscription price (empty → not purchasable), payment schedule
//   day/week/month/year every 1–6, "Stop renewing after", sign-up fee, free
//   trial; "$75 per month with a $200 sign-up fee" → $275 at checkout; preview
//   the product to check what customers see; no structured data mentioned.
// - US: Gibson Dunn (2026-02-27, upd 03-11): Click-to-Cancel rule adopted Oct
//   2024, vacated by the Eighth Circuit July 2025; ANPRM announced 2026-03-11;
//   ROSCA: disclose all material terms before billing info, express informed
//   consent, simple mechanism to stop charges. Jones Day (2026-05): ROSCA
//   applies to internet transactions; about 30 states have auto-renewal laws.
// - UK: DWF (2026-10-22): DMCCA subscription contracts regime expected in
//   force January 2027 (previously spring 2027); pre-contract information,
//   renewal reminders, 14-day cooling-off, ease of exit; CMA fines up to 10%
//   of global turnover; secondary legislation and guidance still awaited.
// - Gaprise (MarTechLab, 2026-08-26): own survey 2025, n=800, 44.0% used
//   generative AI before buying.
// Top articles read 2026-11-28: mercart 235 (2026-04-16, upd 11-04),
// MarTechLab LP AIO (2026-08-26), jinrai EC AIO (2026-05-20, upd 11-27),
// EC実務ラボ aio-strategy (2026-03-20), giftls 000018 (2026-09-04), w2solution
// 単品リピート (no date); Ranktracker subscription ecommerce (2026-01-21),
// Texta subscription box (no date), Shopify AEO for ecommerce (2026-11-24),
// BigCommerce ChatGPT product discovery (no date), Search Engine Land ChatGPT
// shopping (Kagzi). ADSX failed. CAA notice02, OpenAI feed spec, schema.org
// PriceTypeEnumeration and Hogan Lovells were not readable (permission).
// Not verified, so not stated: CAA's own wording of the six items (the
// Saitama page is cited), consultation statistics, fine amounts, any OpenAI
// feed field for subscriptions, a schema.org subscription priceType value,
// how WooCommerce Subscriptions' price appears in WooCommerce's JSON-LD.
//
// Nurevo facts (readme 0.9.x, plugin source): site type "Online shop" →
// OnlineStore with catalogue and return policy, WooCommerce's Product/Offer
// left alone; llms.txt "## Products" line has name, URL, one price
// (get_price), currency, stock, SKU, categories — no interval or minimum
// count; filter webmcp_canary_llms_txt_lines; FAQ via Nurevo FAQ block /
// [nurevo_faq] → FAQPage on that page only; 0.9.1 coexists with SEO SIMPLE
// PACK and VK All in One Expansion Unit. Pro measures AI mentions on
// Perplexity now (ChatGPT when configured).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  caa: "https://www.caa.go.jp/policies/policy/consumer_transaction/amendment/2021/",
  caaComment: "https://www.caa.go.jp/notice/entry/027532/",
  saitama: "https://www.pref.saitama.lg.jp/b0304/shohisoudan/jirei/tsuhan/teikikonyu.html",
  unitPrice: "https://schema.org/UnitPriceSpecification",
  billingDuration: "https://schema.org/billingDuration",
  googleMerchant: "https://developers.google.com/search/docs/appearance/structured-data/merchant-listing",
  wooSubs: "https://woocommerce.com/document/subscriptions/creating-subscription-products/",
  gibson: "https://www.gibsondunn.com/ftc-restarts-negative-option-rulemaking-after-eighth-circuit-vacatur-enforcement-under-rosca-continues/",
  jonesday: "https://www.jonesday.com/en/insights/2026/05/ftc-revives-clicktocancel-rule-new-risks-for-subscription-businesses",
  dwf: "https://dwfgroup.com/fr-ca/news-and-insights/insights/2026/10/dmcca-subscription-contracts-regime-preparing-for-the-new-restrictions",
  martech: "https://martechlab.gaprise.jp/archives/aio-geo/aio-landing-page-optimization/",
  w2: "https://www.w2solution.co.jp/useful_info_ec/single-item-repeat/",
  ranktracker: "https://www.ranktracker.com/blog/ai-overviews-subscription-ecommerce",
  texta: "https://www.texta.ai/industries/ecommerce/subscription-box",
  shopify: "https://www.shopify.com/blog/aeo-for-ecommerce",
};

const TABLE_JA = `【定期便の条件】国産ブレンド珈琲豆 定期便（200g）
- 1回の内容：珈琲豆 200g × 1袋
- お届けの間隔：4週間ごと（2・4・6週間から選べます）
- 価格：初回 1,980円、2回目以降 2,480円（税込・送料込み）
- 回数の約束：なし（初回のあと、いつでも解約できます）
- 総額の例：3回受け取った場合 6,940円
- お支払い：お届けごとにクレジットカードで決済（発送日に決済）
- スキップ・休止・間隔の変更：マイページから、次回発送日の5日前まで
- 解約の方法：マイページの「定期便の解約」ボタン、または電話 03-0000-0000（平日10〜17時）
- 解約の締め切り：次回発送日の5日前まで（それ以降は次の1回が届きます）
- 解約料：なし
- 返品：未開封で到着から8日以内（初回のみ送料当店負担）
最終更新：2026年11月28日`;

const TABLE_EN = `[Subscription terms] House blend coffee beans subscription (200 g)
- Each delivery: 200 g of beans, 1 bag
- Interval: every 4 weeks (choose 2, 4 or 6 weeks)
- Price: first delivery $12.00, then $16.00 per delivery (tax and shipping included)
- Minimum commitment: none (cancel any time after the first delivery)
- Example total: $44.00 if you receive 3 deliveries
- Billing: card charged on each shipping day
- Skip, pause or change interval: in your account, up to 5 days before the next shipping day
- How to cancel: the "Cancel subscription" button in your account, or call +1-000-000-0000 (weekdays 10am–5pm)
- Cancellation deadline: 5 days before the next shipping day (after that, one more delivery ships)
- Cancellation fee: none
- Returns: unopened, within 8 days of arrival (we pay return shipping on the first delivery)
Last updated: 28 November 2026`;

const JSONLD_JA = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Offer",
  "url": "https://shop.example.jp/product/coffee-subscription/",
  "price": "2480",
  "priceCurrency": "JPY",
  "availability": "https://schema.org/InStock",
  "priceSpecification": {
    "@type": "UnitPriceSpecification",
    "price": "2480",
    "priceCurrency": "JPY",
    "valueAddedTaxIncluded": true,
    "referenceQuantity": { "@type": "QuantitativeValue", "value": 4, "unitCode": "WEE" }
  }
}
</script>
※ 価格・URLは書き方の例です。WooCommerce がすでに出している Product の
  offers を、プラグインやフィルターで書き換える形にし、Product を2つ作らないでください。
  Google はこの書き方を定期便の表示に使うとは案内していません。`;

const JSONLD_EN = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Offer",
  "url": "https://shop.example.com/product/coffee-subscription/",
  "price": "16.00",
  "priceCurrency": "USD",
  "availability": "https://schema.org/InStock",
  "priceSpecification": {
    "@type": "UnitPriceSpecification",
    "price": "16.00",
    "priceCurrency": "USD",
    "valueAddedTaxIncluded": true,
    "referenceQuantity": { "@type": "QuantitativeValue", "value": 4, "unitCode": "WEE" }
  }
}
</script>
* Price and URL are placeholders. Change the offers of the Product that
  WooCommerce already outputs (through a plugin or filter); do not add a
  second Product. Google does not document this markup for subscriptions.`;

export default {
  slug: "subscription-products-ai-search",
  targetQueries: [
    "定期便 AI検索 対策",
    "サブスク 商品 LLMO 解約条件 書き方",
    "定期購入 最終確認画面 表示 AI",
    "subscription products AI search optimization",
    "subscription ecommerce ChatGPT cancellation terms",
    "WooCommerce Subscriptions AI search",
  ],
  related: ["online-shop-ai-search", "ec-product-variants-specs-ai-search", "chatgpt-shopping-product-feed", "faq-page-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "定期便・サブスク商品のAI検索対策：解約条件と総額の書き方 | Nurevo",
      description: "「この定期便は何回で解約できる？」とAIに聞かれたときに、正しい答えの材料になる条件の表の作り方。特定商取引法の最終確認画面とそろえる手順、WooCommerceでの設定、確かめ方。",
      h1: "定期便・サブスク商品のAI検索対策：解約条件・回数・総額をAIに正しく読ませる手順",
      lead: "定期便についてAIに聞く人が知りたいのは「1回いくらで、何回続けると総額いくらか」「いつまでに、どうやって解約できるか」です。答えの材料になるのは、商品ページの本文に文字で書いた1枚の条件の表です。初回価格と2回目以降の価格、回数の約束、総額、スキップと解約の締め切り、解約の方法を同じ表に並べ、注文の最終確認画面・よくある質問・llms.txt と同じ値にそろえると、AIが「初回だけの価格」や「条件の抜けた『いつでも解約可能』」を答えにしにくくなります。",
      intro: [
        "作成日：2026年11月28日（日本時間）。消費者庁と埼玉県の公開ページ、schema.org、Google と WooCommerce の公式の説明を同じ日に読んで確認しました。",
        "対象は、食品・化粧品・日用品などを定期便やサブスクリプションで売っているネットショップの方と、その制作・運用の担当者です。ショップ全体の情報（送料・返品・在庫）は[ネットショップのAI検索対策](/guide/online-shop-ai-search)、色やサイズの書き方は[商品のサイズ・色・仕様をAIに正しく読ませる手順](/guide/ec-product-variants-specs-ai-search)にあります。ここでは「定期で届く契約の条件」だけを扱います。",
        "この記事は法律の助言ではありません。表示が法律に合っているかは、消費者庁の資料や専門家に確認してください。AIの答えは聞くたびに変わることがあり、ここに書いたことでAIに出ることを約束するものではありません。",
      ],
      sections: [
        {
          heading: "上位の記事に書かれていなかったこと",
          paragraphs: [
            `「定期通販 AIO対策」「ECサイト LLMO」「subscription ecommerce AI search」などで上位に出る日本語6本・英語5本を、2026年11月28日に読みました。定期購入の条件と解約方法を画像ではなく文字で書くべきだという指摘（[MarTechLab](${SRC.martech})）や、「解約は簡単か」「一時停止できるか」といった質問を見張るべきだという指摘（[Ranktracker](${SRC.ranktracker})、[Texta](${SRC.texta})）は役に立つものでした。一方で、次のことはどの記事にもありませんでした。`,
          ],
          list: [
            "定期便の条件を、どの項目・どの順番でページに書けばよいかの具体的な形",
            "特定商取引法の最終確認画面の項目と、AIが読むページの項目をそろえる考え方",
            "定期便の価格を構造化データでどこまで書けるか（Google が何を案内していないか）",
            "WordPress（WooCommerce Subscriptions）の画面での手順",
            "定期便の条件について、AIの答えが正しいかを確かめる質問の例",
          ],
          after: ["以下では、この5つを順に埋めます。"],
        },
        {
          heading: "定期便についてAIに聞かれる質問と、答えに必要な事実",
          paragraphs: [
            `生成AIの答えを買う前の参考にする人は増えています。株式会社ギャプライズの2025年の調査（800人）では、44.0%が購入前に生成AIを使っていました（[MarTechLab](${SRC.martech})）。定期便は「買ったあとに続く契約」なので、聞かれるのは商品のよさより条件です。よくある質問と、答えに必要な事実を並べました。`,
          ],
          table: {
            head: ["よく聞かれること", "答えに必要な事実", "書いてないとどうなりやすいか"],
            rows: [
              ["1回いくら？", "初回価格と2回目以降の価格、税込か、送料込みか", "初回の安い価格だけが答えに出る"],
              ["何回で解約できる？", "回数の約束（最低回数）の有無と回数", "「いつでも解約可能」とだけ答えられる"],
              ["全部でいくらかかる？", "回数の約束がある場合の総額、ない場合の例", "利用者が自分で計算することになる"],
              ["休める？間隔は変えられる？", "スキップ・休止・間隔の変更の方法と締め切り", "「できるかどうか分からない」と答えられる"],
              ["どうやって解約する？", "解約の方法（画面・電話・メール）、受付時間、締め切り、解約料", "他のサイトの口コミが答えの材料になる"],
              ["他の定期便と比べてどう？", "上のすべてが、比べられる形で並んでいること", "比べる材料が少ない店は候補に挙げにくい"],
            ],
          },
          after: [
            "どの質問も、ページに文字で書かれていれば答えの材料になります。画像のバナーやポップアップの中だけにある条件は、AIの検索の仕組みによっては読まれません。",
          ],
        },
        {
          heading: "1枚の「定期便の条件」の表にまとめる",
          paragraphs: [
            "条件はページのあちこちに散らさず、1か所に、1行1項目で並べます。AIは見出しと短い行の組み合わせを読み取りやすく、人にとっても比べやすくなります。架空のコーヒー豆の定期便で書いた例です。",
          ],
          code: TABLE_JA,
          after: [
            "書くときのポイントは4つです。1つ目は、初回価格と2回目以降の価格を同じ行に書くことです。2つ目は、回数の約束がないなら「なし」と書くことです。書いていないと、AIは「ない」とは判断できません。3つ目は、締め切りを「次回発送日の5日前」のように日付の数え方で書くことです。4つ目は、最終更新日を入れることです。価格や締め切りを変えたら、日付も変えます。",
            "同じ表を、商品ページ、定期便の案内ページ、注文の最終確認画面、よくある質問の答えで使い回します。言い回しが違っても、数字と締め切りは同じにします。",
          ],
        },
        {
          heading: "特定商取引法の最終確認画面と同じ値にそろえる",
          paragraphs: [
            `2022年6月1日に施行された改正特定商取引法（第12条の6）で、ネットショップの注文の最終確認画面に、契約の大事な条件を表示することが決まりました（[消費者庁](${SRC.caa})）。埼玉県の消費生活支援センターの説明では、表示する項目は次の6つです（[埼玉県](${SRC.saitama})）。`,
          ],
          table: {
            head: ["最終確認画面の項目", "定期便で書くこと", "上の条件の表の行"],
            rows: [
              ["分量", "1回の内容、回数、期間", "1回の内容・回数の約束"],
              ["価格", "各回の代金と、今後支払う代金の総額", "価格・総額の例"],
              ["支払の時期と方法", "いつ、何で決済するか", "お支払い"],
              ["引渡しの時期", "いつ届くか、間隔", "お届けの間隔"],
              ["申込みの期限", "期限がある場合はその期限", "（期限があれば足す）"],
              ["申込みの撤回・解除", "解約の方法、締め切り、解約料", "解約の方法・締め切り・解約料"],
            ],
          },
          after: [
            `同じページでは、大きな「お試し」「初回無料」の近くに小さく定期購入と書く表示や、条件を隠した「いつでも解約可能」が、誤解を招く表示の例として挙げられています。こうした表示で誤解して申し込んだ人は申込みを取り消せる（第15条の4）とされ、行政処分や罰則の対象にもなります（[埼玉県](${SRC.saitama})）。消費者庁のガイドライン「通信販売の申込み段階における表示についてのガイドライン」も公開されています（[消費者庁](${SRC.caa})）。`,
            "AI検索のためにも、この6項目は役に立ちます。最終確認画面に出す値をそのまま商品ページの条件の表にも書いておくと、AIが読むページと、お客様が申し込む画面の内容が一致します。逆に、商品ページには「初回1,980円」だけ、条件は最終確認画面にだけ、という作りだと、AIが読めるのは初回価格だけになりがちです。最終確認画面はログインやカートの中にあり、AIの検索のクローラーは通常そこまで入りません。",
          ],
        },
        {
          heading: "構造化データで書けること・書けないこと",
          paragraphs: [
            `Google の商品の構造化データ（merchant listing）の説明には、定期便の周期や回数を書く項目はありません。UnitPriceSpecification（単位あたりの価格）は、単位価格、元の価格（取り消し線の価格）、会員価格の書き方として案内されています（[Google](${SRC.googleMerchant})）。`,
            `schema.org の語彙では、UnitPriceSpecification に referenceQuantity（何あたりの価格か）や billingDuration（「定期の契約や支払いプランの期間」を表すのに使える）が定義されています（[UnitPriceSpecification](${SRC.unitPrice})、[billingDuration](${SRC.billingDuration})）。書くなら次のような形ですが、Google の検索の表示に使われるとは案内されていないため、優先度は本文の表より下です。`,
          ],
          code: JSONLD_JA,
          after: [
            "WooCommerce はすでに商品の Product と Offer を出しているので、別の Product を足すと同じ商品が2つあることになります。足すなら WooCommerce の Offer を書き換える形にし、できないなら構造化データは触らず、本文の表とよくある質問を整えるほうが確実です。",
          ],
        },
        {
          heading: "WordPress（WooCommerce Subscriptions）での手順",
          paragraphs: [
            `WooCommerce Subscriptions の公式の説明（2026年11月25日更新）では、定期便の商品に設定する項目は、定期の価格、支払いの間隔（日・週・月・年ごと、1〜6の間隔）、更新を止めるまでの期間、初回登録料、無料のお試し期間です。初回登録料は定期の価格に足され、たとえば月75ドルに登録料200ドルなら、最初の会計は275ドルになるとされています（[WooCommerce](${SRC.wooSubs})）。`,
          ],
          list: [
            "1. 商品の編集画面で、定期の価格・間隔・期間・登録料・お試し期間を設定し、保存後にプレビューで、お客様に見える価格の表示を確認する",
            "2. 商品説明に「定期便の条件」の表を文字で貼る。プレビューで見えた価格の表示と、表の数字が同じかを確かめる",
            "3. 解約の方法・スキップの方法を書いた案内ページを1つ作り、商品説明からリンクする",
            "4. 注文の最終確認画面に、条件の表と同じ6項目が出ているかを、実際にテスト注文の直前まで進めて確かめる",
            "5. よくある質問（何回で解約できるか、いつまでに解約すればよいか、休めるか）を、Nurevo AEO の設定に入れ、Nurevo FAQ ブロックを案内ページに置く。そのページにだけ FAQPage の構造化データが出る",
            "6. Nurevo AEO のサイトの種類を「ネットショップ」にし、返品ポリシーと配送のページのURLを入れる。llms.txt の商品の一覧には商品ごとに価格が1つ載るので、その価格がどの回の価格かが分かるよう、商品名か案内ページで補う",
            "7. SEO SIMPLE PACK などのSEOプラグインと併用していても、Nurevo AEO 0.9.1 以降は構造化データを重ねて出さない。他の構造化データのプラグインを足す場合は、Product が2つにならないかを確かめる",
          ],
          after: [
            "llms.txt の商品の行には、名前・URL・価格・通貨・在庫・SKU・カテゴリーが載り、周期や回数の約束は載りません。条件を llms.txt にも載せたい場合は、案内ページのURLを主なページとして載せるか、開発者向けのフィルター（webmcp_canary_llms_txt_lines）で行を足します。",
          ],
        },
        {
          heading: "海外のお客様にも売る場合",
          paragraphs: [
            `米国では、ネットでの定期契約に ROSCA という法律があり、決済情報を受け取る前に大事な条件をはっきり示すこと、同意を得ること、簡単に止められる方法を用意することが求められています。連邦取引委員会（FTC）の「クリックで解約」の規則は2025年7月に裁判所で取り消され、2026年3月に規則づくりがやり直されています（[Gibson Dunn](${SRC.gibson})）。州ごとの自動更新の法律も約30州にあるとされます（[Jones Day](${SRC.jonesday})）。`,
            `英国では、DMCC法の定期契約の規則が2027年1月に施行される見込みと伝えられています（2026年10月22日時点、[DWF](${SRC.dwf})）。どちらの国でも、条件の表を英語で用意しておくことが、法律への対応とAIの答えの両方の土台になります。`,
          ],
        },
        {
          heading: "AIの答えを確かめる質問の例",
          paragraphs: [
            "条件の表を載せたら、ChatGPT・Perplexity・Google の AI による概要で、次のように聞いてみます。ページの更新から反映まで時間がかかることがあるので、数週間おきに同じ質問を繰り返し、答えと日付を記録します。",
          ],
          list: [
            "「（店名）の（商品名）の定期便は、何回続けないと解約できませんか？」",
            "「（商品名）の定期便を3回受け取ると、総額いくらですか？」",
            "「（店名）の定期便の解約は、いつまでに、どうやって申し込めばよいですか？」",
            "「（商品のジャンル）の定期便で、回数の約束がないものを教えて」",
          ],
          after: [
            "答えが表と違うときは、AIが出典にしたページを確かめます。古いキャンペーンのページ、比較サイト、口コミが出典になっていることがよくあります。自社の古いページなら更新するか、最新の案内ページへのリンクを足します。Nurevo AEO の Pro プランでは、こうした質問でのAIでの登場を Perplexity で計測しています（ChatGPT は設定され次第）。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "条件の表が、画像ではなく文字で商品ページにある",
            "初回価格と2回目以降の価格が同じ行にある",
            "回数の約束が「なし」または「◯回」とはっきり書いてある",
            "総額（または受け取り回数ごとの例）が書いてある",
            "スキップ・休止・解約の締め切りが、次回発送日からの日数で書いてある",
            "解約の方法と受付時間、解約料が書いてある",
            "最終確認画面の6項目と、表の数字が一致している",
            "よくある質問の答えと、表の数字が一致している",
            "古いキャンペーンのページが、今と違う条件のまま残っていない",
            "表に最終更新日があり、条件を変えたら更新している",
          ],
        },
      ],
      faqs: [
        { q: "定期便の条件は、商品ページと別のページのどちらに書けばいいですか？", a: "商品ページに条件の表を置き、解約やスキップの手順は別の案内ページにまとめてリンクするのがおすすめです。どちらのページでも数字と締め切りは同じにします。" },
        { q: "「初回無料」「初回980円」と大きく書いてもいいですか？", a: "書くことはできますが、すぐ近くに2回目以降の価格と回数の約束を同じ大きさで書いてください。埼玉県の説明では、大きなお試しの表示の近くに小さく定期購入と書く表示が、誤解を招く例として挙げられています。" },
        { q: "回数の縛りがあると、AIに不利になりますか？", a: "回数の約束があること自体で不利になるかは分かりません。ただ、書いていないと、AIが「いつでも解約可能」と答えたり、口コミの不満が答えの材料になったりしやすくなります。回数と総額をはっきり書くほうが安全です。" },
        { q: "構造化データだけで条件を伝えられますか？", a: "伝えられません。Google の商品の構造化データには定期便の周期や回数の項目がなく、本文の文字の表が一番大事です。構造化データは補助として考えてください。" },
        { q: "WooCommerce Subscriptions の設定を変えたら、何を直せばいいですか？", a: "商品説明の条件の表、案内ページ、よくある質問、最終確認画面の表示の4つを同じ日に直し、表の最終更新日を変えます。llms.txt の価格は WooCommerce の価格から作られます。" },
        { q: "Nurevo AEO は定期便の条件を自動で出力しますか？", a: "いいえ。Nurevo AEO はショップの情報（OnlineStore）、返品ポリシー、llms.txt の商品の一覧（商品ごとに価格1つ）を出し、AIの検索のクローラーを許可します。周期や回数の約束は、本文の表とよくある質問で書いてください。" },
      ],
      relatedHeading: "関連するガイド",
      cta: {
        heading: "まず、AIからショップがどう読めているかを確かめる",
        body: "無料の診断で、構造化データ・llms.txt・AIのクローラーの許可の状態が登録なしで分かります。WordPress なら Nurevo AEO を無料で入れて、ショップの情報と商品の一覧をAI向けに出せます。",
        label: "無料でAI対応度を診断する",
        href: "/check",
        secondary: { label: "WordPress.org で無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPT は OpenAI、Perplexity は Perplexity AI、Google は Google LLC の商標です。WordPress は WordPress Foundation、WooCommerce は Automattic の商標です。SEO SIMPLE PACK、Ranktracker、Texta、MarTechLab、Gibson Dunn、Jones Day、DWF は各社の商標です。Nurevo はこれらの企業と提携・承認の関係にありません。",
    },
    en: {
      title: "Subscription products and AI search: terms, totals, cancellation",
      description: "Make subscription terms readable by AI: price per delivery, minimum term, total and cancellation, matched to the checkout summary, with WooCommerce steps.",
      h1: "Subscription products and AI search: make your cancellation terms, commitment and totals readable",
      lead: "People who ask AI about a subscription want two things: what each delivery costs and what it adds up to, and how and by when they can cancel. The material for that answer is one terms table, written as text on the product page: first and later prices, the minimum commitment, a total, skip and cancellation deadlines and the cancellation method. Keep the same values on the checkout's final summary, in your FAQ and in llms.txt, and AI is less likely to quote only the introductory price or an unqualified \"cancel any time\".",
      intro: [
        "Written 28 November 2026 (JST). Japanese government pages, schema.org, and Google's and WooCommerce's official documentation were read and checked on the same day.",
        "This guide is for online shops that sell food, cosmetics or household goods on subscription, and for the people who build and run those shops. Shop-wide facts (shipping, returns, stock) are in [AI search for online shops](/guide/online-shop-ai-search) and sizes and colours in [making product sizes, colours and specs readable by AI](/guide/ec-product-variants-specs-ai-search). This page covers only the terms of a recurring delivery.",
        "This is not legal advice; check your disclosures against your regulator's guidance or with a lawyer. AI answers change from one query to the next, and nothing here guarantees that AI will mention you.",
      ],
      sections: [
        {
          heading: "What the top articles left out",
          paragraphs: [
            `On 28 November 2026 we read six Japanese and five English articles that rank for queries such as "subscription ecommerce AI search" and "EC AIO". Useful points were there: put subscription terms and the cancellation method in HTML text, not images ([MarTechLab](${SRC.martech}), Japanese), and monitor prompts such as "can you cancel easily" or "can I pause" ([Ranktracker](${SRC.ranktracker}), [Texta](${SRC.texta})). None of them covered the following.`,
          ],
          list: [
            "A concrete format: which terms to list, and in what order",
            "Lining up the page that AI reads with the disclosures the law requires at checkout",
            "How far structured data can describe a subscription price, and what Google does not document",
            "Steps in WordPress with WooCommerce Subscriptions",
            "Prompts for checking whether AI gets your subscription terms right",
          ],
          after: ["The sections below fill those five gaps."],
        },
        {
          heading: "What AI is asked about subscriptions, and the facts each answer needs",
          paragraphs: [
            `More shoppers consult AI before buying. In a 2025 survey of 800 people by Gaprise, 44.0% had used generative AI before a purchase ([MarTechLab](${SRC.martech})). A subscription is a contract that continues after the purchase, so the questions are about terms more than the product.`,
          ],
          table: {
            head: ["Question", "Facts the answer needs", "What tends to happen if they are missing"],
            rows: [
              ["How much per delivery?", "First price and later price, tax and shipping included or not", "Only the low introductory price is quoted"],
              ["Is there a minimum term?", "Whether there is a commitment, and how many deliveries", "AI says \"cancel any time\" with no conditions"],
              ["What will it cost in total?", "The total for the commitment, or an example total", "The shopper has to work it out"],
              ["Can I skip or change the interval?", "How to skip, pause or change, and the deadline", "AI says it cannot tell"],
              ["How do I cancel?", "Method (account page, phone, email), hours, deadline, fee", "Reviews on other sites become the source"],
              ["How does it compare?", "All of the above in a comparable form", "Shops with fewer facts are harder to recommend"],
            ],
          },
          after: [
            "Any of these can be answered when the facts are written as text on a page. Terms that exist only inside a banner image or a pop-up may not be read, depending on how each AI search system fetches pages.",
          ],
        },
        {
          heading: "Put the terms in one table",
          paragraphs: [
            "Keep the terms in one place, one item per line. Short labelled lines are easy for AI to extract and for people to compare. Here is an example for a fictional coffee subscription.",
          ],
          code: TABLE_EN,
          after: [
            "Four habits matter. Put the first and later prices on the same line. If there is no minimum commitment, write \"none\"; AI cannot infer absence. Express deadlines relative to the next shipping day. Add a last-updated date and change it whenever a price or deadline changes.",
            "Reuse the same table on the product page, the subscription help page, the checkout's final summary and your FAQ answers. Wording can vary; numbers and deadlines must not.",
          ],
        },
        {
          heading: "Match the checkout's final summary",
          paragraphs: [
            `Many jurisdictions require the key terms of a subscription to be shown before the order is placed, so the checkout already contains most of the facts AI needs.`,
            `In the United States, the Restore Online Shoppers' Confidence Act (ROSCA) requires online sellers to clearly disclose all material terms before taking billing information, obtain express informed consent and provide a simple way to stop recurring charges. The FTC's Click-to-Cancel rule, adopted in October 2024, was vacated by the Eighth Circuit in July 2025, and the FTC announced new rulemaking on 11 March 2026 ([Gibson Dunn](${SRC.gibson})). About 30 states have their own auto-renewal laws ([Jones Day](${SRC.jonesday})).`,
            `In the United Kingdom, the subscription contracts regime of the DMCC Act is expected to come into force in January 2027, covering pre-contract information, renewal reminders, a 14-day cooling-off period and easy exit; secondary legislation and guidance were still awaited as of 22 October 2026 ([DWF](${SRC.dwf})).`,
            `In Japan, the amended Act on Specified Commercial Transactions (in force 1 June 2022) requires six items on the final confirmation screen of an online order ([Consumer Affairs Agency](${SRC.caa}), Japanese; item list as explained by [Saitama Prefecture](${SRC.saitama})):`,
          ],
          table: {
            head: ["Final-screen item (Japan)", "For a subscription", "Line in the terms table"],
            rows: [
              ["Quantity", "Contents per delivery, number of deliveries, period", "Each delivery, minimum commitment"],
              ["Price", "Price of each delivery and the total to be paid", "Price, example total"],
              ["Payment timing and method", "When and how the card is charged", "Billing"],
              ["Delivery timing", "When it arrives, interval", "Interval"],
              ["Application deadline", "If there is one", "(add if applicable)"],
              ["Withdrawal and cancellation", "Method, deadline, fee", "How to cancel, deadline, fee"],
            ],
          },
          after: [
            `The Saitama page gives a small subscription notice next to a large "free trial" and a "cancel any time" with hidden conditions as examples of misleading displays; a consumer misled this way may cancel the application, and violations can lead to administrative action and penalties ([Saitama Prefecture](${SRC.saitama})).`,
            "The same values help AI. When the product page carries exactly what the final summary shows, the page AI reads and the screen the customer agrees to say the same thing. If the product page shows only the introductory price and the terms appear only at checkout, AI is likely to see only the introductory price: the checkout sits behind a cart or a login that AI search crawlers normally do not enter.",
          ],
        },
        {
          heading: "What structured data can and cannot say",
          paragraphs: [
            `Google's merchant listing structured data documentation has no property for a subscription's interval or commitment. It documents UnitPriceSpecification for unit pricing, strikethrough (original) prices and member prices ([Google](${SRC.googleMerchant})).`,
            `The schema.org vocabulary defines referenceQuantity (the quantity a price refers to) and billingDuration, which "can be used, for example, to model the contractual duration of a subscription or payment plan" ([UnitPriceSpecification](${SRC.unitPrice}), [billingDuration](${SRC.billingDuration})). If you add markup, it could look like this, but Google does not say it uses it, so it ranks below the text table in priority.`,
          ],
          code: JSONLD_EN,
          after: [
            "WooCommerce already outputs a Product and Offer for each product, so adding a separate Product would describe the same item twice. Change WooCommerce's Offer if you can; otherwise leave the markup alone and invest in the text table and FAQ.",
          ],
        },
        {
          heading: "Steps in WordPress (WooCommerce Subscriptions)",
          paragraphs: [
            `According to WooCommerce's documentation (updated 25 November 2026), a subscription product has a subscription price, a payment schedule (every 1 to 6 days, weeks, months or years), when to stop renewing, an optional sign-up fee and an optional free trial. The sign-up fee is added to the first payment: $75 per month with a $200 sign-up fee means $275 at checkout ([WooCommerce](${SRC.wooSubs})).`,
          ],
          list: [
            "1. Set the price, schedule, length, sign-up fee and trial on the product, save, and preview what customers see",
            "2. Paste the terms table into the product description as text and check that its numbers match the preview",
            "3. Create one help page for skipping and cancelling and link to it from the description",
            "4. Run a test order up to the final summary and check that every term in the table appears there",
            "5. Enter FAQ questions (minimum term, cancellation deadline, pausing) in Nurevo AEO settings and place the Nurevo FAQ block on the help page; FAQPage markup is output on that page only",
            "6. Set the Nurevo AEO site type to Online shop and add your return and shipping policy URLs. llms.txt lists one price per product, so make clear in the product name or help page which delivery that price applies to",
            "7. If you add another structured data plugin, check that it does not create a second Product",
          ],
          after: [
            "Each product line in llms.txt carries name, URL, price, currency, stock, SKU and categories, but not the interval or commitment. To surface the terms there too, link the help page as a main page or add lines through the developer filter webmcp_canary_llms_txt_lines.",
          ],
        },
        {
          heading: "Prompts for checking AI answers",
          paragraphs: [
            "After publishing the table, ask ChatGPT, Perplexity and Google's AI Overviews questions like these. Changes can take time to show up, so repeat the same prompts every few weeks and log the answer and date.",
          ],
          list: [
            "\"Is there a minimum number of deliveries for (product) from (shop)?\"",
            "\"How much will (product) cost in total if I receive three deliveries?\"",
            "\"How and by when do I cancel the (shop) subscription?\"",
            "\"Which (category) subscriptions have no minimum commitment?\"",
          ],
          after: [
            "When an answer differs from your table, look at the page AI cited. Old campaign pages, comparison sites and reviews are frequent sources. Update or redirect your own old pages. Nurevo AEO's Pro plan measures appearances for prompts like these on Perplexity (ChatGPT when configured).",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "The terms table is text on the product page, not an image",
            "First and later prices are on the same line",
            "The commitment says \"none\" or a number of deliveries",
            "A total, or totals by number of deliveries, is given",
            "Skip, pause and cancellation deadlines count from the next shipping day",
            "The cancellation method, hours and fee are given",
            "Numbers match the checkout's final summary",
            "Numbers match your FAQ answers",
            "No old campaign page still shows different terms",
            "The table has a last-updated date that changes with the terms",
          ],
        },
      ],
      faqs: [
        { q: "Should the terms go on the product page or a separate page?", a: "Put the terms table on the product page and the skip and cancel steps on a linked help page. Keep the numbers and deadlines identical on both." },
        { q: "Can I headline \"first box free\"?", a: "You can, but put the later price and any commitment right next to it at the same size. Small subscription notices beside large trial offers are a commonly cited example of a misleading display." },
        { q: "Does a minimum commitment hurt my chances in AI answers?", a: "There is no evidence either way. Leaving it out, though, makes it more likely that AI says \"cancel any time\" or relies on complaints in reviews. Stating the commitment and total is safer." },
        { q: "Can structured data alone carry the terms?", a: "No. Google's product structured data has no property for a subscription's interval or commitment. The text table matters most; treat markup as a supplement." },
        { q: "What should I update when I change the WooCommerce Subscriptions settings?", a: "The terms table, the help page, the FAQ and the final summary, all on the same day, plus the table's last-updated date. llms.txt takes the price from WooCommerce." },
        { q: "Does Nurevo AEO output subscription terms automatically?", a: "No. It publishes the shop (OnlineStore), the return policy and an llms.txt product list with one price per product, and allows AI search crawlers. Write the interval and commitment in the text table and FAQ." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your shop",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO publishes your shop facts and product list for AI for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. WordPress is a trademark of the WordPress Foundation and WooCommerce of Automattic. Ranktracker, Texta, MarTechLab, Gibson Dunn, Jones Day and DWF are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by these companies.",
    },
  },
};
