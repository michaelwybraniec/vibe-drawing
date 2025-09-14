import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class Style6 implements DrawingStyle {
  name = 'Holographic Prism';
  description = 'Holographic effects with prismatic light refraction';
  
  private randomStyleParams = {
    baseHue: 0,
    saturation: 100,
    lightness: 50,
    prismIntensity: 0.8,
    refractionAngle: 30,
    hologramOpacity: 0.7,
  };

  draw(
    ctx: CanvasRenderingContext2D,
    point: DrawingPoint,
    context: StyleContext
  ): void {
    const { x, y, width, height } = point;
    const { isEraserMode, thicknessMultiplier, currentSizeLevel, sizeMultipliers } = context;
    
    // Holographic Prism Effect
    const time = Date.now() * 0.001;
    const baseHue = this.randomStyleParams.baseHue;
    
    // Use global size system
    const baseMultiplier = 0.4 * (sizeMultipliers[currentSizeLevel] || 1.0);
    const prismSize = baseMultiplier * thicknessMultiplier * Math.max(width, height);
    
    ctx.save();
    
    if (isEraserMode) {
      // Eraser mode
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x, y, prismSize * 1.2, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Normal drawing mode - Holographic Prism
      ctx.globalCompositeOperation = 'source-over';
      
      // Create prismatic color spectrum
      const hue1 = (baseHue + time * 50) % 360;
      const hue2 = (baseHue + 120 + time * 50) % 360;
      const hue3 = (baseHue + 240 + time * 50) % 360;
      
      const saturation = this.randomStyleParams.saturation;
      const lightness = this.randomStyleParams.lightness;
      
      // Main holographic circle with rainbow gradient
      const gradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, prismSize
      );
      
      gradient.addColorStop(0, `hsl(${hue1}, ${saturation}%, ${lightness + 20}%)`);
      gradient.addColorStop(0.33, `hsl(${hue2}, ${saturation}%, ${lightness}%)`);
      gradient.addColorStop(0.66, `hsl(${hue3}, ${saturation}%, ${lightness}%)`);
      gradient.addColorStop(1, `hsl(${hue1}, ${saturation}%, ${lightness - 20}%)`);
      
      ctx.globalAlpha = this.randomStyleParams.hologramOpacity;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, prismSize, 0, 2 * Math.PI);
      ctx.fill();
      
      // Prismatic light rays
      if (Math.random() < this.randomStyleParams.prismIntensity) {
        const rayCount = 6;
        const rayAngle = (Math.PI * 2) / rayCount;
        
        for (let i = 0; i < rayCount; i++) {
          const rayHue = (baseHue + i * 60 + time * 100) % 360;
          const rayAngleOffset = i * rayAngle + time * 2;
          const rayLength = prismSize * (1.2 + Math.random() * 0.8);
          
          const rayEndX = x + Math.cos(rayAngleOffset) * rayLength;
          const rayEndY = y + Math.sin(rayAngleOffset) * rayLength;
          
          ctx.globalAlpha = 0.6;
          ctx.strokeStyle = `hsl(${rayHue}, ${saturation}%, ${lightness + 30}%)`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(rayEndX, rayEndY);
          ctx.stroke();
        }
      }
      
      // Holographic interference patterns
      if (Math.random() < 0.4) {
        ctx.globalAlpha = 0.3;
        
        for (let i = 0; i < 8; i++) {
          const interferenceX = x + (Math.random() - 0.5) * prismSize * 1.5;
          const interferenceY = y + (Math.random() - 0.5) * prismSize * 1.5;
          const interferenceSize = prismSize * (0.1 + Math.random() * 0.3);
          const interferenceHue = (baseHue + i * 45 + time * 80) % 360;
          
          ctx.fillStyle = `hsl(${interferenceHue}, ${saturation}%, ${lightness + 40}%)`;
          ctx.beginPath();
          ctx.arc(interferenceX, interferenceY, interferenceSize, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      
      // Spectral highlights
      if (Math.random() < 0.3) {
        ctx.globalAlpha = 0.8;
        
        // Red highlight
        ctx.fillStyle = `hsl(0, ${saturation}%, ${lightness + 40}%)`;
        ctx.beginPath();
        ctx.arc(x - prismSize * 0.3, y - prismSize * 0.3, prismSize * 0.15, 0, 2 * Math.PI);
        ctx.fill();
        
        // Green highlight
        ctx.fillStyle = `hsl(120, ${saturation}%, ${lightness + 40}%)`;
        ctx.beginPath();
        ctx.arc(x, y - prismSize * 0.4, prismSize * 0.15, 0, 2 * Math.PI);
        ctx.fill();
        
        // Blue highlight
        ctx.fillStyle = `hsl(240, ${saturation}%, ${lightness + 40}%)`;
        ctx.beginPath();
        ctx.arc(x + prismSize * 0.3, y - prismSize * 0.3, prismSize * 0.15, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      // Holographic shimmer effect
      if (Math.random() < 0.2) {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = `hsl(${(baseHue + time * 200) % 360}, ${saturation}%, 95%)`;
        
        // Shimmer particles
        for (let i = 0; i < 5; i++) {
          const shimmerX = x + (Math.random() - 0.5) * prismSize * 2;
          const shimmerY = y + (Math.random() - 0.5) * prismSize * 2;
          const shimmerSize = prismSize * (0.05 + Math.random() * 0.1);
          
          ctx.beginPath();
          ctx.arc(shimmerX, shimmerY, shimmerSize, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
    
    ctx.restore();
  }

  generateRandomParameters(): void {
    this.randomStyleParams = {
      baseHue: Math.floor(Math.random() * 360),
      saturation: 90 + Math.random() * 10,
      lightness: 40 + Math.random() * 40,
      prismIntensity: 0.5 + Math.random() * 0.5,
      refractionAngle: 15 + Math.random() * 45,
      hologramOpacity: 0.5 + Math.random() * 0.4,
    };
    console.log(`🌈 Style 6 NEW COLORS: baseHue=${this.randomStyleParams.baseHue}, prismIntensity=${this.randomStyleParams.prismIntensity}`);
  }

  resetToDefault(): void {
    this.randomStyleParams = {
      baseHue: 0,
      saturation: 100,
      lightness: 50,
      prismIntensity: 0.8,
      refractionAngle: 30,
      hologramOpacity: 0.7,
    };
  }
}
