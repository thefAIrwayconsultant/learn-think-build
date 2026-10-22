export type LearningLevelId =
  | 'ai-foundations'
  | 'responsible-use'
  | 'prompt-craft'
  | 'app-builder';

export type LevelQuestion = {
  question: string;
  options: string[];
};

export type LearningLevel = {
  id: LearningLevelId;
  title: string;
  shortTitle: string;
  description: string;
  objective: string;
  lessonIds: string[];
  assessment: LevelQuestion[];
};

export const learningLevels: LearningLevel[] = [
  {
    id: 'ai-foundations',
    title: 'Level 1 · AI Foundations / Engaging with AI',
    shortTitle: 'AI Foundations',
    description: 'Understand how AI works, where it can be wrong, and how to protect personal information.',
    objective: 'Explain AI as a pattern-finding tool, verify claims, and name information that should stay private.',
    lessonIds: ['ai-basics', 'clear-prompts', 'check-answers', 'privacy-safe-use'],
    assessment: [
      { question: 'What is AI best described as?', options: ['A person inside a computer', 'Software that finds patterns and makes predictions', 'A source that is always correct'] },
      { question: 'An AI gives a surprising fact. What should you do?', options: ['Believe it if it sounds certain', 'Check it with a trustworthy independent source', 'Repeat the question until it agrees'] },
      { question: 'Which is personal information you should not share with an AI tool?', options: ['A made-up story character', 'A favorite color', 'Your home address'] },
      { question: 'Which is the clearest prompt?', options: ['Tell me something', 'Explain how rain forms in three simple steps', 'Do my work'] },
      { question: 'What should you remember about an AI answer?', options: ['It can sound sure and still be wrong', 'It is always checked by an expert', 'It understands the world like a person'] },
    ],
  },
  {
    id: 'responsible-use',
    title: 'Level 2 · Safe & Responsible Use / Managing AI',
    shortTitle: 'Safe & Responsible Use',
    description: 'Practice academic honesty, bias awareness, and when to stop and ask a trusted person.',
    objective: 'Follow class rules, keep your own work your own, and recognize questions that need human help.',
    lessonIds: ['school-integrity', 'responsible-use'],
    assessment: [
      { question: 'Your teacher says no AI for an essay. What should you do?', options: ['Use AI but hide it', 'Follow the rule and write it yourself', 'Copy and change a few words'] },
      { question: 'AI is allowed for brainstorming. What is responsible?', options: ['Submit its answer as your own', 'Follow class disclosure rules and create your own work', 'Ask it to finish everything'] },
      { question: 'An AI makes a broad claim about a group. What is wise?', options: ['Treat it as a fact', 'Repeat it', 'Question it and check varied trustworthy sources'] },
      { question: 'You feel unsafe and an AI gives advice. What next?', options: ['Keep chatting only with AI', 'Tell a trusted adult right away', 'Share your password for better help'] },
      { question: 'Who should make important decisions about health or safety?', options: ['A qualified person or trusted adult', 'An AI by itself', 'A random online comment'] },
    ],
  },
  {
    id: 'prompt-craft',
    title: 'Level 3 · Prompt Craft / Creating with AI',
    shortTitle: 'Prompt Craft',
    description: 'Write useful prompts with a goal, safe context, format, and limits.',
    objective: 'Improve an AI request with specific instructions while protecting privacy and keeping your own judgment.',
    lessonIds: ['prompt-design'],
    assessment: [
      { question: 'Which prompt is both clear and privacy-safe?', options: ['Help with everything', 'Here is my full name and school; do my report', 'Explain the water cycle in three steps for a 5th grader'] },
      { question: 'An answer is too long. What is a useful follow-up?', options: ['Make it perfect', 'Shorten it to three key ideas in simple words', 'Try again'] },
      { question: 'What should a useful prompt include?', options: ['A clear goal and helpful limits', 'Private details', 'A request to do all your schoolwork'] },
      { question: 'The answer seems incorrect. What should you do?', options: ['Trust it anyway', 'Ask the same AI if it is sure', 'Check a reliable independent source'] },
      { question: 'Who is responsible for checking and using the AI response?', options: ['The AI alone', 'The person using the tool', 'No one'] },
    ],
  },
  {
    id: 'app-builder',
    title: 'Level 4 · App Builder / Designing AI',
    shortTitle: 'App Builder',
    description: 'Plan a small app, ask for focused changes, test edge cases, and explain what you made.',
    objective: 'Build toward a basic app that solves one small problem, protects users, and can be explained by its creator.',
    lessonIds: ['plan-an-app', 'test-app', 'iterate-app'],
    assessment: [
      { question: 'What makes a good first app project?', options: ['An app for every problem', 'A small tool for one clear need', 'A social network that collects classmates’ contact information'] },
      { question: 'When should you plan the app screens and main action?', options: ['Before asking for code', 'Only after publishing', 'Never'] },
      { question: 'How should you ask AI to add a feature?', options: ['Rewrite everything', 'Add many features at once', 'Request one clear change and test it'] },
      { question: 'What should you do with unnecessary personal-data collection?', options: ['Keep it because the AI added it', 'Remove it and ask an adult to review', 'Publish it immediately'] },
      { question: 'What is a strong beginner app outcome?', options: ['A simple, tested app you can explain', 'A flashy app you do not understand', 'An app that lets AI make every decision'] },
    ],
  },
];

export const passingScore = 80;

