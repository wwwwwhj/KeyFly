import type { Language } from './content';
export interface Result { at: number; language: Language; seconds: number; cpm: number; wpm: number; accuracy: number; mode: 'practice' | 'race' }
export function parseHistory(raw: string | null): Result[] {
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error('练习记录格式不正确');
  return value.filter((item): item is Result => {
    if (!item || typeof item !== 'object') return false;
    const r = item as Result;
    return (r.language === 'zh' || r.language === 'en') && (r.mode === 'practice' || r.mode === 'race') &&
      [r.at, r.seconds, r.cpm, r.wpm, r.accuracy].every(n => Number.isFinite(n) && n >= 0) && r.accuracy <= 100;
  }).slice(0, 20);
}
