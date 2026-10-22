-- Withdraw business emails the WordPress plugin autofilled from admin_email.
--
-- Plugin <= 0.7.3 prefilled business_email with get_option('admin_email') and
-- synced it up through PUT /api/sites/{id}/profile, so the service published a
-- private login address as the shop's contact email (JSON-LD email /
-- contactPoint, hosted pages, llms.txt). Plugin 0.7.4 stops doing that and
-- withdraws it locally; this clears the copy the service still holds.
--
-- Provenance: site_settings.field_sources (0019) records who last moved each
-- field. PUT /api/sites/{id}/profile is the only writer that stamps
-- "wordpress"; the dashboard stamps "dashboard", and no automated writer
-- (places/autofill/geocoder) produces an email. So
-- field_sources.email.source = 'wordpress' means "this email arrived from the
-- plugin", but it cannot tell autofill from a value the owner typed into
-- wp-admin. To stay conservative the row is cleared only when that plugin-sourced
-- email is also an account address of the site's owners:
--
--   * the email of any member of the org that owns the site, or
--   * the email of the site's owner member (sites.owner_member_id),
--
-- compared trimmed and case-insensitively. The WordPress admin email is
-- normally the same address the owner signed up with, while a real shop
-- contact address (info@shop...) typed by the owner is left alone. A value the
-- owner set from the dashboard is never touched, whatever it is.
--
-- The email's provenance entry is removed too (the field is now unowned), and
-- updated_at moves so syncing clients see that the record changed. Re-running
-- is harmless: a cleared row no longer matches.
--
-- A pushed "" never re-fills or re-clears the value (mergeProfile treats ""
-- as "not filled in"), so plugin 0.7.4, which sends an empty email, cannot
-- bring it back. A plugin still on <= 0.7.3 can, on its next save; that is
-- fixed by upgrading the plugin, not here.
--
-- Review before applying remotely (report only, no change):
--   SELECT ss.site_id, ss.email, json_extract(ss.field_sources,'$.email.source') AS src
--     FROM site_settings ss JOIN sites s ON s.id = ss.site_id
--    WHERE <the same WHERE clause as below>;

UPDATE site_settings
   SET email = NULL,
       field_sources = json_remove(COALESCE(NULLIF(field_sources, ''), '{}'), '$.email'),
       -- Milliseconds, and never behind the stamp it replaces (a worker write
       -- earlier in the same second would otherwise look newer).
       updated_at = MAX(COALESCE(updated_at, 0) + 1,
                        CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))
 WHERE email IS NOT NULL
   AND trim(email) <> ''
   AND json_valid(field_sources)
   AND json_extract(field_sources, '$.email.source') = 'wordpress'
   AND EXISTS (
         SELECT 1
           FROM sites s
           JOIN members m
             ON m.org_id = s.org_id
             OR m.id = s.owner_member_id
          WHERE s.id = site_settings.site_id
            AND lower(trim(m.email)) = lower(trim(site_settings.email))
       );
