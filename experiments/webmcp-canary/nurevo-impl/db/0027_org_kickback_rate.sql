-- A rate agreed with one partner, not the one in the table.
--
-- The kickback engine reads a single tier schedule (KICKBACK_TIERS, defaulting
-- to 20/30/40/50 by volume). That is the standard offer, and a standard offer
-- is the thing a real negotiation departs from: a launch partner on 100%, a
-- reseller who brought the first ten customers held at a rate the volume table
-- would since have reduced, a special case that exists because someone agreed
-- to it in writing.
--
-- Without this the only ways to honour such an agreement were to change the
-- global schedule - which silently repays every other partner at the new rate
-- - or to work the difference out by hand every month, which is how a partner
-- ends up underpaid.
--
-- Stored as basis points rather than a percentage or a float. 2500 is 25%,
-- 10000 is 100%. Integers because money: 0.175 cannot be written exactly in
-- binary floating point, and a rate that is almost right compounds monthly.
-- Basis points are also how the rest of the payments world states a rate, so
-- there is no unit to guess at.
--
-- NULL means "use the tier table", which is what every existing org gets, so
-- applying this changes nobody's payout.
--
-- Deliberately one rate per org rather than a per-org schedule. An override is
-- an exception to the standard; an org that needs its own volume curve needs a
-- conversation, not a column.
--
-- Non-destructive: three nullable columns on orgs.

ALTER TABLE orgs ADD COLUMN kickback_rate_bp INTEGER
  CHECK (kickback_rate_bp IS NULL OR (kickback_rate_bp >= 0 AND kickback_rate_bp <= 10000));

-- Why. The same reason manual_plan_note exists: a rate with no stated basis is
-- indistinguishable from a mistake once the person who agreed it has left.
ALTER TABLE orgs ADD COLUMN kickback_rate_note TEXT;

ALTER TABLE orgs ADD COLUMN kickback_rate_at INTEGER;
ALTER TABLE orgs ADD COLUMN kickback_rate_by TEXT;

-- Finding every negotiated rate is a question asked whenever the standard
-- schedule is reviewed.
CREATE INDEX IF NOT EXISTS idx_orgs_kickback_rate ON orgs(kickback_rate_bp)
  WHERE kickback_rate_bp IS NOT NULL;
