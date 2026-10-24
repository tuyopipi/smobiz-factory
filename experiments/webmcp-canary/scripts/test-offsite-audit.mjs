/**
 * Off-site listing audit (worker/offsite-audit.mjs, migration 0042,
 * public/dashboard-offsite.js), against a real SQLite with the real schema and
 * a stubbed Places API. No test reaches the network.
 *
 * What must hold:
 *  - normalisation: Japanese name, address and phone variants of one business
 *    compare equal; different ones do not; hours in the shapes owners type
 *    are read, and anything unreadable is "cannot compare", never "match";
 *  - matching: exact match, field-level mismatches (phone, address, hours),
 *    not found, several candidates (ambiguous until the owner picks), and a
 *    phone match settling a choice;
 *  - a missing key is "not configured" and calls nothing;
 *  - only place ids and our own outcome are stored, never the listing's values;
 *  - the allowance: Free once a calendar month, Standard/Pro every 10 minutes
 *    up to five a day; a pick after an ambiguous run is free (once); a global
 *    daily ceiling on Places calls; all reserved atomically before any call,
 *    so N parallel POSTs make exactly as many Places calls as allowed; runs
 *    that called nothing useful (ceiling, error) are refunded;
 *  - the endpoint: owner session, CSRF, viewer read-only, other orgs refused;
 *  - the daily cron audits Standard/Pro only, each once a week, within its
 *    share of the daily ceiling and its time budget, and skips cleanly
 *    without a key or before 0042;
 *  - Google Maps attribution (and third-party providers) next to Google data;
 *  - the dashboard card renders in all eight languages from dictionary words.
 */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import vm from "node:vm";
import {
  normalizeName, nameSimilarity, normalizeAddressParts, normalizePhone, parseHoursText, weekFromPeriods,
  compareName, compareAddress, comparePhone, compareHours, pickCandidate, manualChecklist, businessFamily,
  runOffsiteAudit, offsiteAuditRun, offsiteAuditView, manualAllowance, runOffsiteAuditScheduled, storableResult, OFFSITE_LIMITS,
} from "../worker/offsite-audit.mjs";
import { handleApi } from "../worker/api.mjs";
import { loadDictionary, LANGS } from "./dashboard-dictionary.mjs";

const sql = (file) => readFileSync(new URL(`../nurevo-impl/db/${file}`, import.meta.url), "utf8");

/* ================================================================== *
 * 1. Normalisation
 * ================================================================== */

// Names: legal designators, width, kana and spacing do not make two businesses.
assert.equal(normalizeName("株式会社 カフェしおり"), normalizeName("ｶﾌｪシオリ㈱"));
assert.equal(normalizeName("（有）山田商店"), normalizeName("山田商店"));
assert.equal(normalizeName("Cafe Shiori Co., Ltd."), normalizeName("CAFE SHIORI"));
assert.equal(normalizeName("ヶ丘ベーカリー"), normalizeName("ケ丘ベーカリー"));
assert.notEqual(normalizeName("カフェ栞"), normalizeName("カフェ楓"));
assert.ok(nameSimilarity("カフェ栞", "カフェ栞 渋谷店") >= 0.85, "a branch suffix is the same business");
assert.ok(nameSimilarity("カフェ栞", "焼肉たろう") < 0.3);
assert.equal(compareName("カフェ栞", "カフェ栞 渋谷店").status, "variant");
assert.equal(compareName("株式会社カフェ栞", "カフェ栞").status, "match");
assert.equal(compareName("", "x").status, "missing_ours");

// Addresses: Google's formatted address vs what owners type.
{
  const google = normalizeAddressParts("日本、〒150-0001 東京都渋谷区神宮前１丁目２−３ テストビル 2F");
  const ours = normalizeAddressParts("渋谷区神宮前一丁目2番3号");
  assert.equal(google.core, "渋谷区神宮前1-2-3");
  assert.equal(ours.core, google.core, "丁目/番/号, kanji numerals and full width fold to one form");
  assert.equal(google.pref, "東京都");
  assert.equal(google.building, "テストビル2f");
  assert.equal(normalizeAddressParts("〒060-0001 北海道札幌市中央区北1条西2丁目1-1").core, "札幌市中央区北1条西2-1-1", "a number inside the town name is not the block number");
  assert.equal(normalizeAddressParts("大阪府大阪市北区梅田3丁目1番地の1").core, "大阪市北区梅田3-1-1");
  assert.equal(compareAddress("東京都渋谷区神宮前1-2-3", "日本、〒150-0001 東京都渋谷区神宮前１丁目２−３").status, "match");
  assert.equal(compareAddress("渋谷区神宮前1-2-3 テストビル3F", "東京都渋谷区神宮前1-2-3 テストビル2F").note, "building_differs", "a different floor is noted, not a different place");
  assert.deepEqual(compareAddress("東京都渋谷区神宮前1-2-3", "東京都渋谷区神宮前1-2-5"), { status: "mismatch", reason: "block_number" });
  assert.equal(compareAddress("神奈川県横浜市西区1-2-3", "東京都横浜市西区1-2-3").reason, "prefecture");
  assert.equal(compareAddress("", "x").status, "missing_ours");
}

// Phones as E.164.
assert.equal(normalizePhone("03-1234-5678"), "+81312345678");
assert.equal(normalizePhone("０３‐１２３４‐５６７８"), "+81312345678", "full-width digits and Unicode hyphens");
assert.equal(normalizePhone("+81 3-1234-5678"), "+81312345678");
assert.equal(normalizePhone("+81 (0)3 1234 5678"), "+81312345678");
assert.equal(normalizePhone("090-1234-5678"), "+819012345678");
assert.equal(normalizePhone("0120-123-456"), "+81120123456");
assert.equal(normalizePhone("TEL: 03(1234)5678（代表）"), "+81312345678");
assert.equal(normalizePhone("1234"), null);
assert.equal(comparePhone("03-1234-5678", "+81 3-1234-5678").status, "match");
assert.equal(comparePhone("03-1234-5678", "03-1234-9999").status, "mismatch");
assert.equal(comparePhone("03-1234-5678", "").status, "missing_listing");
assert.equal(comparePhone("問い合わせはメールで", "03-1234-5678").status, "unverifiable");

// Hours.
const H = (h, m = 0) => h * 60 + m;
{
  const week = parseHoursText("11:00〜22:00（月曜定休）");
  assert.deepEqual(week[1], [], "Monday closed");
  assert.deepEqual(week[2], [[H(11), H(22)]]);
  assert.deepEqual(week[0], [[H(11), H(22)]]);
  const google = parseHoursText("月曜日: 11時00分～22時00分; 火曜日: 定休日; 水曜日: 11:00–15:00, 17:00–22:00");
  assert.deepEqual(google[1], [[H(11), H(22)]]);
  assert.deepEqual(google[2], []);
  assert.deepEqual(google[3], [[H(11), H(15)], [H(17), H(22)]]);
  assert.equal(google[0], null, "a day not mentioned is unknown, not closed");
  const split = parseHoursText("平日 11:00-15:00, 17:00-22:00 / 土日 10:00-20:00");
  assert.deepEqual(split[6], [[H(10), H(20)]]);
  assert.deepEqual(split[3], [[H(11), H(15)], [H(17), H(22)]]);
  assert.deepEqual(parseHoursText("18:00-翌2:00 日曜定休")[5], [[H(18), H(26)]], "past midnight");
  assert.deepEqual(parseHoursText("18:00-02:00")[5], [[H(18), H(26)]]);
  assert.deepEqual(parseHoursText("定休日：月曜・火曜 11:00-20:00")[2], []);
  assert.deepEqual(parseHoursText("24時間営業")[4], [[0, 1440]]);
  assert.equal(parseHoursText("要予約"), null, "unreadable is null, never guessed");
  assert.equal(parseHoursText(""), null);
}
const GOOGLE_PERIODS = (open = 11, close = 22, closedDay = 1) => [0, 1, 2, 3, 4, 5, 6].filter((d) => d !== closedDay)
  .map((day) => ({ open: { day, hour: open, minute: 0 }, close: { day, hour: close, minute: 0 } }));
{
  const google = weekFromPeriods(GOOGLE_PERIODS());
  assert.deepEqual(google[1], [], "a day without a period is closed in Google's data");
  assert.equal(compareHours(parseHoursText("11:00-22:00 月曜定休"), google).status, "match");
  const diff = compareHours(parseHoursText("11:00-21:00 月曜定休"), google);
  assert.equal(diff.status, "mismatch");
  assert.equal(diff.days.length, 6);
  assert.deepEqual(diff.days[0], { day: 0, ours: "11:00–21:00", theirs: "11:00–22:00" });
  assert.equal(compareHours(parseHoursText("要予約"), google, { oursText: true }).status, "unverifiable");
  assert.equal(compareHours(null, google).status, "missing_ours");
  assert.equal(compareHours(parseHoursText("月曜日: 定休日; 火曜日: 11:00-22:00"), google).status, "unverifiable", "two comparable days are not a match");
  assert.deepEqual(weekFromPeriods([{ open: { day: 0, hour: 0, minute: 0 } }])[3], [[0, 1440]], "open 24 hours");
  assert.deepEqual(weekFromPeriods([{ open: { day: 5, hour: 18, minute: 0 }, close: { day: 6, hour: 2, minute: 0 } }])[5], [[H(18), H(26)]]);
}

/* ================================================================== *
 * 2. Candidate selection
 * ================================================================== */

const PROFILE = { name: "カフェ栞", address: "東京都渋谷区神宮前1-2-3", phone: "03-1234-5678", hours: "11:00-22:00 月曜定休" };
const L = (over = {}) => ({ id: "ChIJ_shiori_main_0001", name: "カフェ栞", address: "日本、〒150-0001 東京都渋谷区神宮前１丁目２−３", phone: "+81 3-1234-5678", hours: null, ...over });

assert.equal(pickCandidate(PROFILE, [L()]).status, "found");
assert.equal(pickCandidate(PROFILE, []).status, "not_found");
assert.equal(pickCandidate(PROFILE, [L({ id: "x1", name: "焼肉たろう", phone: "03-0000-0000", address: "大阪府大阪市北区梅田1-1-1" })]).status, "not_found");
{
  // Two branches with the same name, and a profile that cannot tell them apart.
  const pick = pickCandidate({ name: "カフェ栞" }, [L({ id: "ChIJ_branch_a_00001" }), L({ id: "ChIJ_branch_b_00002", address: "東京都港区赤坂9-7-4" })]);
  assert.equal(pick.status, "ambiguous");
  assert.equal(pick.candidates.length, 2);
}
{
  // The phone settles it.
  const pick = pickCandidate(PROFILE, [L({ id: "ChIJ_other_branch_01", phone: "03-9999-9999", address: "東京都港区赤坂9-7-4" }), L()]);
  assert.equal(pick.status, "found");
  assert.equal(pick.best.listing.id, "ChIJ_shiori_main_0001");
}
{
  // Same name, but neither phone nor address agrees: not ours to decide.
  const pick = pickCandidate(PROFILE, [L({ phone: "03-9999-9999", address: "大阪府大阪市北区梅田1-1-1" })]);
  assert.equal(pick.status, "ambiguous");
}
{
  // Renamed, same phone and address.
  assert.equal(pickCandidate(PROFILE, [L({ name: "Shiori Coffee Roasters" })]).status, "found");
  // Two listings sharing the phone: flagged as a possible duplicate.
  assert.equal(pickCandidate(PROFILE, [L(), L({ id: "ChIJ_dup_000000001" })]).duplicates.length, 2);
}

/* ================================================================== *
 * 3. Checklist
 * ================================================================== */

assert.equal(businessFamily({ business_type_schema: "CafeOrCoffeeShop" }), "restaurant");
assert.equal(businessFamily({ business_type_label: "美容室" }), "beauty");
assert.equal(businessFamily({}), "unknown");
{
  const ids = (p) => manualChecklist(p).map((i) => i.id);
  assert.ok(ids({ business_type_schema: "Restaurant" }).includes("tabelog"));
  assert.ok(!ids({ business_type_schema: "Restaurant" }).includes("hotpepper_beauty"));
  assert.ok(ids({ business_type_schema: "HairSalon" }).includes("hotpepper_beauty"));
  assert.ok(!ids({ business_type_schema: "HairSalon" }).includes("tabelog"));
  assert.ok(!ids({ business_type_schema: "Dentist" }).includes("tabelog"), "a dentist is not asked about 食べログ");
  for (const id of ["bing", "apple", "yahoo", "instagram", "facebook"]) assert.ok(ids({}).includes(id), `${id} applies to everyone`);
  const unknown = manualChecklist({}).find((i) => i.id === "tabelog");
  assert.equal(unknown.applies, "if_applicable");
  const bing = manualChecklist({ name: "カフェ栞", address: "渋谷区" }).find((i) => i.id === "bing");
  assert.ok(bing.links.check.startsWith("https://www.bing.com/maps?q="), "a deep link built from our own name");
  assert.equal(bing.links.manage, "https://www.bing.com/forbusiness");
  assert.ok(bing.steps.includes("bing_import_google"));
  for (const item of manualChecklist({})) {
    assert.equal(item.status, "manual_check");
    for (const url of Object.values(item.links)) assert.ok(url.startsWith("https://"), `${item.id}: https links only`);
  }
}

/* ================================================================== *
 * 4. Running it against SQLite and a stubbed Places API
 * ================================================================== */

const sha = (v) => createHash("sha256").update(v).digest("hex");

function makeEnv({ key = "test-google-key", migrated = true, extra = {} } = {}) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(sql("schema.sql"));
  if (!migrated) sqlite.exec("DROP TABLE offsite_audits; DROP TABLE offsite_listing_refs; DROP TABLE offsite_audit_usage; DROP TABLE offsite_api_budget;");
  for (const stmt of ["ALTER TABLE sites ADD COLUMN manual_plan TEXT", "ALTER TABLE orgs ADD COLUMN manual_plan TEXT"]) {
    try { sqlite.exec(stmt); } catch { /* already there */ }
  }
  sqlite.exec(`INSERT INTO orgs(id) VALUES('o1'); INSERT INTO orgs(id) VALUES('o2');
    INSERT INTO members(id,org_id,email,role,status) VALUES('m1','o1','owner@shop.test','admin','active');
    INSERT INTO members(id,org_id,email,role,status) VALUES('m2','o1','viewer@shop.test','viewer','active');
    INSERT INTO members(id,org_id,email,role,status) VALUES('m3','o2','other@else.test','admin','active');
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("owner-token")}','m1','o1','session',${Date.now() + 3.6e6});
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("viewer-token")}','m2','o1','session',${Date.now() + 3.6e6});
    INSERT INTO sessions(token,member_id,org_id,kind,expires_at) VALUES('${sha("other-token")}','m3','o2','session',${Date.now() + 3.6e6});
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,created_at) VALUES('s1','o1','shop.test','https://shop.test/','k1','wp','free',1);
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,created_at) VALUES('s2','o1','std.test','https://std.test/','k2','wp','standard',2);
    INSERT INTO sites(id,org_id,url,website_uri,site_key,install_type,plan,created_at) VALUES('s3','o1','pro.test','https://pro.test/','k3','wp','pro',3);`);
  for (const id of ["s1", "s2", "s3"]) {
    sqlite.prepare("INSERT INTO site_settings(site_id,name,address,tel,hours,business_type_schema,field_sources) VALUES(?,?,?,?,?,?,?)")
      .run(id, "カフェ栞", "東京都渋谷区神宮前1-2-3", "03-1234-5678", "11:00-22:00 月曜定休", "CafeOrCoffeeShop", JSON.stringify({ name: { source: "dashboard", updated_at: 1 } }));
  }
  const DB = {
    prepare(text) {
      const wrap = (args) => ({
        async first() { return sqlite.prepare(text).get(...args) || null; },
        async all() { return { results: sqlite.prepare(text).all(...args) }; },
        async run() { return { meta: sqlite.prepare(text).run(...args) }; },
      });
      return { ...wrap([]), bind: (...args) => wrap(args) };
    },
    async batch(statements) { const out = []; for (const s of statements) out.push(await s.run()); return out; },
  };
  const kv = new Map();
  const WEBMCP_KV = { async get(k) { return kv.has(k) ? kv.get(k) : null; }, async put(k, v) { kv.set(k, v); } };
  return { sqlite, kv, env: { DB, WEBMCP_KV, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp", ...(key ? { GOOGLE_MAPS_API_KEY: key } : {}), ...extra } };
}

const PLACE = (over = {}) => ({
  id: "ChIJ_shiori_main_0001",
  displayName: { text: "カフェ栞", languageCode: "ja" },
  formattedAddress: "日本、〒150-0001 東京都渋谷区神宮前１丁目２−３ テストビル 2F",
  nationalPhoneNumber: "03-1234-5678",
  internationalPhoneNumber: "+81 3-1234-5678",
  regularOpeningHours: { periods: GOOGLE_PERIODS(), weekdayDescriptions: ["月曜日: 定休日", "火曜日: 11時00分～22時00分"] },
  businessStatus: "OPERATIONAL",
  googleMapsUri: "https://maps.google.com/?cid=1",
  ...over,
});

/** A Places stub: answers search and details from the given places, records calls. */
function placesStub(places, { status = 200, delayMs = 0 } = {}) {
  const calls = [];
  const impl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    // A real call takes time; parallel requests interleave around it.
    if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
    if (status !== 200) return { ok: false, status, json: async () => ({}) };
    if (String(url).endsWith("places:searchText")) return { ok: true, status: 200, json: async () => ({ places }) };
    const id = decodeURIComponent(String(url).match(/\/places\/([^?]+)/)[1]);
    const place = places.find((p) => p.id === id);
    return place ? { ok: true, status: 200, json: async () => place } : { ok: false, status: 404, json: async () => ({}) };
  };
  return { impl, calls };
}
const T0 = Date.UTC(2026, 9, 14, 3, 0, 0); // 2026-10-14 12:00 JST
const google = (result) => result.sources.find((s) => s.id === "google");
const stored = (sqlite, siteId = "s1") => sqlite.prepare("SELECT result_json FROM offsite_audits WHERE site_id=? ORDER BY ran_at DESC LIMIT 1").get(siteId).result_json;

/* ---------------- missing key: not configured, nothing called ---------------- */
{
  const { env, sqlite } = makeEnv({ key: "" });
  const stub = placesStub([PLACE()]);
  const result = await runOffsiteAudit(env, "s1", { fetchImpl: stub.impl, now: T0 });
  assert.equal(google(result).status, "not_configured");
  assert.equal(stub.calls.length, 0, "no key, no call");
  assert.ok(google(result).links.check.startsWith("https://www.google.com/maps/search/"), "a manual Google Maps link instead");
  assert.ok(result.manual.some((i) => i.id === "bing"), "the checklist is still there");
  assert.ok(result.manual.some((i) => i.id === "tabelog"), "a café gets 食べログ");
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM offsite_listing_refs").get().n, 0);
  const view = await offsiteAuditView(env, { id: "s1", org_id: "o1", plan: "free" }, { now: T0 });
  assert.equal(view.configured.google, false);
}

/* ---------------- exact match; what is stored ---------------- */
{
  const { env, sqlite } = makeEnv();
  const stub = placesStub([PLACE()]);
  const result = await runOffsiteAudit(env, "s1", { fetchImpl: stub.impl, now: T0 });
  const g = google(result);
  assert.equal(g.status, "match");
  for (const field of ["name", "address", "phone", "hours"]) assert.equal(g.fields[field].status, "match", field);
  assert.equal(g.fields.address.note, undefined, "our address has no building, so nothing differs");
  assert.equal(g.listing.id, "ChIJ_shiori_main_0001");
  assert.ok(g.listing.url.includes("query_place_id=ChIJ_shiori_main_0001"));
  assert.equal(g.attribution, "Google Maps");
  assert.deepEqual(g.attribution_providers, [], "no third-party provider named");
  assert.equal(g.confidence > 0.8, true, "the response carries the confidence");
  // The request: one Text Search, Japanese, the field mask, the key in a header (never the URL).
  assert.equal(stub.calls.length, 1);
  assert.ok(stub.calls[0].url.endsWith("places:searchText"));
  assert.equal(stub.calls[0].init.headers["x-goog-api-key"], "test-google-key");
  assert.ok(!stub.calls[0].url.includes("test-google-key"));
  assert.match(stub.calls[0].init.headers["x-goog-fieldmask"], /places\.nationalPhoneNumber/);
  assert.match(stub.calls[0].init.headers["x-goog-fieldmask"], /places\.attributions/, "third-party attributions are requested");
  assert.equal(JSON.parse(stub.calls[0].init.body).languageCode, "ja");
  // Stored: our outcome and the place id. Not Google's address, phone or hours.
  const json = stored(sqlite);
  assert.ok(!json.includes("テストビル"), "the listing's address is not stored");
  assert.ok(!json.includes("+81 3-1234-5678") && !json.includes("cid=1"), "nor its phone or URL");
  assert.ok(!json.includes("11時00分"), "nor its hours text");
  assert.ok(!JSON.parse(json).sources[0].observed);
  assert.equal(JSON.parse(json).sources[0].confidence, undefined, "nor scores computed from Google's values");
  assert.equal(JSON.parse(json).sources[0].fields.name.similarity, undefined);
  assert.equal(sqlite.prepare("SELECT listing_id FROM offsite_listing_refs WHERE site_id='s1'").get().listing_id, "ChIJ_shiori_main_0001");

  // The next run asks Place Details for the known id instead of searching.
  const again = await runOffsiteAudit(env, "s1", { fetchImpl: stub.impl, now: T0 + 1000 });
  assert.equal(google(again).status, "match");
  assert.equal(stub.calls.length, 2);
  assert.ok(stub.calls[1].url.includes("/v1/places/ChIJ_shiori_main_0001"), "Place Details by id");
}

/* ---------------- mismatched phone, address and hours ---------------- */
{
  const { env, sqlite } = makeEnv();
  const stub = placesStub([PLACE({
    nationalPhoneNumber: "03-9999-0000", internationalPhoneNumber: "+81 3-9999-0000",
    formattedAddress: "日本、〒150-0001 東京都渋谷区神宮前１丁目５−８",
    regularOpeningHours: { periods: GOOGLE_PERIODS(11, 21), weekdayDescriptions: ["火曜日: 11時00分～21時00分"] },
  })]);
  const result = await runOffsiteAudit(env, "s1", { fetchImpl: stub.impl, now: T0 });
  const g = google(result);
  assert.equal(g.status, "mismatch", "found by name, then differs");
  assert.equal(g.fields.phone.status, "mismatch");
  assert.equal(g.fields.address.status, "mismatch");
  assert.equal(g.fields.hours.status, "mismatch");
  assert.equal(g.fields.name.status, "match");
  assert.equal(g.observed.phone, "03-9999-0000", "the response says what Google shows");
  assert.equal(g.fields.hours.days[0].theirs, "11:00–21:00");
  assert.ok(g.steps.includes("decide_truth") && g.steps.includes("gbp_edit") && g.steps.includes("gbp_suggest"));
  const json = stored(sqlite);
  assert.ok(!json.includes("9999") && !json.includes("5−8") && !json.includes("1-5-8"), "the differing values are not stored");
  assert.deepEqual(JSON.parse(json).sources[0].fields.hours.days[0], { day: 0, ours: "11:00–22:00" }, "only our side of each day is kept");
  assert.deepEqual(JSON.parse(json).summary.mismatched_fields.sort(), ["google.address", "google.hours", "google.phone"]);
}

/* ---------------- closed on Google; values imported from Google ---------------- */
{
  const { env, sqlite } = makeEnv();
  sqlite.prepare("UPDATE site_settings SET field_sources=? WHERE site_id='s1'").run(JSON.stringify({ phone: { source: "places", updated_at: 1 } }));
  const result = await runOffsiteAudit(env, "s1", { fetchImpl: placesStub([PLACE({ businessStatus: "CLOSED_TEMPORARILY" })]).impl, now: T0 });
  const g = google(result);
  assert.equal(g.status, "mismatch");
  assert.equal(g.fields.business_status.status, "mismatch");
  assert.ok(g.steps.includes("gbp_reopen"));
  assert.equal(g.fields.phone.ours_from_listing, true, "agreement with a value copied from Google is flagged");
  assert.ok(g.steps.includes("ours_from_google"));
  assert.ok(!stored(sqlite).includes("CLOSED_TEMPORARILY"));
}

/* ---------------- not found ---------------- */
{
  const { env } = makeEnv();
  const result = await runOffsiteAudit(env, "s1", { fetchImpl: placesStub([PLACE({ id: "ChIJ_unrelated_00001", displayName: { text: "焼肉たろう" }, nationalPhoneNumber: "06-0000-0000", internationalPhoneNumber: "+81 6-0000-0000", formattedAddress: "大阪府大阪市北区梅田1-1-1" })]).impl, now: T0 });
  assert.equal(google(result).status, "not_found");
  assert.deepEqual(google(result).steps, ["gbp_create", "gbp_check_name"]);
}

/* ---------------- API failure ---------------- */
{
  const { env } = makeEnv();
  const quiet = console.error; console.error = () => {};
  try {
    const result = await runOffsiteAudit(env, "s1", { fetchImpl: placesStub([], { status: 500 }).impl, now: T0 });
    assert.equal(google(result).status, "error");
    assert.equal(google(result).error, "google_500");
  } finally { console.error = quiet; }
}

/* ---------------- several candidates, then the owner picks ---------------- */
{
  const { env, sqlite } = makeEnv();
  sqlite.prepare("UPDATE site_settings SET tel=NULL,address=NULL WHERE site_id='s1'").run();
  const places = [PLACE({ id: "ChIJ_branch_a_00001" }), PLACE({ id: "ChIJ_branch_b_00002", formattedAddress: "東京都港区赤坂9-7-4" })];
  const stub = placesStub(places);
  const site = { id: "s1", org_id: "o1", plan: "free" };
  const first = await offsiteAuditRun(env, site, {}, { fetchImpl: stub.impl, now: T0 });
  assert.equal(first.status, 200);
  const g = google(first.body.result);
  assert.equal(g.status, "ambiguous");
  assert.equal(g.candidates.length, 2);
  assert.ok(g.candidates[0].name, "the response lists the candidates to choose from");
  assert.deepEqual(JSON.parse(stored(sqlite)).sources[0].candidates, [{ id: "ChIJ_branch_a_00001" }, { id: "ChIJ_branch_b_00002" }], "only their ids are stored");
  assert.equal(first.body.allowance.allowed, false, "Free has used its monthly check");

  // A pick that was not offered is refused.
  assert.equal((await offsiteAuditRun(env, site, { pin: { source: "google", listing_id: "ChIJ_not_offered_0001" } }, { fetchImpl: stub.impl, now: T0 + 1000 })).body.error, "pin_not_offered");
  // The pick re-runs without spending the allowance.
  const picked = await offsiteAuditRun(env, site, { pin: { source: "google", listing_id: "ChIJ_branch_b_00002" } }, { fetchImpl: stub.impl, now: T0 + 2000 });
  assert.equal(picked.status, 200);
  assert.equal(google(picked.body.result).listing.id, "ChIJ_branch_b_00002");
  assert.equal(google(picked.body.result).listing.pinned, true);
  assert.equal(picked.body.result.trigger, "followup");
  assert.deepEqual({ ...sqlite.prepare("SELECT listing_id,pinned FROM offsite_listing_refs WHERE site_id='s1'").get() }, { listing_id: "ChIJ_branch_b_00002", pinned: 1 });
  // A pinned listing is compared as is on the next (paid) run, even with a weak name match.
  assert.ok(stub.calls.at(-1).url.includes("/places/ChIJ_branch_b_00002"));
}

/* ---------------- allowance: Free monthly, paid every 10 minutes / 5 a day ---------------- */
{
  const { env } = makeEnv();
  const stub = placesStub([PLACE()]);
  const free = { id: "s1", org_id: "o1", plan: "free" };
  assert.equal((await offsiteAuditRun(env, free, {}, { fetchImpl: stub.impl, now: T0 })).status, 200);
  const blocked = await offsiteAuditRun(env, free, {}, { fetchImpl: stub.impl, now: T0 + 3 * 86400000 });
  assert.equal(blocked.status, 429);
  assert.equal(blocked.body.allowance.reason, "monthly_limit");
  assert.equal(blocked.body.allowance.next_at, Date.UTC(2026, 10, 1) - 9 * 3600000, "next: 1 November, 00:00 JST");
  assert.equal((await offsiteAuditRun(env, free, {}, { fetchImpl: stub.impl, now: Date.UTC(2026, 10, 1) - 9 * 3600000 + 1 })).status, 200, "a new month, a new check");

  const std = { id: "s2", org_id: "o1", plan: "standard" };
  assert.equal((await offsiteAuditRun(env, std, {}, { fetchImpl: stub.impl, now: T0 })).status, 200);
  const soon = await offsiteAuditRun(env, std, {}, { fetchImpl: stub.impl, now: T0 + 60000 });
  assert.equal(soon.status, 429);
  assert.equal(soon.body.allowance.reason, "too_soon");
  let at = T0;
  for (let i = 1; i < OFFSITE_LIMITS.paidManualPerDay; i += 1) {
    at += OFFSITE_LIMITS.paidMinIntervalMs;
    assert.equal((await offsiteAuditRun(env, std, {}, { fetchImpl: stub.impl, now: at })).status, 200, `paid run ${i + 1}`);
  }
  const daily = await manualAllowance(env, "s2", "standard", at + OFFSITE_LIMITS.paidMinIntervalMs);
  assert.equal(daily.allowed, false);
  assert.equal(daily.reason, "daily_limit");
  assert.equal(daily.used, 5);
}

/* ---------------- the all-sites daily ceiling on Places calls ---------------- */
{
  const { env } = makeEnv({ extra: { OFFSITE_GOOGLE_DAILY_LIMIT: "1" } });
  const stub = placesStub([PLACE()]);
  assert.equal(google(await runOffsiteAudit(env, "s2", { fetchImpl: stub.impl, now: T0 })).status, "match");
  assert.equal(google(await runOffsiteAudit(env, "s3", { fetchImpl: stub.impl, now: T0 })).status, "rate_limited");
  assert.equal(stub.calls.length, 1, "the second site made no call");
  const noKv = makeEnv();
  delete noKv.env.WEBMCP_KV;
  assert.equal(google(await runOffsiteAudit(noKv.env, "s1", { fetchImpl: stub.impl, now: T0 })).status, "match", "the ceiling is kept in D1; KV is not needed");
  const noTable = makeEnv();
  noTable.sqlite.exec("DROP TABLE offsite_api_budget");
  const before = stub.calls.length;
  assert.equal(google(await runOffsiteAudit(noTable.env, "s1", { fetchImpl: stub.impl, now: T0 })).status, "rate_limited", "without the budget table the ceiling cannot be kept, so nothing is called");
  assert.equal(stub.calls.length, before);
  // A run that called nothing is not stored: the card keeps the previous outcome.
  assert.equal(noTable.sqlite.prepare("SELECT COUNT(*) n FROM offsite_audits").get().n, 0);
}

/* ---------------- parallel requests: reservations are atomic ---------------- */
{
  // Free: eight POSTs at once, one monthly run -> exactly one Places call.
  const { env } = makeEnv();
  const stub = placesStub([PLACE()], { delayMs: 5 });
  const free = { id: "s1", org_id: "o1", plan: "free" };
  const outcomes = await Promise.all(Array.from({ length: 8 }, () => offsiteAuditRun(env, free, {}, { fetchImpl: stub.impl, now: T0 })));
  assert.deepEqual(outcomes.map((o) => o.status).sort(), [200, 429, 429, 429, 429, 429, 429, 429]);
  assert.equal(stub.calls.length, 1, "exactly the allowed number of Google calls");
}
{
  // Standard: parallel POSTs at one moment -> one run (10-minute spacing);
  // then the five a day are five calls however they are fired.
  const { env } = makeEnv();
  const stub = placesStub([PLACE()], { delayMs: 5 });
  const std = { id: "s2", org_id: "o1", plan: "standard" };
  let at = T0;
  for (let round = 0; round < 7; round += 1, at += OFFSITE_LIMITS.paidMinIntervalMs) {
    await Promise.all(Array.from({ length: 6 }, () => offsiteAuditRun(env, std, {}, { fetchImpl: stub.impl, now: at })));
  }
  assert.equal(stub.calls.length, OFFSITE_LIMITS.paidManualPerDay, "36 POSTs over 7 rounds, five calls");
  assert.equal((await manualAllowance(env, "s2", "standard", at)).reason, "daily_limit");
}
{
  // The all-sites ceiling: nine audits at once against a ceiling of 3.
  const { env, sqlite } = makeEnv({ extra: { OFFSITE_GOOGLE_DAILY_LIMIT: "3" } });
  const stub = placesStub([PLACE()], { delayMs: 5 });
  const results = await Promise.all(["s1", "s2", "s3", "s1", "s2", "s3", "s1", "s2", "s3"].map((id) => runOffsiteAudit(env, id, { fetchImpl: stub.impl, now: T0 })));
  assert.equal(stub.calls.length, 3, "exactly the ceiling");
  assert.equal(results.filter((r) => google(r).status === "rate_limited").length, 6);
  assert.equal(sqlite.prepare("SELECT n FROM offsite_api_budget WHERE source='google'").get().n, 3);
  // A new UTC day, a new budget.
  await runOffsiteAudit(env, "s1", { fetchImpl: stub.impl, now: T0 + 86400000 });
  assert.equal(stub.calls.length, 4);
}
{
  // The free re-run after an ambiguous run is taken once, even in parallel.
  const { env, sqlite } = makeEnv();
  sqlite.prepare("UPDATE site_settings SET tel=NULL,address=NULL WHERE site_id='s1'").run();
  const stub = placesStub([PLACE({ id: "ChIJ_branch_a_00001" }), PLACE({ id: "ChIJ_branch_b_00002", formattedAddress: "東京都港区赤坂9-7-4" })], { delayMs: 5 });
  const free = { id: "s1", org_id: "o1", plan: "free" };
  assert.equal(google((await offsiteAuditRun(env, free, {}, { fetchImpl: stub.impl, now: T0 })).body.result).status, "ambiguous");
  const picks = await Promise.all(Array.from({ length: 4 }, () => offsiteAuditRun(env, free, { pin: { source: "google", listing_id: "ChIJ_branch_b_00002" } }, { fetchImpl: stub.impl, now: T0 + 1000 })));
  assert.deepEqual(picks.map((o) => o.status).sort(), [200, 429, 429, 429], "one free pick; the rest need the (used) allowance");
  assert.equal(stub.calls.length, 2);
}

/* ---------------- runs that called nothing useful are not counted ---------------- */
{
  // The daily ceiling is reached by another site: the Free run is refunded.
  const { env } = makeEnv({ extra: { OFFSITE_GOOGLE_DAILY_LIMIT: "1" } });
  const stub = placesStub([PLACE()]);
  await runOffsiteAudit(env, "s2", { fetchImpl: stub.impl, now: T0 });
  const free = { id: "s1", org_id: "o1", plan: "free" };
  const limited = await offsiteAuditRun(env, free, {}, { fetchImpl: stub.impl, now: T0 });
  assert.equal(limited.status, 200);
  assert.equal(google(limited.body.result).status, "rate_limited");
  assert.equal(limited.body.result.refunded, true);
  assert.equal(limited.body.allowance.used, 0, "the monthly run is still there");
  assert.equal(limited.body.allowance.reason, "too_soon", "spacing still applies");
  assert.equal((await offsiteAuditView(env, free, { now: T0 })).latest, null, "nothing stored for a run that called nothing");
  const nextDay = await offsiteAuditRun(env, free, {}, { fetchImpl: stub.impl, now: T0 + 86400000 });
  assert.equal(google(nextDay.body.result).status, "match", "the next day the same month's run works");
  assert.equal(nextDay.body.result.refunded, undefined);
  assert.equal(nextDay.body.allowance.reason, "monthly_limit", "and that one counts");
}
{
  // Google failed: refunded; retry after the 10-minute spacing.
  const { env } = makeEnv();
  const quiet = console.error; console.error = () => {};
  try {
    const free = { id: "s1", org_id: "o1", plan: "free" };
    const failed = await offsiteAuditRun(env, free, {}, { fetchImpl: placesStub([], { status: 500 }).impl, now: T0 });
    assert.equal(google(failed.body.result).status, "error");
    assert.equal(failed.body.result.refunded, true);
    assert.equal((await offsiteAuditRun(env, free, {}, { fetchImpl: placesStub([PLACE()]).impl, now: T0 + 60000 })).body.allowance.reason, "too_soon");
    const retry = await offsiteAuditRun(env, free, {}, { fetchImpl: placesStub([PLACE()]).impl, now: T0 + OFFSITE_LIMITS.paidMinIntervalMs });
    assert.equal(retry.status, 200);
    assert.equal(google(retry.body.result).status, "match");
    assert.equal(retry.body.allowance.reason, "monthly_limit");
  } finally { console.error = quiet; }
}

/* ---------------- third-party attribution ---------------- */
{
  const { env, sqlite } = makeEnv();
  const stub = placesStub([PLACE({ attributions: [{ provider: "Example Data Co.", providerUri: "https://data.example/" }, { provider: "Bad Link", providerUri: "javascript:alert(1)" }] })]);
  const g = google(await runOffsiteAudit(env, "s1", { fetchImpl: stub.impl, now: T0 }));
  assert.deepEqual(g.attribution_providers, [{ name: "Example Data Co.", uri: "https://data.example/" }, { name: "Bad Link", uri: null }]);
  assert.ok(!stored(sqlite).includes("Example Data"), "attributions are shown with the data, not stored");
}

/* ---------------- before 0042 ---------------- */
{
  const { env } = makeEnv({ migrated: false });
  const view = await offsiteAuditView(env, { id: "s1", org_id: "o1", plan: "free" });
  assert.equal(view.available, false);
  assert.equal(view.latest, null);
  assert.ok(view.checklist.length > 0, "the checklist needs no table");
  assert.equal((await offsiteAuditRun(env, { id: "s1", org_id: "o1", plan: "free" }, {})).status, 503);
  assert.equal((await runOffsiteAuditScheduled(env, { now: T0 })).status, "not_migrated");
}

/* ---------------- storableResult never keeps observed values ---------------- */
{
  const s = storableResult({ sources: [{ id: "google", observed: { phone: "x" }, candidates: [{ id: "a", name: "n", address: "a" }], fields: { hours: { status: "mismatch", days: [{ day: 1, ours: "o", theirs: "t" }] }, business_status: { status: "mismatch", value: "CLOSED_PERMANENTLY" } } }] });
  assert.deepEqual(s.sources[0], { id: "google", candidates: [{ id: "a" }], fields: { hours: { status: "mismatch", days: [{ day: 1, ours: "o" }] }, business_status: { status: "mismatch" } } });
  // A whitelist: a value added to the response later is not stored by accident.
  const w = storableResult({ sources: [{ id: "google", status: "mismatch", confidence: 0.9, attribution_providers: [{ name: "P" }], listing: { id: "ChIJ_x", url: "https://www.google.com/maps/search/?x", pinned: false, name: "theirs" }, new_google_value: "x", fields: { name: { status: "variant", similarity: 0.9, theirs: "n" } } }] });
  assert.deepEqual(w.sources[0], { id: "google", status: "mismatch", listing: { id: "ChIJ_x", url: "https://www.google.com/maps/search/?x", pinned: false }, fields: { name: { status: "variant" } } });
}

/* ================================================================== *
 * 5. The endpoint
 * ================================================================== */
{
  const { env } = makeEnv({ key: "" });
  const CSRF = "c".repeat(64);
  const call = (method, { token = "owner-token", csrf = true, site = "s1", body } = {}) => handleApi(new Request(`https://nurevo.jp/api/sites/${site}/offsite-audit`, {
    method,
    headers: {
      cookie: `nrv_session=${token}; nrv_csrf=${CSRF}`, origin: "https://nurevo.jp",
      ...(csrf ? { "x-csrf-token": CSRF } : {}), ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  }), env, { waitUntil() {} });

  assert.equal((await handleApi(new Request("https://nurevo.jp/api/sites/s1/offsite-audit"), env, { waitUntil() {} })).status, 401);
  const get = await call("GET");
  assert.equal(get.status, 200);
  const view = await get.json();
  assert.equal(view.plan, "free");
  assert.equal(view.schedule, "manual_monthly");
  assert.equal(view.configured.google, false);
  assert.equal(view.allowance.allowed, true);
  assert.equal(view.profile.phone, "03-1234-5678", "our own profile is shown back");
  assert.equal((await call("GET", { site: "s3" }).then((r) => r.json())).schedule, "weekly");
  assert.equal((await call("GET", { token: "other-token" })).status, 403, "another org's site");
  assert.equal((await call("GET", { site: "nope" })).status, 404);
  assert.equal((await call("POST", { csrf: false })).status, 403, "POST needs the CSRF token");
  assert.equal((await call("POST", { token: "viewer-token" })).status, 403, "a viewer can read but not run");
  const post = await call("POST");
  assert.equal(post.status, 200);
  const ran = await post.json();
  assert.equal(google(ran.result).status, "not_configured");
  assert.equal(ran.allowance.allowed, false);
  assert.equal((await call("POST")).status, 429, "Free: once a month");
  assert.equal((await call("POST", { body: { pin: { source: "google", listing_id: "bad id!" } } })).status, 400);
  const after = await (await call("GET")).json();
  assert.equal(after.latest.trigger, "manual");
  assert.equal(after.allowance.reason, "monthly_limit");
}

/* ================================================================== *
 * 6. The weekly cron
 * ================================================================== */
{
  const { env, sqlite } = makeEnv();
  const stub = placesStub([PLACE()]);
  const outcome = await runOffsiteAuditScheduled(env, { now: T0, fetchImpl: stub.impl });
  assert.equal(outcome.audited, 2, "the Standard and the Pro site");
  const audited = sqlite.prepare("SELECT site_id,trigger FROM offsite_audits ORDER BY site_id").all().map((r) => `${r.site_id}:${r.trigger}`);
  assert.deepEqual(audited, ["s2:scheduled", "s3:scheduled"], "Free is not audited by the cron");
  const again = await runOffsiteAuditScheduled(env, { now: T0 + 86400000, fetchImpl: stub.impl });
  assert.equal(again.audited, 0);
  assert.equal(again.not_due, 2, "a site audited this week is not due");
  assert.equal((await runOffsiteAuditScheduled(env, { now: T0 + 7 * 86400000, fetchImpl: stub.impl })).audited, 2, "and is a week later");
  // A Free site comped Standard through its org is audited.
  sqlite.exec("UPDATE orgs SET manual_plan='standard' WHERE id='o1'");
  assert.equal((await runOffsiteAuditScheduled(env, { now: T0 + 14 * 86400000, fetchImpl: stub.impl })).audited, 3);
  // Without a key there is nothing to do and nothing is written.
  const off = makeEnv({ key: "" });
  assert.equal((await runOffsiteAuditScheduled(off.env, { now: T0 })).status, "unconfigured");
  assert.equal(off.sqlite.prepare("SELECT COUNT(*) n FROM offsite_audits").get().n, 0);
}
{
  // The cron's share of the daily ceiling leaves room for owners' runs.
  const { env, sqlite } = makeEnv({ extra: { OFFSITE_GOOGLE_DAILY_LIMIT: "3" } });
  sqlite.exec("UPDATE orgs SET manual_plan='standard' WHERE id='o1'");
  const stub = placesStub([PLACE()]);
  const run = await runOffsiteAuditScheduled(env, { now: T0, fetchImpl: stub.impl });
  assert.equal(run.audited, 2, "3 paid sites, ceiling 3, one call kept for owners");
  assert.equal(run.stopped, "budget");
  assert.equal(stub.calls.length, 2);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM offsite_audits").get().n, 2, "the site that got no call is not marked audited");
  const owner = await offsiteAuditRun(env, { id: "s1", org_id: "o1", plan: "free" }, {}, { fetchImpl: stub.impl, now: T0 });
  assert.equal(google(owner.body.result).status, "match", "an owner can still run one");
  const tomorrow = await runOffsiteAuditScheduled(env, { now: T0 + 86400000, fetchImpl: stub.impl });
  assert.deepEqual([tomorrow.audited, tomorrow.not_due], [1, 2], "the site left out is audited the next day; the others are not due");
}
{
  // Many due sites: bounded by OFFSITE_AUDIT_CRON_LIMIT, then by time.
  const { env, sqlite } = makeEnv({ extra: { OFFSITE_AUDIT_CRON_LIMIT: "1" } });
  const stub = placesStub([PLACE()]);
  const first = await runOffsiteAuditScheduled(env, { now: T0, fetchImpl: stub.impl });
  assert.equal(first.audited, 1);
  assert.equal(first.stopped, "site_limit");
  assert.equal((await runOffsiteAuditScheduled(env, { now: T0 + 86400000, fetchImpl: stub.impl })).audited, 1, "the other one the next day");
  const timed = makeEnv();
  let fake = 0;
  const slow = await runOffsiteAuditScheduled(timed.env, { now: T0, fetchImpl: stub.impl, clock: () => (fake += OFFSITE_LIMITS.cronMaxMs + 1) });
  assert.equal(slow.stopped, "time_limit");
  assert.equal(slow.audited, 0);
  void sqlite;
}

/* ================================================================== *
 * 7. The dashboard card, in every language
 * ================================================================== */
{
  // Each language's own words: inline for ja/en, its dictionary file for the rest.
  const { I, files } = loadDictionary();
  const I5 = Object.fromEntries(LANGS.map((l) => [l, ["ja", "en"].includes(l) ? I[l] : files[l]]));
  const src = readFileSync(new URL("../public/dashboard-offsite.js", import.meta.url), "utf8");
  // Every key built from a status or id exists in every language.
  const dynamic = [
    ...["match", "mismatch", "not_found", "ambiguous", "not_configured", "error", "rate_limited", "skipped", "manual_check"].map((s) => `osSt_${s}`),
    ...["match", "variant", "mismatch", "missing_ours", "missing_listing", "unverifiable"].map((s) => `osFs_${s}`),
    ...["error", "rate_limited", "skipped"].map((s) => `osStatusNote_${s}`),
    ...[0, 1, 2, 3, 4, 5, 6].map((d) => `osDay${d}`),
    ...["name", "address", "phone", "hours", "website", "business_status"].map((f) => `osF_${f}`),
  ];
  const workerSrc = readFileSync(new URL("../worker/offsite-audit.mjs", import.meta.url), "utf8");
  const steps = new Set([...workerSrc.matchAll(/steps: \[([^\]]+)\]/g)].flatMap((m) => [...m[1].matchAll(/"(\w+)"/g)].map((x) => x[1])));
  for (const m of workerSrc.matchAll(/steps\.push\(([^)]+)\)|return \[("[\w"]+(?:, "\w+")*)\]/g)) for (const x of (m[1] || m[2]).matchAll(/"(\w+)"/g)) steps.add(x[1]);
  assert.ok(steps.size >= 25, `every fix step the worker can emit (${steps.size})`);
  const ids = manualChecklist({}).map((i) => i.id).concat(["google"]);
  const why = manualChecklist({}).map((i) => i.why_manual);
  for (const lang of LANGS) {
    for (const key of [...dynamic, ...[...steps].map((s) => `osStep_${s}`), ...ids.map((i) => `osSrc_${i}`), ...why.map((w) => `osWhyManual_${w}`)]) {
      assert.ok(typeof I5[lang][key] === "string" && I5[lang][key].trim(), `${lang}.${key}`);
    }
  }
  const JAPANESE = /[぀-ヺー-ヿ㐀-鿿]/;
  function element() {
    return { className: "", innerHTML: "", textContent: "", appendChild() {}, querySelector: () => null, addEventListener() {}, replaceWith() {} };
  }
  const freshMismatch = {
    ran_at: T0, profile: { name: "Cafe", address: "1-2-3", phone: "03-1234-5678", hours: "11:00-22:00" },
    sources: [{ id: "google", status: "mismatch", fields: { name: { status: "match" }, phone: { status: "mismatch" }, address: { status: "match", note: "building_differs" }, hours: { status: "mismatch", days: [{ day: 2, ours: "11:00–22:00", theirs: "closed" }] }, business_status: { status: "mismatch" } }, observed: { phone: "03-0000-0000" }, steps: ["decide_truth", "gbp_edit"], links: { manage: "https://business.google.com/" } }],
  };
  const storedAmbiguous = { ran_at: T0, sources: [{ id: "google", status: "ambiguous", candidates: [{ id: "ChIJ_x_000000001" }], steps: ["pick_listing"] }] };
  for (const lang of LANGS) {
    const t = (k) => (I[lang] || I.ja)[k] || I.ja[k] || k;
    const sandbox = {
      t, document: { createElement: element, querySelector: () => null, addEventListener() {}, head: { appendChild() {} }, documentElement: { lang } },
      MutationObserver: class { observe() {} }, setTimeout() {}, fetch: async () => { throw new Error("render only"); },
      Number, Math, String, Date, JSON, Array, Object, console,
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(src.replace(/\}\)\(\);\s*$/, "  window.__x = { panel };\n})();"), sandbox);
    const view = { available: true, configured: { google: true }, allowance: { allowed: false, reason: "monthly_limit", next_at: T0 }, schedule: "manual_monthly", checklist: manualChecklist({}), profile: {} };
    for (const [label, html] of [
      ["fresh mismatch", sandbox.window.__x.panel(view, freshMismatch).innerHTML],
      ["stored ambiguous", sandbox.window.__x.panel({ ...view, latest: storedAmbiguous }, null).innerHTML],
      ["not configured", sandbox.window.__x.panel({ ...view, configured: { google: false } }, null).innerHTML],
      ["unavailable", sandbox.window.__x.panel({ available: false }, null).innerHTML],
    ]) {
      assert.ok(!/\bos[A-Z]\w*/.test(html.replace(/nrv-os[\w-]*|data-os[\w-]*/g, "")), `${lang} ${label}: no raw key leaks (${(html.match(/\bos[A-Z]\w*/) || [])[0]})`);
      if (!["ja", "zh", "tw"].includes(lang)) assert.ok(!JAPANESE.test(html), `${lang} ${label}: no Japanese`);
    }
    const html = sandbox.window.__x.panel(view, freshMismatch).innerHTML;
    assert.ok(html.includes("03-0000-0000"), `${lang}: a fresh run shows what the listing says`);
    assert.ok(html.includes(I5[lang].osAttribution), `${lang}: with the Google Maps attribution`);
    assert.ok(html.includes('<span class="nrv-os-gmaps" translate="no">Google Maps</span>'), `${lang}: "Google Maps" as the untranslated wordmark`);
    assert.ok(!/Google Maps/.test(I5[lang].osAttribution), `${lang}: the wordmark is not part of a translatable string`);
    assert.ok(!sandbox.window.__x.panel({ ...view, latest: storedAmbiguous }, null).innerHTML.includes("nrv-os-gmaps"), `${lang}: no attribution when no Google data is shown`);
    const withProvider = sandbox.window.__x.panel(view, { ...freshMismatch, sources: [{ ...freshMismatch.sources[0], attribution_providers: [{ name: "Example Data Co.", uri: "https://data.example/" }] }] }).innerHTML;
    assert.ok(withProvider.includes("Google Maps</span><span class=\"nrv-os-providers\"> · <a href=\"https://data.example/\""), `${lang}: third-party providers next to Google Maps`);
    const refunded = sandbox.window.__x.panel(view, { ran_at: T0, refunded: true, sources: [{ id: "google", status: "rate_limited" }] }).innerHTML;
    assert.ok(refunded.includes(I5[lang].osRefunded), `${lang}: says the run was not counted`);
  }
  // The card is loaded by the dashboard.
  const dashboard = readFileSync(new URL("../public/dashboard.html", import.meta.url), "utf8");
  assert.ok(/<script src="\/dashboard-offsite\.js\?v=[\w-]+" defer><\/script>/.test(dashboard));
  // The attribution styling the Places policies ask for.
  for (const rule of ["font-family:Roboto", "font-weight:400", "font-style:normal", "font-size:12px", "letter-spacing:normal", "color:#5e5e5e"]) assert.ok(src.includes(`.nrv-os-gmaps{`) && src.split(".nrv-os-gmaps{")[1].split("}")[0].includes(rule), `wordmark: ${rule}`);
}

console.log("offsite audit tests passed (normalisation, matching, storage limits, atomic allowance and ceiling under parallel requests, refunds, endpoint, cron, attribution, 8-language card)");
