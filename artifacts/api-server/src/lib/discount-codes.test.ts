import assert from "node:assert/strict";
import test from "node:test";
import { allowDiscountCodeAttempt, canRedeemDiscountCode, normalizeDiscountCode } from "./discount-codes";

test("normalizes code words while rejecting unsupported characters and lengths", () => {
  assert.equal(normalizeDiscountCode("  friend-2026  "), "FRIEND-2026");
  assert.equal(normalizeDiscountCode("abc"), null);
  assert.equal(normalizeDiscountCode("friend access"), null);
  assert.equal(normalizeDiscountCode("x".repeat(33)), null);
});

test("redemption eligibility respects active state, expiry, and use limits", () => {
  const now = new Date("2026-11-09T12:00:00Z");
  assert.equal(canRedeemDiscountCode({ active: true, expiresAt: null, useLimit: null }, 100, now), true);
  assert.equal(canRedeemDiscountCode({ active: false, expiresAt: null, useLimit: null }, 0, now), false);
  assert.equal(canRedeemDiscountCode({ active: true, expiresAt: new Date("2026-11-09T11:59:59Z"), useLimit: null }, 0, now), false);
  assert.equal(canRedeemDiscountCode({ active: true, expiresAt: now, useLimit: null }, 0, now), false);
  assert.equal(canRedeemDiscountCode({ active: true, expiresAt: null, useLimit: 2 }, 1, now), true);
  assert.equal(canRedeemDiscountCode({ active: true, expiresAt: null, useLimit: 2 }, 2, now), false);
});

test("limits repeated code guesses per signed-in family", () => {
  const key = "discount-test-family";
  const start = 1_000_000;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    assert.equal(allowDiscountCodeAttempt(key, start + attempt), true);
  }
  assert.equal(allowDiscountCodeAttempt(key, start + 11), false);
  assert.equal(allowDiscountCodeAttempt(key, start + 10 * 60 * 1000), true);
});
