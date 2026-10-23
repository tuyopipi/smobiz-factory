/**
 * Modals sit above the mobile top bar.
 *
 * Below 760px the side menu becomes a sticky top bar with z-index 20. The
 * modals (.modal: the onboarding wizard, the unbind confirmation, the pairing
 * code) had no stacking order, so the bar was drawn over the wizard on a
 * phone. This fails when:
 *  - .modal has no z-index, or one not above the top bar's;
 *  - the toast no longer sits above an open modal;
 *  - a dashboard script opens a dialog that is not a .modal (and so would not
 *    get the stacking order).
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const pub = new URL("../public/", import.meta.url);
const html = readFileSync(new URL("dashboard.html", pub), "utf8");
const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");

function zIndexOf(selector, text = css) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rule = new RegExp(`(?:^|[}\\s])${escaped}\\{([^}]*)\\}`).exec(text);
  assert.ok(rule, `${selector} has a rule`);
  const z = /z-index:\s*(\d+)/.exec(rule[1]);
  return z ? Number(z[1]) : null;
}

/** The body of the first @media block whose query matches, braces balanced. */
function mediaBody(query) {
  const start = css.indexOf(`@media${query}{`);
  assert.ok(start >= 0, `the ${query} breakpoint exists`);
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(css.indexOf("{", start) + 1, i);
  }
  throw new Error(`unbalanced ${query}`);
}
const mobile = mediaBody("(max-width:760px)");
const bar = zIndexOf(".side", mobile);
assert.ok(/\.side\{[^}]*position:sticky/.test(mobile), "the mobile top bar is sticky");
assert.equal(typeof bar, "number", "the top bar has a z-index");

const modal = zIndexOf(".modal");
assert.equal(typeof modal, "number", ".modal sets a z-index");
assert.ok(modal > bar, `.modal (${modal}) is above the mobile top bar (${bar})`);
assert.ok(/\.modal\{[^}]*position:fixed/.test(css), ".modal is fixed to the viewport");

const toast = zIndexOf(".toast");
assert.ok(toast > modal, `the toast (${toast}) still shows above an open modal (${modal})`);

// Every dialog the dashboard opens is a .modal, so none escapes the order.
const sources = [["dashboard.html", html], ...readdirSync(pub).filter((f) => /^dashboard-.*\.js$/.test(f)).map((f) => [f, readFileSync(new URL(f, pub), "utf8")])];
let dialogs = 0;
for (const [name, text] of sources) {
  for (const m of text.matchAll(/className\s*=\s*(["'])([^"']*)\1;?\s*\w+\.innerHTML\s*=\s*['"`]<div[^>]*role="dialog"/g)) {
    dialogs++;
    assert.ok(m[2].split(/\s+/).includes("modal"), `${name}: a dialog container has class "modal" (got "${m[2]}")`);
  }
  const roleDialogs = (text.match(/role="dialog"/g) || []).length;
  const covered = [...text.matchAll(/className\s*=\s*(["'])[^"']*\bmodal\b[^"']*\1;?\s*\w+\.innerHTML\s*=\s*['"`]<div[^>]*role="dialog"/g)].length;
  assert.equal(covered, roleDialogs, `${name}: every role="dialog" sits in a .modal`);
}
assert.ok(dialogs >= 3, `the wizard, unbind and pairing-code dialogs were all found (${dialogs})`);

console.log("modal stacking tests passed");
