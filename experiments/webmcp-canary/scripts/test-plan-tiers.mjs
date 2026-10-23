/**
 * What makes Free, Standard and Pro different - and what must not.
 *
 * Owner decision (2026-10): Free gets no artificial penalty. Every plan is
 * scored with the same yardstick, and data the owner has entered is never
 * withheld from the output because of the plan.
 *
 *   1. Owner-entered data (description, email, links) is published on every
 *      plan. What a plan's ruleset version decides is which properties exist:
 *      a property a newer generation introduces is absent from an older one.
 *   2. One measuring stick, the current criteria, for everyone. The same data
 *      scores the same on Free and Standard; Free falls behind only by what a
 *      newer generation genuinely adds - a real gap, not a penalty.
 *   3. A ruleset can still retire a property (fields[k] === false), and an
 *      empty value is never published.
 */
import assert from "node:assert/strict";
import { INITIAL_AEO_RULESET, buildJsonLd, hostedSchema } from "../worker/api.mjs";
import { BASELINE_SCORED_PROPS, diagnoseSchemaFields, extractAeoSignals, publishedSchemaProps, schemaFieldPresent, scoreAeo } from "../worker/aeo-score.mjs";

/* The advance shipped as ruleset v3. Mirrored here so a change to the
   migration that alters the plan model has to change this file too. */
const ADVANCED_FIELDS = { ...INITIAL_AEO_RULESET.definition.schema.fields, description: true, email: true, postalAddress: true };
const ADVANCED_SCORED = ["name", "url", "address", "streetAddress", "telephone", "openingHours", "geo", "description", "email"];

const baseline = INITIAL_AEO_RULESET;
const advanced = {
  version: 3,
  definition: { ...INITIAL_AEO_RULESET.definition, schema: { ...INITIAL_AEO_RULESET.definition.schema, fields: ADVANCED_FIELDS, scoredProps: ADVANCED_SCORED } },
};

const SITE = { url: "example.com", website_uri: "https://example.com/", slug: "example" };
const SETTINGS = {
  name: "栞珈琲", address: "3-2-6 Kanda-Misakicho, Chiyoda-ku, Tokyo", tel: "03-1234-5678",
  hours: "Tue-Sun 11:00-20:00", lat: 35.6, lng: 139.7, image: "https://example.com/i.png",
  reserve_url: "https://example.com/book", price_level: "PRICE_LEVEL_MODERATE",
  business_type_schema: "CafeOrCoffeeShop", description: "神田の自家焙煎コーヒー店", email: "hello@example.com",
};

/* ---------------- 1. owner-entered data is published on every plan ---------------- */

{
  const free = buildJsonLd(SITE, SETTINGS, baseline);
  const standard = buildJsonLd(SITE, SETTINGS, advanced);

  // Free used to withhold description and email the owner had entered, then
  // score the site down for not publishing them.
  assert.equal(free.description, "神田の自家焙煎コーヒー店", "Free publishes the description the owner entered");
  assert.equal(free.email, "hello@example.com", "and the email");
  assert.deepEqual(free, standard, "the same store data produces the same schema on both tiers for properties both generations define");
}

{
  // A property only a newer generation defines is the real difference: it
  // appears where the site follows the newer criteria, and not on Free.
  const newer = structuredClone(advanced);
  newer.definition.generation = structuredClone(INITIAL_AEO_RULESET.definition.generation);
  newer.definition.generation.properties.contactPoint = { object: { "@type": { literal: "ContactPoint" }, email: { source: "email" } }, requires: ["email"], optIn: true };
  assert.equal(buildJsonLd(SITE, SETTINGS, newer).contactPoint.email, "hello@example.com", "the newer generation emits its new property");
  assert.equal(buildJsonLd(SITE, SETTINGS, baseline).contactPoint, undefined, "Free, on the generation it has, does not");
}

{
  // A field with no value behind it publishes nothing, on either tier. An empty
  // property would earn a site a criterion it has not actually met.
  const bare = { name: "栞珈琲", address: "", description: "", email: "" };
  for (const ruleset of [baseline, advanced]) {
    const out = buildJsonLd(SITE, bare, ruleset);
    assert.equal(out.description, undefined, "an empty description is not published");
    assert.equal(out.email, undefined, "nor an empty email");
  }
}

{
  // Hosted pages follow the same rule: entered data is not withheld on Free.
  const hosted = hostedSchema({ ...SITE, ...SETTINGS }, "¥¥", baseline);
  assert.equal(hosted.description, "神田の自家焙煎コーヒー店");
  assert.equal(hosted.email, "hello@example.com");
}

/* ---------------- 2. one measuring stick, the current one ---------------- */

const pageWith = (ld) => `<html><body><h1>栞珈琲</h1><h2>営業時間</h2><p>東京都千代田区神田三崎町3-2-6 電話 03-1234-5678 営業時間 11:00-20:00 緯度 経度 https://example.com</p><script type="application/ld+json">${JSON.stringify([ld, {"@type":"WebSite",name:"栞珈琲",url:"https://example.com"},{"@type":"Organization",sameAs:["https://example.com"]},{"@type":"FAQPage",mainEntity:[{name:"Hours?",acceptedAnswer:{text:"11:00-20:00"}}]}])}</script></body></html>`;
const ROBOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "PerplexityBot", "Google-Extended", "Applebot-Extended"]
  .map((bot) => `User-agent: ${bot}\nAllow: /`).join("\n\n");
const LLMS = "# 栞珈琲\n\n> 神田の自家焙煎コーヒー店\n\n## Key facts\n- URL: https://example.com/\n- Address: 東京都千代田区神田三崎町3-2-6\n- Phone: 03-1234-5678\n- Hours: 11:00-20:00\n";

const scoreOf = (ld, scoredProps) => {
  const signals = extractAeoSignals(pageWith(ld), ROBOTS, LLMS, { llmsPresent: true, edgeBlocked: false, scoredProps });
  const result = scoreAeo(signals);
  return { ...result, published: signals.publishedProps, coreProps: signals.schemaCoreProps };
};

{
  // Measured against the criteria in force, the same data scores the same on
  // both tiers. Free carries no penalty for being Free.
  const free = scoreOf(buildJsonLd(SITE, SETTINGS, baseline), ADVANCED_SCORED);
  const standard = scoreOf(buildJsonLd(SITE, SETTINGS, advanced), ADVANCED_SCORED);
  assert.equal(free.score, standard.score, `same data, same score: ${free.score} = ${standard.score}`);
  assert.equal(free.statuses.schema, "OK");
  assert.ok(free.published.includes("description") && free.published.includes("email"), "the entered properties are really on the page");
}

{
  // A Free owner who has not entered the data a criterion needs has a real,
  // proportional gap - the same gap a Standard site with the same data has.
  const sparse = { ...SETTINGS, description: "", email: "" };
  const free = scoreOf(buildJsonLd(SITE, sparse, baseline), ADVANCED_SCORED);
  const standard = scoreOf(buildJsonLd(SITE, sparse, advanced), ADVANCED_SCORED);
  assert.equal(free.score, standard.score, "missing data costs both tiers the same");
  const full = scoreOf(buildJsonLd(SITE, SETTINGS, baseline), ADVANCED_SCORED);
  assert.ok(Math.abs((full.metrics.schema - free.metrics.schema) - 2 / 13) < 0.01, "the gap is exactly the share of criteria unmet, not a band");
  assert.ok(free.score >= 50 && free.band !== "red", `and survivable: ${free.score}`);
}

{
  // A property only a newer generation can emit is the one place Free falls
  // behind - by its proportional share, and only once the criteria score it.
  const newer = structuredClone(advanced);
  newer.definition.generation = structuredClone(INITIAL_AEO_RULESET.definition.generation);
  newer.definition.generation.properties.contactPoint = { object: { "@type": { literal: "ContactPoint" }, email: { source: "email" } }, requires: ["email"], optIn: true };
  const criteria = [...ADVANCED_SCORED, "contactPoint"];
  const free = scoreOf(buildJsonLd(SITE, SETTINGS, baseline), criteria);
  const following = scoreOf(buildJsonLd(SITE, SETTINGS, newer), criteria);
  assert.ok(following.metrics.schema > free.metrics.schema, "a site on the newer generation meets the new criterion");
  assert.ok(Math.abs((following.metrics.schema - free.metrics.schema) - 1 / 14) < 0.01, "Free is behind by exactly that one criterion");
}

{
  // The gradual decline when criteria widen still holds for data a site lacks.
  const ld = buildJsonLd(SITE, { ...SETTINGS, description: "", email: "" }, baseline);
  const six = scoreOf(ld, BASELINE_SCORED_PROPS).coreProps;
  const nine = scoreOf(ld, ADVANCED_SCORED).coreProps;
  assert.ok(nine < six, `the same page meets a smaller share of a wider standard: ${nine.toFixed(3)} < ${six.toFixed(3)}`);
  assert.ok(nine > 0.5, "but still meets most of it");
}

/* ---------------- 3. retiring a property, and empty values ---------------- */

{
  // A ruleset that never names description still publishes what the owner entered.
  const silent = { version: 9, definition: { ...INITIAL_AEO_RULESET.definition, schema: { ...INITIAL_AEO_RULESET.definition.schema, fields: { url: true } } } };
  const out = buildJsonLd(SITE, SETTINGS, silent);
  assert.equal(out.description, "神田の自家焙煎コーヒー店");
  assert.equal(out.email, "hello@example.com");
}

{
  // Switching one off still works - that is how a criterion is retired.
  const withoutEmail = { version: 9, definition: { ...INITIAL_AEO_RULESET.definition, schema: { ...INITIAL_AEO_RULESET.definition.schema, fields: { ...ADVANCED_FIELDS, email: false } } } };
  const out = buildJsonLd(SITE, SETTINGS, withoutEmail);
  assert.equal(out.description, "神田の自家焙煎コーヒー店");
  assert.equal(out.email, undefined, "an explicitly disabled property is not published");
}

/* ---------------- the scorer falls back safely ---------------- */

{
  // The public URL diagnosis has no site and therefore no ruleset. It must go
  // on scoring exactly as it did, or every anonymous check changes meaning.
  const signals = extractAeoSignals(pageWith(buildJsonLd(SITE, SETTINGS, baseline)), ROBOTS, LLMS, { llmsPresent: true });
  assert.deepEqual(signals.scoredProps, BASELINE_SCORED_PROPS, "no criteria supplied means the baseline list");
  for (const bad of [[], null, "name,url", 7]) {
    const fallback = extractAeoSignals("<html></html>", "", "", { scoredProps: bad });
    assert.deepEqual(fallback.scoredProps, BASELINE_SCORED_PROPS, `a malformed criteria list falls back: ${JSON.stringify(bad)}`);
  }
}

{
  const nodes = [{ "@type": "LocalBusiness", name: "X", address: { "@type": "PostalAddress", streetAddress: "1-1" } }];
  assert.deepEqual(
    publishedSchemaProps(nodes, ["name", "streetAddress", "email"]),
    ["name", "streetaddress"],
    "a structured address publishes streetAddress; a missing property is not claimed",
  );
  assert.deepEqual(publishedSchemaProps([], ["name"]), [], "no schema publishes nothing");
}

/* ---------------- nested PostalAddress fields (v3 streetAddress) ---------------- */

{
  // The v3 ruleset scores streetAddress. Real markup nests it under address,
  // as an object or an array; the scorer and the fix list must both read it
  // there, and must agree with each other.
  const v3 = { entityFields: { LocalBusiness: { name: true, address: true, streetAddress: true, addressLocality: true, postalCode: true } } };
  const cases = [
    ["object", { address: { "@type": "PostalAddress", streetAddress: "1-1", addressLocality: "Shibuya", postalCode: "150-0001" } }, true],
    ["array", { address: [{ "@type": "PostalAddress", streetAddress: "1-1", addressLocality: "Shibuya", postalCode: "150-0001" }] }, true],
    ["@id reference", { address: { "@id": "#addr" } }, true],
    ["plain text address", { address: "1-1 Shibuya" }, false],
    ["no address", {}, false],
  ];
  const addrNode = { "@id": "#addr", "@type": "PostalAddress", streetAddress: "1-1", addressLocality: "Shibuya", postalCode: "150-0001" };
  for (const [label, extra, expected] of cases) {
    const nodes = [{ "@type": "Restaurant", name: "X", ...extra }, addrNode];
    const fields = diagnoseSchemaFields(nodes, { schemaRules: v3 });
    for (const prop of ["streetAddress", "addressLocality", "postalCode"]) {
      assert.equal(fields.find((f) => f.field === prop).present, expected, `${label}: scorer reads ${prop}`);
    }
    assert.equal(publishedSchemaProps(nodes, ["streetAddress", "addressLocality", "postalCode"]).length === 3, expected, `${label}: fix list agrees with the scorer`);
  }
  // A top-level streetAddress still counts (it is what the field literally names).
  assert.equal(schemaFieldPresent({ "@type": "Store", streetAddress: "2-2" }, "streetAddress"), true);
  // Lower-cased criteria (the form extractAeoSignals passes) resolve the same way.
  assert.equal(schemaFieldPresent({ address: { streetAddress: "2-2" } }, "streetaddress"), true);
  // The fix list no longer claims `name` from a nested FAQ question when the
  // business node itself has none - the scorer never gave credit for that.
  const faqOnly = [{ "@type": "LocalBusiness", url: "https://x.test" }, { "@type": "FAQPage", mainEntity: [{ name: "Q", acceptedAnswer: { text: "A" } }] }];
  assert.deepEqual(publishedSchemaProps(faqOnly, ["name", "url"]), ["url"]);
  // Score movement: a v3 page with a structured address now meets 9/9 instead of 8/9.
  const v3Rules = { entityFields: { LocalBusiness: Object.fromEntries(["name", "url", "address", "streetAddress", "telephone", "openingHours", "geo", "description", "email"].map((k) => [k, true])) } };
  const full = { "@type": "Restaurant", name: "X", url: "https://x.test", address: { "@type": "PostalAddress", streetAddress: "1-1" }, telephone: "03-0000-0000", openingHours: "Mo-Su 10:00-20:00", geo: { latitude: 35, longitude: 139 }, description: "d", email: "a@x.test" };
  const local = diagnoseSchemaFields([full], { schemaRules: v3Rules }).filter((f) => f.entityType === "LocalBusiness");
  assert.ok(local.every((f) => f.present), "a complete v3 business meets every LocalBusiness criterion");
}

console.log("plan tier tests passed");
