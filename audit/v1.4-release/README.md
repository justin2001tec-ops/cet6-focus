# CET6 Focus v1.4.0 release evidence

Verified 2026-08-25 against the deployed site:

`https://justin2001tec-ops.github.io/cet6-focus/`

The final online runner completed 46 PASS / 0 FAIL across Chromium desktop, Chromium mobile, and WebKit mobile. The separate responsive smoke also passed at 390×844, 430×932, 768×1024, 834×1112, 1440×900, and 1920×1080.

## Evidence index

- `release-http.json` — core HTTP and asset checks, including 28/28 background assets.
- `release-background-assets.json` — background pool and double-buffer lifecycle.
- `release-motion-smoke.json` — Home, Study/Review, press, continuity, rapid navigation, and performance evidence.
- `release-study-review.json` — recognition, FSRS, Undo, and IndexedDB regression evidence.
- `release-shared-layout.json` — Vocabulary → Word Detail entity continuity.
- `release-sheet-smoke.json` — PhysicalSheet opening, drag, velocity handoff, reverse, Back, Escape, and focus behavior.
- `release-reduced-motion.json` — OS/App Reduced Motion, contrast, input modality, and zoom evidence.
- `release-pwa-v6.json` — shell-v6, v5 cleanup, controller, cache warm-up, and offline reload.
- `release-responsive.json` — six required viewport sizes.
- `release-console-network.json` — final runtime error arrays.
- `release-data-freeze.json` — frozen vocabulary/context counts and SHA-256 values.
- `release-online-summary.json` — final online result summary and screenshot inventory.

## Screenshots

The screenshots were captured only after the active background image reported `complete`, a positive natural size, and successful decode. They are evidence, not the sole basis for Motion PASS.

- `screenshots/home-desktop.png`
- `screenshots/home-iphone-390.png`
- `screenshots/study-recall-desktop.png`
- `screenshots/study-meaning-iphone.png`
- `screenshots/vocabulary-desktop.png`
- `screenshots/word-detail-desktop.png`
- `screenshots/physical-sheet-mobile.png`
- `screenshots/settings-desktop.png`
- `screenshots/reduced-motion-study.png`
- `screenshots/increased-contrast.png`

## Release boundary

The only product change before merge was the required `public/sw.js` cache name bump from shell-v5 to shell-v6. After the squash merge, the release evidence is report/evidence-only; no `src/**`, `public/sw.js`, `public/data/**`, Context data, Motion implementation, CSS, Study, Review, FSRS, or PhysicalSheet implementation is changed by this evidence set.

The first CDN probe observed a short pre-propagation stale bundle; it was not used as release evidence. The final audit ran after the deployed root returned the current bundle and the live DOM exposed the v1.4 Motion attributes.
