// Content page: AI search (AEO) for the profile pages of people - the company
// representative, a clinic director or other expert, an article's author and
// an outside reviewer (監修者). Applies to every industry: which questions AI
// is asked about people, what Google itself says about bylines, E-E-A-T and
// ProfilePage, which claims in the top-ranking articles have no primary
// source, what to write, Person / ProfilePage markup, and how to run it on
// WordPress with Nurevo AEO.
//
// Written 2026-11-16 (JST). Every claim about Nurevo AEO comes from the
// plugin's readme (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/readme.txt,
// 0.9.2), docs/developers.md and nurevo-webmcp.php:
// - When Nurevo prints its own graph, a single post is a BlogPosting whose
//   author is a Person with the WordPress display name (get_the_author_meta
//   display_name); pages are WebPage with no author.
// - With Yoast SEO / Rank Math / AIOSEO / Slim SEO, WebSite, WebPage, Article
//   and breadcrumbs stay exactly as that plugin publishes them; with VK All in
//   One Expansion Unit, nothing ExUnit sets on its Article, its author
//   included, is changed.
// - webmcp_canary_business_node: the business node; with the four SEO plugins
//   its properties are merged and that plugin's values win.
// - webmcp_canary_schema_graph: $bundle['core'], $bundle['extra'] (hand-entered,
//   never suppressed), $bundle['org_id'] (read only).
// - llms.txt: 30 most recently modified pages/posts; webmcp_canary_llms_txt_lines.
// - Free AI check asks questions built from business type and area, never a
//   name. Pro measurement (beta) currently covers Perplexity.
//
// Outside facts and where they were read on 2026-11-16:
// - Google "Creating helpful, reliable, people-first content" (last updated
//   2026-10-05 UTC): strongly encourages accurate authorship information such
//   as bylines where readers expect them; fabricated creator profiles (AI
//   headshots, made-up names, false credentials) are deception and a
//   low-quality signal; E-E-A-T itself is not a specific ranking factor; trust
//   is the most important; more weight on YMYL topics; raters do not control
//   rankings.
// - Google "ProfilePage structured data" (served in Japanese; last updated
//   2026-09-12 per the page summary): for pages whose main entity is one
//   person or organization tied to the site (forum/social profiles, news
//   author pages, blog about-me pages, company employee pages); a store's
//   homepage does not qualify; required: mainEntity (Person or Organization)
//   and its name; recommended: dateCreated/dateModified (human edits only),
//   alternateName, description, identifier, agentInteractionStatistic.
//   Shown in Discussions and forums features.
// - Google "AI features and your website": no extra requirements or special
//   markup for AI Overviews / AI Mode (read 2026-11-01, not re-fetched today).
// - schema.org types checked in schema-dts 2.1.0: Person hasCredential,
//   knowsAbout ("suggesting possible expertise but not implying it"),
//   alumniOf, worksFor, jobTitle, award, sameAs; Organization founder /
//   employee; EducationalOccupationalCredential credentialCategory /
//   recognizedBy; WebPage reviewedBy.
// - 厚生労働省 医師等資格確認検索 (licenseif.mhlw.go.jp) exists (search result).
// Not fetched (permission prompt not answered): Google Article structured data
// (author best practices) and Rank Math's author SEO docs. Nothing is stated
// about their contents.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  helpful: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
  helpfulJa: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=ja",
  profile: "https://developers.google.com/search/docs/appearance/structured-data/profile-page",
  profileJa: "https://developers.google.com/search/docs/appearance/structured-data/profile-page?hl=ja",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleAiJa: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja",
  knowsAbout: "https://schema.org/knowsAbout",
  reviewedBy: "https://schema.org/reviewedBy",
  credential: "https://schema.org/EducationalOccupationalCredential",
  mhlw: "https://licenseif.mhlw.go.jp/search_isei/index.jsp",
};

const JSON_JA = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "dateModified": "2026-11-16",
  "mainEntity": {
    "@type": "Person",
    "@id": "https://example.jp/about/yamada/#person",
    "name": "山田 花子",
    "alternateName": "Hanako Yamada",
    "jobTitle": "代表取締役・税理士",
    "worksFor": { "@id": "https://example.jp/#organization" },
    "description": "大阪の中小企業の会計と相続税を専門にする税理士。",
    "knowsAbout": ["相続税", "中小企業の会計"],
    "hasCredential": {
      "@type": "EducationalOccupationalCredential",
      "name": "税理士",
      "credentialCategory": "国家資格"
    },
    "image": "https://example.jp/images/yamada.jpg",
    "sameAs": ["https://www.linkedin.com/in/example"]
  }
}
</script>`;

const JSON_EN = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "dateModified": "2026-11-16",
  "mainEntity": {
    "@type": "Person",
    "@id": "https://example.com/about/jane-doe/#person",
    "name": "Jane Doe",
    "jobTitle": "Founder and Chartered Accountant",
    "worksFor": { "@id": "https://example.com/#organization" },
    "description": "Chartered accountant specialising in small-business accounts and inheritance tax in Leeds.",
    "knowsAbout": ["Inheritance tax", "Small-business accounting"],
    "hasCredential": {
      "@type": "EducationalOccupationalCredential",
      "name": "Chartered Accountant",
      "credentialCategory": "Professional qualification"
    },
    "image": "https://example.com/images/jane-doe.jpg",
    "sameAs": ["https://www.linkedin.com/in/example"]
  }
}
</script>`;

const PHP_JA = `// 1) 会社のノードに代表者を足す（会社概要に書いている人だけ）
add_filter('webmcp_canary_business_node', function ($org, $settings) {
    $org['founder'] = array(
        '@type' => 'Person',
        '@id'   => home_url('/about/yamada/#person'),
        'name'  => '山田 花子',
    );
    return $org;
}, 10, 2);

// 2) プロフィールの固定ページ（スラッグ yamada）だけに ProfilePage を足す
add_filter('webmcp_canary_schema_graph', function (array $bundle) {
    if (!is_page('yamada')) {
        return $bundle;
    }
    $bundle['extra'][] = array(
        '@type'      => 'ProfilePage',
        'url'        => get_permalink(),
        'mainEntity' => array(
            '@type'     => 'Person',
            '@id'       => home_url('/about/yamada/#person'),
            'name'      => '山田 花子',
            'jobTitle'  => '代表取締役・税理士',
            'worksFor'  => array('@id' => $bundle['org_id']),
            'knowsAbout'=> array('相続税', '中小企業の会計'),
        ),
    );
    return $bundle;
});`;

const PHP_EN = `// 1) Add the founder to the business node (only someone your About page names)
add_filter('webmcp_canary_business_node', function ($org, $settings) {
    $org['founder'] = array(
        '@type' => 'Person',
        '@id'   => home_url('/about/jane-doe/#person'),
        'name'  => 'Jane Doe',
    );
    return $org;
}, 10, 2);

// 2) Add a ProfilePage only on the profile page (slug jane-doe)
add_filter('webmcp_canary_schema_graph', function (array $bundle) {
    if (!is_page('jane-doe')) {
        return $bundle;
    }
    $bundle['extra'][] = array(
        '@type'      => 'ProfilePage',
        'url'        => get_permalink(),
        'mainEntity' => array(
            '@type'     => 'Person',
            '@id'       => home_url('/about/jane-doe/#person'),
            'name'      => 'Jane Doe',
            'jobTitle'  => 'Founder and Chartered Accountant',
            'worksFor'  => array('@id' => $bundle['org_id']),
            'knowsAbout'=> array('Inheritance tax', 'Small-business accounting'),
        ),
    );
    return $bundle;
});`;

export default {
  slug: "person-profile-page-ai-search",
  targetQueries: [
    "author page AI search optimization",
    "Person schema ProfilePage for AI answers",
    "founder profile ChatGPT wrong",
    "代表者 プロフィール AI検索 対策",
    "著者情報 構造化データ AI検索",
    "監修者 E-E-A-T LLMO",
  ],
  related: ["company-profile-page-ai-search", "how-to-appear-in-chatgpt", "aeo-for-wordpress", "medical-clinic-ai-search", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "代表者・専門家・著者のプロフィールページのAI検索対策 | Nurevo",
      description: "AIに「〇〇の代表は誰？」「この記事は誰が書いた？」と聞かれたときの出典になる人物ページの作り方。Googleの公式見解、書く項目と構造化データの表、監修の書き方、WordPressの手順。",
      h1: "代表者・専門家・著者のプロフィールページのAI検索対策：経歴・資格・専門分野をAIに正しく読ませる手順",
      lead: "人についての質問にAIが正しく答えられるかは、その人のプロフィールページが「誰が、どこで、何の専門家か」を文字で書いているかで決まります。氏名・役職・所属・資格・専門分野・経歴を1ページにまとめ、記事の著者名や会社概要の代表者欄からそのページへリンクし、同じ値をPersonの構造化データで出す。この3つが中心です。資格や実績を盛ること、架空の著者を作ることは、Googleがはっきり「欺瞞」と呼んでいるので逆効果です。",
      intro: [
        "作成日：2026年11月16日（JST）。Googleの「有用で信頼性の高い、ユーザー第一のコンテンツの作成」（最終更新 2026年10月5日）と「プロフィール ページ（ProfilePage）の構造化データ」は同日に確認しました。対象は、代表者・院長・所長・講師・記事の書き手のページを持つ会社・店舗・事務所と、そのサイトを作る制作会社です。会社そのものの情報は[会社概要ページのAI検索対策](/guide/company-profile-page-ai-search)で扱っています。",
        "AIの回答は日や聞き方によって変わります。この記事の手順は、AIが読む元の情報を正確にするためのもので、AIの回答に出ることや、検索順位が上がることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "AIは人物の情報を何に使うのか",
          paragraphs: [
            "ChatGPTの検索、Perplexity、GoogleのAIによる概要は、質問に答えるときにウェブのページを読み、出典として示します。人についての質問では、本人が所属する組織のサイトにあるプロフィールページが、いちばん直接の材料になります。そのページがない、写真と名前だけ、ページごとに肩書きが違う、という状態だと、AIは古い記事や同姓同名の別人の情報で答えを組み立てることがあります。",
            "人についての質問には、次のような型があります。",
          ],
          list: [
            "「〇〇株式会社の代表は誰？どんな経歴？」（会社の代表者）",
            "「〇〇クリニックの院長は何の専門医？」（専門家の資格と専門分野）",
            "「梅田で相続に強い税理士は？」（専門分野からの発見。名前は入っていない）",
            "「この記事を書いたのは誰？信頼できる？」（記事の著者）",
            "「〇〇さんと△△社の関係は？」（所属・兼職・前職）",
            "「〇〇先生に相談するには？」（連絡先・予約の窓口）",
          ],
          after: [
            "3つ目のように名前が入っていない質問では、AIはまず事務所や店を探し、そのうえで「誰が担当するか」を答えに足します。プロフィールページは、名前で聞かれたときだけでなく、専門分野で探されたときにも使われる材料です。",
          ],
        },
        {
          heading: "Googleが公式に言っていること（確認できた範囲）",
          paragraphs: [
            "著者情報やE-E-A-Tについては推測の多い記事がよく出回っています。まずGoogleが自分で書いていることを押さえます。",
          ],
          table: {
            head: ["Googleの説明", "出典", "この記事での受け止め方"],
            rows: [
              ["読者が著者を知りたいと思うところに、署名（バイライン）など正確な著者情報を付けることを強く勧める", "[有用なコンテンツの作成](" + SRC.helpfulJa + ")", "記事に著者名を出し、名前からプロフィールに進めるようにする"],
              ["AIで作った顔写真、作った名前、偽の資格などで作り手のプロフィールをでっち上げることは欺瞞で、低品質のしるし", "同上", "架空の著者・水増しした資格は書かない"],
              ["E-E-A-Tそのものは特定のランキング要因ではない。要素のうち最も大切なのは信頼（Trust）。健康・お金・安全などの話題（YMYL）ではE-E-A-Tの重みが大きい", "同上", "E-E-A-Tは「点数」ではなく、信頼できる事実を出すための考え方として使う"],
              ["ProfilePageは、1人の人物か1つの組織がページの主役で、そのサイトと結び付いているページ向け（著者ページ、ブログの自己紹介、会社の社員紹介など）。店のトップページは対象外", "[ProfilePageの構造化データ](" + SRC.profileJa + ")", "代表者・専門家・著者のページに使い、会社のトップページには使わない"],
              ["ProfilePageで必須なのは mainEntity（Person か Organization）とその name。dateModified は人が編集した日だけを反映する", "同上", "最小構成から始め、更新日は実際に直した日にする"],
              ["AIによる概要やAIモードに出るための追加の要件や特別なマークアップはない", "[AI 機能とウェブサイト](" + SRC.googleAiJa + ")", "構造化データは本文の答え合わせ。本文に書くことが先"],
            ],
          },
          after: [
            "ProfilePageの構造化データについて、Googleが説明している表示先は「ディスカッションとフォーラム」などの機能です。AIの回答への効果は書かれていません。この記事では、構造化データは「本文と同じ事実を機械にも読める形で出すもの」として扱います。",
          ],
        },
        {
          heading: "上位の記事でよく見る主張と、根拠の確かさ",
          paragraphs: [
            "「著者 E-E-A-T AI検索」で上位に出る日本語・英語の記事を10本読みました。手順やチェックリストが役に立つ記事も多い一方で、次のような主張は一次情報で確かめられませんでした。読むときの目安にしてください。",
          ],
          table: {
            head: ["よく見る主張", "確かめた結果"],
            rows: [
              ["「著者の資格がAIの引用判断の16％を占める」などの割合", "どの記事も元の調査へのリンクがなく、「割合」が何を測ったものかの定義もない"],
              ["「Personの構造化データは必須」", "Googleの説明では必須なのはProfilePageのリッチな表示に出す場合の項目だけ。AIの回答に必須という説明はない"],
              ["「sameAsは多いほどよい」", "根拠なし。本人が管理している、本人だとわかるプロフィールだけにするほうが安全"],
              ["「監修者を付ければE-E-A-Tが上がる」", "名前だけの監修は効果の根拠がない。Googleは作り手を偽ることを欺瞞としている。監修した範囲と日付を書くことが先"],
              ["「プロフィール文は〇〇字が最適」", "記事ごとに数字が違い、根拠もない。必要な事実が入っていれば長さは問わない"],
            ],
          },
        },
        {
          heading: "誰のページを、どこに置くか",
          paragraphs: [
            "サイトに出てくる人を、役割で4つに分けます。全員に長いページは要りません。AIに聞かれそうな人から順に作ります。",
          ],
          table: {
            head: ["役割", "置き場所", "最低限書くこと", "つなぎ方"],
            rows: [
              ["代表者", "会社概要の中か、/about/代表者名/ のような専用ページ", "氏名・役職・経歴・会社での役割", "会社概要の代表者欄からリンク。構造化データでは会社の founder や employee から同じ @id を指す"],
              ["専門家（院長・所長・講師など）", "スタッフ紹介の一覧と、1人1ページ", "資格・登録番号・専門分野・担当する診療やサービス", "サービスのページの「担当」からリンク"],
              ["記事の著者", "WordPressの著者アーカイブか、固定ページ", "氏名・所属・書いている分野・記事の一覧", "記事の署名からリンク"],
              ["外部の監修者", "監修者のページ（所属先のサイトへのリンク付き）", "氏名・資格・所属・監修した範囲", "記事に「監修：氏名（資格）、〇年〇月〇日」と書き、ページへリンク"],
            ],
          },
          after: [
            "同じ人を「代表」「著者」「監修」の3か所で紹介するときは、ページを分けず1ページにまとめ、氏名・肩書きの書き方をそろえます。AIは表記が違うと別の人だと受け取ることがあります。",
          ],
        },
        {
          heading: "プロフィールページに書く項目と、構造化データとの対応",
          paragraphs: [
            "次の表は、プロフィールページに書く項目と、AIの答えで起きやすい間違い、対応する schema.org のプロパティです。プロパティは schema.org の Person と ProfilePage の定義から選んでいます（型は schema-dts 2.1.0 で確認）。",
          ],
          table: {
            head: ["項目", "書き方", "AIで起きやすい間違い", "構造化データ"],
            rows: [
              ["氏名", "サイト全体で1つの書き方。読み・英字表記も1回書く", "同姓同名の別人と混ざる", "name、alternateName"],
              ["役職・所属", "「株式会社〇〇 代表取締役」のように会社名とセットで", "前職や兼職先の肩書きで紹介される", "jobTitle、worksFor"],
              ["資格", "正式名称、登録番号（公開してよい場合）、登録団体、取得年", "資格の種類を取り違える（認定と専門医など）", "hasCredential（EducationalOccupationalCredential）"],
              ["専門分野", "具体的に3〜5個。「何でもできます」と書かない", "専門外の分野で推される", "knowsAbout"],
              ["経歴", "年と出来事を1行ずつ。学歴・前職・独立の年", "時期の取り違え", "本文（出身校は alumniOf）"],
              ["実績", "数字には時点と数え方を付ける（例：2026年10月時点、相談件数〇件）", "古い数字や大きすぎる数字が引用される", "本文だけ"],
              ["受賞・掲載", "名称・年・主催者。リンクできるものはリンク", "受賞と単なる掲載が混ざる", "award（受賞だけ）"],
              ["外部のプロフィール", "本人が管理しているアカウントだけ", "なりすましや同名のアカウントと結び付く", "sameAs"],
              ["写真", "本人の写真。AIで作った顔写真は使わない", "—", "image"],
              ["書いた記事・担当サービス", "一覧かリンク", "どの分野の人かわからない", "本文"],
              ["最終更新日", "ページの最後に。肩書きが変わったらすぐ直す", "前の役職で紹介される", "dateModified（ProfilePage）"],
            ],
          },
          after: [
            `knowsAbout について、schema.org は「専門性を示唆するが、それを意味するものではない」と説明しています（[schema.org: knowsAbout](${SRC.knowsAbout})）。専門分野を構造化データに入れるだけでは裏付けにならないので、本文に担当した事例や書いた記事を並べます。`,
          ],
        },
        {
          heading: "文章の書き方：1文目で「誰か」を言い切る",
          list: [
            "1文目に氏名・役職・所属・専門を入れる。例：「山田花子は、株式会社サンプル（大阪市北区）の代表取締役で、中小企業の会計と相続税を専門にする税理士です。」",
            "2文目に、ほかの人と区別できる事実（資格の登録年、所属団体、担当している地域）を書く。",
            "資格は略さず正式名称で。医師なら厚生労働省の[医師等資格確認検索](" + SRC.mhlw + ")のように、公的に確かめられる資格は、読者が確かめられることを書き添えてもよい。",
            "経歴は表か年表にし、画像やPDFにしない。",
            "「業界No.1」「誰よりも詳しい」のような比べようのない言い方は避け、事実（年数・件数・担当分野）に置き換える。",
            "医療・士業など広告の規制がある業種は、肩書きや資格の書き方に業界のルールがあります。医療は[病院・クリニックのAI検索対策](/guide/medical-clinic-ai-search)も合わせて確認してください。",
          ],
        },
        {
          heading: "記事の著者表記と監修の書き方",
          paragraphs: [
            "記事には、本文の最初か最後に著者名を出し、その名前からプロフィールページにリンクします。「編集部」だけの署名でも構いませんが、その場合は編集部のページに、誰がどんな体制で書いているかを書いておきます。",
            `外部の専門家に内容を確認してもらった場合は、著者とは分けて「監修」と書き、監修した範囲（例：「税金の計算部分」）と日付を添えます。schema.orgには、ページの内容を正確さの点で確認した人を表す [reviewedBy](${SRC.reviewedBy}) があり、著者を表す author とは別のプロパティです。著者と監修者を同じ author に並べないようにします。`,
            "AIで下書きを作った記事は、Googleがコンテンツの作り方（自動化やAIを使ったか）を読者に示すことを勧めているので、必要に応じてその旨と、人が確認したことを書きます。",
          ],
        },
        {
          heading: "構造化データの例：ProfilePage と Person",
          paragraphs: [
            "最小構成の例です。値はすべて本文に書いてあることだけにします。会社のノードと同じ @id を worksFor で指すと、人と会社が1つの組み合わせとして読まれます。",
          ],
          code: JSON_JA,
          after: [
            `資格の型 [EducationalOccupationalCredential](${SRC.credential}) には、資格の種類（credentialCategory）や認定した団体（recognizedBy）も書けます。sameAs には、本人が管理していて、本人だとはっきりわかるプロフィールだけを入れます。`,
          ],
        },
        {
          heading: "WordPressでの手順（Nurevo AEOの場合）",
          paragraphs: [
            `[Nurevo AEO（無料）](${WP_ORG})を使っている場合、人物の情報は次のように扱われます。`,
          ],
          list: [
            "まず「ユーザー」→「プロフィール」で、記事を書く人の「ブログ上の表示名」を本名（またはサイトで使う名前）に直す。Nurevoが自分の構造化データを出している場合、投稿は BlogPosting になり、著者はこの表示名の Person として出ます。固定ページには著者を付けません。",
            "Yoast SEO・Rank Math・All in One SEO・Slim SEO を使っている場合、記事（Article）とその著者は、そのプラグインが出すとおりのままで、Nurevoは変えません。著者の設定はそのプラグインのユーザー設定で行います。VK All in One Expansion Unit の記事の著者も変更しません。",
            "代表者を会社の構造化データに足したい場合と、プロフィールの固定ページに ProfilePage を足したい場合は、下の開発者向けフィルターを使います（Nurevoの入力欄にはありません）。SEOプラグイン併用時は、会社のノードの値はそのプラグインの値が優先されます。",
            "SEOプラグインがすでに著者のページに ProfilePage などを出していないか、ページのソースで確かめ、二重にならないようにする。",
            "/llms.txt を開き、プロフィールページが載っているか確かめる。llms.txtには更新日の新しい固定ページ・投稿30件が載るので、載っていなければ webmcp_canary_llms_txt_lines フィルターで行を足せます。",
          ],
          code: PHP_JA,
          after: [
            "WordPress以外のサイトでも、確かめる項目は同じです。登録不要の[無料チェック](/check)にURLを入れると、構造化データ・llms.txt・AIクローラの許可の状態を確認できます。",
          ],
        },
        {
          heading: "確かめ方：名前を入れた質問で記録する",
          paragraphs: [
            "人物ページの対策は、名前を入れた質問で確かめます。同じ質問を同じAIに、日を変えて何回か聞き、記録します。1回の答えで判断しないでください。",
          ],
          table: {
            head: ["記録すること", "例"],
            rows: [
              ["日付・AI・質問", "11/16、Perplexity、「株式会社サンプルの代表の山田花子さんはどんな経歴？」"],
              ["答えの中の事実", "役職・資格・専門分野・経歴が正しいか、1つずつ○×"],
              ["出典", "自社のプロフィールページが出典に入ったか、別の人のページが使われたか"],
              ["取り違え", "同姓同名の別人や、前職の肩書きが混ざっていないか"],
            ],
          },
          after: [
            "Nurevoの無料のAIチェック（サイトを接続したFree・Standardのサイトで月1回）は、業種と地域から作った質問で、名前を入れずに聞きます。人の名前を入れた質問は上の表で手で確かめます。Proの登場率の計測（ベータ版）は現在Perplexityが対象です。測り方の全体は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。",
          ],
        },
        {
          heading: "プロフィールページのチェックリスト",
          list: [
            "1文目に氏名・役職・所属・専門が入っている。",
            "氏名と肩書きの書き方が、会社概要・記事の署名・スタッフ紹介で同じ。",
            "資格は正式名称で、取得年や登録団体がある。",
            "専門分野が具体的で、担当した事例や書いた記事が並んでいる。",
            "実績の数字に時点と数え方がある。",
            "架空の人物、AIで作った顔写真、盛った資格がない。",
            "記事の署名からプロフィールにリンクしている。監修は著者と分けて、範囲と日付がある。",
            "ProfilePage と Person の構造化データが本文と一致し、二重に出ていない。",
            "sameAs は本人が管理しているアカウントだけ。",
            "肩書きが変わったらすぐ直し、最終更新日を更新している。",
            "名前を入れた質問で、日を変えて確かめ、記録した。",
          ],
        },
      ],
      faqs: [
        { q: "小さな会社でも代表者のページは必要ですか？", a: "会社概要の代表者欄に、氏名・役職・経歴が数行あれば十分なことが多いです。代表者が記事を書いている、講演や取材が多い、代表者の名前で検索される、といった場合は、専用のページに分けると事実が1か所にまとまります。" },
        { q: "資格を持っていない人が書いた記事は、AIに使われにくいですか？", a: "資格がないこと自体が問題になるという説明は、Googleにはありません。Googleが重視するとしているのは信頼で、実際の経験（何年、どんな仕事をしてきたか）を事実として書くことが材料になります。医療やお金の話題では、専門家の確認を受けたうえで監修として明記する方法もあります。" },
        { q: "ペンネームで記事を書いてもいいですか？", a: "構いません。ただし、架空の経歴や資格を付けないこと、ペンネームの人のページに、どんな立場で書いているかを事実として書くことが前提です。Googleは作り手のプロフィールをでっち上げることを欺瞞としています。" },
        { q: "著者ページとProfilePageの構造化データは、どちらが先ですか？", a: "本文のページが先です。構造化データは本文と同じ事実を機械にも読める形にするもので、本文にない事実を構造化データだけに書くことは避けてください。" },
        { q: "監修者は author に入れるべきですか？", a: "著者と監修者は分けます。schema.orgには、内容を正確さの点で確認した人を表す reviewedBy があります。ページの本文でも「執筆」と「監修」を分けて書きます。" },
        { q: "代表者が交代しました。何を直せばいいですか？", a: "会社概要、代表者のページ、構造化データの founder や employee、記事の署名、社外のプロフィール（SNS・業界団体の名簿など）を直します。前の代表者のページは、役職と在任期間を書いて残すか、新しいページに案内します。AIの答えに反映される時期は決まっていません。" },
        { q: "この手順で、人物の情報がAIに必ず正しく出ますか？", a: "保証はできません。AIの回答は日や聞き方で変わります。この手順は、AIが読む元の情報を正確にそろえ、取り違えを起きにくくするためのものです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "サイトの人物と会社の情報が、AIにどう読まれているか確認",
        body: "無料チェックは登録不要で、URLを入れるだけで構造化データ・llms.txt・AIクローラの許可の状態がわかります。WordPressなら、無料のプラグインで会社の基本情報と記事の著者を構造化データに出せます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "WordPressプラグインを無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、GoogleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、VK All in One Expansion Unit、LinkedIn、WordPressはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },
    en: {
      title: "Founder, Expert and Author Profile Pages for AI Search | Nurevo",
      description: "Build profile pages AI can rely on when asked who runs a company or wrote an article: what Google says, what to write, Person and ProfilePage markup, WordPress steps.",
      h1: "Founder, expert and author profile pages for AI search: get people's roles, credentials and expertise read correctly",
      lead: "Whether an AI answers a question about a person correctly depends on whether that person's profile page states, in plain text, who they are, where they work and what they are an expert in. Put the name, role, organization, credentials, areas of expertise and career on one page; link to it from article bylines and from the leadership line of your About page; and publish the same values as Person structured data. Those three steps are the core. Inflating credentials or inventing authors backfires: Google calls fabricated creator profiles deception.",
      intro: [
        "Written November 16, 2026 (JST). Google's \"Creating helpful, reliable, people-first content\" (last updated October 5, 2026) and \"Profile page (ProfilePage) structured data\" were checked the same day. This guide is for companies, shops and practices with pages about their founder, director, practitioners, teachers or writers, and for the agencies that build those sites. The company itself is covered in [About page AI search optimization](/guide/company-profile-page-ai-search).",
        "AI answers change by day and by wording. These steps make the information AI reads accurate; they do not guarantee that a person will appear in an answer or that rankings will rise.",
      ],
      sections: [
        {
          heading: "What AI uses profile pages for",
          paragraphs: [
            "ChatGPT search, Perplexity and Google's AI Overviews read web pages when they answer and show them as sources. For a question about a person, the profile page on the site of the organization they belong to is the most direct material. When there is no such page, when it is only a photo and a name, or when the job title differs from page to page, the AI may build its answer from an old article or from someone else with the same name.",
            "Questions about people tend to fall into a few patterns.",
          ],
          list: [
            "\"Who runs Sample Ltd and what is their background?\" (the founder or CEO)",
            "\"What is the director of Sample Clinic a specialist in?\" (an expert's credentials and field)",
            "\"Which accountant in Leeds is good with inheritance tax?\" (found by expertise; no name in the question)",
            "\"Who wrote this article, and can I trust it?\" (the author)",
            "\"How is Jane Doe connected to Sample Ltd?\" (role, other positions, previous jobs)",
            "\"How do I book a consultation with Dr Doe?\" (contact and booking)",
          ],
          after: [
            "In a question like the third one, with no name in it, the AI first looks for a practice or shop and then adds who would handle the work. A profile page is material not only when someone asks by name but also when they search by expertise.",
          ],
        },
        {
          heading: "What Google itself says (as far as we could check)",
          paragraphs: [
            "A lot of what circulates about authorship and E-E-A-T is guesswork. Start from what Google writes itself.",
          ],
          table: {
            head: ["What Google says", "Source", "What this guide takes from it"],
            rows: [
              ["It strongly encourages accurate authorship information, such as bylines, where readers might expect it", "[Creating helpful content](" + SRC.helpful + ")", "Show the author's name on articles and link it to a profile"],
              ["Fabricating creator profiles with AI-generated headshots, made-up names or false credentials is deception and a sign of a low-quality page", "Same", "No invented authors and no inflated credentials"],
              ["E-E-A-T itself is not a specific ranking factor; of its parts, trust matters most; E-E-A-T carries more weight on health, financial and safety topics (YMYL)", "Same", "Treat E-E-A-T as a way to publish trustworthy facts, not as a score"],
              ["ProfilePage is for pages whose main subject is one person or organization tied to the site (author pages, a blog's about-me page, a company's employee pages); a store's home page does not qualify", "[ProfilePage structured data](" + SRC.profile + ")", "Use it on founder, expert and author pages, not on the company home page"],
              ["Required on ProfilePage: mainEntity (Person or Organization) and its name; dateModified should reflect only human edits", "Same", "Start small and use the date someone actually edited the profile"],
              ["There are no additional requirements or special markup for AI Overviews or AI Mode", "[AI features and your website](" + SRC.googleAi + ")", "Markup is the answer key to the text; the text comes first"],
            ],
          },
          after: [
            "The places Google says ProfilePage markup can show up are features such as Discussions and forums. It says nothing about an effect on AI answers. This guide treats markup as a way to publish the same facts as the text in a form machines can read.",
          ],
        },
        {
          heading: "Claims you will see in top articles, and how well they hold up",
          paragraphs: [
            "We read ten of the top Japanese and English articles for queries like \"author E-E-A-T AI search\". Many have useful steps and checklists, but the claims below could not be traced to a primary source. Use the table as a reading guide.",
          ],
          table: {
            head: ["Common claim", "What we found"],
            rows: [
              ["Percentages such as \"author credentials carry 16% of the weight in AI citation decisions\"", "None of the articles links the original study, and none defines what the \"weight\" measures"],
              ["\"Person schema is mandatory\"", "Google lists required properties only for ProfilePage to appear in its search features; it never says markup is required for AI answers"],
              ["\"The more sameAs links, the better\"", "No evidence. Listing only profiles the person controls, and that clearly belong to them, is the safer choice"],
              ["\"Adding a medical or legal reviewer raises your E-E-A-T\"", "No evidence for a name-only reviewer line, and Google calls misrepresenting creators deception. State what was reviewed and when"],
              ["\"The ideal bio length is N words\"", "The number differs from article to article and none gives a source. Length matters less than whether the facts are there"],
            ],
          },
        },
        {
          heading: "Whose page, and where",
          paragraphs: [
            "Sort the people on your site into four roles. Not everyone needs a long page; start with the people an AI is most likely to be asked about.",
          ],
          table: {
            head: ["Role", "Where", "Minimum content", "How to connect it"],
            rows: [
              ["Founder or CEO", "Inside the About page, or a page such as /about/name/", "Name, role, career, what they do in the company", "Link from the leadership line on the About page; in markup, point the company's founder or employee at the same @id"],
              ["Expert (director, practitioner, teacher)", "A staff list plus one page per person", "Credentials, registration number, field, which services they handle", "Link from the \"who you'll see\" line on service pages"],
              ["Article author", "The WordPress author archive or a regular page", "Name, organization, topics, list of articles", "Link from the byline"],
              ["Outside reviewer", "A reviewer page with a link to their own organization", "Name, credential, affiliation, what they reviewed", "On the article: \"Reviewed by Name (credential), date\", linked to the page"],
            ],
          },
          after: [
            "When the same person appears as founder, author and reviewer, keep one page and spell the name and title the same way everywhere. An AI may take two spellings for two people.",
          ],
        },
        {
          heading: "What to write, and the matching structured data",
          paragraphs: [
            "The table lists what a profile page should carry, the mistakes AI answers tend to make, and the matching schema.org properties, chosen from the Person and ProfilePage definitions (types checked in schema-dts 2.1.0).",
          ],
          table: {
            head: ["Item", "How to write it", "Typical AI mistake", "Structured data"],
            rows: [
              ["Name", "One spelling across the site; give other scripts or a romanized form once", "Mixed up with someone of the same name", "name, alternateName"],
              ["Role and organization", "Always with the company name, e.g. \"Founder, Sample Ltd\"", "Introduced with a previous or side job title", "jobTitle, worksFor"],
              ["Credentials", "Full official name, registration number (if it may be public), issuing body, year", "The type of credential is confused", "hasCredential (EducationalOccupationalCredential)"],
              ["Areas of expertise", "Three to five specific areas, not \"everything\"", "Recommended for things outside their field", "knowsAbout"],
              ["Career", "One line per year and event: education, previous jobs, when they set up", "Dates mixed up", "Text (alumniOf for schools)"],
              ["Track record", "Numbers with a date and how they were counted", "Old or inflated numbers get quoted", "Text only"],
              ["Awards and coverage", "Name, year, organizer; link where possible", "Awards confused with mentions", "award (awards only)"],
              ["Other profiles", "Only accounts the person controls", "Linked to impostors or namesakes", "sameAs"],
              ["Photo", "A real photo; no AI-generated headshots", "—", "image"],
              ["Articles and services", "A list or links", "Unclear what field the person works in", "Text"],
              ["Last updated", "At the end of the page; fix titles as soon as they change", "Introduced with a former role", "dateModified (ProfilePage)"],
            ],
          },
          after: [
            `schema.org describes knowsAbout as \"suggesting possible expertise but not implying it\" ([schema.org: knowsAbout](${SRC.knowsAbout})). Listing areas in markup proves nothing on its own, so back them up in the text with cases handled and articles written.`,
          ],
        },
        {
          heading: "Writing the page: say who the person is in the first sentence",
          list: [
            "Put the name, role, organization and field in the first sentence, e.g. \"Jane Doe is the founder of Sample Ltd in Leeds and a chartered accountant specialising in small-business accounts and inheritance tax.\"",
            "Use the second sentence for facts that tell her apart from others: the year she qualified, the bodies she belongs to, the area she covers.",
            "Write credentials in full. Where a credential can be checked in a public register, you can say so, so readers can verify it.",
            "Put the career in a table or timeline, not an image or a PDF.",
            "Replace claims nobody can compare, such as \"the industry's number one\", with facts: years, numbers, fields.",
            "In regulated fields such as medicine and law, there are rules on how titles and qualifications may be advertised. For healthcare, see also [AI search for clinics](/guide/medical-clinic-ai-search).",
          ],
        },
        {
          heading: "Bylines and reviewers",
          paragraphs: [
            "Show the author's name at the start or end of each article and link it to the profile page. A team byline is fine, but then the team page should say who writes and how.",
            `When an outside expert checks the content, call it a review, separate from authorship, and state what was reviewed (for example \"the tax calculations\") and when. schema.org has [reviewedBy](${SRC.reviewedBy}) for people who reviewed a page for accuracy, a different property from author. Do not list the author and reviewer together under author.`,
            "Google recommends telling readers how content was produced, including whether automation or AI was used. If an article was drafted with AI, say so where readers would expect it, along with the fact that a person checked it.",
          ],
        },
        {
          heading: "Markup example: ProfilePage and Person",
          paragraphs: [
            "A minimal example. Every value must also be in the text. Pointing worksFor at the same @id as your company node lets the person and the company be read as one pair.",
          ],
          code: JSON_EN,
          after: [
            `The credential type [EducationalOccupationalCredential](${SRC.credential}) can also carry the kind of credential (credentialCategory) and the body that recognizes it (recognizedBy). Put in sameAs only profiles the person controls and that clearly belong to them.`,
          ],
        },
        {
          heading: "On WordPress (with Nurevo AEO)",
          paragraphs: [
            `With [Nurevo AEO (free)](${WP_ORG}), people are handled as follows.`,
          ],
          list: [
            "First, under Users > Profile, set each writer's \"Display name publicly as\" to their real name (or the name the site uses). When Nurevo publishes its own graph, posts become BlogPosting with the author as a Person carrying that display name. Pages get no author.",
            "With Yoast SEO, Rank Math, All in One SEO or Slim SEO, the Article and its author stay exactly as that plugin publishes them; Nurevo does not change them. Set authors up in that plugin's user settings. The author on VK All in One Expansion Unit's Article is not changed either.",
            "To add the founder to the company's markup, or a ProfilePage to a profile page, use the developer filters below (there are no input fields for these in Nurevo). With an SEO plugin, the company node's values from that plugin still win.",
            "Check the page source to make sure your SEO plugin does not already publish a ProfilePage for that author, so nothing is duplicated.",
            "Open /llms.txt and check that the profile page is listed. llms.txt lists the 30 most recently modified pages and posts; if it is missing, add a line with the webmcp_canary_llms_txt_lines filter.",
          ],
          code: PHP_EN,
          after: [
            "On other platforms the checks are the same. The [free check](/check) needs no sign-up: enter a URL to see the state of structured data, llms.txt and AI crawler access.",
          ],
        },
        {
          heading: "How to check: questions with the person's name",
          paragraphs: [
            "Check profile pages with questions that include the person's name. Ask the same question to the same AI on different days and record the answers; do not judge from one answer.",
          ],
          table: {
            head: ["What to record", "Example"],
            rows: [
              ["Date, AI, question", "16 Nov, Perplexity, \"What is the background of Jane Doe, founder of Sample Ltd?\""],
              ["Facts in the answer", "Role, credentials, field and career: right or wrong, one by one"],
              ["Sources", "Was your profile page cited, or someone else's page?"],
              ["Mix-ups", "Any namesake or former title in the answer?"],
            ],
          },
          after: [
            "Nurevo's free AI check (once a month on connected Free and Standard sites) asks questions built from your business type and area, never a name, so questions about people are checked by hand with the table above. Pro visibility measurement (beta) currently covers Perplexity. The full method is in [how to measure AI visibility](/guide/measure-ai-visibility).",
          ],
        },
        {
          heading: "Profile page checklist",
          list: [
            "The first sentence has the name, role, organization and field.",
            "Name and title are written the same way on the About page, bylines and staff pages.",
            "Credentials are written in full with the year or issuing body.",
            "Areas of expertise are specific and backed by cases or articles.",
            "Numbers have a date and say how they were counted.",
            "No invented people, AI-generated headshots or inflated credentials.",
            "Bylines link to the profile; reviews are separate from authorship, with scope and date.",
            "ProfilePage and Person markup match the text and are not duplicated.",
            "sameAs lists only accounts the person controls.",
            "Titles are fixed as soon as they change, and the last-updated date follows.",
            "You checked with questions that include the name, on different days, and recorded the results.",
          ],
        },
      ],
      faqs: [
        { q: "Does a small company need a founder page?", a: "A few lines with the name, role and background in the About page are often enough. If the founder writes articles, speaks or gets interviewed, or people search for them by name, a separate page keeps the facts in one place." },
        { q: "Are articles by people without formal credentials less likely to be used by AI?", a: "Google does not say that lacking a credential is a problem in itself. What it says matters most is trust, and real experience (how many years, what kind of work) written as fact is good material. For health or money topics, you can also have an expert review the content and say so." },
        { q: "Can we publish under a pen name?", a: "Yes, as long as you do not attach an invented background or credentials, and the pen name's page states in what capacity the person writes. Google calls fabricated creator profiles deception." },
        { q: "Which comes first, the author page or the ProfilePage markup?", a: "The page. Markup puts the same facts as the text in a machine-readable form; do not put facts in markup that the text does not state." },
        { q: "Should a reviewer go under author?", a: "Keep authors and reviewers apart. schema.org has reviewedBy for people who checked a page for accuracy. In the text, too, write \"written by\" and \"reviewed by\" separately." },
        { q: "Our CEO has changed. What should we update?", a: "The About page, the CEO's profile page, founder or employee in the markup, bylines, and profiles elsewhere (social accounts, industry directories). Keep the former CEO's page with their role and dates, or point it to the new page. There is no fixed time for AI answers to catch up." },
        { q: "If we follow these steps, will AI always describe our people correctly?", a: "That cannot be guaranteed; AI answers change by day and wording. These steps make the information AI reads accurate and consistent, so mix-ups are less likely." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See how AI reads the people and company on your site",
        body: "The free check needs no sign-up: enter your URL to see the state of structured data, llms.txt and AI crawler access. On WordPress, the free plugin publishes your company's basic facts and your articles' authors as structured data.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Try the free WordPress plugin", href: WP_ORG },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI and Google of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, VK All in One Expansion Unit, LinkedIn and WordPress are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
