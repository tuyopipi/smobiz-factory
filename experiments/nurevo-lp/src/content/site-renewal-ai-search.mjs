// Content page: for web agencies - how to redesign, rebuild or move a client
// site (new theme / CMS, URL changes, http->https, domain change, merging
// sites) without losing the pages AI search answers cite: inventory of the
// AI-facing assets, the URL map and redirects (Google's documented rules),
// AI-specific launch checks (crawler access on the new host/WAF, staging
// blocks, structured data URLs, llms.txt), WordPress steps with Nurevo AEO,
// measuring before/after, and what to put in the quote/contract.
//
// Written 2026-11-19 (JST). Product facts come from the plugin source
// (experiments/webmcp-canary/wordpress-plugin/webmcp-canary, 0.9.2):
// - nurevo-webmcp.php webmcp_canary_build_local_llms_txt(): /llms.txt lists up
//   to 30 published pages/posts (most recently modified first) with
//   get_permalink(), so new permalinks appear automatically; the "URL" fact
//   is the business URL setting when filled in, otherwise home_url('/').
// - Organization/WebSite JSON-LD url and @id use the business URL setting
//   when filled in, otherwise home_url('/') (around line 6563). Service
//   entries have their own url and reserve_url fields typed by the owner.
// - includes/cli.php: `wp nurevo export [--file=]`, `wp nurevo import <file>`;
//   keys, tokens, plan and connection are never exported/imported (readme).
//   Per-page meta is not in the export (see agency-aeo-client-handover).
// - robots.txt rules are added to WordPress's virtual robots.txt; a physical
//   robots.txt file on the server is served instead (agency-aeo-client-handover).
// - SEO plugin coexistence (readme): with Yoast / Rank Math / AIOSEO / Slim SEO
//   facts are added inside their graph; with a theme's own schema or other
//   setups Nurevo prints its own graph and leaves out what others publish.
// - worker/aeo-sov.mjs (see perplexity-citations): "cited" = the site's own
//   host among the engine's citations.
// Outside facts, read 2026-11-19 (JST):
// - Google "How to move a site" (ja version last updated 2026-09-11 UTC):
//   URL mapping, server-side permanent redirects (301/308), self-referencing
//   canonical, update internal links / hreflang / sitemaps, 404/410 for
//   removed content, no mass redirects to an unrelated page (soft 404), keep
//   redirects as long as possible (generally at least 1 year), Googlebot
//   follows up to 10 hops but redirect directly (or fewer than 5, ideally 3),
//   temporary ranking fluctuation, a few weeks or more for medium sites,
//   "change only one thing at a time", server capacity for heavier crawl.
//   The English version's last-updated date was not read verbatim.
// - Google "Redirects and Google Search" (last updated 2026-11-16 UTC):
//   permanent = 301, 308, instant meta refresh, JS location, crypto redirect;
//   temporary = 302, 303, 307, delayed meta refresh; 301 and other permanent
//   redirects don't cause a loss in PageRank (site-move page); prefer
//   server-side permanent redirects.
// - Search Console Change of Address tool help: domain/subdomain moves only
//   (not http->https, path changes, www/non-www, hosting); owner of both
//   properties; 301 from old homepage; 180 days; keep redirects at least 180
//   days and longer while traffic remains; old site not erased from index.
// - Perplexity crawlers docs (read 2026-11-18 for perplexity-citations):
//   changes may take up to 24 hours; WAF rules should match user agent and
//   the published IP ranges.
// - Search Console generative AI performance report help (read for
//   google-ai-overviews-citations): available to all sites as of 2026-08-31.
// - Top articles read (ja): uravation (2026-07-12, upd 2026-09-05), jinrai
//   (2026-04-14, upd 2026-11-10), issoh (2026-07-10, upd 2026-11-16), mobinc
//   (2026-02-14), MarkeZine (2025-05-29, page 1 only); stock-sun not readable.
//   (en): Codal (2026-03-24), MaxAEO (2026-08-11, upd 2026-11-14), Vincent
//   Schmalbach (2026-11-11), Koozai (2026-05-13), eSEOspace (2026-10-13),
//   Answerburst/Moburst (2026-08-14), BrightEdge (2025).
// Not stated on purpose: days until each AI engine cites the new URL (only
// vendor data), how ChatGPT / Perplexity / Claude handle redirects (no
// official documentation found), Bing's site move steps and Bing's AI report
// (primary pages not read in this run), market prices for migration work.
const WP_ORG = "https://wordpress.org/plugins/nurevo-webmcp/";
const PARTNER = "https://nurevo.jp/partner/";
const SRC = {
  moveJa: "https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes?hl=ja",
  moveEn: "https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes",
  redirectsJa: "https://developers.google.com/search/docs/crawling-indexing/301-redirects?hl=ja",
  redirectsEn: "https://developers.google.com/search/docs/crawling-indexing/301-redirects",
  coaJa: "https://support.google.com/webmasters/answer/9370220?hl=ja",
  coaEn: "https://support.google.com/webmasters/answer/9370220?hl=en",
  pplxCrawlers: "https://docs.perplexity.ai/docs/resources/perplexity-crawlers",
  reportJa: "https://support.google.com/webmasters/answer/16984139?hl=ja",
  reportEn: "https://support.google.com/webmasters/answer/16984139?hl=en",
  richResults: "https://search.google.com/test/rich-results",
  maxaeo: "https://maxaeo.ai/blog/site-migration-ai-visibility/",
};

const REDIRECTS = `# Apache（.htaccess）: ページのURLが変わったとき（1ページずつ、移転先へ直接）
Redirect 301 /service.html https://www.example.jp/services/
Redirect 301 /company/access.html https://www.example.jp/access/

# Apache: ドメインを変えたとき（パスは同じ）
RewriteEngine On
RewriteCond %{HTTP_HOST} ^(www\\.)?old-example\\.jp$ [NC]
RewriteRule ^(.*)$ https://www.example.jp/$1 [R=301,L]

# nginx: ドメインを変えたとき（旧ドメインの server ブロック）
return 301 https://www.example.jp$request_uri;`;

const REDIRECTS_EN = `# Apache (.htaccess): a page URL changed (one rule per page, straight to the target)
Redirect 301 /service.html https://www.example.com/services/
Redirect 301 /company/access.html https://www.example.com/access/

# Apache: the domain changed (paths stay the same)
RewriteEngine On
RewriteCond %{HTTP_HOST} ^(www\\.)?old-example\\.com$ [NC]
RewriteRule ^(.*)$ https://www.example.com/$1 [R=301,L]

# nginx: the domain changed (server block of the old domain)
return 301 https://www.example.com$request_uri;`;

const CHECKS = `# 1. 旧URLが1回で新URLへ恒久的に転送されるか（転送の回数とステータスを全部表示）
curl -sIL https://old-example.jp/service.html | grep -i -E "^HTTP|^location"

# 2. 新サイトのAI向けの出力
curl -s https://www.example.jp/robots.txt
curl -s https://www.example.jp/llms.txt | head -20
wp nurevo status

# 3. データベースに旧ドメインが残っていないか（まず --dry-run で件数だけ見る）
wp search-replace 'https://old-example.jp' 'https://www.example.jp' --dry-run

# 4. 公開前のサイトから設定を移す（キー・トークン・プランは入らない）
wp nurevo export --file=nurevo-settings.json   # 旧サイト・ステージングで
wp nurevo import nurevo-settings.json          # 新サイトで`;

const CHECKS_EN = `# 1. Does the old URL reach the new one in a single permanent redirect? (shows every hop)
curl -sIL https://old-example.com/service.html | grep -i -E "^HTTP|^location"

# 2. AI-facing output on the new site
curl -s https://www.example.com/robots.txt
curl -s https://www.example.com/llms.txt | head -20
wp nurevo status

# 3. Is the old domain still in the database? (look at the counts with --dry-run first)
wp search-replace 'https://old-example.com' 'https://www.example.com' --dry-run

# 4. Move the settings from the old site or staging (keys, tokens and the plan are not included)
wp nurevo export --file=nurevo-settings.json   # on the old site / staging
wp nurevo import nurevo-settings.json          # on the new site`;

export default {
  slug: "site-renewal-ai-search",
  targetQueries: [
    "サイトリニューアル AI検索 対策",
    "ホームページ リニューアル 引用 ChatGPT 消えた",
    "ドメイン変更 AI検索 リダイレクト",
    "website migration AI search citations",
    "site redesign keep AI Overviews ChatGPT citations",
    "domain change AI visibility redirects",
  ],
  related: ["agency-aeo-client-handover", "ai-visibility-drop-causes", "google-ai-overviews-citations", "llms-txt", "measure-ai-visibility"],
  locales: {
    ja: {
      title: "リニューアルでAI検索の出典を失わない手順：制作会社向け | Nurevo",
      description: "制作会社がサイトのリニューアル・ドメイン変更をするときに、ChatGPT・Perplexity・GoogleのAI機能に引用されたページを失わない手順。棚卸し、URL対応表と301、公開日の確認、WordPressでの作業、前後の測り方。",
      h1: "サイトリニューアルでAI検索の出典を失わない手順：制作会社が公開前・公開日・公開後にやること",
      lead: "リニューアルでAI検索の出典を失わないためには、①公開前に、AIの回答に引用されているURLと、構造化データ・llms.txt・robots.txtなどAI向けの出力を棚卸しし、②旧URLから新URLへ1対1のサーバー側の恒久的なリダイレクト（301か308）を用意し、③公開日に、新しいサーバーでAIのクローラーが止められていないか、構造化データやllms.txtに旧URLが残っていないかを確かめ、④同じ質問で前後を測ります。リダイレクトの決まりはGoogleが公開していますが、ChatGPT・Perplexity・Claudeがリダイレクトをどう扱うかの公式の説明は見つかりません。だからこそ、AIがどのURLを読みに来ても同じ事実にたどり着ける状態を、公開日に作っておくことが大切です。",
      intro: [
        "作成日：2026年11月19日（JST）。対象は、お客様のサイトのリニューアル、テーマやCMSの入れ替え、常時SSL化、ドメイン変更、複数サイトの統合を請け負う制作会社・SEO会社・WordPress保守会社です。契約を終えて別の会社にサイトを渡す場合は[AI検索対策の解約・引き継ぎの手順](/guide/agency-aeo-client-handover)を、リニューアルの後にAIでの表示が落ちた原因を探す場合は[AIでの表示が下がったときの原因](/guide/ai-visibility-drop-causes)を見てください。",
        "AIの回答は日や聞き方によって変わります。この記事の手順は、リニューアルで引用されていたページや事実が消えたり食い違ったりしないようにするためのもので、リニューアル後もAIの回答に出ることや、出る日数を保証するものではありません。",
      ],
      sections: [
        {
          heading: "よく読まれているリニューアルの記事と、足りないこと",
          paragraphs: [
            "「サイトリニューアル SEO」「サイトリニューアル AI検索」「website migration AI search」で上位に出る日本語5本と英語7本を、2026年11月19日に読みました（日本語のもう1本は取得できず）。301リダイレクトを使うこと、旧URLと新URLを1対1で対応させること、リダイレクトを1年以上残すことは、ほぼすべての記事が一致しています。一方で、次の点はほとんどの記事に書かれていませんでした。",
          ],
          table: {
            head: ["足りない点", "この記事で書いていること"],
            rows: [
              ["日本語の記事の多くはGoogleの順位だけを扱い、AIのクローラー・llms.txt・構造化データに触れていない（触れていたのは1本）", "AI向けの出力を棚卸しの表に入れ、公開日に確かめる手順にした"],
              ["英語の記事はAI検索を扱うが、WordPressでの手順がない", "WordPressでの作業（旧ドメインの置き換え、設定の移し方、仮想のrobots.txtと実ファイル）を書いた"],
              ["構造化データは「引き継ぐ」とだけ書かれ、URLが入っている場所の話がない", "会社のURL・@id・サービスのURLなど、ドメインを変えると古くなる項目を挙げた"],
              ["新しいサーバー・CDN・WAFでAIのクローラーが止められていないかを確かめる記事が少ない", "公開日の確認表に入れた"],
              ["「AIが新しいURLを引用するまで◯週間」という数字が出典なし、または1社の自社データ", "日数は書かず、同じ質問で前後を測る方法を書いた"],
            ],
            caption: "記事ごとの良し悪しではなく、抜けやすい点をまとめています。Googleのリダイレクトの決まりは、日本語の記事でもよく整理されていました。",
          },
        },
        {
          heading: "まず、変更の種類を分ける",
          paragraphs: [
            `Googleは「URLが変わるサイト移転」と「URLが変わらない移転（サーバーの引っ越しなど）」を分けて手順を書いています（[Google 検索セントラル：サイトを移転する](${SRC.moveJa})）。AI検索でも同じで、URLが変わるかどうかで作業の量が大きく変わります。`,
          ],
          table: {
            head: ["変更", "例", "必要な作業", "アドレス変更ツール"],
            rows: [
              ["URLは変わらない", "サーバーの引っ越し、テーマの入れ替え、デザインの変更", "リダイレクトは不要。新しいサーバー・テーマで構造化データ・robots.txt・llms.txt・本文の事実が同じか確かめる", "使わない"],
              ["ページのURLが変わる", "/service.html → /services/、パーマリンクの変更", "URL対応表と1対1の301。内部リンク・サイトマップ・canonicalを新URLに", "使わない"],
              ["http → https", "常時SSL化", "全URLを https へ301。混在がないか確かめる", "使わない"],
              ["ドメインが変わる", "old-example.jp → example.jp、社名変更", "上のすべて＋旧ドメインを残して転送を続ける。構造化データ・llms.txtの会社のURLを直す", "使う（ドメイン・サブドメインの移転だけが対象）"],
              ["サイトの統合", "店舗ごとのサイトを1つに", "残すページを決め、統合されるページを内容の近いページへ301。対応する内容がないページは404か410", "ドメインごと移すなら使う"],
            ],
            caption: `アドレス変更ツールの対象は、Search Consoleのヘルプによります（[アドレス変更ツール](${SRC.coaJa})）。http→https、サイト内のパスの変更、www の有無、URLが変わらないサーバーの変更には使いません。`,
          },
          after: [
            "Googleは「一度に1つだけ変える」ことを勧めています。デザインの刷新、URLの変更、ドメインの変更、本文の書き直しを同じ日に行うと、AIでの表示が変わったときに原因を切り分けられません。予算や日程の都合で一度に行う場合も、少なくとも「URLと本文の事実は同じ日に変えない」ように、作業の順番をお客様と決めておくと後で説明しやすくなります。",
          ],
        },
        {
          heading: "公開前①：AI検索に関わるものを棚卸しする",
          paragraphs: [
            "通常のリニューアルの棚卸しは、全URL・検索での流入・被リンクを集めます。Googleも、旧URLの一覧はサイトマップ・サーバーのログ・アナリティクス・Search Consoleのリンクのレポートから集めるよう書いています。AI検索のためには、これに次の行を足します。",
          ],
          table: {
            head: ["棚卸しするもの", "集め方", "なぜ要るか"],
            rows: [
              ["AIの回答で引用されているURL", "お客様の業種・地域で実際に聞かれそうな質問を10〜20個決め、ChatGPT・Perplexity・GoogleのAIによる概要で聞き、出典に出たURLを記録する", "通常の流入の多いページと一致しないことがある。引用されているページは、対応表で必ず内容の同じページへ送る"],
              ["AIからの流入があるページ", "アナリティクスで、参照元が chatgpt.com・perplexity.ai などのセッションの入口ページ", "引用されたページのうち、人が実際にクリックしているもの"],
              ["GoogleのAI機能での表示", `Search Consoleの生成AIパフォーマンスレポート（[ヘルプ](${SRC.reportJa})）でページごとの表示回数`, "公開後に新しいプロパティで比べるための基準"],
              ["構造化データ（JSON-LD）", "主なページのソースと[リッチリザルトテスト](" + SRC.richResults + ")。どのプラグイン・テーマ・コードが出しているか", "テーマやSEOプラグインを変えると、出す側が変わって消えたり二重になったりする"],
              ["/llms.txt と /robots.txt", "ブラウザで開いて保存。プラグインが返しているのか、サーバーに実ファイルを置いているのか", "新しいサーバーで実ファイルが置かれていない・古い実ファイルが残る、が起きやすい"],
              ["事実の載ったページ", "料金・営業時間・所在地・対応エリア・会社概要・FAQのページのURLと、載っている値", "AIが答えに使う事実は、デザインを変えても値を変えない。変えるなら公開日とは別の日に"],
            ],
            caption: "AIへの質問の結果は日によって変わります。同じ質問を同じAIに、日を変えて2回以上聞き、両方を記録しておくと、公開後に比べやすくなります。",
          },
        },
        {
          heading: "公開前②：URL対応表とリダイレクトを作る",
          paragraphs: [
            `リダイレクトの扱いは、Googleが詳しく公開しています（[リダイレクトと Google 検索](${SRC.redirectsJa})、[サイトを移転する](${SRC.moveJa})）。要点は次のとおりです。`,
          ],
          list: [
            "できるかぎりサーバー側の恒久的なリダイレクト（301か308）を使う。Googleは、301などの恒久的なリダイレクトでPageRankは失われないとしている。",
            "302・303・307は一時的なリダイレクトとして扱われ、転送先を正規のURLとする手がかりにはならない。戻す予定がないなら恒久的なものを使う。JavaScriptでの転送は、サーバー側やメタリフレッシュができない場合だけ。",
            "旧URLは、内容の対応する新URLへ直接送る。多くの旧URLを関係のないページ（トップページなど）にまとめて送ると、ソフト404として扱われることがある。",
            "対応する内容がなくなったページは、404か410を返す。",
            "転送を何段も重ねない。Googlebotは10回まで追うが、最終の転送先へ直接送ることを勧めている（できない場合も5回未満、できれば3回以下）。",
            "リダイレクトはできるだけ長く、一般に1年以上残す。新しいURLには自分自身を指す canonical を付け、内部リンク・サイトマップ・hreflang を新URLに直す。",
            "移転中は順位が一時的に変動することがあり、中規模のサイトで新しいURLに入れ替わるまで数週間以上かかる。",
          ],
          code: REDIRECTS,
          after: [
            "対応表には「旧URL・新URL・ステータス（301/404/410）・AIで引用されていたか・載っている事実」の列を作ります。AIで引用されていた行は、新URLの本文に同じ事実（料金・時間・住所など）が載っていることまで、行ごとに確かめます。",
            "ChatGPT・Perplexity・Claudeについては、リダイレクトをどう扱い、旧URLの引用をいつ新URLに切り替えるかを説明した公式の資料は見つけられませんでした（2026年11月19日時点）。Googleの決まりに沿って1回の恒久的なリダイレクトにしておけば、どのAIのクローラーが旧URLを読みに来ても、同じ内容のページにたどり着けます。",
          ],
        },
        {
          heading: "公開日：AI検索のために追加で確かめること",
          paragraphs: [
            "通常の公開日の確認（noindex の外し忘れ、ステージングの robots.txt、計測タグ）に加えて、AI検索のために次を確かめます。",
          ],
          table: {
            head: ["確かめること", "起きやすいこと", "確かめ方"],
            rows: [
              ["robots.txt でAI検索のクローラーを止めていないか", "ステージングで入れた Disallow: / がそのまま本番に出る。新しいサーバーに古い実ファイルの robots.txt が置かれる", "https://ドメイン/robots.txt を開き、OAI-SearchBot・PerplexityBot・Claude-SearchBot などの扱いが公開前と同じか見る"],
              ["サーバー・CDN・WAFで止めていないか", "新しいサーバーや CDN のボット対策が初期設定で、AIのクローラーを止める", `UA（名前）だけでなく各社が公開しているIPの範囲で許可する。Perplexityは、設定の反映に最大24時間かかることがあるとしている（[Perplexity：クローラー](${SRC.pplxCrawlers})）`],
              ["構造化データに旧URLが残っていないか", "会社のURL・@id・ロゴ・サービスのURLが、手で入れた旧ドメインのまま", "リッチリザルトテストで主なページを確かめ、ソースで旧ドメインを検索する"],
              ["構造化データが二重・空になっていないか", "新しいテーマが自前の構造化データを出し、SEOプラグインと会社の情報が2つになる。逆に外したプラグインの分が消える", "リッチリザルトテストで、会社・店舗の情報が1つにまとまっているか"],
              ["llms.txt が新URLを指しているか", "手で置いた llms.txt が旧URLのまま残る", "https://ドメイン/llms.txt を開き、リンクが新URLか、リンク先が200を返すか"],
              ["事実が変わっていないか", "デザインの作り直しで、営業時間の表や料金の注記が抜ける", "棚卸しの「事実の載ったページ」の値を、新しいページと1つずつ照らす"],
            ],
          },
        },
        {
          heading: "WordPressでの手順（Nurevo AEOを使っている場合）",
          paragraphs: [
            `WordPressのサイトでは、次の順番で進めると漏れが少なくなります。Nurevo AEO（[WordPress.orgの無料プラグイン](${WP_ORG})）を使っている場合の動きも合わせて書いておきます。`,
          ],
          list: [
            "新しいサイトを別の環境で作る場合は、旧サイトで設定を書き出し（Nurevo AEOのメニューの「設定 › ツール」か wp nurevo export）、新しいサイトで読み込みます。事業の情報・FAQ・サービス・出力のオン・オフが移ります。キー・トークン・プラン・接続は入らないので、接続しているサイトは新しいサイトでつなぎ直します。ページごとの設定（llms.txt や構造化データから外したページ、ページ専用のFAQ）は書き出しに入らないので、データベースごと移さない場合は手で設定し直します。",
            "ドメインを変えたら、データベースに残る旧ドメインを wp search-replace で置き換えます。まず --dry-run で件数を見て、バックアップを取ってから実行します。",
            "Nurevo AEOの設定の「URL」が空欄なら、構造化データの会社のURL・@id と llms.txt の URL は、WordPressのサイトのアドレス（新しいドメイン）が自動で使われます。旧ドメインを手で入れていた場合は、そのまま旧ドメインが出続けるので、新しいドメインに直すか空欄にします。サービスに入れたURLと予約のURLも手で入れた値なので、1つずつ直します。",
            "Nurevo AEOの llms.txt のページの一覧は、公開中の固定ページ・投稿を更新の新しい順に最大30件、今のパーマリンクで作っています。パーマリンクを変えれば一覧も新しいURLになります。",
            "AIのクローラーの許可は、WordPressが自動で作る仮想の robots.txt に足しています。新しいサーバーのドキュメントルートに robots.txt の実ファイルがあると、そちらが返され、許可の行は出ません。実ファイルを使うなら、同じ内容をそのファイルに書きます。",
            "テーマやSEOプラグインを変える場合、Yoast SEO・Rank Math・All in One SEO・Slim SEO と一緒なら、Nurevo AEOはそれらの構造化データの中に足りない事実を足します。テーマが自前の構造化データを出す場合は、それと重ならないように自前のまとまりを出します。入れ替えた後にリッチリザルトテストで1つにまとまっているかを確かめてください。",
          ],
          code: CHECKS,
          after: [
            "curl -sIL の結果で、1行目が 301（または308）、次の location が新URL、最後が 200 になっていれば、1回の恒久的な転送です。302 や、location が2回以上出る場合は直します。なお、curl で UA を変えても、IPの範囲で判定するWAFの動きは確かめられません。WAFはサーバー・CDNの管理画面のログで、AIのクローラーが止められていないかを見ます。",
          ],
        },
        {
          heading: "公開後：前後を測り、旧ドメインを手放さない",
          table: {
            head: ["いつ", "見るもの", "見方"],
            rows: [
              ["公開日〜1週間", "旧URLのリダイレクト、404の増加、サーバーのログのAIのクローラー", "引用されていたURLの行から順に、転送先が200か確かめる。ログでAIのクローラーが403などで止められていないか"],
              ["ドメイン変更の直後", `Search Consoleのアドレス変更ツール（[ヘルプ](${SRC.coaJa})）`, "旧・新の両方のプロパティのオーナーであること、旧トップページから新トップページへの301が条件。180日間、新しいサイトのクロールが優先される"],
              ["毎週〜毎月", "Search Consoleの検索パフォーマンスと生成AIパフォーマンスレポート（旧・新のプロパティ）", "旧の数字が減り、新の数字が増えていくか。公開前の同じ期間と比べる"],
              ["公開前と同じ間隔で", "棚卸しで決めた10〜20の質問", "同じAI・同じ質問で、名前が出たか、出典が旧URL・新URL・他社のどれかを記録する。1回の結果で判断しない"],
              ["1年以上", "旧ドメインの契約とリダイレクト", "Googleはリダイレクトを一般に1年以上残すよう勧め、アドレス変更ツールのヘルプは旧ドメインを少なくとも1年は契約し続けることを勧めている"],
            ],
          },
          after: [
            `「AIが新しいURLを引用するまでの日数」を示す記事もありますが、私たちが確認できたのは、1社が自社の利用者のデータとして示した数字（[MaxAEO](${SRC.maxaeo})）だけでした。お客様への説明には使わず、「同じ質問で測って記録する」と伝えるほうが確実です。`,
            "Nurevo AEOの無料のAIチェック（接続した無料・Standardのサイトで月1回、社名を入れない3問をPerplexityに聞く）とPro（ベータ版、最大20問、現在はPerplexityが対象）は、出典に自分のサイトのホストが入っているかで「引用」を数えます。ドメインを変えた直後は旧ドメインでの引用は自社として数えられないため、その期間は旧ドメインの引用を手で記録しておくと、前後を比べられます。測り方の全体は[AIでの登場率の測り方](/guide/measure-ai-visibility)にまとめています。",
          ],
        },
        {
          heading: "見積もりと契約に入れておくこと（制作会社向け）",
          list: [
            "作業範囲に「AI検索に関わるものの棚卸し（引用されているURL、構造化データ、llms.txt、robots.txt、事実の載ったページ）」と「URL対応表」を、別の行として入れる。デザインの作業に含めると、時間が足りなくなったときに真っ先に削られる。",
            "公開後の確認期間（例：公開後1か月の転送とログの確認、3か月目の質問の記録）を決めて書く。",
            "旧ドメインの契約を誰が、いつまで払うかを決める。転送を1年以上続けるには、旧ドメインとその転送の設定を残す必要がある。",
            "AIの回答は変わるため、リニューアル後にAIに出ることや順位は保証しないこと、前後の測り方と報告の形を書く。",
            "料金・営業時間などの事実の変更は、お客様の確認を取ってから、公開日とは別の日に行うこと。",
          ],
          after: [
            `リニューアルの後も月額でAI検索対策を続ける場合の作業範囲は[AI検索対策を月額サービスにする方法](/guide/agency-aeo-monthly-service)に、制作会社が自社ブランドでお客様に報告する仕組みは[パートナープログラム](${PARTNER})にまとめています。`,
          ],
        },
        {
          heading: "リニューアルのチェックリスト",
          list: [
            "変更の種類（URLが変わらない・パス・https・ドメイン・統合）を決め、一度に変えるものをお客様と決めた。",
            "AIの回答で引用されているURLと、事実の載ったページを棚卸しした。",
            "公開前の基準として、決めた質問の結果と、Search Consoleの数字を記録した。",
            "旧URLから新URLへの1対1の301（または308）を用意し、転送が1回で終わることを確かめた。",
            "対応する内容のないページは404か410にし、トップページへのまとめての転送をしていない。",
            "新しいサイトの robots.txt・サーバー・CDN・WAFで、AI検索のクローラーを止めていない。",
            "構造化データ・llms.txtに旧URLが残っておらず、会社の情報が1つにまとまっている。",
            "内部リンク・サイトマップ・canonical・hreflang を新URLにした。",
            "ドメインを変えた場合、アドレス変更ツールを使い、旧ドメインと転送を1年以上残す段取りをした。",
            "公開後、同じ質問で前後を測り、旧ドメインでの引用も記録している。",
          ],
        },
      ],
      faqs: [
        { q: "リニューアルすると、AIの回答から自社のサイトは消えますか？", a: "必ず消えるわけではありません。ただ、引用されていたURLが404になったり、事実の載った表が抜けたり、新しいサーバーでAIのクローラーが止められたりすると、出典として使われにくくなります。公開前の棚卸しと、公開日の確認で防げることがほとんどです。" },
        { q: "301と302はAI検索でも違いますか？", a: "Googleは、301・308を恒久的、302・303・307を一時的なリダイレクトとして扱うと公開しています。ChatGPT・Perplexity・Claudeの扱いを説明した公式の資料は見つかりませんでしたが、戻す予定のない移転は301か308にしておくのが確実です。" },
        { q: "リダイレクトはいつまで残せばいいですか？", a: "Googleは、できるだけ長く、一般に1年以上残すことを勧めています。ドメインを変えた場合のアドレス変更ツールのヘルプは、少なくとも180日、Google検索からの流入が残っていればそれより長く残し、旧ドメインは少なくとも1年は契約し続けることを勧めています。" },
        { q: "llms.txtはリニューアルでどうすればいいですか？", a: "手で置いたファイルなら、新URLに書き直すか、作り直します。Nurevo AEOのように自動で作る仕組みなら、新しいパーマリンクで作り直されますが、会社のURLなど手で入れた値は旧ドメインのまま残ることがあるので確かめます。" },
        { q: "テーマを変えるだけでもAI検索に影響しますか？", a: "URLが変わらなければリダイレクトは要りませんが、テーマが構造化データを出す・出さないが変わったり、営業時間や料金の表の作りが変わったりします。新しいテーマで構造化データと本文の事実が公開前と同じかを確かめてください。" },
        { q: "公開後、AIが古いURLや古い情報を出し続けます。どうすればいいですか？", a: "まず旧URLが1回の301で新URLに届くか、新しいページに同じ事実が載っているかを確かめます。そのうえで、同じ質問で日を変えて記録を続けます。AIの回答がいつ切り替わるかは公開されていないため、事実の側を正しく保つことがいちばん確実です。" },
        { q: "サイトを統合するとき、統合される側のページはどうしますか？", a: "内容の近いページがあれば、そのページへ301で送ります。対応する内容がなければ404か410を返します。関係のないページ（トップページなど）にまとめて送ると、Googleではソフト404として扱われることがあります。" },
      ],
      relatedHeading: "あわせて読みたい",
      cta: {
        heading: "リニューアルの前と後に、AIがサイトをどう読んでいるか確認",
        body: "無料チェックは登録不要で、URLを入れるだけで構造化データ・llms.txt・AIクローラーの許可の状態がわかります。公開前の基準と、公開日の確認に使えます。",
        label: "無料でAIの読みやすさをチェック",
        href: "/check",
        secondary: { label: "パートナープログラムを見る", href: PARTNER },
      },
      footnote: "ChatGPTはOpenAI、PerplexityはPerplexity AI、ClaudeはAnthropic、Google・Search ConsoleはGoogle LLCの商標です。WordPress、Yoast SEO、Rank Math、All in One SEO、Slim SEO、Apache、nginxはそれぞれの権利者の商標です。Nurevoはこれらの企業と提携・承認の関係にありません。",
    },
    en: {
      title: "Site Redesigns Without Losing AI Search Citations: Agencies | Nurevo",
      description: "Redesign or move a client site without losing pages ChatGPT, Perplexity and Google AI cite: inventory, URL map and 301s, launch checks, WordPress steps.",
      h1: "Redesigning a Site Without Losing AI Search Citations: What Agencies Do Before, On and After Launch",
      lead: "To keep AI search citations through a redesign: before launch, inventory the URLs AI answers cite and the AI-facing output (structured data, llms.txt, robots.txt); map every old URL to its new URL with a one-to-one, server-side permanent redirect (301 or 308); on launch day, check that the new host does not block AI crawlers and that no old URLs remain in the structured data or llms.txt; then measure before and after with the same questions. Google publishes its redirect rules, but we could not find any official explanation of how ChatGPT, Perplexity or Claude handle redirects. That is exactly why launch day should leave the site in a state where any crawler, reading any old or new URL, reaches the same facts.",
      intro: [
        "Written November 19, 2026 (JST). This guide is for web agencies, SEO firms and WordPress care companies that redesign client sites, swap themes or CMSs, move to HTTPS, change domains or merge sites. If you are ending a contract and handing the site to someone else, see [Ending or Handing Over AEO Work](/guide/agency-aeo-client-handover). If AI visibility has already dropped after a launch, see [Why AI Visibility Drops](/guide/ai-visibility-drop-causes).",
        "AI answers change from day to day and with the wording of the question. These steps keep cited pages and facts from disappearing or contradicting each other during a redesign. They do not guarantee that the site will appear in AI answers afterwards, or how quickly.",
      ],
      sections: [
        {
          heading: "What the popular migration guides cover, and what they leave out",
          paragraphs: [
            "On November 19, 2026 we read the five Japanese and seven English articles that rank for \"site renewal SEO\", \"site renewal AI search\" and \"website migration AI search\" (one more Japanese article could not be fetched). Nearly all of them agree on using 301 redirects, mapping old URLs to new ones one to one, and keeping redirects for a year or more. Most of them leave out the following.",
          ],
          table: {
            head: ["What is missing", "What this guide adds"],
            rows: [
              ["Most Japanese guides cover Google rankings only, with nothing on AI crawlers, llms.txt or structured data (one of five did)", "AI-facing output is part of the inventory and of the launch-day checks"],
              ["The English guides cover AI search but give no WordPress steps", "WordPress steps: replacing the old domain, moving settings, virtual vs physical robots.txt"],
              ["Structured data is \"carried over\", with nothing on where URLs live inside it", "The fields that go stale on a domain change: organization URL, @id, service URLs"],
              ["Few guides check whether the new host, CDN or WAF blocks AI crawlers", "A launch-day check for it"],
              ["\"AI engines cite the new URL within N weeks\" figures are unsourced or one vendor's own data", "No day counts; a way to measure before and after with the same questions"],
            ],
            caption: "This is about what tends to be missing, not a ranking of the articles. Google's redirect rules were well covered, including in the Japanese guides.",
          },
        },
        {
          heading: "First, name the kind of change",
          paragraphs: [
            `Google separates site moves with URL changes from moves without them, such as changing hosts ([Google Search Central: How to move a site](${SRC.moveEn})). The same split decides how much AI search work a project needs.`,
          ],
          table: {
            head: ["Change", "Example", "What it needs", "Change of Address tool"],
            rows: [
              ["URLs stay the same", "New host, new theme, new design", "No redirects. Check that structured data, robots.txt, llms.txt and the facts on the page match the old site", "No"],
              ["Page URLs change", "/service.html to /services/, new permalinks", "URL map and one-to-one 301s; internal links, sitemaps and canonicals updated", "No"],
              ["HTTP to HTTPS", "Moving the whole site to HTTPS", "301 every URL to HTTPS; check for mixed content", "No"],
              ["Domain changes", "old-example.com to example.com, rebrand", "All of the above, plus keep the old domain redirecting. Fix the organization URL in structured data and llms.txt", "Yes (domain and subdomain moves only)"],
              ["Sites are merged", "One site per branch becomes one site", "Decide which pages stay; 301 merged pages to the closest page; 404 or 410 where nothing matches", "Yes if a whole domain moves"],
            ],
            caption: `Change of Address scope is from the Search Console help ([Change of Address tool](${SRC.coaEn})): it is not for HTTP to HTTPS, path changes within a site, www vs non-www, or host changes with the same URLs.`,
          },
          after: [
            "Google recommends changing only one thing at a time. If the design, URLs, domain and copy all change on the same day, there is no way to tell which change moved the AI answers. When budget or timing forces a single launch, at least agree with the client that URLs and factual content will not change on the same day. It makes the result much easier to explain later.",
          ],
        },
        {
          heading: "Before launch, part 1: inventory what AI search relies on",
          paragraphs: [
            "A normal migration inventory collects every URL, its search traffic and its backlinks. Google suggests building the old URL list from sitemaps, server logs, analytics and the Search Console links report. For AI search, add these rows.",
          ],
          table: {
            head: ["What to inventory", "How to collect it", "Why it matters"],
            rows: [
              ["URLs cited in AI answers", "Pick 10 to 20 questions customers in that trade and area would really ask, ask them in ChatGPT, Perplexity and Google AI Overviews, and record the cited URLs", "They are not always the pages with the most search traffic. Every cited URL must redirect to a page with the same content"],
              ["Pages that receive AI referrals", "In analytics, landing pages of sessions referred by chatgpt.com, perplexity.ai and similar", "The cited pages people actually click"],
              ["Google AI features", `Impressions per page in the Search Console generative AI performance report ([help](${SRC.reportEn}))`, "The baseline to compare with the new property after launch"],
              ["Structured data (JSON-LD)", "Page source of the key pages and the [Rich Results Test](" + SRC.richResults + "); which plugin, theme or code prints it", "A new theme or SEO plugin changes who prints it, so data disappears or doubles"],
              ["/llms.txt and /robots.txt", "Open and save both; note whether a plugin serves them or a physical file sits on the server", "New hosts often lack the physical file, or carry an outdated one"],
              ["Pages that carry facts", "URLs and values of pricing, hours, address, service area, company profile and FAQ pages", "The facts AI answers use should keep their values through a redesign. If they must change, change them on a different day"],
            ],
            caption: "AI answers vary by day. Ask each question in the same AI on two or more days and record both, so the post-launch comparison is fair.",
          },
        },
        {
          heading: "Before launch, part 2: build the URL map and redirects",
          paragraphs: [
            `Google documents redirects in detail ([Redirects and Google Search](${SRC.redirectsEn}), [How to move a site](${SRC.moveEn})). The essentials:`,
          ],
          list: [
            "Use server-side permanent redirects (301 or 308) wherever possible. Google states that 301 and other permanent redirects don't cause a loss in PageRank.",
            "302, 303 and 307 are treated as temporary and do not signal that the target should be canonical. If the move will not be reverted, use a permanent redirect. Use JavaScript redirects only when server-side or meta refresh redirects are impossible.",
            "Send each old URL straight to the new URL with matching content. Redirecting many old URLs to an unrelated page, such as the home page, may be treated as a soft 404.",
            "Return 404 or 410 for content that no longer exists.",
            "Avoid chains. Googlebot follows up to 10 hops, but Google recommends redirecting directly to the final target (if that is impossible, fewer than 5 hops, ideally 3 or fewer).",
            "Keep redirects as long as possible, generally at least a year. Give each new URL a self-referencing canonical, and update internal links, sitemaps and hreflang to the new URLs.",
            "Expect temporary ranking fluctuation; a medium-sized site can take a few weeks or more before the new URLs replace the old ones.",
          ],
          code: REDIRECTS_EN,
          after: [
            "Give the URL map these columns: old URL, new URL, status (301/404/410), cited by AI (yes/no), and the facts on the page. For every row that was cited, confirm the new page carries the same facts (prices, hours, address).",
            "For ChatGPT, Perplexity and Claude, we found no official documentation on how they handle redirects or when they switch a citation from the old URL to the new one (as of November 19, 2026). A single permanent redirect that follows Google's rules means any AI crawler that reads an old URL still lands on the page with the same content.",
          ],
        },
        {
          heading: "Launch day: extra checks for AI search",
          paragraphs: [
            "On top of the usual launch checks (leftover noindex, staging robots.txt, analytics tags), check the following for AI search.",
          ],
          table: {
            head: ["Check", "What often goes wrong", "How to check"],
            rows: [
              ["robots.txt does not block AI search crawlers", "The staging Disallow: / ships to production, or an old physical robots.txt is copied to the new host", "Open https://domain/robots.txt and compare OAI-SearchBot, PerplexityBot, Claude-SearchBot and similar with the pre-launch copy"],
              ["Host, CDN and WAF do not block them", "Default bot protection on the new host or CDN blocks AI crawlers", `Allow by the IP ranges each company publishes, not only by user agent. Perplexity says changes may take up to 24 hours to apply ([Perplexity crawlers](${SRC.pplxCrawlers}))`],
              ["No old URLs in structured data", "Organization URL, @id, logo or service URLs still hold the hand-typed old domain", "Run key pages through the Rich Results Test and search the source for the old domain"],
              ["Structured data is neither doubled nor empty", "The new theme prints its own schema next to the SEO plugin's, or a removed plugin's data disappears", "Rich Results Test: one business entity per page"],
              ["llms.txt points to new URLs", "A hand-made llms.txt still lists old URLs", "Open https://domain/llms.txt; links should be new URLs that return 200"],
              ["Facts are unchanged", "The rebuilt page drops the hours table or a pricing note", "Compare each value in the inventory's fact pages with the new page"],
            ],
          },
        },
        {
          heading: "WordPress steps (with Nurevo AEO)",
          paragraphs: [
            `On WordPress, this order leaves the fewest gaps. Where Nurevo AEO (the [free plugin on WordPress.org](${WP_ORG})) is installed, its behaviour is noted too.`,
          ],
          list: [
            "If the new site is built in a separate environment, export the settings on the old site (Nurevo AEO menu, Settings > Tools, or wp nurevo export) and import them on the new one. Business details, FAQ, services and output switches move across. Keys, tokens, the plan and the connection do not, so a connected site must be reconnected on the new install. Per-page settings (pages left out of llms.txt or structured data, page-specific FAQ) are not in the export; if the database is not moved, set them again by hand.",
            "After a domain change, replace the old domain left in the database with wp search-replace. Look at the counts with --dry-run first, and take a backup before running it.",
            "If Nurevo AEO's \"URL\" setting is empty, the organization URL and @id in the structured data and the URL line in llms.txt use the WordPress site address, so they follow the new domain. If the old domain was typed in, it keeps being published: change it to the new domain or clear it. Service URLs and booking URLs are typed values too, so fix them one by one.",
            "Nurevo AEO builds the page list in llms.txt from up to 30 published pages and posts, most recently updated first, using their current permalinks. Change the permalinks and the list follows.",
            "Nurevo AEO adds its AI crawler rules to the virtual robots.txt WordPress generates. If the new host has a physical robots.txt in the document root, that file is served instead and the rules do not appear. If you use a physical file, put the same rules in it.",
            "When the theme or SEO plugin changes: alongside Yoast SEO, Rank Math, All in One SEO or Slim SEO, Nurevo AEO adds the missing facts inside their structured data; next to a theme's own schema it prints its own graph and leaves out what is already there. After the switch, use the Rich Results Test to confirm one business entity per page.",
          ],
          code: CHECKS_EN,
          after: [
            "In the curl -sIL output, a single permanent redirect looks like this: the first status is 301 (or 308), the location is the new URL, and the last status is 200. Fix anything that returns 302 or shows more than one location. Changing the user agent in curl does not test a WAF that decides by IP range; for that, check the host or CDN logs for blocked AI crawlers.",
          ],
        },
        {
          heading: "After launch: measure before and after, and keep the old domain",
          table: {
            head: ["When", "What to look at", "How"],
            rows: [
              ["Launch day to one week", "Redirects, new 404s, AI crawlers in the server logs", "Start with the rows that were cited and confirm each target returns 200. Check that AI crawlers are not getting 403s"],
              ["Right after a domain change", `Search Console Change of Address tool ([help](${SRC.coaEn}))`, "Requires owning both properties and a 301 from the old home page to the new one. For 180 days Google emphasizes crawling the new site"],
              ["Weekly to monthly", "Search Console performance and the generative AI performance report, old and new properties", "Old numbers should fall and new ones rise. Compare with the same period before launch"],
              ["At the pre-launch interval", "The 10 to 20 questions from the inventory", "Same AI, same questions: record whether the business is named and whether the source is the old URL, the new URL or someone else. Do not judge from one run"],
              ["A year or more", "The old domain and its redirects", "Google recommends keeping redirects generally at least a year, and the Change of Address help recommends paying for the old domain for at least a year"],
            ],
          },
          after: [
            `Some articles give the number of days before AI engines cite the new URL. The only figures we could trace were one vendor's data from its own customers ([MaxAEO](${SRC.maxaeo})). Do not quote them to clients; promising to measure the same questions and record the result is safer.`,
            "Nurevo AEO's free AI check (connected Free and Standard sites; once a month, three questions without the business name, asked in Perplexity) and Pro (beta, up to 20 questions, currently Perplexity) count a citation when the site's own host is among the sources. Right after a domain change, citations of the old domain are not counted as yours, so record them by hand for that period to keep the before-and-after comparison. The full method is in [How to Measure AI Visibility](/guide/measure-ai-visibility).",
          ],
        },
        {
          heading: "What to put in the quote and the contract (for agencies)",
          list: [
            "List \"AI search inventory (cited URLs, structured data, llms.txt, robots.txt, fact pages)\" and \"URL map\" as their own line items. Folded into design work, they are the first thing cut when time runs short.",
            "Define a post-launch check period (for example, redirect and log checks for one month after launch, and a question run in month three).",
            "Decide who pays for the old domain, and until when. Keeping redirects for a year or more means keeping the old domain and its redirect setup.",
            "State that AI answers change, so the redesign does not guarantee appearing in AI answers or any position, and describe how before and after will be measured and reported.",
            "Change facts such as prices or hours only after client approval, and on a different day from the launch.",
          ],
          after: [
            `For continuing AI search work monthly after the launch, see [How Agencies Can Offer AI Search Optimization Monthly](/guide/agency-aeo-monthly-service). For branded client reporting, see the [partner program](${PARTNER}).`,
          ],
        },
        {
          heading: "Redesign checklist",
          list: [
            "The kind of change (same URLs, paths, HTTPS, domain, merge) and what changes at once are agreed with the client.",
            "URLs cited in AI answers and the pages that carry facts are inventoried.",
            "Pre-launch baselines are recorded: the question results and the Search Console numbers.",
            "One-to-one 301 (or 308) redirects from old to new URLs are in place and resolve in a single hop.",
            "Pages with no matching content return 404 or 410; nothing is mass-redirected to the home page.",
            "The new site's robots.txt, host, CDN and WAF do not block AI search crawlers.",
            "No old URLs remain in structured data or llms.txt, and each page has one business entity.",
            "Internal links, sitemaps, canonicals and hreflang point to the new URLs.",
            "For a domain change, the Change of Address tool is used and the old domain and redirects are kept for a year or more.",
            "After launch, the same questions are measured before and after, including citations of the old domain.",
          ],
        },
      ],
      faqs: [
        { q: "Will a redesign remove our site from AI answers?", a: "Not necessarily. But when a cited URL starts returning 404, a table of facts is dropped, or the new host blocks AI crawlers, the site becomes less likely to be used as a source. A pre-launch inventory and launch-day checks prevent most of this." },
        { q: "Do 301 and 302 differ for AI search too?", a: "Google documents 301 and 308 as permanent and 302, 303 and 307 as temporary. We found no official documentation from ChatGPT, Perplexity or Claude, so for a move you will not revert, a 301 or 308 is the safe choice." },
        { q: "How long should redirects stay in place?", a: "Google recommends as long as possible, generally at least a year. For domain changes, the Change of Address help says to keep redirects for at least 180 days, longer while Google Search still sends traffic to them, and to keep paying for the old domain for at least a year." },
        { q: "What should we do with llms.txt?", a: "If it is a hand-made file, rewrite it with the new URLs or regenerate it. If a plugin such as Nurevo AEO builds it, the list follows the new permalinks, but hand-typed values such as the organization URL may still hold the old domain, so check them." },
        { q: "Does changing only the theme affect AI search?", a: "With unchanged URLs no redirects are needed, but the new theme may print or drop structured data, and tables of hours or prices may be rebuilt differently. Check that structured data and on-page facts match the old site." },
        { q: "After launch, AI keeps showing old URLs or old information. What now?", a: "First confirm that the old URL reaches the new one in a single 301 and that the new page carries the same facts. Then keep recording the same questions on different days. When AI answers switch over is not published, so keeping the facts right is the most reliable lever." },
        { q: "When merging sites, what happens to the pages being merged?", a: "Redirect each one with a 301 to the page with the closest content. If nothing matches, return 404 or 410. Redirecting them all to an unrelated page such as the home page may be treated by Google as a soft 404." },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "See how AI reads the site before and after the launch",
        body: "The free check needs no sign-up: enter a URL to see the state of its structured data, llms.txt and AI crawler access. Use it for the pre-launch baseline and the launch-day check.",
        label: "Check AI readability for free",
        href: "/check",
        secondary: { label: "See the partner program", href: PARTNER },
      },
      footnote: "ChatGPT is a trademark of OpenAI, Perplexity of Perplexity AI, Claude of Anthropic, and Google and Search Console of Google LLC. WordPress, Yoast SEO, Rank Math, All in One SEO, Slim SEO, Apache and nginx are trademarks of their respective owners. Nurevo is not affiliated with or endorsed by any of these companies.",
    },
  },
};
