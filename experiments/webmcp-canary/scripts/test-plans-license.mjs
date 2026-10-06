import assert from "node:assert/strict";
import { handleApi } from "../worker/api.mjs";

const STANDARD_HASH = "d4d16d39aa31d15c39703e36cd6da41a5c9f8c49189ba966becbf8c93d134182";

function environment(initialPlan) {
  let plan = initialPlan;
  const updates = [];
  const DB = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              if (sql.includes("SELECT id, plan, manual_plan, status, delivery_status FROM sites WHERE site_key")) return { id: "site-1", plan, manual_plan: null, status: "active", delivery_status: "active" };
                if (sql.includes("SELECT plan, manual_plan FROM sites WHERE id=?")) return { plan, manual_plan: null };
              if (sql.includes("SELECT delivery_status FROM sites")) return { delivery_status: "active" };
              if (sql.includes("SELECT * FROM site_settings")) return { name: "Nurevo Cafe", serve_schema: 1, allow_crawlers: 1, telephone: "ignored", tel: "03-1234-5678", address: "Tokyo" };
              if (sql.includes("SELECT url, website_uri, slug FROM sites")) return { url: "example.com", website_uri: null, slug: null };
              if (sql.includes("FROM aeo_rulesets WHERE active = 1")) return { version: 9, definition_json: JSON.stringify({ schema: { context: "https://schema.org", type: "Restaurant", fields: { telephone: false, address: true } }, defaults: { schemaType: "LocalBusiness", hostedBaseUrl: "https://nurevo.jp/s/" } }) };
              if (sql.includes("SELECT plan FROM licenses")) return values[0] === STANDARD_HASH ? { plan: "standard" } : null;
              return null;
            },
            async run() {
              if (sql.includes("UPDATE sites SET plan=")) { plan = values[0]; updates.push(values); }
              return { success: true };
            },
          };
        },
        async first() {
          if (sql.includes("FROM aeo_rulesets WHERE active = 1")) return { version: 9, definition_json: JSON.stringify({ schema: { context: "https://schema.org", type: "Restaurant", fields: { telephone: false, address: true } }, defaults: { schemaType: "LocalBusiness", hostedBaseUrl: "https://nurevo.jp/s/" } }) };
          return null;
        },
      };
    },
  };
  return { DB, get plan() { return plan; }, updates };
}

async function config(plan) {
  const env = environment(plan);
  const response = await handleApi(new Request("https://worker.test/api/tag/config?k=nrv_site"), env, {});
  assert.equal(response.status, 200);
  return response.json();
}

const free = await config(undefined);
assert.equal(free.plan, "free");
assert.equal(free.ruleset_version, 1);
assert.equal(free.jsonld["@type"], "LocalBusiness");
assert.equal(free.jsonld.telephone, "03-1234-5678");
assert.equal("measurement" in free, false);

const standard = await config("standard");
assert.equal(standard.plan, "standard");
assert.equal(standard.ruleset_version, 9);
assert.equal(standard.jsonld["@type"], "Restaurant");
assert.equal("telephone" in standard.jsonld, false);
assert.equal("measurement" in standard, false);

const pro = await config("pro");
assert.equal(pro.plan, "pro");
assert.equal(pro.ruleset_version, 9);
// No reserved/locked paid payload ships in the config response. W2 adds
// measurement when it actually exists, not as a dead placeholder.
assert.equal("measurement" in pro, false);

const env = environment("free");
const verified = await handleApi(new Request("https://worker.test/api/license/verify", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ license: "nrv_canary_standard_3000", site_key: "nrv_site" }),
}), env, {});
assert.equal(verified.status, 200);
// Billing decides the plan, so verifying a key no longer grants one. The
// response reports what the site actually has - otherwise a cancelled
// customer would be told they are still on the tier their key names.
assert.deepEqual(await verified.json(), { ok: true, plan: "free" }, "an unbilled site is free even with a valid key");
assert.equal(env.plan, "free", "verify does not write the plan");
assert.deepEqual(env.updates, [], "verify performs no plan update at all");

// A site that billing has put on a tier reports that tier.
const billed = environment("pro");
const billedResponse = await handleApi(new Request("https://worker.test/api/license/verify", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ license: "nrv_canary_standard_3000", site_key: "nrv_site" }),
}), billed, {});
assert.deepEqual(await billedResponse.json(), { ok: true, plan: "pro" }, "the billed tier is reported, not the license tier");

const invalid = await handleApi(new Request("https://worker.test/api/license/verify", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ license: "invalid" }),
}), environment("free"), {});
assert.equal(invalid.status, 404);
assert.deepEqual(await invalid.json(), { ok: false, error: "invalid_license", plan: "free" });

console.log("Plan and license tests passed");
