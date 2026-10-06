/**
 * Canonical store profile: the single merge point for every writer.
 *
 * wp-admin, the nurevo.jp dashboard and the Google Places import all write the
 * same record, and all of them go through mergeProfile(). Keeping the merge in
 * one pure function is what makes the three writers converge instead of
 * silently overwriting each other.
 *
 * Two rules do the real work:
 *
 *   Server time is the only clock. The merger never reads a timestamp from the
 *   payload, so a wrong or forged client clock cannot win a merge or park a
 *   field in the future where nothing can ever update it again.
 *
 *   Automated sources may not overwrite human ones. Places and the WordPress
 *   autofill may fill a blank or refresh a value they own, but they never
 *   replace something a person typed.
 */

/** Who wrote a field. The first two are people; the rest are machines. */
export const PROFILE_SOURCES = Object.freeze(["wordpress", "dashboard", "places", "autofill"]);
const HUMAN_SOURCES = Object.freeze(["wordpress", "dashboard"]);

export function isHumanSource(source) {
  return HUMAN_SOURCES.includes(source);
}

/**
 * The canonical field set.
 *
 * `column` is where it lives in site_settings; `table: "sites"` marks the one
 * field that lives on the sites row instead. `wp` is the matching WordPress
 * option key, or null when WordPress has no editor for it.
 */
export const PROFILE_FIELDS = Object.freeze({
  name: { column: "name", wp: "business_name" },
  description: { column: "description", wp: "business_description" },
  address: { column: "address", wp: "business_address" },
  phone: { column: "tel", wp: "business_phone" },
  hours: { column: "hours", wp: "business_hours" },
  // Machine-readable opening hours. Places owns this; there is no human editor,
  // so WordPress mirrors it read-only.
  hours_periods: { column: "hours_periods", wp: null, automatedOnly: true },
  // business_type used to hold both of these at once. Keeping them apart stops
  // a display label leaking into @type and a schema type leaking into the
  // questions asked during measurement.
  business_type_label: { column: "business_type", wp: null },
  business_type_schema: { column: "business_type_schema", wp: "business_type" },
  email: { column: "email", wp: "business_email" },
  url: { column: "website_uri", table: "sites", wp: "business_url" },
  lat: { column: "lat", wp: null, numeric: true },
  lng: { column: "lng", wp: null, numeric: true },
  image: { column: "image", wp: null },
  reserve_url: { column: "reserve_url", wp: null },
  price_level: { column: "price_level", wp: null },
  price: { column: "price", wp: null },
});

export const PROFILE_FIELD_NAMES = Object.freeze(Object.keys(PROFILE_FIELDS));

/* ------------------------------------------------------------------ *
 * Merge
 * ------------------------------------------------------------------ */

/**
 * Merge an incoming partial profile into the current one.
 *
 * `incoming` carries values only. Any timestamp in it is ignored by design -
 * `now` comes from the caller's own clock, which on the worker is the moment
 * the request was received.
 *
 * Value conventions:
 *   undefined  field not supplied; left untouched
 *   ""         treated as "not filled in"; never overwrites a stored value
 *   null       explicit delete, subject to the same permission check
 *
 * Returns the merged values, the updated provenance map, and which fields
 * actually moved, so a caller can skip a pointless write.
 */
export function mergeProfile({ current = {}, sources = {}, incoming = {}, source, now = Date.now() } = {}) {
  if (!PROFILE_SOURCES.includes(source)) {
    throw new Error(`unknown_profile_source:${source}`);
  }
  const values = { ...current };
  const nextSources = { ...sources };
  const changed = [];
  const rejected = [];

  for (const field of PROFILE_FIELD_NAMES) {
    if (!Object.prototype.hasOwnProperty.call(incoming, field)) continue;
    const definition = PROFILE_FIELDS[field];
    const proposed = normalizeValue(incoming[field], definition);

    // "" means the writer left the box blank, not that they cleared the value.
    if (proposed === undefined) continue;

    // Only Places-style writers may touch a machine-owned field.
    if (definition.automatedOnly && isHumanSource(source)) {
      rejected.push({ field, reason: "automated_only" });
      continue;
    }

    const owner = nextSources[field]?.source;
    if (!isHumanSource(source) && isHumanSource(owner)) {
      rejected.push({ field, reason: "human_value_protected", owner });
      continue;
    }

    // Ownership transfers only when the value actually moves. Re-saving the
    // wp-admin form without editing anything therefore does not claim every
    // field as human-owned, which would silently switch off Places refresh for
    // the whole record after a single Save.
    if (sameValue(values[field], proposed)) continue;

    values[field] = proposed;
    nextSources[field] = { source, updated_at: now };
    changed.push(field);
  }

  return {
    values,
    sources: nextSources,
    changed,
    rejected,
    // Record-level stamp, used for cheap "has anything moved" checks.
    updated_at: changed.length ? now : maxUpdatedAt(nextSources),
  };
}

function normalizeValue(raw, definition) {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  if (definition.numeric) {
    if (raw === "") return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  }
  const text = String(raw).trim();
  return text === "" ? undefined : text;
}

function sameValue(a, b) {
  if (a === null && b === null) return true;
  if (a === null || b === null || a === undefined || b === undefined) return a === b;
  return String(a) === String(b);
}

function maxUpdatedAt(sources) {
  let max = 0;
  for (const entry of Object.values(sources || {})) {
    const value = Number(entry?.updated_at || 0);
    if (value > max) max = value;
  }
  return max || null;
}

/* ------------------------------------------------------------------ *
 * Storage shape <-> canonical shape
 * ------------------------------------------------------------------ */

/** Build the canonical profile from a site_settings row plus its sites row. */
export function rowToProfile(settingsRow = {}, siteRow = {}) {
  const values = {};
  for (const [field, definition] of Object.entries(PROFILE_FIELDS)) {
    const row = definition.table === "sites" ? siteRow : settingsRow;
    const raw = row?.[definition.column];
    values[field] = raw === undefined || raw === "" ? null : raw;
  }
  return values;
}

/** Split merged values back into the two tables they are stored in. */
export function profileToColumns(values = {}) {
  const settings = {};
  const site = {};
  for (const [field, definition] of Object.entries(PROFILE_FIELDS)) {
    if (!Object.prototype.hasOwnProperty.call(values, field)) continue;
    const target = definition.table === "sites" ? site : settings;
    target[definition.column] = values[field] === undefined ? null : values[field];
  }
  return { settings, site };
}

export function parseFieldSources(raw) {
  if (!raw) return {};
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const clean = {};
    for (const [field, entry] of Object.entries(parsed)) {
      if (!PROFILE_FIELD_NAMES.includes(field) || !entry || typeof entry !== "object") continue;
      if (!PROFILE_SOURCES.includes(entry.source)) continue;
      clean[field] = { source: entry.source, updated_at: Number(entry.updated_at) || 0 };
    }
    return clean;
  } catch {
    return {};
  }
}

export function serializeFieldSources(sources) {
  return JSON.stringify(sources || {});
}

/** Shape returned to API clients: values plus where each one came from. */
export function profileResponse(values, sources, updatedAt) {
  return {
    profile: values,
    field_sources: sources || {},
    updated_at: updatedAt ?? null,
  };
}
