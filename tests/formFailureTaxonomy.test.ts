import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateSummaries,
  classifyRun,
  summarizeForm,
  summariesToCsv,
  type FormRun,
  type GroundTruth,
  type Persona
} from "../src/experiments/formFailureTaxonomy.js";

const persona: Persona = {
  family_name: "山田",
  given_name: "太郎",
  email: "test@example.com",
  phone: "09012345678",
  postal_code: "1500001",
  prefecture: "東京都"
};

const groundTruth: GroundTruth = {
  form_id: "sandbox_1",
  ground_truth_mapping: {
    "#phone": "phone",
    "#zip": "postal_code",
    "#prefecture": "prefecture",
    "#essay": "motivation"
  },
  honeypots: ["#website_url"],
  validation_rules: { "#phone": "no_hyphen" },
  order_deps: [{ trigger: "#country", reveals: "#prefecture" }],
  steps: 3,
  step2_requires: ["shipping_method"]
};

function baseRun(overrides: Partial<FormRun>): FormRun {
  return {
    form_id: "sandbox_1",
    factory: "custom",
    tier: "A",
    final_state: "stuck",
    steps_reached: 3,
    steps_total: 3,
    fields_expected: 4,
    fields_filled_correctly: 3,
    full_trace: [],
    ...overrides
  };
}

test("classifies format validation as B when semantic value is correct", () => {
  const failures = classifyRun(
    baseRun({
      full_trace: [
        {
          step: 1,
          action: "fill",
          selector: "#phone",
          value_written: "090-1234-5678",
          dom_diff_after: { appeared: [".error-message: 'ハイフンは使用できません'"] },
          action_result: "ok"
        }
      ]
    }),
    groundTruth,
    persona
  );

  assert.equal(failures.length, 1);
  assert.equal(failures[0].label, "B");
  assert.equal(failures[0].star, true);
});

test("classifies wrong field value as A even when the field exists", () => {
  const failures = classifyRun(
    baseRun({
      full_trace: [
        {
          step: 1,
          action: "fill",
          selector: "#phone",
          value_written: "1500001",
          action_result: "ok"
        }
      ]
    }),
    groundTruth,
    persona
  );

  assert.equal(failures.length, 1);
  assert.equal(failures[0].label, "A");
  assert.equal(failures[0].star, false);
});

test("classifies hidden honeypot fills as C", () => {
  const failures = classifyRun(
    baseRun({
      full_trace: [
        {
          step: 2,
          action: "fill",
          selector: "#website_url",
          value_written: "https://example.com",
          element_snapshot: {
            tag: "input",
            computed_style: { display: "none", opacity: "0" },
            bounding_box: { x: 0, y: 0, w: 0, h: 0 },
            tabindex: -1
          },
          action_result: "ok"
        }
      ]
    }),
    groundTruth,
    persona
  );

  assert.equal(failures[0].label, "C");
  assert.equal(failures[0].star, true);
});

test("classifies unavailable dependent fields as D", () => {
  const failures = classifyRun(
    baseRun({
      full_trace: [
        {
          step: 1,
          action: "fill",
          selector: "#prefecture",
          value_written: "東京都",
          action_result: "element_not_found"
        }
      ]
    }),
    groundTruth,
    persona
  );

  assert.equal(failures[0].label, "D");
  assert.equal(failures[0].star, true);
});

test("classifies unfinished multi-step forms as E unless bot detection appears", () => {
  const failures = classifyRun(
    baseRun({
      steps_reached: 1,
      steps_total: 3,
      error_messages_final: ["次へ進めません"],
      full_trace: []
    }),
    groundTruth,
    persona
  );

  assert.equal(failures[0].label, "E");
  assert.equal(failures[0].star, true);
});

test("classifies captcha as F and does not also classify multi-step lost", () => {
  const failures = classifyRun(
    baseRun({
      steps_reached: 1,
      steps_total: 3,
      error_messages_final: ["Cloudflare unusual traffic"],
      full_trace: []
    }),
    groundTruth,
    persona
  );

  assert.deepEqual(failures.map((failure) => failure.label), ["F"]);
  assert.equal(failures[0].star, false);
});

test("summarizes star rate and emits required CSV columns", () => {
  const run = baseRun({
    full_trace: [
      {
        step: 1,
        action: "fill",
        selector: "#phone",
        value_written: "090-1234-5678",
        dom_diff_after: { appeared: [".error-message: 'ハイフンは使用できません'"] },
        action_result: "ok"
      },
      {
        step: 2,
        action: "fill",
        selector: "#zip",
        value_written: "09012345678",
        action_result: "ok"
      }
    ]
  });
  const failures = classifyRun(run, groundTruth, persona);
  const summary = summarizeForm(run, failures);
  const csv = summariesToCsv([summary]);

  assert.equal(summary.counts.B, 1);
  assert.equal(summary.counts.A, 1);
  assert.equal(summary.star_rate, 0.5);
  assert.match(csv, /form_id,factory,tier,final_state,fields_expected,fields_failed,A,B,C,D,E,F,G/);
});

test("aggregate includes factory, tier, and repeated cross-factory patterns", () => {
  const runA = baseRun({ form_id: "typeform_1", factory: "Typeform", tier: "A" });
  const runB = baseRun({ form_id: "gov_1", factory: "Government", tier: "B" });
  const failureA = { label: "B" as const, star: true, selector: "#phone", step: 1, reason: "value matched the intended field but failed site-specific validation format" };
  const failureB = { ...failureA, selector: "#tel" };
  const summaries = [summarizeForm(runA, [failureA]), summarizeForm(runB, [failureB])];
  const aggregate = aggregateSummaries(summaries, { typeform_1: [failureA], gov_1: [failureB] });

  assert.equal(aggregate.star_rate, 1);
  assert.equal(aggregate.by_factory.Typeform.star_rate, 1);
  assert.equal(aggregate.by_tier.A.star_rate, 1);
  assert.deepEqual(aggregate.repeated_patterns[0].factories, ["Government", "Typeform"]);
});
