-- Agency white-label monthly client report (worker/agency-report.mjs).
-- Additive: seven new tables, nothing existing changes.
--
--   agency_branding         one row per account (accounts.id): the agency's
--                           display name, logo (an https URL, or a small
--                           PNG/JPEG/WebP/GIF upload kept as base64 and served
--                           from /api/agency/logo/<logo_hash>), brand colour,
--                           contact email (the report's Reply-To), contact URL
--                           and footer text.
--   agency_report_settings  one row per site: whether the monthly report is
--                           sent (off by default), to whom (up to 5 addresses),
--                           in which dashboard locale, under whose brand, and
--                           when / by whom the agency confirmed the recipients
--                           agreed to receive it.
--   agency_report_sends     the send ledger: one row per site, month and
--                           recipient, claimed BEFORE the email is sent, so a
--                           repeated cron run never resends; email='*' marks a
--                           site whose month is finished.
--   agency_report_opt_outs  recipients who unsubscribed, per site.
--   agency_report_recipients double opt-in: each address confirms with a
--                           signed, expiring link before any report is sent.
--   agency_report_suppressions addresses that unsubscribed from all reports
--                           sent through Nurevo (global; kept on site delete).
--   agency_report_counters  confirmation emails per site/account per day and
--                           report emails per account per month.
--
-- A report is only sent for a connected site that is on a paid plan or set
-- up by an approved partner (agency-report.mjs reportEligibility).
--
-- Until this is applied the dashboard hides the branding and report cards and
-- the hourly cron reports "migration_pending"; nothing fails.
CREATE TABLE IF NOT EXISTS agency_branding (
  account_id INTEGER PRIMARY KEY,           -- accounts.id
  display_name TEXT NOT NULL,
  logo_url TEXT,                            -- https only
  logo_type TEXT,                           -- image/png | image/jpeg | image/webp | image/gif (sniffed)
  logo_data TEXT,                           -- base64, at most 64 KB decoded
  logo_hash TEXT,                           -- sha256 prefix of the bytes; the public logo URL
  brand_color TEXT,                         -- #rrggbb
  contact_email TEXT,
  contact_url TEXT,                         -- https only
  footer_text TEXT,                         -- plain text, at most 300 characters
  hide_powered_by INTEGER NOT NULL DEFAULT 0, -- honoured only on POWERED_BY_REMOVABLE_PLANS
  updated_at INTEGER NOT NULL,
  updated_by TEXT                           -- members.id
);
CREATE INDEX IF NOT EXISTS idx_agency_branding_logo ON agency_branding(logo_hash);

CREATE TABLE IF NOT EXISTS agency_report_settings (
  site_id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 0,
  recipients_json TEXT NOT NULL DEFAULT '[]',
  locale TEXT NOT NULL DEFAULT 'en',        -- a dashboard locale code
  branding_source TEXT NOT NULL DEFAULT 'agency' CHECK (branding_source IN ('agency', 'nurevo')),
  brand_account_id INTEGER,                 -- the account whose brand is used (re-checked at send time)
  account_id INTEGER,                       -- the account that set the report up: its eligibility and monthly email cap
  consent_at INTEGER,                       -- epoch ms the agency confirmed recipient consent
  consent_by TEXT,                          -- members.id
  updated_at INTEGER NOT NULL,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS agency_report_sends (
  site_id TEXT NOT NULL,
  month TEXT NOT NULL,                      -- YYYY-MM (UTC), the month reported on
  email TEXT NOT NULL,                      -- recipient, or '*' for "site finished"
  status TEXT NOT NULL DEFAULT 'claimed',   -- claimed | sent | failed | suppressed | done
  detail TEXT,
  created_at INTEGER NOT NULL,
  sent_at INTEGER,
  PRIMARY KEY (site_id, month, email)
);

CREATE TABLE IF NOT EXISTS agency_report_opt_outs (
  site_id TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (site_id, email)
);

-- Double opt-in: a recipient gets reports only once the address itself
-- confirmed (a signed, expiring link in a confirmation email).
CREATE TABLE IF NOT EXISTS agency_report_recipients (
  site_id TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | confirmed
  requested_at INTEGER,                     -- epoch ms the last confirmation email went out (NULL: not sent yet)
  requested_by TEXT,                        -- members.id
  confirm_expires_at INTEGER,               -- the confirmation link stops working after this
  confirmed_at INTEGER,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (site_id, email)
);

-- Addresses that unsubscribed from ALL reports sent through Nurevo, whatever
-- the site or agency. Kept when a site is deleted.
CREATE TABLE IF NOT EXISTS agency_report_suppressions (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  source TEXT,                              -- unsubscribe | confirm_decline
  created_at INTEGER NOT NULL
);

-- Small counters with a period: confirmation emails per site and per account
-- per day, report emails per account per month. Taken with one conditional
-- UPDATE, so concurrent requests cannot pass a cap.
CREATE TABLE IF NOT EXISTS agency_report_counters (
  scope TEXT NOT NULL,                      -- confirm:site:<id> | confirm:acct:<id> | emails:acct:<id>
  period TEXT NOT NULL,                     -- YYYY-MM-DD or YYYY-MM (UTC)
  count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER,
  PRIMARY KEY (scope, period)
);
