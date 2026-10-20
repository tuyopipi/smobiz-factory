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

## Production outcome

Signed source commit: `659c693` (ED25519 signature verified).
Worker version: `43d04cf5-2566-436b-b04a-0d3c87c80afb`, tag `referral-659c693`.
100% traffic switched at 2026-10-20T04:39:20Z; deployment status readback confirmed.
The referral secret was uploaded as secret_text together with the version;
all 12 existing secrets were preserved. The generated local secret file was
removed after deployment. Branch pushed normally to origin; no main/force push.

Passed live checks (qa/referral-production-20261020.json):
- /dashboard and all three referral module assets return 200.
- Live share form module contains partner/customer name fields.
- Existing /api/crawlers returns 200.
- Unauthenticated partner API returns 401; admin ledger CSV returns 403.
- Invalid unsubscribe credential returns 400.
- Cryptographically signed expired verification credential is rejected with the
  auth-error redirect; invalid invitation displays the invalid/expired page.
- Referral IP limit returns 429 after its ten-request window allowance.
  This verification uses the caller's real IP; no headers spoof an IP.

Read-only live D1 Wise dry-run for closed period 2026-09 found zero referred
accounts and zero eligible subscriptions. The existing exporters generated
header-only summary/audit files at:
- /private/tmp/nurevo-wise-dry-run-2026-09.csv
- /private/tmp/nurevo-ledger-dry-run-2026-09.csv

This dry-run did not create a production ledger snapshot, call Stripe, or pay
anyone. It is not evidence of a nonzero paid-invoice calculation in production;
that behavior is covered by the SQLite/mock-Stripe regression suite.

### Outstanding live verification

The user-designated partner/customer recipient addresses have not been supplied.
Consequently real signup email delivery, mailbox link redemption, share email
receipt, single-use redemption with an actual customer, resulting referred_by
record, and authenticated admin snapshot/CSV download remain unverified live.
Do not describe the full end-to-end acceptance criterion as complete.
No real customer was used as a test recipient and no synthetic customer records
were inserted into production as a substitute. Provide two controlled recipient
addresses, complete mailbox verification, then use a super-admin session for the
actual closed-month ledger snapshot and CSV download. With no paid Pro invoices,
the correct final ledger remains zero; do not enable Pro or create a payment to
produce a nonzero test row.

References used for the release procedure:
- https://developers.cloudflare.com/d1/best-practices/import-export-data/
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/
