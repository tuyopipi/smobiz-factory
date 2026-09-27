/* nurevo / tag.js  —  客先サイトに貼る1行タグ本体
   <script src="https://nurevo.jp/tag.js" data-webmcp-site-key="nrv_xxx" defer></script>
   役割:
     1) site_key をサーバーに渡して設定を取得（この時サーバーが last_seen を記録＝設置検証）
     2) 返ってきた店舗情報の JSON-LD をページに注入（schema出力）
   注意（正直な限界）:
     - JSで注入する JSON-LD は「JSを実行するAIクローラー」にしか見えない。
       多くのクローラーは生HTMLしか読まないため、確実に届けるなら WordPress プラグイン
       （サーバー側レンダリング）を推奨。タグ/GTM はベストエフォート＋設置検証(last_seen)。
     - robots.txt / llms.txt はドメイン直下のファイルなので JS では作れない。
       クローラー許可はプラグイン or サーバー側で行う（本パッケージ wordpress/ 参照）。
*/
(function () {
  var el = document.currentScript || (function () {
    var s = document.getElementsByTagName("script"); return s[s.length - 1];
  })();
  var key = el && el.getAttribute("data-webmcp-site-key");
  if (!key) return;
  var BASE = "https://nurevo.jp";

  function inject(jsonld) {
    if (!jsonld) return;
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.text = JSON.stringify(jsonld);
    document.head.appendChild(s);
  }

  // 設定取得＋ハートビート（サーバー側で last_seen 更新＝ダッシュボードの「稼働」判定）
  fetch(BASE + "/api/tag/config?k=" + encodeURIComponent(key), { method: "GET", keepalive: true, credentials: "omit" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (cfg) { if (cfg && cfg.ok) inject(cfg.jsonld); })
    .catch(function () { /* 失敗しても客先サイトに影響を出さない */ });
})();
