-- Privacy-preserving, per-site daily totals for human visits arriving from an
-- AI answer engine. No visitor id, IP address, user agent, or referring URL is
-- stored; the browser sends only the registered site key and canonical engine
-- id, which the Worker resolves to site_id.
CREATE TABLE IF NOT EXISTS ai_referral_daily (
  site_id TEXT NOT NULL,
  date TEXT NOT NULL,
  engine TEXT NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (site_id, date, engine),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_referral_daily_site_date
  ON ai_referral_daily(site_id, date DESC);
