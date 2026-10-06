/**
 * Billing decides the plan.
 *
 * These are the rules that cost money if they are wrong: a cancelled customer
 * keeping paid features, a paying customer losing them, or an unrecognised
 * price silently granting a tier.
 */
import assert from "node:assert/strict";
import {
  ENTITLING_STATUSES, REVOKING_STATUSES, normalizePlan, planFromSubscription,
  pricesFromEnv, resolveSitePlan, subscriptionPriceIds, tierFromPriceIds,
} from "../worker/billing-plan.mjs";

const PRICES = { pro: "price_pro_live", standard: "price_std_live" };
const sub = (status, priceIds = ["price_pro_live"]) => ({
  status,
  items: { data: priceIds.map((id) => ({ price: { id } })) },
});

/* ---------------- price -> tier ---------------- */

assert.equal(tierFromPriceIds(["price_pro_live"], PRICES), "pro");
assert.equal(tierFromPriceIds(["price_std_live"], PRICES), "standard");
assert.equal(tierFromPriceIds("price_std_live", PRICES), "standard", "a bare id is accepted");

// An unknown price buys nothing: far likelier a misconfiguration than a new tier.
assert.equal(tierFromPriceIds(["price_something_else"], PRICES), "free", "an unrecognised price grants nothing");
assert.equal(tierFromPriceIds([], PRICES), "free", "no price grants nothing");
assert.equal(tierFromPriceIds(["price_pro_live"], {}), "free", "with no configured prices nothing is granted");
assert.equal(tierFromPriceIds(["price_std_live"], { pro: "price_pro_live" }), "free", "an unconfigured standard price grants nothing");

// A bundle containing both must not be downgraded to the lower tier.
assert.equal(tierFromPriceIds(["price_std_live", "price_pro_live"], PRICES), "pro", "the highest tier present wins");

// Empty strings in config must never match an empty-ish id.
assert.equal(tierFromPriceIds([""], { pro: "", standard: "" }), "free", "blank ids do not match blank config");

/* ---------------- reading a subscription ---------------- */

assert.deepEqual(subscriptionPriceIds(sub("active", ["a", "b"])), ["a", "b"]);
assert.deepEqual(subscriptionPriceIds({ items: { data: [{ plan: { id: "legacy" } }] } }), ["legacy"], "the legacy plan field is read");
assert.deepEqual(subscriptionPriceIds({}), [], "a malformed subscription yields no prices");
assert.deepEqual(subscriptionPriceIds(null), [], "a missing subscription yields no prices");

/* ---------------- status -> stored state ---------------- */

for (const status of ENTITLING_STATUSES) {
  const result = planFromSubscription(sub(status), PRICES);
  assert.equal(result.plan, "pro", `${status} keeps the purchased tier`);
  assert.equal(result.delivery_status, "active", `${status} keeps delivery on`);
}

// past_due is the grace period, and it is Stripe's, not ours.
const pastDue = planFromSubscription(sub("past_due"), PRICES);
assert.equal(pastDue.plan, "pro", "a failed payment does not immediately revoke the tier");
assert.equal(pastDue.contract, "past_due", "but the contract says so, so the dashboard can warn");
assert.equal(pastDue.delivery_status, "active", "delivery continues during the retry window");

assert.equal(planFromSubscription(sub("trialing"), PRICES).contract, "trial", "a trial is reported as a trial");
assert.equal(planFromSubscription(sub("active"), PRICES).contract, "active");

for (const status of REVOKING_STATUSES) {
  const result = planFromSubscription(sub(status), PRICES);
  assert.equal(result.plan, "free", `${status} revokes the tier`);
  assert.equal(result.delivery_status, "stopped", `${status} stops delivery`);
}
assert.equal(planFromSubscription(sub("unpaid"), PRICES).contract, "unpaid");
assert.equal(planFromSubscription(sub("canceled"), PRICES).contract, "cancelled");

// incomplete means the first payment has not completed. Neither a grant nor a
// revocation, so it must not disturb what the site already has.
assert.equal(planFromSubscription(sub("incomplete"), PRICES), null, "incomplete changes nothing");
assert.equal(planFromSubscription(sub(""), PRICES), null, "a missing status changes nothing");
assert.equal(planFromSubscription({}, PRICES), null, "a malformed subscription changes nothing");
assert.equal(planFromSubscription(null, PRICES), null, "no subscription changes nothing");

// An entitling status on an unknown price still grants nothing.
assert.equal(planFromSubscription(sub("active", ["price_mystery"]), PRICES).plan, "free", "an active subscription on an unknown price grants nothing");

/* ---------------- stored fields -> the plan a site has ---------------- */

assert.equal(resolveSitePlan({ plan: "pro" }), "pro", "a billed tier is the plan");
assert.equal(resolveSitePlan({ plan: "standard" }), "standard");
assert.equal(resolveSitePlan({ plan: "free" }), "free", "no billing and no grant is free");
assert.equal(resolveSitePlan({}), "free", "an empty row is free");

// The manual grant is a floor, not an override.
assert.equal(resolveSitePlan({ plan: "free", manual_plan: "pro" }), "pro", "a granted tier applies when billing grants nothing");
assert.equal(resolveSitePlan({ plan: "pro", manual_plan: "standard" }), "pro", "billing outranks the grant");
assert.equal(resolveSitePlan({ plan: "standard", manual_plan: "pro" }), "standard", "billing outranks the grant even downward");

// Cancelling drops a grandfathered site back to its grant, not to nothing.
assert.equal(resolveSitePlan({ plan: "free", manual_plan: "pro" }), "pro", "a cancelled grandfathered site keeps its grant");

// Anything unrecognised is free rather than trusted.
assert.equal(resolveSitePlan({ plan: "enterprise" }), "free", "an unknown stored plan is not honoured");
assert.equal(resolveSitePlan({ plan: null, manual_plan: "ENTERPRISE" }), "free", "an unknown grant is not honoured");
assert.equal(resolveSitePlan({ plan: "PRO" }), "pro", "case is normalised");

assert.equal(normalizePlan("pro"), "pro");
assert.equal(normalizePlan("  Standard "), "standard");
assert.equal(normalizePlan("nonsense"), "free");
assert.equal(normalizePlan(undefined), "free");

/* ---------------- env ---------------- */

assert.deepEqual(
  pricesFromEnv({ STRIPE_PRICE_ID_PRO: " price_pro ", STRIPE_PRICE_ID_STANDARD: "price_std" }),
  { pro: "price_pro", standard: "price_std" },
  "price ids are read and trimmed",
);
assert.deepEqual(pricesFromEnv({}), { pro: "", standard: "" }, "missing price config is blank, not undefined");

// With STRIPE_PRICE_ID_STANDARD unset - the state this ships in - a standard
// price cannot be sold, but a pro one still can.
const proOnly = pricesFromEnv({ STRIPE_PRICE_ID_PRO: "price_pro" });
assert.equal(tierFromPriceIds(["price_pro"], proOnly), "pro", "pro still sells with standard unconfigured");
assert.equal(tierFromPriceIds(["price_std"], proOnly), "free", "standard cannot be sold until it is configured");

console.log("billing plan tests passed");
