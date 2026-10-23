/* Nurevo dashboard asset revision: 2026-10-23-offsite2 */
/*
 * "Off-site store information" card on the site page.
 *
 * Shows, per listing, whether the name, address, phone and opening hours
 * match the store profile Nurevo holds, what differs, and how to fix it.
 * Google Maps is checked automatically when the operator has configured it;
 * the rest are a checklist with links, because their APIs are retired,
 * partner-only or not allowed for this use (see worker/offsite-audit.mjs).
 *
 * What the listing itself says (Google's phone number, for example) is only
 * available right after a check: the Google Maps Platform terms do not allow
 * keeping it, so the server stores our comparison outcome only. A reloaded
 * page therefore says "does not match" and links to the listing instead of
 * repeating a value it may not keep.
 *
 * Words come from the dashboard dictionary (t() in dashboard.html, the I5
 * block), like the other modules.
 *
 * Attribution: Places data shown without a Google map must credit Google Maps
 * (https://developers.google.com/maps/documentation/places/web-service/policies).
 * The logo is preferred; this card uses the permitted text form, styled as
 * the policy asks: "Google Maps" exactly, never translated (translate="no"),
 * Roboto/sans-serif, normal style, weight 400, 12-16px, #5E5E5E on white,
 * normal letter spacing, inside the same box as the data, plus any third-party
 * provider Google names in `attributions`. Shown only next to Google values.
 */
(function () {
  "use strict";
  var selectedSiteId = null;
  var loadingSiteId = null;

  function tr(key, vars) {
    var text = typeof t === "function" ? String(t(key)) : key;
    return text.replace(/\{(\w+)\}/g, function (m, name) { return vars && vars[name] != null ? String(vars[name]) : m; });
  }
  // A word whose key is built from a status or id (osSt_match, osDay3, ...).
  // scripts/test-offsite-audit.mjs checks every such key exists.
  function word(prefix, suffix, vars) { return tr(prefix + suffix, vars); }
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function when(ms) {
    var at = new Date(Number(ms));
    return Number.isFinite(at.getTime()) ? at.toLocaleString() : "—";
  }
  function safeUrl(url) { return /^https:\/\//.test(String(url || "")) ? String(url) : null; }
  function link(url, key) {
    var href = safeUrl(url);
    return href ? '<a class="nrv-os-link" href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(tr(key)) + '</a>' : "";
  }

  var FIELD_KEYS = { name: "osF_name", address: "osF_address", phone: "osF_phone", hours: "osF_hours", website: "osF_website", business_status: "osF_business_status" };
  var GOOD = { match: 1 };
  var BAD = { mismatch: 1 };

  function badge(status, prefix) {
    var tone = GOOD[status] ? "ok" : BAD[status] ? "bad" : status === "manual_check" ? "manual" : "neutral";
    return '<span class="nrv-os-badge is-' + tone + '">' + esc(word(prefix || "osSt_", status)) + "</span>";
  }

  function dayLabel(day) { return word("osDay", day); }
  function hoursText(value) { return value === "closed" ? tr("osClosed") : value == null ? "—" : value; }

  /* One line per field that needs attention; matching fields are listed compactly. */
  function fieldLines(source, profile, sourceName) {
    var fields = source.fields || {};
    var observed = source.observed || null;
    var ok = [];
    var lines = [];
    Object.keys(fields).forEach(function (field) {
      var info = fields[field] || {};
      var label = tr(FIELD_KEYS[field] || field);
      if (info.status === "match") {
        ok.push(label);
        if (info.note === "building_differs") lines.push('<li class="is-note">' + esc(tr("osBuilding")) + "</li>");
        if (info.ours_from_listing) lines.push('<li class="is-note">' + esc(label + tr("osSep") + tr("osFromListing")) + "</li>");
        return;
      }
      if (field === "business_status") {
        lines.push('<li class="is-bad">' + esc(tr("osBizStatus")) + "</li>");
        return;
      }
      var text;
      if ((info.status === "mismatch" || info.status === "variant") && field === "hours" && Array.isArray(info.days)) {
        text = esc(tr("osHoursHead", { source: sourceName }));
        text += "<ul>" + info.days.map(function (d) {
          return "<li>" + esc(observed && d.theirs !== undefined
            ? tr("osHoursDay", { day: dayLabel(d.day), ours: hoursText(d.ours), theirs: hoursText(d.theirs) })
            : tr("osHoursDayStored", { day: dayLabel(d.day), ours: hoursText(d.ours) })) + "</li>";
        }).join("") + "</ul>";
      } else if (info.status === "mismatch" || info.status === "variant") {
        var ours = profile && profile[field] ? profile[field] : tr("osNotSet");
        text = observed && observed[field]
          ? esc(tr("osDiffObserved", { source: sourceName, field: label, theirs: observed[field], ours: ours }))
          : esc(tr("osDiffStored", { source: sourceName, field: label, ours: ours }));
        if (info.status === "variant") text += " " + esc(tr("osVariantNote"));
      } else {
        text = esc(label + tr("osSep") + word("osFs_", info.status));
      }
      lines.push('<li class="is-' + (info.status === "mismatch" ? "bad" : "warn") + '">' + text + "</li>");
    });
    return (ok.length ? '<p class="nrv-os-ok">' + esc(tr("osMatched", { fields: ok.join(tr("osListSep")) })) + "</p>" : "")
      + (lines.length ? '<ul class="nrv-os-lines">' + lines.join("") + "</ul>" : "");
  }

  function steps(keys, links) {
    if (!keys || !keys.length) return "";
    return '<ol class="nrv-os-steps">' + keys.map(function (key) { return "<li>" + esc(word("osStep_", key)) + "</li>"; }).join("") + "</ol>"
      + '<p class="nrv-os-links">' + [link(links && links.suggest, "osOpenListing"), link(links && links.check, "osCheck"), link(links && links.manage, "osManage")].filter(Boolean).join(" ") + "</p>";
  }

  // "Google Maps" is a wordmark: not a dictionary word, never localised.
  function attribution(source) {
    var providers = (source.attribution_providers || []).map(function (p) {
      var href = safeUrl(p.uri);
      return href ? '<a href="' + esc(href) + '" target="_blank" rel="noopener" translate="no">' + esc(p.name) + "</a>" : '<span translate="no">' + esc(p.name) + "</span>";
    });
    return '<p class="nrv-os-attr">' + esc(tr("osAttribution")) + ' <span class="nrv-os-gmaps" translate="no">Google Maps</span>'
      + (providers.length ? '<span class="nrv-os-providers"> · ' + providers.join(", ") + "</span>" : "") + "</p>";
  }

  function googleBlock(source, profile, refunded) {
    var name = tr("osSrc_google");
    var html = '<div class="nrv-os-source" data-os-source="google"><div class="nrv-os-head"><strong>' + esc(name) + "</strong> " + badge(source.status) + '<span class="nrv-os-kind">' + esc(tr("osAuto")) + "</span></div>";
    if (source.status === "match" || source.status === "mismatch") {
      html += fieldLines(source, profile, name);
      if (source.observed) html += attribution(source);
    } else if (source.status === "ambiguous") {
      html += "<p>" + esc(tr("osCandidates")) + '</p><ul class="nrv-os-cands">' + (source.candidates || []).map(function (c) {
        var label = c.name ? c.name + (c.address ? tr("osSep") + c.address : "") : tr("osCandidateStored");
        return "<li>" + esc(label) + " " + link(c.url, "osOpenListing") + ' <button type="button" data-os-pick="' + esc(c.id) + '">' + esc(tr("osPick")) + "</button></li>";
      }).join("") + "</ul><p class=\"nrv-os-note\">" + esc(tr("osPickNote")) + "</p>";
      if ((source.candidates || []).some(function (c) { return c.name; })) html += attribution(source);
    } else if (source.status === "error" || source.status === "rate_limited" || source.status === "skipped") {
      html += "<p>" + esc(word("osStatusNote_", source.status)) + "</p>";
      if (refunded) html += '<p class="nrv-os-note">' + esc(tr("osRefunded")) + "</p>";
    }
    html += steps(source.steps, source.links);
    if (source.status === "not_configured") {
      html += '<p class="nrv-os-note">' + esc(tr("osVerify", { fields: ["name", "address", "phone", "hours"].map(function (f) { return tr(FIELD_KEYS[f]); }).join(tr("osListSep")) })) + "</p>";
    }
    return html + "</div>";
  }

  function manualBlock(item) {
    return '<div class="nrv-os-source" data-os-source="' + esc(item.id) + '"><div class="nrv-os-head"><strong>' + esc(word("osSrc_", item.id)) + "</strong> " + badge("manual_check")
      + (item.applies === "if_applicable" ? '<span class="nrv-os-kind">' + esc(tr("osIfApplicable")) + "</span>" : "") + "</div>"
      + '<p class="nrv-os-note">' + esc(word("osWhyManual_", item.why_manual)) + "</p>"
      + "<p>" + esc(tr("osVerify", { fields: (item.verify || []).map(function (f) { return tr(FIELD_KEYS[f] || f); }).join(tr("osListSep")) })) + "</p>"
      + steps(item.steps, item.links) + "</div>";
  }

  function allowanceText(view) {
    var a = view.allowance || {};
    var schedule = view.schedule === "weekly" ? tr("osScheduleWeekly") : tr("osScheduleMonthly");
    if (a.allowed) return schedule;
    if (a.reason === "unavailable") return tr("osUnavailable");
    var key = a.reason === "monthly_limit" ? "osLimitMonthly" : a.reason === "daily_limit" ? "osLimitDaily" : "osTooSoon";
    return schedule + " " + tr(key, { when: a.next_at ? when(a.next_at) : "—" });
  }

  function profileBlock(profile) {
    var p = profile || {};
    var rows = ["name", "address", "phone", "hours"].map(function (f) {
      return "<div><dt>" + esc(tr(FIELD_KEYS[f])) + "</dt><dd>" + esc(p[f] || tr("osNotSet")) + "</dd></div>";
    }).join("");
    return '<details class="nrv-os-profile"><summary>' + esc(tr("osProfileHead")) + '</summary><dl>' + rows + "</dl></details>";
  }

  /* view: the GET payload; fresh: the POST result, which carries what the listing showed. */
  function panel(view, fresh) {
    var section = document.createElement("section");
    section.className = "nrv-offsite";
    var result = fresh || (view && view.latest) || null;
    var profile = (result && result.profile) || (view && view.profile) || {};
    var configured = (view && view.configured) || {};
    var html = '<div class="card panel"><div class="nrv-aeo-heading"><div><small>' + esc(tr("osKicker")) + "</small><h2>" + esc(tr("osHeading")) + "</h2></div></div>"
      + '<p class="nrv-os-why">' + esc(tr("osWhy")) + "</p>"
      + '<p class="nrv-os-note">' + esc(tr("osNoGuarantee")) + "</p>";
    if (view && view.available === false) {
      section.innerHTML = html + "<p>" + esc(tr("osUnavailable")) + "</p></div>";
      return section;
    }
    html += '<div class="nrv-os-run"><button type="button" data-os-run' + (view && view.allowance && view.allowance.allowed === false ? " disabled" : "") + ">" + esc(tr("osRun")) + "</button>"
      + ' <span class="nrv-os-note" data-os-status role="status">' + esc(result ? tr("osLastRun", { when: when(result.ran_at) }) : tr("osNever")) + "</span>"
      + '<p class="nrv-os-note">' + esc(allowanceText(view || {})) + "</p></div>";
    html += profileBlock(profile);
    html += "<h3>" + esc(tr("osAutoHead")) + "</h3>";
    var google = result && (result.sources || []).filter(function (s) { return s.id === "google"; })[0];
    if (google) html += googleBlock(google, profile, !!(fresh && fresh.refunded));
    else if (!configured.google) html += googleBlock({ id: "google", status: "not_configured", steps: ["google_manual"], links: { manage: "https://business.google.com/" } }, profile);
    else html += '<p class="nrv-os-note">' + esc(tr("osNever")) + "</p>";
    var manual = (view && view.checklist) || (result && result.manual) || [];
    if (manual.length) html += "<h3>" + esc(tr("osManualHead")) + "</h3>" + manual.map(manualBlock).join("");
    section.innerHTML = html + "</div>";
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

  async function post(siteId, body) {
    var csrf = await (await fetch("/api/csrf", { credentials: "include" })).json();
    var res = await fetch("/api/sites/" + encodeURIComponent(siteId) + "/offsite-audit", {
      method: "POST", credentials: "include",
      headers: { "content-type": "application/json", "x-csrf-token": csrf.csrf_token },
      body: JSON.stringify(body || {}),
    });
    var data = await res.json();
    if (!res.ok) { var error = new Error(data.error || "error"); error.data = data; throw error; }
    return data;
  }

  function attach(section, view, siteId) {
    section.addEventListener("click", async function (event) {
      var target = event.target;
      if (!target.matches || !target.matches("button[data-os-run],button[data-os-pick]")) return;
      var status = section.querySelector("[data-os-status]");
      target.disabled = true;
      if (status) status.textContent = tr("osRunning");
      try {
        var body = target.hasAttribute("data-os-pick") ? { pin: { source: "google", listing_id: target.getAttribute("data-os-pick") } } : {};
        var data = await post(siteId, body);
        var next = Object.assign({}, view, { allowance: data.allowance, configured: data.configured || view.configured });
        var replacement = panel(next, data.result);
        attach(replacement, next, siteId);
        section.replaceWith(replacement);
        var replacedStatus = replacement.querySelector("[data-os-status]");
        if (replacedStatus) replacedStatus.textContent = tr("osDone");
      } catch (error) {
        var allowance = error.data && error.data.allowance;
        if (status) status.textContent = allowance ? allowanceText(Object.assign({}, view, { allowance: allowance })) : tr("osError");
        target.disabled = false;
      }
    });
  }

  async function mount() {
    var main = document.querySelector("#main"), detail = main && main.querySelector(".detail");
    if (!main || !detail) { loadingSiteId = null; return; }
    if (main.querySelector(".nrv-offsite")) return;
    var siteId = await resolveSiteId();
    if (!siteId || loadingSiteId === siteId || main.querySelector(".nrv-offsite")) return;
    loadingSiteId = siteId;
    try {
      // A read: the stored outcome and the checklist. No listing is fetched.
      var response = await fetch("/api/sites/" + encodeURIComponent(siteId) + "/offsite-audit", { credentials: "include", cache: "no-store" });
      if (!response.ok || main.querySelector(".nrv-offsite")) return;
      var view = await response.json();
      var section = panel(view, null);
      attach(section, view, siteId);
      main.appendChild(section);
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
  style.textContent = ".nrv-offsite{margin-top:18px}.nrv-os-why{font-size:13px;line-height:1.7;margin:0 0 6px}.nrv-os-note{font-size:11px;color:#6c6579;line-height:1.6;margin:4px 0}.nrv-os-run{margin:12px 0}.nrv-os-run button,.nrv-os-cands button{background:#6f4df6;color:#fff;border:0;border-radius:8px;padding:7px 13px;font-size:12px;font-weight:700;cursor:pointer}.nrv-os-run button[disabled]{opacity:.5;cursor:default}.nrv-offsite h3{font-size:13px;margin:18px 0 8px}.nrv-os-source{border:1px solid #ece9f3;border-radius:10px;padding:12px 14px;margin:0 0 10px}.nrv-os-head{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:6px}.nrv-os-kind{font-size:10px;color:#8b8498}.nrv-os-badge{font-size:10px;border-radius:5px;padding:2px 7px;font-weight:700}.nrv-os-badge.is-ok{background:#e7f5ec;color:#176b3a}.nrv-os-badge.is-bad{background:#fdecec;color:#a12828}.nrv-os-badge.is-manual{background:#efe9ff;color:#5a3ad6}.nrv-os-badge.is-neutral{background:#f1eff5;color:#5d5570}.nrv-os-lines{margin:6px 0;padding-left:18px;font-size:12px;line-height:1.7}.nrv-os-lines li.is-bad{color:#a12828}.nrv-os-lines li.is-warn{color:#8a5a00}.nrv-os-lines li.is-note{color:#6c6579}.nrv-os-ok{font-size:12px;color:#176b3a;margin:4px 0}.nrv-os-steps{margin:6px 0;padding-left:18px;font-size:12px;line-height:1.7}.nrv-os-links{display:flex;flex-wrap:wrap;gap:12px;font-size:12px;margin:4px 0 0}.nrv-os-link{color:#6f4df6;font-weight:700}.nrv-os-attr{font-size:12px;color:#5e5e5e;margin:6px 0 0;line-height:1.5}.nrv-os-gmaps{font-family:Roboto,Arial,sans-serif;font-style:normal;font-weight:400;font-size:12px;letter-spacing:normal;color:#5e5e5e;text-transform:none}.nrv-os-providers a{color:#5e5e5e}.nrv-os-cands{list-style:none;padding:0;margin:6px 0;font-size:12px}.nrv-os-cands li{padding:6px 0;border-top:1px solid #f3f1f7}.nrv-os-profile{font-size:12px;margin:8px 0}.nrv-os-profile dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:6px 16px;margin:8px 0 0}.nrv-os-profile dt{font-size:10px;color:#8b8498}.nrv-os-profile dd{margin:0;white-space:pre-wrap}";
  document.head.appendChild(style);
  new MutationObserver(function () { mount(); }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(mount, 700);
})();
