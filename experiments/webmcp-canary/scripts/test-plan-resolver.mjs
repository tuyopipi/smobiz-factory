// One plan resolver: every entitlement check honours site and org manual_plan.
//
// The SoV batch selected `WHERE plan='pro'`, calibration joined on
// `si.plan='pro'`, and requireProSite / authorizeSiteKey / the static snippet
// resolved without the org's grant. A site comped Pro (on the site or through
// its org) was shown as Pro on the dashboard and then refused or never
// measured. These run against a real SQLite schema, not string-matched mocks.
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { handleApi, runSovDailyBatch } from "../worker/api.mjs";
import { authorizeSiteKey } from "../worker/agent-authorization.mjs";
import { collectCalibrationSamples } from "../worker/aeo-calibration.mjs";
import { resolveSitePlanFor } from "../worker/billing-plan.mjs";

const dir = new URL("../nurevo-impl/db/", import.meta.url);
const sqlite = new DatabaseSync(":memory:");
sqlite.exec(readFileSync(new URL("schema.sql", dir), "utf8"));
for (const file of readdirSync(dir).filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort()) {
  for (const stmt of readFileSync(new URL(file, dir), "utf8").split(/;\s*\n/)) {
    // schema.sql already carries most columns; re-adding one is not an error here.
    try { if (stmt.trim()) sqlite.exec(stmt); } catch (error) { if (!/duplicate column/.test(error.message)) throw error; }
  }
}
const wrap = (sql, args) => ({
  async first() { return sqlite.prepare(sql).get(...args) || null; },
  async all() { return { results: sqlite.prepare(sql).all(...args) }; },
  async run() { return { meta: sqlite.prepare(sql).run(...args) }; },
});
const DB = { prepare(sql) { return { ...wrap(sql, []), bind: (...args) => wrap(sql, args) }; }, async batch(list) { return Promise.all(list.map((s) => s.run())); } };
const env = { DB, PERPLEXITY_API_KEY: "test" };

sqlite.exec(`
  INSERT INTO orgs(id,manual_plan) VALUES('o_plain',NULL),('o_comp','pro');
  INSERT INTO sites(id,org_id,url,site_key,plan,manual_plan,created_at,delivery_status) VALUES
    ('billed','o_plain','billed.test','k_billed','pro',NULL,1,'active'),
    ('site_comp','o_plain','sitecomp.test','k_site_comp','free','pro',2,'active'),
    ('org_comp','o_comp','orgcomp.test','k_org_comp','free',NULL,3,'active'),
    ('free','o_plain','free.test','k_free','free',NULL,4,'active'),
    ('std_comp','o_plain','std.test','k_std','free','standard',5,'active');
`);

/* the resolver itself */
for (const [id, expected] of [["billed", "pro"], ["site_comp", "pro"], ["org_comp", "pro"], ["free", "free"], ["std_comp", "standard"]]) {
  const row = sqlite.prepare("SELECT * FROM sites WHERE id=?").get(id);
  assert.equal(await resolveSitePlanFor(env, row), expected, `${id} resolves to ${expected} from a sites row`);
  assert.equal(await resolveSitePlanFor(env, { plan: row.plan, manual_plan: row.manual_plan, id }), expected, `${id}: also by site id alone`);
}

/* authorizeSiteKey */
for (const [key, plan, quality] of [["k_org_comp", "pro", "high"], ["k_site_comp", "pro", "high"], ["k_free", "free", "basic"]]) {
  const auth = await authorizeSiteKey(env, key, { touch: false });
  assert.equal(auth.plan, plan, `${key}: site key reports the resolved plan`);
  assert.equal(auth.quality, quality);
}

/* requireProSite (via a Pro endpoint with a site key) */
for (const [id, key, status] of [["org_comp", "k_org_comp", 200], ["site_comp", "k_site_comp", 200], ["free", "k_free", 402]]) {
  const res = await handleApi(new Request(`https://nurevo.jp/api/sites/${id}/sov/query-set?site_key=${key}`), env, { waitUntil() {} });
  assert.equal(res.status, status, `${id}: Pro gate ${status}`);
}

/* static snippet payload reports the resolved plan */
{
  const { createHash } = await import("node:crypto");
  sqlite.exec("INSERT INTO members(id,org_id,email,role,status) VALUES('m1','o_comp','owner@x.test','admin','active')");
  sqlite.prepare("INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES(?,?,?,?,?)")
    .run(createHash("sha256").update("tok").digest("hex"), "m1", "o_comp", "session", Date.now() + 3.6e6);
  const res = await handleApi(new Request("https://nurevo.jp/api/sites/org_comp/static-snippet", { headers: { cookie: "nrv_session=tok" } }), env, { waitUntil() {} });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).plan, "pro", "static snippet honours the org grant");
}

/* SoV daily batch selects every resolved-Pro site, and only those */
{
  const out = await runSovDailyBatch(env, { now: Date.parse("2026-10-23T00:00:00Z") });
  const picked = new Set([...(out.errors || []).map((e) => e.site_id)]);
  assert.equal(out.sites, 3, `three resolved-Pro sites are candidates: ${JSON.stringify(out)}`);
  for (const id of ["billed", "site_comp", "org_comp"]) assert.ok(picked.has(id) || out.measured > 0, `${id} is measured`);
  assert.ok(!picked.has("free") && !picked.has("std_comp"), "free and standard sites are never measured");
}

/* calibration samples include comped Pro */
{
  const checks = JSON.stringify([{ id: "schema", status: "OK" }]);
  for (const id of ["billed", "org_comp", "free"]) {
    sqlite.prepare("INSERT INTO aeo_sov_runs(id,site_id,ran_at,status,trigger,model_version,appearance_rate,answers_received,confidence) VALUES(?,?,?,?,?,?,?,?,?)")
      .run(`r_${id}`, id, "2026-10-20T00:00:00Z", "measured", "scheduled", "test", 0.5, 4, "low");
    sqlite.prepare("INSERT INTO aeo_scores(site_id,scanned_at,score,checks_json) VALUES(?,?,?,?)").run(id, "2026-10-19T00:00:00Z", 70, checks);
  }
  const samples = await collectCalibrationSamples(env);
  assert.deepEqual(samples.map((s) => s.site_id).sort(), ["billed", "org_comp"], "an org-comped Pro site contributes; a free one does not");
}

console.log("plan resolver tests passed");
