import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class Style1 implements DrawingStyle {
  name = 'Classic';
  description = 'Smooth classic drawing with rainbow effects';
  
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
    const { isEraserMode, thicknessMultiplier, currentSizeLevel, sizeMultipliers, isWebApp } = context;
    
    // Style 1: Artistic Pen with Pressure Sensitivity and Splash Effects
    const time = Date.now() * 0.001;
    const baseHue = this.randomStyleParams.baseHue;
    const cycleSpeed = this.randomStyleParams.cycleSpeed || 8;
    
    // Apply light performant filter for Style 1 (only occasionally for performance)
    if (this.randomStyleParams.filter && this.randomStyleParams.filter !== 'none' && Math.random() < 0.3) {
      ctx.filter = this.randomStyleParams.filter;
    }
    
    // Create dramatic rainbow cycling effect with theme-based base
    const hueCycle = Math.sin(time * cycleSpeed) * 30; // Reduced from 100 to 30 for more base color visibility
    const hueVariation = (Math.random() - 0.5) * 20 + hueCycle; // Reduced from 80 to 20
    const saturationVariation = (Math.random() - 0.5) * 15 + Math.sin(time * 3) * 10; // Reduced variations
    const lightnessVariation = (Math.random() - 0.5) * 15 + Math.sin(time * 2.5) * 8; // Reduced variations
    
    // Dramatic palette with theme-based cycling - more respect for randomized base
    const hue = (baseHue + hueVariation + 360) % 360;
    const saturation = Math.max(70, Math.min(100, this.randomStyleParams.saturation + saturationVariation));
    const lightness = Math.max(35, Math.min(75, this.randomStyleParams.lightness + lightnessVariation));
    
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    
    // ARTISTIC PEN PRESSURE SIMULATION
    // Simulate pressure based on touch size and thickness multiplier
    const pressure = Math.min(1.0, Math.max(0.3, (thicknessMultiplier * Math.max(width, _height)) / 50));
    const pressureIntensity = pressure * pressure; // Quadratic pressure response
    
    // Use global size system with pressure enhancement
    const baseMultiplier = 0.25 * (sizeMultipliers[currentSizeLevel] || 1.0);
    const baseSize = baseMultiplier * Math.max(width, _height);
    
    // Pressure affects size dramatically (like real pen pressure)
    const pressureSize = baseSize * (0.5 + pressureIntensity * 1.5); // 0.5x to 2x size range
    
    // Add artistic pen effects
    const sizeVariation = isWebApp ? 0.9 + Math.random() * 0.2 : 0.8 + Math.random() * 0.4;
    const pulseScale = 1 + Math.sin(Date.now() / 160) * 0.05;
    const enhancedSize = pressureSize * sizeVariation * pulseScale;
    
    // Report actual size to debugger
    if (typeof (window as any).reportActualSize === 'function') {
      (window as any).reportActualSize('Artistic Pen', currentSizeLevel, enhancedSize);
    }
    
    ctx.save();
    
    if (isEraserMode) {
      // Eraser mode - pressure sensitive
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, enhancedSize * 1.2, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Normal drawing mode - Artistic Pen with Splash Effects
      ctx.globalCompositeOperation = 'source-over';
      
      // Main pen stroke with pressure-sensitive opacity
      const strokeOpacity = 0.6 + pressureIntensity * 0.4; // 0.6 to 1.0 opacity based on pressure
      ctx.globalAlpha = strokeOpacity;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, enhancedSize, 0, 2 * Math.PI);
      ctx.fill();
      
      // Pressure-sensitive inner core (brighter when pressed harder)
      ctx.globalAlpha = strokeOpacity * 0.8;
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${Math.min(95, lightness + 20)}%)`;
      ctx.beginPath();
      ctx.arc(x, y, enhancedSize * 0.6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Ultra-optimized splash effects (half the splashes, more random)
      const splashChance = 0.025 + pressureIntensity * 0.05; // 2.5% to 7.5% chance (half the splashes)
      if (Math.random() < splashChance) {
        const splashCount = Math.floor(pressureIntensity * 0.8) + 1; // 1 splash only (half the count)
        
        for (let i = 0; i < splashCount; i++) {
          const splashDistance = enhancedSize * (0.5 + Math.random() * 5.0); // Much more random distances
          const splashAngle = Math.random() * Math.PI * 2; // Random angles
          const splashX = x + Math.cos(splashAngle) * splashDistance;
          const splashY = y + Math.sin(splashAngle) * splashDistance;
          const splashSize = enhancedSize * (0.1 + Math.random() * 0.9); // Much more random sizes
          
          // Simple splash color
          const splashColor = `hsl(${hue}, ${saturation}%, ${lightness + Math.random() * 10}%)`;
          
          ctx.globalAlpha = 0.4 * pressureIntensity; // Fixed opacity for performance
          ctx.fillStyle = splashColor;
          ctx.beginPath();
          ctx.arc(splashX, splashY, splashSize, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      
      // Simplified ink bleeding effect (reduced for performance)
      if (Math.random() < 0.1 + pressureIntensity * 0.15) { // Reduced chance
        const bleedSize = enhancedSize * (1.1 + Math.random() * 0.4); // Reduced size
        const bleedOpacity = 0.05 + pressureIntensity * 0.1; // Reduced opacity
        
        ctx.globalAlpha = bleedOpacity;
        ctx.fillStyle = `hsl(${hue}, ${saturation * 0.8}%, ${lightness * 0.9}%)`;
        ctx.beginPath();
        ctx.arc(x, y, bleedSize, 0, 2 * Math.PI);
        ctx.fill();
      }

    }
    
    ctx.restore();

  }

  generateRandomParameters(): void {
    // Simple, safe randomization - no loops that can freeze
    const hue = Math.floor(Math.random() * 360);
    const saturationChoices = [80, 85, 90, 95, 100];
    const saturation = saturationChoices[Math.floor(Math.random() * saturationChoices.length)]!;
    const lightnessChoices = [35, 40, 45, 50, 55, 60, 65];
    const lightness = lightnessChoices[Math.floor(Math.random() * lightnessChoices.length)]!;

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
      cycleSpeed: Math.random() * 8 + 3,
      filter: Math.random() < 0.3 ? 'hue-rotate(90deg) saturate(1.5)' : 'none',
    };
    
    console.log(`🎨 Style 1 NEW COLORS: baseHue=${hue}, saturation=${saturation}, lightness=${lightness}`);
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
