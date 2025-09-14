import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';
import { Style1 } from './classic.js';
import { Style2 } from './3d-sphere.js';
import { Style3 } from './glitch-wave.js';
import { Style4 } from './fire-lava.js';
import { Style5 } from './water-drops.js';
import { Style6 } from './holographic-prism.js';
import { Style7 } from './plasma-energy.js';
import { Style8 } from './classic-rainbow.js';

export class StyleManager {
  private styles: DrawingStyle[] = [];
  private currentStyleIndex = 0;
  private currentStyle: DrawingStyle;

  constructor() {
    // Initialize all available styles
    this.styles = [
      new Style1(),      // Classic
      new Style2(),      // 3D Sphere
      new Style3(),      // Glitch Wave
      new Style4(),      // Fire Lava
      new Style5(),      // Water Drops
      new Style6(),      // Holographic Prism
      new Style7(),      // Plasma Energy
      new Style8(),      // Classic Rainbow
    ];

    this.currentStyle = this.styles[0]!;
  }

  getCurrentStyle(): DrawingStyle {
    return this.currentStyle;
  }

  getCurrentStyleIndex(): number {
    return this.currentStyleIndex;
  }

  getAllStyles(): DrawingStyle[] {
    return this.styles;
  }

  switchToStyle(index: number): void {
    if (index >= 0 && index < this.styles.length) {
      this.currentStyleIndex = index;
      this.currentStyle = this.styles[index]!;
      console.log(`🎨 Switched to style: ${this.currentStyle.name}`);
    }
  }

  nextStyle(): void {
    const nextIndex = (this.currentStyleIndex + 1) % this.styles.length;
    this.switchToStyle(nextIndex);
  }

  previousStyle(): void {
    const prevIndex =
      this.currentStyleIndex === 0 ? this.styles.length - 1 : this.currentStyleIndex - 1;
    this.switchToStyle(prevIndex);
  }

  // Delegate methods to current style
  onStart(point: DrawingPoint, context: StyleContext): void {
    this.currentStyle.onStart?.(point, context);
  }

  onMove(points: DrawingPoint[], context: StyleContext): void {
    console.log(
      `🎯 StyleManager.onMove called for style: ${this.currentStyle.name}, points: ${points.length}`,
    );
    this.currentStyle.onMove?.(points, context);
  }

  onEnd(context: StyleContext): void {
    this.currentStyle.onEnd?.(context);
  }

  onClear(context: StyleContext): void {
    this.currentStyle.onClear?.(context);
    // Also clear all other styles
    this.styles.forEach((style) => {
      if (style !== this.currentStyle) {
        style.onClear?.(context);
      }
    });
  }

  animate(context: StyleContext): void {
    this.currentStyle.animate?.(context);
    // Also animate other styles that need it
    this.styles.forEach((style) => {
      if (style !== this.currentStyle && style.animate) {
        style.animate(context);
      }
    });
  }
}
