-- Additive. Partner commission payouts through Stripe Connect Express.
-- Apply BEFORE deploying the Worker that reads it:
--   wrangler d1 execute nurevo-db --remote --file nurevo-impl/db/0039_partner_payouts.sql
--
-- accounts: the partner's Express account id (Stripe holds the company,
-- representative and bank details; Nurevo never stores bank numbers) and a
-- short-lived cache of its status for the Partner page.
ALTER TABLE accounts ADD COLUMN stripe_account_id TEXT;
ALTER TABLE accounts ADD COLUMN payout_status TEXT;          -- in_progress | ready
ALTER TABLE accounts ADD COLUMN payout_due_count INTEGER;    -- requirements currently/past due
ALTER TABLE accounts ADD COLUMN payout_checked_at INTEGER;   -- ms; cache time
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_stripe_account ON accounts(stripe_account_id);

-- The commission ledger (worker/partner-payouts.mjs).
--   kind='commission' one row per paid invoice:  source_key = 'invoice:<invoice id>'
--   kind='reversal'   one row per refund level:   source_key = 'refund:<charge id>:<amount_refunded>'
-- source_key is UNIQUE, so an invoice is recorded once whichever referral path
-- (account referral or legacy referrers) found the partner: it cannot be paid
-- twice.
--
-- commission status: held (partner not ready, or charge/fee not known yet)
--   -> sending (claimed) -> sent | failed (retried hourly) ; reversed (fully
--   refunded) ; void (resolved to zero commission)
-- reversal status: pending -> applied (reduced an unsent row) | sent (transfer
--   reversal) | failed (retried; recovered from the next commission) | offset
--
-- amounts are JPY. paid_yen is the commission basis: the NET JPY of the
-- charge's balance transaction (amount - Stripe fees).
-- commission_yen = floor(0.4 * paid_yen).
CREATE TABLE IF NOT EXISTS referral_payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('commission', 'reversal')),
  source_key TEXT NOT NULL UNIQUE,
  parent_id INTEGER REFERENCES referral_payouts(id),
  invoice_id TEXT NOT NULL,
  charge_id TEXT,
  refund_id TEXT,
  partner_account_id INTEGER REFERENCES accounts(id),
  legacy_referrer_id TEXT,
  site_id TEXT,
  paid_yen INTEGER,
  amount_yen INTEGER NOT NULL,
  refunded_yen INTEGER NOT NULL DEFAULT 0,
  transferred_yen INTEGER NOT NULL DEFAULT 0,
  reversed_back_yen INTEGER NOT NULL DEFAULT 0,
  withheld_yen INTEGER NOT NULL DEFAULT 0,
  offset_yen INTEGER NOT NULL DEFAULT 0,
  available_at INTEGER,
  destination TEXT,
  status TEXT NOT NULL CHECK (status IN ('held', 'sending', 'sent', 'failed', 'reversed', 'void', 'pending', 'processing', 'applied', 'offset')),
  transfer_id TEXT,
  reversal_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  sent_at INTEGER,
  CHECK (partner_account_id IS NOT NULL OR legacy_referrer_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_partner ON referral_payouts(partner_account_id, kind, status);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_status ON referral_payouts(kind, status, id);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_charge ON referral_payouts(charge_id);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_parent ON referral_payouts(parent_id);
