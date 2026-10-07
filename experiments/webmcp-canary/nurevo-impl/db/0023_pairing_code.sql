-- Pair an install to a site the operator already created.
--
-- Binding runs the wrong way round today. The plugin holds a licence key, sends
-- it to /api/license/bind, and the service creates a site from it - so the site
-- comes into existence as a side effect of a key being redeemed, and the person
-- who created the account never chose it. Worse, nothing issues those keys:
-- the only rows in `licenses` are the two canary fixtures written by 0017, and
-- there is no code path anywhere that creates another. A retail key cannot be
-- obtained, and if one were, the plugin would reject the successful bind -
-- it requires plan to be standard or pro, while the service correctly answers
-- free for a key with no subscription behind it.
--
-- The replacement is the order people already expect: add the site in the
-- dashboard, get a short code, type it into the plugin. The site exists first
-- and the code only attaches an install to it, so a code can never create
-- anything, and losing one costs an operator a re-issue rather than a site.
--
-- `licenses` stays exactly as it is. It is the supply of manual_plan for
-- wholesale, partner and canary installs, which have no Stripe subscription,
-- and 0021 made that grant the floor for resolveSitePlan(). Removing it would
-- demote every one of those sites.
--
-- Non-destructive: three ADD COLUMNs. Not re-runnable (SQLite rejects re-adding
-- a column); see 0020, 0021 and 0022 for the same caveat.

/* ------------------------------------------------------------------ *
 * The code
 * ------------------------------------------------------------------ */

-- Only the hash is stored. The plaintext is shown once, when it is issued, for
-- the same reason the profile token is: a value that can attach an install to a
-- site should not be readable from the database afterwards.
ALTER TABLE sites ADD COLUMN pairing_code_hash TEXT;

-- Codes are short enough to read down a phone line, so they expire. An
-- unredeemed code left lying in a support ticket stops working on its own.
ALTER TABLE sites ADD COLUMN pairing_code_expires_at INTEGER;

-- Stamped when a code is redeemed, which is what makes it single use. It is
-- kept rather than cleared so a retry from the same install can be recognised
-- as a retry instead of being refused: the plugin may well have lost the
-- response that carried its token.
ALTER TABLE sites ADD COLUMN pairing_code_used_at INTEGER;

/* ------------------------------------------------------------------ *
 * Lookup
 * ------------------------------------------------------------------ */

-- /api/pair arrives with a code and nothing else, so the hash is the only way
-- in. Partial, because almost every row has no outstanding code.
CREATE INDEX IF NOT EXISTS idx_sites_pairing_code
  ON sites(pairing_code_hash) WHERE pairing_code_hash IS NOT NULL;
