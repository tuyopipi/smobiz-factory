/**
 * Localised check wording.
 *
 * The id and status are the machine contract; the label and message are display
 * only. These assert that the split holds, because the whole point is that one
 * cached diagnosis can be rendered in any language without re-running it.
 */
import assert from "node:assert/strict";
import {
  AEO_CHECKS, buildAeoChecks, extractAeoSignals, localizeAeoChecks, resolveAeoCheckLang, scoreAeo,
} from "../worker/aeo-score.mjs";

/* ---------------- language resolution ---------------- */

assert.equal(resolveAeoCheckLang("ja"), "ja");
assert.equal(resolveAeoCheckLang("en"), "en");
assert.equal(resolveAeoCheckLang("JA"), "ja", "case does not matter");
assert.equal(resolveAeoCheckLang("en-GB"), "en", "a region falls back to its base language");
assert.equal(resolveAeoCheckLang("ja-JP"), "ja");
assert.equal(resolveAeoCheckLang("en_US"), "en", "underscores are accepted");

// Unwritten languages resolve to English, not Japanese: a visitor who asked for
// Spanish can act on English, and would be stuck with Japanese.
for (const lang of ["es", "fr", "de", "ko", "zh", "zh-TW", "pt-BR"]) {
  assert.equal(resolveAeoCheckLang(lang), "en", `${lang} falls back to English until it is written`);
}
for (const lang of ["", null, undefined, "   ", "not-a-language"]) {
  assert.equal(resolveAeoCheckLang(lang), "en", `unusable input falls back to English: ${JSON.stringify(lang)}`);
}

/* ---------------- the contract is language-independent ---------------- */

const html = `<html><head>
  <script type="application/ld+json">${JSON.stringify({
    "@type": "HairSalon", name: "Lumina", address: "1-1-1 Tokyo", telephone: "03-1234-5678",
    openingHours: "Tu-Su 11:00-20:00", url: "https://example.com/",
  })}</script></head><body><h1>Lumina</h1><p>Open Tue-Sun 11:00-20:00, 03-1234-5678.</p></body></html>`;
const signals = extractAeoSignals(html, "User-agent: GPTBot\nAllow: /", "# Lumina", { llmsPresent: true });
const result = scoreAeo(signals);

const ja = buildAeoChecks(signals, result, "ja");
const en = buildAeoChecks(signals, result, "en");

assert.equal(ja.length, AEO_CHECKS.length, "every check is reported");
assert.deepEqual(ja.map((c) => c.id), en.map((c) => c.id), "ids are identical across languages");
assert.deepEqual(ja.map((c) => c.status), en.map((c) => c.status), "statuses are identical across languages");
assert.deepEqual(ja.map((c) => c.fixable), en.map((c) => c.fixable), "fixability is identical across languages");

// Order is part of the contract: the checklist is rendered in this order.
assert.deepEqual(
  ja.map((c) => c.id),
  ["ai_crawlers_allowed", "edge_access", "server_rendered_html", "schema", "coverage", "legibility", "llms", "consistency"],
  "the gate checks come first, then the scored ones in weight order",
);

/* ---------------- the wording actually differs ---------------- */

const japanese = /[぀-ヿ一-龯]/;
for (const check of ja) {
  if (check.id === "llms") continue; // "llms.txt" is a filename in every language.
  assert.ok(japanese.test(check.label), `ja label is Japanese: ${check.id}`);
}
for (const check of en) {
  assert.ok(!japanese.test(check.label), `en label carries no Japanese: ${check.id} (${check.label})`);
  assert.ok(!japanese.test(check.message), `en message carries no Japanese: ${check.id}`);
}
assert.notDeepEqual(ja.map((c) => c.label), en.map((c) => c.label), "the two languages are not the same strings");

/* ---------------- a message per status ---------------- */

for (const lang of ["ja", "en"]) {
  const seen = new Map();
  for (const status of ["OK", "WARN", "BAD"]) {
    const localized = localizeAeoChecks([{ id: "schema", status, fixable: true }], lang);
    assert.equal(localized[0].status, status, "the status is untouched");
    assert.ok(localized[0].message, `${lang}/${status} has a message`);
    seen.set(status, localized[0].message);
  }
  assert.equal(new Set(seen.values()).size, 3, `${lang}: OK, WARN and BAD read differently`);
}

// An unrecognised status is a finding, not a pass.
const odd = localizeAeoChecks([{ id: "schema", status: "WEIRD" }], "en");
const warn = localizeAeoChecks([{ id: "schema", status: "WARN" }], "en");
assert.equal(odd[0].message, warn[0].message, "an unknown status is worded as a finding");

/* ---------------- cached results re-render ---------------- */

// This is the behaviour the KV cache depends on: a stored diagnosis carries ids
// and statuses, and the wording is applied per request afterwards.
const cached = JSON.parse(JSON.stringify(buildAeoChecks(signals, result, "ja")));
const rerendered = localizeAeoChecks(cached, "en");
assert.deepEqual(rerendered.map((c) => c.id), cached.map((c) => c.id), "re-rendering preserves ids");
assert.deepEqual(rerendered.map((c) => c.status), cached.map((c) => c.status), "re-rendering preserves statuses");
for (const check of rerendered) {
  assert.ok(!japanese.test(check.label), `a Japanese cache entry re-renders into English: ${check.id}`);
}

// An id this version does not know keeps whatever it arrived with, so a future
// check added upstream degrades to its own wording rather than losing its row.
const unknown = localizeAeoChecks([{ id: "future_check", status: "BAD", label: "Upstream label", message: "Upstream message" }], "en");
assert.equal(unknown.length, 1, "an unknown check still appears");
assert.equal(unknown[0].label, "Upstream label", "an unknown check keeps its label");
assert.equal(unknown[0].message, "Upstream message", "an unknown check keeps its message");

/* ---------------- the default is unchanged ---------------- */

// Callers written before the argument existed must see exactly what they saw.
assert.deepEqual(buildAeoChecks(signals, result), ja, "the default wording is still Japanese");

/* ---------------- robustness ---------------- */

assert.deepEqual(localizeAeoChecks(null, "en"), [], "a missing check list is not a crash");
assert.deepEqual(localizeAeoChecks(undefined, "en"), [], "an undefined check list is not a crash");
assert.deepEqual(localizeAeoChecks([], "en"), [], "an empty check list stays empty");

console.log("AEO check language tests passed");
