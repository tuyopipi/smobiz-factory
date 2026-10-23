-- D "bind-on-license": a license key, redeemed against a domain, is what links a
-- WordPress install to an org's site record.
--
-- Until now the two registries never met. /api/site-key issues a key into
-- site_keys (webmcp-canary), while /api/sites owns the sites table (nurevo-db);
-- the plugin's self-service button produced a site_key but never a sites.id, so
-- nothing that needs a site_id - profile sync, SoV, diagnosis history - could be
-- reached from a self-installed plugin. Binding on the license closes that gap:
-- the license says which org, the domain says which site.
--
-- APPLY IN TWO STEPS. The UNIQUE INDEX at the bottom is the one statement that
-- can fail on existing data, so run the duplicate check first:
--
--   node scripts/check-domain-key-duplicates.mjs   (step 1: must report none)
--   wrangler d1 execute nurevo-db --local --file nurevo-impl/db/0020_license_binding.sql
--
-- Running step 2 with duplicates present aborts mid-migration and leaves the
-- added columns in place but unindexed, which is recoverable but noisy.
--
-- Non-destructive: only ADD COLUMN, UPDATE of newly added columns, and INSERTs
-- guarded by OR IGNORE. No existing column is rewritten.

/* ------------------------------------------------------------------ *
 * licenses: which org a key belongs to, and how many sites it covers
 * ------------------------------------------------------------------ */

-- Which org the redeeming site is attached to. A license with no org cannot be
-- bound: the API answers 409 rather than inventing an org.
ALTER TABLE licenses ADD COLUMN org_id TEXT;

-- How many distinct domains this key may bind at once. 1 is the single-site
-- default; agency keys raise it.
ALTER TABLE licenses ADD COLUMN seats INTEGER NOT NULL DEFAULT 1;

-- Human label for the dashboard, e.g. "Canary standard". Never shown publicly.
ALTER TABLE licenses ADD COLUMN label TEXT;

/* ------------------------------------------------------------------ *
 * sites: the domain a site is claimed under, and the binding itself
 * ------------------------------------------------------------------ */

-- Normalised registrable host, e.g. "example.com". The worker normaliser in
-- worker/domain-key.mjs is the single source of truth for this value; the
-- backfill below reproduces its ASCII behaviour for existing rows.
-- Subdomains are deliberately distinct sites: shop.example.com is not
-- example.com.
ALTER TABLE sites ADD COLUMN domain_key TEXT;

-- sha256 of the license that claimed this site, and when. Storing the hash
-- rather than the key keeps the secret out of the row.
ALTER TABLE sites ADD COLUMN bound_license_hash TEXT;
ALTER TABLE sites ADD COLUMN bound_at INTEGER;

-- sites.profile_token_hash already exists (0019_site_profile_ssot.sql) and is
-- reused as the write credential handed back on a successful bind.

/* ------------------------------------------------------------------ *
 * Backfill domain_key for existing rows
 * ------------------------------------------------------------------ */

-- website_uri is a full URL when present; url is already host-ish. Prefer the
-- explicit one. The nesting below is, from the inside out:
--   coalesce -> strip scheme -> cut at first "/" -> cut at first ":" (port)
--   -> lower -> strip one trailing "." -> strip one leading "www."
-- IDNA is not expressible in SQLite. Every existing canary host is ASCII; a
-- non-ASCII host would be stored as-is here and corrected to punycode by the
-- worker the first time that site binds.
UPDATE sites
   SET domain_key = (
     WITH stripped AS (
       SELECT lower(
         CASE
           WHEN instr(hostport, ':') > 0 THEN substr(hostport, 1, instr(hostport, ':') - 1)
           ELSE hostport
         END
       ) AS host
       FROM (
         SELECT
           CASE
             WHEN instr(noscheme, '/') > 0 THEN substr(noscheme, 1, instr(noscheme, '/') - 1)
             ELSE noscheme
           END AS hostport
         FROM (
           SELECT replace(replace(trim(coalesce(nullif(trim(website_uri), ''), url)), 'https://', ''), 'http://', '') AS noscheme
         )
       )
     ),
     undotted AS (
       SELECT CASE WHEN substr(host, length(host), 1) = '.' THEN substr(host, 1, length(host) - 1) ELSE host END AS host
       FROM stripped
     )
     SELECT CASE WHEN substr(host, 1, 4) = 'www.' THEN substr(host, 5) ELSE host END FROM undotted
   )
 WHERE domain_key IS NULL
   AND coalesce(nullif(trim(website_uri), ''), url) IS NOT NULL
   AND trim(coalesce(nullif(trim(website_uri), ''), url)) <> '';

-- A blank result is worse than no result: it would collide with every other
-- blank under the same org once the unique index exists.
UPDATE sites SET domain_key = NULL WHERE trim(coalesce(domain_key, '')) = '';

/* ------------------------------------------------------------------ *
 * One site per (org, domain)
 * ------------------------------------------------------------------ */

-- SQLite treats NULLs as distinct, so unbound rows with no domain_key do not
-- collide with each other. Run the step 1 check before this statement.
CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_org_domain ON sites(org_id, domain_key);

-- Lookup path for bind: find the license, then the site claimed under it.
CREATE INDEX IF NOT EXISTS idx_sites_bound_license ON sites(bound_license_hash);
CREATE INDEX IF NOT EXISTS idx_licenses_org ON licenses(org_id);

/* ------------------------------------------------------------------ *
 * Canary test fixtures
 * ------------------------------------------------------------------ */

-- The canary org already exists as "org-canary" (it owns the wpdemo site), so
-- it is reused rather than creating a second test org. Created here only if a
-- canary database somehow lacks it.
INSERT OR IGNORE INTO orgs (id, name, plan, created_at)
VALUES ('org-canary', 'Canary Org', 'pro', 1791068400000);

-- Attach the existing canary test licenses to that org and give them seats.
-- The plaintext keys are, as documented in 0017_plans_and_licenses.sql:
--   standard: nrv_canary_standard_3000
--   pro:      nrv_canary_pro_14800
-- Production keys are issued separately and are not seeded here.
UPDATE licenses
   SET org_id = 'org-canary',
       seats = 3,
       label = 'Canary standard'
 WHERE license_hash = 'd4d16d39aa31d15c39703e36cd6da41a5c9f8c49189ba966becbf8c93d134182'
   AND org_id IS NULL;

UPDATE licenses
   SET org_id = 'org-canary',
       seats = 3,
       label = 'Canary pro'
 WHERE license_hash = 'f39ec3a08baa40464de7e07351aae3eb52593e5a5b26f20b2fe2658441ed28d8'
   AND org_id IS NULL;
