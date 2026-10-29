/**
 * Nurevo has no wholesale / reseller / OEM channel. Agencies, web studios and
 * individuals all join as referral partners (40% of the monthly fee net of
 * Stripe fees, paid on the 25th via Stripe Connect, after approval). This test
 * keeps the old wording from coming back in what people read:
 *
 *  - every dashboard string: the inline ja/en tables (dashboard.html and the
 *    modules, as _source.json mirrors them) and every locale file;
 *  - every HTML page the worker serves from public/ (member-register,
 *    hosted pages, legal pages, the dashboard itself);
 *  - the transactional and lifecycle email copy.
 *
 * Legacy records still exist (members with role 'agency', sites on the
 * wholesale channel, resale_price columns). The super-admin view may name them
 * neutrally ("旧・代理店（新規受付なし）"), which this test allows: it bans the
 * wholesale words, not the word "agency".
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { liveSource, localeFiles, localeFile } from "./dashboard-dictionary.mjs";

// 卸 except in 棚卸し (inventory); the English words as whole words; and the
// word for "wholesale" in the languages the dashboard used for it before.
export const WHOLESALE = new RegExp([
  "(?<!棚)卸", "\\bwhole-?sale", "\\bre-?sell(?:er|ers|ing)?\\b", "\\bOEM\\b",
  "批发", "批發", "도매", "mayorista", "Großhandel", "\\bengros", "\\ben gros\\b", "groothandel", "groothannel",
  "hurtow", "\\bhurt\\b", "ingrosso", "atacado", "por grosso", "por xunto", "l'engròs", "en-gros",
  "(?<!\\p{L})опт(?!\\p{L})", "оптов", "велепродај", "veleprodaj", "velkoobchod", "veľkoobchod", "на едро",
  "χονδρικ", "toptan", "grosir", "bán buôn", "nagykereskedel", "hulgimüü", "\\btukku", "grossist",
  "بالجملة", "فاتورة الجملة", "حساب عمده", "فاکتور عمده", "فروش عمده", "(?<!\\p{L})عمده(?!\\p{L})", "סיטונא", "थोक", "હોલસેલ", "ຂາຍສົ່ງ",
].join("|"), "iu");

const hits = [];
const check = (where, text) => { const m = String(text).match(WHOLESALE); if (m) hits.push(`${where}: "${m[0]}" in ${JSON.stringify(String(text).slice(0, 120))}`); };

// Dashboard dictionaries.
for (const [key, { en, ja }] of Object.entries(liveSource())) { check(`dashboard en ${key}`, en); check(`dashboard ja ${key}`, ja); }
for (const code of localeFiles()) for (const [key, value] of Object.entries(localeFile(code) || {})) check(`dashboard-i18n/${code}.json ${key}`, value);

// Served HTML pages.
const PUBLIC = new URL("../public/", import.meta.url);
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const url = new URL(name, dir);
    if (statSync(url).isDirectory()) walk(new URL(`${name}/`, dir));
    else if (name.endsWith(".html")) check(`public/${url.pathname.split("/public/")[1]}`, readFileSync(url, "utf8"));
  }
}
walk(PUBLIC);

// Email copy.
for (const file of ["email-i18n.mjs", "lifecycle-email.mjs"]) check(`worker/${file}`, readFileSync(new URL(`../worker/${file}`, import.meta.url), "utf8"));

assert.deepEqual(hits, [], `wholesale / reseller / OEM wording is back:\n${hits.join("\n")}`);

// The pattern itself catches what it is meant to, and lets the legacy label through.
for (const bad of ["卸請求", "Billed wholesale", "Wholesale/OEM", "reseller", "Großhandel", "批发结算", "도매 청구", "Опт", "Оптовий рахунок"]) assert.match(bad, WHOLESALE, bad);
for (const ok of ["旧・代理店（新規受付なし）", "Legacy agency (closed to new sign-ups)", "棚卸し", "opt out", "poem", "Referral partner", "Оптимизация"]) assert.doesNotMatch(ok, WHOLESALE, ok);

// The super-admin partner list names legacy agency records neutrally.
const ja = liveSource();
assert.equal(ja.paLegacyAgency.ja, "旧・代理店（新規受付なし）");
assert.equal("paWholesale" in ja || "planWholesale" in ja || "wholesale" in ja, false, "the wholesale keys are gone");

console.log("no wholesale offer: ok");
