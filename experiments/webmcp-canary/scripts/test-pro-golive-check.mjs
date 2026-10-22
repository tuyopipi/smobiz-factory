/**
 * The pure parts of the Pro go-live check: parsing what wrangler prints,
 * deciding the flag state, and judging a Stripe price. Fixtures only.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  evaluateTax, parseSecretList, evaluateSecrets, evaluateFlag, evaluatePrice, parseWranglerConfig,
  stripJsonc, stripeKeyMode, maskId, wranglerErrorLine, REQUIRED_SECRETS, DAILY_CRON,
} from "./pro-golive-check.mjs";

/* ---------------- secret list ---------------- */
{
  const json = JSON.stringify([
    { name: "STRIPE_SECRET_KEY", type: "secret_text" },
    { name: "STRIPE_PRICE_ID_PRO", type: "secret_text" },
  ]);
  assert.deepEqual([...parseSecretList(json)], ["STRIPE_SECRET_KEY", "STRIPE_PRICE_ID_PRO"]);
  // wrangler can print a banner and warnings around the JSON.
  const noisy = `\n ⛅️ wrangler 4.143.0\n-------------------\n▲ [WARNING] something\n${json}\n`;
  assert.equal(parseSecretList(noisy).size, 2, "banner and warnings are tolerated");
  assert.equal(parseSecretList("[]").size, 0);
  assert.throws(() => parseSecretList("✘ [ERROR] Not logged in"), /secret_list_not_json/);

  const report = evaluateSecrets(parseSecretList(json));
  assert.deepEqual(report.map((s) => [s.name, s.present]), [
    ["STRIPE_SECRET_KEY", true], ["STRIPE_WEBHOOK_SECRET", false], ["STRIPE_PRICE_ID_PRO", true], ["PERPLEXITY_API_KEY", false],
  ]);
  assert.ok(REQUIRED_SECRETS.every((s) => !("value" in s)), "nothing holds a value");
}

/* ---------------- the secret names match what the worker reads ---------------- */
{
  const api = readFileSync(new URL("../worker/api.mjs", import.meta.url), "utf8");
  const billing = readFileSync(new URL("../worker/billing-plan.mjs", import.meta.url), "utf8");
  const sov = readFileSync(new URL("../worker/aeo-sov.mjs", import.meta.url), "utf8");
  assert.match(api, /function stripeSecret\(env\) \{\s*const value = String\(env\.STRIPE_SECRET_KEY/, "stripeSecret reads STRIPE_SECRET_KEY");
  assert.match(api, /env\.STRIPE_WEBHOOK_SECRET/);
  assert.match(billing, /env\.STRIPE_PRICE_ID_PRO/);
  assert.match(billing, /env\.PRO_CHECKOUT_ENABLED/);
  assert.match(sov, /key: "PERPLEXITY_API_KEY"/);
}

/* ---------------- wrangler.jsonc ---------------- */
{
  assert.deepEqual(JSON.parse(stripJsonc('{ // c\n "a": "http://x//y", /* b */ "b": [1,2,],\n}')), { a: "http://x//y", b: [1, 2] });
  const real = parseWranglerConfig(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
  assert.equal(real.name, "webmcp-canary", "the real config parses");
  assert.ok(real.triggers.crons.includes(DAILY_CRON), "and has the daily cron");
}

/* ---------------- the flag ---------------- */
{
  const none = new Set();
  assert.deepEqual(evaluateFlag({ vars: {} }, none), { status: "off", source: "unset", on: false });
  assert.equal(evaluateFlag({ vars: { PRO_CHECKOUT_ENABLED: "1" } }, none).status, "on");
  assert.equal(evaluateFlag({ vars: { PRO_CHECKOUT_ENABLED: "true" } }, none).status, "off", "only exactly 1 is on");
  assert.equal(evaluateFlag({ vars: { PRO_CHECKOUT_ENABLED: "0" } }, none).on, false);
  assert.equal(evaluateFlag({ vars: {} }, new Set(["PRO_CHECKOUT_ENABLED"])).status, "set_unverified");
  assert.equal(evaluateFlag({ vars: { PRO_CHECKOUT_ENABLED: "1" } }, new Set(["PRO_CHECKOUT_ENABLED"])).status, "conflict");
}

/* ---------------- the Stripe price ---------------- */
const GOOD = {
  id: "price_1AbCdEfGhIjKlMn", object: "price", active: true, currency: "jpy", unit_amount: 14800,
  billing_scheme: "per_unit", livemode: true, type: "recurring",
  recurring: { interval: "month", interval_count: 1, usage_type: "licensed" },
};
{
  assert.deepEqual(evaluatePrice(GOOD, { keyMode: "live" }), { ok: true, problems: [], warnings: [] });
  const bad = (over, keyMode = "live") => evaluatePrice({ ...GOOD, ...over }, { keyMode });
  assert.equal(bad({ active: false }).ok, false, "inactive fails");
  assert.equal(bad({ currency: "usd" }).ok, false, "non-JPY fails");
  assert.equal(bad({ unit_amount: 1480000 }).ok, false, "JPY is zero-decimal; 1480000 is ¥1.48M");
  assert.equal(bad({ unit_amount: 3000 }).ok, false, "the Standard price fails");
  assert.equal(bad({ type: "one_time", recurring: null }).ok, false, "one-off fails");
  assert.equal(bad({ recurring: { interval: "year", interval_count: 1 } }).ok, false, "yearly fails");
  assert.equal(bad({ recurring: { interval: "month", interval_count: 3 } }).ok, false, "quarterly fails");
  assert.equal(bad({ recurring: { interval: "month", interval_count: 1, usage_type: "metered" } }).ok, false, "metered fails");
  assert.equal(bad({ billing_scheme: "tiered" }).ok, false, "tiered (variable) pricing fails");
  assert.equal(bad({ livemode: false }).ok, false, "a test price checked with a live key fails");
  const test = bad({ livemode: false }, "test");
  assert.equal(test.ok, true, "a test price checked with a test key passes");
  assert.ok(test.warnings.some((w) => /TEST key/.test(w)), "but is flagged as not proving production");
  assert.equal(evaluatePrice({ error: { type: "invalid_request_error", code: "resource_missing", message: "No such price: 'price_x'" } }).ok, false);
  assert.ok(!evaluatePrice({ error: { code: "resource_missing", message: "No such price: 'price_secret'" } }).problems.join().includes("price_secret"),
    "Stripe's message (which echoes the id) is not repeated");
  assert.equal(evaluatePrice(null).ok, false);
}

/* ---------------- no secrets printed ---------------- */
{
  assert.equal(stripeKeyMode("rk_live_abc"), "live");
  assert.equal(stripeKeyMode("sk_test_abc"), "test");
  assert.equal(stripeKeyMode("pk_live_abc"), null, "a publishable key is not a secret key");
  assert.equal(maskId("price_1AbCdEfGhIjKlMn"), "price_…KlMn");
  assert.equal(maskId("short"), "(set)");
}

assert.equal(
  wranglerErrorLine("\u001b[33m▲ [WARNING] Proxy detected\u001b[0m\n\u001b[31m✘ [ERROR] You are not authenticated.\u001b[0m\n"),
  "✘ [ERROR] You are not authenticated.", "the wrangler error line is shown, not the warning");

// Consumption tax must be configured: prices are tax-exclusive.
assert.equal(evaluateTax({ vars: {} }, new Set()).ok, false, "no tax method fails");
assert.equal(evaluateTax({ vars: { STRIPE_AUTOMATIC_TAX: "1" } }, new Set()).method, "automatic");
assert.equal(evaluateTax({ vars: { STRIPE_AUTOMATIC_TAX: "0" } }, new Set()).ok, false, "automatic tax must be exactly 1");
assert.equal(evaluateTax({ vars: {} }, new Set(["STRIPE_TAX_RATE_ID"])).method, "rate");
assert.ok(evaluatePrice({ object: "price", active: true, type: "recurring", currency: "jpy", unit_amount: 14800, recurring: { interval: "month" }, tax_behavior: "inclusive" }).problems.some((p) => p.includes("inclusive")),
  "an inclusive price is rejected");

console.log("pro go-live check tests passed");
