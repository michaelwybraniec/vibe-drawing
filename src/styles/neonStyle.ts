import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class NeonStyle implements DrawingStyle {
  name = 'Neon';
  description = 'Bright neon lines with glowing effects';
  icon = '3';

  private currentVariant = 0;
  private colorVariants = [
    { color: '#00ff00', name: 'Neon Green' },
    { color: '#ff00ff', name: 'Neon Magenta' },
    { color: '#00ffff', name: 'Neon Cyan' },
    { color: '#ffff00', name: 'Neon Yellow' },
    { color: '#ff0080', name: 'Neon Pink' }
  ];

  private neonLines: Array<{
    points: DrawingPoint[];
    color: string;
    startTime: number;
  }> = [];
  private currentLine: Array<DrawingPoint> = [];
  private currentColor: string = '#00ff00';

  draw(ctx: CanvasRenderingContext2D, point: DrawingPoint, context: StyleContext): void {
    const { x, y, width, height } = point;
    const { isEraserMode } = context;
    
    ctx.save();
    if (isEraserMode) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = this.currentColor;
    }
    
    ctx.beginPath();
    ctx.arc(x, y, Math.max(width, height) / 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }

  onStart(point: DrawingPoint, _context: StyleContext): void {

    this.currentLine = [point];
    this.currentColor = this.getNeonColor();
  }

  onMove(points: DrawingPoint[], _context: StyleContext): void {
    const { ctx: _ctx } = _context;

    // Add new points to current line
    this.currentLine.push(...points);

    // Draw all neon lines
    this.drawNeonLines(_context);
  }

  onEnd(_context: StyleContext): void {

    if (this.currentLine.length > 1) {
      this.neonLines.push({
        points: [...this.currentLine],
        color: this.currentColor,
        startTime: Date.now(),
      });
    }

    this.currentLine = [];
  }

  onClear(_context: StyleContext): void {
    this.neonLines = [];
    this.currentLine = [];
  }

  private drawNeonLines(context: StyleContext): void {
    const { ctx, isEraserMode: _isEraserMode } = context;

    ctx.save();

    // Draw current line
    if (this.currentLine.length > 1) {
      this.drawNeonLine(this.currentLine, this.currentColor, context, false);
    }

    // Draw existing lines
    this.neonLines.forEach((line) => {
      this.drawNeonLine(line.points, line.color, context, true);
    });

    ctx.restore();
  }

  private drawNeonLine(
    points: DrawingPoint[],
    color: string,
    context: StyleContext,
    isExisting: boolean,
  ): void {
    const { ctx, isEraserMode } = context;

    if (points.length < 2) return;

    ctx.save();

    // Set up neon effect
    const baseColor = isEraserMode ? '#151E35' : color;
    const glowColor = isEraserMode ? '#151E35' : this.getGlowColor(color);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw outer glow (multiple layers for stronger effect)
    for (let i = 3; i >= 1; i--) {
      ctx.strokeStyle = glowColor;
      if (!points[0]) return;
      ctx.lineWidth = this.calculateLineWidth(points[0], context) * (i * 2);
      ctx.globalAlpha = 0.1 / i;

      ctx.beginPath();
      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    }

    // Draw main neon line
    ctx.strokeStyle = baseColor;
    if (!points[0]) return;
    ctx.lineWidth = this.calculateLineWidth(points[0], context);
    ctx.globalAlpha = 1;

    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();

    // Add inner highlight
    if (!isEraserMode) {
      ctx.strokeStyle = '#ffffff';
      if (!points[0]) return;
      ctx.lineWidth = this.calculateLineWidth(points[0], context) * 0.3;
      ctx.globalAlpha = 0.8;
      ctx.stroke();
    }

    // Add sparkles for existing lines
    if (isExisting && !isEraserMode && Math.random() < 0.1) {
      this.addSparkles(points, color, context);
    }

    ctx.restore();
  }

  private addSparkles(points: DrawingPoint[], color: string, context: StyleContext): void {
    const { ctx } = context;

    ctx.save();

    const sparkleCount = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < sparkleCount; i++) {
      const randomPoint = points[Math.floor(Math.random() * points.length)];
      const sparkleSize = 2 + Math.random() * 3;
      if (!randomPoint) return;
      const sparkleX = randomPoint.x + (Math.random() - 0.5) * 20;
      const sparkleY = randomPoint.y + (Math.random() - 0.5) * 20;

      // Draw sparkle
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, sparkleSize, 0, 2 * Math.PI);
      ctx.fill();

      // Draw glow around sparkle
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, sparkleSize * 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.restore();
  }

  private calculateLineWidth(point: DrawingPoint, context: StyleContext): number {
    const { isWebApp, currentSizeLevel, sizeMultipliers, thicknessMultiplier } = context;
    const touchArea = Math.sqrt((point.width || 1) * (point.height || 1));

    if (isWebApp) {
      const baseMultiplier = 0.15 * (sizeMultipliers[currentSizeLevel] || 1.0);
      return baseMultiplier * thicknessMultiplier * 15;
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

      return baseMultiplier * thicknessMultiplier * 15;
    }
  }

  private getNeonColor(): string {
    const currentVariant = this.colorVariants[this.currentVariant]!;
    return currentVariant.color;
  }

  nextColorVariant(): void {
    this.currentVariant = (this.currentVariant + 1) % this.colorVariants.length;
  }

  resetToDefault(): void {
    this.currentVariant = 0;
  }

  private getGlowColor(baseColor: string): string {
    // Create a brighter version of the base color for glow
    return baseColor;
  }
}
