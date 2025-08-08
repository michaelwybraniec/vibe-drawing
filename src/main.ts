import { getDevicePixelRatio, supportsVibration } from './capabilities.js';
import { vibrateForSpeed, stopVibration } from './haptics.js';
import { getMode, setMode, type Mode } from './state.js';
import { startRecording, stopRecording, isRecording, pushPoint, type Recording } from './recording.js';

let ctx: CanvasRenderingContext2D | null = null;

type Point = { x: number; y: number; t: number; speed?: number };
let isDrawing = false;
let points: Point[] = [];
let _currentRecording: Recording | null = null;
let playbackTimer: number | null = null;

function bindUI(): void {
  const select = document.getElementById('mode-select') as HTMLSelectElement | null;
  const recStart = document.getElementById('btn-rec-start') as HTMLButtonElement | null;
  const recStop = document.getElementById('btn-rec-stop') as HTMLButtonElement | null;
  const playBtn = document.getElementById('btn-play') as HTMLButtonElement | null;
  const pauseBtn = document.getElementById('btn-pause') as HTMLButtonElement | null;
  const stopBtn = document.getElementById('btn-stop') as HTMLButtonElement | null;
  const testVibrate = document.getElementById('btn-test-vibrate') as HTMLButtonElement | null;
  const recControls = document.getElementById('record-controls');
  const pbControls = document.getElementById('playback-controls');
  const hint = document.getElementById('hint-haptics') as HTMLSpanElement | null;

  const updateControls = () => {
    const m = getMode();
    if (recControls) recControls.style.display = m === 'record' ? 'inline-flex' : 'none';
    if (pbControls) pbControls.style.display = m === 'playback' ? 'inline-flex' : 'none';
  };

  select?.addEventListener('change', () => {
    setMode(select.value as Mode);
    updateControls();
  });

  recStart?.addEventListener('click', () => {
    if (isRecording()) return;
    startRecording(performance.now());
  });

  recStop?.addEventListener('click', () => {
    if (!isRecording()) return;
    _currentRecording = stopRecording();
  });

  playBtn?.addEventListener('click', () => {
    // playback scheduler stub (implemented later)
  });
  pauseBtn?.addEventListener('click', () => {
    if (playbackTimer != null) {
      window.clearTimeout(playbackTimer);
      playbackTimer = null;
    }
  });
  stopBtn?.addEventListener('click', () => {
    if (playbackTimer != null) {
      window.clearTimeout(playbackTimer);
      playbackTimer = null;
    }
    stopVibration();
  });

  testVibrate?.addEventListener('click', () => {
    if (!supportsVibration()) {
      if (hint) hint.textContent = 'Haptics not supported on this device/browser.';
      return;
    }
    const ok = navigator.vibrate(30);
    if (ok === false && hint) {
      hint.textContent = 'Vibration blocked by browser settings (try enabling system haptics or reducing motion off).';
    }
  });

  updateControls();

  // initial hint
  if (!supportsVibration() && hint) {
    hint.textContent = 'Haptics not supported on this device/browser.';
  }
}

let currentWidth = 4;
const minWidth = 2;
const maxWidth = 10;
const smoothingFactor = 0.25; // low-pass filter alpha

function getCanvasPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function drawLatestSegment(): void {
  if (!ctx) return;
  const len = points.length;
  if (len < 2) return;
  const a = points[len - 2]!;
  const b = points[len - 1]!;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function midpoint(p: Point, q: Point): { x: number; y: number } {
  return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
}

function drawLatestSmoothedSegment(): void {
  if (!ctx) return;
  const len = points.length;
  if (len === 2) {
    // First segment fallback
    drawLatestSegment();
    return;
  }
  if (len < 3) return;
  const p0 = points[len - 3]!;
  const p1 = points[len - 2]!;
  const p2 = points[len - 1]!;
  const m1 = midpoint(p0, p1);
  const m2 = midpoint(p1, p2);
  ctx.beginPath();
  ctx.moveTo(m1.x, m1.y);
  ctx.quadraticCurveTo(p1.x, p1.y, m2.x, m2.y);
  ctx.stroke();
}

function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

function updateLatestSpeed(): void {
  const len = points.length;
  if (len < 2) return;
  const prev = points[len - 2]!;
  const last = points[len - 1]!;
  const dt = Math.max(0.001, last.t - prev.t);
  const d = distance(prev, last);
  last.speed = d / dt; // px per ms
}

function mapSpeedToWidth(speed: number | undefined): number {
  if (speed == null) return currentWidth;
  // Invert mapping: faster → thinner. Tune k to taste.
  const k = 200; // scaling constant for px/ms
  const w = maxWidth - Math.min(maxWidth - minWidth, speed * k);
  return Math.max(minWidth, Math.min(maxWidth, w));
}

function updateWidthFromSpeed(): void {
  const last = points[points.length - 1]!;
  const target = mapSpeedToWidth(last.speed);
  currentWidth = currentWidth + (target - currentWidth) * smoothingFactor;
  if (ctx) ctx.lineWidth = currentWidth;
}

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): void {
  const dpr = getDevicePixelRatio();
  const { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();
  const displayWidth = Math.max(1, Math.floor(cssWidth * dpr));
  const displayHeight = Math.max(1, Math.floor(cssHeight * dpr));

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }

  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

function initContext(canvas: HTMLCanvasElement): void {
  ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#111';
  ctx.fillStyle = '#fff';
  ctx.lineWidth = 4;
}

function attachPointerHandlers(canvas: HTMLCanvasElement): void {
  canvas.addEventListener('pointerdown', (e: PointerEvent) => {
    canvas.setPointerCapture(e.pointerId);
    isDrawing = true;
    points = [];
    const { x, y } = getCanvasPoint(canvas, e.clientX, e.clientY);
    points.push({ x, y, t: e.timeStamp });
    currentWidth = ctx ? ctx.lineWidth : currentWidth;
    if (getMode() === 'record' && !isRecording()) startRecording(performance.now());
  });

  canvas.addEventListener('pointermove', (e: PointerEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasPoint(canvas, e.clientX, e.clientY);
    points.push({ x, y, t: e.timeStamp });
    updateLatestSpeed();
    drawLatestSmoothedSegment();
    updateWidthFromSpeed();
    const latest = points[points.length - 1]!;
    if (getMode() === 'live') vibrateForSpeed(latest.speed);
    if (getMode() === 'record' && isRecording()) {
      pushPoint(performance.now(), { x: latest.x, y: latest.y, speed: latest.speed, width: currentWidth });
    }
  });

  const end = (e: PointerEvent) => {
    if (!isDrawing) return;
    isDrawing = false;
    canvas.releasePointerCapture(e.pointerId);
    stopVibration();
  };

  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', end);
}

function init(): void {
  const canvas = document.getElementById('app-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;

  initContext(canvas);

  const handleResize = (): void => {
    resizeCanvasToDisplaySize(canvas);
  };

  handleResize();
  window.addEventListener('resize', handleResize);

  attachPointerHandlers(canvas);
  bindUI();

  // register service worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* ignore */
    });
  }
}

document.addEventListener('DOMContentLoaded', init);

export {}; 