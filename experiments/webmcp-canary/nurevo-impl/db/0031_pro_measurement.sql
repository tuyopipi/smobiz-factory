-- Additive: legacy runs/mentions remain readable.
CREATE TABLE IF NOT EXISTS aeo_sov_query_sets (
  site_id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  config_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS aeo_sov_evidence (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  measured_at TEXT NOT NULL,
  engine TEXT NOT NULL,
  question TEXT NOT NULL,
  sample_index INTEGER NOT NULL,
  ok INTEGER NOT NULL CHECK(ok IN (0,1)),
  answer_summary TEXT,
  citation_urls_json TEXT NOT NULL DEFAULT '[]',
  brand_cited INTEGER NOT NULL CHECK(brand_cited IN (0,1)),
  citation_rank INTEGER,
  accuracy_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_sov_evidence_run ON aeo_sov_evidence(site_id,run_id);
CREATE TABLE IF NOT EXISTS aeo_sov_locks (
  site_id TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
