/* Nurevo dashboard asset revision: 2026-10-27-scorev2 */
(function () {
  "use strict";
  var selectedSiteId = null;
  var loadingSiteId = null;
  // Words come from the dashboard dictionary (t() in dashboard.html), as in
  // dashboard-onboarding.js, so this panel speaks the page's language.
  function tr(key, vars) {
    var text = typeof t === "function" ? String(t(key)) : key;
    return text.replace(/\{(\w+)\}/g, function (m, name) { return vars && vars[name] != null ? String(vars[name]) : m; });
  }
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  // Number(null) is 0, so the obvious isFinite(Number(score)) check treats a
  // row that was never scored as a perfect zero - a claim about the site that
  // nothing measured. Absent and zero are different answers.
  function validScores(scores) {
    return (scores || []).filter(function (item) {
      return item && item.score !== null && item.score !== undefined && item.score !== ""
        && Number.isFinite(Number(item.score));
    });
  }
  // Score v2: a row's headline under its own version. A v1 row's headline was
  // its readiness score; a v2 row stores the blended headline beside it.
  var V2 = 'aeo-v2';
  function versionOf(row) { return row && row.score_version === V2 ? V2 : 'aeo-v1'; }
  function headlineOf(row) {
    if (versionOf(row) === V2) {
      var h = row.headline_score;
      return h === null || h === undefined || h === '' || !Number.isFinite(Number(h)) ? null : Number(h);
    }
    return Number(row.score);
  }
  // The trend of the headline. Points of different score versions are never
  // joined into one line: each version is its own segment, and the switch is
  // marked on the chart and said in words under it.
  function sparkline(scores) {
    var values = validScores(scores).map(function (item) { return { at: item.scanned_at, score: headlineOf(item), version: versionOf(item) }; })
      .filter(function (p) { return p.score !== null && Number.isFinite(p.score); });
    if (values.length < 2) return '<div class="nrv-aeo-empty">' + esc(tr('amTrendNeed')) + '</div>';
    var width = 520, height = 150, pad = 18;
    var numbers = values.map(function (item) { return item.score; });
    var min = Math.min.apply(Math, numbers), max = Math.max.apply(Math, numbers), range = Math.max(1, max - min);
    var points = values.map(function (item, index) {
      var x = pad + index * (width - pad * 2) / Math.max(1, values.length - 1);
      var y = height - pad - (item.score - min) * (height - pad * 2) / range;
      return { x: x, y: y, score: item.score, version: item.version, at: item.at };
    });
    var segments = [], switches = [];
    points.forEach(function (p, i) {
      if (!i || p.version !== points[i - 1].version) { segments.push([]); if (i) switches.push(p); }
      segments[segments.length - 1].push(p);
    });
    var lines = segments.map(function (seg) {
      return seg.length > 1 ? '<polyline points="' + seg.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ') + '" class="line' + (seg[0].version === V2 ? '' : ' v1') + '"' + (seg[0].version === V2 ? '' : ' stroke-dasharray="4 3" opacity="0.6"') + '></polyline>' : '';
    }).join('');
    var marks = switches.map(function (p) {
      var x = (p.x - (width - pad * 2) / Math.max(1, values.length - 1) / 2).toFixed(1);
      return '<line x1="' + x + '" y1="' + pad + '" x2="' + x + '" y2="' + (height - pad) + '" class="axis" stroke-dasharray="3 3" data-score-switch="' + esc(p.version) + '"></line>';
    }).join('');
    var note = switches.length ? '<p class="notice" data-score-switch-note>' + esc(tr('scVersionSwitch', { date: formatDay(switches[switches.length - 1].at) })) + '</p>' : '';
    return '<svg class="nrv-aeo-chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="' + esc(tr('amChartLabel')) + '"><line x1="' + pad + '" y1="' + (height - pad) + '" x2="' + (width - pad) + '" y2="' + (height - pad) + '" class="axis"></line>' + lines + marks + points.map(function (p) { return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="4"' + (p.version === V2 ? '' : ' opacity="0.6"') + '><title>' + esc(tr('amPoints', { n: p.score }) + (p.version === V2 ? '' : ' (v1)')) + '</title></circle>'; }).join('') + '</svg><div class="nrv-aeo-range"><span>' + esc(values[0].at) + '</span><span>' + esc(values[values.length - 1].at) + '</span></div>' + note;
  }
  function formatDay(value) {
    var at = new Date(value);
    return Number.isFinite(at.getTime()) ? at.toLocaleDateString() : String(value || '—');
  }
  // The two sub-scores and what the visibility rests on, or that it has not
  // been measured - never a number that was not measured.
  function breakdown(a) {
    if (!a) return '';
    var v = a.visibility || {}, r = a.readiness || {};
    var rows = '<dl class="nrv-sov-meta nrv-aeo-breakdown"><div><dt>' + esc(tr('scReadiness')) + '</dt><dd>' + esc(r.score === null || r.score === undefined ? '—' : r.score) + ' / 100</dd></div>'
      + '<div><dt>' + esc(tr('scVisibility')) + '</dt><dd>' + (v.measured ? esc(v.score) + ' / 100' : esc(tr('scNotMeasured'))) + '</dd></div></dl>';
    if (!v.measured) return rows + '<p class="notice">' + esc(tr('scReadinessOnly')) + '</p>';
    return rows + '<p class="notice">' + esc(tr('scBasedOn', { n: Number(v.answers || 0), k: Number(v.appeared || 0), d: Number(v.window_days || 90) })) + ' · ' + esc(tr('scWeight', { p: Math.round(Number(v.share || 0) * 100) })) + '</p>'
      + '<p class="notice">' + esc(tr('scVariability')) + '</p>';
  }
  function scoreSummary(scores, aeoScore) {
    var values = validScores(scores);
    if (!values.length) return '<div class="nrv-aeo-empty">' + esc(tr('amNoData')) + '</div>';
    var latest = values[values.length - 1];
    var comparable = values.filter(function(row){return latest.ruleset_version != null && latest.score_model_version && latest.delivered_ruleset_version != null && row.ruleset_version === latest.ruleset_version && row.score_model_version === latest.score_model_version && row.delivered_ruleset_version != null;});
    // A change is only stated between two points of the same score version.
    var sameVersion = comparable.filter(function (row) { return versionOf(row) === versionOf(latest) && headlineOf(row) !== null; });
    var previous = sameVersion.length > 1 ? sameVersion[sameVersion.length - 2] : null;
    var current = aeoScore && aeoScore.score !== null && aeoScore.score !== undefined && Number.isFinite(Number(aeoScore.score)) ? Number(aeoScore.score) : headlineOf(latest);
    var delta = previous && headlineOf(latest) !== null ? headlineOf(latest) - headlineOf(previous) : null;
    var trend = delta == null ? (values.length > 1 ? tr('amAccumulating') : tr('amFirst')) : delta > 0 ? '↗ +' + delta : delta < 0 ? '↘ ' + delta : '→ ' + tr('amNoChange');
    var band = aeoScore && aeoScore.band ? aeoScore.band : (latest.verdict || '');
    return '<div class="nrv-aeo-score"><strong data-aeo-headline>' + esc(current === null ? '—' : current) + '</strong><span>/ 100</span><b class="' + (delta > 0 ? 'up' : delta < 0 ? 'down' : '') + '">' + esc(trend) + '</b></div><p class="notice">' + esc(band) + ' · ' + esc(latest.scanned_at) + '</p>' + breakdown(aeoScore) + sparkline(comparable);
  }
  function crawlerTable(metrics) {
    if (!metrics.crawler_measurement) return '<div class="nrv-aeo-warning"><b>' + esc(tr('amNoVisitsTitle')) + '</b><br>' + esc(tr('amNoVisitsBody')) + '</div>';
    var hits = metrics.crawler_hits || [];
    if (!hits.length) return '<div class="nrv-aeo-empty">' + esc(tr('amNoCrawler')) + '</div>';
    var max = Math.max.apply(Math, hits.map(function (item) { return Number(item.hits || 0); }).concat([1]));
    return '<div class="tablewrap"><table><thead><tr><th>' + esc(tr('amDate')) + '</th><th>' + esc(tr('amCrawlerType')) + '</th><th>' + esc(tr('amVisits')) + '</th></tr></thead><tbody>' + hits.map(function (item) { var count = Number(item.hits || 0); return '<tr><td>' + esc(item.date) + '</td><td><code>' + esc(item.crawler_id) + '</code></td><td><div class="nrv-hit-cell"><span class="nrv-hit-bar" style="width:' + Math.max(4, Math.round(count / max * 100)) + '%"></span><b>' + count + '</b></div></td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function referralTrend(rows) {
    var byDay = {};
    (rows || []).forEach(function (row) { byDay[row.date] = (byDay[row.date] || 0) + Number(row.hits || 0); });
    var days = Object.keys(byDay).sort();
    if (!days.length) return '<div class="nrv-aeo-empty">' + esc(tr('amNoReferral')) + '</div>';
    var width = 520, height = 150, pad = 18, max = Math.max.apply(Math, days.map(function (day) { return byDay[day]; }).concat([1]));
    var points = days.map(function (day, index) {
      return { day: day, hits: byDay[day], x: pad + index * (width - pad * 2) / Math.max(1, days.length - 1), y: height - pad - byDay[day] * (height - pad * 2) / max };
    });
    return '<div class="nrv-aeo-score"><strong>' + esc(points[points.length - 1].hits) + '</strong><span>' + esc(tr('amLatestDay')) + '</span></div>'
      + '<svg class="nrv-aeo-chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="' + esc(tr('amReferralChart')) + '"><line x1="' + pad + '" y1="' + (height - pad) + '" x2="' + (width - pad) + '" y2="' + (height - pad) + '" class="axis"></line><polyline points="' + points.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ') + '" class="line"></polyline>' + points.map(function (p) { return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="4"><title>' + esc(p.day) + ': ' + esc(tr('amCount', { n: p.hits })) + '</title></circle>'; }).join('') + '</svg><div class="nrv-aeo-range"><span>' + esc(days[0]) + '</span><span>' + esc(days[days.length - 1]) + '</span></div>';
  }
  function rulesetStatus(metrics) {
    var ruleset = metrics.ruleset || {};
    if (!ruleset.auto_updates) return '<div class="nrv-ruleset static"><b>' + esc(tr('amStaticTitle')) + '</b><span>' + esc(tr('amStaticNote', { latest: ruleset.latest_version || '—' })) + '</span></div>';
    if (ruleset.status !== 'latest') return '<div class="nrv-ruleset static"><b>' + esc(tr('amVerifying')) + '</b><span>' + esc(tr('amVerifyingNote', { latest: ruleset.latest_version || '—', version: ruleset.version || '—' })) + '</span></div>';
    return '<div class="nrv-ruleset latest"><b>ruleset v' + esc(ruleset.version || '—') + '</b><span>' + esc(tr('amLatestNote')) + '</span></div>';
  }
  // Timestamps are stored as ISO strings; one that will not parse is shown as it
  // came rather than as "Invalid Date".
  function formatWhen(value) {
    var at = new Date(value);
    return Number.isFinite(at.getTime()) ? at.toLocaleString() : String(value);
  }
  // The score says how bad it is; the checklist says what to do about it. The
  // dashboard showed only the former, so an operator could see a site failing
  // with no indication of why or what to fix.
  function checklist(metrics) {
    var checks = metrics.checks || [];
    if (!checks.length) return '<div class="nrv-aeo-empty">' + esc(tr('amNoData')) + '</div>';
    // Findings first: a passing check is reassurance, a failing one is work.
    var rank = { BAD: 0, WARN: 1, OK: 2 };
    var ordered = checks.slice().sort(function (a, b) {
      var ra = rank[String(a.status).toUpperCase()], rb = rank[String(b.status).toUpperCase()];
      return (ra === undefined ? 1 : ra) - (rb === undefined ? 1 : rb);
    });
    var rows = ordered.map(function (check) {
      var status = String(check.status || '').toUpperCase();
      var cls = status === 'OK' ? 'ok' : status === 'WARN' ? 'warn' : 'bad';
      var mark = status === 'OK' ? '✓' : status === 'WARN' ? '!' : '×';
      return '<li class="nrv-aeo-check is-' + cls + '">'
        + '<span class="nrv-aeo-check-icon" aria-hidden="true">' + mark + '</span>'
        + '<div><strong>' + esc(check.label || check.id || '') + '</strong>'
        + '<p>' + esc(check.message || '') + '</p>'
        + (Array.isArray(check.fields) ? '<details open><summary>' + check.fields.filter(function(f){return f.present;}).length + '/' + check.fields.length + '</summary>' + check.fields.map(function(f){return '<p>' + (f.present ? '✓ ' : '✗ ') + '<code>' + esc(f.entityType + '.' + f.field) + '</code> — ' + esc(f.label) + (f.present ? '' : '<br>' + esc(f.description) + '<br>' + esc(f.howTo)) + '</p>';}).join('') + '</details>' : '')
        + (check.hints || []).map(function(h){return '<p>' + esc(h) + '</p>';}).join('') + '</div></li>';
    }).join('');
    var when = metrics.checked_at
      ? '<p class="nrv-aeo-range"><span>' + esc(tr('amCheckedAt')) + '</span><span>' + esc(formatWhen(metrics.checked_at)) + '</span></p>'
      : '';
    return '<ol class="nrv-aeo-checks">' + rows + '</ol>' + when;
  }
  function optimizationNotice(metrics) {
    var detail = metrics.optimization;
    if (!detail || !detail.action_required) return '';
    var fields = (detail.missing_fields || []).map(function(f){return esc(f.entityType + '.' + f.field);}).join(', ');
    return '<div class="nrv-aeo-warning" role="status"><b>' + esc(tr('amOptTitle')) + '</b><p>' + esc(tr('amOptBody')) + '</p><p>' + fields + '</p></div>';
  }
  function panel(metrics) {
    var section = document.createElement('section');
    section.className = 'nrv-aeo-metrics';
    section.dataset.siteId = metrics.site_id;
    section.innerHTML = '<div class="card panel"><div class="nrv-aeo-heading"><div><small>' + esc(tr('amKicker')) + '</small><h2>' + esc(tr('amHeading')) + '</h2></div>' + rulesetStatus(metrics) + '</div>' + optimizationNotice(metrics) + '<div class="nrv-aeo-grid"><section><h3>' + esc(tr('amScoreDaily')) + '</h3>' + scoreSummary(metrics.scores, metrics.aeo_score) + '</section><section><h3>' + esc(tr('amReferralDaily')) + '</h3>' + referralTrend(metrics.ai_referrals) + '</section></div><section class="nrv-aeo-checklist"><h3>' + esc(tr('amCrawlerTitle')) + '</h3>' + crawlerTable(metrics) + '</section><section class="nrv-aeo-checklist"><h3>' + esc(tr('amChecklist')) + '</h3>' + checklist(metrics) + '</section></div>';
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
    placeholder.innerHTML = '<div class="card panel"><p class="notice">' + esc(tr('amLoading')) + '</p></div>';
    main.appendChild(placeholder);
    try {
      // Ask for the checklist in the language this page is written in. The
      // endpoint otherwise negotiates on Accept-Language, which would put an
      // English checklist inside the Japanese panel around it for anyone whose
      // browser prefers English.
      var lang = document.documentElement.lang || 'ja';
      var response = await fetch('/api/sites/' + encodeURIComponent(siteId) + '/aeo-metrics?limit=30&days=30&lang=' + encodeURIComponent(lang), { credentials: 'include', cache: 'no-store' });
      var metrics = await response.json();
      if (!response.ok) throw new Error(metrics.error || tr('amLoadFailed'));
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
  style.textContent = '.nrv-aeo-metrics{margin-top:18px}.nrv-aeo-heading{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-bottom:18px}.nrv-aeo-heading small{color:#6f4df6;font-weight:800}.nrv-aeo-heading h2{font-size:19px;margin:2px 0}.nrv-aeo-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}.nrv-aeo-grid h3{font-size:14px;margin:0 0 12px}.nrv-aeo-score{display:flex;align-items:baseline;gap:5px}.nrv-aeo-score strong{font-size:36px;color:#4b31c6}.nrv-aeo-score b{margin-left:auto;font-size:12px;color:#667085}.nrv-aeo-score b.up{color:#128a48}.nrv-aeo-score b.down{color:#c83f49}.nrv-aeo-chart{display:block;width:100%;height:auto;min-height:120px;background:#faf9fe;border-radius:10px}.nrv-aeo-chart .axis{stroke:#ded9ea;stroke-width:1}.nrv-aeo-chart .line{fill:none;stroke:#6f4df6;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.nrv-aeo-chart circle{fill:#fff;stroke:#6f4df6;stroke-width:3}.nrv-aeo-range{display:flex;justify-content:space-between;color:#8b8498;font-size:10px}.nrv-ruleset{display:grid;gap:1px;border-radius:9px;padding:8px 11px;font-size:12px}.nrv-ruleset.latest{background:#eaf8ef;color:#176b3a}.nrv-ruleset.static,.nrv-aeo-warning{background:#fff7d6;border:1px solid #f0c75e;color:#6d5000}.nrv-ruleset span{font-size:11px}.nrv-aeo-warning,.nrv-aeo-empty{border-radius:9px;padding:14px;font-size:12px}.nrv-aeo-checklist{margin-top:22px;border-top:1px solid #efecf4;padding-top:18px}.nrv-aeo-checks{list-style:none;margin:0;padding:0}.nrv-aeo-check{display:grid;grid-template-columns:26px minmax(0,1fr);gap:10px;padding:11px 0;border-top:1px solid #f3f1f7}.nrv-aeo-check:first-child{border-top:0}.nrv-aeo-check strong{display:block;font-size:13px}.nrv-aeo-check p{margin:2px 0 0;color:#6c6579;font-size:12px}.nrv-aeo-check-icon{width:22px;height:22px;display:grid;place-items:center;border-radius:50%;color:#fff;font-size:12px;font-weight:800}.nrv-aeo-check.is-ok .nrv-aeo-check-icon{background:#1a9c6b}.nrv-aeo-check.is-warn .nrv-aeo-check-icon{background:#b7791f}.nrv-aeo-check.is-bad .nrv-aeo-check-icon{background:#d13b3b}.nrv-aeo-empty{background:#f6f7fb;color:#687080;text-align:center}.nrv-hit-cell{position:relative;min-width:100px}.nrv-hit-bar{display:block;height:20px;border-radius:5px;background:#dcd3ff}.nrv-hit-cell b{position:absolute;left:7px;top:0;line-height:20px;font-size:11px}.nrv-aeo-grid code{font-size:11px}@media(max-width:800px){.nrv-aeo-grid{grid-template-columns:1fr}}';
  document.head.appendChild(style);
  new MutationObserver(function () { mount(); }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(mount, 500);
})();
