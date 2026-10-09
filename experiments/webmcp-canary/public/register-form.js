/* Nurevo registration form behaviour, shared by /member-register and /partner.
 *
 * Both pages posted to /api/members/register with their own copy of the same
 * few lines, and both had the same three faults: the button stayed live while
 * the request was in flight, so an impatient second click sent a second
 * application; that second application came back as the bare code
 * "member_exists"; and success was a sentence that never said the registration
 * was done. One implementation, so the two pages cannot drift apart again.
 *
 * This file exists in nurevo-lp/public and webmcp-canary/public and the two
 * copies must stay byte-identical (scripts/test-register-form.mjs checks).
 */
(function (root) {
  "use strict";

  var LOGIN_URL = "/dashboard";

  // Every string a visitor can see. A language added here needs all the keys;
  // text() falls back to English, then Japanese, for one that is missing.
  var MESSAGES = {
    ja: {
      sending: "送信中…",
      done: "登録が完了しました。",
      next: "管理者の承認後、ログインページでメールアドレスを入力すると届くログインリンクからログインできます。",
      exists: "このメールアドレスは既に登録済みです。ログインしてください。",
      existsPending: "承認待ちの場合は、承認後にログインできます。",
      login: "ログインへ",
      rateLimited: "短時間に送信が集中しています。しばらく待ってからもう一度お試しください。",
      invalid: "メールアドレスと種別を確認してください。",
      invalidInvite: "招待コードが正しくないか、有効期限が切れています。",
      failed: "登録できませんでした。時間をおいてもう一度お試しください。"
    },
    en: {
      sending: "Sending…",
      done: "Your registration is complete.",
      next: "Once an administrator approves it, enter your email address on the login page and sign in with the link we send you.",
      exists: "This email address is already registered. Please log in.",
      existsPending: "If it is still awaiting approval, you can log in once it is approved.",
      login: "Go to login",
      rateLimited: "Too many attempts in a short time. Please wait a moment and try again.",
      invalid: "Please check the email address and the type.",
      invalidInvite: "The invite code is incorrect or has expired.",
      failed: "We could not complete the registration. Please try again later."
    },
    zh: {
      sending: "正在发送…",
      done: "注册已完成。",
      next: "管理员批准后，在登录页面输入您的邮箱地址，即可通过我们发送的登录链接登录。",
      exists: "该邮箱地址已注册。请登录。",
      existsPending: "如果仍在等待批准，批准后即可登录。",
      login: "前往登录",
      rateLimited: "短时间内提交次数过多。请稍候再试。",
      invalid: "请检查邮箱地址和类型。",
      invalidInvite: "邀请码不正确或已过期。",
      failed: "注册未能完成。请稍后再试。"
    },
    tw: {
      sending: "傳送中…",
      done: "註冊已完成。",
      next: "管理員核准後，在登入頁面輸入您的電子郵件地址，即可透過我們寄出的登入連結登入。",
      exists: "此電子郵件地址已註冊。請登入。",
      existsPending: "若仍在等待核准，核准後即可登入。",
      login: "前往登入",
      rateLimited: "短時間內送出次數過多。請稍候再試。",
      invalid: "請確認電子郵件地址與類型。",
      invalidInvite: "邀請碼不正確或已過期。",
      failed: "註冊未能完成。請稍後再試。"
    },
    ko: {
      sending: "전송 중…",
      done: "등록이 완료되었습니다.",
      next: "관리자 승인 후 로그인 페이지에서 이메일 주소를 입력하면 발송되는 로그인 링크로 로그인할 수 있습니다.",
      exists: "이 이메일 주소는 이미 등록되어 있습니다. 로그인해 주세요.",
      existsPending: "승인 대기 중인 경우 승인 후 로그인할 수 있습니다.",
      login: "로그인하기",
      rateLimited: "짧은 시간에 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
      invalid: "이메일 주소와 유형을 확인해 주세요.",
      invalidInvite: "초대 코드가 올바르지 않거나 만료되었습니다.",
      failed: "등록하지 못했습니다. 잠시 후 다시 시도해 주세요."
    },
    es: {
      sending: "Enviando…",
      done: "Tu registro se ha completado.",
      next: "Cuando un administrador lo apruebe, introduce tu correo en la página de inicio de sesión y entra con el enlace que te enviaremos.",
      exists: "Este correo electrónico ya está registrado. Inicia sesión.",
      existsPending: "Si aún está pendiente de aprobación, podrás iniciar sesión cuando se apruebe.",
      login: "Ir a iniciar sesión",
      rateLimited: "Demasiados intentos en poco tiempo. Espera un momento y vuelve a intentarlo.",
      invalid: "Revisa el correo electrónico y el tipo.",
      invalidInvite: "El código de invitación no es correcto o ha caducado.",
      failed: "No se pudo completar el registro. Inténtalo de nuevo más tarde."
    },
    fr: {
      sending: "Envoi en cours…",
      done: "Votre inscription est terminée.",
      next: "Une fois approuvée par un administrateur, saisissez votre adresse e-mail sur la page de connexion et connectez-vous avec le lien que nous vous enverrons.",
      exists: "Cette adresse e-mail est déjà enregistrée. Veuillez vous connecter.",
      existsPending: "Si elle est encore en attente d’approbation, vous pourrez vous connecter une fois approuvée.",
      login: "Aller à la connexion",
      rateLimited: "Trop de tentatives en peu de temps. Veuillez patienter un instant puis réessayer.",
      invalid: "Vérifiez l’adresse e-mail et le type.",
      invalidInvite: "Le code d’invitation est incorrect ou a expiré.",
      failed: "L’inscription n’a pas pu aboutir. Veuillez réessayer plus tard."
    },
    de: {
      sending: "Wird gesendet…",
      done: "Ihre Registrierung ist abgeschlossen.",
      next: "Sobald ein Administrator sie freigegeben hat, geben Sie Ihre E-Mail-Adresse auf der Anmeldeseite ein und melden sich mit dem Link an, den wir Ihnen senden.",
      exists: "Diese E-Mail-Adresse ist bereits registriert. Bitte melden Sie sich an.",
      existsPending: "Falls die Freigabe noch aussteht, können Sie sich danach anmelden.",
      login: "Zur Anmeldung",
      rateLimited: "Zu viele Versuche in kurzer Zeit. Bitte warten Sie einen Moment und versuchen Sie es erneut.",
      invalid: "Bitte prüfen Sie E-Mail-Adresse und Typ.",
      invalidInvite: "Der Einladungscode ist falsch oder abgelaufen.",
      failed: "Die Registrierung konnte nicht abgeschlossen werden. Bitte versuchen Sie es später erneut."
    }
  };

  // The server's error codes, mapped to something a person can act on. A code
  // that is not listed becomes the generic failure - never the code itself.
  var ERROR_KEYS = {
    rate_limited: "rateLimited",
    email_and_role_required: "invalid",
    invalid_invite: "invalidInvite"
  };

  function text(lang, key) {
    return (MESSAGES[lang] && MESSAGES[lang][key]) || MESSAGES.en[key] || MESSAGES.ja[key] || "";
  }

  /** What to show for a response, as { state, lines, login }. */
  function outcome(status, body, lang) {
    var code = body && typeof body.error === "string" ? body.error : "";
    if (status >= 200 && status < 300 && body && body.ok) {
      return { state: "success", lines: [text(lang, "done"), text(lang, "next")], login: false };
    }
    // Already registered is not a failure: the visitor has what they came for
    // and needs the way in, not an error. Both spellings are accepted because
    // the code has been written both ways.
    if (code === "member_exists" || code === "member_exist") {
      return { state: "exists", lines: [text(lang, "exists"), text(lang, "existsPending")], login: true };
    }
    return { state: "error", lines: [text(lang, ERROR_KEYS[code] || "failed")], login: false };
  }

  function show(statusEl, baseClass, result, lang) {
    statusEl.className = (baseClass ? baseClass + " " : "") + result.state;
    statusEl.textContent = "";
    var doc = statusEl.ownerDocument;
    result.lines.forEach(function (line, index) {
      var el = doc.createElement(index === 0 ? "strong" : "span");
      el.textContent = line;
      el.style.display = "block";
      statusEl.appendChild(el);
    });
    if (result.login) {
      var link = doc.createElement("a");
      link.href = LOGIN_URL;
      link.textContent = text(lang, "login") + " →";
      link.style.cssText = "display:inline-block;margin-top:6px;font-weight:700";
      statusEl.appendChild(link);
    }
  }

  /**
   * Wire a registration form.
   *   form     the <form>
   *   options  { status: element, payload(FormData) -> object, lang() -> code }
   */
  function attach(form, options) {
    var statusEl = options.status;
    var baseClass = statusEl.className || "";
    var button = form.querySelector("button");
    var busy = false;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      // The disabled button stops a second click; this stops a second Enter
      // key, which submits a form without going through the button.
      if (busy) return;
      busy = true;
      var lang = options.lang ? options.lang() : "ja";
      var label = button ? button.textContent : "";
      if (button) {
        button.disabled = true;
        button.setAttribute("aria-busy", "true");
        button.style.opacity = "0.6";
        button.style.cursor = "wait";
        button.textContent = text(lang, "sending");
      }
      statusEl.className = baseClass;
      statusEl.textContent = text(lang, "sending");

      var payload = options.payload(new root.FormData(form));
      return root.fetch("/api/members/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (response) {
        return response.json().then(
          function (body) { return outcome(response.status, body, lang); },
          function () { return outcome(response.status, null, lang); }
        );
      }, function () {
        return outcome(0, null, lang);
      }).then(function (result) {
        show(statusEl, baseClass, result, lang);
        if (result.state === "success") form.reset();
      }).then(function () {
        busy = false;
        if (button) {
          button.disabled = false;
          button.removeAttribute("aria-busy");
          button.style.opacity = "";
          button.style.cursor = "";
          button.textContent = label;
        }
      });
    });
  }

  root.NurevoRegister = { attach: attach, outcome: outcome, MESSAGES: MESSAGES };
})(typeof window !== "undefined" ? window : globalThis);
