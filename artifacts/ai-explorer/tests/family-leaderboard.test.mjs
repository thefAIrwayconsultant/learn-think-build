import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register('./ignore-styles.mjs', import.meta.url);
const React = await import('react');
const { renderToStaticMarkup } = await import('react-dom/server');
const { FamilyLeaderboard } = await import('../src/family/FamilyLeaderboard.tsx');

test('family leaderboard ranks only the provided learners and explains the points', () => {
  const learners = [
    { id: 'a', displayName: 'Riley', learningScore: 80, completedLessonIds: ['one'], masteredLevelIds: [] },
    { id: 'b', displayName: 'Jordan', learningScore: 150, completedLessonIds: ['one', 'two'], masteredLevelIds: ['chapter-1'] },
    { id: 'c', displayName: 'Sam', learningScore: 150, completedLessonIds: ['one', 'two'], masteredLevelIds: ['chapter-1'] },
  ];
  const html = renderToStaticMarkup(React.createElement(FamilyLeaderboard, { learners, focusChildId: 'a' }));

  assert.ok(html.indexOf('Jordan') < html.indexOf('Sam'));
  assert.ok(html.indexOf('Sam') < html.indexOf('Riley'));
  assert.match(html, /You’re 3rd of 3/);
  assert.ok(html.includes('150 <small>pts</small>'));
  assert.match(html, /Points never come from time spent, streaks, or repeat attempts/);
  assert.match(html, /Scores are visible only to your family/);
});
