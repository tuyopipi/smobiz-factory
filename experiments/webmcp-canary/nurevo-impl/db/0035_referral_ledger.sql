-- Referral credentials are consumed atomically; no account is created on share.
ALTER TABLE sites ADD COLUMN detected_language TEXT;
ALTER TABLE accounts ADD COLUMN partner_registered_at INTEGER;
CREATE TABLE referral_invites (
 id TEXT PRIMARY KEY, partner_id INTEGER NOT NULL REFERENCES accounts(id),
 email TEXT NOT NULL COLLATE NOCASE, ref_code TEXT NOT NULL, locale TEXT NOT NULL,
 report_json TEXT NOT NULL, expires_at INTEGER NOT NULL, used_at INTEGER,
 verify_hash TEXT UNIQUE, verify_expires_at INTEGER
);
CREATE INDEX referral_invites_partner ON referral_invites(partner_id,expires_at);
CREATE TABLE referral_ledger_runs (
 id TEXT PRIMARY KEY, period TEXT NOT NULL, created_at INTEGER NOT NULL,
 config_json TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('building','ready','failed'))
);
CREATE TABLE referral_ledger (
 run_id TEXT NOT NULL REFERENCES referral_ledger_runs(id), invoice_id TEXT NOT NULL,
 partner_id INTEGER NOT NULL, customer_account_id INTEGER NOT NULL,
 subscription_id TEXT NOT NULL, currency TEXT NOT NULL, paid_at INTEGER NOT NULL,
 amount_paid INTEGER NOT NULL, rate_bp INTEGER NOT NULL, commission_minor INTEGER NOT NULL,
 evidence_json TEXT NOT NULL, PRIMARY KEY(run_id,invoice_id)
);
-- Immutable snapshots: export one ready run, never sum multiple runs for a period.
CREATE INDEX referral_ledger_partner ON referral_ledger(run_id,partner_id,currency);
-- Generic signup referral is also deferred until mailbox verification.
ALTER TABLE auth_tokens ADD COLUMN referral_parent_id INTEGER REFERENCES accounts(id);
ALTER TABLE auth_tokens ADD COLUMN referral_code TEXT;
