// Content page: AI search (AEO) for tutoring schools / cram schools (学習塾). Industry page.
//
// Written 2026-11-12 (JST). Every claim about Nurevo AEO is one the plugin's
// readme makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt)
// or its code: the setup wizard has no education card, "Other" keeps a type of
// the owner's own (includes/setup-wizard.php); Settings has a free "Business
// type (schema.org type)" field and EducationalOrganization / School are in the
// recognised type list (nurevo-webmcp.php, webmcp_canary_local_business_types);
// each service takes a name, duration (minutes), price, currency, category,
// booking URL and description, published as a Service with an Offer, a
// ReserveAction and an llms.txt line. Nurevo does not publish Course nodes.
// Pro measurement runs on Perplexity (docs/pro-measurement-implementation.md).
//
// Outside facts, checked 2026-11-12 on the primary pages linked in the copy:
// - Google "AI features and your website" (updated 2025-12-10): no special
//   schema.org markup needed; structured data should match the visible text.
// - Google AI optimization guide (updated 2026-07-10): structured data isn't
//   required for generative AI search; Google Search doesn't use llms.txt.
// - Google blog 2025-06-12 "Simplifying the search results page": Course Info
//   among seven features phased out. The Course list doc is still published.
// - Google structured data general guidelines: markup must represent the page.
// - schema.org: EducationalOrganization is a subtype of Organization and of
//   CivicStructure, not of LocalBusiness; no tutoring-specific type. Course,
//   CourseInstance (courseMode, courseSchedule, courseWorkload, instructor),
//   hasCourseInstance, educationalLevel, provider.
// - CAA 特定商取引法ガイド 特定継続的役務提供: 学習塾 over 2 months and over
//   ¥50,000; documents, 8-day cooling-off, cancellation caps (¥11,000 before;
//   after: delivered services + the lower of ¥20,000 or one month's tuition).
// - CAA No.1 display report 2024-09-26: four conditions; image surveys of
//   non-users are a problem; juku/yobiko advertisers were interviewed.
// - JFTC press release 2023-03-02: order against an individual-tutoring
//   school's hourly tuition display (misleading as to price).
// - Consumer Commission material 2011-11-24: 2011-04-26 orders over university
//   pass records that counted students of other schools.
// Re-check these when you update the page, and update the date with them.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleAiGuide: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide",
  googleSimplify: "https://developers.google.com/search/blog/2025/06/simplifying-search-results",
  googleCourse: "https://developers.google.com/search/docs/appearance/structured-data/course",
  googlePolicies: "https://developers.google.com/search/docs/appearance/structured-data/sd-policies",
  eduOrg: "https://schema.org/EducationalOrganization",
  course: "https://schema.org/Course",
  courseInstance: "https://schema.org/CourseInstance",
  tokushoho: "https://www.no-trouble.caa.go.jp/what/continuousservices/",
  no1: "https://www.caa.go.jp/notice/entry/039459/",
  jftc2023: "https://www.jftc.go.jp/houdou/pressrelease/2023/mar/230302_chugoku_keihyou.html",
  cao2011: "https://www.cao.go.jp/consumer/iinkai/2011/074/doc/074_111124_shiryou2-2-1.pdf",
};

export default {
  slug: "tutoring-school-ai-search",
  targetQueries: [
    "AI search optimization for tutoring centers",
    "tutoring business ChatGPT visibility",
    "schema markup for tutoring center",
    "学習塾 AI検索対策",
    "塾 ChatGPT 集客 対策",
    "学習塾 構造化データ",
  ],
  related: ["local-business-schema-seo-plugins", "measure-ai-visibility", "llms-txt", "appear-in-chatgpt", "hair-salon-ai-search"],
  locales: {
    ja: {
      title: "学習塾のAI検索対策：コース・料金・体験授業をAIに伝える | Nurevo",
      description: "学習塾のAI検索対策は、対象学年・コース・授業形式・料金の総額・時間割・体験授業・校舎をページ本文と構造化データで正確に公開することから。型の選び方、特定商取引法と合格実績の注意、手順を解説。",
      h1: "学習塾のAI検索対策：対象学年・コース・料金・体験授業をAIに正しく読ませる手順",
      lead: "学習塾のAI検索対策（AEO）の中心は、対象学年・コース・授業形式（集団・個別・オンライン）・料金の総額・時間割・体験授業の申し込み方法・校舎の場所を、ページ本文と構造化データで正確に、矛盾なく公開することです。「◯◯駅の近くで中学生の数学を個別に見てくれる塾」「月謝はいくらくらい？」といった保護者や生徒の質問に、AIが推測せずに答えられる材料をそろえます。合格実績や「No.1」の表示は、AIに強く見せる材料ではなく、根拠を示せる範囲で正確に書くものです。",
      intro: [
        "作成日：2026年11月12日（JST）。Google・schema.org・消費者庁・公正取引委員会の情報は、この日に各公式ページで確認したものです。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが塾の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。法律の扱いは一般的な説明で、個別の判断は専門家や所管の窓口に確認してください。",
      ],
      sections: [
        {
          heading: "保護者と生徒はAIに何を聞いているか",
          paragraphs: [
            "塾を探す質問は、地域・学年・科目・目的・形式・曜日・料金が組み合わさるのが特徴です。たとえば「◯◯駅の近くで、中2の数学が苦手な子を個別に見てくれる塾」「高校受験の集団塾と個別指導の違いと料金の目安」「部活が終わった後の20時から通える塾」「オンラインで英検の対策ができる塾」のような聞き方です。ChatGPT、Perplexity、GoogleのAIによる概要などは、ウェブ上の情報を読んでこうした質問に答えをまとめます。",
            "AIが答えに使えるのは、文字として読めて、ほかの情報と食い違わない事実です。料金表が画像だけ、「料金はお問い合わせください」だけで目安がない、校舎ページごとに授業時間が違う、体験授業の申込ページへのリンクがない、という状態では、AIはあなたの塾を答えに使いにくく、使ったとしても不正確な説明になりやすくなります。チェーン塾の情報ばかりが答えに出る地域ほど、個人塾が自分の事実をはっきり書いておく意味があります。",
          ],
        },
        {
          heading: "AIに読ませたい事実の一覧",
          paragraphs: [
            `次の項目を、まずページ本文に書きます。構造化データはそのあと、同じ内容を機械が読みやすい形で添えるものです。Googleは、AIによる概要やAIモードに表示されるための特別な構造化データは不要で、構造化データはページに見えている文章と一致させるよう求めています（[Google：AI機能とウェブサイト](${SRC.googleAi})）。`,
          ],
          table: {
            head: ["項目", "書き方の例", "置き場所"],
            rows: [
              ["対象", "小学4年〜高校3年、既卒生は対象外、など", "トップ・コース一覧"],
              ["コースと目的", "高校受験・大学受験・定期テスト対策・英検対策・不登校の生徒の学習支援", "コースごとのページ"],
              ["授業形式", "集団（1クラス最大12人）・個別（講師1人に生徒2人まで）・オンライン", "コースごとのページ"],
              ["科目と1回の時間", "数学・英語、1回80分、週1回から", "コースごとのページ"],
              ["料金の総額", "入塾金・月謝（税込）・教材費・季節講習・模試代・システム費。総額の例も", "料金ページ"],
              ["時間割と休み", "曜日ごとの授業時間、自習室の開放時間、休校日", "校舎ページ"],
              ["体験授業・面談", "無料かどうか、回数、所要時間、申込URL", "体験授業ページ"],
              ["校舎", "住所・最寄り駅と徒歩分数・電話・駐輪場", "校舎ページ"],
              ["講師と体制", "社員講師と学生講師の別、担当の決め方、面談の頻度", "講師・指導方針ページ"],
              ["実績", "集計の対象・年度・人数の数え方を添えた合格実績", "実績ページ"],
            ],
            caption: "料金は消費者に示す価格なので税込で書きます。季節講習などで総額が変わる場合は、何によって変わるかを書きます。",
          },
        },
        {
          heading: "構造化データの型：EducationalOrganization と Course",
          paragraphs: [
            `schema.org には「学習塾」専用の型はありません。塾そのものは [EducationalOrganization](${SRC.eduOrg})（教育機関）で表すのが近い選び方です。この型は Organization と CivicStructure（施設）の下位の型で、美容室や歯科医院が使う LocalBusiness の下位ではありません。住所・電話・営業時間などは書けますが、「LocalBusiness の店舗情報」として扱われるとは限らない点を知っておきましょう。地域の店舗として見せたい塾が LocalBusiness と EducationalOrganization の両方を書く例もありますが、どちらでも、ページに見えている事実と一致していることが前提です。`,
            `コースは [Course](${SRC.course}) で、名前・説明・提供者（provider）・対象（educationalLevel）・料金（offers）を書けます。曜日や時間、対面かオンラインかは、コースの開講単位である [CourseInstance](${SRC.courseInstance})（hasCourseInstance でつなぐ）の courseMode・courseSchedule・courseWorkload で表せます。`,
            `Googleの検索結果での扱いは変わってきています。Googleは2025年6月、コースの詳細を表示する「Course Info」を含む7つの表示を段階的に終了すると発表しました（[Google 検索セントラル ブログ、2025年6月12日](${SRC.googleSimplify})）。3つ以上のコースを並べる「コースリスト」の説明ページは2026年11月12日時点でも公開されています（[Google：コースリスト](${SRC.googleCourse})）が、表示される保証はありません。構造化データは「検索で目立つ飾り」ではなく、AIや検索エンジンに事実を誤解なく渡すための書き方だと考えるのが安全です。`,
          ],
        },
        {
          heading: "料金ページと特定商取引法：書き方がそのままAIの答えになる",
          paragraphs: [
            `日本の学習塾は、契約期間が2か月を超え、金額（入塾金・授業料・教材費などの合計）が5万円を超えると、特定商取引法の「特定継続的役務提供」にあたります。この場合、契約前の概要書面と契約後の契約書面の交付、契約書面を受け取ってから8日以内のクーリング・オフ、中途解約のルールがあります。中途解約で塾が請求できる額の上限は、授業開始前は1万1,000円、開始後は提供済みの授業料に加えて2万円か1か月分の授業料のいずれか低い額です。家庭教師は別の区分で上限も違います（[消費者庁 特定商取引法ガイド：特定継続的役務提供](${SRC.tokushoho})）。`,
            "AIに料金を聞かれたとき、月謝だけが読み取られると、保護者は「思っていたより高い」と感じます。料金ページには、月謝に加えて入塾金・教材費・季節講習・模試代など、年間でかかるものを並べ、学年とコースごとの総額の例を書いておきましょう。解約やクーリング・オフの説明ページがあれば、料金ページからリンクしておくと、AIが「途中でやめられるか」という質問にも事実で答えやすくなります。",
            `安く見せる書き方には注意が必要です。2023年3月2日には、個別指導塾の時間あたりの授業料などの表示が、実際より有利に見えるとして景品表示法の措置命令が出ています（[公正取引委員会 報道発表、2023年3月2日](${SRC.jftc2023})）。AIは表示をそのまま要約するので、誤解を招く表示はAIの答えでも誤解を広げます。`,
          ],
        },
        {
          heading: "合格実績と「No.1」：根拠を添えて書く",
          paragraphs: [
            `合格実績は保護者がよく聞く項目ですが、数え方を書かない数字は、AIにとっても保護者にとっても比べられない数字です。2011年には、ほかの塾の生徒や授業を受けていない生徒を含めた大学合格実績の表示に措置命令が出た例があります（[消費者委員会 資料、2011年11月24日](${SRC.cao2011})）。実績ページには「◯年度、在籍生◯人のうち」「講習のみの受講生は含まない」など、対象と数え方を必ず添えます。`,
            `「地域満足度No.1」のような表示も慎重に。消費者庁は2024年9月26日の報告書で、No.1表示に合理的な根拠があると言えるには、比較する対象・調査に答える人・調査の方法・表示と結果の一致が適切である必要があるとし、利用したことのない人にサイトの印象を聞くような調査をもとにした表示は問題となるおそれがあると示しました。この調査では学習塾・予備校の広告主にも聞き取りをしています（[消費者庁：No.1表示に関する実態調査報告書](${SRC.no1})）。AIは強い言葉より確かめられる事実を使うので、根拠を示せない表示は本文にも構造化データにも入れないのが安全です。`,
          ],
        },
        {
          heading: "WordPressの塾サイトで設定する手順",
          list: [
            `[WordPress.org](${WP_ORG}) から Nurevo AEO（無料）を入れて有効にします。Yoast SEO・Rank Math・All in One SEO・Slim SEO・SEO SIMPLE PACK・VK All in One Expansion Unit を使っていれば、そのまま残して構いません。`,
            "初期設定のウィザードには塾向けのカードがないので、「その他」を選びます。そのあと設定画面の「Business type (schema.org type)」に EducationalOrganization と入力します。Nurevo AEO はこの型を事業者の型として扱い、塾名・住所・電話・授業時間・説明を出します。空欄の項目だけが既存の設定から補われ、入力済みの内容は上書きされません。",
            "設定画面の「サービス」に、コースを1つずつ登録します。コース名・1回の時間（分）・料金・通貨・カテゴリー（例：高校受験）・申込URL（体験授業の申込ページ）・説明を入れると、塾に結びついた Service として、料金は Offer、申込URLは予約のアクションとして出され、llms.txt にもコースの行が載ります。料金は数字だけで入力し、説明には月謝なのか1回あたりなのかを書きます。",
            "Nurevo AEO が出すのは Service で、Course や CourseInstance は出しません。コースを Course として書きたい場合は、テーマやほかのプラグイン、手書きの JSON-LD で足し、同じコースが別の内容で二重にならないようにします。",
            "よくある質問を入力し、Nurevo のFAQブロックまたは [nurevo_faq] ショートコードを表示したいページに置きます。「体験授業は無料ですか」「途中から入れますか」「振替はできますか」など、保護者が実際に聞く質問を選びます。",
            "AEOスコアの画面で診断を実行し、チェック表に出る修正を適用します。構造化データ、llms.txt、AIクローラ（OAI-SearchBot、PerplexityBot、Claude-SearchBot など）の許可は無料プランで使えます。",
            "外から見た状態を [無料のAI読み取りチェック](/check) で確かめ、授業時間や料金が Googleビジネスプロフィールや塾の比較サイトと一致しているかも見直します。",
          ],
          after: [
            `SEOプラグインが有効な場合、Nurevo AEO は構造化データを二重には出さず、足りない住所・電話・授業時間・型・コース（Service）だけを既存のデータに加えます。詳しくは [Yoast・Rank Math・AIOSEOに店舗の構造化データを追加する方法](/guide/local-business-schema-seo-plugins/) を参照してください。llms.txt はGoogle検索では使われないとGoogleは説明しています（[Google：AI検索向けの最適化ガイド](${SRC.googleAiGuide})）。ほかのAIツールが要点を読むための補助として、低い手間で置いておくものと考えてください。[llms.txtとは](/guide/llms-txt/)`,
          ],
        },
        {
          heading: "公開前のチェック表",
          list: [
            "対象学年・コース・授業形式・科目・1回の時間が、画像ではなく文字で書かれている。",
            "料金は税込で、入塾金・教材費・季節講習などを含む年間の総額の例がある。",
            "特定継続的役務提供にあたる場合、概要書面・クーリング・オフ・中途解約の説明ページがあり、料金ページからリンクしている。",
            "時間割・休校日・校舎の住所と最寄り駅が、サイト・Googleビジネスプロフィール・比較サイトで一致している。",
            "体験授業の条件（無料か、回数、所要時間）と申込ページへのリンクがある。",
            "合格実績に年度・対象・数え方が添えてあり、根拠を示せない「No.1」はない。",
            `構造化データの型・料金・時間がページの表示と一致している（[Google：構造化データの一般的なガイドライン](${SRC.googlePolicies})）。`,
          ],
        },
        {
          heading: "AIの答えに出ているかを確かめる",
          paragraphs: [
            "準備ができたら、保護者が聞きそうな質問（地域＋学年＋科目や目的＋形式）をAIに聞き、塾の名前やURLが出るか、料金や授業時間が正しく説明されているかを見ます。答えは毎回変わるので、同じ質問を日を空けて何回か聞き、記録をとります。新学期・夏期講習・受験直前など、問い合わせが増える時期の前に確かめると、直す時間がとれます。体験授業の申込フォームに「何で知りましたか」の選択肢として「AI（ChatGPTなど）」を足しておくと、AI経由の申し込みも数えられます。測り方の詳しい手順は [AIでの登場率の測り方](/guide/measure-ai-visibility/) にまとめています。",
            "Nurevo AEO の Free と Standard（月3,000円）には、月1回の確認があります。業種と地域から作った3つの質問（塾の名前は使いません）を Perplexity に聞き、答えに塾の名前やサイトが出たかを記録します。Pro（月14,800円〜）では、AIの答えにどのくらいの割合で出るか、競合との比較、推移を測るAI登場率の計測（ベータ、現在は Perplexity）が使えます。どちらも答えの一部を抜き出して見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "学習塾のAI検索対策は何から始めればいいですか？", a: "対象学年・コース・授業形式・料金の総額・時間割・体験授業・校舎の場所を、画像ではなく文字でページに正しく書くことからです。そのうえで同じ事実を構造化データとllms.txtで公開し、Googleビジネスプロフィールや比較サイトと一致させます。" },
        { q: "塾の構造化データはどの型を使えばいいですか？", a: "schema.orgに学習塾専用の型はないため、塾はEducationalOrganization、コースはCourseで表すのが近い選び方です。EducationalOrganizationはLocalBusinessの下位の型ではない点に注意してください。どの型でも、ページに見えている内容と一致させることが前提です。" },
        { q: "料金を「お問い合わせください」にしていても大丈夫ですか？", a: "AIは書かれていない料金を答えられないため、「料金が分からない塾」として扱われやすくなります。月謝・入塾金・教材費・講習費を税込で書き、学年とコースごとの年間の総額の例を載せるのがおすすめです。" },
        { q: "合格実績はAI検索で有利になりますか？", a: "実績はよく聞かれる情報ですが、数え方のない数字は比べられません。年度・対象・数え方を添えて正確に書いてください。他塾の生徒を含めるなど実際と違う表示は、景品表示法の問題になった例があります。" },
        { q: "Nurevo AEO は無料で使えますか？", a: `はい。事業者の型（EducationalOrganizationなど）、住所・授業時間・コース・FAQの構造化データ、llms.txt、AIクローラの設定、AEOスコアは無料プランで使えます。Standard（月3,000円）は常に最新のルール、Pro（月14,800円〜）はAI登場率の計測（ベータ）が加わります。[WordPress.org の Nurevo AEO](${WP_ORG})` },
        { q: "これでChatGPTに必ず塾が出るようになりますか？", a: "いいえ。AIの答えは変わるもので、表示や順位を保証できるツールや方法はありません。できるのは、事実をAIが読みやすい形で公開し、出ているかを確かめ続けることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まずは、塾のサイトがAIにどう読まれているかを確認",
        body: "無料チェックで、構造化データ・llms.txt・AIクローラの許可の状態が登録なしでわかります。WordPressなら Nurevo AEO で足りない部分を無料で補えます。",
        label: "無料でAI読み取りチェック",
        href: "/check",
        secondary: { label: "WordPress.org で Nurevo AEO を入れてみる（無料）", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit は各社の商標です。Nurevo はこれらの企業と提携していません。この記事は法律上の助言ではありません。",
    },
    en: {
      title: "AI Search for Tutoring Centers: Courses, Fees, Trial Lessons | Nurevo",
      description: "Publish grades, courses, class format, full fees, timetables, trial lessons and locations in page text and structured data. Schema types, legal notes and WordPress steps.",
      h1: "AI search for tutoring centers and cram schools: get grades, courses, fees and trial lessons read correctly",
      lead: "AI search optimization (AEO) for a tutoring center comes down to publishing the grades you teach, your courses, the class format (group, one-to-one, online), the full cost, the timetable, how to book a trial lesson and where each location is, accurately and consistently, in your page text and in structured data. That gives ChatGPT, Perplexity and Google's AI features what they need to answer a parent's question such as \"a tutor near the station who can help my 8th grader with math one-to-one\" without guessing. Pass rates and \"No. 1\" claims are not a lever for AI; they are facts to state accurately, with their basis.",
      intro: [
        "Written November 12, 2026 (JST). Information from Google, schema.org and Japanese regulators was checked on their official pages on that date.",
        "AI answers vary from day to day and with how a question is asked. The steps here make your center's facts easy for AI to read correctly; they do not guarantee that you will appear in AI answers or rank higher. Legal points are general explanations, not legal advice; check the rules that apply where you operate.",
      ],
      sections: [
        {
          heading: "What parents and students ask AI",
          paragraphs: [
            "Questions about tutoring combine place, grade, subject, goal, format, time and price: \"a tutoring center near the station for an 8th grader who struggles with math, one-to-one\", \"group cram school versus private tutoring for high school entrance exams, and what each costs\", \"somewhere my child can go at 8 pm after club practice\", \"online test prep for an English exam\". ChatGPT, Perplexity and Google's AI Overviews read pages on the web and put answers together from them.",
            "AI can use only facts it can read as text and that do not contradict each other. If your fee table is only an image, if the only price information is \"contact us\", if class times differ between location pages, or if there is no link to the trial-lesson form, AI has little to work with, and anything it does say about you is more likely to be wrong. In areas where AI answers lean on large chains, an independent center has all the more reason to state its own facts clearly.",
          ],
        },
        {
          heading: "The facts to publish",
          paragraphs: [
            `Write the items below in your page text first. Structured data then adds the same facts in a form machines read easily. Google says there is no special schema.org markup needed to appear in AI Overviews or AI Mode, and asks that structured data match the text visible on the page. [Google: AI features and your website](${SRC.googleAi})`,
          ],
          table: {
            head: ["Item", "Example", "Where"],
            rows: [
              ["Who you teach", "Grades 4 to 12; adult learners not accepted", "Home page, course list"],
              ["Courses and goals", "High school entrance, university entrance, school test prep, English exam prep, support for students out of school", "One page per course"],
              ["Class format", "Group (up to 12 per class), one-to-one or one tutor to two students, online", "One page per course"],
              ["Subjects and lesson length", "Math and English, 80-minute lessons, from once a week", "One page per course"],
              ["Full cost", "Enrollment fee, monthly tuition, materials, seasonal courses, mock exams, other fees, plus a worked yearly total", "Fees page"],
              ["Timetable and closures", "Class times by weekday, study-room hours, closed days", "Location page"],
              ["Trial lesson or consultation", "Free or not, how many sessions, how long, booking link", "Trial page"],
              ["Location", "Address, nearest station and walking time, phone, bike or car parking", "Location page"],
              ["Tutors and support", "Professional or student tutors, how tutors are assigned, how often parents meet staff", "Tutors or approach page"],
              ["Results", "Exam results with the year, who is counted and how", "Results page"],
            ],
            caption: "Show prices the way local consumer rules require (in Japan, including tax). Where totals vary, for example with seasonal courses, say what they depend on.",
          },
        },
        {
          heading: "Structured data types: EducationalOrganization and Course",
          paragraphs: [
            `schema.org has no type specifically for tutoring centers. The closest fit for the center itself is [EducationalOrganization](${SRC.eduOrg}). It sits under Organization and under CivicStructure, not under LocalBusiness, which hair salons and dental clinics use. You can still give an address, phone and opening hours, but don't assume it is treated as a local business listing. Some centers that want to present themselves as a local business declare both LocalBusiness and EducationalOrganization; either way, the markup has to match the facts shown on the page.`,
            `Courses are described with [Course](${SRC.course}): a name, description, provider, educationalLevel and offers for the price. Days, times and whether a course is in person or online belong to a [CourseInstance](${SRC.courseInstance}), linked with hasCourseInstance, through courseMode, courseSchedule and courseWorkload.`,
            `How Google displays this has changed. In June 2025 Google announced it would phase out seven search features, including Course Info, which showed course details. [Google Search Central blog, June 12, 2025](${SRC.googleSimplify}). The documentation for the course list, which shows three or more courses side by side, is still published as of November 12, 2026 ([Google: Course list](${SRC.googleCourse})), but nothing guarantees it will be shown. It is safest to treat structured data not as decoration for search results but as a way to hand your facts to AI and search engines without ambiguity.`,
          ],
        },
        {
          heading: "Your fees page and consumer law: what you write is what AI repeats",
          paragraphs: [
            `Rules on tutoring contracts differ by country. In Japan, a tutoring-school contract that runs longer than two months and costs more than ¥50,000 in total (enrollment fee, tuition, materials and so on) is a "specified continuous service" under the Act on Specified Commercial Transactions. The school must give a summary document before the contract and a contract document after it; the customer can cool off within eight days of receiving the contract document; and if the customer cancels midway, the most the school can charge is ¥11,000 before lessons start, or, after they start, the fee for lessons already given plus the lower of ¥20,000 or one month's tuition. Home tutoring is a separate category with different caps. [Consumer Affairs Agency: specified continuous services (Japanese)](${SRC.tokushoho})`,
            "When AI is asked about price and picks up only the monthly tuition, parents feel misled later. List everything a year costs on your fees page, including enrollment, materials, seasonal courses and mock exams, and give a worked total by grade and course. If you have a page on cancellation and cooling-off, link to it from the fees page so AI can answer \"can we stop partway?\" with facts.",
            `Be careful with wording that makes prices look lower. On March 2, 2023, a Japanese order under the Act against Unjustifiable Premiums and Misleading Representations was issued over an individual-tutoring school's display of hourly tuition that made the price look more favorable than it was. [Japan Fair Trade Commission press release, March 2, 2023 (Japanese)](${SRC.jftc2023}). AI summarizes what you publish, so a misleading display spreads through AI answers too.`,
          ],
        },
        {
          heading: "Pass rates and \"No. 1\" claims: state the basis",
          paragraphs: [
            `Parents often ask about results, but a number without a counting method can't be compared, by parents or by AI. In 2011, orders were issued in Japan over university pass records that included students from other schools and students who had not taken the lessons. [Consumer Commission material, November 24, 2011 (Japanese)](${SRC.cao2011}). On your results page, always add who is counted, the year, and how, for example \"of N students enrolled in year X; students who took only seasonal courses are not included\".`,
            `Take care with claims such as \"No. 1 for satisfaction in the area\" as well. In a report of September 26, 2024, Japan's Consumer Affairs Agency said that a No. 1 claim needs an appropriate choice of what is compared, of who answers, of survey method, and a match between the claim and the results, and that claims based on surveys asking people who had never used a service for their impression of a website may be a problem. Tutoring and cram-school advertisers were among those interviewed. [Consumer Affairs Agency: report on No. 1 claims (Japanese)](${SRC.no1}). AI leans on facts it can check rather than strong words, so leave claims you can't support out of both your text and your markup.`,
          ],
        },
        {
          heading: "Setting it up on a WordPress tutoring site",
          list: [
            `Install Nurevo AEO (free) from [WordPress.org](${WP_ORG}) and activate it. Keep Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK or VK All in One Expansion Unit if you use one.`,
            "The setup wizard has no card for education, so choose \"Other\". Then, in Settings, enter EducationalOrganization in \"Business type (schema.org type)\". Nurevo AEO treats that type as your business and publishes your name, address, phone, class hours and description. Only blank fields are filled in from your existing settings; nothing you typed is overwritten.",
            "Under Settings, add each course as a service. With a course name, lesson length (minutes), price, currency, category (for example, high school entrance), booking URL (your trial-lesson form) and description, it is published as a Service linked to your center (the price as an Offer, the booking URL as a reservation action) and listed as a course line in llms.txt. Enter the price as digits only, and say in the description whether it is per month or per lesson.",
            "Nurevo AEO publishes Service, not Course or CourseInstance. If you want your courses marked up as Course, add it through your theme, another plugin or hand-written JSON-LD, and make sure the same course does not appear twice with different details.",
            "Enter your FAQ and place the Nurevo FAQ block or the [nurevo_faq] shortcode on the page where you want it shown. Pick the questions parents really ask: \"Is the trial lesson free?\", \"Can my child join mid-year?\", \"Can a missed lesson be rescheduled?\"",
            "Run the diagnosis on the AEO Score screen and apply the fixes the checklist offers. Structured data, llms.txt and AI crawler access (OAI-SearchBot, PerplexityBot, Claude-SearchBot and others) are all on the free plan.",
            "See what AI reads from the outside with the [free AI readability check](/check?lang=en), and confirm that class hours and fees match your Google Business Profile and any tutoring directories.",
          ],
          after: [
            `With an SEO plugin active, Nurevo AEO does not print a second set of structured data. It adds only the missing address, phone, hours, type and courses (as Service) to the graph your SEO plugin already publishes. See [adding local business schema to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins/). Google says Google Search doesn't use llms.txt ([Google: optimizing for AI search](${SRC.googleAiGuide})); treat it as a low-effort aid for other AI tools that read a summary of your site. [What is llms.txt?](/guide/llms-txt/)`,
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Grades, courses, class format, subjects and lesson length are written as text, not only shown in images.",
            "Prices are shown as local rules require, with a worked yearly total that includes enrollment, materials and seasonal courses.",
            "If your contracts fall under consumer rules like Japan's specified continuous services, there is a page on documents, cooling-off and cancellation, linked from the fees page.",
            "The timetable, closed days, address and nearest station match across your site, Google Business Profile and directories.",
            "Trial-lesson conditions (free or not, sessions, length) and a link to the booking form are on the page.",
            "Results state the year, who is counted and how, and there are no \"No. 1\" claims you can't support.",
            `Types, prices and times in structured data match what the page shows. [Google: general structured data guidelines](${SRC.googlePolicies})`,
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, ask AI the questions parents would ask (area plus grade plus subject or goal plus format) and see whether your center comes up by name or URL, and whether fees and class times are described correctly. Answers change between runs, so ask the same questions several times on different days and keep a record. Checking before busy periods, such as the new school year, summer courses or exam season, leaves time to fix things. Adding \"AI (ChatGPT and others)\" as an option to \"How did you hear about us?\" on your trial form lets you count enquiries that came through AI. The full method is in [how to measure AI visibility](/guide/measure-ai-visibility/).",
            "Nurevo AEO's Free and Standard ($20/month) plans include a monthly check: three questions built from your business type and area (never your center's name) are put to Perplexity, and the plugin records whether the answers named your center or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta: how often you appear in AI answers, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a tutoring center start with AI search?", a: "Write the grades you teach, your courses, class format, full cost, timetable, trial lesson and location correctly as text on your pages, not in images. Then publish the same facts as structured data and in llms.txt, and make sure they match your Google Business Profile and directory listings." },
        { q: "Which schema.org type should a tutoring center use?", a: "There is no tutoring-specific type, so EducationalOrganization for the center and Course for each course are the closest fit. Note that EducationalOrganization is not a subtype of LocalBusiness. Whatever type you choose, it must match what the page shows." },
        { q: "Is it fine to say \"contact us for prices\"?", a: "AI can't state a price you haven't published, so you are more likely to be treated as a center whose fees are unknown. Publish monthly tuition, enrollment, materials and seasonal course fees, and give a worked yearly total by grade and course." },
        { q: "Do pass rates help in AI search?", a: "Results are a common question, but a number without a counting method can't be compared. State the year, who is counted and how. In Japan, displays that counted students of other schools have led to regulatory orders." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type (EducationalOrganization and others), address, hours, courses and FAQ structured data, llms.txt, AI crawler rules and the AEO score are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee my center appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your tutoring center's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
