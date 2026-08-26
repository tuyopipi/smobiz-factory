# Contributing

Contributions are welcome, but support is intentionally limited.

Good contributions:

- bug fixes that make benchmark runs more reproducible
- additional self-contained sample forms
- provider support that does not add heavy dependencies
- documentation corrections

Please avoid:

- site-specific private rules or scraped knowledge
- cloud service features
- UI work
- benchmark claims without reproducible logs

Before opening a PR, run:

```bash
npm run smoke
node --check src/run-experiment.mjs
node --check src/agent.mjs
```

Do not commit API keys, `.env` files, `results/`, or `node_modules/`.
