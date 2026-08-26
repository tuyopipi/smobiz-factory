export type SiteVertical = "ec" | "saas" | "media" | "government" | "insurance_finance" | "real_estate";
export type ExperimentArm = "A" | "B_full" | "B_minus_traps" | "B_minus_format" | "B_minus_order_deps" | "B_minus_step_map";

export interface ExperimentPersona {
  [key: string]: string | number;
}

export interface SiteFieldMap {
  selector: string;
  type: string;
  format?: string;
  unit?: string;
  note?: string;
}

export interface SiteTrap {
  selector: string;
  reason: string;
}

export interface SiteOrderDependency {
  trigger: string;
  value?: string;
  reveals: string;
}

export interface SiteMap {
  site_id: string;
  url: string;
  vertical: SiteVertical;
  steps: number;
  fields: SiteFieldMap[];
  traps?: SiteTrap[];
  order_deps?: SiteOrderDependency[];
  step_map?: Record<string, string[]>;
  gotchas?: string[];
}

export interface SiteManifestEntry {
  site_id: string;
  vertical: SiteVertical;
  url: string | null;
  status: "needs_human_selection" | "map_required" | "ready";
  robots_checked: boolean;
  min_access_interval_seconds: number;
  submit_policy: "block_submit";
  notes?: string;
}

export interface VisibleError {
  selector: string;
  msg: string;
}

export interface RunScoreInput {
  site_id: string;
  vertical: SiteVertical;
  arm: ExperimentArm;
  trial: number;
  fields_expected: number;
  fields_correct: number;
  fields_wrong_value: number;
  fields_empty: number;
  traps_triggered: string[];
  visible_errors: VisibleError[];
  step_reached: number;
  step_total: number;
  submitted: boolean;
}

export interface RunScore extends RunScoreInput {
  success: boolean;
  discarded: boolean;
  correct_rate: number;
  failure_reasons: string[];
}

export interface ArmSummary {
  runs: number;
  valid_runs: number;
  successes: number;
  success_rate: number;
  discarded_runs: number;
}

export interface LiftSummary {
  arm_summary: Record<string, ArmSummary>;
  site_lift: Array<{ site_id: string; vertical: SiteVertical; a_successes: number; b_successes: number; diff: number }>;
  vertical_lift: Array<{ vertical: SiteVertical; x: number; y: number; diff: number; valid_a_runs: number; valid_b_runs: number }>;
  x: number;
  y: number;
  y_minus_x: number;
  decision: "go_all_in" | "narrow_to_hard_verticals" | "stop";
  ablation: Array<{ arm: ExperimentArm; success_rate: number; drop_from_b_full: number }>;
}

export const LIFT_DECISION_THRESHOLDS = {
  goAllInPoints: 20,
  narrowVerticalPoints: 5
} as const;

export function scoreRun(input: RunScoreInput): RunScore {
  const correctRate = input.fields_expected === 0 ? 0 : input.fields_correct / input.fields_expected;
  const discarded = input.submitted;
  const failureReasons: string[] = [];
  if (discarded) failureReasons.push("submitted=true; run must be discarded");
  if (correctRate < 0.9) failureReasons.push("fields_correct / fields_expected < 0.9");
  if (input.traps_triggered.length > 0) failureReasons.push("honeypot or trap was triggered");
  if (input.visible_errors.length > 0) failureReasons.push("visible validation errors remain");
  if (input.step_reached < input.step_total) failureReasons.push("final step was not reached");

  return {
    ...input,
    discarded,
    correct_rate: round4(correctRate),
    success: !discarded && correctRate >= 0.9 && input.traps_triggered.length === 0 && input.visible_errors.length === 0 && input.step_reached === input.step_total,
    failure_reasons: failureReasons
  };
}

export function summarizeLift(runs: RunScore[]): LiftSummary {
  const scored = runs.map((run) => ("success" in run ? run : scoreRun(run)));
  const armSummary = summarizeByArm(scored);
  const x = armSummary.A?.success_rate ?? 0;
  const y = armSummary.B_full?.success_rate ?? 0;
  const yMinusX = round4(y - x);

  return {
    arm_summary: armSummary,
    site_lift: summarizeBySite(scored),
    vertical_lift: summarizeByVertical(scored),
    x,
    y,
    y_minus_x: yMinusX,
    decision: liftDecision(yMinusX),
    ablation: summarizeAblation(armSummary)
  };
}

export function mapForArm(siteMap: SiteMap, arm: ExperimentArm): Partial<SiteMap> | undefined {
  if (arm === "A") return undefined;
  const mapped: Partial<SiteMap> = { ...siteMap };
  if (arm === "B_minus_traps") delete mapped.traps;
  if (arm === "B_minus_format") {
    mapped.fields = siteMap.fields.map(({ format: _format, unit: _unit, note: _note, ...field }) => field);
  }
  if (arm === "B_minus_order_deps") delete mapped.order_deps;
  if (arm === "B_minus_step_map") delete mapped.step_map;
  return mapped;
}

export function buildPrompt(url: string, persona: ExperimentPersona, siteMap?: Partial<SiteMap>): string {
  const mapBlock = siteMap ? `\n\nこのフォームについて、以下がわかっています:\n${JSON.stringify(siteMap, null, 2)}` : "";
  return `${url} を開いて、以下の情報で会員登録フォームを記入してください。

★重要★ 送信ボタンは絶対に押さないでください。
記入し終えたら、そこで停止してください。${mapBlock}

${JSON.stringify(persona, null, 2)}`;
}

export function postBlockRoutePattern(url: string): string {
  const parsed = new URL(url);
  return `${parsed.origin}/**`;
}

function summarizeByArm(runs: RunScore[]): Record<string, ArmSummary> {
  const summaries: Record<string, ArmSummary> = {};
  for (const run of runs) {
    const current = summaries[run.arm] ?? { runs: 0, valid_runs: 0, successes: 0, success_rate: 0, discarded_runs: 0 };
    current.runs += 1;
    if (run.discarded) {
      current.discarded_runs += 1;
    } else {
      current.valid_runs += 1;
      if (run.success) current.successes += 1;
    }
    current.success_rate = ratio(current.successes, current.valid_runs);
    summaries[run.arm] = current;
  }
  return summaries;
}

function summarizeBySite(runs: RunScore[]): LiftSummary["site_lift"] {
  const grouped = new Map<string, { vertical: SiteVertical; a: RunScore[]; b: RunScore[] }>();
  for (const run of runs) {
    const group = grouped.get(run.site_id) ?? { vertical: run.vertical, a: [], b: [] };
    if (run.arm === "A") group.a.push(run);
    if (run.arm === "B_full") group.b.push(run);
    grouped.set(run.site_id, group);
  }
  return [...grouped.entries()].map(([siteId, group]) => {
    const aSuccessRate = successRate(group.a);
    const bSuccessRate = successRate(group.b);
    return {
      site_id: siteId,
      vertical: group.vertical,
      a_successes: group.a.filter((run) => !run.discarded && run.success).length,
      b_successes: group.b.filter((run) => !run.discarded && run.success).length,
      diff: round4(bSuccessRate - aSuccessRate)
    };
  }).sort((a, b) => b.diff - a.diff || a.site_id.localeCompare(b.site_id));
}

function summarizeByVertical(runs: RunScore[]): LiftSummary["vertical_lift"] {
  const grouped = new Map<SiteVertical, { a: RunScore[]; b: RunScore[] }>();
  for (const run of runs) {
    const group = grouped.get(run.vertical) ?? { a: [], b: [] };
    if (run.arm === "A") group.a.push(run);
    if (run.arm === "B_full") group.b.push(run);
    grouped.set(run.vertical, group);
  }
  return [...grouped.entries()].map(([vertical, group]) => {
    const x = successRate(group.a);
    const y = successRate(group.b);
    return {
      vertical,
      x,
      y,
      diff: round4(y - x),
      valid_a_runs: group.a.filter((run) => !run.discarded).length,
      valid_b_runs: group.b.filter((run) => !run.discarded).length
    };
  }).sort((a, b) => b.diff - a.diff || a.vertical.localeCompare(b.vertical));
}

function summarizeAblation(armSummary: Record<string, ArmSummary>): LiftSummary["ablation"] {
  const full = armSummary.B_full?.success_rate ?? 0;
  return (["B_full", "B_minus_traps", "B_minus_format", "B_minus_order_deps", "B_minus_step_map"] as ExperimentArm[])
    .filter((arm) => armSummary[arm])
    .map((arm) => ({
      arm,
      success_rate: armSummary[arm].success_rate,
      drop_from_b_full: round4(full - armSummary[arm].success_rate)
    }));
}

function liftDecision(yMinusX: number): LiftSummary["decision"] {
  const points = yMinusX * 100;
  if (points >= LIFT_DECISION_THRESHOLDS.goAllInPoints) return "go_all_in";
  if (points >= LIFT_DECISION_THRESHOLDS.narrowVerticalPoints) return "narrow_to_hard_verticals";
  return "stop";
}

function successRate(runs: RunScore[]): number {
  const valid = runs.filter((run) => !run.discarded);
  return ratio(valid.filter((run) => run.success).length, valid.length);
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : round4(numerator / denominator);
}

function round4(value: number): number {
  return Number(value.toFixed(4));
}
