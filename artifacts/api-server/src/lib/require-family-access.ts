import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";
import { and, eq } from "drizzle-orm";
import { db, familyDiscountRedemptionsTable, guardiansTable } from "@workspace/db";

export const requireFamilyAccess: RequestHandler<{ childId: string }> = async (req, res, next) => {
  const guardianId = getAuth(req).userId;
  if (!guardianId) {
    res.status(401).json({ error: "Sign in with a parent or guardian account." });
    return;
  }

  const [guardian] = await db.select({ subscriptionStatus: guardiansTable.subscriptionStatus })
    .from(guardiansTable)
    .where(eq(guardiansTable.id, guardianId))
    .limit(1);
  if (guardian?.subscriptionStatus === "active") {
    next();
    return;
  }

  const [redemption] = await db.select({ id: familyDiscountRedemptionsTable.id })
    .from(familyDiscountRedemptionsTable)
    .where(eq(familyDiscountRedemptionsTable.guardianId, guardianId))
    .limit(1);
  if (redemption) {
    next();
    return;
  }

  res.status(403).json({ error: "An active family plan or access code is needed to open learning content." });
};
