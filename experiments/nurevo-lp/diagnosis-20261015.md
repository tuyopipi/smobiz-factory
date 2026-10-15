# nurevo.jp diagnosis — 2026-10-15

Used the production `/api/aeo/score?url=https%3A%2F%2Fnurevo.jp%2F&lang=ja` before the change, and the repository's `diagnoseAeoUrl("https://nurevo.jp/")` directly after deployment. No browser was used.

| Check | Before | After |
| --- | --- | --- |
| Structured data | OK | OK |
| Key information | OK | OK |
| Body legibility | WARN | OK |
| llms.txt | OK | OK |
| Consistency and freshness | OK | OK |
| Score | 90/100 | 100/100 |

The raw HTML already contained SoftwareApplication, Organization, WebSite and FAQPage JSON-LD. The SaaS implementation from commit 3fc9587 remained present: SoftwareApplication had all six fields and Product fields were not required. The initial production API reported 10/10 including the active ruleset's additional fields.

The app's JSON-LD description used meta.desc, while the visible hero used hero.lead. The diagnostic requires the description to appear in visible text; only the name matched, giving factsInText=0.5 and legibility=0.7. Using the already visible hero.lead in SoftwareApplication.description makes both values 1. No scoring logic or claims were added. Applied to all eight generated language pages.

The top page includes the service name and description, Bestie.合同会社, its address and info@nurevo.jp. The operator/contact agree with llms.txt. This is a check of these published facts, not a comprehensive audit of every site URL.

Validation: npm run build; npm run check (28 SEO pages, no problems); git diff --check. Production direct diagnosis: score=100, gatePassed=true, all eight checks OK, SoftwareApplication 6/6. Production API with a fresh target query (`https://nurevo.jp/?diagnostic=20261015-description`) also returned 100 and all checks OK. `curl https://nurevo.jp/llms.txt` returned HTTP 200 after deployment.

The public score API caches each target URL for seven days. The original bare URL can continue returning its prior cached score; direct diagnosis above bypasses that cache. No KV data or backend deployment was changed.

Deployment: project nurevo, branch production, Wrangler 4.143.0.

```text
✨ Success! Uploaded 8 files (58 already uploaded) (1.29 sec)
✨ Uploading _headers
🌎 Deploying...
✨ Deployment complete! Take a peek over at https://2d041f9f.nurevo-dbr.pages.dev
```
