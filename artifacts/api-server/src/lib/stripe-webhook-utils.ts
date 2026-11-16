import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyStripeSignature(
  payload: Buffer,
  signatureHeader: string | undefined,
  secret: string,
  nowMs = Date.now(),
  toleranceSeconds = 300,
): boolean {
  if (!signatureHeader || !secret) return false;

  const parts = signatureHeader.split(",").map((part) => part.trim().split("=", 2));
  const timestampValue = parts.find(([key]) => key === "t")?.[1];
  const timestamp = Number(timestampValue);
  if (!Number.isInteger(timestamp) || Math.abs(Math.floor(nowMs / 1000) - timestamp) > toleranceSeconds) {
    return false;
  }

  const signedPayload = Buffer.concat([Buffer.from(`${timestamp}.`, "utf8"), payload]);
  const expected = createHmac("sha256", secret).update(signedPayload).digest();
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  return signatures.some((signature) => {
    if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
    const received = Buffer.from(signature, "hex");
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
}

export function normalizedEmail(value: unknown): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim().toLowerCase()
    : null;
}

export function stripeObjectId(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  if (typeof value === "object" && value !== null && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" && id ? id : null;
  }
  return null;
}
