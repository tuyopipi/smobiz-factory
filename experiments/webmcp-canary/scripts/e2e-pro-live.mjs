/**
 * Pro plan end-to-end test against the REAL Perplexity API, in a throwaway
 * local environment (no production DB, no deploy).
 *
 * Boots the worker's API in process (handleApi, the same harness the
 * scripts/test-*.mjs suites use) on a fresh SQLite-backed D1 built from
 * nurevo-impl/db/schema.sql + every migration, creates an org/member/session
 * and a B2B site for https://nurevo.jp/ (the owner's own public site), comps
 * it to Pro and drives the dashboard's endpoints: the measurement, the Pro
 * report, the query set, evidence review, the AEO score and fix list, the
 * free-check view, and the agency report preview.
 *
 * Outbound network: only api.perplexity.ai (counted and hard-capped here, on
 * top of the product's own caps set through env) and nurevo.jp. Anything else
 * is refused and reported. OpenAI is not configured.
 *
 * Output: GitHub annotations (::notice / ::error), since that is what can be
 * read back from the run. Secrets are never printed; any string is scrubbed of
 * the API key before it is written.
 *
 *   PERPLEXITY_API_KEY=... node scripts/e2e-pro-live.mjs
 *   E2E_MAX_CALLS (default 30), E2E_MAX_USD (default 0.30), E2E_EN_RUN=0 to skip the English run.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import vm from "node:vm";

const KEY = String(process.env.PERPLEXITY_API_KEY || "");
const MAX_CALLS = Number(process.env.E2E_MAX_CALLS || 30);
const MAX_USD = Number(process.env.E2E_MAX_USD || 0.30);
const EN_RUN = process.env.E2E_EN_RUN !== "0";
const ASSUMED_CALL_USD = 0.0035;
// E2E_STUB=1: answer Perplexity locally (harness self-test only; never in CI).
const STUB = process.env.E2E_STUB === "1";
function stubAnswer(init) {
  const q = JSON.parse(init?.body || "{}").input || "";
  return new Response(JSON.stringify({ status: "completed", model: "stub", output: [
    { type: "search_results", results: [{ url: "https://example-aeo.test/a" }, { url: "https://nurevo.jp/" }] },
    { type: "message", content: [{ type: "output_text", text: `Stub answer to ${q}: Nurevo and Example AEO are options.` }] },
  ], usage: { input_tokens: 100, output_tokens: 50, cost: { total_cost: 0.002 } } }), { status: 200, headers: { "content-type": "application/json" } });
} // ai-engines.mjs assumedMaxCallCost("perplexity")

/* ---------------- output ---------------- */

const scrub = (s) => {
  let out = String(s);
  if (KEY.length > 8) out = out.split(KEY).join("[redacted]");
  return out.replace(/pplx-[A-Za-z0-9]{8,}/g, "pplx-[redacted]");
};
const escData = (s) => scrub(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const escProp = (s) => escData(s).replace(/:/g, "%3A").replace(/,/g, "%2C");
let noticeCount = 0;
function annotate(kind, title, body) {
  const text = scrub(body);
  const chunks = [];
  for (let i = 0; i < text.length; i += 3500) chunks.push(text.slice(i, i + 3500));
  chunks.forEach((chunk, i) => {
    if (kind === "notice") noticeCount += 1;
    console.log(`::${kind} title=${escProp(chunks.length > 1 ? `${title} (${i + 1}/${chunks.length})` : title)}::${escData(chunk)}`);
  });
}
const failures = [];
const passes = [];
function check(name, ok, detail = "") {
  if (ok) passes.push(name);
  else failures.push(`${name}${detail ? ` -- ${detail}` : ""}`);
  return !!ok;
}
const pct = (v) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? "n/a" : `${(Number(v) * 100).toFixed(0)}%`);
const ci = (iv) => (iv && Number.isFinite(iv.low) ? `[${pct(iv.low)}-${pct(iv.high)}]` : iv && Array.isArray(iv) ? `[${pct(iv[0])}-${pct(iv[1])}]` : "n/a");

/* ---------------- outbound guard ---------------- */

const realFetch = globalThis.fetch;
const pplx = { calls: 0, usd: 0, refused: 0, statuses: {}, reported: 0 };
const outbound = { nurevo: 0, refusedHosts: {} };
globalThis.fetch = async (input, init = {}) => {
  const href = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  let host = "";
  try { host = new URL(href).hostname.toLowerCase(); } catch { host = ""; }
  if (host === "api.perplexity.ai") {
    if (pplx.calls >= MAX_CALLS || pplx.usd + ASSUMED_CALL_USD > MAX_USD) {
      pplx.refused += 1;
      return new Response(JSON.stringify({ error: { message: "e2e harness cap reached" } }), { status: 429, headers: { "content-type": "application/json" } });
    }
    pplx.calls += 1;
    let response;
    try {
      response = STUB ? stubAnswer(init) : await realFetch(input, init);
    } catch (error) {
      pplx.usd += ASSUMED_CALL_USD;
      throw error;
    }
    pplx.statuses[response.status] = (pplx.statuses[response.status] || 0) + 1;
    try {
      const data = await response.clone().json();
      const reported = Number(data?.usage?.cost?.total_cost);
      if (Number.isFinite(reported) && reported >= 0) { pplx.usd += reported; pplx.reported += 1; }
      else pplx.usd += ASSUMED_CALL_USD;
    } catch {
      pplx.usd += ASSUMED_CALL_USD;
    }
    return response;
  }
  if (host === "nurevo.jp" || host === "www.nurevo.jp") {
    outbound.nurevo += 1;
    if (STUB) {
      if ((init?.method || "GET") === "HEAD") return new Response(null, { status: 200 });
      if (/robots\.txt$/.test(href)) return new Response("User-agent: *\nAllow: /\n", { status: 200, headers: { "content-type": "text/plain" } });
      if (/llms\.txt$/.test(href)) return new Response("# Nurevo\n", { status: 200, headers: { "content-type": "text/plain" } });
      return new Response(`<!doctype html><html lang="ja"><head><title>Nurevo</title><meta name="description" content="AEO"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Nurevo","url":"https://nurevo.jp/"}</script></head><body><h1>Nurevo</h1><p>AI検索最適化サービス。</p></body></html>`, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
    }
    return realFetch(input, init);
  }
  outbound.refusedHosts[host || "(invalid)"] = (outbound.refusedHosts[host || "(invalid)"] || 0) + 1;
  throw new Error(`e2e harness: outbound fetch to ${host} refused`);
};

/* ---------------- the database ---------------- */

const dbDir = new URL("../nurevo-impl/db/", import.meta.url);
const migrationIssues = [];
function statementsOf(text) {
  const lines = text.split("\n").filter((line) => !/^\s*--/.test(line)).map((line) => line.replace(/\s--\s.*$/, ""));
  return lines.join("\n").split(/;\s*(?:\n|$)/).map((s) => s.trim()).filter(Boolean);
}
function applyFile(sqlite, file, url) {
  const text = readFileSync(new URL(file, url), "utf8");
  for (const stmt of statementsOf(text)) {
    try { sqlite.exec(stmt); } catch (error) {
      const msg = String(error?.message || error);
      if (/duplicate column|already exists|UNIQUE constraint failed/i.test(msg)) continue;
      migrationIssues.push(`${file}: ${msg.slice(0, 160)} :: ${stmt.slice(0, 80).replace(/\s+/g, " ")}`);
    }
  }
}
function wrapD1(sqlite) {
  return {
    prepare(text) {
      const wrap = (args) => ({
        async first() { return sqlite.prepare(text).get(...args) || null; },
        async all() { return { results: sqlite.prepare(text).all(...args) }; },
        async run() { const r = sqlite.prepare(text).run(...args); return { success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }; },
        runSync() { const r = sqlite.prepare(text).run(...args); return { success: true, meta: { changes: Number(r.changes) } }; },
      });
      return { ...wrap([]), bind: (...args) => wrap(args) };
    },
    async batch(statements) {
      sqlite.exec("BEGIN");
      try { const out = statements.map((s) => s.runSync()); sqlite.exec("COMMIT"); return out; } catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    },
    async exec(text) { sqlite.exec(text); return { count: 1 }; },
  };
}
const sqlite = new DatabaseSync(":memory:");
applyFile(sqlite, "schema.sql", dbDir);
for (const file of readdirSync(dbDir).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort()) applyFile(sqlite, file, dbDir);
const webmcpSqlite = new DatabaseSync(":memory:");
const webmcpMigrations = new URL("../migrations/", import.meta.url);
for (const file of readdirSync(webmcpMigrations).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort()) applyFile(webmcpSqlite, file, webmcpMigrations);

const kvStore = new Map();
const KV = {
  async get(key, type) { const v = kvStore.get(key); if (v === undefined) return null; return type === "json" ? JSON.parse(v) : v; },
  async put(key, value) { kvStore.set(key, typeof value === "string" ? value : JSON.stringify(value)); },
  async delete(key) { kvStore.delete(key); },
  async list() { return { keys: [...kvStore.keys()].map((name) => ({ name })), list_complete: true }; },
};

const env = {
  DB: wrapD1(sqlite),
  WEBMCP_DB: wrapD1(webmcpSqlite),
  WEBMCP_KV: KV,
  WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp",
  PERPLEXITY_API_KEY: KEY,
  // The product's own caps, set so one month of this throwaway site cannot
  // exceed the job's budget: call cap (global; the per-site cap is fixed at
  // 200 in code) and USD caps (site and global).
  SOV_PERPLEXITY_GLOBAL_MONTHLY_CAP: String(Math.min(24, MAX_CALLS)),
  SOV_PERPLEXITY_SITE_MONTHLY_USD_CAP: String(MAX_USD),
  SOV_PERPLEXITY_GLOBAL_MONTHLY_USD_CAP: String(MAX_USD),
  // OpenAI deliberately absent; the free check stays off for a Pro site anyway.
  EMAIL_UNSUBSCRIBE_SECRET: "e2e-unsub-secret",
};

const { handleApi } = await import("../worker/api.mjs");
const { typedDiscoveryQuestions } = await import("../worker/sov-site-type.mjs");

/* ---------------- identity ---------------- */

const sha = (v) => createHash("sha256").update(v).digest("hex");
const SESSION = "e2e-session-token";
const CSRF = "e".repeat(64);
const now = Date.now();
sqlite.exec(`INSERT INTO orgs(id,name,created_at) VALUES('org_e2e','Nurevo E2E',${now});
  INSERT INTO members(id,org_id,email,role,status,created_at) VALUES('mem_e2e','org_e2e','owner@e2e.invalid','admin','active',${now});
  INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha(SESSION)}','mem_e2e','org_e2e','session',${now + 6 * 3600e3});`);

const pending = [];
const ctx = { waitUntil(p) { pending.push(Promise.resolve(p).catch(() => {})); }, passThroughOnException() {} };
const serverLog = [];
async function call(method, path, { body, bearer, headers = {}, raw = false } = {}) {
  const h = { origin: "https://nurevo.jp", ...headers };
  if (bearer) h.authorization = `Bearer ${bearer}`;
  else h.cookie = `nrv_session=${SESSION}; nrv_csrf=${CSRF}`;
  if (!bearer && method !== "GET") h["x-csrf-token"] = CSRF;
  if (body !== undefined) h["content-type"] = "application/json";
  const saved = [console.log, console.warn, console.error];
  console.log = console.warn = console.error = (...args) => serverLog.push(args.map(String).join(" ").slice(0, 400));
  let response;
  try {
    response = await handleApi(new Request(`https://nurevo.jp${path}`, { method, headers: h, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }), env, ctx);
    await Promise.all(pending.splice(0));
  } finally { [console.log, console.warn, console.error] = saved; }
  if (!response) return { status: 0, body: null, text: "" };
  const text = await response.text();
  let parsed = null;
  if (!raw) { try { parsed = JSON.parse(text); } catch { parsed = null; } }
  return { status: response.status, body: parsed, text, headers: response.headers };
}
const expect200 = (name, r) => check(`${name} -> 200`, r.status === 200, `got ${r.status} ${r.text.slice(0, 200)}`);
const noBadTokens = (name, text) => check(`${name}: no undefined/NaN/[object Object]`, !/\bundefined\b|\bNaN\b|\[object Object\]/.test(text),
  (text.match(/.{0,60}(?:\bundefined\b|\bNaN\b|\[object Object\]).{0,60}/) || [""])[0]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const summary = {};
try {
  check("migrations applied cleanly", migrationIssues.length === 0, migrationIssues.slice(0, 5).join(" | "));
  check("PERPLEXITY_API_KEY present", KEY.length > 0);

  /* ---------------- 1. the site, as the dashboard creates it ---------------- */
  const created = await call("POST", "/api/sites", { body: { url: "https://nurevo.jp/", name: "Nurevo", install_type: "tag" } });
  expect200("POST /api/sites", created);
  const siteId = created.body?.id;
  const profileToken = created.body?.profile_token;
  if (!siteId) throw new Error(`site creation failed: ${created.status} ${created.text.slice(0, 200)}`);

  const profile = {
    name: "Nurevo",
    description: "企業サイトをAI検索（ChatGPT・Perplexity・Gemini など）に正しく理解・引用されるようにするAEO（AI検索最適化）サービス。構造化データの自動出力、AI登場率の測定、改善リストを提供します。",
    business_type_schema: "AI検索最適化（AEO）サービス",
    url: "https://nurevo.jp/",
    email: "info@nurevo.jp",
    site_type: "b2b",
    serve_schema: true,
    allow_crawlers: true,
  };
  const saved = await call("PUT", `/api/sites/${siteId}`, { body: profile });
  expect200("PUT /api/sites/:id (profile + site_type b2b)", saved);
  check("site_type b2b stored", saved.body?.site_type_result?.ok === true && saved.body.site_type_result.site_type === "b2b", JSON.stringify(saved.body?.site_type_result));

  const catalog = await call("PUT", `/api/sites/${siteId}/catalog`, {
    bearer: profileToken,
    body: { services: [
      { name: "AEO診断（AI検索対応スコア）", category: "AI検索最適化", kind: "software", description: "サイトがAI検索に理解されやすいかを0-100で診断し、改善リストを出します。", url: "https://nurevo.jp/" },
      { name: "構造化データ自動出力（WordPressプラグイン／タグ）", category: "AI検索最適化", kind: "software", description: "schema.org JSON-LD と llms.txt を自動で出力します。" },
      { name: "AI登場率レポート（Pro）", category: "AI検索最適化", kind: "service", description: "AI検索の回答で自社が名前を挙げられ・引用される率を定期測定します。" },
    ] },
  });
  expect200("PUT /api/sites/:id/catalog (plugin bearer)", catalog);
  check("3 services written", catalog.body?.written?.services === 3, JSON.stringify(catalog.body));

  // Pro is not on sale; a comp grant (manual_plan) is how a site is Pro today.
  sqlite.prepare("UPDATE sites SET manual_plan='pro' WHERE id=?").run(siteId);
  const list = await call("GET", "/api/sites");
  expect200("GET /api/sites", list);
  const listed = (list.body?.sites || []).find((s) => s.id === siteId);
  check("site listed with resolved plan pro", listed && String(listed.plan).toLowerCase() === "pro", JSON.stringify({ plan: listed?.plan, manual_plan: listed?.manual_plan }));
  const detail = await call("GET", `/api/sites/${siteId}`);
  expect200("GET /api/sites/:id", detail);
  check("detail site_type b2b", detail.body?.site_type === "b2b");
  check("detail has 3 services", (detail.body?.catalog?.services || []).length === 3);

  /* ---------------- 2. before measuring ---------------- */
  const before = await call("GET", `/api/sites/${siteId}/sov`);
  expect200("GET /sov (before)", before);
  check("sov configured with perplexity only", before.body?.configured === true && (before.body?.engines || []).map((e) => e.id).join() === "perplexity", JSON.stringify(before.body?.engines));
  check("no run yet", before.body?.latest === null);
  const callsBefore = pplx.calls;

  /* ---------------- 3. the Pro measurement (ja) ---------------- */
  const run = await call("POST", `/api/sites/${siteId}/sov`);
  expect200("POST /sov (manual run, ja)", run);
  const r = run.body || {};
  const runCalls = pplx.calls - callsBefore;
  summary.run_ja = { status: r.status, questions_asked: r.questions_asked, answers_received: r.answers_received, queries_used: r.queries_used,
    appearance_rate: r.appearance_rate, citation_rate: r.citation_rate, confidence: r.confidence, truncated: r.truncated, http_calls: runCalls };
  check("run status measured", r.status === "measured", `status=${r.status} error=${r.error}`);
  check("answers_received > 0", Number(r.answers_received) > 0, `answers=${r.answers_received}`);
  check("queries_used == outbound perplexity calls", Number(r.queries_used) === runCalls, `queries_used=${r.queries_used} http=${runCalls}`);
  check("run within product per-run cap (<=40)", Number(r.queries_used) <= 40);
  for (const [k, v] of [["appearance_rate", r.appearance_rate], ["citation_rate", r.citation_rate]]) {
    check(`${k} in [0,1] or null with reason`, v === null || (Number(v) >= 0 && Number(v) <= 1), String(v));
  }
  check("competitors is an array", Array.isArray(r.competitors));
  summary.post_competitors = (r.competitors || []).slice(0, 8);
  check("usage reported", r.usage && Number.isFinite(Number(r.usage.used)), JSON.stringify(r.usage));
  check("by_engine has perplexity", (r.by_engine || []).some((b) => b.engine === "perplexity"));
  check("openai not asked", !(r.by_engine || []).some((b) => b.engine === "openai" && Number(b.answers) > 0));

  // Immediately again: the product must serve the cached run, not pay again.
  const again = await call("POST", `/api/sites/${siteId}/sov`);
  const callsAfterAgain = pplx.calls;
  check("immediate re-run makes no engine call", callsAfterAgain === callsBefore + runCalls, `extra calls=${callsAfterAgain - callsBefore - runCalls}`);
  check("immediate re-run is cached or rate limited", (again.status === 200 && again.body?.cached === true) || again.status === 429, `status=${again.status} cached=${again.body?.cached} error=${again.body?.error}`);

  /* ---------------- 4. reads ---------------- */
  const sov = await call("GET", `/api/sites/${siteId}/sov`);
  expect200("GET /sov", sov);
  const latest = sov.body?.latest || {};
  check("latest run present", !!sov.body?.latest);
  check("latest answers > 0", Number(latest.answers_received) > 0);
  check("usage.used == calls", Number(sov.body?.usage?.used) === runCalls, JSON.stringify(sov.body?.usage));
  const ebud = (sov.body?.engine_budgets || []).find((p) => p.engine === "perplexity");
  check("engine budget for perplexity readable", !!ebud, JSON.stringify(sov.body?.engine_budgets));

  const qs = await call("GET", `/api/sites/${siteId}/sov/query-set`);
  expect200("GET /sov/query-set", qs);
  const questions = qs.body?.query_set?.questions || [];
  summary.query_set = qs.body?.query_set;
  check("query set has questions", questions.length > 0);
  check("query set marked b2b", qs.body?.query_set?.site_type === "b2b", JSON.stringify(qs.body?.query_set));
  const localish = /近く|近所|最寄|駅から|営業時間|予約できる|お店|店舗|口コミが良いお店|near me|nearby|opening hours/i;
  for (const q of questions) {
    check(`question not local-store phrased: ${q}`, !localish.test(q));
    check(`question unbranded: ${q}`, !/nurevo|ヌレボ|ニューレボ/i.test(q));
  }

  const repJa = await call("GET", `/api/sites/${siteId}/sov/report?lang=ja`);
  expect200("GET /sov/report?lang=ja", repJa);
  const report = repJa.body?.report || {};
  noBadTokens("report ja JSON", repJa.text);
  check("report status measured", report.status === "measured", report.status);
  check("report summary answers > 0", Number(report.summary?.answers) > 0);
  const pEngine = (report.engines || []).find((e) => e.engine === "perplexity") || {};
  const oEngine = (report.engines || []).find((e) => e.engine === "openai") || {};
  check("report perplexity measured with interval", pEngine.status === "measured" && (pEngine.n < 2 || (pEngine.interval && pEngine.interval.low >= 0 && pEngine.interval.high <= 1 && pEngine.interval.low <= pEngine.interval.high)), JSON.stringify({ status: pEngine.status, n: pEngine.n, interval: pEngine.interval }));
  check("report openai not_configured", oEngine.status === "not_configured", oEngine.status);
  check("report evidence rows == answers+failures", (report.evidence || []).length === Number(r.queries_used), `${(report.evidence || []).length} vs ${r.queries_used}`);
  check("report notice is Japanese", /[ぁ-ん]/.test(String(report.notice)));
  check("report usage under caps", pEngine.usage && Number(pEngine.usage.global_used) <= Number(pEngine.usage.global_cap) && (pEngine.usage.global_usd_used === null || Number(pEngine.usage.global_usd_used) <= Number(pEngine.usage.global_usd_cap)), JSON.stringify(pEngine.usage));
  summary.report_ja = { summary: report.summary, combined: report.combined, perplexity: { n: pEngine.n, named: pEngine.named, cited: pEngine.cited, appearance_rate: pEngine.appearance_rate, named_rate: pEngine.named_rate, cited_rate: pEngine.cited_rate, interval: pEngine.interval, usage: pEngine.usage },
    presence: report.presence, competitors: report.competitors, gaps: (report.gaps || []).length };

  const repEn = await call("GET", `/api/sites/${siteId}/sov/report?lang=en`);
  expect200("GET /sov/report?lang=en", repEn);
  noBadTokens("report en JSON", repEn.text);
  check("report en notice is English", /^AI answers/.test(String(repEn.body?.report?.notice)), String(repEn.body?.report?.notice).slice(0, 40));

  const evGet = await call("GET", `/api/sites/${siteId}/sov/evidence`);
  summary.evidence_get_status = evGet.status;
  const firstEvidence = (report.evidence || []).find((e) => e.ok);
  if (firstEvidence) {
    const review = await call("PUT", `/api/sites/${siteId}/sov/evidence/${encodeURIComponent(firstEvidence.id)}`, { body: { status: "uncertain", note: "E2E review: not verified by a human." } });
    expect200("PUT /sov/evidence/:id (review)", review);
    check("evidence review stored", review.body?.accuracy?.status === "uncertain");
  }

  // The competitor list as the agency report and query set see it: hosts the
  // engine cited in place of nurevo.jp.
  const citedHosts = new Map();
  for (const e of report.evidence || []) {
    for (const u of e.citation_urls || []) {
      let h = ""; try { h = new URL(u).hostname.replace(/^www\./, ""); } catch { continue; }
      if (h.endsWith("nurevo.jp")) continue;
      citedHosts.set(h, (citedHosts.get(h) || 0) + 1);
    }
  }
  summary.cited_hosts = [...citedHosts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  try {
  /* ---------------- 5. the dashboard panel renders the real payload ---------------- */
  for (const lang of ["ja", "en"]) {
    try {
      const { tFor } = await import("./dashboard-dictionary.mjs");
      const SOURCE = readFileSync(new URL("../public/dashboard-sov.js", import.meta.url), "utf8");
      let built = null;
      const element = () => ({ className: "", dataset: {}, innerHTML: "", style: {}, textContent: "", appendChild() {}, querySelector: () => null, isConnected: false, replaceWith() {}, addEventListener() {}, setAttribute() {} });
      const sandbox = {
        document: { createElement(tag) { const el = element(); if (tag === "section") built = el; return el; }, querySelector: () => null, addEventListener() {}, head: { appendChild() {} }, documentElement: { lang } },
        MutationObserver: class { observe() {} }, setTimeout() {},
        fetch: async () => { throw new Error("render path must not fetch"); },
        Number, Math, String, Date, JSON, Array, Object, console, t: tFor(lang),
      };
      sandbox.window = sandbox;
      vm.createContext(sandbox);
      vm.runInContext(SOURCE.replace("})();", "  window.__panel = panel;\n})();"), sandbox);
      sandbox.window.__panel({ kind: "measured", data: sov.body });
      const html = String(built?.innerHTML || "");
      check(`dashboard SoV panel renders (${lang})`, html.length > 200, `len=${html.length}`);
      noBadTokens(`dashboard SoV panel ${lang}`, html);
    } catch (error) {
      check(`dashboard SoV panel renders (${lang})`, false, String(error?.stack || error).slice(0, 300));
    }
  }

  } catch (error) { failures.push(`dashboard-panel section exception: ${String(error?.stack || error).slice(0, 500)}`); }

  try {
  /* ---------------- 6. free check view, AEO score and fix list ---------------- */
  const fc = await call("GET", `/api/sites/${siteId}/sov/free-check`);
  expect200("GET /sov/free-check", fc);
  check("free check says Pro uses full measurement (status pro, cannot run)", fc.body?.free_check?.status === "pro" && fc.body?.free_check?.can_run_now === false, JSON.stringify(fc.body?.free_check).slice(0, 200));
  const fcPost = await call("POST", `/api/sites/${siteId}/sov/free-check`);
  check("free check POST refused for Pro (409, no call)", fcPost.status === 409 && pplx.calls === callsAfterAgain, `status=${fcPost.status} outcome=${fcPost.body?.outcome}`);

  const score = await call("POST", `/api/sites/${siteId}/aeo-score`);
  expect200("POST /aeo-score (diagnose nurevo.jp)", score);
  summary.score = { score: score.body?.score, band: score.body?.band, checks: (score.body?.checks || []).map((c) => `${c.id}:${c.status}`).join(" ") };
  check("score is 0-100", Number(score.body?.score) >= 0 && Number(score.body?.score) <= 100, String(score.body?.score));
  const metrics = await call("GET", `/api/sites/${siteId}/aeo-metrics`);
  expect200("GET /aeo-metrics", metrics);
  check("aeo-metrics has the stored score", (metrics.body?.scores || []).length >= 1);
  noBadTokens("aeo-metrics JSON", metrics.text);

  const fixes = {};
  for (const lang of ["ja", "en"]) {
    const rec = await call("GET", `/api/sites/${siteId}/recommendations?lang=${lang}`);
    expect200(`GET /recommendations?lang=${lang}`, rec);
    noBadTokens(`recommendations ${lang}`, rec.text);
    fixes[lang] = rec.body;
    check(`recommendations ${lang} has items array`, Array.isArray(rec.body?.items));
  }
  summary.fixes = (fixes.ja?.items || []).slice(0, 5).map((i) => `[${i.kind}/${i.priority}] ${i.title}`);
  summary.fixes_en = (fixes.en?.items || []).slice(0, 5).map((i) => `[${i.kind}] ${i.title}`);
  summary.fix_meta = { count: fixes.ja?.count, blocking: fixes.ja?.blocking, schema_read: fixes.ja?.schema_read };
  check("b2b fix list does not ask for local props (address/telephone/hours as profile_missing)", !(fixes.ja?.items || []).some((i) => i.kind === "profile_missing" && /address|telephone|opening|hours|住所|電話|営業時間/i.test(`${i.id} ${i.title}`)));

  const monthly = await call("GET", `/api/sites/${siteId}/monthly-report`);
  expect200("GET /monthly-report", monthly);
  noBadTokens("monthly-report JSON", monthly.text);

  } catch (error) { failures.push(`score/fixes section exception: ${String(error?.stack || error).slice(0, 500)}`); }

  try {
  /* ---------------- 7. agency branding and report preview ---------------- */
  const branding = await call("PUT", "/api/agency/branding", { body: { display_name: "E2E Test Agency", brand_color: "#0a7d5a", contact_email: "agency@e2e.invalid", contact_url: "https://nurevo.jp/", footer_text: "E2E Test Agency (test only)" } });
  expect200("PUT /api/agency/branding", branding);
  check("branding saved", branding.body?.branding?.display_name === "E2E Test Agency", JSON.stringify(branding.body).slice(0, 200));
  const rs = await call("GET", `/api/sites/${siteId}/report-settings`);
  expect200("GET /report-settings", rs);
  summary.report_settings = { available: rs.body?.available, eligibility: rs.body?.eligibility, brand: rs.body?.brand };
  const month = new Date().toISOString().slice(0, 7);
  const agencyJson = await call("GET", `/api/sites/${siteId}/agency-report?month=${month}&lang=ja`);
  expect200("GET /agency-report (json)", agencyJson);
  noBadTokens("agency report json", agencyJson.text);
  summary.agency_model_keys = Object.keys(agencyJson.body?.report || {}).join(",");
  for (const lang of ["ja", "en"]) {
    const html = await call("GET", `/api/sites/${siteId}/agency-report?format=html&month=${month}&lang=${lang}`, { raw: true });
    expect200(`GET /agency-report?format=html&lang=${lang}`, html);
    check(`agency report ${lang} is HTML`, /text\/html/.test(html.headers?.get("content-type") || ""));
    check(`agency report ${lang} carries the agency brand`, html.text.includes("E2E Test Agency"));
    check(`agency report ${lang} has no raw placeholders`, !/\{[a-z_]+\}/.test(html.text), (html.text.match(/.{0,40}\{[a-z_]+\}.{0,40}/) || [""])[0]);
    check(`agency report ${lang} has no <script>`, !/<script/i.test(html.text));
    noBadTokens(`agency report html ${lang}`, html.text);
    check(`agency report ${lang} lang attribute`, new RegExp(`<html[^>]*lang="${lang}`).test(html.text), (html.text.match(/<html[^>]*>/) || [""])[0]);
    const plain = html.text.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    summary[`agency_html_${lang}`] = { bytes: html.text.length, mentions_measurement: /AI|登場|appear/i.test(plain), excerpt: plain.slice(0, 600) };
  }

  } catch (error) { failures.push(`agency section exception: ${String(error?.stack || error).slice(0, 500)}`); }

  try {
  /* ---------------- 8. English query set run (small) ---------------- */
  if (EN_RUN) {
    const profileForQs = { siteType: "b2b", language: "en", category: "AI search optimization (AEO)", task: "AI search optimization", software: true };
    const enQuestions = typedDiscoveryQuestions(profileForQs).slice(0, 3);
    const competitors = summary.cited_hosts.map(([h]) => h).filter((h) => /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(h)).slice(0, 3);
    const put = await call("PUT", `/api/sites/${siteId}/sov/query-set`, { body: { questions: enQuestions, repetitions: 1, competitors, language: "en", site_type: "b2b" } });
    expect200("PUT /sov/query-set (en, 3 questions, competitors)", put);
    // The product refuses a second run within 60 s of the last one.
    await sleep(62000);
    const before2 = pplx.calls;
    const run2 = await call("POST", `/api/sites/${siteId}/sov`);
    expect200("POST /sov (manual run, en)", run2);
    const r2 = run2.body || {};
    summary.run_en = { status: r2.status, questions_asked: r2.questions_asked, answers_received: r2.answers_received, queries_used: r2.queries_used,
      appearance_rate: r2.appearance_rate, citation_rate: r2.citation_rate, http_calls: pplx.calls - before2, questions: enQuestions, competitors };
    check("en run measured", r2.status === "measured", `${r2.status} ${r2.error}`);
    check("en run used <=3 calls", pplx.calls - before2 <= 3, String(pplx.calls - before2));
    const rep2 = await call("GET", `/api/sites/${siteId}/sov/report?lang=en`);
    expect200("GET /sov/report?lang=en (after en run)", rep2);
    noBadTokens("report en (en run)", rep2.text);
    const rr = rep2.body?.report || {};
    const pe = (rr.engines || []).find((e) => e.engine === "perplexity") || {};
    summary.report_en = { summary: rr.summary, perplexity: { n: pe.n, named: pe.named, cited: pe.cited, interval: pe.interval, usage: pe.usage }, presence: rr.presence,
      competitors: (rr.competitors || []).map((c) => ({ host: c.host, own: c.own, citations: c.citations, sov: c.share_of_voice })) };
    check("en report lists the configured competitors", competitors.every((h) => (rr.competitors || []).some((c) => c.host === h)));
    check("en report query_set language en", rr.query_set?.language === "en", JSON.stringify(rr.query_set?.language));
    const sov2 = await call("GET", `/api/sites/${siteId}/sov`);
    check("trend keeps runs apart by language (ja trend unaffected)", Array.isArray(rr.trend), "");
    summary.sov_usage_after = sov2.body?.usage;
  }

  } catch (error) { failures.push(`en-run section exception: ${String(error?.stack || error).slice(0, 500)}`); }

  /* ---------------- 9. recorded usage vs. what was called ---------------- */
  const usageRows = sqlite.prepare("SELECT scope,engine,month,calls,searches,est_cost_usd FROM aeo_sov_engine_usage").all();
  const counter = sqlite.prepare("SELECT * FROM aeo_sov_usage").all();
  summary.usage_rows = usageRows;
  summary.usage_counter = counter;
  const globalRow = usageRows.find((row) => row.scope === "*" && row.engine === "perplexity");
  check("engine usage recorded (global calls == http calls)", globalRow && Number(globalRow.calls) === pplx.calls, JSON.stringify(globalRow));
  check("recorded est USD under cap", globalRow && Number(globalRow.est_cost_usd) <= MAX_USD, JSON.stringify(globalRow));
  check("site counter == http calls", counter.length === 1 && Number(counter[0].queries_used) === pplx.calls, JSON.stringify(counter));
} catch (error) {
  failures.push(`harness exception: ${String(error?.stack || error).slice(0, 600)}`);
}

check("no outbound fetch refused", Object.keys(outbound.refusedHosts).length === 0, JSON.stringify(outbound.refusedHosts));
check("harness never had to refuse a perplexity call", pplx.refused === 0, String(pplx.refused));
check("total perplexity calls <= cap", pplx.calls <= MAX_CALLS, String(pplx.calls));
check("total USD <= cap", pplx.usd <= MAX_USD, pplx.usd.toFixed(4));

/* ---------------- annotations ---------------- */

const J = (v) => JSON.stringify(v);
{
  const s = summary;
  const rj = s.report_ja || {};
  const lines = [];
  lines.push(`mode: ${STUB ? "STUB (self-test, not a real measurement)" : "live Perplexity"}`);
  lines.push(`site: https://nurevo.jp/ name=Nurevo type=b2b plan=pro(manual) lang=ja engine=perplexity(OpenAI off)`);
  lines.push(`run ja: ${J(s.run_ja)}`);
  lines.push(`summary: answers=${rj.summary?.answers} appearance=${pct(rj.summary?.appearance_rate)} citation=${pct(rj.summary?.citation_rate)}`);
  lines.push(`perplexity: n=${rj.perplexity?.n} named=${rj.perplexity?.named} cited=${rj.perplexity?.cited} appearance=${pct(rj.perplexity?.appearance_rate)} CI95=${ci(rj.perplexity?.interval)} named_rate=${pct(rj.perplexity?.named_rate)} cited_rate=${pct(rj.perplexity?.cited_rate)}`);
  lines.push(`combined: ${J(rj.combined && { n: rj.combined.n, named: rj.combined.named, cited: rj.combined.cited, appeared: rj.combined.appeared, interval: rj.combined.interval })}`);
  lines.push(`usage (report): ${J(rj.perplexity?.usage)}`);
  annotate("notice", "pro-e2e 1 measurement ja", lines.join("\n"));
  annotate("notice", "pro-e2e 2 questions ja", [
    `query_set: repetitions=${s.query_set?.repetitions} site_type=${s.query_set?.site_type} language=${s.query_set?.language || "ja"} competitors=${J(s.query_set?.competitors)}`,
    ...(rj.presence || []).map((p) => `- ${p.question} | answers=${p.answers} named=${p.appearances} cited=${p.citations}`),
    `gaps(not cited, n>=2): ${rj.gaps}`,
  ].join("\n"));
  annotate("notice", "pro-e2e 3 competitors", [
    `report competitors (own + configured): ${J((rj.competitors || []).map((c) => ({ host: c.host, own: c.own, citations: c.citations, sov: c.share_of_voice })))}`,
    `POST competitors (product, aggregators excluded): ${J(s.post_competitors)}`,
    `cited hosts in evidence (excl. nurevo.jp): ${J(s.cited_hosts)}`,
  ].join("\n"));
  annotate("notice", "pro-e2e 4 score and fixes", [
    `AEO score: ${s.score?.score} band=${s.score?.band}`,
    `checks: ${s.score?.checks}`,
    `fix list: ${J(s.fix_meta)}`,
    ...(s.fixes || []).map((f, i) => `${i + 1}. ${f}`),
    `en: ${J(s.fixes_en)}`,
  ].join("\n"));
  annotate("notice", "pro-e2e 5 agency and free-check", [
    `report-settings: ${J(s.report_settings)}`,
    `agency model keys: ${s.agency_model_keys}`,
    `GET /sov/evidence status: ${s.evidence_get_status}`,
    `html ja: ${J(s.agency_html_ja)}`,
    `html en: ${J(s.agency_html_en)}`,
  ].join("\n"));
  if (s.run_en) {
    annotate("notice", "pro-e2e 6 english run", [
      `run en: ${J(s.run_en)}`,
      `report en: ${J({ summary: s.report_en?.summary, perplexity: s.report_en?.perplexity })}`,
      ...(s.report_en?.presence || []).map((p) => `- ${p.question} | answers=${p.answers} named=${p.appearances} cited=${p.citations}`),
      `competitors: ${J(s.report_en?.competitors)}`,
    ].join("\n"));
  }
  annotate("notice", "pro-e2e 7 cost and checks", [
    `perplexity http calls=${pplx.calls} (cap ${MAX_CALLS}) statuses=${J(pplx.statuses)} refused_by_harness=${pplx.refused}`,
    `usd (provider-reported where given, ${pplx.reported}/${pplx.calls} reported)=${pplx.usd.toFixed(4)} (cap ${MAX_USD})`,
    `nurevo.jp fetches=${outbound.nurevo} refused hosts=${J(outbound.refusedHosts)}`,
    `product usage rows: ${J(s.usage_rows)} counter: ${J(s.usage_counter)}`,
    `checks passed=${passes.length} failed=${failures.length}`,
    `server log tail: ${serverLog.filter((l) => /error|warn|sov-engine|fail/i.test(l)).slice(-6).join(" || ")}`,
  ].join("\n"));
}
if (failures.length) annotate("error", `pro-e2e assertion failures (${failures.length})`, failures.map((f, i) => `${i + 1}. ${f}`).join("\n"));
process.exitCode = failures.length ? 1 : 0;
