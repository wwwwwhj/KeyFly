import { useRef, useState, useEffect, useId } from 'react';
import type { KeyFeedback } from './keyboard-layout';
import { countInput } from './typing';
interface Props { target: string; value: string; disabled?: boolean; onChange: (value: string) => void; onBegin?: () => void; onFeedback?: (feedback: KeyFeedback) => void }
export function TypingInput({ target, value, disabled = false, onChange, onBegin, onFeedback }: Props) {
  const [draft, setDraft] = useState(value);
  const inputId = useId();
  const composing = useRef(false);
  const active = useRef<HTMLSpanElement>(null);
  const lastCode = useRef('');
  const sequence = useRef(0);
  useEffect(() => { if (!composing.current || disabled) setDraft(value); }, [value, disabled]);
  useEffect(() => { active.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [value]);
  const typed = Array.from(value);
  function commit(raw: string) {
    const next = Array.from(raw).slice(0, Array.from(target).length).join('');
    const count = countInput(value, next, target, { attempts: 0, mistakes: 0 });
    if (count.attempts && lastCode.current) onFeedback?.({ code: lastCode.current, ok: count.mistakes === 0, sequence: ++sequence.current });
    setDraft(next); onChange(next);
  }
  return <>
    <div className="passage" aria-label="练习原文" tabIndex={0}>{Array.from(target).map((char, i) =>
      <span key={i} ref={i === typed.length ? active : undefined} className={i < typed.length ? (char === typed[i] ? 'char-correct' : 'char-error') : i === typed.length ? 'char-caret' : ''}>{char}</span>)}</div>
    <label className="input-label" htmlFor={inputId}>在此输入上方文字 <span>支持中文输入法 · 错字可退格修正</span></label>
    <textarea id={inputId} className="typing-input" value={draft} disabled={disabled} placeholder="从第一个字开始，找到你的节奏…"
      autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
      onKeyDown={e => { lastCode.current = e.code; }}
      onPaste={e => e.preventDefault()} onDrop={e => e.preventDefault()}
      onBeforeInput={e => { const input = e.nativeEvent as InputEvent; if (input.inputType === 'insertFromPaste' || input.inputType === 'insertFromDrop') e.preventDefault(); }}
      onCompositionStart={() => { composing.current = true; onBegin?.(); }}
      onCompositionEnd={e => { composing.current = false; if (disabled) { setDraft(value); return; } commit(e.currentTarget.value); }}
      onChange={e => { setDraft(e.target.value); if (!composing.current && !(e.nativeEvent as InputEvent).isComposing) commit(e.target.value); }} />
  </>;
}
