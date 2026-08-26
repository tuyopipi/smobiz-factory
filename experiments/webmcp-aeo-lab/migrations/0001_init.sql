CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  host TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forms (
  form_hash TEXT PRIMARY KEY,
  site_id INTEGER,
  form_id TEXT,
  structure_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id)
);

CREATE TABLE IF NOT EXISTS footprints (
  id TEXT PRIMARY KEY,
  site_id INTEGER,
  form_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  completed_step INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  experiment_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (form_hash) REFERENCES forms(form_hash)
);

CREATE TABLE IF NOT EXISTS footprint_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  footprint_id TEXT NOT NULL,
  selector TEXT NOT NULL,
  key TEXT NOT NULL,
  type TEXT NOT NULL,
  error_text TEXT,
  validity_json TEXT,
  timestamp_offset_ms INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (footprint_id) REFERENCES footprints(id)
);

CREATE TABLE IF NOT EXISTS ab_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER,
  form_hash TEXT,
  type TEXT NOT NULL,
  experiment_name TEXT,
  variant TEXT,
  experiment_json TEXT,
  result_status TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (site_id) REFERENCES sites(id)
);

CREATE INDEX IF NOT EXISTS idx_footprints_site_created ON footprints(site_id, created_at);
CREATE INDEX IF NOT EXISTS idx_footprints_form ON footprints(form_hash);
CREATE INDEX IF NOT EXISTS idx_footprint_events_selector ON footprint_events(selector);
CREATE INDEX IF NOT EXISTS idx_ab_events_site_experiment ON ab_events(site_id, experiment_name, variant);
