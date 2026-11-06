import { createRoot } from 'react-dom/client';
import { initialize, sdk } from './platform';
import './styles.css';

const root = createRoot(document.getElementById('root')!);
root.render(<main><h1>键走如飞 <small>KeyFly</small></h1><p>正在准备练习空间…</p></main>);
initialize().then(({ user, dispose }) => {
  window.addEventListener('pagehide', dispose, { once: true });
  root.render(<main><h1>键走如飞 <small>KeyFly</small></h1><p>{user?.name || '欢迎'}，微应用已就绪。</p></main>);
}).catch(() => {
  root.render(<main><h1>键走如飞</h1><p role="alert">社区连接暂时不可用，请关闭后重新打开应用。</p></main>);
}).finally(() => { void sdk?.lifecycle.ready().catch(() => {}); });
