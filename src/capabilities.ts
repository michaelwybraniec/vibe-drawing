export function supportsPointerEvents(): boolean {
  return typeof window !== 'undefined' && 'PointerEvent' in window;
}

export function supportsVibration(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

export function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  const dpr = window.devicePixelRatio || 1;
  return Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
}

export function getCapabilities() {
  return {
    pointerEvents: supportsPointerEvents(),
    vibration: supportsVibration(),
    devicePixelRatio: getDevicePixelRatio(),
  } as const;
}
