/**
 * Dashboard-first pairing: the site exists, the code only attaches an install.
 *
 * Binding used to run the other way. The plugin held a licence key, redeemed it,
 * and the service created a site from it - so a row appeared that the account
 * owner had never chosen. Nothing issued those keys either: `licenses` contains
 * only the two canary fixtures from 0017.
 *
 * What a code must never be able to do is the point of most of these: create a
 * site, work twice from somewhere else, work after it expires, or move a site to
 * a domain that is not the one it was registered for.
 */
import assert from "node:assert/strict";
import { handleApi } from "../worker/api.mjs";

const SITE_ID = "site1";
const CSRF = "c".repeat(64);
const SESSION = { cookie: `nrv_session=t; nrv_csrf=${CSRF}`, "x-csrf-token": CSRF, "content-type": "application/json", origin: "https://nurevo.jp" };

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function makeEnv({ site = {}, orgId = "org1" } = {}) {
  const row = {
    id: SITE_ID, org_id: "org1", url: "example.com", site_key: "nrv_k", install_type: "wp",
    plan: "free", manual_plan: null, delivery_status: "active",
    domain_key: null, bound_at: null, website_uri: null, profile_token_hash: null,
    pairing_code_hash: null, pairing_code_expires_at: null, pairing_code_used_at: null, ...site,
  };
  const db = { sites: [row], rateLimits: new Map() };
  const DB = {
    prepare(sql) {
      const first = async (...values) => {
        if (/FROM sessions/.test(sql)) {
          return { member_id: "m1", org_id: orgId, email: "o@x.test", role: "admin", status: "active", expires_at: Date.now() + 3.6e6 };
        }
        if (/INSERT INTO api_rate_limits/.test(sql)) {
          const count = (db.rateLimits.get(values[0]) || 0) + 1;
          db.rateLimits.set(values[0], count);
          return { count, window_started_at: Date.now() };
        }
        if (/FROM sites WHERE pairing_code_hash=\?/.test(sql)) {
          return db.sites.find((s) => s.pairing_code_hash && s.pairing_code_hash === values[0]) || null;
        }
        if (/SELECT plan, manual_plan FROM sites WHERE id=\?/.test(sql)) {
          const s = db.sites.find((x) => x.id === values[0]);
          return s ? { plan: s.plan, manual_plan: s.manual_plan } : null;
        }
        if (/SELECT id FROM sites WHERE id=\?/.test(sql)) return db.sites.find((s) => s.id === values[0]) || null;
        if (/FROM sites WHERE id=\? AND org_id=\?/.test(sql)) {
          return db.sites.find((s) => s.id === values[0] && s.org_id === values[1]) || null;
        }
        if (/FROM sites WHERE id=\?/.test(sql)) return db.sites.find((s) => s.id === values[0]) || null;
        return null;
      };
      return {
        bind(...values) {
          return {
            first: () => first(...values),
            async all() { return { results: [] }; },
            async run() {
              if (/UPDATE sites SET pairing_code_hash=\?/.test(sql)) {
                const s = db.sites.find((x) => x.id === values[2]);
                if (s) { s.pairing_code_hash = values[0]; s.pairing_code_expires_at = values[1]; s.pairing_code_used_at = null; }
              } else if (/UPDATE sites SET domain_key=\?/.test(sql)) {
                const s = db.sites.find((x) => x.id === values[5]);
                if (db.sites.some((x) => x.id !== values[5] && x.org_id === s.org_id && x.domain_key === values[0])) {
                  throw new Error("UNIQUE constraint failed: sites.org_id, sites.domain_key");
                }
                if (s) {
                  s.domain_key = values[0]; s.bound_at = values[1]; s.install_type = values[2];
                  s.pairing_code_used_at = values[3];
                  if (values[4]) s.website_uri = values[4];
                }
              } else if (/UPDATE sites SET profile_token_hash=\?/.test(sql)) {
                const s = db.sites.find((x) => x.id === values[1]);
                if (s) s.profile_token_hash = values[0];
              }
              return { success: true };
            },
          };
        },
        first, async all() { return { results: [] }; }, async run() { return { success: true }; },
      };
    },
  };
  return { DB, db, row, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp" };
}

const ctx = { waitUntil() {} };
const issue = (env, id = SITE_ID) => handleApi(
  new Request(`https://w.test/api/sites/${id}/pairing-code`, { method: "POST", headers: SESSION }), env, ctx);
const pair = (env, body) => handleApi(
  new Request("https://w.test/api/pair", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), env, ctx);

/* ---------------- issuing ---------------- */

{
  const env = makeEnv();
  const response = await issue(env);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(/^NRV(-[A-Z0-9]{5}){4}$/.test(body.pairing_code), `the code is readable and grouped: ${body.pairing_code}`);
  assert.ok(body.expires_at > Date.now(), "and it expires");

  // A code that can attach an install must not be readable back out of storage.
  const stored = env.row.pairing_code_hash;
  assert.ok(stored && stored.length === 64, "only a hash is stored");
  assert.equal(stored.includes(body.pairing_code), false, "never the code itself");
  assert.equal(JSON.stringify(body).includes(stored), false, "and the hash is not handed out");

  // The alphabet leaves out the characters that get misread when retyped.
  assert.equal(/[OIL01]/.test(body.pairing_code.replace("NRV", "")), false, "ambiguous characters are excluded");
}

{
  // Re-issuing is how a lost code is replaced, so the old one has to stop.
  const env = makeEnv();
  const first = await (await issue(env)).json();
  const second = await (await issue(env)).json();
  assert.notEqual(second.pairing_code, first.pairing_code, "a new code is minted");

  const stale = await pair(env, { code: first.pairing_code, domain: "example.com" });
  assert.equal(stale.status, 404, "the replaced code no longer works");
  const fresh = await pair(env, { code: second.pairing_code, domain: "example.com" });
  assert.equal(fresh.status, 200, "the new one does");
}

{
  const anonymous = await handleApi(
    new Request(`https://w.test/api/sites/${SITE_ID}/pairing-code`, { method: "POST", headers: { cookie: `nrv_csrf=${CSRF}`, "x-csrf-token": CSRF, origin: "https://nurevo.jp" } }),
    makeEnv(), ctx);
  assert.equal(anonymous.status, 401, "issuing needs a session");

  const noCsrf = await handleApi(
    new Request(`https://w.test/api/sites/${SITE_ID}/pairing-code`, { method: "POST", headers: { cookie: "nrv_session=t" } }), makeEnv(), ctx);
  assert.equal(noCsrf.status, 403, "and a CSRF token");

  const other = await issue(makeEnv({ site: { org_id: "other-org" } }));
  assert.equal(other.status, 403, "another org's site cannot be given a code");

  const missing = await issue(makeEnv(), "nosuchsite");
  assert.equal(missing.status, 404);
}

/* ---------------- pairing ---------------- */

{
  const env = makeEnv();
  const { pairing_code } = await (await issue(env)).json();
  const response = await pair(env, { code: pairing_code, domain: "https://www.Example.com/wp-admin/", site_url: "https://www.example.com/", install_type: "wp" });
  assert.equal(response.status, 200);
  const body = await response.json();

  assert.equal(body.site_id, SITE_ID, "the install attaches to the site that was already there");
  assert.equal(body.site_key, "nrv_k");
  assert.ok(body.profile_token?.startsWith("nrvp_"), "and receives a write token");
  assert.equal(body.domain, "example.com", "the domain is normalised");
  assert.equal(body.paired, true);
  // Pairing links an install. It grants nothing: billing and any manual grant
  // decide the tier, the same way every other reader resolves it.
  assert.equal(body.plan, "free");

  assert.equal(env.row.domain_key, "example.com", "the claim is recorded");
  assert.ok(env.row.bound_at, "with a time");
  assert.ok(env.row.pairing_code_used_at, "and the code is marked used");
  assert.equal(env.row.website_uri, "https://www.example.com/", "the site URL is kept");
  assert.equal(env.db.sites.length, 1, "no row is created by pairing");
}

{
  // The grant still comes from where it always did.
  const env = makeEnv({ site: { manual_plan: "pro" } });
  const { pairing_code } = await (await issue(env)).json();
  const body = await (await pair(env, { code: pairing_code, domain: "example.com" })).json();
  assert.equal(body.plan, "pro", "a manually granted tier is reported");
}

/* ---------------- a retry is not a second use ---------------- */

{
  // The plugin may lose the response that carried its token - a timeout on the
  // way back is indistinguishable from a failure. Repeating from the same
  // domain has to work, or an install that did everything right is stranded.
  const env = makeEnv();
  const { pairing_code } = await (await issue(env)).json();
  const first = await (await pair(env, { code: pairing_code, domain: "example.com" })).json();
  const retry = await pair(env, { code: pairing_code, domain: "example.com" });
  assert.equal(retry.status, 200, "the same install may retry");
  const second = await retry.json();
  assert.equal(second.site_id, first.site_id, "and reaches the same site");
  assert.notEqual(second.profile_token, first.profile_token, "with a fresh token, since the first may be lost");
  assert.equal(env.db.sites.length, 1);
}

{
  // But a used code must not move the site somewhere else. This is what makes
  // a leaked or shared code harmless.
  const env = makeEnv({ site: { url: "", website_uri: "" } });
  const { pairing_code } = await (await issue(env)).json();
  await pair(env, { code: pairing_code, domain: "first.example" });
  const elsewhere = await pair(env, { code: pairing_code, domain: "attacker.example" });
  assert.equal(elsewhere.status, 409, "a used code cannot be redeemed from another domain");
  assert.equal((await elsewhere.json()).error, "code_already_used");
  assert.equal(env.row.domain_key, "first.example", "the original claim stands");
}

/* ---------------- the domain has to be the registered one ---------------- */

{
  const env = makeEnv({ site: { url: "example.com" } });
  const { pairing_code } = await (await issue(env)).json();
  const response = await pair(env, { code: pairing_code, domain: "somewhere-else.example" });
  assert.equal(response.status, 409, "pairing from a different domain is refused");
  const body = await response.json();
  assert.equal(body.error, "domain_mismatch");
  assert.equal(body.expected, "example.com", "and says which domain was expected");
  assert.equal(env.row.domain_key, null, "nothing is claimed");
  assert.equal(env.row.pairing_code_used_at, null, "and the code is not spent on a failure");
}

{
  // website_uri wins over url when both are set, because it is the canonical
  // field #5 settled on.
  const env = makeEnv({ site: { url: "old.example", website_uri: "https://new.example/" } });
  const { pairing_code } = await (await issue(env)).json();
  assert.equal((await pair(env, { code: pairing_code, domain: "new.example" })).status, 200, "the canonical URL is what matters");
}

{
  // A site registered without a URL - a hosted store, say - takes the domain it
  // is paired from.
  const env = makeEnv({ site: { url: "", website_uri: null } });
  const { pairing_code } = await (await issue(env)).json();
  assert.equal((await pair(env, { code: pairing_code, domain: "anything.example" })).status, 200);
  assert.equal(env.row.domain_key, "anything.example");
}

/* ---------------- expiry ---------------- */

{
  const env = makeEnv();
  const { pairing_code } = await (await issue(env)).json();
  env.row.pairing_code_expires_at = Date.now() - 1;
  const response = await pair(env, { code: pairing_code, domain: "example.com" });
  assert.equal(response.status, 404, "an expired code stops working");
  // The same answer as an unknown code, so a caller cannot learn that a code
  // once existed by the difference.
  assert.equal((await response.json()).error, "invalid_code");
  assert.equal(env.row.domain_key, null, "and claims nothing");
}

/* ---------------- codes that are not codes ---------------- */

{
  const env = makeEnv();
  await issue(env);
  for (const code of ["", null, "NRV", "not-a-code", "   ", "NRV-AAAAA-AAAAA-AAAAA-AAAAA"]) {
    const response = await pair(env, { code, domain: "example.com" });
    assert.equal(response.status, 404, `refused: ${JSON.stringify(code)}`);
    assert.equal(env.row.domain_key, null, "and claims nothing");
  }
}

{
  // A site with no outstanding code must not be matched by an empty one.
  const env = makeEnv({ site: { pairing_code_hash: null } });
  const response = await pair(env, { code: "", domain: "example.com" });
  assert.equal(response.status, 404, "an empty code matches no row");
}

{
  // Case and spacing are normalised: a code read down a phone line should work.
  const env = makeEnv();
  const { pairing_code } = await (await issue(env)).json();
  const retyped = pairing_code.toLowerCase().replace(/-/g, " ");
  assert.equal((await pair(env, { code: retyped, domain: "example.com" })).status, 200, "a retyped code still pairs");
}

{
  const env = makeEnv();
  const { pairing_code } = await (await issue(env)).json();
  for (const domain of ["", "localhost", "/just/a/path", "intranet"]) {
    const response = await pair(env, { code: pairing_code, domain });
    assert.equal(response.status, 400, `rejected as a domain: ${JSON.stringify(domain)}`);
    assert.equal((await response.json()).error, "invalid_domain");
  }
  assert.equal(env.row.pairing_code_used_at, null, "a bad domain does not spend the code");
}

/* ---------------- one domain, one site ---------------- */

{
  // No registered URL on this site, so the domain-mismatch guard does not fire
  // and the unique index is what has to answer.
  const env = makeEnv({ site: { url: "", website_uri: null } });
  env.db.sites.push({ ...env.row, id: "site2", site_key: "nrv_k2", domain_key: "taken.example", pairing_code_hash: null });
  const { pairing_code } = await (await issue(env)).json();
  const response = await pair(env, { code: pairing_code, domain: "taken.example" });
  assert.equal(response.status, 409, "a domain another site in the org already holds is refused");
  assert.equal((await response.json()).error, "domain_already_paired");
}

/* ---------------- the endpoint is rate limited ---------------- */

{
  const env = makeEnv();
  let limited = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    const response = await pair(env, { code: `NRV-AAAAA-AAAAA-AAAAA-A${String(attempt).padStart(4, "0")}`, domain: "example.com" });
    if (response.status === 429) { limited = attempt; break; }
  }
  assert.ok(limited !== null && limited <= 10, `guessing is slowed from one caller (stopped at ${limited})`);
}

/* ---------------- pairing needs no CSRF token and no session ---------------- */

{
  // Server-to-server from the plugin: there is no cookie, so a CSRF token would
  // prove nothing. If this ever started requiring one, every plugin would break.
  const env = makeEnv();
  const { pairing_code } = await (await issue(env)).json();
  const response = await pair(env, { code: pairing_code, domain: "example.com" });
  assert.equal(response.status, 200, "no session and no CSRF token is the normal case here");
}

console.log("pairing code tests passed");
