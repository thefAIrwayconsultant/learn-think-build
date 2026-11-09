const CODE_PATTERN = /^[A-Z0-9-]{4,32}$/;

export function normalizeDiscountCode(value: string): string | null {
  const code = value.trim().toUpperCase();
  return CODE_PATTERN.test(code) ? code : null;
}

export function canRedeemDiscountCode(
  code: { active: boolean; expiresAt: Date | null; useLimit: number | null },
  redeemedCount: number,
  now = new Date(),
): boolean {
  if (!code.active) return false;
  if (code.expiresAt && code.expiresAt.getTime() <= now.getTime()) return false;
  if (code.useLimit !== null && redeemedCount >= code.useLimit) return false;
  return true;
}

const ATTEMPT_LIMIT = 10;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const attemptsByKey = new Map<string, { count: number; resetAt: number }>();

export function allowDiscountCodeAttempt(key: string, now = Date.now()): boolean {
  if (attemptsByKey.size > 5_000) {
    for (const [attemptKey, entry] of attemptsByKey) {
      if (entry.resetAt <= now) attemptsByKey.delete(attemptKey);
    }
  }
  const current = attemptsByKey.get(key);
  if (!current || current.resetAt <= now) {
    attemptsByKey.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return true;
  }
  if (current.count >= ATTEMPT_LIMIT) return false;
  current.count += 1;
  return true;
}
