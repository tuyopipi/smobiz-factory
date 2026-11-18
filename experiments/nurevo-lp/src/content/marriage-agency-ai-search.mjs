// Content page: AI search (AEO) for marriage agencies / matchmaking services
// (結婚相談所・仲人型・データマッチング型・オンライン型の相談所).
// Industry page. Wedding venues have their own page (wedding-venue-ai-search);
// dating apps are out of scope. This one is about the fee breakdown, the
// agency's own definition of 成婚 (a "match"), federation (連盟) membership
// versus the agency's own members, success figures, contract and cancellation
// rules, and certifications.
//
// Written 2026-11-18 8時 (JST). Every claim about Nurevo AEO is one the
// plugin's readme makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt,
// 0.9.2) or its source: the wizard "Other" card sets no type and
// "Professional services" sets ProfessionalService (includes/setup-wizard.php);
// with no type set the business node is a LocalBusiness when any of address,
// phone or hours is filled (nurevo-webmcp.php webmcp_canary_business_schema_type);
// services (up to 20) are published as Service + Offer + duration
// PropertyValue + ReserveAction, with an optional description, and an llms.txt
// line. Nurevo does not output memberOf. Pro measurement runs on Perplexity.
//
// Outside facts and where they were read:
// - Osaka Prefecture FAQ (updated 2024-05-14, read 2026-11-18): 結婚相手紹介
//   contracts over 2 months and over 50,000 yen are 特定継続的役務提供;
//   cooling-off within 8 days of receiving the legal document; mid-term
//   cancellation for any reason; caps: before service starts 30,000 yen;
//   after: price of services received + the lower of 20,000 yen or 20% of the
//   unused amount. Consumer hotline 188.
// - Hiroshima Prefecture consumer centre (updated 2024-08-01, read 2026-11-18):
//   same caps for 結婚相手紹介サービス; contract amount includes admission fee
//   and related goods required by the contract.
// - Osaka Prefecture page on safe use of matching services (updated
//   2026-05-29, read 2026-11-18): private third-party certifications IMS認証
//   (NPO 結婚相手紹介サービス業認証機構, internet type) and マル適マークCMS
//   (NPO 日本ライフデザインカウンセラー協会); they check information to users,
//   clear contracts and cancellation, identity and proof of single status,
//   and a complaints desk.
// - PR TIMES, Branding Works, 2026-10-03: gpt-5.1 and gemini-3.1-pro via API
//   with web search, one prompt 「結婚相談所のおすすめは？」, 3 runs a day on
//   10 days (2026-09-17 to 09-30), 60 answers; cited sources led by
//   life.oricon.co.jp 24.9% and my-best.com 18.2%. The company sells AIO.
// - mwed.jp (2026-10-27): the definition of 成婚 differs by agency (start of
//   dating toward marriage, serious dating, confirmed intent, engagement,
//   withdrawal for dating/engagement/marriage), and so does how results are
//   counted. Federation = agencies sharing member data.
// - 5W PR Dating App AI Visibility Index (updated 2026-10-30; measured
//   2026-10-26, US English): reddit.com cited in 25 of 41 Google AI Overviews.
// - schema.org read in schema-dts 2.1.0 on 2026-11-18: no matchmaking or
//   marriage-agency type; ProfessionalService "was deprecated due to
//   confusion with Service"; Organization has memberOf (Organization,
//   ProgramMembership, MemberProgramTier).
// - Google "AI features and your website" (checked 2026-11-01), NTA tax answer
//   6902 (checked 2026-11-01), CAA stealth marketing (checked 2026-11-01): not
//   re-fetched this run.
// Not verified this run, so not stated: the CAA 特定商取引法ガイド page itself,
// the legally required items of 概要書面/契約書面, rules on advertising
// success rates, and any figure on how many people use AI to choose an agency.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  osakaFaq: "https://www.pref.osaka.lg.jp/faq/faq_002098.html",
  hiroshima: "https://www.pref.hiroshima.lg.jp/site/syouhiseikatsucenter/chuutokaiyaku.html",
  osakaCert: "https://www.pref.osaka.lg.jp/o090135/kosodateshien/enzyoi/ninsyo.html",
  prtimes: "https://prtimes.jp/main/html/rd/p/000000004.000155520.html",
  mwed: "https://www.mwed.jp/matchagent/3271/",
  fiveW: "https://www.5wpr.com/ai-visibility-index/dating-app-ai-visibility-index-2026/",
  ntaTotal: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6902.htm",
  caaStealth: "https://www.caa.go.jp/policies/policy/representation/fair_labeling/stealth_marketing/",
  professionalService: "https://schema.org/ProfessionalService",
  memberOf: "https://schema.org/memberOf",
};

const SCHEMA_JA = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://example.jp/#business",
      "name": "結婚相談所例（例）",
      "address": "◯◯県◯◯市◯◯町1-2-3 ◯◯ビル5階",
      "telephone": "+81-00-0000-0000",
      "url": "https://example.jp/",
      "openingHours": "Tu-Su 10:00-20:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.jp/#nurevo-service-1",
      "name": "無料カウンセリング（60分・オンライン可）",
      "description": "料金・成婚の定義・活動の流れを説明します。当日の入会はおすすめしていません。",
      "category": "結婚相談",
      "provider": { "@id": "https://example.jp/#business" },
      "additionalProperty": {
        "@type": "PropertyValue", "name": "duration",
        "value": 60, "unitCode": "MIN", "unitText": "minutes"
      },
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.jp/counseling" },
        "result": { "@type": "Reservation", "name": "無料カウンセリング（60分・オンライン可）" }
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
      "name": "Example Matchmaking",
      "address": "5F, 1-2-3 Example St, Example City",
      "telephone": "+1-000-000-0000",
      "url": "https://example.com/",
      "openingHours": "Tu-Su 10:00-20:00"
    },
    {
      "@type": "Service",
      "@id": "https://example.com/#nurevo-service-1",
      "name": "Free consultation (60 min, online available)",
      "description": "We explain fees, what counts as a match and how the process works. We do not ask you to sign up on the day.",
      "category": "Matchmaking",
      "provider": { "@id": "https://example.com/#business" },
      "additionalProperty": {
        "@type": "PropertyValue", "name": "duration",
        "value": 60, "unitCode": "MIN", "unitText": "minutes"
      },
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "potentialAction": {
        "@type": "ReserveAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://example.com/consultation" },
        "result": { "@type": "Reservation", "name": "Free consultation (60 min, online available)" }
      }
    }
  ]
}`;

export default {
  slug: "marriage-agency-ai-search",
  targetQueries: [
    "matchmaking service AI search optimization",
    "matchmaker ChatGPT recommendations",
    "marriage agency schema markup",
    "結婚相談所 AI検索対策",
    "結婚相談所 ChatGPT 集客",
    "結婚相談所 LLMO",
  ],
  related: ["wedding-venue-ai-search", "lesson-studio-ai-search", "local-business-schema-seo-plugins", "llms-txt", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "結婚相談所のAI検索対策：料金・成婚の定義・連盟 | Nurevo",
      description: "結婚相談所のAI検索対策は、入会から成婚までの総額、自社の「成婚」の定義、連盟と自社の会員数の違い、解約のルールを本文に書くこと。構造化データとWordPressの手順、AIでの確かめ方も解説。",
      h1: "結婚相談所のAI検索対策：料金の総額・成婚の定義・連盟の会員数・解約のルールをAIに正しく読ませる手順",
      lead: "結婚相談所のAI検索対策の中心は、婚活中の人がAIに聞く「入会から成婚までで総額いくら？」「成婚料はいつ払う？」「会員数は何人？」「途中でやめたらいくら戻る？」に、自社のページ本文で金額・定義・ルールを書いて答えることです。成婚の定義も会員数の数え方も相談所ごとに違うため、自社の定義を書いていないと、AIはほかの相談所や比較サイトの説明で補ってしまいます。そのうえで同じ事実を構造化データ・llms.txt・Googleビジネスプロフィール・比較サイトや連盟の掲載とそろえます。",
      intro: [
        "作成日：2026年11月18日（JST）。大阪府と広島県のページ、PR TIMESの調査リリース、比較記事は同日に確認しました。schema.orgの型は同日に schema-dts 2.1.0 で確認。Google・国税庁・消費者庁のページは2026年11月1日に確認した内容です。",
        "この記事は、仲人型・データマッチング型・オンライン型の結婚相談所向けです。マッチングアプリと結婚式場は質問もルールも違うため扱いません（式場は[結婚式場のAI検索対策](/guide/wedding-venue-ai-search/)へ）。AIの回答は日や聞き方によって変わります。この記事の対策は、AIが相談所の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。この記事は法的な助言ではありません。",
      ],
      sections: [
        {
          heading: "婚活中の人はAIに何を聞くか",
          paragraphs: [
            "結婚相談所を探す質問は、年代・地域・活動の仕方・お金の条件が重なった形になります。たとえば「30代後半の女性で、仕事が忙しくても続けやすい◯◯市の結婚相談所」「再婚の男性でも登録しやすい、オンラインで面談できる相談所」「成婚料なしで、1年の総額が◯万円くらいのところ」です。AIがこうした質問に相談所の名前を挙げるには、その条件を満たすことがサイトの文字から読み取れる必要があります。",
            "Googleは、AI OverviewsやAI Modeに出るための追加の要件や特別な構造化データはなく、通常のSEOの基本と、本文と一致した構造化データ、最新のビジネスプロフィールが大切だとしています。[Google：AI features and your website](" + SRC.googleAi + ")。結婚相談所でも、裏技より、比べるときに使う金額と定義を正確に書くことが本体です。",
          ],
          table: {
            head: ["質問の型", "例", "答えに必要な事実"],
            rows: [
              ["年代・状況×地域", "40代の再婚でも入れる？　◯◯駅の近くは？", "対象の年代や条件、面談の場所（店舗・オンライン）、対応地域"],
              ["総額", "入会から成婚まででいくら？", "入会金・登録料・月会費・お見合い料・成婚料・オプションと、総額の例"],
              ["成婚の定義", "成婚料はいつ払うの？", "自社の「成婚」が何を指すか、成婚料が発生する時点"],
              ["会員と出会いの数", "会員数は？　月に何人と会える？", "自社の会員数と連盟の会員数の区別、時点、お見合いの申し込みの上限"],
              ["解約・休会", "途中でやめたらいくら？　休会できる？", "クーリング・オフ、中途解約の精算、休会の期間と費用"],
              ["安心できるか", "独身の証明は？　認証は？", "入会時に出す書類、本人確認、取得している認証、苦情の窓口"],
            ],
          },
        },
        {
          heading: "上位の記事に足りない点",
          paragraphs: [
            "「結婚相談所 AI検索対策」「結婚相談所 LLMO」「matchmaking AI search」で上位に出る日本語・英語のページ（結婚相談所向けのLLMOの解説、生成AIが挙げる結婚相談所の調査リリース、相談所の料金や成婚の定義を比べた比較記事、英語のマッチメーカー向けGEOガイド、地域ビジネス向けのChatGPT対策、マッチングアプリのAI露出の調査など）を読みました。料金を内訳で書くこと、休会の規定、連盟の会員数と自社の規模を混同しないこと、本文とFAQと構造化データをそろえることは、いちばん詳しい日本語の記事にも書かれています。この記事でもすべて扱います。",
            "一方で、次の点はほとんどのページにありませんでした。中途解約のときの精算の上限を出典つきで書く方法、成婚の定義の書き方の型、総額の例の出し方、具体的な構造化データの形、WordPressでの手順、AIに出ているかを時期を分けて確かめる方法です。英語のガイドには「口コミ50件以上が有利」という数字がありましたが、出典は示されていませんでした。この記事では出典を確認できない数字は使いません。",
            "AIがどこを読んでいるかの手がかりもあります。ある支援会社が2026年9月にChatGPTとGeminiのAPI（Web検索あり）に「結婚相談所のおすすめは？」を10日間・計60回聞いた調査では、引用元の上位はランキングサイトや比較サイトで、1位のサイトが引用の24.9%、2位が18.2%でした。質問は1つだけで、調査した会社はAI検索対策のサービスを販売しています。[PR TIMES：ブランディングワークスの調査（2026年10月3日）](" + SRC.prtimes + ")。自社サイトに加えて、比較サイトや連盟のページに載っている自社の情報が古くないかも確かめる価値があります。",
          ],
        },
        {
          heading: "料金は「入会から成婚までの総額」で書く",
          paragraphs: [
            "結婚相談所の費用は、入会金・登録料（まとめて「初期費用」と書かれることも多い）、月会費、お見合い料、成婚料、写真撮影や個別サポートなどのオプションに分かれています。比較記事でもこの項目で並べられていますが、相談所によって「初期費用」に何が入るかが違います。月会費だけを大きく書くと、AIはそれを費用のすべてのように答えてしまうことがあります。プランごとに、次の項目と総額の例を表で書いてください。",
          ],
          table: {
            head: ["書く項目", "書き方の例", "注意点"],
            rows: [
              ["入会金・登録料", "入会金 ◯円＋登録料 ◯円（税込）", "「初期費用」とまとめる場合も内訳を書く。キャンペーンは期間と条件つき"],
              ["月会費", "月 ◯円（税込）、お見合いの申し込み 月◯件まで", "月会費に含まれるサポート（面談の回数など）も同じ行に"],
              ["お見合い料", "1回 ◯円／無料", "成立したときだけか、申し込みのたびか"],
              ["成婚料", "◯円（税込）、自社の定義で成婚したときに発生", "発生する時点を次の「成婚の定義」と一緒に"],
              ["オプション", "プロフィール写真の撮影 ◯円（任意）", "必須か任意か。提携先の費用は別か"],
              ["総額の例", "1年活動して成婚：初期費用＋月会費12か月＋お見合い料＋成婚料＝合計 ◯円（税込）", "よくある活動期間で2〜3通り。成婚しなかった場合の例も"],
            ],
          },
          after: [
            "料金は税込で書きます。国税庁は、消費者に対してあらかじめ価格を表示する場合は、媒体を問わず消費税込みの総額を表示するよう定めています。[国税庁：総額表示の義務](" + SRC.ntaTotal + ")",
            "成婚料がない料金プランと成婚料のあるプランを並べる場合は、同じ活動期間の総額で比べられるようにしておくと、AIも「どちらが安いか」を条件つきで答えやすくなります。",
          ],
        },
        {
          heading: "「成婚」の定義を自社の言葉で書く",
          paragraphs: [
            "成婚の定義は相談所ごとに違います。比較記事でも、「結婚に向けて交際を始めること」「真剣交際に入ること」「お互いの結婚の意思を確認すること」「婚約（プロポーズ）が成立すること」「交際・婚約・結婚を理由に退会届を出すこと」など、各社の定義が別々に並べられています。成婚の定義や実績の集計方法は各社で異なる、とその記事も書いています。[みんなの結婚相談所：おすすめランキング（2026年10月27日）](" + SRC.mwed + ")",
            "定義を書いていないと、AIはほかの相談所の定義で「成婚料は婚約のときに払う」などと答えてしまうことがあります。料金ページと成婚料の説明の近くに、次の4つを書いてください。",
          ],
          list: [
            "自社で「成婚」とする時点（例：「お互いに結婚の意思を確認し、二人で退会の手続きをした時点」）。",
            "成婚料が発生する時点と、支払いの期限。",
            "成婚退会のあとに交際が終わった場合の扱い（再入会の費用など）。",
            "成婚の実績を書く場合は、何を数えたか（定義）、分母、期間、時点。例：「2025年4月〜2026年3月に活動した会員◯名のうち、当社の定義で成婚退会した方◯名」。",
          ],
          after: [
            "「成婚率◯%」だけを大きく書くと、定義も分母も違う他社の数字と並べて比べられてしまいます。定義と分母を同じ段落に書いておくと、AIが数字を引用するときにも条件ごと伝わりやすくなります。",
          ],
        },
        {
          heading: "会員数は「自社」と「連盟」を分けて書く",
          paragraphs: [
            "多くの結婚相談所は、複数の相談所で会員のデータを共有する「結婚相談所連盟」に加盟しています。比較記事でも、相談所の会員数に連盟の会員が含まれる場合があると説明されています。[みんなの結婚相談所](" + SRC.mwed + ")。自社のサイトに連盟の会員数だけを書くと、AIは相談所そのものの規模として答えてしまうことがあります。",
          ],
          table: {
            head: ["書く数字", "書き方の例", "注意点"],
            rows: [
              ["自社の会員数", "当社の在籍会員 ◯名（2026年10月1日時点）", "時点を必ず書く。活動中か休会中を含むか"],
              ["加盟している連盟", "◯◯連盟に加盟。連盟全体の会員数 約◯万名（連盟の公表値、◯年◯月時点）", "連盟の数字には出典と時点。複数の連盟に入っている場合は重複の扱いも"],
              ["お見合いの申し込み", "月◯件まで申し込み可、◯件まで申し込みを受けられる", "プランごとに違う場合は表で"],
              ["男女比・年代", "当社会員の男女比・年代別の割合（時点）", "連盟全体の値なら、そう書く"],
            ],
          },
          after: [
            "schema.orgには、組織がどの団体に加盟しているかを示す memberOf というプロパティもあります。[schema.org：memberOf](" + SRC.memberOf + ")。ただしNurevo AEOはこのプロパティを出力しません。使う場合も、AIが答えに使うのは本文に書いた連盟の名前と数字の区別です。",
          ],
        },
        {
          heading: "クーリング・オフ・中途解約・休会のルールを書く",
          paragraphs: [
            "結婚相手紹介サービスは、契約期間が2か月を超え、契約金額が5万円を超えるものが特定商取引法の「特定継続的役務提供」にあたります。法律に定められた書面を受け取ってから8日以内ならクーリング・オフができ、その後も契約期間内なら理由を問わず中途解約ができます。中途解約のときに請求できる額には上限があり、サービスを受ける前なら3万円、受けたあとなら、受けたサービスの対価に加えて「2万円または契約残額の2割のいずれか低い額」までです。[大阪府：「結婚相手紹介サービス」の解約（2024年5月14日更新）](" + SRC.osakaFaq + ")。広島県の消費生活センターも同じ上限を示し、契約金額には入会金や契約に必要な関連商品も含まれるとしています。[広島県：中途解約権（特定商取引法）](" + SRC.hiroshima + ")",
            "入会を考える人は、この点をAIに聞くことがあります。料金ページか「ご契約について」のページに、少なくとも次のことを書いてください。",
          ],
          list: [
            "クーリング・オフができる期間と、連絡の方法。",
            "中途解約の手続きと、精算の計算方法（前払いした月会費・初期費用の扱い）。法律の上限を超える条件にはしない。",
            "休会：何か月まで休めるか、休会中の費用、休会中にお見合いや紹介が止まるか。",
            "成婚退会と、それ以外の退会で手続きや費用が違う場合はその違い。",
            "契約の前に渡す書面と、相談の窓口（自社の窓口と、消費者ホットライン188）。",
          ],
          after: [
            "書面に書く必要がある項目などの細かいルールは、消費者庁や都道府県の消費生活センターの最新の情報で確かめてください。",
          ],
        },
        {
          heading: "入会の書類・認証・口コミの書き方",
          paragraphs: [
            "「独身の証明は必要？」「ちゃんとした相談所？」という不安にも、本文で答えておきます。入会のときに出してもらう書類（独身証明書・本人確認書類など、自社で求めるもの）と、確認の方法を書いてください。",
            "大阪府は、結婚相手紹介サービスの民間の第三者認証として、インターネット型のサービスの「IMS認証」（特定非営利活動法人 結婚相手紹介サービス業認証機構）と「マル適マークCMS」（特定非営利活動法人 日本ライフデザインカウンセラー協会）を紹介しています。認証では、利用者への情報提供、契約と解約、本人確認と独身証明の取得、相談窓口などが確かめられるとしています。[大阪府：マッチングアプリ等を安全に利用するために（2026年5月29日更新）](" + SRC.osakaCert + ")。取得している認証があれば、正式な名前、運営団体、取得した年を書きます。取得していない認証のマークを使わないでください。",
            "成婚した方の体験談や口コミを載せるときは、本人の同意を取り、謝礼の有無や広告であることを隠さないようにします。日本では2023年10月1日から、広告であることを隠した表示（ステルスマーケティング）は景品表示法の不当表示になりました。[消費者庁：ステルスマーケティング](" + SRC.caaStealth + ")。英語の調査では、Googleの AI Overviews の引用元に掲示板の投稿が多く使われていたという結果もあります（マッチングアプリについての米国の調査）。[5W：Dating App AI Visibility Index 2026](" + SRC.fiveW + ")。外の口コミは自分では書き換えられないので、自社サイトで料金と定義をはっきり書いておくことが、誤解を減らすいちばん確かな方法です。",
          ],
        },
        {
          heading: "構造化データ：結婚相談所専用の型はない",
          paragraphs: [
            `schema.orgには、結婚相談所やマッチメーカーのための専用の型はありません。「専門サービス」にあたる ProfessionalService は、Service と混同されるため非推奨になっています。[schema.org：ProfessionalService](${SRC.professionalService})。相談所は LocalBusiness として出し、無料カウンセリングや料金プランを Service（料金は Offer）として紐づけるのが無理のない形です。`,
            `Nurevo AEOで無料カウンセリングをサービスに入れると、次のような形で出力されます（値は例です）。`,
          ],
          code: SCHEMA_JA,
          after: [
            "構造化データの値は、ページ本文と一致させます。料金プランもサービスとして入れられますが、Offerに入るのは1つの金額だけです。月会費を金額に入れ、入会金・成婚料などの内訳はサービスの説明と本文の表に書いてください。",
          ],
        },
        {
          heading: "WordPressの相談所サイトでの設定手順",
          list: [
            "[WordPress.org](" + WP_ORG + ")からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。0.9.1からはSEO SIMPLE PACKやVK All in One Expansion Unitとも、構造化データを重複させずに併用できます。",
            "初回の設定ウィザードで「その他」を選びます。「専門サービス」はschema.orgで非推奨の ProfessionalService になるため選びません。「その他」は業種の型を指定しない設定で、住所・電話番号・営業時間のどれかが入っていればLocalBusinessとして出力されます。",
            "相談所の名前・住所（面談の場所）・電話番号・営業時間（定休日を含む）・説明を確認します。説明には、対象の年代や地域、加盟している連盟、オンライン面談の有無を書きます。",
            "設定画面のサービスに、無料カウンセリングと料金プランを1つずつ登録します（最大20件）。名前、時間（分）、税込の料金と通貨（JPY）、カテゴリ、予約ページのURL、説明を入れると、Service・Offer・予約の操作（ReserveAction）として出力され、llms.txtにも1行ずつ載ります。料金プランの説明には「入会金◯円・登録料◯円・成婚料◯円（いずれも税込）」のように内訳を書きます。",
            "よく聞かれる質問（成婚の定義、成婚料の時期、休会、中途解約、必要な書類、オンラインでの活動）をFAQに入れます。FAQは、Nurevo FAQブロック（または[nurevo_faq]ショートコード）を置いたページのFAQPageに追加されます。料金ページだけの質問は、ブロックエディタのNurevo AEOパネルでそのページ専用に入れられます。",
            "総額の例、成婚の定義、会員数、解約と休会のルールは、固定ページの本文に表で書きます。終わったキャンペーンやイベント（婚活パーティーなど）のページは、ブロックエディタのNurevo AEOパネルでllms.txtに載せない設定にできます。",
            "AEOスコアの画面で診断を実行し、不足をワンクリック修正で直します。外からどう見えるかは[無料のAI可読性チェック](/check)で確かめます。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の構造化データを出さず、SEOプラグインのグラフに足りない住所・電話番号・営業時間・サービス・FAQだけを足します。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/guide/local-business-schema-seo-plugins/)をご覧ください。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "対象の年代・状況、面談の場所（店舗・オンライン）、対応地域が書かれている。",
            "プランごとに入会金・登録料・月会費・お見合い料・成婚料・オプションが税込で、内訳つきで書かれている。",
            "よくある活動期間の総額の例が2〜3通りある（成婚しなかった場合を含む）。",
            "自社の「成婚」の定義と、成婚料が発生する時点が料金の近くに書かれている。",
            "成婚の実績を書く場合、定義・分母・期間・時点が同じ段落にある。",
            "自社の会員数と連盟の会員数が分けて書かれ、どちらにも時点がある。",
            "クーリング・オフ、中途解約の精算、休会のルール、相談の窓口が書かれている。",
            "入会の書類と、取得している認証の正式名・運営団体・取得年が書かれている。体験談は同意を取り、広告であることを隠していない。",
            "名前・住所・電話番号・料金が、サイト・構造化データ・Googleビジネスプロフィール・連盟や比較サイトの掲載でそろっている。",
            "llms.txtに、料金・成婚の定義・解約のルール・無料カウンセリングのページが載っている。[llms.txtとは](/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、婚活中の人が聞きそうな質問を、年代・地域・状況（再婚、仕事が忙しいなど）・予算・活動の仕方の組み合わせで5〜10個つくり、ChatGPTやPerplexityに投げて、相談所が名前やURLで出るか、料金や成婚の定義が正しく書かれているか、引用元が自社サイトか比較サイトかを記録します。AIの回答は回ごとに変わるので、同じ質問を期間をあけて何度か確かめます。料金を改定した月や、比較サイトの掲載を直した月の前後で分けて記録すると、どの変更が効いたかを見やすくなります。測り方の詳細は[AIでの登場率の測り方](/guide/measure-ai-visibility/)にまとめています。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（相談所の名前は含めません）をPerplexityに投げ、回答に相談所の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に相談所が出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "結婚相談所のAI検索対策は、何から始めればいいですか？", a: "プランごとの入会金・登録料・月会費・お見合い料・成婚料と総額の例、自社の成婚の定義、自社と連盟の会員数の区別、解約と休会のルールを本文に表で書くことからです。そのうえで、名前・住所・電話番号・料金をサイト・構造化データ・Googleビジネスプロフィール・比較サイトの掲載でそろえます。" },
        { q: "成婚の定義まで書く必要がありますか？", a: "はい。成婚の定義は相談所ごとに違い、成婚料が発生する時点も変わります。自社の定義が書かれていないと、AIはほかの相談所の定義で答えてしまうことがあります。成婚料の説明の近くに、成婚とする時点と支払いの時期を書いてください。" },
        { q: "連盟の会員数を書いてもいいですか？", a: "書いてかまいませんが、自社の会員数とは分けて、連盟の名前・出典・時点を添えてください。連盟の数字だけを書くと、AIが相談所そのものの規模として答えてしまうことがあります。" },
        { q: "途中で解約したときのルールはどう書けばいいですか？", a: "契約期間が2か月を超え、金額が5万円を超える結婚相手紹介サービスは特定継続的役務提供にあたり、8日以内のクーリング・オフと、中途解約の精算の上限（サービス前は3万円、開始後は受けたサービスの対価＋2万円または契約残額の2割の低いほう）があります。この上限の範囲で、自社の精算の方法を本文に書いてください。この記事は法的な助言ではありません。" },
        { q: "構造化データの型は何を使えばいいですか？", a: "schema.orgには結婚相談所専用の型がなく、ProfessionalServiceは非推奨です。LocalBusinessとして出し、無料カウンセリングや料金プランをServiceとOfferで紐づけるのがおすすめです。" },
        { q: "Nurevo AEOは無料で使えますか？", a: "はい。相談所の連絡先・営業時間・サービス・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](" + WP_ORG + ")" },
        { q: "対策すればChatGPTに相談所が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが相談所の事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが相談所のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GeminiとGoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業や、記事で触れた認証団体・連盟と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },

    en: {
      title: "AI Search for Matchmakers: Fees, Match Rules, Members | Nurevo",
      description: "AEO for marriage agencies and matchmakers: publish the full cost to a match, your own definition of a match, own vs network members, and cancellation rules.",
      h1: "AI search for marriage agencies and matchmakers: how to get AI to read your total fees, what counts as a match, member numbers and cancellation rules correctly",
      lead: "AI search optimization for a marriage agency or matchmaking service comes down to answering, in plain text on your own pages, the questions singles now ask AI: what it costs in total from joining to a match, when the success fee is due, how many members there really are, and what you get back if you quit early. Agencies define a \"match\" differently and count members differently, so if you do not state your own definitions, AI fills the gap from other agencies or comparison sites. Then you publish the same facts consistently in structured data, llms.txt, your Google Business Profile and the comparison sites or networks that list you.",
      intro: [
        "Written November 18, 2026 (JST). The Osaka and Hiroshima prefecture pages, the PR TIMES survey release and the comparison articles were read that day. schema.org types were checked the same day in schema-dts 2.1.0. The Google, National Tax Agency and Consumer Affairs Agency pages were checked on November 1, 2026. The legal examples come from Japan, where marriage agencies (kekkon soudanjo) are a large industry; check the rules where you operate.",
        "This guide is for marriage agencies and matchmakers, whether counselor-led, database matching or online. Dating apps and wedding venues raise different questions and rules, so they are not covered (for venues, see [AI search for wedding venues](/guide/wedding-venue-ai-search/)). AI answers change from day to day and with how a question is phrased. The steps here make your facts readable to AI. They do not guarantee that an AI will mention your agency or rank it anywhere. This article is not legal advice.",
      ],
      sections: [
        {
          heading: "What singles ask AI",
          paragraphs: [
            "Questions about matchmakers stack age, area, how the service works and cost. For example: \"a matchmaker in [city] for a woman in her late thirties with a busy job\", \"an agency that accepts divorced men and offers online consultations\" or \"no success fee and about $X for a year\". For an AI to name your agency, the text on your site has to show that you meet those conditions.",
            "Google says there are no additional requirements or special structured data for appearing in AI Overviews or AI Mode, and that ordinary SEO basics, structured data that matches the visible text and an up-to-date Business Profile are what matter. [Google: AI features and your website](" + SRC.googleAi + "). For a matchmaker too, the work is not a trick; it is writing down, accurately, the amounts and definitions people use to compare.",
          ],
          table: {
            head: ["Question type", "Example", "Facts the answer needs"],
            rows: [
              ["Age or situation and area", "Can I join if I'm divorced and in my forties? Anyone near [station]?", "Who you serve, where you meet clients (office or online), areas covered"],
              ["Total cost", "What does it cost from joining to a match?", "Registration, monthly fee, introduction or date fees, success fee, extras, and an example total"],
              ["What counts as a match", "When do I pay the success fee?", "What your agency calls a match and when the success fee becomes due"],
              ["Members and introductions", "How many members? How many people can I meet a month?", "Your own members versus a shared network, the date, introduction limits"],
              ["Cancelling and pausing", "What if I quit early? Can I pause?", "Cooling-off, how early cancellation is settled, pause length and fees"],
              ["Trust", "Do you check that people are single? Are you certified?", "Documents required at sign-up, identity checks, certifications, complaints contact"],
            ],
          },
        },
        {
          heading: "What the top-ranking articles leave out",
          paragraphs: [
            "We read the top Japanese and English results for marriage agency and matchmaker AI search: a Japanese LLMO guide for marriage agencies, a survey release on which agencies generative AI recommends, comparison articles that list agencies' fees and match definitions, an English GEO guide for matchmakers, a ChatGPT guide for local businesses and a study of dating apps in AI answers. Breaking fees down, writing pause rules, not confusing a network's member count with your own size, and keeping text, FAQ and structured data consistent are covered by the most thorough Japanese guide, and this guide covers them too.",
            "Almost none of them showed, with sources, the legal caps on early-cancellation charges, a pattern for writing your definition of a match, how to present an example total, the actual shape of the structured data, how to set it up in WordPress, or how to check AI answers over time. The English matchmaker guide said businesses with \"over 50 verified reviews\" are favored, without a source. This guide does not use figures we could not trace to a source.",
            "There are clues to what AI reads. In September 2026 a Japanese marketing firm asked ChatGPT and Gemini through their APIs, with web search on, \"Which marriage agency do you recommend?\" 60 times over 10 days. The most-cited sources were ranking and comparison sites: the top one accounted for 24.9% of citations and the second for 18.2%. It was a single question, and the firm sells AI search services. [PR TIMES: Branding Works survey, October 3, 2026 (Japanese)](" + SRC.prtimes + "). Besides your own site, it is worth checking that what comparison sites and networks say about you is current.",
          ],
        },
        {
          heading: "Price the whole journey, not just the monthly fee",
          paragraphs: [
            "Agency costs are split into a registration or joining fee (often shown together as an \"initial fee\"), a monthly fee, a fee per introduction or first date, a success fee, and extras such as profile photos or one-to-one coaching. Comparison articles line agencies up on these items, but what an \"initial fee\" includes varies. If only the monthly fee is prominent, AI can present it as the whole cost. For each plan, show these items and an example total in a table.",
          ],
          table: {
            head: ["Item", "How to write it", "Watch out for"],
            rows: [
              ["Joining and registration", "Joining fee $X + registration $Y", "If you show one \"initial fee\", still break it down. Promotions need dates and conditions"],
              ["Monthly fee", "$X a month, up to N introduction requests", "Put included support (number of meetings with a counselor) on the same line"],
              ["Introduction or date fee", "$X per first meeting / free", "Charged only when a meeting happens, or per request"],
              ["Success fee", "$X, due when you match under our definition", "Put the trigger next to the definition of a match below"],
              ["Extras", "Profile photo session $X (optional)", "Required or optional; whether partners charge separately"],
              ["Example total", "One year to a match: initial fee + 12 months + date fees + success fee = $X", "Two or three typical lengths, including one with no match"],
            ],
          },
          after: [
            "In Japan, prices shown to consumers in advance must include consumption tax, on any medium. [National Tax Agency: total price display (Japanese)](" + SRC.ntaTotal + "). Wherever you operate, say whether tax is included.",
            "If you offer plans with and without a success fee, show totals over the same period so AI can say which is cheaper under which conditions.",
          ],
        },
        {
          heading: "Define \"a match\" in your own words",
          paragraphs: [
            "Agencies define a match differently. One Japanese comparison article lists definitions ranging from \"starting to date with marriage in mind\", \"entering an exclusive relationship\" and \"both confirming they intend to marry\" to \"getting engaged\" and \"leaving the agency because of dating, engagement or marriage\", and notes that each agency also counts its results differently. [Minna no Kekkon Soudanjo: agency ranking, October 27, 2026 (Japanese)](" + SRC.mwed + ")",
            "If you do not publish yours, AI may answer with another agency's, for example that the success fee is due at engagement. Near your fees and success-fee explanation, state these four things:",
          ],
          list: [
            "The point your agency counts as a match (for example, \"when both members confirm they intend to marry and leave the agency together\").",
            "When the success fee becomes due, and the payment deadline.",
            "What happens if the relationship ends after a match (for example, the fee to rejoin).",
            "If you publish a success rate: what was counted (the definition), the denominator, the period and the date. For example: \"Of N members active from April 2025 to March 2026, M left with a match as we define it.\"",
          ],
          after: [
            "A bare \"X% success rate\" gets compared with other agencies' figures that use different definitions and denominators. With the definition and denominator in the same paragraph, an AI quoting the figure is more likely to pass the conditions on with it.",
          ],
        },
        {
          heading: "Separate your own members from the network's",
          paragraphs: [
            "Many Japanese agencies belong to a federation, a network of agencies that share member profiles, and comparison articles note that an agency's member count may include the network's members. [Minna no Kekkon Soudanjo (Japanese)](" + SRC.mwed + "). Shared networks exist elsewhere too. If your site gives only the network figure, AI can present it as the size of your agency.",
          ],
          table: {
            head: ["Figure", "How to write it", "Watch out for"],
            rows: [
              ["Your own members", "N active members (as of October 1, 2026)", "Always give the date; say whether paused members are included"],
              ["Network you belong to", "Member of [network], about N members in total (network's published figure, month and year)", "Source and date for the network figure; if you are in several networks, how overlaps are handled"],
              ["Introduction requests", "Up to N requests sent and M received per month", "Use a table if it differs by plan"],
              ["Gender and age mix", "Share of your members by gender and age band (date)", "If it is the network's figure, say so"],
            ],
          },
          after: [
            "schema.org has a memberOf property for the organizations a business belongs to. [schema.org: memberOf](" + SRC.memberOf + "). Nurevo AEO does not output it. Even if you add it, what AI uses in an answer is the network name and the separation of figures in your text.",
          ],
        },
        {
          heading: "Publish cooling-off, early cancellation and pause rules",
          paragraphs: [
            "In Japan, matchmaking contracts that run over two months and cost over 50,000 yen are \"specified continuous services\" (tokutei keizokuteki ekimu teikyo) under the Act on Specified Commercial Transactions. Clients can cancel under cooling-off within eight days of receiving the legally required document, and after that can cancel at any time within the contract period for any reason. The charge for early cancellation is capped: 30,000 yen before the service starts, and after it starts, the price of services already received plus the lower of 20,000 yen or 20% of the unused amount. [Osaka Prefecture: cancelling a matchmaking contract, updated May 14, 2024 (Japanese)](" + SRC.osakaFaq + "). Hiroshima Prefecture's consumer centre gives the same caps and notes that the contract amount includes joining fees and related goods the contract requires. [Hiroshima Prefecture: early cancellation rights (Japanese)](" + SRC.hiroshima + ")",
            "People considering an agency ask AI about this. On your fee page or a contract-terms page, state at least the following:",
          ],
          list: [
            "The cooling-off period and how to give notice.",
            "How to cancel early and how the refund is calculated (prepaid monthly and initial fees). Do not set terms beyond the legal caps.",
            "Pausing: for how many months, fees while paused, and whether introductions stop.",
            "Any difference in procedure or fees between leaving with a match and leaving for other reasons.",
            "The documents you give before signing, and where to raise a complaint (your own contact and, in Japan, the consumer hotline 188).",
          ],
          after: [
            "For detailed rules, such as what the contract documents must contain, check the latest information from the Consumer Affairs Agency or your consumer authority.",
          ],
        },
        {
          heading: "Sign-up documents, certifications and testimonials",
          paragraphs: [
            "Answer the trust questions in your text too: \"do I need to prove I'm single?\" and \"is this agency legitimate?\". List the documents you require at sign-up (such as a certificate of single status and photo ID, whatever you actually ask for) and how you check them.",
            "Osaka Prefecture describes two private third-party certifications for matchmaking services in Japan: \"IMS certification\" for internet-based services (run by the NPO Marriage Partner Introduction Service Certification Organization) and the \"Maru-teki Mark CMS\" (run by the NPO Japan Life Design Counselor Association). It says they check information given to users, clear contracts and cancellation, identity checks and proof of single status, and a complaints desk. [Osaka Prefecture: using matching services safely, updated May 29, 2026 (Japanese)](" + SRC.osakaCert + "). If you hold a certification, give its official name, the body that runs it and the year you obtained it. Never display a mark you do not hold.",
            "When you publish testimonials from couples, get their consent and do not hide rewards or the fact that something is an advertisement. In Japan, since October 1, 2023, advertising that hides that it is advertising (stealth marketing) is an unfair representation under the Act against Unjustifiable Premiums and Misleading Representations. [Consumer Affairs Agency: stealth marketing (Japanese)](" + SRC.caaStealth + "). A US study of dating apps also found Google AI Overviews citing forum posts heavily: reddit.com in 25 of 41 overviews. [5W: Dating App AI Visibility Index 2026](" + SRC.fiveW + "). You cannot rewrite what others post, so stating your fees and definitions clearly on your own site is the surest way to reduce misunderstandings.",
          ],
        },
        {
          heading: "Structured data: there is no matchmaker type",
          paragraphs: [
            `schema.org has no type for marriage agencies or matchmakers. ProfessionalService has been deprecated because it was confused with Service. [schema.org: ProfessionalService](${SRC.professionalService}). The sensible shape is a LocalBusiness with your free consultation and plans linked as a Service, with the price as an Offer.`,
            `When you enter a free consultation as a service in Nurevo AEO, it is output in this shape (values are examples):`,
          ],
          code: SCHEMA_EN,
          after: [
            "Structured data has to match the visible page. You can add plans as services too, but an Offer holds a single amount. Put the monthly fee as the price, and the breakdown (joining fee, success fee and so on) in the service description and in the table on the page.",
          ],
        },
        {
          heading: "Setting it up on a WordPress agency site",
          list: [
            "Install and activate Nurevo AEO (free) from [WordPress.org](" + WP_ORG + "). Yoast SEO, Rank Math, All in One SEO and Slim SEO keep working. Since 0.9.1 it also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.",
            "In the setup wizard, choose \"Other\". Do not choose \"Professional services\": it sets ProfessionalService, which schema.org has deprecated. \"Other\" sets no business type, and the plugin publishes a LocalBusiness when an address, phone or opening hours are set.",
            "Check your agency name, address (where you meet clients), phone, opening hours (including days closed) and description. In the description, say who you serve and where, which network you belong to and whether you offer online consultations.",
            "Under Services in Settings, add your free consultation and each plan (up to 20): a name, length in minutes, the price including tax, the currency, a category, the booking URL and a description. Each is published as a Service with an Offer and a booking action (ReserveAction), and gets its own line in llms.txt. In each plan's description, give the breakdown, for example \"Joining fee $X, registration $Y, success fee $Z\".",
            "Add the questions people ask most (your definition of a match, when the success fee is due, pausing, early cancellation, required documents, online activity) to the FAQ. FAQs are added to the FAQPage on pages that hold the Nurevo FAQ block (or the [nurevo_faq] shortcode). Questions for the fee page alone can be entered for that page only in the Nurevo AEO panel in the block editor.",
            "Put the example totals, your definition of a match, member figures and cancellation and pause rules in the page text as tables. Pages for past promotions or events (such as singles parties) can be excluded from llms.txt in the same Nurevo AEO panel.",
            "Run a diagnosis on the AEO score screen and fix gaps with one-click fixes. Check how your site looks from outside with the [free AI readability check](/check).",
          ],
          after: [
            "Alongside an SEO plugin, Nurevo AEO does not output a second set of structured data; it adds only the address, phone, hours, services and FAQ the SEO plugin's graph lacks. See [adding business details to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins/).",
          ],
        },
        {
          heading: "Pre-publish checklist",
          list: [
            "Who you serve, where you meet clients (office or online) and the areas you cover are stated.",
            "Each plan shows joining and registration fees, the monthly fee, introduction fees, the success fee and extras, broken down, with tax treatment.",
            "Two or three example totals for typical lengths are shown, including one with no match.",
            "Your definition of a match and when the success fee is due sit next to your fees.",
            "Any success rate has its definition, denominator, period and date in the same paragraph.",
            "Your own member count and the network's are shown separately, each with a date.",
            "Cooling-off, how early cancellation is settled, pause rules and a complaints contact are stated.",
            "Sign-up documents and any certification's official name, body and year are stated. Testimonials have consent and do not hide that they are advertising.",
            "Name, address, phone and fees match across your site, structured data, Google Business Profile and network or comparison listings.",
            "llms.txt lists your fee, match-definition, cancellation and free-consultation pages. [What is llms.txt?](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, write five to ten questions a single person would ask, combining age, area, situation (divorced, busy job and so on), budget and how they want to meet people. Put them to ChatGPT and Perplexity and record whether your agency appears by name or URL, whether fees and your definition of a match are stated correctly, and whether the source cited is your site or a comparison site. Answers vary between runs, so repeat the same questions over time. Recording separately before and after a fee change, or after you correct a comparison-site listing, shows which change made a difference. [How to measure AI visibility](/guide/measure-ai-visibility/)",
            "Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your agency's name) are put to Perplexity, and the plugin records whether the answers named you or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta: how often you appear in AI answers, with competitor comparison and history (currently measured on Perplexity). Both look at a sample of answers, not every answer.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a marriage agency start with AI search?", a: "Write, as text and tables on your pages, each plan's joining, registration, monthly, introduction and success fees with an example total, your own definition of a match, your own member count separated from any network's, and your cancellation and pause rules. Then make your name, address, phone and fees match across structured data, your Google Business Profile and comparison listings." },
        { q: "Do we really need to publish our definition of a match?", a: "Yes. Agencies define a match differently, and that changes when the success fee is due. Without your own definition on the page, AI may answer with another agency's. Put the point you count as a match and when payment is due next to the success fee." },
        { q: "Can we publish our network's member count?", a: "Yes, but keep it separate from your own member count, with the network's name, source and date. If only the network figure appears, AI may present it as the size of your agency." },
        { q: "How should we describe early cancellation?", a: "In Japan, matchmaking contracts over two months and over 50,000 yen are specified continuous services: there is an eight-day cooling-off period and early-cancellation charges are capped (30,000 yen before the service starts; after it starts, the price of services received plus the lower of 20,000 yen or 20% of the unused amount). Within those limits, state how you settle a cancellation on your page, and check the rules where you operate. This article is not legal advice." },
        { q: "Which structured data type should a matchmaker use?", a: "schema.org has no matchmaker type, and ProfessionalService is deprecated. Publish the agency as a LocalBusiness and link your free consultation and plans as Service with Offer." },
        { q: "Is Nurevo AEO free?", a: "Yes. Structured data for your contact details, hours, services and FAQ, plus llms.txt, AI crawler rules and the AEO score, are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](" + WP_ORG + ")" },
        { q: "Will this guarantee our agency appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your agency's website",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Gemini and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them, or with the certification bodies or networks mentioned. This article is not legal advice.",
    },
  },
};
