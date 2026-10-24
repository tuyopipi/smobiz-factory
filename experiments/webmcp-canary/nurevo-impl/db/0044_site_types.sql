-- Site types (docs/industries.md). Additive: new nullable columns only.
--
--   site_settings.site_type    what kind of business the site is:
--                              'local' (the default and everything before this),
--                              'ec' (online shop) or 'b2b' (B2B / SaaS /
--                              professional services). NULL reads as 'local',
--                              so every existing site keeps its behaviour.
--                              Written by the dashboard and by the plugin's
--                              profile sync (a person's choice in both).
--   site_products.brand / image / rating_value / review_count
--                              what WooCommerce actually holds for a product,
--                              so the shop's Product / Offer JSON-LD can carry
--                              it. rating_value and review_count are only
--                              stored when the shop has real reviews; nothing
--                              is published from an empty value.
--   site_services.description / url / kind
--                              what the owner typed for a B2B service: a short
--                              description, its page, and 'service' or
--                              'software' (Service vs SoftwareApplication).
--   site_pages.role            pages the owner pointed at in the settings:
--                              'return_policy', 'shipping_policy', 'pricing',
--                              'case_studies'. NULL for the ordinary page list.
--
-- Until this is applied the worker keeps working: site_type reads as 'local'
-- and a catalogue sync falls back to the columns that exist (api.mjs).
ALTER TABLE site_settings ADD COLUMN site_type TEXT CHECK (site_type IS NULL OR site_type IN ('local', 'ec', 'b2b'));
ALTER TABLE site_products ADD COLUMN brand TEXT;
ALTER TABLE site_products ADD COLUMN image TEXT;
ALTER TABLE site_products ADD COLUMN rating_value TEXT;
ALTER TABLE site_products ADD COLUMN review_count INTEGER;
ALTER TABLE site_services ADD COLUMN description TEXT;
ALTER TABLE site_services ADD COLUMN url TEXT;
ALTER TABLE site_services ADD COLUMN kind TEXT CHECK (kind IS NULL OR kind IN ('service', 'software'));
ALTER TABLE site_pages ADD COLUMN role TEXT;
