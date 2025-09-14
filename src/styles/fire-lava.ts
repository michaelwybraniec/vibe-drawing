import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class Style4 implements DrawingStyle {
  name = 'Fire Lava';
  description = 'Flowing fire and lava effects with heat distortion';
  
  private currentVariant = 0;
  private colorVariants = [
    { baseHue: 15, saturation: 90, lightness: 55, name: 'Classic Fire' },
    { baseHue: 0, saturation: 85, lightness: 50, name: 'Deep Red' },
    { baseHue: 30, saturation: 95, lightness: 60, name: 'Bright Orange' },
    { baseHue: 45, saturation: 90, lightness: 65, name: 'Golden Flame' },
    { baseHue: 60, saturation: 85, lightness: 70, name: 'Yellow Fire' }
  ];
  
  private styleParams = {
    fireIntensity: 0.7,
    heatDistortion: 0.4,
    emberCount: 5,
  };

  draw(
    ctx: CanvasRenderingContext2D,
    point: DrawingPoint,
    context: StyleContext
  ): void {
    const { x, y, width, height } = point;
    const { isEraserMode, thicknessMultiplier, currentSizeLevel, sizeMultipliers } = context;
    
    // Fire Lava Effect
    const time = Date.now() * 0.001;
    const currentVariant = this.colorVariants[this.currentVariant]!;
    const baseHue = currentVariant.baseHue;
    
    // Use global size system
    const baseMultiplier = 0.5 * (sizeMultipliers[currentSizeLevel] || 1.0);
    const fireSize = baseMultiplier * thicknessMultiplier * Math.max(width, height);
    
    ctx.save();
    
    if (isEraserMode) {
      // Eraser mode
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x, y, fireSize * 1.2, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Normal drawing mode - Fire Lava
      ctx.globalCompositeOperation = 'source-over';
      
      // Create fire gradient
      const gradient = ctx.createRadialGradient(
        x, y - fireSize * 0.3, 0,
        x, y, fireSize
      );
      
      const hue = (baseHue + Math.sin(time * 3) * 20) % 360;
      const saturation = currentVariant.saturation;
      const lightness = currentVariant.lightness;
      
      // Hot center (white/yellow)
      gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, 90%)`);
      // Orange fire
      gradient.addColorStop(0.4, `hsl(${hue}, ${saturation}%, ${lightness + 20}%)`);
      // Red lava
      gradient.addColorStop(0.8, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
      // Dark red base
      gradient.addColorStop(1, `hsl(${hue}, ${saturation}%, ${Math.max(20, lightness - 30)}%)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, fireSize, 0, 2 * Math.PI);
      ctx.fill();
      
      // Heat distortion effect
      if (Math.random() < this.styleParams.heatDistortion) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness + 40}%)`;
        
        // Distorted flame shapes
        for (let i = 0; i < 3; i++) {
          const flameX = x + (Math.random() - 0.5) * fireSize * 0.8;
          const flameY = y - fireSize * (0.3 + Math.random() * 0.4);
          const flameSize = fireSize * (0.3 + Math.random() * 0.4);
          
          ctx.beginPath();
          ctx.ellipse(flameX, flameY, flameSize * 0.6, flameSize, Math.random() * Math.PI, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      
      // Ember particles
      if (Math.random() < 0.4) {
        const emberCount = Math.floor(this.styleParams.emberCount * (0.5 + Math.random()));
        
        for (let i = 0; i < emberCount; i++) {
          const emberX = x + (Math.random() - 0.5) * fireSize * 2;
          const emberY = y - fireSize * (0.5 + Math.random() * 1.5);
          const emberSize = fireSize * (0.1 + Math.random() * 0.2);
          
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = `hsl(${hue + Math.random() * 30}, ${saturation}%, ${lightness + 30}%)`;
          ctx.beginPath();
          ctx.arc(emberX, emberY, emberSize, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      
      // Lava flow effect
      if (Math.random() < 0.3) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`;
        
        // Flowing lava streaks
        for (let i = 0; i < 2; i++) {
          const lavaX = x + (Math.random() - 0.5) * fireSize * 1.5;
          const lavaY = y + fireSize * (0.2 + Math.random() * 0.6);
          const lavaSize = fireSize * (0.2 + Math.random() * 0.3);
          
          ctx.beginPath();
          ctx.ellipse(lavaX, lavaY, lavaSize * 1.5, lavaSize * 0.5, Math.random() * Math.PI, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
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
