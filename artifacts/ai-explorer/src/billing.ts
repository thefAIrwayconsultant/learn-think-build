export const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/6oU9AV7Vf1xW1Rr0ju2sM00";

export function getFamilyCheckoutUrl(email?: string | null): string {
  const url = new URL(STRIPE_PAYMENT_LINK);
  if (email?.trim()) url.searchParams.set("prefilled_email", email.trim());
  return url.toString();
}
