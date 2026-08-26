CREATE TABLE IF NOT EXISTS site_keys (
  site_key TEXT PRIMARY KEY,
  site_url TEXT NOT NULL,
  site_host TEXT NOT NULL,
  email_masked TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_site_keys_host ON site_keys(site_host);
CREATE INDEX IF NOT EXISTS idx_site_keys_status ON site_keys(status);
