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
import { execFileSync } from "node:child_process";

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

const source = fs.readFileSync(SOURCE, "utf8");
const lineOf = (index) => source.slice(0, index).split("\n").length;

/** msgid -> sorted unique source references */
const entries = new Map();
for (const match of source.matchAll(CALL)) {
  if (match[2] !== TEXT_DOMAIN) continue;
  const msgid = phpUnquote(match[1]);
  if (msgid === "") continue;
  const reference = `${SOURCE}:${lineOf(match.index)}`;
  const existing = entries.get(msgid);
  if (existing) existing.add(reference);
  else entries.set(msgid, new Set([reference]));
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
  "🤝 Works alongside Yoast and Rank Math. They do SEO, Nurevo AEO does AI. Duplicate schema is avoided automatically.":
    "🤝 Yoast / Rank Math と併用OK。SEOは彼ら、AIはNurevo AEO。二重schemaは自動回避中",
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
  "Your free diagnosis, basic schema, llms.txt and AI crawler access carry on exactly as before.":
    "Freeプランの診断・基本schema・llms.txt・AIクローラー許可は、このまま変わらずご利用いただけます。",
  "AI appearance rate": "AI登場率",
  "beta measurement": "β測定",
  "How often you appear in AI answers": "AIの回答に登場した割合",
  "Citation rate": "引用率",
  "vs previous": "前回比",
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

function poHeader(locale) {
  return `# Copyright (C) 2026 Nurevo
# This file is distributed under the same license as the Nurevo AEO package.
msgid ""
msgstr ""
"Project-Id-Version: Nurevo AEO 0.1.0\\n"
"Report-Msgid-Bugs-To: https://nurevo.jp/nurevo-webmcp/\\n"
"Last-Translator: Nurevo <support@nurevo.jp>\\n"
"Language-Team: ${locale} <support@nurevo.jp>\\n"
"Language: ${locale}\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"Plural-Forms: ${locale === "ja" ? "nplurals=1; plural=0" : "nplurals=2; plural=(n != 1)"};\\n"
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

const missing = [];
const japanese = (msgid) => {
  if (JA[msgid] !== undefined) return JA[msgid];
  // Already Japanese in the source: no separate translation needed.
  if (/[\u3040-\u30ff\u4e00-\u9faf]/.test(msgid)) return msgid;
  missing.push(msgid);
  return msgid;
};

fs.mkdirSync(LANG_DIR, { recursive: true });
fs.writeFileSync(path.join(LANG_DIR, `${DOMAIN}.pot`), emit(POT_HEADER, () => ""));
fs.writeFileSync(path.join(LANG_DIR, `${DOMAIN}-ja.po`), emit(poHeader("ja"), japanese));

// No en_US catalogue: the source strings are English, so it could only ever be
// msgid == msgstr. Shipping one just adds weight and invites the two to drift.
for (const stale of ["en_US.po", "en_US.mo"]) {
  fs.rmSync(path.join(LANG_DIR, `${DOMAIN}-${stale}`), { force: true });
}

for (const locale of ["ja"]) {
  const po = path.join(LANG_DIR, `${DOMAIN}-${locale}.po`);
  try {
    execFileSync("msgfmt", ["-o", path.join(LANG_DIR, `${DOMAIN}-${locale}.mo`), po], { stdio: "pipe" });
  } catch (error) {
    console.warn(`msgfmt unavailable or failed for ${locale}; .mo not rebuilt`);
  }
}

console.log(`Extracted ${sorted.length} strings from ${SOURCE}`);
if (missing.length) {
  console.warn(`Untranslated (ja) strings: ${missing.length}`);
  for (const msgid of missing) console.warn(`  - ${msgid}`);
  process.exitCode = 1;
}
