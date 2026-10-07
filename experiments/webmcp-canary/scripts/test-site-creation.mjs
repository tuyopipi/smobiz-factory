/**
 * Creating a site from its address, with no Google Places in the way.
 *
 * POST /api/sites used to refuse anything without a place_id, so a site could
 * only exist if Google already knew about it and the Places API was reachable
 * and configured. The address bar is enough; what the store is called and what
 * it sells are the owner's to tell us.
 *
 * Together with the pairing code from Phase 2 this closes the loop: create here,
 * issue a code, type it into the plugin.
 */
import assert from "node:assert/strict";
import { handleApi } from "../worker/api.mjs";

const CSRF = "c".repeat(64);
const HEADERS = { cookie: `nrv_session=t; nrv_csrf=${CSRF}`, "x-csrf-token": CSRF, "content-type": "application/json", origin: "https://nurevo.jp" };

function makeEnv({ role = "admin" } = {}) {
  const db = { sites: [], settings: [], profiles: [] };
  const DB = {
    prepare(sql) {
      const first = async (...values) => {
        if (/FROM sessions/.test(sql)) {
          return { member_id: "m1", org_id: "org1", email: "o@x.test", role, status: "active", expires_at: Date.now() + 3.6e6 };
        }
        if (/FROM sites WHERE slug=\?/.test(sql)) return db.sites.find((s) => s.slug === values[0] && s.id !== values[1]) || null;
        if (/FROM site_settings/.test(sql)) return db.settings.find((s) => s.site_id === values[0]) || null;
        if (/SELECT id,website_uri FROM sites WHERE id=\?/.test(sql)) return db.sites.find((s) => s.id === values[0]) || null;
        if (/FROM sites WHERE id=\?/.test(sql)) return db.sites.find((s) => s.id === values[0]) || null;
        return null;
      };
      return {
        bind(...values) {
          return {
            first: () => first(...values),
            async all() { return { results: [] }; },
            async run() {
              if (/INSERT INTO sites/.test(sql)) {
                const [id, org_id, owner, url, site_key, install_type, slug] = values;
                db.sites.push({ id, org_id, owner_member_id: owner, url, site_key, install_type, slug, plan: "free" });
              } else if (/INSERT INTO site_settings \(site_id,serve_schema/.test(sql)) {
                if (!db.settings.some((s) => s.site_id === values[0])) db.settings.push({ site_id: values[0], serve_schema: 1, allow_crawlers: 1 });
              } else if (/INSERT INTO site_settings \(site_id,/.test(sql)) {
                const columns = (sql.match(/INSERT INTO site_settings \(site_id,([^)]*?),updated_at,field_sources\)/) || [])[1];
                const row = db.settings.find((s) => s.site_id === values[0]) || { site_id: values[0] };
                if (columns) {
                  const names = columns.split(",");
                  names.forEach((c, i) => { row[c] = values[i + 1]; });
                  // The statement ends with updated_at and field_sources, which
                  // is where the provenance this test checks actually lands.
                  row.updated_at = values[names.length + 1];
                  row.field_sources = values[names.length + 2];
                }
                if (!db.settings.includes(row)) db.settings.push(row);
              } else if (/UPDATE sites SET website_uri=/.test(sql)) {
                const site = db.sites.find((s) => s.id === values[1]);
                if (site) site.website_uri = values[0];
              } else if (/UPDATE sites SET profile_token_hash=/.test(sql)) {
                const site = db.sites.find((s) => s.id === values[1]);
                if (site) site.profile_token_hash = values[0];
              } else if (/UPDATE sites SET pairing_code_hash=/.test(sql)) {
                const site = db.sites.find((s) => s.id === values[2]);
                if (site) { site.pairing_code_hash = values[0]; site.pairing_code_expires_at = values[1]; }
              }
              return { success: true };
            },
          };
        },
        first, async all() { return { results: [] }; }, async run() { return { success: true }; },
      };
    },
  };
  return { DB, db, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp" };
}

const create = async (env, body) => {
  const response = await handleApi(
    new Request("https://w.test/api/sites", { method: "POST", headers: HEADERS, body: JSON.stringify(body) }),
    env, { waitUntil() {} },
  );
  return { status: response.status, body: await response.json() };
};

/* ---------------- a URL is all it takes ---------------- */

{
  const env = makeEnv();
  const { status, body } = await create(env, { install_type: "wp", url: "https://example.com/" });
  assert.equal(status, 200, "no Google Maps selection is required");
  assert.ok(body.id && body.siteKey, "a site and key are minted");
  assert.ok(body.profile_token?.startsWith("nrvp_"), "with a write token");
  assert.equal(env.db.sites.length, 1);
  assert.equal(env.db.sites[0].url, "example.com", "the scheme is stripped for the stored identifier");

  // The response no longer carries anything imported from Google.
  for (const key of ["imported", "proposal", "place_id"]) {
    assert.equal(key in body, false, `${key} is gone from the response`);
  }
}

{
  // The old refusal, which is the thing being removed.
  const env = makeEnv();
  const { status } = await create(env, { install_type: "tag", url: "example.com" });
  assert.equal(status, 200, "a site without a place_id is no longer refused");
}

{
  const env = makeEnv();
  const { status, body } = await create(env, { install_type: "tag" });
  assert.equal(status, 400, "a non-hosted site still needs an address");
  assert.equal(body.error, "url required");
}

/* ---------------- what the owner types is kept ---------------- */

{
  const env = makeEnv();
  const { body } = await create(env, { install_type: "wp", url: "https://cafe.example/", name: "栞珈琲", business_type: "CafeOrCoffeeShop" });
  const settings = env.db.settings.find((s) => s.site_id === body.id);
  assert.equal(settings.name, "栞珈琲", "the name is stored");
  assert.equal(settings.business_type_schema, "CafeOrCoffeeShop", "and the business type");
  assert.equal(env.db.sites[0].website_uri, "https://cafe.example/", "the full URL becomes the canonical one");
  // It goes through the merger, so a later edit from wp-admin can build on it.
  assert.ok(settings.field_sources?.includes("dashboard"), "written with provenance");
}

{
  // A bare domain is given a scheme before it becomes the canonical URL.
  const env = makeEnv();
  await create(env, { install_type: "tag", url: "shop.example" });
  assert.equal(env.db.sites[0].website_uri, "https://shop.example");
}

{
  // Nothing optional supplied: the row still exists and the output toggles are
  // on, so a paired install publishes from day one.
  const env = makeEnv();
  const { body } = await create(env, { install_type: "tag", url: "bare.example" });
  const settings = env.db.settings.find((s) => s.site_id === body.id);
  assert.equal(settings.serve_schema, 1);
  assert.equal(settings.allow_crawlers, 1);
}

/* ---------------- hosted stores survive ---------------- */

{
  // Hosted stores were the ones most dependent on Places for their data. They
  // are kept; the slug now comes from the name, or the URL when there is none.
  const env = makeEnv();
  const { status, body } = await create(env, { install_type: "hosted", name: "Lumina Omotesando" });
  assert.equal(status, 200, "a hosted store needs no URL");
  assert.equal(body.slug, "lumina-omotesando", "the slug comes from the name");
  assert.equal(body.hostedUrl, "/s/lumina-omotesando");
}

{
  const env = makeEnv();
  const { body } = await create(env, { install_type: "hosted", url: "https://shop.example/" });
  assert.ok(body.slug, "a hosted store with no name still gets a slug");
  assert.ok(body.slug.includes("shop"), `derived from the URL: ${body.slug}`);
}

{
  // Two stores of the same name do not collide.
  const env = makeEnv();
  const first = await create(env, { install_type: "hosted", name: "Cafe" });
  const second = await create(env, { install_type: "hosted", name: "Cafe" });
  assert.notEqual(second.body.slug, first.body.slug, "the second slug is distinct");
}

/* ---------------- the loop closes ---------------- */

{
  // Create, then issue the code that connects the install. This is the whole
  // point of the change: the licence key had no issuer, so this is the only
  // route that actually works end to end.
  const env = makeEnv();
  const { body } = await create(env, { install_type: "wp", url: "paired.example" });
  const response = await handleApi(
    new Request(`https://w.test/api/sites/${body.id}/pairing-code`, { method: "POST", headers: HEADERS }),
    env, { waitUntil() {} },
  );
  assert.equal(response.status, 200, "a freshly created site can be given a pairing code");
  const issued = await response.json();
  assert.ok(/^NRV(-[A-Z0-9]{5}){4}$/.test(issued.pairing_code));
  assert.ok(env.db.sites[0].pairing_code_hash, "and only its hash is stored");
}

/* ---------------- access control is unchanged ---------------- */

{
  const anonymous = await handleApi(
    new Request("https://w.test/api/sites", { method: "POST", headers: { "content-type": "application/json", "x-csrf-token": CSRF, cookie: `nrv_csrf=${CSRF}`, origin: "https://nurevo.jp" }, body: JSON.stringify({ url: "x.example" }) }),
    makeEnv(), { waitUntil() {} },
  );
  assert.equal(anonymous.status, 401, "creating a site needs a session");
}

{
  const { status } = await create(makeEnv({ role: "viewer" }), { install_type: "tag", url: "x.example" });
  assert.equal(status, 403, "a role that may not register sites still cannot");
}

/* ---------------- Places is gone, not merely unused ---------------- */

{
  const env = makeEnv();
  for (const path of ["/api/places/search?q=cafe", "/api/sites/abc/import", "/api/sites/abc/refresh"]) {
    const method = path.includes("search") ? "GET" : "POST";
    const response = await handleApi(
      new Request(`https://w.test${path}`, { method, headers: HEADERS }), env, { waitUntil() {} },
    );
    // handleApi returns null for a path it does not own, and index.mjs then
    // falls through to static assets. A removed route answering anything at all
    // would mean the handler is still there.
    assert.equal(response, null, `${path} is no longer a route`);
  }
}

console.log("site creation tests passed");
