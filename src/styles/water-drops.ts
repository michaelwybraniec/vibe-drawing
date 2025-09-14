import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class Style5 implements DrawingStyle {
  name = 'Water Drops';
  description = 'Liquid water effects with ripples and reflections';
  
  private currentVariant = 0;
  private colorVariants = [
    { baseHue: 200, saturation: 80, lightness: 60, name: 'Ocean Blue' },
    { baseHue: 180, saturation: 85, lightness: 55, name: 'Cyan Water' },
    { baseHue: 220, saturation: 75, lightness: 65, name: 'Sky Blue' },
    { baseHue: 160, saturation: 90, lightness: 50, name: 'Teal Drops' },
    { baseHue: 240, saturation: 80, lightness: 70, name: 'Light Blue' }
  ];
  
  private styleParams = {
    rippleIntensity: 0.6,
    dropCount: 4,
    reflectionStrength: 0.5,
  };

  draw(
    ctx: CanvasRenderingContext2D,
    point: DrawingPoint,
    context: StyleContext
  ): void {
    const { x, y, width, height } = point;
    const { isEraserMode, thicknessMultiplier, currentSizeLevel, sizeMultipliers } = context;
    
    // Water Drops Effect
    const time = Date.now() * 0.001;
    const currentVariant = this.colorVariants[this.currentVariant]!;
    const baseHue = currentVariant.baseHue;
    
    // Use global size system
    const baseMultiplier = 0.4 * (sizeMultipliers[currentSizeLevel] || 1.0);
    const waterSize = baseMultiplier * thicknessMultiplier * Math.max(width, height);
    
    ctx.save();
    
    if (isEraserMode) {
      // Eraser mode
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x, y, waterSize * 1.2, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Normal drawing mode - Water Drops
      ctx.globalCompositeOperation = 'source-over';
      
      // Create water gradient
      const gradient = ctx.createRadialGradient(
        x - waterSize * 0.2, y - waterSize * 0.2, 0,
        x, y, waterSize
      );
      
      const hue = (baseHue + Math.sin(time * 2) * 20) % 360;
      const saturation = currentVariant.saturation;
      const lightness = currentVariant.lightness;
      
      // Highlight (light blue/white)
      gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${Math.min(95, lightness + 35)}%)`);
      // Main water color
      gradient.addColorStop(0.6, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
      // Shadow (darker blue)
      gradient.addColorStop(1, `hsl(${hue}, ${saturation}%, ${Math.max(25, lightness - 25)}%)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, waterSize, 0, 2 * Math.PI);
      ctx.fill();
      
      // Simple lava-like glow effect
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness + 20}%)`;
      ctx.beginPath();
      ctx.arc(x, y, waterSize * 1.5, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    ctx.restore();
  }

  nextColorVariant(): void {
    this.currentVariant = (this.currentVariant + 1) % this.colorVariants.length;
    const _variant = this.colorVariants[this.currentVariant]!;
  }

  resetToDefault(): void {
    this.currentVariant = 0;
  }
}
