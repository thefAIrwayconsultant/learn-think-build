import { Router, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { db, childProfilesTable, childProgressTable, childLevelMasteryTable, childDailyLearningTable, quizAttemptsTable } from "@workspace/db";
import { levels, getLessonsForAgeBand, normalizeLessonId, type AgeBand, type Question } from "@workspace/curriculum";
import {
  StartLearningQuizBody, StartLearningQuizResponse, SubmitReviewQuizBody, SubmitReviewQuizResponse,
  CompleteChildLessonBody, CompleteChildLessonResponse, SubmitLevelAssessmentBody, SubmitLevelAssessmentResponse,
} from "@workspace/api-zod";
import { canonicalIds, normalizeState, lessonReady, levelReady, pickQuestions, gradeQuestions, validReflection, summarizeDailyLearning } from "../lib/learning-rules";

const router = Router();
async function context(req: Request, res: Response) {
  const guardianId = getAuth(req).userId;
  if (!guardianId) { res.status(401).json({ error: "Sign in with a parent or guardian account." }); return null; }
  const childId = z.uuid().safeParse(req.params.childId);
  if (!childId.success) { res.status(400).json({ error: "Invalid learner profile." }); return null; }
  const [profile] = await db.select().from(childProfilesTable)
    .where(and(eq(childProfilesTable.id, childId.data), eq(childProfilesTable.guardianId, guardianId)));
  if (!profile) { res.status(404).json({ error: "Learner profile not found." }); return null; }
  const progress = await db.select().from(childProgressTable).where(eq(childProgressTable.childId, profile.id));
  const mastery = await db.select().from(childLevelMasteryTable).where(eq(childLevelMasteryTable.childId, profile.id));
  const [dailyRecord] = await db.select().from(childDailyLearningTable)
    .where(eq(childDailyLearningTable.childId, profile.id)).limit(1);
  return { profile, completed: new Set(canonicalIds(progress.map(row => row.lessonId))),
    mastered: new Set(mastery.map(row => row.levelId)), state: normalizeState(profile.learningState),
    dailyUsage: summarizeDailyLearning(dailyRecord),
    ageBand: (profile.ageBand ?? "10-12") as AgeBand };
}

function requireLearningTime(ctx: Awaited<ReturnType<typeof context>>, res: Response): boolean {
  if (!ctx || ctx.dailyUsage.remainingSeconds > 0) return true;
  res.status(429).json({ error: "Your ten minutes of learning time are up for now. Your daily time window will reset automatically." });
  return false;
}

router.post("/family/children/:childId/quiz", async (req, res): Promise<void> => {
  const ctx = await context(req, res); if (!ctx) return;
  if (!requireLearningTime(ctx, res)) return;
  const parsed = StartLearningQuizBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Choose a lesson, level, or mixed review." }); return; }
  const { kind } = parsed.data;
  const targetId = kind === "review" ? "weekly-review" : normalizeLessonId(parsed.data.targetId ?? "");
  const lessons = getLessonsForAgeBand(ctx.ageBand);
  let selected = lessons.filter(lesson => ctx.completed.has(lesson.id));
  if (kind === "lesson") {
    selected = lessons.filter(lesson => lesson.id === targetId);
    if (!selected.length) { res.status(404).json({ error: "Lesson not found." }); return; }
    if (!lessonReady(targetId, ctx.completed, ctx.mastered, ctx.state)) {
      res.status(403).json({ error: "Finish the earlier lessons, both pledges, and previous level approval first." }); return;
    }
  }
  if (kind === "level") {
    const index = levels.findIndex(level => level.id === targetId);
    const level = levels[index];
    if (!level) { res.status(404).json({ error: "Level not found." }); return; }
    if (!level.lessonIds.every(id => ctx.completed.has(id)) || !levelReady(index, ctx.completed, ctx.mastered, ctx.state)
      || ctx.state.pledgeLevel < index + 1 || ctx.state.learnerAgreedLevel < index + 1) {
      res.status(403).json({ error: "Complete this level's lessons and pledges, and the previous level's mastery and project first." }); return;
    }
    selected = lessons.filter(lesson => level.lessonIds.includes(lesson.id));
  }
  if (!selected.length) { res.status(400).json({ error: "Complete a lesson before starting a mixed review." }); return; }
  const [previous] = await db.select().from(quizAttemptsTable).where(and(
    eq(quizAttemptsTable.childId, ctx.profile.id), eq(quizAttemptsTable.kind, kind), eq(quizAttemptsTable.targetId, targetId),
  )).orderBy(desc(quizAttemptsTable.createdAt)).limit(1);
  if (kind === "level") {
    // Starting an abandoned attempt must not bypass a previous failed attempt's review requirement.
    const failed = await db.select().from(quizAttemptsTable).where(and(
      eq(quizAttemptsTable.childId, ctx.profile.id), eq(quizAttemptsTable.kind, "level"), eq(quizAttemptsTable.targetId, targetId),
    ));
    const missed = [...new Set(failed.flatMap(attempt => (attempt.missedLessonIds as string[])
      .filter(id => !(attempt.reviewedLessonIds as string[]).includes(id))))];
    if (missed.length) { res.status(403).json({ error: "Review the missed lessons before retaking this check.", missedLessonIds: missed }); return; }
  }
  const questions = pickQuestions(selected.flatMap(lesson => lesson.questionBank), 5,
    (previous?.questions as Question[] | undefined)?.map(q => q.id));
  if (questions.length < 5) { res.status(500).json({ error: "The question bank could not be loaded." }); return; }
  const [attempt] = await db.insert(quizAttemptsTable).values({
    childId: ctx.profile.id, kind, targetId, ageBand: ctx.ageBand, questions,
  }).returning();
  res.json(StartLearningQuizResponse.parse({ attemptId: attempt.id,
    questions: questions.map(({ answer: _answer, explanation: _explanation, ...question }) => question) }));
});

router.post("/family/children/:childId/lessons/:lessonId/review", async (req, res): Promise<void> => {
  const ctx = await context(req, res); if (!ctx) return;
  if (!requireLearningTime(ctx, res)) return;
  const lessonId = normalizeLessonId(String(req.params.lessonId));
  if (!ctx.completed.has(lessonId)) { res.status(403).json({ error: "Only completed lessons can be marked reviewed." }); return; }
  await db.transaction(async tx => {
    const attempts = await tx.select().from(quizAttemptsTable).where(and(
      eq(quizAttemptsTable.childId, ctx.profile.id), eq(quizAttemptsTable.kind, "level"),
    )).for("update");
    for (const attempt of attempts) {
      if (!(attempt.missedLessonIds as string[]).includes(lessonId)) continue;
      await tx.update(quizAttemptsTable).set({
        reviewedLessonIds: [...new Set([...(attempt.reviewedLessonIds as string[]), lessonId])],
      }).where(eq(quizAttemptsTable.id, attempt.id));
    }
  });
  res.status(204).send();
});

class SubmissionError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Lock and grade one server-owned attempt atomically. Client-reported scores are never trusted.
async function gradeAttempt(
  childId: string, ageBand: AgeBand, attemptId: string, kind: string, targetId: string, answers: number[][],
  onPass?: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0], score: number) => Promise<void>,
) {
  if (!z.uuid().safeParse(attemptId).success) throw new SubmissionError(400, "Start a new check before submitting.");
  return db.transaction(async tx => {
    // Serialize submissions per learner, including attempts opened in different tabs.
    await tx.select({ id: childProfilesTable.id }).from(childProfilesTable).where(eq(childProfilesTable.id, childId)).for("update");
    const [attempt] = await tx.select().from(quizAttemptsTable)
      .where(and(eq(quizAttemptsTable.id, attemptId), eq(quizAttemptsTable.childId, childId))).for("update");
    if (!attempt || attempt.kind !== kind || attempt.targetId !== targetId) throw new SubmissionError(400, "This check does not belong to this lesson or learner.");
    if (attempt.ageBand !== ageBand) throw new SubmissionError(409, "The age path changed. Please start a new check.");
    if (attempt.finishedAt) throw new SubmissionError(409, "This check was already submitted. Start a fresh check.");
    if (kind === "level") {
      const previous = await tx.select().from(quizAttemptsTable).where(and(
        eq(quizAttemptsTable.childId, childId), eq(quizAttemptsTable.kind, "level"), eq(quizAttemptsTable.targetId, targetId),
      ));
      if (previous.some(row => (row.missedLessonIds as string[]).some(id => !(row.reviewedLessonIds as string[]).includes(id)))) {
        throw new SubmissionError(403, "Review missed lessons before submitting another mastery attempt.");
      }
    }
    if (Date.now() - attempt.createdAt.getTime() > 86400000) throw new SubmissionError(409, "This check expired. Start a fresh check.");
    const questions = attempt.questions as Question[];
    if (answers.length !== questions.length || answers.some((a, i) => a.some(n => n >= questions[i].options.length))) {
      throw new SubmissionError(400, "Answer every question using the available choices.");
    }
    const grade = gradeQuestions(questions, answers);
    await tx.update(quizAttemptsTable).set({ score: grade.score, missedLessonIds: grade.missedLessonIds, finishedAt: new Date() })
      .where(eq(quizAttemptsTable.id, attempt.id));
    if (grade.passed && onPass) await onPass(tx, grade.score);
    return grade;
  });
}
function submissionError(error: unknown, res: Response) {
  if (error instanceof SubmissionError) { res.status(error.status).json({ error: error.message }); return; }
  throw error;
}

router.post("/family/children/:childId/progress", async (req, res): Promise<void> => {
  const ctx = await context(req, res); if (!ctx) return;
  if (!requireLearningTime(ctx, res)) return;
  const parsed = CompleteChildLessonBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Finish the explainer, activity, reflection, and all check questions." }); return; }
  const body = parsed.data;
  const id = normalizeLessonId(body.lessonId);
  if (!lessonReady(id, ctx.completed, ctx.mastered, ctx.state)) {
    res.status(403).json({ error: "Finish earlier lessons, both pledges, and the previous level project first." }); return;
  }
  if (!validReflection(body.reflection, id, ctx.ageBand)) {
    res.status(400).json({ error: "Write one or two sentences in your own words, not copied lesson text (at least 30 characters and seven words)." }); return;
  }
  // Zod codegen does not enforce JSON Schema const across all versions.
  if (body.activityCompleted !== true || body.watchCompleted !== true) {
    res.status(400).json({ error: "Complete the explainer and hands-on activity first." }); return;
  }
  try {
    const grade = await gradeAttempt(ctx.profile.id, ctx.ageBand, body.attemptId, "lesson", id, body.answers,
      async (tx, score) => {
        await tx.insert(childProgressTable).values({ childId: ctx.profile.id, lessonId: id,
          reflection: body.reflection.trim(), durationSeconds: body.durationSeconds, quizScore: score,
        }).onConflictDoUpdate({
          target: [childProgressTable.childId, childProgressTable.lessonId],
          set: { reflection: body.reflection.trim(),
            durationSeconds: sql`${childProgressTable.durationSeconds} + ${body.durationSeconds}`,
            quizScore: sql`greatest(coalesce(${childProgressTable.quizScore}, 0), ${score})` },
        });
      });
    if (!grade.passed) { res.status(422).json({ error: "You need 80% to complete this lesson. Review the explanations and try a new check.", ...grade }); return; }
    res.json(CompleteChildLessonResponse.parse({ completedLessonIds: canonicalIds([...ctx.completed, id]) }));
  } catch (error) { submissionError(error, res); }
});

router.post("/family/children/:childId/assessments", async (req, res): Promise<void> => {
  const ctx = await context(req, res); if (!ctx) return;
  if (!requireLearningTime(ctx, res)) return;
  const parsed = SubmitLevelAssessmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Answer every question in this mastery check." }); return; }
  const body = parsed.data;
  const index = levels.findIndex(level => level.id === body.levelId);
  const level = levels[index];
  if (!level || !level.lessonIds.every(id => ctx.completed.has(id)) || !levelReady(index, ctx.completed, ctx.mastered, ctx.state)) {
    res.status(403).json({ error: "Complete this level and the previous level's mastery and approved project first." }); return;
  }
  try {
    const grade = await gradeAttempt(ctx.profile.id, ctx.ageBand, body.attemptId, "level", level.id, body.answers,
      async (tx, score) => {
        await tx.insert(childLevelMasteryTable).values({ childId: ctx.profile.id, levelId: level.id, score })
          .onConflictDoUpdate({ target: [childLevelMasteryTable.childId, childLevelMasteryTable.levelId],
            set: { score: sql`greatest(${childLevelMasteryTable.score}, ${score})` } });
      });
    if (grade.passed) ctx.mastered.add(level.id);
    res.json(SubmitLevelAssessmentResponse.parse({ levelId: level.id, ...grade, masteredLevelIds: [...ctx.mastered] }));
  } catch (error) { submissionError(error, res); }
});

router.post("/family/children/:childId/review-quiz", async (req, res): Promise<void> => {
  const ctx = await context(req, res); if (!ctx) return;
  if (!requireLearningTime(ctx, res)) return;
  const body = SubmitReviewQuizBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Answer every mixed review question." }); return; }
  try {
    const grade = await gradeAttempt(ctx.profile.id, ctx.ageBand, body.data.attemptId, "review", "weekly-review", body.data.answers);
    res.json(SubmitReviewQuizResponse.parse(grade));
  } catch (error) { submissionError(error, res); }
});

export default router;
