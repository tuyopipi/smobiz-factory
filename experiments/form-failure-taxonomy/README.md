# Form Failure Taxonomy Experiment

This directory turns the experiment spec into executable assets.

The fixed output metric is:

```text
star_rate = memory_failures / all_failures
memory_failures = B + C + D + E
```

Decision thresholds are fixed before execution:

```text
>= 50%   go all in
25-50%  narrow to hard verticals such as government
< 25%   stop
```

## Safety Rules

- Tier A sandbox forms may be submitted.
- Tier B real sites must stop before submit.
- Do not create fake accounts.
- Do not repeatedly hit the same real site.
- Human review is required after automatic classification.

## Files

- `fixtures/persona.json`: fixed persona shared by every form.
- `fixtures/forms.manifest.json`: 30 form slots, submit policy, and setup status.
- `fixtures/ground_truth.*.json`: human-authored maps for classification.
- `results/{form_id}/trace.json`: raw run traces, screenshots, and final DOM state.

## Current Implementation State

The repository now includes:

- TypeScript classifier: `src/experiments/formFailureTaxonomy.ts`
- Unit tests for labels A-G and aggregation: `tests/formFailureTaxonomy.test.ts`
- One ready local sandbox slot: `custom_react_hook_form_zod_1`

The browser-use runner is intentionally not wired to real sites yet because Tier B target
selection and any external account setup must be done explicitly.
