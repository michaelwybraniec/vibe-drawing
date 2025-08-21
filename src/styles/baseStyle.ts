export interface DrawingPoint {
  x: number;
  y: number;
  t: number;
  speed?: number;
  pressure?: number;
  width?: number;
  height?: number;
}

export interface StyleContext {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  isEraserMode: boolean;
  thicknessMultiplier: number;
  currentSizeLevel: number;
  sizeMultipliers: number[];
  isWebApp: boolean;
}

export interface DrawingStyle {
  name: string;
  description: string;
  icon: string;

  // Core methods
  onStart?(point: DrawingPoint, context: StyleContext): void;
  onMove?(points: DrawingPoint[], context: StyleContext): void;
  onEnd?(context: StyleContext): void;

  // Optional methods
  onClear?(context: StyleContext): void;
  animate?(context: StyleContext): void;

  // Style-specific properties
  properties?: Record<string, any>;
}
