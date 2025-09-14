import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class Style4 implements DrawingStyle {
  name = 'Fire Lava';
  description = 'Flowing fire and lava effects with heat distortion';
  
  private randomStyleParams = {
    baseHue: 15,
    saturation: 90,
    lightness: 55,
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
    const baseHue = this.randomStyleParams.baseHue;
    
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
      const saturation = this.randomStyleParams.saturation;
      const lightness = this.randomStyleParams.lightness;
      
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
      if (Math.random() < this.randomStyleParams.heatDistortion) {
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
        const emberCount = Math.floor(this.randomStyleParams.emberCount * (0.5 + Math.random()));
        
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

  generateRandomParameters(): void {
    this.randomStyleParams = {
      baseHue: 10 + Math.random() * 40, // Orange to red range
      saturation: 80 + Math.random() * 20,
      lightness: 45 + Math.random() * 30,
      fireIntensity: 0.4 + Math.random() * 0.6,
      heatDistortion: 0.2 + Math.random() * 0.6,
      emberCount: 3 + Math.floor(Math.random() * 5),
    };
    console.log(`🔥 Style 4 NEW COLORS: baseHue=${this.randomStyleParams.baseHue}, fireIntensity=${this.randomStyleParams.fireIntensity}`);
  }

  resetToDefault(): void {
    this.randomStyleParams = {
      baseHue: 15,
      saturation: 90,
      lightness: 55,
      fireIntensity: 0.7,
      heatDistortion: 0.4,
      emberCount: 5,
    };
  }
}
