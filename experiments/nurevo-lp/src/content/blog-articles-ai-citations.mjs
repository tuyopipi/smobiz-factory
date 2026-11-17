// Content page: how to write blog posts / articles that AI search
// (ChatGPT search, Perplexity, Google AI Overviews / AI Mode) can use as a
// source. For all industries: company blogs, column pages, how-to articles.
// Focus: what is actually confirmed by the platforms versus what circulates in
// "write for AI" articles, a one-article-one-question workflow, writing
// patterns with a worked before/after example, dates / authors / sources,
// WordPress steps with Nurevo AEO, and how to check results afterwards.
//
// Written 2026-11-17 (JST). Product facts come from the plugin itself
// (experiments/webmcp-canary/wordpress-plugin/webmcp-canary):
// - nurevo-webmcp.php (~line 6630-6670): on single posts without an SEO plugin
//   article node, Nurevo publishes BlogPosting with headline, description
//   (the excerpt, or the first 40 words of the body when there is none),
//   datePublished, dateModified (WordPress's modified date), author (the
//   user's display name as Person), image (featured image), inLanguage,
//   publisher -> the business node. Pages get WebPage.
// - readme 0.9.1: WebSite, WebPage, Article and breadcrumbs stay as the SEO
//   plugin publishes them; with VK ExUnit only missing publisher, description
//   and language are added to its Article.
// - per-page panel: leave out of llms.txt, no Nurevo structured data, the
//   page's own FAQ (Nurevo FAQ block "This page's own questions" or
//   [nurevo_faq source="post"]), published as FAQPage on that page only.
// - llms.txt: 30 most recently modified published pages/posts;
//   webmcp_canary_llms_txt_lines filter.
// - Free AI check: three questions a month on Perplexity built from business
//   type and area; Pro measurement (beta) on Perplexity.
// - Own study: aeo-signals-ai-answers-study (62 businesses, rho 0.03).
//
// Outside facts and where they were read:
// - Google Search Central blog "Top ways to ensure your content performs well
//   in Google's AI experiences on Search" (John Mueller, 2025-05-21), read
//   2026-11-17: unique valuable content for people; page experience (main
//   content easy to tell apart); access; preview controls (nosnippet,
//   data-nosnippet, max-snippet, noindex; more restrictive = less shown in AI
//   experiences); structured data must match visible content; multimodal;
//   value of visits; evolve with users.
// - Google "AI features and your website": no extra requirements or special
//   optimization; indexed and eligible to be shown with a snippet (read
//   2026-11-10 for search-console-ai-features; not re-fetched today).
// - Google "Creating helpful, reliable, people-first content" (last updated
//   2026-10-05): accurate authorship info encouraged; explain how content was
//   made incl. automation/AI (read 2026-11-16 for person-profile-page-ai-search).
// - Search Console generative AI performance report (Search): available to all
//   sites from 2026-08-31 (read 2026-11-10).
// - OpenAI crawlers (OAI-SearchBot opt-out = not shown in ChatGPT search
//   answers) and utm_source=chatgpt.com (Publishers FAQ); Perplexity crawlers
//   (read 2026-10-31 for measure-ai-visibility).
// - Evertune "9 Ways to Structure Your Content to Be Cited by ChatGPT"
//   (2026-05-01), read 2026-11-17: own analysis of about 33,000 ChatGPT-cited
//   URLs; median 941 words; about half of citations are listicles. Vendor
//   data with a thin method - presented as such.
// Not stated on purpose (could not be read on a primary page this run): the
// numbers attributed to the GEO paper (arXiv 2311.09735), the "44.2% of
// citations from the first 30%" figure, Google's AI optimization guide text
// on chunking, the date Google changed FAQ rich results, Google's
// publication-dates guidance. The page says these circulate unverified.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleBlog: "https://developers.google.com/search/blog/2025/05/succeeding-in-ai-search",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleAiJa: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja",
  helpful: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
  helpfulJa: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=ja",
  gscReportJa: "https://support.google.com/webmasters/answer/16984139?hl=ja",
  gscReportEn: "https://support.google.com/webmasters/answer/16984139?hl=en",
  openaiBots: "https://developers.openai.com/api/docs/bots",
  openaiFaq: "https://help.openai.com/en/articles/12627856-publishers-and-developers-faq",
  perplexityBots: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers",
  evertune: "https://www.evertune.ai/resources/insights-on-ai/9-ways-to-structure-your-content-to-be-cited-by-chatgpt",
};

export default {
  slug: "blog-articles-ai-citations",
  targetQueries: [
    "AIに引用される 記事 書き方",
    "AI Overviews 引用 ブログ",
    "ブログ AI検索対策 書き方",
    "how to write blog posts that get cited by ChatGPT",
    "write content for AI Overviews citations",
    "blog AEO writing guide",
  ],
  related: ["how-to-appear-in-chatgpt", "person-profile-page-ai-search", "search-console-ai-features", "llms-txt", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "AIに引用される記事・ブログの書き方：確かな根拠と手順 | Nurevo",
      description: "ChatGPT・Perplexity・GoogleのAIによる概要に出典として選ばれやすい記事の書き方。公式に確認できることと噂の区別、1記事1質問の型、書き直しの例、WordPressの設定、公開後の確かめ方。",
      h1: "AIに引用される記事・ブログの書き方：公式情報で確かめた手順と、根拠のない「AI向けテクニック」の見分け方",
      lead: "AIが記事を出典に選ぶためにまず必要なのは、その記事が検索エンジンに読める状態にあり、質問への答えが本文の中に「そこだけ抜き出しても意味が通る形」で書かれていることです。Googleは、AIによる概要やAIモードに出るための特別な書き方や追加の要件はないと説明しています。実際に差がつくのは、1記事で1つの質問に冒頭で答えること、自社にしかない事実（数字・手順・事例）を足すこと、更新日・著者・出典を見える形で書くことの3つです。",
      intro: [
        "作成日：2026年11月17日（JST）。Googleの検索セントラル ブログ「AI 検索で成果を上げるためのヒント」（2025年5月21日）は同日に確認しました。「AI機能とウェブサイト」、Search Consoleの生成AIパフォーマンスレポート、OpenAI・Perplexityのクローラの説明は、このサイトの別のガイドで2026年10〜11月に確認した範囲だけを使っています。対象は、会社や店のブログ・コラム・お役立ち記事を書く人と、それを請け負う制作会社です。",
        "AIの回答は日や聞き方によって変わります。この記事の手順は、AIが記事を読み、正しく使える状態にするためのもので、AIの回答に出ることや引用されることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "AIが記事を出典にするまでの流れ",
          paragraphs: [
            "ChatGPTの検索、Perplexity、GoogleのAIによる概要は、質問を受けるとウェブを検索し、見つかったページを読んで答えを組み立て、使ったページを出典として示します。記事が出典になるには、まず「検索で見つかる」「中身を読める」の2つを満たす必要があります。書き方の工夫はその後です。",
          ],
          table: {
            head: ["AI", "記事が候補に入る条件として公開されていること", "確認先"],
            rows: [
              ["GoogleのAIによる概要・AIモード", "通常の検索にインデックスされていて、スニペット付きで表示できること。追加の要件や特別な最適化はない", `[Google：AI機能とウェブサイト](${SRC.googleAiJa})`],
              ["ChatGPTの検索", "OAI-SearchBotを robots.txt で拒否したサイトは、ChatGPTの検索の回答に表示されない", `[OpenAI：クローラの概要](${SRC.openaiBots})`],
              ["Perplexity", "PerplexityBot（検索用）と Perplexity-User（利用者の操作で開く）を公開している", `[Perplexity：クローラ](${SRC.perplexityBots})`],
            ],
          },
          after: [
            "Googleはさらに、スニペットを制限する設定（nosnippet、data-nosnippet、max-snippet、noindex）を強くするほど、AIの機能での見え方も限られると書いています（[Google 検索セントラル ブログ](" + SRC.googleBlog + ")）。記事テンプレートや SEOプラグインで max-snippet を小さくしていないかも確認します。",
          ],
        },
        {
          heading: "上位の記事でよく見る主張と、根拠の強さ",
          paragraphs: [
            "「AIに引用される書き方」で上位に出る日本語・英語の記事を13本読みました。冒頭で答える、見出しを質問にする、出典を書くといった助言の多くは、読者にとっても読みやすくなるので取り入れて損はありません。一方で、数字の多くは元の調査へのリンクがないか、記事ごとに数字が食い違っていました。この記事では、確かめられなかった数字は使いません。",
          ],
          table: {
            head: ["よく見る主張", "確かめた結果", "この記事での扱い"],
            rows: [
              ["「AI向けの特別な書き方が必要」", "Googleは追加の要件や特別な最適化はないと説明している", "読者向けの良い記事を書くことが本体。AI専用の文体は作らない"],
              ["「統計を足すと引用が40％増える」などの研究の数字", "同じ研究（arXiv 2311.09735）を引く記事どうしで数字が違い、今回原文を確認できなかった", "数字は使わない。出典つきの数字が読者に役立つのは確か"],
              ["「引用の44％は記事の最初の30％から」", "原典へのリンクがない記事が多く、集め方（どのAI、何件）が書かれていない", "使わない。冒頭で答えるのは読者のためにも良いので、理由を数字に頼らずに勧める"],
              ["「引用される記事の中央値は941語」", `Evertuneが約3万3,000件のChatGPTの引用URLを自社で分析した値（[Evertune](${SRC.evertune})）。選び方の説明は少ない`, "参考程度。字数を目標にせず、質問に答え切る長さにする"],
              ["「FAQの構造化データを入れれば引用される」", "GoogleのFAQのリッチリザルトの扱いは記事ごとに説明が食い違っていた。AIへの効果を示す公式の説明はない", "FAQは読者に見える形で書き、構造化データは見える内容と一致させる"],
              ["「llms.txtを置けば記事が読まれる」", "Googleは必要ないと説明。AI各社が他社の llms.txt を回答に使う公式の説明も見当たらない", "置くなら要約として。記事の中身の代わりにはならない（[llms.txtの書き方](/guide/llms-txt)）"],
            ],
          },
        },
        {
          heading: "書く前に：1記事で答える質問を1つ決める",
          paragraphs: [
            "AIに聞かれる質問は「〇〇とは？」のような定義だけでなく、「どう選ぶ？」「いくら？」「何から始める？」「うまくいかないときは？」と具体的です。1本の記事に質問をいくつも詰めると、どの質問の答えなのかが曖昧になります。まず、記事ごとに答える質問を1つ決め、その質問をそのまま、または少し整えて記事のタイトルと最初の見出しに使います。",
            "質問の集め方は、外部のツールより手元の情報が確実です。問い合わせフォームやメール、電話で実際に聞かれたこと、Search Console の検索クエリ（文章になっている長い語句）、営業や受付が毎回説明していることを1か月分書き出すと、記事にすべき質問がそろいます。",
          ],
          table: {
            head: ["質問の型", "例", "記事の型", "冒頭に書くこと"],
            rows: [
              ["定義", "「選定療養とは？」「AEOとは？」", "用語の説明", "1文の定義と、誰に関係するか"],
              ["手順", "「法人の口座の作り方は？」", "手順の記事", "手順の数とかかる時間、最初の1歩"],
              ["比較・選び方", "「SaaSの会計ソフトはどれがいい？」", "比較表つきの記事", "選ぶ基準と、条件ごとのおすすめ"],
              ["料金", "「外壁塗装の費用は？」", "料金の内訳の記事", "目安の幅、何で変わるか、税込か"],
              ["トラブル", "「AIが会社の住所を間違える」", "原因別の直し方", "よくある原因の上位と、最初に確認すること"],
              ["地域・条件つき", "「梅田で土曜に開いている歯医者は？」", "店や会社のページ（記事より事業の情報）", "記事ではなく、営業時間や所在地のページを正確にする"],
            ],
          },
          after: [
            "最後の行のように、地域や営業時間を含む質問は、記事よりも事業そのものの情報（会社概要、店舗ページ、Googleビジネスプロフィール）が使われやすい質問です。記事でカバーしようとせず、[店舗の構造化データ](/guide/local-business-schema-seo-plugins)など事業の情報を先に整えます。",
          ],
        },
        {
          heading: "書き方の型：抜き出しても意味が通る段落にする",
          paragraphs: [
            "AIは記事全体ではなく、質問に合う段落や表を使って答えを組み立てます。その段落だけを読んでも話が通じるかが、書き方の目安になります。",
          ],
          list: [
            "冒頭の2〜3文で質問に答える。前置き（「近年〜が注目されています」）や自己紹介を先に置かない。",
            "見出しは、読者が聞く言葉で書く（「料金の目安と、何で変わるか」のように、何が書いてあるかがわかる見出し）。",
            "「この」「上記の」「前述のとおり」に頼らず、段落の中で主語と対象を書き直す。",
            "数字には時点と出典を書く（「2026年10月時点」「〇〇の調査より」）。自社の数字なら、数え方も書く。",
            "比較は表にする。画像の表はAIも検索エンジンも読みにくいので、HTMLの表にする。",
            "条件で答えが変わる場合は、条件ごとに分けて書く（「個人の場合」「法人の場合」）。",
            "自社にしかない事実を入れる：実際の件数、かかった日数、使った手順、よくある失敗とその直し方。",
          ],
          after: [
            "書き直しの例です（架空の税理士事務所のコラム）。",
            "直す前：「近年、インボイス制度への関心が高まっています。当事務所にも多くのご相談をいただいております。そこで今回は、インボイス登録について、上記の背景を踏まえて詳しく解説していきたいと思います。」",
            "直した後：「売上が年1,000万円以下の個人事業主でも、取引先の多くが課税事業者なら、インボイスの登録を検討する価値があります。当事務所が2026年に受けた相談では、登録を決めた理由のほとんどが『取引先から求められた』でした。判断の基準は次の3つです。」",
            "直した後の段落は、質問（登録すべきか）への答え、判断の材料、自社の一次情報（相談の傾向）を最初の3文に含んでいます。数字や制度の条件を書くときは、国税庁など公的な情報で最新の内容を確かめ、出典のリンクを付けます。",
          ],
        },
        {
          heading: "AIに使われにくい記事のパターンと直し方",
          table: {
            head: ["よくある形", "なぜ使われにくいか", "直し方"],
            rows: [
              ["結論が最後にある", "質問に合う段落が見つかっても、答えが書いていない", "結論を冒頭に移し、理由と手順を後ろに置く"],
              ["料金表や比較表が画像だけ", "文字として読めない", "HTMLの表にし、画像を使うなら代替テキストに要点を書く"],
              ["日付がない、古い年のまま", "いつの情報かわからず、古い情報として扱われうる", "作成日と更新日を本文に書き、内容を見直したときだけ更新日を変える"],
              ["出典のない数字", "読者が確かめられない", "一次情報へのリンクを付ける。確かめられない数字は消す"],
              ["他の記事の言い換え", "その記事を選ぶ理由がない", "自社の件数・事例・手順・写真など、そこにしかない事実を足す"],
              ["中身がタブやボタンの後ろで、JavaScriptで後から表示される", "クローラが本文を読めないことがある", "大事な答えは最初からHTMLに書く。ブラウザで「ページのソースを表示」して本文があるか確かめる"],
              ["同じ質問の記事が何本もある", "どれが正しい答えか曖昧になり、古い記事が使われることもある", "1本にまとめ、古い記事は新しい記事へ転送する"],
              ["AIで量産した記事を確認せずに公開", "誤りが混ざりやすく、内容が他と同じになりやすい", "人が事実を確かめ、自社の情報を足してから公開する"],
            ],
          },
        },
        {
          heading: "更新日・著者・出典を見える形で書く",
          paragraphs: [
            `Googleは、読者が「誰が書いたか」を知りたいと思うところに、著者名などの正確な情報を出すことを勧めています。コンテンツの作り方（自動化やAIを使ったか）を読者に説明することも勧めています（[Google：有用なコンテンツの作成](${SRC.helpfulJa})）。記事では次の4つを本文に書きます。`,
          ],
          list: [
            "作成日と更新日：本文の上か下に書く。誤字の修正だけで更新日を変えない。内容を見直したときに日付と「何を直したか」を1行添えると、読者にもAIにも新しさが伝わる。",
            "著者：名前と肩書きを書き、著者のプロフィールページへリンクする（[プロフィールページの作り方](/guide/person-profile-page-ai-search)）。監修がある場合は、監修した範囲と日付を分けて書く。",
            "出典：数字・制度・他社の仕様には、一次情報（官公庁、メーカーの公式ページ、元の調査）へのリンクを付ける。まとめ記事からの孫引きは避ける。",
            "作り方：AIで下書きした場合は、その旨と、人が確認したことを書く。",
          ],
          after: [
            `構造化データ（BlogPostingやArticle）は、これらと同じ値を機械が読める形で出すものです。Googleは、構造化データの中身がページに見えている内容と一致していることを求めています（[Google 検索セントラル ブログ](${SRC.googleBlog})）。本文にない著者や日付を構造化データだけに書かないようにします。`,
          ],
        },
        {
          heading: "WordPressでの手順（Nurevo AEOを使う場合）",
          paragraphs: [
            "WordPressの投稿は、ほとんどの場合テーマかSEOプラグインが記事の構造化データを出しています。無料のプラグイン Nurevo AEO は、SEOプラグイン（Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACK など）が出す WebSite・WebPage・Article・パンくずをそのまま残し、事業者の情報など足りないものだけを足します。SEOプラグインがない場合は、Nurevo AEO が投稿ごとに次の値で BlogPosting を出します。",
          ],
          table: {
            head: ["BlogPostingの項目", "WordPressのどこから来るか", "書くときの注意"],
            rows: [
              ["headline・name", "投稿のタイトル", "質問か、答えがわかるタイトルにする"],
              ["description", "抜粋。空なら本文の最初の40語", "抜粋欄に、冒頭の答えを1〜2文で書く"],
              ["datePublished・dateModified", "公開日時と更新日時", "WordPressは保存するたびに更新日時が変わる。誤字だけの修正をまとめて行う"],
              ["author", "投稿者の表示名（ユーザー設定の「ブログ上の表示名」）", "ログイン名ではなく、本名や記事に出す名前を表示名にする"],
              ["image", "アイキャッチ画像", "記事の内容がわかる画像を設定する"],
              ["publisher", "Nurevo AEO に登録した事業者の情報", "会社名・所在地などを設定で正確に入れる"],
            ],
          },
          after: [
            "手順は次のとおりです。",
            `1. [WordPress.org](${WP_ORG}) から Nurevo AEO を入れ、設定ウィザードで事業者の情報を入れる。2. 記事を書き、抜粋欄に冒頭の答えを書く。3. 投稿者の表示名とアイキャッチ画像を確かめる。4. 読者がよく聞く質問がある記事では、編集画面の右側にある Nurevo AEO の欄の「このページのよくある質問」に入れ、本文に Nurevo FAQ ブロックを置いて「このページ専用の質問」に設定する。質問は本文に表示され、その記事だけに FAQPage として出ます。5. 内容が古くなった記事は、同じ欄の「このページをllms.txtに載せない」にチェックするか、新しい記事に統合する。`,
            "Nurevo AEO の llms.txt には、更新日が新しい公開中の固定ページと投稿が30件入ります。記事を多く書くサイトでは古い記事が自動で外れるので、必ず載せたい記事がある場合は、開発者向けのフィルター webmcp_canary_llms_txt_lines で行を足せます。",
          ],
        },
        {
          heading: "公開後に確かめること",
          paragraphs: [
            "記事が引用されたかは、1つの道具ではわかりません。次の4つを組み合わせて、月に1回ほど記録します。",
          ],
          table: {
            head: ["見るもの", "わかること", "わからないこと"],
            rows: [
              ["Search Console の生成AIパフォーマンスレポート（検索）", `GoogleのAIによる概要・AIモードでの表示回数を、ページごとに見られる。2026年8月31日からすべてのサイトに提供（[ヘルプ](${SRC.gscReportJa})）`, "クリック、ChatGPTやPerplexityでの表示"],
              ["アクセス解析の参照元", `AIの回答から来た訪問。OpenAIは、ChatGPTの検索結果のリンクに utm_source=chatgpt.com を付けるとしている（[OpenAI](${SRC.openaiFaq})）`, "クリックされなかった引用"],
              ["サーバーのアクセスログ", "OAI-SearchBot・PerplexityBot などが記事を読みに来ているか", "読まれたあと回答に使われたか"],
              ["実際に質問して記録する", "記事が答える質問をAIに聞き、出典に記事が出たか、名前が出たかを日付と一緒に記録する", "1回の結果だけでは偶然の差が大きい。日を変えて何回か聞く"],
            ],
          },
          after: [
            `Nurevo AEO の無料のAIチェックは、月に1回、業種と地域から作った3つの質問を Perplexity に聞き、事業者の名前やサイトが出たかを記録します（記事ごとの計測ではありません）。Proプランの計測（β）は現在 Perplexity が対象です。測り方の詳細は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。`,
            `なお、Nurevo が62の事業者で調べたところ、サイトの中の対策の点数と Perplexity の回答への登場には、はっきりした関係が見つかりませんでした（[調査結果](/guide/aeo-signals-ai-answers-study)）。書き方を整えることは前提で、登場するかは質問の内容や、他のサイトでどう書かれているかにも左右されます。記事の成果は、引用された数より「答えている質問に対して、正しく使われているか」で見るのが確実です。`,
          ],
        },
        {
          heading: "公開前のチェックリスト",
          list: [
            "記事が答える質問を1つに決め、タイトルと最初の見出しに入れた。",
            "冒頭の2〜3文で質問に答えている。",
            "各段落は、そこだけ読んでも主語と対象がわかる。",
            "比較・料金・手順はHTMLの表や番号つきリストになっている（画像だけではない）。",
            "数字に時点と出典のリンクがある。確かめられない数字は書いていない。",
            "自社にしかない事実（件数・事例・手順・失敗例）が入っている。",
            "作成日・更新日・著者名が本文に見えていて、著者ページにリンクしている。",
            "大事な答えがタブやボタンの後ろに隠れていない（ページのソースに本文がある）。",
            "robots.txt で OAI-SearchBot・PerplexityBot を止めていない。noindex や小さい max-snippet が付いていない。",
            "構造化データの著者・日付・画像が、本文と一致している。",
            "同じ質問の古い記事がない（あれば統合・転送した）。",
          ],
        },
      ],
      faqs: [
        { q: "記事は何文字くらいが良いですか？", a: "決まった字数はありません。質問に答え切るのに必要な長さが目安です。ベンダーの分析で引用された記事の字数の中央値が出ていることはありますが、字数を増やすこと自体に効果がある根拠はありません。" },
        { q: "見出しはすべて疑問文にするべきですか？", a: "すべてである必要はありません。読者が聞く言葉で、その見出しの下に何が書いてあるかがわかることが大切です。「料金の目安と、何で変わるか」のような見出しでも十分です。" },
        { q: "AIで書いた記事は引用されませんか？", a: "AIを使ったこと自体で除外されるという公式の説明はありません。ただ、AIの下書きは誤りが混ざりやすく、他の記事と同じ内容になりやすいので、人が事実を確かめ、自社の情報を足してから公開します。Googleはコンテンツの作り方を読者に説明することを勧めています。" },
        { q: "古い記事は消したほうがいいですか？", a: "同じ質問に答える新しい記事があるなら、古い記事の中身を新しい記事に移し、古い記事は新しい記事へ転送するのが基本です。情報として残す価値がある記事は、冒頭に「〇年時点の情報」と書き、新しい記事へのリンクを置きます。" },
        { q: "FAQを記事の最後に付けると引用されやすくなりますか？", a: "読者が実際に聞く質問なら、読者にとって役に立ちます。引用が増えると示す公式の説明はありません。FAQを付けるなら本文に見える形で書き、構造化データを出す場合は見えている質問と一致させます。" },
        { q: "更新日を新しくすれば、AIに新しい記事として扱われますか？", a: "日付だけを変えることは勧めません。内容を見直したときに更新日を変え、何を直したかを1行書きます。中身が古いまま日付だけ新しいと、読者の信頼を損ないます。" },
        { q: "この手順どおりにすれば、記事は必ずAIに引用されますか？", a: "保証はできません。AIの回答は日や聞き方によって変わり、他のサイトの情報にも左右されます。この手順は、AIが記事を読み、正しく使える状態にするためのものです。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "あなたのサイトの記事がAIに読める状態か確かめる",
        body: "登録不要の無料チェックで、URLを入れるだけで構造化データ・llms.txt・AIクローラの許可の状態がわかります。WordPressなら、無料のプラグインが記事の著者・日付と事業者の情報を構造化データで出します。",
        label: "AIに読まれているか無料でチェック",
        href: "/check",
        secondary: { label: "WordPressプラグインを無料で入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPTおよびOpenAIはOpenAIの、PerplexityはPerplexity AIの、Google・Search ConsoleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACK、Evertune、WordPressおよび各製品名は、それぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。",
    },
    en: {
      title: "How to Write Blog Posts That AI Search Cites | Nurevo",
      description: "Write articles ChatGPT, Perplexity and Google AI Overviews can cite: confirmed facts vs rumours, one question per post, a rewrite example, WordPress steps.",
      h1: "How to write blog posts that AI search cites: steps checked against official sources, and how to spot \"AI writing tricks\" with no evidence behind them",
      lead: "For an AI to cite your article, the article first has to be readable by search engines, and the answer has to sit in the text in a form that still makes sense when lifted out on its own. Google says there are no extra requirements and no special optimization for appearing in AI Overviews or AI Mode. What actually makes a difference is three things: answering one question per article, right at the top; adding facts only you have (your numbers, steps and cases); and showing the dates, the author and your sources on the page.",
      intro: [
        "Written 17 November 2026 (JST). Google's Search Central blog post \"Top ways to ensure your content performs well in Google's AI experiences on Search\" (21 May 2025) was read that day. Google's \"AI features and your website\", the Search Console generative AI performance report and OpenAI's and Perplexity's crawler documentation are used only as far as other guides on this site confirmed them in October and November 2026. This guide is for people who write company or shop blogs, columns and how-to articles, and for agencies that write them for clients.",
        "AI answers change from day to day and with the wording of the question. These steps make your articles readable and usable by AI; they do not guarantee that you will appear in, or be cited by, any AI answer.",
      ],
      sections: [
        {
          heading: "How an article becomes an AI source",
          paragraphs: [
            "ChatGPT search, Perplexity and Google's AI Overviews take a question, search the web, read the pages they find, build an answer and show the pages they used as sources. To become one of those sources, an article first has to be findable in search and readable. Writing technique comes after that.",
          ],
          table: {
            head: ["AI", "What the provider says about being a candidate", "Where to check"],
            rows: [
              ["Google AI Overviews and AI Mode", "The page is indexed in normal Search and eligible to be shown with a snippet. No extra requirements or special optimization", `[Google: AI features and your website](${SRC.googleAi})`],
              ["ChatGPT search", "Sites that block OAI-SearchBot in robots.txt are not shown in ChatGPT search answers", `[OpenAI: overview of crawlers](${SRC.openaiBots})`],
              ["Perplexity", "Documents PerplexityBot (for search) and Perplexity-User (opens pages when a user acts)", `[Perplexity: crawlers](${SRC.perplexityBots})`],
            ],
          },
          after: [
            "Google also notes that the more restrictive your preview controls are (nosnippet, data-nosnippet, max-snippet, noindex), the more limited your content is in its AI experiences ([Google Search Central blog](" + SRC.googleBlog + ")). Check that your post template or SEO plugin has not set a small max-snippet.",
          ],
        },
        {
          heading: "Common claims in top-ranking articles, and how well they hold up",
          paragraphs: [
            "We read 13 Japanese and English articles that rank for \"how to get cited by AI\". Much of their advice (answer first, use question-style headings, cite sources) also makes articles easier for people to read, so it does no harm. Many of the numbers, though, had no link to the original study, or the same study was quoted with different numbers in different articles. This guide does not use numbers we could not check.",
          ],
          table: {
            head: ["Common claim", "What we found", "How this guide treats it"],
            rows: [
              ["\"You need a special way of writing for AI\"", "Google says there are no extra requirements or special optimization", "Writing a good article for readers is the main job. No separate \"AI style\""],
              ["\"Adding statistics raises citations by 40%\" and other study figures", "Articles quoting the same study (arXiv 2311.09735) give different numbers, and we could not read the original this time", "No figures used. Sourced numbers do help readers"],
              ["\"44% of citations come from the first 30% of a page\"", "Most articles give no link to the original and no method (which AI, how many answers)", "Not used. Answering first is still recommended, for readers' sake, without leaning on the figure"],
              ["\"The median cited article is 941 words\"", `Evertune's own analysis of about 33,000 URLs cited by ChatGPT ([Evertune](${SRC.evertune})); little on how they were chosen`, "For reference only. Write as long as it takes to answer the question, not to a word count"],
              ["\"Add FAQ structured data and you will be cited\"", "Articles disagreed about how Google currently treats FAQ rich results, and there is no official statement about an effect on AI", "Write FAQs visibly for readers; keep any markup identical to what is shown"],
              ["\"Add llms.txt and AI will read your posts\"", "Google says it is not needed; we found no official statement from AI companies that they use other sites' llms.txt in answers", "If you add one, treat it as a summary. It does not replace article content ([how to write llms.txt](/guide/llms-txt))"],
            ],
          },
        },
        {
          heading: "Before you write: pick one question per article",
          paragraphs: [
            "The questions people ask AI go beyond definitions such as \"what is X?\". They ask \"how do I choose?\", \"how much does it cost?\", \"where do I start?\" and \"what if it doesn't work?\". Packing several questions into one article blurs which question each part answers. Decide on one question per article and use it, as asked or lightly tidied, in the title and the first heading.",
            "Your own records are a better source of questions than outside tools. Write down a month of questions from your contact form, email and phone calls, long phrase-like queries in Search Console, and whatever your sales or front-desk staff explain every week. That gives you the list of articles worth writing.",
          ],
          table: {
            head: ["Question type", "Example", "Article type", "What goes at the top"],
            rows: [
              ["Definition", "\"What is a cash ISA?\" \"What is AEO?\"", "Explainer", "A one-sentence definition and who it matters to"],
              ["How-to", "\"How do I open a business bank account?\"", "Step-by-step guide", "How many steps, how long it takes, the first step"],
              ["Comparison or choice", "\"Which accounting software suits a small SaaS company?\"", "Article with a comparison table", "The criteria, and a pick for each situation"],
              ["Price", "\"How much does exterior painting cost?\"", "Cost breakdown", "A typical range, what changes it, whether tax is included"],
              ["Problem", "\"AI shows the wrong address for our company\"", "Fixes by cause", "The most common causes and what to check first"],
              ["Local or conditional", "\"Which dentist near me is open on Saturdays?\"", "Business pages rather than articles", "Not an article: fix your opening hours and location pages"],
            ],
          },
          after: [
            "As the last row shows, questions with a place or opening hours in them tend to be answered from facts about the business itself (the About page, location pages, the Google Business Profile) rather than from articles. Do not try to cover them with a blog post; get the business facts right first, for example with [local business structured data](/guide/local-business-schema-seo-plugins).",
          ],
        },
        {
          heading: "How to write: paragraphs that make sense when lifted out",
          paragraphs: [
            "AI builds its answer from the paragraphs and tables that match the question, not from the whole article. A good test is whether a paragraph still makes sense when read on its own.",
          ],
          list: [
            "Answer the question in the first two or three sentences. Do not open with scene-setting (\"In recent years, X has attracted attention\") or an introduction of yourself.",
            "Write headings in the words readers use, so the heading tells them what follows (\"Typical cost, and what changes it\").",
            "Do not lean on \"this\", \"the above\" or \"as mentioned\"; restate the subject inside each paragraph.",
            "Give every number a date and a source (\"as of October 2026\", \"from the X survey\"). For your own figures, say how you counted.",
            "Put comparisons in tables, and make them HTML tables. Tables saved as images are hard for both AI and search engines to read.",
            "When the answer depends on circumstances, split it by circumstance (\"if you are a sole trader\", \"if you are a company\").",
            "Include facts only you have: real counts, how many days something took, the steps you followed, the usual mistakes and how you fixed them.",
          ],
          after: [
            "Here is a rewrite (a column by a fictional accounting firm).",
            "Before: \"In recent years, interest in Making Tax Digital has grown. Our firm has received many enquiries. In this article, we would like to explain the topic in detail in light of the above background.\"",
            "After: \"If you are a sole trader whose income crosses the threshold, you will need software that keeps digital records and sends quarterly updates. Of the clients we helped switch in 2026, most chose the software their bookkeeper already used. These are the three things to decide first.\"",
            "The rewritten paragraph puts the answer (do I need to act?), the basis for the decision and a first-hand fact (what clients chose) in its first three sentences. Before you state thresholds or rules, check the current figures on the official source (in this case the tax authority) and link to it.",
          ],
        },
        {
          heading: "Patterns that make articles hard for AI to use, and the fixes",
          table: {
            head: ["Pattern", "Why it is hard to use", "Fix"],
            rows: [
              ["The conclusion is at the end", "The matching paragraph is found, but it does not contain the answer", "Move the conclusion to the top; reasons and steps follow"],
              ["Price or comparison tables only as images", "They cannot be read as text", "Use HTML tables; if you keep an image, put the key points in its alt text"],
              ["No date, or a stale year", "Nobody can tell when the information is from, so it may be treated as old", "Show the written and updated dates in the text; change the updated date only when you review the content"],
              ["Numbers without sources", "Readers cannot check them", "Link to the primary source; delete numbers you cannot check"],
              ["A rewording of other articles", "There is no reason to pick yours", "Add facts only you have: counts, cases, steps, photos"],
              ["Content hidden behind tabs or buttons and loaded by JavaScript", "Crawlers may not see the text", "Put key answers in the HTML from the start; use \"View page source\" to confirm the text is there"],
              ["Several articles answering the same question", "It is unclear which answer is right, and an old article may be used", "Merge them into one and redirect the old ones"],
              ["Mass-produced AI articles published unchecked", "Errors creep in and the content matches everyone else's", "Have a person check the facts and add your own information before publishing"],
            ],
          },
        },
        {
          heading: "Show the dates, the author and your sources",
          paragraphs: [
            `Google encourages accurate authorship information, such as bylines, wherever readers would expect it, and suggests telling readers how content was produced, including whether automation or AI was used ([Google: creating helpful content](${SRC.helpful})). Put these four things in the article itself.`,
          ],
          list: [
            "Written and updated dates, at the top or bottom. Do not change the updated date for a typo fix. When you review the content, change the date and add one line on what changed; that tells readers and AI how current it is.",
            "The author: name and role, linked to an author profile page ([how to build a profile page](/guide/person-profile-page-ai-search)). If someone reviewed the article, say what they reviewed and when, separately from the author.",
            "Sources: link numbers, rules and other companies' specifications to the primary source (government, the maker's official page, the original study). Avoid quoting a round-up that quotes someone else.",
            "How it was made: if AI drafted it, say so, and say that a person checked it.",
          ],
          after: [
            `Structured data (BlogPosting or Article) publishes the same values in a machine-readable form. Google asks that the content of your markup also be visible on the page ([Google Search Central blog](${SRC.googleBlog})). Do not put an author or a date in the markup that the text does not show.`,
          ],
        },
        {
          heading: "Steps in WordPress (with Nurevo AEO)",
          paragraphs: [
            "In WordPress, a theme or SEO plugin usually publishes the article's structured data. The free Nurevo AEO plugin leaves the WebSite, WebPage, Article and breadcrumbs from your SEO plugin (Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK and others) as they are and adds only what is missing, such as your business details. Without an SEO plugin, Nurevo AEO publishes a BlogPosting for each post with these values.",
          ],
          table: {
            head: ["BlogPosting property", "Where it comes from in WordPress", "What to watch"],
            rows: [
              ["headline, name", "The post title", "Make the title the question, or make the answer clear from it"],
              ["description", "The excerpt; if empty, the first 40 words of the post", "Write the opening answer in one or two sentences in the excerpt field"],
              ["datePublished, dateModified", "The published and last-modified times", "WordPress changes the modified time on every save; batch typo fixes"],
              ["author", "The author's display name (\"Display name publicly as\" in the user profile)", "Use the real name you show on articles, not the login name"],
              ["image", "The featured image", "Set an image that shows what the article is about"],
              ["publisher", "The business details you entered in Nurevo AEO", "Enter the business name, address and so on accurately in the settings"],
            ],
          },
          after: [
            "The steps:",
            `1. Install Nurevo AEO from [WordPress.org](${WP_ORG}) and enter your business details in the setup wizard. 2. Write the article and put the opening answer in the excerpt field. 3. Check the author's display name and the featured image. 4. If readers often ask follow-up questions about the article, enter them under "Questions and answers for this page" in the Nurevo AEO panel on the right of the editor, and place the Nurevo FAQ block in the post, set to "This page's own questions". The questions are shown in the post and published as FAQPage on that post only. 5. When an article goes out of date, tick "Leave this page out of llms.txt" in the same panel, or merge it into a newer article.`,
            "Nurevo AEO's llms.txt lists the 30 most recently modified published pages and posts. On a site that publishes a lot, older posts drop out automatically; to keep a particular article listed, developers can add lines with the webmcp_canary_llms_txt_lines filter.",
          ],
        },
        {
          heading: "What to check after publishing",
          paragraphs: [
            "No single tool tells you whether an article was cited. Combine these four and record them about once a month.",
          ],
          table: {
            head: ["What to look at", "What it tells you", "What it does not"],
            rows: [
              ["Search Console's generative AI performance report (Search)", `Impressions in Google AI Overviews and AI Mode, by page. Available to all sites since 31 August 2026 ([Help](${SRC.gscReportEn}))`, "Clicks; appearances in ChatGPT or Perplexity"],
              ["Referrers in your analytics", `Visits from AI answers. OpenAI says it adds utm_source=chatgpt.com to links in ChatGPT search results ([OpenAI](${SRC.openaiFaq}))`, "Citations nobody clicked"],
              ["Server access logs", "Whether OAI-SearchBot, PerplexityBot and others fetch the article", "Whether what they read was used in an answer"],
              ["Asking and recording", "Ask AI the question the article answers; record the date, whether the article was a source and whether your name appeared", "One run is mostly chance; ask on several days"],
            ],
          },
          after: [
            `Nurevo AEO's free AI check asks Perplexity three questions a month, built from your business type and area, and records whether your business was named or your site cited (it does not measure individual articles). Pro measurement (beta) currently covers Perplexity. See [how to measure AI visibility](/guide/measure-ai-visibility) for the method.`,
            `For honesty: when Nurevo studied 62 businesses, we found no clear relationship between the on-site readiness score and appearing in Perplexity's answers ([the study](/guide/aeo-signals-ai-answers-study)). Well-structured writing is the starting point; whether you appear also depends on the question and on what other sites say. The surest way to judge an article is whether it is used correctly for the question it answers, not how many times it is cited.`,
          ],
        },
        {
          heading: "Checklist before you publish",
          list: [
            "The article answers one question, and that question is in the title and the first heading.",
            "The first two or three sentences answer it.",
            "Each paragraph names its subject and makes sense on its own.",
            "Comparisons, prices and steps are HTML tables or numbered lists, not only images.",
            "Numbers carry a date and a link to their source; numbers you could not check are gone.",
            "Facts only you have (counts, cases, steps, mistakes) are included.",
            "Written date, updated date and author name are visible, and the name links to an author page.",
            "Key answers are not hidden behind tabs or buttons (the text is in the page source).",
            "robots.txt does not block OAI-SearchBot or PerplexityBot; there is no noindex or small max-snippet.",
            "The author, dates and image in the structured data match the text.",
            "No older article answers the same question (if one did, it was merged and redirected).",
          ],
        },
      ],
      faqs: [
        { q: "How long should an article be?", a: "There is no fixed length. Write as much as it takes to answer the question fully. Vendors sometimes publish the median length of cited articles, but there is no evidence that adding words helps in itself." },
        { q: "Should every heading be a question?", a: "Not necessarily. What matters is that headings use readers' words and say what follows. \"Typical cost, and what changes it\" works just as well." },
        { q: "Are AI-written articles never cited?", a: "No official statement says AI use alone rules an article out. But AI drafts tend to contain errors and to say what everyone else says, so have a person check the facts and add your own information before publishing. Google suggests telling readers how content was produced." },
        { q: "Should I delete old articles?", a: "If a newer article answers the same question, move the useful content into it and redirect the old one. If an old article is worth keeping as a record, say at the top which year it describes and link to the newer article." },
        { q: "Does adding an FAQ at the end make citations more likely?", a: "If the questions are ones readers really ask, it helps readers. There is no official statement that it increases citations. Keep the FAQ visible on the page and, if you publish markup, keep it identical to what is shown." },
        { q: "If I refresh the updated date, will AI treat the article as new?", a: "Changing only the date is not recommended. Change it when you review the content and add a line on what changed. A fresh date on stale content costs readers' trust." },
        { q: "If I follow these steps, will AI always cite my article?", a: "That cannot be guaranteed. AI answers vary by day and wording and depend on other sites too. These steps make your article readable and usable by AI." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Check whether AI can read the articles on your site",
        body: "The free check needs no sign-up: enter your URL to see the state of structured data, llms.txt and AI crawler access. On WordPress, the free plugin publishes your posts' authors and dates and your business details as structured data.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "Try the free WordPress plugin", href: WP_ORG },
      },
      footnote: "ChatGPT and OpenAI are trademarks of OpenAI, Perplexity of Perplexity AI, and Google and Search Console of Google LLC. Yoast SEO, Rank Math, All in One SEO, SEO SIMPLE PACK, Evertune, WordPress and their product names are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
