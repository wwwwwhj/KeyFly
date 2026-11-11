export interface Counts { attempts: number; mistakes: number }
// 范围使用字符索引，与计分一致；DOM 的 UTF-16 偏移在输入边界转换。
export interface InputRange { start: number; end: number }
export function countInput(previous: string, next: string, target: string, counts: Counts, range?: InputRange): Counts {
  const before = Array.from(previous), after = Array.from(next), expected = Array.from(target);
  let prefix = range?.start ?? 0, suffix = range ? before.length - range.end : 0;
  // 相同字符的插入位置不能从字符串差异推断；优先使用原生 beforeinput 的替换范围。
  if (!range) {
    while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix++;
    while (suffix < before.length - prefix && suffix < after.length - prefix && before[before.length - 1 - suffix] === after[after.length - 1 - suffix]) suffix++;
  }
  // 回退不抹除历史错误；IME 提交多个汉字时逐字计数，删除不算击键。
  // 选区中间编辑时，未改动的尾部不是新输入，不能重复计入尝试次数。
  const inserted = after.slice(prefix, Math.max(prefix, after.length - suffix));
  return { attempts: counts.attempts + inserted.length,
    mistakes: counts.mistakes + inserted.filter((char, index) => char !== expected[prefix + index]).length };
}
export function metrics(text: string, target: string, elapsedMs: number, counts: Counts) {
  const expected = Array.from(target), actual = Array.from(text);
  const correct = actual.filter((char, index) => char === expected[index]).length;
  const minutes = elapsedMs / 60000;
  return { cpm: minutes > 0 ? Math.round(correct / minutes) : 0,
    wpm: minutes > 0 ? Math.round(correct / 5 / minutes) : 0,
    accuracy: counts.attempts ? Math.round((counts.attempts - counts.mistakes) / counts.attempts * 100) : 100,
    progress: expected.length ? Math.round(correct / expected.length * 100) : 0, correct };
}
export function elapsedAt(started: number | null, accumulated: number, now: number, limitMs: number) {
  const elapsed = accumulated + (started === null ? 0 : Math.max(0, now - started));
  return limitMs ? Math.min(limitMs, elapsed) : elapsed;
}
