import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { initialize, sdk } from './platform';
import './styles.css';
import { App } from './App';

const root = createRoot(document.getElementById('root')!);
root.render(<main><h1>键走如飞 <small>KeyFly</small></h1><p>正在准备练习空间…</p></main>);
initialize().then(({ user, dispose }) => {
  window.addEventListener('pagehide', dispose, { once: true });
  // 平台 ready 必须发生在首屏实际挂载后，而不是 React 排队渲染后。
  flushSync(() => root.render(<App user={user} />));
}).catch(() => {
  flushSync(() => root.render(<main><h1>键走如飞</h1><p role="alert">社区连接暂时不可用，请关闭后重新打开应用。</p></main>));
}).finally(() => { void sdk?.lifecycle.ready().catch(() => {}); });
