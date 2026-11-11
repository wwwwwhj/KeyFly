// 通过 playwright-cli run-code --filename tests/desktop.check.js 运行；复用现有浏览器工具，不增加应用依赖。
async (page) => {
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  // 在绘制边界采样，校验一次输入只产生一道光波且错误不会混入正确色。
  await page.addInitScript(() => {
    if (window.__waveProbeInstalled) return;
    window.__waveProbeInstalled = true;
    window.__waves = [];
    const raf = window.requestAnimationFrame;
    window.requestAnimationFrame = callback => raf.call(window, now => { window.__frame = (window.__frame ?? 0) + 1; callback(now); });
    const ellipse = CanvasRenderingContext2D.prototype.ellipse;
    CanvasRenderingContext2D.prototype.ellipse = function (...args) {
      window.__waves.push({ frame: window.__frame, color: this.strokeStyle });
      return ellipse.apply(this, args);
    };
  });
  await page.reload();
  await page.setViewportSize({ width: 1440, height: 900 });
  const input = page.getByRole('textbox', { name: '英文打字练习' });
  await input.waitFor();
  check(!await page.locator('.practice-settings').evaluate(el => el.open), 'settings must start collapsed');
  await page.screenshot({ path: 'output/playwright/focus-desktop.png' });
  const target = await input.getAttribute('aria-description');
  const wrong = target[0] === 'x' ? 'y' : 'x';
  await input.focus();
  await page.keyboard.press(wrong);
  await page.waitForFunction(() => window.__waves.length > 0);
  const waves = await page.evaluate(() => window.__waves);
  check(waves.filter(wave => wave.frame === waves[0].frame).length === 1, 'duplicate wave for one keystroke');
  check(waves.every(wave => wave.color === '#ff8c9e'), 'wrong key flashed correct particles');

  // 删除、方向键与选区替换必须同时更新题面位置、键盘提示及原生插入点。
  await page.keyboard.press('Backspace');
  await input.pressSequentially(target.slice(0, 8));
  await page.keyboard.press('Home');
  check(await page.locator('.char-caret').textContent() === target[0], 'caret stayed at the end after Home');
  const firstCode = `Key${target[0].toUpperCase()}`;
  check(await page.locator(`[data-code="${firstCode}"]`).evaluate(el => el.classList.contains('next')), 'key hint did not follow caret');
  await page.keyboard.press('Shift+ArrowRight');
  check(await page.locator('.char-selected').count() === 1, 'native selection is invisible');
  await page.keyboard.press(wrong);
  check(await input.inputValue() === wrong + target.slice(1, 8), 'selection replacement appended instead');
  await page.keyboard.press('Home');
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.insertText(target[0]);
  check(await input.inputValue() === target.slice(0, 8), 'middle correction lost trailing input');
  await page.getByRole('button', { name: '练习记录', exact: true }).click();
  check(await page.locator('.status').textContent() === '已暂停', 'records did not pause practice');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '继续练习' }).click();
  check(await input.evaluate(el => el === document.activeElement), 'resume did not restore typing focus');

  await page.getByRole('button', { name: '换一篇并重新开始' }).click();
  const nextTarget = await input.getAttribute('aria-description');
  await input.pressSequentially(nextTarget.slice(0, 50), { delay: 12 });
  check(await page.locator('.keyboard-panel').getAttribute('data-tier') === '3', 'fast input did not reach highest tier');
  const hasPixels = () => page.locator('canvas').evaluate(el => el.getContext('2d').getImageData(0, 0, el.width, el.height).data.some((value, i) => i % 4 === 3 && value > 0));
  check(await hasPixels(), 'speed particles did not render');
  await page.screenshot({ path: 'output/playwright/focus-fast.png' });
  await page.getByText('显示与练习说明', { exact: true }).click();
  await page.getByRole('checkbox', { name: '速度特效', exact: true }).uncheck();
  check(!await hasPixels(), 'disabling effects left moving particles');
  await page.getByRole('checkbox', { name: '显示屏幕键盘', exact: true }).uncheck();
  check(await page.locator('.keyboard-panel').count() === 0, 'hide keyboard failed');
  await page.getByRole('checkbox', { name: '显示屏幕键盘', exact: true }).check();
  await page.getByRole('checkbox', { name: '速度特效', exact: true }).check();
  await page.getByText('显示与练习说明', { exact: true }).click();

  for (const [width, height] of [[1280, 720], [1920, 1080]]) {
    await page.setViewportSize({ width, height });
    const layout = await page.evaluate(() => {
      const caret = document.querySelector('.char-caret').getBoundingClientRect();
      const passage = document.querySelector('.passage').getBoundingClientRect();
      return { overflow: document.documentElement.scrollWidth > innerWidth,
        offset: Math.abs(caret.left - passage.left - passage.width / 2),
        keyboardBottom: document.querySelector('.keyboard-panel').getBoundingClientRect().bottom };
    });
    check(!layout.overflow && layout.offset < 2, `desktop caret alignment: ${JSON.stringify(layout)}`);
    check(layout.keyboardBottom <= height, `keyboard below fold at ${width}x${height}`);
    if (width === 1280) await page.screenshot({ path: 'output/playwright/focus-compact.png' });
  }
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.reload();
  await input.pressSequentially(target.slice(0, 40), { delay: 8 });
  check(await page.locator('.keyboard-panel').getAttribute('data-tier') === '0', 'reduced motion animated a speed tier');
  check(!await hasPixels(), 'reduced motion rendered particles');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: 'output/playwright/focus-dark.png' });
  check(errors.length === 0, errors.join('\n'));
  console.log('PASS: single validated burst, real selection/caret, pause/resume, speed, settings, desktop layout, dark/reduced motion.');
}
