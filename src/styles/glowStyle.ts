import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class GlowStyle implements DrawingStyle {
  name = 'Glow';
  description = 'Bright neon strokes with glowing effects';
  icon = '6';

  private currentVariant = 0;
  private colorVariants = [
    { 
      baseHue: 216, baseSaturation: 90, baseLightness: 50, name: 'Ocean Blue',
      trailHue: 200, trailSaturation: 85, trailLightness: 65 // Complementary cyan
    },
    { 
      baseHue: 0, baseSaturation: 85, baseLightness: 55, name: 'Crimson Red',
      trailHue: 15, trailSaturation: 90, trailLightness: 70 // Orange trail
    },
    { 
      baseHue: 120, baseSaturation: 80, baseLightness: 50, name: 'Forest Green',
      trailHue: 100, trailSaturation: 85, trailLightness: 65 // Lime green
    },
    { 
      baseHue: 45, baseSaturation: 90, baseLightness: 60, name: 'Golden Yellow',
      trailHue: 30, trailSaturation: 95, trailLightness: 75 // Bright orange
    },
    { 
      baseHue: 280, baseSaturation: 85, baseLightness: 55, name: 'Royal Purple',
      trailHue: 300, trailSaturation: 90, trailLightness: 70 // Magenta
    }
  ];

  draw(ctx: CanvasRenderingContext2D, point: DrawingPoint, context: StyleContext): void {
    // Enhanced glow draw implementation using common size system
    const { x, y, width, height } = point;
    const { isEraserMode } = context;
    
    ctx.save();
    if (isEraserMode) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
    } else {
      ctx.globalCompositeOperation = 'screen';
      // Use common size system for consistent sizing with 3x thicker lines
      const sizeMultiplier = this.calculateSizeMultiplier(point, context);
      const baseSize = Math.max(width, height) * sizeMultiplier;
      // Make it 3x thicker for single point draws
      const finalSize = baseSize * 0.9;
      this.drawGlowPoint(ctx, x, y, finalSize);
    }
    ctx.restore();
  }

  private lastSizeMultiplier = 0.25;
  private sizeSmoothingFactor = 0.15;
  private glowTrails: Array<{
    x: number;
    y: number;
    size: number;
    color: string;
    life: number;
    maxLife: number;
  }> = [];
  
  // Speed tracking for thickness variation
  private speedHistory: number[] = [];
  private lastSpeedUpdate = 0;
  private currentSpeedFactor = 1.0;
  
  // Direction tracking for glow effects
  private lastDirection = { x: 0, y: 0 };
  private directionHistory: Array<{ x: number, y: number, t: number }> = [];

  onStart(_point: DrawingPoint, _context: StyleContext): void {
    this.glowTrails = [];
    this.speedHistory = [];
    this.currentSpeedFactor = 1.0;
    this.directionHistory = [];
    this.lastDirection = { x: 0, y: 0 };
  }

  onMove(points: DrawingPoint[], context: StyleContext): void {
    const { ctx, isEraserMode } = context;

    if (points.length < 2) return;

    ctx.save();
    ctx.globalCompositeOperation = isEraserMode ? 'destination-out' : 'screen';

    // Update speed factor and direction every 100ms for performance
    const now = Date.now();
    if (now - this.lastSpeedUpdate > 100) {
      this.updateSpeedFactor(points);
      this.updateDirection(points);
      this.lastSpeedUpdate = now;
    }

    // Draw only every 3rd point for performance, but with interpolation
    const step = Math.max(1, Math.floor(points.length / 20)); // Limit to 20 points max
    
    for (let i = step; i < points.length; i += step) {
      const point = points[i]!;
      const prevPoint = points[i - step] || points[i - 1]!;
      
      if (!prevPoint) continue;

      // Calculate size multiplier
      const sizeMultiplier = this.calculateSizeMultiplier(point, context);

      // Use current speed factor (updated in intervals) - 3x thicker lines
      const sizeVariation = 0.3 + Math.random() * 0.15; // Increased variation for thicker lines
      const finalSize = Math.max(point.width || 1, point.height || 1) * sizeVariation * sizeMultiplier * this.currentSpeedFactor * 3;

      if (isEraserMode) {
        // Simple eraser for performance
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#151E35';
        ctx.beginPath();
        ctx.arc(point.x, point.y, finalSize, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        // Calculate current direction for this point
        const currentDirection = this.calculateCurrentDirection(point, prevPoint);
        
        // Direction-aware glow drawing
        this.drawDirectionalGlow(ctx, point.x, point.y, finalSize, currentDirection);

        // Add trail only occasionally for performance with distinct trail color
        if (Math.random() < 0.3) {
          const currentVariant = this.colorVariants[this.currentVariant]!;
          const trailColor = `hsl(${currentVariant.trailHue}, ${currentVariant.trailSaturation}%, ${currentVariant.trailLightness}%)`;
          
          this.glowTrails.push({
            x: point.x,
            y: point.y,
            size: finalSize,
            color: trailColor,
            life: 1.0,
            maxLife: 1.0,
          });
        }
      }
    }

    ctx.restore();
  }

  onEnd(_context: StyleContext): void {
  }

  onClear(_context: StyleContext): void {
    this.glowTrails = [];
  }

  animate(context: StyleContext): void {
    const { ctx } = context;

    // Animate glow trails with enhanced effects
    this.glowTrails = this.glowTrails.filter((trail) => {
      trail.life -= 0.02; // Slower fade for more realistic glow

      if (trail.life > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Enhanced trail glow with multiple layers
        const fadeAlpha = trail.life * 0.6;
        
        // Outer trail glow
        ctx.globalAlpha = fadeAlpha * 0.3;
        ctx.fillStyle = trail.color;
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, trail.size * 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Inner trail glow
        ctx.globalAlpha = fadeAlpha * 0.7;
        ctx.fillStyle = trail.color;
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, trail.size * 1.5, 0, 2 * Math.PI);
        ctx.fill();
        
        // Trail center
        ctx.globalAlpha = fadeAlpha;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, trail.size * 0.4, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
        return true;
      }
      return false;
    });
  }

  private calculateSizeMultiplier(point: DrawingPoint, context: StyleContext): number {
    const { isWebApp, currentSizeLevel, sizeMultipliers, thicknessMultiplier } = context;
    const touchArea = Math.sqrt((point.width || 1) * (point.height || 1));

    if (isWebApp) {
      const baseMultiplier = 0.16 * (sizeMultipliers[currentSizeLevel] || 1.0); // 3x larger base size
      return baseMultiplier * thicknessMultiplier;
    } else {
      const minArea = 5;
      const maxArea = 100;
      const normalizedArea = Math.max(0, Math.min(1, (touchArea - minArea) / (maxArea - minArea)));

      let baseMultiplier;
      if ((point.width || 0) === 0 || (point.height || 0) === 0) {
        baseMultiplier = 0.2; // 3x larger
      } else {
        baseMultiplier = 0.1 + normalizedArea * 0.18; // 3x larger
      }

      const sizeVariation = 0.95 + Math.random() * 0.1;
      const smoothedMultiplier =
        this.lastSizeMultiplier * (1 - this.sizeSmoothingFactor) +
        baseMultiplier * sizeVariation * this.sizeSmoothingFactor;
      this.lastSizeMultiplier = smoothedMultiplier;

      return smoothedMultiplier * (sizeMultipliers[currentSizeLevel] || 1.0) * thicknessMultiplier;
    }
  }

  private drawGlowPoint(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    const currentVariant = this.colorVariants[this.currentVariant]!;
    const baseHue = currentVariant.baseHue;
    const saturation = currentVariant.baseSaturation;
    const lightness = currentVariant.baseLightness;
    
    // Create thinner glow layers for more precise drawing
    const glowLayers = [
      { radius: size * 2.5, alpha: 0.08, hue: baseHue, lightness: Math.min(95, lightness + 30) }, // Outer aura
      { radius: size * 2, alpha: 0.15, hue: baseHue, lightness: Math.min(95, lightness + 20) }, // Outer glow
      { radius: size * 1.5, alpha: 0.3, hue: baseHue, lightness: Math.min(95, lightness + 10) }, // Mid glow
      { radius: size * 1, alpha: 0.5, hue: baseHue, lightness: lightness }, // Inner glow
      { radius: size * 0.6, alpha: 0.7, hue: baseHue, lightness: Math.max(20, lightness - 10) }, // Core glow
      { radius: size * 0.2, alpha: 1.0, hue: baseHue, lightness: 100 } // Bright center
    ];
    
    // Draw each glow layer
    glowLayers.forEach((layer, index) => {
      ctx.globalAlpha = layer.alpha;
      
      // Create radial gradient for each layer
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, layer.radius);
      
      if (index === 0) {
        // Outer aura - very soft
        gradient.addColorStop(0, `hsla(${layer.hue}, ${saturation}%, ${layer.lightness}%, 0)`);
        gradient.addColorStop(0.7, `hsla(${layer.hue}, ${saturation}%, ${layer.lightness}%, 0.1)`);
        gradient.addColorStop(1, `hsla(${layer.hue}, ${saturation}%, ${layer.lightness}%, 0)`);
      } else if (index === glowLayers.length - 1) {
        // Bright center - solid
        gradient.addColorStop(0, `hsl(${layer.hue}, ${saturation}%, ${layer.lightness}%)`);
        gradient.addColorStop(1, `hsl(${layer.hue}, ${saturation}%, ${layer.lightness}%)`);
      } else {
        // Mid layers - gradient from center to edge
        gradient.addColorStop(0, `hsla(${layer.hue}, ${saturation}%, ${layer.lightness}%, ${layer.alpha})`);
        gradient.addColorStop(0.5, `hsla(${layer.hue}, ${saturation}%, ${layer.lightness}%, ${layer.alpha * 0.7})`);
        gradient.addColorStop(1, `hsla(${layer.hue}, ${saturation}%, ${layer.lightness}%, 0)`);
      }
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, layer.radius, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Add sparkle effect for extra realism
    this.addSparkleEffect(ctx, x, y, size);
  }

  private addSparkleEffect(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    const sparkleCount = 1 + Math.floor(Math.random() * 2); // Fewer sparkles for thinner glow
    
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (Math.PI * 2 * i) / sparkleCount + Math.random() * 0.5;
      const distance = size * (0.6 + Math.random() * 0.3); // Closer sparkles
      const sparkleX = x + Math.cos(angle) * distance;
      const sparkleY = y + Math.sin(angle) * distance;
      const sparkleSize = size * 0.05 * (0.5 + Math.random() * 0.5); // Smaller sparkles
      
      // Create sparkle gradient
      const sparkleGradient = ctx.createRadialGradient(
        sparkleX, sparkleY, 0,
        sparkleX, sparkleY, sparkleSize
      );
      sparkleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      sparkleGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
      sparkleGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = sparkleGradient;
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, sparkleSize, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  private updateSpeedFactor(points: DrawingPoint[]): void {
    if (points.length < 3) return;
    
    // Calculate average speed from recent points
    const recentPoints = points.slice(-5); // Last 5 points
    let totalSpeed = 0;
    let speedCount = 0;
    
    for (let i = 1; i < recentPoints.length; i++) {
      const point = recentPoints[i]!;
      const prevPoint = recentPoints[i - 1]!;
      
      const dx = point.x - prevPoint.x;
      const dy = point.y - prevPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const timeDelta = ((point.t || 0) - (prevPoint.t || 0)) || 16;
      
      if (timeDelta > 0) {
        const speed = distance / timeDelta;
        totalSpeed += speed;
        speedCount++;
      }
    }
    
    if (speedCount > 0) {
      const avgSpeed = totalSpeed / speedCount;
      // Speed-based thickness: faster = thinner, slower = thicker
      this.currentSpeedFactor = Math.max(0.3, Math.min(1.0, 1.0 - avgSpeed * 0.02));
    }
  }

  private updateDirection(points: DrawingPoint[]): void {
    if (points.length < 2) return;
    
    // Calculate average direction from recent points
    const recentPoints = points.slice(-3); // Last 3 points
    let totalDx = 0;
    let totalDy = 0;
    let directionCount = 0;
    
    for (let i = 1; i < recentPoints.length; i++) {
      const point = recentPoints[i]!;
      const prevPoint = recentPoints[i - 1]!;
      
      const dx = point.x - prevPoint.x;
      const dy = point.y - prevPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        totalDx += dx / distance; // Normalize
        totalDy += dy / distance;
        directionCount++;
      }
    }
    
    if (directionCount > 0) {
      this.lastDirection = {
        x: totalDx / directionCount,
        y: totalDy / directionCount
      };
    }
  }

  private calculateCurrentDirection(point: DrawingPoint, prevPoint: DrawingPoint): { x: number, y: number } {
    const dx = point.x - prevPoint.x;
    const dy = point.y - prevPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      return {
        x: dx / distance,
        y: dy / distance
      };
    }
    
    return this.lastDirection;
  }

  private drawDirectionalGlow(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, direction: { x: number, y: number }): void {
    const currentVariant = this.colorVariants[this.currentVariant]!;
    const baseHue = currentVariant.baseHue;
    const saturation = currentVariant.baseSaturation;
    const lightness = currentVariant.baseLightness;
    const trailHue = currentVariant.trailHue;
    const trailSaturation = currentVariant.trailSaturation;
    const trailLightness = currentVariant.trailLightness;
    
    // Calculate direction-based offsets for asymmetric glow
    const directionStrength = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    const offsetX = direction.x * size * 0.3 * directionStrength;
    const offsetY = direction.y * size * 0.3 * directionStrength;
    
    // Create directional glow layers with main color
    const glowLayers = [
      { 
        radius: size * 2, 
        alpha: 0.1, 
        color: `hsla(${baseHue}, ${saturation}%, ${Math.min(95, lightness + 20)}%, 0.1)`,
        offsetX: offsetX * 0.5,
        offsetY: offsetY * 0.5
      },
      { 
        radius: size * 1.2, 
        alpha: 0.3, 
        color: `hsla(${baseHue}, ${saturation}%, ${lightness}%, 0.3)`,
        offsetX: offsetX * 0.3,
        offsetY: offsetY * 0.3
      },
      { 
        radius: size * 0.6, 
        alpha: 0.6, 
        color: `hsla(${baseHue}, ${saturation}%, ${Math.max(20, lightness - 10)}%, 0.6)`,
        offsetX: offsetX * 0.1,
        offsetY: offsetY * 0.1
      },
      { 
        radius: size * 0.2, 
        alpha: 1.0, 
        color: '#FFFFFF',
        offsetX: 0,
        offsetY: 0
      }
    ];
    
    // Draw each layer with direction-based positioning
    glowLayers.forEach((layer) => {
      ctx.globalAlpha = layer.alpha;
      ctx.fillStyle = layer.color;
      ctx.beginPath();
      ctx.arc(x + layer.offsetX, y + layer.offsetY, layer.radius, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Add directional trail effect with distinct trail color
    if (directionStrength > 0.1) {
      this.drawDirectionalTrail(ctx, x, y, size, direction, trailHue, trailSaturation, trailLightness);
    }
  }

  private drawDirectionalTrail(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, direction: { x: number, y: number }, trailHue: number, trailSaturation: number, trailLightness: number): void {
    // Create a trailing glow in the opposite direction with distinct trail color
    const trailLength = size * 0.8;
    const trailX = x - direction.x * trailLength;
    const trailY = y - direction.y * trailLength;
    
    // Trail glow with distinct color
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = `hsla(${trailHue}, ${trailSaturation}%, ${trailLightness}%, 0.25)`;
    ctx.beginPath();
    ctx.arc(trailX, trailY, size * 0.5, 0, 2 * Math.PI);
    ctx.fill();
    
    // Trail center with brighter trail color
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = `hsla(${trailHue}, ${trailSaturation}%, ${Math.min(95, trailLightness + 15)}%, 0.5)`;
    ctx.beginPath();
    ctx.arc(trailX, trailY, size * 0.15, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add a small white center for extra contrast
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(trailX, trailY, size * 0.05, 0, 2 * Math.PI);
    ctx.fill();
  }

  private drawOptimizedGlow(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    const currentVariant = this.colorVariants[this.currentVariant]!;
    const baseHue = currentVariant.baseHue;
    const saturation = currentVariant.baseSaturation;
    const lightness = currentVariant.baseLightness;
    
    // Simplified glow layers for performance
    const glowLayers = [
      { radius: size * 2, alpha: 0.1, color: `hsla(${baseHue}, ${saturation}%, ${Math.min(95, lightness + 20)}%, 0.1)` },
      { radius: size * 1.2, alpha: 0.3, color: `hsla(${baseHue}, ${saturation}%, ${lightness}%, 0.3)` },
      { radius: size * 0.6, alpha: 0.6, color: `hsla(${baseHue}, ${saturation}%, ${Math.max(20, lightness - 10)}%, 0.6)` },
      { radius: size * 0.2, alpha: 1.0, color: '#FFFFFF' }
    ];
    
    // Draw each layer
    glowLayers.forEach((layer) => {
      ctx.globalAlpha = layer.alpha;
      ctx.fillStyle = layer.color;
      ctx.beginPath();
      ctx.arc(x, y, layer.radius, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  private getGlowColor(multiplier: number): string {
    const currentVariant = this.colorVariants[this.currentVariant]!;
    const baseHue = currentVariant.baseHue;
    const saturation = currentVariant.baseSaturation;
    const lightness = currentVariant.baseLightness;
    
    // Add some variation based on multiplier
    const hueVariation = Math.sin(multiplier * Math.PI) * 30;
    const finalHue = (baseHue + hueVariation + 360) % 360;
    
    return `hsl(${finalHue}, ${saturation}%, ${lightness}%)`;
  }

  nextColorVariant(): void {
    this.currentVariant = (this.currentVariant + 1) % this.colorVariants.length;
  }

  resetToDefault(): void {
    this.currentVariant = 0;
  }

  private addSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = color;

    // Create sparkle effect
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const sparkleX = x + Math.cos(angle) * 10;
      const sparkleY = y + Math.sin(angle) * 10;

      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.restore();
  }
}
