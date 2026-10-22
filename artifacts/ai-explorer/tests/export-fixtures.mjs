// Test-only public curriculum data; no accounts, reflections or credentials.
import { mkdirSync, writeFileSync } from 'node:fs';
import { getLessonsForAgeBand } from '@workspace/curriculum';
const fixtures = ['10-12', '13-15', '16-plus'].flatMap(band => getLessonsForAgeBand(band).map(lesson => ({
  band, id: lesson.id, levelId: lesson.levelId, kind: lesson.activity.kind,
  categories: lesson.activity.items?.map(item => item.category),
  correctChoice: lesson.activity.choices?.findIndex(choice => choice.correct),
  correctContextChoice: lesson.activity.contextChoices?.findIndex(choice => choice.correct),
  fields: lesson.activity.fields,
  questions: Object.fromEntries(lesson.questionBank.map(q => [q.id, { type: q.type, answer: q.answer }])),
})));
const dir = new URL('../../../generated-artifacts/qa/', import.meta.url);
mkdirSync(dir, { recursive: true });
writeFileSync(new URL('curriculum-fixtures.json', dir), JSON.stringify(fixtures));
console.log(`Exported ${fixtures.length} lesson fixtures, without learner data.`);
