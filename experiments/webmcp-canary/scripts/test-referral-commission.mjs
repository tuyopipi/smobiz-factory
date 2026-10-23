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
