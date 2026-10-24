/* Nurevo dashboard asset revision: 2026-10-24-agencyreport */
/*
 * Agency white-label client reports (worker/agency-report.mjs).
 *
 *  - Partner page: "Your brand on client reports" - the agency's name, logo
 *    (https URL or a small upload), colour, contact, footer. Saved per account.
 *  - Site page: "Monthly client report" - on/off, recipients (up to 5),
 *    language, brand, and the agency's confirmation that the recipients agreed
 *    to receive it; a preview of any month in a sandboxed frame, and a
 *    printable page the browser can save as PDF.
 *
 * Nothing renders before migration 0046 (the API says available:false).
 * Every value from the server is escaped; the preview frame runs no script.
 * Words come from the dashboard dictionary (t() in dashboard.html, I7 block).
 */
(function () {
  "use strict";
  var loading = { brand: false, site: null };

  function tr(key, vars) {
    var text = typeof t === "function" ? String(t(key)) : key;
    return text.replace(/\{(\w+)\}/g, function (m, name) { return vars && vars[name] != null ? String(vars[name]) : m; });
  }
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function day(value) {
    if (!value) return "";
    var at = new Date(String(value).length === 10 ? value + "T00:00:00Z" : value);
    return Number.isFinite(at.getTime()) ? at.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) : String(value);
  }
  function previousMonth() {
    var now = new Date(), y = now.getUTCFullYear(), m = now.getUTCMonth();
    return m === 0 ? (y - 1) + "-12" : y + "-" + String(m).padStart(2, "0");
  }
  function siteIdFromHash() {
    var match = /^#site:(.+)$/.exec(String(location.hash || ""));
    if (!match) return null;
    try { return decodeURIComponent(match[1]); } catch (e) { return null; }
  }
  async function csrfToken() {
    try { return (await (await fetch("/api/csrf", { credentials: "include" })).json()).csrf_token || ""; } catch (e) { return ""; }
  }
  async function putJson(url, body) {
    var token = await csrfToken();
    var res = await fetch(url, { method: "PUT", credentials: "include", headers: { "content-type": "application/json", "x-csrf-token": token }, body: JSON.stringify(body) });
    var data = {};
    try { data = await res.json(); } catch (e) { data = {}; }
    return { ok: res.ok, status: res.status, data: data };
  }

  /* ---------------- agency branding (partner page) ---------------- */

  var FIELD_LABEL = { display_name: "agName", logo_url: "agLogoUrl", logo_upload: "agLogoUpload", logo_size: "agLogoUpload", brand_color: "agColor", contact_email: "agEmail", contact_url: "agUrl", footer_text: "agFooter" };

  function brandingCard(view) {
    var b = view.branding || {};
    var disabled = view.can_edit ? "" : " disabled";
    var logo = b.logo_src ? '<img class="nrv-ag-logo" alt="" src="' + esc(b.logo_src) + '">' : "";
    var section = document.createElement("section");
    section.className = "nrv-agency-brand";
    section.innerHTML = '<div class="card panel" style="margin-top:18px">'
      + '<div class="nrv-aeo-heading"><div><small>' + esc(tr("agKicker")) + "</small><h2>" + esc(tr("agHeading")) + "</h2></div></div>"
      + '<p class="nrv-ag-lead">' + esc(tr("agLead")) + "</p>"
      + '<form class="nrv-ag-form" data-ag-form>'
      + '<label>' + esc(tr("agName")) + '<input class="input" name="display_name" maxlength="80" required value="' + esc(b.display_name || "") + '"' + disabled + "></label>"
      + '<label>' + esc(tr("agLogoUrl")) + '<input class="input" name="logo_url" type="url" maxlength="500" placeholder="https://" value="' + esc(b.logo_url || "") + '"' + disabled + "></label>"
      + '<label>' + esc(tr("agLogoUpload")) + '<input name="logo_file" type="file" accept="image/png,image/jpeg,image/webp,image/gif"' + disabled + "></label>"
      + (b.logo_hash ? '<label class="nrv-ag-inline">' + logo + '<input type="checkbox" name="logo_remove"' + disabled + "> " + esc(tr("agLogoRemove")) + "</label>" : logo)
      + '<label>' + esc(tr("agColor")) + '<input name="brand_color" type="color" value="' + esc(/^#[0-9a-f]{6}$/i.test(b.brand_color || "") ? b.brand_color : "#6f4df6") + '"' + disabled + "></label>"
      + '<label>' + esc(tr("agEmail")) + '<input class="input" name="contact_email" type="email" maxlength="254" value="' + esc(b.contact_email || "") + '"' + disabled + "></label>"
      + '<label>' + esc(tr("agUrl")) + '<input class="input" name="contact_url" type="url" maxlength="300" placeholder="https://" value="' + esc(b.contact_url || "") + '"' + disabled + "></label>"
      + '<label>' + esc(tr("agFooter")) + '<textarea class="input" name="footer_text" maxlength="300" rows="2"' + disabled + ">" + esc(b.footer_text || "") + "</textarea></label>"
      + '<label class="nrv-ag-inline"><input type="checkbox" name="hide_powered_by"' + (b.hide_powered_by ? " checked" : "") + disabled + "> " + esc(tr("agHidePowered")) + "</label>"
      + (view.can_edit ? '<p><button type="submit" class="btn primary">' + esc(tr("save")) + '</button> <span class="nrv-ag-msg" data-ag-msg role="status"></span></p>' : "")
      + "</form></div>";
    return section;
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || "")); };
      reader.onerror = function () { reject(new Error("read")); };
      reader.readAsDataURL(file);
    });
  }

  function attachBranding(section, view) {
    var form = section.querySelector("[data-ag-form]");
    if (!form || !view.can_edit) return;
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var msg = section.querySelector("[data-ag-msg]");
      var button = form.querySelector("button[type=submit]");
      var get = function (name) { var el = form.elements[name]; return el ? el.value : ""; };
      var body = {
        display_name: get("display_name"), logo_url: get("logo_url"), brand_color: get("brand_color"),
        contact_email: get("contact_email"), contact_url: get("contact_url"), footer_text: get("footer_text"),
        hide_powered_by: !!(form.elements.hide_powered_by && form.elements.hide_powered_by.checked),
        logo_remove: !!(form.elements.logo_remove && form.elements.logo_remove.checked),
      };
      var file = form.elements.logo_file && form.elements.logo_file.files && form.elements.logo_file.files[0];
      var max = (view.limits && view.limits.logo_max_bytes) || 65536;
      if (file && file.size > max) { if (msg) msg.textContent = tr("agInvalid", { field: tr("agLogoUpload") }); return; }
      if (button) button.disabled = true;
      try {
        if (file) body.logo_upload = await readFile(file);
        var result = await putJson("/api/agency/branding", body);
        if (result.ok && result.data && result.data.available) {
          var replacement = brandingCard(result.data);
          attachBranding(replacement, result.data);
          section.replaceWith(replacement);
          var done = replacement.querySelector("[data-ag-msg]");
          if (done) done.textContent = tr("saved");
          return;
        }
        var fields = (result.data && result.data.fields) || [];
        if (msg) msg.textContent = fields.length ? tr("agInvalid", { field: fields.map(function (f) { return tr(FIELD_LABEL[f] || "agName"); }).join(", ") }) : tr("crSaveError");
      } catch (error) {
        if (msg) msg.textContent = tr("crSaveError");
      } finally { if (button) button.disabled = false; }
    });
  }

  async function mountBranding() {
    var slot = document.querySelector("#agency-branding-slot");
    if (!slot || slot.querySelector(".nrv-agency-brand") || loading.brand) return;
    loading.brand = true;
    try {
      var res = await fetch("/api/agency/branding", { credentials: "include", cache: "no-store" });
      if (!res.ok) return;
      var view = await res.json();
      if (!view || !view.available || slot.querySelector(".nrv-agency-brand") || !slot.isConnected) return;
      var section = brandingCard(view);
      attachBranding(section, view);
      slot.appendChild(section);
    } catch (error) {
      /* fail open: the partner page is unaffected */
    } finally { loading.brand = false; }
  }

  /* ---------------- per-site report settings (site page) ---------------- */

  function localeOptions(selected) {
    var list = (window.nrvI18n && window.nrvI18n.locales) || [["en", "English"]];
    return list.map(function (row) {
      return '<option value="' + esc(row[0]) + '"' + (row[0] === selected ? " selected" : "") + ">" + esc(row[1]) + "</option>";
    }).join("");
  }

  function reportUrl(siteId, month, lang, format) {
    return "/api/sites/" + encodeURIComponent(siteId) + "/agency-report?format=" + format + "&month=" + encodeURIComponent(month) + (lang ? "&lang=" + encodeURIComponent(lang) : "");
  }

  function reportCard(view, siteId) {
    var s = view.settings || {};
    var disabled = view.can_edit ? "" : " disabled";
    var locale = s.locale || (window.nrvI18n && window.nrvI18n.lang && window.nrvI18n.lang()) || "en";
    var status = [];
    if (s.enabled && view.next_send_on) status.push(tr("crNextSend", { date: day(view.next_send_on) }));
    if (view.last_sent) status.push(tr("crLastSent", { month: view.last_sent.month, n: view.last_sent.recipients }));
    if (view.opted_out && view.opted_out.length) status.push(tr("crOptedOut", { emails: view.opted_out.join(", ") }));
    var noBrand = !view.has_own_branding && !(view.brand && view.brand.agency)
      ? '<p class="nrv-cr-note">' + esc(tr("crNoBrand", { tab: tr("partner") })) + "</p>" : "";
    var section = document.createElement("section");
    section.className = "nrv-client-report";
    section.innerHTML = '<div class="card panel">'
      + '<div class="nrv-aeo-heading"><div><small>' + esc(tr("agKicker")) + "</small><h2>" + esc(tr("crHeading")) + "</h2></div></div>"
      + '<p class="nrv-ag-lead">' + esc(tr("crLead")) + "</p>"
      + (status.length ? '<p class="nrv-cr-status">' + status.map(esc).join("<br>") + "</p>" : "")
      + '<form class="nrv-ag-form" data-cr-form>'
      + '<label class="nrv-ag-inline"><input type="checkbox" name="enabled"' + (s.enabled ? " checked" : "") + disabled + "> " + esc(tr("crEnable")) + "</label>"
      + '<label>' + esc(tr("crRecipients", { n: view.max_recipients || 5 })) + '<textarea class="input" name="recipients" rows="3" autocomplete="off"' + disabled + ">" + esc((s.recipients || []).join("\n")) + "</textarea></label>"
      + '<label>' + esc(tr("crLang")) + '<select class="input" name="locale"' + disabled + ">" + localeOptions(locale) + "</select></label>"
      + '<p class="nrv-cr-note">' + esc(tr("crLangNote")) + "</p>"
      + '<label>' + esc(tr("crBrand")) + '<select class="input" name="branding_source"' + disabled + ">"
      + '<option value="agency"' + (s.branding_source !== "nurevo" ? " selected" : "") + ">" + esc(tr("crBrandAgency")) + "</option>"
      + '<option value="nurevo"' + (s.branding_source === "nurevo" ? " selected" : "") + ">" + esc(tr("crBrandNurevo")) + "</option></select></label>"
      + noBrand
      + '<label class="nrv-ag-inline nrv-cr-consent"><input type="checkbox" name="consent"' + disabled + "> " + esc(tr("crConsent")) + "</label>"
      + (view.can_edit ? '<p><button type="submit" class="btn primary">' + esc(tr("save")) + '</button> <span class="nrv-ag-msg" data-cr-msg role="status"></span></p>' : "")
      + "</form>"
      + '<div class="nrv-cr-preview"><label>' + esc(tr("crMonth")) + ' <input class="input" type="month" name="month" data-cr-month value="' + esc(previousMonth()) + '"></label> '
      + '<button type="button" class="btn" data-cr-preview>' + esc(tr("crPreview")) + "</button> "
      + '<button type="button" class="btn" data-cr-print>' + esc(tr("crPrint")) + "</button>"
      + '<div data-cr-frame></div></div>'
      + "</div>";
    section.dataset.siteId = siteId;
    return section;
  }

  function attachReport(section, view, siteId) {
    var form = section.querySelector("[data-cr-form]");
    var monthInput = section.querySelector("[data-cr-month]");
    var lang = function () { return form && form.elements.locale ? form.elements.locale.value : ""; };
    var month = function () { return (monthInput && /^\d{4}-\d{2}$/.test(monthInput.value)) ? monthInput.value : previousMonth(); };
    var preview = section.querySelector("[data-cr-preview]");
    if (preview) preview.addEventListener("click", function () {
      var holder = section.querySelector("[data-cr-frame]");
      if (!holder) return;
      var frame = document.createElement("iframe");
      // No allow-scripts and no allow-same-origin: the report runs nothing.
      frame.setAttribute("sandbox", "");
      frame.setAttribute("title", tr("crPreview"));
      frame.className = "nrv-cr-frame";
      frame.src = reportUrl(siteId, month(), lang(), "html");
      holder.innerHTML = "";
      holder.appendChild(frame);
    });
    var print = section.querySelector("[data-cr-print]");
    if (print) print.addEventListener("click", function () {
      var w = window.open(reportUrl(siteId, month(), lang(), "html"), "_blank");
      if (w) w.addEventListener("load", function () { try { w.focus(); w.print(); } catch (e) { /* the page is open; the browser's print still works */ } });
    });
    if (!form || !view.can_edit) return;
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var msg = section.querySelector("[data-cr-msg]");
      var enabled = !!form.elements.enabled.checked;
      var recipients = String(form.elements.recipients.value || "").split(/[\n,;]+/).map(function (v) { return v.trim(); }).filter(Boolean);
      var consent = !!form.elements.consent.checked;
      var max = view.max_recipients || 5;
      if (recipients.length > max) { if (msg) msg.textContent = tr("crTooMany", { n: max }); return; }
      if (enabled && !recipients.length) { if (msg) msg.textContent = tr("crRecipientsNeeded"); return; }
      if (enabled && recipients.length && !consent) { if (msg) msg.textContent = tr("crConsentNeeded"); return; }
      var button = form.querySelector("button[type=submit]");
      if (button) button.disabled = true;
      try {
        var result = await putJson("/api/sites/" + encodeURIComponent(siteId) + "/report-settings", {
          enabled: enabled, recipients: recipients, locale: form.elements.locale.value, branding_source: form.elements.branding_source.value, consent: consent,
        });
        if (result.ok && result.data && result.data.available) {
          var replacement = reportCard(result.data, siteId);
          attachReport(replacement, result.data, siteId);
          section.replaceWith(replacement);
          var done = replacement.querySelector("[data-cr-msg]");
          if (done) done.textContent = tr("saved");
          return;
        }
        var fields = (result.data && result.data.fields) || [];
        var invalid = (result.data && result.data.invalid) || [];
        if (msg) msg.textContent = fields.indexOf("recipients_invalid") >= 0 && invalid.length ? tr("crBadEmail", { email: invalid[0] })
          : fields.indexOf("recipients_too_many") >= 0 ? tr("crTooMany", { n: max })
          : fields.indexOf("consent_required") >= 0 ? tr("crConsentNeeded")
          : fields.indexOf("recipients_required") >= 0 ? tr("crRecipientsNeeded") : tr("crSaveError");
      } catch (error) {
        if (msg) msg.textContent = tr("crSaveError");
      } finally { if (button) button.disabled = false; }
    });
  }

  async function mountReport() {
    var main = document.querySelector("#main"), detail = main && main.querySelector(".detail");
    if (!main || !detail) return;
    var siteId = siteIdFromHash();
    if (!siteId) return;
    var existing = main.querySelector(".nrv-client-report");
    if (existing && existing.dataset.siteId === siteId) return;
    if (loading.site === siteId) return;
    loading.site = siteId;
    try {
      var res = await fetch("/api/sites/" + encodeURIComponent(siteId) + "/report-settings", { credentials: "include", cache: "no-store" });
      if (!res.ok) return;
      var view = await res.json();
      if (!view || !view.available || siteIdFromHash() !== siteId) return;
      var again = main.querySelector(".nrv-client-report");
      if (again && again.dataset.siteId === siteId) return;
      if (again) again.remove();
      var section = reportCard(view, siteId);
      attachReport(section, view, siteId);
      main.appendChild(section);
    } catch (error) {
      /* fail open: the rest of the site page is unaffected */
    } finally { loading.site = null; }
  }

  function mount() { mountBranding(); mountReport(); }

  var style = document.createElement("style");
  style.textContent = ".nrv-client-report{margin-top:18px}.nrv-ag-lead{font-size:13px;line-height:1.7;margin:0 0 10px}.nrv-ag-form{display:grid;gap:10px;max-width:560px}.nrv-ag-form label{display:grid;gap:4px;font-size:12px;font-weight:600}.nrv-ag-form .nrv-ag-inline{display:flex;align-items:center;gap:8px;font-weight:500}.nrv-ag-form input[type=color]{width:64px;height:32px;padding:0;border:1px solid #ddd;border-radius:6px;background:#fff}.nrv-ag-logo{max-height:40px;max-width:160px;object-fit:contain;border:1px solid #eee;border-radius:6px;padding:2px;background:#fff}.nrv-ag-msg{font-size:12px;color:#5d5570}.nrv-cr-note{font-size:11px;color:#6c6579;margin:-4px 0 0;line-height:1.6}.nrv-cr-status{font-size:12px;color:#3d3650;background:#faf8ff;border:1px solid #e6e1f3;border-radius:8px;padding:8px 10px;overflow-wrap:anywhere}.nrv-cr-consent{background:#fff8e6;border-radius:8px;padding:8px 10px}.nrv-cr-preview{margin-top:16px;border-top:1px solid #efecf4;padding-top:12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}.nrv-cr-preview label{font-size:12px;font-weight:600;display:flex;gap:6px;align-items:center}.nrv-cr-preview [data-cr-frame]{flex-basis:100%}.nrv-cr-frame{width:100%;height:720px;border:1px solid #e7e9f1;border-radius:8px;background:#f4f4f6;margin-top:8px}";
  document.head.appendChild(style);
  new MutationObserver(function () { mount(); }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(mount, 650);
})();
