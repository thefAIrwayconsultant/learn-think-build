export * from './types';
import type { AgeBand, Lesson, Level } from './types';
import { bands, makeLesson } from './content';
import { foundations } from './foundations';
import { responsible } from './responsible';
import { prompts } from './prompts';
import { builders } from './builders';

const aliases: Record<string, string> = {
  'ai-basics': 'what-is-ai',
  'clear-prompts': 'clear-instructions',
  'check-answers': 'check-the-answer',
};

export function normalizeLessonId(id: string): string {
  return aliases[id] ?? id;
}

export const levels: Level[] = [
  {
    id: 'ai-foundations', title: 'AI Foundations', domain: 'Engaging with AI',
    description: 'Patterns, next-word prediction, confident mistakes, synthetic media, and privacy.',
    lessonIds: foundations.map(lesson => lesson.id),
    project: { prompt: 'Make a one-page "How AI answers" guide for a younger sibling or friend. Explain pattern prediction, show one example of a confident wrong answer, and list three things that should never be typed into an AI tool.', rubric: ['Explains AI as pattern prediction, not a person', 'Includes a checked example of a wrong or unverified answer', 'Names at least three private details to keep out'] },
  },
  {
    id: 'responsible-use', title: 'Safe & Responsible Use', domain: 'Managing AI',
    description: 'Companions, bias, honest schoolwork, when not to use AI, and pressure or scams.',
    lessonIds: responsible.map(lesson => lesson.id),
    project: { prompt: 'Write a personal AI use agreement: when you will use AI, when you will not, how you will disclose help, and who you will tell if something feels wrong.', rubric: ['Separates allowed from not-allowed uses', 'Includes how help will be disclosed', 'Names a trusted person to ask'] },
  },
  {
    id: 'prompt-craft', title: 'Prompt Craft', domain: 'Creating with AI',
    description: 'Goal, context, format, limits, follow-ups, tutoring, sources, and creative credit.',
    lessonIds: prompts.map(lesson => lesson.id),
    project: { prompt: 'Pick a real task and write a first prompt, a weak result, and an improved follow-up. Explain what you changed and how you verified the final answer.', rubric: ['Prompt states goal, context, format, and limits', 'Shows a specific follow-up change', 'Describes how the result was checked'] },
  },
  {
    id: 'app-builder', title: 'App Builder', domain: 'Designing AI',
    description: 'Training data, planning, building in small steps, testing, and explaining.',
    lessonIds: builders.map(lesson => lesson.id),
    project: { prompt: 'Plan and build a small app that solves one problem. Describe the user, main action, one test of an unusual case, and what you would improve next.', rubric: ['Names one user and one problem', 'Records a test including an unusual case', 'Explains what was changed and what remains'] },
  },
];

export const lessons: Lesson[] = bands.flatMap(age => [...foundations, ...responsible, ...prompts, ...builders].map(seed => makeLesson(seed, age)));

export function getLessonsForAgeBand(ageBand: AgeBand): Lesson[] {
  return lessons.filter((lesson) => lesson.ageBand === ageBand);
}
