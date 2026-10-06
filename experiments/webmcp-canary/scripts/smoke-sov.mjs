/**
 * S4 minimal SoV smoke test. Local only, Perplexity only, 6 requests, once.
 *
 * Safety properties, in order of importance:
 *   1. Without PERPLEXITY_API_KEY in .dev.vars it exits before any network call.
 *   2. A hard counter aborts the run if engine calls would exceed MAX_ENGINE_CALLS.
 *   3. Only PERPLEXITY_API_KEY is passed to the engine layer, so an OpenAI key
 *      present in .dev.vars cannot silently double the spend.
 *   4. The key is never printed, logged, or written anywhere.
 *
 * It exercises the real engine and parser (worker/aeo-sov.mjs) and records the
 * runs in the local D1 so the stored row counts can be verified. It does not
 * go through the HTTP route or the weekly batch - those, and the quota
 * fail-safe, are covered by `npm run test:sov`.
 *
 * Usage:  npm run smoke:sov
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import {
  SOV_LIMITS, SOV_MIN_SAMPLES_FOR_RATE,
  buildBrandProfile, buildQuestionSet, measureSov, sovMonthKey,
} from "../worker/aeo-sov.mjs";

/* ------------------------------------------------------------------ *
 * Fixed plan. Changing these changes the spend, so they are explicit.
 * ------------------------------------------------------------------ */
const DISCOVERY_QUESTIONS_PER_TARGET = 2;   // Q1, Q2 -> headline rate
const CONTROL_QUESTIONS_PER_TARGET = 1;     // Q3     -> parser control, not scored
const TARGETS = [
  {
    id: "smoke-kyubey",
    label: "(a) 銀座久兵衛",
    site: { id: "smoke-kyubey", url: "kyubey.jp", website_uri: "https://kyubey.jp" },
    settings: { name: "銀座久兵衛", business_type: "寿司", address: "東京都中央区銀座8-7-6" },
    controlQuestion: "銀座久兵衛はどんな寿司店？",
    expectation: "既知ブランド: 発見質問での言及/引用、アグリゲータ除外、対照質問での検出を確認",
  },
  {
    id: "smoke-nurevo",
    label: "(b) nurevo.jp",
    site: { id: "smoke-nurevo", url: "nurevo.jp", website_uri: "https://nurevo.jp" },
    settings: { name: "Nurevo", business_type: "AI検索対策サービス", address: "東京都千代田区神田三崎町3-2-6" },
    controlQuestion: "Nurevo（nurevo.jp）はどんなサービス？",
    expectation: "無名サイト: 偽の数字を出さず measured(0%) か insufficient_samples/no_answers に落ちること",
  },
];
const MAX_ENGINE_CALLS = TARGETS.length * (DISCOVERY_QUESTIONS_PER_TARGET + CONTROL_QUESTIONS_PER_TARGET);

/* ------------------------------------------------------------------ *
 * Key loading. Nothing here echoes the value.
 * ------------------------------------------------------------------ */
function loadDevVars(path = ".dev.vars") {
  if (!existsSync(path)) return {};
  const vars = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 1) continue;
    vars[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
  }
  return vars;
}

const devVars = loadDevVars();
const perplexityKey = String(devVars.PERPLEXITY_API_KEY || "").trim();
if (!perplexityKey) {
  console.error([
    "",
    "PERPLEXITY_API_KEY が .dev.vars にありません。実APIは呼ばずに終了しました。",
    "",
    "  cd experiments/webmcp-canary",
    "  printf 'PERPLEXITY_API_KEY=<あなたのキー>\\n' >> .dev.vars",
    "",
    ".dev.vars は .gitignore 済みです。キーをこのスクリプトやチャットに貼らないでください。",
    "",
  ].join("\n"));
  process.exit(1);
}
if (devVars.OPENAI_API_KEY) {
  console.warn("注意: .dev.vars に OPENAI_API_KEY がありますが、本スモークでは使用しません（Perplexityのみ）。\n");
}
// Only the Perplexity key reaches the engine layer: OpenAI stays unconfigured.
// PERPLEXITY_API_URL is passed through so this script can be rehearsed against
// a local mock before spending anything; aeo-sov.mjs ignores the override
// unless it points at a loopback host, so it cannot redirect a live key.
const engineEnv = { PERPLEXITY_API_KEY: perplexityKey, PERPLEXITY_API_URL: devVars.PERPLEXITY_API_URL };
const dryRun = Boolean(String(devVars.PERPLEXITY_API_URL || "").trim());
if (dryRun) {
  console.warn("DRY RUN: PERPLEXITY_API_URL が設定されているため、ローカルのモックに対して実行します（実課金なし）。\n");
}

/* ------------------------------------------------------------------ *
 * Hard spend ceiling, enforced at the transport layer.
 * ------------------------------------------------------------------ */
let engineCalls = 0;
const overrideHost = (() => {
  try { return new URL(String(devVars.PERPLEXITY_API_URL || "")).host; } catch { return ""; }
})();
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const href = typeof input === "string" ? input : input.url;
  const isEngine = /api\.perplexity\.ai|api\.openai\.com/.test(href)
    || (overrideHost && href.includes(overrideHost));
  if (isEngine) {
    engineCalls += 1;
    if (engineCalls > MAX_ENGINE_CALLS) {
      throw new Error(`ABORT: engine call ${engineCalls} exceeds the ${MAX_ENGINE_CALLS}-call ceiling`);
    }
  }
  return realFetch(input, init);
};

/* ------------------------------------------------------------------ *
 * Local D1 helpers (wrangler --local only; never --remote).
 * ------------------------------------------------------------------ */
function d1(sql) {
  const file = `/tmp/smoke-sov-${process.pid}.sql`;
  writeFileSync(file, sql);
  const out = execFileSync("npx", ["wrangler@latest", "d1", "execute", "nurevo-db", "--local", "--file", file], {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  });
  return out;
}
function d1Count(sql) {
  const out = d1(sql);
  const match = out.match(/"n":\s*(\d+)/);
  return match ? Number(match[1]) : null;
}
const sqlString = (value) => `'${String(value).replace(/'/g, "''")}'`;

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */
const month = sovMonthKey();
console.log(`\nNurevo AEO — SoV 最小スモーク（Perplexityのみ / 合計${MAX_ENGINE_CALLS}リクエスト / ローカル）`);
console.log(`実行: ${new Date().toISOString()}  月次キー: ${month}\n`);

const quotaBefore = d1Count(`SELECT COALESCE(SUM(queries_used),0) AS n FROM aeo_sov_usage WHERE month='${month}';`);
const runsBefore = d1Count("SELECT COUNT(*) AS n FROM aeo_sov_runs;");

const results = [];
for (const target of TARGETS) {
  // Built with the production helper so locality parsing and alias vetting are
  // identical to a scheduled run. schemas is empty: the owner-entered settings
  // take priority in production anyway, and this avoids an extra page fetch.
  const profile = buildBrandProfile({ site: target.site, settings: target.settings, schemas: [] });
  const discovery = buildQuestionSet(profile, DISCOVERY_QUESTIONS_PER_TARGET);
  // BUG 2 fix: use the exact approved control wording rather than the generic
  // template, which produced "…はどんな寿司？" instead of "…はどんな寿司店？".
  const control = [{ text: target.controlQuestion, kind: "branded" }];

  console.log("=".repeat(78));
  console.log(`${target.label}  —  ${target.site.website_uri}`);
  console.log(`期待: ${target.expectation}`);
  console.log(`ブランド名: ${profile.name} / 業種: ${profile.businessType} / 地域: ${profile.locality || "(なし)"}`);
  console.log("=".repeat(78));

  const measurement = await measureSov(engineEnv, profile, {
    questions: [...discovery, ...control],
    budget: DISCOVERY_QUESTIONS_PER_TARGET + CONTROL_QUESTIONS_PER_TARGET,
  });

  for (const [index, sample] of measurement.samples.entries()) {
    const tag = sample.kind === "branded" ? "Q3 対照(率に含めない)" : `Q${index + 1} 発見`;
    console.log(`\n--- ${tag} ---`);
    console.log(`質問: ${sample.question}`);
    if (!sample.ok) {
      console.log(`結果: 失敗 (${sample.error}) — 分母から除外`);
      continue;
    }
    console.log(`回答テキスト:\n${sample.excerpt}`);
    console.log(`抽出: 言及=${sample.mentioned ? "あり" : "なし"} / 自社ドメイン引用=${sample.cited ? "あり" : "なし"}`);
    console.log(`引用ドメイン(全): ${sample.citedHosts.length ? sample.citedHosts.join(", ") : "(なし)"}`);
    console.log(`競合として集計(アグリゲータ除外後): ${sample.competitorHosts.length ? sample.competitorHosts.join(", ") : "(なし)"}`);
    const dropped = sample.citedHosts.filter((h) => !sample.competitorHosts.includes(h) && h !== profile.host);
    if (dropped.length) console.log(`除外されたドメイン: ${dropped.join(", ")}`);
  }

  console.log(`\n■ ${target.label} 集計`);
  console.log(`  headline 登場率 (Q1・Q2のみ): ${measurement.appearance_rate === null ? "null" : `${Math.round(measurement.appearance_rate * 100)}%`}`);
  console.log(`  引用率                      : ${measurement.citation_rate === null ? "null" : `${Math.round(measurement.citation_rate * 100)}%`}`);
  console.log(`  rate_basis                  : ${measurement.rate_basis}  (閾値: ${SOV_MIN_SAMPLES_FOR_RATE}件)`);
  console.log(`  確度                        : ${measurement.confidence}`);
  console.log(`  発見質問 回答数/質問数      : ${measurement.answers_received}/${measurement.questions_asked}`);
  console.log(`  失敗プローブ                : ${measurement.samples.filter((s) => !s.ok).length}`);
  console.log(`  by_engine                   : ${JSON.stringify(measurement.by_engine)}`);
  console.log(`  parser_control (対照)       : ${JSON.stringify(measurement.parser_control)}`);
  console.log(`  競合                        : ${JSON.stringify(measurement.competitors)}`);
  console.log(`  このターゲットの消費        : ${measurement.queries_used}\n`);

  // Record the run exactly as the production path would.
  const runId = `sov_smoke_${target.id}_${Date.now().toString(36)}`;
  d1([
    `INSERT OR REPLACE INTO aeo_sov_runs (id,site_id,ran_at,status,trigger,model_version,engines_json,`,
    `questions_asked,answers_received,queries_used,appearance_rate,citation_rate,confidence,competitors_json,detail_json) VALUES (`,
    `${sqlString(runId)},${sqlString(target.id)},${sqlString(new Date().toISOString())},${sqlString(measurement.status)},'smoke',`,
    `${sqlString(measurement.model_version)},${sqlString(JSON.stringify(measurement.engines))},`,
    `${measurement.questions_asked},${measurement.answers_received},${measurement.queries_used},`,
    `${measurement.appearance_rate === null ? "NULL" : measurement.appearance_rate},`,
    `${measurement.citation_rate === null ? "NULL" : measurement.citation_rate},`,
    `${sqlString(measurement.confidence)},${sqlString(JSON.stringify(measurement.competitors))},`,
    `${sqlString(JSON.stringify({ rate_basis: measurement.rate_basis, parser_control: measurement.parser_control, by_engine: measurement.by_engine }))});`,
    `INSERT INTO aeo_sov_usage (site_id,month,queries_used,updated_at) VALUES (${sqlString(target.id)},'${month}',${measurement.queries_used},${sqlString(new Date().toISOString())})`,
    `ON CONFLICT(site_id,month) DO UPDATE SET queries_used=queries_used+excluded.queries_used,updated_at=excluded.updated_at;`,
  ].join("\n"));

  results.push({ target, measurement });
}

/* ------------------------------------------------------------------ *
 * Summary
 * ------------------------------------------------------------------ */
const quotaAfter = d1Count(`SELECT COALESCE(SUM(queries_used),0) AS n FROM aeo_sov_usage WHERE month='${month}';`);
const runsAfter = d1Count("SELECT COUNT(*) AS n FROM aeo_sov_runs;");

console.log("=".repeat(78));
console.log("■ 全体サマリー");
console.log("=".repeat(78));
console.log(`実エンジン呼び出し数        : ${engineCalls} / 上限 ${MAX_ENGINE_CALLS}`);
console.log(`月間クォータ消費            : ${quotaBefore} → ${quotaAfter}  (+${quotaAfter - quotaBefore})`);
console.log(`1サイトあたり月間上限       : ${SOV_LIMITS.monthlyQueriesPerSite}`);
console.log(`D1 aeo_sov_runs 件数        : ${runsBefore} → ${runsAfter}  (+${runsAfter - runsBefore})`);
for (const { target, measurement } of results) {
  console.log(`  ${target.label}: 登場率=${measurement.appearance_rate === null ? "null" : measurement.appearance_rate} basis=${measurement.rate_basis} 消費=${measurement.queries_used}`);
}
console.log(`\nコスト概算: Perplexity sonar ${engineCalls}リクエスト。実額は Perplexity のダッシュボードでご確認ください。`);
console.log("（本スクリプトはトークン使用量を返さないため、概算は請求画面が一次情報です）\n");
console.log("これ以上の量産・本番反映が必要な場合は停止して相談してください。\n");
