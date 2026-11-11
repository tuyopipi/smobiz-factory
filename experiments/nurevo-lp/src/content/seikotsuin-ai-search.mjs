// Content page: AI search (AEO) for seikotsuin / sekkotsuin (judo therapy
// clinics) in Japan. Industry page.
//
// Written 2026-11-11 (JST). Every claim about Nurevo AEO is one the plugin's
// readme makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt)
// or its code: the "Clinic or dental" wizard card sets MedicalBusiness
// (includes/setup-wizard.php); "Other" sets no type, so LocalBusiness is
// published when there is an address, phone or hours; "Business type
// (schema.org type)" is a free text field (nurevo-webmcp.php, sanitize_text_field);
// services take name, duration, price, currency, category, booking URL and
// description. Pro measurement runs on Perplexity
// (docs/pro-measurement-implementation.md).
//
// Outside facts, checked on the primary pages linked in the copy:
// - MHLW "あはき・柔整広告ガイドライン" (医政発0218第1号, 2025-02-18) and its
//   summary deck (checked 2026-11-11): an ad is something meeting all three of
//   誘引性・特定性・認知性; a clinic's own website is in principle not treated
//   as an ad (the visitor searches or types the URL), but banner ads and paid
//   search placements are; SNS posts meeting the three conditions are ads;
//   websites should show self-paid treatment content, usual fees and risks;
//   websites should not carry unverifiable claims ("絶対に治る"), edited
//   before/after photos, rankings such as "口コミサイトで1位", excessive emphasis
//   on low fees, or fear-driven pressure. Advertisable items for 柔道整復 include
//   ほねつぎ（又は接骨）, 医療保険療養費支給申請ができる旨 (for 骨折・脱臼 only
//   when stating a doctor's consent is needed), 予約, 休日・夜間, 出張, 駐車設備;
//   "各種保険取扱い", "交通事故取扱い" are not advertisable; technique/career
//   claims are not allowed in ads. Violations "罰則の対象となり得る".
// - Hyogo Prefecture page (updated 2025-11-17): "交通事故治療専門" and
//   "むち打ち専門" cannot be advertised; the medical advertising guideline does
//   not apply to these clinics.
// - Japan Health Insurance Association (協会けんぽ) "柔道整復師のかかり方"
//   (checked 2026-11-11): covered are acute/traumatic 打撲・捻挫・挫傷 and
//   骨折・脱臼 (doctor's consent needed except emergency first aid); not covered
//   are 単なる肩こり・筋肉疲労, comfort massage, pain from illness (神経痛・
//   リウマチ・五十肩・関節炎・ヘルニア等), work/commute injuries (労災); from
//   2027-01 (令和9年1月) long-term multi-part patients may move to 償還払い.
// - Google "AI features and your website" (checked 2026-11-01) and Google
//   local business structured data (checked 2026-10-29), as on the salon and
//   dental pages. schema.org MedicalBusiness is a LocalBusiness type (checked
//   2026-10-29 for the dental page via the Dentist hierarchy).
// - Google Search Central blog 2019-09-16 (self-serving reviews) and Consumer
//   Affairs Agency stealth marketing page (checked 2026-11-01 for the salon page).
// Re-check these when you update the page, and update the date with them.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  mhlwSummary: "https://www.mhlw.go.jp/content/10800000/001412682.pdf",
  bunkyo: "https://www.city.bunkyo.lg.jp/b026/p007613.html",
  hyogo: "https://web.pref.hyogo.lg.jp/awk06/annma.html",
  kenpo: "https://www.kyoukaikenpo.or.jp/benefit/judo_therapist/index.html",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  reviews2019: "https://developers.google.com/search/blog/2019/09/making-review-rich-results-more-helpful",
  caaStealth: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/stealth_marketing/",
};

export default {
  slug: "seikotsuin-ai-search",
  targetQueries: [
    "AI search optimization for seikotsuin clinics",
    "judo therapy clinic Japan ChatGPT visibility",
    "chiropractic physiotherapy clinic AEO advertising rules",
    "整骨院 AI検索対策",
    "接骨院 ChatGPT 表示 対策",
    "整骨院 ホームページ 広告ガイドライン 構造化データ",
  ],
  related: ["dental-clinic-ai-search", "local-business-schema-seo-plugins", "measure-ai-visibility", "llms-txt", "hair-salon-ai-search"],
  locales: {
    ja: {
      title: "整骨院・接骨院のAI検索対策：広告ルールと保険の書き方 | Nurevo",
      description: "整骨院・接骨院のAI検索対策は、施術時間・保険の対象・自費料金・予約方法をサイト本文と構造化データで正確に公開することから。令和7年の広告ガイドラインでのサイトと広告の違い、手順とチェック表。",
      h1: "整骨院・接骨院のAI検索対策：広告ガイドラインを守りながら、施術時間・保険・料金をAIに正しく読ませる手順",
      lead: "整骨院・接骨院のAI検索対策（AEO）の中心は、受付時間・休診日・場所・予約方法・健康保険が使えるけが・自費の施術内容と料金を、サイトの本文と構造化データで正確に、矛盾なく公開することです。厚生労働省の令和7年2月のガイドラインでは、施術所のウェブサイトは原則として広告とは見なされない一方、「絶対に治る」のような表現や加工したビフォーアフター写真はサイトにも載せるべきでないとされています。AIに読ませるのは宣伝文句ではなく、確かめられる事実です。",
      intro: [
        "作成日：2026年11月11日（JST）。厚生労働省・協会けんぽ・自治体の情報は、本文に記した日に各公式ページで確認したものです。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが施術所の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。また、この記事は法的な助言ではありません。表現に迷ったときは、施術所を管轄する保健所に確認してください。",
      ],
      sections: [
        {
          heading: "患者さんはAIに何を聞いているか",
          paragraphs: [
            "ChatGPT、Perplexity、GoogleのAI Overviewsなどに整骨院・接骨院を探す質問をすると、AIはウェブ上の情報を読んで答えをまとめます。聞かれるのは「◯◯駅の近くで土曜の夕方も開いている接骨院」「ぎっくり腰のときに健康保険は使える？」「整骨院と整体院の違いは？」「子どものスポーツのけがを診てもらえる施術所」のように、場所・曜日・時間・保険・施術内容がからむ質問です。",
            "答えるには、施術所がどこにあり、何曜日の何時まで受付していて、予約が必要か、どんなけがに保険が使え、自費の施術はいくらか、をAIが文字として読み取れる必要があります。受付時間が画像だけ、ページごとに休診日が違う、保険の説明がない、といった状態では答えに使いにくくなります。",
            `Googleは、AI OverviewsやAI Modeに出るための追加の要件や特別なschema.orgの構造化データはなく、構造化データをページの見える文章と一致させる、ビジネスプロフィールを最新にする、といった通常の基本が大切だとしています（2026年11月1日確認）。[Google：AI features and your website](${SRC.googleAi})`,
          ],
        },
        {
          heading: "先に押さえる：サイトと広告では、書けることが違う",
          paragraphs: [
            `柔道整復師の施術所の広告は、柔道整復師法で書ける事項が限られています。厚生労働省は2025年（令和7年）2月18日に「あはき・柔整広告ガイドライン」（医政発0218第1号）を出し、何が広告にあたるかを整理しました。誘引性・特定性・認知性の3つをすべて満たすものが広告で、施術所のウェブサイトは、利用者が自分で検索したりURLを入力したりして見るものなので、原則として広告とは見なさないとしています（2026年11月11日確認）。[厚生労働省：あはき・柔整広告ガイドラインの概要（PDF）](${SRC.mhlwSummary})、[文京区：施術所の広告規制について](${SRC.bunkyo})`,
            "ただし、サイトなら何でも書けるわけではありません。同じガイドラインは、ウェブサイトにも、自費の施術内容・通常の料金・リスクや副作用を書くよう求める一方、「絶対に治る」など確かめられない表現、加工・修正したビフォーアフター写真、「口コミサイトで1位」のような比較、料金の安さの過度な強調、不安をあおる表現は載せるべきでないとしています。また、バナー広告や、検索結果にスポンサーとして出る広告は、3つの要件を満たせば広告として扱われ、SNSの投稿も同じです。",
          ],
          table: {
            head: ["載せる場所", "扱い（2025年2月のガイドライン）", "AI検索対策での注意"],
            rows: [
              ["自院のウェブサイト本文", "原則として広告ではない。自費の内容・料金・リスクを書くことが求められる", "事実を詳しく書く場所。誇大な表現・加工写真・順位の主張は入れない"],
              ["構造化データ・llms.txt", "サイトの一部として本文と同じ事実を機械向けに書くもの（ガイドラインに個別の記載はない）", "本文にない効果や評価を足さない。値は本文と同じに"],
              ["リスティング広告・バナー広告", "要件を満たせば広告。法律で決められた事項だけ", "広告文に料金・症状名・技術の主張を入れない"],
              ["SNSの投稿", "3つの要件を満たせば広告として扱う", "サイトの事実と食い違う内容を流さない"],
            ],
            caption: "厚生労働省のガイドライン概要（2025年2月18日）をもとに整理。個別の表現が広告にあたるかは、管轄の保健所に確認してください。",
          },
          after: [
            `広告で書ける事項は、柔道整復師である旨、施術所の名称・電話番号・所在地、施術日や施術時間、「ほねつぎ（又は接骨）」、医療保険の療養費の支給申請ができる旨（骨折・脱臼は医師の同意が必要な旨を示す場合に限る）、予約制、休日・夜間の施術、出張、駐車場などです。「各種保険取扱い」「交通事故取扱い」は広告できない例として挙げられています。兵庫県も「交通事故治療専門」「むち打ち専門」は広告できないと案内しています（2025年11月17日更新）。[兵庫県：施術所における広告について](${SRC.hyogo})。サイトの文章をそのままリスティング広告やチラシに流用しないことが、いちばん多い事故を防ぎます。`,
          ],
        },
        {
          heading: "健康保険の説明は、AIがいちばん答えに使う事実",
          paragraphs: [
            `「整骨院で保険は使える？」はAIによく聞かれる質問です。協会けんぽの案内では、整骨院・接骨院で健康保険の対象になるのは、急性などの外傷性の打撲・捻挫・挫傷（肉離れなど）と、骨折・脱臼です。骨折と脱臼は、応急処置を除き、あらかじめ医師の同意が必要です。単なる肩こりや筋肉疲労、慰安目的のマッサージ代わりの利用、病気（神経痛・リウマチ・五十肩・関節炎・ヘルニアなど）からくる痛みやこり、仕事中や通勤中のけが（労災保険の対象）は健康保険の対象外です（2026年11月11日確認）。[協会けんぽ：柔道整復師のかかり方](${SRC.kenpo})`,
            "サイトには、この線引きを自分の言葉でそのまま書き、公的な案内にリンクします。「どんな症状でも保険が使えます」のような書き方は、ガイドラインでも誇大な例として挙げられています。また協会けんぽは、2027年（令和9年）1月から、長期間・多部位の施術を受けている人が償還払い（いったん全額を払い、後で申請する方法）に変わる場合があると案内しています。こうした変更は、公式の案内を確認しながら更新日をつけて書きます。",
            "自費の施術（保険の対象外の施術）は、内容・目安の時間・税込の料金・起こりうるリスクを、メニューごとに文字で書きます。整体院など国家資格のない施術との違いを説明するときも、比べて優れていると言うのではなく、「柔道整復師（国家資格）が施術します」「健康保険の対象は上のけがです」と事実だけを書くのが安全です。",
          ],
        },
        {
          heading: "施術所がサイトで公開しておきたい情報",
          table: {
            head: ["情報", "ページ本文での書き方", "構造化データ"],
            rows: [
              ["施術所名", "保健所に届け出た名称を、看板・Googleビジネスプロフィール・予約サイトと同じ表記で", "name（必須）"],
              ["住所・アクセス", "番地・建物名・階まで。最寄り駅からの道順、駐車場の有無と台数", "address（必須）、geo（推奨）"],
              ["受付時間・休診日", "画像にせず文字で。最終受付、昼休み、土日祝の扱い、予約制かどうか", "openingHoursSpecification（推奨）"],
              ["保険の対象", "対象になるけが・ならないもの、骨折・脱臼の医師の同意、労災・自賠責は別であること", "本文で説明（FAQにしてもよい）"],
              ["自費の施術", "内容・目安の時間・税込料金・リスクをメニューごとに", "メニューごとにService、料金はOffer"],
              ["施術者", "柔道整復師である旨と氏名。技術の高さや有名人の担当歴のような主張は書かない", "本文で説明"],
              ["予約・連絡", "電話番号を文字で。ウェブ予約のページへのリンク", "telephone（推奨）、予約URL"],
            ],
            caption: "必須・推奨の区分は、2026年10月29日に確認したGoogleのローカルビジネスのドキュメントによります。ServiceとOfferはschema.orgの型で、Googleの必須・推奨項目ではありません。",
          },
          after: [
            `構造化データの種類は、LocalBusinessの一種であるMedicalBusiness、または一般的なLocalBusinessが選べます。Googleはできるだけ具体的な種類を使うよう案内しています。[Google：ローカルビジネスの構造化データ](${SRC.googleLocal})。どちらを選んでも、本文と名称で「柔道整復師の施術所」であることがはっきりしていれば十分で、構造化データで病院や診療所のように見せる必要はありません。ガイドラインは、病院・診療所と誤解されるおそれのある名称（例：クリニック、リハビリ）を施術所名に使わないよう求めています。`,
            "口コミや星の評価を自分のサイトに構造化データとして載せても、Googleではレビューの星として表示されません（自己言及的なレビューは、LocalBusinessとOrganizationでは認められていません）。[Google検索セントラル ブログ（2019年9月16日）](" + SRC.reviews2019 + ")。患者さんに依頼して投稿してもらった口コミを広告と分からない形で使うことは、2023年10月からステルスマーケティングとして景品表示法違反になります。[消費者庁：ステルスマーケティング](" + SRC.caaStealth + ")",
          ],
        },
        {
          heading: "WordPressの施術所サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEO・SEO SIMPLE PACK・VK All in One Expansion Unitはそのまま使えます（構造化データは重複しません）。`,
            "初回の設定ウィザードで「クリニック・歯科」を選ぶと、業種はMedicalBusinessになります。医療機関と同じ種類を使いたくない場合は「その他」を選ぶと、住所や受付時間があればLocalBusinessとして出力されます。施術所名・住所・電話番号・受付時間・説明を確認します。説明文には「柔道整復師による施術所」であることを書きます。空欄の項目だけが既存の設定から補われ、入力済みの値は上書きされません。",
            "設定画面で自費の施術をサービスとして1つずつ登録します。サービス名・所要時間（分）・料金・通貨（JPY）・カテゴリ・予約URL・説明を入れると、施術所に紐づいたServiceとして構造化データ（料金はOffer）に出力され、llms.txtにもメニューの1行として載ります。説明には効果の約束ではなく、何をするかを書きます。",
            "保険の対象・予約・駐車場・服装など、実際によく聞かれることをよくある質問に入力し、Nurevo FAQブロック（または[nurevo_faq]ショートコード）をそのページに置きます。",
            "AEOスコアの画面で診断を実行し、チェックリストに出た不足をワンクリック修正で直します。構造化データ・llms.txt・AIクローラの許可（OAI-SearchBot、PerplexityBot、Claude-SearchBotなど）は無料プランで出力されます。",
            "外からどう見えるかを[無料のAI可読性チェック](/check)で確かめ、Googleビジネスプロフィールと予約サイトの受付時間・休診日がサイトと一致しているかも見直します。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の構造化データを出さず、SEOプラグインのグラフに足りない住所・電話番号・受付時間・種類・サービスだけを追加します。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/guide/local-business-schema-seo-plugins)をご覧ください。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "受付時間・休診日・最終受付が文字で書かれ、サイト・Googleビジネスプロフィール・予約サイトで一致している。",
            "健康保険の対象になるけが・ならないものが公的な案内に沿って書かれ、骨折・脱臼の医師の同意にも触れている。",
            "自費の施術に、内容・目安の時間・税込料金・リスクが書かれている。",
            "「絶対に治る」「◯◯で1位」「どんな症状でも保険が使える」など、確かめられない表現や比較がない。",
            "ビフォーアフター写真を加工していない。患者さんの体験談を広告と分からない形で使っていない。",
            "サイトの文章をリスティング広告・チラシ・SNSの広告にそのまま使っていない（広告は法律で決められた事項だけ）。",
            "構造化データの値（名称・住所・時間・料金）が、ページに見えている値と同じ。llms.txtに概要・施術内容と料金・保険の説明・アクセス・予約のページが載っている。[llms.txtとは](/guide/llms-txt)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、患者さんが聞きそうな質問（地域＋けがや症状の場面＋曜日や時間、保険の質問）をAIに投げ、施術所が名前やURLで出てくるか、保険の説明が正しく引用されているかを見ます。AIの回答は回ごとに変わるので、同じ質問を何度か、期間をあけて確かめます。手順は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（施術所名は含めません）をPerplexityに投げ、回答に施術所の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に施術所が出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "整骨院のホームページに料金を書いてもいいですか？", a: "2025年2月の厚生労働省のガイドラインでは、施術所のウェブサイトは原則として広告とは見なされず、自費の施術内容・通常の料金・リスクを書くよう求められています。ただし料金の安さを過度に強調する書き方は避けます。リスティング広告やチラシなどの広告には、法律で決められた事項しか書けません。" },
        { q: "肩こりや腰痛のページを作ってもいいですか？", a: "健康保険の対象は外傷性の打撲・捻挫・挫傷と骨折・脱臼で、単なる肩こりや筋肉疲労は対象外です。症状名を使うページを作る場合も、効果を約束せず、保険の対象かどうかを正しく書きます。広告に症状名や効果を書くことは避け、表現に迷ったら管轄の保健所に確認してください。" },
        { q: "構造化データの種類は何にすればいいですか？", a: "LocalBusinessの一種であるMedicalBusiness、または一般的なLocalBusinessが使えます。大切なのは、名称・住所・受付時間・料金を本文と同じ値で出し、本文で柔道整復師の施術所であることをはっきり書くことです。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種・住所・受付時間・施術メニュー（サービス）・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTに整骨院が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが施術所の事実を正しく読める状態をつくり、出ているかを続けて確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが施術所のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },

    en: {
      title: "AI Search for Seikotsuin (Judo Therapy) Clinics in Japan | Nurevo",
      description: "How seikotsuin and sekkotsuin clinics in Japan can get AI to read their hours, insurance coverage, fees and booking correctly, within the 2025 advertising guideline.",
      h1: "AI search for seikotsuin and sekkotsuin clinics: getting AI to read your hours, insurance coverage and fees correctly, within Japan's advertising rules",
      lead: "AI search optimization (AEO) for a seikotsuin or sekkotsuin (a clinic run by licensed judo therapists, often called bone-setting clinics) comes down to publishing your reception hours, days closed, location, booking method, which injuries public health insurance covers, and your self-paid treatments and fees, accurately and consistently in both page text and structured data. Under the Ministry of Health, Labour and Welfare guideline of February 2025, a clinic's own website is in principle not treated as advertising, but claims like \"guaranteed to cure\" and edited before-and-after photos should stay off it too. What AI needs from you is checkable facts, not sales copy.",
      intro: [
        "Written November 11, 2026 (JST). Information from the Ministry of Health, Labour and Welfare (MHLW), the Japan Health Insurance Association and local governments was checked on each official page on the dates given in the text. Most linked sources are in Japanese.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your clinic's facts readable to AI. They do not guarantee that an AI will mention your clinic or rank it anywhere. This article is not legal advice: if you are unsure about a phrase, ask the public health center that oversees your clinic. If you run a chiropractic or physiotherapy clinic outside Japan, the approach carries over, but your advertising rules and insurance terms will differ.",
      ],
      sections: [
        {
          heading: "What patients ask AI",
          paragraphs: [
            "When someone asks ChatGPT, Perplexity or Google's AI Overviews to find a seikotsuin, the AI reads what it can find on the web and builds an answer. The questions mix place, day, time, insurance and treatment: \"a sekkotsuin near the station open on Saturday evening\", \"can I use health insurance for a sudden back strain?\", \"what is the difference between a seikotsuin and a seitai clinic?\", \"a clinic that treats children's sports injuries\".",
            "To answer them, an AI has to be able to read, as text, where your clinic is, until what time it takes patients on which days, whether booking is needed, which injuries insurance covers, and what self-paid treatments cost. If your hours are only in an image, days closed differ between pages, or there is no explanation of insurance, your clinic is harder to use in an answer.",
            `Google says there are no additional requirements and no special schema.org structured data needed to appear in AI Overviews or AI Mode, and that the usual basics still matter, such as making structured data match the visible text and keeping your Business Profile up to date (checked November 1, 2026). [Google: AI features and your website](${SRC.googleAi})`,
          ],
        },
        {
          heading: "First: your website and your ads follow different rules",
          paragraphs: [
            `The Judo Therapists Act limits what a judo therapy clinic may advertise. On February 18, 2025, the MHLW issued an advertising guideline for massage, acupuncture, moxibustion and judo therapy (notice 医政発0218第1号) that sets out what counts as an ad: something that meets all three conditions of inducement, specificity and recognizability. A clinic's own website, which people reach by searching or typing its address, is in principle not treated as an ad (checked November 11, 2026). [MHLW: summary of the guideline (PDF, Japanese)](${SRC.mhlwSummary}), [Bunkyo City: advertising rules for treatment clinics (Japanese)](${SRC.bunkyo})`,
            "That does not mean anything goes on your website. The same guideline asks websites to explain self-paid treatments, their usual fees and their risks or side effects, and says they should not carry claims that cannot be verified (\"guaranteed to cure\"), edited before-and-after photos, comparisons such as \"No. 1 on a review site\", excessive emphasis on low prices, or wording that plays on fear. Banner ads and paid listings shown as sponsored search results are treated as ads when they meet the three conditions, and so are social media posts.",
          ],
          table: {
            head: ["Where it appears", "How it is treated (February 2025 guideline)", "What to watch for AI search"],
            rows: [
              ["Your website text", "In principle not an ad; you are asked to explain self-paid treatments, fees and risks", "The place for detailed facts. Leave out exaggeration, edited photos and ranking claims"],
              ["Structured data and llms.txt", "Part of the website, restating the page's facts for machines (the guideline does not mention them specifically)", "Add no effects or ratings that are not in your text. Keep values identical to the page"],
              ["Search ads and banner ads", "Ads when they meet the conditions; only the items the law allows", "No fees, symptom names or skill claims in ad copy"],
              ["Social media posts", "Treated as ads when they meet the three conditions", "Do not post anything that contradicts your website's facts"],
            ],
            caption: "Based on the MHLW summary of the guideline (February 18, 2025). Whether a particular phrase counts as an ad is for your public health center to confirm.",
          },
          after: [
            `What an ad may say includes: that the practitioner is a judo therapist, the clinic's name, phone number and location, treatment days and hours, \"bone-setting\" (ほねつぎ or 接骨), that patients can claim health insurance reimbursement (for fractures and dislocations, only when the ad states that a doctor's consent is required), booking, holiday or evening treatment, home visits and parking. \"All insurance accepted\" and \"traffic accidents handled\" are given as examples of what may not be advertised. Hyogo Prefecture likewise says \"traffic accident treatment specialist\" and \"whiplash specialist\" cannot be advertised (page updated November 17, 2025). [Hyogo Prefecture: advertising by treatment clinics (Japanese)](${SRC.hyogo}). Not reusing your website copy in search ads or flyers prevents the most common mistake.`,
          ],
        },
        {
          heading: "Insurance coverage is the fact AI uses most",
          paragraphs: [
            `\"Can I use health insurance at a seikotsuin?\" is a question AI gets often. According to the Japan Health Insurance Association, health insurance covers acute or traumatic bruises, sprains and strains (including pulled muscles) and fractures and dislocations. For fractures and dislocations, a doctor's consent is needed in advance except for emergency first aid. Simple stiff shoulders or muscle fatigue, use as a substitute for relaxation massage, pain or stiffness caused by illness (neuralgia, rheumatism, frozen shoulder, arthritis, herniated discs and so on), and injuries at work or while commuting (covered by workers' compensation instead) are not covered (checked November 11, 2026). [Japan Health Insurance Association: using a judo therapist (Japanese)](${SRC.kenpo})`,
            "State this line in your own words on your site and link to the official explanation. Writing \"insurance covers any symptom\" is listed in the guideline as an example of exaggeration. The association also says that from January 2027, people receiving treatment on many body parts over a long period may be moved to reimbursement payment, where they pay in full and claim later. Write changes like this with the official page at hand and a date next to them.",
            "For self-paid treatments (those insurance does not cover), give each one a plain description, the typical duration, the price including tax and the possible risks. When you explain how you differ from unlicensed treatments such as seitai, avoid claiming to be better; stating facts such as \"treatment is given by a licensed judo therapist\" and \"insurance covers the injuries listed above\" is the safe approach.",
          ],
        },
        {
          heading: "The facts a clinic should publish",
          table: {
            head: ["Fact", "On the page", "In structured data"],
            rows: [
              ["Clinic name", "The name you registered with the public health center, spelled the same on your sign, Business Profile and booking sites", "name (required)"],
              ["Address and directions", "The full address including floor, walking directions from the nearest station, and whether there is parking and for how many cars", "address (required), geo (recommended)"],
              ["Reception hours and days closed", "As text, not an image: last reception time, lunch break, weekends and holidays, whether booking is required", "openingHoursSpecification (recommended)"],
              ["Insurance coverage", "Which injuries are covered and which are not, doctor's consent for fractures and dislocations, workers' and car insurance being separate", "Explained in the text (an FAQ works too)"],
              ["Self-paid treatments", "Description, typical duration, price including tax and risks for each", "A Service per treatment, with an Offer for the price"],
              ["Practitioners", "That they are licensed judo therapists, and their names. No claims about superior skill or treating celebrities", "Explained in the text"],
              ["Booking and contact", "The phone number as text and a link to your online booking page", "telephone (recommended), booking URL"],
            ],
            caption: "Required and recommended properties as listed in Google's local business documentation on October 29, 2026. Service and Offer are schema.org types, not Google required or recommended properties.",
          },
          after: [
            `For the structured data type, you can use MedicalBusiness, a kind of LocalBusiness, or plain LocalBusiness. Google asks you to use the most specific type possible. [Google: Local business structured data](${SRC.googleLocal}). Either is fine as long as your name and page text make it clear that this is a judo therapy clinic; there is no need to look like a hospital or medical clinic in your markup. The guideline asks clinics not to use names that could be mistaken for a hospital or medical clinic (for example \"clinic\" or \"rehab\").`,
            "Marking up reviews or star ratings on your own site will not get you review stars in Google: self-serving reviews aren't allowed for LocalBusiness and Organization. [Google Search Central blog, September 16, 2019](" + SRC.reviews2019 + "). In Japan, using reviews you asked patients to post without making clear they are advertising has been a violation of the Act against Unjustifiable Premiums and Misleading Representations since October 2023. [Consumer Affairs Agency: stealth marketing (Japanese)](" + SRC.caaStealth + ")",
          ],
        },
        {
          heading: "Setting it up on a WordPress clinic site",
          list: [
            `Install Nurevo AEO (free) from [WordPress.org](${WP_ORG}) and activate it. Keep Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK or VK All in One Expansion Unit if you use one; structured data is not duplicated.`,
            "In the setup wizard, choosing \"Clinic or dental\" sets the business type to MedicalBusiness. If you would rather not use a medical type, choose \"Other\": with an address or hours set, the clinic is published as a LocalBusiness. Confirm the name, address, phone, reception hours and description, and say in the description that this is a clinic run by licensed judo therapists. Only blank fields are filled in from your existing settings; nothing you typed is overwritten.",
            "Under Settings, add each self-paid treatment as a service. With a service name, duration (minutes), price, currency (JPY), category, booking URL and description, it is published as a Service linked to your clinic (the price as an Offer) and listed as a line in llms.txt. Describe what the treatment involves rather than promising results.",
            "Enter the questions patients really ask (insurance, booking, parking, what to wear) as FAQ, and place the Nurevo FAQ block or the [nurevo_faq] shortcode on that page.",
            "Run the diagnosis on the AEO Score screen and apply the one-click fixes the checklist offers. Structured data, llms.txt and AI crawler access (OAI-SearchBot, PerplexityBot, Claude-SearchBot and others) are all on the free plan.",
            "See what AI reads from the outside with the [free AI readability check](/check), and confirm that your hours and days closed match your Google Business Profile and booking sites.",
          ],
          after: [
            "With an SEO plugin active, Nurevo AEO does not print a second set of structured data. It adds only the missing address, phone, hours, business type and services into the graph your SEO plugin already publishes. See [adding local business schema to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins).",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Reception hours, days closed and last reception times are written as text and match across your site, Google Business Profile and booking sites.",
            "Which injuries insurance covers and does not cover is explained in line with the official guidance, including doctor's consent for fractures and dislocations.",
            "Each self-paid treatment shows a description, typical duration, price including tax and risks.",
            "No unverifiable claims or comparisons such as \"guaranteed to cure\", \"No. 1 in ...\" or \"insurance covers any symptom\".",
            "Before-and-after photos are not edited, and patient testimonials are not used as undisclosed advertising.",
            "Website copy is not reused as-is in search ads, flyers or social media ads (ads may carry only the items the law allows).",
            "Values in your structured data (name, address, hours, prices) match the page, and llms.txt lists your overview, treatments and fees, insurance explanation, directions and booking pages. [What is llms.txt?](/guide/llms-txt)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, ask AI the questions your patients would ask (area plus the kind of injury plus day or time, and insurance questions) and see whether your clinic comes up by name or URL, and whether your insurance explanation is quoted correctly. Answers change between runs, so ask the same questions a few times, spread over time. The method is in [how to measure AI visibility](/guide/measure-ai-visibility).",
            "Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your clinic's name) are put to Perplexity, and the plugin records whether the answers named your clinic or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta: how often your clinic appears in AI answers, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response.",
          ],
        },
      ],
      faqs: [
        { q: "Can a seikotsuin show its fees on its website?", a: "Under the MHLW guideline of February 2025, a clinic's own website is in principle not treated as advertising, and websites are asked to explain self-paid treatments, their usual fees and risks. Avoid putting excessive emphasis on low prices. Ads such as search ads and flyers may carry only the items the law allows." },
        { q: "Can I create pages about stiff shoulders or back pain?", a: "Health insurance covers traumatic bruises, sprains, strains, fractures and dislocations; simple stiff shoulders and muscle fatigue are not covered. If a page uses a symptom name, do not promise results and state correctly whether insurance applies. Keep symptom names and effects out of ads, and ask your public health center when unsure." },
        { q: "Which structured data type should I use?", a: "MedicalBusiness, a kind of LocalBusiness, or plain LocalBusiness both work. What matters is that name, address, hours and prices match the page, and that the text makes clear the clinic is run by licensed judo therapists." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type, address, hours, services and FAQ structured data, llms.txt, AI crawler rules and the AEO score are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee my clinic appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your clinic's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
