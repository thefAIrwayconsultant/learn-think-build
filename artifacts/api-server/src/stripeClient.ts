import { ReplitConnectors } from "@replit/connectors-sdk";

const connectors = new ReplitConnectors();

type StripeRequestOptions = {
  method?: "GET" | "POST";
  body?: URLSearchParams;
};

export async function stripeRequest<T>(
  path: string,
  options: StripeRequestOptions = {},
): Promise<T> {
  const response = await connectors.proxy("stripe", path, {
    method: options.method ?? "GET",
    ...(options.body
      ? {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: options.body.toString(),
        }
      : {}),
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | T
    | null;
  if (!response.ok) {
    const stripeMessage =
      payload && typeof payload === "object"
        ? (payload as { error?: { message?: string } }).error?.message
        : undefined;
    throw new Error(
      stripeMessage ?? `Stripe request failed with status ${response.status}.`,
    );
  }
  if (!payload) throw new Error("Stripe returned an empty response.");
  return payload as T;
}
