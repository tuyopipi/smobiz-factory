/**
 * What a partner is owed.
 *
 * A partner who brings business earns a share of what that business pays,
 * and the share grows with how much they bring. This file works out the
 * number. It does not move money: payment is made by hand, deliberately, and
 * nothing here should ever be wired to a transfer.
 *
 * Everything is pure. Given rows, it returns a figure and the lines that
 * explain it, so the arithmetic can be checked without a database and without
 * waiting for a real invoice to exist - which matters, because today there are
 * no paying sites at all and the engine still has to be right on the day there
 * are.
 *
 * Two things it deliberately refuses to do:
 *
 * A comped site earns nobody anything. It was given away at no charge, so
 * there is no revenue to take a percentage of, and counting it would both
 * invent a payout and inflate the tier that decides the rate. Comps and
 * kickbacks are the two ways a site can be unusual about money, and they must
 * not quietly add up.
 *
 * It never rounds up. Yen has no subunit, so every line is floored. Paying a
 * partner a yen more than was earned is a rounding bug that compounds monthly.
 */

/** What each tier pays, by how many billable sites the partner brought. */
export const DEFAULT_KICKBACK_TIERS = Object.freeze([
  Object.freeze({ min: 1, max: 9, rate: 0.2 }),
  Object.freeze({ min: 10, max: 49, rate: 0.3 }),
  Object.freeze({ min: 50, max: 99, rate: 0.4 }),
  // null means "and upward". Written as null rather than Infinity so the table
  // survives a trip through JSON when it is overridden by configuration.
  Object.freeze({ min: 100, max: null, rate: 0.5 }),
]);

/** The monthly list price of each tier, in yen. */
export const PLAN_MONTHLY_YEN = Object.freeze({ free: 0, standard: 3000, pro: 14800 });

/**
 * Read a tier table from configuration, falling back to the default.
 *
 * A malformed table falls back whole rather than in part. Half-applying a
 * commission schedule is worse than ignoring it: it would pay out at a rate
 * nobody chose, and look deliberate.
 */
export function kickbackTiersFromEnv(env = {}) {
  const raw = String(env.KICKBACK_TIERS || "").trim();
  if (!raw) return DEFAULT_KICKBACK_TIERS;
  try {
    const parsed = JSON.parse(raw);
    return normalizeTiers(parsed) || DEFAULT_KICKBACK_TIERS;
  } catch {
    return DEFAULT_KICKBACK_TIERS;
  }
}

/**
 * Validate a tier table.
 *
 * Returns null - meaning "use the default" - for anything that is not a
 * complete, ordered, gapless schedule starting at one site. A gap would make
 * some number of sites earn nothing at all, silently.
 */
export function normalizeTiers(tiers) {
  if (!Array.isArray(tiers) || tiers.length === 0) return null;
  const cleaned = [];
  for (const tier of tiers) {
    if (!tier || typeof tier !== "object") return null;
    const min = Number(tier.min);
    const max = tier.max === null || tier.max === undefined ? null : Number(tier.max);
    const rate = Number(tier.rate);
    if (!Number.isInteger(min) || min < 1) return null;
    if (max !== null && (!Number.isInteger(max) || max < min)) return null;
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) return null;
    cleaned.push({ min, max, rate });
  }
  cleaned.sort((a, b) => a.min - b.min);
  if (cleaned[0].min !== 1) return null;
  for (let i = 0; i < cleaned.length - 1; i += 1) {
    // Each band must stop exactly where the next begins.
    if (cleaned[i].max === null) return null;
    if (cleaned[i].max + 1 !== cleaned[i + 1].min) return null;
  }
  // The last band is open-ended, or a partner above it earns nothing.
  if (cleaned[cleaned.length - 1].max !== null) return null;
  return Object.freeze(cleaned.map((tier) => Object.freeze(tier)));
}

/** The rate a partner with this many billable sites earns. */
export function rateForCount(count, tiers = DEFAULT_KICKBACK_TIERS) {
  const n = Number(count);
  if (!Number.isFinite(n) || n < 1) return 0;
  const table = Array.isArray(tiers) && tiers.length ? tiers : DEFAULT_KICKBACK_TIERS;
  for (const tier of table) {
    if (n >= tier.min && (tier.max === null || n <= tier.max)) return tier.rate;
  }
  return 0;
}

/**
 * What one site contributes.
 *
 * `billed_plan` is what the subscription actually pays for - not the plan the
 * site is entitled to use, which a comp can raise without a yen changing
 * hands. An explicit amount_yen wins when there is one, because a wholesale
 * site is invoiced at its own price rather than at list.
 */
export function siteRevenueYen(site = {}) {
  if (site.amount_yen !== undefined && site.amount_yen !== null) {
    const explicit = Number(site.amount_yen);
    return Number.isFinite(explicit) && explicit > 0 ? Math.floor(explicit) : 0;
  }
  const plan = String(site.billed_plan || "").trim().toLowerCase();
  return PLAN_MONTHLY_YEN[plan] || 0;
}

/**
 * Work out a partner's kickback for one month.
 *
 * `sites` are the rows attributed to this partner. Deciding which rows those
 * are is a question about the account model and is answered by the caller;
 * this only does the arithmetic, which is the part worth testing before any
 * real money exists.
 */
export function calculateKickback({ partner_org_id = null, month = null, sites = [], tiers = DEFAULT_KICKBACK_TIERS } = {}) {
  const table = normalizeTiers(tiers) || DEFAULT_KICKBACK_TIERS;
  const lines = [];
  let excluded = 0;

  for (const site of Array.isArray(sites) ? sites : []) {
    if (!site || typeof site !== "object") continue;
    const revenue = siteRevenueYen(site);
    // A comped site, a free site and a site whose delivery is stopped all pay
    // nothing. They are reported as excluded rather than dropped, so a partner
    // asking "why is this one not on my statement" has an answer.
    if (site.comped || revenue <= 0) {
      excluded += 1;
      continue;
    }
    lines.push({
      site_id: site.site_id || site.id || null,
      billed_plan: String(site.billed_plan || "").trim().toLowerCase() || null,
      revenue_yen: revenue,
    });
  }

  const billableSites = lines.length;
  const grossYen = lines.reduce((total, line) => total + line.revenue_yen, 0);
  const rate = rateForCount(billableSites, table);
  // Floored once on the total rather than per line: rounding each line down
  // separately would lose up to a yen per site every month.
  const payoutYen = Math.floor(grossYen * rate);

  return {
    partner_org_id,
    month,
    billable_sites: billableSites,
    excluded_sites: excluded,
    gross_yen: grossYen,
    rate,
    rate_percent: Math.round(rate * 1000) / 10,
    payout_yen: payoutYen,
    // Stated so a statement can say so in words: this is a calculation, and
    // somebody still has to make the transfer.
    payout_status: "calculated",
    lines: lines.sort((a, b) => b.revenue_yen - a.revenue_yen || String(a.site_id).localeCompare(String(b.site_id))),
    tiers: table,
  };
}
