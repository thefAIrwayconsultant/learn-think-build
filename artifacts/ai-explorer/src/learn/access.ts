import type { ChildProfile } from '@workspace/api-client-react';
import { getLessonsForAgeBand, levels, normalizeLessonId } from '@workspace/curriculum';

export const PASS = 80;

export function completedSet(child: ChildProfile) { return new Set(child.completedLessonIds.map(normalizeLessonId)); }

export function projectApproved(child: ChildProfile, levelId: string) { return child.learningState.projects?.[levelId]?.approved === true; }

/** A level is finished (gate for the next one) only with mastery AND guardian-approved project. */
export function levelFinished(child: ChildProfile, levelId: string) {
  return child.masteredLevelIds.includes(levelId) && projectApproved(child, levelId) && levelLessonsDone(child, levelId);
}

export function finishedLevelCount(child: ChildProfile) {
  let n = 0;
  for (const level of levels) { if (levelFinished(child, level.id)) n++; else break; }
  return n;
}

/** The pledge number that can be agreed right now (never leaps past the unlocked level). */
export function nextPledgeLevel(child: ChildProfile) { return Math.min(levels.length, finishedLevelCount(child) + 1); }

export function levelUnlocked(child: ChildProfile, levelIndex: number) {
  if (levelIndex > finishedLevelCount(child)) return false;
  const s = child.learningState;
  return s.pledgeLevel >= levelIndex + 1 && s.learnerAgreedLevel >= levelIndex + 1;
}

export function lessonSequence(child: ChildProfile) {
  const lessons = getLessonsForAgeBand(child.ageBand ?? '10-12');
  return levels.flatMap((l) => l.lessonIds.map((id) => lessons.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x));
}

export function lessonUnlocked(child: ChildProfile, lessonId: string) {
  const id = normalizeLessonId(lessonId);
  const done = completedSet(child);
  if (done.has(id)) return true;
  const levelIndex = levels.findIndex((l) => l.lessonIds.includes(id));
  if (levelIndex < 0 || !levelUnlocked(child, levelIndex)) return false;
  const seq = lessonSequence(child);
  const i = seq.findIndex((l) => l.id === id);
  return seq.slice(0, i).every((l) => done.has(l.id));
}

export function levelLessonsDone(child: ChildProfile, levelId: string) {
  const level = levels.find((l) => l.id === levelId);
  const done = completedSet(child);
  return !!level && level.lessonIds.every((id) => done.has(id));
}

export function masteryUnlocked(child: ChildProfile, levelId: string) {
  const i = levels.findIndex((l) => l.id === levelId);
  return i >= 0 && levelUnlocked(child, i) && levelLessonsDone(child, levelId);
}

export function weekStart(now = new Date()) {
  const d = new Date(now); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export function lessonsThisWeek(child: ChildProfile) {
  const start = weekStart().getTime();
  return child.lessonRecords.filter((r) => r.completedAt && new Date(r.completedAt).getTime() >= start);
}

export type SkillState = 'Learning' | 'Practiced' | 'Mastered';

export function skillMap(child: ChildProfile) {
  const done = completedSet(child);
  return lessonSequence(child).map((lesson) => {
    const level = levels.find((l) => l.lessonIds.includes(lesson.id));
    const state: SkillState | null = !done.has(lesson.id) ? (lessonUnlocked(child, lesson.id) ? 'Learning' : null)
      : level && child.masteredLevelIds.includes(level.id) ? 'Mastered' : 'Practiced';
    return { lesson, state };
  });
}

export function highScores(child: ChildProfile) {
  const lessonScores = child.lessonRecords.filter((r) => typeof r.quizScore === 'number').map((r) => ({ id: normalizeLessonId(r.lessonId), score: r.quizScore as number }));
  const levelScores = (child.levelScores ?? {}) as Record<string, number>;
  return { lessonScores, levelScores, review: child.bestReviewScore ?? null, reviews: child.reviewCount ?? 0 };
}

export function badges(child: ChildProfile) {
  const titles = new Map(lessonSequence(child).map((l) => [l.id, l.title]));
  const out: { key: string; label: string; kind: 'lesson' | 'mastery' | 'review' }[] = [];
  for (const id of completedSet(child)) out.push({ key: `l-${id}`, label: titles.get(id) ?? id, kind: 'lesson' });
  for (const l of levels) if (child.masteredLevelIds.includes(l.id)) out.push({ key: `m-${l.id}`, label: `${l.title} mastery`, kind: 'mastery' });
  const reviews = child.reviewCount ?? 0;
  if (reviews >= 1) out.push({ key: 'r1', label: 'First weekly review', kind: 'review' });
  if (reviews >= 3) out.push({ key: 'r3', label: 'Three weekly reviews', kind: 'review' });
  if ((child.bestReviewScore ?? 0) >= 80) out.push({ key: 'r80', label: 'Review score 80%+', kind: 'review' });
  return out;
}
