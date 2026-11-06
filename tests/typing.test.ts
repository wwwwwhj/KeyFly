import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countInput, elapsedAt, metrics } from '../src/typing.ts';
import { parseHistory, rankedHistory, type Result } from '../src/history.ts';
import { hintCodes, typingEnergy } from '../src/keyboard-layout.ts';
test('中文组合输入、退格和纠错保留真实准确率', () => {
  const target = '键走如飞';
  let counts = countInput('', '键走入', target, { attempts: 0, mistakes: 0 });
  counts = countInput('键走入', '键走', target, counts);
  counts = countInput('键走', '键走如飞', target, counts);
  assert.deepEqual(counts, { attempts: 5, mistakes: 1 });
  assert.equal(metrics(target, target, 60000, counts).accuracy, 80);
  assert.equal(metrics(target, target, 60000, counts).cpm, 4);
  assert.equal(metrics('a😀', 'a😀', 60000, { attempts: 2, mistakes: 0 }).correct, 2);
  assert.equal(metrics('', target, 0, { attempts: 0, mistakes: 0 }).wpm, 0);
  assert.deepEqual(countInput('abcd', 'abXcd', 'abXcd', { attempts: 4, mistakes: 0 }), { attempts: 5, mistakes: 0 });
  assert.deepEqual(countInput('abXcd', 'abcd', 'abcd', { attempts: 5, mistakes: 1 }), { attempts: 5, mistakes: 1 });
});
test('截止时间不被后台轮询延迟放大，暂停不累加', () => {
  assert.equal(elapsedAt(1000, 5000, 100000, 60000), 60000);
  assert.equal(elapsedAt(null, 5000, 100000, 60000), 5000);
});
test('键位提示支持对侧 Shift，热度随速度升级并在停止后衰减', () => {
  assert.deepEqual(hintCodes('A'), ['KeyA', 'ShiftRight']);
  assert.deepEqual(hintCodes('?'), ['Slash', 'ShiftLeft']);
  assert.deepEqual(hintCodes(' '), ['Space']);
  assert.deepEqual(hintCodes('中'), []);
  const strokes = Array.from({ length: 30 }, (_, i) => 1000 + i * 50);
  assert.equal(typingEnergy(strokes, 2500).tier, 3);
  assert.equal(typingEnergy(strokes, 2500).energy, 1);
  assert.equal(typingEnergy(strokes, 6000).tier, 0);
  assert.equal(typingEnergy(strokes, 6000).recent.length, 0);
});
test('记录过滤坏数据并限制 SDK 存储预算', () => {
  const result: Result = { at: Date.now(), language: 'zh', seconds: 60, duration: 60, cpm: 100, wpm: 20, accuracy: 90, mode: 'practice' };
  const records = parseHistory(JSON.stringify([null, { ...result, accuracy: 101 }, ...Array(25).fill(result)]));
  assert.equal(records.length, 20);
  assert.ok(Buffer.byteLength(JSON.stringify(records)) < 4096);
  assert.throws(() => parseHistory('{bad'));
  const ranked = rankedHistory([result, { ...result, cpm: 120 }, { ...result, language: 'en', cpm: 200 }, { ...result, duration: 30, cpm: 200 }], 'zh', 60);
  assert.deepEqual(ranked.map(r => r.cpm), [120, 100]);
});
