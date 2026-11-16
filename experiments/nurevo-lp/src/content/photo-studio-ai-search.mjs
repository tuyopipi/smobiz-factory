// Content page: AI search (AEO) for photo studios (写真館・フォトスタジオ・
// 子ども写真館・セルフ写真館・出張撮影). Industry page.
//
// Written 2026-11-16 20時 (JST). Every claim about Nurevo AEO is one the
// plugin's readme makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt,
// 0.9.2) or its source: the wizard "Other" card sets no type (includes/setup-wizard.php),
// the "Professional services" card sets ProfessionalService; services take a
// name, minutes, price, currency, category, reservation URL, description and
// URL, up to 20 (WEBMCP_CANARY_MAX_SERVICES), published as Service with an
// Offer, a duration PropertyValue in additionalProperty and a ReserveAction,
// plus an llms.txt line (nurevo-webmcp.php webmcp_canary_service_schema_nodes /
// webmcp_canary_service_llms_line). Pro measurement runs on Perplexity.
//
// Outside facts:
// - schema.org (checked in schema-dts 2.1.0 on 2026-11-16; schema.org itself
//   could not be fetched from this run): no photo-studio LocalBusiness type;
//   Photograph is a CreativeWork. ProfessionalService: "The general
//   ProfessionalService type for local businesses was deprecated due to
//   confusion with Service." priceRange is on LocalBusiness.
// - Google "AI features and your website" (checked 2026-11-01 for
//   hair-salon-ai-search, page updated 2025-12-10): no extra requirements or
//   special markup for AI Overviews / AI Mode. Not re-fetched this run.
// - Google LocalBusiness docs (checked 2026-10-29): name and address required.
// - National Tax Agency tax answer 6902 (checked 2026-11-01): prices shown to
//   consumers in advance must include consumption tax, any medium.
// - Consumer Affairs Agency, stealth marketing (checked 2026-11-01): from
//   2023-10-01; posts a business asks third parties to make count as its ads.
// Not verified this run, so not stated: the CAA price-display guideline
// (二重価格・早撮り割引の比較対照価格), portrait-rights or personal-data rules
// for children's photos, and any figure for how families use AI in Japan.
// Re-check these when you update the page, and update the date with them.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  professionalService: "https://schema.org/ProfessionalService",
  localBusiness: "https://schema.org/LocalBusiness",
  photograph: "https://schema.org/Photograph",
  ntaTotal: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6902.htm",
  caaStealth: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/stealth_marketing/",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://example.jp/#business",
      "name": "フォトスタジオ例（例）",
      "address": "〒000-0000 ◯◯県◯◯市◯◯1-2-3",
      "telephone": "+81-00-0000-0000",
      "url": "https://example.jp/",
      "openingHours": "Mo,We-Su 10:00-18:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.jp/#nurevo-service-1",
      "name": "七五三 スタジオ撮影＋データ全カット",
      "category": "七五三",
      "provider": { "@id": "https://example.jp/#business" },
      "additionalProperty": {
        "@type": "PropertyValue", "name": "duration",
        "value": 90, "unitCode": "MIN", "unitText": "minutes"
      },
      "offers": { "@type": "Offer", "price": "00000", "priceCurrency": "JPY" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.jp/reserve/753" },
        "result": { "@type": "Reservation", "name": "七五三 スタジオ撮影＋データ全カット" }
      }
    }
  ]
}`;

const SCHEMA_EN = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://example.com/#business",
      "name": "Example Photo Studio",
      "address": "123 Example Street, Example City",
      "telephone": "+1-000-000-0000",
      "url": "https://example.com/",
      "openingHours": "Mo,We-Su 10:00-18:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.com/#nurevo-service-1",
      "name": "Family studio session + all edited files",
      "category": "Family portraits",
      "provider": { "@id": "https://example.com/#business" },
      "additionalProperty": {
        "@type": "PropertyValue", "name": "duration",
        "value": 60, "unitCode": "MIN", "unitText": "minutes"
      },
      "offers": { "@type": "Offer", "price": "000", "priceCurrency": "USD" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.com/book/family" },
        "result": { "@type": "Reservation", "name": "Family studio session + all edited files" }
      }
    }
  ]
}`;

export default {
  slug: "photo-studio-ai-search",
  targetQueries: [
    "photo studio AI search optimization",
    "photographer ChatGPT recommendations",
    "photography studio schema markup",
    "写真館 AI検索対策",
    "フォトスタジオ ChatGPT 表示",
    "写真館 構造化データ",
  ],
  related: ["wedding-venue-ai-search", "hair-salon-ai-search", "local-business-schema-seo-plugins", "llms-txt", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "写真館・フォトスタジオのAI検索対策：総額・データ・衣装 | Nurevo",
      description: "写真館のAI検索対策は、撮影料ではなく持ち帰る総額、データの枚数と受け取り方、衣装と着付け、早撮りの期間、予約とキャンセルの条件を本文と構造化データで正確に出すこと。手順と表で解説。",
      h1: "写真館・フォトスタジオのAI検索対策：総額・データ納品・衣装・予約の条件をAIに正しく読ませる手順",
      lead: "写真館・フォトスタジオのAI検索対策の中心は、家族がAIに聞く「七五三でデータ全部もらうと総額いくら？」「着付けとヘアセットは込み？」「何日前まで予約を変えられる？」に、ページ本文で金額と条件を書いて答えることです。「撮影料◯円〜」だけでは、AIは総額を答えられず、安い数字だけが独り歩きします。そのうえで同じ事実を構造化データ・llms.txt・Googleビジネスプロフィール・予約サイトと一致させます。",
      intro: [
        "作成日：2026年11月16日（JST）。schema.orgの型は同日に schema-dts 2.1.0 で確認しました。Google・国税庁・消費者庁のページは2026年11月1日に確認した内容です。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが写真館の事実を正しく読める状態をつくるものです。AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "家族はAIに何を聞くか",
          paragraphs: [
            "写真館を探す質問は、行事・地域・予算・受け取り方の条件が重なった形になります。たとえば「◯◯市で七五三、データを全部もらえて3万円台の写真館」「ママの着物の着付けもしてくれるスタジオ」「兄弟で一緒に撮れて追加料金がかからないところ」「平日なら安くなる？」「雨でも神社の出張撮影は振り替えできる？」です。AIがこうした質問に写真館の名前を挙げるには、その条件を満たすことがサイトの文字から読み取れる必要があります。",
            "Googleは、AI OverviewsやAI Modeに出るための追加の要件や特別な構造化データはなく、通常のSEOの基本と、本文と一致した構造化データ、最新のビジネスプロフィールが大切だとしています。[Google：AI features and your website](" + SRC.googleAi + ")。写真館のAI検索対策も、裏技ではなく、家族が比べるときに使う数字と条件を正確に書くことが本体です。",
          ],
          table: {
            head: ["質問の型", "例", "答えに必要な事実"],
            rows: [
              ["総額", "七五三でデータ全部と着付け込みでいくら？", "撮影料・データ・衣装・着付け・ヘアの合計の例"],
              ["受け取り方", "データだけ欲しい。何枚もらえる？", "データの枚数・形式・受け取り方法と期限"],
              ["衣装・支度", "ママの着物も借りられる？", "衣装の点数・サイズ・家族の衣装・着付け"],
              ["時期", "早撮りはいつまで？", "早撮り・後撮りの期間と条件"],
              ["予約の条件", "子どもが熱を出したら変更できる？", "変更・キャンセルの期限と料金"],
              ["撮影の種類", "神社に出張してもらえる？", "スタジオ・ロケ・出張の別、出張の範囲と料金"],
            ],
          },
        },
        {
          heading: "上位の記事に足りない点",
          paragraphs: [
            "「写真館 AI検索対策」「フォトスタジオ 集客」で上位に出る日本語の記事と、「photographer AI search」「photography SEO」で上位の英語の記事を読みました。行事の時期に合わせたページの更新、総額で書くこと、作例写真の説明文、Googleビジネスプロフィールの整備は多くの記事に書かれています。この記事でもすべて扱います。",
            "一方で、次の点はどの記事にもありませんでした。データ納品の何をどこまで書くか、早撮り割引の書き方、構造化データの具体的な型（写真館専用の型はなく、ProfessionalServiceは非推奨）、WordPressでの手順、AIに出ているかの確かめ方です。英語の記事には「口コミ50件以上・星4.5以上が必要」といった数字もありましたが、出典は示されていませんでした。この記事では出典を確認できない数字は使いません。",
          ],
        },
        {
          heading: "料金は「撮影料」ではなく「持ち帰る総額」で書く",
          paragraphs: [
            "写真館の料金は、撮影料・商品（データ・アルバム・プリント）・衣装・着付け・ヘアセット・家族の追加・土日祝の料金などに分かれています。撮影料だけを大きく書くと、AIはそれを総額のように答えてしまうことがあります。よく選ばれる組み合わせごとに、合計の例を表で書いてください。",
          ],
          table: {
            head: ["書く項目", "書き方の例", "注意点"],
            rows: [
              ["撮影料", "スタジオ撮影 ◯円（税込）、土日祝は＋◯円", "平日・休日・繁忙期で変わるなら、その条件を同じ行に"],
              ["データ", "全カット ◯円／10カット ◯円", "プランに含まれるか、別料金かをはっきり"],
              ["衣装", "着物・ドレス各1着込み、追加1着 ◯円", "何着まで込みか、持ち込みの可否"],
              ["着付け・ヘアセット", "込み／◯円、家族の着付け ◯円", "込みかどうかが一番聞かれる"],
              ["家族・兄弟", "兄弟の追加 ◯円、家族写真は追加なし", "人数で増えるか"],
              ["合計の例", "七五三・データ全カット・着付けヘア込み：合計 ◯円（税込）", "よくある組み合わせを2〜3通り"],
            ],
          },
          after: [
            "料金は税込で書きます。国税庁は、消費者に対してあらかじめ価格を表示する場合は、媒体を問わず消費税込みの総額を表示するよう定めています（例：「11,000円（税込）」）。[国税庁：総額表示の義務](" + SRC.ntaTotal + ")",
            "早撮り・後撮りの割引は、割引後の金額だけでなく、対象の期間（◯月◯日〜◯月◯日の撮影）と、どの項目が割引になるかを書きます。「通常◯円のところ」と比べる書き方をする場合は、その価格が実際に使われていた価格かどうかを、消費者庁の価格表示のルールで確かめてから使ってください。",
          ],
        },
        {
          heading: "データ納品は「枚数・形式・受け取り方・期限」を書く",
          paragraphs: [
            "「データだけ欲しい」は、写真館を選ぶときの大きな理由になっています。データについては、少なくとも次のことを書いておくと、AIも人も比べやすくなります。",
          ],
          list: [
            "枚数：全カットか、選んだ枚数か。全カットなら目安の枚数（「◯カット前後」）。",
            "形式とサイズ：JPEGか、どのくらいの大きさか。SNS用の小さいデータと印刷用のデータが分かれるか。",
            "受け取り方：ダウンロード、USB、メディアなど。受け取りまでの日数。",
            "保存期限：ダウンロードできる期間、写真館が保管する期間、期限後の再発行の可否と料金。",
            "使い方の範囲：年賀状やSNSへの使用、自分で印刷することができるか。",
            "レタッチ：どこまで補正するか、追加の補正は別料金か。",
          ],
        },
        {
          heading: "衣装・支度・撮影の種類を書き分ける",
          paragraphs: [
            "衣装については「◯着以上」だけでなく、行事ごとの点数、サイズの範囲（「80〜130cm」など）、家族の衣装（ママの訪問着など）の有無、持ち込みの可否と料金を書きます。着付け・ヘアセットは、だれが・何分前から・追加料金はいくらかを書きます。",
            "撮影の種類は、スタジオ撮影、ロケーション撮影、神社やお宮参りへの出張撮影、セルフ撮影で、聞かれる条件が違います。出張撮影なら、出張できる範囲と交通費、雨の日の振り替えの条件を書きます。ブライダルの前撮りや成人式のように客層が違うものは、ページを分けると、AIが行事を取り違えにくくなります。",
          ],
        },
        {
          heading: "時期のページは年度と期間を書いて更新する",
          paragraphs: [
            "七五三・成人式・入学・卒業の撮影は時期で予約が集中します。行事ごとのページに、対象の年度（「2027年の七五三」など）と、早撮り・当日・後撮りの期間を書き、年が変わったら更新します。古い年度の料金や期間が残ったままだと、AIがそのまま答えることがあります。",
            "空き状況は日々変わるため、ページ本文には「予約の取りやすい時期」の目安だけを書き、実際の空きは予約システムのページで確かめてもらう書き方が安全です。予約の変更・キャンセルは、何日前まで無料か、それ以降はいくらかを表で書きます。子どもの体調不良による変更の扱いは、家族がよく聞く質問なので、FAQにも入れます。",
          ],
        },
        {
          heading: "作例写真と口コミの扱い",
          paragraphs: [
            "AIは写真そのものより、写真のまわりの文字を手がかりにします。作例には、何の撮影か（「七五三 3歳 女の子 スタジオ撮影」など）が分かる代替テキストと説明文を付けます。お客様の写真を作例に使うのは、掲載の同意をもらったものだけにします。",
            `口コミをAI対策のために増やしたくなるかもしれませんが、日本では2023年10月1日からステルスマーケティングが景品表示法違反になりました。消費者庁は、事業者が第三者に依頼・指示して投稿させた口コミも、その事業者の広告に含まれるとしています。[消費者庁：ステルスマーケティング](${SRC.caaStealth})。お礼として特典を付けて口コミを頼む場合も、広告であることが分かるようにしてください。`,
          ],
        },
        {
          heading: "構造化データ：写真館専用の型はない",
          paragraphs: [
            `schema.orgには写真館・フォトスタジオ専用のLocalBusinessの型はありません（Photographは写真という作品を表す型で、お店の型ではありません）。また、ProfessionalServiceは、Serviceと紛らわしいことから地域ビジネスの型としては非推奨とされています。[schema.org：ProfessionalService](${SRC.professionalService})。写真館は LocalBusiness として出し、撮影プランをService（料金はOffer）として紐づけるのが無理のない形です。[schema.org：LocalBusiness](${SRC.localBusiness})`,
            `Googleの地域ビジネスの構造化データでは、名前と住所が必須です。[Google：LocalBusiness](${SRC.googleLocal})。構造化データの値は、ページ本文・Googleビジネスプロフィール・予約サイトと一致させます。Nurevo AEOで撮影プランを入れると、Serviceは次のような形で出力されます（値は例です。LocalBusinessの部分は簡略化しています）。`,
          ],
          code: SCHEMA_JA,
          after: [
            "料金の幅が大きい場合は、LocalBusinessの priceRange に幅を書く方法もありますが、AIが総額を答えるのに役立つのは本文の合計の例です。構造化データだけで料金表の代わりにしないでください。",
          ],
        },
        {
          heading: "WordPressの写真館サイトでの設定手順",
          list: [
            "[WordPress.org](" + WP_ORG + ")からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。0.9.1からはSEO SIMPLE PACKやVK All in One Expansion Unitとも、構造化データを重複させずに併用できます。",
            "初回の設定ウィザードで「その他」を選びます。業種の型を指定しない設定で、住所・電話番号・営業時間のどれかが入っていればLocalBusinessとして出力されます。「専門サービス」のカードはProfessionalServiceを設定するため、写真館では選ばないことをおすすめします。",
            "写真館名・住所・電話番号・営業時間（定休日を含む）・説明を確認します。空欄の項目だけが既存の設定から補われ、入力済みの値は上書きされません。",
            "設定画面のサービスに、撮影プランを1つずつ登録します（最大20件）。プラン名、所要時間（分）、税込の料金と通貨（JPY）、カテゴリ（「七五三」「お宮参り」など）、予約ページのURLを入れると、Service・Offer・予約の操作（ReserveAction）として出力され、llms.txtにも1行ずつ載ります。予約プラグインは必要ありません。",
            "家族からよく聞かれる質問（データの枚数と受け取り方、着付けの有無、子どもの体調不良での変更、兄弟の追加料金など）をFAQに入れます。FAQは、Nurevo FAQブロック（または[nurevo_faq]ショートコード）を置いたページのFAQPageに追加されます。七五三のページだけの質問は、ブロックエディタのNurevo AEOパネルでそのページ専用に入れられます。",
            "合計の例、データ納品、衣装、キャンセルの表は、固定ページの本文に表で書きます。昨年の行事のページが残っている場合は、ブロックエディタのNurevo AEOパネルでllms.txtに載せない設定にできます。",
            "AEOスコアの画面で診断を実行し、不足をワンクリック修正で直します。外からどう見えるかは[無料のAI可読性チェック](/check)で確かめます。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の構造化データを出さず、SEOプラグインのグラフに足りない住所・電話番号・営業時間・サービス・FAQだけを足します。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/guide/local-business-schema-seo-plugins/)をご覧ください。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "撮影の種類（スタジオ・ロケ・出張・セルフ）と、扱う行事が具体的に書かれている。",
            "よくある組み合わせの合計の例が2〜3通り、税込で書かれている。",
            "撮影料・データ・衣装・着付け・ヘアセット・家族の追加・休日料金が、込みか別かとともに書かれている。",
            "データの枚数・形式・受け取り方・保存期限・使い方の範囲が書かれている。",
            "衣装の点数・サイズ・家族の衣装・持ち込みの可否と料金が書かれている。",
            "行事のページに対象の年度と、早撮り・後撮りの期間がある。古い年度のページは更新するか、llms.txtから外している。",
            "予約の変更・キャンセルの期限と料金が表で書かれ、子どもの体調不良の扱いがFAQにある。",
            "作例に、何の撮影か分かる代替テキストと説明があり、掲載の同意を得ている。",
            "構造化データの名前・住所・電話番号が、本文・Googleビジネスプロフィール・予約サイトと一致している。",
            "llms.txtに、料金・プラン・データ納品・予約のページが載っている。[llms.txtとは](/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、家族が聞きそうな質問を、地域・行事・予算・データ・衣装の組み合わせで5〜10個つくり、ChatGPTやPerplexityに投げて、写真館が名前やURLで出るか、料金やデータの条件が正しく書かれているかを記録します。AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。七五三の前（夏ごろ）と最中では答えが変わることもあるので、時期を分けて記録すると傾向がつかめます。測り方の詳細は[AIでの登場率の測り方](/guide/measure-ai-visibility/)にまとめています。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（写真館の名前は含めません）をPerplexityに投げ、回答に写真館の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に写真館が出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "写真館のAI検索対策は、何から始めればいいですか？", a: "よく選ばれる組み合わせ（例：七五三・データ全カット・着付けヘア込み）の合計を税込で書き、データの枚数と受け取り方、衣装と着付けが込みかどうか、予約の変更・キャンセルの条件を本文に表で書くことからです。そのうえで、名前・住所・電話番号を構造化データとGoogleビジネスプロフィールでそろえます。" },
        { q: "構造化データの型は何を使えばいいですか？", a: "schema.orgには写真館専用の型がなく、ProfessionalServiceは地域ビジネスの型としては非推奨です。写真館はLocalBusinessとして出し、撮影プランをServiceとOfferで紐づけるのがおすすめです。" },
        { q: "料金を「◯円〜」とだけ書くのはだめですか？", a: "最低料金だけでは、AIがそれを総額のように答えるおそれがあります。最低料金を書くなら、何が含まれるかと、よくある組み合わせの合計の例を一緒に書いてください。" },
        { q: "空き状況もページに書いたほうがいいですか？", a: "空きは日々変わるため、本文には予約の取りやすい時期の目安だけを書き、実際の空きは予約システムで確かめてもらう形が安全です。古い空き情報がAIに残ると、かえって誤解につながります。" },
        { q: "セルフ写真館や出張撮影でも同じですか？", a: "考え方は同じです。セルフ写真館は時間・人数・データの受け取り方、出張撮影は出張できる範囲・交通費・雨の日の振り替えの条件が特によく聞かれるので、本文に書いてください。" },
        { q: "Nurevo AEOは無料で使えますか？", a: "はい。写真館の住所・連絡先・営業時間・撮影プラン・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](" + WP_ORG + ")" },
        { q: "対策すればChatGPTに写真館が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが写真館の事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが写真館のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },

    en: {
      title: "AI Search for Photo Studios: Totals, Files, Booking Terms | Nurevo",
      description: "AEO for photo studios: publish the real total a family takes home, how many digital files and how they arrive, wardrobe and styling, season dates and booking terms.",
      h1: "AI search for photo studios: how to get AI to read your total price, digital files, wardrobe and booking terms correctly",
      lead: "AI search optimization for a photo studio comes down to answering, in plain text with amounts and conditions, the questions families now ask AI: what a session really costs once you add all the digital files, whether outfits, hair and makeup are included, and how late they can reschedule if a child gets sick. A \"session fee from $X\" on its own lets AI repeat the smallest number as if it were the price. Then you publish the same facts consistently in structured data, llms.txt, your Google Business Profile and your booking site.",
      intro: [
        "Written November 16, 2026 (JST). schema.org types were checked that day in schema-dts 2.1.0. The Google pages and the Japanese government pages cited were checked on November 1, 2026. Examples of consumer and tax rules come from Japan; check the rules where you operate.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your facts readable to AI. They do not guarantee that an AI will mention your studio or rank it anywhere.",
      ],
      sections: [
        {
          heading: "What families ask AI",
          paragraphs: [
            "Questions about photo studios stack an occasion, an area, a budget and a delivery requirement. For example: \"a studio in [city] for a first-birthday shoot where we get all the digital files for under $400\", \"a studio that also does hair and makeup for mom\", \"somewhere we can add siblings without paying more\", \"are weekdays cheaper?\" or \"if it rains, can an outdoor session be moved?\". For an AI to name your studio, the text on your site has to show that you meet those conditions.",
            "Google says there are no additional requirements or special structured data for appearing in AI Overviews or AI Mode, and that ordinary SEO basics, structured data that matches the visible text and an up-to-date Business Profile are what matter. [Google: AI features and your website](" + SRC.googleAi + "). AI search for a studio is not a trick; it is writing down, accurately, the numbers and conditions families use to compare.",
          ],
          table: {
            head: ["Question type", "Example", "Facts the answer needs"],
            rows: [
              ["Total price", "What does it cost with all files and styling?", "Example totals that add session, files, wardrobe and styling"],
              ["Delivery", "We only want digital files. How many?", "Number of files, format, delivery method and deadline"],
              ["Wardrobe and styling", "Can mom borrow an outfit too?", "Number and sizes of outfits, family wardrobe, hair and makeup"],
              ["Season", "Until when is the early-booking price?", "Dates for early and late sessions and what is discounted"],
              ["Booking terms", "Can we reschedule if our child is sick?", "Change and cancellation deadlines and fees"],
              ["Session type", "Do you come to the park or the shrine?", "Studio, location or on-site; travel area and fees"],
            ],
          },
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            "We read the top Japanese results for photo studio AI search and marketing, and the top English results for \"photographer AI search\" and \"photography SEO\". Seasonal page updates, writing totals, describing portfolio images and keeping your Google Business Profile current are covered widely, and this guide covers them too.",
            "None of them covered what to say about digital file delivery, how to present early-booking discounts, which structured data type to use (there is no photo-studio type, and ProfessionalService is deprecated), how to set it up in WordPress, or how to check whether you appear in AI answers. One English guide said a studio needs \"50+ reviews\" and \"4.5 stars or higher\" to be recommended, without a source. This guide does not use figures we could not trace to a source.",
          ],
        },
        {
          heading: "Price the total a family takes home, not the session fee",
          paragraphs: [
            "Studio prices are split into the session fee, products (digital files, albums, prints), wardrobe, hair and makeup, extra family members and weekend or peak-season surcharges. If only the session fee is prominent, AI can present it as the total. Show the total for the combinations people pick most often, in a table.",
          ],
          table: {
            head: ["Item", "How to write it", "Watch out for"],
            rows: [
              ["Session fee", "Studio session $X, weekends +$Y", "State conditions that change it (weekday, weekend, peak season) on the same line"],
              ["Digital files", "All files $X / 10 files $Y", "Say clearly whether files are included or extra"],
              ["Wardrobe", "Two outfits included, each extra outfit $X", "How many are included; whether you can bring your own"],
              ["Hair and makeup", "Included / $X; for parents $Y", "Whether it is included is the most common question"],
              ["Family and siblings", "Siblings +$X; family group shot included", "Whether price rises with headcount"],
              ["Example total", "First birthday, all files, styling included: $X total", "Two or three common combinations"],
            ],
          },
          after: [
            "In Japan, prices shown to consumers in advance must include consumption tax, on any medium (for example \"11,000円（税込）\"). [National Tax Agency: total price display (Japanese)](" + SRC.ntaTotal + "). Wherever you operate, say whether tax is included.",
            "For early-booking or off-season discounts, give the dates the shoot must fall in and which items are discounted, not just the discounted price. If you compare against a \"regular price\", check your local price-display rules first to make sure that price was actually charged.",
          ],
        },
        {
          heading: "Digital files: number, format, delivery and deadline",
          paragraphs: [
            "\"We just want the files\" is now a common reason to choose a studio. At minimum, say the following so that AI and people can compare:",
          ],
          list: [
            "How many: all files or a chosen number. For all files, a rough count (\"about X images\").",
            "Format and size: JPEG or other, and how large. Whether web-size and print-size files differ.",
            "Delivery: download, USB or other media, and how many days until delivery.",
            "Deadlines: how long the download is available, how long you keep the files, and whether you can resend them later and for how much.",
            "Use: whether families can post them online, use them on cards and print them themselves.",
            "Retouching: what is included and whether extra retouching costs more.",
          ],
        },
        {
          heading: "Wardrobe, styling and session types",
          paragraphs: [
            "For wardrobe, go beyond \"X+ outfits\": give the count per occasion, the size range (for example \"80–130 cm\"), whether parents can borrow outfits, and whether families may bring their own and at what fee. For hair and makeup, say who does it, how early to arrive and what it costs if not included.",
            "Studio, outdoor location, on-site (a shrine, a park, a home) and self-portrait sessions each raise different questions. For on-site sessions, give the travel area, travel fees and what happens if it rains. Keep audiences that differ, such as engagement shoots or graduation portraits, on separate pages so AI does not mix up occasions.",
          ],
        },
        {
          heading: "Seasonal pages: state the year and dates, then update",
          paragraphs: [
            "Bookings bunch around holidays, school milestones and coming-of-age ceremonies. On each occasion page, state the year it applies to (\"2027 graduation portraits\") and the dates for early, regular and late sessions, and update the page when the year turns over. If last year's prices or dates stay up, AI may repeat them.",
            "Availability changes daily, so describe in the text only which periods are easier to book, and send people to your booking system for live slots. Put change and cancellation deadlines and fees in a table. How you handle a child falling ill is a question families ask often, so add it to your FAQ as well.",
          ],
        },
        {
          heading: "Portfolio images and reviews",
          paragraphs: [
            "AI relies on the words around a photo more than on the photo itself. Give portfolio images alt text and a caption that say what the session was (\"newborn studio session, family of three\"). Only use client photos you have permission to publish.",
            `It is tempting to grow reviews for AI. Rules on undisclosed advertising differ by country. In Japan, stealth marketing has been a violation of the Act against Unjustifiable Premiums and Misleading Representations since October 1, 2023, and the Consumer Affairs Agency treats reviews a business asks or instructs third parties to post as that business's advertising. [Consumer Affairs Agency: stealth marketing (Japanese)](${SRC.caaStealth}). If you offer a thank-you for a review, make sure it is clear that it was requested.`,
          ],
        },
        {
          heading: "Structured data: there is no photo-studio type",
          paragraphs: [
            `schema.org has no LocalBusiness type for photo studios (Photograph describes a photo as a creative work, not a business). ProfessionalService has been deprecated as a type for local businesses because it was confused with Service. [schema.org: ProfessionalService](${SRC.professionalService}). The sensible shape is to publish the studio as a LocalBusiness and link each session package as a Service, with its price as an Offer. [schema.org: LocalBusiness](${SRC.localBusiness})`,
            `Google's local business structured data requires a name and an address. [Google: LocalBusiness](${SRC.googleLocal}). Keep the values identical to your page text, your Business Profile and your booking site. When you enter packages in Nurevo AEO, each Service is output in this shape (values are examples; the LocalBusiness part is simplified):`,
          ],
          code: SCHEMA_EN,
          after: [
            "If your prices vary widely you can also state a range in LocalBusiness priceRange, but what helps AI answer \"how much in total\" is the example totals in your text. Do not let structured data stand in for a price table.",
          ],
        },
        {
          heading: "Setting it up on a WordPress studio site",
          list: [
            "Install and activate Nurevo AEO (free) from [WordPress.org](" + WP_ORG + "). Yoast SEO, Rank Math, All in One SEO and Slim SEO keep working. Since 0.9.1 it also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.",
            "In the setup wizard, choose \"Other\". It sets no business type, and the plugin publishes a LocalBusiness when an address, phone or opening hours are set. The \"Professional services\" card sets ProfessionalService, so we suggest not choosing it for a studio.",
            "Check your studio name, address, phone, opening hours (including closed days) and description. Only empty fields are filled from your existing settings; values you entered are not overwritten.",
            "Under Services in Settings, add each package (up to 20): name, duration in minutes, price including tax, currency, category (\"Newborn\", \"Family\" and so on) and booking URL. Each is published as a Service with an Offer and a booking action (ReserveAction), and gets its own line in llms.txt. No booking plugin is needed.",
            "Add the questions families ask most (how many files and how they arrive, whether styling is included, rescheduling when a child is sick, sibling fees) to the FAQ. FAQs are added to the FAQPage on pages that hold the Nurevo FAQ block (or the [nurevo_faq] shortcode). Questions for one occasion page can be entered for that page only in the Nurevo AEO panel in the block editor.",
            "Put example totals, file delivery, wardrobe and cancellation tables in the page text as tables. If last year's occasion pages are still up, you can exclude them from llms.txt in the same Nurevo AEO panel.",
            "Run a diagnosis on the AEO score screen and fix gaps with one-click fixes. Check how your site looks from outside with the [free AI readability check](/check).",
          ],
          after: [
            "Alongside an SEO plugin, Nurevo AEO does not output a second set of structured data; it adds only the address, phone, hours, services and FAQ the SEO plugin's graph lacks. See [adding business details to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins/).",
          ],
        },
        {
          heading: "Pre-publish checklist",
          list: [
            "Session types (studio, location, on-site, self-portrait) and the occasions you shoot are stated specifically.",
            "Two or three example totals for common combinations are shown, with tax treatment.",
            "Session fee, files, wardrobe, styling, extra family members and weekend fees are shown with whether each is included.",
            "Digital files: number, format, delivery, storage deadline and permitted use are stated.",
            "Wardrobe: count, sizes, outfits for parents, and whether families may bring their own and the fee.",
            "Occasion pages state the year and the early and late session dates. Old pages are updated or excluded from llms.txt.",
            "Change and cancellation deadlines and fees are in a table, and the sick-child policy is in the FAQ.",
            "Portfolio images have alt text and captions that say what the session was, and you have permission to publish them.",
            "Name, address and phone in structured data match the page, your Google Business Profile and your booking site.",
            "llms.txt lists your pricing, packages, file delivery and booking pages. [What is llms.txt?](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, write five to ten questions a family would ask, combining area, occasion, budget, files and wardrobe. Put them to ChatGPT and Perplexity and record whether your studio appears by name or URL, and whether prices and file terms are stated correctly. Answers vary between runs, so repeat the same questions over time. Answers can also differ before and during your busy season, so record them separately. [How to measure AI visibility](/guide/measure-ai-visibility/)",
            "Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your studio's name) are put to Perplexity, and the plugin records whether the answers named you or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta: how often you appear in AI answers, with competitor comparison and history (currently measured on Perplexity). Both look at a sample of answers, not every answer.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a photo studio start with AI search?", a: "Write the total for your most common combinations (for example a family session with all files and styling), the number of files and how they arrive, whether outfits and styling are included, and your change and cancellation terms, as text and tables on your pages. Then make your name, address and phone match across structured data and your Google Business Profile." },
        { q: "Which structured data type should a photo studio use?", a: "schema.org has no photo-studio type, and ProfessionalService is deprecated as a local business type. Publish the studio as a LocalBusiness and link your packages as Service with Offer." },
        { q: "Is it wrong to show only a \"from\" price?", a: "A starting price alone can be repeated by AI as if it were the total. If you show one, also say what it includes and give example totals for common combinations." },
        { q: "Should we show availability on the page?", a: "Availability changes daily, so the page should say which periods are easier to book and send people to your booking system for live slots. Old availability picked up by AI causes more confusion than it solves." },
        { q: "Does this apply to self-portrait studios and on-location photographers?", a: "Yes, the approach is the same. Self-portrait studios get asked about time slots, group size and file delivery; on-location photographers about travel area, travel fees and rain policies, so put those in the text." },
        { q: "Is Nurevo AEO free?", a: "Yes. Structured data for your address, contact details, hours, packages and FAQ, plus llms.txt, AI crawler rules and the AEO score, are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](" + WP_ORG + ")" },
        { q: "Will this guarantee our studio appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your studio's website",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
