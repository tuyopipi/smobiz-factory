-- Learning data (worker/learning-events.mjs, worker/learning-baseline.mjs,
-- worker/learning.mjs, docs/learning.md). Additive: two new tables, nothing
-- existing changes.
--
-- learning_events is the change log: per site, timestamped, typed events with
-- a small JSON payload. It records which switch was turned on, which business
-- fields were filled in or cleared (field NAMES), counts, versions, scores -
-- never a value a person typed (no address, telephone, email, FAQ text). The
-- payload is built from an allowlist per event type (sanitizeEventData), so a
-- key that is not on it is dropped before anything is written.
--
-- (site_id, event_id) is the idempotency key: the plugin sends each queued
-- event with its own id and re-sends the batch until the service acknowledges
-- it, so a retry after a lost response inserts nothing twice. Service-side
-- events use deterministic ids where one event per thing is meant (one
-- free_check per site and month).
--
-- learning_baselines is the one pre-install measurement per WordPress site
-- added in the dashboard: the free-check style AI appearance check (three
-- non-branded Perplexity questions, inside the free-check budget) and the
-- public readiness score at that moment.
--
-- Until this is applied every writer skips silently ("no such table") and
-- GET /api/admin/learning reports migration_pending.
CREATE TABLE IF NOT EXISTS learning_events (
  site_id TEXT NOT NULL,
  event_id TEXT NOT NULL,                    -- plugin: its own uuid; service: "svc:..."
  source TEXT NOT NULL,                      -- plugin | service
  type TEXT NOT NULL,                        -- see LEARNING_EVENT_TYPES
  occurred_at TEXT NOT NULL,                 -- ISO time the change happened (plugin clock, bounded)
  received_at TEXT NOT NULL,                 -- ISO time the service stored it
  data_json TEXT NOT NULL DEFAULT '{}',      -- allowlisted flags / names / counts only
  PRIMARY KEY (site_id, event_id)
);
CREATE INDEX IF NOT EXISTS idx_learning_events_type ON learning_events(type, occurred_at);
CREATE INDEX IF NOT EXISTS idx_learning_events_site ON learning_events(site_id, occurred_at);

CREATE TABLE IF NOT EXISTS learning_baselines (
  site_id TEXT PRIMARY KEY,                  -- one baseline per site, ever
  status TEXT NOT NULL,                      -- scheduled | running | done | failed | skipped
  reason TEXT,                               -- why skipped (used_up:account, not_eligible, too_late, ...)
  scheduled_at TEXT NOT NULL,
  started_at TEXT,
  measured_at TEXT,
  connected_before INTEGER,                  -- 1 when the plugin had already paired when it ran
  readiness_score INTEGER,                   -- public scorer at that moment; NULL when unreadable
  readiness_json TEXT,                       -- {components: {schema: "OK", ...}, model_version}
  result_json TEXT,                          -- {engine, asked, answered, appeared, named, cited}
  est_cost_usd REAL
);
CREATE INDEX IF NOT EXISTS idx_learning_baselines_status ON learning_baselines(status, scheduled_at);
