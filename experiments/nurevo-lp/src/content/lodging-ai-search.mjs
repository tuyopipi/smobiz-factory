// Content page: AI search (AEO) for hotels, ryokan, guesthouses and vacation
// rentals. Industry page.
//
// Written 2026-11-10 (JST). Every claim about Nurevo AEO is one the plugin's
// readme makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt)
// or its code: the "Lodging" wizard card sets LodgingBusiness and keeps Hotel
// (includes/setup-wizard.php); "Business type (schema.org type)" in Settings
// takes any schema.org type name (nurevo-webmcp.php); services are published
// as Service + Offer + ReserveAction and an llms.txt line. The plugin does not
// output checkinTime, checkoutTime or amenityFeature today, so the copy tells
// readers to put those in page text and FAQ. Pro measurement runs on
// Perplexity (docs/pro-measurement-implementation.md).
//
// Outside facts, checked on the primary pages linked in the copy:
// - schema.org LodgingBusiness (checked 2026-11-10, schema.org V30.1): under
//   LocalBusiness; own properties amenityFeature, audience, availableLanguage,
//   checkinTime, checkoutTime, numberOfRooms, petsAllowed, starRating; more
//   specific types BedAndBreakfast, Campground, Hostel, Hotel, Motel, Resort,
//   VacationRental. schema.org/docs/hotels.html: business vs accommodation
//   (HotelRoom, Suite...) vs offer; amenityFeature does not say free or paid.
// - Google "AI features and your website" (checked 2026-11-01 for the salon
//   page): no additional requirements or special schema for AI Overviews / AI
//   Mode; structured data should match the visible text.
// - Google LocalBusiness structured data (checked 2026-10-29): name + address
//   required; use the most specific sub-type.
// - Google Hotel price structured data reference (checked 2026-11-10): it is
//   for Google's hotel price accuracy checks (Hotel Center), not a requirement
//   for AI answers.
// - Japan Tourism Agency, "違法物件の掲載の防止について" (checked 2026-11-10):
//   minpaku intermediaries must confirm the notification number and must not
//   list properties they cannot confirm; listings show the number.
// - National Tax Agency, tax answer 6902 (checked 2026-11-01): prices shown to
//   consumers in advance must include consumption tax.
// Re-check these when you update the page, and update the date with them.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  lodging: "https://schema.org/LodgingBusiness",
  hotelsDoc: "https://schema.org/docs/hotels.html",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  hotelPrice: "https://developers.google.com/hotels/hotel-prices/structured-data/hotel-price-structured-data",
  jtaMinpaku: "https://www.mlit.go.jp/kankocho/minpaku/business/mediation/prevention.html",
  ntaTotal: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6902.htm",
};

export default {
  slug: "lodging-ai-search",
  targetQueries: [
    "hotel AI search optimization",
    "how to get my hotel recommended by ChatGPT",
    "hotel schema markup LodgingBusiness",
    "ホテル 旅館 AI検索対策",
    "宿 ChatGPT おすすめ 表示",
    "宿泊施設 構造化データ",
  ],
  related: ["local-business-schema-seo-plugins", "llms-txt", "measure-ai-visibility", "appear-in-chatgpt", "aeo-wordpress"],
  locales: {
    ja: {
      title: "ホテル・旅館・民泊のAI検索対策：宿の事実をAIに伝える | Nurevo",
      description: "宿のAI検索対策は、チェックイン時刻・設備・客室・料金の考え方・アクセス・予約方法を公式サイトの本文と構造化データで正確に出し、OTAと値をそろえることから。手順とチェック表。",
      h1: "ホテル・旅館・民泊のAI検索対策：チェックイン・設備・予約をAIに正しく読ませる手順",
      lead: "ホテル・旅館・民泊のAI検索対策（AEO）の中心は、「子連れで泊まれる温泉宿」「駐車場が無料で21時以降にチェックインできるホテル」のような条件つきの質問に、AIが推測せずに答えられる事実を公式サイトに書くことです。チェックイン・アウトの時刻、設備、客室の種類、料金の決まり方、アクセス、予約の方法を、ページ本文と構造化データ（schema.orgのLodgingBusinessやHotel）で正確に出し、予約サイト（OTA）やGoogleビジネスプロフィールと同じ値にそろえます。",
      intro: [
        "作成日：2026年11月10日（JST）。schema.org・Google・観光庁・国税庁の情報は、本文に記した日に各公式ページで確認したものです。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが宿の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "旅行者はAIに何を聞き、AIは何を手がかりに宿を選ぶか",
          paragraphs: [
            "ChatGPT、Perplexity、GoogleのAI Overviewsなどに宿を探す質問をすると、AIはウェブ上の情報を読んで候補をまとめます。宿の質問は、場所だけでなく条件の組み合わせになるのが特徴です。「京都駅から30分以内で、部屋に露天風呂がある旅館」「犬と泊まれて、夕食を部屋で食べられる宿」「深夜着でもチェックインできる空港近くのホテル」「車いすで使える大浴場があるホテル」のように、時刻・設備・客層・アクセスがからみます。",
            "AIがこうした質問に答えるには、それぞれの条件が文字として、どこかに確かめられる形で書かれている必要があります。公式サイトの設備一覧が画像だけ、チェックインの最終時刻がどこにも書かれていない、ペットの可否が「お問い合わせください」だけ、といった状態では、AIは予約サイトや口コミサイトの情報、あるいは推測に頼ることになります。予約サイトの情報が古いと、古い情報のまま紹介されることもあります。",
            `Googleは、AI OverviewsやAI Modeに出るための追加の要件や特別なschema.orgの構造化データはなく、構造化データはページの見える文章と一致させる、といった通常の基本が大切だとしています（2026年11月1日確認）。[Google：AI features and your website](${SRC.googleAi})。宿のAI検索対策も、裏技ではなく、宿の事実を正しく、どこでも同じ値で出すことが本体です。`,
          ],
        },
        {
          heading: "公式サイトとOTAの役割：どちらか一方では足りない理由",
          paragraphs: [
            "多くの宿は、楽天トラベル・じゃらん・Booking.com・Expediaなどの予約サイト（OTA）に掲載されています。OTAのページは情報量が多く、AIの出典に使われることもあります。それでも公式サイトを整える意味は、宿のことを宿自身の言葉で、いちばん詳しく正確に書ける場所が公式サイトだけだからです。",
          ],
          table: {
            head: ["項目", "公式サイトでできること", "OTA・Googleビジネスプロフィールで気をつけること"],
            rows: [
              ["宿の名前", "正式名称と読み方、英語表記を決めて統一する", "掲載名を公式サイトと同じにする（旧館名・略称のままにしない）"],
              ["チェックイン・アウト", "開始時刻と最終時刻、遅れる場合の連絡方法まで書ける", "OTAの設定値が公式サイトと同じか、改定のたびに確認する"],
              ["設備・サービス", "大浴場の時間、貸切風呂の予約方法、送迎の条件など、細かい条件まで書ける", "設備のチェック項目が実態と一致しているか（廃止した設備が残っていないか）"],
              ["客層・条件", "子連れ・ペット・バリアフリー・食物アレルギー対応などを、できること・できないことに分けて書ける", "OTAの項目にない条件は、公式サイトのFAQで補う"],
              ["料金", "料金が日や人数でどう変わるか、税・サービス料の扱いを説明できる", "表示価格の条件（税込か、1室か1名か）が公式サイトと矛盾しないか"],
            ],
            caption: "公式サイトは「理由と条件まで書ける場所」、OTAとGoogleビジネスプロフィールは「同じ値がそろっているか確認する場所」と考えると整理しやすくなります。",
          },
          after: [
            "AIの回答で名前や条件が食い違うときは、多くの場合、どこかに古い値が残っています。料金改定・設備の変更・リニューアル・休館のときは、公式サイト・OTA各社・Googleビジネスプロフィール・llms.txtを一緒に更新する手順を決めておくと、食い違いを減らせます。",
          ],
        },
        {
          heading: "公開しておきたい宿の情報と構造化データ",
          paragraphs: [
            `構造化データでは、宿を[schema.orgのLodgingBusiness](${SRC.lodging})として表します。LodgingBusinessはLocalBusinessの一種で、より具体的な種類としてHotel・Resort・Hostel・BedAndBreakfast・Motel・Campground・VacationRentalがあります。LodgingBusiness自身には、checkinTime（チェックインできる最も早い時刻）、checkoutTime、amenityFeature（設備）、petsAllowed（ペット可否）、numberOfRooms（客室数）、availableLanguage（対応言語）、starRating、audienceといった項目があります（2026年11月10日、schema.org V30.1で確認）。Googleのローカルビジネスの構造化データでは、nameとaddressが必須で、できるだけ具体的な種類を使うよう案内されています（2026年10月29日確認）。[Google：ローカルビジネスの構造化データ](${SRC.googleLocal})`,
          ],
          table: {
            head: ["情報", "ページ本文での書き方", "対応するschema.orgの項目"],
            rows: [
              ["宿の種類と名前", "ホテル・旅館・ゲストハウス・一棟貸しなど、実態を一言で", "Hotel、Resort、Hostel、BedAndBreakfast、VacationRentalなど／name"],
              ["住所・アクセス", "番地・建物名、最寄り駅や空港からの手段と所要時間、送迎の有無と条件を文字で", "address、geo"],
              ["チェックイン・アウト", "「15:00〜22:00」のように開始と最終の時刻を。最終時刻を過ぎる場合の連絡方法も", "checkinTime、checkoutTime"],
              ["設備", "大浴場・貸切風呂・駐車場（料金・台数）・Wi-Fi・EV充電など。有料か無料かも書く", "amenityFeature（無料・有料の区別は含まないので本文で書く）"],
              ["ペット・子ども・バリアフリー", "可否だけでなく条件（頭数・大きさ・添い寝の年齢・段差のない客室の数）まで", "petsAllowed、audienceなど"],
              ["客室", "客室の種類ごとに、広さ・定員・ベッドや布団・眺め・部屋風呂の有無", "HotelRoom、Suiteなど（宿とは別のもの＝Accommodationとして表す）"],
              ["対応言語", "フロントや予約で対応できる言語", "availableLanguage"],
              ["予約方法", "公式予約ページへのリンク、電話番号、受付時間", "telephone、予約URL"],
            ],
            caption: "schema.orgの項目名は2026年11月10日にschema.orgで確認したものです。Googleの検索結果で必須・推奨とされているのはローカルビジネスのドキュメントにある項目で、これらすべてがGoogleの必須項目というわけではありません。",
          },
          after: [
            `schema.orgの宿泊施設向けの解説では、宿そのもの（LodgingBusiness）、泊まる部屋（HotelRoomなどのAccommodation）、その販売条件（Offer）を分けて考えるよう示されています。また、amenityFeatureは設備が無料か有料かまでは表さないとしています。[schema.org：Hotels](${SRC.hotelsDoc})。駐車場や朝食が有料なら、その金額は本文に書いておきます。`,
            `料金は、表示するなら税込で書きます。国税庁は、消費者にあらかじめ価格を表示する場合は、媒体を問わず消費税込みの総額を表示するよう定めています（2026年11月1日確認）。[国税庁：総額表示の義務](${SRC.ntaTotal})。宿泊料金は日・人数・プランで変わるので、決まった金額を構造化データに入れるより、「1室2名利用時の1名あたり」「入湯税・宿泊税は別」のように、価格の条件を本文で説明するほうが誤解を生みにくくなります。`,
            `Googleには、ホテルの料金を構造化データで示すためのドキュメントもありますが、これはGoogleのホテル広告などでの料金の正確さの確認（Hotel Center）に使うものです（2026年11月10日確認）。[Google：Hotel price structured data](${SRC.hotelPrice})。AIの回答に出るための必須条件ではありません。`,
          ],
        },
        {
          heading: "民泊・一棟貸しで気をつけること",
          paragraphs: [
            `住宅宿泊事業法の届出をして運営する民泊は、届出番号も事実の一つです。観光庁は、民泊の仲介サイトに掲載するときは事業者名・住所・届出番号を確認し、確認できない物件は掲載してはいけないこと、掲載ページに届出番号などを表示することを示しています（2026年11月10日確認）。[観光庁：違法物件の掲載の防止について](${SRC.jtaMinpaku})。公式サイトにも、仲介サイトと同じ届出番号・施設名・住所を載せておくと、AIや旅行者が同じ施設だと確かめやすくなります。`,
            "一棟貸しや貸別荘は、構造化データの種類としてVacationRentalがあります。最大人数、寝具の数、キッチンや洗濯機の有無、鍵の受け渡し方法、近隣への配慮のルール（騒音・ゴミ出し）は、旅行者がAIに聞きやすい項目です。スタッフが常駐しない場合は、緊急時の連絡先と対応時間も書いておきます。",
          ],
        },
        {
          heading: "WordPressの宿のサイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・SEO SIMPLE PACK・VK All in One Expansion Unitなどはそのまま使えます。`,
            "初回の設定ウィザードで「宿泊施設」を選びます。業種はLodgingBusinessになります。ホテルなら設定画面の「業種（schema.org型）」をHotelに、リゾートならResort、ゲストハウスならHostelやBedAndBreakfast、一棟貸しならVacationRentalのように、実態に近い種類に変えます。宿の名前・住所・電話番号・説明を確認し、営業時間にはフロントの受付時間を入れます。空欄の項目だけが既存の設定から補われ、入力済みの値は上書きされません。",
            "料金が決まっているもの（日帰り入浴、送迎、体験プラン、貸切風呂など）は、設定画面でサービスとして登録できます。サービス名・所要時間・料金・通貨・予約URL・説明を入れると、宿に紐づいたServiceとして構造化データ（料金はOffer、予約URLは予約のアクション）に出力され、llms.txtにも1行で載ります。日によって変わる宿泊料金は、無理に固定の金額を入れないほうが安全です。",
            "チェックイン・アウトの時刻、ペット・子ども・バリアフリーの条件、駐車場、送迎、食事の対応は、Nurevo AEOのFAQに質問と答えとして入力し、Nurevo FAQブロック（または[nurevo_faq]ショートコード）を「よくある質問」や「ご利用案内」のページに置きます。そのページのFAQPageに追加され、ページ本文にも見える形で載ります。Nurevo AEOは現在、checkinTimeやamenityFeatureを個別の項目としては出力しないため、これらは本文とFAQで伝えます。",
            "AEOスコアの画面で診断を実行し、チェックリストに出た不足をワンクリック修正で直します。構造化データ・llms.txt・AIクローラの許可（OAI-SearchBot、PerplexityBot、Claude-SearchBotなど）は無料プランで出力されます。",
            "外からどう見えるかを[無料のAI可読性チェック](/check)で確認し、OTA各社とGoogleビジネスプロフィールのチェックイン時刻・設備・名前が公式サイトと一致しているかも見直します。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の構造化データを出さず、SEOプラグインが出しているグラフに足りない住所・電話番号・営業時間・Hotelなどの種類・サービスだけを追加します。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/guide/local-business-schema-seo-plugins)をご覧ください。予約エンジンが別のドメインにある場合も、空室や料金の検索結果ではなく、宿の基本情報は公式サイトのページに文字で書いておきます。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "チェックインの開始・最終時刻とチェックアウト時刻が、公式サイト・OTA・Googleビジネスプロフィールで一致している。",
            "設備一覧が画像だけでなく文字で書かれ、有料のもの（駐車場・朝食など）は金額や条件が書かれている。",
            "ペット・子ども・バリアフリー・食物アレルギーについて、できること・できないことが条件つきで書かれている。",
            "構造化データの種類がOrganizationのままではなく、Hotel・Resort・Hostel・VacationRentalなど実態に合ったものになっている。",
            "表示している料金が税込で、1室か1名か、入湯税・宿泊税の扱いなど価格の条件が書かれている。",
            "民泊の場合、届出番号・施設名・住所が仲介サイトと公式サイトで同じ。",
            "llms.txtに、宿の概要・客室・設備・アクセス・よくある質問・予約のページが載っている。[llms.txtとは](/guide/llms-txt)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、旅行者が聞きそうな質問（地域＋条件＋目的）をAIに投げて、宿が名前やURLで出てくるかを見ます。たとえば「◯◯温泉で子連れにやさしい旅館」「◯◯駅近くで駐車場無料のホテル」です。宿の名前を入れた質問では、紹介された内容（チェックイン時刻や設備）が正しいかも確かめます。AIの回答は回ごとに変わるので、同じ質問を何度か、期間をあけて記録するのが現実的です。測り方は[AIでの登場率の測り方](/guide/measure-ai-visibility)で詳しく説明しています。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（宿の名前は含めません）をPerplexityに投げ、回答に宿の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に宿が出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "ホテル・旅館のAI検索対策は、何から始めればいいですか？", a: "チェックイン・アウトの時刻、設備、客室、ペットや子ども連れの条件、アクセス、予約方法を、公式サイトの本文に文字で正しく書くことからです。そのうえで、同じ事実をHotelなどの構造化データとllms.txtで公開し、OTAとGoogleビジネスプロフィールの値をそろえます。" },
        { q: "OTAに載っていれば、公式サイトは整えなくてもいいですか？", a: "OTAのページもAIの出典になりますが、項目が決まっているため、送迎の条件や貸切風呂の予約方法のような細かい事実は書ききれません。公式サイトは宿の事実をいちばん詳しく書ける場所です。両方を同じ値にしておくのが確実です。" },
        { q: "旅館はHotelとLodgingBusinessのどちらを使えばいいですか？", a: "schema.orgには旅館専用の種類はありません。ホテルに近い形態ならHotel、温泉や滞在型の施設ならResortなど、実態にいちばん近い種類を選び、迷う場合はLodgingBusinessのままでもかまいません。旅館であることは本文と説明文に書いておきます。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種（Hotelなど）・住所・営業時間・サービス・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTに宿が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが宿の事実を正しく読める状態をつくり、出ているか・正しく紹介されているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが宿のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。楽天トラベル、じゃらん、Booking.com、Expedia、Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的・税務上の助言ではありません。",
    },

    en: {
      title: "AI Search for Hotels, Inns & Rentals: Check-in, Amenities | Nurevo",
      description: "AEO for lodging starts with publishing check-in times, amenities, rooms, pricing rules, directions and booking correctly on your own site, matching your OTA listings.",
      h1: "AI search for hotels, inns and vacation rentals: how to get AI to read your check-in times, amenities and booking correctly",
      lead: "AI search optimization (AEO) for a hotel, inn, guesthouse or vacation rental comes down to publishing, on your own site, the facts that let an AI answer conditional questions without guessing: \"a family-friendly hot-spring inn\", \"a hotel near the airport with free parking where I can check in after 11pm\". Write your check-in and check-out times, amenities, room types, how your prices are set, directions and how to book, both in page text and in schema.org LodgingBusiness or Hotel structured data, and keep the same values on your booking-site (OTA) listings and Google Business Profile.",
      intro: [
        "Written November 10, 2026 (JST). Information from schema.org, Google and Japanese government agencies was checked on each official page on the dates given in the text.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your property's facts readable to AI. They do not guarantee that an AI will mention your property or rank it anywhere.",
      ],
      sections: [
        {
          heading: "What travelers ask AI, and what AI uses to pick a place to stay",
          paragraphs: [
            "When someone asks ChatGPT, Perplexity or Google's AI Overviews where to stay, the AI reads what it can find on the web and builds a shortlist. Lodging questions are rarely about place alone. They combine conditions: \"an inn within 30 minutes of Kyoto Station with a private open-air bath\", \"somewhere I can stay with my dog and have dinner in the room\", \"a hotel near the airport that takes late-night check-ins\", \"a hotel with a wheelchair-accessible bath\". Times, amenities, who the place suits and how to get there all come into it.",
            "To answer, an AI needs each condition written down as text somewhere it can check. If your amenities list is only an image, your latest check-in time appears nowhere, or your pet policy just says \"please contact us\", the AI has to rely on booking sites, review sites or guesswork. If a booking site's information is out of date, your property may be described with the old facts.",
            `Google says there are no additional requirements and no special schema.org structured data needed to appear in AI Overviews or AI Mode, and that the usual basics still matter, such as making structured data match the visible text (checked November 1, 2026). [Google: AI features and your website](${SRC.googleAi}). For lodging, too, the work is not a trick: it is publishing your property's facts correctly, with the same values everywhere.`,
          ],
        },
        {
          heading: "Your own site and your OTA listings: why one is not enough",
          paragraphs: [
            "Most properties are listed on booking sites (online travel agencies, or OTAs) such as Booking.com and Expedia. OTA pages are detailed and AI sometimes uses them as sources. Your own site still matters because it is the only place where you can describe your property in your own words, in the most detail and most accurately.",
          ],
          table: {
            head: ["Item", "What your own site can do", "What to watch on OTAs and Google Business Profile"],
            rows: [
              ["Property name", "Decide the official name, its reading and an English spelling, and use them everywhere", "Use the same name as your site (not an old wing name or an abbreviation)"],
              ["Check-in and check-out", "Give the start time, the latest time and what to do if you will be late", "Check after every change that the OTA settings match your site"],
              ["Amenities and services", "Spell out the details: bath hours, how to book a private bath, shuttle conditions", "Make sure the ticked amenities are real (no facility you closed is still listed)"],
              ["Who it suits", "Families, pets, accessibility, food allergies, split into what you can and cannot do", "Cover conditions the OTA has no field for in the FAQ on your site"],
              ["Prices", "Explain how prices vary by date and party size, and how tax and service charges are handled", "Make sure the price basis (tax included or not, per room or per person) does not contradict your site"],
            ],
            caption: "A simple way to think about it: your site is where you explain reasons and conditions; OTAs and Google Business Profile are where you check that the same values appear.",
          },
          after: [
            "When an AI answer gets your name or conditions wrong, there is usually an old value left somewhere. Agree on a routine for price changes, facility changes, renovations and closures: update your site, each OTA, Google Business Profile and llms.txt together.",
          ],
        },
        {
          heading: "The facts to publish, and the structured data that goes with them",
          paragraphs: [
            `In structured data, a place to stay is described as a [schema.org LodgingBusiness](${SRC.lodging}). LodgingBusiness is a kind of LocalBusiness, and its more specific types are Hotel, Resort, Hostel, BedAndBreakfast, Motel, Campground and VacationRental. LodgingBusiness itself has properties such as checkinTime (the earliest someone may check in), checkoutTime, amenityFeature, petsAllowed, numberOfRooms, availableLanguage, starRating and audience (checked November 10, 2026, schema.org V30.1). Google's local business documentation lists name and address as required and asks you to use the most specific sub-type possible (checked October 29, 2026). [Google: Local business structured data](${SRC.googleLocal})`,
          ],
          table: {
            head: ["Fact", "On the page", "Matching schema.org property"],
            rows: [
              ["Type and name", "Say in a few words what you are: hotel, inn, guesthouse, whole-house rental", "Hotel, Resort, Hostel, BedAndBreakfast, VacationRental and so on / name"],
              ["Address and directions", "Full address, how to get there from the nearest station or airport and how long it takes, whether there is a shuttle and on what terms", "address, geo"],
              ["Check-in and check-out", "Start and latest times, such as \"3pm to 10pm\", and how to tell you if you will be later", "checkinTime, checkoutTime"],
              ["Amenities", "Baths, private baths, parking (price and spaces), Wi-Fi, EV charging; say which are free and which are paid", "amenityFeature (it does not say free or paid, so put that in the text)"],
              ["Pets, children, accessibility", "Not just yes or no but the conditions: number and size of pets, age for sharing a bed, how many step-free rooms", "petsAllowed, audience and others"],
              ["Rooms", "For each room type: size, capacity, beds or futons, view, private bath or not", "HotelRoom, Suite and others (an Accommodation, separate from the business)"],
              ["Languages", "Languages your front desk and booking staff can handle", "availableLanguage"],
              ["How to book", "A link to your own booking page, phone number and hours", "telephone, booking URL"],
            ],
            caption: "Property names checked on schema.org on November 10, 2026. Google's required and recommended properties are the ones in its local business documentation; not all of these are Google requirements.",
          },
          after: [
            `schema.org's guide for hotels separates the lodging business itself, the accommodation guests stay in (an Accommodation such as a HotelRoom) and the offer it is sold under. It also notes that amenityFeature does not say whether a feature is free or charged. [schema.org: Hotels](${SRC.hotelsDoc}). If parking or breakfast costs extra, put the amount in your page text.`,
            `Show prices the way local rules require. In Japan, for example, the National Tax Agency requires prices shown to consumers in advance to include consumption tax, whatever the medium (checked November 1, 2026). [National Tax Agency: total price display (Japanese)](${SRC.ntaTotal}). Room rates change with date, party size and plan, so rather than putting a fixed price in structured data, explain the basis in your text, such as \"per person, two sharing a room\" or \"local lodging tax not included\". That is harder to misread.`,
            `Google also documents structured data for hotel prices, but that is for checking price accuracy in Google's hotel products (Hotel Center) (checked November 10, 2026). [Google: Hotel price structured data](${SRC.hotelPrice}). It is not a requirement for appearing in AI answers.`,
          ],
        },
        {
          heading: "Vacation rentals and private lodging",
          paragraphs: [
            `For private lodging, a registration or notification number is one of your facts too. In Japan, for example, the Japan Tourism Agency says private-lodging (minpaku) booking platforms must confirm the operator's name, address and notification number before listing a property, must not list a property they cannot confirm, and must show the number on the listing (checked November 10, 2026). [Japan Tourism Agency: preventing listings of illegal properties (Japanese)](${SRC.jtaMinpaku}). Rules differ by country and city, so check yours. Showing the same number, name and address on your own site as on the platforms makes it easier for AI and travelers to confirm it is the same place.`,
            "Whole-house rentals and holiday homes have their own structured data type, VacationRental. Maximum guests, the number of beds or futons, whether there is a kitchen or washing machine, how keys are handed over, and house rules for neighbors (noise, rubbish) are all things travelers ask AI about. If no staff are on site, also publish an emergency contact and the hours it is answered.",
          ],
        },
        {
          heading: "Setting it up on a WordPress lodging site",
          list: [
            `Install Nurevo AEO (free) from [WordPress.org](${WP_ORG}) and activate it. Keep Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK or VK All in One Expansion Unit if you use one.`,
            "In the setup wizard, choose \"Lodging\". The business type becomes LodgingBusiness. Change \"Business type (schema.org type)\" in Settings to the closest type: Hotel for a hotel, Resort for a resort, Hostel or BedAndBreakfast for a guesthouse, VacationRental for a whole-house rental. Confirm the name, address, phone and description, and enter your front-desk hours as the opening hours. Only blank fields are filled in from your existing settings; nothing you typed is overwritten.",
            "Anything with a set price (a day-visit bath, a shuttle, an activity, a private bath) can be added as a service under Settings. With a name, duration, price, currency, booking URL and description, it is published as a Service linked to your property (the price as an Offer, the booking URL as a reservation action) and listed as a line in llms.txt. Room rates that change by date are safer left out than forced into a fixed figure.",
            "Enter check-in and check-out times, the conditions for pets, children and accessibility, parking, shuttles and meals as questions and answers in Nurevo AEO's FAQ, and place the Nurevo FAQ block or the [nurevo_faq] shortcode on your FAQ or guest information page. The questions are added to that page's FAQPage and shown in the page text. Nurevo AEO does not currently output checkinTime or amenityFeature as separate properties, so these facts reach AI through your text and FAQ.",
            "Run the diagnosis on the AEO Score screen and apply the one-click fixes the checklist offers. Structured data, llms.txt and AI crawler access (OAI-SearchBot, PerplexityBot, Claude-SearchBot and others) are all on the free plan.",
            "See what AI reads from the outside with the [free AI readability check](/check), and confirm that the check-in times, amenities and name on each OTA and on Google Business Profile match your site.",
          ],
          after: [
            "With an SEO plugin active, Nurevo AEO does not print a second set of structured data. It adds only the missing address, phone, opening hours, a specific type such as Hotel, and your services into the graph your SEO plugin already publishes. See [adding local business schema to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins). If your booking engine runs on another domain, still write your property's basic facts as text on your own site's pages, not only in availability search results.",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Check-in start and latest times and the check-out time match across your site, OTAs and Google Business Profile.",
            "Your amenities are written as text, not only shown as an image, and paid ones (parking, breakfast) state the price or terms.",
            "Pets, children, accessibility and food allergies are covered with conditions: what you can and cannot do.",
            "The structured data type fits the property, such as Hotel, Resort, Hostel or VacationRental, not a generic Organization.",
            "Prices are shown as local rules require, with the basis stated: per room or per person, and how local lodging taxes are handled.",
            "For private lodging, the registration number, name and address are the same on the platforms and on your site.",
            "llms.txt lists your overview, rooms, amenities, directions, FAQ and booking pages. [What is llms.txt?](/guide/llms-txt)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, ask AI the questions travelers would ask (area plus condition plus purpose) and see whether your property comes up by name or URL: \"a family-friendly inn in [hot-spring town]\", \"a hotel near [station] with free parking\". With questions that include your property's name, also check that what the AI says (check-in times, amenities) is right. Answers change between runs, so ask the same questions a few times, spread over time, and keep a record. [How to measure AI visibility](/guide/measure-ai-visibility) explains the method.",
            "Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your property's name) are put to Perplexity, and the plugin records whether the answers named your property or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta: how often your property appears in AI answers, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a hotel or inn start with AI search?", a: "Write your check-in and check-out times, amenities, rooms, conditions for pets and children, directions and how to book correctly as text on your own site. Then publish the same facts as Hotel (or another lodging type) structured data and in llms.txt, and make sure your OTA listings and Google Business Profile have the same values." },
        { q: "If I am on OTAs, do I still need to fix my own site?", a: "OTA pages can be AI sources too, but their fields are fixed, so details such as shuttle conditions or how to book a private bath often do not fit. Your own site is where you can describe your property in the most detail. Keeping both in agreement is the safest approach." },
        { q: "Which type should a traditional inn use, Hotel or LodgingBusiness?", a: "schema.org has no type for traditional Japanese inns. Choose the closest type, such as Hotel or Resort for a hot-spring stay, or keep the general LodgingBusiness if none fits. Say in your text and description what kind of place it is." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type (Hotel and others), address, hours, services and FAQ structured data, llms.txt, AI crawler rules and the AEO score are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee my property appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read and keep checking whether you appear and whether you are described correctly." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your property's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Booking.com, Expedia, Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal or tax advice.",
    },
  },
};
