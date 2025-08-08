export type RecordedPoint = { t: number; x: number; y: number; pressure?: number; speed?: number; width?: number };
export type Recording = { startedAt: number; points: RecordedPoint[] };

let current: Recording | null = null;

export function startRecording(now: number): void {
  current = { startedAt: now, points: [] };
}

export function stopRecording(): Recording | null {
  const rec = current;
  current = null;
  return rec;
}

export function isRecording(): boolean {
  return current !== null;
}

type PointWithoutTime = Omit<RecordedPoint, 't'>;

export function pushPoint(now: number, p: PointWithoutTime): void {
  if (!current) return;
  const rel = now - current.startedAt;
  current.points.push({ ...p, t: rel });
} 