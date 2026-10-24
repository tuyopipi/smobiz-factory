/* Nurevo dashboard asset revision: 2026-10-24-leadgen */
/*
 * Agency lead-generation tools on the Partner page (worker/agency-leadgen.mjs).
 *
 *  - "Sales tools": the embeddable "Is your business visible to AI?" widget
 *    (on/off, the websites allowed to show it, email on each lead, the embed
 *    code, a new widget key) and the referral landing page /p/<slug> (address,
 *    publish, noindex, intro text). Approved partners only.
 *  - "Leads": what the widget collected for this account, newest first, with
 *    CSV export and delete.
 *
 * Nothing renders before migration 0047 (the API says available:false).
 * Every value from the server is escaped; the embed code is shown in a
 * read-only textarea. Words come from the dashboard dictionary (t(), I8).
 */
(function () {
  "use strict";
  var loading = false;
  var LANGS = ["ja", "en", "zh", "tw", "ko", "es", "fr", "de"];

  function tr(key, vars) {
    var text = typeof t === "function" ? String(t(key)) : key;
    return text.replace(/\{(\w+)\}/g, function (m, name) { return vars && vars[name] != null ? String(vars[name]) : m; });
  }
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function pageLang() {
    var l = typeof lang === "string" ? lang : "en";
    if (l === "zh_HK") return "tw";
    return LANGS.indexOf(l) >= 0 ? l : "en";
  }
  async function csrfToken() {
    try { return (await (await fetch("/api/csrf", { credentials: "include" })).json()).csrf_token || ""; } catch (e) { return ""; }
  }
  async function send(method, url, body) {
    var token = await csrfToken();
    var res = await fetch(url, { method: method, credentials: "include", headers: { "content-type": "application/json", "x-csrf-token": token }, body: body === undefined ? undefined : JSON.stringify(body) });
    var data = {};
    try { data = await res.json(); } catch (e) { data = {}; }
    return { ok: res.ok, status: res.status, data: data };
  }
  function when(ms) {
    var at = new Date(Number(ms));
    return Number.isFinite(at.getTime()) ? at.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
  }

  function errorText(data, view) {
    var fields = (data && data.fields) || [];
    var limits = (view && view.limits) || {};
    var out = [];
    fields.forEach(function (f) {
      if (f === "allowed_origins") out.push(tr("lgErrOrigins", { origins: ((data.invalid || []).join(", ")) }));
      else if (f === "allowed_origins_count") out.push(tr("agInvalid", { field: tr("lgOrigins") }));
      else if (f === "slug_invalid" || f === "slug_reserved") out.push(tr("lgErrSlug", { min: limits.slug_min || 3, max: limits.slug_max || 40 }));
      else if (f === "slug_taken") out.push(tr("lgErrSlugTaken"));
      else if (f === "slug_required") out.push(tr("lgErrSlugRequired"));
      else if (f === "landing_intro") out.push(tr("agInvalid", { field: tr("lgIntro") }));
      else if (f === "branding") out.push(tr("lgNeedsBrand"));
    });
    return out.length ? out.join(" ") : tr("crSaveError");
  }

  /* ---------------- sales tools ---------------- */

  function toolsCard(view) {
    var section = document.createElement("section");
    section.className = "nrv-leadgen";
    var head = '<div class="card panel" style="margin-top:18px"><div class="nrv-aeo-heading"><div><small>' + esc(tr("lgKicker")) + "</small><h2>" + esc(tr("lgHeading")) + "</h2></div></div>"
      + '<p class="nrv-lg-lead">' + esc(tr("lgLead")) + "</p>";
    if (!view.approved) {
      section.innerHTML = head + '<p class="notice" data-lg-needs-approval>' + esc(tr("lgNeedsApproval")) + "</p></div>";
      return section;
    }
    var s = view.settings || {};
    var dis = view.can_edit ? "" : " disabled";
    var checked = function (v) { return v ? " checked" : ""; };
    var embed = view.embed || {};
    section.innerHTML = head
      + (view.has_branding ? "" : '<p class="notice nrv-lg-warn" data-lg-needs-brand>' + esc(tr("lgNeedsBrand")) + "</p>")
      + (view.has_branding && !view.has_contact ? '<p class="notice nrv-lg-warn" data-lg-needs-contact>' + esc(tr("lgNeedsContact")) + "</p>" : "")
      + '<form class="nrv-ag-form" data-lg-form>'
      + "<h3>" + esc(tr("lgWidget")) + "</h3><p class=\"nrv-lg-note\">" + esc(tr("lgWidgetLead")) + "</p>"
      + '<label class="nrv-ag-inline"><input type="checkbox" name="widget_enabled"' + checked(s.widget_enabled) + dis + "> " + esc(tr("lgWidgetEnable")) + "</label>"
      + "<label>" + esc(tr("lgOrigins")) + '<textarea class="input" name="allowed_origins" rows="3" spellcheck="false" placeholder="https://www.example.com"' + dis + ">" + esc((s.allowed_origins || []).join("\n")) + "</textarea></label>"
      + '<label class="nrv-ag-inline"><input type="checkbox" name="notify_email"' + checked(s.notify_email) + dis + "> " + esc(tr("lgNotify")) + "</label>"
      + (embed.script ? "<label>" + esc(tr("lgEmbed")) + '<textarea class="input nrv-lg-code" readonly rows="2" data-lg-embed>' + esc(embed.script) + "</textarea></label>"
        + '<p><button type="button" class="btn" data-lg-copy>' + esc(tr("copy")) + "</button></p>"
        + "<details><summary>" + esc(tr("lgEmbedIframe")) + '</summary><textarea class="input nrv-lg-code" readonly rows="3" data-lg-iframe>' + esc(embed.iframe) + "</textarea></details>"
        + (view.can_edit ? '<p><button type="button" class="btn" data-lg-rotate>' + esc(tr("lgRotate")) + '</button></p><p class="nrv-lg-note">' + esc(tr("lgRotateNote")) + "</p>" : "") : "")
      + '<p class="nrv-lg-note">' + esc(tr("lgPrivacy")) + "</p>"
      + "<h3>" + esc(tr("lgLanding")) + "</h3><p class=\"nrv-lg-note\">" + esc(tr("lgLandingLead")) + "</p>"
      + "<label>" + esc(tr("lgSlug")) + '<span class="nrv-lg-slug"><span>' + esc(view.landing_prefix || "") + '</span><input class="input" name="slug" maxlength="' + esc((view.limits && view.limits.slug_max) || 40) + '" pattern="[a-z0-9-]+" autocomplete="off" value="' + esc(s.slug || "") + '"' + dis + "></span></label>"
      + '<label class="nrv-ag-inline"><input type="checkbox" name="landing_enabled"' + checked(s.landing_enabled) + dis + "> " + esc(tr("lgLandingEnable")) + "</label>"
      + '<label class="nrv-ag-inline"><input type="checkbox" name="landing_noindex"' + checked(s.landing_noindex) + dis + "> " + esc(tr("lgNoindex")) + "</label>"
      + "<label>" + esc(tr("lgIntro")) + '<textarea class="input" name="landing_intro" rows="3" maxlength="' + esc((view.limits && view.limits.intro_max) || 500) + '"' + dis + ">" + esc(s.landing_intro || "") + "</textarea></label>"
      + (s.landing_enabled && view.landing_url ? '<p><a class="btn" data-lg-open target="_blank" rel="noopener" href="' + esc(view.landing_url) + '">' + esc(tr("lgOpen")) + "</a></p>" : "")
      + (view.can_edit ? '<p><button type="submit" class="btn primary">' + esc(tr("save")) + '</button> <span class="nrv-ag-msg" data-lg-msg role="status"></span></p>' : "")
      + "</form></div>";
    return section;
  }

  function replaceTools(section, view, message) {
    var next = toolsCard(view);
    attachTools(next, view);
    section.replaceWith(next);
    var msg = next.querySelector("[data-lg-msg]");
    if (msg && message) msg.textContent = message;
  }

  function attachTools(section, view) {
    var copy = section.querySelector("[data-lg-copy]");
    if (copy) copy.addEventListener("click", function () {
      var area = section.querySelector("[data-lg-embed]");
      var done = function () { copy.textContent = tr("copied"); };
      try { navigator.clipboard.writeText(area.value).then(done, function () { area.select(); }); } catch (e) { area.select(); }
    });
    var rotate = section.querySelector("[data-lg-rotate]");
    if (rotate) rotate.addEventListener("click", async function () {
      if (!window.confirm(tr("lgRotateNote"))) return;
      rotate.disabled = true;
      var result = await send("POST", "/api/agency/leadgen/rotate-key?lang=" + pageLang());
      if (result.ok && result.data.available) replaceTools(section, result.data, tr("saved"));
      else rotate.disabled = false;
    });
    var form = section.querySelector("[data-lg-form]");
    if (!form || !view.can_edit) return;
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var msg = section.querySelector("[data-lg-msg]");
      var button = form.querySelector("button[type=submit]");
      var el = form.elements;
      var body = {
        widget_enabled: el.widget_enabled.checked, allowed_origins: el.allowed_origins.value, notify_email: el.notify_email.checked,
        slug: el.slug.value, landing_enabled: el.landing_enabled.checked, landing_noindex: el.landing_noindex.checked, landing_intro: el.landing_intro.value,
      };
      if (button) button.disabled = true;
      try {
        var result = await send("PUT", "/api/agency/leadgen?lang=" + pageLang(), body);
        if (result.ok && result.data.available) { replaceTools(section, result.data, tr("saved")); return; }
        if (msg) msg.textContent = errorText(result.data, view);
      } catch (error) {
        if (msg) msg.textContent = tr("crSaveError");
      } finally { if (button) button.disabled = false; }
    });
  }

  /* ---------------- leads ---------------- */

  function leadsCard(data, canDelete) {
    var section = document.createElement("section");
    section.className = "nrv-leads";
    var rows = (data.leads || []).map(function (l) {
      return "<tr data-lead=\"" + esc(l.id) + "\"><td>" + esc(when(l.created_at)) + "</td><td class=\"nrv-lg-wrap\">" + esc(l.site_url) + "</td><td>" + esc(l.name) + "</td><td class=\"nrv-lg-wrap\">" + esc(l.email)
        + "</td><td>" + (l.score == null ? "—" : esc(l.score)) + "</td><td>" + esc(tr(l.source === "landing" ? "lgSrcLanding" : "lgSrcWidget"))
        + "</td><td>" + (canDelete ? '<button type="button" class="btn" data-lg-delete="' + esc(l.id) + '">' + esc(tr("del")) + "</button>" : "") + "</td></tr>";
    }).join("");
    section.innerHTML = '<div class="card panel" style="margin-top:18px"><div class="nrv-aeo-heading"><div><h2>' + esc(tr("lgLeads")) + "</h2></div>"
      + ((data.leads || []).length ? '<a class="btn" data-lg-csv href="/api/agency/leads.csv" download>' + esc(tr("lgCsv")) + "</a>" : "") + "</div>"
      + '<p class="nrv-lg-lead">' + esc(tr("lgLeadsLead")) + "</p>"
      + '<div class="nrv-lg-table"><table><thead><tr><th>' + esc(tr("svDateTime")) + "</th><th>" + esc(tr("lgSite")) + "</th><th>" + esc(tr("lgPerson")) + "</th><th>" + esc(tr("email")) + "</th><th>" + esc(tr("lgScore")) + "</th><th>" + esc(tr("lgSource")) + "</th><th></th></tr></thead><tbody>"
      + (rows || '<tr><td colspan="7" data-lg-empty>' + esc(tr("lgNoLeads")) + "</td></tr>") + "</tbody></table></div></div>";
    section.querySelectorAll("[data-lg-delete]").forEach(function (button) {
      button.addEventListener("click", async function () {
        if (!window.confirm(tr("lgDeleteConfirm"))) return;
        button.disabled = true;
        var result = await send("DELETE", "/api/agency/leads/" + encodeURIComponent(button.getAttribute("data-lg-delete")));
        if (result.ok) { var row = button.closest("tr"); if (row) row.remove(); } else button.disabled = false;
      });
    });
    return section;
  }

  async function mount() {
    var slot = document.querySelector("#agency-leadgen-slot");
    if (!slot || slot.querySelector(".nrv-leadgen") || loading) return;
    loading = true;
    try {
      var res = await fetch("/api/agency/leadgen?lang=" + pageLang(), { credentials: "include", cache: "no-store" });
      if (!res.ok) return;
      var view = await res.json();
      if (!view || !view.available || slot.querySelector(".nrv-leadgen") || !slot.isConnected) return;
      var tools = toolsCard(view);
      attachTools(tools, view);
      slot.appendChild(tools);
      if (view.approved || view.leads_total > 0) {
        var leadsRes = await fetch("/api/agency/leads?limit=200", { credentials: "include", cache: "no-store" });
        if (leadsRes.ok && slot.isConnected) slot.appendChild(leadsCard(await leadsRes.json(), !!view.can_delete));
      }
    } catch (error) {
      /* fail open: the partner page is unaffected */
    } finally { loading = false; }
  }

  var style = document.createElement("style");
  style.textContent = ".nrv-lg-lead{font-size:13px;line-height:1.7;margin:0 0 10px}.nrv-lg-note{font-size:11.5px;color:#6c6579;margin:-2px 0 4px;line-height:1.6}.nrv-leadgen h3{font-size:14px;margin:14px 0 0}.nrv-lg-warn{background:#fff8e6;border-radius:8px;padding:8px 10px}.nrv-lg-code{font:12px ui-monospace,SFMono-Regular,Menlo,monospace;width:100%}.nrv-lg-slug{display:flex;align-items:center;gap:4px;font-weight:400}.nrv-lg-slug span{font-size:12px;color:#6c6579;white-space:nowrap}.nrv-lg-table{overflow-x:auto}.nrv-lg-wrap{overflow-wrap:anywhere;max-width:240px}.nrv-leads .nrv-aeo-heading{display:flex;justify-content:space-between;align-items:center;gap:10px}";
  document.head.appendChild(style);
  new MutationObserver(function () { mount(); }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(mount, 650);
})();
