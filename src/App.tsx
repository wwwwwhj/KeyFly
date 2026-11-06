import { useEffect, useRef, useState } from 'react';
import { Practice } from './Practice';
import { parseHistory, type Result } from './history';
import { readStorage, writeStorage, sdk, type User } from './platform';
export function App({ user }: { user: User | null }) {
  const [tab, setTab] = useState('practice');
  const [history, setHistory] = useState<Result[]>([]);
  const [storageError, setStorageError] = useState('');
  const loaded = useRef(false), historyRef = useRef<Result[]>([]), queue = useRef(Promise.resolve());
  const key = `history.${user?.id ?? 'guest'}`;
  useEffect(() => {
    let active = true;
    readStorage(key).then(raw => { const records = parseHistory(raw); if (active) { historyRef.current = records; setHistory(records); loaded.current = true; } })
      .catch(() => { if (active) setStorageError('无法读取已存记录。本次成绩仍可查看，但不会覆盖原有记录。'); });
    return () => { active = false; };
  }, [key]);
  function onResult(result: Result) {
    // 显式选择字段并限制数量，保持 SDK 每个值 4 KiB 的存储预算。
    const item: Result = { at: result.at, language: result.language, seconds: result.seconds, cpm: result.cpm, wpm: result.wpm, accuracy: result.accuracy, mode: result.mode };
    const next = [item, ...historyRef.current].slice(0, 20); historyRef.current = next; setHistory(next);
    if (loaded.current) queue.current = queue.current.then(() => writeStorage(key, JSON.stringify(next))).catch(() => setStorageError('记录保存失败。本次成绩仍在页面中；请检查浏览器存储权限后再练习。'));
  }
  return <div className="app-shell">
    <header className="app-header"><a className="brand" href="#" onClick={e => { e.preventDefault(); setTab('practice'); }} aria-label="键走如飞首页"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 8v24M12 21 29 8M12 21l17 11M23 17h10M27 23h8" /></svg><span>键走如飞<small>KeyFly</small></span></a><span className="account"><span className="online-dot" />{user?.name || (sdk ? '访客练习' : '本地开发')}</span></header>
    <nav className="main-nav" aria-label="主要功能"><button aria-current={tab === 'practice' ? 'page' : undefined} onClick={() => setTab('practice')}>自由练习</button><button aria-current={tab === 'history' ? 'page' : undefined} onClick={() => setTab('history')}>练习记录</button><span>让每一次敲击，都向前一点。</span></nav>
    <main>{storageError && <p className="notice" role="alert">{storageError}</p>}{tab === 'practice' && <Practice onResult={onResult} />}
      {tab === 'history' && <section><div className="section-heading"><div><h1>看见自己的进步。</h1><p>最近 20 次成绩，保存在当前浏览器与当前账号下。</p></div></div>{history.length === 0 ? <div className="empty"><h2>第一段记录，从这里开始。</h2><p>完成一次练习，就能在这里查看速度和准确率。</p><button className="primary" onClick={() => setTab('practice')}>开始练习</button></div> : <div className="table-wrap"><table><caption className="sr-only">最近练习成绩</caption><thead><tr><th>时间</th><th>模式</th><th>语言</th><th>速度</th><th>准确率</th><th>用时</th></tr></thead><tbody>{history.map((r, i) => <tr key={`${r.at}-${i}`}><td>{new Date(r.at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td><td>{r.mode === 'race' ? '多人竞速' : '自由练习'}</td><td>{r.language === 'zh' ? '中文' : 'English'}</td><td>{r.language === 'zh' ? `${r.cpm} 字/分` : `${r.wpm} WPM`}</td><td>{r.accuracy}%</td><td>{r.seconds}s</td></tr>)}</tbody></table></div>}</section>}
    </main><footer><span>键走如飞 · KeyFly</span><span>专注当下，自有回响。</span></footer>
  </div>;
}
