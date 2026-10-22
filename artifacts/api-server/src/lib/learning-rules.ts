import { randomInt } from "node:crypto";
import { levels, getLessonsForAgeBand, normalizeLessonId, type AgeBand, type Question } from "@workspace/curriculum";

export const DAILY_LEARNING_LIMIT_SECONDS = 10 * 60;
const HEARTBEAT_MAX_GAP_SECONDS = 10;
const LEARNING_WINDOW_MILLISECONDS = 24 * 60 * 60 * 1000;

export type DailyLearningRecord = {
  windowStartedAt: Date;
  secondsUsed: number;
  lastHeartbeatAt: Date;
  active: boolean;
  activeSessions?: Record<string, string>;
};

export type DailyLearningSummary = {
  usedSeconds: number;
  remainingSeconds: number;
  resetAt: string;
};

export function summarizeDailyLearning(record: DailyLearningRecord | undefined, now = new Date()): DailyLearningSummary {
  if (!record || now.getTime() - record.windowStartedAt.getTime() >= LEARNING_WINDOW_MILLISECONDS) {
    return { usedSeconds: 0, remainingSeconds: DAILY_LEARNING_LIMIT_SECONDS,
      resetAt: new Date(now.getTime() + LEARNING_WINDOW_MILLISECONDS).toISOString() };
  }
  const elapsed = record.active
    ? Math.min(HEARTBEAT_MAX_GAP_SECONDS, Math.max(0, Math.floor((now.getTime() - record.lastHeartbeatAt.getTime()) / 1000)))
    : 0;
  const usedSeconds = Math.min(DAILY_LEARNING_LIMIT_SECONDS, Math.max(0, record.secondsUsed) + elapsed);
  return { usedSeconds, remainingSeconds: Math.max(0, DAILY_LEARNING_LIMIT_SECONDS - usedSeconds),
    resetAt: new Date(record.windowStartedAt.getTime() + LEARNING_WINDOW_MILLISECONDS).toISOString() };
}

export function advanceDailyLearning(
  record: DailyLearningRecord | undefined,
  active: boolean,
  sessionId: string,
  now = new Date(),
): DailyLearningRecord {
  const previous = summarizeDailyLearning(record, now);
  const expired = !record || now.getTime() - record.windowStartedAt.getTime() >= LEARNING_WINDOW_MILLISECONDS;
  const activeSessions = expired ? {} : { ...(record.activeSessions ?? {}) };
  for (const [id, lastSeen] of Object.entries(activeSessions)) {
    if (now.getTime() - new Date(lastSeen).getTime() > 15_000) delete activeSessions[id];
  }
  if (active && previous.remainingSeconds > 0) activeSessions[sessionId] = now.toISOString();
  else delete activeSessions[sessionId];
  return {
    windowStartedAt: expired ? now : record.windowStartedAt,
    secondsUsed: previous.usedSeconds,
    lastHeartbeatAt: now,
    active: Object.keys(activeSessions).length > 0,
    activeSessions,
  };
}

export type LearningState = {
  revision: number;
  weeklyGoal: number;
  pledgeLevel: number;
  learnerAgreedLevel: number;
  projects: Record<string, { content?: string; approved?: boolean; reviewedAt?: string | null; rubric?: boolean[] }>;
};

export function normalizeState(value: unknown): LearningState {
  const raw = (value && typeof value === "object" ? value : {}) as Partial<LearningState>;
  return { revision: raw.revision ?? 0, weeklyGoal: raw.weeklyGoal ?? 3, pledgeLevel: raw.pledgeLevel ?? 0,
    learnerAgreedLevel: raw.learnerAgreedLevel ?? 0, projects: raw.projects ?? {} };
}

export function canonicalIds(ids: string[]): string[] {
  const valid = new Set(levels.flatMap(level => level.lessonIds));
  return [...new Set(ids.map(normalizeLessonId).filter(id => valid.has(id)))];
}

export function levelReady(index: number, completed: Set<string>, mastered: Set<string>, state: LearningState): boolean {
  if (index < 0 || index >= levels.length) return false;
  return levels.slice(0, index).every(previous => mastered.has(previous.id)
    && state.projects[previous.id]?.approved === true
    && previous.lessonIds.every(id => completed.has(id)));
}

export type ProgressRecord = {
  lessonId: string; reflection: string | null; durationSeconds: number; quizScore: number | null;
  talkDiscussedAt: string | null; completedAt: string;
};
export function weakTopicCounts(missedSets: string[][]): { lessonId: string; misses: number }[] {
  const counts = new Map<string, number>();
  for (const ids of missedSets) for (const id of canonicalIds(ids)) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts].map(([lessonId, misses]) => ({ lessonId, misses })).sort((a, b) => b.misses - a.misses).slice(0, 5);
}
export function mergeProgressRecords(records: ProgressRecord[]): ProgressRecord[] {
  const byId = new Map<string, ProgressRecord>();
  // Prefer the current canonical record's reflection when both historical aliases exist.
  for (const row of [...records].sort((a, b) => Number(a.lessonId === normalizeLessonId(a.lessonId)) - Number(b.lessonId === normalizeLessonId(b.lessonId)))) {
    const id = normalizeLessonId(row.lessonId), previous = byId.get(id);
    const dates = [previous?.talkDiscussedAt, row.talkDiscussedAt].filter((d): d is string => !!d).sort();
    byId.set(id, { ...row, lessonId: id, reflection: row.reflection || previous?.reflection || null,
      durationSeconds: row.durationSeconds + (previous?.durationSeconds ?? 0),
      quizScore: row.quizScore === null && previous?.quizScore == null ? null : Math.max(row.quizScore ?? 0, previous?.quizScore ?? 0),
      completedAt: previous && previous.completedAt < row.completedAt ? previous.completedAt : row.completedAt,
      talkDiscussedAt: dates.at(-1) ?? null });
  }
  return [...byId.values()];
}

export function calculateLearningScore(input: {
  completedLessonIds: string[];
  lessonRecords: Array<{ lessonId: string; quizScore: number | null }>;
  masteredChapterIds: string[];
  bestReviewScore: number;
}) {
  const completed = new Set(canonicalIds(input.completedLessonIds));
  const bestQuizByLesson = new Map<string, number>();
  for (const record of input.lessonRecords) {
    const id = normalizeLessonId(record.lessonId);
    if (!completed.has(id) || typeof record.quizScore !== "number") continue;
    bestQuizByLesson.set(id, Math.max(bestQuizByLesson.get(id) ?? 0, Math.min(100, Math.max(0, record.quizScore))));
  }
  const currentChapterIds = new Set(input.masteredChapterIds.filter(id => levels.some(level => level.id === id)));
  const scoreBreakdown = {
    missionPoints: completed.size * 10,
    quizPoints: [...bestQuizByLesson.values()].reduce((sum, score) => sum + Math.floor(score / 20), 0),
    chapterPoints: currentChapterIds.size * 50,
    reviewPoints: Math.floor(Math.min(100, Math.max(0, input.bestReviewScore)) / 10),
  };
  return {
    learningScore: Object.values(scoreBreakdown).reduce((sum, points) => sum + points, 0),
    scoreBreakdown,
  };
}

export function lessonReady(id: string, completed: Set<string>, mastered: Set<string>, state: LearningState): boolean {
  const index = levels.findIndex(level => level.lessonIds.includes(id));
  if (index < 0) return false;
  if (completed.has(id)) return true; // Preserve review access to historical completions.
  const level = levels[index];
  const position = level.lessonIds.indexOf(id);
  return levelReady(index, completed, mastered, state)
    && state.pledgeLevel >= index + 1 && state.learnerAgreedLevel >= index + 1
    && level.lessonIds.slice(0, position).every(earlier => completed.has(earlier));
}

export function shuffle<T>(values: T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickQuestions(bank: Question[], count: number, previousIds: string[] = []): Question[] {
  const fresh = shuffle(bank.filter(q => !previousIds.includes(q.id)));
  const old = shuffle(bank.filter(q => previousIds.includes(q.id)));
  const pool = [...fresh, ...old];
  const chosen: Question[] = [];
  // Every full check mixes retrieval, a scenario and an ordering/sorting task.
  // Prefer a different topic for each format in level and weekly reviews.
  if (count >= 3) for (const matches of [
    (q: Question) => q.mode === "scenario",
    (q: Question) => q.type !== "choice",
    (q: Question) => q.type === "choice" && q.mode !== "scenario",
  ]) {
    const candidates = pool.filter(q => matches(q) && !chosen.some(item => item.id === q.id));
    const question = candidates.find(q => !chosen.some(item => item.lessonId === q.lessonId)) ?? candidates[0];
    if (question) chosen.push(question);
  }
  // Cover different topics before drawing extra questions from the same lesson.
  for (const question of pool) {
    if (chosen.length === count) break;
    if (!chosen.some(q => q.lessonId === question.lessonId)) chosen.push(question);
    if (chosen.length === count) break;
  }
  for (const question of pool) {
    if (chosen.length === count) break;
    if (!chosen.some(q => q.id === question.id)) chosen.push(question);
  }
  return shuffle(chosen);
}

export function gradeQuestions(questions: Question[], answers: number[][]) {
  if (answers.length !== questions.length) throw new Error("Answer every question before submitting.");
  const missed = questions.filter((question, index) => {
    const answer = answers[index];
    return !Array.isArray(answer) || answer.length !== question.answer.length
      || answer.some((value, i) => value !== question.answer[i]);
  });
  const score = Math.round(((questions.length - missed.length) / questions.length) * 100);
  return { score, passed: score >= 80, missedLessonIds: [...new Set(missed.map(q => q.lessonId))],
    feedback: missed.map(q => `${q.prompt} — ${q.explanation}`) };
}

export function validReflection(text: string, lessonId: string, ageBand: AgeBand): boolean {
  const normalized = text.trim().replace(/\s+/g, " ").toLowerCase();
  if (normalized.length < 30 || normalized.split(/\s+/).length < 7) return false;
  const lesson = getLessonsForAgeBand(ageBand).find(item => item.id === lessonId);
  if (!lesson) return false;
  const sources = [...lesson.scenes.map(scene => scene.narration), lesson.summary, lesson.reflectionPrompt];
  return !sources.some(source => source.toLowerCase().replace(/\s+/g, " ").includes(normalized))
    && !sources.some(source => source.length >= 60 && normalized.includes(source.toLowerCase().replace(/\s+/g, " ")));
}
