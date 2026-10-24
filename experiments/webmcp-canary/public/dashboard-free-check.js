/* Nurevo dashboard asset revision: 2026-10-24-freecheck */
/*
 * "Free AI check" card on the site page (Free / Standard).
 *
 * Once a month the server asks Perplexity a few questions a customer might ask
 * (never the business name) and records, per question, whether the answer
 * named the business or cited its site, and who else appeared
 * (worker/free-ai-check.mjs). This card shows that, says when the next check
 * is, and offers one "check now" while the month's check is unused.
 *
 * Honesty rules: three answers are a glimpse, not a rate, so no percentage is
 * drawn; the variability notice is always shown; "used up" says when the next
 * check runs instead of hiding the card. A Pro site gets no card (it has the
 * full measurement).
 *
 * Words come from the dashboard dictionary (t() in dashboard.html, the I6
 * block), like the other modules.
 */
(function () {
  "use strict";
  var selectedSiteId = null;
  var loadingSiteId = null;

  function tr(key, vars) {
    var text = typeof t === "function" ? String(t(key)) : key;
    return text.replace(/\{(\w+)\}/g, function (m, name) { return vars && vars[name] != null ? String(vars[name]) : m; });
  }
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function day(value) {
    if (!value) return "—";
    var at = new Date(String(value).length === 10 ? value + "T00:00:00Z" : value);
    return Number.isFinite(at.getTime()) ? at.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) : String(value);
  }

  function badge(row) {
    if (!row.answered) return '<span class="nrv-fc-badge is-none">' + esc(tr("fcNoAnswer")) + "</span>";
    var out = "";
    if (row.named) out += '<span class="nrv-fc-badge is-yes">' + esc(tr("fcNamed")) + "</span>";
    if (row.cited) out += '<span class="nrv-fc-badge is-yes">' + esc(tr("fcCited")) + "</span>";
    return out || '<span class="nrv-fc-badge is-no">' + esc(tr("fcNotNamed")) + "</span>";
  }

  function others(list) {
    if (!list || !list.length) return "";
    return '<p class="nrv-fc-others">' + esc(tr("fcOthers")) + " " + list.map(function (o) {
      return o.kind === "domain" ? "<code>" + esc(o.label) + "</code>" : "<b>" + esc(o.label) + "</b>";
    }).join(", ") + "</p>";
  }

  function resultBlock(result, previous) {
    if (!result) return "";
    var rows = (result.questions || []).map(function (row) {
      return '<li><div class="nrv-fc-q">' + esc(row.question) + '</div><div class="nrv-fc-badges">' + badge(row) + "</div>" + others(row.others) + "</li>";
    }).join("");
    var competitors = (result.competitors || []).length
      ? '<div class="nrv-fc-comp"><h4>' + esc(tr("fcCompetitors")) + "</h4><ul>" + result.competitors.map(function (c) {
        return "<li>" + (c.kind === "domain" ? "<code>" + esc(c.label) + "</code>" : esc(c.label)) + "<span>" + esc(tr("fcTimes", { n: Number(c.count || 0) })) + "</span></li>";
      }).join("") + "</ul></div>"
      : "";
    return (previous ? '<p class="nrv-fc-sub">' + esc(tr("fcPrevious")) + "</p>" : "")
      + '<p class="nrv-fc-summary"><b>' + esc(tr("fcAppeared", { k: Number(result.appeared || 0), n: Number(result.answered || 0) })) + "</b>"
      + ' <span class="nrv-fc-when">' + esc(tr("fcCheckedOn", { date: day(result.checked_at) })) + "</span></p>"
      + '<ol class="nrv-fc-list">' + rows + "</ol>" + competitors;
  }

  function stateLine(view) {
    var s = view.status;
    if (s === "used_up") return '<p class="nrv-fc-state is-warn">' + esc(tr("fcUsedUp", { date: day(view.next_check_on) })) + "</p>";
    if (s === "done") return '<p class="nrv-fc-state">' + esc(tr("fcNextOn", { date: day(view.next_check_on) })) + "</p>";
    if (s === "failed") return '<p class="nrv-fc-state is-warn">' + esc(tr("fcFailed", { date: day(view.next_check_on) })) + "</p>";
    if (s === "running") return '<p class="nrv-fc-state">' + esc(tr("fcRunning")) + "</p>";
    if (s === "scheduled") return '<p class="nrv-fc-state">' + esc(tr("fcScheduledOn", { date: day(view.scheduled_on) })) + "</p>";
    if (s === "not_connected" || s === "consent_required") return '<p class="nrv-fc-state">' + esc(tr("fcNotConnected")) + "</p>";
    return '<p class="nrv-fc-state">' + esc(tr("fcUnavailable")) + "</p>";
  }

  function card(view) {
    var section = document.createElement("section");
    section.className = "nrv-free-check";
    var current = view.status === "done" || view.status === "failed";
    var run = view.can_run_now
      ? '<div class="nrv-fc-run"><button type="button" data-fc-run>' + esc(tr("fcRun")) + '</button> <span class="nrv-fc-note">' + esc(tr("fcRunNote")) + '</span><p data-fc-status role="status" class="nrv-fc-note"></p></div>'
      : "";
    var upsell = view.upsell && view.upsell.details_url
      ? '<p class="nrv-fc-upsell">' + esc(tr("fcUpsell")) + ' <a href="' + esc(view.upsell.details_url) + '" target="_blank" rel="noopener">' + esc(tr("fcUpsellLink")) + "</a></p>"
      : "";
    section.innerHTML = '<div class="card panel">'
      + '<div class="nrv-aeo-heading"><div><small>' + esc(tr("fcKicker")) + "</small><h2>" + esc(tr("fcHeading")) + "</h2></div></div>"
      + '<p class="nrv-fc-lead">' + esc(tr("fcLead", { n: Number(view.questions_per_check || 3), engine: view.engine_label || "Perplexity" })) + "</p>"
      + stateLine(view) + run
      + resultBlock(view.result, !current)
      + '<p class="nrv-fc-note">' + esc(tr("fcNotice")) + "</p>"
      + upsell + "</div>";
    return section;
  }

  async function resolveSiteId() {
    if (selectedSiteId) return selectedSiteId;
    var heading = document.querySelector("#main > .top h1");
    if (!heading) return null;
    var response = await fetch("/api/sites", { credentials: "include", cache: "no-store" });
    if (!response.ok) return null;
    var sites = (await response.json()).sites || [];
    var name = heading.textContent.trim();
    var site = sites.find(function (item) { return (item.url || item.slug || "Hosted store") === name; });
    return site ? site.id : null;
  }

  function attach(section, siteId) {
    section.addEventListener("click", async function (event) {
      var target = event.target;
      if (!target.matches || !target.matches("button[data-fc-run]")) return;
      var status = section.querySelector("[data-fc-status]");
      target.disabled = true;
      if (status) status.textContent = tr("fcRunning");
      try {
        var csrf = await (await fetch("/api/csrf", { credentials: "include" })).json();
        var res = await fetch("/api/sites/" + encodeURIComponent(siteId) + "/sov/free-check", {
          method: "POST", credentials: "include", headers: { "x-csrf-token": csrf.csrf_token },
        });
        var data = await res.json();
        if (!data.free_check) throw new Error(data.error || "error");
        var replacement = card(data.free_check);
        attach(replacement, siteId);
        section.replaceWith(replacement);
      } catch (error) {
        if (status) status.textContent = tr("fcError");
        target.disabled = false;
      }
    });
  }

  async function mount() {
    var main = document.querySelector("#main"), detail = main && main.querySelector(".detail");
    if (!main || !detail) { loadingSiteId = null; return; }
    if (main.querySelector(".nrv-free-check")) return;
    var siteId = await resolveSiteId();
    if (!siteId || loadingSiteId === siteId || main.querySelector(".nrv-free-check")) return;
    loadingSiteId = siteId;
    try {
      // A read: the stored result and the next date. No engine is asked.
      var response = await fetch("/api/sites/" + encodeURIComponent(siteId) + "/sov/free-check", { credentials: "include", cache: "no-store" });
      if (!response.ok || main.querySelector(".nrv-free-check")) return;
      var view = (await response.json()).free_check;
      // Pro has the full measurement; other states the server cannot offer
      // the check in say nothing useful to the owner.
      if (!view || view.status === "pro" || view.status === "not_eligible" || view.status === "disabled") return;
      var section = card(view);
      attach(section, siteId);
      var sov = main.querySelector(".nrv-sov");
      if (sov && sov.parentNode === main) main.insertBefore(section, sov);
      else main.appendChild(section);
    } catch (error) {
      /* fail open - the rest of the dashboard is unaffected */
    } finally { loadingSiteId = null; }
  }

  document.addEventListener("click", function (event) {
    var row = event.target.closest && event.target.closest("[data-site]");
    if (row) selectedSiteId = row.getAttribute("data-site");
    var back = event.target.closest && event.target.closest('[data-view="sites"]');
    if (back) selectedSiteId = null;
  }, true);

  var style = document.createElement("style");
  style.textContent = ".nrv-free-check{margin-top:18px}.nrv-fc-lead{font-size:13px;line-height:1.7;margin:0 0 8px}.nrv-fc-state{font-size:12px;margin:6px 0;color:#3d3650}.nrv-fc-state.is-warn{color:#8a5a00;font-weight:700}.nrv-fc-run{margin:10px 0}.nrv-fc-run button{background:#6f4df6;color:#fff;border:0;border-radius:8px;padding:7px 13px;font-size:12px;font-weight:700;cursor:pointer}.nrv-fc-run button[disabled]{opacity:.5;cursor:default}.nrv-fc-sub{font-size:11px;color:#8b8498;margin:14px 0 0}.nrv-fc-summary{font-size:13px;margin:8px 0}.nrv-fc-when{font-size:11px;color:#8b8498;font-weight:400}.nrv-fc-list{margin:6px 0;padding-left:18px}.nrv-fc-list li{padding:6px 0;border-top:1px solid #f3f1f7;font-size:12px}.nrv-fc-list li:first-child{border-top:0}.nrv-fc-q{font-weight:600;margin-bottom:4px;overflow-wrap:anywhere}.nrv-fc-badges{display:flex;flex-wrap:wrap;gap:6px}.nrv-fc-badge{font-size:10px;border-radius:5px;padding:2px 7px;font-weight:700}.nrv-fc-badge.is-yes{background:#e7f5ec;color:#176b3a}.nrv-fc-badge.is-no{background:#f1eff5;color:#5d5570}.nrv-fc-badge.is-none{background:#fff4e0;color:#8a5a00}.nrv-fc-others{font-size:11px;color:#5d5570;margin:4px 0 0;overflow-wrap:anywhere}.nrv-fc-comp{margin-top:12px;border-top:1px solid #efecf4;padding-top:10px}.nrv-fc-comp h4{font-size:12px;margin:0 0 6px}.nrv-fc-comp ul{list-style:none;margin:0;padding:0}.nrv-fc-comp li{display:flex;justify-content:space-between;gap:10px;padding:4px 0;font-size:12px;border-top:1px solid #f3f1f7;overflow-wrap:anywhere}.nrv-fc-comp li:first-child{border-top:0}.nrv-fc-note{font-size:11px;color:#6c6579;line-height:1.6;margin:8px 0 0}.nrv-fc-upsell{font-size:12px;margin:10px 0 0;padding:10px 12px;background:#faf8ff;border:1px solid #e6e1f3;border-radius:8px}.nrv-fc-upsell a{color:#6f4df6;font-weight:700}";
  document.head.appendChild(style);
  new MutationObserver(function () { mount(); }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(mount, 650);
})();
