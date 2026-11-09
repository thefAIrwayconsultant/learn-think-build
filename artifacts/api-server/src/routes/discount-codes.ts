import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { and, count, desc, eq } from "drizzle-orm";
import {
  CreateDiscountCodeBody,
  CreateDiscountCodeResponse,
  ListDiscountCodesResponse,
  RedeemDiscountCodeBody,
  RedeemDiscountCodeResponse,
  SetDiscountCodeActiveBody,
  SetDiscountCodeActiveParams,
  SetDiscountCodeActiveResponse,
} from "@workspace/api-zod";
import {
  db,
  discountCodesTable,
  familyDiscountRedemptionsTable,
  guardiansTable,
} from "@workspace/db";
import { allowDiscountCodeAttempt, canRedeemDiscountCode, normalizeDiscountCode } from "../lib/discount-codes";
import { isTestingAdmin } from "../lib/testing-admin";

const router: IRouter = Router();

function accessFromRedemption(redemption: {
  code: string;
  label: string;
  discountPercent: number;
  redeemedAt: Date;
}) {
  return {
    freeAccess: true,
    code: redemption.code,
    label: redemption.label,
    discountPercent: redemption.discountPercent,
    redeemedAt: redemption.redeemedAt.toISOString(),
  };
}

router.post("/family/redeem-code", async (req, res): Promise<void> => {
  const guardianId = getAuth(req).userId;
  if (!guardianId) {
    res.status(401).json({ error: "Sign in with a parent or guardian account." });
    return;
  }
  const parsed = RedeemDiscountCodeBody.safeParse(req.body);
  const code = parsed.success ? normalizeDiscountCode(parsed.data.code) : null;
  if (!code) {
    res.status(400).json({ error: "Enter a valid access code." });
    return;
  }
  if (!allowDiscountCodeAttempt(guardianId)) {
    res.status(429).json({ error: "Too many code attempts. Please wait a few minutes and try again." });
    return;
  }

  await db.insert(guardiansTable).values({ id: guardianId }).onConflictDoNothing();
  const result = await db.transaction(async (tx) => {
    await tx.select({ id: guardiansTable.id }).from(guardiansTable)
      .where(eq(guardiansTable.id, guardianId)).limit(1).for("update");

    const [existing] = await tx.select({
      code: discountCodesTable.code,
      label: discountCodesTable.label,
      discountPercent: discountCodesTable.discountPercent,
      redeemedAt: familyDiscountRedemptionsTable.redeemedAt,
    })
      .from(familyDiscountRedemptionsTable)
      .innerJoin(discountCodesTable, eq(familyDiscountRedemptionsTable.codeId, discountCodesTable.id))
      .where(eq(familyDiscountRedemptionsTable.guardianId, guardianId))
      .limit(1);
    if (existing) {
      return existing.code === code
        ? { kind: "access" as const, access: accessFromRedemption(existing) }
        : { kind: "already-redeemed" as const };
    }

    const [discountCode] = await tx.select().from(discountCodesTable)
      .where(eq(discountCodesTable.code, code)).limit(1).for("update");
    if (!discountCode) return { kind: "invalid" as const };

    const [usage] = await tx.select({ redeemedCount: count().mapWith(Number) })
      .from(familyDiscountRedemptionsTable)
      .where(eq(familyDiscountRedemptionsTable.codeId, discountCode.id));
    if (!canRedeemDiscountCode(discountCode, usage?.redeemedCount ?? 0)) {
      return { kind: "invalid" as const };
    }

    const [redemption] = await tx.insert(familyDiscountRedemptionsTable)
      .values({ guardianId, codeId: discountCode.id })
      .returning({ redeemedAt: familyDiscountRedemptionsTable.redeemedAt });
    return {
      kind: "access" as const,
      access: accessFromRedemption({ ...discountCode, redeemedAt: redemption.redeemedAt }),
    };
  });

  if (result.kind === "invalid") {
    res.status(400).json({ error: "That code is unavailable. Check the code or ask the person who shared it." });
    return;
  }
  if (result.kind === "already-redeemed") {
    res.status(409).json({ error: "This family account has already redeemed an access code." });
    return;
  }
  res.json(RedeemDiscountCodeResponse.parse(result.access));
});

router.get("/admin/discount-codes", async (req, res): Promise<void> => {
  const guardianId = getAuth(req).userId;
  if (!(await isTestingAdmin(guardianId))) {
    res.status(403).json({ error: "Owner access required." });
    return;
  }
  const rows = await db.select({
    id: discountCodesTable.id,
    code: discountCodesTable.code,
    label: discountCodesTable.label,
    discountPercent: discountCodesTable.discountPercent,
    useLimit: discountCodesTable.useLimit,
    expiresAt: discountCodesTable.expiresAt,
    active: discountCodesTable.active,
    createdAt: discountCodesTable.createdAt,
    redeemedCount: count().mapWith(Number),
  }).from(discountCodesTable)
    .leftJoin(familyDiscountRedemptionsTable, eq(discountCodesTable.id, familyDiscountRedemptionsTable.codeId))
    .groupBy(discountCodesTable.id)
    .orderBy(desc(discountCodesTable.createdAt));
  res.json(ListDiscountCodesResponse.parse({ codes: rows }));
});

router.post("/admin/discount-codes", async (req, res): Promise<void> => {
  const guardianId = getAuth(req).userId;
  if (!(await isTestingAdmin(guardianId))) {
    res.status(403).json({ error: "Owner access required." });
    return;
  }
  const parsed = CreateDiscountCodeBody.safeParse(req.body);
  if (!parsed.success || !guardianId) {
    res.status(400).json({ error: "Check the code details and try again." });
    return;
  }
  const code = normalizeDiscountCode(parsed.data.code);
  const label = parsed.data.label.trim();
  if (!code || !label) {
    res.status(400).json({ error: "Enter a code and a short label." });
    return;
  }
  try {
    const [created] = await db.insert(discountCodesTable).values({
      code,
      label,
      discountPercent: parsed.data.discountPercent,
      useLimit: parsed.data.useLimit ?? null,
      expiresAt: parsed.data.expiresAt ?? null,
      createdBy: guardianId,
    }).returning();
    res.status(201).json(CreateDiscountCodeResponse.parse({ ...created, redeemedCount: 0 }));
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      res.status(409).json({ error: "That code word already exists. Choose another." });
      return;
    }
    throw error;
  }
});

router.patch("/admin/discount-codes/:codeId/active", async (req, res): Promise<void> => {
  const guardianId = getAuth(req).userId;
  if (!(await isTestingAdmin(guardianId))) {
    res.status(403).json({ error: "Owner access required." });
    return;
  }
  const params = SetDiscountCodeActiveParams.safeParse(req.params);
  const body = SetDiscountCodeActiveBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid code update." });
    return;
  }
  const [updated] = await db.update(discountCodesTable).set({ active: body.data.active })
    .where(and(eq(discountCodesTable.id, params.data.codeId)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Discount code not found." });
    return;
  }
  const [usage] = await db.select({ redeemedCount: count().mapWith(Number) })
    .from(familyDiscountRedemptionsTable)
    .where(eq(familyDiscountRedemptionsTable.codeId, updated.id));
  res.json(SetDiscountCodeActiveResponse.parse({ ...updated, redeemedCount: usage?.redeemedCount ?? 0 }));
});

export default router;
