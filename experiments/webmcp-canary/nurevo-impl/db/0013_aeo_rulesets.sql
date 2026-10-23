CREATE TABLE IF NOT EXISTS aeo_rulesets (
  version INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL,
  definition_json TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_aeo_rulesets_one_active
  ON aeo_rulesets(active) WHERE active = 1;

INSERT OR IGNORE INTO aeo_rulesets (version, created_at, definition_json, active, notes)
VALUES (
  1,
  '2026-09-30T00:00:00.000Z',
  '{"schema":{"context":"https://schema.org","type":"LocalBusiness","required":["@context","@type","name"],"recommended":["url","additionalType","address","telephone","openingHours","openingHoursSpecification","geo","priceRange","image","potentialAction"],"fields":{"url":true,"additionalType":true,"address":true,"telephone":true,"openingHours":true,"openingHoursSpecification":true,"geo":true,"priceRange":true,"image":true,"potentialAction":true},"hostedFields":["address","openingHoursSpecification","geo","telephone","priceRange"],"priceLevelMap":{"PRICE_LEVEL_FREE":"Free","PRICE_LEVEL_INEXPENSIVE":"¥","PRICE_LEVEL_MODERATE":"¥¥","PRICE_LEVEL_EXPENSIVE":"¥¥¥","PRICE_LEVEL_VERY_EXPENSIVE":"¥¥¥¥"},"hostedPriceLevelMap":{"PRICE_LEVEL_FREE":"¥","PRICE_LEVEL_INEXPENSIVE":"¥","PRICE_LEVEL_MODERATE":"¥¥","PRICE_LEVEL_EXPENSIVE":"¥¥¥","PRICE_LEVEL_VERY_EXPENSIVE":"¥¥¥"}},"llmsTxt":{"format":"markdown","sections":["identity","store_information","supported_ai_crawlers"]},"robots":{"defaultAllow":true,"aiCrawlerIds":["gptbot","oai-search","chatgpt-user","claudebot","perplexity","google-ext","applebot-ext","bytespider"]},"defaults":{"schemaType":"LocalBusiness","nameSource":"settings.name_or_site.url","hostedBaseUrl":"https://nurevo.jp/s/"}}',
  1,
  'Initial ruleset matching the pre-AEO-brain JSON-LD output.'
);
