import { useCallback, useEffect, useRef, useState } from 'react';
import { pickPassage } from './content';
import { countInput, elapsedAt, metrics, type InputRange } from './typing';
import { TypingInput } from './TypingInput';
import { DurationSwitch } from './DurationSwitch';
import type { Result } from './history';
import { Keyboard } from './Keyboard';
import type { KeyFeedback } from './keyboard-layout';
export function Practice({ onResult, active = true }: { onResult: (result: Result) => void; active?: boolean }) {
  const [limit, setLimit] = useState(60);
  const [passage, setPassage] = useState(() => pickPassage('en', 0));
  const [value, setValue] = useState('');
  const [caret, setCaret] = useState(0);
  const [counts, setCounts] = useState({ attempts: 0, mistakes: 0 });
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'done'>('idle');
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [effects, setEffects] = useState(true);
  const [session, setSession] = useState(0);
  const [feedback, setFeedback] = useState<KeyFeedback | null>(null);
  const clock = useRef({ started: null as number | null, accumulated: 0, done: false });
  const latest = useRef({ value, counts, passage, limit, onResult });
  latest.current = { value, counts, passage, limit, onResult };
  const time = useCallback(() => elapsedAt(clock.current.started, clock.current.accumulated, performance.now(), latest.current.limit * 1000), []);
  const finish = useCallback((text = latest.current.value, totals = latest.current.counts) => {
    if (clock.current.done) return;
    const ms = time(); clock.current = { started: null, accumulated: ms, done: true };
    setElapsed(ms); setStatus('done');
    const current = latest.current;
    current.onResult({ at: Date.now(), language: 'en', seconds: Math.round(ms / 1000), duration: current.limit, ...metrics(text, current.passage.text, ms, totals), mode: 'practice' });
  }, [time]);
  function pause() {
    if (clock.current.started === null) return;
    const ms = time();
    if (latest.current.limit && ms >= latest.current.limit * 1000) { finish(); return; }
    clock.current = { started: null, accumulated: ms, done: false };
    setElapsed(ms); setStatus('paused');
  }
  // 查看排行或记录时保留正在练习的内容，避免导航意外丢失进度。
  // 弹窗打开时暂停计时，关闭后由用户继续，避免查看记录消耗练习时间。
  useEffect(() => { if (!active) pause(); }, [active]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (clock.current.started === null) return;
      const ms = time(); setElapsed(ms);
      if (latest.current.limit && ms >= latest.current.limit * 1000) finish();
    }, 100);
    const onVisibility = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);
  function reset(nextLimit = limit) {
    setSession(previous => previous + 1);
    clock.current = { started: null, accumulated: 0, done: false };
    setLimit(nextLimit); setPassage(pickPassage('en'));
    setValue(''); setCaret(0); setCounts({ attempts: 0, mistakes: 0 }); setElapsed(0); setStatus('idle'); setFeedback(null);
  }
  const begin = useCallback(() => {
    if (clock.current.done || status === 'paused' || clock.current.started !== null) return;
    clock.current.started = performance.now(); setStatus('running');
  }, [status]);
  // 稳定输入回调，使每 100ms 的计时更新不会重绘题面和释义。
  const change = useCallback((next: string, range?: InputRange) => {
    if (clock.current.done || status === 'paused') return;
    if (limit && time() >= limit * 1000) { finish(); return; }
    if (next === value && !range) return;
    begin(); const updated = countInput(value, next, passage.text, counts, range);
    setValue(next); setCounts(updated);
    if (next === passage.text) finish(next, updated);
  }, [status, limit, time, finish, value, begin, passage, counts]);
  const stats = metrics(value, passage.text, elapsed, counts);
  const busy = status === 'running' || status === 'paused';
  return <section aria-label="自由练习" className={showKeyboard ? 'with-keyboard' : ''}>
    <div className="practice-toolbar">
      <DurationSwitch value={limit} disabled={busy} onChange={reset} />
      <span className={`status status-${status}`}>{({ idle: '等待输入', running: '正在练习', paused: '已暂停', done: '练习完成' })[status]}</span>
      <button className="icon-button restart-button" aria-label="换一篇并重新开始" title="换一篇 / 重新开始" onClick={() => reset()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2.6 8.4M3 4v6h6" /></svg></button>
    </div>
    <div className="workspace"><div className="metrics"><div><strong>{stats.wpm}</strong><span>WPM</span></div><div><strong>{stats.accuracy}<small>%</small></strong><span>准确率</span></div><div><strong>{limit ? Math.max(0, limit - Math.floor(elapsed / 1000)) : Math.floor(elapsed / 1000)}<small>s</small></strong><span>{limit ? '剩余时间' : '已用时间'}</span></div></div>
      <TypingInput key={session} target={passage.text} translations={passage.translations} value={value} onChange={change} onCaretChange={setCaret} onBegin={begin} onFeedback={setFeedback} disabled={status === 'done' || status === 'paused'} />
      <div className="progress-row"><progress max={100} value={stats.progress} aria-label="练习完成进度" /><span className="sr-only">{stats.correct} / {Array.from(passage.text).length} 字符</span></div>
      {status === 'paused' && <div className="notice" role="status">练习已暂停。<button onClick={() => { clock.current.started = performance.now(); setStatus('running'); }}>继续练习</button></div>}
      {status === 'done' && <div className="result-banner" role="status"><div><h2>{value === passage.text ? '完整打完，漂亮！' : '时间到，休息一下。'}</h2><p>本轮 {stats.correct} 个正确字符，累计 {counts.mistakes} 次错误。成绩已加入本次记录。</p></div><button className="primary" onClick={() => reset()}>再练一次</button></div>}
    </div>
    {showKeyboard && <Keyboard key={session} nextChar={status === 'done' ? '' : Array.from(passage.text)[caret] ?? ''} feedback={feedback} active={active && status !== 'paused' && status !== 'done'} effects={effects} />}
    <details className="practice-settings"><summary>显示与练习说明</summary>
      <div className="keyboard-switch"><label><input type="checkbox" checked={showKeyboard} onChange={e => {
        // 隐藏期间仍可打字，重挂载时不能把最后一次输入当成新击键播放。
        setFeedback(null); setShowKeyboard(e.target.checked);
      }} />显示屏幕键盘</label><label><input type="checkbox" checked={effects} onChange={e => setEffects(e.target.checked)} />速度特效</label></div>
      <p>首次输入开始计时，切到后台自动暂停。Backspace 修正，方向键移动光标。</p>
      <p>键帽描边提示下一键；绿色表示正确，红色表示错误。题面圆点提示当前或输错的空格。WPM = 每分钟正确字符 ÷ 5。</p>
    </details>
  </section>;
}
