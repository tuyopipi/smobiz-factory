import assert from "node:assert/strict";
import { EMAIL_LOCALES, normalizeEmailLocale, headerEmailLocale, resolveEmailLocale, magicLinkEmail } from "../worker/email-i18n.mjs";
import { handleApi } from "../worker/api.mjs";
assert.equal(normalizeEmailLocale("zh-Hant-TW"), "zh-tw");
assert.equal(normalizeEmailLocale("tw"), "zh-tw");
assert.equal(normalizeEmailLocale("ko-KR"), "ko");
assert.equal(headerEmailLocale("ja;q=0.2,ko-KR;q=0.9,en;q=0.8"), "ko");
assert.equal(headerEmailLocale("ja;q=0,fr;q=0.5"), "fr");
assert.equal(resolveEmailLocale({language:"ko", registration_locale:"ja"}, "en"), "ko");
assert.equal(resolveEmailLocale({registration_locale:"ko"}, "en"), "ko");
assert.equal(resolveEmailLocale({}, "xx, de-DE;q=0.8"), "de");
assert.equal(resolveEmailLocale({}, "xx"), "en");
assert.equal(resolveEmailLocale({language:"xx",registration_locale:"ko-KR"}, "en"), "ko");
assert.equal(resolveEmailLocale({}, "en;q=0.8,ko;q=0.8"), "en");
assert.equal(resolveEmailLocale({}, "ko;q=0,en;q=0"), "en");
const expectedCopy = {
  ja: ["Nurevoへのログインリンク", "Nurevoにログインするには、次のリンクを開いてください。"],
  en: ["Sign in to Nurevo", "Open the following link to sign in to Nurevo."],
  zh: ["Nurevo 登录链接", "请打开以下链接登录 Nurevo。"],
  "zh-tw": ["Nurevo 登入連結", "請開啟以下連結登入 Nurevo。"],
  ko: ["Nurevo 로그인 링크", "Nurevo에 로그인하려면 아래 링크를 열어 주세요."],
  es: ["Enlace para iniciar sesión en Nurevo", "Abre el siguiente enlace para iniciar sesión en Nurevo."],
  fr: ["Lien de connexion à Nurevo", "Ouvrez le lien suivant pour vous connecter à Nurevo."],
  de: ["Anmeldelink für Nurevo", "Öffnen Sie den folgenden Link, um sich bei Nurevo anzumelden."]
};
for (const locale of EMAIL_LOCALES) {
  const message = magicLinkEmail('https://nurevo.jp/callback?token=test&x="<>', locale);
  assert.ok(message.subject && message.text);
  assert.equal(message.subject, expectedCopy[locale][0]);
  assert.equal(message.text.split("\n")[0], expectedCopy[locale][1]);
  assert.ok(message.html.includes(`<p>${expectedCopy[locale][1]}</p>`));
  assert.match(message.html, new RegExp(`lang="${locale}"`));
  assert.match(message.html, /&amp;x=&quot;&lt;&gt;/);
  assert.ok(message.text.includes("15"));
}
const originalFetch = globalThis.fetch;
try {
  for (const {locale, preferences, header} of [
    {locale:"en",preferences:{language:"en",registration_locale:"ko"},header:"ja"},
    {locale:"ko",preferences:{language:"ko",registration_locale:"ja"},header:"en"},
    {locale:"ko",preferences:{registration_locale:"ko"},header:"en"},
    {locale:"ko",preferences:{},header:"ja;q=0.2,ko-KR;q=0.9,en;q=0.8"},
    {locale:"en",preferences:{},header:"xx"}
  ]) {
    const sent = [];
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://api.resend.com/emails");
      sent.push(JSON.parse(options.body));
      return new Response('{"id":"test"}', {status:200});
    };
    const env = { RESEND_API_KEY:"test-only", MAIL_FROM:"test@example.test", DB:{
      prepare(sql) { return { bind(...values) { return {
        async first() {
          if (sql.includes("INSERT INTO api_rate_limits")) return {count:1};
          if (/SELECT id,org_id(,status)? FROM members/.test(sql)) return {id:"mem_test",org_id:"org_test",status:"active"};
          if (sql.includes("COUNT(*)")) return {count:0};
          if (sql.includes("member_email_preferences")) return preferences;
          throw new Error(sql);
        },
        async run() { return {success:true}; }
      }; } }; }
    }};
    const response = await handleApi(new Request("https://nurevo.jp/api/auth/request", {
      method:"POST", headers:{"content-type":"application/json", "accept-language":header},
      body:JSON.stringify({email:"recipient@example.test",locale:"ja"})
    }), env, {});
    assert.equal(response.status, 200);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].subject, locale === "ko" ? "Nurevo 로그인 링크" : "Sign in to Nurevo");
    assert.match(sent[0].text, locale === "ko" ? /로그인하려면/ : /Open the following link/);
    assert.match(sent[0].html, new RegExp(`lang="${locale}"`));
    assert.ok(sent[0].html.includes(`<p>${expectedCopy[locale][1]}</p>`));
    assert.doesNotMatch(sent[0].text, /ログイン/);
    console.log(`${locale}: provider request subject, text, HTML verified`);
    console.log(`${locale}: subject=${sent[0].subject}\n${locale}: text=${sent[0].text.split("\n")[0]}`);
  }
} finally { globalThis.fetch = originalFetch; }
console.log("email localization tests passed (mock delivery; no real email sent)");
