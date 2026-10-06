/**
 * What /api/sites tells the dashboard about plan, billing and binding.
 *
 * The dashboard could previously show neither the plan nor whether a site was
 * bound, which is why a cancelled customer still looked fine on screen. These
 * assert that the listing reports the same plan every other reader resolves,
 * distinguishes a paid tier from a granted one, and never leaks the licence
 * hash.
 */
import assert from "node:assert/strict";
import { handleApi } from "../worker/api.mjs";

const CSRF = "c".repeat(64);
const SESSION = { cookie: `nrv_session=t; nrv_csrf=${CSRF}`, "x-csrf-token": CSRF };

function makeEnv(rows) {
  const DB = {
    prepare(sql) {
      const exec = async () => {
        if (/FROM sessions/.test(sql)) {
          return { member_id: "m", org_id: "org1", email: "e@x.test", role: "admin", status: "active", expires_at: Date.now() + 3.6e6 };
        }
        return null;
      };
      return {
        bind() {
          return {
            first: exec,
            async all() { return { results: rows }; },
            async run() { return { success: true }; },
          };
        },
        first: exec,
        async all() { return { results: rows }; },
        async run() { return { success: true }; },
      };
    },
  };
  return { DB, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp" };
}

const baseRow = {
  id: "s1", org_id: "org1", url: "example.com", site_key: "nrv_k1", install_type: "wp",
  status: "active", delivery_status: "active", contract: "trial", plan: "free",
  manual_plan: null, bound_license_hash: null, bound_at: null, domain_key: null,
  stripe_customer_id: null, stripe_subscription_id: null, schema_types: 0, crawler_allowed: 0,
  channel: "direct", org_plan: "direct",
};

const listSites = async (rows) => {
  const response = await handleApi(
    new Request("https://w.test/api/sites", { headers: SESSION }),
    makeEnv(rows), { waitUntil() {} },
  );
  assert.equal(response.status, 200);
  return (await response.json()).sites;
};

/* ---------------- a paid site ---------------- */

{
  const [site] = await listSites([{ ...baseRow, plan: "pro", contract: "active", stripe_subscription_id: "sub_1", stripe_customer_id: "cus_1" }]);
  assert.equal(site.plan, "pro", "the entitled plan is reported");
  assert.equal(site.billed_plan, "pro", "billing granted it");
  assert.equal(site.manual_plan, null, "and nothing was granted by hand");
  assert.equal(site.contract, "active");
  assert.equal(site.billing.status, "active");
  assert.equal(site.billing.subscription_id, "sub_1");
}

/* ---------------- a granted site, no subscription ---------------- */

{
  // The distinction the dashboard needs: this site is pro because somebody
  // granted it, not because anyone is paying for it.
  const [site] = await listSites([{ ...baseRow, plan: "free", manual_plan: "pro" }]);
  assert.equal(site.plan, "pro", "the grant entitles the site");
  assert.equal(site.billed_plan, "free", "but billing granted nothing");
  assert.equal(site.manual_plan, "pro", "and the grant is visible as such");
  assert.equal(site.billing.subscription_id, null, "there is no subscription behind it");
}

/* ---------------- a cancelled site ---------------- */

{
  const [site] = await listSites([{ ...baseRow, plan: "free", contract: "cancelled", delivery_status: "stopped", stripe_subscription_id: "sub_1" }]);
  assert.equal(site.plan, "free", "a cancelled site is free");
  assert.equal(site.contract, "cancelled");
  assert.equal(site.billing.status, "stopped");
  assert.equal(site.delivery_status, "stopped");
}

/* ---------------- a site in the grace window ---------------- */

{
  // past_due used to collapse into "pending", which read as "nothing is wrong".
  // It is the one state where the operator can still act before service stops.
  const [site] = await listSites([{ ...baseRow, plan: "pro", contract: "past_due", stripe_subscription_id: "sub_1" }]);
  assert.equal(site.plan, "pro", "the site still works during the retry window");
  assert.equal(site.contract, "past_due");
  assert.equal(site.billing.status, "past_due", "and the billing state says so rather than 'pending'");
}

/* ---------------- binding ---------------- */

{
  const bound = Date.now();
  const [site] = await listSites([{ ...baseRow, bound_license_hash: "a".repeat(64), bound_at: bound, domain_key: "example.com" }]);
  assert.equal(site.bound, true, "a bound site says so");
  assert.equal(site.bound_at, bound);
  assert.equal(site.domain_key, "example.com", "the domain it is claimed under is shown");

  // The hash identifies a secret. Whether a site is bound is operational
  // information; the hash is not, and must not travel to the browser.
  const serialised = JSON.stringify(site);
  assert.equal(serialised.includes("a".repeat(64)), false, "the licence hash is never sent");
  assert.equal("bound_license_hash" in site, false, "nor is the field itself");
}

{
  const [site] = await listSites([baseRow]);
  assert.equal(site.bound, false, "an unbound site says so");
  assert.equal(site.bound_at, null);
  assert.equal(site.domain_key, null);
}

/* ---------------- unrecognised values are not trusted ---------------- */

{
  const [site] = await listSites([{ ...baseRow, plan: "enterprise" }]);
  assert.equal(site.plan, "free", "an unknown stored plan is not honoured");
  assert.equal(site.billed_plan, "free");
}

/* ---------------- what was already there still is ---------------- */

{
  const [site] = await listSites([{ ...baseRow, schema_types: 3, crawler_allowed: 1, slug: "demo" }]);
  assert.equal(site.id, "s1");
  assert.equal(site.key, "nrv_k1", "the site key is still exposed for the tag");
  assert.equal(site.schema_types, 3);
  assert.equal(site.crawler_allowed, true);
  assert.equal(site.hostedUrl, "/s/demo");
  assert.ok(Array.isArray(site.checklist) && site.checklist.length > 0, "the onboarding checklist survives");
  assert.ok(site.fill && typeof site.fill.pct === "number", "the fill summary survives");
}

console.log("sites listing tests passed");
