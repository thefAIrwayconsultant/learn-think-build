import { useState } from 'react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from 'lucide-react';
import { getGetFamilyQueryKey, recordLessonReview, startLearningQuiz, useSubmitLevelAssessment } from '@workspace/api-client-react';
import type { ChildProfile, QuizAttempt } from '@workspace/api-client-react';
import { getLessonsForAgeBand, levels, normalizeLessonId, type Lesson, type LevelId, type Question } from '@workspace/curriculum';
import { masteryUnlocked } from './access';
import { QuestionView, apiErrorBody, isAnswered } from './shared';
import { WatchStep } from './WatchStep';
import { useSpeechSafety } from './speech';
import './learn.css';

export function MasteryFlow({ child, levelId }: { child: ChildProfile; levelId: string }) {
  const level = levels.find((l) => l.id === levelId);
  const client = useQueryClient();
  const submit = useSubmitLevelAssessment();
  const [quiz, setQuiz] = useState<QuizAttempt | null>(null);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [result, setResult] = useState<{ score: number; passed: boolean; missed: string[]; feedback: string[] } | null>(null);
  const [reviewIds, setReviewIds] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useSpeechSafety(child.id, levelId, quiz?.attemptId);
  if (!level) return <main className="page-content not-found"><h1>That level isn’t here.</h1><Link className="primary-button" href={`/learn/${child.id}`}>Back to learning path</Link></main>;
  const lessons = getLessonsForAgeBand(child.ageBand ?? '10-12');
  const canTake = masteryUnlocked(child, level.id);
  if (!canTake) return <main className="page-content not-found"><h1>Keep learning first.</h1><p>Finish every lesson in this level (and the previous level) before the mastery check.</p><Link className="primary-button" href={`/learn/${child.id}`}>Back to learning path</Link></main>;

  const begin = async () => {
    setBusy(true); setError(''); setResult(null);
    try {
      const attempt = await startLearningQuiz(child.id, { kind: 'level', targetId: level.id });
      setQuiz(attempt); setAnswers(attempt.questions.map(() => [])); setReviewIds([]);
    } catch (e) {
      const body = apiErrorBody(e);
      if (body.status === 403 && body.missedLessonIds.length) { setReviewIds(body.missedLessonIds.map(normalizeLessonId)); setReviewed([]); }
      else setError(body.message);
    }
    setBusy(false);
  };
  const send = () => {
    if (!quiz) return;
    setError('');
    submit.mutate({ childId: child.id, data: { levelId: level.id as LevelId, attemptId: quiz.attemptId, answers } } as never, {
      onSuccess: (r) => { setResult({ score: r.score, passed: r.passed, missed: (r.missedLessonIds ?? []).map(normalizeLessonId), feedback: r.feedback ?? [] }); setQuiz(null); void client.invalidateQueries({ queryKey: getGetFamilyQueryKey() }); },
      onError: (e) => {
        const body = apiErrorBody(e); setError(body.message);
        if ([400, 403, 404, 409].includes(body.status ?? 0)) {
          setQuiz(null);
          void client.invalidateQueries({ queryKey: getGetFamilyQueryKey() });
        }
      },
    });
  };
  const markReviewed = async (lessonId: string) => {
    try { await recordLessonReview(child.id, lessonId); setReviewed((r) => [...r, lessonId]); } catch (e) { setError(apiErrorBody(e).message); }
  };
  const reviewing = reviewIds.length > 0 && !reviewIds.every((id) => reviewed.includes(id));
  return <main className="page-content assessment-page lesson-page">
    <Link href={`/learn/${child.id}`} className="back-link"><ArrowLeft size={15} /> Learning path</Link>
    <header className="lesson-top"><div className="lesson-kicker">Mastery check · {level.domain}</div><h1>{level.title}</h1><p>Score 80% or higher. Questions come from every lesson in this level.</p></header>
    <section className="lesson-card-panel">
      {reviewing && <div>
        <h2>Review before you try again</h2><p className="step-explanation">Go through each missed lesson’s scenes, then mark it reviewed. Your next check uses different questions.</p>
        {reviewIds.filter((id) => !reviewed.includes(id)).map((id) => { const l = lessons.find((x: Lesson) => x.id === id); return l ? <ReviewLesson key={id} lesson={l} onReviewed={() => void markReviewed(id)} /> : null; })}
      </div>}
      {!reviewing && !quiz && !result && <><p className="step-explanation">{reviewIds.length ? 'Review complete. You are ready for a fresh set.' : 'Take your time. You can use what you have learned.'}</p><button type="button" className="primary-button" onClick={begin} disabled={busy} data-testid="button-start-mastery">{busy ? 'Getting questions…' : 'Start mastery check'}</button></>}
      {quiz && <>{quiz.questions.map((q, i) => <QuestionView key={q.id} q={q as Pick<Question, 'id' | 'type' | 'prompt' | 'options'>} value={answers[i] ?? []} onChange={(v) => setAnswers((a) => a.map((x, k) => k === i ? v : x))} />)}
        <button type="button" className="primary-button" onClick={send} disabled={submit.isPending || !quiz.questions.every((q, i) => isAnswered(q as Question, answers[i]))} data-testid="button-submit-mastery">{submit.isPending ? 'Grading…' : 'Submit mastery check'}</button></>}
      {result && <div data-testid="assessment-result" className={`assessment-result ${result.passed ? 'passed' : 'retry'}`}>
        {result.passed ? <CheckCircle2 size={34} /> : null}
        <h2>{result.passed ? `Mastered at ${result.score}%` : `${result.score}% so far`}</h2>
        <p>{result.passed ? 'Your score is saved. The next level opens once your guardian approves the level project.' : 'You need 80%. Review the lessons below, then try with different questions.'}</p>
        {result.feedback.length > 0 && <ul>{result.feedback.map((f, i) => <li key={i}>{f}</li>)}</ul>}
        {!result.passed && result.missed.length > 0 && <p>Review: {result.missed.map((id) => lessons.find((l) => l.id === id)?.title ?? id).join(', ')}</p>}
        {result.passed ? <Link href={`/learn/${child.id}`} className="primary-button">Continue <ArrowRight size={16} /></Link> : <button type="button" className="primary-button" onClick={begin}>Review and retry</button>}
      </div>}
      {error && <p className="activity-feedback bad" role="alert">{error}</p>}
    </section>
  </main>;
}

function ReviewLesson({ lesson, onReviewed }: { lesson: Lesson; onReviewed: () => void }) {
  const [ok, setOk] = useState(false);
  return <div className="review-lesson"><h3>{lesson.title}</h3><WatchStep lesson={lesson} alreadyDone={false} onComplete={() => setOk(true)} />
    <button type="button" className="primary-button" disabled={!ok} onClick={onReviewed} data-testid={`button-reviewed-${lesson.id}`}><Check size={15} /> I reviewed this lesson</button></div>;
}
