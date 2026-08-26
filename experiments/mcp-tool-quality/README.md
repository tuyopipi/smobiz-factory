# MCP Quality Bench

`mcp-quality-bench` measures how much MCP tool-definition quality changes a browser agent's task
success rate.

The core question:

> If two MCP definitions describe the same form, does the better definition make the agent succeed
> more often, faster, or with fewer tokens?

This repository is intentionally small: local HTML forms, Playwright, a thin LLM provider layer, and
JSON/Markdown reports. It does not include a hosted service, UI, site-specific private rulebase, or
the `webmcp-canary` server.

## Quick Start

```bash
npm install
npm run install:browsers
npm run smoke
```

`npm run smoke` uses the mock agent and should run without an API key.

Run the real LLM smoke test:

```bash
export MODEL_PROVIDER=openai
export OPENAI_API_KEY=sk-...
export MODEL_NAME=gpt-4.1-mini
npm run smoke:openai
```

Run the sample benchmark:

```bash
npm run bench
```

Outputs are written to:

```text
results/<timestamp>/
  results.json
  summary.csv
  report.md
  <form>-<quality>-<trial>/log.json
  <form>-<quality>-<trial>/final.png
```

Latest copies:

```text
results/latest.json
results/latest-summary.csv
results/latest-report.md
```

## What Is Included

Samples live under:

```text
samples/forms/
samples/mcp/
```

The bundled sample forms are:

- `a`: multi-step booking with strict phone formatting
- `b`: conditional application form
- `c`: ambiguous labels and meaningless field names
- `d`: strict date/time/full-width/digit formats
- `e`: combined multi-step, dynamic, ambiguous, and honeypot behavior

Each sample has:

- `*-low.json`: intentionally vague MCP definition
- `*-high.json`: explicit selectors, formats, required fields, examples, and step hints

## Bring Your Own Forms And MCP Definitions

Copy `benchmark.config.example.json`:

```bash
cp benchmark.config.example.json benchmark.config.json
```

A form can point to a local sample path:

```json
{
  "id": "my-form",
  "name": "My local form",
  "path": "/samples/forms/my-form.html",
  "task": "Fill the form with ...",
  "mcp": {
    "low": "samples/mcp/my-form-low.json",
    "high": "samples/mcp/my-form-high.json"
  }
}
```

Or to an external URL:

```json
{
  "id": "external-checkout",
  "name": "External checkout",
  "url": "https://example.com/test-checkout",
  "task": "Fill the form but do not submit real orders.",
  "mcp": {
    "low": "./my-mcp/external-low.json",
    "high": "./my-mcp/external-high.json"
  }
}
```

Then run:

```bash
node src/run-experiment.mjs --config benchmark.config.json --forms my-form --qualities low,high --runs 5
```

Safety note: this tool will click buttons if the agent chooses to. Use local/sandbox forms for
benchmarks. Do not point it at production forms that create accounts, purchases, or real submissions.

## Providers

The benchmark supports:

- OpenAI
- Anthropic
- OpenAI-compatible APIs
- local OpenAI-compatible servers

OpenAI:

```bash
export MODEL_PROVIDER=openai
export OPENAI_API_KEY=sk-...
export MODEL_NAME=gpt-4.1-mini
```

Anthropic:

```bash
export MODEL_PROVIDER=anthropic
export ANTHROPIC_API_KEY=sk-ant-...
export MODEL_NAME=claude-sonnet-4-20250514
```

OpenAI-compatible or local:

```bash
export MODEL_PROVIDER=openai-compatible
export OPENAI_API_KEY=anything-if-your-server-requires-it
export OPENAI_BASE_URL=http://localhost:11434/v1
export MODEL_NAME=local-model-name
```

For local servers that do not require a key:

```bash
export MODEL_PROVIDER=local
export LOCAL_MODEL_BASE_URL=http://localhost:11434/v1
export MODEL_NAME=local-model-name
```

If the required API key is missing, the benchmark stops with a clear error. Use `--mock` for a
no-cost pipeline check.

## CLI

```bash
node src/run-experiment.mjs --config benchmark.config.example.json
node src/run-experiment.mjs --smoke --mock
node src/run-experiment.mjs --forms a,c,e --qualities low,high --runs 3
node src/run-experiment.mjs --provider anthropic --model claude-sonnet-4-20250514
node src/run-experiment.mjs --headed --forms a --qualities high --runs 1
```

NPM scripts:

```bash
npm run smoke
npm run smoke:openai
npm run bench
npm run bench:mock
npm run experiment
```

## Metrics

Reports include:

- success rate
- average steps
- average tokens
- failure-reason counts
- low vs high lift per form
- overall low vs high lift
- token change percentage

Failure reasons are coarse labels:

- `timeout`
- `validation_error`
- `element_timeout`
- `execution_error`
- `submitted_error`
- `unknown`

## Reproducible Sample Claims

Internal runs on the bundled samples showed:

- low vs high definitions can move success from `0% -> 100%` on forms `a`, `c`, and `e`
- the gap can remain even with a stronger model
- high-quality definitions can reduce token use substantially, in some runs by up to about `-90%`

These are not universal claims about all models or all forms. They are benchmark results for the
included samples and can be reproduced by running:

```bash
export MODEL_PROVIDER=openai
export OPENAI_API_KEY=sk-...
export MODEL_NAME=gpt-4.1-mini
node src/run-experiment.mjs --config benchmark.config.example.json --forms a,c,e --qualities low,high --runs 3
```

To compare models, run the same command with a different `MODEL_NAME` or `MODEL_PROVIDER`, then
compare the generated `report.md` files.

## What This Measures

This benchmark is good for:

- comparing weak vs strong MCP definitions on the same task
- checking whether selector maps, formats, required fields, and step hints change success
- comparing models under the same form/MCP conditions
- producing reproducible logs for browser-agent failures

It does not measure:

- real-user conversion rates
- production WebMCP deployment quality
- security of a hosted MCP service
- CAPTCHA/bot-detection handling
- broad internet form automation reliability
- site-specific private knowledge unless you put it into your own config/MCP files

## Repair Loop

An experimental repair loop is still included:

```bash
npm run repair:mock
```

For an LLM-backed repair run, configure one of the providers above and run:

```bash
npm run repair:openai
```

The repair loop is secondary to the benchmark and has limited support.

## Support

Support is limited. This is a research/benchmark harness, not a managed product. Issues with clear
reproduction steps and logs are more likely to be useful.

## License

MIT. See `LICENSE`.
