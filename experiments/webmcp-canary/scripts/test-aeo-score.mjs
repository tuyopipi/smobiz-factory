import assert from "node:assert/strict";
import { AEO_SCORE_WEIGHTS, buildAeoChecks, extractAeoSignals, gateCrawlers, scoreAeo } from "../worker/aeo-score.mjs";
import { DEFAULT_SCORING } from "../worker/aeo-rules.mjs";

const excellent = {
  aiCrawlersAllowed: true, edgeBlocked: false, serverRenderedHtml: true,
  jsonLdInRawHtml: true, schemaTypeMatches: true, schemaValid: true, schemaCoreProps: 1,
  coreFieldsFilled: 1, bizSpecificFilled: 1, factsInText: 1,
  hasHeadingStructure: true, hasFaq: true, llmsTxtPresent: true, llmsTxtQuality: 1,
  consistent: true, freshSignals: true,
};
assert.deepEqual(scoreAeo(excellent).score, 100);
assert.equal(scoreAeo(excellent).band, "green");
assert.deepEqual(AEO_SCORE_WEIGHTS, { schema: 30, coverage: 25, legibility: 20, llms: 15, consistency: 10 });

const blocked = scoreAeo({ ...excellent, aiCrawlersAllowed: false });
assert.equal(blocked.gatePassed, false);
assert.equal(blocked.score, 15);
assert.equal(blocked.band, "red");

const poor = scoreAeo({ aiCrawlersAllowed: true, edgeBlocked: false, serverRenderedHtml: true });
assert.equal(poor.score, 0);
assert.equal(poor.band, "red");

const half = scoreAeo({
  ...excellent,
  schemaCoreProps: 0.79,
  coreFieldsFilled: 0.5,
  bizSpecificFilled: 0.25,
  factsInText: 0.5,
  hasHeadingStructure: false,
  hasFaq: false,
  llmsTxtQuality: 0.69,
  freshSignals: false,
});
assert.deepEqual(half.statuses, { schema: "WARN", coverage: "WARN", legibility: "BAD", llms: "WARN", consistency: "WARN" });
// 49 rather than 40 since u1-v2: the schema component is proportional to the
// properties actually met, so 0.79 of the criteria earns 0.79 of the thirty
// points instead of the flat half a WARN band used to give. The status is
// still WARN - what changed is the arithmetic behind it, not the verdict.
assert.equal(half.score, 49);
assert.equal(Math.round(half.metrics.schema * 100), 79, "and the factor is reported, so a score can be explained");

// The band is still coarse where coarseness is right: no markup at all is zero,
// not a fraction of something.
assert.equal(scoreAeo({ ...excellent, jsonLdInRawHtml: false }).statuses.schema, "BAD");
assert.equal(scoreAeo({ ...excellent, jsonLdInRawHtml: false }).metrics.schema, 0);

// Markup that exists but cannot be trusted earns half credit on its properties:
// present, but nothing can rely on it.
const wrongType = scoreAeo({ ...excellent, schemaTypeMatches: false });
assert.equal(Math.round(wrongType.metrics.schema * 100), 50, "an unrecognised type halves the component");
assert.equal(wrongType.statuses.schema, "WARN");
const invalid = scoreAeo({ ...excellent, schemaValid: false });
assert.equal(Math.round(invalid.metrics.schema * 100), 50, "and so does malformed JSON-LD");

// A site meeting more of the criteria always scores at least as well as one
// meeting fewer - the property that made the old band unfair when the criteria
// moved.
let previous = -1;
for (const met of [0, 0.25, 0.5, 0.75, 1]) {
  const score = scoreAeo({ ...excellent, schemaCoreProps: met }).score;
  assert.ok(score >= previous, `the score rises with the share of criteria met: ${met} -> ${score}`);
  previous = score;
}

// WebMCP is intentionally not an AEO scoring signal.
assert.deepEqual(scoreAeo({ ...excellent, webmcpTools: 0 }), scoreAeo({ ...excellent, webmcpTools: 999 }));

const robots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "PerplexityBot", "Google-Extended", "Applebot-Extended"]
  .map((bot) => `User-agent: ${bot}\nAllow: /`).join("\n\n");
const html = `<!doctype html><html><head><title>鮨なみ</title><meta name="last-modified" content="2026-10-01">
<link rel="canonical" href="https://example.com"><script type="application/ld+json">{
"@context":"https://schema.org","@type":"Restaurant","name":"鮨なみ","url":"https://example.com",
"address":"東京都千代田区1-1","telephone":"03-1234-5678","openingHours":"Mo-Su 11:00-22:00",
"geo":{"latitude":35,"longitude":139},"hasMenu":"https://example.com/menu","priceRange":"¥¥","serviceType":"飲食"
}</script></head><body><h1>鮨なみ</h1><h2>店舗情報</h2><p>住所: 東京都千代田区1-1 電話: 03-1234-5678 営業時間: 月曜 11:00-22:00 公式サイト https://example.com 緯度35 経度139</p><h2>FAQ よくある質問</h2><p>メニューとサービス、価格 ¥¥ を掲載しています。</p></body></html>`;
const llms = "# 鮨なみ\n\n公式情報です。店舗とメニューを案内します。\n- URL: https://example.com\n- 住所: 東京都千代田区1-1\n- 電話: 03-1234-5678\n- 営業時間: 11:00-22:00\n";
const extracted = extractAeoSignals(html, robots, llms, { edgeBlocked: false, llmsPresent: true });
assert.equal(extracted.aiCrawlersAllowed, true);
assert.equal(extracted.jsonLdInRawHtml, true);
assert.equal(extracted.schemaValid, true);
assert.equal(scoreAeo(extracted).band, "yellow", "missing common schema fields reduce completeness");
const checks = buildAeoChecks(extracted, scoreAeo(extracted));
assert.equal(checks.length, 8);
assert.ok(checks.every((check) => ["OK", "WARN", "BAD"].includes(check.status)));
assert.ok(checks.every((check) => typeof check.id === "string" && typeof check.label === "string" && typeof check.message === "string" && typeof check.fixable === "boolean"));

// Blocking an AI search crawler fails the gate.
const denied = extractAeoSignals(html, "User-agent: OAI-SearchBot\nDisallow: /", llms, { llmsPresent: true });
assert.equal(denied.aiCrawlersAllowed, false);
assert.equal(scoreAeo(denied).score, 15);
const deniedEverything = extractAeoSignals(html, "User-agent: *\nDisallow: /", llms, { llmsPresent: true });
assert.equal(deniedEverything.aiCrawlersAllowed, false, "blocking every crawler fails the gate");

// Blocking training crawlers is the owner's choice and costs nothing, even when
// an older ruleset in the database still lists them.
const trainingBlocked = "User-agent: GPTBot\nDisallow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n\nUser-agent: Google-Extended\nDisallow: /\n\nUser-agent: CCBot\nDisallow: /\n";
assert.equal(extractAeoSignals(html, trainingBlocked, llms, { llmsPresent: true }).aiCrawlersAllowed, true,
  "blocking training crawlers does not fail the gate");
const legacyScoring = { ...DEFAULT_SCORING, aiCrawlers: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "PerplexityBot", "Google-Extended", "Applebot-Extended"] };
assert.deepEqual(gateCrawlers(legacyScoring), ["OAI-SearchBot", "ChatGPT-User", "PerplexityBot"], "training bots are dropped from a legacy ruleset's list");
assert.equal(extractAeoSignals(html, trainingBlocked, llms, { llmsPresent: true, scoring: legacyScoring }).aiCrawlersAllowed, true,
  "a legacy ruleset listing training bots does not penalise blocking them");
assert.deepEqual(gateCrawlers({ ...DEFAULT_SCORING, aiCrawlers: ["GPTBot"] }), ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User"],
  "a list with only training bots falls back to the search crawlers");

/* ---------------- edge probe: a failed request is unknown, not blocked ---------------- */
{
  const { diagnoseAeoUrl, detectEdgeBlock, localizeAeoChecks } = await import("../worker/aeo-score.mjs");
  const { buildSiteRecommendations } = await import("../worker/recommendations.mjs");
  const site = (head) => async (url, init = {}) => {
    if (init.method === "HEAD") return head();
    const href = String(url);
    if (href.endsWith("/robots.txt")) return new Response(robots, { status: 200 });
    if (href.endsWith("/llms.txt")) return new Response(llms, { status: 200 });
    return new Response(html, { status: 200, headers: { "content-type": "text/html" } });
  };
  const timeout = () => { throw new DOMException("The operation was aborted.", "AbortError"); };
  const reset = () => { throw new TypeError("fetch failed"); };
  assert.equal(await detectEdgeBlock(site(timeout), "https://example.com/"), "unknown");
  assert.equal(await detectEdgeBlock(site(reset), "https://example.com/"), "unknown");
  assert.equal(await detectEdgeBlock(site(() => new Response(null, { status: 403 })), "https://example.com/"), "blocked");
  assert.equal(await detectEdgeBlock(site(() => new Response(null, { status: 429 })), "https://example.com/"), "blocked");
  assert.equal(await detectEdgeBlock(site(() => new Response(null, { status: 503, headers: { "cf-mitigated": "challenge" } })), "https://example.com/"), "blocked", "a CDN challenge is a block");
  assert.equal(await detectEdgeBlock(site(() => new Response(null, { status: 405 })), "https://example.com/"), "open", "a server that refuses HEAD is not blocking bots");

  const open = await diagnoseAeoUrl("https://example.com/", { fetchImpl: site(() => new Response(null, { status: 200 })) });
  const unknown = await diagnoseAeoUrl("https://example.com/", { fetchImpl: site(timeout) });
  const blocked = await diagnoseAeoUrl("https://example.com/", { fetchImpl: site(() => new Response(null, { status: 403 })) });
  // Before: a timed-out HEAD capped this reachable page at 15.
  assert.equal(unknown.gatePassed, true, "an unknown edge does not fail the gate");
  assert.equal(unknown.score, open.score, "and costs nothing");
  assert.ok(unknown.score > 15);
  assert.equal(blocked.gatePassed, false);
  assert.ok(blocked.score <= 15, "a real 403 still caps the score");
  const edge = (r) => r.checks.find((c) => c.id === "edge_access");
  assert.equal(edge(open).status, "OK");
  assert.equal(edge(blocked).status, "BAD");
  assert.equal(edge(unknown).status, "WARN", "not shown as a pass we never saw");
  assert.equal(edge(unknown).unknown, true);
  assert.match(edge(unknown).message, /確認できませんでした/, "the checklist says it could not be checked");
  assert.match(localizeAeoChecks(unknown.checks, "en").find((c) => c.id === "edge_access").message, /could not check edge access/);
  const recs = buildSiteRecommendations({ checks: unknown.checks, profile: {}, scoredProps: [], publishedProps: [], plan: "standard", stored: [], lang: "ja" });
  assert.ok(!JSON.stringify(recs).includes("edge_access"), "an unrun check is not turned into advice");
}

console.log("AEO score unit tests passed");
