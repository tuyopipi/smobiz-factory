# Referral production release — 2026-10-20

Branch: `feat/partner-referral-wise`. No main changes or force pushes.

## Baseline and scope

Before release, 100% of production traffic used Worker
`e0558acb-c0cd-4a83-b9f1-5d2086b15968` (2026-10-19T16:51:54Z).
The downloaded production bundle matched the build of commit `e23b914` after
removing redundant `use strict` statements introduced by package context.
That commit is the direct parent of the referral implementation `81cc11a`.
It includes the Pro merge `65a37e2`, Perplexity Agent API `629307b`, and
continuous optimization `71999b9`. No production code needed to be imported.
Production bindings, compatibility date and plain vars matched wrangler.jsonc.

EN/JA share and login/identity-verification email copy now follows the supplied
master, in worker/referral-email-copy.mjs. Six machine translations await
Hashimoto review. Name fields are optional; email addresses are the fallback.
The postal address comes from public/terms/index.html.
Report-sharing opt-out uses a signed URL and confirmation POST; login mail is
unaffected. Migration 0035 adds a suppression table alongside the referral tables.

Pro sales remain closed (`CHECKOUTABLE_PLANS=['standard']`). Stripe price,
product, webhook and payment/transfer configuration are unchanged. Reconciliation
only reads Stripe. Existing metadata backfill is metadata-only; no purchase or
payout is needed for verification. Monthly scheduled reconciliation remains off
unless REFERRAL_LEDGER_ENABLED=1 is explicitly configured; manual snapshots are
available. All snapshots/CSV are draft calculations and initiate no Wise payment.

## Backup and migration

Full production DB backup (mode 0600; outside git):
`/Users/tsuyoshi/nurevo-d1-backups/nurevo-db-before-referral-20261020.sql`

SHA-256: `37529842754f7a42bd54db16d1eb24080e9a9357798cb5d98a51ca1d981a8994`

The 507269-byte SQL restored successfully in local SQLite. Integrity check was
OK. Applying 0035 preserved every existing row in accounts (21), members (21),
sites (3), aeo_scores (41), aeo_rulesets (6), and aeo_sov_runs (3).
Only CREATE TABLE/INDEX and ADD COLUMN are used. WEBMCP_DB is not migrated.

## Rollback

From experiments/webmcp-canary, using the installed Wrangler:

```sh
./node_modules/.bin/wrangler rollback e0558acb-c0cd-4a83-b9f1-5d2086b15968 --message 'Rollback referral release' --yes
./node_modules/.bin/wrangler deployments list
```

Confirm 100% on the previous version and check /dashboard, /api/plans and an
existing site. Worker rollback leaves D1 data and additional tables/columns in
place; the previous Worker ignores them. Do not drop new columns or restore the
entire backup during an ordinary code rollback, since that would discard later
production data. Credentials and data are never committed or printed.

## Validation before release

Passed: referral security/attribution and real SQLite ledger suite, email locale
suite, partner auth suite, billing, SoV, AEO scoring, continuous optimization,
and 8-language Chrome UI. Continuous optimization fixture now applies migrations
0030/0035, matching the schema its diagnosis writer requires. Mail and Stripe
are mocked in these suites; they are not evidence of live inbox delivery.

Production release ID and live verification results are recorded below after
execution. Live signup/share/mailbox verification requires two user-designated
recipient addresses. No real recipient is inferred from existing customer data.

Migration 0035 was applied remotely: 10 queries, completed successfully.
Post-migration readback confirmed all six new referral objects, both auth token
attribution columns, and unchanged accounts/sites/aeo_scores/SoV row counts.
The backup/restore check preceded the production migration.
