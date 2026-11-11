// 在开发服务器页面运行：playwright-cli run-code --filename tests/feedback.check.js。
async (page) => {
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const base = new URL(page.url()).origin;
  const input = page.getByRole('textbox', { name: '英文打字练习' });
  const accuracy = () => page.locator('.metrics strong').nth(1).textContent();
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

  // 满长度时插入不得截掉尾部，但选区替换仍可继续纠错。
  await page.goto(base);
  const target = await input.getAttribute('aria-description');
  const full = 'A'.repeat(Array.from(target).length - 1) + 'Z';
  await input.fill(full);
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
}
