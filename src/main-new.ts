import { hapticsConstantStart } from './haptics.js';
import { StyleManager } from './styles/styleManager.js';
import { DrawingPoint, StyleContext } from './styles/baseStyle.js';

// Debug: Check if JavaScript is loading
console.log('🎨 Vibe Drawing app starting...');
console.log('📍 Current location:', window.location.href);
console.log('🌐 User agent:', navigator.userAgent);

// Fallback: Show info popup if main app fails to load
setTimeout(() => {
  const app = document.getElementById('app');
  const splash = document.getElementById('splash-screen');
  if (app && splash && !app.querySelector('canvas')) {
    console.log('⚠️ Main app failed to load, showing info popup');
    splash.style.display = 'none';
    const infoPopup = document.getElementById('info-popup');
    if (infoPopup) {
      infoPopup.style.display = 'block';
    }
  }
}, 5000);

let ctx: CanvasRenderingContext2D | null = null;
let isDrawing = false;
let points: DrawingPoint[] = [];
let _animationId: number | null = null;

// Style management
const styleManager = new StyleManager();

// Web vs Mobile detection
const isWebApp = !('ontouchstart' in window) || window.navigator.maxTouchPoints === 0;

// Size control variables
let currentSizeLevel = 2; // 0=tiny, 1=small, 2=medium, 3=large, 4=huge
const sizeMultipliers = [0.2, 0.4, 0.7, 1.0, 1.5];
let thicknessMultiplier = 1.0; // Global thickness multiplier (0.5 to 3.0)
let isEraserMode = false;

// Initialize the app
function initApp(): void {
  console.log('🎨 Initializing Vibe Drawing app...');

  const canvas = document.getElementById('app-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('❌ Canvas not found');
    return;
  }

  ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('❌ Could not get 2D context');
    return;
  }

  setupCanvas(canvas);
  setupEventListeners(canvas);
  setupUI();

  console.log('✅ App initialized successfully');
}

function setupCanvas(canvas: HTMLCanvasElement): void {
  // Set canvas size
  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear and draw background
    clearCanvas(canvas);
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function clearCanvas(canvas: HTMLCanvasElement): void {
  if (!ctx) return;

  console.log('Clearing canvas, size:', canvas.width, 'x', canvas.height);

  // Create a beautiful gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#1a1a2e'); // Dark blue
  gradient.addColorStop(0.5, '#16213e'); // Navy blue
  gradient.addColorStop(1, '#0f3460'); // Deep blue

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add some subtle stars in the background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 2 + 1;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fill();
  }

  console.log('Canvas cleared and background drawn');
}

function setupEventListeners(canvas: HTMLCanvasElement): void {
  // Prevent default touch behaviors
  canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });

  canvas.addEventListener('pointerdown', (e: PointerEvent) => {
    if (isDrawing) return;

    canvas.setPointerCapture(e.pointerId);
    isDrawing = true;
    points = [];

    const point: DrawingPoint = {
      x: e.clientX,
      y: e.clientY,
      t: e.timeStamp,
      pressure: e.pressure,
      width: e.width,
      height: e.height,
    };

    points.push(point);

    // Start haptics and style
    hapticsConstantStart();
    styleManager.onStart(point, createStyleContext());
  });

  canvas.addEventListener('pointermove', (e: PointerEvent) => {
    if (!isDrawing) return;

    const point: DrawingPoint = {
      x: e.clientX,
      y: e.clientY,
      t: e.timeStamp,
      pressure: e.pressure,
      width: e.width,
      height: e.height,
    };

    points.push(point);

    // Update haptics and style
    styleManager.onMove([point], createStyleContext());
  });

  canvas.addEventListener('pointerup', (e: PointerEvent) => {
    if (!isDrawing) return;

    isDrawing = false;
    canvas.releasePointerCapture(e.pointerId);

    // End haptics and style
    styleManager.onEnd(createStyleContext());
    points = [];
  });

  canvas.addEventListener('pointercancel', () => {
    if (isDrawing) {
      isDrawing = false;
      styleManager.onEnd(createStyleContext());
      points = [];
    }
  });
}

function createStyleContext(): StyleContext {
  const canvas = document.getElementById('app-canvas') as HTMLCanvasElement;
  return {
    ctx: ctx!,
    canvas,
    isEraserMode,
    thicknessMultiplier,
    currentSizeLevel,
    sizeMultipliers,
    isWebApp,
  };
}

function setupUI(): void {
  // Style switching
  const styleButton = document.getElementById('style-button');
  if (styleButton) {
    styleButton.addEventListener('click', () => {
      styleManager.nextStyle();
      updateStyleUI();
    });
  }

  // Clear button
  const clearButton = document.getElementById('clear-button');
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      const canvas = document.getElementById('app-canvas') as HTMLCanvasElement;
      clearCanvas(canvas);
      styleManager.onClear(createStyleContext());
    });
  }

  // Size controls
  const sizeUpButton = document.getElementById('size-up');
  const sizeDownButton = document.getElementById('size-down');

  if (sizeUpButton) {
    sizeUpButton.addEventListener('click', () => {
      currentSizeLevel = Math.min(4, currentSizeLevel + 1);
      updateSizeUI();
    });
  }

  if (sizeDownButton) {
    sizeDownButton.addEventListener('click', () => {
      currentSizeLevel = Math.max(0, currentSizeLevel - 1);
      updateSizeUI();
    });
  }

  // Thickness slider
  const thicknessSlider = document.getElementById('thickness-slider') as HTMLInputElement;
  if (thicknessSlider) {
    thicknessSlider.addEventListener('input', (e) => {
      thicknessMultiplier = parseFloat((e.target as HTMLInputElement).value);
    });
  }

  // Eraser toggle
  const eraserButton = document.getElementById('eraser-button');
  if (eraserButton) {
    eraserButton.addEventListener('click', () => {
      isEraserMode = !isEraserMode;
      eraserButton.textContent = isEraserMode ? '✏️' : '🧽';
      eraserButton.style.background = isEraserMode ? '#ff6b6b' : '#4ecdc4';
    });
  }

  updateStyleUI();
  updateSizeUI();
}

function updateStyleUI(): void {
  const currentStyle = styleManager.getCurrentStyle();
  const styleButton = document.getElementById('style-button');
  if (styleButton) {
    styleButton.textContent = currentStyle.icon;
    styleButton.title = `${currentStyle.name}: ${currentStyle.description}`;
  }
}

function updateSizeUI(): void {
  const sizeLabel = document.getElementById('size-label');
  if (sizeLabel) {
    const sizes = ['Tiny', 'Small', 'Medium', 'Large', 'Huge'];
    sizeLabel.textContent = sizes[currentSizeLevel] || '';
  }
}

// Start animation loop
function startAnimation(): void {
  function animate() {
    styleManager.animate(createStyleContext());
    animationId = requestAnimationFrame(animate);
  }
  animate();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initApp();
    startAnimation();
  });
} else {
  initApp();
  startAnimation();
}
