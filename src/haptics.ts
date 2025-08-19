import { supportsVibration } from './capabilities.js';
import { getFlag } from './flags.js';
import { audioStart, audioUpdate, audioStop } from './audioBuzz.js';
import { Capacitor } from '@capacitor/core';
import { NativeHaptics } from './nativeHaptics.js';

let HapticsBasic: any | null = null;
(async () => {
  try {
    const mod = await import('@capacitor/haptics');
    HapticsBasic = mod.Haptics;
  } catch {
    HapticsBasic = null;
  }
})();

let timerId: number | null = null;
let tickMs = 70;
let durMs = 22;
let usingAudio = false;
let usingNativeHaptics = false;
let currentIntensity = 0.5;
const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
let iosStyle: 'light' | 'medium' | 'heavy' = 'medium';
let isHapticsRunning = false; // Track if haptics are currently active

function speedToIntensity(speed?: number): number {
  const s = Math.max(0, Math.min(0.25, speed ?? 0));
  return Math.max(0.15, Math.min(1, s / 0.25));
}

function pressureToIntensity(pressure?: number): number {
  // Pressure is typically 0.0 to 1.0, clamp and scale
  const p = Math.max(0, Math.min(1, pressure ?? 0.5));
  return Math.max(0.1, Math.min(1, p));
}

function combinedIntensity(speed?: number, pressure?: number): number {
  const speedInt = speedToIntensity(speed);
  const pressureInt = pressureToIntensity(pressure);
  // Combine speed and pressure with pressure having more weight (60/40 split)
  return Math.max(0.1, Math.min(1, (pressureInt * 0.6) + (speedInt * 0.4)));
}

function speedToDur(speed?: number, pressure?: number): number {
  const intensity = combinedIntensity(speed, pressure);
  return Math.round(18 + intensity * 20); // 18..38ms (android vibrate duration)
}

function speedToTick(speed?: number, pressure?: number): number {
  const intensity = combinedIntensity(speed, pressure);
  return Math.round(80 - intensity * 35); // 45..80ms (tap cadence)
}

function speedToStyle(speed?: number, pressure?: number): 'light' | 'medium' | 'heavy' {
  const intensity = combinedIntensity(speed, pressure);
  if (intensity > 0.7) return 'heavy';
  if (intensity > 0.4) return 'medium';
  return 'light';
}

function tick() {
  console.log(`Haptic tick - platform: ${platform}, usingNativeHaptics: ${usingNativeHaptics}, HapticsBasic: ${!!HapticsBasic}`);
  
  // Try native haptics first for better pressure control
  if (platform !== 'web' && !usingNativeHaptics) {
    try {
      NativeHaptics.update({ intensity: currentIntensity });
      console.log(`Native haptics update: ${currentIntensity}`);
      return;
    } catch (e) {
      console.log(`Native haptics failed: ${e}`);
      // Fall back to basic haptics
    }
  }
  
  if (HapticsBasic) {
    if (platform === 'ios') {
      console.log(`iOS haptic impact: ${iosStyle}`);
      HapticsBasic.impact({ style: iosStyle }).catch((e: any) => console.log(`iOS haptic failed: ${e}`));
    } else if (platform === 'android') {
      console.log(`Android vibrate: ${durMs}ms`);
      HapticsBasic.vibrate({ duration: durMs }).catch((e: any) => console.log(`Android haptic failed: ${e}`));
    } else if (supportsVibration()) {
      console.log(`Web vibrate: ${durMs}ms`);
      navigator.vibrate(durMs);
    } else {
      console.log(`Audio fallback: ${durMs / 40}`);
      if (!usingAudio) { usingAudio = true; audioStart(0.4); } else { audioUpdate(durMs / 40); }
    }
    return;
  }
  // No Haptics plugin → web/audio fallback
  if (supportsVibration()) {
    console.log(`Fallback web vibrate: ${durMs}ms`);
    navigator.vibrate(durMs);
  } else {
    console.log(`Fallback audio: ${durMs / 40}`);
    if (!usingAudio) { usingAudio = true; audioStart(0.4); } else { audioUpdate(durMs / 40); }
  }
}

export function hapticsConstantStart(): void {
  if (!getFlag('hapticsEnabled')) return;
  if (isHapticsRunning) {
    // Already running, just update intensity instead of restarting
    hapticsUpdate();
    return;
  }
  
  usingAudio = false;
  usingNativeHaptics = false;
  
  // Try native haptics first for continuous pressure-based feedback
  if (platform !== 'web') {
    try {
      console.log(`Starting native haptics with intensity: ${currentIntensity}`);
      NativeHaptics.start({ intensity: currentIntensity });
      usingNativeHaptics = true;
      isHapticsRunning = true;
      console.log(`Native haptics started successfully`);
      return;
    } catch (e) {
      console.log(`Native haptics start failed: ${e}`);
      // Fall back to discrete haptics
    }
  }
  
  // optional pre-tap
  if (HapticsBasic && platform === 'ios') {
    console.log(`iOS pre-tap`);
    HapticsBasic.impact({ style: 'medium' }).catch((e: any) => console.log(`iOS pre-tap failed: ${e}`));
  }
  tick();
  timerId = window.setInterval(tick, tickMs);
  isHapticsRunning = true;
  console.log(`Started haptic timer with interval: ${tickMs}ms`);
}

export function hapticsUpdate(speed?: number, pressure?: number): void {
  if (!getFlag('hapticsEnabled')) return;
  
  const newIntensity = combinedIntensity(speed, pressure);
  const intensityChanged = Math.abs(currentIntensity - newIntensity) > 0.05; // Only update if significant change
  currentIntensity = newIntensity;
  
  // Debug log occasionally if debug mode is enabled
  if (getFlag('debug') && Math.random() < 0.05) {
    console.log(`hapticsUpdate - speed: ${speed?.toFixed(3)}, pressure: ${pressure?.toFixed(3)}, intensity: ${newIntensity.toFixed(3)}`);
  }
  
  // Update native haptics if using continuous mode and intensity changed significantly
  if (usingNativeHaptics && intensityChanged) {
    try {
      NativeHaptics.update({ intensity: currentIntensity });
      if (getFlag('debug')) {
        console.log(`Native haptics updated to: ${currentIntensity.toFixed(3)}`);
      }
      return;
    } catch (e) {
      if (getFlag('debug')) console.log(`Native haptics update failed: ${e}`);
      // Fall back to discrete haptics
      usingNativeHaptics = false;
    }
  }
  
  // Only update discrete haptic parameters if intensity changed
  if (intensityChanged || !timerId) {
    durMs = speedToDur(speed, pressure);
    iosStyle = speedToStyle(speed, pressure);
    const nextTick = speedToTick(speed, pressure);
    
    if (Math.abs(nextTick - tickMs) > 2 && timerId != null) {
      tickMs = nextTick;
      window.clearInterval(timerId);
      timerId = window.setInterval(tick, tickMs);
    } else {
      tickMs = nextTick;
    }
  }
  
  if (usingAudio) audioUpdate(combinedIntensity(speed, pressure));
}

export function hapticsStop(): void {
  // Stop native haptics if using continuous mode
  if (usingNativeHaptics) {
    try {
      NativeHaptics.stop();
    } catch (e) {
      console.log(`Native haptics stop failed: ${e}`);
    }
    usingNativeHaptics = false;
  }
  
  if (timerId != null) {
    window.clearInterval(timerId);
    timerId = null;
  }
  if (supportsVibration()) navigator.vibrate(0);
  if (usingAudio) { usingAudio = false; audioStop(); }
  
  isHapticsRunning = false; // Reset the running state
} 