import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

interface LavaPoint {
  x: number;
  y: number;
  sizeMultiplier: number;
  touchWidth: number;
  touchHeight: number;
  time: number;
}

interface LavaLine {
  points: LavaPoint[];
  startTime: number;
  isMelting: boolean;
  meltProgress: number;
}

export class LavaStyle implements DrawingStyle {
  name = 'Lava';
  description = 'Flowing lava lines that melt and drip';
  icon = '2';

  private lavaLines: LavaLine[] = [];
  private currentLavaLine: LavaLine | null = null;
  private animationId: number | null = null;

  onStart(point: DrawingPoint, context: StyleContext): void {
    console.log('🌋 Lava style started');

    this.currentLavaLine = {
      points: [],
      startTime: Date.now(),
      isMelting: false,
      meltProgress: 0,
    };

    this.addPointToLavaLine(point, context);
  }

  onMove(points: DrawingPoint[], context: StyleContext): void {
    const { ctx } = context;

    if (!this.currentLavaLine) return;

    // Add new points to current lava line
    points.forEach((point) => {
      this.addPointToLavaLine(point, context);
    });

    // Draw all lava lines
    this.drawLavaLines(context);
  }

  onEnd(context: StyleContext): void {
    console.log('🌋 Lava style ended');

    if (this.currentLavaLine) {
      this.currentLavaLine.isMelting = true;
      this.lavaLines.push(this.currentLavaLine);
      this.currentLavaLine = null;
    }

    // Start animation if not already running
    if (!this.animationId) {
      this.startAnimation(context);
    }
  }

  onClear(context: StyleContext): void {
    this.lavaLines = [];
    this.currentLavaLine = null;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  animate(context: StyleContext): void {
    this.drawLavaLines(context);

    // Update melting progress
    this.lavaLines.forEach((line) => {
      if (line.isMelting) {
        line.meltProgress += 0.02;
        if (line.meltProgress >= 1) {
          line.meltProgress = 1;
        }
      }
    });

    // Remove fully melted lines
    this.lavaLines = this.lavaLines.filter((line) => line.meltProgress < 1);

    if (this.lavaLines.length > 0 || this.currentLavaLine) {
      this.animationId = requestAnimationFrame(() => this.animate(context));
    } else {
      this.animationId = null;
    }
  }

  private addPointToLavaLine(point: DrawingPoint, context: StyleContext): void {
    if (!this.currentLavaLine) return;

    const lavaPoint: LavaPoint = {
      x: point.x,
      y: point.y,
      sizeMultiplier: this.calculateSizeMultiplier(point, context),
      touchWidth: point.width || 1,
      touchHeight: point.height || 1,
      time: point.t,
    };

    this.currentLavaLine.points.push(lavaPoint);
  }

  private drawLavaLines(context: StyleContext): void {
    const { ctx, isEraserMode } = context;

    ctx.save();

    // Draw current lava line
    if (this.currentLavaLine) {
      this.drawLavaLine(this.currentLavaLine, context, false);
    }

    // Draw existing lava lines
    this.lavaLines.forEach((line) => {
      this.drawLavaLine(line, context, true);
    });

    ctx.restore();
  }

  private drawLavaLine(line: LavaLine, context: StyleContext, isMelting: boolean): void {
    const { ctx, isEraserMode } = context;

    if (line.points.length < 2) return;

    ctx.save();

    // Create gradient for lava effect
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, '#ff4500'); // Orange-red
    gradient.addColorStop(0.5, '#ff6347'); // Tomato
    gradient.addColorStop(1, '#ff8c00'); // Dark orange

    ctx.strokeStyle = isEraserMode ? '#151E35' : gradient;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw the main lava line
    ctx.beginPath();
    line.points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });

    const lineWidth = isMelting
      ? Math.max(1, (line.points[0]?.sizeMultiplier || 1) * 20 * (1 - line.meltProgress))
      : (line.points[0]?.sizeMultiplier || 1) * 20;

    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Add glowing effect
    if (!isEraserMode) {
      ctx.shadowColor = '#ff4500';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Add drips for melting lines
    if (isMelting && line.meltProgress > 0.3) {
      this.drawDrips(line, context);
    }

    ctx.restore();
  }

  private drawDrips(line: LavaLine, context: StyleContext): void {
    const { ctx, isEraserMode } = context;

    ctx.save();

    const dripCount = Math.floor(line.meltProgress * 5);
    const dripColor = isEraserMode ? '#151E35' : '#ff6347';

    for (let i = 0; i < dripCount; i++) {
      const point = line.points[Math.floor(Math.random() * line.points.length)];
      if (!point) continue;
      const dripLength = 20 + Math.random() * 30;
      const dripWidth = point.sizeMultiplier * 5;

      ctx.fillStyle = dripColor;
      ctx.beginPath();
      ctx.ellipse(
        point.x + (Math.random() - 0.5) * 10,
        point.y + dripLength,
        dripWidth,
        dripLength,
        0,
        0,
        2 * Math.PI,
      );
      ctx.fill();
    }

    ctx.restore();
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

      return baseMultiplier * thicknessMultiplier;
    }
  }

  private startAnimation(context: StyleContext): void {
    this.animate(context);
  }
}
