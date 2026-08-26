ALTER TABLE tools
  ADD COLUMN IF NOT EXISTS price_amount_cents INTEGER NULL,
  ADD COLUMN IF NOT EXISTS price_currency CHAR(3) NOT NULL DEFAULT 'usd',
  ADD COLUMN IF NOT EXISTS price_interval VARCHAR(20) NOT NULL DEFAULT 'month',
  ADD COLUMN IF NOT EXISTS price_id VARCHAR(190) NULL,
  ADD COLUMN IF NOT EXISTS stripe_product_id VARCHAR(190) NULL;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS supabase_user_id UUID NULL UNIQUE;

CREATE TABLE IF NOT EXISTS automation_runs (
  id BIGSERIAL PRIMARY KEY,
  run_date DATE NOT NULL,
  status VARCHAR(30) NOT NULL CHECK (status IN ('started','skipped','published','failed')),
  slug VARCHAR(120) NULL,
  name VARCHAR(190) NULL,
  target_keyword VARCHAR(190) NULL,
  gap_score NUMERIC(6,3) NULL,
  reason TEXT NULL,
  details JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS automation_runs_one_published_per_day
  ON automation_runs (run_date)
  WHERE status = 'published';
