import { ReplitConnectors } from "@replit/connectors-sdk";

const PRODUCT_NAME = "AI Explorer Family Plan";
const MONTHLY_AMOUNT = 999;
const CURRENCY = "usd";
const connectors = new ReplitConnectors();

type StripeProduct = { id: string; name: string; metadata: Record<string, string> };
type StripePrice = {
  id: string;
  unit_amount: number | null;
  currency: string;
  recurring?: { interval: string } | null;
};
type PortalConfiguration = {
  id: string;
  active: boolean;
  metadata: Record<string, string>;
  features: {
    subscription_cancel?: { enabled?: boolean; mode?: string };
    invoice_history?: { enabled?: boolean };
    payment_method_update?: { enabled?: boolean };
  };
};

async function stripeRequest<T>(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: URLSearchParams,
  idempotencyKey?: string,
): Promise<T> {
  const response = await connectors.proxy("stripe", path, {
    method,
    ...(body
      ? {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            ...(idempotencyKey
              ? { "Idempotency-Key": idempotencyKey }
              : {}),
          },
          body: body.toString(),
        }
      : {}),
  });
  const payload = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | T
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object"
        ? (payload as { error?: { message?: string } }).error?.message
        : undefined;
    throw new Error(message ?? `Stripe request failed (${response.status}).`);
  }
  if (!payload) throw new Error("Stripe returned an empty response.");
  return payload as T;
}

async function ensureBillingPortalConfiguration(): Promise<void> {
  const query = new URLSearchParams({ limit: "100" });
  const configurations = await stripeRequest<{
    data: PortalConfiguration[];
  }>(`/v1/billing_portal/configurations?${query.toString()}`);
  const existing = configurations.data.find(
    (item) => item.metadata.app === "ai-explorer",
  );
  const portalBody = new URLSearchParams({
    name: "AI Explorer Family Portal",
    "features[subscription_cancel][enabled]": "true",
    "features[subscription_cancel][mode]": "at_period_end",
    "features[subscription_cancel][proration_behavior]": "none",
    "features[invoice_history][enabled]": "true",
    "features[payment_method_update][enabled]": "true",
    "metadata[app]": "ai-explorer",
  });

  if (
    existing?.active &&
    existing?.features.subscription_cancel?.enabled &&
    existing.features.subscription_cancel.mode === "at_period_end" &&
    existing.features.invoice_history?.enabled &&
    existing.features.payment_method_update?.enabled
  ) {
    console.info("Stripe billing portal already allows cancellation and invoice history.");
    return;
  }

  const path = existing
    ? `/v1/billing_portal/configurations/${existing.id}`
    : "/v1/billing_portal/configurations";
  if (existing) portalBody.set("active", "true");
  const configured = await stripeRequest<PortalConfiguration>(
    path,
    "POST",
    portalBody,
    existing
      ? "ai-explorer-family-portal-config-update-v1"
      : "ai-explorer-family-portal-config-create-v1",
  );
  console.info(
    `Stripe billing portal is ready for subscription management (${configured.id}).`,
  );
}

async function main(): Promise<void> {
  const searchQuery = new URLSearchParams({
    query: `name:'${PRODUCT_NAME}' AND active:'true'`,
  });
  const search = await stripeRequest<{ data: StripeProduct[] }>(
    `/v1/products/search?${searchQuery.toString()}`,
  );

  let product = search.data.find(
    (item) => item.name === PRODUCT_NAME && item.metadata.app === "ai-explorer",
  );

  if (!product) {
    product = await stripeRequest<StripeProduct>(
      "/v1/products",
      "POST",
      new URLSearchParams({
        name: PRODUCT_NAME,
        description:
          "Monthly access for a family to AI Explorer's age-appropriate AI lessons and learner profiles.",
        "metadata[app]": "ai-explorer",
        "metadata[audience]": "parent-or-guardian",
      }),
      "ai-explorer-family-plan-product-v1",
    );
  }

  const priceQuery = new URLSearchParams({
    product: product.id,
    active: "true",
    limit: "100",
  });
  const prices = await stripeRequest<{ data: StripePrice[] }>(
    `/v1/prices?${priceQuery.toString()}`,
  );
  const price = prices.data.find(
    (item) =>
      item.unit_amount === MONTHLY_AMOUNT &&
      item.currency === CURRENCY &&
      item.recurring?.interval === "month",
  );

  if (price) {
    console.info(
      `AI Explorer Family Plan already has the $9.99 USD monthly price (${price.id}).`,
    );
  } else {
    const createdPrice = await stripeRequest<StripePrice>(
      "/v1/prices",
      "POST",
      new URLSearchParams({
        product: product.id,
        unit_amount: String(MONTHLY_AMOUNT),
        currency: CURRENCY,
        "recurring[interval]": "month",
        "metadata[app]": "ai-explorer",
      }),
      "ai-explorer-family-plan-usd-999-monthly-v1",
    );

    console.info(
      `Created the $9.99 USD monthly price for AI Explorer Family Plan (${createdPrice.id}).`,
    );
  }

  await ensureBillingPortalConfiguration();
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown Stripe error";
  console.error(`Could not create the AI Explorer subscription plan: ${message}`);
  process.exitCode = 1;
});
