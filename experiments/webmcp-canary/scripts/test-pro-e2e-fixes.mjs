/**
 * Fixes from the live Pro end-to-end test (scripts/e2e-pro-live.mjs on
 * ci/pro-e2e):
 *
 *   1. The agency report told a Pro site to answer "the questions above" while
 *      showing none (Pro runs had `questions: []`), and spoke of "お店・会社"
 *      whatever the site was. Pro questions are now shown with how often each
 *      answer named / cited the site, the advice refers to "above" only when
 *      questions are shown, and the wording follows the site type, in all
 *      eight report languages.
 *   2. B2B questions stacked nouns when the category already named a kind of
 *      offering: 「AI検索最適化（AEO）サービスの代表的なツールを3つ挙げて。」.
 *      Checked in all ten measured languages; questions stay brand-free; an
 *      untouched default stored with the old wording is rewritten, an edited
 *      one is left alone.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { buildAgencyReport, collectReportData, proQuestionRows, renderAgencyReportHtml, renderAgencyReportText } from "../worker/agency-report.mjs";
import { REPORT_BODY_LANGS, REPORT_COPY } from "../worker/agency-report-i18n.mjs";
import { buildBrandProfile, buildQuestionSet, SOV_LANGUAGES } from "../worker/aeo-sov.mjs";
import { legacyTypedDiscoveryQuestions, splitOfferingKind, typedDiscoveryQuestions } from "../worker/sov-site-type.mjs";
import { ensureQuerySet, loadQuerySet } from "../worker/pro-report.mjs";

const sql = (file) => readFileSync(new URL(`../nurevo-impl/db/${file}`, import.meta.url), "utf8");
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (v[k] ?? m));
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const NOW = Date.parse("2026-11-02T05:00:00Z");

/* ================================================================== *
 * 1. Agency report: Pro questions and site-type wording
 * ================================================================== */
const RUN = { id: "run-oct", ran_at: "2026-10-25T00:00:00Z", appearance_rate: 0, citation_rate: 0, answers_received: 10,
  detail_json: JSON.stringify({ headline: { engine: "perplexity" }, repetitions: 2, distinct_questions: 5, query_set: { questions: ["q-a", "q-b"] } }) };
const QUESTIONS = { run_id: "run-oct", rows: [
  { question: "代表的なAI検索最適化（AEO）サービスを3つ挙げて。", answers: 2, named: 0, cited: 0 },
  { question: "AEO <b>pricing</b>?", answers: 2, named: 1, cited: 2 },
  { question: "q-failed", answers: 0, named: 0, cited: 0 },
] };
for (const lang of REPORT_BODY_LANGS) {
  const c = REPORT_COPY[lang];
  for (const siteType of ["local", "ec", "b2b"]) {
    const model = buildAgencyReport({ site: { id: "s1", url: "nurevo.jp" }, plan: "pro", month: "2026-10", locale: lang, sov: [RUN], sovQuestions: QUESTIONS, siteType, now: NOW });
    assert.equal(model.ai.kind, "pro");
    assert.equal(model.ai.questions.length, 3, "the Pro questions are in the report");
    assert.ok(model.next.includes("nextFaq"), "appearance under 30% asks for content");
    const html = renderAgencyReportHtml(model);
    const text = renderAgencyReportText(model);
    const suffix = siteType === "ec" ? "Ec" : siteType === "b2b" ? "B2b" : "";
    assert.ok(html.includes(esc(c[`aiHeading${suffix}`])) && text.includes(c[`aiHeading${suffix}`]), `${lang}/${siteType}: heading follows the site type`);
    const advice = fill(c[`nextFaq${suffix}`], { ref: c.faqRefShown });
    assert.ok(html.includes(esc(advice)) && text.includes(advice), `${lang}/${siteType}: advice refers to the questions shown`);
    assert.ok(html.includes("AEO &lt;b&gt;pricing&lt;/b&gt;?"), `${lang}: question text escaped`);
    assert.ok(html.includes(esc(`${c.named} 1/2`)) && html.includes(esc(`${c.cited} 2/2`)), `${lang}: named / cited per question`);
    assert.ok(html.includes(esc(`${c.notNamed} 2/2`)) && html.includes(esc(c.noAnswer)), `${lang}: not mentioned / no answer`);
    assert.ok(html.includes(esc(fill(c.proAsked, { engine: "Perplexity", q: 5, r: 2 }))), `${lang}: 5 questions x 2`);
    assert.ok(!/\{\w+\}/.test(html) && !/\{\w+\}/.test(text), `${lang}/${siteType}: placeholders filled`);
  }
  // No questions to show (a run before this change, or the mentions could not
  // be read): the advice does not point at anything "above".
  const bare = buildAgencyReport({ site: { id: "s1" }, plan: "pro", month: "2026-10", locale: lang, sov: [RUN], siteType: "b2b", now: NOW });
  assert.equal(bare.ai.questions.length, 0);
  const bareText = renderAgencyReportText(bare);
  assert.ok(bareText.includes(fill(c.nextFaqB2b, { ref: c.faqRefGeneric })), `${lang}: generic reference without questions`);
  assert.ok(!bareText.includes(c.faqRefShown), `${lang}: no reference to questions that are not shown`);
}
// Japanese wording, as asked: local お店/地域, ec ショップ/商品, b2b 会社/サービス.
assert.match(REPORT_COPY.ja.aiHeading, /お店/);
assert.match(REPORT_COPY.ja.nextFaq, /お店.*地域/);
assert.match(REPORT_COPY.ja.aiHeadingEc, /ショップ.*商品/);
assert.match(REPORT_COPY.ja.nextFaqEc, /ショップ.*商品/);
assert.match(REPORT_COPY.ja.aiHeadingB2b, /会社.*サービス/);
assert.match(REPORT_COPY.ja.nextFaqB2b, /会社.*サービス/);
for (const lang of REPORT_BODY_LANGS) {
  for (const key of ["aiHeading", "aiHeadingEc", "aiHeadingB2b", "nextFaq", "nextFaqEc", "nextFaqB2b", "faqRefShown", "faqRefGeneric", "proAsked"]) {
    assert.ok(REPORT_COPY[lang][key], `${lang}.${key}`);
  }
  assert.ok(!/上の|above|上述|위와|arriba|ci-dessus|obigen/.test(REPORT_COPY[lang].nextFaq + REPORT_COPY[lang].nextFaqEc + REPORT_COPY[lang].nextFaqB2b),
    `${lang}: "above" only comes in through faqRefShown`);
}
// The free check (always shows its questions) also uses the shown reference.
{
  const free = buildAgencyReport({ site: { id: "s1" }, plan: "free", month: "2026-10", locale: "ja", siteType: "ec", now: NOW,
    freeCheck: { status: "done", finished_at: "2026-10-12T00:00:00Z", result_json: JSON.stringify({ asked: 3, answered: 3, appeared: 0, questions: [{ question: "緑茶のおすすめ通販サイトは？", answered: true }] }) } });
  assert.ok(renderAgencyReportText(free).includes(fill(REPORT_COPY.ja.nextFaqEc, { ref: REPORT_COPY.ja.faqRefShown })));
}
// A run without the stored question data still renders its rates.
assert.deepEqual(buildAgencyReport({ plan: "pro", month: "2026-10", now: NOW, sov: [{ ...RUN, detail_json: "{}" }] }).ai.questions, []);

// proQuestionRows: headline engine, discovery only, in the question-set order.
assert.deepEqual(proQuestionRows([
  { question: "b", engine: "perplexity", kind: "discovery", ok: 1, brand_mentioned: 1, brand_cited: 0 },
  { question: "a", engine: "perplexity", kind: "discovery", ok: 1, brand_mentioned: 0, brand_cited: 1 },
  { question: "a", engine: "perplexity", kind: "discovery", ok: 0, brand_mentioned: 0, brand_cited: 0 },
  { question: "a", engine: "openai", kind: "discovery", ok: 1, brand_mentioned: 1, brand_cited: 1 },
  { question: "Brand?", engine: "perplexity", kind: "branded", ok: 1, brand_mentioned: 1, brand_cited: 1 },
], "perplexity", ["a", "b"]), [
  { question: "a", asked: 2, answers: 1, named: 0, cited: 1 },
  { question: "b", asked: 1, answers: 1, named: 1, cited: 0 },
]);

// collectReportData reads the questions and the site type from the database.
{
  const sqlite = new DatabaseSync(":memory:");
  for (const file of ["0014_aeo_scores.sql", "0018_aeo_sov.sql", "0022_sov_engine_split.sql"]) sqlite.exec(sql(file));
  sqlite.exec("CREATE TABLE site_settings(site_id TEXT PRIMARY KEY, site_type TEXT); INSERT INTO site_settings VALUES('s1','b2b');");
  sqlite.prepare(`INSERT INTO aeo_sov_runs(id,site_id,ran_at,status,trigger,model_version,questions_asked,answers_received,appearance_rate,citation_rate,detail_json)
    VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run("run-oct", "s1", "2026-10-25T00:00:00Z", "measured", "scheduled", "u2-v2", 4, 4, 0, 0, RUN.detail_json);
  for (const [q, ok, named, cited] of [["q-b", 1, 0, 0], ["q-a", 1, 0, 1], ["q-a", 1, 1, 1], ["q-b", 0, 0, 0]]) {
    sqlite.prepare("INSERT INTO aeo_sov_mentions(run_id,site_id,engine,question,kind,ok,brand_mentioned,brand_cited) VALUES(?,?,?,?,?,?,?,?)").run("run-oct", "s1", "perplexity", q, "discovery", ok, named, cited);
  }
  const DB = { prepare(text) { return { bind: (...args) => { const st = sqlite.prepare(text); return { first: async () => st.get(...args) || null, all: async () => ({ results: st.all(...args) }), run: async () => st.run(...args) }; } }; } };
  const data = await collectReportData({ DB }, { id: "s1" }, "2026-10");
  assert.equal(data.siteType, "b2b");
  assert.deepEqual(data.sovQuestions, { run_id: "run-oct", rows: [
    { question: "q-a", asked: 2, answers: 2, named: 1, cited: 2 },
    { question: "q-b", asked: 2, answers: 1, named: 0, cited: 0 },
  ] });
  const model = buildAgencyReport({ site: { id: "s1" }, plan: "pro", month: "2026-10", locale: "ja", ...data, now: NOW });
  assert.equal(model.site_type, "b2b");
  assert.equal(model.ai.questions.length, 2);
  assert.ok(renderAgencyReportText(model).includes(REPORT_COPY.ja.aiHeadingB2b));
}

/* ================================================================== *
 * 2. B2B question wording
 * ================================================================== */
{
  // The case the live test found.
  const services = [{ category: "AI検索最適化（AEO）サービス", kind: "software" }];
  const profile = buildBrandProfile({ site: { website_uri: "https://nurevo.jp/" }, settings: { name: "Nurevo", business_type: "AI検索最適化（AEO）サービス", site_type: "b2b", catalog: { services } } });
  const ja = buildQuestionSet(profile);
  assert.equal(ja[0], "AI検索最適化（AEO）におすすめのサービスは？", "the task without its kind word, and the category's own kind");
  assert.equal(ja[2], "代表的なAI検索最適化（AEO）サービスを3つ挙げて。", "no 「サービスの代表的なツール」");
  for (const q of ja) {
    assert.ok(!/サービスの(?:代表的な|おすすめの)?(?:ツール|サービス)/.test(q), `no stacked kind words: ${q}`);
    assert.ok((q.match(/サービス|ツール/g) || []).length <= 1, `one kind word per question: ${q}`);
    assert.ok(!/Nurevo|nurevo/.test(q), `brand-free: ${q}`);
  }
  // Without a kind word in the category, the software flag decides, and the
  // noun is built once: 勤怠管理 + ツール.
  const plain = typedDiscoveryQuestions({ siteType: "b2b", language: "ja", category: "勤怠管理", task: "勤怠管理", software: true });
  assert.equal(plain[0], "勤怠管理におすすめのツールは？");
  assert.equal(plain[2], "代表的な勤怠管理ツールを3つ挙げて。");
  assert.equal(typedDiscoveryQuestions({ siteType: "b2b", language: "ja" })[0], "業務効率化におすすめのサービスは？", "the neutral fallback");

  // Every measured language, with a category that already names its kind.
  const KINDED = {
    ja: ["AI検索最適化（AEO）サービス", "サービス", "ツール"], en: ["AEO services", "service", "tool"], "zh-Hans": ["AI搜索优化服务", "服务", "工具"], "zh-Hant": ["AI搜尋優化服務", "服務", "工具"],
    ko: ["AEO 서비스", "서비스", "툴"], es: ["servicios de AEO", "servicio", "herramienta"], fr: ["services d’AEO", "service", "outil"], de: ["AEO-Dienstleistungen", "Angebot", "Tool"],
    pt: ["serviços de AEO", "serviço", "ferramenta"], it: ["servizi di AEO", "servizio", "strumento"],
  };
  assert.deepEqual(Object.keys(KINDED).sort(), [...SOV_LANGUAGES].sort(), "every measured language is checked");
  for (const [language, [category]] of Object.entries(KINDED)) {
    const split = splitOfferingKind(category, language);
    assert.equal(split.kind, "service", `${language}: "${category}" names a service`);
    assert.ok(split.stem && /AEO|AI/.test(split.stem), `${language}: stem of "${category}" is "${split.stem}"`);
    const questions = typedDiscoveryQuestions({ siteType: "b2b", language, category, task: category, software: true });
    assert.equal(questions.length, 10);
    assert.equal(new Set(questions).size, 10, `${language}: all different`);
    for (const q of questions) {
      for (const tool of ["ツール", " tool", "工具", "툴", "herramienta", "outil", "Tool", "ferramenta", "strumento"]) {
        assert.ok(!q.includes(`${category}${tool}`) && !q.includes(`${category} ${tool.trim()}`), `${language}: no "${category}" + "${tool.trim()}" in "${q}"`);
      }
      assert.ok(!/(?:services?|サービス|服务|服務|서비스|servicios?|serviços?|servizi)\W{0,3}(?:services?|サービス|服务|服務|서비스|servicios?|serviços?|servizi)/i.test(q), `${language}: no doubled kind word in "${q}"`);
      assert.ok(!/undefined|null|\$\{/.test(q));
    }
  }
  // The legacy wording is still recognised (it is what the old defaults hold).
  assert.equal(legacyTypedDiscoveryQuestions({ siteType: "b2b", language: "ja", category: "AI検索最適化（AEO）サービス", task: "AI検索最適化（AEO）サービス", software: true })[2],
    "AI検索最適化（AEO）サービスの代表的なツールを3つ挙げて。");
  assert.equal(legacyTypedDiscoveryQuestions({ siteType: "ec" }), null);
}
{
  // Stored sets: an untouched default in the old wording is rewritten in the
  // new one (competitors and repetitions kept); an edited set is left alone.
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(sql("0031_pro_measurement.sql"));
  const DB = { prepare(text) { return { bind: (...args) => { const st = sqlite.prepare(text); return { first: async () => st.get(...args) || null, all: async () => ({ results: st.all(...args) }), run: async () => ({ meta: st.run(...args) }) }; } }; } };
  const env = { DB };
  const profile = buildBrandProfile({ site: { website_uri: "https://nurevo.jp/" }, settings: { name: "Nurevo", business_type: "AI検索最適化（AEO）サービス", site_type: "b2b", catalog: { services: [{ category: "AI検索最適化（AEO）サービス", kind: "software" }] } } });
  const legacy = legacyTypedDiscoveryQuestions(profile).slice(0, 5);
  const put = (site, questions) => sqlite.prepare("INSERT INTO aeo_sov_query_sets(site_id,version,config_json,updated_at) VALUES(?,1,?,?)")
    .run(site, JSON.stringify({ questions, repetitions: 3, competitors: ["rival.example"], engine: "perplexity", site_type: "b2b" }), "2026-10-01T00:00:00Z");
  put("untouched", legacy);
  put("edited", [...legacy.slice(0, 4), "自分で書いた質問"]);
  const rewritten = await ensureQuerySet(env, "untouched", profile);
  assert.deepEqual(rewritten.questions, buildQuestionSet(profile).slice(0, 5), "the untouched default now uses the new wording");
  assert.ok(!rewritten.questions.some((q) => q.includes("サービスの代表的なツール")));
  assert.deepEqual(rewritten.competitors, ["rival.example"], "the owner's competitors are kept");
  assert.equal(rewritten.repetitions, 3, "and the repetitions");
  assert.equal(rewritten.version, 2);
  const edited = await ensureQuerySet(env, "edited", profile);
  assert.deepEqual(edited.questions, [...legacy.slice(0, 4), "自分で書いた質問"], "an edited set is the owner's and is left alone");
  assert.equal((await loadQuerySet(env, "edited")).version, 1);
  // A current default is stable: asking again changes nothing.
  assert.equal((await ensureQuerySet(env, "untouched", profile)).version, 2);
}

console.log("Pro E2E fixes passed (agency report: Pro questions with named/cited, site-type wording and honest references in 8 languages; B2B questions without stacked kind words in 10 languages; old untouched defaults rewritten, edited kept)");
