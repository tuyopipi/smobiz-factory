/* Nurevo agency-first onboarding: one URL-to-connected flow. */
(function () {
  "use strict";
  var pollTimer = null;
  var activeModal = null;
  function allowedBilling() { return !!(me && ["referrer", "agency"].includes(me.role)); }
  function syncRoleNavigation() {
    var billingNav = document.querySelector('.nav[data-view="billing"]');
    if (billingNav) {
      billingNav.hidden = !allowedBilling();
      billingNav.style.display = allowedBilling() ? "" : "none";
    }
  }
  function close() { if (pollTimer) clearTimeout(pollTimer); pollTimer = null; if (activeModal) activeModal.remove(); activeModal = null; }
  function modal(html) {
    close(); activeModal = document.createElement("div"); activeModal.className = "modal nrv-onboard";
    activeModal.innerHTML = '<div class="nrv-onboard-box">' + html + '</div>';
    document.body.appendChild(activeModal); return activeModal;
  }
  function steps(active) {
    return '<ol class="nrv-onboard-steps">' + ["URL入力", "プラグイン接続", "接続完了"].map(function (name, i) {
      return '<li class="' + (i + 1 <= active ? "is-active" : "") + '"><b>' + (i + 1) + '</b><span>' + name + '</span></li>';
    }).join("") + "</ol>";
  }
  function start() {
    var root = modal(steps(1) + '<h2>クライアントのサイトを追加</h2><p class="notice">まずWordPressサイトのURLを入力してください。</p><form id="nrv-onboard-url"><div class="field"><label>クライアントのサイトURL</label><input class="input" name="url" type="url" required placeholder="https://example.com"></div><p class="error" id="nrv-onboard-error"></p><p><button type="button" class="btn" data-close>キャンセル</button> <button class="btn primary">次へ</button></p></form>');
    root.querySelector("[data-close]").onclick = close;
    root.querySelector("form").onsubmit = async function (event) {
      event.preventDefault(); var button = event.submitter; button.disabled = true;
      try {
        var created = await api("/api/sites", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ install_type: "wp", url: new FormData(event.target).get("url") }) });
        var issued = await api("/api/sites/" + encodeURIComponent(created.id) + "/pairing-code", { method: "POST", headers: { "content-type": "application/json" } });
        connectStep(created.id, issued.pairing_code);
      } catch (error) { root.querySelector("#nrv-onboard-error").textContent = error.message; button.disabled = false; }
    };
  }
  function connectStep(siteId, code) {
    var root = modal(steps(2) + '<h2>プラグインを接続</h2><div class="nrv-code"><span>ペアリングコード</span><code>' + esc(code) + '</code><button class="btn" data-copy>コピー</button></div><ol class="nrv-instructions"><li><a href="https://wordpress.org/plugins/nurevo-webmcp/" target="_blank" rel="noopener">Nurevo AEOプラグインを入れる ↗</a></li><li>WordPress管理画面で <b>Nurevo AEO → 設定</b> を開く</li><li>下の「ペアリングコード」欄へ貼り付けて、<b>変更を保存</b></li></ol><figure><img src="/assets/onboarding/wp-pairing-code.png" alt="WordPressのNurevo AEO設定にあるペアリングコード入力欄"><figcaption>ここに貼り付けます</figcaption></figure><div class="nrv-wait"><span class="nrv-spinner" aria-hidden="true"></span><div><b>接続待ち…</b><small>この画面は自動で切り替わります</small></div></div><p><button type="button" class="btn" data-close>あとで続ける</button></p>');
    root.querySelector("[data-copy]").onclick = function () { navigator.clipboard && navigator.clipboard.writeText(code); this.textContent = "コピー済み"; };
    root.querySelector("[data-close]").onclick = close;
    poll(siteId, 0);
  }
  async function poll(siteId, attempts) {
    if (!activeModal || attempts > 150) return;
    try {
      var body = await api("/api/sites");
      var site = (body.sites || []).find(function (item) { return item.id === siteId; });
      if (site && site.bound) { await connected(site); return; }
    } catch (_) {}
    pollTimer = setTimeout(function () { poll(siteId, attempts + 1); }, 2000);
  }
  async function connected(site) {
    if (pollTimer) clearTimeout(pollTimer); pollTimer = null;
    // Read profile + catalogue immediately and start the first stored diagnosis;
    // the plugin pushes both during the pairing-save request.
    await Promise.allSettled([
      api("/api/sites/" + encodeURIComponent(site.id)),
      api("/api/sites/" + encodeURIComponent(site.id) + "/aeo-score", { method: "POST", headers: { "content-type": "application/json" } })
    ]);
    try { await load(); } catch (_) {}
    var root = modal(steps(3) + '<div class="nrv-connected"><span>✓</span><h2>接続済み</h2><p>' + esc(site.domain_key || site.url || "") + '</p><p class="notice">店舗情報・商品・FAQを反映し、初回診断を開始しました。</p><button class="btn primary" data-finish>サイト詳細を見る</button></div>');
    root.querySelector("[data-finish]").onclick = async function () { close(); view = "site:" + site.id; await load(); };
  }
  function consolidateConnectionPanel() {
    var panel = document.querySelector("#wpconn"); if (!panel) return;
    document.querySelectorAll(".card.panel h2").forEach(function (heading) {
      if (heading.textContent.trim() !== t("binding")) return;
      var legacy = heading.closest(".card"); if (!legacy || legacy === panel) return;
      legacy.querySelectorAll("button").forEach(function (button) { panel.appendChild(button); });
      legacy.remove();
    });
  }
  function enhance() {
    syncRoleNavigation(); consolidateConnectionPanel();
    document.querySelectorAll("#add,[data-onboard]").forEach(function (button) {
      if (button.dataset.onboardBound) return; button.dataset.onboardBound = "1";
      button.addEventListener("click", function (event) { event.preventDefault(); event.stopImmediatePropagation(); start(); }, true);
    });
    document.querySelectorAll("#issuecode,#issuecodetop").forEach(function (button) {
      if (button.dataset.onboardBound) return; button.dataset.onboardBound = "1";
      button.addEventListener("click", async function (event) {
        event.preventDefault(); event.stopImmediatePropagation();
        var siteId = view.startsWith("site:") ? view.slice(5) : ""; if (!siteId) return;
        button.disabled = true;
        try { var issued = await api("/api/sites/" + encodeURIComponent(siteId) + "/pairing-code", { method: "POST", headers: { "content-type": "application/json" } }); connectStep(siteId, issued.pairing_code); }
        catch (_) { button.disabled = false; }
      }, true);
    });
  }
  var style = document.createElement("style");
  style.textContent = '.nrv-onboard-box{width:min(720px,100%);max-height:94vh;overflow:auto}.nrv-onboard-steps{display:grid;grid-template-columns:repeat(3,1fr);list-style:none;padding:0;margin:0 0 24px}.nrv-onboard-steps li{display:flex;align-items:center;gap:7px;color:#8c94a4;border-bottom:3px solid #e7e9f1;padding:0 0 10px}.nrv-onboard-steps li.is-active{color:#4b31c6;border-color:#6f4df6}.nrv-onboard-steps b{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;background:#eef0f5}.nrv-onboard-steps .is-active b{background:#6f4df6;color:#fff}.nrv-code{display:grid;grid-template-columns:1fr auto;gap:8px;background:#f2eeff;border-radius:12px;padding:14px;margin:16px 0}.nrv-code span{grid-column:1/-1;font-size:11px;color:#5b6472}.nrv-code code{font-size:19px;font-weight:800;align-self:center}.nrv-instructions{padding-left:22px;display:grid;gap:8px}.nrv-onboard figure{margin:16px 0}.nrv-onboard figure img{width:100%;border:1px solid #dcdfea;border-radius:9px}.nrv-onboard figcaption{text-align:center;color:#5b6472;font-size:12px}.nrv-wait{display:flex;gap:12px;align-items:center;background:#fff7d6;border:1px solid #f0c75e;border-radius:10px;padding:13px}.nrv-wait small{display:block;color:#6d5000}.nrv-spinner{width:22px;height:22px;border:3px solid #ead9a3;border-top-color:#6f4df6;border-radius:50%;animation:nrvspin .8s linear infinite}.nrv-connected{text-align:center;padding:26px}.nrv-connected>span{display:grid;place-items:center;margin:auto;width:60px;height:60px;border-radius:50%;background:#e5f6ec;color:#12a150;font-size:34px;font-weight:900}@keyframes nrvspin{to{transform:rotate(360deg)}}.nrv-empty-start{padding:46px 24px;text-align:center}.nrv-empty-start ol{display:flex;justify-content:center;gap:28px;list-style:none;padding:12px 0}.nrv-empty-start li{font-weight:700}.nrv-empty-start b{color:#6f4df6;margin-right:5px}';
  document.head.appendChild(style);
  new MutationObserver(enhance).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", enhance); setTimeout(enhance, 0);
})();
