import assert from "node:assert/strict";
import { handleApi, runSovWeeklyBatch } from "../worker/api.mjs";
import { SOV_LIMITS } from "../worker/aeo-sov.mjs";

const SITE_ID = "site-pro";
const CSRF = "a".repeat(64);
const SESSION = "nrv_session=tok";
// State-changing endpoints sit behind the shared CSRF gate, so a POST must
// carry the matching cookie and header exactly as the dashboard does.
const SESSION_CSRF = `${SESSION}; nrv_csrf=${CSRF}`;
const PAGE_HTML = `<!doctype html><html><head>
<script type="application/ld+json">{"@type":"CafeOrCoffeeShop","name":"栞珈琲","additionalType":"カフェ","address":{"addressLocality":"渋谷区"}}</script>
</head><body><h1>栞珈琲</h1><p>渋谷区の喫茶店です。</p></body></html>`;

const ANSWER = {
  choices: [{ message: { content: "渋谷区なら栞珈琲がおすすめです。https://pro.example.com/" } }],
  citations: ["https://pro.example.com/hours", "https://rival.example.net/"],
};

/** Minimal D1 double that records writes so caps and persistence are checkable. */
function makeEnv({ plan = "pro", keys = {}, usage = 0, runs = [] } = {}) {
  const writes = [];
  const usageByKey = new Map();
  if (usage) usageByKey.set(`${SITE_ID}|${new Date().toISOString().slice(0, 7)}`, usage);
  const sovRuns = [...runs];

  const DB = {
    prepare(sql) {
      const statement = {
        bind(...values) {
          return {
            async first() {
              if (sql.includes("FROM sessions")) {
                return { member_id: "m1", org_id: "org1", email: "owner@example.com", role: "admin", status: "active", expires_at: Date.now() + 3600e3 };
              }
              if (sql.includes("FROM sites WHERE id=? AND org_id=?") || sql.includes("FROM sites WHERE id=?")) {
                return values[0] === SITE_ID
                  ? { id: SITE_ID, org_id: "org1", url: "pro.example.com", website_uri: "https://pro.example.com", slug: null, plan, install_type: "tag", delivery_status: "active" }
                  : null;
              }
              if (sql.includes("FROM site_settings")) return { name: "栞珈琲", business_type: "喫茶店", address: "東京都渋谷区神宮前1-2-3" };
              if (sql.includes("FROM aeo_sov_usage")) {
                return { queries_used: usageByKey.get(`${values[0]}|${values[1]}`) || 0 };
              }
              return null;
            },
            async all() {
              if (sql.includes("FROM aeo_sov_runs")) return { results: sovRuns };
              if (sql.includes("FROM aeo_scores")) {
                return { results: [{ scanned_at: new Date().toISOString(), score: 64, verdict: "yellow" }] };
              }
              if (sql.includes("FROM sites")) {
                return { results: plan === "pro" ? [{ id: SITE_ID, url: "pro.example.com", website_uri: "https://pro.example.com", plan, delivery_status: "active" }] : [] };
              }
              return { results: [] };
            },
            async run() {
              writes.push({ sql, values });
              if (sql.includes("INSERT INTO aeo_sov_usage")) {
                const key = `${values[0]}|${values[1]}`;
                usageByKey.set(key, (usageByKey.get(key) || 0) + Number(values[2]));
              }
              if (sql.includes("INSERT INTO aeo_sov_runs")) {
                sovRuns.unshift({
                  id: values[0], ran_at: values[2], status: values[3], trigger: values[4],
                  appearance_rate: values[10], citation_rate: values[11], confidence: values[12],
                  questions_asked: values[7], answers_received: values[8], queries_used: values[9],
                  competitors_json: values[13], engines_json: values[6],
                });
              }
              return { success: true };
            },
          };
        },
        async first() { return null; },
        async all() { return { results: [] }; },
      };
      return statement;
    },
  };
  return { DB, ...keys, writes, usageByKey, sovRuns, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp" };
}

/** Engine + page fetch stub. Counts only engine calls. */
function installFetch({ answers = Infinity } = {}) {
  const calls = { engine: 0, page: 0 };
  globalThis.fetch = async (input, init = {}) => {
    const href = typeof input === "string" ? input : input.url;
    if (href.includes("api.perplexity.ai") || href.includes("api.openai.com")) {
      calls.engine += 1;
      if (calls.engine > answers) return new Response("{}", { status: 500 });
      return new Response(JSON.stringify(ANSWER), { status: 200, headers: { "content-type": "application/json" } });
    }
    calls.page += 1;
    if (init.method === "HEAD") return new Response(null, { status: 200 });
    return new Response(PAGE_HTML, { status: 200, headers: { "content-type": "text/html" } });
  };
  return calls;
}

const ctx = { waitUntil() {} };
const get = (path, env, headers = {}) => handleApi(new Request(`https://worker.test${path}`, { headers }), env, ctx);
const post = (path, env, headers = {}) => handleApi(new Request(`https://worker.test${path}`, {
  method: "POST",
  headers: { cookie: SESSION_CSRF, "x-csrf-token": CSRF, ...headers },
}), env, ctx);

/* ---------------- plan gating ---------------- */

for (const plan of ["free", "standard"]) {
  const env = makeEnv({ plan, keys: { PERPLEXITY_API_KEY: "pk" } });
  installFetch();
  const response = await get(`/api/sites/${SITE_ID}/sov`, env, { cookie: SESSION });
  assert.equal(response.status, 402, `${plan} is refused SoV with 402`);
  const body = await response.json();
  assert.equal(body.error, "upgrade_required", `${plan} is told an upgrade is required`);
  assert.equal(body.plan, plan, `${plan} is echoed back`);
  assert.equal(body.upgrade.required_plan, "pro", `${plan} is told which plan is needed`);
  // No price, and nothing to buy: Pro is beta and not on sale. A price beside a
  // plan that cannot be purchased reads as one you could pay today.
  assert.equal(body.upgrade.price_yen_monthly, undefined, `${plan} is shown no price for a plan that is not on sale`);
  assert.equal(body.upgrade.upgrade_url, undefined, `${plan} is given no checkout`);
  assert.equal(body.upgrade.coming_soon, true, `${plan} is told it is coming soon`);
  assert.equal(body.upgrade.purchasable, false, `${plan} is told it cannot be bought yet`);
  assert.ok(String(body.upgrade.message).includes("近日"), `${plan} is told so in words`);
  assert.equal(body.upgrade.price_label, undefined, `${plan} sees no price label either`);
  assert.equal(body.upgrade.details_url, "https://nurevo.jp/#pro-detail", `${plan} is pointed at what Pro does`);
  assert.equal(body.upgrade.plan_label, "Pro", `${plan} sees the Pro plan name`);
  assert.equal(body.upgrade.beta, true, `${plan} sees the beta label`);
  assert.equal("latest" in body, false, `${plan} receives no measurement payload`);
  assert.equal("trend" in body, false, `${plan} receives no trend payload`);

  const runResponse = await post(`/api/sites/${SITE_ID}/sov`, env);
  assert.equal(runResponse.status, 402, `${plan} cannot trigger a run`);
  assert.equal(env.writes.filter((write) => write.sql.includes("aeo_sov")).length, 0, `${plan} never touches SoV storage`);
}

const anonymous = await get(`/api/sites/${SITE_ID}/sov`, makeEnv({ keys: { PERPLEXITY_API_KEY: "pk" } }));
assert.equal(anonymous.status, 401, "an unauthenticated caller is rejected");

const foreign = await get("/api/sites/other-site/sov", makeEnv({ keys: { PERPLEXITY_API_KEY: "pk" } }), { cookie: SESSION });
assert.equal(foreign.status, 404, "an unknown site is not found");

/* ---------------- pro: unconfigured engines ---------------- */

{
  const env = makeEnv({ plan: "pro" });
  const calls = installFetch();
  const response = await get(`/api/sites/${SITE_ID}/sov`, env, { cookie: SESSION });
  assert.equal(response.status, 200, "pro with no engine key still gets a normal response");
  const body = await response.json();
  assert.equal(body.configured, false, "the unconfigured state is reported");
  assert.deepEqual(body.engines, [], "no engines are advertised");
  assert.deepEqual(body.supported, ["perplexity", "openai"], "the supported engines are still listed");
  assert.equal(body.latest, null, "no runs means no latest");
  assert.equal(body.limits.monthly_queries, SOV_LIMITS.monthlyQueriesPerSite, "the monthly cap is disclosed");
  assert.equal(body.limits.schedule, "weekly", "the weekly schedule is disclosed");
  assert.equal(body.beta, true, "the response is labelled beta");

  const runResponse = await post(`/api/sites/${SITE_ID}/sov`, env);
  assert.equal(runResponse.status, 200, "an unconfigured manual run succeeds rather than erroring");
  const runBody = await runResponse.json();
  assert.equal(runBody.status, "unconfigured", "the run reports the unconfigured status");
  assert.equal(runBody.appearance_rate, null, "no rate is invented without an engine");
  assert.equal(runBody.queries_used, 0, "no engine calls are made");
  assert.equal(calls.engine, 0, "no engine HTTP request was issued");
  assert.ok(env.writes.some((write) => write.sql.includes("INSERT INTO aeo_sov_runs")), "the unconfigured run is still recorded");
}

/* ---------------- pro: measured run ---------------- */

{
  const env = makeEnv({ plan: "pro", keys: { PERPLEXITY_API_KEY: "pk" } });
  const calls = installFetch();
  const response = await post(`/api/sites/${SITE_ID}/sov`, env);
  assert.equal(response.status, 200, "a pro manual run succeeds");
  const body = await response.json();
  assert.equal(body.status, "measured", "the run is measured");
  assert.equal(body.appearance_rate, 1, "the brand is found in every stubbed answer");
  assert.equal(body.citation_rate, 1, "the brand's own domain is cited in every stubbed answer");
  assert.ok(body.questions_asked > 0, "questions were generated");
  assert.equal(body.queries_used, calls.engine, "reported usage matches the engine calls issued");
  assert.ok(body.queries_used <= SOV_LIMITS.maxQuestionsPerRun * SOV_LIMITS.maxEnginesPerRun, "a run respects the per-run cap");
  assert.ok(body.competitors.some((competitor) => competitor.host === "rival.example.net"), "a cited competitor domain is reported");
  assert.equal(body.beta, true, "the measured run is labelled beta");
  assert.ok(body.run.id.startsWith("sov_"), "a run id is returned");
  assert.equal(body.usage.used, body.queries_used, "monthly usage was incremented by the calls issued");
  assert.ok(env.writes.some((write) => write.sql.includes("INSERT INTO aeo_sov_mentions")), "per-question samples are persisted");

  // The run just stored must now be visible as the latest with its trend.
  const follow = await get(`/api/sites/${SITE_ID}/sov`, env, { cookie: SESSION });
  const followBody = await follow.json();
  assert.equal(followBody.latest.status, "measured", "the stored run is returned as latest");
  assert.equal(followBody.latest.appearance_rate, 1, "the stored rate is returned");
  assert.equal(followBody.trend.length, 1, "the trend series contains the run");
  assert.ok(Array.isArray(followBody.latest.competitors), "competitors are parsed from storage");
}

/* ---------------- cost control ---------------- */

{
  // Near the cap: only the remaining allowance may be spent.
  const remaining = 3;
  const env = makeEnv({ plan: "pro", keys: { PERPLEXITY_API_KEY: "pk" }, usage: SOV_LIMITS.monthlyQueriesPerSite - remaining });
  const calls = installFetch();
  const body = await (await post(`/api/sites/${SITE_ID}/sov`, env)).json();
  assert.equal(calls.engine, remaining, "the run stops at the remaining monthly allowance");
  assert.equal(body.queries_used, remaining, "usage reports only what was spent");
  assert.equal(body.truncated, true, "a capped run is marked truncated");
  assert.equal(body.usage.remaining, 0, "the monthly budget is now exhausted");
}

{
  // At the cap: refused without issuing any engine call.
  const env = makeEnv({ plan: "pro", keys: { PERPLEXITY_API_KEY: "pk" }, usage: SOV_LIMITS.monthlyQueriesPerSite });
  const calls = installFetch();
  const response = await post(`/api/sites/${SITE_ID}/sov`, env);
  assert.equal(response.status, 429, "an exhausted monthly budget refuses the run");
  const body = await response.json();
  assert.equal(body.error, "monthly_quota_exhausted", "the refusal names the quota");
  assert.equal(body.usage.remaining, 0, "the caller is told nothing remains");
  assert.equal(calls.engine, 0, "no engine call is made once the cap is reached");
}

/* ---------------- weekly batch ---------------- */

{
  const env = makeEnv({ plan: "pro", keys: { PERPLEXITY_API_KEY: "pk" } });
  const calls = installFetch();
  const result = await runSovWeeklyBatch(env);
  assert.equal(result.status, "measured", "the batch runs when an engine is configured");
  assert.equal(result.sites, 1, "the batch selected the pro site");
  assert.equal(result.measured, 1, "the pro site was measured");
  assert.ok(calls.engine > 0, "the batch issued engine calls");
  assert.ok(
    env.writes.some((write) => write.sql.includes("INSERT INTO aeo_sov_runs") && write.values[4] === "scheduled"),
    "batch runs are recorded with the scheduled trigger",
  );
}

{
  const env = makeEnv({ plan: "pro" });
  const calls = installFetch();
  const result = await runSovWeeklyBatch(env);
  assert.equal(result.status, "unconfigured", "the batch is a no-op with no engine key");
  assert.equal(result.measured, 0, "nothing is measured");
  assert.equal(calls.engine, 0, "no engine call is made");
  assert.equal(env.writes.length, 0, "no storage is written");
}

{
  const env = makeEnv({ plan: "free", keys: { PERPLEXITY_API_KEY: "pk" } });
  const calls = installFetch();
  const result = await runSovWeeklyBatch(env);
  assert.equal(result.sites, 0, "the batch only selects pro sites");
  assert.equal(calls.engine, 0, "no engine call is made for non-pro sites");
}

/* ---------------- public lightweight checker ---------------- */

class MemoryKv {
  constructor() { this.values = new Map(); }
  async get(key, type) {
    const value = this.values.get(key) ?? null;
    return type === "json" && value ? JSON.parse(value) : value;
  }
  async put(key, value) { this.values.set(key, value); }
}

{
  const env = { WEBMCP_KV: new MemoryKv() };
  installFetch();
  const response = await get("/api/aeo/mention?url=https%3A%2F%2Fpro.example.com", env);
  assert.equal(response.status, 200, "the public checker responds without an engine key");
  const body = await response.json();
  assert.equal(body.status, "preparing", "with no key the public checker reports preparing");
  assert.equal(body.configured, false, "the unconfigured state is reported");
  assert.equal("mentioned" in body, false, "no mention verdict is invented");
}

{
  const env = { WEBMCP_KV: new MemoryKv(), PERPLEXITY_API_KEY: "pk" };
  const calls = installFetch();
  const first = await get("/api/aeo/mention?url=https%3A%2F%2Fpro.example.com", env);
  assert.equal(first.status, 200, "a configured public check succeeds");
  assert.equal(first.headers.get("x-aeo-cache"), "miss", "the first call is a cache miss");
  const body = await first.json();
  assert.equal(body.status, "measured", "the sample is measured");
  assert.equal(body.sample_size, 1, "exactly one sample is taken");
  assert.equal(body.mentioned, true, "the stubbed answer mentions the brand");
  assert.equal(body.brand, "栞珈琲", "the brand came from the page's own schema");
  assert.ok(body.question, "the question asked is disclosed");
  assert.ok(body.note.includes("Proプラン"), "the sample points at the Pro plan for real rates");
  assert.equal("appearance_rate" in body, false, "a single sample is never presented as a rate");
  assert.equal(calls.engine, 1, "exactly one engine call is made");

  const second = await get("/api/aeo/mention?url=https%3A%2F%2Fpro.example.com", env);
  assert.equal(second.headers.get("x-aeo-cache"), "hit", "a repeat call is served from cache");
  assert.equal(calls.engine, 1, "the cached call issues no further engine request");

  const invalid = await get("/api/aeo/mention?url=not-a-url", env);
  assert.equal(invalid.status, 400, "an invalid URL is rejected");
}

/* ---------------- monthly report endpoint ---------------- */

{
  const env = makeEnv({ plan: "pro", keys: { PERPLEXITY_API_KEY: "pk" } });
  installFetch();
  const body = await (await get(`/api/sites/${SITE_ID}/monthly-report`, env, { cookie: SESSION })).json();
  assert.equal(body.report.site.plan, "pro", "the report records the plan");
  assert.equal(body.delivery.email_enabled, false, "email delivery is not enabled");
  assert.equal(body.delivery.status, "generation_only", "the endpoint is generation-only");
  assert.ok(body.preview.text.includes("Nurevo AEO 月次レポート"), "a text preview is generated");

  const html = await get(`/api/sites/${SITE_ID}/monthly-report?format=html`, env, { cookie: SESSION });
  assert.equal(html.headers.get("content-type"), "text/html; charset=utf-8", "HTML format is served as HTML");
  assert.ok((await html.text()).startsWith("<!doctype html>"), "the HTML report is a full document");

  const text = await get(`/api/sites/${SITE_ID}/monthly-report?format=text`, env, { cookie: SESSION });
  assert.equal(text.headers.get("content-type"), "text/plain; charset=utf-8", "text format is served as plain text");
}

{
  const env = makeEnv({ plan: "free" });
  installFetch();
  const response = await get(`/api/sites/${SITE_ID}/monthly-report`, env, { cookie: SESSION });
  assert.equal(response.status, 200, "a free site can still generate its report");
  const body = await response.json();
  assert.equal(body.report.visibility.available, false, "the free report has no SoV figures");
  assert.equal(body.report.visibility.reason, "plan", "the free report explains why");
  assert.ok(body.report.readability.available, "the free report still carries the AEO score");
}

console.log("SoV endpoint tests passed");
