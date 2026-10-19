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
      // Coming soon, so this links to what Pro will do rather than to a
      // checkout. "Upgrade" invited someone to buy a plan that is not on sale.
      + '<p class="nrv-sov-note"><b>β・近日提供</b></p>'
      + (upgrade.details_url ? '<p><a class="nrv-sov-cta" href="' + esc(upgrade.details_url) + '" target="_blank" rel="noopener">Proの詳細を見る</a></p>' : '')
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

  async function addProReport(main, siteId) {
    var section = main.querySelector('.nrv-sov');
    if (!section || section.querySelector('.nrv-sov-locked')) return;
    var response = await fetch('/api/sites/' + encodeURIComponent(siteId) + '/sov/report', { credentials: 'include' });
    if (!response.ok || !section.isConnected) return;
    var report = (await response.json()).report;
    var box = document.createElement('div'); box.className = 'card panel';
    var config = report.current_query_set || { questions: [], repetitions: 2, competitors: [] };
    var table = function (rows) { return '<table style="width:100%">' + rows.map(function (row) { return '<tr>' + row.map(function (cell) { return '<td style="padding:6px">' + esc(cell) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>'; };
    var pct = function (v) { return v == null ? '算出不可／サンプル不足' : Math.round(v * 1000) / 10 + '%'; };
    box.innerHTML = '<h3>Pro 測定レポート</h3><p>' + esc(report.notice) + '</p>'
      + '<p>' + (report.status === 'unconfigured' ? 'Perplexity未設定：測定していません。' : report.status === 'no_data' ? '未測定' : '回答数 ' + esc(report.summary.answers) + '／引用頻度 ' + pct(report.summary.citation_rate)) + '</p>'
      + '<p>キャッシュは1時間。同じ条件の測定は再利用します。測定は有料APIの利用枠を消費します。</p>'
      + '<details><summary>固定クエリセットを編集</summary><label>代表クエリ（1行1件、最大20件）<textarea data-pro-questions style="width:100%;min-height:120px">' + esc(config.questions.join('\n')) + '</textarea></label>'
      + '<label>各クエリの実行回数 <input data-pro-n type="number" min="1" max="3" value="' + esc(config.repetitions) + '"></label>'
      + '<label>競合ドメイン（1行1件、最大10件）<textarea data-pro-competitors style="width:100%">' + esc(config.competitors.join('\n')) + '</textarea></label><button data-pro-save>設定を保存</button></details>'
      + '<button data-pro-run>測定を実行</button> <button data-pro-json>JSONを保存</button><p data-pro-status role="status"></p>'
      + '<h4>Presence</h4>' + table([['クエリ','回答数','引用回数','頻度']].concat(report.presence.map(function(r){ return [r.question,r.answers,r.citations,pct(r.frequency)]; })))
      + '<h4>指定競合との比較</h4><p>' + esc(report.sov_basis) + '</p>' + (report.recount_note ? '<p>' + esc(report.recount_note) + '</p>' : '') + table([['ドメイン','引用回数','頻度','SoV']].concat(report.competitors.map(function(r){ return [r.host + (r.own ? '（自社）' : r.recounted ? '（再集計）' : ''),r.citations,pct(r.frequency),pct(r.share_of_voice)]; })))
      + '<h4>同じ測定条件での推移</h4>' + table([['日時','回答数','引用頻度']].concat(report.trend.map(function(r){ return [r.ran_at,r.answers_received,pct(r.citation_rate)]; })))
      + '<h4>ギャップ</h4>' + (report.gaps.length ? report.gaps.map(function(r){ return '<p>' + esc(r.question + '：' + r.reason) + '</p>'; }).join('') : '<p>記録なし（改善不要の判定ではありません）</p>')
      + '<h4>正確性と証跡</h4><p>回答抜粋を確認し、事実との明らかな相違を記録してください。未確認は正確性未判定です。</p>'
      + report.evidence.map(function(e){ return '<details data-pro-evidence="' + esc(e.id) + '"><summary>' + esc(e.question + '／' + e.measured_at + '／' + e.engine + '／引用順 ' + (e.citation_rank || 'なし')) + '</summary><p>' + esc(e.answer_summary || '回答なし') + '</p><p>言及：' + esc(e.accuracy.mentioned == null ? '判定不可' : e.accuracy.mentioned ? 'あり' : 'なし') + '／確認状態：' + esc(e.accuracy.status) + '</p><pre style="white-space:pre-wrap">' + esc(e.citation_urls.join('\n')) + '</pre><select data-pro-review><option value="uncertain">未確定</option><option value="confirmed_error">明らかな誤りあり</option><option value="checked_no_obvious_error">確認した範囲で明らかな誤りなし</option></select><textarea data-pro-note placeholder="比較した事実・参照URL・確認範囲">' + esc(e.accuracy.note || '') + '</textarea><button data-pro-review-save>確認結果を保存</button></details>'; }).join('');
    section.appendChild(box);
    async function write(path, method, body) {
      var csrf = await (await fetch('/api/csrf', { credentials: 'include' })).json();
      var res = await fetch('/api/sites/' + encodeURIComponent(siteId) + '/sov' + path, { method:method, credentials:'include', headers:{'content-type':'application/json','x-csrf-token':csrf.csrf_token}, body:body === undefined ? undefined : JSON.stringify(body) });
      var data = await res.json(); if (!res.ok) throw new Error(data.error || '保存できませんでした'); return data;
    }
    box.addEventListener('click', async function(event) {
      var target = event.target, status = box.querySelector('[data-pro-status]');
      if (!target.matches('button')) return;
      target.disabled = true;
      try {
        if (target.hasAttribute('data-pro-json')) {
          var blob = URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
          var a = document.createElement('a'); a.href=blob; a.download='pro-report-' + siteId + '.json'; a.click(); setTimeout(function(){ URL.revokeObjectURL(blob); },1000);
        } else if (target.hasAttribute('data-pro-save')) {
          await write('/query-set','PUT',{questions:box.querySelector('[data-pro-questions]').value.split('\n').filter(function(v){ return v.trim(); }), repetitions:Number(box.querySelector('[data-pro-n]').value), competitors:box.querySelector('[data-pro-competitors]').value.split('\n').map(function(v){ return v.trim(); }).filter(Boolean)});
          status.textContent='保存しました。次回測定に反映します。';
        } else if (target.hasAttribute('data-pro-run')) {
          status.textContent='測定中…'; var result = await write('','POST'); status.textContent=result.status === 'unconfigured' ? 'Perplexity未設定：測定していません。' : result.cached ? 'キャッシュを再利用しました。' : '測定しました。';
          box.remove(); await addProReport(main,siteId);
        } else if (target.hasAttribute('data-pro-review-save')) {
          var evidence = target.closest('[data-pro-evidence]');
          await write('/evidence/' + encodeURIComponent(evidence.getAttribute('data-pro-evidence')),'PUT',{status:evidence.querySelector('[data-pro-review]').value,note:evidence.querySelector('[data-pro-note]').value});
          box.remove(); await addProReport(main,siteId);
        }
      } catch(error) { status.textContent=String(error.message); }
      finally { target.disabled=false; }
    });
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
        await addProReport(main, siteId);
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
