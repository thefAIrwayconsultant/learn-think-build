import { useState, type ReactNode } from 'react';
import type { AgeBand } from './audience';
import './learning-widgets.css';

export type LessonDemoKind =
  | 'patterns'
  | 'prompt-parts'
  | 'evidence-check'
  | 'privacy-sort'
  | 'school-rules'
  | 'ask-a-person'
  | 'prompt-recipe'
  | 'app-plan'
  | 'test-cases'
  | 'iterate';

type LessonVisualDemoProps = { kind: LessonDemoKind; ageBand: AgeBand };
type Choice = { label: string; detail: string; correct?: boolean };

const bandLanguage: Record<AgeBand, { learner: string; nudge: string }> = {
  '10-12': { learner: 'Curious Starter', nudge: 'Try one small step at a time.' },
  '13-15': { learner: 'Thoughtful Explorer', nudge: 'Notice the tradeoffs before you decide.' },
  '16-plus': { learner: 'Independent Builder', nudge: 'Evaluate the evidence and own the decision.' },
};

const titles: Record<LessonDemoKind, { title: string; intro: string }> = {
  patterns: { title: 'Spot the pattern', intro: 'A pattern can help software make a guess. It is not proof that the next thing will happen.' },
  'prompt-parts': { title: 'Build a clear brief', intro: 'Useful instructions give a goal, safe context, a format, and a boundary.' },
  'evidence-check': { title: 'Pause and check', intro: 'A confident-sounding claim still needs evidence from somewhere independent.' },
  'privacy-sort': { title: 'Keep private details out', intro: 'Sort each example by whether it is okay to share in a practice prompt.' },
  'school-rules': { title: 'Class rules come first', intro: 'The right kind of help depends on what your teacher has allowed.' },
  'ask-a-person': { title: 'Some questions need a person', intro: 'For safety, health, or serious feelings, a trusted person can help in ways a tool cannot.' },
  'prompt-recipe': { title: 'Try a prompt recipe', intro: 'Make a small practice brief with a goal, audience, format, and limit. Keep personal details out.' },
  'app-plan': { title: 'Plan one useful app', intro: 'Start with a small problem, a clear user, and one helpful action.' },
  'test-cases': { title: 'Test more than the happy path', intro: 'Try ordinary, empty, and unexpected cases before deciding a feature works.' },
  iterate: { title: 'Improve one thing', intro: 'Choose a focused change, check it, then decide what to do next.' },
};

function DemoFrame({ kind, ageBand, children }: LessonVisualDemoProps & { children: ReactNode }) {
  const copy = titles[kind];
  const learner = bandLanguage[ageBand];
  return (
    <section className="lesson-visual-demo" aria-labelledby={`demo-title-${kind}`} data-testid={`demo-${kind}`}>
      <div className="demo-heading">
        <span className="demo-kicker">Field exercise / {learner.learner}</span>
        <h3 id={`demo-title-${kind}`}>{copy.title}</h3>
        <p>{copy.intro}</p>
      </div>
      <div className="demo-workspace">{children}</div>
      <p className="demo-coach-note" data-testid={`status-demo-guidance-${kind}`}>{learner.nudge}</p>
      <p className="demo-disclaimer">Practice visual only · no AI tool or AI-generated answer is used here.</p>
    </section>
  );
}

function ChoiceList({ choices, selected, onSelect, testId }: {
  choices: Choice[];
  selected: number | null;
  onSelect: (index: number) => void;
  testId: string;
}) {
  return <div className="demo-choice-list">
    {choices.map((choice, index) => (
      <button
        type="button"
        className={`demo-choice${selected === index ? ' is-active' : ''}`}
        key={choice.label}
        aria-pressed={selected === index}
        onClick={() => onSelect(index)}
        data-testid={`${testId}-${index}`}
      >
        <span className="demo-choice-mark" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <span><strong>{choice.label}</strong><small>{choice.detail}</small></span>
      </button>
    ))}
  </div>;
}

function PatternsDemo() {
  const [revealed, setRevealed] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);
  const sequence = ['triangle', 'circle', 'triangle', 'circle'];
  return <div className="demo-stack">
    <div className="pattern-row" aria-label="Triangle, circle, triangle, circle">
      {sequence.map((shape, index) => <span className={`pattern-token ${shape}`} key={`${shape}-${index}`} aria-hidden="true">{shape === 'triangle' ? '▲' : '●'}</span>)}
      {revealed && <span className="pattern-token triangle" aria-label="Next shape: triangle">▲</span>}
      {!revealed && <span className="pattern-token unknown" aria-label="Next shape is hidden">?</span>}
    </div>
    <button type="button" className="demo-action" onClick={() => setRevealed((value) => !value)} data-testid="button-pattern-reveal">
      {revealed ? 'Hide the next tile' : 'Reveal the next tile'}
    </button>
    <ChoiceList testId="button-pattern-choice" selected={choice} onSelect={setChoice} choices={[
      { label: 'Triangle', detail: 'The two shapes take turns.' },
      { label: 'Circle', detail: 'The sequence repeats in pairs.' },
    ]} />
    {choice !== null && <p className="demo-status" role="status" data-testid="status-patterns">{choice === 0 ? 'You spotted the repeating pattern. A pattern helps predict; it does not guarantee what comes next.' : 'Look at how the shapes take turns: triangle, circle, triangle, circle.'}</p>}
  </div>;
}

function PromptPartsDemo() {
  const items = [
    ['Goal', 'Explain how rain forms'],
    ['Safe context', 'For a learner new to weather'],
    ['Format', 'Use three short steps'],
    ['Boundary', 'Do not write my assignment'],
  ];
  const [selected, setSelected] = useState<number[]>([0]);
  const toggle = (index: number) => setSelected((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  return <div className="demo-stack">
    <div className="demo-part-grid">{items.map(([name, example], index) => (
      <button type="button" className={`demo-part${selected.includes(index) ? ' is-active' : ''}`} key={name} aria-pressed={selected.includes(index)} onClick={() => toggle(index)} data-testid={`button-prompt-part-${index}`}>
        <span>{name}</span><strong>{example}</strong>
      </button>
    ))}</div>
    <p className="demo-status" role="status" data-testid="status-prompt-parts">{selected.length} of 4 prompt parts selected. A clear brief is easier to evaluate.</p>
  </div>;
}

function EvidenceCheckDemo() {
  const [choice, setChoice] = useState<number | null>(null);
  const choices = [
    { label: 'Check a library book or trusted learning site', detail: 'Independent evidence can confirm or challenge the claim.', correct: true },
    { label: 'Ask the same tool to repeat its claim', detail: 'Repeating an answer is not an independent check.' },
    { label: 'Trust it because it sounds certain', detail: 'Confident wording is not evidence.' },
  ];
  return <div className="demo-stack">
    <div className="demo-claim"><span className="demo-label">Practice claim</span><strong>“A day on Venus is longer than its year.”</strong><small>Would you use this in a school project without checking?</small></div>
    <ChoiceList testId="button-evidence-choice" choices={choices} selected={choice} onSelect={setChoice} />
    {choice !== null && <p className={`demo-status${choices[choice].correct ? ' is-good' : ''}`} role="status" data-testid="status-evidence-check">{choices[choice].correct ? 'Good check: compare the claim with a reliable source that is separate from the original answer.' : 'Take another look: the strongest check uses evidence independent of the claim.'}</p>}
  </div>;
}

function PrivacySortDemo() {
  const details = [
    { name: 'A made-up character name', safe: true },
    { name: 'A home address', safe: false },
    { name: 'A favorite color', safe: true },
    { name: 'A password', safe: false },
  ];
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const setAnswer = (index: number, safe: boolean) => setAnswers((current) => ({ ...current, [index]: safe }));
  const correct = details.filter((item, index) => answers[index] === item.safe).length;
  return <div className="demo-stack">
    <div className="privacy-list">{details.map((item, index) => (
      <div className="privacy-row" key={item.name}>
        <strong>{item.name}</strong>
        <div className="privacy-actions" role="group" aria-label={`Is ${item.name} okay to share?`}>
          <button type="button" aria-pressed={answers[index] === true} className={answers[index] === true ? 'is-active' : ''} onClick={() => setAnswer(index, true)} data-testid={`button-privacy-safe-${index}`}>Okay for practice</button>
          <button type="button" aria-pressed={answers[index] === false} className={answers[index] === false ? 'is-active' : ''} onClick={() => setAnswer(index, false)} data-testid={`button-privacy-private-${index}`}>Keep private</button>
        </div>
      </div>
    ))}</div>
    <p className="demo-status" role="status" data-testid="status-privacy-sort">{Object.keys(answers).length < details.length ? 'Sort all four examples. If you are unsure, leave it out and ask a trusted adult.' : `${correct} of 4 sorted correctly. Passwords and addresses always stay private.`}</p>
  </div>;
}

function SchoolRulesDemo() {
  const [choice, setChoice] = useState<number | null>(null);
  const choices = [
    { label: 'Teacher allows AI brainstorming', detail: 'Use it only for the allowed idea starter, then do your own work.', correct: true },
    { label: 'Teacher says no AI for this essay', detail: 'Follow the rule and write the essay yourself.' },
    { label: 'You are not sure what is allowed', detail: 'Ask your teacher before using a tool.' },
  ];
  return <div className="demo-stack">
    <div className="demo-claim"><span className="demo-label">Classroom situation</span><strong>You have an assignment due, and your class has rules about tools.</strong><small>Which first move respects the rules?</small></div>
    <ChoiceList testId="button-school-rule" choices={choices} selected={choice} onSelect={setChoice} />
    {choice !== null && <p className="demo-status" role="status" data-testid="status-school-rules">{choice === 0 ? 'Use only the allowed help. Keep your own thinking in the work and follow disclosure rules.' : choice === 1 ? 'Correct: teacher instructions come first. If the rule is unclear, ask before using a tool.' : 'Good judgment: pause and clarify the classroom rule before you use a tool.'}</p>}
  </div>;
}

function AskPersonDemo() {
  const [choice, setChoice] = useState<number | null>(null);
  const choices = [
    { label: 'A trusted adult or qualified professional', detail: 'They can listen, understand the situation, and help you act safely.', correct: true },
    { label: 'Keep asking a tool until it decides for you', detail: 'A tool cannot replace real-world care or urgent support.' },
    { label: 'Share private details to get a more specific reply', detail: 'Private information should not be shared to seek help.' },
  ];
  return <div className="demo-stack">
    <div className="demo-claim"><span className="demo-label">Pause point</span><strong>A question is about feeling unsafe or getting health advice.</strong><small>Who is the best person to bring in?</small></div>
    <ChoiceList testId="button-ask-person" choices={choices} selected={choice} onSelect={setChoice} />
    {choice !== null && <p className="demo-status" role="status" data-testid="status-ask-a-person">{choice === 0 ? 'Yes. Pause the tool and tell a trusted adult. For urgent danger, contact local emergency help with an adult.' : 'This situation needs human support. Pause and tell a trusted adult.'}</p>}
  </div>;
}

function PromptRecipeDemo({ ageBand }: { ageBand: AgeBand }) {
  const [goal, setGoal] = useState('');
  const [format, setFormat] = useState('three short steps');
  const [boundary, setBoundary] = useState(true);
  const audience = ageBand === '10-12' ? 'a curious beginner' : ageBand === '13-15' ? 'a student exploring the topic' : 'a learner evaluating the topic';
  return <div className="demo-stack">
    <label className="demo-field">Goal
      <input value={goal} maxLength={90} onChange={(event) => setGoal(event.target.value)} placeholder="For example: explain how clouds form" data-testid="input-prompt-goal" />
    </label>
    <label className="demo-field">Format
      <select value={format} onChange={(event) => setFormat(event.target.value)} data-testid="select-prompt-format">
        <option>three short steps</option><option>a short checklist</option><option>two comparison points</option>
      </select>
    </label>
    <label className="demo-toggle"><input type="checkbox" checked={boundary} onChange={(event) => setBoundary(event.target.checked)} data-testid="checkbox-prompt-boundary" /> Keep a learning boundary: explain, do not complete my assignment</label>
    <div className="prompt-preview" aria-live="polite" data-testid="status-prompt-preview">
      <span className="demo-label">Practice draft</span>
      <p>{goal.trim() || 'Your goal will appear here'} for {audience}; use {format}{boundary ? ' and do not complete my assignment' : ''}.</p>
    </div>
    <p className="demo-caption">Keep this example general. Never add a real name, school, address, or password.</p>
  </div>;
}

function AppPlanDemo() {
  const [problem, setProblem] = useState('Remember reusable lunch items');
  const [action, setAction] = useState('Show a short checklist');
  const [planned, setPlanned] = useState(false);
  return <div className="demo-stack">
    <label className="demo-field">Small problem
      <select value={problem} onChange={(event) => { setProblem(event.target.value); setPlanned(false); }} data-testid="select-app-problem">
        <option>Remember reusable lunch items</option><option>Track books to return to a library</option><option>Plan a short study break</option>
      </select>
    </label>
    <label className="demo-field">One useful action
      <select value={action} onChange={(event) => { setAction(event.target.value); setPlanned(false); }} data-testid="select-app-action">
        <option>Show a short checklist</option><option>Mark an item as done</option><option>Show one gentle reminder</option>
      </select>
    </label>
    <button type="button" className="demo-action" onClick={() => setPlanned(true)} data-testid="button-app-plan">Sketch this first version</button>
    {planned && <div className="plan-card" role="status" data-testid="status-app-plan"><span className="demo-label">First-version sketch</span><strong>For someone who wants to {problem.toLowerCase()}</strong><span>Main action: {action.toLowerCase()}.</span><small>No account or personal details needed.</small></div>}
  </div>;
}

function TestCasesDemo() {
  const cases = [
    { title: 'Typical', input: 'A list with two items', expected: 'Both items appear.' },
    { title: 'Empty', input: 'A list with no items', expected: 'Show a helpful empty message.' },
    { title: 'Unexpected', input: 'An extra-long item name', expected: 'Keep the screen usable.' },
  ];
  const [tested, setTested] = useState<number[]>([]);
  const toggle = (index: number) => setTested((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  return <div className="demo-stack">
    <div className="test-case-list">{cases.map((item, index) => (
      <button type="button" className={`test-case${tested.includes(index) ? ' is-tested' : ''}`} key={item.title} aria-pressed={tested.includes(index)} onClick={() => toggle(index)} data-testid={`button-test-case-${index}`}>
        <span className="test-case-number">0{index + 1}</span><span><strong>{item.title} case</strong><small>Try: {item.input}</small><small>Expect: {item.expected}</small></span><span className="test-case-state">{tested.includes(index) ? 'Checked' : 'Mark checked'}</span>
      </button>
    ))}</div>
    <p className="demo-status" role="status" data-testid="status-test-cases">{tested.length} of 3 cases checked. Use made-up examples, never real private information.</p>
  </div>;
}

function IterateDemo() {
  const [change, setChange] = useState('Make the empty-list message clearer');
  const [checked, setChecked] = useState(false);
  const [approved, setApproved] = useState(false);
  return <div className="demo-stack">
    <label className="demo-field">Choose one focused change
      <select value={change} onChange={(event) => { setChange(event.target.value); setChecked(false); setApproved(false); }} data-testid="select-iteration-change">
        <option>Make the empty-list message clearer</option><option>Add one confirmation before clearing a list</option><option>Improve spacing around the main button</option>
      </select>
    </label>
    <div className="iteration-path"><span className="iteration-step is-current">Change</span><span aria-hidden="true">→</span><span className={checked ? 'iteration-step is-current' : 'iteration-step'}>Check</span><span aria-hidden="true">→</span><span className={approved ? 'iteration-step is-current' : 'iteration-step'}>Explain</span></div>
    <button type="button" className="demo-action" onClick={() => { setChecked(true); setApproved(false); }} data-testid="button-iteration-check">Check this change</button>
    {checked && <div className="iteration-result" role="status" data-testid="status-iterate-check"><strong>Review the result</strong><span>Does “{change.toLowerCase()}” solve the problem without changing anything else?</span><button type="button" className="demo-inline-action" onClick={() => setApproved(true)} data-testid="button-iteration-explain">I can explain what changed</button></div>}
    {approved && <p className="demo-status is-good" role="status" data-testid="status-iterate-done">Good iteration: one understandable change, checked before moving on.</p>}
  </div>;
}

export function LessonVisualDemo({ kind, ageBand }: LessonVisualDemoProps) {
  let content: ReactNode;
  switch (kind) {
    case 'patterns': content = <PatternsDemo />; break;
    case 'prompt-parts': content = <PromptPartsDemo />; break;
    case 'evidence-check': content = <EvidenceCheckDemo />; break;
    case 'privacy-sort': content = <PrivacySortDemo />; break;
    case 'school-rules': content = <SchoolRulesDemo />; break;
    case 'ask-a-person': content = <AskPersonDemo />; break;
    case 'prompt-recipe': content = <PromptRecipeDemo ageBand={ageBand} />; break;
    case 'app-plan': content = <AppPlanDemo />; break;
    case 'test-cases': content = <TestCasesDemo />; break;
    case 'iterate': content = <IterateDemo />; break;
    default: content = null;
  }
  return <DemoFrame kind={kind} ageBand={ageBand}>{content}</DemoFrame>;
}
