import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.overvibing.vibe',
  appName: 'Vibe Drawing',
  webDir: 'dist',
  server: {
    hostname: 'localhost',
    iosScheme: 'capacitor',
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: false,
    allowsLinkPreview: false,
    handleApplicationNotifications: false,
    backgroundColor: '#151E35',
  },
};

export default config;
