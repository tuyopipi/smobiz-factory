# Partner referrals and manual Wise reconciliation

Implementation on `feat/partner-referral-wise`. For the production rollout and
verification status, see `docs/referral-production-20261020.md`.

Nurevo remains the Stripe merchant. A referred customer's actual paid **Pro**
invoices earn 4,000 basis points (40%) by default, for life. Organic customers earn
zero. Standard subscriptions do not earn commission in this account referral flow.
The existing Pro checkout availability gate is preserved; this work does not turn
on a plan that is currently marked coming soon.

## Configuration and rollout prerequisites

Apply `nurevo-impl/db/0035_referral_ledger.sql` to the **DB / nurevo-db** binding
after migrations through 0034. It is not a WEBMCP_DB migration. The user authorized the production rollout on 2026-10-20.

- `REFERRAL_RATE_BP`: integer 0–10000, default 4000. Invalid settings fail closed.
- `REFERRAL_DURATION_MONTHS`: positive integer, blank/unset means lifetime from
  customer account creation. Calculated by UTC calendar months.
- `REFERRAL_TOKEN_SECRET`: a separate secret with at least 32 random characters.
  Missing configuration blocks referral credential generation. Rotation invalidates
  outstanding signed credentials. Never put its value in source control or logs.
- `REFERRAL_LEDGER_ENABLED=1`: opt in to monthly reconciliation using the existing
  daily trigger on UTC day 1. Default is off. No additional production cron is set.
- Existing `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_PRO`, `RESEND_API_KEY`, `MAIL_FROM`.
  No prices, products or Stripe webhook registration are created or updated.

The copy catalogue is `public/dashboard-referral-copy.mjs`. Its eight locales
are ja, en, zh, zh-tw, ko, es, fr, de (dashboard `tw` maps to zh-tw).
Email masters are in `worker/referral-email-copy.mjs`: EN/JA use the supplied
2026-10-20 master; zh/zh-tw/ko/es/fr/de are machine translations pending Hashimoto
review. Share accepts optional `partner_name` and `client_name` (email fallback).
The postal address matches the published terms. Signed unsubscribe links show a
confirmation form; POST suppresses future shared reports for that email. Essential
login/verification emails remain available.

## Product flow

1. Sign in using the existing signup/email flow. In the Partner dashboard, register
   to get a unique referral code. Code regeneration preserves established referrals
   and existing pending invitations.
2. Select a site visible to the partner and enter the customer email. Share uses
   that site's latest stored AEO report. A report must exist; run a diagnosis first
   if necessary. Only public report findings are shared, not private billing data.
3. The initial email includes the report and a signed, 15-minute invitation URL
   with the ref code. Its landing page asks for the destination email without
   revealing that address or report to an unauthenticated visitor.
4. A matching email receives a fresh signed verification credential, with a
   maximum lifetime of 15 minutes and no later than invitation expiry. A wrong
   email receives the same confirmation screen without sending a credential.
5. Redemption atomically marks the invite used, creates and logs in the customer,
   and displays a localized welcome/report. Existing customers log in with their
   existing referral unchanged. Self referrals are rejected. The generic signup
   route also defers referral attribution until email verification.

All referral credentials use HMAC-SHA256, purpose binding, expiry, hashed storage,
and atomic consumption. API rate limits apply per IP, invitation, partner and
existing signup email. The form endpoint relies on its signed invitation rather
than an authenticated CSRF cookie. Authenticated mutations retain CSRF checks.

Language preference is stored site `detected_language` → partner language setting
(or registration locale) → English. New diagnosis scans extract the HTML `lang`
attribute into `sites.detected_language`; old reports without detected language
use the fallback until their next scan. Recipient-supplied language does not
change an existing invitation's locale. Report findings reuse the existing eight
language AEO wording catalogue.

Checkout adds `referred_by` to session and subscription metadata using the **site
owner's** account attribution, never caller-supplied attribution. Organic checkout
omits it. An authenticated super-admin may POST `/api/admin/referral-metadata`
to backfill existing subscription metadata. This endpoint changes metadata only;
it never changes a price, product, amount or webhook. Only metadata updates and invoice reads are authorized for this rollout. Legacy Connect onboarding and automatic invoice-paid
transfers are retired in this local code; payouts are manual.

## Monthly ledger and export

Super-admin endpoints (ordinary org admins cannot access them):

- POST `/api/admin/referral-ledger` with `{"period":"2026-09"}`: reconcile a closed
  UTC calendar month. The default is the preceding UTC month.
- GET `/api/admin/referral-ledger?period=2026-09`: JSON summary and invoice evidence.
- GET `/api/admin/referral-ledger?period=2026-09&format=wise-csv`: one row per
  partner/currency, including period, customers, invoice IDs and decimal payout.
- GET `/api/admin/referral-ledger?period=2026-09&format=csv`: invoice-level audit
  CSV with partner, currency, period, customer, subscription, invoice, paid time,
  actual paid minor units, rate, payout minor units and payment/charge evidence.
- GET `/api/partner/ledger?period=2026-09`: partner sees only their own lines.

This is a Wise handoff ledger, **not** a bank transfer instruction or a guaranteed
Wise batch-upload template. Bank recipient details and destination exchange/fees
are not invented. Currency amounts stay separate. The decimal summary uses
Stripe charge minor units, including ISK/UGX compatibility rules.

Reconciliation reads all paginated paid invoices for uniquely owned referred
subscriptions. Eligibility depends on **paid_at**, not invoice creation time or
the customer's current plan. A former Pro customer can still earn on a historical
paid Pro invoice. Full invoice line pagination is read. Only configured Pro-price
lines qualify. Mixed Pro/non-Pro invoices stop the run for operator review.

Actual cash is reconciled against paginated invoice payments and succeeded
PaymentIntents/Charges, matching invoice customer and currency. Unpaid, zero,
out-of-band, credit-note, refunded (including partial refund) and disputed invoices
do not qualify. Unknown payment types or missing evidence fail the run, rather
than silently creating a payable zero. PaymentIntent, charge and invoice-payment
reads must be permitted on the restricted Stripe key.

Commission is floored **per invoice** in Stripe minor units using integer
arithmetic; grouped totals sum those lines. No guessed list-price earnings or
estimated active-subscription payouts appear in the partner view. Actual manual
disbursements are not represented as paid by this implementation.

Each run is an immutable snapshot with a config snapshot, run ID and status.
Reruns do not append to an older payable total; exports select only the most
recent run for the month, and a failed latest run blocks export of stale results.
Do not add together different run IDs for the same month. Rates apply from the
configuration of the selected run; changing them and rerunning intentionally
recalculates that month's draft ledger. Before a manual Wise payment, run a fresh
reconciliation and check the run ID to account for refunds since the previous
snapshot. Refunds after an actual manual payout need operator adjustment outside
this calculation-only ledger. No payment is initiated by the job or export.

The list reader fails if a result exceeds 100 pages. A failed run is not payable;
review the cause and retry. Long histories/large customer counts may require a
queued job in a later scale-up, rather than increasing this bound silently.

## Validation

- `npm run test:referral`: real in-memory SQLite and mocked Stripe/mail; referral
  security, immutable attribution, locale fallback, Pro invoice calculations,
  currencies, duration/rate changes, refunds, failed evidence, snapshot reruns,
  export authorization.
- `npm run test:partner`: authentication plus Chrome UI regression across 8 locales.
- `npm run test:billing`, `npm run test:aeo-score`: existing regression suites.
- `wrangler deploy --dry-run`: packaging only; no deployment.

References: [Stripe invoice payments](https://docs.stripe.com/api/invoice-payment/list),
[Stripe currency units](https://docs.stripe.com/currencies),
[D1 batch transactions](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch).
