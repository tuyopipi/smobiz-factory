// Content page: AI search (AEO) for law, tax and accounting firms and other
// licensed professionals (士業). Industry page.
//
// Written 2026-11-10 (JST). Every claim about Nurevo AEO is one the plugin's
// readme makes (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt)
// or the plugin code shows: the setup wizard's "Professional services" card
// (includes/setup-wizard.php) sets ProfessionalService and keeps a more specific
// type from its family (LegalService, AccountingService, FinancialService...)
// chosen in the settings picker; services can carry a price (Offer).
//
// Outside facts: Google's LocalBusiness structured data page and "AI features
// and your website" were checked on 2026-10-29 for dental-clinic-ai-search and
// are cited with that date. On 2026-11-10 the primary pages of the bar and tax
// accountant associations could not be fetched, so this page names no article
// numbers and quotes no rule text: it says only that each profession's
// association sets advertising rules and that readers must check them. Do not
// add specific rule contents without fetching and linking the primary text.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleLocal: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
};

export default {
  slug: "professional-firm-ai-search",
  targetQueries: [
    "AI search optimization for law firms",
    "accounting firm ChatGPT visibility",
    "LegalService schema AccountingService",
    "士業 AI検索対策",
    "税理士 ChatGPT 表示 対策",
    "弁護士 AI検索 対策 構造化データ",
  ],
  related: ["local-business-schema-seo-plugins", "measure-ai-visibility", "llms-txt", "appear-in-chatgpt", "aeo-wordpress"],
  locales: {
    ja: {
      title: "士業のAI検索対策：弁護士・税理士・行政書士の事務所をAIに正しく伝える | Nurevo",
      description: "士業のAI検索対策は、取扱業務・対応地域・資格者・料金の決まり方・相談方法を本文とLegalService/AccountingServiceの構造化データで正確に出すこと。広告の規程との両立、WordPressの手順も解説。",
      h1: "士業のAI検索対策：弁護士・税理士・行政書士の事務所をAIに正しく読ませる手順",
      lead: "士業のAI検索対策（AEO）でいちばん大切なのは、「何を扱う事務所か（取扱業務）」「どこの相談を受けるか（対応地域）」「誰が担当するか（資格者と所属会）」「料金はどう決まるか」「どうやって相談するか」を、ページ本文と構造化データ（法律事務所ならLegalService、会計・税理士事務所ならAccountingService）で正確に、矛盾なく公開することです。相談者がAIに聞くのは「◯◯市で相続に強い弁護士」「freeeに対応している税理士」のような、分野と地域と条件がからむ質問なので、AIがその条件を事務所の事実と照らし合わせられる材料をそろえます。士業の広告には所属会の規程があるため、AI向けだからといって実績の誇張や結果の約束を足さないことも同じくらい大切です。",
      intro: [
        "作成日：2026年11月10日（JST）。Googleの情報は2026年10月29日に公式ページで確認したものです。各士業会の広告の規程は、この記事では条文を引用していません。具体的な可否は必ず所属会の規程で確認してください。",
        "AIの回答は日や聞き方によって変わります。この記事の対策は、AIが事務所の事実を正しく読める状態をつくるもので、AIの回答に必ず表示される・順位が上がることを保証するものではありません。この記事は法的な助言ではありません。",
      ],
      sections: [
        {
          heading: "相談者はAIに何を聞き、AIは事務所の何を読むか",
          paragraphs: [
            "士業を探す相談者は、事務所名ではなく「困っていること」と「場所」と「条件」でAIに聞きます。たとえば「◯◯市で相続の相談ができる弁護士、土曜も可」「個人事業主の確定申告をクラウド会計で頼める税理士」「建設業許可の申請を急ぎで頼める行政書士」といった質問です。",
            "こうした質問に答えるため、AIは事務所のサイトや外部の情報を読み、「この事務所はその分野を扱っているか」「その地域の相談を受けるか」「その条件（土日、オンライン、特定の会計ソフトなど）に当てはまるか」を判断材料にします。取扱分野が「企業法務・一般民事」のように大きな言葉でしか書かれていない、対応地域がどこにもない、相談方法が電話番号だけ、という状態では、AIは条件に合うかを判断できず、答えに使いにくくなります。",
            `Googleは、AI OverviewsやAI Modeに出るための追加の要件や特別な構造化データはなく、通常のSEOの基本（構造化データをページの見える文章と一致させる、ビジネスプロフィールの情報を最新にする等）が大切だとしています。[Google：AI features and your website](${SRC.googleAi})。士業のAI検索対策も、裏技ではなく、事務所の事実を相談者の言葉で細かく、正確に出すことが本体です。`,
          ],
        },
        {
          heading: "士業の事務所がサイトで公開しておきたい情報",
          paragraphs: [
            `構造化データでは、事務所をできるだけ具体的な種類で表します。schema.orgでは、法律事務所にはLegalService、会計事務所・税理士事務所にはAccountingServiceがあり、どちらもLocalBusinessの一種です。Googleのローカルビジネスの構造化データでは、nameとaddressが必須、openingHoursSpecification・telephone・urlなどが推奨で、できるだけ具体的な種類を使うよう案内されています。[Google：ローカルビジネスの構造化データ](${SRC.googleLocal})`,
          ],
          table: {
            head: ["情報", "ページ本文での書き方", "構造化データ"],
            rows: [
              ["事務所名", "登録上の正式名称を表記ゆれなく。Googleビジネスプロフィール・名刺・看板と同じに", "name（必須）"],
              ["所在地・アクセス", "郵便番号から建物名・階数まで。最寄り駅と徒歩分数も文字で", "address（必須）"],
              ["取扱業務", "「相続」「離婚」ではなく「遺産分割協議」「遺言書の作成」「相続税申告」のように、相談者が使う言葉で業務ごとに", "サービス（Service）として事務所に紐づける"],
              ["対応地域・相談方法", "来所できる地域、オンライン相談の可否、出張の範囲を文字で", "本文で明記（下のWordPressの手順を参照）"],
              ["資格者", "担当する資格者の氏名・資格・所属会・登録番号、得意分野の経歴", "本文で明記"],
              ["料金の決まり方", "初回相談の有無と料金、着手金・報酬金・顧問料などが何で決まるか。決まった金額のものは税込で", "金額が決まっているものだけサービスの価格（Offer）に"],
              ["受付時間・連絡先", "電話・フォームの受付時間、土日夜間の扱い", "openingHoursSpecification・telephone（推奨）"],
              ["よくある質問", "初回相談で用意するもの、費用の支払い時期、守秘の扱いなど、実際によく聞かれること", "FAQPage（ページに見えているFAQにだけ付ける）"],
            ],
            caption: "構造化データの必須・推奨は、2026年10月29日時点のGoogleのローカルビジネスのドキュメントによります。",
          },
          after: [
            "大切なのは、本文・構造化データ・Googleビジネスプロフィール・llms.txt・士業のポータルサイトのプロフィールで、同じ事実が同じ値になっていることです。事務所の移転、資格者の入退所、取扱業務の追加があったら、すべてを一緒に更新します。",
          ],
        },
        {
          heading: "取扱業務は「資格の範囲内」で、相談者の言葉で書く",
          paragraphs: [
            "士業は、資格ごとに扱える業務が法律で決まっています。AIは取扱業務の記述をそのまま答えに使うことがあるので、業務一覧は自分の資格で受けられる範囲だけを書きます。他の士業と連携して受ける業務（たとえば行政書士事務所の相続手続きで、相続税申告は提携の税理士が担当する場合）は、「相続税申告は提携の税理士が担当します」のように、誰がその業務を行うかがはっきりわかる書き方にします。",
            "業務名は、相談者が実際に使う言葉にそろえます。「資産税」「企業法務」のような専門家の分類だけでなく、「親の家を相続したときの名義変更」「取引先が代金を払ってくれない」のように、困りごとから入る見出しやFAQを用意すると、相談者の質問とページの言葉が合いやすくなります。1つの業務に1ページ（または1つの見出し）を割り当て、対象者・流れ・期間の目安・料金の決まり方・必要書類を書くのが基本です。",
          ],
        },
        {
          heading: "広告の規程と守秘義務：AI向けでも書いてはいけないこと",
          paragraphs: [
            "弁護士・税理士・行政書士・司法書士・社会保険労務士などの士業では、それぞれの連合会や所属会が、業務の広告に関する規程や会則を定めています。事務所のウェブサイトも広告として扱われうるので、AI検索対策のために足す文章や構造化データも、その規程の範囲で書く必要があります。",
            "一般に問題になりやすいのは、結果を約束する表現（「必ず勝てる」「確実に節税」）、根拠を示せない数字や順位（「解決実績No.1」）、他の事務所より優れていると示す比較、事実と異なる経歴や肩書きです。何が禁じられ、何が条件付きで認められるかは士業ごとに違うので、所属会の規程や運用の指針を確認し、迷う表現は所属会に問い合わせてください。構造化データもページの内容を機械向けに書いたものなので、本文に書けないことは構造化データにも書かないのが原則です。",
            "解決事例やお客様の声を載せる場合は、守秘義務にも注意します。士業には法律上の守秘義務があり、依頼者が特定されうる事例を本人の同意なく載せることはできません。事例は依頼者の同意を得たうえで、業種・地域・金額などで特定されないよう抽象化し、「事案の概要」「対応」「結果」を誇張せずに書きます。AIにとっては、件数や派手な言葉よりも、どんな相談をどう扱ったかが具体的にわかる記述のほうが、取扱業務を判断する材料になります。",
          ],
        },
        {
          heading: "料金ページの書き方：金額を出せないものは「決まり方」を書く",
          paragraphs: [
            "相談者がAIに聞く質問には「◯◯の費用はいくらくらい」が多く含まれます。士業の料金は事案によって変わるため金額を書きにくいことがありますが、何も書かないとAIは他の情報源から推測するしかありません。",
            "初回相談料、書類作成のように決まった金額のもの、顧問料の基本額など、決められるものは税込で書きます。事案によって変わるもの（着手金・報酬金、相続税申告の報酬など）は、「何によって決まるか」（経済的利益の額、財産の額、作業量など）と、見積もりを出す時期を書きます。架空の相場を書いたり、他事務所との安さの比較を書いたりするのは避けます。料金表はページに文字の表で置き、画像やPDFだけにしないことも大切です。",
          ],
        },
        {
          heading: "WordPressの士業サイトでの設定手順",
          list: [
            `[WordPress.org](${WP_ORG})からNurevo AEO（無料）をインストールして有効化します。Yoast SEO・Rank Math・All in One SEO・Slim SEOはそのまま使えます。0.9.1からは、SEO SIMPLE PACKやVK All in One Expansion Unit（Lightningでよく使われるプラグイン）とも構造化データが重複しないように動きます。`,
            "初回の設定ウィザードで「専門サービス」（士業、会計事務所、代理店、工事・修理業）を選びます。続けて設定画面の業種で、法律事務所ならLegalService、会計・税理士事務所ならAccountingServiceを選びます（社会保険労務士・行政書士などで当てはまる種類がない場合は、ProfessionalServiceのままで構いません）。事務所名・住所・電話番号・受付時間・説明を確認します。空欄の項目だけがSEOプラグインなどの既存の設定から補われ、入力済みの値は上書きされません。",
            "設定画面で取扱業務をサービスとして1つずつ登録します。金額が決まっているもの（初回相談料など）だけ価格を入れ、事案で変わるものは空欄にして、決まり方を本文に書きます。",
            "よくある質問を入力し、FAQページなどにNurevo FAQブロック（または[nurevo_faq]ショートコード）を置きます。FAQはそのページのFAQPageに追加されます。",
            "対応地域・相談方法・資格者の情報は、事務所概要や資格者紹介のページの本文に書きます。Nurevo AEOのllms.txtはWordPressの内容から作られるので、これらのページが公開されていればAIが読む入口に載ります。",
            "AEOスコアの画面で診断を実行し、チェックリストに出た不足をワンクリック修正で直します。構造化データ・llms.txt・AIクローラの許可（OAI-SearchBot、PerplexityBot、Claude-SearchBotなど）は無料プランで出力されます。最後に[無料のAI可読性チェック](/check)で外からの見え方を確認します。",
          ],
          after: [
            "企業向けの顧問業務が中心で、来所を前提にしない事務所は、ウィザードの「BtoB・SaaS」（Organizationとして出す）を選ぶ考え方もあります。どちらを選んでも、取扱業務・料金の決まり方・相談方法を本文に書くことは変わりません。SEOプラグインと一緒に使う場合の動きは[Yoast・Rank Math・AIOSEOに店舗情報を追加する方法](/ja/guide/local-business-schema-seo-plugins/)をご覧ください。",
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "取扱業務が、業務ごとのページまたは見出しで、相談者の言葉で書かれている。",
            "書いている業務が、自分の資格で受けられる範囲に収まっている。提携先が行う業務は、誰が行うかが明記されている。",
            "対応地域・オンライン相談の可否・受付時間が、文字で書かれている。",
            "資格者の氏名・資格・所属会・登録番号が本文にある。",
            "事務所名・住所・電話番号が、サイト内・Googleビジネスプロフィール・ポータルサイトで一致している。",
            "構造化データの種類が、当てはまる場合はLegalServiceやAccountingServiceになっている。",
            "料金は、決まっているものは税込の金額、変わるものは決まり方が、文字の表で書かれている。",
            "結果の約束・根拠のない数字や順位・他事務所との比較・同意のない事例を、本文にも構造化データにも入れていない。",
            "llms.txtに、事務所概要・取扱業務・料金・アクセス・相談予約のページが載っている。[llms.txtとは](/ja/guide/llms-txt/)",
          ],
        },
        {
          heading: "AIに出ているかを確かめる",
          paragraphs: [
            "整えたあとは、相談者が聞きそうな質問をAIに投げて、事務所が名前やURLで出てくるかを見ます。分野ごと（相続、離婚、確定申告、許認可など）と地域ごとに質問を分け、同じ質問を何度か、期間をあけて確かめるのが現実的です。測り方の詳細は[AIでの登場率の測り方](/ja/guide/measure-ai-visibility/)にまとめています。",
            "Nurevo AEOでは、Free・Standardプランでも月に1回、業種と地域から作った3つの質問（事務所名は含めません）をPerplexityに投げ、回答に事務所の名前やサイトが出たかを記録します。Proプラン（月14,800円〜）では、ベータ版のAI登場率の計測で、AIの回答に事務所が出る割合を競合との比較・推移とあわせて見られます（現在の計測対象はPerplexity）。どちらも回答のサンプルを見るもので、すべての回答を観測するものではありません。",
            "問い合わせフォームに「当事務所を何で知りましたか」の欄を置き、「ChatGPTで聞いた」などの回答を記録しておくと、AI経由の相談がどれくらいあるかを自分の数字で確かめられます。",
          ],
        },
      ],
      faqs: [
        { q: "士業のAI検索対策は、何から始めればいいですか？", a: "取扱業務・対応地域・相談方法・受付時間・料金の決まり方を、ページ本文に文字で正しく書くことからです。そのうえで、同じ事実をLegalServiceやAccountingServiceなどの構造化データとllms.txtで公開し、Googleビジネスプロフィールやポータルサイトのプロフィールと値をそろえます。" },
        { q: "行政書士や社会保険労務士の事務所は、どの構造化データの種類を使えばいいですか？", a: "schema.orgには法律事務所向けのLegalServiceと会計事務所向けのAccountingServiceがありますが、すべての士業に専用の種類があるわけではありません。当てはまる種類がない場合は、ProfessionalServiceなどのLocalBusinessの種類で出し、取扱業務をサービスとして紐づけ、本文で資格と業務範囲を明記します。" },
        { q: "AI向けに解決実績の件数やお客様の声を載せてもいいですか？", a: "所属会の広告の規程と守秘義務の範囲で判断してください。根拠を示せない数字や順位、結果を約束する表現、依頼者が特定されうる事例は避け、事例は同意を得て抽象化して書きます。迷う場合は所属会に確認してください。" },
        { q: "Nurevo AEOは無料で使えますか？", a: `はい。業種（LegalService・AccountingServiceなど）・住所・受付時間・サービス・FAQの構造化データ、llms.txt、AIクローラ設定、AEOスコアは無料プランで使えます。有料プランは常に最新のルールセット（Standard、月3,000円）と、ベータ版のAI登場率の計測（Pro、月14,800円〜）を追加するものです。[Nurevo AEO（WordPress.org）](${WP_ORG})` },
        { q: "対策すればChatGPTに事務所が必ず出ますか？", a: "いいえ。AIの回答は変動し、どのツールや対策でも表示や順位は保証できません。できるのは、AIが事務所の事実を正しく読める状態をつくり、出ているかを継続して確かめることです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "まず、AIが事務所のサイトをどう読んでいるか確認",
        body: "登録不要の無料チェックで、構造化データ・llms.txt・AIクローラの状態がわかります。WordPressなら、Nurevo AEOで不足分を無料で整えられます。",
        label: "無料でAI可読性をチェック",
        href: "/check",
        secondary: { label: "WordPress.orgでNurevo AEOを入手", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。freeeはフリー株式会社の商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、Lightningはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。この記事は法的な助言ではありません。",
    },

    en: {
      title: "AI Search for Law and Accounting Firms: A Practical Guide | Nurevo",
      description: "AEO for law and accounting firms: publish practice areas, service area, who does the work, how fees are set and how to book, in text and LegalService markup.",
      h1: "AI search for law, tax and accounting firms: how to get AI to read your firm's facts correctly",
      lead: "AI search optimization (AEO) for a law, tax or accounting firm comes down to publishing five facts accurately and consistently, both in your page text and in structured data (LegalService for a law firm, AccountingService for an accounting or tax practice): what work you take on, which area you serve, who does the work, how your fees are set and how to book a consultation. People ask AI questions like \"estate lawyer in my city who sees clients on Saturdays\" or \"accountant who works with Xero for sole traders\", so the AI needs facts it can match against those conditions. Professional advertising rules still apply to your website, so do not add success claims or promises just because the audience is a machine.",
      intro: [
        "Written November 10, 2026 (JST). Information from Google was checked on its official pages on October 29, 2026. This article does not quote any bar association's or professional body's rules: check the rules that apply to you before you publish.",
        "AI answers change from day to day and with how a question is phrased. The steps here make your firm's facts readable to AI. They do not guarantee that an AI will mention your firm or rank it anywhere. This article is not legal advice.",
      ],
      sections: [
        {
          heading: "What clients ask AI, and what AI reads about your firm",
          paragraphs: [
            "People looking for a lawyer or an accountant rarely ask AI for a firm by name. They describe their problem, their location and a condition: \"a lawyer near me who handles inheritance disputes and is open on Saturdays\", \"an accountant who does self-employed tax returns with cloud bookkeeping\", \"someone who can file a construction licence application quickly\".",
            "To answer, AI reads your site and other sources and asks three things: does this firm handle that kind of matter, does it take clients from that area, and does it meet the condition (weekends, online meetings, a particular accounting app)? If your practice areas are only described with broad labels such as \"corporate and general civil\", your service area appears nowhere, and the only way to get in touch is a phone number, the AI cannot tell whether you fit, and you become harder to use in an answer.",
            `Google says there are no additional requirements or special structured data for appearing in AI Overviews or AI Mode, and that ordinary SEO basics apply: structured data should match the visible text, and your Business Profile should be up to date. [Google: AI features and your website](${SRC.googleAi}). AEO for a professional firm is not a trick. It is publishing your firm's facts in detail, in your clients' words, and getting them right.`,
          ],
        },
        {
          heading: "What a professional firm should publish on its site",
          paragraphs: [
            `In structured data, describe your firm with the most specific type that fits. schema.org has LegalService for law firms and AccountingService for accounting and tax practices; both are kinds of LocalBusiness. Google's local business documentation lists name and address as required and openingHoursSpecification, telephone and url among the recommended properties, and asks you to use the most specific LocalBusiness sub-type possible. [Google: Local business structured data](${SRC.googleLocal})`,
          ],
          table: {
            head: ["Fact", "How to write it on the page", "Structured data"],
            rows: [
              ["Firm name", "Your registered name, spelled the same everywhere: Business Profile, letterhead, sign", "name (required)"],
              ["Address and directions", "Full postal address including building and floor; nearest station or parking in text", "address (required)"],
              ["Practice areas", "Not just \"family law\" or \"tax\", but the matters clients bring: \"drafting a will\", \"probate\", \"self-employed tax return\"", "Services linked to the firm"],
              ["Service area and how to meet", "Which areas you take clients from, whether you offer online meetings, how far you travel", "In the page text (see the WordPress steps below)"],
              ["Professionals", "Name, qualification, the body they are registered with, registration number, relevant background", "In the page text"],
              ["How fees are set", "Whether the first consultation is free and what it costs; what retainers, success fees or monthly fees depend on; fixed fees with tax included", "A price (Offer) only on services with a fixed fee"],
              ["Contact hours", "When phone and forms are answered; evenings and weekends", "openingHoursSpecification, telephone (recommended)"],
              ["FAQ", "What to bring to a first meeting, when fees are paid, how confidentiality is handled: questions you really get", "FAQPage (only on the page where the FAQ is visible)"],
            ],
            caption: "Required and recommended properties are from Google's local business documentation as of October 29, 2026.",
          },
          after: [
            "What matters most is that the same fact has the same value in your page text, your structured data, your Google Business Profile, your llms.txt and your profiles on legal or accounting directories. When you move office, a professional joins or leaves, or you add a practice area, update all of them together.",
          ],
        },
        {
          heading: "Describe practice areas within your licence, in your clients' words",
          paragraphs: [
            "In most countries, which work a professional may take on is set by law and differs between professions. AI may repeat your list of practice areas in an answer, so list only the work your own qualification allows. For work you hand to a partner professional (for example, a document-preparation firm whose inheritance tax filings are done by a partner accountant), say so plainly: \"Inheritance tax returns are prepared by our partner accountant.\" That way neither a reader nor an AI is left thinking you do the work yourself.",
            "Name each practice area in the words clients use. Alongside professional categories such as \"private client\" or \"commercial litigation\", add headings and FAQ entries that start from the problem: \"transferring a parent's house after they die\", \"a customer won't pay an invoice\". That makes your wording match the question. Give each practice area its own page or at least its own heading, and cover who it is for, the steps, a typical timeline, how the fee is set and what documents to bring.",
          ],
        },
        {
          heading: "Advertising rules and confidentiality: what not to add, even for AI",
          paragraphs: [
            "Lawyers, tax advisers, accountants and other licensed professionals are usually bound by advertising rules set by their bar association, licensing board or professional body. A firm's website is generally treated as advertising, so any text or structured data you add for AI has to stay within those rules too.",
            "The claims that commonly cause problems are promises of outcomes (\"we will win your case\", \"guaranteed tax savings\"), figures or rankings you cannot substantiate (\"No. 1 for settlements\"), comparisons that present you as better than other firms, and inaccurate credentials or titles. What is prohibited, and what is allowed under conditions, differs by profession and jurisdiction, so read your own rules and any guidance on applying them, and ask your professional body when a phrase is borderline. Structured data is your page content written for machines, so the principle is simple: if you cannot say it on the page, do not put it in the markup.",
            "If you publish case studies or client feedback, mind your duty of confidentiality as well. You cannot publish a matter in a way that could identify a client without their consent. Get consent, generalise the industry, place and amounts so the client cannot be identified, and describe the situation, what you did and the result without exaggeration. To an AI deciding what you handle, a concrete account of what kind of matter you took on and how is more useful than a large number or a superlative.",
          ],
        },
        {
          heading: "Writing a fees page: when you cannot give a price, explain how it is set",
          paragraphs: [
            "Many of the questions people put to AI are about cost: \"how much does it cost to…\". Professional fees depend on the matter, so they can be hard to publish, but if you say nothing, the AI can only guess from other sources.",
            "Publish what you can fix, with tax included: the first consultation, fixed-fee documents, the base monthly fee for an advisory retainer. For fees that vary (retainers and success fees, fees for an estate tax return), say what they depend on (the amount at stake, the size of the estate, the work involved) and when you give a quote. Do not publish invented \"typical prices\" or compare yourself with cheaper or dearer firms. Put the fee table on the page as a text table, not only as an image or a PDF.",
          ],
        },
        {
          heading: "Setting it up on a WordPress firm site",
          list: [
            `Install and activate Nurevo AEO (free) from [WordPress.org](${WP_ORG}). Keep Yoast SEO, Rank Math, All in One SEO or Slim SEO as they are. Since 0.9.1 it also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.`,
            "In the setup wizard, choose \"Professional services\" (lawyers, accountants, agencies and trades). Then, under business type in Settings, choose LegalService for a law firm or AccountingService for an accounting or tax practice (if no type fits your profession, ProfessionalService is fine). Check the name, address, phone, contact hours and description. Only blank fields are filled in from your SEO plugin and other existing settings; values you have typed are never overwritten.",
            "Add each practice area as a service in Settings. Enter a price only for fixed-fee services such as a first consultation; leave it blank for fees that vary and explain how they are set on the page.",
            "Enter your frequently asked questions and place the Nurevo FAQ block (or the [nurevo_faq] shortcode) on your FAQ page. The questions are added to that page's FAQPage.",
            "Write your service area, ways to meet and professionals' details in the text of your About and team pages. Nurevo AEO builds llms.txt from your WordPress content, so once those pages are published they are listed in the file AI reads first.",
            "Run the diagnosis on the AEO score screen and fix what the checklist shows with the one-click fixes. Structured data, llms.txt and access for AI search crawlers (OAI-SearchBot, PerplexityBot, Claude-SearchBot and others) are output on the free plan. Finally, see how your site looks from outside with the [free AI readability check](/check).",
          ],
          after: [
            "If your firm mainly serves businesses on retainer and does not expect clients to visit, you can instead choose \"B2B / SaaS\" in the wizard, which publishes an Organization. Either way, practice areas, how fees are set and how to book still belong in the page text. For how this works next to an SEO plugin, see [How to add business details to Yoast, Rank Math and AIOSEO](/guide/local-business-schema-seo-plugins/).",
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "Each practice area has its own page or heading, written in the words clients use.",
            "Every practice area you list is within your own qualification. Work done by a partner professional says who does it.",
            "Service area, online meetings and contact hours are written as text.",
            "Each professional's name, qualification, registering body and registration number are on the page.",
            "Name, address and phone match across your site, your Google Business Profile and directory profiles.",
            "The structured data type is LegalService or AccountingService where one fits.",
            "Fees are in a text table: fixed fees with tax included, and how variable fees are set.",
            "No outcome promises, unsupported figures or rankings, comparisons with other firms, or case studies without consent, in the text or in the markup.",
            "llms.txt lists your firm overview, practice areas, fees, directions and booking pages. [What is llms.txt?](/guide/llms-txt/)",
          ],
        },
        {
          heading: "Checking whether you appear in AI answers",
          paragraphs: [
            "Once the facts are in place, ask AI the questions your clients would ask and see whether your firm comes up by name or URL. Split the questions by practice area (estates, divorce, tax returns, licensing) and by area, and ask the same questions a few times, spread over time. [How to measure AI visibility](/guide/measure-ai-visibility/) covers the method in detail.",
            "Nurevo AEO's Free and Standard plans include a monthly check: three questions built from your business type and area (never your firm's name) are put to Perplexity, and the plugin records whether the answers named your firm or cited your site. The Pro plan (from $99/month) adds AI visibility measurement in beta: how often your firm appears in AI answers, with competitor comparison and history (currently on Perplexity). Both sample answers rather than observing every response.",
            "Add a \"How did you hear about us?\" field to your enquiry form and record answers such as \"I asked ChatGPT\". That gives you your own count of enquiries that came through AI.",
          ],
        },
      ],
      faqs: [
        { q: "Where should a law or accounting firm start with AI search?", a: "Write your practice areas, service area, ways to meet, contact hours and how fees are set correctly as text on your pages. Then publish the same facts as LegalService or AccountingService structured data and in llms.txt, and make sure they match your Google Business Profile and directory profiles." },
        { q: "Which structured data type should other professionals, such as notaries or HR consultants, use?", a: "schema.org has LegalService for law firms and AccountingService for accounting practices, but not every profession has its own type. If none fits, use a LocalBusiness type such as ProfessionalService, link your practice areas to it as services, and state your qualification and scope of work in the page text." },
        { q: "Can I add case results or client reviews for AI?", a: "Decide within your professional advertising rules and your duty of confidentiality. Avoid figures or rankings you cannot substantiate, promises of outcomes, and cases that could identify a client; publish cases only with consent and in generalised form. When in doubt, ask your professional body." },
        { q: "Is Nurevo AEO free?", a: `Yes. Business type (LegalService, AccountingService and others), address, contact hours, services and FAQ structured data, llms.txt, AI crawler rules and the AEO score are on the free plan. The paid plans add an always-current ruleset (Standard, $20/month) and AI visibility measurement in beta (Pro, from $99/month). [Nurevo AEO on WordPress.org](${WP_ORG})` },
        { q: "Will this guarantee my firm appears in ChatGPT?", a: "No. AI answers change, and no tool or technique can guarantee a mention or a position. What you can do is make your firm's facts easy for AI to read and keep checking whether you appear." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "First, see how AI reads your firm's site",
        body: "The free check shows the state of your structured data, llms.txt and AI crawler access, no sign-up required. On WordPress, Nurevo AEO fills the gaps for free.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Get Nurevo AEO on WordPress.org", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google of Google LLC. Xero is a trademark of Xero Limited. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit are trademarks of their respective owners. Nurevo is not affiliated with them. This article is not legal advice.",
    },
  },
};
