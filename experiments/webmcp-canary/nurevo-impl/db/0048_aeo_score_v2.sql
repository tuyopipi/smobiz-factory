-- AEO score v2 (worker/aeo-score-v2.mjs, docs/score-v2.md). Additive.
--
-- `score` keeps its meaning: the on-site score, now shown as the sub-score
-- "AI readiness", with the same algorithm and score_model_version, so its
-- history stays comparable. Beside it each diagnosis now stores the headline
-- that blends in the measured AI visibility, and which version that headline
-- is. A row with score_version NULL is a v1 row: its headline was `score`.
-- Charts compare points of one version only and mark where it changes.
--
-- Not re-runnable (SQLite rejects re-adding a column); see 0020 / 0032.
ALTER TABLE aeo_scores ADD COLUMN score_version TEXT;          -- 'aeo-v2'; NULL = v1
ALTER TABLE aeo_scores ADD COLUMN headline_score INTEGER;      -- the v2 AEO score (0-100); NULL when readiness is NULL
ALTER TABLE aeo_scores ADD COLUMN visibility_score INTEGER;    -- AI visibility sub-score (0-100); NULL when nothing was measured
ALTER TABLE aeo_scores ADD COLUMN visibility_answers INTEGER;  -- AI answers it was built from (0 = not measured)
ALTER TABLE aeo_scores ADD COLUMN visibility_json TEXT;        -- counts, weight, share, interval, window
