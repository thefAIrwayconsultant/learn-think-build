import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { normalizedEmail, stripeObjectId, verifyStripeSignature } from "./stripe-webhook-utils";

test("Stripe webhook signature verification accepts fresh signatures and rejects invalid or stale ones", () => {
  const secret = "whsec_test_only";
  const timestamp = 1_800_000_000;
  const now = timestamp * 1000;
  const payload = Buffer.from('{"id":"evt_test","type":"checkout.session.completed"}', "utf8");
  const signature = createHmac("sha256", secret)
    .update(Buffer.concat([Buffer.from(`${timestamp}.`, "utf8"), payload]))
    .digest("hex");

  assert.equal(verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, secret, now), true);
  assert.equal(verifyStripeSignature(payload, `t=${timestamp},v1=${"0".repeat(64)}`, secret, now), false);
  assert.equal(verifyStripeSignature(payload, `t=${timestamp - 301},v1=${signature}`, secret, now), false);
  assert.equal(verifyStripeSignature(payload, undefined, secret, now), false);
});

test("Stripe webhook utilities normalize email and extract object ids", () => {
  assert.equal(normalizedEmail("  Parent@Example.com "), "parent@example.com");
  assert.equal(normalizedEmail(" "), null);
  assert.equal(stripeObjectId("cus_123"), "cus_123");
  assert.equal(stripeObjectId({ id: "sub_123" }), "sub_123");
  assert.equal(stripeObjectId({ id: 123 }), null);
});
