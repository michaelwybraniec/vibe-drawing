import { getDevicePixelRatio } from './capabilities.js';

let ctx: CanvasRenderingContext2D | null = null;

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
    // Map drawing units to CSS pixels for consistent sizing
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

function initContext(canvas: HTMLCanvasElement): void {
  ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Default drawing styles
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#111';
  ctx.fillStyle = '#fff';
  ctx.lineWidth = 4; // in CSS pixel units; DPR transform maps appropriately
}

function init(): void {
  const canvas = document.getElementById('app-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;

  initContext(canvas);

  const handleResize = (): void => {
    resizeCanvasToDisplaySize(canvas);
  };

  // Initial size and on resize
  handleResize();
  window.addEventListener('resize', handleResize);
}

document.addEventListener('DOMContentLoaded', init);

export {}; 