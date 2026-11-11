// 在开发服务器页面运行：playwright-cli run-code --filename tests/feedback.check.js。
async (page) => {
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const base = new URL(page.url()).origin;
  const input = page.getByRole('textbox', { name: '英文打字练习' });
  const accuracy = () => page.locator('.metrics strong').nth(1).textContent();
  await page.goto(base);
  async function capsState(locator, enabled) {
    await locator.evaluate((el, enabled) => {
      for (const type of ['keydown', 'keyup']) el.dispatchEvent(new KeyboardEvent(type, { bubbles: true, key: 'CapsLock', code: 'CapsLock', modifierCapsLock: enabled }));
    }, enabled);
  }
  await input.focus();
  await capsState(input, true);
  await page.waitForFunction(() => !document.querySelector('[data-code="ShiftRight"]').classList.contains('next'));
  check(await input.inputValue() === '' && await page.locator('.heat-meter').getAttribute('aria-label') === '敲击热度 0%', 'Caps Lock changed input or typing heat');
  await page.goto(base);
  await input.fill('A ');
  await capsState(input, true);
  await page.locator('[data-code="KeyL"].next').waitFor();
  await page.locator('[data-code="ShiftLeft"].next').waitFor();
  await page.locator('.keyboard-panel').screenshot({ path: 'output/playwright/caps-lowercase.png' });
  await page.getByText('显示与练习说明', { exact: true }).click();
  check(await page.locator('[data-code="ShiftLeft"]').evaluate(el => el.classList.contains('next')), 'leaving input forgot the known Caps Lock state');
  await page.getByRole('button', { name: '练习记录', exact: true }).click();
  await page.getByRole('dialog', { name: '练习记录' }).waitFor();
  await capsState(page.getByRole('button', { name: '关闭弹窗' }), false);
  await page.waitForFunction(() => !document.querySelector('[data-code="ShiftLeft"]').classList.contains('next'));
  await page.keyboard.press('Escape');
  await page.goto(base);
  await input.pressSequentially('AAA');
  await page.keyboard.press('Home');
  await page.keyboard.press('Shift+A');
  check(await page.locator('[data-code="KeyA"]').evaluate(el => el.classList.contains('correct')), 'correct insertion in repeated characters was marked wrong');
  check(await accuracy() === '50%', 'repeated insertion used a guessed position for scoring');
  await page.keyboard.press('Home');
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('Shift+A');
  check(await input.inputValue() === 'AAAA' && await accuracy() === '60%', 'same-value replacement did not count once');
  await page.keyboard.press('Home');
  await page.keyboard.press('Shift+ArrowRight');
  await input.evaluate(el => {
    const original = el.value;
    const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    setValue.call(el, '键' + original.slice(1));
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertCompositionText', data: '键', isComposing: true }));
    setValue.call(el, original);
    el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '' }));
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertCompositionText', data: null }));
  });
  check(await accuracy() === '60%', 'cancelled composition counted restored selection as new input');

  // 空格标记仅参与绘制，不能进入原文、输入值或计分，也不能改变字符宽度。
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const theme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'no-preference' });
    await page.goto(base);
    await input.pressSequentially('A');
    const space = page.locator('[data-position="1"]');
    const width = await space.evaluate(el => el.getBoundingClientRect().width);
    check(await space.textContent() === ' ' && await space.getAttribute('data-space') === 'true', 'space cue replaced the real target character');
    check(await space.evaluate(el => getComputedStyle(el, '::after').content.includes('·')), 'current space is not visible');
    const original = await input.getAttribute('aria-description');
    check((await page.locator('.word-letters').allTextContents()).join('') === original, 'visual cue changed passage text');
    await page.locator('.typing-surface').screenshot({ path: `output/playwright/space-current-${theme}.png`, animations: 'disabled' });
    await page.keyboard.press('x');
    check(await space.evaluate(el => el.classList.contains('char-error') && getComputedStyle(el, '::after').color === getComputedStyle(el).color), 'wrong space cue lost its error color');
    check(await space.evaluate(el => el.getBoundingClientRect().width) === width, 'space cue changed character geometry');
    await page.locator('.typing-surface').screenshot({ path: `output/playwright/space-error-${theme}.png`, animations: 'disabled' });
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Space');
    check(await input.inputValue() === 'A ' && await accuracy() === '67%', 'space correction changed input or historical accuracy');
    check(await space.evaluate(el => getComputedStyle(el, '::after').content) === 'none', 'completed space kept a decorative cue');
    const period = original.indexOf('.');
    await input.fill(original.slice(0, period));
    check(await page.locator('.char-caret').textContent() === '.', 'punctuation caret did not match target');
    check(await page.locator('[data-code="Period"]').evaluate(el => el.classList.contains('next')), 'punctuation key hint did not match target');
    await page.keyboard.press('.');
    check(await input.inputValue() === original.slice(0, period + 1) && await page.locator('.char-caret').getAttribute('data-space') === 'true', 'cross-sentence space cue lost its position');
  }
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });

  // 满长度时插入不得截掉尾部，但选区替换仍可继续纠错。
  await page.goto(base);
  const target = await input.getAttribute('aria-description');
  const full = 'A'.repeat(Array.from(target).length - 1) + 'Z';
  await input.fill(full);
  await page.keyboard.press('Home');
  check(await input.evaluate(el => el.selectionStart === 0 && el.selectionEnd === 0), 'Home stopped at an invisible wrapped line');
  await page.keyboard.press('End');
  check(await input.evaluate(el => el.selectionStart === el.value.length), 'End stopped before the actual end');
  await page.keyboard.press('Home');
  await page.keyboard.press('x');
  check(await input.inputValue() === full, 'inserting at the limit deleted an unselected tail');
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('Shift+A');
  check(await page.locator('[data-code="KeyA"]').evaluate(el => el.classList.contains('correct')), 'full-length same-value correction was ignored');

  // 模拟 IME 的草稿和最终同值 input，确保不把候选过程或重复事件算作额外尝试。
  await page.goto(base);
  await input.focus();
  await input.evaluate(el => {
    el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setValue.call(el, '键');
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertCompositionText', data: '键', isComposing: true }));
    el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '键' }));
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '键' }));
  });
  check(await input.inputValue() === '键', 'composition did not commit');
  await page.keyboard.press('Shift+A');
  check(await accuracy() === '0%', 'composition or subsequent wrong key was miscounted');
  await page.keyboard.press('Control+Home');
  await page.keyboard.press('Delete');
  await page.keyboard.press('Shift+A');
  check(await accuracy() === '33%', 'composition commit was counted more than once');
  await page.goto(base);
  await input.focus();
  await page.keyboard.down('a');
  try {
    for (let i = 0; i < 15; i++) await page.keyboard.down('a');
    check(await input.inputValue() === 'a'.repeat(16), 'held-key input was lost or duplicated');
    check(await accuracy() === '6%', 'held-key attempts disagree with accepted characters');
    check(await page.locator('.heat-meter').getAttribute('aria-label') === '敲击热度 4%', 'automatic repeats inflated typing heat');
  } finally { await page.keyboard.up('a'); }
  check(await page.locator('.keyboard-key.held').count() === 0, 'released repeat key stayed pressed');
  await page.goto(base);
}
