# Visual Before / After

## Review method

The baseline was captured from the v1.5.0 `origin/main` implementation before code changes. The after matrix was captured by the v1.6 Playwright screenshot test from Chromium after the final CSS tightening pass. The images were visually inspected locally at mobile, landscape, iPad, desktop, dark, reduced-motion, and high-contrast states.

## Baseline

- [Before: Meaning light/bright 390](screenshots/before/meaning-light-bright-390.png)

Before, the core meaning was presented as a large green/white card treatment and the primary action read as a full-width solid mint bar. The content and functional layers were visually conflated.

## After

- [Bright scene, 390](screenshots/after-meaning-bright-390.png)
- [Dark scene, 390](screenshots/after-meaning-dark-390.png)
- [Textured scene, 390](screenshots/after-meaning-textured-390.png)
- [Medium scene, 390](screenshots/after-meaning-medium-390.png)
- [Wider mobile, 430](screenshots/after-meaning-430.png)
- [More popover open](screenshots/after-more-open-390.png)
- [Continue action state](screenshots/after-continue-390.png)
- [Landscape, 844 x 390](screenshots/after-meaning-landscape-844.png)
- [iPad, 1112 x 834](screenshots/after-meaning-ipad-1112.png)
- [Desktop, 1440 x 900](screenshots/after-meaning-desktop-1440.png)
- [Desktop, 1920 x 1080](screenshots/after-meaning-desktop-1920.png)
- [Reduced motion](screenshots/after-meaning-reduced-motion-390.png)
- [High contrast](screenshots/after-meaning-high-contrast-390.png)

## Observed visual changes

- The first visual anchor is the word hero; the second is the stable semantic meaning surface; the third is Continue.
- Meaning content is an opaque/stable reading material with neutral separation, not a lensing or pointer-lit Glass card.
- Close/Help, Audio, Bookmark, More, and Continue are functional controls with distinct Clear/Regular/Tinted roles.
- The More menu materializes from the More source geometry and uses a thicker expanded material without nested Glass surfaces.
- The background remains full-bleed and visible through localized scrims; mint is reserved for Continue, kicker, and semantic accents.
