import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { handleApi } from "../worker/api.mjs";

function makeEnv() {
  const inserted = [];
  const DB = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              if (sql.includes("INSERT INTO api_rate_limits")) return { count: 1, window_started_at: Date.now() };
              if (sql.includes("SELECT id FROM members")) return null;
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
  assert.equal(env.inserted.length, 1, `${role} creates one pending member`);
}

const form = await readFile(new URL("../public/member-register.html", import.meta.url), "utf8");
assert.match(form, /招待コード（任意）/u);
assert.doesNotMatch(form, /name="invite"\s+required/u, "the invite field is optional");

console.log("member registration tests passed");
