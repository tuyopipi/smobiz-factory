/**
 * Unbinding releases a seat. It does not grant or revoke a tier.
 *
 * bindLicenseToDomain() states the principle on the way in - "binding links the
 * install to the site. It does not grant a tier - billing does that" - but the
 * unbind handler was written before billing became the source of truth and kept
 * writing plan='free'. A site with a live subscription was therefore demoted the
 * moment its licence was released: billing had granted pro, contract still said
 * active, and the tier stayed gone until Stripe happened to send another event.
 *
 * These assert the symmetry in both directions, and that the billing columns
 * unbinding has no business touching are left alone.
 */
import assert from "node:assert/strict";
import { handleApi } from "../worker/api.mjs";
import { resolveSitePlan } from "../worker/billing-plan.mjs";

const SITE_ID = "site1";
const CSRF = "c".repeat(64);
const SESSION = { cookie: `nrv_session=t; nrv_csrf=${CSRF}`, "x-csrf-token": CSRF };

/** Minimal D1 double that applies the unbind UPDATE to a real row object. */
function makeEnv(siteOverrides = {}, { orgId = "org1" } = {}) {
  const site = {
    id: SITE_ID, org_id: "org1", url: "example.com", site_key: "nrv_k", install_type: "wp",
    delivery_status: "active", plan: "free", manual_plan: null, contract: null,
    stripe_subscription_id: null, stripe_customer_id: null,
    bound_license_hash: "a".repeat(64), bound_at: 1_700_000_000_000,
    domain_key: "example.com", profile_token_hash: "b".repeat(64),
    ...siteOverrides,
  };
  const DB = {
    prepare(sql) {
      const first = async (...values) => {
        if (/FROM sessions/.test(sql)) {
          return { member_id: "m", org_id: orgId, email: "e@x.test", role: "admin", status: "active", expires_at: Date.now() + 3.6e6 };
        }
        if (/FROM sites WHERE id=\?/.test(sql)) {
          if (values[0] !== SITE_ID) return null;
          if (/org_id=\?/.test(sql) && values[1] !== site.org_id) return null;
          return { ...site };
        }
        return null;
      };
      return {
        bind(...values) {
          return {
            first: () => first(...values),
            async all() { return { results: [] }; },
            async run() {
              if (/UPDATE sites SET bound_license_hash=NULL/.test(sql)) {
                // Apply exactly the columns the statement names, so a statement
                // that starts touching plan again shows up here.
                for (const column of sql.matchAll(/(\w+)=NULL/g)) site[column[1]] = null;
                const literal = sql.match(/plan='(\w+)'/);
                if (literal) site.plan = literal[1];
              }
              return { success: true };
            },
          };
        },
        first,
        async all() { return { results: [] }; },
        async run() { return { success: true }; },
      };
    },
  };
  return { DB, site, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp" };
}

const unbind = async (env, id = SITE_ID, headers = SESSION) => {
  const response = await handleApi(
    new Request(`https://w.test/api/sites/${id}/unbind`, { method: "POST", headers }),
    env, { waitUntil() {} },
  );
  return { status: response.status, body: await response.json() };
};

/* ---------------- a live subscription survives unbinding ---------------- */

{
  // The case that was broken: billing granted pro and is still charging.
  const env = makeEnv({ plan: "pro", contract: "active", stripe_subscription_id: "sub_live", stripe_customer_id: "cus_1" });
  const { status, body } = await unbind(env);

  assert.equal(status, 200);
  assert.equal(body.bound, false, "the binding is released");
  assert.equal(body.plan, "pro", "and the paid tier is reported, not free");

  assert.equal(env.site.plan, "pro", "the billed plan is left alone");
  assert.equal(env.site.contract, "active", "so is the contract");
  assert.equal(env.site.stripe_subscription_id, "sub_live", "and the subscription");
  assert.equal(resolveSitePlan(env.site), "pro", "every other reader agrees the site is still pro");

  // What unbinding is actually for.
  assert.equal(env.site.bound_license_hash, null, "the licence claim is gone");
  assert.equal(env.site.bound_at, null);
  assert.equal(env.site.domain_key, null, "the seat and the domain are freed");
  assert.equal(env.site.profile_token_hash, null, "the write token is revoked");
}

{
  // past_due is still an entitling status, so it must survive too.
  const env = makeEnv({ plan: "standard", contract: "past_due", stripe_subscription_id: "sub_retry" });
  const { body } = await unbind(env);
  assert.equal(body.plan, "standard", "a site inside the retry window keeps its tier");
  assert.equal(env.site.contract, "past_due", "and its contract state");
}

/* ---------------- a manual grant survives unbinding ---------------- */

{
  // Wholesale, partner and canary installs are granted outside Stripe. The
  // grant lives on the site, not on the binding.
  const env = makeEnv({ plan: "free", manual_plan: "pro", manual_plan_note: "wholesale" });
  const { body } = await unbind(env);
  assert.equal(body.plan, "pro", "the granted tier is reported");
  assert.equal(env.site.manual_plan, "pro", "and the grant is untouched");
}

/* ---------------- a site with neither is free, honestly ---------------- */

{
  const env = makeEnv({ plan: "free", manual_plan: null });
  const { body } = await unbind(env);
  assert.equal(body.plan, "free", "nothing entitles this site, so free is the truth");
  assert.equal(env.site.bound_license_hash, null, "and it is still unbound");
}

{
  // A stored plan this build does not recognise must not be honoured.
  const env = makeEnv({ plan: "enterprise" });
  const { body } = await unbind(env);
  assert.equal(body.plan, "free", "an unknown tier resolves to free");
}

/* ---------------- repeating it is a no-op ---------------- */

{
  // Now that plan is left alone, the statement only re-nulls columns that are
  // already null. There is nothing left for a second call to damage, so it
  // needs no 409.
  const env = makeEnv({ plan: "pro", contract: "active", stripe_subscription_id: "sub_live" });
  const firstCall = await unbind(env);
  const snapshot = { ...env.site };
  const secondCall = await unbind(env);

  assert.equal(secondCall.status, 200, "unbinding twice is allowed");
  assert.deepEqual(secondCall.body, firstCall.body, "and reports the same thing");
  assert.deepEqual(env.site, snapshot, "the second call changes nothing at all");
  assert.equal(env.site.plan, "pro", "in particular it does not demote the site");
  assert.equal(env.site.profile_token_hash, null);
}

/* ---------------- the gates are unchanged ---------------- */

{
  const anonymous = await handleApi(
    new Request(`https://w.test/api/sites/${SITE_ID}/unbind`, { method: "POST", headers: { cookie: `nrv_csrf=${CSRF}`, "x-csrf-token": CSRF } }),
    makeEnv(), { waitUntil() {} },
  );
  assert.equal(anonymous.status, 401, "a session is required");
}

{
  const noCsrf = await handleApi(
    new Request(`https://w.test/api/sites/${SITE_ID}/unbind`, { method: "POST", headers: { cookie: "nrv_session=t" } }),
    makeEnv(), { waitUntil() {} },
  );
  assert.equal(noCsrf.status, 403, "a CSRF token is required");
  assert.equal((await noCsrf.json()).error, "csrf_failed");
}

{
  const env = makeEnv({ org_id: "other-org" });
  const { status, body } = await unbind(env);
  assert.equal(status, 403, "another org's site is forbidden");
  assert.equal(body.error, "forbidden");
  assert.ok(env.site.bound_license_hash, "and its binding survives");
}

{
  const { status, body } = await unbind(makeEnv(), "nosuchsite");
  assert.equal(status, 404);
  assert.equal(body.error, "not_found");
}

{
  // Holding the licence key is not authority to detach a site from it.
  const env = makeEnv();
  const response = await handleApi(
    new Request(`https://w.test/api/sites/${SITE_ID}/unbind`, {
      method: "POST",
      headers: { cookie: `nrv_csrf=${CSRF}`, "x-csrf-token": CSRF, "content-type": "application/json" },
      body: JSON.stringify({ license: "nrv_canary_pro_14800" }),
    }),
    env, { waitUntil() {} },
  );
  assert.equal(response.status, 401, "a licence key does not authorise unbinding");
  assert.ok(env.site.bound_license_hash, "the binding survives");
}

console.log("unbind plan tests passed");
