-- Additive. The free monthly "AI appearance check" for Free and Standard sites
-- (worker/free-ai-check.mjs): one row per site per calendar month (UTC).
--
-- The (site_id, month) primary key is the once-a-month guard: the scheduled
-- run and the owner's "check now" both claim the month with one INSERT, so only
-- one of them ever calls the engine. A row left at 'cap_reached' (a monthly
-- USD cap was hit before any call) may be claimed again.
--
-- Calls and estimated cost are reserved in aeo_sov_engine_usage (0041) under
-- the engine bucket 'free:perplexity', separate from Pro's 'perplexity' rows,
-- so free checks can never spend Pro budget.
--
-- Until this is applied the worker reports the free check as
-- "migration_pending" and never calls an engine.
CREATE TABLE IF NOT EXISTS aeo_free_checks (
  site_id TEXT NOT NULL,
  month TEXT NOT NULL,                       -- YYYY-MM (UTC)
  trigger TEXT NOT NULL,                     -- scheduled | manual
  status TEXT NOT NULL,                      -- running | done | failed | cap_reached
  started_at TEXT NOT NULL,                  -- ISO time the month was claimed
  finished_at TEXT,                          -- NULL while running (or cut off)
  reserved_json TEXT,                        -- {calls, usd} reserved for this check
  result_json TEXT,                          -- per-question named/cited and the others that appeared
  est_cost_usd REAL,                         -- estimate from list prices, not a bill
  PRIMARY KEY (site_id, month)
);
