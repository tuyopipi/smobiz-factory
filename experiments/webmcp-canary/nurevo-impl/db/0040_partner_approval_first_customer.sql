-- Additive. Partner approval and the "first referred customer earns nothing" rule.
-- Apply BEFORE deploying the Worker that reads it:
--   wrangler d1 execute nurevo-db --remote --file nurevo-impl/db/0040_partner_approval_first_customer.sql
--
-- accounts.partner_status: none | pending | approved | rejected (default none).
--   Only an 'approved' account can issue a referral code, set up a payout
--   account, attribute new signups or earn commission. A member applies from
--   the Partner page (pending); a super admin approves or rejects it in
--   Partner admin (dashboard). Nothing in this file approves anyone.
-- accounts.partner_approved_at: ms. Referred customers whose account was
--   created before this moment never earn commission (referrals made before
--   approval do not count retroactively).
-- accounts.partner_first_customer_account_id: the partner's first referred
--   customer account whose invoice was paid with a positive amount after
--   approval. Set once by a conditional UPDATE (... WHERE it IS NULL) on the
--   first qualifying invoice, so concurrent invoices pick exactly one. Every
--   invoice of that customer is recorded in referral_payouts as
--   status='void', amount_yen=0, last_error='first_customer' (shown on the
--   Partner page as "1社目（報酬対象外）"); it is never paid.
ALTER TABLE accounts ADD COLUMN partner_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE accounts ADD COLUMN partner_applied_at INTEGER;
ALTER TABLE accounts ADD COLUMN partner_reviewed_at INTEGER;
ALTER TABLE accounts ADD COLUMN partner_reviewed_by TEXT;
ALTER TABLE accounts ADD COLUMN partner_approved_at INTEGER;
ALTER TABLE accounts ADD COLUMN partner_first_customer_account_id INTEGER REFERENCES accounts(id);
CREATE INDEX IF NOT EXISTS idx_accounts_partner_status ON accounts(partner_status);

-- Accounts that already issued a referral code under the previous rules keep
-- their code, but are NOT approved: they are queued for review so the owner
-- sees them in Partner admin and can approve the real partner. Until then the
-- code is shown as inactive and attributes no new signups.
UPDATE accounts SET partner_status='pending', partner_applied_at=COALESCE(partner_applied_at, created_at)
  WHERE referral_code IS NOT NULL AND partner_status='none';
