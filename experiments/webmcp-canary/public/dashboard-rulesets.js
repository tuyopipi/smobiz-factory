/* Nurevo dashboard asset revision: 2026-10-01-asset1 */
(function () {
  "use strict";
  var main = document.querySelector("#main"), side = document.querySelector(".side");
  if (!main || !side) return;
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  async function api(path, options) {
    var response = await fetch(path, Object.assign({ credentials: "include", cache: "no-store" }, options || {}));
    var body = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(body.details ? body.details.join(" / ") : (body.error || "request_failed"));
    return body;
  }
  fetch("/api/me", { credentials: "include", cache: "no-store" }).then(function (response) {
    return response.ok ? response.json() : null;
  }).then(function (member) {
    if (!member || !member.is_super_admin) return;
    var button = document.createElement("button");
    button.className = "nav";
    button.type = "button";
    button.textContent = "◉ AEOルール";
    button.dataset.rulesetNav = "1";
    side.insertBefore(button, side.querySelector(".foot"));
    button.onclick = function () {
      document.querySelectorAll(".nav").forEach(function (item) { item.classList.remove("active"); });
      button.classList.add("active");
      renderRulesets();
    };
  }).catch(function () {});

  async function renderRulesets() {
    main.innerHTML = '<div class="top"><h1>AEOルール管理</h1><button class="btn" data-ruleset-refresh>更新</button></div><div class="card panel"><p class="notice">新版はcandidateとして保存されます。activate後、約5分以内に生きた接続へ反映されます。</p><div class="grid2"><label class="field"><span>Notes</span><input class="input" data-ruleset-notes maxlength="2000"></label><button class="btn" type="button" data-ruleset-copy-active>現在版の定義を読み込む</button></div><label class="field"><span>definition_json</span><textarea class="input" data-ruleset-definition rows="12" placeholder="{&quot;schema&quot;:{...}}"></textarea></label><button class="btn primary" type="button" data-ruleset-create>candidateを作成</button><span class="notice" data-ruleset-result></span></div><div class="card" style="margin-top:18px"><div class="head"><h2>バージョン履歴</h2></div><div class="tablewrap"><table><thead><tr><th>Version</th><th>状態</th><th>作成日時</th><th>Notes</th><th>最終activate</th><th></th></tr></thead><tbody data-ruleset-rows><tr><td colspan="6">読み込み中…</td></tr></tbody></table></div></div>';
    main.querySelector("[data-ruleset-refresh]").onclick = renderRulesets;
    var result = main.querySelector("[data-ruleset-result]");
    try {
      var body = await api("/api/admin/aeo/rulesets");
      var rulesets = body.rulesets || [];
      var rows = main.querySelector("[data-ruleset-rows]");
      rows.innerHTML = rulesets.map(function (ruleset) {
        return '<tr><td>v' + esc(ruleset.version) + '</td><td><span class="pill ' + (ruleset.active ? "active" : "pending") + '">' + (ruleset.active ? "ACTIVE" : "candidate") + '</span></td><td>' + esc(ruleset.created_at) + '</td><td>' + esc(ruleset.notes || "—") + '</td><td>' + esc(ruleset.activated_at || "—") + '</td><td><button class="btn" data-ruleset-detail="' + esc(ruleset.version) + '">詳細</button> ' + (ruleset.active ? "" : '<button class="btn primary" data-ruleset-activate="' + esc(ruleset.version) + '">Activate</button>') + '</td></tr>';
      }).join("") || '<tr><td colspan="6">rulesetがありません。</td></tr>';
      rows.querySelectorAll("[data-ruleset-detail]").forEach(function (button) {
        button.onclick = async function () {
          try {
            var detail = await api("/api/admin/aeo/rulesets/" + encodeURIComponent(button.dataset.rulesetDetail));
            main.querySelector("[data-ruleset-definition]").value = JSON.stringify(JSON.parse(detail.ruleset.definition_json), null, 2);
            main.querySelector("[data-ruleset-notes]").value = detail.ruleset.notes || "";
            result.textContent = "v" + detail.ruleset.version + " を編集欄へ読み込みました。保存時は新版になります。";
          } catch (error) { result.textContent = error.message; }
        };
      });
      rows.querySelectorAll("[data-ruleset-activate]").forEach(function (button) {
        button.onclick = async function () {
          var version = button.dataset.rulesetActivate;
          if (!confirm("v" + version + " をactiveに切り替えますか？")) return;
          button.disabled = true;
          try { await api("/api/admin/aeo/rulesets/" + encodeURIComponent(version) + "/activate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ notes: "Activated from dashboard" }) }); await renderRulesets(); }
          catch (error) { result.textContent = error.message; button.disabled = false; }
        };
      });
      main.querySelector("[data-ruleset-copy-active]").onclick = async function () {
        var active = rulesets.find(function (ruleset) { return Number(ruleset.active) === 1; });
        if (!active) { result.textContent = "active rulesetがありません。"; return; }
        var detail = await api("/api/admin/aeo/rulesets/" + active.version);
        main.querySelector("[data-ruleset-definition]").value = JSON.stringify(JSON.parse(detail.ruleset.definition_json), null, 2);
        result.textContent = "v" + active.version + " の定義を読み込みました。";
      };
      main.querySelector("[data-ruleset-create]").onclick = async function () {
        try {
          var definition = JSON.parse(main.querySelector("[data-ruleset-definition]").value);
          var notes = main.querySelector("[data-ruleset-notes]").value;
          var created = await api("/api/admin/aeo/rulesets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ definition_json: definition, notes: notes }) });
          alert("v" + created.ruleset.version + " をcandidateとして作成しました。");
          await renderRulesets();
        } catch (error) { result.textContent = error.message; }
      };
    } catch (error) {
      main.querySelector("[data-ruleset-rows]").innerHTML = '<tr><td colspan="6">' + esc(error.message) + '</td></tr>';
    }
  }
})();
