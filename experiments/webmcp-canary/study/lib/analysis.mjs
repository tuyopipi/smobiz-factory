/**
 * Analysis for the AEO validation study: does a higher Nurevo score go with
 * appearing in AI answers more often? Pure functions; the CLI wraps them.
 *
 * Unit of analysis: the business. Outcome: share of successful discovery
 * answers that name the business or cite its own domain. Repeated answers
 * to one question are not independent, so the binomial models use a
 * quasi-binomial dispersion correction and every headline number is a
 * business-level rank statistic.
 */
import {
  binomialGlm, designMatrix, mannWhitney, mean, minimumDetectableRho, olsResiduals, pearson, ranks,
  spearman, spearmanBootstrapCi, spearmanPermutation, waldSummary, mulberry32,
} from "./stats.mjs";

export const COMPONENT_KEYS = Object.freeze(["pts_schema", "pts_coverage", "pts_legibility", "pts_llms", "pts_consistency"]);
export const COMPONENT_LABELS = Object.freeze({ pts_schema: "schema（構造化データ, 30）", pts_coverage: "coverage（基本情報の網羅, 25）", pts_legibility: "legibility（本文の読みやすさ, 20）", pts_llms: "llms（llms.txt, 15）", pts_consistency: "consistency（整合性・鮮度, 10）", gate: "ゲート通過（クローラー/エッジ/SSR, 未通過は15点上限）" });

/** Thresholds decided before any data is seen (README「判定基準」). */
export const CRITERIA = Object.freeze({
  minBusinesses: 30,
  minDiscoveryTrials: 3,
  minOverallRate: 0.05,
  minBusinessesWithHit: 10,
  minBrandedMentionRate: 0.7,
  supportRho: 0.3,
  alpha: 0.05,
  fePAlpha: 0.10,
  nullRho: 0.1,
});

export function aggregateBusinesses({ businesses, scores, measurements, engine = null }) {
  const scoreById = new Map(scores.filter((s) => s.ok).map((s) => [s.id, s]));
  const acc = new Map(businesses.map((b) => [b.id, { disc_trials: 0, disc_hits: 0, disc_mentions: 0, disc_cites: 0, br_trials: 0, br_mentions: 0, br_own_cited: 0 }]));
  for (const m of measurements) {
    if (!m.ok || (engine && m.engine !== engine)) continue;
    for (const [id, r] of Object.entries(m.results || {})) {
      const a = acc.get(id);
      if (!a) continue;
      if (m.kind === "discovery") {
        a.disc_trials += 1;
        if (r.mentioned || r.cited) a.disc_hits += 1;
        if (r.mentioned) a.disc_mentions += 1;
        if (r.cited) a.disc_cites += 1;
      } else if (m.kind === "branded") {
        a.br_trials += 1;
        if (r.mentioned) a.br_mentions += 1;
        if (r.cited) a.br_own_cited += 1;
      }
    }
  }
  return businesses.map((b) => {
    const s = scoreById.get(b.id);
    const a = acc.get(b.id);
    const row = {
      id: b.id, name: b.name, category: b.category, city: b.city, url: b.url,
      scored: !!s, score: s?.score ?? null, raw_score: s?.raw_score ?? null, band: s?.band ?? null, gate_passed: s ? (s.gate_passed ? 1 : 0) : null,
      ...Object.fromEntries(COMPONENT_KEYS.map((k) => [k, s ? Number(s[k]) : null])),
      ...a,
      appearance_rate: a.disc_trials ? a.disc_hits / a.disc_trials : null,
      mention_rate: a.disc_trials ? a.disc_mentions / a.disc_trials : null,
      citation_rate: a.disc_trials ? a.disc_cites / a.disc_trials : null,
      branded_own_cited_rate: a.br_trials ? a.br_own_cited / a.br_trials : null,
    };
    row.included = row.scored && a.disc_trials >= CRITERIA.minDiscoveryTrials;
    row.exclusion = !row.scored ? "score_failed" : a.disc_trials < CRITERIA.minDiscoveryTrials ? "too_few_answers" : "";
    return row;
  });
}

function zscore(xs) {
  const m = mean(xs);
  const sd = Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, xs.length - 1));
  return { values: xs.map((x) => (sd ? (x - m) / sd : 0)), sd };
}

function holm(ps) {
  const order = ps.map((p, i) => [p, i]).filter(([p]) => Number.isFinite(p)).sort((a, b) => a[0] - b[0]);
  const out = ps.map(() => NaN);
  let running = 0;
  order.forEach(([p, i], k) => { running = Math.max(running, Math.min(1, (order.length - k) * p)); out[i] = running; });
  return out;
}

function fixedEffects(rows) {
  // A factor with one level carries no information; dropping it keeps the design non-singular.
  return ["category", "city"].filter((f) => new Set(rows.map((r) => r[f])).size > 1);
}

/** Spearman after removing category/city means from both ranks, with a permutation p. */
export function partialSpearman(rows, xKey, yKey, { iterations = 5000, seed = 11 } = {}) {
  const { X } = designMatrix(rows, { factors: fixedEffects(rows) });
  const rx = olsResiduals(X, ranks(rows.map((r) => r[xKey])));
  const ry = olsResiduals(X, ranks(rows.map((r) => r[yKey])));
  if (!rx || !ry) return { rho: NaN, p: NaN };
  const rho = pearson(rx, ry);
  if (!Number.isFinite(rho)) return { rho: NaN, p: NaN };
  const rand = mulberry32(seed);
  let extreme = 0;
  for (let it = 0; it < iterations; it += 1) {
    const perm = ry.slice();
    for (let i = perm.length - 1; i > 0; i -= 1) { const j = Math.floor(rand() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
    if (Math.abs(pearson(rx, perm)) >= Math.abs(rho) - 1e-12) extreme += 1;
  }
  return { rho, p: (extreme + 1) / (iterations + 1) };
}

export function glmFor(rows, key, { label = key } = {}) {
  const z = zscore(rows.map((r) => Number(r[key])));
  if (!z.sd) return { key, label, ok: false, reason: "no_variation" };
  const data = rows.map((r, i) => ({ ...r, __x: z.values[i] }));
  const { X } = designMatrix(data, { numeric: ["__x"], factors: fixedEffects(data) });
  const fit = binomialGlm(X, data.map((r) => r.disc_hits), data.map((r) => r.disc_trials));
  if (!fit.ok) return { key, label, ok: false, reason: fit.reason };
  return { key, label, ok: true, perSd: z.sd, separated: fit.separated, dispersion: fit.dispersion, ...waldSummary(fit.beta[1], fit.se[1]) };
}

export function analyzeStudy({ businesses, scores, measurements, engine = null, iterations = 10000 }) {
  const all = aggregateBusinesses({ businesses, scores, measurements, engine });
  const rows = all.filter((r) => r.included);
  const n = rows.length;
  const totalTrials = rows.reduce((s, r) => s + r.disc_trials, 0);
  const totalHits = rows.reduce((s, r) => s + r.disc_hits, 0);
  const brTrials = rows.reduce((s, r) => s + r.br_trials, 0);
  const brMentions = rows.reduce((s, r) => s + r.br_mentions, 0);
  const result = {
    engine, n, excluded: all.filter((r) => !r.included).map((r) => ({ id: r.id, reason: r.exclusion })),
    overallRate: totalTrials ? totalHits / totalTrials : null,
    businessesWithHit: rows.filter((r) => r.disc_hits > 0).length,
    brandedMentionRate: brTrials ? brMentions / brTrials : null,
    mde: minimumDetectableRho(n),
    rows, all,
  };
  if (n < 5) { result.verdict = verdict(result); return result; }
  const xs = rows.map((r) => r.score), ys = rows.map((r) => r.appearance_rate);
  result.primary = { ...spearmanPermutation(xs, ys, { iterations }), ci: spearmanBootstrapCi(xs, ys, { iterations: Math.min(iterations, 5000) }) };
  result.primaryMention = spearmanPermutation(xs, rows.map((r) => r.mention_rate), { iterations: Math.min(iterations, 5000), seed: 5 });
  result.primaryCitation = spearmanPermutation(xs, rows.map((r) => r.citation_rate), { iterations: Math.min(iterations, 5000), seed: 6 });
  result.fe = partialSpearman(rows, "score", "appearance_rate", { iterations: Math.min(iterations, 5000) });
  result.withinCategory = spearmanPermutation(xs, ys, { iterations: Math.min(iterations, 5000), seed: 9, strata: rows.map((r) => r.category) });
  result.glmScore = glmFor(rows, "score", { label: "Nurevoスコア合計" });
  const comps = [...COMPONENT_KEYS, "gate_passed"].map((k) => {
    const rho = spearmanPermutation(rows.map((r) => r[k]), ys, { iterations: Math.min(iterations, 5000), seed: 13 });
    return { key: k, label: COMPONENT_LABELS[k === "gate_passed" ? "gate" : k], rho: rho.rho, p: rho.p, glm: glmFor(rows, k) };
  });
  const adj = holm(comps.map((c) => c.p));
  comps.forEach((c, i) => { c.pHolm = adj[i]; });
  result.components = comps;
  const gateYes = rows.filter((r) => r.gate_passed === 1).map((r) => r.appearance_rate);
  const gateNo = rows.filter((r) => r.gate_passed === 0).map((r) => r.appearance_rate);
  result.gate = { passed: gateYes.length, failed: gateNo.length, meanPassed: gateYes.length ? mean(gateYes) : null, meanFailed: gateNo.length ? mean(gateNo) : null, test: mannWhitney(gateYes, gateNo) };
  const brRows = rows.filter((r) => r.br_trials > 0);
  result.branded = brRows.length >= 5 ? spearmanPermutation(brRows.map((r) => r.score), brRows.map((r) => r.branded_own_cited_rate), { iterations: Math.min(iterations, 5000), seed: 17 }) : null;
  result.byBand = ["red", "yellow", "green"].map((band) => {
    const g = rows.filter((r) => r.band === band);
    return { band, n: g.length, rate: g.length ? mean(g.map((r) => r.appearance_rate)) : null, anyHit: g.filter((r) => r.disc_hits > 0).length };
  });
  result.byCategory = groupRates(rows, "category");
  result.byCity = groupRates(rows, "city");
  result.verdict = verdict(result);
  return result;
}

function groupRates(rows, key) {
  return [...new Set(rows.map((r) => r[key]))].sort().map((level) => {
    const g = rows.filter((r) => r[key] === level);
    return { level, n: g.length, meanScore: mean(g.map((r) => r.score)), rate: mean(g.map((r) => r.appearance_rate)), rho: g.length >= 5 ? spearman(g.map((r) => r.score), g.map((r) => r.appearance_rate)) : NaN };
  });
}

/** The pre-registered decision rule (README「判定基準」). */
export function verdict(r) {
  const c = CRITERIA;
  const reasons = [];
  if (r.n < c.minBusinesses) reasons.push(`分析できた事業者が${r.n}件で、事前に決めた最低${c.minBusinesses}件に届かない`);
  if (r.overallRate !== null && r.overallRate < c.minOverallRate) reasons.push(`AI回答への登場が全体で${pct(r.overallRate)}しかなく（床効果）、差を測れない`);
  if (r.businessesWithHit < c.minBusinessesWithHit) reasons.push(`一度でも登場した事業者が${r.businessesWithHit}件しかない`);
  if (r.brandedMentionRate !== null && r.brandedMentionRate < c.minBrandedMentionRate) reasons.push(`名指し質問での検出率が${pct(r.brandedMentionRate)}と低く、名前の検出（エイリアス）に問題がある可能性`);
  if (reasons.length || !r.primary) return { code: "inconclusive", label: "判定不能", reasons };
  const { rho, p, ci } = r.primary;
  const feOk = r.fe && r.fe.rho > 0 && r.fe.p < c.fePAlpha;
  if (rho < 0 && p < c.alpha) return { code: "negative", label: "逆の関係（スコアが高いほど登場しにくい）", reasons: [`ρ=${f2(rho)}, p=${f3(p)}`] };
  if (rho >= c.supportRho && p < c.alpha && ci.low > 0 && feOk) return { code: "support", label: "支持（正の関係あり）", reasons: [`ρ=${f2(rho)}（95%CI ${f2(ci.low)}〜${f2(ci.high)}）, p=${f3(p)}`, `業種・都市を揃えても ρ=${f2(r.fe.rho)}, p=${f3(r.fe.p)}`] };
  if (rho > 0 && p < c.alpha) return { code: "weak", label: "弱い支持（関係はあるが条件を一部満たさない）", reasons: [`ρ=${f2(rho)}（95%CI ${f2(ci.low)}〜${f2(ci.high)}）, p=${f3(p)}`, feOk ? "業種・都市調整後も正" : `業種・都市を揃えると弱まる（ρ=${f2(r.fe?.rho)}, p=${f3(r.fe?.p)}）`, rho < c.supportRho ? `効果の大きさが基準（ρ≥${c.supportRho}）未満` : ""].filter(Boolean) };
  if (Math.abs(rho) < c.nullRho || ci.low <= 0) return { code: "no_support", label: "支持されない（関係を確認できない）", reasons: [`ρ=${f2(rho)}（95%CI ${f2(ci.low)}〜${f2(ci.high)}）, p=${f3(p)}`, `n=${r.n}で確実に検出できるのは|ρ|≥${f2(r.mde)}程度。これより小さい関係は「ない」とは言えず「この規模では見えない」`] };
  return { code: "no_support", label: "支持されない", reasons: [`ρ=${f2(rho)}, p=${f3(p)}`] };
}

const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : "—");
const f3 = (x) => (Number.isFinite(x) ? (x < 0.001 ? "<0.001" : x.toFixed(3)) : "—");
const pct = (x) => (Number.isFinite(x) ? `${(x * 100).toFixed(1)}%` : "—");

export function renderReport(results, { generatedAt = new Date().toISOString(), dryRun = false, engineLabels = {} } = {}) {
  const out = [];
  out.push("# Nurevo AEOスコア 検証レポート", "");
  if (dryRun) out.push("> **これはドライラン（スタブエンジン・架空スコア）の出力です。結果に意味はありません。**", "");
  out.push(`生成日時: ${generatedAt}`, "");
  for (const r of results) {
    const name = engineLabels[r.engine] || r.engine || "全エンジン";
    out.push(`## エンジン: ${name}`, "");
    out.push(`**結論: ${r.verdict.label}**`, "");
    for (const reason of r.verdict.reasons) out.push(`- ${reason}`);
    out.push("", "### 平易なまとめ（記入テンプレート）", "");
    out.push(conclusionText(r, name), "");
    out.push("### データの概要", "");
    out.push("| 項目 | 値 |", "|---|---|");
    out.push(`| 分析対象の事業者 | ${r.n} 件（除外 ${r.excluded.length} 件） |`);
    out.push(`| 発見系質問での登場率（全体） | ${pct(r.overallRate)} |`);
    out.push(`| 一度でも登場した事業者 | ${r.businessesWithHit} 件 |`);
    out.push(`| 名指し質問での名前検出率（検出器の確認用） | ${pct(r.brandedMentionRate)} |`);
    out.push(`| この件数で検出できる最小の相関（検出力80%） | 絶対値 ${f2(r.mde)} 以上 |`, "");
    if (!r.primary) { out.push("（件数不足のため統計量は計算していません）", ""); continue; }
    out.push("### 主要な結果", "");
    out.push("| 分析 | ρ | p値 | 備考 |", "|---|---|---|---|");
    out.push(`| スコア × 登場率（Spearman） | ${f2(r.primary.rho)} | ${f3(r.primary.p)} | 95%CI ${f2(r.primary.ci.low)}〜${f2(r.primary.ci.high)}（ブートストラップ） |`);
    out.push(`| 業種・都市の影響を除いた偏相関 | ${f2(r.fe.rho)} | ${f3(r.fe.p)} | 固定効果で順位を残差化 |`);
    out.push(`| 業種内で並べ替えた検定 | ${f2(r.withinCategory.rho)} | ${f3(r.withinCategory.p)} | 業種ごとの層別置換 |`);
    out.push(`| スコア × 名前の登場率 | ${f2(r.primaryMention.rho)} | ${f3(r.primaryMention.p)} | |`);
    out.push(`| スコア × 自社サイトの引用率 | ${f2(r.primaryCitation.rho)} | ${f3(r.primaryCitation.p)} | |`);
    if (r.branded) out.push(`| スコア × 名指し質問で自社サイトが引用される率 | ${f2(r.branded.rho)} | ${f3(r.branded.p)} | 副次指標 |`);
    const g = r.glmScore;
    out.push("", `ロジスティック回帰（業種・都市固定効果、準二項補正）: スコアが1標準偏差（${f2(g.perSd)}点）高いと登場のオッズが ${g.ok ? `${f2(g.oddsRatio)}倍（95%CI ${f2(g.ciLow)}〜${f2(g.ciHigh)}, p=${f3(g.p)}）` : `計算不能（${g.reason}）`}${g.separated ? "。※分離が起きており推定は不安定" : ""}`, "");
    out.push("### スコア帯ごとの登場率", "", "| 帯 | 件数 | 平均登場率 | 一度でも登場 |", "|---|---|---|---|");
    for (const b of r.byBand) out.push(`| ${b.band} | ${b.n} | ${pct(b.rate)} | ${b.anyHit} |`);
    out.push("", "### 構成要素ごとの確認（探索的・多重比較をHolm法で補正）", "", "| 要素 | ρ | p | p（Holm補正） | オッズ比/1SD（固定効果） |", "|---|---|---|---|---|");
    for (const c of r.components) out.push(`| ${c.label} | ${f2(c.rho)} | ${f3(c.p)} | ${f3(c.pHolm)} | ${c.glm.ok ? `${f2(c.glm.oddsRatio)}（${f2(c.glm.ciLow)}〜${f2(c.glm.ciHigh)}）` : `—（${c.glm.reason}）`} |`);
    out.push("", `ゲート通過 ${r.gate.passed} 件の平均登場率 ${pct(r.gate.meanPassed)}／未通過 ${r.gate.failed} 件 ${pct(r.gate.meanFailed)}（Mann-Whitney p=${f3(r.gate.test.p)}）`, "");
    out.push("### 業種別・都市別", "", "| 区分 | 件数 | 平均スコア | 平均登場率 | 区分内ρ |", "|---|---|---|---|---|");
    for (const x of [...r.byCategory, ...r.byCity]) out.push(`| ${x.level} | ${x.n} | ${f2(x.meanScore)} | ${pct(x.rate)} | ${f2(x.rho)} |`);
    out.push("");
    if (r.excluded.length) out.push(`除外: ${r.excluded.map((e) => `${e.id}（${e.reason}）`).join("、")}`, "");
  }
  out.push("## 読み方の注意", "",
    "- 相関は因果ではありません。スコアの高いサイトは、口コミ数・知名度・広告・開業年数など、今回観測できない要因でも有利な可能性があります（口コミ数などは今回のデータにありません）。",
    "- 業種・都市の違いは固定効果で揃えていますが、それ以外の交絡は残ります。",
    "- 同じ質問への繰り返し回答や、同じ地域の事業者が同じ回答を共有することによる相関があるため、回答数をそのまま独立した証拠とは扱っていません。",
    "- 結果は使ったAIエンジン・モデル・測定日にのみ当てはまります。",
    "");
  return out.join("\n");
}

function conclusionText(r, name) {
  const v = r.verdict;
  if (v.code === "inconclusive") return `今回のデータ（${name}）では、Nurevoスコアと AI 回答への登場の関係を判定できませんでした。理由: ${v.reasons.join("／")}。営業資料に「効果が確認された」とは書けません。`;
  if (v.code === "support") return `${r.n}件の地域事業者を調べた結果、Nurevoスコアが高いサイトほど ${name} の回答に登場しやすい傾向が確認されました（順位相関 ρ=${f2(r.primary.rho)}、業種・都市を揃えても同様）。ただし相関であり、スコアを上げれば必ず登場するという因果は示していません。`;
  if (v.code === "weak") return `Nurevoスコアと ${name} での登場には正の関係が見られましたが、事前に決めた条件の一部を満たしていません（${v.reasons.slice(1).join("／")}）。「関係がありそうだ」までは言えますが、営業資料で断定的に使うのは避けるべきです。`;
  if (v.code === "negative") return `想定と逆に、スコアが高いほど ${name} に登場しにくい傾向が出ました。スコアの設計を見直す材料として扱ってください。`;
  return `${r.n}件では、Nurevoスコアと ${name} での登場の間に明確な関係は確認できませんでした（ρ=${f2(r.primary.rho)}）。これは「関係がない」ことの証明ではなく、この規模で検出できる大きさ（|ρ|≥${f2(r.mde)}）の関係は見つからなかった、という意味です。営業資料で登場率の改善を約束する根拠にはなりません。`;
}
