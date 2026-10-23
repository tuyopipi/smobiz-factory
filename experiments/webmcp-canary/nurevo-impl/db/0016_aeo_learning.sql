CREATE TABLE IF NOT EXISTS aeo_site_recommendations (
  site_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  ruleset_version INTEGER,
  learning_run_id TEXT,
  PRIMARY KEY (site_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_aeo_site_recommendations_status
  ON aeo_site_recommendations(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS aeo_learning_runs (
  id TEXT PRIMARY KEY,
  ran_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  trigger TEXT NOT NULL,
  sites_analyzed INTEGER NOT NULL DEFAULT 0,
  recommendations_created INTEGER NOT NULL DEFAULT 0,
  candidate_version INTEGER,
  mode TEXT NOT NULL,
  summary TEXT NOT NULL,
  input_materials_json TEXT NOT NULL,
  citation_samples_used INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_aeo_learning_runs_ran_at
  ON aeo_learning_runs(ran_at DESC);
