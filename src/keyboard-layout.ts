export interface KeyDef { code: string; label: string; width?: 'wide' | 'shift' | 'space' }
const letters = (text: string): KeyDef[] => [...text].map(char => ({ code: `Key${char}`, label: char }));
export const keyRows: KeyDef[][] = [
  [{ code: 'Backquote', label: '`' }, ...[...'1234567890'].map(n => ({ code: `Digit${n}`, label: n })), { code: 'Minus', label: '-' }, { code: 'Equal', label: '=' }, { code: 'Backspace', label: 'Backspace', width: 'wide' }],
  [{ code: 'Tab', label: 'Tab', width: 'wide' }, ...letters('QWERTYUIOP'), { code: 'BracketLeft', label: '[' }, { code: 'BracketRight', label: ']' }, { code: 'Backslash', label: '\\' }],
  [{ code: 'CapsLock', label: 'Caps', width: 'wide' }, ...letters('ASDFGHJKL'), { code: 'Semicolon', label: ';' }, { code: 'Quote', label: "'" }, { code: 'Enter', label: 'Enter', width: 'wide' }],
  [{ code: 'ShiftLeft', label: 'Shift', width: 'shift' }, ...letters('ZXCVBNM'), { code: 'Comma', label: ',' }, { code: 'Period', label: '.' }, { code: 'Slash', label: '/' }, { code: 'ShiftRight', label: 'Shift', width: 'shift' }],
  [{ code: 'Space', label: 'Space', width: 'space' }],
];
const punctuation: Record<string, string> = { '`': 'Backquote', '-': 'Minus', '=': 'Equal', '[': 'BracketLeft', ']': 'BracketRight', '\\': 'Backslash', ';': 'Semicolon', "'": 'Quote', ',': 'Comma', '.': 'Period', '/': 'Slash', ' ': 'Space' };
const shifted: Record<string, string> = { '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=', '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/' };
// 左手负责的键；提示 Shift 时点亮对侧的那只。
const leftHand = new Set('`12345qwertasdfgzxcvb');
export function hintCodes(char: string): string[] {
  const base = shifted[char] ?? char.toLowerCase();
  const code = /^[a-z]$/.test(base) ? `Key${base.toUpperCase()}` : /^\d$/.test(base) ? `Digit${base}` : punctuation[base];
  if (!code) return [];
  return /^[A-Z]$/.test(char) || Object.hasOwn(shifted, char) ? [code, leftHand.has(base) ? 'ShiftRight' : 'ShiftLeft'] : [code];
}
export interface KeyFeedback { code: string; ok: boolean; sequence: number }
export function typingEnergy(strokes: number[], now: number) {
  const recent = strokes.filter(time => time > now - 2400 && time <= now);
  const energy = Math.min(1, recent.length / 24);
  return { recent, energy, tier: energy >= .85 ? 3 : energy >= .5 ? 2 : energy >= .2 ? 1 : 0 };
}
