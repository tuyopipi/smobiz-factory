// Content page: AI search (AEO) for nursing-care facilities (老人ホーム・介護施設・
// 介護事業所). Industry page.
//
// Written 2026-11-14 (JST). Every claim about Nurevo AEO is one the plugin's
// readme makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt,
// 0.9.1) or the setup wizard (includes/setup-wizard.php: the "Other" card sets
// no type, so the plugin publishes LocalBusiness when an address, phone or
// hours are set). Pro measurement runs on Perplexity.
//
// Outside facts, checked 2026-11-14 on the primary pages linked in the copy:
// - Tochigi Prefecture notice: from 2025-04-01 every long-term care service
//   provider must post its 重要事項 on a website (own site or the MHLW 公表
//   system); items: 運営規程の概要, 勤務の体制, 協力医療機関, 利用料 etc.
// - Toyoake City training deck (令和7年度): the same obligation; items include
//   勤務体制 (counts by job and full/part time, names not required), 事故発生時の
//   対応, 苦情処理, 第三者評価の実施状況; the paper notice in the office still
//   applies.
// - 有料老人ホームに関する不当な表示 運用基準 (CAA index page lists it; read via
//   Wakayama Prefecture's copy): vague staffing words (多数・充実 etc.) without
//   figures are a problem; show 常勤換算 staff counts and the minimum night
//   staff; fee names (管理費・利用料) must state what they cover; insurance-
//   excluded services need content, price and how it is charged; required
//   items placed near the claim and easy for older readers to read.
// - MHLW explainer on 介護サービス情報の公表制度 (2012): 基本情報 (名称・所在地,
//   従業者, サービス内容, 利用料等, 法人情報) and 運営情報; reported yearly.
// - schema.org (checked in schema-dts 2.1.0's type list on 2026-11-14): no type
//   for nursing homes / care homes / assisted living. Nursing and Geriatric
//   exist under MedicalBusiness but describe a health profession and a branch
//   of medicine, not a care home.
// - Google's local business and "AI features and your website" pages: facts as
//   checked for dental-clinic-ai-search (2026-10-29). The fetch from this run
//   was not permitted, so no new Google claim is made here.
// Re-check these when you update the page, and update the date with them.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  tochigi: "https://www.pref.tochigi.lg.jp/e11/documents/20250313134433.pdf",
  toyoake: "https://www.city.toyoake.lg.jp/secure/26317/2.webkeisai.pdf",
  caaIndex: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/guideline/",
  caaUnyo: "https://wave.pref.wakayama.lg.jp/kaigodenet/careprov/careref/yuryorojin/hyouji-unyou.pdf",
  mhlwKouhyou: "https://www.mhlw.go.jp/seisakunitsuite/bunya/hukushi_kaigo/kaigo_koureisha/kouhyou/dl/doc01-1.pdf",
  localBusiness: "https://schema.org/LocalBusiness",
};

export default {
  slug: "nursing-care-facility-ai-search",
  targetQueries: [
    "nursing home AI search optimization",
    "assisted living ChatGPT visibility",
    "care home schema markup",
    "老人ホーム AI検索対策",
    "介護施設 ChatGPT 表示",
    "介護事業所 構造化データ",
  ],
  related: ["local-business-schema-seo-plugins", "llms-txt", "measure-ai-visibility", "appear-in-chatgpt", "aeo-wordpress"],
  locales: {
    ja: {
      title: "老人ホーム・介護施設のAI検索対策：費用・受け入れ条件・空室 | Nurevo",
      description: "老人ホーム・介護施設のAI検索対策は、費用の内訳、受け入れる要介護度と医療的ケア、職員体制、空室と見学を、本文と構造化データで正確に出すこと。表示ルールと手順を解説。",
      h1: "老人ホーム・介護施設のAI検索対策：費用の内訳・受け入れ条件・空室をAIに正しく読ませる手順",
      lead: "老人ホーム・介護施設のAI検索対策の中心は、家族やケアマネジャーがAIに聞く「月にいくらかかるか（何が含まれ、何が別か）」「要介護いくつまで、どんな医療的ケアまで受け入れるか」「夜は何人いるか」「いま空きはあるか、見学できるか」に、ページ本文で数字と条件を書いて答えることです。そのうえで同じ事実を構造化データ・llms.txt・介護サービス情報公表システムと矛盾なくそろえます。有料老人ホームには景品表示法の告示による表示ルールがあり、「スタッフ充実」のようなあいまいな言葉はAI向けでも使わないのが原則です。",
      intro: [
        "作成日：2026年11月14日（JST）。都道府県・市・消費者庁の資料とschema.orgの型の一覧は同日に確認しました。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが施設の事実を正しく読める状態をつくるものです。AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "家族とケアマネジャーはAIに何を聞くか",
          paragraphs: [
            "老人ホームや介護施設を探すとき、本人より先に家族が調べることがよくあります。AIに聞く質問は、たとえば「◯◯市で要介護3の母が入れて、月20万円以内の施設」「胃ろうでも入れる老人ホーム」「看取りまでしてくれる施設」「認知症でも入れるグループホームの空き」のように、場所・費用・介護度・医療的ケア・空きの条件が重なったものになりがちです。",
            "AIがこうした質問に施設名を挙げるには、その条件を満たすことが文字で読み取れる必要があります。費用が「月額◯万円〜」だけで内訳がない、受け入れ条件が「ご相談ください」だけ、空室状況がいつの情報かわからない、といったページは、条件つきの質問の答えに使いにくくなります。",
            `Googleは、AI OverviewsやAI Modeに出るための追加の要件や特別な構造化データはなく、通常のSEOの基本が大切だとしています。[Google：AI features and your website](${SRC.googleAi})。介護施設のAI検索対策も、裏技ではなく、家族が判断に使う事実を正確に書くことが本体です。`,
          ],
        },
        {
          heading: "公開しておきたい事実と、書き方",
          paragraphs: [
            "上位の記事の多くは「費用・空室・見学を載せましょう」で終わっていますが、AIが条件つきの質問に答えるには、どこまで書くかが大切です。施設の種類（介護付き有料老人ホーム、住宅型有料老人ホーム、サービス付き高齢者向け住宅、グループホーム、特別養護老人ホーム、デイサービスなど）ごとに項目は少し変わりますが、目安は次のとおりです。",
          ],
          table: {
            head: ["事実", "ページ本文での書き方", "注意点"],
            rows: [
              ["施設の種類", "「介護付き有料老人ホーム（一般型特定施設入居者生活介護）」のように正式な区分で", "「老人ホーム」だけだと、AIは種類を推測するしかない"],
              ["入居時の費用", "入居一時金・敷金の有無と金額、返還の条件", "「入居金0円」と書くなら、月額が高くなるプランかどうかも並べて書く"],
              ["月額費用の内訳", "家賃・管理費・食費・水道光熱費などの金額と、それぞれに何が含まれるか", "管理費・利用料という名前だけでなく、中身を書く（後述の表示ルール）"],
              ["月額に含まれない費用", "介護保険の自己負担、医療費、おむつ代、理美容、個別の外出付き添いなど", "回数ごとにかかるものは「1回あたり◯円」と書く"],
              ["受け入れ条件", "自立・要支援・要介護の範囲、認知症、医療的ケア（たん吸引、胃ろう、インスリン、在宅酸素など）ごとの可否", "「応相談」だけにせず、可・条件つき可・不可を分ける"],
              ["職員体制", "介護職員・看護職員の人数（常勤換算）、夜間の最少人数、看護職員がいる時間帯", "「手厚い」ではなく数字で"],
              ["協力医療機関", "医療機関の名前と、協力の内容（往診、受診の付き添いなど）", "提携の範囲を実際より広く見せない"],
              ["空室・見学", "空室の数か「空室あり／待機あり」と、その情報の更新日。見学の予約方法と時間帯", "更新日のない空室情報は、古い情報として扱われやすい"],
              ["退去の条件", "長期入院や医療的ケアの増加など、退去をお願いすることがある場合", "「終身」と書くなら、その条件も同じページに"],
            ],
            caption: "項目は、後述の「重要事項」のウェブ掲載義務と、有料老人ホームの表示ルールで求められる項目をもとにまとめたものです。",
          },
          after: [
            "どの値も、本文・構造化データ・Googleビジネスプロフィール・パンフレット・介護サービス情報公表システムで同じにします。料金改定や介護報酬の改定で金額が変わったら、すべてを一緒に更新します。",
          ],
        },
        {
          heading: "2025年4月から：重要事項のウェブサイト掲載は義務",
          paragraphs: [
            `令和6年度の介護報酬改定にともない、2025年4月1日から、すべての介護サービス事業者に「重要事項」をウェブサイトに掲載・公表することが義務付けられました。掲載先は法人のホームページ等か、介護サービス情報公表システムです。[栃木県：重要事項のウェブサイトへの掲載について（PDF）](${SRC.tochigi})`,
            `掲載する項目として、運営規程の概要、従業者の勤務の体制、協力医療機関、利用料など利用者の選択に役立つ事項が挙げられています。市の研修資料では、勤務体制は職種ごとの人数と常勤・非常勤の別で足り、氏名までは不要であること、事故発生時の対応・苦情処理の体制・第三者評価の実施状況なども示されています。事業所内の掲示または備え付けも引き続き必要です。[豊明市：研修資料（PDF）](${SRC.toyoake})。具体的な項目はサービスの種類ごとの基準で決まるので、指定を受けた自治体の案内で確認してください。`,
            "AI検索の面から見ると、この重要事項は家族が知りたい事実そのものです。PDFを1つ置くだけでなく、費用・体制・協力医療機関の要点をHTMLのページにも書き、そこからPDFへリンクしておくと、AIにも人にも読みやすくなります。",
          ],
        },
        {
          heading: "有料老人ホームの表示ルール：AI向けでも書かないこと",
          paragraphs: [
            `有料老人ホームの広告やサイトには、景品表示法にもとづく告示「有料老人ホームに関する不当な表示」と、その運用基準があります（消費者庁の[告示・運用基準の一覧](${SRC.caaIndex})に掲載）。運用基準では、たとえば次のような点が示されています。[運用基準（和歌山県掲載の写し、PDF）](${SRC.caaUnyo})`,
          ],
          list: [
            "介護職員等の数について、具体的な数字を示さずに「多数」「充実」などと表示するのは問題になる。常勤換算の人数などを示す。",
            "夜間については、施設が決めた夜間の時間帯と、その時間帯の介護職員・看護職員の最少人数を示す。",
            "「管理費」「利用料」などの費用は、何に充てるものかの内訳を示し、実際の使い方と合っている必要がある。",
            "介護保険の給付の対象外のサービスは、サービスごとに内容・費用・徴収の方法を示す。",
            "表示が必要な事項は、強調している表示の近くに、高齢者にも読みやすい形で置く。",
          ],
          after: [
            "構造化データやFAQ、llms.txtも、ページの内容を機械向けに書き直したものです。本文に書けない表現（根拠のない「地域一番」、数字のない「看護体制充実」など）は、AI向けの場所にも書かないでください。住宅型有料老人ホームやサービス付き高齢者向け住宅など、施設の種類によって当てはまるルールは変わるので、詳しくは指導権限のある都道府県・市の担当窓口で確認してください。",
          ],
        },
        {
          heading: "構造化データ：介護施設専用の型はない",
          paragraphs: [
            "schema.orgには、老人ホームや介護施設を表す専用の型がありません（2026年11月14日にschema.orgの型の一覧で確認）。MedicalBusinessの下にNursingやGeriatricという型がありますが、説明はそれぞれ看護という職種、高齢者医療という医学の分野で、施設の種類ではありません。病院やクリニックと誤って読まれるのを避けるためにも、これらを施設の型には使わないほうが安全です。",
            `おすすめは、施設を[LocalBusiness](${SRC.localBusiness})として、名前・住所・電話・見学受付の時間・URLを出し、施設の種類（介護付き有料老人ホーム、デイサービスなど）はサービスとして紐づけ、本文で詳しく書くことです。Googleのローカルビジネスの構造化データでは、nameとaddressが必須です。[Google：ローカルビジネスの構造化データ](${SRC.googleLocal})`,
            "空室の数や料金の細かい内訳は、変わりやすいうえに構造化データに入れる決まった場所もないため、本文の表で更新日と一緒に書くのが現実的です。構造化データに入れるのは、変わりにくい事実（名前・所在地・連絡先・サービスの種類）を中心にします。",
          ],
        },
        {
          heading: "WordPressの施設サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。0.9.1からはSEO SIMPLE PACKやVK All in One Expansion Unitとも、構造化データを重複させずに併用できます。`,
            "初回の設定ウィザードで「その他」を選びます。業種の型を指定しない設定で、住所・電話番号・営業時間のどれかが入っていればLocalBusinessとして出力されます。施設名・住所・電話番号・説明を確認します。空欄の項目だけが既存の設定から補われ、入力済みの値は上書きされません。",
            "営業時間の欄には、見学や相談の受付時間を入れます（入居者の生活は24時間なので、受付時間であることを本文にも書きます）。",
            "設定画面で、施設の種類や併設のサービス（デイサービス、ショートステイ、居宅介護支援など）をサービスとして登録し、家族からよく聞かれる質問をFAQに入れます。FAQは、Nurevo FAQブロック（または[nurevo_faq]ショートコード）を置いたページのFAQPageに追加されます。",
            "費用の内訳・受け入れ条件・職員体制・空室（更新日つき）は、固定ページの本文に表で書き、重要事項のPDFにリンクします。",
            "AEOスコアの画面で診断を実行し、不足をワンクリック修正で直します。外からどう見えるかは[無料のAI可読性チェック](/check)で確かめます。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の構造化データを出さず、SEOプラグインのグラフに足りない住所・電話番号・営業時間だけを足します。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/ja/guide/local-business-schema-seo-plugins/)をご覧ください。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "施設の種類が正式な区分で書かれている（「老人ホーム」だけになっていない）。",
            "月額費用が内訳つきで書かれ、月額に含まれない費用も金額か「1回あたり◯円」で書かれている。",
            "受け入れ条件が、要介護度・認知症・医療的ケアの項目ごとに、可・条件つき可・不可で書かれている。",
            "職員体制が常勤換算の人数と夜間の最少人数で書かれ、「充実」などの言葉だけになっていない。",
            "空室情報に更新日がある。",
            "重要事項がウェブサイトか介護サービス情報公表システムに掲載され、サイトの金額と一致している。",
            "構造化データの名前・住所・電話番号が本文・Googleビジネスプロフィールと一致し、型にNursingやHospitalなど医療機関の型を使っていない。",
            "llms.txtに、施設の概要・費用・受け入れ条件・見学のページが載っている。[llms.txtとは](/ja/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、家族が聞きそうな質問を、地域・介護度・費用・医療的ケアの組み合わせで5〜10個つくり、ChatGPTやPerplexityに投げて、施設が名前やURLで出るか、費用や受け入れ条件が正しく書かれているかを記録します。AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。測り方の詳細は[AIでの登場率の測り方](/ja/guide/measure-ai-visibility/)にまとめています。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（施設名は含めません）をPerplexityに投げ、回答に施設の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に施設が出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "老人ホームのAI検索対策は、何から始めればいいですか？", a: "月額費用の内訳と月額に含まれない費用、受け入れる要介護度と医療的ケア、職員体制、空室（更新日つき）を、ページ本文に文字で書くことからです。そのうえで、施設名・住所・電話番号を構造化データとGoogleビジネスプロフィールでそろえます。" },
        { q: "構造化データの型は何を使えばいいですか？", a: "schema.orgには介護施設専用の型がないため、LocalBusinessを使い、施設の種類やデイサービスなどはサービスとして紐づけるのがおすすめです。NursingやGeriatricは職種や医学の分野を表す型なので、施設の型には向きません。" },
        { q: "空室の数を毎日更新できません。書かないほうがいいですか？", a: "「空室あり」「待機あり」のような状態と、その情報の更新日を書くだけでも十分役に立ちます。更新日がない空室情報は古いものとして扱われやすいので、更新できる頻度に合わせた書き方にしてください。" },
        { q: "AIに選ばれるために「スタッフ充実」と書いてもいいですか？", a: "有料老人ホームの表示ルール（運用基準）では、数字を示さずに職員が多い・充実していると表示することは問題になるとされています。常勤換算の人数や夜間の最少人数など、数字で書いてください。" },
        { q: "介護サービス情報公表システムに載っていれば、自社サイトは要りませんか？", a: "重要事項の掲載先としては公表システムも認められています。ただ、費用の内訳や受け入れ条件の詳しい説明、見学の申し込みなど、家族が判断に使う情報は自社サイトのほうが詳しく書けます。両方の値を一致させておくことが大切です。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。施設の住所・連絡先・受付時間・サービス・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTに施設が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが施設の事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
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
      title: "AI Search for Care Homes: Fees, Admission and Vacancies | Nurevo",
      description: "AEO for care homes: publish your fee breakdown, the care needs you accept, staffing and vacancies as text and matching structured data. Rules, steps, checklist.",
      h1: "AI search for nursing and care homes: how to get AI to read your fees, admission criteria and vacancies correctly",
      lead: "AI search optimization for a nursing or care home comes down to answering, in plain text with numbers and conditions, the questions families and care managers now ask AI: what it costs each month (what is included and what is extra), which care needs and medical care you accept, how many staff are on at night, and whether there is a vacancy and how to visit. Then you publish the same facts consistently in structured data, llms.txt and any official care directory you are listed in. Advertising rules for care homes still apply, so vague claims like \"fully staffed\" have no place in content written for AI either.",
      intro: [
        "Written November 14, 2026 (JST). The Japanese prefectural, municipal and Consumer Affairs Agency documents, and schema.org's list of types, were checked that day. Examples of rules come from Japan; check the rules where you operate.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your facts readable to AI. They do not guarantee that an AI will mention your home or rank it anywhere.",
      ],
      sections: [
        {
          heading: "What families and care managers ask AI",
          paragraphs: [
            "The search for a care home is often done by a son or daughter before the future resident is involved. The questions they put to AI stack several conditions at once: \"a care home in [city] that takes a mother with high care needs for under a set monthly budget\", \"a nursing home that accepts tube feeding\", \"a home that provides end-of-life care\", \"memory care with a vacancy now\".",
            "For an AI to name your home in an answer like that, it has to be able to read, as text, that you meet those conditions. A page that says only \"from X per month\" with no breakdown, admission criteria that say only \"please ask us\", or a vacancy notice with no date is hard to use when the question has conditions.",
            `Google says there are no additional requirements and no special structured data needed to appear in AI Overviews or AI Mode, and that normal SEO basics still apply. [Google: AI features and your website](${SRC.googleAi}). For a care home, the work is not a trick: it is writing down, accurately, the facts a family uses to decide.`,
          ],
        },
        {
          heading: "The facts to publish, and how to write them",
          paragraphs: [
            "Most top-ranking articles stop at \"publish your pricing, vacancies and tour booking\". What decides whether AI can use them is how far you go. Details vary by type of home (nursing home, assisted living, residential care, memory care, day service), but this is a good baseline:",
          ],
          table: {
            head: ["Fact", "How to write it on the page", "Watch out for"],
            rows: [
              ["Type of home", "The formal category you are licensed or registered as", "\"Care home\" alone leaves AI to guess which kind you are"],
              ["Move-in costs", "Any entrance fee or deposit, the amount, and the refund conditions", "If you advertise \"no entrance fee\", say whether that plan has a higher monthly fee"],
              ["Monthly fee breakdown", "Rent, service or management fee, meals, utilities, each with an amount and what it covers", "Do not stop at a fee name: say what it pays for (see the rules below)"],
              ["Costs not in the monthly fee", "Care co-payments, medical costs, continence supplies, hairdressing, escorts to appointments and so on", "For per-use charges, write \"per time\" with the price"],
              ["Admission criteria", "The range of care needs you accept, dementia, and each kind of medical care (suctioning, tube feeding, insulin, home oxygen)", "Do not leave it at \"ask us\": split into yes, yes with conditions, and no"],
              ["Staffing", "Care and nursing staff numbers (full-time equivalent), the minimum on duty at night, hours a nurse is on site", "Numbers, not \"attentive\" or \"generous\""],
              ["Partner medical institutions", "Names, and what the arrangement covers (home visits, escorts to appointments)", "Do not make the arrangement look broader than it is"],
              ["Vacancies and visits", "Number of vacancies, or \"vacancy\" / \"waiting list\", with the date it was last updated; how and when to book a visit", "Vacancy information with no date tends to be treated as stale"],
              ["When residents may have to leave", "Situations such as a long hospital stay or medical needs you cannot meet", "If you say \"for life\", put the conditions on the same page"],
            ],
            caption: "The list is based on the items Japan requires care providers to post online and the items its care-home advertising rules cover (both below).",
          },
          after: [
            "Keep every value the same across your page text, structured data, Google Business Profile, brochure and any official directory. When fees change, update all of them together.",
          ],
        },
        {
          heading: "In Japan, posting key information online has been mandatory since April 2025",
          paragraphs: [
            `Following Japan's 2024 revision of long-term care fees, every long-term care service provider has had to post its key information (重要事項) on a website since April 1, 2025, either on its own or its operator's website or in the Ministry of Health, Labour and Welfare's care service information system. [Tochigi Prefecture notice (PDF, Japanese)](${SRC.tochigi})`,
            `The items include an outline of the operating rules, the staffing arrangement, partner medical institutions, fees and other information that helps people choose. A municipal training deck adds that staffing can be shown as numbers by job and by full-time or part-time status (names are not required), and lists the response to accidents, complaint handling and whether a third-party evaluation was carried out. The existing requirement to display the information at the office still applies. [Toyoake City training deck (PDF, Japanese)](${SRC.toyoake}). The exact items depend on the standards for each type of service, so check with the authority that designated you.`,
            "From an AI search point of view, this key information is exactly what families want to know. Rather than only uploading a PDF, put the essentials (fees, staffing, partner medical institutions) on an HTML page as well and link to the PDF from it. That is easier for both AI and people to read.",
          ],
        },
        {
          heading: "Advertising rules for care homes: what not to write for AI",
          paragraphs: [
            `In Japan, fee-charging homes for the elderly (有料老人ホーム) are covered by a notice under the Act against Unjustifiable Premiums and Misleading Representations, \"Misleading representations concerning fee-charging homes for the elderly\", and its operating guidelines (listed on the Consumer Affairs Agency's [page of notices and guidelines](${SRC.caaIndex}), Japanese). The guidelines include points such as these. [Operating guidelines, copy posted by Wakayama Prefecture (PDF, Japanese)](${SRC.caaUnyo})`,
          ],
          list: [
            "Describing care staff as \"many\" or \"ample\" without specific figures is a problem. Show numbers such as the full-time-equivalent count.",
            "For nights, show the night-time hours the home has set and the minimum number of care and nursing staff on duty in that period.",
            "Fees such as a \"management fee\" or \"service fee\" must say what they are used for, and the breakdown must match how they are actually used.",
            "Services not covered by long-term care insurance must each show their content, price and how they are charged.",
            "Required information must be placed near the claim it qualifies, in a form older readers can easily read.",
          ],
          after: [
            "Structured data, FAQ and llms.txt are your page content rewritten for machines. If you cannot say it on the page (an unsupported \"best in the area\", \"excellent nursing care\" with no numbers), do not say it in the places written for AI. Other countries have their own licensing and advertising rules, and in Japan the rules differ by type of home, so check with the authority responsible for you.",
          ],
        },
        {
          heading: "Structured data: there is no care-home type",
          paragraphs: [
            "schema.org has no type for nursing homes, care homes or assisted living (checked against schema.org's type list on November 14, 2026). There are types called Nursing and Geriatric under MedicalBusiness, but they describe a health profession and a branch of medicine, not a kind of home. Using them for your home risks being read as a hospital or clinic, so it is safer not to.",
            `The safer choice is to describe the home as a [LocalBusiness](${SRC.localBusiness}) with its name, address, phone, visiting or enquiry hours and URL, link the type of home and services such as day care as services, and explain the details in the page text. In Google's local business structured data, name and address are required. [Google: Local business structured data](${SRC.googleLocal})`,
            "Vacancy counts and detailed fee breakdowns change often and have no settled place in structured data, so the practical place for them is a table in the page text with an update date. Keep structured data to facts that rarely change: name, location, contact details and types of service.",
          ],
        },
        {
          heading: "Setting it up on a WordPress care-home site",
          list: [
            `Install Nurevo AEO (free) from [WordPress.org](${WP_ORG}) and activate it. Keep Yoast SEO, Rank Math, All in One SEO or Slim SEO if you use one. Since 0.9.1 it also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.`,
            "In the setup wizard, choose \"Other\". That card sets no specific type, so the plugin publishes LocalBusiness as long as an address, phone or hours are filled in. Confirm the name, address, phone and description. Only blank fields are filled in from your existing settings; nothing you typed is overwritten.",
            "Use the opening hours field for the hours you take enquiries and visits, and say so in the page text, since residents are cared for around the clock.",
            "Under Settings, add the type of home and any services on site (day service, short stays, care planning) as services, and enter the questions families ask most in the FAQ. FAQ questions are added to the page's FAQPage on the page where you place the Nurevo FAQ block or the [nurevo_faq] shortcode.",
            "Put the fee breakdown, admission criteria, staffing and vacancies (with an update date) as tables in the page text, and link to your key-information PDF.",
            "Run the diagnosis on the AEO Score screen and apply the one-click fixes. Check how AI reads you from the outside with the [free AI readability check](/check).",
          ],
          after: [
            "With an SEO plugin active, Nurevo AEO does not print a second set of structured data. It adds only the missing address, phone and hours into the graph your SEO plugin already publishes. See [adding local business schema to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins/).",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "The type of home is written as its formal category, not just \"care home\".",
            "The monthly fee is broken down, and costs outside it are shown with prices or \"per time\" amounts.",
            "Admission criteria are written for care level, dementia and each kind of medical care, as yes, yes with conditions, or no.",
            "Staffing is shown as full-time-equivalent numbers and the night-time minimum, not just words like \"ample\".",
            "Vacancy information has an update date.",
            "Required key information is posted on your site or the official directory, and its figures match your site.",
            "Name, address and phone in structured data match the page and your Google Business Profile, and the type is not a medical one such as Nursing or Hospital.",
            "llms.txt lists your overview, fees, admission criteria and visit pages. [What is llms.txt?](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, write five to ten questions a family would ask, combining area, care level, budget and medical needs. Put them to ChatGPT and Perplexity and record whether your home appears by name or URL, and whether fees and admission criteria are stated correctly. Answers vary between runs, so repeat the same questions over time. [How to measure AI visibility](/guide/measure-ai-visibility/) covers the method in detail.",
            "Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your home's name) are put to Perplexity, and the plugin records whether the answers named you or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta: how often you appear in AI answers, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a care home start with AI search?", a: "Write your monthly fee breakdown and the costs outside it, the care needs and medical care you accept, your staffing and your vacancies (with an update date) as text on your pages. Then make your name, address and phone match across structured data and your Google Business Profile." },
        { q: "Which structured data type should a care home use?", a: "schema.org has no care-home type, so use LocalBusiness and link the type of home and services such as day care as services. Nursing and Geriatric describe a profession and a branch of medicine, so they are not a good fit for the home itself." },
        { q: "We cannot update the vacancy count every day. Should we leave it out?", a: "Showing a status such as \"vacancy\" or \"waiting list\" with the date it was last updated is already useful. Vacancy information with no date tends to be treated as stale, so choose a format you can keep current." },
        { q: "Can we write \"fully staffed\" to help AI pick us?", a: "In Japan, the care-home advertising guidelines treat claims of many or ample staff without figures as a problem. Use numbers such as the full-time-equivalent count and the night-time minimum instead. Check the rules that apply where you operate." },
        { q: "If we are in an official care directory, do we still need our own site?", a: "In Japan the official system is an accepted place to post the required key information. But your own site can explain fees, admission criteria and visits in far more detail, which is what families use to decide. Keep the values in both identical." },
        { q: "Is Nurevo AEO free?", a: `Yes. Structured data for your address, contact details, hours, services and FAQ, plus llms.txt, AI crawler rules and the AEO score, are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee our home appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your home's website",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
