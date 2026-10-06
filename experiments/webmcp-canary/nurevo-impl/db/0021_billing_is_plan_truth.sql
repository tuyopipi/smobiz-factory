-- Billing becomes the source of truth for sites.plan.
--
-- Until now plan was written by /api/license/bind and /api/license/verify, and
-- Stripe only ever touched contract and delivery_status. The two never met, so
-- a site could be paid and still free, or cancelled and still pro. From here a
-- Stripe subscription decides the tier, and the license is the thing that links
-- an install to a site rather than the thing that grants a plan.
--
-- That leaves one honest exception: sites that legitimately hold a tier with no
-- subscription behind them - demo installs, wholesale channel sites billed
-- outside Stripe, and the canary fixtures. Without somewhere to record that,
-- making billing authoritative would silently demote all of them to free. The
-- two columns below are that record, and the backfill preserves exactly what is
-- live today.
--
-- Non-destructive: ADD COLUMN plus UPDATEs of the newly added columns only.
-- Not re-runnable (SQLite rejects re-adding a column); see 0020 for the same
-- caveat.

/* ------------------------------------------------------------------ *
 * A plan granted without a subscription
 * ------------------------------------------------------------------ */

-- The tier this site keeps when no Stripe subscription applies. NULL means
-- "billing decides", which is the normal case. This is deliberately a plan and
-- not a boolean: "manually provisioned" is useless unless it says as what.
ALTER TABLE sites ADD COLUMN manual_plan TEXT
  CHECK (manual_plan IS NULL OR manual_plan IN ('free', 'standard', 'pro'));

-- Why it was granted, so a future operator can tell a demo from a wholesale
-- account from a migration artefact. Never shown publicly.
ALTER TABLE sites ADD COLUMN manual_plan_note TEXT;

-- Marks keys that may grant a tier with no payment behind them: wholesale and
-- partner keys issued outside Stripe, and the canary fixtures. A normal retail
-- key leaves this 0, so redeeming it links the install but does not pay for it.
ALTER TABLE licenses ADD COLUMN manual INTEGER NOT NULL DEFAULT 0 CHECK (manual IN (0, 1));

/* ------------------------------------------------------------------ *
 * Preserve what is live today
 * ------------------------------------------------------------------ */

-- Any site currently on a paid tier with no subscription keeps that tier. These
-- are precisely the rows that would otherwise be demoted the first time
-- resolveSitePlan() ran, and none of them are a billing decision we are entitled
-- to reverse as a side effect of a migration.
UPDATE sites
   SET manual_plan = plan,
       manual_plan_note = 'grandfathered by 0021: paid tier with no Stripe subscription'
 WHERE plan IN ('standard', 'pro')
   AND (stripe_subscription_id IS NULL OR trim(stripe_subscription_id) = '')
   AND manual_plan IS NULL;

-- Wholesale sites are invoiced outside Stripe by design (the dashboard hides the
-- payment UI for them), so they must not depend on a subscription existing.
-- Their tier comes from the license they were provisioned with.
UPDATE licenses
   SET manual = 1
 WHERE org_id IN (SELECT id FROM orgs WHERE plan = 'wholesale');

-- The canary fixtures are manual by definition: there is no Stripe test
-- subscription behind them, and without this the canary cannot exercise a paid
-- tier at all. Production keys are issued separately and default to manual = 0.
UPDATE licenses
   SET manual = 1
 WHERE license_hash IN (
   'd4d16d39aa31d15c39703e36cd6da41a5c9f8c49189ba966becbf8c93d134182',  -- canary standard
   'f39ec3a08baa40464de7e07351aae3eb52593e5a5b26f20b2fe2658441ed28d8'   -- canary pro
 );

/* ------------------------------------------------------------------ *
 * Lookup
 * ------------------------------------------------------------------ */

-- The webhook resolves a site from the subscription id on every event.
CREATE INDEX IF NOT EXISTS idx_sites_stripe_subscription ON sites(stripe_subscription_id);
