import { memo, useRef, useState, useEffect, useLayoutEffect, useId, useMemo } from 'react';
import type { PointerEvent } from 'react';
import type { KeyFeedback } from './keyboard-layout';
import { countInput } from './typing';
import { passageSegments } from './content';
interface Props { target: string; translations?: readonly string[]; value: string; disabled?: boolean; onChange: (value: string) => void; onCaretChange: (position: number) => void; onBegin?: () => void; onFeedback?: (feedback: KeyFeedback) => void }
export const TypingInput = memo(function TypingInput({ target, translations, value, disabled = false, onChange, onCaretChange, onBegin, onFeedback }: Props) {
  const [draft, setDraft] = useState(value);
  const [selection, setSelection] = useState({ start: Array.from(value).length, end: Array.from(value).length, caret: Array.from(value).length });
  const [selecting, setSelecting] = useState(false);
  const dragAnchor = useRef<number | null>(null);
  const translationsId = useId();
  const composing = useRef(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const wasDisabled = useRef(disabled);
  const viewport = useRef<HTMLDivElement>(null);
  const active = useRef<HTMLSpanElement>(null);
  const lastCode = useRef('');
  const sequence = useRef(0);
  useEffect(() => { if (!composing.current || disabled) setDraft(value); }, [value, disabled]);
  useEffect(() => {
    // 从暂停恢复后把焦点还给输入区，继续击键不会误触“继续练习”按钮。
    if (wasDisabled.current && !disabled) input.current?.focus({ preventScroll: true });
    if (disabled) { dragAnchor.current = null; setSelecting(false); }
    wasDisabled.current = disabled;
  }, [disabled]);
  function centerActiveCharacter() {
    const container = viewport.current, caret = active.current;
    if (!container || !caret || dragAnchor.current !== null) return;
    // 只移动题面，不滚动整页；两端留白使首字和末尾光标也能保持居中。
    container.scrollLeft += caret.getBoundingClientRect().left - container.getBoundingClientRect().left - container.clientWidth / 2;
  }
  // 拖选期间固定题面，否则光标居中会移动鼠标下方的字符，破坏选区。
  useLayoutEffect(() => { if (!selecting) centerActiveCharacter(); }, [value, target, translations, selection.caret, selecting]);
  useEffect(() => {
    const observer = new ResizeObserver(centerActiveCharacter);
    if (viewport.current) observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  const typed = Array.from(value);
  const segments = useMemo(() => passageSegments(target, translations), [target, translations]);
  const targetLength = useMemo(() => Array.from(target).length, [target]);
  const caret = Math.min(selection.caret, typed.length);
  function updateSelection(element: HTMLTextAreaElement) {
    // DOM 选区使用 UTF-16 偏移，题面与计分使用字符索引，避免非 BMP 字符让提示错位。
    const start = Array.from(element.value.slice(0, element.selectionStart)).length;
    const end = Array.from(element.value.slice(0, element.selectionEnd)).length;
    // 选区起点用于高亮范围，活动端才是 Shift + 方向键正在移动的真实光标。
    const position = element.selectionDirection === 'forward' ? end : start;
    setSelection(previous => previous.start === start && previous.end === end && previous.caret === position ? previous : { start, end, caret: position });
    onCaretChange(position);
  }
  function pointerPosition(clientX: number) {
    // 透明输入框的字体和换行不等于题面；鼠标位置必须按可见字符映射。
    for (const character of viewport.current?.querySelectorAll<HTMLElement>('[data-position]') ?? []) {
      const position = Number(character.dataset.position);
      if (position >= typed.length) return typed.length;
      const rect = character.getBoundingClientRect();
      if (clientX < rect.left + rect.width / 2) return position;
    }
    return typed.length;
  }
  function selectRange(anchor: number, position: number) {
    const element = input.current;
    if (!element) return;
    const offset = (index: number) => typed.slice(0, index).join('').length;
    element.setSelectionRange(offset(Math.min(anchor, position)), offset(Math.max(anchor, position)), position < anchor ? 'backward' : 'forward');
    updateSelection(element);
  }
  function startSelection(event: PointerEvent<HTMLTextAreaElement>) {
    if (disabled || composing.current || event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    const position = pointerPosition(event.clientX);
    const anchor = event.shiftKey ? (selection.caret === selection.start ? selection.end : selection.start) : position;
    dragAnchor.current = anchor; setSelecting(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    selectRange(anchor, position);
  }
  function moveSelection(event: PointerEvent<HTMLTextAreaElement>) {
    if (dragAnchor.current !== null) selectRange(dragAnchor.current, pointerPosition(event.clientX));
  }
  function endSelection() { dragAnchor.current = null; setSelecting(false); }
  function commit(element: HTMLTextAreaElement) {
    const next = Array.from(element.value).slice(0, targetLength).join('');
    const count = countInput(value, next, target, { attempts: 0, mistakes: 0 });
    if (count.attempts && lastCode.current) onFeedback?.({ code: lastCode.current, ok: count.mistakes === 0, sequence: ++sequence.current });
    setDraft(next); onChange(next); updateSelection(element);
  }
  return <><div className="typing-surface">
    <div ref={viewport} className="passage" aria-hidden="true"><div className="passage-track">{segments.map(segment =>
      <span className="passage-word" key={segment.start} data-current={caret >= segment.start && caret < segment.start + Array.from(segment.text).length ? true : undefined}>
        <span className="word-translation" lang="zh-CN">{segment.translation}</span>
        <span className="word-letters" lang="en">{Array.from(segment.text).map((char, offset) => {
          const i = segment.start + offset;
          return <span key={i} data-position={i} ref={i === caret ? active : undefined} className={[i < typed.length ? (char === typed[i] ? 'char-correct' : 'char-error') : '', i === caret ? 'char-caret' : '', i >= selection.start && i < selection.end ? 'char-selected' : ''].filter(Boolean).join(' ')}>{char}</span>;
        })}</span>
      </span>)}<span className="passage-word"><span className="word-translation" /><span className="word-letters"><span data-position={targetLength} ref={caret === targetLength ? active : undefined} className={caret === targetLength ? 'char-caret' : ''} /></span></span></div></div>
    <textarea ref={input} className="typing-input" aria-label="英文打字练习" aria-description={target} aria-describedby={translations?.length ? translationsId : undefined} value={draft} disabled={disabled}
      autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
      onKeyDown={e => { lastCode.current = e.code; }}
      onSelect={e => updateSelection(e.currentTarget)}
      onPointerDown={startSelection} onPointerMove={moveSelection}
      onPointerUp={endSelection} onPointerCancel={endSelection} onLostPointerCapture={endSelection}
      onPaste={e => e.preventDefault()} onDrop={e => e.preventDefault()}
      onBeforeInput={e => { const input = e.nativeEvent as InputEvent; if (input.inputType === 'insertFromPaste' || input.inputType === 'insertFromDrop') e.preventDefault(); }}
      onCompositionStart={() => { composing.current = true; onBegin?.(); }}
      onCompositionEnd={e => { composing.current = false; if (disabled) { setDraft(value); return; } commit(e.currentTarget); }}
      onChange={e => { setDraft(e.target.value); if (!composing.current && !(e.nativeEvent as InputEvent).isComposing) commit(e.currentTarget); }} />
  </div><p className="typing-hint">点击文字开始输入</p>
    {translations?.length ? <p id={translationsId} className="sr-only">单词释义：{segments.filter(segment => segment.translation).map(segment => `${segment.text}：${segment.translation}`).join('；')}</p> : null}
  </>;
});
