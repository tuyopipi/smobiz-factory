// Verdicts of the read-only Stripe setup check, on fixtures shaped like the API.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { exemptFromConfig, evaluateTaxSettings, evaluateRegistrations, findPlanPrices, evaluatePlanPrice, selectPlanPrice, usdOptionAmount, wranglerCommands, evaluatePortal, summariseSubscriptions } from "./stripe-setup-check.mjs";

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

// The account during the switch: Standard has the old USD-only default price,
// the old standalone JPY price, and the new JPY price with a USD option.
const std = { id: "prod_std", name: "Nurevo Standard", tax_code: null, default_price: "price_usd" };
const monthly = { interval: "month", interval_count: 1 };
const prices = [
  { id: "price_usd", active: true, type: "recurring", currency: "usd", unit_amount: 2000, recurring: monthly, product: std, tax_behavior: "unspecified" },
  { id: "price_jpy_old", active: true, type: "recurring", currency: "jpy", unit_amount: 3000, recurring: monthly, product: std, tax_behavior: "unspecified" },
  { id: "price_jpy", active: true, type: "recurring", currency: "jpy", unit_amount: 3000, recurring: monthly, product: std, tax_behavior: "unspecified", currency_options: { jpy: { unit_amount: 3000 }, usd: { unit_amount: 2000 } } },
];
const found = findPlanPrices(prices);
assert.deepEqual(found.standard.map((p) => p.id), ["price_jpy", "price_jpy_old"], "JPY 3,000 monthly prices are Standard candidates, the one with the USD option first");
assert.equal(found.pro.length, 0);
assert.equal(usdOptionAmount(prices[2]), 2000);
assert.equal(usdOptionAmount(prices[1]), null);
const sel = selectPlanPrice("standard", found.standard, found.all);
assert.equal(sel.primary.id, "price_jpy", "the multi-currency price is the one to sell");
assert.deepEqual(sel.others.map((p) => p.id).sort(), ["price_jpy_old", "price_usd"], "both old prices are left over");
rows = evaluatePlanPrice("standard", found.standard, found.all, { defaultTaxBehavior: "exclusive" });
assert.equal(status(rows, "Standard price price_jpy"), "PASS");
assert.ok(rows.find(([, l]) => l === "Standard price price_jpy")[2].includes("USD 20.00 option"));
assert.ok(!rows.some(([s, l]) => s === "FAIL"), "old prices are a warning, not a failure");
const usdWarn = rows.find(([s, , d]) => s === "WARN" && /USD 20\.00 price price_usd \(the product's DEFAULT\)/.test(d));
assert.ok(usdWarn, "the stray USD default is reported");
assert.match(usdWarn[2], /Archive it; existing subscriptions keep working/);
assert.match(usdWarn[2], /STRIPE_PRICE_IDS_LEGACY_STANDARD/);
assert.ok(rows.some(([s, , d]) => s === "WARN" && /JPY 3000 price price_jpy_old/.test(d) && /STRIPE_PRICE_IDS_LEGACY_STANDARD/.test(d)), "the old standalone JPY price is reported too");
assert.ok(rows.some(([s, , d]) => s === "WARN" && /no tax code/.test(d)));
rows = evaluatePlanPrice("standard", found.standard, found.all, { defaultTaxBehavior: "inferred_by_currency" });
assert.equal(status(rows, "Standard price price_jpy"), "FAIL", "unspecified + Automatic default would be tax-inclusive");
assert.equal(status(evaluatePlanPrice("pro", found.pro, found.all), "Pro price"), "FAIL", "a missing Pro price is reported");
const inclusive = [{ ...prices[2], id: "price_inc", tax_behavior: "inclusive" }];
assert.equal(status(evaluatePlanPrice("standard", inclusive, inclusive, { defaultTaxBehavior: "exclusive" }), "Standard price price_inc"), "FAIL");

// The USD option is required, and must be exactly the US price.
{
  const onlyOld = findPlanPrices(prices.slice(0, 2));
  rows = evaluatePlanPrice("standard", onlyOld.standard, onlyOld.all, { exempt: true });
  const fail = rows.find(([s, l]) => s === "FAIL" && l === "Standard price price_jpy_old");
  assert.ok(fail, "a JPY price without a USD option fails");
  assert.match(fail[2], /no USD currency option/);
  assert.equal(selectPlanPrice("standard", onlyOld.standard, onlyOld.all).primary, null, "and is not offered as the price to sell");

  const pro = { id: "prod_pro", name: "Nurevo Pro", default_price: "price_pro" };
  const wrong = [{ id: "price_pro", active: true, type: "recurring", currency: "jpy", unit_amount: 14800, recurring: monthly, product: pro, currency_options: { usd: { unit_amount: 10000 } } }];
  rows = evaluatePlanPrice("pro", findPlanPrices(wrong).pro, wrong, { exempt: true });
  assert.equal(status(rows, "Pro price price_pro"), "FAIL", "a wrong USD amount fails");
  assert.match(rows[0][2], /USD currency option is 100\.00, expected 99\.00/);

  const right = [{ ...wrong[0], currency_options: { usd: { unit_amount: 9900 } } }];
  rows = evaluatePlanPrice("pro", findPlanPrices(right).pro, right, { exempt: true });
  assert.equal(status(rows, "Pro price price_pro"), "PASS", "JPY 14,800 with a USD 99 option passes");
  assert.equal(rows.length, 1, "and with no other prices there is nothing to warn about");
}

// The commands printed at the end.
assert.deepEqual(wranglerCommands({ standard: "price_jpy", pro: "price_pro" }), [
  "echo price_jpy | npx wrangler secret put STRIPE_PRICE_ID_STANDARD",
  "echo price_pro | npx wrangler secret put STRIPE_PRICE_ID_PRO",
], "no legacy command without old subscribed prices");
assert.deepEqual(wranglerCommands({ standard: "price_jpy" }, { standard: ["price_jpy_old", "price_usd", "price_jpy_old"], pro: [] }), [
  "echo price_jpy | npx wrangler secret put STRIPE_PRICE_ID_STANDARD",
  "# Pro price not found",
  "echo price_jpy_old,price_usd | npx wrangler secret put STRIPE_PRICE_IDS_LEGACY_STANDARD",
], "old prices with subscriptions become the legacy secret");

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
