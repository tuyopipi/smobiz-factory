-- Off-site listing audit (worker/offsite-audit.mjs). Additive: two new tables.
--
-- What is stored is deliberately narrow, because the listings belong to other
-- services whose terms limit what may be kept:
--   offsite_audits.result_json  our own comparison outcome only - per source a
--                               status, per field match/mismatch/missing, which
--                               weekdays differ (with OUR hours), and listing
--                               ids. Never the listing's name, address, phone
--                               or hours. Those are shown once, in the response
--                               of the run that fetched them.
--   offsite_listing_refs        which listing is this business, per source.
--                               For Google this is the place_id, which the
--                               Google Maps Platform terms allow keeping.
--   offsite_audit_usage         the owner's on-demand allowance, per site and
--                               period, reserved atomically BEFORE any Places
--                               call (UPDATE ... WHERE n < limit), so parallel
--                               requests cannot overspend it; refunded when the
--                               run ended rate_limited / error / skipped.
--   offsite_api_budget          the all-sites daily ceiling on Places calls, one
--                               row per source and UTC day, reserved with one
--                               atomic upsert per call.
-- Until this is applied the dashboard card reports itself as unavailable and
-- the scheduled job skips; nothing fails.
CREATE TABLE IF NOT EXISTS offsite_audits (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  ran_at INTEGER NOT NULL,                  -- epoch ms, worker clock
  trigger TEXT NOT NULL CHECK (trigger IN ('manual', 'scheduled', 'followup')),
  result_json TEXT NOT NULL,
  followup_used INTEGER NOT NULL DEFAULT 0  -- 1 = the free re-run after this (ambiguous) run was taken
);
CREATE INDEX IF NOT EXISTS idx_offsite_audits_site ON offsite_audits(site_id, ran_at);

CREATE TABLE IF NOT EXISTS offsite_listing_refs (
  site_id TEXT NOT NULL,
  source TEXT NOT NULL,                     -- google
  listing_id TEXT NOT NULL,                 -- e.g. Google place_id
  pinned INTEGER NOT NULL DEFAULT 0,        -- 1 = the owner picked it
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (site_id, source)
);

CREATE TABLE IF NOT EXISTS offsite_audit_usage (
  site_id TEXT NOT NULL,
  period TEXT NOT NULL,                     -- 'M2026-10' (Free, JST month) or 'D2026-10-14' (paid, JST day)
  n INTEGER NOT NULL DEFAULT 0,             -- runs counted in the period (refunds subtract)
  last_at INTEGER NOT NULL DEFAULT 0,       -- epoch ms of the latest reservation (spacing)
  PRIMARY KEY (site_id, period)
);

CREATE TABLE IF NOT EXISTS offsite_api_budget (
  source TEXT NOT NULL,                     -- google
  day TEXT NOT NULL,                        -- UTC date, YYYY-MM-DD
  n INTEGER NOT NULL DEFAULT 0,             -- calls reserved that day
  PRIMARY KEY (source, day)
);
