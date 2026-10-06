import assert from "node:assert/strict";
import {
  SOV_LIMITS, SOV_MIN_SAMPLES_FOR_RATE, SovError,
  aggregateSov, analyzeAnswer, availableEngines, brandedControlQuestions, buildBrandProfile, buildQuestionSet,
  engineStatus, localityFromAddress, measureSov, normalizeForMatch, normalizeHost, sovMonthKey,
} from "../worker/aeo-sov.mjs";
import { buildMonthlyReport, renderMonthlyReportHtml, renderMonthlyReportText } from "../worker/aeo-report.mjs";
import { CALIBRATION_MAX_DRIFT, CALIBRATION_MIN_SAMPLES, proposeWeights } from "../worker/aeo-calibration.mjs";
import { AEO_SCORE_WEIGHTS, extractSchemaNodes } from "../worker/aeo-score.mjs";

/* ---------------- engine configuration ---------------- */

assert.deepEqual(availableEngines({}), [], "no keys means no engines");
assert.equal(engineStatus({}).configured, false, "an unkeyed environment reports unconfigured");
assert.deepEqual(engineStatus({}).engines, [], "an unkeyed environment advertises no engines");

const bothKeys = { PERPLEXITY_API_KEY: "pk", OPENAI_API_KEY: "ok" };
const engines = availableEngines(bothKeys);
assert.equal(engines.length, 2, "both keys enable both engines");
assert.equal(engines[0].id, "perplexity", "the citation-capable engine is probed first");
assert.equal(engines[0].citations, true, "perplexity reports citation support");
assert.equal(engines[1].citations, false, "openai does not claim citation support");
assert.ok(
  availableEngines({ ...bothKeys, EXTRA: "x" }).length <= SOV_LIMITS.maxEnginesPerRun,
  "engine count never exceeds the per-run cap",
);
assert.equal(availableEngines({ PERPLEXITY_API_KEY: "   " }).length, 0, "a blank key does not enable an engine");

/* ---------------- brand profile from schema ---------------- */

const html = `<!doctype html><html><head>
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[
  {"@type":"WebSite","name":"Site"},
  {"@type":"CafeOrCoffeeShop","name":"栞珈琲","additionalType":"カフェ","address":{"@type":"PostalAddress","addressLocality":"渋谷区","addressRegion":"東京都"}}
]}</script></head><body><h1>栞珈琲</h1></body></html>`;
const schemas = extractSchemaNodes(html);
assert.equal(schemas.length, 2, "the typed @graph members are extracted (the untyped wrapper is not a node)");
assert.deepEqual(schemas.map((node) => node["@type"]), ["WebSite", "CafeOrCoffeeShop"], "graph order is preserved");

const profile = buildBrandProfile({ site: { website_uri: "https://shiori-coffee.example.jp/" }, settings: {}, schemas });
assert.equal(profile.name, "栞珈琲", "the business name comes from the business schema node, not the WebSite node");
assert.equal(profile.businessType, "カフェ", "the business type comes from additionalType");
assert.equal(profile.locality, "渋谷区", "the locality prefers addressLocality");
assert.equal(profile.host, "shiori-coffee.example.jp", "the host is normalized from the site URL");

const overridden = buildBrandProfile({
  site: { url: "shiori-coffee.example.jp" },
  settings: { name: "栞珈琲 本店", business_type: "喫茶店", address: "〒150-0001 東京都渋谷区神宮前1-2-3" },
  schemas,
});
assert.equal(overridden.name, "栞珈琲 本店", "owner-entered settings win over schema");
assert.equal(overridden.businessType, "喫茶店", "owner-entered type wins over schema");
assert.equal(overridden.locality, "渋谷区", "locality is parsed out of a free-text address");

assert.equal(localityFromAddress("〒530-0001 大阪府大阪市北区梅田1-1-1"), "大阪市", "ward/city is preferred over prefecture");
assert.equal(localityFromAddress("東京都"), "東京都", "a prefecture-only address still yields a locality");
assert.equal(localityFromAddress(""), "", "an empty address yields no locality");

assert.throws(
  () => buildBrandProfile({ site: {}, settings: {}, schemas: [] }),
  (error) => error instanceof SovError && error.code === "brand_name_unavailable",
  "a site with no identifiable name is rejected rather than measured against a guess",
);

/* ---------------- question set ---------------- */

const questions = buildQuestionSet(overridden);
assert.ok(questions.length > 0 && questions.length <= SOV_LIMITS.maxQuestionsPerRun, "question count respects the cap");
assert.equal(new Set(questions).size, questions.length, "questions are unique");
assert.ok(questions.some((question) => question.includes("渋谷区") && question.includes("喫茶店")), "questions combine locality and business type");
// A scheduled probe must never ask a question containing the business name:
// the answer would echo it and inflate the appearance rate.
assert.ok(
  questions.every((question) => !question.includes("栞珈琲 本店")),
  "the generated question set contains no branded question",
);
const controls = brandedControlQuestions(overridden, 1);
assert.equal(controls.length, 1, "a parser control question can be requested explicitly");
assert.equal(controls[0].kind, "branded", "control questions are tagged branded");
assert.ok(controls[0].text.includes("栞珈琲 本店"), "the control question names the business on purpose");
assert.equal(buildQuestionSet(overridden, 3).length, 3, "the question limit is honoured");
assert.equal(buildQuestionSet(overridden, 999).length <= SOV_LIMITS.maxQuestionsPerRun, true, "an oversized limit is clamped");

for (const question of questions) {
  // Template concatenation can emit two case particles in a row ("…ので人気の").
  // Valid sequences like "のところ" must not trip this, so only genuine
  // particle-on-particle pairs are rejected.
  assert.ok(!/の[でをに]|で[のをに]|を[のでに]/.test(question), `no doubled particle in: ${question}`);
  assert.ok(!question.includes("　") && !/\s{2,}/.test(question), `no collapsed whitespace left in: ${question}`);
}

const noContext = buildBrandProfile({ site: { url: "x.example.com" }, settings: { name: "Only Name" }, schemas: [] });
const noContextQuestions = buildQuestionSet(noContext);
assert.ok(noContextQuestions.length > 0, "a site with no type or locality still gets a question set");
for (const question of noContextQuestions) {
  assert.ok(!/^[のでを]/.test(question), `no leading particle when locality is absent: ${question}`);
  assert.ok(!/の[でをに]|で[のをに]/.test(question), `no doubled particle when locality is absent: ${question}`);
}

/* ---------------- answer analysis ---------------- */

const analysisProfile = { name: "栞珈琲", aliases: ["栞珈琲"], host: "shiori-coffee.example.jp" };

const hit = analyzeAnswer({
  answer: "渋谷のおすすめは栞珈琲です。詳細は https://shiori-coffee.example.jp/ をご覧ください。",
  citations: [{ url: "https://shiori-coffee.example.jp/hours" }, "https://tabelog.com/tokyo/x", "https://rival-cafe.example.com/"],
  profile: analysisProfile,
});
assert.equal(hit.mentioned, true, "a name in the answer counts as a mention");
assert.equal(hit.cited, true, "the brand's own domain in the citations counts as a citation");
assert.deepEqual(hit.competitorHosts, ["rival-cafe.example.com"], "aggregator and own-domain citations are excluded from competitors");

const miss = analyzeAnswer({ answer: "近くのカフェは見つかりませんでした。", citations: [], profile: analysisProfile });
assert.equal(miss.mentioned, false, "an answer without the brand is not a mention");
assert.equal(miss.cited, false, "no citations means no citation");
assert.deepEqual(miss.competitorHosts, [], "no citations means no competitors");

const mentionOnly = analyzeAnswer({ answer: "栞珈琲が人気です。", citations: ["https://rival.example.org/a"], profile: analysisProfile });
assert.equal(mentionOnly.mentioned, true, "a mention is independent of citation");
assert.equal(mentionOnly.cited, false, "a mention alone is not recorded as a citation");

const subdomain = analyzeAnswer({ answer: "x", citations: ["https://www.shiori-coffee.example.jp/a"], profile: analysisProfile });
assert.equal(subdomain.cited, true, "www and subdomains count as the same site");

assert.equal(normalizeForMatch("栞 珈琲"), "栞珈琲", "spaces are ignored when matching");
assert.equal(normalizeForMatch("ＣＡＦＥ"), "cafe", "full-width and case differences are normalized");
assert.equal(normalizeHost("https://www.Example.COM/path"), "example.com", "hosts are lowercased and de-www'd");
assert.equal(normalizeHost("not a url"), "", "an unparseable host yields an empty string");

const urlOnlyInText = analyzeAnswer({
  answer: "詳細: https://shiori-coffee.example.jp/menu",
  citations: [],
  profile: analysisProfile,
});
assert.equal(urlOnlyInText.cited, true, "a URL in the answer body serves as citation evidence when no list is returned");

/* ---------------- aggregation ---------------- */

const empty = aggregateSov([], analysisProfile);
assert.equal(empty.appearance_rate, null, "no answers yields no rate rather than zero");
assert.equal(empty.confidence, "none", "no answers reports no confidence");

const samples = [
  { ok: true, mentioned: true, cited: true, competitorHosts: ["a.example.com"] },
  { ok: true, mentioned: true, cited: false, competitorHosts: ["a.example.com", "b.example.com"] },
  { ok: true, mentioned: false, cited: false, competitorHosts: ["a.example.com"] },
  { ok: true, mentioned: false, cited: false, competitorHosts: [] },
  { ok: false, engine: "openai", error: "openai_http_500" },
];
const aggregate = aggregateSov(samples, analysisProfile);
assert.equal(aggregate.answers_received, 4, "failed probes are excluded from the denominator");
assert.equal(aggregate.questions_asked, 5, "the attempted count is still reported");
assert.equal(aggregate.appearance_rate, 0.5, "appearance rate uses successful answers only");
assert.equal(aggregate.citation_rate, 0.25, "citation rate uses successful answers only");
assert.equal(aggregate.competitors[0].host, "a.example.com", "competitors are ranked by appearances");
assert.equal(aggregate.competitors[0].appearances, 3, "competitor appearances are counted per answer");
assert.equal(aggregate.competitors[0].appearance_rate, 0.75, "competitor rate shares the answer denominator");
assert.equal(aggregate.confidence, "low", "a four-answer sample is reported as low confidence");
assert.equal(aggregate.beta, true, "results carry the beta flag");
assert.ok(aggregate.competitors.length <= 10, "the competitor list is bounded");

const duplicated = aggregateSov(
  [{ ok: true, mentioned: true, cited: false, competitorHosts: ["a.example.com", "a.example.com"] }],
  analysisProfile,
);
assert.equal(duplicated.competitors[0].appearances, 1, "a host repeated within one answer counts once");

/* ---------------- S1 integrity rules on real-shaped data ---------------- */

// A single answer is a data point, not a rate.
const onePositive = aggregateSov([{ ok: true, engine: "perplexity", mentioned: true, cited: true, competitorHosts: [] }], analysisProfile);
assert.equal(onePositive.answers_received, 1, "the single answer is still counted");
assert.equal(onePositive.appearance_rate, null, "one answer yields no appearance rate");
assert.equal(onePositive.citation_rate, null, "one answer yields no citation rate");
assert.equal(onePositive.rate_basis, "insufficient_samples", "the reason for the missing rate is stated");
assert.equal(onePositive.confidence, "none", "a sub-threshold sample carries no confidence");
assert.equal(onePositive.min_samples_for_rate, SOV_MIN_SAMPLES_FOR_RATE, "the threshold is disclosed");

const oneNegative = aggregateSov([{ ok: true, engine: "perplexity", mentioned: false, cited: false, competitorHosts: [] }], analysisProfile);
assert.equal(oneNegative.appearance_rate, null, "one non-appearance is not reported as 0%");

// Measured 0% and "could not measure" must not look the same.
const measuredZero = aggregateSov([
  { ok: true, engine: "perplexity", mentioned: false, cited: false, competitorHosts: [] },
  { ok: true, engine: "perplexity", mentioned: false, cited: false, competitorHosts: [] },
], analysisProfile);
assert.equal(measuredZero.appearance_rate, 0, "two non-appearances are a measured 0%");
assert.equal(measuredZero.rate_basis, "measured", "a measured zero says so");
const noAnswers = aggregateSov([{ ok: false, engine: "openai", error: "openai_http_500" }], analysisProfile);
assert.equal(noAnswers.appearance_rate, null, "no answers yields no rate");
assert.equal(noAnswers.rate_basis, "no_answers", "no answers is distinguished from a measured zero");
assert.notEqual(measuredZero.rate_basis, noAnswers.rate_basis, "0% and unmeasurable are distinguishable");

// Competitor rates obey the same threshold.
assert.equal(
  aggregateSov([{ ok: true, engine: "perplexity", mentioned: false, cited: false, competitorHosts: ["r.example.com"] }], analysisProfile).competitors[0].appearance_rate,
  null, "a competitor rate is withheld on a single sample too");

// Failed probes stay out of the denominator.
const withFailures = aggregateSov([
  { ok: true, engine: "perplexity", mentioned: true, cited: false, competitorHosts: [] },
  { ok: true, engine: "perplexity", mentioned: false, cited: false, competitorHosts: [] },
  { ok: false, engine: "openai", error: "openai_http_429" },
  { ok: false, engine: "openai", error: "timeout" },
], analysisProfile);
assert.equal(withFailures.answers_received, 2, "only successful probes form the denominator");
assert.equal(withFailures.appearance_rate, 0.5, "failures do not dilute the rate");
assert.equal(withFailures.questions_asked, 4, "attempts are still reported");

// Per-engine split: a live-search engine and a from-memory engine are separated.
const breakdown = Object.fromEntries(withFailures.by_engine.map((row) => [row.engine, row]));
assert.equal(breakdown.perplexity.answers, 2, "perplexity answers are counted");
assert.equal(breakdown.perplexity.live_search, true, "perplexity is marked as live search");
assert.equal(breakdown.perplexity.citations_available, true, "perplexity is marked citation-capable");
assert.equal(breakdown.openai.failures, 2, "openai failures are attributed to openai");
assert.equal(breakdown.openai.answers, 0, "a failed engine contributes no answers");
assert.equal(breakdown.openai.appearance_rate, null, "an engine with no answers has no rate");
assert.equal(breakdown.openai.live_search, false, "the chat engine is marked as not live search");

// Brand matching: exact containment of a vetted alias only.
const genericName = buildBrandProfile({
  site: { url: "cafe.example.com" },
  settings: { name: "カフェ", business_type: "カフェ" },
  schemas: [],
});
assert.deepEqual(genericName.aliases, ["カフェ"], "a derived alias identical to the business type is dropped");
const typeOnlyAnswer = analyzeAnswer({
  answer: "この地域にはカフェがたくさんあります。",
  citations: [],
  profile: { name: "栞珈琲 本店", aliases: ["栞珈琲 本店"], host: "x.example.com" },
});
assert.equal(typeOnlyAnswer.mentioned, false, "a near-miss is not counted as an appearance");
const partialAnswer = analyzeAnswer({
  answer: "栞という店が有名です。",
  citations: [],
  profile: { name: "栞珈琲", aliases: ["栞珈琲"], host: "x.example.com" },
});
assert.equal(partialAnswer.mentioned, false, "a prefix of the brand name is not an appearance");

// Aggregators never count as a competitor appearance.
const aggregatorOnly = analyzeAnswer({
  answer: "詳しくは食べログで。",
  citations: ["https://tabelog.com/tokyo/x", "https://www.google.com/maps/y", "https://real-rival.example.net/"],
  profile: analysisProfile,
});
assert.deepEqual(aggregatorOnly.competitorHosts, ["real-rival.example.net"], "directory sites are excluded from competitors");

// A branded control must not move the headline rate.
const withControl = aggregateSov([
  { ok: true, engine: "perplexity", kind: "discovery", mentioned: false, cited: false, competitorHosts: [] },
  { ok: true, engine: "perplexity", kind: "discovery", mentioned: false, cited: false, competitorHosts: [] },
  { ok: true, engine: "perplexity", kind: "branded", mentioned: true, cited: true, competitorHosts: [] },
], analysisProfile);
assert.equal(withControl.appearance_rate, 0, "a branded hit does not lift the discovery rate");
assert.equal(withControl.answers_received, 2, "only discovery answers form the denominator");
assert.equal(withControl.questions_asked, 2, "the control is not counted as a measured question");
assert.equal(withControl.parser_control.asked, 1, "the control is reported separately");
assert.equal(withControl.parser_control.detected, 1, "the parser found the brand in the control answer");
assert.equal(withControl.parser_control.excluded_from_rate, true, "the control is flagged as excluded");
assert.equal(withControl.by_engine[0].answers, 2, "the per-engine split also excludes controls");
assert.equal(
  aggregateSov([{ ok: true, engine: "perplexity", kind: "discovery", mentioned: true, cited: false, competitorHosts: [] }], analysisProfile).parser_control,
  null, "no control question means no control section");

/* ---------------- measurement, budget and engine failure ---------------- */

function engineStub(responses) {
  const calls = [];
  return {
    calls,
    fetchImpl: async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body) });
      const next = responses.shift();
      if (!next) return new Response("{}", { status: 500 });
      if (next.status && next.status !== 200) return new Response("{}", { status: next.status });
      return new Response(JSON.stringify(next.body), { status: 200, headers: { "content-type": "application/json" } });
    },
  };
}

const unconfigured = await measureSov({}, overridden);
assert.equal(unconfigured.status, "unconfigured", "no engine key returns unconfigured rather than an error");
assert.equal(unconfigured.configured, false, "unconfigured results say so");
assert.equal(unconfigured.queries_used, 0, "an unconfigured run issues no calls");
assert.equal(unconfigured.appearance_rate, null, "an unconfigured run reports no rate");
assert.deepEqual(unconfigured.samples, [], "an unconfigured run produces no samples");

const perplexityAnswer = {
  body: { choices: [{ message: { content: "栞珈琲 本店 がおすすめです。" } }], citations: ["https://shiori-coffee.example.jp/"] },
};
const stub = engineStub([perplexityAnswer, perplexityAnswer, perplexityAnswer]);
const measured = await measureSov({ PERPLEXITY_API_KEY: "pk" }, overridden, {
  questions: ["q1", "q2", "q3"],
  fetchImpl: stub.fetchImpl,
});
assert.equal(measured.status, "measured", "a configured engine produces a measured result");
assert.equal(measured.queries_used, 3, "one call per question per engine");
assert.equal(measured.appearance_rate, 1, "every answer mentioning the brand gives a rate of 1");
assert.equal(stub.calls.length, 3, "exactly the expected number of engine calls were made");
assert.ok(stub.calls[0].url.includes("api.perplexity.ai"), "the perplexity endpoint is used");

const budgetStub = engineStub([perplexityAnswer, perplexityAnswer]);
const budgeted = await measureSov({ PERPLEXITY_API_KEY: "pk" }, overridden, {
  questions: ["q1", "q2", "q3", "q4", "q5"],
  budget: 2,
  fetchImpl: budgetStub.fetchImpl,
});
assert.equal(budgetStub.calls.length, 2, "the budget hard-caps the number of engine calls");
assert.equal(budgeted.queries_used, 2, "usage reflects the calls actually issued");
assert.equal(budgeted.truncated, true, "a budget-limited run is marked truncated");

const twoEngineStub = engineStub([perplexityAnswer, { body: { choices: [{ message: { content: "no match" } }] } }]);
const twoEngine = await measureSov(bothKeys, overridden, { questions: ["q1"], fetchImpl: twoEngineStub.fetchImpl });
assert.equal(twoEngineStub.calls.length, 2, "each question is asked of every configured engine");
assert.equal(twoEngine.appearance_rate, 0.5, "one engine mentioning and one not gives 0.5");

const failingStub = engineStub([{ status: 500 }, perplexityAnswer]);
const partial = await measureSov({ PERPLEXITY_API_KEY: "pk" }, overridden, {
  questions: ["q1", "q2"],
  fetchImpl: failingStub.fetchImpl,
});
assert.equal(partial.answers_received, 1, "a failed probe is excluded from the denominator");
assert.equal(partial.appearances, 1, "an engine error does not count as a non-appearance");
// Only one answer survived, so the rate is withheld rather than reported as 100%.
assert.equal(partial.appearance_rate, null, "one surviving answer does not produce a rate");
assert.equal(partial.rate_basis, "insufficient_samples", "the withheld rate states its reason");
assert.equal(partial.samples.filter((sample) => !sample.ok).length, 1, "the failure is still recorded");
assert.ok(partial.samples.find((sample) => !sample.ok).error.includes("perplexity_http_500"), "the failure reason is captured");
assert.equal(partial.queries_used, 2, "a failed call still consumes budget");

assert.match(sovMonthKey(Date.parse("2026-03-15T00:00:00Z")), /^2026-03$/, "the month key is YYYY-MM");

/* ---------------- S2: the API key must not leave the provider ------------ */

// The probe sends the key in the Authorization header, so an endpoint override
// is only honoured for a loopback test double.
async function probedUrl(env) {
  let seen = null;
  const fetchImpl = async (url, init) => {
    seen = { url, auth: init.headers.authorization };
    return new Response(JSON.stringify({ choices: [{ message: { content: "x" } }], citations: [] }),
      { status: 200, headers: { "content-type": "application/json" } });
  };
  await measureSov(env, overridden, { questions: ["q"], fetchImpl });
  return seen;
}

const hijack = await probedUrl({ PERPLEXITY_API_KEY: "pk", PERPLEXITY_API_URL: "https://evil.example.com/collect" });
assert.ok(hijack.url.startsWith("https://api.perplexity.ai/"), "a remote endpoint override is ignored");
assert.ok(!hijack.url.includes("evil.example.com"), "the key is never sent to an injected host");

for (const bad of ["http://169.254.169.254/latest", "https://api.perplexity.ai.evil.com/x", "not-a-url", "//evil.example.com"]) {
  const attempt = await probedUrl({ PERPLEXITY_API_KEY: "pk", PERPLEXITY_API_URL: bad });
  assert.ok(attempt.url.startsWith("https://api.perplexity.ai/"), `override rejected: ${bad}`);
}

const localDouble = await probedUrl({ PERPLEXITY_API_KEY: "pk", PERPLEXITY_API_URL: "http://127.0.0.1:8799/chat/completions" });
assert.ok(localDouble.url.startsWith("http://127.0.0.1:8799/"), "a loopback test double is still usable");

// An engine with no key is never contacted at all.
let contacted = 0;
await measureSov({}, overridden, { questions: ["q"], fetchImpl: async () => { contacted += 1; return new Response("{}"); } });
assert.equal(contacted, 0, "an unconfigured environment issues zero engine requests");
const openAiOnly = await probedUrl({ OPENAI_API_KEY: "ok" });
assert.ok(openAiOnly.url.startsWith("https://api.openai.com/"), "a configured engine is probed even when the other has no key");

/* ---------------- monthly report ---------------- */

const scores = [
  { scanned_at: "2026-03-02T00:00:00.000Z", score: 52, verdict: "yellow" },
  { scanned_at: "2026-03-20T00:00:00.000Z", score: 71, verdict: "yellow" },
  { scanned_at: "2026-02-10T00:00:00.000Z", score: 30, verdict: "red" },
];

const freeReport = buildMonthlyReport({ site: { id: "s1", url: "a.example.com" }, plan: "free", month: "2026-03", scores });
assert.equal(freeReport.readability.score, 71, "the latest in-period score is reported");
assert.equal(freeReport.readability.delta, 19, "the in-period change is computed");
assert.equal(freeReport.readability.samples, 2, "out-of-period scores are excluded");
assert.equal(freeReport.visibility.available, false, "a free site has no SoV section");
assert.equal(freeReport.visibility.reason, "plan", "the free site is told why");
assert.ok(freeReport.visibility.upgrade_url, "the free report carries the upgrade link");
assert.ok(renderMonthlyReportText(freeReport).includes("Proプラン"), "the free text report shows the upgrade path");

const proReport = buildMonthlyReport({
  site: { id: "s1", url: "a.example.com" },
  plan: "pro",
  month: "2026-03",
  scores,
  sov: {
    latest: {
      status: "measured", ran_at: "2026-03-21T00:00:00.000Z", appearance_rate: 0.6, citation_rate: 0.2,
      confidence: "normal", answers_received: 20, questions_asked: 20,
      competitors: [{ host: "rival.example.com", appearances: 9, appearance_rate: 0.45 }], engines: [{ id: "perplexity" }],
    },
    trend: [{ ran_at: "2026-03-14T00:00:00.000Z", appearance_rate: 0.4 }, { ran_at: "2026-03-21T00:00:00.000Z", appearance_rate: 0.6 }],
  },
});
assert.equal(proReport.visibility.available, true, "a pro site with data gets the SoV section");
assert.equal(proReport.visibility.appearance_rate, 0.6, "the appearance rate is carried through");
assert.equal(Math.round(proReport.visibility.delta * 100), 20, "the change against the previous run is computed");
assert.equal(proReport.beta, true, "the report is labelled beta");
const proText = renderMonthlyReportText(proReport);
assert.ok(proText.includes("60%"), "the text report renders the appearance rate as a percentage");
// A change between two rates is in percentage points; rendering it as "%"
// would read as a relative change.
assert.ok(proText.includes("前回比: +20pt"), "a rate change is reported in percentage points");
assert.ok(!/前回比: \+20%/.test(proText), "a rate change is not reported as a percentage");
assert.ok(renderMonthlyReportHtml(proReport).includes("+20pt"), "the HTML report also uses percentage points");
assert.ok(proText.includes("rival.example.com"), "the text report lists competitors");
assert.ok(proText.includes("ベータ"), "the text report carries the beta label");
const proHtml = renderMonthlyReportHtml(proReport);
assert.ok(proHtml.startsWith("<!doctype html>"), "the HTML report is a complete document");
assert.ok(proHtml.includes("60%") && proHtml.includes("rival.example.com"), "the HTML report renders the metrics");

const unconfiguredReport = buildMonthlyReport({
  site: { id: "s1" }, plan: "pro", month: "2026-03", scores,
  sov: { latest: { status: "unconfigured", appearance_rate: null }, trend: [] },
});
assert.equal(unconfiguredReport.visibility.available, false, "an unconfigured engine yields no SoV figures");
assert.equal(unconfiguredReport.visibility.reason, "unconfigured", "the unconfigured state is named");
assert.ok(renderMonthlyReportText(unconfiguredReport).includes("未設定"), "the report says the engine is unset");

const noDataReport = buildMonthlyReport({ site: { id: "s1" }, plan: "pro", month: "2026-03", scores, sov: { latest: null, trend: [] } });
assert.equal(noDataReport.visibility.reason, "no_data", "a pro site with no runs yet is reported as such");

const emptyReport = buildMonthlyReport({ site: { id: "s1" }, plan: "free", month: "2026-09", scores: [] });
assert.equal(emptyReport.readability.available, false, "no scores means no readability figure");
assert.ok(renderMonthlyReportText(emptyReport).includes("今月の診断結果がありません"), "the empty report says so");

const escaped = renderMonthlyReportHtml(buildMonthlyReport({
  site: { id: "s1", url: '<script>alert(1)</script>' }, plan: "free", month: "2026-03", scores,
}));
assert.ok(!escaped.includes("<script>alert(1)</script>"), "report HTML escapes site-provided values");

/* ---------------- calibration scaffold ---------------- */

const thin = proposeWeights([{ appearance_rate: 0.5, statuses: { schema: "OK" } }]);
assert.equal(thin.applied, false, "a thin sample produces no applied change");
assert.equal(thin.reason, "insufficient_samples", "the reason names the sample shortfall");
assert.deepEqual(thin.proposed_weights, { ...AEO_SCORE_WEIGHTS }, "weights are unchanged below the sample floor");

const dimensions = Object.keys(AEO_SCORE_WEIGHTS);
const calibrationSamples = Array.from({ length: CALIBRATION_MIN_SAMPLES + 10 }, (unused, index) => {
  const passing = index % 2 === 0;
  const statuses = {};
  for (const id of dimensions) statuses[id] = passing ? "OK" : "BAD";
  // schema separates outcomes hardest: passers score far better on it.
  statuses.schema = index % 3 === 0 ? "OK" : "BAD";
  return { site_id: `s${index % 7}`, appearance_rate: (index % 3 === 0 ? 0.8 : 0.1), statuses };
});
const proposal = proposeWeights(calibrationSamples);
assert.equal(proposal.applied, false, "the proposal is recorded, never applied");
assert.equal(proposal.reason, "proposal_recorded", "a sufficient sample produces a recorded proposal");
assert.equal(proposal.samples, calibrationSamples.length, "the sample count is reported");
assert.ok(proposal.lift.schema > 0, "the strongest separating dimension shows positive lift");
for (const id of dimensions) {
  const drift = Math.abs(proposal.proposed_weights[id] - AEO_SCORE_WEIGHTS[id]);
  assert.ok(
    drift <= AEO_SCORE_WEIGHTS[id] * CALIBRATION_MAX_DRIFT + 0.05,
    `${id} weight drift stays within the clamp`,
  );
}
assert.deepEqual(proposal.current_weights, { ...AEO_SCORE_WEIGHTS }, "the live weights are reported unchanged");
assert.deepEqual(AEO_SCORE_WEIGHTS, { schema: 30, coverage: 25, legibility: 20, llms: 15, consistency: 10 }, "U1 weights remain fixed");

console.log("AEO SoV unit tests passed");
