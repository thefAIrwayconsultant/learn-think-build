import { test } from "node:test";
import assert from "node:assert/strict";
import { levels, getLessonsForAgeBand } from "@workspace/curriculum";
import { advanceDailyLearning, calculateLearningScore, DAILY_LEARNING_LIMIT_SECONDS, summarizeDailyLearning } from "./learning-rules";
import { canonicalIds, gradeQuestions, lessonReady, levelReady, normalizeState, pickQuestions, validReflection, mergeProgressRecords, weakTopicCounts } from "./learning-rules";

test("legacy aliases are deduplicated without granting unknown credit", () => {
  assert.deepEqual(canonicalIds(["ai-basics", "what-is-ai", "clear-prompts", "check-answers", "does-not-exist"]),
    ["what-is-ai", "clear-instructions", "check-the-answer"]);
  assert.equal(normalizeState({ weeklyGoal: 3, pledgeLevel: 1, projects: {} }).learnerAgreedLevel, 0);
});
test("the daily time limit counts visible intervals, pauses, and unlocks after 24 hours", () => {
  const startedAt = new Date("2026-10-22T10:00:00.000Z");
  const first = advanceDailyLearning(undefined, true, "00000000-0000-4000-8000-000000000001", startedAt);
  assert.equal(first.secondsUsed, 0);
  assert.equal(summarizeDailyLearning(first, new Date("2026-10-22T10:00:05.000Z")).usedSeconds, 5);
  const paused = advanceDailyLearning(first, false, "00000000-0000-4000-8000-000000000001", new Date("2026-10-22T10:00:05.000Z"));
  assert.equal(paused.secondsUsed, 5);
  assert.equal(summarizeDailyLearning(paused, new Date("2026-10-22T10:50:00.000Z")).usedSeconds, 5);
  const secondDevice = advanceDailyLearning(first, true, "00000000-0000-4000-8000-000000000002", new Date("2026-10-22T10:00:04.000Z"));
  const oneDevicePaused = advanceDailyLearning(secondDevice, false, "00000000-0000-4000-8000-000000000001", new Date("2026-10-22T10:00:05.000Z"));
  assert.equal(oneDevicePaused.active, true, "one tab pausing must not stop another active tab");

  const nearlyDone = { ...paused, active: true, secondsUsed: DAILY_LEARNING_LIMIT_SECONDS - 5,
    lastHeartbeatAt: new Date("2026-10-22T10:00:05.000Z") };
  const exhausted = advanceDailyLearning(nearlyDone, true, "00000000-0000-4000-8000-000000000001", new Date("2026-10-22T10:00:10.000Z"));
  assert.equal(summarizeDailyLearning(exhausted, new Date("2026-10-22T10:00:10.000Z")).remainingSeconds, 0);
  assert.equal(summarizeDailyLearning(exhausted, new Date("2026-10-23T10:00:10.000Z")).remainingSeconds, 600);
  assert.equal(advanceDailyLearning(exhausted, false, "00000000-0000-4000-8000-000000000001", new Date("2026-10-22T10:10:05.000Z")).secondsUsed, 600);
});

test("learning points use unique lesson credits, best quiz scores and current chapter mastery", () => {
  const score = calculateLearningScore({
    completedLessonIds: ["what-is-ai", "ai-basics", "clear-prompts", "clear-instructions"],
    lessonRecords: [
      { lessonId: "what-is-ai", quizScore: 80 },
      { lessonId: "ai-basics", quizScore: 100 },
      { lessonId: "clear-instructions", quizScore: 99 },
    ],
    masteredChapterIds: [levels[0].id, levels[1].id, "ai-foundations"],
    bestReviewScore: 89,
  });
  assert.deepEqual(score, {
    learningScore: 137,
    scoreBreakdown: { missionPoints: 20, quizPoints: 9, chapterPoints: 100, reviewPoints: 8 },
  });
  assert.equal(calculateLearningScore({
    completedLessonIds: [], lessonRecords: [], masteredChapterIds: [], bestReviewScore: 0,
  }).learningScore, 0);
});

test("the whole 80-session path enforces pledges, sequence, mastery AND project", () => {
  const state = normalizeState({});
  const complete = new Set<string>(), mastered = new Set<string>();
  assert.equal(lessonReady(levels[0].lessonIds[0], complete, mastered, state), false);
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    state.pledgeLevel = state.learnerAgreedLevel = i + 1;
    for (let j = 0; j < level.lessonIds.length; j++) {
      const id = level.lessonIds[j];
      assert.equal(lessonReady(id, complete, mastered, state), true, id);
      if (j + 1 < level.lessonIds.length) assert.equal(lessonReady(level.lessonIds[j + 1], complete, mastered, state), false);
      complete.add(id);
    }
    if (i + 1 < levels.length) {
      assert.equal(levelReady(i + 1, complete, mastered, state), false);
      mastered.add(level.id);
      assert.equal(levelReady(i + 1, complete, mastered, state), false);
      state.projects[level.id] = { approved: true, content: "Reviewed project." };
      assert.equal(levelReady(i + 1, complete, mastered, state), true);
    }
  }
  assert.equal(complete.size, 80);
});
test("historical lesson remains reviewable even without a new pledge", () => {
  assert.equal(lessonReady("test-app", new Set(["test-app"]), new Set(), normalizeState({})), true);
});
test("historical mastery cannot skip newly added lessons in an earlier level", () => {
  const state = normalizeState({ projects: { "responsible-use": { approved: true }, "ai-foundations": { approved: true } } });
  assert.equal(levelReady(2, new Set(levels[1].lessonIds), new Set(["ai-foundations", "responsible-use"]), state), false);
});
test("alias and canonical rows merge to one credit with earliest completion and best score", () => {
  const records = mergeProgressRecords([
    { lessonId: "ai-basics", reflection: "old", durationSeconds: 100, quizScore: 100, completedAt: "2025-01-01T00:00:00.000Z", talkDiscussedAt: "2025-01-02T00:00:00.000Z" },
    { lessonId: "what-is-ai", reflection: "new", durationSeconds: 50, quizScore: 80, completedAt: "2026-01-01T00:00:00.000Z", talkDiscussedAt: null },
  ]);
  assert.equal(records.length, 1);
  assert.equal(records[0].lessonId, "what-is-ai");
  assert.equal(records[0].quizScore, 100);
  assert.equal(records[0].durationSeconds, 150);
  assert.equal(records[0].reflection, "new");
  assert.equal(records[0].completedAt, "2025-01-01T00:00:00.000Z");
  assert.equal(records[0].talkDiscussedAt, "2025-01-02T00:00:00.000Z");
});
test("weak topics include failed checks and collapse aliases within each attempt", () => {
  assert.deepEqual(weakTopicCounts([["ai-basics", "what-is-ai", "not-a-lesson"], ["what-is-ai", "privacy-safe-use"]]), [
    { lessonId: "what-is-ai", misses: 2 }, { lessonId: "privacy-safe-use", misses: 1 },
  ]);
});
test("randomized retakes have fresh questions and grades include explanations and topics", () => {
  for (const lesson of (["10-12", "13-15", "16-plus"] as const).flatMap(band => getLessonsForAgeBand(band))) {
    const first = pickQuestions(lesson.questionBank, 5);
    const second = pickQuestions(lesson.questionBank, 5, first.map(q => q.id));
    assert.equal(new Set(first.map(q => q.id)).size, 5);
    assert.ok(first.some(q => q.mode === "scenario"));
    assert.ok(first.some(q => q.type !== "choice"));
    assert.ok(first.some(q => q.mode === "recall"));
    assert.ok(second.some(q => q.mode === "scenario"));
    assert.ok(second.some(q => q.type !== "choice"));
    assert.ok(second.some(q => !first.some(old => old.id === q.id)));
    const right = first.map(q => q.answer);
    assert.equal(gradeQuestions(first, right).score, 100);
    const fourRight = right.map(a => [...a]);
    fourRight[0] = [999];
    assert.equal(gradeQuestions(first, fourRight).score, 80);
    const wrong = first.map(() => [999]);
    const failed = gradeQuestions(first, wrong);
    assert.equal(failed.passed, false);
    assert.equal(failed.score, 0);
    assert.ok(failed.feedback.length);
    assert.ok(failed.missedLessonIds.includes(lesson.id));
    assert.throws(() => gradeQuestions(first, []));
  }
});
test("every age-band level check mixes formats and covers five different lesson topics", () => {
  for (const band of ["10-12", "13-15", "16-plus"] as const) for (const level of levels) {
    const bank = getLessonsForAgeBand(band).filter(lesson => lesson.levelId === level.id).flatMap(lesson => lesson.questionBank);
    const chosen = pickQuestions(bank, 5);
    assert.equal(chosen.length, 5);
    assert.equal(new Set(chosen.map(question => question.lessonId)).size, 5);
    assert.ok(chosen.some(question => question.mode === "scenario"));
    assert.ok(chosen.some(question => question.mode === "recall"));
    assert.ok(chosen.some(question => question.type !== "choice"));
  }
});
test("reflection rejects blanks, short filler and copied explanation, accepts own reasoning", () => {
  const lesson = getLessonsForAgeBand("10-12")[0];
  assert.equal(validReflection("", lesson.id, "10-12"), false);
  assert.equal(validReflection("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", lesson.id, "10-12"), false);
  assert.equal(validReflection(lesson.scenes[0].narration, lesson.id, "10-12"), false);
  assert.equal(validReflection("I would compare the computer's guess with a new example because the first guess might miss an important clue.", lesson.id, "10-12"), true);
});
