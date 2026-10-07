/* Nurevo dashboard asset revision: 2026-10-08-asset1 */
/*
 * Per-row controls on the sites table.
 *
 * This file used to be dashboard-places.js and owned the "add a site" flow: it
 * intercepted the Add button and put a Google Maps search in front of the
 * operator, because a site could not be created without a Places selection.
 * Sites are now created from their address alone, which dashboard.html already
 * knew how to do - so the interception is gone and only the delete button,
 * which was never about Places, remains here.
 */
(function () {
  "use strict";
  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    if (text) node.textContent = text;
    return node;
  }
  function mountDeleteButtons() {
    document.querySelectorAll("tr[data-site]").forEach(function (row) {
      if (row.querySelector("[data-delete-site]")) return;
      var cell = document.createElement("td");
      var button = el("button", { type: "button", class: "btn", "data-delete-site": row.getAttribute("data-site") }, "削除");
      button.addEventListener("click", async function (event) {
        event.preventDefault(); event.stopPropagation();
        if (!window.confirm("この店舗を削除しますか？")) return;
        button.disabled = true;
        var response = await fetch("/api/sites/" + encodeURIComponent(row.getAttribute("data-site")), { method: "DELETE", credentials: "include" });
        if (!response.ok) { button.disabled = false; return; }
        row.remove();
      });
      cell.append(button); row.append(cell);
    });
  }
  new MutationObserver(mountDeleteButtons).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(mountDeleteButtons, 0);
})();
