import { useEffect, useRef, useState } from 'react';
import { pickPassage, type Language } from './content';
import { countInput, elapsedAt, metrics } from './typing';
import { TypingInput } from './TypingInput';
import type { Result } from './history';
export function Practice({ onResult }: { onResult: (result: Result) => void }) {
  const [language, setLanguage] = useState<Language>('en');
  const [limit, setLimit] = useState(60);
  const [passage, setPassage] = useState(() => pickPassage('en', 0));
  const [value, setValue] = useState('');
  const [counts, setCounts] = useState({ attempts: 0, mistakes: 0 });
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'done'>('idle');
  const clock = useRef({ started: null as number | null, accumulated: 0, done: false });
  const latest = useRef({ value, counts, passage, language, limit, onResult });
  latest.current = { value, counts, passage, language, limit, onResult };
  function time() { return elapsedAt(clock.current.started, clock.current.accumulated, performance.now(), latest.current.limit * 1000); }
  function finish(text = latest.current.value, totals = latest.current.counts) {
    if (clock.current.done) return;
    const ms = time(); clock.current = { started: null, accumulated: ms, done: true };
    setElapsed(ms); setStatus('done');
    const current = latest.current;
    current.onResult({ at: Date.now(), language: current.language, seconds: Math.round(ms / 1000), ...metrics(text, current.passage.text, ms, totals), mode: 'practice' });
  }
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (clock.current.started === null) return;
      const ms = time(); setElapsed(ms);
      if (latest.current.limit && ms >= latest.current.limit * 1000) finish();
    }, 100);
    const pause = () => {
      if (!document.hidden || clock.current.started === null) return;
      const ms = time();
      if (latest.current.limit && ms >= latest.current.limit * 1000) { finish(); return; }
      clock.current = { started: null, accumulated: ms, done: false };
      setElapsed(ms); setStatus('paused');
    };
    document.addEventListener('visibilitychange', pause);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', pause); };
  }, []);
  function reset(nextLanguage = language, nextLimit = limit) {
    clock.current = { started: null, accumulated: 0, done: false };
    setLanguage(nextLanguage); setLimit(nextLimit); setPassage(pickPassage(nextLanguage));
    setValue(''); setCounts({ attempts: 0, mistakes: 0 }); setElapsed(0); setStatus('idle');
  }
  function begin() {
    if (clock.current.done || status === 'paused' || clock.current.started !== null) return;
    clock.current.started = performance.now(); setStatus('running');
  }
  function change(next: string) {
    if (clock.current.done || status === 'paused') return;
    if (limit && time() >= limit * 1000) { finish(); return; }
    if (next === value) return;
    begin(); const updated = countInput(value, next, passage.text, counts);
    setValue(next); setCounts(updated);
    if (next === passage.text) finish(next, updated);
  }
  const stats = metrics(value, passage.text, elapsed, counts);
  const busy = status === 'running' || status === 'paused';
  return <section aria-label="自由练习">
    <div className="section-heading"><div><h1>把节奏，交给指尖。</h1><p>先打准，再打快。每一次练习，都算数。</p></div><span className={`status status-${status}`}>{({ idle: '等待输入', running: '正在练习', paused: '已暂停', done: '练习完成' })[status]}</span></div>
    <div className="practice-toolbar"><div className="segmented" aria-label="练习语言"><button aria-pressed={language === 'zh'} disabled={busy} onClick={() => reset('zh')}>中文</button><button aria-pressed={language === 'en'} disabled={busy} onClick={() => reset('en')}>English</button></div><label>练习时长 <select value={limit} disabled={busy} onChange={e => reset(language, Number(e.target.value))}><option value={30}>30 秒</option><option value={60}>60 秒</option><option value={120}>120 秒</option><option value={0}>完整短文</option></select></label><button className="text-button" onClick={() => reset()}>换一篇 / 重新开始</button></div>
    <div className="workspace"><div className="metrics"><div><strong>{language === 'zh' ? stats.cpm : stats.wpm}</strong><span>{language === 'zh' ? '字 / 分' : 'WPM'}</span></div><div><strong>{stats.accuracy}<small>%</small></strong><span>准确率</span></div><div><strong>{limit ? Math.max(0, limit - Math.floor(elapsed / 1000)) : Math.floor(elapsed / 1000)}<small>s</small></strong><span>{limit ? '剩余时间' : '已用时间'}</span></div><p>{passage.title}</p></div>
      <TypingInput target={passage.text} value={value} onChange={change} onBegin={begin} disabled={status === 'done' || status === 'paused'} />
      <div className="progress-row"><progress max={100} value={stats.progress} aria-label="练习完成进度" /><span>{stats.correct} / {Array.from(passage.text).length} 字符</span></div>
      {status === 'paused' && <div className="notice" role="status">离开页面时已暂停计时。<button onClick={() => { clock.current.started = performance.now(); setStatus('running'); }}>继续练习</button></div>}
      {status === 'done' && <div className="result-banner" role="status"><div><h2>{value === passage.text ? '完整打完，漂亮！' : '时间到，休息一下。'}</h2><p>本轮 {stats.correct} 个正确字符，累计 {counts.mistakes} 次错误。成绩已加入本次记录。</p></div><button className="primary" onClick={() => reset()}>再练一次</button></div>}
    </div><div className="practice-notes"><p><span className="keycap">A</span> 首次输入开始计时，切到后台自动暂停。</p><p>英文 WPM = 每分钟正确字符 ÷ 5；中文按字 / 分统计。</p></div>
  </section>;
}
