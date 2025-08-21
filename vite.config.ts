import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.CAPACITOR ? '/' : '/vibe-drawing/',
  server: {
    port: 5555,
    host: true,
  },
});
