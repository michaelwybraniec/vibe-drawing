import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

export class WatercolorStyle implements DrawingStyle {
  name = 'Watercolor';
  description = 'Soft watercolor brush strokes with color blending';
  icon = '🎨';
  
  private lastSizeMultiplier = 0.25;
  private sizeSmoothingFactor = 0.15;
  private brushStrokes: Array<{
    x: number;
    y: number;
    size: number;
    color: string;
    opacity: number;
  }> = [];
  
  onStart(point: DrawingPoint, context: StyleContext): void {
    console.log('🎨 Watercolor style started');
    this.brushStrokes = [];
  }
  
  onMove(points: DrawingPoint[], context: StyleContext): void {
    const { ctx, isEraserMode, thicknessMultiplier, currentSizeLevel, sizeMultipliers, isWebApp } = context;
    
    if (points.length < 2) return;
    
    ctx.save();
    ctx.globalCompositeOperation = isEraserMode ? 'destination-out' : 'multiply';
    
    // Draw each point as a watercolor brush stroke
    points.forEach((point, index) => {
      if (index === 0) return; // Skip first point
      
      const prevPoint = points[index - 1];
      const t = (point.t - prevPoint.t) / 16; // Normalize time
      
      if (t <= 0) return;
      
      // Calculate size multiplier
      const sizeMultiplier = this.calculateSizeMultiplier(point, context);
      
      // Interpolate position
      const dotX = prevPoint.x + (point.x - prevPoint.x) * t;
      const dotY = prevPoint.y + (point.y - prevPoint.y) * t;
      
      // Calculate final size
      const touchWidth = point.width || 1;
      const touchHeight = point.height || 1;
      const sizeVariation = 0.8 + Math.random() * 0.4; // More variation for watercolor
      const finalSize = (touchWidth / 2) * sizeVariation * sizeMultiplier;
      
      if (isEraserMode) {
        // Eraser: create transparent areas
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = 'rgba(21, 30, 53, 0.3)';
      } else {
        // Watercolor: create soft, blended strokes
        const colorT = Math.sin(t * Math.PI) * 0.15;
        const colorMultiplier = 1 + colorT;
        const baseColor = this.getWatercolorColor(colorMultiplier);
        
        // Create multiple brush strokes for watercolor effect
        for (let i = 0; i < 3; i++) {
          const offsetX = (Math.random() - 0.5) * finalSize * 0.5;
          const offsetY = (Math.random() - 0.5) * finalSize * 0.5;
          const strokeSize = finalSize * (0.7 + Math.random() * 0.6);
          const opacity = 0.1 + Math.random() * 0.2;
          
          ctx.globalAlpha = opacity;
          ctx.fillStyle = baseColor;
          
          // Draw soft circular brush stroke
          ctx.beginPath();
          ctx.arc(
            dotX + offsetX,
            dotY + offsetY,
            strokeSize,
            0,
            2 * Math.PI
          );
          ctx.fill();
        }
        
        // Store brush stroke for blending
        this.brushStrokes.push({
          x: dotX,
          y: dotY,
          size: finalSize,
          color: baseColor,
          opacity: 0.3
        });
      }
    });
    
    ctx.restore();
  }
  
  onEnd(context: StyleContext): void {
    console.log('🎨 Watercolor style ended');
  }
  
  onClear(context: StyleContext): void {
    this.brushStrokes = [];
  }
  
  private calculateSizeMultiplier(point: DrawingPoint, context: StyleContext): number {
    const { isWebApp, currentSizeLevel, sizeMultipliers, thicknessMultiplier } = context;
    const touchArea = Math.sqrt((point.width || 1) * (point.height || 1));
    
    if (isWebApp) {
      const baseMultiplier = 0.2 * (sizeMultipliers[currentSizeLevel] || 1.0);
      return baseMultiplier * thicknessMultiplier;
    } else {
      const minArea = 5;
      const maxArea = 100;
      const normalizedArea = Math.max(0, Math.min(1, (touchArea - minArea) / (maxArea - minArea)));
      
      let baseMultiplier;
      if ((point.width || 0) === 0 || (point.height || 0) === 0) {
        baseMultiplier = 0.25;
      } else {
        baseMultiplier = 0.15 + normalizedArea * 0.25;
      }
      
      const sizeVariation = 0.95 + Math.random() * 0.1;
      const smoothedMultiplier =
        this.lastSizeMultiplier * (1 - this.sizeSmoothingFactor) +
        baseMultiplier * sizeVariation * this.sizeSmoothingFactor;
      this.lastSizeMultiplier = smoothedMultiplier;
      
      return smoothedMultiplier * (sizeMultipliers[currentSizeLevel] || 1.0) * thicknessMultiplier;
    }
  }
  
  private getWatercolorColor(multiplier: number): string {
    // Soft, pastel watercolor palette
    const colors = [
      '#FFB3BA', // Soft pink
      '#BAFFC9', // Soft green
      '#BAE1FF', // Soft blue
      '#FFFFBA', // Soft yellow
      '#FFB3F7', // Soft purple
      '#B3FFE6', // Soft teal
      '#FFD4B3', // Soft orange
      '#E6B3FF'  // Soft lavender
    ];
    
    const index = Math.floor(multiplier * colors.length) % colors.length;
    return colors[index];
  }
}
