# Transactional email audit (2026-10-13)

## Before the change

| Category | Implementation | Language before change |
|---|---|---|
| Member login / first account login | worker/api.mjs handleMagicRequest → Resend | Japanese subject, text and HTML hardcoded |
| Legacy site-key dashboard login | worker/index.mjs handleAuthRequest → Resend | English subject, text and HTML hardcoded; current /api/auth/request is handled by handleApi first |
| Partner/member registration confirmation | POST /api/members/register stores a pending member | No email delivery implemented |
| Member invitations | POST /api/members/invites returns invite URL | No email delivery implemented |
| Approval | POST /api/members/:id/approve updates status | No email delivery implemented |
| Subscription/payment notifications | Billing routes/webhook update records or return Stripe URLs | No Nurevo email delivery implemented; Stripe-managed receipts/settings are outside this source audit |
| Pairing/unbinding notifications | Pairing endpoints return JSON and update records | No email delivery implemented |
| Monthly AEO report | aeo-report.mjs renders HTML/text for API/download | No email delivery implemented |

Search covered worker source and other experiment send-provider calls. webmcp-aeo-lab is a separate old experiment, not the canary deployment target; its templates were not changed.

## Change

Shared email-i18n.mjs templates cover ja/en/zh/zh-tw/ko/es/fr/de. `tw`, regional language tags and zh-Hant map to canonical email locales. Subject, plain text and HTML are translated, with HTML escaping and a 15-minute expiry notice.

Selection order: saved account language → stored registration locale → Accept-Language (quality ordering) → English. Unauthenticated login locale never overrides an existing account preference. Register/partner forms submit their current locale; the first automatic account creation stores its locale atomically. Existing members with no stored locale use Accept-Language until they select a dashboard language.

Dashboard language changes save through POST /api/me/language, authenticated to the current member and protected by the existing CSRF check. GET /api/me returns the saved account language for subsequent dashboard visits. No billing or secret changes.

## Release prerequisite

Apply nurevo-impl/db/0029_member_email_preferences.sql BEFORE deploying this Worker version. The change intentionally requires the new table (no silent database-error fallback). Production migration and deployment were not performed as part of this source change.

## Validation

- scripts/test-email-i18n.mjs: all eight templates, locale aliases, precedence, Accept-Language quality, unknown fallback, HTML escaping; en/ko POST /api/auth/request sends correctly localized subject/text/HTML to a mocked Resend endpoint.
- scripts/test-member-registration.mjs: pending registration and locale are batched atomically.
- scripts/test-register-form.mjs: locale submission and identical Worker/Pages registration form copies.
- Worker/JS syntax checks and git diff --check.

These checks do not prove real inbox delivery. Live en/ko delivery and inbox inspection require a designated recipient and a test mail environment; no production secrets were read or changed, and no real email was sent during the mock tests.

## Local release verification (2026-10-13)

Live delivery is intentionally skipped. Local checks passed for exact subjects and introductory text/HTML in all eight locales, and mocked provider requests exercise account language, registration locale, quality-ranked Accept-Language, and English fallback. Registration tests, Worker syntax checks, diff checks, and the Wrangler deployment dry run passed.

```text
en: subject=Sign in to Nurevo
en: text=Open the following link to sign in to Nurevo.
ko: subject=Nurevo 로그인 링크
ko: text=Nurevo에 로그인하려면 아래 링크를 열어 주세요.
```

The production baseline was commit 3b1a9c8 (Worker version 4489d9f3-397e-4ed1-98e2-3eb54323adc9). The email-preferences table was absent during the read-only prerequisite check; release requires only migration 0029 before deployment. No billing changes or production-secret operations are part of this release.
