import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const html = readFileSync(new URL("../public/dashboard.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../public/dashboard-onboarding.js", import.meta.url), "utf8");
const wrangler = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");
// Neutral wording: the account owner adds their own site as often as a client's.
assert.doesNotMatch(html, /クライアントのサイトを追加|最初のクライアントサイト/, "the entry wording no longer assumes an agency");
assert.match(html, /addSite:'サイトを追加'/, "the entry wording is in the dictionary");
assert.match(html, /addSite:'Add a site'/);
assert.match(html, /if\(!sites\.length\).*emptyStart/, "zero sites render the guided empty state");
assert.match(html, /api\('\/api\/partner'\)/, 'all accounts load their partner summary');
assert.match(js, /partnerNav\.hidden = false/, 'every account can issue a referral code');
assert.match(html, /obWaiting:'接続待ち…'/, "wizard explains the live state");
assert.match(js, /tr\("obWaiting"\)/);
assert.match(js, /site && site\.bound/, "wizard polls until the server reports pairing");
assert.match(js, /\/aeo-score/, "first diagnosis starts as soon as pairing is observed");
assert.match(js, /wp-pairing-code\.png/, "real WordPress screenshot is embedded in the wizard");
assert.match(wrangler, /nurevo\.jp\/assets\/onboarding\/\*/, "onboarding screenshots have a production route");
assert.match(js, /legacy\.remove\(\)/, "the duplicate legacy connection panel is removed");
// The old add() modal read r.id from a response it never kept and was
// unreachable behind the wizard. There is one way to add a site now.
assert.doesNotMatch(html, /function add\(\)/, "the dead add() modal is gone");
assert.doesNotMatch(js, /install_type: "wp", url/, "the wizard no longer posts every site as WordPress");
for (const name of ["wp-pairing-code.png", "wp-settings-full.png"]) {
  assert.ok(statSync(new URL(`../public/assets/onboarding/${name}`, import.meta.url)).size > 1000, `${name} is a real captured image`);
}
console.log("onboarding integration tests passed");
