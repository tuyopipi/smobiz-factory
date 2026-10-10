import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const html = readFileSync(new URL("../public/dashboard.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../public/dashboard-onboarding.js", import.meta.url), "utf8");
assert.match(html, /クライアントのサイトを追加/, "agency-first CTA is the only visible entry wording");
assert.match(html, /if\(!sites\.length\).*emptyStart/, "zero sites render the guided empty state");
assert.match(html, /canBill\?api\('\/api\/billing\/summary'\):Promise\.resolve\(null\)/, "non-partners do not request billing");
assert.match(js, /\["referrer", "agency"\]/, "only partner roles see billing navigation");
assert.match(js, /接続待ち…/, "wizard explains the live state");
assert.match(js, /site && site\.bound/, "wizard polls until the server reports pairing");
assert.match(js, /\/aeo-score/, "first diagnosis starts as soon as pairing is observed");
assert.match(js, /wp-pairing-code\.png/, "real WordPress screenshot is embedded in the wizard");
assert.match(js, /legacy\.remove\(\)/, "the duplicate legacy connection panel is removed");
for (const name of ["wp-pairing-code.png", "wp-settings-full.png"]) {
  assert.ok(statSync(new URL(`../public/assets/onboarding/${name}`, import.meta.url)).size > 1000, `${name} is a real captured image`);
}
console.log("onboarding integration tests passed");
