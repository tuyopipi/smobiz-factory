/**
 * Monthly owner report: "this month's AI readability score + AI appearance rate".
 *
 * This module only builds the report. Nothing here sends email - delivery is
 * wired separately once sending is enabled, so generation and preview can be
 * reviewed first.
 */

import { SOV_BETA } from "./aeo-sov.mjs";

export const REPORT_VERSION = "u2-report-v1";

const BAND_LABEL = Object.freeze({ green: "良好", yellow: "要改善", red: "危険" });

/**
 * Assemble the report model from stored data.
 *
 * Every section states its own absence: a free or standard site has no SoV
 * section to show, and a pro site with no configured engine says "未設定"
 * rather than rendering an empty gauge.
 */
export function buildMonthlyReport({
  site = {},
  plan = "free",
  month,
  scores = [],
  sov = null,
  now = Date.now(),
} = {}) {
  const period = month || new Date(now).toISOString().slice(0, 7);
  const inPeriod = scores.filter((row) => String(row.scanned_at || "").slice(0, 7) === period);
  const series = (inPeriod.length ? inPeriod : scores).slice();
  series.sort((a, b) => String(a.scanned_at).localeCompare(String(b.scanned_at)));

  const latest = series[series.length - 1] || null;
  const first = series[0] || null;
  const latestScore = latest?.score != null ? Number(latest.score) : null;
  const firstScore = first?.score != null ? Number(first.score) : null;
  const delta = latestScore != null && firstScore != null && series.length > 1 ? latestScore - firstScore : null;

  const readability = {
    available: latestScore != null,
    score: latestScore,
    band: latest?.verdict && BAND_LABEL[latest.verdict] ? latest.verdict : bandFromScore(latestScore),
    delta,
    samples: series.length,
    measured_at: latest?.scanned_at || null,
  };

  const visibility = buildVisibilitySection(plan, sov);

  return {
    version: REPORT_VERSION,
    beta: SOV_BETA,
    period,
    generated_at: new Date(now).toISOString(),
    site: { id: site.id || null, host: site.website_uri || site.url || null, plan },
    readability,
    visibility,
    next_steps: nextSteps(readability, visibility),
  };
}

function buildVisibilitySection(plan, sov) {
  if (plan !== "pro") {
    return {
      available: false,
      reason: "plan",
      message: "AI登場率の測定はProプラン（¥14,800/月〜）の機能です。",
      upgrade_url: "https://nurevo.jp/dashboard",
    };
  }
  if (!sov || !sov.latest) {
    return { available: false, reason: "no_data", message: "AI登場率はまだ測定されていません。次回の週次測定で計測されます。" };
  }
  if (sov.latest.status === "unconfigured") {
    return { available: false, reason: "unconfigured", message: "AIエンジンが未設定のため、AI登場率は測定していません。" };
  }
  if (sov.latest.appearance_rate == null) {
    return { available: false, reason: "no_answers", message: "AIエンジンから回答が得られなかったため、今月のAI登場率は算出できていません。" };
  }
  const trend = sov.trend || [];
  const previous = trend.length > 1 ? trend[trend.length - 2] : null;
  return {
    available: true,
    appearance_rate: sov.latest.appearance_rate,
    citation_rate: sov.latest.citation_rate,
    delta: previous?.appearance_rate != null
      ? Math.round((sov.latest.appearance_rate - previous.appearance_rate) * 1000) / 1000
      : null,
    confidence: sov.latest.confidence,
    answers_received: sov.latest.answers_received,
    questions_asked: sov.latest.questions_asked,
    engines: sov.latest.engines || [],
    competitors: (sov.latest.competitors || []).slice(0, 5),
    measured_at: sov.latest.ran_at,
  };
}

function nextSteps(readability, visibility) {
  const steps = [];
  if (!readability.available) {
    steps.push("wp-adminのAEOスコア画面を開くと診断が実行されます。");
  } else if (readability.score < 80) {
    steps.push("AEOスコア画面のチェックリストから［直す］を実行してください（基本項目は無料です）。");
  }
  if (visibility.available && visibility.appearance_rate != null && visibility.appearance_rate < 0.3) {
    steps.push("AI登場率が低い状態です。営業時間・住所・価格・FAQを本文とschemaの両方に揃えると改善しやすくなります。");
  }
  if (visibility.available && visibility.confidence === "low") {
    steps.push("今回の測定はサンプル数が少ないため、傾向は次回以降の測定とあわせて確認してください。");
  }
  return steps;
}

function bandFromScore(score) {
  if (score == null) return null;
  return score >= 80 ? "green" : score >= 50 ? "yellow" : "red";
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

const percent = (value) => value == null ? "—" : `${Math.round(value * 100)}%`;
const signed = (value, format) => value == null ? "" : `${value > 0 ? "+" : ""}${format(value)}`;
// A change between two rates is a difference in percentage points, not a
// percentage - rendering it as "%" would read as a relative change.
const points = (value) => `${Math.round(value * 100)}pt`;

export function renderMonthlyReportText(report) {
  const lines = [];
  lines.push(`Nurevo AEO 月次レポート ${report.period}`);
  if (report.beta) lines.push("※ AI登場率はベータ機能です。");
  lines.push("");
  lines.push("■ AI可読スコア");
  if (report.readability.available) {
    lines.push(`  ${report.readability.score} / 100 (${BAND_LABEL[report.readability.band] || report.readability.band})`);
    if (report.readability.delta != null) lines.push(`  前回比: ${signed(report.readability.delta, (value) => String(value))}pt`);
    lines.push(`  測定回数: ${report.readability.samples}`);
  } else {
    lines.push("  今月の診断結果がありません。");
  }
  lines.push("");
  lines.push("■ AI登場率");
  if (report.visibility.available) {
    lines.push(`  ${percent(report.visibility.appearance_rate)} (引用率 ${percent(report.visibility.citation_rate)})`);
    if (report.visibility.delta != null) lines.push(`  前回比: ${signed(report.visibility.delta, points)}`);
    lines.push(`  回答数: ${report.visibility.answers_received} / 質問数: ${report.visibility.questions_asked}（確度: ${report.visibility.confidence}）`);
    if (report.visibility.competitors.length) {
      lines.push("  同じ質問で引用された他サイト:");
      for (const competitor of report.visibility.competitors) {
        lines.push(`    - ${competitor.host} ${percent(competitor.appearance_rate)}`);
      }
    }
  } else {
    lines.push(`  ${report.visibility.message}`);
  }
  if (report.next_steps.length) {
    lines.push("");
    lines.push("■ 次のアクション");
    for (const step of report.next_steps) lines.push(`  - ${step}`);
  }
  return `${lines.join("\n")}\n`;
}

export function renderMonthlyReportHtml(report) {
  const sections = [];
  sections.push(`<h1>Nurevo AEO 月次レポート ${escapeHtml(report.period)}</h1>`);
  if (report.beta) sections.push('<p class="beta">※ AI登場率はベータ機能です。</p>');
  if (report.site.host) sections.push(`<p class="site">${escapeHtml(report.site.host)}（プラン: ${escapeHtml(report.site.plan)}）</p>`);

  sections.push("<h2>AI可読スコア</h2>");
  if (report.readability.available) {
    sections.push(`<p class="metric"><strong>${report.readability.score}</strong> / 100 — ${escapeHtml(BAND_LABEL[report.readability.band] || String(report.readability.band))}</p>`);
    if (report.readability.delta != null) sections.push(`<p>前回比: ${escapeHtml(signed(report.readability.delta, String))}pt</p>`);
    sections.push(`<p>測定回数: ${report.readability.samples}</p>`);
  } else {
    sections.push("<p>今月の診断結果がありません。</p>");
  }

  sections.push("<h2>AI登場率</h2>");
  if (report.visibility.available) {
    sections.push(`<p class="metric"><strong>${escapeHtml(percent(report.visibility.appearance_rate))}</strong>（引用率 ${escapeHtml(percent(report.visibility.citation_rate))}）</p>`);
    if (report.visibility.delta != null) sections.push(`<p>前回比: ${escapeHtml(signed(report.visibility.delta, points))}</p>`);
    sections.push(`<p>回答数 ${report.visibility.answers_received} / 質問数 ${report.visibility.questions_asked}（確度: ${escapeHtml(String(report.visibility.confidence))}）</p>`);
    if (report.visibility.competitors.length) {
      const rows = report.visibility.competitors
        .map((competitor) => `<tr><td>${escapeHtml(competitor.host)}</td><td>${escapeHtml(percent(competitor.appearance_rate))}</td></tr>`)
        .join("");
      sections.push(`<h3>同じ質問で引用された他サイト</h3><table><thead><tr><th>サイト</th><th>登場率</th></tr></thead><tbody>${rows}</tbody></table>`);
    }
  } else {
    const upgrade = report.visibility.upgrade_url
      ? ` <a href="${escapeHtml(report.visibility.upgrade_url)}">プランを見る</a>`
      : "";
    sections.push(`<p>${escapeHtml(report.visibility.message)}${upgrade}</p>`);
  }

  if (report.next_steps.length) {
    const items = report.next_steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
    sections.push(`<h2>次のアクション</h2><ul>${items}</ul>`);
  }

  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>Nurevo AEO 月次レポート ${escapeHtml(report.period)}</title><style>
body{font-family:system-ui,-apple-system,"Hiragino Sans",sans-serif;max-width:680px;margin:0 auto;padding:28px;color:#1f2937;line-height:1.7}
h1{font-size:24px}h2{font-size:18px;margin-top:28px;border-top:1px solid #e5e7eb;padding-top:18px}h3{font-size:15px}
.metric strong{font-size:34px}.beta{color:#b7791f;font-weight:600}.site{color:#6b7280}
table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:7px 10px;border-bottom:1px solid #edf0f2}
</style></head><body>${sections.join("\n")}</body></html>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character]));
}
