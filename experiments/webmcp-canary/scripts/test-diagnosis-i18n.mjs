/**
 * Diagnosis message catalogs.
 *
 * Everything the plugin's AEO screen shows from the service - check labels and
 * per-status messages, schema field labels, meanings and how-to text, the
 * field summary and the readability hint - comes from
 * worker/i18n/diagnosis/<code>.json. These assert that every catalog is
 * complete, that placeholders survive translation, that every locale the plugin
 * ships in resolves to its own language, and that the Japanese and English
 * output is byte-identical to what it was before the catalogs existed.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import {
  DIAGNOSIS_CATALOGS, DIAGNOSIS_LANGS, PARTIAL_CATALOGS, diagnosisFallbackChain, diagnosisText, formatMessage, resolveDiagnosisLang,
} from "../worker/diagnosis-i18n.mjs";
import { AEO_CHECKS, localizeAeoChecks, resolveAeoCheckLang } from "../worker/aeo-score.mjs";
import { ENTITY_SCHEMA_FIELDS, fieldsSummary, localizeFields, textHint } from "../worker/aeo-fields.mjs";
import { diagnoseLang } from "../worker/diagnose.mjs";

const dir = new URL("../worker/i18n/diagnosis/", import.meta.url);
const en = DIAGNOSIS_CATALOGS.en;
const enKeys = Object.keys(en).sort();
const placeholders = (s) => (String(s).match(/\{[A-Za-z_]+\}/g) || []).sort().join(",");

/* ---------------- every catalog is complete ---------------- */

const files = readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort();
for (const code of files) assert.ok(DIAGNOSIS_LANGS.includes(code), `catalog file ${code}.json is wired into the resolver`);

for (const code of DIAGNOSIS_LANGS) {
  const catalog = DIAGNOSIS_CATALOGS[code];
  const keys = Object.keys(catalog);
  for (const key of keys) {
    assert.ok(key in en, `${code}: ${key} is not an English key (typo?)`);
    assert.equal(typeof catalog[key], "string", `${code}: ${key} is a string`);
    assert.ok(catalog[key].trim().length > 0, `${code}: ${key} is not empty`);
    assert.equal(placeholders(catalog[key]), placeholders(en[key]), `${code}: ${key} keeps the placeholders of en`);
  }
  if (!PARTIAL_CATALOGS.includes(code)) {
    assert.deepEqual(keys.slice().sort(), enKeys, `${code}: has exactly the English keys`);
  }
  // Every key resolves to something in the language's own chain.
  for (const key of enKeys) assert.ok(diagnosisText(code, key), `${code}: ${key} resolves`);
}

/* ---------------- untranslated identifiers stay untranslated ---------------- */

const keepVerbatim = ["robots.txt", "llms.txt", "JSON-LD", "ChatGPT", "Claude", "Perplexity", "Nurevo", "WooCommerce", "WordPress", "aggregateRating", "SoftwareApplication", "InStock", "ISO 4217", "offers.price"];
for (const code of DIAGNOSIS_LANGS) {
  for (const key of enKeys) {
    const value = diagnosisText(code, key);
    for (const token of keepVerbatim) {
      // German compounds hyphenate the standard's name (ISO-4217-Währungscode).
      if (en[key].includes(token)) assert.ok(value.includes(token) || value.includes(token.replace(" ", "-")), `${code}: ${key} keeps "${token}" untranslated`);
    }
  }
}

/* ---------------- a translation is a translation ---------------- */

const latinOnly = new Set(["URL", "SKU", "llms.txt"]);
for (const code of DIAGNOSIS_LANGS.filter((c) => c !== "en" && !PARTIAL_CATALOGS.includes(c))) {
  const same = enKeys.filter((key) => DIAGNOSIS_CATALOGS[code][key] === en[key] && !latinOnly.has(en[key]));
  // A handful of words are spelled the same (e.g. "Description" in French,
  // "Name" in German); a catalog that is mostly English was never translated.
  assert.ok(same.length <= 12, `${code}: ${same.length} strings are identical to English: ${same.slice(0, 5).join(" | ")}`);
}

/* ---------------- WordPress locales resolve to their own language ---------------- */

const locales = Object.keys(JSON.parse(readFileSync(new URL("../wordpress-plugin/webmcp-canary/languages/i18n/locales.json", import.meta.url), "utf8")));
assert.equal(locales.length, 59, "the plugin ships in 59 locales");
const expected = {
  ar: "ar", bg_BG: "bg", ca: "ca", cs_CZ: "cs", da_DK: "da", de_AT: "de", de_CH: "de-CH", de_DE: "de", el: "el",
  en_AU: "en", en_CA: "en", en_GB: "en", en_NZ: "en", en_ZA: "en",
  es_AR: "es-MX", es_CL: "es-MX", es_CO: "es-MX", es_CR: "es-MX", es_EC: "es-MX", es_ES: "es", es_MX: "es-MX", es_PE: "es-MX", es_VE: "es-MX",
  et: "et", fa_IR: "fa", fi: "fi", fr_BE: "fr", fr_CA: "fr", fr_FR: "fr", fy: "fy", gl_ES: "gl", gu: "gu", he_IL: "he", hi_IN: "hi",
  hr: "hr", hu_HU: "hu", id_ID: "id", it_IT: "it", ja: "ja", ko_KR: "ko", lo: "lo", nb_NO: "nb", nl_BE: "nl", nl_NL: "nl", pl_PL: "pl",
  pt_BR: "pt-BR", pt_PT: "pt-PT", ro_RO: "ro", ru_RU: "ru", sk_SK: "sk", sl_SI: "sl", sr_RS: "sr", sv_SE: "sv", tr_TR: "tr", uk: "uk",
  vi: "vi", zh_CN: "zh", zh_HK: "zh-TW", zh_TW: "zh-TW",
};
assert.deepEqual(Object.keys(expected).sort(), locales.slice().sort(), "the expectation table covers exactly the plugin locales");
for (const locale of locales) {
  // The plugin sends strtolower(str_replace('_','-', locale)): de_DE -> de-de.
  const sent = locale.toLowerCase().replace(/_/g, "-");
  for (const form of [locale, sent]) {
    assert.equal(resolveDiagnosisLang(form), expected[locale], `${form} resolves to ${expected[locale]}`);
    assert.equal(resolveAeoCheckLang(form), expected[locale], `the check resolver agrees for ${form}`);
  }
  if (!locale.startsWith("en")) {
    const label = localizeAeoChecks([{ id: "schema", status: "OK" }], sent)[0].label;
    assert.notEqual(label, en["check.schema.label"], `${locale}: the schema check is not left in English`);
  }
}

/* ---------------- the fallback chain ---------------- */

assert.deepEqual(diagnosisFallbackChain("es-AR"), ["es-MX", "es", "en"], "es_AR -> es_MX -> es -> en");
assert.deepEqual(diagnosisFallbackChain("es_ES"), ["es", "en"]);
assert.deepEqual(diagnosisFallbackChain("de_CH"), ["de-CH", "de", "en"]);
assert.deepEqual(diagnosisFallbackChain("de_AT"), ["de", "en"]);
assert.deepEqual(diagnosisFallbackChain("zh_HK"), ["zh-TW", "en"]);
assert.deepEqual(diagnosisFallbackChain("fr_CA"), ["fr", "en"]);
assert.deepEqual(diagnosisFallbackChain("pt_PT"), ["pt-PT", "en"]);
assert.deepEqual(diagnosisFallbackChain("en_AU"), ["en"]);
assert.deepEqual(diagnosisFallbackChain("xx-YY"), ["en"]);
// A partial catalog borrows from its parent, then English.
assert.equal(diagnosisText("es-AR", "check.coverage.OK"), DIAGNOSIS_CATALOGS["es-MX"]["check.coverage.OK"], "es-MX override wins");
assert.equal(diagnosisText("es-AR", "check.schema.label"), DIAGNOSIS_CATALOGS.es["check.schema.label"], "es fills what es-MX does not override");
assert.equal(diagnosisText("es-AR", "no.such.key"), undefined, "an unknown key is undefined, not a crash");
// Swiss German follows the plugin's de_CH rule: no ß.
for (const key of enKeys) assert.ok(!diagnosisText("de_CH", key).includes("ß"), `de-CH ${key} has no ß`);
assert.ok(Object.values(DIAGNOSIS_CATALOGS.de).some((v) => v.includes("ß")), "the de-CH test is meaningful");
// pt-PT and pt-BR are separate written standards.
assert.notEqual(diagnosisText("pt_PT", "field.label.address"), diagnosisText("pt_BR", "field.label.address"), "Morada vs Endereço");
// Other spellings of the same languages.
for (const [input, code] of [["zh-Hant-HK", "zh-TW"], ["zh-Hans", "zh"], ["zh-SG", "zh"], ["pt", "pt-BR"], ["pt-AO", "pt-PT"], ["nn-NO", "nb"], ["no", "nb"], ["de_DE.UTF-8", "de"], ["sr_RS@latin", "sr"], ["  FR-ca ", "fr"], ["es-419", "es-MX"], ["es", "es"], ["ja-JP", "ja"], [null, "en"], ["", "en"]]) {
  assert.equal(resolveDiagnosisLang(input), code, `${JSON.stringify(input)} -> ${code}`);
}

/* ---------------- interpolation ---------------- */

assert.equal(formatMessage("{filled}/{total}", { filled: 2, total: 5 }), "2/5");
assert.equal(formatMessage("{field} $& $1", { field: "A.b" }), "A.b $& $1", "replacement text is literal");
for (const code of DIAGNOSIS_LANGS) {
  const fields = [{ entityType: "Product", field: "sku", present: true }, { entityType: "Product", field: "brand", present: false }, { entityType: "Service", field: "areaServed", present: false }];
  const summary = fieldsSummary(fields, code);
  assert.ok(summary.includes("1") && summary.includes("3") && !/[{}]/.test(summary), `${code}: summary is interpolated: ${summary}`);
  for (const item of localizeFields(fields, code)) {
    for (const value of [item.label, item.description, item.howTo]) assert.ok(value && !/\{[a-z]+\}/.test(value), `${code}: ${item.field} has no raw placeholder`);
  }
  assert.ok(localizeFields(fields, code)[2].howTo.includes("Service.areaServed"), `${code}: the field path is substituted`);
  assert.ok(textHint(code), `${code}: a readability hint`);
}

/* ---------------- ja and en are byte-identical to before ---------------- */

// The snapshot below was produced by the inline wording tables this replaced,
// over every check x status and every schema field (present and missing). If a
// catalog edit changes Japanese or English output, this fails.
function snapshot(lang) {
  const fields = [];
  for (const [entityType, def] of Object.entries(ENTITY_SCHEMA_FIELDS)) for (const field of Object.keys(def)) for (const present of [true, false]) fields.push({ entityType, field, present, weight: 1 });
  fields.push({ entityType: "LocalBusiness", field: "openingHours", present: false, weight: 1 }, { entityType: "LocalBusiness", field: "hasMenu", present: false, weight: 1 }, { entityType: "Product", field: "color", present: false, weight: 1 });
  const checks = [];
  for (const { id } of AEO_CHECKS) for (const status of ["OK", "WARN", "BAD", "WEIRD"]) checks.push({ id, status, fixable: true, ...(id === "schema" && status === "WARN" ? { fields } : {}) });
  return { checks: localizeAeoChecks(checks, lang), fields: localizeFields(fields, lang), summary: fieldsSummary(fields, lang), hint: textHint(lang) };
}
const sha = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
assert.equal(sha(snapshot("ja")), "15c2055127c7a7d0db59c7d04b0cd2e3fffac0cd99734cdf2b81425195642596", "Japanese output is unchanged");
assert.equal(sha(snapshot("en")), "a8843e6cb435dc9a2e97e81d635d977c521ab5e298d9ab1ac51ceb1928903af8", "English output is unchanged");
assert.equal(sha(snapshot("en_GB")), sha(snapshot("en")), "every English locale reads the English catalog");

/* ---------------- /api/diagnose keeps its default ---------------- */

assert.equal(diagnoseLang(null), "ja", "no lang keeps Japanese");
assert.equal(diagnoseLang("en"), "en");
assert.equal(diagnoseLang("ja"), "ja");
assert.equal(diagnoseLang("bogus"), "ja", "an unusable lang keeps the old Japanese default");
assert.equal(diagnoseLang("de_DE"), "de", "a WordPress locale is no longer truncated to ja/en");
assert.equal(diagnosisText("ja", "verdict.green"), "良好");
assert.equal(diagnosisText("en", "verdict.yellow"), "Needs improvement");
assert.equal(diagnosisText("en", "verdict.red"), "Critical");

console.log(`Diagnosis catalogs passed (${DIAGNOSIS_LANGS.length} catalogs, ${enKeys.length} keys, ${locales.length} plugin locales)`);
