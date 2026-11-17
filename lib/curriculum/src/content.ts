import type { AgeBand, Lesson, LevelId, Question } from "./types";

export type Check = [prompt: string, correct: string, wrong: string, wrong2: string, explanation: string];
export type Seed = {
  id: string; levelId: LevelId; title: string; topic: string;
  scenarios: [string, string, string];
  scripts: [string, string, string];
  visuals: [string, string, string];
  action: string; unsafe: string; takeaway: string;
  steps: [string, string, string, string];
  checks: Check[];
  activity: Lesson["activity"];
  activitiesByAgeBand?: [Lesson["activity"], Lesson["activity"], Lesson["activity"]];
  reflect: string; family: string;
};
export const bands: AgeBand[] = ["10-12", "13-15", "16-plus"];

const ageActivityChallenges = [
  "Find one clue in this moment and choose a next move.",
  "A friend has a different guess. Compare the clues before deciding.",
  "Weigh the upside and downside. Name one test that could change your call.",
] as const;

export function withAgeActivities(seed: Seed): Seed {
  if (seed.activitiesByAgeBand) return seed;
  const activitiesByAgeBand = seed.scenarios.map((scenario, band) => {
    const activity = structuredClone(seed.activity);
    activity.scenario = scenario;
    activity.instruction = `${ageActivityChallenges[band]} ${activity.instruction}`;
    activity.prompt = `${scenario} ${ageActivityChallenges[band]}`;
    return activity;
  }) as [Lesson["activity"], Lesson["activity"], Lesson["activity"]];
  return { ...seed, activitiesByAgeBand };
}

export function makeLesson(seed: Seed, ageBand: AgeBand, sessionNumber = 1, chapterSessionCount = 1): Lesson {
  const band = bands.indexOf(ageBand);
  const scenario = seed.scenarios[band];
  const questionSeeds: Check[] = [
    [`${scenario} What is the best next step?`, seed.action, seed.unsafe, "Let the AI decide without checking.", seed.takeaway],
    ...seed.checks,
    [`How would you explain the main lesson to ${band === 0 ? "Pip" : band === 1 ? "a classmate" : "a project teammate"}?`,
      seed.takeaway, seed.unsafe, "A polished AI answer does not need human judgment.", seed.takeaway],
  ];
  const questionBank: Question[] = questionSeeds.map(([prompt, correct, wrong, wrong2, explanation], index) => {
    const position = (index + band) % 3;
    const options = [wrong, wrong2];
    options.splice(position, 0, correct);
    return { id: `${seed.id}:${ageBand}:q${index + 1}`, lessonId: seed.id, type: "choice", mode: index === 0 ? "scenario" : "recall", prompt, options,
      answer: [position], explanation };
  });
  questionBank.push({
    id: `${seed.id}:${ageBand}:order`, lessonId: seed.id, type: "order",
    prompt: `Put this ${band === 0 ? "safe plan" : band === 1 ? "decision process" : "responsible workflow"} in order, first to last.`,
    options: [seed.steps[2], seed.steps[0], seed.steps[3], seed.steps[1]],
    answer: [1, 3, 0, 2], explanation: seed.steps.join(" → "),
  });
  const paragraphs = seed.scripts[band].split("~");
  const activity = structuredClone(seed.activitiesByAgeBand?.[band] ?? seed.activity);
  if (sessionNumber === 19 || sessionNumber === 20) {
    const bossChallenge = band === 0
      ? "Boss mission: use two clues, make a guess, and check it."
      : band === 1
        ? "Boss mission: combine two clues, test a tempting guess, and explain your choice."
        : "Boss mission: weigh the tradeoff, test an edge case, and defend your call with evidence.";
    activity.instruction = `${bossChallenge} ${activity.instruction}`;
  }
  return {
    id: seed.id, levelId: seed.levelId, sessionNumber, chapterSessionCount, title: seed.title, topic: seed.topic, ageBand,
    summary: seed.takeaway, durationMinutes: 10,
    hook: { scenario, prediction: band === 0 ? "What do you think you should do next?" : "What would you predict, and why?",
      options: [seed.action, seed.unsafe], feedback: seed.takeaway },
    scenes: paragraphs.map((narration, index) => ({
      title: ["Understand it", "Look closer", "Make a safe choice"][index],
      narration: band === 0 && index === 0 ? `Hi, I'm Pip! ${narration.trim()}` : narration.trim(),
      visual: seed.visuals[index],
    })),
    activity: { ...activity, scenario },
    reflectionPrompt: seed.reflect,
    sentenceStarters: band === 0 ? ["I used to think… Now I know…", "One safe choice I can make is… because…", "If this happened to me, I would…"] : undefined,
    familyPrompt: seed.family, questionBank,
  };
}

export function sorting(kind: Lesson["activity"]["kind"], title: string, instruction: string,
  categories: string[], items: [string, number, string][], extra: Record<string, unknown> = {}): Lesson["activity"] {
  return { kind, title, instruction, categories, items: items.map(([text, category, why]) => ({ text, category, why })), ...extra };
}
export function branching(title: string, instruction: string, choices: [string, boolean, string][]): Lesson["activity"] {
  return { kind: "branching", title, instruction, choices: choices.map(([text, correct, feedback]) => ({ text, correct, feedback })) };
}
