// Verdicts of the read-only Stripe setup check, on fixtures shaped like the API.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { exemptFromConfig, evaluateTaxSettings, evaluateRegistrations, findPlanPrices, evaluatePlanPrice, evaluatePortal, summariseSubscriptions } from "./stripe-setup-check.mjs";

const status = (rows, label) => rows.find(([, l]) => l.startsWith(label))?.[0];

// Tax settings: the JPY "Automatic" default is the trap.
let rows = evaluateTaxSettings({ status: "active", head_office: { address: { country: "JP" } }, defaults: { tax_behavior: "inferred_by_currency" } });
assert.equal(status(rows, "Stripe Tax"), "PASS");
assert.equal(status(rows, "Default tax behaviour"), "FAIL", "Automatic makes JPY prices tax-inclusive");
rows = evaluateTaxSettings({ status: "pending", head_office: { address: { country: "US" } }, defaults: { tax_behavior: "exclusive" } });
assert.equal(status(rows, "Stripe Tax"), "FAIL");
assert.equal(status(rows, "Head office"), "FAIL");
assert.equal(status(rows, "Default tax behaviour"), "PASS");
assert.equal(status(evaluateRegistrations({ data: [{ country: "JP", status: "active" }] }), "Registration"), "PASS");
assert.equal(status(evaluateRegistrations({ data: [{ country: "JP", status: "expired" }] }), "Registration"), "FAIL");

// The account as it is today: Standard has a USD default price and the JPY
// price; there is no Pro product.
const std = { id: "prod_std", name: "Nurevo Standard", tax_code: null, default_price: "price_usd" };
const prices = [
  { id: "price_usd", active: true, type: "recurring", currency: "usd", unit_amount: 2000, recurring: { interval: "month", interval_count: 1 }, product: std, tax_behavior: "unspecified" },
  { id: "price_jpy", active: true, type: "recurring", currency: "jpy", unit_amount: 3000, recurring: { interval: "month", interval_count: 1 }, product: std, tax_behavior: "unspecified" },
];
const found = findPlanPrices(prices);
assert.deepEqual(found.standard.map((p) => p.id), ["price_jpy"], "the JPY 3,000 monthly price is Standard, not the USD default");
assert.equal(found.pro.length, 0);
rows = evaluatePlanPrice("standard", found.standard, found.all, { defaultTaxBehavior: "exclusive" });
assert.equal(status(rows, "Standard price price_jpy"), "PASS");
assert.ok(rows.some(([s, l, d]) => s === "WARN" && /USD 20\.00 price price_usd \(the product's DEFAULT\)/.test(d)), "the stray USD default is reported");
assert.ok(rows.some(([s, , d]) => s === "WARN" && /no tax code/.test(d)));
rows = evaluatePlanPrice("standard", found.standard, found.all, { defaultTaxBehavior: "inferred_by_currency" });
assert.equal(status(rows, "Standard price price_jpy"), "FAIL", "unspecified + Automatic default would be tax-inclusive");
assert.equal(status(evaluatePlanPrice("pro", found.pro, found.all), "Pro price"), "FAIL", "a missing Pro price is reported");
const inclusive = [{ ...prices[1], id: "price_inc", tax_behavior: "inclusive" }];
assert.equal(status(evaluatePlanPrice("standard", inclusive, inclusive, { defaultTaxBehavior: "exclusive" }), "Standard price price_inc"), "FAIL");

// Portal.
assert.equal(status(evaluatePortal({ data: [] }), "Customer portal"), "FAIL");
rows = evaluatePortal({ data: [{ is_default: true, features: { payment_method_update: { enabled: true }, subscription_cancel: { enabled: true, mode: "at_period_end" }, subscription_update: { enabled: true, products: [{}, {}] }, invoice_history: { enabled: true } } }] });
assert.ok(rows.every(([s]) => s === "PASS"));

// Subscriptions: counts only; a repeating 100% coupon is a time bomb.
const s = summariseSubscriptions([
  { discounts: [{ coupon: { percent_off: 100, duration: "forever" } }] },
  { discounts: [{ source: { coupon: { percent_off: 100, duration: "repeating" } } }] },
  { discounts: [] },
]);
assert.deepEqual(s, { total: 3, free: 2, paying: 1, expiring: 1 });

// Nothing personal is ever printed.
const source = readFileSync(new URL("./stripe-setup-check.mjs", import.meta.url), "utf8");
assert.ok(!/customer_email|\.email\b|\.name\b.*customer/.test(source.replace(/product\.name/g, "")), "no customer fields are read for output");
// Exempt seller: tax behaviour and tax code do not matter, and the config says so.
rows = evaluatePlanPrice("standard", found.standard, found.all, { defaultTaxBehavior: "inferred_by_currency", exempt: true });
assert.equal(status(rows, "Standard price price_jpy"), "PASS", "an exempt seller's price is the total");
assert.ok(!rows.some(([, , d]) => /no tax code/.test(d)));
assert.equal(exemptFromConfig('{ "vars": { "STRIPE_TAX_EXEMPT": "1" } }'), true);
assert.equal(exemptFromConfig('{ "vars": { "STRIPE_AUTOMATIC_TAX": "1" } }'), false);
assert.equal(exemptFromConfig(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8")), true, "the shipped config is exempt");
console.log("stripe setup check tests passed");
