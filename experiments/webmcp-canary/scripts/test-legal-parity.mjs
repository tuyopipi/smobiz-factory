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
  assert.ok(!/tax included|税込）とします|exclusive of tax|税抜|消費税を加算/.test(article(read(worker), head)), "no tax is added on top of the price");
}
// The legal notice (特商法) is served by Pages; the Worker keeps a copy. Both
// must list every plan on sale with the same prices.
const priceRow = (html) => html.match(/<th>販売価格<\/th><td>(.*?)<\/td>/)[1];
assert.equal(priceRow(read("../../nurevo-lp/public/tokushoho.html")), priceRow(read("../public/tokushoho/index.html")), "tokushoho price rows match");
assert.match(priceRow(read("../../nurevo-lp/public/tokushoho.html")), /Proプラン/, "Pro is listed while it is on sale");
// Overseas prices: the manual USD amounts on the Stripe prices, in both copies.
for (const path of ["../../nurevo-lp/public/tokushoho.html", "../public/tokushoho/index.html"]) {
  const row = priceRow(read(path));
  assert.match(row, /3,000円/, `${path}: the JPY Standard total stays`);
  assert.match(row, /14,800円/, `${path}: the JPY Pro total stays`);
  assert.match(row, /Standardプラン 月額20米ドル/, `${path}: the USD Standard amount is listed`);
  assert.match(row, /Proプラン 月額99米ドル/, `${path}: the USD Pro amount is listed`);
  assert.match(row, /現地通貨/, `${path}: other countries see the local-currency amount at checkout`);
}
for (const [path, head, usd] of [
  ["../../nurevo-lp/public/terms.html", "<h2>第4条（料金および支払い）</h2>", /米国のユーザーには米ドル/],
  ["../../nurevo-lp/public/en/terms.html", "<h2>Article 4 (Fees and Payment)</h2>", /in US dollars to users in the United States/],
]) assert.match(article(read(path), head), usd, `${path}: article 4 names the currency per country`);
console.log("legal page parity tests passed");
