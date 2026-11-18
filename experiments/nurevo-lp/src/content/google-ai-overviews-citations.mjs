// Content page: how Google's AI Overviews and AI Mode pick supporting links,
// what Google itself documents (eligibility = indexed + snippet-eligible,
// query fan-out, no special files or schema, the Search Console "Search
// generative AI" control), which controls limit display, what top articles
// claim and how strong the evidence is, local business / ecommerce, WordPress
// steps with Nurevo AEO, and how to check (Search Console report + manual log).
//
// Written 2026-11-18 (JST). Outside facts and where they were read:
// - Google "AI features and your website" (last updated 2025-12-10): no
//   additional requirements or special optimizations; indexed and eligible to
//   be shown with a snippet; indexing and serving not guaranteed; query
//   fan-out; AI Overviews only shown when additive and often don't trigger;
//   robots.txt for Googlebot is the Search access control; nosnippet,
//   data-nosnippet, max-snippet, noindex to limit what is shown;
//   Google-Extended "to limit AI training and grounding in some of Google's
//   other systems"; no new machine-readable files, AI text files or markup;
//   no special schema.org; structured data must match visible text; AI
//   traffic counted in Performance report "Web"; Merchant Center and Business
//   Profile up to date; recrawl takes several days to several months.
// - Google "Optimizing your website for generative AI features on Google
//   Search" (2026-07-10 per summary): extra requirement that the site is
//   included in the Search generative AI setting in Search Console; fan-out
//   definition; JavaScript processed unless blocked; perfectly semantic HTML
//   not required; LLMS.txt ignored by Google Search, neither harms nor helps;
//   no requirement to "chunk"; non-commodity content; scaled content abuse;
//   Merchant Center / Business Profile; AEO/GEO are still SEO from Google's
//   view. Rewriting and inauthentic-mentions bullets only read as a summary,
//   so not quoted.
// - Google blog 2025-05-21 (John Mueller): more restrictive preview controls
//   limit how content is featured (read as a summary; stated loosely).
// - Search Console Help (already verified for search-console-ai-features,
//   2026-11-10): generative AI performance report available to all sites as
//   of 2026-08-31; the Search generative AI control; excluded = no
//   impressions or traffic from AI Overviews, AI Mode or Discover gen AI.
// - Ahrefs (2025-08-20, updated 2026-08-19): 76.10% of AI Overview citations
//   from top-10 pages, own sample of 1M AI Overviews / 1.9M citations.
// - Top articles read: Ahrefs JA x3, Souzoh / LLM Pulse, The HOTH, WebFX,
//   Contently. Surfer and Previsible could not be read (redirect blocked).
// Not stated on purpose: robots meta tag details beyond the names (the page
// could not be read this run), Google-Extended's effect on AI Overviews
// (the docs only say "some of Google's other systems"), AI Mode rollout by
// country, CTR studies, citation-share-by-domain numbers.
// Product facts: readme.txt 0.9.2 - training crawlers including
// Google-Extended are left to robots.txt by default; free AI check uses
// Perplexity only; Nurevo does not measure Google AI features.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  aiFeatures: "https://developers.google.com/search/docs/appearance/ai-features",
  aiFeaturesJa: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja",
  optGuide: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide",
  blog2025: "https://developers.google.com/search/blog/2025/05/succeeding-in-ai-search",
  robotsMeta: "https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag",
  controlJa: "https://support.google.com/webmasters/answer/16908024?hl=ja",
  controlEn: "https://support.google.com/webmasters/answer/16908024?hl=en",
  reportJa: "https://support.google.com/webmasters/answer/16984139?hl=ja",
  reportEn: "https://support.google.com/webmasters/answer/16984139?hl=en",
  ahrefsJa: "https://ahrefs.com/ja/blog/search-rankings-ai-citations/",
  ahrefsEn: "https://ahrefs.com/ja/blog/search-rankings-ai-citations/",
};

const SNIPPET_JA = `<!-- ページ全体のスニペットを出さない（AIによる概要・AIモードの出典にも使われにくくなる） -->
<meta name="robots" content="nosnippet">

<!-- スニペットの長さを160文字までにする -->
<meta name="robots" content="max-snippet:160">

<!-- この部分だけスニペットに使わせない（会員向けの価格など） -->
<div data-nosnippet>会員価格：…</div>`;

const SNIPPET_EN = `<!-- No snippet for the whole page (it also becomes less usable as a source in AI Overviews and AI Mode) -->
<meta name="robots" content="nosnippet">

<!-- Limit snippets to 160 characters -->
<meta name="robots" content="max-snippet:160">

<!-- Keep just this part out of snippets (for example, member prices) -->
<div data-nosnippet>Member price: ...</div>`;

const FOOT_JA = "Google、Google 検索、Search Console、Googleビジネスプロフィール、Merchant CenterはGoogle LLCの商標です。ChatGPTはOpenAI、PerplexityはPerplexity AI、AhrefsはAhrefs Pte. Ltd.の商標です。WordPress、Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACKはそれぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。";
const FOOT_EN = "Google, Google Search, Search Console, Google Business Profile and Merchant Center are trademarks of Google LLC. ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI and Ahrefs of Ahrefs Pte. Ltd. WordPress, Yoast SEO, Rank Math, All in One SEO and SEO SIMPLE PACK are trademarks or registered trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.";

export default {
  slug: "google-ai-overviews-citations",
  targetQueries: [
    "how to get cited in Google AI Overviews",
    "Google AI Mode sources how chosen",
    "AI Overviews nosnippet llms.txt requirements",
    "AIによる概要 引用される 方法",
    "AIモード 出典 表示 条件",
    "AI Overviews 対策 WordPress",
  ],
  related: ["search-console-ai-features", "perplexity-citations", "appear-in-chatgpt", "measure-ai-visibility", "llms-txt"],
  locales: {
    ja: {
      title: "AIによる概要・AIモードに出典として出る条件と確かめ方 | Nurevo",
      description: "GoogleのAIによる概要・AIモードの出典になる条件（インデックスとスニペット、Search Consoleの設定）、しなくていいこと、表示を止める設定、WordPressの手順と確かめ方。",
      h1: "GoogleのAIによる概要・AIモードに、自社サイトが出典として出る条件と確かめ方",
      lead: "Googleの説明では、AIによる概要（AI Overviews）とAIモードの出典（補足のリンク）に出るための特別な対策や専用のファイルはなく、条件は「ページがインデックスされ、スニペット付きで検索結果に出せる状態であること」と、Search Consoleの「検索の生成 AI」設定でサイトを除外していないことです。そのうえでどのページが選ばれるかは公開されていないため、サイト側でできるのは、通常の検索の土台を整え、答えになる事実を本文の文字で書き、Search Consoleと手での記録で確かめることです。",
      intro: [
        "作成日：2026年11月18日（JST）。Search Consoleの生成AIパフォーマンスレポートの読み方は[Search ConsoleでAIによる概要・AIモードの表示を見る方法](/guide/search-console-ai-features)、Perplexityについては[Perplexityに引用される仕組み](/guide/perplexity-citations)で扱っています。この記事は、GoogleのAI機能に出典として出るための条件を、Googleの資料で確かめられる範囲で整理します。",
        "AIの回答は日や聞き方によって変わり、AIによる概要はそもそも出ない検索も多くあります。この記事の手順は、出典に使える状態にし、出ているかを正しく確かめるためのもので、表示や順位を保証するものではありません。",
      ],
      sections: [
        {
          heading: "Googleが公式に書いていること・書いていないこと",
          paragraphs: [
            `Googleは、AI機能とサイトの関係を2つのページで説明しています。[AI機能とウェブサイト](${SRC.aiFeaturesJa})（2025年12月10日更新）と、[検索の生成AI機能に向けたサイトの最適化](${SRC.optGuide})（英語、2026年7月更新）です。ここに書かれていることだけを、この記事では事実として扱います。`,
          ],
          table: {
            head: ["項目", "Googleの資料にあるか", "内容"],
            rows: [
              ["出典に出る条件", "ある", "ページがインデックスされ、スニペット付きで検索結果に表示できること。追加の技術的な要件や特別な最適化はない、としています"],
              ["Search Consoleの設定", "ある", `最適化のガイドでは、上の条件に加えて、Search Consoleの「検索の生成 AI」設定でサイトが含まれていることを条件に挙げています（[Search Console ヘルプ](${SRC.controlJa})）`],
              ["回答の作り方", "一部ある", "AIによる概要とAIモードは、関連する複数の検索を同時に行う「クエリ・ファンアウト」で、より多くの補足ページを見つけることがある、としています"],
              ["AIによる概要が出る検索", "一部ある", "通常の検索に加えて役立つと判断したときだけ出るので、出ない検索も多い、としています"],
              ["専用のファイルや構造化データ", "ある", "AI用のテキストファイルや新しいマークアップ、特別な schema.org の構造化データは要らない、としています。llms.txt は Google 検索では使われず、置いても良くも悪くもならない、と明記されています"],
              ["出典を選ぶ基準・件数・順番", "ない", "公開されていません。インデックスと表示は保証されない、とも書かれています"],
              ["アクセスの数え方", "ある", "AI機能からの表示とクリックは、Search Consoleの検索パフォーマンスの「ウェブ」に含めて数える、としています"],
            ],
          },
        },
        {
          heading: "上位の記事でよく見る主張と、根拠の強さ",
          paragraphs: [
            "「AIによる概要 引用される 方法」「how to get cited in Google AI Overviews」などで上位に出る日本語4本・英語4本を読みました（ほかに2本は転送先が読めず）。「質問に先に答える」「通常の検索で上位にいる」「構造化データを整える」はほぼ共通です。一方で、Googleの資料を本文でリンクしていた記事は少なく、数字の多くは書いた会社自身の調査か、出典のないものでした。",
          ],
          table: {
            head: ["よく見る主張", "根拠の強さ", "この記事での扱い"],
            rows: [
              ["「通常の検索で上位のページが引用されやすい」", `Ahrefsの自社調査（AIによる概要100万件・引用190万件、2025年）では引用の76.10%が上位10位以内のページ（[Ahrefs](${SRC.ahrefsJa})）。1社の調査で、時期も古い`, "Googleの「通常の検索の土台が前提」という説明と合うので、傾向として紹介する"],
              ["「40〜60語の答えのかたまりを冒頭に置く」", "出典のない推奨", "語数は使わない。質問の答えを見出しのすぐ下に書く、とだけ書く"],
              ["「ページを小さな塊（チャンク）に分ける」", "Googleは、AIのために細かく分ける必要はないと明記", "しなくていいこととして書く"],
              ["「llms.txt を置くとAIによる概要に出やすい」", "Googleは、Google 検索は llms.txt を使わないと明記", "Google向けには効果がないと書く（他のAIのために置くのは別の話）"],
              ["「構造化データで引用が増える」", "Googleは、AI機能に特別な構造化データは要らないとしている。効果を示す公式の説明はない", "本文と一致させることだけを書く"],
              ["「YouTubeが引用の35%」など、ドメイン別の割合", "ツール会社の、ある時点のデータ", "使わない"],
            ],
          },
          after: [
            "読んだ8本のうち、nosnippet などで表示を制限したときの影響、WordPressでの手順、手での確かめ方の具体的な記録方法まで書いた記事は見つからず、Search Consoleの「検索の生成 AI」設定に触れていたのも1本だけでした。以下はそこを中心に書きます。",
          ],
        },
        {
          heading: "クエリ・ファンアウト：1つの質問が、いくつもの検索になる",
          paragraphs: [
            "Googleの説明では、AIによる概要とAIモードは、ユーザーの質問をもとに関連する複数の検索を同時に行い、より多くのページから答えをまとめることがあります。例えば「土曜に子どもを診てくれる歯医者を◯◯市で探したい」という質問は、「◯◯市 小児歯科」「土曜 診療 歯科 ◯◯市」「子どもの初診 持ち物」のような、いくつかの小さな質問に分かれて検索される可能性があります。",
            "サイト側にとっての意味は、1つのページが質問全体に答える必要はなく、分かれた小さな質問のどれかに、はっきり答えているページがあれば出典の候補になりうる、ということです。何に分かれるかは公開されていないので、お客様が実際に聞く質問を書き出し、それぞれに答えるページや見出しがあるかを確かめるのが現実的です。",
          ],
          list: [
            "診療時間・営業時間・料金・対応地域・対象（年齢、業種など）を、それぞれ見出しと本文の文字で書く。",
            "「◯◯はできますか」「◯◯にいくらかかりますか」のような、よく聞かれる質問に1〜2文で答える。",
            "サービスや店舗ごとにページを分け、ページ同士で事実を食い違わせない。",
          ],
        },
        {
          heading: "出典に出るための前提を、Search Consoleで確かめる",
          paragraphs: [
            "Googleが挙げる条件は、通常の検索の条件と同じです。最初に、出したいページがそもそも通常の検索に出られる状態かを確かめます。",
          ],
          table: {
            head: ["確かめること", "どこで見るか", "問題があるときの例"],
            rows: [
              ["ページがインデックスされているか", "Search Consoleの「URL検査」", "「URLがGoogleに登録されていません」、noindex が入っている、正規URLが別のページになっている"],
              ["Googlebot が読めるか", "URL検査の「公開URLをテスト」、robots.txt", "robots.txt で Disallow、CDNやWAFで Googlebot を止めている、ログインが必要"],
              ["スニペットを出せるか", "ページのHTMLの robots メタタグ", "nosnippet や、極端に短い max-snippet を入れている"],
              ["本文が文字で読めるか", "URL検査の「クロール済みのページを表示」", "答えが画像やPDFの中だけにある、JavaScriptがブロックされて本文が出ない"],
              ["「検索の生成 AI」設定", "Search Consoleの［設定］＞［検索の生成 AI］", "サイトやディレクトリを除外している（除外するとAIによる概要・AIモードからの表示とアクセスがなくなる）"],
            ],
          },
          after: [
            "Googleは、JavaScriptで出す内容もブロックされていなければ処理できるとし、完全に意味どおりのHTMLである必要はないとしています。ただし、直したページが再クロールされるまでには、数日から数か月かかることがあるとも書いています。直した日を記録し、すぐに結果を判断しないでください。",
          ],
        },
        {
          heading: "表示を制限する設定と、AI機能への影響",
          paragraphs: [
            `Googleは、検索結果に出す情報を制限したい場合は nosnippet・data-nosnippet・max-snippet・noindex を使うよう案内しています（[robots メタタグ](${SRC.robotsMeta})）。2025年のGoogleのブログでは、制限を強くするほど、AIの機能での使われ方も限られると説明しています（[検索セントラル ブログ](${SRC.blog2025})）。出典として出たいページに、意図せずこれらが入っていないかを確かめてください。`,
          ],
          code: SNIPPET_JA,
          table: {
            head: ["設定", "何をするか", "AI機能への影響（Googleの説明の範囲）"],
            rows: [
              ["robots.txt（Googlebot）", "Google 検索のクロールを許可・拒否する", "Googleは、検索へのアクセスを管理する方法はこれだとしている。止めればAI機能の出典にもならない"],
              ["noindex", "ページを検索結果から外す", "インデックスが条件なので、出典にならない"],
              ["nosnippet", "ページのスニペットを出さない", "スニペット付きで表示できることが条件なので、出典に使われにくくなる"],
              ["max-snippet", "スニペットの長さの上限を決める", "短くするほど使える情報が減る"],
              ["data-nosnippet", "ページの一部だけをスニペットから外す", "その部分は使われにくくなる。ページの残りには影響しない"],
              ["「検索の生成 AI」設定（Search Console）", "サイトやディレクトリをAI機能から外す", `外すと、AIによる概要・AIモード・Discoverの生成AI機能からの表示とアクセスがなくなる（[ヘルプ](${SRC.controlJa})）`],
              ["Google-Extended（robots.txt）", "Googleの「その他のシステム」でのAIの学習とグラウンディングを制限する", "AI機能とウェブサイトのページでは、Google 検索のクロールの管理とは別の、その他のシステム向けの設定として案内されている"],
            ],
          },
          after: [
            "会員だけに見せる価格や、引用されたくない一部の文章には data-nosnippet、ページ全体を出したくない場合は noindex や「検索の生成 AI」設定、と使い分けます。AIの学習に使われたくないだけなら、検索の設定ではなく Google-Extended を検討します。",
          ],
        },
        {
          heading: "しなくていいこと（Googleが明記しているもの）",
          paragraphs: [
            "最適化のガイドには「しなくていいこと」の節があり、AI向けとしてよく勧められる作業のいくつかを、Google 検索には必要ないとしています。",
          ],
          list: [
            "llms.txt などAI用のファイルや、新しいマークアップ、Markdown 版のページを作る（Google 検索はこれらを使わず、置いても良くも悪くもならない）。",
            "AIが理解しやすいように、本文を細かい塊に分ける（その必要はない、としています）。",
            "AI機能のためだけに、特別な schema.org の構造化データを足す（要らない、としています。リッチリザルトのために使うのは別）。",
            "AEO・GEOという別の作業として考える（Googleは、生成AIの検索への最適化も検索の体験への最適化で、SEOのままだとしています）。",
          ],
          after: [
            "ただし、これはGoogle 検索についての話です。llms.txt は、ChatGPTやPerplexityなど他のAIがサイトの要点を読むための入口として置く意味があります（[llms.txtのガイド](/guide/llms-txt)）。また、Googleは、検索の順位やAIの回答を操作することを主な目的に大量のページを作ることは、スパムのポリシー（大量生成されたコンテンツの不正使用）に違反するとしています。",
          ],
        },
        {
          heading: "出典に使われやすいページにするために、できること",
          paragraphs: [
            "Googleが挙げているのは、通常の検索と同じ基本です。それを、出典になりやすい形に言い換えると次のようになります。",
          ],
          list: [
            "他のサイトの言い直しではなく、自社にしかない事実や経験を書く（料金の内訳、実際の手順、対応した事例の条件など）。",
            "大事な内容を文字で書く。画像やPDFだけにしない。",
            "サイトの中のリンクで、ページ同士をつなぐ（サービス一覧から各サービスへ、記事から関連するサービスへ）。",
            "構造化データを、ページに見えている文字と一致させる。本文にない事実を構造化データにだけ書かない。",
            "役に立つ画像や動画を、本文の説明とあわせて載せる。",
            "スマートフォンでも読みやすく、表示が遅すぎないページにする。",
          ],
          after: [
            `参考として、Ahrefsが2025年に公開した自社調査では、AIによる概要の引用の76.10%が、その検索の上位10位以内のページでした（[Ahrefs](${SRC.ahrefsJa})）。1社の調査で時期も古いため数字そのものより、「通常の検索で評価されていないページは、AI機能でも出典になりにくい」という傾向として読んでください。`,
          ],
        },
        {
          heading: "店舗・ネットショップ：ビジネスプロフィールとMerchant Center",
          paragraphs: [
            "Googleは、AIの回答には、必要に応じて商品の情報や地域の店舗の情報が含まれることがあるとし、Merchant Center（商品のデータ）とGoogleビジネスプロフィールを最新に保つことで、商品やサービスがAIの回答と検索結果の両方で見つかりやすくなるとしています。店舗やネットショップは、サイトだけでなくこの2つも確かめます。",
          ],
          table: {
            head: ["種類", "確かめること"],
            rows: [
              ["店舗・地域の事業", "ビジネスプロフィールの営業時間（祝日・臨時休業を含む）、カテゴリ、サービス、住所と電話番号が、サイトの会社概要や構造化データと同じか"],
              ["ネットショップ", "Merchant Centerの商品データの価格・在庫・送料が、商品ページと同じか。セールの終わった価格が残っていないか"],
              ["両方", "サイトを直したら、ビジネスプロフィールやフィードも同じ日に直す。食い違うと、どちらが正しいかAIにも人にも分からない"],
            ],
          },
          after: [
            "店舗の構造化データの出し方は[店舗の構造化データとSEOプラグイン](/guide/local-business-schema-seo-plugins)、ネットショップは[ネットショップのAI検索対策](/guide/online-shop-ai-search)にまとめています。",
          ],
        },
        {
          heading: "WordPressでの手順",
          list: [
            "［設定］＞［表示設定］の「検索エンジンでの表示」で、「検索エンジンがサイトをインデックスしないようにする」にチェックが入っていないかを見る（入っていると noindex が出ます）。",
            "Yoast SEO・Rank Math・All in One SEO・SEO SIMPLE PACK などのSEOプラグインで、出したいページや投稿タイプが noindex になっていないか、スニペットを止める設定（nosnippet・max-snippet）を入れていないかを見る。",
            "ブラウザで https://自社のドメイン/robots.txt を開き、Googlebot や User-agent: * でサイト全体を Disallow にしていないかを見る。",
            "セキュリティ用のプラグインやレンタルサーバーのWAF、CDNで、Googlebot を止めていないかを見る（Search Consoleの「公開URLをテスト」で取得できるか確かめる）。",
            `[Nurevo AEO（無料）](${WP_ORG})は、設定した店舗・会社・サービスの事実を構造化データとllms.txtに出します。構造化データは本文と一致させる必要があるので、料金や営業時間は固定ページの本文にも同じものを書いてください。Google-Extended などAIの学習用のクローラーは、初期設定では robots.txt を変えません。`,
            "Search Consoleで、出したいページをURL検査し、直したページは「インデックス登録をリクエスト」する。［設定］＞［検索の生成 AI］の状態も見る。",
          ],
          after: [
            "Nurevo AEO の無料のAIチェックはPerplexityで行うもので、GoogleのAI機能での表示は測りません。GoogleのAI機能については、次のSearch Consoleのレポートで確かめます。",
          ],
        },
        {
          heading: "出典として出ているかの確かめ方",
          paragraphs: [
            "GoogleのAI機能は、検索のたびに出たり出なかったりします。1回の検索で判断せず、次の2つを組み合わせます。",
          ],
          table: {
            head: ["方法", "分かること", "分からないこと・注意"],
            rows: [
              ["Search Consoleの生成AIパフォーマンスレポート", `AI機能でページが表示された回数（2026年8月31日時点で全サイトに提供、[ヘルプ](${SRC.reportJa})）`, "どんな検索語で出たか、何番目に出たか、AIの回答からのクリック数は分からない"],
              ["Search Consoleの検索パフォーマンス（ウェブ）", "AI機能からの表示・クリックを含めた全体の数字", "AI機能からの分だけを取り出すことはできない"],
              ["手で検索して記録する", "決めた質問で、AIによる概要が出たか、補足のリンクに自社のURLがあったか", "ログインの有無・地域・端末で変わる。同じ条件で、日を変えて複数回記録する"],
            ],
          },
          after: [
            "手で記録するときは、社名を入れない質問（「◯◯市 小児歯科 土曜」など）を5〜10個決め、日付・端末・ログインの有無・AIによる概要が出たか・自社のURLがあったか・代わりに出たサイトを表に残します。社名を入れた質問は、事実を正しく読めているかの確認にだけ使います。レポートの詳しい読み方は[Search Consoleのガイド](/guide/search-console-ai-features)にあります。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "出したいページがURL検査で「Googleに登録されています」になっている",
            "noindex・nosnippet・極端に短い max-snippet が、意図せず入っていない",
            "robots.txt、WAF、CDNで Googlebot を止めていない",
            "Search Consoleの「検索の生成 AI」設定で、サイトを除外していない",
            "答えになる事実（料金・時間・地域・対象）が本文の文字にある",
            "構造化データの内容が、ページに見えている文字と一致している",
            "ビジネスプロフィール・Merchant Centerの情報が、サイトと同じ",
            "AI向けだけの別ページや、細かく分けただけのページを作っていない",
            "生成AIパフォーマンスレポートを毎月同じ期間で見ている",
            "社名なしの質問を決め、同じ条件で複数回記録している",
          ],
        },
      ],
      faqs: [
        { q: "AIによる概要に出るために、特別な設定やタグは必要ですか？", a: "Googleの説明では、追加の要件や特別な最適化はなく、ページがインデックスされ、スニペット付きで検索結果に出せる状態であることが条件です。加えて、Search Consoleの「検索の生成 AI」設定でサイトを除外していないことも挙げられています。" },
        { q: "llms.txt を置くと、AIによる概要やAIモードに出やすくなりますか？", a: "Googleは、Google 検索は llms.txt を使わず、置いても良くも悪くもならないと明記しています。ChatGPTやPerplexityなど、他のAIのために置くかどうかは別に考えてください。" },
        { q: "AIの学習に使われたくありません。AIによる概要にも出なくなりますか？", a: "Googleは、Google 検索へのアクセスは Googlebot の robots.txt で管理し、Google-Extended は「その他のシステム」でのAIの学習とグラウンディングを制限するもの、と分けて案内しています。AI機能への表示を止めたい場合は、Search Consoleの「検索の生成 AI」設定やスニペットの設定を使います。" },
        { q: "nosnippet を入れているページは、AIによる概要の出典になりますか？", a: "スニペット付きで表示できることが条件なので、出典に使われにくくなります。一部だけを隠したい場合は、その部分に data-nosnippet を付けます。" },
        { q: "検索で1位のページなら、必ずAIによる概要に出ますか？", a: "出るとは限りません。AIによる概要は出ない検索も多く、出典を選ぶ基準も公開されていません。他社の調査では上位のページが引用されやすい傾向がありますが、保証ではありません。" },
        { q: "AIによる概要からどれだけアクセスがあったか分かりますか？", a: "Search Consoleでは、AI機能からのクリックは検索パフォーマンスの「ウェブ」に含めて数えられ、分けて見ることはできません。生成AIパフォーマンスレポートでは、AI機能での表示回数が分かります。" },
        { q: "AIによる概要に自社の古い情報が出ます。どうすればいいですか？", a: "補足のリンクから元のページをたどり、自社のページなら直して再クロールをリクエストします。ビジネスプロフィールやMerchant Centerの情報も確かめてください。他社のサイトなら掲載元に更新を頼みます。反映までの時間は決まっていません。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "AIが自社サイトを読めるか確かめる",
        body: "無料チェックは登録不要です。URLを入れると、AIクローラーの許可、構造化データ、llms.txtの状態が分かります。WordPressなら無料のプラグインで、店舗・会社・サービスの事実の構造化データとAI検索のクローラーの許可をまとめて整えられます。",
        label: "AI対応を無料でチェック",
        href: "/check",
        secondary: { label: "無料のWordPressプラグインを入れてみる", href: WP_ORG },
      },
      footnote: FOOT_JA,
    },
    en: {
      title: "How to Be Cited in Google AI Overviews and AI Mode | Nurevo",
      description: "What Google requires for AI Overviews and AI Mode sources, what you don't need, controls that limit display, and WordPress steps and checks.",
      h1: "How your site gets cited in Google AI Overviews and AI Mode, and how to check",
      lead: "According to Google, there are no special optimizations or dedicated files for appearing as a supporting link in AI Overviews or AI Mode. The conditions are that the page is indexed and eligible to appear in Search with a snippet, and that your site is not excluded in Search Console's Search generative AI setting. Google has not published how it chooses which pages to show, so what you can do is get the normal Search basics right, state the facts that answer questions in your page text, and check with Search Console and a manual log.",
      intro: [
        "Written 18 November 2026 (JST). For reading Search Console's generative AI performance report see [How to see AI Overviews and AI Mode in Search Console](/guide/search-console-ai-features); for Perplexity see [How Perplexity cites websites](/guide/perplexity-citations). This guide sets out the conditions for appearing as a source in Google's AI features, as far as Google's own documentation confirms them.",
        "AI answers change with the day and the wording, and many searches show no AI Overview at all. These steps make your pages usable as sources and help you check correctly; they do not guarantee an appearance or a position.",
      ],
      sections: [
        {
          heading: "What Google has published, and what it hasn't",
          paragraphs: [
            `Google explains how AI features relate to websites on two pages: [AI features and your website](${SRC.aiFeatures}) (updated 10 December 2025) and [Optimizing your website for generative AI features on Google Search](${SRC.optGuide}) (updated July 2026). This guide treats only what those pages say as fact.`,
          ],
          table: {
            head: ["Topic", "In Google's docs?", "What they say"],
            rows: [
              ["Conditions for being a supporting link", "Yes", "The page is indexed and eligible to be shown in Search with a snippet. No additional technical requirements or special optimizations"],
              ["Search Console setting", "Yes", `The optimization guide adds that the site must be included in Search Console's Search generative AI setting ([Search Console Help](${SRC.controlEn}))`],
              ["How answers are built", "Partly", "AI Overviews and AI Mode may use \"query fan-out\", running several related searches to find more supporting pages"],
              ["When AI Overviews appear", "Partly", "Only when Google's systems judge them additive to classic Search, so they often don't trigger"],
              ["Special files or structured data", "Yes", "No AI text files, new markup or special schema.org structured data are needed. Google Search ignores llms.txt; having one neither helps nor harms"],
              ["How sources are chosen, how many, in what order", "No", "Not published. Google also says indexing and serving aren't guaranteed"],
              ["How traffic is counted", "Yes", "Impressions and clicks from AI features are included in the Search Console Performance report under the Web search type"],
            ],
          },
        },
        {
          heading: "Common claims in top articles, and how strong the evidence is",
          paragraphs: [
            "We read eight top results for \"how to get cited in Google AI Overviews\" and its Japanese equivalent (four Japanese, four English; two more could not be read because of redirects). Nearly all agree on answering first, ranking in classic Search and tidying structured data. Few linked Google's own documentation in the text, and most numbers came from the publisher's own data or had no source.",
          ],
          table: {
            head: ["Common claim", "Strength of evidence", "How this guide treats it"],
            rows: [
              ["\"Pages that rank well in classic Search get cited more\"", `In Ahrefs's own 2025 study of 1M AI Overviews and 1.9M citations, 76.10% of citations came from top-10 pages ([Ahrefs, in Japanese](${SRC.ahrefsEn})). One company's study, and dated`, "Mentioned as a tendency, since it fits Google's statement that classic SEO basics apply"],
              ["\"Put a 40-60 word answer capsule at the top\"", "Recommendation with no source", "Word counts not used. We only say: answer right under the heading"],
              ["\"Chunk your content into small pieces\"", "Google says there is no requirement to do this", "Listed as something you don't need to do"],
              ["\"An llms.txt file helps you appear in AI Overviews\"", "Google says Google Search ignores llms.txt", "Stated as having no effect for Google (other AIs are a separate question)"],
              ["\"Structured data increases citations\"", "Google says AI features need no special structured data; no official evidence of an effect", "Only: keep it consistent with the visible text"],
              ["Domain shares such as \"YouTube is 35% of citations\"", "A tool vendor's snapshot", "Not used"],
            ],
          },
          after: [
            "None of the eight explained what snippet controls such as nosnippet do to AI features, gave WordPress steps, or described a concrete way to record manual checks, and only one mentioned Search Console's Search generative AI setting. Those are the focus below.",
          ],
        },
        {
          heading: "Query fan-out: one question becomes several searches",
          paragraphs: [
            "Google says AI Overviews and AI Mode may run several related searches at once from a user's question and build the answer from more pages. A question such as \"I need a dentist in my town who sees children on Saturdays\" might be split into searches like \"pediatric dentist [town]\", \"Saturday dentist [town]\" and \"what to bring to a child's first dental visit\".",
            "For a site, this means one page doesn't have to answer the whole question. A page that clearly answers one of the smaller questions can still be a candidate. Google doesn't publish how questions are split, so the practical step is to list the questions customers really ask and check that each has a page or heading that answers it.",
          ],
          list: [
            "Give hours, prices, service area and who it is for (ages, industries) their own headings and text.",
            "Answer common questions such as \"Can you ...?\" or \"How much does ... cost?\" in one or two sentences.",
            "Split services and locations into their own pages, and keep facts consistent between them.",
          ],
        },
        {
          heading: "Check the basics in Search Console",
          paragraphs: [
            "Google's conditions are the same as for normal Search. Start by checking that the pages you want cited can appear in normal Search at all.",
          ],
          table: {
            head: ["What to check", "Where", "Examples of problems"],
            rows: [
              ["Is the page indexed?", "URL Inspection in Search Console", "\"URL is not on Google\", a noindex tag, or a canonical pointing to another page"],
              ["Can Googlebot read it?", "URL Inspection's live test, robots.txt", "A Disallow in robots.txt, a CDN or WAF blocking Googlebot, or a login wall"],
              ["Can it show a snippet?", "The robots meta tag in the page HTML", "nosnippet, or a very short max-snippet"],
              ["Is the main text readable as text?", "\"View crawled page\" in URL Inspection", "Answers only inside images or PDFs, or blocked JavaScript hiding the text"],
              ["Search generative AI setting", "Search Console, Settings > Search generative AI", "The site or a directory is excluded (exclusion removes impressions and traffic from AI Overviews and AI Mode)"],
            ],
          },
          after: [
            "Google says it can process content rendered with JavaScript as long as it isn't blocked, and that perfectly semantic HTML is not required. It also says recrawling can take anywhere from several days to several months. Note the date of each fix and don't judge the result straight away.",
          ],
        },
        {
          heading: "Controls that limit display, and their effect on AI features",
          paragraphs: [
            `Google says that to limit what is shown from your pages in Search you can use nosnippet, data-nosnippet, max-snippet or noindex ([robots meta tag](${SRC.robotsMeta})). Its 2025 blog post adds that more restrictive settings limit how content is featured in AI experiences ([Search Central blog](${SRC.blog2025})). Check that none of these are on pages you want cited by mistake.`,
          ],
          code: SNIPPET_EN,
          table: {
            head: ["Control", "What it does", "Effect on AI features (as far as Google explains)"],
            rows: [
              ["robots.txt (Googlebot)", "Allows or blocks crawling for Google Search", "Google calls this the control for Search access. Blocked pages can't be sources in AI features either"],
              ["noindex", "Removes the page from search results", "Indexing is a condition, so the page can't be a source"],
              ["nosnippet", "Shows no snippet for the page", "Snippet eligibility is a condition, so the page becomes much less usable as a source"],
              ["max-snippet", "Caps snippet length", "The shorter it is, the less can be used"],
              ["data-nosnippet", "Keeps part of a page out of snippets", "That part becomes less usable; the rest of the page is unaffected"],
              ["Search generative AI setting (Search Console)", "Excludes the site or directories from AI features", `Excluded sites get no impressions or traffic from AI Overviews, AI Mode or Discover's generative AI features ([Help](${SRC.controlEn}))`],
              ["Google-Extended (robots.txt)", "Limits AI training and grounding in Google's \"other systems\"", "On the AI features page it is presented as a setting for those other systems, separate from controlling crawling for Google Search"],
            ],
          },
          after: [
            "Use data-nosnippet for member-only prices or passages you don't want quoted, and noindex or the Search generative AI setting to keep a whole page or section out. If you only want to keep your content out of AI training, look at Google-Extended rather than a Search setting.",
          ],
        },
        {
          heading: "What you don't need to do, according to Google",
          paragraphs: [
            "Google's optimization guide has a section on what you don't need to do. It lists several tasks often recommended \"for AI\" as unnecessary for Google Search.",
          ],
          list: [
            "Creating llms.txt or other AI files, new markup or Markdown versions of pages (Google Search doesn't use them; they neither help nor harm).",
            "Breaking content into small chunks so AI can understand it (Google says there is no requirement).",
            "Adding special schema.org structured data just for AI features (not needed; using it for rich results is a separate matter).",
            "Treating AEO or GEO as a separate discipline (Google says optimizing for generative AI search is optimizing for the search experience, so it is still SEO).",
          ],
          after: [
            "This applies to Google Search only. An llms.txt file can still be a useful entry point for other AIs such as ChatGPT and Perplexity ([llms.txt guide](/guide/llms-txt)). Google also says that producing many pages mainly to manipulate rankings or AI answers violates its scaled content abuse spam policy.",
          ],
        },
        {
          heading: "What you can do to be a usable source",
          paragraphs: [
            "What Google lists are the same basics as for normal Search. Put in terms of being a source, they look like this.",
          ],
          list: [
            "Write facts and experience only you have, not a rewrite of other sites (price breakdowns, real procedures, the conditions of cases you handled).",
            "Put important content in text, not only in images or PDFs.",
            "Link pages internally (from the service list to each service, from articles to related services).",
            "Keep structured data consistent with the visible text. Don't put facts only in structured data.",
            "Add useful images and video alongside the text that explains them.",
            "Make pages easy to read on phones and not too slow.",
          ],
          after: [
            `For reference, Ahrefs's 2025 study found that 76.10% of AI Overview citations were pages ranking in the top 10 for that search ([Ahrefs, in Japanese](${SRC.ahrefsEn})). It is one company's study and not recent, so read it as a tendency rather than a fixed number: pages that do poorly in classic Search are unlikely sources for AI features too.`,
          ],
        },
        {
          heading: "Local businesses and online shops: Business Profile and Merchant Center",
          paragraphs: [
            "Google says AI responses can include product information and information about local businesses where appropriate, and that keeping Merchant Center (product data) and Google Business Profile up to date helps products and services be visible in both AI responses and other search results. Shops and local businesses should check these two as well as the site.",
          ],
          table: {
            head: ["Type", "What to check"],
            rows: [
              ["Shops and local services", "Business Profile hours (including holidays and closures), categories, services, address and phone match your about page and structured data"],
              ["Online shops", "Prices, stock and shipping in the Merchant Center feed match the product pages, with no expired sale prices left"],
              ["Both", "When you change the site, update the Business Profile or feed the same day. If they disagree, neither AI nor people can tell which is right"],
            ],
          },
          after: [
            "For local business structured data see [Local business schema and SEO plugins](/guide/local-business-schema-seo-plugins); for shops see [AI search for online shops](/guide/online-shop-ai-search).",
          ],
        },
        {
          heading: "Steps in WordPress",
          list: [
            "In Settings > Reading, check that \"Discourage search engines from indexing this site\" is not ticked (it outputs noindex).",
            "In your SEO plugin (Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and so on), check that the pages or post types you want cited are not set to noindex, and that no snippet limits (nosnippet, max-snippet) are set.",
            "Open https://your-domain/robots.txt and check that Googlebot or User-agent: * does not disallow the whole site.",
            "Check that a security plugin, hosting WAF or CDN does not block Googlebot (use Search Console's live URL test to confirm it can fetch the page).",
            `[Nurevo AEO (free)](${WP_ORG}) publishes the business, company and service facts you enter as structured data and in llms.txt. Structured data must match the visible text, so put the same prices and hours in your page text too. AI training crawlers such as Google-Extended are left to your robots.txt by default.`,
            "In Search Console, inspect the pages you want cited and request indexing after fixes. Check Settings > Search generative AI as well.",
          ],
          after: [
            "Nurevo AEO's free AI check runs on Perplexity; it does not measure appearances in Google's AI features. For Google, use the Search Console reports below.",
          ],
        },
        {
          heading: "How to check whether you appear as a source",
          paragraphs: [
            "Google's AI features appear on some searches and not others. Don't judge from one search; combine these methods.",
          ],
          table: {
            head: ["Method", "What it shows", "What it misses, and cautions"],
            rows: [
              ["Search Console generative AI performance report", `How often pages were shown in AI features (available to all sites as of 31 August 2026, [Help](${SRC.reportEn}))`, "Not which queries, what position or how many clicks came from AI answers"],
              ["Search Console Performance report (Web)", "Totals that include impressions and clicks from AI features", "The AI feature share can't be separated"],
              ["Search by hand and record", "For fixed questions, whether an AI Overview appeared and whether your URL was among the supporting links", "Varies with login state, location and device. Record under the same conditions on several days"],
            ],
          },
          after: [
            "For a manual log, pick five to ten unbranded questions (\"pediatric dentist [town] Saturday\"), and record the date, device, login state, whether an AI Overview appeared, whether your URL was linked, and which sites appeared instead. Use branded questions only to check that your facts are read correctly. For reading the report in detail, see the [Search Console guide](/guide/search-console-ai-features).",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "URL Inspection shows the pages you want cited as \"URL is on Google\"",
            "No unintended noindex, nosnippet or very short max-snippet",
            "robots.txt, the WAF and the CDN do not block Googlebot",
            "The site is not excluded in Search Console's Search generative AI setting",
            "The facts that answer questions (prices, hours, area, who it is for) are in the page text",
            "Structured data matches the visible text",
            "Business Profile and Merchant Center match the site",
            "No separate AI-only pages or pages split up just for AI",
            "The generative AI performance report is checked monthly over the same period",
            "A fixed set of unbranded questions is recorded several times under the same conditions",
          ],
        },
      ],
      faqs: [
        { q: "Do I need special settings or tags to appear in AI Overviews?", a: "Google says there are no additional requirements or special optimizations: the page must be indexed and eligible to appear in Search with a snippet. Its optimization guide also requires that your site is not excluded in Search Console's Search generative AI setting." },
        { q: "Does an llms.txt file help with AI Overviews or AI Mode?", a: "Google states that Google Search ignores llms.txt and that having one neither helps nor harms. Whether to publish one for other AIs such as ChatGPT or Perplexity is a separate decision." },
        { q: "I don't want my content used for AI training. Will that keep me out of AI Overviews?", a: "Google separates the two: robots.txt rules for Googlebot control access for Google Search, while Google-Extended limits AI training and grounding in Google's other systems. To keep pages out of AI features, use the Search generative AI setting in Search Console or snippet controls." },
        { q: "Can a page with nosnippet be a source in AI Overviews?", a: "Snippet eligibility is a condition, so it becomes much less usable as a source. To hide only part of a page, put data-nosnippet on that part." },
        { q: "If my page ranks first, will it always appear in the AI Overview?", a: "No. Many searches show no AI Overview, and the selection criteria are not public. Third-party studies show top-ranking pages are cited more often, but that is not a guarantee." },
        { q: "Can I see how much traffic AI Overviews sent me?", a: "Search Console counts clicks from AI features inside the Performance report's Web search type and does not separate them. The generative AI performance report shows how often you were shown in AI features." },
        { q: "An AI Overview shows outdated information about us. What can we do?", a: "Follow the supporting links to the source page. If it is yours, fix it and request recrawling; also check your Business Profile and Merchant Center. If it is someone else's site, ask them to update it. There is no set time for changes to show." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See whether AI can read your site",
        body: "The free check needs no sign-up: enter a URL to see AI crawler access, structured data and llms.txt. On WordPress, the free plugin publishes your business, company and service facts as structured data and sets up AI search crawler access in one place.",
        label: "Check your AI readiness for free",
        href: "/check",
        secondary: { label: "Try the free WordPress plugin", href: WP_ORG },
      },
      footnote: FOOT_EN,
    },
  },
};
