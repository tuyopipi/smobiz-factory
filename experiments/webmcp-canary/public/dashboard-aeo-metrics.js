/* Nurevo dashboard asset revision: 2026-10-01-asset1 */
(function () {
  "use strict";
  var selectedSiteId = null;
  var loadingSiteId = null;
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function validScores(scores) { return (scores || []).filter(function (item) { return Number.isFinite(Number(item.score)); }); }
  function sparkline(scores) {
    var values = validScores(scores);
    if (values.length < 2) return '<div class="nrv-aeo-empty">推移表示には2回以上の診断が必要です。</div>';
    var width = 520, height = 150, pad = 18;
    var numbers = values.map(function (item) { return Number(item.score); });
    var min = Math.min.apply(Math, numbers), max = Math.max.apply(Math, numbers), range = Math.max(1, max - min);
    var points = numbers.map(function (score, index) {
      var x = pad + index * (width - pad * 2) / Math.max(1, numbers.length - 1);
      var y = height - pad - (score - min) * (height - pad * 2) / range;
      return { x: x, y: y, score: score };
    });
    return '<svg class="nrv-aeo-chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="AEOスコアの推移"><line x1="' + pad + '" y1="' + (height - pad) + '" x2="' + (width - pad) + '" y2="' + (height - pad) + '" class="axis"></line><polyline points="' + points.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ') + '" class="line"></polyline>' + points.map(function (p) { return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="4"><title>' + p.score + '点</title></circle>'; }).join('') + '</svg><div class="nrv-aeo-range"><span>' + esc(values[0].scanned_at) + '</span><span>' + esc(values[values.length - 1].scanned_at) + '</span></div>';
  }
  function scoreSummary(scores) {
    var values = validScores(scores);
    if (!values.length) return '<div class="nrv-aeo-empty">診断データなし</div>';
    var latest = values[values.length - 1], previous = values.length > 1 ? values[values.length - 2] : null;
    var delta = previous ? Number(latest.score) - Number(previous.score) : null;
    var trend = delta == null ? '初回診断' : delta > 0 ? '↗ +' + delta : delta < 0 ? '↘ ' + delta : '→ 変化なし';
    return '<div class="nrv-aeo-score"><strong>' + esc(latest.score) + '</strong><span>/ 100</span><b class="' + (delta > 0 ? 'up' : delta < 0 ? 'down' : '') + '">' + esc(trend) + '</b></div><p class="notice">' + esc(latest.verdict || '') + ' · ' + esc(latest.scanned_at) + '</p>' + sparkline(values);
  }
  function crawlerTable(metrics) {
    if (!metrics.crawler_measurement) return '<div class="nrv-aeo-warning"><b>来訪計測なし（診断スコアのみ）</b><br>静的JSON-LDではクローラ来訪を計測できません。プラグインまたはAPI連携をご利用ください。</div>';
    var hits = metrics.crawler_hits || [];
    if (!hits.length) return '<div class="nrv-aeo-empty">クローラ来訪データなし</div>';
    var max = Math.max.apply(Math, hits.map(function (item) { return Number(item.hits || 0); }).concat([1]));
    return '<div class="tablewrap"><table><thead><tr><th>日付</th><th>クローラ種別</th><th>来訪数</th></tr></thead><tbody>' + hits.map(function (item) { var count = Number(item.hits || 0); return '<tr><td>' + esc(item.date) + '</td><td><code>' + esc(item.crawler_id) + '</code></td><td><div class="nrv-hit-cell"><span class="nrv-hit-bar" style="width:' + Math.max(4, Math.round(count / max * 100)) + '%"></span><b>' + count + '</b></div></td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function rulesetStatus(metrics) {
    var ruleset = metrics.ruleset || {};
    if (!ruleset.auto_updates) return '<div class="nrv-ruleset static"><b>静的JSON-LD</b><span>自動更新されません（最新ruleset: v' + esc(ruleset.latest_version || '—') + '）</span></div>';
    return '<div class="nrv-ruleset latest"><b>ruleset v' + esc(ruleset.version || '—') + '</b><span>最新化されています · 中央ルールへ自動追従</span></div>';
  }
  function panel(metrics) {
    var section = document.createElement('section');
    section.className = 'nrv-aeo-metrics';
    section.dataset.siteId = metrics.site_id;
    section.innerHTML = '<div class="card panel"><div class="nrv-aeo-heading"><div><small>AEO計測</small><h2>検索AIへの届き方</h2></div>' + rulesetStatus(metrics) + '</div><div class="nrv-aeo-grid"><section><h3>AEOスコアの推移</h3>' + scoreSummary(metrics.scores) + '</section><section><h3>AIクローラ来訪</h3>' + crawlerTable(metrics) + '</section></div></div>';
    return section;
  }
  async function resolveSiteId() {
    if (selectedSiteId) return selectedSiteId;
    var heading = document.querySelector('#main > .top h1');
    if (!heading) return null;
    var response = await fetch('/api/sites', { credentials: 'include', cache: 'no-store' });
    if (!response.ok) return null;
    var sites = (await response.json()).sites || [];
    var name = heading.textContent.trim();
    var site = sites.find(function (item) { return (item.url || item.slug || 'Hosted store') === name; });
    return site ? site.id : null;
  }
  async function mount() {
    var main = document.querySelector('#main'), detail = main && main.querySelector('.detail');
    if (!main || !detail) { loadingSiteId = null; return; }
    if (main.querySelector('.nrv-aeo-metrics')) return;
    var siteId = await resolveSiteId();
    if (!siteId || loadingSiteId === siteId || main.querySelector('.nrv-aeo-metrics')) return;
    loadingSiteId = siteId;
    var placeholder = document.createElement('section');
    placeholder.className = 'nrv-aeo-metrics';
    placeholder.innerHTML = '<div class="card panel"><p class="notice">AEO計測を読み込み中…</p></div>';
    main.appendChild(placeholder);
    try {
      var response = await fetch('/api/sites/' + encodeURIComponent(siteId) + '/aeo-metrics?limit=30&days=30', { credentials: 'include', cache: 'no-store' });
      var metrics = await response.json();
      if (!response.ok) throw new Error(metrics.error || 'AEO計測を取得できませんでした');
      if (placeholder.isConnected) placeholder.replaceWith(panel(metrics));
    } catch (error) {
      if (placeholder.isConnected) placeholder.innerHTML = '<div class="card panel"><div class="nrv-aeo-empty">' + esc(error.message) + '</div></div>';
    } finally { loadingSiteId = null; }
  }
  document.addEventListener('click', function (event) {
    var row = event.target.closest && event.target.closest('[data-site]');
    if (row) selectedSiteId = row.getAttribute('data-site');
    var back = event.target.closest && event.target.closest('[data-view="sites"]');
    if (back) selectedSiteId = null;
  }, true);
  var style = document.createElement('style');
  style.textContent = '.nrv-aeo-metrics{margin-top:18px}.nrv-aeo-heading{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-bottom:18px}.nrv-aeo-heading small{color:#6f4df6;font-weight:800}.nrv-aeo-heading h2{font-size:19px;margin:2px 0}.nrv-aeo-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}.nrv-aeo-grid h3{font-size:14px;margin:0 0 12px}.nrv-aeo-score{display:flex;align-items:baseline;gap:5px}.nrv-aeo-score strong{font-size:36px;color:#4b31c6}.nrv-aeo-score b{margin-left:auto;font-size:12px;color:#667085}.nrv-aeo-score b.up{color:#128a48}.nrv-aeo-score b.down{color:#c83f49}.nrv-aeo-chart{display:block;width:100%;height:auto;min-height:120px;background:#faf9fe;border-radius:10px}.nrv-aeo-chart .axis{stroke:#ded9ea;stroke-width:1}.nrv-aeo-chart .line{fill:none;stroke:#6f4df6;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.nrv-aeo-chart circle{fill:#fff;stroke:#6f4df6;stroke-width:3}.nrv-aeo-range{display:flex;justify-content:space-between;color:#8b8498;font-size:10px}.nrv-ruleset{display:grid;gap:1px;border-radius:9px;padding:8px 11px;font-size:12px}.nrv-ruleset.latest{background:#eaf8ef;color:#176b3a}.nrv-ruleset.static,.nrv-aeo-warning{background:#fff7d6;border:1px solid #f0c75e;color:#6d5000}.nrv-ruleset span{font-size:11px}.nrv-aeo-warning,.nrv-aeo-empty{border-radius:9px;padding:14px;font-size:12px}.nrv-aeo-empty{background:#f6f7fb;color:#687080;text-align:center}.nrv-hit-cell{position:relative;min-width:100px}.nrv-hit-bar{display:block;height:20px;border-radius:5px;background:#dcd3ff}.nrv-hit-cell b{position:absolute;left:7px;top:0;line-height:20px;font-size:11px}.nrv-aeo-grid code{font-size:11px}@media(max-width:800px){.nrv-aeo-grid{grid-template-columns:1fr}}';
  document.head.appendChild(style);
  new MutationObserver(function () { mount(); }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(mount, 500);
})();
