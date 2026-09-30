import assert from "node:assert/strict";
import { INITIAL_AEO_RULESET, LIVE_AEO_CACHE_CONTROL, hostedSchema, renderHostedStore } from "../worker/api.mjs";

const store = {
  name: "Nurevo Cafe",
  business_type: "CafeOrCoffeeShop",
  address: "東京都千代田区1-1",
  hours: "月曜日: 09:00–18:00",
  hours_periods: JSON.stringify([{ open: { day: 1, hour: 9, minute: 0 }, close: { day: 1, hour: 18, minute: 0 } }]),
  lat: 35.681236,
  lng: 139.767125,
  tel: "03-1234-5678",
  price_level: "PRICE_LEVEL_MODERATE",
};

const legacy = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Nurevo Cafe",
  address: { "@type": "PostalAddress", streetAddress: "東京都千代田区1-1" },
  openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: "https://schema.org/Monday", opens: "09:00", closes: "18:00" }],
  geo: { "@type": "GeoCoordinates", latitude: 35.681236, longitude: 139.767125 },
  telephone: "03-1234-5678",
  priceRange: "¥¥",
};

const version1Html = renderHostedStore(store, "ja", INITIAL_AEO_RULESET);
const version1Match = version1Html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
assert.ok(version1Match, "hosted page must contain server-rendered JSON-LD");
assert.equal(version1Match[1], JSON.stringify(legacy), "version 1 hosted JSON-LD changed");

const version2 = {
  version: 2,
  definition: {
    ...INITIAL_AEO_RULESET.definition,
    schema: { ...INITIAL_AEO_RULESET.definition.schema, context: "https://example.test/aeo-v2" },
  },
};
const version2Html = renderHostedStore(store, "ja", version2);
assert.match(version2Html, /"@context":"https:\/\/example\.test\/aeo-v2"/, "hosted page did not apply the supplied active ruleset");
assert.equal(LIVE_AEO_CACHE_CONTROL, "public, max-age=60, s-maxage=60, stale-while-revalidate=240");

assert.deepEqual(hostedSchema(store, "¥¥", INITIAL_AEO_RULESET), legacy);
console.log("hosted version 1 output: identical");
console.log("hosted active ruleset propagation: PASS");
console.log(`cache-control: ${LIVE_AEO_CACHE_CONTROL}`);
