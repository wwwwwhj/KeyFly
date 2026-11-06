import { useEffect, useRef, useState } from 'react';
import { Practice } from './Practice';
import { parseHistory, rankedHistory, type Result } from './history';
import { readStorage, writeStorage, sdk, type User } from './platform';
import type { Language } from './content';

export function App({ user }: { user: User | null }) {
  const [tab, setTab] = useState('practice');
  const [history, setHistory] = useState<Result[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const [duration, setDuration] = useState(60);
  const [storageError, setStorageError] = useState('');
  const loaded = useRef(false);
  const historyRef = useRef<Result[]>([]);
  const queue = useRef(Promise.resolve());
  const key = `history.${user?.id ?? 'guest'}`;
  useEffect(() => {
    let active = true;
    readStorage(key).then(raw => {
      const records = parseHistory(raw);
      if (active) {
        // 读取期间完成的成绩不能被旧数据覆盖。
        const merged = [...historyRef.current, ...records].slice(0, 20);
        historyRef.current = merged;
        setHistory(merged);
        loaded.current = true;
      }
    }).catch(() => { if (active) setStorageError('无法读取已存记录。本次成绩仍可查看，但不会覆盖原有记录。'); });
    return () => { active = false; };
  }, [key]);

  function onResult(result: Result) {
    // 显式选择字段并限制数量，保持 SDK 每个值 4 KiB 的存储预算。
    const item: Result = {
      at: result.at, language: result.language, seconds: result.seconds, duration: result.duration,
      cpm: result.cpm, wpm: result.wpm, accuracy: result.accuracy, mode: result.mode,
    };
    const next = [item, ...historyRef.current].slice(0, 20);
    historyRef.current = next;
    setHistory(next);
    if (loaded.current) {
      queue.current = queue.current.then(() => writeStorage(key, JSON.stringify(next)))
        .catch(() => setStorageError('记录保存失败。本次成绩仍在页面中；请检查浏览器存储权限后再练习。'));
    }
  }
  const records = tab === 'ranking' ? rankedHistory(history, language, duration) : history;
  return <div className="app-shell">
    <header className="app-header">
      <a className="brand" href="#" onClick={e => { e.preventDefault(); setTab('practice'); }} aria-label="键走如飞首页">
        <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 8v24M12 21 29 8M12 21l17 11M23 17h10M27 23h8" /></svg>
        <span>键走如飞<small>KeyFly</small></span>
      </a>
      <span className="account">
        {user?.avatarUrl ? <img className="avatar" src={user.avatarUrl} alt="" /> : <span className="online-dot" />}
        {user?.name || user?.username || (sdk ? '访客练习' : '本地开发')}
      </span>
    </header>
    <nav className="main-nav" aria-label="主要功能">
      <button aria-current={tab === 'practice' ? 'page' : undefined} onClick={() => setTab('practice')}>自由练习</button>
      <button aria-current={tab === 'ranking' ? 'page' : undefined} onClick={() => setTab('ranking')}>个人排行</button>
      <button aria-current={tab === 'history' ? 'page' : undefined} onClick={() => setTab('history')}>练习记录</button>
      <span>让每一次敲击，都向前一点。</span>
    </nav>
    <main>
      {storageError && <p className="notice" role="alert">{storageError}</p>}
      <div hidden={tab !== 'practice'}><Practice onResult={onResult} active={tab === 'practice'} /></div>
      {tab !== 'practice' && <section>
        <div className="section-heading"><div>
          <h1>{tab === 'ranking' ? '和更好的自己，见面。' : '看见自己的进步。'}</h1>
          <p>{tab === 'ranking' ? '最近 20 次练习中的个人排名，按同语言、同设定时长比较。此榜单仅属于你。' : '最近 20 次成绩，保存在当前浏览器与当前账号下。'}</p>
        </div></div>
        {tab === 'ranking' && <div className="practice-toolbar">
          <div className="segmented" aria-label="排行语言">
            <button aria-pressed={language === 'zh'} onClick={() => setLanguage('zh')}>中文</button>
            <button aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button>
          </div>
          <label>设定时长 <select value={duration} onChange={e => setDuration(Number(e.target.value))}>
            <option value={30}>30 秒</option><option value={60}>60 秒</option><option value={120}>120 秒</option><option value={0}>完整短文</option>
          </select></label>
        </div>}
        {records.length === 0 ? <div className="empty">
          <h2>{tab === 'ranking' && history.length ? '这个分组，还等着你的第一场。' : '第一段记录，从这里开始。'}</h2>
          <p>完成一次练习，就能在这里查看速度和准确率。</p>
          <button className="primary" onClick={() => setTab('practice')}>开始练习</button>
        </div> : <div className="table-wrap"><table>
          <caption className="sr-only">{tab === 'ranking' ? '个人成绩排行' : '最近练习成绩'}</caption>
          <thead><tr>{tab === 'ranking' && <th>名次</th>}<th>时间</th><th>语言</th><th>速度</th><th>准确率</th><th>用时 / 设定</th></tr></thead>
          <tbody>{records.map((r, i) => <tr key={`${r.at}-${i}`}>
            {tab === 'ranking' && <td><span className={i === 0 ? 'rank-best' : ''}>{i + 1}</span></td>}
            <td>{new Date(r.at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
            <td>{r.language === 'zh' ? '中文' : 'English'}</td>
            <td>{r.language === 'zh' ? `${r.cpm} 字/分` : `${r.wpm} WPM`}</td><td>{r.accuracy}%</td>
            <td>{r.seconds}s / {r.duration ? `${r.duration}s` : '全文'}</td>
          </tr>)}</tbody>
        </table></div>}
        <p className="records-note">记录不会跨设备同步；清除浏览器数据后，本地记录可能丢失。</p>
      </section>}
    </main>
    <footer><span>键走如飞 · KeyFly</span><span>专注当下，自有回响。</span></footer>
  </div>;
}
