import assert from "node:assert/strict";
import test from "node:test";
import { getFamilyCheckoutUrl, STRIPE_PAYMENT_LINK } from "../src/billing.ts";

test("family checkout uses the existing Stripe payment link and prefills a signed-in parent's email", () => {
  assert.equal(getFamilyCheckoutUrl(), STRIPE_PAYMENT_LINK);
  const checkout = new URL(getFamilyCheckoutUrl("  parent+family@example.com "));
  assert.equal(checkout.origin + checkout.pathname, STRIPE_PAYMENT_LINK);
  assert.equal(checkout.searchParams.get("prefilled_email"), "parent+family@example.com");
});
