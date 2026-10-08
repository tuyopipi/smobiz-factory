-- The first criteria advance that actually changes anything.
--
-- Until now "always current" moved a version number and nothing else. v2 - the
-- learning job's candidate - reordered schema.recommended and attached its own
-- evidence; both are read only by the learning job, so activating it would have
-- delivered identical JSON-LD under a higher version label. A paid tier whose
-- only difference is a bigger number is worse than no paid tier.
--
-- v3 is the same ruleset plus three schema.org improvements the service already
-- has the data for and has never published, and a statement of what a
-- diagnosis scores against.
--
-- There are two publishers of schema here and they had grown different gaps.
-- The WordPress plugin builds its own @graph from local data; the worker builds
-- one for hosted pages and for the tag. Neither published the full set:
--
--   description, email - real LocalBusiness properties. The worker stores both
--   and emitted neither, so a hosted store could not answer "what kind of place
--   is this" or "how do I contact them" beyond a phone number. The plugin
--   already emitted both, which is exactly why they alone would not be an
--   advance for a plugin site - hence the third.
--
--   a structured address - schema.org documents PostalAddress as the form for
--   an address, and the worker already emits one. The plugin emitted the
--   address as a bare string, which an engine has to parse out of prose rather
--   than read. This is the plugin's real gap and the most valuable of the
--   three: a machine-readable street address is the difference between being
--   placeable and being guessed at.
--
-- Everything here is a real property backed by data the operator already typed
-- in. Nothing is invented to manufacture a difference - a field with no data
-- behind it would publish an empty property and earn a site nothing.
--
-- scoredProps is the other half, and it is why this works. Nine properties,
-- and every site is measured against all nine whatever it pays. A baseline
-- install keeps emitting exactly what it emits today and now reaches seven of
-- nine; one that follows the criteria reaches eight or nine. Seven of nine is
-- 0.778, one band below OK on the schema component - a real, visible gap that
-- is not a cliff for someone who installed the plugin yesterday, and which
-- widens on its own as later rulesets add more.
--
-- Deliberately symmetric: under v3 a free site is one band down on either
-- publisher, rather than the penalty landing only on whichever path happened
-- to have the gap.
--
-- Reversible: activation is a single UPDATE, and v1 is left in place.

INSERT OR REPLACE INTO aeo_rulesets (version, created_at, definition_json, active, notes)
VALUES (
  3,
  '2026-10-08T09:00:00.000Z',
  json('{
    "schema": {
      "context": "https://schema.org",
      "type": "LocalBusiness",
      "required": ["@context", "@type", "name"],
      "recommended": [
        "url", "additionalType", "address", "telephone", "openingHours",
        "openingHoursSpecification", "geo", "priceRange", "image",
        "potentialAction", "description", "email", "postalAddress"
      ],
      "fields": {
        "url": true, "additionalType": true, "address": true, "telephone": true,
        "openingHours": true, "openingHoursSpecification": true, "geo": true,
        "priceRange": true, "image": true, "potentialAction": true,
        "description": true, "email": true,
        "postalAddress": true
      },
      "hostedFields": [
        "url", "address", "openingHoursSpecification", "geo", "telephone",
        "priceRange", "openingHours", "description", "email"
      ],
      "scoredProps": [
        "name", "url", "address", "streetAddress", "telephone",
        "openingHours", "geo", "description", "email"
      ],
      "priceLevelMap": {
        "PRICE_LEVEL_FREE": "Free",
        "PRICE_LEVEL_INEXPENSIVE": "¥",
        "PRICE_LEVEL_MODERATE": "¥¥",
        "PRICE_LEVEL_EXPENSIVE": "¥¥¥",
        "PRICE_LEVEL_VERY_EXPENSIVE": "¥¥¥¥"
      },
      "hostedPriceLevelMap": {
        "PRICE_LEVEL_FREE": "¥",
        "PRICE_LEVEL_INEXPENSIVE": "¥",
        "PRICE_LEVEL_MODERATE": "¥¥",
        "PRICE_LEVEL_EXPENSIVE": "¥¥¥",
        "PRICE_LEVEL_VERY_EXPENSIVE": "¥¥¥"
      }
    },
    "llmsTxt": {
      "format": "markdown",
      "sections": ["identity", "store_information", "supported_ai_crawlers"]
    },
    "robots": {
      "defaultAllow": true,
      "aiCrawlerIds": [
        "gptbot", "oai-search", "chatgpt-user", "claudebot", "perplexity",
        "google-ext", "applebot-ext", "bytespider"
      ]
    },
    "defaults": {
      "schemaType": "LocalBusiness",
      "nameSource": "settings.name_or_site.url",
      "hostedBaseUrl": "https://nurevo.jp/s/"
    }
  }'),
  0,
  'Adds description, email and a structured PostalAddress, and states the scored property set at nine. First ruleset whose activation changes published output.'
);

-- Activate it, and leave a record of the move. Exactly one ruleset is active.
UPDATE aeo_rulesets SET active = 0 WHERE active = 1;
UPDATE aeo_rulesets SET active = 1 WHERE version = 3;

INSERT OR IGNORE INTO aeo_ruleset_activations (id, ruleset_version, activated_at, activated_by, notes)
VALUES (
  'act_0026_v3',
  3,
  '2026-10-08T09:00:00.000Z',
  'migration:0026',
  'First advance that changes published output: description and email on the worker, a structured PostalAddress in the plugin, nine scored properties for everyone.'
);
