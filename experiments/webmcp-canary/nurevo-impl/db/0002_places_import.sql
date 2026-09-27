-- T-import: Google Places metadata cache (canary only).
ALTER TABLE sites ADD COLUMN place_id TEXT;
ALTER TABLE sites ADD COLUMN fetched_at INTEGER;
ALTER TABLE site_settings ADD COLUMN price_level TEXT;
CREATE INDEX IF NOT EXISTS idx_sites_places_refresh ON sites(fetched_at, place_id);
