export * from "./types";
import type { AgeBand, Level, LevelId, Lesson, LegacyLevelId } from "./types";
import { bands, makeLesson, type Seed } from "./content";
import { builders } from "./builders";
import { chapterFourDays, chapterOneDays, chapterThreeDays, chapterTwoDays, dailySeedAsLessonSeed } from "./deep-chapters";
import { foundations } from "./foundations";
import { prompts } from "./prompts";
import { responsible } from "./responsible";

const aliases: Record<string, string> = {
  "ai-basics": "what-is-ai",
  "clear-prompts": "clear-instructions",
  "check-answers": "check-the-answer",
};

/** Existing chapter scores and projects are retained as history, but never satisfy a new chapter gate. */
export const legacyLevelNames: Record<string, string> = {
  "ai-foundations": "AI Foundations",
  "responsible-use": "Safe & Responsible Use",
  "prompt-craft": "Prompt Craft",
  "app-builder": "App Builder",
};

const levelAliases: Record<string, LevelId> = {
  "ai-foundations": "meet-the-ais",
  "prompt-craft": "prompting-power",
  "responsible-use": "when-to-use-ai",
  "app-builder": "when-to-trust-ai",
};

export function normalizeLessonId(id: string): string {
  return aliases[id] ?? id;
}

export function normalizeLevelId(id: string): LevelId | string {
  return levelAliases[id] ?? id;
}

const oldSeeds: Seed[] = [...foundations, ...responsible, ...prompts, ...builders];
const oldSeedsById = new Map(oldSeeds.map((seed) => [seed.id, seed]));
const daySets = [chapterOneDays, chapterTwoDays, chapterThreeDays, chapterFourDays];
const dailySeedsById = new Map(daySets.flat().map((seed) => [seed.id, seed]));

function idsForChapter(chapter: number) {
  if (chapter === 0) {
    return ["what-is-ai", "chatbot-predictions", ...chapterOneDays.slice(0, 16).map((day) => day.id),
      "training-data", chapterOneDays[16].id];
  }
  if (chapter === 1) {
    return ["clear-instructions", ...chapterTwoDays.slice(0, 7).map((day) => day.id), "prompt-design",
      ...chapterTwoDays.slice(7, 14).map((day) => day.id), "iterate-prompts", "plan-an-app", "iterate-app", "present-app"];
  }
  if (chapter === 2) {
    return ["ai-not-a-friend", "ai-as-tutor", ...chapterThreeDays.slice(0, 5).map((day) => day.id),
      "school-integrity", "responsible-use", "privacy-safe-use", "create-and-credit",
      ...chapterThreeDays.slice(5, 14).map((day) => day.id)];
  }
  return ["check-the-answer", ...chapterFourDays.slice(0, 2).map((day) => day.id), "verify-and-cite",
    ...chapterFourDays.slice(2, 6).map((day) => day.id), "real-or-ai", "bias-and-fairness",
    ...chapterFourDays.slice(6, 9).map((day) => day.id), "scams-and-pressure",
    ...chapterFourDays.slice(9, 11).map((day) => day.id), "test-app",
    ...chapterFourDays.slice(11, 14).map((day) => day.id)];
}

const chapterDefinitions: Omit<Level, "lessonIds">[] = [
  {
    id: "meet-the-ais",
    title: "Meet the AIs",
    domain: "Discover · Compare · Experiment",
    description: "Explore language models, picture makers, recommendations, voices, vision, games, robots, and the patterns behind their different jobs.",
    project: {
      prompt: "Make a one-page AI field guide. Show how at least four AI types take input, find patterns, and produce a result. Compare what each does well, what it might miss, and one test a person could try.",
      rubric: ["Explains four different kinds of AI and their inputs or outputs", "Shows how patterns or examples affect at least one result", "Includes a limitation and a safe test for each example"],
    },
  },
  {
    id: "prompting-power",
    title: "Prompting Power",
    domain: "Imagine · Ask · Remix",
    description: "Build stronger prompts with clear goals, useful context, format, limits, examples, roles, and focused follow-ups.",
    project: {
      prompt: "Make a prompt workshop page. Include one vague prompt, an improved prompt with goal, context, format, and safe limits, two focused revisions, and a short note showing what you kept or changed.",
      rubric: ["Uses all four prompt parts without personal information", "Shows a specific follow-up or example that improves the result", "Explains what the learner chose, changed, and still needs to check"],
    },
  },
  {
    id: "when-to-use-ai",
    title: "When to Use AI (and When Not To)",
    domain: "Choose · Create · Pause",
    description: "Try low-risk ideas while protecting privacy, learning, originality, real relationships, and big decisions.",
    project: {
      prompt: "Create an AI-use compass for a curious learner. Include three safe, checkable uses, clear situations where a person should come first, a privacy rule, a schoolwork honesty rule, and what to do if an AI interaction feels wrong.",
      rubric: ["Separates low-risk uses from high-stakes or private situations", "Includes a practical privacy and own-thinking rule", "Names a trusted adult and an honest-use boundary"],
    },
  },
  {
    id: "when-to-trust-ai",
    title: "When to Trust AI (and When Not To)",
    domain: "Question · Verify · Decide",
    description: "Investigate confident mistakes, source evidence, bias, deepfakes, voice clones, pressure tactics, and the need for a trusted human.",
    project: {
      prompt: "Build a trust-detective guide using fictional claims only. Show how to check a source, spot one missing-data or bias problem, check image or voice context, and decide when to stop and get human help.",
      rubric: ["Checks an exact claim against relevant evidence", "Explains a bias, missing-example, image, or voice clue and its limits", "Sets a sensible trust boundary and includes a trusted-adult step"],
    },
  },
];

export const levels: Level[] = chapterDefinitions.map((chapter, index) => ({ ...chapter, lessonIds: idsForChapter(index) }));
export const chapters = levels;

if (levels.some((chapter) => chapter.lessonIds.length !== 20)
  || new Set(levels.flatMap((chapter) => chapter.lessonIds)).size !== 80) {
  throw new Error("The four chapters must each have 20 unique daily sessions.");
}

const legacyLevelIds = new Set(Object.keys(legacyLevelNames) as LegacyLevelId[]);
export function isCurrentChapterId(id: string): id is LevelId {
  return levels.some((chapter) => chapter.id === id);
}
export function isLegacyChapterId(id: string): id is LegacyLevelId {
  return legacyLevelIds.has(id as LegacyLevelId);
}

export function getLessonsForAgeBand(ageBand: AgeBand): Lesson[] {
  const ageIndex = bands.indexOf(ageBand);
  if (ageIndex < 0) return [];
  return levels.flatMap((chapter) => chapter.lessonIds.map((id, index) => {
    const existing = oldSeedsById.get(id);
    const daily = dailySeedsById.get(id);
    const seed = existing
      ? { ...existing, levelId: chapter.id }
      : daily ? dailySeedAsLessonSeed(daily, chapter.id, ageIndex) : null;
    if (!seed) throw new Error(`Chapter session "${id}" has no curriculum content.`);
    return makeLesson(seed, ageBand, index + 1, chapter.lessonIds.length);
  }));
}

export function getSampleMissionPreview() {
  const chapter = levels[0];
  const lesson = getLessonsForAgeBand("10-12").find((item) => item.id === chapter?.lessonIds[0]);
  const seed = lesson ? oldSeedsById.get(lesson.id) : undefined;
  if (!chapter || !lesson || !seed) {
    throw new Error("The first chapter sample mission is missing curriculum content.");
  }
  return {
    chapterTitle: chapter.title,
    id: lesson.id,
    title: lesson.title,
    goal: seed.action,
    steps: [...seed.steps],
    durationMinutes: lesson.durationMinutes,
  };
}

export const lessons: Lesson[] = bands.flatMap((age) => getLessonsForAgeBand(age));
