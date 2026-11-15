// Content page: AI search (AEO) for wedding venues (結婚式場・ゲストハウス・
// ホテルウエディング・レストランウエディング). Industry page.
//
// Written 2026-11-15 (JST). Every claim about Nurevo AEO is one the plugin's
// readme makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt,
// 0.9.1), the setup wizard (includes/setup-wizard.php: the "Other" card sets
// no type, so the plugin publishes LocalBusiness when an address, phone or
// hours are set) or the plugin source (nurevo-webmcp.php: the business type
// field takes a schema.org type name; webmcp_canary_local_business_types()
// does not include EventVenue; the webmcp_canary_schema_graph filter is
// documented in docs/developers.md). Pro measurement runs on Perplexity.
//
// Outside facts, checked 2026-11-15 on the primary pages linked in the copy:
// - schema.org (checked in schema-dts 2.1.0 on 2026-11-15; schema.org itself
//   could not be fetched from this run): no WeddingVenue type. EventVenue is a
//   CivicStructure (a Place), not a LocalBusiness. maximumAttendeeCapacity
//   ("The total number of individuals that may attend an event or venue") is
//   on Place and Event.
// - Recruit Bridal Souken, ゼクシィ結婚トレンド調査2024 (published 2024-10-25;
//   postal survey 2024-04-02 to 05-27; 3,656 respondents who held a ceremony
//   or reception between 2023-04 and 2024-03; national weighted estimate,
//   Okinawa excluded): average guests 52.0, average total for ceremony and
//   reception 343.9万円. The report has no initial-vs-final estimate figure.
// - Shiga Prefecture consumer page 結婚式場のキャンセル料トラブル (updated
//   2021-03-24): cases (申込金 10万円 paid on a fair day; total rising by more
//   than 100万円 after add-ons), advice (take the estimate home, check whether
//   money is refundable whatever it is called, check when the contract forms
//   and when fees arise), and the 消費者契約法第9条1号 "平均的な損害" point.
// - The Knot Worldwide 2026 Real Weddings Study press release (2026-02-18):
//   10,474 US couples married in 2025; average cost $34,000; 117 guests; AI
//   adoption "nearly doubled to 36% among engaged couples surveyed".
// - Google "AI features and your website" and LocalBusiness docs: as checked
//   for dental-clinic-ai-search (2026-10-29). No new Google claim is made.
// Not verified this run, so not stated: the 2022 Consumer Contract Act
// duty-to-explain wording for cancellation fees, the MOF tax-inclusive price
// rule text, and any count of how couples use AI in Japan.
// Re-check these when you update the page, and update the date with them.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  zexyTrend: "https://souken.zexy.net/data/trend2024/XY_MT24_report.pdf",
  shiga: "https://www.pref.shiga.lg.jp/shohi/17222.html",
  theKnot: "https://www.theknotww.com/press-releases/the-knot-worldwide-unveils-2026-real-weddings-study",
  eventVenue: "https://schema.org/EventVenue",
  capacity: "https://schema.org/maximumAttendeeCapacity",
  localBusiness: "https://schema.org/LocalBusiness",
};

export default {
  slug: "wedding-venue-ai-search",
  targetQueries: [
    "wedding venue AI search optimization",
    "wedding venue ChatGPT visibility",
    "wedding venue schema markup",
    "結婚式場 AI検索対策",
    "結婚式場 ChatGPT 表示",
    "結婚式場 構造化データ",
  ],
  related: ["local-business-schema-seo-plugins", "llms-txt", "measure-ai-visibility", "appear-in-chatgpt", "hair-salon-ai-search"],
  locales: {
    ja: {
      title: "結婚式場のAI検索対策：見積もり・収容人数・持ち込み料 | Nurevo",
      description: "結婚式場のAI検索対策は、人数別の見積もりと増えやすい項目、会場ごとの収容人数、持ち込みの可否と料金、申込金とキャンセル料を本文と構造化データで正確に出すこと。手順と表で解説。",
      h1: "結婚式場のAI検索対策：見積もりの総額・収容人数・持ち込み料をAIに正しく読ませる手順",
      lead: "結婚式場のAI検索対策の中心は、カップルがAIに聞く「60人で総額いくらになるか（最初の見積もりから何が増えるか）」「この会場に何人入るか」「ドレスやカメラマンを持ち込めるか、いくらかかるか」「申し込んだあと、いつからキャンセル料がかかるか」に、ページ本文で数字と条件を書いて答えることです。そのうえで同じ事実を構造化データ・llms.txt・Googleビジネスプロフィール・ウエディング情報サイトと矛盾なくそろえます。「最低価格」だけを大きく見せる書き方は、AIにとっても条件つきの質問に使えない情報になります。",
      intro: [
        "作成日：2026年11月15日（JST）。ゼクシィ結婚トレンド調査・滋賀県の消費生活ページ・The Knotの調査発表とschema.orgの型の一覧は同日に確認しました。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが式場の事実を正しく読める状態をつくるものです。AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "カップルはAIに何を聞くか",
          paragraphs: [
            "式場探しの最初の段階で、AIに条件を並べて聞くカップルが増えています。米国のThe Knotが2025年に結婚した10,474組を調べた2026年の調査では、婚約中のカップルのAIの利用は1年でほぼ倍の36%になり、主にアイデア出しや最初の疑問への答え、連絡文の下書きに使われていました。[The Knot Worldwide：2026 Real Weddings Study](" + SRC.theKnot + ")。日本で同じ割合を示す公的な数字は確認できていませんが、質問の形は同じです。",
            "実際の質問は「◯◯駅から近くて、60人・総額300万円くらいで、チャペルがある式場」「家族だけ20人で食事会ができる会場」「持ち込み料がかからない式場」「雨の日もガーデンが使える会場」のように、場所・人数・予算・設備・ルールが重なったものになります。AIがこうした質問に式場の名前を挙げるには、その条件を満たすことが文字で読み取れる必要があります。",
            "Googleは、AI OverviewsやAI Modeに出るための追加の要件や特別な構造化データはなく、通常のSEOの基本が大切だとしています。[Google：AI features and your website](" + SRC.googleAi + ")。式場のAI検索対策も、裏技ではなく、カップルが比べるときに使う事実を正確に書くことが本体です。",
          ],
        },
        {
          heading: "公開しておきたい事実と、書き方",
          paragraphs: [
            "上位の記事の多くは「料金・収容人数・設備を載せましょう」で終わっていますが、条件つきの質問に答えるには、どこまで書くかが大切です。会場の種類（ゲストハウス、ホテル、専門式場、レストラン、神社や教会と提携した会場など）で項目は少し変わりますが、目安は次のとおりです。",
          ],
          table: {
            head: ["事実", "ページ本文での書き方", "注意点"],
            rows: [
              ["会場の種類と挙式スタイル", "「一軒家貸切のゲストハウス」「ホテル内のチャペルと神殿」のように具体的に。キリスト教式・神前式・人前式のどれができるか", "「ウエディング会場」だけだと、AIは種類を推測するしかない"],
              ["収容人数", "会場（バンケット）ごとに、着席と立食の人数の範囲。最少の人数と、少人数向けのプランの有無", "館全体の最大人数だけでなく、会場ごとに書く"],
              ["人数別の見積もりの例", "20人・40人・60人など、よくある人数ごとの総額の例と、その中に含まれるもの（料理のランク、ドレス1着、写真など）", "税込かどうか、サービス料が含まれるかを同じ行に書く"],
              ["見積もりから増えやすい項目", "料理・飲み物のランクアップ、衣装の追加や格上げ、装花、写真・映像、演出など、何がいくらから増えるかの目安", "「最低価格」だけを大きく見せない（後述の消費生活の注意）"],
              ["持ち込み", "ドレス・タキシード、カメラマン、ペーパーアイテム、引出物、ブーケ、映像など品目ごとに、可・条件つき可・不可と、持ち込み料の金額と単位（1点・1名あたりなど）", "「応相談」だけにせず、提携先のみの品目もそう書く"],
              ["申込金とキャンセル料", "申込金・内金の金額と返金の有無、契約がいつ成り立つか、キャンセル料がいつから・いくらかかるかの表、日程変更の扱い", "名前が何であれ、返金されるかどうかをはっきり書く"],
              ["日程と空き", "空いている日の確認方法、季節や曜日の料金の違い（オフシーズンのプランなど）", "空き日を載せるなら更新日を付ける"],
              ["設備と配慮", "駅からの距離と送迎、駐車場、バリアフリー、授乳室・キッズスペース、控室、雨の日の対応、アレルギーや宗教上の食事への対応", "「対応可」の範囲を実際より広く見せない"],
              ["見学・相談", "ブライダルフェアと個別見学の予約方法、時間帯、所要時間", "フェアの特典の条件（当日申込のみなど）も同じページに"],
            ],
            caption: "項目は、上位の記事が挙げる項目と、消費生活の相談で問題になりやすい点（見積もりの増額、申込金、キャンセル料）をもとにまとめたものです。",
          },
          after: [
            "どの値も、本文・構造化データ・Googleビジネスプロフィール・パンフレット・ウエディング情報サイトの掲載で同じにします。料金改定やプランの入れ替えがあったら、すべてを一緒に更新します。",
          ],
        },
        {
          heading: "総額の目安：数字は出典つきで、自分の式場の数字と分けて書く",
          paragraphs: [
            "「結婚式は平均いくら？」は、AIによく聞かれる質問です。リクルートブライダル総研の「ゼクシィ結婚トレンド調査2024」（2023年4月〜2024年3月に挙式・披露宴をした3,656人への郵送調査、全国推計・沖縄を除く）では、招待客の平均は52.0人、挙式と披露宴の総額の平均は343.9万円でした。[ゼクシィ結婚トレンド調査2024（PDF）](" + SRC.zexyTrend + ")",
            "こうした全国の平均は、式場のページに書くなら調査名と年を添え、自分の式場の数字（「当館で60人の場合の総額の例」など）とははっきり分けます。平均と自社の数字が混ざって見えると、AIが式場の料金として誤って伝えるおそれがあります。自社の数字は、実際の見積もりに近い条件で、何が含まれるかと一緒に書きます。",
          ],
        },
        {
          heading: "見積もり・申込金・キャンセル料：消費生活で問題になりやすい点",
          paragraphs: [
            "滋賀県の消費生活のページ「結婚式場のキャンセル料トラブル」では、ブライダルフェアの当日に「今日申し込むと割引になる」と言われて申込金10万円を払い、返金されなかった例や、予算内の見積もりが追加で100万円以上増え、解約時に申込金とは別のキャンセル料を求められた例が紹介されています。[滋賀県：結婚式場のキャンセル料トラブル](" + SRC.shiga + ")",
            "同じページでは、見積書を持ち帰って考えること、申込金・予約金・内金などの名前にかかわらず返金されるかを払う前に確かめること、契約がいつ成り立ち、キャンセル料がいつから・いくら発生するかを契約書で確かめることが勧められています。また、キャンセル料のうち事業者に生じる「平均的な損害」を超える部分は、消費者契約法第9条1号により無効となる可能性がある（個別に判断される）と説明されています。",
            "AI検索の面から見ると、これらはカップルがAIに聞く質問そのものです。式場のサイトでは、次のような書き方を避けてください。",
          ],
          list: [
            "最低価格だけを大きく書き、その人数・含まれるもの・増えやすい項目を書かない。",
            "フェアの特典の条件（当日申込のみ、一定額以上の契約など）を別のページや小さな注記に分ける。",
            "申込金が返金されるかどうか、キャンセル料がいつから発生するかを「詳しくはお問い合わせください」だけにする。",
            "持ち込み料を「かかる場合があります」だけにして、品目と金額を書かない。",
          ],
          after: [
            "構造化データやFAQ、llms.txtも、ページの内容を機械向けに書き直したものです。本文に書けない表現（根拠のない「エリアNo.1」、条件を書かない「持ち込み無料」など）は、AI向けの場所にも書かないでください。契約や表示のルールの詳しい判断は、専門家や消費生活センターなどの窓口で確認してください。",
          ],
        },
        {
          heading: "構造化データ：結婚式場専用の型はない",
          paragraphs: [
            "schema.orgには、結婚式場を表す専用の型がありません（2026年11月15日にschema.orgの型の一覧で確認）。近い型に[EventVenue](" + SRC.eventVenue + ")がありますが、これは公共の建物などと同じ「場所（Place）」の仲間で、LocalBusiness（店舗・事業者）ではありません。Googleのローカルビジネスの構造化データはLocalBusinessの型を前提にしていて、nameとaddressが必須です。[Google：ローカルビジネスの構造化データ](" + SRC.googleLocal + ")",
            "おすすめは、式場を[LocalBusiness](" + SRC.localBusiness + ")として、名前・住所・電話・見学受付の時間・URLを出し、挙式・披露宴・少人数の食事会などのプランはサービスとして紐づけ、細かい条件は本文で書くことです。会場ごとの最大人数を構造化データでも示したい場合は、会場をEventVenueとして書き、[maximumAttendeeCapacity](" + SRC.capacity + ")（その場所に入れる人数の合計）を付ける方法があります。どちらの型にするかより、本文と値がそろっていることのほうが大切です。",
            "見積もりの例や空き日は変わりやすいので、本文の表で更新日と一緒に書くのが現実的です。構造化データに入れるのは、変わりにくい事実（名前・所在地・連絡先・会場・プランの種類）を中心にします。",
          ],
        },
        {
          heading: "WordPressの式場サイトでの設定手順",
          list: [
            "[WordPress.org](" + WP_ORG + ")からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。0.9.1からはSEO SIMPLE PACKやVK All in One Expansion Unitとも、構造化データを重複させずに併用できます。",
            "初回の設定ウィザードで「その他」を選びます。業種の型を指定しない設定で、住所・電話番号・営業時間のどれかが入っていればLocalBusinessとして出力されます。式場名・住所・電話番号・説明を確認します。空欄の項目だけが既存の設定から補われ、入力済みの値は上書きされません。",
            "営業時間の欄には、見学や相談の受付時間を入れます（挙式の時間ではないことを本文にも書きます）。",
            "設定画面で、挙式・披露宴・少人数婚・フォトウエディングなどのプランをサービスとして登録し、カップルからよく聞かれる質問（持ち込み、申込金の返金、キャンセル料の発生日、雨の日の対応など）をFAQに入れます。FAQは、Nurevo FAQブロック（または[nurevo_faq]ショートコード）を置いたページのFAQPageに追加されます。プランのページだけの質問は、ブロックエディタのNurevo AEOパネルでそのページ専用に入れられます。",
            "会場ごとの収容人数、人数別の見積もりの例、増えやすい項目、持ち込みの表、申込金とキャンセル料の表は、固定ページの本文に表で書きます。",
            "会場をEventVenueとして構造化データに足したい場合は、開発者向けの webmcp_canary_schema_graph フィルターで追加できます（Nurevo AEOの業種の候補にEventVenueはありません）。",
            "AEOスコアの画面で診断を実行し、不足をワンクリック修正で直します。外からどう見えるかは[無料のAI可読性チェック](/check)で確かめます。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の構造化データを出さず、SEOプラグインのグラフに足りない住所・電話番号・営業時間・サービス・FAQだけを足します。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/guide/local-business-schema-seo-plugins/)をご覧ください。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "会場の種類と、できる挙式スタイルが具体的に書かれている。",
            "収容人数が会場ごとに、着席と立食で書かれている。最少人数と少人数プランの有無もある。",
            "人数別の見積もりの例が、税込・サービス料の扱いと含まれるものつきで書かれている。",
            "見積もりから増えやすい項目と、その金額の目安が書かれている。",
            "持ち込みが品目ごとに、可否と持ち込み料の金額・単位で書かれている。",
            "申込金の返金の有無、契約の成立時期、キャンセル料の発生日と金額が表で書かれている。",
            "全国の平均などを書く場合は出典と年があり、自分の式場の数字と分かれている。",
            "構造化データの名前・住所・電話番号が本文・Googleビジネスプロフィール・ウエディング情報サイトと一致している。",
            "llms.txtに、式場の概要・プラン・料金・持ち込み・見学予約のページが載っている。[llms.txtとは](/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、カップルが聞きそうな質問を、地域・人数・予算・挙式スタイル・設備の組み合わせで5〜10個つくり、ChatGPTやPerplexityに投げて、式場が名前やURLで出るか、料金や収容人数・持ち込みのルールが正しく書かれているかを記録します。AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。測り方の詳細は[AIでの登場率の測り方](/guide/measure-ai-visibility/)にまとめています。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（式場名は含めません）をPerplexityに投げ、回答に式場の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に式場が出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "結婚式場のAI検索対策は、何から始めればいいですか？", a: "会場ごとの収容人数、人数別の見積もりの例（含まれるものと税・サービス料の扱いつき）、増えやすい項目、持ち込みの可否と料金、申込金とキャンセル料を、ページ本文に文字と表で書くことからです。そのうえで、式場名・住所・電話番号を構造化データとGoogleビジネスプロフィールでそろえます。" },
        { q: "構造化データの型は何を使えばいいですか？", a: "schema.orgには結婚式場専用の型がないため、式場はLocalBusinessとして出し、プランはサービスとして紐づけるのがおすすめです。会場ごとの最大人数を示したい場合は、会場をEventVenueとしてmaximumAttendeeCapacityを付ける方法があります。EventVenueは場所の型で、LocalBusinessではありません。" },
        { q: "「最低価格」を載せるとAIに選ばれやすくなりますか？", a: "最低価格だけでは、人数や予算の条件がある質問に答えにくく、実際の総額と違って伝わるおそれもあります。人数別の総額の例と、含まれるもの・増えやすい項目を一緒に書いてください。" },
        { q: "キャンセル料を公開すると不利になりませんか？", a: "申込金の返金やキャンセル料の発生日は、カップルがAIにも聞く質問で、消費生活の相談でも問題になりやすい点です。いつから・いくらかかるかを表で示しておくほうが、比べられたときに説明しやすくなります。" },
        { q: "ウエディング情報サイトに載っていれば、自社サイトは要りませんか？", a: "情報サイトの掲載も、AIが参照する出典の1つになりえます。ただ、持ち込みのルールやキャンセル料の表、会場ごとの細かい条件は自社サイトのほうが正確に書けます。両方の値を一致させておくことが大切です。" },
        { q: "Nurevo AEOは無料で使えますか？", a: "はい。式場の住所・連絡先・受付時間・サービス・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](" + WP_ORG + ")" },
        { q: "対策すればChatGPTに式場が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが式場の事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが式場のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。ゼクシィは株式会社リクルートの、The KnotはThe Knot Worldwide Inc.の商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },

    en: {
      title: "AI Search for Wedding Venues: Pricing, Capacity, Policies | Nurevo",
      description: "AEO for wedding venues: publish price examples by guest count, what pushes the total up, capacity per room, vendor rules and cancellation terms as text and schema.",
      h1: "AI search for wedding venues: how to get AI to read your total price, capacity and vendor rules correctly",
      lead: "AI search optimization for a wedding venue comes down to answering, in plain text with numbers and conditions, the questions couples now ask AI: what a wedding for 60 guests really costs (and what pushes the first quote up), how many people each room holds, whether they can bring their own photographer or dress and what that costs, and when cancellation fees start after they sign. Then you publish the same facts consistently in structured data, llms.txt, your Google Business Profile and the wedding directories you list on. A headline \"from\" price on its own is as unhelpful to AI as it is to a couple with a budget and a guest list.",
      intro: [
        "Written November 15, 2026 (JST). The Zexy trend survey, the Shiga Prefecture consumer page, The Knot's study release and schema.org's list of types were checked that day. Examples of consumer rules come from Japan; check the rules where you operate.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your facts readable to AI. They do not guarantee that an AI will mention your venue or rank it anywhere.",
      ],
      sections: [
        {
          heading: "What couples ask AI",
          paragraphs: [
            "More couples now start their venue search by giving AI a list of conditions. The Knot's 2026 Real Weddings Study of 10,474 US couples married in 2025 found that AI adoption nearly doubled in a year, to 36% of the engaged couples surveyed, used mainly for inspiration, early questions and drafting messages. [The Knot Worldwide: 2026 Real Weddings Study](" + SRC.theKnot + "). We found no comparable official figure for Japan, but the shape of the questions is the same.",
            "Real questions stack location, guest count, budget, facilities and rules: \"a venue near [station] with a chapel for 60 guests, about $30,000 all in\", \"somewhere we can have a family-only dinner for 20\", \"venues that let us bring our own caterer\", \"a garden venue with a rain plan\". For an AI to name your venue in an answer like that, it has to be able to read, as text, that you meet those conditions.",
            "Google says there are no additional requirements and no special structured data needed to appear in AI Overviews or AI Mode, and that normal SEO basics still apply. [Google: AI features and your website](" + SRC.googleAi + "). For a wedding venue, the work is not a trick: it is writing down, accurately, the facts couples use to compare.",
          ],
        },
        {
          heading: "The facts to publish, and how to write them",
          paragraphs: [
            "Most top-ranking articles stop at \"publish your pricing, capacity and amenities\". What decides whether AI can use them is how far you go. Details vary by kind of venue (exclusive-use house, hotel, dedicated wedding venue, restaurant, venue partnered with a church or shrine), but this is a good baseline:",
          ],
          table: {
            head: ["Fact", "How to write it on the page", "Watch out for"],
            rows: [
              ["Kind of venue and ceremony styles", "Be specific: \"exclusive-use house with garden\", \"hotel with chapel and shrine room\". Say which ceremony styles you can host (religious, civil, celebrant-led)", "\"Wedding venue\" alone leaves AI to guess what you are"],
              ["Capacity", "For each room, the range seated and standing; your minimum guest count and whether you have small-wedding packages", "Give each room, not only the maximum for the whole building"],
              ["Price examples by guest count", "A total for common sizes (20, 40, 60 guests) and what it includes (menu level, attire, photography)", "Say on the same line whether tax and service charges are included"],
              ["What pushes the total up", "Upgrades to food and drink, extra or upgraded attire, flowers, photo and video, extras, each with a rough \"from\" amount", "Do not lead with the lowest price alone (see the consumer notes below)"],
              ["Outside vendors", "For each item (attire, photographer, stationery, favours, flowers, video): allowed, allowed with conditions, or not allowed, and the fee with its unit (per item, per person)", "Do not stop at \"ask us\"; if only partner vendors are allowed, say so"],
              ["Deposit and cancellation", "The deposit amount and whether it is refundable, when the contract is formed, a table of when cancellation fees start and how much, and how date changes are handled", "Whatever you call the first payment, say clearly whether it comes back"],
              ["Dates and availability", "How to check open dates, and price differences by season or day of week", "If you list open dates, add the date you last updated them"],
              ["Facilities and accessibility", "Distance from the station and shuttles, parking, step-free access, nursing and kids' rooms, getting-ready rooms, rain plans, allergy and religious dietary needs", "Do not make what you can accommodate look broader than it is"],
              ["Tours and consultations", "How to book a showcase event or private tour, times and how long it takes", "Put any conditions on showcase-day offers (sign today only, minimum spend) on the same page"],
            ],
            caption: "The list combines what top-ranking articles recommend with the points that most often cause consumer complaints: rising quotes, deposits and cancellation fees.",
          },
          after: [
            "Keep every value the same across your page text, structured data, Google Business Profile, brochure and wedding directory listings. When prices or packages change, update all of them together.",
          ],
        },
        {
          heading: "Average costs: cite the source, and keep them apart from your own prices",
          paragraphs: [
            "\"How much does a wedding cost on average?\" is a question AI gets constantly. In Japan, Recruit Bridal Souken's Zexy Wedding Trend Survey 2024 (a postal survey of 3,656 people who held a ceremony or reception between April 2023 and March 2024, weighted to a national estimate excluding Okinawa) found an average of 52.0 guests and an average total of 3,439,000 yen for ceremony and reception. [Zexy Wedding Trend Survey 2024 (PDF, Japanese)](" + SRC.zexyTrend + "). In the US, The Knot's 2026 study put the average wedding at $34,000 with 117 guests. [The Knot Worldwide](" + SRC.theKnot + ")",
            "If you quote averages like these on your site, name the survey and year, and keep them clearly separate from your own figures (\"an example total for 60 guests at our venue\"). When a national average and your own price look mixed together, an AI may repeat the average as your price. Write your own figures for conditions close to a real quote, with what they include.",
          ],
        },
        {
          heading: "Quotes, deposits and cancellation fees: where consumer complaints start",
          paragraphs: [
            "Shiga Prefecture's consumer page on wedding venue cancellation fees describes a man who was told at a showcase event that signing that day meant a discount, paid a 100,000-yen deposit and was refused a refund, and a woman whose in-budget quote grew by more than 1,000,000 yen with add-ons and who was then charged a cancellation fee on top of the deposit. [Shiga Prefecture: wedding venue cancellation fee trouble (Japanese)](" + SRC.shiga + ")",
            "The page advises taking the quote home to think it over, checking before paying whether the money is refundable whatever it is called (application fee, booking fee, deposit), and checking in the contract when it is formed and when cancellation fees start and how much they are. It also explains that, under Article 9(1)(i) of Japan's Consumer Contract Act, the part of a cancellation fee that exceeds the business's \"average damage\" may be void, decided case by case.",
            "From an AI search point of view, these are exactly the questions couples put to AI. Avoid writing your site like this:",
          ],
          list: [
            "Leading with the lowest price without saying for how many guests, what it includes and what usually gets added.",
            "Putting the conditions of a showcase-day offer (sign today only, minimum spend) on another page or in small print.",
            "Answering \"is the deposit refundable?\" and \"when do cancellation fees start?\" only with \"contact us for details\".",
            "Saying outside vendors \"may incur a fee\" without naming the items and amounts.",
          ],
          after: [
            "Structured data, FAQ and llms.txt are your page content rewritten for machines. If you cannot say it on the page (an unsupported \"number one in the area\", \"no outside-vendor fees\" without the conditions), do not say it in the places written for AI. For contract and advertising rules, check with a professional or your local consumer authority.",
          ],
        },
        {
          heading: "Structured data: there is no wedding-venue type",
          paragraphs: [
            "schema.org has no type for wedding venues (checked against schema.org's type list on November 15, 2026). The nearest is [EventVenue](" + SRC.eventVenue + "), but it sits under Place alongside civic structures, not under LocalBusiness. Google's local business structured data expects a LocalBusiness type, with name and address required. [Google: Local business structured data](" + SRC.googleLocal + ")",
            "The safer choice is to describe the venue as a [LocalBusiness](" + SRC.localBusiness + ") with its name, address, phone, tour or enquiry hours and URL, link ceremonies, receptions and small dinners as services, and explain the details in the page text. If you also want structured data for the capacity of each room, you can describe each room as an EventVenue with [maximumAttendeeCapacity](" + SRC.capacity + ") (the total number of people who may attend). Which type you choose matters less than the values matching your page text.",
            "Price examples and open dates change often, so the practical place for them is a table in the page text with an update date. Keep structured data to facts that rarely change: name, location, contact details, rooms and the kinds of package you offer.",
          ],
        },
        {
          heading: "Setting it up on a WordPress venue site",
          list: [
            "Install Nurevo AEO (free) from [WordPress.org](" + WP_ORG + ") and activate it. Keep Yoast SEO, Rank Math, All in One SEO or Slim SEO if you use one. Since 0.9.1 it also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.",
            "In the setup wizard, choose \"Other\". That card sets no specific type, so the plugin publishes LocalBusiness as long as an address, phone or hours are filled in. Confirm the name, address, phone and description. Only blank fields are filled in from your existing settings; nothing you typed is overwritten.",
            "Use the opening hours field for the hours you take enquiries and tours, and say so in the page text so they are not read as ceremony times.",
            "Under Settings, add your packages (ceremony, reception, small wedding, photo-only wedding) as services, and enter the questions couples ask most in the FAQ: outside vendors, deposit refunds, when cancellation fees start, rain plans. FAQ questions are added to the page's FAQPage on the page where you place the Nurevo FAQ block or the [nurevo_faq] shortcode. Questions for a single package page can be added in the Nurevo AEO panel in the block editor, for that page only.",
            "Put capacity per room, price examples by guest count, common add-ons, the outside-vendor table and the deposit and cancellation table as tables in the page text.",
            "To add your rooms as EventVenue nodes, use the developer filter webmcp_canary_schema_graph (EventVenue is not one of the business types Nurevo AEO offers).",
            "Run the diagnosis on the AEO Score screen and apply the one-click fixes. Check how AI reads you from the outside with the [free AI readability check](/check).",
          ],
          after: [
            "With an SEO plugin active, Nurevo AEO does not print a second set of structured data. It adds only the missing address, phone, hours, services and FAQ into the graph your SEO plugin already publishes. See [adding local business schema to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins/).",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "The kind of venue and the ceremony styles you host are stated specifically.",
            "Capacity is given for each room, seated and standing, with your minimum and any small-wedding package.",
            "Price examples by guest count say whether tax and service are included and what is covered.",
            "Common add-ons and their rough amounts are listed.",
            "Outside vendors are covered item by item, with whether they are allowed and the fee and its unit.",
            "Deposit refunds, when the contract is formed, and when and how much cancellation fees are, are shown in a table.",
            "Any national average has its source and year and is kept apart from your own prices.",
            "Name, address and phone in structured data match the page, your Google Business Profile and your directory listings.",
            "llms.txt lists your overview, packages, pricing, outside-vendor and tour booking pages. [What is llms.txt?](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, write five to ten questions a couple would ask, combining area, guest count, budget, ceremony style and facilities. Put them to ChatGPT and Perplexity and record whether your venue appears by name or URL, and whether prices, capacity and vendor rules are stated correctly. Answers vary between runs, so repeat the same questions over time. [How to measure AI visibility](/guide/measure-ai-visibility/) covers the method in detail.",
            "Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your venue's name) are put to Perplexity, and the plugin records whether the answers named you or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta: how often you appear in AI answers, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a wedding venue start with AI search?", a: "Write capacity per room, price examples by guest count (with what is included and how tax and service are handled), common add-ons, outside-vendor rules and fees, and your deposit and cancellation terms as text and tables on your pages. Then make your name, address and phone match across structured data and your Google Business Profile." },
        { q: "Which structured data type should a wedding venue use?", a: "schema.org has no wedding-venue type, so publish the venue as a LocalBusiness and link your packages as services. To show the capacity of each room, you can describe rooms as EventVenue with maximumAttendeeCapacity. EventVenue is a type of place, not a LocalBusiness." },
        { q: "Does showing a low \"from\" price help AI pick us?", a: "A starting price alone does not answer questions with a guest count or budget, and it can be repeated as if it were your typical total. Show example totals by guest count along with what they include and what usually gets added." },
        { q: "Won't publishing our cancellation fees put couples off?", a: "Whether the deposit is refundable and when cancellation fees start are questions couples put to AI, and among the most common causes of consumer complaints. A clear table of when and how much makes you easier to explain when you are compared." },
        { q: "If we are on wedding directories, do we still need our own site?", a: "Directory listings can be one of the sources AI draws on. But your own site can state outside-vendor rules, cancellation tables and per-room details more precisely. Keep the values in both identical." },
        { q: "Is Nurevo AEO free?", a: "Yes. Structured data for your address, contact details, hours, services and FAQ, plus llms.txt, AI crawler rules and the AEO score, are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](" + WP_ORG + ")" },
        { q: "Will this guarantee our venue appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your venue's website",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Zexy is a trademark of Recruit Co., Ltd., and The Knot of The Knot Worldwide Inc. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
