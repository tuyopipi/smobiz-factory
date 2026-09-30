-- P2: bind stores to the member that created/owns them.
ALTER TABLE sites ADD COLUMN owner_member_id TEXT;
CREATE INDEX IF NOT EXISTS idx_sites_owner_member ON sites(owner_member_id);
