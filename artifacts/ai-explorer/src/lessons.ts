export type LessonStep = {
  heading: string;
  explanation: string;
  question: string;
  options: string[];
  correctIndex: number;
  feedback: string;
};

export type Lesson = {
  id: string;
  title: string;
  topic: string;
  durationMinutes: number;
  summary: string;
  steps: LessonStep[];
};

export type Progress = { completedLessonIds: string[] };

export const lessons: Lesson[] = [
  {
    id: 'ai-basics',
    title: 'So, what is AI?',
    topic: 'AI basics',
    durationMinutes: 4,
    summary: 'Meet the pattern-finder behind some of the tools you use.',
    steps: [
      {
        heading: 'A tool that learns patterns',
        explanation: 'Artificial intelligence (AI) is software that can spot patterns in examples and use them to make a guess or create something. It does not think or understand the way a person does. People build it, choose what it learns from, and decide how to use it.',
        question: 'Which description fits AI best?',
        options: ['A person hiding inside a computer', 'Software that finds patterns in examples', 'A machine that always knows the truth'],
        correctIndex: 1,
        feedback: 'Exactly. AI finds patterns in examples; it is a tool people make, not a person or a truth machine.',
      },
      {
        heading: 'A useful guess, not a fact machine',
        explanation: 'An AI tool may sound confident and still get something wrong. Its answer is a prediction based on patterns, not proof. People bring the context, judgment, and responsibility that a tool cannot.',
        question: 'An AI gives you a surprising fact for school. What is the smart next move?',
        options: ['Check it with a trusted source', 'Believe it because it sounds certain', 'Copy it before it disappears'],
        correctIndex: 0,
        feedback: 'Right. AI can make mistakes, so check important claims with a trusted source before using them.',
      },
    ],
  },
  {
    id: 'clear-prompts',
    title: 'Give it a clear brief',
    topic: 'Clear instructions',
    durationMinutes: 5,
    summary: 'Practice giving a tool enough detail to be useful.',
    steps: [
      {
        heading: 'Specific beats mysterious',
        explanation: 'A prompt is an instruction or question you give an AI tool. Clear prompts include useful details: what you need, who it is for, and any limits. You are still the one steering the work.',
        question: 'Which prompt gives the clearest direction?',
        options: ['Tell me about animals', 'Write something interesting', 'Explain how bees help gardens in 3 simple sentences'],
        correctIndex: 2,
        feedback: 'That one gives a topic, audience-friendly level, and length. Good details help guide the answer.',
      },
      {
        heading: 'Add details, keep your voice',
        explanation: 'You can improve a prompt by asking for a format or a point of view. Try one change at a time and see what happens. The result is a starting point—not a replacement for your own ideas.',
        question: 'You need ideas for a class poster about saving water. What is a helpful next prompt?',
        options: ['Make my whole poster and do not tell me what you wrote', 'Suggest three catchy poster headlines for a class project', 'Do my homework'],
        correctIndex: 1,
        feedback: 'Nice. It asks for a small, useful set of ideas while leaving the project and choices in your hands.',
      },
    ],
  },
  {
    id: 'check-answers',
    title: 'Fact-check the answer',
    topic: 'Critical thinking',
    durationMinutes: 5,
    summary: 'Build a habit of checking before you trust or share.',
    steps: [
      {
        heading: 'Confident does not mean correct',
        explanation: 'AI can mix up names, dates, or details, and sometimes invent information. This is sometimes called a hallucination. A polished answer can still be wrong, so pause when something matters.',
        question: 'An AI lists a book that you cannot find anywhere. What might be happening?',
        options: ['The book must be rare and definitely real', 'The AI may have invented or mixed up details', 'The AI has special secret knowledge'],
        correctIndex: 1,
        feedback: 'Correct. AI may invent details or combine patterns in a way that sounds real. Look for evidence.',
      },
      {
        heading: 'Check with sources you can trust',
        explanation: 'For important information, compare the claim with reliable sources such as a book from your library, a trusted educational site, or an adult who knows the subject. If sources disagree, keep asking questions.',
        question: 'Which is the strongest way to check a claim for a school report?',
        options: ['Find the same claim on a trusted educational source', 'Ask the same AI to repeat its answer', 'Choose whichever answer sounds most exciting'],
        correctIndex: 0,
        feedback: 'Yes. A trusted independent source gives you evidence beyond the original AI answer.',
      },
    ],
  },
  {
    id: 'privacy-safe-use',
    title: 'Keep private things private',
    topic: 'Privacy & safety',
    durationMinutes: 4,
    summary: 'Learn what not to share and when to ask for help.',
    steps: [
      {
        heading: 'Your details belong to you',
        explanation: 'Never enter private information into an AI tool. That includes your full name, home address, phone number, passwords, school details, or private photos. If you are unsure whether something is private, do not share it.',
        question: 'Which detail should you never type into an AI tool?',
        options: ['A made-up name for a story character', 'Your home address', 'The color blue'],
        correctIndex: 1,
        feedback: 'Exactly. Keep your home address—and all personal details—private. When unsure, leave it out.',
      },
      {
        heading: 'Pause and talk to someone',
        explanation: 'If a tool asks for private details, shows you something upsetting, or makes you uncomfortable, stop using it and tell a trusted adult. You do not have to figure it out alone.',
        question: 'A tool asks for your password to “make a better answer.” What should you do?',
        options: ['Share it just this once', 'Stop and tell a trusted adult', 'Try a shorter password instead'],
        correctIndex: 1,
        feedback: 'Right. Never share a password. Stop and ask a trusted adult for help.',
      },
    ],
  },
];
