import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import {
  and,
  asc,
  eq,
  inArray,
} from "drizzle-orm";
import {
  childProfilesTable,
  childProgressTable,
  db,
  guardiansTable,
} from "@workspace/db";
import {
  CompleteChildLessonBody,
  CompleteChildLessonParams,
  CreateChildProfileBody,
  CreateChildProfileResponse,
  DeleteChildProfileParams,
  GetFamilyResponse,
  CompleteChildLessonResponse,
} from "@workspace/api-zod";
import {
  getFamilySubscription,
  hasLearningAccess,
} from "../lib/billing";

const router: IRouter = Router();
const validLessonIds = new Set([
  "what-is-ai",
  "clear-instructions",
  "check-the-answer",
  "privacy-safe-use",
]);

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

async function loadSubscription(customerId: string | null) {
  if (!customerId) return null;
  return getFamilySubscription(customerId);
}

router.get("/family", async (req, res): Promise<void> => {
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

  const [profiles, subscription] = await Promise.all([
    db
      .select()
      .from(childProfilesTable)
      .where(eq(childProfilesTable.guardianId, guardianId))
      .orderBy(asc(childProfilesTable.createdAt)),
    loadSubscription(guardian.stripeCustomerId),
  ]);
  const progressRows =
    profiles.length > 0
      ? await db
          .select()
          .from(childProgressTable)
          .where(
            inArray(
              childProgressTable.childId,
              profiles.map((profile) => profile.id),
            ),
          )
      : [];
  const completedByChild = new Map<string, string[]>();
  for (const row of progressRows) {
    const completed = completedByChild.get(row.childId) ?? [];
    completed.push(row.lessonId);
    completedByChild.set(row.childId, completed);
  }

  const response = {
    subscriptionStatus: subscription?.status ?? "none",
    subscriptionPeriodEnd: subscription?.periodEnd ?? null,
    subscriptionCancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    children: profiles.map((profile) => ({
      id: profile.id,
      displayName: profile.displayName,
      completedLessonIds: completedByChild.get(profile.id) ?? [],
      createdAt: profile.createdAt.toISOString(),
    })),
  };

  res.json(GetFamilyResponse.parse(response));
});

router.post("/family/children", async (req, res): Promise<void> => {
  const guardianId = getGuardianId(req);
  if (!guardianId) {
    res.status(401).json({ error: "Sign in with a parent or guardian account." });
    return;
  }

  const parsed = CreateChildProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const guardian = await ensureGuardian(guardianId);
  const subscription = await loadSubscription(
    guardian?.stripeCustomerId ?? null,
  );
  if (!hasLearningAccess(subscription)) {
    res.status(402).json({ error: "An active family subscription is required." });
    return;
  }

  const displayName = parsed.data.displayName.trim();
  if (!displayName) {
    res.status(400).json({ error: "Enter a display name." });
    return;
  }
  const [profile] = await db
    .insert(childProfilesTable)
    .values({ guardianId, displayName })
    .returning();

  res
    .status(201)
    .json(
      CreateChildProfileResponse.parse({
        ...profile,
        completedLessonIds: [],
      }),
    );
});

router.delete("/family/children/:childId", async (req, res): Promise<void> => {
  const guardianId = getGuardianId(req);
  if (!guardianId) {
    res.status(401).json({ error: "Sign in with a parent or guardian account." });
    return;
  }

  const params = DeleteChildProfileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(childProfilesTable)
    .where(
      and(
        eq(childProfilesTable.id, params.data.childId),
        eq(childProfilesTable.guardianId, guardianId),
      ),
    )
    .returning({ id: childProfilesTable.id });

  if (!deleted) {
    res.status(404).json({ error: "Learner profile not found." });
    return;
  }

  res.status(204).send();
});

router.post(
  "/family/children/:childId/progress",
  async (req, res): Promise<void> => {
    const guardianId = getGuardianId(req);
    if (!guardianId) {
      res
        .status(401)
        .json({ error: "Sign in with a parent or guardian account." });
      return;
    }

    const params = CompleteChildLessonParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = CompleteChildLessonBody.safeParse(req.body);
    if (!body.success || !validLessonIds.has(body.data?.lessonId ?? "")) {
      res.status(400).json({ error: "Choose a valid lesson." });
      return;
    }

    const guardian = await ensureGuardian(guardianId);
    const subscription = await loadSubscription(
      guardian?.stripeCustomerId ?? null,
    );
    if (!hasLearningAccess(subscription)) {
      res.status(402).json({ error: "An active family subscription is required." });
      return;
    }

    const [profile] = await db
      .select({ id: childProfilesTable.id })
      .from(childProfilesTable)
      .where(
        and(
          eq(childProfilesTable.id, params.data.childId),
          eq(childProfilesTable.guardianId, guardianId),
        ),
      )
      .limit(1);
    if (!profile) {
      res.status(404).json({ error: "Learner profile not found." });
      return;
    }

    await db
      .insert(childProgressTable)
      .values({ childId: profile.id, lessonId: body.data.lessonId })
      .onConflictDoUpdate({
        target: [childProgressTable.childId, childProgressTable.lessonId],
        set: { completedAt: new Date() },
      });

    const progress = await db
      .select({ lessonId: childProgressTable.lessonId })
      .from(childProgressTable)
      .where(eq(childProgressTable.childId, profile.id));
    res.json(
    CompleteChildLessonResponse.parse({
        completedLessonIds: progress.map((item) => item.lessonId),
      }),
    );
  },
);

export default router;
