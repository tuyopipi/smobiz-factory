/**
 * The Worker's crons (worker/schedule.mjs, wrangler.jsonc, worker/index.mjs).
 *
 *  - wrangler.jsonc lists exactly the crons the handler knows, including the
 *    hourly one, at a minute that is not :00.
 *  - The hourly cron runs the not-connected reminders and nothing else.
 *  - The daily and weekly crons run exactly what they ran before, and the
 *    daily one no longer runs the reminders, so they cannot run twice.
 *  - One job failing does not stop the others; an unknown cron runs nothing.
 *  - The hourly cadence actually delivers on time: a site is reminded within
 *    the hour after it turns 24 h and 72 h old, once each.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DAILY_CRON, WEEKLY_CRON, HOURLY_CRON, OFFSITE_CRON, FREE_CHECK_CRON, SCHEDULED_JOBS, runScheduled } from "../worker/schedule.mjs";
import { parseWranglerConfig } from "./pro-golive-check.mjs";
import { REMINDER_STEPS, HOUR_MS, dueReminderStep } from "../worker/lifecycle-email.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

/* ---------------- config and handler agree ---------------- */

{
  const config = parseWranglerConfig(read("../wrangler.jsonc"));
  assert.deepEqual([...config.triggers.crons].sort(), [DAILY_CRON, WEEKLY_CRON, HOURLY_CRON, OFFSITE_CRON, FREE_CHECK_CRON].sort(), "wrangler.jsonc lists the five crons, no more");
  assert.deepEqual(Object.keys(SCHEDULED_JOBS).sort(), [DAILY_CRON, WEEKLY_CRON, HOURLY_CRON, OFFSITE_CRON, FREE_CHECK_CRON].sort());
  assert.ok(![DAILY_CRON, OFFSITE_CRON].map((c) => c.split(" ")[0]).includes(FREE_CHECK_CRON.split(" ")[0]), "the free AI check has its own minute, so its own invocation");
  assert.notEqual(OFFSITE_CRON.split(" ")[0], DAILY_CRON.split(" ")[0], "the off-site audit has its own minute, so its own invocation");
  assert.equal(DAILY_CRON, "17 18 * * *", "the daily schedule is unchanged");
  assert.equal(WEEKLY_CRON, "17 18 * * 1", "and the weekly one");
  const [minute, ...rest] = HOURLY_CRON.split(" ");
  assert.deepEqual(rest, ["*", "*", "*", "*"], "the new cron is every hour");
  assert.ok(/^\d+$/.test(minute) && Number(minute) > 0 && Number(minute) < 60, "at a fixed minute other than :00");
  assert.notEqual(minute, DAILY_CRON.split(" ")[0], "and not the daily jobs' minute");
}

/* ---------------- what each cron runs ---------------- */

{
  assert.deepEqual([...SCHEDULED_JOBS[HOURLY_CRON]], ["lifecycle-reminders", "partner-payouts"], "hourly: the reminders and the partner payouts");
  assert.deepEqual([...SCHEDULED_JOBS[DAILY_CRON]], ["webmcp-learning", "aeo-score-cron", "aeo-sov-daily"], "daily: as before, without the reminders");
  assert.deepEqual([...SCHEDULED_JOBS[WEEKLY_CRON]], ["aeo-learning"], "weekly: as before");
  assert.deepEqual([...SCHEDULED_JOBS[OFFSITE_CRON]], ["offsite-audit"], "the off-site listing audit runs alone, daily");
  assert.deepEqual([...SCHEDULED_JOBS[FREE_CHECK_CRON]], ["free-ai-check"], "the free AI check runs alone, daily");
  const all = Object.values(SCHEDULED_JOBS).flat();
  assert.equal(new Set(all).size, all.length, "no job runs under two crons");

  // index.mjs has a runner for every label, wired to the job it always was.
  const index = read("../worker/index.mjs");
  for (const [label, call] of [
    ["webmcp-learning", 'runLearningJob(env, { trigger: "scheduled" })'],
    ["aeo-score-cron", "runAeoScoreCron(env)"],
    ["aeo-sov-daily", "runSovDailyBatch(env)"],
    ["aeo-learning", 'runAeoLearningJob(env, { trigger: "scheduled" })'],
    ["offsite-audit", "runOffsiteAuditScheduled(env)"],
    ["free-ai-check", "runFreeAiCheckBatch(env)"],
    ["lifecycle-reminders", "runLifecycleReminders(env)"],
    ["partner-payouts", "runPartnerPayouts(env)"],
  ]) {
    assert.ok(index.includes(`"${label}": (env) => ${call},`), `index.mjs runs ${label} as ${call}`);
  }
  assert.ok(index.includes("runScheduled(event, env, ctx, SCHEDULED_RUNNERS)"), "scheduled() dispatches through the table");
  assert.equal((index.match(/runLifecycleReminders\(/g) || []).length, 1, "the reminders are started from one place only");
}

const quiet = async (fn) => {
  const saved = [console.log, console.warn, console.error];
  const lines = [];
  console.log = console.warn = console.error = (...args) => lines.push(args.join(" "));
  try { return { value: await fn(), lines }; } finally { [console.log, console.warn, console.error] = saved; }
};

async function fire(cron, { fail = [] } = {}) {
  const ran = [];
  const runners = new Proxy({}, {
    get: (_, name) => async (env) => {
      assert.equal(env.marker, "env", "each job gets the env");
      ran.push(name);
      if (fail.includes(name)) throw new Error(`${name} broke`);
      return { ok: true };
    },
  });
  const waits = [];
  const { value: names, lines } = await quiet(async () => {
    const names = runScheduled({ cron }, { marker: "env" }, { waitUntil: (p) => waits.push(p) }, runners);
    await Promise.all(waits);
    return names;
  });
  return { names, ran: ran.sort(), lines, waits };
}

{
  const hourly = await fire(HOURLY_CRON);
  assert.deepEqual(hourly.ran, ["lifecycle-reminders", "partner-payouts"], "the hourly event runs the reminders and the partner payouts, nothing else");
  assert.equal(hourly.waits.length, 1, "inside waitUntil");
  assert.ok(hourly.lines.some((l) => l.startsWith("lifecycle-reminders {")), "and logs under the same label as before");

  const daily = await fire(DAILY_CRON);
  assert.deepEqual(daily.ran, ["aeo-score-cron", "aeo-sov-daily", "webmcp-learning"], "the daily event: its three jobs");
  assert.equal(daily.ran.includes("lifecycle-reminders"), false, "and not the reminders");

  const weekly = await fire(WEEKLY_CRON);
  assert.deepEqual(weekly.ran, ["aeo-learning"]);
  assert.deepEqual((await fire(OFFSITE_CRON)).ran, ["offsite-audit"]);

  const unknown = await fire("0 0 * * *");
  assert.deepEqual(unknown.ran, [], "an unknown cron runs nothing");
  assert.equal(unknown.waits.length, 0);
  assert.ok(unknown.lines.some((l) => l.startsWith("scheduled-unknown-cron")));

  const broken = await fire(DAILY_CRON, { fail: ["webmcp-learning"] });
  assert.deepEqual(broken.ran, ["aeo-score-cron", "aeo-sov-daily", "webmcp-learning"], "one job failing does not stop the others");
  assert.ok(broken.lines.some((l) => l.startsWith("webmcp-learning-error") && l.includes("broke")), "the failure is logged under its old label");
}

/* ---------------- an hourly cadence is on time ---------------- */

{
  // A site created at any minute of the hour: the first run at or after each
  // step's due time sends it, which an hourly cron makes at most an hour late
  // (it was up to a day late with the daily cron).
  const minute = Number(HOURLY_CRON.split(" ")[0]);
  for (const createdMinute of [0, minute - 1, minute, minute + 1, 59]) {
    const created = Date.UTC(2026, 9, 20, 5, createdMinute);
    const runs = [];
    for (let h = 0; h < 80; h += 1) runs.push(Date.UTC(2026, 9, 20, 5 + h, minute));
    const handled = new Set();
    const sentAt = {};
    for (const now of runs) {
      const step = dueReminderStep(created, now);
      if (step && !handled.has(step)) { handled.add(step); sentAt[step] = now; }
    }
    for (const { step, afterMs } of REMINDER_STEPS) {
      const late = sentAt[step] - (created + afterMs);
      assert.ok(late >= 0 && late < HOUR_MS, `created at :${createdMinute}, step ${step} is sent within the hour it falls due (${late / 60e3} min)`);
    }
  }
}

console.log("scheduled tests passed");
