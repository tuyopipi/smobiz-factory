/**
 * Regenerate the Nurevo AEO plugin translation catalogs from the plugin source.
 *
 * The .pot is extracted from the PHP so it cannot drift from the code, then the
 * ja and en_US catalogs are emitted from it. Run `npm run i18n` after changing
 * any translatable string. Japanese strings that are already literal Japanese
 * in the source pass through unchanged.
 */
import fs from "node:fs";
import path from "node:path";

const PLUGIN_DIR = "wordpress-plugin/webmcp-canary";
const SOURCE = `${PLUGIN_DIR}/nurevo-webmcp.php`;
const LANG_DIR = `${PLUGIN_DIR}/languages`;
const DOMAIN = "nurevo-webmcp";
const TEXT_DOMAIN = "nurevo-webmcp";

// __('text', 'domain') / esc_html__ / esc_attr__ / _e / esc_html_e, single or double quoted.
const CALL = /\b(?:esc_html__|esc_attr__|esc_html_e|esc_attr_e|__|_e)\(\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")\s*,\s*'([^']+)'\s*\)/g;

function phpUnquote(literal) {
  const body = literal.slice(1, -1);
  return literal.startsWith("'")
    ? body.replace(/\\(['\\])/g, "$1")
    : body.replace(/\\(["\\$])/g, "$1").replace(/\\n/g, "\n").replace(/\\t/g, "\t");
}

function poQuote(value) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
}

// The main file plus the include files (REST route, WP-CLI commands).
const INCLUDES_DIR = `${PLUGIN_DIR}/includes`;
const SOURCES = [
  SOURCE,
  ...(fs.existsSync(INCLUDES_DIR)
    ? fs.readdirSync(INCLUDES_DIR).filter((name) => name.endsWith(".php")).sort().map((name) => `${INCLUDES_DIR}/${name}`)
    : []),
];

/** msgid -> sorted unique source references */
const entries = new Map();
for (const file of SOURCES) {
  const source = fs.readFileSync(file, "utf8");
  const lineOf = (index) => source.slice(0, index).split("\n").length;
  for (const match of source.matchAll(CALL)) {
    if (match[2] !== TEXT_DOMAIN) continue;
    const msgid = phpUnquote(match[1]);
    if (msgid === "") continue;
    const reference = `${file}:${lineOf(match.index)}`;
    const existing = entries.get(msgid);
    if (existing) existing.add(reference);
    else entries.set(msgid, new Set([reference]));
  }
}

// Japanese for the English source strings. Strings already written in Japanese
// in the source are passed through, so they do not need an entry here.
const JA = {
  "WebMCP tag settings": "WebMCPタグ設定",
  "Enable tag": "タグを有効化",
  "Allow AI crawlers in robots.txt": "robots.txtでAIクローラーを許可",
  "Serve /llms.txt": "/llms.txt を配信",
  "Output JSON-LD schema (server-side)": "JSON-LD構造化データをサーバー側で出力",
  "SEO plugin compatibility": "SEOプラグイン共存",
  "Store / organization information": "店舗 / 組織情報",
  "External tag.js URL": "外部tag.js URL",
  "API key / site key": "APIキー / サイトキー",
  "Nurevo site ID": "NurevoサイトID",
  "License key": "ライセンスキー",
  "Owner email": "所有者メールアドレス",
  "Admin token": "管理トークン",
  "Nurevo AEO": "Nurevo AEO",
  "AEO Score": "AEOスコア",
  "Technical report": "技術レポート",
  "Dashboard": "ダッシュボード",
  "Settings": "設定",
  "Load WebMCP tag on public pages": "公開ページでWebMCPタグを読み込む",
  "Explicitly allow major AI search and training crawlers in the virtual robots.txt file":
    "仮想robots.txtで主要なAI検索・学習クローラーを明示的に許可します",
  "Serve llms.txt at this site’s /llms.txt URL (generated locally; no license required)":
    "このサイトの /llms.txt でllms.txtを配信します（プラグイン内で生成・ライセンス不要）",
  "Avoid schema types already emitted by an active SEO plugin (recommended)":
    "稼働中のSEOプラグインが既に出力しているschemaの型を回避します（推奨）",
  "Detected: %s": "検知: %s",
  "Built from this site content. Requires the WebMCP tag to be enabled.":
    "このサイトの内容から生成します。WebMCPタグの有効化が必要です。",
  "Values are inferred from existing local SEO settings, WordPress settings, and clearly labelled public content. Automatic extraction is an estimate; verify before relying on it. Existing Nurevo values are never overwritten.":
    "既存のローカルSEO設定、WordPressの設定、明確にラベル付けされた公開本文から推定します。自動抽出は推定値のため、内容を確認してからご利用ください。Nurevoに入力済みの値は上書きしません。",
  "The plugin does not bundle tag.js. Updating this hosted file updates all installed sites.":
    "このプラグインはtag.jsを同梱しません。ホストされたファイルを更新すると、インストール済みのすべてのサイトに反映されます。",
  "Sent to the WebMCP server as a site authorization key. Do not use a privileged server secret here.":
    "サイト認証キーとしてWebMCPサーバーに送信されます。権限の強いサーバーシークレットはここに入力しないでください。",
  "Site ID used by the registered-site AEO score endpoint. It is separate from the site key.":
    "登録済みサイト向けAEOスコアAPIで使用するサイトIDです。サイトキーとは別物です。",
  "Separate from the site key. It is verified when these settings are saved. Current plan:":
    "サイトキーとは別です。この設定を保存したときに検証されます。現在のプラン:",
  "License verified. Plan: %s": "ライセンスを確認しました。プラン: %s",
  "License active. Plan: %1$s. This site is registered as %2$s.":
    "ライセンスが有効です。プラン: %1$s。このサイトは %2$s として登録されました。",
  "This license has no seats left. Release another site from the Nurevo dashboard, or use a license with more seats.":
    "このライセンスは利用枠がいっぱいです。Nurevoダッシュボードで他のサイトを解除するか、枠の多いライセンスをご利用ください。",
  "This license is not attached to an account yet. Please contact Nurevo support.":
    "このライセンスはまだアカウントに紐付いていません。Nurevoサポートまでお問い合わせください。",
  "This site has no public domain to register. A license can only be activated on a publicly reachable site.":
    "このサイトには登録できる公開ドメインがありません。ライセンスは公開されているサイトでのみ有効化できます。",
  "Too many activation attempts. Please wait and try again.":
    "有効化の試行回数が多すぎます。しばらく待ってから再度お試しください。",
  "The license key is invalid or inactive.": "ライセンスキーが無効か、有効化されていません。",
  "The license could not be verified. The previously verified plan remains active.":
    "ライセンスを検証できませんでした。直前に確認済みのプランを維持します。",
  "The license server is not configured.": "ライセンスサーバーが設定されていません。",
  "Used only when issuing a free site key from the WebMCP server.":
    "WebMCPサーバーから無料サイトキーを発行するときにのみ使用されます。",
  "Only used by this WordPress admin screen for protected management actions such as key rotation and disablement. It is never printed on public pages.":
    "キーのローテーションや無効化など、保護された管理操作のためにWordPress管理画面だけで使用されます。公開ページには出力されません。",
  "AI visibility": "AIでの露出測定",
  "Nurevo AEO settings": "Nurevo AEO 設定",
  "Enable Nurevo AEO": "Nurevo AEO を有効化",
  "Output AI-facing information for this site": "このサイトのAI向け情報を出力する",
  "Applied only while Nurevo AEO is enabled and the site is visible to search engines.":
    "Nurevo AEO が有効で、かつサイトが検索エンジンに公開されている場合にのみ適用されます。",
  "Requires Nurevo AEO to be enabled.": "Nurevo AEO の有効化が必要です。",
  "Built from this site content. Requires Nurevo AEO to be enabled.":
    "このサイトの内容から生成します。Nurevo AEO の有効化が必要です。",
  "Nurevo service URL": "NurevoサービスURL",
  "Base URL of the Nurevo service this site talks to. Change only when instructed.":
    "このサイトが接続するNurevoサービスのURLです。指示があった場合のみ変更してください。",
  "Site key": "サイトキー",
  "Identifies this site to the Nurevo service. Not a privileged secret.":
    "Nurevoサービスに対してこのサイトを識別するキーです。権限の強い秘密情報ではありません。",
  "Used only when issuing a site key from the Nurevo service.":
    "Nurevoサービスからサイトキーを発行するときにのみ使用されます。",
  "AI readability diagnosis, structured data, llms.txt and AI crawler rules for this site.":
    "このサイトのAI可読性診断・構造化データ・llms.txt・AIクローラー許可の設定です。",
  "Diagnostic state for this install. Nothing here needs to be changed for normal use.":
    "このインストールの診断状態です。通常のご利用で変更する必要はありません。",
  "Plan": "プラン",
  "Site key configured": "サイトキー設定済み",
  "License key configured": "ライセンスキー設定済み",
  "Service endpoints": "サービスURL",
  "Central ruleset version": "中央rulesetのバージョン",
  "Ruleset last checked": "rulesetの最終確認",
  "Diagnosis cached at": "診断結果のキャッシュ時刻",
  "Server-side schema output": "サーバー側schema出力",
  "llms.txt output": "llms.txt出力",
  "AI crawler rules": "AIクローラー許可",
  "Detected SEO plugins": "検知したSEOプラグイン",
  "Plugin version": "プラグインのバージョン",
  "Store profile sync": "店情報の同期",
  "Profile last synced": "店情報の最終同期",
  "Profile sync pending": "店情報の同期待ち",
  "Profile last error": "店情報の同期エラー",
  "Profile sync needs a site ID and a profile token.":
    "店情報の同期にはサイトIDと店情報トークンが必要です。",
  "The profile sync was rejected by the service.": "店情報の同期がサービスに拒否されました。",
  "The Nurevo service could not be reached.": "Nurevoサービスに接続できませんでした。",
  "(none)": "（なし）",
  "yes": "あり",
  "no": "なし",
  "on": "ON",
  "off": "OFF",
  "AI visibility measurement requires the upper plan.": "AIでの露出測定は上位プランの機能です。",
  "AI visibility measurement is not available yet.": "AIでの露出測定はまだ利用できません。",
  "AEO criteria were updated.": "AEOの基準が更新されました。",
  "Your site now follows central ruleset v%2$d (was v%1$d). The diagnosis was re-run against the new criteria.":
    "このサイトは中央ruleset v%2$d に追従しています（以前は v%1$d）。新しい基準で再診断しました。",
  "View the updated diagnosis": "更新後の診断を見る",
  "Dismiss": "閉じる",
  "AEO diagnosis needs the service URL. Open Nurevo AEO > Settings and confirm it.":
    "AEO診断にはサービスURLが必要です。Nurevo AEO > 設定で確認してください。",
  "AEO diagnosis is not available yet.": "AEO診断はまだ利用できません。",
  "診断中": "診断中",
  "The tag.js URL is not configured. Open WebMCP > Settings and configure it.":
    "tag.js URLが設定されていません。WebMCP > 設定で設定してください。",
  "The WebMCP server returned invalid JSON.": "WebMCPサーバーの応答JSONが不正です。",
  "HTTP %d": "HTTP %d",
  "The WebMCP server returned an error: %s": "WebMCPサーバーがエラーを返しました: %s",
  "Could not connect to the WebMCP server. Check the tag.js URL, Docker status, or production Worker status.":
    "WebMCPサーバーに接続できません。tag.js URL、Dockerの起動状態、または本番Workerの状態を確認してください。",
  "You do not have permission to perform this action.": "この操作を実行する権限がありません。",
  "Saved the existing site key for this domain.": "このドメインの既存サイトキーを保存しました。",
  "Issued and saved a free-plan site key.": "無料プランのサイトキーを発行して保存しました。",
  "There is no site key to regenerate.": "再発行するサイトキーがありません。",
  "Regenerated and saved the site key. The old key has been disabled.":
    "サイトキーを再発行して保存しました。古いキーは無効化されています。",
  "There is no site key to disable.": "無効化するサイトキーがありません。",
  "Disabled the site key.": "サイトキーを無効化しました。",
  "The site key is not configured. Open WebMCP > Settings and configure it.":
    "サイトキーが設定されていません。WebMCP > 設定で設定してください。",
  "The WebMCP server response did not match the expected format.":
    "WebMCPサーバーの応答形式が想定と異なります。",
  "Could not connect to the WebMCP server. Check the tag.js URL, Docker status, and site key.":
    "WebMCPサーバーに接続できません。tag.js URL、Dockerの起動状態、サイトキーを確認してください。",
  "Could not connect to the WebMCP server.": "WebMCPサーバーに接続できません。",
  "Refresh data": "最新データを取得",
  "Open WebMCP > Settings and configure the public tag.js URL and site key.":
    "WebMCP > 設定を開き、公開tag.js URLとサイトキーを設定してください。",
  "Collecting data": "データ収集中",
  "%1$d form submissions collected / %2$d remaining before analysis starts":
    "フォーム送信 %1$d件 / 分析開始まであと %2$d件",
  "What appears after data is collected": "データが集まると分かること",
  "Form completion rate and fields with frequent drop-off.": "フォームの完了率と、離脱が多い入力欄。",
  "Improvement points based on real validation errors.": "実際のバリデーションエラーに基づく改善ポイント。",
  "Estimated completion-rate change after MCP guidance is improved.":
    "MCPガイダンス改善後に見込める完了率の変化。",
  "When the sample size is too low, the dashboard does not show guessed suggestions or inflated numbers.":
    "サンプル不足時は、推測の提案や誇張した数値は表示しません。",
  "Form submissions this month": "今月のフォーム送信数",
  "Completion rate": "完了率",
  "Top 3 drop-off fields": "離脱が多い欄トップ3",
  "Industry benchmark": "同業種ベンチマーク",
  "Your completion rate": "自分の完了率",
  "Improvement suggestions": "改善提案",
  "There are enough submissions, but no real-data-based improvement suggestions yet.":
    "十分な送信数はありますが、実データに基づく改善提案はまだありません。",
  "No notable drop-off fields yet.": "目立った離脱欄はまだありません。",
  "Improvement suggestion": "改善提案",
  "Expected effect: completion rate +%dpt": "期待効果: 完了率 +%dpt",
  "Nurevo WebMCP Canary": "Nurevo WebMCP Canary",
  "Loads an external WebMCP tag for standard HTML forms and common WordPress form plugins.":
    "標準HTMLフォームと一般的なWordPressフォームプラグイン向けに外部WebMCPタグを読み込みます。",
  "Site key actions": "サイトキー操作",
  "Issue a free site key for this WordPress domain, save it automatically, or rotate/disable the current key.":
    "このWordPressドメイン用の無料サイトキーを発行して自動保存するか、現在のキーを再発行/無効化します。",
  "Issue free site key": "無料サイトキーを発行",
  "Regenerate site key": "サイトキーを再発行",
  "Disable site key": "サイトキーを無効化",
  "Manage plans and view detailed analytics at nurevo.jp": "プランの管理と詳細な分析は nurevo.jp で確認できます",
  "WebMCP": "WebMCP",
  "Forms": "フォーム",
  "Unnamed form": "名称未設定のフォーム",
  "Issue site key": "サイトキーを発行",
  "Issued and saved the site key.": "サイトキーを発行して保存しました。",
  "Issue a site key for this WordPress domain, save it automatically, or rotate/disable the current key.":
    "このWordPressドメイン用のサイトキーを発行して自動保存するか、現在のキーを再発行/無効化します。",
  "Used only when issuing a site key from the WebMCP server.":
    "WebMCPサーバーからサイトキーを発行するときにのみ使用されます。",
  "Peer average completion rate": "同業平均の完了率",
  "Rank percentile": "順位パーセンタイル",
  "Estimated completion-rate change after applying improvements.": "改善を適用した後に見込める完了率の変化。",
  "%1$d / %2$d submissions collected for this form.": "このフォームの送信数 %1$d / %2$d 件を収集しました。",
  "Last successful fetch: %s": "最後に取得できた時刻: %s",
  "Checked API origins:": "確認したAPIオリジン:",
  "Showing the last successfully fetched WebMCP data because the server is currently unreachable.":
    "サーバーに接続できないため、最後に取得できたWebMCPデータを表示しています。",
  "Requires the WebMCP tag to be enabled and a site key to be configured.":
    "WebMCPタグの有効化とサイトキーの設定が必要です。",
  "Applied only while the WebMCP tag is enabled and the site is visible to search engines.":
    "WebMCPタグが有効で、かつサイトが検索エンジンに公開されている場合にのみ適用されます。",
  "Load WebMCP tag on public pages (analytics/WebMCP only; it does not deliver AI-search schema)":
    "公開ページでWebMCPタグを読み込む（計測/WebMCP専用。AI検索向けschemaはこのタグでは配信しません）",
  "Analytics/WebMCP only. This JavaScript tag is not used for AI-search schema delivery; use the Nurevo WebMCP server-rendered plugin for LocalBusiness JSON-LD.":
    "計測/WebMCP専用です。このJavaScriptタグはAI検索向けschemaの配信には使いません。LocalBusinessのJSON-LDはサーバー側出力をご利用ください。",
  "Output schema.org JSON-LD (Organization, WebSite, and the current page) in the page head so AI crawlers that do not run JavaScript can read it":
    "JavaScriptを実行しないAIクローラーにも読まれるよう、schema.orgのJSON-LD（Organization・WebSite・表示中のページ）をhead内に出力します",
  "This site is already registered. Regenerate the key with an administrator token if the existing key is unavailable.":
    "このサイトは既に登録済みです。既存のキーが使えない場合は、管理トークンでキーを再発行してください。",
  "The site key is not configured. Open WebMCP > Settings and issue or paste a site key.":
    "サイトキーが設定されていません。WebMCP > 設定でサイトキーを発行するか貼り付けてください。",
  "The tag.js URL is not configured. Open WebMCP > Settings and enter the public tag.js URL.":
    "tag.js URLが設定されていません。WebMCP > 設定で公開tag.js URLを入力してください。",
  "The configured WebMCP URL responded, but the expected API endpoint was not found: %s":
    "設定されたWebMCP URLは応答しましたが、想定するAPIエンドポイントが見つかりませんでした: %s",
  "The WebMCP server rejected the site key or admin token: %s":
    "WebMCPサーバーがサイトキーまたは管理トークンを拒否しました: %s",
  "The WebMCP server did not respond within %d seconds. The URL may be unreachable from WordPress, the Worker may be slow, or Docker/network egress may be blocked.":
    "WebMCPサーバーが %d 秒以内に応答しませんでした。WordPressからURLに到達できない、Workerが遅い、またはDocker/ネットワークの外部通信が遮断されている可能性があります。",
  "Could not connect to the WebMCP server. Check the tag.js URL, site key, Docker network, and production Worker status.":
    "WebMCPサーバーに接続できません。tag.js URL、サイトキー、Dockerネットワーク、本番Workerの状態を確認してください。",
  "Could not connect to the WebMCP server. No response was received from any configured API URL.":
    "WebMCPサーバーに接続できません。設定されたいずれのAPI URLからも応答がありませんでした。",
  "WordPress could not resolve the WebMCP host name. Check the tag.js URL and DNS/network settings.":
    "WordPressがWebMCPのホスト名を解決できませんでした。tag.js URLとDNS/ネットワーク設定を確認してください。",
  "WordPress could not verify the WebMCP HTTPS certificate. Check the public Worker URL and server certificate.":
    "WordPressがWebMCPのHTTPS証明書を検証できませんでした。公開WorkerのURLとサーバー証明書を確認してください。",

  // 0.5.1: the admin UI was Japanese-only hardcoded text. The source strings are
  // now English and the original Japanese wording is preserved here verbatim, so
  // Japanese users see exactly what they saw before.

  // Admin menu and screen titles.
  "AEO Score": "AEOスコア",
  "AI visibility": "測定（β）",
  "Settings": "設定",
  "Advanced (for developers)": "詳細（開発者向け）",

  // Score gauge and bands.
  "Checking": "診断中",
  "Checking how AI reads your site": "AI可読性を診断しています",
  "Checking. The score appears automatically once your settings are complete.":
    "診断中。設定が揃い次第、自動的に表示されます。",
  // A diagnosis that failed is its own state, told apart from one still in
  // flight: "Checking" for ever was indistinguishable from a real failure.
  "Could not diagnose": "診断できませんでした",
  "The service could not diagnose this site. This usually means it is not reachable from the internet yet - a local or password-protected site cannot be read.":
    "このサイトを診断できませんでした。多くの場合、サイトがまだインターネットから見えないことが原因です（ローカル環境やパスワード保護中のサイトは読み取れません）。",
  "Check again": "もう一度診断する",
  // The connection block on the settings screen, and the Pro coming-soon
  // wording that replaced a price.
  "Connect this site to Nurevo": "このサイトをNurevoに接続する",
  "Open the nurevo.jp dashboard and add this site.": "nurevo.jpのダッシュボードを開き、このサイトを追加します。",
  "Press \"Issue a pairing code\" and copy the code.": "「ペアリングコードを発行」を押して、コードをコピーします。",
  "Paste it into the Pairing code field below and save.": "下の「ペアリングコード」欄に貼り付けて保存します。",
  "Open the dashboard": "ダッシュボードを開く",
  "Diagnosis, structured data and llms.txt already work without connecting. Connecting is what lets the dashboard show this site and keep its output current.":
    "診断・構造化データ・llms.txtは接続しなくても動作します。接続すると、ダッシュボードにこのサイトが表示され、出力を最新基準に保てます。",
  "Measuring your visibility in AI answers is a Pro feature (beta, coming soon)":
    "AIの回答での登場率の測定はProプランの機能です（β・近日提供）",
  "Pro is not on sale yet. There is nothing to buy and nothing to set up - this screen will start working once measurement opens.":
    "Proはまだ販売していません。購入も設定も不要です。測定の提供開始後、この画面が動き始めます。",
  "See what Pro will do": "Proでできることを見る",
  "Good": "良好",
  "AI is reading your site correctly": "AIに正しく読まれています",
  "Needs work": "要改善",
  "Nearly there - a little more and you are green": "あと少しで緑になります",
  "At risk": "危険",
  "AI is barely reading your site": "AIにほとんど読まれていません",
  "AEO %s": "AEO %s",
  "See the full diagnosis": "診断結果を見る",

  // Alert banner.
  "⚠ This is how AI sees your business": "⚠ AIはあなたの店をこう見ています",
  "What AI cannot read from this site: %s": "AIがこのサイトから読み取れていない項目: %s",
  "(and %d more)": "（ほか%d件）",
  ", ": "、",
  "Based on the diagnosis. You can fix these from the checklist below.":
    "診断結果に基づく指摘です。下のチェックリストから修正できます。",

  // Checklist.
  "Diagnosis checklist": "診断チェックリスト",
  "The diagnosis and the fixes (basic schema, llms.txt, AI crawler access) all run on the free plan.":
    "診断と［直す］（基本schema・llms.txt・AIクローラー許可）はFreeプランのまま実行できます。",
  "Fix it": "直す",
  "Create it": "作る",
  "Add business details": "店情報を入力",
  "Fixing...": "修正中…",
  "Try again": "再試行",
  "Adds the major AI crawlers to robots.txt.": "robots.txtに主要AIクローラーの許可を追加します。",
  "Turns on server-side output of the information AI reads.":
    "AI向けの情報をサーバー側で出力する設定を有効にします。",
  "Generates /llms.txt for this site and serves it.": "このサイトの /llms.txt を生成して配信します。",
  "Fill these in and the full schema is generated for you, turning this green.":
    "情報が埋まると完全なschemaが自動生成され、緑になります。",
  "Make your schema agree with your page text, and show a freshness signal such as a visible updated date or dateModified.":
    "schemaと本文の内容を一致させ、更新日時シグナル（更新日の表示や dateModified）を入れてください。",
  "Put your hours, address, phone and prices in the page text too, and tidy up your headings and FAQ.":
    "営業時間・住所・電話・料金を本文にも書き、見出し構造とFAQを整えてください。",
  "Check with whoever runs your CDN or WAF that AI bots are not being blocked.":
    "CDNやWAFでAIボットを遮断していないか、設置事業者の設定を確認してください。",

  // Automatic extraction notice.
  "Filled in %d field(s) automatically - please check them":
    "自動抽出しました：%d件の項目を埋めました（確認してください）",
  "Review and correct": "確認・修正",
  "These were inferred from your existing settings and published content. Only blank fields were filled, so please check that the values are right.":
    "自動抽出は既存設定と公開本文からの推定です。空欄だけを補完しており、内容の正確性を確認してください。",

  // Business details fields.
  "Name": "名称",
  "Description": "説明",
  "Address": "住所",
  "Phone": "電話番号",
  "Opening hours": "営業時間",
  "Business type (schema.org type)": "業種（schema.org型）",
  "URL": "URL",
  "Email": "メール",

  // SEO plugin coexistence.
  "🤝 Works alongside Yoast SEO, Rank Math, All in One SEO and Slim SEO. They do SEO, Nurevo AEO does AI. Duplicate schema is avoided automatically.":
    "🤝 Yoast SEO / Rank Math / All in One SEO / Slim SEO と併用OK。SEOは彼ら、AIはNurevo AEO。二重schemaは自動回避中",
  "(detected: %s)": "（検知: %s）",
  "Which plugin outputs each schema type": "schemaの出力元",
  "schema.org type": "schema.org タイプ",
  "Output by": "出力元",
  "%s (Nurevo suppressed)": "%s（Nurevoは抑制）",
  "Nurevo AEO (filling what %s leaves out)": "Nurevo AEO（%s が出力しない項目を補完）",
  "Detected SEO plugins: %s": "検知したSEOプラグイン: %s",
  "No SEO plugin was detected.": "SEOプラグインは検知されていません。",

  // "Always current" ruleset.
  "Always current: ON": "常に最新（自動追従）: ON",
  "Always current: OFF": "常に最新（自動追従）: OFF",
  "Following central ruleset v%d. When the criteria change we re-run the diagnosis and tell you here.":
    "中央ruleset v%d に追従中。基準が変わると自動で再診断し、ここで通知します。",
  "Following the central ruleset. When the criteria change we re-run the diagnosis and tell you here.":
    "中央rulesetに追従中。基準が変わると自動で再診断し、ここで通知します。",
  "The free plan runs on the criteria bundled with the plugin. Your diagnosis, basic schema, llms.txt and AI crawler access all keep working.":
    "Freeプランは同梱の基準で動作します。診断・基本schema・llms.txt・AIクローラー許可はこのままご利用いただけます。",

  // AI visibility (SoV) screen.
  "Measuring your visibility in AI answers is a Pro feature (from 14,800 JPY/month, beta)":
    "AIでの露出測定はProプラン（¥14,800/月〜・β）の機能です",
  "We put representative questions to the AI engines and measure how often your business is mentioned or cited in the answers, how that compares with competitors, and how it moves over time.":
    "代表的な質問をAIエンジンに投げ、回答のなかで自店が言及・引用された割合（AI登場率）と競合比較・推移を測定します。",
  "Your Pro plan is active. Measurement needs a site key and site ID to be configured.":
    "Proプランは有効です。測定にはサイトキーとサイトIDの設定が必要です。",
  "Open settings": "設定を開く",
  "See the Pro plan at nurevo.jp": "Proプランを見る（nurevo.jp）",
  "Pairing code": "ペアリングコード",
  "Catalogue sync needs a site ID and a profile token.": "カタログ同期にはサイトIDとプロフィールトークンが必要です。",
  "Frequently asked questions": "よくある質問",
  "Bookable services": "予約できるサービス",
  "Service name": "サービス名",
  "Duration (minutes)": "所要時間（分）",
  "Price": "料金",
  "Currency": "通貨",
  "Category (optional)": "カテゴリ（任意）",
  "Booking URL": "予約URL",
  "Published as Service structured data with a ReserveAction pointing at the booking URL you enter. Leave the name blank to remove a service. Save to add another row.": "Service 構造化データとして出力し、入力された予約URLを指す ReserveAction を付けます。サービス名を空にすると、そのサービスは削除されます。保存すると入力欄が1組増えます。",
  "Question": "質問",
  "Answer": "回答",
  "Leave a question or its answer blank to remove the pair. Save to add another row.": "質問または回答を空にすると、その組は削除されます。保存すると入力欄が1組増えます。",
  "To publish the FAQ, place the %1$s block or the %2$s shortcode on the page where it should appear. The questions are shown there and published as FAQPage structured data on that page only; search engines accept FAQ markup only for questions visitors can read.": "FAQを公開するには、表示したいページに %1$s ブロックまたは %2$s ショートコードを配置してください。質問はそのページに表示され、そのページでのみ FAQPage 構造化データとして出力されます。検索エンジンは、訪問者が読める質問のFAQマークアップしか認めません。",
  "Nurevo FAQ": "Nurevo FAQ",
  "Shows the questions and answers entered in Nurevo AEO settings.": "Nurevo AEO の設定で入力した質問と回答を表示します。",
  "Page ID that carries the services (0 = front page)": "サービスを掲載するページID（0 = フロントページ）",
  "Add the site on the nurevo.jp dashboard, then paste the pairing code it shows here. The code is used once; re-issue it from the dashboard if you need another.": "nurevo.jp のダッシュボードでサイトを追加し、表示されたペアリングコードをここに貼り付けてください。コードは一度だけ使えます。必要な場合はダッシュボードから再発行できます。",
  "Paired. This site is registered as %1$s. Plan: %2$s.": "接続しました。このサイトは %1$s として登録されています。プラン: %2$s。",
  "The pairing code is invalid or has expired.": "ペアリングコードが正しくないか、有効期限が切れています。",
  "The Nurevo service is not configured.": "Nurevo サービスが設定されていません。",
  "This code belongs to a site registered as %s. Pair it from that site, or correct the site address on the dashboard.": "このコードは %s として登録されたサイトのものです。そのサイトから接続するか、ダッシュボードでサイトアドレスを修正してください。",
  "This pairing code has already been used by another site. Issue a new one from the dashboard.": "このペアリングコードは別のサイトで使用済みです。ダッシュボードから新しいコードを発行してください。",
  "Another site in this account is already paired with this domain.": "このアカウントの別のサイトが、すでにこのドメインに接続されています。",
  "Too many attempts. Please wait and try again.": "試行回数が多すぎます。しばらく待ってから再度お試しください。",
  "View this site on the nurevo.jp dashboard": "このサイトを nurevo.jp ダッシュボードで見る",
  "Your free diagnosis, basic schema, llms.txt and AI crawler access carry on exactly as before.":
    "Freeプランの診断・基本schema・llms.txt・AIクローラー許可は、このまま変わらずご利用いただけます。",
  "AI appearance rate": "AI登場率",
  "beta measurement": "β測定",
  "How often you appear in AI answers": "AIの回答に登場した割合",
  "Citation rate": "引用率",
  "vs previous": "前回比",
  "AI readiness (on-site): %d / 100": "AI対応度（サイト上の準備）: %d / 100",
  "AI visibility (measured): %d / 100": "AI登場度（実測）: %d / 100",
  "Based on %1$d AI answers (%2$d named or cited, last %3$d days).": "AIの回答 %1$d件にもとづく（名前・引用あり %2$d件、直近%3$d日）。",
  "AI visibility not measured yet. This score is your AI readiness only.": "AI登場度はまだ測定していません。このスコアはAI対応度のみです。",
  "AI answers vary with the time of the run and the model. While there are few answers, AI visibility has only a small effect on the AEO score.": "AIの回答は実行日時やモデルで変動します。回答数が少ないうちは、AI登場度がAEOスコアに与える影響を小さくしています。",
  "%1$d answers to %2$d questions × %3$d runs (confidence: %4$s)": "回答 %1$d件 / 質問 %2$d問 × %3$d回（確度: %4$s）",
  "%1$d answers across %2$d questions (confidence: %3$s)":
    "回答 %1$d件 / 質問 %2$d件（確度: %3$s）",
  "Trend": "推移",
  "The trend appears once a second measurement has run.": "推移は2回目の測定以降に表示されます。",
  "The last %d measurements, oldest on the left": "直近%d回の測定（左が古い）",
  "AI appearance rate over the last %d measurements": "AI登場率の推移（%d回分）",
  "Competitors (sites the AI cited for the same questions)": "競合比較（同じ質問でAIが引用したサイト）",
  "No citations of other sites were detected.": "他サイトの引用は検出されていません。",
  "Site": "サイト",
  "Appearance rate": "登場率",
  "Appearances": "登場回数",
  "Counts of the domains the AI engines actually cited. Nothing here is inferred.":
    "AIエンジンが実際に引用したドメインの集計です。推測は含みません。",
  "This is a beta feature. AI answers vary from run to run, so judge by the trend rather than any single result.":
    "β機能です。AIの回答は実行ごとに変わるため、単発の結果ではなく推移で判断してください。",
  "No AI appearance rate has been retrieved yet.": "AI登場率はまだ取得できていません。",
  "No AI engine is configured yet, so nothing has been measured. Once one is set up, measurement runs automatically every week.":
    "AIエンジンが未設定のため、まだ測定していません。設定され次第、週次で自動測定されます。",
  "Waiting for the first measurement. This runs automatically once a week.":
    "初回の測定を待っています（週1回の自動測定）。",
  "The AI engines returned no answers this time, so an appearance rate could not be calculated.":
    "AIエンジンから回答が得られなかったため、今回の登場率は算出できていません。",

  // Checklist wording (0.5.1). The labels keep the worker's original Japanese
  // wording so Japanese operators see what they always saw; the per-status
  // messages are new, because the service sends one message for every status.
  "AI crawler access": "AIクローラー到達性",
  "The major AI crawlers are allowed in robots.txt.": "主要AIクローラー8種をrobots.txtで許可しています。",
  "Some AI crawlers are not clearly allowed in robots.txt.":
    "一部のAIクローラーがrobots.txtで明示的に許可されていません。",
  "AI crawlers are not allowed in robots.txt, so they will not read this site.":
    "robots.txtでAIクローラーを許可していないため、このサイトは読まれません。",

  "CDN and edge access": "CDN・エッジ到達性",
  "Your CDN or WAF is letting AI bots through.": "CDN・WAFはAIボットの通過を許可しています。",
  "Something at the edge may be slowing AI bots down.": "エッジでAIボットが妨げられている可能性があります。",
  "AI bots are being blocked before they reach your site.":
    "AIボットがサイトに到達する前に遮断されています。",

  "Server-rendered HTML": "サーバー側HTML",
  "Your content and schema are in the raw HTML.": "生HTMLに本文とschemaが出力されています。",
  "Only part of your content is in the raw HTML.": "生HTMLに本文の一部しか出力されていません。",
  "The raw HTML carries neither your content nor your schema, so crawlers that skip JavaScript see an empty page.":
    "生HTMLに本文もschemaも無いため、JavaScriptを実行しないクローラーには空のページに見えます。",

  "Structured data": "構造化データ",
  "Valid JSON-LD with the right type and the key properties filled in.":
    "JSON-LDが妥当で、型と主要プロパティが揃っています。",
  "Your JSON-LD is missing some of the properties AI looks for.":
    "JSON-LDにAIが参照する主要プロパティの一部が欠けています。",
  "No usable JSON-LD was found in the raw HTML.": "生HTMLに利用できるJSON-LDが見つかりません。",

  "Key information coverage": "重要情報の網羅",
  "Name, address, phone, hours, location and URL are all published.":
    "名称・住所・電話・営業時間・位置情報・URLがすべて公開されています。",
  "Some of your name, address, phone, hours, location or URL is missing.":
    "名称・住所・電話・営業時間・位置情報・URLのいずれかが不足しています。",
  "The basics AI needs - name, address, phone, hours, location, URL - are mostly missing.":
    "AIが必要とする基本情報（名称・住所・電話・営業時間・位置情報・URL）がほとんどありません。",

  "Readable page text": "本文の機械可読性",
  "Your key facts, headings and FAQ are readable in the page text.":
    "重要な事実・見出し構造・FAQが本文で読める状態です。",
  "Your key facts are hard to find in the page text.": "重要な事実が本文から読み取りにくい状態です。",
  "The page text does not state your key facts, so AI has only your markup to go on.":
    "本文に重要な事実が書かれておらず、AIはマークアップだけを頼りにしています。",

  "llms.txt": "llms.txt",
  "llms.txt is published and describes this site.": "llms.txtが配信され、サイトを説明しています。",
  "llms.txt is published but thin on detail.": "llms.txtはありますが、内容が不十分です。",
  "No llms.txt is published.": "llms.txtが配信されていません。",

  "Consistency and freshness": "一貫性・鮮度",
  "Your schema agrees with your page text and carries a freshness signal.":
    "schemaと本文が一致し、更新シグナルもあります。",
  "Your schema and page text disagree in places, or the freshness signal is missing.":
    "schemaと本文に食い違いがあるか、更新シグナルがありません。",
  "Your schema contradicts your page text, which makes AI distrust both.":
    "schemaと本文が矛盾しており、AIはどちらも信頼しにくくなっています。",

  // Browser tag opt-in (0.5.0).
  "Browser tag (optional)": "ブラウザタグ（任意）",
  "Load the Nurevo browser tag on public pages": "公開ページで Nurevo ブラウザタグを読み込む",
  "Off by default, and not needed for AEO. The AEO score, schema.org output, llms.txt and AI crawler rules all work with this off. Turning it on loads a script from the service URL above on every public page and reports public form structure and privacy-safe outcomes; values your visitors type are not sent. Leave it off unless Nurevo support asked you to enable it.":
    "既定はオフで、AEOには不要です。AEOスコア・schema.org出力・llms.txt・AIクローラー許可は、オフのままでも動作します。オンにすると上記サービスURLのスクリプトを全公開ページで読み込み、公開フォームの構造とプライバシーに配慮した結果を送信します（訪問者が入力した値は送信しません）。Nurevoサポートから指示がない限り、オフのままにしてください。",

  // AI crawler split and approved suggestions (0.7.4).
  "Allow AI search crawlers (ChatGPT search, Claude, Perplexity) in the virtual robots.txt file":
    "AI検索のクローラー（ChatGPT検索・Claude・Perplexity）を仮想robots.txtで許可する",
  "These fetch your pages to answer and cite them. Your existing robots.txt rules, such as /wp-admin/, keep applying to them.":
    "回答や引用のためにページを読み込むクローラーです。/wp-admin/ など、既存のrobots.txtのルールは引き続き適用されます。",
  "Leave to my robots.txt (no change)": "サイトのrobots.txtに任せる（変更しない）",
  "Allow": "許可",
  "Block": "ブロック",
  "AI training crawlers (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot)":
    "AI学習用のクローラー（GPTBot・ClaudeBot・Google-Extended・Applebot-Extended・CCBot）",
  "These collect content to train AI models. They are not needed to appear in AI answers, so this is your choice.":
    "AIモデルの学習用にコンテンツを収集するクローラーです。AIの回答に表示されるためには不要なので、許可するかどうかはお任せします。",
  "Fill empty business details from your site": "空欄の事業者情報をサイトの内容から補う",
  "Turn on structured data output": "構造化データの出力をオンにする",
  "Turn on /llms.txt": "/llms.txt をオンにする",
  "Allow AI search crawlers in robots.txt": "robots.txtでAI検索のクローラーを許可する",
  "Nurevo suggests these changes:": "Nurevo からの変更の提案：",
  "Apply": "適用",
  "Not now": "今はしない",

  // Pro wording that holds whether or not Pro is on sale (0.7.4).
  "Measuring your visibility in AI answers is a Pro feature (beta)": "AIの回答での見られ方の計測は、Proプランの機能です（β）",
  "Pro is set up on the Nurevo dashboard, not in WordPress. Once this site is on Pro, this screen shows its measurements automatically.":
    "Proプランの設定は WordPress ではなく Nurevo のダッシュボードで行います。このサイトが Pro になると、この画面に計測結果が自動で表示されます。",
  "See Pro details": "Proプランの詳細を見る",

  // First-run fixes (0.7.4).
  "Refresh plan": "プランを再確認",
  "Just bought or cancelled a plan? Check it now instead of waiting for the next sync.":
    "プランを購入・解約した直後ですか？次の同期を待たずに、今すぐ確認できます。",
  "Plan checked: %s (unchanged).": "プランを確認しました：%s（変更なし）",
  "Plan updated: %1$s → %2$s.": "プランを更新しました：%1$s → %2$s",
  "Nurevo AEO is off: nothing is published yet.": "Nurevo AEO はオフです。まだ何も公開されていません。",
  "Structured data, llms.txt and AI crawler rules start once you switch on output.":
    "出力をオンにすると、構造化データ・llms.txt・AIクローラーの設定が有効になります。",
  "Turn on in settings": "設定でオンにする",
  "Diagnosis works without connecting, and structured data, llms.txt and AI crawler rules work without connecting once output is switched on. Connecting is what lets the dashboard show this site and keep its output current.":
    "診断は接続しなくても使えます。構造化データ・llms.txt・AIクローラーの設定も、出力をオンにすれば接続なしで動きます。接続すると、ダッシュボードにこのサイトが表示され、出力が最新の基準に保たれます。",

  // Continuous optimization (0.7.2).
  "Automatic optimization found information that needs your confirmation. Please publish only real information.":
    "自動最適化で、確認が必要な情報が見つかりました。実在する情報だけを公開してください。",
  // Consent before contacting the service (0.8.0).
  "The diagnosis has not been run yet. Open Nurevo AEO and press Run diagnosis to agree to contact the Nurevo service.":
    "診断はまだ実行されていません。Nurevo AEO を開き、「診断を実行」を押してNurevoサービスへの接続に同意してください。",
  "Run your first AEO diagnosis":
    "最初のAEO診断を実行する",
  "The diagnosis is run by the Nurevo service at nurevo.jp. Nothing has been sent yet: the plugin contacts the service only after you agree here.":
    "診断は nurevo.jp のNurevoサービスで実行されます。まだ何も送信されていません。ここで同意するまで、プラグインはサービスに接続しません。",
  "Running it sends your home page URL and your WordPress language. The service then reads your public front page, robots.txt and llms.txt, as any visitor could. No visitor data is sent.":
    "実行すると、ホームページのURLとWordPressの言語が送信されます。その後サービスが、一般の訪問者と同じように公開中のトップページ・robots.txt・llms.txtを読み取ります。訪問者のデータは送信されません。",
  "Structured data, llms.txt and AI crawler rules work without this; they are produced by the plugin on your own server.":
    "構造化データ・llms.txt・AIクローラーの設定はこれがなくても動きます。いずれもお使いのサーバー上でプラグインが生成します。",
  "Tick the box to agree before running the diagnosis.":
    "診断を実行する前に、チェックボックスにチェックを入れて同意してください。",
  "I agree to send this site’s URL to the Nurevo service for diagnosis, under its Terms of Service and Privacy Policy.":
    "利用規約とプライバシーポリシーに基づき、診断のためにこのサイトのURLをNurevoサービスへ送信することに同意します。",
  "Run diagnosis":
    "診断を実行",
  "Terms of Service":
    "利用規約",
  "Privacy Policy":
    "プライバシーポリシー",
  "not run yet":
    "未実行",
  "The diagnosis has not been run yet. Nothing is sent to the Nurevo service until you run it.":
    "診断はまだ実行されていません。実行するまで、Nurevoサービスには何も送信されません。",
  // Per-post controls (0.8.0).
  "Questions to show":
    "表示する質問",
  "Site-wide questions (Settings)":
    "サイト共通の質問（設定画面）",
  "This page’s own questions":
    "このページ専用の質問",
  "Leave this page out of llms.txt":
    "このページをllms.txtに載せない",
  "Publish no Nurevo structured data on this page":
    "このページではNurevoの構造化データを出力しない",
  "Questions and answers for this page":
    "このページのよくある質問",
  "Shown where you place the Nurevo FAQ block set to this page’s own questions, or the [nurevo_faq source=\"post\"] shortcode. Published as FAQPage on this page only.":
    "「このページ専用の質問」に設定したNurevo FAQブロック、または [nurevo_faq source=\"post\"] ショートコードを置いた場所に表示されます。FAQPageとしてはこのページでのみ公開されます。",
  "Add a question":
    "質問を追加",
  "Remove":
    "削除",
  // Tools: export/import, WP-CLI (0.8.0).
  "AEO score: %1$d/100 (%2$s)":
    "AEOスコア: %1$d/100（%2$s）",
  "Choose a settings file exported from Nurevo AEO.":
    "Nurevo AEO から書き出した設定ファイルを選んでください。",
  "Copy these settings to another site. The file holds the output switches, the business details, the FAQ and the services. Keys, tokens, the plan and the connection are never exported or imported.":
    "この設定を別のサイトにコピーできます。ファイルには出力のオン・オフ、店舗情報、よくある質問、サービスが含まれます。キー・トークン・プラン・接続情報は書き出しも読み込みもしません。",
  "Could not read the file.":
    "ファイルを読み込めませんでした。",
  "Could not write the file.":
    "ファイルを書き込めませんでした。",
  "Export settings":
    "設定を書き出す",
  "Import settings":
    "設定を読み込む",
  "Settings exported.":
    "設定を書き出しました。",
  "Settings file (.json)":
    "設定ファイル（.json）",
  "Settings imported.":
    "設定を読み込みました。",
  "The diagnosis sends this site’s URL to the Nurevo service. Run again with --consent to agree.":
    "診断ではこのサイトのURLがNurevoサービスに送信されます。同意する場合は --consent を付けて再実行してください。",
  "The file contains keys or connection settings, which are never imported: %s":
    "ファイルにキーまたは接続設定が含まれています。これらは読み込みません: %s",
  "The file contains settings this version does not know: %s":
    "ファイルに、このバージョンが認識できない設定が含まれています: %s",
  "The file is not a valid Nurevo AEO settings file.":
    "有効なNurevo AEO設定ファイルではありません。",
  "The file is not valid JSON.":
    "ファイルが正しいJSONではありません。",
  "This is not a Nurevo AEO settings file.":
    "Nurevo AEO の設定ファイルではありません。",
  "Tools":
    "ツール",
  // Owner-facing connection messages (0.8.0).
  "The Nurevo service URL is not set. Open Nurevo AEO > Settings and check it under Advanced.":
    "NurevoサービスのURLが設定されていません。Nurevo AEO > 設定 を開き、「詳細設定」で確認してください。",
  "The Nurevo service sent a response this plugin could not read.":
    "Nurevoサービスから、このプラグインが読み取れない応答が返されました。",
  "The Nurevo service returned an error: %s":
    "Nurevoサービスがエラーを返しました: %s",
  "This site is not connected to Nurevo yet. Open Nurevo AEO > Settings and pair it with a pairing code.":
    "このサイトはまだNurevoに接続されていません。Nurevo AEO > 設定 を開き、ペアリングコードで接続してください。",
  "Could not reach the Nurevo service. Please try again later.":
    "Nurevoサービスに接続できませんでした。しばらくしてから再度お試しください。",
  "Showing the last data received from Nurevo, because the service cannot be reached right now.":
    "現在Nurevoサービスに接続できないため、最後に受信したデータを表示しています。",
  "The Nurevo service did not answer within %d seconds. Your server may not be allowed to make outgoing connections, or the service may be busy. Please try again later.":
    "Nurevoサービスが%d秒以内に応答しませんでした。お使いのサーバーで外部への接続が許可されていないか、サービスが混み合っている可能性があります。しばらくしてから再度お試しください。",
  "Your server could not look up the Nurevo service address. Ask your hosting provider whether outgoing connections are allowed.":
    "お使いのサーバーがNurevoサービスのアドレスを調べられませんでした。外部への接続が許可されているか、ホスティング会社にお問い合わせください。",
  "Your server could not verify the Nurevo service’s security certificate. Ask your hosting provider to update the server’s certificate store.":
    "お使いのサーバーがNurevoサービスのセキュリティ証明書を確認できませんでした。サーバーの証明書ストアの更新をホスティング会社に依頼してください。",
  "Could not reach the Nurevo service. Check your internet connection and try again later. If it keeps happening, ask your hosting provider whether outgoing connections are allowed.":
    "Nurevoサービスに接続できませんでした。インターネット接続を確認し、しばらくしてから再度お試しください。繰り返し発生する場合は、外部への接続が許可されているかホスティング会社にお問い合わせください。",
  "The Nurevo service did not accept this site’s connection: %s":
    "Nurevoサービスがこのサイトの接続を受け付けませんでした: %s",
  "The Nurevo service URL in Settings did not lead to the Nurevo service: %s":
    "設定にあるNurevoサービスのURLは、Nurevoサービスにつながりませんでした: %s",
  // Suggested privacy policy text (0.8.0).
  "This site uses the Nurevo AEO plugin to publish structured data, llms.txt and AI crawler rules. These are produced on this site’s own server. By default the plugin adds no tracking script to public pages and sends no visitor data to the Nurevo service.":
    "このサイトでは、構造化データ・llms.txt・AIクローラーの設定を公開するために Nurevo AEO プラグインを使用しています。これらはこのサイト自身のサーバーで生成されます。初期設定では、公開ページに追跡用のスクリプトは追加されず、訪問者のデータがNurevoサービスに送信されることもありません。",
  "Only after a site administrator agrees to run the AEO diagnosis, or connects the site to Nurevo with a pairing code, does the plugin contact the Nurevo service at nurevo.jp, operated by Bestie. LLC. It then sends this site’s home page address and WordPress language, and the service reads the site’s public front page, robots.txt and llms.txt.":
    "サイト管理者がAEO診断の実行に同意した場合、またはペアリングコードでサイトをNurevoに接続した場合に限り、プラグインは Bestie. LLC. が運営する nurevo.jp のNurevoサービスに接続します。その際、このサイトのホームページのアドレスとWordPressの言語が送信され、サービスはサイトの公開中のトップページ・robots.txt・llms.txtを読み取ります。",
  "Once the site is connected, the plugin also sends, from the WordPress administration area and twice a day: the business details entered in its settings (name, description, address, telephone, opening hours, business type, website and business email), the products, services and frequently asked questions it publishes, and the titles and addresses of recently updated public posts and pages. This is information about the business, not about visitors.":
    "サイトの接続後は、WordPressの管理画面から、また1日2回、次の情報も送信されます。設定に入力された店舗情報（名称・説明・住所・電話番号・営業時間・業種・ウェブサイト・連絡用メールアドレス）、プラグインが公開する商品・サービス・よくある質問、最近更新された公開済みの投稿と固定ページのタイトルとアドレスです。これらは事業に関する情報であり、訪問者に関する情報ではありません。",
  "If an administrator turns on the optional Nurevo browser tag, a script is loaded from nurevo.jp on public pages. It reports the structure of public forms and whether a submission succeeded, and is designed not to send what visitors type.":
    "管理者が任意のNurevoブラウザタグをオンにした場合、公開ページで nurevo.jp のスクリプトが読み込まれます。このスクリプトは公開フォームの構造と送信の成否を報告し、訪問者が入力した内容は送信しない設計になっています。",
  "Nurevo privacy policy: %s":
    "Nurevoのプライバシーポリシー: %s",
  // wp-admin display switches (0.8.0).
  "Score in wp-admin":
    "管理画面でのスコア表示",
  "Show the AEO score in the admin bar":
    "管理バーにAEOスコアを表示する",
  "Show the Nurevo AEO widget on the Dashboard":
    "ダッシュボードにNurevo AEOウィジェットを表示する",
  // Setup wizard (0.8.1).
  "Set up Nurevo AEO":
    "Nurevo AEO の初期設定",
  "Setup":
    "初期設定",
  "Setup progress":
    "設定の進み具合",
  "Site type":
    "サイトの種類",
  "Business info":
    "店舗情報",
  "Visibility to AI":
    "AIへの公開",
  "Done":
    "完了",
  "Restaurant or café":
    "飲食店・カフェ",
  "Restaurants, cafés, bakeries and bars":
    "レストラン、カフェ、ベーカリー、バー",
  "Beauty salon":
    "美容サロン",
  "Hair, nail and beauty salons, spas":
    "美容室、ネイル・エステサロン、スパ",
  "Clinic or dental":
    "クリニック・歯科",
  "Clinics, dentists, doctors and vets":
    "クリニック、歯科医院、医院、動物病院",
  "Professional services":
    "専門サービス",
  "Lawyers, accountants, agencies and trades":
    "士業、会計事務所、代理店、工事・修理業",
  "Retail shop":
    "小売店",
  "Shops and stores, on the street or online":
    "実店舗やオンラインのショップ",
  "Lodging":
    "宿泊施設",
  "Hotels, inns and guesthouses":
    "ホテル、旅館、ゲストハウス",
  "Other":
    "その他",
  "Any other business or organization":
    "上記以外の事業・団体",
  "Business name":
    "店舗名・事業者名",
  "Saved.":
    "保存しました。",
  "Choose the kind of business this site is for.":
    "このサイトの事業の種類を選んでください。",
  "Step %1$d of %2$d":
    "ステップ %1$d / %2$d",
  "Save and continue":
    "保存して次へ",
  "Back":
    "戻る",
  "Skip for now":
    "あとで設定する",
  "What kind of business is this site for?":
    "このサイトはどんな事業のサイトですか？",
  "This sets the schema.org type AI reads your business as. You can refine it later in Settings.":
    "AIがあなたの事業をどの種類（schema.orgのタイプ）として読むかが決まります。あとで設定画面から細かく変更できます。",
  "Business category":
    "事業の種類",
  "%s is active. Nurevo adds only the facts missing from its schema graph, with no duplicates.":
    "%s が有効です。Nurevoはその構造化データに足りない情報だけを追加し、重複させません。",
  "Your business information":
    "店舗・事業の情報",
  "These are the facts AI answers with. They are published as structured data and in llms.txt.":
    "AIが回答に使う基本情報です。構造化データとllms.txtで公開されます。",
  "%d field(s) are still empty. AI cannot answer with what is not here.":
    "%d 件の項目が未入力です。ここにない情報はAIも答えられません。",
  "Business information":
    "店舗・事業の情報",
  "Missing":
    "未入力",
  "Suggested from your SEO plugin. Please check it.":
    "SEOプラグインの設定から入力しました。内容を確認してください。",
  "Suggested from your site title and tagline. Please check it.":
    "サイトのタイトルとキャッチフレーズから入力しました。内容を確認してください。",
  "Free text, for example \"Mon-Fri 9:00-18:00, Sat 10:00-15:00, closed Sunday\".":
    "自由に入力できます。例:「月-金 9:00-18:00、土 10:00-15:00、日曜定休」",
  "These hours could not be read day by day, so they will be published exactly as written.":
    "曜日ごとに読み取れなかったため、入力したとおりの文面で公開されます。",
  "Read as:":
    "次のように読み取りました:",
  "Save and check the hours":
    "保存して営業時間を確認",
  "What AI can see":
    "AIに見せる情報",
  "Everything here is produced on your own server. Nothing is sent anywhere by these switches.":
    "ここで設定する内容はすべてあなたのサーバー上で生成されます。これらのスイッチで外部に送信されるものはありません。",
  "Publishing":
    "公開",
  "Publish AI-readable information (recommended)":
    "AIが読める情報を公開する（推奨）",
  "Turns on JSON-LD structured data, /llms.txt, and access for AI search crawlers in robots.txt.":
    "JSON-LD構造化データ、/llms.txt、robots.txtでのAI検索クローラーの許可をオンにします。",
  "Nurevo adds nothing for these crawlers; your existing robots.txt decides.":
    "これらのクローラーについてNurevoは何も追加せず、今のrobots.txtに従います。",
  "Your content may be used to train AI models.":
    "コンテンツがAIモデルの学習に使われる場合があります。",
  "Asks training crawlers to stay away. AI search and your score are not affected.":
    "学習用クローラーにアクセスしないよう求めます。AI検索やスコアには影響しません。",
  "AI training crawlers":
    "AI学習クローラー",
  "AEO diagnosis (optional)":
    "AEO診断（任意）",
  "You have already agreed to the diagnosis. Your score is shown on the next step.":
    "診断にはすでに同意済みです。次のステップでスコアを表示します。",
  "The diagnosis is run by the Nurevo service at nurevo.jp. It sends your home page URL and WordPress language; the service then reads your public front page, robots.txt and llms.txt. Nothing is sent unless you tick this box.":
    "診断は nurevo.jp のNurevoサービスが行います。送信するのはホームページのURLとWordPressの言語で、サービスは公開中のトップページ・robots.txt・llms.txtを読み取ります。このボックスにチェックを入れない限り、何も送信されません。",
  "Save and finish":
    "保存して完了",
  "You are set up":
    "設定が完了しました",
  "AI-readable information is now published from this site.":
    "このサイトからAIが読める情報の公開を始めました。",
  "Output is off, so nothing is published yet. You can switch it on in Settings at any time.":
    "出力がオフのため、まだ何も公開されていません。設定画面からいつでもオンにできます。",
  "AEO score":
    "AEOスコア",
  "The diagnosis has not been run, and nothing has been sent. You can run it any time from the AEO Score screen.":
    "診断はまだ実行しておらず、何も送信していません。AEOスコア画面からいつでも実行できます。",
  "Open the AEO Score screen":
    "AEOスコア画面を開く",
  "Next steps":
    "次にやること",
  "Add the Nurevo FAQ block to a page, so AI can quote your answers.":
    "ページにNurevo FAQブロックを追加すると、AIがあなたの回答を引用できるようになります。",
  "Open your pages":
    "固定ページ一覧を開く",
  "Connect this site to nurevo.jp to see it in the dashboard (optional, free).":
    "nurevo.jp に接続すると、ダッシュボードでこのサイトを確認できます（任意・無料）。",
  "Connect to nurevo.jp":
    "nurevo.jp に接続",
  "Per-page settings: leave a page out, or give it its own FAQ, from the Nurevo AEO panel in the editor.":
    "ページごとの設定: エディターのNurevo AEOパネルから、ページを対象外にしたり、ページ専用のFAQを設定したりできます。",
  "Standard keeps your output following new AI criteria automatically, if you ever want that.":
    "必要になったら、Standardプランで出力を新しいAIの評価基準に自動で追従させることもできます。",
  "Go to Nurevo AEO":
    "Nurevo AEOへ",
  "Nurevo AEO setup is not finished. It takes about three minutes.":
    "Nurevo AEOの初期設定が終わっていません。3分ほどで完了します。",
  "Resume setup":
    "設定を再開",
  "Do not show again":
    "今後表示しない",
  // Abilities API (0.8.1).
  "Read-only information about what Nurevo AEO publishes for AI on this site.":
    "このサイトでNurevo AEOがAI向けに公開している内容の読み取り専用情報。",
  "Get Nurevo AEO status":
    "Nurevo AEOの状態を取得",
  "Whether Nurevo AEO output is on, which outputs are active (JSON-LD, llms.txt, robots.txt rules), the AI training crawler choice, whether the site is connected to nurevo.jp, the plan, and whether diagnosis consent was given.":
    "Nurevo AEOの出力がオンかどうか、有効な出力（JSON-LD・llms.txt・robots.txtのルール）、AI学習クローラーの設定、nurevo.jpとの接続状況、プラン、診断への同意の有無。",
  "Get the last AEO score":
    "最新のAEOスコアを取得",
  "The last stored AEO diagnosis: score out of 100, band, date and a checklist summary. It never runs a new diagnosis.":
    "保存済みの最新のAEO診断結果（100点満点のスコア、評価帯、日時、チェックリストの概要）。新しい診断は実行しません。",
  "Get AEO fixes":
    "AEOの改善点を取得",
  "The items in the last stored AEO diagnosis that need attention (WARN or BAD), each with a plain-language next step.":
    "保存済みの最新のAEO診断で対応が必要な項目（WARN・BAD）と、それぞれのわかりやすい次の対応。",
  "Get the published business profile":
    "公開中の事業者情報を取得",
  "The business facts Nurevo AEO publishes in this site’s JSON-LD: type, name, description, URL, address, phone, opening hours and any published email.":
    "Nurevo AEOがこのサイトのJSON-LDで公開している事業者情報（種類・名称・説明・URL・住所・電話番号・営業時間・公開しているメールアドレス）。",
  "No AEO diagnosis is stored yet. In WordPress admin, open Nurevo AEO > AEO Score; the diagnosis runs there.":
    "保存されたAEO診断はまだありません。WordPress管理画面で「Nurevo AEO > AEOスコア」を開くと診断が実行されます。",
  "No AEO diagnosis has been run yet. In WordPress admin, open Nurevo AEO > AEO Score and press Run diagnosis. Nothing is sent to the Nurevo service until you agree there.":
    "AEO診断はまだ実行されていません。WordPress管理画面で「Nurevo AEO > AEOスコア」を開き、「診断を実行」を押してください。そこで同意するまで、Nurevoサービスには何も送信されません。",
  "On the Nurevo AEO > AEO Score screen, press \"%1$s\" next to this item. %2$s":
    "「Nurevo AEO > AEOスコア」画面で、この項目の横にある「%1$s」を押してください。%2$s",
  "Open Nurevo AEO > Settings and fill in the business details.":
    "「Nurevo AEO > 設定」を開き、店舗情報を入力してください。",
  "See this item on the Nurevo AEO > AEO Score screen for details.":
    "詳しくは「Nurevo AEO > AEOスコア」画面でこの項目を確認してください。",
  "Nothing to fix: every item in the last diagnosis passed.":
    "改善が必要な項目はありません。最新の診断ではすべての項目が合格でした。",
  "%d item(s) in the last diagnosis need attention.":
    "最新の診断で %d 件の項目に対応が必要です。",
  "These facts are published in this site’s JSON-LD.":
    "これらの情報はこのサイトのJSON-LDで公開されています。",
  "Output is off, so these facts are not published yet. Switch it on in Nurevo AEO > Settings.":
    "出力がオフのため、これらの情報はまだ公開されていません。「Nurevo AEO > 設定」でオンにしてください。",
  // Site types (docs/industries.md).
  "B2B / SaaS": "BtoB・SaaS",
  "B2B / SaaS / professional services": "BtoB・SaaS・専門サービス",
  "Case studies": "導入事例",
  "Case studies page (B2B)": "導入事例ページ（BtoB）",
  "Contact email": "連絡先メールアドレス",
  "Description (one sentence, optional)": "説明（1文・任意）",
  "Enter only pages that exist. They are listed in llms.txt; a return policy page is also published as the shop’s MerchantReturnPolicy.": "実在するページだけを入力してください。llms.txtに掲載され、返品ポリシーのページはショップのMerchantReturnPolicyとしても出力されます。",
  "Local business (shop, salon, clinic, restaurant ...)": "店舗・地域ビジネス（店舗、サロン、クリニック、飲食店など）",
  "Online shop (e-commerce)": "ECサイト（通販）",
  "Online shop (EC)": "ECサイト（通販）",
  "Pricing": "料金",
  "Pricing page (B2B)": "料金ページ（BtoB）",
  "Return and refund policy": "返品・返金ポリシー",
  "Return and refund policy page (online shop)": "返品・返金ポリシーのページ（EC）",
  "Sells online, with WooCommerce or another cart": "WooCommerceなどで商品をネット販売",
  "Service page URL (optional)": "サービスページのURL（任意）",
  "Services and products": "サービス・製品",
  "Shipping policy": "配送・送料について",
  "Shipping policy page (online shop)": "配送・送料のページ（EC）",
  "Site requirements for this site type: %1$d/%2$d": "このサイト種別の要件: %1$d/%2$d",
  "Software, SaaS and services sold to companies": "法人向けのソフトウェア・SaaS・サービス",
  "This decides what is published for AI, what the diagnosis checks and which questions the AI visibility measurement asks. Online shops and B2B sites do not need an address or opening hours.": "AI向けに出力する内容、診断でチェックする項目、AI登場率の測定で使う質問がこの種類で決まります。ECサイトとBtoBでは住所・営業時間は必須ではありません。",
  "This is software (SaaS or an app)": "ソフトウェア（SaaS・アプリ）です",
  "WooCommerce is active, so Online shop is suggested. Change it if this site is something else.": "WooCommerceが有効なため「ECサイト」を提案しています。違う場合は変更してください。",
  "WooCommerce is active, so Online shop is suggested. Nothing changes until you save.": "WooCommerceが有効なため「ECサイト」を提案しています。保存するまで何も変わりません。",
  // Free AI check card (Free / Standard).
  "Free AI check": "無料AIチェック",
  "Once a month we ask Perplexity %d questions a customer might ask, without your business name, and show whether the answer names your business or cites your site.":
    "毎月1回、お客様がしそうな質問を%d問（お店の名前は入れずに）Perplexityに聞き、回答にお店の名前やサイトが出てくるかを表示します。",
  "This month's free checks are used up. Next check on %s.": "今月の無料チェックは上限に達しました。次回のチェックは %s です。",
  "Next check on %s.": "次回のチェックは %s です。",
  "The AI returned no answers this month, so nothing could be checked. Next check on %s.":
    "今月はAIから回答が得られず、チェックできませんでした。次回のチェックは %s です。",
  "Checking now. Reload this page in a minute.": "チェック中です。1分ほどしてからこのページを再読み込みしてください。",
  "This month's check is scheduled for %s.": "今月のチェックは %s の予定です。",
  "Check now": "今すぐチェック",
  "Uses this month's free check.": "今月の無料チェックを使います。",
  "The free check starts once this site is paired with the Nurevo dashboard.":
    "このサイトをNurevoダッシュボードとペアリングすると無料チェックが始まります。",
  "The free AI check is not available yet.": "無料AIチェックはまだ利用できません。",
  "Named or cited in %1$d of %2$d answers": "%2$d件の回答のうち%1$d件で名前または引用あり",
  "No answer": "回答なし",
  "Named": "名前あり",
  "Site cited": "サイト引用あり",
  "Not mentioned": "登場なし",
  "Also in this answer: %s": "この回答に出てきた他のお店・サイト: %s",
  "AI answers vary with the time and the model. This is a small sample of a few answers, not a rate, and it guarantees nothing about other or future answers.":
    "AIの回答は実行日時やモデルで変わります。数件の回答を見た小さなサンプルで、割合ではありません。他の回答や今後の回答を保証するものではありません。",
  "Pro tracks this every week with more questions, ChatGPT as well as Perplexity, competitor share and history.":
    "Proなら、より多くの質問で毎週測定し、PerplexityとChatGPTの両方、競合との比較、推移まで追えます。",
  "The free AI check could not be run. Please try again later.": "無料AIチェックを実行できませんでした。時間をおいて再度お試しください。",
};

const POT_HEADER = `# Copyright (C) 2026 Nurevo
# This file is distributed under the same license as the Nurevo AEO package.
msgid ""
msgstr ""
"Project-Id-Version: Nurevo AEO 0.1.0\\n"
"Report-Msgid-Bugs-To: https://nurevo.jp/nurevo-webmcp/\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"X-Generator: scripts/generate-plugin-translations.mjs\\n"
`;

// Every locale this plugin ships. The list follows the locales Yoast SEO ships
// on WordPress.org. `from` reuses another locale's dictionary (regional variants
// that read the same), optionally passed through a transform.
const LOCALES_FILE = `${LANG_DIR}/i18n/locales.json`;
const DICTIONARY_DIR = `${LANG_DIR}/i18n`;

// No plural calls (_n) exist in the plugin, but the header should still be right.
const ONE_FORM = new Set(["ja", "ko_KR", "zh_CN", "zh_TW", "zh_HK", "vi", "id_ID", "lo", "fa_IR"]);
function pluralForms(locale) {
  if (ONE_FORM.has(locale)) return "nplurals=1; plural=0";
  if (["fr_FR", "fr_BE", "fr_CA", "pt_BR"].includes(locale)) return "nplurals=2; plural=(n > 1)";
  if (["ru_RU", "uk", "hr", "sr_RS"].includes(locale)) return "nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)";
  if (["cs_CZ", "sk_SK"].includes(locale)) return "nplurals=3; plural=(n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2";
  if (locale === "pl_PL") return "nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)";
  if (locale === "sl_SI") return "nplurals=4; plural=(n%100==1 ? 0 : n%100==2 ? 1 : n%100==3 || n%100==4 ? 2 : 3)";
  if (locale === "ro_RO") return "nplurals=3; plural=(n==1 ? 0 : (n==0 || (n%100 > 0 && n%100 < 20)) ? 1 : 2)";
  if (locale === "ar") return "nplurals=6; plural=(n==0 ? 0 : n==1 ? 1 : n==2 ? 2 : n%100>=3 && n%100<=10 ? 3 : n%100>=11 ? 4 : 5)";
  return "nplurals=2; plural=(n != 1)";
}

function poHeader(locale) {
  return `# Copyright (C) 2026 Nurevo
# This file is distributed under the same license as the Nurevo AEO package.
msgid ""
msgstr ""
"Project-Id-Version: Nurevo AEO\\n"
"Report-Msgid-Bugs-To: https://nurevo.jp/nurevo-webmcp/\\n"
"Last-Translator: Nurevo <support@nurevo.jp>\\n"
"Language-Team: ${locale} <support@nurevo.jp>\\n"
"Language: ${locale}\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"Plural-Forms: ${pluralForms(locale)};\\n"
"X-Generator: scripts/generate-plugin-translations.mjs\\n"
`;
}

const sorted = [...entries.entries()].sort((a, b) => a[0].localeCompare(b[0]));

function emit(header, translate) {
  let output = header;
  for (const [msgid, references] of sorted) {
    output += "\n";
    for (const reference of [...references].sort()) output += `#: ${reference}\n`;
    output += `msgid ${poQuote(msgid)}\n`;
    output += `msgstr ${poQuote(translate(msgid))}\n`;
  }
  return output;
}

/**
 * GNU .mo writer, so no gettext install is needed here or in CI.
 * Little-endian, revision 0, no hash table (WordPress does not use it).
 */
function moBuffer(headerText, pairs) {
  const all = [["", headerText], ...pairs].sort((a, b) => Buffer.compare(Buffer.from(a[0]), Buffer.from(b[0])));
  const count = all.length;
  const headerSize = 28;
  const originalsTable = headerSize;
  const translationsTable = originalsTable + count * 8;
  let offset = translationsTable + count * 8;
  const originals = [], translations = [];
  for (const [id] of all) {
    const bytes = Buffer.from(id, "utf8");
    originals.push({ bytes, offset });
    offset += bytes.length + 1;
  }
  for (const [, str] of all) {
    const bytes = Buffer.from(str, "utf8");
    translations.push({ bytes, offset });
    offset += bytes.length + 1;
  }
  const out = Buffer.alloc(offset);
  out.writeUInt32LE(0x950412de, 0);
  out.writeUInt32LE(0, 4);
  out.writeUInt32LE(count, 8);
  out.writeUInt32LE(originalsTable, 12);
  out.writeUInt32LE(translationsTable, 16);
  out.writeUInt32LE(0, 20);
  out.writeUInt32LE(0, 24);
  all.forEach((_, i) => {
    out.writeUInt32LE(originals[i].bytes.length, originalsTable + i * 8);
    out.writeUInt32LE(originals[i].offset, originalsTable + i * 8 + 4);
    out.writeUInt32LE(translations[i].bytes.length, translationsTable + i * 8);
    out.writeUInt32LE(translations[i].offset, translationsTable + i * 8 + 4);
  });
  for (const item of [...originals, ...translations]) item.bytes.copy(out, item.offset);
  return out;
}

/** The header block of a .po, as the msgstr of the empty msgid. */
function headerMsgstr(locale) {
  return [
    "Project-Id-Version: Nurevo AEO",
    `Language: ${locale}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    `Plural-Forms: ${pluralForms(locale)};`,
  ].join("\n") + "\n";
}

const TRANSFORMS = {
  // Swiss Standard German does not use ß.
  "de-CH": (value) => value.replace(/ß/g, "ss"),
  // Hong Kong reads Traditional Chinese; the Taiwan dictionary is the base.
  identity: (value) => value,
};

/** Placeholders (%s, %1$s, %d) must survive translation unchanged. */
function placeholders(value) {
  return (value.match(/%(?:\d+\$)?[sd]/g) || []).sort().join(",");
}

const missing = new Map();
function note(locale, msgid) {
  if (!missing.has(locale)) missing.set(locale, []);
  missing.get(locale).push(msgid);
}

const japanese = (msgid) => {
  if (JA[msgid] !== undefined) return JA[msgid];
  // Already Japanese in the source: no separate translation needed.
  if (/[぀-ヿ一-龯]/.test(msgid)) return msgid;
  note("ja", msgid);
  return msgid;
};

function loadDictionary(locale) {
  const file = path.join(DICTIONARY_DIR, `${locale}.json`);
  if (locale === "ja") return null;
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function translatorFor(locale, spec) {
  if (locale === "ja") return japanese;
  const base = spec && spec.from ? spec.from : locale;
  if (base === "ja") return japanese;
  const dictionary = loadDictionary(base);
  const transform = TRANSFORMS[(spec && spec.transform) || "identity"];
  return (msgid) => {
    let value = dictionary[msgid];
    // English variants may leave a string as the source when nothing differs.
    if ((value === undefined || value === "") && /^en_/.test(base)) value = msgid;
    if (value === undefined || value === "") {
      note(locale, msgid);
      return "";
    }
    if (placeholders(value) !== placeholders(msgid)) {
      note(locale, `${msgid}  [placeholder mismatch]`);
      return "";
    }
    return transform(value);
  };
}

fs.mkdirSync(LANG_DIR, { recursive: true });
fs.writeFileSync(path.join(LANG_DIR, `${DOMAIN}.pot`), emit(POT_HEADER, () => ""));

// Machine-readable source list for translators: msgid -> Japanese reference.
fs.mkdirSync(DICTIONARY_DIR, { recursive: true });
fs.writeFileSync(
  path.join(DICTIONARY_DIR, "_source.json"),
  JSON.stringify(Object.fromEntries(sorted.map(([msgid]) => [msgid, JA[msgid] ?? ""])), null, 2) + "\n"
);

// No en_US catalogue: the source strings are English, so it could only ever be
// msgid == msgstr. Shipping one just adds weight and invites the two to drift.
for (const stale of ["en_US.po", "en_US.mo"]) {
  fs.rmSync(path.join(LANG_DIR, `${DOMAIN}-${stale}`), { force: true });
}

const locales = JSON.parse(fs.readFileSync(LOCALES_FILE, "utf8"));
for (const [locale, spec] of Object.entries(locales)) {
  const translate = translatorFor(locale, spec);
  const values = sorted.map(([msgid]) => [msgid, translate(msgid)]);
  const lookup = new Map(values);
  fs.writeFileSync(path.join(LANG_DIR, `${DOMAIN}-${locale}.po`), emit(poHeader(locale), (msgid) => lookup.get(msgid)));
  const pairs = values.filter(([, value]) => value !== "");
  fs.writeFileSync(path.join(LANG_DIR, `${DOMAIN}-${locale}.mo`), moBuffer(headerMsgstr(locale), pairs));
}

console.log(`Extracted ${sorted.length} strings from ${SOURCES.join(", ")}; wrote ${Object.keys(locales).length} locales`);
if (missing.size) {
  for (const [locale, list] of missing) {
    console.warn(`Untranslated (${locale}): ${list.length}`);
    for (const msgid of list.slice(0, 5)) console.warn(`  - ${msgid}`);
  }
  process.exitCode = 1;
}
