export type Mode = 'live' | 'record' | 'playback';

let mode: Mode = 'live';

export function getMode(): Mode {
  return mode;
}

export function setMode(next: Mode): void {
  mode = next;
} 