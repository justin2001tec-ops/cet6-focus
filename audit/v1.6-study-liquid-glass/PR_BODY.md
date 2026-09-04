# v1.6 Study / Meaning Apple-inspired Liquid Glass redesign

## R1 Apple design-principle refinement

- Removed the single-item `More` path; `扩展理解` is a direct, visible action.
- Unified Study functional controls on the Regular material identity.
- Removed the global green-glass bias with neutral, scene-adaptive optical variables.
- Kept Bookmark on one stable Glass variant; selection changes state/tint only.
- Made icon-only controls circular and removed the normal Glass double rim.
- Added touch-origin feedback plus lighter pen/mouse pointer-follow profiles.
- Made Scroll Edge conditional on real sticky overlap; the Meaning dock stays inactive.
- Preserved Hero/session/background spatial anchors and limited arrival motion to reading/action content.
- Reframed Help for touch, mouse, and keyboard learning operations.
- Restored scene vitality without replacing background assets or changing the Meaning content layer.

## Verification

- TypeScript, ESLint, Vitest, and Vite build: PASS.
- R1 Study/Glass contract and visual matrix: Chromium PASS; Mobile Chromium and WebKit contract PASS.
- Existing Learning/Readability regression: Chromium PASS after direct Expand migration.
- Warm Motion: PASS, 5/5 runs with no >50ms long tasks; full serial E2E: PASS, 102 passed / 27 skipped / 0 failed.

## Scope boundary

FSRS, ReviewLog, Context/Vocabulary data, DB schema, PWA/runtime assets, background assets, Home/Settings, and Meaning's non-Glass content layer remain frozen. This PR must remain OPEN for review; no merge, deployment, tag, or release is included.
