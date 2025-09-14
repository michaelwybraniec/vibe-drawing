export interface DrawingPoint {
  x: number;
  y: number;
  width: number;
  height: number;
  t?: number;
  speed?: number;
  pressure?: number;
}

export interface StyleContext {
  ctx: CanvasRenderingContext2D;
  isEraserMode: boolean;
  thicknessMultiplier: number;
  currentSizeLevel: number;
  sizeMultipliers: number[];
  isWebApp: boolean;
}

export interface DrawingStyle {
  name: string;
  description: string;
  icon?: string;

  // Core drawing method
  draw(ctx: CanvasRenderingContext2D, point: DrawingPoint, context: StyleContext): void;

  // Optional methods
  onStart?(point: DrawingPoint, context: StyleContext): void;
  onMove?(points: DrawingPoint[], context: StyleContext): void;
  onEnd?(context: StyleContext): void;
  onClear?(context: StyleContext): void;
  animate?(context: StyleContext): void;
  nextColorVariant?(): void;
  resetToDefault?(): void;
}
