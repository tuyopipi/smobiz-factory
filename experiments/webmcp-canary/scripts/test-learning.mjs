/**
 * Learning data (docs/learning.md, migration 0049): the change log, the
 * pre-install baseline, the before/after panels and the estimator.
 *
 *   1. event ingestion: POST /api/sites/{id}/events with the profile token,
 *      idempotent per event id, bad events rejected without blocking the rest,
 *      no cookie / CSRF needed, wrong or missing token refused, 503 before 0049
 *   2. no personal data: payloads are reduced to their allowlist; values that
 *      look like an address, phone or email never reach the table
 *   3. service-side events: site_created, site_connected (pairing),
 *      score_changed (storeAeoScore), plan / free check / SoV ids idempotent
 *   4. baseline: scheduled when a WordPress site is added (not a hosted one),
 *      run once inside the free budget (global free row + its own
 *      "free:baseline" ledger reason + one account slot, never the site's own
 *      free:perplexity row), readiness recorded; skipped for caps, inactive
 *      owners, Pro, late runs; the queue (offline) and consent rules of the
 *      plugin are covered in scripts/test-wordpress-aeo-admin.php
 *   5. panels: weekly buckets with readiness, events, per-engine outcomes
 *      (never pooled across engines), the baseline flagged
 *   6. the estimator on synthetic data with a known effect: recovered within
 *      the cluster-bootstrap CI, placebo ~0, "insufficient_data" below the
 *      gate, only levers estimated, context variables only as strata, "own
 *      site cited" first, proposals never applied
 *   7. GET /api/admin/learning: super admins only
 * Real SQLite with the real schema; Perplexity is stubbed, nothing reaches the network.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import vm from "node:vm";
import { tFor } from "./dashboard-dictionary.mjs";
import { handleApi } from "../worker/api.mjs";
import { GLOBAL_SCOPE, readEngineUsage } from "../worker/ai-engines.mjs";
import { FREE_ACCOUNT_ENGINE, FREE_USAGE_ENGINE } from "../worker/free-ai-check.mjs";
import { storeAeoScore } from "../worker/diagnose.mjs";
import { LEARNING_EVENT_TYPES, recordServiceEvent, sanitizeEventData } from "../worker/learning-events.mjs";
import { BASELINE_USAGE_ENGINE, runBaseline, runBaselineBatch, scheduleBaseline } from "../worker/learning-baseline.mjs";
import {
  CONTEXT_ONLY, LEARNING_MIN_TREATED, LEARNING_TREATMENTS, buildPanels, estimateEffect, learningReport, loadLearningData, weekOf,
} from "../worker/learning.mjs";

const sql = (f) => readFileSync(new URL(`../nurevo-impl/db/${f}`, import.meta.url), "utf8");
const sha = (v) => createHash("sha256").update(v).digest("hex");
const DAY = 86400e3;
const WEEK = 7 * DAY;

function setup({ learning = true, extraEnv = {} } = {}) {
  const sqlite = new DatabaseSync(":memory:");
  let schema = sql("schema.sql");
  if (!learning) schema = schema.slice(0, schema.indexOf("-- 0049:"));
  sqlite.exec(schema);
  for (const s of ["ALTER TABLE sites ADD COLUMN manual_plan TEXT", "ALTER TABLE orgs ADD COLUMN manual_plan TEXT", "ALTER TABLE sites ADD COLUMN bound_at INTEGER",
    "ALTER TABLE sites ADD COLUMN domain_key TEXT", "ALTER TABLE aeo_scores ADD COLUMN delivered_ruleset_version INTEGER", "ALTER TABLE aeo_scores ADD COLUMN score_model_version TEXT"]) {
    try { sqlite.exec(s); } catch { /* present */ }
  }
  sqlite.exec(sql("0048_aeo_score_v2.sql"));
  sqlite.exec(`INSERT INTO orgs(id) VALUES('o1'); INSERT INTO orgs(id) VALUES('o2');
    INSERT INTO members(id,org_id,email,role,status) VALUES('m1','o1','owner@x.test','admin','active');
    INSERT INTO members(id,org_id,email,role,status) VALUES('m2','o2','pending@y.test','admin','pending');
    INSERT INTO members(id,org_id,email,role,status) VALUES('boss','o1','boss@x.test','admin','active');
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("t")}','m1','o1','session',${Date.now() + 3.6e6});
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("boss")}','boss','o1','session',${Date.now() + 3.6e6});`);
  const DB = {
    prepare(text) {
      const w = (a) => ({ async first() { return sqlite.prepare(text).get(...a) || null; }, async all() { return { results: sqlite.prepare(text).all(...a) }; }, async run() { return { meta: sqlite.prepare(text).run(...a) }; }, runSync() { return sqlite.prepare(text).run(...a); } });
      return { ...w([]), bind: (...a) => w(a) };
    },
    async batch(st) { sqlite.exec("BEGIN"); try { for (const s of st) s.runSync(); sqlite.exec("COMMIT"); } catch (e) { sqlite.exec("ROLLBACK"); throw e; } },
  };
  const kv = new Map();
  const env = { DB, WEBMCP_KV: { async get(k) { return kv.get(k) ?? null; }, async put(k, v) { kv.set(k, v); } }, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp",
    PERPLEXITY_API_KEY: "pplx-test", SUPER_ADMIN_EMAILS: "boss@x.test", ...extraEnv };
  return { sqlite, env };
}

let pplx = 0;
globalThis.fetch = async (url) => {
  const u = String(url?.url || url);
  if (u.includes("perplexity")) {
    pplx += 1;
    return Response.json({ model: "m", status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: "Try **Cafe Learn** (https://cafe-learn.example/)." }] }], usage: { input_tokens: 3000, output_tokens: 400 } });
  }
  return new Response("", { status: 404 });
};
const CSRF = "c".repeat(64);
const member = (env, token = "t") => (method, path, body) => handleApi(new Request(`https://nurevo.jp${path}`, { method, headers: { cookie: `nrv_session=${token}; nrv_csrf=${CSRF}`, origin: "https://nurevo.jp", "x-csrf-token": CSRF, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined }), env, {});
const plugin = (env, token) => (method, path, body) => handleApi(new Request(`https://nurevo.jp${path}`, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined }), env, {});
const REAL_LOG = console.log;
const quiet = async (fn) => { console.log = () => {}; try { return await fn(); } finally { console.log = REAL_LOG; } };
const rows = (sqlite, where = "1=1") => sqlite.prepare(`SELECT * FROM learning_events WHERE ${where} ORDER BY occurred_at`).all();
const uuid = (n) => `00000000-0000-4000-a000-${String(n).padStart(12, "0")}`;

/* ================================================================== *
 * 1-3. Ingestion, no PII, service events
 * ================================================================== */
const { sqlite, env } = setup();
const call = member(env);
const created = await quiet(async () => (await call("POST", "/api/sites", { install_type: "wp", url: "cafe-learn.example", name: "Cafe Learn", business_type: "CafeOrCoffeeShop" })).json());
const siteId = created.id;
assert.ok(siteId && created.profile_token, "site created");
{
  const ev = rows(sqlite, `site_id='${siteId}'`);
  assert.deepEqual(ev.map((r) => r.type), ["site_created"], "adding a site starts its change log");
  assert.equal(JSON.parse(ev[0].data_json).install_type, "wp");
  const hosted = await quiet(async () => (await call("POST", "/api/sites", { install_type: "hosted", name: "Hosted Cafe" })).json());
  assert.equal(sqlite.prepare("SELECT status FROM learning_baselines WHERE site_id=?").get(siteId)?.status, "scheduled", "a WordPress site gets a baseline scheduled");
  assert.equal(sqlite.prepare("SELECT 1 FROM learning_baselines WHERE site_id=?").get(hosted.id), undefined, "a hosted page does not (no plugin to measure)");
}

// Pairing: the moment the plugin connected.
const { pairing_code } = await (await call("POST", `/api/sites/${siteId}/pairing-code`)).json();
const paired = await (await handleApi(new Request("https://nurevo.jp/api/pair", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: pairing_code, domain: "cafe-learn.example", site_url: "https://cafe-learn.example/", install_type: "wp" }) }), env, {})).json();
assert.equal(paired.ok, true, "paired");
const token = paired.profile_token;
assert.deepEqual(rows(sqlite, `site_id='${siteId}' AND type='site_connected'`).map((r) => JSON.parse(r.data_json)), [{ via: "pairing", install_type: "wp" }], "pairing is recorded once");

const send = plugin(env, token);
const now = new Date().toISOString();
const batch = [
  { id: uuid(1), type: "snapshot", at: now, data: { switches: { llms_txt: true, schema: true, browser_tag: false }, fields_filled: ["name", "address", "phone"], facts_complete: false, site_type: "local", seo_plugins: ["yoast"], plugin_version: "0.9.0", counts: { faq: 0, services: 2, products: 0 }, installed_days: 1,
    // Not on the allowlist: dropped.
    address: "東京都渋谷区神南1-2-3", business_phone: "03-1234-5678", email: "owner@shop.test" } },
  { id: uuid(2), type: "fields_changed", at: now, data: { filled: ["hours", "東京都渋谷区神南1-2-3", "owner@shop.test"], cleared: [], facts_complete: true, became_complete: true, value: "03-1234-5678" } },
  { id: uuid(3), type: "output_toggled", at: now, data: { switch: "llms_txt", on: false } },
  { id: uuid(4), type: "fix_applied", at: now, data: { check: "llms", via: "one_click", actions: ["Tokyo 03-1234-5678"] } },
  { id: uuid(5), type: "made_up_type", at: now, data: {} },
  { id: "x", type: "output_toggled", at: now, data: { switch: "schema", on: true } },
  { id: uuid(7), type: "output_toggled", at: "1999-01-01T00:00:00Z", data: { switch: "schema", on: true } },
  { id: uuid(8), type: "score_changed", at: now, data: { readiness: 99 } }, // service-only type: a plugin cannot send it
];
{
  const first = await send("POST", `/api/sites/${siteId}/events`, { events: batch });
  assert.equal(first.status, 200, "bearer-authenticated, no cookie and no CSRF token needed");
  const body = await first.json();
  assert.deepEqual(body.accepted, [uuid(1), uuid(2), uuid(3), uuid(4)], "valid events accepted");
  assert.deepEqual(body.rejected.map((r) => r.reason), ["unknown_type", "bad_id", "bad_time", "unknown_type"], "the rest rejected with a reason, without blocking the batch");
  const count = () => rows(sqlite, `site_id='${siteId}' AND source='plugin'`).length;
  assert.equal(count(), 4);
  // Re-sent after a lost reply: idempotent, and acknowledged again so the plugin can drop it.
  const again = await (await send("POST", `/api/sites/${siteId}/events`, { events: batch.slice(0, 4) })).json();
  assert.deepEqual(again.accepted, [uuid(1), uuid(2), uuid(3), uuid(4)], "a resend is acknowledged");
  assert.equal(count(), 4, "and stored once");
  // No personal data anywhere in what was stored.
  const stored = JSON.stringify(rows(sqlite, `site_id='${siteId}'`));
  for (const needle of ["渋谷", "03-1234", "1234-5678", "owner@shop.test", "Tokyo", "Cafe Learn", "cafe-learn.example"]) {
    assert.equal(stored.includes(needle), false, `no personal or business value is stored (${needle})`);
  }
  const snapshot = JSON.parse(rows(sqlite, `event_id='${uuid(1)}'`)[0].data_json);
  assert.deepEqual(Object.keys(snapshot).sort(), ["counts", "facts_complete", "fields_filled", "installed_days", "plugin_version", "seo_plugins", "site_type", "switches"], "only allowlisted keys survive");
  assert.deepEqual(JSON.parse(rows(sqlite, `event_id='${uuid(2)}'`)[0].data_json).filled, ["hours"], "a field list keeps only known field names");
  assert.deepEqual(JSON.parse(rows(sqlite, `event_id='${uuid(4)}'`)[0].data_json).actions, [], "free text cannot pass as an action id");

  // Auth: the profile token of this site, nothing else.
  assert.equal((await plugin(env, null)("POST", `/api/sites/${siteId}/events`, { events: [] })).status, 401, "no token");
  assert.equal((await plugin(env, "nrvp_wrong")("POST", `/api/sites/${siteId}/events`, { events: [] })).status, 403, "wrong token");
  assert.equal((await send("POST", `/api/sites/${siteId}/events`, { nope: 1 })).status, 400, "events required");
  assert.equal((await send("POST", `/api/sites/${siteId}/events`, { events: Array.from({ length: 101 }, (_, i) => ({ id: uuid(100 + i), type: "output_toggled", at: now, data: {} })) })).status, 413, "batches are bounded");
}
{
  // The sanitizer, directly: every type's payload is allowlist-only.
  assert.deepEqual(sanitizeEventData("counts_changed", { faq: { from: 0, to: 3 }, note: "hello" }), { faq: { from: 0, to: 3 } });
  assert.equal(sanitizeEventData("nope", {}), null);
  assert.deepEqual(sanitizeEventData("plugin_version_changed", { from: "0.8.1", to: "<script>" }), { from: "0.8.1" });
  for (const [type, def] of Object.entries(LEARNING_EVENT_TYPES)) assert.ok(["plugin", "service"].includes(def.source), `${type} has a source`);
  // Service events: idempotent by id; unknown or plugin-only types refused.
  assert.equal((await recordServiceEvent(env, siteId, "free_check", { status: "done", n: 3, appeared: 1, cited: 1, named: 0, question: "秘密" }, { eventId: "svc:free_check:2026-10" })).inserted, true);
  assert.equal((await recordServiceEvent(env, siteId, "free_check", { status: "done", n: 3 }, { eventId: "svc:free_check:2026-10" })).inserted, false, "one free_check per site and month");
  assert.equal(rows(sqlite, "event_id='svc:free_check:2026-10'")[0].data_json.includes("秘密"), false, "free text is dropped");
  assert.equal((await recordServiceEvent(env, siteId, "snapshot", {})).ok, false, "the service cannot write plugin events");
  // Never throws, even without the table.
  const bare = setup({ learning: false });
  assert.equal((await recordServiceEvent(bare.env, "s", "site_created", {})).ok, false);
  const early = await plugin(bare.env, "x")("POST", "/api/sites/none/events", { events: [] });
  assert.ok([403, 404].includes(early.status));
}
{
  // score_changed from the real store: first score, then a component change, then no change.
  const checks = (llms) => [{ id: "schema", status: "OK" }, { id: "coverage", status: "WARN" }, { id: "legibility", status: "OK" }, { id: "llms", status: llms }, { id: "consistency", status: "OK" }];
  await storeAeoScore(env, siteId, { host: "cafe-learn.example", score: 70, verdict: "yellow", checks: checks("BAD"), scannedAt: "2026-10-01T00:00:00.000Z", modelVersion: "u1-v4" });
  await storeAeoScore(env, siteId, { host: "cafe-learn.example", score: 82, verdict: "green", checks: checks("OK"), scannedAt: "2026-10-02T00:00:00.000Z", modelVersion: "u1-v4" });
  await storeAeoScore(env, siteId, { host: "cafe-learn.example", score: 82, verdict: "green", checks: checks("OK"), scannedAt: "2026-10-03T00:00:00.000Z", modelVersion: "u1-v4" });
  const changes = rows(sqlite, `site_id='${siteId}' AND type='score_changed'`).map((r) => JSON.parse(r.data_json));
  assert.equal(changes.length, 2, "a score event when it moves, none when it does not");
  assert.equal(changes[0].first, true);
  assert.deepEqual([changes[1].readiness_from, changes[1].readiness, changes[1].changed], [70, 82, ["llms"]], "readiness and the component that moved");
  assert.equal(changes[1].components.llms, "OK");
  assert.equal(changes[1].score_version, "aeo-v2", "with the score version");
}

/* ================================================================== *
 * 4. Baseline
 * ================================================================== */
const loadProfile = async () => ({ name: "Cafe Learn", businessType: "カフェ", locality: "渋谷区", host: "cafe-learn.example", aliases: ["Cafe Learn"], language: "ja" });
const diagnose = async () => ({ score: 41, checks: [{ id: "schema", status: "BAD" }, { id: "llms", status: "BAD" }], modelVersion: "u1-v4" });
{
  const b = setup();
  const make = (id, { owner = "m1", org = "o1", created = Date.now() - 3600e3, plan = "free", type = "wp" } = {}) => {
    b.sqlite.prepare("INSERT INTO sites(id,org_id,url,site_key,install_type,plan,owner_member_id,created_at) VALUES(?,?,?,?,?,?,?,?)").run(id, org, `${id}.example`, `k_${id}`, type, plan, owner, created);
    return scheduleBaseline(b.env, { id, install_type: type });
  };
  assert.equal((await make("w1")).scheduled, true);
  assert.equal((await scheduleBaseline(b.env, { id: "w1", install_type: "wp" })).scheduled, false, "one baseline per site, ever");
  const before = pplx;
  const out = await quiet(() => runBaseline(b.env, "w1", { loadProfile, diagnose }));
  assert.equal(out.status, "done", JSON.stringify(out));
  assert.equal(pplx - before, 3, "three non-branded Perplexity questions");
  const row = b.sqlite.prepare("SELECT * FROM learning_baselines WHERE site_id='w1'").get();
  assert.equal(row.readiness_score, 41, "the public readiness score at that moment");
  assert.deepEqual(JSON.parse(row.readiness_json).components, { schema: "BAD", llms: "BAD" });
  assert.equal(JSON.parse(row.result_json).answered, 3);
  assert.equal(row.connected_before, 0, "measured before the plugin connected");
  // The budget: the global free row (shared cap), its own ledger reason, one account slot; never the site's own monthly check.
  assert.equal((await readEngineUsage(b.env, GLOBAL_SCOPE, FREE_USAGE_ENGINE)).calls, 3, "counts against the global free budget");
  assert.equal((await readEngineUsage(b.env, "w1", BASELINE_USAGE_ENGINE)).calls, 3, "recorded under the baseline ledger reason");
  assert.equal((await readEngineUsage(b.env, GLOBAL_SCOPE, BASELINE_USAGE_ENGINE)).calls, 3);
  assert.equal((await readEngineUsage(b.env, "w1", FREE_USAGE_ENGINE)).calls, 0, "the site's first monthly free check is untouched");
  assert.equal((await readEngineUsage(b.env, "org:o1", FREE_ACCOUNT_ENGINE)).calls, 1, "one of the account's free slots");
  assert.equal((await runBaseline(b.env, "w1", { loadProfile, diagnose })).already, true, "it never runs twice");
  const event = b.sqlite.prepare("SELECT data_json FROM learning_events WHERE site_id='w1' AND type='baseline_measured'").get();
  assert.equal(JSON.parse(event.data_json).readiness, 41);

  // Anti-abuse and caps: each skipped, with the reason, without an engine call.
  await make("pending", { owner: "m2", org: "o2" });
  await make("old", { created: Date.now() - 9 * DAY });
  await make("pro", { plan: "pro" });
  await make("w2"); await make("w3");
  const calls = pplx;
  const summary = await quiet(() => runBaselineBatch(b.env, { loadProfile, diagnose }));
  const status = (id) => b.sqlite.prepare("SELECT status,reason,readiness_score FROM learning_baselines WHERE site_id=?").get(id);
  assert.equal(status("pending").reason, "owner_not_active", "an unapproved account is not measured");
  assert.equal(status("old").reason, "too_late", "a site added long ago is not a baseline any more");
  assert.equal(status("pro").reason, "not_eligible", "Pro is measured by its plan");
  assert.equal(status("w2").status, "done");
  assert.equal(status("w3").status, "done", "three per account (FREE_SOV_SITES_PER_ACCOUNT)");
  assert.equal(pplx - calls, 6);
  assert.equal(summary.done, 2);
  await make("w4");
  await quiet(() => runBaselineBatch(b.env, { loadProfile, diagnose }));
  assert.deepEqual({ ...status("w4") }, { status: "skipped", reason: "used_up:account", readiness_score: 41 }, "the account's free slots are used up: skipped, readiness still taken");

  // The global free cap.
  const g = setup({ extraEnv: { FREE_SOV_MONTHLY_USD: "0.000001" } });
  g.sqlite.prepare("INSERT INTO sites(id,org_id,url,site_key,install_type,plan,owner_member_id,created_at) VALUES('gx','o1','gx.example','k_gx','wp','free','m1',?)").run(Date.now());
  await scheduleBaseline(g.env, { id: "gx", install_type: "wp" });
  const gcalls = pplx;
  await quiet(() => runBaselineBatch(g.env, { loadProfile, diagnose }));
  assert.equal(g.sqlite.prepare("SELECT reason FROM learning_baselines WHERE site_id='gx'").get().reason, "used_up:global", "the global free budget is respected");
  assert.equal(pplx - gcalls, 0, "and nothing is called");
  // No key: skipped as not configured; before 0049: migration_pending.
  const nk = setup({ extraEnv: { PERPLEXITY_API_KEY: "" } });
  nk.sqlite.prepare("INSERT INTO sites(id,org_id,url,site_key,install_type,plan,owner_member_id,created_at) VALUES('nk','o1','nk.example','k_nk','wp','free','m1',?)").run(Date.now());
  await scheduleBaseline(nk.env, { id: "nk", install_type: "wp" });
  await quiet(() => runBaselineBatch(nk.env, { loadProfile, diagnose }));
  assert.equal(nk.sqlite.prepare("SELECT reason FROM learning_baselines WHERE site_id='nk'").get().reason, "not_configured");
  assert.equal((await runBaselineBatch(setup({ learning: false }).env, { loadProfile, diagnose })).status, "migration_pending");
}

/* ================================================================== *
 * 5. Panels from the database
 * ================================================================== */
{
  const p = setup();
  const T0 = Date.parse("2026-06-01T00:00:00Z");
  p.sqlite.prepare("INSERT INTO sites(id,org_id,url,site_key,install_type,plan,owner_member_id,created_at) VALUES('pa','o1','pa.example','k_pa','wp','pro','m1',?)").run(T0);
  p.sqlite.prepare("INSERT INTO site_settings(site_id,address,business_type_schema,site_type) VALUES('pa','東京都渋谷区神南1-2-3','CafeOrCoffeeShop','local')").run();
  p.sqlite.prepare("INSERT INTO learning_baselines(site_id,status,scheduled_at,measured_at,readiness_score,readiness_json,result_json,connected_before) VALUES('pa','done',?,?,40,'{\"components\":{\"llms\":\"BAD\"}}','{\"engine\":\"perplexity\",\"answered\":3,\"appeared\":0,\"named\":0,\"cited\":0}',0)").run(new Date(T0).toISOString(), new Date(T0 + 3600e3).toISOString());
  await recordServiceEvent(p.env, "pa", "site_connected", { via: "pairing" }, { at: T0 + DAY });
  p.sqlite.prepare("INSERT INTO aeo_sov_runs(id,site_id,ran_at,status,trigger,model_version,answers_received,detail_json) VALUES('r1','pa',?,'measured','scheduled','v',20,?)")
    .run(new Date(T0 + 15 * DAY).toISOString(), JSON.stringify({ by_engine: [{ engine: "perplexity", answers: 10, appearances: 2, citations: 3, appeared: 4 }, { engine: "openai", answers: 10, appearances: 1, citations: 0, appeared: 1 }] }));
  p.sqlite.prepare("INSERT INTO aeo_scores(site_id,scanned_at,score,checks_json) VALUES('pa',?,77,'[]')").run(new Date(T0 + 15 * DAY).toISOString());
  const data = await loadLearningData(p.env, { now: T0 + 30 * DAY });
  const [panel] = buildPanels(data);
  assert.equal(panel.site_type, "local");
  assert.equal(panel.industry, "CafeOrCoffeeShop");
  assert.equal(panel.city, "渋谷区");
  assert.equal(panel.country, "JP");
  assert.equal(panel.plan, "pro");
  assert.equal(panel.baseline.readiness, 40);
  const w0 = panel.weeks[weekOf(T0 + 3600e3)];
  assert.equal(w0.readiness, 40, "the baseline's readiness is the first week's");
  assert.deepEqual(w0.outcomes.perplexity.free, { n: 3, named: 0, cited: 0, appeared: 0 }, "the baseline is a free-family Perplexity measurement");
  assert.ok(panel.measurements.find((m) => m.baseline), "flagged as the baseline");
  const w2 = panel.weeks[weekOf(T0 + 15 * DAY)];
  assert.deepEqual(w2.outcomes.perplexity.sov, { n: 10, named: 2, cited: 3, appeared: 4 }, "Pro SoV per engine");
  assert.deepEqual(w2.outcomes.openai.sov, { n: 10, named: 1, cited: 0, appeared: 1 }, "engines are never pooled");
  assert.equal(w2.readiness, 77);
  assert.ok(panel.weeks[weekOf(T0 + DAY)].events.includes("site_connected"));
  const vol = learningReport([panel], data, { bootstrap: 50 }).volume;
  assert.equal(vol.sites_with_baseline, 1);
  assert.equal(vol.sites_with_2plus_measurements, 1);
  assert.deepEqual(vol.answers_by_engine.perplexity, { answers: 13, own_cited: 3, appeared: 4, named: 2 }, "own-site citations counted separately");
}

/* ================================================================== *
 * 6. The estimator on synthetic data
 * ================================================================== */
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/**
 * N sites, TREATED of which switch llms.txt on at a staggered week; every site
 * is measured weekly (10 Perplexity answers). Own-site citation probability:
 * a site effect + a common drift (engine drift) + EFFECT after the change.
 */
function synthetic({ n = 160, treated = 80, effect = 0.12, seed = 7, weeks = 46 } = {}) {
  const random = rng(seed);
  const binom = (k, p) => { let x = 0; for (let i = 0; i < k; i += 1) if (random() < p) x += 1; return x; };
  const T0 = Date.parse("2026-01-05T00:00:00Z");
  const sites = [], events = [], sov = [];
  for (let i = 0; i < n; i += 1) {
    const id = `s${i}`;
    sites.push({ id, install_type: "wp", plan: "pro", created_at: T0, profile_site_type: i % 2 ? "local" : "ec" });
    events.push({ site_id: id, source: "plugin", type: "snapshot", occurred_at: new Date(T0 + 3600e3).toISOString(), data_json: JSON.stringify({ switches: { llms_txt: false }, installed_days: 400 }) });
    const g = i < treated ? 10 + (i % 20) : null;
    if (g != null) events.push({ site_id: id, source: "plugin", type: "output_toggled", occurred_at: new Date(T0 + g * WEEK + DAY).toISOString(), data_json: JSON.stringify({ switch: "llms_txt", on: true }) });
    const base = 0.05 + 0.3 * random();
    for (let w = 0; w < weeks; w += 1) {
      const p = Math.min(0.95, base + 0.004 * w + (g != null && w >= g ? effect : 0));
      const cited = binom(10, p);
      sov.push({ site_id: id, ran_at: new Date(T0 + w * WEEK + 2 * DAY).toISOString(), status: "measured", detail_json: JSON.stringify({ by_engine: [{ engine: "perplexity", answers: 10, appearances: 0, citations: cited, appeared: cited }] }) });
    }
  }
  return { sites, events, sov, free: [], baselines: [], scores: [], now: T0 + weeks * WEEK };
}
{
  const data = synthetic();
  const panels = buildPanels(data);
  const e = estimateEffect(panels, "llms_txt_enabled", { outcome: "cited", bootstrap: 200 });
  assert.equal(e.status, "estimated");
  assert.ok(e.n.treated >= LEARNING_MIN_TREATED && e.n.controls >= 30, JSON.stringify(e.n));
  assert.ok(e.ci[0] <= 0.12 && 0.12 <= e.ci[1], `the known effect 0.12 is inside the CI ${JSON.stringify(e.ci)} (estimate ${e.estimate})`);
  assert.ok(Math.abs(e.estimate - 0.12) < 0.03, `and the estimate is close (${e.estimate})`);
  assert.ok(e.ci[0] > 0, "the CI excludes zero");
  assert.equal(e.placebo.status, "estimated");
  assert.ok(e.placebo.ci[0] <= 0 && e.placebo.ci[1] >= 0, `the pre-period placebo contains 0 (${JSON.stringify(e.placebo.ci)})`);
  assert.equal(e.event_study.length, 3);
  assert.deepEqual(e.strata, ["site_type", "plan"], "compared within site type and plan (context only)");
  // A null effect: the CI covers zero.
  const nullE = estimateEffect(buildPanels(synthetic({ effect: 0, seed: 11 })), "llms_txt_enabled", { outcome: "cited", bootstrap: 200 });
  assert.ok(nullE.ci[0] <= 0 && nullE.ci[1] >= 0, `no effect -> the CI covers 0 (${JSON.stringify(nullE.ci)})`);
  // Below the gate: no numbers, only counts.
  const small = estimateEffect(buildPanels(synthetic({ n: 60, treated: 20 })), "llms_txt_enabled", { outcome: "cited", bootstrap: 50 });
  assert.equal(small.status, "insufficient_data");
  assert.equal(small.estimate, null);
  assert.equal(small.ci, null);
  assert.ok(small.n.treated < LEARNING_MIN_TREATED && small.n.treated > 0, "with the counts that fell short");
  assert.ok(small.event_study.every((bin) => bin.status === "insufficient_data" && bin.estimate === null));
  // Scope: only levers; context variables only as strata.
  assert.ok(LEARNING_TREATMENTS.every((t) => t.lever === true), "every treatment is something Nurevo can change");
  for (const id of ["llms_txt_enabled", "schema_enabled", "schema_merge_enabled", "crawlers_allowed", "local_facts_completed", "faq_added", "services_added", "products_added", "site_type_set", "one_click_fix", "plugin_updated", "plugin_connected"]) {
    assert.ok(LEARNING_TREATMENTS.some((t) => t.id === id), `${id} is estimated`);
  }
  for (const id of ["plan_changed", "offsite_audit", "plan", "reviews", "google_maps"]) assert.ok(!LEARNING_TREATMENTS.some((t) => t.id === id), `${id} is never a lever`);
  assert.throws(() => estimateEffect(panels, { id: "plan_upgrade", first: () => ({ status: "never" }) }), /not a lever/);
  assert.throws(() => estimateEffect(panels, "llms_txt_enabled", { strata: ["schema"] }), /context/);
  assert.ok(CONTEXT_ONLY.includes("plan") && CONTEXT_ONLY.includes("offsite_audit"));
  // The report: own site cited first, proposals for review only, never applied.
  const report = learningReport(panels, data, { bootstrap: 100, outcomes: ["cited", "appeared"] });
  assert.equal(report.outcomes[0].id, "cited", "own site cited is shown first");
  assert.equal(report.estimates[0].outcome, "cited");
  assert.equal(report.applied, false);
  assert.equal(report.auto_apply, false);
  const proposal = report.proposals.find((x) => x.treatment === "llms_txt_enabled" && x.outcome === "cited");
  assert.ok(proposal && proposal.direction === "raises" && proposal.applied === false, "a proposal for review, not applied");
  assert.ok(report.proposals.every((x) => LEARNING_TREATMENTS.some((t) => t.id === x.treatment)), "proposals only name levers");
  assert.deepEqual(report.scope.context_only, [...CONTEXT_ONLY]);
}

/* ================================================================== *
 * 7. Admin endpoint
 * ================================================================== */
{
  assert.equal((await call("GET", "/api/admin/learning")).status, 403, "an ordinary member is refused");
  const anon = await handleApi(new Request("https://nurevo.jp/api/admin/learning", { headers: { origin: "https://nurevo.jp" } }), env, {});
  assert.equal(anon.status, 403, "no session is refused");
  const res = await member(env, "boss")("GET", "/api/admin/learning?bootstrap=50");
  assert.equal(res.status, 200, "a super admin reads it");
  const body = await res.json();
  assert.equal(body.applied, false);
  assert.equal(body.outcomes[0].id, "cited");
  assert.ok(body.volume.sites >= 1 && body.volume.events_by_type.snapshot === 1);
  assert.ok(body.estimates.every((x) => x.status === "insufficient_data" && x.estimate === null), "one site: insufficient data everywhere");
  assert.equal(body.exploratory_cross_sectional.exploratory, true, "the cross-sectional calibration is labelled exploratory");
  assert.equal(JSON.stringify(body).includes("渋谷"), false);
}

/* ---- the dashboard's Learning screen (super admins only), ja and en ---- */
{
  const report = learningReport(buildPanels(synthetic()), synthetic(), { bootstrap: 50, outcomes: ["cited"] });
  for (const [lang, admin] of [["ja", true], ["en", true], ["en", false]]) {
    const node = (extra = {}) => ({ innerHTML: "", textContent: "", dataset: {}, onclick: null, classList: { add() {}, remove() {} }, ...extra });
    const fields = {};
    const main = node({ querySelector: (sel) => (fields[sel] ||= node()) });
    const nav = [];
    const side = { querySelector: () => null, insertBefore: (el) => nav.push(el) };
    const fetch = async (path) => ({ ok: true, json: async () => (path === "/api/me" ? { is_super_admin: admin } : report) });
    const sandbox = { t: tFor(lang), fetch, JSON, Promise, Number, String, Object, Math,
      document: { documentElement: { lang }, querySelector: (sel) => (sel === "#main" ? main : sel === ".side" ? side : null), createElement: () => node(), querySelectorAll: () => [] } };
    vm.createContext(sandbox);
    vm.runInContext(readFileSync(new URL("../public/dashboard-learning.js", import.meta.url), "utf8"), sandbox);
    for (let i = 0; i < 4; i += 1) await new Promise((r) => setImmediate(r));
    assert.equal(nav.length, admin ? 1 : 0, `${lang}: the Learning nav is for super admins only`);
    if (!admin) continue;
    nav[0].onclick();
    for (let i = 0; i < 6; i += 1) await new Promise((r) => setImmediate(r));
    const html = main.innerHTML + fields["[data-learning-body]"].innerHTML;
    assert.ok(!/undefined|NaN|\bln[A-Z]\w+/.test(html), `${lang}: rendered without placeholders or missing words`);
    assert.ok(html.includes(lang === "ja" ? "自サイトが引用された" : "Own site cited"), `${lang}: own site cited is shown`);
    assert.ok(html.includes(lang === "ja" ? "確認用の提案" : "Proposals for review"));
  }
}

console.log("learning tests passed (ingestion idempotency + auth, no PII, service events, baseline scheduling + caps + ledger, panels, DiD recovers a known effect within the cluster-bootstrap CI and gates small n, levers only, own-site citation first, admin auth)");
