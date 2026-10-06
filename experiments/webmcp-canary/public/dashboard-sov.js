/* Nurevo dashboard asset revision: 2026-10-07-asset1 */
/*
 * AI Share-of-Voice panel (Pro, beta).
 *
 * Reads a stored measurement and renders it. Nothing here triggers a run: SoV
 * costs engine queries against a monthly cap, so measurement is scheduled and
 * this panel only ever reports what has already been measured.
 *
 * The rules this panel exists to respect:
 *  - A missing rate is never drawn as 0%. "Measured, and it is zero" and "could
 *    not be measured" are different findings and are worded differently.
 *  - Perplexity searches the web; the OpenAI endpoint answers from model
 *    knowledge. They are never added into one rate, and the second is labelled
 *    as not being live search wherever it appears.
 *  - Failed probes and aggregator sites are excluded upstream. This panel does
 *    not add them back.
 */
(function () {
  "use strict";
  var selectedSiteId = null;
  var loadingSiteId = null;
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }

  function formatWhen(value) {
    var at = new Date(value);
    return Number.isFinite(at.getTime()) ? at.toLocaleString() : String(value || '—');
  }

  /*
   * Why a rate is absent, decided from the rate itself rather than from a
   * separate flag. A null rate with answers recorded means too few of them; a
   * null rate with none means nothing came back. A rate of 0 is a measurement
   * and keeps its number.
   */
  function basisOf(rate, answers) {
    if (rate === null || rate === undefined) {
      return Number(answers || 0) === 0 ? 'no_answers' : 'insufficient_samples';
    }
    return 'measured';
  }

  function rateText(rate, answers) {
    var basis = basisOf(rate, answers);
    if (basis === 'no_answers') return '<span class="nrv-sov-none">まだ出典として現れていません</span>';
    if (basis === 'insufficient_samples') return '<span class="nrv-sov-none">サンプル不足（n=' + esc(Number(answers || 0)) + '）</span>';
    return '<span class="nrv-sov-rate">' + esc(Math.round(Number(rate) * 1000) / 10) + '%</span>'
      + '<span class="nrv-sov-n">n=' + esc(Number(answers || 0)) + '</span>';
  }

  // Perplexity is the headline because it is the one that actually searches.
  // The other engine is reported, but never as the same kind of evidence.
  function engineCard(row) {
    var live = row.live_search === true;
    var name = row.engine === 'perplexity' ? 'Perplexity' : row.engine === 'openai' ? 'ChatGPT (OpenAI)' : String(row.engine || '不明');
    var kind = live
      ? '<span class="nrv-sov-tag is-live">ライブ検索での出現</span>'
      : '<span class="nrv-sov-tag is-static">学習済み知識内の存在<b>ライブ検索ではない</b></span>';
    // failures are shown next to the sample count, never folded into it: an
    // engine outage must lower confidence, not the rate.
    var failures = Number(row.failures || 0)
      ? '<span class="nrv-sov-fail">失敗 ' + esc(Number(row.failures)) + '件（率から除外）</span>' : '';
    return '<div class="nrv-sov-engine' + (live ? ' is-headline' : '') + '">'
      + '<div class="nrv-sov-engine-head"><strong>' + esc(name) + '</strong>' + kind + '</div>'
      + '<div class="nrv-sov-engine-rate">' + rateText(row.appearance_rate, row.answers) + '</div>'
      + failures + '</div>';
  }

  /*
   * Runs written before the per-engine split was stored. The blended rate those
   * rows carry spans both engines, so it is not shown at all - a number that
   * mixes live search with model knowledge answers neither question. The roster
   * and the counts are still true, so they are.
   */
  function legacyEngines(latest) {
    var engines = latest.engines || [];
    if (!engines.length) return '<p class="nrv-sov-note">この測定にはエンジン内訳が記録されていません。</p>';
    var rows = engines.map(function (engine) {
      var live = engine.live_search === true;
      return '<li>' + esc(engine.label || engine.id || '')
        + (live ? '<span class="nrv-sov-tag is-live">ライブ検索</span>'
                : '<span class="nrv-sov-tag is-static">学習済み知識<b>ライブ検索ではない</b></span>') + '</li>';
    }).join('');
    return '<ul class="nrv-sov-roster">' + rows + '</ul>'
      + '<p class="nrv-sov-note">この測定はエンジン別の内訳を保存していないため、出現率は表示していません。'
      + 'ライブ検索と学習済み知識を1つの率に混ぜないためです。次回の測定から表示されます。</p>';
  }

  function competitorList(latest) {
    var rows = latest.competitors || [];
    if (!rows.length) return '';
    var items = rows.slice(0, 10).map(function (row) {
      return '<li><code>' + esc(row.host || '') + '</code>'
        + '<span>' + esc(Number(row.appearances || 0)) + '回</span></li>';
    }).join('');
    return '<div class="nrv-sov-competitors"><h4>同じ質問で挙がった他社</h4><ul>' + items + '</ul></div>';
  }

  function control(latest) {
    var ctl = latest.parser_control;
    if (!ctl) return '';
    // Shown so a low rate can be told apart from a broken matcher.
    return '<p class="nrv-sov-note">パーサー確認用の指名質問：' + esc(Number(ctl.answers || 0)) + '件中 '
      + esc(Number(ctl.detected || 0)) + '件で検出（出現率には算入していません）。</p>';
  }

  function measured(data) {
    var latest = data.latest;
    var byEngine = (latest.by_engine || []).filter(function (row) { return row && row.engine; });
    // Headline first, model-knowledge engines after it.
    var ordered = byEngine.slice().sort(function (a, b) {
      return (b.live_search === true ? 1 : 0) - (a.live_search === true ? 1 : 0);
    });
    var body = ordered.length
      ? '<div class="nrv-sov-engines">' + ordered.map(engineCard).join('') + '</div>'
      : legacyEngines(latest);

    var asOf = '<dl class="nrv-sov-meta">'
      + '<div><dt>診断時刻</dt><dd>' + esc(formatWhen(latest.ran_at)) + '</dd></div>'
      + '<div><dt>質問数</dt><dd>' + esc(Number(latest.questions_asked || 0)) + '</dd></div>'
      + '<div><dt>回答数</dt><dd>' + esc(Number(latest.answers_received || 0)) + '</dd></div>'
      + '<div><dt>消費クエリ</dt><dd>' + esc(Number(latest.queries_used || 0)) + '</dd></div>'
      + '</dl>';

    return asOf + body + competitorList(latest) + control(latest);
  }

  function empty() {
    return '<div class="nrv-aeo-empty">Pro βの測定はスケジュール実行です。まだ結果がありません。</div>';
  }

  // free / standard. States the current plan and what Pro measures - no numbers,
  // real or invented, appear here.
  function locked(info) {
    var upgrade = (info && info.upgrade) || {};
    var plan = (info && info.plan) || 'free';
    return '<div class="nrv-sov-locked">'
      + '<p class="nrv-sov-locked-head"><b>AI登場率は Pro β で測定します</b></p>'
      + '<p>' + esc(upgrade.message || 'AI登場率の測定はProプランの機能です。') + '</p>'
      + '<p class="nrv-sov-note">現在のプラン：<code>' + esc(plan) + '</code></p>'
      + (upgrade.upgrade_url ? '<p><a class="nrv-sov-cta" href="' + esc(upgrade.upgrade_url) + '">Proにアップグレード</a></p>' : '')
      + '</div>';
  }

  function panel(state) {
    var section = document.createElement('section');
    section.className = 'nrv-sov';
    var beta = '<span class="nrv-sov-beta">β</span>';
    var inner;
    if (state.kind === 'locked') inner = locked(state.data);
    else if (!state.data.latest) inner = empty();
    else inner = measured(state.data);
    section.innerHTML = '<div class="card panel">'
      + '<div class="nrv-aeo-heading"><div><small>AI登場率</small>'
      + '<h2>AI検索での見つかり方 ' + beta + '</h2></div></div>'
      + inner + '</div>';
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
    if (main.querySelector('.nrv-sov')) return;
    var siteId = await resolveSiteId();
    if (!siteId || loadingSiteId === siteId || main.querySelector('.nrv-sov')) return;
    loadingSiteId = siteId;
    try {
      // A read. The endpoint reports a stored run and never calls an engine.
      var response = await fetch('/api/sites/' + encodeURIComponent(siteId) + '/sov?limit=8', { credentials: 'include', cache: 'no-store' });
      var data = await response.json();
      if (main.querySelector('.nrv-sov')) return;
      if (response.status === 402) {
        // The plan is the server's answer, not something this script works out.
        main.appendChild(panel({ kind: 'locked', data: data }));
      } else if (response.ok) {
        main.appendChild(panel({ kind: 'measured', data: data }));
      }
      // Anything else leaves the page as it was: a panel that cannot say
      // anything true is worse than no panel.
    } catch (error) {
      /* fail open - the rest of the dashboard is unaffected */
    } finally { loadingSiteId = null; }
  }

  document.addEventListener('click', function (event) {
    var row = event.target.closest && event.target.closest('[data-site]');
    if (row) selectedSiteId = row.getAttribute('data-site');
    var back = event.target.closest && event.target.closest('[data-view="sites"]');
    if (back) selectedSiteId = null;
  }, true);

  var style = document.createElement('style');
  style.textContent = '.nrv-sov{margin-top:18px}.nrv-sov-beta{font-size:10px;background:#efe9ff;color:#5a3ad6;border-radius:5px;padding:2px 6px;margin-left:6px;vertical-align:middle;font-weight:800}.nrv-sov-meta{display:flex;flex-wrap:wrap;gap:18px;margin:0 0 16px;padding:0}.nrv-sov-meta div{margin:0}.nrv-sov-meta dt{font-size:10px;color:#8b8498;margin:0}.nrv-sov-meta dd{margin:1px 0 0;font-size:13px;font-weight:700}.nrv-sov-engines{display:grid;grid-template-columns:1fr 1fr;gap:14px}.nrv-sov-engine{border:1px solid #ece9f3;border-radius:10px;padding:13px}.nrv-sov-engine.is-headline{border-color:#cdbcff;background:#faf8ff}.nrv-sov-engine-head{display:flex;flex-direction:column;gap:5px;margin-bottom:9px}.nrv-sov-engine-head strong{font-size:13px}.nrv-sov-tag{font-size:10px;border-radius:5px;padding:2px 6px;align-self:flex-start;font-weight:700}.nrv-sov-tag.is-live{background:#e7f5ec;color:#176b3a}.nrv-sov-tag.is-static{background:#f1eff5;color:#5d5570}.nrv-sov-tag b{display:block;font-size:9px;font-weight:800;opacity:.85}.nrv-sov-rate{font-size:28px;font-weight:800;color:#4b31c6}.nrv-sov-n{font-size:11px;color:#8b8498;margin-left:6px}.nrv-sov-none{font-size:12px;color:#6c6579}.nrv-sov-fail{display:block;margin-top:6px;font-size:10px;color:#9a6b00}.nrv-sov-roster{list-style:none;margin:0 0 10px;padding:0}.nrv-sov-roster li{display:flex;gap:8px;align-items:center;padding:6px 0;font-size:13px;border-top:1px solid #f3f1f7}.nrv-sov-roster li:first-child{border-top:0}.nrv-sov-note{margin:10px 0 0;font-size:11px;color:#6c6579;line-height:1.6}.nrv-sov-competitors{margin-top:18px;border-top:1px solid #efecf4;padding-top:14px}.nrv-sov-competitors h4{font-size:12px;margin:0 0 8px}.nrv-sov-competitors ul{list-style:none;margin:0;padding:0}.nrv-sov-competitors li{display:flex;justify-content:space-between;padding:5px 0;font-size:12px;border-top:1px solid #f3f1f7}.nrv-sov-competitors li:first-child{border-top:0}.nrv-sov-locked{background:#faf9fe;border:1px solid #e6e1f3;border-radius:10px;padding:18px}.nrv-sov-locked-head{margin:0 0 6px;font-size:14px}.nrv-sov-locked p{margin:0 0 6px;font-size:12px;color:#5d5570}.nrv-sov-cta{display:inline-block;margin-top:6px;background:#6f4df6;color:#fff;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;text-decoration:none}@media(max-width:800px){.nrv-sov-engines{grid-template-columns:1fr}}';
  document.head.appendChild(style);
  new MutationObserver(function () { mount(); }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(mount, 600);
})();
