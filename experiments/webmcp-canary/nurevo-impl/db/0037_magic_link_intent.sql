-- Additive. Where a magic link should land after sign-in, and which language
-- its confirmation page speaks.
--
-- The LP sends visitors to /dashboard?plan=standard|pro. A signed-out visitor
-- goes through the magic link, and the callback used to redirect to a bare
-- /dashboard, so the plan they chose was lost. next_path holds the whitelisted
-- landing path (only /dashboard[...]?plan=standard|pro is ever written - see
-- safeAuthNext in worker/api.mjs); NULL means /dashboard.
--
-- locale is the language the link was sent in, so the GET confirmation page
-- (the link no longer signs in on GET, because mail scanners prefetch it)
-- matches the email rather than the scanner's or browser's language.
--
-- Both tables carry a magic credential: sessions (kind='magic', the dashboard
-- /api/auth/request flow) and auth_tokens (/api/auth/signup, /magic-link).
-- The worker falls back to the old column set while this is unapplied, so the
-- code may be deployed before or after this migration.
ALTER TABLE sessions ADD COLUMN next_path TEXT;
ALTER TABLE sessions ADD COLUMN locale TEXT;
ALTER TABLE auth_tokens ADD COLUMN next_path TEXT;
ALTER TABLE auth_tokens ADD COLUMN locale TEXT;
