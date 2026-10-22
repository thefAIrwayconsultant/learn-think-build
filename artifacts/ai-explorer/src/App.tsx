import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Clock3, Compass, Lightbulb, LockKeyhole, LogOut, Pause, Play, RotateCcw, ShieldCheck, Sparkles, Trash2, UserRoundPlus, Volume2 } from 'lucide-react';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation, useRoute } from 'wouter';
import { getGetFamilyQueryKey, useCreateChildProfile, useDeleteChildProfile, useGetFamily, useMarkLessonTalkDiscussed, useUpdateChildAgeBand, useUpdateChildLearningState } from '@workspace/api-client-react';
import type { ChildProfile, GuardianFamily } from '@workspace/api-client-react';
import { getLessonsForAgeBand, levels, normalizeLessonId, type Lesson } from '@workspace/curriculum';
import { LessonFlow } from './learn/LessonFlow';
import { DailyLearningGate } from './learn/DailyLearningGate';
import { MasteryFlow } from './learn/MasteryFlow';
import { LearnerHub } from './learn/Hub';
import { ReviewFlow } from './learn/ReviewFlow';
import { GuardianPanel } from './family/GuardianPanel';
import { FamilyLeaderboard } from './family/FamilyLeaderboard';
import { Mascot } from './Mascot';
import { AgeBandPicker } from './AgeBandPicker';
import { getAgeBand, type AgeBand } from './audience';
import { FAMILY_MONTHLY_PRICE } from './pricing';
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
    logoPlacement: 'none' as const,
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
    rootBox: 'ltb-auth-root w-full min-w-0 flex justify-center',
    cardBox: 'ltb-auth-card w-full max-w-full min-w-0',
    card: 'ltb-auth-inner !shadow-none !border-0 !bg-transparent !rounded-none',
    footer: 'ltb-auth-footer !shadow-none !rounded-none',
    headerTitle: 'text-[#102b4e] font-bold',
    headerSubtitle: 'text-[#536b82]',
    socialButtonsBlockButtonText: 'text-[#102b4e] font-bold',
    formFieldLabel: 'text-[#102b4e] font-bold',
    footerActionLink: 'ltb-auth-footer-link text-[#0f6fb8] font-bold',
    footerActionText: 'ltb-auth-footer-text text-[#536b82]',
    dividerText: 'text-[#536b82]',
    identityPreviewEditButton: 'text-[#1687d9]',
    formFieldSuccessText: 'text-[#1687d9]',
    alertText: 'text-[#773a31]',
    logoBox: 'rounded-xl overflow-hidden',
    logoImage: 'object-contain',
    socialButtonsBlockButton: 'ltb-auth-social rounded-xl border-[#c9d9e8] bg-white',
    formButtonPrimary: 'ltb-auth-submit rounded-xl',
    formFieldInput: 'ltb-auth-input rounded-xl border-[#c9d9e8] bg-white text-[#102b4e]',
    footerAction: 'ltb-auth-footer-action text-[#536b82]',
    dividerLine: 'bg-[#dbe8f3]',
    alert: 'ltb-auth-error rounded-xl',
    otpCodeFieldInput: 'ltb-auth-otp rounded-lg border-[#c9d9e8] text-[#102b4e]',
    formFieldRow: 'gap-2 min-w-0',
    main: 'text-[#102b4e]',
  },
};

const learningLevels = levels.map((level) => ({ ...level, shortTitle: level.title, objective: level.description }));
const cardIcons = [Sparkles, Lightbulb, BookOpen, LockKeyhole, ShieldCheck, Compass, Sparkles, BookOpen, CheckCircle2, ArrowRight];
const cardColors = ['hsl(201 89% 92%)', 'hsl(211 67% 94%)', 'hsl(198 85% 92%)', 'hsl(215 64% 94%)'];

function BrandHeader() {
  const { isSignedIn } = useUser();
  const [location] = useLocation();
  const isAuthRoute = location.startsWith('/sign-in') || location.startsWith('/sign-up');
  const isSignInRoute = location.startsWith('/sign-in');
  return (
    <header className={`site-header${isAuthRoute ? ' auth-site-header' : ''}`}>
      <Link href="/" className="brand" aria-label="Learn Think Build home" data-testid="link-home">
        <span className="brand-mark"><Compass size={21} strokeWidth={2.2} /></span>
        <span className="brand-name">Learn Think Build</span>
      </Link>
      {!isAuthRoute && <nav className="primary-nav" aria-label="Main navigation">
        <a className="nav-tab" href={`${basePath}/#how-heading`}>How it works</a>
        <a className="nav-tab" href={`${basePath}/#curriculum`}>Learning path</a>
        <Link className="nav-tab" href="/testimonials">Testimonials</Link>
        <a className="nav-tab" href={`${basePath}/#price-heading`}>Pricing</a>
      </nav>}
      <nav className="header-actions" aria-label="Account navigation">
        {isSignedIn
          ? <><Link href="/" className="header-cta" data-testid="link-home-signed-in">Home</Link><Link href="/family" className="header-cta solid" data-testid="link-family">Family account</Link></>
          : isAuthRoute
            ? isSignInRoute
              ? <Link href="/sign-up" className="header-cta solid" data-testid="link-sign-up">Create account</Link>
              : <Link href="/sign-in" className="header-cta" data-testid="link-sign-in">Sign in</Link>
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
        <div className="eyebrow">Testimonials</div>
        <h1>What families think about Learn Think Build.</h1>
        <p>We only publish real family feedback, with permission.</p>
      </header>
      <section className="feedback-grid" aria-label="Parent testimonials">
        <article className="feedback-card">
          <span className="feedback-role">Honest feedback only</span>
          <h2>We are listening to families.</h2>
          <p>There are no parent reviews to share yet. When families choose to provide feedback, we will publish their real words only with their permission.</p>
        </article>
      </section>
      <section className="feedback-cta" aria-label="Explore Learn Think Build">
        <div><h2>See what your family could build.</h2><p>Explore four chapters of safe, hands-on AI learning.</p></div>
        <a className="primary-button" href={`${basePath || ''}/#curriculum`}>Explore the learning path <ArrowRight size={16} /></a>
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
          <div className="eyebrow">A safe AI adventure for curious kids 10+</div>
          <h1>How does AI work?<br />Let’s find out.<br /><em>Then make something.</em></h1>
          <p>Explore the surprising ways AI spots patterns, creates pictures, predicts words, and helps build ideas. Short, hands-on missions turn curiosity into real skills, one small step at a time. A parent or guardian guides the journey; every AI demonstration is simulated, so learners can experiment safely without a live chatbot.</p>
            <div className="landing-ctas">
              <Link href="/sign-up" className="primary-button" data-testid="link-start-family">Start exploring <ArrowRight size={17} /></Link>
              <a href="#curriculum" className="secondary-button">Explore the AI chapters</a>
            </div>
            <div className="landing-trust"><ShieldCheck size={17} /><span>Adults own the account. Learners use a display name and broad age range—no birth date or child email required.</span></div>
          </div>
          <div className="landing-art" aria-label="Illustrated Learn Think Build field notebook">
            <div className="art-paper" />
            <div className="landing-mascot"><Mascot mood="curious" size={158} /></div>
            <div className="art-board">
              <div className="art-board-top"><span>Mission 01 · Start here</span><Compass size={18} /></div>
              <h3>Ask a big question.<br /><span>Try a tiny experiment.</span></h3>
              <div className="art-sketch"><Sparkles size={22} /><span>Learn · Try · Improve · Build</span><Lightbulb size={22} /></div>
            </div>
            <div className="art-chip one">One skill at a time</div>
            <div className="art-chip two">10 minutes · one cool idea</div>
          </div>
        </section>
        <div className="landing-band"><strong>Big curiosity. Small daily missions.</strong><span>Explore what AI can do, where it gets things wrong, and what you can create with a little imagination.</span></div>
        <section className="landing-section" aria-labelledby="how-heading">
          <div className="section-heading"><div><div className="eyebrow">One 10-minute mission a day · No streak pressure</div><h2 id="how-heading">A little exploring adds up.</h2><p>Each day brings one short, age-adjusted adventure. A 10-minute daily learning limit helps keep screen time intentional; progress waits safely until the next day.</p></div></div>
          <div className="feature-grid">
            <article className="feature-note"><div className="feature-number">THE SIX-STEP LESSON</div><h3>Warm-up, Hook, Watch, Try, Think, Check.</h3><p>Every lesson follows the same six steps. A warm-up recalls earlier lessons, a hook asks for a prediction, narrated scenes with captions teach one skill, a hands-on activity lets learners try it, a written reflection puts it in their own words, and a five-question check needs 80% to save. Missed questions come with an explanation and a retry on fresh questions.</p></article>
            <article className="feature-note"><div className="feature-number">EARNED, NOT RUSHED</div><h3>Explore 20 daily missions in each chapter.</h3><p>Each chapter takes about a month at 10 minutes a day. Complete the missions, earn 80% on a fresh-question mastery check, and make a small project that a parent or guardian reviews. Weekly mixed review, personal bests, and badges celebrate learning without streak pressure.</p></article>
          </div>
        </section>
        <section className="landing-section curriculum-section" id="curriculum" aria-labelledby="curriculum-heading">
          <div className="section-heading"><div><div className="eyebrow">Four chapters · 20 daily missions each</div><h2 id="curriculum-heading">Meet the magic. Learn what is really happening.</h2><p>Choose an age path—Curious Starter (10–12), Thoughtful Explorer (13–15), or Independent Builder (16+). Every learner explores the same core ideas through examples and explanations shaped for their age.</p></div></div>
          <div className="curriculum-grid">
            <article className="curriculum-card"><span>CHAPTER 01 · ABOUT A MONTH</span><h3>Meet the AIs</h3><p>Explore chatbots, picture makers, recommendations, voice and vision tools, game AI, and robots. Follow the data and patterns behind each kind.</p></article>
            <article className="curriculum-card"><span>CHAPTER 02 · ABOUT A MONTH</span><h3>Prompting Power</h3><p>Turn fuzzy ideas into clearer prompts with goals, context, formats, limits, examples, role prompts, and follow-up experiments.</p></article>
            <article className="curriculum-card"><span>CHAPTER 03 · ABOUT A MONTH</span><h3>When to Use AI (and When Not To)</h3><p>Explore playful low-risk uses while protecting privacy, school learning, original thinking, real relationships, and big decisions.</p></article>
            <article className="curriculum-card"><span>CHAPTER 04 · ABOUT A MONTH</span><h3>When to Trust AI (and When Not To)</h3><p>Become a claim-checking detective: investigate mistakes, sources, bias, fake media, scams, pressure, and when to ask a trusted adult.</p></article>
          </div>
          <p className="curriculum-note"><ShieldCheck size={17} /> Every 10-minute lesson has a warm-up, prediction, narrated and captioned scenes, an interactive demonstration, a reflection, and a server-graded check. Learners finish a chapter project and mastery check; guardians review projects. All AI examples are simulated. If something feels wrong, stop and talk to a trusted adult.</p>
        </section>
        <section className="landing-section home-family-section" aria-labelledby="family-learning-heading">
          <div className="home-family-panel"><div><div className="eyebrow">For parents & guardians</div><h2 id="family-learning-heading">A safe place for big questions.</h2><p>Give kids a fun, hands-on way to explore AI beyond school. They practice making things, asking better questions, and knowing when a person should lead.</p><ul><li>Age-based adventures for learners 10+</li><li>One 10-minute learning window per day, with no streak pressure</li><li>Parent-owned profiles with no child email or birth date</li></ul></div><div className="home-family-callout"><strong>Parent-guided from the start</strong><span>One adult manages the family account and reviews progress. Kids explore a simulated AI world—not a live chatbot—and build confidence one careful step at a time.</span></div></div>
        </section>
        <section className="landing-section" aria-labelledby="price-heading">
          <div className="section-heading"><div><div className="eyebrow">One monthly family plan</div><h2 id="price-heading">An AI jumpstart for {FAMILY_MONTHLY_PRICE} a month.</h2><p>Age-appropriate learning today. Practical foundations for tomorrow. One parent or guardian owns the family account.</p></div></div>
          <div className="price-panel">
            <div><div className="price-amount">{FAMILY_MONTHLY_PRICE} <small>USD / month</small></div><p>The monthly family plan includes the guided curriculum and learner profiles. Checkout is coming soon; creating an account does not start a paid subscription.</p></div>
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
  return <main className="auth-layout"><section className="auth-message"><div className="eyebrow">Welcome back</div><h1>Your next idea is waiting.</h1><p>Sign in as the parent or guardian who owns this Learn Think Build account. Learners enter through their profile in the family account.</p><Link href="/" className="back-link"><ArrowLeft size={15} /> Back to Learn Think Build</Link></section><div className="auth-card-wrap"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl={`${basePath}/family`} /></div></main>;
}

function SignUpPage() {
  return <main className="auth-layout"><section className="auth-message"><div className="eyebrow">For parents & guardians</div><h1>Start a safe AI adventure.</h1><p>Create the adult-owned account first. Your family plan is {FAMILY_MONTHLY_PRICE} per month, with checkout coming soon. Learners explore four chapters of short, hands-on missions using a display name and broad age range—no birth date or child email is needed.</p><Link href="/" className="back-link"><ArrowLeft size={15} /> Back to Learn Think Build</Link></section><div className="auth-card-wrap"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} fallbackRedirectUrl={`${basePath}/family`} /></div></main>;
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
        {family.children.length > 0 && <FamilyLeaderboard learners={family.children} />}
        <div className="family-grid">
          <section className="family-panel subscription-panel" aria-labelledby="subscription-heading">
            <div className="panel-head"><h2 id="subscription-heading">Family plan</h2><span className="subscription-status" data-testid="status-subscription"><span className="status-dot" />Coming soon</span></div>
            <div className="subscription-price">{FAMILY_MONTHLY_PRICE} <small>USD / month</small></div>
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
                <div className="child-info"><strong>{child.displayName}</strong><span>{getAgeBand(child.ageBand)?.label ?? 'Learning path not selected'} · {child.completedLessonIds.length} missions · {child.masteredLevelIds.length} of {learningLevels.length} chapters mastered</span></div>
                <div className="child-actions">
                  <Link className="secondary-button" href={`/learn/${child.id}`} data-testid={`link-learner-${child.id}`}>{child.ageBand ? 'Open workshop' : 'Choose path'} <ArrowRight size={14} /></Link>
                  <button type="button" className="icon-button" aria-label={`Remove ${child.displayName}`} title="Remove learner profile" onClick={() => removeProfile(child)} disabled={deleteProfile.isPending} data-testid={`button-remove-${child.id}`}><Trash2 size={16} /></button>
                </div>
              </div>
              <GuardianPanel child={child} />
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
  return <GuardianGate><FamilyDataGate childId={params?.childId}>{(family, child) => child ? <DailyLearningGate childId={child.id}><LearnerHub child={child} familyLearners={family.children} /></DailyLearningGate> : <NotFound />}</FamilyDataGate></GuardianGate>;
}

function ReviewRoute() {
  const [, params] = useRoute('/learn/:childId/review');
  return <GuardianGate><FamilyDataGate childId={params?.childId}>{(_, child) => child ? <DailyLearningGate childId={child.id}><ReviewFlow key={`${child.id}-${child.ageBand}`} child={child} /></DailyLearningGate> : <NotFound />}</FamilyDataGate></GuardianGate>;
}

function LevelAssessmentRoute() {
  const [, params] = useRoute('/learn/:childId/level/:levelId/test');
  return <GuardianGate><FamilyDataGate childId={params?.childId}>{(_, child) => child ? <DailyLearningGate childId={child.id}><MasteryFlow key={`${child.id}-${child.ageBand}-${params?.levelId}`} child={child} levelId={params?.levelId || ''} /></DailyLearningGate> : <NotFound />}</FamilyDataGate></GuardianGate>;
}

function LessonRoute() {
  const [, params] = useRoute('/learn/:childId/lesson/:id');
  return <GuardianGate><FamilyDataGate childId={params?.childId}>{(_, child) => child ? <DailyLearningGate childId={child.id}><LessonFlow child={child} lessonId={params?.id || ''} /></DailyLearningGate> : <NotFound />}</FamilyDataGate></GuardianGate>;
}

function NotFound() {
  return <main className="not-found"><div className="eyebrow" style={{ justifyContent: 'center' }}>Page not found</div><h1>That page is still a mystery.</h1><p>The link may be old or mistyped. Choose where to go next.</p><div className="complete-actions"><Link className="primary-button" href="/" data-testid="link-404-home">Go to home</Link><Link className="secondary-button" href="/family" data-testid="link-404-family">Family account</Link><Link className="secondary-button" href="/sign-in" data-testid="link-404-sign-in">Sign in</Link></div></main>;
}

function RouterContent() {
  return <><ClerkCacheInvalidator /><BrandHeader /><Switch>
    <Route path="/" component={LandingPage} />
    <Route path="/testimonials" component={TestimonialsPage} />
    <Route path="/sample-feedback" component={() => <Redirect to="/testimonials" />} />
    <Route path="/sign-in/*?" component={SignInPage} />
    <Route path="/sign-up/*?" component={SignUpPage} />
    <Route path="/family" component={() => <GuardianGate><FamilyPage /></GuardianGate>} />
    <Route path="/dashboard" component={() => <Redirect to="/family" />} />
    <Route path="/learn/:childId/lesson/:id" component={LessonRoute} />
    <Route path="/learn/:childId/level/:levelId/test" component={LevelAssessmentRoute} />
    <Route path="/learn/:childId/review" component={ReviewRoute} />
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
