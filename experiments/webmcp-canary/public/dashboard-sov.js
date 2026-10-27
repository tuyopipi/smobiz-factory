/* Nurevo dashboard asset revision: 2026-10-27-scorev2 */
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
 *  - Each engine (Perplexity, ChatGPT with web search) has its own row, n, interval and trend. The combined
 *    rate is shown as its own line and never replaces an engine's figure.
 *  - Failed probes and aggregator sites are excluded upstream. This panel does
 *    not add them back.
 */
(function () {
  "use strict";
  var selectedSiteId = null;
  var loadingSiteId = null;
  // Words come from the dashboard dictionary (t() in dashboard.html), as in
  // dashboard-onboarding.js. Server text (upgrade copy, notices, gap reasons)
  // is shown as the server sent it; the Pro report is requested in the
  // dashboard's language so that text matches the page.
  function tr(key, vars) {
    var text = typeof t === "function" ? String(t(key)) : key;
    return text.replace(/\{(\w+)\}/g, function (m, name) { return vars && vars[name] != null ? String(vars[name]) : m; });
  }
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
    if (basis === 'no_answers') return '<span class="nrv-sov-none">' + esc(tr('svNotYet')) + '</span>';
    if (basis === 'insufficient_samples') return '<span class="nrv-sov-none">' + esc(tr('svInsufficient', { n: Number(answers || 0) })) + '</span>';
    return '<span class="nrv-sov-rate">' + esc(Math.round(Number(rate) * 1000) / 10) + '%</span>'
      + '<span class="nrv-sov-n">n=' + esc(Number(answers || 0)) + '</span>';
  }

  // Perplexity is the headline because it is the one that actually searches.
  // The other engine is reported, but never as the same kind of evidence.
  function engineCard(row) {
    var live = row.live_search === true;
    var name = engineName(row.engine);
    var kind = live
      ? '<span class="nrv-sov-tag is-live">' + esc(tr('svLiveTag')) + '</span>'
      : '<span class="nrv-sov-tag is-static">' + esc(tr('svStaticTag')) + '<b>' + esc(tr('svNotLive')) + '</b></span>';
    // failures are shown next to the sample count, never folded into it: an
    // engine outage must lower confidence, not the rate.
    var failures = Number(row.failures || 0)
      ? '<span class="nrv-sov-fail">' + esc(tr('svFailures', { n: Number(row.failures) })) + '</span>' : '';
    return '<div class="nrv-sov-engine' + (live ? ' is-headline' : '') + '">'
      + '<div class="nrv-sov-engine-head"><strong>' + esc(name) + '</strong>' + kind + '</div>'
      + '<div class="nrv-sov-engine-label">' + esc(tr('svAppearRate')) + '</div>'
      + '<div class="nrv-sov-engine-rate">' + rateText(row.appearance_rate, row.answers) + '</div>'
      + citeLine(row)
      + failures + '</div>';
  }

  function engineName(id) {
    return id === 'perplexity' ? 'Perplexity' : id === 'openai' ? 'ChatGPT' : String(id || tr('svUnknown'));
  }

  /*
   * The Pro report's per-engine table: Perplexity / ChatGPT, each
   * with its appearance rate (named or cited), n, Wilson 95% interval, named
   * and cited counts, and when it was last measured. An engine that was not
   * asked says why (not configured, monthly limit, paused) instead of showing
   * a number. Below n=20 the row is marked as reference only.
   */
  function engineReportTable(report) {
    var rows = (report && report.engines) || [];
    if (!rows.length) return '';
    var pct = function (v) { return v == null ? '—' : Math.round(Number(v) * 1000) / 10 + '%'; };
    var statusText = function (row) {
      if (row.status === 'not_configured') return tr('svStNotConfigured');
      if (row.status === 'quota_reached') return String(row.quota_scope || '').indexOf('global') === 0 ? tr('svStQuotaGlobal') : tr('svStQuota');
      if (row.status === 'disabled') return tr('svStDisabled');
      if (row.status === 'migration_pending') return tr('svStMigration');
      if (row.status === 'failed') return tr('svStFailed');
      if (row.status === 'no_data') return tr('svStNoData');
      return '';
    };
    var line = function (row, label) {
      var n = Number(row.n || 0);
      var rate = n > 0 && row.appearance_rate != null ? pct(row.appearance_rate) : n > 0 ? tr('svInsufficient', { n: n }) : '—';
      var interval = row.interval ? pct(row.interval.low) + '–' + pct(row.interval.high) : '—';
      var state = statusText(row);
      var usage = row.usage && row.usage.site_used != null && row.usage.site_cap != null
        ? tr('svUsage', { used: row.usage.site_used, cap: row.usage.site_cap }) : '';
      var notes = [state, row.small_sample && n > 0 ? tr('svSmallN') : '', usage].filter(Boolean).join(' / ');
      return '<tr data-engine-row="' + esc(row.engine || 'combined') + '">'
        + '<td style="padding:6px"><strong>' + esc(label) + '</strong></td>'
        + '<td style="padding:6px">' + esc(rate) + '</td>'
        + '<td style="padding:6px">' + esc(n > 0 ? n : '—') + '</td>'
        + '<td style="padding:6px">' + esc(interval) + '</td>'
        + '<td style="padding:6px">' + esc(n > 0 ? row.named : '—') + '</td>'
        + '<td style="padding:6px">' + esc(n > 0 ? row.cited : '—') + '</td>'
        + '<td style="padding:6px">' + esc(row.last_run_at ? formatWhen(row.last_run_at) : '—') + '</td>'
        + '<td style="padding:6px" class="nrv-sov-note">' + esc(notes) + '</td></tr>';
    };
    var head = '<tr>' + [tr('svEngineCol'), tr('svAnyRate'), 'n', tr('svInterval'), tr('svNamedCol'), tr('svCitedCol'), tr('svLastRun'), ''].map(function (h) {
      return '<th style="padding:6px;text-align:left">' + esc(h) + '</th>';
    }).join('') + '</tr>';
    var body = rows.map(function (row) { return line(row, engineName(row.engine)); }).join('');
    var combined = report.combined && Number(report.combined.n || 0) > 0
      ? line({ engine: 'combined', n: report.combined.n, appearance_rate: report.combined.appearance_rate, interval: report.combined.interval,
          named: report.combined.named, cited: report.combined.cited, small_sample: report.combined.small_sample, last_run_at: null, status: 'measured' }, tr('svCombined'))
      : '';
    return '<h4>' + esc(tr('svEngines')) + '</h4><div style="overflow-x:auto"><table class="nrv-sov-engine-table" style="width:100%">' + head + body + combined + '</table></div>'
      + '<p class="nrv-sov-note">' + esc(tr('svAnyNote')) + '</p>';
  }

  /*
   * An answer's sources as clickable links. OpenAI asks that citations shown
   * to end users be visible and clickable; every engine's are shown the same way.
   */
  function sourceLinks(urls) {
    var list = (urls || []).filter(function (url) { return /^https?:\/\//i.test(String(url)); });
    if (!list.length) return '';
    return '<ul class="nrv-sov-sources">' + list.map(function (url) {
      return '<li><a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer nofollow">' + esc(url) + '</a></li>';
    }).join('') + '</ul>';
  }

  // The citation rate is secondary: only where the engine returns sources and
  // the appearance rate itself had enough answers to be a rate.
  function citeLine(row) {
    if (row.citations_available === false || row.appearance_rate === null || row.appearance_rate === undefined || !Number(row.answers)) return '';
    var rate = Math.round(Number(row.citations || 0) / Number(row.answers) * 1000) / 10 + '%';
    return '<p class="nrv-sov-note nrv-sov-cite">' + esc(tr('svEngineCite', { rate: rate })) + '</p>';
  }

  /*
   * Runs written before the per-engine split was stored. The blended rate those
   * rows carry spans both engines, so it is not shown at all - a number that
   * mixes live search with model knowledge answers neither question. The roster
   * and the counts are still true, so they are.
   */
  function legacyEngines(latest) {
    var engines = latest.engines || [];
    if (!engines.length) return '<p class="nrv-sov-note">' + esc(tr('svNoBreakdown')) + '</p>';
    var rows = engines.map(function (engine) {
      var live = engine.live_search === true;
      return '<li>' + esc(engine.label || engine.id || '')
        + (live ? '<span class="nrv-sov-tag is-live">' + esc(tr('svLive')) + '</span>'
                : '<span class="nrv-sov-tag is-static">' + esc(tr('svKnowledge')) + '<b>' + esc(tr('svNotLive')) + '</b></span>') + '</li>';
    }).join('');
    return '<ul class="nrv-sov-roster">' + rows + '</ul>'
      + '<p class="nrv-sov-note">' + esc(tr('svLegacyNote')) + '</p>';
  }

  function competitorList(latest) {
    var rows = latest.competitors || [];
    if (!rows.length) return '';
    var items = rows.slice(0, 10).map(function (row) {
      return '<li><code>' + esc(row.host || '') + '</code>'
        + '<span>' + esc(tr('svTimes', { n: Number(row.appearances || 0) })) + '</span></li>';
    }).join('');
    return '<div class="nrv-sov-competitors"><h4>' + esc(tr('svCompetitors')) + '</h4><ul>' + items + '</ul></div>';
  }

  function control(latest) {
    var ctl = latest.parser_control;
    if (!ctl) return '';
    // Shown so a low rate can be told apart from a broken matcher.
    return '<p class="nrv-sov-note">' + esc(tr('svControl', { answers: Number(ctl.answers || 0), detected: Number(ctl.detected || 0) })) + '</p>';
  }

  // questions_asked counts probes (questions x repetitions). Show the two
  // apart - "5問 × 2回" - when the run says them; an older run keeps its number.
  function questionsAsked(latest) {
    var q = Number(latest.distinct_questions), r = Number(latest.repetitions);
    if (q > 0 && r > 0) return tr('svQxR', { q: q, r: r });
    return Number(latest.questions_asked || 0);
  }

  // The headline AEO score (v2) and its two sub-scores, as the score panel
  // shows them. Absent when the site has no diagnosis yet.
  function aeoScoreLine(score) {
    if (!score || score.score === null || score.score === undefined) return '';
    var v = score.visibility || {};
    var text = tr('scHeadlineOf', { score: score.score, r: score.readiness && score.readiness.score != null ? score.readiness.score : '—', v: v.measured ? v.score : tr('scNotMeasured') });
    var basis = v.measured ? tr('scBasedOn', { n: Number(v.answers || 0), k: Number(v.appeared || 0), d: Number(v.window_days || 90) }) : tr('scReadinessOnly');
    return '<p data-pro-aeo-score><b>' + esc(text) + '</b><br><small>' + esc(basis) + '</small></p>';
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
      + '<div><dt>' + esc(tr('svRanAt')) + '</dt><dd>' + esc(formatWhen(latest.ran_at)) + '</dd></div>'
      + '<div><dt>' + esc(tr('svQuestions')) + '</dt><dd>' + esc(questionsAsked(latest)) + '</dd></div>'
      + '<div><dt>' + esc(tr('svAnswers')) + '</dt><dd>' + esc(Number(latest.answers_received || 0)) + '</dd></div>'
      + '<div><dt>' + esc(tr('svQueries')) + '</dt><dd>' + esc(Number(latest.queries_used || 0)) + '</dd></div>'
      + '</dl>';

    return asOf + body + competitorList(latest) + control(latest);
  }

  function empty() {
    return '<div class="nrv-aeo-empty">' + esc(tr('svEmpty')) + '</div>';
  }

  // free / standard. States the current plan and what Pro measures - no numbers,
  // real or invented, appear here.
  function locked(info) {
    var upgrade = (info && info.upgrade) || {};
    var plan = (info && info.plan) || 'free';
    return '<div class="nrv-sov-locked">'
      + '<p class="nrv-sov-locked-head"><b>' + esc(tr('svLockedHead')) + '</b></p>'
      + '<p>' + esc(upgrade.message || tr('svLockedMsg')) + '</p>'
      + '<p class="nrv-sov-note">' + esc(tr('svCurrentPlan')) + '<code>' + esc(plan) + '</code></p>'
      // The server says whether Pro is on sale (upgrade.purchasable). While it
      // is not, this links to what Pro will do rather than to a checkout -
      // "Upgrade" would invite someone to buy a plan that is not on sale.
      + (upgrade.purchasable === true
        ? (upgrade.checkout_url ? '<p><a class="nrv-sov-cta" href="' + esc(upgrade.checkout_url) + '">' + esc(tr('planProBuy')) + '</a></p>' : '')
        : '<p class="nrv-sov-note"><b>' + esc(tr('svSoon')) + '</b></p>')
      + (upgrade.details_url ? '<p><a class="nrv-sov-cta" href="' + esc(upgrade.details_url) + '" target="_blank" rel="noopener">' + esc(tr('planProDetails')) + '</a></p>' : '')
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
      + '<div class="nrv-aeo-heading"><div><small>' + esc(tr('svKicker')) + '</small>'
      + '<h2>' + esc(tr('svHeading')) + ' ' + beta + '</h2></div></div>'
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
    // Ask for the report's own sentences (notice, basis, gap reasons) in the
    // dashboard's language rather than the browser's.
    var pageLang = 'ja'; try { pageLang = lang || 'ja'; } catch (_) { pageLang = document.documentElement.lang || 'ja'; }
    var response = await fetch('/api/sites/' + encodeURIComponent(siteId) + '/sov/report?lang=' + encodeURIComponent(pageLang), { credentials: 'include' });
    if (!response.ok || !section.isConnected) return;
    var report = (await response.json()).report;
    var box = document.createElement('div'); box.className = 'card panel';
    var config = report.current_query_set || { questions: [], repetitions: 2, competitors: [] };
    var table = function (rows) { return '<table style="width:100%">' + rows.map(function (row) { return '<tr>' + row.map(function (cell) { return '<td style="padding:6px">' + esc(cell) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>'; };
    var pct = function (v) { return v == null ? tr('svNA') : Math.round(v * 1000) / 10 + '%'; };
    var sep = tr('svSep'), colon = tr('svColon');
    box.innerHTML = '<h3>' + esc(tr('svReport')) + '</h3><p>' + esc(report.notice) + '</p>'
      // Headline: appearance rate (business named in the answer). Citation rate
      // (the site among the source URLs) follows as a labelled secondary figure.
      + '<p>' + esc(report.status === 'unconfigured' ? tr('svUnconfigured') : report.status === 'no_data' ? tr('svUnmeasured') : tr('svSummary', { answers: report.summary.answers, rate: pct(report.summary.appearance_rate), cite: pct(report.summary.citation_rate) })) + '</p>'
      + aeoScoreLine(report.aeo_score)
      + engineReportTable(report)
      + '<p>' + esc(tr('svCacheNote')) + '</p>'
      + '<details><summary>' + esc(tr('svEditSet')) + '</summary><label>' + esc(tr('svQueriesLabel')) + '<textarea data-pro-questions style="width:100%;min-height:120px">' + esc(config.questions.join('\n')) + '</textarea></label>'
      + '<label>' + esc(tr('svReps')) + ' <input data-pro-n type="number" min="1" max="3" value="' + esc(config.repetitions) + '"></label>'
      + '<label>' + esc(tr('svCompDomains')) + '<textarea data-pro-competitors style="width:100%">' + esc(config.competitors.join('\n')) + '</textarea></label><button data-pro-save>' + esc(tr('svSaveSet')) + '</button></details>'
      + '<button data-pro-run>' + esc(tr('svRun')) + '</button> <button data-pro-json>' + esc(tr('svJson')) + '</button><p data-pro-status role="status"></p>'
      + '<h4>' + esc(tr('svPresence')) + '</h4>' + table([[tr('svQuery'),tr('svAnswers'),tr('svAppearances'),tr('svAppearRate'),tr('svCitations'),tr('svCiteFreq')]].concat(report.presence.map(function(r){ return [r.question,r.answers,r.appearances == null ? tr('svNA') : r.appearances,pct(r.appearance_rate),r.citations,pct(r.frequency)]; })))
      + '<h4>' + esc(tr('svVsComp')) + '</h4><p>' + esc(report.sov_basis) + '</p>' + (report.recount_note ? '<p>' + esc(report.recount_note) + '</p>' : '') + table([[tr('svDomain'),tr('svCitations'),tr('svFreq'),'SoV']].concat(report.competitors.map(function(r){ return [r.host + (r.own ? tr('svOwn') : r.recounted ? tr('svRecounted') : ''),r.citations,pct(r.frequency),pct(r.share_of_voice)]; })))
      + '<h4>' + esc(tr('svTrend')) + '</h4>' + table([[tr('svDateTime'),tr('svAnswers'),tr('svAppearRate'),tr('svCiteFreq')]].concat(report.trend.map(function(r){ return [r.ran_at,r.answers_received,pct(r.appearance_rate),pct(r.citation_rate)]; })))
      + '<h4>' + esc(tr('svGaps')) + '</h4>' + (report.gaps.length ? report.gaps.map(function(r){ return '<p>' + esc(r.question + colon + r.reason) + '</p>'; }).join('') : '<p>' + esc(tr('svNoGaps')) + '</p>')
      + '<h4>' + esc(tr('svAccuracy')) + '</h4><p>' + esc(tr('svAccuracyLead')) + '</p>'
      + report.evidence.map(function(e){ return '<details data-pro-evidence="' + esc(e.id) + '"><summary>' + esc(e.question + sep + e.measured_at + sep + e.engine + sep + tr('svRank', { n: e.citation_rank || tr('svNone') })) + '</summary><p>' + esc(e.answer_summary || tr('svNoAnswer')) + '</p><p>' + esc(tr('svMentioned')) + esc(e.accuracy.mentioned == null ? tr('svUndeterminable') : e.accuracy.mentioned ? tr('svYes') : tr('svNone')) + esc(sep + tr('svReviewState')) + esc(e.accuracy.status) + '</p>' + sourceLinks(e.citation_urls) + '<select data-pro-review><option value="uncertain">' + esc(tr('svUncertain')) + '</option><option value="confirmed_error">' + esc(tr('svConfirmedError')) + '</option><option value="checked_no_obvious_error">' + esc(tr('svNoObvious')) + '</option></select><textarea data-pro-note placeholder="' + esc(tr('svNotePh')) + '">' + esc(e.accuracy.note || '') + '</textarea><button data-pro-review-save>' + esc(tr('svSaveReview')) + '</button></details>'; }).join('');
    section.appendChild(box);
    async function write(path, method, body) {
      var csrf = await (await fetch('/api/csrf', { credentials: 'include' })).json();
      var res = await fetch('/api/sites/' + encodeURIComponent(siteId) + '/sov' + path, { method:method, credentials:'include', headers:{'content-type':'application/json','x-csrf-token':csrf.csrf_token}, body:body === undefined ? undefined : JSON.stringify(body) });
      var data = await res.json(); if (!res.ok) throw new Error(data.error || tr('svSaveFailed')); return data;
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
          status.textContent=tr('svSaved');
        } else if (target.hasAttribute('data-pro-run')) {
          status.textContent=tr('svMeasuring'); var result = await write('','POST'); status.textContent=result.status === 'unconfigured' ? tr('svUnconfigured') : result.cached ? tr('svCached') : tr('svDone');
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
  style.textContent = '.nrv-sov{margin-top:18px}.nrv-sov-beta{font-size:10px;background:#efe9ff;color:#5a3ad6;border-radius:5px;padding:2px 6px;margin-left:6px;vertical-align:middle;font-weight:800}.nrv-sov-meta{display:flex;flex-wrap:wrap;gap:18px;margin:0 0 16px;padding:0}.nrv-sov-meta div{margin:0}.nrv-sov-meta dt{font-size:10px;color:#8b8498;margin:0}.nrv-sov-meta dd{margin:1px 0 0;font-size:13px;font-weight:700}.nrv-sov-engines{display:grid;grid-template-columns:1fr 1fr;gap:14px}.nrv-sov-engine{border:1px solid #ece9f3;border-radius:10px;padding:13px}.nrv-sov-engine.is-headline{border-color:#cdbcff;background:#faf8ff}.nrv-sov-engine-head{display:flex;flex-direction:column;gap:5px;margin-bottom:9px}.nrv-sov-engine-head strong{font-size:13px}.nrv-sov-tag{font-size:10px;border-radius:5px;padding:2px 6px;align-self:flex-start;font-weight:700}.nrv-sov-tag.is-live{background:#e7f5ec;color:#176b3a}.nrv-sov-tag.is-static{background:#f1eff5;color:#5d5570}.nrv-sov-tag b{display:block;font-size:9px;font-weight:800;opacity:.85}.nrv-sov-rate{font-size:28px;font-weight:800;color:#4b31c6}.nrv-sov-n{font-size:11px;color:#8b8498;margin-left:6px}.nrv-sov-none{font-size:12px;color:#6c6579}.nrv-sov-fail{display:block;margin-top:6px;font-size:10px;color:#9a6b00}.nrv-sov-roster{list-style:none;margin:0 0 10px;padding:0}.nrv-sov-roster li{display:flex;gap:8px;align-items:center;padding:6px 0;font-size:13px;border-top:1px solid #f3f1f7}.nrv-sov-roster li:first-child{border-top:0}.nrv-sov-note{margin:10px 0 0;font-size:11px;color:#6c6579;line-height:1.6}.nrv-sov-competitors{margin-top:18px;border-top:1px solid #efecf4;padding-top:14px}.nrv-sov-competitors h4{font-size:12px;margin:0 0 8px}.nrv-sov-competitors ul{list-style:none;margin:0;padding:0}.nrv-sov-competitors li{display:flex;justify-content:space-between;padding:5px 0;font-size:12px;border-top:1px solid #f3f1f7}.nrv-sov-competitors li:first-child{border-top:0}.nrv-sov-locked{background:#faf9fe;border:1px solid #e6e1f3;border-radius:10px;padding:18px}.nrv-sov-locked-head{margin:0 0 6px;font-size:14px}.nrv-sov-locked p{margin:0 0 6px;font-size:12px;color:#5d5570}.nrv-sov-cta{display:inline-block;margin-top:6px;background:#6f4df6;color:#fff;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;text-decoration:none}.nrv-sov-sources{margin:6px 0;padding-left:18px;font-size:12px;word-break:break-all}@media(max-width:800px){.nrv-sov-engines{grid-template-columns:1fr}}';
  document.head.appendChild(style);
  new MutationObserver(function () { mount(); }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(mount, 600);
})();
