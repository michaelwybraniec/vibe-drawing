import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class Style2 implements DrawingStyle {
  name = '3D Sphere';
  description = 'Three-dimensional sphere effects with depth and lighting';
  
  private currentVariant = 0;
  private colorVariants = [
    { baseHue: 200, saturation: 85, lightness: 60, name: 'Deep Blue' },
    { baseHue: 15, saturation: 90, lightness: 55, name: 'Fire Orange' },
    { baseHue: 120, saturation: 80, lightness: 50, name: 'Emerald Green' },
    { baseHue: 300, saturation: 85, lightness: 65, name: 'Magenta Pink' },
    { baseHue: 60, saturation: 90, lightness: 70, name: 'Bright Yellow' }
  ];
  
  private styleParams = {
    sphereIntensity: 0.7,
    depthEffect: 0.8,
    lightingAngle: 45,
  };

  draw(
    ctx: CanvasRenderingContext2D,
    point: DrawingPoint,
    context: StyleContext
  ): void {
    const { x, y, width, height } = point;
    const { isEraserMode, thicknessMultiplier, currentSizeLevel, sizeMultipliers } = context;
    
    // 3D Sphere Effect
    const time = Date.now() * 0.001;
    const currentVariant = this.colorVariants[this.currentVariant]!;
    const baseHue = currentVariant.baseHue;
    
    // Use global size system
    const baseMultiplier = 0.4 * (sizeMultipliers[currentSizeLevel] || 1.0);
    const sphereSize = baseMultiplier * thicknessMultiplier * Math.max(width, height);
    
    // Create 3D lighting effect
    const lightingAngle = this.styleParams.lightingAngle;
    const lightX = Math.cos(lightingAngle * Math.PI / 180) * sphereSize;
    const lightY = Math.sin(lightingAngle * Math.PI / 180) * sphereSize;
    
    ctx.save();
    
    if (isEraserMode) {
      // Eraser mode
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x, y, sphereSize * 1.2, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Normal drawing mode - 3D Sphere
      ctx.globalCompositeOperation = 'source-over';
      
      // Create radial gradient for 3D sphere effect
      const gradient = ctx.createRadialGradient(
        x - lightX * 0.3, y - lightY * 0.3, 0,
        x, y, sphereSize
      );
      
      const hue = (baseHue + Math.sin(time * 2) * 30) % 360;
      const saturation = currentVariant.saturation;
      const lightness = currentVariant.lightness;
      
      // Light side (highlight)
      gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${Math.min(95, lightness + 30)}%)`);
      // Mid-tone
      gradient.addColorStop(0.6, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
      // Shadow side
      gradient.addColorStop(1, `hsl(${hue}, ${saturation}%, ${Math.max(20, lightness - 40)}%)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, sphereSize, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add specular highlight
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, 95%)`;
      ctx.beginPath();
      ctx.arc(x - lightX * 0.2, y - lightY * 0.2, sphereSize * 0.2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add depth shadow
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${Math.max(10, lightness - 50)}%)`;
      ctx.beginPath();
      ctx.arc(x + lightX * 0.3, y + lightY * 0.3, sphereSize * 0.8, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    ctx.restore();
  }

  nextColorVariant(): void {
    this.currentVariant = (this.currentVariant + 1) % this.colorVariants.length;
  }

  resetToDefault(): void {
    this.currentVariant = 0;
  }
}
