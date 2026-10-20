export function referralConfig(env = {}) {
  const rateBp = Number(env.REFERRAL_RATE_BP ?? 4000);
  const durationMonths = env.REFERRAL_DURATION_MONTHS == null || env.REFERRAL_DURATION_MONTHS === '' ? null : Number(env.REFERRAL_DURATION_MONTHS);
  if (!Number.isInteger(rateBp) || rateBp < 0 || rateBp > 10000 || (durationMonths !== null && (!Number.isInteger(durationMonths) || durationMonths < 1))) throw new Error('invalid_referral_config');
  return { rateBp, durationMonths };
}
export function periodBounds(period) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw new Error('invalid_period');
  const start = Date.parse(period + '-01T00:00:00Z');
  const end = new Date(start); end.setUTCMonth(end.getUTCMonth() + 1);
  if (end.getTime() > Date.now()) throw new Error('period_not_closed');
  return { start: start / 1000, end: end.getTime() / 1000 };
}
export function previousMonth(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
}
