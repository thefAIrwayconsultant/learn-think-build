import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, guardiansTable } from "@workspace/db";
import {
  CreateBillingPortalSessionResponse,
  CreateCheckoutSessionResponse,
} from "@workspace/api-zod";
import {
  getFamilyPortalConfigurationId,
  getFamilyPrice,
  getFamilySubscription,
  hasLearningAccess,
} from "../lib/billing";
import { stripeRequest } from "../stripeClient";

const router: IRouter = Router();

function getGuardianId(req: Parameters<typeof getAuth>[0]): string | null {
  return getAuth(req).userId ?? null;
}

async function ensureGuardian(id: string) {
  await db.insert(guardiansTable).values({ id }).onConflictDoNothing();
  const [guardian] = await db
    .select()
    .from(guardiansTable)
    .where(eq(guardiansTable.id, id))
    .limit(1);
  return guardian;
}

function familyUrl(req: Parameters<typeof getAuth>[0], path: string): string {
  const configuredDomain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  const host = configuredDomain || req.get("host");
  if (!host) throw new Error("Could not determine the app's public host.");
  const protocol =
    host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https";
  return `${protocol}://${host}${path}`;
}

router.post("/billing/checkout", async (req, res): Promise<void> => {
  const guardianId = getGuardianId(req);
  if (!guardianId) {
    res.status(401).json({ error: "Sign in with a parent or guardian account." });
    return;
  }

  const guardian = await ensureGuardian(guardianId);
  if (!guardian) {
    res.status(500).json({ error: "Could not load the family account." });
    return;
  }

  const subscription = guardian.stripeCustomerId
    ? await getFamilySubscription(guardian.stripeCustomerId)
    : null;
  if (hasLearningAccess(subscription)) {
    res.status(409).json({ error: "This family already has an active plan." });
    return;
  }
  if (
    subscription &&
    ["past_due", "unpaid"].includes(subscription.status)
  ) {
    res.status(409).json({
      error: "Update the payment method for the existing family plan first.",
    });
    return;
  }

  const customer =
    guardian.stripeCustomerId
      ? { id: guardian.stripeCustomerId }
      : await stripeRequest<{ id: string }>("/v1/customers", {
          method: "POST",
          body: new URLSearchParams({
            "metadata[clerkUserId]": guardianId,
            "metadata[app]": "ai-explorer",
          }),
        });

  if (!guardian.stripeCustomerId) {
    await db
      .update(guardiansTable)
      .set({ stripeCustomerId: customer.id })
      .where(eq(guardiansTable.id, guardianId));
  }

  const price = await getFamilyPrice();
  const sessionBody = new URLSearchParams({
    mode: "subscription",
    customer: customer.id,
    client_reference_id: guardianId,
    "line_items[0][price]": price.id,
    "line_items[0][quantity]": "1",
    "subscription_data[metadata][clerkUserId]": guardianId,
    "subscription_data[metadata][app]": "ai-explorer",
    success_url: familyUrl(req, "/family?checkout=success"),
    cancel_url: familyUrl(req, "/family?checkout=cancelled"),
  });
  const session = await stripeRequest<{ url: string | null }>(
    "/v1/checkout/sessions",
    { method: "POST", body: sessionBody },
  );

  if (!session.url) {
    res.status(502).json({ error: "Stripe did not return a checkout link." });
    return;
  }

  res.json(CreateCheckoutSessionResponse.parse({ url: session.url }));
});

router.post("/billing/portal", async (req, res): Promise<void> => {
  const guardianId = getGuardianId(req);
  if (!guardianId) {
    res.status(401).json({ error: "Sign in with a parent or guardian account." });
    return;
  }

  const guardian = await ensureGuardian(guardianId);
  if (!guardian?.stripeCustomerId) {
    res.status(404).json({ error: "No subscription account was found." });
    return;
  }

  const session = await stripeRequest<{ url: string }>(
    "/v1/billing_portal/sessions",
    {
      method: "POST",
      body: new URLSearchParams({
        customer: guardian.stripeCustomerId,
        configuration: await getFamilyPortalConfigurationId(),
        return_url: familyUrl(req, "/family"),
      }),
    },
  );
  res.json(
    CreateBillingPortalSessionResponse.parse({ url: session.url }),
  );
});

export default router;
