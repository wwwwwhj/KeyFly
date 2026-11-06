import type { Language } from './content';
export interface Result { at: number; language: Language; seconds: number; duration: number; cpm: number; wpm: number; accuracy: number; mode: 'practice' }
export function parseHistory(raw: string | null): Result[] {
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error('练习记录格式不正确');
  return value.filter((item): item is Result => {
    if (!item || typeof item !== 'object') return false;
    const r = item as Result;
    return (r.language === 'zh' || r.language === 'en') && r.mode === 'practice' &&
      [r.at, r.seconds, r.cpm, r.wpm, r.accuracy].every(n => Number.isFinite(n) && n >= 0) && r.accuracy <= 100;
  }).slice(0, 20).map(r => ({ at: r.at, language: r.language, seconds: r.seconds,
    duration: [0, 30, 60, 120].includes(r.duration) ? r.duration : 0,
    cpm: r.cpm, wpm: r.wpm, accuracy: r.accuracy, mode: r.mode }));
}
export function rankedHistory(records: Result[], language: Language, duration: number) {
  // 同语言、同设定时长比较；同速时先比较准确率，再比较日期，不伪造其他用户。
  return records.filter(r => r.language === language && r.duration === duration)
    .sort((a, b) => b.cpm - a.cpm || b.accuracy - a.accuracy || b.at - a.at);
}
