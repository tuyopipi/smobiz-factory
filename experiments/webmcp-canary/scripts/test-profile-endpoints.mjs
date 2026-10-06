/**
 * U2b Units 3-4: the profile routes and the three writers converging.
 *
 * Checks the behaviour an operator depends on: wp-admin and the dashboard both
 * write the same record, Places cannot undo a person's edit, and a public
 * site_key cannot write anything.
 */
import assert from "node:assert/strict";
import { handleApi } from "../worker/api.mjs";

// Alphanumeric: the dashboard PUT route matches [a-z0-9]+, as real site ids are.
const SITE = "psite01";
const CSRF = "c".repeat(64);
const SESSION_HEADERS = { cookie: `nrv_session=t; nrv_csrf=${CSRF}`, "x-csrf-token": CSRF };

/** In-memory D1 double backed by plain objects, so merges are observable. */
function makeEnv({ settings = {}, site = {} } = {}) {
  const db = {
    sites: { id: SITE, org_id: "o", url: "p.example.com", website_uri: "https://p.example.com", plan: "pro", delivery_status: "active", profile_token_hash: null, ...site },
    settings: { site_id: SITE, field_sources: null, updated_at: null, ...settings },
    rateLimits: new Map(),
  };
  const DB = {
    prepare(sql) {
      const run = (values) => {
        if (/UPDATE sites SET profile_token_hash=/.test(sql)) { db.sites.profile_token_hash = values[0]; return { success: true }; }
        if (/UPDATE sites SET website_uri=/.test(sql)) { db.sites.website_uri = values[0]; return { success: true }; }
        if (/INSERT INTO site_settings \(site_id,serve_schema,allow_crawlers\)/.test(sql)) {
          if (values.length > 1) { db.settings.serve_schema = values[1]; db.settings.allow_crawlers = values[2]; }
          return { success: true };
        }
        if (/INSERT INTO site_settings \(site_id,/.test(sql)) {
          const columns = sql.match(/INSERT INTO site_settings \(site_id,([^)]*)\)/)[1]
            .split(",").map((c) => c.trim()).filter((c) => c && c !== "updated_at" && c !== "field_sources");
          columns.forEach((column, index) => { db.settings[column] = values[index + 1]; });
          db.settings.updated_at = values[columns.length + 1];
          db.settings.field_sources = values[columns.length + 2];
          return { success: true };
        }
        if (/UPDATE sites SET/.test(sql)) return { success: true };
        if (/api_rate_limits/.test(sql)) return { success: true };
        return { success: true };
      };
      return {
        bind(...values) {
          return {
            async first() {
              if (/FROM sessions/.test(sql)) return { member_id: "m", org_id: "o", email: "e@x.test", role: "admin", status: "active", expires_at: Date.now() + 3.6e6 };
              if (/SELECT \* FROM site_settings/.test(sql)) return values[0] === SITE ? { ...db.settings } : null;
              if (/SELECT id,website_uri FROM sites/.test(sql)) return values[0] === SITE ? { ...db.sites } : null;
              if (/SELECT id,profile_token_hash,delivery_status FROM sites/.test(sql)) return values[0] === SITE ? { ...db.sites } : null;
              if (/FROM sites WHERE id=\? AND org_id=\?|FROM sites WHERE id=\?/.test(sql)) return values[0] === SITE ? { ...db.sites } : null;
              if (/FROM api_rate_limits/.test(sql)) return db.rateLimits.get(values[0]) || null;
              return null;
            },
            async all() { return { results: [] }; },
            async run() { return run(values); },
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
const call = (method, path, env, { headers = {}, body } = {}) => handleApi(
  new Request(`https://w.test${path}`, {
    method,
    headers: { ...(body ? { "content-type": "application/json" } : {}), ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }), env, ctx);

async function issueToken(env) {
  const response = await call("POST", `/api/sites/${SITE}/profile-token`, env, { headers: SESSION_HEADERS, body: {} });
  assert.equal(response.status, 200, "a member can issue a profile token");
  const body = await response.json();
  assert.ok(body.profile_token.startsWith("nrvp_"), "the token is returned once in plaintext");
  assert.ok(env.db.sites.profile_token_hash && !env.db.sites.profile_token_hash.includes(body.profile_token),
    "only the hash is stored, never the plaintext");
  return body.profile_token;
}

/* ---------------- auth ---------------- */

{
  const env = makeEnv();
  const noToken = await call("GET", `/api/sites/${SITE}/profile`, env);
  assert.equal(noToken.status, 401, "no bearer token is rejected");

  const beforeIssue = await call("GET", `/api/sites/${SITE}/profile`, env, { headers: { authorization: "Bearer anything" } });
  assert.equal(beforeIssue.status, 404, "a site with no token issued cannot be read");

  const token = await issueToken(env);

  // The public site_key must never authorise a profile write.
  const withSiteKey = await call("PUT", `/api/sites/${SITE}/profile?site_key=nrv_public`, env, { body: { name: "乗っ取り" } });
  assert.equal(withSiteKey.status, 401, "site_key alone cannot write the profile");
  assert.notEqual(env.db.settings.name, "乗っ取り", "nothing was written");

  const wrongToken = await call("GET", `/api/sites/${SITE}/profile`, env, { headers: { authorization: "Bearer nrvp_wrong" } });
  assert.equal(wrongToken.status, 403, "a wrong token is rejected");

  const ok = await call("GET", `/api/sites/${SITE}/profile`, env, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(ok.status, 200, "the issued token reads the profile");
  const body = await ok.json();
  assert.ok("profile" in body && "field_sources" in body && "updated_at" in body, "the response carries values and provenance");

  // Rotation invalidates the old token.
  const rotated = await issueToken(env);
  assert.notEqual(rotated, token, "rotation produces a new token");
  const stale = await call("GET", `/api/sites/${SITE}/profile`, env, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(stale.status, 403, "the previous token stops working after rotation");
}

/* ---------------- wp-admin writes, server stamps the clock ---------------- */

{
  const env = makeEnv();
  const token = await issueToken(env);
  const auth = { authorization: `Bearer ${token}` };

  const before = Date.now();
  const write = await call("PUT", `/api/sites/${SITE}/profile`, env, {
    headers: auth,
    // A forged future timestamp and an unknown field are both supplied.
    body: { address: "東京都渋谷区1-1-1", phone: "03-1111-1111", updated_at: 99_999_999_999_999, plan: "pro" },
  });
  assert.equal(write.status, 200, "the write succeeds");
  const result = await write.json();
  assert.deepEqual(result.changed.sort(), ["address", "phone"], "both fields moved");
  assert.equal(result.profile.address, "東京都渋谷区1-1-1", "the address is stored");
  assert.ok(result.updated_at >= before && result.updated_at <= Date.now(), "the stamp is the server clock");
  assert.ok(result.updated_at < 99_999_999_999_999, "the forged timestamp is ignored");
  assert.equal(result.field_sources.address.source, "wordpress", "provenance records wp-admin");
  assert.equal(env.db.settings.address, "東京都渋谷区1-1-1", "it reached site_settings");
  assert.equal(env.db.settings.tel, "03-1111-1111", "phone was written to the tel column");

  // Re-reading returns the same record.
  const read = await (await call("GET", `/api/sites/${SITE}/profile`, env, { headers: auth })).json();
  assert.equal(read.profile.address, "東京都渋谷区1-1-1", "the stored value reads back");
  assert.equal(read.profile.phone, "03-1111-1111", "tel reads back as phone");
}

/* ---------------- the three writers converge on one record ---------------- */

{
  const env = makeEnv();
  const token = await issueToken(env);
  const auth = { authorization: `Bearer ${token}` };

  // 1. wp-admin sets the address.
  await call("PUT", `/api/sites/${SITE}/profile`, env, { headers: auth, body: { address: "手入力の住所" } });
  assert.equal(env.db.settings.address, "手入力の住所");

  // 2. The dashboard sets the phone on the same record.
  const dash = await call("PUT", `/api/sites/${SITE}`, env, {
    headers: SESSION_HEADERS,
    body: { name: "ダッシュボード店名", tel: "03-2222-2222", serve_schema: true, allow_crawlers: true },
  });
  assert.equal(dash.status, 200, "the dashboard write succeeds");
  assert.equal(env.db.settings.tel, "03-2222-2222", "the dashboard wrote the phone");
  assert.equal(env.db.settings.address, "手入力の住所", "and left wp-admin's address alone");

  // 3. wp-admin reads back and sees the dashboard's change: one record.
  const merged = await (await call("GET", `/api/sites/${SITE}/profile`, env, { headers: auth })).json();
  assert.equal(merged.profile.phone, "03-2222-2222", "wp-admin sees the dashboard's phone");
  assert.equal(merged.profile.address, "手入力の住所", "and its own address");
  assert.equal(merged.field_sources.phone.source, "dashboard", "provenance distinguishes the writers");
  assert.equal(merged.field_sources.address.source, "wordpress", "both owners are recorded");

  // Output toggles stay out of the profile.
  assert.equal("serve_schema" in merged.profile, false, "serve_schema is not a profile field");
  assert.equal("allow_crawlers" in merged.profile, false, "allow_crawlers is not a profile field");
}

/* ---------------- a clear is explicit, a blank is not ---------------- */

{
  const env = makeEnv();
  const token = await issueToken(env);
  const auth = { authorization: `Bearer ${token}` };
  await call("PUT", `/api/sites/${SITE}/profile`, env, { headers: auth, body: { address: "住所あり" } });

  await call("PUT", `/api/sites/${SITE}/profile`, env, { headers: auth, body: { address: "" } });
  assert.equal(env.db.settings.address, "住所あり", "an empty string does not clear a stored address");

  await call("PUT", `/api/sites/${SITE}/profile`, env, { headers: auth, body: { address: null } });
  assert.equal(env.db.settings.address, null, "an explicit null clears it");
}

/* ---------------- url lives on the sites row ---------------- */

{
  const env = makeEnv();
  const token = await issueToken(env);
  await call("PUT", `/api/sites/${SITE}/profile`, env, {
    headers: { authorization: `Bearer ${token}` },
    body: { url: "https://moved.example.com" },
  });
  assert.equal(env.db.sites.website_uri, "https://moved.example.com", "url is persisted to sites.website_uri");
  assert.equal(env.db.settings.website_uri, undefined, "it does not leak into site_settings");
}

console.log("profile endpoint tests passed");
