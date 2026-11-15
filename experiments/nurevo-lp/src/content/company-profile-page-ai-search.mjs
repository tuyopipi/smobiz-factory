// Content page: AI search (AEO) for a company profile / About page (会社概要).
// Applies to every industry: what people ask AI about a company by name, which
// facts the page should carry, how to remove name and address variants across
// the site and outside it, Organization structured data per Google's docs, and
// how to run it on WordPress with Nurevo AEO.
//
// Written 2026-11-15 (JST). Every claim about Nurevo AEO comes from the
// plugin's readme (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt,
// 0.9.1), docs/developers.md, includes/setup-wizard.php and nurevo-webmcp.php:
// - Business details fields: name, description, address, phone, opening hours,
//   business type (schema.org type), URL, email. The address is published as a
//   PostalAddress with the whole string in streetAddress. The logo is the
//   theme's site logo (custom_logo). No legalName / alternateName /
//   foundingDate / sameAs fields: those go through the developer filter
//   webmcp_canary_business_node (docs/developers.md shows sameAs), and with
//   Yoast SEO / Rank Math / AIOSEO / Slim SEO the values that plugin already
//   sets still win.
// - Extraction fills blank fields only; the WordPress admin email is never
//   used as the business email.
// - Wizard site types: "B2B / SaaS" sets Organization (family Corporation),
//   "Other" sets no type (LocalBusiness if address/phone/hours are filled).
// - llms.txt lists the 30 most recently modified published pages and posts;
//   webmcp_canary_llms_txt_lines adds lines; a page can be left out with
//   "このページをllms.txtに載せない".
// - Free AI check asks questions built from business type and area, never the
//   name, so name questions are checked by hand.
//
// Outside facts and where they were read:
// - Google "Organization structured data" (last updated 2026-09-15 UTC), read
//   2026-11-15: no required properties, add as many relevant ones as apply;
//   recommended list incl. address, alternateName, contactPoint, description,
//   email, foundingDate (ISO 8601), legalName, logo, numberOfEmployees, sameAs,
//   taxID (tax number for the country in address), telephone, url, vatID,
//   iso6523Code, naics; put it on the home page or one page that describes the
//   organization such as an About page, not needed on every page; local
//   businesses use the most specific LocalBusiness subtype; logo at least
//   112x112 px, crawlable and indexable. The page came back in its zh-cn
//   rendering, so no Japanese wording is quoted.
// - Google "AI features and your website": no additional requirements or
//   special schema.org markup for AI Overviews / AI Mode (read 2026-11-01).
// - The 国税庁 法人番号公表サイト and gBizINFO could not be fetched on
//   2026-11-15, so nothing about them is stated beyond pointing to the site.
// Not stated on purpose: statistics about AI and company pages (the top
// articles quote vendor numbers with no primary source), whether taxID should
// carry the Japanese corporate number (Google does not say).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleOrg: "https://developers.google.com/search/docs/appearance/structured-data/organization",
  googleOrgJa: "https://developers.google.com/search/docs/appearance/structured-data/organization?hl=ja",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleAiJa: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja",
  schemaAbout: "https://schema.org/AboutPage",
  houjin: "https://www.houjin-bangou.nta.go.jp/",
};

export default {
  slug: "company-profile-page-ai-search",
  targetQueries: [
    "about page AI search optimization",
    "organization schema for AI search",
    "company information ChatGPT wrong",
    "会社概要 AI検索 対策",
    "会社概要 LLMO 構造化データ",
    "会社情報 AI 表記ゆれ",
  ],
  related: ["aeo-for-wordpress", "how-to-appear-in-chatgpt", "local-business-schema-seo-plugins", "llms-txt", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "会社概要ページのAI検索対策：社名・所在地・設立を正しく読ませる | Nurevo",
      description: "AIに「〇〇はどんな会社？」と聞かれたときの出典になる会社概要ページの作り方。書く項目の表、社名・住所の表記ゆれのそろえ方、同名の会社との区別、Organization構造化データ、WordPressでの手順と確かめ方。",
      h1: "会社概要ページのAI検索対策：社名・所在地・設立・事業内容をAIに正しく読ませる手順",
      lead: "AIに社名で質問されたとき、答えの土台になるのは会社概要ページです。正式な社名と通称、所在地、設立、代表者、事業内容、連絡先を文字で1ページにまとめ、同じ値をOrganizationの構造化データで出し、サイト内のほかのページや社外のプロフィールと表記をそろえる。この3つが対策の中心です。",
      intro: [
        "作成日：2026年11月15日（JST）。対象は、業種を問わず自社サイトに会社概要（会社案内・About）ページを置いている会社・店舗・団体と、その制作を請け負う制作会社です。店舗の住所・営業時間の構造化データは[店舗の構造化データとSEOプラグイン](/guide/local-business-schema-seo-plugins)で扱っています。この記事は「どこの、どんな会社か」を伝えるページに絞ります。",
        "AIの回答は日や聞き方によって変わります。この記事の手順は、AIが読む元の情報を正確にするためのもので、AIの回答に出ることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "AIは会社概要ページを何に使うのか",
          paragraphs: [
            "ChatGPTの検索やPerplexity、GoogleのAIによる概要は、質問に答えるときにウェブのページを読み、出典として示します。社名を含む質問では、その会社自身のサイト、とくに会社の基本情報がまとまったページが読まれやすい候補になります。逆に、会社概要が画像だけだったり、ページごとに住所や社名の書き方が違ったりすると、AIは別のサイトの古い情報や、同じ名前の別の会社の情報で答えを組み立てることがあります。",
            "社名を含む質問には、たとえば次のような型があります。どれも、会社概要ページに文字で書いてあれば答えられる質問です。",
          ],
          list: [
            "「〇〇株式会社はどんな会社？何をしている？」（事業内容）",
            "「〇〇の本社はどこ？大阪にも拠点はある？」（所在地・拠点）",
            "「〇〇は何年設立？代表は誰？」（設立・代表者）",
            "「〇〇というサービスの運営会社は？」（ブランド名と会社名の関係）",
            "「〇〇と△△は同じ会社？」（旧社名・グループ会社・同名の会社）",
            "「〇〇に問い合わせるには？」（電話・フォーム・受付時間）",
          ],
          after: [
            `Googleは、AIによる概要やAIモードに出るための追加の要件や特別な構造化データはなく、通常のSEOの基本がそのまま当てはまるとしています（[Google 検索セントラル：AI 機能とウェブサイト](${SRC.googleAiJa})）。会社概要ページの対策も、AI向けの特別な書き方ではなく、事実を正確に、読める形で、どこでも同じ値で出すことが本体です。`,
          ],
        },
        {
          heading: "会社概要に書く項目と、構造化データとの対応",
          paragraphs: [
            "次の表は、会社概要ページに書いておきたい項目と、AIの答えで起きやすい間違い、対応するOrganizationのプロパティです。プロパティ名はGoogleの[組織（Organization）の構造化データ](" + SRC.googleOrgJa + ")の推奨プロパティから取っています。表の「本文だけ」は、Googleの推奨プロパティにない項目です。",
          ],
          table: {
            head: ["項目", "書き方", "AIで起きやすい間違い", "構造化データ"],
            rows: [
              ["正式な社名", "登記どおりの表記（「株式会社」の位置も含めて）を1回はっきり書く", "「株式会社」の前後を取り違える、似た名前の会社と混ざる", "legalName（nameと違う場合）"],
              ["通称・ブランド名・英語表記", "「サービス名〇〇は、株式会社△△が運営しています」と文で結ぶ", "サービス名だけが知られていて、運営会社がわからない", "alternateName"],
              ["所在地", "本社と拠点を分け、郵便番号から建物名・階まで同じ形式で書く", "移転前の住所、支店の住所を本社として答える", "address（PostalAddress、複数可）"],
              ["連絡先", "代表電話、問い合わせ先、受付時間を書く", "部署の直通番号や古い番号を答える", "telephone、email、contactPoint"],
              ["設立", "年月日まで書く（創業と設立が違う場合は両方を分けて）", "創業年と設立年の取り違え", "foundingDate（ISO 8601、例：2015-04-01）"],
              ["代表者", "役職と氏名をそろえて書く。交代したらすぐ直す", "前任の代表者の名前を答える", "本文だけ（Googleの推奨プロパティにはない）"],
              ["事業内容", "最初の1文で「何を・誰に・どこで」を書き、その後に事業の一覧", "一部の事業だけを本業として答える", "description"],
              ["従業員数・資本金", "数字に「〇年〇月時点」を付ける", "時点のない古い数字がそのまま使われる", "numberOfEmployees（資本金は本文だけ）"],
              ["法人番号", "法人番号がある場合は本文に書く", "同名の会社との区別がつかない", "本文だけ（後述）"],
              ["公式のSNS・外部のプロフィール", "会社が管理しているアカウントだけを並べる", "同名の別アカウントや、なりすましと結び付けられる", "sameAs"],
              ["ロゴ", "サイトのロゴと同じ画像", "ほかの会社のロゴと取り違える", "logo（112×112ピクセル以上）"],
              ["最終更新日", "ページの最後に「〇年〇月〇日更新」", "いつの情報か判断できない", "本文だけ"],
            ],
          },
          after: [
            "法人番号について：Googleの説明では taxID は「address の国に対応する税番号」とされ、日本の法人番号を入れるべきかどうかは書かれていません。そのため、この記事では本文に書くことをすすめ、構造化データに入れるかは各社の判断とします。法人番号は[国税庁 法人番号公表サイト](" + SRC.houjin + ")で調べられるので、会社概要の社名・所在地がそこと食い違っていないかも合わせて確かめておくと安心です。",
            "数字を作らないことも大切です。従業員数や取引社数を大きく見せる書き方は、AIがそのまま引用し、訂正が難しくなります。正確な数字と時点を書きましょう。",
          ],
        },
        {
          heading: "ページの書き方：表だけにしない、画像にしない",
          paragraphs: [
            "多くの会社概要は「項目｜内容」の表だけでできています。表は人にもAIにも読みやすい形ですが、表だけだと「この会社は何をしている会社か」を一言で説明する文がありません。表の前に2〜3文の紹介文を置くと、AIが会社を説明するときにそのまま使える材料になります。",
          ],
          list: [
            "紹介文の1文目に、正式な社名・所在地（市区町村まで）・事業の中身を入れる。例：「株式会社サンプル（大阪市北区）は、中小企業向けに会計ソフトの導入支援をしている会社です。」",
            "2文目に、ブランド名やサービス名との関係、設立年など、同名の会社と区別できる事実を入れる。",
            "その後に「項目｜内容」の表。表はHTMLの表か見出し付きのリストで書き、画像やPDFにしない。",
            "沿革は年と出来事を1行ずつ。社名の変更・移転・合併は「20XX年〇月、旧社名△△から現社名に変更」のように、旧と新の両方を書く。",
            "代表者のあいさつや理念は、事実の表とは別の見出しに分ける。",
            "ページの最後に最終更新日を書く。",
          ],
          after: [
            `ページ全体を表す型として、schema.orgには[AboutPage](${SRC.schemaAbout})があります。SEOプラグインによっては、固定ページの種類としてAboutPageを選べます。必須ではありませんが、ほかの構造化データと矛盾しない範囲で使えます。`,
          ],
        },
        {
          heading: "表記ゆれをそろえる：サイト内と社外の両方",
          paragraphs: [
            "AIは複数のページを読んで答えを組み立てます。社名や住所の書き方がページごとに違うと、同じ会社だと判断されなかったり、古い表記が選ばれたりします。まず、よくあるゆれと、そろえ方を決めます。",
          ],
          table: {
            head: ["ゆれの例", "そろえ方"],
            rows: [
              ["株式会社サンプル／サンプル株式会社／(株)サンプル", "登記どおりの1つに決める。略称の「(株)」は使わない"],
              ["Sample Inc.／Sample Co., Ltd.／SAMPLE", "英語表記を1つに決め、英語ページ・SNS・名刺で同じにする"],
              ["大阪市北区梅田1-2-3／梅田一丁目2番3号／ビル名あり・なし", "番地の書き方とビル名・階の有無を1つに決める"],
              ["06-1234-5678／06（1234）5678／+81-6-1234-5678", "日本語ページは市外局番からのハイフン区切り、英語ページは国番号付きなど、言語ごとに決める"],
              ["旧社名・旧住所が残ったページ", "沿革に変更を書いたうえで、古いページの表記を直す"],
            ],
          },
          after: [
            "サイト内で確かめる場所：会社概要、フッター、お問い合わせ、プライバシーポリシー、特定商取引法に基づく表記、採用ページ、プレスリリース、ブログの著者欄、PDFの会社案内。",
            "社外で確かめる場所：Googleビジネスプロフィール、会社が管理するSNSのプロフィール、求人サイト、業界団体や自治体の名簿、取引先のサイトの紹介文。社外の情報は自社では直せないものもあります。そのときは、自社サイトの情報を正しくそろえたうえで、掲載元に訂正を依頼します。AIが間違えた答えを返している場合の手順は、間違いの種類ごとに分けて対応します。",
          ],
        },
        {
          heading: "同じ名前の会社と区別してもらう",
          paragraphs: [
            "社名がよくある言葉だったり、同じ名前の会社がほかの地域にあったりすると、AIが情報を混ぜることがあります。区別の手がかりは、社名以外の「その会社にしかない事実」です。",
          ],
          list: [
            "紹介文の1文目に、所在地（市区町村まで）と事業内容を入れる。",
            "設立年、法人番号、代表者名など、同名の会社と重ならない事実を会社概要に書く。",
            "構造化データの sameAs に、会社が管理している公式アカウントやプロフィールのURLだけを入れる。同名の他社や、管理していないページは入れない。",
            "ブランド名と会社名が違う場合は、両方のページで「〇〇は△△が運営」と書く。",
            "Googleは、iso6523Code や naics などのプロパティが組織を区別する助けになると説明しています。該当するコードを持っている場合は検討できます。",
          ],
        },
        {
          heading: "Organizationの構造化データ：Googleの説明で押さえること",
          paragraphs: [
            `Googleの[組織（Organization）の構造化データ](${SRC.googleOrgJa})（最終更新 2026年9月15日、11月15日確認）の要点は次のとおりです。`,
          ],
          list: [
            "必須のプロパティはなく、会社に当てはまるプロパティをできるだけ多く入れるよう勧めている。",
            "マークアップを置く場所は、トップページか、会社を説明する1つのページ（会社概要など）。すべてのページに入れる必要はない。",
            "店舗や飲食店のような地域のビジネスは、LocalBusinessのいちばん具体的な下位の型を使い、LocalBusinessの説明にも従う。",
            "foundingDate は ISO 8601 形式（例：2015-04-01）。",
            "ロゴは 112×112 ピクセル以上で、クロールとインデックスができる画像にする。",
          ],
          after: [
            `Googleは、構造化データをページに見えている文章と一致させることを基本の1つに挙げています（[AI 機能とウェブサイト](${SRC.googleAiJa})）。構造化データだけで答えが変わるわけではありません。本文に書いてあることを機械にも読める形にする「答え合わせの表」だと考えると、優先順位を間違えません。本文に書いていない事実を構造化データだけに入れることは避けてください。`,
          ],
        },
        {
          heading: "WordPressでの手順（Nurevo AEOの場合）",
          paragraphs: [
            `WordPressのサイトなら、[Nurevo AEO（無料）](${WP_ORG})で会社の基本情報を構造化データとllms.txtに出せます。次の順に進めます。`,
          ],
          list: [
            "会社概要ページの本文を、この記事の表に沿って先に直す（構造化データより先に本文）。",
            "プラグインを入れ、初期設定ウィザードでサイトの種類を選ぶ。会社として紹介したい場合は「B2B / SaaS」でOrganization、店舗なら業種のカード、どれにも当てはまらなければ「その他」。",
            "基本情報（名前・説明・住所・電話番号・営業時間・業種・URL・メール）を確かめる。既存の設定から読み取れた値は空欄にだけ入り、入力済みの値は上書きされません。WordPressの管理者メールが会社のメールとして使われることはありません。",
            "名前と住所は、会社概要の表記とそろえる。住所は1つの文字列としてPostalAddressに入るので、会社概要と同じ書き方で入力する。",
            "ロゴは、テーマの「サイトロゴ」に設定した画像が使われる。112×112ピクセル以上の画像にしておく。",
            "Yoast SEO・Rank Math・All in One SEO・Slim SEOを使っている場合、Nurevoはそのプラグインの構造化データに足りない事実だけを足すため、会社の情報が二重になりません。SEO SIMPLE PACK、VK All in One Expansion Unitとも併用できます（0.9.1から）。SEOプラグイン側で社名やロゴを入れている場合は、そちらの値が優先されるので、両方の表記をそろえる。",
            "正式な社名（legalName）・通称（alternateName）・設立（foundingDate）・公式アカウント（sameAs）を構造化データに足したい場合は、開発者向けの webmcp_canary_business_node フィルターで追加できます（Nurevoの基本情報の入力欄にはありません）。",
            "「AEOスコア」の画面で診断し、/llms.txt を開いて会社概要ページが載っているか確かめる。llms.txtには更新日の新しい固定ページ・投稿30件が載るため、載っていない場合は webmcp_canary_llms_txt_lines フィルターで行を足せます。",
          ],
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態を確認できます。",
          ],
        },
        {
          heading: "確かめ方：社名を入れた質問と、入れない質問",
          paragraphs: [
            "会社概要の対策は、社名を入れた質問で確かめます。同じ質問を、同じAIに、日を変えて何回か聞き、記録します。1回の答えだけで判断しないでください。",
          ],
          table: {
            head: ["記録すること", "例"],
            rows: [
              ["日付・AI・質問", "11/15、Perplexity、「株式会社サンプルはどこの会社？設立と事業内容は？」"],
              ["答えの中の事実", "所在地・設立・代表者・事業内容が正しいか、1つずつ○×"],
              ["出典", "自社の会社概要が出典に入ったか、ほかのサイトが使われたか"],
              ["間違いの出どころ", "出典のページに古い住所が残っていないか"],
            ],
          },
          after: [
            "Nurevoの無料のAIチェック（サイトを接続したFree・Standardのサイトで月1回）は、業種と地域から作った質問で、社名を入れずに聞きます。つまり「社名を知らない人に見つけてもらえるか」を見るもので、会社概要の正しさは上の表で手で確かめます。Proの登場率の計測（ベータ版）は現在Perplexityが対象です。測り方の全体は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。",
          ],
        },
        {
          heading: "会社概要ページのチェックリスト",
          list: [
            "表の前に、社名・所在地・事業内容が入った紹介文が2〜3文ある。",
            "正式な社名、通称・ブランド名、英語表記の関係が文で書いてある。",
            "所在地・電話番号の書き方が、サイト内のすべてのページで同じ。",
            "設立・代表者・従業員数に、正しい値と時点がある。",
            "社名の変更・移転は沿革に旧と新の両方で書いてある。",
            "会社概要が画像やPDFだけになっていない。",
            "Organization（または店舗ならLocalBusinessの下位の型）の構造化データがトップページか会社概要にあり、値が本文と一致している。",
            "sameAsには会社が管理しているアカウントだけが入っている。",
            "Googleビジネスプロフィールや社外のプロフィールの表記がそろっている。",
            "ページの最後に最終更新日がある。",
            "社名を入れた質問で、日を変えて確かめ、記録した。",
          ],
        },
      ],
      faqs: [
        { q: "会社概要ページは、トップページとは別に必要ですか？", a: "トップページに会社の基本情報がまとまっていれば、そこでも構いません。Googleは、組織の構造化データをトップページか会社を説明する1つのページに置くよう勧めています。サービスの紹介が中心のトップページなら、会社概要を別のページに分けたほうが、事実が1か所にまとまります。" },
        { q: "会社概要を表だけで書くのはだめですか？", a: "だめではありません。表は読みやすい形です。ただ、表だけだと会社を一言で説明する文がないので、表の前に2〜3文の紹介文を足すことをおすすめします。" },
        { q: "Organizationの構造化データは、すべてのページに入れるべきですか？", a: "Googleの説明では、すべてのページに入れる必要はなく、トップページか会社概要などの1つのページで足ります。SEOプラグインが全ページに出している場合も、値が正しければそのままで問題ありません。" },
        { q: "法人番号は構造化データの taxID に入れるべきですか？", a: "Googleの説明には、日本の法人番号を taxID に入れるべきかは書かれていません。まずは本文に書き、構造化データに入れるかは各社で判断してください。" },
        { q: "旧社名で質問されたときに、今の会社だとわかってもらうには？", a: "沿革に「20XX年〇月、旧社名△△から現社名に変更」と旧と新の両方を書き、紹介文でも触れます。社外のプロフィールに旧社名が残っていれば、掲載元に更新を依頼します。" },
        { q: "AIの答えに出てくる会社の情報が間違っています。どうすればいいですか？", a: "AIの答えを直接書き換えることはできません。答えの出典をたどり、自社サイトなら会社概要とほかのページの表記を直し、社外のサイトなら掲載元に訂正を依頼します。直したあとも、反映の時期は決まっていません。" },
        { q: "この手順で、会社がAIの答えに必ず正しく出ますか？", a: "保証はできません。AIの回答は日や聞き方で変わります。この手順は、AIが読む元の情報を正確にそろえ、間違いが起きにくくするためのものです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "会社の情報をAIがどう読んでいるか確認",
        body: "無料チェックは登録不要で、URLを入れるだけで構造化データ・llms.txt・AIクローラの許可の状態がわかります。WordPressなら、無料のプラグインで会社の基本情報をそのまま構造化データに出せます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "WordPressプラグインを無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、WordPressはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },
    en: {
      title: "About Page AI Search Optimization: Get Company Facts Right | Nurevo",
      description: "How to build a company About page that AI answers can rely on: which facts to publish, how to remove name and address variants, Organization schema and WordPress steps.",
      h1: "About page AI search optimization: get your company name, address, founding date and business described correctly",
      lead: "When someone asks an AI about your company by name, the page the answer leans on is your About or company profile page. Put your legal name and the names people actually use, your address, founding date, leadership, what you do and how to reach you on one page in plain text; publish the same values as Organization structured data; and make the spelling match across your other pages and your profiles elsewhere. Those three steps are the core of the work.",
      intro: [
        "Written November 15, 2026 (JST). This guide is for any company, shop or organization that has an About or company profile page, and for the agencies that build those sites. Address and opening-hours markup for shops is covered in [local business schema and SEO plugins](/guide/local-business-schema-seo-plugins). This guide is about the page that says who you are and where you are.",
        "AI answers change by day and by wording. These steps make the information AI reads accurate; they do not guarantee that you will appear in an answer.",
      ],
      sections: [
        {
          heading: "What AI uses your About page for",
          paragraphs: [
            "ChatGPT search, Perplexity and Google's AI Overviews read web pages when they answer and show them as sources. For a question that names a company, that company's own site, and above all the page that collects its basic facts, is an obvious candidate. When the About page is a single image, or the name and address are written differently from page to page, the AI may build its answer from someone else's old listing, or from a different company with the same name.",
            "Questions that name a company tend to fall into a few patterns. Each one can be answered from an About page that states the facts in text.",
          ],
          list: [
            "\"What does Example Ltd do?\" (business description)",
            "\"Where is Example's head office? Do they have an office in Manchester?\" (locations)",
            "\"When was Example founded, and who runs it?\" (founding date, leadership)",
            "\"Which company is behind the Example app?\" (brand versus company name)",
            "\"Is Example the same company as Sample?\" (former names, group companies, namesakes)",
            "\"How do I contact Example?\" (phone, form, hours)",
          ],
          after: [
            `Google says there are no additional requirements and no special structured data for appearing in AI Overviews or AI Mode, and that normal SEO best practices apply ([Google Search Central: AI features and your website](${SRC.googleAi})). The About page work is not a special way of writing for AI. It is stating the facts accurately, in a readable form, with the same values everywhere.`,
          ],
        },
        {
          heading: "What to put on the page, and how it maps to structured data",
          paragraphs: [
            "The table lists what an About page should state, the mistakes AI answers tend to make, and the matching Organization property. Property names come from the recommended properties in Google's [Organization structured data](" + SRC.googleOrg + ") documentation. \"Text only\" marks items that are not among Google's recommended properties.",
          ],
          table: {
            head: ["Item", "How to write it", "Typical AI mistake", "Structured data"],
            rows: [
              ["Legal name", "State the registered name once, exactly as registered", "Mixing you up with a similarly named company", "legalName (if different from name)"],
              ["Trading name, brand, other-language name", "Link them in a sentence: \"Example App is run by Sample Ltd\"", "Knowing the brand but not the company behind it", "alternateName"],
              ["Address", "Separate head office from other sites; write every address in the same format down to the floor", "Giving a pre-move address, or a branch as the head office", "address (PostalAddress, one or more)"],
              ["Contact", "Main phone, enquiry route, hours", "A department's direct line or an old number", "telephone, email, contactPoint"],
              ["Founded", "Full date; if founding and incorporation differ, give both", "Confusing founding year with incorporation year", "foundingDate (ISO 8601, e.g. 2015-04-01)"],
              ["Leadership", "Title and name; update the day it changes", "Naming the previous chief executive", "Text only (not a Google recommended property)"],
              ["What you do", "First sentence: what, for whom, where; then the list of activities", "Presenting one side business as the main one", "description"],
              ["Headcount, share capital", "Add \"as of month and year\"", "An undated old figure repeated", "numberOfEmployees (share capital: text only)"],
              ["Company registration or tax number", "State it on the page if you have one", "No way to tell you apart from a namesake", "Text first (see below)"],
              ["Official social and profile pages", "List only accounts the company controls", "Linking you to a namesake or an impostor account", "sameAs"],
              ["Logo", "The same image as the site logo", "Another company's logo", "logo (at least 112×112 px)"],
              ["Last updated", "\"Updated on ...\" at the end of the page", "No way to tell how current it is", "Text only"],
            ],
          },
          after: [
            "On registration and tax numbers: Google describes taxID as the tax number for the country in address, and vatID as the VAT number where one applies. If your number is a tax or VAT number for your country, those properties fit. If it is a different kind of identifier, such as Japan's corporate number, Google does not say whether it belongs in taxID, so state it on the page and decide for yourself whether to mark it up.",
            "Do not inflate figures. If you round headcount or client numbers up, AI will quote the larger number and it is hard to take back. Give the exact figure and the date it applies to.",
          ],
        },
        {
          heading: "How to write the page: not just a table, never an image",
          paragraphs: [
            "Many About pages are nothing but a two-column table. A table is easy for people and machines to read, but on its own it lacks a sentence that says what the company is. Put two or three sentences of introduction above the table and the AI has something it can use as is when it describes you.",
          ],
          list: [
            "First sentence: the legal name, the town or city, and what you do. For example: \"Sample Ltd, based in Leeds, helps small businesses set up accounting software.\"",
            "Second sentence: facts that set you apart from namesakes, such as how the brand relates to the company and the year you were founded.",
            "Then the table, as an HTML table or a list with labels, never as an image or a PDF.",
            "History as one line per year. For a change of name, a move or a merger, write both the old and the new: \"In March 20XX the company changed its name from Old Name Ltd.\"",
            "Keep the founder's message and the mission under separate headings from the facts.",
            "End the page with the date it was last updated.",
          ],
          after: [
            `schema.org has an [AboutPage](${SRC.schemaAbout}) type for the page itself, and some SEO plugins let you choose it as the page type. It is optional, and fine to use as long as it does not contradict your other structured data.`,
          ],
        },
        {
          heading: "Remove variants, on your site and elsewhere",
          paragraphs: [
            "AI builds an answer from several pages. If your name or address is written differently from page to page, it may not treat them as one company, or it may pick the old spelling. Start by deciding one form for each of the usual variants.",
          ],
          table: {
            head: ["Variant", "What to settle on"],
            rows: [
              ["Sample Ltd / Sample Limited / Sample", "The registered form, used everywhere you name the company"],
              ["Names in other languages or scripts", "One form per language, the same on that language's pages, profiles and business cards"],
              ["Unit 3, 12 High St / 12 High Street, Unit 3 / with and without building name", "One order and one choice about building name and floor"],
              ["0113 496 0000 / (0113) 4960000 / +44 113 496 0000", "One format per language, e.g. national format on local pages and international format on English pages for overseas readers"],
              ["Pages still showing an old name or address", "Record the change in the history, then fix the old pages"],
            ],
          },
          after: [
            "Where to check on your site: About, footer, contact page, privacy policy, any legally required trading disclosures, careers pages, press releases, author boxes on the blog, and the brochure PDF.",
            "Where to check elsewhere: your Google Business Profile, the social profiles the company controls, job boards, trade association and local directories, and descriptions of you on partners' sites. Some of these you cannot edit. Get your own site right first, then ask the publisher to correct theirs. When an AI answer is already wrong, trace its source and fix each kind of mistake where it comes from.",
          ],
        },
        {
          heading: "Help AI tell you apart from a company with the same name",
          paragraphs: [
            "If your name is a common word, or another company elsewhere has the same name, AI may blend the two. What separates you is facts that only you have.",
          ],
          list: [
            "Put the town or city and what you do in the first sentence of the introduction.",
            "State facts a namesake will not share: founding year, registration number, the name of your chief executive.",
            "In sameAs, list only official accounts and profiles the company controls. Leave out namesakes and pages you do not manage.",
            "If the brand and the company name differ, say \"Example is run by Sample Ltd\" on the pages for both.",
            "Google says properties such as iso6523Code and naics help distinguish an organization. If you have the relevant codes, consider adding them.",
          ],
        },
        {
          heading: "Organization structured data: what Google's documentation says",
          paragraphs: [
            `The key points of Google's [Organization structured data](${SRC.googleOrg}) documentation (last updated September 15, 2026; read November 15):`,
          ],
          list: [
            "There are no required properties; Google recommends adding as many of the properties that apply to your organization as you can.",
            "Put the markup on the home page or on one page that describes the organization, such as the About page. It does not need to be on every page.",
            "For a local business such as a restaurant or shop, use the most specific LocalBusiness subtype and follow the LocalBusiness guidance as well.",
            "foundingDate uses ISO 8601 (e.g. 2015-04-01).",
            "The logo must be at least 112×112 pixels and crawlable and indexable.",
          ],
          after: [
            `Google lists making structured data match the visible text as one of the basics ([AI features and your website](${SRC.googleAi})). Structured data does not change answers by itself. Treat it as the machine-readable answer key for what the page already says, and you will keep the priorities right. Do not put a fact in structured data that the page text does not state.`,
          ],
        },
        {
          heading: "Steps on WordPress (with Nurevo AEO)",
          paragraphs: [
            `On a WordPress site, [Nurevo AEO (free)](${WP_ORG}) publishes your company's basic facts as structured data and in llms.txt. Work in this order.`,
          ],
          list: [
            "Fix the text of the About page first, following the table above. Text before structured data.",
            "Install the plugin and choose the site type in the setup wizard: \"B2B / SaaS\" for an Organization, the matching card for a shop or clinic, or \"Other\" if none fits.",
            "Check the business details (name, description, address, phone, opening hours, business type, URL, email). Values read from your existing settings only fill blank fields; anything you have typed is never overwritten, and the WordPress administrator email is never used as the business email.",
            "Make the name and address match the About page. The address is published as one string inside a PostalAddress, so type it exactly as the About page writes it.",
            "The logo is the image set as the theme's site logo. Make it at least 112×112 pixels.",
            "With Yoast SEO, Rank Math, All in One SEO or Slim SEO, Nurevo only adds the facts missing from that plugin's structured data, so the company is not described twice. It also works alongside SEO SIMPLE PACK and VK All in One Expansion Unit (from 0.9.1). Where your SEO plugin already sets the name or logo, its values win, so keep both in step.",
            "To add the legal name (legalName), other names (alternateName), founding date (foundingDate) or official accounts (sameAs), use the developer filter webmcp_canary_business_node. These are not fields in Nurevo's business details form.",
            "Run the diagnosis on the AEO score screen, then open /llms.txt and check the About page is listed. llms.txt lists the 30 most recently updated pages and posts; if the About page is not among them, add a line with the webmcp_canary_llms_txt_lines filter.",
          ],
          after: [
            "The same checks apply to sites not built on WordPress. Enter your URL in the [free check](/check), no sign-up needed, to see the state of structured data, llms.txt and AI crawler access.",
          ],
        },
        {
          heading: "How to check: questions with and without your name",
          paragraphs: [
            "Check the About page work with questions that include your company name. Ask the same question of the same AI on different days, several times, and record the answers. Do not judge from a single answer.",
          ],
          table: {
            head: ["What to record", "Example"],
            rows: [
              ["Date, AI, question", "Nov 15, Perplexity, \"What is Sample Ltd? When was it founded and what does it do?\""],
              ["Facts in the answer", "Address, founding date, leadership, business: right or wrong, one by one"],
              ["Sources", "Was your About page cited, or another site?"],
              ["Where a mistake came from", "Does the cited page still show an old address?"],
            ],
          },
          after: [
            "Nurevo's free AI check (once a month, for connected Free and Standard sites) asks questions built from your business type and area, without your name. It tells you whether people who do not know your name can find you; check the accuracy of your company facts by hand with the table above. Pro's visibility measurement (beta) currently covers Perplexity. The full method is in [how to measure AI visibility](/guide/measure-ai-visibility).",
          ],
        },
        {
          heading: "About page checklist",
          list: [
            "Two or three sentences above the table give the name, location and what you do.",
            "The relationship between the legal name, the brand and any other-language name is written as a sentence.",
            "Address and phone are written the same way on every page of the site.",
            "Founding date, leadership and headcount are correct and dated.",
            "Name changes and moves appear in the history with both old and new.",
            "The About page is not only an image or a PDF.",
            "Organization (or, for a shop, the most specific LocalBusiness subtype) is on the home page or the About page, and its values match the text.",
            "sameAs lists only accounts the company controls.",
            "Your Google Business Profile and other profiles use the same spelling.",
            "The page ends with a last-updated date.",
            "You checked with questions that include your name, on different days, and recorded the results.",
          ],
        },
      ],
      faqs: [
        { q: "Do I need an About page separate from the home page?", a: "Not if the home page already collects the company's basic facts. Google recommends putting Organization markup on the home page or on one page that describes the organization. If your home page is mostly about your services, a separate About page keeps the facts in one place." },
        { q: "Is a table-only About page a problem?", a: "No. A table is easy to read. But it lacks a sentence that says what the company is, so add two or three sentences of introduction above it." },
        { q: "Should Organization structured data be on every page?", a: "According to Google, it does not need to be: the home page or one page such as the About page is enough. If your SEO plugin prints it on every page, that is fine as long as the values are correct." },
        { q: "Should our company registration number go in taxID?", a: "Google describes taxID as the tax number for the country in your address. If your number is that, it fits; if it is another kind of identifier, Google does not say. State it on the page first and decide whether to mark it up." },
        { q: "How do we make sure people asking about our former name find the current company?", a: "Write both names in the history (\"In March 20XX the company changed its name from Old Name Ltd\") and mention it in the introduction. If profiles elsewhere still show the old name, ask their publishers to update them." },
        { q: "An AI answer gets our company facts wrong. What should we do?", a: "You cannot edit the AI's answer directly. Trace the sources: fix the About page and other pages on your own site, and ask other publishers to correct theirs. There is no fixed time for corrections to show up." },
        { q: "If we follow these steps, will AI always describe us correctly?", a: "That cannot be guaranteed; AI answers change by day and wording. These steps make the information AI reads accurate and consistent, so mistakes are less likely." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See how AI reads your company's facts",
        body: "The free check needs no sign-up: enter your URL to see the state of structured data, llms.txt and AI crawler access. On WordPress, the free plugin publishes your company's basic facts as structured data.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Try the free WordPress plugin", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit and WordPress are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
