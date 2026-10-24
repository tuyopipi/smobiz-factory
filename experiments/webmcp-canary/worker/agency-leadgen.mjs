/**
 * Agency lead-generation tools, for approved partners (accounts.partner_status
 * = 'approved').
 *
 *   1. The "Is your business visible to AI?" widget for the AGENCY's own
 *      website. A script (or a plain iframe) the agency copies from the
 *      Partner page loads /api/leadgen/frame/<widget key>: a small form under
 *      the agency's brand (agency_branding, 0046). The visitor enters a site
 *      URL, name and email and ticks a consent box that names the agency. The
 *      server runs the existing on-site AEO score (the same cached diagnosis as
 *      /api/aeo/score - never a paid AI engine call), stores the lead for that
 *      agency (agency_leads) and answers with a short result whose call to
 *      action is the AGENCY's contact ("ask <agency> for a free AI appearance
 *      check"). Optional email to the agency on each new lead.
 *
 *      Abuse: a per-agency public widget key (wk_..., rotatable; not the
 *      referral code), the agency's allowed origins (frame-ancestors, plus the
 *      embedding page's Referer when the browser sends one), a signed form
 *      token that carries the time the form was shown (too fast or too old is
 *      refused; single use when KV is bound), a honeypot field, strict input
 *      validation, no third-party script, a strict CSP, every value escaped or
 *      set as text. Rate limits, in this order (submitLead): a cheap per-IP
 *      limit on every request first; then the token and honeypot; and only a
 *      VALID submission counts against the per-IP lead limit and the per-key
 *      daily limit - so junk cannot use up an agency's daily quota.
 *
 *      Privacy: the widget needs the agency's privacy-policy URL. The consent
 *      text names the agency as controller (with its policy) and Nurevo as
 *      processor (nurevo.jp/privacy); the landing page links both. A visitor's
 *      URL is scored through a cache scoped to that agency, never the shared
 *      /api/aeo/score cache, so one agency's visitors cannot be inferred from
 *      another's (or the public endpoint's) cache hits.
 *
 *      Notifications: a new-lead email goes to the branding contact address
 *      only once that address was verified with a signed link
 *      (/api/agency/verify-contact); until then it goes to the member's own
 *      sign-in address.
 *
 *   2. The agency referral landing page, /p/<slug>: the agency's brand, a short
 *      pitch for Nurevo's free plugin and AI check, buttons to install the
 *      plugin and to sign up WITH the agency's referral code, the agency's
 *      contact, and (when the widget is on) the check itself. Page chrome in
 *      ja en zh tw ko es fr de, every other language in English. Indexed by
 *      default; the agency may set noindex.
 *
 * Attribution: every signup link these pages show carries the agency's
 * referral code (signup.html?referral_code=...), so a signup that follows is
 * attributed and earns commission under the existing partner rules
 * (findOrCreateMember: approved partner only, no self-referral).
 *
 * Data: the agency is the controller of its leads, Nurevo the processor; the
 * consent text shown is stored verbatim with each lead. Logs carry ids and
 * counts only, never a lead's name, email or URL.
 *
 * Before migration 0047 every endpoint answers "unavailable" / 404 and the
 * dashboard hides the cards; nothing fails.
 */
import { isApprovedPartner } from "./partner.mjs";
import { DEFAULT_BRAND_COLOR, loadBranding, logoSrc, safeHttpsUrl, validEmail } from "./agency-report.mjs";
import { DASHBOARD_ORIGIN, mailConfigured, sendResendEmail } from "./lifecycle-email.mjs";
import { localizeAeoChecks } from "./aeo-score.mjs";
import { LANG_NAMES, LEADGEN_COPY, LEADGEN_LANGS, LEADGEN_LANG_TAG, LEADGEN_VERIFY_COPY, SIGNUP_LANG } from "./agency-leadgen-i18n.mjs";

export { LEADGEN_LANGS };
export const LEADGEN_WIDGET_PATH = "/api/leadgen/widget.js";
export const LEADGEN_FRAME_PREFIX = "/api/leadgen/frame/";
export const LEADGEN_SUBMIT_PATH = "/api/leadgen/submit";
/** The signed link that verifies the agency's contact email (public, no session). */
export const LEADGEN_VERIFY_PATH = "/api/agency/verify-contact";
export const CONTACT_VERIFY_TTL_MS = 3 * 24 * 60 * 60 * 1000;
export const LANDING_PREFIX = "/p/";
export const PLUGIN_URL = "https://wordpress.org/plugins/nurevo-webmcp/";
export const PRIVACY_URL = "https://nurevo.jp/privacy";
export const LEADGEN_MAX_ORIGINS = 10;
export const LEADGEN_INTRO_MAX = 500;
export const SLUG_MIN = 3;
export const SLUG_MAX = 40;
/** The form must be on screen this long before it is sent (people read; bots do not). */
export const MIN_FILL_MS = 3000;
/** A form token older than this is refused (reload the page for a new one). */
export const MAX_FORM_AGE_MS = 2 * 60 * 60 * 1000;
export const LEADGEN_LIMITS = Object.freeze({
  // Every request from one address, valid or not, checked before anything
  // else: cheap, and it stops a flood from one place early.
  ipAny: { limit: 60, windowMs: 60 * 60 * 1000 },
  // Valid leads from one address: one visitor checks a few sites at most.
  ip: { limit: 10, windowMs: 60 * 60 * 1000 },
  // Valid leads of one agency together: bounds what a leaked key can cost.
  // Junk (a bad token, the honeypot) is refused before this and never counts.
  key: { limit: 300, windowMs: 24 * 60 * 60 * 1000 },
  // Contact-verification emails per account.
  verify: { limit: 5, windowMs: 24 * 60 * 60 * 1000 },
});
const WIDGET_KEY_RE = /^wk_[a-z0-9]{24}$/;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
/**
 * Words a page address may not be: Nurevo's own paths and names, words that
 * would read as official, and the names of the AI engines and big platforms.
 */
export const RESERVED_SLUGS = Object.freeze(new Set([
  "admin", "administrator", "api", "app", "apps", "assets", "auth", "billing", "blog", "check", "checkout", "contact", "dashboard",
  "dev", "docs", "help", "home", "index", "info", "legal", "login", "logout", "mail", "news", "nurevo", "nurevo-jp", "official",
  "p", "partner", "partners", "payment", "plugin", "pricing", "privacy", "pro", "register", "root", "s", "security", "settings",
  "signup", "sitemap", "staff", "static", "status", "support", "system", "team", "terms", "test", "tokushoho", "www", "null",
  "undefined", "anthropic", "claude", "openai", "chatgpt", "gpt", "perplexity", "google", "gemini", "microsoft", "copilot", "bing",
  "apple", "meta", "wordpress", "stripe",
]));

const MISSING = /no such table|no such column/i;
const isMissing = (error) => MISSING.test(String(error?.message || error));
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fill = (template, vars = {}) => String(template).replace(/\{(\w+)\}/g, (m, key) => (vars[key] != null ? String(vars[key]) : m));
const singleLine = (value) => String(value ?? "").replace(CONTROL, " ").replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
const changes = (result) => Number(result?.meta?.changes ?? result?.changes ?? 0);
const utf8 = (value) => new TextEncoder().encode(value);
const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (value) => Uint8Array.from(atob(String(value).replace(/-/g, "+").replace(/_/g, "/") + "===".slice((String(value).length + 3) % 4)), (c) => c.charCodeAt(0));
/** JSON safe to put inside a <script> element. */
const scriptJson = (value) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

/* ------------------------------------------------------------------ *
 * Language
 * ------------------------------------------------------------------ */

/** One of the eight languages for a ?lang= value or an Accept-Language header; English otherwise. */
export function leadgenLang(requested, acceptLanguage = "") {
  const pick = (raw) => {
    const value = String(raw || "").trim().toLowerCase().replace(/_/g, "-");
    if (!value) return null;
    if (value === "tw" || /^zh-(tw|hk|mo|hant)/.test(value)) return "tw";
    const base = value.split("-")[0];
    return LEADGEN_LANGS.includes(base) ? base : null;
  };
  const explicit = pick(requested);
  if (explicit) return explicit;
  if (requested && String(requested).trim()) return "en"; // asked for a language we do not write: English
  for (const part of String(acceptLanguage || "").split(",")) {
    const found = pick(part.split(";")[0]);
    if (found) return found;
  }
  return "en";
}
export const leadgenCopy = (lang) => LEADGEN_COPY[LEADGEN_LANGS.includes(lang) ? lang : "en"];
/** The language tag the diagnosis wording takes. */
const CHECK_LANG = Object.freeze({ ja: "ja", en: "en", zh: "zh-CN", tw: "zh-TW", ko: "ko", es: "es", fr: "fr", de: "de" });

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

/** "https://host[:port]" from what an agency typed, or null. https only, no wildcards. */
export function normalizeOrigin(value) {
  const raw = String(value ?? "").trim();
  if (!raw || raw.length > 300 || /[\s*<>"'`;,\\]/.test(raw)) return null;
  let url;
  try { url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password || !url.hostname.includes(".")) return null;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname) || url.hostname.startsWith("[")) return null;
  return url.origin;
}

/** null when the slug may be used, else "slug_invalid" | "slug_reserved". */
export function slugProblem(value) {
  const slug = String(value ?? "");
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX || !SLUG_RE.test(slug) || slug.includes("--")) return "slug_invalid";
  if (RESERVED_SLUGS.has(slug) || /^(nurevo|admin|official|support)-/.test(slug) || /^xn--/.test(slug)) return "slug_reserved";
  return null;
}

/** The dashboard's settings form: { ok, value, errors, invalid }. */
export function validateLeadgenSettings(input = {}) {
  const errors = [];
  const invalid = [];
  const rawOrigins = Array.isArray(input.allowed_origins) ? input.allowed_origins : String(input.allowed_origins ?? "").split(/[\r\n,]+/);
  const origins = [];
  for (const entry of rawOrigins) {
    const text = String(entry ?? "").trim();
    if (!text) continue;
    const origin = normalizeOrigin(text);
    if (!origin) { invalid.push(text.slice(0, 120)); continue; }
    if (!origins.includes(origin)) origins.push(origin);
  }
  if (invalid.length) errors.push("allowed_origins");
  if (origins.length > LEADGEN_MAX_ORIGINS) errors.push("allowed_origins_count");
  const slugText = String(input.slug ?? "").trim().toLowerCase();
  const slug = slugText || null;
  const slugError = slug ? slugProblem(slug) : null;
  if (slugError) errors.push(slugError);
  const intro = String(input.landing_intro ?? "").replace(/\r\n?/g, "\n").replace(CONTROL, "").replace(/\n{3,}/g, "\n\n").trim();
  if (intro.length > LEADGEN_INTRO_MAX) errors.push("landing_intro");
  const landingEnabled = input.landing_enabled === true;
  if (landingEnabled && !slug) errors.push("slug_required");
  const privacyRaw = String(input.privacy_url ?? "").trim();
  const privacyUrl = privacyRaw ? safeHttpsUrl(privacyRaw, 500) : null;
  if (privacyRaw && !privacyUrl) errors.push("privacy_url");
  // The consent text names the agency's policy: no policy, no widget.
  else if (input.widget_enabled === true && !privacyUrl) errors.push("privacy_url_required");
  return {
    ok: errors.length === 0,
    errors,
    invalid,
    value: {
      widget_enabled: input.widget_enabled === true,
      allowed_origins: origins,
      notify_email: input.notify_email === true,
      slug,
      landing_enabled: landingEnabled,
      landing_noindex: input.landing_noindex === true,
      landing_intro: intro || null,
      privacy_url: privacyUrl,
    },
  };
}

/**
 * The visitor's site address: an http(s) URL with a dotted host and no
 * credentials, "https://" added when no scheme was typed. Private and local
 * hosts are refused again by the diagnosis itself before anything is fetched.
 */
export function normalizeLeadUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw || raw.length > 500 || /[\s<>"'`\\]/.test(raw)) return null;
  let url;
  try { url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`); } catch { return null; }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (!host.includes(".") || host.endsWith(".") || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.startsWith("[") || /(^|\.)(localhost|local|internal|test|invalid|example)$/.test(host)) return null;
  url.hash = "";
  return url.href;
}

/** A lead from the form: { ok, value, errors }. Consent must be exactly true. */
export function validateLead(input = {}) {
  const errors = [];
  const siteUrl = normalizeLeadUrl(input.site_url);
  if (!siteUrl) errors.push("site_url");
  const name = singleLine(input.name).slice(0, 101);
  if (!name || name.length > 100) errors.push("name");
  const email = String(input.email ?? "").trim().toLowerCase();
  if (!validEmail(email)) errors.push("email");
  if (input.consent !== true) errors.push("consent");
  return { ok: errors.length === 0, errors, value: { site_url: siteUrl, name, email } };
}

/**
 * The consent text shown next to the checkbox, in one language, as plain text
 * (stored verbatim with each lead): the agency as controller with its privacy
 * policy, Nurevo as processor with nurevo.jp/privacy.
 */
export function consentText(lang, agencyName, policyUrl) {
  return fill(leadgenCopy(lang).consent, { agency: singleLine(agencyName), policy: safeHttpsUrl(policyUrl) || "—", nurevo_policy: PRIVACY_URL });
}

/** The same text as HTML: escaped, with the two policy URLs as links. */
export function consentHtml(lang, agencyName, policyUrl) {
  const policy = safeHttpsUrl(policyUrl);
  let html = escapeHtml(consentText(lang, agencyName, policyUrl));
  for (const href of [policy, PRIVACY_URL].filter(Boolean)) {
    const escaped = escapeHtml(href);
    html = html.split(escaped).join(`<a href="${escaped}" target="_blank" rel="noopener">${escaped}</a>`);
  }
  return html;
}

/* ------------------------------------------------------------------ *
 * Keys and tokens
 * ------------------------------------------------------------------ */

const KEY_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
export function newWidgetKey() {
  let out = "";
  const cutoff = 256 - (256 % KEY_ALPHABET.length);
  while (out.length < 24) {
    for (const byte of crypto.getRandomValues(new Uint8Array(32))) {
      if (byte < cutoff) out += KEY_ALPHABET[byte % KEY_ALPHABET.length];
      if (out.length === 24) break;
    }
  }
  return `wk_${out}`;
}
export const isWidgetKey = (value) => WIDGET_KEY_RE.test(String(value || ""));

function formSecret(env) {
  return String(env.LEADGEN_FORM_SECRET || env.EMAIL_UNSUBSCRIBE_SECRET || "").trim();
}
async function mac(secret, payload) {
  const key = await crypto.subtle.importKey("raw", utf8(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, utf8(`nurevo-leadgen-form-v1:${payload}`)));
}

/** A signed token for one rendering of the form: which widget, when, from where. */
export async function issueFormToken(env, { key, origin = null, source = "widget", now = Date.now() }) {
  const secret = formSecret(env);
  if (!secret) return null;
  const nonce = b64url(crypto.getRandomValues(new Uint8Array(12)));
  const payload = b64url(utf8(JSON.stringify({ k: key, t: now, n: nonce, o: origin || null, s: source === "landing" ? "landing" : "widget" })));
  return `${payload}.${b64url(await mac(secret, payload))}`;
}

/** { ok:true, issuedAt, nonce, origin, source } or { ok:false, reason }. */
export async function verifyFormToken(env, token, { key, now = Date.now() }) {
  const secret = formSecret(env);
  const [payload, sig, extra] = String(token || "").split(".");
  if (!secret || !payload || !sig || extra !== undefined || payload.length > 600) return { ok: false, reason: "token" };
  let data;
  try {
    const expected = await mac(secret, payload);
    const given = fromB64url(sig);
    if (given.length !== expected.length) return { ok: false, reason: "token" };
    let diff = 0;
    for (let i = 0; i < given.length; i += 1) diff |= given[i] ^ expected[i];
    if (diff !== 0) return { ok: false, reason: "token" };
    data = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
  } catch {
    return { ok: false, reason: "token" };
  }
  if (data?.k !== key) return { ok: false, reason: "token" };
  const age = now - Number(data.t);
  if (!Number.isFinite(age) || age < MIN_FILL_MS) return { ok: false, reason: "too_fast" };
  if (age > MAX_FORM_AGE_MS) return { ok: false, reason: "expired" };
  return { ok: true, issuedAt: Number(data.t), nonce: String(data.n || ""), origin: data.o || null, source: data.s === "landing" ? "landing" : "widget" };
}

/* ------------------------------------------------------------------ *
 * Storage
 * ------------------------------------------------------------------ */

export async function leadgenAvailable(env) {
  try {
    await env.DB.prepare("SELECT 1 FROM agency_leadgen LIMIT 1").first();
    await env.DB.prepare("SELECT 1 FROM agency_leads LIMIT 1").first();
    await env.DB.prepare("SELECT 1 FROM agency_branding LIMIT 1").first();
    await env.DB.prepare("SELECT partner_status, partner_approved_at, referral_code FROM accounts LIMIT 1").first();
    return true;
  } catch (error) {
    if (isMissing(error)) return false;
    throw error;
  }
}

const parseOrigins = (json) => {
  try { const list = JSON.parse(json || "[]"); return Array.isArray(list) ? list.map(normalizeOrigin).filter(Boolean) : []; } catch { return []; }
};
function settingsView(row) {
  if (!row) return null;
  return {
    widget_key: row.widget_key,
    widget_enabled: Number(row.widget_enabled) === 1,
    allowed_origins: parseOrigins(row.allowed_origins_json),
    notify_email: Number(row.notify_email) === 1,
    slug: row.slug || null,
    landing_enabled: Number(row.landing_enabled) === 1,
    landing_noindex: Number(row.landing_noindex) === 1,
    landing_intro: row.landing_intro || null,
    privacy_url: safeHttpsUrl(row.privacy_url) || null,
    contact_verified_email: row.contact_verified_email || null,
    contact_verified_at: row.contact_verified_at ?? null,
    contact_verify_sent_at: row.contact_verify_sent_at ?? null,
    updated_at: row.updated_at ?? null,
  };
}

export async function loadLeadgen(env, accountId) {
  const row = await env.DB.prepare("SELECT * FROM agency_leadgen WHERE account_id=? LIMIT 1").bind(accountId).first();
  return settingsView(row);
}

export class SlugTakenError extends Error {
  constructor() { super("slug_taken"); this.code = "slug_taken"; }
}

/** Saves the settings (creating the widget key the first time). Throws SlugTakenError. */
export async function saveLeadgen(env, accountId, value, { memberId = null, now = Date.now() } = {}) {
  if (value.slug) {
    const other = await env.DB.prepare("SELECT account_id FROM agency_leadgen WHERE slug=? AND account_id<>? LIMIT 1").bind(value.slug, accountId).first();
    if (other) throw new SlugTakenError();
  }
  try {
    await env.DB.prepare(`INSERT INTO agency_leadgen (account_id,widget_key,widget_enabled,allowed_origins_json,notify_email,slug,landing_enabled,landing_noindex,landing_intro,created_at,updated_at,updated_by,privacy_url)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(account_id) DO UPDATE SET widget_enabled=excluded.widget_enabled, allowed_origins_json=excluded.allowed_origins_json,
        notify_email=excluded.notify_email, slug=excluded.slug, landing_enabled=excluded.landing_enabled, landing_noindex=excluded.landing_noindex,
        landing_intro=excluded.landing_intro, updated_at=excluded.updated_at, updated_by=excluded.updated_by, privacy_url=excluded.privacy_url`)
      .bind(accountId, newWidgetKey(), value.widget_enabled ? 1 : 0, JSON.stringify(value.allowed_origins || []), value.notify_email ? 1 : 0,
        value.slug, value.landing_enabled ? 1 : 0, value.landing_noindex ? 1 : 0, value.landing_intro, now, now, memberId, value.privacy_url || null).run();
  } catch (error) {
    // Two agencies saving the same address at once: the UNIQUE index decides.
    if (/UNIQUE|constraint/i.test(String(error?.message || error)) && value.slug) throw new SlugTakenError();
    throw error;
  }
  return loadLeadgen(env, accountId);
}

/** A new widget key; the old one stops working at once. */
export async function rotateWidgetKey(env, accountId, { now = Date.now() } = {}) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const result = await env.DB.prepare("UPDATE agency_leadgen SET widget_key=?, updated_at=? WHERE account_id=?").bind(newWidgetKey(), now, accountId).run();
      return changes(result) === 1 ? loadLeadgen(env, accountId) : null;
    } catch (error) {
      if (!/UNIQUE|constraint/i.test(String(error?.message || error))) throw error;
    }
  }
  throw new Error("widget_key_collision");
}

/**
 * The agency behind a public widget key or landing slug, when it may be shown:
 * the settings row, an approved partner whose member is active, and branding.
 * null otherwise (including before 0047).
 */
export async function loadPublicAgency(env, { key = null, slug = null }) {
  const where = key ? "l.widget_key=?" : "l.slug=?";
  let row;
  try {
    row = await env.DB.prepare(`SELECT l.*, a.id AS a_id, a.email AS a_email, a.member_id AS a_member_id, a.referral_code AS a_referral_code,
        a.partner_status AS a_partner_status, a.partner_approved_at AS a_partner_approved_at, m.status AS m_status
      FROM agency_leadgen l JOIN accounts a ON a.id=l.account_id LEFT JOIN members m ON m.id=a.member_id
      WHERE ${where} LIMIT 1`).bind(key || slug).first();
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }
  if (!row) return null;
  const account = { id: row.a_id, email: row.a_email, member_id: row.a_member_id, referral_code: row.a_referral_code, partner_status: row.a_partner_status, partner_approved_at: row.a_partner_approved_at };
  if (!isApprovedPartner(account) || (row.m_status && row.m_status !== "active")) return null;
  let branding = null;
  try { branding = await loadBranding(env, account.id); } catch (error) { if (!isMissing(error)) throw error; }
  if (!branding?.display_name) return null;
  return { settings: settingsView(row), account, branding };
}

/** Stores one lead and returns its id. */
export async function storeLead(env, accountId, lead, { now = Date.now() } = {}) {
  const row = await env.DB.prepare(`INSERT INTO agency_leads (account_id,widget_key,source,page_origin,site_url,name,email,score,band,locale,consent_text,consent_at,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id`)
    .bind(accountId, lead.widget_key || null, lead.source, lead.page_origin || null, lead.site_url, lead.name, lead.email,
      Number.isFinite(lead.score) ? Math.round(lead.score) : null, lead.band || null, lead.locale, lead.consent_text, now, now).first();
  return row?.id ?? null;
}

const LEAD_COLUMNS = "id,created_at,source,page_origin,site_url,name,email,score,band,locale,consent_text,consent_at,notified_at";

export async function listLeads(env, accountId, { limit = 100, before = null } = {}) {
  const max = Math.min(Math.max(Number(limit) || 100, 1), 5000);
  const cursor = Number(before);
  const { results = [] } = Number.isSafeInteger(cursor) && cursor > 0
    ? await env.DB.prepare(`SELECT ${LEAD_COLUMNS} FROM agency_leads WHERE account_id=? AND id<? ORDER BY id DESC LIMIT ?`).bind(accountId, cursor, max).all()
    : await env.DB.prepare(`SELECT ${LEAD_COLUMNS} FROM agency_leads WHERE account_id=? ORDER BY id DESC LIMIT ?`).bind(accountId, max).all();
  return results;
}

export async function countLeads(env, accountId) {
  const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM agency_leads WHERE account_id=?").bind(accountId).first();
  return Number(row?.n || 0);
}

export async function deleteLead(env, accountId, leadId) {
  const id = Number(leadId);
  if (!Number.isSafeInteger(id) || id <= 0) return false;
  return changes(await env.DB.prepare("DELETE FROM agency_leads WHERE id=? AND account_id=?").bind(id, accountId).run()) === 1;
}

/* ------------------------------------------------------------------ *
 * CSV
 * ------------------------------------------------------------------ */

/**
 * One CSV cell. A value a spreadsheet would run as a formula (= + - @, or a
 * leading tab / carriage return) is prefixed with an apostrophe; every cell is
 * quoted and its quotes doubled.
 */
export function csvCell(value) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export const LEAD_CSV_COLUMNS = Object.freeze(["created_at", "source", "page_origin", "site_url", "name", "email", "score", "band", "locale", "consent_text", "consent_at"]);
export function leadsCsv(rows) {
  const iso = (ms) => (Number.isFinite(Number(ms)) && Number(ms) > 0 ? new Date(Number(ms)).toISOString() : "");
  const lines = [LEAD_CSV_COLUMNS.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(LEAD_CSV_COLUMNS.map((column) => csvCell(column === "created_at" || column === "consent_at" ? iso(row[column]) : row[column])).join(","));
  }
  // The BOM lets Excel open UTF-8 (Japanese names) correctly.
  return `\ufeff${lines.join("\r\n")}\r\n`;
}

/* ------------------------------------------------------------------ *
 * Rate limits (the shared api_rate_limits table)
 * ------------------------------------------------------------------ */

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", utf8(String(value)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function leadgenRateLimit(env, scope, value, { limit, windowMs }, now = Date.now()) {
  const key = `${scope}:${await sha256Hex(`${scope}:${value}`)}`;
  const cutoff = now - windowMs;
  try {
    const row = await env.DB.prepare(`
      INSERT INTO api_rate_limits (bucket, window_started_at, count, updated_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(bucket) DO UPDATE SET
        count = CASE WHEN api_rate_limits.window_started_at <= ? THEN 1 ELSE api_rate_limits.count + 1 END,
        window_started_at = CASE WHEN api_rate_limits.window_started_at <= ? THEN ? ELSE api_rate_limits.window_started_at END,
        updated_at = excluded.updated_at
      RETURNING count`).bind(key, now, now, cutoff, cutoff, now).first();
    return { allowed: Number(row?.count || 0) <= limit };
  } catch (error) {
    console.error("leadgen_rate_limit_storage_error", JSON.stringify({ scope, error: String(error?.message || "d1_error").slice(0, 120) }));
    return { allowed: false, unavailable: true };
  }
}

/* ------------------------------------------------------------------ *
 * Links
 * ------------------------------------------------------------------ */

export function signupUrl(origin, account, lang) {
  const code = isApprovedPartner(account) && account.referral_code ? account.referral_code : null;
  const params = new URLSearchParams();
  if (code) params.set("referral_code", code);
  params.set("lang", SIGNUP_LANG[lang] || "en");
  return `${origin}/signup.html?${params}`;
}
export function landingUrl(origin, slug, lang = null) {
  return `${origin}${LANDING_PREFIX}${encodeURIComponent(slug)}${lang ? `?lang=${encodeURIComponent(lang)}` : ""}`;
}
/** The agency's own contact: its website, else a mailto to its contact address, else null. */
export function agencyContactHref(branding) {
  const url = safeHttpsUrl(branding?.contact_url);
  if (url) return url;
  return branding?.contact_email && validEmail(branding.contact_email) ? `mailto:${encodeURIComponent(branding.contact_email).replace(/%40/g, "@")}` : null;
}
/** Black or white text, whichever reads better on the brand colour. */
export function textOn(color) {
  const hex = /^#[0-9a-f]{6}$/i.test(String(color || "")) ? color : DEFAULT_BRAND_COLOR;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#111111" : "#ffffff";
}
const brandColor = (branding) => (/^#[0-9a-f]{6}$/i.test(String(branding?.brand_color || "")) ? branding.brand_color : DEFAULT_BRAND_COLOR);
const newNonce = () => b64url(crypto.getRandomValues(new Uint8Array(16)));

/* ------------------------------------------------------------------ *
 * The embed
 * ------------------------------------------------------------------ */

export function embedSnippets(origin, key, lang = "en") {
  const l = LEADGEN_LANGS.includes(lang) ? lang : "en";
  return {
    script: `<script src="${origin}${LEADGEN_WIDGET_PATH}" data-key="${key}" data-lang="${l}" async></script>`,
    iframe: `<iframe src="${origin}${LEADGEN_FRAME_PREFIX}${key}?lang=${l}" title="AI visibility check" style="width:100%;max-width:560px;height:720px;border:0" loading="lazy"></iframe>`,
  };
}

/** The loader the agency's page includes: it only places the iframe and sizes it. */
export function widgetLoaderJs(origin) {
  return `/* Nurevo AI visibility check loader. It adds one iframe from ${origin} and nothing else. */
(function () {
  "use strict";
  var ORIGIN = ${JSON.stringify(origin)};
  var s = document.currentScript;
  if (!s) { var all = document.querySelectorAll('script[data-key][src*="${LEADGEN_WIDGET_PATH}"]:not([data-nurevo-mounted])'); s = all[0]; }
  if (!s || s.getAttribute("data-nurevo-mounted")) return;
  s.setAttribute("data-nurevo-mounted", "1");
  var key = String(s.getAttribute("data-key") || "");
  if (!/^wk_[a-z0-9]{24}$/.test(key)) return;
  var lang = String(s.getAttribute("data-lang") || document.documentElement.lang || "").replace(/[^A-Za-z_-]/g, "").slice(0, 12);
  var f = document.createElement("iframe");
  f.src = ORIGIN + "${LEADGEN_FRAME_PREFIX}" + key + (lang ? "?lang=" + encodeURIComponent(lang) : "");
  f.title = "AI visibility check";
  f.setAttribute("loading", "lazy");
  f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  f.style.cssText = "display:block;width:100%;max-width:560px;height:720px;border:0;overflow:hidden";
  var id = s.getAttribute("data-target"), target = id ? document.getElementById(id) : null;
  if (target) target.appendChild(f); else s.parentNode.insertBefore(f, s.nextSibling);
  window.addEventListener("message", function (e) {
    if (e.origin !== ORIGIN || e.source !== f.contentWindow) return;
    var d = e.data;
    if (!d || d.type !== "nurevo-leadgen:height") return;
    var h = Number(d.height);
    if (h > 200 && h < 4000) f.style.height = Math.ceil(h) + "px";
  });
})();
`;
}

/** frame-ancestors for a widget: our own pages plus the agency's origins. */
export function frameAncestors(origins = []) {
  return ["'self'", ...origins.map(normalizeOrigin).filter(Boolean)].join(" ");
}

const FRAME_CSS = (color, onColor) => `
*{box-sizing:border-box}html,body{margin:0;background:transparent}
body{font:15px/1.6 system-ui,-apple-system,"Segoe UI","Hiragino Sans","Noto Sans JP",sans-serif;color:#1d1b26}
.w{border:1px solid #e4e1ec;border-radius:14px;background:#fff;padding:20px;max-width:560px}
.h{display:flex;align-items:center;gap:10px;margin-bottom:6px}.h img{max-height:36px;max-width:140px;object-fit:contain}
.h b{font-size:14px;color:#4a4458}
h1{font-size:20px;line-height:1.35;margin:6px 0 4px}p{margin:6px 0}.i{color:#4a4458;font-size:14px}
label{display:block;font-size:13px;font-weight:600;margin:12px 0 0}
input[type=text],input[type=url],input[type=email]{width:100%;font:inherit;padding:10px 12px;border:1px solid #cfcadb;border-radius:8px;margin-top:4px}
.c{display:flex;gap:8px;align-items:flex-start;font-weight:400;font-size:12.5px;line-height:1.55;color:#3d3650;background:#faf8ff;border-radius:8px;padding:10px}
.c input{margin-top:3px;flex:none}
.hp{position:absolute!important;left:-10000px!important;width:1px;height:1px;overflow:hidden}
button,.b{display:inline-block;width:100%;text-align:center;font:inherit;font-weight:700;padding:12px 14px;border:0;border-radius:10px;background:${color};color:${onColor};cursor:pointer;text-decoration:none;margin-top:14px}
button:disabled{opacity:.6;cursor:default}.b2{background:#fff;color:${color};border:1.5px solid ${color}}
.m{min-height:1.4em;font-size:13px;color:#a12a2a;margin-top:8px}.s{font-size:13px;color:#4a4458}
.r[hidden],form[hidden]{display:none}.score{font-size:34px;font-weight:800;color:${color};margin:8px 0 0}
.band{font-weight:600}.iss{margin:6px 0 0;padding-left:18px;font-size:13.5px}.iss li{margin:4px 0}
.n{font-size:12.5px;color:#5d5570;background:#faf8ff;border-radius:8px;padding:10px;margin-top:12px}
.f{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:11px;color:#7a7389;margin-top:14px}.f a{color:#5d5570}
`;

/**
 * The widget page inside the iframe. Text from the agency and the visitor is
 * escaped (server) or set with textContent (client); the script is inline with
 * a per-response nonce and talks only to this origin.
 */
export function renderFrameHtml({ origin, agency, lang, token, key, source = "widget", nonce }) {
  const c = leadgenCopy(lang);
  const b = agency.branding;
  const name = singleLine(b.display_name);
  const color = brandColor(b);
  const logo = logoSrc(b, origin);
  const contact = agencyContactHref(b);
  const s = agency.settings;
  const plugin = s.landing_enabled && s.slug ? landingUrl(origin, s.slug, lang) : signupUrl(origin, agency.account, lang);
  const cfg = {
    key, token, lang, source,
    copy: {
      scoreOf: c.scoreOf, band_green: c.band_green, band_yellow: c.band_yellow, band_red: c.band_red, issues: c.issues,
      noScore: fill(c.noScore, { agency: name }), ask: fill(c.ask, { agency: name }), askNote: fill(c.askNote, { agency: name }),
      plugin: fill(c.plugin, { agency: name }), thanks: fill(c.thanks, { agency: name }), checking: c.checking,
      errInvalid: c.errInvalid, errUrl: c.errUrl, errConsent: c.errConsent, errRate: c.errRate, errUnavailable: c.errUnavailable, errGeneric: c.errGeneric,
    },
    links: { contact, plugin },
  };
  const consent = consentHtml(lang, name, s.privacy_url);
  return `<!doctype html><html lang="${LEADGEN_LANG_TAG[lang] || "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(c.title)} | ${escapeHtml(name)}</title>
<style nonce="${nonce}">${FRAME_CSS(color, textOn(color))}</style></head><body><div class="w">
<div class="h">${logo ? `<img src="${escapeHtml(logo)}" alt="">` : ""}<b>${escapeHtml(name)}</b></div>
<h1>${escapeHtml(c.title)}</h1><p class="i">${escapeHtml(c.intro)}</p>
<form id="f" novalidate autocomplete="on">
<label for="site_url">${escapeHtml(c.url)}</label><input id="site_url" name="site_url" type="url" inputmode="url" maxlength="500" placeholder="https://" required>
<label for="full_name">${escapeHtml(c.name)}</label><input id="full_name" name="full_name" type="text" maxlength="100" autocomplete="name" required>
<label for="email">${escapeHtml(c.email)}</label><input id="email" name="email" type="email" maxlength="254" autocomplete="email" required>
<div class="hp" aria-hidden="true"><label for="hp_comment">Leave this empty</label><input id="hp_comment" name="hp_comment" type="text" tabindex="-1" autocomplete="off"></div>
<label class="c"><input id="consent" name="consent" type="checkbox" required><span id="consent_text">${consent}</span></label>
<button id="go" type="submit">${escapeHtml(c.submit)}</button><p class="m" id="msg" role="status" aria-live="polite"></p>
</form>
<div class="r" id="result" hidden aria-live="polite"></div>
<div class="f"><span>${s.privacy_url ? `<a href="${escapeHtml(s.privacy_url)}" target="_blank" rel="noopener">${escapeHtml(fill(c.agencyPrivacy, { agency: name }))}</a> · ` : ""}<a href="${PRIVACY_URL}" target="_blank" rel="noopener">${escapeHtml(c.privacy)}</a></span><span>${escapeHtml(c.poweredBy)}</span></div>
</div>
<script id="cfg" type="application/json">${scriptJson(cfg)}</script>
<script nonce="${nonce}">${FRAME_JS}</script></body></html>`;
}

const FRAME_JS = `(function () {
  "use strict";
  var cfg = JSON.parse(document.getElementById("cfg").textContent);
  var c = cfg.copy, form = document.getElementById("f"), msg = document.getElementById("msg"), go = document.getElementById("go"), out = document.getElementById("result");
  function height() { try { parent.postMessage({ type: "nurevo-leadgen:height", height: document.documentElement.scrollHeight }, "*"); } catch (e) {} }
  if (window.ResizeObserver) new ResizeObserver(height).observe(document.body);
  window.addEventListener("load", height); height();
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = String(text); return n; }
  function link(href, cls, text) { var a = el("a", cls, text); a.href = href; a.target = "_blank"; a.rel = "noopener"; return a; }
  function show(d) {
    form.hidden = true; out.textContent = "";
    if (d.score != null) {
      out.appendChild(el("p", "score", c.scoreOf.replace("{score}", String(Math.round(Number(d.score))))));
      var band = c["band_" + d.band]; if (band) out.appendChild(el("p", "band", band));
      if (d.issues && d.issues.length) {
        out.appendChild(el("p", "s", c.issues));
        var ul = el("ul", "iss");
        d.issues.forEach(function (i) { var li = el("li"); li.appendChild(el("b", null, i.label)); if (i.message) li.appendChild(document.createTextNode(" " + i.message)); ul.appendChild(li); });
        out.appendChild(ul);
      }
    } else out.appendChild(el("p", "band", c.noScore));
    if (cfg.links.contact) out.appendChild(link(cfg.links.contact, "b", c.ask));
    out.appendChild(el("p", "n", c.askNote));
    if (cfg.links.plugin) out.appendChild(link(cfg.links.plugin, "b b2", c.plugin));
    out.appendChild(el("p", "s", c.thanks));
    out.hidden = false; height();
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault(); msg.textContent = "";
    var get = function (name) { var n = form.elements.namedItem(name); return n ? n.value : ""; };
    if (!document.getElementById("consent").checked) { msg.textContent = c.errConsent; return; }
    go.disabled = true; msg.textContent = c.checking; msg.className = "s";
    fetch("/api/leadgen/submit", { method: "POST", credentials: "omit", headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: cfg.key, token: cfg.token, lang: cfg.lang, site_url: get("site_url"), name: get("full_name"), email: get("email"), consent: true, hp_comment: get("hp_comment") }) })
      .then(function (res) { return res.json().catch(function () { return {}; }).then(function (d) { return { res: res, d: d }; }); })
      .then(function (r) {
        msg.className = "m";
        if (r.res.ok && r.d.ok) { msg.textContent = ""; show(r.d); return; }
        var f = r.d.fields || [];
        msg.textContent = r.res.status === 429 ? c.errRate : f.indexOf("consent") >= 0 ? c.errConsent : f.indexOf("site_url") >= 0 ? c.errUrl : f.length ? c.errInvalid : r.res.status === 404 || r.res.status === 503 ? c.errUnavailable : c.errGeneric;
        go.disabled = false; height();
      })
      .catch(function () { msg.className = "m"; msg.textContent = c.errGeneric; go.disabled = false; height(); });
  });
})();`;

function simplePage(status, lang, text) {
  return new Response(`<!doctype html><html lang="${LEADGEN_LANG_TAG[lang] || "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Nurevo</title></head><body style="font:15px system-ui;color:#4a4458;padding:20px">${escapeHtml(text)}</body></html>`, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "x-robots-tag": "noindex",
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'" },
  });
}

/* ------------------------------------------------------------------ *
 * Landing page
 * ------------------------------------------------------------------ */

export function renderLandingHtml({ origin, agency, lang, nonce }) {
  const c = leadgenCopy(lang);
  const b = agency.branding;
  const s = agency.settings;
  const name = singleLine(b.display_name);
  const color = brandColor(b);
  const on = textOn(color);
  const logo = logoSrc(b, origin);
  const vars = { agency: name };
  const title = fill(c.lpTitle, vars);
  const description = fill(c.lpDescription, vars);
  const canonical = landingUrl(origin, s.slug, lang === "en" ? null : lang);
  const contactUrl = safeHttpsUrl(b.contact_url);
  const contactEmail = b.contact_email && validEmail(b.contact_email) ? b.contact_email : null;
  const frame = s.widget_enabled ? `${origin}${LEADGEN_FRAME_PREFIX}${s.widget_key}?lang=${lang}&via=landing` : null;
  const langLinks = LEADGEN_LANGS.map((l) => (l === lang ? `<b>${escapeHtml(LANG_NAMES[l])}</b>` : `<a href="${escapeHtml(landingUrl(origin, s.slug, l))}" hreflang="${LEADGEN_LANG_TAG[l]}" lang="${LEADGEN_LANG_TAG[l]}">${escapeHtml(LANG_NAMES[l])}</a>`)).join(" · ");
  const alternates = LEADGEN_LANGS.map((l) => `<link rel="alternate" hreflang="${LEADGEN_LANG_TAG[l]}" href="${escapeHtml(landingUrl(origin, s.slug, l === "en" ? null : l))}">`).join("")
    + `<link rel="alternate" hreflang="x-default" href="${escapeHtml(landingUrl(origin, s.slug))}">`;
  const intro = s.landing_intro ? `<blockquote>${s.landing_intro.split("\n").map(escapeHtml).join("<br>")}</blockquote>` : "";
  return `<!doctype html><html lang="${LEADGEN_LANG_TAG[lang] || "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} | Nurevo</title><meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="${s.landing_noindex ? "noindex,nofollow" : "index,follow"}"><link rel="canonical" href="${escapeHtml(canonical)}">${alternates}
<meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:image" content="${escapeHtml(logo && logo.startsWith("https://") ? logo : `${origin}/ogp.png`)}"><meta property="og:site_name" content="Nurevo">
<meta name="twitter:card" content="summary"><meta name="theme-color" content="${color}">
<style nonce="${nonce}">
*{box-sizing:border-box}body{margin:0;font:16px/1.7 system-ui,-apple-system,"Segoe UI","Hiragino Sans","Noto Sans JP",sans-serif;color:#1d1b26;background:#f7f6fb}
header,main,footer{max-width:880px;margin:0 auto;padding:0 20px}header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-top:18px}
.brand{display:flex;align-items:center;gap:12px;font-weight:700}.brand img{max-height:44px;max-width:180px;object-fit:contain}
.langs{font-size:12.5px;color:#5d5570}.langs a{color:#5d5570}
.hero{background:#fff;border-radius:18px;padding:32px 28px;margin:20px 0;border-top:6px solid ${color}}
h1{font-size:30px;line-height:1.3;margin:0 0 12px}h2{font-size:21px;margin:0 0 10px}
blockquote{margin:16px 0;padding:12px 16px;border-left:4px solid ${color};background:#faf8ff;border-radius:6px}
ul.pts{padding-left:20px}ul.pts li{margin:8px 0}
.cta{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}.btn{display:inline-block;padding:13px 20px;border-radius:10px;font-weight:700;text-decoration:none;background:${color};color:${on}}
.btn.alt{background:#fff;color:${color};border:2px solid ${color}}.note{font-size:13.5px;color:#5d5570}
section.card{background:#fff;border-radius:18px;padding:26px 28px;margin:20px 0}iframe{display:block;width:100%;max-width:560px;height:720px;border:0}
.contact a{color:${color === "#ffffff" ? "#1d1b26" : color}}footer{font-size:12px;color:#7a7389;padding-bottom:30px}footer a{color:#5d5570}
@media (max-width:560px){h1{font-size:24px}.hero,section.card{padding:22px 18px}}
</style></head><body>
<header><div class="brand">${logo ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(name)}">` : ""}<span>${escapeHtml(name)}</span></div><nav class="langs" aria-label="${escapeHtml(c.lpLanguage)}">${langLinks}</nav></header>
<main>
<section class="hero"><p class="note">${escapeHtml(title)}</p><h1>${escapeHtml(c.lpHeadline)}</h1><p>${escapeHtml(fill(c.lpLead, vars))}</p>${intro}
<ul class="pts"><li>${escapeHtml(c.lpPoint1)}</li><li>${escapeHtml(c.lpPoint2)}</li><li>${escapeHtml(c.lpPoint3)}</li></ul>
<div class="cta"><a class="btn" id="install" href="${PLUGIN_URL}" rel="noopener">${escapeHtml(c.lpInstall)}</a><a class="btn alt" id="signup" href="${escapeHtml(signupUrl(origin, agency.account, lang))}">${escapeHtml(c.lpSignup)}</a></div>
<p class="note">${escapeHtml(c.lpSignupNote)}</p></section>
${frame ? `<section class="card" id="check"><h2>${escapeHtml(c.lpCheck)}</h2><iframe id="nurevo-check" src="${escapeHtml(frame)}" title="${escapeHtml(c.title)}" loading="lazy"></iframe></section>` : ""}
${contactUrl || contactEmail || b.footer_text ? `<section class="card contact" id="contact"><h2>${escapeHtml(fill(c.lpContact, vars))}</h2>
${contactUrl ? `<p>${escapeHtml(c.lpWebsite)}: <a href="${escapeHtml(contactUrl)}" rel="noopener">${escapeHtml(contactUrl)}</a></p>` : ""}
${contactEmail ? `<p><a href="mailto:${escapeHtml(contactEmail)}">${escapeHtml(contactEmail)}</a></p>` : ""}
${b.footer_text ? `<p class="note">${String(b.footer_text).split("\n").map(escapeHtml).join("<br>")}</p>` : ""}</section>` : ""}
</main>
<footer><p>${escapeHtml(c.poweredBy)} · ${s.privacy_url ? `<a href="${escapeHtml(s.privacy_url)}" rel="noopener">${escapeHtml(fill(c.agencyPrivacy, vars))}</a> · ` : ""}<a href="${PRIVACY_URL}">${escapeHtml(c.privacy)}</a></p></footer>
${frame ? `<script nonce="${nonce}">(function(){var f=document.getElementById("nurevo-check"),O=location.origin;window.addEventListener("message",function(e){if(e.origin!==O||e.source!==f.contentWindow)return;var d=e.data,h=d&&d.type==="nurevo-leadgen:height"?Number(d.height):0;if(h>200&&h<4000)f.style.height=Math.ceil(h)+"px";});})();</script>` : ""}
</body></html>`;
}

/* ------------------------------------------------------------------ *
 * The new-lead email to the agency
 * ------------------------------------------------------------------ */

export function leadNotificationEmail({ lang, agencyName, lead, origin = DASHBOARD_ORIGIN }) {
  const c = leadgenCopy(lang);
  let host = lead.site_url;
  try { host = new URL(lead.site_url).hostname; } catch { /* keep the URL */ }
  const score = Number.isFinite(lead.score) ? `${lead.score}/100` : c.mailScoreNone;
  const rows = [[c.mailSite, lead.site_url], [c.mailName, lead.name], [c.mailEmail, lead.email], [c.mailScore, score],
    [c.mailWhen, new Date(lead.created_at || Date.now()).toISOString()], [c.mailPage, lead.page_origin || "—"], [c.mailConsent, lead.consent_text]];
  const leadsUrl = `${origin}/dashboard#partner`;
  const intro = fill(c.mailIntro, { agency: singleLine(agencyName) });
  const footer = fill(c.mailReply, { url: leadsUrl });
  return {
    subject: singleLine(fill(c.mailSubject, { site: host })).slice(0, 200),
    text: `${intro}\n\n${rows.map(([k, v]) => `${k}: ${singleLine(v)}`).join("\n")}\n\n${footer}\n`,
    html: `<!doctype html><html><body style="font:14px/1.6 system-ui,sans-serif;color:#1d1b26"><p>${escapeHtml(intro)}</p><table cellpadding="6" style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><th align="left" style="color:#5d5570;font-weight:600;vertical-align:top">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join("")}</table><p style="color:#5d5570">${escapeHtml(footer)}</p></body></html>`,
  };
}

/**
 * Where new-lead emails go: the branding contact address once it has been
 * verified (and is still the address in the branding), else the member's own
 * sign-in address, which the magic-link sign-in already proved.
 */
export function leadNotificationAddress(agency) {
  const contact = String(agency?.branding?.contact_email || "").trim().toLowerCase();
  const verified = String(agency?.settings?.contact_verified_email || "").trim().toLowerCase();
  if (contact && validEmail(contact) && verified && contact === verified) return contact;
  return validEmail(agency?.account?.email) ? agency.account.email : null;
}

async function notifyAgency(env, { agency, lead, leadId, fetchImpl, memberLocale }) {
  const to = leadNotificationAddress(agency);
  if (!to || !mailConfigured(env)) return { ok: false, code: "mail_not_configured" };
  let lang = "en";
  try { lang = leadgenLang(memberLocale ? await memberLocale(env, { id: agency.account.member_id, email: agency.account.email }) : "en"); } catch { lang = "en"; }
  const message = leadNotificationEmail({ lang, agencyName: agency.branding.display_name, lead, origin: String(env.PUBLIC_ORIGIN || DASHBOARD_ORIGIN).replace(/\/+$/, "") });
  const result = await sendResendEmail(env, { to, ...message, replyTo: lead.email, idempotencyKey: `nurevo-lead-${leadId}`, ...(fetchImpl ? { fetchImpl } : {}) });
  if (result.ok) {
    try { await env.DB.prepare("UPDATE agency_leads SET notified_at=? WHERE id=?").bind(Date.now(), leadId).run(); } catch { /* the email went; the mark is a nicety */ }
  } else console.error("agency_lead_notify_failed", JSON.stringify({ account: agency.account.id, lead: leadId, code: result.code }));
  return result;
}

/* ------------------------------------------------------------------ *
 * Verifying the contact address (before new-lead emails go to it)
 * ------------------------------------------------------------------ */

export const leadgenVerifyCopy = (lang) => ({ ...LEADGEN_VERIFY_COPY.en, ...(LEADGEN_VERIFY_COPY[LEADGEN_LANGS.includes(lang) ? lang : "en"] || {}) });

async function contactMac(secret, accountId, email, expires) {
  const key = await crypto.subtle.importKey("raw", utf8(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, utf8(`nurevo-leadgen-contact-v1:${accountId}:${String(email).toLowerCase()}:${expires}`)));
}

export async function contactVerifyToken(env, accountId, email, expires) {
  const secret = formSecret(env);
  if (!secret || !accountId || !validEmail(email) || !Number.isFinite(expires)) return null;
  const address = String(email).trim().toLowerCase();
  return [b64url(utf8(String(accountId))), b64url(utf8(address)), String(Math.floor(expires)), b64url(await contactMac(secret, accountId, address, Math.floor(expires)))].join(".");
}

/** { accountId, email, expires } for a valid, unexpired token, else null. */
export async function verifyContactToken(env, token, now = Date.now()) {
  const secret = formSecret(env);
  const [accountPart, emailPart, expPart, macPart, extra] = String(token || "").split(".");
  if (!secret || !accountPart || !emailPart || !/^\d{1,15}$/.test(expPart || "") || !macPart || extra !== undefined) return null;
  try {
    const accountId = new TextDecoder().decode(fromB64url(accountPart));
    const email = new TextDecoder().decode(fromB64url(emailPart));
    const expires = Number(expPart);
    const expected = await contactMac(secret, accountId, email, expires);
    const given = fromB64url(macPart);
    if (given.length !== expected.length) return null;
    let diff = 0;
    for (let i = 0; i < given.length; i += 1) diff |= given[i] ^ expected[i];
    if (diff !== 0 || !validEmail(email) || !/^\d+$/.test(accountId) || expires <= now) return null;
    return { accountId: Number(accountId), email, expires };
  } catch {
    return null;
  }
}

export function contactVerifyEmail({ lang, agency, email, url, expires }) {
  const c = leadgenVerifyCopy(lang);
  const date = new Date(expires).toISOString().slice(0, 10);
  const subject = singleLine(fill(c.verifySubject, { email })).slice(0, 200);
  const lines = [fill(c.verifyIntro, { agency }), "", c.verifyAsk, "", `${c.verifyButton}: ${url}`, fill(c.verifyExpires, { date })];
  return {
    subject,
    text: `${lines.join("\n")}\n`,
    html: `<!doctype html><html><body style="font:14px/1.65 system-ui,sans-serif;color:#1d1b26;max-width:560px;margin:0 auto;padding:16px"><p>${escapeHtml(fill(c.verifyIntro, { agency }))}</p><p>${escapeHtml(c.verifyAsk)}</p>`
      + `<p><a href="${escapeHtml(url)}" style="display:inline-block;background:#6f4df6;color:#fff;text-decoration:none;border-radius:8px;padding:10px 16px;font-weight:700">${escapeHtml(c.verifyButton)}</a></p>`
      + `<p style="font-size:12px;color:#6b6b78">${escapeHtml(fill(c.verifyExpires, { date }))}</p></body></html>`,
  };
}

/**
 * Send the verification email for the account's current contact address.
 * { ok, status, error? } - at most LEADGEN_LIMITS.verify a day per account.
 */
export async function sendContactVerification(env, account, { lang = "en", now = Date.now(), fetchImpl } = {}) {
  const branding = await loadBranding(env, account.id);
  const email = String(branding?.contact_email || "").trim().toLowerCase();
  if (!email || !validEmail(email)) return { ok: false, status: 400, error: "no_contact_email" };
  const settings = await loadLeadgen(env, account.id);
  if (!settings) return { ok: false, status: 409, error: "save_settings_first" };
  if (settings.contact_verified_email === email) return { ok: true, status: 200, already: true };
  if (!mailConfigured(env) || !formSecret(env)) return { ok: false, status: 503, error: "mail_not_configured" };
  const limit = await leadgenRateLimit(env, "leadgen-verify", account.id, LEADGEN_LIMITS.verify, now);
  if (!limit.allowed) return { ok: false, status: limit.unavailable ? 503 : 429, error: limit.unavailable ? "rate_limit_unavailable" : "rate_limited" };
  const expires = now + CONTACT_VERIFY_TTL_MS;
  const token = await contactVerifyToken(env, account.id, email, expires);
  const origin = String(env.PUBLIC_ORIGIN || DASHBOARD_ORIGIN).replace(/\/+$/, "");
  const l = LEADGEN_LANGS.includes(lang) ? lang : "en";
  const url = `${origin}${LEADGEN_VERIFY_PATH}?t=${encodeURIComponent(token)}&l=${l}`;
  const message = contactVerifyEmail({ lang: l, agency: singleLine(branding.display_name), email, url, expires });
  const result = await sendResendEmail(env, { to: email, ...message, idempotencyKey: `nurevo-leadgen-verify-${account.id}-${now}`, ...(fetchImpl ? { fetchImpl } : {}) });
  if (!result.ok) return { ok: false, status: 502, error: "send_failed" };
  await env.DB.prepare("UPDATE agency_leadgen SET contact_verify_sent_at=? WHERE account_id=?").bind(now, account.id).run();
  return { ok: true, status: 200 };
}

function verifyPage(lang, status, body, { action = "", email = "", agency = "" } = {}) {
  const c = leadgenVerifyCopy(lang);
  const message = body === "done" ? fill(c.verifyDone, { agency }) : body === "invalid" ? c.verifyInvalid : fill(c.verifyPrompt, { email, agency });
  const form = body === "prompt" ? `<form method="post" action="${escapeHtml(action)}"><button type="submit">${escapeHtml(c.verifyButton)}</button></form>` : "";
  return new Response(`<!doctype html><html lang="${LEADGEN_LANG_TAG[lang] || "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(c.verifyTitle)}</title><style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:3rem auto;padding:0 16px;line-height:1.6}button{font:inherit;padding:.5rem 1rem}</style></head><body><h1>${escapeHtml(c.verifyTitle)}</h1><p>${escapeHtml(message)}</p>${form}</body></html>`, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex", "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'" },
  });
}

/**
 * GET shows the question (mail scanners open links, so GET records nothing);
 * POST verifies the address, if it is still the account's contact address.
 */
export async function handleContactVerify(request, env, { now = Date.now() } = {}) {
  const url = new URL(request.url);
  const asked = String(url.searchParams.get("l") || "");
  const lang = LEADGEN_LANGS.includes(asked) ? asked : "en";
  if (!["GET", "POST"].includes(request.method)) return new Response("method_not_allowed", { status: 405, headers: { allow: "GET, POST" } });
  const verified = await verifyContactToken(env, url.searchParams.get("t"), now);
  if (!verified) return verifyPage(lang, 400, "invalid");
  let branding = null;
  try { branding = await loadBranding(env, verified.accountId); } catch (error) { if (!isMissing(error)) throw error; }
  if (!branding || String(branding.contact_email || "").toLowerCase() !== verified.email) return verifyPage(lang, 400, "invalid");
  const agency = singleLine(branding.display_name);
  if (request.method === "GET") return verifyPage(lang, 200, "prompt", { action: `${url.pathname}${url.search}`, email: verified.email, agency });
  let result;
  try {
    result = await env.DB.prepare("UPDATE agency_leadgen SET contact_verified_email=?, contact_verified_at=? WHERE account_id=?").bind(verified.email, now, verified.accountId).run();
  } catch (error) {
    if (isMissing(error)) return verifyPage(lang, 503, "invalid");
    throw error;
  }
  if (changes(result) !== 1) return verifyPage(lang, 400, "invalid");
  console.log("agency_contact_verified", JSON.stringify({ account: verified.accountId }));
  return verifyPage(lang, 200, "done", { agency });
}

/* ------------------------------------------------------------------ *
 * Routes
 * ------------------------------------------------------------------ */

const jsonResponse = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
});

async function readSmallJson(request, max = 8192) {
  const text = await request.text();
  if (text.length > max) return null;
  try { const value = JSON.parse(text); return value && typeof value === "object" && !Array.isArray(value) ? value : null; } catch { return null; }
}

/** The origin of the page that embeds the frame, from Referer, or null. */
function refererOrigin(request) {
  try { return new URL(request.headers.get("referer") || "").origin; } catch { return null; }
}

function topIssues(checks, lang) {
  const order = { BAD: 0, WARN: 1 };
  return localizeAeoChecks(checks || [], CHECK_LANG[lang] || "en")
    .filter((check) => ["BAD", "WARN"].includes(String(check?.status || "").toUpperCase()))
    .sort((a, b) => order[String(a.status).toUpperCase()] - order[String(b.status).toUpperCase()])
    .slice(0, 3)
    .map((check) => ({ label: singleLine(check.label).slice(0, 120), message: singleLine(check.message).slice(0, 300) }));
}

/**
 * The public routes: the loader, the frame, the submit and the landing page.
 * deps: { scoreUrl(rawUrl) -> { score, band, checks } (throws AeoScoreError
 * for a bad URL), clientIp(request), memberLocale, fetchImpl, now }.
 * Returns a Response, or null when the path is not one of these.
 */
export async function handleLeadgenPublic(request, env, ctx, deps = {}) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const origin = url.origin;
  const now = deps.now ? deps.now() : Date.now();

  if (path === LEADGEN_WIDGET_PATH && method === "GET") {
    return new Response(widgetLoaderJs(origin), { status: 200, headers: {
      "content-type": "application/javascript; charset=utf-8", "cache-control": "public, max-age=3600",
      "x-content-type-options": "nosniff", "access-control-allow-origin": "*", "cross-origin-resource-policy": "cross-origin",
    } });
  }

  if (path.startsWith(LEADGEN_FRAME_PREFIX) && method === "GET") {
    const lang = leadgenLang(url.searchParams.get("lang"), request.headers.get("accept-language"));
    const c = leadgenCopy(lang);
    const key = path.slice(LEADGEN_FRAME_PREFIX.length);
    if (!isWidgetKey(key)) return simplePage(404, lang, c.errUnavailable);
    const agency = await loadPublicAgency(env, { key });
    if (!agency || !agency.settings.widget_enabled || !agency.settings.privacy_url) return simplePage(404, lang, c.errUnavailable);
    const source = url.searchParams.get("via") === "landing" ? "landing" : "widget";
    // A browser that sends the embedding page tells us where it is. Anything
    // but our own pages and the agency's list is refused outright; the
    // frame-ancestors header below enforces the same list in the browser.
    const parent = refererOrigin(request);
    if (parent && parent !== origin && !agency.settings.allowed_origins.includes(parent)) return simplePage(403, lang, c.errUnavailable);
    const token = await issueFormToken(env, { key, origin: parent, source, now });
    if (!token) return simplePage(503, lang, c.errUnavailable);
    const nonce = newNonce();
    return new Response(renderFrameHtml({ origin, agency, lang, token, key, source, nonce }), { status: 200, headers: {
      "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "x-robots-tag": "noindex",
      "referrer-policy": "strict-origin-when-cross-origin",
      "content-security-policy": `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; img-src 'self' https:; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors ${frameAncestors(agency.settings.allowed_origins)}`,
    } });
  }

  if (path === LEADGEN_SUBMIT_PATH && method === "POST") return submitLead(request, env, ctx, { ...deps, origin, now });
  if (path === LEADGEN_VERIFY_PATH) return handleContactVerify(request, env, { now });

  const landing = path.match(/^\/p\/([^/]+)\/?$/);
  if (landing && (method === "GET" || method === "HEAD")) {
    const lang = leadgenLang(url.searchParams.get("lang"), request.headers.get("accept-language"));
    let slug = "";
    try { slug = decodeURIComponent(landing[1]).toLowerCase(); } catch { slug = ""; }
    const agency = slugProblem(slug) === "slug_invalid" ? null : await loadPublicAgency(env, { slug });
    if (!agency || !agency.settings.landing_enabled) return simplePage(404, lang, "Not found");
    const nonce = newNonce();
    return new Response(method === "HEAD" ? null : renderLandingHtml({ origin, agency, lang, nonce }), { status: 200, headers: {
      "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300", vary: "accept-language",
      "x-content-type-options": "nosniff", "referrer-policy": "strict-origin-when-cross-origin",
      ...(agency.settings.landing_noindex ? { "x-robots-tag": "noindex, nofollow" } : {}),
      "content-security-policy": `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; img-src 'self' https:; frame-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
    } });
  }
  return null;
}

async function submitLead(request, env, ctx, deps) {
  const { origin, now } = deps;
  if (!await leadgenAvailable(env)) return jsonResponse({ error: "unavailable" }, 503);
  // Only our own frame posts here; a page elsewhere cannot (and the global
  // origin gate refuses other origins before this).
  const from = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (from !== origin || (site && site !== "same-origin")) return jsonResponse({ error: "origin_not_allowed" }, 403);
  const limited = (limit) => jsonResponse({ error: limit.unavailable ? "rate_limit_unavailable" : "rate_limited" }, limit.unavailable ? 503 : 429, limit.unavailable ? {} : { "retry-after": "600" });

  // 1. A cheap per-IP limit on every request, before the body is even read.
  const ip = deps.clientIp ? deps.clientIp(request) : String(request.headers.get("cf-connecting-ip") || "unknown");
  const any = await leadgenRateLimit(env, "leadgen-ip-any", ip, LEADGEN_LIMITS.ipAny, now);
  if (!any.allowed) return limited(any);

  const body = await readSmallJson(request);
  if (!body) return jsonResponse({ error: "invalid_json" }, 400);
  const key = String(body.key || "");
  if (!isWidgetKey(key)) return jsonResponse({ error: "unavailable" }, 404);
  const agency = await loadPublicAgency(env, { key });
  if (!agency || !agency.settings.widget_enabled || !agency.settings.privacy_url) return jsonResponse({ error: "unavailable" }, 404);

  // 2. Bots: a filled honeypot, or a form sent faster than a person could, or
  // a token that is forged, expired or for another widget. One answer for
  // all, and none of it counts against the agency's quota below.
  if (String(body.hp_comment ?? "") !== "") { console.warn("agency_lead_rejected", JSON.stringify({ account: agency.account.id, reason: "honeypot" })); return jsonResponse({ error: "rejected" }, 422); }
  const token = await verifyFormToken(env, body.token, { key, now });
  if (!token.ok) { console.warn("agency_lead_rejected", JSON.stringify({ account: agency.account.id, reason: token.reason })); return jsonResponse({ error: "rejected" }, 422); }

  const lang = leadgenLang(body.lang);
  const checked = validateLead(body);
  if (!checked.ok) return jsonResponse({ error: "invalid_lead", fields: checked.errors }, 400);

  // One lead per rendering of the form: a replayed token is refused here,
  // before it could count.
  const nonceKey = env.WEBMCP_KV && token.nonce ? `leadgen-nonce:${token.nonce}` : null;
  if (nonceKey && await env.WEBMCP_KV.get(nonceKey)) return jsonResponse({ error: "rejected" }, 422);

  // 3. Only a valid submission counts: per IP, then per widget key (daily).
  for (const [scope, value, limits] of [["leadgen-ip", ip, LEADGEN_LIMITS.ip], ["leadgen-key", key, LEADGEN_LIMITS.key]]) {
    const limit = await leadgenRateLimit(env, scope, value, limits, now);
    if (!limit.allowed) return limited(limit);
  }
  if (nonceKey) await env.WEBMCP_KV.put(nonceKey, "1", { expirationTtl: Math.ceil(MAX_FORM_AGE_MS / 1000) + 60 });

  let diagnosis = null;
  try {
    // Scored through a cache scoped to this agency, never the shared one.
    diagnosis = deps.scoreUrl ? await deps.scoreUrl(checked.value.site_url, { namespace: `leadgen:${agency.account.id}` }) : null;
  } catch (error) {
    if (Number(error?.status) === 400) return jsonResponse({ error: "invalid_lead", fields: ["site_url"] }, 400);
    // Unreachable, blocked, too large: the lead still reaches the agency.
    diagnosis = null;
  }
  const name = singleLine(agency.branding.display_name);
  const lead = {
    widget_key: key, source: token.source, page_origin: token.source === "landing" ? origin : token.origin,
    site_url: checked.value.site_url, name: checked.value.name, email: checked.value.email,
    score: Number.isFinite(Number(diagnosis?.score)) ? Number(diagnosis.score) : null,
    band: ["green", "yellow", "red"].includes(diagnosis?.band) ? diagnosis.band : null,
    locale: lang, consent_text: consentText(lang, name, agency.settings.privacy_url), created_at: now,
  };
  let leadId;
  try { leadId = await storeLead(env, agency.account.id, lead, { now }); } catch (error) {
    if (isMissing(error)) return jsonResponse({ error: "unavailable" }, 503);
    throw error;
  }
  console.log("agency_lead_stored", JSON.stringify({ account: agency.account.id, lead: leadId, source: lead.source, scored: lead.score != null }));
  if (agency.settings.notify_email) {
    const task = notifyAgency(env, { agency, lead, leadId, fetchImpl: deps.fetchImpl, memberLocale: deps.memberLocale }).catch((error) => console.error("agency_lead_notify_error", String(error?.message || error).slice(0, 120)));
    if (ctx?.waitUntil) ctx.waitUntil(task); else await task;
  }
  return jsonResponse({ ok: true, score: lead.score, band: lead.band, issues: diagnosis ? topIssues(diagnosis.checks, lang) : [] });
}

/**
 * The dashboard routes (the signed-in member's own account). CSRF is checked
 * by the global gate before this runs. deps: { requireMember, ensureAccount,
 * issueReferralCode }.
 *   GET  /api/agency/leadgen            settings, embed code, landing URL
 *   PUT  /api/agency/leadgen            save settings (approved partners)
 *   POST /api/agency/leadgen/rotate-key new widget key
 *   GET  /api/agency/leads              the leads, newest first
 *   GET  /api/agency/leads.csv          all leads as CSV
 *   DELETE /api/agency/leads/:id        delete one lead
 */
export async function handleLeadgenDashboard(request, env, deps) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const settingsRoute = path === "/api/agency/leadgen" && (method === "GET" || method === "PUT");
  const rotateRoute = path === "/api/agency/leadgen/rotate-key" && method === "POST";
  const listRoute = path === "/api/agency/leads" && method === "GET";
  const csvRoute = path === "/api/agency/leads.csv" && method === "GET";
  const deleteMatch = method === "DELETE" ? path.match(/^\/api\/agency\/leads\/(\d+)$/) : null;
  const verifyRoute = path === "/api/agency/leadgen/verify-email" && method === "POST";
  if (!settingsRoute && !rotateRoute && !listRoute && !csvRoute && !deleteMatch && !verifyRoute) return null;

  const member = await deps.requireMember(request, env);
  if (!member) return jsonResponse({ error: "unauthorized" }, 401);
  let account = null;
  try { account = await deps.ensureAccount(env, member.member_id); } catch { account = null; }
  if (!account || !await leadgenAvailable(env)) return jsonResponse({ available: false, reason: "migration_pending" }, method === "GET" && !csvRoute ? 200 : 503);
  const canEdit = member.role !== "viewer";
  const origin = url.origin;

  if (listRoute) {
    const rows = await listLeads(env, account.id, { limit: url.searchParams.get("limit") || 100, before: url.searchParams.get("before") });
    return jsonResponse({ available: true, leads: rows, next_before: rows.length ? rows[rows.length - 1].id : null, total: await countLeads(env, account.id) });
  }
  if (csvRoute) {
    const rows = await listLeads(env, account.id, { limit: 5000 });
    console.log("agency_leads_exported", JSON.stringify({ account: account.id, rows: rows.length }));
    return new Response(leadsCsv(rows), { status: 200, headers: {
      "content-type": "text/csv; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff",
      "content-disposition": `attachment; filename="nurevo-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    } });
  }
  if (deleteMatch) {
    if (!canEdit) return jsonResponse({ error: "forbidden" }, 403);
    return await deleteLead(env, account.id, deleteMatch[1]) ? jsonResponse({ ok: true }) : jsonResponse({ error: "not_found" }, 404);
  }

  const approved = isApprovedPartner(account);
  if (verifyRoute) {
    if (!canEdit) return jsonResponse({ error: "forbidden" }, 403);
    let body = {};
    try { body = await request.json(); } catch { body = {}; }
    const sent = await sendContactVerification(env, account, { lang: leadgenLang(body?.lang || url.searchParams.get("lang")), fetchImpl: deps.fetchImpl });
    if (!sent.ok) return jsonResponse({ error: sent.error }, sent.status);
    console.log("agency_contact_verify_sent", JSON.stringify({ account: account.id, already: !!sent.already }));
  }
  if (rotateRoute) {
    if (!canEdit) return jsonResponse({ error: "forbidden" }, 403);
    if (!approved) return jsonResponse({ error: "partner_not_approved" }, 403);
    const rotated = await rotateWidgetKey(env, account.id);
    if (!rotated) return jsonResponse({ error: "not_found" }, 404);
    console.log("agency_widget_key_rotated", JSON.stringify({ account: account.id }));
  }
  if (method === "PUT") {
    if (!canEdit) return jsonResponse({ error: "forbidden" }, 403);
    if (!approved) return jsonResponse({ error: "partner_not_approved" }, 403);
    let body = {};
    try { body = await request.json(); } catch { body = {}; }
    const checked = validateLeadgenSettings(body || {});
    if (!checked.ok) return jsonResponse({ error: "invalid_settings", fields: checked.errors, invalid: checked.invalid }, 400);
    const branding = await loadBranding(env, account.id);
    if ((checked.value.widget_enabled || checked.value.landing_enabled) && !branding) return jsonResponse({ error: "branding_required", fields: ["branding"] }, 400);
    try {
      await saveLeadgen(env, account.id, checked.value, { memberId: member.member_id });
    } catch (error) {
      if (error instanceof SlugTakenError) return jsonResponse({ error: "slug_taken", fields: ["slug_taken"] }, 409);
      throw error;
    }
    // The signup links carry the referral code, so an agency turning a tool
    // on gets one if it has none yet.
    if ((checked.value.widget_enabled || checked.value.landing_enabled) && !account.referral_code && deps.issueReferralCode) {
      try { account = { ...account, referral_code: await deps.issueReferralCode(env, account) }; } catch { /* the pages still work without it */ }
    }
    console.log("agency_leadgen_saved", JSON.stringify({ account: account.id, widget: checked.value.widget_enabled, landing: checked.value.landing_enabled, origins: checked.value.allowed_origins.length }));
  }

  const settings = await loadLeadgen(env, account.id);
  const branding = await loadBranding(env, account.id);
  const fresh = await env.DB.prepare("SELECT id,email,referral_code,partner_status,partner_approved_at FROM accounts WHERE id=?").bind(account.id).first() || account;
  const lang = leadgenLang(url.searchParams.get("lang"));
  return jsonResponse({
    available: true,
    approved,
    can_edit: canEdit && approved,
    can_delete: canEdit,
    has_branding: !!branding,
    agency_name: branding?.display_name || null,
    has_contact: !!(branding && agencyContactHref(branding)),
    // New-lead emails go to the contact address only once it is verified.
    contact_email: branding?.contact_email || null,
    contact_verified: !!(branding?.contact_email && settings?.contact_verified_email === String(branding.contact_email).toLowerCase()),
    contact_verify_sent_at: settings?.contact_verify_sent_at ?? null,
    notify_to: settings ? (leadNotificationAddress({ branding, settings, account: fresh }) === String(branding?.contact_email || "").toLowerCase() ? "contact" : "account") : null,
    referral_code_active: approved && !!fresh.referral_code,
    settings: settings ? { ...settings } : null,
    embed: settings ? embedSnippets(origin, settings.widget_key, lang) : null,
    landing_url: settings?.slug ? landingUrl(origin, settings.slug) : null,
    signup_url: approved ? signupUrl(origin, fresh, lang) : null,
    landing_prefix: `${origin}${LANDING_PREFIX}`,
    leads_total: await countLeads(env, account.id),
    limits: { max_origins: LEADGEN_MAX_ORIGINS, slug_min: SLUG_MIN, slug_max: SLUG_MAX, intro_max: LEADGEN_INTRO_MAX },
  });
}
