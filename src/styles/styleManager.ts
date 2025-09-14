import { DrawingStyle, DrawingPoint, StyleContext } from './baseStyle.js';

import { TriangleStyle } from './triangle-draw.js';
import { Style1 } from './classic.js';
import { Style2 } from './3d-sphere.js';
// import { Style7 } from './plasma-energy.js';
import { Style8 } from './classic-rainbow.js';
import { CleanPlasmaStyle } from './clean-plasma.js';

export class StyleManager {
  private styles: DrawingStyle[] = [];
  private currentStyleIndex = 0;
  private currentStyle: DrawingStyle;

  constructor() {
    // Initialize all available styles
    this.styles = [
      new TriangleStyle(),
      new Style1(),        
      new Style2(),
      new CleanPlasmaStyle(),

      // new Style7(),     
      new Style8(),
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
