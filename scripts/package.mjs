import { readFile } from 'node:fs/promises';
import { pack } from '@discourse-mini-app/sdk/pack';

const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
const endpoint = process.env.KEYFLY_WSS_URL;
if (!endpoint) throw new Error('请在 .env 中设置 KEYFLY_WSS_URL 为真实竞速服务地址，再生成发布包。');
const url = new URL(endpoint);
if (url.protocol !== 'wss:' || url.port || url.pathname !== '/race' || url.search || url.hash || url.username || url.password || !url.hostname.includes('.') || /(^|\.)(localhost|local|internal)$/.test(url.hostname)) {
  throw new Error('KEYFLY_WSS_URL 必须为公开域名的 wss://域名/race，使用默认 443 端口。');
}
manifest.id = process.env.MINI_APP_ID || manifest.id;
manifest.version = process.env.MINI_APP_VERSION || manifest.version;
manifest.websockets = { race: { url: endpoint, auth: 'platform' } };
const result = await pack({
  outputDirectory: 'dist/package', manifest,
  files: {
    'index.html': '<div id="root"></div>',
    'app.js': await readFile('dist/web/app.js'),
    'app.css': await readFile('dist/web/app.css'),
    'strings.json': JSON.stringify({ name: '键走如飞', description: '中英文打字练习与多人实时竞速' }),
  },
});
console.log(`已生成 ${result.file} (${result.size} bytes)`);
