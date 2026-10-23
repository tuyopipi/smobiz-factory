-- U2 AI Share-of-Voice measurement (pro plan). Append-only migration.

-- One row per measurement run. Rates are stored alongside the sample size that
-- produced them so a low-confidence run is never read as a precise rate.
CREATE TABLE IF NOT EXISTS aeo_sov_runs (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  ran_at TEXT NOT NULL,
  status TEXT NOT NULL,                 -- measured | unconfigured
  trigger TEXT NOT NULL,                -- scheduled | manual
  model_version TEXT NOT NULL,
  engines_json TEXT NOT NULL DEFAULT '[]',
  questions_asked INTEGER NOT NULL DEFAULT 0,
  answers_received INTEGER NOT NULL DEFAULT 0,
  queries_used INTEGER NOT NULL DEFAULT 0,
  appearance_rate REAL,                 -- NULL when no answer was received
  citation_rate REAL,
  confidence TEXT,                      -- none | low | medium | normal
  competitors_json TEXT NOT NULL DEFAULT '[]',
  detail_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_aeo_sov_runs_site_ran_at
  ON aeo_sov_runs(site_id, ran_at DESC);

-- One row per question x engine probe. Only an excerpt of the answer is kept;
-- full engine answers are not stored.
CREATE TABLE IF NOT EXISTS aeo_sov_mentions (
  run_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  engine TEXT NOT NULL,
  question TEXT NOT NULL,
  ok INTEGER NOT NULL DEFAULT 1 CHECK (ok IN (0, 1)),
  brand_mentioned INTEGER NOT NULL DEFAULT 0 CHECK (brand_mentioned IN (0, 1)),
  brand_cited INTEGER NOT NULL DEFAULT 0 CHECK (brand_cited IN (0, 1)),
  competitor_hosts_json TEXT NOT NULL DEFAULT '[]',
  answer_excerpt TEXT,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_aeo_sov_mentions_run
  ON aeo_sov_mentions(run_id);
CREATE INDEX IF NOT EXISTS idx_aeo_sov_mentions_site
  ON aeo_sov_mentions(site_id, engine);

-- Monthly engine-call budget per site. The cap is enforced in worker code; this
-- table is the counter it reads and increments.
CREATE TABLE IF NOT EXISTS aeo_sov_usage (
  site_id TEXT NOT NULL,
  month TEXT NOT NULL,                  -- YYYY-MM
  queries_used INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (site_id, month)
);
