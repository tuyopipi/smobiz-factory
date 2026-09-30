(function () {
  "use strict";
  function addAccount() {
    var top = document.querySelector(".top");
    if (!top || top.querySelector(".account")) return;
    fetch("/api/me", { credentials: "include", cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("unauthorized");
        return response.json();
      })
      .then(function (member) {
        window.nrvMember = member;
        if (top.querySelector(".account")) return;
        var account = document.createElement("span");
        account.className = "account";
        var email = document.createElement("span");
        email.textContent = member.email || "";
        var logout = document.createElement("button");
        logout.className = "btn";
        logout.type = "button";
        logout.textContent = "Log out";
        logout.addEventListener("click", function () {
          fetch("/api/auth/logout", { method: "POST", credentials: "include" })
            .finally(function () { location.href = "https://nurevo.jp/"; });
        });
        account.append(email, logout);
        top.append(account);
      })
      .catch(function () {});
  }
  document.addEventListener("submit", function (event) {
    if (!event.target || event.target.id !== "auth") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    var form = event.target;
    var message = form.querySelector("#msg");
    var email = form.querySelector("input[type=email]");
    fetch("/api/auth/request", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email ? email.value : "" })
    })
      .then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (body) {
          if (!response.ok) throw new Error(body.error || "送信に失敗しました");
          return body;
        });
      })
      .then(function () { if (message) { message.className = "notice success"; message.textContent = "メールを送りました"; } })
      .catch(function (error) { if (message) { message.className = "notice error"; message.textContent = error.message; } });
  }, true);
  var observer = new MutationObserver(addAccount);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  addAccount();
  setTimeout(addAccount, 100);
  setTimeout(addAccount, 500);
})();
