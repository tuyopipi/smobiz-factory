// Content page: AI search (AEO) for home builders (工務店) and renovation
// companies. Industry page.
//
// Written 2026-11-12 (JST). Every claim about Nurevo AEO is one the plugin's
// readme or code makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary):
// the "Professional services" wizard card (ja: 専門サービス) sets
// ProfessionalService and keeps HomeAndConstructionBusiness, GeneralContractor,
// Plumber and Electrician when one is already set (includes/setup-wizard.php,
// 'family'); the same four types are in the plugin's list of local business
// types (nurevo-webmcp.php, webmcp_canary_local_business_types); each service
// takes a name, page URL, description, category, duration, price, currency and
// booking URL; a price is published only when entered; services go into the
// structured data and llms.txt. The plugin has no service-area or project
// (施工事例) markup, so the copy tells readers to write those as page text.
// Free monthly check: three questions to Perplexity, never the business name
// (readme). Pro measurement runs on Perplexity (docs/pro-measurement-implementation.md).
//
// Outside facts. Official pages (schema.org, MLIT, CAA, Google) could not be
// fetched from this run (fetch permission was not granted in time), so the copy
// only uses facts already checked on the official pages for earlier guides,
// with those dates:
// - Google "AI features and your website" (checked 2026-11-01).
// - Google LocalBusiness structured data (checked 2026-10-29).
// - OpenAI crawlers (checked 2026-10-31).
// - Google Search Central blog 2019-09-16 (self-serving reviews).
// - Consumer Affairs Agency stealth marketing (checked 2026-11-01).
// Construction law (建設業法 / 建設業許可, 特定商取引法 for door-to-door
// renovation sales, 景品表示法) is only named: no threshold, number of days or
// article is stated. Add them with links when the official pages can be read.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  generalContractor: "https://schema.org/GeneralContractor",
  homeConstruction: "https://schema.org/HomeAndConstructionBusiness",
  openaiBots: "https://developers.openai.com/api/docs/bots",
  reviews2019: "https://developers.google.com/search/blog/2019/09/making-review-rich-results-more-helpful",
  caaStealth: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/stealth_marketing/",
  caaTokusho: "https://www.no-trouble.caa.go.jp/",
};

export default {
  slug: "home-builder-renovation-ai-search",
  targetQueries: [
    "AI search optimization for home builders and remodelers",
    "contractor ChatGPT recommendations",
    "GeneralContractor schema markup",
    "工務店 AI検索対策",
    "リフォーム会社 LLMO 対策",
    "工務店 ChatGPT 表示",
  ],
  related: ["local-business-schema-seo-plugins", "measure-ai-visibility", "llms-txt", "search-console-ai-features", "aeo-wordpress"],
  locales: {
    ja: {
      title: "工務店・リフォーム会社のAI検索対策：施工事例と施工エリアの書き方 | Nurevo",
      description: "工務店・リフォーム会社のAI検索対策は、施工エリア・工事の種類・許可や資格・施工事例の事実を、本文と構造化データで正確に出すことから。業種の型の選び方、施工事例の項目表、WordPressでの手順も解説。",
      h1: "工務店・リフォーム会社のAI検索対策：施工エリア・工事の種類・施工事例をAIに正しく読ませる手順",
      lead: "工務店・リフォーム会社のAI検索対策（AEO・LLMO）の中心は、どの市区町村で、どんな工事（新築・リフォームの部位・外壁や屋根・耐震や断熱など）を請け負い、どんな許可・資格を持つ会社なのかという事実を、ページ本文と構造化データ（schema.orgのGeneralContractorやHomeAndConstructionBusiness）で正確に、矛盾なく公開することです。そのうえで、施工事例を「場所・建物・工事内容・工期・費用」がそろった記録として書くことが、この業種でいちばん差がつくところです。",
      intro: [
        "作成日：2026年11月12日（JST）。Google・OpenAI・消費者庁の情報は、本文に記した日に各公式ページで確認したものです。建設業の許可や訪問販売のルールは名前だけを挙げ、金額や日数などは書いていません。最新の公式情報で確認してください。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが会社の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "家づくりやリフォームでAIに聞かれていること",
          paragraphs: [
            "ChatGPT、Perplexity、GoogleのAI Overviewsなどに工務店やリフォーム会社を探す質問をすると、AIはウェブ上の情報を読んで、いくつかの会社名を挙げて答えをまとめます。聞かれるのは「◯◯市で自然素材の注文住宅を建てられる工務店」「築40年の木造住宅の耐震改修を相談できる会社」「マンションの浴室を1日で交換できるリフォーム会社」「◯◯町で外壁塗装を頼める地元の業者」のように、地域・建物・工事の種類・条件が組み合わさった質問です。",
            "こうした質問にAIが答えるには、「この会社はこの地域で、この種類の工事を、こういう建物で実際にやっている」と読み取れる材料が必要です。会社案内に「新築からリフォームまで何でもお任せ」とだけ書いてあっても、AIには何が得意な会社なのかがわかりません。必要なのは宣伝の言葉ではなく、施工エリア・工事の種類・施工事例という確かめられる事実です。",
            `Googleは、AI OverviewsやAI Modeに出るための追加の要件や特別なschema.orgの構造化データはなく、構造化データをページの見える文章と一致させるなどの通常の基本が大切だとしています（2026年11月1日確認）。[Google：AI features and your website](${SRC.googleAi})。AI向けの特別な書き方を探すより、会社の事実を正しくそろえることが対策の本体です。`,
          ],
        },
        {
          heading: "まず決める：構造化データの業種（型）",
          paragraphs: [
            `構造化データでは、会社の種類をschema.orgの型で表します。建設・住まいの工事の会社に使える型には、[HomeAndConstructionBusiness](${SRC.homeConstruction})（住まいの工事全般）と、その中のより具体的な[GeneralContractor](${SRC.generalContractor})（工事をまとめて請け負う会社）、Plumber（配管・水まわり）、Electrician（電気工事）などがあります。Googleのローカルビジネスの構造化データのドキュメントは、できるだけ具体的な種類を使うよう案内しています（2026年10月29日確認）。[Google：ローカルビジネスの構造化データ](${SRC.googleLocal})。`,
          ],
          table: {
            head: ["会社のタイプ", "主な仕事", "選ぶ型の目安"],
            rows: [
              ["工務店（新築・注文住宅が中心）", "新築の設計・施工、大規模な改修を自社でまとめて請け負う", "GeneralContractor"],
              ["リフォーム会社（部位・設備が中心）", "キッチン・浴室・トイレ・内装・外壁・屋根などのリフォーム", "HomeAndConstructionBusiness（増改築や全面改修をまとめて請け負うならGeneralContractor）"],
              ["水まわり・設備の専門店", "給排水の修理、水まわりの設備交換", "Plumber"],
              ["電気工事の専門店", "配線・照明・分電盤などの電気工事", "Electrician"],
            ],
            caption: "型の選び方は目安です。会社が実際に請け負っている仕事のうち、いちばん中心になるものに合わせます。型はschema.orgのもので、どれを選んでもGoogleでの表示が約束されるわけではありません。",
          },
          after: [
            "型がOrganizationやLocalBusinessのままだと、構造化データからは建設・住まいの工事の会社であることが伝わりません。逆に、実際にはほとんど請け負っていない工事の型を選ぶのも避けます。新築とリフォームの両方を扱う会社は、中心になる型を1つ選び、もう一方はサービス（後述）とページ本文で伝えます。",
          ],
        },
        {
          heading: "会社サイトで公開しておきたい事実",
          paragraphs: [
            "Googleのローカルビジネスの構造化データでは、nameとaddressが必須、openingHoursSpecification・telephone・urlなどが推奨です（2026年10月29日確認）。工務店・リフォーム会社では、これに加えて、施工エリアと許可・資格の情報が、選ばれるかどうかに直結します。",
          ],
          table: {
            head: ["情報", "ページ本文での書き方", "構造化データ"],
            rows: [
              ["会社名", "正式名称と、看板・Googleビジネスプロフィール・住宅ポータルでの呼び名を同じ表記に", "name（必須）"],
              ["所在地・ショールーム", "事務所・ショールーム・モデルハウスごとに、番地・建物名まで。駐車場の有無も文字で", "address（必須）"],
              ["営業時間・定休日", "画像にせず文字で。ショールームの見学が予約制ならその旨も", "openingHoursSpecification（推奨）"],
              ["電話・問い合わせ", "電話番号を文字で。見積もり依頼・現地調査・見学予約のページへのリンク", "telephone（推奨）、予約URL"],
              ["施工エリア", "市区町村名で具体的に。「◯◯市・△△町は全域、□□市は一部（要相談）」のように範囲を言葉で", "本文と説明文（description）に書く"],
              ["工事の種類", "新築、増改築、キッチン・浴室・外壁・屋根・耐震・断熱など、実際に請け負うものだけ", "工事の種類ごとにService"],
              ["許可・資格・登録", "建設業許可の許可番号、建築士事務所の登録、在籍する建築士・施工管理技士などの資格、加入している団体や保険", "本文に書く（説明文に要点）"],
              ["保証・アフターサービス", "自社の保証の内容と期間、点検の頻度を、実際の契約どおりに", "本文に書く"],
            ],
            caption: "必須・推奨の区分は、2026年10月29日に確認したGoogleのローカルビジネスのドキュメントによります。Serviceはschema.orgの型で、Googleの必須・推奨項目ではありません。",
          },
          after: [
            "建設業の許可が必要な工事かどうか、許可番号の書き方などは、建設業法と国土交通省・都道府県の最新の案内で確認してください。この記事では金額の条件などは解説していません。許可番号や登録番号は、AIや施主が会社を確かめる手がかりになるので、会社概要に文字で書いておきます。",
            "大切なのは、サイト本文・構造化データ・Googleビジネスプロフィール・住宅ポータルや紹介サイトの会社情報・llms.txtで、同じ事実が同じ値になっていることです。移転や定休日の変更、許可の更新のときは、すべてを一緒に更新します。",
          ],
        },
        {
          heading: "施工事例を「AIが使える記録」にする",
          paragraphs: [
            "工務店・リフォーム会社のサイトでいちばん大事なページは施工事例です。ところが多くの施工事例は、写真とひとこと（「明るいキッチンになりました」）だけで、AIにも施主にも、どこで、どんな家に、何を、いくらで、どれくらいの期間でしたのかがわかりません。「築40年の木造住宅の耐震改修」と聞かれて答えるには、そういう事例が文字で書かれている必要があります。施工事例は、次の項目がそろった記録として書きます。",
          ],
          table: {
            head: ["項目", "書き方の例", "注意"],
            rows: [
              ["場所", "◯◯市△△町（市区町村まで）", "番地や施主が特定される情報は書かない"],
              ["建物", "木造2階建て・築38年／マンション・築25年・専有70㎡", "施工エリアと工事の種類の質問に答える材料になる"],
              ["工事内容", "耐震補強（壁の補強・金物の追加）と断熱改修（窓の交換）", "部位と方法を具体的に。「全面リフォーム」だけで終わらせない"],
              ["工期", "解体から引き渡しまで約6週間（住みながら工事）", "住みながらか、仮住まいが必要だったかも"],
              ["費用", "約◯◯万円（税込、設計費・解体費を含む、補助金の適用前）", "税込か、含まれる範囲、時期を添える。幅で書いてもよい"],
              ["課題と提案", "冬の寒さと地震への不安 → 診断の結果をもとに優先順位を決めた", "施主の言葉は同意を得てから。作り話にしない"],
              ["写真", "工事前・工事後。代替テキストに部屋と工事内容を書く", "写真だけで情報を伝えない"],
              ["公開日・完成時期", "2026年9月完成、2026年10月掲載", "古い事例の費用が今も通用するように読まれないため"],
            ],
            caption: "項目は、施主とAIが比べるときに必要になる事実から選んだものです。すべてを埋められない事例は、書ける項目だけを正確に書きます。",
          },
          after: [
            "件数よりも、地域と工事の種類の組み合わせが読み取れることが大切です。施工エリアの市区町村ごと、工事の種類ごとに事例を絞り込める一覧があると、施主にも読みやすくなります。地名だけを差し替えた同じ文章の地域ページを量産するのは逆効果です。地域のページには、その地域で実際に手がけた事例と、気候や建物の傾向など地元の会社だから書けることを載せます。",
          ],
        },
        {
          heading: "費用と補助金の書き方：古い数字をAIに拾わせない",
          paragraphs: [
            "「浴室リフォームはいくらくらい？」はAIによく聞かれる質問です。費用の目安を書くのは役に立ちますが、根拠のない「◯万円〜」だけだと、施主の期待と実際の見積もりがずれ、トラブルのもとになります。広告の価格表示には景品表示法などのルールもあります。",
          ],
          list: [
            "費用の目安は、自社の実際の施工事例をもとに、税込か、含まれる工事の範囲（解体・処分・設計費など）、いつ時点の金額かを書く。",
            "「最安」「地域No.1」など、根拠を示せない表現は本文にも構造化データにも入れない。",
            "補助金・助成金は年度ごとに内容や受付期間が変わる。制度名と年度、国や自治体の公式ページへのリンク、確認した日を書き、受付が終わったら書き直す。",
            "価格のページにも、最終更新日を書く。古い価格のページが残っていると、AIがそれを今の価格として答えに使うおそれがある。",
          ],
          after: [
            `訪問販売で契約するリフォームには、特定商取引法の決まり（書面の交付やクーリング・オフなど）があります。訪問による営業をしている会社は、[消費者庁の特定商取引法ガイド](${SRC.caaTokusho})で最新のルールを確認し、サイトにも契約の流れを正しく書いておきます。この記事では日数などの細かい条件は解説していません。`,
          ],
        },
        {
          heading: "口コミ・評価の扱い：AI向けに足してはいけないもの",
          paragraphs: [
            `会社のページに星の評価（AggregateRating）の構造化データを付けるよう勧める解説がありますが、自社サイトに載せた自社の口コミを評価の構造化データにしても、Googleでは評価の星（レビュー スニペット）として表示されません。Googleは2019年に、ある事業者についての口コミをその事業者自身のサイトに載せるもの（自己言及的なレビュー）は、LocalBusinessとOrganizationでは認めないとしています。[Google検索セントラル ブログ（2019年9月16日）](${SRC.reviews2019})`,
            `日本では、2023年10月1日からステルスマーケティングが景品表示法違反になりました。消費者庁は、事業者が第三者に依頼・指示して投稿させた口コミも、その事業者の広告に含まれるとしています（2026年11月1日確認）。[消費者庁：ステルスマーケティング](${SRC.caaStealth})。「お客様の声」は、本物の声を、広告であることを隠さずに載せます。施主の感想は、施工事例の中に、同意を得て添えるのが自然です。`,
          ],
        },
        {
          heading: "WordPressの工務店・リフォーム会社サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEO・SEO SIMPLE PACK・VK All in One Expansion Unitはそのまま使えます。`,
            "初回の設定ウィザードで「専門サービス」を選びます。業種はProfessionalServiceになるので、設定画面の「業種（schema.org型）」を、上の表で選んだGeneralContractor・HomeAndConstructionBusiness・Plumber・Electricianのいずれかにします。いったん設定すれば、あとでウィザードをやり直しても保たれます。会社名・住所・電話番号・営業時間・説明を確認します。空欄の項目だけが、SEOプラグインなどの既存の設定やサイトの情報から補われます。",
            "説明（description）には、施工エリアと中心の工事を1〜2文で書きます。例：「◯◯市・△△町で木造住宅の新築と耐震・断熱リフォームを手がける工務店。建設業許可（許可番号）。」Nurevo AEOは施工エリアを専用の項目では出力しないので、エリアはこの説明とページ本文で伝えます。",
            "設定画面で、新築・耐震改修・水まわりリフォーム・外壁塗装などの工事の種類を、サービスとして1つずつ登録します。サービス名・説明・ページのURL・カテゴリを入れ、見積もり依頼や現地調査・見学予約のフォームがあれば予約URLに入れます。料金は、決まった金額があるものだけ入れます（空欄なら料金は出力されません）。会社に紐づいたServiceとして構造化データに出力され、llms.txtにもサービスの1行として載ります。",
            "よくある質問（見積もりは無料か、現地調査にかかる時間、住みながら工事できるか、保証の内容、対応エリア外の相談など）を入力し、FAQを見せたいページにNurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。",
            "施工事例は、Nurevo AEOでは構造化データにしません。上の項目表に沿って、投稿や施工事例のページに文字で書きます。",
            "AEOスコアの画面で診断を実行し、チェックリストに出た不足をワンクリック修正で直します。構造化データ・llms.txt・AIクローラの許可は無料プランで出力されます。",
            "外からどう見えるかを[無料のAI可読性チェック](/check)で確認し、Googleビジネスプロフィールや住宅ポータルの会社情報と一致しているかも見直します。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の会社情報の構造化データを出さず、足りない住所・電話番号・営業時間・GeneralContractorなどの種類・サービスだけを追加します。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/guide/local-business-schema-seo-plugins)を参照してください。",
            `AIクローラについては、OpenAIは、OAI-SearchBotを拒否したサイトはChatGPTの検索回答に表示されないとしています（2026年10月31日確認）。[OpenAI：クローラの概要](${SRC.openaiBots})。robots.txtやセキュリティ系のプラグインで、気づかずに止めていないかを確認します。`,
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "会社名・住所・電話・営業時間・定休日が、サイト・Googleビジネスプロフィール・住宅ポータルで一致している。",
            "構造化データの業種がOrganizationのままではなく、GeneralContractorなど実際の仕事に合った型になっている。",
            "施工エリアが、市区町村名などの具体的な言葉で本文に書かれている。",
            "工事の種類が、実際に請け負うものだけ書かれ、サービスとして登録されている。",
            "建設業許可の許可番号、登録、資格者などが会社概要に文字で書かれている。",
            "施工事例に、場所（市区町村）・建物・工事内容・工期・費用（税込・範囲・時期）・掲載日がある。",
            "費用・補助金のページに更新日と出典があり、終わった制度が残っていない。",
            "自社サイトの口コミを評価の構造化データにしていない。根拠のない最上級の表現がない。",
            "llms.txtに、会社の概要・施工エリア・サービス・施工事例・問い合わせのページが載っている。[llms.txtとは](/guide/llms-txt)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、施主が聞きそうな質問（地域＋建物＋工事の種類＋条件）を、会社名を入れずにAIに投げて、自社が名前やURLで出てくるかを見ます。あわせて「◯◯工務店の定休日と施工エリアは？」のように会社名で聞き、答えの事実が正しいかも確かめます。AIの回答は回ごとに変わるので、同じ質問を何度か、期間をあけて記録するのが現実的です。手順と記録表は[AIでの登場率の測り方](/guide/measure-ai-visibility)に、GoogleのAI機能での表示回数は[Search Consoleの見方](/guide/search-console-ai-features)にまとめています。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（会社名は含めません）をPerplexityに投げ、回答に会社の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に会社が出る割合を競合と比べて推移で見られます（現在の計測先はPerplexity、ChatGPTは設定され次第）。",
          ],
        },
      ],
      faqs: [
        { q: "工務店・リフォーム会社のAI検索対策は、何から始めればいいですか？", a: "施工エリア・工事の種類・許可や資格と、所在地・営業時間・定休日などの会社情報を、ページ本文に文字で正しく書くことからです。そのうえで、構造化データの業種をGeneralContractorなど実際の仕事に合った型にし、工事の種類をサービスとして登録し、Googleビジネスプロフィールや住宅ポータルの情報とそろえます。" },
        { q: "施工事例はたくさん載せたほうがいいですか？", a: "数より中身です。写真だけの事例をたくさん並べるより、場所（市区町村）・建物・工事内容・工期・費用がそろった事例のほうが、AIにも施主にも使える材料になります。施工エリアと工事の種類ごとに、代表的な事例があることを目指します。" },
        { q: "費用は「◯万円〜」と書いてもいいですか？", a: "書くなら、実際の事例をもとに、税込か、含まれる工事の範囲、いつ時点の金額かを添えます。根拠のない最低価格だけを書くと、見積もりとの差でトラブルになりやすく、広告のルールにも注意が必要です。" },
        { q: "住宅ポータルや紹介サイトに載っていれば、自社サイトは整えなくてもいいですか？", a: "AIはポータルや紹介サイトを出典にすることもありますが、得意な工事や施工エリア、施工事例を詳しく書けるのは自社サイトです。両方の会社情報をそろえ、自社サイトにしかない事実を充実させるのが安全です。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種（GeneralContractor・HomeAndConstructionBusinessなど）・住所・営業時間・サービス・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）です。[WordPress.orgのNurevo AEO](${WP_ORG})` },
        { q: "対策すればChatGPTに会社が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが会社の事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが自社サイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },

    en: {
      title: "AI Search for Home Builders and Remodelers: Projects, Areas | Nurevo",
      description: "AEO for builders and remodelers starts with publishing your service area, types of work, licenses and projects correctly, in page text and contractor structured data.",
      h1: "AI search for home builders and remodelers: how to get AI to read your service area, types of work and projects correctly",
      lead: "AI search optimization (AEO) for a home builder or remodeling company comes down to publishing, accurately and consistently, which towns you work in, which kinds of work you take on (new homes, kitchens and bathrooms, siding and roofing, seismic retrofits, insulation) and which licenses and qualifications you hold, both in your page text and in schema.org structured data such as GeneralContractor or HomeAndConstructionBusiness. Beyond that, the biggest difference in this trade comes from writing each project as a record with its location, building, scope, schedule and cost.",
      intro: [
        "Written November 12, 2026 (JST). Information from Google, OpenAI and Japan's Consumer Affairs Agency was checked on each official page on the dates given in the text. Contractor licensing and door-to-door sales rules are only named here, without thresholds or deadlines; check them against current official sources.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your company's facts readable to AI. They do not guarantee that an AI will mention your company or rank it anywhere.",
      ],
      sections: [
        {
          heading: "What people ask AI about building and remodeling",
          paragraphs: [
            "When someone asks ChatGPT, Perplexity or Google's AI Overviews to find a builder or remodeler, the AI reads what it can find on the web and answers with a few company names. The questions combine area, building, type of work and conditions: \"a builder in my city who does custom homes with natural materials\", \"a company that can seismically retrofit a 40-year-old wooden house\", \"a remodeler who can replace a condo bathroom in one day\", \"a local company for exterior painting in my town\".",
            "To answer questions like these, an AI needs material that says \"this company does this kind of work, on this kind of building, in this area\". A company page that only says \"from new builds to remodels, we do it all\" tells the AI nothing about what you are good at. What it needs is not marketing language but facts it can check: service area, types of work and projects.",
            `Google says there are no additional requirements and no special schema.org structured data needed to appear in AI Overviews or AI Mode, and that the usual basics still matter, such as making structured data match the visible text (checked November 1, 2026). [Google: AI features and your website](${SRC.googleAi}). The work is getting your company's facts right, not finding an AI trick.`,
          ],
        },
        {
          heading: "Decide first: your business type in structured data",
          paragraphs: [
            `In structured data, the kind of business is expressed as a schema.org type. Types that fit construction and home improvement companies include [HomeAndConstructionBusiness](${SRC.homeConstruction}) (home improvement and construction in general) and, within it, more specific types such as [GeneralContractor](${SRC.generalContractor}) (a company that takes on whole projects), Plumber and Electrician. Google's local business documentation asks you to use the most specific type possible (checked October 29, 2026). [Google: local business structured data](${SRC.googleLocal}).`,
          ],
          table: {
            head: ["Type of company", "Main work", "Type to choose (guide)"],
            rows: [
              ["Home builder (mostly new and custom homes)", "Designs and builds new homes and takes on large renovations as the main contractor", "GeneralContractor"],
              ["Remodeling company (mostly rooms and fixtures)", "Kitchens, bathrooms, toilets, interiors, siding, roofing", "HomeAndConstructionBusiness (GeneralContractor if you run whole-house renovations and additions)"],
              ["Plumbing and fixtures specialist", "Plumbing repairs, replacing bathroom and kitchen fixtures", "Plumber"],
              ["Electrical contractor", "Wiring, lighting, panels", "Electrician"],
            ],
            caption: "This is a guide. Match the type to the work at the center of what you actually do. These are schema.org types; none of them guarantees any display in Google.",
          },
          after: [
            "If your type is still Organization or LocalBusiness, your structured data does not say you are a construction or home improvement company. Equally, avoid a type for work you hardly ever do. A company that does both new builds and remodels picks one main type and covers the other through services (below) and page text.",
          ],
        },
        {
          heading: "The facts a builder or remodeler site should publish",
          paragraphs: [
            "Google's local business documentation lists name and address as required and recommends openingHoursSpecification, telephone, url and others (checked October 29, 2026). For builders and remodelers, your service area and your licenses and qualifications also have a direct bearing on whether you are chosen.",
          ],
          table: {
            head: ["Fact", "On the page", "In structured data"],
            rows: [
              ["Company name", "Your official name, spelled the same as on your sign, Google Business Profile and listing sites", "name (required)"],
              ["Office and showroom", "The full address of each office, showroom or model home, and whether there is parking, as text", "address (required)"],
              ["Opening hours and days closed", "As text, not an image. Say so if showroom visits are by appointment", "openingHoursSpecification (recommended)"],
              ["Phone and contact", "The phone number as text and links to your estimate request, site visit and showroom booking pages", "telephone (recommended), booking URL"],
              ["Service area", "Concrete town names, with the extent in words (\"all of X and Y, parts of Z on request\")", "Page text and the description"],
              ["Types of work", "Only what you actually take on: new homes, additions, kitchens, bathrooms, siding, roofing, seismic, insulation", "A Service for each"],
              ["Licenses, qualifications, registrations", "Your contractor license number, design office registration, qualified staff (architects, site managers), associations and insurance", "Page text (key points in the description)"],
              ["Warranty and aftercare", "What your warranty covers and for how long, and how often you inspect, exactly as in your contracts", "Page text"],
            ],
            caption: "Required and recommended properties as listed in Google's local business documentation on October 29, 2026. Service is a schema.org type, not a Google required or recommended property.",
          },
          after: [
            "Which work needs a contractor license, and how a license number should be shown, depend on your country's or region's rules. In Japan, for example, the Construction Business Act applies; check the current guidance from the regulator. This article does not explain thresholds. License and registration numbers help both AI and homeowners verify you, so write them as text on your company page.",
            "What matters most is that the same fact has the same value everywhere: your site, structured data, Google Business Profile, your profiles on listing and referral sites, and llms.txt. When you move, change your days closed or renew a license, update all of them together.",
          ],
        },
        {
          heading: "Turning project pages into records AI can use",
          paragraphs: [
            "The most important pages on a builder's or remodeler's site are the project pages. Yet many of them are photos and a single line (\"a bright new kitchen\"), so neither AI nor homeowners can tell where it was, what kind of house, what was done, what it cost or how long it took. To answer \"seismic retrofit of a 40-year-old wooden house\", a project like that has to exist in text. Write each project as a record with these items.",
          ],
          table: {
            head: ["Item", "Example", "Note"],
            rows: [
              ["Location", "Town and district (down to the municipality)", "No street address or anything that identifies the client"],
              ["Building", "Two-story wooden house, 38 years old / condo, 25 years old, 70 m²", "This answers questions that combine area and type of work"],
              ["Scope of work", "Seismic reinforcement (wall bracing, added hardware) and insulation (new windows)", "Name the parts and methods. Don't stop at \"full renovation\""],
              ["Schedule", "About six weeks from demolition to handover, with the family living at home", "Say whether they stayed in or had to move out"],
              ["Cost", "About X (tax included, design and demolition included, before subsidies)", "Say whether tax is included, what is covered and when. A range is fine"],
              ["Problem and solution", "Cold winters and earthquake worries → priorities set from an inspection", "Quote the client only with consent. Never invent it"],
              ["Photos", "Before and after, with alt text naming the room and the work", "Don't let photos carry information that isn't in the text"],
              ["Completion and publication date", "Completed September 2026, published October 2026", "So an old project's cost is not read as today's price"],
            ],
            caption: "The items are the facts homeowners and AI need when comparing companies. If a project can't fill every item, write the ones you can, accurately.",
          },
          after: [
            "Being able to read combinations of area and type of work matters more than the number of projects. A project list that can be filtered by town and by type of work also helps homeowners. Mass-producing area pages that only swap the place name works against you. On an area page, show the projects you actually did there and what only a local company would know, such as the climate and the kind of housing.",
          ],
        },
        {
          heading: "Writing about costs and subsidies so AI doesn't repeat old numbers",
          paragraphs: [
            "\"How much does a bathroom remodel cost?\" is a question AI hears often. Giving a cost guide helps, but an unsupported \"from X\" sets expectations that your estimate won't meet and leads to disputes. Price claims in advertising are also regulated (in Japan, by the Act against Unjustifiable Premiums and Misleading Representations, among others).",
          ],
          list: [
            "Base cost guides on your own completed projects, and say whether tax is included, what work is covered (demolition, disposal, design) and as of when.",
            "Leave claims you cannot back up, such as \"cheapest\" or \"No. 1 in the area\", out of both your text and your markup.",
            "Subsidies and grants change from year to year. Give the program name and year, a link to the official government page and the date you checked, and rewrite the page when the program closes.",
            "Put a last-updated date on price pages too. If an old price page stays up, AI may present it as today's price.",
          ],
          after: [
            `Remodeling contracts made through door-to-door sales are regulated in many countries. In Japan, the Act on Specified Commercial Transactions sets rules such as written contracts and cooling-off. If you sell door to door, check the current rules (in Japan, the [Consumer Affairs Agency's guide, in Japanese](${SRC.caaTokusho})) and describe your contract process accurately on your site. This article does not explain deadlines or other conditions.`,
          ],
        },
        {
          heading: "Reviews and ratings: what not to add for AI",
          paragraphs: [
            `Some guides recommend adding star ratings (AggregateRating) to your company pages in structured data. Marking up reviews of your own business on your own site will not get you review stars in Google. In 2019 Google said that self-serving reviews, meaning reviews about a business placed on that business's own website, aren't allowed for LocalBusiness and Organization. [Google Search Central blog, September 16, 2019](${SRC.reviews2019})`,
            `Rules on undisclosed advertising differ by country, so check the ones that apply to you. In Japan, stealth marketing has been a violation of the Act against Unjustifiable Premiums and Misleading Representations since October 1, 2023, and the Consumer Affairs Agency treats reviews that a business asks or instructs third parties to post as that business's advertising (checked November 1, 2026). [Consumer Affairs Agency: stealth marketing (Japanese)](${SRC.caaStealth}). Publish real client comments, without hiding that they are promotional. The natural place for them is inside the project record, with the client's consent.`,
          ],
        },
        {
          heading: "Setting it up on a WordPress builder or remodeler site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit keep working as they are.`,
            "In the setup wizard, choose \"Professional services\". That sets the business type to ProfessionalService, so change \"Business type (schema.org type)\" in Settings to the type you picked from the table above: GeneralContractor, HomeAndConstructionBusiness, Plumber or Electrician. Once set, running the wizard again keeps it. Check the business name, address, phone, opening hours and description. Only empty fields are filled in from your SEO plugin or site settings.",
            "In the description, say in one or two sentences which area and which main work you cover, for example \"A builder of wooden homes and seismic and insulation renovations in X and Y. Contractor license (number).\" Nurevo AEO does not publish the service area as a separate property, so the description and your page text carry it.",
            "In Settings, add each type of work, such as new homes, seismic retrofits, bathroom and kitchen remodels or exterior painting, as a service, one at a time. Enter the name, description, page URL and category, and put your estimate request, site visit or showroom booking form in the booking URL. Enter a price only where there is a fixed one (with the price empty, no price is published). Each is published as a Service tied to your business and appears as a line in llms.txt.",
            "Enter your frequently asked questions (whether estimates are free, how long a site visit takes, whether you can stay at home during the work, what the warranty covers, enquiries from outside your area) and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on the page where the FAQ should show.",
            "Nurevo AEO does not turn projects into structured data. Write them as text in your posts or project pages, following the table above.",
            "Run the check on the AEO score screen and fix what the checklist reports with one-click fixes. Structured data, llms.txt and AI crawler rules are on the free plan.",
            "See how the site looks from outside with the [free AI readability check](/check), and confirm that your Google Business Profile and listing site profiles match.",
          ],
          after: [
            "Alongside an SEO plugin, Nurevo AEO does not print a second business node. It adds only what is missing, such as the address, phone, opening hours, a type like GeneralContractor, and services. See [adding local business details to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins) for details.",
            `On AI crawlers, OpenAI says sites that opt out of OAI-SearchBot will not be shown in ChatGPT search answers (checked October 31, 2026). [OpenAI: overview of crawlers](${SRC.openaiBots}). Check that robots.txt or a security plugin is not blocking it without your knowledge.`,
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Name, address, phone, opening hours and days closed match across your site, Google Business Profile and listing sites.",
            "Your structured data type is not Organization but one that fits your work, such as GeneralContractor.",
            "Your service area is written in concrete town names in your page text.",
            "Your types of work list only what you actually take on, and each is added as a service.",
            "Your license number, registrations and qualified staff are written as text on your company page.",
            "Each project shows location (town), building, scope, schedule, cost (tax, scope, date) and publication date.",
            "Cost and subsidy pages show an update date and sources, and closed programs are removed.",
            "Reviews of your own business are not marked up as ratings, and there are no unsupported superlatives.",
            "llms.txt lists your company overview, service area, services, projects and contact page. [What is llms.txt?](/guide/llms-txt)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, ask AI the questions homeowners would ask (area plus building plus type of work plus conditions), without your company's name, and see whether you come up by name or URL. Also ask by name (\"What are X Builders' days closed and service area?\") and check that the facts in the answer are correct. Answers change between runs, so ask the same questions a few times, spread over time, and record them. The method and a record sheet are in [how to measure AI visibility](/guide/measure-ai-visibility), and impressions in Google's AI features are covered in [the Search Console guide](/guide/search-console-ai-features).",
            "Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your company's name) are put to Perplexity, and the plugin records whether the answers named your company or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta: how often your company appears in AI answers, compared with competitors over time (currently measured on Perplexity, with ChatGPT added once it is configured).",
          ],
        },
      ],
      faqs: [
        { q: "Where should a builder or remodeler start with AI search?", a: "Write your service area, types of work, licenses and qualifications, and company facts (address, opening hours, days closed) correctly as text on your pages. Then set your structured data type to one that fits your work, such as GeneralContractor, add each type of work as a service, and make sure everything matches your Google Business Profile and listing site profiles." },
        { q: "Should I post lots of projects?", a: "Substance matters more than number. Projects with location, building, scope, schedule and cost are more useful to AI and homeowners than many photo-only entries. Aim for at least one representative project for each combination of area and type of work you want to be known for." },
        { q: "Can I write prices as \"from X\"?", a: "If you do, base them on real projects and say whether tax is included, what work is covered and as of when. A bare minimum price with no basis tends to cause disputes when the estimate comes in, and advertising rules apply." },
        { q: "If I'm listed on referral and listing sites, do I still need to fix my own site?", a: "AI sometimes cites listing and referral sites, but your own site is where you can describe your specialties, service area and projects in detail. Keep your company details the same in both places and put the facts that only you can provide on your own site." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type (GeneralContractor, HomeAndConstructionBusiness and others), address, hours, services and FAQ structured data, llms.txt, AI crawler rules and the AEO score are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee my company appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your company's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
