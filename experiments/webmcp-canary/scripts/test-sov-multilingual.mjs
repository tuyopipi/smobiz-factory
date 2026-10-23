/**
 * Multilingual SoV measurement: language choice, question templates, locality
 * parsing, aggregator exclusion and mention matching for non-Japanese sites -
 * and proof that a Japanese site measures exactly as it did before.
 * Fixtures only; no network.
 */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import {
  AGGREGATOR_HOSTS, SOV_LANGUAGES, analyzeAnswer, brandedControlQuestions, buildBrandProfile, buildQuestionSet,
  domainLabel, localityFromAddress, measureSov, mentionsBrand, profileIdentity, resolveSovLanguage, storeSovRun, loadSovHistory,
} from "../worker/aeo-sov.mjs";
import { ensureQuerySet, measurementKey, saveQuerySet, validateQuerySet } from "../worker/pro-report.mjs";
import { latinLocality } from "../worker/sov-locale.mjs";

/* ---------------- Japanese behaviour is frozen ---------------- */

const jaProfile = buildBrandProfile({
  site: { url: "shiori-coffee.example.jp" },
  settings: { name: "栞珈琲 本店", business_type: "喫茶店", address: "〒150-0001 東京都渋谷区神宮前1-2-3" },
  schemas: [],
});
assert.equal(jaProfile.language, "ja", "a Japanese address measures in Japanese");
assert.deepEqual(buildQuestionSet(jaProfile), [
  "渋谷区の喫茶店でおすすめはどこ？",
  "渋谷区の喫茶店を探しています。評判の良いところを教えて。",
  "渋谷区で人気の喫茶店を3つ挙げて。",
  "渋谷区の喫茶店の営業時間を知りたい。",
  "渋谷区の喫茶店で予約できるところは？",
  "渋谷区の喫茶店の料金相場と、おすすめの店を教えて。",
  "渋谷区の喫茶店で初めての人向けのところはどこ？",
  "渋谷区の喫茶店を駅から近い順に教えて。",
  "渋谷区の喫茶店の口コミが良いお店は？",
  "今日渋谷区の喫茶店に行きたい。候補を出して。",
], "the Japanese question set is byte-identical to the original templates");
assert.deepEqual(brandedControlQuestions(jaProfile, 3).map((q) => q.text),
  ["栞珈琲 本店はどんな喫茶店？", "栞珈琲 本店の営業時間と住所を教えて。", "栞珈琲 本店の評判は？"], "Japanese controls are unchanged");
const jaBare = buildBrandProfile({ site: { url: "x.example.com" }, settings: { name: "Only Name" }, schemas: [] });
assert.equal(jaBare.language, "ja", "no address and no other evidence keeps the Japanese default");
assert.equal(buildQuestionSet(jaBare)[0], "お店でおすすめはどこ？", "the Japanese generic type is still お店");
// A profile without `language` (hand-built by older callers) is Japanese.
assert.equal(buildQuestionSet({ name: "x", businessType: "美容室", locality: "渋谷区" })[0], "渋谷区の美容室でおすすめはどこ？");
for (const [address, locality] of [
  ["〒150-0001 東京都渋谷区神宮前1-2-3", "渋谷区"], ["〒530-0001 大阪府大阪市北区梅田1-1-1", "大阪市"],
  ["東京都", "東京都"], ["京都市中京区河原町", "京都市"], ["北海道札幌市中央区", "札幌市"],
]) assert.equal(localityFromAddress(address), locality, `Japanese address unchanged: ${address}`);
// The cache key / trend identity of a Japanese profile hashes the same fields as before.
assert.deepEqual(Object.keys(profileIdentity(jaProfile)), ["name", "businessType", "locality", "host", "aliases"]);
assert.deepEqual(jaProfile.aliases, ["栞珈琲 本店"], "aliases are not widened for Japanese profiles");
assert.equal(validateQuerySet({ questions: ["q"], repetitions: 1, competitors: [], language: "ja" }).language, undefined,
  "a Japanese query set config is stored exactly as before (no language key)");

/* ---------------- language decision ---------------- */

const lang = (input) => resolveSovLanguage(input).language;
assert.equal(lang({ address: "66 Mint St, San Francisco, CA 94103, USA" }), "en", "US address -> English");
assert.equal(lang({ address: "12 Rue de Rivoli, 75004 Paris, France" }), "fr", "French country -> French");
assert.equal(lang({ address: "1 Rue X, 75001 Paris" }), "fr", "French street words without a country -> French");
assert.equal(lang({ address: "Unter den Linden 77, 10117 Berlin, Deutschland" }), "de");
assert.equal(lang({ address: "Calle Mayor 10, 28013 Madrid, España" }), "es");
assert.equal(lang({ address: "Via del Corso 1, 00186 Roma RM, Italia" }), "it");
assert.equal(lang({ address: "Rua Augusta 100, 1100-053 Lisboa, Portugal" }), "pt");
assert.equal(lang({ address: "台北市信義區市府路45號" }), "zh-Hant", "Taiwanese address -> Traditional Chinese");
assert.equal(lang({ address: "上海市黄浦区南京东路100号" }), "zh-Hans", "mainland address -> Simplified Chinese");
assert.equal(lang({ address: "서울특별시 강남구 테헤란로 152" }), "ko", "Hangul address -> Korean");
assert.equal(lang({ address: "東京都渋谷区神宮前1-2-3" }), "ja");
assert.equal(lang({ address: "京都市中京区河原町" }), "ja", "a Han-only Japanese address stays Japanese");
assert.equal(lang({ address: "1-2-3 Jingumae, Shibuya-ku, Tokyo 150-0001, Japan" }), "ja", "a romanised Japanese address stays Japanese");
assert.equal(lang({ address: "100 Queen St W, Toronto, ON M5H 2N2, Canada", siteLanguage: "fr-CA" }), "fr",
  "the site locale picks between a multilingual country's languages");
assert.equal(lang({ address: "100 Queen St W, Toronto, ON M5H 2N2, Canada", siteLanguage: "de-DE" }), "en",
  "a site locale foreign to the country does not override it");
assert.equal(lang({ address: "1 Main St, Wilmington, DE 19801" }), "en", "a US state code is not read as a country (DE != Germany)");
assert.equal(lang({ address: "", siteLanguage: "es-MX" }), "es", "with no address the site's declared language is used");
assert.equal(lang({ name: "栞珈琲", siteLanguage: "en-US" }), "ja", "a Japanese name beats an installer-default en-US locale");
assert.equal(lang({ address: "", schemaCountry: "KR" }), "ko", "schema addressCountry ISO codes are honoured");
assert.equal(lang({ address: "", siteLanguage: "zh-TW" }), "zh-Hant");
assert.equal(lang({ address: "Some place 9" }), "en", "an unplaceable non-Japanese address falls back to English");
assert.equal(lang({ address: "", settingsLanguage: "it" }), "it", "an explicit profile language wins");
for (const tag of SOV_LANGUAGES) assert.ok(typeof tag === "string");

// Language comes from the published schema when the owner gave no address.
const enFromSchema = buildBrandProfile({
  site: { website_uri: "https://lumina-bistro.co.uk/" },
  settings: {},
  schemas: [{ "@type": "Restaurant", name: "Lumina Bistro", inLanguage: "en-GB",
    address: { "@type": "PostalAddress", streetAddress: "5 High Street", addressLocality: "Oxford", postalCode: "OX1 4AA", addressCountry: "GB" } }],
});
assert.equal(enFromSchema.language, "en");
assert.equal(enFromSchema.locality, "Oxford");
assert.equal(enFromSchema.name, "Lumina Bistro");
assert.equal(buildQuestionSet(enFromSchema)[0], "What's the best restaurant in Oxford?", "schema enum types are translated");
assert.equal(buildQuestionSet({ name: "x", language: "en", businessType: "HairSalon", locality: "" })[0], "What's the best hair salon?");
assert.equal(buildQuestionSet({ name: "x", language: "en", businessType: "AutoPartsStore", locality: "" })[0], "What's the best auto parts store?", "unlisted enums are humanised in English");

/* ---------------- templates ---------------- */

const jaCount = buildQuestionSet(jaProfile).length;
for (const language of SOV_LANGUAGES) {
  const profile = { name: "Lumina", businessType: "", locality: "Springfield", language };
  const questions = buildQuestionSet(profile);
  assert.equal(questions.length, jaCount, `${language}: same number of discovery questions as Japanese`);
  assert.equal(new Set(questions).size, questions.length, `${language}: questions are unique`);
  assert.ok(questions.every((q) => !q.includes("お店") || language === "ja"), `${language}: no Japanese default type leaks`);
  assert.ok(questions.every((q) => q.includes("Springfield")), `${language}: every question names the area`);
  assert.ok(questions.every((q) => !q.includes("Lumina")), `${language}: discovery questions never name the brand`);
  assert.ok(questions.every((q) => !/\s{2,}|undefined|null/.test(q)), `${language}: no template debris`);
  const noArea = buildQuestionSet({ ...profile, locality: "" });
  assert.equal(noArea.length, jaCount, `${language}: an absent area still yields a full set`);
  assert.ok(noArea.every((q) => !/\b(?:in|en|à|a|em)\s*[?.,]/.test(q) && !/^\s/.test(q)), `${language}: no dangling preposition without an area`);
  const controls = brandedControlQuestions(profile, 3);
  assert.equal(controls.length, 3, `${language}: three branded controls`);
  assert.ok(controls.every((c) => c.kind === "branded" && c.text.includes("Lumina")), `${language}: controls name the brand`);
}
assert.equal(buildQuestionSet({ name: "x", language: "en", businessType: "", locality: "" })[0], "What's the best local business?");
assert.equal(buildQuestionSet({ name: "x", language: "de", businessType: "", locality: "Berlin" })[0], "Was sind die besten Adressen für Geschäfte vor Ort in Berlin?");
assert.equal(buildQuestionSet({ name: "x", language: "fr", businessType: "Bakery", locality: "Lyon" })[0], "Quelles sont les meilleures adresses de boulangerie à Lyon ?");
assert.equal(buildQuestionSet({ name: "x", language: "fr", businessType: "hôtel", locality: "Nice" })[0], "Quelles sont les meilleures adresses d'hôtel à Nice ?", "French elision");
assert.equal(buildQuestionSet({ name: "x", language: "ko", businessType: "카페", locality: "강남구" })[0], "강남구 카페 추천해 주세요.");
assert.equal(buildQuestionSet({ name: "x", language: "zh-Hant", businessType: "", locality: "台北市" })[0], "台北市有什麼推薦的店家？");
assert.equal(buildQuestionSet({ name: "x", language: "zh-Hans", businessType: "Restaurant", locality: "上海市" })[0], "上海市有什么推荐的餐厅？");
assert.equal(buildQuestionSet({ name: "x", language: "es", businessType: "AutoPartsStore", locality: "" })[0], "¿Cuál es el mejor sitio de negocio local?",
  "an untranslated schema enum falls back to the generic word rather than leaking CamelCase");
assert.equal(buildQuestionSet({ name: "x", language: "en", businessType: "", locality: "Austin" }, 3).length, 3, "the limit applies to every language");

/* ---------------- locality parsing ---------------- */

for (const [address, locality] of [
  ["1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA", "Mountain View"],
  ["350 5th Ave, New York, NY 10118", "New York"],
  ["221B Baker Street, London NW1 6XE, United Kingdom", "London"],
  ["Flat 2, 5 High Street, Oxford OX1 4AA", "Oxford"],
  ["Unter den Linden 77, 10117 Berlin, Deutschland", "Berlin"],
  ["Hauptstraße 5, 80331 München", "München"],
  ["12 Rue de Rivoli, 75004 Paris, France", "Paris"],
  ["Calle Mayor 10, 28013 Madrid, España", "Madrid"],
  ["Via del Corso 1, 00186 Roma RM, Italia", "Roma"],
  ["Rua Augusta 100, 1100-053 Lisboa, Portugal", "Lisboa"],
  ["Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100, Brasil", "São Paulo"],
  ["123 George St, Sydney NSW 2000, Australia", "Sydney"],
  ["100 Queen St W, Toronto, ON M5H 2N2, Canada", "Toronto"],
  ["Keizersgracht 123, 1015 CJ Amsterdam, Netherlands", "Amsterdam"],
  ["No. 45, Shifu Rd, Xinyi District, Taipei City 110, Taiwan", "Taipei City"],
  ["台北市信義區市府路45號", "台北市"],
  ["台灣台北市大安區忠孝東路四段1號", "台北市"],
  ["上海市黄浦区南京东路100号", "上海市"],
  ["广东省深圳市南山区科技园", "深圳市"],
  ["香港中環皇后大道中1號", "香港"],
  ["서울특별시 강남구 테헤란로 152", "강남구"],
  ["부산광역시 해운대구 우동 1408", "해운대구"],
]) assert.equal(localityFromAddress(address), locality, `locality of ${address}`);
// Conservative: unclear structure gives no area, never a street fragment.
for (const address of ["Some random text", "Paris", "123 Main Street", "Suite 400, 55 Water St", "USA"]) {
  assert.equal(latinLocality(address), "", `no locality guessed from: ${address}`);
}
const noArea = buildBrandProfile({ site: { url: "acme-plumbing.com" }, settings: { name: "Acme Plumbing", business_type: "plumber", address: "123 Main Street" }, schemas: [] });
assert.equal(noArea.locality, "");
assert.equal(buildQuestionSet(noArea)[0], "What's the best plumber?", "an unparseable address yields questions without an area");

/* ---------------- aggregators ---------------- */

for (const host of ["tabelog.com", "hotpepper.jp", "retty.me", "yelp.com", "tripadvisor.com", "foursquare.com", "opentable.com",
  "thefork.com", "booking.com", "expedia.com", "dianping.com", "meituan.com", "naver.com", "map.kakao.com"]) {
  assert.ok(AGGREGATOR_HOSTS.includes(host), `${host} is in the single aggregator list`);
}
const usProfile = buildBrandProfile({
  site: { website_uri: "https://bluebottle-sf.com" },
  settings: { name: "Blue Bottle Coffee", business_type: "coffee shop", address: "66 Mint St, San Francisco, CA 94103, USA" },
  schemas: [],
});
const enAnswer = analyzeAnswer({
  profile: usProfile,
  answer: "Top picks: Sightglass, Ritual Coffee Roasters and Blue Bottle Coffee (Mint Plaza). See https://www.yelp.com/biz/x",
  citations: ["https://www.yelp.com/search?x", "https://m.yelp.com/biz/y", "https://www.tripadvisor.com/x", "https://www.google.com/maps/place/x",
    "https://maps.app.goo.gl/abc", "https://www.opentable.com/r/x", "https://www.thefork.com/x", "https://www.booking.com/x",
    "https://foursquare.com/v/x", "https://sightglass.com/", "https://bluebottle-sf.com/locations"],
});
assert.equal(enAnswer.mentioned, true);
assert.equal(enAnswer.cited, true);
assert.deepEqual(enAnswer.competitorHosts, ["sightglass.com"], "global aggregators are not competitors");

const zhAnswer = analyzeAnswer({
  profile: { name: "春水堂", aliases: ["春水堂"], host: "chunshuitang.com.tw", language: "zh-Hant" },
  answer: "台中推薦：春水堂人文茶館、陳三鼎。",
  citations: ["https://www.dianping.com/shop/1", "https://www.meituan.com/x", "https://www.openrice.com/zh/x", "https://ifoodie.tw/x",
    "https://chunshuitang.com.tw/", "https://rival-tea.com.tw/"],
});
assert.equal(zhAnswer.mentioned, true, "a CJK alias is still a plain substring match");
assert.deepEqual(zhAnswer.competitorHosts, ["rival-tea.com.tw"]);

const koAnswer = analyzeAnswer({
  profile: { name: "온더플랜", aliases: ["온더플랜"], host: "ontheplan.kr", language: "ko" },
  answer: "강남구 카페로는 온더플랜, 카페 노티드가 인기입니다.",
  citations: ["https://m.place.naver.com/x", "https://map.naver.com/p/x", "https://blog.naver.com/x", "https://place.map.kakao.com/123",
    "https://www.mangoplate.com/x", "https://cafeknotted.com/"],
});
assert.equal(koAnswer.mentioned, true);
assert.deepEqual(koAnswer.competitorHosts, ["cafeknotted.com"], "Naver / Kakao / Mangoplate are aggregators");

const jaAnswer = analyzeAnswer({
  profile: jaProfile,
  answer: "渋谷区なら栞珈琲 本店が人気です。",
  citations: ["https://tabelog.com/x", "https://retty.me/x", "https://www.hotpepper.jp/x", "https://rival.example.jp/"],
});
assert.equal(jaAnswer.mentioned, true);
assert.deepEqual(jaAnswer.competitorHosts, ["rival.example.jp"], "Japanese aggregators are still excluded");

/* ---------------- mention matching ---------------- */

assert.equal(mentionsBrand("Try Café Müller on Main St.", ["Cafe Muller"]), true, "accents folded");
assert.equal(mentionsBrand("Try Cafe Mueller on Main St.", ["Café Müller"]), true, "German umlaut transliteration");
assert.equal(mentionsBrand("We love STRAUSS BAKERY.", ["Strauß Bakery"]), true, "ß folds to ss, case-insensitive");
assert.equal(mentionsBrand("BlueBottle and blue-bottle both count", ["Blue Bottle"]), true, "joined / hyphenated forms");
assert.equal(mentionsBrand("Lunatic Bar is good", ["Luna"]), false, "word boundary: Luna is not Lunatic");
assert.equal(mentionsBrand("Blue Bottles are nice", ["Blue Bottle"]), false, "word boundary at the end");
assert.equal(mentionsBrand("おすすめはNurevoです", ["Nurevo"]), true, "a Latin name inside Japanese text still matches");
assert.equal(mentionsBrand("推荐Blue Bottle Coffee。", ["Blue Bottle Coffee"]), true, "a Latin name inside Chinese text still matches");
assert.equal(mentionsBrand("La Tête d'Or est super", ["La Tete dOr"]), true, "apostrophes and accents ignored");

// The domain label is an extra alias, outside URLs only, and only when distinctive.
assert.equal(domainLabel("www.lumina-salon.co.uk"), "lumina-salon");
assert.equal(domainLabel("shiori-coffee.example.jp"), "example", "domainLabel itself is mechanical; the alias filter decides");
assert.equal(usProfile.domain_alias, "bluebottle-sf");
const byDomain = analyzeAnswer({ profile: usProfile, answer: "Check out Bluebottle-SF for a pour-over.", citations: [] });
assert.equal(byDomain.mentioned, true, "the domain name counts as a mention when written in text");
const urlOnly = analyzeAnswer({ profile: usProfile, answer: "Sources: https://bluebottle-sf.com/about", citations: [] });
assert.equal(urlOnly.mentioned, false, "a bare URL is citation evidence, not a name mention");
assert.equal(urlOnly.cited, true);
const generic = buildBrandProfile({ site: { url: "shop.com" }, settings: { name: "Corner Shop", address: "1 High St, Leeds LS1 1AA, UK" }, schemas: [] });
assert.equal(generic.domain_alias, "", "an everyday-word domain is not an alias");
const same = buildBrandProfile({ site: { url: "blue-bottle.com" }, settings: { name: "Blue Bottle", address: "1 Main St, Oakland, CA 94607" }, schemas: [] });
assert.equal(same.domain_alias, "", "a domain equal to the name adds no alias");
assert.equal(jaProfile.domain_alias, "", "'example' is a reserved label and never becomes an alias");
const jaDomain = buildBrandProfile({ site: { url: "shiori-kohi.jp" }, settings: { name: "栞珈琲", address: "東京都渋谷区神宮前1-2-3" }, schemas: [] });
assert.equal(analyzeAnswer({ profile: jaDomain, answer: "shiori-kohiという店が人気です。", citations: [] }).mentioned, false,
  "Japanese profiles keep the original mention rule (no domain alias)");

/* ---------------- end to end with the fake engine, language persisted ---------------- */

const sqlite = new DatabaseSync(":memory:");
for (const file of ["0018_aeo_sov.sql", "0022_sov_engine_split.sql", "0031_pro_measurement.sql", "0034_sov_evidence_usage.sql"]) {
  sqlite.exec(readFileSync(new URL(`../nurevo-impl/db/${file}`, import.meta.url), "utf8"));
}
sqlite.exec(`CREATE TABLE aeo_scores(site_id TEXT,scanned_at TEXT,ruleset_version INTEGER,delivered_ruleset_version INTEGER,score_model_version TEXT);
CREATE TABLE aeo_learning_observations(run_id TEXT PRIMARY KEY,site_id TEXT,measured_at TEXT,score_scanned_at TEXT,scoring_ruleset_version INTEGER,delivered_ruleset_version INTEGER,model_version TEXT,measurement_json TEXT);`);
const DB = { prepare(sql) { return { bind(...args) { const stmt = sqlite.prepare(sql); return {
  async first() { return stmt.get(...args) || null; }, async all() { return { results: stmt.all(...args) }; },
  async run() { return { meta: stmt.run(...args) }; },
}; } }; }, async batch(statements) { for (const s of statements) await s.run(); } };
const env = { DB, PERPLEXITY_API_KEY: "mock-only" };

const deProfile = buildBrandProfile({
  site: { url: "baeckerei-mueller.de" },
  settings: { name: "Bäckerei Müller", business_type: "Bäckerei", address: "Hauptstraße 5, 80331 München" },
  schemas: [],
});
assert.equal(deProfile.language, "de");
assert.equal(deProfile.locality, "München");
const asked = [];
const fetchImpl = async (url, init) => {
  const question = JSON.parse(init.body).input;
  asked.push(question);
  return new Response(JSON.stringify({ output: [
    { type: "message", content: [{ type: "output_text", text: asked.length % 2 ? "In München empfehlen wir die Baeckerei Mueller und Rischart." : "Rischart ist beliebt." }] },
    { type: "search_results", results: [{ url: "https://www.yelp.de/biz/x" }, { url: "https://www.tripadvisor.de/x" }, { url: "https://www.rischart.de/" }] },
  ] }));
};
const config = await ensureQuerySet(env, "de-site", deProfile);
assert.equal(config.language, "de", "the generated query set records its language");
assert.ok(config.questions.every((q) => q.includes("München")), "generated questions are German with the parsed city");
const result = await measureSov(env, deProfile, { questions: config.questions, repetitions: 1, engineIds: ["perplexity"], fetchImpl });
assert.ok(asked.every((q) => /München/.test(q) && !/[ぁ-ん]/.test(q)), "the engine is asked in German");
assert.equal(result.language, "de", "the measurement reports the language used");
assert.equal(result.answers_received, 5);
assert.equal(result.appearances, 3, "transliterated 'Baeckerei Mueller' matches 'Bäckerei Müller'");
assert.deepEqual(result.competitors.map((c) => c.host), ["rischart.de"], "Yelp/Tripadvisor country sites are not competitors");
result.query_set = config;
result.cache_key = await measurementKey(env, config, deProfile);
await storeSovRun(env, "de-site", result);
const history = await loadSovHistory(env, "de-site");
assert.equal(history.latest.language, "de", "the language is stored in detail_json and read back");

// A legacy auto-generated Japanese set for a site now known to be non-Japanese
// is replaced; an owner-edited one is left alone.
await saveQuerySet(env, "legacy-en", { questions: buildQuestionSet({ name: "x", businessType: "お店", locality: "" }).slice(0, 5), repetitions: 3, competitors: ["rival.com"] });
const enProfile = buildBrandProfile({ site: { url: "acme-cafe.com" }, settings: { name: "Acme Cafe", business_type: "cafe", address: "1 Main St, Austin, TX 78701, USA" }, schemas: [] });
const migrated = await ensureQuerySet(env, "legacy-en", enProfile);
assert.equal(migrated.language, "en");
assert.equal(migrated.questions[0], "What's the best cafe in Austin?");
assert.equal(migrated.repetitions, 3, "the owner's repetitions are kept");
assert.deepEqual(migrated.competitors, ["rival.com"], "the owner's competitors are kept");
await saveQuerySet(env, "edited-en", { questions: ["My own question?"], repetitions: 2, competitors: [] });
assert.deepEqual((await ensureQuerySet(env, "edited-en", enProfile)).questions, ["My own question?"], "an owner-edited set is never replaced");
await saveQuerySet(env, "ja-site", { questions: buildQuestionSet(jaProfile).slice(0, 5), repetitions: 2, competitors: [] });
const jaConfig = await ensureQuerySet(env, "ja-site", jaProfile);
assert.equal(jaConfig.version, 1, "a Japanese site's stored set is untouched");
assert.equal(jaConfig.language, undefined);

console.log("SoV multilingual tests passed");
