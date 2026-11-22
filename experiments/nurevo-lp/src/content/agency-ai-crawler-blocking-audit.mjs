// Content page: for web agencies / WordPress care companies - how to check
// whether a client's CDN (Cloudflare), host firewall or security plugin is
// refusing the crawlers that AI search uses, even when robots.txt allows them;
// the 2026 Cloudflare changes (Search / Agent / Training), a layer-by-layer
// check with curl and logs, how to explain the choice to the client, and what
// to add to a maintenance contract.
//
// Written 2026-11-22 20時 (JST).
//
// Nurevo AEO facts (experiments/webmcp-canary/wordpress-plugin/webmcp-canary/
// readme.txt):
// - robots.txt groups allow the AI search crawlers OAI-SearchBot, ChatGPT-User,
//   Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User; the site's
//   own rules (e.g. Disallow: /wp-admin/) are repeated in those groups.
// - Training crawlers (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended,
//   CCBot) left to the site's robots.txt by default; allow/block in one click;
//   blocking them does not affect AI search or the AEO score.
// - The service never switches robots.txt to Disallow on its own; suggestions
//   wait for Apply in wp-admin.
// - AEO diagnosis fetches the public front page, /robots.txt and /llms.txt.
//   (We do NOT claim it detects WAF/CDN blocks.)
// - Developer filters webmcp_canary_robots_search_agents /
//   webmcp_canary_robots_training_agents (docs/developers.md).
//
// Outside facts and where they were read (2026-11-22):
// - Cloudflare changelog 2026-07-01: Search, Agent, Training controls for all
//   customers incl. Free; per preset block on all pages / only on pages that
//   display ads / not block. From 2026-09-15, new domains: Training and Agent
//   blocked on pages that display ads, Search allowed. Multi-purpose crawlers
//   combining Search and Training are affected by blocking Training. Opt-out in
//   Security Settings. Help Net Security 2026-07-02 names Googlebot, Applebot,
//   Bingbot as examples.
// - Cloudflare blog 2026-09-15 (accountable mixed-use crawlers) and Impress
//   Watch 2026-09-18: "Disallow AI Training" option for Training; the single
//   "Block AI Bots" switch is being retired; Managed robots.txt becomes Bot
//   Preference Sync; settings in the zone's Security Settings; dual-use
//   crawlers 36.6% of crawler traffic (Cloudflare figure via Impress).
// - Cloudflare docs, AI Crawl Control "Manage AI crawlers" (mod. 2026-07-28):
//   Free plan identifies AI crawlers by user agent string, paid plans can use
//   Bot Management detection; Crawlers tab with Requests (allowed and
//   unsuccessful), robots.txt violations, Action; Block creates/updates a WAF
//   custom rule; custom 403/402 response on paid plans; "Unsuccessful requests
//   may come from any rule or response error"; pay per crawl in closed beta.
// - Cloudflare docs, managed robots.txt (mod. 2026-11-02): prepended only when
//   Enable Bot Preference Sync is on and a policy blocks or disallows training;
//   block includes Content-signal search=yes, ai-train=no and Disallow for
//   GPTBot, ClaudeBot, Google-Extended and others; robots.txt compliance is
//   voluntary.
// - Cloudflare docs, verified bots (updated 2026-11-12): legacy categories AI
//   Search (e.g. OAI-SearchBot, now treated as Search), AI Assistant (e.g.
//   Perplexity-User), AI Crawler; behaviours Search / Agent / Training.
// - Search Engine Land (contributed, Will Scott), managed WordPress blocking AI
//   bots: one site on WP Engine; curl with ClaudeBot UA 60/60 x 429 vs browser
//   UA 60/60 x 200; WAF dashboards missed it. Single-site report; say so.
// - HackerNoon 2026-11-19 (Sean Garschi): own scan of 640 hand-picked sites,
//   591 measurable, 100 refused GPTBot or ClaudeBot, only 4 of those said so in
//   robots.txt. Not a random sample; say so.
// - OpenAI / Perplexity crawler docs: linked as originals (read 2026-10-31 for
//   measure-ai-visibility; could not be re-fetched 2026-11-22).
// Top articles read 2026-11-22: Playwire (2026-06-15), Search Engine Land
// (WP Engine case), HackerNoon (2026-11-19), RunCloud (2026-07-25 update),
// RightBlogger (2026-10-30 update), CMSWire (2026-09-24), dev.to gyubinkim,
// Kinsta JP (2026-09-18 update), Impress Watch (2026-09-18), @IT (2025-10-07),
// GMO koukoku.jp robots.txt guide (2026-11-16 update), Zenn (2025-04-24),
// Brunch beusable (2026-06-12).
// Not stated on purpose: whether Bot Fight Mode exempts verified bots (doc not
// readable this run), per-bot Cloudflare category for ChatGPT-User /
// Claude-SearchBot / PerplexityBot (not listed on pages read), defaults of
// Japanese rental servers' WAFs, crawl-to-referral ratios (sources disagree).
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const PARTNER = "https://nurevo.jp/partner/";
const SRC = {
  cfChangelog: "https://developers.cloudflare.com/changelog/post/2026-07-01-ai-traffic-options/",
  cfSep: "https://blog.cloudflare.com/accountable-mixed-use-ai-crawlers/",
  cfManage: "https://developers.cloudflare.com/ai-crawl-control/features/manage-ai-crawlers/",
  cfRobots: "https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/",
  cfVerified: "https://developers.cloudflare.com/bots/concepts/bot/verified-bots/",
  cfBots: "https://developers.cloudflare.com/bots/concepts/bot/",
  helpnet: "https://www.helpnetsecurity.com/2026/07/02/cloudflare-ai-crawler-controls/",
  impress: "https://www.watch.impress.co.jp/docs/news/2142146.html",
  selWpe: "https://searchengineland.com/managed-wordpress-blocking-ai-bots-476510",
  hackernoon: "https://hackernoon.com/i-found-my-own-website-blocking-chatgpt-then-i-checked-640-others",
  openaiBots: "https://developers.openai.com/api/docs/bots",
  perplexityBots: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers",
};

const CURL = `# 1) ユーザーエージェントを変えて、同じURLの応答コードを比べる
URL="https://example.com/"
for UA in \\
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36" \\
  "OAI-SearchBot/1.0" "ChatGPT-User/1.0" \\
  "PerplexityBot/1.0" "Perplexity-User/1.0" \\
  "Claude-SearchBot/1.0" "Claude-User/1.0" \\
  "GPTBot/1.0" "ClaudeBot/1.0"; do
  printf '%-22.22s ' "$UA"
  curl -s -o /dev/null -w '%{http_code}\\n' -A "$UA" "$URL"
done

# 2) どの層が応答しているかの手がかり（CDN・サーバー）
curl -sI "$URL" | grep -iE '^(server|cf-ray|cf-cache-status|x-powered-by|via):'

# 3) 最終的に公開されている robots.txt（CDNが先頭に足した行も含む）
curl -s "$URL"robots.txt | head -60

# 4) サーバーのアクセスログで、本物のクローラーへの応答コードを数える
#    （combined形式のログで、9列目が応答コードの場合）
grep -E 'OAI-SearchBot|ChatGPT-User|PerplexityBot|Perplexity-User|Claude-SearchBot|Claude-User' access.log \\
  | awk '{print $9}' | sort | uniq -c`;

const CURL_EN = `# 1) Compare status codes for the same URL with different user agents
URL="https://example.com/"
for UA in \\
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36" \\
  "OAI-SearchBot/1.0" "ChatGPT-User/1.0" \\
  "PerplexityBot/1.0" "Perplexity-User/1.0" \\
  "Claude-SearchBot/1.0" "Claude-User/1.0" \\
  "GPTBot/1.0" "ClaudeBot/1.0"; do
  printf '%-22.22s ' "$UA"
  curl -s -o /dev/null -w '%{http_code}\\n' -A "$UA" "$URL"
done

# 2) Clues to which layer answered (CDN, server)
curl -sI "$URL" | grep -iE '^(server|cf-ray|cf-cache-status|x-powered-by|via):'

# 3) The robots.txt actually served (including lines a CDN prepends)
curl -s "$URL"robots.txt | head -60

# 4) Count status codes returned to the real crawlers in the server log
#    (combined log format, status code in column 9)
grep -E 'OAI-SearchBot|ChatGPT-User|PerplexityBot|Perplexity-User|Claude-SearchBot|Claude-User' access.log \\
  | awk '{print $9}' | sort | uniq -c`;

const REPORT = `【AIのクローラーの点検結果】◯◯様サイト（2026年◯月◯日）

1. robots.txt
   ・AI検索のクローラー（OAI-SearchBot・PerplexityBot など）：許可
   ・AIの学習用のクローラー（GPTBot・ClaudeBot など）：お客様の方針どおり「止める」
   ・CDN（Cloudflare）が先頭に足している行：あり／なし
2. CDN・ファイアウォール
   ・Cloudflare の設定：検索＝許可／エージェント＝◯◯／学習＝◯◯
   ・過去30日に止められたAIのクローラー：◯◯（件数）
3. サーバー・プラグイン
   ・サーバーのボット対策：◯◯（設定名）
   ・セキュリティプラグイン：AIのクローラーを止める設定なし
4. 応答の確認
   ・ブラウザ：200　OAI-SearchBot：200　PerplexityBot：200 …
5. 変更したこと／お客様に決めていただきたいこと
   ・◯◯`;

const REPORT_EN = `AI crawler access check - <client> (<date>)

1. robots.txt
   - AI search crawlers (OAI-SearchBot, PerplexityBot, ...): allowed
   - AI training crawlers (GPTBot, ClaudeBot, ...): blocked, per your policy
   - Lines prepended by the CDN (Cloudflare): yes / no
2. CDN and firewall
   - Cloudflare: Search = allow / Agent = ... / Training = ...
   - AI crawlers stopped in the last 30 days: ... (requests)
3. Host and plugins
   - Host bot protection: ... (setting name)
   - Security plugin: no rule that blocks AI crawlers
4. Response check
   - Browser: 200  OAI-SearchBot: 200  PerplexityBot: 200 ...
5. What we changed / what we need you to decide
   - ...`;

export default {
  slug: "agency-ai-crawler-blocking-audit",
  targetQueries: [
    "Cloudflare AIクローラー ブロック 確認",
    "WAF ChatGPT クローラー 403 制作会社",
    "AI検索 クローラー 止まっている 調べ方",
    "Cloudflare blocking OAI-SearchBot check",
    "WAF blocking AI search crawlers agency",
    "Cloudflare AI crawl control search agent training settings",
  ],
  related: ["agency-new-site-build-ai-search", "ai-visibility-drop-causes", "agency-aeo-monthly-service", "agency-aeo-client-handover", "perplexity-citations"],
  locales: {
    ja: {
      title: "CloudflareやWAFがAIのクローラーを止めていないか確かめる手順 | Nurevo",
      description: "robots.txtで許可していても、CDN・WAF・サーバーのボット対策・セキュリティプラグインがAI検索のクローラーを止めていることがあります。2026年のCloudflareの変更、4つの層の確かめ方、お客様への説明と保守契約の項目。",
      h1: "CloudflareやWAFがAIのクローラーを止めていないか：制作会社のための確かめ方と設定の手順",
      lead: "お客様のサイトがChatGPTやPerplexityに引用されないとき、robots.txt だけでなく、Cloudflareなどの CDN、サーバーのファイアウォール（WAF）、セキュリティプラグインが、AI検索のクローラーに 403 や 429 を返していないかを確かめてください。robots.txt で許可していても、その手前で止められていればページは読まれません。Cloudflareは2026年7月1日に、AIのクローラーを「検索」「エージェント」「学習」に分けて扱える設定を無料プランにも出し、9月15日以降に追加された新しいドメインでは、広告のあるページで学習とエージェントが止まる既定になっています。この記事では、4つの層を順に確かめる手順と、お客様への説明、保守の項目をまとめます。",
      intro: [
        "作成日：2026年11月22日（JST）。対象は、お客様のサイトを作る・保守する制作会社、WordPressの保守会社、サーバーやCDNを預かっているフリーランスの方です。Cloudflareの画面の名前は、この記事の作成時点の公式ドキュメントに合わせています。画面は変わることがあるので、作業の前に各リンク先を確かめてください。",
        "AIの回答は日や聞き方によって変わります。クローラーを通すことは、読まれて引用されるための前提で、AIの回答に出ることを保証するものではありません。",
      ],
      sections: [
        {
          heading: "よく読まれている記事と、足りないこと",
          paragraphs: [
            "「Cloudflare AI クローラー ブロック」「WAF ChatGPT 403」「blocking AI crawlers」などで上位に出る日本語5本・英語8本を、2026年11月22日に読みました。日本語では、Impress Watch（2026年9月18日）、Kinsta日本語ブログ（9月18日更新）、GMOの robots.txt の解説（11月16日更新）、@IT（2025年10月7日）、Zennの記事（2025年4月24日）。英語では、Playwire（6月15日）、Search Engine Land のWP Engineの事例、HackerNoon（11月19日）、RunCloud（7月25日更新）、RightBlogger（10月30日更新）、CMSWire（9月24日）、dev.to の記事、韓国のBrunchの記事です。",
            "「学習用と検索用のクローラーを分けて考える」「robots.txt だけでは足りない」という点はほぼ一致していました。一方で、制作会社がお客様のサイトで実際に確かめるときに必要な次の点は、ほとんど書かれていませんでした。",
          ],
          table: {
            head: ["足りない点", "この記事で書いていること"],
            rows: [
              ["Cloudflareの「Block AI bots」を切る手順のまま（2026年9月に1つのスイッチから3つの区分へ変わった）", "2026年7月・9月の変更を公式ドキュメントで確かめた表と、今の画面の場所"],
              ["robots.txt・CDN・サーバー・プラグインのどの層で止まっているかの切り分け方がない", "4つの層の表と、curl・ログで層を見分ける手順"],
              ["curlでユーザーエージェントを変える確認だけで終わり、その限界が書かれていない", "なりすましと本物の違い、ログで本物の応答を数える方法"],
              ["学習用を止めると、検索と学習を兼ねるクローラー（Googlebotなど）に影響する場合があることが書かれていない", "「学習をブロック」と「学習をことわる（Disallow AI Training）」の違い"],
              ["お客様への説明と、保守契約での扱いがない", "方針の決め方の表、報告の文例、毎月の確認項目"],
            ],
            caption: "上位の記事には「AIのクローラーの◯%が止められている」といった数字もありましたが、調べ方が書かれていないものや、出典によって大きく食い違うものは使っていません。",
          },
        },
        {
          heading: "AIのクローラーが止まる4つの層",
          paragraphs: [
            "クローラーの要求は、CDN → サーバー → WordPress の順に届きます。どこか1か所で止められれば、その先の設定（robots.txt での許可など）は意味を持ちません。止められたときに返る応答コードも層によって違います。",
          ],
          table: {
            head: ["層", "止まり方", "よくある応答", "どこで確かめるか"],
            rows: [
              ["robots.txt", "クローラーが自分で読み、Disallow のページを取りに来ない（守るかどうかはクローラー次第）", "要求そのものが来ない", "/robots.txt の最終的な中身（CDNが行を足していないか）"],
              ["CDN・WAF（Cloudflareなど）", "ユーザーエージェントやボットの判定で、ルールに合った要求を止める", "403、チャレンジのページ、402（Cloudflareの有料プランで設定した場合）", "CDNの管理画面の設定とイベントの記録"],
              ["サーバー（ホスティングのWAF・ボット対策・回数制限）", "レンタルサーバーやマネージドWordPressの仕組みが止める・回数を制限する", "403、429、503", "サーバーの管理画面、アクセスログ、サーバー会社への問い合わせ"],
              ["WordPressのプラグイン（セキュリティ・キャッシュ）", "プラグインのボット対策や、ユーザーエージェントの一覧で止める", "403、ログインやチャレンジのページ", "プラグインのブロックの記録と設定"],
            ],
            caption: "マネージドWordPressの例では、キャッシュにないページへのAIのクローラーの要求にだけ 429 が返り、WAFの画面では見つからなかったという報告があります（[Search Engine Land](" + SRC.selWpe + ")、1サイトでの事例）。",
          },
          after: [
            "どのくらい起きているかについては、HackerNoonに、ある制作会社の人が選んだ640サイトを調べたところ、測れた591サイトのうち100サイトがGPTBotかClaudeBotを拒否し、そのうち robots.txt にそう書いていたのは4サイトだけだった、という調査があります（[HackerNoon](" + SRC.hackernoon + ")、2026年11月19日、無作為の標本ではないと本人が書いています）。robots.txt を読むだけでは見つからない止まり方がある、という点の参考になります。",
          ],
        },
        {
          heading: "2026年のCloudflareの変更：今の設定の考え方",
          paragraphs: [
            "Cloudflareを使っているお客様のサイトでは、2026年に設定の考え方が変わりました。古い記事にある「Block AI bots」を切るだけの手順は、今の画面と合わないことがあります。",
          ],
          table: {
            head: ["時期", "変わったこと", "出典"],
            rows: [
              ["2026年7月1日", "AIのクローラーを「検索（Search）」「エージェント（Agent）」「学習（Training）」に分けて扱える設定を、無料プランを含むすべての利用者に提供。それぞれ「すべてのページでブロック」「広告を表示するページだけブロック」「ブロックしない」を選べる", `[Cloudflare changelog](${SRC.cfChangelog})`],
              ["2026年9月15日から", "新しくCloudflareに追加したドメインは、広告を表示するページで「学習」と「エージェント」に分類されたボットをブロックし、「検索」は許可する既定に", `[Cloudflare changelog](${SRC.cfChangelog})`],
              ["2026年9月15日", "学習に「Disallow AI Training」（ブロックせずに、学習に使わないよう求める）の選択肢を追加。1つの「Block AI Bots」のスイッチは廃止の予定。Managed robots.txt は「Bot Preference Sync」に", `[Cloudflare blog](${SRC.cfSep})、[Impress Watch](${SRC.impress})`],
            ],
            caption: "設定の場所は、ドメイン（ゾーン）の「Security Settings」です（Cloudflareのドキュメント）。",
          },
          after: [
            "3つの区分の意味は、Cloudflareのドキュメントでは次のとおりです。検索は、あとで質問に答えるために内容を集める・索引にするもの。エージェントは、人の代わりにその場で動くもの（会話の中でページを取りに来るボットや、ブラウザを操作するエージェントなど）。学習は、モデルの学習・調整のために内容を集めるものです（[Cloudflare：ボットの種類](" + SRC.cfBots + ")）。",
            "Cloudflareの認証済みボットの説明では、OAI-SearchBot は以前の「AI Search」の例として挙がり、今は「検索」として扱うとされ、Perplexity-User は「AI Assistant」の例です（[Cloudflare：認証済みボット](" + SRC.cfVerified + ")）。ChatGPT-User、Claude-SearchBot、PerplexityBot などの1つずつの区分は、この記事で読んだページには載っていなかったので、お客様の画面の「AI Crawl Control」の一覧で確かめてください。",
            "注意したいのは学習の扱いです。7月の発表では、学習をブロックすると、検索と学習を兼ねるクローラーにも影響すると説明されていました（[Cloudflare changelog](" + SRC.cfChangelog + ")）。Help Net Security は、その例としてGooglebot・Applebot・Bingbotを挙げています（[Help Net Security](" + SRC.helpnet + ")）。お客様が「学習には使われたくない」と言うときは、ブロックではなく「Disallow AI Training」を選ぶ方法があります（[Cloudflare blog](" + SRC.cfSep + ")）。どちらを選んでも、変更のあとにGooglebotへの応答を確かめてください。",
          ],
        },
        {
          heading: "確かめる手順：4つの層を順に見る",
          paragraphs: [
            "次のコマンドを、お客様のトップページと、引用されてほしい主なページ（料金・サービス・よくある質問）で試します。1でブラウザだけ 200 になり、AIのクローラーの名前で 403・429・503 になれば、ユーザーエージェントで止めている層があります。2の応答ヘッダーに cf-ray があれば、Cloudflareを通っています。",
          ],
          code: CURL,
          after: [
            "ただし、1の結果は手がかりです。本物のクローラーは、各社が公開しているIPアドレスから来ます（[OpenAI：クローラー](" + SRC.openaiBots + ")、[Perplexity：クローラー](" + SRC.perplexityBots + ")）。自分のパソコンから名前だけ名乗った要求は、なりすましとして止められることもあれば、逆に本物だけが止められていることもあります。Cloudflareの無料プランでは、AI Crawl Control はユーザーエージェントの文字列でAIのクローラーを見分け、有料プランではボット管理の判定も使えます（[Cloudflare：AIのクローラーの管理](" + SRC.cfManage + ")）。",
            "そのため、最後は4のアクセスログか、CDNの記録で、本物のクローラーに何を返したかを確かめます。キャッシュにあるページは 200 で、キャッシュにないページだけ止まる、という例もあるので（[Search Engine Land](" + SRC.selWpe + ")）、トップページだけでなく、更新したばかりのページも見ます。",
          ],
        },
        {
          heading: "Cloudflareでの確かめ方と設定",
          list: [
            "ドメインの「Security Settings」で、ボットの通信（Bot traffic）に絞り、「AI Crawler and Agent access policies」の検索・エージェント・学習の設定を確かめる。お客様の方針と違えば直す（[Cloudflare：managed robots.txt](" + SRC.cfRobots + ")）。",
            "「AI Crawl Control」の「Crawlers」タブで、クローラーごとの区分・要求数（通ったもの・通らなかったもの）・robots.txt の違反・アクションを見る。ドキュメントには、通らなかった要求はブロック以外のルールやエラーによることもある、と書かれています（[Cloudflare：AIのクローラーの管理](" + SRC.cfManage + ")）。",
            "AI Crawl Control でブロックを選ぶと、ゾーンのWAFのカスタムルールが作られる・更新されます（同）。WAFのカスタムルールの一覧で、AIのクローラーに関わるルールを、誰がいつ作ったかと一緒に確かめる。",
            "「Bot Preference Sync」をオンにして、ブロックや学習のことわりを1つでも選ぶと、Cloudflareが robots.txt の先頭に行を足します。その行には Content-signal と、GPTBot・ClaudeBot・Google-Extended などの Disallow が入ります（[Cloudflare：managed robots.txt](" + SRC.cfRobots + ")）。WordPressで書いた robots.txt と、公開されている robots.txt が違う理由になるので、curl で最終的な中身を見る。",
            "ボット対策の機能（Bot Fight Modeなど）を使っている場合は、その設定とイベントの記録も見る。認証済みのボットがどう扱われるかは、この記事の作成時に公式ドキュメントで確かめられなかったため、イベントの記録で実際に止まっていないかを確かめてください。",
          ],
        },
        {
          heading: "サーバーとプラグインでの確かめ方",
          list: [
            "サーバーの管理画面で、WAF・ボット対策・国外からのアクセス制限・回数制限の設定と、その記録を見る。記録が見られないときは、日時とユーザーエージェントを添えてサーバー会社に問い合わせる。",
            "マネージドWordPressでは、利用者が切れない仕組みで止めている場合があります。上の事例では、サーバー会社への問い合わせで仕組みが分かりました（[Search Engine Land](" + SRC.selWpe + ")）。",
            "セキュリティプラグインのブロックの記録に、OAI-SearchBot・PerplexityBot などの名前が出ていないかを見る。ユーザーエージェントの一覧で止める設定があれば、学習用だけが入っているかを確かめる。",
            "キャッシュのプラグインやサーバーのキャッシュで、ボットにだけ違うページを返す設定がないかを見る。誰が見ても同じHTMLにしておくのが安全です。",
            "日本の主なレンタルサーバーのWAFが、AIのクローラーをどう扱うかの公式の記載は、この記事の作成時に確かめられませんでした。サーバーごとに、上の手順とアクセスログで確かめてください。",
          ],
        },
        {
          heading: "お客様への説明：方針を決めるのはお客様",
          paragraphs: [
            "AIのクローラーを通すか止めるかは、お客様の事業の判断です。制作会社は、選べる形と、それぞれで何が起きるかを説明し、決まった方針どおりに設定されているかを確かめる役割にとどめると、あとで食い違いが起きにくくなります。",
          ],
          table: {
            head: ["方針", "設定の例", "向いているお客様", "気をつけること"],
            rows: [
              ["検索もエージェントも学習も通す", "robots.txt で止めない。CDNの3区分はすべて許可", "認知を広げたい店舗・会社", "サーバーの負荷を見る"],
              ["検索とエージェントは通し、学習はことわる", "robots.txt で学習用だけ Disallow。Cloudflareは学習を「Disallow AI Training」", "多くの店舗・会社の出発点。記事や写真を学習に使われたくない場合", "学習を「ブロック」にするとGooglebotなどに影響する場合がある"],
              ["広告のあるページだけ止める", "Cloudflareで「広告を表示するページだけブロック」", "広告収入のあるメディア", "どのページが「広告のあるページ」と判定されるか確かめる"],
              ["すべて止める", "CDNで3区分ともブロック", "会員向けの内容が中心のサイト", "ChatGPTやPerplexityの回答で、自社のページが引用されにくくなる"],
            ],
          },
          after: [
            "点検の結果は、次のような形でお客様に送ると、決めていただきたいことがはっきりします。",
          ],
          code: REPORT,
        },
        {
          heading: "WordPressでの手順（Nurevo AEOを使う場合）",
          paragraphs: [
            `無料のプラグイン[Nurevo AEO](${WP_ORG})を使う場合、robots.txt の層は次のようになります。CDN・サーバー・プラグインの層は、Nurevo AEOの外にあるので、上の手順で別に確かめてください。`,
          ],
          list: [
            "AI検索が使うクローラー（OAI-SearchBot・ChatGPT-User、Claude-SearchBot・Claude-User、PerplexityBot・Perplexity-User）を robots.txt で許可します。サイトの既存の行（Disallow: /wp-admin/ など）は、これらのクローラーにもそのまま適用されます。",
            "学習用のクローラー（GPTBot、ClaudeBot、Google-Extended、Applebot-Extended、CCBot）は、初期状態ではサイトの robots.txt に任せ、ワンクリックで許可・ブロックを選べます。学習用を止めても、AI検索やAEOスコアには影響しません。",
            "Nurevoのサービスが、勝手に robots.txt を Disallow に変えることはありません。提案は管理画面に出て、「適用」を押したときだけ反映されます。",
            "AEOの診断は、公開されているトップページ・/robots.txt・/llms.txt を取りに行きます。診断で robots.txt が問題なしでも、CDNやWAFで止まっていることはありえるので、この記事の curl とログの確認を合わせて行います。",
            "Cloudflareの Bot Preference Sync を使っていると、WordPressが出す robots.txt の前にCloudflareの行が足されます。両方の行が矛盾していないか、公開されている /robots.txt で確かめます。",
            "開発者向けには、許可する検索用・学習用のクローラーの一覧を変えるフィルターがあります（名前はプラグインの開発者向けの説明に記載）。",
          ],
        },
        {
          heading: "保守契約に入れる毎月の確認",
          paragraphs: [
            `CDNやサーバーの設定は、制作会社が触っていなくても、サービス側の既定の変更で変わります。2026年のCloudflareの変更のような例があるので、月額の保守に次の確認を入れておくと、気づくのが早くなります（[月額サービスにする方法](/guide/agency-aeo-monthly-service)）。紹介の仕組みを使って保守と組み合わせる場合は、[パートナープログラム](${PARTNER})も参考にしてください。`,
          ],
          list: [
            "主なページで、ブラウザとAI検索のクローラーの名前の応答コードを比べる（上の curl の1）。",
            "公開されている /robots.txt を前の月と比べる（CDNが足した行も含めて）。",
            "CDNの AI Crawl Control などの記録で、止められたAIのクローラーの数を見る。",
            "アクセスログで、本物のクローラーへの応答コードの内訳を見る。",
            "CDN・サーバー・プラグインの更新のお知らせに、ボット対策の変更がないかを見る。",
            "変えたことと、お客様に決めていただきたいことを月次の報告に書く。",
          ],
        },
        {
          heading: "点検のチェックリスト",
          list: [
            "お客様の方針（検索・エージェント・学習をどうするか）を書面で確かめた。",
            "公開されている /robots.txt で、AI検索のクローラーが Disallow になっていない。",
            "CDNが robots.txt に行を足している場合、その中身を確かめた。",
            "主なページで、ブラウザとAI検索のクローラーの名前の応答コードを比べた。",
            "応答ヘッダーで、CDNを通っているかを確かめた。",
            "CDNの3区分の設定が、お客様の方針どおりになっている。",
            "学習を止めたあと、Googlebotへの応答が変わっていない。",
            "WAFのカスタムルールとボット対策の記録に、意図しないAIのクローラーのブロックがない。",
            "サーバーとセキュリティプラグインの記録に、AI検索のクローラーのブロックがない。",
            "アクセスログで、本物のクローラーに 200 を返している。",
          ],
        },
      ],
      faqs: [
        { q: "robots.txt で許可していれば、CDNの設定は見なくてよいですか？", a: "いいえ。robots.txt はクローラーが自分で読む決まりで、CDNやWAFはその手前で要求を止めます。CDNで止めていれば、robots.txt で許可していてもページは読まれません。両方を確かめてください。" },
        { q: "Cloudflareを昔から使っているお客様も、9月15日の既定の対象ですか？", a: "Cloudflareのchangelogでは、9月15日からの既定は新しく追加したドメインが対象と書かれています。ただ、以前の「Block AI bots」の設定や、誰かが作ったWAFのルールが残っていることがあるので、既存のドメインも今の設定を確かめてください。" },
        { q: "GPTBotを止めると、ChatGPTの検索に出なくなりますか？", a: "GPTBotはOpenAIの学習用のクローラーで、ChatGPTの検索で使われるのはOAI-SearchBotです。学習用を止めても、検索での引用には直接関係しません。止めているのがどちらかを確かめてください。" },
        { q: "curlでAIのクローラーの名前にしたら 200 でした。もう大丈夫ですか？", a: "手がかりにはなりますが、確かではありません。本物のクローラーは各社のIPアドレスから来るので、IPで判定するボット対策では結果が変わることがあります。アクセスログかCDNの記録で、本物への応答を確かめてください。" },
        { q: "429 が返っていました。何が起きていますか？", a: "429 は回数が多すぎるという意味で、サーバーやCDNの回数制限が働いていることが多い応答です。止める設定ではなく回数制限なので、WAFの画面には出ないことがあります。サーバー会社に、日時とユーザーエージェントを添えて問い合わせてください。" },
        { q: "お客様が「AIには一切読ませたくない」と言っています。", a: "お客様の判断なので、その方針で設定します。そのうえで、ChatGPTやPerplexityの回答で自社のページが引用されにくくなること、学習だけをことわる選び方もあることを、書面で説明しておくと安心です。" },
        { q: "クローラーを通せば、AIの回答に出るようになりますか？", a: "保証はできません。通すことは読まれるための前提です。AIの回答は日や聞き方で変わり、料金・対応エリア・実績などの事実がページに書かれているかでも変わります。" },
      ],
      relatedHeading: "あわせて読みたい",
      cta: {
        heading: "お客様のサイトを、AIがどう読んでいるか確認",
        body: "無料のチェックは登録不要です。URLを入れると、構造化データ・llms.txt・AIのクローラーの扱いを確かめられます。CDNやWAFの確認とあわせて使えます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "パートナープログラムを見る", href: PARTNER },
      },
      footnote: "CloudflareはCloudflare, Inc.、ChatGPT・GPTBot・OAI-SearchBotはOpenAI、PerplexityはPerplexity AI、ClaudeはAnthropic、GoogleはGoogle LLCの商標です。WordPressは WordPress Foundation の商標です。Nurevoはこれらの企業と提携・承認の関係にありません。",
    },
    en: {
      title: "Is Cloudflare or a WAF blocking AI crawlers? An agency check | Nurevo",
      description: "A CDN, host firewall or plugin can refuse AI search crawlers that robots.txt allows. Cloudflare's 2026 changes, a four-layer check with curl and logs, and client advice.",
      h1: "Is Cloudflare or a WAF blocking AI crawlers? How agencies check each layer and set it up",
      lead: "When a client's site is not cited by ChatGPT or Perplexity, look past robots.txt: check whether a CDN such as Cloudflare, the host's firewall (WAF) or a security plugin is returning 403 or 429 to AI search crawlers. If a request is stopped before it reaches the site, allowing the crawler in robots.txt changes nothing. On 1 July 2026 Cloudflare gave every plan, including Free, separate controls for Search, Agent and Training crawlers, and domains added from 15 September 2026 block Training and Agent bots on pages that show ads by default. This guide walks through the four layers to check, how to explain the choice to the client, and what to add to a care plan.",
      intro: [
        "Written 22 November 2026 (JST). For web agencies, WordPress care companies and freelancers who manage a client's hosting or CDN. Cloudflare screen names follow its documentation at the time of writing; screens change, so check each linked page before you work.",
        "AI answers change by day and wording. Letting crawlers in is a precondition for being read and cited, not a guarantee of appearing in AI answers.",
      ],
      sections: [
        {
          heading: "What the top-ranking guides cover, and what they leave out",
          paragraphs: [
            "On 22 November 2026 we read five Japanese and eight English pages that rank for queries such as \"Cloudflare AI crawler block\", \"WAF ChatGPT 403\" and \"blocking AI crawlers\": Impress Watch (18 Sep 2026), the Kinsta Japanese blog (updated 18 Sep), a GMO robots.txt guide (updated 16 Nov), @IT (7 Oct 2025) and a Zenn post (24 Apr 2025); Playwire (15 Jun), the Search Engine Land WP Engine case, HackerNoon (19 Nov), RunCloud (updated 25 Jul), RightBlogger (updated 30 Oct), CMSWire (24 Sep), a dev.to post and a Korean Brunch post.",
            "Most agree that training and search crawlers should be treated separately and that robots.txt alone is not enough. What an agency needs to check a client's site in practice was mostly missing:",
          ],
          table: {
            head: ["Gap", "What this guide adds"],
            rows: [
              ["Steps still say \"turn off Block AI bots\" (in September 2026 one switch became three categories)", "A table of the July and September 2026 changes checked against Cloudflare's docs, and where the settings are now"],
              ["No way to tell whether robots.txt, the CDN, the host or a plugin is doing the blocking", "A four-layer table and how to tell the layers apart with curl and logs"],
              ["A curl test with a spoofed user agent, with no word on its limits", "Spoofed versus real crawlers, and counting real responses in logs"],
              ["No mention that blocking Training can affect crawlers that do both search and training (such as Googlebot)", "The difference between blocking Training and Disallow AI Training"],
              ["Nothing on explaining the choice to clients or handling it in a care plan", "A policy table, a report template and a monthly checklist"],
            ],
            caption: "Some top pages quote figures such as \"x% of AI crawlers are blocked\". We left out figures without a stated method and ones that differ widely between sources.",
          },
        },
        {
          heading: "The four layers where AI crawlers get stopped",
          paragraphs: [
            "A crawler's request passes through the CDN, then the server, then WordPress. If any one layer stops it, settings further along (such as an allow rule in robots.txt) never come into play. The status code also differs by layer.",
          ],
          table: {
            head: ["Layer", "How it stops crawlers", "Typical response", "Where to check"],
            rows: [
              ["robots.txt", "The crawler reads it and skips disallowed pages (compliance is up to the crawler)", "No request at all", "The /robots.txt actually served (including lines a CDN adds)"],
              ["CDN / WAF (e.g. Cloudflare)", "Rules on user agent or bot detection stop matching requests", "403, a challenge page, 402 (if set on a paid Cloudflare plan)", "CDN settings and event logs"],
              ["Host (host WAF, bot protection, rate limits)", "The hosting or managed WordPress platform blocks or throttles", "403, 429, 503", "Host control panel, access logs, host support"],
              ["WordPress plugins (security, caching)", "Plugin bot protection or user-agent lists block", "403, a login or challenge page", "Plugin block logs and settings"],
            ],
            caption: "One report describes a managed WordPress host returning 429 to AI crawlers only for pages not in cache, which the WAF dashboards did not show ([Search Engine Land](" + SRC.selWpe + "), a single-site case).",
          },
          after: [
            "On how common this is: an agency founder writing on HackerNoon checked 640 hand-picked sites; of 591 that could be measured, 100 refused GPTBot or ClaudeBot, and only 4 of those said so in robots.txt ([HackerNoon](" + SRC.hackernoon + "), 19 Nov 2026; the author notes the sample is not random). It is a useful reminder that some blocking never shows up in robots.txt.",
          ],
        },
        {
          heading: "Cloudflare's 2026 changes: how the settings work now",
          paragraphs: [
            "For clients on Cloudflare, the model changed in 2026. Older guides that only say to turn off \"Block AI bots\" may not match today's screens.",
          ],
          table: {
            head: ["When", "What changed", "Source"],
            rows: [
              ["1 July 2026", "Controls for AI crawlers split into Search, Agent and Training, for all customers including Free. For each you can block on all pages, block only on pages that display ads, or not block", `[Cloudflare changelog](${SRC.cfChangelog})`],
              ["From 15 September 2026", "New domains onboarding to Cloudflare block bots classified as Training or Agent on pages that display ads; Search stays allowed", `[Cloudflare changelog](${SRC.cfChangelog})`],
              ["15 September 2026", "Training gains a \"Disallow AI Training\" option (ask not to train, without blocking). The single \"Block AI Bots\" toggle is to be retired. Managed robots.txt becomes Bot Preference Sync", `[Cloudflare blog](${SRC.cfSep}), [Impress Watch](${SRC.impress})`],
            ],
            caption: "The settings live in the domain's (zone's) Security Settings, according to Cloudflare's documentation.",
          },
          after: [
            "Cloudflare defines the three behaviours like this: Search collects or indexes content so it can answer questions later; Agent acts in real time on a person's behalf, such as chat fetch bots and browser-use agents; Training crawls content to train or fine-tune a model ([Cloudflare: bot concepts](" + SRC.cfBots + ")).",
            "Cloudflare's verified bots page gives OAI-SearchBot as an example of the older \"AI Search\" category, now treated as Search, and Perplexity-User as an example of \"AI Assistant\" ([Cloudflare: verified bots](" + SRC.cfVerified + ")). The pages we read did not list the category of each crawler, such as ChatGPT-User, Claude-SearchBot or PerplexityBot, so check the list in the client's AI Crawl Control screen.",
            "Take care with Training. At the July launch, Cloudflare said blocking Training would also affect multi-purpose crawlers that combine search and training ([Cloudflare changelog](" + SRC.cfChangelog + ")); Help Net Security named Googlebot, Applebot and Bingbot as examples ([Help Net Security](" + SRC.helpnet + ")). When a client does not want content used for training, \"Disallow AI Training\" is an alternative to blocking ([Cloudflare blog](" + SRC.cfSep + ")). Either way, check Googlebot's responses after the change.",
          ],
        },
        {
          heading: "The check: go through the four layers",
          paragraphs: [
            "Run these commands against the client's home page and the pages you most want cited (pricing, services, FAQ). If step 1 returns 200 for the browser but 403, 429 or 503 for AI crawler names, some layer is filtering by user agent. If the headers in step 2 include cf-ray, the site is behind Cloudflare.",
          ],
          code: CURL_EN,
          after: [
            "Treat step 1 as a clue only. Real crawlers come from the IP addresses each company publishes ([OpenAI: crawlers](" + SRC.openaiBots + "), [Perplexity: crawlers](" + SRC.perplexityBots + ")). A request from your own machine that only borrows the name may be blocked as an impostor, or the opposite: only the real crawler may be blocked. On Cloudflare's Free plan, AI Crawl Control identifies AI crawlers by user agent string; paid plans can also use Bot Management detection ([Cloudflare: manage AI crawlers](" + SRC.cfManage + ")).",
            "So finish with step 4 or the CDN's logs to see what the real crawlers received. Cached pages can return 200 while uncached ones are blocked ([Search Engine Land](" + SRC.selWpe + ")), so test recently updated pages as well as the home page.",
          ],
        },
        {
          heading: "Checking and setting Cloudflare",
          list: [
            "In the domain's Security Settings, filter by Bot traffic and open \"AI Crawler and Agent access policies\" to see the Search, Agent and Training settings. Change them if they do not match the client's policy ([Cloudflare: managed robots.txt](" + SRC.cfRobots + ")).",
            "In AI Crawl Control, the Crawlers tab shows each crawler's category, requests (allowed and unsuccessful), robots.txt violations and action. The docs note that unsuccessful requests can come from any rule or error, not only the block action ([Cloudflare: manage AI crawlers](" + SRC.cfManage + ")).",
            "Choosing Block in AI Crawl Control creates or updates a WAF custom rule on the zone (same page). Review the custom rules for anything touching AI crawlers, with who created it and when.",
            "With Bot Preference Sync on and at least one policy set to block or disallow training, Cloudflare prepends lines to robots.txt, including a Content-signal line and Disallow rules for GPTBot, ClaudeBot, Google-Extended and others ([Cloudflare: managed robots.txt](" + SRC.cfRobots + ")). That explains why the served robots.txt can differ from the one WordPress writes, so read the final file with curl.",
            "If bot protection features such as Bot Fight Mode are on, check their settings and events too. We could not confirm in Cloudflare's docs at the time of writing how verified bots are treated there, so check the event log for real blocks.",
          ],
        },
        {
          heading: "Checking the host and plugins",
          list: [
            "In the host's control panel, check WAF, bot protection, country restrictions and rate limits, and their logs. If there are no logs, ask support, giving the time and user agent.",
            "Some managed WordPress hosts throttle in ways customers cannot switch off. In the case above, the host's support explained the mechanism ([Search Engine Land](" + SRC.selWpe + ")).",
            "Look for OAI-SearchBot, PerplexityBot and similar names in your security plugin's block log. If it blocks by a user-agent list, make sure only training crawlers are on it.",
            "Check that no caching plugin or server cache serves bots a different page. The safe default is the same HTML for everyone.",
            "We found no official statement of how each hosting company's WAF treats AI crawlers, so check each host with the steps above and its access logs.",
          ],
        },
        {
          heading: "Explaining it to the client: the policy is theirs",
          paragraphs: [
            "Whether to let AI crawlers in is a business decision for the client. Agencies avoid later disputes by explaining the options and what each one does, then confirming the settings match the decision.",
          ],
          table: {
            head: ["Policy", "Example settings", "Suits", "Watch out for"],
            rows: [
              ["Allow search, agent and training", "No robots.txt blocks; all three Cloudflare categories allowed", "Businesses that want reach", "Server load"],
              ["Allow search and agent, decline training", "Disallow training crawlers only in robots.txt; Cloudflare Training set to Disallow AI Training", "A starting point for most businesses, especially if they do not want text or photos used for training", "Blocking (rather than disallowing) Training may affect Googlebot and similar crawlers"],
              ["Block only on pages with ads", "Cloudflare \"block only on pages that display ads\"", "Ad-funded publishers", "Check which pages count as showing ads"],
              ["Block everything", "All three categories blocked at the CDN", "Mostly members-only content", "The client's pages become less likely to be cited in ChatGPT or Perplexity answers"],
            ],
          },
          after: [
            "Sending the results in a format like this makes clear what the client needs to decide.",
          ],
          code: REPORT_EN,
        },
        {
          heading: "WordPress steps (with Nurevo AEO)",
          paragraphs: [
            `With the free [Nurevo AEO](${WP_ORG}) plugin, the robots.txt layer works as follows. The CDN, host and plugin layers sit outside Nurevo AEO, so check them separately with the steps above.`,
          ],
          list: [
            "It allows the crawlers AI search uses (OAI-SearchBot and ChatGPT-User, Claude-SearchBot and Claude-User, PerplexityBot and Perplexity-User) in robots.txt. Your existing rules, such as Disallow: /wp-admin/, still apply to them.",
            "Training crawlers (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot) are left to your robots.txt by default, with a one-click allow or block. Blocking them does not affect AI search or the AEO score.",
            "The Nurevo service never switches robots.txt to Disallow on its own. Suggestions appear in wp-admin and apply only when you press Apply.",
            "The AEO diagnosis fetches the public home page, /robots.txt and /llms.txt. A clean robots.txt result does not rule out a CDN or WAF block, so pair it with the curl and log checks in this guide.",
            "If Cloudflare's Bot Preference Sync is on, Cloudflare's lines come before the robots.txt WordPress serves. Check the public /robots.txt for contradictions between the two.",
            "For developers, filters can change the lists of search and training crawlers (named in the plugin's developer notes).",
          ],
        },
        {
          heading: "Monthly checks to put in a care plan",
          paragraphs: [
            `CDN and host settings can change without the agency touching them, when a provider changes its defaults, as Cloudflare did in 2026. Adding these checks to a monthly care plan catches changes early ([turning AEO into a monthly service](/guide/agency-aeo-monthly-service)). If you combine care plans with referrals, see the [partner program](${PARTNER}).`,
          ],
          list: [
            "Compare status codes for a browser and AI search crawler names on key pages (step 1 above).",
            "Compare the public /robots.txt with last month's, including lines a CDN adds.",
            "Check the count of blocked AI crawlers in AI Crawl Control or the CDN's logs.",
            "Check the breakdown of status codes returned to real crawlers in the access log.",
            "Read CDN, host and plugin release notes for bot protection changes.",
            "Note what you changed and what the client needs to decide in the monthly report.",
          ],
        },
        {
          heading: "Audit checklist",
          list: [
            "The client's policy for search, agent and training crawlers is confirmed in writing.",
            "The public /robots.txt does not disallow AI search crawlers.",
            "If a CDN adds lines to robots.txt, you have read them.",
            "Status codes for a browser and AI search crawler names match on key pages.",
            "Response headers show whether the site is behind a CDN.",
            "The CDN's three categories match the client's policy.",
            "Googlebot's responses did not change after training was restricted.",
            "WAF custom rules and bot protection events show no unintended AI crawler blocks.",
            "Host and security plugin logs show no blocks of AI search crawlers.",
            "Access logs show 200 responses to the real crawlers.",
          ],
        },
      ],
      faqs: [
        { q: "If robots.txt allows the crawlers, can I skip the CDN settings?", a: "No. robots.txt is a rule crawlers read for themselves; a CDN or WAF stops requests before that. If the CDN blocks them, the pages go unread whatever robots.txt says. Check both." },
        { q: "Does the 15 September default apply to clients who have used Cloudflare for years?", a: "Cloudflare's changelog says the 15 September defaults apply to newly onboarded domains. Older \"Block AI bots\" settings or WAF rules someone created may still be in place, so check existing domains too." },
        { q: "If we block GPTBot, will the site drop out of ChatGPT search?", a: "GPTBot is OpenAI's training crawler; ChatGPT search uses OAI-SearchBot. Blocking the training crawler has no direct bearing on citations in search. Check which of the two is blocked." },
        { q: "curl with an AI crawler name returned 200. Are we fine?", a: "It is a clue, not proof. Real crawlers come from each company's IP addresses, so bot protection that checks IPs can treat them differently. Confirm the real responses in the access log or CDN logs." },
        { q: "We saw 429 responses. What does that mean?", a: "429 means too many requests, usually a rate limit at the host or CDN. Because it is throttling rather than a block rule, it may not appear in the WAF dashboard. Ask the host, giving the time and user agent." },
        { q: "The client wants AI to read nothing at all.", a: "It is their decision, so set it up that way. It helps to explain in writing that their pages become less likely to be cited in ChatGPT or Perplexity answers, and that declining training alone is also an option." },
        { q: "If we let the crawlers in, will the client appear in AI answers?", a: "That cannot be guaranteed. Access is a precondition for being read. AI answers change by day and wording, and also depend on whether facts such as prices, areas and results are on the pages." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See how AI reads your client's site",
        body: "The free check needs no sign-up: enter a URL to see the state of its structured data, llms.txt and AI crawler access. Use it alongside the CDN and WAF checks.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "See the partner program", href: PARTNER },
      },
      footnote: "Cloudflare is a trademark of Cloudflare, Inc.; ChatGPT, GPTBot and OAI-SearchBot of OpenAI; Perplexity of Perplexity AI; Claude of Anthropic; Google of Google LLC. WordPress is a trademark of the WordPress Foundation. Nurevo is not affiliated with or endorsed by these companies.",
    },
  },
};
