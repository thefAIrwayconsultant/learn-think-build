// Component integration tests with a simulated HTTP boundary, not live-browser E2E.
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { register } from 'node:module';
import { Window } from 'happy-dom';
import { getLessonsForAgeBand, levels } from '@workspace/curriculum';
import { gradeQuestions, pickQuestions, validReflection } from '../../api-server/src/lib/learning-rules.ts';

const win = new Window({ url: 'http://localhost/' });
for (const name of ['window', 'document', 'navigator', 'location', 'history', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Event', 'MouseEvent', 'Node']) {
  Object.defineProperty(globalThis, name, { value: name === 'window' ? win : win[name], configurable: true });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
for (const name of ['addEventListener', 'removeEventListener', 'dispatchEvent']) globalThis[name] = win[name].bind(win);
// Only capability/control testing: no audible speech is asserted by these tests.
win.speechSynthesis = { cancel() {}, pause() {}, resume() {}, speak() {}, getVoices() { return []; } };
win.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
globalThis.SpeechSynthesisUtterance = win.SpeechSynthesisUtterance;
const React = await import('react');
const { act } = React;
const { createRoot } = await import('react-dom/client');
const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query');
register('./ignore-styles.mjs', import.meta.url);
const { LessonFlow } = await import('../src/learn/LessonFlow.tsx');

for (const band of ['10-12', '13-15', '16-plus']) {
  const lessons = getLessonsForAgeBand(band);
  const bankById = new Map(lessons.flatMap(lesson => lesson.questionBank).map(q => [q.id, q]));
  for (const [index, lesson] of lessons.entries()) test(`${band}: ${lesson.id} complete loop and failed-check recovery`, async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const levelIndex = levels.findIndex(level => level.id === lesson.levelId);
    const child = {
      id: '11111111-1111-4111-8111-111111111111', displayName: 'Practice learner', ageBand: band,
      completedLessonIds: lessons.slice(0, index).map(item => item.id),
      masteredLevelIds: levels.slice(0, levelIndex).map(level => level.id), lessonRecords: [], createdAt: new Date().toISOString(),
      learningState: { revision: 0, weeklyGoal: 3, pledgeLevel: 4, learnerAgreedLevel: 4,
        projects: Object.fromEntries(levels.slice(0, levelIndex).map(level => [level.id, { approved: true, content: 'Previously reviewed practice project.', rubric: [true, true, true], reviewedAt: null }])) },
    };
    const click = async selector => {
      const element = host.querySelector(selector);
      assert.ok(element, `${lesson.id}: missing ${selector}; ${host.textContent.slice(-500)}`);
      assert.ok(!element.disabled, `${selector} was disabled`);
      await act(async () => { element.click(); });
    };
    const type = async (element, value) => {
      await act(() => {
        Object.getOwnPropertyDescriptor(win.HTMLTextAreaElement.prototype, 'value').set.call(element, value);
        element.dispatchEvent(new win.Event('input', { bubbles: true }));
      });
    };
    let questions = [], previousIds = [], attemptId = '', saved = false, failed = false;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, options) => {
      const url = String(input);
      const body = JSON.parse(options.body);
      if (url.endsWith('/quiz')) {
        assert.equal(body.kind, 'lesson'); assert.equal(body.targetId, lesson.id);
        questions = pickQuestions(lesson.questionBank, 5, previousIds);
        if (previousIds.length) assert.ok(questions.some(q => !previousIds.includes(q.id)));
        previousIds = questions.map(q => q.id); attemptId = randomUUID();
        return Response.json({ attemptId, questions: questions.map(({ answer, explanation, ...publicQuestion }) => publicQuestion) });
      }
      assert.ok(url.endsWith('/progress'), `Unexpected request ${url}`);
      assert.equal(body.attemptId, attemptId); assert.equal(body.lessonId, lesson.id);
      assert.ok(body.watchCompleted && body.activityCompleted);
      assert.ok(body.activityEvidence.length >= 10 && body.activityEvidence.length <= 8000);
      assert.ok(validReflection(body.reflection, lesson.id, band));
      assert.ok(body.durationSeconds >= 1 && body.durationSeconds <= 7200);
      const grade = gradeQuestions(questions, body.answers);
      if (!grade.passed) { failed = true; return Response.json({ error: 'Review the explanations and try again.', ...grade }, { status: 422 }); }
      saved = true;
      return Response.json({});
    };
    const answer = async (question, correct = true) => {
      const values = correct ? question.answer : question.type === 'choice'
        ? [(question.answer[0] + 1) % question.options.length] : [...question.answer].reverse();
      for (const option of values) await click(`[data-testid="${question.type === 'choice' ? 'radio' : 'order-add'}-${question.id}-${option}"]`);
    };
    try {
      await act(() => root.render(React.createElement(QueryClientProvider, { client },
        React.createElement(LessonFlow, { child, lessonId: lesson.id }))));
      assert.match(host.querySelector('[data-testid="text-step-count"]').textContent, new RegExp(`Step 1 of ${index ? 6 : 5}`));
      if (index) {
        const ids = new Set([...host.querySelectorAll('input[type="radio"]')].map(input => input.name.slice(2)));
        assert.equal(ids.size, 2, 'Spaced review must retrieve two earlier questions');
        for (const id of ids) await answer(bankById.get(id));
        await click('button.primary-button');
        await click('[data-testid="button-next"]');
      }
      assert.equal(host.querySelector('[data-testid="button-next"]'), null, 'Hook prediction cannot be skipped');
      await click('[data-testid="hook-option-0"]');
      await click('[data-testid="button-next"]');
      assert.ok(host.querySelector('[data-testid="button-watch-play"]'));
      assert.ok(host.querySelector('[data-testid="button-read-watch-all"]'));
      assert.equal(host.querySelector('[data-testid="button-next"]'), null, 'Unviewed explainer cannot be skipped');
      for (let scene = 0; scene < 3; scene++) await click(`[data-testid="button-mark-read-${scene}"]`);
      await click('[data-testid="button-next"]');
      assert.equal(host.querySelector('[data-testid="button-next"]'), null, 'Unfinished activity cannot be skipped');
      const activity = lesson.activity;
      if (activity.kind === 'prompt-fixer' || activity.kind === 'app-planner') {
        for (const field of host.querySelectorAll('.field-block textarea')) await type(field, 'A numbered list of safe plant-care steps. Never include passwords or personal data. Ask an adult to test.');
        await click('[data-testid="button-check-fields"]');
      } else if (activity.kind === 'redactor') {
        for (const [i, item] of activity.items.entries()) if (item.category === 1) await click(`[data-testid="redact-${i}"]`);
        await click('[data-testid="button-check-redaction"]');
      } else if (activity.kind === 'predictor' || activity.kind === 'branching') {
        await click(`[data-testid="choice-${activity.choices.findIndex(choice => choice.correct)}"]`);
        if (activity.kind === 'predictor' && activity.contextChoices?.length) {
          await click('button.primary-button');
          await click(`[data-testid="choice-${activity.contextChoices.findIndex(choice => choice.correct)}"]`);
        }
      } else {
        for (const [i, item] of activity.items.entries()) await click(`[data-testid="classify-${i}-${item.category}"]`);
        if (host.querySelector('[data-testid="button-train-model"]')) await click('[data-testid="button-train-model"]');
        if (activity.kind === 'hallucination') {
          await click('[data-testid="button-verify-stage"]');
          await click(`[data-testid="verify-${activity.choices.findIndex(choice => choice.correct)}"]`);
        }
        await click('[data-testid="button-activity-done"]');
      }
      await click('[data-testid="button-next"]');
      await click('[data-testid="button-next"]');
      assert.ok(host.querySelector('[data-testid="input-reflection"]'), 'A blank reflection must stay at Think');
      await type(host.querySelector('[data-testid="input-reflection"]'),
        'I would pause and ask a trusted grown-up to review my idea. Trying one small change helps me explain my own reasoning before I depend on a tool.');
      await click('[data-testid="button-next"]');
      await click('[data-testid="button-start-quiz"]');
      for (const q of questions) await answer(q, false);
      await click('[data-testid="button-submit-quiz"]');
      assert.ok(failed && !saved, 'A failed check must not save completion');
      assert.equal(host.querySelector('[data-testid="lesson-completion"]'), null);
      await click('[data-testid="button-start-quiz"]');
      for (const [questionIndex, q] of questions.entries()) await answer(q, index !== 0 || questionIndex !== 0);
      await click('[data-testid="button-submit-quiz"]');
      assert.ok(saved, 'A valid reflection, completed activity, viewed scenes and passing check must save');
      assert.ok(host.querySelector('[data-testid="lesson-completion"]'));
      if (index === 0) {
        assert.ok(host.querySelector('[data-testid="passed-check-review"]'), 'An 80% pass must explain and retry its missed answer');
        assert.equal(host.querySelector('[data-testid="link-finish-home"]'), null);
        await answer(questions[0]);
        assert.match(host.querySelector('[data-testid="passed-review-status"]').textContent, /All correct/);
        assert.ok(host.querySelector('[data-testid="link-finish-home"]'));
      }
      assert.ok(host.textContent.includes(lesson.familyPrompt));
      assert.match(host.textContent, /Take a break/);
    } finally {
      globalThis.fetch = originalFetch;
      await act(() => root.unmount());
      client.clear(); host.remove();
    }
  });
}
