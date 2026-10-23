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
-- Until this is applied the dashboard card reports itself as unavailable and
-- the weekly job skips; nothing fails.
CREATE TABLE IF NOT EXISTS offsite_audits (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  ran_at INTEGER NOT NULL,                  -- epoch ms, worker clock
  trigger TEXT NOT NULL CHECK (trigger IN ('manual', 'scheduled', 'followup')),
  result_json TEXT NOT NULL
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
