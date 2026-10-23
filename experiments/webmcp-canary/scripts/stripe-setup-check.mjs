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
 *   - Which active prices are the Standard (JPY 3,000/month, USD option
 *     20.00) and Pro (JPY 14,800/month, USD option 99.00) prices - their ids,
 *     to put in the Worker secrets? One Price per plan, default currency JPY,
 *     with a manual USD currency option.
 *   - Are there other active prices on those products (an old USD-only
 *     default, an old standalone JPY price) to archive, and do subscriptions
 *     still use them (then they go in STRIPE_PRICE_IDS_LEGACY_*)?
 *   - Does the customer portal let people update a card, cancel and switch
 *     between Standard and Pro?
 *   - How many live subscriptions each price has, and how many of them are
 *     fully discounted (no customer names or emails are printed).
 */
// The list prices the LP, legal notice and worker (PLAN_MONTHLY_YEN in api.mjs) use.
const PLAN_MONTHLY_YEN = Object.freeze({ standard: 3000, pro: 14800 });

import { readFileSync } from "node:fs";
import { parseWranglerConfig } from "./pro-golive-check.mjs";

const API = "https://api.stripe.com/v1";

/** Whether the Worker is configured as a consumption-tax exempt seller. */
export function exemptFromConfig(text) {
  try { return String(parseWranglerConfig(text)?.vars?.STRIPE_TAX_EXEMPT ?? "").trim() === "1"; } catch { return false; }
}

// The manual USD currency option on each price, in cents: what customers in
// the US pay exactly (Adaptive Pricing converts from JPY everywhere else).
const PLAN_MONTHLY_USD_CENTS = Object.freeze({ standard: 2000, pro: 9900 });

export const EXPECTED = Object.freeze({
  standard: { currency: "jpy", unit_amount: PLAN_MONTHLY_YEN.standard, usd_unit_amount: PLAN_MONTHLY_USD_CENTS.standard },
  pro: { currency: "jpy", unit_amount: PLAN_MONTHLY_YEN.pro, usd_unit_amount: PLAN_MONTHLY_USD_CENTS.pro },
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

/** The USD amount (cents) of a price's manual USD currency option, or null. */
export function usdOptionAmount(price) {
  const amount = price?.currency_options?.usd?.unit_amount;
  return Number.isInteger(amount) ? amount : null;
}

const productIdOf = (price) => (typeof price?.product === "object" && price.product ? price.product.id : price?.product) ?? null;
const usdOk = (plan, price) => usdOptionAmount(price) === EXPECTED[plan].usd_unit_amount;

/**
 * Find the Standard and Pro prices among active recurring prices.
 *
 * A plan's price is a monthly JPY price at the list amount. Those that also
 * carry the right USD currency option come first, so an old standalone JPY
 * price at the same amount never hides the new multi-currency one.
 */
export function findPlanPrices(prices) {
  const rows = (Array.isArray(prices) ? prices : []).filter((p) => p && p.active && p.type === "recurring");
  const monthly = (p) => p.recurring?.interval === "month" && (p.recurring?.interval_count ?? 1) === 1;
  const pick = (plan) => rows
    .filter((p) => monthly(p)
      && String(p.currency).toLowerCase() === EXPECTED[plan].currency
      && p.unit_amount === EXPECTED[plan].unit_amount)
    .sort((a, b) => Number(usdOk(plan, b)) - Number(usdOk(plan, a)));
  return { standard: pick("standard"), pro: pick("pro"), all: rows };
}

/**
 * Which price a plan should sell, and which other active prices on the same
 * product(s) are left over - the old USD-only default, the old standalone JPY
 * price - and should be archived (and, if subscribed, listed as legacy).
 */
export function selectPlanPrice(plan, matches, all) {
  const list = Array.isArray(matches) ? matches : [];
  const good = list.filter((p) => usdOk(plan, p));
  const primary = good[0] || null;
  const products = new Set((primary ? [primary] : list).map(productIdOf).filter(Boolean));
  const failing = primary ? [] : list;
  const others = (Array.isArray(all) ? all : []).filter((p) => products.has(productIdOf(p))
    && p.id !== primary?.id
    && !failing.some((f) => f.id === p.id));
  return { primary, good, others };
}

function describeAmount(price) {
  const currency = String(price.currency).toLowerCase();
  const amount = currency === "jpy" ? `JPY ${price.unit_amount}` : `${currency.toUpperCase()} ${(price.unit_amount / 100).toFixed(2)}`;
  const usd = usdOptionAmount(price);
  return currency !== "usd" && usd != null ? `${amount} (+USD ${(usd / 100).toFixed(2)} option)` : amount;
}

/** Verdicts for one plan's price(s) and the product they belong to. */
export function evaluatePlanPrice(plan, matches, all, { defaultTaxBehavior = null, exempt = false } = {}) {
  const label = plan === "pro" ? "Pro price" : "Standard price";
  const legacyVar = `STRIPE_PRICE_IDS_LEGACY_${plan.toUpperCase()}`;
  const yen = EXPECTED[plan].unit_amount.toLocaleString("en-US");
  const usd = (EXPECTED[plan].usd_unit_amount / 100).toFixed(2);
  const recipe = `currency JPY ${yen}, monthly, plus a USD currency option of ${usd}`;
  if (!matches.length) {
    return [["FAIL", label, `no active JPY ${yen}/month price: create it (${recipe})`]];
  }
  const out = [];
  const { primary, good, others } = selectPlanPrice(plan, matches, all);
  if (!primary) {
    for (const price of matches) {
      const have = usdOptionAmount(price);
      out.push(["FAIL", `${label} ${price.id}`, have == null
        ? `JPY ${yen}/month but no USD currency option: add USD ${usd} (or create a new price: ${recipe})`
        : `USD currency option is ${(have / 100).toFixed(2)}, expected ${usd}: create a new price (${recipe})`]);
    }
  }
  if (good.length > 1) out.push(["WARN", label, `${good.length} matching prices; the Worker uses only the one in its secret: ${good.map((p) => p.id).join(", ")}`]);
  for (const price of good) {
    const problems = [];
    if (!exempt && price.tax_behavior === "inclusive") problems.push("tax behaviour is Inclusive (tax would be carved out of the price) - make a new price with Exclusive");
    if (!exempt && (price.tax_behavior == null || price.tax_behavior === "unspecified") && defaultTaxBehavior !== "exclusive") {
      problems.push("tax behaviour unspecified and the account default is not Exclusive");
    }
    out.push([problems.length ? "FAIL" : "PASS", `${label} ${price.id}`, problems.length ? problems.join("; ")
      : `JPY ${yen}/month + USD ${usd} option${exempt ? " (total; no tax added)" : ", tax-exclusive"}`]);
  }
  const product = [primary, ...matches].map((p) => (typeof p?.product === "object" ? p.product : null)).find(Boolean) || null;
  if (product && !exempt && !product.tax_code) out.push(["WARN", `${label} product`, `"${product.name}" has no tax code; the account preset is used. Set it to the SaaS business-use code`]);
  for (const other of others.filter((p) => !good.some((g) => g.id === p.id))) {
    const owner = typeof other.product === "object" ? other.product : product;
    const isDefault = owner && (owner.default_price === other.id || owner.default_price?.id === other.id);
    out.push(["WARN", `${label} product`, `also has an active ${describeAmount(other)} price ${other.id}${isDefault ? " (the product's DEFAULT)" : ""}. Archive it; existing subscriptions keep working. If subscriptions use it, put its id in ${legacyVar}`]);
  }
  return out;
}

/**
 * The wrangler commands that point the Worker at these prices.
 *
 * `legacy` maps a plan to the old price ids that still have subscriptions;
 * they go into STRIPE_PRICE_IDS_LEGACY_* so a webhook for those subscriptions
 * keeps their tier.
 */
export function wranglerCommands(ids = {}, legacy = {}) {
  const lines = [];
  for (const plan of ["standard", "pro"]) {
    const name = plan === "pro" ? "Pro" : "Standard";
    lines.push(ids[plan] ? `echo ${ids[plan]} | npx wrangler secret put STRIPE_PRICE_ID_${plan.toUpperCase()}` : `# ${name} price not found`);
  }
  for (const plan of ["standard", "pro"]) {
    const old = [...new Set((legacy[plan] || []).filter(Boolean))];
    if (old.length) lines.push(`echo ${old.join(",")} | npx wrangler secret put STRIPE_PRICE_IDS_LEGACY_${plan.toUpperCase()}`);
  }
  return lines;
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

  const exempt = exemptFromConfig(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
  const settings = exempt ? {} : await get(key, "/tax/settings");
  if (exempt) {
    add([["INFO", "Consumption tax", "tax-exempt seller (STRIPE_TAX_EXEMPT=1): no Stripe Tax setup or registration needed; prices are the total"]]);
  } else {
    add(evaluateTaxSettings(settings));
    add(evaluateRegistrations(await get(key, "/tax/registrations?status=active&limit=100")));
  }

  const prices = await get(key, "/prices?active=true&type=recurring&limit=100&expand[]=data.product&expand[]=data.currency_options");
  if (prices.error) add([["FAIL", "Prices", `could not list: ${String(prices.error.message).slice(0, 120)}`]]);
  const found = findPlanPrices(prices.data);
  for (const plan of ["standard", "pro"]) add(evaluatePlanPrice(plan, found[plan], found.all, { defaultTaxBehavior: settings?.defaults?.tax_behavior, exempt }));

  add(evaluatePortal(await get(key, "/billing_portal/configurations?active=true&limit=10&expand[]=data.features.subscription_update.products")));

  const ids = {};
  const legacy = { standard: [], pro: [] };
  for (const plan of ["standard", "pro"]) {
    const { primary, others } = selectPlanPrice(plan, found[plan], found.all);
    ids[plan] = primary?.id;
    for (const price of [primary, ...others].filter(Boolean)) {
      const subs = await get(key, `/subscriptions?price=${encodeURIComponent(price.id)}&status=all&limit=100&expand[]=data.discounts&expand[]=data.discounts.source.coupon`);
      // Entitling statuses only: these are the subscriptions a webhook could downgrade.
      const live = (Array.isArray(subs.data) ? subs.data : []).filter((sub) => ["trialing", "active", "past_due"].includes(sub.status));
      const s = summariseSubscriptions(live);
      if (price !== primary && s.total) legacy[plan].push(price.id);
      add([[s.expiring ? "WARN" : "INFO", `Subscriptions on ${price.id}${price === primary ? "" : " (old price)"}`,
        `${s.total} live: ${s.free} free (100% coupon), ${s.paying} paying${s.expiring ? `, ${s.expiring} free coupon(s) are NOT forever` : ""}`]]);
    }
  }

  console.log(`Nurevo Stripe setup check (${mode} key, read-only)\n`);
  for (const [status, label, detail] of rows) console.log(`${status.padEnd(5)} ${label}${detail ? ` - ${detail}` : ""}`);
  console.log("\nWorker secrets to point at these prices (run in experiments/webmcp-canary):");
  for (const line of wranglerCommands(ids, legacy)) console.log(`  ${line}`);
  if (legacy.standard.length || legacy.pro.length) console.log("  # STRIPE_PRICE_IDS_LEGACY_* keeps subscriptions on old prices at their tier; keep them after archiving those prices.");
  console.log("\nNot readable through the API - check by hand: Settings > Payments > Adaptive Pricing is ON.");
  const failed = rows.filter(([status]) => status === "FAIL").length;
  console.log(`\n${failed ? `FAIL: ${failed} item(s) to fix` : "OK"}`);
  process.exit(failed ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => { console.error(String(error?.message || error)); process.exit(1); });
