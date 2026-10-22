import { useEffect, useRef, useState } from 'react';
import { Check, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import type { Lesson } from '@workspace/curriculum';
import { Mascot } from '../Mascot';
import { speakText, speechSupported, stopSpeech } from './speech';

export function words(text: string, active: number | null) {
  let offset = 0;
  return text.split(/(\s+)/).map((part, i) => {
    const start = offset; offset += part.length;
    if (!part.trim()) return part;
    const on = active !== null && active >= start && active < offset;
    return <span key={i} className={on ? 'speech-word is-speaking' : 'speech-word'}>{part}</span>;
  });
}

function Diagram({ text, index }: { text: string; index: number }) {
  const nodes = text.split(/\s*(?:->|→|;|\.\s+)\s*/).map((n) => n.trim().replace(/\.$/, '')).filter(Boolean).slice(0, 6);
  return <div className="scene-diagram" role="img" aria-label={`Diagram: ${text}`}>
    <div className="scene-diagram-tag">Diagram {index + 1}</div>
    <div className="scene-nodes">{nodes.map((n, i) => <div className="scene-node-wrap" key={i}><div className="scene-node" style={{ animationDelay: `${i * 120}ms` }}><b>{i + 1}</b><span>{n}</span></div>{i < nodes.length - 1 && <span className="scene-arrow" aria-hidden="true" />}</div>)}</div>
  </div>;
}

/** Narrated scenes. Forward-only on first view; transcript fallback counts when every scene is read. */
export function WatchStep({ lesson, onComplete, alreadyDone }: { lesson: Lesson; onComplete: () => void; alreadyDone: boolean }) {
  const scenes = lesson.scenes;
  const [scene, setScene] = useState(0);
  const [read, setRead] = useState<boolean[]>(() => scenes.map(() => alreadyDone));
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [char, setChar] = useState<number | null>(null);
  const token = useRef(0);
  const allRead = read.every(Boolean);
  const markRead = (i: number) => setRead((r) => r.map((v, k) => k === i ? true : v));

  const play = (from = scene) => {
    const my = ++token.current;
    setPlaying(true); setPaused(false); setChar(0);
    speakText(scenes[from].narration, {
      rate,
      onBoundary: (c) => { if (token.current === my) setChar(c); },
      onEnd: (completed) => { if (token.current !== my) return; setPlaying(false); setPaused(false); setChar(null); if (completed) markRead(from); },
    });
  };
  const halt = () => { token.current++; stopSpeech(); setPlaying(false); setPaused(false); setChar(null); };
  const togglePlayback = () => {
    if (playing) { window.speechSynthesis.pause(); setPlaying(false); setPaused(true); }
    else if (paused) { window.speechSynthesis.resume(); setPlaying(true); setPaused(false); }
    else play();
  };
  useEffect(() => {
    const hide = () => { if (document.hidden) halt(); };
    document.addEventListener('visibilitychange', hide);
    return () => { document.removeEventListener('visibilitychange', hide); halt(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const onCompleteRef = useRef(onComplete); onCompleteRef.current = onComplete;
  useEffect(() => { if (allRead) onCompleteRef.current(); }, [allRead]);

  const go = (next: number) => { halt(); setScene(next); };
  const s = scenes[scene];
  return <div className="watch-step">
    <div className="watch-stage">
      <div className="watch-pip"><Mascot mood={playing ? 'bright' : 'curious'} size={70} /></div>
      <div className="watch-scene-card">
        <div className="eyebrow">Scene {scene + 1} of {scenes.length}</div>
        <h3>{s.title}</h3>
        <Diagram text={s.visual} index={scene} />
        <p className="watch-caption" aria-live="off">{words(s.narration, char)}</p>
      </div>
    </div>
    <div className="watch-controls">
      {speechSupported() ? <>
        <button type="button" className="primary-button" onClick={togglePlayback} data-testid="button-watch-play">{playing ? <><Pause size={15} /> Pause</> : <><Play size={15} /> {paused ? 'Resume' : read[scene] ? 'Play again' : 'Play scene'}</>}</button>
        <button type="button" className="secondary-button" onClick={() => { halt(); play(); }} data-testid="button-watch-replay"><RotateCcw size={14} /> Replay</button>
        <label className="speed-control">Speed <select value={rate} onChange={(e) => { setRate(Number(e.target.value)); if (playing) halt(); }}>{[0.75, 1, 1.25, 1.5].map((r) => <option key={r} value={r}>{r}x</option>)}</select></label>
      </> : <p className="activity-note">Speech is not available in this browser. Read each scene below and mark it read.</p>}
      <button type="button" className="secondary-button" onClick={() => go(scene + 1)} disabled={scene >= scenes.length - 1 || !read[scene]} data-testid="button-watch-next"><SkipForward size={14} /> Next scene</button>
      {alreadyDone && <button type="button" className="text-action" onClick={() => go(Math.max(0, scene - 1))} disabled={scene === 0}>Previous scene</button>}
    </div>
    <div className="watch-dots" aria-label="Scenes read">{read.map((r, i) => <span key={i} className={`${r ? 'is-read' : ''}${i === scene ? ' is-current' : ''}`} />)}</div>
    <details className="lesson-transcript"><summary>Transcript ({read.filter(Boolean).length} of {scenes.length} read)</summary>
      {scenes.map((sc, i) => <div key={i} className="transcript-scene"><strong>{i + 1}. {sc.title}</strong><p>{sc.narration}</p>
        {read[i] ? <span className="read-done"><Check size={13} /> Read</span> : <button type="button" className="text-action" onClick={() => markRead(i)} data-testid={`button-mark-read-${i}`}>Mark scene read</button>}</div>)}
    </details>
    {!allRead && <p className="activity-note">Finish every scene (listen, or read it in the transcript) to continue.</p>}
  </div>;
}
