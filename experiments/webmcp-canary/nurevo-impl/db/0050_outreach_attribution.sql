-- Optional measurement, independent of referrals, billing and authorization.
-- No email, URL, IP address, browser identity or message body stored here.
CREATE TABLE IF NOT EXISTS outreach_attribution (
  member_id TEXT PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  outreach_id TEXT NOT NULL CHECK(length(outreach_id)=32 AND outreach_id NOT GLOB '*[^0-9a-f]*'),
  captured_at INTEGER NOT NULL,
  verified_at INTEGER,
  consent_version TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_outreach_attribution_id ON outreach_attribution(outreach_id);
