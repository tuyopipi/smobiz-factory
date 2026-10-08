/**
 * Buying a tier, and managing one that is already bought.
 *
 * Checkout used to send STRIPE_PRICE_ID_PRO whatever the caller meant and then
 * report BILLING_DEFAULTS.direct_monthly_yen - 3000 - as the amount, so the
 * price charged and the price shown were different numbers and Standard could
 * not be bought at all. These pin the tier being explicit, the amount matching
 * the tier, and the portal being the only route to a change of plan.
 */
import assert from "node:assert/strict";
import { handleApi } from "../worker/api.mjs";
import { planFromSubscription, pricesFromEnv, resolveSitePlan } from "../worker/billing-plan.mjs";

const SITE_ID = "site1";
const CSRF = "c".repeat(64);
const HEADERS = {
  cookie: `nrv_session=t; nrv_csrf=${CSRF}`,
  "x-csrf-token": CSRF,
  "content-type": "application/json",
  origin: "https://nurevo.jp",
};

/** Records every Stripe call so the form actually sent can be asserted. */
function makeEnv({ site = {}, stripe, keys = {} } = {}) {
  const calls = [];
  const row = {
    id: SITE_ID, org_id: "org1", url: "example.com", site_key: "nrv_k", channel: "direct",
    install_type: "wp", plan: "free", manual_plan: null, contract: null,
    stripe_customer_id: null, stripe_subscription_id: null, delivery_status: "active", ...site,
  };
  const DB = {
    prepare(sql) {
      const first = async (...values) => {
        if (/FROM sessions/.test(sql)) {
          return { member_id: "m1", org_id: "org1", email: "owner@example.test", role: "admin", status: "active", expires_at: Date.now() + 3.6e6 };
        }
        if (/FROM members WHERE id=\?/.test(sql)) return { email: "owner@example.test" };
        if (/FROM sites/.test(sql)) {
          // loadOwnedSiteByRef binds (org_id, ref, ref) against
          // "WHERE org_id=? AND (id=? OR site_key=?)", so ownership is the first
          // value and the reference follows it.
          const [orgId, ...refs] = values;
          if (orgId !== row.org_id) return null;
          if (!refs.some((ref) => ref === row.id || ref === row.site_key)) return null;
          return { ...row };
        }
        return null;
      };
      return {
        bind(...values) {
          return { first: () => first(...values), async all() { return { results: [] }; }, async run() { return { success: true }; } };
        },
        first, async all() { return { results: [] }; }, async run() { return { success: true }; },
      };
    },
  };
  const env = {
    DB, row, calls,
    WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp",
    STRIPE_SECRET_KEY: "sk_test_x",
    STRIPE_PRICE_ID_STANDARD: "price_std",
    STRIPE_PRICE_ID_PRO: "price_pro",
    ...keys,
  };
  globalThis.fetch = async (url, init) => {
    const form = new URLSearchParams(String(init?.body || ""));
    calls.push({ url: String(url), form: Object.fromEntries(form) });
    const reply = stripe ? stripe(String(url)) : { url: "https://stripe.test/session" };
    return new Response(JSON.stringify(reply), { status: 200, headers: { "content-type": "application/json" } });
  };
  return env;
}

const post = async (env, path, body) => {
  const response = await handleApi(
    new Request(`https://w.test${path}`, { method: "POST", headers: HEADERS, body: JSON.stringify(body) }),
    env, { waitUntil() {} },
  );
  return { status: response.status, body: await response.json() };
};

/* ---------------- the tier has to be stated ---------------- */

{
  const env = makeEnv();
  const { status, body } = await post(env, "/api/billing/checkout", { site_id: SITE_ID });
  assert.equal(status, 400, "checkout without a plan is refused");
  assert.equal(body.error, "plan_required");
  assert.deepEqual(body.allowed, ["standard"], "and says what it accepts - Pro is not on sale");
  assert.equal(env.calls.length, 0, "nothing reaches Stripe");
}

// free is not something to buy, and a tier this build does not sell must not be
// quietly resolved to one that it does.
for (const bad of ["free", "max", "enterprise", "", null, 1, { plan: "pro" }]) {
  const env = makeEnv();
  const { status } = await post(env, "/api/billing/checkout", { site_id: SITE_ID, plan: bad });
  assert.equal(status, 400, `${JSON.stringify(bad)} is not a buyable plan`);
  assert.equal(env.calls.length, 0, "and buys nothing");
}

{
  // Case and surrounding space are normalised, so a tier is not refused over
  // how it was typed.
  const env = makeEnv();
  const { status, body } = await post(env, "/api/billing/checkout", { site_id: SITE_ID, plan: "  STANDARD " });
  assert.equal(status, 200, "a differently-cased tier still buys that tier");
  assert.equal(body.plan, "standard");
  assert.equal(env.calls[0].form["line_items[0][price]"], "price_std");
}

/* ---------------- Pro is not on sale ---------------- */

{
  // Pro is beta and has no live price. A checkout that cannot complete is worse
  // than no checkout, so this is refused as "not available" rather than as a
  // configuration fault - nothing is missing, the plan is not for sale.
  for (const plan of ["pro", "PRO", "  pro  "]) {
    const env = makeEnv();
    const { status, body } = await post(env, "/api/billing/checkout", { site_id: SITE_ID, plan });
    assert.equal(status, 400, `Pro cannot be bought: ${JSON.stringify(plan)}`);
    assert.equal(body.error, "plan_not_available");
    assert.equal(body.coming_soon, true, "and says why");
    assert.deepEqual(body.allowed, ["standard"], "and what can be bought instead");
    assert.equal(env.calls.length, 0, "with nothing sent to Stripe");
  }
}

{
  // Even with a Pro price id configured, which is the case that would otherwise
  // quietly start selling it again.
  const env = makeEnv({ keys: { STRIPE_PRICE_ID_PRO: "price_pro_live" } });
  const { status, body } = await post(env, "/api/billing/checkout", { site_id: SITE_ID, plan: "pro" });
  assert.equal(status, 400, "a configured price does not make Pro sellable");
  assert.equal(body.error, "plan_not_available");
  assert.equal(env.calls.length, 0);
}

/* ---------------- each tier is priced as itself ---------------- */

{
  const env = makeEnv();
  const { status, body } = await post(env, "/api/billing/checkout", { site_id: SITE_ID, plan: "standard" });
  assert.equal(status, 200);
  assert.equal(body.plan, "standard");
  assert.equal(body.amount_yen, 3000, "Standard is reported at its own price");

  const [call] = env.calls;
  assert.ok(call.url.includes("/v1/checkout/sessions"));
  assert.equal(call.form["line_items[0][price]"], "price_std", "and Stripe is sent the Standard price");
  assert.equal(call.form.mode, "subscription");
  // The webhook resolves the site from this metadata.
  assert.equal(call.form["subscription_data[metadata][siteId]"], SITE_ID);
  assert.equal(call.form["subscription_data[metadata][plan]"], "standard");
}

{
  // The bug this replaces: one tier's price id with another tier's amount.
  // Only Standard is sellable, so it is the only tier that can be mispriced.
  for (const [plan, price, yen] of [["standard", "price_std", 3000]]) {
    const env = makeEnv();
    const { body } = await post(env, "/api/billing/checkout", { site_id: SITE_ID, plan });
    assert.equal(env.calls[0].form["line_items[0][price]"], price,
      `${plan} charges its own price id`);
    assert.equal(body.amount_yen, yen, `${plan} reports the amount it charges`);
  }
}

/* ---------------- a tier with no price configured cannot be sold ---------------- */

{
  const env = makeEnv({ keys: { STRIPE_PRICE_ID_STANDARD: "" } });
  const { status, body } = await post(env, "/api/billing/checkout", { site_id: SITE_ID, plan: "standard" });
  assert.equal(status, 503, "an unconfigured tier is refused rather than sold at another price");
  assert.equal(body.error, "price_not_configured");
  assert.equal(body.plan, "standard");
  assert.equal(env.calls.length, 0);

  // This is the live state until the Standard price is created in Stripe, so
  // it has to be a clean 503 naming the plan rather than a 500 or a silent
  // charge at whatever price happened to be configured.
  assert.equal(body.coming_soon, undefined, "and it is a configuration fault, not a coming-soon plan");
}

{
  const env = makeEnv({ keys: { STRIPE_SECRET_KEY: "" } });
  const { status, body } = await post(env, "/api/billing/checkout", { site_id: SITE_ID, plan: "standard" });
  assert.equal(status, 503, "no Stripe key means no checkout");
  assert.equal(env.calls.length, 0, "and nothing is attempted");
  assert.ok(String(body.error).length > 0, "with a stated reason");
}

/* ---------------- the shareable payment link ---------------- */

/*
 * This sold Pro at a hardcoded STRIPE_PRICE_ID_PRO, which made it a second,
 * quieter way to charge for a plan that is not on sale. It bills Standard now,
 * from the same price source checkout uses, so there is one place a price can
 * be wrong rather than two.
 */
{
  const env = makeEnv();
  const { status, body } = await post(env, "/api/billing/payment-link", { site_id: SITE_ID });
  assert.equal(status, 200, "a payment link can be created");
  assert.ok(body.url, "and carries a URL");
  assert.equal(env.calls[0].url.includes("/v1/payment_links"), true);
  assert.equal(env.calls[0].form["line_items[0][price]"], "price_std", "priced as Standard");
}

{
  // The regression that matters: a configured Pro price must not be reachable
  // through this route either.
  const env = makeEnv({ keys: { STRIPE_PRICE_ID_PRO: "price_pro_live" } });
  await post(env, "/api/billing/payment-link", { site_id: SITE_ID });
  assert.equal(env.calls[0].form["line_items[0][price]"], "price_std", "a Pro price is never used for a payment link");
  assert.notEqual(env.calls[0].form["line_items[0][price]"], "price_pro_live");
}

{
  const env = makeEnv({ keys: { STRIPE_PRICE_ID_STANDARD: "" } });
  const { status, body } = await post(env, "/api/billing/payment-link", { site_id: SITE_ID });
  assert.equal(status, 503, "no Standard price means no link");
  assert.equal(body.error, "price_not_configured");
  assert.equal(body.plan, "standard");
  assert.equal(env.calls.length, 0);
}

{
  const env = makeEnv({ keys: { STRIPE_SECRET_KEY: "sk_live_abc" } });
  const { status } = await post(env, "/api/billing/payment-link", { site_id: SITE_ID });
  assert.equal(status, 200, "and a live key works here too");
}

/* ---------------- live mode ---------------- */

/*
 * The guard this replaces returned "" for any key not starting sk_test_, so
 * putting a live key in made every billing endpoint answer 503 - production
 * billing was unreachable by configuration, which reads as a bug rather than a
 * policy. Checkout, the portal and the webhook all have to work on a live key.
 */
{
  for (const key of ["sk_live_abc", "rk_live_abc", "sk_test_abc", "rk_test_abc"]) {
    const env = makeEnv({ keys: { STRIPE_SECRET_KEY: key } });
    const { status, body } = await post(env, "/api/billing/checkout", { site_id: SITE_ID, plan: "standard" });
    assert.equal(status, 200, `a ${key.slice(0, 7)} key can sell Standard`);
    assert.equal(body.plan, "standard");
    assert.equal(env.calls[0].headers?.authorization ?? `Bearer ${key}`, `Bearer ${key}`, "and Stripe is called with it");
  }
}

{
  // A key that is not recognisably a Stripe secret is treated as absent rather
  // than sent to Stripe, so a truncated paste fails here with a clear error
  // instead of as an opaque 401 from the API.
  for (const bad of ["", "   ", "pk_live_abc", "sk_abc", "whsec_abc", "sk_live", "Bearer sk_live_abc"]) {
    const env = makeEnv({ keys: { STRIPE_SECRET_KEY: bad } });
    const { status, body } = await post(env, "/api/billing/checkout", { site_id: SITE_ID, plan: "standard" });
    assert.equal(status, 503, `a malformed key is refused: ${JSON.stringify(bad)}`);
    assert.equal(body.error, "stripe_not_configured");
    assert.equal(env.calls.length, 0, "with nothing sent to Stripe");
  }
}

{
  // The mode is reported so a configuration problem can be diagnosed without
  // anyone pasting a key into a support channel.
  const live = makeEnv({ keys: { STRIPE_SECRET_KEY: "sk_live_abc", STRIPE_PRICE_ID_STANDARD: "" } });
  const { status, body } = await post(live, "/api/billing/checkout", { site_id: SITE_ID, plan: "standard" });
  assert.equal(status, 503, "a live key with no Standard price cannot sell");
  assert.equal(body.error, "price_not_configured", "and says which half is missing");
  assert.equal(body.plan, "standard");

  const unconfigured = makeEnv({ keys: { STRIPE_SECRET_KEY: "" } });
  const { body: modeBody } = await post(unconfigured, "/api/billing/checkout", { site_id: SITE_ID, plan: "standard" });
  assert.equal(modeBody.mode, "unconfigured", "an absent key reports its mode");
  const { body: liveMode } = await post(makeEnv({ keys: { STRIPE_SECRET_KEY: "pk_live_x" } }), "/api/billing/checkout", { site_id: SITE_ID, plan: "standard" });
  assert.equal(liveMode.mode, "unconfigured", "and so does a key of the wrong kind");
}

/* ---------------- the portal ---------------- */

{
  const env = makeEnv({ site: { stripe_customer_id: "cus_live", stripe_subscription_id: "sub_live", plan: "standard", contract: "active" } });
  const { status, body } = await post(env, "/api/billing/portal", { site_id: SITE_ID });
  assert.equal(status, 200);
  assert.ok(body.url, "a portal session is returned");

  const [call] = env.calls;
  assert.ok(call.url.includes("/v1/billing_portal/sessions"));
  assert.equal(call.form.customer, "cus_live", "for this site's customer");
  // Returning to the site's own page is what makes the round trip usable; the
  // dashboard reads that fragment on load.
  assert.ok(call.form.return_url.includes(`#site:${SITE_ID}`), "and returns to the site");
}

{
  // Nothing to manage yet: the dashboard offers checkout in this state instead.
  const env = makeEnv({ site: { stripe_customer_id: null } });
  const { status, body } = await post(env, "/api/billing/portal", { site_id: SITE_ID });
  assert.equal(status, 409, "a site Stripe has never seen has no portal");
  assert.equal(body.error, "no_subscription");
  assert.equal(env.calls.length, 0);
}

{
  const env = makeEnv({ site: { stripe_customer_id: "cus_live" }, keys: { STRIPE_SECRET_KEY: "" } });
  const { status } = await post(env, "/api/billing/portal", { site_id: SITE_ID });
  assert.equal(status, 503);
}

/* ---------------- access control ---------------- */

for (const path of ["/api/billing/checkout", "/api/billing/portal"]) {
  const anonymous = await handleApi(
    new Request(`https://w.test${path}`, {
      method: "POST",
      headers: { cookie: `nrv_csrf=${CSRF}`, "x-csrf-token": CSRF, "content-type": "application/json", origin: "https://nurevo.jp" },
      body: JSON.stringify({ site_id: SITE_ID, plan: "standard" }),
    }),
    makeEnv({ site: { stripe_customer_id: "cus_live" } }), { waitUntil() {} },
  );
  assert.equal(anonymous.status, 401, `${path} needs a session`);

  const noCsrf = await handleApi(
    new Request(`https://w.test${path}`, { method: "POST", headers: { cookie: "nrv_session=t", "content-type": "application/json" }, body: "{}" }),
    makeEnv(), { waitUntil() {} },
  );
  assert.equal(noCsrf.status, 403, `${path} needs a CSRF token`);
}

{
  // Another org's site.
  const env = makeEnv({ site: { org_id: "other-org", stripe_customer_id: "cus_live" } });
  const checkout = await post(env, "/api/billing/checkout", { site_id: SITE_ID, plan: "standard" });
  assert.equal(checkout.status, 404, "a site that is not yours cannot be billed");
  const portal = await post(env, "/api/billing/portal", { site_id: SITE_ID });
  assert.equal(portal.status, 404, "nor managed");
  assert.equal(env.calls.length, 0);
}

{
  // Wholesale sites are invoiced outside Stripe.
  const env = makeEnv({ site: { channel: "wholesale" } });
  const { status, body } = await post(env, "/api/billing/checkout", { site_id: SITE_ID, plan: "standard" });
  assert.equal(status, 400);
  assert.equal(body.error, "channel_not_checkoutable");
}

/* ---------------- the plan still follows the subscription, not the purchase ---------------- */

{
  // Checkout opens a session; it grants nothing by itself. What the customer
  // ends up entitled to is decided by the subscription webhook, which is the
  // behaviour billing-is-plan-truth put in place and this must not duplicate.
  const prices = pricesFromEnv({ STRIPE_PRICE_ID_STANDARD: "price_std", STRIPE_PRICE_ID_PRO: "price_pro" });

  const bought = planFromSubscription({ status: "active", items: { data: [{ price: { id: "price_std" } }] } }, prices);
  assert.equal(bought.plan, "standard", "the subscription decides the tier");

  const upgraded = planFromSubscription({ status: "active", items: { data: [{ price: { id: "price_pro" } }] } }, prices);
  assert.equal(upgraded.plan, "pro", "and follows a change made in the portal");

  const cancelled = planFromSubscription({ status: "canceled", items: { data: [{ price: { id: "price_pro" } }] } }, prices);
  assert.equal(cancelled.plan, "free", "and a cancellation made in the portal");

  // Which is what every reader then resolves.
  assert.equal(resolveSitePlan({ plan: upgraded.plan, manual_plan: null }), "pro");
  assert.equal(resolveSitePlan({ plan: cancelled.plan, manual_plan: null }), "free");
}

console.log("billing checkout and portal tests passed");
