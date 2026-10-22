import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { z } from "zod/v4";
import {
  and,
  asc,
  eq,
  inArray,
  sql,
} from "drizzle-orm";
import {
  childProfilesTable,
  childDailyLearningTable,
  childLevelMasteryTable,
  childProgressTable,
  db,
  guardiansTable,
  quizAttemptsTable,
} from "@workspace/db";
import { isLegacyChapterId, levels, normalizeLessonId } from "@workspace/curriculum";
import { advanceDailyLearning, calculateLearningScore, canonicalIds, normalizeState, levelReady, mergeProgressRecords, summarizeDailyLearning, weakTopicCounts } from "../lib/learning-rules";
import learningRouter from "./learning";
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
  UpdateChildLearningStateBody,
  UpdateChildLearningStateParams,
  UpdateChildLearningStateResponse,
  MarkLessonTalkDiscussedParams,
} from "@workspace/api-zod";
const router: IRouter = Router();
router.use("/family/children/:childId", (req, res, next) => {
  if (!z.uuid().safeParse(req.params.childId).success) {
    res.status(400).json({ error: "Invalid learner profile." });
    return;
  }
  next();
});

function getGuardianId(req: Parameters<typeof getAuth>[0]): string | null {
  return getAuth(req).userId ?? null;
}

router.get("/family/children/:childId/daily-usage", async (req, res): Promise<void> => {
  const guardianId = getGuardianId(req);
  if (!guardianId) { res.status(401).json({ error: "Sign in with a parent or guardian account." }); return; }
  const [profile] = await db.select({ id: childProfilesTable.id }).from(childProfilesTable)
    .where(and(eq(childProfilesTable.id, req.params.childId), eq(childProfilesTable.guardianId, guardianId))).limit(1);
  if (!profile) { res.status(404).json({ error: "Learner profile not found." }); return; }
  const [record] = await db.select().from(childDailyLearningTable).where(eq(childDailyLearningTable.childId, profile.id)).limit(1);
  res.json(summarizeDailyLearning(record));
});

router.post("/family/children/:childId/daily-usage", async (req, res): Promise<void> => {
  const guardianId = getGuardianId(req);
  if (!guardianId) { res.status(401).json({ error: "Sign in with a parent or guardian account." }); return; }
  const body = z.object({ active: z.boolean(), sessionId: z.uuid() }).safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Choose whether the learner is actively learning." }); return; }
  const summary = await db.transaction(async (tx) => {
    const [profile] = await tx.select({ id: childProfilesTable.id }).from(childProfilesTable)
      .where(and(eq(childProfilesTable.id, req.params.childId), eq(childProfilesTable.guardianId, guardianId)))
      .limit(1).for("update");
    if (!profile) return null;
    const [record] = await tx.select().from(childDailyLearningTable)
      .where(eq(childDailyLearningTable.childId, profile.id)).limit(1).for("update");
    const now = new Date();
    const next = advanceDailyLearning(record, body.data.active, body.data.sessionId, now);
    if (record) {
      await tx.update(childDailyLearningTable).set(next).where(eq(childDailyLearningTable.childId, profile.id));
    } else {
      await tx.insert(childDailyLearningTable).values({ childId: profile.id, ...next });
    }
    return summarizeDailyLearning(next, now);
  });
  if (!summary) { res.status(404).json({ error: "Learner profile not found." }); return; }
  res.json(summary);
});

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
          .select({ childId: childLevelMasteryTable.childId, levelId: childLevelMasteryTable.levelId, score: childLevelMasteryTable.score })
          .from(childLevelMasteryTable)
          .where(inArray(childLevelMasteryTable.childId, profiles.map((profile) => profile.id)))
      : [];
  const reviews = profiles.length ? await db.select({ childId: quizAttemptsTable.childId, kind: quizAttemptsTable.kind,
    score: quizAttemptsTable.score, missedLessonIds: quizAttemptsTable.missedLessonIds,
    createdAt: quizAttemptsTable.createdAt, finishedAt: quizAttemptsTable.finishedAt }).from(quizAttemptsTable)
    .where(inArray(quizAttemptsTable.childId, profiles.map(profile => profile.id))) : [];
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
    children: profiles.map((profile) => {
      const completedLessonIds = canonicalIds(completedByChild.get(profile.id) ?? []);
      const masteredLevelIds = (masteredByChild.get(profile.id) ?? []).filter((id) => levels.some((level) => level.id === id));
      const childReviews = reviews.filter(row => row.childId === profile.id);
      const reviewCount = childReviews.filter(row => row.kind === "review" && row.finishedAt).length;
      const bestReviewScore = Math.max(0, ...childReviews.filter(row => row.kind === "review").map(row => row.score ?? 0));
      const lessonRecords = mergeProgressRecords(progressRows
        .filter((row) => row.childId === profile.id)
        .map((row) => ({
          lessonId: row.lessonId,
          reflection: row.reflection,
          durationSeconds: row.durationSeconds,
          quizScore: row.quizScore,
          talkDiscussedAt: row.talkDiscussedAt?.toISOString() ?? null,
          completedAt: row.completedAt.toISOString(),
        })));
      const { learningScore, scoreBreakdown } = calculateLearningScore({
        completedLessonIds,
        lessonRecords,
        masteredChapterIds: masteredLevelIds,
        bestReviewScore,
      });
      return {
        id: profile.id,
        displayName: profile.displayName,
        ageBand: profile.ageBand,
        completedLessonIds,
        masteredLevelIds,
        learningState: normalizeState(profile.learningState),
        reviewCount,
        bestReviewScore,
        levelScores: Object.fromEntries(masteryRows.filter(row => row.childId === profile.id).map(row => [row.levelId, row.score])),
        weakTopics: weakTopicCounts(childReviews.filter(row => row.finishedAt)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 20).map(row => row.missedLessonIds as string[])),
        lessonRecords,
        learningScore,
        scoreBreakdown,
        createdAt: profile.createdAt.toISOString(),
      };
    }),
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
        learningState: normalizeState(profile.learningState),
        lessonRecords: [],
        reviewCount: 0,
        bestReviewScore: 0,
        levelScores: {},
        learningScore: 0,
        scoreBreakdown: { missionPoints: 0, quizPoints: 0, chapterPoints: 0, reviewPoints: 0 },
        createdAt: profile.createdAt.toISOString(),
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

router.patch("/family/children/:childId/learning-state", async (req, res): Promise<void> => {
  const guardianId = getGuardianId(req);
  if (!guardianId) {
    res.status(401).json({ error: "Sign in with a parent or guardian account." });
    return;
  }
  const params = UpdateChildLearningStateParams.safeParse(req.params);
  const body = UpdateChildLearningStateBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Check the weekly goal, pledge, and project details." });
    return;
  }
  const [profile] = await db
    .select({ id: childProfilesTable.id, learningState: childProfilesTable.learningState })
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
  const state = normalizeState(profile.learningState);
  const next = normalizeState(body.data);
  if (next.revision !== state.revision) {
    res.status(409).json({ error: "Family progress changed in another tab. Reload the latest progress and try again." }); return;
  }
  const progress = await db.select().from(childProgressTable).where(eq(childProgressTable.childId, profile.id));
  const mastery = await db.select().from(childLevelMasteryTable).where(eq(childLevelMasteryTable.childId, profile.id));
  const completed = new Set(canonicalIds(progress.map(row => row.lessonId)));
  const mastered = new Set(mastery.map(row => row.levelId));
  for (const [id, project] of Object.entries(next.projects)) {
    const level = levels.find(item => item.id === id);
    if (!level) {
      // Keep projects from the previous curriculum intact without letting them satisfy new chapter gates.
      if (isLegacyChapterId(id)) continue;
      res.status(400).json({ error: "Choose a valid chapter project." }); return;
    }
    const old = state.projects[id];
    if (old?.content !== project.content) {
      // Editing a reviewed submission always requires a fresh guardian review.
      project.approved = false;
      project.reviewedAt = null;
      project.rubric = [];
    } else if (project.approved) {
      if (!mastered.has(id) || !level.lessonIds.every(lessonId => completed.has(lessonId))
        || (project.content?.trim().length ?? 0) < 60
        || project.rubric?.length !== level.project.rubric.length || !project.rubric.every(Boolean)) {
        res.status(403).json({ error: "Pass the mastery check, finish all lessons, and review the project against every rubric item before approving." }); return;
      }
      project.reviewedAt = old?.approved ? old.reviewedAt : new Date().toISOString();
    } else project.reviewedAt = null;
  }
  if ((next.pledgeLevel > state.pledgeLevel && !levelReady(next.pledgeLevel - 1, completed, mastered, state))
     || (next.learnerAgreedLevel > state.learnerAgreedLevel && !levelReady(next.learnerAgreedLevel - 1, completed, mastered, state))) {
    res.status(403).json({ error: "Finish the previous chapter's lessons, mastery check, and approved project before the next pledge." }); return;
  }
  next.revision = state.revision + 1;
  const [updated] = await db
    .update(childProfilesTable)
    .set({ learningState: next })
    .where(and(eq(childProfilesTable.id, profile.id),
      sql`coalesce((${childProfilesTable.learningState}->>'revision')::integer, 0) = ${state.revision}`))
    .returning({ learningState: childProfilesTable.learningState });
  if (!updated) { res.status(409).json({ error: "Family progress changed while saving. Reload the latest progress and try again." }); return; }
  res.json(UpdateChildLearningStateResponse.parse(updated.learningState));
});

router.patch("/family/children/:childId/lessons/:lessonId/talk", async (req, res): Promise<void> => {
  const guardianId = getGuardianId(req);
  if (!guardianId) {
    res.status(401).json({ error: "Sign in with a parent or guardian account." });
    return;
  }
  const params = MarkLessonTalkDiscussedParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Choose a completed lesson." });
    return;
  }
  const [profile] = await db
    .select({ id: childProfilesTable.id })
    .from(childProfilesTable)
    .where(and(
      eq(childProfilesTable.id, params.data.childId),
      eq(childProfilesTable.guardianId, guardianId),
    ))
    .limit(1);
  if (!profile) {
    res.status(404).json({ error: "Completed lesson not found." });
    return;
  }
  const normalizedTalkId = normalizeLessonId(params.data.lessonId);
  const legacyIds = ["ai-basics", "clear-prompts", "check-answers"].filter(id => normalizeLessonId(id) === normalizedTalkId);
  const [record] = await db
    .update(childProgressTable)
    .set({ talkDiscussedAt: new Date() })
    .where(and(
      eq(childProgressTable.childId, profile.id),
      inArray(childProgressTable.lessonId, [normalizedTalkId, ...legacyIds]),
    ))
    .returning({ talkDiscussedAt: childProgressTable.talkDiscussedAt });
  if (!record?.talkDiscussedAt) {
    res.status(404).json({ error: "Completed lesson not found." });
    return;
  }
  res.json({ talkDiscussedAt: record.talkDiscussedAt.toISOString() });
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

router.use(learningRouter);

export default router;
