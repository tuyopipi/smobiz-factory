import assert from "node:assert/strict";
import { INITIAL_AEO_RULESET, buildJsonLd } from "../worker/api.mjs";

function legacyBuildJsonLd(site, settings) {
  const ld = { "@context": "https://schema.org", "@type": "LocalBusiness", name: settings.name || site.url };
  const canonicalUrl = site?.website_uri || (site?.url ? (/^https?:\/\//i.test(site.url) ? site.url : `https://${site.url}`) : null) || (site?.slug ? `https://nurevo.jp/s/${encodeURIComponent(site.slug)}` : null);
  if (canonicalUrl) ld.url = canonicalUrl;
  if (settings.business_type) ld.additionalType = settings.business_type;
  if (settings.address) ld.address = { "@type": "PostalAddress", streetAddress: settings.address };
  if (settings.tel) ld.telephone = settings.tel;
  if (settings.hours) ld.openingHours = settings.hours;
  const hours = legacyOpeningHoursSpecification(settings.hours_periods, settings.hours);
  if (hours.length) ld.openingHoursSpecification = hours;
  if (settings.lat != null && settings.lng != null) ld.geo = { "@type": "GeoCoordinates", latitude: settings.lat, longitude: settings.lng };
  const priceRange = { PRICE_LEVEL_FREE: "Free", PRICE_LEVEL_INEXPENSIVE: "¥", PRICE_LEVEL_MODERATE: "¥¥", PRICE_LEVEL_EXPENSIVE: "¥¥¥", PRICE_LEVEL_VERY_EXPENSIVE: "¥¥¥¥" }[settings.price_level] || settings.price;
  if (priceRange) ld.priceRange = priceRange;
  if (settings.image) ld.image = settings.image;
  if (settings.reserve_url) ld.potentialAction = { "@type": "ReserveAction", target: settings.reserve_url };
  return ld;
}

function legacyOpeningHoursSpecification(periods, hoursText) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let parsed = periods;
  if (typeof parsed === "string") {
    try { parsed = JSON.parse(parsed); } catch { parsed = null; }
  }
  const specs = [];
  for (const period of Array.isArray(parsed) ? parsed : []) {
    const open = period?.open;
    const close = period?.close;
    if (!open || !close || days[open.day] == null || days[close.day] == null) continue;
    const clock = (value) => `${String(value.hour ?? 0).padStart(2, "0")}:${String(value.minute ?? 0).padStart(2, "0")}`;
    specs.push({ "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${days[open.day]}`, opens: clock(open), closes: clock(close) });
  }
  if (specs.length) return specs;
  const japaneseDays = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
  for (const line of String(hoursText || "").split(/;\s*/)) {
    const match = line.match(/^(.+?):\s*(\d{1,2}):(\d{2})\s*[–—〜-]\s*(\d{1,2}):(\d{2})/);
    if (!match) continue;
    const day = japaneseDays.indexOf(match[1]);
    if (day < 0) continue;
    specs.push({ "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${days[day]}`, opens: `${String(match[2]).padStart(2, "0")}:${match[3]}`, closes: `${String(match[4]).padStart(2, "0")}:${match[5]}` });
  }
  return specs;
}

const fixtures = [
  {
    name: "all fields with period JSON",
    site: { url: "example.jp", website_uri: "https://www.example.jp/shop", slug: "example-shop" },
    settings: {
      name: "Nurevo Cafe", business_type: "CafeOrCoffeeShop", address: "東京都千代田区1-1",
      tel: "03-1234-5678", hours: "月曜日: 09:00–18:00", hours_periods: JSON.stringify([{ open: { day: 1, hour: 9, minute: 0 }, close: { day: 1, hour: 18, minute: 0 } }]),
      lat: 35.681236, lng: 139.767125, price_level: "PRICE_LEVEL_MODERATE", price: "ignored",
      image: "https://cdn.example.jp/store.jpg", reserve_url: "https://example.jp/reserve",
    },
  },
  {
    name: "fallbacks with Japanese hours and explicit price",
    site: { url: "example.com", website_uri: null, slug: "unused" },
    settings: { name: "", hours: "火曜日: 8:05-17:30", hours_periods: "invalid", lat: null, lng: null, price: "$10–20" },
  },
  {
    name: "hosted slug fallback",
    site: { url: "", website_uri: null, slug: "東京 店" },
    settings: { name: "東京店" },
  },
];

for (const fixture of fixtures) {
  const before = JSON.stringify(legacyBuildJsonLd(fixture.site, fixture.settings));
  const after = JSON.stringify(buildJsonLd(fixture.site, fixture.settings, INITIAL_AEO_RULESET));
  assert.equal(after, before, `${fixture.name}: serialized JSON-LD changed`);
  console.log(`${fixture.name}: identical`);
  console.log(`before ${before}`);
  console.log(`after  ${after}`);
}

console.log("AEO ruleset phase 1 JSON-LD regression: PASS");
