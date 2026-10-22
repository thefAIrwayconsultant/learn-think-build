import type { ChildProfile } from '@workspace/api-client-react';
import { levels } from '@workspace/curriculum';
import { badges, highScores, skillMap } from './access';

export function Insights({ child }: { child: ChildProfile }) {
  const map = skillMap(child).filter((m) => m.state);
  const b = badges(child);
  const hs = highScores(child);
  const best = hs.lessonScores.length ? Math.max(...hs.lessonScores.map((s) => s.score)) : null;
  return <section className="insights" aria-label="Skills, badges and high scores">
    <div className="insight-block"><h4>Skill map</h4>
      {map.length ? <ul className="skill-list">{map.map(({ lesson, state }) => <li key={lesson.id} className={`skill-${state}`}><span>{lesson.title}</span><b>{state}</b></li>)}</ul> : <p className="activity-note">Finish a lesson to start your skill map.</p>}
    </div>
    <div className="insight-block"><h4>Badges</h4>
      {b.length ? <div className="badge-row">{b.map((x) => <span key={x.key} className={`badge badge-${x.kind}`}>{x.label}</span>)}</div> : <p className="activity-note">Badges appear as lessons, levels and reviews are completed.</p>}
    </div>
    <div className="insight-block"><h4>Personal bests</h4>
      <ul className="skill-list">
        <li><span>Best lesson check</span><b>{best === null ? 'none yet' : `${best}%`}</b></li>
        {levels.map((l) => { const v = hs.levelScores[l.id]; return typeof v === 'number' ? <li key={l.id}><span>{l.title} mastery</span><b>{v}%</b></li> : null; })}
        <li><span>Best weekly review ({hs.reviews} taken)</span><b>{hs.review === null || hs.reviews === 0 ? 'none yet' : `${hs.review}%`}</b></li>
      </ul>
    </div>
  </section>;
}
