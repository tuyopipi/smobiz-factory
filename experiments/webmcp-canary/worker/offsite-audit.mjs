/**
 * Off-site listing audit: does the business look the same everywhere an AI
 * assistant might read about it?
 *
 * Assistants recommend local businesses largely from listings that are not the
 * business's own site - map listings (Google Maps, Bing Places, which ChatGPT's
 * search draws on, Apple Maps), portals (食べログ, ホットペッパー) and social
 * profiles. A name, address, phone number or opening hours that disagree
 * between those and the site make the business harder to identify as one
 * entity. This compares the store profile Nurevo holds (the SSOT in
 * site_settings) with those listings, field by field, and says what to fix.
 *
 * What is checked automatically and what is not, and why:
 *
 *   Google Places API (New)   automatic, when GOOGLE_MAPS_API_KEY is set.
 *                             Text Search / Place Details with a field mask of
 *                             id, displayName, formattedAddress, phone, hours,
 *                             businessStatus and attributions. Terms allow
 *                             caching place_id only (and lat/lng for 30 days,
 *                             which this does not use), so what is stored is
 *                             the place_id and our own comparison outcome -
 *                             never Google's name, address, phone, hours,
 *                             similarity scores or attributions. Those are
 *                             returned once, in the response of the run that
 *                             fetched them, and shown with the "Google Maps"
 *                             attribution (plus any third-party provider
 *                             Google names), as the Places API policies ask
 *                             for Places data shown without a Google map.
 *   ホットペッパーグルメ       manual. The Recruit Web Service guideline forbids
 *                             use on sites of businesses that take money from
 *                             restaurants (Nurevo does), and the API returns no
 *                             phone number anyway.
 *   ホットペッパービューティー manual. No public API is offered.
 *   Bing Places               manual. The Bing Search APIs (including local
 *                             business search) were retired on 2025-08-11, Bing
 *                             Maps for Enterprise no longer takes new free
 *                             accounts, and Azure Maps POI data is not Bing
 *                             Places data, so it would answer a different
 *                             question. Never scraped.
 *   Apple Business Connect    manual. Its API is for approved partners only.
 *   Yahoo!プレイス            manual. YOLP local search forbids storing results
 *                             and its commercial-use conditions are not settled
 *                             for this use.
 *   食べログ                   manual. No API; its terms forbid copying or
 *                             storing its information without consent.
 *   Instagram / Facebook      manual. Reading a business's own profile needs the
 *                             owner's OAuth grant, which Nurevo does not hold.
 *
 * Honesty rules, the same as the rest of Nurevo:
 *   - A missing key is "not configured", not "not found".
 *   - Nothing is guessed. Hours that cannot be parsed are "cannot be compared",
 *     not "match". Two plausible listings are "ambiguous" until the owner picks.
 *   - A value Nurevo itself imported from Google is compared with Google all the
 *     same, but flagged, because agreement there proves little.
 *   - No promise that fixing anything changes what an assistant says.
 *
 * Spending is bounded in two places, both reserved in D1 with single atomic
 * statements BEFORE any Places call, so parallel requests cannot overspend:
 *   - the owner's allowance (offsite_audit_usage: UPDATE ... SET n=n+1 WHERE
 *     n < limit AND no reservation in the last 10 minutes), refunded when the
 *     run made no useful call (rate_limited, error, skipped);
 *   - the all-sites daily ceiling (offsite_api_budget: one upsert per call,
 *     DO UPDATE SET n=n+1 WHERE n < ceiling).
 * The Google Cloud per-day quota on the key is the outer bound (owner setup).
 *
 * Env:
 *   GOOGLE_MAPS_API_KEY              Places API (New) key; absent = not configured
 *   OFFSITE_GOOGLE_DAILY_LIMIT       ceiling on Places calls per UTC day, all sites (default 300)
 *   OFFSITE_AUDIT_CRON_LIMIT         sites audited per daily cron run (default 100, i.e.
 *                                    weekly audits for up to ~700 Standard/Pro sites)
 */

import { rowToProfile, parseFieldSources } from "./site-profile.mjs";
import { resolveSitePlan, resolveSitePlanFor } from "./billing-plan.mjs";

export const OFFSITE_AUDIT_VERSION = 1;

export const OFFSITE_LIMITS = Object.freeze({
  // Free: one on-demand audit per calendar month (Asia/Tokyo).
  freeManualPerMonth: 1,
  // Standard / Pro: on demand, at most this many a day.
  paidManualPerDay: 5,
  // Every plan: at most one on-demand run per 10 minutes (for Free this only
  // matters after a refunded run).
  paidMinIntervalMs: 10 * 60 * 1000,
  // Daily cron for Standard / Pro: each site is due once a week (6.5 days, so
  // the daily run does not drift by a day); at most cronSites sites per run.
  scheduledIntervalMs: 6.5 * 24 * 60 * 60 * 1000,
  cronSites: 100,
  // The cron leaves this many of the day's Places calls for owners' runs
  // (capped at a third of the ceiling).
  manualReserve: 100,
  // Stop a cron run after this long; the rest are due again tomorrow.
  cronMaxMs: 5 * 60 * 1000,
  googleDailyCalls: 300,
  // A pick between ambiguous candidates re-runs once without spending the allowance.
  followupWindowMs: 24 * 60 * 60 * 1000,
  historyPerSite: 12,
});

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ *
 * Normalisation
 * ------------------------------------------------------------------ */

const nfkc = (value) => String(value ?? "").normalize("NFKC");
const toKatakana = (text) => text.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));

// Legal-entity designators, which listings include or drop at will.
const CORPORATE = [
  /株式会社/g, /有限会社/g, /合同会社/g, /合資会社/g, /合名会社/g,
  /(?:一般|公益)(?:社団|財団)法人/g, /医療法人(?:社団|財団)?/g, /社会福祉法人/g, /特定非営利活動法人/g, /npo法人/g, /宗教法人/g, /学校法人/g,
  /\((?:株|有|同|医|社|財|学)\)/g,
  /\b(?:co\.?\s*,?\s*ltd\.?|inc\.?|llc|corp\.?|corporation|k\.k\.)(?=\s|$|[^a-z])/g,
];

/** The form two spellings of one business name share. */
export function normalizeName(raw) {
  let text = toKatakana(nfkc(raw).toLowerCase()).replace(/ヶ/g, "ケ").replace(/ヵ/g, "カ");
  for (const pattern of CORPORATE) text = text.replace(pattern, " ");
  return text.replace(/[\s\p{P}\p{S}]/gu, "");
}

function bigrams(text) {
  const grams = new Map();
  for (let i = 0; i < text.length - 1; i += 1) {
    const gram = text.slice(i, i + 2);
    grams.set(gram, (grams.get(gram) || 0) + 1);
  }
  return grams;
}

/** 0..1, Dice coefficient on character bigrams of the normalised names. */
export function nameSimilarity(a, b) {
  const x = normalizeName(a);
  const y = normalizeName(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.length < 2 || y.length < 2) return 0;
  const gx = bigrams(x);
  const gy = bigrams(y);
  let overlap = 0;
  for (const [gram, count] of gx) overlap += Math.min(count, gy.get(gram) || 0);
  const dice = (2 * overlap) / (x.length - 1 + y.length - 1);
  // "カフェ栞" inside "カフェ栞 渋谷店": the same business with a branch suffix.
  const contained = Math.min(x.length, y.length) >= 2 && (x.includes(y) || y.includes(x));
  return contained ? Math.max(dice, 0.85) : dice;
}

const KANJI_DIGITS = { "〇": 0, "零": 0, "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9 };
function kanjiNumber(text) {
  if (!/^[〇零一二三四五六七八九十百]+$/.test(text)) return null;
  let total = 0;
  let current = 0;
  for (const char of text) {
    if (char === "百") { total += (current || 1) * 100; current = 0; }
    else if (char === "十") { total += (current || 1) * 10; current = 0; }
    else current = current * 10 + KANJI_DIGITS[char];
  }
  return total + current;
}

const PREFECTURE = /^(北海道|東京都|京都府|大阪府|[^\s\d都道府県]{2,3}県)/;
const DASH = /[‐‑‒–—―−ー－~〜]/g;

/**
 * An address split into what identifies the place and what does not.
 * Returns { pref, core, building } with the postal code and country dropped,
 * full-width folded, 丁目/番地/番/号 written as hyphens and kanji numerals as
 * digits. `core` excludes the prefecture so "東京都渋谷区…" and "渋谷区…" agree.
 */
export function normalizeAddressParts(raw) {
  let text = nfkc(raw).replace(/\s+/g, " ").trim();
  if (!text) return null;
  text = text.replace(/^(?:日本[、,]?\s*|japan[、,]?\s*)/i, "").replace(/〒?\s*\d{3}\s*[-‐－−]?\s*\d{4}\s*/, "").trim();
  text = text.replace(/([〇零一二三四五六七八九十百]+)(?=丁目|番地|番|号)/g, (m) => String(kanjiNumber(m) ?? m));
  text = text.replace(/(\d)\s*[-‐‑‒–—―−ー－]\s*(?=\d)/g, "$1-");
  text = text.replace(/(\d+)\s*丁目\s*/g, "$1-").replace(/(\d+)\s*番地\s*の?\s*/g, "$1-").replace(/(\d+)\s*番\s*/g, "$1-").replace(/(\d+)\s*号/g, "$1");
  text = text.replace(/(\d)の(?=\d)/g, "$1-").replace(/-+/g, "-").replace(/-(?=\D|$)/g, "").replace(/ヶ/g, "ケ");
  const compact = text.replace(/[\s,、]/g, "");
  let pref = "";
  let rest = compact;
  const prefMatch = compact.match(PREFECTURE);
  if (prefMatch) { pref = prefMatch[1]; rest = compact.slice(pref.length); }
  // The block number ends the part that names the place: the first hyphen
  // chain ("1-2-3"), or failing that the first number. Anything after is the
  // building, which listings commonly shorten or drop.
  const numbers = [...rest.matchAll(/\d+(?:-\d+)*/g)];
  const anchor = numbers.find((m) => m[0].includes("-")) || numbers[0];
  if (!anchor) return { pref, core: rest, building: "" };
  const end = anchor.index + anchor[0].length;
  return { pref, core: rest.slice(0, end), building: rest.slice(end).replace(/^[-・]/, "").toLowerCase() };
}

/** Japanese phone number as E.164 (+81…), or null when it is not one. */
export function normalizePhone(raw) {
  const text = nfkc(raw).replace(/[‐‑‒–—―−ー－]/g, "-");
  const match = text.match(/\+?\d[\d()\s.-]{7,}\d/);
  if (!match) return null;
  let digits = match[0].replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) {
    if (!digits.startsWith("+81")) return /^\+\d{8,15}$/.test(digits) ? digits : null;
    digits = digits.slice(3);
  } else if (digits.startsWith("0081")) {
    digits = digits.slice(4);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  } else {
    return null;
  }
  digits = digits.replace(/^0/, "");
  if (!/^\d{9,10}$/.test(digits)) return null;
  return `+81${digits}`;
}

/* ---------------- opening hours ---------------- */

// A week is seven entries, Sunday first: null (unknown), [] (closed) or a
// sorted list of [startMinute, endMinute] from that day's midnight; an end past
// 1440 runs into the next day.
const DAY_CHARS = "日月火水木金土";

function mergeIntervals(list) {
  const sorted = list.filter(([s, e]) => e > s).sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [s, e] of sorted) {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}

/** Google-style periods ({open:{day,hour,minute},close:{…}}) as a week. */
export function weekFromPeriods(raw) {
  let periods = raw;
  if (typeof periods === "string") {
    try { periods = JSON.parse(periods); } catch { return null; }
  }
  if (!Array.isArray(periods) || !periods.length) return null;
  const week = Array.from({ length: 7 }, () => []);
  for (const period of periods) {
    const open = period?.open;
    if (!open || !(open.day >= 0 && open.day <= 6)) continue;
    const start = Number(open.hour || 0) * 60 + Number(open.minute || 0);
    if (!period.close) {
      // Open around the clock is a single period with no close.
      if (start === 0) return Array.from({ length: 7 }, () => [[0, 1440]]);
      continue;
    }
    const close = period.close;
    let end = Number(close.hour || 0) * 60 + Number(close.minute || 0) + (((Number(close.day) - open.day) + 7) % 7) * 1440;
    if (end <= start) end += 7 * 1440;
    week[open.day].push([start, Math.min(end, start + 2 * 1440)]);
  }
  return week.map(mergeIntervals);
}

function dayList(spec) {
  const text = spec.replace(/曜日|曜/g, "");
  if (/毎日|全日|年中無休|無休/.test(text)) return [0, 1, 2, 3, 4, 5, 6];
  const days = new Set();
  if (/平日/.test(text)) [1, 2, 3, 4, 5].forEach((d) => days.add(d));
  if (/土日/.test(text)) { days.add(6); days.add(0); }
  for (const range of text.matchAll(/([日月火水木金土])\s*[-~〜]\s*([日月火水木金土])/g)) {
    let d = DAY_CHARS.indexOf(range[1]);
    const to = DAY_CHARS.indexOf(range[2]);
    for (let guard = 0; guard < 7; guard += 1) { days.add(d); if (d === to) break; d = (d + 1) % 7; }
  }
  for (const char of text.replace(/([日月火水木金土])\s*[-~〜]\s*([日月火水木金土])/g, "").replace(/土日|平日/g, "")) {
    const d = DAY_CHARS.indexOf(char);
    if (d >= 0) days.add(d);
  }
  return [...days];
}

const DAY_TOKEN = "(?:[日月火水木金土](?:曜日|曜)?)";
const DAY_SPEC = `(?:毎日|全日|年中無休|平日|土日祝?|${DAY_TOKEN}(?:\\s*[-~〜・,、/]\\s*${DAY_TOKEN})*)(?:\\s*[・,、]?\\s*祝(?:日|祭日)?)?`;
const RANGE = /(翌\s*)?(\d{1,2}):(\d{2})\s*-\s*(翌\s*)?(\d{1,2}):(\d{2})/g;
const CLOSED_WORD = /定休|休業|休み|closed|close/i;

/**
 * Free-text hours as a week, or null when nothing in it can be read with
 * confidence. Understands the shapes Nurevo stores ("月曜日: 11:00–22:00;
 * 火曜日: 定休日") and the common owner shapes ("11:00〜22:00（月曜定休）",
 * "平日 11:00-15:00, 17:00-22:00 / 土日 10:00-20:00", "24時間営業").
 */
export function parseHoursText(raw) {
  let text = nfkc(raw);
  if (!text.trim()) return null;
  if (/24\s*時間(?:営業)?|24\s*hours|open 24/i.test(text) && !/\d{1,2}:\d{2}\s*-/.test(text.replace(DASH, "-"))) {
    return Array.from({ length: 7 }, () => [[0, 1440]]);
  }
  text = text.replace(/(\d{1,2})\s*時\s*(?:(\d{1,2})\s*分?)?/g, (m, h, mm) => `${h}:${String(mm || "0").padStart(2, "0")}`)
    .replace(/(\d{1,2})\s*[:：]\s*(\d{2})/g, "$1:$2")
    .replace(DASH, "-").replace(/\s*-\s*/g, "-");
  const week = Array.from({ length: 7 }, () => null);
  let fallback = null;
  let found = false;
  const closedEverywhere = new Set();
  // 「定休日：月曜」「月・火曜定休」「(月曜定休)」 anywhere in the text.
  const closedA = new RegExp(`(?:定休日|定休(?!日))\\s*[:：は]?\\s*(${DAY_SPEC})`, "g");
  const closedB = new RegExp(`(${DAY_SPEC})\\s*(?:は|が)?\\s*(?:定休日?|休業|休み|お休み)`, "g");
  for (const m of text.matchAll(closedA)) dayList(m[1]).forEach((d) => closedEverywhere.add(d));
  for (const m of text.matchAll(closedB)) dayList(m[1]).forEach((d) => closedEverywhere.add(d));
  const segments = text.split(/[;\n／|]|\s\/\s|\s{2,}|、(?=\s*(?:毎日|平日|土日|[日月火水木金土]))|,(?=\s*(?:毎日|平日|土日|[日月火水木金土]))|\s(?=(?:毎日|平日|土日|[日月火水木金土](?:曜日|曜)?)[\s:：]*\d)/);
  const leading = new RegExp(`^\\s*[(（]?\\s*(${DAY_SPEC})\\s*[:：)）]?\\s*`);
  for (const segment of segments) {
    if (!segment.trim()) continue;
    const ranges = [];
    for (const m of segment.matchAll(RANGE)) {
      const start = Number(m[2]) * 60 + Number(m[3]);
      let end = Number(m[5]) * 60 + Number(m[6]) + (m[4] ? 1440 : 0);
      if (m[1]) continue; // a range that starts "翌" belongs to the previous day; too ambiguous to place
      if (end <= start) end += 1440;
      if (start > 48 * 60 || end > 48 * 60) continue;
      ranges.push([start, end]);
    }
    const head = segment.match(leading);
    const days = head && head[1].trim() ? dayList(head[1]) : [];
    const restText = head ? segment.slice(head[0].length) : segment;
    if (days.length && ranges.length) {
      days.forEach((d) => { week[d] = mergeIntervals([...(week[d] || []), ...ranges]); });
      found = true;
    } else if (days.length && CLOSED_WORD.test(restText)) {
      days.forEach((d) => { week[d] = []; });
      found = true;
    } else if (!days.length && ranges.length) {
      fallback = mergeIntervals([...(fallback || []), ...ranges]);
      found = true;
    }
  }
  if (fallback) for (let d = 0; d < 7; d += 1) if (week[d] === null) week[d] = fallback.map((r) => [...r]);
  if (closedEverywhere.size) { found = true; closedEverywhere.forEach((d) => { week[d] = []; }); }
  if (!found) return null;
  // 年中無休 with a single range means every day.
  return week;
}

const clock = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
/** One day as text: "closed", "11:00–22:00" or "11:00–15:00, 17:00–22:00". */
export function formatDay(day) {
  if (day === null || day === undefined) return null;
  if (!day.length) return "closed";
  return day.map(([s, e]) => `${clock(s)}–${clock(e)}`).join(", ");
}

/* ------------------------------------------------------------------ *
 * Field comparison
 * ------------------------------------------------------------------ */

// Field status: match | variant | mismatch | missing_ours | missing_listing | unverifiable

export function compareName(ours, theirs) {
  if (!String(ours || "").trim()) return { status: "missing_ours" };
  if (!String(theirs || "").trim()) return { status: "missing_listing" };
  if (normalizeName(ours) === normalizeName(theirs)) return { status: "match" };
  const similarity = nameSimilarity(ours, theirs);
  return similarity >= 0.85 ? { status: "variant", similarity: round2(similarity) } : { status: "mismatch", similarity: round2(similarity) };
}

export function compareAddress(ours, theirs) {
  const a = normalizeAddressParts(ours);
  const b = normalizeAddressParts(theirs);
  if (!a) return { status: "missing_ours" };
  if (!b) return { status: "missing_listing" };
  if (a.pref && b.pref && a.pref !== b.pref) return { status: "mismatch", reason: "prefecture" };
  const short = a.core.length <= b.core.length ? a.core : b.core;
  const long = short === a.core ? b.core : a.core;
  const same = a.core === b.core || (short.length >= 6 && long.endsWith(short));
  if (!same) {
    const numbers = (core) => (core.match(/\d+(?:-\d+)*$/) || [""])[0];
    return { status: "mismatch", reason: numbers(a.core) && numbers(a.core) !== numbers(b.core) ? "block_number" : "town" };
  }
  const building = a.building && b.building && a.building.replace(/[\s・-]/g, "") !== b.building.replace(/[\s・-]/g, "");
  return building ? { status: "match", note: "building_differs" } : { status: "match" };
}

export function comparePhone(ours, theirs) {
  const hasOurs = String(ours || "").trim();
  const hasTheirs = String(theirs || "").trim();
  if (!hasOurs) return { status: "missing_ours" };
  if (!hasTheirs) return { status: "missing_listing" };
  const a = normalizePhone(ours);
  const b = normalizePhone(theirs);
  if (!a || !b) return { status: "unverifiable", reason: !a ? "ours_unparsed" : "listing_unparsed" };
  return a === b ? { status: "match" } : { status: "mismatch" };
}

/** ours / theirs are weeks (see weekFromPeriods); oursText says whether ours had text at all. */
export function compareHours(ours, theirs, { oursText = false } = {}) {
  if (!ours) return { status: oursText ? "unverifiable" : "missing_ours", ...(oursText ? { reason: "ours_unparsed" } : {}) };
  if (!theirs) return { status: "missing_listing" };
  const days = [];
  let comparable = 0;
  for (let d = 0; d < 7; d += 1) {
    if (ours[d] === null || theirs[d] === null) continue;
    comparable += 1;
    const a = formatDay(ours[d]);
    const b = formatDay(theirs[d]);
    if (a !== b) days.push({ day: d, ours: a, theirs: b });
  }
  if (days.length) return { status: "mismatch", days, comparable };
  if (comparable === 7) return { status: "match" };
  return { status: "unverifiable", reason: "partial", comparable };
}

const round2 = (n) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ *
 * Candidate selection
 * ------------------------------------------------------------------ */

export const MATCH_THRESHOLD = 0.6;
const STRONG = 0.85;

/**
 * 1 when two addresses name the same place, 0.5 when only the block number
 * differs (same town: an old or mistyped number), 0 otherwise.
 */
export function addressAffinity(ours, theirs) {
  const result = compareAddress(ours, theirs);
  if (result.status === "match") return 1;
  if (result.reason !== "block_number") return 0;
  const town = (raw) => normalizeAddressParts(raw)?.core.replace(/\d+(?:-\d+)*$/, "") || "";
  const a = town(ours);
  const b = town(theirs);
  const short = a.length <= b.length ? a : b;
  return short.length >= 3 && (a === b || (a.length > b.length ? a : b).endsWith(short)) ? 0.5 : 0;
}

/**
 * How sure we are that a listing is this business, 0..1, from name similarity,
 * phone equality and address agreement. A phone match is strong evidence on
 * its own; a name alone is not.
 */
export function candidateConfidence(profile, listing) {
  const name = nameSimilarity(profile.name, listing.name);
  const ourPhone = normalizePhone(profile.phone);
  const ourAddress = !!normalizeAddressParts(profile.address);
  const phone = ourPhone && ourPhone === normalizePhone(listing.phone) ? 1 : 0;
  const address = ourAddress && listing.address ? addressAffinity(profile.address, listing.address) : 0;
  // Weighted by the evidence we actually hold: a profile with no phone is
  // not penalised for a phone it cannot compare.
  const weight = 0.5 + (ourPhone ? 0.3 : 0) + (ourAddress ? 0.2 : 0);
  let score = (name * 0.5 + phone * 0.3 + address * 0.2) / weight;
  if (phone && name >= 0.5) score = Math.max(score, 0.9);
  if (address === 1 && name >= 0.85) score = Math.max(score, 0.88);
  // Same phone and same address under another name: most likely renamed.
  if (phone && address === 1) score = Math.max(score, 0.9);
  return { score: round2(score), name: round2(name), phone, address };
}

/**
 * The listing that is this business, or why there is none.
 * Returns { status: "found"|"ambiguous"|"not_found", best?, candidates, duplicates }.
 */
export function pickCandidate(profile, listings = []) {
  const scored = listings.map((listing) => ({ listing, ...candidateConfidence(profile, listing) }))
    .sort((a, b) => b.score - a.score);
  const plausible = scored.filter((c) => c.score >= MATCH_THRESHOLD && (c.name >= 0.5 || c.phone));
  if (!plausible.length) {
    // Same name, but neither phone nor address agrees: an outdated listing of
    // this business, or another business. Not ours to decide.
    const sameName = scored.filter((c) => c.name >= STRONG);
    if (sameName.length) return { status: "ambiguous", candidates: sameName.slice(0, 5), duplicates: [] };
    return { status: "not_found", candidates: scored.slice(0, 3) };
  }
  const [first, second] = plausible;
  // Two listings sharing this business's phone number: probably a duplicate.
  const duplicates = plausible.filter((c) => c.phone).length > 1 ? plausible.filter((c) => c.phone).map((c) => c.listing.id) : [];
  if (second && !first.phone && first.score - second.score < 0.1) {
    return { status: "ambiguous", candidates: plausible.slice(0, 5), duplicates };
  }
  return { status: "found", best: first, candidates: plausible.slice(0, 5), duplicates };
}

/* ------------------------------------------------------------------ *
 * Sources
 * ------------------------------------------------------------------ */

// `attributions` (third-party data providers Google must be credited with) is
// an Essentials IDs Only field, so it does not raise the SKU.
const PLACES_FIELDS = ["id", "attributions", "displayName", "formattedAddress", "nationalPhoneNumber", "internationalPhoneNumber", "regularOpeningHours", "businessStatus", "googleMapsUri"];
const GOOGLE_ATTRIBUTION = "Google Maps";

function placeToListing(place) {
  if (!place?.id) return null;
  return {
    id: String(place.id),
    name: place.displayName?.text || "",
    address: place.formattedAddress || "",
    phone: place.internationalPhoneNumber || place.nationalPhoneNumber || "",
    phone_display: place.nationalPhoneNumber || place.internationalPhoneNumber || "",
    hours: weekFromPeriods(place.regularOpeningHours?.periods),
    hours_text: Array.isArray(place.regularOpeningHours?.weekdayDescriptions) ? place.regularOpeningHours.weekdayDescriptions.join("; ") : "",
    business_status: place.businessStatus || null,
    url: place.googleMapsUri || null,
    providers: (Array.isArray(place.attributions) ? place.attributions : [])
      .filter((a) => a && String(a.provider || "").trim())
      .map((a) => ({ name: String(a.provider).trim().slice(0, 120), uri: /^https:\/\//.test(String(a.providerUri || "")) ? String(a.providerUri) : null })),
  };
}

/** Third-party providers to credit next to "Google Maps", de-duplicated. */
function providersOf(listings) {
  const seen = new Map();
  for (const listing of listings) for (const p of listing?.providers || []) if (!seen.has(p.name)) seen.set(p.name, p);
  return [...seen.values()];
}

/** Google Maps link to a place, built from its id (allowed to keep) and our own name. */
export function googleMapsLink(placeId, name = "") {
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query: name || "place", query_place_id: placeId })}`;
}

export const GOOGLE_SOURCE = Object.freeze({
  id: "google",
  configured: (env) => !!String(env?.GOOGLE_MAPS_API_KEY || "").trim(),
  async search(env, profile, fetchImpl) {
    const body = {
      textQuery: [profile.name, profile.address].filter(Boolean).join(" ").slice(0, 200),
      languageCode: "ja",
      regionCode: "JP",
      pageSize: 5,
    };
    if (Number.isFinite(Number(profile.lat)) && Number.isFinite(Number(profile.lng)) && profile.lat !== null && profile.lng !== null) {
      body.locationBias = { circle: { center: { latitude: Number(profile.lat), longitude: Number(profile.lng) }, radius: 2000 } };
    }
    const response = await fetchImpl("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": String(env.GOOGLE_MAPS_API_KEY).trim(),
        "x-goog-fieldmask": PLACES_FIELDS.map((f) => `places.${f}`).join(","),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new SourceError(`google_${response.status}`);
    const data = await response.json();
    return (Array.isArray(data?.places) ? data.places : []).map(placeToListing).filter(Boolean);
  },
  async details(env, placeId, fetchImpl) {
    const response = await fetchImpl(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=ja&regionCode=JP`, {
      headers: { "x-goog-api-key": String(env.GOOGLE_MAPS_API_KEY).trim(), "x-goog-fieldmask": PLACES_FIELDS.join(",") },
      signal: AbortSignal.timeout(10000),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new SourceError(`google_${response.status}`);
    return placeToListing(await response.json());
  },
});

class SourceError extends Error {}

/* ---------------- manual checklist ---------------- */

const RESTAURANT_TYPES = /restaurant|food|cafe|coffee|bar|pub|bakery|winery|brewery|icecream|distillery/i;
const RESTAURANT_LABEL = /飲食|レストラン|カフェ|喫茶|居酒屋|ラーメン|寿司|鮨|焼肉|焼き鳥|焼鳥|バー|食堂|ベーカリー|パン|そば|蕎麦|うどん|定食|ビストロ|イタリアン|フレンチ|中華|和食|料理|スイーツ|ケーキ|酒場/;
const BEAUTY_TYPES = /hairsalon|beautysalon|nailsalon|dayspa|healthandbeauty|tattoo/i;
const BEAUTY_LABEL = /美容|ヘア|理容|理髪|ネイル|エステ|まつ|アイラッシュ|サロン|リラク|スパ|脱毛/;

/** "restaurant", "beauty", "other" or "unknown", from the profile's business type. */
export function businessFamily(profile = {}) {
  const schema = String(profile.business_type_schema || "");
  const label = String(profile.business_type_label || "");
  if (RESTAURANT_TYPES.test(schema) || RESTAURANT_LABEL.test(label)) return "restaurant";
  if (BEAUTY_TYPES.test(schema) || BEAUTY_LABEL.test(label)) return "beauty";
  return schema || label ? "other" : "unknown";
}

const q = (text) => encodeURIComponent(String(text || "").trim());

/**
 * The listings Nurevo cannot read for the owner, with where to look and what
 * to compare. Built from our own profile only; nothing here fetches a page.
 * `applies` is true, or "if_applicable" when the business type is not known.
 */
export function manualChecklist(profile = {}) {
  const family = businessFamily(profile);
  const query = [profile.name, profile.address].filter(Boolean).join(" ");
  const nap = ["name", "address", "phone", "hours"];
  const items = [
    {
      id: "bing", applies: true, why_manual: "api_retired", verify: [...nap, "website"],
      links: { check: `https://www.bing.com/maps?q=${q(query)}`, manage: "https://www.bing.com/forbusiness" },
      steps: ["bing_search", "bing_claim", "bing_import_google"],
    },
    {
      id: "apple", applies: true, why_manual: "partner_only_api", verify: [...nap, "website"],
      links: { check: `https://maps.apple.com/?q=${q(query)}`, manage: "https://businessconnect.apple.com/" },
      steps: ["apple_search", "apple_claim"],
    },
    {
      id: "yahoo", applies: true, why_manual: "terms_unsettled", verify: nap,
      links: { check: `https://map.yahoo.co.jp/search?q=${q(query)}`, manage: "https://place.yahoo.co.jp/" },
      steps: ["yahoo_search", "yahoo_claim"],
    },
    {
      id: "tabelog", applies: family === "restaurant" ? true : family === "unknown" ? "if_applicable" : false, why_manual: "no_api", verify: nap,
      links: { check: `https://tabelog.com/rstLst/?sw=${q(profile.name)}`, manage: "https://owner.tabelog.com/home/registration/" },
      steps: ["tabelog_search", "tabelog_owner"],
    },
    {
      id: "hotpepper", applies: family === "restaurant" ? true : family === "unknown" ? "if_applicable" : false, why_manual: "terms_disallow", verify: nap,
      links: { check: "https://www.hotpepper.jp/", manage: "https://www.hotpepper.jp/" },
      steps: ["hotpepper_search", "hotpepper_fix"],
    },
    {
      id: "hotpepper_beauty", applies: family === "beauty" ? true : family === "unknown" ? "if_applicable" : false, why_manual: "no_api", verify: nap,
      links: { check: "https://beauty.hotpepper.jp/", manage: "https://salonboard.com/" },
      steps: ["hpb_search", "hpb_salonboard"],
    },
    {
      id: "instagram", applies: true, why_manual: "owner_auth", verify: ["name", "address", "phone", "hours", "website"],
      links: { check: "https://www.instagram.com/", manage: "https://www.instagram.com/accounts/edit/" },
      steps: ["ig_profile", "ig_contact"],
    },
    {
      id: "facebook", applies: true, why_manual: "owner_auth", verify: [...nap, "website"],
      links: { check: "https://www.facebook.com/", manage: "https://www.facebook.com/pages/?category=your_pages" },
      steps: ["fb_page"],
    },
  ];
  return items.filter((item) => item.applies !== false).map((item) => ({ kind: "manual", status: "manual_check", ...item }));
}

/* ------------------------------------------------------------------ *
 * Comparing one listing with the profile
 * ------------------------------------------------------------------ */

/**
 * Field-level comparison of the profile against one listing. `observed` holds
 * the listing's own values; it is returned to the caller and never stored.
 */
export function compareListing(profile, listing, sources = {}) {
  const oursHoursWeek = weekFromPeriods(profile.hours_periods) || parseHoursText(profile.hours);
  const fields = {
    name: compareName(profile.name, listing.name),
    address: compareAddress(profile.address, listing.address),
    phone: comparePhone(profile.phone, listing.phone),
    hours: compareHours(oursHoursWeek, listing.hours, { oursText: !!String(profile.hours || "").trim() || !!profile.hours_periods }),
  };
  // Agreement with Google proves little when Nurevo copied the value from Google.
  for (const field of Object.keys(fields)) {
    const column = field === "hours" ? (sources.hours_periods?.source === "places" ? "hours_periods" : "hours") : field;
    if (sources[column]?.source === "places") fields[field].ours_from_listing = true;
  }
  if (listing.business_status && listing.business_status !== "OPERATIONAL") {
    fields.business_status = { status: "mismatch", value: listing.business_status };
  }
  const statuses = Object.values(fields).map((f) => f.status);
  const status = statuses.includes("mismatch") ? "mismatch" : "match";
  return {
    status,
    fields,
    observed: {
      name: listing.name || null,
      address: listing.address || null,
      phone: listing.phone_display || listing.phone || null,
      hours: listing.hours_text || null,
      business_status: listing.business_status || null,
    },
  };
}

/** Which fix steps apply to a Google result. Rendered as words by the dashboard. */
function googleSteps(result) {
  if (result.status === "not_found") return ["gbp_create", "gbp_check_name"];
  if (result.status === "ambiguous") return ["pick_listing"];
  if (result.status === "not_configured") return ["google_manual"];
  const steps = [];
  const fields = result.fields || {};
  const anyMismatch = Object.values(fields).some((f) => f.status === "mismatch" || f.status === "variant");
  if (fields.business_status) steps.push("gbp_reopen");
  if (anyMismatch) steps.push("decide_truth", "gbp_edit", "gbp_suggest");
  if (Object.values(fields).some((f) => f.status === "missing_listing")) steps.push("gbp_fill");
  if (Object.values(fields).some((f) => f.status === "missing_ours")) steps.push("profile_fill");
  if (Object.values(fields).some((f) => f.ours_from_listing)) steps.push("ours_from_google");
  if (result.duplicates?.length) steps.push("gbp_duplicate");
  return steps;
}

/* ------------------------------------------------------------------ *
 * Storage (D1). Only place ids and our own outcome are written.
 * ------------------------------------------------------------------ */

const isMissingTable = (error) => /no such table/i.test(String(error?.message || error));

export async function loadListingRef(env, siteId, source) {
  try {
    return await env.DB.prepare("SELECT listing_id,pinned FROM offsite_listing_refs WHERE site_id=? AND source=?").bind(siteId, source).first();
  } catch (error) {
    if (isMissingTable(error)) return null;
    throw error;
  }
}

async function saveListingRef(env, siteId, source, listingId, pinned, now) {
  await env.DB.prepare(
    `INSERT INTO offsite_listing_refs(site_id,source,listing_id,pinned,updated_at) VALUES(?,?,?,?,?)
     ON CONFLICT(site_id,source) DO UPDATE SET listing_id=excluded.listing_id,pinned=excluded.pinned,updated_at=excluded.updated_at`,
  ).bind(siteId, source, listingId, pinned ? 1 : 0, now).run();
}

/**
 * The part of a result that may be kept: our own comparison outcome (statuses,
 * which of OUR fields differ, which weekdays differ with OUR hours) and place
 * ids. Built from a whitelist, so anything Google returned - the observed
 * values, candidate names and addresses, the listing's hours, similarity
 * scores computed from Google's name, third-party attributions - is dropped
 * even if a later change adds it to the response.
 */
const SOURCE_KEEP = ["id", "kind", "attribution", "status", "reason", "error", "duplicates", "links", "steps"];
const FIELD_KEEP = ["status", "reason", "note", "ours_from_listing", "comparable"];
export function storableResult(result) {
  const clone = JSON.parse(JSON.stringify(result));
  clone.sources = (clone.sources || []).map((source) => {
    const kept = {};
    for (const key of SOURCE_KEEP) if (source[key] !== undefined) kept[key] = source[key];
    if (source.listing) kept.listing = { id: source.listing.id, url: source.listing.url, pinned: !!source.listing.pinned };
    if (Array.isArray(source.candidates)) kept.candidates = source.candidates.map((c) => ({ id: c.id }));
    if (source.fields) {
      kept.fields = {};
      for (const [name, field] of Object.entries(source.fields)) {
        const out = {};
        for (const key of FIELD_KEEP) if (field[key] !== undefined) out[key] = field[key];
        if (Array.isArray(field.days)) out.days = field.days.map(({ day, ours }) => ({ day, ours }));
        kept.fields[name] = out;
      }
    }
    return kept;
  });
  return clone;
}

export async function loadLatestAudit(env, siteId) {
  try {
    const row = await env.DB.prepare("SELECT id,ran_at,trigger,result_json FROM offsite_audits WHERE site_id=? ORDER BY ran_at DESC LIMIT 1").bind(siteId).first();
    if (!row) return null;
    return { ...JSON.parse(row.result_json), id: row.id, ran_at: Number(row.ran_at), trigger: row.trigger };
  } catch (error) {
    if (isMissingTable(error)) return null;
    throw error;
  }
}

async function saveAudit(env, siteId, result, trigger, now) {
  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO offsite_audits(id,site_id,ran_at,trigger,result_json) VALUES(?,?,?,?,?)")
    .bind(id, siteId, now, trigger, JSON.stringify(storableResult(result))).run();
  await env.DB.prepare(
    `DELETE FROM offsite_audits WHERE site_id=? AND id NOT IN (SELECT id FROM offsite_audits WHERE site_id=? ORDER BY ran_at DESC LIMIT ?)`,
  ).bind(siteId, siteId, OFFSITE_LIMITS.historyPerSite).run();
  return id;
}

/** Whether the audit tables exist (migration 0042 applied). */
export async function offsiteAuditAvailable(env) {
  try {
    await env.DB.prepare("SELECT 1 FROM offsite_audits LIMIT 1").first();
    return true;
  } catch (error) {
    if (isMissingTable(error)) return false;
    throw error;
  }
}

/* ------------------------------------------------------------------ *
 * Allowance and budget
 * ------------------------------------------------------------------ */

function jstNextPeriod(now, unit) {
  const jst = new Date(now + JST_OFFSET_MS);
  const next = unit === "month"
    ? Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth() + 1, 1)
    : Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate() + 1);
  return next - JST_OFFSET_MS;
}
/** The allowance row of a period: "M2026-10" (JST month) or "D2026-10-14" (JST day). */
function jstPeriodKey(now, unit) {
  const jst = new Date(now + JST_OFFSET_MS).toISOString();
  return unit === "month" ? `M${jst.slice(0, 7)}` : `D${jst.slice(0, 10)}`;
}
function allowancePolicy(plan) {
  const paid = plan === "standard" || plan === "pro";
  return { paid, unit: paid ? "day" : "month", limit: paid ? OFFSITE_LIMITS.paidManualPerDay : OFFSITE_LIMITS.freeManualPerMonth };
}
const changed = (outcome) => Number(outcome?.meta?.changes ?? outcome?.changes ?? 0);

/**
 * Whether the owner may run an audit now (a read; the POST reserves with
 * reserveManualRun). Free: once per calendar month (JST). Standard / Pro: five
 * a day. Every plan: one run per 10 minutes.
 */
export async function manualAllowance(env, siteId, plan, now = Date.now()) {
  const { paid, unit, limit } = allowancePolicy(plan);
  let used = 0;
  let last = null;
  try {
    const row = await env.DB.prepare("SELECT n FROM offsite_audit_usage WHERE site_id=? AND period=?").bind(siteId, jstPeriodKey(now, unit)).first();
    used = Math.max(0, Number(row?.n || 0));
    const lastRow = await env.DB.prepare("SELECT MAX(last_at) AS last FROM offsite_audit_usage WHERE site_id=?").bind(siteId).first();
    last = Number(lastRow?.last || 0) || null;
  } catch (error) {
    if (isMissingTable(error)) return { allowed: false, reason: "unavailable", plan, period: unit, limit, used: 0 };
    throw error;
  }
  const base = { plan, period: unit, limit, used };
  if (used >= limit) return { ...base, allowed: false, reason: paid ? "daily_limit" : "monthly_limit", next_at: jstNextPeriod(now, unit) };
  if (last !== null && now - last < OFFSITE_LIMITS.paidMinIntervalMs) {
    return { ...base, allowed: false, reason: "too_soon", next_at: last + OFFSITE_LIMITS.paidMinIntervalMs };
  }
  return { ...base, allowed: true };
}

/**
 * Take one on-demand run from the allowance, atomically, before anything is
 * called: one UPDATE that only succeeds while the period count is under the
 * limit and no run was reserved in the last 10 minutes. D1 runs each statement
 * on its own, so of N parallel POSTs exactly as many succeed as the allowance
 * holds. Returns { ok, period } or { ok: false, allowance }.
 */
export async function reserveManualRun(env, siteId, plan, now = Date.now()) {
  const { unit, limit } = allowancePolicy(plan);
  const period = jstPeriodKey(now, unit);
  await env.DB.prepare("INSERT INTO offsite_audit_usage(site_id,period,n,last_at) VALUES(?,?,0,0) ON CONFLICT(site_id,period) DO NOTHING").bind(siteId, period).run();
  const outcome = await env.DB.prepare(
    `UPDATE offsite_audit_usage SET n=n+1, last_at=?
      WHERE site_id=? AND period=? AND n<?
        AND NOT EXISTS (SELECT 1 FROM offsite_audit_usage WHERE site_id=? AND last_at>?)`,
  ).bind(now, siteId, period, limit, siteId, now - OFFSITE_LIMITS.paidMinIntervalMs).run();
  if (changed(outcome) === 1) return { ok: true, period };
  const allowance = await manualAllowance(env, siteId, plan, now);
  // Lost a race that the read no longer shows: say "a moment".
  return { ok: false, allowance: allowance.allowed ? { ...allowance, allowed: false, reason: "too_soon", next_at: now + OFFSITE_LIMITS.paidMinIntervalMs } : allowance };
}

/** Give a reserved run back (it made no useful call). The 10-minute spacing stays. */
async function refundManualRun(env, siteId, period) {
  await env.DB.prepare("UPDATE offsite_audit_usage SET n=n-1 WHERE site_id=? AND period=? AND n>0").bind(siteId, period).run();
}

export function googleDailyLimit(env) {
  return Math.max(1, Math.floor(Number(env?.OFFSITE_GOOGLE_DAILY_LIMIT)) || OFFSITE_LIMITS.googleDailyCalls);
}

/**
 * Reserve one Places call against the all-sites daily ceiling (UTC day), in
 * one atomic upsert: the row is created at 1 or incremented only while under
 * the cap, so parallel callers can never pass it. `cap` lowers the ceiling
 * (the cron leaves room for owners' runs). Without the table nothing is called.
 */
export async function reserveGoogleCall(env, now, cap = Infinity) {
  const limit = Math.min(googleDailyLimit(env), cap);
  if (!(limit >= 1)) return false;
  try {
    const outcome = await env.DB.prepare(
      `INSERT INTO offsite_api_budget(source,day,n) VALUES('google',?,1)
       ON CONFLICT(source,day) DO UPDATE SET n=n+1 WHERE n<?`,
    ).bind(new Date(now).toISOString().slice(0, 10), limit).run();
    return changed(outcome) === 1;
  } catch (error) {
    if (isMissingTable(error)) return false;
    throw error;
  }
}

/* ------------------------------------------------------------------ *
 * Running an audit
 * ------------------------------------------------------------------ */

/** Our own profile, as the audit compares it. */
export async function loadAuditProfile(env, siteId) {
  const [settings, site] = await Promise.all([
    env.DB.prepare("SELECT * FROM site_settings WHERE site_id=?").bind(siteId).first(),
    env.DB.prepare("SELECT id,website_uri,place_id FROM sites WHERE id=? LIMIT 1").bind(siteId).first(),
  ]);
  if (!site) return null;
  return { values: rowToProfile(settings || {}, site), sources: parseFieldSources(settings?.field_sources), placeId: site.place_id || null };
}

/** The part of our profile shown next to the result (our own data, safe to keep showing). */
export function profileSummary(values = {}) {
  return { name: values.name || null, address: values.address || null, phone: values.phone || null, hours: values.hours || null };
}

async function auditGoogle(env, siteId, profile, sources, { fetchImpl, now, pin, knownPlaceId, googleCap = Infinity }) {
  const base = { id: "google", kind: "api", attribution: GOOGLE_ATTRIBUTION };
  if (!GOOGLE_SOURCE.configured(env)) {
    return { ...base, status: "not_configured", links: { check: `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query: [profile.name, profile.address].filter(Boolean).join(" ") })}`, manage: "https://business.google.com/" } };
  }
  if (!String(profile.name || "").trim()) return { ...base, status: "skipped", reason: "no_name" };

  const ref = pin ? { listing_id: pin, pinned: 1 } : await loadListingRef(env, siteId, "google") || (knownPlaceId ? { listing_id: knownPlaceId, pinned: 0 } : null);
  try {
    let chosen = null;
    let duplicates = [];
    let candidates = [];
    if (ref?.listing_id) {
      if (!await reserveGoogleCall(env, now, googleCap)) return { ...base, status: "rate_limited" };
      const listing = await GOOGLE_SOURCE.details(env, ref.listing_id, fetchImpl);
      if (listing) {
        const confidence = candidateConfidence(profile, listing);
        // A listing the owner picked is compared as is; one we picked must
        // still look like this business, or we search again.
        if (ref.pinned || (confidence.score >= MATCH_THRESHOLD && (confidence.name >= 0.5 || confidence.phone))) chosen = { listing, ...confidence };
      }
    }
    if (!chosen) {
      if (!await reserveGoogleCall(env, now, googleCap)) return { ...base, status: "rate_limited" };
      const listings = await GOOGLE_SOURCE.search(env, profile, fetchImpl);
      const pick = pickCandidate(profile, listings);
      duplicates = pick.duplicates || [];
      if (pick.status === "not_found") {
        return { ...base, status: "not_found", links: { manage: "https://business.google.com/" }, steps: googleSteps({ status: "not_found" }) };
      }
      if (pick.status === "ambiguous") {
        candidates = pick.candidates.map((c) => ({ id: c.listing.id, name: c.listing.name, address: c.listing.address, url: googleMapsLink(c.listing.id, c.listing.name) }));
        return { ...base, status: "ambiguous", candidates, attribution_providers: providersOf(pick.candidates.map((c) => c.listing)), steps: googleSteps({ status: "ambiguous" }) };
      }
      chosen = pick.best;
    }
    const comparison = compareListing(profile, chosen.listing, sources);
    await saveListingRef(env, siteId, "google", chosen.listing.id, !!(ref?.pinned && ref.listing_id === chosen.listing.id), now);
    const result = {
      ...base,
      status: comparison.status,
      confidence: chosen.score,
      listing: { id: chosen.listing.id, url: googleMapsLink(chosen.listing.id, profile.name), pinned: !!(ref?.pinned && ref.listing_id === chosen.listing.id) },
      fields: comparison.fields,
      observed: comparison.observed,
      attribution_providers: providersOf([chosen.listing]),
      duplicates,
      links: { manage: "https://business.google.com/", suggest: googleMapsLink(chosen.listing.id, profile.name) },
    };
    result.steps = googleSteps(result);
    return result;
  } catch (error) {
    console.error("offsite-google-error", JSON.stringify({ site_id: siteId, message: String(error?.message || error).slice(0, 120) }));
    return { ...base, status: "error", error: error instanceof SourceError ? error.message : "request_failed" };
  }
}

/**
 * Audit one site and store the outcome.
 * trigger: "manual" | "scheduled" | "followup" (an owner's pick after an ambiguous run).
 * Returns the full result, including values observed on the listings; only
 * storableResult(result) is written.
 */
export async function runOffsiteAudit(env, siteId, { trigger = "manual", pin = null, fetchImpl = fetch, now = Date.now(), googleCap = Infinity } = {}) {
  const loaded = await loadAuditProfile(env, siteId);
  if (!loaded) return { error: "not_found" };
  const { values, sources, placeId } = loaded;
  const google = await auditGoogle(env, siteId, values, sources, { fetchImpl, now, pin, knownPlaceId: placeId, googleCap });
  const result = {
    version: OFFSITE_AUDIT_VERSION,
    ran_at: now,
    trigger,
    profile: profileSummary(values),
    sources: [google],
    manual: manualChecklist(values),
    summary: summarize([google]),
  };
  // A run that called nothing (daily ceiling) says nothing new: not stored, so
  // the previous outcome stays on the card and the cron retries the site
  // tomorrow. A scheduled run that failed is likewise retried, not stored.
  const store = google.status !== "rate_limited" && !(trigger === "scheduled" && google.status === "error");
  result.id = store ? await saveAudit(env, siteId, result, trigger, now) : null;
  return result;
}

/** Runs that made no useful Places call; their allowance is given back. */
const UNSPENT = new Set(["rate_limited", "error", "skipped"]);

function summarize(sources) {
  const counts = {};
  for (const source of sources) counts[source.status] = (counts[source.status] || 0) + 1;
  const mismatchedFields = sources.flatMap((s) => Object.entries(s.fields || {}).filter(([, f]) => f.status === "mismatch").map(([name]) => `${s.id}.${name}`));
  return { counts, mismatched_fields: mismatchedFields };
}

/** Which sources can run automatically right now. */
export function sourceStatus(env) {
  return { google: GOOGLE_SOURCE.configured(env) };
}

/* ------------------------------------------------------------------ *
 * Daily cron: each Standard / Pro site once a week
 * ------------------------------------------------------------------ */

/**
 * Audits the Standard/Pro sites that are due (not audited for 6.5 days),
 * oldest first, at most OFFSITE_AUDIT_CRON_LIMIT a run (default 100, so about
 * 700 sites get a weekly audit). It stops early when its share of the daily
 * Places ceiling is used (the ceiling minus a reserve for owners' runs) or
 * after cronMaxMs; the remaining sites are due again the next day. Beyond
 * ~7 x the limit, sites are audited less often than weekly, never more calls.
 */
export async function runOffsiteAuditScheduled(env, { now = Date.now(), fetchImpl = fetch, clock = Date.now } = {}) {
  if (!env?.DB) throw new Error("DB binding is required for the off-site audit");
  // Nothing automatic is configured: nothing to call and nothing new to store.
  if (!GOOGLE_SOURCE.configured(env)) return { ok: true, status: "unconfigured", audited: 0 };
  if (!await offsiteAuditAvailable(env)) return { ok: true, status: "not_migrated", audited: 0 };
  const started = clock();
  const limit = Math.min(1000, Math.max(1, Math.floor(Number(env.OFFSITE_AUDIT_CRON_LIMIT)) || OFFSITE_LIMITS.cronSites));
  const ceiling = googleDailyLimit(env);
  const googleCap = Math.max(1, ceiling - Math.min(OFFSITE_LIMITS.manualReserve, Math.floor(ceiling / 3)));
  // Housekeeping: counters of past periods are no longer read.
  await env.DB.prepare("DELETE FROM offsite_api_budget WHERE day < ?").bind(new Date(now - 7 * 86400000).toISOString().slice(0, 10)).run();
  await env.DB.prepare("DELETE FROM offsite_audit_usage WHERE last_at < ?").bind(now - 62 * 86400000).run();
  const candidates = await env.DB.prepare(`
    SELECT s.*, o.manual_plan AS org_manual_plan,
           (SELECT MAX(a.ran_at) FROM offsite_audits a WHERE a.site_id=s.id) AS last_audit_at
      FROM sites s LEFT JOIN orgs o ON o.id = s.org_id
     WHERE (s.plan IN ('standard','pro') OR s.manual_plan IN ('standard','pro') OR o.manual_plan IN ('standard','pro'))
       AND (s.delivery_status IS NULL OR s.delivery_status='active')
     ORDER BY COALESCE(last_audit_at, 0) ASC, s.created_at ASC
     LIMIT ?
  `).bind(limit * 2).all();
  let audited = 0;
  let notDue = 0;
  let stopped = null;
  const errors = [];
  for (const site of candidates.results || []) {
    if (audited >= limit) { stopped = "site_limit"; break; }
    if (clock() - started > OFFSITE_LIMITS.cronMaxMs) { stopped = "time_limit"; break; }
    const plan = resolveSitePlan(site, { manual_plan: site.org_manual_plan });
    if (plan !== "standard" && plan !== "pro") continue;
    if (site.last_audit_at != null && now - Number(site.last_audit_at) < OFFSITE_LIMITS.scheduledIntervalMs) { notDue += 1; continue; }
    try {
      const result = await runOffsiteAudit(env, site.id, { trigger: "scheduled", fetchImpl, now, googleCap });
      if (result.sources?.some((s) => s.status === "rate_limited")) { stopped = "budget"; break; }
      audited += 1;
    } catch (error) {
      errors.push({ site_id: site.id, error: String(error?.message || error).slice(0, 120) });
    }
  }
  return { ok: true, status: "audited", audited, not_due: notDue, stopped, errors: errors.slice(0, 20) };
}

/* ------------------------------------------------------------------ *
 * HTTP handlers (wired from api.mjs, which has authenticated the member)
 * ------------------------------------------------------------------ */

/** GET: the latest stored audit, the checklist and the allowance. No external call. */
export async function offsiteAuditView(env, site, { now = Date.now() } = {}) {
  const plan = await resolveSitePlanFor(env, site);
  const available = await offsiteAuditAvailable(env);
  const loaded = await loadAuditProfile(env, site.id);
  const values = loaded?.values || {};
  return {
    site_id: site.id,
    plan,
    available,
    configured: sourceStatus(env),
    profile: profileSummary(values),
    latest: available ? await loadLatestAudit(env, site.id) : null,
    checklist: manualChecklist(values),
    allowance: available ? await manualAllowance(env, site.id, plan, now) : { allowed: false, reason: "unavailable" },
    schedule: plan === "standard" || plan === "pro" ? "weekly" : "manual_monthly",
  };
}

/**
 * POST: run now. body.pin = { source: "google", listing_id } picks one of the
 * candidates of an ambiguous run; that re-run does not spend the allowance
 * when it follows an ambiguous run within 24 hours, once (claimed atomically).
 * The allowance is reserved before anything is called and given back when the
 * run made no useful call (daily ceiling reached, Google error, no name).
 */
export async function offsiteAuditRun(env, site, body = {}, { now = Date.now(), fetchImpl = fetch } = {}) {
  if (!await offsiteAuditAvailable(env)) return { status: 503, body: { error: "offsite_audit_unavailable" } };
  const plan = await resolveSitePlanFor(env, site);
  let pin = null;
  let trigger = "manual";
  let followupOf = null;
  if (body && body.pin) {
    const listingId = String(body.pin.listing_id || "").trim();
    if (body.pin.source !== "google" || !/^[A-Za-z0-9_-]{10,300}$/.test(listingId)) return { status: 400, body: { error: "invalid_pin" } };
    pin = listingId;
    const latest = await loadLatestAudit(env, site.id);
    const google = latest?.sources?.find((s) => s.id === "google");
    const offered = google?.status === "ambiguous" && (google.candidates || []).some((c) => c.id === listingId);
    if (!offered) return { status: 400, body: { error: "pin_not_offered" } };
    if (now - Number(latest.ran_at) <= OFFSITE_LIMITS.followupWindowMs) {
      const claim = await env.DB.prepare("UPDATE offsite_audits SET followup_used=1 WHERE id=? AND followup_used=0").bind(latest.id).run();
      if (changed(claim) === 1) { trigger = "followup"; followupOf = latest.id; }
    }
  }
  let reservation = null;
  if (trigger === "manual") {
    reservation = await reserveManualRun(env, site.id, plan, now);
    if (!reservation.ok) return { status: 429, body: { error: "rate_limited", allowance: reservation.allowance } };
  }
  const giveBack = async () => {
    if (reservation?.ok) await refundManualRun(env, site.id, reservation.period);
    if (followupOf) await env.DB.prepare("UPDATE offsite_audits SET followup_used=0 WHERE id=?").bind(followupOf).run();
  };
  let result;
  try {
    result = await runOffsiteAudit(env, site.id, { trigger, pin, fetchImpl, now });
  } catch (error) {
    await giveBack();
    throw error;
  }
  if (result.error) {
    await giveBack();
    return { status: 404, body: { error: result.error } };
  }
  if (result.sources.some((s) => UNSPENT.has(s.status))) {
    await giveBack();
    result.refunded = true;
  }
  return { status: 200, body: { result, allowance: await manualAllowance(env, site.id, plan, now), configured: sourceStatus(env) } };
}
