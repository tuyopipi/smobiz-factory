/**
 * Giving a tier away on purpose.
 *
 * Billing owns sites.plan. A comp must therefore never touch it - otherwise a
 * free agreement and a paid subscription become indistinguishable a month
 * later, which is exactly the confusion 0021 was written to end.
 *
 * The case that matters is the agency: one grant on the org covering every
 * site under it, including the ones added tomorrow. Stamping each site works
 * until someone forgets one and a customer who was promised free gets billed.
 */
import assert from "node:assert/strict";
import { handleApi } from "../worker/api.mjs";
import { resolveSitePlan } from "../worker/billing-plan.mjs";

const CSRF = "c".repeat(64);
const HEADERS = {
  cookie: `nrv_session=t; nrv_csrf=${CSRF}`,
  "x-csrf-token": CSRF,
  "content-type": "application/json",
  origin: "https://nurevo.jp",
};
const ctx = { waitUntil() {} };

function makeEnv({ role = "admin", orgId = "org1", superAdmin = false } = {}) {
  const db = {
    sites: [{ id: "site1", org_id: "org1", url: "a.example", site_key: "nrv_a", plan: "free", manual_plan: null, manual_plan_note: null }],
    orgs: [{ id: "org1", plan: "pro", manual_plan: null, manual_plan_note: null }, { id: "org2", plan: "pro", manual_plan: null }],
  };
  const DB = {
    prepare(sql) {
      const first = async (...values) => {
        if (/FROM sessions/.test(sql)) {
          return { member_id: "m1", org_id: orgId, email: superAdmin ? "boss@x.test" : "o@x.test", role, status: "active", expires_at: Date.now() + 3.6e6 };
        }
        if (/FROM orgs WHERE id=\?/.test(sql)) return db.orgs.find((o) => o.id === values[0]) || null;
        if (/COUNT\(\*\) AS n FROM sites WHERE org_id=\?/.test(sql)) {
          return { n: db.sites.filter((s) => s.org_id === values[0]).length };
        }
        if (/FROM sites s LEFT JOIN orgs o/.test(sql)) {
          const site = db.sites.find((s) => s.id === values[0]);
          if (!site) return null;
          const org = db.orgs.find((o) => o.id === site.org_id);
          return { ...site, org_manual_plan: org?.manual_plan ?? null };
        }
        if (/FROM sites WHERE id=\?/.test(sql)) {
          const site = db.sites.find((s) => s.id === values[0]);
          if (!site) return null;
          if (/org_id=\?/.test(sql) && values[1] !== orgId) return null;
          return site;
        }
        return null;
      };
      return {
        bind(...values) {
          return {
            first: () => first(...values),
            async all() { return { results: [] }; },
            async run() {
              if (/UPDATE sites SET manual_plan=/.test(sql)) {
                const site = db.sites.find((s) => s.id === values[4]);
                if (site) { site.manual_plan = values[0]; site.manual_plan_note = values[1]; site.manual_plan_at = values[2]; site.manual_plan_by = values[3]; }
              } else if (/UPDATE orgs SET manual_plan=/.test(sql)) {
                const org = db.orgs.find((o) => o.id === values[4]);
                if (org) { org.manual_plan = values[0]; org.manual_plan_note = values[1]; org.manual_plan_at = values[2]; org.manual_plan_by = values[3]; }
              }
              return { success: true };
            },
          };
        },
        first, async all() { return { results: [] }; }, async run() { return { success: true }; },
      };
    },
  };
  return { DB, db, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp", ...(superAdmin ? { SUPER_ADMIN_EMAILS: "boss@x.test" } : {}) };
}

const comp = async (env, target, body) => {
  const response = await handleApi(
    new Request(`https://w.test${target}/comp`, { method: "PUT", headers: HEADERS, body: JSON.stringify(body) }),
    env, ctx,
  );
  return { status: response.status, body: await response.json() };
};

/* ---------------- a site comped on its own ---------------- */

{
  const env = makeEnv();
  const { status, body } = await comp(env, "/api/sites/site1", { plan: "standard", note: "free under the agency agreement" });
  assert.equal(status, 200);
  assert.equal(body.manual_plan, "standard");
  assert.equal(body.plan, "standard", "and the site is entitled to it");

  const stored = env.db.sites[0];
  assert.equal(stored.manual_plan, "standard");
  assert.equal(stored.manual_plan_note, "free under the agency agreement", "the reason is kept");
  assert.ok(stored.manual_plan_at, "with when");
  assert.equal(stored.manual_plan_by, "m1", "and who");
  // The whole point: this is free, so the billed column is untouched.
  assert.equal(stored.plan, "free", "billing's own column is never written by a comp");
}

{
  // Revoking is the way back to being billed normally.
  const env = makeEnv();
  await comp(env, "/api/sites/site1", { plan: "pro", note: "launch partner" });
  const { status, body } = await comp(env, "/api/sites/site1", { plan: null });
  assert.equal(status, 200);
  assert.equal(body.manual_plan, null, "the grant is gone");
  assert.equal(env.db.sites[0].manual_plan_note, null, "and so is its note");
  assert.equal(body.plan, "free", "leaving the site on what it pays for");
}

/* ---------------- an agency, comped once ---------------- */

{
  const env = makeEnv();
  const { status, body } = await comp(env, "/api/orgs/org1", { plan: "pro", note: "wholesale partner, invoiced separately" });
  assert.equal(status, 200);
  assert.equal(body.manual_plan, "pro");
  assert.equal(body.sites_covered, 1, "it says what it reaches");
  assert.equal(env.db.orgs[0].manual_plan, "pro");

  // Every site under it, including ones with no grant of their own.
  assert.equal(resolveSitePlan(env.db.sites[0], env.db.orgs[0]), "pro", "the org grant reaches the site");
  assert.equal(env.db.sites[0].manual_plan, null, "without stamping each site");
}

{
  // A site added after the grant is covered too - the reason this lives on the
  // org rather than being copied onto each row.
  const env = makeEnv();
  await comp(env, "/api/orgs/org1", { plan: "standard", note: "partner" });
  const later = { id: "site9", org_id: "org1", plan: "free", manual_plan: null };
  assert.equal(resolveSitePlan(later, env.db.orgs[0]), "standard", "a site added later is covered");
}

/* ---------------- what a grant may not do ---------------- */

{
  const env = makeEnv();
  const { status, body } = await comp(env, "/api/sites/site1", { plan: "standard" });
  assert.equal(status, 400, "a grant with no reason is refused");
  assert.equal(body.error, "note_required");
  assert.equal(env.db.sites[0].manual_plan, null, "and nothing is stored");
}

{
  const env = makeEnv();
  const { status, body } = await comp(env, "/api/sites/site1", { note: "no plan key at all" });
  assert.equal(status, 400, "an absent plan is not a revocation");
  assert.equal(body.error, "plan_required");
}

{
  const env = makeEnv();
  const { status } = await comp(env, "/api/sites/site1", { plan: "enterprise", note: "n" });
  assert.equal(status, 400, "a tier that does not exist cannot be granted");
}

{
  const env = makeEnv();
  const { status } = await comp(env, "/api/sites/site1", { plan: "free", note: "n" });
  assert.equal(status, 400, "granting free is not a grant");
}

/* ---------------- who may grant ---------------- */

{
  const { status } = await comp(makeEnv({ role: "operator" }), "/api/sites/site1", { plan: "pro", note: "n" });
  assert.equal(status, 403, "an operator cannot comp a tier");
}

{
  const { status } = await comp(makeEnv({ role: "viewer" }), "/api/orgs/org1", { plan: "pro", note: "n" });
  assert.equal(status, 403, "nor comp an org");
}

{
  const response = await handleApi(
    new Request("https://w.test/api/sites/site1/comp", {
      method: "PUT",
      headers: { "content-type": "application/json", "x-csrf-token": CSRF, cookie: `nrv_csrf=${CSRF}`, origin: "https://nurevo.jp" },
      body: JSON.stringify({ plan: "pro", note: "n" }),
    }),
    makeEnv(), ctx,
  );
  assert.equal(response.status, 403, "and no session cannot either");
}

{
  // Reaching across orgs would let one agency comp its way into another's
  // billing.
  const env = makeEnv();
  const { status } = await comp(env, "/api/orgs/org2", { plan: "pro", note: "not mine" });
  assert.equal(status, 403, "an admin may not comp someone else's org");
  assert.equal(env.db.orgs[1].manual_plan, null);
}

{
  const env = makeEnv({ superAdmin: true });
  const { status } = await comp(env, "/api/orgs/org2", { plan: "pro", note: "support grant" });
  assert.equal(status, 200, "a super admin may");
  assert.equal(env.db.orgs[1].manual_plan, "pro");
}

{
  const env = makeEnv();
  const { status } = await comp(env, "/api/orgs/nosuch", { plan: "pro", note: "n" });
  assert.equal(status, 403, "an org that is not yours is refused before it is looked up");
}

{
  const env = makeEnv({ superAdmin: true });
  const { status } = await comp(env, "/api/orgs/nosuch", { plan: "pro", note: "n" });
  assert.equal(status, 404, "and one that does not exist is a 404 to someone who could have comped it");
}

console.log("comp grant tests passed");
