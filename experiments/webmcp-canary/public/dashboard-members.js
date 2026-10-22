(function () {
  "use strict";
  var main = document.querySelector("#main");
  var side = document.querySelector(".side");
  if (!main || !side) return;
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>\"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]; }); }
  // Words come from the dashboard dictionary (t() in dashboard.html), as in
  // dashboard-onboarding.js.
  function tr(key, vars) {
    var text = typeof t === "function" ? String(t(key)) : key;
    return text.replace(/\{(\w+)\}/g, function (m, name) { return vars && vars[name] != null ? String(vars[name]) : m; });
  }
  function errText(code) { return typeof window.nrvErrText === "function" ? window.nrvErrText(code) : String(code || ""); }
  var me = null;
  // The label is a [data-k] span, so the dashboard's render() relabels it when
  // the language changes, like the built-in navigation.
  function addNav(icon, labelKey, key, handler) {
    var nav = document.createElement("button"); nav.className = "nav"; nav.type = "button"; nav.innerHTML = icon + ' <span data-k="' + labelKey + '">' + esc(tr(labelKey)) + '</span>'; nav.dataset.memberNav = key;
    side.insertBefore(nav, side.querySelector(".foot"));
    nav.addEventListener("click", function () { document.querySelectorAll(".nav").forEach(function (x) { x.classList.remove("active"); }); nav.classList.add("active"); handler(); });
  }
  fetch("/api/me", { credentials: "include", cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (member) {
    if (!member) return;
    me = member;
    if (!side.querySelector('[data-member-nav="members"]')) addNav("▥", "mbTitle", "members", renderMembers);
    if (member.is_super_admin && !side.querySelector('[data-member-nav="partners"]')) addNav("♢", "mbPartnersNav", "partners", renderPartners);
  }).catch(function () {});
  async function renderMembers() {
    main.innerHTML = '<div class="top"><h1>' + esc(tr("mbTitle")) + '</h1><button class="btn" data-member-refresh>' + esc(tr("refresh")) + '</button></div><div class="card panel"><p class="notice">' + esc(tr("mbLead")) + '</p><button class="btn primary" data-member-invite>' + esc(tr("mbInvite")) + '</button><p class="notice" data-member-invite-result></p></div><div class="card" style="margin-top:18px"><div class="head"><h2>' + esc(tr("mbList")) + '</h2></div><div class="tablewrap"><table><thead><tr><th>' + esc(tr("mbEmail")) + '</th><th>' + esc(tr("mbRole")) + '</th><th>' + esc(tr("mbStatus")) + '</th></tr></thead><tbody data-member-rows><tr><td colspan="3">' + esc(tr("mbLoading")) + '</td></tr></tbody></table></div></div>';
    main.querySelector("[data-member-refresh]").onclick = renderMembers;
    main.querySelector("[data-member-invite]").onclick = async function () { var payload = {}; if (me && me.is_super_admin && me.org_id) payload.org_id = me.org_id; var r = await fetch("/api/members/invites", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }); var b = await r.json(); main.querySelector("[data-member-invite-result]").textContent = r.ok ? tr("mbInviteCode", { code: b.code }) : (b.error ? errText(b.error) : tr("mbInviteFailed")); };
    var response = await fetch("/api/members", { credentials: "include", cache: "no-store" });
    var body = await response.json();
    var rows = main.querySelector("[data-member-rows]");
    if (!response.ok) { rows.innerHTML = '<tr><td colspan="3">' + esc(tr("mbLoadFailed")) + '</td></tr>'; return; }
    rows.innerHTML = (body.members || []).map(function (m) { return '<tr><td>' + esc(m.email) + '</td><td>' + esc(m.role) + '</td><td>' + esc(m.status) + '</td></tr>'; }).join("") || '<tr><td colspan="3">' + esc(tr("mbNone")) + '</td></tr>';
  }
  async function renderPartners() {
    main.innerHTML = '<div class="top"><h1>' + esc(tr("mbPartnersNav")) + '</h1><button class="btn" data-partner-refresh>' + esc(tr("refresh")) + '</button></div><div class="card panel"><p class="notice">' + esc(tr("paLead")) + '</p></div><div class="card" style="margin-top:18px"><div class="head"><h2>' + esc(tr("paPending")) + '</h2></div><div class="tablewrap"><table><thead><tr><th>' + esc(tr("mbEmail")) + '</th><th>' + esc(tr("mbRole")) + '</th><th>' + esc(tr("mbStatus")) + '</th><th></th></tr></thead><tbody data-partner-rows><tr><td colspan="4">' + esc(tr("mbLoading")) + '</td></tr></tbody></table></div></div><div class="card" style="margin-top:18px"><div class="head"><h2>' + esc(tr("paActive")) + '</h2><div class="toolbar"><button class="btn" data-partner-sort="active_sites">' + esc(tr("paSites")) + '</button><button class="btn" data-partner-sort="monthly_amount_yen">' + esc(tr("paAmount")) + '</button><button class="btn" data-partner-sort="joined_at">' + esc(tr("paJoined")) + '</button></div></div><div class="tablewrap"><table><thead><tr><th>' + esc(tr("paName")) + '</th><th>' + esc(tr("paType")) + '</th><th>' + esc(tr("paSites")) + '</th><th>' + esc(tr("paMonthly")) + '</th><th>' + esc(tr("paJoined")) + '</th></tr></thead><tbody data-active-partner-rows><tr><td colspan="5">' + esc(tr("mbLoading")) + '</td></tr></tbody></table></div></div>';
    main.querySelector("[data-partner-refresh]").onclick = renderPartners;
    var response = await fetch("/api/admin/pending", { credentials: "include", cache: "no-store" });
    var body = await response.json();
    var rows = main.querySelector("[data-partner-rows]");
    if (!response.ok) { rows.innerHTML = '<tr><td colspan="4">' + esc(tr("paPendingFailed")) + '</td></tr>'; return; }
    rows.innerHTML = (body.pending || []).map(function (m) { return '<tr><td>' + esc(m.email) + '</td><td>' + esc(m.role) + '</td><td>' + esc(m.status) + '</td><td><button class="btn" data-approve="' + esc(m.id) + '">' + esc(tr("paApprove")) + '</button></td></tr>'; }).join("") || '<tr><td colspan="4">' + esc(tr("paNoPending")) + '</td></tr>';
    rows.querySelectorAll("[data-approve]").forEach(function (button) { button.onclick = async function () { await fetch("/api/members/" + encodeURIComponent(button.dataset.approve) + "/approve", { method: "POST", credentials: "include" }); renderPartners(); }; });
    var activeResponse = await fetch("/api/admin/partners", { credentials: "include", cache: "no-store" });
    var activeBody = await activeResponse.json();
    var activeRows = main.querySelector("[data-active-partner-rows]");
    if (!activeResponse.ok) { activeRows.innerHTML = '<tr><td colspan="5">' + esc(tr("paActiveFailed")) + '</td></tr>'; return; }
    var partners = activeBody.partners || [];
    function drawPartners(sortKey) {
      partners = partners.slice().sort(function (a, b) { return sortKey === "joined_at" ? Number(b.joined_at || 0) - Number(a.joined_at || 0) : Number(b[sortKey] || 0) - Number(a[sortKey] || 0); });
      activeRows.innerHTML = partners.map(function (p) { return '<tr><td>' + esc(p.name || p.id) + '</td><td>' + esc(p.type === "agency" ? tr("paWholesale") : tr("paReferral")) + '</td><td>' + esc(p.active_sites) + '</td><td>¥' + Number(p.monthly_amount_yen || 0).toLocaleString() + '</td><td>' + (p.joined_at ? new Date(p.joined_at).toLocaleDateString() : '—') + '</td></tr>'; }).join("") || '<tr><td colspan="5">' + esc(tr("paNone")) + '</td></tr>';
    }
    drawPartners("active_sites");
    main.querySelectorAll("[data-partner-sort]").forEach(function (button) { button.onclick = function () { drawPartners(button.dataset.partnerSort); }; });
  }
})();
