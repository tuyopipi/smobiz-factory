/**
 * U2b Unit 2: the shared profile merger.
 *
 * These assertions are the contract every write path depends on, so they are
 * written against behaviour an operator would notice, not implementation.
 */
import assert from "node:assert/strict";
import {
  PROFILE_FIELDS, PROFILE_FIELD_NAMES, PROFILE_SOURCES,
  isHumanSource, mergeProfile, parseFieldSources, profileToColumns, rowToProfile, serializeFieldSources,
} from "../worker/site-profile.mjs";

const T0 = 1_700_000_000_000;

/* ---------------- field map ---------------- */

assert.equal(PROFILE_FIELDS.phone.column, "tel", "phone maps to the tel column");
assert.equal(PROFILE_FIELDS.address.column, "address", "address keeps its name");
assert.equal(PROFILE_FIELDS.phone.wp, "business_phone", "phone maps to the WordPress option key");
assert.equal(PROFILE_FIELDS.business_type_label.column, "business_type", "the label keeps the legacy column");
assert.equal(PROFILE_FIELDS.business_type_schema.column, "business_type_schema", "the schema type has its own column");
assert.equal(PROFILE_FIELDS.business_type_schema.wp, "business_type", "WordPress's business_type is the schema type");
assert.equal(PROFILE_FIELDS.url.table, "sites", "url lives on the sites row");
assert.equal(PROFILE_FIELDS.hours_periods.automatedOnly, true, "machine-readable hours have no human editor");
assert.deepEqual(PROFILE_SOURCES, ["wordpress", "dashboard", "places", "autofill"], "the four writers are fixed");
assert.ok(isHumanSource("wordpress") && isHumanSource("dashboard"), "wp-admin and the dashboard are human");
assert.ok(!isHumanSource("places") && !isHumanSource("autofill"), "Places and autofill are automated");

/* ---------------- server clock is the only clock ---------------- */

// A payload may claim any timestamp; the merger must ignore it entirely.
const forged = mergeProfile({
  current: { address: "旧住所" },
  sources: { address: { source: "wordpress", updated_at: T0 } },
  incoming: { address: "新住所", updated_at: 99_999_999_999_999, address_updated_at: 99_999_999_999_999 },
  source: "wordpress",
  now: T0 + 1000,
});
assert.equal(forged.values.address, "新住所", "the write still applies");
assert.equal(forged.sources.address.updated_at, T0 + 1000, "the stamp is the server clock, not the payload");
assert.ok(forged.sources.address.updated_at < 99_999_999_999_999, "a forged future timestamp is discarded");
assert.equal(forged.updated_at, T0 + 1000, "the record stamp is the server clock");

/* ---------------- value conventions ---------------- */

const base = {
  current: { name: "店名", address: "住所A", phone: "03-0000-0000" },
  sources: {
    name: { source: "wordpress", updated_at: T0 },
    address: { source: "wordpress", updated_at: T0 },
    phone: { source: "places", updated_at: T0 },
  },
};

const blank = mergeProfile({ ...base, incoming: { address: "" }, source: "wordpress", now: T0 + 1 });
assert.equal(blank.values.address, "住所A", "an empty string never overwrites a stored value");
assert.deepEqual(blank.changed, [], "a blank field is not a change");

const whitespace = mergeProfile({ ...base, incoming: { address: "   " }, source: "wordpress", now: T0 + 1 });
assert.equal(whitespace.values.address, "住所A", "whitespace is treated as blank");

const cleared = mergeProfile({ ...base, incoming: { address: null }, source: "wordpress", now: T0 + 1 });
assert.equal(cleared.values.address, null, "null is an explicit delete");
assert.deepEqual(cleared.changed, ["address"], "an explicit delete is a change");

const absent = mergeProfile({ ...base, incoming: {}, source: "wordpress", now: T0 + 1 });
assert.deepEqual(absent.values, base.current, "a field not supplied is left alone");
assert.deepEqual(absent.changed, [], "supplying nothing changes nothing");

const trimmed = mergeProfile({ ...base, incoming: { name: "  新店名  " }, source: "wordpress", now: T0 + 1 });
assert.equal(trimmed.values.name, "新店名", "values are trimmed");

/* ---------------- the demotion rule ---------------- */

// Places must not undo what a person typed.
const placesOverHuman = mergeProfile({
  ...base,
  incoming: { address: "Placesの住所", name: "Placesの店名" },
  source: "places",
  now: T0 + 1000,
});
assert.equal(placesOverHuman.values.address, "住所A", "Places does not overwrite a human address");
assert.equal(placesOverHuman.values.name, "店名", "Places does not overwrite a human name");
assert.deepEqual(placesOverHuman.changed, [], "a fully rejected Places write changes nothing");
assert.equal(placesOverHuman.rejected.length, 2, "both rejections are reported");
assert.equal(placesOverHuman.rejected[0].reason, "human_value_protected", "the reason is explicit");
assert.equal(placesOverHuman.rejected[0].owner, "wordpress", "the protecting source is named");

// Places may refresh a field it already owns.
const placesOverPlaces = mergeProfile({ ...base, incoming: { phone: "03-1111-2222" }, source: "places", now: T0 + 1000 });
assert.equal(placesOverPlaces.values.phone, "03-1111-2222", "Places may refresh a Places-owned field");
assert.equal(placesOverPlaces.sources.phone.source, "places", "ownership stays with Places");

// Places may fill a field nobody owns yet (the pre-migration state).
const placesFillsBlank = mergeProfile({
  current: { address: null }, sources: {},
  incoming: { address: "Placesの住所" }, source: "places", now: T0,
});
assert.equal(placesFillsBlank.values.address, "Placesの住所", "Places fills an unowned field");
assert.equal(placesFillsBlank.sources.address.source, "places", "and takes ownership of it");

// Autofill is automated too.
const autofillOverHuman = mergeProfile({ ...base, incoming: { address: "推定住所" }, source: "autofill", now: T0 + 1000 });
assert.equal(autofillOverHuman.values.address, "住所A", "autofill does not overwrite a human value either");

// A human always wins over an automated value.
const humanOverPlaces = mergeProfile({ ...base, incoming: { phone: "03-9999-9999" }, source: "dashboard", now: T0 + 1000 });
assert.equal(humanOverPlaces.values.phone, "03-9999-9999", "a person overrides a Places value");
assert.equal(humanOverPlaces.sources.phone.source, "dashboard", "and takes ownership");

// Once a human owns it, Places is locked out from then on.
const afterHuman = mergeProfile({
  current: humanOverPlaces.values, sources: humanOverPlaces.sources,
  incoming: { phone: "03-0000-1111" }, source: "places", now: T0 + 2000,
});
assert.equal(afterHuman.values.phone, "03-9999-9999", "the human value survives the next Places refresh");

/* ---------------- re-saving an unchanged form must not lock Places out ---- */

// A single Save in wp-admin re-submits every rendered field, including ones
// Places filled in. Claiming all of them would disable Places refresh for the
// whole record, so ownership only moves when a value actually changes.
const placesOwned = {
  current: { hours: "9:00-18:00", address: "Placesの住所" },
  sources: {
    hours: { source: "places", updated_at: T0 },
    address: { source: "places", updated_at: T0 },
  },
};
const resaveUnchanged = mergeProfile({
  ...placesOwned,
  incoming: { hours: "9:00-18:00", address: "Placesの住所" },
  source: "wordpress",
  now: T0 + 1000,
});
assert.deepEqual(resaveUnchanged.changed, [], "re-saving identical values changes nothing");
assert.equal(resaveUnchanged.sources.hours.source, "places", "untouched fields stay Places-owned");
const refreshAfterResave = mergeProfile({
  current: resaveUnchanged.values, sources: resaveUnchanged.sources,
  incoming: { hours: "10:00-19:00" }, source: "places", now: T0 + 2000,
});
assert.equal(refreshAfterResave.values.hours, "10:00-19:00", "Places can still refresh a field nobody edited");

// But editing one field protects that field and leaves the rest refreshable.
const editedOne = mergeProfile({
  ...placesOwned,
  incoming: { hours: "9:00-18:00", address: "手入力の住所" },
  source: "wordpress",
  now: T0 + 1000,
});
assert.deepEqual(editedOne.changed, ["address"], "only the edited field is a change");
assert.equal(editedOne.sources.address.source, "wordpress", "the edited field becomes human-owned");
assert.equal(editedOne.sources.hours.source, "places", "the untouched field keeps its old owner");
const mixedRefresh = mergeProfile({
  current: editedOne.values, sources: editedOne.sources,
  incoming: { hours: "10:00-19:00", address: "Placesの住所" }, source: "places", now: T0 + 2000,
});
assert.equal(mixedRefresh.values.hours, "10:00-19:00", "Places refreshes the untouched field");
assert.equal(mixedRefresh.values.address, "手入力の住所", "Places is still locked out of the edited one");

/* ---------------- human writers do not fight each other ---------------- */

const dashboardThenWp = mergeProfile({
  current: { address: "ダッシュボード住所" },
  sources: { address: { source: "dashboard", updated_at: T0 } },
  incoming: { address: "wp-admin住所" },
  source: "wordpress",
  now: T0 + 1000,
});
assert.equal(dashboardThenWp.values.address, "wp-admin住所", "the later human write wins");
assert.equal(dashboardThenWp.sources.address.source, "wordpress", "ownership moves to the later writer");

// Independent fields from different humans both survive.
const twoWriters = mergeProfile({
  current: dashboardThenWp.values, sources: dashboardThenWp.sources,
  incoming: { phone: "03-5555-5555" }, source: "dashboard", now: T0 + 2000,
});
assert.equal(twoWriters.values.address, "wp-admin住所", "the other writer's field is untouched");
assert.equal(twoWriters.values.phone, "03-5555-5555", "this writer's field is applied");

/* ---------------- machine-owned fields ---------------- */

const humanTriesPeriods = mergeProfile({
  current: {}, sources: {},
  incoming: { hours_periods: '[{"open":"09:00"}]' }, source: "wordpress", now: T0,
});
assert.equal(humanTriesPeriods.values.hours_periods, undefined, "a human cannot write the machine-only field");
assert.equal(humanTriesPeriods.rejected[0].reason, "automated_only", "the rejection reason is explicit");
const placesWritesPeriods = mergeProfile({
  current: {}, sources: {},
  incoming: { hours_periods: '[{"open":"09:00"}]' }, source: "places", now: T0,
});
assert.equal(placesWritesPeriods.values.hours_periods, '[{"open":"09:00"}]', "Places may write it");

/* ---------------- numeric fields ---------------- */

const coords = mergeProfile({ current: {}, sources: {}, incoming: { lat: "35.6", lng: 139.7 }, source: "places", now: T0 });
assert.equal(coords.values.lat, 35.6, "a numeric string becomes a number");
assert.equal(coords.values.lng, 139.7, "a number passes through");
const badCoords = mergeProfile({ current: { lat: 35.6 }, sources: {}, incoming: { lat: "not-a-number" }, source: "places", now: T0 });
assert.equal(badCoords.values.lat, 35.6, "an unparseable number is ignored, not stored as NaN");
const blankCoords = mergeProfile({ current: { lat: 35.6 }, sources: {}, incoming: { lat: "" }, source: "dashboard", now: T0 });
assert.equal(blankCoords.values.lat, 35.6, "a blank numeric field does not clear the value");

/* ---------------- unknown input is ignored ---------------- */

const injected = mergeProfile({
  current: {}, sources: {},
  incoming: { name: "店", site_id: "other-site", plan: "pro", serve_schema: 0, nonsense: 1 },
  source: "wordpress", now: T0,
});
assert.equal(injected.values.name, "店", "known fields are applied");
for (const key of ["site_id", "plan", "serve_schema", "nonsense"]) {
  assert.equal(injected.values[key], undefined, `unknown key is not merged: ${key}`);
}
assert.throws(() => mergeProfile({ incoming: {}, source: "attacker" }), /unknown_profile_source/, "an unknown source is refused");

/* ---------------- storage round trip ---------------- */

const settingsRow = {
  name: "ルミナ 表参道", business_type: "美容室", business_type_schema: "HairSalon",
  tel: "03-1234-5678", address: "東京都渋谷区", hours: "11:00-20:00", description: "説明",
  email: "a@example.test", lat: 35.6, lng: 139.7, image: null, reserve_url: "", price_level: null, price: null,
  hours_periods: null,
};
const siteRow = { website_uri: "https://example.test" };
const profile = rowToProfile(settingsRow, siteRow);
assert.equal(profile.phone, "03-1234-5678", "tel is read back as phone");
assert.equal(profile.business_type_label, "美容室", "the label is read back");
assert.equal(profile.business_type_schema, "HairSalon", "the schema type is read back");
assert.equal(profile.url, "https://example.test", "url is read from the sites row");
assert.equal(profile.reserve_url, null, "an empty column reads back as null, not an empty string");

const { settings, site } = profileToColumns(profile);
assert.equal(settings.tel, "03-1234-5678", "phone writes back to tel");
assert.equal(settings.business_type, "美容室", "the label writes back to business_type");
assert.equal(settings.business_type_schema, "HairSalon", "the schema type has its own column");
assert.equal(site.website_uri, "https://example.test", "url writes back to the sites row");
assert.equal(settings.website_uri, undefined, "the sites field does not leak into site_settings");
assert.ok(PROFILE_FIELD_NAMES.every((f) => f in profile), "every canonical field round-trips");

/* ---------------- provenance serialisation ---------------- */

assert.deepEqual(parseFieldSources(null), {}, "a missing map parses to empty");
assert.deepEqual(parseFieldSources("{}"), {}, "an empty map parses to empty");
assert.deepEqual(parseFieldSources("not json"), {}, "corrupt JSON degrades to empty rather than throwing");
assert.deepEqual(parseFieldSources('["a"]'), {}, "a non-object map is rejected");
assert.deepEqual(
  parseFieldSources('{"address":{"source":"wordpress","updated_at":5},"bogus":{"source":"wordpress","updated_at":1},"phone":{"source":"hacker","updated_at":1}}'),
  { address: { source: "wordpress", updated_at: 5 } },
  "unknown fields and unknown sources are dropped",
);
const roundTripped = parseFieldSources(serializeFieldSources({ name: { source: "places", updated_at: T0 } }));
assert.deepEqual(roundTripped, { name: { source: "places", updated_at: T0 } }, "provenance survives a round trip");

/* ---------------- SSOT: no writer may bypass the merger ---------------- */

// Every store-info write must go through mergeProfile(). A new INSERT/UPDATE
// against the profile columns would silently drop provenance, the Places
// demotion rule and the server-stamped clock, so the source is checked directly.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROFILE_COLUMNS = ["name", "tel", "address", "hours", "hours_periods", "business_type",
  "business_type_schema", "description", "email", "lat", "lng", "image", "reserve_url", "price_level", "price"];

for (const file of ["worker/api.mjs", "nurevo-impl/worker/api.mjs"]) {
  const source = readFileSync(join(repoRoot, file), "utf8");
  for (const match of source.matchAll(/INSERT INTO site_settings \(([^)]*)\)/g)) {
    const columns = match[1].split(",").map((c) => c.trim()).filter(Boolean);
    const profileColumns = columns.filter((c) => PROFILE_COLUMNS.includes(c));
    // The merger builds its column list dynamically, so a literal profile
    // column name in a hand-written INSERT means a bypass.
    assert.deepEqual(profileColumns, [],
      `${file}: a direct write touches profile columns [${profileColumns}] instead of using mergeProfile()`);
  }
  for (const match of source.matchAll(/UPDATE site_settings SET ([^`"']*)/g)) {
    const assigned = PROFILE_COLUMNS.filter((c) => new RegExp(`\\b${c}\\s*=`).test(match[1]));
    assert.deepEqual(assigned, [], `${file}: a direct UPDATE touches profile columns [${assigned}]`);
  }
}

// The sealed legacy handler must stay sealed and say why.
const legacy = readFileSync(join(repoRoot, "nurevo-impl/worker/api.mjs"), "utf8");
assert.ok(legacy.includes("direct site_settings write is sealed"), "the legacy write path is sealed with an explicit error");
assert.ok(legacy.includes("mergeProfile()"), "the seal points at the required path");
assert.equal(legacy.includes("INSERT INTO site_settings"), false, "no direct insert remains in the legacy file");

console.log("site profile merger tests passed");
