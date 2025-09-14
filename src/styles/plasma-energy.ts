import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class Style7 implements DrawingStyle {
  name = 'Plasma Energy';
  description = 'Swirling plasma energy with dynamic particles';
  
  private currentVariant = 0;
  private colorVariants = [
    { baseHue: 280, plasmaHue: 280, saturation: 100, plasmaSaturation: 100, lightness: 50, plasmaLightness: 70, name: 'Purple Plasma' },
    { baseHue: 0, plasmaHue: 15, saturation: 100, plasmaSaturation: 95, lightness: 55, plasmaLightness: 75, name: 'Red Energy' },
    { baseHue: 120, plasmaHue: 140, saturation: 100, plasmaSaturation: 90, lightness: 50, plasmaLightness: 70, name: 'Green Plasma' },
    { baseHue: 200, plasmaHue: 220, saturation: 100, plasmaSaturation: 95, lightness: 60, plasmaLightness: 80, name: 'Blue Energy' },
    { baseHue: 60, plasmaHue: 80, saturation: 100, plasmaSaturation: 100, lightness: 65, plasmaLightness: 85, name: 'Yellow Plasma' }
  ];
  
  private styleParams = {
    swirlSpeed: 0.01,
    particleCount: 4,
  };

  private plasmaTrail: Array<{ x: number; y: number; size: number; color: string; timestamp: number; angle: number }> = [];
  private lastPlasmaTime = 0;

  draw(
    ctx: CanvasRenderingContext2D,
    point: DrawingPoint,
    context: StyleContext
  ): void {
    const { x, y, width, height } = point;
    const { isEraserMode, thicknessMultiplier, currentSizeLevel, sizeMultipliers } = context;
    
    // PLASMA ENERGY EFFECT 🌌
    const time = Date.now();
    // Use global size system like all other styles
    const baseMultiplier = 0.5 * (sizeMultipliers[currentSizeLevel] || 1.0);
    const plasmaSize = baseMultiplier * thicknessMultiplier * Math.max(width, height);

    ctx.save();

    // Plasma colors with swirling effect - use color variants
    const currentVariant = this.colorVariants[this.currentVariant]!;
    const baseHue = currentVariant.baseHue;
    const plasmaHue = currentVariant.plasmaHue;
    const swirlSpeed = this.styleParams.swirlSpeed || 0.01;
    const particleCount = this.styleParams.particleCount || 4;

    // Create plasma swirling effect with multiple frequencies
    const swirl1 = Math.sin(time * swirlSpeed) * 0.4 + 0.6; // Main swirl
    const swirl2 = Math.sin(time * swirlSpeed * 1.5) * 0.3 + 0.7; // Secondary swirl
    const swirl3 = Math.sin(time * swirlSpeed * 0.7) * 0.2 + 0.8; // Tertiary swirl
    const combinedSwirl = (swirl1 + swirl2 + swirl3) / 3;

    // Plasma colors that swirl - different colors for different parts
    const plasmaColor = `hsl(${baseHue}, ${currentVariant.saturation}%, ${currentVariant.lightness + combinedSwirl * 30}%)`;
    // const particleColor = `hsl(${plasmaHue}, ${currentVariant.plasmaSaturation}%, ${currentVariant.plasmaLightness + combinedSwirl * 20}%)`;

    // Plasma movement with swirling
    const plasmaPulse = Math.sin(time / 200) * 0.4 + 0.6;
    const animatedSize = plasmaSize * plasmaPulse * combinedSwirl;

    // Add to trail every 60ms for plasma energy
    if (time - this.lastPlasmaTime > 60) {
      this.plasmaTrail.push({
        x,
        y,
        size: animatedSize,
        color: plasmaColor,
        timestamp: time,
        angle: Math.random() * Math.PI * 2,
      });
      this.lastPlasmaTime = time;

      // Keep only last 6 points for plasma trail
      if (this.plasmaTrail.length > 6) {
        this.plasmaTrail.shift();
      }
    }

    if (isEraserMode) {
      // Eraser mode - match the plasma effect size
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = plasmaColor;
      ctx.beginPath();
      ctx.arc(x, y, animatedSize * 1.3, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Normal drawing mode
      ctx.globalCompositeOperation = 'source-over';

      // Create swirling plasma particles
      const swirlAngle = time * swirlSpeed;
      const particleRadius = animatedSize * 0.8;
      
      for (let i = 0; i < particleCount; i++) {
        const particleAngle = swirlAngle + (i * Math.PI * 2) / particleCount;
        const particleX = x + Math.cos(particleAngle) * particleRadius * (0.3 + i * 0.2);
        const particleY = y + Math.sin(particleAngle) * particleRadius * (0.3 + i * 0.2);
        const particleSize = animatedSize * (0.4 + i * 0.15);
        
        // Plasma particle with gradient
        const gradient = ctx.createRadialGradient(
          particleX - particleSize * 0.3, particleY - particleSize * 0.3, 0,
          particleX, particleY, particleSize
        );
        
        const particleHue = (plasmaHue + i * 40) % 360;
        gradient.addColorStop(0, `hsl(${particleHue}, ${currentVariant.plasmaSaturation}%, ${80 + combinedSwirl * 15}%)`);
        gradient.addColorStop(0.7, `hsl(${particleHue}, ${currentVariant.plasmaSaturation - 20}%, ${60 + combinedSwirl * 20}%)`);
        gradient.addColorStop(1, `hsl(${particleHue}, ${currentVariant.plasmaSaturation - 40}%, ${40 + combinedSwirl * 25}%)`);
        
        ctx.globalAlpha = (0.8 - i * 0.1) * combinedSwirl;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particleX, particleY, particleSize, 0, 2 * Math.PI);
        ctx.fill();
        
        // Particle highlight
        ctx.globalAlpha = 0.6 * combinedSwirl;
        ctx.fillStyle = `hsl(${particleHue}, 100%, 90%)`;
        ctx.beginPath();
        ctx.arc(particleX - particleSize * 0.3, particleY - particleSize * 0.3, particleSize * 0.3, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Main plasma core
      const coreCutChance = 0.15; // 15% chance main core is cut
      if (Math.random() > coreCutChance) {
        // Main plasma core with gradient
        const coreGradient = ctx.createRadialGradient(
          x - animatedSize * 0.3, y - animatedSize * 0.3, 0,
          x, y, animatedSize * 0.8
        );
        
        coreGradient.addColorStop(0, `hsl(${baseHue}, ${currentVariant.saturation}%, ${80 + combinedSwirl * 15}%)`);
        coreGradient.addColorStop(0.5, `hsl(${baseHue}, ${currentVariant.saturation - 10}%, ${65 + combinedSwirl * 20}%)`);
        coreGradient.addColorStop(1, `hsl(${baseHue}, ${currentVariant.saturation - 20}%, ${45 + combinedSwirl * 25}%)`);
        
        ctx.globalAlpha = 0.9 * combinedSwirl;
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(x, y, animatedSize * 0.8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Core highlight
        ctx.globalAlpha = 0.7 * combinedSwirl;
        ctx.fillStyle = `hsl(${baseHue}, 100%, 95%)`;
        ctx.beginPath();
        ctx.arc(x - animatedSize * 0.2, y - animatedSize * 0.2, animatedSize * 0.25, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Draw swirling plasma trail
      this.plasmaTrail.slice(-4).forEach((point, _index) => {
        const age = time - point.timestamp;
        if (age < 500) {
          const fadeProgress = age / 500;
          const alpha = (1 - fadeProgress) * combinedSwirl * 0.6;
          const size = point.size * (1 - fadeProgress * 0.5);

          // Add swirling to trail points
          const trailSwirl = Math.sin((time - point.timestamp) * swirlSpeed * 2) * 0.3 + 0.7;

          ctx.globalAlpha = alpha * trailSwirl;
          ctx.fillStyle = point.color;
          ctx.beginPath();
          ctx.arc(point.x, point.y, size, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      // Add occasional plasma sparkles
      if (Math.random() < 0.2) {
        ctx.globalAlpha = 0.8 * combinedSwirl;
        ctx.fillStyle = `hsl(${plasmaHue + 60}, 100%, 90%)`;
        ctx.beginPath();
        ctx.arc(
          x + (Math.random() - 0.5) * plasmaSize * 1.5,
          y + (Math.random() - 0.5) * plasmaSize * 1.5,
          2,
          0,
          2 * Math.PI,
        );
        ctx.fill();
      }
    }

    // Clean up old trail points
    this.plasmaTrail = this.plasmaTrail.filter((point) => time - point.timestamp < 700);

    ctx.restore();
  }

  nextColorVariant(): void {
    this.currentVariant = (this.currentVariant + 1) % this.colorVariants.length;
  }

  resetToDefault(): void {
    this.currentVariant = 0;
  }
}