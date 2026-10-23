CREATE TABLE IF NOT EXISTS aeo_scores (
  site_id TEXT NOT NULL,
  scanned_at TEXT NOT NULL,
  host TEXT,
  score INTEGER,
  verdict TEXT,
  checks_json TEXT,
  ruleset_version INTEGER,
  PRIMARY KEY (site_id, scanned_at)
);

CREATE INDEX IF NOT EXISTS idx_aeo_scores_site_scanned_at
  ON aeo_scores(site_id, scanned_at);
