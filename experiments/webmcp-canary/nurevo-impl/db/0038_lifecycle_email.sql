-- Additive. Lifecycle email: the ledger that makes each message send at most
-- once, and the opt-out list for the one non-transactional message.
--
-- worker/lifecycle-email.mjs claims a row before it sends:
--   scope='member' kind='welcome'        step='1'            first site created
--   scope='site'   kind='not_connected'  step='1' | '2'      24 h / 72 h unpaired wp site
--   scope='site'   kind='payment_failed' step=<invoice id>   invoice.payment_failed
--   scope='site'   kind='plan_ended'     step=<subscription> customer.subscription.deleted
-- The primary key is what stops a retried webhook, a repeated cron run or a
-- half-finished run from sending twice. status records how the claim ended:
-- claimed (in flight, or the worker died mid-send), sent, failed, suppressed.
-- A failed or stuck claim is deliberately not retried.
--
-- Until this is applied the claim fails and the worker skips the email; the
-- site creation, the Stripe webhook and the cron carry on as before.
CREATE TABLE IF NOT EXISTS lifecycle_emails (
  scope TEXT NOT NULL CHECK (scope IN ('member', 'site')),
  subject_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  step TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'claimed',
  detail TEXT,
  created_at INTEGER NOT NULL,
  sent_at INTEGER,
  PRIMARY KEY (scope, subject_id, kind, step)
);

-- One-click unsubscribe (signed link and List-Unsubscribe). Only the
-- 'reminders' category exists; billing and welcome mail is transactional and
-- always sent.
CREATE TABLE IF NOT EXISTS lifecycle_email_opt_outs (
  email TEXT NOT NULL COLLATE NOCASE,
  category TEXT NOT NULL DEFAULT 'reminders',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (email, category)
);
