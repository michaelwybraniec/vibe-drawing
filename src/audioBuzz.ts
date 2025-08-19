let ctx: AudioContext | null = null;
let osc: OscillatorNode | null = null;
let gain: GainNode | null = null;

export function audioStart(intensity: number = 0.5): void {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!ctx) return;
    if (osc) return; // already running
    osc = ctx.createOscillator();
    gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 85; // low buzz
    gain.gain.value = Math.min(1, Math.max(0.05, intensity));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
  } catch {
    // ignore audio init errors
  }
}

export function audioUpdate(intensity: number = 0.5): void {
  if (!gain || !ctx) return;
  const target = Math.min(1, Math.max(0.05, intensity));
  try {
    gain.gain.exponentialRampToValueAtTime(target, ctx.currentTime + 0.05);
  } catch {
    gain.gain.value = target;
  }
}

export function audioStop(): void {
  try {
    osc?.stop();
  } catch {
    // ignore
  }
  try {
    osc?.disconnect();
    gain?.disconnect();
  } catch {
    // ignore
  }
  osc = null;
  gain = null;
} 