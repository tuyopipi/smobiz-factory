export type FailureLabel = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export type FinalState = "submitted_ok" | "submitted_error" | "stuck" | "timeout";

export type ActionResult = "ok" | "element_not_found" | "not_interactable";

export interface Persona {
  [key: string]: string | number;
}

export interface ElementSnapshot {
  tag?: string;
  type?: string;
  name?: string;
  id?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  maxlength?: number;
  pattern?: string;
  computed_style?: {
    display?: string;
    opacity?: string;
    visibility?: string;
  };
  bounding_box?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  tabindex?: string | number | null;
}

export interface DomDiff {
  appeared?: string[];
  disappeared?: string[];
}

export interface TraceAction {
  step: number;
  action: string;
  selector?: string;
  value_written?: string;
  element_snapshot?: ElementSnapshot;
  dom_diff_after?: DomDiff;
  action_result?: ActionResult;
}

export interface OrderDependency {
  trigger: string;
  reveals: string;
}

export interface GroundTruth {
  form_id: string;
  ground_truth_mapping: Record<string, string>;
  honeypots?: string[];
  validation_rules?: Record<string, string>;
  order_deps?: OrderDependency[];
  steps: number;
  step2_requires?: string[];
}

export interface FormRun {
  form_id: string;
  factory: string;
  tier: "A" | "B";
  final_state: FinalState;
  steps_reached: number;
  steps_total: number;
  fields_expected: number;
  fields_filled_correctly: number;
  error_messages_final?: string[];
  screenshots?: string[];
  full_trace: TraceAction[];
}

export interface ClassifiedFailure {
  label: FailureLabel;
  star: boolean;
  selector?: string;
  step?: number;
  reason: string;
  action?: TraceAction;
}

export interface FormSummary {
  form_id: string;
  factory: string;
  tier: "A" | "B";
  final_state: FinalState;
  fields_expected: number;
  fields_failed: number;
  counts: Record<FailureLabel, number>;
  star_failures: number;
  total_failures: number;
  star_rate: number;
}

export interface AggregateSummary {
  total_failures: number;
  star_failures: number;
  star_rate: number;
  by_factory: Record<string, Pick<AggregateSummary, "total_failures" | "star_failures" | "star_rate">>;
  by_tier: Record<string, Pick<AggregateSummary, "total_failures" | "star_failures" | "star_rate">>;
  repeated_patterns: Array<{ key: string; count: number; factories: string[] }>;
}

export const STAR_LABELS = new Set<FailureLabel>(["B", "C", "D", "E"]);

export const DECISION_THRESHOLDS = {
  goAllIn: 0.5,
  narrowVertical: 0.25
} as const;

export function classifyRun(run: FormRun, groundTruth: GroundTruth, persona: Persona): ClassifiedFailure[] {
  const failures: ClassifiedFailure[] = [];
  const failedSelectors = new Set<string>();

  for (const action of run.full_trace) {
    const selector = action.selector;
    if (!selector) continue;

    const hiddenReason = hiddenTrapReason(action.element_snapshot);
    if (action.action === "fill" && (groundTruth.honeypots?.includes(selector) || hiddenReason)) {
      failures.push(withStar("C", selector, action.step, hiddenReason ?? "filled known honeypot field", action));
      failedSelectors.add(selector);
      continue;
    }

    if (
      (action.action_result === "element_not_found" || action.action_result === "not_interactable") &&
      isOrderDependency(selector, groundTruth.order_deps ?? [])
    ) {
      failures.push(withStar("D", selector, action.step, "field was unavailable before its prerequisite field was completed", action));
      failedSelectors.add(selector);
      continue;
    }

    if (action.action === "fill" && action.value_written !== undefined) {
      const expectedPersonaKey = groundTruth.ground_truth_mapping[selector];
      if (!expectedPersonaKey) continue;

      const expectedValue = persona[expectedPersonaKey];
      if (expectedValue === undefined) continue;

      const hasFieldError = hasErrorNearField(action.dom_diff_after);
      const semanticMatch = sameSemanticValue(action.value_written, expectedValue);
      const exactMatch = String(action.value_written) === String(expectedValue);

      if (hasFieldError && semanticMatch && (!exactMatch || groundTruth.validation_rules?.[selector])) {
        failures.push(withStar("B", selector, action.step, "value matched the intended field but failed site-specific validation format", action));
        failedSelectors.add(selector);
        continue;
      }

      if (!semanticMatch) {
        failures.push(withoutStar("A", selector, action.step, `wrote ${JSON.stringify(action.value_written)} into field mapped to ${expectedPersonaKey}`, action));
        failedSelectors.add(selector);
      }
    }
  }

  if (isBotDetected(run)) {
    failures.push(withoutStar("F", undefined, undefined, "CAPTCHA, Cloudflare, or unusual-traffic text appeared"));
  }

  if (isLostInMultiStep(run)) {
    failures.push(withStar("E", undefined, undefined, "run did not reach all expected form steps and no bot detection was recorded"));
  }

  for (const action of run.full_trace) {
    const selector = action.selector;
    if (!selector || failedSelectors.has(selector)) continue;
    const mappedKey = groundTruth.ground_truth_mapping[selector];
    if (action.element_snapshot?.tag === "textarea" && mappedKey && persona[mappedKey] === undefined) {
      failures.push(withoutStar("G", selector, action.step, "textarea required free-form content not present in persona", action));
    }
  }

  return failures;
}

export function summarizeForm(run: FormRun, failures: ClassifiedFailure[]): FormSummary {
  const counts = zeroCounts();
  for (const failure of failures) counts[failure.label] += 1;
  const starFailures = failures.filter((failure) => failure.star).length;
  return {
    form_id: run.form_id,
    factory: run.factory,
    tier: run.tier,
    final_state: run.final_state,
    fields_expected: run.fields_expected,
    fields_failed: failures.length,
    counts,
    star_failures: starFailures,
    total_failures: failures.length,
    star_rate: ratio(starFailures, failures.length)
  };
}

export function aggregateSummaries(summaries: FormSummary[], failuresByForm: Record<string, ClassifiedFailure[]>): AggregateSummary {
  const totalFailures = summaries.reduce((sum, row) => sum + row.total_failures, 0);
  const starFailures = summaries.reduce((sum, row) => sum + row.star_failures, 0);
  return {
    total_failures: totalFailures,
    star_failures: starFailures,
    star_rate: ratio(starFailures, totalFailures),
    by_factory: groupRates(summaries, "factory"),
    by_tier: groupRates(summaries, "tier"),
    repeated_patterns: repeatedPatterns(summaries, failuresByForm)
  };
}

export function summariesToCsv(summaries: FormSummary[]): string {
  const header = ["form_id", "factory", "tier", "final_state", "fields_expected", "fields_failed", "A", "B", "C", "D", "E", "F", "G"];
  const rows = summaries.map((summary) => [
    summary.form_id,
    summary.factory,
    summary.tier,
    summary.final_state,
    String(summary.fields_expected),
    String(summary.fields_failed),
    ...(["A", "B", "C", "D", "E", "F", "G"] as FailureLabel[]).map((label) => String(summary.counts[label]))
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

function withStar(label: FailureLabel, selector: string | undefined, step: number | undefined, reason: string, action?: TraceAction): ClassifiedFailure {
  return { label, star: true, selector, step, reason, action };
}

function withoutStar(label: FailureLabel, selector: string | undefined, step: number | undefined, reason: string, action?: TraceAction): ClassifiedFailure {
  return { label, star: false, selector, step, reason, action };
}

function hiddenTrapReason(snapshot?: ElementSnapshot): string | undefined {
  if (!snapshot) return undefined;
  const style = snapshot.computed_style ?? {};
  if (style.display === "none") return "filled element with display:none";
  if (style.visibility === "hidden") return "filled element with visibility:hidden";
  if (Number(style.opacity) === 0) return "filled element with opacity:0";
  if (snapshot.tabindex === -1 || snapshot.tabindex === "-1") return "filled element with tabindex=-1";
  const box = snapshot.bounding_box;
  if (box && (box.w <= 0 || box.h <= 0 || box.x < -50_000 || box.y < -50_000)) return "filled element with offscreen or zero-size bounding box";
  return undefined;
}

function isOrderDependency(selector: string, deps: OrderDependency[]): boolean {
  return deps.some((dep) => dep.reveals === selector || dep.trigger === selector);
}

function hasErrorNearField(diff?: DomDiff): boolean {
  const appeared = diff?.appeared ?? [];
  return appeared.some((entry) => /error|invalid|必須|正しく|使用できません|入力してください|形式/i.test(entry));
}

function sameSemanticValue(actual: string, expected: string | number): boolean {
  const expectedString = String(expected);
  if (actual === expectedString) return true;
  const normalizedActual = normalizeValue(actual);
  const normalizedExpected = normalizeValue(expectedString);
  return normalizedActual.length > 0 && normalizedActual === normalizedExpected;
}

function normalizeValue(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‐-‒–—―ー−\s()]/g, "")
    .replace(/[^\p{Letter}\p{Number}@.]/gu, "");
}

function isBotDetected(run: FormRun): boolean {
  const text = [
    ...(run.error_messages_final ?? []),
    ...run.full_trace.flatMap((action) => action.dom_diff_after?.appeared ?? [])
  ].join(" ");
  return /captcha|cloudflare|unusual traffic|bot detected|私はロボットではありません|reCAPTCHA/i.test(text);
}

function isLostInMultiStep(run: FormRun): boolean {
  return run.steps_reached < run.steps_total && !isBotDetected(run);
}

function zeroCounts(): Record<FailureLabel, number> {
  return { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0 };
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Number((numerator / denominator).toFixed(4));
}

function groupRates(summaries: FormSummary[], key: "factory" | "tier"): Record<string, Pick<AggregateSummary, "total_failures" | "star_failures" | "star_rate">> {
  const groups: Record<string, { total_failures: number; star_failures: number }> = {};
  for (const summary of summaries) {
    const groupKey = summary[key];
    groups[groupKey] ??= { total_failures: 0, star_failures: 0 };
    groups[groupKey].total_failures += summary.total_failures;
    groups[groupKey].star_failures += summary.star_failures;
  }
  return Object.fromEntries(
    Object.entries(groups).map(([groupKey, value]) => [
      groupKey,
      { ...value, star_rate: ratio(value.star_failures, value.total_failures) }
    ])
  );
}

function repeatedPatterns(summaries: FormSummary[], failuresByForm: Record<string, ClassifiedFailure[]>): Array<{ key: string; count: number; factories: string[] }> {
  const factoryByForm = new Map(summaries.map((summary) => [summary.form_id, summary.factory]));
  const patterns = new Map<string, { count: number; factories: Set<string> }>();
  for (const [formId, failures] of Object.entries(failuresByForm)) {
    const factory = factoryByForm.get(formId) ?? "unknown";
    for (const failure of failures) {
      const key = `${failure.label}:${canonicalReason(failure.reason)}`;
      const current = patterns.get(key) ?? { count: 0, factories: new Set<string>() };
      current.count += 1;
      current.factories.add(factory);
      patterns.set(key, current);
    }
  }
  return [...patterns.entries()]
    .filter(([, value]) => value.count > 1 && value.factories.size > 1)
    .map(([key, value]) => ({ key, count: value.count, factories: [...value.factories].sort() }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function canonicalReason(reason: string): string {
  if (/honeypot|display:none|opacity:0|tabindex=-1|offscreen/.test(reason)) return "hidden-trap";
  if (/validation format/.test(reason)) return "validation-format";
  if (/prerequisite/.test(reason)) return "order-dependency";
  if (/did not reach all expected form steps/.test(reason)) return "multi-step-lost";
  if (/CAPTCHA|Cloudflare|unusual-traffic/i.test(reason)) return "bot-detection";
  return reason;
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
