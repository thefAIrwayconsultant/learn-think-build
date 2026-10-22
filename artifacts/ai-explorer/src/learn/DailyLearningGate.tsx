import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { Clock3, ShieldCheck } from 'lucide-react';
import { useGetChildDailyUsage, useRecordChildDailyUsage } from '@workspace/api-client-react';
import './learn.css';

function resetLabel(resetAt: string) {
  return new Date(resetAt).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
}

function remainingLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function DailyLimitNotice({ childId, resetAt }: { childId: string; resetAt: string }) {
  return <main className="page-content daily-limit-page" data-testid="daily-learning-limit">
    <div className="daily-limit-card"><Clock3 size={34} /><div className="eyebrow">That's today's learning time</div>
      <h1>Great work exploring today.</h1>
      <p>Your 10-minute learning session is complete. Your lessons and completed steps are saved; come back tomorrow when your daily time opens again.</p>
      <p className="daily-reset">Your next learning window starts {resetLabel(resetAt)}.</p>
      <div className="complete-actions"><Link className="primary-button" href={`/learn/${childId}`}>Back to learning path</Link><Link className="secondary-button" href="/family">Family account</Link></div>
      <p className="footnote"><ShieldCheck size={15} /> Rest, play, and offline time matter too. There is no streak to keep.</p>
    </div>
  </main>;
}

export function DailyLearningGate({ childId, children, testingAdmin = false }: { childId: string; children: ReactNode; testingAdmin?: boolean }) {
  if (testingAdmin) return <>{children}</>;
  return <DailyLearningTimer childId={childId}>{children}</DailyLearningTimer>;
}

function DailyLearningTimer({ childId, children }: { childId: string; children: ReactNode }) {
  const { data, isLoading, isError, refetch } = useGetChildDailyUsage(childId);
  const { mutate } = useRecordChildDailyUsage();
  const [remaining, setRemaining] = useState<number | null>(null);
  const [resetAt, setResetAt] = useState('');
  const [active, setActive] = useState(false);
  const [timerError, setTimerError] = useState(false);
  const [ready, setReady] = useState(false);
  const sessionId = useRef('');
  const started = useRef(false);
  const remainingRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  if (!sessionId.current) sessionId.current = window.crypto.randomUUID();
  remainingRef.current = remaining;
  activeRef.current = active;

  const record = useCallback((isActive: boolean) => {
    mutate({ childId, data: { active: isActive, sessionId: sessionId.current } }, {
      onSuccess: (usage) => {
        setRemaining((local) => local === null ? usage.remainingSeconds : Math.min(local, usage.remainingSeconds));
        setResetAt(usage.resetAt);
        setTimerError(false);
        setReady(true);
        setActive(isActive && usage.remainingSeconds > 0 && (remainingRef.current ?? usage.remainingSeconds) > 0);
      },
      onError: () => {
        setActive(false);
        setReady(false);
        setTimerError(true);
      },
    });
  }, [childId, mutate]);

  useEffect(() => {
    if (!data || started.current) return;
    started.current = true;
    setRemaining(data.remainingSeconds);
    setResetAt(data.resetAt);
    setReady(true);
    if (data.remainingSeconds > 0) record(true);
  }, [data, record]);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => value === null ? null : Math.max(0, value - 1));
    }, 1000);
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === 'visible' && activeRef.current) record(true);
    }, 5000);
    return () => { window.clearInterval(timer); window.clearInterval(heartbeat); };
  }, [active, record]);

  useEffect(() => {
    if (remaining !== 0 || !active) return;
    setActive(false);
    record(false);
  }, [active, record, remaining]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (activeRef.current) { setActive(false); record(false); }
      } else if (started.current && (remainingRef.current ?? 0) > 0 && !timerError) {
        record(true);
      }
    };
    const onPageHide = () => {
      if (activeRef.current) { setActive(false); record(false); }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      if (activeRef.current) record(false);
    };
  }, [record, timerError]);

  if (isLoading || (data && !ready && !timerError)) return <main className="page-content daily-limit-page"><p className="activity-note">Checking today's learning time…</p></main>;
  if (isError || timerError || !data) return <main className="page-content daily-limit-page" role="alert">
    <div className="daily-limit-card"><Clock3 size={34} /><h1>We can't check today's learning time yet.</h1>
      <p>Learning is paused until the family timer can be verified.</p>
      <button type="button" className="primary-button" onClick={() => { setTimerError(false); void refetch(); }}>Try again</button>
      <Link className="secondary-button" href="/family">Family account</Link>
    </div>
  </main>;
  if ((remaining ?? data.remainingSeconds) <= 0) return <DailyLimitNotice childId={childId} resetAt={resetAt || data.resetAt} />;

  return <>
    <aside className={`daily-time-bar${(remaining ?? data.remainingSeconds) <= 60 ? ' is-nearly-done' : ''}`} role="timer" aria-live="off" aria-label={`${remainingLabel(remaining ?? data.remainingSeconds)} learning time remaining today`} data-testid="daily-time-warning">
      <Clock3 size={18} /><div><span>LEARNING TIME LEFT TODAY</span><strong>{remainingLabel(remaining ?? data.remainingSeconds)}</strong></div>
      <small>10 minutes daily · resets {resetLabel(resetAt || data.resetAt)}</small>
    </aside>
    {children}
  </>;
}
