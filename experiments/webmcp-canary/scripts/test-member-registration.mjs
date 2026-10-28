import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { handleApi } from "../worker/api.mjs";

function makeEnv(existing = null) {
  const inserted = [];
  const DB = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            sql, values,
            async run() { return { success: true }; },
            async first() {
              if (sql.includes("INSERT INTO api_rate_limits")) return { count: 1, window_started_at: Date.now() };
              if (/SELECT id(,status)? FROM members/.test(sql)) return existing;
              throw new Error(`Unexpected first(): ${sql}`);
            },
          };
        },
      };
    },
    async batch(statements) {
      inserted.push(...statements);
      return statements.map(() => ({ success: true }));
    },
  };
  return { DB, PARTNER_REVIEW_ORG_ID: "org_review", inserted };
}

for (const role of ["agency", "referrer", "store"]) {
  const env = makeEnv();
  const response = await handleApi(new Request("https://nurevo.jp/api/members/register", {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": `test-${role}` },
    body: JSON.stringify({ email: `${role}@example.test`, role }),
  }), env, { waitUntil() {} });

  assert.equal(response.status, 201, `${role} registers without an invite code`);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.status, "pending");
  assert.match(body.member_id, /^mem_/u);
  // No agency (wholesale) membership is offered: a legacy "agency" submission
  // from an old cached form is recorded as a referral partner.
  assert.equal(body.role, role === "agency" ? "referrer" : role);
  assert.match(env.inserted[0].sql, /INSERT INTO members/u);
  assert.equal(env.inserted[0].values[3], role === "agency" ? "referrer" : role, `${role} is stored with the partner role`);
  assert.equal(env.inserted.length, 2, `${role} creates a pending member and registration locale atomically`);
}

// Distinct machine codes for the two "already exists" cases and for a bad
// email. error keeps its old value for forms that already map it.
{
  const register = (env, body, ip) => handleApi(new Request("https://nurevo.jp/api/members/register", {
    method: "POST", headers: { "content-type": "application/json", "cf-connecting-ip": ip }, body: JSON.stringify(body),
  }), env, { waitUntil() {} });
  let res = await register(makeEnv({ id: "m1", status: "active" }), { email: "a@example.test", role: "store" }, "dup-1");
  assert.equal(res.status, 409);
  assert.deepEqual(await res.json(), { error: "member_exists", code: "already_registered" });
  res = await register(makeEnv({ id: "m1", status: "pending" }), { email: "a@example.test", role: "store" }, "dup-2");
  assert.equal(res.status, 409);
  assert.deepEqual(await res.json(), { error: "member_exists", code: "pending_approval" });
  res = await register(makeEnv(), { email: "not-an-email", role: "store" }, "bad-1");
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: "email_and_role_required", code: "invalid_email" });
  res = await register(makeEnv(), { email: "a@example.test", role: "wizard" }, "bad-2");
  assert.deepEqual(await res.json(), { error: "email_and_role_required", code: "invalid_role" });
}

// A member still recorded with the legacy "agency" role sees the referral
// partner view of billing (their commission), never a wholesale invoice.
{
  const sqls = [];
  const DB = {
    prepare(sql) {
      sqls.push(sql);
      const first = async () => {
        if (/FROM sessions/.test(sql)) return { member_id: "m1", org_id: "org1", email: "legacy@agency.test", role: "agency", status: "active", expires_at: Date.now() + 3.6e6 };
        if (/FROM orgs WHERE id=\?/.test(sql)) return { plan: "standard", wholesale_min: 50 };
        return null;
      };
      const all = async () => {
        if (/GROUP BY channel/.test(sql)) return { results: [{ channel: "referral", count: 2 }, { channel: "direct", count: 5 }] };
        if (/FROM referrers r/.test(sql)) return { results: [{ id: "r1", name: "Legacy Agency", email: "legacy@agency.test", active_sites: 2, monthly_yen: 2400 }] };
        return { results: [] };
      };
      return { bind: () => ({ first, all, run: async () => ({}) }), first, all };
    },
  };
  const res = await handleApi(new Request("https://nurevo.jp/api/billing/summary", { headers: { cookie: "nrv_session=t" } }), { DB }, { waitUntil() {} });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.scope, "referrer", "a legacy agency member gets the partner view");
  assert.equal(body.legacy_role, "agency");
  assert.equal(body.active_sites, 2, "counting only the sites they referred");
  assert.equal(body.partner_incentive_yen, 2400);
  assert.equal(JSON.stringify(body).includes("wholesale"), false, "and nothing about a wholesale invoice");
  assert.ok(sqls.some((sql) => /lower\(r\.email\)=lower\(\?\)/.test(sql)), "scoped to their own referrer record");
}

const form = await readFile(new URL("../public/member-register.html", import.meta.url), "utf8");
assert.match(form, /招待コード（任意）/u);
assert.doesNotMatch(form, /name="invite"\s+required/u, "the invite field is optional");
// Everyone who is not a store applies as a referral partner (agencies too);
// no agency / wholesale role is offered for new sign-ups.
assert.match(form, /<option value="referrer">/u);
assert.doesNotMatch(form, /value="agency"/u, "no agency role is offered");
assert.doesNotMatch(form, /卸|wholesale|reseller|OEM/iu, "no wholesale wording");

console.log("member registration tests passed");
