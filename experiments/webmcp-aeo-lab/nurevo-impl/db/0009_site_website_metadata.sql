-- Additive metadata for server-side install recommendation.
ALTER TABLE sites ADD COLUMN website_uri TEXT;
ALTER TABLE sites ADD COLUMN website_fingerprint TEXT;
ALTER TABLE sites ADD COLUMN recommended_install_type TEXT;
