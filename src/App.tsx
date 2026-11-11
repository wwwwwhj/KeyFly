import { useEffect, useRef, useState } from 'react';
import { Practice } from './Practice';
import { parseHistory, rankedHistory, type Result } from './history';
import { readStorage, writeStorage, type User } from './platform';
import { DurationSwitch } from './DurationSwitch';

export function App({ user }: { user: User | null }) {
  const [panel, setPanel] = useState<'ranking' | 'history' | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [history, setHistory] = useState<Result[]>([]);
  const [duration, setDuration] = useState(60);
  const [storageError, setStorageError] = useState('');
  const loaded = useRef(false);
  const historyRef = useRef<Result[]>([]);
  const queue = useRef(Promise.resolve());
  const key = `history.${user?.id ?? 'guest'}`;
  useEffect(() => {
    // 原生模态框负责焦点约束、Esc 关闭和关闭后的焦点恢复。
    if (panel) dialog.current?.showModal();
    else dialog.current?.close();
    const previousOverflow = document.body.style.overflow;
    if (panel) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [panel]);
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
  const records = panel === 'ranking' ? rankedHistory(history, 'en', duration) : history;
  const username = user?.username || user?.name || '访客';
  return <div className="app-shell">
    <main>
      <div className="app-toolbar">
        <div className="record-actions">
          <button className="text-button" aria-haspopup="dialog" onClick={() => setPanel('ranking')}>个人排行</button>
          <button className="text-button" aria-haspopup="dialog" onClick={() => setPanel('history')}>练习记录</button>
        </div>
        <div className="account" aria-label="当前社区用户">
          {user?.avatarUrl ? <img className="avatar" src={user.avatarUrl} alt="" /> : <span className="avatar avatar-fallback" aria-hidden="true">{Array.from(username)[0]}</span>}
          <span title={username}>{username}</span>
        </div>
      </div>
      {storageError && <p className="notice" role="alert">{storageError}</p>}
      <Practice onResult={onResult} active={panel === null} />
      <dialog ref={dialog} className="records-dialog" aria-labelledby="records-title" onClose={() => setPanel(null)}>
        <div className="dialog-heading">
          <h2 id="records-title">{panel === 'ranking' ? '个人排行' : '练习记录'}</h2>
          <button className="icon-button" aria-label="关闭弹窗" title="关闭" autoFocus onClick={() => setPanel(null)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
        </div>
        <p className="dialog-description">{panel === 'ranking' ? '最近 20 次练习中的英文个人排名，按设定时长比较。' : '最近 20 次成绩，保存在当前浏览器与当前账号下。'}</p>
        {panel === 'ranking' && <div className="practice-toolbar"><DurationSwitch value={duration} onChange={setDuration} /></div>}
        {records.length === 0 ? <div className="empty">
          <h3>{panel === 'ranking' && history.length ? '这个分组还没有成绩' : '还没有练习记录'}</h3>
          <p>完成一次练习，就能在这里查看速度和准确率。</p>
          <button className="primary" onClick={() => setPanel(null)}>返回练习</button>
        </div> : <div className="table-wrap"><table>
          <caption className="sr-only">{panel === 'ranking' ? '个人成绩排行' : '最近练习成绩'}</caption>
          <thead><tr>{panel === 'ranking' && <th>名次</th>}<th>时间</th><th>语言</th><th>速度</th><th>准确率</th><th>用时 / 设定</th></tr></thead>
          <tbody>{records.map((r, i) => <tr key={`${r.at}-${i}`}>
            {panel === 'ranking' && <td><span className={i === 0 ? 'rank-best' : ''}>{i + 1}</span></td>}
            <td>{new Date(r.at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
            <td>{r.language === 'zh' ? '中文' : 'English'}</td>
            <td>{r.language === 'zh' ? `${r.cpm} 字/分` : `${r.wpm} WPM`}</td><td>{r.accuracy}%</td>
            <td>{r.seconds}s / {r.duration ? `${r.duration}s` : '全文'}</td>
          </tr>)}</tbody>
        </table></div>}
        <p className="records-note">记录不会跨设备同步；清除浏览器数据后，本地记录可能丢失。</p>
      </dialog>
    </main>
    <footer>键走如飞 · KeyFly</footer>
  </div>;
}
