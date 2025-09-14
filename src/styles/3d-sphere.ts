import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class Style2 implements DrawingStyle {
  name = '3D Sphere';
  description = 'Three-dimensional sphere effects with depth and lighting';
  
  private currentVariant = 0;
  private lastPoint: DrawingPoint | null = null;
  private colorVariants = [
    { baseHue: 200, saturation: 85, lightness: 60, name: 'Deep Blue' },
    { baseHue: 15, saturation: 90, lightness: 55, name: 'Fire Orange' },
    { baseHue: 120, saturation: 80, lightness: 50, name: 'Emerald Green' },
    { baseHue: 300, saturation: 85, lightness: 65, name: 'Magenta Pink' },
    { baseHue: 60, saturation: 90, lightness: 70, name: 'Bright Yellow' }
  ];
  
  private styleParams = {
    sphereIntensity: 0.7,
    depthEffect: 0.8,
    lightingAngle: 45,
  };

  // Add lifecycle methods to maintain consistent style
  onStart(_point: DrawingPoint, _context: StyleContext): void {
    // Initialize any needed state
  }

  onMove(points: DrawingPoint[], context: StyleContext): void {
    const { ctx, isEraserMode } = context;
    
    if (points.length < 2) return;
    
    // Track the last point for the end effect
    this.lastPoint = points[points.length - 1]!;
    
    ctx.save();
    ctx.globalCompositeOperation = isEraserMode ? 'destination-out' : 'source-over';
    
    // Draw consistent 3D spheres along the path
    points.forEach((point, index) => {
      if (index === 0) return; // Skip first point
      
      const prevPoint = points[index - 1]!;
      const t = ((point.t || 0) - (prevPoint.t || 0)) / 16;
      
      if (t <= 0) return;
      
      // Interpolate position for smooth line
      const dotX = prevPoint.x + (point.x - prevPoint.x) * t;
      const dotY = prevPoint.y + (point.y - prevPoint.y) * t;
      
      // Draw consistent 3D sphere at each point
      this.draw3DSphere(ctx, dotX, dotY, point, context);
    });
    
    ctx.restore();
  }

  onEnd(context: StyleContext): void {
    // Draw a simple flat circle at the end
    const { ctx } = context;
    if (this.lastPoint) {
      this.drawFlatEnd(ctx, this.lastPoint.x, this.lastPoint.y, this.lastPoint, context);
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    point: DrawingPoint,
    context: StyleContext
  ): void {
    // Simple draw method - just draw a single 3D sphere
    this.draw3DSphere(ctx, point.x, point.y, point, context);
  }

  private draw3DSphere(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    point: DrawingPoint,
    context: StyleContext
  ): void {
    const { width, height } = point;
    const { isEraserMode, thicknessMultiplier, currentSizeLevel, sizeMultipliers } = context;
    
    // Double circles - one normal, one transparent
    const time = Date.now() * 0.001;
    const currentVariant = this.colorVariants[this.currentVariant]!;
    const baseHue = currentVariant.baseHue;
    
    // Use global size system
    const baseMultiplier = 0.4 * (sizeMultipliers[currentSizeLevel] || 1.0);
    const circleSize = baseMultiplier * thicknessMultiplier * Math.max(width, height);
    
    ctx.save();
    
    if (isEraserMode) {
      // Eraser mode
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x, y, circleSize * 1.2, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Normal drawing mode - Double circles
      ctx.globalCompositeOperation = 'source-over';
      
      const hue = (baseHue + Math.sin(time * 2) * 30) % 360;
      const saturation = currentVariant.saturation;
      const lightness = currentVariant.lightness;
      
      // First circle - black shadow (smaller, more offset)
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x + circleSize * 0.2, y + circleSize * 0.2, circleSize * 0.6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Second circle - normal opacity (smaller)
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.beginPath();
      ctx.arc(x, y, circleSize * 0.7, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    ctx.restore();
  }

  private drawFlatEnd(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    point: DrawingPoint,
    context: StyleContext
  ): void {
    const { width, height } = point;
    const { isEraserMode, thicknessMultiplier, currentSizeLevel, sizeMultipliers } = context;
    
    // Double circles for the end - one normal, one transparent
    const time = Date.now() * 0.001;
    const currentVariant = this.colorVariants[this.currentVariant]!;
    const baseHue = currentVariant.baseHue;
    
    // Use global size system
    const baseMultiplier = 0.4 * (sizeMultipliers[currentSizeLevel] || 1.0);
    const circleSize = baseMultiplier * thicknessMultiplier * Math.max(width, height);
    
    ctx.save();
    
    if (isEraserMode) {
      // Eraser mode
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x, y, circleSize * 1.2, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Normal drawing mode - Double circles for the end
      ctx.globalCompositeOperation = 'source-over';
      
      const hue = (baseHue + Math.sin(time * 2) * 30) % 360;
      const saturation = currentVariant.saturation;
      const lightness = currentVariant.lightness;
      
      // First circle - black shadow (smaller, more offset)
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x + circleSize * 0.2, y + circleSize * 0.2, circleSize * 0.6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Second circle - normal opacity (smaller)
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.beginPath();
      ctx.arc(x, y, circleSize * 0.7, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    ctx.restore();
  }

  private drawTwoLine3D(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    point: DrawingPoint,
    context: StyleContext
  ): void {
    const { width, height } = point;
    const { isEraserMode, thicknessMultiplier, currentSizeLevel, sizeMultipliers } = context;
    
    // Two-line 3D effect
    const time = Date.now() * 0.001;
    const currentVariant = this.colorVariants[this.currentVariant]!;
    const baseHue = currentVariant.baseHue;
    
    // Use global size system
    const baseMultiplier = 0.4 * (sizeMultipliers[currentSizeLevel] || 1.0);
    const lineSize = baseMultiplier * thicknessMultiplier * Math.max(width, height);
    
    ctx.save();
    
    if (isEraserMode) {
      // Eraser mode
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x, y, lineSize * 1.2, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Normal drawing mode - Two lines for 3D effect
      ctx.globalCompositeOperation = 'source-over';
      
      const hue = (baseHue + Math.sin(time * 2) * 30) % 360;
      const saturation = currentVariant.saturation;
      const lightness = currentVariant.lightness;
      
      // Draw two parallel circles to create 3D tube effect
      const offset = lineSize * 0.3; // Distance between the two lines
      
      // Top line (brighter)
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${Math.min(95, lightness + 20)}%)`;
      ctx.beginPath();
      ctx.arc(x - offset, y - offset, lineSize * 0.8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Bottom line (darker)
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${Math.max(20, lightness - 20)}%)`;
      ctx.beginPath();
      ctx.arc(x + offset, y + offset, lineSize * 0.8, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    ctx.restore();
  }

  nextColorVariant(): void {
    this.currentVariant = (this.currentVariant + 1) % this.colorVariants.length;
  }

  resetToDefault(): void {
    this.currentVariant = 0;
  }
}
