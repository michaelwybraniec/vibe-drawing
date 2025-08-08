import { getDevicePixelRatio } from './capabilities.js';

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): void {
  const dpr = getDevicePixelRatio();
  const { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();
  const displayWidth = Math.max(1, Math.floor(cssWidth * dpr));
  const displayHeight = Math.max(1, Math.floor(cssHeight * dpr));

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
}

function init(): void {
  const canvas = document.getElementById('app-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;

  const handleResize = (): void => {
    resizeCanvasToDisplaySize(canvas);
  };

  // Initial size and on resize
  handleResize();
  window.addEventListener('resize', handleResize);
}

document.addEventListener('DOMContentLoaded', init);

export {}; 