/**
 * Agency white-label monthly client report.
 *
 * An agency (an approved partner, or any member who manages client sites)
 * sends each client a monthly report under the AGENCY's brand: its name, logo,
 * colour, contact and footer, with a small "Powered by Nurevo" line.
 *
 *   Branding     per account (agency_branding, 0046). Logo: an https URL, or a
 *                small upload (PNG/JPEG/WebP/GIF, sniffed from its bytes, never
 *                SVG) kept in D1 and served from /api/agency/logo/<sha256>.
 *   Settings     per site (agency_report_settings): off by default; up to five
 *                recipients; any dashboard locale; brand = agency or Nurevo.
 *                Enabling it with recipients needs the agency to confirm the
 *                recipients agreed to receive it (consent_at / consent_by).
 *   Content      one calendar month (UTC): AEO score and its change, checks
 *                fixed / still open, the free AI check (Free/Standard) or the
 *                Pro appearance rate, the off-site listing check, next actions,
 *                the variability notice.
 *   Languages    the body is written in ja en zh tw ko es fr de; every other
 *                dashboard locale gets the English body (reportLanguage()).
 *   Outputs      printable HTML (A4 print CSS: the browser's "Save as PDF"),
 *                and a monthly email from the hourly cron on the 1st-3rd (UTC)
 *                for the previous month: one message per recipient (nobody
 *                sees another address), claimed per site+month+recipient in
 *                agency_report_sends before sending (so a repeated run never
 *                resends), bounded per run, paced, stopped by a 429, with a
 *                signed per-site unsubscribe link and List-Unsubscribe headers,
 *                Reply-To the agency contact, From "<Agency> via Nurevo" on the
 *                existing MAIL_FROM address.
 *
 * Abuse controls (review of #35: a white-label email from Nurevo's address
 * must not be usable for spam or phishing):
 *   Eligibility  a report is only sent (and can only be switched on) for a
 *                connected site (siteConnection in free-ai-check.mjs: a paired
 *                plugin, a detected tag, a published and complete hosted page)
 *                that is on a paid plan (REPORT_PAID_PLANS) or set up by an
 *                approved partner (reportEligibility).
 *   Double opt-in every new recipient first gets a confirmation email
 *                ("<Agency> via Nurevo wants to send you monthly reports for
 *                <site>") with an HMAC-signed link that expires after
 *                REPORT_CONFIRM_TTL_MS; reports go only to confirmed
 *                addresses. Confirmation emails are capped per site and per
 *                account per day (agency_report_counters).
 *   Names        an agency display name that contains a protected brand or
 *                institution (RESERVED_BRAND_TERMS; case-, width- and
 *                kana-insensitive) is refused, and never used for a From line.
 *   Opt-outs     per site, and globally per address (agency_report_suppressions):
 *                the unsubscribe page offers "all Nurevo reports", and the
 *                confirmation email has a "never send me reports" link.
 *   Volume       report emails are capped per account per month
 *                (AGENCY_REPORT_ACCOUNT_MONTHLY_EMAILS).
 *
 * Before 0046 is applied every reader reports "migration_pending" and the cron
 * skips; nothing fails. Logs carry ids and counts only, never addresses.
 */
import { normalizeDashboardLocale } from "./dashboard-locales.mjs";
import { localizeAeoChecks } from "./aeo-score.mjs";
import { engineDefinition } from "./ai-engines.mjs";
import { isApprovedPartner } from "./partner.mjs";
import { DASHBOARD_ORIGIN, mailConfigured, sendResendEmail } from "./lifecycle-email.mjs";
import { resolveSitePlanFor } from "./billing-plan.mjs";
import { REPORT_BODY_LANGS, REPORT_CHECK_LANG, REPORT_CONSENT_COPY, REPORT_COPY, REPORT_LANG_TAG } from "./agency-report-i18n.mjs";
import { loadCheckState, siteConnection } from "./free-ai-check.mjs";
import { currentAeoScore, publicAeoScore, selectWithScoreV2, storedScoreView } from "./aeo-score-v2.mjs";
import { normalizeSiteType } from "./site-types.mjs";

export { REPORT_BODY_LANGS };
export const AGENCY_REPORT_VERSION = "agency-report-v1";
export const AGENCY_REPORT_MAX_RECIPIENTS = 5;
/**
 * The plans on which an agency may hide the "Powered by Nurevo" line (with
 * agency_branding.hide_powered_by). Free and Standard must always show it.
 * This one constant is the whole policy.
 */
export const POWERED_BY_REMOVABLE_PLANS = Object.freeze(["pro"]);
export const AGENCY_LOGO_MAX_BYTES = 64 * 1024;
export const AGENCY_LOGO_PATH = "/api/agency/logo/";
export const REPORT_UNSUBSCRIBE_PATH = "/api/email/report-unsubscribe";
/** Reports for the previous month go out on these days of the month (UTC). */
export const REPORT_SEND_LAST_DAY = 3;
export const AGENCY_REPORT_CRON_LIMIT_DEFAULT = 40;
export const AGENCY_REPORT_EMAILS_PER_RUN_DEFAULT = 120;
export const AGENCY_REPORT_SPACING_MS_DEFAULT = 550;
export const DEFAULT_BRAND_COLOR = "#6f4df6";
const SITE_DONE = "*";
export const REPORT_CONFIRM_PATH = "/api/email/report-confirm";
/** A confirmation link works for this long. */
export const REPORT_CONFIRM_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** A pending address gets at most one confirmation email in this long. */
export const REPORT_CONFIRM_RESEND_MS = 24 * 60 * 60 * 1000;
/** Plans on which any connected site may send reports. Others need an approved partner. */
export const REPORT_PAID_PLANS = Object.freeze(["standard", "pro"]);
export const AGENCY_REPORT_CONFIRMS_PER_SITE_DAY_DEFAULT = 10;
export const AGENCY_REPORT_CONFIRMS_PER_ACCOUNT_DAY_DEFAULT = 30;
export const AGENCY_REPORT_ACCOUNT_MONTHLY_EMAILS_DEFAULT = 200;

/**
 * Names an agency may not show as its own: payment brands, big platforms,
 * banks, carriers, tax and postal authorities, and Nurevo itself. Matched on
 * the normalized name (normalizeBrandName): Latin terms of five or more
 * letters anywhere in the name with spaces and punctuation removed; shorter
 * Latin terms, and those in RESERVED_WORD_ONLY, as a whole word (so "Visalia",
 * "Bankside" or "Pineapple" pass but "Visa Support", "My Bank" and "Apple
 * Care" do not); Japanese terms anywhere. One list, the whole policy.
 */
export const RESERVED_BRAND_TERMS = Object.freeze([
  "nurevo", "paypal", "apple", "icloud", "google", "gmail", "youtube", "amazon", "microsoft", "outlook", "office365",
  "stripe", "visa", "mastercard", "americanexpress", "amex", "jcb", "unionpay", "applepay", "paypay",
  "facebook", "instagram", "whatsapp", "netflix", "spotify", "dropbox", "docusign", "fedex", "dhl", "ups", "usps",
  "rakuten", "docomo", "softbank", "kddi", "mercari", "yahoo", "linecorp",
  "bank", "banking", "mufg", "smbc", "mizuho", "resona", "japanpost", "yamato", "kuroneko", "sagawa",
  "irs", "hmrc", "nta", "gov", "government", "police", "interpol",
  "楽天", "ヤマト", "クロネコ", "佐川", "日本郵便", "郵便局", "ゆうちょ", "国税", "税務署", "国税庁", "銀行", "信用金庫", "警察", "年金",
  "三菱ufj", "三井住友", "みずほ", "りそな", "ドコモ", "ソフトバンク", "メルカリ", "アマゾン", "グーグル", "アップル", "マイクロソフト",
  "ペイペイ", "ペイパル", "ヌレボ", "ニューレボ",
]);

const MISSING_TABLE = /no such table|no such column/i;
const isMissing = (error) => MISSING_TABLE.test(String(error?.message || error));
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fill = (template, vars = {}) => String(template).replace(/\{(\w+)\}/g, (m, key) => (vars[key] != null ? String(vars[key]) : m));
const changes = (result) => Number(result?.meta?.changes ?? result?.changes ?? 0);

/* ------------------------------------------------------------------ *
 * Language
 * ------------------------------------------------------------------ */

/**
 * The report's language for a dashboard locale: { locale, lang, fallback }.
 * locale is the stored dashboard code (any of the 60); lang is the body
 * language (one of REPORT_BODY_LANGS), English when the locale has no body.
 */
export function reportLanguage(value) {
  const locale = normalizeDashboardLocale(value) || "en";
  if (REPORT_BODY_LANGS.includes(locale)) return { locale, lang: locale, fallback: false };
  // zh_HK reads Traditional Chinese; every other locale gets English.
  if (locale === "zh_HK") return { locale, lang: "tw", fallback: false };
  return { locale, lang: "en", fallback: locale !== "en" };
}

export function reportCopy(lang) {
  return { ...REPORT_COPY.en, ...REPORT_CONSENT_COPY.en, ...(REPORT_COPY[lang] || {}), ...(REPORT_CONSENT_COPY[lang] || {}) };
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

const CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f]/g;
const EMAIL_RE = /^[^\s@<>()",;:\\[\]]+@[^\s@<>()",;:\\[\]]+\.[^\s@<>()",;:\\[\]]+$/;

export function validEmail(value) {
  const email = String(value ?? "").trim();
  return email.length <= 254 && EMAIL_RE.test(email);
}

/** An https URL without credentials, or null. */
export function safeHttpsUrl(value, max = 500) {
  const raw = String(value ?? "").trim();
  if (!raw || raw.length > max || /[\s<>"'`]/.test(raw)) return null;
  let url;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password) return null;
  return url.toString();
}

function singleLine(value) {
  return String(value ?? "").replace(CONTROL, " ").replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

/** The image type from the file's first bytes; SVG and anything else is null. */
export function sniffImageType(bytes) {
  const b = bytes || [];
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61) return "image/gif";
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return null;
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (x) => x.toString(16).padStart(2, "0")).join("");
}

/**
 * A logo upload as a data: URL. Returns { ok, logo: { type, base64, hash } } or
 * { ok: false, error }. The declared type must match the bytes, which must be
 * PNG, JPEG, WebP or GIF and at most AGENCY_LOGO_MAX_BYTES.
 */
export async function parseLogoUpload(dataUrl) {
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(String(dataUrl ?? "").trim());
  if (!match) return { ok: false, error: "logo_type" };
  if (match[2].length > Math.ceil(AGENCY_LOGO_MAX_BYTES / 3) * 4 + 4) return { ok: false, error: "logo_size" };
  let bytes;
  try { bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0)); } catch { return { ok: false, error: "logo_type" }; }
  if (!bytes.length) return { ok: false, error: "logo_type" };
  if (bytes.length > AGENCY_LOGO_MAX_BYTES) return { ok: false, error: "logo_size" };
  const type = sniffImageType(bytes);
  if (!type || type !== match[1]) return { ok: false, error: "logo_type" };
  return { ok: true, logo: { type, base64: match[2], hash: (await sha256Hex(bytes)).slice(0, 40) } };
}

/** Latin terms that are also ordinary words inside other words: matched as a whole word only. */
const RESERVED_WORD_ONLY = new Set(["apple"]);

/** Common look-alike letters from other scripts, read as Latin. */
const HOMOGLYPHS = { "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x", "і": "i", "ј": "j", "ѕ": "s", "ԁ": "d", "ӏ": "l", "ο": "o", "α": "a", "ρ": "p", "ν": "v", "τ": "t", "ι": "i", "κ": "k" };

/**
 * A name reduced for comparison: NFKC (full-width letters and half-width kana
 * become ordinary ones), look-alike letters from other scripts read as Latin,
 * lower case, katakana read as hiragana. `words` keeps word boundaries (also
 * between camelCase parts); `compact` drops every space and punctuation.
 */
export function normalizeBrandName(value) {
  const nfkc = String(value ?? "").normalize("NFKC").replace(/[\u200b-\u200f\u2060\ufeff]/g, "");
  const split = nfkc.replace(/([a-z])([A-Z])/g, "$1 $2");
  const fold = (text) => [...text.toLowerCase()].map((ch) => HOMOGLYPHS[ch] || ch).join("")
    .replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  const words = fold(split).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return { words, compact: words.join("") };
}

/** The reserved term a name uses, or null. */
export function reservedBrandTerm(value) {
  const { words, compact } = normalizeBrandName(value);
  if (!compact) return null;
  for (const term of RESERVED_BRAND_TERMS) {
    const t = normalizeBrandName(term).compact;
    if (!t) continue;
    const latin = /^[a-z0-9]+$/.test(t);
    if (latin && (t.length < 5 || RESERVED_WORD_ONLY.has(t)) ? words.includes(t) : compact.includes(t)) return term;
  }
  return null;
}

/**
 * Check a branding form. Returns { ok, errors: [field], value }. value.logo is
 * "keep" (leave the stored upload), "remove", or a parsed upload.
 */
export async function validateBranding(input = {}) {
  const errors = [];
  const name = singleLine(input.display_name);
  if (!name || name.length > 80) errors.push("display_name");
  else if (reservedBrandTerm(name)) errors.push("display_name_reserved");
  const logoUrlRaw = String(input.logo_url ?? "").trim();
  const logoUrl = logoUrlRaw ? safeHttpsUrl(logoUrlRaw, 500) : null;
  if (logoUrlRaw && !logoUrl) errors.push("logo_url");
  let logo = input.logo_remove === true ? "remove" : "keep";
  if (input.logo_upload) {
    const parsed = await parseLogoUpload(input.logo_upload);
    if (parsed.ok) logo = parsed.logo;
    else errors.push(parsed.error === "logo_size" ? "logo_size" : "logo_upload");
  }
  const colorRaw = String(input.brand_color ?? "").trim();
  const color = colorRaw ? (/^#[0-9a-f]{6}$/i.test(colorRaw) ? colorRaw.toLowerCase() : null) : DEFAULT_BRAND_COLOR;
  if (!color) errors.push("brand_color");
  const emailRaw = String(input.contact_email ?? "").trim();
  if (emailRaw && !validEmail(emailRaw)) errors.push("contact_email");
  const urlRaw = String(input.contact_url ?? "").trim();
  const contactUrl = urlRaw ? safeHttpsUrl(urlRaw, 300) : null;
  if (urlRaw && !contactUrl) errors.push("contact_url");
  const footer = String(input.footer_text ?? "").replace(CONTROL, " ").replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (footer.length > 300) errors.push("footer_text");
  return {
    ok: errors.length === 0,
    errors,
    value: {
      display_name: name,
      logo_url: logoUrl,
      logo,
      brand_color: color || DEFAULT_BRAND_COLOR,
      contact_email: emailRaw ? emailRaw.toLowerCase() : null,
      contact_url: contactUrl,
      footer_text: footer || null,
      hide_powered_by: input.hide_powered_by === true,
    },
  };
}

/**
 * Check a site's report settings. recipients may be an array or text with one
 * address per line (commas and semicolons also separate).
 */
export function validateReportSettings(input = {}) {
  const errors = [];
  const raw = Array.isArray(input.recipients) ? input.recipients : String(input.recipients ?? "").split(/[\n,;]+/);
  const recipients = [];
  const invalid = [];
  for (const entry of raw) {
    const email = String(entry ?? "").trim().toLowerCase();
    if (!email) continue;
    if (!validEmail(email)) { invalid.push(email.slice(0, 80)); continue; }
    if (!recipients.includes(email)) recipients.push(email);
  }
  if (invalid.length) errors.push("recipients_invalid");
  if (recipients.length > AGENCY_REPORT_MAX_RECIPIENTS) errors.push("recipients_too_many");
  const enabled = input.enabled === true;
  if (enabled && !recipients.length) errors.push("recipients_required");
  const consent = input.consent === true;
  if (enabled && recipients.length && !consent) errors.push("consent_required");
  const source = input.branding_source === "nurevo" ? "nurevo" : "agency";
  return {
    ok: errors.length === 0,
    errors,
    invalid,
    value: { enabled, recipients, locale: reportLanguage(input.locale || input.language).locale, branding_source: source, consent },
  };
}

/* ------------------------------------------------------------------ *
 * Storage (0046)
 * ------------------------------------------------------------------ */

const BRANDING_COLUMNS = "account_id,display_name,logo_url,logo_type,logo_hash,brand_color,contact_email,contact_url,footer_text,hide_powered_by,updated_at";

/** The account's branding, or null. Throws "no such table" before 0046. */
export async function loadBranding(env, accountId) {
  if (!accountId) return null;
  const row = await env.DB.prepare(`SELECT ${BRANDING_COLUMNS} FROM agency_branding WHERE account_id=? LIMIT 1`).bind(accountId).first();
  return row ? publicBranding(row) : null;
}

export function publicBranding(row) {
  return {
    account_id: row.account_id,
    display_name: row.display_name,
    logo_url: row.logo_url || null,
    logo_type: row.logo_type || null,
    logo_hash: row.logo_hash || null,
    brand_color: /^#[0-9a-f]{6}$/i.test(String(row.brand_color || "")) ? row.brand_color : DEFAULT_BRAND_COLOR,
    contact_email: row.contact_email || null,
    contact_url: row.contact_url || null,
    footer_text: row.footer_text || null,
    hide_powered_by: Number(row.hide_powered_by) === 1,
    updated_at: row.updated_at ?? null,
  };
}

export async function saveBranding(env, accountId, value, { memberId = null, now = Date.now() } = {}) {
  const upload = value.logo && typeof value.logo === "object" ? value.logo : null;
  const remove = value.logo === "remove";
  await env.DB.prepare(`INSERT INTO agency_branding (account_id,display_name,logo_url,logo_type,logo_data,logo_hash,brand_color,contact_email,contact_url,footer_text,hide_powered_by,updated_at,updated_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(account_id) DO UPDATE SET display_name=excluded.display_name, logo_url=excluded.logo_url,
      logo_type=CASE WHEN ?=1 THEN excluded.logo_type WHEN ?=1 THEN NULL ELSE agency_branding.logo_type END,
      logo_data=CASE WHEN ?=1 THEN excluded.logo_data WHEN ?=1 THEN NULL ELSE agency_branding.logo_data END,
      logo_hash=CASE WHEN ?=1 THEN excluded.logo_hash WHEN ?=1 THEN NULL ELSE agency_branding.logo_hash END,
      brand_color=excluded.brand_color, contact_email=excluded.contact_email, contact_url=excluded.contact_url,
      footer_text=excluded.footer_text, hide_powered_by=excluded.hide_powered_by, updated_at=excluded.updated_at, updated_by=excluded.updated_by`)
    .bind(accountId, value.display_name, value.logo_url, upload?.type || null, upload?.base64 || null, upload?.hash || null,
      value.brand_color, value.contact_email, value.contact_url, value.footer_text, value.hide_powered_by ? 1 : 0, now, memberId,
      upload ? 1 : 0, remove ? 1 : 0, upload ? 1 : 0, remove ? 1 : 0, upload ? 1 : 0, remove ? 1 : 0).run();
  return loadBranding(env, accountId);
}

/** An uploaded logo by its hash: { type, bytes } or null. */
export async function loadLogo(env, hash) {
  if (!/^[a-f0-9]{40}$/.test(String(hash || ""))) return null;
  try {
    const row = await env.DB.prepare("SELECT logo_type,logo_data FROM agency_branding WHERE logo_hash=? AND logo_data IS NOT NULL LIMIT 1").bind(hash).first();
    if (!row?.logo_data) return null;
    const bytes = Uint8Array.from(atob(row.logo_data), (c) => c.charCodeAt(0));
    const type = sniffImageType(bytes);
    return type ? { type, bytes } : null;
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }
}

/** GET /api/agency/logo/<hash>: the image only, never anything a browser would run. */
export async function handleLogoRequest(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith(AGENCY_LOGO_PATH) || request.method !== "GET") return null;
  const logo = await loadLogo(env, url.pathname.slice(AGENCY_LOGO_PATH.length));
  if (!logo) return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  return new Response(logo.bytes, {
    status: 200,
    headers: {
      "content-type": logo.type,
      // The URL is the content hash, so it never changes.
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; sandbox",
      "access-control-allow-origin": "*",
    },
  });
}

function parseRecipients(json) {
  try { const list = JSON.parse(json || "[]"); return Array.isArray(list) ? list.filter(validEmail).map((e) => String(e).toLowerCase()).slice(0, AGENCY_REPORT_MAX_RECIPIENTS) : []; } catch { return []; }
}

/** The site's settings, defaults when none are stored. Throws "no such table" before 0046. */
export async function loadReportSettings(env, siteId) {
  const row = await env.DB.prepare("SELECT site_id,enabled,recipients_json,locale,branding_source,brand_account_id,account_id,consent_at,consent_by,updated_at FROM agency_report_settings WHERE site_id=? LIMIT 1").bind(siteId).first();
  if (!row) return { site_id: siteId, enabled: false, recipients: [], locale: null, branding_source: "agency", brand_account_id: null, account_id: null, consent_at: null, stored: false };
  return {
    site_id: row.site_id,
    enabled: Number(row.enabled) === 1,
    recipients: parseRecipients(row.recipients_json),
    locale: reportLanguage(row.locale).locale,
    branding_source: row.branding_source === "nurevo" ? "nurevo" : "agency",
    brand_account_id: row.brand_account_id ?? null,
    account_id: row.account_id ?? null,
    consent_at: row.consent_at ?? null,
    updated_at: row.updated_at ?? null,
    stored: true,
  };
}

export async function saveReportSettings(env, siteId, value, { accountId = null, memberId = null, now = Date.now() } = {}) {
  const consented = value.consent && value.recipients.length > 0;
  await env.DB.prepare(`INSERT INTO agency_report_settings (site_id,enabled,recipients_json,locale,branding_source,brand_account_id,consent_at,consent_by,updated_at,updated_by,account_id)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(site_id) DO UPDATE SET enabled=excluded.enabled, recipients_json=excluded.recipients_json, locale=excluded.locale,
      branding_source=excluded.branding_source, brand_account_id=excluded.brand_account_id, account_id=excluded.account_id,
      consent_at=CASE WHEN excluded.consent_at IS NOT NULL THEN excluded.consent_at ELSE agency_report_settings.consent_at END,
      consent_by=CASE WHEN excluded.consent_at IS NOT NULL THEN excluded.consent_by ELSE agency_report_settings.consent_by END,
      updated_at=excluded.updated_at, updated_by=excluded.updated_by`)
    .bind(siteId, value.enabled ? 1 : 0, JSON.stringify(value.recipients), value.locale, value.branding_source,
      value.branding_source === "agency" ? accountId : null, consented ? now : null, consented ? memberId : null, now, memberId, accountId).run();
  return loadReportSettings(env, siteId);
}

/** Recipients of this site who unsubscribed (shown to the agency). */
export async function loadOptOuts(env, siteId) {
  try {
    const { results } = await env.DB.prepare("SELECT email FROM agency_report_opt_outs WHERE site_id=?").bind(siteId).all();
    return (results || []).map((row) => String(row.email).toLowerCase());
  } catch (error) {
    if (isMissing(error)) return [];
    throw error;
  }
}

/** The latest month this site's report went out, and to how many. */
export async function lastSent(env, siteId) {
  try {
    const row = await env.DB.prepare(`SELECT month, COUNT(*) AS n, MAX(sent_at) AS at FROM agency_report_sends
      WHERE site_id=? AND email<>'*' AND status='sent' GROUP BY month ORDER BY month DESC LIMIT 1`).bind(siteId).first();
    return row ? { month: row.month, recipients: Number(row.n || 0), sent_at: row.at ?? null } : null;
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }
}

/** Whether 0046 is applied. */
export async function agencyReportAvailable(env) {
  try {
    await env.DB.prepare("SELECT 1 FROM agency_report_settings LIMIT 1").first();
    await env.DB.prepare("SELECT 1 FROM agency_branding LIMIT 1").first();
    await env.DB.prepare("SELECT 1 FROM agency_report_sends LIMIT 1").first();
    await env.DB.prepare("SELECT 1 FROM agency_report_recipients LIMIT 1").first();
    await env.DB.prepare("SELECT 1 FROM agency_report_suppressions LIMIT 1").first();
    await env.DB.prepare("SELECT 1 FROM agency_report_counters LIMIT 1").first();
    await env.DB.prepare("SELECT account_id FROM agency_report_settings LIMIT 1").first();
    return true;
  } catch (error) {
    if (isMissing(error)) return false;
    throw error;
  }
}

/* ------------------------------------------------------------------ *
 * Whose brand
 * ------------------------------------------------------------------ */

/**
 * The agency brand for a site's report, or null for Nurevo's own. In order:
 *   1. the account that chose "agency brand" in the site's settings, while it
 *      can still manage the site (canManage re-checks access at send time);
 *   2. when previewing with no such choice, the viewer's own account;
 *   3. the site owner's account (an agency that owns its clients' sites);
 *   4. the approved partner who referred the owner.
 * The first with saved branding wins. "nurevo" in the settings means Nurevo.
 */
export async function resolveBranding(env, site, settings = null, { canManage = null, viewerAccountId = null } = {}) {
  if (settings?.branding_source === "nurevo") return null;
  const candidates = [];
  if (settings?.brand_account_id) candidates.push({ id: Number(settings.brand_account_id), check: true });
  else if (viewerAccountId) candidates.push({ id: Number(viewerAccountId), check: false });
  try {
    if (site?.owner_member_id) {
      const owner = await env.DB.prepare("SELECT id,referred_by_account_id FROM accounts WHERE member_id=? LIMIT 1").bind(site.owner_member_id).first();
      if (owner) {
        candidates.push({ id: Number(owner.id), check: false });
        if (owner.referred_by_account_id) {
          const partner = await env.DB.prepare("SELECT * FROM accounts WHERE id=? LIMIT 1").bind(owner.referred_by_account_id).first();
          if (partner && isApprovedPartner(partner)) candidates.push({ id: Number(partner.id), check: false });
        }
      }
    }
  } catch (error) {
    if (!isMissing(error)) throw error;
  }
  const tried = new Set();
  for (const candidate of candidates) {
    if (!candidate.id || tried.has(candidate.id)) continue;
    tried.add(candidate.id);
    let branding = null;
    try { branding = await loadBranding(env, candidate.id); } catch (error) { if (isMissing(error)) return null; throw error; }
    if (!branding || !branding.display_name || reservedBrandTerm(branding.display_name)) continue;
    if (candidate.check && canManage && !(await canManage(env, candidate.id, site))) continue;
    return branding;
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Data for one month
 * ------------------------------------------------------------------ */

export function previousMonthKey(now = Date.now()) {
  const date = new Date(now);
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  return m === 0 ? `${y - 1}-12` : `${y}-${String(m).padStart(2, "0")}`;
}

export function monthBounds(month) {
  const [y, m] = String(month).split("-").map(Number);
  const start = Date.UTC(y, m - 1, 1);
  const end = Date.UTC(y, m, 1);
  const prevStart = Date.UTC(y, m - 2, 1);
  const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
  return { start, end, prevStart, startIso: iso(start), endIso: iso(end), prevStartIso: iso(prevStart) };
}

const toMs = (value) => (typeof value === "number" ? value : /^\d+$/.test(String(value ?? "")) ? Number(value) : Date.parse(String(value ?? "")));

/**
 * Everything the report reads, for one site and month. Each part that cannot be
 * read (its table not migrated yet) is simply absent.
 */
export async function collectReportData(env, site, month) {
  const { start, end, endIso, prevStartIso } = monthBounds(month);
  const data = { scores: [], freeCheck: null, sov: [], offsite: null, siteType: "local", sovQuestions: null, aeoScore: null };
  try {
    data.scores = await selectWithScoreV2(env, `SELECT scanned_at,score,verdict,checks_json{V2} FROM aeo_scores
      WHERE site_id=? AND scanned_at>=? AND scanned_at<? ORDER BY scanned_at LIMIT 400`, [site.id, prevStartIso, endIso]);
  } catch (error) { if (!isMissing(error)) throw error; }
  // The headline (score v2) as of the month's last diagnosis: stored on a v2
  // row; combined from the evidence as of its scan time on an older row.
  const lastInMonth = [...data.scores].reverse().find((row) => { const at = toMs(row.scanned_at); return at >= start && at < end && row.score != null; });
  if (lastInMonth) {
    try { data.aeoScore = publicAeoScore(await currentAeoScore(env, site.id, lastInMonth)); } catch (error) { if (!isMissing(error)) throw error; }
  }
  try {
    const row = await env.DB.prepare("SELECT site_type FROM site_settings WHERE site_id=? LIMIT 1").bind(site.id).first();
    data.siteType = normalizeSiteType(row?.site_type);
  } catch (error) { if (!isMissing(error)) throw error; }
  try {
    data.freeCheck = await env.DB.prepare("SELECT month,status,finished_at,started_at,result_json FROM aeo_free_checks WHERE site_id=? AND month=? LIMIT 1").bind(site.id, month).first() || null;
  } catch (error) { if (!isMissing(error)) throw error; }
  try {
    const { results } = await env.DB.prepare(`SELECT id,ran_at,status,appearance_rate,citation_rate,answers_received,competitors_json,detail_json
      FROM aeo_sov_runs WHERE site_id=? ORDER BY ran_at DESC LIMIT 60`).bind(site.id).all();
    data.sov = (results || []).filter((row) => toMs(row.ran_at) < end);
  } catch (error) { if (!isMissing(error)) throw error; }
  // The questions of the month's last Pro run, with how often each answer
  // named or cited the site, so the report shows what was asked.
  const lastRun = proRunsOf(data.sov).filter((row) => toMs(row.ran_at) >= start && toMs(row.ran_at) < end).pop();
  if (lastRun?.id) {
    try {
      const engine = parseJson(lastRun.detail_json, {})?.headline?.engine || "perplexity";
      const { results } = await env.DB.prepare(`SELECT question,engine,kind,ok,brand_mentioned,brand_cited FROM aeo_sov_mentions
        WHERE run_id=? AND site_id=? LIMIT 200`).bind(lastRun.id, site.id).all();
      data.sovQuestions = { run_id: lastRun.id, rows: proQuestionRows(results || [], engine, parseJson(lastRun.detail_json, {})?.query_set?.questions) };
    } catch (error) { if (!isMissing(error)) throw error; }
  }
  try {
    const row = await env.DB.prepare("SELECT ran_at,result_json FROM offsite_audits WHERE site_id=? AND ran_at<? ORDER BY ran_at DESC LIMIT 1").bind(site.id, end).first();
    if (row && Number(row.ran_at) >= start - 62 * 86400e3) data.offsite = { ran_at: Number(row.ran_at), ...JSON.parse(row.result_json || "{}") };
  } catch (error) { if (!isMissing(error) && !(error instanceof SyntaxError)) throw error; }
  return data;
}

/** Pro runs with a headline rate, oldest first. */
function proRunsOf(sov = []) {
  return sov.filter((row) => row && row.appearance_rate != null && Number(row.answers_received) > 0)
    .sort((a, b) => toMs(a.ran_at) - toMs(b.ran_at));
}

/**
 * Per question of one run (headline engine, discovery questions only): how
 * many answers came back and how many named / cited the site. Questions keep
 * the order of the run's question set when it is known.
 */
export function proQuestionRows(mentions = [], engine = "perplexity", order = null) {
  const byQuestion = new Map();
  for (const row of mentions) {
    if (!row || (row.kind && row.kind !== "discovery") || (row.engine || "perplexity") !== engine) continue;
    const question = String(row.question || "").slice(0, 300);
    if (!question) continue;
    const entry = byQuestion.get(question) || { question, asked: 0, answers: 0, named: 0, cited: 0 };
    entry.asked += 1;
    if (Number(row.ok) === 1 || row.ok === true) {
      entry.answers += 1;
      if (Number(row.brand_mentioned) === 1 || row.brand_mentioned === true) entry.named += 1;
      if (Number(row.brand_cited) === 1 || row.brand_cited === true) entry.cited += 1;
    }
    byQuestion.set(question, entry);
  }
  const rows = [...byQuestion.values()];
  if (Array.isArray(order)) rows.sort((a, b) => (order.indexOf(a.question) + 1 || 1e3) - (order.indexOf(b.question) + 1 || 1e3));
  return rows.slice(0, 10);
}

/* ------------------------------------------------------------------ *
 * The report model (pure)
 * ------------------------------------------------------------------ */

function parseJson(value, fallback) {
  try { const parsed = typeof value === "string" ? JSON.parse(value) : value; return parsed ?? fallback; } catch { return fallback; }
}

function band(score) {
  if (score == null) return null;
  return score >= 80 ? "green" : score >= 50 ? "yellow" : "red";
}

export function siteLabel(site = {}) {
  const raw = String(site.website_uri || site.url || "").trim();
  if (raw) return raw.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  return site.slug ? `nurevo.jp/s/${site.slug}` : String(site.id || "");
}

function checkStatuses(checksJson) {
  const checks = parseJson(checksJson, []);
  return Array.isArray(checks) ? checks.filter((c) => c && typeof c.id === "string") : [];
}

/** Whether the "Powered by Nurevo" line is shown. */
export function showPoweredBy(plan, branding) {
  return !(branding && branding.hide_powered_by && POWERED_BY_REMOVABLE_PLANS.includes(plan));
}

/**
 * Build the report model. Everything here is data; render* turns it into words
 * in model.lang. scores: aeo_scores rows from the start of the previous month
 * to the end of this one; freeCheck: the month's aeo_free_checks row; sov:
 * aeo_sov_runs rows before the month's end; offsite: the latest audit.
 */
export function buildAgencyReport({ site = {}, plan = "free", month, locale = "en", scores = [], freeCheck = null, sov = [], offsite = null, branding = null, siteType = "local", sovQuestions = null, aeoScore = null, now = Date.now() } = {}) {
  const period = /^\d{4}-\d{2}$/.test(String(month || "")) ? month : previousMonthKey(now);
  const language = reportLanguage(locale);
  const { start, end } = monthBounds(period);
  const ordered = [...scores].filter((row) => row && row.scanned_at).sort((a, b) => String(a.scanned_at).localeCompare(String(b.scanned_at)));
  const inMonth = ordered.filter((row) => { const at = toMs(row.scanned_at); return at >= start && at < end; });
  const before = ordered.filter((row) => toMs(row.scanned_at) < start);
  const scored = inMonth.filter((row) => row.score != null && Number.isFinite(Number(row.score)));
  const latest = scored[scored.length - 1] || null;
  const baselineRow = [...before].reverse().find((row) => row.score != null) || null;
  // The headline is score v2 (readiness blended with measured AI visibility)
  // when collectReportData worked it out, else what the row itself stored.
  // A change is only stated between two scores of the same version.
  const headline = latest ? (aeoScore && aeoScore.score != null ? aeoScore : publicAeoScore(storedScoreView(latest))) : null;
  const latestScore = headline ? headline.score : null;
  const baseline = baselineRow ? storedScoreView(baselineRow) : null;
  const sameVersion = !!(headline && baseline && baseline.score_version === headline.score_version && baseline.score != null);
  const versionOf = (row) => storedScoreView(row).score_version;
  const score = {
    available: latestScore != null,
    latest: latestScore,
    band: band(latestScore),
    delta: latestScore != null && sameVersion ? latestScore - Number(baseline.score) : null,
    version_changed: !!(headline && baseline && baseline.score != null && !sameVersion),
    samples: scored.length,
    // The chart follows one version: the latest point's.
    points: scored.filter((row) => !headline || versionOf(row) === versionOf(latest))
      .map((row) => ({ at: row.scanned_at, score: Number(storedScoreView(row).score) })).filter((p) => Number.isFinite(p.score)).slice(-31),
    measured_at: latest?.scanned_at || null,
    score_version: headline?.score_version || null,
    basis: headline?.basis || null,
    readiness: headline?.readiness?.score ?? null,
    visibility: headline?.visibility || null,
  };

  // Fixed: not passing at the start (the last scan before the month, else the
  // first of the month) and passing at the end. Open: not passing at the end.
  const lastChecks = [...inMonth].reverse().find((row) => row.checks_json);
  const baseChecks = [...before].reverse().find((row) => row.checks_json) || inMonth.find((row) => row.checks_json && row !== lastChecks) || null;
  const checkLang = REPORT_CHECK_LANG[language.lang] || "en";
  const endChecks = lastChecks ? localizeAeoChecks(checkStatuses(lastChecks.checks_json), checkLang) : [];
  const startStatus = new Map(baseChecks ? checkStatuses(baseChecks.checks_json).map((c) => [c.id, String(c.status || "").toUpperCase()]) : []);
  const fixed = [];
  const open = [];
  for (const check of endChecks) {
    const status = String(check.status || "").toUpperCase();
    const label = String(check.label || check.id).slice(0, 120);
    if (status === "OK") {
      if (startStatus.has(check.id) && startStatus.get(check.id) !== "OK") fixed.push({ id: check.id, label });
    } else {
      open.push({ id: check.id, label, status: status === "BAD" ? "bad" : "warn" });
    }
  }
  open.sort((a, b) => (a.status === b.status ? 0 : a.status === "bad" ? -1 : 1));

  // AI: the month's free check for Free/Standard, the Pro measurement for Pro.
  let ai = { kind: "none" };
  if (plan === "pro") {
    const runs = proRunsOf(sov);
    const monthRuns = runs.filter((row) => toMs(row.ran_at) >= start && toMs(row.ran_at) < end);
    const last = monthRuns[monthRuns.length - 1] || null;
    if (last) {
      const engineOf = (row) => parseJson(row.detail_json, {})?.headline?.engine || "perplexity";
      const engine = engineOf(last);
      const prior = runs.filter((row) => toMs(row.ran_at) < start && engineOf(row) === engine).pop() || null;
      const competitors = parseJson(last.competitors_json, []);
      const detail = parseJson(last.detail_json, {}) || {};
      // The questions asked, each with how its answers named / cited the site.
      const asked = sovQuestions && sovQuestions.run_id && sovQuestions.run_id === last.id && Array.isArray(sovQuestions.rows) ? sovQuestions.rows : [];
      ai = {
        kind: "pro",
        distinct_questions: Number.isInteger(detail.distinct_questions) ? detail.distinct_questions : Array.isArray(detail.query_set?.questions) ? detail.query_set.questions.length : asked.length || null,
        repetitions: Number.isInteger(detail.repetitions) ? detail.repetitions : null,
        questions: asked.map((q) => ({
          question: String(q.question || "").slice(0, 300),
          answered: Number(q.answers) > 0, named: Number(q.named) > 0, cited: Number(q.cited) > 0,
          answers: Number(q.answers) || 0, named_count: Number(q.named) || 0, cited_count: Number(q.cited) || 0,
        })),
        engine_label: engineDefinition(engine)?.label || "Perplexity",
        answers: Number(last.answers_received || 0),
        appearance_rate: Number(last.appearance_rate),
        citation_rate: last.citation_rate == null ? null : Number(last.citation_rate),
        delta: prior ? Math.round((Number(last.appearance_rate) - Number(prior.appearance_rate)) * 1000) / 1000 : null,
        competitors: (Array.isArray(competitors) ? competitors : []).map((c) => String(c?.host || "")).filter(Boolean).slice(0, 3),
        measured_at: last.ran_at,
      };
    } else ai = { kind: "pro_none" };
  } else if (freeCheck && ["done", "failed"].includes(freeCheck.status)) {
    const result = parseJson(freeCheck.result_json, {}) || {};
    ai = {
      kind: "free",
      engine_label: "Perplexity",
      asked: Number(result.asked || 0),
      answered: Number(result.answered || 0),
      appeared: Number(result.appeared || 0),
      questions: (Array.isArray(result.questions) ? result.questions : []).slice(0, 5).map((q) => ({
        question: String(q?.question || "").slice(0, 300),
        answered: !!q?.answered, named: !!q?.named, cited: !!q?.cited,
      })),
      competitors: (Array.isArray(result.competitors) ? result.competitors : []).map((c) => String(c?.label || "").slice(0, 80)).filter(Boolean).slice(0, 3),
      checked_at: freeCheck.finished_at || freeCheck.started_at || null,
    };
  } else ai = { kind: "free_none" };

  // Off-site: the Google source's outcome, our own comparison only.
  let off = null;
  const google = Array.isArray(offsite?.sources) ? offsite.sources.find((s) => s && s.id === "google") : null;
  if (google) {
    const fields = Object.entries(google.fields || {}).filter(([, f]) => f && (f.status === "mismatch" || f.status === "variant")).map(([name]) => name);
    const status = google.status === "not_found" ? "not_found" : fields.length ? "mismatch" : google.status === "match" ? "match" : "other";
    off = { status, fields: fields.filter((f) => ["name", "address", "phone", "hours", "business_status"].includes(f)), checked_at: offsite.ran_at || null };
  }

  const next = [];
  if (!score.available) next.push("nextRun");
  if (open.length) next.push("nextFix");
  if ((ai.kind === "free" && ai.answered > 0 && ai.appeared === 0) || (ai.kind === "pro" && ai.appearance_rate < 0.3)) next.push("nextFaq");
  if (off && (off.status === "mismatch" || off.status === "not_found")) next.push("nextListing");
  next.push("nextKeep");

  return {
    version: AGENCY_REPORT_VERSION,
    month: period,
    generated_at: new Date(now).toISOString(),
    locale: language.locale,
    lang: language.lang,
    lang_fallback: language.fallback,
    site: { id: site.id || null, label: siteLabel(site) },
    site_type: normalizeSiteType(siteType),
    plan,
    brand: branding ? {
      agency: true,
      name: branding.display_name,
      color: branding.brand_color || DEFAULT_BRAND_COLOR,
      logo_hash: branding.logo_hash || null,
      logo_url: branding.logo_url || null,
      contact_email: branding.contact_email || null,
      contact_url: branding.contact_url || null,
      footer_text: branding.footer_text || null,
    } : { agency: false, name: "Nurevo", color: DEFAULT_BRAND_COLOR, logo_hash: null, logo_url: null, contact_email: null, contact_url: null, footer_text: null },
    powered_by: showPoweredBy(plan, branding),
    score,
    fixed: fixed.slice(0, 5),
    open: open.slice(0, 5),
    ai,
    offsite: off,
    next,
  };
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

function monthLabel(month, lang) {
  const [y, m] = String(month).split("-").map(Number);
  try { return new Intl.DateTimeFormat(REPORT_LANG_TAG[lang] || "en-US", { year: "numeric", month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1))); } catch { return month; }
}

function dateLabel(value, lang) {
  const at = toMs(value);
  if (!Number.isFinite(at)) return "";
  try { return new Intl.DateTimeFormat(REPORT_LANG_TAG[lang] || "en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(at)); } catch { return new Date(at).toISOString().slice(0, 10); }
}

const percent = (value) => (value == null || !Number.isFinite(value) ? "—" : `${Math.round(value * 100)}%`);
const listSep = (lang) => (["ja", "zh", "tw"].includes(lang) ? "、" : ", ");

export function logoSrc(brand, origin = DASHBOARD_ORIGIN) {
  if (brand?.logo_hash) return `${String(origin).replace(/\/+$/, "")}${AGENCY_LOGO_PATH}${brand.logo_hash}`;
  return brand?.logo_url ? safeHttpsUrl(brand.logo_url) : null;
}

/** The words of the report, as plain strings, in order. Shared by HTML and text. */
function reportParts(model) {
  const c = reportCopy(model.lang);
  const lang = model.lang;
  const month = monthLabel(model.month, lang);
  const parts = { c, month };
  const s = model.score;
  parts.score = s.available ? {
    value: String(s.latest),
    band: c[s.band === "green" ? "bandGreen" : s.band === "yellow" ? "bandYellow" : "bandRed"],
    delta: s.delta == null ? c.deltaFirst : s.delta > 0 ? fill(c.deltaUp, { n: s.delta }) : s.delta < 0 ? fill(c.deltaDown, { n: Math.abs(s.delta) }) : c.deltaSame,
    samples: fill(c.measurements, { n: s.samples }),
    // Score v2: the two sub-scores, what the visibility rests on, and why there
    // is no change figure when the version changed.
    lines: s.score_version === "aeo-v2" ? [
      fill(c.readinessLine, { n: s.readiness ?? "—" }),
      s.visibility?.measured
        ? fill(c.visibilityLine, { n: s.visibility.score, answers: s.visibility.answers, k: s.visibility.appeared })
        : c.visibilityNone,
      ...(s.visibility?.measured ? [c.scoreSmallSample] : []),
      ...(s.version_changed ? [c.deltaVersion] : []),
    ] : [],
  } : null;
  if (parts.score && s.version_changed) parts.score.delta = "";
  const ai = model.ai;
  if (ai.kind === "free") {
    parts.ai = {
      lead: fill(c.freeLead, { engine: ai.engine_label, n: ai.asked || ai.questions.length }),
      result: fill(c.freeResult, { k: ai.appeared, n: ai.answered }),
      questions: ai.questions.map((q) => ({ q: q.question, tags: !q.answered ? [c.noAnswer] : [q.named && c.named, q.cited && c.cited].filter(Boolean).length ? [q.named && c.named, q.cited && c.cited].filter(Boolean) : [c.notNamed], hit: q.named || q.cited })),
      others: ai.competitors.length ? fill(c.others, { list: ai.competitors.join(listSep(lang)) }) : null,
      when: ai.checked_at ? fill(c.offsiteChecked, { date: dateLabel(ai.checked_at, lang) }) : null,
    };
  } else if (ai.kind === "pro") {
    const delta = ai.delta == null ? null : `${ai.delta > 0 ? "+" : ""}${Math.round(ai.delta * 100)} pt`;
    const qs = ai.questions || [];
    const count = (label, k, n) => `${label} ${k}/${n}`;
    parts.ai = {
      lead: [fill(c.proLead, { engine: ai.engine_label, n: ai.answers }),
        ai.distinct_questions > 0 && ai.repetitions > 0 ? fill(c.proAsked, { engine: ai.engine_label, q: ai.distinct_questions, r: ai.repetitions }) : ""].filter(Boolean).join(" "),
      result: fill(c.proRate, { rate: percent(ai.appearance_rate), cite: percent(ai.citation_rate) }),
      change: delta ? fill(c.proChange, { delta }) : null,
      others: ai.competitors.length ? fill(c.competitors, { list: ai.competitors.join(listSep(lang)) }) : null,
      when: ai.measured_at ? fill(c.offsiteChecked, { date: dateLabel(ai.measured_at, lang) }) : null,
      questions: qs.map((q) => ({ q: q.question,
        tags: !q.answered ? [c.noAnswer]
          : q.named || q.cited ? [q.named && count(c.named, q.named_count, q.answers), q.cited && count(c.cited, q.cited_count, q.answers)].filter(Boolean)
          : [count(c.notNamed, q.answers, q.answers)],
        hit: q.named || q.cited })),
    };
  } else parts.ai = { none: ai.kind === "pro_none" ? c.proNone : c.freeNone };
  if (model.offsite) {
    const names = { name: c.fieldName, address: c.fieldAddress, phone: c.fieldPhone, hours: c.fieldHours, business_status: c.fieldStatus };
    const o = model.offsite;
    parts.offsite = {
      line: o.status === "match" ? c.offsiteMatch : o.status === "not_found" ? c.offsiteNotFound
        : o.status === "mismatch" ? fill(c.offsiteMismatch, { fields: o.fields.map((f) => names[f]).join(listSep(lang)) }) : c.offsiteOther,
      ok: o.status === "match",
      when: o.checked_at ? fill(c.offsiteChecked, { date: dateLabel(o.checked_at, lang) }) : null,
    };
  }
  // Wording follows the kind of site, and the advice refers to questions
  // "above" only when the report shows them.
  const type = model.site_type === "ec" ? "Ec" : model.site_type === "b2b" ? "B2b" : "";
  parts.aiHeading = c[`aiHeading${type}`] || c.aiHeading;
  const shown = parts.ai && Array.isArray(parts.ai.questions) && parts.ai.questions.length > 0;
  parts.next = model.next.map((key) => key === "nextFaq"
    ? fill(c[`nextFaq${type}`] || c.nextFaq, { ref: shown ? c.faqRefShown : c.faqRefGeneric })
    : c[key]);
  return parts;
}

const REPORT_CSS = `
*{box-sizing:border-box}body{margin:0;background:#f4f4f6;color:#1d1d24;font:14px/1.65 system-ui,-apple-system,"Segoe UI","Hiragino Sans","Noto Sans CJK JP","Noto Sans",sans-serif}
.rp{max-width:760px;margin:24px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.rp-band{height:8px}
.rp-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;padding:26px 32px 18px;border-bottom:1px solid #ececf1}
.rp-brand{display:flex;align-items:center;gap:12px;min-width:0}.rp-brand img{max-height:52px;max-width:180px;object-fit:contain}
.rp-agency{font-size:17px;font-weight:700;overflow-wrap:anywhere}
.rp-meta{text-align:right}.rp-meta h1{font-size:19px;margin:0 0 4px}.rp-meta p{margin:0;color:#5b5b68;font-size:13px;overflow-wrap:anywhere}
.rp-body{padding:6px 32px 24px}
.rp-sec{padding:18px 0;border-bottom:1px solid #f0f0f4;break-inside:avoid;page-break-inside:avoid}
.rp-sec h2{font-size:15px;margin:0 0 8px;padding-left:10px;border-left:4px solid #6f4df6}
.rp-lead{color:#5b5b68;font-size:12.5px;margin:0 0 8px}
.rp-score{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}.rp-score strong{font-size:40px;line-height:1}.rp-score .rp-of{color:#6b6b78}
.rp-pill{display:inline-block;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:700}
.rp-pill.green{background:#e3f5ea;color:#13693a}.rp-pill.yellow{background:#fff3d6;color:#7a5200}.rp-pill.red{background:#fde6e6;color:#a32020}
.rp-small{font-size:12px;color:#6b6b78;margin:4px 0 0}
.rp-cols{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.rp-list{margin:0;padding:0;list-style:none}.rp-list li{padding:6px 0;border-top:1px solid #f3f3f6;font-size:13px;display:flex;gap:8px;justify-content:space-between}.rp-list li:first-child{border-top:0}
.rp-tag{font-size:11px;font-weight:700;border-radius:5px;padding:1px 7px;white-space:nowrap;background:#f1f0f5;color:#4d4b5c}.rp-tag.ok{background:#e3f5ea;color:#13693a}.rp-tag.bad{background:#fde6e6;color:#a32020}.rp-tag.warn{background:#fff3d6;color:#7a5200}
.rp-q{flex:1;overflow-wrap:anywhere}
.rp-next{margin:0;padding-left:20px}.rp-next li{margin:4px 0}
.rp-notice{font-size:11.5px;color:#6b6b78;margin:16px 0 0}
.rp-foot{padding:16px 32px 22px;background:#fafafc;font-size:12px;color:#4d4b5c}.rp-foot p{margin:3px 0;overflow-wrap:anywhere}.rp-foot a{color:inherit}
.rp-powered{color:#8a8a96;font-size:11px;margin-top:10px!important}
.rp-mail{font-size:13px;margin:0 0 4px}
.rp-spark{display:block;margin-top:8px}
@page{size:A4;margin:14mm}
@media print{body{background:#fff}.rp{margin:0;max-width:none;box-shadow:none;border-radius:0}.rp-band,.rp-pill,.rp-tag{-webkit-print-color-adjust:exact;print-color-adjust:exact}a{text-decoration:none}}
@media (max-width:620px){.rp-head{flex-direction:column}.rp-meta{text-align:left}.rp-cols{grid-template-columns:1fr}.rp-head,.rp-body,.rp-foot{padding-left:18px;padding-right:18px}}
`;

function sparkline(points, color) {
  if (!points || points.length < 2) return "";
  const w = 220;
  const h = 40;
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => `${(i * step).toFixed(1)},${(h - (Math.max(0, Math.min(100, p.score)) / 100) * h).toFixed(1)}`).join(" ");
  return `<svg class="rp-spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-hidden="true"><polyline fill="none" stroke="${escapeHtml(color)}" stroke-width="2" points="${coords}"/></svg>`;
}

/**
 * The report as a full HTML page. `email` adds the intro line, why the
 * recipient gets it and the unsubscribe link. Every value is escaped; the
 * brand colour was validated as #rrggbb and the logo as an https URL or our
 * own logo path.
 */
export function renderAgencyReportHtml(model, { origin = DASHBOARD_ORIGIN, email = null } = {}) {
  const p = reportParts(model);
  const { c } = p;
  const brand = model.brand;
  const color = /^#[0-9a-f]{6}$/i.test(brand.color) ? brand.color : DEFAULT_BRAND_COLOR;
  const logo = logoSrc(brand, origin);
  const tag = REPORT_LANG_TAG[model.lang] || "en";
  const out = [];
  out.push(`<div class="rp-band" style="background:${color}"></div>`);
  out.push(`<header class="rp-head"><div class="rp-brand">${logo ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(brand.name)}">` : ""}<span class="rp-agency">${escapeHtml(brand.name)}</span></div>`
    + `<div class="rp-meta"><h1>${escapeHtml(c.title)}</h1><p>${escapeHtml(fill(c.preparedFor, { site: model.site.label }))}</p><p>${escapeHtml(fill(c.period, { month: p.month }))}</p>`
    + `${brand.agency ? `<p>${escapeHtml(fill(c.preparedBy, { agency: brand.name }))}</p>` : ""}</div></header>`);
  out.push('<div class="rp-body">');
  if (email) out.push(`<section class="rp-sec"><p class="rp-mail">${escapeHtml(fill(c.emailIntro, { agency: brand.name, site: model.site.label, month: p.month }))}</p></section>`);

  out.push(`<section class="rp-sec"><h2>${escapeHtml(c.scoreHeading)}</h2><p class="rp-lead">${escapeHtml(c.scoreLead)}</p>`);
  if (p.score) {
    out.push(`<div class="rp-score"><strong>${escapeHtml(p.score.value)}</strong><span class="rp-of">/ 100</span><span class="rp-pill ${escapeHtml(model.score.band)}">${escapeHtml(p.score.band)}</span>${p.score.delta ? `<span>${escapeHtml(p.score.delta)}</span>` : ""}</div>`);
    for (const line of p.score.lines) out.push(`<p class="rp-small" data-score-v2>${escapeHtml(line)}</p>`);
    out.push(`<p class="rp-small">${escapeHtml(p.score.samples)}</p>`);
    if (!email) out.push(sparkline(model.score.points, color));
  } else out.push(`<p>${escapeHtml(c.scoreNone)}</p>`);
  out.push("</section>");

  const fixedList = model.fixed.length
    ? `<ul class="rp-list">${model.fixed.map((f) => `<li><span class="rp-q">${escapeHtml(f.label)}</span><span class="rp-tag ok">✓</span></li>`).join("")}</ul>`
    : `<p class="rp-small">${escapeHtml(c.fixedNone)}</p>`;
  const openList = model.open.length
    ? `<ul class="rp-list">${model.open.map((f) => `<li><span class="rp-q">${escapeHtml(f.label)}</span><span class="rp-tag ${f.status === "bad" ? "bad" : "warn"}">${escapeHtml(f.status === "bad" ? c.statusBad : c.statusWarn)}</span></li>`).join("")}</ul>`
    : `<p class="rp-small">${escapeHtml(c.openNone)}</p>`;
  out.push(`<section class="rp-sec"><div class="rp-cols"><div><h2>${escapeHtml(c.fixedHeading)}</h2>${fixedList}</div><div><h2>${escapeHtml(c.openHeading)}</h2>${openList}</div></div></section>`);

  out.push(`<section class="rp-sec"><h2>${escapeHtml(p.aiHeading)}</h2>`);
  if (p.ai.none) out.push(`<p>${escapeHtml(p.ai.none)}</p>`);
  else {
    out.push(`<p class="rp-lead">${escapeHtml(p.ai.lead)}</p><p><b>${escapeHtml(p.ai.result)}</b>${p.ai.change ? ` <span class="rp-small">${escapeHtml(p.ai.change)}</span>` : ""}</p>`);
    if (p.ai.questions.length) {
      out.push(`<ul class="rp-list">${p.ai.questions.map((q) => `<li><span class="rp-q">${escapeHtml(q.q)}</span><span>${q.tags.map((t) => `<span class="rp-tag${q.hit ? " ok" : ""}">${escapeHtml(t)}</span>`).join(" ")}</span></li>`).join("")}</ul>`);
    }
    if (p.ai.others) out.push(`<p class="rp-small">${escapeHtml(p.ai.others)}</p>`);
    if (p.ai.when) out.push(`<p class="rp-small">${escapeHtml(p.ai.when)}</p>`);
  }
  out.push("</section>");

  if (p.offsite) {
    out.push(`<section class="rp-sec"><h2>${escapeHtml(c.offsiteHeading)}</h2><p><span class="rp-tag ${p.offsite.ok ? "ok" : "warn"}">${p.offsite.ok ? "✓" : "!"}</span> ${escapeHtml(p.offsite.line)}</p>${p.offsite.when ? `<p class="rp-small">${escapeHtml(p.offsite.when)}</p>` : ""}</section>`);
  }

  out.push(`<section class="rp-sec"><h2>${escapeHtml(c.nextHeading)}</h2><ol class="rp-next">${p.next.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ol>`
    + `<p class="rp-notice">${escapeHtml(c.notice)}</p></section>`);
  out.push("</div>");

  const foot = [];
  if (brand.agency) {
    const contact = [];
    if (brand.contact_email && validEmail(brand.contact_email)) contact.push(`<a href="mailto:${escapeHtml(brand.contact_email)}">${escapeHtml(brand.contact_email)}</a>`);
    const url = brand.contact_url ? safeHttpsUrl(brand.contact_url) : null;
    if (url) contact.push(`<a href="${escapeHtml(url)}" rel="noopener">${escapeHtml(url.replace(/^https:\/\//, "").replace(/\/$/, ""))}</a>`);
    foot.push(`<p><b>${escapeHtml(fill(c.contact, { agency: brand.name }))}</b>${contact.length ? ` · ${contact.join(" · ")}` : ""}</p>`);
    if (brand.footer_text) foot.push(`<p>${escapeHtml(brand.footer_text).replace(/\n/g, "<br>")}</p>`);
  }
  if (email) {
    foot.push(`<p>${escapeHtml(fill(c.emailWhy, { agency: brand.name, site: model.site.label }))}</p>`);
    if (email.unsubscribeUrl) foot.push(`<p><a href="${escapeHtml(email.unsubscribeUrl)}">${escapeHtml(c.unsubscribe)}</a></p>`);
  }
  if (model.powered_by) foot.push(`<p class="rp-powered">${escapeHtml(c.poweredBy)}</p>`);

  const title = `${c.title} – ${model.site.label} – ${p.month}`;
  return `<!doctype html><html lang="${escapeHtml(tag)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title><style>${REPORT_CSS}.rp-sec h2{border-left-color:${color}}</style></head>`
    + `<body><main class="rp">${out.join("")}<footer class="rp-foot">${foot.join("")}</footer></main></body></html>`;
}

/** The plain-text twin of the email. */
export function renderAgencyReportText(model, { unsubscribeUrl = null } = {}) {
  const p = reportParts(model);
  const { c } = p;
  const brand = model.brand;
  const lines = [];
  lines.push(`${brand.name} — ${c.title}`);
  lines.push(fill(c.preparedFor, { site: model.site.label }));
  lines.push(fill(c.period, { month: p.month }));
  lines.push("");
  lines.push(fill(c.emailIntro, { agency: brand.name, site: model.site.label, month: p.month }));
  lines.push("");
  lines.push(`■ ${c.scoreHeading}`);
  if (p.score) {
    lines.push(`  ${p.score.value} / 100 (${p.score.band})${p.score.delta ? ` — ${p.score.delta}` : ""}`);
    for (const line of p.score.lines) lines.push(`  ${line}`);
    lines.push(`  ${p.score.samples}`);
  } else lines.push(`  ${c.scoreNone}`);
  lines.push("");
  lines.push(`■ ${c.fixedHeading}`);
  if (model.fixed.length) for (const f of model.fixed) lines.push(`  ✓ ${f.label}`); else lines.push(`  ${c.fixedNone}`);
  lines.push(`■ ${c.openHeading}`);
  if (model.open.length) for (const f of model.open) lines.push(`  - ${f.label} (${f.status === "bad" ? c.statusBad : c.statusWarn})`); else lines.push(`  ${c.openNone}`);
  lines.push("");
  lines.push(`■ ${p.aiHeading}`);
  if (p.ai.none) lines.push(`  ${p.ai.none}`);
  else {
    lines.push(`  ${p.ai.lead}`);
    lines.push(`  ${p.ai.result}${p.ai.change ? ` (${p.ai.change})` : ""}`);
    for (const q of p.ai.questions) lines.push(`  - ${q.q} [${q.tags.join(", ")}]`);
    if (p.ai.others) lines.push(`  ${p.ai.others}`);
  }
  if (p.offsite) { lines.push(""); lines.push(`■ ${c.offsiteHeading}`); lines.push(`  ${p.offsite.line}`); }
  lines.push("");
  lines.push(`■ ${c.nextHeading}`);
  p.next.forEach((line, i) => lines.push(`  ${i + 1}. ${line}`));
  lines.push("");
  lines.push(c.notice);
  lines.push("");
  if (brand.agency) {
    lines.push(fill(c.contact, { agency: brand.name }) + [brand.contact_email, brand.contact_url].filter(Boolean).map((v) => ` · ${v}`).join(""));
    if (brand.footer_text) lines.push(brand.footer_text);
  }
  lines.push(fill(c.emailWhy, { agency: brand.name, site: model.site.label }));
  if (unsubscribeUrl) lines.push(`${c.unsubscribe}: ${unsubscribeUrl}`);
  if (model.powered_by) lines.push(c.poweredBy);
  return `${lines.join("\n")}\n`;
}

/** Subject, text and HTML for one recipient. */
export function agencyReportEmail(model, { origin = DASHBOARD_ORIGIN, unsubscribeUrl = null } = {}) {
  const c = reportCopy(model.lang);
  return {
    subject: singleLine(fill(c.emailSubject, { site: model.site.label, month: monthLabel(model.month, model.lang) })).slice(0, 200),
    text: renderAgencyReportText(model, { unsubscribeUrl }),
    html: renderAgencyReportHtml(model, { origin, email: { unsubscribeUrl } }),
  };
}

/**
 * The From header: "<Agency> via Nurevo" <address of MAIL_FROM>. The name is
 * reduced to plain characters and quoted, so it cannot add a header or an
 * address of its own.
 */
export function agencyFrom(agencyName, mailFrom) {
  const raw = String(mailFrom || "").trim();
  const address = (raw.match(/<([^<>\s]+@[^<>\s]+)>/) || [])[1] || (/^[^\s<>"]+@[^\s<>"]+$/.test(raw) ? raw : null);
  if (!address) return raw;
  const name = singleLine(agencyName).replace(/["\\<>]/g, "").slice(0, 60).trim();
  return `"${name ? `${name} via Nurevo` : "Nurevo"}" <${address}>`;
}

/* ------------------------------------------------------------------ *
 * Unsubscribe (per site and recipient)
 * ------------------------------------------------------------------ */

const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (value) => Uint8Array.from(atob(String(value).replace(/-/g, "+").replace(/_/g, "/") + "===".slice((String(value).length + 3) % 4)), (c) => c.charCodeAt(0));
const utf8 = (value) => new TextEncoder().encode(value);

async function reportMac(secret, siteId, email) {
  const key = await crypto.subtle.importKey("raw", utf8(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, utf8(`nurevo-unsubscribe-v1:agency-report:${siteId}:${String(email).toLowerCase()}`)));
}

export async function reportUnsubscribeToken(env, siteId, email) {
  const secret = String(env.EMAIL_UNSUBSCRIBE_SECRET || "").trim();
  if (!secret || !siteId || !email) return null;
  const normalized = String(email).trim().toLowerCase();
  return `${b64url(utf8(String(siteId)))}.${b64url(utf8(normalized))}.${b64url(await reportMac(secret, siteId, normalized))}`;
}

export async function verifyReportUnsubscribeToken(env, token) {
  const secret = String(env.EMAIL_UNSUBSCRIBE_SECRET || "").trim();
  const [sitePart, emailPart, macPart, extra] = String(token || "").split(".");
  if (!secret || !sitePart || !emailPart || !macPart || extra !== undefined) return null;
  try {
    const siteId = new TextDecoder().decode(fromB64url(sitePart));
    const email = new TextDecoder().decode(fromB64url(emailPart));
    const expected = await reportMac(secret, siteId, email);
    const given = fromB64url(macPart);
    if (given.length !== expected.length) return null;
    let diff = 0;
    for (let i = 0; i < given.length; i += 1) diff |= given[i] ^ expected[i];
    return diff === 0 && email.includes("@") && siteId ? { siteId, email } : null;
  } catch {
    return null;
  }
}

export async function reportUnsubscribeUrl(env, siteId, email, lang) {
  const token = await reportUnsubscribeToken(env, siteId, email);
  if (!token) return null;
  const origin = String(env.PUBLIC_ORIGIN || DASHBOARD_ORIGIN).replace(/\/+$/, "");
  return `${origin}${REPORT_UNSUBSCRIBE_PATH}?t=${encodeURIComponent(token)}&l=${encodeURIComponent(REPORT_BODY_LANGS.includes(lang) ? lang : "en")}`;
}

/** Opted out of this site's report, or of every report sent through Nurevo. */
export async function isReportOptedOut(env, siteId, email) {
  const address = String(email).toLowerCase();
  const row = await env.DB.prepare("SELECT 1 AS x FROM agency_report_opt_outs WHERE site_id=? AND email=? LIMIT 1").bind(siteId, address).first();
  if (row) return true;
  return isGloballySuppressed(env, address);
}

/** On the global list: unsubscribed from all reports sent through Nurevo. */
export async function isGloballySuppressed(env, email) {
  const row = await env.DB.prepare("SELECT 1 AS x FROM agency_report_suppressions WHERE email=? LIMIT 1").bind(String(email).toLowerCase()).first();
  return !!row;
}

export async function suppressGlobally(env, email, source, now = Date.now()) {
  await env.DB.prepare("INSERT OR IGNORE INTO agency_report_suppressions (email,source,created_at) VALUES (?,?,?)").bind(String(email).toLowerCase(), source, now).run();
}

function unsubscribePage(lang, status, body, { action = "", site = "" } = {}) {
  const c = reportCopy(lang);
  const message = body === "done" ? c.unsubDone : body === "done_all" ? c.unsubAllDone : body === "invalid" ? c.unsubInvalid : fill(c.unsubPrompt, { site });
  // Two choices: this site's report, or every report sent through Nurevo.
  const form = body === "prompt"
    ? `<form method="post" action="${escapeHtml(action)}"><input type="hidden" name="scope" value="site"><button type="submit">${escapeHtml(c.unsubButton)}</button></form>`
      + `<form method="post" action="${escapeHtml(action)}" style="margin-top:12px"><input type="hidden" name="scope" value="all"><button type="submit">${escapeHtml(c.unsubAllButton)}</button></form>`
    : "";
  return new Response(
    `<!doctype html><html lang="${escapeHtml(REPORT_LANG_TAG[lang] || "en")}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(c.unsubTitle)}</title><style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:3rem auto;padding:0 16px;line-height:1.6}button{font:inherit;padding:.5rem 1rem}</style></head><body><h1>${escapeHtml(c.unsubTitle)}</h1><p>${escapeHtml(message)}</p>${form}</body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'" } },
  );
}

/**
 * GET shows a confirmation (mail scanners open links, so GET records nothing);
 * POST records the opt-out: for that site and address, or with scope=all for
 * every report sent through Nurevo (the global suppression list). One-click
 * clients (RFC 8058) POST "List-Unsubscribe=One-Click" to the same URL, which
 * stops that site's report.
 */
export async function handleReportUnsubscribe(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== REPORT_UNSUBSCRIBE_PATH) return null;
  const asked = String(url.searchParams.get("l") || "");
  const lang = REPORT_BODY_LANGS.includes(asked) ? asked : "en";
  if (!["GET", "POST"].includes(request.method)) return new Response("method_not_allowed", { status: 405, headers: { allow: "GET, POST" } });
  const verified = await verifyReportUnsubscribeToken(env, url.searchParams.get("t"));
  if (!verified) return unsubscribePage(lang, 400, "invalid");
  if (request.method === "GET") {
    let site = "";
    try { site = siteLabel(await env.DB.prepare("SELECT id,url,website_uri,slug FROM sites WHERE id=? LIMIT 1").bind(verified.siteId).first() || {}); } catch { site = ""; }
    return unsubscribePage(lang, 200, "prompt", { action: `${url.pathname}${url.search}`, site });
  }
  // The form says which; a one-click POST follows the link (scope=all on the
  // "never send me reports" link of a confirmation email).
  let scope = url.searchParams.get("scope") === "all" ? "all" : "site";
  try {
    const body = await request.text();
    if (/(?:^|&)scope=all(?:&|$)/.test(body)) scope = "all";
    else if (/(?:^|&)scope=site(?:&|$)/.test(body)) scope = "site";
  } catch { /* keep the link's scope */ }
  try {
    await env.DB.prepare("INSERT OR IGNORE INTO agency_report_opt_outs (site_id,email,created_at) VALUES (?,?,?)").bind(verified.siteId, verified.email.toLowerCase(), Date.now()).run();
    if (scope === "all") await suppressGlobally(env, verified.email, "unsubscribe");
  } catch (error) {
    console.error("agency_report_unsubscribe_failed", JSON.stringify({ message: String(error?.message || error).slice(0, 120) }));
    return unsubscribePage(lang, 503, "prompt", { action: `${url.pathname}${url.search}` });
  }
  return unsubscribePage(lang, 200, scope === "all" ? "done_all" : "done");
}

/* ------------------------------------------------------------------ *
 * Who may send: eligibility
 * ------------------------------------------------------------------ */

/**
 * Whether a site's report may be switched on and sent:
 *   { ok, reason: null | "not_connected" | "plan_or_partner", plan, partner }
 * The site must be connected (siteConnection: paired plugin, detected tag,
 * or a published, complete hosted page; a site merely created on Nurevo's
 * hosting is not enough), and either on a paid plan (REPORT_PAID_PLANS) or
 * set up by an account that is an approved partner.
 */
export async function reportEligibility(env, site, { accountId = null, plan = null, now = Date.now() } = {}) {
  const fresh = site?.id && env?.DB ? await loadCheckState(env, site) : site;
  if (!fresh || fresh.deleted) return { ok: false, reason: "not_connected", plan: null, partner: false };
  const connection = siteConnection(fresh, { now });
  const sitePlan = plan || await resolveSitePlanFor(env, fresh);
  let partner = false;
  if (accountId) {
    try {
      const account = await env.DB.prepare("SELECT * FROM accounts WHERE id=? LIMIT 1").bind(accountId).first();
      partner = !!(account && isApprovedPartner(account));
    } catch (error) {
      if (!isMissing(error)) throw error;
    }
  }
  if (!connection.connected) return { ok: false, reason: "not_connected", plan: sitePlan, partner };
  if (!REPORT_PAID_PLANS.includes(sitePlan) && !partner) return { ok: false, reason: "plan_or_partner", plan: sitePlan, partner };
  return { ok: true, reason: null, plan: sitePlan, partner };
}

/* ------------------------------------------------------------------ *
 * Counters (agency_report_counters)
 * ------------------------------------------------------------------ */

const dayKey = (now) => new Date(now).toISOString().slice(0, 10);
const monthKeyOf = (now) => new Date(now).toISOString().slice(0, 7);

/** Take one from a capped counter; false when the cap is reached. Atomic. */
export async function takeCounter(env, scope, period, cap, now = Date.now()) {
  if (!(cap > 0)) return false;
  await env.DB.prepare("INSERT OR IGNORE INTO agency_report_counters (scope,period,count,updated_at) VALUES (?,?,0,?)").bind(scope, period, now).run();
  const result = await env.DB.prepare("UPDATE agency_report_counters SET count=count+1, updated_at=? WHERE scope=? AND period=? AND count+1<=?").bind(now, scope, period, cap).run();
  return changes(result) > 0;
}

async function giveBackCounter(env, scope, period, now = Date.now()) {
  try {
    await env.DB.prepare("UPDATE agency_report_counters SET count=MAX(0,count-1), updated_at=? WHERE scope=? AND period=?").bind(now, scope, period).run();
  } catch { /* the slot stays taken: errs on the side of sending less */ }
}

export function reportLimits(env = {}) {
  const n = (raw, fallback) => numberFromEnv(raw, fallback, 0, 100000);
  return {
    confirmsPerSiteDay: n(env.AGENCY_REPORT_CONFIRMS_PER_SITE_DAY, AGENCY_REPORT_CONFIRMS_PER_SITE_DAY_DEFAULT),
    confirmsPerAccountDay: n(env.AGENCY_REPORT_CONFIRMS_PER_ACCOUNT_DAY, AGENCY_REPORT_CONFIRMS_PER_ACCOUNT_DAY_DEFAULT),
    emailsPerAccountMonth: n(env.AGENCY_REPORT_ACCOUNT_MONTHLY_EMAILS, AGENCY_REPORT_ACCOUNT_MONTHLY_EMAILS_DEFAULT),
  };
}

/* ------------------------------------------------------------------ *
 * Double opt-in (agency_report_recipients)
 * ------------------------------------------------------------------ */

async function confirmMac(secret, siteId, email, expires) {
  const key = await crypto.subtle.importKey("raw", utf8(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, utf8(`nurevo-report-confirm-v1:${siteId}:${String(email).toLowerCase()}:${expires}`)));
}

export async function reportConfirmToken(env, siteId, email, expires) {
  const secret = String(env.EMAIL_UNSUBSCRIBE_SECRET || "").trim();
  if (!secret || !siteId || !email || !Number.isFinite(expires)) return null;
  const normalized = String(email).trim().toLowerCase();
  return [b64url(utf8(String(siteId))), b64url(utf8(normalized)), String(Math.floor(expires)), b64url(await confirmMac(secret, siteId, normalized, Math.floor(expires)))].join(".");
}

/** { siteId, email, expires } for a valid, unexpired token, else null. */
export async function verifyReportConfirmToken(env, token, now = Date.now()) {
  const secret = String(env.EMAIL_UNSUBSCRIBE_SECRET || "").trim();
  const [sitePart, emailPart, expPart, macPart, extra] = String(token || "").split(".");
  if (!secret || !sitePart || !emailPart || !/^\d{1,15}$/.test(expPart || "") || !macPart || extra !== undefined) return null;
  try {
    const siteId = new TextDecoder().decode(fromB64url(sitePart));
    const email = new TextDecoder().decode(fromB64url(emailPart));
    const expires = Number(expPart);
    const expected = await confirmMac(secret, siteId, email, expires);
    const given = fromB64url(macPart);
    if (given.length !== expected.length) return null;
    let diff = 0;
    for (let i = 0; i < given.length; i += 1) diff |= given[i] ^ expected[i];
    if (diff !== 0 || !email.includes("@") || !siteId) return null;
    if (expires <= now) return null;
    return { siteId, email, expires };
  } catch {
    return null;
  }
}

export async function reportConfirmUrl(env, siteId, email, expires, lang) {
  const token = await reportConfirmToken(env, siteId, email, expires);
  if (!token) return null;
  const origin = String(env.PUBLIC_ORIGIN || DASHBOARD_ORIGIN).replace(/\/+$/, "");
  return `${origin}${REPORT_CONFIRM_PATH}?t=${encodeURIComponent(token)}&l=${encodeURIComponent(REPORT_BODY_LANGS.includes(lang) ? lang : "en")}`;
}

/** Each recipient row of a site: email -> { status, requested_at, confirm_expires_at, confirmed_at }. */
export async function loadRecipientRows(env, siteId) {
  const { results } = await env.DB.prepare("SELECT email,status,requested_at,confirm_expires_at,confirmed_at FROM agency_report_recipients WHERE site_id=?").bind(siteId).all();
  return new Map((results || []).map((row) => [String(row.email).toLowerCase(), row]));
}

/**
 * What the dashboard shows per recipient: confirmed | pending | opted_out.
 * (opted_out covers the site's own opt-out and the global list.)
 */
export async function recipientStatuses(env, siteId, recipients) {
  const rows = await loadRecipientRows(env, siteId);
  const out = [];
  for (const email of recipients) {
    let status = rows.get(email)?.status === "confirmed" ? "confirmed" : "pending";
    if (await isReportOptedOut(env, siteId, email)) status = "opted_out";
    const row = rows.get(email);
    out.push({ email, status, requested_at: row?.requested_at ?? null, confirmed_at: row?.confirmed_at ?? null });
  }
  return out;
}

/** The confirmation email for one address. */
export function confirmationEmail({ lang, agency, sender, site, confirmUrl, neverUrl, expires }) {
  const c = reportCopy(lang);
  const date = dateLabel(expires, lang);
  const subject = singleLine(fill(c.confirmSubject, { sender, site })).slice(0, 200);
  const text = [
    fill(c.confirmIntro, { sender, site }), "", fill(c.confirmAsk, {}), "",
    `${c.confirmButton}: ${confirmUrl}`, fill(c.confirmExpires, { date }), "",
    neverUrl ? `${c.confirmNever}: ${neverUrl}` : "", fill(c.confirmFooter, { agency }),
  ].filter((line, i, all) => line !== "" || all[i - 1] !== "").join("\n");
  const html = `<!doctype html><html lang="${escapeHtml(REPORT_LANG_TAG[lang] || "en")}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>`
    + `<body style="font-family:system-ui,sans-serif;line-height:1.65;color:#1d1d24;max-width:560px;margin:0 auto;padding:16px">`
    + `<p>${escapeHtml(fill(c.confirmIntro, { sender, site }))}</p><p>${escapeHtml(c.confirmAsk)}</p>`
    + `<p><a href="${escapeHtml(confirmUrl)}" style="display:inline-block;background:#6f4df6;color:#fff;text-decoration:none;border-radius:8px;padding:10px 16px;font-weight:700">${escapeHtml(c.confirmButton)}</a></p>`
    + `<p style="font-size:12px;color:#6b6b78">${escapeHtml(fill(c.confirmExpires, { date }))}</p>`
    + (neverUrl ? `<p style="font-size:12px"><a href="${escapeHtml(neverUrl)}" style="color:#6b6b78">${escapeHtml(c.confirmNever)}</a></p>` : "")
    + `<p style="font-size:12px;color:#6b6b78">${escapeHtml(fill(c.confirmFooter, { agency }))}</p></body></html>`;
  return { subject, text: `${text}\n`, html };
}

/**
 * After the recipients were saved: drop rows of addresses no longer listed,
 * and send a confirmation email to each listed address that is not confirmed,
 * not opted out, and not asked in the last REPORT_CONFIRM_RESEND_MS - within
 * the per-site and per-account daily caps. Returns counts only:
 *   { sent, limited, failed, skipped }
 */
export async function requestConfirmations(env, site, settings, { accountId = null, memberId = null, canManage = null, now = Date.now(), fetchImpl = fetch } = {}) {
  const summary = { sent: 0, limited: 0, failed: 0, skipped: 0 };
  const recipients = settings.recipients || [];
  if (recipients.length) {
    const marks = recipients.map(() => "?").join(",");
    await env.DB.prepare(`DELETE FROM agency_report_recipients WHERE site_id=? AND email NOT IN (${marks})`).bind(site.id, ...recipients).run();
  } else {
    await env.DB.prepare("DELETE FROM agency_report_recipients WHERE site_id=?").bind(site.id).run();
    return summary;
  }
  const rows = await loadRecipientRows(env, site.id);
  const limits = reportLimits(env);
  const ready = mailConfigured(env) && String(env.EMAIL_UNSUBSCRIBE_SECRET || "").trim();
  let branding = null;
  let lang = reportLanguage(settings.locale).lang;
  for (const email of recipients) {
    const row = rows.get(email);
    if (!row) {
      await env.DB.prepare("INSERT OR IGNORE INTO agency_report_recipients (site_id,email,status,requested_at,requested_by,confirm_expires_at,confirmed_at,created_at) VALUES (?,?,'pending',NULL,?,NULL,NULL,?)")
        .bind(site.id, email, memberId, now).run();
    }
    if (row?.status === "confirmed") continue;
    if (row?.requested_at && now - Number(row.requested_at) < REPORT_CONFIRM_RESEND_MS) { summary.skipped += 1; continue; }
    if (await isReportOptedOut(env, site.id, email)) { summary.skipped += 1; continue; }
    if (!ready) { summary.failed += 1; continue; }
    const day = dayKey(now);
    if (!await takeCounter(env, `confirm:site:${site.id}`, day, limits.confirmsPerSiteDay, now)) { summary.limited += 1; continue; }
    if (accountId && !await takeCounter(env, `confirm:acct:${accountId}`, day, limits.confirmsPerAccountDay, now)) {
      await giveBackCounter(env, `confirm:site:${site.id}`, day, now);
      summary.limited += 1; continue;
    }
    if (branding === null) branding = (await resolveBranding(env, site, settings, { canManage, viewerAccountId: accountId })) || false;
    const agency = branding ? branding.display_name : "Nurevo";
    const sender = branding ? `${branding.display_name} via Nurevo` : "Nurevo";
    const expires = now + REPORT_CONFIRM_TTL_MS;
    const confirmUrl = await reportConfirmUrl(env, site.id, email, expires, lang);
    const neverUrl = await reportUnsubscribeUrl(env, site.id, email, lang);
    const message = confirmationEmail({ lang, agency, sender, site: siteLabel(site), confirmUrl, neverUrl: neverUrl ? `${neverUrl}&scope=all` : null, expires });
    const result = await sendResendEmail(env, {
      to: email,
      ...message,
      from: agencyFrom(branding ? branding.display_name : "", env.MAIL_FROM),
      headers: neverUrl ? { "List-Unsubscribe": `<${neverUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : undefined,
      idempotencyKey: `nurevo-agency-report-confirm-${site.id}-${await shortHash(email)}-${day}`,
      fetchImpl,
    });
    if (result.ok) {
      await env.DB.prepare("UPDATE agency_report_recipients SET requested_at=?, requested_by=?, confirm_expires_at=? WHERE site_id=? AND email=? AND status='pending'")
        .bind(now, memberId, expires, site.id, email).run();
      summary.sent += 1;
    } else {
      summary.failed += 1;
      console.error("agency_report_confirm_send_failed", JSON.stringify({ site_id: site.id, code: result.code }));
    }
  }
  return summary;
}

function confirmPage(lang, status, body, { action = "", site = "", agency = "" } = {}) {
  const c = reportCopy(lang);
  const message = body === "done" ? fill(c.confirmDone, { site }) : body === "invalid" ? c.confirmInvalid : fill(c.confirmPrompt, { site, agency });
  const form = body === "prompt" ? `<form method="post" action="${escapeHtml(action)}"><button type="submit">${escapeHtml(c.confirmButton)}</button></form>` : "";
  return new Response(
    `<!doctype html><html lang="${escapeHtml(REPORT_LANG_TAG[lang] || "en")}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(c.confirmTitle)}</title><style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:3rem auto;padding:0 16px;line-height:1.6}button{font:inherit;padding:.5rem 1rem}</style></head><body><h1>${escapeHtml(c.confirmTitle)}</h1><p>${escapeHtml(message)}</p>${form}</body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'" } },
  );
}

/**
 * GET /api/email/report-confirm shows the question (scanners open links, so
 * GET records nothing); POST confirms that address for that site, while the
 * signed link is unexpired and the address is still a pending recipient.
 */
export async function handleReportConfirm(request, env, { now = Date.now() } = {}) {
  const url = new URL(request.url);
  if (url.pathname !== REPORT_CONFIRM_PATH) return null;
  const asked = String(url.searchParams.get("l") || "");
  const lang = REPORT_BODY_LANGS.includes(asked) ? asked : "en";
  if (!["GET", "POST"].includes(request.method)) return new Response("method_not_allowed", { status: 405, headers: { allow: "GET, POST" } });
  const verified = await verifyReportConfirmToken(env, url.searchParams.get("t"), now);
  if (!verified) return confirmPage(lang, 400, "invalid");
  let row = null;
  let site = null;
  try {
    row = await env.DB.prepare("SELECT status,confirm_expires_at FROM agency_report_recipients WHERE site_id=? AND email=? LIMIT 1").bind(verified.siteId, verified.email).first();
    site = await env.DB.prepare("SELECT * FROM sites WHERE id=? LIMIT 1").bind(verified.siteId).first();
  } catch (error) {
    if (!isMissing(error)) throw error;
  }
  // The link is for the request it was sent with: a removed recipient, a
  // deleted site or a superseded request (a newer link) is not confirmed.
  if (!row || !site || Number(row.confirm_expires_at) !== verified.expires) return confirmPage(lang, 400, "invalid");
  const label = siteLabel(site);
  if (row.status === "confirmed") return confirmPage(lang, 200, "done", { site: label });
  if (request.method === "GET") {
    let agency = "Nurevo";
    try {
      const settings = await loadReportSettings(env, site.id);
      const branding = await resolveBranding(env, site, settings);
      if (branding) agency = branding.display_name;
    } catch { agency = "Nurevo"; }
    return confirmPage(lang, 200, "prompt", { action: `${url.pathname}${url.search}`, site: label, agency });
  }
  await env.DB.prepare("UPDATE agency_report_recipients SET status='confirmed', confirmed_at=? WHERE site_id=? AND email=? AND status='pending'").bind(now, verified.siteId, verified.email).run();
  // Confirming is an explicit new opt-in for this site.
  await env.DB.prepare("DELETE FROM agency_report_opt_outs WHERE site_id=? AND email=?").bind(verified.siteId, verified.email).run();
  return confirmPage(lang, 200, "done", { site: label });
}

/* ------------------------------------------------------------------ *
 * Building one site's report (shared by the preview and the cron)
 * ------------------------------------------------------------------ */

export async function buildSiteReport(env, site, { month, locale, settings = null, canManage = null, viewerAccountId = null, plan = null, now = Date.now() } = {}) {
  const period = /^\d{4}-\d{2}$/.test(String(month || "")) ? month : previousMonthKey(now);
  const sitePlan = plan || await resolveSitePlanFor(env, site);
  const [data, branding] = await Promise.all([
    collectReportData(env, site, period),
    resolveBranding(env, site, settings, { canManage, viewerAccountId }),
  ]);
  return buildAgencyReport({ site, plan: sitePlan, month: period, locale: locale || settings?.locale || "en", ...data, branding, now });
}

/* ------------------------------------------------------------------ *
 * Monthly sending (hourly cron, 1st-3rd UTC)
 * ------------------------------------------------------------------ */

function numberFromEnv(raw, fallback, min, max) {
  const value = Number(raw);
  return raw === undefined || raw === null || String(raw).trim() === "" || !Number.isFinite(value) ? fallback : Math.max(min, Math.min(max, Math.floor(value)));
}

async function claimSend(env, siteId, month, email, now) {
  const result = await env.DB.prepare("INSERT OR IGNORE INTO agency_report_sends (site_id,month,email,status,created_at) VALUES (?,?,?,'claimed',?)").bind(siteId, month, email, now).run();
  return changes(result) === 1;
}

async function settleSend(env, siteId, month, email, status, detail = null) {
  try {
    await env.DB.prepare("UPDATE agency_report_sends SET status=?, detail=?, sent_at=? WHERE site_id=? AND month=? AND email=?")
      .bind(status, detail ? String(detail).slice(0, 120) : null, Date.now(), siteId, month, email).run();
  } catch { /* the claim stands, which is what prevents a resend */ }
}

async function releaseSend(env, siteId, month, email) {
  try {
    await env.DB.prepare("DELETE FROM agency_report_sends WHERE site_id=? AND month=? AND email=? AND status='claimed'").bind(siteId, month, email).run();
  } catch { /* stays claimed: no resend */ }
}

/**
 * One bounded pass. Only on days 1..REPORT_SEND_LAST_DAY (UTC), for the
 * previous month. Each recipient is claimed before the send; a site is marked
 * done ('*') once every recipient was handled, so later runs skip it in SQL.
 * A 429 releases that claim and stops the run; any other failure keeps it
 * (the provider may have accepted the message).
 */
export async function runAgencyReportBatch(env, { now = Date.now(), fetchImpl = fetch, canManage = null, limit, emailsPerRun, spacingMs, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const summary = { status: "sent", month: null, sites: 0, sent: 0, suppressed: 0, failed: 0, skipped: 0, done_sites: 0 };
  const day = new Date(now).getUTCDate();
  if (day > REPORT_SEND_LAST_DAY) return { ...summary, status: "outside_send_window" };
  if (!mailConfigured(env)) return { ...summary, status: "mail_not_configured" };
  if (!String(env.EMAIL_UNSUBSCRIBE_SECRET || "").trim()) return { ...summary, status: "unsubscribe_secret_missing" };
  const month = previousMonthKey(now);
  summary.month = month;
  const maxSites = numberFromEnv(limit ?? env.AGENCY_REPORT_CRON_LIMIT, AGENCY_REPORT_CRON_LIMIT_DEFAULT, 1, 500);
  const maxEmails = numberFromEnv(emailsPerRun ?? env.AGENCY_REPORT_EMAILS_PER_RUN, AGENCY_REPORT_EMAILS_PER_RUN_DEFAULT, 1, 2000);
  const spacing = numberFromEnv(spacingMs ?? env.AGENCY_REPORT_SPACING_MS, AGENCY_REPORT_SPACING_MS_DEFAULT, 0, 10000);
  let rows;
  try {
    ({ results: rows } = await env.DB.prepare(`SELECT s.*, r.site_id AS r_site_id, r.recipients_json AS r_recipients, r.locale AS r_locale,
             r.branding_source AS r_branding_source, r.brand_account_id AS r_brand_account_id, r.account_id AS r_account_id
        FROM agency_report_settings r JOIN sites s ON s.id=r.site_id
       WHERE r.enabled=1 AND r.consent_at IS NOT NULL
         AND (s.delivery_status IS NULL OR s.delivery_status='active')
         AND NOT EXISTS (SELECT 1 FROM agency_report_sends x WHERE x.site_id=r.site_id AND x.month=? AND x.email='${SITE_DONE}')
       ORDER BY r.site_id LIMIT ?`).bind(month, maxSites).all());
  } catch (error) {
    if (isMissing(error)) return { ...summary, status: "migration_pending" };
    throw error;
  }
  let emails = 0;
  let stop = null;
  const limits = reportLimits(env);
  summary.not_eligible = 0;
  summary.unconfirmed = 0;
  summary.account_capped = 0;
  for (const row of rows || []) {
    if (stop) break;
    summary.sites += 1;
    const { r_site_id: siteId, r_recipients: recipientsJson, r_locale: locale, r_branding_source: source, r_brand_account_id: brandAccountId, r_account_id: accountId, ...siteRow } = row;
    const site = { ...siteRow, id: siteId };
    const settings = {
      enabled: true, recipients: parseRecipients(recipientsJson), locale: reportLanguage(locale).locale,
      branding_source: source === "nurevo" ? "nurevo" : "agency", brand_account_id: brandAccountId ?? null, account_id: accountId ?? null,
    };
    // Connected, and paid or set up by an approved partner - re-checked at
    // send time, so a downgrade or a lost connection stops the report.
    // Without an account to charge, nothing is sent.
    const eligibility = accountId ? await reportEligibility(env, site, { accountId, now }) : { ok: false };
    if (!eligibility.ok) { summary.not_eligible += 1; continue; }
    // Double opt-in: only addresses that confirmed.
    let confirmed;
    try {
      const recipientRows = await loadRecipientRows(env, site.id);
      confirmed = settings.recipients.filter((email) => recipientRows.get(email)?.status === "confirmed");
    } catch (error) {
      if (isMissing(error)) return { ...summary, status: "migration_pending" };
      throw error;
    }
    summary.unconfirmed += settings.recipients.length - confirmed.length;
    let model = null;
    let complete = true;
    for (const email of confirmed) {
      if (emails >= maxEmails) { stop = "email_limit"; complete = false; break; }
      let claimed;
      try { claimed = await claimSend(env, site.id, month, email, now); } catch (error) {
        if (isMissing(error)) return { ...summary, status: "migration_pending" };
        throw error;
      }
      if (!claimed) continue;
      try {
        if (await isReportOptedOut(env, site.id, email)) { await settleSend(env, site.id, month, email, "suppressed", "opted_out"); summary.suppressed += 1; continue; }
      } catch {
        // Cannot tell whether they opted out: do not send.
        await releaseSend(env, site.id, month, email); complete = false; summary.skipped += 1; continue;
      }
      // The account's monthly email cap: past it, this month's report to this
      // address is recorded as suppressed rather than retried every hour.
      if (!await takeCounter(env, `emails:acct:${accountId}`, monthKeyOf(now), limits.emailsPerAccountMonth, now)) {
        await settleSend(env, site.id, month, email, "suppressed", "account_cap"); summary.account_capped += 1; continue;
      }
      try {
        model = model || await buildSiteReport(env, site, { month, settings, canManage, now });
      } catch (error) {
        await releaseSend(env, site.id, month, email);
        await giveBackCounter(env, `emails:acct:${accountId}`, monthKeyOf(now), now);
        console.error("agency_report_build_failed", JSON.stringify({ site_id: site.id, message: String(error?.message || error).slice(0, 120) }));
        complete = false; summary.failed += 1; break;
      }
      const unsubscribe = await reportUnsubscribeUrl(env, site.id, email, model.lang);
      const message = agencyReportEmail(model, { origin: String(env.PUBLIC_ORIGIN || DASHBOARD_ORIGIN), unsubscribeUrl: unsubscribe });
      emails += 1;
      const result = await sendResendEmail(env, {
        to: email,
        ...message,
        from: agencyFrom(model.brand.agency ? model.brand.name : "", env.MAIL_FROM),
        replyTo: model.brand.agency && model.brand.contact_email ? model.brand.contact_email : undefined,
        headers: { "List-Unsubscribe": `<${unsubscribe}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        idempotencyKey: `nurevo-agency-report-${site.id}-${month}-${await shortHash(email)}`,
        fetchImpl,
      });
      if (result.ok) { await settleSend(env, site.id, month, email, "sent"); summary.sent += 1; }
      else if (result.status === 429) { await releaseSend(env, site.id, month, email); await giveBackCounter(env, `emails:acct:${accountId}`, monthKeyOf(now), now); stop = "rate_limited"; complete = false; break; }
      else { await settleSend(env, site.id, month, email, "failed", result.code); summary.failed += 1; console.error("agency_report_send_failed", JSON.stringify({ site_id: site.id, code: result.code })); }
      if (spacing > 0) await sleep(spacing);
    }
    if (complete && !stop) {
      await env.DB.prepare("INSERT OR IGNORE INTO agency_report_sends (site_id,month,email,status,created_at,sent_at) VALUES (?,?,?,'done',?,?)").bind(site.id, month, SITE_DONE, now, Date.now()).run();
      summary.done_sites += 1;
    }
  }
  if (stop) summary.status = stop;
  return summary;
}

async function shortHash(value) {
  return (await sha256Hex(utf8(String(value).toLowerCase()))).slice(0, 16);
}
