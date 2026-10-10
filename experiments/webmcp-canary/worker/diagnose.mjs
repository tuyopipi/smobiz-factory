/**
 * Nurevo — site diagnostic endpoint.
 *
 * Mount in worker/index.mjs:
 *
 *   import { handleDiagnose } from "./diagnose.mjs";
 *   if (url.pathname === "/api/diagnose") return handleDiagnose(request);
 *
 * Static analysis only: fetches the page HTML and robots.txt.
 * No browser rendering, so JS-rendered forms are not visible.
 * That limitation is surfaced to the user in the result.
 */

import { AeoScoreError, diagnoseAeoUrl } from "./aeo-score.mjs";

const UA = "Nurevo-Diagnostics/1.0 (+https://nurevo.jp)";
const TIMEOUT_MS = 8000;
const MAX_BYTES = 2_000_000;
export const DEFAULT_AEO_SCORE_CRON_LIMIT = 10;
const MAX_AEO_SCORE_CRON_LIMIT = 50;

const AI_BOTS = ["GPTBot", "ClaudeBot", "anthropic-ai", "PerplexityBot", "Google-Extended", "CCBot"];

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,OPTIONS",
  "access-control-allow-headers": "content-type",
};

export async function handleDiagnose(request, env) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const url = new URL(request.url);
  const raw = url.searchParams.get("url") || "";
  const lang = url.searchParams.get("lang") === "en" ? "en" : "ja";

  try {
    const result = await diagnoseUrl(raw, lang);
    if (env?.DB) {
      try {
        const site = await resolveDiagnosedSite(env, url, raw);
        if (site) await storeAeoScore(env, site.id, result);
      } catch (error) {
        console.error("aeo-score-ondemand-save", JSON.stringify({ message: String(error?.message || error) }));
      }
    }
    return json(result);
  } catch (error) {
    if (error instanceof DiagnoseError || error instanceof AeoScoreError) return json({ error: error.code }, error.status);
    throw error;
  }
}

export async function diagnoseUrl(raw, lang = "ja") {
  const result = await diagnoseAeoUrl(raw);
  return {
    ...result,
    scorable: true,
    verdict: result.band === "green"
      ? (lang === "en" ? "Good" : "良好")
      : result.band === "yellow" ? (lang === "en" ? "Needs improvement" : "要改善")
        : (lang === "en" ? "Critical" : "危険"),
  };
}

class DiagnoseError extends Error {
  constructor(status, code, host = null) {
    super(code);
    this.name = "DiagnoseError";
    this.status = status;
    this.code = code;
    this.host = host;
  }
}

export async function storeAeoScore(env, siteId, result) {
  const ruleset = await env.DB.prepare(
    "SELECT version FROM aeo_rulesets WHERE active=1 ORDER BY version DESC LIMIT 1",
  ).first();
  const scannedAt = result.scannedAt || new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO aeo_scores (site_id,scanned_at,host,score,verdict,checks_json,ruleset_version)
     VALUES (?,?,?,?,?,?,?)`,
  ).bind(
    siteId,
    scannedAt,
    result.host || null,
    result.score == null ? null : result.score,
    result.verdict || null,
    JSON.stringify(Array.isArray(result.checks) ? result.checks : []),
    Number(ruleset?.version || 1),
  ).run();
  return { ...result, scannedAt, rulesetVersion: Number(ruleset?.version || 1) };
}

export async function diagnoseAndStore(env, site, { lang = "ja" } = {}) {
  const targetUrl = siteDiagnosticUrl(site);
  try {
    const result = await diagnoseUrl(targetUrl, lang);
    return { ok: true, siteId: site.id, result: await storeAeoScore(env, site.id, result) };
  } catch (error) {
    if (!(error instanceof DiagnoseError) && !(error instanceof AeoScoreError)) throw error;
    const failed = {
      host: error.host || safeHost(targetUrl),
      score: null,
      scorable: false,
      verdict: error.code,
      checks: [],
      scannedAt: new Date().toISOString(),
    };
    return { ok: false, siteId: site.id, error: error.code, result: await storeAeoScore(env, site.id, failed) };
  }
}

export async function runAeoScoreCron(env, { limit } = {}) {
  // `limit` remains available to deterministic tests and emergency manual
  // runs. Scheduled runs deliberately have no cap: a round-robin LIMIT left
  // larger accounts without a point on many calendar days.
  const requestedLimit = limit == null ? null : Math.max(1, Math.min(MAX_AEO_SCORE_CRON_LIMIT, Math.floor(Number(limit) || DEFAULT_AEO_SCORE_CRON_LIMIT)));
  const statement = env.DB.prepare(
    `SELECT s.id,s.url,s.website_uri,s.slug,MAX(a.scanned_at) AS last_aeo_scanned_at
       FROM sites s
       LEFT JOIN aeo_scores a ON a.site_id=s.id
      WHERE COALESCE(s.delivery_status,'active')='active'
        AND (trim(COALESCE(s.website_uri,''))<>'' OR trim(COALESCE(s.url,''))<>'' OR trim(COALESCE(s.slug,''))<>'')
      GROUP BY s.id,s.url,s.website_uri,s.slug,s.created_at
      ORDER BY CASE WHEN MAX(a.scanned_at) IS NULL THEN 0 ELSE 1 END,
               MAX(a.scanned_at) ASC,
               s.created_at ASC,
               s.id ASC
      ${requestedLimit == null ? "" : "LIMIT ?"}`,
  );
  const { results } = requestedLimit == null ? await statement.all() : await statement.bind(requestedLimit).all();

  const outcomes = [];
  for (const site of results || []) {
    try {
      outcomes.push(await diagnoseAndStore(env, site));
    } catch (error) {
      outcomes.push({ ok: false, siteId: site.id, error: String(error?.message || error).slice(0, 200) });
    }
  }
  return { limit: requestedLimit, selected: (results || []).length, processed: outcomes.length, outcomes };
}

function siteDiagnosticUrl(site) {
  const raw = String(site.website_uri || site.url || "").trim();
  if (raw) return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return `https://nurevo.jp/s/${encodeURIComponent(site.slug || "")}`;
}

async function resolveDiagnosedSite(env, requestUrl, raw) {
  let target;
  try { target = new URL(raw); } catch { return null; }
  const explicitId = requestUrl.searchParams.get("site_id") || requestUrl.searchParams.get("siteId");
  const explicitKey = requestUrl.searchParams.get("site_key") || requestUrl.searchParams.get("k");
  if (explicitId || explicitKey) {
    const row = explicitId
      ? await env.DB.prepare("SELECT id,url,website_uri,slug FROM sites WHERE id=? LIMIT 1").bind(explicitId).first()
      : await env.DB.prepare("SELECT id,url,website_uri,slug FROM sites WHERE site_key=? LIMIT 1").bind(explicitKey).first();
    if (row && diagnosticSiteMatches(row, target)) return row;
  }

  const normalized = target.href.replace(/\/$/, "").toLowerCase();
  const host = target.host.toLowerCase();
  const hostname = target.hostname.toLowerCase();
  const candidates = [normalized, host, hostname, `https://${host}`, `http://${host}`];
  const row = await env.DB.prepare(
    `SELECT id,url,website_uri,slug FROM sites
      WHERE lower(rtrim(trim(COALESCE(url,'')),'/')) IN (?,?,?,?,?)
         OR lower(rtrim(trim(COALESCE(website_uri,'')),'/')) IN (?,?,?,?,?)
      LIMIT 1`,
  ).bind(...candidates, ...candidates).first();
  if (row) return row;
  const hosted = target.hostname.toLowerCase() === "nurevo.jp" && target.pathname.match(/^\/s\/([^/]+)\/?$/i);
  return hosted
    ? env.DB.prepare("SELECT id,url,website_uri,slug FROM sites WHERE slug=? LIMIT 1").bind(decodeURIComponent(hosted[1])).first()
    : null;
}

function diagnosticSiteMatches(site, target) {
  if (site.slug && target.hostname.toLowerCase() === "nurevo.jp" && target.pathname === `/s/${site.slug}`) return true;
  return [site.website_uri, site.url].some((value) => {
    if (!value) return false;
    try {
      const candidate = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
      return candidate.hostname.toLowerCase() === target.hostname.toLowerCase();
    } catch { return false; }
  });
}

function safeHost(raw) {
  try { return new URL(raw).host; } catch { return null; }
}

/* ───────────────────────── fetch ───────────────────────── */

async function fetchText(href) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(href, {
      headers: { "user-agent": UA, accept: "text/html,text/plain,*/*" },
      redirect: "follow",
      signal: controller.signal,
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!res.ok) throw new Error(String(res.status));
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) throw new Error("too_large");
    return new TextDecoder("utf-8", { fatal: false }).decode(buf);
  } finally {
    clearTimeout(timer);
  }
}

export function isPrivateHost(host) {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (h === "0.0.0.0" || h === "[::1]") return true;
  return false;
}

/* ───────────────────────── parse ───────────────────────── */

async function parseHtml(html) {
  const f = {
    forms: [],
    labelFor: new Set(),
    webmcpTools: 0,
    structuredData: false,
    llmsTxtHint: false,
  };

  let current = null;

  const rewriter = new HTMLRewriter()
    .on("form", {
      element(el) {
        current = {
          fields: 0,
          required: 0,
          withFormatHint: 0,
          formatCandidates: 0,
          labelled: 0,
          ids: [],
          hasPassword: false,
          onlySearch: true,
        };
        f.forms.push(current);
        if (el.getAttribute("toolname")) f.webmcpTools++;
        el.onEndTag(() => { current = null; });
      },
    })
    .on("input, select, textarea", {
      element(el) {
        const type = (el.getAttribute("type") || "text").toLowerCase();
        if (type === "hidden" || type === "submit" || type === "button" || type === "image") return;

        const target = current || implicitForm(f);
        target.fields++;

        if (type === "password") target.hasPassword = true;
        if (type !== "search") target.onlySearch = false;

        if (el.hasAttribute("required")) target.required++;

        const name = (el.getAttribute("name") || "") + " " + (el.getAttribute("id") || "");
        const needsFormat = /tel|phone|zip|postal|post|date|birth|mail|number|num/i.test(name)
          || ["tel", "email", "date", "number", "url"].includes(type);
        if (needsFormat) {
          target.formatCandidates++;
          if (
            el.getAttribute("pattern") ||
            el.getAttribute("inputmode") ||
            ["tel", "email", "date", "number", "url"].includes(type)
          ) target.withFormatHint++;
        }

        const id = el.getAttribute("id");
        if (id) target.ids.push(id);
        if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")) target.labelled++;
      },
    })
    .on("label", {
      element(el) {
        const forAttr = el.getAttribute("for");
        if (forAttr) f.labelFor.add(forAttr);
      },
    })
    .on('script[type="application/ld+json"]', {
      element() { f.structuredData = true; },
    })
    .on("[itemscope]", {
      element() { f.structuredData = true; },
    })
    .on("[toolname]", {
      element() { f.webmcpTools++; },
    });

  await rewriter.transform(new Response(html)).arrayBuffer();

  for (const form of f.forms) {
    for (const id of form.ids) if (f.labelFor.has(id)) form.labelled++;
  }
  return f;
}

function implicitForm(f) {
  let orphan = f.forms.find((x) => x.__orphan);
  if (!orphan) {
    orphan = {
      fields: 0, required: 0, withFormatHint: 0, formatCandidates: 0,
      labelled: 0, ids: [], hasPassword: false, onlySearch: true, __orphan: true,
    };
    f.forms.push(orphan);
  }
  return orphan;
}

export function blockedBots(robots) {
  if (!robots) return [];
  const lines = robots.split(/\r?\n/);
  const hit = [];
  let agents = [];
  let disallowAll = false;

  const flush = () => {
    if (disallowAll) {
      for (const a of agents) {
        const match = AI_BOTS.find((b) => b.toLowerCase() === a);
        if (match && !hit.includes(match)) hit.push(match);
        if (a === "*" && !hit.includes("*")) hit.push("*");
      }
    }
    agents = [];
    disallowAll = false;
  };

  for (const line of lines) {
    const t = line.split("#")[0].trim();
    if (!t) { flush(); continue; }
    const [k, ...rest] = t.split(":");
    const key = (k || "").trim().toLowerCase();
    const val = rest.join(":").trim();
    if (key === "user-agent") {
      if (disallowAll) flush();
      agents.push(val.toLowerCase());
    } else if (key === "disallow" && val === "/") {
      disallowAll = true;
    }
  }
  flush();
  return hit;
}

/* ───────────────────────── checks ──────────────────────── */

export function buildChecks(f, blocked, lang) {
  const t = (ja, en) => (lang === "en" ? en : ja);
  const real = f.forms.filter((x) => x.fields >= 2 && !x.hasPassword && !x.onlySearch);
  const checks = [];

  // 1. AI crawler access — reported first, and caps the score when blocked
  if (blocked.length) {
    const names = blocked.includes("*") ? t("すべてのクローラー", "all crawlers") : blocked.join(", ");
    checks.push({
      key: "crawler", status: "bad", weight: 10,
      title: t("AIからのアクセスを拒否しています", "AI access is being blocked"),
      detail: t(
        `robots.txt が ${names} をブロックしています。エージェント経由の訪問は、入口で断られています。`,
        `robots.txt blocks ${names}. Agent traffic is turned away before it reaches you.`
      ),
    });
  } else {
    checks.push({
      key: "crawler", status: "ok", weight: 10,
      title: t("AIからのアクセスは開いています", "AI access is open"),
      detail: t("robots.txt で主要なAIクローラーをブロックしていません。", "robots.txt does not block the major AI crawlers."),
    });
  }

  // 2. no form → nothing to judge. Return early, unscored.
  if (!real.length) {
    checks.push({
      key: "forms", status: "warn", weight: 0,
      title: t("フォームが見つかりませんでした", "No form found"),
      detail: t(
        "このページに入力フォームが無いか、JavaScriptで後から表示されている可能性があります。問い合わせや予約のページのURLでお試しください。",
        "Either this page has no form, or it is rendered later by JavaScript. Try the URL of a contact or booking page."
      ),
    });
    checks.push({
      key: "note", status: "warn", weight: 0,
      title: t("採点は行いません", "No score given"),
      detail: t(
        "判定できるフォームが無いため、点数は出しません。",
        "There is no form to judge here, so no score is shown."
      ),
    });
    return { checks, scorable: false };
  }

  const fields = real.reduce((a, x) => a + x.fields, 0);
  const required = real.reduce((a, x) => a + x.required, 0);
  const cand = real.reduce((a, x) => a + x.formatCandidates, 0);
  const hinted = real.reduce((a, x) => a + x.withFormatHint, 0);
  const labelled = real.reduce((a, x) => a + Math.min(x.labelled, x.fields), 0);

  // 3. agent-facing markup — the core of what this measures
  checks.push(
    f.webmcpTools > 0
      ? {
          key: "webmcp", status: "ok", weight: 30,
          title: t("エージェント向けの記述があります", "Agent-facing markup is present"),
          detail: t("フォームにWebMCPの記述が見つかりました。", "WebMCP attributes were found on this page."),
        }
      : {
          key: "webmcp", status: "bad", weight: 30,
          title: t("エージェント向けの記述がありません", "No agent-facing markup"),
          detail: t(
            "エージェントは画面を推測しながら操作することになり、時間がかかり、失敗しやすくなります。",
            "Agents must guess their way through the screen, which is slow and error-prone."
          ),
        }
  );

  // 4. input formats
  if (cand > 0) {
    const missing = cand - hinted;
    checks.push({
      key: "format",
      status: missing === 0 ? "ok" : missing <= 1 ? "warn" : "bad",
      weight: 20,
      title: missing === 0
        ? t("入力形式が指定されています", "Input formats are specified")
        : t(`${missing}項目に入力形式の指定がありません`, `${missing} fields have no format specified`),
      detail: missing === 0
        ? t(
            "形式の指定があるため、弾かれにくく、スマホでも適切なキーボードが出ます。",
            "With formats declared, entries are less likely to be rejected and mobile shows the right keyboard."
          )
        : t(
            "電話番号や郵便番号などで、形式違いによるエラーが起きやすい状態です。スマホで数字キーボードが出ないこともあります。",
            "Phone and postal fields are prone to format errors, and mobile may not show a numeric keyboard."
          ),
    });
  }

  // 5. labels
  const unlabelled = Math.max(0, fields - labelled);
  checks.push({
    key: "label",
    status: unlabelled === 0 ? "ok" : unlabelled <= 2 ? "warn" : "bad",
    weight: 16,
    title: unlabelled === 0
      ? t("すべての欄にラベルが付いています", "Every field has a label")
      : t(`${unlabelled}項目にラベルが付いていません`, `${unlabelled} fields have no label`),
    detail: unlabelled === 0
      ? t("何を入力する欄か、機械にも正しく伝わります。", "Machines can tell what each field is for.")
      : t(
          "ラベルが無い欄は、エージェントにも読み上げソフトにも意味が伝わりません。",
          "Fields without labels are meaningless to agents and to screen readers."
        ),
  });

  // 6. field count
  const avg = Math.round(fields / real.length);
  checks.push({
    key: "count",
    status: avg <= 6 ? "ok" : avg <= 10 ? "warn" : "bad",
    weight: 12,
    title: t(
      `入力欄は${real.length > 1 ? "平均" : ""}${avg}項目`,
      `${real.length > 1 ? "Average " : ""}${avg} fields`
    ),
    detail: avg <= 6
      ? t("項目数は抑えられています。", "The field count is kept low.")
      : t(
          "項目が1つ増えるごとに完了率は下がります。削れる項目がないか確認してください。",
          "Every extra field costs completions. Look for fields you can drop."
        ),
  });

  // 7. required ratio
  const ratio = fields ? required / fields : 0;
  checks.push({
    key: "required",
    status: ratio <= 0.6 ? "ok" : ratio <= 0.85 ? "warn" : "bad",
    weight: 10,
    title: t(`${fields}項目中${required}項目が必須`, `${required} of ${fields} fields are required`),
    detail: ratio <= 0.6
      ? t("任意項目が確保されています。", "Optional fields are preserved.")
      : t(
          "必須が多いほど、入力を諦められやすくなります。",
          "The more that is mandatory, the more people abandon the form."
        ),
  });

  // 8. structured data
  checks.push(
    f.structuredData
      ? {
          key: "sd", status: "ok", weight: 12,
          title: t("構造化データがあります", "Structured data is present"),
          detail: t("サービス内容が機械に伝わる形で書かれています。", "Your offering is described in a machine-readable form."),
        }
      : {
          key: "sd", status: "warn", weight: 12,
          title: t("構造化データがありません", "No structured data"),
          detail: t("何を提供しているサイトなのか、AIが正確に理解できません。", "AI cannot reliably tell what this site offers."),
        }
  );

  return { checks, scorable: true };
}

export function scoreOf(checks, blocked = []) {
  let got = 0, max = 0;
  for (const c of checks) {
    if (!c.weight) continue;
    max += c.weight;
    got += c.status === "ok" ? c.weight : c.status === "warn" ? c.weight * 0.5 : 0;
  }
  if (!max) return 0;
  let score = Math.round((got / max) * 100);
  // Blocking AI crawlers turns agents away at the door. Nothing else compensates.
  if (blocked.length) score = Math.min(score, 35);
  return score;
}

export function verdictOf(score, lang) {
  const ja = score >= 85 ? "よく整っています"
    : score >= 65 ? "おおむね動きますが、改善の余地があります"
    : score >= 40 ? "エージェントが詰まりやすい状態です"
    : "エージェントはほぼ完了できません";
  const en = score >= 85 ? "In good shape"
    : score >= 65 ? "Workable, with room to improve"
    : score >= 40 ? "Agents are likely to get stuck"
    : "Agents will rarely complete this";
  return lang === "en" ? en : ja;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS },
  });
}
