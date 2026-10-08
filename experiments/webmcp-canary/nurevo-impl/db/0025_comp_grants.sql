-- Giving a tier away, on purpose, at the level the decision is actually made.
--
-- 0021 established that billing decides the plan, with one honest exception:
-- `sites.manual_plan`, a tier granted without payment. That covered a single
-- site. What it could not express is the case this is for - an agency and
-- every site under it, free by agreement. Stamping each site individually
-- works until the agency adds its hundredth, and then it is a chore that gets
-- forgotten, and a site quietly starts being billed.
--
-- So the grant also belongs on the org. A site's tier becomes the strongest of
-- three statements: what billing says it pays for, what this site was granted,
-- and what its org was granted. Strongest rather than last-write-wins, because
-- these answer different questions and none of them should silently cancel
-- another - a customer who upgrades to pro while their agency has a standard
-- comp should keep pro.
--
-- The note is not decoration. A grant with no stated reason is indistinguishable
-- from a billing bug a year later, and the person who made it has left.
--
-- Non-destructive: two new columns on orgs. Existing rows get NULL, which is
-- "no grant" and leaves every current site's plan exactly where it was.

ALTER TABLE orgs ADD COLUMN manual_plan TEXT
  CHECK (manual_plan IS NULL OR manual_plan IN ('free', 'standard', 'pro'));

ALTER TABLE orgs ADD COLUMN manual_plan_note TEXT;

-- Who granted it and when, so the note has an author. Kept on the org rather
-- than in a separate audit table because there is exactly one live grant per
-- org and its history is the git log of this file plus the billing events.
ALTER TABLE orgs ADD COLUMN manual_plan_at INTEGER;
ALTER TABLE orgs ADD COLUMN manual_plan_by TEXT;

-- The same provenance for a site-level grant. 0021 added manual_plan and
-- manual_plan_note; these two were missing, so a per-site comp could not say
-- who made it either.
ALTER TABLE sites ADD COLUMN manual_plan_at INTEGER;
ALTER TABLE sites ADD COLUMN manual_plan_by TEXT;

-- Finding every comped site is a billing question that gets asked monthly.
CREATE INDEX IF NOT EXISTS idx_sites_manual_plan ON sites(manual_plan)
  WHERE manual_plan IS NOT NULL;
