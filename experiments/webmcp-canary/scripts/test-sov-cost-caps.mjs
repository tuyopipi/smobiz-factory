/**
 * S3: cost caps must stop the run BEFORE any engine call is issued.
 *
 * Every assertion counts actual engine requests, because the thing being
 * protected is spend, not a number in a response body.
 */
import assert from "node:assert/strict";
import { handleApi, runSovWeeklyBatch } from "../worker/api.mjs";
import { SOV_LIMITS, SOV_MIN_SAMPLES_FOR_RATE, buildQuestionSet, measureSov } from "../worker/aeo-sov.mjs";

const SITE_ID = "cap-site";
const CSRF = "a".repeat(64);
const PAGE = `<!doctype html><html><head>
<script type="application/ld+json">{"@type":"HairSalon","name":"ルミナ 表参道","additionalType":"美容室","address":{"addressLocality":"渋谷区"}}</script>
</head><body><h1>ルミナ 表参道</h1></body></html>`;

let engineCalls = 0;
function installFetch() {
  engineCalls = 0;
  globalThis.fetch = async (input, init = {}) => {
    const href = typeof input === "string" ? input : input.url;
    if (href.includes("api.perplexity.ai") || href.includes("api.openai.com")) {
      engineCalls += 1;
      return new Response(JSON.stringify({
        choices: [{ message: { content: "ルミナ 表参道 がおすすめです。" } }],
        citations: ["https://cap.example.com/"],
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (init.method === "HEAD") return new Response(null, { status: 200 });
    return new Response(PAGE, { status: 200, headers: { "content-type": "text/html" } });
  };
}

function env({ usage = 0, keys = { PERPLEXITY_API_KEY: "pk" }, plan = "pro" } = {}) {
  const month = new Date().toISOString().slice(0, 7);
  const used = new Map(usage ? [[`${SITE_ID}|${month}`, usage]] : []);
  const writes = [];
  const DB = {
    prepare(sql) {
      return {
        bind(...v) {
          return {
            async first() {
              if (sql.includes("FROM sessions")) return { member_id: "m", org_id: "o", email: "e@x.test", role: "admin", status: "active", expires_at: Date.now() + 3.6e6 };
              if (sql.includes("FROM sites WHERE id")) return { id: SITE_ID, org_id: "o", url: "cap.example.com", website_uri: "https://cap.example.com", plan, delivery_status: "active" };
              if (sql.includes("FROM site_settings")) return { name: "ルミナ 表参道", business_type: "美容室", address: "東京都渋谷区神宮前4-1-1" };
              if (sql.includes("FROM aeo_sov_usage")) return { queries_used: used.get(`${v[0]}|${v[1]}`) || 0 };
              return null;
            },
            async all() {
              if (sql.includes("FROM aeo_sov_runs")) return { results: [] };
              if (sql.includes("FROM sites")) return { results: plan === "pro" ? [{ id: SITE_ID, url: "cap.example.com", website_uri: "https://cap.example.com", plan, delivery_status: "active" }] : [] };
              return { results: [] };
            },
            async run() {
              writes.push(sql);
              if (sql.includes("INSERT INTO aeo_sov_usage")) {
                const k = `${v[0]}|${v[1]}`;
                used.set(k, (used.get(k) || 0) + Number(v[2]));
              }
              return { success: true };
            },
          };
        },
        async first() { return null; },
        async all() { return { results: [] }; },
      };
    },
  };
  return { DB, ...keys, writes, usedMap: used, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp" };
}

const ctx = { waitUntil() {} };
const post = (e) => handleApi(new Request(`https://w.test/api/sites/${SITE_ID}/sov`, {
  method: "POST", headers: { cookie: `nrv_session=t; nrv_csrf=${CSRF}`, "x-csrf-token": CSRF },
}), e, ctx);

/* --- cap 1: questions per run --------------------------------------------- */
installFetch();
const profile = { name: "ルミナ 表参道", businessType: "美容室", locality: "渋谷区", host: "cap.example.com", aliases: ["ルミナ 表参道"] };
assert.ok(buildQuestionSet(profile, 999).length <= SOV_LIMITS.maxQuestionsPerRun,
  "an oversized question request is clamped to the per-run cap");
await measureSov({ PERPLEXITY_API_KEY: "pk" }, profile, { questions: Array.from({ length: 500 }, (u, i) => `q${i}`) });
assert.ok(engineCalls <= SOV_LIMITS.maxQuestionsPerRun * SOV_LIMITS.maxEnginesPerRun,
  `a 500-question request issued ${engineCalls} calls, above the per-run ceiling`);

/* --- cap 2: engines per run ----------------------------------------------- */
installFetch();
await measureSov({ PERPLEXITY_API_KEY: "pk", OPENAI_API_KEY: "ok" }, profile, { questions: ["only-one"] });
assert.equal(engineCalls, SOV_LIMITS.maxEnginesPerRun, "one question is asked of at most maxEnginesPerRun engines");

/* --- cap 3: monthly budget exhausted -> zero engine calls ------------------ */
installFetch();
const exhausted = env({ usage: SOV_LIMITS.monthlyQueriesPerSite });
const refused = await post(exhausted);
assert.equal(refused.status, 429, "an exhausted monthly budget is refused");
const refusedBody = await refused.json();
assert.equal(refusedBody.error, "monthly_quota_exhausted", "the refusal names the quota");
assert.equal(refusedBody.usage.remaining, 0, "the caller is told nothing remains");
assert.equal(engineCalls, 0, "NO engine call is issued once the monthly cap is reached");
assert.ok(!exhausted.writes.some((sql) => sql.includes("INSERT INTO aeo_sov_runs")), "no run is recorded when refused");

/* --- cap 4: partial budget spends only what remains ------------------------ */
for (const remaining of [1, 3, 7]) {
  installFetch();
  const near = env({ usage: SOV_LIMITS.monthlyQueriesPerSite - remaining });
  const body = await (await post(near)).json();
  assert.equal(engineCalls, remaining, `exactly ${remaining} calls are made with ${remaining} left in the budget`);
  assert.equal(body.queries_used, remaining, "reported usage matches the calls issued");
  assert.equal(body.truncated, true, "a budget-capped run is marked truncated");
  assert.equal(body.usage.remaining, 0, "the budget is now exhausted");
  // One surviving answer must not become a rate.
  if (remaining < SOV_MIN_SAMPLES_FOR_RATE) {
    assert.equal(body.appearance_rate, null, "a sub-threshold capped run reports no rate");
  }
}

/* --- cap 5: the weekly batch respects the same budget ---------------------- */
installFetch();
const batchExhausted = env({ usage: SOV_LIMITS.monthlyQueriesPerSite });
const batch = await runSovWeeklyBatch(batchExhausted);
assert.equal(engineCalls, 0, "the weekly batch issues no call for a site over its cap");
assert.equal(batch.skipped, 1, "the capped site is skipped");
assert.equal(batch.errors[0].error, "monthly_quota_exhausted", "the batch reports why it skipped");

/* --- cap 6: no keys -> no calls, whatever the budget ----------------------- */
installFetch();
const unkeyed = env({ usage: 0, keys: {} });
const unconfigured = await (await post(unkeyed)).json();
assert.equal(engineCalls, 0, "an unconfigured environment issues zero engine calls");
assert.equal(unconfigured.status, "unconfigured", "the run reports the unconfigured status");
assert.equal(unconfigured.appearance_rate, null, "no rate is invented without an engine");
assert.equal(unconfigured.queries_used, 0, "no budget is consumed");

/* --- cap 7: non-pro never reaches an engine -------------------------------- */
for (const plan of ["free", "standard"]) {
  installFetch();
  const response = await post(env({ plan }));
  assert.equal(response.status, 402, `${plan} is refused`);
  assert.equal(engineCalls, 0, `${plan} issues zero engine calls`);
}

/* --- cap 8: the public checker takes exactly one sample -------------------- */
class Kv {
  constructor() { this.v = new Map(); }
  async get(k, t) { const x = this.v.get(k) ?? null; return t === "json" && x ? JSON.parse(x) : x; }
  async put(k, x) { this.v.set(k, x); }
}
installFetch();
const kv = new Kv();
const publicEnv = { WEBMCP_KV: kv, PERPLEXITY_API_KEY: "pk" };
const first = await handleApi(new Request("https://w.test/api/aeo/mention?url=https%3A%2F%2Fcap.example.com"), publicEnv, ctx);
const firstBody = await first.json();
assert.equal(firstBody.sample_size, 1, "the public checker takes exactly one sample");
assert.equal(engineCalls, 1, "the public checker issues exactly one engine call");
assert.equal("appearance_rate" in firstBody, false, "a single public sample is never presented as a rate");
await handleApi(new Request("https://w.test/api/aeo/mention?url=https%3A%2F%2Fcap.example.com"), publicEnv, ctx);
assert.equal(engineCalls, 1, "a repeat public check is served from cache with no further engine call");

/* --- cap 9: a deliberately shrunken budget stops hard --------------------- */
// The run is capped by the remaining budget, so shrinking it to N must produce
// exactly N engine calls and zero at N=0 - the fail-safe for a drained quota.
for (const shrunk of [0, 1, 2, 5]) {
  installFetch();
  const result = await measureSov({ PERPLEXITY_API_KEY: "pk" }, profile, {
    questions: Array.from({ length: 20 }, (u, i) => `q${i}`),
    budget: shrunk,
  });
  assert.equal(engineCalls, shrunk, `a budget of ${shrunk} issues exactly ${shrunk} engine calls`);
  assert.equal(result.queries_used, shrunk, `usage reports ${shrunk}`);
  if (shrunk === 0) {
    assert.equal(result.answers_received, 0, "a zero budget produces no answers");
    assert.equal(result.appearance_rate, null, "a zero budget reports no rate");
    assert.equal(result.rate_basis, "no_answers", "a zero budget says why there is no rate");
  }
  if (shrunk > 0 && shrunk < SOV_MIN_SAMPLES_FOR_RATE) {
    assert.equal(result.appearance_rate, null, `a budget of ${shrunk} is below the rate threshold`);
    assert.equal(result.rate_basis, "insufficient_samples", "the sub-threshold reason is stated");
  }
  if (shrunk >= SOV_MIN_SAMPLES_FOR_RATE) {
    assert.equal(result.rate_basis, "measured", `a budget of ${shrunk} is enough to report a rate`);
  }
}

console.log("SoV cost-cap tests passed");
