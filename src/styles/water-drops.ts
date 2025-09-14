import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class Style5 implements DrawingStyle {
  name = 'Water Drops';
  description = 'Liquid water effects with ripples and reflections';
  
  private randomStyleParams = {
    baseHue: 200,
    saturation: 80,
    lightness: 60,
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
    const baseHue = this.randomStyleParams.baseHue;
    
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
      const saturation = this.randomStyleParams.saturation;
      const lightness = this.randomStyleParams.lightness;
      
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
      
      // Water ripple effect
      if (Math.random() < this.randomStyleParams.rippleIntensity) {
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness + 20}%)`;
        ctx.lineWidth = 2;
        
        // Draw concentric ripples
        for (let i = 1; i <= 3; i++) {
          const rippleRadius = waterSize * (0.5 + i * 0.3);
          const rippleAlpha = 0.4 - (i * 0.1);
          
          ctx.globalAlpha = rippleAlpha;
          ctx.beginPath();
          ctx.arc(x, y, rippleRadius, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
      
      // Water droplets
      if (Math.random() < 0.5) {
        const dropCount = Math.floor(this.randomStyleParams.dropCount * (0.5 + Math.random()));
        
        for (let i = 0; i < dropCount; i++) {
          const dropX = x + (Math.random() - 0.5) * waterSize * 1.8;
          const dropY = y + (Math.random() - 0.5) * waterSize * 1.8;
          const dropSize = waterSize * (0.2 + Math.random() * 0.4);
          
          // Drop highlight
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness + 30}%)`;
          ctx.beginPath();
          ctx.arc(dropX - dropSize * 0.2, dropY - dropSize * 0.2, dropSize * 0.3, 0, 2 * Math.PI);
          ctx.fill();
          
          // Drop body
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
          ctx.beginPath();
          ctx.arc(dropX, dropY, dropSize, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      
      // Reflection effect
      if (Math.random() < this.randomStyleParams.reflectionStrength) {
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness + 40}%)`;
        
        // Reflection highlight
        ctx.beginPath();
        ctx.ellipse(x, y - waterSize * 0.3, waterSize * 0.4, waterSize * 0.2, 0, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      // Splash effect
      if (Math.random() < 0.2) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness + 20}%)`;
        
        // Small splash particles
        for (let i = 0; i < 4; i++) {
          const splashX = x + (Math.random() - 0.5) * waterSize * 2.5;
          const splashY = y + (Math.random() - 0.5) * waterSize * 2.5;
          const splashSize = waterSize * (0.1 + Math.random() * 0.2);
          
          ctx.beginPath();
          ctx.arc(splashX, splashY, splashSize, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
    
    ctx.restore();
  }

  generateRandomParameters(): void {
    this.randomStyleParams = {
      baseHue: 180 + Math.random() * 60, // Blue to cyan range
      saturation: 70 + Math.random() * 30,
      lightness: 50 + Math.random() * 30,
      rippleIntensity: 0.3 + Math.random() * 0.7,
      dropCount: 2 + Math.floor(Math.random() * 6),
      reflectionStrength: 0.2 + Math.random() * 0.6,
    };
    console.log(`💧 Style 5 NEW COLORS: baseHue=${this.randomStyleParams.baseHue}, rippleIntensity=${this.randomStyleParams.rippleIntensity}`);
  }

  resetToDefault(): void {
    this.randomStyleParams = {
      baseHue: 200,
      saturation: 80,
      lightness: 60,
      rippleIntensity: 0.6,
      dropCount: 4,
      reflectionStrength: 0.5,
    };
  }
}
