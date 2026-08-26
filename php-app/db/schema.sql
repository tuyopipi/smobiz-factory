CREATE TABLE IF NOT EXISTS tools (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(190) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(80) NOT NULL,
  target_keyword VARCHAR(190) NOT NULL,
  logo_color VARCHAR(16) NOT NULL,
  pricing_model VARCHAR(30) NOT NULL DEFAULT 'free' CHECK (pricing_model IN ('free','ads','one_time','subscription','bundle')),
  price_amount_cents INTEGER NULL CHECK (price_amount_cents IS NULL OR price_amount_cents > 0),
  price_currency CHAR(3) NOT NULL DEFAULT 'usd',
  price_interval VARCHAR(20) NOT NULL DEFAULT 'month' CHECK (price_interval IN ('one_time','month','year')),
  price_id VARCHAR(190) NULL,
  stripe_price_id VARCHAR(190) NULL,
  stripe_product_id VARCHAR(190) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tools_category_idx ON tools (category);
CREATE INDEX IF NOT EXISTS tools_keyword_idx ON tools (target_keyword);

CREATE TABLE IF NOT EXISTS "users" (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  supabase_user_id UUID NULL UNIQUE,
  magic_token_hash VARCHAR(255) NULL,
  magic_token_expires_at TIMESTAMPTZ NULL,
  last_login_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  tool_slug VARCHAR(120) NULL,
  stripe_customer_id VARCHAR(190) NULL,
  stripe_subscription_id VARCHAR(190) NULL,
  stripe_checkout_session_id VARCHAR(190) NULL UNIQUE,
  status VARCHAR(60) NOT NULL DEFAULT 'inactive',
  current_period_end TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS subscriptions_tool_idx ON subscriptions (tool_slug);
CREATE INDEX IF NOT EXISTS subscriptions_customer_idx ON subscriptions (stripe_customer_id);

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
