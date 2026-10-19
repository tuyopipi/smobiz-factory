/**
 * Address -> geo, against a real SQLite with the real schema and migrations.
 *
 * The property that matters most is the one a careless implementation gets
 * wrong: a city-level address ("石川県金沢市") must not become a shop's
 * coordinates. After that: one provider call per address, nothing called
 * without a key, human or published coordinates never replaced, a changed
 * address re-derived, and the owner told whenever geo could not be filled.
 */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import {
  GEOCODER_PROVIDERS, addressKey, geocodeAddress, geocodeSiteProfile, geocoderConfig, normalizeAddress,
} from "../worker/geocoder.mjs";
import { writeSiteProfile, loadSiteProfile, buildJsonLd } from "../worker/api.mjs";

const sql = (file) => readFileSync(new URL(`../nurevo-impl/db/${file}`, import.meta.url), "utf8");

function makeEnv(extra = {}) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(sql("schema.sql"));
  for (const file of ["0013_aeo_rulesets.sql", "0016_aeo_learning.sql"]) sqlite.exec(sql(file));
  sqlite.exec(`INSERT INTO orgs(id) VALUES('o1');
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,created_at) VALUES('s1','o1','shop.test','https://shop.test/','k1','wp','free',1);
    INSERT INTO site_settings(site_id,name,address,serve_schema) VALUES('s1','Shop','石川県金沢市',1);`);
  const DB = {
    prepare(text) {
      const wrap = (args) => ({
        async first() { return sqlite.prepare(text).get(...args) || null; },
        async all() { return { results: sqlite.prepare(text).all(...args) }; },
        async run() { return { meta: sqlite.prepare(text).run(...args) }; },
      });
      return { ...wrap([]), bind: (...args) => wrap(args) };
    },
    async batch(statements) { const out = []; for (const s of statements) out.push(await s.run()); return out; },
  };
  const kv = new Map();
  const WEBMCP_KV = { async get(k) { return kv.has(k) ? kv.get(k) : null; }, async put(k, v) { kv.set(k, v); } };
  return { sqlite, env: { DB, WEBMCP_KV, GEOCODER_API_KEY: "test-key", GEOCODER_PROVIDER: "opencage", ...extra } };
}

/** An OpenCage-shaped answer; `type` is what the match resolved to. */
const opencage = (lat, lng, type, extra = {}) => ({ results: [{ geometry: { lat, lng }, components: { _type: type, ...extra }, formatted: "fixture" }] });

function fetchStub(responses) {
  const calls = [];
  const impl = async (url) => {
    calls.push(String(url));
    const next = responses.shift();
    if (next instanceof Error) throw next;
    const { status = 200, body } = next;
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
  return { impl, calls };
}
const noSleep = async () => {};
const recommendation = (sqlite) => sqlite.prepare("SELECT status,detail_json FROM aeo_site_recommendations WHERE site_id='s1' AND kind='geo_unresolved'").get();
const geo = (sqlite) => sqlite.prepare("SELECT lat,lng,field_sources FROM site_settings WHERE site_id='s1'").get();

/* ---------------- normalisation ---------------- */

assert.equal(normalizeAddress("〒920-0000　石川県金沢市１－２－３"), normalizeAddress("〒920‐0000 石川県金沢市1-2-3"), "full-width and dash variants share a key");
assert.equal(await addressKey("石川県金沢市１－２"), await addressKey("石川県金沢市1-2"));
assert.notEqual(await addressKey("石川県金沢市1-2"), await addressKey("石川県金沢市1-3"));

/* ---------------- no key: the feature is off ---------------- */

{
  const { env, sqlite } = makeEnv({ GEOCODER_API_KEY: "" });
  assert.equal(geocoderConfig(env), null);
  const stub = fetchStub([]);
  const result = await geocodeSiteProfile(env, "s1", { fetchImpl: stub.impl, sleep: noSleep });
  assert.equal(result.status, "disabled");
  assert.equal(stub.calls.length, 0, "no provider call without a key");
  assert.equal(geo(sqlite).lat, null, "geo stays empty");
  assert.equal(recommendation(sqlite), undefined, "no owner notice for a feature that is not switched on");
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM geocode_cache").get().n, 0, "nothing is cached");
  // geocodeAddress itself still reports why when called directly.
  assert.equal((await geocodeAddress(env, "石川県金沢市", { fetchImpl: stub.impl, sleep: noSleep })).status, "unconfigured");
}

/* ---------------- a city-level address is never a shop's location ---------------- */

{
  const { env, sqlite } = makeEnv();
  const stub = fetchStub([{ body: opencage(36.5613, 136.6562, "city") }]);
  const result = await geocodeSiteProfile(env, "s1", { fetchImpl: stub.impl, sleep: noSleep });
  assert.equal(result.status, "imprecise");
  assert.equal(result.applied, false);
  assert.equal(geo(sqlite).lat, null, "the middle of Kanazawa is not published as the shop's geo");
  const note = recommendation(sqlite);
  assert.equal(note.status, "open");
  assert.match(JSON.parse(note.detail_json).reason, /番地/, "the owner is asked for the full address");
  assert.match(stub.calls[0], /^https:\/\/api\.opencagedata\.com\//);

  // The answer is remembered: the same address is not paid for again.
  const again = await geocodeSiteProfile(env, "s1", { fetchImpl: stub.impl, sleep: noSleep });
  assert.equal(again.status, "imprecise");
  assert.equal(again.cached, true);
  assert.equal(stub.calls.length, 1, "one provider call per address, ever");
}

/* ---------------- a building-level match is applied, with provenance ---------------- */

{
  const { env, sqlite } = makeEnv();
  sqlite.prepare("UPDATE site_settings SET address='石川県金沢市広坂1-1-1' WHERE site_id='s1'").run();
  const stub = fetchStub([{ body: opencage(36.5613451234, 136.6562789, "building", { house_number: "1" }) }]);
  const result = await geocodeSiteProfile(env, "s1", { fetchImpl: stub.impl, sleep: noSleep });
  assert.equal(result.status, "ok");
  assert.equal(result.applied, true);
  const row = geo(sqlite);
  assert.equal(row.lat, 36.561345, "rounded to six places");
  assert.equal(row.lng, 136.656279);
  const sources = JSON.parse(row.field_sources);
  assert.equal(sources.lat.source, "geocoder");
  assert.equal(sources.lat.address_key, await addressKey("石川県金沢市広坂1-1-1"), "records which address it came from");
  const cache = sqlite.prepare("SELECT * FROM geocode_cache").get();
  assert.equal(cache.status, "ok");
  assert.match(cache.attribution, /OpenStreetMap/, "the data licence attribution is kept");

  // Already done for this address: no call, no change.
  const again = await geocodeSiteProfile(env, "s1", { fetchImpl: stub.impl, sleep: noSleep });
  assert.equal(again.reason, "already_geocoded");
  assert.equal(stub.calls.length, 1);

  // The schema the site publishes now carries it.
  // The rulesets as production has them: v3, then 0032's centralised copy.
  for (const file of ["0014_aeo_scores.sql", "0015_aeo_ruleset_activations.sql", "0026_ruleset_v3_schema_advance.sql", "0032_continuous_optimization.sql"]) sqlite.exec(sql(file));
  const ruleset = sqlite.prepare("SELECT * FROM aeo_rulesets WHERE active=1").get();
  const site = sqlite.prepare("SELECT * FROM sites WHERE id='s1'").get();
  const profile = sqlite.prepare("SELECT * FROM site_settings WHERE site_id='s1'").get();
  const jsonld = buildJsonLd(site, profile, ruleset);
  const node = [jsonld].flat().find((n) => n.geo) || jsonld;
  assert.deepEqual({ lat: node.geo?.latitude, lng: node.geo?.longitude }, { lat: 36.561345, lng: 136.656279 }, "geo reaches the generated schema");

  // The address changes to one that resolves only to a town: the old
  // coordinates no longer describe it and are removed, not kept.
  const vague = fetchStub([{ body: opencage(36.5, 136.6, "city") }]);
  sqlite.prepare("UPDATE site_settings SET address='石川県金沢市' WHERE site_id='s1'").run();
  const moved = await geocodeSiteProfile(env, "s1", { fetchImpl: vague.impl, sleep: noSleep });
  assert.equal(moved.status, "imprecise");
  assert.equal(geo(sqlite).lat, null, "coordinates for the old address are withdrawn");
}

/* ---------------- coordinates someone else set are never replaced ---------------- */

{
  const { env, sqlite } = makeEnv();
  await writeSiteProfile(env, "s1", { lat: 35.1, lng: 139.1 }, "dashboard");
  const stub = fetchStub([{ body: opencage(36.5, 136.6, "building", { house_number: "9" }) }]);
  const result = await geocodeSiteProfile(env, "s1", { fetchImpl: stub.impl, sleep: noSleep });
  assert.equal(result.reason, "geo_set_by_other_source");
  assert.equal(stub.calls.length, 0, "not even looked up");
  assert.equal(geo(sqlite).lat, 35.1);
}

/* ---------------- a profile save that changes the address triggers the lookup ---------------- */

{
  const { env, sqlite } = makeEnv();
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => opencage(36.56, 136.65, "road") });
  await writeSiteProfile(env, "s1", { address: "石川県金沢市広坂2-2-2" }, "dashboard");
  globalThis.fetch = realFetch;
  assert.equal(JSON.parse(recommendation(sqlite).detail_json).status, "imprecise", "the write ran the geocode step");
  const profile = await loadSiteProfile(env, "s1");
  assert.equal(profile.values.address, "石川県金沢市広坂2-2-2", "the profile write itself is unaffected");
}

/* ---------------- failures are retried, but not immediately ---------------- */

{
  const { env } = makeEnv();
  const now = Date.parse("2026-10-20T00:00:00Z");
  const stub = fetchStub([{ status: 503, body: {} }, { body: opencage(36.56, 136.65, "building", { house_number: "1" }) }]);
  assert.equal((await geocodeAddress(env, "石川県金沢市広坂3-3", { fetchImpl: stub.impl, now, sleep: noSleep })).status, "error");
  assert.equal((await geocodeAddress(env, "石川県金沢市広坂3-3", { fetchImpl: stub.impl, now: now + 60_000, sleep: noSleep })).status, "error");
  assert.equal(stub.calls.length, 1, "no retry within the hour");
  assert.equal((await geocodeAddress(env, "石川県金沢市広坂3-3", { fetchImpl: stub.impl, now: now + 3_700_000, sleep: noSleep })).status, "ok");
  assert.equal(stub.calls.length, 2, "retried after it");
  const network = fetchStub([new TypeError("fetch failed")]);
  assert.equal((await geocodeAddress(env, "石川県金沢市広坂4-4", { fetchImpl: network.impl, now, sleep: noSleep })).status, "error");
}

/* ---------------- a daily ceiling across all sites ---------------- */

{
  const { env } = makeEnv({ GEOCODER_DAILY_LIMIT: "2" });
  const stub = fetchStub([{ body: opencage(1, 1, "city") }, { body: opencage(2, 2, "city") }, { body: opencage(3, 3, "city") }]);
  for (const n of [1, 2]) assert.equal((await geocodeAddress(env, `住所${n}`, { fetchImpl: stub.impl, sleep: noSleep })).status, "imprecise");
  assert.equal((await geocodeAddress(env, "住所3", { fetchImpl: stub.impl, sleep: noSleep })).status, "rate_limited");
  assert.equal(stub.calls.length, 2);
}

/* ---------------- provider parsing ---------------- */

{
  const p = GEOCODER_PROVIDERS;
  assert.equal(p.opencage.parse(opencage(1, 2, "road")).precision, "street");
  assert.equal(p.opencage.parse({ results: [] }), null);
  assert.equal(p.geoapify.parse({ results: [{ lat: 36.5, lon: 136.6, result_type: "building" }] }).precision, "address");
  assert.equal(p.geoapify.parse({ results: [{ lat: 36.5, lon: 136.6, result_type: "city" }] }).precision, "area");
  assert.equal(p.locationiq.parse([{ lat: "36.5", lon: "136.6", type: "house", address: { house_number: "1" } }]).precision, "address");
  assert.equal(p.locationiq.parse([{ lat: "36.5", lon: "136.6", type: "administrative", addresstype: "city" }]).precision, "area");
  for (const [id, provider] of Object.entries(p)) {
    assert.match(provider.attribution, /OpenStreetMap/, `${id} carries the ODbL attribution`);
    assert.equal(provider.url("住所", "k").includes("google"), false);
  }
  assert.equal(geocoderConfig({ GEOCODER_API_KEY: "k", GEOCODER_PROVIDER: "google" }), null, "an unknown provider is not used");

  // Null Island and out-of-range answers are not coordinates.
  const { env } = makeEnv();
  const stub = fetchStub([{ body: opencage(0, 0, "building", { house_number: "1" }) }]);
  assert.equal((await geocodeAddress(env, "どこか1-1", { fetchImpl: stub.impl, sleep: noSleep })).status, "not_found");
}

console.log("geocoder tests passed");
