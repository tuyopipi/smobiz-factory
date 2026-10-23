-- T-hosted: server-rendered store pages.
ALTER TABLE sites ADD COLUMN slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_slug ON sites(slug);
