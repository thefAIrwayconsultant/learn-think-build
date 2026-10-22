import { useEffect, useRef, useState } from 'react';

export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function stopSpeech() {
  if (speechSupported()) window.speechSynthesis.cancel();
}

export function speakText(text: string, opts: { rate?: number; onBoundary?: (charIndex: number) => void; onEnd?: (completed: boolean) => void } = {}) {
  if (!speechSupported()) { opts.onEnd?.(false); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = opts.rate ?? 1;
  let finished = false;
  utterance.onboundary = (event) => opts.onBoundary?.(event.charIndex);
  utterance.onend = () => { if (!finished) { finished = true; opts.onEnd?.(true); } };
  utterance.onerror = () => { if (!finished) { finished = true; opts.onEnd?.(false); } };
  window.speechSynthesis.speak(utterance);
}

/** Cancels speech on unmount, on dependency change, and when the tab is hidden. */
export function useSpeechSafety(...deps: unknown[]) {
  useEffect(() => {
    const onHide = () => { if (document.hidden) stopSpeech(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', stopSpeech);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', stopSpeech);
      stopSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function useReadAloud() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const idRef = useRef<string | null>(null);
  useEffect(() => () => { idRef.current = null; stopSpeech(); }, []);
  useEffect(() => {
    const onHide = () => { if (document.hidden) { stopSpeech(); setActiveId(null); idRef.current = null; } };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);
  const toggle = (id: string, text: string) => {
    if (idRef.current === id) { stopSpeech(); idRef.current = null; setActiveId(null); return; }
    idRef.current = id; setActiveId(id);
    speakText(text, { onEnd: () => { if (idRef.current === id) { idRef.current = null; setActiveId(null); } } });
  };
  return { activeId, toggle, supported: speechSupported() };
}
