// Content page (EC): how an online shop makes the size, colour and spec facts
// of each product readable by AI answers — the conditional questions shoppers
// ask ("does the M fit 170 cm", "is the 90 cm shelf available in white",
// "does this case fit model X"), writing specs and size charts as text with
// units and measuring method, one ID per variant, variant URLs, the
// ProductGroup JSON-LD, what WooCommerce core actually outputs for variable
// products, and how to test AI answers with variant-level prompts.
// Separate from online-shop-ai-search (shop-level facts: stock, returns),
// chatgpt-shopping-product-feed (feeds and the Japanese status of ChatGPT
// shopping), agency-ec-product-data-check (monthly page/feed/schema
// consistency audit for agencies) and images-video-ai-search (alt text).
//
// Written 2026-11-28 14時 (JST).
//
// Outside facts and where they were read (2026-11-28):
// - Google Search Central "Product variant structured data (ProductGroup,
//   Product)": ProductGroup with hasVariant / variesBy / productGroupID;
//   variesBy values color, size, suggestedAge, suggestedGender, material,
//   pattern; productGroupID or inProductGroupWithID on variants (must match);
//   single-page sites: variant preselected by query parameters, the
//   preselected variant shows the right image, price and availability and
//   can be added to cart; multi-page: each variant page carries full markup;
//   each variant needs a unique sku or gtin; markup in the initial HTML is
//   recommended (JS-generated markup may reduce crawl frequency/accuracy).
//   Announcement: Search Central blog 2024-02-20 (Search Console reports and
//   Rich Results Test validate variants).
// - OpenAI Commerce "Product feed schema" (file upload, stable view): nine
//   required basic fields (item_id, title, description, url, brand,
//   seller_name, image_url, availability, price) plus geo fields; item_id
//   unique per item or variant; group_id, listing_has_variations=true on every
//   variant row, variant_dict e.g. {"color":"Black","size":"10"}
//   (conditionally required for variants); gtin 8/12/13/14 digits with a
//   valid check digit; mpn: do not invent one to replace a missing GTIN;
//   color, size, material, gender, age_group optional; "use variant_dict when
//   size distinguishes variants"; dimensions object (at least two of
//   length/width/height + unit in/cm/ft/m/mm), weight + item_weight_unit.
// - WooCommerce source, tag 11.3.1, includes/class-wc-structured-data.php:
//   Product with sku (falls back to the post ID), gtin from
//   get_global_unique_id() when valid, mpn; variable product → AggregateOffer
//   lowPrice / highPrice / offerCount (Offer when all variations cost the
//   same); when every attribute_* query parameter is present and exactly one
//   variation matches → single Offer with the variation's price, sku, gtin,
//   mpn and inProductGroupWithID = parent SKU (or ID). Not in 10.9.0, present
//   in 11.0.0. No color / size / material / ProductGroup output in core.
//   includes/wc-template-functions.php: the variation dropdown preselects from
//   $_REQUEST['attribute_<name>']; wc_display_product_attributes() shows
//   weight, dimensions and visible attributes (the Additional information tab).
// - WooCommerce feature request "Use ProductGroup structured data for
//   variants instead of separate products" (Google Product Feed extension's
//   expanded markup lists variants as separate products): open, 2024-11-12.
// - Yoast developer docs, ProductGroup piece: output for products with
//   variations (WC_Product_Variable) by Yoast WooCommerce SEO; each offer
//   becomes a Product under hasVariant; productGroupID defaults to sku.
// Top articles read 2026-11-28: uravation apparel D2C (2026-10-18),
// stellagent AIO (2026-10-07, upd 11-08), jinrai EC AIO (2026-05-20, upd
// 11-27), 0120.co.jp aio-140 (2026-07-12, upd 10-20), ECのミカタ 49997
// (upd 2026-03-25), Salesforce JP AI readiness checklist (meta 2026-08-24,
// mod 11-17), Shopify JP ecommerce schema (2026-07-23); SEO.AI (2025-07-25),
// Search Engine Land (Morabito, no date), Semrush (2026-06-30), Backlinko
// (2026-03-05), Core dna (2026-09-04, upd 09-08), Practical Ecommerce
// (2026-09-20, mod 09-26). Yotpo and Google's merchant listing page failed.
// Not verified, so not stated: Google's merchant-listing guidance on
// size/SizeSpecification, the Merchant Center size_system values for Japan,
// Yoast's version numbers and price, which version first added the GTIN
// field, unsourced survey numbers in the top articles, any Japanese labelling
// law for online size charts.
//
// Nurevo facts (readme 0.9.x, plugin source): site type "Online shop" →
// OnlineStore with the product catalogue, prices/stock where known and the
// return policy; WooCommerce's Product and Offer are left to it (per-type
// coexistence); llms.txt "Products" lists up to 50 newest visible products at
// the parent level (name, URL, price, currency, in/out of stock, SKU,
// categories), not each variation; 0.9.1 coexists with SEO SIMPLE PACK and
// VK All in One Expansion Unit. Free 0円 / Standard 月3,000円 (USD 20) / Pro
// 月14,800円〜 (USD 99, Perplexity now, ChatGPT when configured).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleVariants: "https://developers.google.com/search/docs/appearance/structured-data/product-variants",
  googleBlog: "https://developers.google.com/search/blog/2024/02/product-variants",
  openaiFeed: "https://developers.openai.com/commerce/specs/file-upload/products",
  wcStructured: "https://github.com/woocommerce/woocommerce/blob/11.3.1/plugins/woocommerce/includes/class-wc-structured-data.php",
  wcTemplate: "https://github.com/woocommerce/woocommerce/blob/11.3.1/plugins/woocommerce/includes/wc-template-functions.php",
  wcRequest: "https://woocommerce.com/feature-request/use-productgroup-structured-data-for-variants-instead-of-separate-products/",
  yoastGroup: "https://developer.yoast.com/features/schema/pieces/productgroup/",
  uravation: "https://uravation.com/llmo/apparel-fashion-d2c-llmo-taisaku/",
  salesforce: "https://www.salesforce.com/jp/commerce/ai/ai-readiness-seo-checklist/",
  coredna: "https://www.coredna.com/blogs/product-feed-optimization-ai-shopping",
  practical: "https://www.practicalecommerce.com/test-your-products-for-ai-discovery",
  richResults: "https://search.google.com/test/rich-results",
};

const JSONLD_JA = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProductGroup",
  "name": "リネン混 オープンカラーシャツ",
  "description": "麻55%・綿45%。洗濯機で洗えるオープンカラーシャツ。",
  "url": "https://shop.example.jp/product/linen-shirt/",
  "brand": { "@type": "Brand", "name": "Example Works" },
  "productGroupID": "LS-100",
  "variesBy": ["https://schema.org/color", "https://schema.org/size"],
  "hasVariant": [
    {
      "@type": "Product",
      "name": "リネン混 オープンカラーシャツ ネイビー M",
      "sku": "LS-100-NV-M",
      "gtin13": "4900000000000",
      "color": "ネイビー",
      "size": "M",
      "material": "麻55%・綿45%",
      "image": "https://shop.example.jp/img/ls-100-nv.jpg",
      "offers": {
        "@type": "Offer",
        "url": "https://shop.example.jp/product/linen-shirt/?attribute_pa_color=navy&attribute_pa_size=m",
        "price": "8800",
        "priceCurrency": "JPY",
        "availability": "https://schema.org/InStock"
      }
    }
  ]
}
</script>
※ GTIN・URL・価格は書き方の例です。実際の値は自社の商品のものを入れ、
  ページに表示している内容と同じにしてください。バリエーションごとに1つずつ並べます。`;

const JSONLD_EN = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProductGroup",
  "name": "Linen-blend camp collar shirt",
  "description": "55% linen, 45% cotton. Machine washable camp collar shirt.",
  "url": "https://shop.example.com/product/linen-shirt/",
  "brand": { "@type": "Brand", "name": "Example Works" },
  "productGroupID": "LS-100",
  "variesBy": ["https://schema.org/color", "https://schema.org/size"],
  "hasVariant": [
    {
      "@type": "Product",
      "name": "Linen-blend camp collar shirt, Navy, M",
      "sku": "LS-100-NV-M",
      "gtin13": "4900000000000",
      "color": "Navy",
      "size": "M",
      "material": "55% linen, 45% cotton",
      "image": "https://shop.example.com/img/ls-100-nv.jpg",
      "offers": {
        "@type": "Offer",
        "url": "https://shop.example.com/product/linen-shirt/?attribute_pa_color=navy&attribute_pa_size=m",
        "price": "58.00",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      }
    }
  ]
}
</script>
* The GTIN, URL and price are placeholders. Use your own values, keep them
  identical to what the page shows, and add one entry per variant.`;

const SPEC_JA = `【仕様表の書き方の例（ページの本文に、文字の表で載せる）】
項目            書き方の例                         書くときの決まり
サイズ（実寸）  M：着丈72cm／身幅58cm／袖丈24cm    平置きで測った値。測り方を表の下に書く
サイズ（目安）  M：身長165〜175cm                   実寸と分けて書き、目安だと明記する
モデル          身長178cm・Lを着用                   着用したサイズと体格を両方書く
素材            麻55%・綿45%                         洗濯表示と同じ書き方にする
外寸と内寸      外寸 幅90×奥行30×高さ180cm          家具・収納は外寸と内寸を別の行に
重さ            3.2kg（本体のみ）                    何を含む重さかを書く
対応機種        iPhone 17・iPhone 17 Pro（型番まで）  「最新機種」などの言い方はしない
容量・内容量    50mL                                  単位を省かない
色の名前        ネイビー（紺）                        画像・選択肢・JSON-LDで同じ名前`;

const SPEC_EN = `[Spec table example: put it in the page body as a text table]
Field              Example                                  Rule
Size (garment)     M: length 72 cm, chest width 58 cm       Measured flat; say how, under the table
Size (fit guide)   M: height 165–175 cm                     Separate from garment measurements; label it a guide
Model              178 cm tall, wearing L                   Give both the size worn and the build
Material           55% linen, 45% cotton                    Same wording as the care label
Outer / inner      Outer W 90 x D 30 x H 180 cm             Furniture: outer and inner on separate rows
Weight             3.2 kg (unit only)                       Say what the weight includes
Compatible models  iPhone 17, iPhone 17 Pro (exact models)  Never "latest models"
Volume             50 mL                                    Always with the unit
Colour name        Navy                                     Same name in images, options and JSON-LD`;

export default {
  slug: "ec-product-variants-specs-ai-search",
  targetQueries: [
    "ECサイト 商品 サイズ 色 AI検索 対策",
    "ProductGroup 構造化データ バリエーション WooCommerce",
    "商品ページ 仕様表 LLMO 書き方",
    "product variants structured data AI search",
    "WooCommerce variable product schema ProductGroup",
    "how to make product specs readable for ChatGPT",
  ],
  related: ["online-shop-ai-search", "chatgpt-shopping-product-feed", "agency-ec-product-data-check", "images-video-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "商品のサイズ・色・仕様をAIに正しく読ませる手順（EC） | Nurevo",
      description: "「Mサイズは身長170cmで合う？」「白の在庫は？」とAIに聞かれたとき、答えの材料になる仕様表とバリエーションの書き方。ProductGroupの例、WooCommerceの現状と手順、確かめ方。",
      h1: "ECの商品のサイズ・色・仕様をAIに正しく読ませる手順：仕様表、バリエーション、WooCommerce",
      lead: "AIに商品を聞く人は「この棚の幅90cmで白はある？」「身長170cmならMとLのどちら？」のように、条件をつけて聞きます。答えの材料になるのは、ページの本文にある文字の仕様表（単位と測り方つき）と、色・サイズごとに別のID・URL・価格・在庫を持つバリエーションの情報です。本文、構造化データ（ProductGroup）、商品フィードの3か所で同じ値にそろえると、AIが取り違えにくくなります。WooCommerceの標準の構造化データは色・サイズを出さないため、本文の表とバリエーションのURLを先に整えるのが近道です。",
      intro: [
        "作成日：2026年11月28日（日本時間）。Google・OpenAIの公式の説明と、WooCommerce 11.3.1 のソースコードを同じ日に読んで確認しました。",
        "対象は、色・サイズ・容量などの違いがある商品を自社のネットショップで売っている方と、その制作・運用を担当する方です。ショップ全体の情報（返品・送料・在庫の出し方）は[ネットショップのAI検索対策](/guide/online-shop-ai-search)、ChatGPTの商品フィードの申し込みは[ChatGPTのショッピングに商品を出す方法](/guide/chatgpt-shopping-product-feed)にあります。ここでは、1つの商品ページの中の「サイズ・色・仕様」だけを扱います。",
      ],
      sections: [
        {
          heading: "上位の記事に書かれていなかったこと",
          paragraphs: [
            `「ECサイト AIO対策」「商品ページ LLMO」「product attributes ChatGPT」などで上位に出る日本語7本・英語6本を、2026年11月28日に読みました。アパレルのサイズ表を「実寸」と「選び方」に分ける考え方（[uravation](${SRC.uravation})）や、AIに条件つきの質問をして確かめる5つのテスト（[Practical Ecommerce](${SRC.practical})）はよくまとまっていました。一方で、次のことはどの記事にもありませんでした。`,
          ],
          list: [
            "アパレル以外（家具の外寸と内寸、対応機種、容量）の仕様をどう書くか",
            "ProductGroup（バリエーションをまとめる構造化データ）のコードの例。画像の中にしかない記事もありました",
            "WooCommerceが標準で何を出していて、何を出していないか",
            "WordPress（WooCommerce）の画面での具体的な手順",
            "色・サイズを指定した質問で、AIの答えを確かめる方法",
          ],
          after: ["以下では、この5つを埋めます。"],
        },
        {
          heading: "AIに聞かれる商品の質問は「条件つき」",
          paragraphs: [
            "「おすすめのシャツ」だけでなく、条件を足して聞かれるのが商品の質問の特徴です。AIはその条件に合う事実をページから探すので、条件にあたる値が文字で書かれていないと、答えの材料になりません。商品の種類ごとに、よくある条件と、ページに必要な事実を並べました。",
          ],
          table: {
            head: ["商品の種類", "条件つきの質問の例", "ページに文字で必要な事実"],
            rows: [
              ["服", "身長170cmでゆったり着たい。MとLのどちら？", "サイズごとの実寸、身長の目安、モデルの身長と着用サイズ、素材"],
              ["靴", "幅広の足で25.5cmはある？", "サイズの表記（cm）、足囲・幅の表記、在庫のあるサイズ"],
              ["家具・収納", "幅90cm以内で白の本棚は？", "外寸と内寸、色の名前、重さ、組み立ての有無"],
              ["スマホケース・部品", "iPhone 17に合うケースは？", "対応機種の型番の一覧、対応しない機種"],
              ["化粧品・食品", "詰め替えで300mL以上のものは？", "内容量と単位、詰め替えかどうか、成分や原材料"],
            ],
          },
          after: [
            "どの種類でも、条件に合うかどうかは「色・サイズごと」に変わります。白だけ在庫がない、Lだけ価格が高い、といった違いがあるなら、その違いがバリエーションごとに読める形になっている必要があります。",
          ],
        },
        {
          heading: "3か所で同じ値にそろえる：本文・構造化データ・商品フィード",
          paragraphs: [
            "商品の事実が置かれる場所は3つあります。AIの検索の仕組みによって読む場所が違うため、どれか1つだけでは足りません。3か所の値が食い違うと、どれが正しいか分からなくなります。",
          ],
          table: {
            head: ["場所", "中身", "主に読むもの"],
            rows: [
              ["ページの本文", "仕様表、サイズ表、色の名前、説明文", "ページを読みに来るAIの検索のクローラー、人"],
              ["構造化データ（JSON-LD）", "ProductGroup と、色・サイズごとの Product（SKU・GTIN・価格・在庫）", "Google の検索と、ページを読むAI"],
              ["商品フィード", "Merchant Center や OpenAI に送る商品の一覧", "Google のショッピング、ChatGPT のショッピング（申し込んだ場合）"],
            ],
          },
          after: [
            `Google は、色やサイズなどの違いを ProductGroup にまとめ、hasVariant に色・サイズごとの Product を並べる書き方を2024年2月20日に案内しました（[Google 検索セントラル ブログ](${SRC.googleBlog})）。variesBy に書ける違いは color・size・suggestedAge・suggestedGender・material・pattern で、色・サイズごとに別の SKU か GTIN が必要です（[商品バリエーションの構造化データ](${SRC.googleVariants})）。`,
            `OpenAI の商品フィードの仕様でも、item_id は「色・サイズごとに1つ」で、バリエーションには group_id、すべての行に listing_has_variations=true、違いを {"color":"Black","size":"10"} のように書く variant_dict が条件つきで必要です。寸法は長さ・幅・高さのうち2つ以上と単位、重さは単位つきで書けます。GTIN がないときに型番（mpn）を作って埋めないこと、とも書かれています（[OpenAI 商品フィードの仕様](${SRC.openaiFeed})）。`,
          ],
        },
        {
          heading: "仕様表とサイズ表の書き方",
          paragraphs: [
            "仕様表は、画像ではなく文字の表でページの本文に載せます。画像の中の数字は、AIのクローラーが読めるとは限りません。次の例と決まりを使ってください。",
          ],
          code: SPEC_JA,
          after: [
            "大事なのは、実寸と目安を分けることです。「Mは身長165〜175cmの目安」は店の考えで、「Mの身幅58cm」は測った事実です。AIの答えは一文だけ抜き出されることがあるので、目安には「目安」と書いておくと、事実として言い切られにくくなります。",
            "測り方（平置き・ヌード寸法・外寸か内寸か）は、表の下に1行で書きます。同じ「幅」でも測り方が違えば別の数字になり、比べられません。色の名前は、商品画像の説明・選択肢・構造化データで同じ言葉を使います。選択肢が「紺」で構造化データが「ネイビー」だと、同じ色だと分からないことがあります。",
          ],
        },
        {
          heading: "バリエーションの書き方：ID・URL・価格・在庫",
          paragraphs: [
            "色・サイズごとに、次の4つを持たせます。",
          ],
          list: [
            "別の SKU（できればJANコードなどの GTIN も）。親の商品と同じ値を使い回さない",
            "そのバリエーションを選んだ状態で開くURL。Google は、1ページで色・サイズを切り替える作りなら、URLのクエリ（?color=… など）でバリエーションを選んだ状態にでき、その状態で正しい画像・価格・在庫が表示され、カートに入れられることを求めています",
            "バリエーションごとの価格と在庫。「白のMだけ在庫切れ」が読める状態にする",
            "色・サイズの名前。本文・選択肢・構造化データ・フィードで同じ",
          ],
          after: [
            `URLのクエリについては、[Salesforce のチェックリスト](${SRC.salesforce})のように「?color=blue のようなURLは避ける」とする記事もあります。これはクエリで重複ページが増えるのを避ける助言で、Google の説明は、1ページの作りでは代表のURLを1つにしたうえで、クエリでバリエーションを選べるようにする、というものです。正規のURL（canonical）は親の商品ページに向け、クエリつきのURLはフィードや構造化データの offers.url に使う、と分けると両立します。`,
            "Google は、構造化データを最初に返すHTMLに入れることを勧め、JavaScriptで後から作る場合はショッピングのクロールの頻度や正確さが下がることがあるとしています。色を選ぶと価格が変わる作りでも、各バリエーションの値は最初のHTMLに入れておきます。",
          ],
        },
        {
          heading: "構造化データの例（ProductGroup）",
          paragraphs: [
            "Google の例にならった、シャツの ProductGroup の書き方です。hasVariant の中に、色・サイズごとの Product を1つずつ並べます。",
          ],
          code: JSONLD_JA,
          after: [
            `書いたら、[リッチリザルト テスト](${SRC.richResults})で、商品のバリエーションとしてエラーなく読めるかを確かめます。Search Console の「商品スニペット」「販売者のリスティング」のレポートでも、バリエーションの検証結果が見られます。構造化データがあればAIの回答に出る、というものではありません。本文の表と同じ値を、機械が取り違えない形でも置いておく、という位置づけです。`,
          ],
        },
        {
          heading: "WooCommerceの現状：標準で出るもの、出ないもの",
          paragraphs: [
            `WooCommerce 11.3.1 のソースコード（[class-wc-structured-data.php](${SRC.wcStructured})）を読むと、色・サイズがある「バリエーション商品」の標準の構造化データは次のとおりです。`,
          ],
          table: {
            head: ["URL", "WooCommerceが出すもの", "出さないもの"],
            rows: [
              ["商品ページ（クエリなし）", "Product と、価格の幅（AggregateOffer：最安・最高・バリエーションの数）。全バリエーションが同じ価格なら Offer", "色・サイズごとの価格と在庫、color・size・material、ProductGroup"],
              ["すべての属性をクエリで指定したURL（例：?attribute_pa_color=navy&attribute_pa_size=m）", "そのバリエーションの価格の Offer、そのバリエーションの SKU・GTIN・型番、親のSKUを指す inProductGroupWithID", "color・size・material、ProductGroup"],
            ],
            caption: "WooCommerce 11.0.0 から、クエリで1つのバリエーションに決まるURLでは、そのバリエーションの価格を出すようになりました（10.9.0 にはありません）。1つに決まらないとき（「すべて」を含むバリエーションと重なるときなど）は、価格の幅のままです。",
          },
          after: [
            `同じ ?attribute_… のクエリで、商品ページの選択欄もそのバリエーションが選ばれた状態で開きます（[wc-template-functions.php](${SRC.wcTemplate})）。つまり WooCommerce 11 以降なら、フィードや構造化データに書くバリエーションのURLは、このクエリの形を使えば価格が合います。`,
            `色・サイズを構造化データに出すには、標準の機能では足りません。Yoast の開発者向けの説明では、有料の Yoast WooCommerce SEO がバリエーション商品に ProductGroup を出し、各バリエーションを hasVariant に並べます（[Yoast ProductGroup](${SRC.yoastGroup})）。WooCommerce の Google 向けフィードの拡張機能について「バリエーションが別々の商品として出る。ProductGroup にしてほしい」という要望が2024年11月12日から出ていて、受付中のままです（[機能の要望](${SRC.wcRequest})）。プラグインを足す前に、すでに入っているプラグインが Product を出していないかを確かめ、同じ商品の Product が2つ出ないようにしてください。`,
          ],
        },
        {
          heading: "WordPress（WooCommerce）での手順",
          list: [
            "「商品 → 属性」で、色・サイズを共通の属性として作る（商品ごとの独自の属性にしない）。名前はお客様が使う言葉（「ネイビー」など）にする",
            "商品の「属性」タブで、使う属性の「商品ページで表示」に印をつけ、「バリエーションとして使用」にも印をつける。表示にした属性は「追加情報」タブに文字で出る",
            "「配送」タブで重さと寸法（長さ・幅・高さ）を入れる。これも「追加情報」タブに出る",
            "「バリエーション」タブで、色・サイズごとに SKU、GTIN（JANコード）、価格、在庫を入れる。説明欄に、そのバリエーションだけの違い（「Lのみ着丈が長い」など）を書く",
            "商品の説明に、サイズ表・仕様表を文字の表で入れる（ブロックエディタの「表」ブロック）。測り方を表の下に1行で書く",
            "バリエーションのURLを「?attribute_pa_color=navy&attribute_pa_size=m」の形で開き、選択欄・画像・価格・在庫がそのバリエーションになることを確かめる",
            `[Nurevo AEO（無料）](${WP_ORG})を入れ、サイトの種類を「ネットショップ」にする。店の情報を OnlineStore として出し、商品の Product・Offer は WooCommerce 側に任せて重ねません。llms.txt には、新しい順に最大50件の商品を、名前・URL・価格・在庫・SKU・カテゴリで載せます（親の商品の単位で、色・サイズごとではありません）。Yoast SEO・Rank Math・SEO SIMPLE PACK・VK All in One Expansion Unit と併用できます（0.9.1 以降）`,
          ],
          code: "curl -s 'https://shop.example.jp/product/linen-shirt/?attribute_pa_color=navy&attribute_pa_size=m' \\\n  | grep -o '\"sku\":\"[^\"]*\"'",
          after: [
            "ターミナルが使えるなら、上のコマンドのように、クエリつきのURLで構造化データの SKU がバリエーションのものに変わるかを確かめられます（ドメインと商品のURLは自分の店のものに変えてください）。",
          ],
        },
        {
          heading: "AIの答えを確かめる：色・サイズを指定して聞く",
          paragraphs: [
            "店名や商品名だけで聞くと、条件の事実が読めているかは分かりません。お客様が実際に聞きそうな、条件つきの質問で確かめます。",
          ],
          list: [
            "主な商品ごとに、条件つきの質問を3つ作る（例：「幅90cm以内の白い本棚」「身長170cmでゆったり着られるリネンシャツ」「iPhone 17に合う手帳型ケース」）",
            "ChatGPT・Perplexity・GoogleのAIモードで聞き、回答・出典のURL・出てきた数値を表に記録する",
            "数値（寸法・価格・在庫・対応機種）がページと合っているか、別の色やサイズの値と取り違えていないかを見る",
            "直したら、2〜4週間後に同じ質問で記録を取り直す",
          ],
          after: [
            "AIの回答は、日や聞き方、使う人の地域で変わります。1回の結果で判断せず、同じ質問を何回か聞いて記録してください。Nurevo の無料のAIチェックは月1回、Perplexity に3つの質問をします。Pro（月14,800円〜、ベータ版）は現在 Perplexity で登場率を計測し、ChatGPT は設定され次第対象になります。Standard は月3,000円です。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "仕様表・サイズ表が、画像ではなく文字の表で本文にある",
            "サイズの実寸と目安が分かれ、目安には「目安」と書いてある",
            "測り方（平置き・外寸／内寸など）が表の下に書いてある",
            "対応機種は型番で書き、「最新機種」などの言い方をしていない",
            "色の名前が、選択肢・画像の説明・構造化データ・フィードで同じ",
            "色・サイズごとに別の SKU（できれば GTIN）がある",
            "クエリつきのURLで、そのバリエーションの画像・価格・在庫が表示される",
            "構造化データの価格・在庫が、表示と同じ（リッチリザルト テストで確認）",
            "同じ商品の Product が、複数のプラグインから重ねて出ていない",
            "条件つきの質問を3つ決め、AIの回答を記録している",
          ],
        },
      ],
      faqs: [
        { q: "サイズ表を画像で載せているのはだめですか？", a: "画像は人には分かりやすいので残してかまいません。ただし、同じ内容を文字の表でも本文に載せてください。画像の中の数字は、AIの検索のクローラーが読めるとは限りません。" },
        { q: "ProductGroup を入れればAIに出ますか？", a: "構造化データはAIの回答に出ることを約束するものではありません。本文の事実を、機械が取り違えない形でも置いておくためのものです。まず本文の仕様表とバリエーションごとの価格・在庫を整えてください。" },
        { q: "WooCommerce だけで ProductGroup は出せますか？", a: "WooCommerce 11.3.1 の標準の構造化データは ProductGroup と色・サイズを出しません。出すには、Yoast WooCommerce SEO のように ProductGroup に対応したプラグインを使います。その場合、ほかのプラグインと Product が重ならないかを確かめてください。" },
        { q: "色ごとにページを分けたほうがよいですか？", a: "Google は、1ページで切り替える作りと、色・サイズごとにページを分ける作りの両方の書き方を案内しています。どちらでもよく、大事なのは、色・サイズごとに別のIDと、選んだ状態で開くURL、正しい価格と在庫があることです。" },
        { q: "JANコードがない商品はどうすればよいですか？", a: "GTIN は任意です。自社の SKU を色・サイズごとに付ければ区別できます。OpenAI の仕様では、GTIN がないときに型番を作って埋めないよう書かれています。" },
        { q: "身長の目安を書くと、AIが「必ず合う」と言いませんか？", a: "言い切られる可能性はあります。目安は実寸と別の行に「目安」と書き、実寸と測り方も並べておくと、根拠のある数字が一緒に読まれやすくなります。" },
        { q: "Nurevo AEO はバリエーションの構造化データを出しますか？", a: "出しません。商品の Product と Offer は WooCommerce 側の出力に任せ、重ねません。Nurevo は店の情報（OnlineStore）、返品ポリシー、llms.txt の商品一覧（最大50件、親の商品の単位）を出し、AI検索のクローラーを許可します。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、あなたのショップがAIにどう読まれているか確かめる",
        body: "無料チェックでは、構造化データ・llms.txt・AIクローラーの許可の状態が、登録なしで分かります。WooCommerce なら、Nurevo AEO で店の情報と商品の一覧を、商品の構造化データと重ねずに無料で出せます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "WordPress.orgで無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAIの、PerplexityはPerplexity AIの、Google・Merchant Center・Search ConsoleはGoogle LLCの商標です。iPhoneはApple Inc.の商標です。WordPressはWordPress Foundation、WooCommerceはAutomatticの商標です。Yoast SEO、Rank Math、SEO SIMPLE PACK、VK All in One Expansion Unit、Salesforceは、それぞれの権利者の商標です。Nurevoはこれらの企業と提携・承認の関係にありません。",
    },
    en: {
      title: "Make Product Sizes, Colours and Specs Readable by AI | Nurevo",
      description: "How to write spec tables and colour and size variants so AI answers get them right: shopper questions, ProductGroup markup, what WooCommerce outputs, how to test.",
      h1: "Make product sizes, colours and specs readable by AI: spec tables, variants and WooCommerce",
      lead: "People who ask an AI about products add conditions: \"is this 90 cm shelf available in white?\", \"I'm 170 cm, should I get the M or the L?\". What an AI can use to answer is a text spec table in the page body, with units and the measuring method, and variant data that gives each colour and size its own ID, URL, price and stock. Keep the same values in three places, the page body, the structured data (ProductGroup) and your product feed, and AI answers are less likely to mix them up. WooCommerce's built-in structured data does not output colour or size, so the fastest wins are the text tables and the variant URLs.",
      intro: [
        "Written November 28, 2026 (JST). Google's and OpenAI's documentation and the WooCommerce 11.3.1 source code were read on the same day.",
        "This guide is for people who sell products in several colours, sizes or volumes on their own online shop, and for the agencies that build and run those shops. Shop-wide facts (returns, shipping, stock) are in [AI search for online shops](/guide/online-shop-ai-search), and applying for ChatGPT shopping feeds is in [how products get into ChatGPT shopping](/guide/chatgpt-shopping-product-feed). This page is only about the sizes, colours and specs inside one product page.",
      ],
      sections: [
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            `On November 28, 2026 we read seven Japanese and six English articles that rank for queries such as "ecommerce AI search", "product page LLMO" and "product attributes ChatGPT". Some are strong: [Uravation](${SRC.uravation}) separates garment measurements from fit advice, [Practical Ecommerce](${SRC.practical}) gives five tests that put conditional questions to an AI, and [Core dna](${SRC.coredna}) explains why product identity and variants come before any optimisation. None of them covered the following.`,
          ],
          list: [
            "How to write specs outside fashion: outer and inner dimensions for furniture, compatible models, volumes",
            "A ProductGroup code example in text (one article shows its code only as images)",
            "What WooCommerce outputs by default, and what it does not",
            "Step-by-step WordPress and WooCommerce screens",
            "How to check AI answers with questions that name a colour or size",
          ],
          after: ["The sections below fill those five gaps."],
        },
        {
          heading: "Product questions come with conditions",
          paragraphs: [
            "Shoppers rarely stop at \"a good linen shirt\". They add a condition, and the AI looks for a fact on the page that meets it. If that fact is not written as text, it cannot be part of the answer. Here are typical conditions by product type and the facts each one needs.",
          ],
          table: {
            head: ["Product type", "Conditional question", "Facts the page needs in text"],
            rows: [
              ["Clothing", "I'm 170 cm and want a relaxed fit. M or L?", "Garment measurements per size, a height guide, the model's height and size worn, material"],
              ["Shoes", "Do you have a wide fit in UK 8?", "Size labels in the system you sell in, width, which sizes are in stock"],
              ["Furniture and storage", "A white bookcase under 90 cm wide?", "Outer and inner dimensions, colour name, weight, whether assembly is needed"],
              ["Phone cases and parts", "Which case fits the iPhone 17?", "The exact compatible models, and the ones it does not fit"],
              ["Cosmetics and food", "A refill pack of at least 300 mL?", "Volume with the unit, whether it is a refill, ingredients"],
            ],
          },
          after: [
            "In every case, the answer can change with the colour or size. If only the white is out of stock, or the L costs more, each variant has to carry that difference in a readable form.",
          ],
        },
        {
          heading: "Keep the same values in three places: page, structured data, feed",
          paragraphs: [
            "Product facts live in three places. Different AI search systems read different ones, so one is not enough, and when the three disagree nobody can tell which is right.",
          ],
          table: {
            head: ["Place", "What it holds", "Main readers"],
            rows: [
              ["Page body", "Spec table, size chart, colour names, description", "AI search crawlers that read pages, and people"],
              ["Structured data (JSON-LD)", "ProductGroup and one Product per colour or size (SKU, GTIN, price, stock)", "Google Search and AI systems that read the page"],
              ["Product feed", "The product list sent to Merchant Center or OpenAI", "Google Shopping, and ChatGPT shopping if you applied"],
            ],
          },
          after: [
            `On February 20, 2024 Google announced support for grouping variants in a ProductGroup, with one Product per variant under hasVariant ([Search Central blog](${SRC.googleBlog})). variesBy can list color, size, suggestedAge, suggestedGender, material and pattern, and each variant needs its own sku or gtin ([product variant structured data](${SRC.googleVariants})).`,
            `OpenAI's product feed spec says the same thing in feed form: item_id is unique per item or variant, and variants conditionally need group_id, listing_has_variations=true on every variant row, and a variant_dict such as {"color":"Black","size":"10"}. Dimensions take at least two of length, width and height plus a unit, and weight takes a unit. It also says not to invent an MPN to replace a missing GTIN ([OpenAI product feed spec](${SRC.openaiFeed})).`,
          ],
        },
        {
          heading: "How to write the spec table and size chart",
          paragraphs: [
            "Put the spec table in the page body as a text table, not an image. AI crawlers cannot be relied on to read numbers inside a picture. Use this example and its rules.",
          ],
          code: SPEC_EN,
          after: [
            "The key is to keep measurements and guidance apart. \"M fits 165–175 cm\" is your advice; \"M is 58 cm across the chest\" is a measured fact. AI answers sometimes lift a single sentence, so label guidance as a guide and it is less likely to be repeated as a promise.",
            "State the measuring method (laid flat, body measurements, outer or inner) in one line under the table. The same word \"width\" gives different numbers under different methods, and they cannot be compared. Use the same colour name in image descriptions, the option selector and the structured data. If the selector says \"Dark blue\" and the markup says \"Navy\", a machine may not know they are the same colour.",
          ],
        },
        {
          heading: "Variants: ID, URL, price and stock",
          paragraphs: [
            "Give every colour and size these four things.",
          ],
          list: [
            "Its own SKU, and a GTIN (UPC, EAN, JAN) where you have one. Never reuse the parent's value",
            "A URL that opens with that variant selected. For single-page variant pickers, Google expects query parameters (such as ?color=…) to preselect a variant, and the preselected variant must show the right image, price and availability and be addable to the cart",
            "Its own price and stock, so that \"white in M is sold out\" is readable",
            "Colour and size names that match across page, selector, markup and feed",
          ],
          after: [
            `Some checklists, such as [Salesforce's](${SRC.salesforce}), advise avoiding URLs like ?color=blue. That advice is about duplicate pages. Google's guidance for single-page variants is to keep one canonical URL and let query parameters select the variant. Point the canonical at the parent product page and use the query URLs in the feed and in offers.url, and both are satisfied.`,
            "Google recommends putting product markup in the initial HTML, and says markup generated with JavaScript may make Shopping crawls less frequent and less reliable. Even when picking a colour changes the price on screen, include every variant's values in the first HTML response.",
          ],
        },
        {
          heading: "Structured data example (ProductGroup)",
          paragraphs: [
            "Here is a shirt marked up after Google's example. Add one Product per colour and size inside hasVariant.",
          ],
          code: JSONLD_EN,
          after: [
            `Check it in the [Rich Results Test](${SRC.richResults}) to confirm the variants parse without errors. Search Console's Product snippets and Merchant listings reports also show variant validation. Structured data does not make an AI mention a product. It puts the same facts as your text table into a form machines cannot misread.`,
          ],
        },
        {
          heading: "What WooCommerce outputs today",
          paragraphs: [
            `Reading the WooCommerce 11.3.1 source ([class-wc-structured-data.php](${SRC.wcStructured})), the built-in structured data for a variable product is as follows.`,
          ],
          table: {
            head: ["URL", "What WooCommerce outputs", "What it does not output"],
            rows: [
              ["Product page, no query", "Product with a price range (AggregateOffer: lowest, highest, number of variations), or an Offer if every variation costs the same", "Per-variant price and stock, color, size, material, ProductGroup"],
              ["URL with every attribute in the query (e.g. ?attribute_pa_color=navy&attribute_pa_size=m)", "An Offer at that variation's price, the variation's SKU, GTIN and MPN, and inProductGroupWithID pointing at the parent SKU", "color, size, material, ProductGroup"],
            ],
            caption: "Since WooCommerce 11.0.0, a URL whose query identifies exactly one variation gets that variation's price (10.9.0 does not do this). If the query matches more than one variation, for example because of an \"Any\" variation, the price range stays.",
          },
          after: [
            `The same ?attribute_… query also preselects the variation in the product page's dropdowns ([wc-template-functions.php](${SRC.wcTemplate})). So on WooCommerce 11 or later, variant URLs in this form give matching prices in your feed and markup.`,
            `To get colour and size into the markup you need more than core. Yoast's developer docs say the paid Yoast WooCommerce SEO outputs a ProductGroup for variable products and lists each variation under hasVariant ([Yoast ProductGroup](${SRC.yoastGroup})). A feature request asking WooCommerce's Google feed extension to use ProductGroup instead of separate products has been open since November 12, 2024 ([feature request](${SRC.wcRequest})). Before adding a plugin, check what already outputs Product so the same product is not marked up twice.`,
          ],
        },
        {
          heading: "WordPress (WooCommerce) steps",
          list: [
            "Under Products → Attributes, create colour and size as global attributes rather than custom per-product ones, named the way customers say them",
            "On the product's Attributes tab, tick \"Visible on the product page\" and \"Used for variations\". Visible attributes appear as text on the Additional information tab",
            "On the Shipping tab, enter weight and dimensions (length, width, height). These also appear on the Additional information tab",
            "On the Variations tab, give each colour and size its own SKU, GTIN, price and stock, and use the description to note what differs (\"L has a longer body\")",
            "Add the size chart and spec table to the description as a text table (the Table block), with the measuring method under it",
            "Open a variant URL such as ?attribute_pa_color=navy&attribute_pa_size=m and confirm the selector, image, price and stock all switch to that variant",
            `Install [Nurevo AEO (free)](${WP_ORG}) and set the site type to Online shop. It publishes the shop as an OnlineStore and leaves WooCommerce's Product and Offer alone, so nothing is duplicated. Its llms.txt lists up to 50 of the newest products with name, URL, price, stock, SKU and categories, at the parent level, not per variant. It works alongside Yoast SEO, Rank Math, SEO SIMPLE PACK and VK All in One Expansion Unit (0.9.1 and later)`,
          ],
          code: "curl -s 'https://shop.example.com/product/linen-shirt/?attribute_pa_color=navy&attribute_pa_size=m' \\\n  | grep -o '\"sku\":\"[^\"]*\"'",
          after: [
            "From a terminal, the command above shows whether the SKU in the markup switches to the variant's own on a query URL (swap in your own domain and product URL).",
          ],
        },
        {
          heading: "Check AI answers by naming a colour or size",
          paragraphs: [
            "Asking with your shop or product name does not tell you whether the conditional facts are being read. Test with the kind of question a customer would actually ask.",
          ],
          list: [
            "For each main product, write three conditional questions (\"a white bookcase under 90 cm wide\", \"a relaxed linen shirt for someone 170 cm tall\", \"a folio case that fits the iPhone 17\")",
            "Ask ChatGPT, Perplexity and Google AI Mode, and record the answer, the cited URLs and any numbers in a table",
            "Check that dimensions, prices, stock and compatible models match the page, and that no value from another colour or size has crept in",
            "After fixing, ask the same questions again two to four weeks later and record the results",
          ],
          after: [
            "AI answers change by day, wording and location, so do not judge from a single run. Ask the same question several times and keep the record. Nurevo's free AI check asks Perplexity three questions once a month. Pro (from $99/month, beta) measures how often you appear, on Perplexity today, with ChatGPT added once it is configured. Standard is $20/month.",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "The spec table and size chart are text tables in the body, not only images",
            "Measurements and fit guidance are separate, and guidance is labelled as a guide",
            "The measuring method (laid flat, outer or inner) is stated under the table",
            "Compatible models are listed by exact model, never \"latest models\"",
            "Colour names match across selector, image descriptions, markup and feed",
            "Each colour and size has its own SKU, and a GTIN where available",
            "A query URL shows that variant's image, price and stock",
            "Price and stock in the markup match the page (checked in the Rich Results Test)",
            "No two plugins output a Product for the same product",
            "Three conditional questions are written down and AI answers are recorded",
          ],
        },
      ],
      faqs: [
        { q: "Is a size chart image enough?", a: "Keep the image for people, but put the same values in a text table in the body too. AI search crawlers cannot be relied on to read numbers inside an image." },
        { q: "Will adding ProductGroup get my products into AI answers?", a: "No markup guarantees that. Structured data puts the facts from your page into a form machines cannot misread. Fix the text spec table and per-variant price and stock first." },
        { q: "Can WooCommerce output ProductGroup on its own?", a: "Not in WooCommerce 11.3.1: the built-in markup outputs neither ProductGroup nor colour or size. You need a plugin that supports ProductGroup, such as Yoast WooCommerce SEO, and should check that no other plugin outputs a second Product." },
        { q: "Should each colour have its own page?", a: "Google documents both single-page and multi-page variant setups. Either works. What matters is that every colour and size has its own ID, a URL that opens with it selected, and the right price and stock." },
        { q: "What if a product has no GTIN?", a: "GTIN is optional. A distinct SKU for each colour and size is enough to tell them apart. OpenAI's spec says not to invent an MPN to fill a missing GTIN." },
        { q: "If I give a height guide, will AI say the size is guaranteed to fit?", a: "It might. Put the guide on its own line, label it as a guide, and list the garment measurements and measuring method next to it so the measured numbers are read too." },
        { q: "Does Nurevo AEO output variant structured data?", a: "No. It leaves Product and Offer to WooCommerce and does not duplicate them. Nurevo publishes the shop (OnlineStore), the return policy and an llms.txt product list (up to 50, at the parent level), and allows AI search crawlers." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your shop",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WooCommerce, Nurevo AEO publishes your shop facts and product list for free without duplicating product markup.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google, Merchant Center and Search Console of Google LLC. iPhone is a trademark of Apple Inc. WordPress is a trademark of the WordPress Foundation and WooCommerce of Automattic. Yoast SEO, Rank Math, SEO SIMPLE PACK, VK All in One Expansion Unit, Salesforce, Uravation, Practical Ecommerce and Core dna are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by these companies.",
    },
  },
};
