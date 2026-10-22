import { useState } from 'react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getGetFamilyQueryKey, startLearningQuiz, submitReviewQuiz } from '@workspace/api-client-react';
import type { ChildProfile, QuizAttempt, QuizGrade } from '@workspace/api-client-react';
import { getLessonsForAgeBand, type Question } from '@workspace/curriculum';
import { QuestionView, apiErrorBody, isAnswered } from './shared';
import { useSpeechSafety } from './speech';
import './learn.css';

export function ReviewFlow({ child }: { child: ChildProfile }) {
  const client = useQueryClient();
  const [quiz, setQuiz] = useState<QuizAttempt | null>(null);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [grade, setGrade] = useState<QuizGrade | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useSpeechSafety(child.id, quiz?.attemptId);
  const lessons = getLessonsForAgeBand(child.ageBand ?? '10-12');
  const title = (id: string) => lessons.find((l) => l.id === id)?.title ?? id;
  if (!child.completedLessonIds.length) return <main className="page-content not-found"><h1>Finish a lesson first.</h1><p>The weekly review mixes questions from lessons you have completed.</p><Link className="primary-button" href={`/learn/${child.id}`}>Back to learning path</Link></main>;
  const begin = async () => {
    setBusy(true); setError(''); setGrade(null);
    try { const a = await startLearningQuiz(child.id, { kind: 'review' }); setQuiz(a); setAnswers(a.questions.map(() => [])); }
    catch (e) { setError(apiErrorBody(e).message); }
    setBusy(false);
  };
  const send = async () => {
    if (!quiz) return;
    setBusy(true); setError('');
    try { const g = await submitReviewQuiz(child.id, { attemptId: quiz.attemptId, answers }); setGrade(g); setQuiz(null); await client.invalidateQueries({ queryKey: getGetFamilyQueryKey() }); }
    catch (e) {
      const body = apiErrorBody(e); setError(body.message);
      if ([400, 403, 404, 409].includes(body.status ?? 0)) {
        setQuiz(null); void client.invalidateQueries({ queryKey: getGetFamilyQueryKey() });
      }
    }
    setBusy(false);
  };
  return <main className="page-content lesson-page">
    <Link href={`/learn/${child.id}`} className="back-link"><ArrowLeft size={15} /> Learning path</Link>
    <header className="lesson-top"><div className="lesson-kicker">Weekly mixed review</div><h1>Bring it all back</h1><p>Questions from lessons you have finished. It is practice, with no pressure.</p></header>
    <section className="lesson-card-panel">
      {!quiz && !grade && <button type="button" className="primary-button" onClick={begin} disabled={busy} data-testid="button-start-review">{busy ? 'Getting questions…' : 'Start review'}</button>}
      {quiz && <>{quiz.questions.map((q, i) => <QuestionView key={q.id} q={q as Pick<Question, 'id' | 'type' | 'prompt' | 'options'>} value={answers[i] ?? []} onChange={(v) => setAnswers((a) => a.map((x, k) => k === i ? v : x))} />)}
        <button type="button" className="primary-button" onClick={send} disabled={busy || !quiz.questions.every((q, i) => isAnswered(q as Question, answers[i]))} data-testid="button-submit-review">{busy ? 'Grading…' : 'Submit review'}</button></>}
      {grade && <div className={`assessment-result ${grade.passed ? 'passed' : 'retry'}`} data-testid="review-result">
        <h2>{grade.score}% on your review</h2>
        <p>{grade.passed ? 'Strong recall. Your score is saved.' : 'Some ideas need another look. Your best score is kept.'}</p>
        {grade.feedback.length > 0 && <ul>{grade.feedback.map((f, i) => <li key={i}>{f}</li>)}</ul>}
        {grade.missedLessonIds.length > 0 && <p>Worth revisiting: {grade.missedLessonIds.map((id) => <Link key={id} href={`/learn/${child.id}/lesson/${id}`} className="text-action">{title(id)} </Link>)}</p>}
        <button type="button" className="secondary-button" onClick={begin}>Try another review</button> <Link href={`/learn/${child.id}`} className="primary-button">Done <ArrowRight size={15} /></Link>
      </div>}
      {error && <p className="activity-feedback bad" role="alert">{error}</p>}
    </section>
  </main>;
}
