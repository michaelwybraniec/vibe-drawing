import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class Style3 implements DrawingStyle {
  name = 'Glitch Wave';
  description = 'Digital glitch effects with wave distortions';
  
  private currentVariant = 0;
  private colorVariants = [
    { baseHue: 300, saturation: 100, lightness: 50, name: 'Cyber Purple' },
    { baseHue: 0, saturation: 100, lightness: 60, name: 'Neon Red' },
    { baseHue: 120, saturation: 100, lightness: 50, name: 'Matrix Green' },
    { baseHue: 200, saturation: 100, lightness: 60, name: 'Electric Blue' },
    { baseHue: 60, saturation: 100, lightness: 70, name: 'Digital Yellow' }
  ];
  
  private styleParams = {
    glitchIntensity: 0.6,
    waveFrequency: 0.1,
    distortionAmount: 0.3,
  };

  draw(
    ctx: CanvasRenderingContext2D,
    point: DrawingPoint,
    context: StyleContext
  ): void {
    const { x, y, width, height } = point;
    const { isEraserMode, thicknessMultiplier, currentSizeLevel, sizeMultipliers } = context;
    
    // Glitch Wave Effect
    const time = Date.now() * 0.001;
    const currentVariant = this.colorVariants[this.currentVariant]!;
    const baseHue = currentVariant.baseHue;
    
    // Use global size system
    const baseMultiplier = 0.3 * (sizeMultipliers[currentSizeLevel] || 1.0);
    const glitchSize = baseMultiplier * thicknessMultiplier * Math.max(width, height);
    
    ctx.save();
    
    if (isEraserMode) {
      // Eraser mode
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x, y, glitchSize * 1.2, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Normal drawing mode - Glitch Wave
      ctx.globalCompositeOperation = 'source-over';
      
      // Create glitch wave distortion
      const waveOffset = Math.sin(time * this.styleParams.waveFrequency * 10) * this.styleParams.distortionAmount * glitchSize;
      const glitchX = x + waveOffset;
      const glitchY = y + Math.sin(time * this.styleParams.waveFrequency * 15) * this.styleParams.distortionAmount * glitchSize * 0.5;
      
      // Main glitch color
      const hue = (baseHue + Math.sin(time * 5) * 60) % 360;
      const saturation = currentVariant.saturation;
      const lightness = currentVariant.lightness;
      
      // Primary glitch stroke
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.beginPath();
      ctx.arc(glitchX, glitchY, glitchSize, 0, 2 * Math.PI);
      ctx.fill();
      
      // Glitch distortion lines
      if (Math.random() < this.styleParams.glitchIntensity) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = `hsl(${(hue + 120) % 360}, ${saturation}%, ${lightness + 20}%)`;
        
        // Horizontal glitch line
        ctx.fillRect(glitchX - glitchSize, glitchY - 2, glitchSize * 2, 4);
        
        // Vertical glitch line
        ctx.fillRect(glitchX - 2, glitchY - glitchSize, 4, glitchSize * 2);
      }
      
      // Digital noise effect
      if (Math.random() < 0.3) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = `hsl(${(hue + 240) % 360}, ${saturation}%, ${lightness - 20}%)`;
        
        for (let i = 0; i < 3; i++) {
          const noiseX = glitchX + (Math.random() - 0.5) * glitchSize * 1.5;
          const noiseY = glitchY + (Math.random() - 0.5) * glitchSize * 1.5;
          const noiseSize = glitchSize * (0.2 + Math.random() * 0.3);
          
          ctx.beginPath();
          ctx.arc(noiseX, noiseY, noiseSize, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      
      // Wave interference pattern
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness + 30}%)`;
      
      for (let i = 0; i < 5; i++) {
        const waveX = glitchX + Math.sin(time * 2 + i) * glitchSize * 0.8;
        const waveY = glitchY + Math.cos(time * 3 + i) * glitchSize * 0.6;
        const waveSize = glitchSize * (0.1 + Math.random() * 0.2);
        
        ctx.beginPath();
        ctx.arc(waveX, waveY, waveSize, 0, 2 * Math.PI);
        ctx.fill();
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
