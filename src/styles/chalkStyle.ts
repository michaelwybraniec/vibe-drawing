import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class ChalkStyle implements DrawingStyle {
  name = 'Chalk';
  description = 'Dusty chalk strokes with particle effects';
  icon = '5';

  private lastSizeMultiplier = 0.25;
  private sizeSmoothingFactor = 0.15;
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
  }> = [];

  onStart(_point: DrawingPoint, _context: StyleContext): void {
    console.log('🎨 Chalk style started');
    this.particles = [];
  }

  onMove(points: DrawingPoint[], context: StyleContext): void {
    const { ctx, isEraserMode, thicknessMultiplier: _thicknessMultiplier, currentSizeLevel: _currentSizeLevel, sizeMultipliers: _sizeMultipliers, isWebApp: _isWebApp } =
      context;

    if (points.length < 2) return;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    // Draw each point as a chalk stroke
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
      const sizeVariation = 0.7 + Math.random() * 0.6; // More variation for chalk
      const finalSize = (touchWidth / 2) * sizeVariation * sizeMultiplier;

      if (isEraserMode) {
        // Eraser: create dark areas
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#151E35';
      } else {
        // Chalk: create dusty, textured strokes
        const colorT = Math.sin(t * Math.PI) * 0.1;
        const colorMultiplier = 1 + colorT;
        const baseColor = this.getChalkColor(colorMultiplier);

        // Create main chalk stroke
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = baseColor;

        // Draw textured chalk stroke
        ctx.beginPath();
        ctx.arc(dotX, dotY, finalSize, 0, 2 * Math.PI);
        ctx.fill();

        // Add chalk dust particles
        for (let i = 0; i < 5; i++) {
          const particleX = dotX + (Math.random() - 0.5) * finalSize * 2;
          const particleY = dotY + (Math.random() - 0.5) * finalSize * 2;
          const particleSize = Math.random() * finalSize * 0.3;

          ctx.globalAlpha = 0.6;
          ctx.fillStyle = baseColor;

          ctx.beginPath();
          ctx.arc(particleX, particleY, particleSize, 0, 2 * Math.PI);
          ctx.fill();

          // Add to particle system for animation
          this.particles.push({
            x: particleX,
            y: particleY,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 1.0,
            maxLife: 1.0,
            color: baseColor,
          });
        }

        // Create chalk dust trail
        for (let i = 0; i < 3; i++) {
          const trailX = dotX + (Math.random() - 0.5) * finalSize;
          const trailY = dotY + (Math.random() - 0.5) * finalSize;
          const trailSize = Math.random() * finalSize * 0.2;

          ctx.globalAlpha = 0.3;
          ctx.fillStyle = baseColor;

          ctx.beginPath();
          ctx.arc(trailX, trailY, trailSize, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    });

    ctx.restore();
  }

  onEnd(_context: StyleContext): void {
    console.log('🎨 Chalk style ended');
  }

  onClear(_context: StyleContext): void {
    this.particles = [];
  }

  animate(_context: StyleContext): void {
    const { ctx } = _context;

    // Animate chalk dust particles
    this.particles = this.particles.filter((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // Gravity
      particle.life -= 0.02;

      if (particle.life > 0) {
        ctx.save();
        ctx.globalAlpha = particle.life * 0.5;
        ctx.fillStyle = particle.color;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 1, 0, 2 * Math.PI);
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
      const baseMultiplier = 0.18 * (sizeMultipliers[currentSizeLevel] || 1.0);
      return baseMultiplier * thicknessMultiplier;
    } else {
      const minArea = 5;
      const maxArea = 100;
      const normalizedArea = Math.max(0, Math.min(1, (touchArea - minArea) / (maxArea - minArea)));

      let baseMultiplier;
      if ((point.width || 0) === 0 || (point.height || 0) === 0) {
        baseMultiplier = 0.22;
      } else {
        baseMultiplier = 0.12 + normalizedArea * 0.2;
      }

      const sizeVariation = 0.9 + Math.random() * 0.2;
      const smoothedMultiplier =
        this.lastSizeMultiplier * (1 - this.sizeSmoothingFactor) +
        baseMultiplier * sizeVariation * this.sizeSmoothingFactor;
      this.lastSizeMultiplier = smoothedMultiplier;

      return smoothedMultiplier * (sizeMultipliers[currentSizeLevel] || 1.0) * thicknessMultiplier;
    }
  }

  private getChalkColor(multiplier: number): string {
    // Chalk colors - soft, dusty tones
    const colors = [
      '#FFFFFF', // White chalk
      '#F0F0F0', // Off-white
      '#E8E8E8', // Light gray
      '#D0D0D0', // Gray
      '#FFE4E1', // Misty rose
      '#E6E6FA', // Lavender
      '#F0F8FF', // Alice blue
      '#F5F5DC', // Beige
    ];

    const index = Math.floor(multiplier * colors.length) % colors.length;
    return colors[index] || '#ff6b6b';
  }
}
