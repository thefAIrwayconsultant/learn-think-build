import { test } from "node:test";
import assert from "node:assert/strict";
import { getLessonsForAgeBand, levels, normalizeLessonId, type AgeBand } from "./index";

const bands: AgeBand[] = ["10-12", "13-15", "16-plus"];
const ids = levels.flatMap(level => level.lessonIds);
test("four complete levels and all legacy credits survive", () => {
  assert.equal(levels.length, 4);
  assert.equal(ids.length, 21);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ["what-is-ai", "clear-instructions", "check-the-answer", "privacy-safe-use",
    "school-integrity", "responsible-use", "prompt-design", "plan-an-app", "test-app", "iterate-app"]) assert.ok(ids.includes(id));
  assert.equal(normalizeLessonId("ai-basics"), "what-is-ai");
  assert.equal(normalizeLessonId("clear-prompts"), "clear-instructions");
  assert.equal(normalizeLessonId("check-answers"), "check-the-answer");
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
      assert.ok(lesson.durationMinutes >= ({ "10-12": 10, "13-15": 12, "16-plus": 15 })[band]);
      assert.ok(lesson.durationMinutes <= ({ "10-12": 12, "13-15": 15, "16-plus": 20 })[band]);
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
