import { handleDiagnose, runAeoScoreCron } from "./diagnose.mjs";
import { authorizeSiteKey } from "./agent-authorization.mjs";
import { handleApi } from "./api.mjs";
import { runAeoLearningJob } from "./aeo-learning.mjs";
import dashboardRulesetsSource from "../public/dashboard-rulesets.js";
import dashboardAeoMetricsSource from "../public/dashboard-aeo-metrics.js";

const DASHBOARD_SCRIPT_SOURCES = new Map([
  ["/dashboard-rulesets.js", dashboardRulesetsSource],
  ["/dashboard-aeo-metrics.js", dashboardAeoMetricsSource],
]);

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,x-webmcp-admin-token"
};

const MAX_FOOTPRINTS = 1000;
const MAX_AB_EVENTS = 5000;
const AUTH_TOKEN_TTL_SECONDS = 15 * 60;
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const AUTH_TOKEN_PREFIX = "auth-token:";
const SESSION_PREFIX = "auth-session:";
const AUTH_RATE_PREFIX = "auth-rate:";
const AUTH_MIN_INTERVAL_MS = 60 * 1000;
const AUTH_HOURLY_LIMIT = 5;
const AUTH_RATE_WINDOW_MS = 60 * 60 * 1000;
const AGENT_HOST_MISMATCH_PREFIX = "agent-auth-host-mismatch:";
const FOOTPRINT_MAX_BYTES = 256 * 1024;
const DEFAULT_JSON_MAX_BYTES = 64 * 1024;
const PAGE_META_TTL_SECONDS = 7 * 24 * 60 * 60;
const PAGE_META_JSON_LD_MAX_BYTES = 10 * 1024;
const ORG_SCHEMA_TTL_SECONDS = 30 * 24 * 60 * 60;
const ORGANIZATION_EXTRACTION_SYSTEM_PROMPT = "Extract organization/company information ONLY if clearly present in the provided page metadata. Do NOT guess or infer. If a field is not clearly stated, omit it or use empty. Return JSON only: {\"name\":\"\",\"url\":\"\",\"logo\":\"\",\"description\":\"\",\"sameAs\":[]}. If no clear organization info exists, return all-empty.";
const FAQ_SCHEMA_TTL_SECONDS = 30 * 24 * 60 * 60;
const FAQ_EXTRACTION_SYSTEM_PROMPT = "Extract FAQ (question-answer pairs) ONLY if clearly present in the provided page metadata (headings, description, existing JSON-LD). Do NOT invent questions or answers. Do NOT infer. If clear FAQ content is not present, return empty. Return JSON only: {\"faqs\":[{\"question\":\"\",\"answer\":\"\"}]}. If no clear FAQ exists, return {\"faqs\":[]}.";
const ARTICLE_SCHEMA_TTL_SECONDS = 30 * 24 * 60 * 60;
const ARTICLE_EXTRACTION_SYSTEM_PROMPT = "Extract article/blog post information ONLY if this page is clearly an article or blog post AND the information is clearly present in the metadata. Do NOT guess author or date if not stated. Do NOT infer. If this is not clearly an article/blog page, return empty. Return JSON only: {\"isArticle\":false,\"headline\":\"\",\"author\":\"\",\"datePublished\":\"\",\"description\":\"\"}. If not an article, set isArticle to false and return empty fields.";
const RATE_LIMIT_PREFIX = "rate-limit:";
const SITE_KEY_ISSUE_TOTAL_PREFIX = "site-key-issue-total:";
const STRIPE_EVENT_PREFIX = "stripe-event:";
const DASHBOARD_ORIGIN = "https://nurevo.jp";
const COOKIE_AUTH_PATHS = new Set([
  "/api/auth/session",
  "/api/auth/logout",
  "/api/billing/checkout",
  "/api/site-insights"
]);
const ALLOWED_EVENT_KEYS = new Set(["type", "selector", "key", "timestampOffsetMs", "errorText", "validity", "changed", "beforeLength", "afterLength", "errorName", "toolName"]);
const ALLOWED_VALIDITY_KEYS = new Set(["valueMissing", "typeMismatch", "patternMismatch", "tooShort", "tooLong", "rangeUnderflow", "rangeOverflow", "stepMismatch", "badInput", "customError", "valid"]);

export default {
  async scheduled(event, env, ctx) {
    const dailyCron = "17 18 * * *";
    const weeklyCron = "17 18 * * 1";
    const cron = String(event?.cron || "");
    const jobs = [];

    // Form learning and AEO diagnostics remain daily. AEO brain learning is weekly.
    if (cron === dailyCron) {
      jobs.push(
        runLearningJob(env, { trigger: "scheduled" }).then((result) => {
          console.log("webmcp-learning", JSON.stringify(result));
        }).catch((error) => {
          console.error("webmcp-learning-error", JSON.stringify({ message: String(error?.message || error) }));
        }),
        runAeoScoreCron(env).then((result) => {
          console.log("aeo-score-cron", JSON.stringify(result));
        }).catch((error) => {
          console.error("aeo-score-cron-error", JSON.stringify({ message: String(error?.message || error) }));
        }),
      );
    } else if (cron === weeklyCron) {
      jobs.push(
        runAeoLearningJob(env, { trigger: "scheduled" }).then((result) => {
          console.log("aeo-learning", JSON.stringify(result));
        }).catch((error) => {
          console.error("aeo-learning-error", JSON.stringify({ message: String(error?.message || error) }));
        }),
      );
    } else {
      console.warn("scheduled-unknown-cron", JSON.stringify({ cron }));
    }
    if (jobs.length) ctx.waitUntil(Promise.all(jobs));
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      if (request.headers.get("origin") && !isAllowedOrigin(request, env)) {
        return json({ error: "origin_not_allowed" }, 403, request, env);
      }
      return json({}, 204, request, env);
    }
    if (url.pathname === "/api/diagnose") return handleDiagnose(request, env);

    try {
      const requestOrigin = request.headers.get("origin");
      if (url.pathname.startsWith("/api/") && !isAllowedOrigin(request, env)) {
        return json({
          error: "origin_not_allowed",
          allowedOrigins: originPolicy(env).allowedOrigins
        }, 403, request, env);
      }

      const nurevoResponse = await handleApi(request, env, ctx);
      if (nurevoResponse) return withCors(nurevoResponse, request, env);

      if (url.pathname === "/api/agent-authorization") {
        const authorization = await agentAuthorization(request, env, url.searchParams.get("site_key"));
        const registered = authorization.registered;
        return json({
          registered,
          quality: authorization.plan === "pro" && registered ? "high" : "basic",
          reason: authorization.reason
        }, 200, request, env);
      }

      if (url.pathname === "/api/auth/request" && request.method === "POST") {
        return handleAuthRequest(request, env);
      }

      if (url.pathname === "/api/auth/verify" && request.method === "GET") {
        return handleAuthVerify(request, env);
      }

      if (url.pathname === "/api/auth/session" && request.method === "GET") {
        return handleAuthSession(request, env);
      }

      if (url.pathname === "/api/auth/logout" && request.method === "POST") {
        return handleAuthLogout(request, env);
      }

      if (url.pathname === "/api/billing/checkout" && request.method === "POST") {
        return handleBillingCheckout(request, env);
      }

      if (url.pathname === "/api/billing/webhook" && request.method === "POST") {
        return handleBillingWebhook(request, env);
      }

      if (url.pathname === "/api/site-key" && request.method === "POST") {
        const payload = await readJson(request);
        const duplicate = await duplicateSiteRegistration(env, payload);
        if (duplicate) return json(duplicate, 409, request, env);
        const limited = await limitSiteKeyIssuance(request, env, payload);
        if (!limited.ok) return json({ error: "rate_limited", message: "Too many site key requests. Please try again later." }, 429, request, env);
        const result = await issueSiteKey(env, payload, url.origin);
        if (result.ok) await recordSiteKeyIssuance(env);
        return json(result, result.ok ? 201 : result.error === "duplicate_site_host" ? 409 : 400, request, env);
      }

      if (url.pathname === "/api/site-keys" && request.method === "GET") {
        const auth = await requireAdmin(request, env);
        if (!auth.ok) return json({ error: auth.error }, auth.status, request, env);
        return json(await listSiteKeys(env), 200, request, env);
      }

      if (url.pathname === "/api/site-key/regenerate" && request.method === "POST") {
        const auth = await requireAdmin(request, env);
        if (!auth.ok) return json({ error: auth.error }, auth.status, request, env);
        const result = await regenerateSiteKey(env, await readJson(request));
        return json(result, result.ok ? 200 : 400, request, env);
      }

      if (url.pathname === "/api/site-key/plan" && request.method === "POST") {
        const auth = await requireAdmin(request, env);
        if (!auth.ok) return json({ error: auth.error }, auth.status, request, env);
        const result = await updateSiteKeyPlan(env, await readJson(request));
        return json(result, result.ok ? 200 : 400, request, env);
      }

      if (url.pathname === "/api/site-key/disable" && request.method === "POST") {
        const auth = await requireAdmin(request, env);
        if (!auth.ok) return json({ error: auth.error }, auth.status, request, env);
        const result = await disableSiteKey(env, await readJson(request));
        return json(result, result.ok ? 200 : 400, request, env);
      }

      if (url.pathname === "/api/mcp-definition" && request.method === "POST") {
        const payload = await readJson(request, FOOTPRINT_MAX_BYTES);
        const mcpAccess = await authorizeMcpDefinition(request, env, payload);
        if (!mcpAccess.ok) return json({ error: mcpAccess.error }, mcpAccess.status, request, env);
        const registered = mcpAccess.plan === "pro";
        const formStructure = payload?.formStructure ?? {};
        const formHash = await hashFormStructure(formStructure);
        const insights = await loadInsights(env);
        const experiment = await assignExperiment({
          env,
          site: payload?.site ?? {},
          registered,
          formHash
        });
        const definition = await generateMcpDefinition({
          env,
          registered,
          quality: registered ? "high" : "basic",
          site: payload?.site ?? {},
          formStructure,
          insights,
          experiment
        });
        await appendAbEvent(env, {
          type: "exposure",
          createdAt: new Date().toISOString(),
          siteId: siteId(payload?.site ?? {}),
          formHash,
          experiment
        });
        return json(definition, 200, request, env);
      }

      if (url.pathname === "/api/footprint" && request.method === "POST") {
        const payload = await readJson(request, FOOTPRINT_MAX_BYTES);
        const access = await authorizeFootprint(request, env, payload);
        if (!access.ok) return json({ error: access.error }, access.status, request, env);
        const rate = await limitFootprint(request, env, access.record.siteKey);
        if (!rate.ok) return json({ error: "rate_limited" }, 429, request, env);
        const footprint = await sanitizeFootprint(payload);
        await appendFootprint(env, footprint);
        if (footprint.experiment?.variant) {
          await appendAbEvent(env, {
            type: "result",
            createdAt: footprint.createdAt,
            siteId: siteId(footprint.site),
            formHash: footprint.formHash,
            experiment: footprint.experiment,
            result: footprint.result
          });
        }
        const rebuild = Promise.all([
          rebuildInsights(env),
          rebuildAbState(env)
        ]);
        if (ctx?.waitUntil) {
          ctx.waitUntil(rebuild);
        } else {
          await rebuild;
        }
        return json({
          ok: true,
          footprintId: footprint.id,
          formHash: footprint.formHash,
          insightRebuild: ctx?.waitUntil ? "queued" : "completed"
        }, 200, request, env);
      }

      if (url.pathname === "/api/insights") {
        const auth = await requireAdmin(request, env);
        if (!auth.ok) return json({ error: auth.error }, auth.status, request, env);
        return json(await loadInsights(env), 200, request, env);
      }
      if (url.pathname === "/api/ab-results") {
        const auth = await requireAdmin(request, env);
        if (!auth.ok) return json({ error: auth.error }, auth.status, request, env);
        return json(await loadAbState(env), 200, request, env);
      }
      if (url.pathname === "/api/traffic-health") {
        const auth = await requireAdmin(request, env);
        if (!auth.ok) return json({ error: auth.error }, auth.status, request, env);
        const health = await trafficHealth(env);
        return json(health, health.ok ? 200 : 503, request, env);
      }

      if (url.pathname === "/api/llms.txt" && request.method === "GET") {
        const siteKey = url.searchParams.get("site_key");
        const requestedHost = url.searchParams.get("host");
        if (!siteKey || !requestedHost) return json({ error: "missing_site_key_or_host" }, 400, request, env);
        const access = await authorizeSiteKeyHost(env, siteKey, requestedHost);
        if (!access.ok) return json({ error: "forbidden" }, 403, request, env);
        if (!isProSiteKey(siteKey, env, access.record)) return json({ error: "not_found" }, 404, request, env);
        const body = await generateLlmsTxt(env, { host: access.record.siteHost });
        return new Response(body, {
          status: 200,
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-store"
          }
        });
      }

      if (url.pathname === "/api/page-meta" && request.method === "POST") {
        const payload = await readJson(request);
        const siteKey = String(payload?.siteKey || payload?.site_key || "").trim();
        const requestedHost = String(payload?.host || "");
        if (!siteKey || !requestedHost) return json({ error: "missing_site_key_or_host" }, 400, request, env);
        const access = await authorizeSiteKeyHost(env, siteKey, requestedHost);
        if (!access.ok) return json({ error: "forbidden" }, 403, request, env);
        if (!isProSiteKey(siteKey, env, access.record)) return json({ error: "not_found" }, 404, request, env);
        const result = await storePageMeta(env, {
          siteKey,
          host: access.record.siteHost,
          pathname: payload?.pathname,
          meta: payload?.meta
        });
        return json({ ok: true, key: result.key, expiresIn: PAGE_META_TTL_SECONDS }, 200, request, env);
      }

      if (url.pathname === "/api/org-schema" && request.method === "GET") {
        const siteKey = String(url.searchParams.get("site_key") || "").trim();
        const requestedHost = String(url.searchParams.get("host") || "").trim();
        const pathname = url.searchParams.get("pathname");
        if (!siteKey || !requestedHost) return json({ error: "missing_site_key_or_host" }, 400, request, env);
        const access = await authorizeSiteKeyHost(env, siteKey, requestedHost);
        if (!access.ok) return json({ error: "forbidden" }, 403, request, env);
        if (!isProSiteKey(siteKey, env, access.record)) return json({ error: "not_found" }, 404, request, env);
        const result = await organizationSchemaForPage(env, {
          siteKey,
          host: access.record.siteHost,
          pathname
        });
        if (!result.found || !result.schema) return json({ error: "not_found" }, 404, request, env);
        return json(result.schema, 200, request, env);
      }

      if (url.pathname === "/api/faq-schema" && request.method === "GET") {
        const siteKey = String(url.searchParams.get("site_key") || "").trim();
        const requestedHost = String(url.searchParams.get("host") || "").trim();
        const pathname = url.searchParams.get("pathname");
        if (!siteKey || !requestedHost) return json({ error: "missing_site_key_or_host" }, 400, request, env);
        const access = await authorizeSiteKeyHost(env, siteKey, requestedHost);
        if (!access.ok) return json({ error: "forbidden" }, 403, request, env);
        if (!isProSiteKey(siteKey, env, access.record)) return json({ error: "not_found" }, 404, request, env);
        const result = await faqSchemaForPage(env, {
          siteKey,
          host: access.record.siteHost,
          pathname
        });
        if (!result.found || !result.schema) return json({ error: "not_found" }, 404, request, env);
        return json(result.schema, 200, request, env);
      }

      if (url.pathname === "/api/article-schema" && request.method === "GET") {
        const siteKey = String(url.searchParams.get("site_key") || "").trim();
        const requestedHost = String(url.searchParams.get("host") || "").trim();
        const pathname = url.searchParams.get("pathname");
        if (!siteKey || !requestedHost) return json({ error: "missing_site_key_or_host" }, 400, request, env);
        const access = await authorizeSiteKeyHost(env, siteKey, requestedHost);
        if (!access.ok) return json({ error: "forbidden" }, 403, request, env);
        if (!isProSiteKey(siteKey, env, access.record)) return json({ error: "not_found" }, 404, request, env);
        const result = await articleSchemaForPage(env, {
          siteKey,
          host: access.record.siteHost,
          pathname
        });
        if (!result.found || !result.schema) return json({ error: "not_found" }, 404, request, env);
        return json(result.schema, 200, request, env);
      }

      if (url.pathname === "/api/aeo-schemas" && request.method === "GET") {
        const siteKey = String(url.searchParams.get("site_key") || "").trim();
        const requestedHost = String(url.searchParams.get("host") || "").trim();
        const pathname = url.searchParams.get("pathname");
        if (!siteKey || !requestedHost) return json({ error: "missing_site_key_or_host" }, 400, request, env);
        const access = await authorizeSiteKeyHost(env, siteKey, requestedHost);
        if (!access.ok) return json({ error: "forbidden" }, 403, request, env);
        if (!isProSiteKey(siteKey, env, access.record)) return json({ error: "not_found" }, 404, request, env);
        const input = { siteKey, host: access.record.siteHost, pathname };
        const results = await Promise.all([
          organizationSchemaForPage(env, input),
          faqSchemaForPage(env, input),
          articleSchemaForPage(env, input)
        ]);
        return json({ schemas: results.map((result) => result.schema).filter(Boolean) }, 200, request, env);
      }

      if (url.pathname === "/api/site-insights") {
        const siteKey = url.searchParams.get("site_key");
        const requestedHost = url.searchParams.get("host");
        const sessionAuthorized = await sessionOwnsSiteKey(request, env, siteKey);
        const hasAdminCredential = Boolean(request.headers.get("x-webmcp-admin-token"));
        const admin = !sessionAuthorized && hasAdminCredential ? await requireAdmin(request, env) : null;
        const siteKeyHostAccess = !sessionAuthorized && !admin?.ok
          ? await authorizeSiteKeyHost(env, siteKey, requestedHost)
          : { ok: false };
        if (!sessionAuthorized && !admin?.ok && !siteKeyHostAccess.ok) {
          return json({ error: admin?.status === 503 ? admin.error : "forbidden" }, admin?.status === 503 ? 503 : 403, request, env);
        }
        return json(await siteInsights(env, {
          host: requestedHost,
          siteKey
        }), 200, request, env);
      }

      if (url.pathname === "/api/repair-insights" && request.method === "POST") {
        const auth = await requireAdmin(request, env);
        if (!auth.ok) return json({ error: auth.error }, auth.status, request, env);
        if (!env.OPENAI_API_KEY) {
          return json({
            error: "OPENAI_API_KEY is required for LLM-backed repair. Set a Cloudflare Worker secret and retry.",
            code: "OPENAI_API_KEY_MISSING"
          }, 412, request, env);
        }
        return json(await repairInsightsEndpoint(env), 200, request, env);
      }

      if (url.pathname === "/api/learned-rules" && request.method === "GET") {
        const auth = await requireAdmin(request, env);
        if (!auth.ok) return json({ error: auth.error }, auth.status, request, env);
        return json(await listLearnedRules(env), 200, request, env);
      }

      if (url.pathname === "/api/learning/run" && request.method === "POST") {
        const auth = await requireAdmin(request, env);
        if (!auth.ok) return json({ error: auth.error }, auth.status, request, env);
        return json(await runLearningJob(env, { trigger: "manual" }), 200, request, env);
      }

      const dashboardScript = DASHBOARD_SCRIPT_SOURCES.get(url.pathname);
      if (request.method === "GET" && dashboardScript) {
        return new Response(dashboardScript, {
          status: 200,
          headers: {
            "content-type": "application/javascript; charset=utf-8",
            "cache-control": "no-cache, no-store, must-revalidate",
          },
        });
      }

      if (url.pathname === "/dashboard" || url.pathname === "/dashboard/") {
        const asset = await env.ASSETS.fetch(new Request(new URL("/dashboard.html", url), request));
        if (asset.ok) {
          const html = await asset.text();
          const branding = `<style>.brand{display:inline-flex!important;align-items:center;gap:8px;text-decoration:none}.brand .mk{width:28px!important;height:28px!important;background:url('/assets/logo.png') center/contain no-repeat!important;border-radius:0!important;box-shadow:none!important}.brand .mk:after{display:none!important}.account{display:inline-flex!important;align-items:center;gap:10px;margin-left:auto;color:#5b6472;font-size:13px}.account button{cursor:pointer}</style><script src="/dashboard-auth.js" defer></script>`;
          const headers = new Headers(asset.headers);
          headers.set("x-nurevo-dashboard-branding", "logo");
          return new Response(html.replace("</head>", `${branding}</head>`), { status: asset.status, headers });
        }
      }
      return env.ASSETS.fetch(request);
    } catch (error) {
      if (error instanceof PublicHttpError) return json({ error: error.code }, error.status, request, env);
      console.error("request_error", JSON.stringify({
        path: url.pathname,
        name: error?.name || "Error",
        message: error?.message || String(error),
        stack: error?.stack || null,
      }));
      return json({ error: "internal_error" }, 500, request, env);
    }
  }
};

function json(body, status = 200, request = null, env = null) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: corsHeaders(request, env)
  });
}

class PublicHttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

async function readJson(request, maxBytes = DEFAULT_JSON_MAX_BYTES) {
  const text = await readText(request, maxBytes);
  try {
    return JSON.parse(text);
  } catch {
    throw new PublicHttpError(400, "invalid_json");
  }
}

async function readText(request, maxBytes = DEFAULT_JSON_MAX_BYTES) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > maxBytes) throw new PublicHttpError(413, "payload_too_large");
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > maxBytes) throw new PublicHttpError(413, "payload_too_large");
  return new TextDecoder().decode(bytes);
}

function corsHeaders(request, env) {
  const headers = new Headers(JSON_HEADERS);
  const origin = request?.headers?.get("origin");
  const pathname = request ? new URL(request.url).pathname : "";
  if (COOKIE_AUTH_PATHS.has(pathname)) {
    if (origin && isAllowedOrigin(request, env)) {
      headers.set("access-control-allow-origin", origin);
      headers.set("access-control-allow-credentials", "true");
      headers.set("vary", "Origin");
    } else {
      headers.delete("access-control-allow-origin");
      headers.delete("access-control-allow-credentials");
    }
    return headers;
  }
  if (origin && (!env || isAllowedOrigin(request, env))) {
    headers.set("access-control-allow-origin", origin);
    headers.set("vary", "Origin");
  } else {
    headers.set("access-control-allow-origin", "*");
  }
  return headers;
}

function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  const cors = corsHeaders(request, env);
  for (const [key, value] of cors.entries()) {
    if (key === "content-type" || key === "cache-control") continue;
    headers.set(key, value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function dashboardOrigin(env) {
  return String(env?.WEBMCP_DASHBOARD_ORIGIN || DASHBOARD_ORIGIN).replace(/\/$/, "");
}

async function getJson(env, key, fallback) {
  if (!env.WEBMCP_KV) throw new Error("WEBMCP_KV binding is missing");
  const value = await env.WEBMCP_KV.get(key, "json");
  return value ?? fallback;
}

async function putJson(env, key, value) {
  if (!env.WEBMCP_KV) throw new Error("WEBMCP_KV binding is missing");
  await env.WEBMCP_KV.put(key, JSON.stringify(value));
}

function hasD1(env) {
  return Boolean(env.WEBMCP_DB?.prepare);
}

async function d1SiteId(env, site) {
  const host = String(site?.host || "unknown");
  await env.WEBMCP_DB.prepare("INSERT OR IGNORE INTO sites (host) VALUES (?)").bind(host).run();
  const row = await env.WEBMCP_DB.prepare("SELECT id FROM sites WHERE host = ?").bind(host).first();
  return row?.id;
}

async function d1UpsertForm(env, footprint, siteIdValue) {
  await env.WEBMCP_DB.prepare(`
    INSERT INTO forms (form_hash, site_id, form_id, structure_json, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(form_hash) DO UPDATE SET
      site_id = excluded.site_id,
      form_id = excluded.form_id,
      structure_json = excluded.structure_json,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    footprint.formHash,
    siteIdValue,
    footprint.formStructure?.formId || null,
    JSON.stringify(footprint.formStructure || {})
  ).run();
}

async function generateMcpDefinition({ env, registered, quality, site, formStructure, insights, experiment }) {
  const fields = formStructure.fields ?? [];
  const properties = {};
  const required = [];
  const formHash = await hashFormStructure(formStructure);
  const learnedRules = registered ? await learnedRulesForForm(env, insights, formHash, fields) : [];
  const appliedRuleIds = new Set();
  const autofill = [];

  for (const field of fields) {
    if (!field.selector || field.tag === "button" || field.type === "submit" || field.hidden) continue;
    const key = fieldKey(field);
    const learnedMatches = matchingLearnedRules(field, learnedRules);
    for (const rule of learnedMatches) appliedRuleIds.add(rule.id);
    const rules = [...matchingRules(field), ...learnedMatches];
    const helper = autofillForField(field, rules, registered);
    properties[key] = propertyForField(field, rules, registered, helper);
    if (registered) autofill.push({ key, selector: field.selector, ...helper });
    if (registered && isMeaningfulField(field)) required.push(key);
  }

  const formName = sanitizeName(`${site.host || "local"}_${formStructure.formId || "form"}`);
  const variant = experiment?.variant || "control";
  const toolName = `${quality}_${variant}_${formName}_helper`;
  const descriptionBase = registered
    ? highDescription({ site, fields })
    : `Basic helper generated from the visible form structure on ${site.host || "this site"}.`;
  const description = applyVariantToDescription(descriptionBase, variant);
  const aeo = generateAeoMetadata({ site, formStructure, fields, quality, variant, properties });
  const actionProfile = inferToolActionProfile({ site, formStructure, fields });
  const declarative = declarativeMetadata({ toolName, description, fields, properties, actionProfile });
  const learnedRuleIds = [...appliedRuleIds];
  if (learnedRuleIds.length) {
    await recordLearnedRuleApplications(env, learnedRuleIds, { site, formHash });
  }

  return {
    quality,
    experiment,
    tools: [
      {
        name: toolName,
        description,
        annotations: actionProfile.annotations,
        inputSchema: {
          type: "object",
          ...(required.length ? { required } : {}),
          properties
        },
        xWebMcpClientHints: {
          action: actionProfile.action,
          confirmationRequired: actionProfile.confirmationRequired,
          confirmation: actionProfile.confirmation,
          submissionGuard: actionProfile.submissionGuard,
          registrationMode: "auto",
          declarative,
          fillStrategy: (registered ? fields : [])
            .filter((field) => properties[fieldKey(field)])
            .map((field) => ({
              key: fieldKey(field),
              selector: field.selector,
              type: field.type,
              tag: field.tag
            }))
        }
      }
    ],
    aeo: registered ? aeo : null,
    autofill,
    formHash,
    webmcp: {
      registrationMode: "auto",
      originPolicy: originPolicy(env),
      declarative,
      learnedRuleIds: registered ? learnedRuleIds : []
    },
    ruleMatches: registered ? fields.flatMap((field) => [...matchingRules(field), ...matchingLearnedRules(field, learnedRules)].map((rule) => ({
      selector: field.selector,
      rule: rule.id
    }))) : [],
    insights: {
      suggestions: learnedRules.map((rule) => ({
        id: rule.id,
        selector: rule.selector,
        reason: rule.reason,
        confidence: rule.confidence
      }))
    }
  };
}

function inferToolActionProfile({ site, formStructure, fields }) {
  const text = [
    site.host,
    site.pathname,
    formStructure.formId,
    ...fields.flatMap((field) => [field.name, field.id, field.label, field.placeholder, field.type])
  ].filter(Boolean).join(" ");
  const readOnly = /search|lookup|check|確認|検索|照会|availability|inventory|stock|status/i.test(text)
    && !/submit|send|contact|message|register|signup|申込|登録|予約|booking|reservation|checkout|purchase|payment|order|buy|問い合わせ/i.test(text);
  const destructive = /submit|send|contact|message|register|signup|申込|登録|予約|booking|reservation|checkout|purchase|payment|order|buy|問い合わせ|送信|購入|決済|確定/i.test(text);
  const idempotent = readOnly || !destructive;
  return {
    action: readOnly ? "read" : destructive ? "submit_or_commit" : "fill_form",
    confirmationRequired: destructive,
    annotations: {
      title: inferActionTitle(text),
      readOnlyHint: readOnly,
      destructiveHint: destructive,
      idempotentHint: idempotent,
      openWorldHint: true
    },
    confirmation: destructive ? {
      required: true,
      reason: "This form appears to submit, register, reserve, purchase, or otherwise commit user-provided data.",
      prompt: "Confirm before clicking any final submit, purchase, registration, reservation, or send button.",
      destructiveKeywords: ["submit", "send", "register", "signup", "booking", "reservation", "checkout", "purchase", "payment", "order", "送信", "登録", "予約", "購入", "決済", "確定"]
    } : null,
    submissionGuard: {
      enabled: true,
      duplicateWindowMs: destructive ? 30000 : 5000,
      neverAutoSubmitWithoutConfirmation: true
    },
    formSelector: formStructure.formSelector || "form"
  };
}

function inferActionTitle(text) {
  if (/booking|reservation|予約/i.test(text)) return "Complete booking form";
  if (/checkout|purchase|payment|order|購入|決済/i.test(text)) return "Complete checkout form";
  if (/contact|問い合わせ|message|send|送信/i.test(text)) return "Complete contact form";
  if (/register|signup|登録|申込/i.test(text)) return "Complete registration form";
  if (/search|lookup|検索|照会/i.test(text)) return "Read form information";
  return "Complete web form";
}

function declarativeMetadata({ toolName, description, fields, properties, actionProfile }) {
  return {
    formSelector: actionProfile.formSelector || "form",
    toolname: toolName,
    tooldescription: description,
    action: actionProfile.action,
    confirmationRequired: actionProfile.confirmationRequired,
    parameters: fields
      .filter((field) => properties[fieldKey(field)])
      .map((field) => ({
        selector: field.selector,
        key: fieldKey(field),
        toolparamdescription: properties[fieldKey(field)]?.description || field.label || field.placeholder || field.name || field.id || field.selector
      }))
  };
}

function originPolicy(env) {
  const allowed = String(env.WEBMCP_ALLOWED_ORIGINS || "*")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return {
    allowedOrigins: allowed.length ? allowed : ["*"],
    externalInjection: "allowed-by-tag-loader",
    cspFallback: "declarative-autofill-footprint"
  };
}

function isAllowedOrigin(request, env) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const allowed = originPolicy(env).allowedOrigins.map((value) => String(value).replace(/\/$/, ""));
  if (allowed.includes("*")) return true;
  try {
    const parsed = new URL(origin);
    return allowed.includes(parsed.origin) || allowed.includes(parsed.host);
  } catch {
    return false;
  }
}

const RULE_TABLE = [
  {
    id: "jp-phone-digits-only",
    match: (field) => /phone|tel|電話/i.test(fieldText(field)),
    apply: (property) => {
      property.pattern = "^[0-9]{10,11}$";
      property.description = append(property.description, "Phone number must be digits only. Remove hyphens.");
      property.examples = ["09012345678"];
      property["x-autofill"] = {
        valueType: "phone",
        inputMode: "numeric",
        example: "09012345678",
        format: "digits_only",
        transform: "digits_only",
        helperText: "Remove hyphens and use 10 to 11 digits."
      };
    }
  },
  {
    id: "jp-postal-code-digits-only",
    match: (field) => /postal|postcode|zip|郵便/i.test(fieldText(field)),
    apply: (property) => {
      property.pattern = "^[0-9]{7}$";
      property.description = append(property.description, "Japanese postal code must be 7 digits. Remove hyphens.");
      property.examples = ["1500001"];
      property["x-autofill"] = {
        valueType: "postal_code",
        inputMode: "numeric",
        example: "1500001",
        format: "digits_only_7",
        transform: "digits_only",
        helperText: "Remove hyphens and use 7 digits."
      };
    }
  },
  {
    id: "date-iso-format",
    match: (field) => field.type === "date" || /date|日付/i.test(fieldText(field)),
    apply: (property) => {
      property.format = "date";
      property.description = append(property.description, "Use YYYY-MM-DD format.");
      property.examples = ["2026-03-15"];
      property["x-autofill"] = {
        valueType: "date",
        example: "2026-03-15",
        format: "YYYY-MM-DD",
        transform: "date_iso",
        helperText: "Use YYYY-MM-DD."
      };
    }
  },
  {
    id: "company-example",
    match: (field) => /company|会社/i.test(fieldText(field)),
    apply: (property) => {
      property.description = append(property.description, "Use the legal company name if provided.");
      property.examples = ["Example Inc."];
      property["x-autofill"] = {
        valueType: "company",
        example: "Example Inc.",
        format: "legal_name",
        transform: "trim",
        helperText: "Trim surrounding whitespace."
      };
    }
  }
];

function matchingRules(field) {
  return RULE_TABLE.filter((rule) => rule.match(field));
}

function propertyForField(field, rules, registered, helper) {
  const property = { type: field.type === "number" ? "number" : "string" };
  if (field.label || field.placeholder) property.description = [field.label, field.placeholder].filter(Boolean).join(" / ");
  if (registered && field.options?.length) {
    property.enum = field.options.map((option) => option.value).filter(Boolean);
    property.description = append(property.description, `Options: ${field.options.map((option) => `${option.value}=${option.text}`).join(", ")}`);
  }
  if (registered) for (const rule of rules) rule.apply(property);
  property["x-autofill"] = { ...(property["x-autofill"] ?? {}), ...helper };
  return property;
}

function autofillForField(field, rules, registered) {
  const property = {};
  if (registered) for (const rule of rules) rule.apply(property);
  const inferred = inferAutofill(field);
  const helper = {
    valueType: property["x-autofill"]?.valueType ?? inferred.valueType,
    inputMode: property["x-autofill"]?.inputMode ?? inferred.inputMode,
    format: property["x-autofill"]?.format ?? inferred.format,
    transform: property["x-autofill"]?.transform ?? inferred.transform,
    example: property.examples?.[0] ?? inferred.example,
    helperText: property["x-autofill"]?.helperText ?? inferred.helperText,
    pattern: property.pattern,
    required: registered && isMeaningfulField(field)
  };
  if (field.options?.length) helper.options = field.options.filter((option) => option.value).map((option) => ({ value: option.value, text: option.text }));
  return Object.fromEntries(Object.entries(helper).filter(([, value]) => value !== undefined));
}

function inferAutofill(field) {
  const text = fieldText(field);
  if (field.type === "email" || /mail|メール/i.test(text)) return { valueType: "email", inputMode: "email", format: "email", transform: "trim", example: "taro@example.com", helperText: "Use an email address." };
  if (field.type === "number" || /income|amount|price|年収|金額/i.test(text)) return { valueType: "number", inputMode: "numeric", format: "number", transform: "number_digits", example: "5000000", helperText: "Use digits only." };
  if (field.tag === "select") return { valueType: "select", format: "select_option", helperText: "Choose one of the visible options." };
  return { valueType: "text", format: "text", transform: "trim", example: field.placeholder || undefined, helperText: "Trim surrounding whitespace." };
}

function matchingLearnedRules(field, learnedRules) {
  return learnedRules
    .filter((rule) =>
      rule.selector === field.selector ||
      rule.key === fieldKey(field) ||
      rule.fieldSignature === fieldSignature(field) ||
      (rule.ruleKind && inferredRuleKindsForField(field).includes(rule.ruleKind))
    )
    .map((rule) => ({
      id: rule.id,
      apply: (property) => {
        property.description = append(property.description, `Learned from privacy-safe footprints: ${rule.reason}`);
        if (rule.pattern) property.pattern = rule.pattern;
        if (rule.examples?.length) property.examples = rule.examples;
        property["x-autofill"] = {
          ...(property["x-autofill"] ?? {}),
          ...rule.autofill,
          helperText: rule.reason
        };
      }
    }));
}

function generateAeoMetadata({ site, formStructure, fields, quality, variant, properties }) {
  const visibleFields = fields.filter((field) => isMeaningfulField(field));
  const actions = inferSiteActions(visibleFields);
  const name = `${site.title || site.host || "Web form"} ${formStructure.formId || "form"}`.trim();
  const url = site.host ? `https://${site.host}${site.pathname || "/"}` : undefined;
  return {
    variant,
    quality,
    actions,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name,
      ...(url ? { url } : {}),
      applicationCategory: "Web form automation",
      description: variant === "treatment"
        ? "Agent-readable form metadata with field formats, required fields, and validation-aware completion hints."
        : "Agent-readable form metadata for discovering available web form actions.",
      potentialAction: actions.map((action) => ({
        "@type": "Action",
        name: action.name,
        target: {
          "@type": "EntryPoint",
          ...(url ? { urlTemplate: url } : {}),
          actionPlatform: [
            "https://schema.org/DesktopWebPlatform",
            "https://schema.org/MobileWebPlatform"
          ]
        },
        object: {
          "@type": "PropertyValueSpecification",
          valueName: action.valueName,
          description: action.description
        }
      })),
      additionalProperty: visibleFields.map((field) => ({
        "@type": "PropertyValue",
        name: fieldKey(field),
        description: properties[fieldKey(field)]?.description || field.label || field.name || field.id || field.selector
      }))
    }
  };
}

function inferSiteActions(fields) {
  const text = fields.map(fieldText).join(" ");
  const actions = [];
  if (/booking|予約|date|日付|destination|目的地/i.test(text)) actions.push({ name: "Complete booking form", valueName: "booking_request", description: "The site can accept a booking or reservation request." });
  if (/contact|問い合わせ|message|email|メール/i.test(text)) actions.push({ name: "Submit contact form", valueName: "contact_request", description: "The site can accept an inquiry or contact request." });
  if (/application|申込|register|登録|company|会社/i.test(text)) actions.push({ name: "Complete application form", valueName: "application_request", description: "The site can accept a registration or application request." });
  return actions.length ? actions : [{ name: "Complete web form", valueName: "form_request", description: "The site can accept structured form input." }];
}

async function generateLlmsTxt(env, { host }) {
  const metadata = await loadLlmsSiteMetadata(env, host);
  const siteName = llmsText(metadata.title || host, host);
  const description = `Information and form actions available on ${siteName}.`;
  const actionLines = metadata.forms.map((form, index) => {
    const structure = form.formStructure || {};
    const fields = (structure.fields || []).filter((field) => !field.hidden);
    const actions = inferSiteActions(fields);
    const formName = llmsText(structure.formName || structure.formId || `Form ${index + 1}`, `Form ${index + 1}`);
    return `- ${formName}: ${actions.map((action) => llmsText(action.description, "The site can accept structured form input.")).join(" ")}`;
  });
  if (!actionLines.length) actionLines.push("- No form actions are currently available.");
  return `# ${siteName}\n\n> ${description}\n\n## Actions\n${actionLines.join("\n")}\n`;
}

async function loadLlmsSiteMetadata(env, host) {
  if (hasD1(env)) {
    const rows = await env.WEBMCP_DB.prepare(`
      SELECT fo.form_hash, fo.form_id, fo.structure_json
      FROM forms fo
      INNER JOIN sites s ON s.id = fo.site_id
      WHERE s.host = ?
      ORDER BY fo.updated_at DESC
      LIMIT 100
    `).bind(host).all();
    return {
      title: null,
      forms: (rows.results || []).map((row) => ({
        formHash: row.form_hash,
        formStructure: safeJson(row.structure_json, { formId: row.form_id, fields: [] })
      }))
    };
  }
  const footprints = await getJson(env, "footprints", []);
  const matching = footprints.filter((footprint) => String(footprint.site?.host || "").toLowerCase() === host.toLowerCase());
  const forms = new Map();
  for (const footprint of matching) {
    const key = footprint.formHash || JSON.stringify(footprint.formStructure || {});
    forms.set(key, { formHash: footprint.formHash || null, formStructure: footprint.formStructure || {} });
  }
  return {
    title: matching.find((footprint) => footprint.site?.title)?.site.title || null,
    forms: [...forms.values()]
  };
}

function llmsText(value, fallback) {
  return String(value || fallback || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 200);
}

async function sanitizeFootprint(payload) {
  const formStructure = payload?.formStructure ?? {};
  const events = Array.isArray(payload?.events) ? payload.events : [];
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    site: {
      host: String(payload?.site?.host ?? ""),
      pathname: String(payload?.site?.pathname ?? "")
    },
    formHash: payload?.formHash || await hashFormStructure(formStructure),
    experiment: sanitizeExperiment(payload?.experiment),
    learnedRuleIds: sanitizeRuleIds(payload?.learnedRuleIds),
    formStructure: {
      formId: formStructure.formId ?? null,
      formName: formStructure.formName ?? null,
      formUid: formStructure.formUid ?? null,
      formIndex: Number(formStructure.formIndex ?? 0),
      formSelector: formStructure.formSelector ?? null,
      fields: (formStructure.fields ?? []).map((field) => ({
        selector: field.selector,
        key: fieldKey(field),
        tag: field.tag,
        type: field.type,
        label: field.label,
        hidden: Boolean(field.hidden),
        visible: Boolean(field.visible),
        optionsCount: field.options?.length ?? 0
      }))
    },
    result: {
      status: ["success", "failure", "abandoned", "unknown"].includes(payload?.result?.status) ? payload.result.status : "unknown",
      completedStep: Number(payload?.result?.completedStep ?? 0),
      durationMs: Number(payload?.result?.durationMs ?? 0)
    },
    events: events.slice(0, 100).map(sanitizeFootprintEvent)
  };
}

function sanitizeFootprintEvent(event = {}) {
  const clean = {};
  for (const [key, value] of Object.entries(event)) {
    if (!ALLOWED_EVENT_KEYS.has(key)) continue;
    if (/value|textContent|innerText|outerText|html/i.test(key)) continue;
    if (key === "type") clean.type = String(value || "unknown").slice(0, 80);
    else if (key === "selector") clean.selector = String(value || "").slice(0, 160);
    else if (key === "key") clean.key = String(value || "").slice(0, 80);
    else if (key === "timestampOffsetMs") clean.timestampOffsetMs = Number(value || 0);
    else if (key === "errorText") clean.errorText = sanitizeText(value);
    else if (key === "validity") clean.validity = sanitizeValidity(value);
    else if (typeof value === "boolean") clean[key] = value;
    else if (typeof value === "number") clean[key] = value;
    else clean[key] = String(value || "").slice(0, 200);
  }
  clean.type ??= "unknown";
  clean.selector ??= "";
  clean.key ??= "";
  clean.timestampOffsetMs ??= 0;
  clean.errorText ??= "";
  clean.validity ??= sanitizeValidity({});
  return clean;
}

function sanitizeRuleIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .map((item) => String(item || "").trim())
    .filter((item) => /^[-_a-z0-9]{3,120}$/i.test(item))
  )].slice(0, 50);
}

async function appendFootprint(env, footprint) {
  if (hasD1(env)) {
    const siteIdValue = await d1SiteId(env, footprint.site);
    await d1UpsertForm(env, footprint, siteIdValue);
    await env.WEBMCP_DB.prepare(`
      INSERT OR REPLACE INTO footprints
        (id, site_id, form_hash, status, completed_step, duration_ms, experiment_json, learned_rule_ids_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      footprint.id,
      siteIdValue,
      footprint.formHash,
      footprint.result.status,
      footprint.result.completedStep,
      footprint.result.durationMs,
      JSON.stringify(footprint.experiment || null),
      JSON.stringify(footprint.learnedRuleIds || []),
      footprint.createdAt
    ).run();
    for (const event of footprint.events) {
      await env.WEBMCP_DB.prepare(`
        INSERT INTO footprint_events
          (footprint_id, selector, key, type, error_text, validity_json, timestamp_offset_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        footprint.id,
        event.selector,
        event.key,
        event.type,
        event.errorText || "",
        JSON.stringify(event.validity || {}),
        event.timestampOffsetMs || 0
      ).run();
    }
    return;
  }
  const footprints = await getJson(env, "footprints", []);
  footprints.push(footprint);
  await putJson(env, "footprints", footprints.slice(-MAX_FOOTPRINTS));
}

async function trafficHealth(env) {
  const minResults = Number(env.WEBMCP_TRAFFIC_MIN_RESULTS || 20);
  const maxFailureRate = Number(env.WEBMCP_TRAFFIC_MAX_FAILURE_RATE || 0.5);
  const footprints = hasD1(env) ? await d1ReadFootprints(env, 1000) : await getJson(env, "footprints", []);
  const sites = {};
  for (const footprint of footprints.slice(-1000)) {
    const key = siteId(footprint.site);
    const site = sites[key] ??= {
      results: 0,
      failures: 0,
      failureRate: 0,
      errorSpike: false
    };
    if (!["success", "failure"].includes(footprint.result?.status)) continue;
    site.results += 1;
    if (footprint.result.status === "failure") site.failures += 1;
  }
  for (const site of Object.values(sites)) {
    site.failureRate = site.results ? site.failures / site.results : 0;
    site.errorSpike = site.results >= minResults && site.failureRate > maxFailureRate;
  }
  const errorSpikes = Object.entries(sites)
    .filter(([, site]) => site.errorSpike)
    .map(([siteId, site]) => ({ siteId, ...site }));
  return {
    ok: errorSpikes.length === 0,
    generatedAt: new Date().toISOString(),
    config: { minResults, maxFailureRate },
    errorSpikes,
    sites
  };
}

async function siteInsights(env, { host, siteKey }) {
  const minSubmissions = Number(env.WEBMCP_SITE_INSIGHTS_MIN_SUBMISSIONS || 20);
  const priceMonthlyYen = Number(env.WEBMCP_PRO_PRICE_YEN || 3000);
  const siteKeyRecord = siteKey ? await findSiteKey(env, siteKey) : null;
  const proEnabled = isProSiteKey(siteKey, env, siteKeyRecord);
  const plan = proEnabled ? "pro" : "free";
  const footprints = hasD1(env) ? await d1ReadFootprints(env, 5000) : await getJson(env, "footprints", []);
  const allInsights = await loadInsights(env);
  const filtered = footprints.filter((footprint) => {
    if (!["success", "failure"].includes(footprint.result?.status)) return false;
    if (!host) return true;
    return footprint.site?.host === host;
  });
  const monthly = filtered.filter((footprint) => isCurrentMonth(footprint.createdAt));
  const submissions = filtered.length;
  const monthlySubmissions = monthly.length;
  const monthlySuccesses = monthly.filter((footprint) => footprint.result.status === "success").length;
  const monthlyCompletionRate = monthlySubmissions ? monthlySuccesses / monthlySubmissions : 0;
  const fieldStats = fieldFailureStats(filtered);
  const monthlyFieldStats = fieldFailureStats(monthly);
  const hasEnoughData = submissions >= minSubmissions;
  const suggestions = hasEnoughData ? improvementSuggestions({ fieldStats, submissions, allInsights }) : [];
  const formSummaries = formInsightSummaries({
    footprints: filtered,
    monthlyFootprints: monthly,
    minSubmissions,
    allInsights
  });

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    site: { host: host || null },
    plan,
    proEnabled,
    pricing: { monthlyYen: priceMonthlyYen },
    dataSufficiency: {
      currentSubmissions: submissions,
      requiredSubmissions: minSubmissions,
      remainingSubmissions: Math.max(0, minSubmissions - submissions),
      sufficient: hasEnoughData
    },
    basicStats: hasEnoughData ? {
      monthlySubmissions,
      completionRate: monthlyCompletionRate,
      topDropoffFields: monthlyFieldStats.slice(0, 3)
    } : null,
    benchmark: hasEnoughData ? {
      currentCompletionRate: monthlyCompletionRate,
      peerAverageCompletionRate: null,
      rankPercentile: null
    } : null,
    forms: formSummaries,
    suggestions,
    hasPromotableMetrics: hasEnoughData && suggestions.length > 0,
    newSuggestionCount: suggestions.length
      + formSummaries.flatMap((form) => form.suggestions || []).length
  };
}

function formInsightSummaries({ footprints, monthlyFootprints, minSubmissions, allInsights }) {
  const monthlyByFormHash = groupFootprintsByFormHash(monthlyFootprints);
  return Object.entries(groupFootprintsByFormHash(footprints))
    .map(([formHash, formFootprints]) => {
      const monthly = monthlyByFormHash[formHash] || [];
      const submissions = formFootprints.length;
      const monthlySubmissions = monthly.length;
      const monthlySuccesses = monthly.filter((footprint) => footprint.result.status === "success").length;
      const completionRate = monthlySubmissions ? monthlySuccesses / monthlySubmissions : 0;
      const fieldStats = fieldFailureStats(formFootprints);
      const monthlyFieldStats = fieldFailureStats(monthly);
      const sufficient = submissions >= minSubmissions;
      const representative = formFootprints[formFootprints.length - 1] || formFootprints[0] || {};
      const structure = representative.formStructure || {};
      return {
        formHash,
        formId: structure.formId || null,
        formName: structure.formName || structure.formId || null,
        page: {
          host: representative.site?.host || "",
          pathname: representative.site?.pathname || ""
        },
        dataSufficiency: {
          currentSubmissions: submissions,
          requiredSubmissions: minSubmissions,
          remainingSubmissions: Math.max(0, minSubmissions - submissions),
          sufficient
        },
        basicStats: sufficient ? {
          monthlySubmissions,
          completionRate,
          topDropoffFields: monthlyFieldStats.slice(0, 3)
        } : null,
        benchmark: sufficient ? {
          currentCompletionRate: completionRate,
          peerAverageCompletionRate: null,
          rankPercentile: null
        } : null,
        suggestions: sufficient ? improvementSuggestions({ fieldStats, submissions, allInsights, formHash }) : []
      };
    })
    .sort((a, b) => b.dataSufficiency.currentSubmissions - a.dataSufficiency.currentSubmissions);
}

function groupFootprintsByFormHash(footprints) {
  const grouped = {};
  for (const footprint of footprints) {
    const key = footprint.formHash || "unknown";
    grouped[key] ??= [];
    grouped[key].push(footprint);
  }
  return grouped;
}

async function d1ReadFootprints(env, limit = 1000) {
  const rows = await env.WEBMCP_DB.prepare(`
    SELECT f.id, f.form_hash, f.status, f.completed_step, f.duration_ms, f.experiment_json, f.learned_rule_ids_json, f.created_at,
           s.host, fo.form_id, fo.structure_json
    FROM footprints f
    LEFT JOIN sites s ON s.id = f.site_id
    LEFT JOIN forms fo ON fo.form_hash = f.form_hash
    ORDER BY f.created_at DESC
    LIMIT ?
  `).bind(limit).all();
  const footprints = [];
  for (const row of rows.results || []) {
    const events = await env.WEBMCP_DB.prepare(`
      SELECT selector, key, type, error_text, validity_json, timestamp_offset_ms
      FROM footprint_events
      WHERE footprint_id = ?
      ORDER BY id ASC
    `).bind(row.id).all();
    const structure = safeJson(row.structure_json, { formId: row.form_id, fields: [] });
    footprints.push({
      id: row.id,
      createdAt: row.created_at,
      site: { host: row.host || "", pathname: "" },
      formHash: row.form_hash,
      experiment: safeJson(row.experiment_json, null),
      learnedRuleIds: safeJson(row.learned_rule_ids_json, []),
      formStructure: structure,
      result: {
        status: row.status,
        completedStep: Number(row.completed_step || 0),
        durationMs: Number(row.duration_ms || 0)
      },
      events: (events.results || []).map((event) => ({
        selector: event.selector || "",
        key: event.key || "",
        type: event.type || "unknown",
        errorText: event.error_text || "",
        validity: safeJson(event.validity_json, {}),
        timestampOffsetMs: Number(event.timestamp_offset_ms || 0)
      }))
    });
  }
  return footprints.reverse();
}

async function d1ReadAbEvents(env, limit = 10000) {
  const rows = await env.WEBMCP_DB.prepare(`
    SELECT ab.type, ab.form_hash, ab.experiment_name, ab.variant, ab.experiment_json, ab.result_status, ab.created_at, s.host
    FROM ab_events ab
    LEFT JOIN sites s ON s.id = ab.site_id
    ORDER BY ab.created_at DESC
    LIMIT ?
  `).bind(limit).all();
  return (rows.results || []).reverse().map((row) => ({
    type: row.type,
    createdAt: row.created_at,
    siteId: row.host || "unknown",
    formHash: row.form_hash,
    experiment: safeJson(row.experiment_json, {
      name: row.experiment_name || "mcp_aeo_quality_v1",
      variant: row.variant
    }),
    result: row.result_status ? { status: row.result_status } : undefined
  }));
}

function safeJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function isCurrentMonth(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth();
}

function fieldFailureStats(footprints) {
  const fields = {};
  for (const footprint of footprints) {
    for (const event of footprint.events ?? []) {
      if (!event.selector) continue;
      const failed = event.type === "invalid" || event.errorText || event.validity?.valid === false;
      if (!failed) continue;
      const field = fields[event.selector] ??= {
        selector: event.selector,
        key: event.key || sanitizeName(event.selector),
        failures: 0,
        lastErrorText: ""
      };
      field.failures += 1;
      if (event.errorText) field.lastErrorText = event.errorText;
    }
  }
  return Object.values(fields)
    .sort((a, b) => b.failures - a.failures)
    .map((field) => ({
      ...field,
      share: footprints.length ? field.failures / footprints.length : 0
    }));
}

function improvementSuggestions({ fieldStats, submissions, allInsights, formHash = null }) {
  const learned = allInsights.suggestions ?? [];
  const bySelector = new Map(fieldStats.map((field) => [field.selector, field]));
  return learned
    .filter((rule) => (!formHash || !rule.formHash || rule.formHash === formHash) && bySelector.has(rule.selector))
    .slice(0, 10)
    .map((rule) => {
      const field = bySelector.get(rule.selector);
      const expectedLiftPoints = Math.max(1, Math.round((field.failures / submissions) * Math.min(50, Number(rule.confidence ?? 0.5) * 100)));
      return {
        id: rule.id,
        title: `${field.key} の入力ルールを明確化`,
        fieldKey: field.key,
        selector: field.selector,
        reason: rule.reason,
        expectedEffect: {
          metric: "completion_rate_lift_points",
          value: expectedLiftPoints,
          basis: `${submissions}件中${field.failures}件の実エラー`
        }
      };
    });
}

async function appendAbEvent(env, event) {
  if (hasD1(env)) {
    const siteIdValue = await d1SiteId(env, { host: event.siteId || "unknown" });
    await env.WEBMCP_DB.prepare(`
      INSERT INTO ab_events
        (site_id, form_hash, type, experiment_name, variant, experiment_json, result_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      siteIdValue,
      event.formHash || null,
      event.type,
      event.experiment?.name || "mcp_aeo_quality_v1",
      event.experiment?.variant || null,
      JSON.stringify(event.experiment || null),
      event.result?.status || null,
      event.createdAt
    ).run();
    return;
  }
  const events = await getJson(env, "ab-events", []);
  events.push(event);
  await putJson(env, "ab-events", events.slice(-MAX_AB_EVENTS));
}

async function loadInsights(env) {
  if (hasD1(env)) return rebuildInsights(env);
  return getJson(env, "insights", emptyInsights());
}

async function rebuildInsights(env) {
  const footprints = hasD1(env) ? await d1ReadFootprints(env, 5000) : await getJson(env, "footprints", []);
  const forms = {};
  for (const footprint of footprints) {
    const form = forms[footprint.formHash] ??= {
      formHash: footprint.formHash,
      site: footprint.site,
      runs: 0,
      failures: 0,
      fields: {}
    };
    form.runs += 1;
    if (footprint.result.status !== "success") form.failures += 1;
    for (const event of footprint.events) {
      if (!event.selector) continue;
      const field = form.fields[event.selector] ??= { selector: event.selector, key: event.key, errors: 0, patternMismatches: 0, valueMissing: 0, lastErrorText: "" };
      if (event.type === "invalid" || event.errorText || event.validity?.valid === false) field.errors += 1;
      if (event.validity?.patternMismatch) field.patternMismatches += 1;
      if (event.validity?.valueMissing) field.valueMissing += 1;
      if (event.errorText) field.lastErrorText = event.errorText;
    }
  }
  const suggestions = [];
  for (const form of Object.values(forms)) {
    for (const field of Object.values(form.fields)) {
      if (field.patternMismatches >= 1) {
        suggestions.push({
          id: `learned-${form.formHash}-${sanitizeName(field.selector)}-pattern`,
          formHash: form.formHash,
          selector: field.selector,
          key: field.key,
          reason: `Pattern validation failed ${field.patternMismatches} time(s). ${field.lastErrorText || "Make the format explicit."}`,
          confidence: Math.min(0.95, 0.5 + field.patternMismatches * 0.15),
          autofill: { transform: "digits_only_if_numeric_error", format: "learned_pattern" },
          examples: []
        });
      }
      if (field.valueMissing >= 1) {
        suggestions.push({
          id: `learned-${form.formHash}-${sanitizeName(field.selector)}-required`,
          formHash: form.formHash,
          selector: field.selector,
          key: field.key,
          reason: `This field was missing ${field.valueMissing} time(s). Treat it as required.`,
          confidence: Math.min(0.9, 0.45 + field.valueMissing * 0.15),
          autofill: { required: true },
          examples: []
        });
      }
    }
  }
  const insights = { generatedAt: new Date().toISOString(), forms, suggestions };
  if (!hasD1(env)) await putJson(env, "insights", insights);
  return insights;
}

function emptyInsights() {
  return { generatedAt: null, forms: {}, suggestions: [] };
}

async function learnedRulesForForm(env, insights, formHash, fields = []) {
  const local = (insights.suggestions ?? []).filter((suggestion) => suggestion.formHash === formHash);
  const active = hasD1(env) ? await loadActiveLearnedRules(env) : [];
  const signatures = new Set(fields.map(fieldSignature));
  const kinds = new Set(fields.flatMap(inferredRuleKindsForField));
  return [
    ...local,
    ...active.filter((rule) => signatures.has(rule.fieldSignature) || kinds.has(rule.ruleKind))
  ];
}

async function loadActiveLearnedRules(env) {
  const rows = await env.WEBMCP_DB.prepare(`
    SELECT rule_id, field_signature, field_key, field_selector, field_type, rule_kind, pattern,
           autofill_json, reason, confidence, sample_count, failure_count, support_rate
    FROM learned_rules
    WHERE status = 'active'
    ORDER BY confidence DESC, failure_count DESC
    LIMIT 200
  `).all();
  return (rows.results || []).map(learnedRuleRowToRuntime);
}

function learnedRuleRowToRuntime(row) {
  return {
    id: row.rule_id,
    fieldSignature: row.field_signature,
    key: row.field_key || "",
    selector: row.field_selector || "",
    ruleKind: row.rule_kind,
    pattern: row.pattern || undefined,
    reason: row.reason,
    confidence: Number(row.confidence || 0),
    autofill: safeJson(row.autofill_json, {}),
    examples: []
  };
}

async function runLearningJob(env, { trigger = "manual" } = {}) {
  if (!hasD1(env)) return { ok: false, error: "WEBMCP_DB binding is required for learning" };
  const startedAt = new Date().toISOString();
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const footprints = await d1ReadFootprints(env, 10000);
  const thresholds = learningThresholds(env);
  const extracted = extractLearnedRuleCandidates(footprints, thresholds);
  const applied = await upsertLearnedRuleCandidates(env, extracted.candidates);
  const disabled = await disableRegressingRules(env, thresholds);
  const finishedAt = new Date().toISOString();
  const result = {
    ok: true,
    runId,
    trigger,
    startedAt,
    finishedAt,
    analyzedFootprints: footprints.length,
    candidates: extracted.candidates.length,
    inserted: applied.inserted,
    updated: applied.updated,
    disabled: disabled.disabled,
    skippedLowSample: extracted.skippedLowSample,
    notes: [...extracted.notes, ...disabled.notes]
  };
  await env.WEBMCP_DB.prepare(`
    INSERT INTO learned_rule_runs
      (run_id, trigger, started_at, finished_at, analyzed_footprints, candidates, inserted, updated, disabled, skipped_low_sample, notes_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    runId,
    trigger,
    startedAt,
    finishedAt,
    result.analyzedFootprints,
    result.candidates,
    result.inserted,
    result.updated,
    result.disabled,
    result.skippedLowSample,
    JSON.stringify(result.notes)
  ).run();
  console.log("webmcp-learning-result", JSON.stringify(result));
  return result;
}

function learningThresholds(env) {
  return {
    minSubmissions: Number(env.WEBMCP_LEARNING_MIN_SUBMISSIONS || 20),
    minFailures: Number(env.WEBMCP_LEARNING_MIN_FAILURES || 3),
    minSupportRate: Number(env.WEBMCP_LEARNING_MIN_SUPPORT_RATE || 0.12),
    disableLiftThreshold: Number(env.WEBMCP_LEARNING_DISABLE_LIFT_THRESHOLD || -2)
  };
}

function extractLearnedRuleCandidates(footprints, thresholds) {
  const groups = new Map();
  const notes = [];
  for (const footprint of footprints) {
    if (!["success", "failure"].includes(footprint.result?.status)) continue;
    for (const field of footprint.formStructure?.fields || []) {
      if (!field.selector || field.hidden) continue;
      const signature = fieldSignature(field);
      const sampleKey = `${signature}|${footprint.id}`;
      for (const kind of inferredRuleKindsForField(field)) {
        const group = groups.get(`${kind}:${signature}`) || newCandidateGroup(kind, signature, field);
        if (!group.sampleIds.has(sampleKey)) {
          group.sampleIds.add(sampleKey);
          group.sampleCount += 1;
          group.formHashes.add(footprint.formHash);
          group.sites.add(footprint.site?.host || "");
        }
        groups.set(`${kind}:${signature}`, group);
      }
    }
    for (const event of footprint.events || []) {
      const field = fieldForSelector(footprint.formStructure, event.selector, event.key);
      const kind = inferRuleKindFromFailure(field, event);
      if (!kind) continue;
      const signature = fieldSignature(field);
      const group = groups.get(`${kind}:${signature}`) || newCandidateGroup(kind, signature, field);
      group.failureCount += 1;
      group.failureFootprints.add(footprint.id);
      group.formHashes.add(footprint.formHash);
      group.sites.add(footprint.site?.host || "");
      if (event.errorText) group.errorSamples.add(sanitizeText(event.errorText));
      groups.set(`${kind}:${signature}`, group);
    }
  }

  let skippedLowSample = 0;
  const candidates = [];
  for (const group of groups.values()) {
    const supportRate = group.sampleCount ? group.failureCount / group.sampleCount : 0;
    if (group.sampleCount < thresholds.minSubmissions || group.failureCount < thresholds.minFailures || supportRate < thresholds.minSupportRate) {
      if (group.failureCount > 0) skippedLowSample += 1;
      continue;
    }
    const rule = learnedRuleForGroup(group, supportRate);
    if (!rule || ruleContainsPrivateText(rule)) {
      notes.push(`Skipped unsafe or unsupported candidate ${group.ruleKind}:${group.fieldSignature}`);
      continue;
    }
    candidates.push(rule);
  }
  return { candidates, skippedLowSample, notes };
}

function newCandidateGroup(ruleKind, fieldSignatureValue, field) {
  return {
    ruleKind,
    fieldSignature: fieldSignatureValue,
    fieldKey: fieldKey(field),
    fieldSelector: field.selector || "",
    fieldType: String(field.type || "text"),
    sampleCount: 0,
    failureCount: 0,
    sampleIds: new Set(),
    failureFootprints: new Set(),
    formHashes: new Set(),
    sites: new Set(),
    errorSamples: new Set()
  };
}

function inferRuleKindFromFailure(field, event) {
  const text = `${fieldText(field)} ${event.errorText || ""}`;
  const invalid = event.type === "invalid" || event.validity?.valid === false || event.errorText;
  if (!invalid) return "";
  if (event.validity?.valueMissing) return "required_when_missing";
  if ((event.validity?.patternMismatch || /ハイフン|数字|digits|半角|形式|format/i.test(text)) && /phone|tel|電話/i.test(text)) return "phone_digits_only";
  if ((event.validity?.patternMismatch || /7桁|７桁|ハイフン|数字|digits|postal|zip/i.test(text)) && /postal|postcode|zip|郵便/i.test(text)) return "postal_digits_7";
  if ((event.validity?.patternMismatch || /yyyy-mm-dd|iso|日付|date|形式|format/i.test(text)) && (field.type === "date" || /date|日付/i.test(text))) return "date_iso";
  if ((event.validity?.typeMismatch || /メール|email|形式|format/i.test(text)) && (field.type === "email" || /mail|メール/i.test(text))) return "email_format";
  return "";
}

function learnedRuleForGroup(group, supportRate) {
  const profile = learnedRuleProfile(group.ruleKind);
  if (!profile) return null;
  const confidence = Math.min(0.95, Math.round((0.45 + Math.min(0.35, supportRate) + Math.min(0.15, group.failureCount / 100) + Math.min(0.1, group.sites.size / 20)) * 100) / 100);
  return {
    ruleId: `lr_${sanitizeName(`${group.ruleKind}_${group.fieldSignature}`).toLowerCase()}`.slice(0, 120),
    scopeSignature: `kind:${group.ruleKind}`,
    fieldSignature: group.fieldSignature,
    fieldKey: group.fieldKey,
    fieldSelector: group.fieldSelector,
    fieldType: group.fieldType,
    ruleKind: group.ruleKind,
    pattern: profile.pattern,
    autofill: profile.autofill,
    reason: profile.reason(group),
    sampleCount: group.sampleCount,
    failureCount: group.failureCount,
    supportRate,
    confidence,
    sourceFormHashes: [...group.formHashes].slice(0, 50),
    sourceSiteCount: [...group.sites].filter(Boolean).length
  };
}

function learnedRuleProfile(kind) {
  const profiles = {
    phone_digits_only: {
      pattern: "^[0-9]{10,11}$",
      autofill: { valueType: "phone", inputMode: "numeric", format: "digits_only", transform: "digits_only" },
      reason: (group) => `Phone fields repeatedly failed numeric format validation in ${group.failureCount} of ${group.sampleCount} observed submissions. Use digits only and remove hyphens.`
    },
    postal_digits_7: {
      pattern: "^[0-9]{7}$",
      autofill: { valueType: "postal_code", inputMode: "numeric", format: "digits_only_7", transform: "digits_only" },
      reason: (group) => `Postal code fields repeatedly failed format validation in ${group.failureCount} of ${group.sampleCount} observed submissions. Use 7 digits and remove hyphens.`
    },
    date_iso: {
      pattern: undefined,
      autofill: { valueType: "date", format: "YYYY-MM-DD", transform: "date_iso" },
      reason: (group) => `Date fields repeatedly failed format validation in ${group.failureCount} of ${group.sampleCount} observed submissions. Use YYYY-MM-DD format.`
    },
    email_format: {
      pattern: undefined,
      autofill: { valueType: "email", inputMode: "email", format: "email", transform: "trim" },
      reason: (group) => `Email fields repeatedly failed type validation in ${group.failureCount} of ${group.sampleCount} observed submissions. Use a valid email address.`
    },
    required_when_missing: {
      pattern: undefined,
      autofill: { required: true },
      reason: (group) => `This field was repeatedly missing in ${group.failureCount} of ${group.sampleCount} observed submissions. Treat it as required.`
    }
  };
  return profiles[kind] || null;
}

function ruleContainsPrivateText(rule) {
  const text = `${rule.reason} ${rule.pattern || ""} ${JSON.stringify(rule.autofill || {})}`;
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text) || /\d[\d\s\-()]{8,}\d/.test(text);
}

async function upsertLearnedRuleCandidates(env, candidates) {
  let inserted = 0;
  let updated = 0;
  for (const candidate of candidates) {
    const existing = await env.WEBMCP_DB.prepare("SELECT rule_id FROM learned_rules WHERE rule_id = ?").bind(candidate.ruleId).first();
    if (existing) updated += 1;
    else inserted += 1;
    await env.WEBMCP_DB.prepare(`
      INSERT INTO learned_rules
        (rule_id, status, scope_signature, field_signature, field_key, field_selector, field_type, rule_kind,
         pattern, autofill_json, reason, sample_count, failure_count, support_rate, confidence,
         source_form_hashes_json, source_site_count, updated_at)
      VALUES (?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(rule_id) DO UPDATE SET
        status = CASE WHEN learned_rules.status = 'disabled' AND excluded.confidence > learned_rules.confidence THEN 'active' ELSE learned_rules.status END,
        field_key = excluded.field_key,
        field_selector = excluded.field_selector,
        field_type = excluded.field_type,
        pattern = excluded.pattern,
        autofill_json = excluded.autofill_json,
        reason = excluded.reason,
        sample_count = excluded.sample_count,
        failure_count = excluded.failure_count,
        support_rate = excluded.support_rate,
        confidence = excluded.confidence,
        source_form_hashes_json = excluded.source_form_hashes_json,
        source_site_count = excluded.source_site_count,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      candidate.ruleId,
      candidate.scopeSignature,
      candidate.fieldSignature,
      candidate.fieldKey,
      candidate.fieldSelector,
      candidate.fieldType,
      candidate.ruleKind,
      candidate.pattern || null,
      JSON.stringify(candidate.autofill),
      candidate.reason,
      candidate.sampleCount,
      candidate.failureCount,
      candidate.supportRate,
      candidate.confidence,
      JSON.stringify(candidate.sourceFormHashes),
      candidate.sourceSiteCount
    ).run();
  }
  return { inserted, updated };
}

async function disableRegressingRules(env, thresholds) {
  const rows = await env.WEBMCP_DB.prepare(`
    SELECT rule_id, created_at
    FROM learned_rules
    WHERE status = 'active'
  `).all();
  let disabled = 0;
  const notes = [];
  for (const row of rows.results || []) {
    const effect = await ruleEffect(env, row.rule_id, row.created_at);
    await env.WEBMCP_DB.prepare(`
      UPDATE learned_rules
      SET applied_count = ?, pre_success_rate = ?, post_success_rate = ?, lift_points = ?, updated_at = CURRENT_TIMESTAMP
      WHERE rule_id = ?
    `).bind(effect.appliedCount, effect.preSuccessRate, effect.postSuccessRate, effect.liftPoints, row.rule_id).run();
    if (effect.postSamples >= 20 && effect.liftPoints !== null && effect.liftPoints < thresholds.disableLiftThreshold) {
      const reason = `Disabled automatically because post-application success rate dropped by ${Math.abs(effect.liftPoints).toFixed(1)} points.`;
      await env.WEBMCP_DB.batch([
        env.WEBMCP_DB.prepare(`
          UPDATE learned_rules
          SET status = 'disabled', disabled_at = CURRENT_TIMESTAMP, disabled_reason = ?, updated_at = CURRENT_TIMESTAMP
          WHERE rule_id = ?
        `).bind(reason, row.rule_id),
        env.WEBMCP_DB.prepare(`
          INSERT INTO learned_rule_disable_history
            (rule_id, disabled_at, reason, pre_success_rate, post_success_rate, lift_points)
          VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?)
        `).bind(row.rule_id, reason, effect.preSuccessRate, effect.postSuccessRate, effect.liftPoints)
      ]);
      disabled += 1;
      notes.push(reason);
    }
  }
  return { disabled, notes };
}

async function ruleEffect(env, ruleId, createdAt) {
  const pre = await env.WEBMCP_DB.prepare(`
    SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS successes
    FROM footprints
    WHERE created_at < ?
  `).bind(createdAt).first();
  const post = await env.WEBMCP_DB.prepare(`
    SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS successes
    FROM footprints
    WHERE instr(learned_rule_ids_json, ?) > 0
  `).bind(`"${ruleId}"`).first();
  const applications = await env.WEBMCP_DB.prepare("SELECT COUNT(*) AS count FROM learned_rule_applications WHERE rule_id = ?").bind(ruleId).first();
  const preTotal = Number(pre?.total || 0);
  const postTotal = Number(post?.total || 0);
  const preSuccessRate = preTotal ? Number(pre.successes || 0) / preTotal : null;
  const postSuccessRate = postTotal ? Number(post.successes || 0) / postTotal : null;
  const liftPoints = preSuccessRate !== null && postSuccessRate !== null ? (postSuccessRate - preSuccessRate) * 100 : null;
  return {
    appliedCount: Number(applications?.count || 0),
    preSuccessRate,
    postSuccessRate,
    liftPoints,
    postSamples: postTotal
  };
}

async function recordLearnedRuleApplications(env, ruleIds, { site, formHash }) {
  if (!hasD1(env) || !ruleIds.length) return;
  for (const ruleId of ruleIds) {
    await env.WEBMCP_DB.prepare(`
      INSERT INTO learned_rule_applications (rule_id, site_host, form_hash, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(ruleId, site?.host || "", formHash).run();
    await env.WEBMCP_DB.prepare(`
      UPDATE learned_rules
      SET applied_count = applied_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE rule_id = ?
    `).bind(ruleId).run();
  }
}

async function listLearnedRules(env) {
  if (!hasD1(env)) return { ok: false, error: "WEBMCP_DB binding is required" };
  const rows = await env.WEBMCP_DB.prepare(`
    SELECT rule_id, status, scope_signature, field_signature, field_key, field_selector, field_type,
           rule_kind, pattern, autofill_json, reason, sample_count, failure_count, support_rate,
           confidence, source_form_hashes_json, source_site_count, applied_count,
           pre_success_rate, post_success_rate, lift_points, created_at, updated_at, disabled_at, disabled_reason
    FROM learned_rules
    ORDER BY status ASC, confidence DESC, failure_count DESC
    LIMIT 500
  `).all();
  const runs = await env.WEBMCP_DB.prepare(`
    SELECT run_id, trigger, started_at, finished_at, analyzed_footprints, candidates, inserted, updated, disabled, skipped_low_sample, notes_json
    FROM learned_rule_runs
    ORDER BY started_at DESC
    LIMIT 20
  `).all();
  return {
    ok: true,
    rules: (rows.results || []).map((row) => ({
      ruleId: row.rule_id,
      status: row.status,
      scopeSignature: row.scope_signature,
      fieldSignature: row.field_signature,
      fieldKey: row.field_key,
      fieldSelector: row.field_selector,
      fieldType: row.field_type,
      ruleKind: row.rule_kind,
      pattern: row.pattern,
      autofill: safeJson(row.autofill_json, {}),
      reason: row.reason,
      sampleCount: Number(row.sample_count || 0),
      failureCount: Number(row.failure_count || 0),
      supportRate: Number(row.support_rate || 0),
      confidence: Number(row.confidence || 0),
      sourceFormHashes: safeJson(row.source_form_hashes_json, []),
      sourceSiteCount: Number(row.source_site_count || 0),
      appliedCount: Number(row.applied_count || 0),
      effect: {
        preSuccessRate: row.pre_success_rate,
        postSuccessRate: row.post_success_rate,
        liftPoints: row.lift_points
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      disabledAt: row.disabled_at,
      disabledReason: row.disabled_reason
    })),
    recentRuns: (runs.results || []).map((row) => ({
      runId: row.run_id,
      trigger: row.trigger,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      analyzedFootprints: Number(row.analyzed_footprints || 0),
      candidates: Number(row.candidates || 0),
      inserted: Number(row.inserted || 0),
      updated: Number(row.updated || 0),
      disabled: Number(row.disabled || 0),
      skippedLowSample: Number(row.skipped_low_sample || 0),
      notes: safeJson(row.notes_json, [])
    }))
  };
}

async function loadAbState(env) {
  if (hasD1(env)) return rebuildAbState(env);
  return getJson(env, "ab-state", emptyAbState(env));
}

async function rebuildAbState(env) {
  const events = hasD1(env) ? await d1ReadAbEvents(env, 10000) : await getJson(env, "ab-events", []);
  const sites = {};
  for (const event of events) {
    const siteKey = event.siteId || "unknown";
    const experimentName = event.experiment?.name || "mcp_aeo_quality_v1";
    const variant = event.experiment?.variant;
    if (!variant) continue;
    const site = sites[siteKey] ??= {};
    const experiment = site[experimentName] ??= {
      variants: { control: emptyVariantStats(), treatment: emptyVariantStats() },
      status: "running",
      winner: null,
      zScore: 0,
      lift: 0
    };
    const stats = experiment.variants[variant];
    if (event.type === "exposure") stats.exposures += 1;
    if (event.type === "result") {
      stats.results += 1;
      if (event.result?.status === "success") stats.successes += 1;
    }
  }
  for (const site of Object.values(sites)) for (const experiment of Object.values(site)) finalizeExperiment(env, experiment);
  const state = {
    generatedAt: new Date().toISOString(),
    config: abConfig(env),
    sites
  };
  if (!hasD1(env)) await putJson(env, "ab-state", state);
  return state;
}

async function assignExperiment({ env, site, registered }) {
  const name = "mcp_aeo_quality_v1";
  const currentState = await loadAbState(env);
  const existing = currentState.sites[siteId(site)]?.[name];
  const forced = env.WEBMCP_AB_FORCE_VARIANT;
  const variant = existing?.status === "winner" && existing.winner
    ? existing.winner
    : forced === "control" || forced === "treatment"
      ? forced
      : Math.random() < 0.5 ? "control" : "treatment";
  const config = abConfig(env);
  return {
    name,
    variant,
    status: existing?.status || "running",
    winner: existing?.winner || null,
    registered: Boolean(registered),
    minSamplesPerVariant: config.minSamplesPerVariant,
    zThreshold: config.zThreshold
  };
}

function emptyAbState(env) {
  return { generatedAt: null, config: abConfig(env), sites: {} };
}

function emptyVariantStats() {
  return { exposures: 0, results: 0, successes: 0, successRate: 0 };
}

function finalizeExperiment(env, experiment) {
  const config = abConfig(env);
  const control = experiment.variants.control;
  const treatment = experiment.variants.treatment;
  control.successRate = control.results ? control.successes / control.results : 0;
  treatment.successRate = treatment.results ? treatment.successes / treatment.results : 0;
  experiment.lift = treatment.successRate - control.successRate;
  experiment.zScore = twoProportionZ(control.successes, control.results, treatment.successes, treatment.results);
  if (control.results < config.minSamplesPerVariant || treatment.results < config.minSamplesPerVariant) {
    experiment.status = "hold";
    experiment.reason = "minimum sample size not reached";
    return;
  }
  if (Math.abs(experiment.zScore) >= config.zThreshold) {
    experiment.status = "winner";
    experiment.winner = experiment.lift >= 0 ? "treatment" : "control";
    experiment.reason = `absolute z-score ${Math.abs(experiment.zScore).toFixed(3)} reached threshold ${config.zThreshold}`;
    return;
  }
  experiment.status = "running";
  experiment.reason = "no statistically significant difference yet";
}

function twoProportionZ(successA, totalA, successB, totalB) {
  if (!totalA || !totalB) return 0;
  const pA = successA / totalA;
  const pB = successB / totalB;
  const pooled = (successA + successB) / (totalA + totalB);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / totalA + 1 / totalB));
  return se ? (pB - pA) / se : 0;
}

async function repairInsightsEndpoint(env) {
  const insights = await rebuildInsights(env);
  const footprints = hasD1(env) ? await d1ReadFootprints(env, 1000) : await getJson(env, "footprints", []);
  const failures = footprints.filter((footprint) => footprint.result.status !== "success").slice(-20);
  if (!failures.length) return { ok: true, repaired: false, reason: "no failed footprints", insights };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Repair MCP/autofill delivery rules from privacy-safe web form failure footprints. Return JSON only: {\"suggestions\":[],\"notes\":[]}."
        },
        {
          role: "user",
          content: JSON.stringify({ failures, currentSuggestions: insights.suggestions })
        }
      ]
    })
  });
  if (!response.ok) throw new Error(`OpenAI repair failed ${response.status}: ${await response.text()}`);
  const body = await response.json();
  const parsed = JSON.parse(body.choices?.[0]?.message?.content ?? "{}");
  const suggestions = normalizeRepairSuggestions(parsed.suggestions ?? [], insights);
  const nextInsights = {
    ...insights,
    repairedAt: new Date().toISOString(),
    repairModel: env.OPENAI_MODEL || "gpt-4.1-mini",
    suggestions: dedupeSuggestions([...insights.suggestions, ...suggestions])
  };
  await putJson(env, "insights", nextInsights);
  return { ok: true, repaired: true, addedSuggestions: suggestions.length, notes: parsed.notes ?? [], insights: nextInsights, usage: body.usage };
}

function normalizeRepairSuggestions(suggestions, insights) {
  const knownFormHashes = new Set(Object.keys(insights.forms));
  return suggestions
    .filter((suggestion) => knownFormHashes.has(suggestion.formHash) && suggestion.selector)
    .map((suggestion, index) => ({
      id: sanitizeName(suggestion.id || `llm-${suggestion.formHash}-${suggestion.selector}-${index}`),
      formHash: suggestion.formHash,
      selector: String(suggestion.selector),
      key: suggestion.key ? String(suggestion.key) : "",
      reason: sanitizeText(suggestion.reason || "LLM repair suggestion from failure footprint."),
      confidence: Math.max(0, Math.min(0.99, Number(suggestion.confidence ?? 0.5))),
      pattern: suggestion.pattern ? String(suggestion.pattern) : undefined,
      examples: Array.isArray(suggestion.examples) ? suggestion.examples.map((item) => String(item)).slice(0, 3) : [],
      autofill: typeof suggestion.autofill === "object" && suggestion.autofill ? suggestion.autofill : {}
    }));
}

function dedupeSuggestions(suggestions) {
  const seen = new Map();
  for (const suggestion of suggestions) {
    seen.set(`${suggestion.formHash}:${suggestion.selector}:${suggestion.pattern || ""}:${suggestion.reason}`, suggestion);
  }
  return [...seen.values()];
}

function abConfig(env) {
  return {
    minSamplesPerVariant: Number(env.WEBMCP_AB_MIN_SAMPLES || 20),
    zThreshold: Number(env.WEBMCP_AB_Z_THRESHOLD || 1.96)
  };
}

async function hashFormStructure(formStructure) {
  const normalized = {
    formId: formStructure.formId ?? null,
    fields: (formStructure.fields ?? []).map((field) => ({
      tag: field.tag,
      selector: field.selector,
      name: field.name,
      id: field.id,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder,
      options: field.options?.map((option) => option.value)
    }))
  };
  const data = new TextEncoder().encode(JSON.stringify(normalized));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

function sanitizeExperiment(experiment) {
  if (!experiment?.name || !experiment?.variant) return null;
  return {
    name: sanitizeName(experiment.name),
    variant: experiment.variant === "treatment" ? "treatment" : "control",
    status: ["running", "winner", "hold"].includes(experiment.status) ? experiment.status : "running",
    winner: experiment.winner === "treatment" || experiment.winner === "control" ? experiment.winner : null
  };
}

function sanitizeText(value) {
  if (!value) return "";
  return String(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL]")
    .replace(/\d[\d\s\-()]{1,}\d/g, (match) => match.replace(/\D/g, "").length >= 3 ? "[NUM]" : match)
    .slice(0, 200);
}

function sanitizeValidity(validity = {}) {
  const clean = {};
  for (const key of ALLOWED_VALIDITY_KEYS) clean[key] = Boolean(validity?.[key]);
  return clean;
}

async function agentAuthorization(request, env, siteKey) {
  const authorization = await authorizeSiteKey(env, String(siteKey || "").trim());
  return {
    ...authorization,
    reason: authorization.registered
      ? "server says caller is registered"
      : "server says caller is not registered",
  };
}

async function authorizeSiteKeyHost(env, siteKey, requestedHost) {
  if (!siteKey || !requestedHost) return { ok: false, record: null };
  const record = await findSiteKey(env, siteKey);
  const hostMatches = record?.status === "active"
    && requestedHost.toLowerCase() === String(record.siteHost || "").toLowerCase();
  return hostMatches ? { ok: true, record } : { ok: false, record: null };
}

async function storePageMeta(env, { siteKey, host, pathname, meta }) {
  if (!env.WEBMCP_KV) throw new PublicHttpError(503, "page_meta_storage_unavailable");
  const safePathname = sanitizePagePathname(pathname, host);
  const siteKeyHash = await sha256Hex(siteKey);
  const pathnameHash = await sha256Hex(safePathname);
  const key = `page-meta:${siteKeyHash}:${pathnameHash}`;
  const sanitizedMeta = sanitizePageMeta(meta);
  const value = {
    host,
    pathname: safePathname,
    collectedAt: new Date().toISOString(),
    contentHash: await sha256Hex(stableJson(sanitizedMeta)),
    meta: sanitizedMeta
  };
  await env.WEBMCP_KV.put(key, JSON.stringify(value), { expirationTtl: PAGE_META_TTL_SECONDS });
  return { key, value };
}

async function organizationSchemaForPage(env, { siteKey, host, pathname }, dependencies = {}) {
  if (!env.WEBMCP_KV) throw new PublicHttpError(503, "page_meta_storage_unavailable");
  const safePathname = sanitizePagePathname(pathname, host);
  const siteKeyHash = await sha256Hex(siteKey);
  const pathnameHash = await sha256Hex(safePathname);
  const pageMeta = await env.WEBMCP_KV.get(`page-meta:${siteKeyHash}:${pathnameHash}`, "json");
  if (!pageMeta?.meta) return { found: false, schema: null, cached: false };

  const contentHash = isSha256Hex(pageMeta.contentHash)
    ? pageMeta.contentHash.toLowerCase()
    : await sha256Hex(stableJson(pageMeta.meta));
  const cacheKey = `org-schema:${siteKeyHash}:${contentHash}`;
  const cached = await env.WEBMCP_KV.get(cacheKey, "json");
  if (cached && Object.hasOwn(cached, "schema")) {
    console.log("org_schema_cache_hit", JSON.stringify({ cacheKey }));
    return { found: true, schema: cached.schema, cached: true };
  }
  if (!env.OPENAI_API_KEY) throw new PublicHttpError(412, "OPENAI_API_KEY_MISSING");

  console.log("org_schema_openai_call", JSON.stringify({ cacheKey }));
  const extract = dependencies.extractOrganization || extractOrganizationWithOpenAI;
  const extracted = await extract(env, pageMeta.meta);
  const schema = buildOrganizationSchema(extracted);
  await env.WEBMCP_KV.put(cacheKey, JSON.stringify({ schema }), { expirationTtl: ORG_SCHEMA_TTL_SECONDS });
  return { found: true, schema, cached: false };
}

async function extractOrganizationWithOpenAI(env, pageMeta) {
  const endpoint = String(env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: ORGANIZATION_EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(pageMeta) }
      ]
    })
  });
  if (!response.ok) throw new Error(`OpenAI organization extraction failed ${response.status}: ${await response.text()}`);
  const body = await response.json();
  try {
    return JSON.parse(body.choices?.[0]?.message?.content ?? "{}");
  } catch {
    return {};
  }
}

async function faqSchemaForPage(env, { siteKey, host, pathname }, dependencies = {}) {
  if (!env.WEBMCP_KV) throw new PublicHttpError(503, "page_meta_storage_unavailable");
  const safePathname = sanitizePagePathname(pathname, host);
  const siteKeyHash = await sha256Hex(siteKey);
  const pathnameHash = await sha256Hex(safePathname);
  const pageMeta = await env.WEBMCP_KV.get(`page-meta:${siteKeyHash}:${pathnameHash}`, "json");
  if (!pageMeta?.meta) return { found: false, schema: null, cached: false };

  const contentHash = isSha256Hex(pageMeta.contentHash)
    ? pageMeta.contentHash.toLowerCase()
    : await sha256Hex(stableJson(pageMeta.meta));
  const cacheKey = `faq-schema:${siteKeyHash}:${contentHash}`;
  const cached = await env.WEBMCP_KV.get(cacheKey, "json");
  if (cached && Object.hasOwn(cached, "schema")) {
    console.log("faq_schema_cache_hit", JSON.stringify({ cacheKey }));
    return { found: true, schema: cached.schema, cached: true };
  }
  if (!env.OPENAI_API_KEY) throw new PublicHttpError(412, "OPENAI_API_KEY_MISSING");

  console.log("faq_schema_openai_call", JSON.stringify({ cacheKey }));
  const extract = dependencies.extractFaq || extractFaqWithOpenAI;
  const extracted = await extract(env, pageMeta.meta);
  const schema = buildFaqSchema(extracted);
  await env.WEBMCP_KV.put(cacheKey, JSON.stringify({ schema }), { expirationTtl: FAQ_SCHEMA_TTL_SECONDS });
  return { found: true, schema, cached: false };
}

async function extractFaqWithOpenAI(env, pageMeta) {
  const endpoint = String(env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: FAQ_EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(pageMeta) }
      ]
    })
  });
  if (!response.ok) throw new Error(`OpenAI FAQ extraction failed ${response.status}: ${await response.text()}`);
  const body = await response.json();
  try {
    return JSON.parse(body.choices?.[0]?.message?.content ?? "{}");
  } catch {
    return {};
  }
}

function buildFaqSchema(value) {
  const candidates = Array.isArray(value?.faqs) ? value.faqs : [];
  const mainEntity = candidates
    .filter((faq) => faq && typeof faq === "object" && !Array.isArray(faq))
    .map((faq) => ({
      question: limitText(faq.question, 300),
      answer: limitText(faq.answer, 1000)
    }))
    .filter((faq) => faq.question && faq.answer)
    .slice(0, 20)
    .map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }));
  if (!mainEntity.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity
  };
}

async function articleSchemaForPage(env, { siteKey, host, pathname }, dependencies = {}) {
  if (!env.WEBMCP_KV) throw new PublicHttpError(503, "page_meta_storage_unavailable");
  const safePathname = sanitizePagePathname(pathname, host);
  const siteKeyHash = await sha256Hex(siteKey);
  const pathnameHash = await sha256Hex(safePathname);
  const pageMeta = await env.WEBMCP_KV.get(`page-meta:${siteKeyHash}:${pathnameHash}`, "json");
  if (!pageMeta?.meta) return { found: false, schema: null, cached: false };

  const contentHash = isSha256Hex(pageMeta.contentHash)
    ? pageMeta.contentHash.toLowerCase()
    : await sha256Hex(stableJson(pageMeta.meta));
  const cacheKey = `article-schema:${siteKeyHash}:${contentHash}`;
  const cached = await env.WEBMCP_KV.get(cacheKey, "json");
  if (cached && Object.hasOwn(cached, "schema")) {
    console.log("article_schema_cache_hit", JSON.stringify({ cacheKey }));
    return { found: true, schema: cached.schema, cached: true };
  }
  if (!env.OPENAI_API_KEY) throw new PublicHttpError(412, "OPENAI_API_KEY_MISSING");

  console.log("article_schema_openai_call", JSON.stringify({ cacheKey }));
  const extract = dependencies.extractArticle || extractArticleWithOpenAI;
  const extracted = await extract(env, pageMeta.meta);
  const schema = buildArticleSchema(extracted, { host, pathname: safePathname });
  await env.WEBMCP_KV.put(cacheKey, JSON.stringify({ schema }), { expirationTtl: ARTICLE_SCHEMA_TTL_SECONDS });
  return { found: true, schema, cached: false };
}

async function extractArticleWithOpenAI(env, pageMeta) {
  const endpoint = String(env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: ARTICLE_EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(pageMeta) }
      ]
    })
  });
  if (!response.ok) throw new Error(`OpenAI article extraction failed ${response.status}: ${await response.text()}`);
  const body = await response.json();
  try {
    return JSON.parse(body.choices?.[0]?.message?.content ?? "{}");
  } catch {
    return {};
  }
}

function buildArticleSchema(value, { host, pathname }) {
  const extracted = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const headline = limitText(extracted.headline, 300);
  if (extracted.isArticle !== true || !headline) return null;
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline,
    url: new URL(pathname, `https://${host}`).href
  };
  const description = limitText(extracted.description, 1000);
  const author = limitText(extracted.author, 300);
  const datePublished = validIso8601(extracted.datePublished);
  if (description) schema.description = description;
  if (author) schema.author = { "@type": "Person", name: author };
  if (datePublished) schema.datePublished = datePublished;
  return schema;
}

function validIso8601(value) {
  if (typeof value !== "string") return "";
  const candidate = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.exec(candidate);
  if (!match || !Number.isFinite(Date.parse(candidate))) return "";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return "";
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day >= 1 && day <= daysInMonth ? candidate : "";
}

function buildOrganizationSchema(value) {
  const extracted = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const name = limitText(extracted.name, 300);
  if (!name) return null;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name
  };
  const url = validHttpUrl(extracted.url);
  const logo = validHttpUrl(extracted.logo);
  const description = limitText(extracted.description, 1000);
  const sameAs = Array.isArray(extracted.sameAs)
    ? [...new Set(extracted.sameAs.map(validHttpUrl).filter(Boolean))].slice(0, 50)
    : [];
  if (url) schema.url = url;
  if (logo) schema.logo = logo;
  if (description) schema.description = description;
  if (sameAs.length) schema.sameAs = sameAs;
  return schema;
}

function validHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : "";
  } catch {
    return "";
  }
}

function isSha256Hex(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sanitizePagePathname(value, host) {
  const raw = limitText(value, 2048) || "/";
  try {
    return new URL(raw, `https://${host}`).pathname || "/";
  } catch {
    return "/";
  }
}

function sanitizePageMeta(input) {
  const meta = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const openGraph = meta.openGraph && typeof meta.openGraph === "object" && !Array.isArray(meta.openGraph)
    ? meta.openGraph
    : {};
  const headings = Array.isArray(meta.headings) ? meta.headings.slice(0, 30) : [];
  const jsonLdValues = Array.isArray(meta.jsonLd) ? meta.jsonLd : [];
  return {
    title: piiSafeText(meta.title, 300),
    description: piiSafeText(meta.description, 500),
    openGraph: {
      title: piiSafeText(openGraph.title, 300),
      description: piiSafeText(openGraph.description, 500),
      type: piiSafeText(openGraph.type, 100),
      siteName: piiSafeText(openGraph.siteName, 300)
    },
    canonicalUrl: piiSafeText(meta.canonicalUrl, 2048),
    lang: piiSafeText(meta.lang, 35),
    headings: headings
      .map((heading) => ({
        level: ["h1", "h2", "h3"].includes(String(heading?.level || "").toLowerCase())
          ? String(heading.level).toLowerCase()
          : "",
        text: piiSafeText(heading?.text, 200)
      }))
      .filter((heading) => heading.level && heading.text),
    jsonLd: sanitizeJsonLd(jsonLdValues)
  };
}

function sanitizeJsonLd(values) {
  const output = [];
  let usedBytes = 0;
  for (const value of values) {
    const remaining = PAGE_META_JSON_LD_MAX_BYTES - usedBytes;
    if (remaining <= 0) break;
    const sanitized = redactPii(limitText(value, remaining));
    const truncated = truncateUtf8(sanitized, remaining);
    if (!truncated) continue;
    output.push(truncated);
    usedBytes += new TextEncoder().encode(truncated).byteLength;
  }
  return output;
}

function piiSafeText(value, maxLength) {
  return redactPii(limitText(value, maxLength));
}

function limitText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function truncateUtf8(value, maxBytes) {
  const bytes = new TextEncoder().encode(String(value || ""));
  if (bytes.byteLength <= maxBytes) return String(value || "");
  return new TextDecoder().decode(bytes.slice(0, maxBytes));
}

function redactPii(value) {
  const withoutEmails = String(value || "").replace(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    "[redacted-email]"
  );
  return withoutEmails.replace(/\+?\d[\d().\s-]{7,}\d/g, (candidate) => {
    const digitCount = (candidate.match(/\d/g) || []).length;
    const compact = candidate.replace(/\s/g, "");
    const looksLikePhone = digitCount >= 9 && digitCount <= 15
      && (/^[+]\d/.test(compact) || /[().-]/.test(candidate) || /^\d{10,15}$/.test(compact));
    return looksLikePhone ? "[redacted-phone]" : candidate;
  });
}

async function authorizeMcpDefinition(request, env, payload) {
  const siteKey = String(payload?.siteKey || payload?.site_key || "").trim();
  if (!siteKey) return { ok: false, status: 400, error: "missing_site_key" };
  const record = await findSiteKey(env, siteKey);
  if (!record || record.status !== "active") return { ok: false, status: 403, error: "invalid_site_key" };
  const host = normalizeHost(payload?.site?.host);
  const requestHost = normalizeHost(requestSourceHost(request));
  if (!host || host !== normalizeHost(record.siteHost)) return { ok: false, status: 403, error: "site_host_mismatch" };
  // Origin/Referer can be forged by non-browser clients. This check prevents accidental
  // cross-site use and browser abuse, but the site key must still be treated as a secret.
  if (!requestHost || (!isDevelopmentHost(requestHost) && requestHost !== normalizeHost(record.siteHost))) {
    await recordAgentHostMismatch(env, { siteKey, expectedHost: record.siteHost, requestHost: requestHost || null, plan: record.plan || "free" });
    return { ok: false, status: 403, error: "request_host_mismatch" };
  }
  return { ok: true, record, plan: record.plan === "pro" ? "pro" : "free" };
}

async function authorizeFootprint(request, env, payload) {
  const siteKey = String(payload?.siteKey || payload?.site_key || "").trim();
  if (!siteKey) return { ok: false, status: 400, error: "missing_site_key" };
  const record = await findSiteKey(env, siteKey);
  if (!record || record.status !== "active") return { ok: false, status: 403, error: "invalid_site_key" };
  const payloadHost = normalizeHost(payload?.site?.host);
  const requestHost = normalizeHost(requestSourceHost(request));
  if (!payloadHost || payloadHost !== normalizeHost(record.siteHost)) {
    return { ok: false, status: 403, error: "site_host_mismatch" };
  }
  // Origin/Referer is a browser-origin consistency check, not cryptographic proof:
  // arbitrary HTTP clients can forge these headers.
  if (!requestHost || (!isDevelopmentHost(requestHost) && requestHost !== normalizeHost(record.siteHost))) {
    await recordAgentHostMismatch(env, { siteKey, expectedHost: record.siteHost, requestHost: requestHost || null, plan: record.plan || "free" });
    return { ok: false, status: 403, error: "request_host_mismatch" };
  }
  return { ok: true, record };
}

function requestSourceHost(request) {
  for (const header of ["origin", "referer"]) {
    const value = request.headers.get(header);
    if (!value || value === "null") continue;
    try {
      return new URL(value).host;
    } catch {
      continue;
    }
  }
  return "";
}

function normalizeHost(host) {
  return String(host || "").trim().toLowerCase().replace(/\.$/, "");
}

function isDevelopmentHost(host) {
  try {
    const hostname = new URL(`http://${host}`).hostname.toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

async function recordAgentHostMismatch(env, mismatch) {
  if (!env.WEBMCP_KV) return;
  const createdAt = new Date().toISOString();
  const date = createdAt.slice(0, 10);
  const siteKeyHash = (await sha256Hex(mismatch.siteKey)).slice(0, 16);
  await env.WEBMCP_KV.put(
    `${AGENT_HOST_MISMATCH_PREFIX}${date}:${crypto.randomUUID()}`,
    JSON.stringify({
      createdAt,
      siteKeyHash,
      expectedHost: mismatch.expectedHost,
      requestHost: mismatch.requestHost,
      plan: mismatch.plan
    }),
    { expirationTtl: 90 * 24 * 60 * 60 }
  );
}

async function issueSiteKey(env, payload = {}, publicOrigin = "") {
  const siteUrl = normalizeSiteUrl(payload.siteUrl || payload.site_url);
  const email = String(payload.email || "").trim().toLowerCase();
  if (!siteUrl) return { ok: false, error: "invalid_site_url" };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "invalid_email" };
  const host = new URL(siteUrl).host;
  const existing = await findActiveSiteKeyByHost(env, host);
  if (existing) {
    return {
      ok: false,
      error: "duplicate_site_host",
      message: "This site is already registered."
    };
  }
  const record = siteKeyRecord({ siteUrl, siteHost: host, email });
  if (hasD1(env)) {
    await env.WEBMCP_DB.prepare(`
      INSERT INTO site_keys (site_key, site_url, site_host, email, email_masked, created_at, status, plan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(record.siteKey, record.siteUrl, record.siteHost, record.email, record.emailMasked, record.createdAt, record.status, record.plan).run();
  } else {
    const issued = await getJson(env, "site-keys", {});
    issued[record.siteKey] = record;
    await putJson(env, "site-keys", issued);
  }
  return {
    ok: true,
    siteKey: record.siteKey,
    siteUrl: record.siteUrl,
    siteHost: record.siteHost,
    plan: record.plan,
    status: record.status,
    tagSnippet: `<script src="${publicTagUrl(env, publicOrigin)}" async data-webmcp-site-key="${record.siteKey}"></script>`
  };
}

async function duplicateSiteRegistration(env, payload) {
  const siteUrl = normalizeSiteUrl(payload?.siteUrl || payload?.site_url);
  if (!siteUrl) return null;
  const existing = await findActiveSiteKeyByHost(env, new URL(siteUrl).host);
  return existing ? {
    ok: false,
    error: "duplicate_site_host",
    message: "This site is already registered."
  } : null;
}

async function limitSiteKeyIssuance(request, env, payload) {
  if (!env.WEBMCP_KV) throw new PublicHttpError(503, "rate_limit_unavailable");
  const email = normalizeEmail(payload?.email);
  const siteUrl = normalizeSiteUrl(payload?.siteUrl || payload?.site_url);
  const host = siteUrl ? new URL(siteUrl).host : String(payload?.siteUrl || payload?.site_url || "").trim().toLowerCase();
  const ip = clientIp(request);
  const checks = await Promise.all([
    consumeRateLimit(env, `site-key:email:${await sha256Hex(email || "invalid")}`, 3, 60 * 60),
    consumeRateLimit(env, `site-key:host:${await sha256Hex(host || "invalid")}`, 3, 24 * 60 * 60),
    consumeRateLimit(env, `site-key:ip:${await sha256Hex(ip)}`, 10, 60 * 60)
  ]);
  return { ok: checks.every(Boolean) };
}

async function recordSiteKeyIssuance(env) {
  if (!env.WEBMCP_KV) return;
  const date = new Date().toISOString().slice(0, 10);
  const key = `${SITE_KEY_ISSUE_TOTAL_PREFIX}${date}`;
  const count = Number(await env.WEBMCP_KV.get(key) || 0) + 1;
  await env.WEBMCP_KV.put(key, String(count), { expirationTtl: 8 * 24 * 60 * 60 });
  if (count === 1000 || (count > 1000 && count % 500 === 0)) {
    console.warn("site_key_issue_volume_alert", JSON.stringify({ date, count }));
  }
}

async function limitFootprint(request, env, siteKey) {
  if (!env.WEBMCP_KV) throw new PublicHttpError(503, "rate_limit_unavailable");
  const ip = clientIp(request);
  const checks = await Promise.all([
    consumeRateLimit(env, `footprint:site:${await sha256Hex(siteKey)}`, 120, 60),
    consumeRateLimit(env, `footprint:ip:${await sha256Hex(ip)}`, 300, 60)
  ]);
  return { ok: checks.every(Boolean) };
}

async function consumeRateLimit(env, bucket, limit, windowSeconds) {
  const window = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `${RATE_LIMIT_PREFIX}${bucket}:${window}`;
  const count = Number(await env.WEBMCP_KV.get(key) || 0);
  if (count >= limit) return false;
  // Workers KV is eventually consistent and this read/modify/write is not an atomic
  // security boundary. It is a coarse abuse brake; edge/WAF or a Durable Object
  // should be used if strict global enforcement becomes necessary.
  await env.WEBMCP_KV.put(key, String(count + 1), { expirationTtl: windowSeconds * 2 });
  return true;
}

function clientIp(request) {
  return String(request.headers.get("cf-connecting-ip") || "unknown").trim() || "unknown";
}

function publicTagUrl(env, publicOrigin) {
  const configured = String(env.WEBMCP_PUBLIC_TAG_URL || "").trim();
  if (configured) return configured;
  if (publicOrigin) return `${publicOrigin.replace(/\/$/, "")}/tag.js`;
  return "/tag.js";
}

async function listSiteKeys(env) {
  if (hasD1(env)) {
    const rows = await env.WEBMCP_DB.prepare(`
      SELECT site_key, site_url, site_host, email_masked, created_at, status, plan, disabled_at, replaced_by_site_key
      FROM site_keys
      ORDER BY created_at DESC
      LIMIT 500
    `).all();
    return { ok: true, siteKeys: (rows.results || []).map(siteKeyRowToRecord).map(toPublicSiteKey) };
  }
  const issued = await getJson(env, "site-keys", {});
  return {
    ok: true,
    siteKeys: Object.values(issued)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, 500)
      .map(toPublicSiteKey)
  };
}

async function regenerateSiteKey(env, payload = {}) {
  const siteKey = String(payload.siteKey || payload.site_key || "").trim();
  if (!siteKey) return { ok: false, error: "missing_site_key" };
  const existing = await findSiteKey(env, siteKey);
  if (!existing) return { ok: false, error: "site_key_not_found" };
  if (existing.status !== "active") return { ok: false, error: "site_key_not_active" };
  const record = siteKeyRecord({
    siteUrl: existing.siteUrl,
    siteHost: existing.siteHost,
    email: existing.email,
    emailMasked: existing.emailMasked,
    plan: existing.plan
  });
  if (hasD1(env)) {
    await env.WEBMCP_DB.batch([
      env.WEBMCP_DB.prepare(`
        UPDATE site_keys
        SET status = 'disabled', disabled_at = ?, replaced_by_site_key = ?
        WHERE site_key = ? AND status = 'active'
      `).bind(record.createdAt, record.siteKey, existing.siteKey),
      env.WEBMCP_DB.prepare(`
        INSERT INTO site_keys (site_key, site_url, site_host, email, email_masked, created_at, status, plan)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(record.siteKey, record.siteUrl, record.siteHost, record.email, record.emailMasked, record.createdAt, record.status, record.plan)
    ]);
  } else {
    const issued = await getJson(env, "site-keys", {});
    issued[existing.siteKey] = { ...existing, status: "disabled", disabledAt: record.createdAt, replacedBySiteKey: record.siteKey };
    issued[record.siteKey] = record;
    await putJson(env, "site-keys", issued);
  }
  return { ok: true, siteKey: record.siteKey, oldSiteKey: existing.siteKey, siteUrl: record.siteUrl, siteHost: record.siteHost, plan: record.plan, status: record.status };
}

async function disableSiteKey(env, payload = {}) {
  const siteKey = String(payload.siteKey || payload.site_key || "").trim();
  if (!siteKey) return { ok: false, error: "missing_site_key" };
  const existing = await findSiteKey(env, siteKey);
  if (!existing) return { ok: false, error: "site_key_not_found" };
  if (existing.status !== "active") return { ok: true, siteKey, status: existing.status };
  const disabledAt = new Date().toISOString();
  if (hasD1(env)) {
    await env.WEBMCP_DB.prepare("UPDATE site_keys SET status = 'disabled', disabled_at = ? WHERE site_key = ?")
      .bind(disabledAt, siteKey)
      .run();
  } else {
    const issued = await getJson(env, "site-keys", {});
    issued[siteKey] = { ...existing, status: "disabled", disabledAt };
    await putJson(env, "site-keys", issued);
  }
  return { ok: true, siteKey, status: "disabled", disabledAt };
}

async function updateSiteKeyPlan(env, payload = {}) {
  const siteKey = String(payload.siteKey || payload.site_key || "").trim();
  const plan = String(payload.plan || "").trim().toLowerCase();
  if (!siteKey) return { ok: false, error: "missing_site_key" };
  if (!["free", "pro"].includes(plan)) return { ok: false, error: "invalid_plan" };
  const existing = await findSiteKey(env, siteKey);
  if (!existing) return { ok: false, error: "site_key_not_found" };
  if (existing.status !== "active") return { ok: false, error: "site_key_not_active" };
  if (hasD1(env)) {
    await env.WEBMCP_DB.prepare("UPDATE site_keys SET plan = ? WHERE site_key = ? AND status = 'active'")
      .bind(plan, siteKey)
      .run();
  } else {
    const issued = await getJson(env, "site-keys", {});
    issued[siteKey] = { ...existing, plan };
    await putJson(env, "site-keys", issued);
  }
  return { ok: true, siteKey, siteHost: existing.siteHost, plan, status: "active" };
}

async function findActiveSiteKeyByHost(env, host) {
  if (hasD1(env)) {
    const row = await env.WEBMCP_DB.prepare(`
      SELECT site_key, site_url, site_host, email, email_masked, created_at, status, plan, disabled_at, replaced_by_site_key
      FROM site_keys
      WHERE site_host = ? AND status = 'active'
      LIMIT 1
    `).bind(host).first();
    return row ? siteKeyRowToRecord(row) : null;
  }
  const issued = await getJson(env, "site-keys", {});
  return Object.values(issued).find((record) => record.siteHost === host && record.status === "active") || null;
}

function isProSiteKey(siteKey, env, record) {
  if (record?.plan === "pro") return true;
  if (!siteKey) return false;
  return String(env.WEBMCP_PRO_SITE_KEYS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .includes(siteKey);
}

async function findSiteKey(env, siteKey) {
  if (hasD1(env)) {
    const row = await env.WEBMCP_DB.prepare(`
      SELECT site_key, site_url, site_host, email, email_masked, created_at, status, plan, disabled_at, replaced_by_site_key
      FROM site_keys
      WHERE site_key = ?
      LIMIT 1
    `).bind(siteKey).first();
    return row ? siteKeyRowToRecord(row) : null;
  }
  const issued = await getJson(env, "site-keys", {});
  return issued[siteKey] || null;
}

function siteKeyRecord({ siteUrl, siteHost, email, emailMasked, plan = "free" }) {
  return {
    siteKey: `nrv_${randomToken(24)}`,
    siteUrl,
    siteHost,
    email: email || null,
    emailMasked: emailMasked || maskEmail(email),
    createdAt: new Date().toISOString(),
    status: "active",
    plan
  };
}

function siteKeyRowToRecord(row) {
  return {
    siteKey: row.site_key,
    siteUrl: row.site_url,
    siteHost: row.site_host,
    email: row.email || null,
    emailMasked: row.email_masked,
    createdAt: row.created_at,
    status: row.status,
    plan: row.plan || "free",
    disabledAt: row.disabled_at || null,
    replacedBySiteKey: row.replaced_by_site_key || null
  };
}

async function handleAuthRequest(request, env) {
  if (!env.WEBMCP_KV) return json({ error: "WEBMCP_KV binding is required for authentication.", code: "AUTH_KV_MISSING" }, 503, request, env);
  if (!String(env.RESEND_API_KEY || "").trim()) {
    return json({ error: "RESEND_API_KEY is not configured. Set it with wrangler secret put RESEND_API_KEY.", code: "RESEND_API_KEY_MISSING" }, 503, request, env);
  }
  if (!String(env.MAIL_FROM || "").trim()) {
    return json({ error: "MAIL_FROM is not configured. Set it as a Worker environment variable.", code: "MAIL_FROM_MISSING" }, 503, request, env);
  }
  const payload = await readJson(request);
  const email = normalizeEmail(payload?.email);
  if (!email) return json({ error: "invalid_email" }, 400, request, env);
  const rateLimit = await reserveAuthRequest(env, email);
  if (!rateLimit.allowed) return authRequestSuccess(request, env);
  const ownedKeys = await findActiveSiteKeysByEmail(env, email);
  if (ownedKeys.length) {
    const token = randomToken(32);
    await env.WEBMCP_KV.put(`${AUTH_TOKEN_PREFIX}${token}`, JSON.stringify({ email }), { expirationTtl: AUTH_TOKEN_TTL_SECONDS });
    const link = `https://nurevo.jp/dashboard?token=${encodeURIComponent(token)}`;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [email],
        subject: "Sign in to Nurevo",
        html: `<p>Use the link below to sign in to your Nurevo dashboard. It expires in 15 minutes.</p><p><a href="${link}">Sign in to Nurevo</a></p><p>If you did not request this email, you can ignore it.</p>`,
        text: `Sign in to Nurevo (valid for 15 minutes): ${link}`
      })
    });
    if (!response.ok) {
      await response.text();
      await env.WEBMCP_KV.delete(`${AUTH_TOKEN_PREFIX}${token}`);
      console.error("resend_error", JSON.stringify({ status: response.status }));
      return json({ error: "Could not send the sign-in email. Check the Resend configuration.", code: "EMAIL_SEND_FAILED" }, 502, request, env);
    }
  }
  return authRequestSuccess(request, env);
}

function authRequestSuccess(request, env) {
  return json({ ok: true, message: "If an account exists for that email, a sign-in link has been sent." }, 200, request, env);
}

async function reserveAuthRequest(env, email) {
  const emailHash = await sha256Hex(email);
  const key = `${AUTH_RATE_PREFIX}${emailHash}`;
  const now = Date.now();
  const previous = await env.WEBMCP_KV.get(key, "json");
  const windowStartedAt = Number(previous?.windowStartedAt || 0);
  const inCurrentWindow = now - windowStartedAt < AUTH_RATE_WINDOW_MS;
  const count = inCurrentWindow ? Number(previous?.count || 0) : 0;
  const lastSentAt = Number(previous?.lastSentAt || 0);
  if (now - lastSentAt < AUTH_MIN_INTERVAL_MS || count >= AUTH_HOURLY_LIMIT) {
    return { allowed: false };
  }
  await env.WEBMCP_KV.put(key, JSON.stringify({
    windowStartedAt: inCurrentWindow ? windowStartedAt : now,
    lastSentAt: now,
    count: count + 1
  }), { expirationTtl: Math.ceil(AUTH_RATE_WINDOW_MS / 1000) });
  return { allowed: true };
}

async function handleAuthVerify(request, env) {
  if (!env.WEBMCP_KV) return json({ error: "WEBMCP_KV binding is required for authentication.", code: "AUTH_KV_MISSING" }, 503, request, env);
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!/^[a-f0-9]{64}$/.test(token)) return json({ error: "invalid_or_expired_token" }, 401, request, env);
  const key = `${AUTH_TOKEN_PREFIX}${token}`;
  const pending = await env.WEBMCP_KV.get(key, "json");
  if (!pending?.email) return json({ error: "invalid_or_expired_token" }, 401, request, env);
  await env.WEBMCP_KV.delete(key);
  const sessionId = randomToken(32);
  await env.WEBMCP_KV.put(`${SESSION_PREFIX}${sessionId}`, JSON.stringify({ email: pending.email }), { expirationTtl: SESSION_TTL_SECONDS });
  const headers = new Headers({
    location: "https://nurevo.jp/dashboard",
    "cache-control": "no-store"
  });
  headers.append("set-cookie", sessionCookie(sessionId, SESSION_TTL_SECONDS));
  return new Response(null, { status: 303, headers });
}

async function handleAuthSession(request, env) {
  const session = await getSession(request, env);
  if (!session) return json({ authenticated: false }, 401, request, env);
  const siteKeys = await findActiveSiteKeysByEmail(env, session.email);
  return json({
    authenticated: true,
    emailMasked: maskEmail(session.email),
    siteKeys: siteKeys.map(toPublicSiteKey)
  }, 200, request, env);
}

async function handleAuthLogout(request, env) {
  const sessionId = cookieValue(request, "nurevo_session");
  if (sessionId && env.WEBMCP_KV) await env.WEBMCP_KV.delete(`${SESSION_PREFIX}${sessionId}`);
  const headers = corsHeaders(request, env);
  headers.append("set-cookie", sessionCookie("", 0));
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

async function getSession(request, env) {
  if (!env.WEBMCP_KV) return null;
  const sessionId = cookieValue(request, "nurevo_session");
  if (!/^[a-f0-9]{64}$/.test(sessionId)) return null;
  return env.WEBMCP_KV.get(`${SESSION_PREFIX}${sessionId}`, "json");
}

async function sessionOwnsSiteKey(request, env, siteKey) {
  if (!siteKey) return false;
  const session = await getSession(request, env);
  if (!session?.email) return false;
  const record = await findSiteKey(env, siteKey);
  return Boolean(record?.status === "active" && record.email === session.email);
}

function cookieValue(request, name) {
  const cookies = request.headers.get("cookie") || "";
  for (const item of cookies.split(";")) {
    const [key, ...value] = item.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return "";
}

function sessionCookie(value, maxAge) {
  return `nurevo_session=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

async function findActiveSiteKeysByEmail(env, email) {
  if (hasD1(env)) {
    const rows = await env.WEBMCP_DB.prepare(`
      SELECT site_key, site_url, site_host, email, email_masked, created_at, status, plan, disabled_at, replaced_by_site_key
      FROM site_keys
      WHERE email = ? AND status = 'active'
      ORDER BY created_at DESC
    `).bind(email).all();
    return (rows.results || []).map(siteKeyRowToRecord);
  }
  const issued = await getJson(env, "site-keys", {});
  return Object.values(issued).filter((record) => record.email === email && record.status === "active");
}

function toPublicSiteKey(record) {
  return {
    siteKey: record.siteKey,
    siteUrl: record.siteUrl,
    siteHost: record.siteHost,
    emailMasked: record.emailMasked,
    createdAt: record.createdAt,
    status: record.status,
    plan: record.plan || "free"
  };
}

async function handleBillingCheckout(request, env) {
  const missing = ["STRIPE_SECRET_KEY", "STRIPE_PRICE_ID_PRO"].filter((name) => !String(env[name] || "").trim());
  if (missing.length) {
    return json({ error: `${missing.join(", ")} must be configured before checkout.`, code: "STRIPE_CONFIG_MISSING", missing }, 503, request, env);
  }
  const session = await getSession(request, env);
  if (!session) return json({ error: "authentication_required" }, 401, request, env);
  const payload = await readJson(request);
  const siteKey = String(payload?.siteKey || "").trim();
  const record = await findSiteKey(env, siteKey);
  if (!record || record.email !== session.email) return json({ error: "forbidden" }, 403, request, env);
  if (record.status !== "active") return json({ error: "site_key_not_active" }, 400, request, env);

  const form = new URLSearchParams();
  form.set("mode", "subscription");
  form.set("line_items[0][price]", env.STRIPE_PRICE_ID_PRO);
  form.set("line_items[0][quantity]", "1");
  form.set("success_url", "https://nurevo.jp/dashboard?checkout=success");
  form.set("cancel_url", "https://nurevo.jp/dashboard?checkout=cancelled");
  form.set("customer_email", session.email);
  form.set("metadata[siteKey]", siteKey);
  form.set("subscription_data[metadata][siteKey]", siteKey);
  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: form
  });
  const result = await stripeResponse.json();
  if (!stripeResponse.ok || !result.url) {
    console.error("stripe_checkout_error", JSON.stringify({ status: stripeResponse.status, type: result?.error?.type }));
    return json({ error: result?.error?.message || "Stripe Checkout session creation failed.", code: "STRIPE_CHECKOUT_FAILED" }, 502, request, env);
  }
  return json({ ok: true, url: result.url }, 200, request, env);
}

async function handleBillingWebhook(request, env) {
  if (!String(env.STRIPE_WEBHOOK_SECRET || "").trim()) {
    return json({ error: "STRIPE_WEBHOOK_SECRET is not configured.", code: "STRIPE_WEBHOOK_SECRET_MISSING" }, 503, request, env);
  }
  const signature = request.headers.get("stripe-signature") || "";
  const rawBody = await readText(request, FOOTPRINT_MAX_BYTES);
  if (!await verifyStripeSignature(rawBody, signature, env.STRIPE_WEBHOOK_SECRET)) {
    return json({ error: "invalid_webhook_signature" }, 400, request, env);
  }
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    throw new PublicHttpError(400, "invalid_json");
  }
  if (!event?.id || !await claimStripeEvent(env, event.id)) {
    return json({ received: true, duplicate: true }, 200, request, env);
  }
  try {
    if (event.type === "checkout.session.completed") {
      const siteKey = event.data?.object?.metadata?.siteKey;
      if (siteKey) await setSiteKeyPlan(env, siteKey, "pro");
    } else if (event.type === "customer.subscription.deleted") {
      const siteKey = event.data?.object?.metadata?.siteKey;
      if (siteKey) await setSiteKeyPlan(env, siteKey, "free");
    }
  } catch (error) {
    await releaseStripeEvent(env, event.id);
    throw error;
  }
  return json({ received: true }, 200, request, env);
}

async function claimStripeEvent(env, eventId) {
  if (hasD1(env)) {
    const result = await env.WEBMCP_DB.prepare(
      "INSERT OR IGNORE INTO stripe_webhook_events (event_id, processed_at) VALUES (?, CURRENT_TIMESTAMP)"
    ).bind(eventId).run();
    return Number(result.meta?.changes || 0) === 1;
  }
  if (!env.WEBMCP_KV) throw new PublicHttpError(503, "stripe_idempotency_unavailable");
  const key = `${STRIPE_EVENT_PREFIX}${eventId}`;
  if (await env.WEBMCP_KV.get(key)) return false;
  await env.WEBMCP_KV.put(key, "1", { expirationTtl: 30 * 24 * 60 * 60 });
  return true;
}

async function releaseStripeEvent(env, eventId) {
  if (hasD1(env)) {
    await env.WEBMCP_DB.prepare("DELETE FROM stripe_webhook_events WHERE event_id = ?").bind(eventId).run();
  } else if (env.WEBMCP_KV) {
    await env.WEBMCP_KV.delete(`${STRIPE_EVENT_PREFIX}${eventId}`);
  }
}

async function verifyStripeSignature(payload, header, secret) {
  const parts = header.split(",").map((part) => part.trim().split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const data = new TextEncoder().encode(`${timestamp}.${payload}`);
  for (const signature of signatures) {
    if (!/^[a-f0-9]{64}$/i.test(signature)) continue;
    const bytes = new Uint8Array(signature.match(/.{2}/g).map((pair) => Number.parseInt(pair, 16)));
    if (await crypto.subtle.verify("HMAC", key, bytes, data)) return true;
  }
  return false;
}

async function setSiteKeyPlan(env, siteKey, plan) {
  const record = await findSiteKey(env, siteKey);
  if (!record) return;
  if (hasD1(env)) {
    await env.WEBMCP_DB.prepare("UPDATE site_keys SET plan = ? WHERE site_key = ?").bind(plan, siteKey).run();
  } else {
    const issued = await getJson(env, "site-keys", {});
    issued[siteKey] = { ...record, plan };
    await putJson(env, "site-keys", issued);
  }
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : "";
}

async function requireAdmin(request, env) {
  const configured = String(env.WEBMCP_ADMIN_TOKEN || "").trim();
  if (!configured) return { ok: false, status: 503, error: "admin_auth_not_configured" };
  const supplied = request.headers.get("x-webmcp-admin-token") || "";
  if (await constantTimeSecretEqual(supplied, configured)) return { ok: true };
  return { ok: false, status: 401, error: "admin_token_required" };
}

async function constantTimeSecretEqual(left, right) {
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(left))),
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(right)))
  ]);
  const a = new Uint8Array(leftHash);
  const b = new Uint8Array(rightHash);
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

function normalizeSiteUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!url.hostname.includes(".") && !["localhost", "127.0.0.1"].includes(url.hostname)) return "";
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

function maskEmail(email) {
  const [local, domain] = String(email).split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}

function randomToken(bytes) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return [...data].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function highDescription({ site, fields }) {
  const selectors = fields
    .filter((field) => isMeaningfulField(field))
    .map((field) => `${field.selector}${field.label ? ` (${field.label})` : ""}`)
    .join(", ");
  return [
    `High-quality MCP generated server-side for ${site.host || "this host"}${site.pathname || ""}.`,
    "Use exact selectors from xWebMcpClientHints.fillStrategy.",
    `Visible fields: ${selectors}.`,
    "Apply server rule-table constraints such as digits-only phone/postal fields and ISO dates."
  ].join(" ");
}

function applyVariantToDescription(description, variant) {
  if (variant !== "treatment") return `${description} A/B control definition.`;
  return `${description} A/B treatment definition: prioritize completion outcome, exact visible selectors, validation-aware formatting, and do not fill hidden or irrelevant fields.`;
}

function isMeaningfulField(field) {
  return field.visible && field.tag !== "button" && field.type !== "hidden" && field.type !== "submit";
}

function fieldKey(field) {
  return sanitizeName(field.name || field.id || field.selector?.replace(/^#/, "") || "field");
}

function fieldText(field) {
  return [field.name, field.id, field.label, field.placeholder].filter(Boolean).join(" ");
}

function fieldSignature(field) {
  const kinds = inferredRuleKindsForField(field);
  const primary = kinds[0] || sanitizeName(fieldKey(field)).toLowerCase();
  return `${String(field.tag || "field").toLowerCase()}:${String(field.type || "text").toLowerCase()}:${primary}`;
}

function inferredRuleKindsForField(field) {
  const text = fieldText(field);
  const type = String(field.type || "").toLowerCase();
  const kinds = [];
  if (type === "tel" || /phone|tel|電話/i.test(text)) kinds.push("phone_digits_only");
  if (/postal|postcode|zip|郵便/i.test(text)) kinds.push("postal_digits_7");
  if (type === "date" || /date|日付/i.test(text)) kinds.push("date_iso");
  if (type === "email" || /mail|メール/i.test(text)) kinds.push("email_format");
  kinds.push("required_when_missing");
  return kinds;
}

function fieldForSelector(formStructure, selector, key) {
  return (formStructure?.fields || []).find((field) => field.selector === selector || field.key === key) || {
    selector,
    key,
    name: key,
    id: "",
    label: key,
    tag: "input",
    type: "text",
    visible: true
  };
}

function siteId(site) {
  return sanitizeName(site?.host || "unknown");
}

function sanitizeName(value) {
  return String(value || "field")
    .replace(/[^A-Za-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^[0-9]/, "_$&")
    || "field";
}

function append(base, addition) {
  return base ? `${base} ${addition}` : addition;
}
