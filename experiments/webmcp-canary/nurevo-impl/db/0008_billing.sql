ALTER TABLE orgs ADD COLUMN wholesale_min INTEGER NOT NULL DEFAULT 50;
ALTER TABLE sites ADD COLUMN channel TEXT NOT NULL DEFAULT 'direct';
ALTER TABLE sites ADD COLUMN referred_by TEXT;
ALTER TABLE sites ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE sites ADD COLUMN stripe_subscription_id TEXT;

CREATE TABLE IF NOT EXISTS referrers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'individual',
  email TEXT,
  stripe_account_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS billing_events (
  event_id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
