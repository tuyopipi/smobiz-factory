import assert from "node:assert/strict";
import { AEO_SCORE_WEIGHTS, buildAeoChecks, extractAeoSignals, scoreAeo } from "../worker/aeo-score.mjs";

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
assert.equal(half.score, 40);

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
assert.equal(scoreAeo(extracted).band, "green");
const checks = buildAeoChecks(extracted, scoreAeo(extracted));
assert.equal(checks.length, 8);
assert.ok(checks.every((check) => ["OK", "WARN", "BAD"].includes(check.status)));
assert.ok(checks.every((check) => typeof check.id === "string" && typeof check.label === "string" && typeof check.message === "string" && typeof check.fixable === "boolean"));

const denied = extractAeoSignals(html, "User-agent: GPTBot\nDisallow: /", llms, { llmsPresent: true });
assert.equal(denied.aiCrawlersAllowed, false);
assert.equal(scoreAeo(denied).score, 15);

console.log("AEO score unit tests passed");
