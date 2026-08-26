import fs from "node:fs";

const potPath = "wordpress-plugin/webmcp-canary/languages/webmcp-canary.pot";
const outBase = "wordpress-plugin/webmcp-canary/languages/webmcp-canary";
const pot = fs.readFileSync(potPath, "utf8");

const entries = [];
let comments = [];
let current = null;
let active = null;

function unquote(value) {
  return JSON.parse(value.trim());
}

function quote(value) {
  return JSON.stringify(value);
}

for (const line of pot.split(/\n/)) {
  if (line.startsWith("#")) {
    comments.push(line);
    continue;
  }
  if (line.startsWith("msgid ")) {
    if (current) entries.push(current);
    current = { comments, msgid: unquote(line.slice(6)), msgidPlural: null };
    comments = [];
    active = "msgid";
    continue;
  }
  if (line.startsWith("msgid_plural ")) {
    current.msgidPlural = unquote(line.slice(13));
    active = "msgidPlural";
    continue;
  }
  if (line.startsWith("msgstr")) {
    active = "msgstr";
    continue;
  }
  if (line.startsWith("\"") && current && (active === "msgid" || active === "msgidPlural")) {
    current[active] += unquote(line);
    continue;
  }
  if (line.trim() === "") {
    if (current) entries.push(current);
    current = null;
    comments = [];
    active = null;
  }
}
if (current) entries.push(current);

const ja = {
  "WebMCP tag settings": "WebMCPタグ設定",
  "Enable tag": "タグを有効化",
  "External tag.js URL": "外部tag.js URL",
  "API key / site key": "APIキー / サイトキー",
  "Owner email": "所有者メールアドレス",
  "Admin token": "管理トークン",
  "Locked feature price": "ロック機能の価格",
  "Load WebMCP tag on public pages": "公開ページでWebMCPタグを読み込む",
  "The plugin does not bundle tag.js. Updating this hosted file updates all installed sites.": "このプラグインはtag.jsを同梱しません。ホストされたファイルを更新すると、インストール済みのすべてのサイトに反映されます。",
  "Sent to the WebMCP server as a site authorization key. Do not use a privileged server secret here.": "サイト認証キーとしてWebMCPサーバーに送信されます。権限の強いサーバーシークレットはここに入力しないでください。",
  "Used only when issuing a free site key from the WebMCP server.": "WebMCPサーバーから無料サイトキーを発行するときにのみ使用されます。",
  "Only used by this WordPress admin screen for protected management actions such as key rotation and disablement. It is never printed on public pages.": "キーのローテーションや無効化など、保護された管理操作のためにWordPress管理画面だけで使用されます。公開ページには出力されません。",
  "JPY / month": "円 / 月",
  "Display only. Billing is not implemented in this plugin version.": "表示のみです。このバージョンのプラグインには課金機能は実装されていません。",
  "WebMCP": "WebMCP",
  "Dashboard": "ダッシュボード",
  "Settings": "設定",
  "The tag.js URL is not configured. Open WebMCP > Settings and configure it.": "tag.js URLが設定されていません。WebMCP > 設定で設定してください。",
  "The WebMCP server returned invalid JSON.": "WebMCPサーバーの応答JSONが不正です。",
  "HTTP %d": "HTTP %d",
  "The WebMCP server returned an error: %s": "WebMCPサーバーがエラーを返しました: %s",
  "Could not connect to the WebMCP server. Check the tag.js URL, Docker status, or production Worker status.": "WebMCPサーバーに接続できません。tag.js URL、Dockerの起動状態、または本番Workerの状態を確認してください。",
  "You do not have permission to perform this action.": "この操作を実行する権限がありません。",
  "Saved the existing site key for this domain.": "このドメインの既存サイトキーを保存しました。",
  "Issued and saved a free-plan site key.": "無料プランのサイトキーを発行して保存しました。",
  "There is no site key to regenerate.": "再発行するサイトキーがありません。",
  "Regenerated and saved the site key. The old key has been disabled.": "サイトキーを再発行して保存しました。古いキーは無効化されています。",
  "There is no site key to disable.": "無効化するサイトキーがありません。",
  "Disabled the site key.": "サイトキーを無効化しました。",
  "The site key is not configured. Open WebMCP > Settings and configure it.": "サイトキーが設定されていません。WebMCP > 設定で設定してください。",
  "The WebMCP server response did not match the expected format.": "WebMCPサーバーの応答形式が想定と異なります。",
  "Could not connect to the WebMCP server. Check the tag.js URL, Docker status, and site key.": "WebMCPサーバーに接続できません。tag.js URL、Dockerの起動状態、サイトキーを確認してください。",
  "Could not connect to the WebMCP server.": "WebMCPサーバーに接続できません。",
  "Refresh data": "最新データを取得",
  "Open WebMCP > Settings and configure the public tag.js URL and site key.": "WebMCP > 設定を開き、公開tag.js URLとサイトキーを設定してください。",
  "Collecting data": "データ収集中",
  "%1$d form submissions collected / %2$d remaining before analysis starts": "フォーム送信 %1$d件 / 分析開始まであと %2$d件",
  "What appears after data is collected": "データが集まると分かること",
  "Form completion rate and fields with frequent drop-off.": "フォームの完了率と、離脱が多い入力欄。",
  "Improvement points based on real validation errors.": "実際のバリデーションエラーに基づく改善ポイント。",
  "Estimated completion-rate change after MCP guidance is improved.": "MCPガイダンス改善後に見込める完了率の変化。",
  "When the sample size is too low, the dashboard does not show guessed suggestions or inflated numbers.": "サンプル不足時は、推測の提案や誇張した数値は表示しません。",
  "Form submissions this month": "今月のフォーム送信数",
  "Completion rate": "完了率",
  "Top 3 drop-off fields": "離脱が多い欄トップ3",
  "Industry benchmark": "同業種ベンチマーク",
  "Your completion rate": "自分の完了率",
  "The Pro plan can show peer averages, ranking, and estimated post-improvement differences. No guessed benchmark is shown when peer data is insufficient.": "Proプランでは、同業平均・順位・改善後の差分を確認できます。十分な同業データがない場合、推測値は表示しません。",
  "Improvement suggestions": "改善提案",
  "There are enough submissions, but no real-data-based improvement suggestions yet.": "十分な送信数はありますが、実データに基づく改善提案はまだありません。",
  "About the Pro plan (coming soon)": "Proプランについて（準備中）",
  "No notable drop-off fields yet.": "目立った離脱欄はまだありません。",
  "Improvement suggestion": "改善提案",
  "Expected effect: completion rate +%dpt": "期待効果: 完了率 +%dpt",
  "Free shows the issue and expected effect. Upgrade to Pro to automatically improve the MCP guidance delivered to agents for this form.": "無料枠では問題点と期待効果を確認できます。Proにすると、このフォーム向けにエージェントへ配信するMCPガイダンスが自動改善されます。",
  "Pro is active. Nurevo will automatically improve the MCP guidance delivered to agents for this form. Your WordPress form and theme are not edited.": "Proが有効です。Nurevoは、このフォーム向けにエージェントへ配信するMCPガイダンスを自動改善します。WordPressフォームやテーマは編集しません。",
  "Upgrade to Pro to enable automatic MCP guidance improvements for this field. Pro updates the agent-facing MCP hints on the server side; it does not edit your WordPress form or theme.": "Proにすると、この欄のMCPガイダンス自動改善が有効になります。更新されるのはサーバー側でエージェントに返すMCPヒントで、WordPressフォームやテーマは編集しません。",
  "Nurevo WebMCP Canary": "Nurevo WebMCP Canary",
  "Loads an external WebMCP tag for standard HTML forms and common WordPress form plugins.": "標準HTMLフォームと一般的なWordPressフォームプラグイン向けに外部WebMCPタグを読み込みます。",
  "Site key actions": "サイトキー操作",
  "Issue a free site key for this WordPress domain, save it automatically, or rotate/disable the current key.": "このWordPressドメイン用の無料サイトキーを発行して自動保存するか、現在のキーを再発行/無効化します。",
  "Issue free site key": "無料サイトキーを発行",
  "Regenerate site key": "サイトキーを再発行",
  "Disable site key": "サイトキーを無効化"
};

function header(locale) {
  const plural = locale === "ja" ? "nplurals=1; plural=0" : "nplurals=2; plural=(n != 1)";
  return [
    "msgid \"\"",
    "msgstr \"\"",
    "\"Project-Id-Version: Nurevo WebMCP Canary 0.1.0\\n\"",
    "\"Report-Msgid-Bugs-To: https://nurevo.jp/webmcp-canary/\\n\"",
    "\"PO-Revision-Date: 2026-07-19 00:00+0000\\n\"",
    "\"Last-Translator: Nurevo <support@nurevo.jp>\\n\"",
    `"Language-Team: ${locale} <support@nurevo.jp>\\n"`,
    `"Language: ${locale}\\n"`,
    "\"MIME-Version: 1.0\\n\"",
    "\"Content-Type: text/plain; charset=UTF-8\\n\"",
    "\"Content-Transfer-Encoding: 8bit\\n\"",
    `"Plural-Forms: ${plural};\\n"`,
    "\"X-Generator: Codex\\n\""
  ].join("\n");
}

function emit(locale) {
  const translations = locale === "ja" ? ja : {};
  let output = `# Copyright (C) 2026 Nurevo\n# This file is distributed under the same license as the Nurevo WebMCP Canary package.\n#\n${header(locale)}\n`;
  for (const entry of entries) {
    if (entry.msgid === "") continue;
    const refs = (entry.comments || []).filter((comment) => comment.startsWith("#:") || comment.startsWith("#,"));
    output += `\n${refs.join("\n")}${refs.length ? "\n" : ""}`;
    output += `msgid ${quote(entry.msgid)}\n`;
    if (entry.msgidPlural) {
      output += `msgid_plural ${quote(entry.msgidPlural)}\n`;
      if (locale === "ja") {
        output += `msgstr[0] ${quote(entry.msgid === "%d issue" ? "%d件" : translations[entry.msgid] || entry.msgid)}\n`;
      } else {
        output += `msgstr[0] ${quote(entry.msgid)}\n`;
        output += `msgstr[1] ${quote(entry.msgidPlural)}\n`;
      }
      continue;
    }
    output += `msgstr ${quote(locale === "ja" ? translations[entry.msgid] || entry.msgid : entry.msgid)}\n`;
  }
  return output;
}

fs.writeFileSync(`${outBase}-en_US.po`, emit("en_US"));
fs.writeFileSync(`${outBase}-ja.po`, emit("ja"));
