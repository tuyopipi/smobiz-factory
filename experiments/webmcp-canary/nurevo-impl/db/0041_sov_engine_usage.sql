-- Additive. Monthly AI-visibility engine calls and estimated cost, per engine,
-- for each site and for the whole deployment (scope '*'). The measurement
-- reserves calls and estimated USD here (one conditional UPDATE per row, so
-- concurrent runs cannot overshoot) before asking ChatGPT (OpenAI Responses
-- API + web search), so its per-site and global call and USD caps hold;
-- Perplexity keeps its original per-site counter in aeo_sov_usage and adds its
-- rows here for its global and USD caps and the cost log. Until this is
-- applied, ChatGPT is reported as "migration pending" and never called.
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

-- The scheduled batch records each site's attempt before it calls any engine
-- and marks it finished when the run is stored. An attempt left unfinished
-- (the Worker was stopped mid-run, e.g. at the cron time limit) counts as that
-- day's scheduled run, so the site is not measured - and billed - again the
-- next day; its reserved calls and cost stay charged as the estimate.
CREATE TABLE IF NOT EXISTS aeo_sov_attempts (
  site_id TEXT PRIMARY KEY,
  trigger TEXT NOT NULL,                     -- scheduled
  started_at TEXT NOT NULL,                  -- ISO time the engine calls were about to start
  finished_at TEXT,                          -- set when the run was stored; NULL = cut off
  reserved_json TEXT                         -- {engine: {calls, usd}} reserved for this attempt
);
