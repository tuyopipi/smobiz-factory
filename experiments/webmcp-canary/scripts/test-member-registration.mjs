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
  assert.equal(body.role, role);
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

const form = await readFile(new URL("../public/member-register.html", import.meta.url), "utf8");
assert.match(form, /招待コード（任意）/u);
assert.doesNotMatch(form, /name="invite"\s+required/u, "the invite field is optional");

console.log("member registration tests passed");
