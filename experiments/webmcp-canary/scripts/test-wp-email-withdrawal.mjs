/**
 * 0036: withdraw business emails the WordPress plugin (<= 0.7.3) autofilled
 * from admin_email. Run against a real SQLite with the real schema, the real
 * write path (writeSiteProfile) and the real migration file.
 *
 * Cleared:  plugin-sourced email equal to an org member's / owner's address.
 * Kept:     dashboard-typed emails (even if equal to the account email),
 *           plugin-sourced shop addresses that are not an account address,
 *           and anything with unknown provenance.
 */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { writeSiteProfile, loadSiteProfile } from "../worker/api.mjs";
import { mergeProfile } from "../worker/site-profile.mjs";

const sql = (file) => readFileSync(new URL(`../nurevo-impl/db/${file}`, import.meta.url), "utf8");

const sqlite = new DatabaseSync(":memory:");
sqlite.exec(sql("schema.sql"));
const DB = {
  prepare(text) {
    const wrap = (args) => ({
      async first() { return sqlite.prepare(text).get(...args) || null; },
      async all() { return { results: sqlite.prepare(text).all(...args) }; },
      async run() { return { meta: sqlite.prepare(text).run(...args) }; },
    });
    return { ...wrap([]), bind: (...args) => wrap(args) };
  },
  async batch(statements) { const out = []; for (const s of statements) out.push(await s.run()); return out; },
};
const env = { DB, WEBMCP_KV: { async get() { return null; }, async put() {} } };

sqlite.exec(`
  INSERT INTO orgs(id) VALUES('o1'),('o2');
  INSERT INTO members(id,org_id,email,status) VALUES
    ('m1','o1','Owner@Example.jp','active'),
    ('m2','o1','staff@example.jp','active'),
    ('m3','o2','other@example.jp','active');
`);
const sites = {
  autofill: "s_autofill",       // wp email == org member (case differs)  -> cleared
  staff: "s_staff",             // wp email == another member of same org -> cleared
  owner: "s_owner",             // wp email == owner member of another org -> cleared
  shop: "s_shop",               // wp email is a real shop address         -> kept
  dash: "s_dash",               // dashboard typed account email            -> kept
  foreign: "s_foreign",         // wp email == member of an unrelated org  -> kept
  legacy: "s_legacy",           // email with unknown provenance ('{}')    -> kept
};
for (const id of Object.values(sites)) {
  const org = id === "s_owner" ? "o2" : "o1";
  const owner = id === "s_owner" ? "m1" : null;
  sqlite.prepare("INSERT INTO sites(id,org_id,url,site_key,install_type,owner_member_id,created_at) VALUES(?,?,?,?,?,?,1)")
    .run(id, org, `${id}.test`, `k_${id}`, "wp", owner);
}

const wp = (id, email) => writeSiteProfile(env, id, { name: "Shop", email }, "wordpress");
await wp(sites.autofill, " owner@example.jp ");
await wp(sites.staff, "staff@example.jp");
await wp(sites.owner, "owner@example.jp");
await wp(sites.shop, "info@shop.example");
await writeSiteProfile(env, sites.dash, { name: "Shop", email: "owner@example.jp" }, "dashboard");
await wp(sites.foreign, "other@example.jp");
sqlite.prepare("INSERT INTO site_settings(site_id,name,email,field_sources,updated_at) VALUES(?,?,?,?,?)")
  .run(sites.legacy, "Shop", "owner@example.jp", "{}", 1);

const before = Object.fromEntries(Object.entries(sites).map(([k, id]) => [k, sqlite.prepare("SELECT * FROM site_settings WHERE site_id=?").get(id)]));
assert.equal(JSON.parse(before.autofill.field_sources).email.source, "wordpress", "plugin PUT stamps email as wordpress");
assert.equal(JSON.parse(before.dash.field_sources).email.source, "dashboard");

sqlite.exec(sql("0036_withdraw_wp_autofilled_email.sql"));

const after = async (id) => loadSiteProfile(env, id);
for (const key of ["autofill", "staff", "owner"]) {
  const p = await after(sites[key]);
  assert.equal(p.values.email, null, `${key}: autofilled account email cleared`);
  assert.equal(p.sources.email, undefined, `${key}: email provenance dropped`);
  assert.equal(p.sources.name?.source, "wordpress", `${key}: other fields' provenance untouched`);
  assert.equal(p.values.name, "Shop", `${key}: other fields untouched`);
  const row = sqlite.prepare("SELECT updated_at FROM site_settings WHERE site_id=?").get(sites[key]);
  assert.ok(row.updated_at > before[key].updated_at, `${key}: updated_at advanced`);
}
assert.equal((await after(sites.shop)).values.email, "info@shop.example", "real shop email typed in wp-admin is kept");
assert.equal((await after(sites.dash)).values.email, "owner@example.jp", "dashboard-typed email is never touched");
assert.equal((await after(sites.foreign)).values.email, "other@example.jp", "an unrelated org's member address does not match");
assert.equal((await after(sites.legacy)).values.email, "owner@example.jp", "unknown provenance is left alone");

// Idempotent.
sqlite.exec(sql("0036_withdraw_wp_autofilled_email.sql"));
assert.equal((await after(sites.shop)).values.email, "info@shop.example");

// Plugin 0.7.4 sends an empty email: it must neither re-fill nor clear anything.
for (const id of [sites.autofill, sites.shop]) {
  const prior = (await after(id)).values.email;
  const res = await wp(id, "");
  assert.ok(!res.changed.includes("email"), "empty pushed email is a no-op");
  assert.equal((await after(id)).values.email, prior, "empty pushed email never re-fills or clears");
}
// And at the merger level, including whitespace.
{
  const m = mergeProfile({ current: { email: null }, sources: {}, incoming: { email: "   " }, source: "wordpress", now: 2 });
  assert.equal(m.values.email, null);
  assert.deepEqual(m.changed, []);
}

console.log("wp email withdrawal (0036): ok");
