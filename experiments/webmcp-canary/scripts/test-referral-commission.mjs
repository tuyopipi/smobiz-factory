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

// The basis is the NET JPY of the charge's balance transaction (after Stripe
// fees), for JPY and non-JPY invoices alike; invoice.amount_paid is never used.
const { referralPaidYen } = await import("../worker/api.mjs");
const calls = [];
const fake = (routes) => async (_secret, path) => { calls.push(path); for (const [prefix, data] of routes) if (path.startsWith(prefix)) return { ok: true, data }; return { ok: false, data: {} }; };
let r = await referralPaidYen("sk", { id: "in_1", currency: "jpy", amount_paid: 3000, charge: "ch_1" }, { get: fake([
  ["/v1/charges/ch_1", { balance_transaction: { currency: "jpy", amount: 3000, fee: 108, net: 2892, available_on: 1790000000 } }],
]) });
assert.deepEqual(r, { amountYen: 2892, chargeId: "ch_1", availableAt: 1790000000000 });
assert.equal(referralCommissionYen(r.amountYen, "jpy"), 1156, "JPY 3,000 with a 108 fee -> net 2,892 -> 1,156");
r = await referralPaidYen("sk", { id: "in_2", currency: "usd", amount_paid: 9900 }, { get: fake([
  ["/v1/invoice_payments", { data: [{ status: "paid", payment: { type: "charge", charge: "ch_2" } }] }],
  ["/v1/charges/ch_2", { balance_transaction: { currency: "jpy", amount: 15123, fee: 545, net: 14578, available_on: 1790000000 } }],
]) });
assert.deepEqual(r, { amountYen: 14578, chargeId: "ch_2", availableAt: 1790000000000 });
assert.equal(referralCommissionYen(r.amountYen, "jpy"), 5831, "USD invoice: 40% of the net JPY settled");
r = await referralPaidYen("sk", { id: "in_3", currency: "eur", amount_paid: 9000 }, { get: fake([]) });
assert.deepEqual(r, { amountYen: null, chargeId: null, availableAt: null }, "unknown charge: not known yet, never guessed");
r = await referralPaidYen("sk", { id: "in_4", currency: "jpy", amount_paid: 3000, charge: "ch_4" }, { get: fake([
  ["/v1/charges/ch_4", { balance_transaction: "txn_not_expanded" }],
]) });
assert.equal(r.amountYen, null, "a JPY invoice without a readable fee is held too, not paid on amount_paid");
assert.equal(r.chargeId, "ch_4");
console.log("referral net-basis tests passed");
