import { Router, type IRouter } from "express";
import { clerkClient } from "@clerk/express";
import { and, eq, isNull, or } from "drizzle-orm";
import { db, familyDiscountRedemptionsTable, guardiansTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { normalizedEmail, stripeObjectId, verifyStripeSignature } from "../lib/stripe-webhook-utils";

const router: IRouter = Router();

type StripeEventPayload = {
  id?: unknown;
  type?: unknown;
  data?: { object?: unknown };
};

function record(object: unknown): Record<string, unknown> | null {
  return typeof object === "object" && object !== null && !Array.isArray(object)
    ? object as Record<string, unknown>
    : null;
}

function checkoutEmail(session: Record<string, unknown>): string | null {
  const customerDetails = record(session.customer_details);
  return normalizedEmail(customerDetails?.email) ?? normalizedEmail(session.customer_email);
}

async function findGuardianByVerifiedEmail(email: string): Promise<string | null> {
  const users = await clerkClient.users.getUserList({ emailAddress: [email], limit: 10 });
  const matchingIds = new Set(
    users.data
      .filter((user) => user.emailAddresses.some((address) =>
        normalizedEmail(address.emailAddress) === email && address.verification?.status === "verified",
      ))
      .map((user) => user.id),
  );
  return matchingIds.size === 1 ? [...matchingIds][0] : null;
}

async function attachCheckoutToFamily(
  eventId: string,
  session: Record<string, unknown>,
): Promise<void> {
  const email = checkoutEmail(session);
  const stripeCustomerId = stripeObjectId(session.customer);
  const stripeSubscriptionId = stripeObjectId(session.subscription);
  if (session.mode !== "subscription" || !stripeCustomerId || !stripeSubscriptionId) {
    logger.warn({ eventId, mode: session.mode, stripeCustomerId, stripeSubscriptionId }, "Subscription checkout event is missing required identifiers");
    return;
  }
  if (!email) {
    logger.error({ eventId, stripeCustomerId }, "Stripe checkout could not be matched because customer email was missing");
    return;
  }

  let guardianId: string | null;
  try {
    guardianId = await findGuardianByVerifiedEmail(email);
  } catch (error) {
    logger.error({ err: error, eventId, customerEmail: email }, "Could not look up Clerk account for Stripe checkout");
    throw error;
  }
  if (!guardianId) {
    logger.error({ eventId, customerEmail: email }, "Stripe checkout email did not match one verified parent account");
    return;
  }

  const [existingCustomer] = await db.select({ id: guardiansTable.id })
    .from(guardiansTable)
    .where(eq(guardiansTable.stripeCustomerId, stripeCustomerId))
    .limit(1);
  if (existingCustomer && existingCustomer.id !== guardianId) {
    logger.error({ eventId, stripeCustomerId, guardianId: existingCustomer.id }, "Stripe customer is already linked to another family account");
    return;
  }

  const paymentStatus = session.payment_status;
  const subscriptionStatus = paymentStatus === "paid" || paymentStatus === "no_payment_required"
    ? "active"
    : "incomplete";
  await db.insert(guardiansTable).values({
    id: guardianId,
    stripeCustomerId,
    stripeSubscriptionId,
    subscriptionStatus,
  }).onConflictDoUpdate({
    target: guardiansTable.id,
    set: { stripeCustomerId, stripeSubscriptionId, subscriptionStatus },
  });
  logger.info({ eventId, guardianId, stripeCustomerId, stripeSubscriptionId, subscriptionStatus }, "Stripe checkout linked to family account");
}

async function syncSubscription(
  eventId: string,
  subscription: Record<string, unknown>,
  deleted: boolean,
): Promise<void> {
  const stripeCustomerId = stripeObjectId(subscription.customer);
  const stripeSubscriptionId = stripeObjectId(subscription.id);
  if (!stripeCustomerId || !stripeSubscriptionId) {
    logger.warn({ eventId, stripeCustomerId, stripeSubscriptionId }, "Stripe subscription event is missing identifiers");
    return;
  }

  const status = deleted ? "canceled" : typeof subscription.status === "string" ? subscription.status : "unknown";
  const [updated] = await db.update(guardiansTable)
    .set({ subscriptionStatus: status })
    .where(and(
      eq(guardiansTable.stripeCustomerId, stripeCustomerId),
      or(eq(guardiansTable.stripeSubscriptionId, stripeSubscriptionId), isNull(guardiansTable.stripeSubscriptionId)),
    ))
    .returning({ id: guardiansTable.id });
  if (!updated) {
    logger.warn({ eventId, stripeCustomerId, stripeSubscriptionId, status }, "Stripe subscription update did not match a family account");
    return;
  }
  if (!deleted) {
    await db.update(guardiansTable).set({ stripeSubscriptionId })
      .where(eq(guardiansTable.id, updated.id));
  }
  logger.info({ eventId, guardianId: updated.id, stripeCustomerId, stripeSubscriptionId, status }, "Stripe subscription status synchronized");
}

router.post("/", async (req, res): Promise<void> => {
  const eventId = `unverified:${Date.now()}`;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.header("stripe-signature");
  if (!secret) {
    logger.error({ path: req.originalUrl }, "Stripe webhook signing secret is not configured");
    res.status(500).json({ error: "Webhook signing is not configured." });
    return;
  }
  if (!Buffer.isBuffer(req.body) || !verifyStripeSignature(req.body, signature, secret)) {
    logger.warn({ signaturePresent: Boolean(signature) }, "Rejected Stripe webhook with invalid signature");
    res.status(400).json({ error: "Invalid Stripe signature." });
    return;
  }

  let event: StripeEventPayload;
  try {
    event = JSON.parse(req.body.toString("utf8")) as StripeEventPayload;
  } catch {
    res.status(400).json({ error: "Invalid webhook payload." });
    return;
  }
  const verifiedEventId = typeof event.id === "string" ? event.id : eventId;
  const eventType = typeof event.type === "string" ? event.type : "unknown";
  logger.info({ eventId: verifiedEventId, eventType }, "Received verified Stripe webhook");
  const object = record(event.data?.object);
  if (!object) {
    res.status(400).json({ error: "Webhook event data is missing." });
    return;
  }

  try {
    if (eventType === "checkout.session.completed") {
      await attachCheckoutToFamily(verifiedEventId, object);
    } else if (eventType === "customer.subscription.updated") {
      await syncSubscription(verifiedEventId, object, false);
    } else if (eventType === "customer.subscription.deleted") {
      await syncSubscription(verifiedEventId, object, true);
    }
  } catch (error) {
    logger.error({ err: error, eventId: verifiedEventId, eventType }, "Stripe webhook processing failed");
    res.status(500).json({ error: "Could not process Stripe event." });
    return;
  }
  res.json({ received: true });
});

export default router;
