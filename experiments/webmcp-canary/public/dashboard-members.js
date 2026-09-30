(function () {
  "use strict";
  var main = document.querySelector("#main"), side = document.querySelector(".side");
  if (!main || !side) return;
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>\"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]; }); }
  var me = null;
  function nav(label, key, fn) { var b = document.createElement("button"); b.className = "nav"; b.type = "button"; b.textContent = label; b.dataset.memberNav = key; side.insertBefore(b, side.querySelector(".foot")); b.onclick = function () { document.querySelectorAll(".nav").forEach(function (x) { x.classList.remove("active"); }); b.classList.add("active"); fn(); }; }
  fetch("/api/me", { credentials: "include", cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (member) { if (!member) return; me = member; nav("▥ メンバー", "members", renderMembers); if (member.is_super_admin) nav("♢ パートナー管理", "partners", renderPartners); }).catch(function () {});
  async function renderMembers() {
    main.innerHTML = '<div class="top"><h1>メンバー</h1><button class="btn" data-member-refresh>更新</button></div><div class="card panel"><p class="notice">自社ダッシュボードに入れるメンバーを管理します。pendingの登録はスーパー管理者の承認後に利用できます。</p><button class="btn primary" data-member-invite>招待コードを発行</button><p class="notice" data-member-invite-result></p></div><div class="card" style="margin-top:18px"><div class="head"><h2>自社メンバー一覧</h2></div><div class="tablewrap"><table><thead><tr><th>メール</th><th>役割</th><th>状態</th></tr></thead><tbody data-member-rows><tr><td colspan="3">読み込み中…</td></tr></tbody></table></div></div>';
    main.querySelector("[data-member-refresh]").onclick = renderMembers;
    main.querySelector("[data-member-invite]").onclick = async function () { var payload = me && me.is_super_admin && me.org_id ? { org_id: me.org_id } : {}; var r = await fetch("/api/members/invites", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }); var b = await r.json(); main.querySelector("[data-member-invite-result]").textContent = r.ok ? "招待コード: " + b.code + "（7日間有効）" : (b.error || "発行できませんでした"); };
    var response = await fetch("/api/members", { credentials: "include", cache: "no-store" }), body = await response.json(), rows = main.querySelector("[data-member-rows]");
    if (!response.ok) { rows.innerHTML = '<tr><td colspan="3">メンバー情報を取得できませんでした。</td></tr>'; return; }
    rows.innerHTML = (body.members || []).map(function (m) { return '<tr><td>' + esc(m.email) + '</td><td>' + esc(m.role) + '</td><td>' + esc(m.status) + '</td></tr>'; }).join("") || '<tr><td colspan="3">メンバーがいません。</td></tr>';
  }
  async function renderPartners() {
    main.innerHTML = '<div class="top"><h1>パートナー管理</h1><button class="btn" data-partner-refresh>更新</button></div><div class="card panel"><p class="notice">個人紹介パートナー・代理店の承認待ちを管理します。</p></div><div class="card" style="margin-top:18px"><div class="head"><h2>承認待ち一覧</h2></div><div class="tablewrap"><table><thead><tr><th>メール</th><th>役割</th><th>状態</th><th></th></tr></thead><tbody data-partner-rows><tr><td colspan="4">読み込み中…</td></tr></tbody></table></div></div><div class="card" style="margin-top:18px"><div class="head"><h2>加盟パートナー一覧</h2><div class="toolbar"><button class="btn" data-partner-sort="active_sites">契約件数</button><button class="btn" data-partner-sort="monthly_amount_yen">金額</button><button class="btn" data-partner-sort="joined_at">加入日</button></div></div><div class="tablewrap"><table><thead><tr><th>パートナー名</th><th>種別</th><th>契約件数</th><th>金額/月</th><th>加入日</th></tr></thead><tbody data-active-partner-rows><tr><td colspan="5">読み込み中…</td></tr></tbody></table></div></div>';
    main.querySelector("[data-partner-refresh]").onclick = renderPartners;
    var response = await fetch("/api/admin/pending", { credentials: "include", cache: "no-store" }), body = await response.json(), rows = main.querySelector("[data-partner-rows]");
    if (!response.ok) { rows.innerHTML = '<tr><td colspan="4">承認待ちを取得できませんでした。</td></tr>'; return; }
    rows.innerHTML = (body.pending || []).map(function (m) { return '<tr><td>' + esc(m.email) + '</td><td>' + esc(m.role) + '</td><td>' + esc(m.status) + '</td><td><button class="btn" data-approve="' + esc(m.id) + '">承認</button></td></tr>'; }).join("") || '<tr><td colspan="4">承認待ちはありません。</td></tr>';
    rows.querySelectorAll("[data-approve]").forEach(function (button) { button.onclick = async function () { await fetch("/api/members/" + encodeURIComponent(button.dataset.approve) + "/approve", { method: "POST", credentials: "include" }); renderPartners(); }; });
    var activeResponse = await fetch("/api/admin/partners", { credentials: "include", cache: "no-store" });
    var activeBody = await activeResponse.json();
    var activeRows = main.querySelector("[data-active-partner-rows]");
    if (!activeResponse.ok) { activeRows.innerHTML = '<tr><td colspan="5">加盟パートナーを取得できませんでした。</td></tr>'; return; }
    var partners = activeBody.partners || [];
    function drawPartners(sortKey) {
      partners = partners.slice().sort(function (a, b) { return sortKey === "joined_at" ? Number(b.joined_at || 0) - Number(a.joined_at || 0) : Number(b[sortKey] || 0) - Number(a[sortKey] || 0); });
      activeRows.innerHTML = partners.map(function (p) { return '<tr><td>' + esc(p.name || p.id) + '</td><td>' + esc(p.type === "agency" ? "卸" : "個人紹介") + '</td><td>' + esc(p.active_sites) + '</td><td>¥' + Number(p.monthly_amount_yen || 0).toLocaleString() + '</td><td>' + (p.joined_at ? new Date(p.joined_at).toLocaleDateString() : '—') + '</td></tr>'; }).join("") || '<tr><td colspan="5">加盟パートナーがいません。</td></tr>';
    }
    drawPartners("active_sites");
    main.querySelectorAll("[data-partner-sort]").forEach(function (button) { button.onclick = function () { drawPartners(button.dataset.partnerSort); }; });
  }
})();
