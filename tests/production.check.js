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
    const params = new URLSearchParams(location.search), slowRead = params.has('slow-read');
    const saved = params.get('saved');
    const old = JSON.stringify([{ at: 1, language: 'en', seconds: 30, duration: 30, cpm: 20, wpm: 4, accuracy: 80, mode: 'practice' }]);
    window.__records = saved ? { 'history.42': saved } : slowRead ? { 'history.42': old } : {};
    window.__writes = [];
    window.__ready = false;
    window.miniApp = {
      ready: Promise.resolve(),
      permissions: { has: () => !guest },
      lifecycle: { ready: async () => { window.__ready = !!document.querySelector('textarea'); } },
      user: { getCurrent: async () => ({ id: 42, username: 'sdk-tester', name: '测试用户', avatarUrl: null }) },
      theme: { get: async () => ({ mode: 'dark', reducedMotion: false }), onChange: callback => { window.__theme = callback; return () => {}; } },
      localStorage: {
        getItem: key => {
          const value = window.__records[key] ?? null;
          // 让读取保持未完成，直到练习结束后再明确释放或拒绝。
          return slowRead ? new Promise((resolve, reject) => {
            window.__finishRead = () => resolve(value);
            window.__rejectRead = () => reject(new Error('Simulated storage read failure'));
          }) : Promise.resolve(value);
        },
        setItem: async (key, value) => { window.__writes.push({ key, value }); window.__records[key] = value; },
      },
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
  async function finishWhileReading() {
    await page.waitForFunction(() => typeof window.__finishRead === 'function');
    await page.getByRole('button', { name: '30 秒', exact: true }).click();
    const input = page.getByRole('textbox');
    const target = await input.getAttribute('aria-description');
    await input.pressSequentially(target[0]);
    await page.clock.fastForward(31000);
    await page.getByRole('heading', { name: '时间到，休息一下。' }).waitFor();
    check(await page.evaluate(() => window.__writes.length) === 0, 'pending read allowed an unsafe overwrite');
  }
  // 先安装时钟再挂载应用，确保练习的 interval 也受同一虚拟时钟控制。
  await page.clock.install();
  await load();
  check(await page.getByText('sdk-tester', { exact: true }).isVisible(), 'SDK username missing');
  check(await page.locator('html').getAttribute('data-theme') === 'dark', 'SDK theme missing');
  await page.getByRole('button', { name: '30 秒', exact: true }).click();
  const input = page.getByRole('textbox');
  check(await input.getAttribute('wrap') === 'off', 'production check did not load the current single-line input');
  await input.focus();
  async function capsState(enabled) {
    await input.evaluate((el, enabled) => {
      for (const type of ['keydown', 'keyup']) el.dispatchEvent(new KeyboardEvent(type, { bubbles: true, key: 'CapsLock', code: 'CapsLock', modifierCapsLock: enabled }));
    }, enabled);
  }
  await capsState(true);
  await page.waitForFunction(() => !document.querySelector('[data-code="ShiftRight"]').classList.contains('next'));
  check(await input.inputValue() === '', 'production Caps Lock event modified the input');
  await capsState(false);
  await page.locator('[data-code="ShiftRight"].next').waitFor();
  let target = await input.getAttribute('aria-description'), first = target[0];
  await input.pressSequentially(`${first}x`);
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Control+z');
  check(await input.inputValue() === `${first}x` && await page.locator('.metrics strong').nth(1).textContent() === '50%', 'production undo recounted the restored mistake');
  await page.keyboard.press('Control+z');
  await page.keyboard.press('Control+Shift+z');
  check(await input.inputValue() === `${first}x` && await page.locator('.metrics strong').nth(1).textContent() === '50%', 'production redo recounted typing');
  const densitySession = await page.context().newCDPSession(page);
  try {
    for (const deviceScaleFactor of [2, 3, 1.25, 1]) {
      await densitySession.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor, mobile: false });
      await input.pressSequentially('x');
      await page.waitForFunction(() => {
        const canvas = document.querySelector('canvas'), rect = canvas.getBoundingClientRect();
        return canvas.width === Math.round(rect.width * Math.min(devicePixelRatio, 2));
      });
    }
  } finally {
    await densitySession.send('Emulation.clearDeviceMetricsOverride');
    await densitySession.detach();
  }
  await load();
  await page.getByRole('button', { name: '30 秒', exact: true }).click();
  // 切换时长会重新抽题，后续断言必须使用新题面。
  target = await input.getAttribute('aria-description'); first = target[0];
  await input.pressSequentially(first.repeat(3));
  await page.keyboard.press('Home');
  await page.keyboard.press(`Shift+${first}`);
  check(await page.locator('.metrics strong').nth(1).textContent() === '50%', 'production insertion lost its true edit range');
  await page.keyboard.press('Home');
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press(`Shift+${first}`);
  check(await page.locator('.metrics strong').nth(1).textContent() === '60%', 'production same-value replacement was ignored');
  // 同值替换后光标停在词首，先回到已输入末尾，不能要求未来空格显示提示。
  await page.keyboard.press('End');
  const space = page.locator(`[data-position="${target.indexOf(' ')}"]`);
  check(await space.textContent() === ' ' && await space.evaluate(el => getComputedStyle(el, '::after').content.includes('·')), 'production space cue changed text or did not render');
  await page.clock.fastForward(1000);
  check(await page.locator('canvas').evaluate(el => el.getContext('2d').getImageData(0, 0, el.width, el.height).data.every((value, i) => i % 4 !== 3 || value === 0)), 'production particles outlived their real-time deadline');
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
  await load('?slow-read');
  await finishWhileReading();
  await page.evaluate(() => window.__finishRead());
  await page.getByRole('button', { name: '练习记录', exact: true }).click();
  await page.getByRole('dialog', { name: '练习记录' }).waitFor();
  await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 2);
  const stored = await page.evaluate(() => window.__records['history.42']);
  const merged = JSON.parse(stored);
  check(await page.evaluate(() => window.__writes.length) === 1 && merged.length === 2 && merged[0].at > 1 && merged[1].at === 1, 'result completed during read was not saved with old history');
  // 用实际写入的快照重新启动，验证读取链路能恢复刚补写的两条记录。
  await load(`?saved=${encodeURIComponent(stored)}`);
  await page.getByRole('button', { name: '练习记录', exact: true }).click();
  await page.getByRole('dialog', { name: '练习记录' }).waitFor();
  await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 2);
  check(await page.evaluate(() => window.__writes.length) === 0, 'loading saved records rewrote history unnecessarily');
  await load('?slow-read');
  await finishWhileReading();
  await page.evaluate(() => window.__rejectRead());
  await page.getByRole('alert').waitFor();
  check(await page.evaluate(() => window.__writes.length === 0 && JSON.parse(window.__records['history.42'])[0].at === 1), 'failed read overwrote the original history');
  await load('?guest');
  await page.getByRole('alert').waitFor();
  check(await page.getByText('访客', { exact: true }).isVisible(), 'guest fallback missing');
  check(await page.getByRole('alert').isVisible(), 'storage refusal was hidden');
  check(await page.getByRole('textbox').isEnabled(), 'storage refusal blocked typing');
  check(errors.length === 0, errors.join('\n'));
  await page.goto(base);
  console.log('PASS: production IIFE, SDK user/theme/storage/lifecycle, exact deadline, no duplicate save, denied storage fallback.');
}
