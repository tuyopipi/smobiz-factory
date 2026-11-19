// Content page: how the Gemini app and Claude read websites and show them as
// sources, and how a site owner can check - Google-Extended (training AND
// grounding in Gemini Apps, no own user agent, no effect on Search), Claude's
// three bots (ClaudeBot / Claude-SearchBot / Claude-User), robots.txt
// patterns by goal, what is and is not published about source selection,
// claims in top articles and their evidence, WordPress steps with Nurevo AEO,
// and a manual way to record results.
//
// Written 2026-11-19 (JST). Product facts come from the plugin:
// - readme.txt (0.9.2): AI crawler rules allow OAI-SearchBot, ChatGPT-User,
//   Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User in the
//   virtual robots.txt; existing rules such as /wp-admin/ keep applying.
//   Training crawlers (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended,
//   CCBot) are left to the site's robots.txt by default; one-click allow or
//   block. nurevo-webmcp.php: webmcp_canary_robots_search_agents /
//   webmcp_canary_robots_training_agents lists.
// - Free AI check and Pro AI visibility measure Perplexity (ChatGPT once
//   configured). Gemini and Claude are NOT measured - stated in the text.
//
// Outside facts and where they were read (2026-11-19):
// - Google common crawlers page (last updated 2026-10-30 UTC): Google-Extended
//   is a robots.txt product token with no separate HTTP user agent; it manages
//   whether crawled content may be used to train future Gemini models that
//   power Gemini Apps and the Vertex AI API, and for grounding in Gemini Apps
//   and Grounding with Google Search on Vertex AI; does not affect inclusion
//   or ranking in Google Search; Google intends to support the AIPREF shared
//   training preference signal (user-agent: __usage_ai-training) in early 2027.
// - Anthropic help 8896518 ("updated over 2 weeks ago" on 2026-11-19): three
//   bots; ClaudeBot = training; Claude-User = fetch for user questions,
//   blocking may reduce visibility for user-directed web search;
//   Claude-SearchBot = indexing for search quality; robots.txt honored,
//   Crawl-delay supported, CAPTCHAs not bypassed, IP blocking may not
//   guarantee opt-out, IP list at claude.com/crawling/bots.json; as of
//   2026-10-30 recognizes a machine-readable no-AI-training signal (IETF
//   aipref draft), robots.txt naming ClaudeBot takes precedence.
// - Claude help 10684626: every web-search response includes citations;
//   "new Claude experience" has no toggle; image search powered by Bing.
//   Web search provider not named.
// - Claude API web search tool docs: citations always enabled for web search.
// - TechCrunch 2025-03-21: Brave Search added to Anthropic's subprocessor
//   list; Anthropic had not responded at publication.
// - Gemini Apps Help 14143489: Sources button; not all responses include
//   related links or sources. Help 16279220: may be inaccurate, double-check.
// - Top articles read: jinrai (2026-03-24, upd 2026-11-18), koukoku.jp GMO
//   (2026-09-02, upd 2026-11-16), crystal-method (2026-09-22, upd 2026-10-26),
//   SEOmator de (2026-10-31, upd 2026-11-11) / Moburst (upd 2026-11-12),
//   Lilach Bullock (upd 2026-11-12), Saffron Edge (2026-09-10), TripleDart
//   (upd 2026-10-27), Nex.ad (2026-01-06), Marie Haynes (2025-05-07).
// Not stated on purpose: market shares, traffic shares, crawl-to-refer
// ratios, "time to citation", scoring weights, which index Claude uses.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const SRC = {
  googleCrawlers: "https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers?hl=en",
  anthropicBots: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
  anthropicBotsJa: "https://support.claude.com/ja/articles/8896518",
  anthropicIps: "https://claude.com/crawling/bots.json",
  claudeWebSearch: "https://support.claude.com/en/articles/10684626-enabling-and-using-web-search",
  claudeApiSearch: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool",
  techcrunchBrave: "https://techcrunch.com/2025/03/21/anthropic-appears-to-be-using-brave-to-power-web-searches-for-its-claude-chatbot/",
  geminiSources: "https://support.google.com/gemini/answer/14143489?hl=en",
  geminiResponses: "https://support.google.com/gemini/answer/16279220?hl=en",
};

const ROBOTS_JA = `# 例：Claude の検索と回答には読ませ、学習用の ClaudeBot だけ止める
User-agent: Claude-SearchBot
Allow: /
Disallow: /wp-admin/

User-agent: Claude-User
Allow: /
Disallow: /wp-admin/

User-agent: ClaudeBot
Disallow: /

# Google-Extended は書かない（＝止めない）。
# Disallow にすると、Gemini の学習だけでなく
# Gemini アプリのグラウンディングにも使われなくなる（Googleの説明）。`;

const ROBOTS_EN = `# Example: let Claude search and answer from your pages, block only ClaudeBot (training)
User-agent: Claude-SearchBot
Allow: /
Disallow: /wp-admin/

User-agent: Claude-User
Allow: /
Disallow: /wp-admin/

User-agent: ClaudeBot
Disallow: /

# No Google-Extended group (= not blocked).
# Disallowing it stops use for Gemini training AND for grounding
# in Gemini Apps, according to Google.`;

const CURL_JA = `# 1) robots.txt の中身（Claude の3つと Google-Extended の行）
curl -s https://example.jp/robots.txt | grep -i -E -A3 "claude|google-extended"

# 2) Claude-SearchBot を名乗ったアクセスが 200 で返るか（403・503・確認画面は要注意）
curl -s -o /dev/null -w "%{http_code}\\n" -A "Claude-SearchBot" https://example.jp/

# 3) アクセスログで実際に来ているか（ログの場所はサーバーによって違う）
grep -E "ClaudeBot|Claude-SearchBot|Claude-User" access.log | tail -20
# Google-Extended は専用のユーザーエージェントがないので、ログには出ない`;

const CURL_EN = `# 1) What robots.txt says for Claude's three bots and Google-Extended
curl -s https://example.com/robots.txt | grep -i -E -A3 "claude|google-extended"

# 2) Does a request with the Claude-SearchBot user agent get a 200? (403, 503 or a challenge page is a problem)
curl -s -o /dev/null -w "%{http_code}\\n" -A "Claude-SearchBot" https://example.com/

# 3) Are they actually visiting? (the log location depends on your server)
grep -E "ClaudeBot|Claude-SearchBot|Claude-User" access.log | tail -20
# Google-Extended has no user agent of its own, so it never appears in logs`;

const FOOT_JA = "Gemini、Google、Google 検索、Vertex AIはGoogle LLC、ClaudeはAnthropic, PBC、ChatGPTはOpenAI、PerplexityはPerplexity AI、BraveはBrave Software, Inc.、BingはMicrosoft Corporationの商標です。WordPress、Yoast SEO、Rank Math、All in One SEO、SEO SIMPLE PACKはそれぞれの権利者の商標または登録商標です。Nurevoはこれらの企業と提携・協賛関係にありません。";
const FOOT_EN = "Gemini, Google, Google Search and Vertex AI are trademarks of Google LLC, Claude of Anthropic, PBC, ChatGPT of OpenAI, Perplexity of Perplexity AI, Brave of Brave Software, Inc. and Bing of Microsoft Corporation. WordPress, Yoast SEO, Rank Math, All in One SEO and SEO SIMPLE PACK are trademarks or registered trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.";

export default {
  slug: "gemini-claude-citations",
  targetQueries: [
    "how to get cited by Gemini and Claude",
    "Google-Extended Gemini grounding robots.txt",
    "Claude-SearchBot Claude-User ClaudeBot robots.txt",
    "Gemini 自社 表示される 方法",
    "Claude 引用される 方法 Claude-SearchBot",
    "Google-Extended ブロック 影響",
  ],
  related: ["perplexity-citations", "google-ai-overviews-citations", "appear-in-chatgpt", "measure-ai-visibility", "llms-txt"],
  locales: {
    ja: {
      title: "GeminiとClaudeに自社サイトが出る仕組みと確かめ方 | Nurevo",
      description: "Geminiアプリの出典を左右するGoogle-Extendedと、Claudeの3つのクローラーの違い、目的別のrobots.txt、公式に分かっていること・いないこと、WordPressの手順と記録の仕方。",
      h1: "GeminiアプリとClaudeに自社サイトが出典として出る仕組みと、出ているかの確かめ方",
      lead: "Geminiアプリは、Googleがクロールしたページを回答の根拠（グラウンディング）に使うことがあり、それを許すかどうかは robots.txt の「Google-Extended」で決まります。Claudeは、検索用のClaude-SearchBotと、質問に応じてページを読むClaude-Userでサイトを読み、学習用のClaudeBotとは別に止めたり通したりできます。サイト側でできるのは、①この4つの名前を目的どおりに設定し、②答えと事実を本文の文字で書き、③社名を入れない質問で出典に出ているかを記録することです。どのページを出典に選ぶかの基準は、GoogleもAnthropicも公開していません。",
      intro: [
        "作成日：2026年11月19日（JST）。GoogleのAIによる概要・AIモードは[AIによる概要に出典として出る条件](/guide/google-ai-overviews-citations)、Perplexityは[Perplexityに引用される仕組み](/guide/perplexity-citations)、ChatGPTは[ChatGPTに載る方法](/guide/appear-in-chatgpt)で扱いました。この記事は、残る2つ、GeminiアプリとClaudeに絞って、公式の資料で確かめられることと、サイト側の手順を書きます。",
        "AIの回答は日・聞き方・プランによって変わります。この記事の手順は、GeminiとClaudeがサイトを読める状態にし、出典に出ているかを正しく記録するためのもので、回答に出ることや順位を保証するものではありません。",
      ],
      sections: [
        {
          heading: "まず分ける：Geminiアプリ・Google検索のAI機能・Claude",
          paragraphs: [
            "上位の記事には「GeminiとAIによる概要は基本的に同じ」と書くものがありますが、サイト側の設定ではこの2つは別物です。Google検索のAIによる概要・AIモードは検索の一部で、Googlebotがページを読めて検索結果に出せれば対象になります。一方、Geminiアプリ（gemini.google.com やスマートフォンのGemini）でGoogleがクロールしたページを回答の根拠に使ってよいかは、Google-Extended という別の名前で管理されています。",
          ],
          table: {
            head: ["", "Google検索のAIによる概要・AIモード", "Geminiアプリ", "Claude"],
            rows: [
              ["ページを読むもの", "Googlebot", "Googlebot（専用のクローラーはない）", "Claude-SearchBot・Claude-User"],
              ["サイト側で管理する名前", "Googlebot・noindex・nosnippet など", "Google-Extended（robots.txt の名前だけ）", "Claude-SearchBot・Claude-User（学習は ClaudeBot）"],
              ["止めたときの影響", "検索結果そのものからも外れる", "Geminiの学習とGeminiアプリのグラウンディングに使われなくなる。Google検索には影響しない", "Claudeの検索結果・回答で出にくくなる、とAnthropicが説明"],
              ["出典の見え方", "回答の横や下にリンク", "「ソース」ボタンや本文中のリンク。付かない回答もある", "ウェブ検索を使った回答には出典が付く"],
            ],
          },
          after: [
            `Google-Extended の説明は[Googleのクローラー一覧（2026-10-30更新）](${SRC.googleCrawlers})、Claudeのクローラーは[Anthropicのヘルプ](${SRC.anthropicBots})（[日本語版](${SRC.anthropicBotsJa})）にあります。`,
          ],
        },
        {
          heading: "公式に分かっていること・分かっていないこと",
          table: {
            head: ["項目", "公式の資料にあるか", "内容"],
            rows: [
              ["Google-Extended が管理するもの", "ある", "Googleがクロールした内容を、Geminiアプリなどを動かす将来のGeminiモデルの学習と、GeminiアプリやVertex AIでのグラウンディング（回答時に検索インデックスの内容をモデルに渡すこと）に使ってよいか"],
              ["Google-Extended とGoogle検索", "ある", "Google検索への掲載にも順位にも影響しない、と明記"],
              ["Google-Extended のアクセス", "ある", "専用のユーザーエージェントはなく、既存のGoogleのクローラーで読む。robots.txt の名前としてだけ働く"],
              ["Claudeの3つのクローラー", "ある", "ClaudeBot（学習）・Claude-SearchBot（検索の品質のための索引）・Claude-User（ユーザーの質問に応じた取得）"],
              ["Claudeのクローラーと robots.txt", "ある", "3つとも robots.txt に従い、Crawl-delay にも対応、CAPTCHAは回避しない。IPアドレスで止める方法は確実ではないとしつつ、IPの一覧を公開"],
              ["Claudeのウェブ検索が使う検索エンジン", "ない", `ヘルプには「画像検索はBing」とだけあり、ウェブ検索の提供元は書かれていません。2025年3月に、AnthropicがBrave Searchを委託先の一覧に加えたと報じられましたが、記事の公開時点でAnthropicは回答していません（[TechCrunch、2025-03-21](${SRC.techcrunchBrave})）`],
              ["出典を選ぶ基準・件数・順番", "ない", "GoogleもAnthropicも公開していません"],
            ],
          },
          after: [
            "Perplexityの Perplexity-User は「robots.txt を一般に無視する」と説明されていますが、Claude-User はAnthropicの説明では robots.txt に従います。同じ「質問に応じて読むクローラー」でも扱いが違うので、Perplexityの設定をそのまま当てはめないでください。",
          ],
        },
        {
          heading: "上位の記事でよく見る主張と、根拠の強さ",
          paragraphs: [
            "「Gemini 自社 表示される 方法」「Claude 引用される」「how to get cited by Claude」などで上位の日本語4本・英語6本を読みました。「答えを先に書く」「会社情報をそろえる」は共通していますが、GeminiアプリとAIによる概要を分けた記事はほぼなく、Claudeの3つのクローラーをAnthropicの資料に沿って説明した記事も、WordPressでの手順を書いた記事もありませんでした。",
          ],
          table: {
            head: ["よく見る主張", "根拠の強さ", "この記事での扱い"],
            rows: [
              ["「GeminiとAIによる概要は同じ対策でよい」", "設定の面では違う。Geminiアプリには Google-Extended が関わる", "分けて書く"],
              ["「Google-Extended を止めてもAI検索には影響しない」", "Google検索（AIによる概要を含む）には影響しない。Geminiアプリのグラウンディングには影響する", "目的に合わせて選ぶ"],
              ["「ClaudeはBrave Searchを使っている」", "2025年3月の報道と委託先の一覧が根拠。Anthropicのヘルプには書かれていない", "断定しない"],
              ["「ClaudeBotを許可すれば引用される」", "ClaudeBot は学習用。検索と回答は Claude-SearchBot と Claude-User", "検索用の2つを確かめる"],
              ["Claudeのシェア・引用率・反映までの日数", "多くは書いた会社自身の集計で、方法が十分に書かれていない", "使わない"],
            ],
          },
        },
        {
          heading: "目的別の robots.txt：検索には出たい・学習は止めたい",
          paragraphs: [
            "いちばん多い希望は「AIの検索や回答には出たいが、学習には使われたくない」です。Claudeについては名前が分かれているので、Claude-SearchBot と Claude-User を通し、ClaudeBot だけを止められます。個別のグループを作るときは、サイト全体の決まり（例：/wp-admin/ を読ませない）もそのグループの中に書き直します。クローラーは自分の名前のグループがあると、そのグループだけを見るためです。",
          ],
          code: ROBOTS_JA,
          after: [
            "Geminiは事情が違います。Google-Extended は学習とGeminiアプリのグラウンディングをまとめて管理するため、「学習だけ止めて、Geminiアプリの出典には出る」という設定は、Googleの説明の範囲ではできません。Geminiアプリに出典として出たいなら、Google-Extended は止めない、が答えです。なお、Googleは2027年の初めに、学習の可否を伝える共通の仕組み（AIPREF、「user-agent: __usage_ai-training」）に対応する予定としています。",
            "Anthropicも2026年10月30日から、学習を望まないことを伝える機械可読の信号（IETFの aipref の草案）を認識し始めた、としています。ただし robots.txt で ClaudeBot を名指ししていれば、そちらが優先されます。設定が食い違わないよう、どちらか一方で意図をはっきり書いてください。",
          ],
        },
        {
          heading: "出典に選ばれやすくするために、ページ側でできること",
          paragraphs: [
            "読める状態にしても、質問への答えがページになければ出典にはなりません。GeminiもClaudeも基準は公開していないため、次はAI全般に共通する手入れです。詳しくは[AIに引用される記事の書き方](/guide/blog-articles-ai-citations)と[llms.txtの書き方](/guide/llms-txt)にまとめています。",
          ],
          list: [
            "質問に対する答えを、見出しのすぐ下の1〜2文で書く（料金・営業時間・対応エリア・対象など）",
            "数字には日付を付け、他社の数字には出典を付ける",
            "社名・住所・電話番号を、自社サイトとGoogleビジネスプロフィールなど外部の掲載でそろえる",
            "画像やPDFの中だけにある事実を、本文の文字でも書く",
            "構造化データは本文と同じ内容にする（本文にないことを書かない）",
          ],
        },
        {
          heading: "WordPressでの手順（Nurevo AEO の場合）",
          paragraphs: [
            "Nurevo AEO（無料のWordPressプラグイン）は、WordPressの仮想 robots.txt に、AI検索で使われるクローラー（ChatGPTの OAI-SearchBot・ChatGPT-User、Claudeの Claude-SearchBot・Claude-User、Perplexityの PerplexityBot・Perplexity-User）を許可する行を足します。サイトの既存の決まり（/wp-admin/ など）は、これらのグループにも書き写されます。",
            "学習用のクローラー（GPTBot・ClaudeBot・Google-Extended・Applebot-Extended・CCBot）は、初期設定ではサイトの robots.txt に任せ、ワンクリックで許可・ブロックを選べます。ここで「ブロック」を選ぶと Google-Extended も止まります。Googleの説明では、その場合Geminiアプリのグラウンディングにも使われなくなるので、Geminiアプリに出典として出たいサイトは、学習用をまとめてブロックする前に考えてください。ClaudeBot だけを止めたい場合は、上の例のように自分で robots.txt に書きます。",
          ],
          list: [
            "管理画面の Nurevo AIO → 設定で「AI検索のクローラー（ChatGPT検索・Claude・Perplexity）を仮想robots.txtで許可する」が有効か確かめる",
            "学習用クローラーの選択肢を、Geminiアプリへの影響を踏まえて選ぶ",
            "サーバーに robots.txt の実ファイルがあると仮想 robots.txt より優先されるので、実ファイルがないか確かめる",
            "SEOプラグインやセキュリティプラグイン、レンタルサーバーのWAF・海外アクセス制限がクローラーを止めていないか確かめる",
            "下のコマンドで、robots.txt の中身とアクセスの応答を確かめる",
          ],
          code: CURL_JA,
          after: [
            `ログに来たアクセスが本当にAnthropicのものかは、[公開されているIPの一覧](${SRC.anthropicIps})と照らし合わせます。Google-Extended はログに出ないので、robots.txt の中身で確かめるしかありません。`,
          ],
        },
        {
          heading: "出典に出ているかの確かめ方",
          paragraphs: [
            `Geminiアプリでは、出典があると回答の下や本文中に「ソース」ボタンが出ます。ただしGoogleは「すべての回答に関連リンクやソースが付くわけではない」としています（[Geminiアプリのヘルプ](${SRC.geminiSources})）。ボタンがなければ、その回答ではリンクを示していないということです。Googleは、Geminiが不正確な内容を事実のように示すことがあるとも書いています（[回答についてのヘルプ](${SRC.geminiResponses})）。`,
            `Claudeは、ウェブ検索を使った回答には出典が付きます（[Claudeのヘルプ](${SRC.claudeWebSearch})、API でも[ウェブ検索では出典が常に有効](${SRC.claudeApiSearch})）。新しい画面ではウェブ検索の切り替えがなく、必要なときにClaudeが検索します。検索しなかった回答には出典が付かないので、「出典がない＝読まれていない」とは限りません。`,
          ],
          table: {
            head: ["記録すること", "理由"],
            rows: [
              ["社名を入れない質問（例：「◯◯市で土曜に診てくれる歯科は？」）を5〜20個決める", "社名で聞くと出るのは当たり前で、比べられない"],
              ["日付・アプリ（Gemini／Claude）・プラン・ログイン状態・モデル", "条件が変わると回答も変わる"],
              ["回答に社名が出たか、出典に自社のURLがあったか", "名前が出ることと、出典に選ばれることは別"],
              ["同じ質問を2〜3回聞く", "1回の結果は偶然のことがある"],
              ["設定を変えた日", "変える前と後を比べるため"],
            ],
          },
          after: [
            "Nurevoの無料AIチェックとProのAI登場率は、現在 Perplexity で測っています（ChatGPTは設定され次第）。GeminiとClaudeは測っていないので、上の表のように手で記録してください。測り方の全体は[AIでの登場率の測り方](/guide/measure-ai-visibility)にあります。",
          ],
        },
        {
          heading: "チェックリスト",
          list: [
            "GeminiアプリとGoogle検索のAI機能を分けて考えている",
            "Google-Extended を止めるかどうかを、Geminiアプリへの影響を踏まえて決めた",
            "Claude-SearchBot と Claude-User を robots.txt で止めていない",
            "ClaudeBot（学習）の扱いを、検索用の2つとは別に決めた",
            "個別のグループにも /wp-admin/ などの決まりを書き写した",
            "WAF・セキュリティプラグインがClaudeのクローラーに 403 を返していない",
            "質問への答えと事実が本文の文字にある",
            "社名を入れない質問を決め、同じ条件で繰り返し記録している",
          ],
        },
      ],
      faqs: [
        { q: "Google-Extended を止めると、Google検索やAIによる概要から消えますか？", a: "Googleは、Google-Extended はGoogle検索への掲載にも順位にも影響しないとしています。影響するのはGeminiモデルの学習と、GeminiアプリやVertex AIでのグラウンディングです。" },
        { q: "Geminiの学習だけを止めて、Geminiアプリの出典には出られますか？", a: "Googleの説明では、Google-Extended は学習とグラウンディングをまとめて管理しているため、その2つを分ける設定はありません。Googleは2027年の初めに共通の学習拒否の信号（AIPREF）に対応する予定としていますが、その後の扱いは公開を待つ必要があります。" },
        { q: "ClaudeBot を止めると、Claudeの回答に出なくなりますか？", a: "Anthropicの説明では、ClaudeBot は学習用で、検索と回答は Claude-SearchBot と Claude-User です。この2つを止めていなければ、ClaudeBot を止めても検索や回答のための読み込みは続きます。" },
        { q: "Claudeはどの検索エンジンの結果を使っていますか？", a: "Anthropicのヘルプには、画像検索はBingとありますが、ウェブ検索の提供元は書かれていません。2025年3月にBrave Searchが委託先の一覧に加わったと報じられましたが、仕組みとして公表されたものではありません。" },
        { q: "アクセスログに Google-Extended が出てきません。設定が効いていないのですか？", a: "Google-Extended には専用のユーザーエージェントがなく、既存のGoogleのクローラーで読むため、ログには出ません。効いているかは robots.txt の中身で確かめます。" },
        { q: "robots.txt を変えたら、すぐにGeminiやClaudeの回答に反映されますか？", a: "反映までの時間は、どちらも公開していません。設定を変えた日を記録し、数日あけて同じ条件で確かめてください。出典に出るかは、設定とは別にAIが決めます。" },
        { q: "GeminiやClaudeが自社について間違ったことを言います。どうすればいいですか？", a: "出典が示されていればそこをたどり、自社サイトの古い記述を直し、外部の掲載には更新を依頼します。AIの回答を直接書き換える方法はなく、直るまでの期間も決まっていません。" },
      ],
      relatedHeading: "関連ガイド",
      cta: {
        heading: "AIが自社サイトを読めるか確かめる",
        body: "無料チェックは登録不要です。URLを入れると、AIクローラーの許可、構造化データ、llms.txtの状態が分かります。WordPressなら無料のプラグインで、Claude-SearchBot と Claude-User を許可する設定と、学習用クローラーの選択、事業の事実の構造化データをまとめて整えられます。",
        label: "AI対応を無料でチェック",
        href: "/check",
        secondary: { label: "無料のWordPressプラグインを入れてみる", href: WP_ORG },
      },
      footnote: FOOT_JA,
    },
    en: {
      title: "How Gemini and Claude Cite Websites, and How to Check | Nurevo",
      description: "Google-Extended and Gemini app grounding, Claude's three crawlers, robots.txt by goal, what is and isn't published, WordPress steps and how to record citations.",
      h1: "How the Gemini app and Claude pick up your website as a source, and how to check",
      lead: "The Gemini app can ground its answers in pages Google has crawled, and whether yours may be used that way is controlled by the Google-Extended token in robots.txt. Claude reads sites with Claude-SearchBot (search indexing) and Claude-User (fetching pages for a user's question), which you can allow or block separately from ClaudeBot, its training crawler. What you can do on your side: set these four names to match your goals, put answers and facts in the page text, and record whether you appear as a source for unbranded questions. Neither Google nor Anthropic publishes how sources are chosen.",
      intro: [
        "Written November 19, 2026 (JST). We covered Google's AI Overviews and AI Mode in [getting cited in AI Overviews](/guide/google-ai-overviews-citations), Perplexity in [how Perplexity cites websites](/guide/perplexity-citations) and ChatGPT in [how to appear in ChatGPT](/guide/appear-in-chatgpt). This guide covers the remaining two, the Gemini app and Claude: what their official documentation says and what to do on your site.",
        "AI answers vary by day, wording and plan. These steps make sure Gemini and Claude can read your site and that you record citations correctly; they do not guarantee that you will appear in answers or rank anywhere.",
      ],
      sections: [
        {
          heading: "Separate them first: the Gemini app, Google Search AI features and Claude",
          paragraphs: [
            "Some top articles say the Gemini app and AI Overviews are \"basically the same\". In terms of site settings they are not. AI Overviews and AI Mode are part of Google Search: if Googlebot can read a page and show it in results, it is eligible. Whether pages Google has crawled may be used to ground answers in the Gemini app (gemini.google.com or the mobile app) is managed by a separate name, Google-Extended.",
          ],
          table: {
            head: ["", "Google Search AI Overviews / AI Mode", "Gemini app", "Claude"],
            rows: [
              ["What reads the page", "Googlebot", "Googlebot (no separate crawler)", "Claude-SearchBot, Claude-User"],
              ["Names you control", "Googlebot, noindex, nosnippet, etc.", "Google-Extended (a robots.txt token only)", "Claude-SearchBot, Claude-User (training: ClaudeBot)"],
              ["Effect of blocking", "You drop out of Search results too", "Not used for Gemini training or grounding in the Gemini app; no effect on Google Search", "Anthropic says it may reduce your visibility in Claude's search results and answers"],
              ["How sources show", "Links beside or below the answer", "A Sources button or inline links; some answers have none", "Answers that use web search include citations"],
            ],
          },
          after: [
            `Google-Extended is described in [Google's list of common crawlers (updated 2026-10-30)](${SRC.googleCrawlers}); Claude's crawlers in [Anthropic's help article](${SRC.anthropicBots}).`,
          ],
        },
        {
          heading: "What is documented and what is not",
          table: {
            head: ["Topic", "In official docs?", "What it says"],
            rows: [
              ["What Google-Extended controls", "Yes", "Whether content Google crawls may be used to train future Gemini models that power the Gemini app and others, and for grounding (passing Search index content to the model at prompt time) in the Gemini app and Vertex AI"],
              ["Google-Extended and Google Search", "Yes", "Stated to have no effect on inclusion or ranking in Google Search"],
              ["How Google-Extended fetches", "Yes", "No separate user agent; existing Google crawlers fetch pages and the token works only in robots.txt"],
              ["Claude's three crawlers", "Yes", "ClaudeBot (training), Claude-SearchBot (indexing for search quality), Claude-User (fetching for user questions)"],
              ["Claude's crawlers and robots.txt", "Yes", "All three honor robots.txt, support Crawl-delay and do not bypass CAPTCHAs. IP blocking is said not to guarantee an opt-out, but an IP list is published"],
              ["Which search engine Claude's web search uses", "No", `The help page says only that image search is powered by Bing; the web search provider is not named. In March 2025 Anthropic was reported to have added Brave Search to its subprocessor list; Anthropic had not responded when the story ran ([TechCrunch, 2025-03-21](${SRC.techcrunchBrave}))`],
              ["How sources are chosen, how many, in what order", "No", "Neither Google nor Anthropic publishes this"],
            ],
          },
          after: [
            "Perplexity says Perplexity-User generally ignores robots.txt, but Anthropic says Claude-User follows it. Both fetch pages for user questions, yet they behave differently, so don't copy your Perplexity settings across unchanged.",
          ],
        },
        {
          heading: "Claims you will see in top articles, and how strong the evidence is",
          paragraphs: [
            "We read four Japanese and six English articles that rank for queries such as \"how to get cited by Claude\" and \"Gemini 自社 表示される\". They agree on answering first and keeping business details consistent. Almost none separate the Gemini app from AI Overviews, none explain Claude's three crawlers from Anthropic's own documentation together with WordPress steps.",
          ],
          table: {
            head: ["Common claim", "Strength of evidence", "How this guide treats it"],
            rows: [
              ["\"Gemini and AI Overviews need the same work\"", "Different in settings: Google-Extended affects the Gemini app", "Treated separately"],
              ["\"Blocking Google-Extended doesn't affect AI search\"", "True for Google Search, including AI Overviews; not for grounding in the Gemini app", "Choose by goal"],
              ["\"Claude uses Brave Search\"", "Based on a 2025 report and a subprocessor list, not on Anthropic's help pages", "Not stated as fact"],
              ["\"Allow ClaudeBot to get cited\"", "ClaudeBot is for training; search and answers use Claude-SearchBot and Claude-User", "Check the two search crawlers"],
              ["Claude market shares, citation rates, days to citation", "Mostly the authors' own data with limited method", "Not used"],
            ],
          },
        },
        {
          heading: "robots.txt by goal: appear in AI search, opt out of training",
          paragraphs: [
            "The most common goal is \"appear in AI search and answers, but don't train on my content\". For Claude the names are split, so you can allow Claude-SearchBot and Claude-User and block only ClaudeBot. When you create a group for a named crawler, repeat your site-wide rules (for example, keeping /wp-admin/ out) inside it, because a crawler with its own group reads only that group.",
          ],
          code: ROBOTS_EN,
          after: [
            "Gemini is different. Google-Extended covers both training and grounding in the Gemini app, so, as far as Google's documentation goes, you cannot opt out of training while staying available as a source in the Gemini app. If you want to be a source in the Gemini app, leave Google-Extended unblocked. Google also says it intends to support the shared AIPREF training preference signal (user-agent: __usage_ai-training) in early 2027.",
            "Anthropic says that as of October 30, 2026 it has begun recognizing a machine-readable no-AI-training signal based on an IETF aipref draft, but a robots.txt rule that names ClaudeBot takes precedence. State your intent clearly in one place so the two don't conflict.",
          ],
        },
        {
          heading: "What you can do on the page",
          paragraphs: [
            "Being readable is not enough if the page doesn't answer the question. Neither Gemini nor Claude publishes its criteria, so these are general practices for any AI. See [writing articles AI can cite](/guide/blog-articles-ai-citations) and the [llms.txt guide](/guide/llms-txt) for detail.",
          ],
          list: [
            "Answer the question in the first one or two sentences under each heading (prices, hours, service area, who it is for)",
            "Date your numbers and cite other people's numbers",
            "Keep name, address and phone the same on your site and outside listings such as Google Business Profile",
            "Put facts that only appear in images or PDFs into the page text as well",
            "Keep structured data identical to the visible text",
          ],
        },
        {
          heading: "WordPress steps (with Nurevo AEO)",
          paragraphs: [
            "Nurevo AEO, a free WordPress plugin, adds lines to WordPress's virtual robots.txt that allow the crawlers AI search uses: OAI-SearchBot and ChatGPT-User (ChatGPT), Claude-SearchBot and Claude-User (Claude), and PerplexityBot and Perplexity-User (Perplexity). Your existing rules, such as /wp-admin/, are repeated in those groups.",
            "Training crawlers (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot) are left to your robots.txt by default, with a one-click allow or block. Choosing block also blocks Google-Extended, which according to Google means your pages are no longer used for grounding in the Gemini app. If you want to be a Gemini app source, think before blocking all training crawlers. To block only ClaudeBot, write it in robots.txt yourself as in the example above.",
          ],
          list: [
            "In the admin menu, go to Nurevo AIO → Settings and check that \"Allow AI search crawlers (ChatGPT search, Claude, Perplexity) in the virtual robots.txt file\" is on",
            "Pick the training crawler option with the Gemini app in mind",
            "A physical robots.txt file on the server overrides the virtual one, so check there isn't one",
            "Check that SEO or security plugins, and your host's WAF or country blocking, don't block the crawlers",
            "Use the commands below to check robots.txt and the response code",
          ],
          code: CURL_EN,
          after: [
            `To confirm a visit really came from Anthropic, compare its IP with the [published list](${SRC.anthropicIps}). Google-Extended never appears in logs, so robots.txt is the only place to check it.`,
          ],
        },
        {
          heading: "How to check whether you appear as a source",
          paragraphs: [
            `In the Gemini app, a Sources button appears below the answer or inline when sources exist, but Google says \"not all responses include related links or sources\" ([Gemini Apps Help](${SRC.geminiSources})). No button means that answer gave no links. Google also says Gemini can present inaccurate information as fact ([about Gemini responses](${SRC.geminiResponses})).`,
            `In Claude, answers that use web search include citations ([Claude Help](${SRC.claudeWebSearch}); in the API, [citations are always enabled for web search](${SRC.claudeApiSearch})). In the new Claude experience there is no web search toggle; Claude searches when it helps. An answer without search has no citations, so \"no citation\" does not mean your site wasn't read.`,
          ],
          table: {
            head: ["What to record", "Why"],
            rows: [
              ["5 to 20 unbranded questions (e.g. \"Which dentist in [city] is open on Saturdays?\")", "With your name in the question, appearing proves nothing"],
              ["Date, app (Gemini or Claude), plan, signed-in state, model", "Answers change when conditions change"],
              ["Whether your name appeared, and whether your URL was among the sources", "Being named and being cited are different"],
              ["Ask each question 2 or 3 times", "One result can be chance"],
              ["The date you changed settings", "To compare before and after"],
            ],
          },
          after: [
            "Nurevo's free AI check and Pro AI visibility currently measure Perplexity (ChatGPT once configured). They do not measure Gemini or Claude, so record those by hand as above. See [measuring AI visibility](/guide/measure-ai-visibility) for the full method.",
          ],
        },
        {
          heading: "Checklist",
          list: [
            "You treat the Gemini app and Google Search AI features separately",
            "You decided on Google-Extended knowing its effect on the Gemini app",
            "robots.txt doesn't block Claude-SearchBot or Claude-User",
            "You decided on ClaudeBot (training) separately from the two search crawlers",
            "Named groups repeat rules such as /wp-admin/",
            "Your WAF or security plugin doesn't return 403 to Claude's crawlers",
            "Answers and facts are in the page text",
            "You have fixed unbranded questions and record them under the same conditions",
          ],
        },
      ],
      faqs: [
        { q: "If I block Google-Extended, will I disappear from Google Search or AI Overviews?", a: "Google says Google-Extended does not affect inclusion or ranking in Google Search. It affects Gemini model training and grounding in the Gemini app and Vertex AI." },
        { q: "Can I opt out of Gemini training but still be a source in the Gemini app?", a: "According to Google's documentation, Google-Extended covers training and grounding together, so there is no setting that separates them. Google plans to support the shared AIPREF training signal in early 2027; how that changes things has yet to be published." },
        { q: "If I block ClaudeBot, will I drop out of Claude's answers?", a: "Anthropic says ClaudeBot is for training, while search and answers use Claude-SearchBot and Claude-User. If those two are allowed, blocking ClaudeBot does not stop reading for search and answers." },
        { q: "Which search engine does Claude use?", a: "Anthropic's help page says image search is powered by Bing but does not name the web search provider. Brave Search was reported to be on Anthropic's subprocessor list in March 2025, but this has not been published as how the system works." },
        { q: "Google-Extended never shows up in my access logs. Is my setting broken?", a: "Google-Extended has no user agent of its own; existing Google crawlers fetch pages, so it never appears in logs. Check the setting by reading your robots.txt." },
        { q: "Do robots.txt changes show up in Gemini or Claude answers immediately?", a: "Neither publishes how long changes take. Note the date of the change and check a few days later under the same conditions. Whether you are cited is decided by the AI, separately from your settings." },
        { q: "Gemini or Claude says something wrong about us. What can we do?", a: "If sources are shown, trace them. Fix outdated text on your site and ask other publishers to update theirs. You cannot edit AI answers directly, and there is no set time for corrections to show." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See whether AI can read your site",
        body: "The free check needs no sign-up: enter a URL to see AI crawler access, structured data and llms.txt. On WordPress, the free plugin allows Claude-SearchBot and Claude-User, lets you choose how to handle training crawlers and publishes your business facts as structured data in one place.",
        label: "Check your AI readiness for free",
        href: "/check",
        secondary: { label: "Try the free WordPress plugin", href: WP_ORG },
      },
      footnote: FOOT_EN,
    },
  },
};
