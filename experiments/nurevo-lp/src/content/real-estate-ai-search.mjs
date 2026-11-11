// Content page: AI search (AEO) for real estate agencies. Industry page.
//
// Written 2026-11-11 (JST). Every claim about Nurevo AEO is one the plugin's
// readme or code makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary):
// the "Professional services" wizard card (ja: 専門サービス) sets
// ProfessionalService and keeps RealEstateAgent when it is already set
// (includes/setup-wizard.php); RealEstateAgent is in the plugin's list of
// local business types (nurevo-webmcp.php, webmcp_canary_local_business_types);
// each service takes a name, page URL, description, category, duration, price,
// currency and booking URL; price is optional; output is a Service with an
// Offer (only when a price is entered), a ReserveAction (only with a booking
// URL) and an llms.txt line (webmcp_canary_service_schema_nodes / _llms_line).
// The plugin does not publish areaServed, so the copy tells readers to write
// the service area in page text and in the description.
// Pro measurement runs on Perplexity (docs/pro-measurement-implementation.md).
//
// Outside facts. Primary pages could not be fetched from this run (the fetch
// was refused before sending), so the copy only uses facts already checked on
// the official pages for earlier guides, with the dates they were checked:
// - Google "AI features and your website" (checked 2026-11-01): no additional
//   requirements or special schema.org markup for AI Overviews / AI Mode;
//   structured data should match the visible text.
// - Google LocalBusiness structured data (checked 2026-10-29): name + address
//   required; openingHoursSpecification, telephone, url recommended; use the
//   most specific LocalBusiness sub-type.
// - OpenAI crawlers (checked 2026-10-31): sites that opt out of OAI-SearchBot
//   are not shown in ChatGPT search answers.
// - Google Search Central blog 2019-09-16: self-serving reviews aren't allowed
//   for LocalBusiness and Organization.
// - Consumer Affairs Agency (Japan): stealth marketing is a violation of the
//   Act against Unjustifiable Premiums and Misleading Representations from
//   2023-10-01 (checked 2026-11-01).
// Real estate advertising law (宅建業法, 不動産の表示に関する公正競争規約) is
// only named, not explained: no article, number or rule from it is stated,
// because the official texts could not be read in this run. Add the specific
// rules with links when you update this page and can read rftc.jp / e-Gov.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  realEstateAgent: "https://schema.org/RealEstateAgent",
  openaiBots: "https://developers.openai.com/api/docs/bots",
  reviews2019: "https://developers.google.com/search/blog/2019/09/making-review-rich-results-more-helpful",
  caaStealth: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/stealth_marketing/",
};

export default {
  slug: "real-estate-ai-search",
  targetQueries: [
    "AI search optimization for real estate agencies",
    "real estate agent ChatGPT visibility",
    "RealEstateAgent schema markup",
    "不動産会社 AI検索対策",
    "不動産 LLMO 対策",
    "不動産会社 ChatGPT 表示",
  ],
  related: ["local-business-schema-seo-plugins", "measure-ai-visibility", "llms-txt", "search-console-ai-features", "aeo-wordpress"],
  locales: {
    ja: {
      title: "不動産会社のAI検索対策：対応エリアと得意分野をAIに伝える | Nurevo",
      description: "不動産会社のAI検索対策は、対応エリア・取扱い種別・営業時間・会社の事実を本文とRealEstateAgentの構造化データで正確に出すことから。物件情報の鮮度、口コミの扱い、WordPressでの手順も解説。",
      h1: "不動産会社のAI検索対策：対応エリア・得意分野・会社情報をAIに正しく読ませる手順",
      lead: "不動産会社のAI検索対策（AEO・LLMO）の中心は、どのエリアで、どんな取引（売買・賃貸・管理・査定）を、どんな相談に強く扱っているかという事実と、所在地・営業時間・定休日・免許番号などの会社情報を、ページ本文と構造化データ（schema.orgのRealEstateAgent）で正確に、矛盾なく公開することです。そのうえで、物件情報を最新に保ち、AIに古い情報を拾わせないことが、不動産ならではのポイントになります。",
      intro: [
        "作成日：2026年11月11日（JST）。Google・OpenAI・消費者庁の情報は、本文に記した日に各公式ページで確認したものです。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが会社の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "不動産のことをAIに聞く人は、何を聞いているか",
          paragraphs: [
            "ChatGPT、Perplexity、GoogleのAI Overviewsなどに不動産会社を探す質問をすると、AIはウェブ上の情報を読んで答えをまとめます。聞かれるのは「◯◯駅の近くでペット可の賃貸に強い不動産屋」「相続した実家の売却を相談できる◯◯市の会社」「水曜日も開いている不動産会社」「外国籍でも部屋探しを手伝ってくれるところ」のように、エリア・取引の種類・相談の内容・曜日がからむ質問です。",
            "物件そのものを探す質問（「◯◯駅徒歩10分以内で2LDK、家賃◯万円まで」）は、ポータルサイトの検索のほうが向いていて、AIも大手ポータルや各社の物件ページを出典にすることがあります。地域の不動産会社がAIで選ばれやすいのは、むしろ「どこに相談すればいいか」を聞かれたときです。だから最初に整えるべきなのは、物件の数ではなく「この会社は、このエリアで、この相談を扱っている」とAIが読み取れる会社の情報です。",
            `Googleは、AI OverviewsやAI Modeに出るための追加の要件や特別なschema.orgの構造化データはなく、構造化データをページの見える文章と一致させるなどの通常の基本が大切だとしています（2026年11月1日確認）。[Google：AI features and your website](${SRC.googleAi})。AI向けの裏技を探すより、会社の事実を正しくそろえることが対策の本体です。`,
          ],
        },
        {
          heading: "会社サイトで公開しておきたい情報",
          paragraphs: [
            `構造化データでは、不動産会社を[schema.orgのRealEstateAgent](${SRC.realEstateAgent})として表せます。Googleのローカルビジネスの構造化データでは、nameとaddressが必須、openingHoursSpecification・telephone・urlなどが推奨で、できるだけ具体的な種類を使うよう案内されています（2026年10月29日確認）。[Google：ローカルビジネスの構造化データ](${SRC.googleLocal})。種類がOrganizationやLocalBusinessのままだと、不動産会社であることが構造化データからは伝わりません。`,
          ],
          table: {
            head: ["情報", "ページ本文での書き方", "構造化データ"],
            rows: [
              ["会社名・店舗名", "正式名称と、看板やGoogleビジネスプロフィールでの呼び名を同じ表記に。支店ごとの名前も統一", "name（必須）"],
              ["所在地・アクセス", "番地・建物名・階まで。最寄り駅からの道順、駐車場の有無を文字で", "address（必須）"],
              ["営業時間・定休日", "画像にせず文字で。予約制の時間帯や、繁忙期の営業日の変更も", "openingHoursSpecification（推奨）"],
              ["電話・問い合わせ", "電話番号を文字で。問い合わせ・来店予約・査定依頼のページへのリンク", "telephone（推奨）、予約URL"],
              ["対応エリア", "市区町村・駅・沿線などで具体的に。「◯◯市全域、△△区の一部」のように範囲を言葉で", "本文と説明文（description）に書く"],
              ["取扱い種別・得意分野", "売買仲介・賃貸仲介・管理・買取・査定などを、扱うものだけ。得意な相談（相続、住み替え、事業用など）は実例とともに", "サービスごとにService"],
              ["会社の信頼情報", "宅地建物取引業の免許番号、所属団体、代表者、設立年、在籍する宅地建物取引士の人数など、確かめられる事実", "本文に書く（説明文に要点）"],
            ],
            caption: "必須・推奨の区分は、2026年10月29日に確認したGoogleのローカルビジネスのドキュメントによります。サービスのServiceはschema.orgの型で、Googleの必須・推奨項目ではありません。",
          },
          after: [
            "支店が複数ある会社は、支店ごとにページを分け、それぞれの住所・電話・営業時間・対応エリアを書きます。本社のページだけに全支店の情報を並べると、どの支店がどのエリアを担当しているかが読み取りにくくなります。",
            "大切なのは、サイト本文・構造化データ・Googleビジネスプロフィール・ポータルサイトの会社情報・llms.txtで、同じ事実が同じ値になっていることです。定休日の変更や移転のときは、すべてを一緒に更新します。",
          ],
        },
        {
          heading: "エリアと得意分野のページをどう作るか",
          paragraphs: [
            "AIが「◯◯市で相続した家の売却を相談できる会社」と聞かれて答えるには、その会社が◯◯市を扱い、相続がらみの売却を扱っていることが、どこかのページにはっきり書かれている必要があります。そのため、エリア名と相談の種類を組み合わせたページが役に立ちます。ただし、地名だけを差し替えた同じ文章のページを大量に作るのは逆効果です。読み手にとって中身がなく、どのページも同じに見えるからです。",
          ],
          list: [
            "エリアのページには、そのエリアで実際に扱った取引の種類、よく受ける相談、担当する店舗、地元の人にしか書けない情報（駅からの坂、生活圏、建物の傾向など）を書く。",
            "得意分野のページ（相続、住み替え、空き家、事業用、外国籍の方の賃貸など）には、相談の流れ、必要な書類、かかる期間の目安、よくある質問を、実際の対応に沿って書く。",
            "相場や統計を書くときは、どの公的データや調査から取った数字か、いつ時点かを明記する。出典のない「相場」や「◯％の方が」は書かない。",
            "実績（成約事例など）は、お客様の同意を得て、特定されない形で。件数を書くなら、期間と数え方を添える。",
          ],
        },
        {
          heading: "物件情報の鮮度：AIに古い情報を拾わせない",
          paragraphs: [
            "不動産ならではの注意点は、物件情報がすぐに古くなることです。成約済みの物件のページが残っていると、AIや検索がそれを読み、「まだ募集中」として答えに使ってしまうおそれがあります。お客さんがAIの答えを見て問い合わせたら、もう取引できなかったという状態は、会社の信頼を損ねます。",
          ],
          list: [
            "成約・募集終了の物件は、すぐに取り下げるか、ページ上で「成約済み」とはっきり書き、問い合わせの導線を外す。",
            "物件ページには、情報の更新日と次回の更新予定日を書く。",
            "価格・賃料・徒歩分数・築年などの数字は、ページ本文、構造化データ、ポータルサイトで同じ値にする。",
            "物件一覧のページがログインや絞り込み操作の後にしか出ない作りだと、AIのクローラは中身を読めません。少なくとも会社としての情報（対応エリア・取扱い種別）は、誰でも読める普通のページに書く。",
          ],
          after: [
            "不動産の広告には、宅地建物取引業法や業界の表示規約（不動産の表示に関する公正競争規約）による決まりがあります。物件の表示の仕方や使ってよい言葉などは、所属団体や不動産公正取引協議会の最新の規約で確認してください。この記事では個別の条文や数値の解説はしていません。AI向けの文章でも、広告のルールは同じように守る必要があります。",
          ],
        },
        {
          heading: "口コミ・評価の扱い：AI向けに足してはいけないもの",
          paragraphs: [
            `海外の解説記事には、会社や担当者のページに星の評価（AggregateRating）の構造化データを付けるよう勧めるものがありますが、自社サイトに載せた自社の口コミを評価の構造化データにしても、Googleでは評価の星（レビュー スニペット）として表示されません。Googleは2019年に、ある事業者についての口コミをその事業者自身のサイトに載せるもの（自己言及的なレビュー）は、LocalBusinessとOrganizationでは認めないとしています。[Google検索セントラル ブログ（2019年9月16日）](${SRC.reviews2019})`,
            `日本では、2023年10月1日からステルスマーケティングが景品表示法違反になりました。消費者庁は、事業者が第三者に依頼・指示して投稿させた口コミも、その事業者の広告に含まれるとしています（2026年11月1日確認）。[消費者庁：ステルスマーケティング](${SRC.caaStealth})。お客様の声を載せるなら、本物の声を、広告であることを隠さずに載せます。`,
            "AIに伝えるべきなのは評判の言葉ではなく、エリア・取扱い種別・営業時間・免許番号といった確かめられる事実です。「地域No.1」「必ず高く売れる」のような根拠を示せない表現は、本文にも構造化データにも入れないのが安全です。",
          ],
        },
        {
          heading: "WordPressの不動産会社サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEO・SEO SIMPLE PACK・VK All in One Expansion Unitはそのまま使えます。`,
            "初回の設定ウィザードで「専門サービス」を選びます。業種はProfessionalServiceになるので、設定画面の「業種（schema.org型）」をRealEstateAgentにします。いったんRealEstateAgentにしておけば、あとでウィザードをやり直しても保たれます。会社名・住所・電話番号・営業時間・説明を確認します。空欄の項目だけが、SEOプラグインなどの既存の設定やサイトの情報から補われます。",
            "説明（description）には、対応エリアと取扱い種別を1〜2文で書きます。例：「◯◯市・△△市の売買仲介と賃貸管理。相続した住まいの売却相談に対応。」Nurevo AEOは対応エリアを専用の項目では出力しないので、エリアはこの説明とページ本文で伝えます。",
            "設定画面で、売買仲介・賃貸仲介・売却査定・管理などをサービスとして1つずつ登録します。サービス名・説明・ページのURL・カテゴリを入れ、査定や来店予約のフォームがあれば予約URLに入れます。料金は、決まった金額があるものだけ入れます（空欄なら料金は出力されません）。会社に紐づいたServiceとして構造化データに出力され、llms.txtにもサービスの1行として載ります。",
            "よくある質問（初回相談の費用、査定にかかる日数、土日の対応、オンライン相談の可否など）を入力し、FAQを見せたいページにNurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。",
            "AEOスコアの画面で診断を実行し、チェックリストに出た不足をワンクリック修正で直します。構造化データ・llms.txt・AIクローラの許可は無料プランで出力されます。",
            "外からどう見えるかを[無料のAI可読性チェック](/check)で確認し、Googleビジネスプロフィールやポータルサイトの会社情報と一致しているかも見直します。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の会社情報の構造化データを出さず、足りない住所・電話番号・営業時間・RealEstateAgentなどの種類・サービスだけを追加します。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/ja/guide/local-business-schema-seo-plugins/)を参照してください。",
            `AIクローラについては、OpenAIは、OAI-SearchBotを拒否したサイトはChatGPTの検索回答に表示されないとしています（2026年10月31日確認）。[OpenAI：クローラの概要](${SRC.openaiBots})。robots.txtやセキュリティ系のプラグインで、気づかずに止めていないかを確認します。`,
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "会社名・住所・電話・営業時間・定休日が、サイト・Googleビジネスプロフィール・ポータルサイトで一致している。",
            "構造化データの種類がOrganizationのままではなく、RealEstateAgentになっている。支店ごとにページと情報がある。",
            "対応エリアが、市区町村・駅などの具体的な言葉で本文に書かれている。",
            "取扱い種別（売買・賃貸・管理・査定など）と得意な相談が、扱うものだけ書かれている。",
            "免許番号・所属団体などの会社の信頼情報が、会社概要に文字で書かれている。",
            "成約済み・募集終了の物件が、募集中のように残っていない。物件ページに更新日がある。",
            "自社サイトの口コミを評価の構造化データにしていない。根拠のない最上級の表現がない。",
            "llms.txtに、会社の概要・対応エリア・サービス・問い合わせのページが載っている。[llms.txtとは](/ja/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、お客さんが聞きそうな質問（エリア＋取引の種類＋相談の内容）を、会社名を入れずにAIに投げて、自社が名前やURLで出てくるかを見ます。あわせて「◯◯不動産の営業時間と定休日は？」のように会社名で聞き、答えの事実が正しいかも確かめます。AIの回答は回ごとに変わるので、同じ質問を何度か、期間をあけて記録するのが現実的です。手順と記録表は[AIでの登場率の測り方](/ja/guide/measure-ai-visibility/)にまとめています。GoogleのAI機能での表示回数は、[Search Consoleの見方](/ja/guide/search-console-ai-features/)で確認できます。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（会社名は含めません）をPerplexityに投げ、回答に会社の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に会社が出る割合を競合と比べて推移で見られます（現在の計測先はPerplexity、ChatGPTは設定され次第）。",
          ],
        },
      ],
      faqs: [
        { q: "不動産会社のAI検索対策は、何から始めればいいですか？", a: "対応エリア・取扱い種別・得意な相談と、所在地・営業時間・定休日・免許番号などの会社情報を、ページ本文に文字で正しく書くことからです。そのうえで、同じ事実をRealEstateAgentの構造化データとllms.txtで公開し、Googleビジネスプロフィールやポータルサイトの情報とそろえます。" },
        { q: "ポータルサイトに物件を載せていれば、自社サイトは整えなくてもいいですか？", a: "物件探しの質問では、ポータルサイトのページがAIの出典になることがあります。一方で「このエリアで、この相談をどこにすればいいか」という質問に答える材料は、会社の得意分野や対応エリアを詳しく書ける自社サイトにあります。両方の会社情報をそろえておくのが安全です。" },
        { q: "エリアごとのページはたくさん作ったほうがいいですか？", a: "数より中身です。地名だけを差し替えた同じ文章のページは、読み手にも役に立たず逆効果です。実際に扱っているエリアについて、担当店舗、よく受ける相談、地元ならではの情報を書いたページを作ります。" },
        { q: "物件ページにも構造化データは必要ですか？", a: "まずは会社としての情報（RealEstateAgent、サービス、FAQ）を整えるのが先です。物件ページでいちばん大切なのは、価格・賃料などの数字がポータルサイトと一致していること、成約済みの物件を募集中のように残さないこと、更新日を書くことです。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種（RealEstateAgentなど）・住所・営業時間・サービス・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）です。[WordPress.orgのNurevo AEO](${WP_ORG})` },
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
      title: "AI Search for Real Estate Agencies: Areas, Services, Trust | Nurevo",
      description: "AEO for real estate agencies starts with publishing your service area, services, hours and company facts correctly, in page text and RealEstateAgent structured data.",
      h1: "AI search for real estate agencies: how to get AI to read your area, specialties and company facts correctly",
      lead: "AI search optimization (AEO) for a real estate agency comes down to publishing, accurately and consistently, which areas you cover, which kinds of transactions you handle (sales, lettings, property management, valuations), which situations you are good at, and your company facts (address, opening hours, days closed, license number), both in your page text and in schema.org RealEstateAgent structured data. On top of that, the step that is specific to real estate is keeping listings current, so AI does not pick up information that is no longer true.",
      intro: [
        "Written November 11, 2026 (JST). Information from Google, OpenAI and Japan's Consumer Affairs Agency was checked on each official page on the dates given in the text.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your agency's facts readable to AI. They do not guarantee that an AI will mention your agency or rank it anywhere.",
      ],
      sections: [
        {
          heading: "What people ask AI about real estate",
          paragraphs: [
            "When someone asks ChatGPT, Perplexity or Google's AI Overviews to find a real estate agency, the AI reads what it can find on the web and builds an answer. The questions mix area, type of transaction, situation and day: \"an agent near the station who is good with pet-friendly rentals\", \"a company in my city that can help me sell a house I inherited\", \"an agency that is open on Wednesdays\", \"someone who helps foreign residents find an apartment\".",
            "Questions about a specific property (\"two bedrooms within ten minutes' walk of the station, under a set rent\") are better served by listing portals, and AI often cites the big portals or agencies' listing pages for them. Where a local agency is more likely to be chosen is when someone asks who to talk to. So the first thing to fix is not the number of listings but the company information that lets AI read \"this agency handles this kind of case in this area\".",
            `Google says there are no additional requirements and no special schema.org structured data needed to appear in AI Overviews or AI Mode, and that the usual basics still matter, such as making structured data match the visible text (checked November 1, 2026). [Google: AI features and your website](${SRC.googleAi}). The work is getting your agency's facts right, not finding an AI trick.`,
          ],
        },
        {
          heading: "The facts an agency site should publish",
          paragraphs: [
            `In structured data, a real estate agency can be described as a [schema.org RealEstateAgent](${SRC.realEstateAgent}). Google's local business documentation lists name and address as required, recommends openingHoursSpecification, telephone, url and others, and asks you to use the most specific type possible (checked October 29, 2026). [Google: local business structured data](${SRC.googleLocal}). If your type is still Organization or LocalBusiness, your structured data does not say you are a real estate agency.`,
          ],
          table: {
            head: ["Fact", "On the page", "In structured data"],
            rows: [
              ["Company and branch name", "Your official name, spelled the way it appears on your sign and Google Business Profile, with consistent branch names", "name (required)"],
              ["Address and directions", "The full address including floor, directions from the nearest station, and whether there is parking, as text", "address (required)"],
              ["Opening hours and days closed", "As text, not an image, including appointment-only hours and seasonal changes", "openingHoursSpecification (recommended)"],
              ["Phone and contact", "The phone number as text and links to your contact, visit booking and valuation request pages", "telephone (recommended), booking URL"],
              ["Service area", "Concrete names of towns, wards, stations or lines, with the extent in words (\"all of X, part of Y\")", "Page text and the description"],
              ["Services and specialties", "Only what you actually handle: sales, lettings, management, buying, valuations. Specialties (inheritance, moving up, commercial) with real examples", "A Service for each"],
              ["Trust facts", "Facts anyone can check: your real estate license number, trade associations, representative, year founded, number of licensed staff", "Page text (key points in the description)"],
            ],
            caption: "Required and recommended properties as listed in Google's local business documentation on October 29, 2026. Service is a schema.org type, not a Google required or recommended property.",
          },
          after: [
            "If you have several branches, give each its own page with its own address, phone, hours and service area. Listing every branch only on the head office page makes it hard to tell which branch covers which area.",
            "What matters most is that the same fact has the same value everywhere: your site, structured data, Google Business Profile, your company profile on listing portals, and llms.txt. When your days closed change or you move, update all of them together.",
          ],
        },
        {
          heading: "Building area and specialty pages",
          paragraphs: [
            "For an AI to answer \"a company in my city that can help me sell an inherited house\", some page has to say clearly that you cover that city and handle that kind of sale. Pages that combine an area with a type of case help with that. But mass-producing pages that are the same text with the place name swapped does the opposite: they are empty for readers, and every one looks the same.",
          ],
          list: [
            "On an area page, write which transactions you actually handle there, the questions you often get, which branch covers it, and things only a local would know (the hill from the station, where people shop, the kind of housing).",
            "On a specialty page (inheritance, moving up, vacant homes, commercial property, rentals for foreign residents), write how a consultation goes, which documents are needed, how long it usually takes, and common questions, following how you really work.",
            "When you quote prices or statistics, say which public data or survey they come from and as of when. Leave out \"market prices\" and \"X% of people\" claims with no source.",
            "Show track record (closed deals) only with the client's consent and in a way that does not identify them. If you give a count, add the period and how you counted.",
          ],
        },
        {
          heading: "Keeping listings current so AI does not repeat old information",
          paragraphs: [
            "The issue specific to real estate is how quickly listing information goes out of date. If the page for a property that has already been sold or let stays up, AI and search engines can read it and present it as still available. A client who contacts you because of an AI answer, only to hear the property is gone, trusts you less.",
          ],
          list: [
            "Take sold or let properties down promptly, or mark them clearly as closed on the page and remove the enquiry button.",
            "Show on each listing page when the information was last updated and when it will next be updated.",
            "Keep figures such as price, rent, walking time and building age the same in page text, structured data and listing portals.",
            "If your listings only appear after logging in or filtering, AI crawlers cannot read them. At minimum, put your company information (service area, services) on ordinary pages anyone can read.",
          ],
          after: [
            "Real estate advertising is regulated, and the rules differ by country. In Japan, for example, the Real Estate Brokerage Act and the industry's fair competition code on real estate advertising apply. Check how to present listings and which words you may use against the current rules from your trade association or regulator; this article does not explain individual provisions. Text written with AI in mind has to follow the same advertising rules.",
          ],
        },
        {
          heading: "Reviews and ratings: what not to add for AI",
          paragraphs: [
            `Some guides recommend adding star ratings (AggregateRating) to your agency or agent pages in structured data. Marking up reviews of your own business on your own site will not get you review stars in Google. In 2019 Google said that self-serving reviews, meaning reviews about a business placed on that business's own website, aren't allowed for LocalBusiness and Organization. [Google Search Central blog, September 16, 2019](${SRC.reviews2019})`,
            `Rules on undisclosed advertising differ by country, so check the ones that apply to you. In Japan, stealth marketing has been a violation of the Act against Unjustifiable Premiums and Misleading Representations since October 1, 2023, and the Consumer Affairs Agency treats reviews that a business asks or instructs third parties to post as that business's advertising (checked November 1, 2026). [Consumer Affairs Agency: stealth marketing (Japanese)](${SRC.caaStealth}). If you publish client testimonials, publish real ones, without hiding that they are promotional.`,
            "What AI needs from you is not praise but facts it can check: area, services, hours, license number. Claims you cannot back up, such as \"No. 1 in the area\" or \"we always get the highest price\", are safest left out of both your text and your markup.",
          ],
        },
        {
          heading: "Setting it up on a WordPress agency site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit keep working as they are.`,
            "In the setup wizard, choose \"Professional services\". That sets the business type to ProfessionalService, so change \"Business type (schema.org type)\" in Settings to RealEstateAgent. Once it is RealEstateAgent, running the wizard again keeps it. Check the business name, address, phone, opening hours and description. Only empty fields are filled in from your SEO plugin or site settings.",
            "In the description, say in one or two sentences which areas and services you cover, for example \"Sales and rental management in X and Y. We help with selling inherited homes.\" Nurevo AEO does not publish the service area as a separate property, so the description and your page text carry it.",
            "In Settings, add sales, lettings, valuations, management and so on as services, one at a time. Enter the name, description, page URL and category, and put your valuation or visit booking form in the booking URL. Enter a price only where there is a fixed one (with the price empty, no price is published). Each is published as a Service tied to your business and appears as a line in llms.txt.",
            "Enter your frequently asked questions (whether the first consultation is free, how long a valuation takes, weekend availability, online consultations) and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on the page where the FAQ should show.",
            "Run the check on the AEO score screen and fix what the checklist reports with one-click fixes. Structured data, llms.txt and AI crawler rules are on the free plan.",
            "See how the site looks from outside with the [free AI readability check](/check), and confirm that your Google Business Profile and portal company profiles match.",
          ],
          after: [
            "Alongside an SEO plugin, Nurevo AEO does not print a second business node. It adds only what is missing, such as the address, phone, opening hours, a type like RealEstateAgent, and services. See [adding local business details to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins/) for details.",
            `On AI crawlers, OpenAI says sites that opt out of OAI-SearchBot will not be shown in ChatGPT search answers (checked October 31, 2026). [OpenAI: overview of crawlers](${SRC.openaiBots}). Check that robots.txt or a security plugin is not blocking it without your knowledge.`,
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Name, address, phone, opening hours and days closed match across your site, Google Business Profile and listing portals.",
            "Your structured data type is RealEstateAgent, not Organization. Each branch has its own page and details.",
            "Your service area is written in concrete place names in your page text.",
            "Your services (sales, lettings, management, valuations) and specialties list only what you actually handle.",
            "Trust facts such as your license number and associations are written as text on your company page.",
            "No sold or let property is left up as if available, and listing pages show an update date.",
            "Reviews of your own business are not marked up as ratings, and there are no unsupported superlatives.",
            "llms.txt lists your company overview, service area, services and contact page. [What is llms.txt?](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, ask AI the questions your clients would ask (area plus type of transaction plus situation), without your agency's name, and see whether you come up by name or URL. Also ask by name (\"What are the opening hours of X Realty?\") and check that the facts in the answer are correct. Answers change between runs, so ask the same questions a few times, spread over time, and record them. The method and a record sheet are in [how to measure AI visibility](/guide/measure-ai-visibility/), and impressions in Google's AI features are covered in [the Search Console guide](/guide/search-console-ai-features/).",
            "Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your agency's name) are put to Perplexity, and the plugin records whether the answers named your agency or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta: how often your agency appears in AI answers, compared with competitors over time (currently measured on Perplexity, with ChatGPT added once it is configured).",
          ],
        },
      ],
      faqs: [
        { q: "Where should a real estate agency start with AI search?", a: "Write your service area, services, specialties and company facts (address, opening hours, days closed, license number) correctly as text on your pages. Then publish the same facts as RealEstateAgent structured data and in llms.txt, and make sure they match your Google Business Profile and portal profiles." },
        { q: "If my listings are on portals, do I still need to fix my own site?", a: "For property searches, AI often cites portal pages. But the material for answering \"who should I talk to about this kind of case in this area\" is on your own site, where you can describe your specialties and area in detail. Keeping your company details the same in both places is the safest approach." },
        { q: "Should I create lots of area pages?", a: "Substance matters more than number. Pages that only swap the place name are useless to readers and work against you. Create pages for the areas you really cover, with the branch, common questions and local knowledge." },
        { q: "Do listing pages need structured data too?", a: "Fix your company information first (RealEstateAgent, services, FAQ). What matters most on listing pages is that figures such as price and rent match the portals, that closed properties are not left up as available, and that each page shows an update date." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type (RealEstateAgent and others), address, hours, services and FAQ structured data, llms.txt, AI crawler rules and the AEO score are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee my agency appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your agency's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
