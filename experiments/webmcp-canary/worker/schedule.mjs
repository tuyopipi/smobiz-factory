/**
 * The Worker's cron schedule, kept apart from the entry module so tests can
 * import it without the whole Worker. Each cron must also be listed in
 * wrangler.jsonc triggers.crons; scripts/test-scheduled.mjs holds the two to
 * each other.
 *
 *   daily   learning, the daily AEO score point and the SoV batch
 *   weekly  the AEO ruleset learning job (Mondays)
 *   offsite the off-site listing audit, daily at its own time (03:47 JST) so
 *           its Places calls and D1 queries have an invocation of their own;
 *           each Standard/Pro site is due once a week, so the sites spread
 *           over the days instead of all falling on Monday
 *   free    the free AI check for Free/Standard sites (worker/free-ai-check.mjs),
 *           daily at its own time (04:37 JST) so its Perplexity calls have an
 *           invocation and a time budget of their own; each site is due once a
 *           month on its own day, so the checks spread over the month
 *   hourly  the "not connected yet" reminders, so the 24 h and 72 h
 *           emails arrive within the hour rather than up to a day late, and
 *           the partner payouts job (held commission released once a
 *           partner's Stripe account is ready, failed transfers/reversals
 *           retried, unresolved charges re-read), and the agency client
 *           reports (worker/agency-report.mjs), which act only on the 1st-3rd
 *           (UTC) and send a bounded, paced batch each hour until every
 *           enabled site's previous month is out. Its minute (23) avoids :00
 *           and the daily/weekly minute (17).
 */
export const DAILY_CRON = "17 18 * * *";
export const WEEKLY_CRON = "17 18 * * 1";
export const HOURLY_CRON = "23 * * * *";
export const OFFSITE_CRON = "47 18 * * *";
export const FREE_CHECK_CRON = "37 19 * * *";

/** What each cron runs, by log label. Nothing runs under two crons. */
export const SCHEDULED_JOBS = Object.freeze({
  [DAILY_CRON]: Object.freeze(["webmcp-learning", "aeo-score-cron", "aeo-sov-daily"]),
  [WEEKLY_CRON]: Object.freeze(["aeo-learning"]),
  [HOURLY_CRON]: Object.freeze(["lifecycle-reminders", "partner-payouts", "agency-reports"]),
  [OFFSITE_CRON]: Object.freeze(["offsite-audit"]),
  [FREE_CHECK_CRON]: Object.freeze(["free-ai-check"]),
});

/**
 * Run the jobs of one cron, each independently: one failing is logged and
 * does not stop the others. `runners` maps each job label to a function of
 * env (worker/index.mjs supplies the real ones).
 */
export function runScheduled(event, env, ctx, runners) {
  const cron = String(event?.cron || "");
  const names = SCHEDULED_JOBS[cron];
  if (!names) {
    console.warn("scheduled-unknown-cron", JSON.stringify({ cron }));
    return [];
  }
  const jobs = names.map((name) => Promise.resolve().then(() => runners[name](env)).then((result) => {
    console.log(name, JSON.stringify(result));
  }).catch((error) => {
    console.error(`${name}-error`, JSON.stringify({ message: String(error?.message || error) }));
  }));
  if (jobs.length) ctx.waitUntil(Promise.all(jobs));
  return names;
}

