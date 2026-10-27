/* Nurevo dashboard asset revision: 2026-10-27-learning1 */
/*
 * The super-admin "Learning" screen (GET /api/admin/learning, worker/learning.mjs,
 * docs/learning.md): how much before/after data there is, and the estimated
 * effect of each change Nurevo can make, behind the minimum-n gate. Read only:
 * nothing on this screen changes a score or a ruleset.
 */
(function () {
  "use strict";
  var main = document.querySelector("#main"), side = document.querySelector(".side");
  if (!main || !side) return;
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  // Words come from the dashboard dictionary (t() in dashboard.html, ln* keys).
  function tr(key, vars) {
    var text = typeof t === "function" ? String(t(key)) : key;
    return text.replace(/\{(\w+)\}/g, function (m, name) { return vars && vars[name] != null ? String(vars[name]) : m; });
  }
  function isJa() { return String((document.documentElement && document.documentElement.lang) || "").slice(0, 2) === "ja"; }
  function label(value, fallback) { return value && typeof value === "object" ? (isJa() ? value.ja : value.en) || fallback : fallback; }
  function pts(value) { return value == null ? "—" : tr("lnPts", { v: (Math.round(value * 1000) / 10).toFixed(1) }); }
  async function api(path) {
    var response = await fetch(path, { credentials: "include", cache: "no-store" });
    var body = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(body.error || "request_failed");
    return body;
  }
  fetch("/api/me", { credentials: "include", cache: "no-store" }).then(function (response) {
    return response.ok ? response.json() : null;
  }).then(function (member) {
    if (!member || !member.is_super_admin) return;
    var button = document.createElement("button");
    button.className = "nav";
    button.type = "button";
    button.innerHTML = '◇ <span data-k="lnNav">' + esc(tr("lnNav")) + "</span>";
    button.dataset.learningNav = "1";
    side.insertBefore(button, side.querySelector(".foot"));
    button.onclick = function () {
      document.querySelectorAll(".nav").forEach(function (item) { item.classList.remove("active"); });
      button.classList.add("active");
      renderLearning();
    };
  }).catch(function () {});

  function stat(name, value) {
    return '<div class="card panel"><div class="notice">' + esc(name) + '</div><h2>' + esc(value) + "</h2></div>";
  }

  function volumeHtml(volume) {
    var answers = volume.answers_by_engine || {};
    var answerLines = Object.keys(answers).map(function (engine) {
      return '<li><code>' + esc(engine) + "</code> " + esc(tr("lnAnswers", { n: answers[engine].answers, c: answers[engine].own_cited })) + "</li>";
    }).join("");
    var events = volume.events_by_type || {};
    var eventRows = Object.keys(events).map(function (type) {
      return "<tr><td><code>" + esc(type) + "</code></td><td>" + esc(events[type]) + "</td><td>" + esc((volume.sites_by_event_type || {})[type] || 0) + "</td></tr>";
    }).join("") || '<tr><td colspan="3">—</td></tr>';
    return '<div class="grid2">' + stat(tr("lnSites"), volume.sites) + stat(tr("lnBaseline"), volume.sites_with_baseline)
      + stat(tr("lnSnapshot"), volume.sites_with_snapshot) + stat(tr("lnTwoPlus"), volume.sites_with_2plus_measurements) + "</div>"
      + (answerLines ? '<ul class="notice">' + answerLines + "</ul>" : "")
      + '<div class="card" style="margin-top:12px"><div class="head"><h2>' + esc(tr("lnEvents")) + '</h2></div><div class="tablewrap"><table><thead><tr><th>' + esc(tr("lnChange"))
      + "</th><th>#</th><th>" + esc(tr("lnSites")) + "</th></tr></thead><tbody>" + eventRows + "</tbody></table></div></div>";
  }

  function estimatesHtml(report) {
    var outcomes = {};
    (report.outcomes || []).forEach(function (o) { outcomes[o.id] = o; });
    var rows = (report.estimates || []).map(function (e) {
      var ok = e.status === "estimated";
      var placebo = e.placebo && e.placebo.status === "estimated" && e.placebo.ci ? pts(e.placebo.estimate) + " [" + pts(e.placebo.ci[0]) + ", " + pts(e.placebo.ci[1]) + "]" : "—";
      return "<tr><td>" + esc(label(outcomes[e.outcome] && outcomes[e.outcome].label, e.outcome)) + "</td><td>" + esc(label(e.label, e.treatment)) + "</td><td>" + esc(e.engine)
        + "</td><td>" + (ok ? esc(pts(e.estimate)) : '<span class="pill pending">' + esc(tr("lnInsufficient")) + "</span>")
        + "</td><td>" + (ok && e.ci ? esc(pts(e.ci[0]) + " – " + pts(e.ci[1])) : "—")
        + "</td><td>" + esc((e.n ? e.n.treated : 0) + " / " + (e.n ? e.n.controls : 0)) + "</td><td>" + esc(placebo) + "</td></tr>";
    }).join("") || '<tr><td colspan="7">—</td></tr>';
    return '<div class="card" style="margin-top:18px"><div class="head"><h2>' + esc(tr("lnEstimates")) + '</h2></div><p class="notice">'
      + esc(tr("lnGate", { t: report.gate ? report.gate.min_treated : 30, c: report.gate ? report.gate.min_controls : 30 })) + '</p><div class="tablewrap"><table><thead><tr><th>'
      + esc(tr("lnOutcome")) + "</th><th>" + esc(tr("lnChange")) + "</th><th>" + esc(tr("lnEngine")) + "</th><th>" + esc(tr("lnEffect")) + "</th><th>" + esc(tr("lnCi"))
      + "</th><th>" + esc(tr("lnSitesN")) + "</th><th>" + esc(tr("lnPlacebo")) + "</th></tr></thead><tbody>" + rows + "</tbody></table></div></div>";
  }

  function proposalsHtml(report) {
    var list = (report.proposals || []).map(function (p) {
      return "<li><code>" + esc(p.treatment) + "</code> · " + esc(p.engine) + " · " + esc(p.outcome) + ": " + esc(pts(p.estimate)) + " [" + esc(pts(p.ci[0])) + ", " + esc(pts(p.ci[1])) + "]</li>";
    }).join("");
    return '<div class="card panel" style="margin-top:18px"><h2>' + esc(tr("lnProposals")) + "</h2>" + (list ? "<ul>" + list + "</ul>" : '<p class="notice">' + esc(tr("lnNoProposals")) + "</p>") + "</div>";
  }

  async function renderLearning() {
    main.innerHTML = '<div class="top"><h1>' + esc(tr("lnTitle")) + '</h1><button class="btn" data-learning-refresh>' + esc(tr("lnRefresh")) + "</button></div>"
      + '<div class="card panel"><p class="notice">' + esc(tr("lnLead")) + '</p><p class="notice">' + esc(tr("lnScope")) + "</p></div>"
      + '<div data-learning-body><p class="notice">' + esc(tr("lnLoading")) + "</p></div>";
    main.querySelector("[data-learning-refresh]").onclick = renderLearning;
    var body = main.querySelector("[data-learning-body]");
    try {
      var report = await api("/api/admin/learning");
      body.innerHTML = (report.migration_pending ? '<p class="notice">' + esc(tr("lnMigration")) + "</p>" : "")
        + '<h2 style="margin-top:18px">' + esc(tr("lnVolume")) + "</h2>" + volumeHtml(report.volume || {})
        + estimatesHtml(report) + proposalsHtml(report);
    } catch (error) {
      body.innerHTML = '<p class="notice">' + esc(tr("lnFailed")) + "</p>";
    }
  }
})();
