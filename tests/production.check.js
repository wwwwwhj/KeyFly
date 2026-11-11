// 在开发服务器页面用 playwright-cli run-code --filename tests/production.check.js 运行，先执行 npm run package。
async (page) => {
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const base = new URL(page.url()).origin;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/keyfly-production-check*', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="UTF-8"><link rel="icon" href="data:,"></head><body><div id="root"></div></body></html>' }));
  // 直接读取本次构建，避免开发服务器对 dist 的转换缓存让验收误用旧 bundle。
  await page.route('**/keyfly-production-assets/app.js', route => route.fulfill({ path: 'dist/web/app.js', contentType: 'application/javascript' }));
  await page.route('**/keyfly-production-assets/app.css', route => route.fulfill({ path: 'dist/web/app.css', contentType: 'text/css' }));
  await page.addInitScript(() => {
    if (!location.pathname.startsWith('/keyfly-production-check')) return;
    const guest = location.search.includes('guest');
    window.__records = {};
    window.__ready = false;
    window.miniApp = {
      ready: Promise.resolve(),
      permissions: { has: () => !guest },
      lifecycle: { ready: async () => { window.__ready = !!document.querySelector('textarea'); } },
      user: { getCurrent: async () => ({ id: 42, username: 'sdk-tester', name: '测试用户', avatarUrl: null }) },
      theme: { get: async () => ({ mode: 'dark', reducedMotion: false }), onChange: callback => { window.__theme = callback; return () => {}; } },
      localStorage: { getItem: async key => window.__records[key] ?? null, setItem: async (key, value) => { window.__records[key] = value; } },
    };
    // 生产包必须通过 SDK 读写，禁止本地开发分支悄悄落到原生存储。
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Native storage forbidden'); } });
  });
  async function load(suffix = '') {
    await page.goto(`${base}/keyfly-production-check${suffix}`);
    await page.addStyleTag({ url: `${base}/keyfly-production-assets/app.css` });
    await page.addScriptTag({ url: `${base}/keyfly-production-assets/app.js` });
    await page.waitForFunction(() => window.__ready);
  }
  // 先安装时钟再挂载应用，确保练习的 interval 也受同一虚拟时钟控制。
  await page.clock.install();
  await load();
  check(await page.getByText('sdk-tester', { exact: true }).isVisible(), 'SDK username missing');
  check(await page.locator('html').getAttribute('data-theme') === 'dark', 'SDK theme missing');
  await page.getByRole('button', { name: '30 秒', exact: true }).click();
  const input = page.getByRole('textbox');
  check(await input.getAttribute('wrap') === 'off', 'production check did not load the current single-line input');
  const target = await input.getAttribute('aria-description'), first = target[0];
  await input.pressSequentially(first.repeat(3));
  await page.keyboard.press('Home');
  await page.keyboard.press(`Shift+${first}`);
  check(await page.locator('.metrics strong').nth(1).textContent() === '50%', 'production insertion lost its true edit range');
  await page.keyboard.press('Home');
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press(`Shift+${first}`);
  check(await page.locator('.metrics strong').nth(1).textContent() === '60%', 'production same-value replacement was ignored');
  await page.clock.fastForward(31000);
  await page.getByRole('heading', { name: '时间到，休息一下。' }).waitFor();
  check(await page.getByRole('textbox').isDisabled(), 'deadline did not lock input');
  await page.waitForFunction(() => !!window.__records['history.42']);
  const records = await page.evaluate(() => JSON.parse(window.__records['history.42']));
  check(records.length === 1 && records[0].seconds === 30, 'result saved twice or exceeded deadline');
  check(records[0].accuracy === 60, 'saved result disagrees with live input feedback');
  await page.clock.fastForward(10000);
  check(await page.evaluate(() => JSON.parse(window.__records['history.42']).length) === 1, 'finished timer saved duplicate results');
  await page.evaluate(() => window.__theme({ mode: 'light', reducedMotion: true }));
  check(await page.locator('html').getAttribute('data-theme') === 'light', 'theme subscription failed');
  check(await page.locator('html').getAttribute('data-motion') === 'reduced', 'platform motion preference missing');
  await page.clock.resume();
  await load('?guest');
  await page.getByRole('alert').waitFor();
  check(await page.getByText('访客', { exact: true }).isVisible(), 'guest fallback missing');
  check(await page.getByRole('alert').isVisible(), 'storage refusal was hidden');
  check(await page.getByRole('textbox').isEnabled(), 'storage refusal blocked typing');
  check(errors.length === 0, errors.join('\n'));
  await page.goto(base);
  console.log('PASS: production IIFE, SDK user/theme/storage/lifecycle, exact deadline, no duplicate save, denied storage fallback.');
}
