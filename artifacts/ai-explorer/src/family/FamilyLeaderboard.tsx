import type { ChildProfile } from '@workspace/api-client-react';
import './family-leaderboard.css';

function ordinal(rank: number) {
  const suffix = rank % 100 >= 11 && rank % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[rank % 10] ?? 'th';
  return `${rank}${suffix}`;
}

export function FamilyLeaderboard({ learners, focusChildId }: { learners: ChildProfile[]; focusChildId?: string }) {
  let currentRank = 0;
  let priorScore: number | null = null;
  const ranked = [...learners]
    .sort((a, b) => b.learningScore - a.learningScore || b.completedLessonIds.length - a.completedLessonIds.length)
    .map((learner, index) => {
      if (priorScore !== learner.learningScore) currentRank = index + 1;
      priorScore = learner.learningScore;
      return { learner, rank: currentRank };
    });
  const focused = ranked.find((entry) => entry.learner.id === focusChildId);

  return <section className="family-leaderboard" aria-labelledby="family-leaderboard-title" data-testid="family-leaderboard">
    <div className="family-leaderboard-heading">
      <div>
        <div className="eyebrow">Private family board</div>
        <h2 id="family-leaderboard-title">{focusChildId ? 'Your family learning scores' : 'Family learning scores'}</h2>
        <p>{focusChildId && focused ? `You’re ${ordinal(focused.rank)} of ${learners.length}. Keep learning at your own pace.` : 'Celebrate what each learner is building, at their own pace.'}</p>
      </div>
      {focused && <div className="leaderboard-current-score"><strong>{focused.learner.learningScore.toLocaleString()}</strong><span>your points</span></div>}
    </div>

    {ranked.length ? <ol className="family-leaderboard-list" aria-label="Learner scores">
      {ranked.map(({ learner, rank }) => <li key={learner.id} className={learner.id === focusChildId ? 'is-current-learner' : ''} data-testid={`leaderboard-entry-${learner.id}`}>
        <span className="leaderboard-rank" aria-label={`${ordinal(rank)} place`}>{ordinal(rank)}</span>
        <div className="leaderboard-learner">
          <strong>{learner.displayName}</strong>
          <span>{learner.completedLessonIds.length} missions · {learner.masteredLevelIds.length} chapters mastered</span>
        </div>
        <strong className="leaderboard-points">{learner.learningScore.toLocaleString()} <small>pts</small></strong>
      </li>)}
    </ol> : <p className="leaderboard-empty">Add a learner profile to start tracking family learning points.</p>}

    <details className="leaderboard-how">
      <summary data-testid="toggle-score-details">How points are earned</summary>
      <ul>
        <li>10 points for each completed mission.</li>
        <li>1–5 points for each completed mission’s best quiz score.</li>
        <li>50 points for each chapter mastery check.</li>
        <li>Up to 10 points for your best weekly review score.</li>
      </ul>
      <p>Points never come from time spent, streaks, or repeat attempts. Scores are visible only to your family.</p>
    </details>
  </section>;
}
