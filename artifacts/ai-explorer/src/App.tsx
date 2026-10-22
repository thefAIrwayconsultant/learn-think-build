import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Clock3, Compass, CreditCard, Lightbulb, LockKeyhole, LogOut, RotateCcw, ShieldCheck, Sparkles, Trash2, UserRoundPlus } from 'lucide-react';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation, useRoute } from 'wouter';
import { getGetFamilyQueryKey, useCompleteChildLesson, useCreateBillingPortalSession, useCreateCheckoutSession, useCreateChildProfile, useDeleteChildProfile, useGetFamily } from '@workspace/api-client-react';
import type { ChildProfile, GuardianFamily } from '@workspace/api-client-react';
import { lessons, type Lesson } from './lessons';
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
    colorPrimary: '#28695d',
    colorForeground: '#243d39',
    colorMutedForeground: '#687a72',
    colorDanger: '#b44c3e',
    colorBackground: '#fffdf6',
    colorInput: '#fffdf6',
    colorInputForeground: '#243d39',
    colorNeutral: '#d9d7c9',
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

const activeStatuses = ['active', 'trialing'];
const lessonApiIds: Record<string, string> = {
  'ai-basics': 'what-is-ai',
  'clear-prompts': 'clear-instructions',
  'check-answers': 'check-the-answer',
  'privacy-safe-use': 'privacy-safe-use',
};
const cardIcons = [Sparkles, Lightbulb, BookOpen, LockKeyhole];
const cardColors = ['hsl(43 87% 67% / .72)', 'hsl(12 79% 62% / .2)', 'hsl(198 35% 63% / .3)', 'hsl(169 47% 31% / .13)'];

function BrandHeader() {
  const { isSignedIn } = useUser();
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="AI Explorer home" data-testid="link-home">
        <span className="brand-mark"><Compass size={21} strokeWidth={2.2} /></span>
        <span className="brand-name">AI Explorer</span>
      </Link>
      <span className="header-note">A workshop for curious minds</span>
      <nav className="header-actions" aria-label="Account navigation">
        {isSignedIn
          ? <Link href="/family" className="header-cta solid" data-testid="link-family">Family account</Link>
          : <><Link href="/sign-in" className="header-cta" data-testid="link-sign-in">Sign in</Link><Link href="/sign-up" className="header-cta solid" data-testid="link-sign-up">Get started</Link></>}
      </nav>
    </header>
  );
}

function Footer() {
  return <footer className="site-footer"><span><strong>AI Explorer</strong> · A little workshop for big questions.</span><span>For learners 10+ · An adult owns the account.</span></footer>;
}

function LandingPage() {
  const { isLoaded, isSignedIn } = useUser();
  if (isLoaded && isSignedIn) return <Redirect to="/family" />;
  return (
    <>
      <main className="page-content">
        <section className="landing-hero">
          <div className="landing-copy">
            <div className="eyebrow">A field guide for curious minds</div>
            <h1>Big questions.<br />Brave ideas.<br /><em>Better AI sense.</em></h1>
            <p>A welcoming little workshop for learners 10 and up. Explore how AI works, practice asking better questions, and build the habit of checking what you hear.</p>
            <div className="landing-ctas">
              <Link href="/sign-up" className="primary-button" data-testid="link-start-family">Start your family subscription <ArrowRight size={17} /></Link>
              <Link href="/sign-in" className="secondary-button" data-testid="link-parent-signin">Parent or guardian sign in</Link>
            </div>
            <div className="landing-trust"><ShieldCheck size={17} /><span>Adults own the account. Learners use a display name—no child email required.</span></div>
          </div>
          <div className="landing-art" aria-label="Illustrated AI Explorer field notebook">
            <div className="art-paper" />
            <div className="art-board">
              <div className="art-board-top"><span>Field notes / 01</span><Compass size={18} /></div>
              <h3>Wonder is a<br /><span>good place to start.</span></h3>
              <div className="art-sketch"><Sparkles size={22} /><span>Ask · Explore · Check</span><Lightbulb size={22} /></div>
            </div>
            <div className="art-chip one">Four short trails</div>
            <div className="art-chip two">Learn at your own pace</div>
          </div>
        </section>
        <div className="landing-band"><strong>Made for the kitchen-table kind of learning.</strong><span>Curious together, with a trusted adult in charge.</span></div>
        <section className="landing-section" aria-labelledby="how-heading">
          <div className="section-heading"><div><div className="eyebrow">A good way to learn</div><h2 id="how-heading">Small steps. Useful instincts.</h2><p>No tech setup or real AI tools—just thoughtfully made interactive lessons.</p></div></div>
          <div className="feature-grid">
            <article className="feature-note"><div className="feature-number">01 / EXPLORE</div><h3>Meet the patterns behind AI.</h3><p>Make sense of what AI can do, and what it cannot. Each trail uses clear examples and quick activities.</p></article>
            <article className="feature-note"><div className="feature-number">02 / PRACTICE</div><h3>Keep your own thinking.</h3><p>Try a prompt, check a claim, and remember when to pause and ask a trusted grown-up.</p></article>
          </div>
        </section>
        <section className="landing-section" aria-labelledby="price-heading">
          <div className="section-heading"><div><div className="eyebrow">One family plan</div><h2 id="price-heading">A workshop for the whole household.</h2><p>One adult account manages the subscription and creates learner profiles.</p></div></div>
          <div className="price-panel">
            <div><div className="price-amount">$9.99 <small>USD / month</small></div><p>One monthly family subscription. Cancel or manage it from your family account.</p></div>
            <div className="price-action"><Link className="primary-button" href="/sign-up" data-testid="button-pricing-signup">Create a guardian account <ArrowRight size={16} /></Link><span>For parents and guardians only</span></div>
          </div>
        </section>
        <p className="footnote"><ShieldCheck size={16} /> Parent-owned account and billing. Learner profiles ask for display name only.</p>
      </main>
      <Footer />
    </>
  );
}

function SignInPage() {
  return <main className="auth-layout"><section className="auth-message"><div className="eyebrow">Welcome back</div><h1>Your family’s next trail is waiting.</h1><p>Sign in as the parent or guardian who owns this AI Explorer account. Learners enter through their profile in the family account.</p><Link href="/" className="back-link"><ArrowLeft size={15} /> Back to AI Explorer</Link></section><div className="auth-card-wrap"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div></main>;
}

function SignUpPage() {
  return <main className="auth-layout"><section className="auth-message"><div className="eyebrow">For parents & guardians</div><h1>Open a door to better questions.</h1><p>Create the adult-owned account first. You’ll manage billing and learner profiles here, with no child email addresses or personal details needed.</p><Link href="/" className="back-link"><ArrowLeft size={15} /> Back to AI Explorer</Link></section><div className="auth-card-wrap"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div></main>;
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
  if (isError || !family) return <main className="page-content family-page"><StatusMessage title="Your family page didn’t load." message="We couldn’t reach your account details just now. Your subscription and learner profiles are still safe." retry={() => void refetch()} /></main>;
  return <FamilyDashboard family={family} parentName={user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Parent or guardian'} />;
}

function FamilyDashboard({ family, parentName }: { family: GuardianFamily; parentName: string }) {
  const client = useQueryClient();
  const [, setLocation] = useLocation();
  const { signOut } = useClerk();
  const createProfile = useCreateChildProfile();
  const deleteProfile = useDeleteChildProfile();
  const checkout = useCreateCheckoutSession();
  const portal = useCreateBillingPortalSession();
  const [adding, setAdding] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [formError, setFormError] = useState('');
  const subscribed = activeStatuses.includes(family.subscriptionStatus);
  const invalidateFamily = () => client.invalidateQueries({ queryKey: getGetFamilyQueryKey() });
  const startCheckout = () => checkout.mutate(undefined, { onSuccess: (session) => { window.location.assign(session.url); } });
  const openPortal = () => portal.mutate(undefined, { onSuccess: (session) => { window.location.assign(session.url); } });
  const needsPaymentAttention = ['past_due', 'unpaid'].includes(family.subscriptionStatus);
  const canManageBilling = subscribed || needsPaymentAttention;
  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = displayName.trim();
    if (!subscribed) { setFormError('Start or renew the family subscription before creating a learner profile.'); return; }
    if (!cleanName || cleanName.length > 40) { setFormError('Choose a display name between 1 and 40 characters.'); return; }
    setFormError('');
    createProfile.mutate({ data: { displayName: cleanName } }, {
      onSuccess: () => { setDisplayName(''); setAdding(false); void invalidateFamily(); },
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
  const statusText: Record<string, string> = {
    active: 'Active', trialing: 'Trial active', past_due: 'Payment needs attention', unpaid: 'Payment overdue',
    canceled: 'Canceled', paused: 'Paused', incomplete: 'Payment setup incomplete', incomplete_expired: 'Subscription expired', none: 'Not subscribed',
  };
  const displayStatus = statusText[family.subscriptionStatus] || 'Subscription status';
  return (
    <>
      <main className="page-content family-page">
        <div className="family-welcome">
          <div><div className="eyebrow">The grown-up’s corner</div><h1>Your family workshop.</h1><p>Manage your plan and choose who’s ready to explore.</p></div>
          <div className="account-pill"><span className="initial-badge">{parentName.trim().charAt(0).toUpperCase()}</span><span>{parentName}</span><button className="signout-button" type="button" onClick={() => signOut({ redirectUrl: basePath || '/' })} data-testid="button-sign-out"><LogOut size={14} /> Sign out</button></div>
        </div>
        <div className="family-grid">
          <section className="family-panel subscription-panel" aria-labelledby="subscription-heading">
            <div className="panel-head"><h2 id="subscription-heading">Family subscription</h2><span className="subscription-status" data-testid="status-subscription"><span className="status-dot" />{displayStatus}</span></div>
            <div className="subscription-price">$9.99 <small>USD / month</small></div>
            <p>{subscribed ? family.subscriptionCancelAtPeriodEnd ? `Your plan remains available through ${formatDate(family.subscriptionPeriodEnd)}.` : `Your family plan is ready${family.subscriptionPeriodEnd ? ` through ${formatDate(family.subscriptionPeriodEnd)}` : ''}.` : 'Subscribe to unlock learner profiles, all four trails, and family progress.'}</p>
            <div className="subscription-actions">
              {canManageBilling
                ? <button type="button" className="secondary-button" onClick={openPortal} disabled={portal.isPending} data-testid="button-manage-subscription"><CreditCard size={15} />{portal.isPending ? 'Opening…' : needsPaymentAttention ? 'Update payment details' : 'Manage subscription'}</button>
                : <button type="button" className="primary-button" onClick={startCheckout} disabled={checkout.isPending} data-testid="button-subscribe"><CreditCard size={15} />{checkout.isPending ? 'Preparing checkout…' : family.subscriptionStatus === 'none' ? 'Subscribe for $9.99/month' : 'Resume family plan'}</button>}
            </div>
            {(checkout.isError || portal.isError) && <p role="alert">We couldn’t open billing just now. Please try again.</p>}
            <div className="family-note"><ShieldCheck size={18} /><span>You own the account, subscription, and family controls. Learners use a display name only.</span></div>
          </section>
          <section className="family-panel" aria-labelledby="learners-heading">
            <div className="panel-head"><div><h2 id="learners-heading">Learner profiles</h2><p style={{ margin: '5px 0 0', color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>Just a display name—no personal details.</p></div>{subscribed && <button type="button" className="secondary-button" onClick={() => { setAdding((value) => !value); setFormError(''); }} data-testid="button-add-profile"><UserRoundPlus size={15} /> Add learner</button>}</div>
            {family.children.length ? <div className="child-list">{family.children.map((child, index) => (
              <div className="child-row" key={child.id} data-testid={`row-learner-${child.id}`}>
                <span className="child-avatar">{child.displayName.trim().charAt(0).toUpperCase()}</span>
                <div className="child-info"><strong>{child.displayName}</strong><span>{child.completedLessonIds.length} of {lessons.length} trails explored</span></div>
                <div className="child-actions">
                  {subscribed && <Link className="secondary-button" href={`/learn/${child.id}`} data-testid={`link-learner-${child.id}`}>Open workshop <ArrowRight size={14} /></Link>}
                  <button type="button" className="icon-button" aria-label={`Remove ${child.displayName}`} title="Remove learner profile" onClick={() => removeProfile(child)} disabled={deleteProfile.isPending} data-testid={`button-remove-${child.id}`}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}</div> : <div className="empty-card"><UserRoundPlus size={25} /><h2>Your first explorer starts here.</h2><p>{subscribed ? 'Add a display name to open a learner workshop.' : 'Subscribe to your family plan to create learner profiles.'}</p></div>}
            {adding && subscribed && <form className="add-child-form" onSubmit={submitProfile} noValidate>
              <label htmlFor="learner-name">Learner display name</label>
              <input id="learner-name" name="displayName" autoComplete="off" maxLength={40} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="What should we call this explorer?" data-testid="input-learner-name" />
              <div className="form-actions"><span className="form-hint">No email or other personal information.</span><button className="primary-button" type="submit" disabled={createProfile.isPending} data-testid="button-save-profile">{createProfile.isPending ? 'Saving…' : 'Create profile'} <ArrowRight size={15} /></button></div>
            </form>}
            {formError && <p role="alert" style={{ color: 'hsl(var(--destructive))', fontSize: 12 }} data-testid="status-profile-error">{formError}</p>}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function formatDate(date: string | null) {
  if (!date) return 'the end of the billing period';
  return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

function FamilyDataGate({ childId, children }: { childId?: string; children: (family: GuardianFamily, child?: ChildProfile) => ReactNode }) {
  const { data: family, isLoading, isError, refetch } = useGetFamily();
  if (isLoading) return <main className="page-content"><div className="skeleton" style={{ height: 160 }} /><div className="skeleton large" style={{ marginTop: 20 }} /></main>;
  if (isError || !family) return <main className="page-content"><StatusMessage title="The workshop is taking a breather." message="We couldn’t load your family details. Your saved progress is safe." retry={() => void refetch()} /></main>;
  if (!activeStatuses.includes(family.subscriptionStatus)) return <main className="page-content not-found"><div className="eyebrow" style={{ justifyContent: 'center' }}>Family plan required</div><h1>Ask your grown-up to open the workshop.</h1><p>Learner trails and profiles are available with an active family subscription.</p><Link href="/family" className="primary-button" data-testid="link-family-subscribe">Go to family account <ArrowRight size={16} /></Link></main>;
  const child = childId ? family.children.find((item) => item.id === childId) : undefined;
  if (childId && !child) return <NotFound />;
  return <>{children(family, child)}</>;
}

function LearnerRoute() {
  const [, params] = useRoute('/learn/:childId');
  return <GuardianGate><FamilyDataGate childId={params?.childId}>{(_, child) => child ? <LearnerHub child={child} /> : <NotFound />}</FamilyDataGate></GuardianGate>;
}

function LearnerHub({ child }: { child: ChildProfile }) {
  return (
    <>
      <main className="page-content">
        <Link href="/family" className="back-link"><ArrowLeft size={15} /> Family account</Link>
        <section className="learn-header"><div className="learn-greeting"><span className="child-avatar">{child.displayName.trim().charAt(0).toUpperCase()}</span><div><div className="eyebrow">Your field guide</div><h1>Welcome, {child.displayName}.</h1><p>Pick a trail. There’s no rush to get anywhere.</p></div></div><Link href="/family" className="secondary-button">Family controls</Link></section>
        <div className="learn-progress" data-testid="progress-summary"><strong>{child.completedLessonIds.length} / {lessons.length}</strong><span>{child.completedLessonIds.length === lessons.length ? 'All trails explored' : 'trails explored'}</span><div className="progress-track" role="progressbar" aria-valuenow={child.completedLessonIds.length} aria-valuemin={0} aria-valuemax={lessons.length} aria-label="Learner trails completed"><div className="progress-fill" style={{ width: `${(child.completedLessonIds.length / lessons.length) * 100}%` }} /></div><span>Progress saved for {child.displayName}</span></div>
        <section aria-labelledby="trails-heading"><div className="section-heading"><div><h2 id="trails-heading">Choose a trail</h2><p>Short lessons. Big ideas. Your own pace.</p></div></div><div className="lesson-list">{lessons.map((lesson, index) => <LessonCard key={lesson.id} lesson={lesson} index={index} childId={child.id} completed={child.completedLessonIds.includes(lessonApiIds[lesson.id])} />)}</div></section>
        <p className="footnote"><ShieldCheck size={16} /> If a tool or question makes you uncomfortable, pause and talk to your trusted adult.</p>
      </main>
      <Footer />
    </>
  );
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
  const lesson = lessons.find((item) => item.id === lessonId);
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const complete = useCompleteChildLesson();
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [saveError, setSaveError] = useState('');
  if (!lesson) return <NotFound />;
  const alreadyCompleted = child.completedLessonIds.includes(lessonApiIds[lesson.id]);
  const step = lesson.steps[stepIndex];
  const isCorrect = selectedIndex === step.correctIndex;
  const continueLesson = () => {
    if (!isCorrect) return;
    if (stepIndex < lesson.steps.length - 1) {
      setStepIndex((current) => current + 1);
      setSelectedIndex(null);
      return;
    }
    setSaveError('');
    complete.mutate({ childId: child.id, data: { lessonId: lessonApiIds[lesson.id] as 'what-is-ai' | 'clear-instructions' | 'check-the-answer' | 'privacy-safe-use' } }, {
      onSuccess: () => { void client.invalidateQueries({ queryKey: getGetFamilyQueryKey() }); setFinished(true); },
      onError: () => setSaveError('We couldn’t save this trail yet. Your answers are here—try saving again.'),
    });
  };
  const restartLesson = () => { setStepIndex(0); setSelectedIndex(null); setFinished(false); setSaveError(''); };
  return (
    <>
      <main className="page-content lesson-page">
        <Link href={`/learn/${child.id}`} className="back-link" data-testid="link-back-lessons"><ArrowLeft size={16} /> All trails</Link>
        <header className="lesson-top"><div className="lesson-kicker">{lesson.topic} · Trail {lessons.findIndex((item) => item.id === lesson.id) + 1} of {lessons.length}</div><h1>{lesson.title}</h1><p>{lesson.summary}</p><div className="lesson-meta-row"><span><Clock3 size={13} style={{ verticalAlign: '-2px' }} /> {lesson.durationMinutes} minutes</span><span><BookOpen size={13} style={{ verticalAlign: '-2px' }} /> {lesson.steps.length} quick activities</span></div></header>
        {!finished ? <>
          <div className="lesson-progress" role="progressbar" aria-valuenow={stepIndex + (isCorrect ? 1 : 0)} aria-valuemin={0} aria-valuemax={lesson.steps.length} aria-label="Lesson step progress"><div style={{ width: `${((stepIndex + (isCorrect ? 1 : 0)) / lesson.steps.length) * 100}%` }} /></div>
          <section className="step-card" key={`${lesson.id}-${stepIndex}`} aria-labelledby="step-heading" data-testid={`lesson-step-${stepIndex + 1}`}>
            <div className="step-label">Field note {String(stepIndex + 1).padStart(2, '0')} / {String(lesson.steps.length).padStart(2, '0')}</div><h2 id="step-heading">{step.heading}</h2><p className="step-explanation">{step.explanation}</p>
            <div className="question-box"><h3>{step.question}</h3><div className="answer-list" role="group" aria-label="Choose your answer">{step.options.map((option, index) => {
              const selectedWrong = selectedIndex === index && !isCorrect;
              const correctChoice = index === step.correctIndex && isCorrect;
              return <button key={option} type="button" className={`answer-option${correctChoice ? ' is-correct' : ''}${selectedWrong ? ' is-wrong' : ''}`} onClick={() => { if (!isCorrect) setSelectedIndex(index); }} disabled={isCorrect} aria-pressed={selectedIndex === index} data-testid={`answer-option-${stepIndex + 1}-${index + 1}`}><span className="answer-letter">{String.fromCharCode(65 + index)}</span>{option}</button>;
            })}</div>
            {selectedIndex !== null && <div className={`feedback ${isCorrect ? 'correct' : 'try-again'}`} role="status" aria-live="polite" data-testid="quiz-feedback">{isCorrect ? <CheckCircle2 size={20} /> : <Lightbulb size={20} />}<span><strong>{isCorrect ? 'Good thinking.' : 'Not quite. Have another go.'}</strong>{isCorrect ? step.feedback : 'Look back at the field note, then try a different answer.'}</span></div>}</div>
            {saveError && <p role="alert" style={{ color: 'hsl(var(--destructive))' }} data-testid="status-save-error">{saveError}</p>}
            <div className="lesson-actions"><button className="primary-button" type="button" onClick={continueLesson} disabled={!isCorrect || complete.isPending} data-testid="button-continue">{complete.isPending ? 'Saving your trail…' : stepIndex === lesson.steps.length - 1 ? 'Finish this trail' : 'Next field note'} <ArrowRight size={17} /></button></div>
          </section>
          {lesson.id === 'privacy-safe-use' && <aside className="safety-note"><ShieldCheck size={19} /><span><strong>Keep this rule close.</strong> Never enter private information into an AI tool. If anything feels wrong, stop and talk to a trusted adult.</span></aside>}
        </> : <section className="complete-panel" data-testid="lesson-completion"><div className="complete-seal"><CheckCircle2 size={39} /></div><div className="step-label">{alreadyCompleted ? 'Trail revisited' : 'Trail complete'}</div><h2>{alreadyCompleted ? 'Good to see you again.' : 'A new idea, in your kit.'}</h2><p>{alreadyCompleted ? 'You explored this lesson again. Keep the questions handy as you explore.' : `This trail is now saved to ${child.displayName}’s progress. Keep checking, keep asking, and remember: AI is a tool—not a substitute for your thinking.`}</p><div className="complete-actions"><button type="button" className="secondary-button" onClick={restartLesson} data-testid="button-revisit-lesson"><RotateCcw size={15} /> Revisit this trail</button><Link href={`/learn/${child.id}`} className="primary-button" data-testid="link-finish-home">Back to all trails <ArrowRight size={16} /></Link><Link href="/family" className="secondary-button" data-testid="link-finish-family">Family account</Link></div></section>}
      </main>
      <Footer />
    </>
  );
}

function NotFound() {
  return <main className="not-found"><div className="eyebrow" style={{ justifyContent: 'center' }}>Trail not found</div><h1>That path is still a mystery.</h1><p>Head back to your family account and choose an available trail.</p><Link className="primary-button" href="/family" data-testid="link-not-found-home">Family account <ArrowRight size={16} /></Link></main>;
}

function RouterContent() {
  return <><ClerkCacheInvalidator /><BrandHeader /><Switch>
    <Route path="/" component={LandingPage} />
    <Route path="/sign-in/*?" component={SignInPage} />
    <Route path="/sign-up/*?" component={SignUpPage} />
    <Route path="/family" component={() => <GuardianGate><FamilyPage /></GuardianGate>} />
    <Route path="/learn/:childId/lesson/:id" component={LessonRoute} />
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
