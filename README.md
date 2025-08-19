## Vibe Drawing

A mobile-first haptic drawing web app for invisible heroes. Built using the Agentic Workflow Protocol (AWP) by the OVERVIBING.COM community.

### Overview

- Draw on a canvas using touch and feel haptic feedback as you create.
- Two modes:
  - vibe-drawing: real-time haptics while you draw
  - composition-mode: draw first, then replay with synchronized haptics

### Features

- Drawing on HTML5 Canvas with smooth strokes
- Haptic feedback with vibration patterns that vary by speed, pressure (strength), and shape (curvature)
- Live mode and record/playback with synchronized visuals and haptics

### Technologies

- HTML5 Canvas
- Vibration API
- Pointer Events/Hammer.js

### Getting Started (Work in Progress)

This repository currently holds the agentic planning and workflow docs. Implementation will proceed per the numbered backlog in the AWP.

- See Project Backlog steps 0.\* for initialization (TypeScript baseline, lint, CI, scaffold)
- Commits will reference step numbers per the AWP convention: `type(scope step): subject`

### Device Support

- Mobile browsers supporting the Vibration API (Android Chrome commonly supported; iOS Safari support varies)
- Graceful fallback when haptics are unavailable

### Accessibility & Motion Preferences

- UI will be keyboard accessible and labeled
- Respects `prefers-reduced-motion` and allows disabling haptics

### Project Structure

- `.cursor/mcp.json` — MCP server configuration
- `agentic-sldc/AWP.md` — Agentic Workflow Protocol (goals, backlog, procedures)
- `project.md` — Self-doc summary of the repository

### Agentic SDLC & Workflow

- Review and work items are tracked and executed according to the AWP
- Backlog is fully numbered for traceability
- Commit standard: `type(scope step): subject`

### Roadmap

- See `agentic-sldc/AWP.md` → Project Backlog (0–14)

### License

- To be defined (add a LICENSE file under 0.1 Repo setup)

### PWA & Native

- PWA: Manifest + Service Worker added. Install via browser menu (Android: Install app; iOS: Add to Home Screen).
- iOS limitation: Web Vibration API is not supported by iOS Safari/WebKit, even as a PWA.
- Native path: Use Capacitor to ship iOS/Android with true haptics via @capacitor/haptics.
  - Dev: `npm run dev` (Vite), Build: `npm run build`, Sync: `npm run cap:sync`, Open Xcode/Android Studio: `npm run cap:ios` / `npm run cap:android`.

### iOS (Xcode + CocoaPods + Capacitor)

- Install Xcode from App Store (manual), then run it once
- Terminal commands:

```sh
# Set Xcode as active developer dir (adjust path if Xcode.app is elsewhere)
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Accept Xcode license
sudo xcodebuild -license accept

# Install CocoaPods
sudo gem install cocoapods

# Build web, sync iOS, open in Xcode
npm run build
npx cap sync ios
npm run cap:ios
```

- In Xcode: set Signing & Capabilities (Team), select your iPhone, then Run

### Android (Android Studio + Capacitor)

- Install Android Studio (manual), open it once and install SDKs/Platform Tools
- Terminal commands:

```sh
# Build web, sync Android, open Android Studio
npm run build
npx cap sync android
npm run cap:android
```

- In Android Studio: choose a device/emulator and Run

Notes

- After code changes: npm run build && npx cap sync (ios|android)
- For vibration on iOS, use the native app (web/PWA cannot vibrate on iOS)
