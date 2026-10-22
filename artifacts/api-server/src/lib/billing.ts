import { stripeRequest } from "../stripeClient";

const PRODUCT_NAME = "AI Explorer Family Plan";
const PRICE_AMOUNT = 7999;
const PRICE_CURRENCY = "usd";

export type StripePrice = {
  id: string;
  unit_amount: number | null;
  currency: string;
  recurring?: { interval: string } | null;
};

type StripeProduct = {
  id: string;
  name: string;
  metadata: Record<string, string>;
};

type StripeSubscription = {
  status: string;
  created: number;
  cancel_at_period_end: boolean;
  items: { data: Array<{ current_period_end?: number }> };
};

type StripePortalConfiguration = {
  id: string;
  active: boolean;
  metadata: Record<string, string>;
};

export type FamilySubscription = {
  status:
    | "active"
    | "trialing"
    | "past_due"
    | "unpaid"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
    | "paused";
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export async function getFamilySubscription(
  customerId: string,
): Promise<FamilySubscription | null> {
  const query = new URLSearchParams({
    customer: customerId,
    status: "all",
    limit: "100",
  });
  const result = await stripeRequest<{ data: StripeSubscription[] }>(
    `/v1/subscriptions?${query.toString()}`,
  );

  const subscriptions = [...result.data].sort((a, b) => b.created - a.created);
  const current =
    subscriptions.find(
      (item) => item.status === "active" || item.status === "trialing",
    ) ?? subscriptions[0];

  if (!current) return null;

  const validStatuses = [
    "active",
    "trialing",
    "past_due",
    "unpaid",
    "canceled",
    "incomplete",
    "incomplete_expired",
    "paused",
  ] as const;
  const status = validStatuses.includes(
    current.status as (typeof validStatuses)[number],
  )
    ? (current.status as FamilySubscription["status"])
    : "incomplete";
  const periodEnd = current.items.data[0]?.current_period_end;

  return {
    status,
    periodEnd:
      periodEnd !== undefined
        ? new Date(periodEnd * 1000).toISOString()
        : null,
    cancelAtPeriodEnd: current.cancel_at_period_end,
  };
}

export async function getFamilyPrice(): Promise<StripePrice> {
  const search = new URLSearchParams({
    query: `name:'${PRODUCT_NAME}' AND active:'true'`,
  });
  const products = await stripeRequest<{ data: StripeProduct[] }>(
    `/v1/products/search?${search.toString()}`,
  );
  const product = products.data.find(
    (item) => item.name === PRODUCT_NAME && item.metadata.app === "ai-explorer",
  );

  if (!product) {
    throw new Error("The AI Explorer Family Plan is not configured in Stripe.");
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
      item.unit_amount === PRICE_AMOUNT &&
      item.currency === PRICE_CURRENCY &&
      item.recurring?.interval === "year",
  );

  if (!price) {
    throw new Error(
      "The $79.99 USD annual AI Explorer Family Plan price is not configured in Stripe.",
    );
  }

  return price;
}

export async function getFamilyPortalConfigurationId(): Promise<string> {
  const query = new URLSearchParams({ limit: "100" });
  const configurations = await stripeRequest<{
    data: StripePortalConfiguration[];
  }>(`/v1/billing_portal/configurations?${query.toString()}`);
  const configuration = configurations.data.find(
    (item) => item.active && item.metadata.app === "ai-explorer",
  );

  if (!configuration) {
    throw new Error(
      "The AI Explorer billing portal is not configured in Stripe.",
    );
  }

  return configuration.id;
}

export function hasLearningAccess(
  subscription: FamilySubscription | null,
): boolean {
  return (
    subscription?.status === "active" || subscription?.status === "trialing"
  );
}
