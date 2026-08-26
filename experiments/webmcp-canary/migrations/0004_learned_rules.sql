CREATE TABLE IF NOT EXISTS learned_rules (
  rule_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active',
  scope_signature TEXT NOT NULL,
  field_signature TEXT NOT NULL,
  field_key TEXT,
  field_selector TEXT,
  field_type TEXT,
  rule_kind TEXT NOT NULL,
  pattern TEXT,
  autofill_json TEXT NOT NULL,
  reason TEXT NOT NULL,
  sample_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  support_rate REAL NOT NULL DEFAULT 0,
  confidence REAL NOT NULL DEFAULT 0,
  source_form_hashes_json TEXT NOT NULL DEFAULT '[]',
  source_site_count INTEGER NOT NULL DEFAULT 0,
  applied_count INTEGER NOT NULL DEFAULT 0,
  pre_success_rate REAL,
  post_success_rate REAL,
  lift_points REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  disabled_at TEXT,
  disabled_reason TEXT
);

CREATE TABLE IF NOT EXISTS learned_rule_runs (
  run_id TEXT PRIMARY KEY,
  trigger TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  analyzed_footprints INTEGER NOT NULL DEFAULT 0,
  candidates INTEGER NOT NULL DEFAULT 0,
  inserted INTEGER NOT NULL DEFAULT 0,
  updated INTEGER NOT NULL DEFAULT 0,
  disabled INTEGER NOT NULL DEFAULT 0,
  skipped_low_sample INTEGER NOT NULL DEFAULT 0,
  notes_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS learned_rule_disable_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_id TEXT NOT NULL,
  disabled_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  pre_success_rate REAL,
  post_success_rate REAL,
  lift_points REAL
);

CREATE TABLE IF NOT EXISTS learned_rule_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_id TEXT NOT NULL,
  site_host TEXT,
  form_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE footprints ADD COLUMN learned_rule_ids_json TEXT NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_learned_rules_status ON learned_rules(status);
CREATE INDEX IF NOT EXISTS idx_learned_rules_field_signature ON learned_rules(field_signature);
CREATE INDEX IF NOT EXISTS idx_learned_rule_applications_rule ON learned_rule_applications(rule_id);
