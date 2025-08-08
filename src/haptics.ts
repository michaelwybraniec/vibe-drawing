import { supportsVibration } from './capabilities.js';
import { getFlag } from './flags.js';

let lastVibrateTs = 0;
const MIN_INTERVAL_MS = 30;
const MIN_DURATION_MS = 5;
const MAX_DURATION_MS = 30;
const SPEED_SCALE = 200; // tune: px/ms → [0,1]

function mapSpeedToDuration(speed: number | undefined): number {
  if (speed == null) return 0;
  const norm = Math.max(0, Math.min(1, speed * SPEED_SCALE));
  const duration = Math.round(MAX_DURATION_MS - (MAX_DURATION_MS - MIN_DURATION_MS) * norm);
  return Math.max(MIN_DURATION_MS, Math.min(MAX_DURATION_MS, duration));
}

export function vibrateForSpeed(speed: number | undefined): void {
  if (!getFlag('hapticsEnabled')) return;
  if (!supportsVibration()) return;
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (now - lastVibrateTs < MIN_INTERVAL_MS) return;
  lastVibrateTs = now;
  const duration = mapSpeedToDuration(speed);
  if (duration > 0) navigator.vibrate(duration);
}

export function stopVibration(): void {
  if (!supportsVibration()) return;
  navigator.vibrate(0);
} 