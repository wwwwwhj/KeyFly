import { memo, useRef, useState, useEffect, useLayoutEffect, useId, useMemo } from 'react';
import type { PointerEvent } from 'react';
import type { KeyFeedback } from './keyboard-layout';
import { countInput, type InputRange } from './typing';
import { passageSegments } from './content';
interface Props { target: string; translations?: readonly string[]; value: string; disabled?: boolean; onChange: (value: string, range?: InputRange) => void; onCaretChange: (position: number) => void; onBegin?: () => void; onFeedback?: (feedback: KeyFeedback) => void }
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
  const committed = useRef(value);
  const pendingEdit = useRef<(InputRange & { value: string }) | undefined>(undefined);
  const sequence = useRef(0);
  useEffect(() => {
    if (!composing.current || disabled) { setDraft(value); committed.current = value; }
    if (disabled) { composing.current = false; pendingEdit.current = undefined; lastCode.current = ''; }
  }, [value, disabled]);
  function captureEdit(element: HTMLTextAreaElement) {
    return { value: element.value,
      start: Array.from(element.value.slice(0, element.selectionStart)).length,
      end: Array.from(element.value.slice(0, element.selectionEnd)).length };
  }
  useEffect(() => {
    const element = input.current;
    if (!element) return;
    // 使用原生 beforeinput，在浏览器改动值和选区前捕获位置；组合输入沿用开始时的范围。
    function beforeInput(event: InputEvent) {
      if (event.inputType === 'insertFromPaste' || event.inputType === 'insertFromDrop') { event.preventDefault(); pendingEdit.current = undefined; return; }
      if (!composing.current) pendingEdit.current = event.inputType.startsWith('insert') ? captureEdit(element!) : undefined;
    }
    element.addEventListener('beforeinput', beforeInput);
    return () => element.removeEventListener('beforeinput', beforeInput);
  }, []);
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
    const previous = committed.current, edit = pendingEdit.current;
    pendingEdit.current = undefined;
    const range = edit?.value === previous ? edit : undefined;
    const raw = Array.from(element.value);
    let next = raw.slice(0, targetLength).join('');
    if (range) {
      const before = Array.from(previous);
      const insertedLength = Math.max(0, raw.length - before.length + range.end - range.start);
      const available = targetLength - before.length + range.end - range.start;
      const inserted = raw.slice(range.start, range.start + insertedLength).slice(0, available).join('');
      // 达到上限时只限制新插入的字符，不能截掉用户尚未选中的尾部文字。
      next = before.slice(0, range.start).join('') + inserted + before.slice(range.end).join('');
      if (next !== element.value) {
        element.value = next;
        const position = before.slice(0, range.start).join('').length + inserted.length;
        element.setSelectionRange(position, position);
      }
    }
    const count = countInput(previous, next, target, { attempts: 0, mistakes: 0 }, range);
    // 部分浏览器在 compositionend 后还会派发同值 input；一次提交只能计数一次。
    if (next === previous && !count.attempts) { setDraft(next); lastCode.current = ''; updateSelection(element); return; }
    committed.current = next;
    if (count.attempts && lastCode.current) onFeedback?.({ code: lastCode.current, ok: count.mistakes === 0, sequence: ++sequence.current });
    lastCode.current = '';
    setDraft(next); onChange(next, range); updateSelection(element);
  }
  return <><div className="typing-surface">
    <div ref={viewport} className="passage" aria-hidden="true"><div className="passage-track">{segments.map(segment =>
      <span className="passage-word" key={segment.start} data-current={caret >= segment.start && caret < segment.start + Array.from(segment.text).length ? true : undefined}>
        <span className="word-translation" lang="zh-CN">{segment.translation}</span>
        <span className="word-letters" lang="en">{Array.from(segment.text).map((char, offset) => {
          const i = segment.start + offset;
          return <span key={i} data-position={i} data-space={char === ' ' ? true : undefined} ref={i === caret ? active : undefined} className={[i < typed.length ? (char === typed[i] ? 'char-correct' : 'char-error') : '', i === caret ? 'char-caret' : '', i >= selection.start && i < selection.end ? 'char-selected' : ''].filter(Boolean).join(' ')}>{char}</span>;
        })}</span>
      </span>)}<span className="passage-word"><span className="word-translation" /><span className="word-letters"><span data-position={targetLength} ref={caret === targetLength ? active : undefined} className={caret === targetLength ? 'char-caret' : ''} /></span></span></div></div>
    {/* 与单行题面一致，避免 Home/End 停在透明输入框里不可见的自动折行。 */}
    <textarea ref={input} className="typing-input" wrap="off" aria-label="英文打字练习" aria-description={target} aria-describedby={translations?.length ? translationsId : undefined} value={draft} disabled={disabled}
      autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
      onKeyDown={e => { lastCode.current = e.ctrlKey || e.metaKey || e.altKey ? '' : e.code; }}
      onSelect={e => updateSelection(e.currentTarget)}
      onPointerDown={startSelection} onPointerMove={moveSelection}
      onPointerUp={endSelection} onPointerCancel={endSelection} onLostPointerCapture={endSelection}
      onPaste={e => e.preventDefault()} onDrop={e => e.preventDefault()}
      onCompositionStart={e => { pendingEdit.current = captureEdit(e.currentTarget); composing.current = true; onBegin?.(); }}
      onCompositionEnd={e => {
        composing.current = false;
        if (disabled) { setDraft(value); return; }
        // Esc 取消组合会恢复原选区，不能把恢复的旧文字当成一次同值重输。
        if (!e.data && e.currentTarget.value === committed.current) pendingEdit.current = undefined;
        commit(e.currentTarget);
      }}
      // 同值替换也有真实击键；onInput 不会像 onChange 一样被 React 的值比较过滤。
      onInput={e => { setDraft(e.currentTarget.value); if (!composing.current && !(e.nativeEvent as InputEvent).isComposing) commit(e.currentTarget); }} />
  </div><p className="typing-hint">点击文字开始输入</p>
    {translations?.length ? <p id={translationsId} className="sr-only">单词释义：{segments.filter(segment => segment.translation).map(segment => `${segment.text}：${segment.translation}`).join('；')}</p> : null}
  </>;
});
