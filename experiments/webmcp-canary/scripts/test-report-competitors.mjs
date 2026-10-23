/**
 * Two things the first real Pro report for a software business got wrong.
 *
 * 1. With no competitor registered, "share of voice" had nothing to share. A
 *    competitor registered after a run is counted against that run's stored
 *    evidence - every cited URL is kept - so the comparison fills in without
 *    asking an AI engine again, and says that it is a recount.
 * 2. The monthly report told every site to tidy its hours, address and prices.
 *    The advice now follows the business family the diagnosis recorded.
 */
import assert from "node:assert/strict";
import { buildProReport } from "../worker/pro-report.mjs";
import { buildMonthlyReport, businessFamilyFromChecks, renderMonthlyReportHtml, renderMonthlyReportText } from "../worker/aeo-report.mjs";

/* ---------------- competitors recounted from stored evidence ---------------- */
{
  const ev = (question, urls, cited = 0) => ({ id: question + urls.length, ok: 1, question, brand_cited: cited, citation_urls_json: JSON.stringify(urls), accuracy_json: JSON.stringify({ kind: "discovery" }) });
  const evidence = [
    ev("q1", ["https://aeogodmode.io/", "https://plugin.squirrly.co/geo/", "https://wordpress.org/plugins/squirrly-seo/", "https://aioseo.com/x", "https://en-gb.wordpress.org/plugins/x"]),
    ev("q2", ["https://aeogodmode.io/b", "https://citetrackai.com/", "https://www.lovedby.ai/", "https://haz.wordpress.org/plugins/y"]),
  ];
  const run = { id: "r1", status: "measured", detail_json: JSON.stringify({ query_set: { questions: ["q1", "q2"], repetitions: 1, competitors: [] }, cache_key: "k" }) };
  const config = { questions: ["q1", "q2"], repetitions: 1, competitors: ["yoast.com", "aioseo.com", "rankmath.com", "squirrly.co", "aeogodmode.io", "citetrackai.com"] };
  const report = buildProReport({ site: { id: "s", url: "nurevo.jp" }, run, runs: [run], evidence, config, configured: true });
  const row = (host) => report.competitors.find((r) => r.host === host);

  assert.equal(row("nurevo.jp").own, true);
  assert.equal(row("nurevo.jp").citations, 0);
  assert.equal(row("aeogodmode.io").citations, 2, "cited in both answers");
  assert.equal(row("squirrly.co").citations, 1, "plugin.squirrly.co counts for squirrly.co");
  assert.equal(row("aioseo.com").citations, 1);
  assert.equal(row("citetrackai.com").citations, 1);
  assert.equal(row("yoast.com").citations, 0, "a registered competitor nobody cited is shown as zero, not dropped");
  assert.equal(report.competitors.some((r) => /wordpress\.org/.test(r.host)), false, "the plugin directory is not a competitor");
  // Share of voice: 2 + 1 + 1 + 1 = 5 citations among registered domains.
  assert.equal(row("aeogodmode.io").share_of_voice, 2 / 5);
  assert.equal(row("nurevo.jp").share_of_voice, 0);
  assert.ok(row("aeogodmode.io").recounted && !row("nurevo.jp").recounted, "recounted rows are marked");
  assert.match(report.recount_note, /保存済みの引用URL/, "the report says it is a recount, not a new measurement");

  // A competitor that was part of the run's own query set is not a recount.
  const measured = buildProReport({ site: { id: "s", url: "nurevo.jp" }, run: { ...run, detail_json: JSON.stringify({ query_set: { questions: ["q1"], competitors: ["aeogodmode.io"] } }) }, evidence, config: null });
  assert.equal(measured.competitors.find((r) => r.host === "aeogodmode.io").recounted, false);
  assert.equal(measured.recount_note, null);
}

/* ---------------- next actions follow the business family ---------------- */
{
  const checks = (family) => JSON.stringify([{ id: "schema", fields: [{ entityType: family, field: "name" }, { entityType: "WebSite", field: "name" }] }]);
  assert.equal(businessFamilyFromChecks(checks("SoftwareApplication")), "software");
  assert.equal(businessFamilyFromChecks(checks("LocalBusiness")), "local");
  assert.equal(businessFamilyFromChecks(checks("Product")), "product");
  assert.equal(businessFamilyFromChecks("not json"), null);

  const sov = { latest: { status: "measured", appearance_rate: 0, citation_rate: 0, confidence: "low", answers_received: 2, questions_asked: 2, competitors: [], ran_at: "2026-10-19T16:40:36Z" }, trend: [] };
  const scores = [{ scanned_at: "2026-10-19T00:00:00Z", score: 100, verdict: "green" }];
  const shopAdvice = /営業時間・住所・価格/;

  const saas = buildMonthlyReport({ site: { id: "s", url: "nurevo.jp" }, plan: "pro", month: "2026-10", scores, sov, family: "software" });
  assert.equal(saas.business_family, "software");
  assert.equal(saas.next_steps.some((s) => shopAdvice.test(s)), false, "no shop advice for a software business");
  for (const topic of [/SoftwareApplication/, /比較・FAQ・ユースケース/, /第三者のメディア/, /llms\.txt/]) {
    assert.ok(saas.next_steps.some((s) => topic.test(s)), `software advice covers ${topic}`);
  }
  const local = buildMonthlyReport({ site: { id: "s" }, plan: "pro", month: "2026-10", scores, sov, family: "local" });
  assert.ok(local.next_steps.some((s) => shopAdvice.test(s)), "a shop still gets the shop advice");
  const unknown = buildMonthlyReport({ site: { id: "s" }, plan: "pro", month: "2026-10", scores, sov });
  assert.equal(unknown.next_steps.some((s) => shopAdvice.test(s)), false, "without a diagnosis, no industry is assumed");
  assert.ok(unknown.next_steps.some((s) => /業種に合わせた/.test(s)));

  // The comparison travels into the report and both renderings.
  const withComparison = buildMonthlyReport({ site: { id: "s", url: "nurevo.jp" }, plan: "pro", month: "2026-10", scores, sov, family: "software",
    comparison: { answers: 2, basis: "basis", recount_note: "recount", rows: [{ host: "nurevo.jp", own: true, citations: 0, frequency: 0, share_of_voice: 0 }, { host: "aeogodmode.io", citations: 2, frequency: 1, share_of_voice: 0.4 }] } });
  const html = renderMonthlyReportHtml(withComparison);
  assert.ok(html.includes("指定競合との比較") && html.includes("aeogodmode.io") && html.includes("40%") && html.includes("recount"));
  assert.ok(renderMonthlyReportText(withComparison).includes("aeogodmode.io: 引用 2回 / 頻度 100% / SoV 40%"));
  // Only the site itself: nothing to compare, so no section.
  assert.equal(buildMonthlyReport({ site: {}, plan: "pro", scores, sov, comparison: { rows: [{ host: "nurevo.jp", own: true, citations: 0 }] } }).comparison, null);
}
console.log("report competitor and next-action tests passed");
