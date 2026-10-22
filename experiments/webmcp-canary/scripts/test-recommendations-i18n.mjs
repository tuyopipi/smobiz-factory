/**
 * The Pro fix list (worker/recommendations.mjs) in the dashboard's eight
 * languages.
 *
 *  1. Japanese is byte-identical to what the module produced before it was
 *     localised: every branch that writes words is held to a golden file
 *     (scripts/fixtures/recommendations-ja.golden.json), with no lang and
 *     with lang "ja".
 *  2. Every language has every string, none silently reuses Japanese or
 *     English, and each language's output has no Japanese left in it.
 *  3. The reasons the jobs store are the ones this module translates.
 *  4. /api/sites/:id/recommendations follows ?lang (the dashboard's own codes,
 *     including "tw"), then Accept-Language, and is Japanese with neither.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildSiteRecommendations, resolveRecommendationLang, RECOMMENDATION_LANGS, RECOMMENDATION_COPY, STORED_REASON_JA,
} from "../worker/recommendations.mjs";
import { GEO_REASONS } from "../worker/geocoder.mjs";
import { INITIAL_AEO_RULESET } from "../worker/aeo-rules.mjs";
import { handleApi } from "../worker/api.mjs";
import { CASES } from "./fixtures/recommendations-cases.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const GOLDEN = read("./fixtures/recommendations-ja.golden.json");
const run = (lang) => Object.fromEntries(CASES.map((c) => [c.name, buildSiteRecommendations(lang === undefined ? c.input : { ...c.input, lang })]));
const KANA = /[぀-ヿ]/;
const CJK = /[぀-ヿ一-鿿]/;

/* ---------------- 1. Japanese, byte for byte ---------------- */

assert.equal(JSON.stringify(run(undefined), null, 2) + "\n", GOLDEN, "no lang: the original Japanese, unchanged");
assert.equal(JSON.stringify(run("ja"), null, 2) + "\n", GOLDEN, "lang ja: the same");
assert.equal(JSON.stringify(run("ja-JP"), null, 2) + "\n", GOLDEN, "ja-JP: the same");

/* ---------------- language resolution ---------------- */

{
  const expect = {
    "": "ja", ja: "ja", en: "en", "en-US": "en", zh: "zh", "zh-CN": "zh", "zh-Hans": "zh", tw: "zh-TW", "zh-TW": "zh-TW",
    "zh-tw": "zh-TW", "zh-Hant-HK": "zh-TW", "zh_HK": "zh-TW", ko: "ko", "ko-KR": "ko", es: "es", "es-MX": "es", fr: "fr", "fr-CA": "fr",
    de: "de", "de-CH": "de", pt: "en", xx: "en",
  };
  for (const [tag, code] of Object.entries(expect)) assert.equal(resolveRecommendationLang(tag), code, `"${tag}" -> ${code}`);
  assert.equal(resolveRecommendationLang(undefined), "ja");
  assert.deepEqual([...RECOMMENDATION_LANGS], ["ja", "en", "zh", "zh-TW", "ko", "es", "fr", "de"]);
}

/* ---------------- 2. every language complete, and its own ---------------- */

const shape = (copy) => ({
  props: Object.keys(copy.props).sort(),
  keys: Object.keys(copy).sort(),
});
{
  const ja = RECOMMENDATION_COPY.ja;
  const en = RECOMMENDATION_COPY.en;
  assert.deepEqual(Object.keys(RECOMMENDATION_COPY).sort(), [...RECOMMENDATION_LANGS].sort());
  for (const lang of RECOMMENDATION_LANGS) {
    const copy = RECOMMENDATION_COPY[lang];
    assert.deepEqual(shape(copy), shape(ja), `${lang}: same keys as Japanese`);
    for (const [prop, pair] of Object.entries(copy.props)) {
      assert.ok(pair.length === 2 && pair.every((s) => typeof s === "string" && s.trim()), `${lang}.props.${prop}`);
    }
    assert.deepEqual(Object.keys(copy.stored).sort(), Object.keys(ja.stored).sort(), `${lang}: stored titles`);
    if (lang === "ja") continue;
    assert.deepEqual(Object.keys(copy.reasons).sort(), Object.keys(STORED_REASON_JA).sort(), `${lang}: every stored reason`);
    assert.deepEqual(Object.keys(copy.fields).sort(), Object.keys(en.fields).sort(), `${lang}: every extra field label`);
    for (const key of ["profileDetail", "criteriaDetail", "schemaDetail"]) {
      assert.notEqual(copy[key], ja[key], `${lang}.${key} is not Japanese`);
      if (lang !== "en") assert.notEqual(copy[key], en[key], `${lang}.${key} is not English`);
    }
    for (const prop of Object.keys(ja.props)) {
      assert.notEqual(copy.props[prop][1], ja.props[prop][1], `${lang}.props.${prop} is not Japanese`);
      if (lang !== "en") assert.notEqual(copy.props[prop][1], en.props[prop][1], `${lang}.props.${prop} is not English`);
    }
    for (const id of Object.keys(STORED_REASON_JA)) {
      if (lang !== "en") assert.notEqual(copy.reasons[id], en.reasons[id], `${lang}.reasons.${id} is not English`);
    }
  }

  // Run every case in every language: nothing Japanese survives (the inputs'
  // own check labels and messages are the caller's, already localised, so the
  // cases' Japanese check text is excluded).
  for (const lang of RECOMMENDATION_LANGS.filter((l) => l !== "ja")) {
    const out = run(lang);
    for (const [name, result] of Object.entries(out)) {
      for (const item of result.items) {
        if (item.kind.startsWith("check_") || item.kind === "gate_blocked") continue;
        const words = [item.title, item.detail, ...(item.fields || [])].join(" ");
        const bad = ["zh", "zh-TW"].includes(lang) ? KANA : CJK;
        // The unknown stored kind and the free-text title fall back to the raw kind.
        assert.equal(bad.test(words), false, `${lang}/${name}/${item.id}: no Japanese left in "${words}"`);
      }
      // Structure is language-independent.
      const ja = JSON.parse(GOLDEN)[name];
      assert.deepEqual(result.items.map((i) => [i.id, i.kind, i.priority, i.status]), ja.items.map((i) => [i.id, i.kind, i.priority, i.status]), `${lang}/${name}: same items in the same order`);
    }
  }

  // Spot checks of whole strings.
  const fr = run("fr");
  const desc = fr.profile_missing.items.find((i) => i.target === "description");
  assert.equal(desc.title, "À renseigner : Description");
  assert.equal(desc.detail, "L’IA ne peut pas expliquer quel type d’établissement vous êtes. Il sera publié dès que vous le renseignerez dans les informations de l’établissement.");
  const enOut = run("en");
  assert.equal(enOut.criteria_lag.items.find((i) => i.target === "geo").title, "Latitude and longitude is not published to the latest criteria");
  assert.equal(enOut.profile_missing.items.find((i) => i.target === "sameas").title, "sameas is missing", "an unknown property keeps its raw name");
  assert.equal(enOut.profile_missing.items.find((i) => i.target === "sameas").detail, "It is published once you enter it in your business profile.");
  const stored = enOut.stored.items.find((i) => i.id === "stored:missing_customer_data");
  assert.equal(stored.title, "Your business details need checking");
  assert.deepEqual(stored.fields, ["Price range", "Image", "Booking URL", "Business type"]);
  assert.ok(stored.detail.startsWith("Business details that need your confirmation"));
  const tw = run("tw");
  assert.equal(tw.stored.items.find((i) => i.id === "stored:geo_unresolved").title, "無法自動補全位置資訊（geo）");
  assert.equal(tw.schema_missing.items.find((i) => i.target === "telephone").detail, "無法回答聯絡方式。值已填寫。請檢查輸出設定。", "Chinese joins without a space");
  assert.equal(run("de").stored.items.find((i) => i.id === "stored:unknown_kind").title, "unknown_kind", "an unknown kind is shown as stored");

  // A reason nobody translated is shown as stored, not dropped.
  const odd = buildSiteRecommendations({ lang: "ko", stored: [{ kind: "geo_unresolved", detail_json: JSON.stringify({ reason: "手書きの理由" }) }] });
  assert.equal(odd.items[0].detail, "手書きの理由");
}

/* ---------------- 3. the reasons are the ones the jobs write ---------------- */

{
  assert.ok(read("../worker/aeo-learning.mjs").includes(`reason: "${STORED_REASON_JA.learning_missing}"`), "learning job reason");
  assert.ok(read("../worker/aeo-autofix.mjs").includes(`reason:'${STORED_REASON_JA.autofix_missing}'`), "autofix reason");
  for (const [status, text] of Object.entries(GEO_REASONS)) {
    assert.equal(STORED_REASON_JA[`geo_${status}`], text, `geocoder ${status}`);
  }
  assert.equal(Object.keys(STORED_REASON_JA).filter((k) => k.startsWith("geo_")).length, Object.keys(GEO_REASONS).length, "no geo reason left out");
}

/* ---------------- 4. the endpoint follows the request ---------------- */

{
  const CSRF = "c".repeat(64);
  const env = {
    WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp",
    DB: {
      prepare(sql) {
        const first = async (...values) => {
          if (/FROM sessions/.test(sql)) return { member_id: "m1", org_id: "org1", email: "o@x.test", role: "admin", status: "active", expires_at: Date.now() + 3.6e6 };
          if (/FROM aeo_rulesets/.test(sql)) return INITIAL_AEO_RULESET;
          if (/FROM aeo_scores/.test(sql)) return { scanned_at: "2026-10-08T00:00:00.000Z", checks_json: JSON.stringify([{ id: "llms", status: "BAD" }]) };
          if (/FROM site_settings/.test(sql)) return { site_id: "site1", name: "X" };
          if (/FROM sites WHERE id=\?/.test(sql)) {
            if (values[0] !== "site1") return null;
            return { id: "site1", org_id: "org1", url: "", website_uri: "", slug: null, site_key: "nrv_k", plan: "pro", manual_plan: null };
          }
          return null;
        };
        const all = async () => /FROM aeo_site_recommendations/.test(sql)
          ? { results: [{ kind: "geo_unresolved", detail_json: JSON.stringify({ reason: GEO_REASONS.not_found }), status: "open" }] }
          : { results: [] };
        return { bind: (...values) => ({ first: () => first(...values), all, async run() { return { success: true }; } }), first, all };
      },
    },
  };
  const ask = async (query = "", headers = {}) => {
    const res = await handleApi(new Request(`https://w.test/api/sites/site1/recommendations${query}`, {
      headers: { cookie: `nrv_session=t; nrv_csrf=${CSRF}`, origin: "https://nurevo.jp", ...headers },
    }), env, { waitUntil() {} });
    assert.equal(res.status, 200);
    return (await res.json()).items.find((i) => i.kind === "stored");
  };
  const none = await ask();
  assert.equal(none.title, "位置情報（geo）を自動補完できませんでした", "no language asked: Japanese, as before");
  assert.equal(none.detail, GEO_REASONS.not_found);
  for (const [lang, code] of [["ja", "ja"], ["en", "en"], ["zh", "zh"], ["tw", "zh-TW"], ["ko", "ko"], ["es", "es"], ["fr", "fr"], ["de", "de"]]) {
    const item = await ask(`?lang=${lang}`);
    assert.equal(item.title, RECOMMENDATION_COPY[code].stored.geo_unresolved, `?lang=${lang}`);
    assert.equal(item.detail, code === "ja" ? GEO_REASONS.not_found : RECOMMENDATION_COPY[code].reasons.geo_not_found, `?lang=${lang} reason`);
  }
  assert.equal((await ask("", { "accept-language": "de-DE,de;q=0.9" })).title, RECOMMENDATION_COPY.de.stored.geo_unresolved, "Accept-Language when there is no ?lang");
  assert.equal((await ask("?lang=ko", { "accept-language": "de" })).title, RECOMMENDATION_COPY.ko.stored.geo_unresolved, "?lang wins");
}

console.log("recommendation i18n tests passed");
