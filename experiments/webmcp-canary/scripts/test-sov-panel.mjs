/**
 * The SoV panel's markup, produced by the real dashboard script.
 *
 * The endpoint tests prove the payload is honest; these prove the panel does not
 * become dishonest while drawing it. The failure this guards against is a
 * missing rate rendering as "0%", which would read as a measured finding rather
 * than an absent one.
 *
 * The script is loaded and executed as the browser would, under a DOM shim, so
 * what is asserted is the markup that actually ships.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const SOURCE = readFileSync(new URL("../public/dashboard-sov.js", import.meta.url), "utf8");

/** Run the panel builder against one payload and return the HTML it produced. */
function render(state) {
  let built = null;
  const element = () => ({
    className: "", dataset: {}, innerHTML: "", style: {}, textContent: "",
    appendChild() {}, querySelector: () => null, isConnected: false, replaceWith() {},
  });
  const sandbox = {
    document: {
      createElement(tag) { const el = element(); if (tag === "section") built = el; return el; },
      querySelector: () => null,
      addEventListener() {},
      head: { appendChild() {} },
      documentElement: { lang: "ja" },
    },
    MutationObserver: class { observe() {} },
    setTimeout() {},
    fetch: async () => { throw new Error("the render path must not call the network"); },
    Number, Math, String, Date, JSON, Array, Object, console,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(SOURCE.replace("})();", "  window.__panel = panel;\n})();"), sandbox);
  sandbox.window.__panel(state);
  return built.innerHTML;
}

const measured = (latest) => render({ kind: "measured", data: { latest, beta: true } });
const ENGINE = (over = {}) => ({
  engine: "perplexity", answers: 5, failures: 0, appearances: 2, citations: 1,
  live_search: true, citations_available: true, appearance_rate: 0.4, ...over,
});
const LATEST = (over = {}) => ({
  ran_at: "2026-10-05T00:00:00.000Z", questions_asked: 5, answers_received: 5, queries_used: 10,
  by_engine: [ENGINE()], competitors: [], engines: [], parser_control: null, ...over,
});

/* ---------------- a measured rate shows its number ---------------- */

{
  const html = measured(LATEST());
  assert.ok(html.includes("40%"), "0.4 renders as 40%");
  assert.ok(html.includes("n=5"), "with the sample count beside it");
  assert.ok(html.includes("診断時刻"), "and the as-of time");
  assert.ok(html.includes("質問数") && html.includes("回答数") && html.includes("消費クエリ"), "and the probe counts");
}

{
  // The case the whole panel turns on.
  const html = measured(LATEST({ by_engine: [ENGINE({ appearance_rate: 0, appearances: 0 })] }));
  assert.ok(html.includes("0%"), "a measured zero keeps its number");
  assert.equal(html.includes("サンプル不足"), false, "and is not described as unmeasurable");
}

/* ---------------- an absent rate never becomes 0% ---------------- */

{
  const html = measured(LATEST({ by_engine: [ENGINE({ appearance_rate: null, answers: 1 })] }));
  assert.ok(html.includes("サンプル不足（n=1）"), "too few samples says so");
  assert.equal(/>0%|[^0-9]0%/.test(html), false, "and no percentage appears");
}

{
  const html = measured(LATEST({ answers_received: 0, by_engine: [ENGINE({ appearance_rate: null, answers: 0, appearances: 0 })] }));
  assert.ok(html.includes("まだ出典として現れていません"), "no answers says so");
  assert.equal(html.includes("%"), false, "and no percentage appears");
}

/* ---------------- the two engines are never one number ---------------- */

{
  const html = measured(LATEST({ by_engine: [
    ENGINE({ engine: "openai", live_search: false, appearance_rate: 0.2, answers: 5 }),
    ENGINE({ engine: "perplexity", live_search: true, appearance_rate: 0.6, answers: 5 }),
  ] }));
  assert.ok(html.includes("Perplexity") && html.includes("ChatGPT (OpenAI)"), "both engines are named");
  assert.ok(html.includes("ライブ検索での出現"), "the searching engine is labelled as such");
  assert.ok(html.includes("学習済み知識内の存在"), "the other is labelled as model knowledge");
  assert.ok(html.includes("ライブ検索ではない"), "and is explicitly marked as not live search");
  assert.ok(html.includes("60%") && html.includes("20%"), "each keeps its own rate");
  assert.equal(html.includes("80%") || html.includes("40%"), false, "the two are never summed or averaged");

  // Perplexity is the headline, so it is drawn first regardless of input order.
  assert.ok(html.indexOf("Perplexity") < html.indexOf("ChatGPT"), "the live-search engine leads");
}

/* ---------------- a run with no stored split shows no blended rate ---------------- */

{
  const html = measured(LATEST({
    by_engine: [],
    appearance_rate: 0.4,
    engines: [
      { id: "perplexity", label: "Perplexity", live_search: true },
      { id: "openai", label: "ChatGPT (OpenAI)", live_search: false },
    ],
  }));
  assert.ok(html.includes("Perplexity") && html.includes("ChatGPT (OpenAI)"), "the roster is still shown");
  assert.ok(html.includes("ライブ検索ではない"), "with the labels kept");
  // The stored blended rate spans both engines, so it answers neither question.
  assert.equal(html.includes("40%"), false, "the blended rate is not presented");
  assert.ok(html.includes("エンジン別の内訳を保存していない"), "and the panel says why there is no rate");
}

/* ---------------- failed probes are reported, not counted ---------------- */

{
  const html = measured(LATEST({ by_engine: [ENGINE({ answers: 4, failures: 2, appearance_rate: 0.5 })] }));
  assert.ok(html.includes("n=4"), "the denominator is answers only");
  assert.ok(html.includes("失敗 2件（率から除外）"), "failures are shown as excluded");
}

/* ---------------- competitors ---------------- */

{
  const html = measured(LATEST({ competitors: [{ host: "rival.example.net", appearances: 3 }] }));
  assert.ok(html.includes("rival.example.net"), "a competitor is listed");
}

{
  const html = measured(LATEST({ competitors: [] }));
  assert.equal(html.includes("同じ質問で挙がった他社"), false, "an empty competitor list is omitted, not shown as zero");
}

/* ---------------- the parser control is never scored ---------------- */

{
  const html = measured(LATEST({ parser_control: { asked: 1, answers: 1, detected: 1, cited: 0 } }));
  assert.ok(html.includes("出現率には算入していません"), "the control states that it is excluded");
}

/* ---------------- the locked state ---------------- */

{
  const html = render({ kind: "locked", data: { plan: "standard", upgrade: {
    required_plan: "pro", message: "AI登場率の測定はProプラン（¥14,800/月〜・β）の機能です。",
    upgrade_url: "https://nurevo.jp/dashboard",
  } } });
  assert.ok(html.includes("Pro β"), "the panel says what unlocks it");
  assert.ok(html.includes("standard"), "and shows the current plan");
  assert.ok(html.includes("¥14,800"), "with the server's pricing copy");
  // No estimate, sample or placeholder number may stand in for a measurement.
  assert.equal(/\d+%/.test(html), false, "a locked panel shows no rate at all");
  assert.equal(html.includes("n="), false, "and no sample counts");
}

/* ---------------- nothing measured yet ---------------- */

{
  const html = render({ kind: "measured", data: { latest: null } });
  assert.ok(html.includes("まだ結果がありません"), "the empty state explains itself");
  assert.ok(html.includes("スケジュール実行"), "and says measurement is scheduled");
  assert.equal(/\d+%/.test(html), false, "with no numbers");
}

/* ---------------- damaged payloads must not break the panel ---------------- */

{
  // Missing arrays, nulls and unknown shapes: the panel is a reader and has no
  // say in what it is handed.
  const cases = [
    {},
    { by_engine: null, competitors: null, engines: null },
    { by_engine: [{}], answers_received: null },
    { by_engine: [{ engine: "mystery", answers: 2, appearance_rate: 0.5, live_search: null }] },
    { ran_at: "not a date", by_engine: [] },
    { parser_control: {} },
  ];
  for (const [index, over] of cases.entries()) {
    const html = measured(LATEST(over));
    assert.ok(typeof html === "string" && html.length > 0, `case ${index} still renders`);
    assert.equal(html.includes("Invalid Date"), false, `case ${index} has no unparsed timestamp`);
    assert.equal(html.includes("undefined"), false, `case ${index} leaks no undefined`);
    assert.equal(html.includes("NaN"), false, `case ${index} leaks no NaN`);
  }
}

{
  // An unrecognised engine id is still drawn, and is not claimed to be live
  // search just because this build does not know it.
  const html = measured(LATEST({ by_engine: [{ engine: "mystery", answers: 3, appearance_rate: 0.5, live_search: null }] }));
  assert.ok(html.includes("mystery"), "the unknown engine is named");
  assert.ok(html.includes("ライブ検索ではない"), "and is not promoted to live search");
}

/* ---------------- untrusted text is escaped ---------------- */

{
  const html = measured(LATEST({
    competitors: [{ host: '<img src=x onerror=alert(1)>', appearances: 1 }],
    by_engine: [ENGINE({ engine: '<script>alert(2)</script>' })],
  }));
  assert.equal(html.includes("<img"), false, "no raw markup from a stored host");
  assert.equal(html.includes("<script>alert"), false, "no raw markup from a stored engine id");
  assert.ok(html.includes("&lt;img"), "it is shown as text instead");
}

{
  const html = render({ kind: "locked", data: { plan: '"><b>x</b>', upgrade: { message: "<i>hi</i>", upgrade_url: 'javascript:alert(1)"' } } });
  assert.equal(html.includes("<b>x</b>"), false, "the plan is escaped");
  assert.equal(html.includes("<i>hi</i>"), false, "the upsell copy is escaped");
}

console.log("SoV panel render tests passed");
