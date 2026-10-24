/**
 * Regression: one free account must not be able to spend the global free AI
 * check budget by opening many hosted sites (review of PR #34).
 *
 * Built from the reviewer's repro (repro-free-check-sites.mjs): a member adds
 * ten hosted sites through POST /api/sites and asks for the free check on each.
 * Before the fix every site ran its own check (30 Perplexity calls on the
 * shared budget). Now:
 *   1. a hosted site is only checked once it is published with a complete
 *      profile (name + address or website) and at least 24 hours old;
 *   2. the Free-plan sites of one account get FREE_SOV_SITES_PER_ACCOUNT
 *      (default 3) checks a month between them; Standard sites are not
 *      counted against it;
 *   3. adding sites is limited per member per day (SITE_CREATE_DAILY_LIMIT,
 *      default 20) with a clear error;
 *   4. a deleted site never runs, its rows go with it, and deleting does not
 *      give the account's slot back.
 * Real SQLite with the real schema; Perplexity is stubbed, nothing reaches the
 * network.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { handleApi, siteCreateLimit } from "../worker/api.mjs";
import { FREE_ACCOUNT_ENGINE, FREE_USAGE_ENGINE, runFreeCheck, runFreeCheckBatch } from "../worker/free-ai-check.mjs";
import { GLOBAL_SCOPE, readEngineUsage } from "../worker/ai-engines.mjs";

const sql = (f) => readFileSync(new URL(`../nurevo-impl/db/${f}`, import.meta.url), "utf8");
const sha = (v) => createHash("sha256").update(v).digest("hex");
const DAY = 86400e3;

function setup(extraEnv = {}) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(sql("schema.sql"));
  for (const s of ["ALTER TABLE sites ADD COLUMN manual_plan TEXT", "ALTER TABLE orgs ADD COLUMN manual_plan TEXT", "ALTER TABLE sites ADD COLUMN bound_at INTEGER", "ALTER TABLE sites ADD COLUMN domain_key TEXT"]) { try { sqlite.exec(s); } catch { /* present */ } }
  sqlite.exec(`INSERT INTO orgs(id) VALUES('o1'); INSERT INTO orgs(id) VALUES('o2');
    INSERT INTO members(id,org_id,email,role,status) VALUES('m1','o1','attacker@x.test','admin','active');
    INSERT INTO members(id,org_id,email,role,status) VALUES('m2','o2','other@y.test','admin','active');
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("t")}','m1','o1','session',${Date.now() + 3.6e6});
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("t2")}','m2','o2','session',${Date.now() + 3.6e6});`);
  const DB = {
    prepare(text) {
      const w = (a) => ({ async first() { return sqlite.prepare(text).get(...a) || null; }, async all() { return { results: sqlite.prepare(text).all(...a) }; }, async run() { return { meta: sqlite.prepare(text).run(...a) }; }, runSync() { return sqlite.prepare(text).run(...a); } });
      return { ...w([]), bind: (...a) => w(a) };
    },
    async batch(st) { sqlite.exec("BEGIN"); try { for (const s of st) s.runSync(); sqlite.exec("COMMIT"); } catch (e) { sqlite.exec("ROLLBACK"); throw e; } },
  };
  const kv = new Map();
  const env = { DB, WEBMCP_KV: { async get(k) { return kv.get(k) ?? null; }, async put(k, v) { kv.set(k, v); } }, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp", PERPLEXITY_API_KEY: "pplx-test", ...extraEnv };
  return { sqlite, env };
}

let pplx = 0;
globalThis.fetch = async (url) => {
  const u = String(url?.url || url);
  if (u.includes("perplexity")) { pplx += 1; return Response.json({ model: "m", status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: "Try **Cafe A**." }] }], usage: { input_tokens: 3000, output_tokens: 400 } }); }
  return new Response("", { status: 404 });
};
const CSRF = "c".repeat(64);
const caller = (env, token = "t") => (method, path, body) => handleApi(new Request(`https://nurevo.jp${path}`, { method, headers: { cookie: `nrv_session=${token}; nrv_csrf=${CSRF}`, origin: "https://nurevo.jp", "x-csrf-token": CSRF, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined }), env, {});
const REAL_LOG = console.log;
const quiet = async (fn) => { console.log = () => {}; try { return await fn(); } finally { console.log = REAL_LOG; } };

/* ---- 1. the reviewer's repro: ten fresh hosted sites, no checks ---- */
const { sqlite, env } = setup();
const call = caller(env);
const N = 10;
const ids = [];
await quiet(async () => {
  for (let i = 0; i < N; i += 1) {
    const r = await call("POST", "/api/sites", { install_type: "hosted", name: `Cafe ${i}`, business_type: "CafeOrCoffeeShop" });
    assert.equal(r.status, 200, `site ${i} created`);
    ids.push((await r.json()).id);
  }
});
const fresh = [];
await quiet(async () => {
  for (const id of ids) {
    const f = await call("POST", `/api/sites/${id}/sov/free-check`);
    const body = await f.json();
    fresh.push(body.outcome);
    assert.equal(body.free_check.reason, "profile_incomplete", "a name alone is not a complete profile");
  }
});
assert.deepEqual([...new Set(fresh)], ["not_connected"], `fresh, incomplete hosted pages are not checked (${fresh})`);
assert.equal(pplx, 0, "no Perplexity call for fresh hosted pages");

// Complete the profile: still too new.
for (const id of ids) sqlite.prepare("UPDATE site_settings SET address='東京都渋谷区1-1' WHERE site_id=?").run(id);
await quiet(async () => {
  const r = await (await call("POST", `/api/sites/${ids[0]}/sov/free-check`)).json();
  assert.equal(r.outcome, "not_connected");
  assert.equal(r.free_check.reason, "too_new", "under 24 hours old");
});
assert.equal(pplx, 0);

/* ---- 2. a day later: three checks for the account, the rest used up ---- */
for (const id of ids) sqlite.prepare("UPDATE sites SET created_at=? WHERE id=?").run(Date.now() - 2 * DAY, id);
const outcomes = [];
await quiet(async () => {
  for (const id of ids) {
    const r = await (await call("POST", `/api/sites/${id}/sov/free-check`)).json();
    outcomes.push(`${r.outcome}${r.scope ? `:${r.scope}` : ""}`);
  }
});
assert.equal(outcomes.filter((o) => o === "done").length, 3, `three per account (${outcomes})`);
assert.equal(outcomes.filter((o) => o === "used_up:account").length, N - 3, "the rest: the account's monthly checks are used up");
assert.equal(pplx, 9, "3 sites x 3 questions, not 30");
const global = await readEngineUsage(env, GLOBAL_SCOPE, FREE_USAGE_ENGINE);
assert.equal(global.calls, 9, "the global ledger holds only the account's three checks");
assert.equal((await readEngineUsage(env, "org:o1", FREE_ACCOUNT_ENGINE)).calls, 3);
// The dashboard view says why, and gives no run button.
await quiet(async () => {
  const view = (await (await call("GET", `/api/sites/${ids[9]}/sov/free-check`)).json()).free_check;
  assert.equal(view.status, "used_up");
  assert.equal(view.scope, "account");
  assert.equal(view.account_cap, 3);
  assert.equal(view.can_run_now, false);
});

/* ---- 3. the batch respects the same account cap ---- */
{
  const batchSetup = setup();
  for (let i = 0; i < 6; i += 1) {
    batchSetup.sqlite.prepare("INSERT INTO sites(id,org_id,url,site_key,install_type,plan,slug,owner_member_id,created_at) VALUES(?,?,?,?,?,?,?,?,?)")
      .run(`h${i}`, "o1", "", `kh${i}`, "hosted", "free", `cafe-h${i}`, "m1", Date.now() - 3 * DAY);
    batchSetup.sqlite.prepare("INSERT INTO site_settings(site_id,name,address) VALUES(?,?,?)").run(`h${i}`, `Cafe ${i}`, "Tokyo");
  }
  const before = pplx;
  const loadProfile = async () => ({ name: "Cafe", businessType: "カフェ", locality: "渋谷区", host: "", aliases: ["Cafe"], language: "ja" });
  const summary = await quiet(() => runFreeCheckBatch(batchSetup.env, { loadProfile, now: Date.parse("2026-10-28T19:37:00Z") }));
  assert.equal(summary.checked, 3, "the batch checks three of the account's six Free sites");
  assert.equal(summary.skipped, 3);
  assert.equal(pplx - before, 9);
}

/* ---- 4. Standard sites are not limited by the account cap ---- */
{
  const std = setup();
  for (let i = 0; i < 5; i += 1) {
    std.sqlite.prepare("INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,owner_member_id,bound_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)")
      .run(`w${i}`, "o1", `w${i}.test`, `https://w${i}.test/`, `kw${i}`, "wp", i < 4 ? "standard" : "free", "m1", 1, 1);
  }
  const loadProfile = async () => ({ name: "Shop", businessType: "カフェ", locality: "渋谷区", host: "w.test", aliases: ["Shop"], language: "ja" });
  const res = [];
  for (let i = 0; i < 5; i += 1) res.push((await quiet(() => runFreeCheck(std.env, { id: `w${i}` }, { loadProfile, plan: i < 4 ? "standard" : "free" }))).status);
  assert.deepEqual(res, ["done", "done", "done", "done", "done"], "four paid Standard sites and one Free site all run");
  assert.equal((await readEngineUsage(std.env, "org:o1", FREE_ACCOUNT_ENGINE)).calls, 1, "only the Free site took an account slot");
  // The cap is configurable; 0 means Free-plan sites are not checked.
  const none = setup({ FREE_SOV_SITES_PER_ACCOUNT: "0" });
  none.sqlite.prepare("INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,owner_member_id,bound_at,created_at) VALUES('z','o1','z.test','https://z.test/','kz','wp','free','m1',1,1)").run();
  const zero = await quiet(() => runFreeCheck(none.env, { id: "z" }, { loadProfile }));
  assert.equal(zero.status, "used_up");
  assert.equal(zero.scope, "account");
}

/* ---- 5. deleted sites: rows removed, never run, slot not given back ---- */
{
  const done = ids.filter((_, i) => outcomes[i] === "done");
  const gone = done[0];
  const del = await quiet(() => call("DELETE", `/api/sites/${gone}`));
  assert.equal(del.status, 200);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM aeo_free_checks WHERE site_id=?").get(gone).n, 0, "the site's free-check rows are deleted");
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM aeo_sov_engine_usage WHERE scope=?").get(gone).n, 0, "and its per-site ledger rows");
  assert.equal((await readEngineUsage(env, "org:o1", FREE_ACCOUNT_ENGINE)).calls, 3, "deleting a site does not reset the account's monthly count");
  const before = pplx;
  const stale = await quiet(() => runFreeCheck(env, { id: gone, org_id: "o1", install_type: "hosted", owner_member_id: "m1", slug: "x", profile_name: "x", profile_address: "x", created_at: 1 }, { loadProfile: async () => ({ name: "x" }), plan: "free" }));
  assert.equal(stale.status, "not_found", "a deleted site never runs, even from a stale row");
  assert.equal(pplx, before);
  // A new site after deleting one is still over the account's cap.
  const again = await quiet(async () => (await call("POST", "/api/sites", { install_type: "hosted", name: "Cafe again" })).json());
  sqlite.prepare("UPDATE sites SET created_at=? WHERE id=?").run(Date.now() - 2 * DAY, again.id);
  sqlite.prepare("UPDATE site_settings SET address='Tokyo' WHERE site_id=?").run(again.id);
  const r = await quiet(async () => (await call("POST", `/api/sites/${again.id}/sov/free-check`)).json());
  assert.equal(`${r.outcome}:${r.scope}`, "used_up:account");
  assert.equal(pplx, before);
}

/* ---- 6. site creation is rate limited per member, with a clear error ---- */
{
  assert.equal(siteCreateLimit({}), 20);
  assert.equal(siteCreateLimit({ SITE_CREATE_DAILY_LIMIT: "5" }), 5);
  const limited = setup({ SITE_CREATE_DAILY_LIMIT: "4" });
  const c = caller(limited.env);
  const statuses = [];
  let last;
  await quiet(async () => {
    for (let i = 0; i < 6; i += 1) {
      last = await c("POST", "/api/sites", { install_type: "hosted", name: `Shop ${i}` });
      statuses.push(last.status);
    }
  });
  assert.deepEqual(statuses, [200, 200, 200, 200, 429, 429]);
  const body = await last.json();
  assert.equal(body.error, "site_creation_rate_limited");
  assert.equal(body.limit, 4);
  assert.ok(Number(last.headers.get("retry-after")) > 0);
  assert.equal(limited.sqlite.prepare("SELECT COUNT(*) n FROM sites WHERE org_id='o1'").get().n, 4, "no site row past the limit");
  // Per member: another member is not affected.
  const other = await quiet(() => caller(limited.env, "t2")("POST", "/api/sites", { install_type: "hosted", name: "Other" }));
  assert.equal(other.status, 200);
  // The dashboard has words for the error.
  const html = readFileSync(new URL("../public/dashboard.html", import.meta.url), "utf8");
  assert.ok(html.includes('"err_site_creation_rate_limited"'), "dashboard error text exists");
}

console.log("free check abuse regression passed (hosted readiness, per-account cap, Standard exempt, batch, deletion, site-creation limit)");
