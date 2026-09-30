(function () {
  "use strict";
  var selected = null;
  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    if (text) node.textContent = text;
    return node;
  }
  function open() {
    if (document.querySelector(".places-modal")) return;
    selected = null;
    var modal = el("div", { class: "modal places-modal" });
    var panel = el("div", {});
    panel.innerHTML = '<h2>店舗を登録</h2><p class="notice">店名＋エリアで検索（例: ○○美容室 渋谷）。Googleマップの情報から自動取得します。</p><form id="places-search"><label>店名＋エリア<input class="input" name="q" required minlength="2" placeholder="例：○○美容室 渋谷"><small class="field-help">候補を選ぶと店舗情報が自動入力されます。</small></label><button class="btn primary">候補を検索</button></form><div id="places-results"></div><form id="places-register" hidden><p class="notice">選択した店舗情報</p><p><b id="places-name"></b><br><span id="places-info"></span></p><p id="places-proposal" class="notice"></p><p class="field-help">業種・住所・電話・営業時間・価格帯：Googleマップから自動取得</p><fieldset class="install-options"><legend>導入タイプ（おすすめを表示します。変更可能です）</legend><label class="option-card"><span><input type="radio" name="install_type" value="hosted" checked> <b>ホストページ</b></span><small>自分のサイトが無い店。URL不要。Nurevoが nurevo.jp/s/slug にページを作成。</small></label><label class="option-card"><span><input type="radio" name="install_type" value="wp"> <b>WordPressプラグイン</b></span><small>WordPressサイトがある店。URL必要。サーバー側でschemaを出力。</small></label><label class="option-card"><span><input type="radio" name="install_type" value="static"> <b>静的JSON-LD貼り付け</b></span><small>自分のサイトの&lt;head&gt;に完成済みJSON-LDを貼り付け。これは自動更新されず、来訪計測もできません。常に最新化・来訪計測するにはプラグインまたはAPI連携をご利用ください。</small></label></fieldset><label>URL <small class="field-help">店舗が持つ自分のサイトのアドレス。ホストの場合は不要</small><input class="input" name="url" type="url" placeholder="https://example.jp"><small id="places-url-error" class="validation-error"></small></label><button class="btn primary">この店舗を登録</button><span id="places-status" class="notice"></span></form><button class="btn" id="places-close">キャンセル</button>';
    modal.append(panel); document.body.append(modal);
    panel.querySelector("#places-close").onclick = function () { modal.remove(); };
    panel.querySelector("#places-search").onsubmit = async function (event) {
      event.preventDefault(); var result = panel.querySelector("#places-results"); result.textContent = "検索中…";
      try {
        var q = String(new FormData(event.target).get("q") || "").trim(); var response = await fetch("/api/places/search?q=" + encodeURIComponent(q), { credentials: "include" }); var body = await response.json();
        if (!response.ok) throw new Error(body.message || body.error || "候補を取得できませんでした"); result.replaceChildren();
        (body.places || []).forEach(function (place) { var button = el("button", { type: "button", class: "btn", style: "display:block;width:100%;text-align:left;margin:8px 0", role: "option" }); button.textContent = (place.name || "店舗") + " — " + (place.type || "") + " / " + (place.address || ""); button.onclick = function () { selected = place; panel.querySelector("#places-name").textContent = place.name; panel.querySelector("#places-info").textContent = [place.type, place.address].filter(Boolean).join(" / "); var suggested = ["wp", "tag", "hosted"].includes(place.suggested_install_type) ? place.suggested_install_type : "hosted"; panel.querySelector("input[name=install_type][value=" + suggested + "]").checked = true; panel.querySelector("#places-proposal").textContent = "おすすめ: " + (suggested === "wp" ? "WordPress（WordPressの痕跡を検出）" : suggested === "tag" ? "タグ設置（サイトあり）" : "ホスト（サイトなし・SNS・判定不能）") + "。登録時にサーバーでも再判定します。"; panel.querySelector("#places-register").hidden = false; updateUrlField(); }; result.append(button); });
        if (!body.places?.length) result.textContent = "候補を取得できませんでした。検索語を変えて再試行してください。";
      } catch (error) { result.textContent = error.message; }
    };
    function updateUrlField() {
      var type = panel.querySelector("input[name=install_type]:checked")?.value;
      var input = panel.querySelector("input[name=url]");
      var label = input?.closest("label");
      if (!input || !label) return;
      var hosted = type === "hosted";
      label.hidden = hosted;
      input.disabled = hosted;
      input.required = !hosted;
    }
    panel.querySelectorAll("input[name=install_type]").forEach(function (input) { input.addEventListener("change", updateUrlField); });
    updateUrlField();
    panel.querySelector("#places-register").onsubmit = async function (event) {
      event.preventDefault(); var form = new FormData(event.target); var status = panel.querySelector("#places-status"); var url = String(form.get("url") || "").trim(); var installType = String(form.get("install_type") || ""); var urlError = panel.querySelector("#places-url-error"); urlError.textContent = "";
      if (!selected) { status.textContent = "Googleマップの候補を1件選択してください。"; return; }
      if (installType !== "hosted" && !url) { urlError.textContent = "ワードプレス／タグ設置では店舗サイトのURLが必要です。"; return; }
      if (url && !/^https?:\/\//i.test(url)) { urlError.textContent = "URLは https:// または http:// から入力してください。"; return; }
      status.textContent = "登録中…";
      try { var response = await fetch("/api/sites", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: selected.name, place_id: selected.id, install_type: installType, url: url }) }); var body = await response.json(); if (!response.ok) throw new Error(body.error || "登録に失敗しました"); var proposal = body.proposal; status.textContent = proposal ? "登録しました（おすすめ: " + (proposal.recommended_install_type === "wp" ? "WordPress" : proposal.recommended_install_type === "tag" ? "タグ設置" : "ホスト") + "）" : "登録しました"; setTimeout(function () { location.reload(); }, 800); } catch (error) { status.textContent = error.message; }
    };
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
  document.addEventListener("click", function (event) { if (event.target && event.target.id === "add") { event.preventDefault(); event.stopImmediatePropagation(); open(); } }, true);
  new MutationObserver(mountDeleteButtons).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(mountDeleteButtons, 0);
})();
