import { registerPlugin } from '@capacitor/core';

export type NativeHapticsPlugin = {
  start(options: { intensity: number }): Promise<void>;
  update(options: { intensity: number }): Promise<void>;
  stop(): Promise<void>;
};

export const NativeHaptics = registerPlugin<NativeHapticsPlugin>('NativeHaptics', {
  web: () => ({
    async start() {},
    async update() {},
    async stop() {},
  } as NativeHapticsPlugin),
}); 