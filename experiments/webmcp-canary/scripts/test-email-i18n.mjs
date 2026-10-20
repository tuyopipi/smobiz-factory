import assert from "node:assert/strict";
import { EMAIL_LOCALES, normalizeEmailLocale, headerEmailLocale, resolveEmailLocale, magicLinkEmail } from "../worker/email-i18n.mjs";
import { renderMasterEmail } from "../worker/referral-email-copy.mjs";
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
 ja:['Nurevo ログインリンク','下のリンクでログインできます。1回のみ有効・15分で失効します。'],
 en:['Your Nurevo login link','Click to log in to Nurevo. This link works once and expires in 15 minutes.'],
 zh:['您的Nurevo登录链接','点击链接登录Nurevo。此链接仅可使用一次，将在15分钟后失效。'],
 'zh-tw':['您的Nurevo登入連結','點擊連結登入Nurevo。此連結僅可使用一次，將在15分鐘後失效。'],
 ko:['Nurevo 로그인 링크','클릭하여 Nurevo에 로그인하세요. 이 링크는 한 번만 사용할 수 있으며 15분 후 만료됩니다.'],
 es:['Tu enlace de acceso a Nurevo','Haz clic para iniciar sesión en Nurevo. Este enlace solo funciona una vez y caduca en 15 minutos.'],
 fr:['Votre lien de connexion Nurevo','Cliquez pour vous connecter à Nurevo. Ce lien ne fonctionne qu’une fois et expire dans 15 minutes.'],
 de:['Ihr Nurevo-Anmeldelink','Klicken Sie, um sich bei Nurevo anzumelden. Dieser Link funktioniert einmal und läuft in 15 Minuten ab.']
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
          if (sql.includes("SELECT id,org_id FROM members")) return {id:"mem_test",org_id:"org_test"};
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
    assert.equal(sent[0].subject, locale === "ko" ? "Nurevo 로그인 링크" : "Your Nurevo login link");
    assert.match(sent[0].text, locale === "ko" ? /로그인하세요/ : /Click to log in/);
    assert.match(sent[0].html, new RegExp(`lang="${locale}"`));
    assert.ok(sent[0].html.includes(`<p>${expectedCopy[locale][1]}</p>`));
    assert.doesNotMatch(sent[0].text, /ログイン/);
    console.log(`${locale}: provider request subject, text, HTML verified`);
    console.log(`${locale}: subject=${sent[0].subject}\n${locale}: text=${sent[0].text.split("\n")[0]}`);
  }
} finally { globalThis.fetch = originalFetch; }
console.log("email localization tests passed (mock delivery; no real email sent)");

const values={partner_name:'Partner',client_name:'Client',client_site:'https://client.test',score:72,magic_link:'https://nurevo.jp/api/referral/open?token=test',postal_address:'ADDRESS',unsub:'https://nurevo.jp/api/referral/unsubscribe?token=test'};
assert.equal(renderMasterEmail('en','share',values).subject,"Your site's AI-search visibility report (from Partner)");
assert.equal(renderMasterEmail('en','share',values).text,`Hi Client,

Partner ran an AI-search (AEO) check on https://client.test. Your AI-readability score is 72/100.

▶ View your full report: https://nurevo.jp/api/referral/open?token=test

See exactly what AI assistants (ChatGPT, Perplexity) can and can't read on your site — and what to fix.

Shared by Partner · Powered by Nurevo
ADDRESS · Unsubscribe: https://nurevo.jp/api/referral/unsubscribe?token=test`);
assert.equal(renderMasterEmail('ja','share',values).text,`Client 様

Partner が https://client.test のAI検索(AEO)診断を行いました。AI可読スコアは 72/100 です。

▶ レポートを見る: https://nurevo.jp/api/referral/open?token=test

ChatGPTやPerplexityがサイトの何を見られて／見られていないか、何を直せばいいかが分かります。

Shared by Partner · Powered by Nurevo
ADDRESS · 配信停止: https://nurevo.jp/api/referral/unsubscribe?token=test`);
assert.equal(magicLinkEmail('LINK','en',{postal_address:'ADDRESS',minutes:7}).text,`Click to log in to Nurevo. This link works once and expires in 7 minutes.

▶ Log in: LINK

If you didn't request this, ignore this email.

Nurevo · ADDRESS`);
assert.equal(magicLinkEmail('LINK','ja',{postal_address:'ADDRESS',minutes:7}).text,`下のリンクでログインできます。1回のみ有効・7分で失効します。

▶ ログイン: LINK

心当たりがなければ破棄してください。

Nurevo · ADDRESS`);
for(const locale of EMAIL_LOCALES){
 const mail=renderMasterEmail(locale,'share',values);
 assert.doesNotMatch(mail.text,/\{\{/);assert.ok(mail.text.includes('72/100'));assert.ok(mail.html.includes('href="https://nurevo.jp/api/referral/open?token=test"'));
 const escaped=renderMasterEmail(locale,'share',{...values,partner_name:'<img src=x onerror=1>'});assert.doesNotMatch(escaped.html,/<img/);
}
console.log('EN/JA master full-text equality and 8-language share substitutions/escaping passed');
