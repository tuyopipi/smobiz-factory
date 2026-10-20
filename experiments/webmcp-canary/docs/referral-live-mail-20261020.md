# Live referral mail acceptance — 2026-10-20

Production Worker remains `43d04cf5-2566-436b-b04a-0d3c87c80afb` (100%).
No Worker deployment, Stripe change, price/product/webhook change, or enabling
Pro checkout was performed during this verification.

## Provider configuration

Production secret-name inspection confirmed `RESEND_API_KEY` and `MAIL_FROM`,
both `secret_text`. Current login and share implementations both call the
Resend Emails API. Secret values were not read or printed.

At 2026-10-20T04:49:48Z, POST /api/auth/signup for the user-authorized partner
`tsuyoshi.hashimoto@nurevo.jp` returned HTTP 200 and `ok:true`. This endpoint
only succeeds after the Resend send request succeeds, and deletes its credential
if sending fails. Thus live provider acceptance was confirmed; inbox delivery
has not yet been confirmed. No key setup is currently required.

A subsequent read-only D1 check found one unused, unexpired auth credential for
the partner. Its expiry is approximately 2026-10-20 14:04 JST. Neither the token
nor a session cookie was included in logs or this report.

## Existing customer constraint

Before starting, the specified customer `kaotakeyuutuyo@yahoo.co.jp` already had
an active admin member/account, with `referred_by_account_id=NULL`.
The partner did not exist before this signup request.

The invitation flow intentionally preserves existing customers' attribution.
This address can therefore verify existing-customer mailbox login and preserved
organic attribution, but cannot establish a new referred customer. No existing
account or referral has been overwritten or deleted to force a passing test.
A separate, unused, receivable address is required for the new-customer branch.
The user has been asked to supply one or choose the existing-customer check.

## Pending mailbox steps

There is no connected inbox tool in this session. The user was asked to save the
unconsumed partner login URL in `/private/tmp/nurevo-partner-login-link.txt`.
A temporary phase runner is prepared in `/private/tmp/nurevo-referral-mail-e2e.mjs`.
It checks origin/path, keeps sessions in a mode-0600 local file, and prints only
nonsecret checkpoint results. It does not read server secrets or bypass mailbox
verification. It has passed a syntax check but has not run an authenticated phase.

Next phases after receiving the link: redeem and check single use; register the
partner; create a partner-owned free test site using the operator's public
nurevo.jp website and a real diagnostic report; share to the designated customer;
request and redeem customer verification; read referred_by from D1. The share
and customer verification emails have NOT yet been sent.

## Ledger acceptance meaning

Wise summary and invoice audit CSVs include eligible actual paid Pro invoices,
not every free signup. There were zero referred accounts/eligible subscriptions
at the preceding release dry-run. A new free signup alone cannot correctly
produce a payout row. Stripe and Pro will remain dormant; no test purchase,
refund, fabricated invoice or invented commission will be used to create a row.

After mailbox authentication, a super-admin session can reconcile the closed
2026-09 month and download the actual production draft CSV. A newly registered
October customer with no paid invoice will correctly remain absent from the
September payout CSV. If useful, registration/referral evidence can be exported
separately from payout evidence. No production reconciliation or authenticated
CSV download has yet been performed in this follow-up.

The full end-to-end acceptance criterion remains incomplete pending mailbox
access and resolution of the existing-customer address constraint.
