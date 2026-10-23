/**
 * What a partner is owed, checked before any partner is owed anything.
 *
 * There are no paying sites yet, so every figure here is synthetic. That is
 * the point: the first real statement must be right the first time, and a
 * commission schedule is the kind of arithmetic nobody checks again once money
 * starts moving.
 *
 * The two rules worth breaking a build over: a comped site earns nobody
 * anything, and nothing ever rounds up.
 */
import assert from "node:assert/strict";
import {
  DEFAULT_KICKBACK_TIERS, calculateKickback, kickbackTiersFromEnv,
  normalizeTiers, overrideRate, rateForCount, siteRevenueYen,
} from "../worker/kickback.mjs";

const std = (id) => ({ site_id: id, billed_plan: "standard" });
const pro = (id) => ({ site_id: id, billed_plan: "pro" });
const many = (n, make) => Array.from({ length: n }, (_, i) => make(`s${i + 1}`));

/* ---------------- the tiers ---------------- */

assert.equal(rateForCount(1), 0.2, "one site earns the first band");
assert.equal(rateForCount(9), 0.2, "and so does the ninth");
assert.equal(rateForCount(10), 0.3, "the tenth moves up a band");
assert.equal(rateForCount(49), 0.3);
assert.equal(rateForCount(50), 0.4);
assert.equal(rateForCount(99), 0.4);
assert.equal(rateForCount(100), 0.5, "a hundred reaches the top band");
assert.equal(rateForCount(100000), 0.5, "which is open-ended");

assert.equal(rateForCount(0), 0, "no sites earns nothing");
assert.equal(rateForCount(-3), 0, "and neither does nonsense");
assert.equal(rateForCount("abc"), 0);

/* ---------------- what a site contributes ---------------- */

assert.equal(siteRevenueYen({ billed_plan: "standard" }), 3000);
assert.equal(siteRevenueYen({ billed_plan: "pro" }), 14800);
assert.equal(siteRevenueYen({ billed_plan: "free" }), 0, "free pays nothing");
assert.equal(siteRevenueYen({ billed_plan: "enterprise" }), 0, "an unknown tier is worth nothing, not a guess");
assert.equal(siteRevenueYen({}), 0);

// A wholesale site is invoiced at its own price rather than at list.
assert.equal(siteRevenueYen({ billed_plan: "standard", amount_yen: 1500 }), 1500, "an explicit amount wins");
assert.equal(siteRevenueYen({ billed_plan: "pro", amount_yen: 0 }), 0);
assert.equal(siteRevenueYen({ billed_plan: "standard", amount_yen: -5 }), 0, "a negative invoice is not a credit");

// Revenue is read from what was billed and from nothing else. A comp raises
// what a site may use without a yen changing hands, so an entitled tier must
// never reach this calculation - that would invent revenue and pay a partner
// a share of it.
assert.equal(siteRevenueYen({ billed_plan: "free", manual_plan: "pro", plan: "pro" }), 0, "an entitled tier is not revenue");
assert.equal(siteRevenueYen({ billed_plan: "standard", manual_plan: "pro" }), 3000, "only the billed tier is priced");

/* ---------------- a whole month ---------------- */

{
  // Three standard sites: 9,000 gross at the first band.
  const result = calculateKickback({ partner_org_id: "agency1", month: "2026-10", sites: many(3, std) });
  assert.equal(result.billable_sites, 3);
  assert.equal(result.gross_yen, 9000);
  assert.equal(result.rate, 0.2);
  assert.equal(result.rate_percent, 20);
  assert.equal(result.payout_yen, 1800);
  assert.equal(result.partner_org_id, "agency1");
  assert.equal(result.month, "2026-10");
  assert.equal(result.payout_status, "calculated", "the engine calculates; it does not pay");
  assert.equal(result.lines.length, 3, "with a line per site");
}

{
  // Ten sites cross into the second band, and the whole month earns the new
  // rate - not a blended one.
  const result = calculateKickback({ sites: many(10, std) });
  assert.equal(result.billable_sites, 10);
  assert.equal(result.gross_yen, 30000);
  assert.equal(result.rate, 0.3);
  assert.equal(result.payout_yen, 9000);
}

{
  const result = calculateKickback({ sites: [...many(50, std)] });
  assert.equal(result.rate, 0.4, "fifty sites earn the third band");
  assert.equal(result.gross_yen, 150000);
  assert.equal(result.payout_yen, 60000);
}

{
  const result = calculateKickback({ sites: [...many(100, pro)] });
  assert.equal(result.rate, 0.5);
  assert.equal(result.gross_yen, 1480000);
  assert.equal(result.payout_yen, 740000);
}

{
  // A mixed book.
  const result = calculateKickback({ sites: [std("a"), pro("b"), std("c")] });
  assert.equal(result.gross_yen, 3000 + 14800 + 3000);
  assert.equal(result.rate, 0.2);
  assert.equal(result.payout_yen, Math.floor(20800 * 0.2));
  assert.equal(result.lines[0].site_id, "b", "the largest line is listed first");
}

{
  const empty = calculateKickback({ sites: [] });
  assert.equal(empty.billable_sites, 0);
  assert.equal(empty.gross_yen, 0);
  assert.equal(empty.rate, 0, "no sites, no rate");
  assert.equal(empty.payout_yen, 0);
  assert.deepEqual(empty.lines, []);
}

assert.equal(calculateKickback({}).payout_yen, 0, "no arguments is not a crash");
assert.equal(calculateKickback({ sites: null }).payout_yen, 0);
assert.equal(calculateKickback({ sites: [null, undefined, 7] }).billable_sites, 0, "rubbish in the list is not a site");

/* ---------------- a comped site earns nobody anything ---------------- */

{
  // The rule that keeps the two money exceptions from adding up. A site given
  // away free produces no revenue, so there is nothing to take a share of.
  const result = calculateKickback({
    sites: [std("paid1"), std("paid2"), { site_id: "free1", billed_plan: "standard", comped: true }],
  });
  assert.equal(result.billable_sites, 2, "the comped site is not billable");
  assert.equal(result.excluded_sites, 1, "but it is accounted for rather than dropped");
  assert.equal(result.gross_yen, 6000, "and contributes no revenue");
  assert.equal(result.payout_yen, 1200);
  assert.ok(!result.lines.some((line) => line.site_id === "free1"), "it earns no line");
}

{
  // And it must not inflate the tier either - this is the subtle half. Nine
  // paying sites plus five comped ones is a nine-site partner, not fourteen.
  const sites = [...many(9, std), ...Array.from({ length: 5 }, (_, i) => ({ site_id: `c${i}`, billed_plan: "pro", comped: true }))];
  const result = calculateKickback({ sites });
  assert.equal(result.billable_sites, 9);
  assert.equal(result.rate, 0.2, "comped sites do not buy a better rate");
  assert.equal(result.gross_yen, 27000);
  assert.equal(result.payout_yen, 5400);
}

{
  // A free site is excluded for the same reason, without needing a flag.
  const result = calculateKickback({ sites: [std("a"), { site_id: "b", billed_plan: "free" }] });
  assert.equal(result.billable_sites, 1);
  assert.equal(result.excluded_sites, 1);
}

/* ---------------- never round up ---------------- */

{
  // 3,333 at 20% is 666.6. A partner is owed 666.
  const result = calculateKickback({ sites: [{ site_id: "odd", billed_plan: "standard", amount_yen: 3333 }] });
  assert.equal(result.gross_yen, 3333);
  assert.equal(result.payout_yen, 666, "the payout is floored, never rounded up");
}

{
  // Floored once on the total, not per line: flooring each line separately
  // would lose up to a yen per site, every month.
  const sites = many(3, (id) => ({ site_id: id, billed_plan: "standard", amount_yen: 1001 }));
  const result = calculateKickback({ sites });
  assert.equal(result.gross_yen, 3003);
  assert.equal(result.payout_yen, Math.floor(3003 * 0.2));
  assert.equal(result.payout_yen, 600);
}

/* ---------------- the schedule is configuration ---------------- */

{
  const custom = [{ min: 1, max: 4, rate: 0.1 }, { min: 5, max: null, rate: 0.6 }];
  assert.equal(rateForCount(3, custom), 0.1);
  assert.equal(rateForCount(5, custom), 0.6);
  const result = calculateKickback({ sites: many(5, std), tiers: custom });
  assert.equal(result.rate, 0.6, "a configured schedule is used");
  assert.equal(result.payout_yen, Math.floor(15000 * 0.6));
  assert.deepEqual(result.tiers, custom, "and reported back, so a statement can show its basis");
}

{
  // An unordered table is still a valid schedule; it is sorted.
  const shuffled = [{ min: 10, max: null, rate: 0.5 }, { min: 1, max: 9, rate: 0.2 }];
  assert.equal(rateForCount(10, normalizeTiers(shuffled)), 0.5);
  assert.equal(rateForCount(1, normalizeTiers(shuffled)), 0.2);
}

// Anything that is not a complete, gapless, open-ended schedule is refused
// whole. Half-applying a commission table pays a rate nobody chose.
assert.equal(normalizeTiers([{ min: 2, max: null, rate: 0.2 }]), null, "a schedule must start at one site");
assert.equal(normalizeTiers([{ min: 1, max: 9, rate: 0.2 }]), null, "and must be open-ended at the top");
assert.equal(normalizeTiers([{ min: 1, max: 9, rate: 0.2 }, { min: 20, max: null, rate: 0.3 }]), null, "a gap would earn nothing silently");
assert.equal(normalizeTiers([{ min: 1, max: null, rate: 1.5 }]), null, "a rate above 100% is not a rate");
assert.equal(normalizeTiers([{ min: 1, max: null, rate: -0.1 }]), null);
assert.equal(normalizeTiers([]), null);
assert.equal(normalizeTiers(null), null);
assert.equal(normalizeTiers("20%"), null);

// A bad table falls back to the default rather than paying out at random.
assert.deepEqual(calculateKickback({ sites: many(3, std), tiers: "nonsense" }).tiers, DEFAULT_KICKBACK_TIERS);
assert.equal(calculateKickback({ sites: many(3, std), tiers: [{ min: 5, max: null, rate: 0.9 }] }).rate, 0.2, "an invalid schedule does not apply");

/* ---------------- configuration comes from the environment ---------------- */

assert.deepEqual(kickbackTiersFromEnv({}), DEFAULT_KICKBACK_TIERS, "no configuration is the default schedule");
assert.deepEqual(kickbackTiersFromEnv({ KICKBACK_TIERS: "" }), DEFAULT_KICKBACK_TIERS);
assert.deepEqual(kickbackTiersFromEnv({ KICKBACK_TIERS: "{{{" }), DEFAULT_KICKBACK_TIERS, "unparseable configuration is ignored");
assert.deepEqual(
  kickbackTiersFromEnv({ KICKBACK_TIERS: JSON.stringify([{ min: 1, max: 2, rate: 0.25 }, { min: 3, max: null, rate: 0.45 }]) }),
  [{ min: 1, max: 2, rate: 0.25 }, { min: 3, max: null, rate: 0.45 }],
  "a valid schedule is adopted",
);

// The default is the agreed one, written out so a change to it is a visible
// change to this file too.
assert.deepEqual(DEFAULT_KICKBACK_TIERS, [
  { min: 1, max: 9, rate: 0.2 },
  { min: 10, max: 49, rate: 0.3 },
  { min: 50, max: 99, rate: 0.4 },
  { min: 100, max: null, rate: 0.5 },
]);

console.log("kickback tests passed");

/* ---------------- the report endpoint ---------------- */

/**
 * Attribution is the part the engine deliberately does not decide, so it is
 * worth pinning here: a site counts towards a partner org when it belongs to
 * that org, and on no other basis.
 *
 * In particular there is no org-to-org referral. sites.referred_by names a
 * person in the referrers table, not an org, so it cannot answer "which
 * partner introduced this site" - and the query must not read any org column
 * that is not actually in the schema. An earlier revision joined on
 * orgs.referred_by, which exists in the local database and not in production;
 * the fake database here happily answered it and the live endpoint returned
 * 500. Hence the explicit column list below.
 */
const { handleApi } = await import("../worker/api.mjs");

const CSRF = "c".repeat(64);
const SESSION = { cookie: `nrv_session=t; nrv_csrf=${CSRF}`, "x-csrf-token": CSRF, origin: "https://nurevo.jp" };

function reportEnv({ role = "admin", sites = [], superAdmin = false, tiers = null } = {}) {
  const DB = {
    prepare(sql) {
      const first = async (...values) => {
        if (/FROM sessions/.test(sql)) {
          return { member_id: "m1", org_id: "agency", email: superAdmin ? "boss@x.test" : "o@x.test", role, status: "active", expires_at: Date.now() + 3.6e6 };
        }
        if (/FROM orgs WHERE id=\?/.test(sql)) return values[0] === "agency" || values[0] === "other" ? { id: values[0] } : null;
        return null;
      };
      return {
        bind(...values) {
          return {
            first: () => first(...values),
            async all() {
              if (/FROM sites s JOIN orgs o/.test(sql)) {
                // Only columns the real schema has, in both databases. A query
                // naming anything else is a 500 in production, which is exactly
                // what a permissive stub hid once already.
                const allowed = new Set([
                  "s.id", "s.plan", "s.manual_plan", "s.contract", "s.resale_price",
                  "s.delivery_status", "o.manual_plan",
                ]);
                for (const column of sql.match(/\b[so]\.[a-z_]+/g) || []) {
                  if (column === "o.id" || column === "s.org_id") continue;
                  assert.ok(allowed.has(column), `the kickback query reads a column the schema may not have: ${column}`);
                }
                return { results: sites.filter((row) => row.org_id === values[0]) };
              }
              return { results: [] };
            },
            async run() { return { success: true }; },
          };
        },
        first, async all() { return { results: [] }; }, async run() { return { success: true }; },
      };
    },
  };
  return {
    DB, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp",
    ...(superAdmin ? { SUPER_ADMIN_EMAILS: "boss@x.test" } : {}),
    ...(tiers ? { KICKBACK_TIERS: tiers } : {}),
  };
}

const report = async (env, target = "/api/orgs/agency/kickback") => {
  const response = await handleApi(new Request(`https://w.test${target}`, { headers: SESSION }), env, { waitUntil() {} });
  return { status: response.status, body: await response.json() };
};

{
  const env = reportEnv({
    sites: [
      { id: "a", org_id: "agency", plan: "standard", manual_plan: null, org_manual_plan: null, delivery_status: "active", resale_price: 0 },
      { id: "b", org_id: "agency", plan: "pro", manual_plan: null, org_manual_plan: null, delivery_status: "active", resale_price: 0 },
      { id: "c", org_id: "agency", plan: "standard", manual_plan: null, org_manual_plan: null, delivery_status: "active", resale_price: 0 },
      // Another org's site, which is not this partner's business.
      { id: "x", org_id: "someone-else", plan: "pro", manual_plan: null, org_manual_plan: null, delivery_status: "active", resale_price: 0 },
    ],
  });
  const { status, body } = await report(env);
  assert.equal(status, 200);
  assert.equal(body.billable_sites, 3, "the partner's own sites count");
  assert.equal(body.gross_yen, 3000 + 14800 + 3000, "and another org's does not");
  assert.equal(body.rate, 0.2);
  assert.equal(body.payout_yen, Math.floor(20800 * 0.2));
  assert.equal(body.payout_status, "calculated", "it is a report, not a payment");
}

{
  // The rule that matters most, end to end: a comped site is attributed but
  // earns nothing and does not help reach a better tier.
  const env = reportEnv({
    sites: [
      { id: "a", org_id: "agency", plan: "standard", manual_plan: null, org_manual_plan: null, delivery_status: "active", resale_price: 0 },
      { id: "b", org_id: "agency", plan: "standard", manual_plan: "pro", org_manual_plan: null, delivery_status: "active", resale_price: 0 },
      { id: "c", org_id: "agency", plan: "standard", manual_plan: null, org_manual_plan: "standard", delivery_status: "active", resale_price: 0 },
      { id: "d", org_id: "agency", plan: "standard", manual_plan: null, org_manual_plan: null, delivery_status: "stopped", resale_price: 0 },
    ],
  });
  const { body } = await report(env);
  assert.equal(body.billable_sites, 1, "only the genuinely billed site counts");
  assert.equal(body.excluded_sites, 3, "a site grant, an org grant and a stopped site are all excluded");
  assert.equal(body.gross_yen, 3000);
  assert.equal(body.payout_yen, 600);
}

{
  // A wholesale site is invoiced at its own price.
  const env = reportEnv({
    sites: [{ id: "a", org_id: "agency", plan: "standard", manual_plan: null, org_manual_plan: null, delivery_status: "active", resale_price: 1500 }],
  });
  const { body } = await report(env);
  assert.equal(body.gross_yen, 1500, "the resale price is what was actually charged");
  assert.equal(body.payout_yen, 300);
}

{
  const env = reportEnv({ sites: [], tiers: JSON.stringify([{ min: 1, max: null, rate: 0.5 }]) });
  const { body } = await report(env);
  assert.deepEqual(body.tiers, [{ min: 1, max: null, rate: 0.5 }], "a configured schedule reaches the report");
}

{
  const { status, body } = await report(reportEnv(), "/api/orgs/agency/kickback?month=2026-13");
  assert.equal(status, 400, "a month that does not exist is refused");
  assert.equal(body.error, "invalid_month");
}

{
  const { body } = await report(reportEnv(), "/api/orgs/agency/kickback?month=2026-10");
  assert.equal(body.month, "2026-10", "and a real one is carried through");
}

{
  const { status } = await report(reportEnv({ role: "operator" }));
  assert.equal(status, 403, "a kickback statement is not for everyone");
}

{
  const { status } = await report(reportEnv(), "/api/orgs/other/kickback");
  assert.equal(status, 403, "nor may an admin read another partner's statement");
}

{
  const { status } = await report(reportEnv({ superAdmin: true }), "/api/orgs/other/kickback");
  assert.equal(status, 200, "a super admin may");
}

console.log("kickback endpoint tests passed");

/* ---------------- a rate agreed with one partner ---------------- */

/*
 * The tier table is the standard offer. A real negotiation departs from it: a
 * launch partner on 100%, a reseller held at the rate they signed before the
 * volume curve would have reduced it. Without an override the only options
 * were to change the global schedule - silently repaying every other partner
 * at the new rate - or to work the difference out by hand every month, which
 * is how a partner ends up underpaid.
 */

assert.equal(overrideRate(10000), 1, "10000 basis points is 100%");
assert.equal(overrideRate(2500), 0.25);
assert.equal(overrideRate(1), 0.0001, "one basis point is expressible");
assert.equal(overrideRate(0), 0, "zero is a rate, not an absence");
assert.equal(overrideRate(null), null, "no override means use the table");
assert.equal(overrideRate(undefined), null);
assert.equal(overrideRate(""), null);

// Units are basis points, and a float is a unit mistake - 0.25 meaning 25%
// would otherwise be read as 0.0025%.
assert.equal(overrideRate(0.25), null, "a fraction is refused rather than misread");
assert.equal(overrideRate(25.5), null);
assert.equal(overrideRate(10001), null, "more than 100% is not a rate");
assert.equal(overrideRate(-1), null);
assert.equal(overrideRate("2500"), null, "and a string is not basis points");

{
  // 100%: the partner keeps everything the attributed sites paid.
  const result = calculateKickback({ sites: many(3, std), rateOverrideBp: 10000 });
  assert.equal(result.rate, 1);
  assert.equal(result.gross_yen, 9000);
  assert.equal(result.payout_yen, 9000, "all of it");
  assert.equal(result.rate_basis, "org_override", "and the statement says why");
  assert.equal(result.rate_override_bp, 10000);
  assert.equal(result.tier_rate, 0.2, "while still reporting what the table would have paid");
}

{
  // The override applies at any volume - that is the point of it. A partner on
  // 25% with sixty sites is not moved to the 40% band.
  const result = calculateKickback({ sites: many(60, std), rateOverrideBp: 2500 });
  assert.equal(result.rate, 0.25, "the agreed rate holds at volume");
  assert.equal(result.tier_rate, 0.4, "even where the table would pay more");
  assert.equal(result.payout_yen, Math.floor(180000 * 0.25));
}

{
  // And below the table, which is the case that would otherwise be silently
  // overpaid.
  const result = calculateKickback({ sites: many(2, std), rateOverrideBp: 1000 });
  assert.equal(result.rate, 0.1);
  assert.equal(result.tier_rate, 0.2);
  assert.equal(result.payout_yen, 600);
}

{
  // Zero earns nothing, and must not fall back to the table. `bp || null`
  // would turn a partner on 0% into a partner with no agreement.
  const result = calculateKickback({ sites: many(5, std), rateOverrideBp: 0 });
  assert.equal(result.rate, 0, "zero is honoured");
  assert.equal(result.payout_yen, 0);
  assert.equal(result.rate_basis, "org_override", "as an override, not as an absent one");
}

{
  const result = calculateKickback({ sites: many(3, std) });
  assert.equal(result.rate_basis, "tier", "no override means the table");
  assert.equal(result.rate_override_bp, null);
  assert.equal(result.rate, result.tier_rate);
}

{
  // A malformed override is ignored in favour of the table rather than paying
  // out at something nobody chose.
  for (const bad of [0.5, "100%", -5, 10001, {}, NaN]) {
    const result = calculateKickback({ sites: many(3, std), rateOverrideBp: bad });
    assert.equal(result.rate, 0.2, `a malformed override falls back to the table: ${JSON.stringify(bad)}`);
    assert.equal(result.rate_basis, "tier");
  }
}

{
  // Comped sites still earn nothing, whatever the rate. The two exceptions
  // must not combine into a payout on revenue that does not exist.
  const result = calculateKickback({
    sites: [std("paid"), { site_id: "free1", billed_plan: "pro", comped: true }],
    rateOverrideBp: 10000,
  });
  assert.equal(result.billable_sites, 1);
  assert.equal(result.gross_yen, 3000, "the comped site contributes nothing even at 100%");
  assert.equal(result.payout_yen, 3000);
}

{
  // Still floored. 3,333 at 33.33% is 1,110.89 - the partner is owed 1,110.
  const result = calculateKickback({
    sites: [{ site_id: "odd", billed_plan: "standard", amount_yen: 3333 }],
    rateOverrideBp: 3333,
  });
  assert.equal(result.payout_yen, Math.floor(3333 * 0.3333));
  assert.equal(result.payout_yen, 1110);
}

/* ---------------- setting the rate ---------------- */

const rateEnv = ({ superAdmin = true, role = "admin", orgs = [{ id: "agency" }] } = {}) => {
  const db = { orgs: orgs.map((o) => ({ ...o })) };
  const DB = {
    prepare(sql) {
      const first = async (...values) => {
        if (/FROM sessions/.test(sql)) {
          return { member_id: "m1", org_id: "agency", email: superAdmin ? "boss@x.test" : "o@x.test", role, status: "active", expires_at: Date.now() + 3.6e6 };
        }
        if (/COUNT\(\*\) AS n FROM sites WHERE org_id=\?/.test(sql)) return { n: 7 };
        if (/FROM orgs WHERE id=\?/.test(sql)) return db.orgs.find((o) => o.id === values[0]) || null;
        return null;
      };
      return {
        bind(...values) {
          return {
            first: () => first(...values),
            async all() { return { results: [] }; },
            async run() {
              if (/UPDATE orgs SET kickback_rate_bp=/.test(sql)) {
                const org = db.orgs.find((o) => o.id === values[4]);
                if (org) { org.kickback_rate_bp = values[0]; org.kickback_rate_note = values[1]; org.kickback_rate_at = values[2]; org.kickback_rate_by = values[3]; }
              }
              return { success: true };
            },
          };
        },
        first, async all() { return { results: [] }; }, async run() { return { success: true }; },
      };
    },
  };
  return { DB, db, WEBMCP_ALLOWED_ORIGINS: "https://nurevo.jp", ...(superAdmin ? { SUPER_ADMIN_EMAILS: "boss@x.test" } : {}) };
};

const setRate = async (env, body, org = "agency") => {
  const response = await handleApi(
    new Request(`https://w.test/api/orgs/${org}/kickback-rate`, {
      method: "PUT",
      headers: { cookie: `nrv_session=t; nrv_csrf=${CSRF}`, "x-csrf-token": CSRF, "content-type": "application/json", origin: "https://nurevo.jp" },
      body: JSON.stringify(body),
    }),
    env, { waitUntil() {} },
  );
  return { status: response.status, body: await response.json() };
};

{
  const env = rateEnv();
  const { status, body } = await setRate(env, { rate_bp: 10000, note: "立ち上げパートナー・書面合意" });
  assert.equal(status, 200);
  assert.equal(body.rate_bp, 10000);
  assert.equal(body.rate_percent, 100, "reported as a percentage for a human");
  assert.equal(body.basis, "org_override");
  assert.equal(body.sites_attributed, 7, "and says what it covers");

  const org = env.db.orgs[0];
  assert.equal(org.kickback_rate_bp, 10000);
  assert.equal(org.kickback_rate_note, "立ち上げパートナー・書面合意", "the reason is kept");
  assert.ok(org.kickback_rate_at, "with when");
  assert.equal(org.kickback_rate_by, "m1", "and who agreed it");
}

{
  const env = rateEnv();
  await setRate(env, { rate_bp: 2500, note: "n" });
  const { status, body } = await setRate(env, { rate_bp: null });
  assert.equal(status, 200, "an override can be removed");
  assert.equal(body.rate_bp, null);
  assert.equal(body.basis, "tier", "returning the partner to the table");
  assert.equal(env.db.orgs[0].kickback_rate_note, null, "and the note goes with it");
}

{
  const env = rateEnv();
  const { status, body } = await setRate(env, { rate_bp: 5000 });
  assert.equal(status, 400, "a rate with no stated basis is refused");
  assert.equal(body.error, "note_required");
  assert.equal(env.db.orgs[0].kickback_rate_bp, undefined, "and nothing is stored");
}

{
  const env = rateEnv();
  const { status, body } = await setRate(env, { note: "no rate key" });
  assert.equal(status, 400, "an absent rate is not a removal");
  assert.equal(body.error, "rate_bp_required");
}

{
  // The unit mistake worth refusing loudly: 0.25 meaning 25%.
  for (const bad of [0.25, 25.5, -1, 10001, "2500", true]) {
    const env = rateEnv();
    const { status, body } = await setRate(env, { rate_bp: bad, note: "n" });
    assert.equal(status, 400, `a malformed rate is refused: ${JSON.stringify(bad)}`);
    assert.equal(body.error, "invalid_rate_bp");
    assert.equal(env.db.orgs[0].kickback_rate_bp, undefined);
  }
}

{
  // A partner raising their own commission is not a feature. Comping a plan
  // costs a subscription; this pays out money, so it sits a level higher.
  const env = rateEnv({ superAdmin: false });
  const { status } = await setRate(env, { rate_bp: 10000, note: "mine now" });
  assert.equal(status, 403, "an org admin cannot set their own rate");
  assert.equal(env.db.orgs[0].kickback_rate_bp, undefined);
}

{
  const { status } = await setRate(rateEnv({ superAdmin: false, role: "operator" }), { rate_bp: 100, note: "n" });
  assert.equal(status, 403);
}

{
  const { status } = await setRate(rateEnv(), { rate_bp: 100, note: "n" }, "nosuch");
  assert.equal(status, 404, "an org that does not exist cannot have a rate");
}

console.log("kickback override tests passed");
