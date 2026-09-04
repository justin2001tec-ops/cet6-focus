# v1.6 Study / Meaning Apple-inspired Liquid Glass redesign

This PR implements the v1.6 Study / Meaning redesign from the approved research and handoff.

## What changed

- Added a centralized `GlassSurface` primitive with Clear / Regular / Expanded variants, tokenized radii, pointer-light rAF throttling, bounded press feedback, and accessibility fallbacks.
- Rebuilt the Study session chrome, Word Hero, Audio/Bookmark controls, stable semantic Meaning reading surface, bottom action dock, tinted Continue action, and More FLIP-style popover.
- Kept the content layer readable and stable; Glass is limited to functional controls and the More surface.
- Added v1.6 contract and screenshot evidence under `audit/v1.6-study-liquid-glass/`.

## Verification

- TypeScript, ESLint, Vitest (14 files / 34 tests), and Vite build: PASS.
- Full Playwright E2E: 102 passed / 27 skipped / 0 failed.
- Warm Motion: 5/5; >50ms long tasks during motion: 0.
- Study/Glass contract: Chromium, Mobile Chromium, and WebKit: PASS.

## Scope boundary

FSRS, ReviewLog, Context/Vocabulary data, DB, PWA, background assets, and the Study state machine are unchanged. This PR must remain OPEN for review; no merge, deployment, tag, or release is included.
