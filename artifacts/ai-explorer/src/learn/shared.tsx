import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Square, Volume2, X } from 'lucide-react';
import type { Question } from '@workspace/curriculum';
import { useReadAloud } from './speech';

export function ReadButton({ id, text, label = 'Read to me' }: { id: string; text: string; label?: string }) {
  const { activeId, toggle, supported } = useReadAloud();
  if (!supported) return null;
  const on = activeId === id;
  return <button type="button" className="read-button" onClick={() => toggle(id, text)} aria-pressed={on} data-testid={`button-read-${id}`}>
    {on ? <Square size={13} /> : <Volume2 size={14} />} {on ? 'Stop' : label}
  </button>;
}

export function apiErrorBody(error: unknown): { status?: number; message: string; feedback: string[]; missedLessonIds: string[]; score?: number } {
  const e = error as { status?: number; data?: unknown; message?: string } | null;
  const data = (e && typeof e.data === 'object' && e.data) ? e.data as Record<string, unknown> : {};
  const strs = (value: unknown) => Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
  return {
    status: e?.status,
    message: typeof data.error === 'string' ? data.error : (e?.message || 'Something went wrong. Please try again.'),
    feedback: strs(data.feedback),
    missedLessonIds: strs(data.missedLessonIds),
    score: typeof data.score === 'number' ? data.score : undefined,
  };
}

export type QuizQuestionShape = Pick<Question, 'id' | 'type' | 'prompt' | 'options'>;

export function isAnswered(q: QuizQuestionShape, value: number[] | undefined) {
  if (!value) return false;
  return q.type === 'choice' ? value.length === 1 : value.length === q.options.length;
}

export function questionSpeech(q: QuizQuestionShape) {
  return `${q.prompt}. ${q.type === 'choice' ? 'Choices' : 'Items to put in order'}: ${q.options.map((o, i) => `${i + 1}, ${o}`).join('. ')}`;
}

export function QuestionView({ q, value, onChange, disabled, status }: {
  q: QuizQuestionShape; value: number[]; onChange: (v: number[]) => void; disabled?: boolean; status?: 'right' | 'wrong';
}) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || disabled) return;
    const next = [...value]; const [item] = next.splice(from, 1); next.splice(to, 0, item); onChange(next);
  };
  return <fieldset className={`quiz-question${status ? ` is-${status}` : ''}`} disabled={disabled}>
    <legend>{q.prompt}</legend>
    <ReadButton id={`q-${q.id}`} text={questionSpeech(q)} />
    {q.type === 'choice' ? <div className="quiz-options">{q.options.map((option, i) => <label key={i} className={value[0] === i ? 'is-picked' : ''}>
      <input type="radio" name={`q-${q.id}`} checked={value[0] === i} onChange={() => onChange([i])} data-testid={`radio-${q.id}-${i}`} /><span>{option}</span>
    </label>)}</div> : <div className="order-question">
      <p className="order-help">Tap items in the order you think is right. Use the arrows or drag to rearrange.</p>
      <div className="order-pool">{q.options.map((option, i) => value.includes(i) ? null : <button type="button" key={i} onClick={() => onChange([...value, i])} data-testid={`order-add-${q.id}-${i}`}>{option}</button>)}</div>
      <ol className="order-list">{value.map((optionIndex, pos) => <li key={optionIndex} draggable={!disabled}
        onDragStart={() => setDragFrom(pos)} onDragOver={(e) => e.preventDefault()}
        onDrop={() => { if (dragFrom !== null) move(dragFrom, pos); setDragFrom(null); }}>
        <span className="order-text">{q.options[optionIndex]}</span>
        <span className="order-controls">
          <button type="button" aria-label="Move up" onClick={() => move(pos, pos - 1)} disabled={pos === 0}><ArrowUp size={14} /></button>
          <button type="button" aria-label="Move down" onClick={() => move(pos, pos + 1)} disabled={pos === value.length - 1}><ArrowDown size={14} /></button>
          <button type="button" aria-label="Remove" onClick={() => onChange(value.filter((v) => v !== optionIndex))}><X size={14} /></button>
        </span></li>)}</ol>
    </div>}
    {status === 'right' && <span className="quiz-mark"><Check size={14} /> Correct</span>}
  </fieldset>;
}
