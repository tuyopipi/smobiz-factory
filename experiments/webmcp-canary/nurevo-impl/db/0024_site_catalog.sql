-- What a site actually sells, offers, answers and publishes.
--
-- The plugin already reads all four: WooCommerce products, the hand-entered
-- services and FAQ, and the pages it scans for store facts. None of it ever
-- reached the service, so the dashboard could show an operator their address
-- and phone number and nothing about the shop those belong to - and the
-- measurement could only ask questions about the business in the abstract
-- rather than about the things it sells.
--
-- Four child tables rather than a JSON blob on `sites`, because these are lists
-- that get counted, ordered and - later - measured against. A blob would make
-- "how many products does this site have" a parse rather than a query.
--
-- Rows are replaced wholesale per site on each sync rather than diffed: the
-- plugin is the only writer, it always sends the complete list, and an id that
-- survived across syncs would be an id nothing else references. `position`
-- keeps the order the plugin sent, which is the order the operator arranged.
--
-- Non-destructive: four new tables. Re-runnable, unlike 0020-0023.

/* ------------------------------------------------------------------ *
 * Products
 * ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS site_products (
  site_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  sku TEXT,
  -- Text rather than a number: a price is what the shop displays, and
  -- WooCommerce stores it as a string for the same reason.
  price TEXT,
  currency TEXT,
  -- 1 in stock, 0 out of stock, NULL when the shop does not track it. The three
  -- are different answers and must not collapse into a boolean.
  in_stock INTEGER CHECK (in_stock IS NULL OR in_stock IN (0, 1)),
  categories_json TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (site_id, position)
);

/* ------------------------------------------------------------------ *
 * Bookable services
 * ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS site_services (
  site_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  name TEXT NOT NULL,
  -- Minutes, because that is the unit the operator was asked for. Stated here
  -- so nothing downstream has to guess, which is the mistake that kept the
  -- booking-plugin adapters from being written at all.
  minutes INTEGER,
  price TEXT,
  currency TEXT,
  category TEXT,
  -- The URL the operator entered. Never derived.
  reserve_url TEXT,
  PRIMARY KEY (site_id, position)
);

/* ------------------------------------------------------------------ *
 * Questions and answers
 * ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS site_faqs (
  site_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  PRIMARY KEY (site_id, position)
);

/* ------------------------------------------------------------------ *
 * The pages worth knowing about
 * ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS site_pages (
  site_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  PRIMARY KEY (site_id, position)
);

/* ------------------------------------------------------------------ *
 * Provenance and freshness
 * ------------------------------------------------------------------ */

-- One row per site recording where each list came from and when, mirroring what
-- site_settings.field_sources does for the profile. Kept beside the lists
-- rather than inside them so an empty list is still a measurement: "this shop
-- has no products" and "we have never looked" are different facts.
CREATE TABLE IF NOT EXISTS site_catalog_state (
  site_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  product_source TEXT,
  product_count INTEGER NOT NULL DEFAULT 0,
  service_count INTEGER NOT NULL DEFAULT 0,
  faq_count INTEGER NOT NULL DEFAULT 0,
  page_count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_site_products_site ON site_products(site_id);
CREATE INDEX IF NOT EXISTS idx_site_services_site ON site_services(site_id);
CREATE INDEX IF NOT EXISTS idx_site_faqs_site ON site_faqs(site_id);
CREATE INDEX IF NOT EXISTS idx_site_pages_site ON site_pages(site_id);
