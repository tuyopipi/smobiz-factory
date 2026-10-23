(function () {
  "use strict";
  function tr(key) { return typeof t === "function" ? t(key) : key; }
  function errText(code) { return typeof window.nrvErrText === "function" ? window.nrvErrText(code) : String(code || ""); }
  function currentLang() { try { return lang; } catch (_) { return localStorage.getItem("nrv-dash-lang") || document.documentElement.lang || "ja"; } }
  // The account language is read by the dashboard itself (pickLang in
  // dashboard.html), after ?lang and the choice saved in this browser. This
  // used to overwrite the saved choice with it on every page load.
  function addAccount() {
    var top = document.querySelector(".top");
    if (!top || top.querySelector(".account")) return;
    var known = window.nrvMember ? Promise.resolve(window.nrvMember) : fetch("/api/me", { credentials: "include", cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("unauthorized");
        return response.json();
      });
    known.then(function (member) {
        window.nrvMember = member;
        if (top.querySelector(".account") || !top.isConnected) return;
        var account = document.createElement("span");
        account.className = "account";
        account.style.cssText = "color:#5b6472;font-size:13px;display:flex;gap:10px;align-items:center";
        var email = document.createElement("span");
        email.textContent = member.email || "";
        var logout = document.createElement("button");
        logout.className = "btn";
        logout.type = "button";
        logout.setAttribute("data-k", "logout");
        logout.textContent = tr("logout");
        logout.addEventListener("click", function () {
          fetch("/api/auth/logout", { method: "POST", credentials: "include" })
            .finally(function () { location.href = "https://nurevo.jp/"; });
        });
        account.append(email, logout);
        top.append(account);
      })
      .catch(function () {});
  }
  // Where to come back to after the emailed link: this dashboard address,
  // including ?plan= from the pricing buttons, so the choice survives sign-in.
  function returnPath() {
    try {
      var path = location.pathname + location.search;
      return /^\/dashboard(?:[/?#]|$)/.test(path) ? path : "/dashboard";
    } catch (_) { return "/dashboard"; }
  }
  function planIntent() {
    try { var p = new URLSearchParams(location.search).get("plan"); return p === "standard" || p === "pro" ? p : null; } catch (_) { return null; }
  }
  document.addEventListener("submit", function (event) {
    if (!event.target || event.target.id !== "auth") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    var form = event.target;
    var message = form.querySelector("#msg");
    var email = form.querySelector("input[type=email]");
    var button = form.querySelector("button");
    var body = { email: email ? email.value : "", locale: currentLang(), next: returnPath() };
    var plan = planIntent(); if (plan) body.plan = plan;
    if (button) button.disabled = true;
    fetch("/api/auth/request", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    })
      .catch(function () { throw new Error("network"); })
      .then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (result) {
          if (!response.ok) throw new Error(result.error || result.code || (response.status >= 500 ? "server" : "HTTP " + response.status));
          return result;
        });
      })
      .then(function () { if (message) { message.className = "notice success"; message.textContent = tr("authSent"); } })
      .catch(function (error) { if (message) { message.className = "notice error"; message.textContent = errText(error.message); } })
      .finally(function () { if (button) button.disabled = false; });
  }, true);
  document.addEventListener("change", function (event) {
    if (event.target.id !== "lang") return;
    var logout = document.querySelector('.account [data-k="logout"]');
    if (logout) setTimeout(function () { logout.textContent = tr("logout"); }, 0);
    if (!window.nrvMember) return;
    var match = document.cookie.match(/(?:^|;\s*)nrv_csrf=([^;]+)/);
    fetch("/api/me/language", { method: "POST", credentials: "include",
      headers: { "content-type": "application/json", "x-csrf-token": match ? decodeURIComponent(match[1]) : "" },
      body: JSON.stringify({ language: event.target.value === "tw" ? "zh-tw" : event.target.value })
    }).then(function (response) { if (!response.ok) console.warn("Could not save account language", response.status); })
      .catch(function () { console.warn("Could not save account language"); });
  });
  var observer = new MutationObserver(addAccount);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  addAccount();
  setTimeout(addAccount, 100);
  setTimeout(addAccount, 500);
})();
