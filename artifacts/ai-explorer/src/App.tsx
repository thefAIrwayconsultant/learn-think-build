import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Clock3, Compass, Lightbulb, LockKeyhole, LogOut, Pause, Play, RotateCcw, ShieldCheck, Sparkles, Trash2, UserRoundPlus, Volume2 } from 'lucide-react';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation, useRoute } from 'wouter';
import { getGetFamilyQueryKey, useCompleteChildLesson, useCreateChildProfile, useDeleteChildProfile, useGetFamily, useMarkLessonTalkDiscussed, useSubmitLevelAssessment, useUpdateChildAgeBand, useUpdateChildLearningState } from '@workspace/api-client-react';
import type { ChildProfile, GuardianFamily } from '@workspace/api-client-react';
import type { LessonProgressInputLessonId } from '@workspace/api-client-react';
import { getLessonsForAgeBand, type Lesson } from './lessons';
import { learningLevels, passingScore, type LearningLevelId } from './levels';
import { Mascot } from './Mascot';
import { AgeBandPicker } from './AgeBandPicker';
import { LessonVisualDemo } from './LessonVisualDemo';
import { getAgeBand, type AgeBand } from './audience';
import './index.css';

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const queryClient = new QueryClient();

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#1687d9',
    colorForeground: '#102b4e',
    colorMutedForeground: '#536b82',
    colorDanger: '#b44c3e',
    colorBackground: '#ffffff',
    colorInput: '#ffffff',
    colorInputForeground: '#102b4e',
    colorNeutral: '#c9d9e8',
    fontFamily: "'Nunito Sans', sans-serif",
    borderRadius: '1rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fffdf6] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#243d39] font-bold',
    headerSubtitle: 'text-[#687a72]',
    socialButtonsBlockButtonText: 'text-[#243d39] font-bold',
    formFieldLabel: 'text-[#243d39] font-bold',
    footerActionLink: 'text-[#28695d] font-bold',
    footerActionText: 'text-[#687a72]',
    dividerText: 'text-[#687a72]',
    identityPreviewEditButton: 'text-[#28695d]',
    formFieldSuccessText: 'text-[#28695d]',
    alertText: 'text-[#773a31]',
    logoBox: 'rounded-xl overflow-hidden',
    logoImage: 'object-contain',
    socialButtonsBlockButton: 'rounded-xl border-[#d9d7c9] bg-[#fffdf6]',
    formButtonPrimary: 'rounded-xl bg-[#28695d] hover:bg-[#1c554a]',
    formFieldInput: 'rounded-xl border-[#d9d7c9] bg-[#fffdf6] text-[#243d39]',
    footerAction: 'text-[#687a72]',
    dividerLine: 'bg-[#d9d7c9]',
    alert: 'rounded-xl',
    otpCodeFieldInput: 'rounded-lg border-[#d9d7c9] text-[#243d39]',
    formFieldRow: 'gap-2',
    main: 'text-[#243d39]',
  },
};

const lessonApiIds: Record<string, LessonProgressInputLessonId> = {
  'ai-basics': 'what-is-ai',
  'clear-prompts': 'clear-instructions',
  'check-answers': 'check-the-answer',
  'privacy-safe-use': 'privacy-safe-use',
  'school-integrity': 'school-integrity',
  'responsible-use': 'responsible-use',
  'prompt-design': 'prompt-design',
  'plan-an-app': 'plan-an-app',
  'test-app': 'test-app',
  'iterate-app': 'iterate-app',
};
const cardIcons = [Sparkles, Lightbulb, BookOpen, LockKeyhole, ShieldCheck, Compass, Sparkles, BookOpen, CheckCircle2, ArrowRight];
const cardColors = ['hsl(201 89% 92%)', 'hsl(211 67% 94%)', 'hsl(198 85% 92%)', 'hsl(215 64% 94%)'];

function BrandHeader() {
  const { isSignedIn } = useUser();
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Learn Think Build home" data-testid="link-home">
        <span className="brand-mark"><Compass size={21} strokeWidth={2.2} /></span>
        <span className="brand-name">Learn Think Build</span>
      </Link>
      <nav className="primary-nav" aria-label="Main navigation">
        <a className="nav-tab" href={`${basePath}/#how-heading`}>How it works</a>
        <a className="nav-tab" href={`${basePath}/#curriculum`}>Learning path</a>
        <Link className="nav-tab" href="/testimonials">Testimonials</Link>
        <a className="nav-tab" href={`${basePath}/#price-heading`}>Pricing</a>
      </nav>
      <nav className="header-actions" aria-label="Account navigation">
        {isSignedIn
          ? <><Link href="/" className="header-cta" data-testid="link-home-signed-in">Home</Link><Link href="/family" className="header-cta solid" data-testid="link-family">Family account</Link></>
          : <><Link href="/sign-in" className="header-cta" data-testid="link-sign-in">Sign in</Link><Link href="/sign-up" className="header-cta solid" data-testid="link-sign-up">Get started</Link></>}
      </nav>
    </header>
  );
}

function Footer() {
  return <footer className="site-footer"><span><strong>Learn Think Build</strong> · Learn thoughtfully. Build responsibly.</span><span>For learners 10+ · An adult owns the account.</span></footer>;
}

function TestimonialsPage() {
  return <>
    <main className="page-content feedback-page testimonials-page">
      <Link href="/" className="back-link"><ArrowLeft size={15} /> Back to Learn Think Build</Link>
      <header className="feedback-hero">
        <div className="eyebrow">Family stories</div>
        <h1>Testimonials</h1>
        <p>We’ll share real experiences from families when they choose to provide a testimonial and give us permission to publish it.</p>
      </header>
      <section className="testimonial-empty" aria-label="Testimonials">
        <span className="testimonial-empty-icon"><ShieldCheck size={24} /></span>
        <div className="eyebrow">Real voices only</div>
        <h2>Parent testimonials are coming soon.</h2>
        <p>We don’t publish invented or placeholder reviews. Until families share their own stories, you can explore the learning path and how the at-home program works.</p>
        <div className="testimonial-actions">
          <a className="primary-button" href={`${basePath || ''}/#curriculum`}>Explore the learning path <ArrowRight size={16} /></a>
          <a className="secondary-button" href={`${basePath || ''}/#how-heading`}>How it works</a>
        </div>
      </section>
    </main>
    <Footer />
  </>;
}

function LandingPage() {
  return (
    <>
      <main className="page-content">
        <section className="landing-hero">
          <div className="landing-copy">
            <div className="eyebrow">A year of skills, not shortcuts</div>
            <h1>Learn AI.<br />Think clearly.<br /><em>Build something real.</em></h1>
            <p>A parent-guided AI learning path for ages 10+, designed for learning together at home. Start with the basics, learn when AI is—and isn’t—appropriate, then practice prompting, planning, and building toward a basic app by the end of year one.</p>
            <div className="landing-ctas">
              <Link href="/sign-up" className="primary-button" data-testid="link-start-family">Explore the family program <ArrowRight size={17} /></Link>
              <a href="#curriculum" className="secondary-button">See the year-one path</a>
            </div>
            <div className="landing-trust"><ShieldCheck size={17} /><span>Adults own the account. Learners use a display name and broad age range—no birth date or child email required.</span></div>
          </div>
          <div className="landing-art" aria-label="Illustrated Learn Think Build field notebook">
            <div className="art-paper" />
            <div className="landing-mascot"><Mascot mood="curious" size={158} /></div>
            <div className="art-board">
              <div className="art-board-top"><span>Year-one project / 01</span><Compass size={18} /></div>
              <h3>From first prompt<br /><span>to first app.</span></h3>
              <div className="art-sketch"><Sparkles size={22} /><span>Learn · Plan · Build · Check</span><Lightbulb size={22} /></div>
            </div>
            <div className="art-chip one">A year of guided practice</div>
            <div className="art-chip two">Safe, adult-led tool use</div>
          </div>
        </section>
        <div className="landing-band"><strong>AI is a tool. Your judgment leads.</strong><span>Learn what it can do, where it falls short, and when not to use it.</span></div>
        <section className="landing-section" aria-labelledby="how-heading">
          <div className="section-heading"><div><div className="eyebrow">A practical curriculum</div><h2 id="how-heading">Skills before tools. Safety throughout.</h2><p>Interactive lessons teach judgment, prompt writing, and responsible project habits.</p></div></div>
          <div className="feature-grid">
            <article className="feature-note"><div className="feature-number">THE SIX-STEP LESSON LOOP</div><h3>Warm up. Watch. Try. Think. Check.</h3><p>Each lesson moves through Warm-up, Hook, Watch & Listen, Try It, Think, and Check. Browser read-aloud includes pause, replay, speed, and a visible transcript. Hands-on practice and typed reflections lead into a three-question check with feedback and retry; 80% is the pass mark.</p></article>
            <article className="feature-note"><div className="feature-number">ACCOUNTABILITY WITHOUT PRESSURE</div><h3>Practice, review, and talk together.</h3><p>Lesson time and examples match the learner’s age band. Every lesson includes a safety note and a Talk it Over prompt for home. Guardians can review server-saved reflections and progress; activity drafts are not saved.</p></article>
          </div>
        </section>
        <section className="landing-section curriculum-section" id="curriculum" aria-labelledby="curriculum-heading">
          <div className="section-heading"><div><div className="eyebrow">Year one · beginner to builder</div><h2 id="curriculum-heading">A clear path to a basic app.</h2><p>Choose a learner path—Curious Starter (10–12), Thoughtful Explorer (13–15), or Independent Builder (16+). Core skills stay consistent while examples and depth change with age.</p></div></div>
          <div className="curriculum-grid">
            <article className="curriculum-card"><span>LEVEL 01 · ENGAGING WITH AI</span><h3>AI Foundations</h3><p>Patterns and predictions, how AI answers, made-up details, checking evidence, and keeping private information private.</p></article>
            <article className="curriculum-card"><span>LEVEL 02 · MANAGING AI</span><h3>Safe & Responsible Use</h3><p>Classroom honesty, bias, high-stakes questions, and when to pause and ask a trusted person.</p></article>
            <article className="curriculum-card"><span>LEVEL 03 · CREATING WITH AI</span><h3>Prompt Craft</h3><p>Shape a clear goal, safe context, format, and limits; revise carefully and verify the result.</p></article>
            <article className="curriculum-card"><span>LEVEL 04 · DESIGNING AI</span><h3>App Builder</h3><p>Plan a small app, test unusual cases, protect users, and explain each improvement.</p></article>
          </div>
          <p className="curriculum-note"><ShieldCheck size={17} /> AI examples are simulated; there is no live child chatbot. Every lesson has browser speech with captions, a hands-on activity, a typed reflection, a mixed quiz with retry, and a family conversation prompt. Lesson time and examples adapt to age. If something feels wrong, stop and talk to a trusted adult.</p>
        </section>
        <section className="landing-section home-family-section" aria-labelledby="family-learning-heading">
          <div className="home-family-panel"><div><div className="eyebrow">For parents & guardians</div><h2 id="family-learning-heading">A thoughtful first step into AI, at home.</h2><p>Explore AI together outside the classroom with guided lessons that build curiosity, sound judgment, and creative skills at a family-friendly pace.</p><ul><li>Age-based paths for learners 10+</li><li>Interactive demos for learning by trying</li><li>Parent-owned profiles with no child email or birth date</li></ul></div><div className="home-family-callout"><strong>Made for family learning</strong><span>One adult manages the account and learner profiles. Choose a path together, work through the lessons at your own pace, and keep real AI tools under adult supervision.</span></div></div>
        </section>
        <section className="landing-section" aria-labelledby="price-heading">
          <div className="section-heading"><div><div className="eyebrow">One monthly family plan</div><h2 id="price-heading">A full year of learning and making.</h2><p>One adult account manages billing and learner profiles.</p></div></div>
          <div className="price-panel">
            <div><div className="price-amount">$9.99 <small>USD / month</small></div><p>Planned monthly pricing for the guided curriculum and learner profiles. Family plan checkout is coming soon.</p></div>
          <div className="price-action"><Link className="primary-button" href="/sign-up" data-testid="button-pricing-signup">Create a guardian account <ArrowRight size={16} /></Link><span>Family plan checkout is coming soon.</span></div>
          </div>
        </section>
        <p className="footnote"><ShieldCheck size={16} /> Parent-owned account and billing. Learner profiles ask for a display name and broad age range only.</p>
      </main>
      <Footer />
    </>
  );
}

function SignInPage() {
  return <main className="auth-layout"><section className="auth-message"><div className="eyebrow">Welcome back</div><h1>Your next idea is waiting.</h1><p>Sign in as the parent or guardian who owns this Learn Think Build account. Learners enter through their profile in the family account.</p><Link href="/" className="back-link"><ArrowLeft size={15} /> Back to Learn Think Build</Link></section><div className="auth-card-wrap"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div></main>;
}

function SignUpPage() {
  return <main className="auth-layout"><section className="auth-message"><div className="eyebrow">For parents & guardians</div><h1>Make room for a year of learning.</h1><p>Create the adult-owned account first. The family plan is $9.99 per month, with checkout coming soon. Learners use a display name and broad age range; no birth date or child email is needed.</p><Link href="/" className="back-link"><ArrowLeft size={15} /> Back to Learn Think Build</Link></section><div className="auth-card-wrap"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div></main>;
}

function ClerkCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousId = useRef<string | null | undefined>(undefined);
  useEffect(() => addListener(({ user }) => {
    const nextId = user?.id ?? null;
    if (previousId.current !== undefined && previousId.current !== nextId) client.clear();
    previousId.current = nextId;
  }), [addListener, client]);
  return null;
}

function GuardianGate({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <main className="page-content auth-loading"><div className="skeleton" style={{ width: 180, margin: '0 auto 14px' }} /><p>Opening your family workshop…</p></main>;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <>{children}</>;
}

function StatusMessage({ title, message, retry }: { title: string; message: string; retry?: () => void }) {
  return <section className="error-card" role="alert"><h2>{title}</h2><p>{message}</p>{retry && <button type="button" className="secondary-button" onClick={retry} data-testid="button-retry">Try again</button>}</section>;
}

function FamilyLoading() {
  return <main className="page-content family-page"><div className="skeleton" style={{ width: 250, height: 35, margin: '20px 0' }} /><div className="family-grid"><div className="skeleton large" /><div className="skeleton large" /></div></main>;
}

function FamilyPage() {
  const { user } = useUser();
  const { data: family, isLoading, isError, refetch } = useGetFamily();
  if (isLoading) return <FamilyLoading />;
  if (isError || !family) return <main className="page-content family-page"><StatusMessage title="Your family page didn’t load." message="We couldn’t reach your family details just now. Your learner profiles and saved progress are still safe." retry={() => void refetch()} /></main>;
  return <FamilyDashboard family={family} parentName={user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Parent or guardian'} />;
}

function FamilyDashboard({ family, parentName }: { family: GuardianFamily; parentName: string }) {
  const client = useQueryClient();
  const [, setLocation] = useLocation();
  const { signOut } = useClerk();
  const createProfile = useCreateChildProfile();
  const deleteProfile = useDeleteChildProfile();
  const [adding, setAdding] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [ageBand, setAgeBand] = useState<AgeBand>('10-12');
  const [formError, setFormError] = useState('');
  const invalidateFamily = () => client.invalidateQueries({ queryKey: getGetFamilyQueryKey() });
  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = displayName.trim();
    if (!cleanName || cleanName.length > 40) { setFormError('Choose a display name between 1 and 40 characters.'); return; }
    setFormError('');
    createProfile.mutate({ data: { displayName: cleanName, ageBand } }, {
      onSuccess: () => { setDisplayName(''); setAgeBand('10-12'); setAdding(false); void invalidateFamily(); },
      onError: () => setFormError('That profile could not be created. Please try again.'),
    });
  };
  const removeProfile = (child: ChildProfile) => {
    if (!window.confirm(`Remove ${child.displayName} and their saved lesson progress?`)) return;
    deleteProfile.mutate({ childId: child.id }, {
      onSuccess: () => void invalidateFamily(),
      onError: () => setFormError('We could not remove that profile. Please try again.'),
    });
  };
  return (
    <>
      <main className="page-content family-page">
        <div className="family-welcome">
          <div><div className="eyebrow">The grown-up’s corner</div><h1>Your family workshop.</h1><p>Manage learner profiles and saved progress.</p></div>
          <div className="account-pill"><span className="initial-badge">{parentName.trim().charAt(0).toUpperCase()}</span><span>{parentName}</span><button className="signout-button" type="button" onClick={() => signOut({ redirectUrl: basePath || '/' })} data-testid="button-sign-out"><LogOut size={14} /> Sign out</button></div>
        </div>
        <div className="family-grid">
          <section className="family-panel subscription-panel" aria-labelledby="subscription-heading">
            <div className="panel-head"><h2 id="subscription-heading">Family plan</h2><span className="subscription-status" data-testid="status-subscription"><span className="status-dot" />Coming soon</span></div>
            <div className="subscription-price">$9.99 <small>USD / month</small></div>
            <p>Family plan checkout and billing management are paused while launch details are finalized.</p>
            <p className="plan-terms-note">Learner profiles, interactive lessons, and saved progress are available while checkout is coming soon.</p>
            <div className="subscription-actions"><button type="button" className="primary-button" disabled aria-disabled="true" data-testid="button-subscribe">Coming soon</button></div>
            <div className="family-note"><ShieldCheck size={18} /><span>An adult owns the account and family controls. Learner profiles store a display name and broad age range, not a birth date.</span></div>
          </section>
          <section className="family-panel" aria-labelledby="learners-heading">
            <div className="panel-head"><div><h2 id="learners-heading">Learner profiles</h2><p style={{ margin: '5px 0 0', color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>Display name and broad age range only—no birth date.</p></div><button type="button" className="secondary-button" onClick={() => { setAdding((value) => !value); setFormError(''); }} data-testid="button-add-profile"><UserRoundPlus size={15} /> Add learner</button></div>
            {family.children.length ? <div className="child-list">{family.children.map((child) => (
              <div className="child-list-item" key={child.id}>
              <div className="child-row" data-testid={`row-learner-${child.id}`}>
                <span className="child-avatar">{child.displayName.trim().charAt(0).toUpperCase()}</span>
                <div className="child-info"><strong>{child.displayName}</strong><span>{getAgeBand(child.ageBand)?.label ?? 'Learning path not selected'} · {child.completedLessonIds.length} lessons · {child.masteredLevelIds.length} of {learningLevels.length} levels graduated</span></div>
                <div className="child-actions">
                  <Link className="secondary-button" href={`/learn/${child.id}`} data-testid={`link-learner-${child.id}`}>{child.ageBand ? 'Open workshop' : 'Choose path'} <ArrowRight size={14} /></Link>
                  <button type="button" className="icon-button" aria-label={`Remove ${child.displayName}`} title="Remove learner profile" onClick={() => removeProfile(child)} disabled={deleteProfile.isPending} data-testid={`button-remove-${child.id}`}><Trash2 size={16} /></button>
                </div>
              </div>
              <FamilyProgressPanel child={child} onSaved={invalidateFamily} />
              </div>
            ))}</div> : <div className="empty-card"><UserRoundPlus size={25} /><h2>Your first explorer starts here.</h2><p>Add a display name to open a learner workshop.</p></div>}
            {adding && <form className="add-child-form" onSubmit={submitProfile} noValidate>
              <label htmlFor="learner-name">Learner display name</label>
              <input id="learner-name" name="displayName" autoComplete="off" maxLength={40} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="What should we call this explorer?" data-testid="input-learner-name" />
              <AgeBandPicker value={ageBand} onChange={setAgeBand} />
              <div className="form-actions"><span className="form-hint">No birth date, email, or exact age is collected.</span><button className="primary-button" type="submit" disabled={createProfile.isPending} data-testid="button-save-profile">{createProfile.isPending ? 'Saving…' : 'Create profile'} <ArrowRight size={15} /></button></div>
            </form>}
            {formError && <p role="alert" style={{ color: 'hsl(var(--destructive))', fontSize: 12 }} data-testid="status-profile-error">{formError}</p>}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function FamilyProgressPanel({ child, onSaved }: { child: ChildProfile; onSaved: () => void }) {
  const save = useUpdateChildLearningState();
  const markTalk = useMarkLessonTalkDiscussed();
  const state = child.learningState;
  const records = child.lessonRecords;
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyDone = records.filter((record) => new Date(record.completedAt ?? 0).getTime() >= weekStart).length;
  const timeMinutes = Math.round(records.reduce((total, record) => total + record.durationSeconds, 0) / 60);
  const scored = records.filter((record) => record.quizScore !== null);
  const average = scored.length ? Math.round(scored.reduce((sum, record) => sum + (record.quizScore ?? 0), 0) / scored.length) : null;
  const weak = scored.filter((record) => (record.quizScore ?? 100) < 80);
  const reflections = records.filter((record) => record.reflection?.trim());
  const openTalks = records.filter((record) => !record.talkDiscussedAt);
  const update = (next: typeof state) => save.mutate({ childId: child.id, data: next }, { onSuccess: onSaved });
  return <section className="family-learning-summary" aria-label={`${child.displayName} learning summary`}>
    <div className="summary-metrics">
      <span><strong>{records.length}</strong> lessons</span>
      <span><strong>{timeMinutes}</strong> minutes</span>
      <span><strong>{average === null ? '—' : `${average}%`}</strong> average check</span>
      <span><strong>{weeklyDone}/{state.weeklyGoal}</strong> this week</span>
    </div>
    <label className="weekly-goal-control">Weekly lesson goal
      <select value={state.weeklyGoal} onChange={(event) => update({ ...state, weeklyGoal: Number(event.target.value) })} disabled={save.isPending}>
        {[1, 2, 3, 4, 5, 6, 7].map((goal) => <option key={goal} value={goal}>{goal} {goal === 1 ? 'lesson' : 'lessons'}</option>)}
      </select>
    </label>
    <div className="family-summary-details">
      <div><strong>Topics to revisit</strong><p>{weak.length ? weak.map((record) => record.lessonId.replaceAll('-', ' ')).join(', ') : 'No missed topics to review yet.'}</p></div>
      <div><strong>Reflections to read</strong><p>{reflections.length ? reflections.map((record) => record.reflection).join(' · ') : 'No reflections saved yet.'}</p></div>
      <div><strong>Talk it Over</strong>{openTalks.length ? openTalks.map((record) => <p key={record.lessonId}>{record.lessonId.replaceAll('-', ' ')} <button className="text-action" type="button" onClick={() => markTalk.mutate({ childId: child.id, lessonId: record.lessonId }, { onSuccess: onSaved })} disabled={markTalk.isPending}>Mark discussed</button></p>) : <p>No conversation cards waiting.</p>}</div>
    </div>
    <div className="guardian-pledge">
      <div><strong>Family pledge · Level {Math.max(state.pledgeLevel, state.learnerAgreedLevel) + 1}</strong><span>Learner agreed through Level {state.learnerAgreedLevel}; guardian agreed through Level {state.pledgeLevel}.</span></div>
      {state.pledgeLevel < 4 && <button className="secondary-button" type="button" onClick={() => update({ ...state, pledgeLevel: Math.min(4, Math.max(state.pledgeLevel, state.learnerAgreedLevel) + 1) })} disabled={save.isPending}>Agree as guardian</button>}
    </div>
    {Object.entries(state.projects).map(([levelId, project]) => <div className="guardian-project" key={levelId}>
      <div><strong>{levelId.replaceAll('-', ' ')} project</strong><p>{project.content || 'Project plan submitted.'}</p><span>{project.approved ? 'Approved' : 'Waiting for guardian review'}</span></div>
      {!project.approved && <button className="secondary-button" type="button" onClick={() => update({ ...state, projects: { ...state.projects, [levelId]: { ...project, approved: true, reviewedAt: new Date().toISOString() } } })} disabled={save.isPending}>Approve project</button>}
    </div>)}
  </section>;
}

function FamilyDataGate({ childId, children }: { childId?: string; children: (family: GuardianFamily, child?: ChildProfile) => ReactNode }) {
  const { data: family, isLoading, isError, refetch } = useGetFamily();
  if (isLoading) return <main className="page-content"><div className="skeleton" style={{ height: 160 }} /><div className="skeleton large" style={{ marginTop: 20 }} /></main>;
  if (isError || !family) return <main className="page-content"><StatusMessage title="The workshop is taking a breather." message="We couldn’t load your family details. Your saved progress is safe." retry={() => void refetch()} /></main>;
  const child = childId ? family.children.find((item) => item.id === childId) : undefined;
  if (childId && !child) return <NotFound />;
  if (child && !child.ageBand) return <AgeBandSetup child={child} />;
  return <>{children(family, child)}</>;
}

function AgeBandSetup({ child }: { child: ChildProfile }) {
  const [ageBand, setAgeBand] = useState<AgeBand>('10-12');
  const update = useUpdateChildAgeBand();
  const client = useQueryClient();
  const [, setLocation] = useLocation();
  const savePath = () => update.mutate({ childId: child.id, data: { ageBand } }, {
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: getGetFamilyQueryKey() });
      setLocation(`/learn/${child.id}`);
    },
  });

  return <main className="page-content age-band-setup">
    <Link href="/family" className="back-link"><ArrowLeft size={15} /> Family account</Link>
    <section className="age-band-setup-card">
      <div className="eyebrow">A quick starting point</div>
      <h1>Choose {child.displayName}’s learning path.</h1>
      <p>This age-range recommendation helps us choose examples and explanations. It is self-reported guidance, not identity verification; no birth date is needed.</p>
      <AgeBandPicker value={ageBand} onChange={setAgeBand} />
      <button className="primary-button" type="button" onClick={savePath} disabled={update.isPending} data-testid="button-save-age-band">
        {update.isPending ? 'Saving path…' : `Start ${getAgeBand(ageBand)?.pathName ?? 'learning path'}`} <ArrowRight size={16} />
      </button>
      {update.isError && <p role="alert" data-testid="status-age-band-error">We couldn’t save this path. Please try again.</p>}
    </section>
  </main>;
}

function LearnerRoute() {
  const [, params] = useRoute('/learn/:childId');
  return <GuardianGate><FamilyDataGate childId={params?.childId}>{(_, child) => child ? <LearnerHub child={child} /> : <NotFound />}</FamilyDataGate></GuardianGate>;
}

function LearnerHub({ child }: { child: ChildProfile }) {
  const client = useQueryClient();
  const saveLearningState = useUpdateChildLearningState();
  const ageBand = child.ageBand ?? '10-12';
  const learningLessons = getLessonsForAgeBand(ageBand);
  const path = getAgeBand(ageBand);
  const completed = new Set(child.completedLessonIds);
  const mastered = new Set(child.masteredLevelIds);
  const graduatedCount = learningLevels.filter((level) => mastered.has(level.id)).length;
  const pledgeLevel = Math.min(learningLevels.length, graduatedCount + 1);
  const guardianAgreed = child.learningState.pledgeLevel >= pledgeLevel;
  const learnerAgreed = child.learningState.learnerAgreedLevel >= pledgeLevel;
  const agreeToPledge = () => saveLearningState.mutate({
    childId: child.id,
    data: { ...child.learningState, learnerAgreedLevel: pledgeLevel },
  }, { onSuccess: () => void client.invalidateQueries({ queryKey: getGetFamilyQueryKey() }) });
  return (
    <>
      <main className="page-content">
        <Link href="/family" className="back-link"><ArrowLeft size={15} /> Family account</Link>
        <section className="learn-header"><div className="learn-greeting"><span className="child-avatar">{child.displayName.trim().charAt(0).toUpperCase()}</span><div><div className="eyebrow">{path?.label} · {path?.pathName}</div><h1>Welcome, {child.displayName}.</h1><p>Pick a trail. There’s no rush to get anywhere.</p></div></div><Link href="/family" className="secondary-button">Family controls</Link></section>
        <aside className="pip-nudge"><Mascot mood="bright" size={94} /><div><span className="eyebrow">Pip’s field note</span><strong>Stay curious. Check the answer.</strong><p>AI can sound sure and still be wrong. Your judgment is part of every trail.</p></div></aside>
        <div className="learn-progress" data-testid="progress-summary"><strong>Level {graduatedCount} / {learningLevels.length}</strong><span>{graduatedCount === learningLevels.length ? 'Learn Think Build graduate' : 'mastery levels earned'}</span><div className="progress-track" role="progressbar" aria-valuenow={graduatedCount} aria-valuemin={0} aria-valuemax={learningLevels.length} aria-label="Mastery levels graduated"><div className="progress-fill" style={{ width: `${(graduatedCount / learningLevels.length) * 100}%` }} /></div><span>{child.completedLessonIds.length} of {learningLessons.length} lessons complete</span></div>
         {!learnerAgreed && <section className="pledge-card" aria-labelledby="pledge-heading">
           <div className="eyebrow">Level {pledgeLevel} responsible-use pledge</div><h2 id="pledge-heading">AI is a tool. I’ll keep my judgment in the lead.</h2>
           <p>I will protect private information, check important answers, follow the rules, and stop to ask a trusted adult if anything feels wrong.</p>
           {guardianAgreed ? <button className="primary-button" type="button" onClick={agreeToPledge} disabled={saveLearningState.isPending}>{saveLearningState.isPending ? 'Saving agreement…' : 'I agree with my guardian'} <Check size={16} /></button> : <p className="pledge-waiting">Ask your guardian to agree from Family controls before starting this level.</p>}
         </section>}
         <section className="levels-list" aria-labelledby="trails-heading"><div className="section-heading"><div><h2 id="trails-heading">Your learning path</h2><p>Learn it, show what you know, then unlock the next level.</p></div></div>{learningLevels.map((level, levelIndex) => {
           const hasPledge = child.learningState.pledgeLevel >= levelIndex + 1 && child.learningState.learnerAgreedLevel >= levelIndex + 1;
           const unlocked = (levelIndex === 0 || mastered.has(learningLevels[levelIndex - 1].id)) && hasPledge;
          const levelLessons = level.lessonIds.map((id) => learningLessons.find((lesson) => lesson.id === id)).filter((lesson): lesson is Lesson => Boolean(lesson));
          const levelComplete = level.lessonIds.every((id) => completed.has(lessonApiIds[id]));
          const graduated = mastered.has(level.id);
          return <section className={`level-section${unlocked ? '' : ' level-locked'}`} key={level.id} aria-labelledby={`level-${level.id}`}>
            <div className="level-heading"><div><div className="eyebrow">{unlocked ? `Level ${levelIndex + 1} of ${learningLevels.length}` : 'Locked until you graduate'}</div><h3 id={`level-${level.id}`}>{level.shortTitle}</h3><p>{level.description}</p></div><span className={`level-status${graduated ? ' is-graduated' : ''}`}>{graduated ? 'Graduated' : unlocked ? 'In progress' : 'Locked'}</span></div>
            {unlocked ? <><div className="lesson-list">{levelLessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} index={learningLessons.indexOf(lesson)} childId={child.id} completed={completed.has(lessonApiIds[lesson.id])} />)}</div>
              {graduated ? <div className="level-result"><CheckCircle2 size={18} /> Level assessment passed. Next level unlocked.</div> : levelComplete ? <Link href={`/learn/${child.id}/level/${level.id}/test`} className="primary-button level-test-link" data-testid={`link-assessment-${level.id}`}>Take the Level {levelIndex + 1} mastery check <ArrowRight size={16} /></Link> : <p className="level-hint">Complete every lesson in this level to unlock its mastery check. You need {passingScore}% to graduate.</p>}
            </> : <p className="level-hint"><LockKeyhole size={15} /> Pass the previous level’s mastery check to unlock these lessons.</p>}
          </section>;
        })}</section>
         {saveLearningState.isError && <p role="alert">We couldn’t save the pledge. Please try again.</p>}
         <p className="footnote"><ShieldCheck size={16} /> If a tool or question makes you uncomfortable, pause and talk to your trusted adult.</p>
      </main>
      <Footer />
    </>
  );
}

function LevelAssessmentRoute() {
  const [, params] = useRoute('/learn/:childId/level/:levelId/test');
  return <GuardianGate><FamilyDataGate childId={params?.childId}>{(_, child) => child ? <LevelAssessmentPage child={child} levelId={params?.levelId || ''} /> : <NotFound />}</FamilyDataGate></GuardianGate>;
}

function LevelAssessmentPage({ child, levelId }: { child: ChildProfile; levelId: string }) {
  const level = learningLevels.find((item) => item.id === levelId);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(5).fill(null));
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [error, setError] = useState('');
  const submit = useSubmitLevelAssessment();
  const client = useQueryClient();
  if (!level) return <NotFound />;
  const previous = learningLevels[learningLevels.findIndex((item) => item.id === level.id) - 1];
  const canTake = (!previous || child.masteredLevelIds.includes(previous.id)) &&
    level.lessonIds.every((id) => child.completedLessonIds.includes(lessonApiIds[id]));
  if (!canTake) return <main className="page-content not-found"><h1>Keep learning first.</h1><p>Complete the unlocked lessons and previous level before taking this mastery check.</p><Link className="primary-button" href={`/learn/${child.id}`}>Back to your path</Link></main>;
  const chooseAnswer = (questionIndex: number, answerIndex: number) => setAnswers((current) => current.map((answer, index) => index === questionIndex ? answerIndex : answer));
  const submitAssessment = () => {
    setError('');
    submit.mutate({ childId: child.id, data: { levelId: level.id as LearningLevelId, answers: answers as number[] } }, {
      onSuccess: (assessment) => {
        setResult({ score: assessment.score, passed: assessment.passed });
        void client.invalidateQueries({ queryKey: getGetFamilyQueryKey() });
      },
      onError: () => setError('We couldn’t submit your mastery check. Please try again.'),
    });
  };
  return <>
    <main className="page-content assessment-page">
      <Link href={`/learn/${child.id}`} className="back-link"><ArrowLeft size={15} /> Your learning path</Link>
      <header className="lesson-top"><div className="lesson-kicker">Show what you know · 5 questions</div><h1>{level.title}</h1><p>{level.objective}</p></header>
      <aside className="pip-nudge pip-assessment"><Mascot mood="thinking" size={82} /><div><span className="eyebrow">Pip’s reminder</span><strong>Take your time and trust your thinking.</strong><p>You can review the lessons and try again if you need another pass.</p></div></aside>
      {!result ? <section className="assessment-card">
        <p className="assessment-rule">Answer all five questions. Score {passingScore}% or higher to graduate and unlock the next level. If you don’t pass yet, review the lessons and try again.</p>
        {level.assessment.map((item, questionIndex) => <fieldset className="assessment-question" key={item.question}><legend>{questionIndex + 1}. {item.question}</legend><div className="answer-list">{item.options.map((option, optionIndex) => <button type="button" key={option} className={`answer-option${answers[questionIndex] === optionIndex ? ' is-correct' : ''}`} aria-pressed={answers[questionIndex] === optionIndex} onClick={() => chooseAnswer(questionIndex, optionIndex)}><span className="answer-letter">{String.fromCharCode(65 + optionIndex)}</span>{option}</button>)}</div></fieldset>)}
        {error && <p role="alert">{error}</p>}
        <div className="lesson-actions"><button type="button" className="primary-button" onClick={submitAssessment} disabled={answers.some((answer) => answer === null) || submit.isPending}>{submit.isPending ? 'Checking your answers…' : 'Submit mastery check'} <ArrowRight size={16} /></button></div>
      </section> : <section className={`assessment-result${result.passed ? ' passed' : ' retry'}`} data-testid="assessment-result">
        {result.passed ? <CheckCircle2 size={42} /> : <Lightbulb size={42} />}
        <div className="eyebrow">{result.passed ? 'Level unlocked' : 'Keep practicing'}</div>
        <h2>{result.passed ? 'You earned the next level.' : 'Not quite yet.'}</h2>
        <p>You scored <strong>{result.score}%</strong>. {result.passed ? 'Your progress is saved. The next level is now unlocked.' : `You need ${passingScore}%. Revisit the lessons, then take the check again.`}</p>
        <Link href={`/learn/${child.id}`} className="primary-button">{result.passed ? 'Continue your learning path' : 'Review lessons'} <ArrowRight size={16} /></Link>
      </section>}
    </main><Footer />
  </>;
}

function LessonCard({ lesson, index, childId, completed }: { lesson: Lesson; index: number; childId: string; completed: boolean }) {
  const Icon = cardIcons[index % cardIcons.length];
  return <Link href={`/learn/${childId}/lesson/${lesson.id}`} className="lesson-card" data-testid={`link-lesson-${lesson.id}`}><span className="lesson-icon" style={{ background: cardColors[index % cardColors.length] }}><Icon size={23} strokeWidth={1.8} /></span><span className="lesson-card-body"><span className="lesson-meta"><span>{lesson.topic}</span>{completed && <span className="done-mark" aria-label="Completed"><Check size={14} /></span>}</span><span className="lesson-card-title"><h3>{lesson.title}</h3></span><span className="lesson-card-desc"><p>{lesson.summary}</p></span><span className="lesson-card-foot"><span>{completed ? 'Revisit lesson' : 'Start exploring'} <span aria-hidden="true">·</span> {lesson.durationMinutes} min</span><ArrowRight size={17} /></span></span></Link>;
}

function LessonRoute() {
  const [, params] = useRoute('/learn/:childId/lesson/:id');
  return <GuardianGate><FamilyDataGate childId={params?.childId}>{(_, child) => child ? <LessonPage child={child} lessonId={params?.id || ''} /> : <NotFound />}</FamilyDataGate></GuardianGate>;
}

function LessonPage({ child, lessonId }: { child: ChildProfile; lessonId: string }) {
  const ageBand = child.ageBand ?? '10-12';
  const learningLessons = getLessonsForAgeBand(ageBand);
  const lesson = learningLessons.find((item) => item.id === lessonId);
  const client = useQueryClient();
  const complete = useCompleteChildLesson();
  const [stage, setStage] = useState(0);
  const [warmUpAnswers, setWarmUpAnswers] = useState<(number | null)[]>([null, null]);
  const [activityText, setActivityText] = useState('');
  const [reflection, setReflection] = useState('');
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [speechPlaying, setSpeechPlaying] = useState(false);
  const [speechPaused, setSpeechPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [speechCharIndex, setSpeechCharIndex] = useState<number | null>(null);
  const [watchCompleted, setWatchCompleted] = useState(false);
  const startedAt = useRef(Date.now());
  useEffect(() => () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);
  if (!lesson) return <NotFound />;
  const levelIndex = learningLevels.findIndex((level) => level.lessonIds.includes(lesson.id));
  const level = learningLevels[levelIndex];
  const lessonIndex = level?.lessonIds.indexOf(lesson.id) ?? -1;
  const previousLevel = levelIndex > 0 ? learningLevels[levelIndex - 1] : undefined;
  const hasLevelPledge = Boolean(level) &&
    child.learningState.pledgeLevel >= levelIndex + 1 &&
    child.learningState.learnerAgreedLevel >= levelIndex + 1;
  const lessonUnlocked = Boolean(level) && hasLevelPledge &&
    (!previousLevel || child.masteredLevelIds.includes(previousLevel.id)) &&
    level!.lessonIds.slice(0, lessonIndex).every((id) =>
      child.completedLessonIds.includes(lessonApiIds[id]),
    );
  if (!lessonUnlocked) {
    return <main className="page-content not-found"><div className="eyebrow" style={{ justifyContent: 'center' }}>Level locked</div><h1>Show what you know to continue.</h1><p>Finish the earlier lessons and pass the level mastery check to unlock this trail.</p><Link className="primary-button" href={`/learn/${child.id}`}>Back to your learning path <ArrowRight size={16} /></Link></main>;
  }
  const alreadyCompleted = child.completedLessonIds.includes(lessonApiIds[lesson.id]);
  const lessonPosition = learningLessons.findIndex((item) => item.id === lesson.id);
  const warmUpQuestions = learningLessons
    .slice(0, lessonPosition)
    .filter((item) => child.completedLessonIds.includes(lessonApiIds[item.id]))
    .flatMap((item) => item.steps.map((question) => ({ ...question, source: item.title })))
    .slice(-2);
  const stepNames = ['Warm-up', 'Hook', 'Watch & Listen', 'Try It', 'Think', 'Check'];
  const score = quizAnswers.filter((answer, index) => answer === lesson.steps[index]?.correctIndex).length;
  const scorePercent = Math.round((score / lesson.steps.length) * 100);
  const speechText = `${lesson.introduction} ${lesson.steps.map((item) => `${item.heading}. ${item.explanation}. ${item.question}. ${item.options.join('. ')}. ${item.feedback}`).join(' ')} ${lesson.reflectionPrompt} ${lesson.activity.instruction} ${lesson.familyPrompt}`;
  const quizSpeechText = lesson.steps.map((item, index) => `Question ${index + 1}. ${item.question}. Choices: ${item.options.join('. ')}. ${item.feedback}`).join(' ');
  const startSpeech = (text = speechText) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.onstart = () => { setSpeechPlaying(true); setSpeechPaused(false); };
    utterance.onboundary = (event) => setSpeechCharIndex(event.charIndex);
    utterance.onend = () => { setSpeechPlaying(false); setSpeechPaused(false); setSpeechCharIndex(null); setWatchCompleted(true); };
    utterance.onerror = () => { setSpeechPlaying(false); setSpeechPaused(false); };
    window.speechSynthesis.speak(utterance);
  };
  const pauseSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setSpeechPaused(false);
    } else {
      window.speechSynthesis.pause();
      setSpeechPaused(true);
    }
  };
  const completeLesson = () => {
    if (scorePercent < passingScore || !activityText.trim() || !reflection.trim() || !watchCompleted) return;
    setSaveError('');
    complete.mutate({ childId: child.id, data: {
      lessonId: lessonApiIds[lesson.id],
      reflection: reflection.trim(),
      durationSeconds: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
      quizScore: scorePercent,
      activityCompleted: true,
      watchCompleted: true,
    } }, {
      onSuccess: () => { void client.invalidateQueries({ queryKey: getGetFamilyQueryKey() }); setFinished(true); },
      onError: () => setSaveError('We couldn’t save this trail yet. Your answers are here—try saving again.'),
    });
  };
  const chooseAnswer = (questionIndex: number, answerIndex: number) => setQuizAnswers((current) => {
    const next = [...current];
    while (next.length < lesson.steps.length) next.push(null);
    next[questionIndex] = answerIndex;
    return next;
  });
  const restartLesson = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setStage(0); setActivityText(''); setReflection(''); setQuizAnswers([]);
    setQuizSubmitted(false); setWatchCompleted(false); setFinished(false); setSaveError('');
    startedAt.current = Date.now();
  };
  return (
    <>
      <main className="page-content lesson-page">
        <Link href={`/learn/${child.id}`} className="back-link" data-testid="link-back-lessons"><ArrowLeft size={16} /> All trails</Link>
        <header className="lesson-top"><div className="lesson-kicker">{pathLabel(ageBand)} · {lesson.topic} · Trail {learningLessons.findIndex((item) => item.id === lesson.id) + 1} of {learningLessons.length}</div><h1>{lesson.title}</h1><p>{lesson.summary}</p><div className="lesson-meta-row"><span><Clock3 size={13} style={{ verticalAlign: '-2px' }} /> About {lesson.durationMinutes} minutes</span><span><BookOpen size={13} style={{ verticalAlign: '-2px' }} /> Six-step lesson</span></div></header>
        {!finished ? <>
          <nav className="lesson-step-nav" aria-label="Lesson steps">{stepNames.map((name, index) => <button key={name} type="button" className={stage === index ? 'is-current' : stage > index ? 'is-done' : ''} onClick={() => { if (index <= stage) setStage(index); }} aria-current={stage === index ? 'step' : undefined}><span>{index + 1}</span>{name}</button>)}</nav>
          <div className="lesson-progress" role="progressbar" aria-valuenow={stage + 1} aria-valuemin={0} aria-valuemax={6} aria-label="Lesson step progress"><div style={{ width: `${((stage + 1) / 6) * 100}%` }} /></div>
          <section className="step-card" key={`${lesson.id}-${stage}`} aria-labelledby="step-heading" data-testid={`lesson-step-${stage + 1}`}>
            <div className="step-label">Step {String(stage + 1).padStart(2, '0')} / 06 · {stepNames[stage]}</div>
            {stage === 0 && <><h2 id="step-heading">Warm up your memory</h2>{warmUpQuestions.length ? <><p className="step-explanation">Two quick questions from earlier lessons help bring those ideas back. Choose your best answer; this is practice, not a grade.</p>{warmUpQuestions.map((question, questionIndex) => <fieldset className="assessment-question" key={`${question.source}-${question.question}`}><legend>{questionIndex + 1}. {question.question} <span className="warm-up-source">From {question.source}</span></legend><div className="answer-list">{question.options.map((option, optionIndex) => <button type="button" key={option} className={`answer-option${warmUpAnswers[questionIndex] === optionIndex ? ' is-correct' : ''}`} aria-pressed={warmUpAnswers[questionIndex] === optionIndex} onClick={() => setWarmUpAnswers((current) => current.map((answer, index) => index === questionIndex ? optionIndex : answer))}><span className="answer-letter">{String.fromCharCode(65 + optionIndex)}</span>{option}</button>)}</div></fieldset>)}</> : <p className="step-explanation">This is your first lesson, so there is nothing to review yet. Let’s start with a new idea.</p>}</>}
            {stage === 1 && <><h2 id="step-heading">A question worth exploring</h2><p className="step-explanation">{lesson.introduction}</p><div className="pip-feedback"><Mascot mood="curious" size={66} /><span>Stay curious. AI can be useful, but your judgment stays in the lead.</span></div></>}
            {stage === 2 && <><h2 id="step-heading">Watch & listen</h2><p className="step-explanation">Explore the visual, then listen or read along. Speech uses your browser; no audio is sent to a server.</p><LessonVisualDemo kind={lesson.demoKind} ageBand={lesson.ageBand} />
              <div className="speech-controls" aria-label="Browser speech controls"><button className="secondary-button" type="button" onClick={() => startSpeech()} disabled={!('speechSynthesis' in window)}><Play size={15} /> Read aloud</button><button className="secondary-button" type="button" onClick={pauseSpeech} disabled={!speechPlaying}><Pause size={15} /> {speechPaused ? 'Resume' : 'Pause'}</button><button className="secondary-button" type="button" onClick={() => startSpeech()} disabled={!('speechSynthesis' in window)}><RotateCcw size={15} /> Replay</button><label>Speed <select value={speechRate} onChange={(event) => setSpeechRate(Number(event.target.value))}><option value={0.8}>0.8×</option><option value={1}>1×</option><option value={1.2}>1.2×</option></select></label></div>
               <details className="lesson-transcript" open><summary><Volume2 size={15} /> Captions & transcript</summary><p>{renderSpeechText(speechText, speechCharIndex)}</p></details><button type="button" className="secondary-button" onClick={() => setWatchCompleted(true)}>{watchCompleted ? 'Transcript completed' : 'I finished reading the transcript'} <Check size={15} /></button>
            </>}
            {stage === 3 && <><h2 id="step-heading">{lesson.activity.title}</h2><p className="step-explanation">{lesson.activity.instruction}</p><label className="lesson-field-label" htmlFor="activity-draft">Your activity notes</label><textarea id="activity-draft" rows={4} maxLength={400} value={activityText} onChange={(event) => setActivityText(event.target.value)} placeholder={lesson.activity.placeholder} /><p className="not-saved-note">This activity draft stays in this browser session. Only activity completion is recorded with the lesson.</p></>}
            {stage === 4 && <><h2 id="step-heading">Think it through</h2><p className="step-explanation">{lesson.reflectionPrompt}</p>{lesson.sentenceStarters && <div className="sentence-starters" aria-label="Sentence starters">{lesson.sentenceStarters.map((starter) => <button type="button" key={starter} className="secondary-button" onClick={() => setReflection((current) => `${current}${current ? ' ' : ''}${starter}`)}>{starter}</button>)}</div>}<label className="lesson-field-label" htmlFor="lesson-reflection">Your reflection <span>{reflection.length}/280</span></label><textarea id="lesson-reflection" rows={3} maxLength={280} value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder={ageBand === '10-12' ? 'A few words is enough…' : 'Write a short reflection…'} /><p className="not-saved-note">Your reflection is saved to the family account when you complete this lesson.</p></>}
            {stage === 5 && <><h2 id="step-heading">Check what stuck</h2><p className="step-explanation">Three questions. Choose an answer for each, get feedback, and retry if you need another go. You need {passingScore}% to pass.</p><button type="button" className="secondary-button" onClick={() => startSpeech(quizSpeechText)} disabled={!('speechSynthesis' in window)}><Volume2 size={15} /> Read questions and choices to me</button><div className="lesson-quiz">{lesson.steps.map((question, questionIndex) => {
              const answer = quizAnswers[questionIndex];
              const correct = answer === question.correctIndex;
              return <fieldset className="lesson-quiz-question" key={question.heading}><legend>{questionIndex + 1}. {question.question}</legend><div className="answer-list">{question.options.map((option, optionIndex) => <button key={option} type="button" className={`answer-option${quizSubmitted && answer === optionIndex && correct ? ' is-correct' : ''}${quizSubmitted && answer === optionIndex && !correct ? ' is-wrong' : ''}`} onClick={() => { chooseAnswer(questionIndex, optionIndex); setQuizSubmitted(false); }} aria-pressed={answer === optionIndex}><span className="answer-letter">{String.fromCharCode(65 + optionIndex)}</span>{option}</button>)}</div>{quizSubmitted && <div className={`feedback ${correct ? 'correct' : 'try-again'}`} role="status"><span><strong>{correct ? 'Good thinking.' : 'Try this one again.'}</strong>{correct ? question.feedback : 'Review the lesson and choose a different answer.'}</span></div>}</fieldset>;
            })}</div>{!quizSubmitted ? <button type="button" className="secondary-button" onClick={() => setQuizSubmitted(true)} disabled={quizAnswers.length < lesson.steps.length || quizAnswers.some((answer) => answer === null)}>Check answers</button> : <div className={`quiz-result ${scorePercent >= passingScore ? 'passed' : 'retry'}`} role="status"><strong>{scorePercent}% · {scorePercent >= passingScore ? 'Pass mark reached' : 'Not there yet'}</strong><span>{scorePercent >= passingScore ? 'You can complete the lesson.' : `You need ${passingScore}%. Review the feedback, then retry.`}</span>{scorePercent < passingScore && <button type="button" className="secondary-button" onClick={() => { setQuizAnswers([]); setQuizSubmitted(false); }}>Retry quiz</button>}</div>}
              {saveError && <p role="alert" className="save-error" data-testid="status-save-error">{saveError}</p>}<div className="lesson-family-prompt"><div className="eyebrow">Talk it Over</div><p>{lesson.familyPrompt}</p><span>Take this question to a trusted adult or family member. This conversation is not recorded.</span></div>
            </>}
            {stage < 5 && <div className="lesson-step-actions">{stage > 0 && <button className="secondary-button" type="button" onClick={() => setStage((current) => Math.max(0, current - 1))}>Back</button>}<button className="primary-button" type="button" onClick={() => setStage((current) => Math.min(5, current + 1))} disabled={(stage === 0 && warmUpQuestions.some((_, index) => warmUpAnswers[index] === null)) || (stage === 2 && !watchCompleted) || (stage === 3 && !activityText.trim()) || (stage === 4 && !reflection.trim())}>{stage === 0 && warmUpQuestions.some((_, index) => warmUpAnswers[index] === null) ? 'Answer the quick review first' : stage === 2 && !watchCompleted ? 'Listen or read the transcript first' : stage === 3 && !activityText.trim() ? 'Add activity notes to continue' : stage === 4 && !reflection.trim() ? 'Write a short reflection to continue' : 'Continue'} <ArrowRight size={17} /></button></div>}
            {stage === 5 && quizSubmitted && scorePercent >= passingScore && <div className="lesson-actions"><button className="primary-button" type="button" onClick={completeLesson} disabled={complete.isPending || !activityText.trim() || !reflection.trim() || !watchCompleted}>{complete.isPending ? 'Saving your lesson…' : 'Save completed lesson'} <ArrowRight size={17} /></button></div>}
          </section><aside className="safety-note"><ShieldCheck size={19} /><span><strong>A note for every lesson</strong>{lesson.safetyNote}</span></aside>
        </> : <section className="complete-panel" data-testid="lesson-completion"><div className="complete-seal"><CheckCircle2 size={39} /></div><div className="step-label">{alreadyCompleted ? 'Trail revisited' : 'Trail complete'}</div><h2>{alreadyCompleted ? 'Good to see you again.' : 'A new idea, in your kit.'}</h2><p>{alreadyCompleted ? 'You explored this lesson again. Keep the questions handy as you explore.' : `This trail is now saved to ${child.displayName}’s progress. Keep checking, keep asking, and remember: AI is a tool—not a substitute for your thinking.`}</p><div className="complete-actions"><button type="button" className="secondary-button" onClick={restartLesson} data-testid="button-revisit-lesson"><RotateCcw size={15} /> Revisit this trail</button><Link href={`/learn/${child.id}`} className="primary-button" data-testid="link-finish-home">Back to all trails <ArrowRight size={16} /></Link><Link href="/family" className="secondary-button" data-testid="link-finish-family">Family account</Link></div></section>}
      </main>
      <Footer />
    </>
  );
}

function pathLabel(ageBand: AgeBand) {
  return ageBand === '10-12' ? 'Curious Starter' : ageBand === '13-15' ? 'Thoughtful Explorer' : 'Independent Builder';
}

function renderSpeechText(text: string, activeIndex: number | null) {
  let offset = 0;
  return text.split(/(\s+)/).map((part, index) => {
    const start = offset;
    offset += part.length;
    if (!part.trim()) return part;
    const active = activeIndex !== null && activeIndex >= start && activeIndex < offset;
    return <span className={active ? 'speech-word is-speaking' : 'speech-word'} key={`${start}-${index}`}>{part}</span>;
  });
}

function NotFound() {
  return <main className="not-found"><div className="eyebrow" style={{ justifyContent: 'center' }}>Trail not found</div><h1>That path is still a mystery.</h1><p>Head back to your family account and choose an available trail.</p><Link className="primary-button" href="/family" data-testid="link-not-found-home">Family account <ArrowRight size={16} /></Link></main>;
}

function RouterContent() {
  return <><ClerkCacheInvalidator /><BrandHeader /><Switch>
    <Route path="/" component={LandingPage} />
    <Route path="/testimonials" component={TestimonialsPage} />
    <Route path="/sample-feedback" component={() => <Redirect to="/testimonials" />} />
    <Route path="/sign-in/*?" component={SignInPage} />
    <Route path="/sign-up/*?" component={SignUpPage} />
    <Route path="/family" component={() => <GuardianGate><FamilyPage /></GuardianGate>} />
    <Route path="/learn/:childId/lesson/:id" component={LessonRoute} />
    <Route path="/learn/:childId/level/:levelId/test" component={LevelAssessmentRoute} />
    <Route path="/learn/:childId" component={LearnerRoute} />
    <Route component={NotFound} />
  </Switch></>;
}

function ClerkApp() {
  const [, setLocation] = useLocation();
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to your family workshop' } }, signUp: { start: { title: 'Create your family account', subtitle: 'For parents and guardians' } } }} routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace: true })}><QueryClientProvider client={queryClient}><RouterContent /></QueryClientProvider></ClerkProvider>;
}

function App() {
  return <WouterRouter base={basePath}><ClerkApp /></WouterRouter>;
}

export default App;
