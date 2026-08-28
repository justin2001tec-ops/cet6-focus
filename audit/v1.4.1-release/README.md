# CET6 Focus v1.4.1 Final Release Evidence

Status: **PASS — final online release audit complete**

This directory records the final v1.4.1 merge, deployed-site audit, and release gates. It is report/evidence only. Product source, Motion, Study, FSRS, Context, DB, PWA shell, and background assets were not changed after the accepted PR head was merged.

## Release identity

- Repository: `justin2001tec-ops/cet6-focus`
- Pull request: [#5](https://github.com/justin2001tec-ops/cet6-focus/pull/5)
- Accepted PR head: `0c54c10eef4b1eeaf17b904e88a8d28bd11050c6`
- Squash merge: `61207041510271267f99f61f0c80f6db3c85175d`
- Online site: <https://justin2001tec-ops.github.io/cet6-focus/>
- Online audit: isolated Chromium context, `2026-08-28T09:42:11.810Z`–`2026-08-28T09:43:14.851Z`

## Evidence map

- `release-identity.json` — merge, head, target contract, historic tag fingerprints, and audit identity.
- `release-http.json` — HTTP, manifest, service worker, vocabulary, provenance, and 28-background resource checks.
- `release-readability.json` — online Context / Meaning / Detail surface measurements and WebKit regression reference.
- `release-theme-matrix.json` — Light, Dark, System Light, System Dark, and the six-variant WebKit-backed matrix.
- `release-background-hierarchy.json` — four-scene scrim ordering and decoded-layer evidence.
- `release-safe-area.json` — native landscape plus independent left/right inset simulation.
- `release-zoom-200.json` — online automated 200% layout plus true Chromium browser-zoom evidence; Safari is explicitly unavailable on Windows.
- `release-high-contrast.json` — Forced Colors and `prefers-contrast: more` surface, control, and focus evidence.
- `release-long-word.json` — online `characteristic` and the full local long-word fixture matrix.
- `release-study-regression.json` — Study, FSRS, Undo, and Dictation behavior.
- `release-motion-regression.json` — preserved Motion blocker history and final WebKit-inclusive CI reference.
- `release-pwa-v7.json` — shell-v7, simulated v6 cleanup, warm cache, and offline evidence.
- `release-responsive.json` — required viewport coverage and overflow/CTA results.
- `release-console-network.json` — critical console, page-error, and request-failure results.
- `release-motion-triage-reference.json` — required reference to `../v1.4.1-release-blocker/final-triage-result.json`.

## Screenshots

The `screenshots/` directory contains the final stable captures required by the handoff: `context-light-390.png`, `meaning-light-390.png`, `meaning-dark-390.png`, `detail-light-390.png`, `detail-dark-390.png`, `meaning-bright-bg.png`, `meaning-textured-bg.png`, `detail-landscape-safe-area.png`, `meaning-browser-zoom-200.png`, `meaning-prefers-contrast-more.png`, and `long-word-mobile.png`.

## Gate summary

All final online gates passed: HTTP/assets, fresh onboarding, vocabulary/detail, Context/Meaning/Detail, Light/Dark/System themes, background hierarchy, Safe Area, long-word integrity, 200% zoom, Forced Colors, `prefers-contrast: more`, Study/FSRS/Undo/Dictation, Reduced Motion, responsive behavior, v6→v7 cache cleanup, warm-cache offline, and critical console/network checks. Local Chromium/Mobile Chromium/WebKit readability evidence and GitHub quality/e2e evidence are retained by reference.

## Preserved history and limitations

The prior `audit/v1.4.1-readability/**` and `audit/v1.4.1-release-blocker/**` trees are intentionally preserved. The blocker history records the intermittent cold-route 165ms/100ms observations and the accepted Warm Motion 5/5 clean classification; it is not rewritten as if the initial observations never occurred.

Safari true browser-zoom validation is `NOT_AVAILABLE` in this Windows release environment. WebKit automated readability is `PASS`. Audio-label typography remains an accepted small P2 (approximately 11px) for a future v1.5 typography pass and is not a release blocker.
