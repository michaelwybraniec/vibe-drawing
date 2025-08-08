# Agentic Workflow Protocol (AWP)

## Hard instructions for AI agents

1. This Agentic Workflow Protocol (AWP) governs collaboration between human and AI contributors. The following principles must always be followed:

   1.1. All work is guided strictly by the AWP; no deviations or improvisation.

   1.2. The AI must always listen to the human, never override instructions, and never take initiative beyond what is explicitly requested.

   1.3. Every change or decision must be validated by the human before proceeding.

   1.4. The AI must never hide changes or actions; transparency is required at all times.

   1.5. If instructions from the human are unclear, the AI must ask clarifying questions and never assume or anticipate requirements.

   1.6. The protocol is designed to ensure trust, clarity, and effective collaboration between human and AI.

   1.7. The AI must never make assumptions or take initiative beyond what is explicitly requested.

   1.8. Always use the commit standard for all changes.

   1.9. Never override the human's instructions, or any content in this AWP.

   1.10. Use numbers to reference changes in this AWP. Format 1.1, 1.2, 1.3, etc.

   1.11. Never use the word "AI" in any commit message.

   1.12 Read this AWP.md and if exists the main README.md to understand the workflow and project goal.

   1.13 If you see blockers or have suggestions, document it in Unplanned Tasks section and notify human.

   1.14 Always respect human oversight and approval gates

   1.15. Never make critical business decisions without human approval

   1.16. Always document your reasoning and decisions

   1.17. Follow the commit standard and reference step numbers

   1.18. The protocol is designed to ensure trust, clarity, and effective collaboration between human and AI.

## Author

Michael Wybraniec (ONE-FRONT.COM, OVERVIBING.COM)

## Goal

1. Deliver a haptic drawing web app where users draw with their fingers and feel haptic feedback.
2. Provide two modes: live drawing with immediate feedback, and record/playback with vibrations.

## Overview

1. Discovery
2. Design
3. Implementation
4. Testing
5. Deployment

## Technology

1. HTML5 Canvas
2. Vibration API
3. Hammer.js

## Outcome

1. Users can draw freely on the canvas.
2. Vibrations change in real time based on drawing speed and thickness.
3. App has two modes 1. vibe-drawing (when user draw and that produces vibration frequency based on strength, shape and speed) 2. composition-mode (when user first draws something and then vibration is generated)
4. Live mode provides immediate feedback; record/playback replays drawings with synchronized vibrations.
5. App is deployable as static files (e.g., GitHub Pages).

## Collaboration

- **ai_agent_senior_developer:** Senior Developer (AI Agent)
- **ai_agent_junior_developer:** Junior Developer (AI Agent)
- **ai_agent_designer:** Designer (AI Agent)
- **ai_agent_tester:** Tester (AI Agent)
- **ai_agent_documentation:** Documentation (AI Agent)
- **ai_agent_project_manager:** Project Manager (AI Agent)
- **ai_agent_product_owner:** Product Owner (AI Agent)
- **ai_agent_scrum_master:** Scrum Master (AI Agent)
- **human_developer:** Developer (Human)
- **human_designer:** Designer (Human)
- **human_tester:** Tester (Human)
- **human_documentation:** Documentation (Human)
- **human_project_manager:** Project Manager (Human)
- **human_product_owner:** Product Owner (Human)
- **human_scrum_master:** Scrum Master (Human)
- **approver:** Human Only (Human)
- **approval_timeout:** 10 minutes
- **auto_handoff:** true

## Project Backlog

- [ ] 0. Project Initialization [Tech: Node.js, TypeScript, ESLint, Prettier, GitHub Actions, HTML/CSS]
  - [x] 0.1 Repo setup: .editorconfig, .gitignore, LICENSE, README anchors [Tech: Git]
  - [x] 0.2 TypeScript baseline: tsconfig.json with strict mode [Tech: TypeScript]
  - [x] 0.3 Lint/format: ESLint + Prettier + scripts + pre-commit hooks [Tech: ESLint, Prettier, Husky]
  - [x] 0.4 CI: GitHub Actions for build/lint [Tech: GitHub Actions]
  - [x] 0.5 Basic scaffold: index.html, src/main.ts, base CSS reset [Tech: HTML/CSS, TypeScript]
  - [x] 0.6 Mobile readiness: meta viewport, touch-action: none, passive listeners [Tech: HTML/CSS]
  - [x] 0.7 Capability detection & guards (Pointer Events, Vibration API, DPR) [Tech: TypeScript]
  - [x] 0.8 Error handling/logging strategy; feature flags [Tech: TypeScript]

- [ ] 1. Canvas Drawing [Tech: HTML5 Canvas, Pointer Events/Hammer.js]
  - [ ] 1.1 As a user, I can draw on the canvas using touch input so that I can sketch freely. [Tech: HTML5 Canvas, Pointer Events/Hammer.js]
    - [x] 1.1.1 Acceptance: Touch down/move/up renders strokes with visible continuity. [Tech: HTML5 Canvas]
    - [x] 1.1.2 Add responsive <canvas> with DPR scaling and resize handling. [Tech: HTML5 Canvas]
    - [x] 1.1.3 Initialize 2D context, line caps/joins, color, smoothing defaults. [Tech: HTML5 Canvas]
    - [x] 1.1.4 Implement pointerdown/move/up handlers (or Hammer.js) capturing x/y/t. [Tech: Pointer Events/Hammer.js]
    - [x] 1.1.5 Buffer stroke points and draw incrementally on move/end. [Tech: HTML5 Canvas]
    - [x] 1.1.6 Apply basic smoothing (e.g., quadratic Bézier between points). [Tech: HTML5 Canvas]
    - [ ] 1.1.7 Manual device test for continuity and latency. [Tech: Manual QA]
  - [ ] 1.2 Stroke thickness accounts for drawing speed. [Tech: HTML5 Canvas]
    - [x] 1.2.1 Acceptance: Faster strokes appear thinner (or thicker, per chosen mapping) consistently. [Tech: HTML5 Canvas]
    - [x] 1.2.2 Compute instantaneous speed between successive points (px/ms). [Tech: JavaScript]
    - [x] 1.2.3 Map speed → lineWidth via configurable function with clamps. [Tech: HTML5 Canvas]
    - [x] 1.2.4 Stabilize width changes (low-pass filter to avoid jitter). [Tech: JavaScript]
    - [ ] 1.2.5 Profile performance on low-end devices. [Tech: Manual QA]

- [ ] 2. Haptic Feedback Engine [Tech: Vibration API]
  - [x] 2.1 Real-time vibration intensity changes with drawing speed and/or stroke thickness. [Tech: Vibration API]
    - [x] 2.1.1 Acceptance: On supported devices, users feel vibration variation while drawing. [Tech: Vibration API]
    - [x] 2.1.2 Feature-detect navigator.vibrate and permissions model. [Tech: Vibration API]
    - [x] 2.1.3 Define speed/width → vibration pattern mapping (durations). [Tech: Vibration API]
    - [x] 2.1.4 Throttle/debounce vibrate calls; batch updates to avoid spam. [Tech: JavaScript]
    - [x] 2.1.5 Ensure stop on pointerup/cancel to prevent lingering vibration. [Tech: Vibration API]
  - [x] 2.2 Graceful fallback when Vibration API is not supported. [Tech: Vibration API]
    - [x] 2.2.1 Acceptance: App does not error; a non-haptic mode is used. [Tech: Vibration API]
    - [x] 2.2.2 Guard all haptic calls; no-op when unsupported. [Tech: JavaScript]
    - [x] 2.2.3 Surface a UI hint to indicate haptics unavailable. [Tech: HTML/CSS]
    - [x] 2.2.4 Setting to disable haptics manually for testing. [Tech: JavaScript]

- [ ] 3. Modes (vibe-drawing + composition-mode) [Tech: HTML5 Canvas, Vibration API]
  - [x] 3.1 vibe-drawing: immediate haptic feedback while drawing. [Tech: HTML5 Canvas, Vibration API]
    - [x] 3.1.1 Acceptance: Vibrations occur concurrently with stroke rendering. [Tech: Vibration API]
    - [x] 3.1.2 Acceptance: Vibration frequency/intensity map to strength (pressure), shape (curvature), and speed in real time. [Tech: Vibration API]
    - [x] 3.1.3 Add mode state machine (Live, Record, Playback). [Tech: JavaScript]
    - [x] 3.1.4 Wire haptics trigger to drawing loop in Live mode. [Tech: Vibration API]
    - [ ] 3.1.5 Verify no missed frames; tune throttling. [Tech: Manual QA]
  - [ ] 3.2 composition-mode: record drawing (points, timestamps, and derived attributes). [Tech: Pointer Events/Hammer.js, JavaScript timing]
    - [x] 3.2.1 Acceptance: A drawing session is stored as structured data (e.g., JSON) locally in memory. [Tech: JSON]
    - [x] 3.2.2 Define schema: {t,x,y,pressure?,speed?,width?}. [Tech: TypeScript]
    - [x] 3.2.3 Implement start/stop capture; time base relative to start. [Tech: JavaScript]
    - [ ] 3.2.4 Serialize/deserialize to JSON; provide export for debug. [Tech: JSON]
  - [ ] 3.3 composition-mode: playback with synchronized vibrations. [Tech: HTML5 Canvas, Vibration API, JavaScript timing]
    - [ ] 3.3.1 Acceptance: Visual playback mirrors recorded path and timing; haptics align with recorded attributes. [Tech: HTML5 Canvas, Vibration API]
    - [ ] 3.3.2 Acceptance: Vibration frequency/intensity during playback follow recorded strength (pressure), shape (curvature), and speed. [Tech: Vibration API]
    - [ ] 3.3.3 Implement scheduler to iterate points by timestamp. [Tech: JavaScript]
    - [ ] 3.3.4 Interpolate between points for smooth motion. [Tech: JavaScript]
    - [ ] 3.3.5 Emit haptic patterns in sync with playback attributes. [Tech: Vibration API]
    - [ ] 3.3.6 Controls: play/pause/stop; reset to start. [Tech: HTML/CSS]

- [ ] 4. Basic UI Controls [Tech: HTML/CSS]
  - [ ] 4.1 Toggle between Live and Record/Playback modes. [Tech: HTML/CSS]
    - [ ] 4.1.1 Acceptance: A clear, accessible control for mode switching exists. [Tech: HTML/CSS]
    - [ ] 4.1.2 Add labeled toggle/select; keyboard and screen reader accessible. [Tech: HTML/CSS]
    - [ ] 4.1.3 Bind to mode state machine; persist choice in memory. [Tech: JavaScript]
  - [ ] 4.2 Clear canvas control. [Tech: HTML5 Canvas, HTML/CSS]
    - [ ] 4.2.1 Acceptance: Users can reset the canvas state. [Tech: HTML5 Canvas]
    - [ ] 4.2.2 Implement clear action: wipe canvas, reset buffers/state. [Tech: HTML5 Canvas]
    - [ ] 4.2.3 Confirm behavior in each mode (Live/Record/Playback). [Tech: Manual QA]

- [ ] 5. Deployment (Static Hosting) [Tech: GitHub Pages]
  - [ ] 5.1 Build static assets suitable for GitHub Pages. [Tech: Static HTML/CSS/JS]
    - [ ] 5.1.1 Acceptance: A production build outputs static files; deployment instructions verified. [Tech: GitHub Pages]
    - [ ] 5.1.2 Scaffold simple app structure (index.html, src/main.ts). [Tech: TypeScript]
    - [ ] 5.1.3 Add minimal bundling or use vanilla static files initially. [Tech: Node.js/ESBuild or None]
    - [ ] 5.1.4 Create GitHub Pages workflow/instructions and verify deploy. [Tech: GitHub Actions]

- [ ] 6. Settings Panel [Tech: HTML/CSS, TypeScript]
  - [ ] 6.1 Toggle haptics on/off. [Tech: TypeScript]
    - [ ] 6.1.1 Acceptance: Haptics can be enabled/disabled from UI and persists for session. [Tech: TypeScript]
    - [ ] 6.1.2 Add settings UI (modal/panel). [Tech: HTML/CSS]
    - [ ] 6.1.3 Persist toggles in memory/localStorage. [Tech: TypeScript]
  - [ ] 6.2 Stroke color/thickness base, speed→width mapping sensitivity. [Tech: HTML5 Canvas]
    - [ ] 6.2.1 Acceptance: Users can adjust and see effect immediately. [Tech: HTML5 Canvas]
  - [ ] 6.3 Reset to defaults. [Tech: TypeScript]

- [ ] 7. Session Persistence [Tech: LocalStorage, JSON]
  - [ ] 7.1 Save current recording locally. [Tech: LocalStorage]
  - [ ] 7.2 Load recording. [Tech: LocalStorage]
  - [ ] 7.3 Import/export JSON. [Tech: JSON]

- [ ] 8. Accessibility & Motion Preferences [Tech: HTML/CSS, ARIA]
  - [ ] 8.1 Keyboard operability for controls. [Tech: HTML/ARIA]
  - [ ] 8.2 ARIA labels; contrast. [Tech: HTML/CSS]
  - [ ] 8.3 Respect prefers-reduced-motion (auto-disable haptics). [Tech: CSS/JS]

- [ ] 9. Performance & Stability [Tech: TypeScript, Canvas]
  - [ ] 9.1 Use requestAnimationFrame for render. [Tech: Canvas]
  - [ ] 9.2 Downsample input points; smoothing with bounded CPU. [Tech: JavaScript]
  - [ ] 9.3 Memory bounds for recording size. [Tech: JavaScript]

- [ ] 10. Cross-browser/device QA [Tech: QA]
  - [ ] 10.1 iOS Safari, Android Chrome device matrices. [Tech: QA]
  - [ ] 10.2 Latency spot checks; fallback verification. [Tech: QA]

- [ ] 11. Optional PWA [Tech: Manifest, Service Worker]
  - [ ] 11.1 Web App Manifest + icons. [Tech: Manifest]
  - [ ] 11.2 Service worker caching static assets. [Tech: Service Worker]

- [ ] 12. Privacy & Telemetry (optional) [Tech: Docs]
  - [ ] 12.1 Document telemetry policy (disabled by default). [Tech: Docs]

- [ ] 13. Docs & Handover [Tech: Docs]
  - [ ] 13.1 Update root README with usage, device support, limitations. [Tech: Docs]
  - [ ] 13.2 Update AWP.md references; finalize acceptance checks. [Tech: Docs]

- [ ] 14. Release Automation [Tech: GitHub Actions/Pages]
  - [ ] 14.1 GitHub Pages workflow (build + deploy). [Tech: GitHub Actions]
  - [ ] 14.2 Tagging/version stamp in UI. [Tech: TypeScript]

## Unplanned Tasks

- [ ] U.1: Unplanned task, Name, Title, Description, etc.
- [ ] U.2: Unplanned task, Name, Title, Description, etc.

## Release Milestones

- M1: Canvas drawing prototype (touch input → visible strokes)
- M2: Haptic feedback engine integrated with live drawing
- M3: Record and playback implementation with synchronized haptics
- M4: Basic UI/controls and polish
- M5: Static build and GitHub Pages deployment

## Test Plan (Summary)

- Functional: Drawing, haptics, mode switching, recording, playback
- Compatibility: iOS Safari, Android Chrome (device support dependent)
- Performance: Smooth drawing responsiveness
- Acceptance highlights:
  - Continuous stroke rendering without gaps
  - Haptic intensity varies with drawing dynamics
  - Live mode haptics are immediate
  - Playback mirrors original path/timing with synchronized haptics
  - Graceful fallback when Vibration API unsupported

## Architecture (Summary)

- Components: Canvas Renderer, Input Handler (Pointer Events/Hammer.js), Haptics Engine, Mode Controller, Recording Store, UI Controls
- Data Flow: Input → Stroke Model → Canvas Renderer; Dynamics → Haptics Engine → Vibration API; Record/Playback sync via timestamps
- Key Decisions: Static hosting; prefer Pointer Events; feature-detect `navigator.vibrate`
- Non-Functional: Target 60fps; accessible controls; optional PWA later

## Stakeholders and RACI

- Roles: Product Owner, Tech Lead, Developer(s), QA
- RACI:
  - Requirements & Scope: Product Owner (A), Tech Lead (C)
  - Architecture: Tech Lead (A), Developer(s) (R), Product Owner (C)
  - Implementation: Developer(s) (A/R), Tech Lead (C)
  - Testing: QA (A/R), Developer(s) (R), Tech Lead (C)
  - Release/Deployment: Tech Lead (A), Developer(s) (R), Product Owner (C)

## Risks

| ID  | Risk                                              | Likelihood | Impact | Mitigation                                                   |
| --- | ------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------ |
| R1  | Limited device support for Vibration API          | Medium     | Medium | Feature detection and graceful fallback                      |
| R2  | Performance issues at high stroke density         | Medium     | High   | Optimize canvas rendering, throttle sampling, batch draws    |
| R3  | Inconsistent touch event behavior across browsers | Medium     | Medium | Prefer Pointer Events; test on iOS Safari and Android Chrome |
| R4  | Playback sync drift between visuals and haptics   | Low        | Medium | Timestamped events; drift correction during playback         |
| R5  | Scope creep delaying release                      | Medium     | Medium | Backlog discipline; milestone gates and acceptance criteria  |

## Procedures

1. **update**

   1.1. Review README.md and AWP.md after each step.

   1.2. Update README.md to reflect the current state

   1.3. We review AWP.md to understand next actions.

   1.4. Check for blockers, if any we notify humans.

   1.5. Ensure docs and code are aligned, of not, notify humans.

2. **commit**

   2.1. Commit changes using the commitStandard.

   2.2. Use the format: type(scope step): subject.

   2.3. Reference the step number in every commit message.

   2.4. Follow conventional commit standards.

   2.5. Include relevant files and messages by checking git status what was changed in file with git diff?

3. **next**

   3.1. Move to the next actionable step only after update and commit are complete.

   3.2. Identify the next actionable step and begin work.

   3.3. Check for blockers before proceeding, and confirm additional plan with human.

   3.4. Mark the current step 'check' [ ] as done before you start.

   3.5 If there were some task that were unplanned and you had to add it according to best practices, not it in unplanned tasks and tell human.

4. **check**

   4.1. Review AWP.md to determine the current actionable step.

   4.2. Find the first step not done.

   4.3. Restore context and understand what needs to be done.

   4.4. Use this when returning to work after a break or context loss.

5. **handoff**

   5.1. Transfer task ownership between human and AI.

   5.2. Package current context and deliverables.

   5.3. Notify receiving party with clear expectations.

   5.4. Set timeout for response and escalation rules.

## Human Notes

1. Reference the step in every commit.
2. Update this file as the project progresses.
3. Check off each item as you complete it.
4. Respect human-AI collaboration boundaries.

## Commit Standard

- **format:** type(scope step): subject
- **types:** feat, fix, docs, test, chore
- **rules:**
  - Reference the step in every commit.
  - Use imperative mood.
  - Keep messages concise and descriptive.
- **examples:**
  - feat(api 3.1): add API endpoint
  - docs(readme 5.1): expand documentation
