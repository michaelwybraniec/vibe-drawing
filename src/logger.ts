import { getFlag } from './flags.js';

function isDebug(): boolean {
  try {
    return Boolean(getFlag('debug'));
  } catch {
    return false;
  }
}

export function log(...args: unknown[]): void {
  if (!isDebug()) return;

  console.log('[vibe]', ...args);
}

export function warn(...args: unknown[]): void {
  console.warn('[vibe]', ...args);
}

export function error(...args: unknown[]): void {
  console.error('[vibe]', ...args);
}
