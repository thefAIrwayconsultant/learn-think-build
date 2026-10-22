import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { getGetFamilyQueryKey, useMarkLessonTalkDiscussed, useUpdateChildLearningState } from '@workspace/api-client-react';
import type { ChildProfile, LearningState } from '@workspace/api-client-react';
import { getLessonsForAgeBand, levels, normalizeLessonId } from '@workspace/curriculum';
import { Insights } from '../learn/Insights';
import { PASS, completedSet, levelLessonsDone, lessonSequence, lessonsThisWeek, nextPledgeLevel } from '../learn/access';
import { apiErrorBody } from '../learn/shared';
import '../learn/learn.css';

function ProjectReview({ child, levelId, save }: { child: ChildProfile; levelId: string; save: (s: LearningState) => void }) {
  const level = levels.find((l) => l.id === levelId);
  const project = child.learningState.projects?.[levelId];
  const [rubric, setRubric] = useState<boolean[]>([false, false, false]);
  if (!level || !project?.content) return null;
  const mastered = child.masteredLevelIds.includes(levelId);
  const lessonsOk = levelLessonsDone(child, levelId);
  const ready = mastered && lessonsOk && project.content.length >= 60 && rubric.every(Boolean);
  const approve = () => save({ ...child.learningState, projects: { ...child.learningState.projects, [levelId]: { content: project.content, approved: true, reviewedAt: project.reviewedAt ?? null, rubric: [true, true, true] } } });
  return <div className="guardian-project" data-testid={`review-project-${levelId}`}>
    <div><strong>{level.title} project</strong><p className="project-text">{project.content}</p>
      {project.approved ? <span className="ok-text"><Check size={13} /> Approved{project.reviewedAt ? ` on ${new Date(project.reviewedAt).toLocaleDateString()}` : ''}</span> : <>
        <fieldset className="rubric-check"><legend>Check each criterion you have seen</legend>
          {level.project.rubric.map((r, i) => <label key={r}><input type="checkbox" checked={rubric[i]} onChange={(e) => setRubric((v) => v.map((x, k) => k === i ? e.target.checked : x))} /> {r}</label>)}</fieldset>
        {!mastered && <p className="activity-note">Waiting for the learner to pass the level mastery check ({PASS}%).</p>}
        {!lessonsOk && <p className="activity-note">Every lesson in this level must be completed first.</p>}
        <button className="primary-button" type="button" disabled={!ready} onClick={approve} data-testid={`button-approve-${levelId}`}>Approve project</button></>}
    </div></div>;
}

export function GuardianPanel({ child }: { child: ChildProfile }) {
  const client = useQueryClient();
  const saveState = useUpdateChildLearningState();
  const markTalk = useMarkLessonTalkDiscussed();
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const s = child.learningState;
  const lessons = getLessonsForAgeBand(child.ageBand ?? '10-12');
  const title = (id: string) => lessons.find((l) => l.id === normalizeLessonId(id))?.title ?? id.replace(/-/g, ' ');
  const refresh = () => void client.invalidateQueries({ queryKey: getGetFamilyQueryKey() });
  const save = (next: LearningState) => { setError(''); saveState.mutate({ childId: child.id, data: next }, { onSuccess: refresh, onError: (e) => { setError(apiErrorBody(e).message); refresh(); } }); };
  const records = child.lessonRecords;
  const total = lessonSequence(child).length || lessons.length;
  const minutes = Math.round(records.reduce((t, r) => t + r.durationSeconds, 0) / 60);
  const scored = records.filter((r) => typeof r.quizScore === 'number');
  const avg = scored.length ? Math.round(scored.reduce((t, r) => t + (r.quizScore ?? 0), 0) / scored.length) : null;
  const weak = child.weakTopics ?? [];
  const week = lessonsThisWeek(child).length;
  const reflections = records.filter((r) => r.reflection?.trim());
  const talks = records.filter((r) => !r.talkDiscussedAt);
  const target = nextPledgeLevel(child);
  const done = completedSet(child);
  const summary = `${child.displayName}: ${done.size} of ${total} lessons complete, ${minutes} minutes of learning, ${week} of ${s.weeklyGoal} lessons this week. Levels mastered: ${child.masteredLevelIds.length} of ${levels.length}. Best weekly review: ${child.reviewCount ? `${child.bestReviewScore ?? 0}%` : 'not taken yet'}.`;
  return <section className="family-learning-summary" aria-label={`${child.displayName} learning summary`}>
    <div className="summary-metrics">
      <span><strong>{done.size}/{total}</strong> lessons</span><span><strong>{minutes}</strong> minutes</span>
      <span><strong>{avg === null ? 'none' : `${avg}%`}</strong> avg check</span><span><strong>{week}/{s.weeklyGoal}</strong> this week</span>
      <span><strong>{child.reviewCount ?? 0}</strong> reviews</span>
    </div>
    <label className="weekly-goal-control">Weekly lesson goal
      <select value={s.weeklyGoal} onChange={(e) => save({ ...s, weeklyGoal: Number(e.target.value) })} disabled={saveState.isPending}>{[1, 2, 3, 4, 5, 6, 7].map((g) => <option key={g} value={g}>{g} {g === 1 ? 'lesson' : 'lessons'}</option>)}</select></label>
    <div className="family-summary-details">
      <div><strong>Topics to revisit</strong>{weak.length ? <ul>{weak.slice(0, 3).map((r) => <li key={r.lessonId}>{title(r.lessonId)} · missed in {r.misses} recent {r.misses === 1 ? 'check' : 'checks'}</li>)}</ul> : <p>{scored.length ? 'No missed topics in recent checks.' : 'No checks yet.'}</p>}</div>
      <div><strong>Reflections (private to your family)</strong>{reflections.length ? <ul>{reflections.map((r) => <li key={r.lessonId}><em>{title(r.lessonId)}:</em> {r.reflection}</li>)}</ul> : <p>No reflections yet.</p>}</div>
      <div><strong>Talk it Over cards</strong>{records.length ? <ul>{records.map((r) => { const l = lessons.find((x) => x.id === normalizeLessonId(r.lessonId)); return <li key={r.lessonId}><em>{title(r.lessonId)}</em>: {l?.familyPrompt ?? 'Ask what they learned.'} {r.talkDiscussedAt ? <span className="ok-text"><Check size={12} /> Discussed</span> : <button className="text-action" type="button" onClick={() => markTalk.mutate({ childId: child.id, lessonId: normalizeLessonId(r.lessonId) }, { onSuccess: refresh })} disabled={markTalk.isPending}>Mark discussed</button>}</li>; })}</ul> : <p>Cards appear after each lesson.</p>}{talks.length > 0 && <p className="activity-note">{talks.length} waiting.</p>}</div>
    </div>
    <div className="guardian-pledge">
      <div><strong>Family pledge · Level {target}</strong><span>Learner agreed through Level {s.learnerAgreedLevel}; guardian agreed through Level {s.pledgeLevel}.</span></div>
      {s.pledgeLevel < target && <button className="secondary-button" type="button" onClick={() => save({ ...s, pledgeLevel: target })} disabled={saveState.isPending} data-testid={`button-guardian-pledge-${child.id}`}>Agree as guardian</button>}
    </div>
    {levels.map((l) => <ProjectReview key={`${l.id}-${child.learningState.projects?.[l.id]?.content ?? ''}`} child={child} levelId={l.id} save={save} />)}
    <Insights child={child} />
    <details className="weekly-summary"><summary>Optional weekly summary</summary><p>{summary}</p>
      <button className="text-action" type="button" onClick={() => { void navigator.clipboard?.writeText(summary).then(() => setCopied(true)); }}>{copied ? 'Copied' : 'Copy summary'}</button></details>
    {error && <p role="alert" className="activity-feedback bad">{error}</p>}
  </section>;
}
