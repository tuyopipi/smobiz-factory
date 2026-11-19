<?php
/**
 * nurevo-aeo.php — Nurevo サーバーサイドAEO連携（非WordPress / 素のPHPサイト向け）
 * ------------------------------------------------------------------
 * これは何: 店舗のサーバーが描画のたびにNurevoの中央設定(ruleset反映済みのJSON-LD)を
 *           取得し、生HTMLに <script type="application/ld+json"> として埋め込む。
 *           → view-source に出る＝AIクローラーが読める＋中央更新で常に最新。
 *
 * ⚠️ 重要: クライアント側の <script src=".../tag.js"> ではAIに読まれません。
 *           必ず「サーバー側で」この関数を呼び、出力をHTMLに含めてください。
 *
 * 使い方（<head> 内、</head> の直前）:
 *   <?php require __DIR__ . '/nurevo-aeo.php'; nurevo_render_jsonld('nrv_あなたのサイトキー'); ?>
 *
 * キャッシュ: 既定10分。毎リクエストでAPIを叩かず、かつ中央更新は最大10分で反映。
 *            API障害時は期限切れキャッシュを使う(フェイルオープン)。店のページは絶対に壊さない。
 */

if (!function_exists('nurevo_render_jsonld')) {

    function nurevo_fetch_config(string $siteKey, int $timeout = 2): ?string {
        $url = 'https://nurevo.jp/api/tag/config?k=' . rawurlencode($siteKey);

        // 1) cURL があれば優先
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => $timeout,
                CURLOPT_CONNECTTIMEOUT => $timeout,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_USERAGENT      => 'nurevo-server-integration/1.0',
            ]);
            $res  = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($res !== false && $code >= 200 && $code < 300) return $res;
            return null;
        }

        // 2) allow_url_fopen フォールバック
        $ctx = stream_context_create(['http' => [
            'timeout'       => $timeout,
            'ignore_errors' => true,
            'header'        => "User-Agent: nurevo-server-integration/1.0\r\n",
        ]]);
        $res = @file_get_contents($url, false, $ctx);
        return $res !== false ? $res : null;
    }

    /**
     * JSON-LD を取得して <script type="application/ld+json"> を echo する。
     * @param string $siteKey  Nurevoダッシュボードで発行された nrv_xxx
     * @param int    $cacheTtl キャッシュ秒数（既定600=10分）
     */
    function nurevo_render_jsonld(string $siteKey, int $cacheTtl = 600): void {
        if ($siteKey === '') return;

        $safeKey   = preg_replace('/[^A-Za-z0-9_]/', '', $siteKey);
        $cacheFile = sys_get_temp_dir() . '/nurevo_' . $safeKey . '.json';
        $jsonld    = null;

        // --- 有効なキャッシュ ---
        if (is_file($cacheFile) && (time() - filemtime($cacheFile) < $cacheTtl)) {
            $cached = @file_get_contents($cacheFile);
            if ($cached) $jsonld = $cached;
        }

        // --- キャッシュ切れ → 取得 ---
        if ($jsonld === null) {
            $res = nurevo_fetch_config($siteKey);
            if ($res !== null) {
                $cfg = json_decode($res, true);
                if (is_array($cfg) && !empty($cfg['ok']) && array_key_exists('jsonld', $cfg) && $cfg['jsonld'] === null) {
                    @unlink($cacheFile); // Explicit withdrawal: never serve stale data.
                    return;
                }
                if (is_array($cfg) && !empty($cfg['ok']) && !empty($cfg['jsonld'])) {
                    $jsonld = json_encode(
                        $cfg['jsonld'],
                        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
                    );
                    @file_put_contents($cacheFile, $jsonld); // 権限無ければ黙って無視
                }
            }
            // API失敗 → 期限切れでもキャッシュがあれば使う(フェイルオープン)
            if ($jsonld === null && is_file($cacheFile)) {
                $stale = @file_get_contents($cacheFile);
                if ($stale) $jsonld = $stale;
            }
        }

        if ($jsonld) {
            // </script> 混入対策（XSS/構文崩れ防止）
            $jsonld = str_replace('<', '\\u003c', $jsonld);
            echo "\n<script type=\"application/ld+json\">{$jsonld}</script>\n";
        }
    }
}
