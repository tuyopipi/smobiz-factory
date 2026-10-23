/**
 * The legal pages exist twice: the landing page (Pages) serves /terms and the
 * Worker serves /en/terms (its route claims /en/terms*). The fee article drifted
 * once - the Worker kept "tax included" after the LP was corrected - so the
 * fee article of each pair must match.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const article = (html, head) => {
  const start = html.indexOf(head);
  assert.ok(start >= 0, `missing ${head}`);
  return html.slice(start, html.indexOf("</ol>", start) + 5);
};
const pairs = [
  ["../../nurevo-lp/public/en/terms.html", "../public/en/terms/index.html", "<h2>Article 4 (Fees and Payment)</h2>"],
  ["../../nurevo-lp/public/terms.html", "../public/terms/index.html", "<h2>第4条（料金および支払い）</h2>"],
];
for (const [lp, worker, head] of pairs) {
  assert.equal(article(read(worker), head), article(read(lp), head), `${worker} fee article matches ${lp}`);
  assert.ok(!/tax included|税込）とします/.test(article(read(worker), head)), "prices are tax-exclusive");
}
// The legal notice (特商法) is served by Pages; the Worker keeps a copy. Both
// must list every plan on sale with the same prices.
const priceRow = (html) => html.match(/<th>販売価格<\/th><td>(.*?)<\/td>/)[1];
assert.equal(priceRow(read("../../nurevo-lp/public/tokushoho.html")), priceRow(read("../public/tokushoho/index.html")), "tokushoho price rows match");
assert.match(priceRow(read("../../nurevo-lp/public/tokushoho.html")), /Proプラン/, "Pro is listed while it is on sale");
console.log("legal page parity tests passed");
