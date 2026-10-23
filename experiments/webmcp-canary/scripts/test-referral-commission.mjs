import assert from "node:assert/strict";
import { REFERRAL_SHARE, referralCommissionYen } from "../worker/api.mjs";

assert.equal(REFERRAL_SHARE, 0.4);
assert.equal(referralCommissionYen(3000, "jpy"), 1200, "Standard pays the partner 40%");
assert.equal(referralCommissionYen(14800, "jpy"), 5920, "Pro pays the partner 40%");
assert.equal(referralCommissionYen(1499, "JPY"), 599, "rounded down, never over 40%");
assert.equal(referralCommissionYen(0, "jpy"), 0, "a zero invoice (coupon) pays nothing");
assert.equal(referralCommissionYen(2000, "usd"), 0, "only JPY invoices are shared");
assert.equal(referralCommissionYen(undefined, "jpy"), 0);
console.log("referral commission tests passed");

// Non-JPY invoices: 40% of the JPY Stripe settled for the charge.
const { referralPaidYen } = await import("../worker/api.mjs");
const calls = [];
const fake = (routes) => async (_secret, path) => { calls.push(path); for (const [prefix, data] of routes) if (path.startsWith(prefix)) return { ok: true, data }; return { ok: false, data: {} }; };
let r = await referralPaidYen("sk", { id: "in_1", currency: "jpy", amount_paid: 14800, charge: "ch_1" }, { get: fake([]) });
assert.deepEqual(r, { amountYen: 14800, chargeId: "ch_1" });
r = await referralPaidYen("sk", { id: "in_2", currency: "usd", amount_paid: 9900 }, { get: fake([
  ["/v1/invoice_payments", { data: [{ status: "paid", payment: { type: "charge", charge: "ch_2" } }] }],
  ["/v1/charges/ch_2", { balance_transaction: { currency: "jpy", amount: 15123 } }],
]) });
assert.deepEqual(r, { amountYen: 15123, chargeId: "ch_2" });
assert.equal(referralCommissionYen(r.amountYen, "jpy"), 6049);
r = await referralPaidYen("sk", { id: "in_3", currency: "eur", amount_paid: 9000 }, { get: fake([]) });
assert.deepEqual(r, { amountYen: 0, chargeId: null }, "unknown charge pays nothing rather than guessing");
console.log("referral non-JPY tests passed");
