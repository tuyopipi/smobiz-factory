const CUSTOMER_FIELDS = Object.freeze([
  { schema: "name", setting: "name", label: "店舗名", requiredKey: "name", present: (site) => !!site.name },
  { schema: "telephone", setting: "tel", label: "電話番号", present: (site) => !!site.tel },
  { schema: "address", setting: "address", label: "住所", present: (site) => !!site.address },
  { schema: "openingHours", setting: "hours", label: "営業時間", aliases: ["openingHoursSpecification"], present: (site) => !!site.hours },
  { schema: "geo", setting: "lat,lng", label: "緯度・経度", present: (site) => site.lat != null && site.lng != null },
  { schema: "additionalType", setting: "business_type", label: "業種", present: (site) => !!site.business_type },
  { schema: "priceRange", setting: "price_level|price", label: "価格帯", present: (site) => !!(site.price_level || site.price) },
  { schema: "image", setting: "image", label: "画像", present: (site) => !!site.image },
  { schema: "potentialAction", setting: "reserve_url", label: "予約URL", present: (site) => !!site.reserve_url },
]);

const isoNow = () => new Date().toISOString();
const runId = () => `aeol_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

function parseDefinition(row) {
  const definition = JSON.parse(row.definition_json);
  if (!definition?.schema || !definition?.llmsTxt || !definition?.robots || !definition?.defaults) throw new Error("active_ruleset_invalid");
  return definition;
}

function scoreHistoryBySite(rows) {
  const grouped = new Map();
  for (const row of rows || []) {
    const entry = grouped.get(row.site_id) || { scores: [], latestRulesetVersion: null };
    if (row.score != null) entry.scores.push(Number(row.score));
    if (entry.latestRulesetVersion == null && row.ruleset_version != null) entry.latestRulesetVersion = Number(row.ruleset_version);
    grouped.set(row.site_id, entry);
  }
  for (const entry of grouped.values()) entry.averageScore = entry.scores.length ? entry.scores.reduce((sum, value) => sum + value, 0) / entry.scores.length : null;
  return grouped;
}

function requiredAndRecommended(definition) {
  const required = new Set(definition.schema.required || []);
  const recommended = new Set(definition.schema.recommended || []);
  return { required, recommended };
}

function relevantField(field, sets) {
  const names = [field.schema, ...(field.aliases || [])];
  return names.some((name) => sets.required.has(name) || sets.recommended.has(name));
}

function analyzeSites(sites, scoreHistory, hitsBySite, definition, activeVersion) {
  const sets = requiredAndRecommended(definition);
  return (sites || []).map((site) => {
    const history = scoreHistory.get(site.id) || { scores: [], averageScore: null, latestRulesetVersion: null };
    const applicable = CUSTOMER_FIELDS.filter((field) => relevantField(field, sets));
    const missing = applicable.filter((field) => !field.present(site));
    const requiredMissing = missing.filter((field) => sets.required.has(field.requiredKey || field.schema));
    const recommendedMissing = missing.filter((field) => !requiredMissing.includes(field));
    return {
      ...site,
      averageScore: history.averageScore,
      latestScoreRulesetVersion: history.latestRulesetVersion,
      crawlerHits: Number(hitsBySite.get(site.id) || 0),
      rulesetLag: history.latestRulesetVersion != null && history.latestRulesetVersion < activeVersion,
      completeness: applicable.length ? (applicable.length - missing.length) / applicable.length : 1,
      missing,
      requiredMissing,
      recommendedMissing,
    };
  });
}

async function saveSiteRecommendations(env, analyses, version, learningRunId, now) {
  let open = 0;
  for (const site of analyses) {
    if (!site.missing.length) {
      await env.DB.prepare("UPDATE aeo_site_recommendations SET status='resolved',updated_at=?,learning_run_id=? WHERE site_id=? AND kind='missing_customer_data' AND status='open'")
        .bind(now, learningRunId, site.id).run();
      continue;
    }
    open += 1;
    const detail = {
      reason: "最新AEO rulesetの必須・推奨schema項目に、顧客確認が必要な店舗情報が不足しています。",
      missing_fields: site.missing.map((field) => ({ key: field.setting, schema: field.schema, label: field.label })),
      required_missing: site.requiredMissing.map((field) => field.setting),
      recommended_missing: site.recommendedMissing.map((field) => field.setting),
      active_ruleset_version: version,
      latest_score_ruleset_version: site.latestScoreRulesetVersion,
      ruleset_lag_detected: site.rulesetLag,
      action_required: true,
    };
    await env.DB.prepare(`
      INSERT INTO aeo_site_recommendations
        (site_id,kind,created_at,updated_at,detail_json,status,ruleset_version,learning_run_id)
      VALUES (?,'missing_customer_data',?,?,?,'open',?,?)
      ON CONFLICT(site_id,kind) DO UPDATE SET
        updated_at=excluded.updated_at,detail_json=excluded.detail_json,status='open',
        ruleset_version=excluded.ruleset_version,learning_run_id=excluded.learning_run_id
    `).bind(site.id, now, now, JSON.stringify(detail), version, learningRunId).run();
  }
  return open;
}

function correlationEvidence(analyses, definition) {
  const recommended = new Set(definition.schema.recommended || []);
  const fields = CUSTOMER_FIELDS.filter((field) => [field.schema, ...(field.aliases || [])].some((name) => recommended.has(name)));
  return fields.map((field) => {
    const present = analyses.filter((site) => field.present(site));
    const missing = analyses.filter((site) => !field.present(site));
    const average = (rows, key) => rows.length ? rows.reduce((sum, row) => sum + Number(row[key] || 0), 0) / rows.length : 0;
    const presentScores = present.filter((site) => site.averageScore != null);
    const missingScores = missing.filter((site) => site.averageScore != null);
    const scoreLift = average(presentScores, "averageScore") - average(missingScores, "averageScore");
    const hitLift = average(present, "crawlerHits") - average(missing, "crawlerHits");
    return {
      schema: field.schema,
      setting: field.setting,
      present_sites: present.length,
      missing_sites: missing.length,
      score_lift: Number(scoreLift.toFixed(2)),
      crawler_hit_lift: Number(hitLift.toFixed(2)),
      priority: Number((scoreLift + Math.log1p(Math.max(0, hitLift)) * 5 + missing.length).toFixed(2)),
    };
  }).sort((a, b) => b.priority - a.priority || a.schema.localeCompare(b.schema));
}

async function sha256(value) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function outputText(body) {
  if (typeof body?.output_text === "string") return body.output_text;
  for (const item of body?.output || []) for (const content of item?.content || []) if (typeof content?.text === "string") return content.text;
  return "";
}

async function openAiOrdering(env, evidence, currentOrder) {
  if (!env.OPENAI_API_KEY) return null;
  const response = await fetch(String(env.OPENAI_RESPONSES_API_URL || "https://api.openai.com/v1/responses"), {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-4.1-mini",
      store: false,
      input: [
        { role: "system", content: "You improve an AEO ruleset using only aggregate diagnostic scores, AI crawler hit counts, and information completeness. Return the requested JSON. Never claim citation evidence; no ChatGPT citation samples are available." },
        { role: "user", content: JSON.stringify({ current_recommended_order: currentOrder, aggregate_evidence: evidence, citation_samples_available: false }) },
      ],
      text: { format: { type: "json_schema", name: "aeo_ruleset_candidate", strict: true, schema: {
        type: "object",
        properties: {
          recommended_order: { type: "array", items: { type: "string" } },
          rationale: { type: "string" },
        },
        required: ["recommended_order", "rationale"],
        additionalProperties: false,
      } } },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`openai_${response.status}`);
  const parsed = JSON.parse(outputText(await response.json()) || "{}");
  const allowed = new Set(currentOrder);
  const order = Array.isArray(parsed.recommended_order) ? parsed.recommended_order.filter((item) => allowed.has(item)) : [];
  return { order: [...new Set(order)], rationale: String(parsed.rationale || "").slice(0, 500) };
}

function reorderedRecommended(current, preferred) {
  const allowed = new Set(current);
  return [...preferred.filter((item) => allowed.has(item)), ...current.filter((item) => !preferred.includes(item))];
}

async function createCandidate(env, active, analyses, evidence, now) {
  if (!analyses.length) return { version: null, mode: "heuristic", reason: "no_sites" };
  const fingerprintPayload = {
    active_version: Number(active.version),
    sites: analyses.length,
    score_samples: analyses.filter((site) => site.averageScore != null).length,
    fields: evidence,
    citation_samples_used: false,
  };
  const fingerprint = (await sha256(JSON.stringify(fingerprintPayload))).slice(0, 20);
  const existing = await env.DB.prepare("SELECT version FROM aeo_rulesets WHERE active=0 AND notes LIKE ? ORDER BY version DESC LIMIT 1")
    .bind(`%evidence=${fingerprint}%`).first();
  if (existing) return { version: Number(existing.version), mode: "deduplicated", reason: "existing_candidate" };

  const definition = parseDefinition(active);
  const currentOrder = [...(definition.schema.recommended || [])];
  const heuristicOrder = evidence.map((item) => item.schema);
  let preferredOrder = heuristicOrder;
  let rationale = "Aggregate heuristic prioritization by score lift, crawler-hit lift, and missing-site count.";
  let mode = "heuristic";
  if (env.OPENAI_API_KEY) {
    try {
      const suggestion = await openAiOrdering(env, evidence, currentOrder);
      if (suggestion?.order?.length) preferredOrder = suggestion.order;
      if (suggestion?.rationale) rationale = suggestion.rationale;
      mode = "openai+heuristic";
    } catch (error) {
      mode = "heuristic_fallback";
      rationale += ` OpenAI fallback: ${String(error?.message || error).slice(0, 100)}.`;
    }
  }
  definition.schema.recommended = reorderedRecommended(currentOrder, preferredOrder);
  // Reserved extension point: future citation samples may be added here. They are
  // intentionally absent today; this engine uses only scores, hits and completeness.
  definition.learningEvidence = {
    source_active_version: Number(active.version),
    generated_at: now,
    materials: ["aeo_scores", "crawler_hits", "site_settings_completeness"],
    field_correlations: evidence,
    citation_samples_used: false,
    citation_samples: [],
    rationale,
  };
  const notes = `[AEO learning] source_active=v${active.version}; evidence=${fingerprint}; mode=${mode}; materials=score/hits/completeness; citations=not-used; ${rationale}`.slice(0, 2000);
  const created = await env.DB.prepare(`
    INSERT INTO aeo_rulesets (version,created_at,definition_json,active,notes)
    SELECT COALESCE(MAX(version),0)+1,?,?,0,? FROM aeo_rulesets
    RETURNING version
  `).bind(now, JSON.stringify(definition), notes).first();
  return { version: Number(created.version), mode, reason: "created", fingerprint };
}

export async function runAeoLearningJob(env, { trigger = "scheduled" } = {}) {
  if (!env?.DB) throw new Error("DB binding is required for AEO learning");
  const startedAt = isoNow();
  const id = runId();
  const active = await env.DB.prepare("SELECT version,definition_json,notes FROM aeo_rulesets WHERE active=1 ORDER BY version DESC LIMIT 1").first();
  if (!active) throw new Error("active_ruleset_missing");
  const definition = parseDefinition(active);
  const [siteRows, scoreRows, hitRows] = await Promise.all([
    env.DB.prepare(`
      SELECT s.id,s.install_type,ss.name,ss.tel,ss.address,ss.hours,ss.hours_periods,
             ss.price_level,ss.price,ss.lat,ss.lng,ss.image,ss.reserve_url,ss.business_type
        FROM sites s LEFT JOIN site_settings ss ON ss.site_id=s.id
       WHERE s.delivery_status IS NULL OR s.delivery_status='active'
       ORDER BY s.id LIMIT 500
    `).all(),
    env.DB.prepare("SELECT site_id,scanned_at,score,ruleset_version FROM aeo_scores ORDER BY scanned_at DESC LIMIT 5000").all(),
    env.DB.prepare("SELECT site_id,SUM(hits) AS hits FROM crawler_hits GROUP BY site_id").all(),
  ]);
  const scoreHistory = scoreHistoryBySite(scoreRows.results || []);
  const hitsBySite = new Map((hitRows.results || []).map((row) => [row.site_id, Number(row.hits || 0)]));
  const analyses = analyzeSites(siteRows.results || [], scoreHistory, hitsBySite, definition, Number(active.version));
  const openRecommendations = await saveSiteRecommendations(env, analyses, Number(active.version), id, startedAt);
  const evidence = correlationEvidence(analyses, definition);
  const candidate = await createCandidate(env, active, analyses, evidence, startedAt);
  const finishedAt = isoNow();
  const inputMaterials = {
    sources: ["aeo_scores", "crawler_hits", "site_settings_completeness", "active_aeo_ruleset"],
    score_rows: scoreRows.results?.length || 0,
    crawler_aggregate_rows: hitRows.results?.length || 0,
    citation_samples_available: false,
    citation_samples_used: false,
    future_extension: "citation_samples",
  };
  const summary = `Analyzed ${analyses.length} sites; ${openRecommendations} require customer data; candidate ${candidate.version ? `v${candidate.version}` : "not created"}; mode=${candidate.mode}; citation data not used.`;
  await env.DB.prepare(`
    INSERT INTO aeo_learning_runs
      (id,ran_at,finished_at,trigger,sites_analyzed,recommendations_created,candidate_version,mode,summary,input_materials_json,citation_samples_used)
    VALUES (?,?,?,?,?,?,?,?,?,?,0)
  `).bind(id, startedAt, finishedAt, trigger, analyses.length, openRecommendations, candidate.version, candidate.mode, summary, JSON.stringify(inputMaterials)).run();
  return {
    ok: true,
    runId: id,
    trigger,
    sitesAnalyzed: analyses.length,
    recommendationsCreated: openRecommendations,
    candidateVersion: candidate.version,
    candidateActive: 0,
    mode: candidate.mode,
    inputMaterials,
    summary,
  };
}
