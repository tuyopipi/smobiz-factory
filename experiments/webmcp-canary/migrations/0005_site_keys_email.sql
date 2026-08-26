ALTER TABLE site_keys ADD COLUMN email TEXT;

CREATE INDEX IF NOT EXISTS idx_site_keys_email
  ON site_keys(email);
