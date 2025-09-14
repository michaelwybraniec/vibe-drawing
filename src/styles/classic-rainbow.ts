import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class Style8 implements DrawingStyle {
  name = 'Classic Rainbow';
  description = 'Original rainbow cycling with sparkle effects';
  
  private randomStyleParams = {
    baseHue: 216,
    saturation: 90,
    lightness: 50,
    sparkleIntensity: 0.3,
    sparkleSize: 2,
    sparkleCount: 3,
    glowIntensity: 0.2,
    pulseSpeed: 0.02,
    sizeMultiplier: 1.0,
    cycleSpeed: 8,
    filter: 'none',
  };

  draw(
    ctx: CanvasRenderingContext2D,
    point: DrawingPoint,
    context: StyleContext
  ): void {
    const { x, y, width, height: _height } = point;
    const { isEraserMode, thicknessMultiplier: _thicknessMultiplier, currentSizeLevel: _currentSizeLevel, sizeMultipliers: _sizeMultipliers, isWebApp } = context;
    
    // Style 8: EXACT Original Style 1 Implementation
    const time = Date.now() * 0.001;
    const baseHue = this.randomStyleParams.baseHue;
    const cycleSpeed = this.randomStyleParams.cycleSpeed || 8;
    
    // Apply light performant filter for Style 8 (only occasionally for performance)
    if (this.randomStyleParams.filter && this.randomStyleParams.filter !== 'none' && Math.random() < 0.3) {
      ctx.filter = this.randomStyleParams.filter;
    }
    
    // EXACT original Style 1 rainbow cycling effect
    const hueCycle = Math.sin(time * cycleSpeed) * 100; // EXACT original: 100 (not reduced)
    const hueVariation = (Math.random() - 0.5) * 80 + hueCycle; // EXACT original: 80
    const saturationVariation = (Math.random() - 0.5) * 40 + Math.sin(time * 3) * 20; // EXACT original: 40
    const lightnessVariation = (Math.random() - 0.5) * 35 + Math.sin(time * 2.5) * 15; // EXACT original: 35
    
    // EXACT original palette with theme-based cycling
    const hue = (baseHue + hueVariation + 360) % 360;
    const saturation = Math.max(70, Math.min(100, this.randomStyleParams.saturation + saturationVariation));
    const lightness = Math.max(35, Math.min(85, this.randomStyleParams.lightness + lightnessVariation)); // EXACT original: 85 max
    
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    
    // EXACT original size calculation
    const baseSize = (Math.max(width, _height) / 2) * (0.95 + Math.random() * 0.1);
    const pulseScale = 1 + Math.sin(Date.now() / 160) * 0.03;
    const finalSize = baseSize * pulseScale;
    
    // Report actual size to debugger
    if (typeof (window as any).reportActualSize === 'function') {
      (window as any).reportActualSize('Original Style 1', currentSizeLevel, finalSize);
    }
    
    ctx.save();
    
    if (isEraserMode) {
      // EXACT original eraser mode
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#151E35'; // EXACT original background color
      ctx.beginPath();
      ctx.arc(x, y, finalSize, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // EXACT original drawing mode
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, finalSize, 0, 2 * Math.PI);
      ctx.fill();
      
      // EXACT original sparkle effects
      if (Math.max(width, _height) > 10) {
        let sparkleChance;
        if (isWebApp) {
          sparkleChance = 0.6; // EXACT original web chance
        } else {
          sparkleChance = 0.3; // EXACT original mobile chance
        }
        
        if (Math.random() < sparkleChance) {
          ctx.save();
          ctx.globalAlpha = 0.5; // EXACT original alpha
          this.addSparkleEffect(ctx, x, y, Math.max(width, _height) / 2.5); // EXACT original size
          ctx.restore();
        }
      }
    }
    
    // Reset filter after drawing (EXACT original)
    if (this.randomStyleParams.filter && this.randomStyleParams.filter !== 'none') {
      ctx.filter = 'none';
    }
    
    ctx.restore();
  }

  private addSparkleEffect(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    // EXACT original sparkle effect from main.ts addSparkleEffect function
    const sparkleCount = Math.floor(Math.random() * 4) + 2; // 2 to 5 sparkles (EXACT original)
    const sparkleSize = size * (0.1 + Math.random() * 0.2); // EXACT original size range
    
    for (let i = 0; i < sparkleCount; i++) {
      const sparkleX = x + (Math.random() - 0.5) * size * 1.5; // EXACT original distance
      const sparkleY = y + (Math.random() - 0.5) * size * 1.5; // EXACT original distance
      const sparkleOpacity = 0.4 + Math.random() * 0.4; // EXACT original opacity range
      
      ctx.globalAlpha = sparkleOpacity;
      ctx.fillStyle = '#ffffff'; // EXACT original white sparkles
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, sparkleSize, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  generateRandomParameters(): void {
    // Generate new random parameters for this style
    const currentHue = this.randomStyleParams.baseHue;
    const currentSaturation = this.randomStyleParams.saturation;
    const currentLightness = this.randomStyleParams.lightness;
    
    let hue = Math.floor(Math.random() * 360);
    let saturation = 90;
    let lightness = 50;
    let attempts = 0;
    const maxAttempts = 15;
    
    do {
      hue = Math.floor(Math.random() * 360);
      const saturationChoices = [80, 85, 90, 95, 100];
      saturation = saturationChoices[Math.floor(Math.random() * saturationChoices.length)]!;
      const lightnessChoices = [35, 40, 45, 50, 55, 60, 65];
      lightness = lightnessChoices[Math.floor(Math.random() * lightnessChoices.length)]!;
      attempts++;
    } while (
      attempts < maxAttempts && 
      Math.abs(hue - currentHue) < 60 && 
      Math.abs(saturation - currentSaturation) < 20 && 
      Math.abs(lightness - currentLightness) < 20
    );

    this.randomStyleParams = {
      ...this.randomStyleParams,
      baseHue: hue,
      saturation,
      lightness,
      sparkleIntensity: Math.random() * 0.6 + 0.4,
      sparkleSize: Math.random() * 3 + 1.0,
      sparkleCount: Math.floor(Math.random() * 5) + 2,
      glowIntensity: Math.random() * 0.4 + 0.1,
      pulseSpeed: Math.random() * 0.03 + 0.01,
      cycleSpeed: Math.random() * 10 + 5, // Original cycle speed range
      filter: Math.random() < 0.3 ? 'hue-rotate(90deg) saturate(1.5)' : 'none',
    };
    
    console.log(`🌈 Style 8 NEW COLORS: baseHue=${hue}, saturation=${saturation}, lightness=${lightness}, cycleSpeed=${this.randomStyleParams.cycleSpeed}`);
  }

  resetToDefault(): void {
    this.randomStyleParams = {
      baseHue: 216,
      saturation: 90,
      lightness: 50,
      sparkleIntensity: 0.3,
      sparkleSize: 2,
      sparkleCount: 3,
      glowIntensity: 0.2,
      pulseSpeed: 0.02,
      sizeMultiplier: 1.0,
      cycleSpeed: 8,
      filter: 'none',
    };
  }
}
