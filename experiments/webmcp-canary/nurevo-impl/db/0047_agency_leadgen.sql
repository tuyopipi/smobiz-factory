-- Agency lead-generation tools (worker/agency-leadgen.mjs).
-- Additive: two new tables, nothing existing changes.
--
--   agency_leadgen  one row per account (accounts.id, an approved partner):
--                   the public widget key (wk_..., rotatable, NOT the referral
--                   code), whether the "Is your business visible to AI?"
--                   widget is on, the origins allowed to embed it
--                   (frame-ancestors), whether each new lead is emailed to the
--                   agency, and the referral landing page /p/<slug> (address,
--                   on/off, noindex, the agency's own intro text), the
--                   agency's privacy-policy URL (named in the widget's consent
--                   text; the widget cannot be switched on without it), and
--                   the verified contact address new-lead emails may go to.
--   agency_leads    the leads the widget collected for that account: site URL,
--                   name, email, the on-site AEO score, when, and the exact
--                   consent text the visitor agreed to. The agency is the
--                   controller; Nurevo processes them on its behalf.
--
-- Until this is applied the Partner page hides the cards, the widget and the
-- landing pages answer 404 and the submit answers 503; nothing fails.
CREATE TABLE IF NOT EXISTS agency_leadgen (
  account_id INTEGER PRIMARY KEY,             -- accounts.id
  widget_key TEXT NOT NULL UNIQUE,            -- wk_ + 24 [a-z0-9]; public, rotatable
  widget_enabled INTEGER NOT NULL DEFAULT 0,
  allowed_origins_json TEXT NOT NULL DEFAULT '[]', -- ["https://www.agency.example", ...], at most 10
  notify_email INTEGER NOT NULL DEFAULT 0,
  slug TEXT UNIQUE,                           -- lower-case [a-z0-9-], 3-40, reserved words refused
  landing_enabled INTEGER NOT NULL DEFAULT 0,
  landing_noindex INTEGER NOT NULL DEFAULT 0, -- 0 = indexed (the default)
  landing_intro TEXT,                         -- plain text, at most 500 characters
  privacy_url TEXT,                           -- the agency's privacy policy (https); required to enable the widget
  contact_verified_email TEXT,                -- the branding contact email once verified by a signed link (lead emails go there only then)
  contact_verified_at INTEGER,
  contact_verify_sent_at INTEGER,             -- the last verification email
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by TEXT                             -- members.id
);

CREATE TABLE IF NOT EXISTS agency_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,                -- the agency (accounts.id) the lead belongs to
  widget_key TEXT,                            -- the key it came through (history; keys rotate)
  source TEXT NOT NULL DEFAULT 'widget' CHECK (source IN ('widget', 'landing')),
  page_origin TEXT,                           -- the embedding page's origin, when the browser sent it
  site_url TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  score INTEGER,                              -- the on-site AEO score, NULL when it could not be checked
  band TEXT,                                  -- green | yellow | red
  locale TEXT,                                -- the widget language (ja en zh tw ko es fr de)
  consent_text TEXT NOT NULL,                 -- exactly what the visitor agreed to
  consent_at INTEGER NOT NULL,                -- epoch ms
  created_at INTEGER NOT NULL,
  notified_at INTEGER                         -- when the agency was emailed, if it asked to be
);
CREATE INDEX IF NOT EXISTS idx_agency_leads_account ON agency_leads(account_id, id DESC);
