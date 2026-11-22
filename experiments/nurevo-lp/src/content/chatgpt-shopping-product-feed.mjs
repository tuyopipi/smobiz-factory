// Content page: how products get into ChatGPT shopping results (crawled web,
// merchant product feeds, Shopify / Etsy catalogs), how that compares with
// Google AI Mode / Gemini (Merchant Center, Shopping Graph, UCP checkout), what
// a Japanese online shop can and cannot do as of November 2026, and the
// WooCommerce steps. EC page, distinct from online-shop-ai-search (which covers
// the shop's own pages and markup in general).
//
// Written 2026-11-22 (JST). Outside facts (read 2026-11-22):
// - chatgpt.com/merchants (undated): "Shopping is currently live for ChatGPT
//   users in the U.S."; merchants apply via the form (headquarter country list
//   includes Japan; waitlist); a feed is not required if ChatGPT already crawls
//   the site, feeds give greater control; Shopify / Etsy catalogs already
//   integrated, no application; moving away from a standalone Instant Checkout,
//   purchases completed on merchant-owned websites or apps; no fees on
//   purchases that start in ChatGPT; self-serve merchant platform planned.
// - OpenAI "Buy it in ChatGPT" (2025-09-29): results organic and unsponsored,
//   ranked on relevance; for the same product across merchants: availability,
//   price, quality, primary seller, Instant Checkout enabled. (Older post; the
//   fee wording there was superseded by the merchants page.)
// - OpenAI commerce docs, Submit product feeds: Business Hub, identity
//   verification before upload, choose countries and currencies, keep item_id
//   stable, delivery by manual upload / hosted HTTPS URL / SFTP, full snapshots.
// - OpenAI product feed spec (file-upload/products): required item_id, title,
//   description, url, brand, seller_name, image_url, availability, price; geo
//   target_countries and store_country; standard upload targets the US (shared
//   format represents US, CA, MX; other markets need OpenAI to confirm);
//   checkout needs a separately enabled integration. Read through a summary,
//   so the copy says "per the spec page" and keeps to these points.
// - OpenAI bots doc: OAI-SearchBot decides appearance in ChatGPT search;
//   robots.txt changes take about 24 hours; independent of GPTBot.
// - OpenAI help 20001241 (ja): Shopify stores may be shown when relevant;
//   checkout happens on the merchant's store.
// - Google Merchant Center help 16837055 / UCP Merchant Center guide (updated
//   2026-11-17): UCP checkout for select merchants; products sold in the US
//   now, Canada and Australia next; native_commerce attribute shows Buy now.
// - Google UCP FAQ (updated 2026-11-03): powered by the Shopping Graph;
//   Merchant Center is the central hub for product data; native checkout
//   doesn't influence ranking.
// - Google blog 2026-01-11: UCP launch; dozens of new Merchant Center
//   attributes (answers to common product questions, compatible accessories,
//   substitutes), small group first. Google blog 2026-05-20: conversational
//   attributes usable by retailers globally; UCP checkout to Canada and
//   Australia in coming months, later the UK.
// - Merchant Center help 17117204 (2026-05-27): AI performance insights
//   (share of voice, attribute completeness score) rolling out in US, CA, AU,
//   IN, NZ. Japan not listed.
// - Google "AI features and your website": no special markup for AI features.
// - CommercePick 2026-07-21: Universal Cart US first, Japan timing not
//   announced. Netshop Impress 2026-03-12 (Digital Commerce 360): OpenAI
//   shifted away from direct Instant Checkout.
// Product facts: plugin readme 0.9.2 (Online shop site type: OnlineStore with
// product catalogue, prices and stock where known, return policy; works with
// WooCommerce without duplicating its Product markup; WooCommerce products in
// llms.txt; per-type coexistence). Nurevo does not build or submit product
// feeds to OpenAI or Merchant Center. Pro measurement: Perplexity (ChatGPT
// once configured).
// Not stated on purpose: approval times, fees in Japan, shopping UI in Japan
// (no official statement), Perplexity shopping (primary source not read),
// conversion-rate claims, WooCommerce core GTIN field behavior.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  merchants: "https://chatgpt.com/merchants/",
  buyIt: "https://openai.com/index/buy-it-in-chatgpt/",
  feedGuide: "https://developers.openai.com/commerce/guides/submit-product-feeds",
  feedSpec: "https://developers.openai.com/commerce/specs/file-upload/products",
  bots: "https://developers.openai.com/api/docs/bots",
  shopifyHelp: "https://help.openai.com/ja-jp/articles/20001241-shopping-from-shopify-merchants-in-chatgpt",
  shopifyHelpEn: "https://help.openai.com/en/articles/20001241-shopping-from-shopify-merchants-in-chatgpt",
  gUcp: "https://support.google.com/merchants/answer/16837055?hl=en",
  gUcpGuide: "https://developers.google.com/merchant/ucp/guides/merchant-center/overview",
  gUcpFaq: "https://developers.google.com/merchant/ucp/faq",
  gJan: "https://blog.google/products/ads-commerce/agentic-commerce-ai-tools-protocol-retailers-platforms",
  gGml: "https://blog.google/products-and-platforms/products/shopping/shopping-updates-google-marketing-live",
  gInsights: "https://support.google.com/merchants/answer/17117204",
  gAi: "https://developers.google.com/search/docs/appearance/ai-features",
  merchantListing: "https://developers.google.com/search/docs/appearance/structured-data/merchant-listing",
  commercepick: "https://www.commercepick.com/archives/98063",
  netshop: "https://netshop.impress.co.jp/e/2026/03/12/15734",
};

const CHECK = `# 1. robots.txt で OAI-SearchBot を止めていないか
curl -s https://example.jp/robots.txt | grep -i -B1 -A3 "oai-searchbot\\|user-agent: \\*"

# 2. 商品ページがボット対策で弾かれていないか（403 や確認画面が返らないか）
curl -s -o /dev/null -w "%{http_code}\\n" \\
  -A "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot" \\
  https://example.jp/product/sample/

# 3. 商品ページの構造化データに価格と在庫が入っているか
curl -s https://example.jp/product/sample/ | grep -o '"price[^,]*\\|"availability[^,]*' | head`;

const CHECK_EN = `# 1. Does robots.txt block OAI-SearchBot?
curl -s https://example.com/robots.txt | grep -i -B1 -A3 "oai-searchbot\\|user-agent: \\*"

# 2. Does bot protection turn a product page away (403 or a challenge page)?
curl -s -o /dev/null -w "%{http_code}\\n" \\
  -A "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot" \\
  https://example.com/product/sample/

# 3. Does the product page's structured data carry price and availability?
curl -s https://example.com/product/sample/ | grep -o '"price[^,]*\\|"availability[^,]*' | head`;

export default {
  slug: "chatgpt-shopping-product-feed",
  targetQueries: [
    "ChatGPT ショッピング 商品 表示 方法",
    "ChatGPT 商品フィード 申請 日本",
    "AIモード 商品 表示 Merchant Center UCP 日本",
    "how to get products into ChatGPT shopping",
    "ChatGPT product feed WooCommerce",
    "ChatGPT shopping vs Google AI Mode merchant feed",
  ],
  related: ["online-shop-ai-search", "appear-in-chatgpt", "google-ai-overviews-citations", "measure-ai-visibility", "llms-txt"],
  locales: {
    ja: {
      title: "ChatGPTのショッピングに商品を出す方法：フィードと日本の現状 | Nurevo",
      description: "ChatGPTの商品の結果は、サイトの読み取り・商品フィード・Shopify等の連携から選ばれます。2026年11月時点の申し込み方法、必須項目、AIモードとの違い、日本のWooCommerceのショップがやることを解説。",
      h1: "ChatGPTのショッピングに商品を出す方法：商品フィード・Merchant Centerとの違いと、日本のショップがいまやること",
      lead: "ChatGPTのショッピングの結果は広告ではなく、ChatGPTがサイトを読んだ内容、販売店が送る商品フィード、ShopifyやEtsyの商品データから選ばれます。OpenAIは「商品フィードがなくても、サイトを読めていれば出ることはある。フィードは情報をより正確に伝える手段」と説明しています。2026年11月時点でショッピングが提供されているのは米国の利用者向けで、日本のショップがまずやるべきことは、商品ページをAIが読める状態にし、価格・在庫をどこでも同じにすることです。",
      intro: [
        "作成日：2026年11月22日（JST）。OpenAI・Googleの情報は、同日に各公式ページで確認したものです。対象は、WooCommerceなどで自社のネットショップを運営している方と、その制作・運用を担当する方です。",
        "AIの回答や商品の表示は、日・聞き方・利用者の国やプランによって変わります。この記事は、商品が表示されることを保証する方法ではなく、AIが商品を正しく読める状態をつくり、使える仕組みを正しく選ぶための手順です。提供状況は今後変わるため、申し込む前に公式のページで確かめ直してください。",
        "ショップ全体の構造化データ（OnlineStore・返品条件など）の基本は[ネットショップのAI検索対策](/guide/online-shop-ai-search)で扱っています。この記事は、商品そのものがAIの買い物の回答に出る仕組みに絞っています。",
      ],
      sections: [
        {
          heading: "よく読まれている記事に足りないこと",
          paragraphs: [
            "「ChatGPT ショッピング 商品 表示」「AIモード Merchant Center」「how to get products into ChatGPT shopping」などで上位に出る日本語8本・英語8本を読みました。新しい記事は商品フィードの項目や申し込みの手順を詳しく書いていますが、2025年の発表のまま更新されていない記事も多く、次の点が抜けていました。",
          ],
          table: {
            head: ["抜けていた点", "この記事で扱うこと"],
            rows: [
              ["Instant Checkout（ChatGPT内での購入）を今も使える前提で書いている", "OpenAIが単独のInstant Checkoutから離れ、購入は販売店のサイトで完了する形に移ったことを、公式ページで確かめて書いた"],
              ["日本のショップが対象になるのかが書かれていない", "ChatGPTのショッピング・GoogleのUCPの購入・Merchant CenterのAIの分析が、それぞれどの国で使えるかを表にした"],
              ["ChatGPTとGoogleの仕組みを分けていない", "商品データの入口・申し込み・購入・費用を1つの表で並べた"],
              ["WooCommerceでの手順がない、または1つのプラグインの紹介だけ", "フィードを作る前にやること、WordPressで確かめるコマンド、Nurevoでできること・できないことを書いた"],
              ["測り方がない", "日本からの確かめ方と、AIの回答への登場の記録の仕方を書いた"],
            ],
            caption: "2026年11月22日に読んだ記事の傾向です。記事ごとの良し悪しではありません。フィードの細かい項目は、フィードの代行会社やECプラットフォームの解説のほうが詳しいものもあります。",
          },
        },
        {
          heading: "2026年11月時点：AIの買い物の機能と日本での状況",
          table: {
            head: ["機能", "状況", "日本", "出典"],
            rows: [
              ["ChatGPTのショッピングの結果", "広告ではない通常の結果として、商品を画像・価格・販売店つきで表示", "OpenAIの販売店向けページは「現在は米国のChatGPT利用者向けに提供」としている", `[OpenAI 販売店向けページ](${SRC.merchants})`],
              ["ChatGPTへの商品フィードの提供", "販売店向けページのフォームから申し込み（申し込み済みなら順番待ち）。自分で設定できる仕組みを準備中", "フォームの本社の国に日本はある。ただし標準のフィードの対象国は米国（共通の形式では米国・カナダ・メキシコ。その他の国はOpenAIの確認が必要）", `[販売店向けページ](${SRC.merchants})、[フィードの仕様](${SRC.feedSpec})`],
              ["ChatGPT内での購入（Instant Checkout）", "単独のInstant Checkoutからは離れ、購入は販売店のサイトやアプリで完了する形を優先すると明記", "—", `[販売店向けページ](${SRC.merchants})、[ネットショップ担当者フォーラム](${SRC.netshop})`],
              ["Google AIモード・Gemini での購入（UCP）", "一部の販売店向け。現在は米国で販売する商品が対象で、カナダ・オーストラリアが次、英国はその後", "公式ページに日本の記載なし。Universal Cart も日本での提供時期は未発表と報じられている", `[Merchant Center ヘルプ](${SRC.gUcp})、[UCPのガイド](${SRC.gUcpGuide})、[CommercePick](${SRC.commercepick})`],
              ["Merchant Center の会話向けの属性", "商品のよくある質問の答え・対応する付属品・代わりの商品などの新しい属性。会話向けの属性は世界の販売店が使えると発表", "使える（ただし少数の販売店から順に提供される属性もある）", `[Google 2026年1月](${SRC.gJan})、[Google 2026年5月](${SRC.gGml})`],
              ["Merchant Center のAIの分析（シェア・属性の充実度）", "米国・カナダ・オーストラリア・インド・ニュージーランドで順次", "一覧に日本はない", `[Merchant Center ヘルプ](${SRC.gInsights})`],
            ],
            caption: "2026年11月22日に確認。OpenAIの販売店向けページには日付の表示がありません。日本の利用者の画面にショッピングの結果が出るかどうかを、OpenAIが日本向けに説明したページは今回見つかりませんでした。",
          },
        },
        {
          heading: "ChatGPTは、どこから商品の情報を得ているか",
          paragraphs: [
            `OpenAIの説明では、ChatGPTの商品の情報の入口は大きく3つです。1つ目は公開されているウェブで、ChatGPTの検索用のクローラ OAI-SearchBot がサイトを読みます。OpenAIは、OAI-SearchBot を robots.txt で止めたサイトはChatGPTの検索の回答に出ないこと、robots.txt の変更が反映されるまで約24時間かかることを説明しています（[OpenAIのボットの説明](${SRC.bots})）。`,
            `2つ目は販売店が送る商品フィードです。販売店向けページのよくある質問には「サイトがすでに読まれているなら、フィードは必須ではない。ただしフィードを使うと、商品の情報をより細かく管理できる」という趣旨の答えがあります。3つ目は、ShopifyやEtsyで販売している場合の連携で、その場合は商品データがすでにつながっていて、申し込みも追加の設定もいらないとされています（[販売店向けページ](${SRC.merchants})、[OpenAI ヘルプ：ChatGPTでShopifyの販売店から買う](${SRC.shopifyHelp})）。`,
            `どの商品を出すかについて、OpenAIは2025年9月の発表で、商品の結果は広告ではなく、利用者の質問との関係で並べると書いています。同じ商品を複数の店が売っている場合は、在庫・価格・品質・その店がメーカーや主な販売元かどうかなどを見るとしています（[OpenAI：Buy it in ChatGPT](${SRC.buyIt})。この発表のInstant Checkoutと手数料の部分は、その後の販売店向けページの説明に置き換わっています）。`,
          ],
          after: [
            "つまり、フィードを送れない日本のショップでも、商品ページが読めて、価格・在庫・ブランド・説明がはっきり書かれていれば、材料にはなり得ます。逆に、価格が画像の中にしかない、在庫がJavaScriptで後から出る、ボット対策で弾かれている、といったページは読まれにくくなります。",
          ],
        },
        {
          heading: "ChatGPTの商品フィード：必須の項目と申し込みの流れ",
          paragraphs: [
            `OpenAIの開発者向けの仕様では、商品フィードに必ず入れる項目は次の9つと、販売する国の項目です（[商品フィードの仕様](${SRC.feedSpec})）。WooCommerceの商品データのどこに当たるかを並べました。`,
          ],
          table: {
            head: ["フィードの項目", "意味", "WooCommerceで当たるもの"],
            rows: [
              ["item_id", "商品ごとの変わらないID", "SKU（ない場合は商品ID）。途中で変えない"],
              ["title", "商品名", "商品名。記号や宣伝文句を詰め込まない"],
              ["description", "商品の説明", "商品の説明の本文（素材・サイズ・用途など）"],
              ["url", "商品ページのURL", "パーマリンク"],
              ["brand", "ブランド", "ブランドの属性やタクソノミー（なければ自社ブランド名）"],
              ["seller_name", "販売者の名前", "ショップ名（特定商取引法の表記と同じ）"],
              ["image_url", "商品画像のURL", "商品画像"],
              ["availability", "在庫（in_stock・out_of_stock・pre_order・backorder・unknown）", "在庫ステータス"],
              ["price", "価格（通貨つき）", "販売価格"],
              ["target_countries・store_country", "販売する国・店の国", "配送先の国の設定"],
            ],
            caption: "バリエーション（色・サイズ）がある商品、ChatGPTの広告や購入の連携を使う場合は、さらに条件つきで必須の項目があります。GTIN（JANコードなど）や送料・返品の項目は任意ですが、あると商品を特定しやすくなります。",
          },
          after: [
            `申し込みは[販売店向けページ](${SRC.merchants})のフォームからで、会社名・サイト・主な商品カテゴリ・商品数（SKU数）などを入力します。案内が来た販売店は、開発者向けの手順に沿って、Business Hub で事業者を登録し、本人確認をしてから、販売する国と通貨を選び、フィードを送ります。送り方は、手動のアップロード、HTTPSのURLに置く、SFTPの3つで、毎回すべての商品を送る形です（[フィードの送り方](${SRC.feedGuide})）。価格や在庫が変わったら、フィードも更新します。`,
            "承認までの期間や審査の基準は、今回読んだ公式ページには書かれていませんでした。2026年11月時点では、標準のフィードは米国向けです。日本国内だけで販売しているショップは、申し込みをしておく価値はあっても、それだけで日本の利用者の回答に出るようになるとは考えないほうが安全です。",
          ],
        },
        {
          heading: "GoogleのAIモード・Geminiとの違い",
          paragraphs: [
            `Googleは、AIモードやGeminiの買い物の機能は Shopping Graph（Googleの商品データ）が元になっていて、商品データを整える中心は Merchant Center だとしています。UCPの購入に対応しても、商品の並び方には影響しないとも書いています（[UCPのよくある質問](${SRC.gUcpFaq})）。検索のAIの機能のために特別なマークアップは必要なく、構造化データを見える文章と一致させ、Merchant Centerの情報を最新にすることが基本です（[Google：AI features and your website](${SRC.gAi})）。`,
          ],
          table: {
            head: ["", "ChatGPT", "Google AIモード・Gemini"],
            rows: [
              ["商品データの入口", "サイトの読み取り（OAI-SearchBot）、商品フィード、Shopify・Etsyの連携", "Merchant Center の商品データ（Shopping Graph）、サイトの構造化データ"],
              ["申し込み", "販売店向けページのフォーム（順番待ちあり）", "Merchant Center に登録。UCPの購入はさらに申し込みと選考"],
              ["AIの中での購入", "単独のInstant Checkoutから離れ、販売店のサイトで購入", "UCPで一部の販売店が対応。米国の商品から"],
              ["日本のショップ", "標準のフィードの対象国は米国", "Merchant Center は日本でも使える。UCPの購入・AIの分析の一覧に日本はない"],
              ["費用", "ChatGPTから始まった購入に手数料はないと明記", "商品の無料掲載とは別に、広告は有料（この記事では扱わない）"],
            ],
            caption: "2026年11月22日に確認。出典は表のすぐ下に載せています。",
          },
          after: [
            `表の出典：[OpenAI 販売店向けページ](${SRC.merchants})、[Merchant Center ヘルプ](${SRC.gUcp})、[UCPのガイド](${SRC.gUcpGuide})、[Merchant Center のAIの分析](${SRC.gInsights})。`,
            `日本のショップにとっては、Googleのほうが今すぐ手を付けられることが多い、というのが2026年11月時点の状況です。Merchant Centerの商品データと、商品ページの構造化データ（Product・Offer の価格・通貨・在庫）をそろえておけば、AIモードの材料にも、通常のショッピングの結果にもなります。商品ページの構造化データの必須項目は[Googleの販売者のリスティングの説明](${SRC.merchantListing})にあります。`,
          ],
        },
        {
          heading: "日本のショップが、いまやること（優先順）",
          list: [
            "商品ページの本文に、商品名・税込価格・在庫・送料・ブランド・素材やサイズを文字で書く。価格や仕様を画像だけにしない。",
            "商品ページの構造化データ（Product・Offer）に、価格・通貨・在庫が入っていて、見える文章と一致していることを確かめる。",
            "robots.txt で OAI-SearchBot などのAI検索のクローラを止めていないこと、CDNやファイアウォールのボット対策で商品ページが弾かれていないことを確かめる。",
            "Google Merchant Center に商品を登録し、価格・在庫・送料・返品条件をサイトと同じにする。",
            "モール（楽天・Amazonなど）にも出店している場合、同じ商品の商品名・価格・JANコードの食い違いを減らす。",
            "米国にも販売している、または今後販売する場合は、OpenAIの販売店向けページから申し込み、フィードの準備（SKUを変えない、在庫と価格を更新する）を進める。",
            "AIの回答に出ているかを、決まった質問で定期的に記録する（下の「確かめ方」）。",
          ],
        },
        {
          heading: "WordPress（WooCommerce）での手順",
          paragraphs: [
            `[Nurevo AEO（WordPress.orgの無料プラグイン）](${WP_ORG})は、サイトの種類で「ネットショップ」を選ぶと（WooCommerceが有効なら自動で提案されます）、店の情報を OnlineStore として出力し、商品の一覧（商品名・価格・通貨、わかる場合の在庫）と返品ポリシーを構造化データに載せます。商品ページの Product の構造化データはWooCommerce側の出力をそのまま使い、重ねて出しません。WooCommerceの商品は llms.txt にも載ります。AI検索のクローラ（OAI-SearchBot・PerplexityBot など）は robots.txt で許可されます。`,
            "一方で、NurevoはOpenAIやMerchant Center向けの商品フィードは作りません。フィードは、WooCommerce用のフィードのプラグインや、Merchant Centerとの連携の仕組みで作ります。Nurevoの役割は、フィードの元になる商品ページとショップの事実を、AIが読める形で正しくそろえることです。",
          ],
          list: [
            "WooCommerceの商品にSKUを入れる（フィードの item_id に使い、途中で変えない）。",
            "在庫管理をオンにして、在庫ステータスを正しく保つ。予約販売・取り寄せは、その旨を商品ページにも書く。",
            "Nurevo の設定でサイトの種類を「ネットショップ」にし、返品・返金ポリシーと配送のページを指定する。",
            "Merchant Center に商品を送る仕組みを入れ、価格・在庫がサイトと一致していることを確かめる。",
            "価格を変えたら、商品ページ・フィード・Merchant Center・モールを同じ日に直す。",
          ],
        },
        {
          heading: "確かめ方：読めているか、出ているか",
          paragraphs: [
            "まず、AIのクローラが商品ページを読めるかを確かめます。example.jp と商品ページのURLを自分のものに置き換えて使います。",
          ],
          code: CHECK,
          after: [
            "ボット対策のサービスは、名乗るユーザーエージェントだけでなくIPアドレスなども見ていることが多いので、200が返っても本物のクローラが通る保証にはなりません。ボット対策の管理画面の記録も見てください。",
            "次に、AIの回答に出ているかを記録します。「◯◯（商品カテゴリ）のおすすめは？」「◯◯で送料無料の店は？」のように、店名を入れない質問を5〜10個決め、毎月同じ日にChatGPT・Perplexity・GoogleのAIモードで聞き、回答の本文や出典に自社の店名・商品ページが出たかを記録します。手順は[AIでの登場率の測り方](/guide/measure-ai-visibility)にあります。日本から聞くと、ショッピングの商品の一覧ではなく、文章の回答と出典のリンクとして出ることがあるので、どちらで出たかも分けて書きます。",
            "Nurevoの無料の月1回のチェックとProの計測も、店名を入れないカテゴリの質問で調べます。Proの計測は現在 Perplexity が対象で、ChatGPTは設定され次第です。料金は Free 0円、Standard 月3,000円、Pro 月14,800円〜です。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "商品ページに、商品名・税込価格・在庫・送料・ブランドが文字で書かれている。",
            "商品ページの構造化データの価格・通貨・在庫が、見える文章と一致している。",
            "robots.txt で OAI-SearchBot などのAI検索のクローラを止めていない。",
            "ボット対策で商品ページが弾かれていないことを、管理画面の記録でも確かめた。",
            "SKUが入っていて、途中で変えていない。",
            "Merchant Center の価格・在庫・送料・返品条件がサイトと同じ。",
            "モールの同じ商品と、商品名・価格・JANコードが食い違っていない。",
            "OpenAIのフィードに申し込むかどうかを、販売する国（米国向けかどうか）で判断した。",
            "「ChatGPTで買える」「AIに必ず出る」とお客様や社内に約束していない。",
            "店名を入れない質問で、AIの回答への登場を毎月記録している。",
          ],
        },
      ],
      faqs: [
        { q: "ChatGPTのショッピングの結果は広告ですか？", a: "OpenAIは、商品の結果は広告ではなく、利用者の質問との関係で選ぶと説明しています。ChatGPTの広告は回答とは別の枠で、別の仕組みです。" },
        { q: "商品フィードがないと、ChatGPTに商品は出ませんか？", a: "OpenAIの販売店向けページでは、サイトがすでに読まれていればフィードは必須ではなく、フィードは情報をより細かく管理するための手段とされています。商品ページを読める状態にしておくことが先です。" },
        { q: "日本のショップもOpenAIに商品フィードを申し込めますか？", a: "申し込みフォームの本社の国には日本があります。ただし2026年11月時点で、ショッピングは米国の利用者向けで、標準のフィードの対象国も米国です。日本国内だけで販売している場合、申し込んでもすぐに日本の利用者の回答に出るとは限りません。" },
        { q: "ChatGPTの中で商品を買ってもらえますか（Instant Checkout）？", a: "OpenAIは単独のInstant Checkoutから離れ、購入は販売店のサイトやアプリで完了する形を優先すると明記しています。ChatGPTから自社の商品ページに来てもらい、そこで買ってもらう前提で準備するのが現実的です。" },
        { q: "Shopifyではなく WooCommerce でも大丈夫ですか？", a: "OpenAIの説明では、ShopifyとEtsyは商品データがすでに連携されていますが、それ以外のショップもサイトの読み取りやフィードで材料になり得ます。WooCommerceでは、商品ページの文章と構造化データ、SKUと在庫をそろえることから始めます。" },
        { q: "GoogleのAIモードに商品を出すには何をすればいいですか？", a: "Googleは、AIモードの買い物は Shopping Graph が元で、商品データの中心は Merchant Center だとしています。Merchant Center に商品を登録し、サイトの構造化データと価格・在庫を一致させるのが基本です。AIモード専用の特別なマークアップはありません。" },
        { q: "Nurevo は商品フィードを作ってくれますか？", a: "作りません。Nurevo は、ショップ（OnlineStore）と商品の一覧、返品ポリシー、llms.txt を、WooCommerceの商品の構造化データと重ねずに出力し、AI検索のクローラを許可します。フィードは、WooCommerce用のフィードのプラグインやMerchant Centerとの連携で作ります。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "商品ページを、AIがどう読んでいるか確認",
        body: "無料チェックは登録不要で、URLを入れるだけで構造化データ・llms.txt・AIクローラの許可の状態がわかります。商品フィードを作る前に、元になるショップのページがそろっているかを確かめられます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "WordPressのプラグインを無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、Google・Gemini・Merchant Center はGoogle LLC、PerplexityはPerplexity AI、ShopifyはShopify Inc.、EtsyはEtsy, Inc.の商標です。WordPressはWordPress Foundation、WooCommerceはAutomatticの商標です。Nurevoはこれらの企業と提携・承認の関係にありません。",
    },
    en: {
      title: "ChatGPT Shopping Product Feeds: How Products Get In | Nurevo",
      description: "How ChatGPT picks products (crawled pages, merchant feeds, Shopify and Etsy), the required feed fields, how it differs from Google AI Mode, and the WooCommerce steps.",
      h1: "How products get into ChatGPT shopping: product feeds, how it differs from Merchant Center, and what a shop outside the US can do now",
      lead: "ChatGPT's shopping results are not ads. They are chosen from what ChatGPT reads on your site, from product feeds merchants send, and from Shopify and Etsy catalog data. OpenAI says a feed is not required if ChatGPT can already crawl your site; a feed gives you more control. As of November 2026, shopping is live for ChatGPT users in the US, so for most shops the first job is making product pages readable and keeping prices and stock identical everywhere.",
      intro: [
        "Written November 22, 2026 (JST). OpenAI and Google facts were checked on their official pages that day. This is for people who run their own online shop, for example on WooCommerce, and for the agencies that build and maintain those shops.",
        "AI answers and product listings vary by day, wording, and the user's country and plan. This is not a way to guarantee your products appear. It is a way to make them readable to AI and to pick the programs that actually apply to you. Availability will change, so recheck the official pages before you apply.",
        "The shop-wide basics (OnlineStore markup, return policy and so on) are in [AI search for online shops](/guide/online-shop-ai-search). This guide is only about how individual products get into AI shopping answers.",
      ],
      sections: [
        {
          heading: "What the popular articles leave out",
          paragraphs: [
            "We read eight Japanese and eight English articles that rank for queries like \"how to get products into ChatGPT shopping\" and \"AI Mode Merchant Center\". The newer ones cover feed fields and the application well, but many were written around the 2025 launch and never updated. These gaps came up repeatedly.",
          ],
          table: {
            head: ["Gap", "What this guide covers"],
            rows: [
              ["Assumes Instant Checkout (buying inside ChatGPT) is still the model", "OpenAI has moved away from a standalone Instant Checkout; purchases finish on the merchant's site. Checked on the official page"],
              ["No word on non-US shops", "A table of where ChatGPT shopping, Google UCP checkout and Merchant Center AI insights are available"],
              ["ChatGPT and Google treated as one thing", "One table comparing data entry points, application, checkout and fees"],
              ["No WooCommerce steps, or a single plugin pitch", "What to fix before a feed, commands to check a WordPress shop, and what Nurevo does and does not do"],
              ["No way to measure", "How to check from outside the US and how to log appearances in AI answers"],
            ],
            caption: "Trends across the articles read on November 22, 2026, not a verdict on any single one. Feed vendors and commerce platforms often go deeper on individual feed fields.",
          },
        },
        {
          heading: "November 2026: AI shopping features and where they are available",
          table: {
            head: ["Feature", "Status", "Outside the US (e.g. Japan)", "Source"],
            rows: [
              ["ChatGPT shopping results", "Shown as regular, unsponsored results with images, prices and merchants", "OpenAI's merchant page says shopping is \"currently live for ChatGPT users in the U.S.\"", `[OpenAI merchants page](${SRC.merchants})`],
              ["Product feeds to ChatGPT", "Apply through the merchant page form (waitlist if you already applied). A self-serve platform is in the works", "Japan is in the form's headquarter-country list, but the standard feed upload targets the US (the shared format covers US, CA and MX; other markets need OpenAI to confirm)", `[Merchants page](${SRC.merchants}), [feed spec](${SRC.feedSpec})`],
              ["Buying inside ChatGPT (Instant Checkout)", "OpenAI says it is moving away from a standalone Instant Checkout and prioritizing merchant-owned checkout", "—", `[Merchants page](${SRC.merchants})`],
              ["Buying in Google AI Mode and Gemini (UCP)", "Select merchants; products sold in the US now, Canada and Australia next, the UK later", "Japan is not mentioned on the official pages", `[Merchant Center Help](${SRC.gUcp}), [UCP guide](${SRC.gUcpGuide})`],
              ["Merchant Center conversational attributes", "New attributes such as answers to common product questions, compatible accessories and substitutes; Google says conversational attributes are available to retailers globally", "Available (some attributes roll out to a small group first)", `[Google, Jan 2026](${SRC.gJan}), [Google, May 2026](${SRC.gGml})`],
              ["Merchant Center AI performance insights", "Rolling out in the US, Canada, Australia, India and New Zealand", "Japan not listed", `[Merchant Center Help](${SRC.gInsights})`],
            ],
            caption: "Checked November 22, 2026. OpenAI's merchant page shows no date. We found no OpenAI page that says whether Japanese users see the shopping results interface.",
          },
        },
        {
          heading: "Where ChatGPT gets product information",
          paragraphs: [
            `OpenAI describes three entry points. The first is the public web, read by ChatGPT's search crawler, OAI-SearchBot. OpenAI says sites that block OAI-SearchBot in robots.txt won't appear in ChatGPT search answers, and that robots.txt changes take about 24 hours to take effect ([OpenAI bots documentation](${SRC.bots})).`,
            `The second is a product feed sent by the merchant. The merchant page FAQ answers "Do I need a product feed if ChatGPT already crawls my site?" with no, adding that feeds give you greater control. The third is Shopify and Etsy: if you sell there, OpenAI says your catalog is already integrated and no extra setup or application is needed ([merchants page](${SRC.merchants}), [OpenAI Help: shopping from Shopify merchants](${SRC.shopifyHelpEn})).`,
            `On which products are shown, OpenAI's September 2025 launch post says results are organic and unsponsored, ranked on relevance to the user. Where several merchants sell the same product, it looks at availability, price, quality, and whether the merchant is the maker or primary seller ([OpenAI: Buy it in ChatGPT](${SRC.buyIt}); the Instant Checkout and fee parts of that post have since been superseded by the merchant page).`,
          ],
          after: [
            "So even a shop that cannot send a feed can be source material, as long as product pages are readable and state price, stock, brand and description plainly. Pages where the price is only in an image, stock loads later through JavaScript, or bot protection turns crawlers away are harder to use.",
          ],
        },
        {
          heading: "ChatGPT product feeds: required fields and how to apply",
          paragraphs: [
            `OpenAI's developer spec lists nine required fields plus the country fields ([product feed spec](${SRC.feedSpec})). Here is where each one comes from in WooCommerce.`,
          ],
          table: {
            head: ["Feed field", "Meaning", "WooCommerce source"],
            rows: [
              ["item_id", "A stable ID per product", "SKU (or product ID). Never change it"],
              ["title", "Product name", "Product name, without stuffed symbols or slogans"],
              ["description", "Product description", "Description body: material, size, use"],
              ["url", "Product page URL", "Permalink"],
              ["brand", "Brand", "Brand attribute or taxonomy (your own brand if none)"],
              ["seller_name", "Seller name", "Shop name, as on your legal notice page"],
              ["image_url", "Product image URL", "Product image"],
              ["availability", "Stock (in_stock, out_of_stock, pre_order, backorder, unknown)", "Stock status"],
              ["price", "Price with currency", "Sale price"],
              ["target_countries, store_country", "Countries you sell to, and the store's country", "Shipping country settings"],
            ],
            caption: "Products with variations, and merchants using ChatGPT ads or checkout integrations, have extra conditionally required fields. GTIN, shipping and return fields are optional but help identify the product.",
          },
          after: [
            `You apply through the form on the [merchants page](${SRC.merchants}), giving your company, site, main category and number of SKUs. Merchants who are invited follow the developer steps: claim the business in Business Hub, verify identity, choose the countries and currencies you sell in, then send the feed by manual upload, a hosted HTTPS URL or SFTP, as a full snapshot each time ([submitting feeds](${SRC.feedGuide})). Update the feed when price or stock changes.`,
            "The official pages we read state no approval time or criteria. As of November 2026 the standard feed targets the US. A shop that only sells in Japan may still want to apply, but shouldn't expect that alone to put it in Japanese users' answers.",
          ],
        },
        {
          heading: "How Google AI Mode and Gemini differ",
          paragraphs: [
            `Google says shopping in AI Mode and Gemini is powered by the Shopping Graph, with Merchant Center as the central hub for product data, and that adopting UCP checkout doesn't influence how offers are ranked ([UCP FAQ](${SRC.gUcpFaq})). There is no special markup for AI features in Search: keep structured data consistent with visible text and Merchant Center up to date ([Google: AI features and your website](${SRC.gAi})).`,
          ],
          table: {
            head: ["", "ChatGPT", "Google AI Mode and Gemini"],
            rows: [
              ["Product data entry", "Crawled pages (OAI-SearchBot), product feeds, Shopify and Etsy catalogs", "Merchant Center product data (Shopping Graph), on-site structured data"],
              ["Application", "Merchant page form (waitlist)", "Merchant Center sign-up; UCP checkout needs a further application and selection"],
              ["Buying in the AI", "Moving away from standalone Instant Checkout; purchase on the merchant's site", "UCP checkout for select merchants, starting with US products"],
              ["Shops outside the US", "Standard feed targets the US", "Merchant Center works in Japan; UCP checkout and AI insights lists don't include Japan"],
              ["Fees", "OpenAI says no fees on purchases that start in ChatGPT", "Free product listings; ads are paid (not covered here)"],
            ],
            caption: "Checked November 22, 2026. Sources are listed right below the table.",
          },
          after: [
            `Table sources: [OpenAI merchants page](${SRC.merchants}), [Merchant Center Help](${SRC.gUcp}), [UCP guide](${SRC.gUcpGuide}), [Merchant Center AI insights](${SRC.gInsights}).`,
            `For a shop in Japan, Google is where more can be done today. Keep Merchant Center data and product-page structured data (Product and Offer with price, currency and availability) in agreement, and both AI Mode and regular shopping results have accurate material. Required product markup is in [Google's merchant listing documentation](${SRC.merchantListing}).`,
          ],
        },
        {
          heading: "What to do now, in order",
          list: [
            "Write product name, price including tax, stock, shipping, brand, material and size as text on the product page. Don't put price or specs only in images.",
            "Check that the product page's structured data (Product, Offer) carries price, currency and availability, and that it matches the visible text.",
            "Make sure robots.txt doesn't block OAI-SearchBot and other AI search crawlers, and that CDN or firewall bot protection doesn't turn product pages away.",
            "Put products in Google Merchant Center with the same price, stock, shipping and return terms as the site.",
            "If you also sell on marketplaces, reduce mismatches in product name, price and GTIN for the same item.",
            "If you sell, or plan to sell, to the US, apply on OpenAI's merchant page and prepare a feed (stable SKUs, price and stock updates).",
            "Log whether you appear in AI answers with a fixed set of questions (see \"How to check\" below).",
          ],
        },
        {
          heading: "Steps on WordPress (WooCommerce)",
          paragraphs: [
            `With [Nurevo AEO (free on WordPress.org)](${WP_ORG}), choosing the Online shop site type (suggested automatically when WooCommerce is active) publishes the business as an OnlineStore with your product catalogue (names, prices, currency, and stock where known) and return policy. Product pages keep WooCommerce's own Product markup, with no duplicates. WooCommerce products are also listed in llms.txt, and AI search crawlers such as OAI-SearchBot and PerplexityBot are allowed in robots.txt.`,
            "Nurevo does not build product feeds for OpenAI or Merchant Center. Use a WooCommerce feed plugin or a Merchant Center integration for that. Nurevo's job is to make the pages and shop facts behind the feed accurate and readable to AI.",
          ],
          list: [
            "Give every WooCommerce product a SKU (it becomes item_id; never change it).",
            "Turn on stock management and keep stock status accurate. Say so on the page for pre-orders and backorders.",
            "In Nurevo settings, set the site type to Online shop and point it at your returns and shipping pages.",
            "Install a way to send products to Merchant Center and confirm price and stock match the site.",
            "When a price changes, update the product page, feeds, Merchant Center and marketplaces on the same day.",
          ],
        },
        {
          heading: "How to check: readable, and appearing",
          paragraphs: [
            "First, check that AI crawlers can read your product pages. Replace example.com and the product URL with your own.",
          ],
          code: CHECK_EN,
          after: [
            "Bot protection usually looks at more than the claimed user agent, such as IP addresses, so a 200 here doesn't prove the real crawler gets through. Check your bot protection logs as well.",
            "Next, log appearances. Pick 5 to 10 questions that don't name your shop, such as \"best [product category]\" or \"[category] with free shipping\", and ask them on the same day each month in ChatGPT, Perplexity and Google AI Mode. Record whether your shop or product pages appear in the answer text or sources. The method is in [How to measure AI visibility](/guide/measure-ai-visibility). Outside the US you may appear as a cited link in a text answer rather than in a product carousel, so note which.",
            "Nurevo's free monthly check and the Pro measurement also use category questions without your shop's name. Pro measurement currently runs on Perplexity, with ChatGPT once configured. Plans: Free $0, Standard $20/month, Pro from $99/month.",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "Product pages state name, price, stock, shipping and brand in text.",
            "Price, currency and stock in the structured data match the visible text.",
            "robots.txt doesn't block OAI-SearchBot or other AI search crawlers.",
            "Bot protection logs confirm product pages aren't turned away.",
            "Every product has a SKU that never changes.",
            "Merchant Center price, stock, shipping and returns match the site.",
            "Marketplace listings for the same item match on name, price and GTIN.",
            "Decided whether to apply for OpenAI feeds based on where you sell (the US or not).",
            "Haven't promised clients or colleagues \"buy it in ChatGPT\" or \"always shown by AI\".",
            "Log appearances monthly with questions that don't name the shop.",
          ],
        },
      ],
      faqs: [
        { q: "Are ChatGPT shopping results ads?", a: "OpenAI says product results are organic and unsponsored, ranked on relevance to the user. ChatGPT ads are a separate, labeled placement and a separate system." },
        { q: "Without a product feed, can my products appear in ChatGPT?", a: "OpenAI's merchant page says a feed isn't required if ChatGPT already crawls your site; feeds give you greater control. Make product pages readable first." },
        { q: "Can a shop in Japan send a product feed to OpenAI?", a: "Japan is in the application form's country list. But as of November 2026, shopping is live for US users and the standard feed upload targets the US. A shop selling only in Japan shouldn't expect an application alone to put it in Japanese users' answers." },
        { q: "Can customers buy inside ChatGPT (Instant Checkout)?", a: "OpenAI says it is moving away from a standalone Instant Checkout and prioritizing merchant-owned checkout. Plan for ChatGPT to send shoppers to your product page, where they buy." },
        { q: "Does this work on WooCommerce, not just Shopify?", a: "OpenAI says Shopify and Etsy catalogs are already integrated, but other shops can be source material through crawled pages and feeds. On WooCommerce, start by aligning product page text, structured data, SKUs and stock." },
        { q: "What do I need to appear in Google AI Mode shopping?", a: "Google says AI Mode shopping is powered by the Shopping Graph, with Merchant Center as the central hub. Register products in Merchant Center and keep price and stock matching your structured data. There is no AI Mode-specific markup." },
        { q: "Does Nurevo create product feeds?", a: "No. Nurevo publishes the OnlineStore, product catalogue, return policy and llms.txt without duplicating WooCommerce's Product markup, and allows AI search crawlers. Use a WooCommerce feed plugin or Merchant Center integration for feeds." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See how AI reads your product pages",
        body: "The free check needs no sign-up: enter a URL to see structured data, llms.txt and AI crawler access. Use it before building a feed to confirm the shop pages behind it are in order.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "Try the free WordPress plugin", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI; Google, Gemini and Merchant Center of Google LLC; Perplexity of Perplexity AI; Shopify of Shopify Inc.; Etsy of Etsy, Inc. WordPress is a trademark of the WordPress Foundation and WooCommerce of Automattic. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
