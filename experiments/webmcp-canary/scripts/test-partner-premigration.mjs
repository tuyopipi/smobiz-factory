/**
 * The Worker deployed before migration 0040 is applied (schema + 0029, 0030,
 * 0039, no partner_status column): invoice.paid must still answer 200 (no
 * account partner, nothing in the ledger) instead of 500 on every webhook,
 * and a signup with a referral code must succeed with the code ignored.
 * No real Stripe or mail calls: fetch is stubbed.
 */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { handleApi } from "../worker/api.mjs";
import { runPartnerPayouts } from "../worker/partner-payouts.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const sqlite = new DatabaseSync(":memory:");
sqlite.exec(read("../nurevo-impl/db/schema.sql"));
sqlite.exec("ALTER TABLE sites ADD COLUMN manual_plan TEXT");
sqlite.exec(read("../nurevo-impl/db/0029_member_email_preferences.sql"));
sqlite.exec(read("../nurevo-impl/db/0030_account_referrals.sql"));
sqlite.exec(read("../nurevo-impl/db/0039_partner_payouts.sql"));
const DB = {
  prepare(sql) {
    const stmt = sqlite.prepare(sql);
    return { values: [], bind(...values) { return Object.assign(Object.create(this), { values }); },
      async first() { return stmt.get(...this.values) || null; },
      async all() { return { results: stmt.all(...this.values) }; },
      runSync() { const result = stmt.run(...this.values); return { meta: { changes: Number(result.changes) } }; },
      async run() { return this.runSync(); } };
  },
  async batch(statements) { sqlite.exec("BEGIN"); try { const r = statements.map((s) => s.runSync()); sqlite.exec("COMMIT"); return r; } catch (e) { sqlite.exec("ROLLBACK"); throw e; } },
};
const SECRET = "whsec_test_premigration";
const env = { DB, DEV: "1", STRIPE_SECRET_KEY: "sk_test_premigration", STRIPE_WEBHOOK_SECRET: SECRET, RESEND_API_KEY: "test-only", MAIL_FROM: "test@example.test" };
const stripeCalls = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input) => {
  const url = String(input);
  if (url.startsWith("https://api.resend.com/")) return Response.json({ id: "mail" });
  stripeCalls.push(url);
  return Response.json({ error: { code: "resource_missing" } }, { status: 404 });
};
async function sign(payload) {
  const t = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${payload}`));
  return `t=${t},v1=${[...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}
const quiet = async (fn) => { const e = console.error, w = console.warn; console.error = console.warn = () => {}; try { return await fn(); } finally { console.error = e; console.warn = w; } };
try {
  assert.throws(() => sqlite.prepare("SELECT partner_status FROM accounts").get(), /no such column/, "the DB really lacks 0040");
  sqlite.exec(`INSERT INTO orgs(id) VALUES ('org_p'),('org_c');
    INSERT INTO members(id,org_id,email,status,role) VALUES ('p','org_p','p@example.test','active','admin'),('c','org_c','c@example.test','active','admin');
    INSERT INTO accounts(member_id,email,created_at,referral_code) VALUES ('p','p@example.test',1,'PREMIGRATE23');
    INSERT INTO accounts(member_id,email,created_at,referred_by_account_id) VALUES ('c','c@example.test',2,1);
    INSERT INTO sites(id,org_id,url,site_key,owner_member_id,plan,contract,stripe_subscription_id,created_at) VALUES ('s','org_c','s.example.test','s','c','standard','active','sub_s',1);`);
  const payload = JSON.stringify({ id: "evt_pre", type: "invoice.paid", data: { object: { id: "in_pre", object: "invoice", status: "paid", currency: "jpy", amount_paid: 3000, charge: "ch_pre", subscription: "sub_s" } } });
  const sig = await sign(payload);
  const response = await quiet(() => handleApi(new Request("https://nurevo.jp/api/billing/webhook", { method: "POST", headers: { "stripe-signature": sig }, body: payload }), env, {}));
  assert.equal(response.status, 200, "invoice.paid does not 500 before 0040");
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM referral_payouts").get().n, 0, "no account partner -> no commission before 0040");
  assert.equal(stripeCalls.length, 0);
  const signup = await quiet(() => handleApi(new Request("https://nurevo.jp/api/auth/signup", { method: "POST", headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.5" }, body: JSON.stringify({ email: "new@example.test", referral_code: "PREMIGRATE23", locale: "ja" }) }), env, {}));
  assert.equal(signup.status, 200, "signup with a code still works before 0040");
  assert.equal(sqlite.prepare("SELECT referred_by_account_id AS r FROM accounts WHERE email='new@example.test'").get().r, null, "the code is ignored before 0040");
  assert.deepEqual(await runPartnerPayouts(env), { skipped: "migration_0040_not_applied" }, "the hourly job skips rather than paying without the approval check");
  console.log("PASS: before 0040, invoice.paid answers 200 with no commission, a signup with a code succeeds with the code ignored, and the hourly job pays nothing. No real Stripe or mail calls.");
} finally { globalThis.fetch = originalFetch; sqlite.close(); }
