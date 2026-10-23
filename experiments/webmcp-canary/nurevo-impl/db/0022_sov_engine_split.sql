-- Keep what the SoV measurement already worked out.
--
-- aggregateSov() computes rate_basis, a per-engine breakdown and the parser
-- control summary, and storeSovRun() then threw all three away: detail_json
-- held only {beta, truncated, brand}. The dashboard could therefore show a
-- single blended appearance rate and nothing else - not which engine produced
-- it, and not whether a missing rate meant "measured zero" or "could not be
-- measured".
--
-- That blend is the part that matters. Perplexity searches the web live, while
-- the OpenAI chat endpoint answers from model knowledge; one number spanning
-- both says neither thing. Splitting it at display time was not possible either,
-- because aeo_sov_mentions did not record whether a probe was a discovery
-- question or a branded control - and a branded control names the business in
-- the prompt, so folding it in would inflate the rate it is meant to validate.
--
-- Non-destructive: one ADD COLUMN. Not re-runnable (SQLite rejects re-adding a
-- column); see 0020 and 0021 for the same caveat.

/* ------------------------------------------------------------------ *
 * Which question a probe answered
 * ------------------------------------------------------------------ */

-- 'discovery' asks the kind of question a customer would ask and is what the
-- rate is built from. 'branded' names the business in the prompt and exists
-- only to check the mention parser against an answer guaranteed to contain it;
-- it is reported separately and never scored.
--
-- The default is honest for every row already stored: brandedControlQuestions()
-- has no caller on the measurement path - runSiteSov() passes no questions, so
-- buildQuestionSet() produces discovery questions only - and the one caller it
-- does have is a unit test. Existing rows are therefore all discovery, and this
-- column starts recording the distinction rather than inventing it.
ALTER TABLE aeo_sov_mentions ADD COLUMN kind TEXT NOT NULL DEFAULT 'discovery'
  CHECK (kind IN ('discovery', 'branded'));

-- The dashboard reads the latest run per site and splits it by engine.
CREATE INDEX IF NOT EXISTS idx_aeo_sov_mentions_run_kind
  ON aeo_sov_mentions(run_id, kind);
