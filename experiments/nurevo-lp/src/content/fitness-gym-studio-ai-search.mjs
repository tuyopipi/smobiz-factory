// Content page: AI search (AEO) for gyms, personal training gyms and yoga /
// pilates studios. Industry page.
//
// Written 2026-11-12 (JST). Every claim about Nurevo AEO is one the plugin's
// readme or code makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary):
// the setup wizard has no fitness card; "Other" (ja: その他) keeps a type of the
// owner's own that no card claims (includes/setup-wizard.php,
// webmcp_canary_wizard_business_type_for); Settings has a free-text "Business
// type (schema.org type)" field (ja: 業種（schema.org型）); ExerciseGym and
// SportsActivityLocation are in the recognised type list (nurevo-webmcp.php,
// webmcp_canary_local_business_types); each service takes a name, duration
// (minutes), price, currency, category, booking URL and description and is
// published as a Service with an Offer and a booking action and as an llms.txt
// line; a price is published only when entered; opening hours in common forms
// become openingHoursSpecification and the wizard reads them back (readme
// 0.9.x changelog). Free monthly check: three questions to Perplexity, never the
// business name (readme). Pro measurement runs on Perplexity.
//
// Outside facts:
// - schema.org types, checked 2026-11-12 against schema-dts 2.1.0 (generated
//   from the schema.org vocabulary; schema.org itself could not be fetched from
//   this run): ExerciseGym ("A gym.") is a subtype of SportsActivityLocation;
//   HealthClub is a subtype of both SportsActivityLocation and
//   HealthAndBeautyBusiness; SportsActivityLocation's subtypes include
//   ExerciseGym, HealthClub, SportsClub, PublicSwimmingPool, TennisComplex,
//   GolfCourse. There is no yoga- or pilates-specific type.
// - Google "AI features and your website" and Google's AI optimization guide,
//   checked 2026-11-12 (by the 08:00 run for tutoring-school-ai-search).
// - Google LocalBusiness structured data (checked 2026-10-29).
// - OpenAI crawlers (checked 2026-10-31).
// - Google Search Central blog 2019-09-16 (self-serving reviews).
// - CAA stealth marketing (checked 2026-11-01); CAA No.1 report 2024-09-26
//   (checked 2026-11-12 by the 08:00 run).
// Contract law (特定商取引法 etc.) is not explained: no claim is made about
// which gym contracts it covers. Effect claims are only described as needing
// support, without citing an article number.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleAiGuide: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide",
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  exerciseGym: "https://schema.org/ExerciseGym",
  healthClub: "https://schema.org/HealthClub",
  sportsLocation: "https://schema.org/SportsActivityLocation",
  openaiBots: "https://developers.openai.com/api/docs/bots",
  reviews2019: "https://developers.google.com/search/blog/2019/09/making-review-rich-results-more-helpful",
  caaStealth: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/stealth_marketing/",
  no1: "https://www.caa.go.jp/notice/entry/039459/",
};

export default {
  slug: "fitness-gym-studio-ai-search",
  targetQueries: [
    "AI search optimization for gyms and fitness studios",
    "how to get my gym recommended by ChatGPT",
    "ExerciseGym schema markup",
    "ジム AI検索対策",
    "パーソナルジム LLMO 対策",
    "ヨガ ピラティス スタジオ AI検索",
  ],
  related: ["local-business-schema-seo-plugins", "measure-ai-visibility", "llms-txt", "hair-salon-ai-search", "search-console-ai-features"],
  locales: {
    ja: {
      title: "ジム・ヨガ・ピラティスのAI検索対策：料金と体験の書き方 | Nurevo",
      description: "ジム・パーソナルジム・ヨガ・ピラティススタジオのAI検索対策は、料金・営業時間・体験・解約条件の事実を本文と構造化データで正確に出すことから。業種の型、会員プランの書き方、WordPressでの手順も解説。",
      h1: "ジム・ヨガ・ピラティススタジオのAI検索対策：料金・営業時間・体験・解約条件をAIに正しく読ませる手順",
      lead: "ジム・パーソナルジム・ヨガやピラティスのスタジオのAI検索対策（AEO・LLMO）の中心は、月会費や入会金などの料金（税込）、営業時間とスタッフがいる時間、体験レッスンの内容と料金、休会・解約の条件、設備やクラスの種類という事実を、ページ本文と構造化データ（schema.orgのExerciseGymなど）で正確に、矛盾なく公開することです。この業種でいちばん差がつくのは、会員プランを「いくらで・いつ・何が使えて・どうやめられるか」がわかる形で書くことです。",
      intro: [
        "作成日：2026年11月12日（JST）。Google・OpenAI・消費者庁の情報は、本文に記した日に各公式ページで確認したものです。契約や広告の法律の細かい条件は解説していません。最新の公式情報や専門家に確認してください。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIがジムやスタジオの事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "ジムやスタジオ選びでAIに聞かれていること",
          paragraphs: [
            "ChatGPT、Perplexity、GoogleのAI Overviewsなどにジムやスタジオを探す質問をすると、AIはウェブ上の情報を読み、いくつかの施設名を挙げて答えをまとめます。聞かれるのは「◯◯駅の近くで、夜11時以降も使えて月1万円以下のジム」「初心者の女性が通いやすい◯◯市のピラティススタジオ」「体験が無料のパーソナルジム」「シャワーと駐車場があるジム」「休会できるヨガスタジオ」のように、場所・料金・時間・設備・条件が組み合わさった質問です。",
            "この業種の質問は、ほとんどが比べるための質問です。AIが答えに使えるのは、料金・時間・設備・体験・やめ方といった、比べられる事実です。「理想の体へ」「圧倒的な結果」のような言葉は比べる材料にならず、料金ページが画像だけだったり「料金はお問い合わせください」だったりすると、その施設は比較の候補から外れやすくなります。",
            `Googleは、AI OverviewsやAI Modeに出るための追加の要件や特別なschema.orgの構造化データはなく、構造化データは見える文章と一致させるなど通常の基本が大切だとしています（2026年11月12日確認）。[Google：AI features and your website](${SRC.googleAi})。GoogleのAI検索向けのガイドでも、生成AIの検索に構造化データは必須ではなく、Google検索はllms.txtを使わないとしています。[Google：AI最適化ガイド](${SRC.googleAiGuide})。構造化データやllms.txtは、ChatGPTやPerplexityなど他のAIも含めて事実を読みやすくする補助であり、本体は本文の事実です。`,
          ],
        },
        {
          heading: "まず決める：構造化データの業種（型）",
          paragraphs: [
            `構造化データでは、施設の種類をschema.orgの型で表します。運動の施設には[SportsActivityLocation](${SRC.sportsLocation})（スポーツの施設）と、その中のより具体的な型があります。ジムには[ExerciseGym](${SRC.exerciseGym})、フィットネスクラブ型の施設には[HealthClub](${SRC.healthClub})（SportsActivityLocationとHealthAndBeautyBusinessの両方に属する型）が使えます。ヨガやピラティス専用の型はありません（いずれも2026年11月12日にschema.orgの型の定義で確認）。Googleのローカルビジネスの構造化データのドキュメントは、できるだけ具体的な種類を使うよう案内しています（2026年10月29日確認）。[Google：ローカルビジネスの構造化データ](${SRC.googleLocal})。`,
          ],
          table: {
            head: ["施設のタイプ", "主なサービス", "選ぶ型の目安"],
            rows: [
              ["フィットネスジム・24時間ジム", "マシン・フリーウェイトの自主トレーニング", "ExerciseGym"],
              ["パーソナルジム", "トレーナーとの1対1の指導、食事の助言", "ExerciseGym"],
              ["総合フィットネスクラブ", "ジム・プール・スタジオ・浴場などを組み合わせた会員制施設", "HealthClub"],
              ["ヨガ・ピラティススタジオ", "グループレッスン・マシンピラティス・個人レッスン", "ExerciseGym（専用の型はない。運動の施設であることを伝える）"],
              ["プール・テニススクールなど", "特定のスポーツの施設", "SportsActivityLocationの中の該当する型（PublicSwimmingPool、TennisComplexなど）"],
            ],
            caption: "型の選び方は目安です。実際に提供しているサービスのうち、いちばん中心になるものに合わせます。どの型を選んでも、Googleでの表示が約束されるわけではありません。",
          },
          after: [
            "型がLocalBusinessやOrganizationのままだと、構造化データからは運動の施設であることが伝わりません。ヨガやピラティスのスタジオは、型ではなく、サービス（後述）とページ本文で「ヨガ」「マシンピラティス」と具体的に伝えます。整体やリラクゼーションのように施術が中心の店は、この記事の型ではなく、施術の内容に合う型を検討します。",
          ],
        },
        {
          heading: "公開しておきたい事実：比べられる形で書く",
          paragraphs: [
            "Googleのローカルビジネスの構造化データでは、nameとaddressが必須、openingHoursSpecification・telephone・urlなどが推奨です（2026年10月29日確認）。ジムやスタジオでは、これに加えて次の事実が、比較の質問で選ばれるかどうかに直結します。",
          ],
          table: {
            head: ["情報", "ページ本文での書き方", "構造化データ"],
            rows: [
              ["施設名・店舗名", "正式名称と店舗名を、看板・Googleビジネスプロフィール・予約サイトと同じ表記に。複数店舗なら店舗ごとのページを", "name（必須）"],
              ["所在地・アクセス", "番地・建物名・階数まで。最寄り駅から徒歩何分か、駐車場・駐輪場の有無を文字で", "address（必須）"],
              ["営業時間", "利用できる時間と、スタッフがいる時間を分けて書く（24時間ジムでは特に）。定休日・休館日も", "openingHoursSpecification（推奨）"],
              ["料金", "入会金・事務手数料・月会費・回数券・パーソナルの1回料金を税込で。キャンペーンは期間を添えて別に", "決まった金額のものはサービスの料金に"],
              ["体験・見学", "体験の料金・所要時間・持ち物・予約方法。当日入会の特典があるならその条件も", "サービス（所要時間・料金・予約URL）"],
              ["クラス・レッスン", "種類・時間割・定員・難易度・対象（初心者・女性専用・シニアなど）", "クラスの種類ごとにService"],
              ["設備", "マシンの種類と台数の目安、シャワー・更衣室・ロッカー・タオルの有無と料金", "本文に書く"],
              ["指導者", "トレーナー・インストラクターの経歴と資格（資格は正式名称で）", "本文に書く"],
              ["休会・解約", "休会の可否と費用、解約の申し出の期限と方法、最低利用期間", "本文に書く（FAQにも）"],
            ],
            caption: "必須・推奨の区分は、2026年10月29日に確認したGoogleのローカルビジネスのドキュメントによります。Serviceはschema.orgの型で、Googleの必須・推奨項目ではありません。",
          },
          after: [
            "大切なのは、サイト本文・構造化データ・Googleビジネスプロフィール・予約サイトやポータルの施設情報・llms.txtで、同じ事実が同じ値になっていることです。料金改定や営業時間の変更のときは、すべてを一緒に更新します。古い料金がどこかに残っていると、AIがそれを今の料金として答えることがあります。",
          ],
        },
        {
          heading: "会員プランを「AIが比べられる記録」にする",
          paragraphs: [
            "ジムやスタジオのサイトで、AIにいちばん読まれてほしいのは料金ページです。ところが多くの料金ページは、プラン名と月額だけを大きく見せ、入会金や事務手数料、利用できる時間、最低利用期間、解約の期限が注意書きの小さな文字や画像の中にあります。これでは「月1万円以下で夜も使えるジム」のような質問に答える材料になりません。会員プランは、プランごとに次の項目がそろった記録として、表で書きます。",
          ],
          table: {
            head: ["項目", "書き方の例", "注意"],
            rows: [
              ["プラン名", "レギュラー会員／デイタイム会員／月4回コース", "店舗の看板や予約システムと同じ名前に"],
              ["月額（税込）", "月額◯,◯◯◯円（税込）", "キャンペーン価格と通常価格を混ぜない"],
              ["初期費用", "入会金◯円・事務手数料◯円・カードキー発行料◯円", "合計の初月費用も書くと親切"],
              ["使える時間・店舗", "全日24時間（スタッフ在館は平日10〜19時）／平日10〜17時のみ／全店舗利用可", "時間の制限はプランの違いの中心"],
              ["含まれるもの", "マシンエリア・スタジオレッスン・シャワー・タオル", "別料金のもの（ロッカー・ウェアなど）は分けて書く"],
              ["最低利用期間", "なし／入会月を含め◯か月", "ある場合は必ず書く"],
              ["休会", "可（月額◯円、最長◯か月）／不可", "申し出の期限も"],
              ["解約", "前月◯日までに店頭・アプリで申し出", "方法と期限を具体的に"],
              ["掲載日・改定日", "2026年11月改定", "古い料金が今の料金として読まれないため"],
            ],
            caption: "項目は、比べる人とAIが必要とする事実から選んだものです。項目の値は記入例で、実際の金額や条件は自店の規約どおりに書きます。",
          },
          after: [
            "パーソナルジムの「◯回コース」のように総額が大きいプランでは、総額・1回あたりの料金・有効期限・回数を使い切れなかったときの扱い・途中でやめたときの返金の考え方を、契約書と同じ内容で書きます。契約の種類や期間・金額によっては、特定商取引法などのルールが関わることがあります。この記事では対象になる条件は解説していないので、消費者庁の案内や専門家で確認してください。",
            "料金を公開すると安いところと比べられて不利だと考える施設もありますが、料金がわからない施設は、比べる質問の答えに入る材料がそもそもありません。高い料金には、指導の内容・時間・設備・サポートなど、その理由を事実で添えます。",
          ],
        },
        {
          heading: "効果・実績・口コミの書き方：AI向けに足してはいけないもの",
          paragraphs: [
            "「2か月で−10kg」「必ず痩せる」のような効果の表示や、ビフォーアフターの写真は、この業種の広告でよく使われます。根拠を示せない効果の表示は、広告のルール上の問題になりえます。効果を載せるなら、どんな人が・どんな条件で・どれくらいの期間で取り組んだ結果か、個人差があることを、同じページに読める形で書きます。AIは強い言葉より確かめられる事実を使うので、根拠のない表示は本文にも構造化データにも入れないのが安全です。",
            `「地域満足度No.1」のような表示も慎重に。消費者庁は2024年9月26日の報告書で、No.1表示に合理的な根拠があると言えるには、比較する対象・調査に答える人・調査の方法・表示と結果の一致が適切である必要があるとし、利用したことのない人に印象を聞くような調査をもとにした表示は問題となるおそれがあると示しました（2026年11月12日確認）。[消費者庁：No.1表示に関する実態調査報告書](${SRC.no1})`,
            `施設のページに星の評価（AggregateRating）の構造化データを付けるよう勧める解説がありますが、自社サイトに載せた自社の口コミを評価の構造化データにしても、Googleでは評価の星として表示されません。Googleは2019年に、ある事業者についての口コミをその事業者自身のサイトに載せるもの（自己言及的なレビュー）は、LocalBusinessとOrganizationでは認めないとしています。[Google検索セントラル ブログ（2019年9月16日）](${SRC.reviews2019})`,
            `日本では、2023年10月1日からステルスマーケティングが景品表示法違反になりました。消費者庁は、事業者が第三者に依頼・指示して投稿させた口コミも、その事業者の広告に含まれるとしています（2026年11月1日確認）。[消費者庁：ステルスマーケティング](${SRC.caaStealth})。体験談は、本人の同意を得た本物の声を、広告であることを隠さずに載せます。`,
          ],
        },
        {
          heading: "WordPressのジム・スタジオサイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEO・SEO SIMPLE PACK・VK All in One Expansion Unitはそのまま使えます。`,
            "初回の設定ウィザードには運動の施設の選択肢がないので、「その他」を選びます。そのあと設定画面の「業種（schema.org型）」に、上の表で選んだExerciseGym・HealthClubなどの型を入力します。いったん設定すれば、あとでウィザードで「その他」を選び直しても保たれます。",
            "施設名・住所・電話番号・営業時間・説明を確認します。営業時間は「10:00-22:00、木曜定休」のような一般的な書き方なら構造化データの営業時間として出力され、ウィザードでは公開される形で読み上げて確認できます。読み取れない書き方は推測されず、入力したまま出力されます。スタッフがいる時間は、説明と本文に書きます。",
            "説明（description）には、施設の種類・場所・特徴を1〜2文で書きます。例：「◯◯駅徒歩3分のマシンピラティス専門スタジオ。初心者向けクラス中心、1クラス定員6名、女性専用。」",
            "設定画面で、体験レッスン・パーソナルトレーニング（60分）・グループレッスンの種類などを、サービスとして1つずつ登録します。サービス名・説明・ページのURL・カテゴリ・所要時間（分）を入れ、予約ページがあれば予約URLに入れます。料金は、決まった金額があるものだけ入れます（空欄なら料金は出力されません）。会員プランの月額は、構造化データより料金ページの表で伝えるほうが正確です。サービスは施設に紐づいたServiceとして構造化データに出力され、llms.txtにも1行ずつ載ります。",
            "よくある質問（体験の持ち物、初心者でも大丈夫か、休会・解約の方法、駐車場、シャワーやタオルの有無など）を入力し、FAQを見せたいページにNurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。",
            "AEOスコアの画面で診断を実行し、チェックリストに出た不足をワンクリック修正で直します。構造化データ・llms.txt・AIクローラの許可は無料プランで出力されます。",
            "外からどう見えるかを[無料のAI可読性チェック](/check)で確認し、Googleビジネスプロフィールや予約サイトの施設情報と一致しているかも見直します。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の施設情報の構造化データを出さず、足りない住所・電話番号・営業時間・ExerciseGymなどの種類・サービスだけを追加します。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/guide/local-business-schema-seo-plugins)を参照してください。",
            `AIクローラについては、OpenAIは、OAI-SearchBotを拒否したサイトはChatGPTの検索回答に表示されないとしています（2026年10月31日確認）。[OpenAI：クローラの概要](${SRC.openaiBots})。robots.txtやセキュリティ系のプラグイン、予約システムの設定で、気づかずに止めていないかを確認します。`,
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "施設名・住所・電話・営業時間・休館日が、サイト・Googleビジネスプロフィール・予約サイトで一致している。",
            "構造化データの業種が、LocalBusinessのままではなくExerciseGymなど施設に合った型になっている。",
            "営業時間とスタッフがいる時間が分けて書かれている。",
            "会員プランごとに、月額（税込）・初期費用・使える時間・最低利用期間・休会・解約の条件が文字の表で書かれている。",
            "料金ページに改定日があり、終わったキャンペーンや古い料金が残っていない。",
            "体験の料金・所要時間・持ち物・予約方法が書かれ、サービスとして登録されている。",
            "クラスの種類・時間割・対象者が、画像ではなく文字で書かれている。",
            "根拠のない効果の表示や最上級の表現がなく、自社サイトの口コミを評価の構造化データにしていない。",
            "llms.txtに、施設の概要・料金・体験・クラス・アクセス・よくある質問のページが載っている。[llms.txtとは](/guide/llms-txt)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、入会を考える人が聞きそうな質問（場所＋料金＋時間＋条件）を、施設名を入れずにAIに投げて、自分の施設が名前やURLで出てくるかを見ます。あわせて「◯◯ジムの月会費と解約方法は？」のように施設名で聞き、答えの料金や条件が今のものと合っているかも確かめます。間違っていたら、AIがどのページを出典にしたかを見て、そのページや外部の掲載情報を直します。AIの回答は回ごとに変わるので、同じ質問を何度か、期間をあけて記録するのが現実的です。手順と記録表は[AIでの登場率の測り方](/guide/measure-ai-visibility)に、GoogleのAI機能での表示回数は[Search Consoleの見方](/guide/search-console-ai-features)にまとめています。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（施設名は含めません）をPerplexityに投げ、回答に施設の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に施設が出る割合を競合と比べて推移で見られます（現在の計測先はPerplexity、ChatGPTは設定され次第）。",
          ],
        },
      ],
      faqs: [
        { q: "ジムやスタジオのAI検索対策は、何から始めればいいですか？", a: "料金（税込）・営業時間とスタッフがいる時間・体験・休会と解約の条件・設備とクラスを、ページ本文に文字で正しく書くことからです。そのうえで、構造化データの業種をExerciseGymなど施設に合った型にし、体験やレッスンをサービスとして登録し、Googleビジネスプロフィールや予約サイトの情報とそろえます。" },
        { q: "ヨガやピラティスのスタジオに合う構造化データの型はありますか？", a: "schema.orgにはヨガやピラティス専用の型はありません。運動の施設であることはExerciseGymなどで伝え、ヨガ・マシンピラティスなどの中身は、サービスとページ本文で具体的に書きます。" },
        { q: "料金は公開したほうがいいですか？", a: "比べる質問に答えてもらうには、公開したほうが有利です。料金がわからない施設は、答えに入る材料がありません。入会金や事務手数料、最低利用期間も含め、税込で、改定日を添えて書きます。" },
        { q: "ビフォーアフターの写真は載せてもいいですか？", a: "載せるなら、本人の同意を得た本物の事例で、取り組んだ期間や条件、個人差があることを同じページに書きます。根拠を示せない効果の表示は広告のルール上の問題になりえるので、表示の前に確認してください。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種（ExerciseGymなど）・住所・営業時間・サービス・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）です。[WordPress.orgのNurevo AEO](${WP_ORG})` },
        { q: "対策すればChatGPTにジムが必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが施設の事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが施設のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },

    en: {
      title: "AI Search for Gyms and Yoga/Pilates Studios: Prices, Trials | Nurevo",
      description: "AEO for gyms and studios starts with publishing prices, hours, trial classes and cancellation terms correctly, in page text and ExerciseGym structured data.",
      h1: "AI search for gyms and yoga or pilates studios: how to get AI to read your prices, hours, trials and cancellation terms correctly",
      lead: "AI search optimization (AEO) for a gym, a personal training studio or a yoga or pilates studio comes down to publishing, accurately and consistently, your membership fees and joining fees (with tax), your opening hours and staffed hours, what your trial class includes and costs, how freezing and cancelling work, and your facilities and classes, both in your page text and in schema.org structured data such as ExerciseGym. The biggest difference in this trade comes from writing each membership plan so that it is clear what it costs, when it can be used, what it includes and how to leave.",
      intro: [
        "Written November 12, 2026 (JST). Information from Google, OpenAI and Japan's Consumer Affairs Agency was checked on each official page on the dates given in the text. Contract and advertising law is not explained in detail here; check current official sources or a professional.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your gym's or studio's facts readable to AI. They do not guarantee that an AI will mention you or rank you anywhere.",
      ],
      sections: [
        {
          heading: "What people ask AI when choosing a gym or studio",
          paragraphs: [
            "When someone asks ChatGPT, Perplexity or Google's AI Overviews to find a gym or studio, the AI reads what it can find on the web and answers with a few names. The questions combine place, price, time, facilities and conditions: \"a gym near the station that's open after 11 pm and costs under $70 a month\", \"a beginner-friendly pilates studio for women in my town\", \"a personal training gym with a free trial\", \"a gym with showers and parking\", \"a yoga studio that lets you pause your membership\".",
            "Almost every question in this trade is a comparison. What an AI can use in its answer are facts it can compare: price, hours, facilities, trials and how to leave. Phrases like \"transform your body\" or \"unbeatable results\" give it nothing to compare, and if your price page is an image or says \"contact us for pricing\", you are easy to leave out of the shortlist.",
            `Google says there are no additional requirements and no special schema.org structured data needed to appear in AI Overviews or AI Mode, and that the usual basics still matter, such as making structured data match the visible text (checked November 12, 2026). [Google: AI features and your website](${SRC.googleAi}). Google's AI optimization guide also says structured data isn't required for generative AI search and that Google Search doesn't use llms.txt. [Google: AI optimization guide](${SRC.googleAiGuide}). Structured data and llms.txt help AI systems, including ChatGPT and Perplexity, read your facts more easily; the facts in your page text are the real work.`,
          ],
        },
        {
          heading: "Decide first: your business type in structured data",
          paragraphs: [
            `In structured data, the kind of business is expressed as a schema.org type. Exercise venues sit under [SportsActivityLocation](${SRC.sportsLocation}), which has more specific types. A gym can use [ExerciseGym](${SRC.exerciseGym}), and a health-club style venue can use [HealthClub](${SRC.healthClub}), which belongs to both SportsActivityLocation and HealthAndBeautyBusiness. There is no type for yoga or pilates studios (all checked against the schema.org type definitions on November 12, 2026). Google's local business documentation asks you to use the most specific type possible (checked October 29, 2026). [Google: local business structured data](${SRC.googleLocal}).`,
          ],
          table: {
            head: ["Type of venue", "Main service", "Type to choose (guide)"],
            rows: [
              ["Fitness gym, 24-hour gym", "Self-guided training on machines and free weights", "ExerciseGym"],
              ["Personal training gym", "One-to-one coaching, nutrition advice", "ExerciseGym"],
              ["Full-service health club", "Membership venue combining gym, pool, studio and spa facilities", "HealthClub"],
              ["Yoga or pilates studio", "Group classes, reformer pilates, private sessions", "ExerciseGym (there is no dedicated type; it says you are an exercise venue)"],
              ["Pool, tennis school and similar", "A venue for a particular sport", "The matching type under SportsActivityLocation (PublicSwimmingPool, TennisComplex and others)"],
            ],
            caption: "This is a guide. Match the type to the service at the center of what you actually offer. None of these types guarantees any display in Google.",
          },
          after: [
            "If your type is still LocalBusiness or Organization, your structured data does not say you are an exercise venue. Yoga and pilates studios say what they teach not through the type but through services (below) and page text, naming \"yoga\" or \"reformer pilates\" explicitly. Businesses built around hands-on treatment, such as massage or bodywork, should look for a type that fits that treatment instead.",
          ],
        },
        {
          heading: "The facts to publish, in a form people can compare",
          paragraphs: [
            "Google's local business documentation lists name and address as required and recommends openingHoursSpecification, telephone, url and others (checked October 29, 2026). For gyms and studios, the facts below also decide whether you are picked in comparison questions.",
          ],
          table: {
            head: ["Fact", "On the page", "In structured data"],
            rows: [
              ["Venue name", "Your official name and branch name, spelled as on your sign, Google Business Profile and booking sites. One page per branch if you have several", "name (required)"],
              ["Address and access", "Full address with building and floor, minutes on foot from the nearest station, parking and bike parking, as text", "address (required)"],
              ["Opening hours", "Write the hours members can use the venue and the hours staff are present separately (especially for 24-hour gyms), plus closed days", "openingHoursSpecification (recommended)"],
              ["Prices", "Joining fee, admin fee, monthly fee, class packs and per-session personal training prices, with tax. Promotions separately, with their dates", "Fixed-price items as service prices"],
              ["Trials and tours", "Trial price, length, what to bring and how to book, and the conditions of any same-day joining offer", "A service (duration, price, booking URL)"],
              ["Classes", "Types, timetable, capacity, level and who they're for (beginners, women only, seniors)", "A Service for each kind of class"],
              ["Facilities", "Kinds of machines and roughly how many; showers, changing rooms, lockers and towels, and whether they cost extra", "Page text"],
              ["Instructors", "Trainers' and instructors' backgrounds and certifications (full official names)", "Page text"],
              ["Freezing and cancelling", "Whether members can freeze and at what cost, the notice period and method for cancelling, any minimum term", "Page text (and the FAQ)"],
            ],
            caption: "Required and recommended properties as listed in Google's local business documentation on October 29, 2026. Service is a schema.org type, not a Google required or recommended property.",
          },
          after: [
            "What matters most is that the same fact has the same value everywhere: your site, structured data, Google Business Profile, your profiles on booking and listing sites, and llms.txt. When prices or hours change, update all of them together. An old price left somewhere can be repeated by AI as today's price.",
          ],
        },
        {
          heading: "Turning membership plans into records AI can compare",
          paragraphs: [
            "The page you most want AI to read on a gym or studio site is the price page. Yet many price pages show only plan names and a big monthly figure, with the joining fee, admin fee, usable hours, minimum term and cancellation deadline tucked into small print or an image. That leaves nothing to answer \"a gym under $70 a month that's open late\" with. Write each membership plan as a record in a text table, with these items.",
          ],
          table: {
            head: ["Item", "Example", "Note"],
            rows: [
              ["Plan name", "Full member / Daytime member / Four classes a month", "Use the same name as your front desk and booking system"],
              ["Monthly price (with tax)", "X per month, tax included", "Don't mix promotional and regular prices"],
              ["Up-front costs", "Joining fee X, admin fee Y, key card Z", "Showing the total for the first month helps"],
              ["When and where it can be used", "24/7 (staffed weekdays 10:00-19:00) / weekdays 10:00-17:00 only / all branches", "Time limits are usually the main difference between plans"],
              ["What's included", "Gym floor, studio classes, showers, towels", "List extras (lockers, wear) separately"],
              ["Minimum term", "None / X months including the month you join", "Always state it if there is one"],
              ["Freezing", "Yes (X per month, up to Y months) / No", "Include the notice deadline"],
              ["Cancelling", "Tell us at the front desk or in the app by day X of the previous month", "Be specific about method and deadline"],
              ["Published or revised", "Revised November 2026", "So an old price isn't read as today's"],
            ],
            caption: "The items are the facts that people comparing venues, and AI, need. The values are placeholders; write your actual prices and terms exactly as in your membership agreement.",
          },
          after: [
            "For high-value packages such as a personal training course of a set number of sessions, write the total, the price per session, the expiry date, what happens to unused sessions and how refunds work if someone stops partway, exactly as in the contract. Depending on the type, length and value of a contract, consumer protection rules may apply (in Japan, for example, the Act on Specified Commercial Transactions). This article does not explain when they apply, so check with your regulator or a professional.",
            "Some venues worry that publishing prices invites comparison with cheaper rivals. But a venue whose price is unknown gives AI nothing to put in a comparison answer. If you charge more, add the facts that explain it: the coaching, the time, the facilities, the support.",
          ],
        },
        {
          heading: "Results, rankings and reviews: what not to add for AI",
          paragraphs: [
            "Claims such as \"lose 10 kg in two months\" or \"guaranteed results\" and before-and-after photos are common in fitness advertising. Effect claims you cannot support can be a problem under advertising rules. If you show results, say on the same page who achieved them, under what conditions and over what period, and that results vary. AI leans on facts it can check rather than strong words, so leave unsupported claims out of both your text and your markup.",
            `Take care with claims such as \"No. 1 for satisfaction in the area\" as well. In a report of September 26, 2024, Japan's Consumer Affairs Agency said that a No. 1 claim needs an appropriate choice of what is compared, of who answers, of survey method, and a match between the claim and the results, and that claims based on surveys asking people who had never used a service for their impressions may be a problem (checked November 12, 2026). [Consumer Affairs Agency: report on No. 1 claims (Japanese)](${SRC.no1})`,
            `Some guides recommend adding star ratings (AggregateRating) to your venue pages in structured data. Marking up reviews of your own business on your own site will not get you review stars in Google. In 2019 Google said that self-serving reviews, meaning reviews about a business placed on that business's own website, aren't allowed for LocalBusiness and Organization. [Google Search Central blog, September 16, 2019](${SRC.reviews2019})`,
            `Rules on undisclosed advertising differ by country, so check the ones that apply to you. In Japan, stealth marketing has been a violation of the Act against Unjustifiable Premiums and Misleading Representations since October 1, 2023, and the Consumer Affairs Agency treats reviews that a business asks or instructs third parties to post as that business's advertising (checked November 1, 2026). [Consumer Affairs Agency: stealth marketing (Japanese)](${SRC.caaStealth}). Publish real member stories, with consent, without hiding that they are promotional.`,
          ],
        },
        {
          heading: "Setting it up on a WordPress gym or studio site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit keep working as they are.`,
            "The setup wizard has no card for exercise venues, so choose \"Other\". Then enter the type you picked from the table above, such as ExerciseGym or HealthClub, in \"Business type (schema.org type)\" in Settings. Once set, choosing \"Other\" in the wizard again keeps it.",
            "Check the venue name, address, phone, opening hours and description. Opening hours written in common forms such as \"10:00-22:00, closed Thursdays\" are published as structured opening hours, and the wizard reads them back to you as they will be published. Hours the plugin cannot read are published exactly as you typed them, never guessed. Put your staffed hours in the description and page text.",
            "In the description, say in one or two sentences what kind of venue you are, where, and what sets you apart, for example \"A reformer pilates studio three minutes from X station. Mostly beginner classes, six people per class, women only.\"",
            "In Settings, add your trial class, personal training (60 minutes) and each kind of group class as services, one at a time. Enter the name, description, page URL, category and duration in minutes, and your booking page as the booking URL. Enter a price only where there is a fixed one (with the price empty, no price is published). Monthly membership fees are better shown accurately in the table on your price page than in structured data. Each service is published as a Service tied to your venue and appears as a line in llms.txt.",
            "Enter your frequently asked questions (what to bring to a trial, whether beginners are welcome, how to freeze or cancel, parking, showers and towels) and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on the page where the FAQ should show.",
            "Run the check on the AEO score screen and fix what the checklist reports with one-click fixes. Structured data, llms.txt and AI crawler rules are on the free plan.",
            "See how the site looks from outside with the [free AI readability check](/check), and confirm that your Google Business Profile and booking site profiles match.",
          ],
          after: [
            "Alongside an SEO plugin, Nurevo AEO does not print a second business node. It adds only what is missing, such as the address, phone, opening hours, a type like ExerciseGym, and services. See [adding local business details to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins) for details.",
            `On AI crawlers, OpenAI says sites that opt out of OAI-SearchBot will not be shown in ChatGPT search answers (checked October 31, 2026). [OpenAI: overview of crawlers](${SRC.openaiBots}). Check that robots.txt, a security plugin or your booking system's settings are not blocking it without your knowledge.`,
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Name, address, phone, opening hours and closed days match across your site, Google Business Profile and booking sites.",
            "Your structured data type is not LocalBusiness but one that fits, such as ExerciseGym.",
            "Opening hours and staffed hours are written separately.",
            "Each membership plan shows the monthly price (with tax), up-front costs, usable hours, minimum term, and freezing and cancellation terms in a text table.",
            "The price page shows a revision date, and ended promotions and old prices are gone.",
            "The trial's price, length, what to bring and how to book are written down and added as a service.",
            "Class types, timetable and who they're for are text, not images.",
            "There are no unsupported effect claims or superlatives, and reviews of your own business are not marked up as ratings.",
            "llms.txt lists your overview, prices, trial, classes, access and FAQ pages. [What is llms.txt?](/guide/llms-txt)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, ask AI the questions a prospective member would ask (place plus price plus time plus conditions), without your venue's name, and see whether you come up by name or URL. Also ask by name (\"What is X Gym's monthly fee and how do I cancel?\") and check that the prices and terms in the answer are current. If they are wrong, look at which page the AI cited and fix that page or the outside listing. Answers change between runs, so ask the same questions a few times, spread over time, and record them. The method and a record sheet are in [how to measure AI visibility](/guide/measure-ai-visibility), and impressions in Google's AI features are covered in [the Search Console guide](/guide/search-console-ai-features).",
            "Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your venue's name) are put to Perplexity, and the plugin records whether the answers named your venue or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta: how often your venue appears in AI answers, compared with competitors over time (currently measured on Perplexity, with ChatGPT added once it is configured).",
          ],
        },
      ],
      faqs: [
        { q: "Where should a gym or studio start with AI search?", a: "Write your prices (with tax), opening and staffed hours, trial, freezing and cancellation terms, facilities and classes correctly as text on your pages. Then set your structured data type to one that fits, such as ExerciseGym, add your trial and classes as services, and make sure everything matches your Google Business Profile and booking site profiles." },
        { q: "Is there a structured data type for yoga or pilates studios?", a: "schema.org has no type specifically for yoga or pilates. Use a type such as ExerciseGym to say you are an exercise venue, and describe what you teach, such as yoga or reformer pilates, in services and page text." },
        { q: "Should I publish my prices?", a: "If you want to be included in comparison answers, yes. A venue with unknown prices gives AI nothing to work with. Include joining fees, admin fees and any minimum term, with tax, and add the revision date." },
        { q: "Can I show before-and-after photos?", a: "If you do, use real cases with the member's consent, and state the period, conditions and that results vary on the same page. Effect claims you cannot support can be a problem under advertising rules, so check before you publish." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type (ExerciseGym and others), address, hours, services and FAQ structured data, llms.txt, AI crawler rules and the AEO score are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee my gym appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your gym's or studio's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
