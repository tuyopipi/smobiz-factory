-- Accounts mirror existing authenticated members; authentication stays in members/sessions.
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id TEXT NOT NULL UNIQUE REFERENCES members(id),
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at INTEGER NOT NULL,
  referral_code TEXT UNIQUE,
  referred_by_account_id INTEGER REFERENCES accounts(id),
  referred_by_code TEXT,
  CHECK (referred_by_account_id IS NULL OR referred_by_account_id <> id)
);
CREATE UNIQUE INDEX idx_accounts_referral_code ON accounts(referral_code);
CREATE INDEX idx_accounts_referred_by ON accounts(referred_by_account_id);
INSERT INTO accounts(member_id,email,created_at)
  SELECT id,email,COALESCE(created_at,0) FROM members;
-- Store only SHA-256 hashes of bearer tokens. Retain consumption time for auditing.
CREATE TABLE auth_tokens (
  token TEXT PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  purpose TEXT NOT NULL CHECK (purpose IN ('signup','login')),
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);
CREATE INDEX idx_auth_tokens_account ON auth_tokens(account_id,expires_at);
