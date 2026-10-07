/**
 * The dashboard store-profile editor: read, write, and what must not be lost.
 *
 * The edit form used to populate itself from /api/tag/config - the public tag
 * payload, six keys, no lat/lng/image. Four of its own inputs therefore always
 * rendered blank, and saving the blank form sent lat/lng as an explicit null,
 * deleting the coordinates Google Places had imported.
 *
 * The first section is the one that matters most: it is about not destroying
 * data, and it holds whatever else changes.
 */
import assert from "node:assert/strict";
import { handleApi } from "../worker/api.mjs";
import { mergeProfile } from "../worker/site-profile.mjs";

const SITE_ID = "site1";
const CSRF = "c".repeat(64);
const SESSION = { cookie: `nrv_session=tok; nrv_csrf=${CSRF}` };
const WRITE_HEADERS = { ...SESSION, "content-type": "application/json", "x-csrf-token": CSRF, origin: "https://nurevo.jp" };

/* ------------------------------------------------------------------ *
 * 1. A blank form must not delete anything
 * ------------------------------------------------------------------ */

const STORED = {
  name: "栞珈琲", description: "渋谷の喫茶店", address: "東京都渋谷区1-2-3", phone: "03-1234-5678",
  hours: "9:00-18:00", business_type_schema: "CafeOrCoffeeShop", email: "hello@example.com",
  url: "https://example.com", lat: 35.6586, lng: 139.7454,
  image: "https://example.com/i.jpg", reserve_url: "https://example.com/book",
  business_type_label: "カフェ", price_level: "PRICE_LEVEL_MODERATE", hours_periods: '[{"open":"09:00"}]', price: null,
};
const PLACES_OWNED = {
  lat: { source: "places", updated_at: 1 }, lng: { source: "places", updated_at: 1 },
  business_type_label: { source: "places", updated_at: 1 }, price_level: { source: "places", updated_at: 1 },
};

{
  // Exactly what the form now sends when every box is empty: nothing at all.
  // An absent key is "not supplied"; the merger leaves the field alone.
  const merged = mergeProfile({ current: STORED, sources: PLACES_OWNED, source: "dashboard", now: 2, incoming: {} });
  assert.deepEqual(merged.changed, [], "an empty save changes nothing");
  for (const field of Object.keys(STORED)) {
    assert.equal(merged.values[field], STORED[field], `${field} survives an empty save`);
  }
}

{
  // The old payload, kept as a regression witness. null means delete, and this
  // is the shape that was wiping the coordinates.
  const merged = mergeProfile({
    current: STORED, sources: PLACES_OWNED, source: "dashboard", now: 2,
    incoming: { lat: null, lng: null },
  });
  assert.equal(merged.values.lat, null, "null is still an explicit delete");
  assert.deepEqual(merged.changed, ["lat", "lng"], "which is why the form must never send it");
}

{
  // Editing one field leaves its neighbours untouched.
  const merged = mergeProfile({
    current: STORED, sources: PLACES_OWNED, source: "dashboard", now: 2,
    incoming: { phone: "03-9999-0000" },
  });
  assert.deepEqual(merged.changed, ["phone"]);
  assert.equal(merged.values.lat, 35.6586, "the geo is not collateral damage");
  assert.equal(merged.values.image, STORED.image);
}

/* ------------------------------------------------------------------ *
 * The endpoints
 * ------------------------------------------------------------------ */

function makeEnv({ settings = {}, site = {}, role = "admin", orgId = "org1" } = {}) {
  // One mutable store, so a PUT followed by a GET reads back what was written.
  const state = { settings: { site_id: SITE_ID, serve_schema: 1, allow_crawlers: 1, ...settings }, site: { id: SITE_ID, org_id: "org1", url: "example.com", site_key: "nrv_k", install_type: "tag", delivery_status: "active", ...site } };
  const writes = [];
  const DB = {
    prepare(sql) {
      const first = async (...values) => {
        if (sql.includes("FROM sessions")) {
          return { member_id: "m1", org_id: orgId, email: "o@x.test", role, status: "active", expires_at: Date.now() + 3.6e6 };
        }
        if (sql.includes("FROM sites")) {
          // Ownership: the org on the session must match the org on the site.
          if (values[0] !== SITE_ID) return null;
          if (sql.includes("org_id=?") && values[1] !== state.site.org_id) return null;
          return { ...state.site };
        }
        if (sql.includes("FROM site_settings")) return { ...state.settings };
        return null;
      };
      return {
        bind(...values) {
          return {
            first: () => first(...values),
            async all() { return { results: [] }; },
            async run() {
              writes.push({ sql, values });
              if (sql.includes("INSERT INTO site_settings")) {
                // Mirror the real upsert: column list is built from the merge.
                const columns = (sql.match(/INSERT INTO site_settings \(site_id,([^)]*?),updated_at,field_sources\)/) || [])[1];
                if (columns) {
                  columns.split(",").forEach((column, index) => { state.settings[column] = values[index + 1]; });
                }
              }
              if (sql.startsWith("UPDATE sites SET website_uri=")) state.site.website_uri = values[0];
              return { success: true };
            },
          };
        },
        first,
        async all() { return { results: [] }; },
        async run() { writes.push({ sql, values: [] }); return { success: true }; },
      };
    },
    async batch() { return []; },
  };
  return { DB, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp", state, writes };
}

const readProfile = async (env, id = SITE_ID) => {
  const response = await handleApi(new Request(`https://w.test/api/sites/${id}`, { headers: SESSION }), env, { waitUntil() {} });
  return { status: response.status, body: await response.json() };
};
const writeProfile = async (env, body, id = SITE_ID) => {
  const response = await handleApi(
    new Request(`https://w.test/api/sites/${id}`, { method: "PUT", headers: WRITE_HEADERS, body: JSON.stringify(body) }),
    env, { waitUntil() {} },
  );
  return { status: response.status, body: await response.json() };
};

/* ------------------------------------------------------------------ *
 * 2. The read endpoint
 * ------------------------------------------------------------------ */

{
  const anonymous = await handleApi(new Request(`https://w.test/api/sites/${SITE_ID}`), makeEnv(), { waitUntil() {} });
  assert.equal(anonymous.status, 401, "the profile is not public");
}

{
  // A site belonging to someone else.
  const { status } = await readProfile(makeEnv({ site: { org_id: "other-org" } }));
  assert.equal(status, 403, "a site in another org is forbidden, not readable");
}

{
  const { status, body } = await readProfile(makeEnv(), "nosuchsite");
  assert.equal(status, 404, "an unknown site is not found");
  assert.equal(body.profile, undefined, "and carries no profile");
}

{
  const env = makeEnv({
    settings: {
      name: "栞珈琲", description: "渋谷の喫茶店", address: "東京都渋谷区1-2-3", tel: "03-1234-5678",
      hours: "9:00-18:00", business_type: "カフェ", business_type_schema: "CafeOrCoffeeShop",
      email: "hello@example.com", lat: 35.6586, lng: 139.7454,
      image: "https://example.com/i.jpg", reserve_url: "https://example.com/book",
      price_level: "PRICE_LEVEL_MODERATE",
      field_sources: JSON.stringify({ lat: { source: "places", updated_at: 1 }, name: { source: "wordpress", updated_at: 2 } }),
    },
    site: { website_uri: "https://example.com" },
  });
  const { status, body } = await readProfile(env);
  assert.equal(status, 200);

  // Every field the form offers to edit has to come back, which is the whole
  // reason this endpoint exists.
  for (const field of ["name", "description", "address", "phone", "hours", "business_type_schema", "email", "url", "lat", "lng", "image", "reserve_url"]) {
    assert.ok(body.profile[field] !== undefined, `${field} is present`);
    assert.notEqual(body.profile[field], null, `${field} has the stored value`);
  }
  assert.equal(body.profile.phone, "03-1234-5678", "tel is returned under its canonical name");
  assert.equal(body.profile.url, "https://example.com", "url comes from sites.website_uri");
  assert.equal(body.profile.business_type_schema, "CafeOrCoffeeShop", "the schema type is the editable one");
  assert.equal(body.profile.business_type_label, "カフェ", "the Places label is readable but separate");

  assert.equal(body.field_sources.lat.source, "places", "provenance travels with the values");
  assert.equal(body.field_sources.name.source, "wordpress");
  assert.equal(body.serve_schema, 1);
  assert.equal(body.allow_crawlers, 1);

  // A secret must not ride along on a profile read.
  const serialised = JSON.stringify(body);
  assert.equal(serialised.includes("nrv_k"), false, "the site key is not part of the profile");
  assert.equal(/profile_token|token/i.test(serialised), false, "nor is any token");
}

/* ------------------------------------------------------------------ *
 * 3. Round trip
 * ------------------------------------------------------------------ */

{
  const env = makeEnv({ settings: { lat: 35.6586, lng: 139.7454, image: "https://example.com/i.jpg", reserve_url: "https://example.com/book", field_sources: JSON.stringify(PLACES_OWNED) } });

  const before = await readProfile(env);
  assert.equal(before.body.profile.lat, 35.6586, "the form can see the geo now");

  // Saving with no profile keys at all - the shape an untouched form produces.
  const saved = await writeProfile(env, { serve_schema: true, allow_crawlers: true });
  assert.equal(saved.status, 200);
  assert.deepEqual(saved.body.changed, [], "nothing moved");

  const after = await readProfile(env);
  for (const field of ["lat", "lng", "image", "reserve_url"]) {
    assert.equal(after.body.profile[field], before.body.profile[field], `${field} survived the save`);
  }
}

{
  // Everything the form can edit goes out and comes back.
  const env = makeEnv();
  const payload = {
    name: "栞珈琲", description: "渋谷の喫茶店です", address: "東京都渋谷区1-2-3", phone: "03-1234-5678",
    hours: "9:00-18:00", business_type_schema: "CafeOrCoffeeShop", email: "hello@example.com",
    url: "https://example.com", lat: 35.6586, lng: 139.7454,
    image: "https://example.com/i.jpg", reserve_url: "https://example.com/book",
    serve_schema: true, allow_crawlers: true,
  };
  const saved = await writeProfile(env, payload);
  assert.equal(saved.status, 200);

  const { body } = await readProfile(env);
  for (const [field, value] of Object.entries(payload)) {
    if (field === "serve_schema" || field === "allow_crawlers") continue;
    assert.equal(String(body.profile[field]), String(value), `${field} round-trips`);
  }
  assert.equal(body.completeness.pct, 100, "a fully filled profile reads as complete");
  assert.deepEqual(body.completeness.missing, []);
}

{
  // `tel` stays accepted, because that is what the form field was called.
  const env = makeEnv();
  await writeProfile(env, { tel: "03-5555-0000", serve_schema: true });
  const { body } = await readProfile(env);
  assert.equal(body.profile.phone, "03-5555-0000", "the legacy tel key still writes phone");
}

{
  // The dashboard must not claim the Places-owned display label or the
  // machine-owned hours, even if a client asks it to.
  const env = makeEnv({ settings: { business_type: "カフェ", hours_periods: '[{"open":"09:00"}]', price_level: "PRICE_LEVEL_MODERATE", field_sources: JSON.stringify(PLACES_OWNED) } });
  await writeProfile(env, { business_type_label: "ラーメン屋", hours_periods: "[]", price_level: "PRICE_LEVEL_FREE", serve_schema: true });
  const { body } = await readProfile(env);
  assert.equal(body.profile.business_type_label, "カフェ", "the Places label is not writable from here");
  assert.equal(body.profile.hours_periods, '[{"open":"09:00"}]', "nor are the machine-readable hours");
  assert.equal(body.profile.price_level, "PRICE_LEVEL_MODERATE", "nor price_level");
}

/* ------------------------------------------------------------------ *
 * 4. Completeness
 * ------------------------------------------------------------------ */

{
  // price_level is Places-only, so it must not hold a profile at 83%. The old
  // list required it and the listing query did not even select it, so no site
  // could ever reach 100%.
  const env = makeEnv({
    settings: {
      name: "栞珈琲", address: "東京都渋谷区1-2-3", tel: "03-1234-5678", hours: "9:00-18:00",
      business_type_schema: "CafeOrCoffeeShop", lat: 35.6586, lng: 139.7454, price_level: null,
    },
  });
  const { body } = await readProfile(env);
  assert.equal(body.completeness.pct, 100, "a profile the owner can fill reaches 100%");
  assert.equal(body.completeness.has.price_level, false, "price_level is reported");
  assert.equal(body.completeness.required.includes("price_level"), false, "but never required");
  assert.ok(body.completeness.optional.includes("price_level"), "it is optional");
}

{
  const env = makeEnv({ settings: { name: "栞珈琲", business_type: "カフェ" } });
  const { body } = await readProfile(env);
  assert.equal(body.completeness.has.business_type_schema, false,
    "the Places display label does not satisfy the business type");
  assert.ok(body.completeness.missing.includes("business_type_schema"), "which is reported as missing");
  assert.ok(body.completeness.missing.includes("geo"));
  assert.equal(body.completeness.has.name, true);
}

{
  // Every required field is one the dashboard form can edit - the point of the
  // change. Nothing may be required that the owner has no way to supply.
  const EDITABLE = ["name", "description", "address", "phone", "hours", "business_type_schema", "email", "url", "lat", "lng", "image", "reserve_url"];
  const { body } = await readProfile(makeEnv());
  for (const field of body.completeness.required) {
    const fillable = field === "geo" ? true : EDITABLE.includes(field);
    assert.ok(fillable, `${field} is required and must be fillable in the dashboard`);
  }
}

{
  // Whitespace is not a value.
  const env = makeEnv({ settings: { name: "   ", address: "\t" } });
  const { body } = await readProfile(env);
  assert.equal(body.completeness.has.name, false, "a blank-looking name is not filled in");
  assert.equal(body.completeness.has.address, false);
}

/* ------------------------------------------------------------------ *
 * 5. The name must not become the URL
 * ------------------------------------------------------------------ */

{
  // /api/tag/config answered `name: settings.name || site.url`, so the form
  // prefilled the URL and an untouched save committed it as the store name.
  const env = makeEnv({ settings: { name: null }, site: { url: "example.com" } });
  const { body } = await readProfile(env);
  assert.equal(body.profile.name, null, "an unset name reads as unset, not as the URL");

  // And a save that omits name leaves it unset rather than adopting the URL.
  await writeProfile(env, { address: "東京都渋谷区1-2-3", serve_schema: true });
  const after = await readProfile(env);
  assert.equal(after.body.profile.name, null, "the URL never becomes the name");
}

/* ------------------------------------------------------------------ *
 * Damaged and hostile input
 * ------------------------------------------------------------------ */

{
  const env = makeEnv({ settings: { field_sources: "{not json" } });
  const { status, body } = await readProfile(env);
  assert.equal(status, 200, "an unreadable provenance map does not break the read");
  assert.deepEqual(body.field_sources, {});
}

{
  const env = makeEnv();
  const saved = await writeProfile(env, { lat: "not a number", lng: 139.7454, serve_schema: true });
  assert.equal(saved.status, 200, "a malformed coordinate is ignored, not fatal");
  const { body } = await readProfile(env);
  assert.equal(body.profile.lat, null, "the bad value was not stored");
  assert.equal(body.profile.lng, 139.7454, "the good one was");
}

{
  // Unknown keys are not a way in.
  const env = makeEnv();
  const saved = await writeProfile(env, { nonsense: "x", __proto__: { polluted: true }, serve_schema: true });
  assert.equal(saved.status, 200);
  const { body } = await readProfile(env);
  assert.equal(body.profile.nonsense, undefined, "an unknown field is not stored");
}

console.log("profile edit tests passed");
