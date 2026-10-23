/**
 * The checklist the dashboard shows beside the score.
 *
 * aeo_scores has always stored checks_json; the endpoint simply never selected
 * it, so the dashboard could show that a site was failing but not what to fix.
 * These pin the parts that are easy to get wrong: the latest row is the one that
 * counts, wording follows the request language rather than whatever was stored,
 * and a malformed stored row does not take the whole panel down with it.
 */
import assert from "node:assert/strict";
import { handleApi } from "../worker/api.mjs";

const CSRF = "c".repeat(64);
const SESSION = { cookie: `nrv_session=t; nrv_csrf=${CSRF}`, "x-csrf-token": CSRF };

const CHECKS = [
  { id: "ai_crawlers_allowed", status: "OK", fixable: true },
  { id: "schema", status: "WARN", fixable: true },
  { id: "coverage", status: "BAD", fixable: true },
];

function makeEnv({ scoreRows = [], site = {} } = {}) {
  const DB = {
    prepare(sql) {
      const first = async (...values) => {
        if (/FROM sessions/.test(sql)) {
          return { member_id: "m", org_id: "org1", email: "e@x.test", role: "admin", status: "active", expires_at: Date.now() + 3.6e6 };
        }
        if (/FROM aeo_rulesets WHERE active=1/.test(sql)) return { version: 7 };
        if (/FROM sites WHERE id=\?/.test(sql)) return { id: "s1", org_id: "org1", install_type: "wp", ...site };
        return null;
      };
      return {
        bind(...values) {
          return {
            first: () => first(...values),
            async all() {
              if (/FROM aeo_scores/.test(sql)) return { results: scoreRows };
              if (/FROM crawler_hits/.test(sql)) return { results: [] };
              return { results: [] };
            },
            async run() { return { success: true }; },
          };
        },
        first,
        async all() { return { results: [] }; },
        async run() { return { success: true }; },
      };
    },
  };
  return { DB, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp" };
}

const metrics = async (env, query = "") => {
  const response = await handleApi(
    new Request(`https://w.test/api/sites/s1/aeo-metrics${query}`, { headers: SESSION }),
    env, { waitUntil() {} },
  );
  assert.equal(response.status, 200);
  return response.json();
};

const row = (scannedAt, score, checks) => ({
  site_id: "s1", scanned_at: scannedAt, host: "example.com", score, verdict: "yellow",
  ruleset_version: 7, checks_json: checks === undefined ? JSON.stringify(CHECKS) : checks,
});

/* ---------------- the latest diagnosis is the one shown ---------------- */

{
  // Rows arrive oldest-first, so the checklist must come from the last one.
  const env = makeEnv({ scoreRows: [
    row("2026-10-01T00:00:00Z", 40, JSON.stringify([{ id: "llms", status: "BAD" }])),
    row("2026-10-05T00:00:00Z", 78),
  ] });
  const body = await metrics(env);
  assert.equal(body.checks.length, 3, "the latest checklist is returned");
  assert.equal(body.checked_at, "2026-10-05T00:00:00Z", "and is dated");
  assert.deepEqual(body.checks.map((c) => c.id), ["ai_crawlers_allowed", "schema", "coverage"], "ids come through unchanged");
  assert.deepEqual(body.checks.map((c) => c.status), ["OK", "WARN", "BAD"], "statuses come through unchanged");
}

/* ---------------- the history stays lean ---------------- */

{
  const env = makeEnv({ scoreRows: [row("2026-10-01T00:00:00Z", 40), row("2026-10-05T00:00:00Z", 78)] });
  const body = await metrics(env);
  assert.equal(body.scores.length, 2, "the score history is intact");
  // The chart needs scores, not every past checklist; shipping them all would be
  // a lot of payload for a sparkline.
  for (const score of body.scores) {
    assert.equal("checks_json" in score, false, "history rows do not carry raw checklists");
    assert.ok(Number.isFinite(score.score), "but they do carry their score");
  }
}

/* ---------------- wording follows the request ---------------- */

{
  const env = makeEnv({ scoreRows: [row("2026-10-05T00:00:00Z", 78)] });
  const japanese = /[぀-ヿ一-龯]/;

  const en = await metrics(env, "?lang=en");
  for (const check of en.checks) {
    assert.ok(check.label, `${check.id} has a label`);
    assert.ok(check.message, `${check.id} has a message`);
    assert.equal(japanese.test(check.label + check.message), false, `${check.id} reads as English`);
  }

  const ja = await metrics(env, "?lang=ja");
  assert.ok(ja.checks.some((c) => japanese.test(c.label)), "Japanese is available too");
  assert.deepEqual(ja.checks.map((c) => c.id), en.checks.map((c) => c.id), "ids do not depend on language");
  assert.deepEqual(ja.checks.map((c) => c.status), en.checks.map((c) => c.status), "statuses do not depend on language");

  // The stored row carries no wording at all, so this proves the labels are
  // applied at read time rather than frozen when the diagnosis ran.
  assert.notDeepEqual(ja.checks.map((c) => c.label), en.checks.map((c) => c.label), "the two languages differ");
}

{
  // Every row already in the database was written with Japanese wording baked
  // in, because diagnoses stored their labels before the endpoint localised.
  // An English reader must get English regardless, so the stored wording has to
  // be replaced rather than merely filled in where missing.
  const stored = JSON.stringify([
    { id: "ai_crawlers_allowed", label: "AIクローラー到達性", status: "OK", message: "許可されています" },
  ]);
  const env = makeEnv({ scoreRows: [row("2026-10-05T00:00:00Z", 53, stored)] });
  const body = await metrics(env, "?lang=en");
  assert.equal(/[぀-ヿ一-龯]/.test(body.checks[0].label + body.checks[0].message), false,
    "stored Japanese wording is replaced, not kept");
}

/* ---------------- nothing to show ---------------- */

{
  const body = await metrics(makeEnv({ scoreRows: [] }));
  assert.deepEqual(body.checks, [], "a site with no diagnosis has an empty checklist");
  assert.equal(body.checked_at, null);
  assert.deepEqual(body.scores, [], "and no history");
}

/* ---------------- a broken stored row must not break the panel ---------------- */

{
  const env = makeEnv({ scoreRows: [row("2026-10-05T00:00:00Z", 78, "{not json")] });
  const body = await metrics(env);
  assert.deepEqual(body.checks, [], "unparseable stored checks yield an empty checklist");
  assert.equal(body.scores.length, 1, "and the score history still renders");
  assert.ok(body.ruleset, "as does the ruleset panel");
}

{
  // A row written before checks were stored at all.
  const env = makeEnv({ scoreRows: [row("2026-10-05T00:00:00Z", 78, null)] });
  const body = await metrics(env);
  assert.deepEqual(body.checks, [], "a row with no stored checks yields an empty checklist");
  assert.equal(body.scores.length, 1);
}

{
  // Valid JSON that is not a list.
  const env = makeEnv({ scoreRows: [row("2026-10-05T00:00:00Z", 78, '{"id":"schema"}')] });
  const body = await metrics(env);
  assert.deepEqual(body.checks, [], "a non-array payload is ignored rather than rendered");
}

/* ---------------- an unknown check still appears ---------------- */

{
  // A check added upstream that this build has no wording for must keep whatever
  // the diagnosis recorded, rather than vanishing from the list.
  const env = makeEnv({ scoreRows: [row("2026-10-05T00:00:00Z", 78, JSON.stringify([
    { id: "future_check", status: "BAD", label: "Upstream label", message: "Upstream message" },
  ]))] });
  const body = await metrics(env, "?lang=en");
  assert.equal(body.checks.length, 1, "the unknown check is still listed");
  assert.equal(body.checks[0].label, "Upstream label", "with the wording it arrived with");
}

/* ---------------- access control is unchanged ---------------- */

{
  const env = makeEnv({ scoreRows: [row("2026-10-05T00:00:00Z", 78)] });
  const anonymous = await handleApi(new Request("https://w.test/api/sites/s1/aeo-metrics"), env, { waitUntil() {} });
  assert.equal(anonymous.status, 401, "the checklist is not public");
}

console.log("aeo metrics checklist tests passed");
