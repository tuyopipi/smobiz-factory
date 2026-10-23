/**
 * Pro goes on sale behind an explicit switch.
 *
 * PRO_CHECKOUT_ENABLED="1" AND STRIPE_PRICE_ID_PRO must both be present. With
 * either missing the checkout answers exactly as it did while Pro was coming
 * soon, and the dashboard / SoV upgrade info say so too.
 */
import assert from "node:assert/strict";
import { handleApi } from "../worker/api.mjs";
import { proCheckoutEnabled } from "../worker/billing-plan.mjs";

const SITE_ID = "site1";
const CSRF = "c".repeat(64);
const HEADERS = {
  cookie: `nrv_session=t; nrv_csrf=${CSRF}`,
  "x-csrf-token": CSRF,
  "content-type": "application/json",
  origin: "https://nurevo.jp",
};

function makeEnv(keys = {}, rowPatch = {}) {
  const calls = [];
  const row = {
    id: SITE_ID, org_id: "org1", url: "example.com", site_key: "nrv_k", channel: "direct",
    install_type: "wp", plan: "free", manual_plan: null, contract: null,
    stripe_customer_id: null, stripe_subscription_id: null, delivery_status: "active",
    ...rowPatch,
  };
  const DB = {
    prepare(sql) {
      const first = async (...values) => {
        if (/FROM sessions/.test(sql)) {
          return { member_id: "m1", org_id: "org1", email: "owner@example.test", role: "admin", status: "active", expires_at: Date.now() + 3.6e6 };
        }
        if (/FROM members WHERE id=\?/.test(sql)) return { email: "owner@example.test" };
        if (/FROM sites/.test(sql)) {
          // loadOwnedSite binds (id, org_id, ...) against "WHERE id=? AND org_id=?".
          if (/WHERE id=\?/.test(sql)) return values[0] === SITE_ID && (values[1] === undefined || values[1] === row.org_id) ? { ...row } : null;
          const [orgId, ...refs] = values;
          if (orgId !== row.org_id) return null;
          if (!refs.some((ref) => ref === row.id || ref === row.site_key)) return null;
          return { ...row };
        }
        return null;
      };
      const all = async () => ({ results: [] });
      return {
        bind(...values) { return { first: () => first(...values), all, async run() { return { success: true }; } }; },
        first, all, async run() { return { success: true }; },
      };
    },
  };
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), form: Object.fromEntries(new URLSearchParams(String(init?.body || ""))) });
    return new Response(JSON.stringify({ url: "https://stripe.test/session" }), { status: 200, headers: { "content-type": "application/json" } });
  };
  return {
    DB, calls,
    WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp",
    STRIPE_SECRET_KEY: "sk_test_x",
    STRIPE_PRICE_ID_STANDARD: "price_std",
    ...keys,
  };
}

const request = async (env, path, { method = "POST", body } = {}) => {
  const response = await handleApi(
    new Request(`https://w.test${path}`, { method, headers: HEADERS, body: body === undefined ? undefined : JSON.stringify(body) }),
    env, { waitUntil() {} },
  );
  return { status: response.status, body: await response.json() };
};

/* ---------------- the pure switch ---------------- */

assert.equal(proCheckoutEnabled({}), false, "default: off");
assert.equal(proCheckoutEnabled({ STRIPE_PRICE_ID_PRO: "price_pro" }), false, "a price alone does not sell Pro");
assert.equal(proCheckoutEnabled({ PRO_CHECKOUT_ENABLED: "1" }), false, "the flag alone does not sell Pro");
assert.equal(proCheckoutEnabled({ PRO_CHECKOUT_ENABLED: "1", STRIPE_PRICE_ID_PRO: "  " }), false, "a blank price is no price");
for (const value of ["true", "yes", "0", "on", ""]) {
  assert.equal(proCheckoutEnabled({ PRO_CHECKOUT_ENABLED: value, STRIPE_PRICE_ID_PRO: "price_pro" }), false, `${JSON.stringify(value)} is not the switch`);
}
assert.equal(proCheckoutEnabled({ PRO_CHECKOUT_ENABLED: "1", STRIPE_PRICE_ID_PRO: "price_pro" }), true, "both: on");
assert.equal(proCheckoutEnabled({ PRO_CHECKOUT_ENABLED: " 1 ", STRIPE_PRICE_ID_PRO: "price_pro" }), true, "whitespace tolerated");

/* ---------------- checkout: flag off (unchanged behaviour) ---------------- */

for (const keys of [{}, { STRIPE_PRICE_ID_PRO: "price_pro" }]) {
  const env = makeEnv(keys);
  const { status, body } = await request(env, "/api/billing/checkout", { body: { site_id: SITE_ID, plan: "pro" } });
  assert.equal(status, 400);
  assert.deepEqual(body, { error: "plan_not_available", plan: "pro", coming_soon: true, allowed: ["standard"] },
    "flag off keeps the exact coming-soon error shape");
  assert.equal(env.calls.length, 0);
}

/* ---------------- checkout: flag on without a price ---------------- */

{
  const env = makeEnv({ PRO_CHECKOUT_ENABLED: "1" });
  const { status, body } = await request(env, "/api/billing/checkout", { body: { site_id: SITE_ID, plan: "pro" } });
  assert.equal(status, 400, "the flag without a price still refuses");
  assert.deepEqual(body, { error: "plan_not_available", plan: "pro", coming_soon: true, allowed: ["standard"] });
  assert.equal(env.calls.length, 0, "nothing reaches Stripe");
}

/* ---------------- checkout: flag on with a price ---------------- */

{
  const env = makeEnv({ PRO_CHECKOUT_ENABLED: "1", STRIPE_PRICE_ID_PRO: "price_pro" });
  const { status, body } = await request(env, "/api/billing/checkout", { body: { site_id: SITE_ID, plan: " PRO " } });
  assert.equal(status, 200, "Pro can be bought");
  assert.equal(body.plan, "pro");
  assert.equal(body.amount_yen, 14800, "at its own price");
  assert.equal(env.calls.length, 1);
  assert.equal(env.calls[0].form["line_items[0][price]"], "price_pro", "Stripe is sent the Pro price");
  assert.equal(env.calls[0].form["subscription_data[metadata][plan]"], "pro");

  const std = await request(env, "/api/billing/checkout", { body: { site_id: SITE_ID, plan: "standard" } });
  assert.equal(std.status, 200, "Standard is still sold");
  assert.equal(env.calls[1].form["line_items[0][price]"], "price_std");

  const none = await request(env, "/api/billing/checkout", { body: { site_id: SITE_ID } });
  assert.deepEqual(none.body.allowed, ["standard", "pro"], "allowed lists Pro once on sale");

  // The payment link stays Standard-only whatever the switch says.
  const link = await request(env, "/api/billing/payment-link", { body: { site_id: SITE_ID } });
  assert.equal(link.status, 200);
  assert.equal(env.calls.at(-1).form["line_items[0][price]"], "price_std");
}

/* ---------------- what the dashboard is told ---------------- */

{
  const off = await request(makeEnv({ STRIPE_PRICE_ID_PRO: "price_pro" }), "/api/sites", { method: "GET" });
  assert.equal(off.status, 200);
  assert.equal(off.body.pro_checkout, false, "the sites listing reports Pro is not on sale");
  const on = await request(makeEnv({ PRO_CHECKOUT_ENABLED: "1", STRIPE_PRICE_ID_PRO: "price_pro" }), "/api/sites", { method: "GET" });
  assert.equal(on.body.pro_checkout, true, "and that it is, once switched on");
  assert.equal(on.body.pro_monthly_yen, 14800);
  assert.equal(on.body.pro_monthly_usd, 99, "and the US price the non-Japanese dashboard shows");
}

{
  const off = await request(makeEnv(), `/api/sites/${SITE_ID}/sov`, { method: "GET" });
  assert.equal(off.status, 402);
  assert.equal(off.body.upgrade.coming_soon, true);
  assert.equal(off.body.upgrade.purchasable, false);
  assert.equal(off.body.upgrade.price_yen, undefined, "no price while not on sale");

  const on = await request(makeEnv({ PRO_CHECKOUT_ENABLED: "1", STRIPE_PRICE_ID_PRO: "price_pro" }), `/api/sites/${SITE_ID}/sov`, { method: "GET" });
  assert.equal(on.status, 402);
  assert.equal(on.body.upgrade.coming_soon, false);
  assert.equal(on.body.upgrade.purchasable, true);
  assert.equal(on.body.upgrade.price_yen, 14800);
  assert.equal(on.body.upgrade.checkout_url, "https://nurevo.jp/dashboard?plan=pro");
  assert.ok(!String(on.body.upgrade.message).includes("近日"), "no coming-soon wording once on sale");
}

/* ---------------- an existing subscription changes tier in the portal ---------------- */

{
  // A Standard customer pressing "Pro" must not be sold a second subscription.
  const env = makeEnv({ PRO_CHECKOUT_ENABLED: "1", STRIPE_PRICE_ID_PRO: "price_pro" },
    { plan: "standard", contract: "active", stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1" });
  const { status, body } = await request(env, "/api/billing/checkout", { body: { site_id: SITE_ID, plan: "pro" } });
  assert.equal(status, 409, "checkout refuses a site that already has a subscription");
  assert.deepEqual(body, { error: "subscription_exists", plan: "pro", manage: "portal" });
  assert.equal(env.calls.length, 0, "no second Checkout session is created");
}
{
  // A cancelled subscription is not live: buying again is a fresh checkout.
  const env = makeEnv({ PRO_CHECKOUT_ENABLED: "1", STRIPE_PRICE_ID_PRO: "price_pro" },
    { plan: "free", contract: "cancelled", stripe_customer_id: "cus_1", stripe_subscription_id: "sub_old" });
  const { status } = await request(env, "/api/billing/checkout", { body: { site_id: SITE_ID, plan: "pro" } });
  assert.equal(status, 200, "a cancelled subscription does not block buying again");
}

console.log("pro checkout flag tests passed");
