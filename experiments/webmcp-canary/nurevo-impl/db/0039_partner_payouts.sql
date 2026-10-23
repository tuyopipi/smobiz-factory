-- Additive. Partner commission payouts through Stripe Connect Express.
-- Apply BEFORE deploying the Worker that reads it:
--   wrangler d1 execute nurevo-db --remote --file nurevo-impl/db/0039_partner_payouts.sql
--
-- accounts: the partner's Express account id (Stripe holds the company,
-- representative and bank details; Nurevo never stores bank numbers) and a
-- short-lived cache of its status for the Partner page and the hourly job.
ALTER TABLE accounts ADD COLUMN stripe_account_id TEXT;
ALTER TABLE accounts ADD COLUMN payout_status TEXT;          -- in_progress | ready
ALTER TABLE accounts ADD COLUMN payout_due_count INTEGER;    -- requirements currently/past due
ALTER TABLE accounts ADD COLUMN payout_checked_at INTEGER;   -- ms; cache time
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_stripe_account ON accounts(stripe_account_id);

-- The commission ledger (worker/partner-payouts.mjs).
--
-- kind='commission'  one row per paid invoice, source_key 'invoice:<invoice id>'
--   (UNIQUE: an invoice is recorded once whichever referral path - account
--   referral or legacy referrer - found the partner, so it cannot be paid twice).
--   paid_yen   = the charge's balance_transaction.net (JPY, after Stripe fees)
--   amount_yen = floor(0.4 * paid_yen)                    the commission
--   kept_yen   = what the partner keeps after refunds/lost disputes, always
--                recomputed from the charge's CURRENT state, never event order
--   transfer_amount_yen / withheld_yen  frozen before the first transfer
--                attempt (with key_rev, the Idempotency-Key revision)
--   transferred_yen = what actually reached the partner's Stripe balance
--   status: held -> sending -> sent | failed (retried) | dead (needs a person)
--           reversed (nothing to pay after refunds) | void (zero commission)
-- kind='reversal'    a transfer reversal, parent_id = the commission row,
--   source_key 'reversal:<row>:<cumulative target>'; pending|processing|sent|failed
-- kind='offset'      an unrecovered reversal withheld from a later transfer,
--   parent_id = the debtor commission row, payer_id = the paying row,
--   source_key 'offset:<payer>:<debtor>'; pending (reserved) | applied
CREATE TABLE IF NOT EXISTS referral_payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('commission', 'reversal', 'offset')),
  source_key TEXT NOT NULL UNIQUE,
  parent_id INTEGER REFERENCES referral_payouts(id),
  payer_id INTEGER REFERENCES referral_payouts(id),
  invoice_id TEXT NOT NULL,
  charge_id TEXT,
  partner_account_id INTEGER REFERENCES accounts(id),
  legacy_referrer_id TEXT,
  site_id TEXT,
  paid_yen INTEGER,
  charge_amount INTEGER,
  charge_refunded INTEGER,
  dispute_lost INTEGER NOT NULL DEFAULT 0,
  amount_yen INTEGER NOT NULL DEFAULT 0,
  kept_yen INTEGER,
  transfer_amount_yen INTEGER,
  withheld_yen INTEGER NOT NULL DEFAULT 0,
  transferred_yen INTEGER NOT NULL DEFAULT 0,
  key_rev INTEGER NOT NULL DEFAULT 0,
  available_at INTEGER,
  destination TEXT,
  status TEXT NOT NULL CHECK (status IN ('held', 'sending', 'sent', 'failed', 'dead', 'reversed', 'void', 'pending', 'processing', 'applied')),
  transfer_id TEXT,
  reversal_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  http_failed INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  last_attempt_at INTEGER,
  checked_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  sent_at INTEGER,
  CHECK (partner_account_id IS NOT NULL OR legacy_referrer_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_partner ON referral_payouts(partner_account_id, kind, status);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_work ON referral_payouts(kind, status, checked_at);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_charge ON referral_payouts(charge_id);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_parent ON referral_payouts(parent_id, kind);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_payer ON referral_payouts(payer_id);
