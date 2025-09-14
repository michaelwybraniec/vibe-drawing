import { StyleManager } from './styles/styleManager.js';
import { DrawingPoint, StyleContext } from './styles/baseStyle.js';

// Global variables
let ctx: CanvasRenderingContext2D | null = null;
let isDrawing = false;
let points: DrawingPoint[] = [];

// Style management
const styleManager = new StyleManager();

// Animation frame for style animations
let _animationId: number | null = null;

// Web vs Mobile detection
const isWebApp = !('ontouchstart' in window) || window.navigator.maxTouchPoints === 0;

// Size control variables
let currentSizeLevel = 2; // 0=tiny, 1=small, 2=medium, 3=large, 4=huge (5 sizes total)
const sizeMultipliers = [0.2, 0.4, 0.7, 1.0, 1.5]; // 5 size multipliers for web app - reduced sizes


// Thickness control
let thicknessMultiplier = 1.0; // Global thickness multiplier (0.5 to 3.0)

// Eraser mode
let isEraserMode = false;

// Style tracking variables
let _currentStyle = 1; // Default to style 1


function createStyleContext(): StyleContext {
  return {
    ctx: ctx!,
    isEraserMode,
    thicknessMultiplier,
    currentSizeLevel,
    sizeMultipliers,
    isWebApp,
  };
}

// Initialize the app
function initApp(): void {

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

}

function setupCanvas(canvas: HTMLCanvasElement): void {
  // Set canvas size
  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function setupEventListeners(canvas: HTMLCanvasElement): void {
  // Prevent default touch behaviors
  canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });

  canvas.addEventListener('pointerdown', (e: PointerEvent) => {
    if (!ctx) return;
    
    isDrawing = true;
    points = [];
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const point: DrawingPoint = {
      x,
      y,
      width: e.width || 10,
      height: e.height || 10,
    };
    
    points.push(point);
    
    // Draw initial point
    const styleContext = createStyleContext();
    const currentStyle = styleManager.getCurrentStyle();
    currentStyle.draw(ctx, point, styleContext);
  });

  canvas.addEventListener('pointermove', (e: PointerEvent) => {
    if (!isDrawing || !ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const point: DrawingPoint = {
      x,
      y,
      width: e.width || 10,
      height: e.height || 10,
    };
    
    points.push(point);
    
    // Draw point
    const styleContext = createStyleContext();
    const currentStyle = styleManager.getCurrentStyle();
    currentStyle.draw(ctx, point, styleContext);
  });

  canvas.addEventListener('pointerup', () => {
    isDrawing = false;
    points = [];
  });
}

function setupUI(): void {
  // Style selector
  const styleSelector = document.getElementById('style-selector') as HTMLSelectElement;
  if (styleSelector) {
    styleSelector.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      const styleIndex = parseInt(target.value) - 1;
      styleManager.switchToStyle(styleIndex);
      _currentStyle = styleIndex + 1;
    });
  }

  // Thickness slider
  const thicknessSlider = document.getElementById('thickness-slider') as HTMLInputElement;
  if (thicknessSlider) {
    thicknessSlider.addEventListener('input', () => {
      const sliderValue = parseFloat(thicknessSlider.value);
      const currentStyleIndex = styleManager.getCurrentStyleIndex();
      
      if (currentStyleIndex === 1) {
        // Style 2: Map thickness slider (0.2-5.0) to size range (0.1-3.0)
        const minSlider = 0.2;
        const maxSlider = 5.0;
        const sliderRange = maxSlider - minSlider;
        const normalizedValue = (sliderValue - minSlider) / sliderRange;
        const sizeRange = 0.1 + normalizedValue * 2.9;
        thicknessMultiplier = sizeRange;
      } else {
        // Other styles: Use slider value directly as thickness multiplier
        thicknessMultiplier = sliderValue;
        // Map thickness slider (0.2-5.0) to size level (0-4) evenly
        const minSlider = 0.2;
        const maxSlider = 5.0;
        const sliderRange = maxSlider - minSlider;
        const normalizedValue = (sliderValue - minSlider) / sliderRange;
        currentSizeLevel = Math.round(normalizedValue * 4);
      }
      
    });
  }

  // Eraser toggle
  const eraserButton = document.getElementById('eraser') as HTMLButtonElement;
  if (eraserButton) {
    eraserButton.addEventListener('click', () => {
      isEraserMode = !isEraserMode;
      eraserButton.classList.toggle('eraser-active', isEraserMode);
    });
  }

  // Clear canvas
  const clearButton = document.getElementById('clear-canvas') as HTMLButtonElement;
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      const canvas = document.getElementById('app-canvas') as HTMLCanvasElement;
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
  }

  // Color variant button (formerly randomize)
  const randomizeButton = document.getElementById('randomize') as HTMLButtonElement;
  if (randomizeButton) {
    randomizeButton.addEventListener('click', () => {
      const currentStyle = styleManager.getCurrentStyle();
      if (currentStyle.nextColorVariant) {
        currentStyle.nextColorVariant();
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Export for global access
(window as any).styleManager = styleManager;
(window as any).currentSizeLevel = currentSizeLevel;
(window as any).thicknessMultiplier = thicknessMultiplier;
(window as any).isEraserMode = isEraserMode;
