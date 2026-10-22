import { useMemo, useState } from 'react';
import { Check, EyeOff, RotateCcw } from 'lucide-react';
import type { Lesson } from '@workspace/curriculum';
import { ReadButton } from './shared';

type Item = { text: string; category: number; why: string };
type Choice = { text: string; correct: boolean; feedback: string };
type ActData = {
  title: string; instruction: string; kind: Lesson['activity']['kind'];
  items?: Item[]; categories?: string[]; prompt?: string; fields?: string[]; choices?: Choice[];
  testCase?: string; testExplanation?: string; contextPrompt?: string; contextChoices?: Choice[];
};

type Props = { lesson: Lesson; onDone: (evidence: string) => void };

const PRIVATE = /(\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|@\w+\.\w+|\b\d{1,5}\s+\w+\s+(street|st|road|rd|avenue|ave|lane|ln)\b|\bpassword\s*[:=]\s*\S+|\bmy\s+password\s+is\s+\S+)/i;

function Frame({ data, id, children }: { data: ActData; id: string; children: React.ReactNode }) {
  return <section className="activity-frame" data-testid={`activity-${data.kind}`}>
    <div className="activity-head"><h3>{data.title}</h3><ReadButton id={`act-${id}`} text={[data.title, data.instruction, data.prompt, ...(data.items ?? []).map((i) => i.text), ...(data.categories ?? []), ...(data.choices ?? []).map((c) => c.text)].filter(Boolean).join('. ')} /></div>
    <p className="activity-instruction">{data.instruction}</p>
    {children}
  </section>;
}

function Classify({ data, lesson, onDone }: { data: ActData; lesson: Lesson; onDone: (e: string) => void }) {
  const items = data.items ?? [];
  const cats = data.categories ?? [];
  const [assigned, setAssigned] = useState<(number | null)[]>(() => items.map(() => null));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [tries, setTries] = useState(0);
  const [stage, setStage] = useState<'sort' | 'verify' | 'test'>('sort');
  const [verifyPick, setVerifyPick] = useState<number | null>(null);
  const verifyChoices = data.choices ?? [];
  const needsVerify = data.kind === 'hallucination' && verifyChoices.length > 0;
  const done = assigned.every((a) => a !== null) && items.length > 0;
  const kind = data.kind;
  const finish = () => onDone(`${lesson.id} ${kind}: sorted ${items.length} items correctly in ${tries} attempts. ${items.map((it, i) => `"${it.text}" -> ${cats[assigned[i] ?? 0]}`).join('; ')}${data.testCase ? ` Test: ${data.testCase}` : ''}`);
  const pick = (i: number, c: number) => {
    if (assigned[i] !== null) return;
    setTries((t) => t + 1);
    if (items[i].category === c) { setAssigned((a) => a.map((v, k) => k === i ? c : v)); setMsg({ ok: true, text: `Yes. ${items[i].why}` }); }
    else setMsg({ ok: false, text: `Not quite. ${items[i].why}` });
  };
  if (!items.length || !cats.length) return <p role="alert">This activity could not load. Return to your learning path and try again.</p>;
  return <div className="classify">
    {stage === 'sort' && <>
      {kind === 'model-sorter' && <p className="activity-note">Training stage: choose which kind of training example each card is.</p>}
      <p className="activity-note">Drag a card to a category, or use the category buttons on each card.</p>
      <div className="sort-dropzones" role="group" aria-label="Sorting categories">
        {cats.map((category, categoryIndex) => <div key={category} className="sort-dropzone" data-testid={`sort-target-${categoryIndex}`}
          onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }}
          onDrop={(event) => {
            event.preventDefault();
            const prefix = `ltb-sort:${lesson.id}:`;
            const value = event.dataTransfer.getData('text/plain');
            if (!value.startsWith(prefix)) return;
            const suffix = value.slice(prefix.length);
            if (!/^\d+$/.test(suffix)) return;
            const itemIndex = Number(suffix);
            if (Number.isInteger(itemIndex) && itemIndex >= 0 && itemIndex < items.length) pick(itemIndex, categoryIndex);
          }}>{category}</div>)}
      </div>
      <ul className="classify-list">{items.map((item, i) => <li key={i} className={assigned[i] !== null ? 'is-done' : ''}
        data-testid={`sort-card-${i}`} draggable={assigned[i] === null}
        onDragStart={(event) => {
          if (assigned[i] !== null) { event.preventDefault(); return; }
          event.dataTransfer.setData('text/plain', `ltb-sort:${lesson.id}:${i}`);
          event.dataTransfer.effectAllowed = 'move';
        }}>
        <span className="classify-text">{item.text}</span>
        {assigned[i] !== null ? <span className="classify-tag"><Check size={13} /> {cats[assigned[i] as number]}</span> :
          <span className="classify-buttons">{cats.map((c, ci) => <button key={ci} type="button" onClick={() => pick(i, ci)} data-testid={`classify-${i}-${ci}`}>{c}</button>)}</span>}
      </li>)}</ul>
      {msg && <p className={`activity-feedback ${msg.ok ? 'ok' : 'bad'}`} role="status">{msg.text}</p>}
      {done && needsVerify && <button type="button" className="primary-button" onClick={() => setStage('verify')} data-testid="button-verify-stage">Now verify the claims</button>}
      {done && !needsVerify && (kind === 'model-sorter' && data.testCase
        ? <button type="button" className="primary-button" onClick={() => setStage('test')} data-testid="button-train-model">Train the model and test it</button>
        : <button type="button" className="primary-button" onClick={finish} data-testid="button-activity-done">Finish activity</button>)}
    </>}
    {stage === 'verify' && <div className="verify-stage">
      {data.prompt && <p className="activity-scenario">{data.prompt}</p>}
      <div className="quiz-options">{verifyChoices.map((c, i) => <button type="button" key={i} className={`choice-button${verifyPick === i ? (c.correct ? ' is-right' : ' is-wrong') : ''}`} onClick={() => setVerifyPick(i)} data-testid={`verify-${i}`}>{c.text}</button>)}</div>
      {verifyPick !== null && <p className={`activity-feedback ${verifyChoices[verifyPick].correct ? 'ok' : 'bad'}`} role="status">{verifyChoices[verifyPick].feedback}</p>}
      {verifyPick !== null && verifyChoices[verifyPick].correct && <button type="button" className="primary-button" onClick={() => onDone(`${lesson.id} hallucination: sorted ${items.length} claims, then verified with "${verifyChoices[verifyPick].text}".`)} data-testid="button-activity-done">Finish activity</button>}
    </div>}
    {stage === 'test' && <div className="model-test">
      <h4>Test case</h4><p>{data.testCase}</p>
      <p className="activity-feedback bad">{data.testExplanation}</p>
      <button type="button" className="primary-button" onClick={finish} data-testid="button-activity-done">I see what went wrong</button>
    </div>}
  </div>;
}

function Redactor({ data, lesson, onDone }: { data: ActData; lesson: Lesson; onDone: (e: string) => void }) {
  const items = data.items ?? [];
  const [marked, setMarked] = useState<boolean[]>(() => items.map(() => false));
  const [msgs, setMsgs] = useState<string[]>([]);
  const [ok, setOk] = useState(false);
  if (!items.length) return <p>This activity is not available yet.</p>;
  const check = () => {
    const wrong = items.map((it, i) => (marked[i] !== (it.category !== 0) ? `${it.text}: ${it.why}` : null)).filter((x): x is string => !!x);
    setMsgs(wrong); setOk(wrong.length === 0);
    if (wrong.length === 0) onDone(`${lesson.id} redactor: hid ${items.filter((_, i) => marked[i]).length} private details and kept ${items.filter((_, i) => !marked[i]).length} safe ones.`);
  };
  return <div className="redactor">
    <p className="activity-note">Tap a piece to black it out. Tap again to bring it back.</p>
    <div className="redact-doc">{items.map((it, i) => <button type="button" key={i} className={`redact-chip${marked[i] ? ' is-hidden' : ''}`} aria-pressed={marked[i]} onClick={() => { setOk(false); onDone(''); setMarked((m) => m.map((v, k) => k === i ? !v : v)); }} data-testid={`redact-${i}`}>
      {marked[i] && <EyeOff size={12} />}<span>{it.text}</span></button>)}</div>
    {msgs.length > 0 && <ul className="activity-feedback bad">{msgs.map((m) => <li key={m}>{m}</li>)}</ul>}
    {ok ? <p className="activity-feedback ok">Clean. Only what the task needs is left.</p> : <button type="button" className="primary-button" onClick={check} data-testid="button-check-redaction">Check my redactions</button>}
  </div>;
}

function Choices({ data, lesson, onDone }: { data: ActData; lesson: Lesson; onDone: (e: string) => void }) {
  const choices = data.choices ?? [];
  const [trail, setTrail] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [stage, setStage] = useState<1 | 2>(1);
  const [path, setPath] = useState<number[]>([]);
  const ctxChoices = data.contextChoices ?? [];
  const list = stage === 1 ? choices : ctxChoices;
  const last = trail[trail.length - 1];
  const bars = useMemo(() => choices.map((c) => (c.correct ? 62 : Math.round(38 / Math.max(1, choices.length - 1)))), [choices]);
  if (!choices.length) return <p>This activity is not available yet.</p>;
  const choose = (i: number) => {
    setTrail((t) => [...t, i]);
    if (list[i].correct) {
      if (stage === 1 && data.kind === 'predictor' && ctxChoices.length) { setPath(trail); setSolved(true); return; }
      setSolved(true);
      onDone(`${lesson.id} ${data.kind}: reached the safe/best choice "${list[i].text}" after ${trail.length + 1} choice(s).`);
    }
  };
  return <div className="choices">
    {data.prompt && <p className="activity-scenario">{data.prompt}</p>}
    {stage === 2 && data.contextPrompt && <p className="activity-scenario">{data.contextPrompt}</p>}
    <div className="quiz-options">{list.map((c, i) => <button type="button" key={`${stage}-${i}`} className={`choice-button${trail.includes(i) ? (c.correct ? ' is-right' : ' is-wrong') : ''}`} disabled={solved} onClick={() => choose(i)} data-testid={`choice-${i}`}>{c.text}</button>)}</div>
    {last !== undefined && <p className={`activity-feedback ${list[last]?.correct ? 'ok' : 'bad'}`} role="status">{list[last]?.feedback}</p>}
    {data.kind === 'predictor' && solved && <div className="predict-bars" aria-label="Illustrative likelihoods">
      {choices.map((c, i) => <div key={i}><span>{c.text}</span><div><i style={{ width: `${bars[i]}%` }} /></div><b>{bars[i]}%</b></div>)}
      <p className="activity-note">Illustrative numbers: the likeliest word wins most often, but it is never certain.</p>
    </div>}
    {stage === 1 && solved && data.kind === 'predictor' && ctxChoices.length > 0 &&
      <button type="button" className="primary-button" onClick={() => { setStage(2); setSolved(false); setTrail([]); void path; }}>Change the context</button>}
  </div>;
}

function FieldsActivity({ data, lesson, onDone, mode }: { data: ActData; lesson: Lesson; onDone: (e: string) => void; mode: 'prompt' | 'app' }) {
  const fields = data.fields?.length ? data.fields : mode === 'prompt' ? ['goal', 'context', 'format', 'limits'] : ['problem', 'user', 'screens', 'main action', 'safety check'];
  const [values, setValues] = useState<string[]>(() => fields.map(() => ''));
  const [report, setReport] = useState<{ field: string; ok: boolean; tip: string }[] | null>(null);
  const min = mode === 'prompt' ? 12 : 15;
  const check = () => {
    const rows = fields.map((f, i) => {
      const v = values[i].trim(); const name = f.toLowerCase();
      if (v.length < min) return { field: f, ok: false, tip: `Add more detail to "${f}" (at least ${min} characters).` };
      if (PRIVATE.test(v)) return { field: f, ok: false, tip: 'This looks like private information. Replace it with a made-up detail.' };
      if (name.includes('limit') && !/(\d|no |not |only|under|at most|never|avoid|without|keep)/i.test(v)) return { field: f, ok: false, tip: 'Limits work best with a boundary: a length, a thing to avoid, or a rule.' };
      if (name.includes('format') && !/(list|table|steps|sentence|paragraph|bullet|outline|points|words|chart|headline|json|email)/i.test(v)) return { field: f, ok: false, tip: 'Name a shape for the answer: steps, a list, a short paragraph, a table.' };
      if (name.includes('safety') && !/(private|personal|test|ask|adult|check|review|data|no |not )/i.test(v)) return { field: f, ok: false, tip: 'A safety check says what you will protect, test, or have a person review.' };
      return { field: f, ok: true, tip: 'Specific and safe.' };
    });
    setReport(rows);
    if (rows.every((r) => r.ok)) onDone(`${lesson.id} ${data.kind}: ${fields.map((f, i) => `${f}: ${values[i].trim()}`).join(' | ')}`);
  };
  const score = report ? Math.round((report.filter((r) => r.ok).length / report.length) * 100) : null;
  return <div className="fields-activity">
    {data.prompt && <p className="activity-scenario">{data.prompt}</p>}
    {fields.map((f, i) => <label key={f} className="field-block"><span>{f.charAt(0).toUpperCase() + f.slice(1)}</span>
      <textarea rows={2} value={values[i]} maxLength={400} onChange={(e) => { const v = e.target.value; setValues((all) => all.map((x, k) => k === i ? v : x)); setReport(null); onDone(''); }} data-testid={`field-${f.replace(/\s+/g, '-')}`} />
      {report && <em className={report[i].ok ? 'ok' : 'bad'}>{report[i].tip}</em>}</label>)}
    {score !== null && <p className={`activity-feedback ${score === 100 ? 'ok' : 'bad'}`} role="status">Score: {score}%. {score === 100 ? 'Every part is covered.' : 'Fix the notes above and check again.'}</p>}
    {score !== 100 && <button type="button" className="primary-button" onClick={check} data-testid="button-check-fields">Check my work</button>}
    {score === 100 && <button type="button" className="secondary-button" onClick={() => setReport(null)}><RotateCcw size={14} /> Edit again</button>}
  </div>;
}

export function LessonActivity({ lesson, onDone }: Props) {
  const data = lesson.activity as unknown as ActData;
  const kind = data.kind;
  return <Frame data={data} id={lesson.id}>
    {kind === 'redactor' ? <Redactor data={data} lesson={lesson} onDone={onDone} />
      : kind === 'predictor' || kind === 'branching' ? <Choices data={data} lesson={lesson} onDone={onDone} />
      : kind === 'prompt-fixer' ? <FieldsActivity mode="prompt" data={data} lesson={lesson} onDone={onDone} />
      : kind === 'app-planner' ? <FieldsActivity mode="app" data={data} lesson={lesson} onDone={onDone} />
      : <Classify data={data} lesson={lesson} onDone={onDone} />}
  </Frame>;
}
