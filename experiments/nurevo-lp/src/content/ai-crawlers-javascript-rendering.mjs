// Content page: do AI crawlers and AI assistants run JavaScript? What part of
// a page ChatGPT, Claude, Perplexity and Gemini actually read, how to check the
// HTML they get (curl, view-source, DevTools, Search Console, server logs), and
// where WordPress sites hide facts behind JavaScript (Ajax lists, embeds,
// widgets, GTM-injected JSON-LD, counters, headless front ends, JS challenges).
// General / technical page for site owners and agencies.
//
// Separate from agency-ai-crawler-blocking-audit (whether a CDN/WAF refuses the
// crawler at all), booking-page-ai-search (booking rules outside embeds) and
// agency-new-site-build-ai-search (build-time checklist; it says outright it
// did not check how non-Google crawlers handle JavaScript - this page does).
//
// Written 2026-11-26 17時 (JST).
//
// Nurevo AEO facts (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/
// readme.txt 0.9.2 and nurevo-webmcp.php):
// - "All of it is rendered on your own server, so crawlers that never run
//   JavaScript still see it." Server-rendered JSON-LD emitted into the page
//   HTML (wp_head, priority 99; after VK ExUnit when it is active).
// - llms.txt served at /llms.txt, built inside the plugin.
// - Nurevo FAQ block is a dynamic block with a PHP render_callback
//   (webmcp_canary_render_faq), so its questions are in the HTML.
// - The optional browser tag (tag.js) is off by default and not needed for AEO.
// - Free AEO diagnosis fetches the public front page, /robots.txt and /llms.txt.
//   (We do NOT claim it compares rendered vs initial HTML.)
// - Pro AI-visibility measurement is on Perplexity (beta). Prices: Free 0,
//   Standard 3,000 JPY / USD 20, Pro from 14,800 JPY / USD 99.
//
// Outside facts and where they were read (2026-11-26):
// - Vercel blog "The rise of the AI crawler" (2024-12-17, with MERJ): none of
//   the major AI crawlers render JavaScript (OAI-SearchBot, ChatGPT-User,
//   GPTBot, ClaudeBot, Meta-ExternalAgent, Bytespider, PerplexityBot); they
//   fetch JS files (ChatGPT 11.50%, Claude 23.84% of requests) but do not
//   execute them; Gemini uses Googlebot's infrastructure with full rendering;
//   AppleBot renders through a browser-based crawler; volumes in one month:
//   Googlebot 4.5bn, GPTBot 569m, Claude 370m, AppleBot 314m, PerplexityBot
//   24.4m; 404s ChatGPT 34.82%, Claude 34.16%, Googlebot 8.22%; advice:
//   server-side rendering for critical content.
// - SearchEngineWorld, Andre Alpar (2026-06-09, upd. 07-02): 12 assistants,
//   one prompt each, one domain, one moment. ChatGPT, Claude, Gemini,
//   Perplexity, Meta AI, Microsoft Copilot, Grok reported the raw-HTML decoy;
//   DeepSeek, ERNIE, Qwen, Kimi, Mistral reported the JS-only value. Copilot
//   fetched the script without the follow-up call; Grok ran it on one node but
//   answered with the decoy; Perplexity said it could not access the page
//   while the server logged HTTP 200.
// - Writesonic (2026-03-30, vendor): one test page, 62 markers, 6 assistants;
//   ChatGPT, Claude, Gemini ran no JS on live fetch; display:none text read by
//   5/6, ::before/::after text 0/6; Copilot ~500ms, DeepSeek 2s, Grok 3s.
// - RESONEO sentinel report (2026-01): ChatGPT, Claude, Gemini read static
//   HTML and noscript, no JS; Google AI Mode index-only (inferred from no live
//   fetch in logs); user agents ChatGPT-User/1.0, Claude-User/1.0,
//   Perplexity-User/1.0.
// - Google (already read for agency-new-site-build-ai-search, 2026-11-18):
//   optimization guide for generative AI features (2026-07-10): JavaScript is
//   processed unless blocked; perfectly semantic HTML is not required.
// - Uravation (2026-08-27, mod. 09-05): official crawler docs describe
//   purposes, not a rendering guarantee.
// Could not be read this run (permission prompt not answered): Google JS SEO
// basics / dynamic rendering / JS-generated structured data, OpenAI and
// Perplexity crawler docs (linked as originals only), Search Engine Land
// 485228 (rate limited), Indie Hackers post (error). Not stated on purpose:
// dynamic rendering policy wording, whether ChatGPT search's index renders JS,
// how long Google takes to render, any "x times more citations" figure.
// Top articles read 2026-11-26: Ahrefs JA technical AEO (2026-09-28),
// Uravation (above), Web担当者Forum / Moz (2026-06-29), Kinsta JP AEO WordPress
// (2026-06-15); Vercel, Hall (usehall, undated ~2025), searchVIU (upd.
// 2026-11-03), Advanced Web Ranking (2026-08-20), Go Fish Digital
// (2026-09-11), SearchEngineWorld, Writesonic, RESONEO.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  vercel: "https://vercel.com/blog/the-rise-of-the-ai-crawler",
  sew: "https://www.searchengineworld.com/do-ai-assistants-actually-render-your-javascript-when-grounding-we-put-it-to-the-test",
  writesonic: "https://writesonic.com/blog/ai-crawler-study-what-llms-see-on-your-website",
  resoneo: "https://think.resoneo.com/sentinel/geo-llm-crawler-report.html",
  optGuide: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide",
  optGuideJa: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide?hl=ja",
  jsSeo: "https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics",
  jsSeoJa: "https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics?hl=ja",
  openaiBots: "https://developers.openai.com/api/docs/bots",
  perplexityBots: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers",
  uravation: "https://uravation.com/llmo/javascript-spa-ai-crawler-rendering/",
  ahrefsJa: "https://ahrefs.com/ja/aeo/technical-aeo",
  webtan: "https://webtan.impress.co.jp/e/2026/06/29/52793",
  kinstaJa: "https://kinsta.com/jp/blog/aeo-wordpress/",
  hall: "https://usehall.com/guides/chatgpt-ai-crawlers-javascript-rendering",
  searchviu: "https://www.searchviu.com/en/guides/ai-crawlers-javascript-rendering/",
  awr: "https://www.advancedwebranking.com/blog/what-ai-search-crawlers-read",
  gofish: "https://gofishdigital.com/blog/javascript-rendering-llm-visibility-answers-ai-cant-see/",
};

const CURL = `# 1) 最初に返るHTML（JavaScriptを動かす前）を保存する
URL="https://example.com/price/"
curl -sS -L --compressed -o initial.html \\
  -w 'status=%{http_code} final=%{url_effective}\\n' "$URL"

# 2) AIに答えてほしい事実が、そのHTMLに文字で入っているか
for WORD in "3,300円" "火曜定休" "03-1234-5678" "駐車場"; do
  if grep -qF "$WORD" initial.html; then echo "あり  $WORD"; else echo "なし  $WORD"; fi
done

# 3) 構造化データ（JSON-LD）が最初のHTMLに入っているか（0なら入っていない）
grep -o 'application/ld+json' initial.html | wc -l

# 4) AIのクローラーの名前で取りに行っても、同じ事実が返るか（手がかり）
for UA in "ChatGPT-User/1.0" "OAI-SearchBot/1.0" "Claude-User/1.0" "PerplexityBot/1.0"; do
  printf '%-20s ' "$UA"
  curl -sS -L --compressed -A "$UA" "$URL" | grep -cF "3,300円"
done`;

const CURL_EN = `# 1) Save the HTML the server returns first (before any JavaScript runs)
URL="https://example.com/pricing/"
curl -sS -L --compressed -o initial.html \\
  -w 'status=%{http_code} final=%{url_effective}\\n' "$URL"

# 2) Are the facts you want AI to quote present as text in that HTML?
for WORD in '$49' 'Closed Tuesdays' '555-0134' 'Free parking'; do
  if grep -qF "$WORD" initial.html; then echo "found    $WORD"; else echo "MISSING  $WORD"; fi
done

# 3) Is structured data (JSON-LD) in the initial HTML? (0 means no)
grep -o 'application/ld+json' initial.html | wc -l

# 4) Does the same fact come back when you send an AI crawler's name? (a clue only)
for UA in "ChatGPT-User/1.0" "OAI-SearchBot/1.0" "Claude-User/1.0" "PerplexityBot/1.0"; do
  printf '%-20s ' "$UA"
  curl -sS -L --compressed -A "$UA" "$URL" | grep -cF '$49'
done`;

const LOG = `# サーバーのアクセスログで、AIのクローラーが何を取りに来たかを見る
# （combined形式のログで、7列目がURLの場合）
# （ページのあとに .js や /wp-json/ を取りに来ていても、実行した証拠にはなりません）
grep -E 'ChatGPT-User|OAI-SearchBot|Claude-User|Claude-SearchBot|Perplexity-User|PerplexityBot' access.log \\
  | awk '{print $7}' | sort | uniq -c | sort -rn | head -30`;

const LOG_EN = `# What did AI crawlers request? (combined log format, path in column 7)
# A request for a .js file or /wp-json/ after the page is NOT proof the script ran.
grep -E 'ChatGPT-User|OAI-SearchBot|Claude-User|Claude-SearchBot|Perplexity-User|PerplexityBot' access.log \\
  | awk '{print $7}' | sort | uniq -c | sort -rn | head -30`;

export default {
  slug: "ai-crawlers-javascript-rendering",
  targetQueries: [
    "AIクローラー JavaScript 読めない",
    "ChatGPT JavaScript レンダリング サイト 確認",
    "AI検索 初期HTML WordPress 確認方法",
    "do AI crawlers render JavaScript",
    "can ChatGPT read JavaScript content",
    "check what AI crawlers see on my website",
  ],
  related: ["agency-ai-crawler-blocking-audit", "agency-new-site-build-ai-search", "booking-page-ai-search", "faq-page-ai-search", "local-business-schema-seo-plugins", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "AIはJavaScriptを読む？ChatGPTに見える中身の確かめ方 | Nurevo",
      description: "ChatGPT・Claude・PerplexityのクローラーはJavaScriptを実行しないという調査が続いています。AIに見える最初のHTMLの確かめ方と、WordPressで事実が隠れやすい場所、直し方。",
      h1: "AIのクローラーはJavaScriptを読むのか：ChatGPTやPerplexityに見えている中身の確かめ方",
      lead: "ChatGPT・Claude・Perplexityがページを読むときは、JavaScriptを動かす前の「最初のHTML」だけを読むと考えて準備するのが安全です。2024年のVercelの集計と、2026年に行われた複数のテストでは、これらのクローラーやアシスタントはJavaScriptを実行していませんでした。Google（AI Overviews・AI Mode）は検索の仕組みでJavaScriptを処理しますが、ほかのAIに読まれたい事実（料金・営業時間・対応エリア・よくある質問の答え）は、最初のHTMLに文字で書いておいてください。この記事では、その確かめ方と、WordPressで事実がJavaScriptの奥に隠れやすい場所をまとめます。",
      intro: [
        "作成日：2026年11月26日（JST）。対象は、自社サイトを運営している方、サイトを作る・保守する制作会社の方です。コマンドはパソコンの「ターミナル」で動くものですが、コマンドを使わない確かめ方も書いています。",
        "AIの仕組みは各社が予告なく変えることがあり、ここで紹介するテストも、ある時点の結果です。AIの回答は日や聞き方によっても変わります。最初のHTMLに事実を書くことは読まれるための前提で、AIの回答に出ることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "よく読まれている記事と、足りないこと",
          paragraphs: [
            "「AIクローラー JavaScript」「do AI crawlers render JavaScript」などで上位に出る日本語4本・英語8本を、2026年11月26日に読みました。日本語は、[Ahrefs](" + SRC.ahrefsJa + ")（2026年9月28日）、[Uravation](" + SRC.uravation + ")（9月5日更新）、[Web担当者Forum（Mozの翻訳）](" + SRC.webtan + ")（6月29日）、[Kinsta](" + SRC.kinstaJa + ")（6月15日）。英語は、[Vercel](" + SRC.vercel + ")、[Hall](" + SRC.hall + ")、[searchVIU](" + SRC.searchviu + ")（11月3日更新）、[Advanced Web Ranking](" + SRC.awr + ")（8月20日）、[Go Fish Digital](" + SRC.gofish + ")（9月11日）、[SearchEngineWorld](" + SRC.sew + ")、[Writesonic](" + SRC.writesonic + ")、[RESONEO](" + SRC.resoneo + ")のテストです。",
            "「主なAIのクローラーはJavaScriptを実行しない」「大事な内容はサーバー側で出す」という結論はほぼ共通でした。一方で、次の点はあまり書かれていませんでした。",
          ],
          table: {
            head: ["足りない点", "この記事で書いていること"],
            rows: [
              ["多くの記事の根拠が2024年12月のVercelの集計1つだけ", "2026年の3つのテストと並べた表。テストどうしで結果が違う点も書く"],
              ["Google（検索の索引）と、Geminiなどがその場でページを取りに行くときの違いが混ざっている", "「索引で読む」と「その場で取りに行く」を分けて説明"],
              ["確かめ方が「ページのソースを見る」の一言だけ", "curl・ブラウザ・Search Console・アクセスログの4つの手順と、それぞれで分かること・分からないこと"],
              ["WordPressで、どこが危ないかが書かれていない", "WordPressで事実がJavaScriptの奥に入りやすい場所の表と、直し方の順番"],
              ["「AIに貼って要約させたら合っていた」で済ませてしまう", "AIの説明とサーバーの記録が食い違った例と、記録で確かめる方法"],
            ],
          },
        },
        {
          heading: "答え：どのAIがJavaScriptを実行するか（分かっている範囲）",
          paragraphs: [
            "まず前提として、ページの「最初のHTML」とは、サーバーが最初に返す文字のことです。ブラウザはそのあとにJavaScriptを動かして、一覧を読み込んだり、口コミや地図を埋め込んだりします。JavaScriptを実行しないクローラーには、あとから足された部分は見えません。",
            "OpenAIとPerplexityは、クローラーの名前と用途を公開しています（[OpenAI：クローラー](" + SRC.openaiBots + ")、[Perplexity：クローラー](" + SRC.perplexityBots + ")）。ただ、これらは用途の説明で、JavaScriptを実行するかどうかを約束するものではない、とUravationは指摘しています（[Uravation](" + SRC.uravation + ")）。そのため、実際の動きは外部の集計やテストで見るしかありません。",
          ],
          table: {
            head: ["AI", "Vercel（2024年12月、クローラーの集計）", "2026年のテスト（その場でページを取りに行くとき）"],
            rows: [
              ["ChatGPT（GPTBot・OAI-SearchBot・ChatGPT-User）", "実行しない。JavaScriptのファイルは要求の11.50%で取りに来るが、実行はしない", "3つのテストとも、最初のHTMLだけを読んだ"],
              ["Claude（ClaudeBot など）", "実行しない。JavaScriptのファイルの取得は23.84%", "3つのテストとも、最初のHTMLだけを読んだ"],
              ["Perplexity（PerplexityBot など）", "実行しない", "SearchEngineWorld では最初のHTMLの値を答えた。RESONEO では要求がうまく取れず判定できなかった"],
              ["Gemini・Google", "Googlebotの仕組みを使うため、JavaScriptまで処理する", "Geminiがその場で取りに行くときは最初のHTMLだけを読んだ（3つのテスト）。RESONEOは、AI Modeはその場で取りに来ず索引を使う、と記録から推定"],
              ["Microsoft Copilot", "（調べていない）", "テストで結果が分かれた。スクリプトを取得しても実行しなかった例と、実行した例がある"],
              ["Grok", "（調べていない）", "実行した記録はあるが、答えには最初のHTMLの値を使った例もある"],
            ],
          },
          after: [
            "出典：[Vercel](" + SRC.vercel + ")（2024年12月17日）、[SearchEngineWorld](" + SRC.sew + ")（2026年6月9日、12のアシスタントを1回ずつ）、[Writesonic](" + SRC.writesonic + ")（2026年3月、6つのアシスタント）、[RESONEO](" + SRC.resoneo + ")（2026年1月）。SearchEngineWorld のテストでは、DeepSeek・ERNIE・Qwen・Kimi・Mistral の5つはJavaScriptを実行した値を答えています。どのテストも、ページ1つ・ある時点のもので、各社が仕組みを変えれば結果も変わります。",
            "Googleは、生成AIの機能のためのガイドで、ブロックされていなければJavaScriptも処理すると説明しています（[Google：生成AI機能のためのサイトの最適化](" + SRC.optGuideJa + ")、2026年7月10日）。Googleの検索では、JavaScriptの処理は「クロール」「レンダリング」「インデックス」の流れで行われます（[Google：JavaScript SEOの基本](" + SRC.jsSeoJa + ")）。つまり、Googleの索引に入ったページはJavaScriptのあとの中身で読まれる可能性がありますが、ChatGPTやClaude、Perplexityには同じことは期待できません。",
          ],
        },
        {
          heading: "確かめる手順1：コマンドで最初のHTMLを見る",
          paragraphs: [
            "いちばん確実なのは、サーバーが最初に返すHTMLを保存して、AIに答えてほしい事実の文字を探すことです。curl はJavaScriptを実行しないので、JavaScriptを実行しないクローラーに近い見え方になります。料金・サービス・よくある質問・アクセスなど、引用されてほしいページで試してください。",
          ],
          code: CURL,
          after: [
            "2で「なし」と出た事実は、JavaScriptであとから足されているか、画像の中の文字になっているか、別のページにあります。数字が <span> などのタグで分かれていると見つからないことがあるので、短い文字（「3,300」だけなど）でも探してください。",
            "4は手がかりです。名前だけを名乗った要求は本物のクローラーとは違うIPアドレスから来るので、サーバーやCDNの扱いが変わることがあります。ここで 403 や別の中身が返る場合は、ボット対策の層を確かめます（[CloudflareやWAFがAIのクローラーを止めていないか確かめる手順](/guide/agency-ai-crawler-blocking-audit)）。",
          ],
        },
        {
          heading: "確かめる手順2：コマンドを使わない方法",
          list: [
            "ページのソースを見る：Chromeでページを開き、右クリックの「ページのソースを表示」（Windowsは Ctrl＋U、Macは Option＋Command＋U）。開いた画面で Ctrl＋F（Command＋F）を押し、料金や電話番号を探します。ここに出るのが最初のHTMLです。右クリックの「検証」で見える画面は、JavaScriptのあとの中身なので、比べる相手にはなりません。",
            "JavaScriptを止めて開く：検証の画面（デベロッパーツール）を開いたまま、Ctrl＋Shift＋P（Command＋Shift＋P）で「Disable JavaScript」と入力して選び、ページを読み込み直します。消えた一覧・口コミ・地図・数字が、JavaScriptで足されている部分です。終わったら同じ手順で「Enable JavaScript」に戻します。",
            "Googleの見え方は別に見る：Search Console の「URL検査」で「公開URLをテスト」を押し、「テスト済みのページを表示」からHTMLを見ると、Googleが処理したあとの中身が分かります。これはGoogleの見え方で、ほかのAIの見え方ではありません。",
            "AIに貼って聞くのは最後の確認に：AIにURLを貼って要約させる方法は手軽ですが、AIの説明は当てになりません。SearchEngineWorld のテストでは、Perplexity は「ページにアクセスできなかった」と答えた一方、テスト用のサーバーには正常に取得した記録（HTTP 200）が残っていました（[SearchEngineWorld](" + SRC.sew + ")）。",
          ],
        },
        {
          heading: "確かめる手順3：アクセスログで実際の取得を見る",
          paragraphs: [
            "サーバーのアクセスログが見られるなら、AIのクローラーが実際にどのURLを取りに来たかを数えます。レンタルサーバーの多くは管理画面からログを取り出せます。",
          ],
          code: LOG,
          after: [
            "ページのあとに .js のファイルを取りに来ていても、それだけでは実行した証拠になりません。Vercelの集計でも、ChatGPTとClaudeのクローラーはJavaScriptのファイルを取得していましたが、実行はしていませんでした（[Vercel](" + SRC.vercel + ")）。ログで分かるのは「来たか」「どのURLに何を返したか」までです。",
          ],
        },
        {
          heading: "WordPressで事実がJavaScriptの奥に隠れやすい場所",
          paragraphs: [
            "WordPressは、投稿や固定ページの本文をサーバー側（PHP）でHTMLにして返すので、ふつうに書いた本文は最初のHTMLに入ります。危ないのは、プラグインやウィジェット、外部サービスの埋め込みで後から足される部分です。次の表を、自分のサイトで上の手順を使って1つずつ確かめてください。",
          ],
          table: {
            head: ["場所", "起きやすいこと", "直し方"],
            rows: [
              ["タブ・アコーディオン（よくある質問の開閉など）", "多くは本文がHTMLに入っていて、CSSで隠しているだけ。ボタンを押してから読み込む作りだと入らない", "ソースに答えの文字があるか確かめる。WordPressの「詳細」ブロックは開閉してもHTMLに本文が入る"],
              ["「もっと見る」・無限スクロール・絞り込みで出る一覧（料金表・メニュー・物件・施工事例）", "最初の数件しかHTMLに入らず、残りは後から読み込む", "大事な料金や条件は、一覧とは別に本文の表で書く。一覧はページ送りのURLでも見られるようにする"],
              ["口コミ・Instagram・Googleマップ・予約システムの埋め込み", "外部のスクリプトや iframe で表示され、自分のページの本文にならない", "営業時間・住所・予約の決まりなど要点を、本文に文字で書く（[予約ページの作り方](/guide/booking-page-ai-search)）"],
              ["Googleタグマネージャーで入れた構造化データ（JSON-LD）", "JavaScriptで足されるので、最初のHTMLには入らない", "テーマやSEOプラグイン、構造化データのプラグインでサーバー側から出す"],
              ["数字が増えていくカウンター、スライダー、ポップアップの中の文字", "作りによって、最初のHTMLの値が「0」だったり、文字が入っていなかったりする", "手順1で数字を探す。入っていなければ、同じ事実を本文に書く"],
              ["CSSの ::before・::after で出している文字、画像の中の文字（バナーの料金など）", "JavaScriptとは別の理由で、文字として読まれにくい。Writesonicのテストでは ::before・::after の文字は6つのAIのどれにも読まれなかった", "料金・条件は本文のテキストで書き、画像には説明の代替テキストを付ける"],
              ["ヘッドレス（WordPressをデータの置き場にして、表側をReactやNext.jsで作る）", "表側の作りが画面をブラウザで組み立てる方式だと、最初のHTMLがほぼ空になる", "サーバー側での描画（SSR）か、事前に作るHTML（SSG）にする。Vercelも大事な内容はサーバー側で描画するよう勧めている"],
              ["ボット対策の「JavaScriptで確かめる」画面（CDNやセキュリティプラグイン）", "クローラーには確認画面しか見えない", "AI検索のクローラーへの扱いを確かめる（[確かめる手順](/guide/agency-ai-crawler-blocking-audit)）"],
            ],
          },
          after: [
            "隠した文字の扱いについて、Writesonicのテストでは、CSSの display:none で隠した文字は6つのうち5つのAIが読んでいました（[Writesonic](" + SRC.writesonic + ")）。開閉する作り自体が悪いわけではなく、答えの文字がHTMLに入っているかどうかが分かれ目です。",
          ],
        },
        {
          heading: "直し方の順番",
          list: [
            "AIに答えてほしい事実を決める：料金（税込み）、営業時間と定休日、対応エリア、よくある質問の答え、会社の基本情報など、ページごとに5〜10個。",
            "手順1か2で、その事実が最初のHTMLにあるかを確かめる。なければ、まず本文に文字で書く。いちばん簡単で、どのAIにも効く直し方です。",
            "構造化データとllms.txtを、サーバー側で出す設定にする。タグマネージャーで足している場合は、テーマやプラグインに移す。",
            "埋め込みや一覧は残してよいので、その要点を本文に書き足す。ボットにだけ別の中身を返す作りは、人とAIで内容がずれる原因になるので避け、誰にも同じHTMLを返す。",
            "ヘッドレスやJavaScriptで画面を組み立てるサイトは、制作会社と、サーバー側の描画か事前に作るHTMLに変えられるかを相談する。",
            "直したら、手順1〜3をもう一度行い、何を直したかと日付を記録する。AIでの登場の変化は、同じ質問で測り直す（[AIでの登場率の測り方](/guide/measure-ai-visibility)）。",
          ],
        },
        {
          heading: "WordPressでの手順（Nurevo AEOを使う場合）",
          paragraphs: [
            `無料のプラグイン[Nurevo AEO](${WP_ORG})は、構造化データ（JSON-LD）とllms.txtを、どちらも自分のサーバーで作って出します。JSON-LDはページのHTMLの中に入るので、JavaScriptを実行しないクローラーにも届きます。Nurevo のよくある質問のブロックも、サーバー側でHTMLにして表示します。`,
          ],
          list: [
            "プラグインを入れて、店や会社の情報（名前・住所・電話・営業時間・サービス）を入れる。空いている項目だけを足し、Yoast SEO・Rank Math・AIOSEO・SEO SIMPLE PACK・VK All in One Expansion Unit と一緒に使っても、構造化データは重複しません。",
            "公開ページを手順1で取得し、application/ld+json があること、/llms.txt が開けることを確かめる。",
            "タグマネージャーで同じ構造化データを足していた場合は、二重にならないよう、どちらか一方にする。",
            "よくある質問は、Nurevo のよくある質問のブロック（または本文）で書き、手順2で答えの文字がソースにあるかを確かめる。",
            "Nurevo のブラウザ用のタグは初期設定でオフで、AI検索の対策には使いません。オフのままで構いません。",
          ],
          after: [
            "料金は、Free（0円）、Standard（月3,000円）、Pro（月14,800円〜）です。Pro では、AIの回答に自社が出ているかを測れます（いまは Perplexity で計測、ベータ）。無料のチェック（[nurevo.jp/check](/check)）では、トップページ・robots.txt・llms.txt の状態を確かめられます。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "引用されてほしいページごとに、AIに答えてほしい事実を5〜10個決めた",
            "その事実が、ページのソース（最初のHTML）に文字で入っている",
            "JavaScriptを止めて開いても、料金・営業時間・連絡先が消えない",
            "構造化データ（JSON-LD）が最初のHTMLに入っている（タグマネージャーだけに頼っていない）",
            "/llms.txt が開け、中身が最新",
            "口コミ・地図・予約・SNSの埋め込みの要点を、本文にも書いた",
            "「もっと見る」で出る一覧の大事な条件を、本文の表にも書いた",
            "料金や条件が、画像やCSSの装飾の中だけにない",
            "AIのクローラーの名前で取りに行っても、同じ中身が返る（403や確認画面にならない）",
            "直した日付と内容を記録し、同じ質問で測り直す予定を入れた",
          ],
        },
      ],
      faqs: [
        { q: "Google の AI Overviews や AI Mode は、JavaScriptで出した内容も読みますか？", a: "Googleは、ブロックされていなければJavaScriptも処理すると説明しています。ただし、ChatGPT・Claude・Perplexity には同じことは期待できないので、大事な事実は最初のHTMLにも書いておくのが安全です。" },
        { q: "アコーディオンで隠したよくある質問は、AIに読まれませんか？", a: "答えの文字がHTMLに入っていて、CSSで隠しているだけなら、読まれる可能性があります。ボタンを押してから読み込む作りだと入りません。ページのソースで答えの文字を探して確かめてください。" },
        { q: "Googleタグマネージャーで入れた構造化データは無駄ですか？", a: "JavaScriptを処理するGoogleには読まれることがありますが、JavaScriptを実行しないクローラーには届きません。テーマやプラグインでサーバー側から出す形に移すと、どちらにも届きます。" },
        { q: "ページビルダーで作ったWordPressのサイトは大丈夫ですか？", a: "ページビルダーの多くはサーバー側でHTMLを作るので、ふつうの文章や見出しは最初のHTMLに入ります。ただ、後から読み込むウィジェットや埋め込みもあるので、使っている部品ごとに手順1か2で確かめてください。" },
        { q: "llms.txt を置けば、JavaScriptの問題は気にしなくてよいですか？", a: "いいえ。llms.txt はサイトの案内として役立ちますが、AIが引用するのは多くの場合、個々のページです。ページ自体の最初のHTMLに事実があることが先です。" },
        { q: "ChatGPT にURLを貼ったら、正しく要約されました。問題ありませんか？", a: "1回うまくいっても、ほかのページや別の日に同じとは限りません。AIの説明とサーバーの記録が食い違った例もあるので、ページのソースやアクセスログで確かめるのが確実です。" },
        { q: "最初のHTMLに事実を書けば、AIの回答に出ますか？", a: "保証はできません。読まれるための前提が整うだけで、AIの回答は日や聞き方、ほかのサイトの情報によって変わります。直したあとは同じ質問で測り直してください。" },
      ],
      relatedHeading: "あわせて読みたい",
      cta: {
        heading: "AIに見えている中身を確かめる",
        body: "無料のチェックは登録不要です。URLを入れると、構造化データ・llms.txt・AIのクローラーの扱いを確かめられます。WordPressなら、無料のプラグインで構造化データとllms.txtをサーバー側から出せます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "無料でプラグインを入れてみる", href: WP_ORG },
      },
      footnote: "ChatGPT・GPTBot・OAI-SearchBot はOpenAIの、Claude はAnthropicの、Perplexity はPerplexity AIの、Google・Gemini・Chrome はGoogle LLCの、Microsoft Copilot はMicrosoftの、Grok はxAIの、Vercel・Next.js はVercel, Inc.の、Cloudflare はCloudflare, Inc.の商標です。WordPress はWordPress Foundationの商標です。その他の製品名は各社の商標です。Nurevoはこれらの会社と提携していません。",
    },
    en: {
      title: "Do AI Crawlers Run JavaScript? Check What ChatGPT Sees | Nurevo",
      description: "Tests keep finding that ChatGPT, Claude and Perplexity don't run JavaScript. How to check the initial HTML AI reads, where WordPress hides facts, and fixes.",
      h1: "Do AI crawlers run JavaScript? How to check what ChatGPT and Perplexity actually see on your site",
      lead: "Plan as if ChatGPT, Claude and Perplexity read only the initial HTML of your page, the text the server sends before any JavaScript runs. Vercel's 2024 analysis and several tests run in 2026 found that these crawlers and assistants did not execute JavaScript. Google (AI Overviews, AI Mode) processes JavaScript through its search pipeline, but if you want other AI tools to quote your prices, hours, service area or FAQ answers, put those facts in the initial HTML as plain text. This guide shows how to check, and where WordPress sites tend to bury facts behind JavaScript.",
      intro: [
        "Written 26 November 2026 (JST). It is for people who run their own site and for agencies that build or maintain sites. The commands run in a terminal, and there are also checks that need no commands.",
        "AI companies change their systems without notice, and the tests quoted here each capture one moment. AI answers also vary by day and wording. Getting your facts into the initial HTML is a precondition for being read, not a guarantee of appearing in AI answers.",
      ],
      sections: [
        {
          heading: "What the top articles cover, and what they miss",
          paragraphs: [
            "On 26 November 2026 we read four Japanese and eight English articles that rank for queries such as \"do AI crawlers render JavaScript\": in Japanese, [Ahrefs](" + SRC.ahrefsJa + ") (28 Sep 2026), [Uravation](" + SRC.uravation + ") (updated 5 Sep), [Web Tan Forum's translation of Moz](" + SRC.webtan + ") (29 Jun) and [Kinsta](" + SRC.kinstaJa + ") (15 Jun); in English, [Vercel](" + SRC.vercel + "), [Hall](" + SRC.hall + "), [searchVIU](" + SRC.searchviu + ") (updated 3 Nov), [Advanced Web Ranking](" + SRC.awr + ") (20 Aug), [Go Fish Digital](" + SRC.gofish + ") (11 Sep), and the tests by [SearchEngineWorld](" + SRC.sew + "), [Writesonic](" + SRC.writesonic + ") and [RESONEO](" + SRC.resoneo + ").",
            "They broadly agree that the main AI crawlers do not run JavaScript and that critical content should be rendered on the server. Several things are thin or missing:",
          ],
          table: {
            head: ["What is missing", "What this guide adds"],
            rows: [
              ["Many rely on a single source, Vercel's December 2024 analysis", "A table setting it beside three 2026 tests, including where the tests disagree"],
              ["Google's index and a live fetch by Gemini are treated as the same thing", "A clear split between \"read from an index\" and \"fetched live\""],
              ["Checking is reduced to \"view the source\"", "Four checks (curl, browser, Search Console, server logs) and what each can and cannot tell you"],
              ["No WordPress specifics", "A table of where WordPress sites put facts behind JavaScript, and the order to fix them"],
              ["\"I pasted the URL into the AI and the summary was right\" is treated as proof", "A case where the assistant's own account contradicted the server log, and how to check the log"],
            ],
          },
        },
        {
          heading: "The answer: which AI tools run JavaScript (as far as is known)",
          paragraphs: [
            "First, the initial HTML is the text your server sends first. A browser then runs JavaScript to load lists, embed reviews, draw maps and so on. A crawler that does not execute JavaScript never sees what was added afterwards.",
            "OpenAI and Perplexity publish their crawler names and purposes ([OpenAI: crawlers](" + SRC.openaiBots + "), [Perplexity: crawlers](" + SRC.perplexityBots + ")). As Uravation notes, these pages describe purposes rather than promising anything about JavaScript ([Uravation](" + SRC.uravation + ")), so actual behaviour has to be inferred from outside measurements and tests.",
          ],
          table: {
            head: ["AI", "Vercel (Dec 2024, crawler traffic)", "2026 tests (live fetch of a page)"],
            rows: [
              ["ChatGPT (GPTBot, OAI-SearchBot, ChatGPT-User)", "Does not execute JavaScript. Fetches JS files in 11.50% of requests without running them", "Read only the initial HTML in all three tests"],
              ["Claude (ClaudeBot and others)", "Does not execute JavaScript. JS files in 23.84% of requests", "Read only the initial HTML in all three tests"],
              ["Perplexity (PerplexityBot and others)", "Does not execute JavaScript", "Reported the initial-HTML value in SearchEngineWorld's test; RESONEO's requests were malformed, so no verdict"],
              ["Gemini / Google", "Uses Googlebot's infrastructure, with full JavaScript rendering", "Gemini read only the initial HTML when fetching live (three tests). RESONEO inferred from its logs that AI Mode used the index and did not fetch live"],
              ["Microsoft Copilot", "(not covered)", "Tests disagree: one saw it fetch the script without running it, others saw it run JavaScript"],
              ["Grok", "(not covered)", "Ran JavaScript in some cases, but in one test still answered with the initial-HTML value"],
            ],
          },
          after: [
            "Sources: [Vercel](" + SRC.vercel + ") (17 Dec 2024), [SearchEngineWorld](" + SRC.sew + ") (9 Jun 2026, 12 assistants, one prompt each), [Writesonic](" + SRC.writesonic + ") (March 2026, six assistants), [RESONEO](" + SRC.resoneo + ") (January 2026). In SearchEngineWorld's test, five assistants (DeepSeek, ERNIE, Qwen, Kimi and Mistral) did report the JavaScript-only value. Each test used one page at one moment; results will change when the companies change their systems.",
            "Google says in its guide to generative AI features that it processes JavaScript unless it is blocked ([Google: Optimizing your website for generative AI features](" + SRC.optGuide + "), 10 July 2026), and Google Search handles JavaScript through crawling, rendering and indexing ([Google: JavaScript SEO basics](" + SRC.jsSeo + ")). Pages in Google's index can therefore be read after JavaScript has run. Do not expect the same from ChatGPT, Claude or Perplexity.",
          ],
        },
        {
          heading: "Check 1: look at the initial HTML from the command line",
          paragraphs: [
            "The most reliable check is to save the HTML your server sends first and search it for the facts you want AI to quote. curl does not run JavaScript, so it sees roughly what a non-rendering crawler sees. Try it on the pages you most want cited: pricing, services, FAQ, location.",
          ],
          code: CURL_EN,
          after: [
            "Anything step 2 reports as MISSING is added by JavaScript, sits inside an image, or lives on another page. If a number is split by tags such as <span>, search for a shorter piece (just \"49\", for example).",
            "Step 4 is only a clue. A request that merely uses a crawler's name comes from a different IP address than the real crawler, so the host or CDN may treat it differently. If it returns 403 or different content, check the bot-protection layers ([how to check whether a CDN or WAF blocks AI crawlers](/guide/agency-ai-crawler-blocking-audit)).",
          ],
        },
        {
          heading: "Check 2: without the command line",
          list: [
            "View the source: in Chrome, right-click and choose \"View page source\" (Ctrl+U on Windows, Option+Command+U on Mac), then search with Ctrl+F (Command+F) for your price or phone number. This is the initial HTML. The \"Inspect\" panel shows the page after JavaScript, so it is not the right comparison.",
            "Load the page with JavaScript off: with DevTools open, press Ctrl+Shift+P (Command+Shift+P), type \"Disable JavaScript\", select it and reload. Lists, reviews, maps or numbers that disappear are added by JavaScript. Switch back with \"Enable JavaScript\" when you are done.",
            "Check Google separately: in Search Console, use URL Inspection, click \"Test live URL\", then \"View tested page\" to see the HTML after Google has processed it. That is Google's view, not other AI tools'.",
            "Asking an AI is a last check, not proof: pasting a URL into an assistant is quick, but its own account is unreliable. In SearchEngineWorld's test, Perplexity told the user it could not access the page while the test server logged a successful fetch (HTTP 200) ([SearchEngineWorld](" + SRC.sew + ")).",
          ],
        },
        {
          heading: "Check 3: see the real fetches in your server log",
          paragraphs: [
            "If you can read your server's access log, count which URLs AI crawlers actually requested. Most hosting control panels let you download the log.",
          ],
          code: LOG_EN,
          after: [
            "A request for a .js file after the page does not prove the script ran. In Vercel's data, ChatGPT's and Claude's crawlers fetched JavaScript files but did not execute them ([Vercel](" + SRC.vercel + ")). A log tells you whether a crawler came and what you returned, nothing more.",
          ],
        },
        {
          heading: "Where WordPress sites hide facts behind JavaScript",
          paragraphs: [
            "WordPress builds post and page content into HTML on the server (in PHP), so ordinary body text is in the initial HTML. The risk is in what plugins, widgets and third-party embeds add later. Go through this table on your own site using the checks above.",
          ],
          table: {
            head: ["Where", "What tends to happen", "Fix"],
            rows: [
              ["Tabs and accordions (e.g. FAQ toggles)", "Usually the text is in the HTML and only hidden with CSS. If the answer loads only after a click, it is not", "Search the source for the answer text. The core Details block keeps its content in the HTML"],
              ["\"Load more\", infinite scroll and filtered lists (prices, menus, listings, case studies)", "Only the first few items are in the HTML; the rest load later", "Put key prices and conditions in a table in the body as well. Make further items reachable through paginated URLs"],
              ["Embedded reviews, Instagram, Google Maps, booking widgets", "Shown by third-party scripts or iframes, so they are not part of your page's text", "Write the essentials (hours, address, booking rules) as text in the body ([booking page guide](/guide/booking-page-ai-search))"],
              ["Structured data (JSON-LD) added through Google Tag Manager", "Added by JavaScript, so it is not in the initial HTML", "Output it from the server through your theme, SEO plugin or a schema plugin"],
              ["Count-up numbers, sliders, text inside pop-ups", "Depending on the build, the initial HTML may hold \"0\" or nothing at all", "Search for the number with Check 1. If it is missing, state the same fact in the body"],
              ["Text drawn with CSS ::before/::after, text inside images (price banners)", "Hard to read as text for reasons other than JavaScript. In Writesonic's test none of six assistants read ::before/::after text", "Write prices and conditions as body text; give images descriptive alt text"],
              ["Headless WordPress (WordPress as a content store, front end in React or Next.js)", "If the front end builds pages in the browser, the initial HTML is nearly empty", "Use server-side rendering (SSR) or static generation (SSG). Vercel also advises server-side rendering for critical content"],
              ["Bot checks that require JavaScript (CDN or security plugin challenges)", "The crawler only ever sees the challenge page", "Check how AI search crawlers are treated ([how to check](/guide/agency-ai-crawler-blocking-audit))"],
            ],
          },
          after: [
            "On hidden text: in Writesonic's test, text hidden with CSS display:none was read by five of six assistants ([Writesonic](" + SRC.writesonic + ")). Toggles are not the problem in themselves; what matters is whether the answer text is in the HTML.",
          ],
        },
        {
          heading: "The order to fix things",
          list: [
            "Decide which facts you want AI to answer with: tax-inclusive prices, opening hours and closed days, service area, FAQ answers, basic company details. Five to ten per page.",
            "Use Check 1 or 2 to see whether each fact is in the initial HTML. If not, first write it into the body as text. That is the simplest fix and works for every AI tool.",
            "Make structured data and llms.txt come from the server. If you add them through a tag manager, move them to your theme or a plugin.",
            "Keep embeds and dynamic lists if you like, but add their key points to the body. Avoid serving bots different content: it lets what people see and what AI reads drift apart. Send everyone the same HTML.",
            "If the site is headless or built in the browser, ask your developer whether it can move to server-side rendering or pre-built HTML.",
            "After fixing, run Checks 1 to 3 again and log what you changed and when. Measure AI appearances again with the same questions ([how to measure AI visibility](/guide/measure-ai-visibility)).",
          ],
        },
        {
          heading: "WordPress steps with Nurevo AEO",
          paragraphs: [
            `The free [Nurevo AEO](${WP_ORG}) plugin builds structured data (JSON-LD) and llms.txt on your own server. The JSON-LD is written into the page HTML, so crawlers that never run JavaScript still get it, and the Nurevo FAQ block is rendered to HTML on the server too.`,
          ],
          list: [
            "Install the plugin and enter your business details (name, address, phone, hours, services). It fills only what is missing, and works alongside Yoast SEO, Rank Math, AIOSEO, SEO SIMPLE PACK and VK All in One Expansion Unit without duplicating structured data.",
            "Fetch a public page with Check 1 and confirm application/ld+json is present and /llms.txt opens.",
            "If you were also adding the same structured data through a tag manager, keep only one of the two.",
            "Write FAQs with the Nurevo FAQ block (or in the body) and use Check 2 to confirm the answer text is in the source.",
            "Nurevo's browser tag is off by default and is not used for AEO. You can leave it off.",
          ],
          after: [
            "Plans: Free (USD 0), Standard (USD 20/month) and Pro (from USD 99/month). Pro measures whether you appear in AI answers (currently on Perplexity, in beta). The [free check](/check) shows the state of your front page, robots.txt and llms.txt.",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "For each page you want cited, you have listed five to ten facts AI should answer with",
            "Those facts are in the page source (the initial HTML) as text",
            "Prices, hours and contact details remain when the page loads with JavaScript off",
            "Structured data (JSON-LD) is in the initial HTML, not only added through a tag manager",
            "/llms.txt opens and is up to date",
            "The key points of embedded reviews, maps, booking widgets and social feeds are also in the body",
            "Important conditions from \"load more\" lists are also in a table in the body",
            "No price or condition exists only inside an image or CSS decoration",
            "Requests with AI crawler names get the same content (no 403, no challenge page)",
            "You logged the date and changes, and scheduled a re-measurement with the same questions",
          ],
        },
      ],
      faqs: [
        { q: "Do Google AI Overviews and AI Mode read content added by JavaScript?", a: "Google says it processes JavaScript unless it is blocked. Do not expect the same from ChatGPT, Claude or Perplexity, so keep key facts in the initial HTML as well." },
        { q: "Will AI miss FAQ answers hidden in an accordion?", a: "If the answer text is in the HTML and only hidden with CSS, it can be read. If it loads only after a click, it is not there. Search the page source for the answer text to be sure." },
        { q: "Is structured data added through Google Tag Manager wasted?", a: "Google, which processes JavaScript, may read it, but crawlers that do not run JavaScript will not. Outputting it from the server through your theme or a plugin reaches both." },
        { q: "Is a WordPress site built with a page builder safe?", a: "Most page builders generate HTML on the server, so ordinary text and headings are in the initial HTML. Some widgets and embeds load later, though, so check each component with Check 1 or 2." },
        { q: "If I publish llms.txt, can I ignore the JavaScript issue?", a: "No. llms.txt helps as a guide to your site, but AI usually cites individual pages. The facts need to be in those pages' initial HTML first." },
        { q: "I pasted my URL into ChatGPT and the summary was right. Am I fine?", a: "One success does not mean other pages or other days will behave the same. Assistants' own accounts have contradicted server logs, so the page source and access log are the reliable checks." },
        { q: "If my facts are in the initial HTML, will I appear in AI answers?", a: "That cannot be guaranteed. It only meets the precondition for being read; AI answers change with the day, the wording and what other sites say. Measure again with the same questions after fixing." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Check what AI can see on your site",
        body: "The free check needs no sign-up: enter a URL to see the state of its structured data, llms.txt and AI crawler access. On WordPress, the free plugin outputs structured data and llms.txt from your server.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "Try the free plugin", href: WP_ORG },
      },
      footnote: "ChatGPT, GPTBot and OAI-SearchBot are trademarks of OpenAI; Claude of Anthropic; Perplexity of Perplexity AI; Google, Gemini and Chrome of Google LLC; Microsoft Copilot of Microsoft; Grok of xAI; Vercel and Next.js of Vercel, Inc.; Cloudflare of Cloudflare, Inc. WordPress is a trademark of the WordPress Foundation. Other product names are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by these companies.",
    },
  },
};
