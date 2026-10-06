/**
 * Billing decides the plan.
 *
 * Previously /api/license/bind wrote sites.plan and Stripe only wrote contract,
 * so the two could disagree indefinitely: a cancelled customer kept pro, and a
 * paying one who never redeemed a key stayed free. Here a subscription decides
 * the tier, the license only links an install to a site, and the one honest
 * exception - a tier granted without payment - is recorded on the site itself.
 *
 * Everything in this file is pure. The webhook turns a Stripe object into the
 * three stored fields, and readers turn the stored fields back into a plan;
 * neither performs a query, so both can be tested without a database.
 */

export const PLANS = Object.freeze(["free", "standard", "pro"]);

/**
 * Subscription statuses that entitle the site to the tier it bought.
 *
 * past_due is deliberately entitling. Stripe retries a failed payment for days
 * before giving up, and that retry window IS the grace period - duplicating it
 * here with our own timer would create a second, disagreeing clock. The site
 * keeps working until Stripe itself concludes the subscription is unpaid.
 */
export const ENTITLING_STATUSES = Object.freeze(["trialing", "active", "past_due"]);

/** Statuses where the customer no longer has what they bought. */
export const REVOKING_STATUSES = Object.freeze(["unpaid", "canceled", "incomplete_expired"]);

export function normalizePlan(value) {
  const plan = String(value || "").trim().toLowerCase();
  return PLANS.includes(plan) ? plan : "free";
}

/**
 * Which tier a set of Stripe price ids buys.
 *
 * An unrecognised price buys nothing. A price we have never heard of is far
 * more likely to be a misconfiguration than a new tier, and quietly promoting
 * on it would hand out paid features for whatever that price happens to be.
 */
export function tierFromPriceIds(priceIds, prices = {}) {
  const ids = (Array.isArray(priceIds) ? priceIds : [priceIds]).map((id) => String(id || "").trim()).filter(Boolean);
  const pro = String(prices.pro || "").trim();
  const standard = String(prices.standard || "").trim();
  // Highest tier present wins, so a bundle containing both is not downgraded.
  if (pro && ids.includes(pro)) return "pro";
  if (standard && ids.includes(standard)) return "standard";
  return "free";
}

/** Every price id referenced by a Stripe subscription object. */
export function subscriptionPriceIds(subscription) {
  const items = subscription?.items?.data;
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => item?.price?.id ?? item?.plan?.id ?? null)
    .filter(Boolean)
    .map(String);
}

/**
 * Turn a Stripe subscription into the three fields stored on the site.
 *
 * Returns null when the status is one we do not act on - `incomplete` means the
 * customer has not finished paying for the first time, which is neither a grant
 * nor a revocation and must not disturb whatever the site already has.
 */
export function planFromSubscription(subscription, prices = {}) {
  const status = String(subscription?.status || "").trim().toLowerCase();
  if (ENTITLING_STATUSES.includes(status)) {
    const plan = tierFromPriceIds(subscriptionPriceIds(subscription), prices);
    return {
      plan,
      // past_due is reported honestly even though the site keeps working, so the
      // dashboard can warn before Stripe gives up.
      contract: status === "trialing" ? "trial" : status === "past_due" ? "past_due" : "active",
      delivery_status: "active",
      status,
    };
  }
  if (REVOKING_STATUSES.includes(status)) {
    return {
      plan: "free",
      contract: status === "unpaid" ? "unpaid" : "cancelled",
      delivery_status: "stopped",
      status,
    };
  }
  return null;
}

/**
 * The plan a site actually has.
 *
 * `plan` is what billing last granted - the webhook writes it, and writes free
 * when a subscription is revoked. `manual_plan` is a tier granted with no
 * payment behind it: demo installs, wholesale sites invoiced outside Stripe,
 * and the canary fixtures. Billing wins when it grants anything; the manual
 * grant is the floor, not an override, so cancelling a subscription drops a
 * grandfathered site back to its granted tier rather than to nothing.
 */
export function resolveSitePlan(site = {}) {
  const billed = normalizePlan(site.plan);
  if (billed !== "free") return billed;
  return normalizePlan(site.manual_plan);
}

/** Read the configured price ids off the worker env. */
export function pricesFromEnv(env = {}) {
  return {
    pro: String(env.STRIPE_PRICE_ID_PRO || "").trim(),
    standard: String(env.STRIPE_PRICE_ID_STANDARD || "").trim(),
  };
}
