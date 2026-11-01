-- Additive. Overseas referral partners receive their commission through Wise.
-- Apply BEFORE (or after) deploying the Worker that reads it; the Worker treats
-- a missing column as "everyone is on Stripe" and refuses Wise saves with 503:
--   wrangler d1 execute nurevo-db --remote --file nurevo-impl/db/0050_partner_wise_payout.sql
--
-- accounts.payout_method: 'stripe' (default; Japan, Stripe Connect Express,
--   automatic transfers, paid out on the 25th) | 'wise' (overseas; the
--   partner enters the details below on the Partner page and a super admin
--   sends the due amount through Wise by hand, then records it in Partner
--   admin). A Wise partner's commission rows are never paid by a Stripe
--   transfer. Commission is unchanged: 40% of the net JPY, from the second
--   referred customer on, computed in JPY whatever the receiving currency.
-- accounts.wise_*: what the partner gave for Wise: the recipient's name, the
--   email registered with Wise, the receiving currency (ISO 4217) and the
--   country (ISO 3166-1 alpha-2). No bank numbers are stored.
ALTER TABLE accounts ADD COLUMN payout_method TEXT NOT NULL DEFAULT 'stripe';
ALTER TABLE accounts ADD COLUMN wise_account_name TEXT;
ALTER TABLE accounts ADD COLUMN wise_email TEXT;
ALTER TABLE accounts ADD COLUMN wise_currency TEXT;
ALTER TABLE accounts ADD COLUMN wise_country TEXT;
ALTER TABLE accounts ADD COLUMN wise_updated_at INTEGER;

-- referral_payouts: a commission row a super admin recorded as sent by hand
-- (destination='wise', transfer_id NULL): the admin's reference (e.g. the
-- Wise transfer number) and the member id of the admin who recorded it.
ALTER TABLE referral_payouts ADD COLUMN manual_reference TEXT;
ALTER TABLE referral_payouts ADD COLUMN manual_paid_by TEXT;
