-- U2 store-profile SSOT. Append-only; run once (ALTER TABLE ADD COLUMN is not
-- re-runnable, matching the convention of 0002-0010 in this directory).
--
-- Adds the fields the canonical profile record needs:
--   description / email           - present in WordPress, previously absent here
--   business_type_schema          - schema.org @type, split from the display label
--   updated_at / field_sources    - last-write-wins ordering and per-field provenance
--   sites.profile_token_hash      - per-site write credential (sha256 of the token)

ALTER TABLE site_settings ADD COLUMN description TEXT;
ALTER TABLE site_settings ADD COLUMN email TEXT;
ALTER TABLE site_settings ADD COLUMN business_type_schema TEXT;

-- Milliseconds. Always stamped by the worker from its own clock: a client may
-- not set it, so a wrong or forged client clock cannot win a merge.
ALTER TABLE site_settings ADD COLUMN updated_at INTEGER;

-- JSON: { "<field>": { "source": "wordpress|dashboard|places|autofill",
--                      "updated_at": <ms> } }
-- Drives the Places demotion rule: an automated source may not overwrite a
-- field whose current source is a human one.
ALTER TABLE site_settings ADD COLUMN field_sources TEXT;

-- sha256 of the per-site profile write token. The plaintext is returned once at
-- issuance and never stored. site_key cannot authorise writes: it is printed
-- into public page markup and is therefore a public identifier.
ALTER TABLE sites ADD COLUMN profile_token_hash TEXT;

-- business_type held two different things: a schema.org type when it came from
-- WordPress (e.g. "HairSalon") and a display label when it came from Google
-- Places (e.g. "美容室"). Split them: ASCII-identifier values move to
-- business_type_schema, everything else stays as the label.
--
-- The GLOB pair is the SQLite equivalent of ^[A-Za-z][A-Za-z0-9]*$ and is the
-- same test webmcp_canary_output_server_schema() applies before using the value
-- as an @type.
UPDATE site_settings
   SET business_type_schema = business_type,
       business_type = NULL
 WHERE business_type IS NOT NULL
   AND trim(business_type) <> ''
   AND business_type GLOB '[A-Za-z]*'
   AND business_type NOT GLOB '*[^A-Za-z0-9]*';

-- Existing rows predate provenance tracking. An empty map means "source
-- unknown", which leaves Places free to refresh them exactly as it does today;
-- a field becomes protected the first time a human edits it.
UPDATE site_settings
   SET updated_at = COALESCE(updated_at, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
       field_sources = COALESCE(field_sources, '{}')
 WHERE updated_at IS NULL OR field_sources IS NULL;
