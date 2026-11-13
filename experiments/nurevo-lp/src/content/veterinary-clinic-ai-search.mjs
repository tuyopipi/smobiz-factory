// Content page: AI search (AEO) for veterinary clinics / animal hospitals.
// Industry page.
//
// Written 2026-11-13 (JST). Every claim about Nurevo AEO is one the plugin's
// readme or code makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary):
// the setup wizard's "Clinic or dental" card (ja: クリニック・歯科) sets
// MedicalBusiness and its family includes VeterinaryCare, so a site set to
// VeterinaryCare is shown that card and keeps its type (includes/setup-wizard.php);
// Settings has a free-text "Business type (schema.org type)" field
// (ja: 業種（schema.org型）) that takes one type name
// (webmcp_canary_business_schema_type, /^[A-Za-z][A-Za-z0-9]*$/);
// VeterinaryCare is in the recognised type list (webmcp_canary_local_business_types);
// opening hours in common forms become openingHoursSpecification on that node;
// services are published as Service + llms.txt lines; free monthly check is three
// questions to Perplexity without the business name; Pro measurement runs on
// Perplexity (ChatGPT once configured).
//
// Outside facts:
// - schema.org hierarchy, checked 2026-11-13 against schema-dts 2.1.0 (generated
//   from the schema.org vocabulary; schema.org itself could not be fetched from
//   this run): VeterinaryCare extends MedicalOrganization (an Organization) and is
//   NOT in the LocalBusiness union; Dentist, Physician, Pharmacy are under
//   MedicalBusiness (a LocalBusiness). openingHoursSpecification is a Place
//   property (LocalBusiness is a Place).
// - Google LocalBusiness doc "use the most specific LocalBusiness sub-type"
//   (checked 2026-10-29 for dental-clinic-ai-search).
// - Google "AI features and your website" (checked 2026-11-12 by the 08:00 run).
// - OpenAI crawlers (checked 2026-10-31).
// - Japan, veterinary advertising: 獣医療法第17条; 獣医療広告ガイドライン
//   (指針, 最終改正 平成26年11月25日, as published by Okinawa Prefecture) treats a
//   clinic's own website as in principle not an advertisement under the Act,
//   but banner / search-linked ads meeting the three conditions are; prohibits
//   comparative and exaggerated ads for the permitted items; 2024-04-01 revision
//   (令和5年農林水産省令第52号) added six advertisable items, with enquiry contact,
//   usual treatment, main risks and cost to be shown alongside (Aichi and
//   Kumamoto prefecture pages, read 2026-11-13). The MAFF page itself could not
//   be fetched from this run, so the current guideline text is not quoted.
// - 5W Public Relations finding as reported by myvetcandy.com (2026-06-14): no
//   method or sample published; quoted only with that caveat (en only).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  vetCare: "https://schema.org/VeterinaryCare",
  medOrg: "https://schema.org/MedicalOrganization",
  localBusiness: "https://schema.org/LocalBusiness",
  openaiBots: "https://developers.openai.com/api/docs/bots",
  aichi: "https://www.pref.aichi.jp/soshiki/chikusan/juiryokoukokuseigen.html",
  kumamoto: "https://www.pref.kumamoto.jp/soshiki/78/206301.html",
  guideline: "https://www.pref.okinawa.jp/_res/projects/default_project/_page_/001/011/305/guideline.pdf",
  maff: "https://www.maff.go.jp/j/syouan/tikusui/zyui/koukoku.html",
  vetCandy: "https://www.myvetcandy.com/news/2026/6/14/chatgpt-keeps-recommending-the-same-veterinary-chains-independent-vets-are-barely-showing-up",
};

export default {
  slug: "veterinary-clinic-ai-search",
  targetQueries: [
    "AI search optimization for veterinary clinics",
    "how to get my vet clinic recommended by ChatGPT",
    "VeterinaryCare schema markup",
    "動物病院 AI検索対策",
    "動物病院 ChatGPT 表示",
    "動物病院 構造化データ",
  ],
  related: ["dental-clinic-ai-search", "local-business-schema-seo-plugins", "measure-ai-visibility", "llms-txt", "search-console-ai-features"],
  locales: {
    ja: {
      title: "動物病院のAI検索対策：診療動物・夜間対応をAIに伝える | Nurevo",
      description: "動物病院のAI検索対策は、診療対象の動物・診療時間と受付終了・夜間救急の対応・予約方法を本文と構造化データで正確に出すことから。VeterinaryCare型の注意点、獣医療広告のルール、WordPressでの手順を解説。",
      h1: "動物病院のAI検索対策：診療する動物・診療時間・夜間の対応をAIに正しく読ませる手順",
      lead: "動物病院のAI検索対策（AEO・LLMO）の中心は、どの動物を診るか、診療時間と受付終了の時刻、夜間・休日・救急の対応、予約制かどうか、駐車場や支払い方法といった事実を、ページ本文と構造化データ（schema.orgのVeterinaryCare）で正確に、矛盾なく公開することです。この業種で特に差がつくのは「診療対象の動物」と「夜間・救急にどう対応するか（しない場合はどこを案内するか）」を文字ではっきり書くことです。",
      intro: [
        "作成日：2026年11月13日（JST）。schema.org・Google・OpenAI・自治体の情報は、本文に記した日に確認したものです。獣医療の広告のルールは2024年4月に改正されています。表現の可否は、農林水産省の最新の指針や都道府県の担当窓口で確認してください。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが病院の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "飼い主はAIに何を聞いているか",
          paragraphs: [
            "ChatGPT、Perplexity、GoogleのAI Overviewsなどに動物病院を探す質問をすると、AIはウェブ上の情報を読んで、いくつかの病院名を挙げて答えをまとめます。飼い主が聞くのは「◯◯市でうさぎを診てくれる動物病院」「日曜の夜に開いている動物病院」「猫の歯石取りができる病院」「駐車場がある動物病院」のように、動物の種類・曜日と時間・診療内容・通いやすさがからむ質問です。",
            "人の歯科やクリニックとの大きな違いは、動物の種類で病院が絞られることです。犬と猫だけを診る病院、うさぎ・フェレット・小鳥・爬虫類なども診る病院、猫だけの病院があり、飼い主はそこを最初に確かめたがります。ところが多くの病院のサイトでは、診療対象がトップの画像の中にしか書かれていない、または書かれていないことがあります。AIは書かれていないことを推測では補いにくいので、「うさぎを診る病院」の答えから外れやすくなります。",
            `もう1つは夜間と救急です。具合が悪いときに聞かれることが多く、間違いの影響も大きい質問です。Googleは、AI OverviewsやAI Modeに出るための特別な構造化データや追加の要件はなく、通常のSEOの基本（ページの見える文章と構造化データを一致させる、ビジネスプロフィールを最新にするなど）が大切だとしています（2026年11月12日確認）。[Google：AI features and your website](${SRC.googleAi})。裏技ではなく、病院の事実を正しく出しておくことが対策の本体です。`,
          ],
        },
        {
          heading: "公開しておきたい事実と書き方",
          paragraphs: [
            "下の表は、飼い主の質問に答えるために、サイトの本文に文字で書いておきたい項目です。右の列は、構造化データやNurevo AEOのどこに入れるかの目安です。",
          ],
          table: {
            head: ["項目", "書き方の例", "構造化データ・設定での扱い"],
            rows: [
              ["診療対象の動物", "「犬・猫・うさぎ・フェレット。小鳥と爬虫類は診ていません」のように、診ない動物も書く", "専用のプロパティはないため、説明（description）・サービス・FAQ・本文で伝える"],
              ["診療時間と受付終了", "「午前9:00〜12:00（受付11:30まで）、午後16:00〜19:00、水曜・祝日休診」", "営業時間（openingHoursSpecification）。受付終了は本文とFAQに"],
              ["予約の方法", "予約制か順番制か、予約の電話番号・予約ページのURL、当日の飛び込みの扱い", "サービスの予約URL、FAQ"],
              ["夜間・休日・救急", "対応する時間帯と条件。対応しない場合は「夜間は◯◯動物医療センターをご案内しています」と書く", "本文とFAQ。対応しない時間を営業時間に含めない"],
              ["往診", "往診の有無、対応地域、予約の方法", "サービスとして登録"],
              ["診療科目", "一般診療、皮膚科、歯科、眼科などの専門科名", "サービスとして1つずつ登録"],
              ["予防・健康診断", "ワクチン、フィラリア予防、健康診断、マイクロチップの装着など", "サービスとして登録"],
              ["設備", "持っている検査機器（例：CT、超音波検査装置）。持っていない検査は外部の施設を紹介するか", "本文。広告に転用するときはルールを確認（後述）"],
              ["通いやすさ", "住所、最寄り駅、駐車場の台数、支払い方法（カード・電子マネー）", "住所・電話は構造化データ。駐車場・支払いは本文とFAQ"],
              ["ペット保険の窓口精算", "窓口で精算できる保険会社の名前（対応していなければその旨）", "FAQ"],
            ],
            caption: "項目は目安です。実際に行っていることだけを、今の内容で書きます。変わったら本文・構造化データ・Googleビジネスプロフィール・予約サイトを同じ日に直します。",
          },
          after: [
            "書くときのコツは、AIがそのまま答えに使える一文にすることです。「エキゾチックアニマルも相談ください」より「うさぎ・フェレット・ハムスターを診療しています。小鳥と爬虫類は診ていません」のほうが、どの質問の答えにも使えます。診ない動物や対応しない時間をはっきり書くと、AIが間違って案内する可能性も下がります。",
          ],
        },
        {
          heading: "構造化データの型：VeterinaryCareの注意点",
          paragraphs: [
            `schema.orgには動物病院を表す[VeterinaryCare](${SRC.vetCare})という型があります。注意したいのは、この型の位置です。VeterinaryCareは[MedicalOrganization](${SRC.medOrg})（医療の組織）の下にあり、歯科（Dentist）や診療所（Physician）とは違って、[LocalBusiness](${SRC.localBusiness})（実店舗のある事業者）の下には入っていません（2026年11月13日に、schema.orgの語彙から生成されたschema-dts 2.1.0の型定義で確認）。営業時間（openingHoursSpecification）は、本来は場所（Place。LocalBusinessはその一種）のプロパティです。`,
            `Googleのローカルビジネスの構造化データのドキュメントは、LocalBusinessのうちできるだけ具体的な種類を使うよう案内しています（2026年10月29日確認）。[Google：ローカルビジネスの構造化データ](${SRC.googleLocal})。動物病院には、LocalBusinessの下に専用の種類がありません。そのため、どの書き方にも一長一短があります。`,
          ],
          table: {
            head: ["書き方", "伝わること", "注意点"],
            rows: [
              ["VeterinaryCare", "動物病院であること", "LocalBusinessの種類ではないため、営業時間などの場所の情報は型の定義の外になる"],
              ["VeterinaryCareとLocalBusinessの両方（JSON-LDで型を2つ書く）", "動物病院であることと、来院できる場所であること", "手書きのJSON-LDやプラグインが型を複数書ける場合の方法。Googleでの表示が約束されるわけではない"],
              ["LocalBusiness だけ", "来院できる事業者であること", "動物病院であることは構造化データからは伝わらない。本文と説明で補う"],
            ],
            caption: "どれを選んでも、本文に診療対象・時間・場所が文字で書かれていることが前提です。構造化データは本文の事実を機械向けに書き直したもので、本文にない事実を足すものではありません。",
          },
          after: [
            "Nurevo AEOの業種の欄は、型を1つ入れる形です。動物病院であることをAIにはっきり伝えるために、この記事ではVeterinaryCareを入れる方法を紹介します。住所・電話番号・営業時間は、その型の情報として出力されます。",
          ],
        },
        {
          heading: "獣医療の広告のルールとAI向けの文章",
          paragraphs: [
            `動物病院の広告は、獣医療法第17条とその指針（獣医療広告ガイドライン）で、広告できる事項が限られています。2024年4月1日からは、省令の改正（令和5年農林水産省令第52号）で、獣医師の専門性の認定、高度な検査・手術その他の治療、寄生虫病の予防、マイクロチップの装着、獣医師の役職と略歴、愛玩動物看護師が勤務していることなどが広告できるようになりました。新たに広告できるようになった技能・療法を広告するときは、問い合わせ先、通常必要な診療の内容、主なリスクや副作用、費用をあわせて示すこととされています。[愛知県：獣医療に関する広告制限の改正](${SRC.aichi})／[熊本県](${SRC.kumamoto})`,
            `病院のホームページそのものは、指針（平成26年11月25日改正版）では原則として獣医療法上の広告とはみなされないとされています。ただし、検索連動型の広告やバナー広告のように、誘引性・特定性・認知性の3つの要件を満たすものは広告として扱われます。また同じ指針は、比較広告や誇大広告を禁じ、景品表示法などほかの法律も適用されるとしています。[獣医療広告ガイドライン（沖縄県掲載のPDF）](${SRC.guideline})。指針は2024年にも改正されているため、最新の本文は[農林水産省のページ](${SRC.maff})で確認してください。`,
            "AI向けに文章を足すときも、「地域No.1」「どこよりも安全な手術」のような比較や誇張の表現、根拠のない効果の表現は入れないでください。AIは本文の言い回しをそのまま答えに使うことがあり、同じ文章が広告に転用されることもあります。AIが答えに使いやすいのは、診療対象・時間・設備・費用といった確かめられる事実のほうです。",
          ],
        },
        {
          heading: "WordPressの動物病院サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEO・SEO SIMPLE PACK・VK All in One Expansion Unitはそのまま使えます。`,
            "初回の設定ウィザードで「クリニック・歯科」を選びます。そのあと設定画面の「業種（schema.org型）」にVeterinaryCareと入力します。VeterinaryCareは「クリニック・歯科」の仲間として扱われるので、あとでウィザードを開き直しても型は保たれます。",
            "病院名・住所・電話番号・診療時間・説明を確認します。診療時間は「9:00-12:00, 16:00-19:00、水曜定休」のような一般的な書き方なら構造化データの営業時間として出力され、ウィザードで公開される形を読み上げて確認できます。読み取れない書き方は推測されず、入力したまま出力されます。受付終了の時刻と夜間の対応は、説明と本文に書きます。",
            "説明（description）には、診療対象の動物と特徴を1〜2文で書きます。例：「◯◯駅徒歩5分の動物病院。犬・猫・うさぎ・フェレットを診療。予約制、駐車場6台。夜間は◯◯動物医療センターをご案内しています。」",
            "設定画面で、一般診療・予防接種・健康診断・歯科・往診などをサービスとして1つずつ登録します。サービス名・説明・ページのURL・カテゴリ・所要時間（分）を入れ、予約ページがあれば予約URLに入れます。料金は決まった金額を公開しているものだけ入れます（空欄なら料金は出力されません）。サービスは病院に紐づいたServiceとして出力され、llms.txtにも1行ずつ載ります。",
            "よくある質問（診療対象の動物、予約なしで行けるか、夜間・休日に具合が悪くなったとき、駐車場、支払い方法、保険の窓口精算）を入力し、FAQを見せたいページにNurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。",
            "AEOスコアの画面で診断を実行し、チェックリストに出た不足をワンクリック修正で直します。構造化データ・llms.txt・AIクローラの許可は無料プランで出力されます。",
            "外からどう見えるかを[無料のAI可読性チェック](/check)で確認し、Googleビジネスプロフィールや予約サイトの診療時間・休診日と一致しているかも見直します。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の病院情報の構造化データを出さず、足りない住所・電話番号・診療時間・VeterinaryCareの種類・サービスだけを追加します。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/guide/local-business-schema-seo-plugins)を参照してください。",
            `OpenAIは、OAI-SearchBotを拒否したサイトはChatGPTの検索回答に表示されないとしています（2026年10月31日確認）。[OpenAI：クローラの概要](${SRC.openaiBots})。robots.txtやセキュリティ系のプラグインで、気づかずに止めていないかを確認します。`,
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "診療対象の動物が、診ない動物も含めて文字で書かれている。",
            "診療時間・受付終了の時刻・休診日が、画像ではなく文字で書かれている。",
            "夜間・休日・救急の対応が書かれ、対応しない場合の案内先がある。",
            "病院名・住所・電話番号・診療時間が、サイト・Googleビジネスプロフィール・予約サイトで一致している。",
            "構造化データの業種が、LocalBusinessやMedicalBusinessのままではなくVeterinaryCareになっている（または、その選択の理由を決めている）。",
            "構造化データの診療時間が、ページに見えている診療時間と同じ。",
            "比較・誇張の表現や根拠のない効果の表現が、本文にも構造化データにも入っていない。",
            "llms.txtに、病院の概要・診療対象・診療時間・予約・アクセス・よくある質問のページが載っている。[llms.txtとは](/guide/llms-txt)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、飼い主が聞きそうな質問（地域＋動物の種類＋曜日や時間＋診療内容）を、病院名を入れずにAIに投げて、自分の病院が名前やURLで出てくるかを見ます。あわせて「◯◯動物病院はうさぎを診ていますか？日曜は開いていますか？」と病院名で聞き、答えが今の事実と合っているかも確かめます。間違っていたら、AIが出典にしたページを見て、そのページや外部の掲載情報を直します。AIの回答は回ごとに変わるので、同じ質問を何度か、期間をあけて記録します。手順と記録表は[AIでの登場率の測り方](/guide/measure-ai-visibility)に、GoogleのAI機能での表示回数は[Search Consoleの見方](/guide/search-console-ai-features)にまとめています。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（病院名は含めません）をPerplexityに投げ、回答に病院の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に病院が出る割合を競合と比べて推移で見られます（現在の計測先はPerplexity、ChatGPTは設定され次第）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "動物病院のAI検索対策は、何から始めればいいですか？", a: "診療対象の動物（診ない動物も）、診療時間と受付終了、休診日、夜間・救急の対応、予約の方法を、ページ本文に文字で正しく書くことからです。そのうえで同じ事実を構造化データとllms.txtで公開し、Googleビジネスプロフィールや予約サイトと値をそろえます。" },
        { q: "動物病院に合う構造化データの型は何ですか？", a: "schema.orgにはVeterinaryCareという型があります。ただしこの型はLocalBusinessの下ではなくMedicalOrganizationの下にあるため、営業時間などの場所の情報は型の定義の外になります。動物病院であることを伝えるならVeterinaryCare、型を複数書けるならVeterinaryCareとLocalBusinessの両方、という選び方があります。どれでも本文に事実が書かれていることが前提です。" },
        { q: "うさぎや小鳥などを診ていることは、どう伝えればいいですか？", a: "構造化データには診療対象の動物を書く専用の項目がないので、説明文・サービス・よくある質問・本文に「うさぎ・フェレットを診療しています。小鳥は診ていません」のように具体的に書きます。診ない動物も書くと、AIが間違って案内しにくくなります。" },
        { q: "夜間診療をしていない場合も書いたほうがいいですか？", a: "はい。「夜間は◯◯動物医療センターをご案内しています」のように、対応しないことと案内先を書きます。夜間の質問は急ぎのことが多く、AIが開いていない病院を案内すると飼い主が困るためです。" },
        { q: "AI向けに「地域No.1」などの表現を足してもいいですか？", a: "避けてください。獣医療広告ガイドラインは比較広告や誇大広告を禁じており、景品表示法も適用されます。AIが答えに使いやすいのは、確かめられる事実のほうです。表現の可否は、農林水産省の最新の指針や都道府県の担当窓口で確認してください。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種（VeterinaryCare）・住所・診療時間・サービス・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）です。[WordPress.orgのNurevo AEO](${WP_ORG})` },
        { q: "対策すればChatGPTに病院が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが病院の事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが病院のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },
    en: {
      title: "AI Search for Vet Clinics: Species, Hours, After-Hours Care | Nurevo",
      description: "AI search for vet clinics: publish the species you treat, hours, after-hours care and booking in text and structured data. The VeterinaryCare caveat and WordPress steps.",
      h1: "AI search for veterinary clinics: getting AI to read the species you treat, your hours and your after-hours care correctly",
      lead: "AI search optimization (AEO) for a veterinary clinic or animal hospital comes down to publishing the facts pet owners ask about — which species you treat, your hours and last check-in time, how you handle nights, weekends and emergencies, whether you take appointments or walk-ins, parking and payment — accurately and consistently, in the text of your pages and in structured data (schema.org's VeterinaryCare). Two things set clinics apart in AI answers more than anything else: stating plainly which animals you see (and which you don't), and saying what happens after hours, including where you send people when you're closed.",
      intro: [
        "Written November 13, 2026 (JST). Facts about schema.org, Google, OpenAI and Japanese regulation were checked on the dates given in the text. Veterinary advertising rules differ by country; check the rules of your own veterinary regulator.",
        "AI answers vary by day and by how a question is phrased. The steps here make your clinic's facts easy for AI to read correctly. They cannot guarantee that you appear in an AI answer or rank in any position.",
      ],
      sections: [
        {
          heading: "What pet owners ask AI",
          paragraphs: [
            "When someone asks ChatGPT, Perplexity or Google's AI Overviews to find a vet, the AI reads what it can find on the web and answers with a few clinic names. The questions are rarely just \"vet near me\". They look like \"a vet in [town] that sees rabbits\", \"which animal hospital is open on Sunday evening\", \"where can I get my cat's teeth cleaned\" or \"a vet with parking near the station\". Species, day and time, the service and how easy the clinic is to get to are all in the question.",
            "The big difference from a human dental or medical practice is that the species narrows the list first. Some clinics see only dogs and cats, some also see rabbits, ferrets, birds or reptiles, and some see only cats. Owners want to know that before anything else. Yet on many clinic websites the species appear only in a banner image, or not at all. AI is poor at filling in what isn't written, so a clinic that never says \"we see rabbits\" is easy to leave out of a \"vet for rabbits\" answer.",
            `The other is after-hours care. These questions are often asked when an animal is unwell, and a wrong answer costs more here than anywhere. Google says there are no extra requirements or special structured data for appearing in AI Overviews or AI Mode, and that the usual SEO basics apply: structured data should match the visible text, and your Business Profile should be up to date (checked November 12, 2026). [Google: AI features and your website](${SRC.googleAi}). The work is not a trick; it is getting your clinic's facts right and keeping them that way.`,
            `Independent clinics have reason to care. A June 2026 news report cited findings attributed to 5W Public Relations that a few large chains received a large share of veterinary recommendations in AI answers and that most independent practices tested showed little presence. The report did not publish its method or sample, so treat the figures as indicative only. [myVETcandy, June 14, 2026](${SRC.vetCandy})`,
          ],
        },
        {
          heading: "The facts to publish, and how to write them",
          paragraphs: [
            "The table lists what to write as text on your site so AI can answer owners' questions. The right-hand column shows where each fact goes in structured data or in Nurevo AEO.",
          ],
          table: {
            head: ["Fact", "How to write it", "Structured data and settings"],
            rows: [
              ["Species you treat", "\"Dogs, cats, rabbits and ferrets. We do not see birds or reptiles.\" Say what you don't treat, too", "No dedicated property, so use the description, services, FAQ and page text"],
              ["Hours and last check-in", "\"9:00–12:00 (last check-in 11:30) and 16:00–19:00; closed Wednesdays and public holidays\"", "Opening hours (openingHoursSpecification); last check-in in the text and FAQ"],
              ["How to book", "Appointment or first-come, the booking phone number and page, and whether walk-ins are seen", "Booking URL on services; FAQ"],
              ["Nights, weekends, emergencies", "The hours and conditions you cover. If you don't, say \"Outside our hours, we refer you to [emergency hospital]\"", "Text and FAQ; don't include hours you don't cover in your opening hours"],
              ["House calls", "Whether you do them, the area and how to book", "A service"],
              ["Departments", "General practice, dermatology, dentistry, ophthalmology and so on", "One service each"],
              ["Prevention and check-ups", "Vaccinations, parasite prevention, health checks, microchipping", "Services"],
              ["Equipment", "The diagnostic equipment you have (CT, ultrasound) and where you refer for tests you can't do", "Page text; check advertising rules before reusing it in ads"],
              ["Getting there", "Address, nearest station, number of parking spaces, payment methods", "Address and phone in structured data; parking and payment in text and FAQ"],
              ["Pet insurance", "Which insurers you can bill directly, or that owners claim themselves", "FAQ"],
            ],
            caption: "A starting list. Write only what you actually do, as it is today. When something changes, update the page, structured data, Google Business Profile and booking sites on the same day.",
          },
          after: [
            "Write each fact as a sentence an AI could lift straight into an answer. \"Exotic pets welcome, please ask\" helps less than \"We treat rabbits, ferrets and hamsters. We do not treat birds or reptiles.\" The second answers more questions, and stating what you don't do lowers the chance that AI sends someone to you by mistake.",
          ],
        },
        {
          heading: "Structured data type: a caveat about VeterinaryCare",
          paragraphs: [
            `schema.org has a type for vets: [VeterinaryCare](${SRC.vetCare}). What's worth knowing is where it sits. VeterinaryCare is a subtype of [MedicalOrganization](${SRC.medOrg}). Unlike Dentist or Physician, it is not under [LocalBusiness](${SRC.localBusiness}), the type for businesses with a physical place (checked November 13, 2026 against the type definitions in schema-dts 2.1.0, which is generated from the schema.org vocabulary). Opening hours (openingHoursSpecification) are a property of a Place, and LocalBusiness is a kind of Place.`,
            `Google's local business structured data documentation asks you to use the most specific LocalBusiness subtype you can (checked October 29, 2026). [Google: Local business structured data](${SRC.googleLocal}). There is no veterinary subtype under LocalBusiness, so each option has a trade-off.`,
          ],
          table: {
            head: ["Option", "What it says", "Trade-off"],
            rows: [
              ["VeterinaryCare", "This is a veterinary clinic", "Not a LocalBusiness type, so place facts like opening hours fall outside the type's definition"],
              ["Both VeterinaryCare and LocalBusiness (two types in JSON-LD)", "A veterinary clinic that people can visit", "Works where you write JSON-LD by hand or a plugin accepts more than one type; no display in Google is promised"],
              ["LocalBusiness only", "A business people can visit", "Structured data no longer says it's a vet; the description and page text must carry that"],
            ],
            caption: "Whichever you pick assumes the page text already states the species, hours and location. Structured data restates the page's facts for machines; it does not add facts the page lacks.",
          },
          after: [
            "Nurevo AEO's business type field takes one type. To make it clear to AI that you are a vet, this guide shows how to enter VeterinaryCare. Your address, phone number and opening hours are then published on that node.",
          ],
        },
        {
          heading: "Advertising rules and text written for AI",
          paragraphs: [
            "Veterinary advertising is regulated in many countries, and AI-friendly copy is still copy. Avoid comparisons and superlatives (\"the best vet in town\", \"safer surgery than anywhere else\") and outcome claims you can't support. AI tends to reuse your wording, and the same text often ends up in ads. What AI can actually use in an answer is the checkable facts: species, hours, equipment and costs.",
            `In Japan, for example, the Veterinary Practice Act (Article 17) and its guideline limit what a clinic may advertise. A 2024 revision, in force from April 1, 2024, widened the list, and for the newly allowed items it asks clinics to show the enquiry contact, the usual treatment involved, the main risks or side effects and the cost alongside. [Aichi Prefecture (Japanese)](${SRC.aichi}). The guideline (as revised in 2014) treats a clinic's own website as in principle not an advertisement under the Act, but search ads and banner ads can be, and it bans comparative and exaggerated advertising. [Guideline PDF (Japanese)](${SRC.guideline}). Clinics elsewhere should check their own regulator's rules before publishing.`,
          ],
        },
        {
          heading: "Setting it up on a WordPress vet clinic site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit keep working as they are.`,
            "In the setup wizard, choose \"Clinic or dental\". Then, in Settings, enter VeterinaryCare in \"Business type (schema.org type)\". VeterinaryCare counts as part of the \"Clinic or dental\" group, so reopening the wizard later keeps the type.",
            "Check the clinic name, address, phone, hours and description. Hours written in a common form, like \"9:00-12:00, 16:00-19:00, closed Wednesday\", are published as opening hours in structured data, and the wizard reads them back as they will be published. Hours it can't read are not guessed; they are published as you typed them. Put your last check-in time and after-hours arrangements in the description and the page text.",
            "In the description, say which species you treat and what's distinctive, in one or two sentences. For example: \"Animal hospital five minutes from [station]. We treat dogs, cats, rabbits and ferrets. By appointment; parking for six cars. After hours we refer to [emergency hospital].\"",
            "In Settings, add general consultations, vaccinations, health checks, dentistry, house calls and so on as services, one at a time. Enter the name, description, page URL, category and duration in minutes, and your booking page as the booking URL. Enter a price only where you publish a fixed one (with the price empty, no price is published). Each service is published as a Service tied to your clinic and appears as a line in llms.txt.",
            "Add FAQs (which species you treat, whether walk-ins are seen, what to do if your pet is unwell at night or on a holiday, parking, payment, insurance billing) and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on the page where they should appear.",
            "Run the check on the AEO score screen and fix what the checklist shows with one-click fixes. Structured data, llms.txt and AI crawler rules are output on the free plan.",
            "See how your site looks from outside with the [free AI readability check](/check), and confirm your hours and closed days match your Google Business Profile and any booking sites.",
          ],
          after: [
            "Alongside an SEO plugin, Nurevo AEO does not publish a second clinic node. It adds only what is missing from the SEO plugin's graph: address, phone, hours, the VeterinaryCare type and your services. See [adding local business details to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins).",
            `OpenAI says sites that block OAI-SearchBot will not appear in ChatGPT search answers (checked October 31, 2026). [OpenAI: Overview of crawlers](${SRC.openaiBots}). Make sure robots.txt or a security plugin isn't blocking it without you knowing.`,
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "The species you treat, including those you don't, are written as text.",
            "Hours, last check-in time and closed days are text, not an image.",
            "After-hours and emergency arrangements are stated, with a referral if you don't cover them.",
            "Clinic name, address, phone and hours match across your site, Google Business Profile and booking sites.",
            "The structured data type is VeterinaryCare rather than a leftover LocalBusiness or MedicalBusiness (or you have decided on another option for a reason).",
            "The hours in structured data match the hours shown on the page.",
            "No comparisons, superlatives or unsupported outcome claims in the text or in structured data.",
            "llms.txt lists your overview, species, hours, booking, directions and FAQ pages. [What is llms.txt](/guide/llms-txt)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, ask AI the questions owners would ask (area + species + day or time + service), without your clinic's name, and see whether your clinic comes up by name or URL. Then ask by name — \"Does [clinic] see rabbits? Is it open on Sunday?\" — and check the answer against today's facts. If it's wrong, look at which page the AI cited and fix that page or the outside listing. AI answers change from one run to the next, so ask the same questions several times, spaced out, and keep a record. The steps and a log template are in [how to measure AI visibility](/guide/measure-ai-visibility), and impressions in Google's AI features in [the Search Console guide](/guide/search-console-ai-features).",
            "On the Free and Standard plans, Nurevo AEO asks Perplexity three questions built from your business type and area (never your clinic's name) once a month and records whether your clinic or site appeared. The Pro plan (from $99/month) adds AI visibility measurement in beta: the share of AI answers your clinic appears in, compared with competitors over time (measured on Perplexity today, ChatGPT once configured). Both look at a sample of answers, not every answer.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a vet clinic start with AI search?", a: "Write the species you treat (and those you don't), your hours and last check-in, closed days, after-hours arrangements and how to book as text on your pages. Then publish the same facts in structured data and llms.txt, and make them match your Google Business Profile and booking sites." },
        { q: "Which structured data type fits a vet clinic?", a: "schema.org has VeterinaryCare. It sits under MedicalOrganization, not LocalBusiness, so place facts such as opening hours fall outside its definition. Use VeterinaryCare to say you are a vet, or both VeterinaryCare and LocalBusiness where you can publish two types. Every option assumes the facts are on the page." },
        { q: "How do I show that we treat rabbits or birds?", a: "There is no structured data property for the species a clinic treats, so write it in the description, services, FAQ and page text: \"We treat rabbits and ferrets. We do not treat birds.\" Saying what you don't treat makes it less likely AI sends the wrong owners to you." },
        { q: "Should we say so if we don't offer after-hours care?", a: "Yes. Say you don't, and where you refer people: \"Outside our hours we refer to [emergency hospital].\" After-hours questions are often urgent, and an AI answer that sends an owner to a closed clinic does real harm." },
        { q: "Can we add \"best vet in town\" for AI?", a: "Avoid it. Veterinary advertising rules in many countries restrict comparative and exaggerated claims, and AI can use checkable facts far more than slogans. Check your regulator's rules before publishing such wording." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type (VeterinaryCare), address, hours, services and FAQ structured data, llms.txt, AI crawler rules and the AEO score are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
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
