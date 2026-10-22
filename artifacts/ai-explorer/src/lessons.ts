import type { AgeBand } from './audience';
import type { LessonDemoKind } from './LessonVisualDemo';

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
  introduction: string;
  ageBand: AgeBand;
  demoKind: LessonDemoKind;
  steps: LessonStep[];
};

type BaseLesson = Omit<Lesson, 'introduction' | 'ageBand' | 'demoKind'>;

export type Progress = { completedLessonIds: string[] };

export const lessons: BaseLesson[] = [
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

type AgeExtension = {
  introduction: string;
  challenge: LessonStep;
};

const demoKinds: Record<string, LessonDemoKind> = {
  'ai-basics': 'patterns',
  'clear-prompts': 'prompt-parts',
  'check-answers': 'evidence-check',
  'privacy-safe-use': 'privacy-sort',
  'school-integrity': 'school-rules',
  'responsible-use': 'ask-a-person',
  'prompt-design': 'prompt-recipe',
  'plan-an-app': 'app-plan',
  'test-app': 'test-cases',
  'iterate-app': 'iterate',
};

const ageExtensions: Record<string, Record<AgeBand, AgeExtension>> = {
  'ai-basics': {
    '10-12': { introduction: 'Think of sorting picture cards: after seeing many examples, a computer program may learn patterns that help it guess what a new picture shows. The guess can still be wrong, and people choose the examples and decide what happens next.', challenge: { heading: 'Practice: a pattern is only a clue', explanation: 'A music app notices that you often play upbeat songs after school. It may suggest another upbeat song, but it cannot know for sure what mood you are in.', question: 'What is the best way to describe the suggestion?', options: ['A useful guess based on a pattern', 'Proof that the app understands your feelings', 'A fact you must follow'], correctIndex: 0, feedback: 'Right. A pattern can guide a guess, but it cannot tell the whole story about a person.' } },
    '13-15': { introduction: 'Many AI systems learn statistical patterns from examples and use those patterns to predict a likely next word, image, or category. Prediction is not the same as understanding, and the training examples can leave gaps.', challenge: { heading: 'Practice: distinguish prediction from understanding', explanation: 'A video service recommends a clip because viewers with similar watch histories often chose it. The system has a pattern, not a complete explanation of your interests.', question: 'Which conclusion is supported?', options: ['The system found a pattern in activity data', 'The system knows why every viewer likes a clip', 'The recommendation proves the clip is high quality'], correctIndex: 0, feedback: 'Correct. A recommendation reveals a pattern-based prediction, not a full understanding or quality check.' } },
    '16-plus': { introduction: 'Machine-learning systems fit patterns from training data and apply them to new cases. Their output reflects both the design and the data; it is not evidence of human-like comprehension or independent judgment.', challenge: { heading: 'Practice: identify the system’s limit', explanation: 'A hiring model ranks applicants based on patterns in historical records. Those records may reflect past choices and missing information, so the ranking is not a neutral verdict.', question: 'What is the most responsible interpretation?', options: ['Treat the ranking as one limited signal that requires human review and bias checks', 'Assume the ranking is objective because it uses data', 'Use the score as the sole hiring decision'], correctIndex: 0, feedback: 'Yes. Data-driven output can carry limitations and should not replace accountable human review.' } },
  },
  'clear-prompts': {
    '10-12': { introduction: 'A clear request is like giving a teammate the directions they need: say what you want, who it is for, and how long or short it should be. Leave out private details.', challenge: { heading: 'Practice: add helpful details', explanation: 'You want help making a classroom poster about saving water. You still need to choose the ideas and make the poster yourself.', question: 'Which request gives a useful, bounded task?', options: ['Give me three short headline ideas for a water-saving poster', 'Make my whole project and hide that you helped', 'Write something good'], correctIndex: 0, feedback: 'That request is specific and asks for a small idea starter while leaving the project to you.' } },
    '13-15': { introduction: 'A useful prompt sets a goal, gives only relevant non-sensitive context, specifies a format, and names boundaries. You can revise one part at a time to see which instruction changes the result.', challenge: { heading: 'Practice: make the brief testable', explanation: 'Your science group needs a quick comparison of two renewable energy sources for a slide. You will verify the facts and write the final slide.', question: 'Which prompt gives the clearest brief?', options: ['Compare solar and wind power in a two-column table with three advantages each; flag claims that need checking', 'Make our slide awesome', 'Write and submit our whole presentation'], correctIndex: 0, feedback: 'It gives a goal, format, scope, and a reminder to verify claims.' } },
    '16-plus': { introduction: 'Treat prompting as specification: define the outcome, audience, constraints, format, and what the tool should not do. A well-bounded request makes outputs easier to evaluate and revise.', challenge: { heading: 'Practice: specify constraints', explanation: 'You are preparing a short explainer for a community group and need an outline, not a finished article. The topic includes claims that should be sourced.', question: 'Which brief is easiest to evaluate?', options: ['Draft a five-point outline for a general audience, separate factual claims from suggestions, and mark claims needing sources', 'Write a compelling article about this', 'Create the final piece and invent any missing evidence'], correctIndex: 0, feedback: 'A bounded output with source flags makes review possible and keeps authorship and evidence clear.' } },
  },
  'check-answers': {
    '10-12': { introduction: 'AI may mix up details or invent something that sounds real. Checking means looking for the same fact in a trusted book, learning site, or asking a knowledgeable adult—not just asking the tool again.', challenge: { heading: 'Practice: check a surprising claim', explanation: 'A study helper says that an animal can live for 300 years. You have not heard that before.', question: 'What is the best next step?', options: ['Look for the claim in a trusted science book or learning site', 'Trust it because it gave a number', 'Ask it to repeat the same answer'], correctIndex: 0, feedback: 'Good check. A separate trusted source can confirm or challenge a surprising claim.' } },
    '13-15': { introduction: 'A polished answer can still include invented references, missing context, or outdated information. Compare important claims against independent sources and inspect whether those sources actually support the statement.', challenge: { heading: 'Practice: audit a citation', explanation: 'An answer includes a journal article title, but the link is broken and a library search finds no matching article.', question: 'What should you do before citing it?', options: ['Verify that the article exists and supports the claim using a library database or publisher page', 'Keep the citation because it looks academic', 'Ask the same AI to confirm its own citation'], correctIndex: 0, feedback: 'Correct. Verify both that a source exists and that it supports the claim.' } },
    '16-plus': { introduction: 'Verification is claim-level work: identify what would count as evidence, consult sources independent of the generated answer, and check dates, methods, and uncertainty. A citation-looking string is not itself evidence.', challenge: { heading: 'Practice: evaluate evidence quality', explanation: 'A model summarizes a health statistic without a date or source. You need to decide whether it belongs in a public-facing explainer.', question: 'Which review is strongest?', options: ['Trace the statistic to a current primary or authoritative source and compare its definitions and limits', 'Use it if several AI tools repeat it', 'Keep it because it sounds plausible'], correctIndex: 0, feedback: 'Yes. Trace the claim to evidence and check whether the source’s definitions and limits match your use.' } },
  },
  'privacy-safe-use': {
    '10-12': { introduction: 'Private information can identify you or help someone reach your accounts: your address, school, phone number, passwords, and private photos. Use made-up details in practice and ask an adult if you are unsure.', challenge: { heading: 'Practice: remove identifying details', explanation: 'You want help writing a story about a school field trip. Your draft includes your school name and the date your class will be there.', question: 'What is the safest edit?', options: ['Replace the school and date with made-up details before sharing', 'Share it because the tool asked nicely', 'Add your home address for more context'], correctIndex: 0, feedback: 'Right. Use fictional details and never share information that could locate you.' } },
    '13-15': { introduction: 'Data can become identifying when details are combined. A username, school team, location tag, and schedule may reveal more than any single detail. Share only what is necessary, and follow adult and school rules.', challenge: { heading: 'Practice: notice combined clues', explanation: 'A prompt asks for your exact school, your daily route, and the time you leave practice to tailor a schedule.', question: 'What should you do?', options: ['Leave out identifying routine and location details; ask a trusted adult about safe alternatives', 'Send the details because each one seems ordinary', 'Add a phone number so the plan is complete'], correctIndex: 0, feedback: 'Exactly. Combined details can expose your routine and location; do not provide them.' } },
    '16-plus': { introduction: 'Privacy includes direct identifiers, sensitive context, metadata, and details that enable re-identification. Before using a tool, understand what data it receives and follow the organization’s policies; never input credentials or confidential records.', challenge: { heading: 'Practice: minimize the data', explanation: 'A project assistant asks you to paste a real customer support transcript to help draft a response.', question: 'What is the safest responsible step?', options: ['Use an approved environment and remove or synthesize identifying details according to policy', 'Paste the transcript because the task is work-related', 'Include account credentials so the response is accurate'], correctIndex: 0, feedback: 'Correct. Use an approved workflow and minimize or synthesize data; never provide credentials.' } },
  },
  'school-integrity': {
    '10-12': { introduction: 'Your teacher’s rules decide what help is allowed. AI might be allowed to explain a tricky idea or make practice questions, but it should not do work that your teacher asked you to do yourself.', challenge: { heading: 'Practice: keep the learning yours', explanation: 'Your class allows a tool to quiz you on vocabulary but does not allow it to write your paragraph.', question: 'Which use follows the rule?', options: ['Ask for a practice quiz, then write your own paragraph', 'Ask it to write the paragraph and change two words', 'Hide the tool use'], correctIndex: 0, feedback: 'Yes. Use only the allowed practice help and write the assigned work yourself.' } },
    '13-15': { introduction: 'Academic integrity depends on the assignment’s rules, not on whether a tool was used quietly. Separate permitted support—such as brainstorming or feedback—from work that must demonstrate your own skills, and disclose help as required.', challenge: { heading: 'Practice: distinguish coaching from authorship', explanation: 'A teacher allows feedback on a draft but says the student must write every sentence and disclose tools used.', question: 'What is an appropriate request?', options: ['Ask for feedback on clarity without rewriting the draft, then decide and disclose as instructed', 'Ask for a finished replacement draft', 'Submit rewritten text without mentioning the tool'], correctIndex: 0, feedback: 'That respects the stated boundary: feedback is allowed, authorship stays yours, and disclosure follows class rules.' } },
    '16-plus': { introduction: 'Academic integrity is about demonstrating the intended learning outcomes and accurately representing contributions. Policies vary by course; check the rules before using AI for research, coding, editing, or analysis.', challenge: { heading: 'Practice: preserve valid evidence of learning', explanation: 'A course permits AI-assisted debugging but requires students to explain their code changes and cite assistance.', question: 'Which workflow best meets those requirements?', options: ['Use bounded debugging help, review and test the changes, document assistance, and explain the result', 'Generate the solution and claim independent authorship', 'Avoid testing because the code compiles'], correctIndex: 0, feedback: 'Correct. Review, test, document, and be able to explain the work you submit.' } },
  },
  'responsible-use': {
    '10-12': { introduction: 'A tool cannot keep you safe or care for you like a trusted adult. If a question involves health, danger, strong feelings, or a private secret, stop and bring in an adult you trust.', challenge: { heading: 'Practice: know when to ask a person', explanation: 'A chatbot gives advice about a friend who says they might get hurt.', question: 'What should you do first?', options: ['Tell a trusted adult right away', 'Keep the chat secret and ask the bot again', 'Share your friend’s private details'], correctIndex: 0, feedback: 'Right. Bring in a trusted adult immediately; a chatbot is not emergency support.' } },
    '13-15': { introduction: 'AI can sound supportive but cannot assess danger, provide professional care, or take responsibility for a high-stakes decision. Consider who is affected, what could go wrong, and which qualified person should help.', challenge: { heading: 'Practice: identify a high-stakes boundary', explanation: 'A student asks an AI to decide whether a worrying symptom needs medical attention.', question: 'What is the responsible response?', options: ['Encourage them to contact a trusted adult or qualified health professional', 'Treat the AI’s answer as a diagnosis', 'Keep asking for a more confident guess'], correctIndex: 0, feedback: 'Correct. Health and safety decisions need a qualified person, not a model’s guess.' } },
    '16-plus': { introduction: 'Responsible use includes identifying stakes, affected people, system limitations, and escalation routes. Do not delegate safety-critical decisions to a model; use qualified human review and established procedures.', challenge: { heading: 'Practice: escalate instead of automating', explanation: 'A volunteer project proposes using an AI score to decide which community members receive urgent assistance.', question: 'What should the team do?', options: ['Pause deployment and require accountable human-led review with a transparent, validated process', 'Automatically follow the highest score', 'Hide the model’s role so decisions are faster'], correctIndex: 0, feedback: 'Yes. High-impact allocation needs transparent, accountable human oversight and careful validation.' } },
  },
  'prompt-design': {
    '10-12': { introduction: 'A helpful prompt is a small plan: say the goal, who the explanation is for, what shape the answer should take, and one limit. Never add your real name, school, or password.', challenge: { heading: 'Practice: improve one instruction', explanation: 'A weather explanation is confusing, and you want an easier version without asking the tool to do your homework.', question: 'Which follow-up is clearest?', options: ['Explain the same idea in four short steps with one made-up example', 'Make it better', 'Do my whole science assignment'], correctIndex: 0, feedback: 'Good. It names the change and the format while keeping the task small.' } },
    '13-15': { introduction: 'Prompt design is iterative. Give the tool a bounded goal and safe context, inspect the result, then change one instruction at a time. This makes it easier to understand why an output changed.', challenge: { heading: 'Practice: revise with a measurable request', explanation: 'A draft explainer has too many technical terms and is meant for new students.', question: 'Which follow-up makes the revision easy to check?', options: ['Replace jargon with plain language and keep the explanation under 120 words', 'Make it sound smarter', 'Rewrite everything and add facts'], correctIndex: 0, feedback: 'Exactly. The request has a clear audience, change, and measurable limit.' } },
    '16-plus': { introduction: 'A prompt is an interface contract: specify scope, audience, output format, constraints, source expectations, and non-goals. Evaluate outputs against those requirements instead of treating prompt quality as a guarantee of truth.', challenge: { heading: 'Practice: make evaluation criteria explicit', explanation: 'You need a first-pass outline of arguments on a policy topic, not a final recommendation.', question: 'Which instruction gives the strongest boundary?', options: ['List three arguments on each side, separate factual claims from value judgments, and mark claims requiring sources', 'Tell me which policy is objectively best', 'Produce a persuasive final answer with no caveats'], correctIndex: 0, feedback: 'Good. It structures the output and makes claims and uncertainty easier to evaluate.' } },
  },
  'plan-an-app': {
    '10-12': { introduction: 'A first app should help with one small problem. Draw one screen, pick one main button, and think about what happens after a tap. Do not collect anyone’s personal information.', challenge: { heading: 'Practice: keep the first version small', explanation: 'A group wants an app to remember library books and also include chat, profiles, and location tracking.', question: 'What is a safer first version?', options: ['A simple list of books to return, with no accounts or location data', 'Build every feature at once', 'Collect classmates’ addresses to share reminders'], correctIndex: 0, feedback: 'Exactly. Start with one useful action and avoid unnecessary data.' } },
    '13-15': { introduction: 'Planning starts with a user need and a narrow first version. Define the user, job, main action, and what data is truly necessary. A simple sketch reveals assumptions before you build.', challenge: { heading: 'Practice: write a testable app goal', explanation: 'Students miss deadlines because assignments are scattered across notebooks.', question: 'Which goal is specific enough for a prototype?', options: ['Let one student add and check off a made-up task list on one screen', 'Create a platform for every student in the district', 'Track each student’s location to improve reminders'], correctIndex: 0, feedback: 'Right. A single-screen task list is specific, testable, and avoids sensitive data.' } },
    '16-plus': { introduction: 'A responsible product brief defines users, a measurable problem, the minimum viable workflow, non-goals, data handling, and failure modes. Scope is a safety tool as well as a project-management choice.', challenge: { heading: 'Practice: define a responsible prototype', explanation: 'A team wants to help people plan study sessions and is considering collecting detailed behavioral profiles.', question: 'Which first version is best scoped?', options: ['Let users make a local sample schedule with optional, minimal inputs and clear deletion controls', 'Collect detailed profiles before validating the problem', 'Add social ranking and public sharing by default'], correctIndex: 0, feedback: 'Yes. Validate the core task first with minimal data and clear user control.' } },
  },
  'test-app': {
    '10-12': { introduction: 'Testing is trying examples to see if your app behaves the way you expected. Check a normal example, an empty one, and a surprising one. Use pretend data, never private details.', challenge: { heading: 'Practice: test an empty list', explanation: 'Your checklist has no items, and the screen looks broken even though nothing has gone wrong.', question: 'What test should you add?', options: ['Check that the app shows a friendly “nothing here yet” message', 'Test it with your real home address', 'Assume empty lists never happen'], correctIndex: 0, feedback: 'Correct. An empty state is a normal case that deserves a clear message.' } },
    '13-15': { introduction: 'A good test checks expected behavior across typical, boundary, and unexpected inputs. Record what happened, compare it with the requirement, and use synthetic data when testing.', challenge: { heading: 'Practice: cover a boundary case', explanation: 'A form accepts a short task title, but no one has tested a very long title or a blank one.', question: 'Which test plan is stronger?', options: ['Try blank, typical, and unusually long made-up titles and record the expected result for each', 'Try only the example that already works', 'Paste a real user’s data into the form'], correctIndex: 0, feedback: 'Exactly. Boundary cases reveal issues the happy path misses.' } },
    '16-plus': { introduction: 'Testing should map to requirements and risk: include representative inputs, edge cases, failure paths, accessibility, and privacy checks. Passing a narrow test set does not prove that a system is safe or correct in every situation.', challenge: { heading: 'Practice: choose risk-based tests', explanation: 'A prototype accepts user-created reminders and stores them locally.', question: 'What is the most useful additional test set?', options: ['Check empty, long, and unusual characters; verify keyboard access and confirm data stays local', 'Test only the default reminder', 'Assume local storage cannot expose information'], correctIndex: 0, feedback: 'Good. Test behavior, accessibility, and the stated privacy boundary together.' } },
  },
  'iterate-app': {
    '10-12': { introduction: 'After a first version works, make one small change and check it. If you cannot explain what changed, pause and ask someone to help you understand it.', challenge: { heading: 'Practice: improve without losing what works', explanation: 'Your app already adds list items. You want a clear button, but accidentally deleting everything would be frustrating.', question: 'What is a careful improvement?', options: ['Add one clear button, ask for confirmation, and test adding items again', 'Replace the whole app without checking', 'Add several new buttons at once'], correctIndex: 0, feedback: 'Right. One change, a confirmation, and a quick test help keep the app understandable.' } },
    '13-15': { introduction: 'Iteration means comparing a change with the original goal, testing for regressions, and explaining what was modified. Keep changes small enough to review and undo.', challenge: { heading: 'Practice: protect existing behavior', explanation: 'A study timer works, and a proposed redesign also changes how its start and pause buttons behave.', question: 'What should you do before keeping the redesign?', options: ['Test start and pause again, compare with the original requirement, and keep only understood changes', 'Publish it because it looks newer', 'Add another feature before checking'], correctIndex: 0, feedback: 'Exactly. A visual improvement should not silently break behavior.' } },
    '16-plus': { introduction: 'Iteration should preserve requirements and make effects observable. Review diffs, test regression and failure cases, document tradeoffs, and keep a rollback path for changes you cannot yet justify.', challenge: { heading: 'Practice: review a change responsibly', explanation: 'A generated refactor shortens the code but also changes input validation and removes a confirmation step.', question: 'What is the right next action?', options: ['Review the changes, restore required safeguards, and test the relevant behaviors before accepting', 'Accept because shorter code is always safer', 'Deploy without testing to see what users report'], correctIndex: 0, feedback: 'Correct. Smaller code is not automatically safer; preserve requirements and verify behavior before release.' } },
  },
};

export function getLessonsForAgeBand(ageBand: AgeBand): Lesson[] {
  return lessons.map((lesson) => {
    const ageExtension = ageExtensions[lesson.id][ageBand];
    return {
      ...lesson,
      ageBand,
      demoKind: demoKinds[lesson.id],
      introduction: ageExtension.introduction,
      steps: [...lesson.steps, ageExtension.challenge],
    };
  });
}
