/* Nurevo dashboard asset revision: 2026-10-22-a11y */
/*
 * Per-row controls on the sites table.
 *
 * This file used to be dashboard-places.js and owned the "add a site" flow: it
 * intercepted the Add button and put a Google Maps search in front of the
 * operator, because a site could not be created without a Places selection.
 * Sites are now created from their address alone through the onboarding
 * wizard, so only the delete button, which was never about Places, remains.
 */
(function () {
  "use strict";
  function tr(key) { return typeof t === "function" ? t(key) : key; }
  function notify(text) { if (typeof window.nrvToast === "function") window.nrvToast(text); }
  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    if (text) node.textContent = text;
    return node;
  }
  async function openPortal(siteId) {
    try {
      var r = await fetch("/api/billing/portal", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ site_id: siteId }) });
      var b = await r.json().catch(function () { return {}; });
      if (r.ok && b.url) location.href = b.url;
    } catch (_) {}
  }
  function mountDeleteButtons() {
    document.querySelectorAll("tr[data-site]").forEach(function (row) {
      if (row.querySelector("[data-delete-site]")) return;
      var cell = document.createElement("td");
      var siteId = row.getAttribute("data-site");
      var label = (row.querySelector("[data-site-link]") || {}).textContent || "";
      var button = el("button", { type: "button", class: "btn", "data-delete-site": siteId, "aria-label": tr("del") + (label ? " " + label : "") }, tr("del"));
      button.addEventListener("click", async function (event) {
        event.preventDefault(); event.stopPropagation();
        if (!window.confirm(tr("delConfirm") + (label ? "\n" + label : ""))) return;
        button.disabled = true;
        var response, body = {};
        try {
          response = await fetch("/api/sites/" + encodeURIComponent(siteId), { method: "DELETE", credentials: "include" });
          body = await response.json().catch(function () { return {}; });
        } catch (_) { button.disabled = false; notify(typeof window.nrvErrText === "function" ? window.nrvErrText("network") : tr("delFailed")); return; }
        if (!response.ok) {
          button.disabled = false;
          // A paying site cannot be deleted from here: the subscription has to
          // be cancelled in Stripe first, so say so and offer the way there.
          if (body.error === "subscription_active") {
            notify(tr("err_delete_subscription"));
            if (window.confirm(tr("err_delete_subscription") + "\n\n" + tr("manageBilling") + "?")) openPortal(siteId);
            return;
          }
          notify(tr("delFailed") + (body.error && typeof window.nrvErrText === "function" ? " " + window.nrvErrText(body.error) : ""));
          return;
        }
        row.remove();
      });
      cell.append(button); row.append(cell);
    });
  }
  new MutationObserver(mountDeleteButtons).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(mountDeleteButtons, 0);
})();
