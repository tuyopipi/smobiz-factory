/**
 * Address -> coordinates for a site's own address, and only that.
 *
 * geo is one of the scored LocalBusiness properties, and the one an owner is
 * least likely to fill in by hand: almost nobody knows their own latitude. The
 * address, on the other hand, is usually already there. This turns the address
 * the site itself states into the coordinates of that address - nothing else.
 *
 * Three rules keep that honest:
 *
 *   Precision before coverage. A geocoder asked for "石川県金沢市" answers with
 *   the middle of Kanazawa. Publishing that as a shop's location would place
 *   it somewhere it is not, so only a result matched to a building or a house
 *   number is used. A town-level answer is recorded as such and the owner is
 *   asked for the full address instead.
 *
 *   One lookup per address. Results - including "not found" and "too vague" -
 *   are cached under the normalised address, so a site is geocoded when its
 *   address first appears or changes, never on every sync or diagnosis.
 *
 *   No key, no lookup. Without GEOCODER_API_KEY nothing is called and nothing
 *   is guessed; the site keeps an empty geo and an owner-facing note.
 *
 * Providers are OpenStreetMap-based services whose terms allow keeping the
 * result (OpenCage, Geoapify, LocationIQ). Google's geocoder is deliberately
 * absent: its terms do not allow storing coordinates. Results carry the
 * attribution the data licence (ODbL) asks for.
 */

const OSM_ATTRIBUTION = "© OpenStreetMap contributors (ODbL)";

// Matched to a building or a house number: usable as the business's location.
const PRECISE = "address";

/* ------------------------------------------------------------------ *
 * Providers
 * ------------------------------------------------------------------ */

/**
 * Each provider turns an address into { lat, lng, precision, label } or null.
 * `precision` is "address" (building / house number), "street" or "area".
 */
export const GEOCODER_PROVIDERS = {
  opencage: {
    label: "OpenCage",
    attribution: `OpenCage / ${OSM_ATTRIBUTION}`,
    url: (query, key) => `https://api.opencagedata.com/geocode/v1/json?${new URLSearchParams({ q: query, key, limit: "1", no_annotations: "1", language: "ja" })}`,
    parse(body) {
      const hit = body?.results?.[0];
      if (!hit?.geometry) return null;
      const components = hit.components || {};
      const kind = String(components._type || "");
      const precision = components.house_number || ["building", "house"].includes(kind) ? PRECISE
        : ["road", "street"].includes(kind) ? "street" : "area";
      return { lat: hit.geometry.lat, lng: hit.geometry.lng, precision, label: hit.formatted || "" };
    },
  },
  geoapify: {
    label: "Geoapify",
    attribution: `Geoapify / ${OSM_ATTRIBUTION}`,
    url: (query, key) => `https://api.geoapify.com/v1/geocode/search?${new URLSearchParams({ text: query, apiKey: key, limit: "1", format: "json", lang: "ja" })}`,
    parse(body) {
      const hit = body?.results?.[0];
      if (!hit) return null;
      const kind = String(hit.result_type || "");
      const precision = hit.housenumber || ["building", "amenity"].includes(kind) ? PRECISE : kind === "street" ? "street" : "area";
      return { lat: hit.lat, lng: hit.lon, precision, label: hit.formatted || "" };
    },
  },
  locationiq: {
    label: "LocationIQ",
    attribution: `LocationIQ / ${OSM_ATTRIBUTION}`,
    url: (query, key) => `https://us1.locationiq.com/v1/search?${new URLSearchParams({ q: query, key, format: "json", limit: "1", addressdetails: "1", "accept-language": "ja" })}`,
    parse(body) {
      const hit = Array.isArray(body) ? body[0] : null;
      if (!hit) return null;
      const kind = String(hit.addresstype || hit.type || "");
      const precision = hit.address?.house_number || ["house", "building"].includes(kind) || hit.class === "building" ? PRECISE
        : ["road", "street"].includes(kind) ? "street" : "area";
      return { lat: Number(hit.lat), lng: Number(hit.lon), precision, label: hit.display_name || "" };
    },
  },
};

export const DEFAULT_GEOCODER_PROVIDER = "opencage";

/** The configured provider, or null when geocoding is not set up. */
export function geocoderConfig(env) {
  const key = String(env?.GEOCODER_API_KEY || "").trim();
  if (!key) return null;
  const id = String(env?.GEOCODER_PROVIDER || DEFAULT_GEOCODER_PROVIDER).trim().toLowerCase();
  const provider = GEOCODER_PROVIDERS[id];
  if (!provider) return null;
  return { id, provider, key, dailyLimit: Math.max(1, Number(env?.GEOCODER_DAILY_LIMIT) || 200) };
}

/* ------------------------------------------------------------------ *
 * Address normalisation and cache key
 * ------------------------------------------------------------------ */

/** The form two spellings of one address share: full-width folded, dashes and spaces unified. */
export function normalizeAddress(raw) {
  return String(raw ?? "")
    .normalize("NFKC")
    .replace(/[‐‑‒–—―−ー－](?=\d)|(?<=\d)[‐‑‒–—―−ー－]/g, "-")
    .replace(/[\s　]+/g, " ")
    .replace(/^〒\s*/, "〒")
    .trim();
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function addressKey(address) {
  return sha256Hex(normalizeAddress(address).toLowerCase());
}

/* ------------------------------------------------------------------ *
 * Lookup with cache and rate limit
 * ------------------------------------------------------------------ */

// A transient failure is retried, but not on the next sync: an hour later.
const ERROR_RETRY_MS = 60 * 60 * 1000;
// Providers allow one or a few requests a second on their free tiers; this
// worker never needs more than one, so it never sends more than one.
const MIN_INTERVAL_MS = 1100;
let lastCallAt = 0;

const validCoordinate = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng)
  && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

/**
 * Coordinates for an address, from the cache when it has been looked up before.
 *
 * Returns { status, lat?, lng?, precision?, provider?, attribution?, cached }.
 * status: "ok" (precise, usable) | "imprecise" | "not_found" | "error"
 *         | "unconfigured" | "rate_limited" | "empty".
 */
export async function geocodeAddress(env, address, { fetchImpl = fetch, now = Date.now(), sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const normalized = normalizeAddress(address);
  if (!normalized) return { status: "empty", cached: false };
  const key = await addressKey(normalized);

  const cached = await env.DB.prepare("SELECT * FROM geocode_cache WHERE address_key=?").bind(key).first();
  if (cached && !(cached.status === "error" && now >= Number(cached.retry_after || 0))) {
    return { ...fromRow(cached), cached: true };
  }

  const config = geocoderConfig(env);
  if (!config) return { status: "unconfigured", cached: false };

  // A daily ceiling across all sites, so a burst of new addresses cannot run
  // up a bill. Counted in KV; without KV the ceiling cannot be enforced, so
  // nothing is called.
  if (!env.WEBMCP_KV) return { status: "rate_limited", cached: false };
  const dayKey = `geocoder:calls:${new Date(now).toISOString().slice(0, 10)}`;
  const used = Number(await env.WEBMCP_KV.get(dayKey) || 0);
  if (used >= config.dailyLimit) return { status: "rate_limited", cached: false };
  await env.WEBMCP_KV.put(dayKey, String(used + 1), { expirationTtl: 2 * 86400 });

  const wait = lastCallAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastCallAt = Date.now();

  let outcome;
  try {
    const response = await fetchImpl(config.provider.url(normalized, config.key), {
      headers: { accept: "application/json", "user-agent": "Nurevo-AEO-geocoder/1.0 (+https://nurevo.jp)" },
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 429 || response.status >= 500) throw new Error(`provider_${response.status}`);
    if (!response.ok) {
      outcome = { status: "error", error: `provider_${response.status}` };
    } else {
      const hit = config.provider.parse(await response.json());
      if (!hit || !validCoordinate(Number(hit.lat), Number(hit.lng))) outcome = { status: "not_found" };
      else outcome = {
        status: hit.precision === PRECISE ? "ok" : "imprecise",
        lat: roundCoordinate(hit.lat), lng: roundCoordinate(hit.lng), precision: hit.precision, label: String(hit.label || "").slice(0, 300),
      };
    }
  } catch (error) {
    outcome = { status: "error", error: String(error?.message || error).slice(0, 120) };
  }

  const row = {
    address_key: key, address: normalized, status: outcome.status,
    lat: outcome.status === "ok" ? outcome.lat : null, lng: outcome.status === "ok" ? outcome.lng : null,
    precision: outcome.precision || null, label: outcome.label || null,
    provider: config.id, attribution: config.provider.attribution,
    fetched_at: new Date(now).toISOString(), retry_after: outcome.status === "error" ? now + ERROR_RETRY_MS : null,
  };
  await env.DB.prepare(
    `INSERT INTO geocode_cache(address_key,address,status,lat,lng,precision,label,provider,attribution,fetched_at,retry_after)
     VALUES(?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(address_key) DO UPDATE SET status=excluded.status,lat=excluded.lat,lng=excluded.lng,precision=excluded.precision,
       label=excluded.label,provider=excluded.provider,attribution=excluded.attribution,fetched_at=excluded.fetched_at,retry_after=excluded.retry_after`,
  ).bind(row.address_key, row.address, row.status, row.lat, row.lng, row.precision, row.label, row.provider, row.attribution, row.fetched_at, row.retry_after).run();
  return { ...fromRow(row), cached: false };
}

// Six decimal places is about 10 cm; anything finer is noise the provider made up.
const roundCoordinate = (value) => Math.round(Number(value) * 1e6) / 1e6;

function fromRow(row) {
  return {
    status: row.status,
    ...(row.status === "ok" ? { lat: Number(row.lat), lng: Number(row.lng) } : {}),
    precision: row.precision || null,
    label: row.label || null,
    provider: row.provider || null,
    attribution: row.attribution || null,
  };
}

/* ------------------------------------------------------------------ *
 * Applying it to a site
 * ------------------------------------------------------------------ */

const NOTE_KIND = "geo_unresolved";
const REASONS = {
  imprecise: "住所が番地まで特定できないため、位置情報（geo）を自動で付けていません。番地・建物名まで含む住所を入力すると自動で補完されます。",
  not_found: "住所から位置情報（geo）が見つかりませんでした。住所の表記をご確認ください。",
  error: "位置情報（geo）の取得に一時的に失敗しました。時間をおいて自動で再試行します。",
  unconfigured: "位置情報（geo）の自動補完は現在設定されていません。",
  rate_limited: "位置情報（geo）の取得が本日の上限に達しました。翌日以降に自動で再試行します。",
};

/**
 * Fill a site's geo from its own address, when that can be done honestly.
 *
 * Touches lat/lng only when they are empty, or were set by this geocoder for
 * an address the site no longer has. Coordinates a person entered, or that
 * Places or the site's own published schema supplied, are left alone.
 */
export async function geocodeSiteProfile(env, siteId, { now = Date.now(), fetchImpl = fetch, sleep } = {}) {
  // Switched off until a key is configured: no lookup, no table access, and no
  // owner notice about a feature the operator has not turned on.
  if (!geocoderConfig(env)) return { status: "disabled" };
  const { loadSiteProfile, writeSiteProfile } = await import("./api.mjs");
  const profile = await loadSiteProfile(env, siteId);
  if (!profile) return { status: "not_found_site" };
  const { values, sources } = profile;
  const address = normalizeAddress(values.address);
  const geoSource = sources.lat?.source || sources.lng?.source || null;
  const hasGeo = values.lat != null && values.lng != null;
  const ownGeo = geoSource === "geocoder";
  const forAddress = sources.lat?.address_key || null;

  if (!address) {
    // The address went away; coordinates this geocoder derived from it go with it.
    if (ownGeo && hasGeo) await writeSiteProfile(env, siteId, { lat: null, lng: null }, "geocoder");
    return { status: "empty" };
  }
  const key = await addressKey(address);
  if (hasGeo && !ownGeo) return { status: "kept", reason: "geo_set_by_other_source", source: geoSource };
  if (hasGeo && ownGeo && forAddress === key) return { status: "kept", reason: "already_geocoded" };

  const result = await geocodeAddress(env, address, { fetchImpl, now, sleep });
  const stamp = new Date(now).toISOString();
  if (result.status === "ok") {
    await writeSiteProfile(env, siteId, { lat: result.lat, lng: result.lng }, "geocoder", { addressKey: key });
    await env.DB.prepare(`UPDATE aeo_site_recommendations SET status='resolved',updated_at=? WHERE site_id=? AND kind=?`).bind(stamp, siteId, NOTE_KIND).run();
    return { ...result, applied: true };
  }
  // The address moved and the old coordinates no longer describe it.
  if (ownGeo && hasGeo) await writeSiteProfile(env, siteId, { lat: null, lng: null }, "geocoder");
  const detail = { reason: REASONS[result.status] || REASONS.error, status: result.status, precision: result.precision || null, address };
  await env.DB.prepare(
    `INSERT INTO aeo_site_recommendations(site_id,kind,created_at,updated_at,detail_json,status)
     VALUES(?,?,?,?,?,'open') ON CONFLICT(site_id,kind) DO UPDATE SET updated_at=excluded.updated_at,detail_json=excluded.detail_json,status='open'`,
  ).bind(siteId, NOTE_KIND, stamp, stamp, JSON.stringify(detail)).run();
  return { ...result, applied: false };
}
