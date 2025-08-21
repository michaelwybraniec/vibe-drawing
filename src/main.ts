import { hapticsConstantStart } from './haptics.js';
import { StyleManager } from './styles/styleManager.js';
import { DrawingPoint } from './styles/baseStyle.js';

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
}, 5000); // Wait 5 seconds

let ctx: CanvasRenderingContext2D | null = null;

let isDrawing = false;
let points: DrawingPoint[] = [];

// Style management
const styleManager = new StyleManager();

// Animation frame for style animations
let _animationId: number | null = null;

// Web vs Mobile detection
const isWebApp = !('ontouchstart' in window) || window.navigator.maxTouchPoints === 0;
const _isMobile = 'ontouchstart' in window && window.navigator.maxTouchPoints > 0;

// Size control variables
let currentSizeLevel = 2; // 0=tiny, 1=small, 2=medium, 3=large, 4=huge (5 sizes total)
const sizeMultipliers = [0.2, 0.4, 0.7, 1.0, 1.5]; // 5 size multipliers for web app - reduced sizes

// Size smoothing variables
let lastSizeMultiplier = 0.25;
const sizeSmoothingFactor = 0.15;

// Thickness control
let thicknessMultiplier = 1.0; // Global thickness multiplier (0.5 to 3.0)

// Eraser mode
let isEraserMode = false;

// Style tracking variables
let currentStyle = 1; // Default to style 1
let isStyle2Active = false;
let _flames: any[] = [];
let lavaLines: any[] = [];

// Style context function (unused but kept for future use)
function _createStyleContext() {
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

function calculateSizeMultiplier(width: number, height: number): number {
  const touchArea = Math.sqrt(width * height);

  if (isWebApp) {
    // Web app: Always use consistent size for better drawing experience
    const baseMultiplier = 0.15 * (sizeMultipliers[currentSizeLevel] || 1.0);
    const finalMultiplier = baseMultiplier * thicknessMultiplier;
    if (Math.random() < 0.01) {
      // Log occasionally to avoid spam
      console.log('Web app size calculation:', {
        baseMultiplier,
        thicknessMultiplier,
        finalMultiplier,
      });
    }
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
    if (Math.random() < 0.01) {
      // Log occasionally to avoid spam
      console.log('Size calculation:', {
        smoothedMultiplier,
        sizeLevel: sizeMultipliers[currentSizeLevel],
        thicknessMultiplier,
        finalMultiplier,
      });
    }
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

function getColorStyle1(_sizeMultiplier: number): string {
  // Style 1: Use the selected color with aggressive variations for dynamic pen styles
  const baseHue = randomStyleParams.baseHue;
  const baseSaturation = randomStyleParams.saturation;
  const baseLightness = randomStyleParams.lightness;

  // Add aggressive variations to create dynamic, vibrant color changes
  const hueVariation = (Math.random() - 0.5) * 40; // ±20 degrees (more variation)
  const saturationVariation = (Math.random() - 0.5) * 30; // ±15% (more saturation variation)
  const lightnessVariation = (Math.random() - 0.5) * 20; // ±10% (more lightness variation)

  const hue = (baseHue + hueVariation + 360) % 360;
  const saturation = Math.max(60, Math.min(100, baseSaturation + saturationVariation)); // Keep in aggressive range
  const lightness = Math.max(30, Math.min(70, baseLightness + lightnessVariation)); // Keep in aggressive range

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function getColorStyle2(_sizeMultiplier: number): string {
  // Style 2: Use random parameters for fire colors
  const baseHue = randomStyleParams.baseHue;
  const baseSaturation = randomStyleParams.saturation;
  const baseLightness = randomStyleParams.lightness;

  // Fire colors with random variation
  const fireHues = [baseHue, baseHue + 15, baseHue + 30, baseHue + 45]; // Based on random hue
  const randomIndex = Math.floor(Math.random() * fireHues.length);
  const randomHue = fireHues[randomIndex] || baseHue;
  const hue = randomHue + (Math.random() - 0.5) * 10; // Add some variation
  const saturation = baseSaturation + Math.random() * 15;
  const lightness = baseLightness + Math.random() * 30;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function _getColorStyle3(_sizeMultiplier: number): string {
  // Style 3: Ocean colors (blue, cyan, teal, purple)
  const hue = 180 + ((_sizeMultiplier - 0.1) / 0.3) * 120; // 180-300 degrees (cyan to purple)
  const saturation = 85 + Math.random() * 15;
  const lightness = 45 + (_sizeMultiplier / 0.4) * 25 + Math.random() * 10;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function getCurrentColor(sizeMultiplier: number): string {
  // Always use Style 1 with random parameters
  return getColorStyle1(sizeMultiplier);
}

function drawStyle2(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sizeMultiplier: number,
  touchWidth: number,
  touchHeight: number,
): void {
  // Style 2: Sharp pen-like fire line with continuous sparkles
  const time = Date.now();
  const sparkleSpeed = 400; // 0.4 seconds for faster sparkle cycle
  const sparklePhase = (time % sparkleSpeed) / sparkleSpeed; // 0 to 1

  ctx.save();

  // Create size-sensitive pen-like effect (reduced intensity)
  const lineWidth = Math.max(touchWidth, touchHeight) * 0.1 * sizeMultiplier; // Reduced from 0.15 to 0.1
  const sparkleIntensity = Math.sin(sparklePhase * Math.PI * 8) * 0.5 + 0.5; // 0 to 1, very fast oscillation

  // Main continuous fire line - like a sharp pen (less intense)
  ctx.strokeStyle = getColorStyle2(sizeMultiplier);
  ctx.lineWidth = lineWidth * (0.15 + sparkleIntensity * 0.08); // Reduced from 0.2 to 0.15
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.85 + sparkleIntensity * 0.1; // Reduced from 0.95 to 0.85

  // Draw continuous fire line - no breaks, smooth (shorter)
  const moveOffset = Math.sin(sparklePhase * Math.PI * 2) * 0.4; // Reduced from 0.8 to 0.4
  ctx.beginPath();
  ctx.moveTo(x - lineWidth * 0.6, y + moveOffset); // Reduced from 0.8 to 0.6
  ctx.lineTo(x + lineWidth * 0.6, y + moveOffset); // Reduced from 0.8 to 0.6
  ctx.stroke();

  // Add ultra-dense sparkle dots for continuous effect (fewer, smaller)
  const numSparkles = 15; // Reduced from 25 to 15
  for (let i = 0; i < numSparkles; i++) {
    const sparkleX = x - lineWidth * 0.5 + i * lineWidth * 0.07; // Reduced from 0.7 to 0.5
    const sparkleOffset = Math.sin((sparklePhase + i * 0.08) * Math.PI * 4) * 1; // Reduced from 2 to 1
    const sparkleSize = (0.3 + sparkleIntensity * 0.6) * sizeMultiplier; // Reduced from 0.4 to 0.3
    const sparkleAlpha = 0.7 + sparkleIntensity * 0.2; // Reduced from 0.8 to 0.7

    ctx.globalAlpha = sparkleAlpha;
    ctx.fillStyle = getColorStyle2(sizeMultiplier + 0.1);

    // Draw tiny sparkle dots
    ctx.beginPath();
    ctx.arc(sparkleX, y + sparkleOffset, sparkleSize, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Add minimal loop effect for extra density (smaller, fewer)
  const loopRadius = lineWidth * 0.1; // Reduced from 0.15 to 0.1
  const loopSpeed = sparklePhase * Math.PI * 6; // Very fast loop
  const numLoopSparkles = 8; // Reduced from 12 to 8

  for (let i = 0; i < numLoopSparkles; i++) {
    const angle = loopSpeed + (i * Math.PI * 2) / numLoopSparkles;
    const loopX = x + Math.cos(angle) * loopRadius;
    const loopY = y + Math.sin(angle) * loopRadius;
    const loopSize = (0.15 + sparkleIntensity * 0.4) * sizeMultiplier; // Reduced from 0.2 to 0.15
    const loopAlpha = 0.5 + sparkleIntensity * 0.2; // Reduced from 0.6 to 0.5

    ctx.globalAlpha = loopAlpha;
    ctx.fillStyle = getColorStyle2(sizeMultiplier + 0.2);

    ctx.beginPath();
    ctx.arc(loopX, loopY, loopSize, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.restore();
}

function drawFlameEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sizeMultiplier: number,
  touchWidth: number,
  touchHeight: number,
): void {
  // Simple sparkle effect - just draw the sparkle line
  drawStyle2(ctx, x, y, sizeMultiplier, touchWidth, touchHeight);
}

// Global glitch trail for digital glitch effect
let glitchTrail: Array<{
  x: number;
  y: number;
  size: number;
  timestamp: number;
  glitchOffset: number;
}> = [];
let lastGlitchTime = 0;

function drawGlitchEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sizeMultiplier: number,
  touchWidth: number,
  touchHeight: number,
): void {
  // DIGITAL GLITCH EFFECT 💻🖥️
  const time = Date.now();
  const glitchSize = Math.max(touchWidth, touchHeight) * 0.25 * sizeMultiplier;

  ctx.save();

  // Glitch colors with digital effect
  const glitchHues = [0, 120, 240]; // RGB primary colors
  const randomHue = glitchHues[Math.floor(Math.random() * glitchHues.length)] || 0;
  const hue = randomHue + (Math.random() - 0.5) * 20;

  const glitchColor = `hsl(${hue}, 100%, 60%)`;
  const glitchColor2 = `hsl(${hue + 120}, 100%, 60%)`; // Complementary color
  const glitchColor3 = `hsl(${hue + 240}, 100%, 60%)`; // Triadic color

  // Glitch timing and effects
  const glitchPulse = Math.sin(time / 100) * 0.4 + 0.6;
  const animatedSize = glitchSize * glitchPulse;

  // Add glitch offset
  const glitchOffset = Math.sin(time / 50) * 8; // Fast glitch movement
  const glitchX = x + glitchOffset;
  const glitchY = y + (Math.random() - 0.5) * 4;

  // Add to glitch trail
  if (time - lastGlitchTime > 30) {
    glitchTrail.push({
      x: glitchX,
      y: glitchY,
      size: animatedSize,
      timestamp: time,
      glitchOffset: glitchOffset,
    });
    lastGlitchTime = time;

    // Keep only last 12 points for glitch trail
    if (glitchTrail.length > 12) {
      glitchTrail.shift();
    }
  }

  // Draw glitch trail with digital artifacts
  glitchTrail.forEach((point, _index) => {
    const age = time - point.timestamp;
    if (age < 600) {
      // Shorter glitch trail
      const fadeProgress = age / 600;
      const alpha = (1 - fadeProgress) * 0.7;
      const size = point.size * (1 - fadeProgress * 0.3);

      // Random glitch color
      const colors = [glitchColor, glitchColor2, glitchColor3];
      const randomColor = colors[Math.floor(Math.random() * colors.length)] || glitchColor;

      // Glitch rectangle instead of circle
      ctx.globalAlpha = alpha;
      ctx.fillStyle = randomColor;
      ctx.fillRect(point.x - size / 2 + point.glitchOffset, point.y - size / 2, size, size);

      // Add glitch scan lines
      if (Math.random() < 0.3) {
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(point.x - size / 2, point.y - size / 4, size, 1);
      }
    }
  });

  // Draw main glitch point
  const _mainGlitch = Math.sin(time / 30) * 0.5 + 0.5; // Fast glitch

  // Primary glitch color
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = glitchColor;
  ctx.fillRect(glitchX - animatedSize / 2, glitchY - animatedSize / 2, animatedSize, animatedSize);

  // Glitch color shift
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = glitchColor2;
  ctx.fillRect(
    glitchX - animatedSize / 2 + 2,
    glitchY - animatedSize / 2,
    animatedSize / 3,
    animatedSize,
  );

  // Glitch color shift 2
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = glitchColor3;
  ctx.fillRect(
    glitchX - animatedSize / 2 - 2,
    glitchY - animatedSize / 2,
    animatedSize / 3,
    animatedSize,
  );

  // Add digital artifacts
  if (Math.random() < 0.4) {
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(glitchX - animatedSize / 2, glitchY - animatedSize / 4, animatedSize, 2);
  }

  // Add glitch noise
  if (Math.random() < 0.2) {
    for (let i = 0; i < 5; i++) {
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
      const noiseX = glitchX + (Math.random() - 0.5) * animatedSize;
      const noiseY = glitchY + (Math.random() - 0.5) * animatedSize;
      ctx.fillRect(noiseX, noiseY, 2, 2);
    }
  }

  // Clean up old glitch trail
  glitchTrail = glitchTrail.filter((point) => time - point.timestamp < 800);

  ctx.restore();
}

// Simple fire trail for performance
let fireTrail: Array<{ x: number; y: number; size: number; color: string; timestamp: number }> = [];
let lastFireTime = 0;

function drawFireEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sizeMultiplier: number,
  touchWidth: number,
  touchHeight: number,
): void {
  // BLINKING LAVA EFFECT 🔥🌋
  const time = Date.now();
  const lavaSize = Math.max(touchWidth, touchHeight) * 0.2 * sizeMultiplier;

  ctx.save();

  // Lava colors with blinking effect
  const lavaHues = [0, 15, 30]; // Red to orange
  const randomHue = lavaHues[Math.floor(Math.random() * lavaHues.length)] || 15;
  const hue = randomHue + (Math.random() - 0.5) * 10;

  // Create blinking effect with multiple frequencies
  const blink1 = Math.sin(time / 150) * 0.5 + 0.5; // Fast blink
  const blink2 = Math.sin(time / 300) * 0.3 + 0.7; // Medium blink
  const blink3 = Math.sin(time / 600) * 0.2 + 0.8; // Slow blink
  const combinedBlink = (blink1 + blink2 + blink3) / 3;

  // Lava colors that blink
  const lavaColor = `hsl(${hue}, 100%, ${50 + combinedBlink * 30}%)`; // Brightness blinks
  const coreColor = `hsl(${hue + 5}, 100%, ${70 + combinedBlink * 20}%)`;
  const glowColor = `hsl(${hue + 10}, 100%, ${40 + combinedBlink * 40}%)`;

  // Lava movement with blinking
  const lavaPulse = Math.sin(time / 100) * 0.3 + 0.7;
  const animatedSize = lavaSize * lavaPulse * combinedBlink;

  // Add to trail every 50ms for smoother lava
  if (time - lastFireTime > 50) {
    fireTrail.push({
      x,
      y,
      size: animatedSize,
      color: lavaColor,
      timestamp: time,
    });
    lastFireTime = time;

    // Keep only last 10 points for lava trail
    if (fireTrail.length > 10) {
      fireTrail.shift();
    }
  }

  // Draw lava core with blinking
  ctx.globalAlpha = 0.9 * combinedBlink;
  ctx.fillStyle = coreColor;
  ctx.beginPath();
  ctx.arc(x, y, animatedSize * 0.5, 0, 2 * Math.PI);
  ctx.fill();

  // Draw main lava body with blinking
  ctx.globalAlpha = 0.8 * combinedBlink;
  ctx.fillStyle = lavaColor;
  ctx.beginPath();
  ctx.arc(x, y, animatedSize, 0, 2 * Math.PI);
  ctx.fill();

  // Draw blinking lava trail
  fireTrail.slice(-6).forEach((point, _index) => {
    const age = time - point.timestamp;
    if (age < 600) {
      // Longer trail for lava
      const fadeProgress = age / 600;
      const alpha = (1 - fadeProgress) * combinedBlink * 0.6;
      const size = point.size * (1 - fadeProgress * 0.3);

      // Add blinking to trail points
      const trailBlink = Math.sin((time - point.timestamp) / 100) * 0.3 + 0.7;

      ctx.globalAlpha = alpha * trailBlink;
      ctx.fillStyle = point.color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size, 0, 2 * Math.PI);
      ctx.fill();
    }
  });

  // Add blinking lava glow
  ctx.globalAlpha = 0.3 * combinedBlink;
  ctx.fillStyle = glowColor;
  ctx.beginPath();
  ctx.arc(x, y, animatedSize * 2.5, 0, 2 * Math.PI);
  ctx.fill();

  // Add occasional lava sparkles
  if (Math.random() < 0.2) {
    ctx.globalAlpha = 0.7 * combinedBlink;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(
      x + (Math.random() - 0.5) * lavaSize,
      y + (Math.random() - 0.5) * lavaSize,
      2,
      0,
      2 * Math.PI,
    );
    ctx.fill();
  }

  // Clean up old trail points
  fireTrail = fireTrail.filter((point) => time - point.timestamp < 800);

  ctx.restore();
}

// Global chalk trail for dusty chalk effect
let chalkTrail: Array<{ x: number; y: number; size: number; timestamp: number; pressure: number }> =
  [];
let lastChalkTime = 0;

function drawWaterEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sizeMultiplier: number,
  touchWidth: number,
  touchHeight: number,
): void {
  // DUSTY CHALK PEN ✏️🖍️
  const time = Date.now();
  const chalkSize = Math.max(touchWidth, touchHeight) * 0.2 * sizeMultiplier;

  ctx.save();

  // Chalk colors with dusty effect - responsive to randomizer and line variation
  // Use randomizer parameters for color variation
  const baseHue = randomStyleParams.baseHue;
  const baseSaturation = randomStyleParams.saturation;
  const baseLightness = randomStyleParams.lightness;
  // Add line-based color variation for rainbow effect within each line
  const lineColorOffset = Math.sin(time / 500) * 60; // Rainbow effect over time
  const hue = baseHue + lineColorOffset + (Math.random() - 0.5) * 30; // Line color + random variation
  const saturation = baseSaturation + (Math.random() - 0.5) * 20;
  const lightness = baseLightness + (Math.random() - 0.5) * 15;

  const chalkColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`; // Randomizer-controlled chalk
  const dustColor = `hsl(${hue}, ${saturation * 0.7}%, ${lightness + 5}%)`; // Lighter dust
  const shadowColor = `hsl(${hue}, ${saturation * 0.8}%, ${lightness - 10}%)`; // Darker shadow

  // Add to chalk trail with pressure variation - more sensitive to size
  if (time - lastChalkTime > 20) {
    const pressure = Math.random() * 0.5 + 0.5; // Random pressure
    const sizeVariation = 0.4 + Math.random() * 1.2; // 40% to 160% size
    // Very minimal size sensitivity for chalk
    const enhancedSizeMultiplier =
      sizeMultiplier * (1 + currentSizeLevel * 0.02) * thicknessMultiplier;
    const variedSize = chalkSize * sizeVariation * pressure * enhancedSizeMultiplier;

    // Add irregular chalk dust spread
    const dustSpreadX = (Math.random() - 0.5) * 20; // Much wider X spread
    const dustSpreadY = (Math.random() - 0.5) * 16; // Much wider Y spread
    const dustX = x + dustSpreadX;
    const dustY = y + dustSpreadY;

    chalkTrail.push({
      x: dustX,
      y: dustY,
      size: variedSize,
      timestamp: time,
      pressure: pressure,
    });
    lastChalkTime = time;

    // Keep only last 20 points for dusty trail
    if (chalkTrail.length > 20) {
      chalkTrail.shift();
    }
  }

  // Draw chalk dust trail
  chalkTrail.forEach((point) => {
    const age = time - point.timestamp;
    if (age < 1500) {
      // Longer dust trail
      const fadeProgress = age / 1500;
      const alpha = (1 - fadeProgress) * point.pressure * 0.6;
      const size = point.size * (1 - fadeProgress * 0.3); // Dust doesn't shrink much

      // Draw chalk dust particles
      ctx.globalAlpha = alpha * 0.4;
      ctx.fillStyle = dustColor;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size * 1.5, 0, 2 * Math.PI);
      ctx.fill();

      // Draw main chalk mark
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle = chalkColor;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size, 0, 2 * Math.PI);
      ctx.fill();

      // Draw chalk shadow
      ctx.globalAlpha = alpha * 0.3;
      ctx.fillStyle = shadowColor;
      ctx.beginPath();
      ctx.arc(point.x + 1, point.y + 1, size * 0.8, 0, 2 * Math.PI);
      ctx.fill();
    }
  });

  // Draw current chalk mark - reduced size sensitivity
  const chalkPulse = Math.sin(time / 100) * 0.3 + 0.7;
  // Very minimal size sensitivity for current mark
  const enhancedCurrentSize =
    chalkSize * chalkPulse * sizeMultiplier * (1 + currentSizeLevel * 0.02) * thicknessMultiplier;
  const animatedSize = enhancedCurrentSize;

  // Chalk shadow
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.arc(x + 2, y + 2, animatedSize * 0.7, 0, 2 * Math.PI);
  ctx.fill();

  // Main chalk mark
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = chalkColor;
  ctx.beginPath();
  ctx.arc(x, y, animatedSize, 0, 2 * Math.PI);
  ctx.fill();

  // Irregular chalk dust particles
  if (Math.random() < 0.6) {
    // More frequent particles
    const particleCount = Math.floor(Math.random() * 8) + 3; // More particles
    for (let i = 0; i < particleCount; i++) {
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = dustColor;
      const particleX = x + (Math.random() - 0.5) * chalkSize * 5; // Wider spread
      const particleY = y + (Math.random() - 0.5) * chalkSize * 4; // Wider spread
      const particleSize = Math.random() * 5 + 1; // Larger size variation
      ctx.beginPath();
      ctx.arc(particleX, particleY, particleSize, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // Clean up old chalk trail
  chalkTrail = chalkTrail.filter((point) => time - point.timestamp < 2000);

  ctx.restore();
}

// Global epic cosmic storm system
let cosmicParticles: Array<{
  x: number;
  y: number;
  size: number;
  velocityX: number;
  velocityY: number;
  color: string;
  type: 'star' | 'nebula' | 'comet' | 'blackhole';
  timestamp: number;
  life: number;
}> = [];
let lastEpicTime = 0;

function drawEpicEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sizeMultiplier: number,
  touchWidth: number,
  touchHeight: number,
): void {
  // EPIC COSMIC STORM 🌌✨🚀
  const time = Date.now();
  const cosmicSize = Math.max(touchWidth, touchHeight) * 0.4 * sizeMultiplier;

  ctx.save();

  // Cosmic colors with epic variation
  const cosmicHues = [0, 60, 120, 180, 240, 300]; // Rainbow cosmic colors
  const randomHue = cosmicHues[Math.floor(Math.random() * cosmicHues.length)] || 0;
  const hue = randomHue + (Math.random() - 0.5) * 30;

  const cosmicColor = `hsl(${hue}, 100%, 70%)`;
  const nebulaColor = `hsl(${hue + 30}, 80%, 60%)`;
  const starColor = `hsl(${hue + 60}, 90%, 90%)`;
  const blackholeColor = `hsl(${hue - 30}, 100%, 20%)`;

  // Add cosmic particles
  if (time - lastEpicTime > 15) {
    const particleTypes = ['star', 'nebula', 'comet', 'blackhole'];
    const randomType = particleTypes[Math.floor(Math.random() * particleTypes.length)] as any;

    const velocityX = (Math.random() - 0.5) * 8;
    const velocityY = (Math.random() - 0.5) * 6;
    const particleSize = cosmicSize * (0.3 + Math.random() * 1.5);

    cosmicParticles.push({
      x,
      y,
      size: particleSize,
      velocityX,
      velocityY,
      color:
        randomType === 'star'
          ? starColor
          : randomType === 'nebula'
            ? nebulaColor
            : randomType === 'comet'
              ? cosmicColor
              : blackholeColor,
      type: randomType,
      timestamp: time,
      life: 1.0,
    });
    lastEpicTime = time;

    // Keep only last 30 cosmic particles
    if (cosmicParticles.length > 30) {
      cosmicParticles.shift();
    }
  }

  // Update and draw cosmic particles
  cosmicParticles.forEach((particle) => {
    // Update particle physics
    particle.velocityX *= 0.98;
    particle.velocityY *= 0.98;
    particle.x += particle.velocityX;
    particle.y += particle.velocityY;
    particle.life -= 0.02;

    if (particle.life <= 0) return;

    const alpha = particle.life;
    const size = particle.size * particle.life;

    ctx.globalAlpha = alpha;

    switch (particle.type) {
      case 'star': {
        // Draw twinkling star
        const twinkle = Math.sin(time / 100 + particle.timestamp) * 0.3 + 0.7;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size * twinkle, 0, 2 * Math.PI);
        ctx.fill();

        // Star rays
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2 + time / 1000;
          const rayLength = size * 2;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(
            particle.x + Math.cos(angle) * rayLength,
            particle.y + Math.sin(angle) * rayLength,
          );
          ctx.stroke();
        }
        break;
      }

      case 'nebula':
        // Draw colorful nebula
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size * 2, 0, 2 * Math.PI);
        ctx.fill();

        // Nebula glow
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = nebulaColor;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size * 3, 0, 2 * Math.PI);
        ctx.fill();
        break;

      case 'comet': {
        // Draw comet with tail
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size, 0, 2 * Math.PI);
        ctx.fill();

        // Comet tail
        const tailLength = size * 4;
        const tailAngle = Math.atan2(particle.velocityY, particle.velocityX);
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = size / 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(
          particle.x - Math.cos(tailAngle) * tailLength,
          particle.y - Math.sin(tailAngle) * tailLength,
        );
        ctx.stroke();
        break;
      }

      case 'blackhole': {
        // Draw black hole with gravitational effect
        ctx.fillStyle = blackholeColor;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size, 0, 2 * Math.PI);
        ctx.fill();

        // Gravitational ring
        ctx.globalAlpha = alpha * 0.7;
        ctx.strokeStyle = cosmicColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size * 1.5, 0, 2 * Math.PI);
        ctx.stroke();

        // Inner ring
        ctx.globalAlpha = alpha * 0.4;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size * 0.8, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      }
    }
  });

  // Draw epic cosmic core
  const cosmicPulse = Math.sin(time / 150) * 0.4 + 0.6;
  const animatedSize = cosmicSize * cosmicPulse;

  // Cosmic glow
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = cosmicColor;
  ctx.beginPath();
  ctx.arc(x, y, animatedSize * 4, 0, 2 * Math.PI);
  ctx.fill();

  // Main cosmic core
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = starColor;
  ctx.beginPath();
  ctx.arc(x, y, animatedSize, 0, 2 * Math.PI);
  ctx.fill();

  // Cosmic explosion effect
  if (Math.random() < 0.1) {
    const explosionRadius = animatedSize * 3;
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12;
      const explosionX = x + Math.cos(angle) * explosionRadius;
      const explosionY = y + Math.sin(angle) * explosionRadius;

      ctx.globalAlpha = 0.8;
      ctx.fillStyle = cosmicColor;
      ctx.beginPath();
      ctx.arc(explosionX, explosionY, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // Clean up dead particles
  cosmicParticles = cosmicParticles.filter((particle) => particle.life > 0);

  ctx.restore();
}

function drawLavaEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sizeMultiplier: number,
  touchWidth: number,
  touchHeight: number,
): void {
  // Create optimized, animated lava effect
  const time = Date.now();
  const lavaSize = Math.max(touchWidth, touchHeight) * 0.6; // Smaller size for performance

  ctx.save();

  // Lava colors - red to orange to yellow
  const lavaHue = 15 + ((sizeMultiplier - 0.1) / 0.3) * 30; // 15-45 degrees (red to orange)
  const lavaColor = `hsl(${lavaHue}, 100%, 50%)`;
  const glowColor = `hsl(${lavaHue + 10}, 100%, 70%)`;

  // Animated pulse effect
  const pulse = Math.sin(time / 200) * 0.1 + 0.9; // 0.8 to 1.0 pulse
  const animatedSize = lavaSize * pulse;

  // Draw main lava blob with animation
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, animatedSize);
  gradient.addColorStop(0, glowColor);
  gradient.addColorStop(0.5, lavaColor);
  gradient.addColorStop(1, `hsla(${lavaHue}, 80%, 40%, 0.3)`);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, animatedSize, 0, 2 * Math.PI);
  ctx.fill();

  ctx.restore();
}

function _drawAllStyle2Lines(ctx: CanvasRenderingContext2D): void {
  const currentTime = Date.now();

  // Draw all lava lines
  for (let i = lavaLines.length - 1; i >= 0; i--) {
    const line = lavaLines[i];
    if (!line || line.points.length === 0) continue;

    const lineAge = currentTime - line.startTime;
    const meltDuration = 4000; // 4 seconds to melt away

    if (line.isMelting) {
      // Update melt progress
      line.meltProgress = Math.min(1, lineAge / meltDuration);

      if (line.meltProgress >= 1) {
        // Line has completely melted, remove it
        lavaLines.splice(i, 1);
        continue;
      }
    }

    // Draw lava line
    for (let j = 0; j < line.points.length; j++) {
      const point = line.points[j];
      if (point) {
        drawLavaEffect(
          ctx,
          point.x,
          point.y,
          point.sizeMultiplier,
          point.touchWidth,
          point.touchHeight,
        );
      }
    }
  }
}

function addSparkleEffect(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  // Add sparkle particles around the main dot
  const numSparkles = Math.floor(size / 10); // More sparkles for bigger touches

  for (let i = 0; i < numSparkles; i++) {
    const angle = (Math.PI * 2 * i) / numSparkles;
    const distance = size * (0.8 + Math.random() * 0.4); // Random distance
    const sparkleX = x + Math.cos(angle) * distance;
    const sparkleY = y + Math.sin(angle) * distance;
    const sparkleSize = 2 + Math.random() * 4;

    ctx.save();
    ctx.globalAlpha = 0.6 + Math.random() * 0.4;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(sparkleX, sparkleY, sparkleSize, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }
}

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

  console.log(
    'Canvas resized to HD:',
    canvas.width,
    'x',
    canvas.height,
    'devicePixelRatio:',
    devicePixelRatio,
  );

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

function initContext(canvas: HTMLCanvasElement): void {
  ctx = canvas.getContext('2d', {
    alpha: true,
    antialias: true,
    willReadFrequently: false,
  }) as CanvasRenderingContext2D | null;
  console.log('Canvas context created:', !!ctx, 'Canvas element:', !!canvas);

  if (!ctx) {
    console.error('Failed to get 2D context!');
    return;
  }

  // Enable high-quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#111';

  // Clear and setup the canvas immediately
  clearCanvas(canvas);
  console.log('Canvas context initialized successfully');
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
  // Clear glitch trail
  glitchTrail = [];

  // Clear fire trail
  fireTrail = [];

  // Clear chalk trail
  chalkTrail = [];

  // Clear cosmic particles
  cosmicParticles = [];

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

  ctx.lineWidth = 10;
  console.log('Canvas cleared and background drawn');
}

// Debug function for Apple Pencil testing
function debugPointerEvent(e: PointerEvent): void {
  console.log('Pointer Event Debug:', {
    pointerType: e.pointerType,
    pressure: e.pressure,
    width: e.width,
    height: e.height,
    pointerId: e.pointerId,
    isPrimary: e.isPrimary,
    timeStamp: e.timeStamp,
  });
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
      console.log('Apple Pencil detected - pressure:', pressure);
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

    points.push({ x, y, t: e.timeStamp });

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
      const touchHeight = adjustedHeight * downMultiplier * mobileMultiplier;
      const maxSize = Math.max(touchWidth, touchHeight);

      const currentStyleIndex = styleManager.getCurrentStyleIndex();
      if (currentStyleIndex === 1) {
        // Style 2 (Lava)
        // Style 2: Draw initial flame with enhanced size sensitivity
        const baseSizeMultiplier = calculateSizeMultiplier(touchWidth, touchHeight);
        const enhancedSizeMultiplier =
          baseSizeMultiplier * (1 + currentSizeLevel * 0.3) * thicknessMultiplier;
        drawFlameEffect(ctx, x, y, enhancedSizeMultiplier, touchWidth, touchHeight);
      } else if (currentStyleIndex === 2) {
        // Style 3 (Glitch)
        // Style 3: GLITCH EFFECT
        const glitchSizeMultiplier = calculateSizeMultiplier(touchWidth, touchHeight);
        drawGlitchEffect(ctx, x, y, glitchSizeMultiplier, touchWidth, touchHeight);
      } else if (currentStyleIndex === 3) {
        // Style 4 (Fire)
        // Style 4: EPIC FIRE EFFECT
        const fireSizeMultiplier = calculateSizeMultiplier(touchWidth, touchHeight);
        drawFireEffect(ctx, x, y, fireSizeMultiplier, touchWidth, touchHeight);
      } else if (currentStyleIndex === 4) {
        // Style 5 (Water)
        // Style 5: WATER SHAPE STYLO
        const waterSizeMultiplier = calculateSizeMultiplier(touchWidth, touchHeight);
        drawWaterEffect(ctx, x, y, waterSizeMultiplier, touchWidth, touchHeight);
      } else if (currentStyleIndex === 5) {
        // Style 6 (Epic)
        // Style 6: EPIC COSMIC STORM
        const epicSizeMultiplier =
          calculateSizeMultiplier(touchWidth, touchHeight) * (1 + currentSizeLevel * 0.01);
        drawEpicEffect(ctx, x, y, epicSizeMultiplier, touchWidth, touchHeight);
      } else {
        // Style 1 & other styles: Regular smooth dot
        ctx.save();

        ctx.globalAlpha = 0.8;

        console.log(
          'Drawing dot at:',
          x,
          y,
          'size:',
          touchWidth,
          'x',
          touchHeight,
          'pressure:',
          pressure,
        );

        // Paint main ellipse with pulsing effect and HD quality (same for drawing and erasing)
        const pulseScale = 1 + Math.sin(Date.now() / 200) * 0.1; // Gentle pulsing
        const radiusX = (touchWidth / 2) * pulseScale;
        const radiusY = (touchHeight / 2) * pulseScale;

        // Set eraser mode or drawing mode
        if (isEraserMode) {
          // Eraser: draw with dark blue background color
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#A8A8DB'; // Dark blue background color
        } else {
          // Normal drawing mode
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = getCurrentColor(downMultiplier);
        }

        // Create radial gradient for HD quality
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(radiusX, radiusY));
        gradient.addColorStop(0, getCurrentColor(downMultiplier));
        gradient.addColorStop(0.7, getCurrentColor(downMultiplier * 0.8));
        gradient.addColorStop(1, getCurrentColor(downMultiplier * 0.6));

        ctx.fillStyle = gradient;
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

        // Add sparkle effect for larger touches
        if (maxSize > 20) {
          addSparkleEffect(ctx, x, y, maxSize);
        }
      }
    } else {
      console.error('Canvas context is null! Cannot draw.');
    }
  });

  canvas.addEventListener('pointermove', (e: PointerEvent) => {
    // Debug Apple Pencil events during drawing
    if (e.pointerType === 'pen' && isDrawing) {
      debugPointerEvent(e);
    }

    if (!isDrawing) return;
    const { x, y } = getCanvasPoint(canvas, e.clientX, e.clientY);
    const last = points[points.length - 1]!;
    const dt = Math.max(0.001, e.timeStamp - last.t);
    const dx = x - last.x;
    const dy = y - last.y;
    const speed = Math.hypot(dx, dy) / dt; // px/ms

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

    points.push({ x, y, t: e.timeStamp, speed });

    if (!ctx) return;

    // Calculate distance between last point and current point
    const distance = Math.hypot(x - last.x, y - last.y);

    // Enhanced dot spacing for smoother lines - much finer spacing
    let dotSpacing;
    if (isPencil) {
      // Apple Pencil gets ultra-fine dot spacing for very smooth lines
      dotSpacing = currentStyle === 2 ? 0.5 : 0.8;
    } else {
      // Touch and mouse get finer spacing for smoother lines
      dotSpacing = currentStyle === 2 ? 1.0 : isWebApp ? 0.8 : 1.5;
    }

    const numDots = Math.max(1, Math.ceil(distance / dotSpacing));

    // Enhanced density multiplier for much smoother lines
    let densityMultiplier;
    if (isPencil) {
      // Apple Pencil gets ultra-high density for very smooth lines
      densityMultiplier = currentStyle === 2 ? 3.0 : 3.5;
    } else {
      // Touch and mouse get higher density for smoother lines
      densityMultiplier = currentStyle === 2 ? 2.5 : isWebApp ? 2.5 : 2.0;
    }

    const adjustedNumDots = Math.max(3, Math.ceil(numDots * densityMultiplier));

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
    const touchHeight = adjustedHeight * moveMultiplier * mobileMultiplier;

    ctx.save();
    ctx.globalAlpha = 0.8; // Slightly transparent for natural ink effect

    // Paint multiple dots along the path
    for (let i = 0; i <= adjustedNumDots; i++) {
      const t = i / adjustedNumDots; // interpolation factor (0 to 1)
      const dotX = last.x + (x - last.x) * t;
      const dotY = last.y + (y - last.y) * t;

      const currentStyleIndex = styleManager.getCurrentStyleIndex();
      if (currentStyleIndex === 1) {
        // Style 2 (Lava)
        // Style 2: Draw animated flames on every point for no gaps with enhanced size sensitivity
        const baseSizeMultiplier = calculateSizeMultiplier(touchWidth, touchHeight);
        const enhancedSizeMultiplier =
          baseSizeMultiplier * (1 + currentSizeLevel * 0.3) * thicknessMultiplier;
        drawFlameEffect(ctx, dotX, dotY, enhancedSizeMultiplier, touchWidth, touchHeight);
      } else if (currentStyleIndex === 2) {
        // Style 3 (Glitch)
        // Style 3: GLITCH EFFECT
        const glitchSizeMultiplier = calculateSizeMultiplier(touchWidth, touchHeight);
        drawGlitchEffect(ctx, dotX, dotY, glitchSizeMultiplier, touchWidth, touchHeight);
      } else if (currentStyleIndex === 3) {
        // Style 4 (Fire)
        // Style 4: EPIC FIRE EFFECT
        const fireSizeMultiplier = calculateSizeMultiplier(touchWidth, touchHeight);
        drawFireEffect(ctx, dotX, dotY, fireSizeMultiplier, touchWidth, touchHeight);
      } else if (currentStyleIndex === 4) {
        // Style 5 (Water)
        // Style 5: WATER SHAPE STYLO
        const waterSizeMultiplier = calculateSizeMultiplier(touchWidth, touchHeight);
        drawWaterEffect(ctx, dotX, dotY, waterSizeMultiplier, touchWidth, touchHeight);
      } else if (currentStyleIndex === 5) {
        // Style 6 (Epic)
        // Style 6: EPIC COSMIC STORM
        const epicSizeMultiplier =
          calculateSizeMultiplier(touchWidth, touchHeight) * (1 + currentSizeLevel * 0.01);
        drawEpicEffect(ctx, dotX, dotY, epicSizeMultiplier, touchWidth, touchHeight);
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
        const finalHeight = (touchHeight / 2) * sizeVariation * pulseScale;

        // Set eraser mode or drawing mode
        if (isEraserMode) {
          // Eraser: draw with dark blue background color
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#151E35'; // Dark blue background color
        } else {
          // Normal drawing mode
          ctx.globalCompositeOperation = 'source-over';
          const colorT = Math.sin(t * Math.PI) * 0.12; // 20% more color variation (was 0.1)
          const colorMultiplier = moveMultiplier + colorT;
          ctx.fillStyle = getCurrentColor(colorMultiplier);
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

        // Enhanced sparkle effects for Apple Pencil
        if (Math.max(touchWidth, touchHeight) > 15) {
          let sparkleChance;
          if (isPencil) {
            // Apple Pencil gets more sparkles for enhanced effect
            sparkleChance = 0.4;
          } else {
            // Touch and mouse get reduced sparkles for performance
            sparkleChance = 0.2;
          }

          if (Math.random() < sparkleChance) {
            ctx.save();
            ctx.globalAlpha = 0.4; // Reduced alpha for performance
            addSparkleEffect(ctx, dotX, dotY, Math.max(touchWidth, touchHeight) / 3);
            ctx.restore();
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
      console.log('End sound failed:', error);
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
    console.log('Audio context initialized');
  } catch (error) {
    console.log('Audio not supported');
    // Mark as ready even if audio fails to prevent blocking
    console.log('Audio not supported', error);
    audioInitialized = true;
  }
}

function playSplashSound() {
  if (!audioContext || audioContext.state === 'suspended') {
    audioContext?.resume();
  }

  try {
    if (!audioContext) return;

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
    console.log('Audio playback failed:', error);
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
  } catch (error) {
    console.log('Audio playback failed:', error);
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

// Info popup functions
function showInfoPopup() {
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

// Global variables for random style parameters
let randomStyleParams = {
  baseHue: 216,
  saturation: 90,
  lightness: 50,
  sparkleIntensity: 0.3,
  sparkleSize: 2,
  sparkleCount: 3,
  glowIntensity: 0.2,
  pulseSpeed: 0.02,
  sizeMultiplier: 1.0,
};

function generateRandomStyle1Parameters(): void {
  // Generate aggressive, vibrant pen styles with high contrast and intensity
  const hue = Math.floor(Math.random() * 360); // Full color spectrum

  // Aggressive saturation: from strong (70%) to maximum (100%)
  const saturationChoices = [70, 75, 80, 85, 90, 95, 100];
  const saturation = saturationChoices[Math.floor(Math.random() * saturationChoices.length)];

  // Aggressive lightness: from medium (40%) to bright (60%) for high contrast
  const lightnessChoices = [40, 45, 50, 55, 60];
  const lightness = lightnessChoices[Math.floor(Math.random() * lightnessChoices.length)];

  // Enhanced sparkle and glow effects for aggressive styles
  const sparkleIntensity = Math.random() * 0.6 + 0.4; // 0.4 to 1.0 (more intense)
  const sparkleSize = Math.random() * 3 + 1.0; // 1.0 to 4.0 (bigger sparkles)
  const sparkleCount = Math.floor(Math.random() * 12) + 4; // 4 to 15 (more sparkles)
  const glowIntensity = Math.random() * 0.8 + 0.2; // 0.2 to 1.0 (stronger glow)
  const pulseSpeed = Math.random() * 0.3 + 0.1; // 0.1 to 0.4 (faster pulse)
  const sizeMultiplier = Math.random() * 2.0 + 0.8; // 0.8 to 2.8 (more size variation)

  randomStyleParams = {
    baseHue: hue,
    saturation: saturation!,
    lightness: lightness!,
    sparkleIntensity: sparkleIntensity,
    sparkleSize: sparkleSize,
    sparkleCount: sparkleCount,
    glowIntensity: glowIntensity,
    pulseSpeed: pulseSpeed,
    sizeMultiplier: sizeMultiplier,
  };

  console.log(
    `Generated aggressive pen style: hsl(${hue}, ${saturation}%, ${lightness}%) - Intensity: ${sparkleIntensity.toFixed(2)}`,
  );
}

function init(): void {
  const canvas = document.getElementById('app-canvas') as HTMLCanvasElement | null;
  console.log('Init function called, canvas found:', !!canvas);

  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // Enhanced Apple Pencil and touch support
  console.log('Device capabilities:', {
    maxTouchPoints: window.navigator.maxTouchPoints,
    hasPointerEvents: 'PointerEvent' in window,
  });

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

  console.log('Initializing canvas context...');
  initContext(canvas);
  console.log('Canvas context initialized, ctx:', !!ctx);

  resizeCanvas(canvas);

  // Force a complete canvas reset to ensure everything is properly initialized
  if (ctx && canvas) {
    clearCanvas(canvas);
    console.log('Canvas fully initialized and cleared');
  }

  const onResize = () => resizeCanvas(canvas);
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  (window as any).visualViewport?.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') resizeCanvas(canvas);
  });

  console.log('Attaching pointer handlers...');
  attachPointerHandlers(canvas);
  console.log('Pointer handlers attached');

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
      // Switch to next drawing style
      styleManager.nextStyle();
      const newStyle = styleManager.getCurrentStyle();

      // Update button icon to show current style
      styleSelectorButton.textContent = newStyle.icon;

      // Set consistent white color for numbers
      styleSelectorButton.style.color = 'white';

      console.log(`🎨 Switched to ${newStyle.name} style: ${newStyle.description}`);
      console.log(`🎯 Style index: ${styleManager.getCurrentStyleIndex()}`);
      styleSelectorButton.title = `Current: ${newStyle.name}\nTap to switch drawing style`;
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

    // Initialize with current style
    const currentStyle = styleManager.getCurrentStyle();
    styleSelectorButton.textContent = currentStyle.icon;
    styleSelectorButton.style.color = 'white';
    styleSelectorButton.title = `Current: ${currentStyle.name}\nTap to switch drawing style`;
  }

  // Style switch button functionality (OLD FEATURE: Randomize current style)
  const styleSwitchButton = document.getElementById('style-switch');
  if (styleSwitchButton) {
    const styleSwitchHandler = () => {
      // Generate new random style parameters ONLY - no drawing
      generateRandomStyle1Parameters();

      // Change to a random size (0-4 for 5 sizes)
      currentSizeLevel = Math.floor(Math.random() * 5);

      // Generate random color for the button
      const randomHue = Math.floor(Math.random() * 360);
      styleSwitchButton.style.color = `hsl(${randomHue}, 85%, 55%)`;

      // No animation needed

      const sizeNames = ['tiny', 'small', 'medium', 'large', 'huge'];
      console.log(`Generated new random style and changed to ${sizeNames[currentSizeLevel]} size!`);

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
    generateRandomStyle1Parameters();
    const randomHue = Math.floor(Math.random() * 360);
    styleSwitchButton.style.color = `hsl(${randomHue}, 85%, 55%)`;
  }

  // Thickness slider functionality
  const thicknessSlider = document.getElementById('thickness-slider') as HTMLInputElement;
  const vibrationKnob = document.getElementById('vibration-knob') as HTMLInputElement | null;
  const thicknessValue = document.getElementById('thickness-value');
  console.log('Thickness slider found:', !!thicknessSlider);
  if (thicknessSlider) {
    const thicknessHandler = () => {
      thicknessMultiplier = parseFloat(thicknessSlider.value);
      console.log(
        '🎯 Thickness changed to:',
        thicknessMultiplier,
        'Slider value:',
        thicknessSlider.value,
      );

      // Update the display value
      if (thicknessValue) {
        thicknessValue.textContent = thicknessSlider.value;
      }

      // Force a redraw to see immediate effect
      if (ctx && canvas) {
        // This will trigger the size calculation with new thickness
        console.log('🔄 Thickness updated, next draw will use:', thicknessMultiplier);
      }
    };

    // Add event listeners for real-time thickness control
    thicknessSlider.addEventListener('input', thicknessHandler);
    thicknessSlider.addEventListener('change', thicknessHandler);

    // Initialize thickness
    thicknessMultiplier = parseFloat(thicknessSlider.value);
    console.log('🎯 Initial thickness:', thicknessMultiplier);

    // Set initial display value
    if (thicknessValue) {
      thicknessValue.textContent = thicknessSlider.value;
    }

    // Test thickness calculation
    const testSize = calculateSizeMultiplier(1, 1);
    console.log('🧪 Test size calculation with thickness', thicknessMultiplier, ':', testSize);
  } else {
    console.error('Thickness slider not found!');
  }

  // Vibration knob only
  let vibrationIntensity = 1.0; // 0..1 (kept for future haptics on iPhone)

  const applyKnob = () => {
    if (vibrationKnob) vibrationIntensity = parseFloat(vibrationKnob.value);
    (window as any).vibrationIntensity = vibrationIntensity;
  };

  vibrationKnob?.addEventListener('input', applyKnob);
  applyKnob();

  // Keyboard controls for thickness slider
  const handleThicknessKey = (event: KeyboardEvent) => {
    if (!thicknessSlider) return;

    const currentValue = parseFloat(thicknessSlider.value);
    const step = parseFloat(thicknessSlider.step) || 0.2;
    const min = parseFloat(thicknessSlider.min) || 0.2;
    const max = parseFloat(thicknessSlider.max) || 5.0;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      // Decrease thickness (higher pitch)
      const newValue = Math.max(min, currentValue - step);
      thicknessSlider.value = newValue.toString();
      thicknessMultiplier = newValue;
      console.log('🎯 Thickness decreased to:', newValue);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      // Increase thickness (lower pitch)
      const newValue = Math.min(max, currentValue + step);
      thicknessSlider.value = newValue.toString();
      thicknessMultiplier = newValue;
      console.log('🎯 Thickness increased to:', newValue);
    }
  };

  // Add keyboard event listener
  document.addEventListener('keydown', handleThicknessKey);

  // Eraser button functionality
  const eraserButton = document.getElementById('eraser');
  if (eraserButton) {
    const eraserHandler = () => {
      isEraserMode = !isEraserMode;
      if (isEraserMode) {
        eraserButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        eraserButton.style.border = '2px solid rgba(255, 255, 255, 0.5)';
        console.log('Eraser mode activated! 🧽');
      } else {
        eraserButton.style.backgroundColor = 'transparent';
        eraserButton.style.border = 'none';
        console.log('Drawing mode activated! ✏️');
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
      if (ctx && canvas) {
        clearCanvas(canvas);
        console.log('Canvas cleared! ✨');
      }
    };

    // Add click, touchstart, and touchend events for better mobile support
    clearButton.addEventListener('click', clearCanvasHandler);
    clearButton.addEventListener('touchstart', clearCanvasHandler);
    clearButton.addEventListener('touchend', clearCanvasHandler);
  }

  // Style buttons functionality (hidden but functional)
  function setActiveStyle(style: number) {
    currentStyle = style;
    console.log(`Switched to Style ${style}`);

    // Update button states
    document.querySelectorAll('.style-button').forEach((btn, index) => {
      btn.classList.toggle('active', index === style - 1);
    });
  }

  // Add style button event listeners
  document.getElementById('style-1')?.addEventListener('click', () => setActiveStyle(1));
  document.getElementById('style-2')?.addEventListener('click', () => setActiveStyle(2));
  document.getElementById('style-3')?.addEventListener('click', () => setActiveStyle(3));
}

document.addEventListener('DOMContentLoaded', init);
