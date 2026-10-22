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
  childLevelMasteryTable,
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
  UpdateChildAgeBandBody,
  UpdateChildAgeBandParams,
  UpdateChildAgeBandResponse,
  SubmitLevelAssessmentBody,
  SubmitLevelAssessmentParams,
  SubmitLevelAssessmentResponse,
} from "@workspace/api-zod";
const router: IRouter = Router();
const validLessonIds = new Set([
  "what-is-ai",
  "clear-instructions",
  "check-the-answer",
  "privacy-safe-use",
  "school-integrity",
  "responsible-use",
  "prompt-design",
  "plan-an-app",
  "test-app",
  "iterate-app",
]);
const learningLevels = [
  {
    id: "ai-foundations",
    lessonIds: ["what-is-ai", "clear-instructions", "check-the-answer", "privacy-safe-use"],
    answers: [1, 1, 2, 2, 0],
  },
  {
    id: "responsible-use",
    lessonIds: ["school-integrity", "responsible-use"],
    answers: [1, 1, 2, 1, 0],
  },
  {
    id: "prompt-craft",
    lessonIds: ["prompt-design"],
    answers: [2, 1, 0, 2, 1],
  },
  {
    id: "app-builder",
    lessonIds: ["plan-an-app", "test-app", "iterate-app"],
    answers: [1, 0, 2, 1, 0],
  },
] as const;
const masteryThreshold = 80;

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

  const profiles = await db
    .select()
    .from(childProfilesTable)
    .where(eq(childProfilesTable.guardianId, guardianId))
    .orderBy(asc(childProfilesTable.createdAt));
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
  const masteryRows =
    profiles.length > 0
      ? await db
          .select({ childId: childLevelMasteryTable.childId, levelId: childLevelMasteryTable.levelId })
          .from(childLevelMasteryTable)
          .where(inArray(childLevelMasteryTable.childId, profiles.map((profile) => profile.id)))
      : [];
  const completedByChild = new Map<string, string[]>();
  for (const row of progressRows) {
    const completed = completedByChild.get(row.childId) ?? [];
    completed.push(row.lessonId);
    completedByChild.set(row.childId, completed);
  }
  const masteredByChild = new Map<string, string[]>();
  for (const row of masteryRows) {
    const mastered = masteredByChild.get(row.childId) ?? [];
    mastered.push(row.levelId);
    masteredByChild.set(row.childId, mastered);
  }

  const response = {
    children: profiles.map((profile) => ({
      id: profile.id,
      displayName: profile.displayName,
      ageBand: profile.ageBand,
      completedLessonIds: completedByChild.get(profile.id) ?? [],
      masteredLevelIds: masteredByChild.get(profile.id) ?? [],
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

  await ensureGuardian(guardianId);

  const displayName = parsed.data.displayName.trim();
  if (!displayName) {
    res.status(400).json({ error: "Enter a display name." });
    return;
  }
  const [profile] = await db
    .insert(childProfilesTable)
    .values({ guardianId, displayName, ageBand: parsed.data.ageBand })
    .returning();

  res
    .status(201)
    .json(
      CreateChildProfileResponse.parse({
        ...profile,
        completedLessonIds: [],
        masteredLevelIds: [],
      }),
    );
});

router.patch(
  "/family/children/:childId/age-band",
  async (req, res): Promise<void> => {
    const guardianId = getGuardianId(req);
    if (!guardianId) {
      res.status(401).json({ error: "Sign in with a parent or guardian account." });
      return;
    }

    const params = UpdateChildAgeBandParams.safeParse(req.params);
    const body = UpdateChildAgeBandBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "Choose one of the available age-band paths." });
      return;
    }

    const [updated] = await db
      .update(childProfilesTable)
      .set({ ageBand: body.data.ageBand })
      .where(
        and(
          eq(childProfilesTable.id, params.data.childId),
          eq(childProfilesTable.guardianId, guardianId),
        ),
      )
      .returning({ ageBand: childProfilesTable.ageBand });

    if (!updated) {
      res.status(404).json({ error: "Learner profile not found." });
      return;
    }

    res.json(UpdateChildAgeBandResponse.parse(updated));
  },
);

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
  "/family/children/:childId/assessments",
  async (req, res): Promise<void> => {
    const guardianId = getGuardianId(req);
    if (!guardianId) {
      res.status(401).json({ error: "Sign in with a parent or guardian account." });
      return;
    }
    const params = SubmitLevelAssessmentParams.safeParse(req.params);
    const body = SubmitLevelAssessmentBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "Choose a valid level assessment and answers." });
      return;
    }
    const [profile] = await db
      .select({ id: childProfilesTable.id, guardianId: childProfilesTable.guardianId })
      .from(childProfilesTable)
      .where(and(
        eq(childProfilesTable.id, params.data.childId),
        eq(childProfilesTable.guardianId, guardianId),
      ))
      .limit(1);
    if (!profile) {
      res.status(404).json({ error: "Learner profile not found." });
      return;
    }
    const levelIndex = learningLevels.findIndex((level) => level.id === body.data.levelId);
    const level = learningLevels[levelIndex];
    const progress = await db
      .select({ lessonId: childProgressTable.lessonId })
      .from(childProgressTable)
      .where(eq(childProgressTable.childId, profile.id));
    const completed = new Set(progress.map((row) => row.lessonId));
    const mastery = await db
      .select({ levelId: childLevelMasteryTable.levelId })
      .from(childLevelMasteryTable)
      .where(eq(childLevelMasteryTable.childId, profile.id));
    const mastered = new Set(mastery.map((row) => row.levelId));
    const canTakeAssessment =
      levelIndex >= 0 &&
      level.lessonIds.every((lessonId) => completed.has(lessonId)) &&
      (levelIndex === 0 || mastered.has(learningLevels[levelIndex - 1].id));
    if (!canTakeAssessment) {
      res.status(403).json({ error: "Complete this level's lessons and graduate from the previous level first." });
      return;
    }
    const correctCount = body.data.answers.reduce(
      (total, answer, index) => total + (answer === level.answers[index] ? 1 : 0),
      0,
    );
    const score = Math.round((correctCount / level.answers.length) * 100);
    const passed = score >= masteryThreshold;
    if (passed) {
      await db
        .insert(childLevelMasteryTable)
        .values({ childId: profile.id, levelId: level.id, score })
        .onConflictDoUpdate({
          target: [childLevelMasteryTable.childId, childLevelMasteryTable.levelId],
          set: { score, graduatedAt: new Date() },
        });
      mastered.add(level.id);
    }
    res.json(SubmitLevelAssessmentResponse.parse({
      levelId: level.id,
      score,
      passed,
      masteredLevelIds: [...mastered],
    }));
  },
);

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

    const existingProgress = await db
      .select({ lessonId: childProgressTable.lessonId })
      .from(childProgressTable)
      .where(eq(childProgressTable.childId, profile.id));
    const completed = new Set(existingProgress.map((row) => row.lessonId));
    const level = learningLevels.find((item) =>
      item.lessonIds.some((lessonId) => lessonId === body.data.lessonId),
    );
    if (!level) {
      res.status(400).json({ error: "Choose a valid lesson." });
      return;
    }
    const levelIndex = learningLevels.findIndex((item) => item.id === level.id);
    const levelLessonIds: string[] = [...level.lessonIds];
    const lessonIndex = levelLessonIds.indexOf(body.data.lessonId);
    if (levelIndex > 0) {
      const priorMastery = await db
        .select({ levelId: childLevelMasteryTable.levelId })
        .from(childLevelMasteryTable)
        .where(and(
          eq(childLevelMasteryTable.childId, profile.id),
          eq(childLevelMasteryTable.levelId, learningLevels[levelIndex - 1].id),
        ))
        .limit(1);
      if (!priorMastery.length) {
        res.status(403).json({ error: "Graduate from the previous level before continuing." });
        return;
      }
    }
    if (levelLessonIds.slice(0, lessonIndex).some((lessonId) => !completed.has(lessonId))) {
      res.status(403).json({ error: "Complete the earlier lessons in this level first." });
      return;
    }

    await db
      .insert(childProgressTable)
      .values({ childId: profile.id, lessonId: body.data.lessonId })
      .onConflictDoUpdate({
        target: [childProgressTable.childId, childProgressTable.lessonId],
        set: { completedAt: new Date() },
      });

    const updatedProgress = await db
      .select({ lessonId: childProgressTable.lessonId })
      .from(childProgressTable)
      .where(eq(childProgressTable.childId, profile.id));
    res.json(
    CompleteChildLessonResponse.parse({
        completedLessonIds: updatedProgress.map((item) => item.lessonId),
      }),
    );
  },
);

export default router;
