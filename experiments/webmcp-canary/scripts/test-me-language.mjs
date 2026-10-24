/**
 * GET /api/me carries the member's stored languages (member_email_preferences,
 * migration 0029): `language` (chosen in the dashboard, unchanged field) and
 * `registration_locale` (the language they signed up in, added). Both are
 * normalised to the email locale codes, and both are null when nothing is
 * stored, so older clients that only read `language` see no change.
 *
 * Real SQL (node:sqlite) behind a D1-shaped shim; nothing leaves the process.
 */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { handleApi } from "../worker/api.mjs";

const sql = (name) => readFileSync(new URL(`../nurevo-impl/db/${name}`, import.meta.url), "utf8");
const sqlite = new DatabaseSync(":memory:");
sqlite.exec(sql("schema.sql"));
sqlite.exec(sql("0029_member_email_preferences.sql"));
sqlite.exec(sql("0043_dashboard_locale.sql"));
const DB = {
  prepare(text) {
    const stmt = sqlite.prepare(text);
    return { values: [], bind(...values) { return Object.assign(Object.create(this), { values }); },
      async first() { return stmt.get(...this.values) || null; },
      async all() { return { results: stmt.all(...this.values) }; },
      async run() { const r = stmt.run(...this.values); return { meta: { changes: Number(r.changes) } }; } };
  },
};
const env = { DB };
const hex = async (raw) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw)))]
  .map((b) => b.toString(16).padStart(2, "0")).join("");

async function member(id, email) {
  sqlite.prepare("INSERT INTO members (id,org_id,email,role,status,created_at) VALUES (?,'o1',?,'operator','active',1)").run(id, email);
  sqlite.prepare("INSERT INTO sessions (token,member_id,org_id,kind,expires_at) VALUES (?,?,'o1','session',?)").run(await hex(`raw-${id}`), id, Date.now() + 3600e3);
  return async () => {
    const res = await handleApi(new Request("https://nurevo.jp/api/me", { headers: { cookie: `nrv_session=raw-${id}` } }), env);
    assert.equal(res.status, 200);
    return res.json();
  };
}

{
  const me = await member("m1", "none@example.test");
  const body = await me();
  assert.equal(body.email, "none@example.test");
  assert.equal(body.role, "operator");
  assert.equal(body.language, null, "nothing stored: language is null, as before");
  assert.equal(body.registration_locale, null, "and so is registration_locale");
}
{
  const me = await member("m2", "reg@example.test");
  sqlite.prepare("INSERT INTO member_email_preferences (email,registration_locale) VALUES (?,?)").run("reg@example.test", "ko");
  const body = await me();
  assert.equal(body.registration_locale, "ko", "the registration locale is returned");
  assert.equal(body.language, null);
}
{
  const me = await member("m3", "Both@Example.test");
  sqlite.prepare("INSERT INTO member_email_preferences (email,language,registration_locale) VALUES (?,?,?)").run("both@example.test", "zh-tw", "ja");
  const body = await me();
  assert.deepEqual([body.language, body.registration_locale], ["zh-tw", "ja"], "both stored values, matched without regard to case");
}
{
  // Saving a language through the existing endpoint shows up in /api/me.
  const me = await member("m4", "save@example.test");
  sqlite.prepare("INSERT INTO member_email_preferences (email,registration_locale) VALUES (?,?)").run("save@example.test", "es");
  const csrf = "c".repeat(64);
  const saved = await handleApi(new Request("https://nurevo.jp/api/me/language", { method: "POST", headers: {
    cookie: `nrv_session=raw-m4; nrv_csrf=${csrf}`, "x-csrf-token": csrf, "content-type": "application/json", origin: "https://nurevo.jp",
  }, body: JSON.stringify({ language: "de" }) }), env);
  assert.equal(saved.status, 200, await saved.clone().text());
  const body = await me();
  assert.deepEqual([body.language, body.registration_locale], ["de", "es"]);
}
{
  const res = await handleApi(new Request("https://nurevo.jp/api/me"), env);
  assert.equal(res.status, 401, "signed out is still 401");
}

/* The dashboard's 60 locales (worker/dashboard-locales.mjs) are accepted. */
const csrf = "c".repeat(64);
const save = (id, language) => handleApi(new Request("https://nurevo.jp/api/me/language", { method: "POST", headers: {
  cookie: `nrv_session=raw-${id}; nrv_csrf=${csrf}`, "x-csrf-token": csrf, "content-type": "application/json", origin: "https://nurevo.jp",
}, body: JSON.stringify({ language }) }), env);
{
  const me = await member("m5", "pt@example.test");
  sqlite.prepare("INSERT INTO member_email_preferences (email,language,registration_locale) VALUES (?,?,?)").run("pt@example.test", "de", "ja");
  let body = await me();
  assert.equal(body.dashboard_locale, null, "nothing chosen yet");
  for (const [sent, locale, email] of [
    ["pt_BR", "pt_BR", "en"], ["pt-BR", "pt_BR", "en"], ["he_IL", "he_IL", "en"], ["ar", "ar", "en"], ["es_MX", "es_MX", "es"], ["es-AR", "es_AR", "es"],
    ["zh_HK", "zh_HK", "zh-tw"], ["zh-tw", "tw", "zh-tw"], ["tw", "tw", "zh-tw"], ["de_CH", "de_CH", "de"], ["en_GB", "en_GB", "en"], ["ja", "ja", "ja"],
    ["it-IT", "it_IT", "en"], ["nb", "nb_NO", "en"], ["fr-CH", "fr", "fr"],
  ]) {
    const res = await save("m5", sent);
    assert.equal(res.status, 200, `${sent}: accepted`);
    assert.deepEqual(await res.json(), { ok: true, language: email, dashboard_locale: locale }, `${sent}: stored as ${locale}, email in ${email}`);
    body = await me();
    assert.equal(body.dashboard_locale, locale, `${sent}: /api/me returns the dashboard locale`);
    assert.equal(body.language, email, `${sent}: language stays the email language (one of the eight)`);
    assert.equal(body.registration_locale, "ja", "the registration locale is untouched");
  }
  for (const bad of ["xx", "", "klingon", null, 42]) {
    const res = await save("m5", bad);
    assert.equal(res.status, 400, `${bad}: rejected`);
    assert.deepEqual(await res.json(), { error: "invalid_language" });
  }
}
{
  // Before migration 0043 the column is missing: the email language is still
  // saved, and /api/me answers without dashboard_locale.
  const old = new DatabaseSync(":memory:");
  old.exec(sql("schema.sql"));
  old.exec(sql("0029_member_email_preferences.sql"));
  const OLD = { prepare(text) { const stmt = old.prepare(text); return { values: [], bind(...values) { return Object.assign(Object.create(this), { values }); },
    async first() { return stmt.get(...this.values) || null; }, async all() { return { results: stmt.all(...this.values) }; },
    async run() { const r = stmt.run(...this.values); return { meta: { changes: Number(r.changes) } }; } }; } };
  old.prepare("INSERT INTO members (id,org_id,email,role,status,created_at) VALUES ('m9','o1','old@example.test','operator','active',1)").run();
  old.prepare("INSERT INTO sessions (token,member_id,org_id,kind,expires_at) VALUES (?,?,'o1','session',?)").run(await hex("raw-m9"), "m9", Date.now() + 3600e3);
  const res = await handleApi(new Request("https://nurevo.jp/api/me/language", { method: "POST", headers: {
    cookie: `nrv_session=raw-m9; nrv_csrf=${csrf}`, "x-csrf-token": csrf, "content-type": "application/json", origin: "https://nurevo.jp",
  }, body: JSON.stringify({ language: "es_MX" }) }), { DB: OLD });
  assert.equal(res.status, 200, await res.clone().text());
  assert.equal(old.prepare("SELECT language FROM member_email_preferences WHERE email='old@example.test'").get().language, "es");
  const me = await handleApi(new Request("https://nurevo.jp/api/me", { headers: { cookie: "nrv_session=raw-m9" } }), { DB: OLD });
  assert.equal(me.status, 200);
  const body = await me.json();
  assert.equal(body.language, "es");
  assert.equal(body.dashboard_locale, null);
}

console.log("/api/me language tests passed (incl. the 60 dashboard locales and the pre-0043 fallback)");
