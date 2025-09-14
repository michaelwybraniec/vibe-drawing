import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class TriangleStyle implements DrawingStyle {
  name = 'Triangle';
  description = 'Bright neon triangles with glowing effects';
  icon = '7';

  private currentVariant = 0;
  private currentTheme = 0; // 0-4: 5 surprise colors
  private lastPoint: DrawingPoint | null = null;
  private drawingSpeed = 1;
  private colorVariants = [
    // Surprise Color 1 - Mystical Purple
    { baseHue: 280, saturation: 85, lightness: 60, name: 'Mystical Purple' },
    
    // Surprise Color 2 - Electric Neon
    { baseHue: 100, saturation: 100, lightness: 50, name: 'Electric Neon' },
    
    // Surprise Color 3 - Sunset Fuchsia
    { baseHue: 300, saturation: 90, lightness: 65, name: 'Sunset Fuchsia' },
    
    // Surprise Color 4 - Ocean Teal
    { baseHue: 180, saturation: 80, lightness: 55, name: 'Ocean Teal' },
    
    // Surprise Color 5 - Fire Red
    { baseHue: 0, saturation: 95, lightness: 60, name: 'Fire Red' }
  ];

  draw(ctx: CanvasRenderingContext2D, point: DrawingPoint, context: StyleContext): void {
    // Simple draw implementation for triangle style
    const { x, y, width, height } = point;
    const { isEraserMode } = context;
    
    // Calculate size multiplier like in onMove
    const sizeMultiplier = this.calculateSizeMultiplier(point, context);
    
    // Calculate pressure-based size (simulate pressure sensitivity)
    const maxTouch = Math.max(width, height);
    const normalizedPressure = Math.min(1, Math.max(0.2, maxTouch / 30)); // Normalize to 0.2-1.0
    
    const baseSize = 1;
    const pressureMultiplier = 0.4 + (normalizedPressure * 0.6); // Size changes with pressure (0.4x to 1.0x)
    const finalSize = maxTouch * baseSize * sizeMultiplier * pressureMultiplier;
    
    ctx.save();
    if (isEraserMode) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
    
    this.drawTriangle(ctx, x, y, finalSize);
    ctx.restore();
  }

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

  onStart(point: DrawingPoint, _context: StyleContext): void {
    this.glowTrails = [];
    this.lastPoint = point;
    this.drawingSpeed = 1;
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
      const t = ((point.t || 0) - (prevPoint.t || 0)) / 16; // Normalize time

      if (t <= 0) return;

      // Calculate size multiplier
      const sizeMultiplier = this.calculateSizeMultiplier(point, context);

      // Interpolate position
      const dotX = prevPoint.x + (point.x - prevPoint.x) * t;
      const dotY = prevPoint.y + (point.y - prevPoint.y) * t;

      // Calculate pressure-based size (simulate pressure sensitivity)
      const touchWidth = point.width || 1;
      const touchHeight = point.height || 1;
      
      // Use the larger of width or height as pressure indicator
      const maxTouch = Math.max(touchWidth, touchHeight);
      const normalizedPressure = Math.min(1, Math.max(0.2, maxTouch / 30)); // Normalize to 0.2-1.0
      
      // Debug: log the values to see what we're getting
      if (Math.random() < 0.01) { // Log occasionally to avoid spam
        console.log(`Touch: w=${touchWidth.toFixed(1)}, h=${touchHeight.toFixed(1)}, max=${maxTouch.toFixed(1)}, pressure=${normalizedPressure.toFixed(2)}`);
      }
      
      // Calculate final size with pressure variation
      const baseSize = 3.9;
      const pressureMultiplier = 0.4 + (normalizedPressure * 0.6); // Size changes with pressure (0.4x to 1.0x)
      const randomVariation = 0.8 + (Math.random() * 0.4); // Random variation between 0.8x and 1.2x
      const finalSize = maxTouch * baseSize * sizeMultiplier * pressureMultiplier * randomVariation;

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

        this.drawTriangle(ctx, dotX, dotY, finalSize * 3);

        // Create middle glow (medium, brighter)
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = baseColor;

        this.drawTriangle(ctx, dotX, dotY, finalSize * 2);

        // Create inner glow (small, brightest)
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = baseColor;

        this.drawTriangle(ctx, dotX, dotY, finalSize);

        // Create bright center
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#FFFFFF';

        this.drawTriangle(ctx, dotX, dotY, finalSize * 0.3);

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
    this.lastPoint = null;
    this.drawingSpeed = 1;
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

        this.drawTriangle(ctx, trail.x, trail.y, trail.size * 2);

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
      const baseMultiplier = 0.4 * (sizeMultipliers[currentSizeLevel] || 1.0);
      return baseMultiplier * thicknessMultiplier;
    } else {
      const minArea = 5;
      const maxArea = 100;
      const normalizedArea = Math.max(0, Math.min(1, (touchArea - minArea) / (maxArea - minArea)));

      let baseMultiplier;
      if ((point.width || 0) === 0 || (point.height || 0) === 0) {
        baseMultiplier = 3.4;
      } else {
        baseMultiplier = 4.2 + normalizedArea * 0.4;
      }

      const sizeVariation = 0.95; // Remove random variation for consistent size
      const smoothedMultiplier =
        this.lastSizeMultiplier * (1 - this.sizeSmoothingFactor) +
        baseMultiplier * sizeVariation * this.sizeSmoothingFactor;
      this.lastSizeMultiplier = smoothedMultiplier;

      return smoothedMultiplier * (sizeMultipliers[currentSizeLevel] || 1.0) * thicknessMultiplier;
    }
  }

  private getGlowColor(multiplier: number): string {
    const currentVariant = this.colorVariants[this.currentVariant]!;
    const baseHue = currentVariant.baseHue;
    const saturation = currentVariant.saturation;
    const lightness = currentVariant.lightness;
    
    // Add some variation based on multiplier
    const hueVariation = Math.sin(multiplier * Math.PI) * 30;
    const finalHue = (baseHue + hueVariation + 360) % 360;
    
    return `hsl(${finalHue}, ${saturation}%, ${lightness}%)`;
  }

  nextColorVariant(): void {
    // Cycle through colors (5 colors total)
    this.currentTheme = (this.currentTheme + 1) % 5;
    
    // Set variant to the color (since each theme has only 1 color)
    this.currentVariant = this.currentTheme;
    
    const colorNames = ['Mystical Purple', 'Electric Neon', 'Sunset Fuchsia', 'Ocean Teal', 'Fire Red'];
    console.log(`Triangle color changed to: ${colorNames[this.currentTheme]} (variant ${this.currentVariant})`);
  }

  resetToDefault(): void {
    this.currentVariant = 0;
    this.currentTheme = 0;
  }

  getCurrentVariantName(): string {
    const colorNames = ['Mystical Purple', 'Electric Neon', 'Sunset Fuchsia', 'Ocean Teal', 'Fire Red'];
    return colorNames[this.currentTheme] || 'Unknown';
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

      this.drawTriangle(ctx, sparkleX, sparkleY, 2);
    }

    ctx.restore();
  }

  private drawTriangle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    const currentVariant = this.colorVariants[this.currentVariant]!;
    
    // Define three different colors for the three sides
    const sideColors = [
      `hsl(${currentVariant.baseHue}, ${currentVariant.saturation}%, ${currentVariant.lightness}%)`, // Top side
      `hsl(${(currentVariant.baseHue + 120) % 360}, ${currentVariant.saturation}%, ${currentVariant.lightness}%)`, // Left side
      `hsl(${(currentVariant.baseHue + 240) % 360}, ${currentVariant.saturation}%, ${currentVariant.lightness}%)`  // Right side
    ];
    
    // Calculate triangle vertices
    const topX = x;
    const topY = y - size / 2;
    const leftX = x - size / 2;
    const leftY = y + size / 2;
    const rightX = x + size / 2;
    const rightY = y + size / 2;
    
    // Draw each side with different colors
    // Top side (top to left)
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(leftX, leftY);
    ctx.strokeStyle = sideColors[0]!;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Left side (left to right)
    ctx.beginPath();
    ctx.moveTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.strokeStyle = sideColors[1]!;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Right side (right to top)
    ctx.beginPath();
    ctx.moveTo(rightX, rightY);
    ctx.lineTo(topX, topY);
    ctx.strokeStyle = sideColors[2]!;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Fill the triangle with a semi-transparent version of the base color
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fillStyle = `hsla(${currentVariant.baseHue}, ${currentVariant.saturation}%, ${currentVariant.lightness}%, 0.3)`;
    ctx.fill();
  }
}