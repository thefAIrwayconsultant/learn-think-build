import { test } from "node:test";
import assert from "node:assert/strict";
import { getLessonsForAgeBand, getSampleMissionPreview, levels, normalizeLessonId, type AgeBand } from "./index";
import { makeLesson, type Seed } from "./content";

const bands: AgeBand[] = ["10-12", "13-15", "16-plus"];
const ids = levels.flatMap(level => level.lessonIds);
test("four complete chapters contain 20 sessions each and preserve every legacy lesson ID", () => {
  assert.equal(levels.length, 4);
  assert.equal(ids.length, 80);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ["what-is-ai", "clear-instructions", "check-the-answer", "privacy-safe-use",
    "school-integrity", "responsible-use", "prompt-design", "plan-an-app", "test-app", "iterate-app"]) assert.ok(ids.includes(id));
  assert.equal(normalizeLessonId("ai-basics"), "what-is-ai");
  assert.equal(normalizeLessonId("clear-prompts"), "clear-instructions");
  assert.equal(normalizeLessonId("check-answers"), "check-the-answer");
  assert.deepEqual(levels.map((level) => level.lessonIds.length), [20, 20, 20, 20]);
  for (const level of levels) {
    assert.ok(level.project.prompt.length >= 60);
    assert.equal(level.project.rubric.length, 3);
  }
});
for (const band of bands) {
  for (const lesson of getLessonsForAgeBand(band)) {
    test(`${band}: ${lesson.id} has complete scenes, activity and bank`, () => {
      assert.equal(lesson.scenes.length, 3);
      for (const scene of lesson.scenes) {
        assert.ok(scene.narration.split(/\s+/).length >= 25, "Narration must explain, not be a placeholder");
        assert.ok(scene.narration.split(/\s+/).length < 700, "Explainers must stay under six minutes");
        assert.ok(scene.visual.length > 10);
      }
      assert.ok(lesson.hook.scenario.length > 25);
      assert.ok(lesson.familyPrompt.length > 25);
      assert.ok(lesson.reflectionPrompt.length > 25);
       assert.equal(lesson.durationMinutes, 10);
       assert.ok(lesson.sessionNumber >= 1 && lesson.sessionNumber <= 20);
       assert.equal(lesson.chapterSessionCount, 20);
      assert.ok(lesson.questionBank.length >= 8);
      assert.equal(new Set(lesson.questionBank.map(q => q.id)).size, lesson.questionBank.length);
      for (const question of lesson.questionBank) {
        assert.equal(question.lessonId, lesson.id);
        assert.ok(question.explanation.length > 15);
        assert.ok(question.options.length >= 3);
        assert.equal(new Set(question.options).size, question.options.length);
        assert.ok(question.answer.length > 0);
        assert.ok(question.answer.every(n => Number.isInteger(n) && n >= 0 && n < question.options.length));
        if (question.type === "order") assert.equal(question.answer.length, question.options.length);
      }
      assert.ok(lesson.questionBank.some(q => q.type === "order"));
      const a = lesson.activity;
      const items = a.items as unknown[] | undefined;
      const fields = a.fields as unknown[] | undefined;
      const choices = a.choices as { correct: boolean }[] | undefined;
      assert.ok(items?.length || fields?.length || choices?.length);
      if (choices) assert.equal(choices.filter(c => c.correct).length, 1);
    });
  }
}
test("all modes have real data, and every band has distinct scenarios/scripts/banks", () => {
  assert.equal(new Set(getLessonsForAgeBand("10-12").map(l => l.activity.kind)).size, 9);
  for (const id of ids) {
    const versions = bands.map(band => getLessonsForAgeBand(band).find(l => l.id === id)!);
    assert.equal(new Set(versions.map(l => l.hook.scenario)).size, 3);
    assert.equal(new Set(versions.map(l => l.scenes[0].narration)).size, 3);
    assert.equal(new Set(versions.flatMap(l => l.questionBank.map(q => q.id))).size, 24);
  }
});

test("age-specific seed activities are selected with a shared-activity fallback", () => {
  const seed: Seed = {
    id: "activity-band-test",
    levelId: "ai-foundations" as const,
    title: "Activity selection",
    topic: "Activity selection",
    scenarios: ["A child sees a red card.", "A friend shares a confusing card.", "Two plausible cards compete."] ,
    scripts: ["A short scene.~A second scene.~A final scene.", "A short scene.~A second scene.~A final scene.", "A short scene.~A second scene.~A final scene."],
    visuals: ["First visual", "Second visual", "Third visual"],
    action: "Choose the checked card.",
    unsafe: "Choose without checking.",
    takeaway: "The card needs a clue.",
    steps: ["Notice", "Compare", "Choose", "Check"],
    checks: [],
    activity: { kind: "branching" as const, title: "Shared activity", instruction: "Use the shared activity.", choices: [{ text: "Shared choice", correct: true, feedback: "Good check." }] },
    activitiesByAgeBand: [
      { kind: "branching" as const, title: "Starter activity", instruction: "Spot one clue.", choices: [{ text: "Starter choice", correct: true, feedback: "One clue is enough here." }] },
      { kind: "branching" as const, title: "Explorer activity", instruction: "Compare the clues.", choices: [{ text: "Explorer choice", correct: true, feedback: "Compare before choosing." }] },
      { kind: "branching" as const, title: "Builder activity", instruction: "Weigh the tradeoff.", choices: [{ text: "Builder choice", correct: true, feedback: "The tradeoff matters." }] },
    ],
    reflect: "What clue changes your choice, and why?",
    family: "Which clue would you check together?",
  };
  const [starter, explorer, builder] = bands.map((band) => makeLesson(seed, band));
  assert.deepEqual([starter.activity.title, explorer.activity.title, builder.activity.title],
    ["Starter activity", "Explorer activity", "Builder activity"]);
  const fallback = { ...seed, activitiesByAgeBand: undefined };
  assert.equal(makeLesson(fallback, "16-plus").activity.title, "Shared activity");
});

test("sample mission preview uses the real first mission goal and steps", () => {
  const preview = getSampleMissionPreview();
  const firstMission = getLessonsForAgeBand("10-12")[0];
  assert.equal(preview.chapterTitle, levels[0].title);
  assert.equal(preview.id, levels[0].lessonIds[0]);
  assert.equal(preview.title, firstMission.title);
  assert.equal(preview.goal, "Ask what it predicts and test its guess.");
  assert.deepEqual(preview.steps, ["Name the task", "Look at the examples", "Test a prediction", "Decide whether to trust it"]);
  assert.equal(preview.durationMinutes, firstMission.durationMinutes);
});
