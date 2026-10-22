import { clerkClient } from "@clerk/express";

const ADMIN_CACHE_MS = 2 * 60 * 1000;
const adminCache = new Map<string, { value: boolean; expiresAt: number }>();

function cacheAdminResult(userId: string, value: boolean) {
  const now = Date.now();
  for (const [id, entry] of adminCache) {
    if (entry.expiresAt <= now) adminCache.delete(id);
  }
  if (adminCache.size >= 1000) adminCache.clear();
  adminCache.set(userId, { value, expiresAt: now + ADMIN_CACHE_MS });
}

export function matchesTestingAdminEmail(email: string | undefined, verified: boolean, configuredEmail: string | undefined) {
  const actual = email?.trim().toLowerCase();
  const allowed = configuredEmail?.trim().toLowerCase();
  return Boolean(verified && actual && allowed && actual === allowed);
}

export async function isTestingAdmin(userId: string | null | undefined): Promise<boolean> {
  const configuredEmail = process.env.LTB_TEST_ADMIN_EMAIL;
  if (!userId || !configuredEmail?.trim()) return false;

  const cached = adminCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const user = await clerkClient.users.getUser(userId);
    const primaryEmail = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId);
    const value = matchesTestingAdminEmail(
      primaryEmail?.emailAddress,
      primaryEmail?.verification?.status === "verified",
      configuredEmail,
    );
    cacheAdminResult(userId, value);
    return value;
  } catch {
    // Fail closed: a Clerk lookup error must never grant testing access.
    cacheAdminResult(userId, false);
    return false;
  }
}
