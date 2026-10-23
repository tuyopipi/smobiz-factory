-- Additive. Monthly AI-visibility engine calls and estimated cost, per engine,
-- for each site and for the whole deployment (scope '*'). The measurement
-- reads it before asking ChatGPT (OpenAI Responses API + web search) so its
-- per-site and global monthly caps hold; Perplexity keeps its original
-- per-site counter in aeo_sov_usage and adds its rows here for the global cap
-- and the cost log. Until this is applied, ChatGPT is reported as "migration
-- pending" and never called.
CREATE TABLE IF NOT EXISTS aeo_sov_engine_usage (
  scope TEXT NOT NULL,                       -- site id, or '*' for all sites
  engine TEXT NOT NULL,                      -- perplexity | openai
  month TEXT NOT NULL,                       -- YYYY-MM (UTC)
  calls INTEGER NOT NULL DEFAULT 0,          -- engine calls (reserved, then trued up)
  searches INTEGER NOT NULL DEFAULT 0,       -- billed search actions the provider reported
  est_cost_usd REAL NOT NULL DEFAULT 0,      -- estimate from list prices, not a bill
  updated_at TEXT NOT NULL,
  PRIMARY KEY (scope, engine, month)
);
