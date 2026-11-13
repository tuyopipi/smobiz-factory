// Content page: AI search (AEO) for funeral homes / family funeral halls.
// Industry page.
//
// Written 2026-11-13 (JST). Every claim about Nurevo AEO is one the plugin's
// readme or code makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary):
// the setup wizard has no funeral card; "Other" (ja: その他) sets no type, and
// LocalBusiness is in webmcp_canary_local_business_types, entered in Settings'
// free-text "Business type (schema.org type)" field (ja: 業種（schema.org型）);
// opening hours in common forms become openingHoursSpecification, other wording
// is kept as written and not guessed; services are published as Service + llms.txt
// lines (price only when entered); a page can carry its own FAQ (readme FAQ);
// free monthly check is three questions to Perplexity without the business name;
// Pro measurement runs on Perplexity (ChatGPT once configured). One business per
// site: the article does not claim multi-location support.
//
// Outside facts:
// - schema.org, checked 2026-11-13 against schema-dts 2.1.0 (generated from the
//   schema.org vocabulary; schema.org could not be fetched from this run): no
//   funeral-home business type exists; Cemetery and Crematorium are in the
//   CivicStructure union (places), not in the LocalBusiness union.
// - CAA measure order 令和8年9月18日 (2026-09-18) against 株式会社金宝堂
//   (「小さな森の家」): TV ads Mar–May 2025 showing 「家族葬 10.45万円～（税込）」;
//   except in a few cases ¥308,000 or more was needed; 景品表示法 第5条第2号
//   (有利誤認). Read 2026-11-13 from the CAA PDF. The company's own explanation
//   (cremation-only plan) is reported by the press, not in the order, so it is
//   not used.
// - 国民生活センター 墓・葬儀サービス page (updated 2026-07-31, read 2026-11-13):
//   葬儀サービス consultations in PIO-NET 886 / 979 / 1,005 for 2023 / 2024 / 2025
//   (as of 2026-05-31, excludes 経由相談); recent cases include 「ホームページ
//   記載の金額よりも高額になった」.
// - Google "AI features and your website" (checked 2026-11-12 by the 08:00 run).
// - Google local business structured data (checked 2026-10-29).
// - OpenAI crawlers (checked 2026-10-31).
// - FTC "Complying with the Funeral Rule": linked only as where US rules live;
//   its contents could not be fetched this run, so no requirement is stated.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  localBusiness: "https://schema.org/LocalBusiness",
  cemetery: "https://schema.org/Cemetery",
  crematorium: "https://schema.org/Crematorium",
  openaiBots: "https://developers.openai.com/api/docs/bots",
  caaOrder: "https://www.caa.go.jp/notice/assets/representation_cms209_260918_01.pdf",
  kokusen: "https://www.kokusen.go.jp/soudan_topics/data/sougi.html",
  ftc: "https://www.ftc.gov/business-guidance/resources/complying-funeral-rule",
};

export default {
  slug: "funeral-home-ai-search",
  targetQueries: [
    "AI search optimization for funeral homes",
    "how to get a funeral home recommended by ChatGPT",
    "funeral home schema markup",
    "葬儀社 AI検索対策",
    "家族葬 ChatGPT 表示",
    "葬儀社 構造化データ",
  ],
  related: ["local-business-schema-seo-plugins", "measure-ai-visibility", "llms-txt", "search-console-ai-features", "appear-in-chatgpt"],
  locales: {
    ja: {
      title: "葬儀社のAI検索対策：プランの総額・安置・式場をAIに伝える | Nurevo",
      description: "葬儀社・家族葬ホールのAI検索対策は、プラン料金に含まれるもの・含まれないもの、24時間の搬送と安置、式場と宗派の対応を本文と構造化データで正確に出すことから。料金表示の注意とWordPressでの手順を解説。",
      h1: "葬儀社のAI検索対策：プランの総額、搬送・安置、式場と宗派をAIに正しく読ませる手順",
      lead: "葬儀社・家族葬ホールのAI検索対策（AEO・LLMO）の中心は、プラン料金に何が含まれて何が含まれないか（総額の目安）、夜間でも搬送と安置を頼めるか、どの式場をどの人数で使えるか、宗派や無宗教の葬儀に対応するかを、ページ本文と構造化データで正確に、矛盾なく公開することです。この業種で差がつくのは「最低料金」ではなく「よくある形の総額と、追加になる条件」を文字で書くことです。",
      intro: [
        "作成日：2026年11月13日（JST）。schema.org・Google・OpenAI・消費者庁・国民生活センターの情報は、本文に記した日に確認したものです。表示のルールの細かな判断は、消費者庁のガイドラインや専門家に確認してください。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが葬儀社の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "家族はAIに何を聞いているか：急ぎの質問と、事前の質問",
          paragraphs: [
            "葬儀社を探す質問は、大きく2つに分かれます。1つは、家族が亡くなった直後の急ぎの質問です。「夜中に病院から搬送してくれる葬儀社」「自宅に連れて帰れない場合の安置場所」「◯◯市で今から頼める家族葬」のように、時間と場所がからみます。もう1つは、事前の相談です。「家族葬の費用は総額でいくら」「火葬式と一日葬の違い」「浄土真宗に対応している斎場」「無宗教の式はできるか」のように、比べて決めるための質問です。",
            "ChatGPT、Perplexity、GoogleのAI Overviewsなどは、ウェブ上の情報を読んで、いくつかの葬儀社名を挙げて答えをまとめます。急ぎの質問では、AIが「24時間対応」「搬送できる地域」「安置施設の有無」を読み取れないと、候補に入りにくくなります。事前の質問では、料金の書き方が答えの正確さを左右します。",
            `Googleは、AI OverviewsやAI Modeに出るための特別な構造化データや追加の要件はなく、通常のSEOの基本（ページの見える文章と構造化データを一致させる、ビジネスプロフィールを最新にするなど）が大切だとしています（2026年11月12日確認）。[Google：AI features and your website](${SRC.googleAi})。裏技ではなく、葬儀社の事実を正しく、比べられる形で出しておくことが対策の本体です。`,
          ],
        },
        {
          heading: "料金の書き方が、AIの答えの正確さを決める",
          paragraphs: [
            `葬儀の料金は、相談が多い分野です。国民生活センターの「墓・葬儀サービス」のページでは、葬儀サービスに関する相談（PIO-NETに登録されたもの）は2023年度886件、2024年度979件、2025年度1,005件と増えていて、最近の事例には「ホームページ記載の金額よりも高額になった」というものが挙がっています（2026年5月31日現在の件数。2026年11月13日確認）。[国民生活センター：墓・葬儀サービス](${SRC.kokusen})`,
            `表示の面でも注意が必要です。消費者庁は2026年9月18日、家族葬の貸切ホールの事業者に対し、テレビCMで「家族葬 10.45万円～（税込）」と表示していたものの、実際には僅かな場合を除き30万8,000円以上の費用が必要だったとして、景品表示法（有利誤認）に基づく措置命令を出しました（2026年11月13日確認）。[消費者庁：措置命令（PDF）](${SRC.caaOrder})`,
            "AIにとっても同じ問題が起きます。サイトに「家族葬◯万円〜」とだけ書いてあると、AIはそれを「家族葬の費用」として答えに使い、ほかの葬儀社の総額と並べてしまうことがあります。最低料金の条件（式場を使わない、参列者◯名まで、安置1日まで など）が文字で近くに書かれていなければ、AIはその条件を知りようがありません。料金ページは「プランに含まれるもの」「含まれないもの（別途かかるもの）」「追加になる条件」「よくある形の総額の例」の4つに分けて書くのが、家族にとってもAIにとっても誤解の少ない形です。",
          ],
          table: {
            head: ["区分", "書く内容の例", "書き方のポイント"],
            rows: [
              ["プランに含まれるもの", "寝台車での搬送（◯kmまで）、安置（◯日まで）、棺・骨壺、祭壇、式場使用料、運営スタッフ", "距離・日数・人数など、上限があるものは数字で"],
              ["含まれないもの", "火葬料（自治体の火葬場の料金）、飲食・返礼品、宗教者へのお礼、遺影の追加、会葬礼状", "「別途」とだけ書かず、何がいくらくらいかかるかの目安や、金額が決まる仕組みを書く"],
              ["追加になる条件", "安置が◯日を超えた場合1日◯円、搬送距離が◯kmを超えた場合、深夜早朝の割増の有無", "条件と金額を1文で"],
              ["総額の例", "「参列者20名・通夜と告別式・自社ホール使用の例：総額◯円（税込、火葬料・飲食・返礼品を含む）」", "何を含めた総額かを必ず併記。例は実際によくある形で"],
              ["見積もりの出し方", "事前相談で見積書を出すか、契約前に総額を示すか、変更時はどう知らせるか", "FAQにも同じ内容を"],
            ],
            caption: "金額は実際の料金を税込で書きます。料金を変えたら、本文・構造化データ・Googleビジネスプロフィール・比較サイトの掲載を同じ日に直します。",
          },
          after: [
            "宗教者へのお礼（お布施など）のように葬儀社が金額を決めないものは、葬儀社として金額を断定せず、「プランには含まれません。寺院とのご相談になります。お付き合いの寺院がない場合は紹介も可能です」のように、扱いだけを正確に書きます。「最安」「地域No.1」のような比較の表現は、根拠を示せない限り入れないでください。",
          ],
        },
        {
          heading: "公開しておきたい事実と書き方",
          paragraphs: [
            "料金以外にも、家族の質問に答えるために本文に文字で書いておきたい項目があります。右の列は、構造化データやNurevo AEOのどこに入れるかの目安です。",
          ],
          table: {
            head: ["項目", "書き方の例", "構造化データ・設定での扱い"],
            rows: [
              ["24時間の受付・搬送", "「ご逝去の連絡は24時間365日、電話◯◯で受け付けます。◯◯市・◯◯町の病院・施設・ご自宅へ伺います」", "電話番号は構造化データ。受付の時間と範囲は説明・本文・FAQ"],
              ["安置", "自社の安置施設の有無、面会できる時間、ご自宅への安置の対応、ドライアイスの扱い", "本文とFAQ"],
              ["式場", "式場ごとの名前・住所・収容人数・駐車場・宿泊の可否・バリアフリー", "式場ごとのページに文字で。会社の住所と混ぜない"],
              ["葬儀の形式", "一般葬・家族葬・一日葬・火葬式（直葬）の違いと、それぞれの所要日数", "サービスとして1つずつ登録"],
              ["宗派・無宗教", "対応できる宗派、無宗教・自由葬の可否、宗教者の紹介ができるか", "説明・FAQ"],
              ["事前相談・会員制度", "事前相談の方法（来館・電話・オンライン）、会員の入会金・特典・解約の扱い", "サービス・FAQ"],
              ["事務所・見学の受付時間", "「事前相談・式場見学 9:00-18:00（要予約）」", "営業時間（openingHoursSpecification）。24時間の電話受付と分ける"],
            ],
            caption: "項目は目安です。実際に行っていることだけを、今の内容で書きます。",
          },
          after: [
            "書くときのコツは、AIがそのまま答えに使える一文にすることです。「心をこめたお見送りをお手伝いします」より「◯◯市の家族葬専門の葬儀社です。24時間、病院からの搬送を受け付け、自社の安置室で面会できます。家族葬の総額の例は◯円（税込、火葬料・飲食を含む）です」のほうが、どの質問の答えにも使えます。",
          ],
        },
        {
          heading: "構造化データの型：葬儀社専用の型はない",
          paragraphs: [
            `schema.orgには、葬儀社を表す専用の型がありません。墓地の[Cemetery](${SRC.cemetery})と火葬場の[Crematorium](${SRC.crematorium})はありますが、どちらも公共の建物・場所（CivicStructure）の種類で、LocalBusiness（実店舗のある事業者）の種類ではありません（2026年11月13日に、schema.orgの語彙から生成されたschema-dts 2.1.0の型定義で確認）。葬儀社の会社を表すのに使うと、事業者ではなく「場所」として読まれます。`,
            `そのため葬儀社は、[LocalBusiness](${SRC.localBusiness})を型にし、「葬儀社」「家族葬」「24時間受付」といった中身は、名前・説明（description）・サービス・本文で伝えるのが素直です。Googleのローカルビジネスの構造化データのドキュメントは、できるだけ具体的な種類を使うよう案内していますが（2026年10月29日確認）、[Google：ローカルビジネスの構造化データ](${SRC.googleLocal})、合う種類がない場合に無理に近い業種（たとえばProfessionalService）を選ぶ必要はありません。違う業種に見えるほうが、AIの誤解を招きます。`,
            "式場が複数ある場合は、会社の情報（本社の住所・24時間の電話）と、各式場の情報（式場の住所・収容人数）を混ぜないことが大切です。Nurevo AEOが出力する事業者情報はサイトにつき1つなので、各式場の住所・収容人数・駐車場は式場ごとのページに文字で書き、llms.txtに式場のページを載せます。",
          ],
        },
        {
          heading: "WordPressの葬儀社サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEO・SEO SIMPLE PACK・VK All in One Expansion Unitはそのまま使えます。`,
            "初回の設定ウィザードで「その他」を選びます。そのあと設定画面の「業種（schema.org型）」にLocalBusinessと入力します。",
            "会社名・住所・電話番号・説明を確認します。電話番号は、24時間つながる番号を使います。営業時間の欄には、事前相談や式場見学を受け付ける時間を「9:00-18:00、水曜定休」のような一般的な書き方で入れると、構造化データの営業時間として出力されます。読み取れない書き方は推測されず、入力したまま出力されます。「ご逝去の連絡は24時間受付」は、営業時間ではなく説明と本文に書くと、見学の時間と混ざりません。",
            "説明（description）には、地域と特徴を1〜2文で書きます。例：「◯◯市の家族葬専門の葬儀社。ご逝去の連絡は24時間受付、◯◯市内の病院・施設へ搬送。自社ホール2か所（各30名まで）と安置室あり。仏式（各宗派）・無宗教の葬儀に対応。」",
            "設定画面で、家族葬・一日葬・火葬式・事前相談などをサービスとして1つずつ登録します。サービス名・説明・ページのURL・カテゴリを入れます。料金は、含まれるものが決まっている金額を公開しているものだけ入れます（空欄なら料金は出力されません）。最低料金だけを入れるとAIが総額と取り違えやすいので、料金欄を空にして、ページ本文の内訳の表に誘導するほうが安全な場合もあります。サービスは会社に紐づいたServiceとして出力され、llms.txtにも1行ずつ載ります。",
            "よくある質問（夜中に亡くなったときの連絡先と流れ、安置の場所と日数、プランに含まれないもの、総額の例、宗派、事前相談、会員制度の解約）を入力し、FAQを見せたいページにNurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。料金ページだけの質問は、そのページ専用のFAQにできます。",
            "AEOスコアの画面で診断を実行し、チェックリストに出た不足をワンクリック修正で直します。構造化データ・llms.txt・AIクローラの許可は無料プランで出力されます。",
            "外からどう見えるかを[無料のAI可読性チェック](/check)で確認し、Googleビジネスプロフィールや葬儀の比較・紹介サイトの料金・電話番号と一致しているかも見直します。",
          ],
          after: [
            "SEOプラグインと一緒に使う場合、Nurevo AEOは2つ目の事業者情報の構造化データを出さず、足りない住所・電話番号・営業時間・サービスだけを追加します。詳しくは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/guide/local-business-schema-seo-plugins)を参照してください。",
            `OpenAIは、OAI-SearchBotを拒否したサイトはChatGPTの検索回答に表示されないとしています（2026年10月31日確認）。[OpenAI：クローラの概要](${SRC.openaiBots})。robots.txtやセキュリティ系のプラグインで、気づかずに止めていないかを確認します。`,
            "訃報やお別れ会の案内ページを載せている場合、故人や遺族の名前が入ります。公開してよい期間を遺族と決め、期間が過ぎたら非公開にします。AIや検索に長く残したくないページは、llms.txtと構造化データの対象から外し、検索エンジンにも出さない設定（noindex）にします。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "プランごとに、含まれるもの・含まれないもの・追加になる条件が文字で書かれている。",
            "よくある形の総額の例が、何を含めた金額かと一緒に、税込で書かれている。",
            "「◯万円〜」の最低料金の近くに、その金額になる条件が書かれている（広告・バナー・構造化データでも同じ）。",
            "24時間の受付電話、搬送できる地域、安置施設の有無が書かれている。",
            "式場ごとに、住所・収容人数・駐車場が文字で書かれ、会社の住所と混ざっていない。",
            "対応できる宗派と、無宗教の葬儀の可否が書かれている。",
            "会社名・住所・電話番号が、サイト・Googleビジネスプロフィール・比較サイトで一致している。",
            "構造化データの業種が、Cemetery・Crematoriumや無関係な業種ではなくLocalBusinessになっている。",
            "「最安」「地域No.1」など根拠を示せない比較の表現が、本文にも構造化データにも入っていない。",
            "llms.txtに、会社概要・料金・各式場・事前相談・よくある質問のページが載っている。[llms.txtとは](/guide/llms-txt)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、家族が聞きそうな質問（地域＋「家族葬」「火葬式」＋「費用」「24時間」「宗派」などの条件）を、会社名を入れずにAIに投げて、自社の名前やURLが出てくるかを見ます。あわせて「◯◯葬祭の家族葬は総額でいくらですか？何が含まれますか？」と会社名で聞き、答えが今の料金と含まれるものに合っているかを確かめます。最低料金が総額のように答えられていたら、AIが出典にしたページを見て、そのページや比較サイトの掲載を直します。AIの回答は回ごとに変わるので、同じ質問を何度か、期間をあけて記録します。手順と記録表は[AIでの登場率の測り方](/guide/measure-ai-visibility)に、GoogleのAI機能での表示回数は[Search Consoleの見方](/guide/search-console-ai-features)にまとめています。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（会社名は含めません）をPerplexityに投げ、回答に会社の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に会社が出る割合を競合と比べて推移で見られます（現在の計測先はPerplexity、ChatGPTは設定され次第）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
          ],
        },
      ],
      faqs: [
        { q: "葬儀社のAI検索対策は、何から始めればいいですか？", a: "料金ページを、プランに含まれるもの・含まれないもの・追加になる条件・総額の例に分けて書き直すことからです。次に24時間の受付と搬送地域、安置、式場ごとの情報、宗派の対応を文字で書き、同じ事実を構造化データとllms.txtで公開します。" },
        { q: "葬儀社に合う構造化データの型は何ですか？", a: "schema.orgには葬儀社専用の型がないため、LocalBusinessを使い、葬儀社であることや24時間受付は名前・説明・サービス・本文で伝えるのが素直です。CemeteryとCrematoriumは公共の場所の型で、事業者を表す型ではありません。" },
        { q: "「家族葬◯万円〜」と書くのはだめですか？", a: "最低料金そのものが禁止されているわけではありませんが、その金額になる条件がすぐ近くに書かれていないと、家族にもAIにも総額と誤解されます。消費者庁は2026年9月、実際には大半で30万8,000円以上かかる家族葬を「10.45万円～」と表示したCMについて措置命令を出しています。総額の例と条件を一緒に書いてください。" },
        { q: "24時間対応は、営業時間に「0:00-24:00」と入れるべきですか？", a: "電話の受付と、事前相談・式場見学の受付時間が違うなら、営業時間には見学などの時間を入れ、24時間の電話受付は説明と本文に書くほうが混ざりません。すべての受付が実際に24時間なら、その旨を本文にも書いたうえで営業時間に入れます。" },
        { q: "お布施の金額も書いたほうがいいですか？", a: "宗教者へのお礼は葬儀社が決めるものではないため、金額を断定して書くのは避け、プランに含まれないこと、相談先、紹介ができるかどうかを書きます。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種（LocalBusiness）・住所・電話・受付時間・サービス・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）です。[WordPress.orgのNurevo AEO](${WP_ORG})` },
        { q: "対策すればChatGPTに会社が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが葬儀社の事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが葬儀社のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unitはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },
    en: {
      title: "AI Search for Funeral Homes: Total Prices, Transfers, Venues | Nurevo",
      description: "Funeral home AI search: publish what packages include and exclude, 24-hour transfers, holding, venues and faiths served. Schema type and WordPress steps.",
      h1: "AI search for funeral homes: making AI read your total prices, transfers and venues correctly",
      lead: "AI search optimization (AEO) for a funeral home comes down to publishing, accurately and consistently in your page text and structured data, what each package includes and leaves out (with an example total), whether families can call at night for a transfer and where the deceased will rest, which venues hold how many people, and which faiths and non-religious services you handle. What sets a funeral home apart here is not a low starting price but a clear typical total and the conditions that change it.",
      intro: [
        "Written 13 November 2026 (JST). Facts from schema.org, Google, OpenAI and the Japanese authorities were checked on the dates given in the text. Funeral pricing rules differ by country; check your own regulator's guidance or ask a professional.",
        "AI answers change by day and by how a question is asked. This guide is about making your facts easy for AI to read correctly; it does not guarantee that you will appear in AI answers or rank higher.",
      ],
      sections: [
        {
          heading: "What families ask AI: urgent questions and planning questions",
          paragraphs: [
            "Questions about funeral homes fall into two groups. The first come right after a death: \"a funeral home that can collect from the hospital tonight\", \"where can the body rest if we can't take them home\", \"a small family funeral we can arrange today in [town]\". Time and place matter. The second are planning questions: \"how much does a small funeral cost in total\", \"what's the difference between direct cremation and a one-day service\", \"a funeral home that handles Buddhist rites\", \"can we have a non-religious service\". Families use these to compare.",
            "ChatGPT, Perplexity and Google's AI Overviews read the web and answer by naming a few funeral homes. For urgent questions, if AI can't find that you take calls around the clock, which areas you collect from and whether you have a place for the deceased to rest, you are less likely to be a candidate. For planning questions, the way you write prices decides how accurate the answer is.",
            `Google says there are no special structured data or extra requirements for appearing in AI Overviews or AI Mode, and that ordinary SEO basics matter, such as matching structured data to the visible text and keeping your Business Profile current (checked 12 November 2026). [Google: AI features and your website](${SRC.googleAi}). The work is not a trick; it is publishing your facts correctly and in a form people can compare.`,
          ],
        },
        {
          heading: "How you write prices decides how accurate AI answers are",
          paragraphs: [
            `Funeral prices are a common source of complaints. In Japan, the National Consumer Affairs Center's page on graves and funeral services shows consultations about funeral services registered in its database rising from 886 in fiscal 2023 to 979 in fiscal 2024 and 1,005 in fiscal 2025 (counts as of 31 May 2026), and lists recent cases where the final bill was higher than the amount shown on the funeral home's website (checked 13 November 2026). [National Consumer Affairs Center of Japan (Japanese)](${SRC.kokusen})`,
            `Regulators act on this too. On 18 September 2026, Japan's Consumer Affairs Agency issued an order against a family-funeral hall operator whose TV commercials showed \"family funeral from ¥104,500 (tax incl.)\" when, except in a few cases, ¥308,000 or more was actually needed, finding the ads misleading about price under Japan's Act against Unjustifiable Premiums and Misleading Representations (checked 13 November 2026). [Consumer Affairs Agency order (PDF, Japanese)](${SRC.caaOrder}). In the United States, price disclosure by funeral providers is covered by the FTC's Funeral Rule; see the [FTC's compliance guide](${SRC.ftc}) for what applies to you.`,
            "AI runs into the same problem. If your site only says \"funerals from $X\", AI may quote that as the cost of a funeral and line it up against other homes' totals. Unless the conditions for the starting price (no venue, up to a certain number of guests, one day of holding) are written next to it, AI has no way to know them. Splitting your price page into what's included, what's not, what triggers extra charges and an example total is the clearest form for families and for AI alike.",
          ],
          table: {
            head: ["Part", "What to write", "Tips"],
            rows: [
              ["Included in the package", "Transfer by private ambulance (up to X miles), holding (up to X days), casket or urn, set-up, venue fee, staff", "Give numbers for anything with a limit: distance, days, guests"],
              ["Not included", "Cremation or cemetery fees, catering and gifts, payments to clergy, extra photos, printed materials", "Don't just write \"extra\". Say roughly what each costs or how the amount is set"],
              ["Conditions for extra charges", "Holding beyond X days at $Y a day, transfers beyond X miles, night or early-morning surcharges", "One sentence per condition, with the amount"],
              ["Example total", "\"Example: 20 guests, visitation and service, our chapel: $X in total (incl. tax, cremation fee, catering)\"", "Always say what the total includes. Use a common real case"],
              ["How you quote", "Whether you give a written estimate at planning, show the total before contract, and how changes are communicated", "Repeat it in your FAQ"],
            ],
            caption: "Write your real prices, including tax where it applies. When prices change, update the page, structured data, Google Business Profile and any comparison listings on the same day.",
          },
          after: [
            "For amounts you don't set yourself, such as an honorarium for clergy, don't state a figure; say that it isn't included, who to discuss it with, and whether you can make an introduction. Avoid \"cheapest\" or \"number one in the area\" unless you can prove it.",
          ],
        },
        {
          heading: "The facts to publish, and how to write them",
          paragraphs: [
            "Beyond prices, these are the items to write as text so AI can answer families' questions. The right-hand column shows where each goes in structured data or in Nurevo AEO.",
          ],
          table: {
            head: ["Item", "Example wording", "Structured data / settings"],
            rows: [
              ["24-hour calls and transfers", "\"We take calls 24 hours a day on [number] and collect from hospitals, care homes and private homes in [areas].\"", "Phone in structured data; hours and area in the description, text and FAQ"],
              ["Holding", "Whether you have your own holding room, visiting hours, whether you support resting at home", "Text and FAQ"],
              ["Venues", "Each venue's name, address, capacity, parking, overnight stays, accessibility", "As text on one page per venue; don't mix with the company address"],
              ["Service types", "Traditional, small family, one-day service, direct cremation, and how many days each takes", "Register each as a service"],
              ["Faiths and non-religious", "Which traditions you handle, whether you do non-religious services, whether you can introduce clergy", "Description and FAQ"],
              ["Pre-planning and memberships", "How to arrange a planning meeting (in person, phone, online), membership fees, benefits and cancellation", "Services and FAQ"],
              ["Office and viewing hours", "\"Planning meetings and venue viewings 9:00-18:00 (by appointment)\"", "Opening hours (openingHoursSpecification), kept separate from 24-hour calls"],
            ],
            caption: "These are guidelines. Write only what you actually do, as it is today.",
          },
          after: [
            "Write sentences AI can lift straight into an answer. \"We walk with you through every farewell\" helps less than \"A family funeral home in [town]. We collect from hospitals 24 hours a day and families can visit in our holding room. A typical family funeral totals $X including tax, cremation fee and catering.\"",
          ],
        },
        {
          heading: "Structured data type: there is no funeral home type",
          paragraphs: [
            `schema.org has no type for funeral homes. It has [Cemetery](${SRC.cemetery}) and [Crematorium](${SRC.crematorium}), but both are kinds of CivicStructure (public places), not kinds of LocalBusiness (checked 13 November 2026 against the type definitions in schema-dts 2.1.0, generated from the schema.org vocabulary). Using them for your company tells machines you are a place rather than a business.`,
            `So the simple choice is [LocalBusiness](${SRC.localBusiness}), with \"funeral home\", \"family funerals\" and \"24-hour calls\" conveyed through your name, description, services and page text. Google's local business documentation asks you to use the most specific type you can (checked 29 October 2026), [Google: local business structured data](${SRC.googleLocal}), but when no type fits there is no need to force a near one such as ProfessionalService; looking like a different trade is more likely to mislead AI.`,
            "If you have several venues, keep company facts (head office address, 24-hour phone) separate from venue facts (venue address, capacity). Nurevo AEO publishes one business per site, so write each venue's address, capacity and parking as text on its own page, and list the venue pages in llms.txt.",
          ],
        },
        {
          heading: "Setting it up on a WordPress funeral home site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit keep working as they are.`,
            "In the setup wizard, choose \"Other\". Then, in Settings, enter LocalBusiness in \"Business type (schema.org type)\".",
            "Check your name, address, phone and description. Use the number that is answered 24 hours a day. In opening hours, enter the hours for planning meetings and venue viewings in a common form such as \"9:00-18:00, closed Wednesday\"; it is published as opening hours in structured data. Wording the plugin can't read is not guessed and is published as written. Put \"calls taken 24 hours a day\" in the description and text rather than in opening hours, so it isn't mixed up with viewing hours.",
            "In the description, give your area and what you offer in one or two sentences, for example: \"Family funeral home in [town]. Calls taken 24 hours a day; we collect from hospitals across [area]. Two chapels (up to 30 guests each) and a holding room. Buddhist, Christian and non-religious services.\"",
            "In Settings, add family funerals, one-day services, direct cremation, pre-planning and so on as services, one at a time, with a name, description, page URL and category. Enter a price only where you publish a fixed amount with a defined scope (with the price empty, no price is published). A starting price alone is easy for AI to mistake for a total, so it can be safer to leave the price empty and point to the breakdown table on the page. Each service is published as a Service tied to your business and appears as a line in llms.txt.",
            "Enter your FAQ (who to call at night and what happens next, where and how long the deceased can rest, what packages don't include, an example total, faiths, pre-planning, cancelling a membership), and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on the pages that should show it. Questions that belong only on the price page can be that page's own FAQ.",
            "Run a diagnosis on the AEO score screen and fix what the checklist shows with one-click fixes. Structured data, llms.txt and AI crawler access are on the free plan.",
            "Check how your site looks from outside with the [free AI readability check](/check), and confirm that prices and phone numbers match your Google Business Profile and any comparison listings.",
          ],
          after: [
            "When an SEO plugin is active, Nurevo AEO doesn't add a second business entity; it only adds the address, phone, opening hours and services that are missing. See [how to add local business details to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins).",
            `OpenAI says sites that disallow OAI-SearchBot won't be shown in ChatGPT's search answers (checked 31 October 2026). [OpenAI: crawler overview](${SRC.openaiBots}). Make sure robots.txt or a security plugin isn't blocking it without your knowledge.`,
            "Obituary and memorial notice pages contain the names of the deceased and their family. Agree with the family how long a notice stays up and unpublish it when that period ends. For pages you don't want to linger in AI or search, exclude them from llms.txt and structured data and set them to noindex.",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Each package says, in text, what's included, what isn't, and what triggers extra charges.",
            "An example total for a common case is shown with what it includes and whether tax is included.",
            "Any \"from $X\" price has the conditions for that price right next to it (in ads, banners and structured data too).",
            "Your 24-hour number, the areas you collect from and whether you have a holding room are written down.",
            "Each venue's address, capacity and parking are written as text and not mixed with the company address.",
            "The faiths you serve and whether you hold non-religious services are stated.",
            "Your name, address and phone match across your site, Google Business Profile and comparison listings.",
            "Your structured data type is LocalBusiness, not Cemetery, Crematorium or an unrelated trade.",
            "No claim you can't prove, such as \"cheapest\" or \"number one in the area\", appears in text or structured data.",
            "llms.txt lists your about, prices, each venue, pre-planning and FAQ pages. [What is llms.txt](/guide/llms-txt)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once things are in order, ask AI the questions families would ask (area plus \"family funeral\" or \"direct cremation\" plus conditions such as cost, 24 hours or faith) without your name, and see whether your name or URL appears. Also ask by name, for example \"How much does a family funeral at [your name] cost in total, and what's included?\", and check that the answer matches your current prices and inclusions. If a starting price is being quoted as a total, look at the page AI cited and fix it or the listing it came from. AI answers vary from one run to the next, so ask the same questions several times, spaced out, and keep a record. The method and a record sheet are in [how to measure AI visibility](/guide/measure-ai-visibility); impressions in Google's AI features are covered in [the Search Console guide](/guide/search-console-ai-features).",
            "On the Free and Standard plans, Nurevo AEO sends Perplexity three questions built from your business type and area once a month (without your name) and records whether your name or site appeared. On the Pro plan (from $99/month), AI visibility measurement (beta) shows how often you appear in AI answers compared with competitors over time (currently measured on Perplexity, with ChatGPT once configured). Both look at samples of answers; neither observes every answer.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a funeral home start with AI search?", a: "Rewrite your price page into what's included, what isn't, conditions for extra charges and an example total. Then write your 24-hour number and collection area, holding, each venue and the faiths you serve as text, and publish the same facts in structured data and llms.txt." },
        { q: "Which structured data type fits a funeral home?", a: "schema.org has no funeral home type, so use LocalBusiness and convey that you are a funeral home, and that you take calls 24 hours, through your name, description, services and text. Cemetery and Crematorium are types for public places, not businesses." },
        { q: "Is it wrong to write \"funerals from $X\"?", a: "A starting price isn't banned in itself, but unless the conditions for it sit right beside it, families and AI will read it as a total. In September 2026 Japan's Consumer Affairs Agency issued an order over TV ads showing a family funeral from ¥104,500 when, except in a few cases, ¥308,000 or more was needed. Show an example total and the conditions together." },
        { q: "Should we enter 00:00-24:00 as our opening hours?", a: "If your phone line is 24 hours but planning meetings and viewings are not, put the meeting and viewing hours in opening hours and write the 24-hour phone line in the description and text. If everything really is 24 hours, say so in the text and enter it as your hours." },
        { q: "Should we publish what to pay clergy?", a: "That amount isn't yours to set, so don't state a figure. Say it isn't included, who to discuss it with, and whether you can make an introduction." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type (LocalBusiness), address, phone, hours, services and FAQ structured data, llms.txt, AI crawler rules and the AEO score are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee we appear in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your facts easy for AI to read and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your funeral home's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
