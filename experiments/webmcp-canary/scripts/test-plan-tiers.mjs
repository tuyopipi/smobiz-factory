/**
 * The thing that makes free, Standard and Pro different.
 *
 * Before this, "always current" moved a version number and nothing else: the
 * plugin followed an integer, the scorer never consulted a ruleset at all, and
 * two rulesets with different contents produced byte-identical output. A paid
 * tier whose only difference is a bigger number is not a paid tier.
 *
 * The model asserted here has three parts, and all three have to hold or the
 * tiers collapse back into labels:
 *
 *   1. Output follows the plan. A free site keeps publishing the properties it
 *      was installed with; it never loses one, it simply does not gain the ones
 *      added after it.
 *   2. Scoring follows the criteria, for everyone. One measuring stick, the
 *      current one - which is what lets a free site's score drift down as the
 *      criteria advance while a Standard site's holds.
 *   3. A new property must be opt-in. "On unless switched off" hands every
 *      future field to every site the moment it is invented.
 */
import assert from "node:assert/strict";
import { INITIAL_AEO_RULESET, buildJsonLd } from "../worker/api.mjs";
import { BASELINE_SCORED_PROPS, extractAeoSignals, publishedSchemaProps, scoreAeo } from "../worker/aeo-score.mjs";

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

/* ---------------- 1. output follows the plan ---------------- */

{
  const free = buildJsonLd(SITE, SETTINGS, baseline);
  const standard = buildJsonLd(SITE, SETTINGS, advanced);

  // The same store data, published differently. This is the claim the pricing
  // page makes, and it was false until now.
  assert.notDeepEqual(free, standard, "the same store data does not produce the same schema on both tiers");

  assert.equal(free.description, undefined, "a baseline site does not publish description");
  assert.equal(free.email, undefined, "nor email");
  assert.equal(standard.description, "神田の自家焙煎コーヒー店", "a site following the criteria publishes description");
  assert.equal(standard.email, "hello@example.com", "and email");

  // Nothing is taken away from the baseline. A free site losing a field it had
  // yesterday would be a regression dressed up as a plan model.
  for (const key of Object.keys(free)) {
    assert.deepEqual(standard[key], free[key], `the advanced tier keeps everything the baseline published: ${key}`);
  }
  assert.ok(Object.keys(standard).length > Object.keys(free).length, "and adds to it");
}

{
  // A field with no value behind it publishes nothing, on either tier. An empty
  // property would earn a site a criterion it has not actually met.
  const bare = { name: "栞珈琲", address: "", description: "", email: "" };
  const standard = buildJsonLd(SITE, bare, advanced);
  assert.equal(standard.description, undefined, "an empty description is not published");
  assert.equal(standard.email, undefined, "nor an empty email");
}

/* ---------------- 2. one measuring stick, the current one ---------------- */

const pageWith = (ld) => `<html><body><h1>栞珈琲</h1><h2>営業時間</h2><p>東京都千代田区神田三崎町3-2-6 電話 03-1234-5678 営業時間 11:00-20:00 緯度 経度 https://example.com</p><script type="application/ld+json">${JSON.stringify(ld)}</script></body></html>`;
const ROBOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "PerplexityBot", "Google-Extended", "Applebot-Extended"]
  .map((bot) => `User-agent: ${bot}\nAllow: /`).join("\n\n");
const LLMS = "# 栞珈琲\n\n> 神田の自家焙煎コーヒー店\n\n## Key facts\n- URL: https://example.com/\n- Address: 東京都千代田区神田三崎町3-2-6\n- Phone: 03-1234-5678\n- Hours: 11:00-20:00\n";

const scoreOf = (ld, scoredProps) => {
  const signals = extractAeoSignals(pageWith(ld), ROBOTS, LLMS, { llmsPresent: true, edgeBlocked: false, scoredProps });
  const result = scoreAeo(signals);
  return { ...result, published: signals.publishedProps, coreProps: signals.schemaCoreProps };
};

{
  const freeLd = buildJsonLd(SITE, SETTINGS, baseline);
  const standardLd = buildJsonLd(SITE, SETTINGS, advanced);

  // Both measured against the criteria in force. Not against the ruleset each
  // happens to publish under - that would score every site as perfect against
  // its own standard and make the whole model unobservable.
  const free = scoreOf(freeLd, ADVANCED_SCORED);
  const standard = scoreOf(standardLd, ADVANCED_SCORED);

  assert.ok(standard.score > free.score, `a site following the criteria scores higher: ${standard.score} > ${free.score}`);
  assert.equal(standard.statuses.schema, "OK", "it meets the schema criteria");
  assert.equal(free.statuses.schema, "WARN", "the baseline site does not, and is marked down rather than failed");

  // The gap has to be real and survivable at the same time. A site that
  // installed the plugin yesterday is not suddenly in the red.
  assert.ok(free.score >= 50, `a baseline site stays respectable: ${free.score}`);
  assert.notEqual(free.band, "red", `and out of the red: ${free.band}`);
  // A real gap, and proportional to what is actually missing: two of nine
  // properties is 2/9 of the thirty-point schema component, about seven points.
  // Fewer than the fifteen a band step used to cost, which is the trade for the
  // decline being gradual instead of a cliff.
  assert.ok(standard.score - free.score >= 5, `and the gap is visible: +${standard.score - free.score}`);
  assert.ok(
    Math.abs((standard.metrics.schema - free.metrics.schema) - 2 / 9) < 0.01,
    "the deduction is exactly the share of criteria unmet, not a band",
  );
  // The difference is the schema component and nothing else - the two pages are
  // otherwise identical, so any other component moving would mean the test is
  // measuring something it did not intend to.
  for (const key of Object.keys(standard.statuses)) {
    if (key === "schema") continue;
    assert.equal(standard.statuses[key], free.statuses[key], `only the schema component differs, not ${key}`);
  }

  // And the deduction is for things genuinely absent, named.
  assert.ok(!free.published.includes("description"), "the baseline page really lacks description");
  assert.ok(!free.published.includes("email"), "and email");

  assert.ok(standard.published.includes("description") && standard.published.includes("email"), "and the advanced page really has them");
}

{
  // Measured against the baseline criteria, the two are indistinguishable.
  // That is the "before" state, and it is what made the tiers a label: the
  // difference only appears once the criteria have moved past the baseline.
  const free = scoreOf(buildJsonLd(SITE, SETTINGS, baseline), BASELINE_SCORED_PROPS);
  const standard = scoreOf(buildJsonLd(SITE, SETTINGS, advanced), BASELINE_SCORED_PROPS);
  assert.equal(free.score, standard.score, "under the old criteria there was nothing to choose between them");
}

{
  // The decline is gradual, not a cliff. Each further property the criteria add
  // and a baseline site lacks costs it a little more.
  const freeLd = buildJsonLd(SITE, SETTINGS, baseline);
  const six = scoreOf(freeLd, BASELINE_SCORED_PROPS).coreProps;
  const nine = scoreOf(freeLd, ADVANCED_SCORED).coreProps;
  assert.ok(nine < six, `the same page meets a smaller share of a wider standard: ${nine.toFixed(3)} < ${six.toFixed(3)}`);
  assert.ok(nine > 0.5, "but still meets most of it");
}

/* ---------------- 3. a new property is opt-in ---------------- */

{
  // The bug this guards against: `fields.description !== false` is true for a
  // ruleset that has never heard of description, so every baseline site would
  // pick up every future property the moment it was invented.
  const silent = { version: 9, definition: { ...INITIAL_AEO_RULESET.definition, schema: { ...INITIAL_AEO_RULESET.definition.schema, fields: { url: true } } } };
  const out = buildJsonLd(SITE, SETTINGS, silent);
  assert.equal(out.description, undefined, "a ruleset that says nothing about description does not publish it");
  assert.equal(out.email, undefined, "nor email");
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

console.log("plan tier tests passed");
