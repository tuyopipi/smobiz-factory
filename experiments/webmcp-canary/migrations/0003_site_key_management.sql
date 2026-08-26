ALTER TABLE site_keys ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE site_keys ADD COLUMN disabled_at TEXT;
ALTER TABLE site_keys ADD COLUMN replaced_by_site_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_keys_active_host_unique
  ON site_keys(site_host)
  WHERE status = 'active';
