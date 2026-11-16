# Nurevo AIO agency sales support (first version)

This feature reuses consented leads collected by the existing agency widget. It does not send outreach, create contacts, change pricing, or verify revenue.

## Included
- Tenant-scoped manual stages: new, proposed, trial, won, lost. Won is NOT confirmed payment.
- Existing lead → proposal draft with agency/customer/site and technical score context. Scores are not AI visibility or promised results.
- Japanese/English customer proposal editor; explicit evidence, work, quotation/terms and next steps. Browser print/PDF and copy. Draft remains in the current tab only, never localStorage or server storage. Review before sharing.
- First-site onboarding checklist, suggested 90-second demo script (not a recorded demo), FAQ.
- Dashboard controls translated in eight existing dashboard locales; standalone kit supports Japanese and English. New dashboard labels use explicit English fallback in the other 35 locales (regional Spanish uses Spanish).

## Deployment
1. Review and merge this isolated branch with current branding work. Do not overwrite concurrent dashboard wording.
2. Back up the existing D1 database through the established deployment process.
3. Apply `nurevo-impl/db/0051_agency_sales_status.sql` once to an existing database that lacks these columns. Fresh databases built from schema.sql already include them; do not apply twice.
4. Deploy worker and static assets via established release workflow. This branch does not apply migrations or deploy.
5. Verify approved admin can change its own lead stage, viewer cannot, and another account cannot access it. Verify generated PDF and proposal before use.

Before migration, existing leads still load and status writes return migration_pending (503). No legacy data is backfilled as a confirmed sale.

## Tests
- `npm run test:agency-sales`
- `npm run test:agency-leadgen`
- `node scripts/test-dashboard-i18n.mjs`
- `PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node scripts/test-agency-sales-browser.mjs`
- `npm run test:canary`

## Deliberately excluded
Automatic proposals with unverified findings, automated customer sharing, actual video recording, full CRM/manual lead import, payment/trial conversion attribution, changes to international eligibility or partnership terms.
