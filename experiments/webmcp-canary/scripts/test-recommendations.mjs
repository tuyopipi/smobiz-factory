/**
 * Where to fix this site, in the order worth fixing it.
 *
 * The learning job already wrote rows saying "this site is missing customer
 * data" and nothing published them, so the Pro promise of "we tell you what to
 * change" rested on one generic sentence that no API exposed. The ordering is
 * the part that makes this advice rather than a second score: eight checks all
 * reading "needs work" tells an operator nothing about what to do first.
 */
import assert from "node:assert/strict";
import { buildSiteRecommendations, missingScoredProps } from "../worker/recommendations.mjs";
import { handleApi } from "../worker/api.mjs";

const PROPS = ["name", "url", "address", "streetAddress", "telephone", "openingHours", "geo", "description", "email"];
const FULL_PROFILE = {
  name: "栞珈琲", url: "https://example.com/", address: "東京都千代田区", phone: "03-1234-5678",
  hours: "11:00-20:00", lat: 35.6, lng: 139.7, description: "自家焙煎", email: "a@example.com",
};

/* ---------------- what is missing ---------------- */

assert.deepEqual(missingScoredProps(PROPS, ["name", "url"]).slice(0, 2), ["address", "streetaddress"]);
assert.deepEqual(missingScoredProps(["Name", "EMAIL"], ["name"]), ["email"], "the comparison is case-insensitive");
assert.deepEqual(missingScoredProps([], ["name"]), [], "no criteria, nothing missing");
assert.deepEqual(missingScoredProps(PROPS, PROPS), [], "a site meeting everything is missing nothing");

/* ---------------- a gate failure comes first ---------------- */

{
  // Nothing else moves the score while a gate is failing, so advising anything
  // else first is telling someone to waste an afternoon.
  const result = buildSiteRecommendations({
    plan: "pro",
    profile: FULL_PROFILE,
    scoredProps: PROPS,
    publishedProps: ["name"],
    checks: [
      { id: "llms", status: "BAD", label: "llms.txt", message: "ありません。" },
      { id: "ai_crawlers_allowed", status: "BAD", label: "AIクローラー到達性", message: "拒否しています。" },
      { id: "consistency", status: "WARN", label: "一貫性", message: "やや不一致。" },
    ],
  });
  assert.equal(result.items[0].id, "ai_crawlers_allowed", "the gate failure is first");
  assert.equal(result.items[0].blocking, true, "and is marked as blocking");
  assert.equal(result.blocking, 1, "the count says how many block everything else");
  // A warning never outranks a failure.
  const warnAt = result.items.findIndex((item) => item.status === "WARN");
  const badAt = result.items.findIndex((item) => item.status === "BAD");
  assert.ok(badAt < warnAt, "failures are listed before warnings");
}

{
  const result = buildSiteRecommendations({
    plan: "pro", profile: FULL_PROFILE, scoredProps: PROPS, publishedProps: PROPS,
    checks: [{ id: "edge_access", status: "WARN", label: "エッジ", message: "怪しい" }],
  });
  assert.equal(result.items[0].blocking, false, "a gate check that is only a warning does not block");
  assert.equal(result.items[0].kind, "check_warn");
}

/* ---------------- a missing value and an unpublished value are different ---------------- */

{
  // The operator never typed it in. Telling them to "publish it" is useless.
  const result = buildSiteRecommendations({
    plan: "pro",
    profile: { ...FULL_PROFILE, description: "", email: "" },
    scoredProps: PROPS,
    publishedProps: PROPS.filter((p) => !["description", "email"].includes(p)).map((p) => p.toLowerCase()),
  });
  const kinds = result.items.map((item) => item.kind);
  assert.ok(kinds.every((kind) => kind === "profile_missing"), "an empty field is a data problem");
  const desc = result.items.find((item) => item.target === "description");
  assert.ok(desc.title.includes("入力"), "and the advice is to enter it");
  assert.equal(desc.field, "description", "naming the field to fill");
}

{
  // The value is there and the site is on free, so it is not entitled to
  // publish it yet. That is a plan fact, not a mistake the operator made.
  const result = buildSiteRecommendations({
    plan: "free",
    profile: FULL_PROFILE,
    scoredProps: PROPS,
    publishedProps: PROPS.filter((p) => !["description", "email"].includes(p)).map((p) => p.toLowerCase()),
  });
  const desc = result.items.find((item) => item.target === "description");
  assert.equal(desc.kind, "criteria_lag", "a filled-in value that is not published is criteria lag");
  assert.equal(desc.upgrade, "standard", "and names the tier that fixes it");
  assert.ok(desc.detail.includes("Standard"), "in words too");
}

{
  // The same gap on a paid site is a genuine output fault, not an upsell.
  const result = buildSiteRecommendations({
    plan: "pro",
    profile: FULL_PROFILE,
    scoredProps: PROPS,
    publishedProps: PROPS.filter((p) => p !== "description").map((p) => p.toLowerCase()),
  });
  const desc = result.items.find((item) => item.target === "description");
  assert.equal(desc.kind, "schema_missing", "a paid site with the value and no output has a real problem");
  assert.equal(desc.upgrade, undefined, "and is not sold anything");
}

/* ---------------- geo is a pair, not a field ---------------- */

{
  const noGeo = buildSiteRecommendations({
    plan: "pro", profile: { ...FULL_PROFILE, lat: null, lng: null },
    scoredProps: ["geo"], publishedProps: [],
  });
  assert.equal(noGeo.items[0].kind, "profile_missing", "missing coordinates are missing data");

  const withGeo = buildSiteRecommendations({
    plan: "pro", profile: FULL_PROFILE, scoredProps: ["geo"], publishedProps: [],
  });
  assert.equal(withGeo.items[0].kind, "schema_missing", "coordinates that exist but are unpublished are an output fault");
}

/* ---------------- nothing wrong produces nothing ---------------- */

{
  const clean = buildSiteRecommendations({
    plan: "pro", profile: FULL_PROFILE, scoredProps: PROPS,
    publishedProps: PROPS.map((p) => p.toLowerCase()),
    checks: [{ id: "schema", status: "OK", label: "構造化データ", message: "良好" }],
  });
  assert.equal(clean.count, 0, "a site with nothing wrong is told nothing");
  assert.deepEqual(clean.items, [], "rather than given invented busywork");
}

assert.equal(buildSiteRecommendations({}).count, 0, "no input is not a crash");
assert.equal(buildSiteRecommendations({ checks: null, stored: "x" }).count, 0, "nor is rubbish");

/* ---------------- the learning job's row earns its place or is dropped ---------------- */

{
  // Everything it names is already covered item by item, so repeating it would
  // pad the list.
  const result = buildSiteRecommendations({
    plan: "pro",
    profile: { ...FULL_PROFILE, description: "", email: "" },
    scoredProps: ["description", "email"],
    publishedProps: [],
    stored: [{
      kind: "missing_customer_data",
      detail_json: JSON.stringify({
        reason: "店舗情報が不足しています。",
        missing_fields: [{ key: "description", schema: "description" }, { key: "email", schema: "email" }],
      }),
    }],
  });
  assert.ok(!result.items.some((item) => item.kind === "stored"), "a row that says nothing new is dropped");
  assert.equal(result.count, 2, "leaving the two specific items");
}

{
  // It says something the property pass did not, so it stays.
  const result = buildSiteRecommendations({
    plan: "pro", profile: FULL_PROFILE, scoredProps: [], publishedProps: [],
    stored: [{
      kind: "missing_customer_data",
      detail_json: JSON.stringify({ reason: "確認が必要です。", missing_fields: [{ key: "price_level", schema: "priceRange", label: "価格帯" }] }),
    }],
  });
  const stored = result.items.find((item) => item.kind === "stored");
  assert.ok(stored, "a row naming something uncovered is kept");
  assert.deepEqual(stored.fields, ["価格帯"], "with the fields it names");
  assert.equal(stored.detail, "確認が必要です。");
}

{
  const result = buildSiteRecommendations({
    plan: "pro", profile: FULL_PROFILE, scoredProps: [], publishedProps: [],
    stored: [{ kind: "missing_customer_data", detail_json: "{not json" }],
  });
  assert.equal(result.count, 1, "a malformed detail still yields an item rather than an error");
}

/* ---------------- no duplicates ---------------- */

{
  const result = buildSiteRecommendations({
    plan: "pro", profile: FULL_PROFILE, scoredProps: ["description", "description"], publishedProps: [],
    checks: [{ id: "schema", status: "BAD", label: "s", message: "m" }, { id: "schema", status: "BAD", label: "s", message: "m" }],
  });
  const ids = result.items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, "each thing to fix is listed once");
}

/* ---------------- the endpoint is Pro ---------------- */

const CSRF = "c".repeat(64);
const SESSION = { cookie: `nrv_session=t; nrv_csrf=${CSRF}`, origin: "https://nurevo.jp" };

function makeEnv({ plan = "pro" } = {}) {
  const DB = {
    prepare(sql) {
      const first = async (...values) => {
        if (/FROM sessions/.test(sql)) {
          return { member_id: "m1", org_id: "org1", email: "o@x.test", role: "admin", status: "active", expires_at: Date.now() + 3.6e6 };
        }
        if (/FROM aeo_rulesets/.test(sql)) return null;
        if (/FROM aeo_scores/.test(sql)) return { scanned_at: "2026-10-08T00:00:00.000Z", checks_json: JSON.stringify([{ id: "llms", status: "BAD" }]) };
        if (/FROM site_settings/.test(sql)) return { site_id: "site1", name: "X" };
        if (/FROM sites WHERE id=\?/.test(sql)) {
          if (values[0] !== "site1") return null;
          if (/org_id=\?/.test(sql) && values[1] !== "org1") return null;
          // No address, so the live schema read is skipped and no network is touched.
          return { id: "site1", org_id: "org1", url: "", website_uri: "", slug: null, site_key: "nrv_k", plan, manual_plan: null };
        }
        return null;
      };
      return {
        bind(...values) {
          return { first: () => first(...values), async all() { return { results: [] }; }, async run() { return { success: true }; } };
        },
        first, async all() { return { results: [] }; }, async run() { return { success: true }; },
      };
    },
  };
  return { DB, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp" };
}

const ask = async (env) => {
  const response = await handleApi(
    new Request("https://w.test/api/sites/site1/recommendations", { headers: SESSION }), env, { waitUntil() {} },
  );
  return { status: response.status, body: await response.json() };
};

{
  // A page that could not be read yields no properties, which is
  // indistinguishable from a page publishing none. Listing every criterion as
  // missing on the strength of a failed fetch would be confidently wrong about
  // nine things at once, so the property pass is suppressed and the response
  // says the page was not read.
  const env = makeEnv({ plan: "pro" });
  const { body } = await ask(env);
  assert.equal(body.schema_read, false, "the site has no address, so nothing was read");
  assert.ok(!body.items.some((item) => item.kind === "schema_missing"), "and nothing is claimed missing from its schema");
  assert.ok(!body.items.some((item) => item.kind === "criteria_lag"));
  assert.ok(Array.isArray(body.scored_props) && body.scored_props.length, "the criteria are still reported");
}

{
  const { status, body } = await ask(makeEnv({ plan: "pro" }));
  assert.equal(status, 200, "a pro site gets its list");
  assert.equal(body.site_id, "site1");
  assert.equal(body.checked_at, "2026-10-08T00:00:00.000Z", "and when it was last diagnosed");
  assert.ok(Array.isArray(body.items), "with items");
  assert.ok(body.items.some((item) => item.id === "llms"), "built from the stored diagnosis");
}

{
  const { status, body } = await ask(makeEnv({ plan: "free" }));
  assert.equal(status, 402, "a free site is asked to upgrade");
  assert.equal(body.error, "upgrade_required");
}

{
  const { status } = await ask(makeEnv({ plan: "standard" }));
  assert.equal(status, 402, "and so is Standard - knowing what to fix is the Pro part");
}

console.log("recommendation tests passed");
