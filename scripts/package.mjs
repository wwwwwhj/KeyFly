import { readFile } from 'node:fs/promises';
import { pack } from '@discourse-mini-app/sdk/pack';

const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
manifest.id = process.env.MINI_APP_ID || manifest.id;
manifest.version = process.env.MINI_APP_VERSION || manifest.version;
const result = await pack({
  outputDirectory: 'dist/package', manifest,
  files: {
    'index.html': '<div id="root"></div>',
    'app.js': await readFile('dist/web/app.js'),
    'app.css': await readFile('dist/web/app.css'),
    'strings.json': JSON.stringify({ name: '键走如飞', description: '中英文打字练习、计时挑战与个人成绩排行' }),
  },
});
console.log(`已生成 ${result.file} (${result.size} bytes)`);
