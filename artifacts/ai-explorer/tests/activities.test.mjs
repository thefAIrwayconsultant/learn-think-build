import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { getLessonsForAgeBand } from '@workspace/curriculum';

const win = new Window({ url: 'http://localhost/' });
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Event', 'MouseEvent', 'Node']) {
  Object.defineProperty(globalThis, name, { value: name === 'window' ? win : win[name], configurable: true });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { act } = React;
const { createRoot } = await import('react-dom/client');
const { LessonActivity } = await import('../src/learn/activities.tsx');

for (const band of ['10-12', '13-15', '16-plus']) for (const lesson of getLessonsForAgeBand(band)) {
  test(`${band}: ${lesson.id} activity requires a real valid response`, async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    let evidence = '';
    const click = async (selector) => {
      const button = host.querySelector(selector);
      assert.ok(button, `Missing control ${selector} in ${lesson.id}`);
      assert.equal(button.disabled, false, `${selector} should be usable`);
      await act(() => button.click());
    };
    const type = async (element, value) => {
      const setter = Object.getOwnPropertyDescriptor(win.HTMLTextAreaElement.prototype, 'value').set;
      await act(() => { setter.call(element, value); element.dispatchEvent(new win.Event('input', { bubbles: true })); });
    };
    try {
      await act(() => root.render(React.createElement(LessonActivity, { lesson, onDone: (value) => { evidence = value; } })));
      const data = lesson.activity;
      assert.ok(host.querySelector(`[data-testid="activity-${data.kind}"]`));
      assert.ok(host.querySelector('h3')?.textContent.trim());
      assert.equal(evidence, '', 'Rendering alone must not complete an activity');

      if (data.kind === 'prompt-fixer' || data.kind === 'app-planner') {
        await click('[data-testid="button-check-fields"]');
        assert.equal(evidence, '', 'Empty fields must not complete');
        const fields = [...host.querySelectorAll('textarea')];
        assert.equal(fields.length, data.fields.length);
        const safeValues = [];
        for (const [i, field] of fields.entries()) {
          const label = data.fields[i].toLowerCase();
          const text = label.includes('format') ? 'A numbered list with five short steps.'
            : label.includes('limit') ? 'Under 120 words. Never include passwords or personal details.'
            : label.includes('safety') ? 'Keep personal data private. Do not store passwords. Ask an adult to test.'
            : label.includes('screen') ? 'A home screen, plant list, and watering checklist.'
            : label.includes('user') ? 'A made-up family learning how to grow vegetables.'
            : label.includes('action') ? 'Add a plant and mark its watering as complete.'
            : label.includes('context') ? 'Use a fictional learner growing beans for the first time.'
            : 'Help a family plan how to grow and care for bean plants.';
          safeValues.push(text);
          await type(field, text);
        }
        await type(fields[0], 'My password is pretend-example-ONLY.');
        await click('[data-testid="button-check-fields"]');
        assert.equal(evidence, '', 'A concrete secret must not pass');
        await type(fields[0], safeValues[0]);
        await click('[data-testid="button-check-fields"]');
        assert.ok(evidence.length > 20, host.textContent);
        await type(fields[0], 'short');
        assert.equal(evidence, '', 'An invalid edit must revoke completion');
      } else if (data.kind === 'redactor') {
        await click('[data-testid="button-check-redaction"]');
        assert.equal(evidence, '', 'Unredacted private information must not pass');
        for (const [i, item] of data.items.entries()) if (item.category === 1) await click(`[data-testid="redact-${i}"]`);
        await click('[data-testid="button-check-redaction"]');
        assert.ok(evidence.length > 20, 'Safe redaction should complete');
        await click(`[data-testid="redact-${data.items.findIndex(item => item.category === 1)}"]`);
        assert.equal(evidence, '', 'Revealing private information must revoke completion');
      } else if (data.kind === 'predictor' || data.kind === 'branching') {
        const wrong = data.choices.findIndex(choice => !choice.correct);
        if (wrong >= 0) { await click(`[data-testid="choice-${wrong}"]`); assert.equal(evidence, ''); }
        await click(`[data-testid="choice-${data.choices.findIndex(choice => choice.correct)}"]`);
        if (data.kind === 'predictor' && data.contextChoices?.length) {
          assert.equal(evidence, '', 'Both prediction contexts are required');
          await click('button.primary-button');
          await click(`[data-testid="choice-${data.contextChoices.findIndex(choice => choice.correct)}"]`);
        }
        assert.ok(evidence.length > 20, 'A safe completed choice must produce evidence');
      } else {
        let payload = '';
        const transfer = { getData: () => payload, setData: (_type, value) => { payload = value; }, effectAllowed: '', dropEffect: '' };
        const dragEvent = async (selector, name) => {
          const event = new window.Event(name, { bubbles: true, cancelable: true });
          Object.defineProperty(event, 'dataTransfer', { value: transfer });
          await act(() => { host.querySelector(selector).dispatchEvent(event); });
        };
        const first = data.items[0];
        payload = 'foreign or malformed item';
        await dragEvent(`[data-testid="sort-target-${first.category}"]`, 'drop');
        assert.ok(host.querySelector(`[data-testid="classify-0-${first.category}"]`), 'Foreign drops must not classify an item');
        await dragEvent('[data-testid="sort-card-0"]', 'dragstart');
        await dragEvent(`[data-testid="sort-target-${(first.category + 1) % data.categories.length}"]`, 'drop');
        assert.ok(host.querySelector(`[data-testid="classify-0-${first.category}"]`), 'Wrong drop must require another attempt');
        await dragEvent(`[data-testid="sort-target-${first.category}"]`, 'drop');
        assert.equal(host.querySelector(`[data-testid="classify-0-${first.category}"]`), null, 'Correct drop must classify the card');
        for (const [i, item] of data.items.entries()) if (i > 0) await click(`[data-testid="classify-${i}-${item.category}"]`);
        assert.equal(evidence, '', 'Correct sorting still requires the completion/test step');
        if (host.querySelector('[data-testid="button-train-model"]')) await click('[data-testid="button-train-model"]');
        if (data.kind === 'hallucination') {
          await click('[data-testid="button-verify-stage"]');
          assert.equal(evidence, '', 'Spotting errors alone is not verification');
          await click(`[data-testid="verify-${data.choices.findIndex(choice => choice.correct)}"]`);
        }
        await click('[data-testid="button-activity-done"]');
        assert.ok(evidence.length > 20, 'Finished sorting/testing must produce evidence');
        if (data.kind !== 'hallucination') assert.ok(evidence.includes(`in ${data.items.length + 1} attempts`), 'Activity attempts must not be double-counted');
      }
    } finally {
      await act(() => root.unmount());
      host.remove();
    }
  });
}
