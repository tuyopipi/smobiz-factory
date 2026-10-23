-- U4 plans and canary licenses. Append-only/non-destructive migration.
-- `sites.plan` already exists in the canary schema. Preserve explicit plans and
-- only normalize missing or unsupported values.
UPDATE sites
   SET plan = 'free'
 WHERE plan IS NULL OR trim(plan) = '' OR plan NOT IN ('free', 'standard', 'pro');

CREATE TABLE IF NOT EXISTS licenses (
  license_hash TEXT PRIMARY KEY,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'standard', 'pro')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at INTEGER NOT NULL
);

-- Canary-only test licenses. Store sha256 hashes rather than plaintext keys.
-- The canary plaintext keys these hashes correspond to are:
--   standard: nrv_canary_standard_3000
--   pro:      nrv_canary_pro_14800
-- Production keys are issued separately and are not seeded here.
INSERT OR IGNORE INTO licenses (license_hash, plan, active, created_at) VALUES
  ('d4d16d39aa31d15c39703e36cd6da41a5c9f8c49189ba966becbf8c93d134182', 'standard', 1, 1791068400000),
  ('f39ec3a08baa40464de7e07351aae3eb52593e5a5b26f20b2fe2658441ed28d8', 'pro', 1, 1791068400000);

-- TODO(U4-production): 本番キー投入待ち（要確認・橋本確認後）。
-- Stripe sk_live / production Price ID / webhook secret are intentionally not configured here.
