-- Address -> coordinates, looked up once per address (worker/geocoder.mjs).
-- Additive. The site's coordinates themselves stay in site_settings.lat/lng;
-- this only remembers what a provider said about an address, including
-- "too vague" and "not found", so the same address is never paid for twice.
CREATE TABLE IF NOT EXISTS geocode_cache (
  address_key TEXT PRIMARY KEY,     -- sha256 of the normalised address
  address TEXT NOT NULL,            -- the normalised address that was sent
  status TEXT NOT NULL CHECK(status IN ('ok','imprecise','not_found','error')),
  lat REAL,                         -- only for status 'ok'
  lng REAL,
  precision TEXT,                   -- address | street | area
  label TEXT,                       -- the provider's formatted match, for review
  provider TEXT NOT NULL,
  attribution TEXT NOT NULL,        -- data licence attribution (ODbL)
  fetched_at TEXT NOT NULL,
  retry_after INTEGER               -- epoch ms; only for status 'error'
);
