import { useState } from 'react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { getGetFamilyQueryKey, useUpdateChildLearningState } from '@workspace/api-client-react';
import type { ChildProfile } from '@workspace/api-client-react';
import { getLessonsForAgeBand, levels, type Level } from '@workspace/curriculum';
import { Mascot } from '../Mascot';
import { getAgeBand } from '../audience';
import { Insights } from './Insights';
import { FamilyLeaderboard } from '../family/FamilyLeaderboard';
import { PASS, completedSet, finishedLevelCount, levelLessonsDone, levelUnlocked, lessonUnlocked, lessonsThisWeek, masteryUnlocked, nextPledgeLevel, projectApproved } from './access';
import { apiErrorBody } from './shared';
import './learn.css';

function ProjectBox({ child, level }: { child: ChildProfile; level: Level }) {
  const client = useQueryClient();
  const save = useUpdateChildLearningState();
  const existing = child.learningState.projects?.[level.id];
  const [text, setText] = useState(existing?.content ?? '');
  const [error, setError] = useState('');
  const approved = projectApproved(child, level.id);
  const changed = text.trim() !== (existing?.content ?? '').trim();
  const submit = () => {
    setError('');
    save.mutate({ childId: child.id, data: { ...child.learningState, projects: { ...child.learningState.projects, [level.id]: { content: text.trim(), approved: false, reviewedAt: null, rubric: [false, false, false] } } } }, {
      onSuccess: () => void client.invalidateQueries({ queryKey: getGetFamilyQueryKey() }),
      onError: (e) => { setError(apiErrorBody(e).message); void client.invalidateQueries({ queryKey: getGetFamilyQueryKey() }); },
    });
  };
  return <div className="project-box" data-testid={`project-${level.id}`}>
    <div className="eyebrow">Chapter project</div>
    <p className="step-explanation">{level.project.prompt}</p>
    <ul className="rubric-list">{level.project.rubric.map((r) => <li key={r}>{r}</li>)}</ul>
    {approved && !changed ? <p className="activity-feedback ok"><CheckCircle2 size={14} /> Approved by your guardian.</p> : null}
    <textarea className="reflection-box" rows={5} maxLength={4000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe or paste your project here (at least 60 characters)." data-testid={`input-project-${level.id}`} />
    <div className="reflection-meta"><span>{text.trim().length} / 60 characters minimum</span><span>{existing?.content && !approved ? 'Waiting for guardian review.' : approved ? 'Editing will ask your guardian to review again.' : ''}</span></div>
    <button type="button" className="primary-button" disabled={save.isPending || text.trim().length < 60 || !changed} onClick={submit} data-testid={`button-submit-project-${level.id}`}>{save.isPending ? 'Saving…' : existing?.content ? 'Update project' : 'Submit for guardian review'}</button>
    {error && <p className="activity-feedback bad" role="alert">{error}</p>}
  </div>;
}

export function LearnerHub({ child, familyLearners, testingAdmin = false }: { child: ChildProfile; familyLearners: ChildProfile[]; testingAdmin?: boolean }) {
  const client = useQueryClient();
  const save = useUpdateChildLearningState();
  const [pledgeError, setPledgeError] = useState('');
  const ageBand = child.ageBand ?? '10-12';
  const all = getLessonsForAgeBand(ageBand);
  const path = getAgeBand(ageBand);
  const done = completedSet(child);
  const finished = finishedLevelCount(child);
  const target = nextPledgeLevel(child);
  const s = child.learningState;
  const weekly = lessonsThisWeek(child).length;
  const agreeable = s.learnerAgreedLevel < target;
  const learnerPledge = () => { setPledgeError(''); save.mutate({ childId: child.id, data: { ...s, learnerAgreedLevel: target } }, { onSuccess: () => void client.invalidateQueries({ queryKey: getGetFamilyQueryKey() }), onError: (e) => { setPledgeError(apiErrorBody(e).message); void client.invalidateQueries({ queryKey: getGetFamilyQueryKey() }); } }); };
  const pledgeOpen = !testingAdmin && (s.learnerAgreedLevel < target || s.pledgeLevel < target);
  const pct = Math.min(100, Math.round((weekly / s.weeklyGoal) * 100));
  return <main className="page-content">
    <Link href="/family" className="back-link"><ArrowLeft size={15} /> Family account</Link>
    <section className="learn-header"><div className="learn-greeting"><span className="child-avatar">{child.displayName.trim().charAt(0).toUpperCase()}</span><div><div className="eyebrow">{path?.label} · {path?.pathName}</div><h1>Welcome, {child.displayName}.</h1><p>Pick up where you left off. There is no rush.</p></div></div><Link href="/family" className="secondary-button">Family controls</Link></section>
    <aside className="pip-nudge"><Mascot mood="bright" size={94} /><div><span className="eyebrow">Pip’s field note</span><strong>Stay curious. Check the answer.</strong><p>AI can sound sure and still be wrong. Your judgment is part of every lesson.</p></div></aside>
    <div className="hub-stats" data-testid="progress-summary">
      <div><strong>{finished} / {levels.length}</strong><span>chapters finished</span></div>
      <div><strong>{weekly} / {s.weeklyGoal}</strong><span>lessons this week</span><div className="goal-bar"><i style={{ width: `${pct}%` }} /></div></div>
      <div><strong>{done.size} / {all.length}</strong><span>missions done</span></div>
    </div>
    <FamilyLeaderboard learners={familyLearners} focusChildId={child.id} />
    {testingAdmin && <div className="family-note" role="status" data-testid="testing-admin-mode"><ShieldCheck size={18} /><span>Testing mode opens all lessons and mastery checks and skips the daily timer. Progress and scores still save to this learner profile. Use a separate test learner, not a real child’s profile.</span></div>}
    {pledgeOpen && <section className="pledge-card" aria-labelledby="pledge-heading">
      <div className="eyebrow">Chapter {target} pledge</div><h2 id="pledge-heading">AI is a tool. I’ll keep my judgment in the lead.</h2>
      <p>I will protect private information, check important answers, follow the rules, and stop to ask a trusted adult if anything feels wrong.</p>
      <p className="pledge-status"><span className={s.learnerAgreedLevel >= target ? 'ok' : ''}>{s.learnerAgreedLevel >= target ? 'You agreed' : 'You have not agreed yet'}</span> · <span className={s.pledgeLevel >= target ? 'ok' : ''}>{s.pledgeLevel >= target ? 'Guardian agreed' : 'Guardian has not agreed yet'}</span></p>
      {agreeable && <button className="primary-button" type="button" onClick={learnerPledge} disabled={save.isPending} data-testid="button-learner-pledge">{save.isPending ? 'Saving…' : 'I agree'} <Check size={16} /></button>}
      {s.learnerAgreedLevel >= target && s.pledgeLevel < target && <p className="level-hint">Lessons unlock after your guardian agrees. <Link href="/family" className="text-action" data-testid="link-guardian-pledge">Open Family account for guardian approval</Link>.</p>}
      {pledgeError && <p className="activity-feedback bad" role="alert">{pledgeError}</p>}
    </section>}
    <section className="levels-list" aria-labelledby="trails-heading"><div className="section-heading"><div><h2 id="trails-heading">Your learning path</h2><p>Explore one short mission each day. Finish the chapter, pass its mastery check, and make a project for your guardian to review before the next chapter opens.</p></div></div>
      {levels.map((level, li) => {
        const unlocked = testingAdmin || levelUnlocked(child, li);
        const lessons = level.lessonIds.map((id) => all.find((l) => l.id === id)).filter((l): l is NonNullable<typeof l> => !!l);
        const lessonsDone = levelLessonsDone(child, level.id);
        const mastered = child.masteredLevelIds.includes(level.id);
        const approved = projectApproved(child, level.id);
         const reason = li > finished ? 'Finish the previous chapter, including its approved project, to unlock this one.' : 'Both you and your guardian need to agree to the pledge above to open this chapter.';
        return <section className={`level-section${unlocked ? '' : ' level-locked'}`} key={level.id} aria-labelledby={`level-${level.id}`}>
          <div className="level-heading"><div><div className="eyebrow">Chapter {li + 1} of {levels.length} · {level.domain}</div><h3 id={`level-${level.id}`}>{level.title}</h3><p>{level.description}</p></div><span className={`level-status${mastered && approved ? ' is-graduated' : ''}`}>{mastered && approved ? 'Finished' : unlocked ? 'In progress' : 'Locked'}</span></div>
          {unlocked ? <>
            <div className="lesson-list">{lessons.map((lesson) => {
              const ok = testingAdmin || lessonUnlocked(child, lesson.id); const isDone = done.has(lesson.id);
              const inner = <><span className="lesson-card-body"><span className="lesson-meta"><span>{lesson.topic}</span>{isDone && <span className="done-mark" aria-label="Completed"><Check size={14} /></span>}{!ok && <LockKeyhole size={13} />}</span><span className="lesson-card-title"><h3>{lesson.title}</h3></span><span className="lesson-card-desc"><p>{lesson.summary}</p></span><span className="lesson-card-foot"><span>Day {lesson.sessionNumber} of {lesson.chapterSessionCount} · {isDone ? 'Revisit' : ok ? 'Start' : 'Finish the earlier lesson first'} · about {lesson.durationMinutes} min</span>{ok && <ArrowRight size={17} />}</span></span></>;
              return ok ? <Link key={lesson.id} href={`/learn/${child.id}/lesson/${lesson.id}`} className="lesson-card" data-testid={`link-lesson-${lesson.id}`}>{inner}</Link> : <div key={lesson.id} className="lesson-card is-locked" aria-disabled="true">{inner}</div>;
            })}</div>
            {mastered ? <div className="level-result"><CheckCircle2 size={18} /> Chapter mastery check passed.</div> : testingAdmin || masteryUnlocked(child, level.id) ? <Link href={`/learn/${child.id}/level/${level.id}/test`} className="primary-button level-test-link" data-testid={`link-assessment-${level.id}`}>{testingAdmin ? 'Test' : 'Take'} the Chapter {li + 1} mastery check <ArrowRight size={16} /></Link> : <p className="level-hint">Finish every mission to unlock the mastery check. You need {PASS}%.</p>}
            {lessonsDone && <ProjectBox child={child} level={level} />}
          </> : <p className="level-hint"><LockKeyhole size={15} /> {reason}</p>}
        </section>;
      })}</section>
    <section className="review-callout"><div><h3>Weekly mixed review</h3><p>Questions from everything you have finished. {child.reviewCount ? `Best score: ${child.bestReviewScore ?? 0}%.` : 'Take your first one any time.'}</p></div>
      {done.size ? <Link href={`/learn/${child.id}/review`} className="secondary-button" data-testid="link-review">Start review <ArrowRight size={15} /></Link> : <span className="level-hint">Unlocks after your first mission.</span>}</section>
    <Insights child={child} />
    <p className="footnote"><ShieldCheck size={16} /> If a tool or question makes you uncomfortable, pause and talk to your trusted adult.</p>
  </main>;
}
