import { getSDK, type MiniAppSDK, type MiniAppTheme, type MiniAppUser } from '@discourse-mini-app/sdk';

// 原生浏览器能力只存在于 Vite 开发分支，生产包不能绕过平台代理。
export const sdk: MiniAppSDK | null = import.meta.env.DEV ? null : getSDK();
export type User = MiniAppUser;

export function applyTheme(theme: Pick<MiniAppTheme, 'mode' | 'reducedMotion'>) {
  document.documentElement.dataset.theme = theme.mode;
  document.documentElement.dataset.motion = theme.reducedMotion ? 'reduced' : 'full';
}

export async function initialize(): Promise<{ user: User | null; dispose: () => void }> {
  if (import.meta.env.DEV) {
    applyTheme({ mode: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light', reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches });
    return { user: null, dispose: () => {} };
  }
  await sdk!.ready;
  let dispose = () => {};
  if (sdk!.permissions.has('theme.read')) {
    applyTheme(await sdk!.theme.get());
    dispose = sdk!.theme.onChange(applyTheme);
  }
  try {
    const user = sdk!.permissions.has('user.read') ? await sdk!.user.getCurrent() : null;
    return { user, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}

export async function readStorage(key: string) {
  if (import.meta.env.DEV) return localStorage.getItem(`keyfly:${key}`);
  if (!sdk!.permissions.has('storage.read')) throw new Error('未获准读取练习记录');
  return sdk!.localStorage.getItem(key);
}

export async function writeStorage(key: string, value: string) {
  if (import.meta.env.DEV) { localStorage.setItem(`keyfly:${key}`, value); return; }
  if (!sdk!.permissions.has('storage.write')) throw new Error('未获准保存练习记录');
  await sdk!.localStorage.setItem(key, value);
}
