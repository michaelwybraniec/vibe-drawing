import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class ParticleStyle implements DrawingStyle {
  name = 'Particle';
  description = 'Smooth particle-based drawing with haptic feedback';
  icon = '1';

  private currentVariant = 0;
  private colorVariants = [
    { color: '#FF6B6B', name: 'Coral' },
    { color: '#4ECDC4', name: 'Turquoise' },
    { color: '#45B7D1', name: 'Sky Blue' },
    { color: '#96CEB4', name: 'Mint Green' },
    { color: '#FFEAA7', name: 'Soft Yellow' }
  ];

  draw(ctx: CanvasRenderingContext2D, point: DrawingPoint, context: StyleContext): void {
    // Simple draw implementation for particle style
    const { x, y, width, height } = point;
    const { isEraserMode } = context;
    
    ctx.save();
    if (isEraserMode) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = this.getParticleColor();
    }
    
    ctx.beginPath();
    ctx.arc(x, y, Math.max(width, height) / 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }

  private lastSizeMultiplier = 0.25;
  private sizeSmoothingFactor = 0.15;
  private previousPoint: DrawingPoint | null = null;

  onStart(point: DrawingPoint, _context: StyleContext): void {
    this.previousPoint = point;
  }

  onMove(points: DrawingPoint[], context: StyleContext): void {
    const { ctx, isEraserMode, thicknessMultiplier: _thicknessMultiplier, currentSizeLevel: _currentSizeLevel, sizeMultipliers: _sizeMultipliers, isWebApp: _isWebApp } =
      context;

    if (!this.previousPoint) return;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    // Draw each point as a particle
    points.forEach((point, index) => {
      if (!this.previousPoint) return;

      const t = ((point.t || 0) - (this.previousPoint.t || 0)) / 16; // Normalize time

      if (t <= 0) return;

      // Calculate size multiplier
      const _sizeMultiplier = this.calculateSizeMultiplier(point, context);

      // Interpolate position
      const dotX = this.previousPoint.x + (point.x - this.previousPoint.x) * t;
      const dotY = this.previousPoint.y + (point.y - this.previousPoint.y) * t;

      // Calculate final size
      const touchWidth = point.width || 1;
      const touchHeight = point.height || 1;
      const sizeVariation = 0.95 + Math.random() * 0.1;
      const pulseScale = 1 + Math.sin((Date.now() + index * 40) / 160) * 0.03;
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

  onEnd(_context: StyleContext): void {
  }

  private calculateSizeMultiplier(point: DrawingPoint, context: StyleContext): number {
    const { isWebApp: _isWebApp, currentSizeLevel: _currentSizeLevel, sizeMultipliers: _sizeMultipliers, thicknessMultiplier: _thicknessMultiplier } = context;
    const touchArea = Math.sqrt((point.width || 1) * (point.height || 1));

    if (_isWebApp) {
      const baseMultiplier = 0.15 * (_sizeMultipliers[_currentSizeLevel] || 1.0);
      return baseMultiplier * _thicknessMultiplier;
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
      return smoothedMultiplier * _thicknessMultiplier;
    }
  }

  private getCurrentColor(_multiplier: number): string {
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

  private getParticleColor(): string {
    const currentVariant = this.colorVariants[this.currentVariant]!;
    return currentVariant.color;
  }

  nextColorVariant(): void {
    this.currentVariant = (this.currentVariant + 1) % this.colorVariants.length;
  }

  resetToDefault(): void {
    this.currentVariant = 0;
  }
}
