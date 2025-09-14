import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class CleanPlasmaStyle implements DrawingStyle {
  name = 'Clean Plasma';
  description = 'Swirling plasma energy with dynamic particles';
  
  private currentVariant = 0;
  private colorVariants = [
    { baseHue: 280, plasmaHue: 280, saturation: 100, plasmaSaturation: 100, lightness: 50, plasmaLightness: 70, name: 'Purple Plasma' },
    { baseHue: 0, plasmaHue: 15, saturation: 100, plasmaSaturation: 95, lightness: 55, plasmaLightness: 75, name: 'Red Energy' }
  ];
  
  private styleParams = {
    swirlSpeed: 0.001, // Very slow for smooth animation
    particleCount: 1, // Only 1 particle for minimal splash
  };

  private plasmaTrail: Array<{ x: number; y: number; size: number; color: string; timestamp: number; angle: number }> = [];
  private lastPlasmaTime = 0;

  draw(
    ctx: CanvasRenderingContext2D,
    point: DrawingPoint,
    context: StyleContext
  ): void {
    const { x, y, width, height } = point;
    const { isEraserMode, thicknessMultiplier, currentSizeLevel, sizeMultipliers } = context;
    
    // PLASMA ENERGY EFFECT 🌌
    const time = Date.now();
    // Use global size system like all other styles
    const baseMultiplier = 0.5 * (sizeMultipliers[currentSizeLevel] || 1.0);
    const plasmaSize = baseMultiplier * thicknessMultiplier * Math.max(width, height);

    ctx.save();

    // Plasma colors with swirling effect - use color variants
    const currentVariant = this.colorVariants[this.currentVariant]!;
    const baseHue = currentVariant.baseHue;
    const _plasmaHue = currentVariant.plasmaHue;
    const swirlSpeed = this.styleParams.swirlSpeed || 0.01;
    const _particleCount = this.styleParams.particleCount || 4;

    // Create plasma swirling effect with multiple frequencies
    const swirl1 = Math.sin(time * swirlSpeed) * 0.4 + 0.6; // Main swirl
    const swirl2 = Math.sin(time * swirlSpeed * 1.5) * 0.3 + 0.7; // Secondary swirl
    const swirl3 = Math.sin(time * swirlSpeed * 0.7) * 0.2 + 0.8; // Tertiary swirl
    const combinedSwirl = (swirl1 + swirl2 + swirl3) / 3;

    // Plasma colors that swirl - different colors for different parts
    const plasmaColor = `hsl(${baseHue}, ${currentVariant.saturation}%, ${currentVariant.lightness + combinedSwirl * 30}%)`;
    // const particleColor = `hsl(${plasmaHue}, ${currentVariant.plasmaSaturation}%, ${currentVariant.plasmaLightness + combinedSwirl * 20}%)`;

    // Plasma movement with swirling
    const plasmaPulse = Math.sin(time / 200) * 0.4 + 0.6;
    const animatedSize = plasmaSize * plasmaPulse * combinedSwirl;

    // Add to trail every 150ms for even smoother plasma energy
    if (time - this.lastPlasmaTime > 150) {
      this.plasmaTrail.push({
        x,
        y,
        size: animatedSize,
        color: plasmaColor,
        timestamp: time,
        angle: Math.random() * Math.PI * 2,
      });
      this.lastPlasmaTime = time;

      // Keep only last 3 points for cleaner plasma trail
      if (this.plasmaTrail.length > 3) {
        this.plasmaTrail.shift();
      }
    }

    if (isEraserMode) {
      // Eraser mode - match the plasma effect size
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = plasmaColor;
      ctx.beginPath();
      ctx.arc(x, y, animatedSize * 1.3, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Normal drawing mode
      ctx.globalCompositeOperation = 'source-over';

      // No swirling particles - clean plasma only

      // Main plasma core - flat, no gradients
      ctx.globalAlpha = 0.9 * combinedSwirl;
      ctx.fillStyle = `hsl(${baseHue}, ${currentVariant.saturation}%, ${currentVariant.lightness + combinedSwirl * 15}%)`;
      ctx.beginPath();
      ctx.arc(x, y, animatedSize * 0.8, 0, 2 * Math.PI);
      ctx.fill();

      // Draw swirling plasma trail
      this.plasmaTrail.slice(-3).forEach((point, _index) => {
        const age = time - point.timestamp;
        if (age < 500) {
          const fadeProgress = age / 500;
          const alpha = (1 - fadeProgress) * combinedSwirl * 0.6;
          const size = point.size * (1 - fadeProgress * 0.5);

          // Add swirling to trail points
          const trailSwirl = Math.sin((time - point.timestamp) * swirlSpeed * 2) * 0.3 + 0.7;

          ctx.globalAlpha = alpha * trailSwirl;
          ctx.fillStyle = point.color;
          ctx.beginPath();
          ctx.arc(point.x, point.y, size, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      // No sparkles - completely clean plasma
    }

    // Clean up old trail points
    this.plasmaTrail = this.plasmaTrail.filter((point) => time - point.timestamp < 700);

    ctx.restore();
  }

  nextColorVariant(): void {
    this.currentVariant = (this.currentVariant + 1) % this.colorVariants.length;
  }

  resetToDefault(): void {
    this.currentVariant = 0;
  }

  getCurrentVariantName(): string {
    const currentVariant = this.colorVariants[this.currentVariant]!;
    return currentVariant.name;
  }
}