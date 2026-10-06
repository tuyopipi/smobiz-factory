/**
 * The webhook drives sites.plan.
 *
 * Signed Stripe events through the real handler, with D1 and signature
 * verification doubled. These are the money-losing failures: a cancelled
 * customer keeping paid features, a failed payment cutting service with no
 * grace, an unknown price granting a tier, or a replayed event double-applying.
 */
import assert from "node:assert/strict";
import { handleApi } from "../worker/api.mjs";

const SECRET = "whsec_test_secret";
const PRICES = { STRIPE_PRICE_ID_PRO: "price_pro_test", STRIPE_PRICE_ID_STANDARD: "price_std_test" };

async function sign(payload, secret, timestamp) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function makeEnv(site = {}) {
  const db = {
    site: {
      id: "site1", org_id: "org1", plan: "free", manual_plan: null, contract: "trial",
      delivery_status: "active", stripe_customer_id: null, stripe_subscription_id: null, ...site,
    },
    events: new Set(),
  };
  const DB = {
    prepare(sql) {
      return {
        bind(...v) {
          return {
            async first() {
              if (/FROM sites WHERE stripe_subscription_id=\?/.test(sql)) {
                return db.site.stripe_subscription_id === v[0] ? { id: db.site.id } : null;
              }
              if (/FROM sites WHERE id=\?/.test(sql)) return db.site.id === v[0] ? { ...db.site } : null;
              return null;
            },
            async all() { return { results: [] }; },
            async run() {
              if (/INSERT OR IGNORE INTO billing_events/.test(sql)) {
                const seen = db.events.has(v[0]);
                db.events.add(v[0]);
                return { meta: { changes: seen ? 0 : 1 } };
              }
              if (/UPDATE sites SET plan=\?, contract=\?, delivery_status=\?/.test(sql)) {
                if (db.site.id !== v[5]) return { success: true };
                db.site.plan = v[0]; db.site.contract = v[1]; db.site.delivery_status = v[2];
                if (v[3]) db.site.stripe_customer_id = v[3];
                if (v[4]) db.site.stripe_subscription_id = v[4];
                return { success: true };
              }
              if (/UPDATE sites SET stripe_customer_id=\?,stripe_subscription_id=\?/.test(sql)) {
                if (db.site.id === v[2]) { db.site.stripe_customer_id = v[0]; db.site.stripe_subscription_id = v[1]; }
                return { success: true };
              }
              if (/UPDATE sites SET contract='active'/.test(sql)) {
                if (db.site.id === v[0]) db.site.contract = "active";
                return { success: true };
              }
              if (/UPDATE sites SET contract='past_due'/.test(sql)) {
                if (db.site.id === v[0]) db.site.contract = "past_due";
                return { success: true };
              }
              return { success: true };
            },
          };
        },
        async first() { return null; },
        async all() { return { results: [] }; },
        async run() { return { success: true }; },
      };
    },
  };
  return { DB, db, STRIPE_WEBHOOK_SECRET: SECRET, WEBMCP_ALLOWED_ORIGINS: "*", ...PRICES };
}

let eventSeq = 0;
async function send(env, type, object, { eventId } = {}) {
  const body = JSON.stringify({ id: eventId || `evt_${++eventSeq}`, type, data: { object } });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await sign(body, SECRET, timestamp);
  return handleApi(new Request("https://w.test/api/billing/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": `t=${timestamp},v1=${signature}` },
    body,
  }), env, { waitUntil() {} });
}

const subscription = (status, price = "price_pro_test", extra = {}) => ({
  id: "sub_1", status, customer: "cus_1",
  items: { data: [{ price: { id: price } }] },
  metadata: { siteId: "site1" },
  ...extra,
});

/* 1. Checkout records identifiers; the subscription grants the tier. */
{
  const env = makeEnv();
  await send(env, "checkout.session.completed", { customer: "cus_1", subscription: "sub_1", metadata: { siteId: "site1" } });
  assert.equal(env.db.site.stripe_subscription_id, "sub_1", "checkout records the subscription id");
  assert.equal(env.db.site.plan, "free", "checkout alone does not grant a tier");

  await send(env, "customer.subscription.created", subscription("active"));
  assert.equal(env.db.site.plan, "pro", "an active subscription grants pro");
  assert.equal(env.db.site.contract, "active");
  assert.equal(env.db.site.delivery_status, "active");
}

/* 2. Trialing entitles. */
{
  const env = makeEnv();
  await send(env, "customer.subscription.created", subscription("trialing"));
  assert.equal(env.db.site.plan, "pro", "a trial entitles the site to its tier");
  assert.equal(env.db.site.contract, "trial");
}

/* 3. past_due keeps the site working - the grace period is Stripe's. */
{
  const env = makeEnv({ plan: "pro", contract: "active" });
  env.db.site.stripe_subscription_id = "sub_1";
  await send(env, "customer.subscription.updated", subscription("past_due"));
  assert.equal(env.db.site.plan, "pro", "a late payment does not revoke the tier");
  assert.equal(env.db.site.contract, "past_due", "but it is reported, so the dashboard can warn");
  assert.equal(env.db.site.delivery_status, "active", "delivery continues through the retry window");
}

/* 4. A failed invoice no longer stops the site on its own. */
{
  const env = makeEnv({ plan: "pro", contract: "active" });
  await send(env, "invoice.payment_failed", { metadata: { siteId: "site1" } });
  assert.equal(env.db.site.delivery_status, "active", "one failed payment does not cut service");
  assert.equal(env.db.site.plan, "pro", "nor does it revoke the tier");
  assert.equal(env.db.site.contract, "past_due", "it is recorded as past due");
}

/* 5. unpaid is where Stripe gives up, and so do we. */
{
  const env = makeEnv({ plan: "pro", contract: "past_due" });
  env.db.site.stripe_subscription_id = "sub_1";
  await send(env, "customer.subscription.updated", subscription("unpaid"));
  assert.equal(env.db.site.plan, "free", "an unpaid subscription revokes the tier");
  assert.equal(env.db.site.contract, "unpaid");
  assert.equal(env.db.site.delivery_status, "stopped");
}

/* 6. Cancellation revokes. */
{
  const env = makeEnv({ plan: "pro", contract: "active" });
  env.db.site.stripe_subscription_id = "sub_1";
  await send(env, "customer.subscription.deleted", subscription("active"));
  assert.equal(env.db.site.plan, "free", "deletion revokes even when the object still says active");
  assert.equal(env.db.site.contract, "cancelled");
  assert.equal(env.db.site.delivery_status, "stopped");
}

/* 7. Resubscribing restores. */
{
  const env = makeEnv({ plan: "free", contract: "cancelled", delivery_status: "stopped" });
  env.db.site.stripe_subscription_id = "sub_1";
  await send(env, "customer.subscription.created", subscription("active"));
  assert.equal(env.db.site.plan, "pro", "a new subscription restores the tier");
  assert.equal(env.db.site.delivery_status, "active", "and restores delivery");
}

/* 8. Standard price grants standard, not pro. */
{
  const env = makeEnv();
  await send(env, "customer.subscription.created", subscription("active", "price_std_test"));
  assert.equal(env.db.site.plan, "standard", "the standard price grants standard");
}

/* 9. An unrecognised price grants nothing. */
{
  const env = makeEnv();
  await send(env, "customer.subscription.created", subscription("active", "price_who_knows"));
  assert.equal(env.db.site.plan, "free", "an unknown price does not grant a tier");
}

/* 10. Replays are ignored. */
{
  const env = makeEnv();
  await send(env, "customer.subscription.created", subscription("active"), { eventId: "evt_fixed" });
  assert.equal(env.db.site.plan, "pro");
  const replay = await send(env, "customer.subscription.deleted", subscription("active"), { eventId: "evt_fixed" });
  assert.equal((await replay.json()).duplicate, true, "a repeated event id is refused");
  assert.equal(env.db.site.plan, "pro", "and changes nothing");
}

/* A subscription edited in the Stripe dashboard carries no metadata; it is
 * matched by the subscription id we already stored. */
{
  const env = makeEnv({ plan: "pro" });
  env.db.site.stripe_subscription_id = "sub_1";
  const noMetadata = { id: "sub_1", status: "canceled", items: { data: [{ price: { id: "price_pro_test" } }] } };
  await send(env, "customer.subscription.updated", noMetadata);
  assert.equal(env.db.site.plan, "free", "a site is found by its stored subscription id when metadata is absent");
}

/* incomplete is neither a grant nor a revocation. */
{
  const env = makeEnv({ plan: "pro", contract: "active" });
  env.db.site.stripe_subscription_id = "sub_1";
  await send(env, "customer.subscription.updated", subscription("incomplete"));
  assert.equal(env.db.site.plan, "pro", "an incomplete first payment does not disturb the site");
  assert.equal(env.db.site.contract, "active");
}

/* An unsigned or wrongly signed event is rejected before anything is read. */
{
  const env = makeEnv({ plan: "pro" });
  const body = JSON.stringify({ id: "evt_forged", type: "customer.subscription.deleted", data: { object: subscription("canceled") } });
  const forged = await handleApi(new Request("https://w.test/api/billing/webhook", {
    method: "POST", headers: { "content-type": "application/json", "stripe-signature": "t=1,v1=deadbeef" }, body,
  }), env, { waitUntil() {} });
  assert.equal(forged.status, 400, "a bad signature is rejected");
  assert.equal(env.db.site.plan, "pro", "and nothing is changed");
}

console.log("billing webhook tests passed");
