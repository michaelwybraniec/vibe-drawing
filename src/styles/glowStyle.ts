import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class GlowStyle implements DrawingStyle {
  name = 'Glow';
  description = 'Bright neon strokes with glowing effects';
  icon = '6';

  private lastSizeMultiplier = 0.25;
  private sizeSmoothingFactor = 0.15;
  private glowTrails: Array<{
    x: number;
    y: number;
    size: number;
    color: string;
    life: number;
    maxLife: number;
  }> = [];

  onStart(_point: DrawingPoint, _context: StyleContext): void {
    console.log('🎨 Glow style started');
    this.glowTrails = [];
  }

  onMove(points: DrawingPoint[], context: StyleContext): void {
    const { ctx, isEraserMode, thicknessMultiplier: _thicknessMultiplier, currentSizeLevel: _currentSizeLevel, sizeMultipliers: _sizeMultipliers, isWebApp: _isWebApp } =
      context;

    if (points.length < 2) return;

    ctx.save();
    ctx.globalCompositeOperation = isEraserMode ? 'destination-out' : 'screen';

    // Draw each point as a glowing stroke
    points.forEach((point, index) => {
      if (index === 0) return; // Skip first point

      const prevPoint = points[index - 1];
      if (!prevPoint) return;
      const t = (point.t - prevPoint.t) / 16; // Normalize time

      if (t <= 0) return;

      // Calculate size multiplier
      const sizeMultiplier = this.calculateSizeMultiplier(point, context);

      // Interpolate position
      const dotX = prevPoint.x + (point.x - prevPoint.x) * t;
      const dotY = prevPoint.y + (point.y - prevPoint.y) * t;

      // Calculate final size
      const touchWidth = point.width || 1;
      const _touchHeight = point.height || 1;
      const sizeVariation = 0.9 + Math.random() * 0.2;
      const finalSize = (touchWidth / 2) * sizeVariation * sizeMultiplier;

      if (isEraserMode) {
        // Eraser: create dark areas
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#151E35';
      } else {
        // Glow: create bright, glowing strokes
        const colorT = Math.sin(t * Math.PI) * 0.2;
        const colorMultiplier = 1 + colorT;
        const baseColor = this.getGlowColor(colorMultiplier);

        // Create outer glow (large, soft)
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = baseColor;

        ctx.beginPath();
        ctx.arc(dotX, dotY, finalSize * 3, 0, 2 * Math.PI);
        ctx.fill();

        // Create middle glow (medium, brighter)
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = baseColor;

        ctx.beginPath();
        ctx.arc(dotX, dotY, finalSize * 2, 0, 2 * Math.PI);
        ctx.fill();

        // Create inner glow (small, brightest)
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = baseColor;

        ctx.beginPath();
        ctx.arc(dotX, dotY, finalSize, 0, 2 * Math.PI);
        ctx.fill();

        // Create bright center
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#FFFFFF';

        ctx.beginPath();
        ctx.arc(dotX, dotY, finalSize * 0.3, 0, 2 * Math.PI);
        ctx.fill();

        // Add glow trail for animation
        this.glowTrails.push({
          x: dotX,
          y: dotY,
          size: finalSize,
          color: baseColor,
          life: 1.0,
          maxLife: 1.0,
        });

        // Add sparkle effects
        if (Math.random() < 0.3) {
          this.addSparkle(ctx, dotX, dotY, baseColor);
        }
      }
    });

    ctx.restore();
  }

  onEnd(_context: StyleContext): void {
    console.log('🎨 Glow style ended');
  }

  onClear(_context: StyleContext): void {
    this.glowTrails = [];
  }

  animate(context: StyleContext): void {
    const { ctx } = context;

    // Animate glow trails
    this.glowTrails = this.glowTrails.filter((trail) => {
      trail.life -= 0.03;

      if (trail.life > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Fade out glow
        ctx.globalAlpha = trail.life * 0.4;
        ctx.fillStyle = trail.color;

        ctx.beginPath();
        ctx.arc(trail.x, trail.y, trail.size * 2, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
        return true;
      }
      return false;
    });
  }

  private calculateSizeMultiplier(point: DrawingPoint, context: StyleContext): number {
    const { isWebApp, currentSizeLevel, sizeMultipliers, thicknessMultiplier } = context;
    const touchArea = Math.sqrt((point.width || 1) * (point.height || 1));

    if (isWebApp) {
      const baseMultiplier = 0.16 * (sizeMultipliers[currentSizeLevel] || 1.0);
      return baseMultiplier * thicknessMultiplier;
    } else {
      const minArea = 5;
      const maxArea = 100;
      const normalizedArea = Math.max(0, Math.min(1, (touchArea - minArea) / (maxArea - minArea)));

      let baseMultiplier;
      if ((point.width || 0) === 0 || (point.height || 0) === 0) {
        baseMultiplier = 0.2;
      } else {
        baseMultiplier = 0.1 + normalizedArea * 0.18;
      }

      const sizeVariation = 0.95 + Math.random() * 0.1;
      const smoothedMultiplier =
        this.lastSizeMultiplier * (1 - this.sizeSmoothingFactor) +
        baseMultiplier * sizeVariation * this.sizeSmoothingFactor;
      this.lastSizeMultiplier = smoothedMultiplier;

      return smoothedMultiplier * (sizeMultipliers[currentSizeLevel] || 1.0) * thicknessMultiplier;
    }
  }

  private getGlowColor(multiplier: number): string {
    // Bright neon colors
    const colors = [
      '#FF0080', // Hot pink
      '#00FFFF', // Cyan
      '#FF00FF', // Magenta
      '#00FF00', // Lime
      '#FFFF00', // Yellow
      '#FF8000', // Orange
      '#8000FF', // Purple
      '#00FF80', // Spring green
    ];

    const index = Math.floor(multiplier * colors.length) % colors.length;
    return colors[index] || '#ff6b6b';
  }

  private addSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = color;

    // Create sparkle effect
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const sparkleX = x + Math.cos(angle) * 10;
      const sparkleY = y + Math.sin(angle) * 10;

      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.restore();
  }
}
