// Content page: how to write a pricing page (料金ページ / price list) so AI
// search reads the right price: what goes on one price line, conditional and
// "from" prices, discounts and comparison prices, price changes and old
// prices, HTML that crawlers can read, Offer / PriceSpecification markup, and
// WordPress steps with Nurevo AIO. For every business type (local services,
// shops, B2B); the B2B field list itself lives in b2b-saas-ai-search.
//
// Written 2026-11-20 (JST). Product facts come from the plugin (0.9.2):
// - nurevo-webmcp.php: services (max 20) with name, minutes, price, currency,
//   category, booking URL, description, URL, "software" flag.
//   webmcp_canary_service_schema_nodes(): Service (or SoftwareApplication)
//   with offers {Offer, price, priceCurrency} only - no tax flag, no
//   priceSpecification. The price field is stored as typed
//   (sanitize_text_field), so "5,500円〜" would be published as is -> enter
//   digits only. Duration is additionalProperty PropertyValue (MIN).
//   Published on the page set in "サービスを掲載するページID（0 = フロントページ）".
//   llms.txt line: "- [name](url) — description · N min · JPY 5500 · category".
// - includes/site-types.php: for site type B2B, "料金ページ（BtoB）" URL becomes
//   "- Pricing: <url>" under "## Key facts" in llms.txt; priceRange is dropped
//   from a non-local site's business node.
// - readme.txt 0.6.x changelog: a commerce plugin's Product and Offer are left
//   to it (WooCommerce).
// - Free AI check: 3 unbranded questions a month on Perplexity; Pro (beta,
//   月14,800円〜 / USD 99) up to 20 questions on Perplexity (ChatGPT once set up).
//
// Outside facts and where they were read (2026-11-20):
// - schema-dts 2.1.0 (installed locally; carries schema.org's descriptions):
//   price = Number | Text, usage guidelines: use priceCurrency (ISO 4217)
//   instead of symbols, '.' for decimals, no separators, digits 0-9;
//   PriceSpecification: minPrice, maxPrice, valueAddedTaxIncluded (Boolean),
//   validFrom, validThrough, eligibleQuantity; UnitPriceSpecification:
//   billingDuration, billingIncrement, referenceQuantity, unitCode, priceType
//   (ListPrice, SalePrice, StrikethroughPrice ...), priceComponentType
//   (ActivationFee, Subscription, Installment ...); Offer: priceSpecification,
//   priceValidUntil, eligibleRegion; LocalBusiness priceRange e.g. "$$$".
//   schema.org itself could not be fetched this run.
// - NTA tax answer 6902 (as checked 2026-11-01 for hair-salon-ai-search, not
//   re-fetched): prices shown to consumers in advance must include
//   consumption tax, on any medium (e.g. "11,000円（税込）").
// - Consumer Affairs Agency, 二重価格表示 page (read 2026-11-20, no date on the
//   page): comparison prices; a past price that is not "最近相当期間にわたって
//   販売されていた価格" may mislead unless the period is stated accurately;
//   unfounded future prices, non-existent 希望小売価格. The numeric yardsticks
//   in the guideline PDF could NOT be read -> not stated.
// - Google "AI features and your website" (read 2026-11-18 for
//   google-ai-overviews-citations): no special schema needed; structured data
//   must match visible text. Google's product snippet / merchant listing docs
//   could NOT be read this run -> rich result requirements not stated.
// - Profound (Kyle Poyar & Nikolas Laskaris, 2026-09-03, vendor research):
//   ~7,600 responses to pricing prompts about the Cloud 100 on six engines;
//   company pricing page cited somewhere in 46%, first in 12%; 57 of 77 public
//   pricing pages AI-readable.
// - Top articles read 2026-11-20: Uravation 料金ページのAI検索設計 (2026-07-25,
//   updated 2026-09-05), ステラジェント AI検索ドック 費用相場 (2026-11-08, vendor
//   prices - off topic), 0120.co.jp AIO (service page) / Trakkr (2026-05-11),
//   Profound (2026-09-03), Single Grain (2025-12-09), eSEOspace (reviewed
//   2026-11-16), Texta (undated), GenOptima (2026-06-23), PeerPush (2026-06-29).
//   funnel-ai.jp redirected to another host and was not read.
// Not stated on purpose: "x% more citations" figures, how fast each AI picks
// up a new price, Google rich-result eligibility for services, the CAA
// guideline's week counts.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const PARTNER = "https://nurevo.jp/partner/";
const SRC = {
  ntaTotal: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6902.htm",
  caaDouble: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/representation_regulation/double_price",
  aiFeaturesJa: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja",
  aiFeatures: "https://developers.google.com/search/docs/appearance/ai-features",
  schemaPrice: "https://schema.org/price",
  schemaPriceSpec: "https://schema.org/PriceSpecification",
  schemaUnitPrice: "https://schema.org/UnitPriceSpecification",
  validator: "https://validator.schema.org/",
  profound: "https://www.tryprofound.com/blog/what-ai-agents-really-think-about-your-pricing",
  uravation: "https://uravation.com/llmo/ryokin-page-ai-search-design/",
  trakkr: "https://trakkr.ai/article/pricing-pages-for-chatgpt",
  singlegrain: "https://www.singlegrain.com/artificial-intelligence/how-ai-agents-evaluate-saas-pricing-pages/",
  eseospace: "https://eseospace.com/blog/structure-pricing-pages-for-ai/",
  texta: "https://www.texta.ai/blog/ai-search-pricing-accuracy",
  genoptima: "https://www.gen-optima.com/blog/pricing-page-ai-search-skips-you/",
  peerpush: "https://peerpush.com/blog/ai-assistants-pricing-page",
};

const JSONLD_JA = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "カット（シャンプー・ブロー込み）",
  "provider": { "@id": "https://example.jp/#business" },
  "offers": {
    "@type": "Offer",
    "price": 5500,
    "priceCurrency": "JPY",
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "price": 5500,
      "priceCurrency": "JPY",
      "valueAddedTaxIncluded": true,
      "unitText": "1回",
      "validFrom": "2026-12-01"
    }
  }
}
</script>
<!-- 金額は数字だけ（カンマ・円・〜を入れない）。本文の「5,500円（税込）」と同じ値にする -->`;

const JSONLD_EN = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Haircut (wash and blow-dry included)",
  "provider": { "@id": "https://example.com/#business" },
  "offers": {
    "@type": "Offer",
    "price": 55.00,
    "priceCurrency": "USD",
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "price": 55.00,
      "priceCurrency": "USD",
      "valueAddedTaxIncluded": true,
      "unitText": "per visit",
      "validFrom": "2026-12-01"
    }
  }
}
</script>
<!-- Digits only (no commas, currency symbols or "from"). Use the same value as the "$55 including tax" shown on the page -->`;

const CURL = `curl -s https://example.jp/price/ | grep -E "円|税込|税抜"
# 何も出なければ、料金は画像・PDF・JavaScript の中にあり、HTMLの本文にはありません`;
const CURL_EN = `curl -s https://example.com/pricing/ | grep -iE '\\$[0-9]|per month|including tax'
# If nothing prints, the prices live in an image, a PDF or JavaScript - not in the HTML`;

const FOOT_JA = "Google、Google 検索はGoogle LLC、ChatGPTはOpenAI、PerplexityはPerplexity AIの商標です。WordPress、WooCommerce、Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、ならびに本文で紹介した各社の名称は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。";
const FOOT_EN = "Google and Google Search are trademarks of Google LLC, ChatGPT of OpenAI and Perplexity of Perplexity AI. WordPress, WooCommerce, Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit and the names of the companies cited in this guide are trademarks or registered trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.";

export default {
  slug: "pricing-page-ai-search",
  targetQueries: [
    "how to write a pricing page for AI search",
    "AI search shows wrong price",
    "pricing page schema Offer priceSpecification",
    "料金ページ AI検索 書き方",
    "AI 料金 間違える 古い料金",
    "料金表 構造化データ 税込",
  ],
  related: ["b2b-saas-ai-search", "faq-page-ai-search", "online-shop-ai-search", "local-business-schema-seo-plugins", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "料金ページをAIに正しく読ませる書き方：税込・条件・改定 | Nurevo",
      description: "AIが古い料金や違う金額を答える原因と直し方。1行に書く6つの要素、決まった料金がないときの書き方、割引と改定、構造化データ、WordPressの手順と確かめ方。",
      h1: "料金ページをAIに正しく読ませる書き方：税込表示・条件つきの料金・改定のときの手順",
      lead: "AIに料金を正しく答えてもらうには、料金を画像やPDFではなくHTMLの文字で書き、1つの金額ごとに「税込か税抜か」「何に対する料金か（1回・1か月・1人）」「含まれるもの」「条件」「いつの料金か」を同じ行に書きます。料金が決まらない仕事でも「お問い合わせください」だけにせず、下限と決まり方と条件つきの例を書きます。改定したら、同じ日に料金を載せた全ページと構造化データを直し、古い料金のページは残しません。",
      intro: [
        "作成日：2026年11月20日（JST）。BtoB・SaaSの料金ページに書く項目は[BtoB・SaaSのAI検索対策](/guide/b2b-saas-ai-search)で、よくある質問の書き方は[FAQページとAI検索](/guide/faq-page-ai-search)で扱いました。この記事は業種を問わず「料金の書き方」そのものに絞り、店舗・教室・士業・ネットショップ・BtoBのどれにも使える形で書きます。",
        "AIの回答は日・聞き方・使うサービスによって変わります。この記事の手順は、AIが料金を読み違えにくいページを作り、正しく確かめるためのもので、回答に出ることや金額が正しく伝わることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "まず結論：AIが料金を間違える5つの原因と直し方",
          table: {
            head: ["原因", "AIの答えに起きること", "直し方"],
            rows: [
              ["料金が画像・PDF・タブの中にある", "料金を読めず「お問い合わせください」「各社で異なります」と答える", "料金をHTMLの文字と表で書く。PDFは補助にする"],
              ["税込か税抜かが書いていない", "税抜の金額を総額として答える、または逆", "金額のすぐ横に（税込）（税抜）を書く"],
              ["何に対する金額かが書いていない", "月額を1回の料金として答える、1人分を総額として答える", "「1回」「1か月」「1人」「1㎡」などの単位を金額と同じ行に書く"],
              ["古い料金が別のページに残っている", "改定前の料金を答える", "料金を載せたページを全部洗い出し、同じ日に直す"],
              ["サイトと比較サイト・地図の料金が違う", "どちらかの値を答える。どちらを使うかは分からない", "自社サイトを基準に、外部の掲載先を同じ日に直す"],
            ],
          },
          after: [
            `AIの検索がどのくらい会社の料金ページを使っているかの参考に、AI検索の計測会社 Profound が公開した調査があります。クラウド企業100社の料金について6つのAIの回答約7,600件を調べたところ、会社の料金ページがどこかで引用された回答は46%、最初の出典だったのは12%で、それ以外は比較サイトや掲示板などが使われていました（[Profound（2026-09-03）](${SRC.profound})、調査会社自身の調査で、対象は海外のSaaS企業）。自社の料金ページを正確にすることは前提で、外部の掲載先の料金もそろえる必要がある、ということです。`,
          ],
        },
        {
          heading: "上位の記事で分かったこと・足りなかったこと",
          paragraphs: [
            "「料金ページ AI検索」「pricing page AI search」などで上位の日本語の記事と英語の記事を読みました（2026-11-20）。どの記事も「料金を文字で書く」「本文と構造化データを合わせる」は共通でした。一方、税込・税抜の書き方、決まった料金がない仕事の書き方の具体例、割引や通常価格の表示のルール、WordPressでの手順は、ほぼどの記事にもありませんでした。",
          ],
          table: {
            head: ["記事", "よく書けている点", "足りなかった点"],
            rows: [
              [`[Uravation（2026-09-05更新）](${SRC.uravation})`, "日本語で唯一、料金ページに絞った記事。開示のレベルの表、改定の手順、失敗例", "総額表示のルール、構造化データの例、WordPressの手順"],
              [`[Profound（2026-09-03）](${SRC.profound})`, "料金の質問へのAIの回答の実測。HTMLに料金があるかをcurlで確かめる方法", "構造化データ、税の扱い、中小の事業者の例"],
              [`[Single Grain](${SRC.singlegrain})・[PeerPush](${SRC.peerpush})`, "SaaSの料金のJSON-LDの例", "型の選び方が2本で食い違う（Product と SoftwareApplication）。税の扱いの例なし"],
              [`[Texta](${SRC.texta})・[Trakkr](${SRC.trakkr})`, "月額と年額の取り違え、「最終更新日」を書く、定期的な確認", "具体的な数字や出典がない。WordPressの手順なし"],
              [`[eSEOspace](${SRC.eseospace})・[GenOptima](${SRC.genoptima})`, "表は th/td で書く、見積もり制でも決まり方を書く", "構造化データの例、税・地域の扱い、確かめ方"],
            ],
          },
          after: [
            "英語の記事はどれもSaaSが前提で、店舗やサービス業の「1回いくら」「条件で変わる」料金を扱った記事は見つかりませんでした。この記事はそこを埋めます。",
          ],
        },
        {
          heading: "料金の1行に入れる6つの要素",
          paragraphs: [
            "AIは「◯◯はいくら？」と聞かれると、ページから金額の部分を抜き出して答えます。そのとき金額の近くに条件がないと、条件を落として答えたり、別の行の条件を付けてしまったりします。料金は1つずつ、次の6つを同じ行（または同じ表の行）に書きます。",
          ],
          table: {
            head: ["要素", "書く例", "抜けると起きること"],
            rows: [
              ["金額", "5,500円", "—"],
              ["税込か税抜か", "（税込）", "税抜の金額を総額として伝えられる"],
              ["単位", "1回／1か月／1人／1時間／1㎡", "月額が1回分として伝えられる"],
              ["含まれるもの", "シャンプー・ブロー込み", "追加料金の有無を聞かれても答えられない"],
              ["条件", "学生は550円引き（学生証の提示）", "条件つきの値段が全員の値段として伝えられる"],
              ["いつの料金か", "2026年12月1日からの料金", "改定前か後か区別できない"],
            ],
          },
          after: [
            "悪い例：「カット 5,000〜」。良い例：「カット（シャンプー・ブロー込み）1回 5,500円（税込）。学生は550円引き（学生証の提示）。2026年12月1日からの料金です。」",
            `日本で消費者に向けて前もって料金を示すときは、消費税を含めた総額の表示が求められています。ウェブサイトや広告も対象です（[国税庁：タックスアンサー No.6902](${SRC.ntaTotal})）。税抜の金額を併記するのは構いませんが、総額が分かる書き方にします。表の見出しに一度だけ「表示はすべて税込です」と書くより、金額ごとに（税込）と書くほうが、AIが行だけを抜き出したときにも伝わります。`,
          ],
        },
        {
          heading: "決まった料金がない仕事は「下限・決まり方・例」で書く",
          paragraphs: [
            "工事、士業の報酬、制作、出張サービスなど、内容で料金が変わる仕事は多くあります。それでも「お見積もりします」「お問い合わせください」だけだと、AIは「料金は公開されていません」としか答えられず、料金を書いている他社の名前が先に出やすくなります。正確な金額が書けなくても、次の3つは書けます。",
          ],
          list: [
            "下限：「税込33,000円から」。いちばん安い条件も一緒に書く（「6畳1部屋・平日の場合」など）",
            "決まり方：何で金額が変わるか（広さ、件数、距離、日数、緊急かどうか）と、その単価が分かるなら単価",
            "条件つきの例：よくある依頼の例を2〜3通り、条件をすべて書いて金額と作成した月を添える",
          ],
          after: [
            "例：「戸建ての外壁塗装（30坪・2階建て・足場込み）の例：税込1,320,000円（2026年11月の見積もり例）。面積・塗料・下地の傷みで変わります。現地調査と見積もりは無料です。」この形なら、AIは「この条件ならこのくらい」と答えられ、人も問い合わせる前に予算の見当が付きます。",
            "無料のものは「無料」とはっきり書きます。見積もり、初回相談、出張費、キャンセル料のように、お客さまが迷うものほど、0円であることを文字で書いておく価値があります。",
          ],
        },
        {
          heading: "割引・キャンペーン・「通常価格」の書き方",
          paragraphs: [
            "期間限定の値段は、期間を書かないと、終わったあともAIが「今の値段」として答えることがあります。キャンペーンは「2026年12月1日〜12月31日のご予約まで」のように始まりと終わりを書き、終わったらその日のうちにページから外すか「終了しました」と書き換えます。",
            `「通常価格◯円のところ◯円」のように比べる値段を並べる表示（二重価格表示）には、景品表示法のルールがあります。消費者庁は、比べる値段に過去の販売価格を使う場合、それが「最近相当期間にわたって販売されていた価格」でなければ、いつ・どのくらいの期間その値段だったかを正しく書かないと不当表示のおそれがある、としています。実際に売ったことのない値段や、メーカーが決めていない「希望小売価格」を比べる値段に使うのも問題になる例として挙げられています（[消費者庁：二重価格表示](${SRC.caaDouble})）。AIは比べる値段もそのまま拾うので、根拠のない「通常価格」は人にもAIにも誤解のもとになります。`,
          ],
        },
        {
          heading: "料金を改定するとき：古い料金を残さない手順",
          paragraphs: [
            "AIが古い料金を答えるいちばん多い原因は、料金ページ以外のどこかに古い金額が残っていることです。改定の前に、料金が載っている場所を洗い出しておきます。",
          ],
          list: [
            "サイト内を古い金額で検索する（WordPressなら管理画面の投稿・固定ページの検索、ブログ記事、お知らせ、FAQ、PDFのパンフレット）",
            "料金ページに「2026年12月1日に料金を改定しました」と書き、いつからの料金かを明記する",
            "構造化データの金額（プラグインやテーマの設定、手書きのJSON-LD）を同じ日に直す",
            "Googleビジネスプロフィール、予約サイト、比較サイト、SNSのプロフィールの料金を同じ日に直す",
            "古い料金だけを書いた記事は、削除するか、冒頭に「この記事の料金は改定前のものです。現在の料金は料金ページへ」と書いてリンクする",
            "改定の日付と、直した場所の一覧を記録しておく（あとでAIの答えを確かめるときに使う）",
          ],
          after: [
            "各AIが新しい料金を反映するまでの日数は公開されていません。改定の数日後から数週間後に、同じ質問で確かめます（確かめ方は後半に書きます）。",
          ],
        },
        {
          heading: "AIが読める形にする：画像・PDF・タブ・JavaScriptを確かめる",
          paragraphs: [
            "デザインの都合で料金表を画像にしていると、人には読めてもAIのクローラーには読めない場合があります。PDFだけ、タブを押さないと出ない料金、JavaScriptで後から表示する料金も、読み取れるかどうかはAIのサービスごとに違い、公開されていません。料金はHTMLの文字と表（table要素）で書くのが確実です。Profound の調査でも、料金ページの一部が本文から読めない状態のサイトがありました（公開している料金ページ77件のうち、AIが読める状態だったのは57件）。",
            "自分のページの料金がHTMLの文字として入っているかは、次のコマンドで確かめられます。",
          ],
          code: CURL,
          after: [
            "コマンドを使わない場合は、ブラウザで料金ページを開き、ページのソースを表示して金額で検索しても同じことが分かります。",
          ],
        },
        {
          heading: "構造化データ：Offer と PriceSpecification の書き方",
          paragraphs: [
            `構造化データは、本文に書いた料金を機械が読みやすい形でも示すものです。本文の代わりにはなりません。GoogleはAI機能のために特別な構造化データは要らず、構造化データは表示されている本文と一致させるよう案内しています（[AI機能とウェブサイト](${SRC.aiFeaturesJa})、2026-11-18に確認）。書くなら、次の決まりを守ります。`,
          ],
          list: [
            `金額（price）は数字だけ。カンマ・「円」・「〜」を入れず、通貨は priceCurrency に「JPY」のように書く（[schema.org/price](${SRC.schemaPrice}) の使い方の説明）`,
            `税込かどうかは PriceSpecification の valueAddedTaxIncluded（true / false）で示せる（[PriceSpecification](${SRC.schemaPriceSpec})）`,
            "幅のある料金は minPrice・maxPrice、期間のある料金は validFrom・validThrough（Offer なら priceValidUntil）",
            `月額などの単位は UnitPriceSpecification の billingDuration・unitText、通常価格とセール価格の区別は priceType（[UnitPriceSpecification](${SRC.schemaUnitPrice})）`,
          ],
          code: JSONLD_JA,
          after: [
            `書いたら [Schema Markup Validator](${SRC.validator}) で文法を確かめます。Googleの検索結果での特別な表示（リッチリザルト）の条件は型ごとに違うので、商品やサービスで狙う場合はGoogleの各型のドキュメントで確かめてください（この記事を書いた回は、Googleの商品のドキュメントを直接は読めていません）。ChatGPTやPerplexityが料金の構造化データを使うと明記した公式の資料は、調べた範囲では見つかりませんでした。`,
          ],
        },
        {
          heading: "WordPressでの手順（Nurevo AIOの場合）",
          paragraphs: [
            `[Nurevo AIO（無料、旧表示名 Nurevo AEO）](${WP_ORG})では、設定画面の「サービス」に登録した料金が、Service の構造化データ（Offer の price と priceCurrency）と llms.txt に出ます。次の順で進めます。`,
          ],
          list: [
            "先に料金ページの本文を、この記事の6つの要素で整える（構造化データより本文が先）",
            "サービスを登録する（最大20件）。「料金」の欄には数字だけ（5500）を入れ、「通貨」に JPY を入れる。入れた文字はそのまま出るので「5,500円〜」とは入れない",
            "Nurevo の Offer には税込かどうかの印が付かないので、税込かどうか・含まれるもの・条件は「説明（1文・任意）」と本文に書く。「説明」は llms.txt のサービスの行にも載る",
            "「所要時間（分）」を入れると、料金と一緒に llms.txt と構造化データに出る（例：- カット — 60 min · JPY 5500）",
            "「サービスを掲載するページID」に料金ページのIDを入れると、サービスの構造化データがそのページに出る（0はフロントページ）",
            "BtoB・SaaSのサイトは「料金ページ（BtoB）」にURLを入れると、llms.txt の Key facts に「Pricing」として載る",
            "WooCommerce の商品の Product と Offer は WooCommerce に任せ、Nurevo は重ねて出さない。商品の価格は WooCommerce の設定で直す",
            "料金のよくある質問（追加料金、キャンセル料、支払い方法）は、料金ページ専用のFAQにする。Yoast SEO・Rank Math・All in One SEO・Slim SEO と一緒でも二重にならず、SEO SIMPLE PACK・VK All in One Expansion Unit とも併用できる（0.9.1から）",
          ],
          after: [
            "改定のときは、本文・Nurevo のサービスの料金・FAQの答えを同じ日に直します。お客様のサイトを保守している制作会社は、料金改定の更新を保守の作業範囲に入れておくと、食い違いを防げます。月額で支援する制作会社向けに[パートナー制度](" + PARTNER + ")があります。",
          ],
        },
        {
          heading: "確かめ方：料金の質問を決めて記録する",
          paragraphs: [
            "料金が正しく伝わっているかは、同じ質問を同じAIに、日を変えて何回か聞いて記録します。1回の答えだけで判断しないでください。",
          ],
          table: {
            head: ["質問の例", "見ること"],
            rows: [
              ["「（店名）のカットの料金は？」", "金額・税込かどうか・含まれるものが合っているか"],
              ["「（地域）で（サービス）が1万円以内でできるところは？」", "社名なしの質問で候補に入るか。料金の条件つきの質問は、料金が書いていないと外されやすい"],
              ["「（店名）のキャンセル料は？」", "0円や割合が正しいか"],
              ["「（店名）は値上げした？」", "改定前の料金を答えていないか。出典のURLはどこか"],
            ],
          },
          after: [
            "記録するのは、日付・AIのサービス名・質問・答えた金額・出典のURLです。出典が比較サイトや古いブログ記事なら、そこを直します。Nurevoの無料プランとStandardでは、月に1回、業種と地域から作った社名なしの質問3つをNurevoのサービスがPerplexityに聞き、名前が出たか・サイトが引用されたかを表示します。Pro（月14,800円〜、ベータ）は最大20問をPerplexityで計測します（ChatGPTは設定され次第）。料金の質問は手で記録してください。詳しくは[AIでの登場率の測り方](/guide/measure-ai-visibility)へ。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "料金がHTMLの文字で書かれている（画像・PDF・タブの中だけではない）",
            "金額ごとに（税込）（税抜）が書いてある。消費者向けは総額が分かる",
            "金額ごとに単位（1回・1か月・1人など）が書いてある",
            "含まれるもの・追加料金・無料のものが書いてある",
            "決まった料金がない仕事は、下限・決まり方・条件つきの例を書いた",
            "キャンペーンに始まりと終わりの日付がある。比べる値段に根拠がある",
            "料金ページに「いつからの料金か」が書いてある",
            "サイト内の古い料金をすべて直した",
            "構造化データの金額が数字だけで、本文と同じ値",
            "Googleビジネスプロフィール・予約サイト・比較サイトの料金も同じ",
          ],
        },
      ],
      faqs: [
        { q: "料金を公開すると、AIに出やすくなりますか？", a: "出ることは保証できません。ただ「1万円以内」のような料金の条件がついた質問では、料金が書いていないページは答えに使いようがありません。少なくとも下限と決まり方を書くと、AIが答えに使える材料ができます。" },
        { q: "税抜の表示だけではいけませんか？", a: "日本で消費者に向けて料金を示すときは、消費税を含めた総額の表示が求められています（国税庁 タックスアンサー No.6902）。税抜の金額を一緒に書くのは構いません。AIの読み違いを防ぐためにも、金額ごとに（税込）と書くのがおすすめです。" },
        { q: "料金表を画像にしたままではだめですか？", a: "画像を読めるかどうかはAIのサービスごとに違い、公開されていません。デザインとして画像を残すのは構いませんが、同じ内容をHTMLの文字か表でも書いてください。" },
        { q: "AIが古い料金を答えます。どうすればいいですか？", a: "AIが示した出典のURLを確かめ、そのページの料金を直すか、改定前の料金であることを冒頭に書きます。サイト内の古い記事、Googleビジネスプロフィール、比較サイトも見直してください。反映までの日数は公開されていないので、数日後から数週間後に同じ質問で確かめます。" },
        { q: "構造化データだけで料金を伝えられますか？", a: "いいえ。構造化データは本文の料金を補うもので、本文と一致させる必要があります。本文に書いていない料金を構造化データだけに入れないでください。" },
        { q: "見積もり制なので金額を書けません。", a: "正確な金額でなくても、下限（「税込◯円から」とその条件）、金額が何で変わるか、条件をすべて書いた見積もりの例を2〜3通り書けます。見積もりが無料なら、それもはっきり書きます。" },
        { q: "WordPressの料金欄に「5,500円〜」と入れてもいいですか？", a: "Nurevo の「料金」欄は、入れた文字がそのまま構造化データの price に出ます。schema.org は数字だけを使うよう説明しているので、5500 と入れ、「〜から」や税込かどうかは本文と「説明」に書いてください。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "AIがサイトを読める状態かを確かめる",
        body: "無料チェックは登録不要です。URLを入れると、AIクローラーの許可、構造化データ、llms.txtの状態が分かります。WordPressなら無料のプラグインで、サービスと料金を構造化データとllms.txtに出し、SEOプラグインと重ならないように整えられます。",
        label: "AI対応を無料でチェック",
        href: "/check",
        secondary: { label: "無料のWordPressプラグインを入れてみる", href: WP_ORG },
      },
      footnote: FOOT_JA,
    },
    en: {
      title: "How to write a pricing page AI reads correctly | Nurevo",
      description: "Why AI quotes old or wrong prices, and how to fix it: the six things each price line needs, quote-based pricing, discounts, price changes, schema, WordPress steps.",
      h1: "How to write a pricing page AI reads correctly: tax, conditions and price changes",
      lead: "To get AI to quote your prices correctly, write them as HTML text rather than images or PDFs, and put six things on the same line as each amount: whether tax is included, what the price is for (per visit, per month, per person), what is included, any conditions, and when the price applies. If your work is quote-based, don't stop at \"contact us\": give a starting price, what drives the price, and worked examples. When prices change, update every page and every piece of structured data that carries them on the same day, and don't leave old prices standing.",
      intro: [
        "Written November 20, 2026 (JST). The fields a B2B or SaaS pricing page needs are in [AI search for B2B and SaaS](/guide/b2b-saas-ai-search), and how to write FAQs is in [FAQ pages and AI search](/guide/faq-page-ai-search). This guide is about writing prices themselves, for any kind of business: shops, studios, professional services, online stores and B2B.",
        "AI answers change by day, by wording and by service. The steps here make a page whose prices AI is less likely to misread, and show how to check; they do not guarantee you will appear in an answer or that a price will be quoted correctly.",
      ],
      sections: [
        {
          heading: "The short answer: five reasons AI gets prices wrong, and the fix for each",
          table: {
            head: ["Cause", "What happens in AI answers", "Fix"],
            rows: [
              ["Prices sit in an image, a PDF or a tab", "AI can't read them and says \"contact the business\" or \"prices vary\"", "Write prices as HTML text and tables. Keep the PDF as an extra"],
              ["No word on whether tax is included", "The pre-tax price is quoted as the total, or the other way round", "Put \"including tax\" or \"plus tax\" right next to each amount"],
              ["No unit", "A monthly fee is quoted as a one-off; a per-person price as the total", "Put \"per visit\", \"per month\", \"per person\" on the same line"],
              ["Old prices left on other pages", "The pre-change price is quoted", "List every page that carries a price and update them all on the same day"],
              ["Your site and directories disagree", "Either value may be quoted; there is no telling which", "Treat your site as the reference and update outside listings the same day"],
            ],
          },
          after: [
            `For a sense of how often AI search actually uses a company's own pricing page: the AI search measurement company Profound looked at about 7,600 answers from six AI engines to pricing questions about 100 cloud companies. The company's pricing page was cited somewhere in 46% of answers, and was the first source in 12%; the rest leaned on comparison sites, forums and the like ([Profound, 2026-09-03](${SRC.profound}); the vendor's own research, covering SaaS companies). An accurate pricing page is the starting point, and the prices listed elsewhere need to match it.`,
          ],
        },
        {
          heading: "What the top articles cover, and what they miss",
          paragraphs: [
            "We read the top Japanese and English articles for queries such as \"pricing page AI search\" (2026-11-20). They agree on two things: write prices as text, and keep structured data in line with the page. Almost none of them cover how to show tax, worked examples for quote-based work, the rules on showing a \"regular price\" next to a discount, or WordPress steps.",
          ],
          table: {
            head: ["Article", "Strong on", "Missing"],
            rows: [
              [`[Uravation (updated 2026-09-05, Japanese)](${SRC.uravation})`, "The only Japanese article focused on pricing pages. A disclosure-level table, a price-change routine, failure patterns", "Tax display rules, a structured data example, WordPress steps"],
              [`[Profound (2026-09-03)](${SRC.profound})`, "Measured AI answers to pricing questions. Checking with curl that prices are in the HTML", "Structured data, tax, small-business examples"],
              [`[Single Grain](${SRC.singlegrain}) and [PeerPush](${SRC.peerpush})`, "JSON-LD examples for SaaS pricing", "The two disagree on the type (Product vs SoftwareApplication). No tax example"],
              [`[Texta](${SRC.texta}) and [Trakkr](${SRC.trakkr})`, "Monthly vs annual mix-ups, a \"last updated\" date, regular checks", "No figures or sources. No WordPress steps"],
              [`[eSEOspace](${SRC.eseospace}) and [GenOptima](${SRC.genoptima})`, "Tables with th/td; explain how quotes are worked out", "Schema examples, tax and region, how to check"],
            ],
          },
          after: [
            "Every English article assumed SaaS. None dealt with \"per visit\" or \"depends on the job\" prices from local and service businesses. This guide fills that gap.",
          ],
        },
        {
          heading: "Six things on every price line",
          paragraphs: [
            "Asked \"how much is X?\", an AI pulls the amount out of the page. If the conditions aren't near the amount, it drops them, or attaches a condition from another line. Write each price with these six things on the same line (or the same table row).",
          ],
          table: {
            head: ["Item", "Example", "What goes wrong without it"],
            rows: [
              ["Amount", "$55", "—"],
              ["Tax", "(including tax)", "A pre-tax price is passed on as the total"],
              ["Unit", "per visit / per month / per person / per hour", "A monthly fee is passed on as a one-off"],
              ["What's included", "wash and blow-dry included", "Questions about extra charges go unanswered"],
              ["Conditions", "$5 off for students with ID", "A conditional price is passed on as everyone's price"],
              ["When it applies", "from December 1, 2026", "No way to tell old from new"],
            ],
          },
          after: [
            "Weak: \"Haircut from 50\". Strong: \"Haircut (wash and blow-dry included), $55 per visit including tax. $5 off for students with ID. Prices from December 1, 2026.\"",
            `Rules on showing tax differ by country. In Japan, prices shown to consumers in advance must include consumption tax, on websites and ads too ([National Tax Agency: Tax Answer No. 6902, Japanese](${SRC.ntaTotal})). Wherever you are, writing the tax status next to each amount works better than a single \"all prices include tax\" line at the top of the table, because AI often lifts a single row on its own.`,
          ],
        },
        {
          heading: "Quote-based work: give a starting price, the drivers and examples",
          paragraphs: [
            "Building work, professional fees, design projects and call-out services all vary by job. Even so, \"contact us for a quote\" leaves an AI with nothing better than \"prices aren't published\", and competitors that do publish prices tend to be named first. You may not have one exact price, but you can always give three things.",
          ],
          list: [
            "A starting price: \"from $300 including tax\", with the cheapest conditions (\"one room up to 10 m², weekday\")",
            "What drives the price: size, number of items, distance, days, urgency, and the unit rate if you have one",
            "Worked examples: two or three typical jobs with every condition, the amount and the month the example was written",
          ],
          after: [
            "Example: \"Exterior painting, two-storey house of about 100 m² including scaffolding: $12,000 including tax (example quote, November 2026). The price depends on area, paint and the state of the walls. Site visits and quotes are free.\" Written this way, an AI can say \"under these conditions, about this much\", and people can judge their budget before they get in touch.",
            "Say \"free\" plainly where something is free. Quotes, first consultations, call-out fees and cancellations are exactly the things customers wonder about, so a written \"no charge\" is worth having.",
          ],
        },
        {
          heading: "Discounts, promotions and \"regular price\"",
          paragraphs: [
            "A time-limited price without dates can keep being quoted by AI as the current price after it ends. Give promotions a start and end (\"bookings made December 1 to December 31, 2026\"), and on the end date remove them or mark them as ended.",
            `Showing a comparison price (\"was $80, now $60\") is regulated in many places. In Japan, the Consumer Affairs Agency says that if the comparison is a past price that was not \"the price at which it was sold over a reasonable recent period\", the display may mislead unless it states accurately when and for how long that price applied; prices never actually charged and \"manufacturer's suggested prices\" that don't exist are also given as problem cases ([Consumer Affairs Agency: double price display, Japanese](${SRC.caaDouble})). Check the rules where you sell. AI picks up comparison prices as readily as real ones, so an unfounded \"regular price\" misleads people and AI alike.`,
          ],
        },
        {
          heading: "When prices change: leave no old price behind",
          paragraphs: [
            "The most common reason AI quotes an old price is that the old amount still sits somewhere other than the pricing page. Before a change, list every place a price appears.",
          ],
          list: [
            "Search the site for the old amount (in WordPress: posts and pages in the admin, blog posts, news, FAQs, PDF brochures)",
            "On the pricing page, write \"Prices changed on December 1, 2026\" and say which date the prices apply from",
            "Update structured data amounts (plugin and theme settings, hand-written JSON-LD) the same day",
            "Update your Google Business Profile, booking sites, directories and social profiles the same day",
            "For posts that only show the old price, delete them or add a first line: \"Prices in this post are from before the change. See the pricing page for current prices\" with a link",
            "Keep a record of the change date and every place you updated, for checking AI answers later",
          ],
          after: [
            "No AI service publishes how long it takes to pick up a new price. Check with the same questions a few days to a few weeks after the change (see the checking section below).",
          ],
        },
        {
          heading: "Make prices readable: check images, PDFs, tabs and JavaScript",
          paragraphs: [
            "A price table saved as an image for design reasons can be readable to people and unreadable to AI crawlers. Prices only in a PDF, hidden behind a tab, or drawn in later by JavaScript may or may not be read; it differs by AI service and isn't published. HTML text and table elements are the safe choice. Profound's study also found pricing pages whose content was partly unreadable: of 77 public pricing pages, 57 were in an AI-readable state.",
            "This command shows whether your prices are in the page's HTML as text.",
          ],
          code: CURL_EN,
          after: [
            "Without a terminal, open the pricing page, view the page source and search for an amount; it tells you the same thing.",
          ],
        },
        {
          heading: "Structured data: writing Offer and PriceSpecification",
          paragraphs: [
            `Structured data restates the prices on your page in a form machines read easily. It doesn't replace the page text. Google says AI features need no special structured data, and that structured data must match the visible text ([AI features and your website](${SRC.aiFeatures}), checked 2026-11-18). If you add it, follow these rules.`,
          ],
          list: [
            `price takes digits only: no thousands separators, currency symbols or \"from\", with \".\" for decimals; the currency goes in priceCurrency as \"USD\", \"JPY\" and so on ([schema.org/price](${SRC.schemaPrice}) usage notes)`,
            `Whether tax is included can be stated with valueAddedTaxIncluded (true / false) on a PriceSpecification ([PriceSpecification](${SRC.schemaPriceSpec}))`,
            "Ranges use minPrice and maxPrice; dated prices use validFrom and validThrough (priceValidUntil on an Offer)",
            `Units such as \"per month\" use billingDuration and unitText on a UnitPriceSpecification, and list vs sale price use priceType ([UnitPriceSpecification](${SRC.schemaUnitPrice}))`,
          ],
          code: JSONLD_EN,
          after: [
            `Check the syntax with the [Schema Markup Validator](${SRC.validator}). Google's requirements for special search displays (rich results) differ by type, so check Google's documentation for the type you are aiming at (we could not open Google's product documentation directly while writing this). We found no official statement that ChatGPT or Perplexity use price markup.`,
          ],
        },
        {
          heading: "WordPress steps (with Nurevo AIO)",
          paragraphs: [
            `With [Nurevo AIO (free, formerly shown as Nurevo AEO)](${WP_ORG}), prices entered under Services in Settings are published as Service structured data (an Offer with price and priceCurrency) and in llms.txt. Work in this order.`,
          ],
          list: [
            "Fix the pricing page text first, using the six items above (page text before structured data)",
            "Add your services (up to 20). Put digits only in Price (55.00 or 5500) and the currency code in Currency (USD, JPY). What you type is published as is, so don't enter \"from $55\"",
            "Nurevo's Offer carries no tax flag, so write the tax status, what's included and any conditions in Description (one sentence, optional) and on the page. The description also appears on the service's line in llms.txt",
            "Fill in Duration (minutes) and it is published next to the price in llms.txt and the structured data (for example: - Haircut — 60 min · USD 55.00)",
            "Enter the pricing page's ID as the page that carries the services, and the Service markup goes on that page (0 = front page)",
            "On B2B / SaaS sites, enter the URL in Pricing page (B2B) and it is listed as \"Pricing\" under Key facts in llms.txt",
            "WooCommerce keeps its own Product and Offer markup and Nurevo doesn't duplicate it. Change product prices in WooCommerce",
            "Make pricing questions (extra charges, cancellation fees, payment methods) a FAQ for the pricing page itself. It won't duplicate Yoast SEO, Rank Math, All in One SEO or Slim SEO, and works alongside SEO SIMPLE PACK and VK All in One Expansion Unit (from 0.9.1)",
          ],
          after: [
            "On a price change, update the page text, the service prices in Nurevo and the FAQ answers on the same day. Agencies that maintain client sites can put price-change updates in the maintenance scope to stop pages drifting apart. For agencies offering monthly support there is a [partner programme](" + PARTNER + ").",
          ],
        },
        {
          heading: "How to check: fix your price questions and keep a record",
          paragraphs: [
            "To see whether your prices come across correctly, ask the same questions to the same AI on different days and record the answers. Don't judge from a single answer.",
          ],
          table: {
            head: ["Question", "What to look at"],
            rows: [
              ["\"How much is a haircut at (business)?\"", "Is the amount, the tax status and what's included right?"],
              ["\"Where in (area) can I get (service) for under $100?\"", "Are you on the list for an unbranded question? Price-qualified questions tend to drop pages without prices"],
              ["\"What is (business)'s cancellation fee?\"", "Is the amount or percentage right?"],
              ["\"Did (business) raise its prices?\"", "Is the old price being quoted? Which URL is the source?"],
            ],
          },
          after: [
            "Record the date, the AI service, the question, the amount quoted and the source URL. If the source is a directory or an old blog post, fix that. On Nurevo's Free and Standard plans, once a month the Nurevo service asks Perplexity three unbranded questions built from your business type and area, and shows whether your name appeared and whether your site was cited. Pro ($99/month and up, beta) measures up to 20 questions on Perplexity (ChatGPT once configured). Record price questions by hand. See [measuring AI visibility](/guide/measure-ai-visibility) for more.",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Prices are HTML text (not only in an image, PDF or tab)",
            "Each amount says whether tax is included; consumers can see the total",
            "Each amount has a unit (per visit, per month, per person ...)",
            "What's included, extra charges and free items are written down",
            "Quote-based work has a starting price, the price drivers and worked examples",
            "Promotions have start and end dates; comparison prices have a basis",
            "The pricing page says which date the prices apply from",
            "Every old price on the site has been updated",
            "Structured data amounts are digits only and match the page",
            "Google Business Profile, booking sites and directories show the same prices",
          ],
        },
      ],
      faqs: [
        { q: "Will publishing prices make AI mention us more?", a: "That can't be guaranteed. But for price-qualified questions such as \"under $100\", a page without prices gives AI nothing to work with. A starting price and what drives the price at least give AI something it can use." },
        { q: "Can we show pre-tax prices only?", a: "It depends on where you sell. In Japan, prices shown to consumers must include consumption tax (National Tax Agency, Tax Answer No. 6902), though the pre-tax amount may be shown alongside. Wherever you are, stating the tax status next to each amount helps prevent misreading." },
        { q: "Our price table is an image. Is that a problem?", a: "Whether an image can be read differs by AI service and isn't published. You can keep the image for design, but put the same content in HTML text or a table too." },
        { q: "AI keeps quoting our old price. What should we do?", a: "Check the source URL the AI shows, then fix the price on that page or add a note at the top that it shows old prices. Review old posts on your site, your Google Business Profile and directories too. No service publishes how long updates take, so check with the same questions a few days to a few weeks later." },
        { q: "Can structured data alone carry our prices?", a: "No. Structured data supports the prices on the page and must match them. Don't put prices in structured data that aren't on the page." },
        { q: "We quote every job, so we can't give a price.", a: "Even without an exact amount you can give a starting price with its conditions, what changes the price, and two or three worked examples with every condition stated. If quotes are free, say so." },
        { q: "Can I type \"from $55\" in the WordPress price field?", a: "Nurevo's Price field is published as the structured data price exactly as typed. schema.org asks for digits only, so enter 55.00 and put \"from\" and the tax status in the description and on the page." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See whether AI can read your site",
        body: "The free check needs no sign-up: enter a URL to see AI crawler access, structured data and llms.txt. On WordPress, the free plugin publishes your services and prices as structured data and in llms.txt, without duplicating your SEO plugin's output.",
        label: "Check your AI readiness for free",
        href: "/check",
        secondary: { label: "Try the free WordPress plugin", href: WP_ORG },
      },
      footnote: FOOT_EN,
    },
  },
};
