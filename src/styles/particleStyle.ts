import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class ParticleStyle implements DrawingStyle {
  name = 'Particle';
  description = 'Smooth particle-based drawing with haptic feedback';
  icon = '1';

  private lastSizeMultiplier = 0.25;
  private sizeSmoothingFactor = 0.15;
  private previousPoint: DrawingPoint | null = null;

  onStart(point: DrawingPoint, context: StyleContext): void {
    console.log('🎨 Particle style started');
    this.previousPoint = point;
  }

  onMove(points: DrawingPoint[], context: StyleContext): void {
    console.log('🎨 ParticleStyle.onMove called');
    const { ctx, isEraserMode, thicknessMultiplier, currentSizeLevel, sizeMultipliers, isWebApp } =
      context;

    if (!this.previousPoint) return;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    // Draw each point as a particle
    points.forEach((point) => {
      if (!this.previousPoint) return;

      const t = (point.t - this.previousPoint.t) / 16; // Normalize time

      if (t <= 0) return;

      // Calculate size multiplier
      const sizeMultiplier = this.calculateSizeMultiplier(point, context);

      // Interpolate position
      const dotX = this.previousPoint.x + (point.x - this.previousPoint.x) * t;
      const dotY = this.previousPoint.y + (point.y - this.previousPoint.y) * t;

      // Calculate final size
      const touchWidth = point.width || 1;
      const touchHeight = point.height || 1;
      const sizeVariation = 0.95 + Math.random() * 0.1;
      const pulseScale = 1 + Math.sin((Date.now() + _index * 40) / 160) * 0.03;
      const finalSize = (touchWidth / 2) * sizeVariation * pulseScale;
      const finalHeight = (touchHeight / 2) * sizeVariation * pulseScale;

      // Set color
      if (isEraserMode) {
        ctx.fillStyle = '#151E35'; // Dark blue background color
      } else {
        const colorT = Math.sin(t * Math.PI) * 0.12;
        const colorMultiplier = 1 + colorT;
        ctx.fillStyle = this.getCurrentColor(colorMultiplier);
      }

      // Draw particle
      ctx.beginPath();
      ctx.ellipse(dotX, dotY, finalSize, finalHeight, 0, 0, 2 * Math.PI);
      ctx.fill();

      // Add sparkle effects
      if (Math.max(touchWidth, touchHeight) > 15 && Math.random() < 0.2) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        this.addSparkleEffect(ctx, dotX, dotY, Math.max(touchWidth, touchHeight) / 3);
        ctx.restore();
      }

      // Update previous point
      this.previousPoint = point;
    });

    ctx.restore();
  }

  onEnd(context: StyleContext): void {
    console.log('🎨 Particle style ended');
  }

  private calculateSizeMultiplier(point: DrawingPoint, context: StyleContext): number {
    const { isWebApp, currentSizeLevel, sizeMultipliers, thicknessMultiplier } = context;
    const touchArea = Math.sqrt((point.width || 1) * (point.height || 1));

    if (isWebApp) {
      const baseMultiplier = 0.15 * (sizeMultipliers[currentSizeLevel] || 1.0);
      return baseMultiplier * thicknessMultiplier;
    } else {
      const minArea = 5;
      const maxArea = 100;
      const normalizedArea = Math.max(0, Math.min(1, (touchArea - minArea) / (maxArea - minArea)));

      let baseMultiplier;
      if ((point.width || 0) === 0 || (point.height || 0) === 0) {
        baseMultiplier = 0.2;
      } else {
        baseMultiplier = 0.1 + normalizedArea * 0.2;
      }

      const sizeVariation = 0.98 + Math.random() * 0.04;
      const smoothedMultiplier =
        this.lastSizeMultiplier * (1 - this.sizeSmoothingFactor) +
        baseMultiplier * sizeVariation * this.sizeSmoothingFactor;

      this.lastSizeMultiplier = smoothedMultiplier;
      return smoothedMultiplier * thicknessMultiplier;
    }
  }

  private getCurrentColor(multiplier: number): string {
    const hue = (Date.now() * 0.1) % 360;
    const saturation = 80 + Math.sin(Date.now() * 0.001) * 20;
    const lightness = 50 + Math.sin(Date.now() * 0.002) * 30;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  private addSparkleEffect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
  ): void {
    const sparkleCount = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < sparkleCount; i++) {
      const angle = (Math.PI * 2 * i) / sparkleCount + Math.random() * 0.5;
      const distance = size * (0.5 + Math.random() * 0.5);
      const sparkleX = x + Math.cos(angle) * distance;
      const sparkleY = y + Math.sin(angle) * distance;
      const sparkleSize = size * 0.1 * (0.5 + Math.random() * 0.5);

      ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + Math.random() * 0.4})`;
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, sparkleSize, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}
