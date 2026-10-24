-- Agency white-label monthly client report (worker/agency-report.mjs).
-- Additive: four new tables, nothing existing changes.
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
