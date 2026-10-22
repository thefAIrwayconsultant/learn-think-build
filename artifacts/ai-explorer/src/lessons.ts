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
  {
    id: 'school-integrity',
    title: 'AI, learning & schoolwork',
    topic: 'Academic integrity',
    durationMinutes: 6,
    summary: 'Know when AI can help you learn—and when the work must be yours.',
    steps: [
      {
        heading: 'Use AI as a coach, not a shortcut',
        explanation: 'Class rules come first. AI may help explain a hard idea or give practice questions when your teacher allows it. It should not write an assignment you are expected to do yourself.',
        question: 'Your teacher says essays must be written without AI. What should you do?',
        options: ['Ask AI to write a draft anyway', 'Follow the teacher’s rule and do the writing yourself', 'Copy an answer but change a few words'],
        correctIndex: 1,
        feedback: 'Correct. Follow your teacher’s instructions. If you are unsure what is allowed, ask before using a tool.',
      },
      {
        heading: 'Be honest about help',
        explanation: 'If AI is allowed, use only the kind of help your teacher permits and be honest about it. You are responsible for understanding and checking anything you turn in.',
        question: 'Your teacher allows AI brainstorming. What is a responsible next step?',
        options: ['Use ideas as a starting point, then make your own work and follow class disclosure rules', 'Submit the AI’s answer as your own', 'Hide that you used AI'],
        correctIndex: 0,
        feedback: 'Exactly. Keep your own thinking in the work and follow your class rules about disclosure.',
      },
    ],
  },
  {
    id: 'responsible-use',
    title: 'Know when to pause',
    topic: 'Good judgment',
    durationMinutes: 5,
    summary: 'Spot high-stakes questions, bias, and moments to ask a person.',
    steps: [
      {
        heading: 'Some questions need a person',
        explanation: 'AI is not a doctor, counselor, teacher, or emergency helper. For health, safety, serious feelings, or decisions that could hurt someone, talk to a trusted adult or qualified professional.',
        question: 'You feel unsafe and an AI offers advice. What is the safest choice?',
        options: ['Keep chatting until it solves everything', 'Tell a trusted adult right away', 'Share private details to get better advice'],
        correctIndex: 1,
        feedback: 'Right. A trusted person can help in ways an AI cannot.',
      },
      {
        heading: 'Look for missing viewpoints',
        explanation: 'AI answers can reflect gaps or unfair patterns in the examples they learned from. Ask who might be missing, compare viewpoints, and avoid using AI to label or judge people.',
        question: 'An AI makes a broad claim about a group of people. What should you do?',
        options: ['Treat it as a fact', 'Question the claim and check reliable, varied sources', 'Repeat it because it sounds confident'],
        correctIndex: 1,
        feedback: 'Good thinking. Broad claims about people need careful checking and more than one perspective.',
      },
    ],
  },
  {
    id: 'prompt-design',
    title: 'Build a better prompt',
    topic: 'Prompt design',
    durationMinutes: 7,
    summary: 'Use a simple prompt recipe: goal, context, format, and limits.',
    steps: [
      {
        heading: 'Give the tool a useful brief',
        explanation: 'A strong prompt says what you are trying to do, gives only safe and useful context, asks for a format, and adds limits. Never include private details. The person using the tool stays in charge.',
        question: 'Which is the safest, clearest prompt for practice?',
        options: ['Help me with science', 'Explain how rain forms for a 5th grader in three steps; use simple words and do not give me my homework answer', 'Here is my full name and school—do my report'],
        correctIndex: 1,
        feedback: 'That prompt gives a goal, audience, format, and boundary without sharing personal information.',
      },
      {
        heading: 'Improve one thing at a time',
        explanation: 'If an answer misses the mark, name what is missing and ask for one specific change. Check the revision rather than assuming it is better.',
        question: 'The explanation is too long. What is a useful follow-up?',
        options: ['Make it shorter, keep the three main ideas, and use simpler words', 'Try again', 'Make it perfect and correct'],
        correctIndex: 0,
        feedback: 'Specific follow-ups make the next attempt easier to evaluate.',
      },
    ],
  },
  {
    id: 'plan-an-app',
    title: 'Turn an idea into an app plan',
    topic: 'App building',
    durationMinutes: 8,
    summary: 'Choose a small problem, identify users, and sketch the first version.',
    steps: [
      {
        heading: 'Start with a real, small problem',
        explanation: 'Good beginner apps do one useful thing for a clear audience. Write down the problem, who has it, and what a helpful first version must do. Do not collect personal information you do not need.',
        question: 'Which is the best first app idea to plan?',
        options: ['An app that solves every problem for everyone', 'A simple checklist that helps my family remember reusable lunch items', 'A social app that shares my classmates’ contact details'],
        correctIndex: 1,
        feedback: 'A focused checklist is small enough to plan and avoids collecting other people’s private details.',
      },
      {
        heading: 'Sketch before asking AI to build',
        explanation: 'Plan the screen, the main action, and what happens after a tap. A sketch helps you explain what you want and notice unsafe or unnecessary features before building.',
        question: 'What should you decide before generating an app?',
        options: ['The problem, user, main screen, and one key action', 'Every feature a large company might have', 'The color only'],
        correctIndex: 0,
        feedback: 'A clear small plan gives you something concrete to build and test.',
      },
    ],
  },
  {
    id: 'test-app',
    title: 'Test, check & improve',
    topic: 'App building',
    durationMinutes: 7,
    summary: 'Try your app with examples, find bugs, and ask for human review.',
    steps: [
      {
        heading: 'Test normal and unusual cases',
        explanation: 'Try a typical input, an empty input, and something unexpected. Describe what happened instead of asking AI to guess. Never test with real private information.',
        question: 'Your checklist app crashes when the list is empty. What is a good next prompt?',
        options: ['It is broken; fix everything', 'When the list is empty, show a friendly message. Keep the existing add-item behavior. Explain what you changed.', 'Use my real family data to debug it'],
        correctIndex: 1,
        feedback: 'That gives a specific case, expected behavior, and a boundary for the change.',
      },
      {
        heading: 'Review before you share',
        explanation: 'AI-generated code can have mistakes or unsafe behavior. Read what changed, test it, and ask a trusted adult or teacher to review it before sharing or publishing.',
        question: 'A generated app asks visitors for their address even though it is a checklist. What should you do?',
        options: ['Keep it because AI added it', 'Remove the unnecessary data collection and ask an adult to review', 'Publish it immediately'],
        correctIndex: 1,
        feedback: 'Collect only what the app truly needs. Unnecessary personal data should not be there.',
      },
    ],
  },
  {
    id: 'iterate-app',
    title: 'Make your first app better',
    topic: 'App building',
    durationMinutes: 8,
    summary: 'Finish with a working basic app and explain how you made it.',
    steps: [
      {
        heading: 'Build in small, understandable changes',
        explanation: 'Ask for one feature at a time. After each change, check the result, compare it to your plan, and keep notes about what you changed. If you cannot explain a change, pause and ask for an explanation.',
        question: 'The first version works. How should you add a clear-all button?',
        options: ['Ask for a clear-all button, confirm before deleting, then test it', 'Ask AI to rewrite the whole app', 'Add several features at once without testing'],
        correctIndex: 0,
        feedback: 'Small changes and a confirmation step make the app easier to understand and safer to use.',
      },
      {
        heading: 'Show what you learned',
        explanation: 'A finished beginner app should solve one small problem, be tested, and be understandable to its builder. You should be able to explain what AI helped with, what you changed, and what still needs work.',
        question: 'What makes a strong end-of-year app project?',
        options: ['A flashy app you cannot explain', 'A simple, tested app you can explain and improve', 'An app that uses AI for every decision'],
        correctIndex: 1,
        feedback: 'That is the goal: build something small, understand it, test it, and own your choices.',
      },
    ],
  },
];
