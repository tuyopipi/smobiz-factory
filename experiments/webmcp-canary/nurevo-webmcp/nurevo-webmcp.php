<?php
/**
 * Plugin Name: Nurevo WebMCP
 * Description: AI検索対策(AEO)。schema.org JSON-LD・llms.txt・robots.txt をサーバー側で出力し、主要AIクローラー8種に対応。サイトキーで Nurevo ダッシュボードと連携。
 * Version: 0.4.0
 * Author: Bestie.合同会社
 *
 * JSタグと違い、これは「サーバー側」で出力するので JS を実行しないAIクローラーにも確実に届く（推奨経路）。
 */
if (!defined('ABSPATH')) exit;

// ── 対応AIクローラー 8種（shared/ai-crawlers.js と一致させること）──────────
const NUREVO_AI_CRAWLERS = [
  'GPTBot',            // OpenAI / ChatGPT
  'OAI-SearchBot',     // OpenAI / ChatGPT Search
  'ChatGPT-User',      // OpenAI / ChatGPT ブラウズ
  'ClaudeBot',         // Anthropic / Claude
  'PerplexityBot',     // Perplexity
  'Google-Extended',   // Google / Gemini・AI Overviews
  'Applebot-Extended', // Apple / Apple Intelligence
  'Bytespider',        // ByteDance / Doubao 等
];

const NUREVO_API = 'https://nurevo.jp/api';

function nurevo_site_key() { return get_option('nurevo_site_key', ''); }

// 1) 店舗情報の JSON-LD を <head> に出力（サーバー側 = クローラーに確実に見える）
add_action('wp_head', function () {
  $key = nurevo_site_key(); if (!$key) return;
  $cfg = nurevo_fetch_config($key);           // Nurevo から店舗情報を取得
  if (!$cfg || empty($cfg['jsonld'])) return;
  echo "\n<script type=\"application/ld+json\">" . wp_json_encode($cfg['jsonld']) . "</script>\n";
}, 5);

// 2) robots.txt に「8種すべて許可」を追記（許可設定がONのとき）
add_filter('robots_txt', function ($output) {
  $cfg = nurevo_fetch_config(nurevo_site_key());
  if (!$cfg || empty($cfg['crawlerAllowed'])) return $output;
  $block = "\n# Nurevo: AIクローラー許可\n";
  foreach (NUREVO_AI_CRAWLERS as $ua) $block .= "User-agent: {$ua}\nAllow: /\n\n";
  $block .= "Sitemap: " . home_url('/llms.txt') . "\n";
  return $output . $block;
}, 10, 1);

// 3) /llms.txt を配信（AI向けの店舗インデックス＋対応クローラー一覧）
add_action('init', function () {
  add_rewrite_rule('^llms\.txt$', 'index.php?nurevo_llms=1', 'top');
  add_rewrite_tag('%nurevo_llms%', '1');
});
add_action('template_redirect', function () {
  if (!get_query_var('nurevo_llms')) return;
  $cfg = nurevo_fetch_config(nurevo_site_key());
  $s = $cfg['store'] ?? [];
  header('Content-Type: text/plain; charset=utf-8');
  echo "# " . ($s['name'] ?? get_bloginfo('name')) . "\n\n## 店舗情報\n";
  foreach (['address'=>'住所','tel'=>'電話','hours'=>'営業時間','reserve'=>'予約'] as $k=>$label)
    if (!empty($s[$k])) echo "- {$label}: {$s[$k]}\n";
  echo "\n## 対応AIクローラー（許可）\n";
  foreach (NUREVO_AI_CRAWLERS as $ua) echo "- {$ua}\n";
  exit;
});

// 4) （将来）AIクローラーの実アクセスを1件記録 → Nurevo に日次集計を送る
add_action('init', function () {
  $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
  foreach (NUREVO_AI_CRAWLERS as $bot) {
    if (stripos($ua, $bot) !== false) {
      // TODO: nurevo_report_hit(nurevo_site_key(), $bot);  // /api/hits に送る
      break;
    }
  }
}, 1);

// 設定画面：サイトキー入力（ダッシュボードで発行した nrv_xxx を貼る）
add_action('admin_menu', function () {
  add_options_page('Nurevo WebMCP', 'Nurevo WebMCP', 'manage_options', 'nurevo-webmcp', function () {
    if (isset($_POST['nurevo_site_key']) && check_admin_referer('nurevo_save')) {
      update_option('nurevo_site_key', sanitize_text_field($_POST['nurevo_site_key']));
      flush_rewrite_rules();
      echo '<div class="updated"><p>保存しました。</p></div>';
    }
    $key = esc_attr(nurevo_site_key());
    echo '<div class="wrap"><h1>Nurevo WebMCP</h1><form method="post">';
    wp_nonce_field('nurevo_save');
    echo '<p>Nurevo ダッシュボードで発行したサイトキーを入力してください。</p>';
    echo '<input type="text" name="nurevo_site_key" value="' . $key . '" class="regular-text" placeholder="nrv_xxxxxxxxxxxx" />';
    submit_button('保存');
    echo '</form></div>';
  });
});

// Nurevo から設定を取得（サイトキーで）。1分後に再検証してactive rulesetへ追従。
function nurevo_fetch_config($key) {
  if (!$key) return null;
  $cache = get_transient('nurevo_cfg_' . md5($key));
  if ($cache !== false) return $cache;
  $res = wp_remote_get(NUREVO_API . '/tag/config?k=' . urlencode($key), ['timeout' => 4]);
  if (is_wp_error($res) || wp_remote_retrieve_response_code($res) !== 200) return null;
  $cfg = json_decode(wp_remote_retrieve_body($res), true);
  set_transient('nurevo_cfg_' . md5($key), $cfg, MINUTE_IN_SECONDS);
  return $cfg;
}
