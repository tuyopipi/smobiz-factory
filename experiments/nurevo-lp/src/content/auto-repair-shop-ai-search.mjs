// Content page: AI search (AEO) for auto repair shops / car inspection (shaken)
// garages / body shops. Industry page.
//
// Written 2026-11-13 (JST). Every claim about Nurevo AEO is one the plugin's
// readme or code makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary):
// the setup wizard's "Professional services" card (ja: 専門サービス; hint
// "Lawyers, accountants, agencies and trades") sets ProfessionalService and its
// family includes AutoRepair and AutomotiveBusiness, so a site set to AutoRepair
// is shown that card and keeps its type (includes/setup-wizard.php,
// webmcp_canary_wizard_site_types); Settings has a free-text "Business type
// (schema.org type)" field (ja: 業種（schema.org型）) that takes one type name;
// AutoRepair and AutomotiveBusiness are in webmcp_canary_local_business_types;
// opening hours in common forms become openingHoursSpecification; services are
// published as Service + llms.txt lines; free monthly check is three questions to
// Perplexity without the business name; Pro measurement runs on Perplexity
// (ChatGPT once configured).
//
// Outside facts:
// - schema.org hierarchy, checked 2026-11-13 against schema-dts 2.1.0 (generated
//   from the schema.org vocabulary; schema.org itself could not be fetched from
//   this run): AutomotiveBusiness is in the LocalBusiness union; AutoRepair,
//   AutoBodyShop, AutoDealer, AutoPartsStore, AutoWash, GasStation,
//   MotorcycleRepair are in the AutomotiveBusiness union.
// - MLIT regional bureau pages read 2026-11-13: 認証 by 地方運輸局長 per 事業場 for
//   特定整備 (Shikoku); 指定工場 = 認証工場 + inspection equipment + 自動車検査員,
//   issues 保安基準適合証, car need not be taken to the 運輸支局 (Tohoku, Shikoku);
//   認証工場 takes the car to the 運輸支局 (Tohoku). 特定整備 in force 令和2年4月1日,
//   電子制御装置整備 = removal/adjustment of forward-sensing cameras / radar /
//   lasers for AEB and lane keeping etc. (Kinki, Kyoto). Transitional period ended
//   令和6年3月31日 (Shikoku leaflet). No statute article numbers are quoted.
// - OBD検査: from 令和6年10月1日 (imports 令和7年10月1日); covers full model changes
//   from 令和3年10月1日 (imports 令和4年10月1日); remove dashcams etc. beforehand
//   (MLIT user page, read 2026-11-13).
// - Google "AI features and your website" (checked 2026-11-12 by the 08:00 run).
// - OpenAI crawlers (checked 2026-10-31).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  autoRepair: "https://schema.org/AutoRepair",
  autoBody: "https://schema.org/AutoBodyShop",
  automotive: "https://schema.org/AutomotiveBusiness",
  openaiBots: "https://developers.openai.com/api/docs/bots",
  tohoku: "https://wwwtb.mlit.go.jp/tohoku/am/am-sub03-021.html",
  shikoku: "https://wwwtb.mlit.go.jp/shikoku/soshiki/gijyutsu/ninsyou.html",
  kinki: "https://wwwtb.mlit.go.jp/kinki/kyoto-honchosya/zidousyatokuteiseibizigyou.htm",
  keika: "https://wwwtb.mlit.go.jp/shikoku/content/keikasoti.pdf",
  obd: "https://www.mlit.go.jp/jidosha/jidosha_OBD_user.html",
};

export default {
  slug: "auto-repair-shop-ai-search",
  targetQueries: [
    "AI search optimization for auto repair shops",
    "how to get my auto shop recommended by ChatGPT",
    "AutoRepair schema markup",
    "整備工場 AI検索対策",
    "車検 ChatGPT 表示",
    "自動車整備 構造化データ",
  ],
  related: ["local-business-schema-seo-plugins", "measure-ai-visibility", "llms-txt", "search-console-ai-features", "aeo-tools-comparison"],
  locales: {
    ja: {
      title: "整備工場・車検のAI検索対策：認証・料金内訳・代車を伝える | Nurevo",
      description: "整備工場・車検・板金のAI検索対策は、認証工場か指定工場か、車検料金の内訳、所要時間と代車、対応車種、電子制御装置整備の認証を本文と構造化データで正確に出すことから。AutoRepair型とWordPressでの手順を解説。",
      h1: "整備工場・車検のAI検索対策：認証・指定の区分、料金の内訳、所要時間と代車をAIに正しく読ませる手順",
      lead: "自動車整備工場・車検店・板金塗装店のAI検索対策（AEO・LLMO）の中心は、認証工場か指定工場（民間車検場）か、車検料金の内訳（法定費用と整備・手数料）、車検にかかる時間と代車、対応できる車種と作業、受付時間と予約方法を、ページ本文と構造化データ（schema.orgのAutoRepair）で正確に、矛盾なく公開することです。この業種で差がつくのは「総額と内訳を分けて書くこと」と「できる作業・できない作業を文字で書くこと」です。",
      intro: [
        "作成日：2026年11月13日（JST）。schema.org・Google・OpenAI・国土交通省の情報は、本文に記した日に確認したものです。制度の細かな条件は、管轄の運輸支局や国土交通省の最新のページで確認してください。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが工場の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "ドライバーはAIに何を聞いているか",
          paragraphs: [
            "ChatGPT、Perplexity、GoogleのAI Overviewsなどに整備工場を探す質問をすると、AIはウェブ上の情報を読んで、いくつかの工場名を挙げて答えをまとめます。聞かれるのは「◯◯市で車検が1日で終わる工場」「代車を無料で貸してくれる車検」「輸入車の修理ができる整備工場」「エーミングができる工場」「土曜に車検を受けられるところ」のように、時間・費用・車種・作業内容がからむ質問です。",
            "整備工場の情報で特にずれやすいのは料金です。車検の費用は、どの工場でも同じ法定費用（自動車重量税・自賠責保険料・検査の手数料）と、工場ごとに違う点検整備の費用・代行の手数料に分かれます。サイトが「車検◯◯円〜」とだけ書いていると、AIはそれが総額なのか手数料だけなのかを判断できず、ほかの工場と比べるときに間違った数字で並べることがあります。",
            `Googleは、AI OverviewsやAI Modeに出るための特別な構造化データや追加の要件はなく、通常のSEOの基本（ページの見える文章と構造化データを一致させる、ビジネスプロフィールを最新にするなど）が大切だとしています（2026年11月12日確認）。[Google：AI features and your website](${SRC.googleAi})。裏技ではなく、工場の事実を正しく、比べられる形で出しておくことが対策の本体です。`,
          ],
        },
        {
          heading: "認証工場・指定工場の違いは、AIにとっても大事な事実",
          paragraphs: [
            `国土交通省の地方運輸局の説明では、ブレーキや操縦装置などを取り外して行う整備（分解整備。現在は電子制御装置整備とあわせて特定整備）を事業として行うには、事業場ごとに地方運輸局長の認証を受ける必要があります。認証工場で車検を受ける場合、車は運輸支局などの検査場に持ち込まれます。指定工場は、認証工場のうち検査の設備と自動車検査員をそなえて指定を受けた工場（いわゆる民間車検場）で、保安基準適合証を交付でき、車を国の検査場に持ち込まずに車検を終えられます（2026年11月13日確認）。[東北運輸局](${SRC.tohoku})／[四国運輸局](${SRC.shikoku})`,
            `2020年4月1日からは特定整備の制度が始まり、自動ブレーキやレーンキープアシストに使う前方のカメラ・レーダーなどの取り外しや調整（いわゆるエーミング）も、認証の対象になりました（電子制御装置整備）。[近畿運輸局](${SRC.kinki})。施行前から作業していた事業者向けの経過措置は2024年3月31日で終わっています。[四国運輸局のチラシ（PDF）](${SRC.keika})`,
            `車検には2024年10月1日から（輸入車は2025年10月1日から）OBD検査（電子装置の検査）が加わりました。対象は2021年10月1日以降（輸入車は2022年10月1日以降）のフルモデルチェンジ車で、国土交通省は、ドライブレコーダーなどを事前に外しておく必要がある場合や、費用は整備工場に確認するよう案内しています。[国土交通省：OBD検査](${SRC.obd})`,
            "つまり「1日で終わる車検」「立ち会い車検」「エーミングのできる工場」「OBD検査に対応」といった質問の答えは、工場の認証・指定の区分と持っている設備で決まります。区分と認証番号、電子制御装置整備の認証の有無を本文に文字で書いておくと、AIはそれを根拠に答えられます。",
          ],
        },
        {
          heading: "公開しておきたい事実と書き方",
          paragraphs: [
            "下の表は、ドライバーの質問に答えるために本文に文字で書いておきたい項目です。右の列は、構造化データやNurevo AEOのどこに入れるかの目安です。",
          ],
          table: {
            head: ["項目", "書き方の例", "構造化データ・設定での扱い"],
            rows: [
              ["認証・指定の区分", "「指定工場（民間車検場）。指定番号◯◯。電子制御装置整備の認証あり」", "専用のプロパティはないため、説明（description）・本文・FAQで伝える"],
              ["車検の料金と内訳", "「軽自動車の例：法定費用◯円＋点検整備◯円＋代行手数料◯円（税込）。部品交換は見積もり後に了承を得てから」", "決まった金額のものだけサービスの料金に入れる。内訳は本文に"],
              ["所要時間", "「立ち会い車検 約60分」「1日車検（朝お預かり・夕方お渡し）」「通常 2〜3日」", "サービスの所要時間（分）。日数は本文とFAQに"],
              ["代車・送迎", "代車の有無、台数、料金（無料か有料か）、予約が必要か、引き取り・納車の対応地域", "本文とFAQ"],
              ["対応車種", "軽・普通車・輸入車・ハイブリッド車・トラック・二輪など。対応しない車種も書く", "説明・サービス・FAQ"],
              ["作業メニュー", "車検、法定点検、オイル交換、タイヤ交換、エーミング、板金塗装、保険修理など", "サービスとして1つずつ登録"],
              ["見積もりと支払い", "見積もりは無料か、事前に金額を知らせるか、支払い方法（カード・ローン）", "FAQ"],
              ["受付時間と予約", "「平日8:30〜18:00、土曜9:00〜17:00、日曜・祝日休み。車検はWeb予約可」", "営業時間（openingHoursSpecification）、サービスの予約URL"],
              ["場所と設備", "住所、最寄りの幹線道路や駅、駐車場、待合室の設備", "住所・電話は構造化データ。ほかは本文"],
            ],
            caption: "項目は目安です。実際に行っていることだけを、今の内容と金額で書きます。料金を変えたら、本文・構造化データ・Googleビジネスプロフィール・車検予約サイトを同じ日に直します。",
          },
          after: [
            "書くときのコツは、AIがそのまま答えに使える一文にすることです。「格安車検！お気軽にご相談ください」より「指定工場のため、立ち会い車検は約60分で終わります。軽自動車の総額の例は◯円（法定費用◯円を含む）です」のほうが、どの質問の答えにも使えます。「最安」「地域No.1」のような比較の表現は、根拠を示せない限り入れないでください。AIは確かめられない表現より、金額や時間のような事実を使います。",
          ],
        },
        {
          heading: "構造化データの型：AutoRepairとAutoBodyShop",
          paragraphs: [
            `schema.orgには、自動車関係の事業者を表す[AutomotiveBusiness](${SRC.automotive})があり、その下に整備・修理の[AutoRepair](${SRC.autoRepair})、板金塗装の[AutoBodyShop](${SRC.autoBody})、販売店のAutoDealer、洗車のAutoWashなどがあります。AutomotiveBusinessはLocalBusiness（実店舗のある事業者）の種類なので、住所や営業時間もそのまま型の定義の中で書けます（2026年11月13日に、schema.orgの語彙から生成されたschema-dts 2.1.0の型定義で確認）。`,
            `Googleのローカルビジネスの構造化データのドキュメントは、できるだけ具体的な種類を使うよう案内しています（2026年10月29日確認）。[Google：ローカルビジネスの構造化データ](${SRC.googleLocal})。整備と車検が中心ならAutoRepair、板金塗装が中心ならAutoBodyShopが目安です。どちらも行う工場は、中心の業務を型にし、もう一方はサービスとして登録します。schema.orgには「車検」や「指定工場」を表す専用の型や項目はないので、それは説明と本文で伝えます。`,
            "Nurevo AEOの業種の欄は、型を1つ入れる形です。住所・電話番号・営業時間は、その型の情報として出力されます。",
          ],
        },
        {
          heading: "WordPressの整備工場サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEO・SEO SIMPLE PACK・VK All in One Expansion Unitはそのまま使えます。`,
            "初回の設定ウィザードで「専門サービス」（説明は「士業、会計事務所、代理店、工事・修理業」）を選びます。そのあと設定画面の「業種（schema.org型）」にAutoRepair（板金塗装が中心ならAutoBodyShop）と入力します。AutoRepairは「専門サービス」の仲間として扱われるので、あとでウィザードを開き直しても型は保たれます。",
            "工場名・住所・電話番号・受付時間・説明を確認します。受付時間は「8:30-18:00、日曜定休」のような一般的な書き方なら構造化データの営業時間として出力され、ウィザードで公開される形を読み上げて確認できます。読み取れない書き方は推測されず、入力したまま出力されます。",
            "説明（description）には、区分と特徴を1〜2文で書きます。例：「◯◯市の指定工場（民間車検場）。立ち会い車検は約60分、代車無料（要予約）。輸入車・ハイブリッド車に対応し、電子制御装置整備（エーミング）の認証あり。」",
            "設定画面で、車検・法定点検・オイル交換・エーミング・板金塗装などをサービスとして1つずつ登録します。サービス名・説明・ページのURL・カテゴリ・所要時間（分）を入れ、予約ページがあれば予約URLに入れます。料金は決まった金額を公開しているものだけ入れます（空欄なら料金は出力されません）。車検のように車種で金額が変わるものは、料金欄を空にして本文に内訳の表を置くほうが誤解を生みません。サービスは工場に紐づいたServiceとして出力され、llms.txtにも1行ずつ載ります。",
            "よくある質問（車検にかかる時間、代車、見積もりと追加の整備、対応車種、OBD検査の準備、支払い方法）を入力し、FAQを見せたいページにNurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。",
            "AEOスコアの画面で診断を実行し、チェックリストに出た不足をワンクリック修正で直します。構造化データ・llms.txt・AIクローラの許可は無料プランで出力されます。",
            "外からどう見えるかを[無料のAI可読性チェック](/check)で確認し、Googleビジネスプロフィールや車検予約サイトの料金・受付時間と一致しているかも見直します。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の事業者情報の構造化データを出さず、足りない住所・電話番号・営業時間・AutoRepairの種類・サービスだけを追加します。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/guide/local-business-schema-seo-plugins)を参照してください。",
            `OpenAIは、OAI-SearchBotを拒否したサイトはChatGPTの検索回答に表示されないとしています（2026年10月31日確認）。[OpenAI：クローラの概要](${SRC.openaiBots})。robots.txtやセキュリティ系のプラグインで、気づかずに止めていないかを確認します。`,
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "認証工場か指定工場か、電子制御装置整備の認証の有無が文字で書かれている。",
            "車検の料金が、法定費用と工場の費用に分けて、税込かどうかと一緒に書かれている。",
            "所要時間（立ち会い・1日・預かり）と代車の条件が書かれている。",
            "対応する車種・しない車種、行う作業・行わない作業が書かれている。",
            "受付時間・休日が画像ではなく文字で書かれ、構造化データの営業時間と同じ。",
            "工場名・住所・電話番号・受付時間が、サイト・Googleビジネスプロフィール・車検予約サイトで一致している。",
            "構造化データの業種が、LocalBusinessやProfessionalServiceのままではなくAutoRepair（またはAutoBodyShop）になっている。",
            "「最安」「地域No.1」など根拠を示せない比較の表現が、本文にも構造化データにも入っていない。",
            "llms.txtに、工場の概要・車検の料金・作業メニュー・予約・アクセス・よくある質問のページが載っている。[llms.txtとは](/guide/llms-txt)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、ドライバーが聞きそうな質問（地域＋車種＋作業＋時間や代車などの条件）を、工場名を入れずにAIに投げて、自分の工場が名前やURLで出てくるかを見ます。あわせて「◯◯自動車の車検は1日で終わりますか？代車はありますか？」と工場名で聞き、答えが今の料金や条件と合っているかも確かめます。間違っていたら、AIが出典にしたページを見て、そのページや外部の掲載情報を直します。AIの回答は回ごとに変わるので、同じ質問を何度か、期間をあけて記録します。手順と記録表は[AIでの登場率の測り方](/guide/measure-ai-visibility)に、GoogleのAI機能での表示回数は[Search Consoleの見方](/guide/search-console-ai-features)にまとめています。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（工場名は含めません）をPerplexityに投げ、回答に工場の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に工場が出る割合を競合と比べて推移で見られます（現在の計測先はPerplexity、ChatGPTは設定され次第）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "整備工場のAI検索対策は、何から始めればいいですか？", a: "認証工場か指定工場か、車検の料金と内訳、所要時間と代車、対応車種、受付時間と予約方法を、ページ本文に文字で正しく書くことからです。そのうえで同じ事実を構造化データとllms.txtで公開し、Googleビジネスプロフィールや車検予約サイトと値をそろえます。" },
        { q: "整備工場に合う構造化データの型は何ですか？", a: "整備・車検が中心ならschema.orgのAutoRepair、板金塗装が中心ならAutoBodyShopが目安です。どちらもAutomotiveBusinessの下にあるLocalBusinessの種類なので、住所や営業時間もそのまま書けます。「車検」や「指定工場」を表す専用の項目はないため、説明と本文で伝えます。" },
        { q: "車検の料金は「◯円〜」と書くだけではだめですか？", a: "AIが総額なのか手数料だけなのかを判断できず、ほかの工場と間違った数字で比べられることがあります。車種ごとの例で、法定費用と工場の費用（点検整備・代行手数料）を分け、税込かどうかも書くのがおすすめです。" },
        { q: "指定工場であることは書いたほうがいいですか？", a: "はい。指定工場は保安基準適合証を交付でき、車を国の検査場に持ち込まずに車検を終えられるため、「1日で終わる車検」「立ち会い車検」の答えに関係します。区分と番号、電子制御装置整備の認証の有無を文字で書くと、AIが根拠にできます。" },
        { q: "OBD検査についても書いたほうがいいですか？", a: "対象車のお客様が気にする点なので、対応していること、事前にドライブレコーダーなどを外す必要があるか、費用の扱いをFAQに書いておくと役立ちます。制度の内容は国土交通省のページで確認し、リンクを付けてください。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種（AutoRepair）・住所・受付時間・サービス・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）です。[WordPress.orgのNurevo AEO](${WP_ORG})` },
        { q: "対策すればChatGPTに工場が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが工場の事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが工場のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },
    en: {
      title: "AI Search for Auto Repair Shops: Prices, Turnaround, Loaners | Nurevo",
      description: "Auto repair shops: publish certifications, price breakdowns, turnaround, loaners and vehicles you service as text and schema. AutoRepair type and WordPress steps.",
      h1: "AI search for auto repair shops: getting AI to read your certifications, price breakdown, turnaround and loaner cars correctly",
      lead: "AI search optimization (AEO) for an auto repair shop, inspection station or body shop comes down to publishing the facts drivers ask about — what you are certified or licensed to do, how a price breaks down, how long a job takes and whether there's a loaner car, which vehicles and jobs you handle, and your hours and booking — accurately and consistently, in the text of your pages and in structured data (schema.org's AutoRepair). Two things set shops apart in AI answers: separating the total from its parts when you publish prices, and stating in words which jobs and vehicles you do and don't take.",
      intro: [
        "Written November 13, 2026 (JST). Facts about schema.org, Google, OpenAI and Japan's Ministry of Land, Infrastructure, Transport and Tourism (MLIT) were checked on the dates given in the text. Licensing rules differ by country; check your own regulator's current rules.",
        "AI answers vary by day and by how a question is phrased. The steps here make your shop's facts easy for AI to read correctly. They cannot guarantee that you appear in an AI answer or rank in any position.",
      ],
      sections: [
        {
          heading: "What drivers ask AI",
          paragraphs: [
            "When someone asks ChatGPT, Perplexity or Google's AI Overviews to find a mechanic, the AI reads what it can find on the web and answers with a few shop names. The questions are rarely just \"mechanic near me\". They look like \"a shop in [town] that can finish an inspection the same day\", \"which garage gives you a free loaner\", \"who repairs European cars near me\", \"where can I get my windshield camera recalibrated\" or \"a shop open on Saturday\". Time, cost, vehicle type and the job are all in the question.",
            "Price is where shop information goes wrong most often. Many jobs combine fixed costs that are the same everywhere (fees, taxes, mandatory charges) with labour and parts that differ by shop. If a site says only \"inspections from $X\", AI can't tell whether that is the total or one part of it, and may line your shop up against others using the wrong number.",
            `Google says there are no extra requirements or special structured data for appearing in AI Overviews or AI Mode, and that the usual SEO basics apply: structured data should match the visible text, and your Business Profile should be up to date (checked November 12, 2026). [Google: AI features and your website](${SRC.googleAi}). The work is not a trick; it is publishing your shop's facts correctly, in a form that can be compared.`,
          ],
        },
        {
          heading: "Certifications are facts AI needs too: Japan as an example",
          paragraphs: [
            "In most countries, what a shop is allowed or certified to do decides which questions it can answer. Japan makes this especially clear, so it's a useful example even if you work elsewhere.",
            `According to MLIT's regional bureaus, a business that does work involving removing brakes, steering and other safety-critical parts (now called \"specified maintenance\", tokutei seibi) needs certification from the regional transport bureau for each workshop. When a certified shop (ninsho kojo) handles the statutory inspection (shaken), the car is taken to a government inspection station. A designated shop (shitei kojo), a certified shop that also has inspection equipment and an authorised inspector, can issue a certificate of conformity, so the car never has to go to the government station (checked November 13, 2026). [Tohoku bureau (Japanese)](${SRC.tohoku}) / [Shikoku bureau (Japanese)](${SRC.shikoku})`,
            `Since April 1, 2020, removing or adjusting the forward cameras and radar used by automatic emergency braking and lane keeping (what the trade calls ADAS calibration or aiming) also needs certification. [Kinki bureau (Japanese)](${SRC.kinki}). The transition period for shops already doing this work ended on March 31, 2024. [Shikoku bureau leaflet, PDF (Japanese)](${SRC.keika}). An on-board diagnostics (OBD) check was added to the inspection from October 1, 2024 (imported cars from October 1, 2025), for new models introduced from October 2021 (imports from October 2022). [MLIT: OBD inspection (Japanese)](${SRC.obd})`,
            "So the answers to \"same-day inspection\", \"inspection while you wait\" or \"who can recalibrate my ADAS camera\" depend on certifications and equipment. Wherever you are, write your certifications, licence numbers and the equipment-dependent jobs you can do as text on the page, so AI has something to cite.",
          ],
        },
        {
          heading: "The facts to publish, and how to write them",
          paragraphs: [
            "The table lists what to write as text on your site so AI can answer drivers' questions. The right-hand column shows where each fact goes in structured data or in Nurevo AEO.",
          ],
          table: {
            head: ["Fact", "How to write it", "Structured data and settings"],
            rows: [
              ["Certifications and licences", "\"Designated inspection station, number [X]. Certified for ADAS calibration.\"", "No dedicated property, so use the description, page text and FAQ"],
              ["Price and its parts", "\"Example for a compact car: mandatory fees $X + inspection labour $Y + handling $Z, tax included. We quote and ask before replacing parts.\"", "Put a price on a service only if it's fixed; the breakdown goes in the text"],
              ["Turnaround", "\"While-you-wait inspection about 60 minutes\", \"drop off in the morning, collect the same evening\", \"usually 2–3 days\"", "Service duration in minutes; days in the text and FAQ"],
              ["Loaner cars and pick-up", "Whether you have them, how many, free or paid, booking needed, the area you collect from", "Text and FAQ"],
              ["Vehicles", "Small cars, standard cars, imports, hybrids and EVs, vans and trucks, motorcycles; say what you don't service", "Description, services and FAQ"],
              ["Jobs", "Inspection, scheduled service, oil change, tyres, ADAS calibration, bodywork and paint, insurance repairs", "One service each"],
              ["Quotes and payment", "Whether quotes are free, whether you confirm costs before work, payment methods and finance", "FAQ"],
              ["Hours and booking", "\"Weekdays 8:30–18:00, Saturday 9:00–17:00, closed Sunday and holidays. Inspections can be booked online.\"", "Opening hours (openingHoursSpecification); booking URL on services"],
              ["Location and facilities", "Address, nearest main road or station, parking, waiting room", "Address and phone in structured data; the rest in text"],
            ],
            caption: "A starting list. Write only what you actually do, at today's prices. When a price changes, update the page, structured data, Google Business Profile and any booking sites on the same day.",
          },
          after: [
            "Write each fact as a sentence an AI could lift straight into an answer. \"Cheap inspections, just ask!\" helps less than \"As a designated station we finish while-you-wait inspections in about 60 minutes. A compact car costs $X in total, including $Y in mandatory fees.\" Leave out \"cheapest\" or \"best in town\" unless you can back them up. AI uses amounts and times far more than claims it can't check.",
          ],
        },
        {
          heading: "Structured data type: AutoRepair and AutoBodyShop",
          paragraphs: [
            `schema.org has [AutomotiveBusiness](${SRC.automotive}) for car-related businesses, with subtypes including [AutoRepair](${SRC.autoRepair}) for repair and servicing, [AutoBodyShop](${SRC.autoBody}) for body and paint, AutoDealer and AutoWash. AutomotiveBusiness is itself a kind of LocalBusiness, so address and opening hours sit inside the type's definition (checked November 13, 2026 against the type definitions in schema-dts 2.1.0, which is generated from the schema.org vocabulary).`,
            `Google's local business structured data documentation asks you to use the most specific subtype you can (checked October 29, 2026). [Google: Local business structured data](${SRC.googleLocal}). Use AutoRepair if servicing and inspections are your main work, AutoBodyShop if it's bodywork. A shop that does both picks its main line as the type and lists the other as a service. schema.org has no type or property for a statutory inspection or a designated station, so those go in the description and text.`,
            "Nurevo AEO's business type field takes one type. Your address, phone number and opening hours are then published on that node.",
          ],
        },
        {
          heading: "Setting it up on a WordPress repair shop site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit keep working as they are.`,
            "In the setup wizard, choose \"Professional services\" (described as \"Lawyers, accountants, agencies and trades\"). Then, in Settings, enter AutoRepair (or AutoBodyShop for a body shop) in \"Business type (schema.org type)\". AutoRepair counts as part of the \"Professional services\" group, so reopening the wizard later keeps the type.",
            "Check the shop name, address, phone, hours and description. Hours written in a common form, like \"8:30-18:00, closed Sunday\", are published as opening hours in structured data, and the wizard reads them back as they will be published. Hours it can't read are not guessed; they are published as you typed them.",
            "In the description, state your certifications and what's distinctive in one or two sentences. For example: \"Designated inspection station in [town]. While-you-wait inspections in about 60 minutes; free loaner cars by appointment. We service imports and hybrids and are certified for ADAS calibration.\"",
            "In Settings, add inspections, scheduled servicing, oil changes, ADAS calibration, bodywork and so on as services, one at a time. Enter the name, description, page URL, category and duration in minutes, and your booking page as the booking URL. Enter a price only where you publish a fixed one (with the price empty, no price is published). For jobs whose price depends on the vehicle, such as inspections, it's clearer to leave the price empty and put a breakdown table on the page. Each service is published as a Service tied to your shop and appears as a line in llms.txt.",
            "Add FAQs (how long an inspection takes, loaner cars, quotes and extra work, which vehicles you service, preparing for an OBD check, payment) and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on the page where they should appear.",
            "Run the check on the AEO score screen and fix what the checklist shows with one-click fixes. Structured data, llms.txt and AI crawler rules are output on the free plan.",
            "See how your site looks from outside with the [free AI readability check](/check), and confirm your prices and hours match your Google Business Profile and any booking sites.",
          ],
          after: [
            "Alongside an SEO plugin, Nurevo AEO does not publish a second business node. It adds only what is missing from the SEO plugin's graph: address, phone, hours, the AutoRepair type and your services. See [adding local business details to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins).",
            `OpenAI says sites that block OAI-SearchBot will not appear in ChatGPT search answers (checked October 31, 2026). [OpenAI: Overview of crawlers](${SRC.openaiBots}). Make sure robots.txt or a security plugin isn't blocking it without you knowing.`,
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Your certifications and licence numbers, including for ADAS calibration if you do it, are written as text.",
            "Prices separate mandatory costs from your own charges and say whether tax is included.",
            "Turnaround (while you wait, same day, drop-off) and loaner car conditions are stated.",
            "Vehicles and jobs you handle, and those you don't, are stated.",
            "Hours and closed days are text, not an image, and match the hours in structured data.",
            "Shop name, address, phone and hours match across your site, Google Business Profile and booking sites.",
            "The structured data type is AutoRepair (or AutoBodyShop) rather than a leftover LocalBusiness or ProfessionalService.",
            "No claims like \"cheapest\" or \"best in town\" that you can't support, in the text or in structured data.",
            "llms.txt lists your overview, prices, services, booking, directions and FAQ pages. [What is llms.txt](/guide/llms-txt)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, ask AI the questions drivers would ask (area + vehicle + job + a condition such as time or a loaner car), without your shop's name, and see whether your shop comes up by name or URL. Then ask by name — \"Can [shop] do an inspection in a day? Do they lend cars?\" — and check the answer against today's prices and terms. If it's wrong, look at which page the AI cited and fix that page or the outside listing. AI answers change from one run to the next, so ask the same questions several times, spaced out, and keep a record. The steps and a log template are in [how to measure AI visibility](/guide/measure-ai-visibility), and impressions in Google's AI features in [the Search Console guide](/guide/search-console-ai-features).",
            "On the Free and Standard plans, Nurevo AEO asks Perplexity three questions built from your business type and area (never your shop's name) once a month and records whether your shop or site appeared. The Pro plan (from $99/month) adds AI visibility measurement in beta: the share of AI answers your shop appears in, compared with competitors over time (measured on Perplexity today, ChatGPT once configured). Both look at a sample of answers, not every answer.",
          ],
        },
      ],
      faqs: [
        { q: "Where should an auto repair shop start with AI search?", a: "Write your certifications, prices with their breakdown, turnaround and loaner cars, the vehicles you service, and your hours and booking as text on your pages. Then publish the same facts in structured data and llms.txt, and make them match your Google Business Profile and booking sites." },
        { q: "Which structured data type fits a repair shop?", a: "schema.org's AutoRepair for servicing and inspections, or AutoBodyShop for bodywork. Both sit under AutomotiveBusiness, which is a LocalBusiness type, so address and hours fit naturally. There is no property for statutory inspections or licences, so put those in the description and text." },
        { q: "Isn't \"inspections from $X\" enough?", a: "AI can't tell whether that is the total or one part, and may compare you with other shops using the wrong number. Give an example per vehicle class that separates mandatory costs from your labour and fees, and say whether tax is included." },
        { q: "Should we mention certifications such as ADAS calibration?", a: "Yes. Questions like \"who can recalibrate my windshield camera\" or \"same-day inspection\" depend on what you are certified and equipped to do. Writing the certification and number as text gives AI something to cite." },
        { q: "Can we add \"cheapest in town\" for AI?", a: "Avoid it unless you can prove it. Advertising rules in many countries restrict unsupported comparative claims, and AI uses checkable amounts and times far more than slogans." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type (AutoRepair), address, hours, services and FAQ structured data, llms.txt, AI crawler rules and the AEO score are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee my shop appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your shop's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
