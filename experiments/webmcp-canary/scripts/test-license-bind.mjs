/**
 * D "bind-on-license": redeeming a license against a domain is what creates the
 * link between a self-installed plugin and an org's site record.
 *
 * The things that must hold, because each of them is either a security boundary
 * or a billing boundary:
 *   - the same install binding twice gets the same site, not a second one
 *   - a seat limit is a limit
 *   - no response distinguishes "wrong key" from "no such key"
 *   - a public site_key cannot bind anything
 *   - unbinding frees the seat and revokes the write token
 */
import assert from "node:assert/strict";
import { handleApi } from "../worker/api.mjs";

const CSRF = "c".repeat(64);
const SESSION = { cookie: `nrv_session=t; nrv_csrf=${CSRF}`, "x-csrf-token": CSRF };

// sha256("nrv_canary_standard_3000") and sha256("nrv_canary_pro_14800"),
// matching the canary fixtures in 0017_plans_and_licenses.sql.
const STANDARD_KEY = "nrv_canary_standard_3000";
const PRO_KEY = "nrv_canary_pro_14800";

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** In-memory D1 double: enough SQL shape to exercise the bind path honestly. */
function makeEnv({ licenses = [], sites = [], seats = 1 } = {}) {
  const db = {
    licenses: licenses.length ? licenses : [
      { license_hash: null, plan: "standard", active: 1, org_id: "org-canary", seats },
    ],
    sites: [...sites],
    rateLimits: new Map(),
  };

  const DB = {
    prepare(sql) {
      return {
        bind(...values) {
          const first = async () => {
            if (/FROM sessions/.test(sql)) {
              return { member_id: "m", org_id: "org-canary", email: "e@x.test", role: "admin", status: "active", expires_at: Date.now() + 3.6e6 };
            }
            if (/INSERT INTO api_rate_limits/.test(sql)) {
              const bucket = values[0];
              const count = (db.rateLimits.get(bucket) || 0) + 1;
              db.rateLimits.set(bucket, count);
              return { count, window_started_at: Date.now() };
            }
            if (/FROM licenses WHERE license_hash=\?/.test(sql)) {
              return db.licenses.find((l) => l.license_hash === values[0] && l.active === 1) || null;
            }
            if (/SELECT plan, manual_plan FROM sites WHERE id=\?/.test(sql)) {
              const site = db.sites.find((s) => s.id === values[0]);
              return site ? { plan: site.plan, manual_plan: site.manual_plan ?? null } : null;
            }
            if (/SELECT id, site_key, bound_license_hash FROM sites WHERE org_id=\? AND domain_key=\?/.test(sql)) {
              return db.sites.find((s) => s.org_id === values[0] && s.domain_key === values[1]) || null;
            }
            if (/SELECT id, site_key FROM sites WHERE org_id=\? AND domain_key=\?/.test(sql)) {
              return db.sites.find((s) => s.org_id === values[0] && s.domain_key === values[1]) || null;
            }
            if (/count\(\*\) AS n FROM sites WHERE bound_license_hash=\?/.test(sql)) {
              return { n: db.sites.filter((s) => s.bound_license_hash === values[0]).length };
            }
            if (/SELECT id FROM sites WHERE id=\?/.test(sql)) {
              return db.sites.find((s) => s.id === values[0]) || null;
            }
            if (/FROM sites WHERE id=\? AND org_id=\?/.test(sql)) {
              return db.sites.find((s) => s.id === values[0] && s.org_id === values[1]) || null;
            }
            if (/FROM sites WHERE id=\?/.test(sql)) {
              return db.sites.find((s) => s.id === values[0]) || null;
            }
            return null;
          };
          return {
            first,
            async all() { return { results: [] }; },
            async run() {
              if (/INSERT INTO sites/.test(sql)) {
                // plan is a literal 'free' in the statement, so it is not bound.
                const [id, org_id, url, site_key, install_type, manual_plan, manual_plan_note,
                       domain_key, bound_license_hash, bound_at, website_uri] = values;
                if (db.sites.some((s) => s.org_id === org_id && s.domain_key === domain_key)) {
                  throw new Error("UNIQUE constraint failed: sites.org_id, sites.domain_key");
                }
                db.sites.push({
                  id, org_id, url, site_key, install_type, plan: "free",
                  manual_plan: manual_plan ?? null, manual_plan_note: manual_plan_note ?? null,
                  domain_key, bound_license_hash, bound_at, website_uri, profile_token_hash: null,
                });
                return { success: true };
              }
              if (/UPDATE sites SET profile_token_hash=\?/.test(sql)) {
                const site = db.sites.find((s) => s.id === values[1]);
                if (site) site.profile_token_hash = values[0];
                return { success: true };
              }
              if (/UPDATE sites SET bound_license_hash=\?/.test(sql)) {
                const site = db.sites.find((s) => s.id === values[4]);
                if (site) { site.bound_license_hash = values[0]; site.bound_at = values[1]; site.install_type = values[2]; }
                return { success: true };
              }
              if (/UPDATE sites SET manual_plan=\?/.test(sql)) {
                const site = db.sites.find((s) => s.id === values[1]);
                if (site) site.manual_plan = values[0];
                return { success: true };
              }
              if (/UPDATE sites SET bound_license_hash=NULL/.test(sql)) {
                const site = db.sites.find((s) => s.id === values[0]);
                if (site) { site.bound_license_hash = null; site.bound_at = null; site.domain_key = null; site.profile_token_hash = null; site.plan = "free"; }
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
  return { DB, db, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp" };
}

const ctx = { waitUntil() {} };
const call = (method, path, env, body, headers = {}) => handleApi(
  new Request(`https://w.test${path}`, {
    method,
    headers: { ...(body ? { "content-type": "application/json" } : {}), ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }), env, ctx);

/**
 * `manual` defaults to 1 here because most of these cases care about binding
 * rather than billing, and a manually issued key is the only kind that still
 * grants a tier on its own. Retail keys (manual: 0) are covered explicitly
 * below: billing decides their plan, so binding one grants nothing.
 */
async function envWithLicense({ seats = 1, plan = "standard", org_id = "org-canary", active = 1, manual = 1 } = {}) {
  const env = makeEnv();
  env.db.licenses = [{ license_hash: await sha256Hex(STANDARD_KEY), plan, active, org_id, seats, manual }];
  return env;
}

/* ---------------- a first bind creates the site ---------------- */

{
  const env = await envWithLicense();
  const response = await call("POST", "/api/license/bind", env, {
    license: STANDARD_KEY, domain: "https://www.Example.com/wp-admin/", site_url: "https://www.example.com/", install_type: "wp",
  });
  assert.equal(response.status, 200, "a valid license binds");
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.plan, "standard", "a manually issued license grants its tier");
  assert.equal(body.domain, "example.com", "the domain is normalised before it is stored");
  assert.ok(body.site_id, "a site id is minted");
  assert.ok(body.site_key, "a site key is minted");
  assert.ok(body.profile_token?.startsWith("nrvp_"), "a profile token is issued");
  assert.equal(body.bound, true);
  assert.equal(body.reused, false, "a first bind is not a reuse");

  const site = env.db.sites[0];
  assert.equal(site.domain_key, "example.com", "the normalised key is what lands in the row");
  // Billing owns sites.plan. A manual key records its grant separately, so a
  // later subscription - or its cancellation - decides plan without the key
  // having to be re-redeemed.
  assert.equal(site.plan, "free", "binding does not write the billed plan");
  assert.equal(site.manual_plan, "standard", "the manual grant is recorded on the site");
  assert.ok(site.profile_token_hash && !site.profile_token_hash.includes(body.profile_token), "only the token hash is stored");
}

/* ---------------- a retail key links, it does not pay ---------------- */

{
  // The ordinary case now: a key sold through checkout. Redeeming it registers
  // the install, and the Stripe subscription - not the key - decides the tier.
  const env = await envWithLicense({ manual: 0 });
  const body = await (await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain: "retail.example" })).json();
  assert.equal(body.ok, true, "a retail license still binds");
  assert.ok(body.site_id && body.site_key && body.profile_token, "and still registers the install");
  assert.equal(body.plan, "free", "but grants no tier on its own");

  const site = env.db.sites[0];
  assert.equal(site.plan, "free", "nothing is billed yet");
  assert.equal(site.manual_plan, null, "and no grant is recorded for a retail key");
}

{
  // Once billing has granted a tier, re-binding reports it rather than
  // overwriting it back to what the key says.
  const env = await envWithLicense({ manual: 0 });
  await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain: "paid.example" });
  env.db.sites[0].plan = "pro";   // as a subscription webhook would have set it
  const again = await (await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain: "paid.example" })).json();
  assert.equal(again.plan, "pro", "re-binding reports the billed tier");
  assert.equal(env.db.sites[0].plan, "pro", "and does not reset it to the license tier");
}

/* ---------------- binding again is idempotent ---------------- */

{
  const env = await envWithLicense();
  const first = await (await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain: "example.com" })).json();
  // The plugin re-sends this every time the licence field is saved.
  const second = await (await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain: "https://example.com/" })).json();
  assert.equal(second.site_id, first.site_id, "the same domain binds to the same site");
  assert.equal(env.db.sites.length, 1, "no second site row is created");
  assert.equal(second.reused, true, "the response says the binding already existed");
  assert.notEqual(second.profile_token, first.profile_token, "the write token is rotated on every bind");
}

// Differently spelled, still one site.
{
  const env = await envWithLicense();
  for (const domain of ["example.com", "https://www.example.com", "EXAMPLE.COM.", "http://example.com:8080/x"]) {
    await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain });
  }
  assert.equal(env.db.sites.length, 1, "four spellings of one domain produce one site");
}

/* ---------------- seats ---------------- */

{
  const env = await envWithLicense({ seats: 1 });
  const first = await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain: "first.example" });
  assert.equal(first.status, 200, "the first domain takes the only seat");
  const second = await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain: "second.example" });
  assert.equal(second.status, 409, "a second domain is refused when seats are exhausted");
  assert.equal((await second.json()).error, "seat_limit_reached");
  assert.equal(env.db.sites.length, 1, "the refused bind created nothing");
}

{
  const env = await envWithLicense({ seats: 3 });
  for (const domain of ["a.example", "b.example", "c.example"]) {
    assert.equal((await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain })).status, 200, `${domain} fits`);
  }
  assert.equal((await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain: "d.example" })).status, 409, "the fourth exceeds three seats");
  // Re-binding an existing domain must not consume another seat.
  assert.equal((await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain: "a.example" })).status, 200, "re-binding an existing domain still works at the seat limit");
  assert.equal(env.db.sites.length, 3, "still three sites");
}

// A subdomain is a separate site, so it costs a seat.
{
  const env = await envWithLicense({ seats: 1 });
  await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain: "example.com" });
  const sub = await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain: "shop.example.com" });
  assert.equal(sub.status, 409, "a subdomain is a distinct site and needs its own seat");
}

/* ---------------- existence is not disclosed ---------------- */

{
  const env = await envWithLicense();
  const unknown = await call("POST", "/api/license/bind", env, { license: "nrv_not_a_real_key", domain: "example.com" });
  assert.equal(unknown.status, 404);
  const unknownBody = await unknown.json();

  const inactiveEnv = await envWithLicense({ active: 0 });
  const inactive = await call("POST", "/api/license/bind", inactiveEnv, { license: STANDARD_KEY, domain: "example.com" });
  assert.equal(inactive.status, 404, "an inactive key answers like an unknown one");
  assert.deepEqual(await inactive.json(), unknownBody, "inactive and unknown are indistinguishable");

  const freeEnv = await envWithLicense({ plan: "free" });
  const free = await call("POST", "/api/license/bind", freeEnv, { license: STANDARD_KEY, domain: "example.com" });
  assert.equal(free.status, 404, "a free-plan key answers like an unknown one");
  assert.deepEqual(await free.json(), unknownBody, "free and unknown are indistinguishable");
}

/* ---------------- a license with no org cannot create a site ---------------- */

{
  const env = await envWithLicense({ org_id: null });
  const response = await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain: "example.com" });
  assert.equal(response.status, 409, "an unprovisioned license is refused");
  assert.equal((await response.json()).error, "license_not_provisioned");
  assert.equal(env.db.sites.length, 0, "no site is invented for it");
}

/* ---------------- domains that are not sites ---------------- */

{
  const env = await envWithLicense();
  for (const domain of ["", "localhost", "http://127.0.0.1:8080", "/just/a/path", "intranet"]) {
    const response = await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain });
    assert.equal(response.status, 400, `rejected as a domain: ${JSON.stringify(domain)}`);
    assert.equal((await response.json()).error, "invalid_domain");
  }
  assert.equal(env.db.sites.length, 0, "nothing was created for an unusable domain");
}

// Local development is a real case, but only when the deployment opts in.
{
  const env = await envWithLicense();
  env.WEBMCP_ALLOW_LOCAL_BIND = "1";
  const response = await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain: "http://localhost:8080/" });
  assert.equal(response.status, 200, "loopback binds when the deployment allows it");
  assert.equal((await response.json()).domain, "localhost");
}

/* ---------------- a site_key is not a credential for this ---------------- */

{
  const env = await envWithLicense();
  const response = await call("POST", "/api/license/bind", env, { site_key: "nrv_public_key", domain: "example.com" });
  assert.equal(response.status, 400, "a site key is not accepted in place of a license");
  assert.equal(env.db.sites.length, 0, "and binds nothing");
}

/* ---------------- rate limiting ---------------- */

{
  const env = await envWithLicense({ seats: 99 });
  let limited = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    const response = await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain: `d${attempt}.example` });
    if (response.status === 429) { limited = attempt; break; }
  }
  assert.ok(limited !== null && limited <= 10, `the per-caller limit stops guessing (stopped at attempt ${limited})`);
}

/* ---------------- unbind frees the seat ---------------- */

{
  const env = await envWithLicense({ seats: 1 });
  const first = await (await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain: "old.example" })).json();
  assert.equal((await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain: "new.example" })).status, 409, "no seat left");

  const unbind = await call("POST", `/api/sites/${first.site_id}/unbind`, env, {}, SESSION);
  assert.equal(unbind.status, 200, "a member can unbind their own site");
  const unbound = await unbind.json();
  assert.equal(unbound.bound, false);
  // This key is manually issued, so the grant recorded on the site outlives the
  // binding. Unbinding releases a seat; it does not take away a tier. The old
  // assertion here expected "free" because unbind wrote plan='free' - a leftover
  // from before billing became the source of truth. See test-unbind-plan.mjs.
  assert.equal(unbound.plan, "standard", "releasing the binding does not revoke the grant");

  const site = env.db.sites.find((s) => s.id === first.site_id);
  assert.equal(site.bound_license_hash, null, "the binding is cleared");
  assert.equal(site.domain_key, null, "the domain is released so it can be claimed again");
  assert.equal(site.profile_token_hash, null, "the write token is revoked");
  assert.equal(site.manual_plan, "standard", "and the grant itself is untouched");

  const rebound = await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain: "new.example" });
  assert.equal(rebound.status, 200, "the freed seat is usable");
}

/* ---------------- unbind is member-authenticated ---------------- */

{
  const env = await envWithLicense();
  const bound = await (await call("POST", "/api/license/bind", env, { license: STANDARD_KEY, domain: "example.com" })).json();

  // Two separate gates, asserted separately so neither can quietly stop working:
  // the CSRF token, and the session behind it.
  const noCsrf = await call("POST", `/api/sites/${bound.site_id}/unbind`, env, {});
  assert.equal(noCsrf.status, 403, "a cross-site POST is rejected");
  assert.equal((await noCsrf.json()).error, "csrf_failed");

  const csrfOnly = await call("POST", `/api/sites/${bound.site_id}/unbind`, env, {}, { cookie: `nrv_csrf=${CSRF}`, "x-csrf-token": CSRF });
  assert.equal(csrfOnly.status, 401, "a valid CSRF token without a session is still unauthorised");
  assert.equal((await csrfOnly.json()).error, "unauthorized");

  // The license is the credential for binding, deliberately not for unbinding.
  const withLicense = await call("POST", `/api/sites/${bound.site_id}/unbind`, env, { license: STANDARD_KEY }, { cookie: `nrv_csrf=${CSRF}`, "x-csrf-token": CSRF });
  assert.equal(withLicense.status, 401, "holding the license key does not authorise unbinding");

  const site = env.db.sites.find((s) => s.id === bound.site_id);
  assert.ok(site.bound_license_hash, "the binding survived both attempts");
}

console.log("license bind tests passed");
