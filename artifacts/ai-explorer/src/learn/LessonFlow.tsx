import { useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Coffee, MessageCircle, RotateCcw, ShieldCheck } from 'lucide-react';
import { completeChildLesson, getGetFamilyQueryKey, startLearningQuiz } from '@workspace/api-client-react';
import type { ChildProfile, QuizAttempt } from '@workspace/api-client-react';
import { getLessonsForAgeBand, normalizeLessonId, type Lesson, type Question } from '@workspace/curriculum';
import { lessonUnlocked } from './access';
import { LessonActivity } from './activities';
import { WatchStep } from './WatchStep';
import { ReadButton, QuestionView, apiErrorBody, isAnswered } from './shared';
import { useSpeechSafety } from './speech';
import './learn.css';

const STEPS = ['Warm-up', 'Hook', 'Watch', 'Try', 'Think', 'Check'];

function sameAnswer(a: number[], b: number[]) { return a.length === b.length && a.every((v, i) => v === b[i]); }

function copiesLesson(text: string, lesson: Lesson) {
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const mine = norm(text);
  const source = norm([lesson.summary, lesson.hook.scenario, ...lesson.scenes.map((s) => s.narration)].join(' '));
  const grams = new Set<string>();
  for (let i = 0; i + 12 <= source.length; i++) grams.add(source.slice(i, i + 12).join(' '));
  for (let i = 0; i + 12 <= mine.length; i++) if (grams.has(mine.slice(i, i + 12).join(' '))) return true;
  if (mine.length >= 7 && source.join(' ').includes(mine.join(' '))) return true;
  return false;
}

export function LessonFlow({ child, lessonId }: { child: ChildProfile; lessonId: string }) {
  const ageBand = child.ageBand ?? '10-12';
  const all = useMemo(() => getLessonsForAgeBand(ageBand), [ageBand]);
  const canonical = normalizeLessonId(lessonId);
  const lesson = all.find((l) => l.id === canonical);
  if (!lesson) return <main className="page-content not-found"><h1>That lesson isn’t here.</h1><p>Pick a lesson from your learning path.</p><Link className="primary-button" href={`/learn/${child.id}`}>Back to learning path</Link></main>;
  return <FlowInner key={`${child.id}-${lesson.id}-${ageBand}`} child={child} lesson={lesson} all={all} />;
}

function FlowInner({ child, lesson, all }: { child: ChildProfile; lesson: Lesson; all: Lesson[] }) {
  const client = useQueryClient();
  const completedIds = child.completedLessonIds.map(normalizeLessonId);
  const index = all.findIndex((l) => l.id === lesson.id);
  const already = completedIds.includes(lesson.id);
  const unlocked = lessonUnlocked(child, lesson.id);
  const warmups = useMemo(() => {
    const pool = all.slice(0, index).filter((l) => completedIds.includes(l.id)).flatMap((l) => l.questionBank.filter((q) => q.type === 'choice'));
    return [...pool].sort(() => Math.random() - 0.5).slice(0, 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);
  const steps = warmups.length ? STEPS : STEPS.slice(1);
  const [step, setStep] = useState(0);
  const name = steps[step];
  useSpeechSafety(step, lesson.id, child.id);
  const startedAt = useRef(Date.now());

  const [warm, setWarm] = useState<number[][]>(() => warmups.map(() => []));
  const [warmChecked, setWarmChecked] = useState(false);
  const [hookPick, setHookPick] = useState<number | null>(null);
  const [watched, setWatched] = useState(false);
  const [evidence, setEvidence] = useState('');
  const [reflection, setReflection] = useState('');
  const [reflectError, setReflectError] = useState('');
  const [quiz, setQuiz] = useState<QuizAttempt | null>(null);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<string[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [passedMisses, setPassedMisses] = useState<Question[]>([]);

  if (!unlocked) return <main className="page-content not-found"><h1>Finish the previous lesson first.</h1><p>Lessons open in order so each skill builds on the last.</p><Link className="primary-button" href={`/learn/${child.id}`}>Back to learning path</Link></main>;

  const go = (n: number) => { setStep(n); window.scrollTo({ top: 0 }); };
  const next = () => go(Math.min(steps.length - 1, step + 1));

  const validateReflection = () => {
    const t = reflection.trim();
    if (t.length < 30 || t.split(/\s+/).length < 7) return 'Write at least 30 characters and seven words, about one or two sentences, in your own words.';
    if (copiesLesson(t, lesson)) return 'That sounds like the lesson text. Say it in your own words, with your own example.';
    return '';
  };

  const beginQuiz = async () => {
    setBusy(true); setError(''); setFeedback([]); setScore(null);
    try {
      const attempt = await startLearningQuiz(child.id, { kind: 'lesson', targetId: lesson.id });
      setQuiz(attempt); setAnswers(attempt.questions.map(() => []));
    } catch (e) { setError(apiErrorBody(e).message); }
    setBusy(false);
  };
  const submitQuiz = async () => {
    if (!quiz) return;
    setBusy(true); setError('');
    try {
      await completeChildLesson(child.id, {
        lessonId: lesson.id, attemptId: quiz.attemptId, answers, reflection: reflection.trim(),
        durationSeconds: Math.max(1, Math.min(7200, Math.round((Date.now() - startedAt.current) / 1000))),
        watchCompleted: true, activityCompleted: true, activityEvidence: evidence,
      });
      // Practice feedback only: the server alone awards credit and grades the attempt.
      setPassedMisses(quiz.questions.flatMap((question, index) => {
        const original = lesson.questionBank.find((entry) => entry.id === question.id);
        return original && !sameAnswer(answers[index] ?? [], original.answer) ? [original] : [];
      }));
      await client.invalidateQueries({ queryKey: getGetFamilyQueryKey() });
      setDone(true);
    } catch (e) {
      const body = apiErrorBody(e);
      if (body.status === 422) { setScore(body.score ?? null); setFeedback(body.feedback.length ? body.feedback : [body.message]); setQuiz(null); }
      else {
        setError(body.message);
        if ([400, 403, 404, 409].includes(body.status ?? 0)) {
          setQuiz(null);
          void client.invalidateQueries({ queryKey: getGetFamilyQueryKey() });
        }
      }
    }
    setBusy(false);
  };

  const nextLesson = all[index + 1];
  return <main className="page-content lesson-page">
    <Link href={`/learn/${child.id}`} className="back-link"><ArrowLeft size={15} /> Learning path</Link>
    <header className="lesson-top"><div className="lesson-kicker">{lesson.topic} · about {lesson.durationMinutes} min</div><h1>{lesson.title}</h1><p>{lesson.summary}</p><ReadButton id="lesson-intro" text={`${lesson.title}. ${lesson.summary}. About ${lesson.durationMinutes} minutes. If anything feels wrong, stop and talk to a trusted adult.`} /></header>
    {!done && <>
      <nav className="lesson-stepper" aria-label="Lesson steps"><ol>{steps.map((s, i) => <li key={s} className={i === step ? 'is-current' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}><span>{i < step ? <Check size={12} /> : i + 1}</span><em>{s}</em></li>)}</ol></nav>
      <p className="step-count" data-testid="text-step-count">Step {step + 1} of {steps.length}: {name}</p>
    </>}
    <section className="lesson-card-panel">
      {done ? <FinishCard lesson={lesson} child={child} nextLesson={nextLesson} missedQuestions={passedMisses} onRevisit={() => { setDone(false); setQuiz(null); go(0); }} /> : <>
        {name === 'Warm-up' && <div>
          <h2>Warm up your memory</h2><p className="step-explanation">Two quick questions from lessons you finished earlier.</p>
          {warmups.map((q, i) => <div key={q.id}><QuestionView q={q} value={warm[i]} disabled={warmChecked && sameAnswer(warm[i], q.answer)} onChange={(v) => { setWarmChecked(false); setWarm((w) => w.map((x, k) => k === i ? v : x)); }} status={warmChecked ? (sameAnswer(warm[i], q.answer) ? 'right' : 'wrong') : undefined} />
            {warmChecked && <><p className="activity-feedback ok">{q.explanation}</p><ReadButton id={`we-${q.id}`} label="Read answer" text={`${q.options[q.answer[0]] ?? ''}. ${q.explanation}`} /></>}</div>)}
          {warmChecked && warmups.every((q, i) => sameAnswer(warm[i], q.answer)) ? <button type="button" className="primary-button" onClick={next} data-testid="button-next">Continue <ArrowRight size={15} /></button>
            : <button type="button" className="primary-button" disabled={!warmups.every((q, i) => isAnswered(q, warm[i]))} onClick={() => setWarmChecked(true)} data-testid="button-check-warmup">Check</button>}
          {warmChecked && !warmups.every((q, i) => sameAnswer(warm[i], q.answer)) && <p className="activity-feedback bad">Not quite. Read the notes, change your answer, and check again.</p>}
        </div>}
        {name === 'Hook' && <div>
          <h2>Make a prediction</h2><ReadButton id="hook" text={`${lesson.hook.scenario}. ${lesson.hook.prediction}. ${lesson.hook.options.join('. ')}`} />
          <p className="activity-scenario">{lesson.hook.scenario}</p><p className="step-explanation"><strong>{lesson.hook.prediction}</strong></p>
          <div className="quiz-options">{lesson.hook.options.map((o, i) => <button type="button" key={i} className={`choice-button${hookPick === i ? ' is-right' : ''}`} onClick={() => setHookPick(i)} data-testid={`hook-option-${i}`}>{o}</button>)}</div>
          {hookPick !== null && <><p className="activity-feedback ok">Your guess is saved. {lesson.hook.feedback}</p><button type="button" className="primary-button" onClick={next} data-testid="button-next">Watch the lesson <ArrowRight size={15} /></button></>}
        </div>}
        {name === 'Watch' && <div>
          <h2>Watch and listen</h2><ReadButton id="watch-all" label="Read whole transcript" text={lesson.scenes.map((s) => `${s.title}. ${s.narration}`).join(' ')} />
          <WatchStep lesson={lesson} alreadyDone={false} onComplete={() => setWatched(true)} />
          {watched && <button type="button" className="primary-button" onClick={next} data-testid="button-next">Try it <ArrowRight size={15} /></button>}
        </div>}
        {name === 'Try' && <div>
          <h2>Try it</h2>
          <LessonActivity lesson={lesson} onDone={(e) => setEvidence(e.slice(0, 8000).padEnd(10, '.'))} />
          {evidence && <button type="button" className="primary-button" onClick={next} data-testid="button-next">Think about it <ArrowRight size={15} /></button>}
        </div>}
        {name === 'Think' && <div>
          <h2>Think in your own words</h2><ReadButton id="think" text={lesson.reflectionPrompt} />
          <p className="step-explanation">{lesson.reflectionPrompt}</p>
          {lesson.sentenceStarters && <div className="starter-chips">{lesson.sentenceStarters.map((s) => <button type="button" key={s} onClick={() => setReflection((r) => r.trim() ? r : s + ' ')}>{s}</button>)}</div>}
          <textarea className="reflection-box" rows={4} maxLength={600} value={reflection} onChange={(e) => { setReflection(e.target.value); setReflectError(''); }} placeholder="One or two sentences, your own words." data-testid="input-reflection" />
          <div className="reflection-meta"><span>{reflection.trim().length} / 30 characters minimum</span><span>Private to your family.</span></div>
          {reflectError && <p className="activity-feedback bad" role="alert">{reflectError}</p>}
          <button type="button" className="primary-button" onClick={() => { const err = validateReflection(); if (err) setReflectError(err); else next(); }} data-testid="button-next">Go to the check <ArrowRight size={15} /></button>
        </div>}
        {name === 'Check' && <div>
          <h2>Check what stuck</h2>
          {!quiz && <>
            <p className="step-explanation">Five questions, picked fresh for you. Score 80% or higher to save this lesson.</p>
            {feedback.length > 0 && <div className="activity-feedback bad" role="alert"><strong>{score !== null ? `You scored ${score}%. ` : ''}Here is what to look at again:</strong><ul>{feedback.map((f, i) => <li key={i}>{f}</li>)}</ul><ReadButton id="check-feedback" text={feedback.join('. ')} /></div>}
            <button type="button" className="primary-button" onClick={beginQuiz} disabled={busy} data-testid="button-start-quiz">{busy ? 'Getting questions…' : feedback.length ? 'Try with new questions' : 'Start the check'}</button>
            {feedback.length > 0 && <button type="button" className="secondary-button" onClick={() => go(steps.indexOf('Watch'))}><RotateCcw size={14} /> Re-watch the lesson</button>}
          </>}
          {quiz && <>
            {quiz.questions.map((q, i) => <QuestionView key={q.id} q={q as Pick<Question, 'id' | 'type' | 'prompt' | 'options'>} value={answers[i] ?? []} onChange={(v) => setAnswers((a) => a.map((x, k) => k === i ? v : x))} />)}
            <button type="button" className="primary-button" onClick={submitQuiz} disabled={busy || !quiz.questions.every((q, i) => isAnswered(q as Question, answers[i]))} data-testid="button-submit-quiz">{busy ? 'Checking…' : 'Submit answers'}</button>
          </>}
          {error && <p className="activity-feedback bad" role="alert">{error} <button type="button" className="text-action" onClick={() => setError('')}>Dismiss</button></p>}
        </div>}
      </>}
    </section>
    <aside className="safety-note"><ShieldCheck size={19} /><span><strong>A note for every lesson</strong>If anything about AI feels confusing, unsafe, or upsetting, stop and talk with a trusted adult. You never have to work it out alone.<ReadButton id="safety" text="If anything about AI feels confusing, unsafe, or upsetting, stop and talk with a trusted adult. You never have to work it out alone." /></span></aside>
  </main>;
}

function FinishCard({ lesson, child, nextLesson, missedQuestions, onRevisit }: { lesson: Lesson; child: ChildProfile; nextLesson?: Lesson; missedQuestions: Question[]; onRevisit: () => void }) {
  const [corrections, setCorrections] = useState<number[][]>(() => missedQuestions.map(() => []));
  const ready = missedQuestions.every((question, index) => sameAnswer(corrections[index] ?? [], question.answer));
  return <div className="complete-panel" data-testid="lesson-completion">
    <div className="complete-seal"><CheckCircle2 size={39} /></div>
    <h2>Lesson saved. Nicely done.</h2>
    {missedQuestions.length > 0 && <section className="passed-check-review" data-testid="passed-check-review" aria-label="Correct your missed answer">
      <h3>You passed. Let’s learn from the missed answer.</h3>
      <p>Your score earned lesson credit. Correct this answer before using the continue links below.</p>
      {missedQuestions.map((question, index) => <div key={question.id}>
        <p className="activity-feedback">{question.explanation}</p>
        <ReadButton id={`passed-feedback-${question.id}`} text={question.explanation} />
        <QuestionView q={question} value={corrections[index] ?? []} disabled={sameAnswer(corrections[index] ?? [], question.answer)}
          onChange={(value) => setCorrections((previous) => previous.map((entry, i) => i === index ? value : entry))}
          status={corrections[index]?.length ? sameAnswer(corrections[index], question.answer) ? 'right' : 'wrong' : undefined} />
      </div>)}
      <p role="status" data-testid="passed-review-status">{ready ? 'All correct. Ready to continue.' : 'Try the missed answer again. Your explanation is above.'}</p>
    </section>}
    <div className="family-card"><MessageCircle size={18} /><div><strong>Talk it over with your family</strong><p>{lesson.familyPrompt}</p><ReadButton id="family" text={lesson.familyPrompt} /></div></div>
    <div className="family-card break"><Coffee size={18} /><div><strong>Take a break</strong><p>Stretch, get water, look out a window. Come back when you feel like it.</p></div></div>
    <div className="complete-actions">
      {ready && nextLesson && lessonUnlocked(child, nextLesson.id) && <Link href={`/learn/${child.id}/lesson/${nextLesson.id}`} className="primary-button" data-testid="link-next-lesson">Next lesson <ArrowRight size={16} /></Link>}
      {ready && <Link href={`/learn/${child.id}`} className="secondary-button" data-testid="link-finish-home">Learning path</Link>}
      <button type="button" className="secondary-button" onClick={onRevisit}><RotateCcw size={15} /> Revisit</button>
    </div>
  </div>;
}
