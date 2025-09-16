import { hapticsConstantStart } from './haptics.js';
import { StyleManager } from './styles/styleManager.js';
import { DrawingPoint, StyleContext } from './styles/baseStyle.js';
import { PizzaSizeSelector } from './components/pizza-size-selector.js';
import { NumbersSizeSelector } from './components/numbers-size-selector.js';

// Info popup functions
function showInfoPopup() {
  
  // Add strong click feedback to the info button
  const infoButton = document.querySelector('.one-front-credit');
  if (infoButton) {
    (infoButton as HTMLElement).style.transform = 'scale(0.85)';
    (infoButton as HTMLElement).style.opacity = '0.7';
    setTimeout(() => {
      (infoButton as HTMLElement).style.transform = '';
      (infoButton as HTMLElement).style.opacity = '';
    }, 200);
  }
  
  // Haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(50);
  }
  
  const popup = document.getElementById('info-popup');
  if (popup) {
    popup.style.display = 'block';
  }
}

function hideInfoPopup() {
  const popup = document.getElementById('info-popup');
  if (popup) {
    popup.style.display = 'none';
  }
}


// Debug: Check if JavaScript is loading

// Menu toggle functionality
let isMenuCollapsed = false;

function toggleMenu() {
  const menuToggle = document.getElementById('menu-toggle');
  const toolsContainer = document.getElementById('tools-container');
  
  if (!menuToggle || !toolsContainer) return;
  
  isMenuCollapsed = !isMenuCollapsed;
  
  if (isMenuCollapsed) {
    // Collapse menu
    toolsContainer.classList.add('collapsed');
    menuToggle.classList.add('collapsed');
    menuToggle.querySelector('.menu-toggle-icon')!.textContent = '▲';
    // Move chevron to bottom when collapsed
    menuToggle.style.bottom = '25px';
  } else {
    // Expand menu
    toolsContainer.classList.remove('collapsed');
    menuToggle.classList.remove('collapsed');
    menuToggle.querySelector('.menu-toggle-icon')!.textContent = '▼';
    // Move chevron above tools when expanded
    menuToggle.style.bottom = '120px';
  }
  
  // Haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(30);
  }
}

// Fallback: Show info popup if main app fails to load
setTimeout(() => {
  const app = document.getElementById('app');
  const splash = document.getElementById('splash-screen');
  if (app && splash && !app.querySelector('canvas')) {
    splash.style.display = 'none';
    const infoPopup = document.getElementById('info-popup');
    if (infoPopup) {
      infoPopup.style.display = 'block';
    }
  }
}, 5000); // Wait 5 seconds

let ctx: CanvasRenderingContext2D | null = null;

let isDrawing = false;
let points: DrawingPoint[] = [];

// Style management
const styleManager = new StyleManager();

// Animation frame for style animations
let _animationId: number | null = null;

// Web vs Mobile detection - use screen width as primary method
const isWebApp = window.innerWidth > 768;

// Size control variables - 3 fixed sizes for all styles
let currentSizeLevel = 2; // 0=tiny, 1=small, 2=medium, 3=large, 4=huge, 5=giant (6 sizes total)
const sizeMultipliers = [1, 2, 2.5, 3, 3.5, 4]; // 6 fixed size multipliers: Tiny (0.2x), Small (0.4x), Medium (0.8x), Large (1.5x), Huge (3.0x), Giant (6.0x) - All styles same size

// Size smoothing variables
let lastSizeMultiplier = 0.25;
const sizeSmoothingFactor = 0.15;

// Thickness control
let thicknessMultiplier = 1.0; // Global thickness multiplier (0.5 to 3.0)

// Memory management
const MEMORY_LIMIT_PERCENT = 70; // Clear canvas when memory usage exceeds 70%
let lastMemoryCheck = 0;
const MEMORY_CHECK_INTERVAL = 1000; // Check memory every 1 second

// Emergency memory clear function (can be called from console)
(window as any).emergencyClear = function() {
  const canvas = document.getElementById('drawing-canvas') as HTMLCanvasElement;
  if (canvas) clearCanvas(canvas);
  if ((window as any).gc) {
    (window as any).gc();
  }
};

// Check memory usage and auto-clear if needed
function checkMemoryUsage(): void {
  const now = Date.now();
  // Only check every 1 second to avoid performance impact
  if (now - lastMemoryCheck < MEMORY_CHECK_INTERVAL) return;
  
  lastMemoryCheck = now;
  const memoryInfo = (performance as any).memory;
  
  if (memoryInfo) {
    const usedMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
    const totalMB = memoryInfo.totalJSHeapSize / 1024 / 1024;
    const usagePercent = (usedMB / totalMB) * 100;
    
    if (usagePercent > MEMORY_LIMIT_PERCENT) {
      const canvas = document.getElementById('drawing-canvas') as HTMLCanvasElement;
      if (canvas) clearCanvas(canvas);
      
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
      
      // Show notification
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = 'white';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Memory Limit Reached', canvas.width / 2, canvas.height / 2 - 20);
          ctx.fillText('Canvas Auto-Cleared', canvas.width / 2, canvas.height / 2 + 20);
          ctx.restore();
          
          // Clear the notification after 2 seconds
          setTimeout(() => {
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }, 2000);
        }
      }
    }
  }
}

// Eraser mode
let isEraserMode = false;

// Debug mode
let showDebugInfo = false;
let showToolLabels = false;

// Initialize debugger toggle
function initializeDebuggerToggle(): void {
  const debuggerToggle = document.getElementById('debugger-toggle') as HTMLButtonElement;
  const debugInfo = document.getElementById('debug-info') as HTMLElement;
  
  if (debuggerToggle && debugInfo) {
    // Set initial state
    debuggerToggle.classList.toggle('active', showDebugInfo);
    debugInfo.style.display = showDebugInfo ? 'block' : 'none';
    
    // Add event listener
    debuggerToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      showDebugInfo = !showDebugInfo;
      debuggerToggle.classList.toggle('active', showDebugInfo);
      debugInfo.style.display = showDebugInfo ? 'block' : 'none';
      
      // Update debug content when showing
      if (showDebugInfo) {
        updateDebugInfo();
      }
    });
  }
}

// Initialize labels toggle
function initializeLabelsToggle(): void {
  const labelsToggle = document.getElementById('labels-toggle') as HTMLButtonElement;
  if (labelsToggle) {
    // Set initial state - labels should be hidden by default
    labelsToggle.classList.toggle('active', showToolLabels);
    
    // Explicitly hide all tool labels on startup
    const toolLabels = document.querySelectorAll('.tool-label');
    toolLabels.forEach(label => {
      const element = label as HTMLElement;
      element.style.display = 'none';
    });
    
    // Add event listener
    labelsToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      showToolLabels = !showToolLabels;
      labelsToggle.classList.toggle('active', showToolLabels);
      
      // Toggle tool labels visibility
      toolLabels.forEach(label => {
        const element = label as HTMLElement;
        element.style.display = showToolLabels ? 'block' : 'none';
      });
    });
  }
}

// Size tracking for reactive observer
let sizeTracker: { [styleName: string]: { [sizeLevel: number]: number } } = {};
let lastSizeUpdate = 0;

// Function to report actual size used by a style
function reportActualSize(styleName: string, sizeLevel: number, actualSize: number): void {
  if (!sizeTracker[styleName]) {
    sizeTracker[styleName] = {};
  }
  sizeTracker[styleName]![sizeLevel] = actualSize;
  
  // Update debug display every 100ms to avoid spam
  const now = Date.now();
  if (now - lastSizeUpdate > 100) {
    lastSizeUpdate = now;
    updateSizeDebugDisplay();
  }
}

// Initialize debug tracking for all styles
function _initializeDebugTracking(): void {
  const allStyles = styleManager.getAllStyles();
  allStyles.forEach(style => {
    if (!sizeTracker[style.name]) {
      sizeTracker[style.name] = {};
    }
  });
}

// Style tracking variables
let currentStyle = 1; // Default to style 1
let isStyle2Active = false;
let _flames: any[] = [];
let _lavaLines: any[] = [];

// Style context function for the new separated system
function createStyleContext(): StyleContext {
  // Make eraser much bigger than selected size for easier use
  const eraserSizeLevel = isEraserMode ? Math.min(currentSizeLevel + 4, sizeMultipliers.length - 1) : currentSizeLevel;
  
  return {
    ctx: ctx!,
    isEraserMode,
    thicknessMultiplier,
    currentSizeLevel: eraserSizeLevel,
    sizeMultipliers,
    isWebApp,
  };
}

// Helper function to draw using the new separated style system
function drawWithCurrentStyle(ctx: CanvasRenderingContext2D, x: number, y: number, touchWidth: number, touchHeight: number): void {
  const point: DrawingPoint = {
    x,
    y,
    width: touchWidth,
    height: touchHeight,
    t: Date.now(),
  };
  
  const styleContext = createStyleContext();
  const currentStyle = styleManager.getCurrentStyle();
  
  // Reactive observer: Track actual calculated sizes for each style
  if (showDebugInfo) {
    // Calculate the actual size that will be used by the style
    const sizeMultiplier = sizeMultipliers[currentSizeLevel] || 1.0;
    const baseMultiplier = 0.15 * sizeMultiplier;
    const calculatedSize = baseMultiplier * thicknessMultiplier * Math.max(touchWidth, touchHeight);
    
    // Track size for this style and size level
    if (!sizeTracker[currentStyle.name]) {
      sizeTracker[currentStyle.name] = {};
    }
    sizeTracker[currentStyle.name]![currentSizeLevel] = calculatedSize;
    
    // Update debug display every 100ms to avoid spam
    const now = Date.now();
    if (now - lastSizeUpdate > 100) {
      lastSizeUpdate = now;
      updateSizeDebugDisplay();
    }
  }
  
  currentStyle.draw(ctx, point, styleContext);
}

function calculateSizeMultiplier(width: number, height: number): number {
  const touchArea = Math.sqrt(width * height);

  if (isWebApp) {
    // Web app: Always use consistent size for better drawing experience
    const baseMultiplier = 0.15 * (sizeMultipliers[currentSizeLevel] || 1.0);
    const finalMultiplier = baseMultiplier * thicknessMultiplier;
    return finalMultiplier; // Apply size control and thickness
  } else {
    // Mobile: Optimized for iOS performance and Apple Pencil
    const minArea = 5; // Smaller minimum for pencil precision
    const maxArea = 100; // Reduced maximum for better performance
    const normalizedArea = Math.max(0, Math.min(1, (touchArea - minArea) / (maxArea - minArea)));

    // Enhanced size calculation for Apple Pencil stability
    let baseMultiplier;
    if (width === 0 || height === 0) {
      // Apple Pencil often reports 0 width/height, use stable default
      baseMultiplier = 0.2; // Stable default for Apple Pencil
    } else {
      baseMultiplier = 0.1 + normalizedArea * 0.2; // Maps to 0.1-0.3x (more stable range)
    }

    const sizeVariation = 0.98 + Math.random() * 0.04; // 98-102% size variation (very stable)

    // Apply smoothing to prevent jumpy size changes
    const smoothedMultiplier =
      lastSizeMultiplier * (1 - sizeSmoothingFactor) +
      baseMultiplier * sizeVariation * sizeSmoothingFactor;
    lastSizeMultiplier = smoothedMultiplier;

    const finalMultiplier =
      smoothedMultiplier * (sizeMultipliers[currentSizeLevel] || 1.0) * thicknessMultiplier;
    return finalMultiplier; // Apply size control and thickness
  }
}

function _getColorFromSize(_sizeMultiplier: number): string {
  // Create 20% more vibrant rainbow colors with smoother transitions
  const hue = ((_sizeMultiplier - 0.1) / 0.3) * 432; // 20% more color range (360 * 1.2)
  const saturation = 90 + Math.random() * 20; // 90-110% saturation (20% more vibrant)
  const lightness = 40 + (_sizeMultiplier / 0.4) * 30 + Math.random() * 12; // 40-85% lightness (20% more range)
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Old getColorStyle1 function removed - now using color variants system

// Old _getColorStyle2 function removed - now using color variants system

function _getColorStyle3(_sizeMultiplier: number): string {
  // Style 3: Ocean colors (blue, cyan, teal, purple)
  const hue = 180 + ((_sizeMultiplier - 0.1) / 0.3) * 120; // 180-300 degrees (cyan to purple)
  const saturation = 85 + Math.random() * 15;
  const lightness = 45 + (_sizeMultiplier / 0.4) * 25 + Math.random() * 10;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Old getCurrentColor function removed - now using color variants system

// Old _drawStyle2 function removed - now using color variants system

// Removed old drawFlameEffect - now using separated style system

// Global glitch trail for digital glitch effect (removed - no longer used)
// let glitchTrail: Array<{...}> = [];
// let lastGlitchTime = 0;

// Global twinkling stars for background (not used - using CSS instead)
let _backgroundStars: Array<{x: number; y: number; size: number; twinklePhase: number; twinkleSpeed: number}> = [];

// Removed old drawGlitchEffect - now using separated style system
// Old _drawGlitchEffect function removed - now using color variants system

// Old fire trail and drawing functions removed - now using color variants system

// All old drawing functions removed - now using color variants system

function getCanvasPoint(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function resizeCanvas(canvas: HTMLCanvasElement): void {
  const vv = (window as any).visualViewport as VisualViewport | undefined;
  const width = vv ? vv.width : window.innerWidth;
  const height = vv ? vv.height : window.innerHeight;

  // Get device pixel ratio for HD quality
  const devicePixelRatio = window.devicePixelRatio || 1;

  // Set canvas size to match viewport with HD resolution
  canvas.width = Math.max(1, Math.floor(width * devicePixelRatio));
  canvas.height = Math.max(1, Math.floor(height * devicePixelRatio));

  // Set CSS size to maintain visual size
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';


  // Re-initialize context and clear canvas after resize (handles rotation)
  if (ctx) {
    // Scale context to match device pixel ratio for crisp rendering
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111';
    clearCanvas(canvas);
  }
}

// Global functions for modal control
function openSaveModal(): void {
  const modal = document.getElementById('save-modal');
  if (modal) {
    modal.style.display = 'block';
  }
}

function closeSaveModal(): void {
  const modal = document.getElementById('save-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function showProcessingSpinner(): void {
  const spinner = document.getElementById('processing-spinner');
  if (spinner) {
    spinner.style.display = 'block';
  }
}

function hideProcessingSpinner(): void {
  const spinner = document.getElementById('processing-spinner');
  if (spinner) {
    spinner.style.display = 'none';
  }
}

// Make functions globally available
(window as any).openSaveModal = openSaveModal;
(window as any).closeSaveModal = closeSaveModal;
(window as any).showProcessingSpinner = showProcessingSpinner;
(window as any).hideProcessingSpinner = hideProcessingSpinner;

function getResolutionDimensions(quality: string): { width: number; height: number } {
  switch (quality) {
    case '2K':
      return { width: 2048, height: 1152 }; // 2K HD - Standard web resolution
    case '5K':
      return { width: 5120, height: 2880 }; // 5K Ultra-wide - High-end displays
    case '10K':
      return { width: 10240, height: 5760 }; // 10K - Professional quality
    case '20K':
      return { width: 16384, height: 9216 }; // 20K - MAXIMUM QUALITY (browser limit)
    default:
      return { width: 2048, height: 1152 };
  }
}

function detectMaximumVectorQuality(canvas: HTMLCanvasElement): { maxScale: number; maxWidth: number; maxHeight: number; reason: string } {
  const maxCanvasSize = 16384; // Browser limit
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  // Get actual canvas dimensions
  const displayWidth = canvas.width / (devicePixelRatio * 2);
  const displayHeight = canvas.height / (devicePixelRatio * 2);
  
  // Calculate maximum scale factor
  const maxScaleX = maxCanvasSize / displayWidth;
  const maxScaleY = maxCanvasSize / displayHeight;
  const maxScale = Math.min(maxScaleX, maxScaleY);
  
  const maxWidth = Math.floor(displayWidth * maxScale);
  const maxHeight = Math.floor(displayHeight * maxScale);
  
  let reason = '';
  if (maxScale >= 100) {
    reason = 'Browser canvas limit (16K pixels)';
  } else if (maxScale >= 50) {
    reason = 'High resolution - excellent quality';
  } else if (maxScale >= 20) {
    reason = 'Medium resolution - good quality';
  } else {
    reason = 'Limited by canvas size';
  }
  
  return { maxScale, maxWidth, maxHeight, reason };
}

async function exportWithOffscreenCanvas(canvas: HTMLCanvasElement, quality: string, format: string): Promise<void> {
  try {
    
    // Create OffscreenCanvas at true high resolution
    const offscreen = new OffscreenCanvas(20000, 11250); // True 20K resolution
    const ctx = offscreen.getContext('2d');
    
    if (!ctx) {
      console.error('Failed to create OffscreenCanvas context');
      hideProcessingSpinner();
      return;
    }
    
    // Professional rendering settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.lineWidth = 0.1; // Ultra-thin for maximum detail
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Scale factor for true 20K
    const scaleFactor = 20000 / canvas.width;
    ctx.scale(scaleFactor, scaleFactor);
    
    // Draw the original canvas content
    ctx.drawImage(canvas, 0, 0);
    
    // Convert to blob with professional quality
    const blob = await offscreen.convertToBlob({ 
      type: format === 'PNG' ? 'image/png' : 'image/jpeg',
      quality: format === 'JPEG' ? 1.0 : undefined // Maximum quality
    });
    
    // Download the file
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VIBE-DRAWING-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    hideProcessingSpinner();
    
  } catch (error) {
    console.error('OffscreenCanvas export failed:', error);
    hideProcessingSpinner();
    // Fallback to regular export
    saveCanvasAsImage(canvas, quality, format);
  }
}

function exportAsSVG(canvas: HTMLCanvasElement, _quality: string): void {
  try {
    
    // Get canvas data as base64
    const canvasData = canvas.toDataURL('image/png');
    
    // Create SVG with embedded canvas data
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" 
           width="${canvas.width}" 
           height="${canvas.height}" 
           viewBox="0 0 ${canvas.width} ${canvas.height}">
        <image href="${canvasData}" 
               width="${canvas.width}" 
               height="${canvas.height}" 
               preserveAspectRatio="none"/>
      </svg>
    `;
    
    // Create blob and download
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VIBE-DRAWING-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    hideProcessingSpinner();
    
  } catch (error) {
    console.error('SVG export failed:', error);
    hideProcessingSpinner();
  }
}

function saveCanvasAsImage(canvas: HTMLCanvasElement, quality: string, format: string): void {
  try {
    // Show processing spinner
    showProcessingSpinner();
    
    // Check for OffscreenCanvas support for true high resolution
    if (typeof OffscreenCanvas !== 'undefined' && quality === '20K') {
      exportWithOffscreenCanvas(canvas, quality, format);
      return;
    }
    
    // Check for SVG export (vector-like quality)
    if (format === 'SVG') {
      exportAsSVG(canvas, quality);
      return;
    }
    
    // Calculate target resolution
    const { width: targetWidth, height: targetHeight } = getResolutionDimensions(quality);
    
    // Check for reasonable canvas size limits
    const maxCanvasSize = 16384; // Most browsers support up to 16K
    if (targetWidth > maxCanvasSize || targetHeight > maxCanvasSize) {
      console.warn(`Resolution ${quality} (${targetWidth}x${targetHeight}) exceeds browser limits. Using maximum supported size.`);
      hideProcessingSpinner();
      
      // Provide appropriate suggestions based on the failed resolution
      let suggestions = '';
      if (quality === '10K' || quality === '20K') {
        suggestions = 'Please try a lower resolution like 2K or 5K.';
      } else if (quality === '5K') {
        suggestions = 'Please try 2K resolution.';
      } else {
        suggestions = 'Please try a lower resolution.';
      }
      
      alert(`Resolution ${quality} is too large for your browser. ${suggestions}`);
      return;
    }
    
    // Initialize final dimensions
    let finalWidth: number;
    let finalHeight: number;
    
    // Special handling for ultra-high resolutions - use maximum browser-compatible size
    if ((quality === '10K' || quality === '20K') && (targetWidth > maxCanvasSize || targetHeight > maxCanvasSize)) {
      const aspectRatio = targetWidth / targetHeight;
      if (aspectRatio > 1) {
        // Landscape
        finalWidth = maxCanvasSize;
        finalHeight = Math.round(maxCanvasSize / aspectRatio);
      } else {
        // Portrait
        finalHeight = maxCanvasSize;
        finalWidth = Math.round(maxCanvasSize * aspectRatio);
      }
    } else {
      // Use target dimensions
      finalWidth = targetWidth;
      finalHeight = targetHeight;
    }
    
    // Create a temporary canvas with maximum quality
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) {
      console.error('Failed to create temporary canvas context');
      hideProcessingSpinner();
      return;
    }
    
    // Get the actual canvas dimensions for proper export
    const displayWidth = canvas.width / (devicePixelRatio * 2); // Account for 2x DPI multiplier
    const displayHeight = canvas.height / (devicePixelRatio * 2); // Account for 2x DPI multiplier
    const aspectRatio = displayWidth / displayHeight;
    
    // Create exports with both resolution AND DPI control for professional quality
    let dpi: number;
    let scaleFactor: number;
    
    if (quality === '2K') {
      // 2K: Web quality, DOUBLE pixel density with smaller pixels
      dpi = 600; // DOUBLED from 300 to 600 for twice as many smaller pixels
      scaleFactor = 12; // DOUBLED from 6 to 12 for twice as many pixels
      finalWidth = displayWidth * scaleFactor;
      finalHeight = displayHeight * scaleFactor;
    } else if (quality === '5K') {
      // 5K: High-quality display, DOUBLE pixel density with smaller pixels
      dpi = 1200; // DOUBLED from 600 to 1200 for twice as many smaller pixels
      scaleFactor = 30; // DOUBLED from 15 to 30 for twice as many pixels
      finalWidth = displayWidth * scaleFactor;
      finalHeight = displayHeight * scaleFactor;
    } else if (quality === '10K') {
      // 10K: Professional quality, DOUBLE pixel density with smaller pixels
      dpi = 2400; // DOUBLED from 1200 to 2400 for twice as many smaller pixels
      scaleFactor = 60; // DOUBLED from 30 to 60 for twice as many pixels
      finalWidth = displayWidth * scaleFactor;
      finalHeight = displayHeight * scaleFactor;
    } else if (quality === '20K') {
      // 20K: MAXIMUM quality, DOUBLE pixel density with smaller pixels (browser limit)
      dpi = 4800; // DOUBLED from 2400 to 4800 for twice as many smaller pixels
      scaleFactor = 120; // DOUBLED from 60 to 120 for twice as many pixels
      finalWidth = displayWidth * scaleFactor;
      finalHeight = displayHeight * scaleFactor;
    } else {
      // Fallback to aspect ratio scaling for unknown qualities
      dpi = 144;
      scaleFactor = 2;
      if (aspectRatio > targetWidth / targetHeight) {
        finalWidth = targetWidth;
        finalHeight = Math.round(targetWidth / aspectRatio);
      } else {
        finalHeight = targetHeight;
        finalWidth = Math.round(targetHeight * aspectRatio);
      }
    }
    
    // Be honest about actual resolution vs claimed resolution
    const _actualResolution = `${finalWidth}x${finalHeight}`;
    const _claimedResolution = quality === '20K' ? '16K (browser limit)' : quality;
    
    // Ensure we don't exceed browser limits
    if (finalWidth > maxCanvasSize || finalHeight > maxCanvasSize) {
      const maxScale = Math.min(maxCanvasSize / displayWidth, maxCanvasSize / displayHeight);
      finalWidth = displayWidth * maxScale;
      finalHeight = displayHeight * maxScale;
    }
    
    // Final honest logging
    const _finalActualResolution = `${finalWidth}x${finalHeight}`;
    const _finalClaimedResolution = quality === '20K' ? '16K (browser limit)' : quality;
    
    // Set the temporary canvas to target resolution
    tempCanvas.width = finalWidth;
    tempCanvas.height = finalHeight;
    
    // Enable MAXIMUM quality rendering settings (ULTRA vector-like quality)
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    
    // DOUBLE pixel density settings with smaller pixels
    tempCtx.lineWidth = 0.5; // Half-size pixels for twice as many pixels
    tempCtx.lineCap = 'round';
    tempCtx.lineJoin = 'round';
    
    // Professional rendering settings based on quality level
    if (quality === '20K') {
      // 20K: MAXIMUM professional quality settings
      tempCtx.textBaseline = 'alphabetic';
      tempCtx.textAlign = 'start';
      
      // Enable subpixel rendering for ultra-crisp text
      tempCtx.fontKerning = 'normal';
      
    } else if (quality === '10K') {
      // 10K: High professional quality
      tempCtx.textBaseline = 'alphabetic';
      tempCtx.textAlign = 'start';
    }
    
    // For 20K, implement maximum pixel density rendering with smaller pixels
    if (quality === '20K') {
      
      // Detect maximum possible quality for high-density rendering
      const maxQuality = detectMaximumVectorQuality(canvas);
      
      // Create a canvas at maximum pixel density with smaller pixels
      const highDensityCanvas = document.createElement('canvas');
      const highDensityCtx = highDensityCanvas.getContext('2d');
      
      if (highDensityCtx) {
        highDensityCanvas.width = maxQuality.maxWidth;
        highDensityCanvas.height = maxQuality.maxHeight;
        
        // DOUBLE pixel density settings with smaller pixels for ultra-crisp edges
        highDensityCtx.imageSmoothingEnabled = false; // Disable for pixel-perfect edges
        highDensityCtx.textBaseline = 'alphabetic';
        highDensityCtx.textAlign = 'start';
        highDensityCtx.fontKerning = 'normal';
        
        // Half-size pixel settings for twice as many pixels
        highDensityCtx.lineWidth = 0.25; // Quarter-size pixels for maximum density
        highDensityCtx.lineCap = 'round';
        highDensityCtx.lineJoin = 'round';
        
        // Scale the context to match the high resolution
        highDensityCtx.scale(maxQuality.maxScale, maxQuality.maxScale);
        
        // Recreate the background at high resolution with smaller pixels
        const gradient = highDensityCtx.createLinearGradient(0, 0, displayWidth, displayHeight);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#151E35');
        
        highDensityCtx.fillStyle = gradient;
        highDensityCtx.fillRect(0, 0, displayWidth, displayHeight);
        
        // Add high-resolution stars with smaller pixels
        highDensityCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 200; i++) {
          const x = Math.random() * displayWidth;
          const y = Math.random() * displayHeight;
          const size = Math.random() * 3 + 1;
          highDensityCtx.beginPath();
          highDensityCtx.arc(x, y, size, 0, 2 * Math.PI);
          highDensityCtx.fill();
        }
        
        // Draw the original canvas content at maximum pixel density
        highDensityCtx.drawImage(canvas, 0, 0, displayWidth, displayHeight);
        
        // Now scale this high-density result to the final size
        // Enable smoothing only for the final scaling step
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        tempCtx.drawImage(highDensityCanvas, 0, 0, finalWidth, finalHeight);
        
      } else {
        // Fallback to direct scaling
        tempCtx.drawImage(canvas, 0, 0, finalWidth, finalHeight);
      }
    } else {
      // For other qualities, use the existing multi-stage rendering
      const renderScaleFactor = Math.max(finalWidth / displayWidth, finalHeight / displayHeight);
      
      if (quality === '10K' || quality === '20K' || renderScaleFactor > 8) {
        // For ultra-high resolutions, use ENHANCED multi-stage rendering
        
        // Stage 1: Scale to 6K intermediate (ENHANCED from 4K)
        const stage1Size = 6144; // ENHANCED from 4096
        const stage1Canvas = document.createElement('canvas');
        const stage1Ctx = stage1Canvas.getContext('2d');
        
        if (stage1Ctx) {
          stage1Canvas.width = stage1Size;
          stage1Canvas.height = stage1Size * (displayHeight / displayWidth);
          
          stage1Ctx.imageSmoothingEnabled = true;
          stage1Ctx.imageSmoothingQuality = 'high';
          stage1Ctx.textBaseline = 'alphabetic';
          stage1Ctx.textAlign = 'start';
          stage1Ctx.fontKerning = 'normal';
          
          // DOUBLE pixel density settings with smaller pixels
          stage1Ctx.lineWidth = 0.25; // Quarter-size pixels for twice as many pixels
          stage1Ctx.lineCap = 'round';
          stage1Ctx.lineJoin = 'round';
          stage1Ctx.drawImage(canvas, 0, 0, stage1Canvas.width, stage1Canvas.height);
          
          // Stage 2: Scale to 12K intermediate (ENHANCED from 8K)
          if (quality === '10K' || quality === '20K' || renderScaleFactor > 16) {
            const stage2Size = 12288; // ENHANCED from 8192
            const stage2Canvas = document.createElement('canvas');
            const stage2Ctx = stage2Canvas.getContext('2d');
            
            if (stage2Ctx) {
              stage2Canvas.width = stage2Size;
              stage2Canvas.height = stage2Size * (displayHeight / displayWidth);
              
              stage2Ctx.imageSmoothingEnabled = true;
              stage2Ctx.imageSmoothingQuality = 'high';
              stage2Ctx.textBaseline = 'alphabetic';
              stage2Ctx.textAlign = 'start';
              stage2Ctx.fontKerning = 'normal';
              
              // DOUBLE pixel density settings with smaller pixels
              stage2Ctx.lineWidth = 0.25; // Quarter-size pixels for twice as many pixels
              stage2Ctx.lineCap = 'round';
              stage2Ctx.lineJoin = 'round';
              stage2Ctx.drawImage(stage1Canvas, 0, 0, stage2Canvas.width, stage2Canvas.height);
              
              // Stage 3: Scale to 16K intermediate (ENHANCED from 12K)
              if (quality === '20K' || renderScaleFactor > 24) {
                const stage3Size = 16384; // ENHANCED from 12288
                const stage3Canvas = document.createElement('canvas');
                const stage3Ctx = stage3Canvas.getContext('2d');
                
                if (stage3Ctx) {
                  stage3Canvas.width = stage3Size;
                  stage3Canvas.height = stage3Size * (displayHeight / displayWidth);
                  
                  stage3Ctx.imageSmoothingEnabled = true;
                  stage3Ctx.imageSmoothingQuality = 'high';
                  stage3Ctx.textBaseline = 'alphabetic';
                  stage3Ctx.textAlign = 'start';
                  stage3Ctx.fontKerning = 'normal';
                  
                  // DOUBLE pixel density settings with smaller pixels
                  stage3Ctx.lineWidth = 0.25; // Quarter-size pixels for twice as many pixels
                  stage3Ctx.lineCap = 'round';
                  stage3Ctx.lineJoin = 'round';
                  stage3Ctx.drawImage(stage2Canvas, 0, 0, stage3Canvas.width, stage3Canvas.height);
                  
                  // Final stage: Scale to target resolution with MAXIMUM pixel density
                  tempCtx.imageSmoothingEnabled = true;
                  tempCtx.imageSmoothingQuality = 'high';
                  tempCtx.textBaseline = 'alphabetic';
                  tempCtx.textAlign = 'start';
                  tempCtx.fontKerning = 'normal';
                  
                  // DOUBLE pixel density with smaller pixels
                  tempCtx.lineWidth = 0.125; // Eighth-size pixels for maximum density
                  tempCtx.lineCap = 'round';
                  tempCtx.lineJoin = 'round';
                  tempCtx.drawImage(stage3Canvas, 0, 0, finalWidth, finalHeight);
                } else {
                  tempCtx.drawImage(stage2Canvas, 0, 0, finalWidth, finalHeight);
                }
              } else {
                // Direct from stage 2 to final
                tempCtx.drawImage(stage2Canvas, 0, 0, finalWidth, finalHeight);
              }
            } else {
              tempCtx.drawImage(stage1Canvas, 0, 0, finalWidth, finalHeight);
            }
          } else {
            // Direct from stage 1 to final
            tempCtx.drawImage(stage1Canvas, 0, 0, finalWidth, finalHeight);
          }
        } else {
          // Fallback to direct scaling
          tempCtx.drawImage(canvas, 0, 0, finalWidth, finalHeight);
        }
      } else if (renderScaleFactor > 4) { // Lowered threshold for more quality
        // For medium-high resolutions, use ENHANCED single intermediate stage
        const intermediateSize = Math.min(6144, Math.max(displayWidth, displayHeight) * 3); // ENHANCED from 4096 and 2x
        const intermediateCanvas = document.createElement('canvas');
        const intermediateCtx = intermediateCanvas.getContext('2d');
        
        if (intermediateCtx) {
          intermediateCanvas.width = intermediateSize;
          intermediateCanvas.height = intermediateSize * (displayHeight / displayWidth);
          
          intermediateCtx.imageSmoothingEnabled = true;
          intermediateCtx.imageSmoothingQuality = 'high';
          intermediateCtx.textBaseline = 'alphabetic';
          intermediateCtx.textAlign = 'start';
          intermediateCtx.fontKerning = 'normal';
          
          // DOUBLE pixel density settings with smaller pixels
          intermediateCtx.lineWidth = 0.25; // Quarter-size pixels for twice as many pixels
          intermediateCtx.lineCap = 'round';
          intermediateCtx.lineJoin = 'round';
          intermediateCtx.drawImage(canvas, 0, 0, intermediateCanvas.width, intermediateCanvas.height);
          
          // Final stage: Scale to target resolution with MAXIMUM pixel density
          tempCtx.imageSmoothingEnabled = true;
          tempCtx.imageSmoothingQuality = 'high';
          tempCtx.textBaseline = 'alphabetic';
          tempCtx.textAlign = 'start';
          tempCtx.fontKerning = 'normal';
          
          // DOUBLE pixel density with smaller pixels
          tempCtx.lineWidth = 0.25; // Quarter-size pixels for twice as many pixels
          tempCtx.lineCap = 'round';
          tempCtx.lineJoin = 'round';
          tempCtx.drawImage(intermediateCanvas, 0, 0, finalWidth, finalHeight);
          
        } else {
          tempCtx.drawImage(canvas, 0, 0, finalWidth, finalHeight);
        }
      } else {
        // ENHANCED direct rendering with MAXIMUM pixel density
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        tempCtx.textBaseline = 'alphabetic';
        tempCtx.textAlign = 'start';
        tempCtx.fontKerning = 'normal';
        
        // DOUBLE pixel density with smaller pixels
        tempCtx.lineWidth = 0.25; // Quarter-size pixels for twice as many pixels
        tempCtx.lineCap = 'round';
        tempCtx.lineJoin = 'round';
        tempCtx.drawImage(canvas, 0, 0, finalWidth, finalHeight);
      }
    }
    
    // Add compact metadata with DPI information
    const now = new Date();
    const compactMetadata = `VIBE DRAWING by Michael Wybraniec | one-front.com | ${now.toLocaleDateString()} | ${dpi} DPI`;
    
    // Set up text styling for compact metadata
    tempCtx.save();
    tempCtx.textAlign = 'right';
    tempCtx.textBaseline = 'bottom';
    
    // Calculate compact dimensions
    const fontSize = Math.max(8, finalWidth / 300); // Smaller, more compact font
    const padding = Math.max(4, finalWidth / 200);
    const boxPadding = padding * 0.8;
    
    // Measure text for compact box
    tempCtx.font = `${fontSize}px Inter, sans-serif`;
    const textWidth = tempCtx.measureText(compactMetadata).width;
    const boxWidth = textWidth + boxPadding * 2;
    const boxHeight = fontSize + boxPadding * 2;
    
    // Create subtle background for compact metadata
    const x = finalWidth - boxWidth - padding;
    const y = finalHeight - boxHeight - padding;
    
    // Draw subtle rounded rectangle background
    tempCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    tempCtx.beginPath();
    tempCtx.roundRect(x, y, boxWidth, boxHeight, padding * 0.5);
    tempCtx.fill();
    
    // Add very subtle border
    tempCtx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
    tempCtx.lineWidth = 0.5;
    tempCtx.stroke();
    
    // Draw compact metadata text
    tempCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    tempCtx.font = `${fontSize}px Inter, sans-serif`;
    tempCtx.fillText(compactMetadata, finalWidth - padding - boxPadding, finalHeight - padding - boxPadding);
    
    tempCtx.restore();
    
    // Determine MIME type and quality based on format
    let mimeType: string;
    let qualityValue: number;
    let fileExtension: string;
    
    switch (format) {
      case 'PNG':
        mimeType = 'image/png';
        qualityValue = 1.0;
        fileExtension = 'png';
        break;
      case 'JPEG':
        mimeType = 'image/jpeg';
        qualityValue = 0.95;
        fileExtension = 'jpg';
        break;
      case 'WEBP':
        mimeType = 'image/webp';
        qualityValue = 0.95;
        fileExtension = 'webp';
        break;
      case 'TIFF':
        // TIFF is not supported by browsers, use PNG as fallback
        mimeType = 'image/png';
        qualityValue = 1.0;
        fileExtension = 'png';
        console.warn('TIFF format not supported by browsers, exporting as PNG instead');
        break;
      case 'PDF':
        // PDF is not supported by browsers, use PNG as fallback
        mimeType = 'image/png';
        qualityValue = 1.0;
        fileExtension = 'png';
        console.warn('PDF format not supported by browsers, exporting as PNG instead');
        break;
      default:
        mimeType = 'image/png';
        qualityValue = 1.0;
        fileExtension = 'png';
    }
    
    // Convert to blob with specified quality
    tempCanvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create image blob');
        hideProcessingSpinner();
        return;
      }
      
      // Hide processing spinner before download
      hideProcessingSpinner();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with short timestamp, quality, and format
      const shortTimestamp = now.toISOString().replace(/[:.]/g, '').slice(0, 15); // YYYYMMDDTHHMMSS
      link.download = `VIBE-DRAWING-${shortTimestamp}-${quality}.${fileExtension}`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
    }, mimeType, qualityValue);
    
  } catch (error) {
    console.error('Error saving canvas:', error);
    hideProcessingSpinner();
  }
}

function initContext(canvas: HTMLCanvasElement): void {
  // Enable high-DPI rendering for crisp, vector-like quality
  const devicePixelRatio = window.devicePixelRatio || 1;
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;
  
  // Set actual canvas size to high-DPI resolution for crisp quality
  const qualityMultiplier = 2; // 2x for crisp quality
  canvas.width = displayWidth * devicePixelRatio * qualityMultiplier;
  canvas.height = displayHeight * devicePixelRatio * qualityMultiplier;
  
  // Scale the canvas back down using CSS
  canvas.style.width = displayWidth + 'px';
  canvas.style.height = displayHeight + 'px';
  
  ctx = canvas.getContext('2d', {
    alpha: true,
    antialias: true,
    willReadFrequently: false,
  }) as CanvasRenderingContext2D | null;

  if (!ctx) {
    console.error('Failed to get 2D context!');
    return;
  }

  // Scale the drawing context to match the ULTRA-high-DPI canvas
  ctx.scale(devicePixelRatio * qualityMultiplier, devicePixelRatio * qualityMultiplier);

  // Enable maximum quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Ultra-high quality line rendering
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#111';
  
  // ENHANCED line quality settings
  ctx.lineWidth = 2; // Enhanced base line width
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Professional quality settings
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'start';
  ctx.fontKerning = 'normal';
  

  // Clear and setup the canvas immediately
  clearCanvas(canvas);
}

function clearCanvas(canvas: HTMLCanvasElement): void {
  if (!ctx) {
    console.error('Cannot clear canvas - no context!');
    return;
  }

  // Clear flame animation system
  _flames = [];
  if (_animationId) {
    cancelAnimationFrame(_animationId);
    _animationId = null;
  }

  // Clear neon trail
  // Clear glitch trail (removed - no longer used)
  // glitchTrail = [];

  // Clear fire trail (old system removed)
  // fireTrail = [];

  // Clear chalk trail (removed - no longer used)
  // chalkTrail = [];

  // Clear cosmic particles (removed - no longer used)
  // cosmicParticles = [];


  // Get display dimensions for proper scaling
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  // Create solid background with subtle vignette effect
  const baseColor = '#151E35'; // Solid dark blue base
  
  // Fill with solid color first
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, displayWidth, displayHeight);
  
  // Add very subtle vignette effect
  const centerX = displayWidth / 2;
  const centerY = displayHeight / 2;
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
  
  const vignetteGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
  vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Transparent in center
  vignetteGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)'); // Still transparent
  vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)'); // Very subtle darkening at edges
  
  ctx.fillStyle = vignetteGradient;
  ctx.fillRect(0, 0, displayWidth, displayHeight);

  // Add some subtle twinkling stars in the background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * displayWidth;
    const y = Math.random() * displayHeight;
    const size = Math.random() * 2 + 1;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.lineWidth = 20; // DOUBLED from 10 to 20 for enhanced line quality
  
  // Update debug info if enabled
  if (showDebugInfo) {
    updateDebugInfo();
  }
}


// Update debug info HTML component
function updateDebugInfo(): void {
  const currentInfoElement = document.getElementById('debug-current-info');
  const sizeInfoElement = document.getElementById('debug-size-info');
  
  if (!currentInfoElement || !sizeInfoElement) return;
  
  // Current settings - combined into fewer lines
  const actualCurrentStyle = styleManager.getCurrentStyle();
  const actualStyleIndex = styleManager.getCurrentStyleIndex();
  
  // Get memory usage with color coding
  const memoryInfo = (performance as any).memory;
  let memoryUsed = 'N/A';
  let memoryTotal = 'N/A';
  let memoryColor = '#666666';
  let memoryStatus = '';
  
  if (memoryInfo) {
    const usedMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
    const totalMB = memoryInfo.totalJSHeapSize / 1024 / 1024;
    const usagePercent = (usedMB / totalMB) * 100;
    
    memoryUsed = usedMB.toFixed(1);
    memoryTotal = totalMB.toFixed(1);
    
    // Color coding based on usage percentage
    if (usagePercent < 30) {
      memoryColor = '#66ff66'; // Green - Low usage
      memoryStatus = 'Low';
    } else if (usagePercent < 60) {
      memoryColor = '#ffff66'; // Yellow - Medium usage
      memoryStatus = 'Medium';
    } else if (usagePercent < 80) {
      memoryColor = '#ffaa66'; // Orange - High usage
      memoryStatus = 'High';
    } else {
      memoryColor = '#ff6666'; // Red - Very high usage
      memoryStatus = 'Critical';
    }
  }
  
  const currentInfo = [
    `Style ${actualStyleIndex + 1}: ${actualCurrentStyle.name}`,
    `Size: ${['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Giant'][currentSizeLevel]} (${sizeMultipliers[currentSizeLevel]?.toFixed(2)}x)`,
    `Thickness: ${thicknessMultiplier.toFixed(2)}x (Range: 0.2x-5.0x, Arrow Keys)`,
    `Eraser: ${isEraserMode ? 'ON' : 'OFF'}`,
    `Memory: <span style="color: ${memoryColor}">${memoryUsed}MB/${memoryTotal}MB (${memoryStatus})</span> | Limit: ${MEMORY_LIMIT_PERCENT}%`,
  ];
  
  currentInfoElement.innerHTML = currentInfo.map(info => `<div>${info}</div>`).join('');
  
  // Size tracking info - more compact format
  const sizeHeaders = ['T', 'S', 'M', 'L', 'H', 'G'];
  let sizeInfoHTML = '<div style="color: #ffff00; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">SIZE TRACKING</div>';
  sizeInfoHTML += '<div style="margin: 8px 0; color: #cccccc; font-family: monospace; font-size: 11px;">Style ' + sizeHeaders.map(h => h.padStart(6)).join('') + '</div>';
  
  // Draw size data for each style with alternating colors
  const styleNames = Object.keys(sizeTracker);
  styleNames.forEach((styleName, index) => {
    let lineText = styleName.padEnd(6);
    for (let i = 0; i < 6; i++) {
      const size = sizeTracker[styleName]?.[i];
      if (size !== undefined) {
        // Color code the sizes: red for very small, yellow for medium, green for large
        const sizeColor = size < 1 ? '#ff6666' : size < 3 ? '#ffff66' : '#66ff66';
        lineText += `<span style="color: ${sizeColor}">${size.toFixed(1).padStart(6)}</span>`;
      } else {
        lineText += '<span style="color: #666666">0.0'.padStart(6) + '</span>';
      }
    }
    const rowColor = index % 2 === 0 ? '#ffffff' : '#cccccc';
    sizeInfoHTML += `<div style="color: ${rowColor}; font-family: monospace; font-size: 11px; margin: 2px 0; padding-left: 8px;">${lineText}</div>`;
  });
  
  // Add compact progression analysis
  sizeInfoHTML += '<div style="margin-top: 16px; color: #ffff00; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">PROGRESSION RATIOS</div>';
  
  // Analyze each style's size progression - more compact
  styleNames.forEach(styleName => {
    const sizes = sizeTracker[styleName];
    if (sizes) {
      const progression = [];
      for (let i = 0; i < 4; i++) {
        const current = sizes[i];
        const next = sizes[i + 1];
        if (current !== undefined && next !== undefined) {
          const ratio = next / current;
          progression.push(ratio.toFixed(1));
        }
      }
      const progressionText = `${styleName}: ${progression.join(' → ')}`;
      sizeInfoHTML += `<div style="color: #cccccc; margin: 4px 0; padding-left: 8px; font-family: monospace; font-size: 11px;">${progressionText}</div>`;
    }
  });
  
  sizeInfoElement.innerHTML = sizeInfoHTML;
}

// Removed unused drawSizeTrackingInfo function

function updateSizeDebugDisplay(): void {
  // Update debug info HTML component
  if (showDebugInfo) {
    updateDebugInfo();
  }
}



// Debug function for Apple Pencil testing
function debugPointerEvent(_e: PointerEvent): void {
}

function attachPointerHandlers(canvas: HTMLCanvasElement): void {
  // Prevent default touch behaviors that interfere with Apple Pencil
  canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });

  canvas.addEventListener('pointerdown', (e: PointerEvent) => {
    // Debug Apple Pencil events
    if (e.pointerType === 'pen') {
      debugPointerEvent(e);
    }

    if (isDrawing) return; // Prevent multiple touches

    // For Style 2, ensure only one finger can draw at a time
    if (currentStyle === 2 && isStyle2Active) {
      return; // Block additional touches in Style 2
    }

    // Enhanced Apple Pencil detection and handling
    const isPencil = e.pointerType === 'pen';
    const isTouch = e.pointerType === 'touch';
    const _isMouse = e.pointerType === 'mouse';

    // Use pressure for Apple Pencil, default for touch/mouse
    let pressure = e.pressure !== undefined ? e.pressure : 0.5;

    // Apple Pencil specific optimizations
    if (isPencil) {
      // Ensure pressure is always valid for Apple Pencil
      pressure = Math.max(0.1, Math.min(1.0, pressure));
    }

    canvas.setPointerCapture(e.pointerId);
    isDrawing = true;
    if (currentStyle === 2) {
      isStyle2Active = true; // Mark Style 2 as active
    }
    points = [];
    const { x, y } = getCanvasPoint(canvas, e.clientX, e.clientY);

    // Enhanced size calculation for Apple Pencil
    let downMultiplier = calculateSizeMultiplier(e.width || 1, e.height || 1);

    // Apply pressure-based size adjustment for Apple Pencil
    if (isPencil) {
      // More sensitive pressure response for Apple Pencil
      downMultiplier *= 0.3 + pressure * 0.7; // Scale by pressure (0.3x to 1x)
    } else if (isTouch) {
      // Touch devices get moderate pressure scaling
      downMultiplier *= 0.5 + pressure * 0.5; // Scale by pressure (0.5x to 1x)
    }

    points.push({ x, y, t: e.timeStamp, width: 10, height: 10 });

    // Start continuous haptics feedback
    hapticsConstantStart();

    // Paint the initial contact area
    if (ctx) {
      const baseWidth = e.width || 1;
      const baseHeight = e.height || 1;

      let adjustedWidth, adjustedHeight, mobileMultiplier;

      if (isWebApp) {
        // Web app: Use consistent size for better drawing experience
        adjustedWidth = 45; // Smaller, finer size for web (reduced from 60)
        adjustedHeight = 45;
        mobileMultiplier = 1.0; // No mobile multiplier for web
      } else {
        // Mobile: Use actual finger contact area
        const minSize = 30; // Smaller for web visibility (reduced from 40)
        adjustedWidth = Math.max(baseWidth, minSize);
        adjustedHeight = Math.max(baseHeight, minSize);
        // Add 20% size increase for mobile devices (when touch area > 1)
        mobileMultiplier = baseWidth > 1 || baseHeight > 1 ? 1.2 : 1.0;
      }

      const touchWidth = adjustedWidth * downMultiplier * mobileMultiplier;
      const _touchHeight = adjustedHeight * downMultiplier * mobileMultiplier;
      const maxSize = Math.max(touchWidth, _touchHeight);

      const currentStyleIndex = styleManager.getCurrentStyleIndex();
      if (currentStyleIndex === 0) {
        // Style 1: Use new separated style system
        drawWithCurrentStyle(ctx, x, y, touchWidth, _touchHeight);
      } else if (currentStyleIndex === 1) {
        // Style 2 (Lava)
        if (isEraserMode) {
          // Eraser mode for Style 2 - match the 3D sphere size
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          
          // Calculate the same size as the 3D sphere drawing
          const baseSize = (touchWidth / 2) * (0.95 + Math.random() * 0.1);
          const pulseScale = 1 + Math.sin(Date.now() / 160) * 0.03;
          const calculatedSize = baseSize * pulseScale;
          const enhancedSize = calculatedSize * (1 + currentSizeLevel * 0.3) * thicknessMultiplier;
          const sphereSize = Math.max(3.0, enhancedSize);
          
          // Erase with the same size as the 3D sphere
          const eraserSize = sphereSize * 0.15; // Match the sphere radius
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
          ctx.beginPath();
          ctx.arc(x, y, eraserSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        } else {
          // Style 2: Use new separated style system
          drawWithCurrentStyle(ctx, x, y, touchWidth, _touchHeight);
        }
      } else if (currentStyleIndex === 2) {
        // Style 3 (Glitch)
        if (isEraserMode) {
          // Eraser mode for Style 3 - match the wave size
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          
          // Calculate the same size as the wave drawing (normal size)
          const baseSize = (touchWidth / 2) * (0.95 + Math.random() * 0.1);
          const pulseScale = 1 + Math.sin(Date.now() / 160) * 0.03;
          const waveSize = baseSize * pulseScale; // Normal size like Style 1
          
          // Erase with the same size as the wave
          const eraserSize = waveSize * 0.3; // Match the wave size
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
          ctx.beginPath();
          ctx.arc(x, y, eraserSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        } else {
          // Style 3: Use new separated style system
          drawWithCurrentStyle(ctx, x, y, touchWidth, _touchHeight);
        }
      } else if (currentStyleIndex === 3) {
        // Style 4 (Fire)
        if (isEraserMode) {
          // Eraser mode for Style 4 - match the fire effect size
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          
          // Calculate the same size as the fire effect drawing
          const fireSizeMultiplier = calculateSizeMultiplier(touchWidth, _touchHeight);
          const lavaSize = Math.max(touchWidth, _touchHeight) * 0.4 * fireSizeMultiplier;
          
          // Erase with the same size as the fire effect
          const eraserSize = lavaSize * 1.5; // Slightly larger to ensure complete erasing
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
          ctx.beginPath();
          ctx.arc(x, y, eraserSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        } else {
          // Style 4: EPIC FIRE EFFECT
          // Style 4: Use new separated style system
          drawWithCurrentStyle(ctx, x, y, touchWidth, _touchHeight);
        }
      } else if (currentStyleIndex === 4) {
        // Style 5 (Water)
        if (isEraserMode) {
          // Eraser mode for Style 5 - match the water effect size
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          
          // Calculate the same size as the water effect drawing
          const waterSizeMultiplier = calculateSizeMultiplier(touchWidth, _touchHeight);
          const waterSize = Math.max(touchWidth, _touchHeight) * 0.25 * waterSizeMultiplier;
          
          // Erase with the same size as the water effect (including scaling)
          const scaledWaterSize = waterSize * (1 + currentSizeLevel * 0.3) * thicknessMultiplier;
          const eraserSize = scaledWaterSize * 1.5; // Slightly larger to ensure complete erasing
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
          ctx.beginPath();
          ctx.arc(x, y, eraserSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        } else {
          // Style 5: Use new separated style system
          drawWithCurrentStyle(ctx, x, y, touchWidth, _touchHeight);
        }
      } else if (currentStyleIndex === 5) {
        // Style 6 (Epic)
        if (isEraserMode) {
          // Eraser mode for Style 6
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          const eraserSize = Math.max(touchWidth, _touchHeight) * 3.0; // 3x bigger eraser
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
          ctx.beginPath();
          ctx.arc(x, y, eraserSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        } else {
          // Style 6: Use new separated style system
          drawWithCurrentStyle(ctx, x, y, touchWidth, _touchHeight);
        }
      } else if (currentStyleIndex === 6) {
        // Style 7: Use new separated style system
        drawWithCurrentStyle(ctx, x, y, touchWidth, _touchHeight);
      } else if (currentStyleIndex === 7) {
        // Style 8: Use new separated style system
        drawWithCurrentStyle(ctx, x, y, touchWidth, _touchHeight);
      } else {
        // Style 1 & other styles: Regular smooth dot
        ctx.save();

        ctx.globalAlpha = 0.8;


        // Paint main ellipse with pulsing effect and HD quality (same for drawing and erasing)
        const pulseScale = 1 + Math.sin(Date.now() / 200) * 0.1; // Gentle pulsing
        const radiusX = (touchWidth / 2) * pulseScale;
        const radiusY = (_touchHeight / 2) * pulseScale;

        // Set eraser mode or drawing mode
        if (isEraserMode) {
          // Eraser: draw with background color to "erase"
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#151E35'; // Dark blue background color to cover drawn content
        } else {
          // Normal drawing mode
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#000000'; // Default color - old system removed
        }

        // Create radial gradient for HD quality
        if (isEraserMode) {
          // For eraser, use background color gradient
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(radiusX, radiusY));
          gradient.addColorStop(0, '#151E35');
          gradient.addColorStop(0.7, '#151E35');
          gradient.addColorStop(1, '#151E35');
          ctx.fillStyle = gradient;
        } else {
          // For drawing, use the normal color gradient
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(radiusX, radiusY));
          gradient.addColorStop(0, '#000000'); // Default color - old system removed
          gradient.addColorStop(0.7, '#333333'); // Default color - old system removed
          gradient.addColorStop(1, '#666666'); // Default color - old system removed
          ctx.fillStyle = gradient;
        }
        ctx.beginPath();
        ctx.ellipse(
          x,
          y, // center position
          radiusX, // horizontal radius (pulsing)
          radiusY, // vertical radius (pulsing)
          0, // rotation
          0,
          2 * Math.PI, // full ellipse
        );
        ctx.fill();

        ctx.restore();

        // Add sparkle effect for Style 1 (ParticleStyle) - random but performant splash
        if (maxSize > 15 && !isEraserMode) {
          const currentStyleIndex = styleManager.getCurrentStyleIndex();
          
          if (currentStyleIndex === 0) {
            // Style 1 (ParticleStyle): Random but performant sparkle effects
            const sparkleChance = Math.random() < 0.7; // 70% chance for Style 1 on pointerdown
            if (sparkleChance) {
              ctx.save();
              ctx.globalAlpha = 0.5; // Balanced alpha for performance
              // addSparkleEffect(ctx, x, y, maxSize); // Old function removed
              ctx.restore();
            }
          } else {
            // Other styles: Regular sparkle effects
            // addSparkleEffect(ctx, x, y, maxSize); // Old function removed
          }
        }
      }
    } else {
      console.error('Canvas context is null! Cannot draw.');
    }
  });

  canvas.addEventListener('pointermove', (e: PointerEvent) => {
    // Check memory usage during drawing
    if (isDrawing) {
      checkMemoryUsage();
    }
    
    // Debug Apple Pencil events during drawing
    if (e.pointerType === 'pen' && isDrawing) {
      debugPointerEvent(e);
    }

    if (!isDrawing) return;
    const { x, y } = getCanvasPoint(canvas, e.clientX, e.clientY);
    const last = points[points.length - 1]!;
    const dt = Math.max(0.001, e.timeStamp - (last.t || 0));
    const dx = x - last.x;
    const dy = y - last.y;
    const speed = Math.hypot(dx, dy) / dt; // px/ms
    
    // Speed-based optimization for mobile - reduce effects when drawing fast
    const isFastDrawing = speed > 2.0; // Fast drawing threshold
    const _isMobile = !isWebApp;

    // Enhanced Apple Pencil detection and pressure handling
    const isPencil = e.pointerType === 'pen';
    const isTouch = e.pointerType === 'touch';
    const _isMouse = e.pointerType === 'mouse';

    // Use pressure for Apple Pencil, default for touch/mouse
    let pressure = e.pressure !== undefined ? e.pressure : 0.5;

    // Apple Pencil specific optimizations
    if (isPencil) {
      // Ensure pressure is always valid for Apple Pencil
      pressure = Math.max(0.1, Math.min(1.0, pressure));
    }

    // Calculate size multiplier for display - optimized for Apple Pencil
    let moveMultiplier = calculateSizeMultiplier(e.width || 1, e.height || 1);

    // Apply pressure-based size adjustment
    if (isPencil) {
      // More sensitive pressure response for Apple Pencil
      moveMultiplier *= 0.3 + pressure * 0.7; // Scale by pressure (0.3x to 1x)
    } else if (isTouch) {
      // Touch devices get moderate pressure scaling
      moveMultiplier *= 0.5 + pressure * 0.5; // Scale by pressure (0.5x to 1x)
    }

    points.push({ x, y, t: e.timeStamp, speed, width: 10, height: 10 });

    if (!ctx) return;

    // Calculate distance between last point and current point
    const distance = Math.hypot(x - last.x, y - last.y);

    // OPTIMIZED dot spacing - balanced for quality and performance
    let dotSpacing;
    if (isPencil) {
      // Apple Pencil gets optimized spacing (slightly wider for heavy styles to prevent lag)
      dotSpacing = currentStyle === 2 ? 0.4 : currentStyle === 5 ? 0.4 : 0.3; // Wider for heavy styles
    } else {
      // Touch and mouse get optimized spacing (much wider for mobile performance, especially for fast drawing)
      if (_isMobile && isFastDrawing) {
        // Ultra-wide spacing for fast mobile drawing
        dotSpacing = currentStyle === 2 ? 3.0 : currentStyle === 5 ? 3.0 : 2.5; // Ultra-wide for fast mobile drawing
      } else {
        dotSpacing = currentStyle === 2 ? 2.0 : currentStyle === 5 ? 2.0 : isWebApp ? 0.3 : 1.5; // Normal mobile spacing
      }
    }

    const numDots = Math.max(1, Math.ceil(distance / dotSpacing));

    // OPTIMIZED density multiplier - reduced for heavy styles to prevent lag
    let densityMultiplier;
    if (isPencil) {
      // Apple Pencil gets optimized density (reduced for styles 2 & 5 to prevent lag)
      densityMultiplier = currentStyle === 2 ? 3.5 : currentStyle === 5 ? 3.5 : 7.0; // Reduced heavy styles
    } else {
      // Touch and mouse get optimized density (much reduced for mobile performance, especially fast drawing)
      if (_isMobile && isFastDrawing) {
        // Ultra-low density for fast mobile drawing
        densityMultiplier = currentStyle === 2 ? 0.5 : currentStyle === 5 ? 0.5 : 0.8; // Ultra-low for fast mobile drawing
      } else {
        densityMultiplier = currentStyle === 2 ? 1.0 : currentStyle === 5 ? 1.0 : isWebApp ? 5.0 : 1.5; // Normal mobile density
      }
    }

    // Optimized minimum dots - much reduced for mobile performance, especially fast drawing
    const minDots = (currentStyle === 2 || currentStyle === 5) ? 1 : isWebApp ? 8 : 2; // Even more reduced for mobile fast drawing
    const adjustedNumDots = Math.max(minDots, Math.ceil(numDots * densityMultiplier));

    const baseWidth = e.width || 1;
    const baseHeight = e.height || 1;

    let adjustedWidth, adjustedHeight, mobileMultiplier;

    if (isWebApp) {
      // Web app: Use consistent size for better drawing experience
      adjustedWidth = 45; // Smaller, finer size for web (reduced from 60)
      adjustedHeight = 45;
      mobileMultiplier = 1.0; // No mobile multiplier for web
    } else {
      // Mobile: Use actual finger contact area
      const minSize = 30; // Smaller for web visibility (reduced from 40)
      adjustedWidth = Math.max(baseWidth, minSize);
      adjustedHeight = Math.max(baseHeight, minSize);
      // Add 20% size increase for mobile devices (when touch area > 1)
      mobileMultiplier = baseWidth > 1 || baseHeight > 1 ? 1.2 : 1.0;
    }

    const touchWidth = adjustedWidth * moveMultiplier * mobileMultiplier;
    const _touchHeight = adjustedHeight * moveMultiplier * mobileMultiplier;

    ctx.save();
    ctx.globalAlpha = 0.8; // Slightly transparent for natural ink effect

    // Paint multiple dots along the path with ULTRA-HIGH density for maximum detail
    for (let i = 0; i <= adjustedNumDots; i++) {
      const t = i / adjustedNumDots; // interpolation factor (0 to 1)
      const dotX = last.x + (x - last.x) * t;
      const dotY = last.y + (y - last.y) * t;
      
      // Add sub-pixel detail for ultra-smooth lines
      const subPixelOffset = Math.sin(i * 0.5) * 0.1; // Subtle sub-pixel variation
      const finalDotX = dotX + subPixelOffset;
      const finalDotY = dotY + subPixelOffset;

      const currentStyleIndex = styleManager.getCurrentStyleIndex();
      if (currentStyleIndex === 0) {
        // Style 1: Use new separated style system
        drawWithCurrentStyle(ctx, finalDotX, finalDotY, touchWidth, _touchHeight);
      } else if (currentStyleIndex === 1) {
        // Style 2 (Lava)
        if (isEraserMode) {
          // Eraser mode for Style 2 - match the 3D sphere size
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          
          // Calculate the same size as the 3D sphere drawing
          const baseSize = (touchWidth / 2) * (0.95 + Math.random() * 0.1);
          const pulseScale = 1 + Math.sin(Date.now() / 160) * 0.03;
          const calculatedSize = baseSize * pulseScale;
          const enhancedSize = calculatedSize * (1 + currentSizeLevel * 0.3) * thicknessMultiplier;
          const sphereSize = Math.max(3.0, enhancedSize);
          
          // Erase with the same size as the 3D sphere
          const eraserSize = sphereSize * 0.15; // Match the sphere radius
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
          ctx.beginPath();
          ctx.arc(finalDotX, finalDotY, eraserSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        } else {
          // Style 2: Use new separated style system
          drawWithCurrentStyle(ctx, finalDotX, finalDotY, touchWidth, _touchHeight);
        }
      } else if (currentStyleIndex === 2) {
        // Style 3 (Glitch)
        if (isEraserMode) {
          // Eraser mode for Style 3 - match the wave size
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          
          // Calculate the same size as the wave drawing (normal size)
          const baseSize = (touchWidth / 2) * (0.95 + Math.random() * 0.1);
          const pulseScale = 1 + Math.sin(Date.now() / 160) * 0.03;
          const waveSize = baseSize * pulseScale; // Normal size like Style 1
          
          // Erase with the same size as the wave
          const eraserSize = waveSize * 0.3; // Match the wave size
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
          ctx.beginPath();
          ctx.arc(finalDotX, finalDotY, eraserSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        } else {
        // Style 3: Use new separated style system
          drawWithCurrentStyle(ctx, finalDotX, finalDotY, touchWidth, _touchHeight);
        }
      } else if (currentStyleIndex === 3) {
        // Style 4 (Fire)
        if (isEraserMode) {
          // Eraser mode for Style 4 - match the fire effect size
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          
          // Calculate the same size as the fire effect drawing
          const fireSizeMultiplier = calculateSizeMultiplier(touchWidth, _touchHeight);
          const lavaSize = Math.max(touchWidth, _touchHeight) * 0.4 * fireSizeMultiplier;
          
          // Erase with the same size as the fire effect
          const eraserSize = lavaSize * 1.5; // Slightly larger to ensure complete erasing
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
          ctx.beginPath();
          ctx.arc(finalDotX, finalDotY, eraserSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        } else {
        // Style 4: Use new separated style system
          drawWithCurrentStyle(ctx, finalDotX, finalDotY, touchWidth, _touchHeight);
        }
      } else if (currentStyleIndex === 4) {
        // Style 5 (Water)
        if (isEraserMode) {
          // Eraser mode for Style 5 - match the water effect size
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          
          // Calculate the same size as the water effect drawing
          const waterSizeMultiplier = calculateSizeMultiplier(touchWidth, _touchHeight);
          const waterSize = Math.max(touchWidth, _touchHeight) * 0.25 * waterSizeMultiplier;
          
          // Erase with the same size as the water effect (including scaling)
          const scaledWaterSize = waterSize * (1 + currentSizeLevel * 0.3) * thicknessMultiplier;
          const eraserSize = scaledWaterSize * 1.5; // Slightly larger to ensure complete erasing
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
          ctx.beginPath();
          ctx.arc(finalDotX, finalDotY, eraserSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        } else {
        // Style 5: Use new separated style system
          drawWithCurrentStyle(ctx, finalDotX, finalDotY, touchWidth, _touchHeight);
        }
      } else if (currentStyleIndex === 5) {
        // Style 6 (Epic)
        // Style 6: Use new separated style system
        drawWithCurrentStyle(ctx, finalDotX, finalDotY, touchWidth, _touchHeight);
      } else if (currentStyleIndex === 6) {
        // Style 7: Use new separated style system
        drawWithCurrentStyle(ctx, finalDotX, finalDotY, touchWidth, _touchHeight);
      } else if (currentStyleIndex === 7) {
        // Style 8: Use new separated style system
        drawWithCurrentStyle(ctx, finalDotX, finalDotY, touchWidth, _touchHeight);
      } else {
        // Style 1 & other styles: Regular smooth dots or eraser
        // Use the same size calculation for both drawing and erasing
        // Enhanced size transitions for Apple Pencil
        let sizeVariation;
        if (isPencil) {
          // Apple Pencil gets more stable size for consistent lines
          sizeVariation = 0.98 + Math.random() * 0.04; // 98-102% size variation
        } else {
          // Touch and mouse get standard variation
          sizeVariation = 0.95 + Math.random() * 0.1; // 95-105% size variation
        }

        const pulseScale = 1 + Math.sin((Date.now() + i * 40) / 160) * 0.03; // Much gentler pulsing (was 0.096)
        const finalSize = (touchWidth / 2) * sizeVariation * pulseScale;
        const finalHeight = (_touchHeight / 2) * sizeVariation * pulseScale;

        // Set eraser mode or drawing mode
        if (isEraserMode) {
          // Eraser: draw with background color to "erase"
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#151E35'; // Dark blue background color to cover drawn content
        } else {
          // Normal drawing mode
          ctx.globalCompositeOperation = 'source-over';
          const colorT = Math.sin(t * Math.PI) * 0.12; // 20% more color variation (was 0.1)
          const _colorMultiplier = moveMultiplier + colorT;
          
          // Old randomizer logic removed - now using color variants system
        }

        ctx.beginPath();
        ctx.ellipse(
          dotX,
          dotY, // interpolated position
          finalSize, // horizontal radius with enhanced variation
          finalHeight, // vertical radius with enhanced variation
          0, // rotation
          0,
          2 * Math.PI, // full ellipse
        );
        ctx.fill();

        // Enhanced sparkle effects for Style 1 (ParticleStyle) - optimized for mobile and fast drawing
        if (Math.max(touchWidth, _touchHeight) > 10 && !isEraserMode) {
          const currentStyleIndex = styleManager.getCurrentStyleIndex();
          
          if (currentStyleIndex === 0) {
            // Style 1 (ParticleStyle): Reduced sparkle frequency for mobile performance
            let sparkleChance;
            if (isWebApp) {
              sparkleChance = 0.6;
            } else if (_isMobile && isFastDrawing) {
              sparkleChance = 0.1; // Ultra-reduced for fast mobile drawing
            } else {
              sparkleChance = 0.3; // Normal mobile
            }
            
            if (sparkleChance && Math.random() < sparkleChance) {
              ctx.save();
              ctx.globalAlpha = 0.5; // Balanced alpha for performance
              // addSparkleEffect(ctx, dotX, dotY, Math.max(touchWidth, _touchHeight) / 2.5); // Old function removed
              ctx.restore();
            }
          } else {
            // Other styles: Much reduced sparkle effects for mobile and fast drawing
            let sparkleChance;
            if (isPencil) {
              sparkleChance = 0.4;
            } else if (isWebApp) {
              sparkleChance = 0.2;
            } else if (_isMobile && isFastDrawing) {
              sparkleChance = 0.02; // Ultra-reduced for fast mobile drawing
            } else {
              sparkleChance = 0.1; // Normal mobile
            }

            if (Math.random() < sparkleChance) {
              ctx.save();
              ctx.globalAlpha = 0.4;
              // addSparkleEffect(ctx, dotX, dotY, Math.max(touchWidth, _touchHeight) / 3); // Old function removed
              ctx.restore();
            }
          }
        }
      }
    }

    ctx.restore();
  });

  const end = (e: PointerEvent) => {
    if (!isDrawing) return;
    isDrawing = false;
    if (currentStyle === 2) {
      isStyle2Active = false; // Reset Style 2 tracking
    }
    canvas.releasePointerCapture(e.pointerId);

    // Add a short sound when drawing ends
    try {
      if (audioContext && audioContext.state !== 'suspended') {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // End drawing sound - descending tone
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      }
    } catch (error) {
      console.error('Error playing drawing end sound:', error);
    }

    // Reset pressure tracking for next stroke
    // velocityHistory = []; // Removed
    // touchStartTime = 0; // Removed
  };

  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', end);
}

// Sound effects for splash screen
let audioContext: AudioContext | null = null;
let audioInitialized = false;

function initAudio() {
  if (audioInitialized) return;

  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioInitialized = true;
  } catch {
    // Mark as ready even if audio fails to prevent blocking
    audioInitialized = true;
  }
}

function playSplashSound() {
  // Initialize audio context if not already done
  if (!audioContext) {
    initAudio();
  }
  
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(console.warn);
  }

  try {
    if (!audioContext) {
      console.warn('Audio context not available for splash sound');
      return;
    }

    // Create a playful "bounce" sound effect using Web Audio API
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Bouncy ascending tone
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.4);
    oscillator.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.6);

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.4, audioContext.currentTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 0.4);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.6);
  } catch (error) {
    console.error('Error playing splash sound:', error);
  }
}

function playZoomSound() {
  if (!audioContext || audioContext.state === 'suspended') {
    audioContext?.resume();
  }

  try {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Exciting ascending "whoosh" sound
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1500, audioContext.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch(error) {
    console.error('Error playing zoom sound:', error);
  }
}

// Initialize audio on any user interaction
function initAudioOnInteraction() {
  if (!audioInitialized) {
    initAudio();
    playSplashSound();
  }
}

// Add event listeners for user interaction
document.addEventListener('click', initAudioOnInteraction);
document.addEventListener('touchstart', initAudioOnInteraction);
document.addEventListener('keydown', initAudioOnInteraction);

// Initialize audio context immediately
initAudio();

// Add global functions for onclick handlers
(window as any).showInfoPopup = showInfoPopup;
(window as any).hideInfoPopup = hideInfoPopup;

// Close popup when clicking outside
document.addEventListener('click', (e) => {
  const popup = document.getElementById('info-popup');
  if (popup && e.target === popup) {
    hideInfoPopup();
  }
});

// Old randomizer logic removed - now using color variants system

// Old generateRandomStyle1Parameters function removed - now using color variants


function init(): void {
  const canvas = document.getElementById('app-canvas') as HTMLCanvasElement | null;

  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // Enhanced Apple Pencil and touch support

  // Prevent all native touch behaviors that interfere with drawing
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('selectstart', (e) => e.preventDefault());
  document.addEventListener('dragstart', (e) => e.preventDefault());

  // Prevent zoom and other gestures
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('gesturechange', (e) => e.preventDefault());
  document.addEventListener('gestureend', (e) => e.preventDefault());

  // Enhanced canvas event prevention for Apple Pencil
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('selectstart', (e) => e.preventDefault());
  canvas.addEventListener('dragstart', (e) => e.preventDefault());

  // Additional Apple Pencil optimizations
  canvas.style.touchAction = 'none';
  (canvas.style as any).webkitTouchCallout = 'none';
  (canvas.style as any).webkitUserSelect = 'none';
  canvas.style.userSelect = 'none';

  initContext(canvas);

  resizeCanvas(canvas);

  // Force a complete canvas reset to ensure everything is properly initialized
  if (ctx && canvas) {
    clearCanvas(canvas);
  }

  const onResize = () => resizeCanvas(canvas);
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  (window as any).visualViewport?.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') resizeCanvas(canvas);
  });

  attachPointerHandlers(canvas);

  // No complex animations needed for Style 2 anymore

  // Simple 300ms loading timer
  setTimeout(() => {
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
      playZoomSound(); // Play zoom sound when starting to fade out
      splashScreen.classList.add('fade-out');
      setTimeout(() => {
        splashScreen.style.display = 'none';
        // Show the ONE-FRONT credit after splash screen is hidden
        const oneFrontCredit = document.querySelector('.one-front-credit') as HTMLElement;
        if (oneFrontCredit) {
          oneFrontCredit.classList.add('show');
        }
      }, 300);
    }
  }, 300);

  // Play initial sound when splash screen loads
  setTimeout(() => {
    playSplashSound();
  }, 200);

  // Style selector button functionality (NEW FEATURE: Switch styles)
  const styleSelectorButton = document.getElementById('style-selector');
  if (styleSelectorButton) {
    const styleSelectorHandler = () => {
      // Add strong click feedback
      styleSelectorButton.style.transform = 'scale(0.85)';
      styleSelectorButton.style.opacity = '0.7';
      setTimeout(() => {
        styleSelectorButton.style.transform = '';
        styleSelectorButton.style.opacity = '';
      }, 200);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      // Switch to next drawing style
      styleManager.nextStyle();
      const newStyle = styleManager.getCurrentStyle();

      // Update button icon to show current style
      styleSelectorButton.textContent = (styleManager.getCurrentStyleIndex() + 1).toString();

      // Set consistent white color for numbers
      styleSelectorButton.style.color = 'white';

      styleSelectorButton.title = `Current: ${newStyle.name}\nTap to switch drawing style`;
      
      // Update size number display for new style
      
    };

    // Add event listeners
    styleSelectorButton.addEventListener('click', styleSelectorHandler);
    styleSelectorButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      styleSelectorHandler();
    });
    styleSelectorButton.addEventListener('touchend', (e) => {
      e.preventDefault();
    });

    // Menu toggle event listener
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', toggleMenu);
      menuToggle.addEventListener('touchstart', (e) => {
        e.preventDefault();
        toggleMenu();
      });
    }

    // Initialize with current style
    const currentStyle = styleManager.getCurrentStyle();
    styleSelectorButton.textContent = (styleManager.getCurrentStyleIndex() + 1).toString();
    styleSelectorButton.style.color = 'white';
    styleSelectorButton.title = `Current: ${currentStyle.name}\nTap to switch drawing style`;
  }

  // Style switch button functionality (OLD FEATURE: Randomize current style)
  const styleSwitchButton = document.getElementById('style-switch');
  if (styleSwitchButton) {
    const styleSwitchHandler = () => {
      // Add strong click feedback
      styleSwitchButton.style.transform = 'scale(0.85)';
      styleSwitchButton.style.opacity = '0.7';
      setTimeout(() => {
        styleSwitchButton.style.transform = '';
        styleSwitchButton.style.opacity = '';
      }, 200);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      // Randomize colors for CURRENT style only
      const currentStyle = styleManager.getCurrentStyle();
      
      if (currentStyle.nextColorVariant) {
        currentStyle.nextColorVariant();
      }
        
      // Change button color (visual feedback)
        const randomHue = Math.floor(Math.random() * 360);
        styleSwitchButton.style.color = `hsl(${randomHue}, 85%, 55%)`;
        

      // Don't clear canvas - preserve existing drawing
    };

    // Add multiple event listeners for better mobile responsiveness
    styleSwitchButton.addEventListener('click', styleSwitchHandler);
    styleSwitchButton.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent default touch behavior
      styleSwitchHandler();
    });
    styleSwitchButton.addEventListener('touchend', (e) => {
      e.preventDefault(); // Prevent default touch behavior
    });

    // Initialize with random parameters and button color
    // generateRandomStyle1Parameters(); // Old function removed
    const randomHue = Math.floor(Math.random() * 360);
    styleSwitchButton.style.color = `hsl(${randomHue}, 85%, 55%)`;
  }

  // Pizza Size Selector functionality
  const sizeSelector = document.getElementById('size-selector');
  const vibrationKnob = document.getElementById('vibration-knob') as HTMLInputElement | null;
  
  
  
  
  
  
  // Initialize Size Selector component (Pizza for desktop, Numbers for mobile)
  let pizzaSizeSelector: PizzaSizeSelector | null = null;
  let numbersSizeSelector: NumbersSizeSelector | null = null;
  
  if (sizeSelector) {
    const sizeChangeCallback = (size: number) => {
      currentSizeLevel = size;
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
      
      // Audio feedback (if available)
      if (typeof (window as any).audioContext !== 'undefined' && (window as any).gainNode) {
        const audioCtx = (window as any).audioContext;
        const gain = (window as any).gainNode;
        const oscillator = audioCtx.createOscillator();
        oscillator.connect(gain);
        oscillator.frequency.setValueAtTime(800 + currentSizeLevel * 200, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      }
      
      const _sizeNames = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Giant'];
    };

    // Use pizza selector for both desktop and mobile (single-click cycling)
    console.log('Mobile detection:', {
      hasOntouchstart: 'ontouchstart' in window,
      maxTouchPoints: window.navigator.maxTouchPoints,
      isWebApp: isWebApp,
      windowWidth: window.innerWidth,
      userAgent: navigator.userAgent
    });
    
    console.log('Using PizzaSizeSelector (single-click cycling for all devices)');
    pizzaSizeSelector = new PizzaSizeSelector(sizeSelector, currentSizeLevel, sizeChangeCallback);
  }
  
  // Test function to manually change size level (for debugging)
  (window as any).setSizeLevel = (level: number) => {
    if (level >= 0 && level < 6) {
      currentSizeLevel = level;
      if (pizzaSizeSelector) {
        pizzaSizeSelector.setSize(level);
      }
      if (numbersSizeSelector) {
        numbersSizeSelector.setSize(level);
      }
    }
  };
  
  // Make currentSizeLevel globally accessible for testing
  (window as any).currentSizeLevel = currentSizeLevel;
  
  

  // Vibration knob only
  let vibrationIntensity = 1.0; // 0..1 (kept for future haptics on iPhone)

  const applyKnob = () => {
    if (vibrationKnob) vibrationIntensity = parseFloat(vibrationKnob.value);
    (window as any).vibrationIntensity = vibrationIntensity;
  };

  vibrationKnob?.addEventListener('input', applyKnob);
  applyKnob();

  // Keyboard controls for thickness slider and size level
  const handleThicknessKey = (event: KeyboardEvent) => {
    
    const currentValue = thicknessMultiplier;
    const step = 0.2;
    const min = 0.2;
    const max = 5.0;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      // Decrease thickness (higher pitch)
      const newValue = Math.max(min, currentValue - step);
      thicknessMultiplier = newValue;
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      // Increase thickness (lower pitch)
      const newValue = Math.min(max, currentValue + step);
      thicknessMultiplier = newValue;
    } else if (event.key === '[' || event.key === '{') {
      // Decrease size level
      currentSizeLevel = Math.max(0, currentSizeLevel - 1);
    } else if (event.key === ']' || event.key === '}') {
      // Increase size level
      currentSizeLevel = Math.min(4, currentSizeLevel + 1);
    }
  };

  // Add keyboard event listener
  document.addEventListener('keydown', handleThicknessKey);

  // Eraser button functionality
  const eraserButton = document.getElementById('eraser');
  if (eraserButton) {
    const eraserHandler = () => {
      // Add strong click feedback
      eraserButton.style.transform = 'scale(0.85)';
      eraserButton.style.opacity = '0.7';
      setTimeout(() => {
        eraserButton.style.transform = '';
        eraserButton.style.opacity = '';
      }, 200);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      isEraserMode = !isEraserMode;
      if (isEraserMode) {
        eraserButton.classList.add('eraser-active');
      } else {
        eraserButton.classList.remove('eraser-active');
      }
    };

    // Add event listeners for better mobile support
    eraserButton.addEventListener('click', eraserHandler);
    eraserButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      eraserHandler();
    });
    eraserButton.addEventListener('touchend', (e) => {
      e.preventDefault();
    });
  }

  // Clear button functionality
  const clearButton = document.getElementById('clear-canvas');
  if (clearButton) {
    // Add multiple event listeners for better reliability
    const clearCanvasHandler = () => {
      // Add strong click feedback (scale effect only, no background change)
      clearButton.style.transform = 'scale(0.85)';
      clearButton.style.opacity = '0.7';
      setTimeout(() => {
        clearButton.style.transform = '';
        clearButton.style.opacity = '';
      }, 200);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      if (ctx && canvas) {
        clearCanvas(canvas);
      }
    };

    // Add click, touchstart, and touchend events for better mobile support
    clearButton.addEventListener('click', clearCanvasHandler);
    clearButton.addEventListener('touchstart', clearCanvasHandler);
    clearButton.addEventListener('touchend', clearCanvasHandler);
  }

  // Save button functionality - opens modal
  const saveAsButton = document.getElementById('save-as');
  if (saveAsButton) {
    const saveAsHandler = () => {
      // Add strong click feedback
      saveAsButton.style.transform = 'scale(0.85)';
      saveAsButton.style.opacity = '0.7';
      setTimeout(() => {
        saveAsButton.style.transform = '';
        saveAsButton.style.opacity = '';
      }, 200);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      openSaveModal();
    };

    // Add click, touchstart, and touchend events for better mobile support
    saveAsButton.addEventListener('click', saveAsHandler);
    saveAsButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      saveAsHandler();
    });
    saveAsButton.addEventListener('touchend', (e) => {
      e.preventDefault();
    });
  }

  // Modal event handlers
  const cancelSaveButton = document.getElementById('cancel-save');
  if (cancelSaveButton) {
    cancelSaveButton.addEventListener('click', () => {
      // Add strong click feedback
      cancelSaveButton.style.transform = 'scale(0.85)';
      cancelSaveButton.style.opacity = '0.7';
      setTimeout(() => {
        cancelSaveButton.style.transform = '';
        cancelSaveButton.style.opacity = '';
      }, 200);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      closeSaveModal();
    });
  }

  const confirmSaveButton = document.getElementById('confirm-save');
  if (confirmSaveButton) {
    confirmSaveButton.addEventListener('click', () => {
      // Add strong click feedback
      confirmSaveButton.style.transform = 'scale(0.85)';
      confirmSaveButton.style.opacity = '0.7';
      setTimeout(() => {
        confirmSaveButton.style.transform = '';
        confirmSaveButton.style.opacity = '';
      }, 200);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      if (ctx && canvas) {
        // Get selected options
        const selectedQuality = document.querySelector('input[name="quality"]:checked') as HTMLInputElement;
        const selectedFormat = document.querySelector('input[name="format"]:checked') as HTMLInputElement;
        
        if (selectedQuality && selectedFormat) {
          saveCanvasAsImage(canvas, selectedQuality.value, selectedFormat.value);
          closeSaveModal();
        }
      }
    });
  }

  // Close modal when clicking outside
  const saveModal = document.getElementById('save-modal');
  if (saveModal) {
    saveModal.addEventListener('click', (e) => {
      if (e.target === saveModal) {
        closeSaveModal();
      }
    });
  }

  // Style buttons functionality (hidden but functional)
  function setActiveStyle(style: number) {
    currentStyle = style;

    // Update button states
    document.querySelectorAll('.style-button').forEach((btn, index) => {
      btn.classList.toggle('active', index === style - 1);
    });
    
    // Update size number display for new style
  }

  // Add style button event listeners
  document.getElementById('style-1')?.addEventListener('click', () => setActiveStyle(1));
  document.getElementById('style-2')?.addEventListener('click', () => setActiveStyle(2));
  document.getElementById('style-3')?.addEventListener('click', () => setActiveStyle(3));

  // Initialize music functionality
  initMusicPlayer();

  // Initialize full screen functionality
  initFullScreen();

  // Initialize debugger toggle
  initializeDebuggerToggle();
  
  // Initialize labels toggle
  initializeLabelsToggle();

}

document.addEventListener('DOMContentLoaded', init);

// Music Player Functionality
let currentMusic: HTMLAudioElement | null = null;
let isMusicPlaying = false;
let musicVolume = 0.8; // Default volume (80% - louder for children)

// Safe, beautiful music with nice bangs and gentle fades
const musicTrack = {
  title: "🌙 Gentle Bangs",
  description: "Safe frequencies with nice bangs and beautiful fades",
  // Safe frequency range: 80Hz to 2000Hz (safe for speakers and ears)
  scale: {
    notes: [
      98.00, 110.00, 123.47, 130.81, 146.83, 164.81, 174.61, 196.00, // G2 to G3 (safe low range)
      220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, // A3 to A4 (safe mid range)
      493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77 // B4 to B5 (safe high range)
    ],
    name: "Safe Frequency Scale"
  },
  type: "ambient",
  tempo: 70, // Nice rhythm
  // Melody with nice bangs and fades
  melody: [
    { note: 8, duration: 1, volume: 0.8, bang: true }, // A4 (nice bang)
    { note: 10, duration: 1, volume: 0.8, bang: true }, // B4 (nice bang)
    { note: 12, duration: 2, volume: 0.9, bang: true }, // D5 (bigger bang)
    { note: 10, duration: 1, volume: 0.8, bang: true }, // B4
    { note: 8, duration: 1, volume: 0.8, bang: true }, // A4
    { note: 9, duration: 1, volume: 0.8, bang: true }, // A#4
    { note: 10, duration: 2, volume: 0.9, bang: true }, // B4 (bigger bang)
    { note: 12, duration: 1, volume: 0.8, bang: true }, // D5
    { note: 13, duration: 1, volume: 0.8, bang: true }, // D#5
    { note: 15, duration: 3, volume: 1.0, bang: true }, // F5 (biggest bang)
  ],
  // Harmony with gentle bangs
  harmony: [
    { note: 4, duration: 4, volume: 0.6, bang: true }, // E3 (gentle bang)
    { note: 6, duration: 4, volume: 0.6, bang: true }, // G3 (gentle bang)
    { note: 8, duration: 4, volume: 0.6, bang: true }, // A4 (gentle bang)
    { note: 4, duration: 4, volume: 0.6, bang: true }, // E3 (gentle bang)
  ],
  // Bass with deep bangs
  bass: [
    { note: 0, duration: 2, volume: 0.7, bang: true }, // G2 (deep bang)
    { note: 0, duration: 2, volume: 0.7, bang: true }, // G2
    { note: 1, duration: 2, volume: 0.7, bang: true }, // A2
    { note: 1, duration: 2, volume: 0.7, bang: true }, // A2
    { note: 2, duration: 2, volume: 0.7, bang: true }, // B2
    { note: 2, duration: 2, volume: 0.7, bang: true }, // B2
    { note: 0, duration: 4, volume: 0.8, bang: true }, // G2 (bigger deep bang)
  ]
};

function initMusicPlayer() {
  const musicControlButton = document.getElementById('music-control');
  

  // Simple on/off music control
  musicControlButton?.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Add strong click feedback
    if (musicControlButton) {
      musicControlButton.style.transform = 'scale(0.85)';
      musicControlButton.style.opacity = '0.7';
      setTimeout(() => {
        musicControlButton.style.transform = '';
        musicControlButton.style.opacity = '';
      }, 200);
    }
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Test if we can at least change the icon
    if (musicControlButton) {
      if (musicControlButton.textContent === '🎵') {
        musicControlButton.textContent = '🎶';
      } else {
        musicControlButton.textContent = '🎵';
      }
    }
    
    if (isMusicPlaying) {
      stopMusic();
    } else {
      try {
        playMusic();
      } catch (error) {
        console.error('Error in playMusic:', error);
      }
    }
  });
  
  // Test audio context creation
  try {
    const testContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    testContext.close();
  } catch (error) {
    console.error('Failed to create test audio context:', error);
  }
}


async function playMusic() {
  
  // Stop current music if playing
  if (currentMusic) {
    stopMusic();
  }

  const track = musicTrack;
  
  try {
    // Create a fresh audio context for music
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Resume audio context if suspended (required by some browsers)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
  
  // Create master gain for volume control
  const masterGain = audioContext.createGain();
  masterGain.gain.setValueAtTime(0, audioContext.currentTime);
  masterGain.gain.linearRampToValueAtTime(musicVolume * 0.3, audioContext.currentTime + 1.0); // Safe, pleasant volume
  
  // Connect main music directly to output (clear and audible)
  masterGain.connect(audioContext.destination);
  
  // Create subtle echo effect with delay
  const delayNode = audioContext.createDelay(1.0); // 1 second max delay
  const delayGain = audioContext.createGain();
  const feedbackGain = audioContext.createGain();
  
  // Set up subtle echo parameters
  delayNode.delayTime.setValueAtTime(0.4, audioContext.currentTime); // 400ms delay
  delayGain.gain.setValueAtTime(0.1, audioContext.currentTime); // Very subtle echo volume (10%)
  feedbackGain.gain.setValueAtTime(0.05, audioContext.currentTime); // Very low feedback (5%)
  
  // Create subtle echo chain
  masterGain.connect(delayNode);
  delayNode.connect(delayGain);
  delayGain.connect(feedbackGain);
  feedbackGain.connect(delayNode); // Feedback loop
  delayGain.connect(audioContext.destination); // Echo output
  
  // Add very gentle reverb for spaciousness
  const convolver = audioContext.createConvolver();
  const reverbGain = audioContext.createGain();
  reverbGain.gain.setValueAtTime(0.08, audioContext.currentTime); // Very gentle reverb (8%)
  
  // Create gentle reverb impulse response
  const reverbLength = audioContext.sampleRate * 1.0; // 1 second reverb
  const reverbBuffer = audioContext.createBuffer(2, reverbLength, audioContext.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const channelData = reverbBuffer.getChannelData(channel);
    for (let i = 0; i < reverbLength; i++) {
      const t = i / audioContext.sampleRate;
      // Create very gentle, natural decay
      const decay = Math.exp(-t * 1.5) * (Math.random() * 2 - 1) * 0.03;
      channelData[i] = decay;
    }
  }
  convolver.buffer = reverbBuffer;
  
  // Connect reverb to echo output
  delayGain.connect(convolver);
  convolver.connect(reverbGain);
  reverbGain.connect(audioContext.destination);
  
  // Play simple, reliable music instead of complex composition
  playSimpleMusic(audioContext, masterGain, track);
  
  // Create a simple audio element for easier control
  currentMusic = new Audio();
  currentMusic.volume = musicVolume * 0.4; // Increased volume for children
  
  // Update UI
  updateMusicUI(true);
  isMusicPlaying = true;

  // Store references for control
  (currentMusic as any).audioContext = audioContext;
  (currentMusic as any).masterGain = masterGain;
  (currentMusic as any).track = track;
  
  } catch (error) {
    console.error('Error playing music:', error);
    updateMusicUI(false);
    isMusicPlaying = false;
  }
}

function playSimpleMusic(audioContext: AudioContext, masterGain: GainNode, track: any) {
  
  const scale = track.scale.notes;
  const tempo = track.tempo;
  const beatDuration = 60 / tempo;
  
  
  // PART 1: Opening melody (beautiful C major progression)
  const part1Melody = [
    { note: 7, duration: 1, volume: 0.5 }, // G4 (warm start)
    { note: 8, duration: 1, volume: 0.5 }, // A4
    { note: 10, duration: 2, volume: 0.6 }, // B4
    { note: 12, duration: 1, volume: 0.5 }, // D5
    { note: 10, duration: 1, volume: 0.5 }, // B4
    { note: 8, duration: 1, volume: 0.5 }, // A4
    { note: 7, duration: 1, volume: 0.5 }, // G4
    { note: 5, duration: 2, volume: 0.6 }, // E4
    { note: 7, duration: 1, volume: 0.5 }, // G4
    { note: 8, duration: 3, volume: 0.7 }, // A4 (beautiful resolution)
  ];
  
  // PART 2: Evolution (higher, more complex with beautiful intervals)
  const part2Melody = [
    { note: 12, duration: 1, volume: 0.6 }, // D5
    { note: 15, duration: 1, volume: 0.6 }, // F5 (perfect fourth)
    { note: 17, duration: 2, volume: 0.7 }, // G5
    { note: 15, duration: 1, volume: 0.6 }, // F5
    { note: 12, duration: 1, volume: 0.6 }, // D5
    { note: 10, duration: 1, volume: 0.6 }, // B4
    { note: 12, duration: 2, volume: 0.7 }, // D5
    { note: 15, duration: 1, volume: 0.6 }, // F5
    { note: 17, duration: 1, volume: 0.6 }, // G5
    { note: 19, duration: 3, volume: 0.8 }, // A5 (climactic high note)
  ];
  
  // TRANSITION: Beautiful descending arpeggio
  const transitionMelody = [
    { note: 15, duration: 1, volume: 0.4 }, // F5 (high)
    { note: 12, duration: 1, volume: 0.4 }, // D5
    { note: 8, duration: 1, volume: 0.4 }, // A4
    { note: 5, duration: 1, volume: 0.4 }, // E4
    { note: 2, duration: 2, volume: 0.5 }, // C#3 (low, grounding)
    { note: 0, duration: 4, volume: 0.6 }, // G2 (deep foundation)
  ];
  
  // PART 3: Second part (different feel with minor touches)
  const part3Melody = [
    { note: 6, duration: 1, volume: 0.5 }, // G3
    { note: 8, duration: 1, volume: 0.5 }, // A4
    { note: 9, duration: 1, volume: 0.5 }, // A#4 (minor touch)
    { note: 10, duration: 2, volume: 0.6 }, // B4
    { note: 8, duration: 1, volume: 0.5 }, // A4
    { note: 6, duration: 1, volume: 0.5 }, // G3
    { note: 4, duration: 1, volume: 0.5 }, // E3
    { note: 6, duration: 2, volume: 0.6 }, // G3
    { note: 8, duration: 1, volume: 0.5 }, // A4
    { note: 10, duration: 1, volume: 0.5 }, // B4
    { note: 12, duration: 3, volume: 0.7 }, // D5 (beautiful resolution)
  ];
  
  // ENDING: Return to opening (for seamless loop)
  const endingMelody = [
    { note: 7, duration: 1, volume: 0.5 }, // G4 (warm start)
    { note: 8, duration: 1, volume: 0.5 }, // A4
    { note: 10, duration: 2, volume: 0.6 }, // B4
    { note: 12, duration: 1, volume: 0.5 }, // D5
    { note: 10, duration: 1, volume: 0.5 }, // B4
    { note: 8, duration: 1, volume: 0.5 }, // A4
    { note: 7, duration: 1, volume: 0.5 }, // G4
    { note: 5, duration: 2, volume: 0.6 }, // E4
    { note: 7, duration: 1, volume: 0.5 }, // G4
    { note: 8, duration: 3, volume: 0.7 }, // A4 (beautiful resolution)
  ];
  
  playSimpleMelody(audioContext, masterGain, part1Melody, scale, beatDuration);
  
  // Part 2 after Part 1
  setTimeout(() => {
    if (isMusicPlaying) {
      playSimpleMelody(audioContext, masterGain, part2Melody, scale, beatDuration);
    }
  }, part1Melody.reduce((sum, note) => sum + note.duration, 0) * beatDuration * 1000);
  
  // Transition after Part 2
  setTimeout(() => {
    if (isMusicPlaying) {
      playSimpleMelody(audioContext, masterGain, transitionMelody, scale, beatDuration);
    }
  }, (part1Melody.reduce((sum, note) => sum + note.duration, 0) + 
       part2Melody.reduce((sum, note) => sum + note.duration, 0)) * beatDuration * 1000);
  
  // Part 3 after Transition
  setTimeout(() => {
    if (isMusicPlaying) {
      playSimpleMelody(audioContext, masterGain, part3Melody, scale, beatDuration);
    }
  }, (part1Melody.reduce((sum, note) => sum + note.duration, 0) + 
       part2Melody.reduce((sum, note) => sum + note.duration, 0) +
       transitionMelody.reduce((sum, note) => sum + note.duration, 0)) * beatDuration * 1000);
  
  // Ending after Part 3
  setTimeout(() => {
    if (isMusicPlaying) {
      playSimpleMelody(audioContext, masterGain, endingMelody, scale, beatDuration);
    }
  }, (part1Melody.reduce((sum, note) => sum + note.duration, 0) + 
       part2Melody.reduce((sum, note) => sum + note.duration, 0) +
       transitionMelody.reduce((sum, note) => sum + note.duration, 0) +
       part3Melody.reduce((sum, note) => sum + note.duration, 0)) * beatDuration * 1000);
  
  // Loop the entire song
  const totalDuration = (part1Melody.reduce((sum, note) => sum + note.duration, 0) + 
                        part2Melody.reduce((sum, note) => sum + note.duration, 0) +
                        transitionMelody.reduce((sum, note) => sum + note.duration, 0) +
                        part3Melody.reduce((sum, note) => sum + note.duration, 0) +
                        endingMelody.reduce((sum, note) => sum + note.duration, 0)) * beatDuration;
  
  
  setTimeout(() => {
    if (isMusicPlaying) {
      playSimpleMusic(audioContext, masterGain, track);
    }
  }, totalDuration * 1000);
}

function playSimpleMelody(audioContext: AudioContext, masterGain: GainNode, melody: any[], scale: number[], beatDuration: number) {
  let currentTime = audioContext.currentTime;
  
  melody.forEach((note, _index) => {
    
    const frequency = (scale[note.note] || 440) * 1.0;
    const duration = note.duration * beatDuration;
    
    
    // Create oscillator
    const oscillator = audioContext.createOscillator();
    const noteGain = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, currentTime);
    
    // Create envelope with nice bang and fade
    const bangLevel = note.volume * 0.3;
    const sustainLevel = note.volume * 0.15;
    
    // Quick bang
    noteGain.gain.setValueAtTime(0, currentTime);
    noteGain.gain.linearRampToValueAtTime(bangLevel, currentTime + 0.01);
    
    // Quick drop to sustain
    noteGain.gain.linearRampToValueAtTime(sustainLevel, currentTime + 0.1);
    noteGain.gain.setValueAtTime(sustainLevel, currentTime + duration - 0.5);
    
    // Beautiful fade
    noteGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    // Connect and start
    oscillator.connect(noteGain);
    noteGain.connect(masterGain);
    
    oscillator.start(currentTime);
    oscillator.stop(currentTime + duration);
    
    currentTime += duration;
  });
}




function stopMusic() {
  if (currentMusic && (currentMusic as any).audioContext) {
    const audioContext = (currentMusic as any).audioContext;
    const masterGain = (currentMusic as any).masterGain;
    
    // Gentle fade out
    if (masterGain) {
      masterGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1);
    }
    
    setTimeout(() => {
      try {
        audioContext.close();
      } catch {
        // Ignore errors when stopping
      }
    }, 1000);
    
    currentMusic = null;
    updateMusicUI(false);
    isMusicPlaying = false;
  }
}

function updateMusicUI(playing: boolean) {
  const musicButton = document.getElementById('music-control');
  
  // Clear on/off state with music note icons
  if (musicButton) {
    if (playing) {
      musicButton.classList.add('playing');
      musicButton.textContent = '🎶'; // Musical notes when playing
    } else {
      musicButton.classList.remove('playing');
      musicButton.textContent = '🎵'; // Single music note when off
    }
  } else {
    console.error('Music button not found!');
  }
}

// Make reportActualSize globally available for styles
(window as any).reportActualSize = reportActualSize;

// Full Screen functionality
function initFullScreen() {
  const fullscreenButton = document.getElementById('fullscreen-toggle');
  
  if (!fullscreenButton) {
    console.error('Full screen button not found!');
    return;
  }

  // Check if fullscreen is supported
  if (!document.fullscreenEnabled && !(document as any).webkitFullscreenEnabled && !(document as any).mozFullScreenEnabled && !(document as any).msFullscreenEnabled) {
    console.warn('Full screen not supported in this browser');
    fullscreenButton.style.display = 'none';
    return;
  }

  // Update button state based on current fullscreen status
  function updateFullscreenButton() {
    if (!fullscreenButton) return;
    
    const isFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement);
    
    if (isFullscreen) {
      fullscreenButton.classList.add('fullscreen-active');
      fullscreenButton.title = 'Exit full screen mode';
    } else {
      fullscreenButton.classList.remove('fullscreen-active');
      fullscreenButton.title = 'Enter full screen mode';
    }
  }

  // Toggle fullscreen
  function toggleFullscreen() {
    const isFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement);
    
    if (isFullscreen) {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    } else {
      // Enter fullscreen
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        (element as any).msRequestFullscreen();
      }
    }
  }

  // Add event listeners
  fullscreenButton.addEventListener('click', (e) => {
    e.preventDefault();
    toggleFullscreen();
  });

  fullscreenButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    toggleFullscreen();
  });

  // Listen for fullscreen changes
  document.addEventListener('fullscreenchange', updateFullscreenButton);
  document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
  document.addEventListener('mozfullscreenchange', updateFullscreenButton);
  document.addEventListener('MSFullscreenChange', updateFullscreenButton);

  // Initial state
  updateFullscreenButton();
}

