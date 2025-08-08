import { getDevicePixelRatio } from './capabilities.js';

let ctx: CanvasRenderingContext2D | null = null;

type Point = { x: number; y: number; t: number };
let isDrawing = false;
let points: Point[] = [];

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
  });

  canvas.addEventListener('pointermove', (e: PointerEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasPoint(canvas, e.clientX, e.clientY);
    points.push({ x, y, t: e.timeStamp });
    drawLatestSmoothedSegment();
  });

  const end = (e: PointerEvent) => {
    if (!isDrawing) return;
    isDrawing = false;
    canvas.releasePointerCapture(e.pointerId);
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
}

document.addEventListener('DOMContentLoaded', init);

export {}; 