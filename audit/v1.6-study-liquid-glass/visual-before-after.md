# v1.6 R1 Study / Meaning visual evidence

## Review method

The baseline is the v1.5.0 `origin/main` implementation before the v1.6 redesign. The R1 matrix was captured from Chromium after the material-fidelity refinement and after the active background transition settled. The screenshots cover the approved scene, input, responsive, and accessibility states; the Meaning content layer remains frozen as a semantic non-Glass surface.

## Baseline

- [Before: Meaning light/bright 390](screenshots/before/meaning-light-bright-390.png)

The baseline mixed green card treatment, functional controls, and the reading hierarchy. The single-item More affordance also placed the only expansion action behind an extra interaction.

## R1 after matrix

- [Bright scene, 390](screenshots/after-meaning-bright-390.png)
- [Dark scene, 390](screenshots/after-meaning-dark-390.png)
- [Textured scene, 390](screenshots/after-meaning-textured-390.png)
- [Medium scene, 390](screenshots/after-meaning-medium-390.png)
- [Wider mobile, 430](screenshots/after-meaning-430.png)
- [Direct Expand, 390](screenshots/after-direct-expand-390.png)
- [Bookmark selected, 390](screenshots/after-bookmark-selected-390.png)
- [Scroll Edge inactive, 390](screenshots/after-scroll-edge-inactive-390.png)
- [Continue action, 390](screenshots/after-continue-390.png)
- [Landscape, 844 x 390](screenshots/after-meaning-landscape-844.png)
- [iPad, 1112 x 834](screenshots/after-meaning-ipad-1112.png)
- [Desktop, 1440 x 900](screenshots/after-meaning-desktop-1440.png)
- [Desktop, 1920 x 1080](screenshots/after-meaning-desktop-1920.png)
- [Reduced motion](screenshots/after-meaning-reduced-motion-390.png)
- [High contrast](screenshots/after-meaning-high-contrast-390.png)
- [Scroll Edge active under sticky Detail](screenshots/after-scroll-edge-active-1112.png)

## Observed R1 changes

- The single-item More control and popover path are gone; `扩展理解` is a direct, visible Regular action beside Back and Continue.
- Study functional controls share the Regular material identity. Bookmark selection changes only tint/state, never the Glass variant.
- Icon-only controls are circular. The normal Glass edge has one physical rim; refraction is a localized interior treatment without a second border.
- Touch feedback is anchored to the contact point, while pen and mouse use lighter progressive pointer-follow feedback. Reduced Motion removes pointer-follow and scale while retaining state/luminance feedback.
- The Scroll Edge is absent in the non-sticky Meaning dock and appears only while the sticky Detail dock physically overlaps the sentinel/content region.
- Background photos retain scene character through neutral, scene-adaptive contrast treatment. Meaning remains an opaque, stable semantic surface with no `backdrop-filter`, pointer light, or nested Glass.
