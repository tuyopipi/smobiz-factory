/**
 * Free AI check (worker/free-ai-check.mjs, migration 0045, the
 * /api/sites/:id/sov/free-check endpoint, public/dashboard-free-check.js).
 *
 * Against a real SQLite with the real schema and a stubbed Perplexity; no test
 * reaches the network. Covers:
 *   1. settings, the monthly calendar (due day, next month), who may be checked
 *   2. a check: 3 discovery questions, Perplexity only, per question named /
 *      cited / others, honest summary (no rate)
 *   3. idempotency: once a month, also when two runs race
 *   4. month rollover
 *   5. caps: global and per-site USD, reserved before any call, refunded after;
 *      "used up" with the next date; a cap_reached month can be retried
 *   6. plan gating (Pro never takes this path) and consent / connection
 *   7. separate bucket: free usage never touches Pro's counters, and a Pro
 *      budget at its cap does not stop the free check
 *   8. before 0045 / 0041: migration_pending, nothing called
 *   9. the daily batch: due sites only, spread over the month, stops at the cap
 *  10. the endpoint: auth, CSRF, profile-token POST, site-key GET, 429 when used
 *  11. the dashboard card, per state and language, and the plugin card
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import vm from "node:vm";
import {
  FREE_CHECK_ENGINE, FREE_SOV_MONTHLY_USD_DEFAULT, FREE_SOV_QUESTIONS_DEFAULT, FREE_USAGE_ENGINE, freeCheckConfig, freeCheckDueDate,
  freeCheckDueDay, freeCheckView, nextMonthKey, runFreeCheck, runFreeCheckBatch, siteConnection, summarizeFreeCheck,
} from "../worker/free-ai-check.mjs";
import { GLOBAL_SCOPE, assumedMaxCallCost, planEngineBudget, engineDefinition, readEngineUsage, recordEngineUsage } from "../worker/ai-engines.mjs";
import { buildQuestionSet, sovRemainingBudget } from "../worker/aeo-sov.mjs";
import { handleApi } from "../worker/api.mjs";
import { LANGS, loadDictionary } from "./dashboard-dictionary.mjs";

const sql = (file) => readFileSync(new URL(`../nurevo-impl/db/${file}`, import.meta.url), "utf8");
const sha = (v) => createHash("sha256").update(v).digest("hex");
const T0 = Date.parse("2026-10-20T03:00:00Z");
const NEXT_MONTH = Date.parse("2026-11-02T03:00:00Z");
const quiet = async (fn) => { const log = console.log; console.log = () => {}; try { return await fn(); } finally { console.log = log; } };

const PROFILE = { name: "カフェ栞", businessType: "カフェ", locality: "渋谷区", host: "shop.test", aliases: ["カフェ栞"], language: "ja" };
const loadProfile = async () => PROFILE;

function perplexityBody(text, urls) {
  return {
    model: "openai/gpt-6-luna", status: "completed",
    output: [{ type: "search_results", results: urls.map((url) => ({ url })) }, { type: "message", content: [{ type: "output_text", text }] }],
    usage: { input_tokens: 3000, output_tokens: 400 },
  };
}

/** A stubbed Perplexity: answers name the shop on the first question only. */
function stubEngine() {
  const calls = [];
  const fetchImpl = async (url, init) => {
    assert.ok(String(url).includes("perplexity"), `only Perplexity is called (${url})`);
    const body = JSON.parse(init.body);
    calls.push(body.input);
    const first = calls.length % 3 === 1;
    const text = first
      ? "渋谷区なら **カフェ栞** と **珈琲ライバル** がおすすめです。"
      : "渋谷区では **珈琲ライバル**、**喫茶ミドリ** が人気です。";
    const urls = first ? ["https://shop.test/menu", "https://rival.example.net/", "https://tabelog.com/x"] : ["https://rival.example.net/", "https://midori.example.org/"];
    return new Response(JSON.stringify(perplexityBody(text, urls)), { status: 200, headers: { "content-type": "application/json" } });
  };
  return { calls, fetchImpl };
}

function makeDb({ free = true, usage = true } = {}) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(sql("schema.sql"));
  for (const stmt of ["ALTER TABLE sites ADD COLUMN manual_plan TEXT", "ALTER TABLE orgs ADD COLUMN manual_plan TEXT",
    "ALTER TABLE sites ADD COLUMN bound_at INTEGER", "ALTER TABLE sites ADD COLUMN domain_key TEXT"]) {
    try { sqlite.exec(stmt); } catch { /* already there */ }
  }
  if (!free) sqlite.exec("DROP TABLE aeo_free_checks");
  if (!usage) sqlite.exec("DROP TABLE aeo_sov_engine_usage");
  sqlite.exec(`INSERT INTO orgs(id) VALUES('o1'); INSERT INTO orgs(id) VALUES('o2');
    INSERT INTO members(id,org_id,email,role,status) VALUES('m1','o1','owner@shop.test','admin','active');
    INSERT INTO members(id,org_id,email,role,status) VALUES('m2','o1','viewer@shop.test','viewer','active');
    INSERT INTO members(id,org_id,email,role,status) VALUES('m3','o2','other@else.test','admin','active');
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("owner-token")}','m1','o1','session',${Date.now() + 3.6e6});
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("viewer-token")}','m2','o1','session',${Date.now() + 3.6e6});
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("other-token")}','m3','o2','session',${Date.now() + 3.6e6});
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,owner_member_id,pairing_code_used_at,profile_token_hash,created_at)
      VALUES('s1','o1','shop.test','https://shop.test/','k1','wp','free','m1',1,'${sha("profile-token")}',1);
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,owner_member_id,bound_at,created_at) VALUES('s2','o1','std.test','https://std.test/','k2','wp','standard','m1',1,2);
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,owner_member_id,bound_at,created_at) VALUES('s3','o1','pro.test','https://pro.test/','k3','wp','pro','m1',1,3);
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,owner_member_id,created_at) VALUES('s4','o1','unpaired.test','https://unpaired.test/','k4','wp','free','m1',4);
    INSERT INTO sites(id,org_id,url,site_key,install_type,plan,slug,owner_member_id,created_at) VALUES('s5','o1','','k5','hosted','free','cafe-5','m1',5);
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,tag_detected,created_at) VALUES('s6','o1','tag.test','https://tag.test/','k6','tag','free',1,6);
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,owner_member_id,bound_at,delivery_status,created_at) VALUES('s7','o1','stop.test','https://stop.test/','k7','wp','free','m1',1,'stopped',7);`);
  sqlite.prepare("INSERT INTO site_settings(site_id,name,address,business_type_schema) VALUES(?,?,?,?)").run("s1", "カフェ栞", "東京都渋谷区神宮前1-2-3", "CafeOrCoffeeShop");
  const DB = {
    prepare(text) {
      const wrap = (args) => ({
        async first() { return sqlite.prepare(text).get(...args) || null; },
        async all() { return { results: sqlite.prepare(text).all(...args) }; },
        async run() { return { meta: sqlite.prepare(text).run(...args) }; },
        runSync() { return sqlite.prepare(text).run(...args); },
      });
      return { ...wrap([]), bind: (...args) => wrap(args) };
    },
    async batch(statements) { sqlite.exec("BEGIN"); try { for (const s of statements) s.runSync(); sqlite.exec("COMMIT"); } catch (e) { sqlite.exec("ROLLBACK"); throw e; } },
  };
  return { sqlite, DB };
}

function makeEnv(options = {}, extra = {}) {
  const { sqlite, DB } = makeDb(options);
  const kv = new Map();
  const WEBMCP_KV = { async get(k) { return kv.has(k) ? kv.get(k) : null; }, async put(k, v) { kv.set(k, v); }, async delete(k) { kv.delete(k); } };
  return { sqlite, env: { DB, WEBMCP_KV, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp", PERPLEXITY_API_KEY: "pplx-test", ...extra } };
}
const site = (sqlite, id) => sqlite.prepare("SELECT * FROM sites WHERE id=?").get(id);
const run = (env, row, opts = {}) => quiet(() => runFreeCheck(env, row, { loadProfile, now: T0, ...opts }));

/* ---------------- 1. settings, calendar, who may be checked ---------------- */
{
  const config = freeCheckConfig({});
  assert.equal(config.questions, FREE_SOV_QUESTIONS_DEFAULT);
  assert.equal(config.questions, 3);
  assert.equal(config.globalUsd, FREE_SOV_MONTHLY_USD_DEFAULT);
  assert.equal(config.globalUsd, 20);
  assert.equal(config.siteCalls, 3, "a site gets as many calls a month as questions: each asked once");
  assert.equal(config.usdPerCall, assumedMaxCallCost("perplexity", {}).est_usd, "a call is reserved at its assumed maximum");
  assert.ok(config.reserveUsd > 0 && config.reserveUsd < 0.02, `one check reserves about a cent (${config.reserveUsd})`);
  assert.equal(freeCheckConfig({ FREE_SOV_QUESTIONS: "2" }).questions, 2);
  assert.equal(freeCheckConfig({ FREE_SOV_QUESTIONS: "50" }).questions, 5, "capped at 5");
  assert.equal(freeCheckConfig({ FREE_SOV_QUESTIONS: "0" }).questions, 3, "junk falls back");
  assert.equal(freeCheckConfig({ FREE_SOV_MONTHLY_USD: "0" }).enabled, false, "0 USD switches it off");
  assert.equal(freeCheckConfig({ FREE_SOV_SITE_MONTHLY_USD: "0" }).enabled, false);

  for (const id of ["s1", "abc", "site-xyz-123"]) {
    const day = freeCheckDueDay(id);
    assert.ok(day >= 1 && day <= 28, "due day is 1-28, so it exists in every month");
    assert.equal(freeCheckDueDay(id), day, "stable");
  }
  const days = new Set(Array.from({ length: 400 }, (_, i) => freeCheckDueDay(`site-${i}`)));
  assert.ok(days.size >= 25, "sites spread over the month");
  assert.equal(nextMonthKey("2026-10"), "2026-11");
  assert.equal(nextMonthKey("2026-12"), "2027-01");
  assert.match(freeCheckDueDate("s1", "2026-11"), /^2026-11-\d\d$/);

  assert.deepEqual(siteConnection({ id: "a", install_type: "wp" }), { connected: false, consent: false, reason: "not_paired", via: null });
  assert.equal(siteConnection({ id: "a", install_type: "wp", pairing_code_used_at: 1 }).consent, true, "pairing is the plugin's consent");
  assert.equal(siteConnection({ id: "a", install_type: "wp", bound_at: 1 }).connected, true);
  assert.equal(siteConnection({ id: "a", install_type: "wp", bound_at: 1, delivery_status: "stopped" }).connected, false);
  assert.equal(siteConnection({ id: "a", install_type: "tag", owner_member_id: "m" }).connected, false, "a tag not yet seen");
  assert.deepEqual(siteConnection({ id: "a", install_type: "tag", tag_detected: 1 }).consent, false, "no registered owner, no consent");
  assert.equal(siteConnection({ id: "a", install_type: "tag", tag_detected: 1, owner_member_id: "m" }).consent, true);
  assert.equal(siteConnection({ id: "a", install_type: "hosted", owner_member_id: "m" }).connected, true);
}

/* ---------------- 2. one check ---------------- */
{
  const { sqlite, env } = makeEnv();
  const engine = stubEngine();
  const outcome = await run(env, site(sqlite, "s1"), { fetchImpl: engine.fetchImpl });
  assert.equal(outcome.status, "done");
  assert.equal(engine.calls.length, 3, "three questions, each asked once");
  assert.deepEqual(engine.calls, buildQuestionSet(PROFILE, 3), "the Pro builder's first three discovery questions");
  assert.ok(engine.calls.every((q) => !q.includes("カフェ栞")), "non-branded: the name is never in the question");
  const result = outcome.result;
  assert.equal(result.asked, 3);
  assert.equal(result.answered, 3);
  assert.equal(result.appeared, 1);
  assert.deepEqual(result.questions.map((q) => [q.named, q.cited]), [[true, true], [false, false], [false, false]]);
  assert.ok(!("appearance_rate" in result), "three answers are not a rate");
  const first = result.questions[0].others.map((o) => o.label);
  assert.ok(first.includes("珈琲ライバル") && first.includes("rival.example.net"), "others: names and domains");
  assert.ok(!first.includes("カフェ栞") && !first.includes("shop.test"), "never the business itself");
  assert.ok(!first.includes("tabelog.com"), "aggregators are not competitors");
  assert.ok(result.questions.every((q) => q.others.length <= 3), "top few per question");
  assert.equal(result.competitors[0].label, "珈琲ライバル", "the one named most comes first");
  assert.equal(result.competitors[0].count, 3);
  assert.ok(result.competitors.length <= 5);

  // The ledger: free bucket only, trued up to the reported cost.
  const siteUse = await readEngineUsage(env, "s1", FREE_USAGE_ENGINE, T0);
  const all = await readEngineUsage(env, GLOBAL_SCOPE, FREE_USAGE_ENGINE, T0);
  assert.equal(siteUse.calls, 3);
  assert.equal(all.calls, 3);
  assert.ok(Math.abs(siteUse.est_cost_usd - result.est_cost_usd) < 1e-6, "reservation trued up to the estimate");
  assert.ok(result.est_cost_usd < freeCheckConfig({}).reserveUsd, "the actual estimate is below the reservation");
  const row = sqlite.prepare("SELECT * FROM aeo_free_checks WHERE site_id='s1'").get();
  assert.equal(row.month, "2026-10");
  assert.equal(row.status, "done");
  assert.equal(row.trigger, "manual");

  // 7. Nothing of Pro's moved.
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM aeo_sov_usage").get().n, 0, "aeo_sov_usage untouched");
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM aeo_sov_engine_usage WHERE engine='perplexity'").get().n, 0, "Pro's perplexity rows untouched");
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM aeo_sov_runs").get().n, 0, "no Pro run stored");
  const proPlan = await planEngineBudget(env, "s1", engineDefinition("perplexity"), { perRunMax: 40, perplexitySite: await sovRemainingBudget(env, "s1", T0), now: T0 });
  assert.equal(proPlan.status, "ready");
  assert.equal(proPlan.global.used, 0, "Pro's global Perplexity count is unaffected by free checks");
  assert.equal(proPlan.global.usd_used, 0);

  // The view after the run.
  const view = await freeCheckView(env, site(sqlite, "s1"), { now: T0 });
  assert.equal(view.status, "done");
  assert.equal(view.can_run_now, false);
  assert.equal(view.next_check_on, freeCheckDueDate("s1", "2026-11"));
  assert.equal(view.result.appeared, 1);
  assert.equal(view.upsell.plan, "pro");

  /* ---------------- 3. idempotency ---------------- */
  const again = await run(env, site(sqlite, "s1"), { fetchImpl: engine.fetchImpl, trigger: "scheduled" });
  assert.equal(again.status, "already_checked");
  assert.equal(engine.calls.length, 3, "no second call this month");

  /* ---------------- 4. month rollover ---------------- */
  const next = await run(env, site(sqlite, "s1"), { fetchImpl: engine.fetchImpl, now: NEXT_MONTH });
  assert.equal(next.status, "done", "a new month, a new check");
  assert.equal(engine.calls.length, 6);
  assert.equal((await readEngineUsage(env, "s1", FREE_USAGE_ENGINE, NEXT_MONTH)).calls, 3, "the new month has its own ledger row");
  assert.equal((await readEngineUsage(env, "s1", FREE_USAGE_ENGINE, T0)).calls, 3, "and October's is unchanged");
  const nov = await freeCheckView(env, site(sqlite, "s1"), { now: NEXT_MONTH });
  assert.equal(nov.status, "done");
  assert.equal(nov.result.month, "2026-11");
  // Before December's due day, December shows November's result and the date.
  const dec = await freeCheckView(env, site(sqlite, "s1"), { now: Date.parse("2026-12-01T00:00:00Z") });
  assert.equal(dec.status, "scheduled");
  assert.equal(dec.can_run_now, true);
  assert.equal(dec.result.month, "2026-11", "last month's result stays visible");
  assert.ok(dec.scheduled_on >= "2026-12-01");
}

/* ---------------- 3b. two runs racing for the same month ---------------- */
{
  const { sqlite, env } = makeEnv();
  const engine = stubEngine();
  const [a, b] = await Promise.all([run(env, site(sqlite, "s1"), { fetchImpl: engine.fetchImpl }), run(env, site(sqlite, "s1"), { fetchImpl: engine.fetchImpl, trigger: "scheduled" })]);
  const other = [a, b].find((o) => o.status !== "done");
  assert.ok(other && ["running", "already_checked"].includes(other.status), `the loser sees the claim (${other?.status})`);
  assert.equal([a, b].filter((o) => o.status === "done").length, 1, "exactly one ran");
  assert.equal(engine.calls.length, 3, "and only one set of calls");
}

/* ---------------- 5. caps ---------------- */
{
  const per = freeCheckConfig({}).reserveUsd;
  // Room for exactly one check in the whole deployment.
  const { sqlite, env } = makeEnv({}, { FREE_SOV_MONTHLY_USD: String(per * 1.5) });
  const engine = stubEngine();
  assert.equal((await run(env, site(sqlite, "s1"), { fetchImpl: engine.fetchImpl })).status, "done");
  // The true-up gave back the unused part, but not enough for a full reservation.
  const second = await run(env, site(sqlite, "s2"), { fetchImpl: engine.fetchImpl });
  assert.equal(second.status, "used_up");
  assert.equal(second.scope, "global");
  assert.equal(engine.calls.length, 3, "no call once the global cap is reached");
  const view = await freeCheckView(env, site(sqlite, "s2"), { now: T0 });
  assert.equal(view.status, "used_up", "the UI says this month's free checks are used up");
  assert.equal(view.can_run_now, false);
  assert.equal(view.next_check_on, freeCheckDueDate("s2", "2026-11"), "and when the next one is");
  // The global row never passes the cap.
  const all = await readEngineUsage(env, GLOBAL_SCOPE, FREE_USAGE_ENGINE, T0);
  assert.ok(all.est_cost_usd <= per * 1.5 + 1e-6);

  // Reserved atomically: with room for one, two sites racing get one check.
  const race = makeEnv({}, { FREE_SOV_MONTHLY_USD: String(per * 1.5) });
  const raceEngine = stubEngine();
  const outcomes = await Promise.all(["s1", "s2"].map((id) => run(race.env, site(race.sqlite, id), { fetchImpl: raceEngine.fetchImpl })));
  assert.equal(outcomes.filter((o) => o.status === "done").length, 1, "only one fits");
  assert.equal(raceEngine.calls.length, 3);
  const loser = outcomes.find((o) => o.status !== "done");
  assert.equal(loser.status, "used_up");
  // A month left at cap_reached is retried once the cap allows it.
  const loserId = outcomes[0].status === "done" ? "s2" : "s1";
  const stored = race.sqlite.prepare("SELECT status FROM aeo_free_checks WHERE site_id=?").get(loserId);
  assert.ok(!stored || stored.status === "cap_reached", "nothing called, so the month is not spent");
  race.env.FREE_SOV_MONTHLY_USD = "20";
  assert.equal((await run(race.env, site(race.sqlite, loserId), { fetchImpl: raceEngine.fetchImpl })).status, "done", "raised cap: the month can run");
  assert.equal(raceEngine.calls.length, 6);

  // The per-site cap: a site cap below one reservation means no call at all.
  const tight = makeEnv({}, { FREE_SOV_SITE_MONTHLY_USD: String(per / 2) });
  const tightEngine = stubEngine();
  const blocked = await run(tight.env, site(tight.sqlite, "s1"), { fetchImpl: tightEngine.fetchImpl });
  assert.equal(blocked.status, "used_up");
  assert.equal(blocked.scope, "site");
  assert.equal(tightEngine.calls.length, 0);
  assert.equal((await readEngineUsage(tight.env, GLOBAL_SCOPE, FREE_USAGE_ENGINE, T0)).calls, 0, "nothing reserved globally either");

  // Switched off: nothing.
  const off = makeEnv({}, { FREE_SOV_MONTHLY_USD: "0" });
  assert.equal((await run(off.env, site(off.sqlite, "s1"), { fetchImpl: tightEngine.fetchImpl })).status, "disabled");
  assert.equal((await freeCheckView(off.env, site(off.sqlite, "s1"), { now: T0 })).status, "disabled");
  assert.equal(tightEngine.calls.length, 0);
}

/* ---------------- 6. plan gating, connection and consent ---------------- */
{
  const { sqlite, env } = makeEnv();
  const engine = stubEngine();
  const pro = await run(env, site(sqlite, "s3"), { fetchImpl: engine.fetchImpl });
  assert.equal(pro.status, "pro", "Pro keeps the full measurement");
  assert.equal((await freeCheckView(env, site(sqlite, "s3"), { now: T0 })).status, "pro");
  // A comp to Pro on the org counts as Pro too.
  sqlite.exec("UPDATE orgs SET manual_plan='pro' WHERE id='o1'");
  assert.equal((await run(env, { ...site(sqlite, "s1"), org_manual_plan: "pro" }, { fetchImpl: engine.fetchImpl })).status, "pro");
  sqlite.exec("UPDATE orgs SET manual_plan=NULL WHERE id='o1'");
  assert.equal((await run(env, site(sqlite, "s4"), { fetchImpl: engine.fetchImpl })).status, "not_connected", "an unpaired plugin");
  assert.equal((await run(env, site(sqlite, "s6"), { fetchImpl: engine.fetchImpl })).status, "consent_required", "a tag with no registered owner");
  assert.equal((await run(env, site(sqlite, "s7"), { fetchImpl: engine.fetchImpl })).status, "not_connected", "a stopped site");
  assert.equal((await freeCheckView(env, site(sqlite, "s4"), { now: T0 })).status, "not_connected");
  assert.equal(engine.calls.length, 0, "none of these called anything");
  // Standard is eligible.
  assert.equal((await run(env, site(sqlite, "s2"), { fetchImpl: engine.fetchImpl })).status, "done");
  // No key: not configured, nothing sent.
  const nokey = makeEnv({}, { PERPLEXITY_API_KEY: "" });
  assert.equal((await run(nokey.env, site(nokey.sqlite, "s1"), { fetchImpl: engine.fetchImpl })).status, "not_configured");
  assert.equal(engine.calls.length, 3);
}

/* ---------------- 7b. Pro at its cap does not stop the free check, and vice versa ---------------- */
{
  const { sqlite, env } = makeEnv();
  const engine = stubEngine();
  // Pro's global Perplexity bucket is spent.
  await recordEngineUsage(env, "s3", "perplexity", { calls: 6000, estCostUsd: 150 }, T0);
  assert.equal((await run(env, site(sqlite, "s1"), { fetchImpl: engine.fetchImpl })).status, "done");
  // The free bucket is spent; Pro still plans normally.
  await recordEngineUsage(env, "s9", FREE_USAGE_ENGINE, { calls: 100000, estCostUsd: 1000 }, T0);
  const fresh = makeEnv();
  await recordEngineUsage(fresh.env, "s9", FREE_USAGE_ENGINE, { calls: 100000, estCostUsd: 1000 }, T0);
  const proPlan = await planEngineBudget(fresh.env, "s3", engineDefinition("perplexity"), { perRunMax: 40, perplexitySite: await sovRemainingBudget(fresh.env, "s3", T0), now: T0 });
  assert.equal(proPlan.status, "ready", "Pro's budget ignores the free bucket");
  assert.equal(proPlan.global.usd_used, 0);
}

/* ---------------- 8. before the migrations ---------------- */
{
  const engine = stubEngine();
  const before = makeEnv({ free: false });
  assert.equal((await run(before.env, site(before.sqlite, "s1"), { fetchImpl: engine.fetchImpl })).status, "migration_pending");
  assert.equal((await freeCheckView(before.env, site(before.sqlite, "s1"), { now: T0 })).status, "migration_pending");
  assert.equal((await quiet(() => runFreeCheckBatch(before.env, { loadProfile, now: T0, fetchImpl: engine.fetchImpl }))).status, "migration_pending");
  const noLedger = makeEnv({ usage: false });
  assert.equal((await run(noLedger.env, site(noLedger.sqlite, "s1"), { fetchImpl: engine.fetchImpl })).status, "migration_pending");
  assert.equal((await quiet(() => runFreeCheckBatch(noLedger.env, { loadProfile, now: T0, fetchImpl: engine.fetchImpl }))).status, "migration_pending");
  assert.equal(engine.calls.length, 0, "nothing called before the tables exist");
}

/* ---------------- 9. the daily batch ---------------- */
{
  const { sqlite, env } = makeEnv();
  const engine = stubEngine();
  // On the 28th every eligible site is due; Pro, unpaired, no-owner and stopped are not.
  const lastDay = Date.parse("2026-10-28T19:37:00Z");
  const summary = await quiet(() => runFreeCheckBatch(env, { loadProfile, now: lastDay, fetchImpl: engine.fetchImpl }));
  assert.equal(summary.status, "checked");
  assert.equal(summary.checked, 3, "s1, s2 and the hosted s5");
  assert.equal(engine.calls.length, 9);
  const checked = sqlite.prepare("SELECT site_id,trigger FROM aeo_free_checks ORDER BY site_id").all().map((r) => `${r.site_id}:${r.trigger}`);
  assert.deepEqual(checked, ["s1:scheduled", "s2:scheduled", "s5:scheduled"]);
  // A second run the same day finds nothing to do.
  const again = await quiet(() => runFreeCheckBatch(env, { loadProfile, now: lastDay, fetchImpl: engine.fetchImpl }));
  assert.equal(again.checked, 0);
  assert.equal(engine.calls.length, 9);

  // On the 1st only the sites whose day is 1 are due: spread over the month.
  const early = makeEnv();
  const earlyEngine = stubEngine();
  const firstDay = await quiet(() => runFreeCheckBatch(early.env, { loadProfile, now: Date.parse("2026-10-01T19:37:00Z"), fetchImpl: earlyEngine.fetchImpl }));
  const dueOnFirst = ["s1", "s2", "s5"].filter((id) => freeCheckDueDay(id) <= 1).length;
  assert.equal(firstDay.checked, dueOnFirst);
  assert.equal(firstDay.candidates, 3);

  // The batch stops at the global cap.
  const per = freeCheckConfig({}).reserveUsd;
  const capped = makeEnv({}, { FREE_SOV_MONTHLY_USD: String(per * 1.5) });
  const cappedEngine = stubEngine();
  const out = await quiet(() => runFreeCheckBatch(capped.env, { loadProfile, now: lastDay, fetchImpl: cappedEngine.fetchImpl }));
  assert.equal(out.checked, 1);
  assert.equal(out.used_up, true);
  assert.equal(cappedEngine.calls.length, 3);
  const after = await quiet(() => runFreeCheckBatch(capped.env, { loadProfile, now: lastDay + 86400e3, fetchImpl: cappedEngine.fetchImpl }));
  assert.equal(after.status, "used_up", "once spent, the batch does not even look at sites");
  assert.equal(cappedEngine.calls.length, 3);
}

/* ---------------- 10. the endpoint ---------------- */
{
  const { sqlite, env } = makeEnv();
  const engine = stubEngine();
  const realFetch = globalThis.fetch;
  // The profile builder reads the site's page for schema; serve a page, and
  // send the engine call to the stub. Anything else fails the test.
  globalThis.fetch = async (url, init) => {
    if (String(url).includes("perplexity")) return engine.fetchImpl(url, init);
    if (/^https:\/\/(shop|std)\.test\//.test(String(url))) return new Response("<html><head></head><body>カフェ栞</body></html>", { status: 200, headers: { "content-type": "text/html" } });
    throw new Error(`unexpected fetch ${url}`);
  };
  try {
    const CSRF = "c".repeat(64);
    const call = (method, { token = "owner-token", csrf = true, siteId = "s1", headers = {}, query = "" } = {}) => quiet(() => handleApi(new Request(`https://nurevo.jp/api/sites/${siteId}/sov/free-check${query}`, {
      method,
      headers: token ? { cookie: `nrv_session=${token}; nrv_csrf=${CSRF}`, origin: "https://nurevo.jp", ...(csrf ? { "x-csrf-token": CSRF } : {}), ...headers } : headers,
    }), env, { waitUntil() {} }));
    assert.equal((await call("GET", { token: null })).status, 401);
    const get = await call("GET");
    assert.equal(get.status, 200);
    const view = (await get.json()).free_check;
    assert.equal(view.status, "scheduled");
    assert.equal(view.can_run_now, true);
    assert.equal(engine.calls.length, 0, "GET never calls an engine");
    assert.equal((await call("GET", { token: "other-token" })).status, 403);
    assert.equal((await call("GET", { siteId: "nope" })).status, 404);
    assert.equal((await call("GET", { siteId: "s3" }).then((r) => r.json())).free_check.status, "pro");
    assert.equal((await call("POST", { csrf: false })).status, 403, "a session POST needs the CSRF token");
    assert.equal((await call("POST", { token: "viewer-token" })).status, 403, "a viewer cannot spend the check");
    assert.ok([401, 403].includes((await call("POST", { token: null, query: "?site_key=k1" })).status), "the public site key cannot start a run");
    assert.equal(engine.calls.length, 0);
    const post = await call("POST");
    assert.equal(post.status, 200);
    const ran = await post.json();
    assert.equal(ran.outcome, "done");
    assert.equal(ran.free_check.status, "done");
    assert.equal(engine.calls.length, 3);
    const used = await call("POST");
    assert.equal(used.status, 429, "once a month");
    assert.equal((await used.json()).free_check.next_check_on, freeCheckDueDate("s1", nextMonthKey(new Date().toISOString().slice(0, 7))));
    assert.equal(engine.calls.length, 3);

    // The plugin: GET with the site key, POST with the profile token.
    const byKey = await call("GET", { token: null, query: "?site_key=k1" });
    assert.equal(byKey.status, 200);
    assert.equal((await byKey.json()).free_check.status, "done");
    assert.equal((await call("GET", { token: null, query: "?site_key=k2" })).status, 404, "a key only reads its own site");
    assert.equal((await call("POST", { token: null, headers: { authorization: "Bearer wrong" } })).status, 403);
    const bearer = await call("POST", { token: null, headers: { authorization: "Bearer profile-token" } });
    assert.equal(bearer.status, 429, "the profile token reaches the same once-a-month gate");
  } finally {
    globalThis.fetch = realFetch;
  }
}

/* ---------------- 11. the dashboard card and the plugin card ---------------- */
{
  const read = (file) => readFileSync(new URL(`../public/${file}`, import.meta.url), "utf8");
  const SRC = read("dashboard-free-check.js");
  const html = read("dashboard.html");
  assert.ok(html.includes('<script src="/dashboard-free-check.js'), "the dashboard loads the card");
  const { I } = loadDictionary();
  const htmlEsc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function render(state, lang) {
    const sandbox = {
      t: (k) => (I[lang] || I.ja)[k] || I.ja[k] || k,
      document: { createElement: () => ({ className: "", innerHTML: "", addEventListener() {}, querySelector: () => null }), querySelector: () => null, addEventListener() {}, head: { appendChild() {} }, documentElement: { lang } },
      MutationObserver: class { observe() {} }, setTimeout() {},
      fetch: async () => { throw new Error("render only"); },
      Number, Math, String, Date, JSON, Array, Object, console,
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(SRC.replace(/\}\)\(\);\s*$/, "  window.__card = card;\n})();"), sandbox);
    return sandbox.window.__card(state).innerHTML;
  }
  const RESULT = {
    month: "2026-10", checked_at: "2026-10-20T03:00:00.000Z", asked: 3, answered: 3, appeared: 1,
    questions: [
      { question: "渋谷区のカフェでおすすめはどこ？", answered: true, named: true, cited: true, others: [{ label: "珈琲ライバル", kind: "name" }] },
      { question: "q2", answered: true, named: false, cited: false, others: [] },
      { question: "q3", answered: false, named: false, cited: false, others: [], error: "perplexity_http_500" },
    ],
    competitors: [{ label: "珈琲ライバル", kind: "name", count: 3 }, { label: "rival.example.net", kind: "domain", count: 2 }],
  };
  const base = { plan: "free", engine_label: "Perplexity", questions_per_check: 3, upsell: { plan: "pro", details_url: "https://nurevo.jp/#pro-detail" } };
  const states = {
    done: { ...base, status: "done", result: RESULT, next_check_on: "2026-11-09" },
    used_up: { ...base, status: "used_up", scope: "global", next_check_on: "2026-11-09" },
    scheduled: { ...base, status: "scheduled", can_run_now: true, scheduled_on: "2026-10-25", result: null },
    running: { ...base, status: "running" },
    failed: { ...base, status: "failed", result: { ...RESULT, answered: 0, appeared: 0 }, next_check_on: "2026-11-09" },
    not_connected: { ...base, status: "not_connected" },
    migration_pending: { ...base, status: "migration_pending" },
    not_configured: { ...base, status: "not_configured" },
  };
  for (const lang of LANGS) {
    for (const [name, state] of Object.entries(states)) {
      const out = render(state, lang);
      assert.ok(!/\bfc[A-Z]\w*\b/.test(out.replace(/class="[^"]*"/g, "").replace(/data-[\w-]+/g, "")), `${lang}/${name}: no raw key (${out.slice(0, 200)})`);
      assert.ok(!/\{\w+\}/.test(out), `${lang}/${name}: placeholders filled`);
      assert.ok(out.includes(htmlEsc(I[lang].fcHeading)), `${lang}/${name}: heading`);
    }
    const usedUp = render(states.used_up, lang);
    assert.ok(usedUp.includes(htmlEsc(I[lang].fcUsedUp.split("{date}")[0])), `${lang}: the used-up message`);
    assert.ok(!usedUp.includes("data-fc-run"), `${lang}: no run button when used up`);
    const done = render(states.done, lang);
    assert.ok(done.includes("珈琲ライバル") && done.includes("rival.example.net"), "competitors shown");
    assert.ok(done.includes(htmlEsc(I[lang].fcNotice)), `${lang}: the variability notice`);
    assert.ok(done.includes(htmlEsc(I[lang].fcUpsell)), `${lang}: the Pro upsell line`);
    assert.ok(!/\d+(\.\d+)?%/.test(done), `${lang}: no percentage from three answers`);
    assert.ok(render(states.scheduled, lang).includes("data-fc-run"), `${lang}: run now while the month is unused`);
  }
  assert.ok(render(states.used_up, "en").includes("This month&#39;s free checks are used up. Next check on"));
  const esc = render({ ...states.done, result: { ...RESULT, competitors: [{ label: "<img src=x onerror=alert(1)>", kind: "name", count: 1 }] } }, "en");
  assert.ok(!esc.includes("<img"), "names from answers are escaped");

  // The plugin card: the strings are translatable and the endpoint is the free-check one.
  const php = readFileSync(new URL("../wordpress-plugin/webmcp-canary/nurevo-webmcp.php", import.meta.url), "utf8");
  assert.ok(php.includes("/sov/free-check"), "the plugin reads the free-check endpoint");
  assert.ok(/function webmcp_canary_free_check_card\(/.test(php));
  const cardBody = php.slice(php.indexOf("function webmcp_canary_free_check_card("), php.indexOf("\n}\n", php.indexOf("function webmcp_canary_free_check_card(")));
  assert.ok(cardBody.includes("This month\\'s free checks are used up. Next check on %s."), "the plugin says when the next check is");
  assert.ok(php.includes("'authorization' => 'Bearer ' . $settings['profile_token']") , "the plugin's run uses the profile token");
}

console.log("free AI check tests passed (settings, calendar, connection/consent, one check, idempotency, race, rollover, caps, Pro isolation, migrations, batch, endpoint, dashboard and plugin cards)");
