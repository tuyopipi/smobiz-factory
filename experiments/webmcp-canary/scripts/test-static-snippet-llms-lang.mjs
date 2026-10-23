/**
 * The llms.txt in the non-WordPress paste-in block speaks the reader's language.
 *
 * Its headings and labels come from the ruleset, which carries them in
 * Japanese, so an English dashboard used to hand the owner "## 店舗情報" and
 * "- 住所:" to paste into an English site. /api/sites/:id/static-snippet now
 * words them in the dashboard's language (?lang=, then Accept-Language).
 * This fails when:
 *  - the Japanese file changes by a single byte (golden below, captured from
 *    the code before this change);
 *  - any of the eight dashboard languages keeps a Japanese heading or label;
 *  - the endpoint ignores ?lang= or Accept-Language, or drops Japanese when
 *    neither is given;
 *  - a translated file stops counting as having contact details in the
 *    llms.txt quality check.
 */
import assert from "node:assert/strict";
import { INITIAL_AEO_RULESET } from "../worker/aeo-rules.mjs";
import { handleApi } from "../worker/api.mjs";
import { buildLlmsTxt, resolveLlmsTxtLang, LLMS_TXT_LANGS } from "../worker/ai-crawlers.js";
import { extractAeoSignals } from "../worker/aeo-score.mjs";

const SITE = { name: "栞珈琲", description: "自家焙煎", address: "東京都千代田区1-1", tel: "03-1234-5678", hours: "11:00-20:00", reserve_url: "https://shop.example/reserve", url: "shop.example" };

const GOLDEN_JA = "# 栞珈琲\n> 自家焙煎\n\n## 店舗情報\n- 住所: 東京都千代田区1-1\n- 電話: 03-1234-5678\n- 営業時間: 11:00-20:00\n- 予約: https://shop.example/reserve\n- サイト: https://shop.example/\n\n## 対応AIクローラー\n- GPTBot\n- OAI-SearchBot\n- ChatGPT-User\n- ClaudeBot\n- PerplexityBot\n- Google-Extended\n- Applebot-Extended\n- Bytespider\n";

const EXPECTED = {
  en: ["## Store information", "- Address: ", "- Phone: ", "- Hours: ", "- Reservations: ", "- Website: ", "## Supported AI crawlers"],
  zh: ["## 店铺信息", "- 地址: ", "- 电话: ", "- 营业时间: ", "- 预约: ", "- 网站: ", "## 支持的AI爬虫"],
  "zh-TW": ["## 店家資訊", "- 地址: ", "- 電話: ", "- 營業時間: ", "- 預約: ", "- 網站: ", "## 支援的AI爬蟲"],
  ko: ["## 매장 정보", "- 주소: ", "- 전화: ", "- 영업시간: ", "- 예약: ", "- 웹사이트: ", "## 지원하는 AI 크롤러"],
  es: ["## Información del negocio", "- Dirección: ", "- Teléfono: ", "- Horario: ", "- Reservas: ", "- Sitio web: ", "## Rastreadores de IA admitidos"],
  fr: ["## Informations sur l’établissement", "- Adresse: ", "- Téléphone: ", "- Horaires: ", "- Réservation: ", "- Site web: ", "## Robots d’IA pris en charge"],
  de: ["## Geschäftsinformationen", "- Adresse: ", "- Telefon: ", "- Öffnungszeiten: ", "- Reservierung: ", "- Website: ", "## Unterstützte KI-Crawler"],
};
// The Japanese-only words of the ruleset; zh-TW legitimately shares 電話.
const JA_WORDS = ["店舗情報", "住所", "営業時間", "予約", "サイト", "対応AIクローラー"];

/* ---------------- 1. Japanese is byte-identical ---------------- */

assert.deepEqual([...LLMS_TXT_LANGS], ["ja", "en", "zh", "zh-TW", "ko", "es", "fr", "de"]);
assert.equal(buildLlmsTxt(SITE), GOLDEN_JA, "no language: the Japanese file as before");
assert.equal(buildLlmsTxt(SITE, INITIAL_AEO_RULESET.definition), GOLDEN_JA);
assert.equal(buildLlmsTxt(SITE, INITIAL_AEO_RULESET.definition, "ja"), GOLDEN_JA, "ja: byte-identical");
assert.equal(Buffer.from(buildLlmsTxt(SITE, undefined, "ja")).toString("hex"), Buffer.from(GOLDEN_JA).toString("hex"));

/* ---------------- 2. the other seven languages ---------------- */

for (const [lang, words] of Object.entries(EXPECTED)) {
  const text = buildLlmsTxt(SITE, undefined, lang);
  for (const w of words) assert.ok(text.includes(w), `${lang}: has ${JSON.stringify(w)}`);
  const headings = text.split("\n").filter((l) => /^(##|- [^:]+: )/.test(l)).map((l) => l.replace(/: .*$/, ""));
  for (const h of headings) for (const ja of JA_WORDS) assert.ok(!h.includes(ja), `${lang}: heading/label ${JSON.stringify(h)} is not Japanese`);
  // Same structure and values as Japanese, only the wording differs.
  assert.equal(text.split("\n").length, GOLDEN_JA.split("\n").length, `${lang}: same line count`);
  for (const value of ["# 栞珈琲", "> 自家焙煎", "東京都千代田区1-1", "https://shop.example/", "- GPTBot", "- Bytespider"]) assert.ok(text.includes(value), `${lang}: keeps ${value}`);
  // The quality check still sees the contact details.
  const quality = extractAeoSignals("<html></html>", "", text, { llmsPresent: true }).llmsTxtQuality;
  assert.equal(quality, extractAeoSignals("<html></html>", "", GOLDEN_JA, { llmsPresent: true }).llmsTxtQuality, `${lang}: llms quality unchanged`);
}

// A ruleset line with no translation is written as the ruleset has it.
{
  const def = structuredClone(INITIAL_AEO_RULESET.definition);
  def.generation.llmsSections.store_information = [{ literal: "## 独自の見出し" }, { source: "tel", template: "- 電話: {value}" }];
  assert.equal(buildLlmsTxt(SITE, def, "en").split("\n\n")[1], "## 独自の見出し\n- Phone: 03-1234-5678");
}

/* ---------------- 3. picking the language ---------------- */

const pick = { "": "ja", ja: "ja", "ja-JP": "ja", en: "en", "en-US": "en", zh: "zh", "zh-CN": "zh", "zh-Hans": "zh", tw: "zh-TW", "zh-TW": "zh-TW", "zh-Hant-HK": "zh-TW", zh_HK: "zh-TW", ko: "ko", "ko-KR": "ko", es: "es", "es-MX": "es", fr: "fr", "fr-CA": "fr", de: "de", de_DE: "de", pt: "en", xx: "en" };
for (const [input, lang] of Object.entries(pick)) assert.equal(resolveLlmsTxtLang(input), lang, `${input || "(none)"} -> ${lang}`);
assert.equal(resolveLlmsTxtLang(null), "ja");
assert.equal(resolveLlmsTxtLang(undefined), "ja");

/* ---------------- 4. the endpoint ---------------- */

function makeEnv() {
  const row = { id: "site1", org_id: "org1", url: "shop.example", website_uri: "https://shop.example/", slug: null, site_key: "nrv_k", plan: "free", manual_plan: null, install_type: "tag", delivery_status: "active" };
  const DB = {
    prepare(sql) {
      const first = async (...values) => {
        if (/FROM sessions/.test(sql)) return { member_id: "m1", org_id: "org1", email: "o@x.test", role: "admin", status: "active", expires_at: Date.now() + 3.6e6 };
        if (/FROM aeo_rulesets/.test(sql)) return INITIAL_AEO_RULESET;
        if (/FROM aeo_harvested_facts/.test(sql)) return null;
        if (/FROM site_settings/.test(sql)) return { site_id: "site1", serve_schema: 1, allow_crawlers: 1, ...SITE, url: undefined, updated_at: 1 };
        if (/FROM sites WHERE id=\?/.test(sql)) return values[0] === row.id ? row : null;
        return null;
      };
      return {
        bind(...values) { return { first: () => first(...values), async all() { return { results: [] }; }, async run() { return { success: true }; } }; },
        first, async all() { return { results: [] }; }, async run() { return { success: true }; },
      };
    },
  };
  return { DB, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp" };
}
async function snippet(query = "", headers = {}) {
  const res = await handleApi(new Request(`https://w.test/api/sites/site1/static-snippet${query}`, { headers: { cookie: "nrv_session=t", origin: "https://nurevo.jp", ...headers } }), makeEnv(), { waitUntil() {} });
  assert.equal(res.status, 200);
  return { body: await res.json(), vary: res.headers.get("vary") || "" };
}
{
  const plain = await snippet();
  assert.equal(plain.body.llms_txt, GOLDEN_JA, "no ?lang and no Accept-Language: the Japanese file, byte for byte");
  assert.equal(plain.body.llms_txt_lang, "ja");
  assert.match(plain.vary, /accept-language/i);
  assert.equal((await snippet("?lang=ja", { "accept-language": "en" })).body.llms_txt, GOLDEN_JA, "?lang=ja wins over the browser");
  for (const [q, lang] of [["en", "en"], ["zh", "zh"], ["tw", "zh-TW"], ["ko", "ko"], ["es", "es"], ["fr", "fr"], ["de", "de"]]) {
    const { body } = await snippet(`?lang=${q}`);
    assert.equal(body.llms_txt_lang, lang);
    assert.equal(body.llms_txt, buildLlmsTxt({ ...SITE, url: "https://shop.example/" }, undefined, lang), `?lang=${q}`);
    assert.ok(body.llms_txt.includes(EXPECTED[lang][0]), `?lang=${q}: ${EXPECTED[lang][0]}`);
  }
  const header = await snippet("", { "accept-language": "fr-FR,fr;q=0.9,en;q=0.8" });
  assert.equal(header.body.llms_txt_lang, "fr", "Accept-Language when there is no ?lang");
}

console.log("static snippet llms.txt language tests passed");
