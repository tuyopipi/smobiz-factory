// Content page: for web agencies / SEO firms / WordPress care companies - how
// to sell the review of a client's existing blog posts and articles for AI
// search (inventory, keep / update / rewrite / merge / retire, dates, llms.txt,
// before-and-after measurement, contract wording and pricing logic) as a
// monthly service.
//
// Written 2026-11-18 (JST). Product facts come from the plugin itself
// (experiments/webmcp-canary/wordpress-plugin/webmcp-canary):
// - nurevo-webmcp.php (~6640-6655): on single posts without an SEO plugin
//   article node, Nurevo publishes BlogPosting with datePublished =
//   get_the_date and dateModified = get_the_modified_date (WordPress's
//   modified date, which WordPress changes whenever the post is updated).
// - readme 0.9.1: WebSite, WebPage, Article and breadcrumbs stay as the SEO
//   plugin publishes them.
// - llms.txt (~3240): the 30 most recently modified published posts/pages
//   (orderby modified DESC), minus posts excluded in the per-page panel;
//   cached and refreshed when posts or settings change (readme changelog).
// - Catalogue sync sends the titles and URLs of the 30 most recently updated
//   published posts and pages (readme).
// - Diagnosis "consistency" hint: make schema agree with page text, show a
//   visible updated date or dateModified.
// - Per-page panel: leave out of llms.txt, no Nurevo structured data, the
//   page's own FAQ.
// - Free AI check (three questions a month on Perplexity, built from business
//   type and area, never the business name); Pro measurement beta on
//   Perplexity. Partner page: branded monthly reports, multi-site dashboard,
//   referral commission 40% net of Stripe fees, approval-based; the client
//   holds its own plan.
// Outside facts:
// - Google "Influence your byline dates in Google Search" (last updated
//   2026-02-20, read 2026-11-18): Google estimates the date a page was
//   published or had major changes from several factors; show a visible date
//   labelled e.g. "Published" / "Last updated"; datePublished / dateModified on
//   Article / BlogPosting; visible and structured dates should agree; no
//   future dates; no guarantee a date is shown.
// - Google "AI features and your website": no extra requirements or special
//   optimization (read 2026-11-10 for search-console-ai-features).
// - Search Console generative AI performance report (Search): impressions by
//   page, all sites from 2026-08-31, no clicks (read 2026-11-10).
// - OpenAI publishers FAQ: utm_source=chatgpt.com (read 2026-10-31).
// - Google "Creating helpful, reliable, people-first content" (read
//   2026-11-16): explain how content was made, including automation / AI.
// Not stated on purpose (Google's pages could not be read in this run): the
// wording of the spam policies (scaled content abuse), Google's redirect and
// 404/410 guidance, canonical strength. The page says to check the originals.
// Top-ranking articles read 2026-11-18: jinrai (GEOリライト, 2026-11-10),
// GMO AIかんたん集客 x2 (2026-11-16), StockSun, AI革命 (sales page); AirOps
// (2026-10-13), Winston Digital (2026-06-14), Frase (2026-04-30), Quattr
// (2026-05-15), Digital Applied (2026-10-04), The Rank Masters.
// Agencies join as referral partners only (see scripts/check-static.mjs).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const PARTNER = "https://nurevo.jp/partner/";
const SRC = {
  datesEn: "https://developers.google.com/search/docs/appearance/publication-dates",
  datesJa: "https://developers.google.com/search/docs/appearance/publication-dates?hl=ja",
  googleAi: "https://developers.google.com/search/docs/appearance/ai-features",
  googleAiJa: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja",
  helpful: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
  helpfulJa: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=ja",
  spam: "https://developers.google.com/search/docs/essentials/spam-policies",
  spamJa: "https://developers.google.com/search/docs/essentials/spam-policies?hl=ja",
  gscReportJa: "https://support.google.com/webmasters/answer/16984139?hl=ja",
  gscReportEn: "https://support.google.com/webmasters/answer/16984139?hl=en",
  openaiFaq: "https://help.openai.com/en/articles/12627856-publishers-and-developers-faq",
  airops: "https://www.airops.com/blog/content-refresh-strategy-guide",
  rankmasters: "https://www.therankmasters.com/content-refresh",
};

export default {
  slug: "agency-content-refresh-service",
  targetQueries: [
    "制作会社 リライト 月額 AI検索",
    "既存記事 リライト AI検索対策 棚卸し",
    "記事 統合 削除 基準 AI検索",
    "content refresh service for AI search agency",
    "content refresh retainer AI citations",
    "merge or delete old blog posts AI search",
  ],
  related: ["blog-articles-ai-citations", "agency-aeo-monthly-service", "search-console-ai-features", "measure-ai-visibility", "agency-aeo-client-handover"],
  locales: {
    ja: {
      title: "既存記事の見直しを月額サービスにする方法：制作会社向け | Nurevo",
      description: "制作会社がお客様の既存記事をAI検索向けに見直す月額サービスの作り方。棚卸しの表、残す・更新・書き直し・統合・外すの判定、更新日の扱い、前後の測り方、契約と価格の決め方。",
      h1: "既存記事のAI検索向けの見直しを、制作会社の月額サービスにする方法",
      lead: "既存記事の見直しを月額にするなら、最初に全記事の棚卸しを1回のスポット作業として行い、月額の中身は「決めた本数の記事を、残す・更新・書き直し・統合・外すのどれかに判定して作業し、前後を同じ条件で比べて報告すること」にします。AIに引用されるかは約束できないため、契約では本数・作業の種類・報告を約束し、統合や削除は必ずお客様の承認を取ってから行います。",
      intro: [
        "作成日：2026年11月18日（JST）。対象は、お客様のWordPressサイトを保守している制作会社・SEO会社・WordPress保守会社です。1本の記事をどう書くかは[AIに引用される記事の書き方](/guide/blog-articles-ai-citations)、AI検索対策の月額サービス全体の設計は[月額サービスにする方法](/guide/agency-aeo-monthly-service)にまとめています。この記事は、その間にある「お客様のサイトにすでにある記事の山をどう扱い、どう売るか」に絞っています。",
        "AIの回答は同じ質問でも日や回によって変わります。ここで書く作業は、AIが読む記事の事実を正しく新しく保つためのもので、引用や表示を保証するものではありません。",
      ],
      sections: [
        {
          heading: "よく読まれている記事に書かれていないこと",
          paragraphs: [
            "「リライト AI検索」「content refresh AI search」で上位に出る日本語6本・英語7本を2026年11月18日に読みました。冒頭に答えを書く、見出しを質問の形にする、表や箇条書きにする、といった1本の書き直し方はどの記事も詳しく扱っています。一方で、制作会社が月額で回すときに必要な次の点は、ほとんど書かれていませんでした。",
          ],
          table: {
            head: ["抜けていた点", "上位記事の状況"],
            rows: [
              ["統合・削除・転送の判定基準", "日本語ではサービス紹介ページ1本が「自社記事同士が同じ検索語で競合したら統合して転送」と書くだけ。英語ではAirOpsとThe Rank Mastersが判定の種類を挙げている"],
              ["更新日の扱い", "日本語の記事では見当たらず。英語のWinston Digital・Digital Appliedが「中身を変えたときだけ更新日を変える」と書いている"],
              ["WordPressで保存のたびに更新日が変わること", "どの記事にもない"],
              ["前と後の比べ方", "日本語はSearch Consoleのクリック率の比較か、手で聞いた結果の記録が中心。英語ではAirOpsが30・60・90日で比べる手順を書いている"],
              ["契約で成果を保証しない書き方、価格の決め方", "成果を約束しない旨の記載はThe Rank Mastersだけ。価格は自社サービスの宣伝か、出典のない相場"],
              ["数字の出典", "「FAQの構造化データの引用シェア」など、出典が書かれていない数字が多い。英語の数字の多くは書き手の会社自身の調査"],
            ],
            caption: "記事ごとの良し悪しではなく、月額サービスとして回すときに必要な情報が抜けやすいという傾向を挙げています。",
          },
        },
        {
          heading: "サービスの形：初回の棚卸しと、毎月の見直し",
          table: {
            head: ["区分", "作業", "頻度", "お客様に渡すもの"],
            rows: [
              ["棚卸し（スポット）", "公開中の全記事を一覧にし、判定と優先順位をつける", "契約時に1回", "棚卸しの表、最初の3か月の作業予定"],
              ["毎月の見直し", "決めた本数の記事を判定どおりに作業する（更新・書き直し・統合・外す）", "毎月", "作業した記事の一覧と、変えた内容"],
              ["前後の比較と報告", "作業した記事について、作業前と同じ条件で測り直す", "毎月（作業から日を置いて）", "月次レポート"],
            ],
            caption: "棚卸しを月額に含める場合は、最低契約期間を決めておくと費用を回収しやすくなります。",
          },
          after: [
            "Googleは、AIによる概要やAIモードに表示されるために特別な最適化は要らず、通常のSEOのベストプラクティスが当てはまると説明しています（[Google 検索セントラル：AI機能とウェブサイト](" + SRC.googleAiJa + ")）。既存記事の見直しは、SEOの保守とほとんど同じ作業です。違いは、AIが記事の一部を抜き出して使うことを前提に、事実の新しさと、抜き出しても意味が通る書き方を重く見る点です。",
          ],
        },
        {
          heading: "棚卸しの表に入れる列",
          paragraphs: [
            "棚卸しは、WordPressの投稿一覧とSearch Consoleの数字を1つの表にまとめる作業です。列は次の10個で足ります。",
          ],
          table: {
            head: ["列", "入れるもの", "使い道"],
            rows: [
              ["URL・タイトル", "公開中の記事", "一覧の土台"],
              ["公開日・最終更新日", "WordPressの日付", "古い記事の洗い出し"],
              ["答えている質問", "その記事が答える質問を1文で", "同じ質問に答える記事の重なりを見つける"],
              ["時点のある事実", "料金・制度・営業時間・数字など、変わる事実とその時点", "更新が必要な記事を見つける"],
              ["検索の表示回数・クリック数", "Search Consoleの検索パフォーマンス（ページ別、過去3か月など）", "読まれている記事を壊さない"],
              ["AI機能での表示回数", "Search Consoleの生成AIパフォーマンスレポート（ページ別）", "AIによる概要・AIモードで使われている記事を知る"],
              ["サイト内からのリンク", "その記事を指している記事・固定ページ", "統合・削除のときの付け替え先"],
              ["外部からのリンク", "わかる範囲で", "統合・削除のときに転送が必要か"],
              ["お客様の確認が要る点", "監修が必要な内容、法令・価格など", "作業前の確認の段取り"],
              ["判定", "残す・更新・書き直し・統合・外す", "毎月の作業の順番"],
            ],
          },
          after: [
            "生成AIパフォーマンスレポートは2026年8月31日から全世界のサイトで使え、ページごとの表示回数を見られます。クリック数は出ないため、通常の検索パフォーマンスと並べて読みます（[Search Console ヘルプ](" + SRC.gscReportJa + ")、詳しくは[Search ConsoleでAIの表示を見る方法](/guide/search-console-ai-features)）。",
          ],
        },
        {
          heading: "判定の5つ：残す・更新・書き直し・統合・外す",
          table: {
            head: ["判定", "当てはまる記事", "やること"],
            rows: [
              ["残す", "事実が新しく、答えている質問がはっきりしていて、読まれている", "触らない。触らないことも作業の記録に書く"],
              ["更新", "答えは合っているが、料金・制度・数字・画面の説明が古い", "古い事実だけを直し、直した内容と時点を本文に書く"],
              ["書き直し", "質問への答えが冒頭にない、どの質問に答えているかわからない", "答える質問を1つに決め直し、冒頭2〜3文で答える形に組み直す。URLは変えない"],
              ["統合", "同じ質問に答える記事が2本以上ある", "いちばん読まれている（または内容の良い）1本に中身をまとめ、他の記事は恒久的な転送（301）でまとめた記事へ寄せる。サイト内リンクも付け替える"],
              ["外す", "事業として扱わなくなった内容、終わったキャンペーン、誤りを直せない記事", "お客様の承認を取ってから、近い内容の記事へ転送するか、公開をやめる"],
            ],
            caption: "統合と外すは、お客様のサイトからページが減る作業です。判定の段階で一覧を見せ、承認を記録してから作業します。",
          },
          after: [
            "迷ったときの順番は、「読まれている記事を壊さない」が先、「AIに使われやすくする」が後です。Search Consoleで表示やクリックが多い記事は、書き直しより更新から始めると、失敗したときに戻しやすくなります。WordPressのリビジョン（変更履歴）が残っているかも、作業前に確かめておきます。",
            "転送の種類、削除したページの扱い（404・410）、正規URLの指定についてのGoogleの細かい説明は、この記事を書いた日に原文を読めなかったため、ここでは書いていません。作業の前にGoogle 検索セントラルの該当ページで確かめてください。",
          ],
        },
        {
          heading: "更新日の扱い：中身を変えたときだけ変わるようにする",
          paragraphs: [
            "Googleは、ページが公開された日、または大きく変更された日をいくつかの手がかりから推定し、検索結果に日付として出すことがあると説明しています。勧めているのは、「公開日」「最終更新日」のようにラベルをつけて日付をページに見える形で書き、ArticleやBlogPostingの構造化データの datePublished・dateModified と一致させることです。未来の日付は書かないこと、日付の表示は保証されないことも書かれています（[Google 検索セントラル：検索結果の日付](" + SRC.datesJa + ")）。",
            "ここで制作会社が気をつけたいのが、WordPressの更新日時です。WordPressは投稿を更新して保存するたびに更新日時を新しくします。テーマが「最終更新日」をこの日時から表示している場合、誤字を1文字直しただけで、記事は「今日更新された」ように見えます。Nurevo AEOが記事に出すBlogPostingの dateModified も、このWordPressの更新日時です（SEOプラグインが記事の構造化データを出している場合は、そちらがそのまま使われます）。",
          ],
          table: {
            head: ["作業", "更新日", "本文に書くこと"],
            rows: [
              ["誤字・表記ゆれの修正", "なるべく変えない（毎月の更新作業とまとめて保存する）", "書かなくてよい"],
              ["事実の更新（料金・制度・数字）", "変わる", "「2026年11月：料金を改定後の金額に更新」のように、何を直したか"],
              ["書き直し", "変わる", "直した点と、答えている質問"],
              ["統合", "まとめた先の記事の更新日が変わる", "どの記事の内容をまとめたか"],
              ["中身を変えない保存", "変えない", "—"],
            ],
          },
          after: [
            "日付だけを新しくする作業は、サービスに入れません。Googleの「有用で信頼性の高い、ユーザー第一のコンテンツの作成」は、コンテンツがどのように作られたかを説明することを勧めています（[Google 検索セントラル](" + SRC.helpfulJa + ")）。見直しの内容を本文の短い一文で残すことは、その説明にもなります。",
          ],
        },
        {
          heading: "llms.txt に載る記事は、更新の順番で変わる",
          paragraphs: [
            "Nurevo AEOが作る /llms.txt には、公開中の投稿と固定ページのうち、更新日時が新しい順に30件が載ります（ページごとの設定で「llms.txtに載せない」にしたものは除きます）。llms.txtは記事や設定が変わると作り直されます。",
            "つまり、見直しで古い記事を保存すると、その記事がllms.txtの一覧に入り、代わりに別の記事が押し出されることがあります。終わったキャンペーンの記事を誤字修正のために保存しただけで、llms.txtに戻ってくることもあります。見直しの月には、作業の後に /llms.txt を開き、載せたくない記事が入っていないかを確かめ、外したい記事はページごとの設定で外します。",
            "なお、Nurevoのサービスに接続しているサイトでは、計測のために、更新日時が新しい順に30件の投稿・固定ページのタイトルとURLが送られます。どの記事がAIに読まれる一覧に入っているかは、記事の更新の順番と結びついている、と考えておくと作業の順番を決めやすくなります。[llms.txtの書き方](/guide/llms-txt)",
          ],
        },
        {
          heading: "毎月の作業の流れ",
          list: [
            "月初：棚卸しの表から、その月に作業する記事を決める（例：更新3本と統合1件）。統合・外すがある月は、対象の一覧をお客様に送って承認をもらう。",
            "作業前：作業する記事について、決めた質問をAIに聞いた結果と、Search Consoleの数字を記録する（次の節）。",
            "作業：判定どおりに作業する。事実の確認が必要な箇所（料金・制度・監修が必要な内容）はお客様に確認してから直す。",
            "作業後：構造化データの日付と本文の日付が合っているか、/llms.txt の一覧、転送が効いているか、サイト内リンクが切れていないかを確かめる。",
            "翌月以降：作業から日を置いて、同じ条件で測り直し、レポートに載せる。",
          ],
        },
        {
          heading: "前と後の比べ方",
          paragraphs: [
            "見直しの効果は、1回の結果では判断できません。作業前と作業後で、同じものを同じ条件で測り、比べます。",
          ],
          table: {
            head: ["測るもの", "作業前", "作業後", "注意"],
            rows: [
              ["検索の表示回数・クリック数（ページ別）", "作業前の4週間など、決めた期間", "作業後の同じ長さの期間", "季節の影響がある業種では前年の同じ時期とも比べる"],
              ["AI機能での表示回数（ページ別）", "同上", "同上", "生成AIパフォーマンスレポートの数字。クリックは出ない"],
              ["AIでの言及・引用", "決めた質問を、決めたAIに、決めた回数だけ聞いた結果", "同じ質問・同じAI・同じ回数", "回答は変わるため、何回聞いた結果かを必ず書く"],
              ["AIからの訪問", "アクセス解析の参照元", "同上", "ChatGPTの検索結果からのリンクには utm_source=chatgpt.com が付く（OpenAIのFAQ）"],
            ],
          },
          after: [
            "ChatGPTの参照元の扱いは[OpenAIのパブリッシャー向けFAQ](" + SRC.openaiFaq + ")、測り方の全体は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。AirOpsのガイドは30日・60日・90日の区切りで比べる手順を挙げています（[AirOps](" + SRC.airops + ")）。区切りの日数は業種と記事の数で決めてよく、大事なのは毎回同じ区切りを使うことです。",
            "Nurevo AEOの無料のAIチェックは、接続したサイトについて、業種と地域から作った3つの質問（店名や社名は入れません）を月に1回Perplexityに聞き、名前が出たか・サイトが引用されたかを記録します。Proの計測（ベータ版）も現在はPerplexityが対象です。どちらも、見直しの前後の記録の1つとして使えます。",
          ],
        },
        {
          heading: "契約と価格の決め方",
          paragraphs: [
            "契約では成果ではなく作業を約束します。The Rank Mastersのサービスページも、作業と報告は約束するが、取り戻すアクセスは保証しないと明記しています（[The Rank Masters](" + SRC.rankmasters + ")）。契約書や提案書には、次のような文を入れておくと、後の食い違いを防げます。",
          ],
          list: [
            "「毎月◯本の既存記事について、判定（残す・更新・書き直し・統合・外す）に沿った作業と、作業前後の記録を報告します。AIの回答への表示・引用、検索順位、アクセス数の増加は保証しません。」",
            "「記事の統合・転送・公開の停止は、対象の一覧をお送りし、ご承認をいただいてから行います。」",
            "「料金・制度・医療や法律に関わる内容など、事実の確認が必要な箇所は、貴社のご確認をいただいてから公開します。」",
            "「作業に生成AIを使う場合は、その範囲をお知らせし、公開前に担当者が事実と表現を確認します。」",
          ],
          after: [
            "価格は、相場から逆算するより、1本あたりの作業時間を判定ごとに決めて積み上げるほうが説明しやすく、赤字になりにくい方法です。たとえば「更新は1本あたり◯時間、書き直しは◯時間、統合は1件◯時間」と決め、月の本数を掛け、報告の時間を足します。最初の3か月は実際の時間を記録して、見積もりと合っているかを確かめます。制作会社向けの相場は、信頼できる一次情報が見つからなかったため書いていません。",
            "記事を大量に書き換えて数を増やすことは、サービスの目的にしません。サービスを始める前に、Googleの[スパムに関するポリシー](" + SRC.spamJa + ")も原文で読んでおきます。本数を約束する契約でも、1本ごとに直す理由が棚卸しの表にある状態を保ちます。",
          ],
        },
        {
          heading: "WordPressでの手順（Nurevo AEOを使う場合）",
          list: [
            `お客様のサイトに[Nurevo AEO](${WP_ORG})（無料）を入れ、構造化データ・llms.txt・AIクローラの許可の状態を診断する。Yoast SEO・Rank Math・All in One SEO・Slim SEO・SEO SIMPLE PACK・VK All in One Expansion Unitと併用でき、記事の構造化データはそれらが出しているものがそのまま使われる。`,
            "テーマが本文に「最終更新日」を出しているかを確かめる。出していない場合は、日付の表示をテーマの設定で入れるか、本文の冒頭か末尾に更新の一文を書く。診断でも、表示の更新日か dateModified を出すことが勧められる。",
            "見直した記事は、ブロックエディタの「Nurevo AEO」パネルで、その記事専用の質問と答えを入れられる（Nurevo FAQブロックを「このページの質問」にして置くと、その記事だけにFAQPageとして出る）。答えは本文に書いてある内容と同じにする。",
            "外した記事や終わった告知は、同じパネルで「llms.txtに載せない」にする。作業後に /llms.txt を開いて一覧を確かめる。",
            "統合した記事は、転送を設定したうえで、元の記事を指していたサイト内リンクを、まとめた記事のURLに付け替える。",
            "月次レポートに、作業した記事・判定・変えた内容・作業前後の記録を載せる。",
          ],
        },
        {
          heading: "制作会社がNurevoを使う場合",
          paragraphs: [
            `制作会社・SEO会社向けには、社名・ロゴ・ブランドカラーで送れる月次レポート（PDFにも印刷可）、複数のお客様のサイトを1つの画面で見られるダッシュボードがあります。紹介したお客様の月額の40%（Stripe手数料控除後）をお支払いする紹介報酬もあります（承認制）。有料プランはお客様ご自身が同意のうえで契約し、制作会社は見直しの作業と報告に対して料金をいただく形です。詳しくは[パートナープログラム](${PARTNER})をご覧ください。`,
            "正直に書くと、記事ごとの書き直し案を自動で出す機能や、多くのAIを横断して追う計測は、Nurevoにはありません。そうした作業は、記事制作の専用ツールや計測を専門にするツールのほうが向いています。Nurevoは、構造化データ・llms.txt・AIクローラの設定を正しく保つ土台と、月次の報告に使う、という分け方が現実的です。",
          ],
        },
        {
          heading: "月額の見直しのチェックリスト",
          list: [
            "全記事の棚卸しの表に、答えている質問と、時点のある事実を書いた。",
            "判定（残す・更新・書き直し・統合・外す）と、その理由を表に書いた。",
            "統合・外すの一覧について、お客様の承認を記録した。",
            "作業前の記録（Search Console・生成AIレポート・決めた質問の結果）を取った。",
            "誤字だけの修正で更新日を動かしていない。",
            "事実を直した記事には、何を・いつ直したかを本文に書いた。",
            "本文の日付と構造化データの日付が一致している。",
            "統合した記事の転送とサイト内リンクの付け替えを確かめた。",
            "/llms.txt に載せたくない記事が入っていない。",
            "作業後、作業前と同じ条件で測り直してレポートに載せた。",
            "契約書・提案書に、成果を保証しないことと、承認の手順を書いた。",
          ],
        },
      ],
      faqs: [
        { q: "既存記事を見直せば、AIに引用されるようになりますか？", a: "保証はできません。AIの回答は同じ質問でも日や回によって変わります。見直しで約束できるのは、記事の事実を新しくし、答えを読み取りやすくする作業と、その前後の記録です。結果は、作業前と同じ条件で測った記録として報告します。" },
        { q: "新しい記事を書くのと、既存記事を見直すのはどちらが先ですか？", a: "お客様のサイトにすでに記事が多く、料金や制度などの古い事実が残っているなら、見直しから始めるのがおすすめです。古い事実は、AIがその事業について間違った答えをする原因になります。同じ質問に答える記事がない場合は、新しい記事が必要です。" },
        { q: "更新日を新しくするだけでも効果はありますか？", a: "中身を変えずに日付だけを新しくする作業は、サービスに入れないことをおすすめします。Googleは、公開日または大きな変更があった日を推定して日付を出すと説明しており、本文の日付と構造化データの日付を一致させることを勧めています。" },
        { q: "誤字を直しただけで最終更新日が変わってしまいます。", a: "WordPressは保存のたびに更新日時を新しくします。誤字や表記の修正は、事実の更新と同じ月にまとめて保存すると、更新日が意味のない日付で動くのを減らせます。表示する日付をどこから取っているかは、テーマの設定で確かめてください。" },
        { q: "記事を統合すると、検索からのアクセスは減りませんか？", a: "減る可能性はあります。読まれている記事を残す側にし、他の記事は転送でまとめた記事へ寄せ、サイト内リンクを付け替えます。統合の前後で表示回数とクリック数をページ別に記録し、必ずお客様の承認を取ってから行ってください。" },
        { q: "毎月何本くらい見直せばよいですか？", a: "決まった数はありません。記事の総数、古い事実の多さ、お客様の確認にかかる時間で決めます。最初の棚卸しで優先順位をつけ、無理なく続けられる本数から始め、3か月ほど作業時間を記録して見直すのが現実的です。" },
        { q: "生成AIで書き直してもよいですか？", a: "下書きに使うことはできますが、公開前に担当者が事実と表現を確かめてください。Googleは、コンテンツがどのように作られたか、自動化やAIを使った場合はその使い方を説明することを勧めています。お客様にも、使う範囲を契約の段階で伝えておきます。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "見直しの前に、お客様のサイトをAIがどう読んでいるか確認",
        body: "無料チェックは登録不要で、URLを入れるだけで構造化データ・llms.txt・AIクローラの許可の状態がわかります。棚卸しの最初の資料に使えます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "パートナープログラムを見る", href: PARTNER },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、Google・Search ConsoleはGoogle LLCの商標です。Yoast SEO、Rank Math、All in One SEO、Slim SEO、SEO SIMPLE PACK、VK All in One Expansion Unit、WordPress、AirOps、The Rank Mastersはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・承認の関係にありません。",
    },
    en: {
      title: "Selling Content Refresh for AI Search as a Monthly Service | Nurevo",
      description: "How agencies sell reviews of existing client posts for AI search as a monthly service: inventory, keep/update/merge/retire, dates, before-and-after checks, pricing.",
      h1: "Turning a review of existing articles for AI search into a monthly agency service",
      lead: "To sell the review of a client's existing articles as a monthly service, run a full inventory once as a one-off project, then make the monthly work this: take an agreed number of posts, decide whether each one is kept, updated, rewritten, merged or retired, do that work, and report a before-and-after comparison measured the same way both times. Nobody can promise that AI will cite a page, so the contract promises the number of posts, the kinds of work and the report, and merging or retiring a page always waits for the client's approval.",
      intro: [
        "Written 18 November 2026 (JST). This guide is for web agencies, SEO firms and WordPress care companies that look after client sites. How to write a single article is covered in [How to write blog posts that AI search cites](/guide/blog-articles-ai-citations), and the shape of an AI search retainer as a whole in [Offering AEO as a monthly service](/guide/agency-aeo-monthly-service). This page covers the part in between: what to do with the pile of posts a client already has, and how to sell that work.",
        "AI answers change from day to day and from one ask to the next. The work described here keeps the facts in the articles AI reads correct and current; it does not guarantee that the site is cited or shown.",
      ],
      sections: [
        {
          heading: "What the top-ranking guides leave out",
          paragraphs: [
            "On 18 November 2026 we read the six Japanese and seven English pages that rank for searches like \"content refresh AI search\". All of them explain how to rewrite one article well: answer first, phrase headings as questions, use tables and lists. Few of them cover what an agency needs to run this every month.",
          ],
          table: {
            head: ["Missing piece", "What we found"],
            rows: [
              ["Criteria for merging, removing and redirecting", "Among the Japanese pages, only one service page says to merge two of your own posts that compete for the same query and redirect one. In English, AirOps and The Rank Masters list the kinds of decision"],
              ["How to handle dates", "Not in the Japanese pages. Winston Digital and Digital Applied say to change the updated date only when the content changes"],
              ["WordPress changing the modified date on every save", "Not in any of them"],
              ["How to compare before and after", "The Japanese pages mostly compare click-through rate in Search Console or log manual checks. AirOps describes comparing at 30, 60 and 90 days"],
              ["Contract wording that avoids guarantees, and pricing logic", "Only The Rank Masters states that it does not guarantee results. Prices are either the author's own offer or unsourced ranges"],
              ["Sources for numbers", "Many figures, such as a \"citation share of FAQ structured data\", come with no source. Most English figures are the author company's own research"],
            ],
            caption: "This is a pattern, not a verdict on any single page: what an agency needs to run the work monthly tends to be missing.",
          },
        },
        {
          heading: "Shape of the service: one inventory, then a monthly review",
          table: {
            head: ["Part", "Work", "How often", "What the client receives"],
            rows: [
              ["Inventory (one-off)", "List every published post, decide what happens to each and set priorities", "Once, at the start", "The inventory sheet and a plan for the first three months"],
              ["Monthly review", "Work through the agreed number of posts as decided (update, rewrite, merge, retire)", "Monthly", "The list of posts worked on and what changed"],
              ["Before-and-after report", "Measure the posts worked on again, the same way as before", "Monthly, after a gap", "The monthly report"],
            ],
            caption: "If the inventory is folded into the monthly fee, set a minimum term so the work is paid for.",
          },
          after: [
            "Google says there are no extra requirements or special optimization for appearing in AI Overviews or AI Mode, and that normal SEO best practices apply ([Google Search Central: AI features and your website](" + SRC.googleAi + ")). Reviewing existing articles is mostly ordinary SEO maintenance. The difference is the weight given to how current the facts are, and to passages that still make sense when AI lifts them out of the page.",
          ],
        },
        {
          heading: "Columns for the inventory sheet",
          paragraphs: [
            "The inventory brings the WordPress post list and the Search Console numbers into one sheet. Ten columns are enough.",
          ],
          table: {
            head: ["Column", "What goes in", "What it is for"],
            rows: [
              ["URL and title", "Each published post", "The base of the list"],
              ["Published and last updated", "The dates in WordPress", "Finding old posts"],
              ["Question answered", "The question the post answers, in one sentence", "Finding posts that answer the same question"],
              ["Facts with a date", "Prices, rules, opening hours, figures: facts that change, and as of when", "Finding posts that need an update"],
              ["Search impressions and clicks", "Search Console Performance, by page, for example the last three months", "Not breaking posts people read"],
              ["Impressions in AI features", "Search Console's generative AI performance report, by page", "Knowing which posts AI Overviews and AI Mode use"],
              ["Internal links", "Posts and pages linking to it", "What to repoint when merging or removing"],
              ["External links", "As far as you can tell", "Whether a redirect is needed"],
              ["Client sign-off needed", "Content that needs an expert's review, legal or price details", "Arranging checks before the work"],
              ["Decision", "Keep, update, rewrite, merge or retire", "The order of the monthly work"],
            ],
          },
          after: [
            "The generative AI performance report has been available to sites worldwide since 31 August 2026 and shows impressions by page. It does not show clicks, so read it next to the normal Performance report ([Search Console Help](" + SRC.gscReportEn + "); more in [Seeing AI features in Search Console](/guide/search-console-ai-features)).",
          ],
        },
        {
          heading: "Five decisions: keep, update, rewrite, merge, retire",
          table: {
            head: ["Decision", "Posts it fits", "What to do"],
            rows: [
              ["Keep", "Facts are current, the question is clear and people read it", "Leave it alone, and record that you did"],
              ["Update", "The answer is right but prices, rules, figures or screenshots are out of date", "Fix only the stale facts and say in the text what changed and as of when"],
              ["Rewrite", "The answer is not at the top, or it is unclear which question the post answers", "Settle on one question and restructure so the first two or three sentences answer it. Keep the URL"],
              ["Merge", "Two or more posts answer the same question", "Move the content into the post that is read most (or is best), redirect the others to it with a permanent (301) redirect, and repoint internal links"],
              ["Retire", "Topics the business no longer offers, finished campaigns, errors that cannot be fixed", "With the client's approval, redirect to the closest post or unpublish"],
            ],
            caption: "Merging and retiring remove pages from the client's site. Show the list at the decision stage and record the approval before doing the work.",
          },
          after: [
            "When in doubt, \"don't break what people read\" comes before \"make it easier for AI to use\". For posts with many impressions or clicks in Search Console, start with an update rather than a rewrite, so it is easier to undo if it goes wrong. Check that WordPress revisions are kept before you start.",
            "We could not read Google's own pages on redirect types, removed pages (404 and 410) and canonical URLs on the day this was written, so their details are not given here. Check the relevant Google Search Central pages before doing the work.",
          ],
        },
        {
          heading: "Dates: make them change only when the content does",
          paragraphs: [
            "Google says it estimates the date a page was published or significantly changed from several signals and may show that date in results. It recommends a visible date with a label such as \"Published\" or \"Last updated\", matching the datePublished and dateModified of Article or BlogPosting structured data. It also says not to give a future date, and that showing a date is not guaranteed ([Google Search Central: byline dates](" + SRC.datesEn + ")).",
            "The catch for agencies is WordPress's modified date. WordPress sets it to now every time a post is updated. If the theme shows \"Last updated\" from that date, fixing a single typo makes the post look as if it was updated today. The dateModified in the BlogPosting that Nurevo AEO publishes for posts is that same WordPress date (where an SEO plugin publishes the article's structured data, that one is used as it is).",
          ],
          table: {
            head: ["Work", "Updated date", "What to write in the post"],
            rows: [
              ["Typos and wording fixes", "Avoid moving it: save them together with the month's real updates", "Nothing needed"],
              ["Updating facts (prices, rules, figures)", "Changes", "What was changed, for example \"November 2026: prices updated to the new rates\""],
              ["Rewrite", "Changes", "What was changed and the question the post answers"],
              ["Merge", "Changes on the post that received the content", "Which posts were merged into it"],
              ["Saving without changing content", "Should not change", "—"],
            ],
          },
          after: [
            "Do not sell date changes on their own. Google's \"Creating helpful, reliable, people-first content\" encourages explaining how content was produced ([Google Search Central](" + SRC.helpful + ")). A short line in the post saying what was reviewed is part of that explanation.",
          ],
        },
        {
          heading: "Which posts are in llms.txt depends on the order of updates",
          paragraphs: [
            "The /llms.txt that Nurevo AEO builds lists the 30 most recently modified published posts and pages, leaving out any set to \"leave out of llms.txt\" in the per-page settings. It is rebuilt when posts or settings change.",
            "So saving an old post during a review can put it into llms.txt and push another post out. Saving a finished campaign post just to fix a typo can bring it back into the list. In a review month, open /llms.txt after the work, check that nothing you do not want listed has come in, and leave out unwanted posts with the per-page setting.",
            "Sites connected to the Nurevo service also send the titles and URLs of their 30 most recently updated posts and pages for measurement. It helps to plan the order of work knowing that the list of posts AI is pointed at is tied to the order in which posts were updated. [How to write llms.txt](/guide/llms-txt)",
          ],
        },
        {
          heading: "The monthly routine",
          list: [
            "Start of the month: pick the month's posts from the inventory (for example three updates and one merge). If any are to be merged or retired, send the list to the client for approval.",
            "Before the work: record the results of the chosen questions asked to AI and the Search Console numbers for those posts (next section).",
            "The work: do what was decided. Confirm facts that need checking (prices, rules, content needing an expert's review) with the client before changing them.",
            "After the work: check that the dates in the structured data match the dates on the page, the /llms.txt list, that redirects work and that no internal links are broken.",
            "Following months: after a gap, measure again the same way and put the result in the report.",
          ],
        },
        {
          heading: "Comparing before and after",
          paragraphs: [
            "One result says little about whether a review worked. Measure the same things the same way before and after, and compare.",
          ],
          table: {
            head: ["What to measure", "Before", "After", "Notes"],
            rows: [
              ["Search impressions and clicks, by page", "A set period before the work, such as four weeks", "A period of the same length after", "For seasonal businesses, also compare with the same period last year"],
              ["Impressions in AI features, by page", "Same", "Same", "From the generative AI performance report, which shows no clicks"],
              ["Mentions and citations in AI answers", "The chosen questions, asked to the chosen AI, a set number of times", "Same questions, same AI, same number of times", "Answers vary, so always say how many times you asked"],
              ["Visits from AI", "Referrers in your analytics", "Same", "Links from ChatGPT search results carry utm_source=chatgpt.com (OpenAI's FAQ)"],
            ],
          },
          after: [
            "For ChatGPT referrals see [OpenAI's publishers and developers FAQ](" + SRC.openaiFaq + "), and for measurement as a whole [How to measure AI visibility](/guide/measure-ai-visibility). The AirOps guide describes comparing at 30, 60 and 90 days ([AirOps](" + SRC.airops + ")). The length of the window can depend on the business and the number of posts; what matters is using the same window every time.",
            "Nurevo AEO's free AI check asks Perplexity, once a month, three questions built from the business type and area (never the business name) for each connected site, and records whether the business was named and the site cited. Pro measurement (beta) also covers Perplexity for now. Either can be one of the before-and-after records.",
          ],
        },
        {
          heading: "Contracts and pricing",
          paragraphs: [
            "Promise the work, not the result. The Rank Masters' service page, for one, states that it commits to the work and the report but does not guarantee recovered traffic ([The Rank Masters](" + SRC.rankmasters + ")). Sentences like these in the contract or proposal prevent disagreements later:",
          ],
          list: [
            "\"Each month we will work on [number] existing posts according to the agreed decision (keep, update, rewrite, merge or retire) and report records from before and after the work. We do not guarantee appearance or citation in AI answers, search rankings or increases in traffic.\"",
            "\"Before merging, redirecting or unpublishing any post, we will send you the list and wait for your approval.\"",
            "\"Facts that need checking, such as prices, regulations and medical or legal content, will be published only after you have confirmed them.\"",
            "\"Where we use generative AI in the work, we will tell you how, and a person will check facts and wording before publishing.\"",
          ],
          after: [
            "On price, building it up from time per post is easier to explain, and less likely to lose money, than working back from market rates. Set a time per post for each kind of work (an update takes [x] hours, a rewrite [y], a merge [z]), multiply by the month's numbers, and add the time for the report. Record the real time for the first three months and check it against the estimate. We give no market prices for agencies because we found no reliable primary source for them.",
            "Do not make rewriting posts in bulk to raise the count the goal of the service. Read Google's [spam policies](" + SRC.spam + ") in the original before you start. Even under a contract that promises a number of posts, keep a reason in the inventory for every post you change.",
          ],
        },
        {
          heading: "Steps in WordPress (with Nurevo AEO)",
          list: [
            `Install [Nurevo AEO](${WP_ORG}) (free) on the client's site and run the diagnosis for structured data, llms.txt and AI crawler access. It works alongside Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK and VK All in One Expansion Unit, and the article structured data they publish is used as it is.`,
            "Check whether the theme shows a \"Last updated\" date in the post. If not, turn on the date in the theme's settings or write a one-line update note at the top or bottom of the post. The diagnosis also recommends a visible updated date or dateModified.",
            "For a reviewed post, the \"Nurevo AEO\" panel in the block editor lets you add questions and answers for that post alone (place the Nurevo FAQ block set to \"This page's own questions\" and they are published as FAQPage on that post only). Keep the answers the same as the text of the post.",
            "Set retired posts and finished announcements to \"leave out of llms.txt\" in the same panel, then open /llms.txt after the work to check the list.",
            "For merged posts, set up the redirect, then repoint internal links that pointed to the old posts to the merged post's URL.",
            "In the monthly report, list the posts worked on, the decision, what changed and the records from before and after.",
          ],
        },
        {
          heading: "If your agency uses Nurevo",
          paragraphs: [
            `For web and SEO agencies there are monthly reports sent under your company name, logo and brand colours (printable to PDF) and a dashboard that shows several client sites on one screen. There is also a referral commission of 40% of the monthly fee of clients you refer, net of Stripe fees (subject to approval). Clients take out paid plans themselves, with their own consent, and the agency charges for the review work and reporting. See the [partner program](${PARTNER}) for details.`,
            "To be clear about the limits: Nurevo does not suggest rewrites for each post, and it does not track many AI services side by side. Dedicated writing tools and specialist measurement tools are better at that. A realistic split is to use Nurevo as the base that keeps structured data, llms.txt and AI crawler settings correct, and for the monthly report.",
          ],
        },
        {
          heading: "Checklist for the monthly review",
          list: [
            "The inventory sheet lists the question each post answers and its facts with dates.",
            "Each post has a decision (keep, update, rewrite, merge or retire) and a reason.",
            "The client's approval for merging and retiring is recorded.",
            "Before records are taken (Search Console, the generative AI report, the chosen questions).",
            "Typo-only fixes have not moved the updated date.",
            "Posts with updated facts say in the text what changed and when.",
            "The dates on the page match the dates in the structured data.",
            "Redirects and repointed internal links for merged posts have been checked.",
            "Nothing unwanted is listed in /llms.txt.",
            "After the work, the same measurements were taken again and reported.",
            "The contract or proposal says results are not guaranteed and sets out the approval steps.",
          ],
        },
      ],
      faqs: [
        { q: "Will reviewing existing articles get them cited by AI?", a: "That cannot be guaranteed. AI answers change from day to day, even for the same question. What a review can promise is the work of bringing facts up to date and making answers easier to read, plus records from before and after. Report the result as measurements taken the same way both times." },
        { q: "Should we write new articles or review existing ones first?", a: "If the client's site already has many posts with old prices or rules in them, start with the review. Stale facts are a reason AI gives wrong answers about a business. If no post answers a question that matters, a new article is needed." },
        { q: "Does changing the updated date on its own help?", a: "We recommend not offering date-only changes. Google says it estimates the date a page was published or significantly changed, and recommends that the visible date and the structured data date match." },
        { q: "Fixing a typo changes the last updated date. What can we do?", a: "WordPress updates the modified date on every save. Saving typo and wording fixes together with the month's real updates keeps the date from moving for no reason. Check in the theme's settings where the displayed date comes from." },
        { q: "Will merging posts lose search traffic?", a: "It can. Keep the post people read most as the one that stays, redirect the others to it and repoint internal links. Record impressions and clicks by page before and after, and always get the client's approval first." },
        { q: "How many posts should we review each month?", a: "There is no set number. It depends on how many posts there are, how many stale facts they hold and how long the client takes to confirm changes. Set priorities in the first inventory, start with a number you can sustain, and review it after about three months of recording the real time spent." },
        { q: "Can we rewrite with generative AI?", a: "You can use it for drafts, but a person should check facts and wording before publishing. Google encourages explaining how content was made, including how automation or AI was used. Tell the client at the contract stage how you will use it." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Before the review, see how AI reads the client's site",
        body: "The free check needs no sign-up: enter the URL to see the state of structured data, llms.txt and AI crawler access. Use it as the first page of the inventory.",
        label: "Run the free AI readability check",
        href: "/check",
        secondary: { label: "See the partner program", href: PARTNER },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, and Google and Search Console of Google LLC. Yoast SEO, Rank Math, All in One SEO, Slim SEO, SEO SIMPLE PACK, VK All in One Expansion Unit, WordPress, AirOps and The Rank Masters are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
