// Content page: AI search (AEO) for lesson studios and hobby classes
// (料理教室・音楽教室・書道・華道・茶道・手芸などの習い事教室、自宅教室を含む).
// Industry page. Gyms/yoga and cram schools have their own pages, so this one
// is about monthly fees, make-up lessons, trial lessons, instructors and the
// home-studio address question.
//
// Written 2026-11-17 17時 (JST). Every claim about Nurevo AEO is one the
// plugin's readme makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt,
// 0.9.2) or its source: the wizard "Other" card sets no type
// (includes/setup-wizard.php); with no type set the business node is a
// LocalBusiness when any of address, phone or hours is filled, and an
// Organization otherwise (nurevo-webmcp.php webmcp_canary_business_schema_type);
// the "Business type (schema.org type)" field takes any schema.org type name;
// services (up to 20) are published as Service + Offer + duration
// PropertyValue + ReserveAction with an llms.txt line. Pro measurement runs on
// Perplexity.
//
// Outside facts:
// - schema.org, checked in schema-dts 2.1.0 on 2026-11-17: no MusicSchool,
//   DanceSchool or similar type. EducationalOrganization extends Organization
//   and CivicStructure; its subtypes are CollegeOrUniversity, ElementarySchool,
//   HighSchool, MiddleSchool, Preschool and School; it is not in the
//   LocalBusiness union. Course and CourseInstance exist; CourseInstance has
//   courseMode ("online", "onsite", "blended"), courseSchedule, courseWorkload.
// - Kyoto Prefecture consumer centre page (updated 2025-04-30, read
//   2026-11-17): 特定継続的役務提供 covers 7 services (エステ・美容医療: over 1
//   month and over 50,000 yen; 外国語会話教室・家庭教師・学習塾・パソコン教室・
//   結婚相手紹介: over 2 months and over 50,000 yen). Cooling-off 8 days from
//   receipt of the contract document. Cooking and music classes are not listed.
// - Google "AI features and your website" (checked 2026-11-01 for
//   hair-salon-ai-search): no extra requirements or special markup for AI
//   features. Google LocalBusiness docs (checked 2026-10-29): name and address
//   required for the rich result. Not re-fetched this run (permission timeout).
// - National Tax Agency tax answer 6902 (checked 2026-11-01): advance price
//   displays to consumers must include consumption tax, any medium.
// Not verified this run, so not stated: Google Business Profile rules on hiding
// a home address, the current status of Google's Course info rich result, the
// CAA consumer-affairs page itself, and any figure on how people use AI to find
// classes. Re-check these when you update the page, and update the date.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  gbpGuidelines: "https://support.google.com/business/answer/3038177",
  educationalOrg: "https://schema.org/EducationalOrganization",
  courseInstance: "https://schema.org/CourseInstance",
  localBusiness: "https://schema.org/LocalBusiness",
  ntaTotal: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6902.htm",
  kyotoContinuous: "https://www.pref.kyoto.jp/shohise/15400050.html",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://example.jp/#business",
      "name": "ピアノ教室例（例）",
      "telephone": "+81-00-0000-0000",
      "url": "https://example.jp/",
      "openingHours": "Mo-Fr 14:00-20:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.jp/#nurevo-service-1",
      "name": "子どもピアノ 月3回×30分（月謝）",
      "category": "ピアノ",
      "provider": { "@id": "https://example.jp/#business" },
      "additionalProperty": {
        "@type": "PropertyValue", "name": "duration",
        "value": 30, "unitCode": "MIN", "unitText": "minutes"
      },
      "offers": { "@type": "Offer", "price": "0000", "priceCurrency": "JPY" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.jp/trial" },
        "result": { "@type": "Reservation", "name": "子どもピアノ 月3回×30分（月謝）" }
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
      "name": "Example Piano Studio",
      "telephone": "+1-000-000-0000",
      "url": "https://example.com/",
      "openingHours": "Mo-Fr 14:00-20:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.com/#nurevo-service-1",
      "name": "Children's piano, 3 x 30 min a month (monthly fee)",
      "category": "Piano",
      "provider": { "@id": "https://example.com/#business" },
      "additionalProperty": {
        "@type": "PropertyValue", "name": "duration",
        "value": 30, "unitCode": "MIN", "unitText": "minutes"
      },
      "offers": { "@type": "Offer", "price": "000", "priceCurrency": "USD" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.com/trial" },
        "result": { "@type": "Reservation", "name": "Children's piano, 3 x 30 min a month (monthly fee)" }
      }
    }
  ]
}`;

export default {
  slug: "lesson-studio-ai-search",
  targetQueries: [
    "music lessons AI search optimization",
    "piano teacher ChatGPT recommendations",
    "lesson studio schema markup",
    "習い事教室 AI検索対策",
    "ピアノ教室 ChatGPT 表示",
    "料理教室 AI検索 集客",
  ],
  related: ["photo-studio-ai-search", "person-profile-page-ai-search", "local-business-schema-seo-plugins", "llms-txt", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "習い事教室のAI検索対策：月謝・振替・体験・自宅教室 | Nurevo",
      description: "ピアノ・料理・書道などの習い事教室のAI検索対策は、月謝だけでなく1年の総額、振替と休会・退会のルール、体験レッスン、講師、教室の場所を本文に書くこと。自宅教室の住所の扱いと手順も解説。",
      h1: "習い事教室のAI検索対策：月謝の総額・振替ルール・体験レッスン・自宅教室の住所をAIに正しく読ませる手順",
      lead: "ピアノ・料理・書道・華道・手芸などの習い事教室のAI検索対策の中心は、生徒や保護者がAIに聞く「入会金と教材費を入れると1年でいくら？」「休んだら振替できる？」「自宅教室ってどこにあるの？」に、ページ本文で金額とルールを書いて答えることです。「月謝◯円〜」だけでは、AIは総額も通いやすさも答えられません。そのうえで同じ事実を構造化データ・llms.txt・Googleビジネスプロフィール・予約や教室ポータルの掲載とそろえます。",
      intro: [
        "作成日：2026年11月17日（JST）。schema.orgの型は同日に schema-dts 2.1.0 で確認しました。京都府消費生活安全センターのページは同日に確認（ページの更新日は2025年4月30日）。Googleと国税庁のページは2026年10月29日〜11月1日に確認した内容です。",
        "この記事は、料理・音楽・書道・華道・茶道・手芸・絵画など、大人や子どもが通う習い事教室向けです。学習塾とジム・ヨガスタジオは質問と法律の扱いが違うため、ここでは扱いません。AIの回答は日や聞き方によって変わります。この記事の対策は、AIが教室の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "生徒と保護者はAIに何を聞くか",
          paragraphs: [
            "習い事を探す質問は、ジャンル・地域・対象・通い方・お金の条件が重なった形になります。たとえば「◯◯駅の近くで、大人の初心者が月2回から通えるピアノ教室」「平日の夜に単発で参加できる料理教室」「5歳から通える書道教室で、親が見学できるところ」「振替ができて、月謝が7,000円くらいの教室」です。AIがこうした質問に教室の名前を挙げるには、その条件を満たすことがサイトの文字から読み取れる必要があります。",
            "Googleは、AI OverviewsやAI Modeに出るための追加の要件や特別な構造化データはなく、通常のSEOの基本と、本文と一致した構造化データ、最新のビジネスプロフィールが大切だとしています。[Google：AI features and your website](" + SRC.googleAi + ")。習い事教室のAI検索対策も、裏技ではなく、比べるときに使う数字とルールを正確に書くことが本体です。",
          ],
          table: {
            head: ["質問の型", "例", "答えに必要な事実"],
            rows: [
              ["ジャンル×対象", "大人の初心者でも通える？　何歳から？", "コースごとの対象年齢・レベル・定員"],
              ["お金", "入会金や教材費を入れるといくら？", "入会金・月謝・教材費や材料費・発表会費と、1年の総額の例"],
              ["休んだとき", "休んだら振替できる？　休会は？", "振替の期限と回数、休会・退会の連絡期限と費用"],
              ["体験", "体験レッスンはいくら？　何を持っていく？", "体験の料金・時間・持ち物・入会の案内の仕方"],
              ["講師", "どんな先生？", "経歴・資格（発行団体）・担当コース"],
              ["場所と通い方", "駐車場はある？　オンラインでもできる？", "最寄り駅・駐車場・自宅教室か・オンラインの有無"],
            ],
          },
        },
        {
          heading: "上位の記事に足りない点",
          paragraphs: [
            "「習い事教室 AI検索対策」「ピアノ教室 LLMO」「music lessons AI search」で上位に出る日本語・英語の記事（音楽教室・スクール・英会話教室・ドローンスクール向けのLLMO記事、ピアノや音楽教室向けの英語のGEOガイド、AIに聞く質問の例を集めたページなど）を読みました。コースと対象と月謝を表にすること、体験レッスンへの導線、講師の紹介、Googleビジネスプロフィールと口コミ、AIクローラの許可は多くの記事に書かれています。この記事でもすべて扱います。",
            "一方で、次の点はほとんどの記事にありませんでした。振替・休会・退会のルールの書き方、教材費や発表会費まで入れた「1年の総額」の出し方、自宅教室で番地を公開しない場合の住所と構造化データの扱い、具体的な構造化データの形、WordPressでの手順、AIに出ているかの確かめ方です。英語の記事には「口コミ50件以上・星4.5以上が必要」という数字もありましたが、出典は示されていませんでした。この記事では出典を確認できない数字は使いません。",
          ],
        },
        {
          heading: "料金は「月謝」ではなく「1年でかかる総額」で書く",
          paragraphs: [
            "習い事の費用は、月謝のほかに入会金、教材費・材料費、設備費や管理費、発表会や検定の費用、楽器や道具の購入・レンタルなどに分かれています。月謝だけを大きく書くと、AIはそれを費用のすべてのように答えてしまうことがあります。コースごとに、次の項目と1年の総額の例を表で書いてください。",
          ],
          table: {
            head: ["書く項目", "書き方の例", "注意点"],
            rows: [
              ["月謝", "月3回×30分 ◯円（税込）", "回数と1回の時間を同じ行に。月の回数が変わる月の扱いも"],
              ["入会金", "◯円（体験当日の入会で無料、など）", "無料になる条件があれば期間と一緒に"],
              ["教材費・材料費", "教本 ◯円／料理の材料費 1回 ◯円", "月謝に含まれるか、別か"],
              ["発表会・検定", "発表会 年1回・参加費 ◯円（任意）", "参加が必須か任意か"],
              ["楽器・道具", "体験は貸し出し、入会後は各自で用意", "購入が必要か、レンタルできるか、目安の費用"],
              ["1年の総額の例", "子どもピアノ月3回：入会金＋月謝12か月＋教材費＋発表会＝合計 ◯円（税込）", "よくある通い方を2〜3通り"],
            ],
          },
          after: [
            "料金は税込で書きます。国税庁は、消費者に対してあらかじめ価格を表示する場合は、媒体を問わず消費税込みの総額を表示するよう定めています（例：「11,000円（税込）」）。[国税庁：総額表示の義務](" + SRC.ntaTotal + ")",
            "単発参加・回数券・月謝制が混ざる料理教室やワークショップは、それぞれの料金と有効期限（回数券なら何か月以内に使うか）を分けて書きます。",
          ],
        },
        {
          heading: "振替・休会・退会のルールは表で書く",
          paragraphs: [
            "「休んだらどうなるか」は、習い事を選ぶときにとても気にされることですが、多くの教室サイトでは入会時の書類にしか書かれていません。ページに書いていないことは、AIは答えられないか、ほかの教室の情報で推測してしまいます。少なくとも次のことを本文に表で書いてください。",
          ],
          list: [
            "振替：何日前（何時間前）までの連絡で振替できるか、月に何回まで、いつまでに使うか（翌月末まで、など）。",
            "講師の都合や祝日・災害でのお休み：振替か返金か。",
            "休会：何か月まで休めるか、休会中の費用（在籍料など）。",
            "退会：何日前までに、どの方法で連絡するか。前払いした月謝や回数券の扱い。",
            "オンラインへの切り替え：体調不良のときにオンラインで受けられるか。",
          ],
          after: [
            "契約のルールは、教室の種類によって法律の扱いが変わります。外国語会話教室・学習塾・家庭教師・パソコン教室は、期間が2か月を超え、金額が5万円を超える契約が特定商取引法の「特定継続的役務提供」にあたり、契約書面を受け取ってから8日以内のクーリング・オフや、中途解約のときの費用の上限が決められています。料理教室や音楽教室はこの7つの役務に入っていません。[京都府：「エステ」「語学教室」など継続的サービスの中途解約について](" + SRC.kyotoContinuous + ")。英会話やパソコンのコースもある教室は、そのコースのページに法律に沿った解約のルールを書いてください。この記事は法的な助言ではありません。",
          ],
        },
        {
          heading: "体験レッスンと講師の書き方",
          paragraphs: [
            "体験レッスンのページには、料金（無料か有料か）、時間、対象、持ち物と服装、保護者が見学できるか、体験のあとの入会の案内の仕方（その場で決めなくてよいか）を書きます。「体験は無料」とだけ書くより、「体験 30分・500円（税込）、入会した場合は初月の月謝から差し引き」のように条件まで書くと、AIが条件ごと答えやすくなります。",
            "講師については、名前・経歴・担当するコースに加えて、資格を書くときは発行している団体の名前も書きます。習い事の資格には民間の団体が出しているものが多く、資格名だけではAIも人も何の資格か判断しにくいためです。講師ごとのプロフィールページの作り方は[代表者・専門家のプロフィールページのAI検索対策](/guide/person-profile-page-ai-search/)にまとめています。",
          ],
        },
        {
          heading: "自宅教室の住所と構造化データ",
          paragraphs: [
            "習い事教室には、自宅の一室で教えている教室が多くあります。番地まで公開したくない場合でも、AIに「どのあたりにあるか」が伝わらないと、地域の質問には出にくくなります。公開する範囲を決めて、その範囲をサイト・構造化データ・ポータルの掲載でそろえるのが基本です。",
          ],
          table: {
            head: ["教室の形", "サイトに書くこと", "構造化データ"],
            rows: [
              ["番地まで公開する", "住所・最寄り駅からの道順・駐車場", "住所を含めて出す"],
              ["町名までにする（詳細は申し込み後）", "「◯◯市◯◯町、◯◯駅から徒歩◯分。詳しい場所は申し込み後にお知らせします」", "番地は入れない。本文にない住所は構造化データにも書かない"],
              ["公民館・レンタルスペースで開く", "会場の名前・住所と、どのクラスがどの会場か", "教室の住所の代わりに、会場をクラスのページに本文で書く"],
              ["オンラインだけ", "使うツール、時間帯、対応できる地域や時差", "住所は入れない"],
            ],
          },
          after: [
            "構造化データの値は、ページ本文と一致させます。本文で町名までしか書いていないのに、構造化データにだけ番地を入れると、隠したつもりの住所がAIや検索エンジンに読まれてしまいます。なお、Googleの地域ビジネスの構造化データ（リッチリザルト）は名前と住所が必須です。[Google：LocalBusiness](" + SRC.googleLocal + ")。住所を出さない場合はその表示の対象にはなりませんが、AI機能に出るために特別な構造化データは必要ないとGoogleは説明しています。",
            "Googleビジネスプロフィールで住所を非表示にできるかどうかは、生徒が教室に来るかどうかなどで扱いが変わります。登録の前に[Googleビジネスプロフィールのガイドライン](" + SRC.gbpGuidelines + ")で最新の条件を確かめてください。",
          ],
        },
        {
          heading: "構造化データ：習い事教室専用の型はない",
          paragraphs: [
            `schema.orgには、音楽教室や料理教室のような習い事教室専用の型はありません。EducationalOrganization（教育機関）という型はありますが、その下の型は大学・小学校・中学校・高校・幼稚園・学校で、地域ビジネス（LocalBusiness）の型には含まれていません。[schema.org：EducationalOrganization](${SRC.educationalOrg})。個人や小さな会社の教室は LocalBusiness として出し、コースをService（料金はOffer）として紐づけるのが無理のない形です。[schema.org：LocalBusiness](${SRC.localBusiness})`,
            `Nurevo AEOでコースを入れると、Serviceは次のような形で出力されます（値は例です。番地を公開しない自宅教室を想定し、住所は入れていません）。`,
          ],
          code: SCHEMA_JA,
          after: [
            `schema.orgには講座を表すCourseと、開講の回を表すCourseInstance（courseModeで「online」「onsite」などを示せる）もあります。[schema.org：CourseInstance](${SRC.courseInstance})。ただしNurevo AEOはこの型を出力しません。使う場合も、AIが通い方を答えるのに役立つのは、本文に書いた曜日・時間・対面かオンラインかです。構造化データだけでコース表の代わりにしないでください。`,
          ],
        },
        {
          heading: "WordPressの教室サイトでの設定手順",
          list: [
            "[WordPress.org](" + WP_ORG + ")からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。0.9.1からはSEO SIMPLE PACKやVK All in One Expansion Unitとも、構造化データを重複させずに併用できます。",
            "初回の設定ウィザードで「その他」を選びます。業種の型を指定しない設定で、住所・電話番号・営業時間のどれかが入っていればLocalBusinessとして出力されます。",
            "教室名・電話番号・レッスンの時間帯（休みの曜日を含む）・説明を確認します。番地を公開しない自宅教室は、住所の欄を空けておけば、電話番号か営業時間が入っている限りLocalBusinessとして出力され、住所は出ません。町名までの場所は説明文と本文に書きます。",
            "設定画面のサービスに、コースを1つずつ登録します（最大20件）。コース名（「子どもピアノ 月3回×30分（月謝）」のように回数と時間も入れる）、1回の時間（分）、税込の料金と通貨（JPY）、カテゴリ（「ピアノ」「料理」など）、体験の申し込みページのURLを入れると、Service・Offer・予約の操作（ReserveAction）として出力され、llms.txtにも1行ずつ載ります。予約プラグインは必要ありません。",
            "よく聞かれる質問（振替の期限、休会の費用、体験の持ち物、楽器が必要か、駐車場）をFAQに入れます。FAQは、Nurevo FAQブロック（または[nurevo_faq]ショートコード）を置いたページのFAQPageに追加されます。体験レッスンのページだけの質問は、ブロックエディタのNurevo AEOパネルでそのページ専用に入れられます。",
            "1年の総額の例、振替・休会・退会、体験レッスンの表は、固定ページの本文に表で書きます。終わった季節の講座やイベントのページは、ブロックエディタのNurevo AEOパネルでllms.txtに載せない設定にできます。",
            "AEOスコアの画面で診断を実行し、不足をワンクリック修正で直します。外からどう見えるかは[無料のAI可読性チェック](/check)で確かめます。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の構造化データを出さず、SEOプラグインのグラフに足りない住所・電話番号・営業時間・サービス・FAQだけを足します。SEOプラグイン側に番地を入れている場合はそちらも見直してください。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/guide/local-business-schema-seo-plugins/)をご覧ください。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "ジャンル・コースごとの対象年齢・レベル・定員・曜日と時間・対面かオンラインかが書かれている。",
            "月謝の回数と1回の時間、入会金・教材費や材料費・発表会費・楽器や道具が、込みか別かとともに書かれている。",
            "よくある通い方の1年の総額の例が2〜3通り、税込で書かれている。",
            "振替の期限と回数、講師都合のお休み、休会・退会の連絡期限と費用が表で書かれている。",
            "体験レッスンの料金・時間・持ち物・見学の可否・入会の案内の仕方が書かれている。",
            "講師の経歴と担当コースがあり、資格には発行団体の名前がある。",
            "教室の場所を公開する範囲を決め、サイト・構造化データ・Googleビジネスプロフィール・ポータルの掲載でそろえている。本文にない番地を構造化データに入れていない。",
            "特定継続的役務提供にあたるコース（英会話・パソコンなど）があれば、そのページにクーリング・オフと中途解約のルールがある。",
            "llms.txtに、コース・料金・振替のルール・体験のページが載っている。[llms.txtとは](/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、生徒や保護者が聞きそうな質問を、ジャンル・地域（駅名や町名）・対象・曜日・予算・振替の組み合わせで5〜10個つくり、ChatGPTやPerplexityに投げて、教室が名前やURLで出るか、月謝や振替のルールが正しく書かれているかを記録します。AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。入会が増える春や、夏休みの短期講座の前など、時期を分けて記録すると傾向がつかめます。測り方の詳細は[AIでの登場率の測り方](/guide/measure-ai-visibility/)にまとめています。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（教室の名前は含めません）をPerplexityに投げ、回答に教室の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に教室が出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "習い事教室のAI検索対策は、何から始めればいいですか？", a: "コースごとの対象・曜日と時間・月謝（回数と1回の時間）と、入会金・教材費・発表会費まで入れた1年の総額の例、振替と休会・退会のルール、体験レッスンの条件を本文に表で書くことからです。そのうえで、名前・電話番号・場所をサイト・構造化データ・Googleビジネスプロフィールでそろえます。" },
        { q: "自宅教室で番地を公開したくありません。AIに出にくくなりますか？", a: "番地がなくても、町名や最寄り駅、徒歩何分かを本文に書けば、地域の質問の手がかりになります。公開しない番地は、構造化データにも入れないでください。Nurevo AEOでは住所の欄を空けておけば、電話番号か営業時間が入っている限り、住所なしのLocalBusinessとして出力されます。" },
        { q: "構造化データの型は何を使えばいいですか？", a: "schema.orgには習い事教室専用の型がなく、EducationalOrganizationの下の型は学校向けです。個人や小さな会社の教室はLocalBusinessとして出し、コースをServiceとOfferで紐づけるのがおすすめです。" },
        { q: "振替のルールまでサイトに書く必要がありますか？", a: "はい。休んだときの扱いは入会前によく聞かれますが、入会時の書類にしか書かれていないことが多く、その場合AIは答えられません。振替の期限・回数・使える期間と、休会・退会の連絡期限を本文に書いてください。" },
        { q: "料理教室や音楽教室にもクーリング・オフはありますか？", a: "特定商取引法の特定継続的役務提供の対象は、エステ・美容医療・外国語会話教室・家庭教師・学習塾・パソコン教室・結婚相手紹介の7つで、料理教室や音楽教室は含まれていません。ただし、販売の方法によって別のルールがかかることもあるため、くわしくは消費生活センターなどで確かめてください。この記事は法的な助言ではありません。" },
        { q: "Nurevo AEOは無料で使えますか？", a: "はい。教室の連絡先・レッスンの時間帯・コース・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](" + WP_ORG + ")" },
        { q: "対策すればChatGPTに教室が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが教室の事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが教室のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },

    en: {
      title: "AI Search for Lesson Studios: Fees, Make-ups, Trials | Nurevo",
      description: "AEO for music, cooking and craft studios: publish the yearly total, make-up and cancellation rules, trial lessons, teachers and where you teach, even from home.",
      h1: "AI search for lesson studios: how to get AI to read your yearly fees, make-up rules, trial lessons and home-studio location correctly",
      lead: "AI search optimization for a music, cooking, calligraphy or craft studio comes down to answering, in plain text with amounts and rules, the questions students and parents now ask AI: what a year really costs once you add the registration fee and materials, whether a missed lesson can be made up, and where a home studio actually is. A \"lessons from $X a month\" on its own leaves AI unable to answer either the cost or the logistics. Then you publish the same facts consistently in structured data, llms.txt, your Google Business Profile and any lesson directories you are listed in.",
      intro: [
        "Written November 17, 2026 (JST). schema.org types were checked that day in schema-dts 2.1.0. The Kyoto Prefecture consumer page was read the same day (page updated April 30, 2025). The Google pages and Japan's National Tax Agency page were checked between October 29 and November 1, 2026. Examples of tax and consumer rules come from Japan; check the rules where you operate.",
        "This guide is for hobby and arts studios that adults and children attend: music, cooking, calligraphy, flower arranging, tea ceremony, crafts, painting and similar. Tutoring schools and gyms or yoga studios raise different questions and rules, so they are not covered here. AI answers change from day to day and with how a question is phrased. The steps here make your facts readable to AI. They do not guarantee that an AI will mention your studio or rank it anywhere.",
      ],
      sections: [
        {
          heading: "What students and parents ask AI",
          paragraphs: [
            "Questions about lessons stack a subject, an area, who the lessons are for, how they run and what they cost. For example: \"a piano teacher near [station] who takes adult beginners twice a month\", \"a cooking class I can drop into on a weekday evening\", \"calligraphy for a five-year-old where parents can watch\" or \"a studio with make-up lessons for about $120 a month\". For an AI to name your studio, the text on your site has to show that you meet those conditions.",
            "Google says there are no additional requirements or special structured data for appearing in AI Overviews or AI Mode, and that ordinary SEO basics, structured data that matches the visible text and an up-to-date Business Profile are what matter. [Google: AI features and your website](" + SRC.googleAi + "). AI search for a lesson studio is not a trick; it is writing down, accurately, the numbers and rules people use to compare.",
          ],
          table: {
            head: ["Question type", "Example", "Facts the answer needs"],
            rows: [
              ["Subject and level", "Do you take adult beginners? From what age?", "Age range, level and class size for each course"],
              ["Cost", "What does it cost with registration and materials?", "Registration, monthly fee, materials, recital fees and an example yearly total"],
              ["Missed lessons", "Can I make up a lesson? Can I pause?", "Make-up deadlines and limits; pause and withdrawal notice and fees"],
              ["Trial", "How much is a trial? What do I bring?", "Trial fee, length, what to bring and how joining is handled"],
              ["Teacher", "Who teaches?", "Background, credentials (and who issues them), courses taught"],
              ["Location and format", "Is there parking? Can I take lessons online?", "Nearest station, parking, home studio or not, online option"],
            ],
          },
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            "We read the top Japanese and English results for lesson studio and music school AI search: Japanese LLMO guides for music schools, course providers, English-conversation schools and drone schools, English GEO guides for piano and music lessons, and a page of test prompts for lesson-booking questions. Course-by-age-by-fee tables, a clear path to a trial lesson, teacher bios, Google Business Profile and reviews, and allowing AI crawlers are covered widely, and this guide covers them too.",
            "Almost none of them covered how to write make-up, pause and withdrawal rules, how to show a yearly total that includes materials and recital fees, how to handle the address and structured data for a home studio that does not publish its street address, the actual shape of the structured data, how to set it up in WordPress, or how to check whether you appear in AI answers. One English guide said a teacher needs \"over 50 verified reviews\" and \"4.5 stars or higher\", without a source. This guide does not use figures we could not trace to a source.",
          ],
        },
        {
          heading: "Price the year, not just the monthly fee",
          paragraphs: [
            "Lesson costs are split into the monthly fee, a registration fee, books or ingredients, facility fees, recital or exam fees, and buying or renting an instrument or tools. If only the monthly fee is prominent, AI can present it as the whole cost. For each course, show these items and an example yearly total in a table.",
          ],
          table: {
            head: ["Item", "How to write it", "Watch out for"],
            rows: [
              ["Monthly fee", "3 x 30-minute lessons a month, $X", "Number and length of lessons on the same line; what happens in months with fewer weeks"],
              ["Registration", "$X (waived if you join on the trial day, for example)", "If it can be waived, say when and until when"],
              ["Books and materials", "Method book $X / ingredients $Y per class", "Whether they are in the monthly fee or extra"],
              ["Recitals and exams", "One recital a year, $X to take part (optional)", "Whether taking part is required"],
              ["Instrument and tools", "Loaned for the trial; bring your own after joining", "Whether you must buy, whether you can rent, rough cost"],
              ["Example yearly total", "Children's piano, 3 a month: registration + 12 months + books + recital = $X", "Two or three common ways to attend"],
            ],
          },
          after: [
            "In Japan, prices shown to consumers in advance must include consumption tax, on any medium (for example \"11,000円（税込）\"). [National Tax Agency: total price display (Japanese)](" + SRC.ntaTotal + "). Wherever you operate, say whether tax is included.",
            "Cooking classes and workshops that mix drop-in, multi-class passes and monthly plans should list each price separately, with any expiry (how many months a pass is valid).",
          ],
        },
        {
          heading: "Put make-up, pause and withdrawal rules in a table",
          paragraphs: [
            "What happens when you miss a lesson is one of the first things people weigh, yet many studio sites only state it in the sign-up paperwork. What is not on the page, AI cannot answer, or it guesses from other studios. At minimum, put the following in a table on the page:",
          ],
          list: [
            "Make-ups: how much notice is needed, how many per month, and by when they must be used (for example, by the end of the next month).",
            "Lessons cancelled by the teacher, holidays or bad weather: made up or refunded.",
            "Pausing: for how many months, and any fee while paused.",
            "Withdrawal: how many days' notice, by what method, and what happens to prepaid fees or passes.",
            "Switching to online: whether a lesson can be taken online if a student is unwell.",
          ],
          after: [
            "Contract rules can depend on the type of lessons. In Japan, contracts for foreign-language conversation schools, tutoring schools, home tutors and computer schools that run over two months and cost over 50,000 yen are \"specified continuous services\" under the Act on Specified Commercial Transactions, with an eight-day cooling-off period from receipt of the contract document and caps on early-termination charges. Cooking and music classes are not among the seven covered services. [Kyoto Prefecture: early termination of continuous services (Japanese)](" + SRC.kyotoContinuous + "). If you also run language or computer courses, put the legally required terms on those course pages, and check the equivalent rules where you operate. This article is not legal advice.",
          ],
        },
        {
          heading: "Trial lessons and teachers",
          paragraphs: [
            "On your trial-lesson page, give the fee (free or paid), length, who it is for, what to bring and wear, whether parents can watch, and how joining is handled afterwards (for example, that nobody has to decide on the day). \"30-minute trial, $10, credited against the first month if you join\" lets AI pass on the condition with the price; \"free trial\" alone does not.",
            "For teachers, give the name, background and the courses they teach, and when you list a credential, name the body that issued it. Many lesson credentials are issued by private associations, and a credential name on its own tells neither AI nor people much. See [profile pages for founders and experts](/guide/person-profile-page-ai-search/) for building a page for each teacher.",
          ],
        },
        {
          heading: "Home studios: the address and structured data",
          paragraphs: [
            "Many teachers run lessons from a room in their home. Even if you do not want to publish your street address, AI needs to know roughly where you are, or you will rarely come up for questions that name an area. The basic rule is to decide how much to publish and keep exactly that much consistent across your site, structured data and directory listings.",
          ],
          table: {
            head: ["Setup", "What the site says", "Structured data"],
            rows: [
              ["Street address public", "Address, directions from the station, parking", "Include the address"],
              ["Neighborhood only (details after sign-up)", "\"[Neighborhood], [city], 5 minutes' walk from [station]. We send the exact address after you book.\"", "Leave the street address out. Never put an address in structured data that the page does not show"],
              ["Community hall or rented room", "The venue name and address, and which class meets where", "State the venue on each class page in the text instead of a studio address"],
              ["Online only", "Which tools you use, time slots, time zones you can serve", "No address"],
            ],
          },
          after: [
            "Structured data has to match the visible page. If the page shows only the neighborhood but the structured data carries the street address, the address you meant to keep private is still read by AI and search engines. Google's local business rich result requires a name and an address. [Google: LocalBusiness](" + SRC.googleLocal + "). Without an address you are not eligible for that display, but Google says no special structured data is needed to appear in its AI features.",
            "Whether you can hide your address on Google Business Profile depends on things such as whether students come to you. Check the current conditions in the [Google Business Profile guidelines](" + SRC.gbpGuidelines + ") before you set it up.",
          ],
        },
        {
          heading: "Structured data: there is no lesson-studio type",
          paragraphs: [
            `schema.org has no type for music schools, cooking schools or similar lesson studios. There is EducationalOrganization, but its subtypes are colleges and universities, elementary, middle and high schools, preschools and schools, and it is not one of the LocalBusiness types. [schema.org: EducationalOrganization](${SRC.educationalOrg}). For a studio run by one teacher or a small company, the sensible shape is a LocalBusiness with each course linked as a Service, with its price as an Offer. [schema.org: LocalBusiness](${SRC.localBusiness})`,
            `When you enter courses in Nurevo AEO, each Service is output in this shape (values are examples; this assumes a home studio that does not publish its street address, so there is no address):`,
          ],
          code: SCHEMA_EN,
          after: [
            `schema.org also has Course and CourseInstance, an individual run of a course whose courseMode can say \"online\" or \"onsite\". [schema.org: CourseInstance](${SRC.courseInstance}). Nurevo AEO does not output these types. Even if you add them, what helps AI answer how lessons run is the days, times and in-person or online format written in your text. Do not let structured data stand in for a timetable.`,
          ],
        },
        {
          heading: "Setting it up on a WordPress studio site",
          list: [
            "Install and activate Nurevo AEO (free) from [WordPress.org](" + WP_ORG + "). Yoast SEO, Rank Math, All in One SEO and Slim SEO keep working. Since 0.9.1 it also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.",
            "In the setup wizard, choose \"Other\". It sets no business type, and the plugin publishes a LocalBusiness when an address, phone or opening hours are set.",
            "Check your studio name, phone, lesson hours (including days off) and description. For a home studio that does not publish its street address, leave the address field empty: as long as a phone number or hours are set, the plugin still publishes a LocalBusiness, without an address. Put the neighborhood in the description and on the page.",
            "Under Services in Settings, add each course (up to 20): a name that includes the frequency and length (\"Children's piano, 3 x 30 min a month (monthly fee)\"), the lesson length in minutes, the price including tax, the currency, a category (\"Piano\", \"Cooking\" and so on) and your trial-booking URL. Each is published as a Service with an Offer and a booking action (ReserveAction), and gets its own line in llms.txt. No booking plugin is needed.",
            "Add the questions people ask most (make-up deadlines, fees while paused, what to bring to a trial, whether an instrument is needed, parking) to the FAQ. FAQs are added to the FAQPage on pages that hold the Nurevo FAQ block (or the [nurevo_faq] shortcode). Questions for the trial-lesson page alone can be entered for that page only in the Nurevo AEO panel in the block editor.",
            "Put the example yearly totals, the make-up, pause and withdrawal rules and the trial details in the page text as tables. Pages for past seasonal courses or events can be excluded from llms.txt in the same Nurevo AEO panel.",
            "Run a diagnosis on the AEO score screen and fix gaps with one-click fixes. Check how your site looks from outside with the [free AI readability check](/check).",
          ],
          after: [
            "Alongside an SEO plugin, Nurevo AEO does not output a second set of structured data; it adds only the address, phone, hours, services and FAQ the SEO plugin's graph lacks. If you entered a street address in your SEO plugin, review it there too. See [adding business details to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins/).",
          ],
        },
        {
          heading: "Pre-publish checklist",
          list: [
            "Each course states its age range, level, class size, days and times, and whether it is in person or online.",
            "The monthly fee shows the number and length of lessons; registration, materials, recital fees and instruments are shown with whether each is included.",
            "Two or three example yearly totals for common ways of attending are shown, with tax treatment.",
            "Make-up deadlines and limits, teacher cancellations, and pause and withdrawal notice and fees are in a table.",
            "The trial lesson's fee, length, what to bring, whether parents can watch and how joining is handled are stated.",
            "Teachers have a background and the courses they teach, and credentials name the issuing body.",
            "You have decided how much of your location to publish and kept it the same across your site, structured data, Google Business Profile and directories. No street address appears in structured data that the page does not show.",
            "Any course that counts as a regulated continuous service (language or computer courses in Japan) has its cooling-off and early-termination terms on its page.",
            "llms.txt lists your course, fee, make-up rule and trial pages. [What is llms.txt?](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, write five to ten questions a student or parent would ask, combining subject, area (station or neighborhood), who the lessons are for, days, budget and make-up rules. Put them to ChatGPT and Perplexity and record whether your studio appears by name or URL, and whether fees and make-up rules are stated correctly. Answers vary between runs, so repeat the same questions over time. Recording separately around the busy sign-up season and before summer short courses helps you see trends. [How to measure AI visibility](/guide/measure-ai-visibility/)",
            "Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your studio's name) are put to Perplexity, and the plugin records whether the answers named you or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta: how often you appear in AI answers, with competitor comparison and history (currently measured on Perplexity). Both look at a sample of answers, not every answer.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a lesson studio start with AI search?", a: "Write, as text and tables on your pages, each course's audience, days and times and monthly fee (number and length of lessons), an example yearly total including registration, materials and recital fees, your make-up, pause and withdrawal rules, and your trial-lesson terms. Then make your name, phone and location match across structured data and your Google Business Profile." },
        { q: "I teach from home and don't want to publish my street address. Will that hurt?", a: "Without a street address, the neighborhood, nearest station and walking time in your text still give AI something to match area questions. Do not put the street address in structured data either. In Nurevo AEO, leave the address field empty: as long as a phone number or hours are set, a LocalBusiness is published without an address." },
        { q: "Which structured data type should a lesson studio use?", a: "schema.org has no lesson-studio type, and the subtypes of EducationalOrganization are for schools. Publish a small studio as a LocalBusiness and link your courses as Service with Offer." },
        { q: "Do we really need to publish our make-up rules?", a: "Yes. What happens after a missed lesson is a common question before joining, but it often lives only in sign-up paperwork, where AI cannot read it. State make-up deadlines, limits and expiry, and the notice needed to pause or withdraw, on the page." },
        { q: "Do cooling-off rules apply to cooking or music classes?", a: "In Japan, the specified continuous services are beauty treatments, cosmetic medical treatments, foreign-language conversation schools, home tutors, tutoring schools, computer schools and matchmaking services; cooking and music classes are not among them. Other rules can apply depending on how a contract is sold, and rules differ by country, so check with a consumer advice service. This article is not legal advice." },
        { q: "Is Nurevo AEO free?", a: "Yes. Structured data for your contact details, lesson hours, courses and FAQ, plus llms.txt, AI crawler rules and the AEO score, are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](" + WP_ORG + ")" },
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
