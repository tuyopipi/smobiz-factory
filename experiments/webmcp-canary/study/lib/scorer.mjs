/**
 * Score one homepage exactly as GET /api/aeo/score does (worker/api.mjs),
 * then recover the component values the public response does not expose.
 *
 * /api/aeo/score calls diagnoseAeoUrl(url, { schemaRules, scoring,
 * rulesetVersion }) with the active ruleset from D1. Locally there is no D1,
 * so the ruleset is INITIAL_AEO_RULESET (what the API also falls back to when
 * env.DB is absent), or a definition exported from production and passed with
 * --ruleset-json. The model version is recorded with every score.
 *
 * Components: diagnoseAeoUrl returns per-check statuses but not the schema
 * factor or the raw (pre-gate) score. The fetches it makes are recorded and
 * the same exported functions (extractAeoSignals + scoreAeo) are re-run on the
 * same bytes; the total must match diagnoseAeoUrl's, or the row is flagged.
 */
import { diagnoseAeoUrl, extractAeoSignals, scoreAeo } from "../../worker/aeo-score.mjs";
import { INITIAL_AEO_RULESET } from "../../worker/aeo-rules.mjs";

export const COMPONENTS = Object.freeze(["schema", "coverage", "legibility", "llms", "consistency"]);

export async function scoreSite(url, { fetchImpl = fetch, definition = INITIAL_AEO_RULESET.definition, rulesetVersion = INITIAL_AEO_RULESET.version } = {}) {
  const seen = new Map();
  const recording = async (href, init = {}) => {
    const response = await fetchImpl(href, init);
    if ((init.method || "GET").toUpperCase() === "GET") {
      const copy = response.clone();
      seen.set(href, { ok: response.ok, text: response.ok ? await copy.text().catch(() => "") : "" });
    }
    return response;
  };
  const scoring = definition.scoring;
  const result = await diagnoseAeoUrl(url, { fetchImpl: recording, schemaRules: definition.schema, scoring, rulesetVersion });
  const target = new URL(url);
  target.hash = "";
  const page = seen.get(target.href)?.text ?? "";
  const robots = seen.get(new URL("/robots.txt", target.origin).href) || { ok: false, text: "" };
  const llms = seen.get(new URL("/llms.txt", target.origin).href) || { ok: false, text: "" };
  const edge = result.checks.find((c) => c.id === "edge_access");
  const signals = extractAeoSignals(page, robots.ok ? robots.text : "", llms.ok ? llms.text : "", {
    edgeBlocked: edge?.status === "BAD",
    edgeUnknown: edge?.unknown === true,
    llmsPresent: llms.ok,
    schemaRules: definition.schema,
    scoring,
  });
  const recomputed = scoreAeo(signals, scoring);
  const weights = scoring.weights;
  const factors = { ...Object.fromEntries(COMPONENTS.map((id) => [id, scoring.statusFactors[recomputed.statuses[id]]])), schema: recomputed.metrics.schema };
  const points = Object.fromEntries(COMPONENTS.map((id) => [id, round2(weights[id] * factors[id])]));
  const rawScore = Math.round(COMPONENTS.reduce((s, id) => s + weights[id] * factors[id], 0));
  const status = (id) => result.checks.find((c) => c.id === id)?.status || null;
  return {
    ok: true,
    url,
    host: result.host,
    score: result.score,
    band: result.band,
    gate_passed: result.gatePassed,
    raw_score: rawScore,
    gate_cap: scoring.gateCap,
    ...Object.fromEntries(COMPONENTS.map((id) => [`pts_${id}`, points[id]])),
    ...Object.fromEntries(COMPONENTS.map((id) => [`st_${id}`, recomputed.statuses[id]])),
    schema_factor: round2(recomputed.metrics.schema),
    gate_crawlers: status("ai_crawlers_allowed"),
    gate_edge: status("edge_access"),
    gate_ssr: status("server_rendered_html"),
    llms_txt_present: llms.ok,
    json_ld_in_html: signals.jsonLdInRawHtml,
    consistent_with_api: recomputed.score === result.score,
    model_version: result.modelVersion,
    ruleset_version: result.rulesetVersion,
    scanned_at: result.scannedAt,
  };
}

function round2(x) { return Math.round(x * 100) / 100; }
