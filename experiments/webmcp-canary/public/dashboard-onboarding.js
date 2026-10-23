/*
 * Nurevo onboarding: which site, then the setup that fits it, then done.
 *
 * It used to be one road: every new site was posted as install_type "wp" with
 * "enter your WordPress URL", so a Wix shop or a store with no website at all
 * was told to install a WordPress plugin. The first step now asks, and each
 * answer maps to the install type the server already knows:
 *   WordPress      -> wp      (plugin + pairing code, then wait for the pairing)
 *   Other website  -> static  (JSON-LD, llms.txt and robots lines to paste)
 *   No website yet -> hosted  (a Nurevo-hosted page to list on Google/Instagram)
 *
 * Strings come from the dashboard dictionary (t() in dashboard.html), so the
 * wizard speaks the same eight languages as the page around it.
 */
(function () {
  "use strict";
  var POLL_MS = 2000;
  var POLL_MAX = 150; // 150 x 2 s = 5 minutes
  var pollTimer = null;
  var activeModal = null;
  var closeActive = null;

  function tr(key) { return typeof t === "function" ? t(key) : key; }
  function errMsg(error) {
    var code = error && error.message;
    return typeof window.nrvErrText === "function" ? window.nrvErrText(code, error && error.body) : String(code || "");
  }
  function currentLang() { try { return lang; } catch (_) { return "ja"; } }
  function json(method, body) {
    var init = { method: method, headers: { "content-type": "application/json" } };
    if (body) init.body = JSON.stringify(body);
    return init;
  }
  function syncRoleNavigation() {
    var partnerNav = document.querySelector('.nav[data-view="partner"]');
    if (partnerNav) { partnerNav.hidden = false; partnerNav.style.display = ""; }
  }
  function stopPoll() { if (pollTimer) clearTimeout(pollTimer); pollTimer = null; }
  function close() {
    stopPoll();
    if (closeActive) { var c = closeActive; closeActive = null; c(); }
    else if (activeModal) activeModal.remove();
    activeModal = null;
  }
  // One dialog for the whole wizard: each step replaces its content, so focus
  // handling and Escape are set up once and focus returns to the button that
  // opened it.
  function modal(html) {
    stopPoll();
    if (!activeModal) {
      activeModal = document.createElement("div");
      activeModal.className = "modal nrv-onboard";
      activeModal.innerHTML = '<div class="nrv-onboard-box" role="dialog" aria-modal="true" aria-labelledby="nrv-ob-title"></div>';
      document.body.appendChild(activeModal);
      closeActive = typeof window.nrvA11yModal === "function"
        ? window.nrvA11yModal(activeModal, function () { stopPoll(); activeModal = null; closeActive = null; })
        : null;
    }
    var box = activeModal.querySelector(".nrv-onboard-box");
    box.innerHTML = html;
    setTimeout(function () {
      var target = box.querySelector("[data-autofocus]") || box.querySelector("input:not([readonly]),button");
      if (target && typeof target.focus === "function") target.focus();
    }, 0);
    Array.prototype.forEach.call(box.querySelectorAll("[data-close]") || [], function (button) { button.onclick = close; });
    return box;
  }
  function steps(active) {
    return '<ol class="nrv-onboard-steps">' + [tr("obStepType"), tr("obStepSetup"), tr("obStepDone")].map(function (name, i) {
      return '<li class="' + (i + 1 <= active ? "is-active" : "") + '"' + (i + 1 === active ? ' aria-current="step"' : "") + '><b>' + (i + 1) + '</b><span>' + esc(name) + '</span></li>';
    }).join("") + "</ol>";
  }
  function openSite(siteId) {
    close();
    view = "site:" + siteId;
    Promise.resolve().then(function () { return load(); }).catch(function () {});
  }

  /* Step 1: which site. */
  var TYPES = [["wp", "obWp", "obWpHint"], ["static", "obStatic", "obStaticHint"], ["hosted", "obHosted", "obHostedHint"]];
  function start() {
    var box = modal(steps(1) + '<h2 id="nrv-ob-title">' + esc(tr("addSite")) + '</h2><fieldset class="nrv-ob-types"><legend>' + esc(tr("obType")) + '</legend>'
      + TYPES.map(function (item, i) {
        return '<button type="button" class="nrv-ob-type" data-type="' + item[0] + '"' + (i === 0 ? " data-autofocus" : "") + '><b>' + esc(tr(item[1])) + '</b><small>' + esc(tr(item[2])) + '</small></button>';
      }).join("")
      + '</fieldset><p><button type="button" class="btn" data-close>' + esc(tr("cancel")) + '</button></p>');
    Array.prototype.forEach.call(box.querySelectorAll("[data-type]"), function (button) {
      button.onclick = function () { setup(button.getAttribute("data-type")); };
    });
  }

  /* Step 2: the address (or, with no website, the store name). */
  function setup(type) {
    var hosted = type === "hosted";
    var lead = hosted ? tr("obHostedLead") : type === "static" ? tr("obStaticLead") : tr("obWpLead");
    var field = hosted
      ? '<div class="field"><label for="nrv-ob-name">' + esc(tr("obNameLabel")) + '</label><input class="input" id="nrv-ob-name" name="name" type="text" autocomplete="organization" required maxlength="120"></div>'
      : '<div class="field"><label for="nrv-ob-url">' + esc(tr("obUrlLabel")) + '</label><input class="input" id="nrv-ob-url" name="url" type="text" inputmode="url" autocomplete="url" autocapitalize="off" spellcheck="false" required placeholder="example.com" aria-describedby="nrv-ob-url-help"><small class="notice" id="nrv-ob-url-help">' + esc(tr("obUrlHelp")) + '</small></div>';
    var title = hosted ? tr("obHosted") : type === "static" ? tr("obStatic") : tr("obWp");
    var box = modal(steps(2) + '<h2 id="nrv-ob-title">' + esc(title) + '</h2><p class="notice">' + esc(lead) + '</p><form id="nrv-onboard-url" novalidate>' + field
      + '<p class="error" id="nrv-onboard-error" role="alert"></p><p><button type="button" class="btn" data-back>' + esc(tr("obBack")) + '</button> <button type="submit" class="btn primary">' + esc(tr("obNext")) + '</button></p></form>');
    box.querySelector("[data-back]").onclick = start;
    var form = box.querySelector("form");
    form.onsubmit = async function (event) {
      event.preventDefault();
      var error = box.querySelector("#nrv-onboard-error");
      var button = form.querySelector("button[type=submit]");
      var payload = { install_type: type };
      if (hosted) {
        var name = String(form.querySelector("#nrv-ob-name").value || "").trim();
        if (!name) { error.textContent = tr("obNameLabel"); return; }
        payload.name = name;
      } else {
        var url = normalizeSiteUrl(form.querySelector("#nrv-ob-url").value);
        if (!url) { error.textContent = tr("err_url"); return; }
        payload.url = url;
      }
      error.textContent = "";
      button.disabled = true; button.textContent = tr("obWorking");
      try {
        var created = await api("/api/sites", json("POST", payload));
        if (type === "wp") {
          var issued = await api("/api/sites/" + encodeURIComponent(created.id) + "/pairing-code", json("POST"));
          connectStep(created.id, issued.pairing_code, payload.url);
        } else if (type === "static") {
          await staticStep(created);
        } else {
          hostedStep(created);
        }
        Promise.resolve().then(function () { return load(); }).catch(function () {});
      } catch (caught) {
        error.textContent = errMsg(caught);
        button.disabled = false; button.textContent = tr("obNext");
        // The address is already one of this account's sites: go there instead.
        var existing = caught && caught.message === "duplicate_site" && caught.body && caught.body.site_id;
        if (existing && /^[a-z0-9]{1,64}$/i.test(String(existing))) {
          var jump = document.createElement("button");
          jump.type = "button"; jump.className = "btn"; jump.style.marginLeft = "8px";
          jump.textContent = tr("openExisting");
          jump.onclick = function () { openSite(String(existing)); };
          error.appendChild(jump);
        }
      }
    };
  }

  /* WordPress: plugin, pairing code, then wait for the plugin to pair. */
  function waitHtml() {
    return '<span class="nrv-spinner" aria-hidden="true"></span><div><b>' + esc(tr("obWaiting")) + '</b><small>' + esc(tr("obWaitingHint")) + '</small></div>';
  }
  // The help image is a screenshot of the Japanese plugin screen, so only a
  // Japanese reader sees it; everyone else gets the same place in words, with
  // the menu and field names their plugin translation shows.
  function pasteWhereHtml() {
    if (currentLang() === "ja") return '<figure><img src="/assets/onboarding/wp-pairing-code.png" alt="' + esc(tr("obImgAlt")) + '"><figcaption>' + esc(tr("obImgCap")) + '</figcaption></figure>';
    return '<p class="nrv-paste-where">' + esc(tr("obPasteWhere")) + '</p>';
  }
  function connectStep(siteId, code, url) {
    var box = modal(steps(2) + '<h2 id="nrv-ob-title">' + esc(tr("obPairTitle")) + '</h2><div class="nrv-code"><span>' + esc(tr("obCodeLabel")) + '</span><code>' + esc(code) + '</code><button type="button" class="btn" data-copy>' + esc(tr("copy")) + '</button></div>'
      + '<ol class="nrv-instructions"><li><a href="https://wordpress.org/plugins/nurevo-webmcp/" target="_blank" rel="noopener">' + esc(tr("obI1")) + ' ↗</a><br><small>' + esc(tr("obI1b")) + '</small></li><li>' + tr("obI2") + '</li><li>' + tr("obI3") + '</li></ol>'
      + pasteWhereHtml()
      + '<div class="nrv-wait" role="status" aria-live="polite">' + waitHtml() + '</div><p><button type="button" class="btn" data-close>' + esc(tr("obLater")) + '</button></p>');
    box.querySelector("[data-copy]").onclick = function () {
      var button = this;
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(function () { button.textContent = tr("copied"); }, function () {});
    };
    poll(siteId, 0, url);
  }
  async function poll(siteId, attempts, url) {
    if (!activeModal) return;
    if (attempts >= POLL_MAX) { timeoutState(siteId, url); return; }
    try {
      var body = await api("/api/sites");
      var site = (body.sites || []).find(function (item) { return item.id === siteId; });
      if (site && site.bound) { await connected(site); return; }
    } catch (_) {}
    if (!activeModal) return;
    pollTimer = setTimeout(function () { poll(siteId, attempts + 1, url); }, POLL_MS);
  }
  // Five minutes without a pairing is almost always one of three things; say
  // which, instead of spinning forever.
  function timeoutState(siteId, url) {
    stopPoll();
    if (!activeModal) return;
    var wait = activeModal.querySelector(".nrv-wait");
    if (!wait) return;
    wait.className = "nrv-wait nrv-timeout";
    wait.setAttribute("role", "alert");
    var shown = String(url || "").replace(/^https?:\/\//i, "").replace(/\/$/, "") || "—";
    wait.innerHTML = '<div><b>' + esc(tr("obTimeoutTitle")) + '</b><p>' + esc(tr("obTimeoutLead")) + '</p><ul class="nrv-timeout-list"><li>' + esc(tr("obCheck1")) + '</li><li>' + esc(tr("obCheck2")) + '</li><li>' + esc(tr("obCheck3").replace("{url}", shown)) + '</li></ul>'
      + '<p><button type="button" class="btn primary" data-reissue>' + esc(tr("obReissue")) + '</button> <button type="button" class="btn" data-keepwait>' + esc(tr("obKeepWaiting")) + '</button></p></div>';
    wait.querySelector("[data-keepwait]").onclick = function () {
      wait.className = "nrv-wait"; wait.setAttribute("role", "status"); wait.innerHTML = waitHtml();
      poll(siteId, 0, url);
    };
    wait.querySelector("[data-reissue]").onclick = async function () {
      var button = this; button.disabled = true;
      try {
        var issued = await api("/api/sites/" + encodeURIComponent(siteId) + "/pairing-code", json("POST"));
        connectStep(siteId, issued.pairing_code, url);
      } catch (caught) { button.disabled = false; button.textContent = errMsg(caught); }
    };
  }
  async function connected(site) {
    stopPoll();
    // Read profile + catalogue immediately and start the first stored diagnosis;
    // the plugin pushes both during the pairing-save request.
    await Promise.allSettled([
      api("/api/sites/" + encodeURIComponent(site.id)),
      api("/api/sites/" + encodeURIComponent(site.id) + "/aeo-score", json("POST"))
    ]);
    try { await load(); } catch (_) {}
    var box = modal(steps(3) + '<div class="nrv-connected"><span aria-hidden="true">✓</span><h2 id="nrv-ob-title">' + esc(tr("obConnected")) + '</h2><p>' + esc(site.domain_key || site.url || "") + '</p><p class="notice">' + esc(tr("obConnectedLead")) + '</p><button type="button" class="btn primary" data-finish>' + esc(tr("obSeeSite")) + '</button></div>');
    box.querySelector("[data-finish]").onclick = function () { openSite(site.id); };
  }

  /* Other website: the three things to paste, the same blocks as the site page. */
  async function staticStep(created) {
    var snippet = null;
    try { snippet = await api("/api/sites/" + encodeURIComponent(created.id) + "/static-snippet?lang=" + encodeURIComponent(currentLang())); } catch (_) {}
    var site = { id: created.id, key: created.siteKey || "" };
    var blocks = typeof window.__nrvStaticSnippetHtml === "function" ? window.__nrvStaticSnippetHtml(snippet, site, currentLang()) : "";
    var box = modal(steps(3) + '<h2 id="nrv-ob-title">' + esc(tr("obStaticTitle")) + '</h2>' + blocks
      + '<p class="notice" role="status" data-copied></p><p><button type="button" class="btn primary" data-finish>' + esc(tr("obSeeSite")) + '</button></p>');
    var fields = { jsonld: "jsonld_html", llms: "llms_txt", robots: "robots_txt_lines" };
    var status = box.querySelector("[data-copied]");
    var copy = function (text) { if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { status.textContent = tr("copied"); }, function () {}); };
    Array.prototype.forEach.call(box.querySelectorAll(".nrv-static-copy"), function (button) {
      button.onclick = function () { copy((snippet || {})[fields[button.getAttribute("data-field")]] || ""); };
    });
    var tag = box.querySelector(".nrv-snippet-copy");
    if (tag) tag.onclick = function () { var area = box.querySelector(".nrv-snippet"); copy(area ? area.value : ""); };
    box.querySelector("[data-finish]").onclick = function () { openSite(created.id); };
  }

  /* No website yet: the hosted page that already exists for hosted sites. */
  function hostedStep(created) {
    var url = created.hostedUrl ? "https://nurevo.jp" + created.hostedUrl : "";
    var box = modal(steps(3) + '<div class="nrv-connected"><span aria-hidden="true">✓</span><h2 id="nrv-ob-title">' + esc(tr("obHostedTitle")) + '</h2></div>'
      + (url ? '<div class="toolbar"><input class="input" readonly aria-label="' + esc(tr("hosted")) + '" value="' + esc(url) + '" style="flex:1"><button type="button" class="btn" data-copy>' + esc(tr("copy")) + '</button></div>' : '')
      + '<p class="notice">' + esc(tr("obHostedPaste")) + '</p><p><button type="button" class="btn primary" data-finish>' + esc(tr("obSeeSite")) + '</button></p>');
    var copyButton = box.querySelector("[data-copy]");
    if (copyButton) copyButton.onclick = function () {
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { copyButton.textContent = tr("copied"); }, function () {});
    };
    box.querySelector("[data-finish]").onclick = function () { openSite(created.id); };
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
    // Issuing a code from the site page opens the same wait-and-check screen.
    document.querySelectorAll("#issuecode,#issuecodetop").forEach(function (button) {
      if (button.dataset.onboardBound) return; button.dataset.onboardBound = "1";
      button.addEventListener("click", async function (event) {
        event.preventDefault(); event.stopImmediatePropagation();
        var siteId = view.startsWith("site:") ? view.slice(5) : ""; if (!siteId) return;
        var site = (typeof sites !== "undefined" && sites || []).find(function (s) { return s.id === siteId; }) || {};
        button.disabled = true;
        try { var issued = await api("/api/sites/" + encodeURIComponent(siteId) + "/pairing-code", json("POST")); connectStep(siteId, issued.pairing_code, site.url || ""); }
        catch (caught) { button.disabled = false; if (typeof window.nrvToast === "function") window.nrvToast(errMsg(caught)); }
      }, true);
    });
  }
  window.nrvStartOnboarding = start;
  // For the tests: the steps without a browser.
  window.__nrvOnboarding = { start: start, setup: setup, connectStep: connectStep, timeoutState: timeoutState, staticStep: staticStep, hostedStep: hostedStep, poll: poll, POLL_MAX: POLL_MAX, TYPES: TYPES };

  var style = document.createElement("style");
  style.textContent = '.nrv-onboard-box{width:min(720px,100%);max-height:94vh;overflow:auto}.nrv-onboard-steps{display:grid;grid-template-columns:repeat(3,1fr);list-style:none;padding:0;margin:0 0 24px}.nrv-onboard-steps li{display:flex;align-items:center;gap:7px;color:#6b7280;border-bottom:3px solid #e7e9f1;padding:0 0 10px}.nrv-onboard-steps li.is-active{color:#4b31c6;border-color:#6f4df6}.nrv-onboard-steps b{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;background:#eef0f5}.nrv-onboard-steps .is-active b{background:#6f4df6;color:#fff}.nrv-ob-types{border:0;padding:0;margin:0 0 16px;display:grid;gap:10px}.nrv-ob-types legend{font-weight:800;margin-bottom:10px;padding:0}.nrv-ob-type{display:grid;gap:3px;text-align:left;border:2px solid #e7e2f1;border-radius:12px;background:#fff;padding:14px 16px;cursor:pointer;font:inherit}.nrv-ob-type:hover,.nrv-ob-type:focus-visible{border-color:#6f4df6;background:#faf8ff}.nrv-ob-type b{font-size:15px}.nrv-ob-type small{color:#5b6472}.nrv-onboard .field small{font-size:12px}.nrv-code{display:grid;grid-template-columns:1fr auto;gap:8px;background:#f2eeff;border-radius:12px;padding:14px;margin:16px 0}.nrv-code span{grid-column:1/-1;font-size:11px;color:#5b6472}.nrv-code code{font-size:19px;font-weight:800;align-self:center}.nrv-instructions{padding-left:22px;display:grid;gap:8px}.nrv-instructions small{color:#5b6472}.nrv-onboard figure{margin:16px 0}.nrv-onboard figure img{width:100%;border:1px solid #dcdfea;border-radius:9px}.nrv-onboard .nrv-paste-where{margin:16px 0;padding:10px 12px;border:1px solid #dcdfea;border-radius:9px;background:#f7f8fb;color:#3f4654;font-size:13px;line-height:1.6}.nrv-onboard figcaption{text-align:center;color:#5b6472;font-size:12px}.nrv-wait{display:flex;gap:12px;align-items:center;background:#fff7d6;border:1px solid #f0c75e;border-radius:10px;padding:13px}.nrv-wait small{display:block;color:#6d5000}.nrv-timeout{align-items:flex-start;background:#fff1f1;border-color:#f1c1c1}.nrv-timeout p{margin:4px 0 8px}.nrv-timeout-list{margin:0 0 6px;padding-left:20px;display:grid;gap:4px}.nrv-spinner{width:22px;height:22px;border:3px solid #ead9a3;border-top-color:#6f4df6;border-radius:50%;animation:nrvspin .8s linear infinite;flex:none}.nrv-connected{text-align:center;padding:26px}.nrv-connected>span{display:grid;place-items:center;margin:auto;width:60px;height:60px;border-radius:50%;background:#e5f6ec;color:#12a150;font-size:34px;font-weight:900}@keyframes nrvspin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.nrv-spinner{animation:none}}.nrv-empty-start{padding:46px 24px;text-align:center}.nrv-empty-start ol{display:flex;justify-content:center;flex-wrap:wrap;gap:12px 28px;list-style:none;padding:12px 0}.nrv-empty-start li{font-weight:700}.nrv-empty-start b{color:#6f4df6;margin-right:5px}';
  document.head.appendChild(style);
  new MutationObserver(enhance).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", enhance); setTimeout(enhance, 0);
})();
