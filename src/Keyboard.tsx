import { memo, useEffect, useRef, useState } from 'react';
import { hintCodes, keyRows, typingEnergy, type KeyFeedback } from './keyboard-layout';
import { createKeyboardEffects } from './keyboard-effects';

export const Keyboard = memo(function Keyboard({ nextChar, feedback, active, effects }: { nextChar: string; feedback: KeyFeedback | null; active: boolean; effects: boolean }) {
  const [held, setHeld] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<KeyFeedback | null>(null);
  const [energy, setEnergy] = useState(0);
  const [tier, setTier] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const strokes = useRef<number[]>([]);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createKeyboardEffects> | null>(null);
  const energyRef = useRef(0);
  const focused = useRef(false);
  const canAnimate = useRef(false);
  canAnimate.current = effects && !reduced && active;
  const hints = hintCodes(nextChar, capsLock);

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    // 锁定状态属于设备，不随暂停或失焦清空；用后续键盘事件校准。
    const modifiers = (event: KeyboardEvent) => setCapsLock(event.getModifierState('CapsLock'));
    window.addEventListener('keydown', modifiers); window.addEventListener('keyup', modifiers);
    const update = () => setReduced(media.matches || document.documentElement.dataset.motion === 'reduced');
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    media.addEventListener('change', update); update();
    if (canvas.current) renderer.current = createKeyboardEffects(canvas.current);
    return () => { observer.disconnect(); media.removeEventListener('change', update); window.removeEventListener('keydown', modifiers); window.removeEventListener('keyup', modifiers); renderer.current?.dispose(); };
  }, []);
  useEffect(() => { if (!canAnimate.current) renderer.current?.clear(); }, [effects, reduced, active]);

  function burst(code: string, wrong = false) {
    if (!canAnimate.current || !focused.current || !stage.current) return;
    const key = [...stage.current.querySelectorAll<HTMLElement>('[data-code]')].find(el => el.dataset.code === code);
    if (!key) return;
    const rect = key.getBoundingClientRect(), area = stage.current.getBoundingClientRect();
    const color = wrong ? '#ff8c9e' : energyRef.current >= .85 ? '#f6d879' : energyRef.current >= .5 ? '#68e8e4' : '#a6e7ba';
    renderer.current?.burst(rect.left - area.left + rect.width / 2, rect.top - area.top + rect.height / 2, energyRef.current, color, wrong);
  }
  useEffect(() => {
    if (!active) { focused.current = false; setHeld(new Set()); setFlash(null); setEnergy(0); setTier(0); energyRef.current = 0; strokes.current = []; return; }
    function down(event: KeyboardEvent) {
      // 只反馈练习输入框，导航与设置不亮键；Tab 等控制键保留原生行为。
      if (!(event.target instanceof HTMLTextAreaElement) || !event.target.classList.contains('typing-input') || event.ctrlKey || event.metaKey || event.altKey) return;
      focused.current = true;
      setHeld(previous => new Set(previous).add(event.code));
      if (!event.repeat && (event.key.length === 1 || event.isComposing || event.key === 'Process')) {
        strokes.current.push(performance.now());
        const next = typingEnergy(strokes.current, performance.now());
        strokes.current = next.recent; energyRef.current = next.energy;
        // 按下只更新键程与热度；粒子等输入校验后触发，错键不会先闪正确色。
        setEnergy(next.energy); setTier(next.tier);
      }
    }
    function up(event: KeyboardEvent) { setHeld(previous => { const next = new Set(previous); next.delete(event.code); return next; }); }
    function clear() { focused.current = false; setHeld(new Set()); setFlash(null); strokes.current = []; energyRef.current = 0; setEnergy(0); setTier(0); renderer.current?.clear(); }
    function leaveInput(event: FocusEvent) {
      // Tab 到说明或设置也要停止动态反馈，不能只监听整个窗口失焦。
      if (event.target instanceof HTMLTextAreaElement && event.target.classList.contains('typing-input')) clear();
    }
    const timer = setInterval(() => {
      const next = typingEnergy(strokes.current, performance.now());
      strokes.current = next.recent; energyRef.current = next.energy;
      setEnergy(next.energy); setTier(next.tier);
    }, 120);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', clear);
    document.addEventListener('focusout', leaveInput);
    return () => { clearInterval(timer); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', clear); document.removeEventListener('focusout', leaveInput); };
  }, [active]);
  useEffect(() => {
    // 已排队的输入反馈不能在失焦清场后重新点亮旧键或启动粒子。
    const current = active && focused.current ? feedback : null;
    setFlash(current);
    if (current) burst(current.code, !current.ok);
    const timer = setTimeout(() => setFlash(null), 220);
    return () => clearTimeout(timer);
  }, [feedback, active]);

  return <div className="keyboard-panel" data-tier={effects && !reduced ? tier : 0}>
    <div className="keyboard-caption"><span className="energy-title">{['键盘', '节奏', '疾速', '超频'][effects && !reduced ? tier : 0]}</span>
      <span className="heat-meter" aria-label={`敲击热度 ${Math.round(energy * 100)}%`}><span>{energy === 1 ? '10+' : (energy * 10).toFixed(1)} 击/秒</span>{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < Math.ceil(energy * 10) ? 'lit' : ''} />)}</span>
    </div>
    <div ref={stage} className="keyboard-stage" aria-hidden="true">
      <div className="speed-trails" />
      <div className="keyboard">{keyRows.map((row, i) => <div className="keyboard-row" key={i}>{row.map(key =>
        <span key={key.code} data-code={key.code} data-width={key.width} className={`keyboard-key${held.has(key.code) ? ' held' : ''}${hints.includes(key.code) ? ' next' : ''}${flash?.code === key.code ? (flash.ok ? ' correct' : ' error') : ''}`}>{key.label}</span>
      )}</div>)}</div>
      <canvas ref={canvas} className="key-particles" />
    </div>
  </div>;
});
