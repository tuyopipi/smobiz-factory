/**
 * Read-only check of the Stripe account behind Nurevo billing.
 *
 *   STRIPE_SECRET_KEY=sk_live_... npm run stripe:check
 *
 * Put the key in your own shell only; it is never printed, stored or sent
 * anywhere but api.stripe.com, and the script makes GET requests only.
 *
 * It answers the questions that otherwise mean clicking through the
 * dashboard:
 *   - Is Stripe Tax active, with the head office in Japan, a Japanese
 *     registration and prices treated as tax-exclusive by default?
 *   - Which active prices are the Standard (JPY 3,000/month) and Pro
 *     (JPY 14,800/month) prices - their ids, to put in the Worker secrets?
 *   - Are there other prices on those products that could be picked by
 *     mistake (for example a USD default price)?
 *   - Does the customer portal let people update a card, cancel and switch
 *     between Standard and Pro?
 *   - How many live subscriptions each price has, and how many of them are
 *     fully discounted (no customer names or emails are printed).
 */
// The list prices the LP, legal notice and worker (PLAN_MONTHLY_YEN in api.mjs) use.
const PLAN_MONTHLY_YEN = Object.freeze({ standard: 3000, pro: 14800 });

const API = "https://api.stripe.com/v1";

export const EXPECTED = Object.freeze({
  standard: { currency: "jpy", unit_amount: PLAN_MONTHLY_YEN.standard },
  pro: { currency: "jpy", unit_amount: PLAN_MONTHLY_YEN.pro },
});

/** Stripe Tax settings: active, head office in Japan, tax-exclusive default. */
export function evaluateTaxSettings(settings) {
  const out = [];
  if (!settings || settings.error) {
    out.push(["FAIL", "Stripe Tax settings", settings?.error?.message ? `could not read: ${String(settings.error.message).slice(0, 120)}` : "could not read"]);
    return out;
  }
  out.push(settings.status === "active"
    ? ["PASS", "Stripe Tax", "active"]
    : ["FAIL", "Stripe Tax", `status is ${JSON.stringify(settings.status)}; activate it in Settings > Tax`]);
  const country = settings.head_office?.address?.country;
  out.push(country === "JP"
    ? ["PASS", "Head office", "Japan"]
    : ["FAIL", "Head office", `country is ${JSON.stringify(country || null)}; set the business address in Japan`]);
  const behavior = settings.defaults?.tax_behavior;
  if (behavior === "exclusive") out.push(["PASS", "Default tax behaviour", "exclusive (prices are before tax)"]);
  else if (behavior === "inferred_by_currency") out.push(["FAIL", "Default tax behaviour", 'Automatic treats JPY prices as tax-INCLUSIVE: set "Include tax in prices" to Exclusive']);
  else out.push(["FAIL", "Default tax behaviour", `${JSON.stringify(behavior || null)}; set "Include tax in prices" to Exclusive`]);
  return out;
}

/** Tax registrations: an active Japanese one is required for consumption tax. */
export function evaluateRegistrations(list) {
  const rows = Array.isArray(list?.data) ? list.data : [];
  const active = rows.filter((row) => row.status === "active");
  const japan = active.find((row) => row.country === "JP");
  const out = [japan
    ? ["PASS", "Registration", "Japan (consumption tax) active"]
    : ["FAIL", "Registration", "no active Japan registration: add it in Settings > Tax > Registrations"]];
  const others = active.filter((row) => row.country !== "JP").map((row) => row.country);
  if (others.length) out.push(["INFO", "Other registrations", others.join(", ")]);
  return out;
}

/** Find the Standard and Pro prices among active recurring prices. */
export function findPlanPrices(prices) {
  const rows = (Array.isArray(prices) ? prices : []).filter((p) => p && p.active && p.type === "recurring");
  const monthly = (p) => p.recurring?.interval === "month" && (p.recurring?.interval_count ?? 1) === 1;
  const pick = (plan) => rows.filter((p) => monthly(p)
    && String(p.currency).toLowerCase() === EXPECTED[plan].currency
    && p.unit_amount === EXPECTED[plan].unit_amount);
  return { standard: pick("standard"), pro: pick("pro"), all: rows };
}

/** Verdicts for one plan's price(s) and the product they belong to. */
export function evaluatePlanPrice(plan, matches, all, { defaultTaxBehavior = null } = {}) {
  const label = plan === "pro" ? "Pro price" : "Standard price";
  const yen = EXPECTED[plan].unit_amount.toLocaleString("en-US");
  if (!matches.length) {
    return [["FAIL", label, `no active JPY ${yen}/month price: create it (currency JPY, ${yen}, monthly, tax behaviour Exclusive)`]];
  }
  const out = [];
  if (matches.length > 1) out.push(["WARN", label, `${matches.length} matching prices; the Worker uses only the one in its secret: ${matches.map((p) => p.id).join(", ")}`]);
  for (const price of matches) {
    const problems = [];
    if (price.tax_behavior === "inclusive") problems.push("tax behaviour is Inclusive (tax would be carved out of the price) - make a new price with Exclusive");
    if ((price.tax_behavior == null || price.tax_behavior === "unspecified") && defaultTaxBehavior !== "exclusive") {
      problems.push("tax behaviour unspecified and the account default is not Exclusive");
    }
    out.push([problems.length ? "FAIL" : "PASS", `${label} ${price.id}`, problems.length ? problems.join("; ") : `JPY ${yen}/month, tax-exclusive`]);
    const product = typeof price.product === "object" ? price.product : null;
    if (product) {
      if (!product.tax_code) out.push(["WARN", `${label} product`, `"${product.name}" has no tax code; the account preset is used. Set it to the SaaS business-use code`]);
      const siblings = all.filter((p) => (typeof p.product === "object" ? p.product.id : p.product) === product.id && p.id !== price.id);
      for (const other of siblings) {
        const amount = String(other.currency).toLowerCase() === "jpy" ? `JPY ${other.unit_amount}` : `${String(other.currency).toUpperCase()} ${(other.unit_amount / 100).toFixed(2)}`;
        const isDefault = product.default_price === other.id || product.default_price?.id === other.id;
        out.push(["WARN", `${label} product`, `also has an active ${amount} price ${other.id}${isDefault ? " (the product's DEFAULT)" : ""}. With Adaptive Pricing the JPY price is shown in local currency, so archive extra currencies or make the JPY price the default`]);
      }
    }
  }
  return out;
}

/** Customer portal: what "Manage billing" in the dashboard opens. */
export function evaluatePortal(list) {
  const configs = Array.isArray(list?.data) ? list.data : [];
  const config = configs.find((c) => c.is_default) || configs[0];
  if (!config) return [["FAIL", "Customer portal", "not configured: Settings > Billing > Customer portal"]];
  const f = config.features || {};
  const out = [];
  out.push(f.payment_method_update?.enabled ? ["PASS", "Portal: update card", "on"] : ["FAIL", "Portal: update card", "off"]);
  out.push(f.subscription_cancel?.enabled ? ["PASS", "Portal: cancel", `on (${f.subscription_cancel.mode || "?"})`] : ["FAIL", "Portal: cancel", "off"]);
  const update = f.subscription_update || {};
  const products = Array.isArray(update.products) ? update.products.length : 0;
  out.push(update.enabled && products >= 2
    ? ["PASS", "Portal: switch plan", `on, ${products} products`]
    : ["WARN", "Portal: switch plan", update.enabled ? `on but lists ${products} product(s); add Standard and Pro` : "off: Standard <-> Pro changes need it"]);
  out.push(f.invoice_history?.enabled ? ["PASS", "Portal: invoices", "on"] : ["WARN", "Portal: invoices", "off"]);
  return out;
}

/** Subscriptions on a price: counts only, never who. */
export function summariseSubscriptions(subs) {
  const rows = Array.isArray(subs) ? subs : [];
  let free = 0;
  let paying = 0;
  let expiring = 0;
  for (const sub of rows) {
    const discounts = [sub.discount, ...(Array.isArray(sub.discounts) ? sub.discounts : [])].filter((d) => d && typeof d === "object");
    // Older API versions put the coupon on the discount, newer ones under source.
    const couponOf = (d) => (d.coupon && typeof d.coupon === "object" ? d.coupon : (d.source?.coupon && typeof d.source.coupon === "object" ? d.source.coupon : null));
    const full = discounts.map(couponOf).find((c) => c && c.percent_off === 100);
    if (full) {
      free += 1;
      if (full.duration !== "forever") expiring += 1;
    } else paying += 1;
  }
  return { total: rows.length, free, paying, expiring };
}

async function get(key, path) {
  const response = await fetch(`${API}${path}`, { headers: { authorization: `Bearer ${key}` } });
  let data = {};
  try { data = await response.json(); } catch { data = {}; }
  return data;
}

async function main() {
  const key = String(process.env.STRIPE_SECRET_KEY || "").trim();
  if (!/^(sk|rk)_(live|test)_/.test(key)) {
    console.log("Set STRIPE_SECRET_KEY (sk_live_... or a restricted rk_live_... key with read access) in this shell and run again.");
    process.exit(2);
  }
  const mode = key.includes("_live_") ? "LIVE" : "TEST";
  const rows = [];
  const add = (list) => rows.push(...list);

  const settings = await get(key, "/tax/settings");
  add(evaluateTaxSettings(settings));
  add(evaluateRegistrations(await get(key, "/tax/registrations?status=active&limit=100")));

  const prices = await get(key, "/prices?active=true&type=recurring&limit=100&expand[]=data.product");
  if (prices.error) add([["FAIL", "Prices", `could not list: ${String(prices.error.message).slice(0, 120)}`]]);
  const found = findPlanPrices(prices.data);
  for (const plan of ["standard", "pro"]) add(evaluatePlanPrice(plan, found[plan], found.all, { defaultTaxBehavior: settings?.defaults?.tax_behavior }));

  add(evaluatePortal(await get(key, "/billing_portal/configurations?active=true&limit=10&expand[]=data.features.subscription_update.products")));

  for (const plan of ["standard", "pro"]) {
    for (const price of found[plan]) {
      const subs = await get(key, `/subscriptions?price=${encodeURIComponent(price.id)}&status=active&limit=100&expand[]=data.discounts&expand[]=data.discounts.source.coupon`);
      const s = summariseSubscriptions(subs.data);
      add([[s.expiring ? "WARN" : "INFO", `Subscriptions on ${price.id}`,
        `${s.total} active: ${s.free} free (100% coupon), ${s.paying} paying${s.expiring ? `, ${s.expiring} free coupon(s) are NOT forever` : ""}`]]);
    }
  }

  console.log(`Nurevo Stripe setup check (${mode} key, read-only)\n`);
  for (const [status, label, detail] of rows) console.log(`${status.padEnd(5)} ${label}${detail ? ` - ${detail}` : ""}`);
  const ids = { standard: found.standard[0]?.id, pro: found.pro[0]?.id };
  console.log("\nWorker secrets to point at these prices (run in experiments/webmcp-canary):");
  console.log(`  ${ids.standard ? `echo ${ids.standard} | npx wrangler secret put STRIPE_PRICE_ID_STANDARD` : "# Standard price not found"}`);
  console.log(`  ${ids.pro ? `echo ${ids.pro} | npx wrangler secret put STRIPE_PRICE_ID_PRO` : "# Pro price not found"}`);
  console.log("\nNot readable through the API - check by hand: Settings > Payments > Adaptive Pricing is ON.");
  const failed = rows.filter(([status]) => status === "FAIL").length;
  console.log(`\n${failed ? `FAIL: ${failed} item(s) to fix` : "OK"}`);
  process.exit(failed ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => { console.error(String(error?.message || error)); process.exit(1); });
