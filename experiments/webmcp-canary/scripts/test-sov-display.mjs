/**
 * What GET /api/sites/:id/sov hands the dashboard.
 *
 * The panel is a reader: it draws a stored run and must never imply more than
 * was measured. These pin the properties that keep that true - the pro gate, the
 * three reasons a rate may be absent, the engine split staying split, and the
 * exclusions made at measurement time surviving the trip back out.
 */
import assert from "node:assert/strict";
import { handleApi } from "../worker/api.mjs";
import { deriveRateBasis, RATE_BASES, SOV_MIN_SAMPLES_FOR_RATE, storeSovRun } from "../worker/aeo-sov.mjs";

const SITE_ID = "site-pro";
const SESSION = { cookie: "nrv_session=tok" };

function run(overrides = {}) {
  const detail = overrides.detail === undefined ? {} : overrides.detail;
  return {
    id: "sov_1",
    ran_at: "2026-10-05T00:00:00.000Z",
    status: "measured",
    trigger: "scheduled",
    appearance_rate: 0.4,
    citation_rate: 0.2,
    confidence: "low",
    questions_asked: 5,
    answers_received: 5,
    queries_used: 10,
    competitors_json: JSON.stringify([{ host: "rival.example.net", appearances: 2, appearance_rate: 0.4 }]),
    engines_json: JSON.stringify([
      { id: "perplexity", label: "Perplexity", citations_available: true, live_search: true },
      { id: "openai", label: "ChatGPT (OpenAI)", citations_available: false, live_search: false },
    ]),
    detail_json: typeof detail === "string" ? detail : JSON.stringify(detail),
    ...overrides.row,
  };
}

function makeEnv({ plan = "pro", manual_plan = null, runs = [] } = {}) {
  const DB = {
    prepare(sql) {
      const first = async (...values) => {
        if (sql.includes("FROM sessions")) {
          return { member_id: "m1", org_id: "org1", email: "o@x.test", role: "admin", status: "active", expires_at: Date.now() + 3.6e6 };
        }
        if (sql.includes("FROM sites WHERE id=")) {
          return values[0] === SITE_ID
            ? { id: SITE_ID, org_id: "org1", url: "pro.example.com", website_uri: "https://pro.example.com", plan, manual_plan, install_type: "tag", delivery_status: "active" }
            : null;
        }
        if (sql.includes("FROM aeo_sov_usage")) return { queries_used: 3 };
        return null;
      };
      return {
        bind(...values) {
          return {
            first: () => first(...values),
            async all() { return { results: sql.includes("FROM aeo_sov_runs") ? runs : [] }; },
            async run() { return { success: true }; },
          };
        },
        first,
        async all() { return { results: [] }; },
        async run() { return { success: true }; },
      };
    },
  };
  // Keys are present so engineStatus() reports both engines; no probe is ever
  // issued on this path, which is the point of the panel being a reader.
  return { DB, PERPLEXITY_API_KEY: "test", OPENAI_API_KEY: "test", WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp" };
}

const get = async (env, query = "") => {
  const response = await handleApi(
    new Request(`https://w.test/api/sites/${SITE_ID}/sov${query}`, { headers: SESSION }),
    env, { waitUntil() {} },
  );
  return { status: response.status, body: await response.json() };
};

/* ---------------- A. the pro gate ---------------- */

for (const plan of ["free", "standard"]) {
  const { status, body } = await get(makeEnv({ plan }));
  assert.equal(status, 402, `${plan} does not get the panel`);
  assert.equal(body.error, "upgrade_required");
  assert.equal(body.plan, plan, "the current plan is stated so the panel can show it");
  assert.ok(body.upgrade?.message, "the upsell copy comes from the server");
  assert.equal(body.upgrade.required_plan, "pro");
  // A locked panel must have nothing to draw a number from, invented or real.
  const serialised = JSON.stringify(body);
  assert.equal(/appearance_rate|by_engine|competitors/.test(serialised), false, "no measurement leaks to a non-pro site");
}

{
  // The grant path: billing says free, a manual grant says pro. resolveSitePlan
  // is the authority and the panel must follow it rather than reading `plan`.
  const { status, body } = await get(makeEnv({ plan: "free", manual_plan: "pro", runs: [run()] }));
  assert.equal(status, 200, "a manually granted pro site gets the panel");
  assert.equal(body.plan, "pro");
}

{
  const anonymous = await handleApi(new Request(`https://w.test/api/sites/${SITE_ID}/sov`), makeEnv({ runs: [run()] }), { waitUntil() {} });
  assert.equal(anonymous.status, 401, "the panel is not public");
}

/* ---------------- B. the three reasons a rate may be absent ---------------- */

{
  const { body } = await get(makeEnv({ runs: [run({ detail: { rate_basis: "measured" } })] }));
  assert.equal(body.latest.rate_basis, "measured");
  assert.equal(body.latest.rate_basis_derived, false, "it was stored, not inferred");
}

{
  // Nothing came back at all.
  const { body } = await get(makeEnv({ runs: [run({
    detail: { rate_basis: "no_answers" },
    row: { answers_received: 0, appearance_rate: null, citation_rate: null },
  })] }));
  assert.equal(body.latest.rate_basis, "no_answers");
  assert.equal(body.latest.appearance_rate, null, "and no rate is invented to fill the gap");
}

{
  // One answer is a data point, not a percentage.
  const { body } = await get(makeEnv({ runs: [run({
    detail: { rate_basis: "insufficient_samples" },
    row: { answers_received: 1, appearance_rate: null },
  })] }));
  assert.equal(body.latest.rate_basis, "insufficient_samples");
  assert.equal(body.latest.appearance_rate, null);
}

{
  // The distinction the whole panel turns on: a measured zero keeps its number.
  const { body } = await get(makeEnv({ runs: [run({
    detail: { rate_basis: "measured" },
    row: { answers_received: 6, appearance_rate: 0 },
  })] }));
  assert.equal(body.latest.appearance_rate, 0);
  assert.equal(body.latest.rate_basis, "measured", "0% measured is not the same as unmeasurable");
}

/* ---------------- rows written before 0022 ---------------- */

{
  // detail_json as it was written before the basis was stored.
  const legacy = { beta: true, truncated: false, brand: { name: "x", host: "pro.example.com" } };
  const { body } = await get(makeEnv({ runs: [run({ detail: legacy, row: { answers_received: 5 } })] }));
  assert.equal(body.latest.rate_basis, "measured", "recomputed from the answer count");
  assert.equal(body.latest.rate_basis_derived, true, "and says it was recomputed");
  assert.deepEqual(body.latest.by_engine, [], "with no engine split invented for it");
  assert.ok(body.latest.engines.length, "the engine roster is still available to label");
}

{
  const { body } = await get(makeEnv({ runs: [run({ detail: {}, row: { answers_received: 1 } })] }));
  assert.equal(body.latest.rate_basis, "insufficient_samples", "the derivation uses the same threshold");
}

{
  const { body } = await get(makeEnv({ runs: [run({ detail: {}, row: { answers_received: 0 } })] }));
  assert.equal(body.latest.rate_basis, "no_answers");
}

// The derivation and the aggregation must not drift apart.
assert.equal(deriveRateBasis(0), "no_answers");
assert.equal(deriveRateBasis(SOV_MIN_SAMPLES_FOR_RATE - 1), "insufficient_samples");
assert.equal(deriveRateBasis(SOV_MIN_SAMPLES_FOR_RATE), "measured");
for (const basis of ["measured", "insufficient_samples", "no_answers"]) {
  assert.ok(RATE_BASES.includes(basis), `${basis} is a recognised basis`);
}

/* ---------------- C. the engines stay apart ---------------- */

{
  const byEngine = [
    { engine: "perplexity", answers: 3, failures: 0, appearances: 2, citations: 1, live_search: true, citations_available: true, appearance_rate: 0.667 },
    { engine: "openai", answers: 2, failures: 1, appearances: 0, citations: 0, live_search: false, citations_available: false, appearance_rate: 0 },
  ];
  const { body } = await get(makeEnv({ runs: [run({ detail: { rate_basis: "measured", by_engine: byEngine } })] }));
  const live = body.latest.by_engine.find((row) => row.engine === "perplexity");
  const staticEngine = body.latest.by_engine.find((row) => row.engine === "openai");

  assert.equal(live.live_search, true, "Perplexity is marked as live search");
  assert.equal(staticEngine.live_search, false, "the OpenAI endpoint is marked as not live search");
  assert.notEqual(live.appearance_rate, staticEngine.appearance_rate, "the two carry their own rates");
  // Each engine keeps its own denominator; summing them into one would be the
  // blend this split exists to prevent.
  assert.equal(live.answers, 3);
  assert.equal(staticEngine.answers, 2);
  assert.equal(staticEngine.failures, 1, "a failed probe is reported but is not an answer");
}

/* ---------------- D. exclusions survive the trip out ---------------- */

{
  // An aggregator should never have been stored, but if one is present it must
  // not be handed back as a competitor.
  const dirty = JSON.stringify([
    { host: "tabelog.com", appearances: 9 },
    { host: "rival.example.net", appearances: 2 },
  ]);
  const { body } = await get(makeEnv({ runs: [run({ row: { competitors_json: dirty } })] }));
  const hosts = body.latest.competitors.map((row) => row.host);
  assert.equal(hosts.includes("tabelog.com"), false, "an aggregator is filtered on the way out too");
  assert.deepEqual(hosts, ["rival.example.net"], "a real competitor is kept");
}

/* ---------------- E. as-of and counts are always present ---------------- */

{
  const { body } = await get(makeEnv({ runs: [run()] }));
  assert.equal(body.latest.ran_at, "2026-10-05T00:00:00.000Z");
  assert.equal(body.latest.questions_asked, 5);
  assert.equal(body.latest.answers_received, 5);
  assert.equal(body.latest.queries_used, 10);
  assert.ok(body.usage && typeof body.usage.remaining === "number", "the monthly budget is reported");
  assert.equal(body.beta, true, "the beta label is not dropped");
}

/* ---------------- F. nothing measured yet ---------------- */

{
  const { status, body } = await get(makeEnv({ runs: [] }));
  assert.equal(status, 200, "a pro site with no run still gets a panel to render");
  assert.equal(body.latest, null, "with nothing in it");
  assert.deepEqual(body.trend, []);
}

/* ---------------- damaged rows must not take the panel down ---------------- */

for (const [label, detail] of [
  ["unparseable", "{not json"],
  ["an array where an object belongs", "[1,2,3]"],
  ["a scalar", '"hello"'],
  ["null", "null"],
]) {
  const { status, body } = await get(makeEnv({ runs: [run({ detail, row: { answers_received: 4 } })] }));
  assert.equal(status, 200, `${label} detail_json still renders`);
  assert.equal(body.latest.rate_basis, "measured", `${label} falls back to the derived basis`);
  assert.deepEqual(body.latest.by_engine, [], `${label} yields no engine split`);
}

{
  // Unknown keys from a future build are ignored rather than fatal.
  const { status, body } = await get(makeEnv({ runs: [run({
    detail: { rate_basis: "measured", by_engine: [], some_future_field: { nested: true } },
  })] }));
  assert.equal(status, 200);
  assert.equal(body.latest.rate_basis, "measured");
}

{
  // A basis value this build does not recognise is not passed through.
  const { body } = await get(makeEnv({ runs: [run({ detail: { rate_basis: "vibes" }, row: { answers_received: 3 } })] }));
  assert.equal(body.latest.rate_basis, "measured", "an unknown basis is replaced by the derived one");
  assert.equal(body.latest.rate_basis_derived, true);
}

{
  // by_engine stored as something that is not a list.
  const { body } = await get(makeEnv({ runs: [run({ detail: { rate_basis: "measured", by_engine: { perplexity: 1 } } })] }));
  assert.deepEqual(body.latest.by_engine, [], "a non-list engine split is dropped");
}

/* ---------------- the write side records what the reader needs ---------------- */

{
  // storeSovRun() used to drop rate_basis, by_engine and parser_control on the
  // floor, which is why the reader had to derive or do without them. It also
  // has to record whether a probe was a branded control, because the rate
  // excludes those and a later reader cannot tell otherwise.
  const writes = [];
  const env = {
    DB: {
      prepare(sql) {
        return { bind(...values) { return { async run() { writes.push({ sql, values }); return { success: true }; } }; } };
      },
    },
  };
  const measurement = {
    status: "measured",
    questions_asked: 2, answers_received: 2, queries_used: 3,
    appearance_rate: 0.5, citation_rate: 0, confidence: "low",
    rate_basis: "measured", min_samples_for_rate: 2,
    brand: { name: "栞珈琲", host: "pro.example.com" },
    competitors: [{ host: "rival.example.net", appearances: 1 }],
    by_engine: [{ engine: "perplexity", answers: 2, failures: 0, appearances: 1, live_search: true, appearance_rate: 0.5 }],
    parser_control: { asked: 1, answers: 1, detected: 1, cited: 0 },
    samples: [
      { engine: "perplexity", question: "渋谷のカフェは？", kind: "discovery", ok: true, mentioned: true, cited: false, competitorHosts: ["rival.example.net"], excerpt: "..." },
      { engine: "perplexity", question: "栞珈琲はどんなお店？", kind: "branded", ok: true, mentioned: true, cited: true, competitorHosts: [], excerpt: "..." },
      { engine: "openai", question: "渋谷のカフェは？", kind: "discovery", ok: false, error: "timeout" },
    ],
  };
  await storeSovRun(env, SITE_ID, measurement, { trigger: "scheduled", now: Date.parse("2026-10-06T00:00:00Z") });

  const runWrite = writes.find((write) => write.sql.includes("INSERT INTO aeo_sov_runs"));
  assert.ok(runWrite, "the run is stored");
  const detail = JSON.parse(runWrite.values[runWrite.values.length - 1]);
  assert.equal(detail.rate_basis, "measured", "the basis is persisted rather than recomputed later");
  assert.equal(detail.min_samples_for_rate, 2, "with the threshold that produced it");
  assert.equal(detail.by_engine.length, 1, "the engine split is persisted");
  assert.equal(detail.by_engine[0].live_search, true, "including which engine searches live");
  assert.ok(detail.parser_control, "and the control summary");
  // The fields that were already there must not be lost to the new ones.
  assert.equal(detail.beta, true);
  assert.ok(detail.brand, "the brand is still recorded");

  const mentionWrites = writes.filter((write) => write.sql.includes("INSERT INTO aeo_sov_mentions"));
  assert.equal(mentionWrites.length, 3, "every probe is stored, failures included");
  const kinds = mentionWrites.map((write) => write.values[4]);
  assert.deepEqual(kinds, ["discovery", "branded", "discovery"], "each probe records which question it answered");
  for (const write of mentionWrites) {
    assert.equal(write.sql.includes("kind"), true, "the column is written explicitly");
  }
}

{
  // A sample with no kind is a discovery question, matching the column default
  // and the aggregation's own `kind !== "branded"` test.
  const writes = [];
  const env = { DB: { prepare(sql) { return { bind(...values) { return { async run() { writes.push({ sql, values }); return {}; } }; } }; } } };
  await storeSovRun(env, SITE_ID, {
    status: "measured", samples: [{ engine: "perplexity", question: "q", ok: true }],
  }, { now: Date.parse("2026-10-06T00:00:00Z") });
  const mention = writes.find((write) => write.sql.includes("aeo_sov_mentions"));
  assert.equal(mention.values[4], "discovery", "an unlabelled probe defaults to discovery");
}

console.log("SoV display tests passed");
