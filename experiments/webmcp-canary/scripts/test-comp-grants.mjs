// Retired grant endpoints must preserve existing data and entitlement.
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

// Neither creating nor revoking a grant may change existing data.
for (const target of ['/api/sites/site1', '/api/orgs/org1']) {
  for (const plan of ['standard', 'pro', null]) {
    const env = makeEnv({superAdmin: true});
    env.db.sites[0].manual_plan = 'standard';
    env.db.orgs[0].manual_plan = 'pro';
    const before = structuredClone(env.db);
    const { status, body } = await comp(env, target, {plan, note: 'retired'});
    assert.equal(status, 410);
    assert.equal(body.error, 'complimentary_grants_disabled');
    assert.deepEqual(env.db, before, 'retired endpoints never write data');
    assert.equal(resolveSitePlan(env.db.sites[0], env.db.orgs[0]), 'pro', 'existing grants still entitle');
  }
}
for (const role of ['operator', 'viewer']) {
  const {status} = await comp(makeEnv({role}), '/api/sites/site1', {plan: 'standard', note: 'n'});
  assert.equal(status, 403);
}
console.log('retired comp endpoint and preserved entitlement tests passed');
