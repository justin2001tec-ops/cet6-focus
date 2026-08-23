# CET6 Focus v1.2 BBDCD final report

## Delivery status

- Branch: `ui/bbdcd-benchmark-v1.2`
- Base: stable `v1.1.0` line; no changes to `main`
- PR: [#2 — BBDCD v1.2 immersive home benchmark](https://github.com/justin2001tec-ops/cet6-focus/pull/2)
- Merge: **NOT MERGED**
- Tag: **NO `v1.2.0` TAG**
- Acceptance state: **WAITING FOR VISUAL REVIEW**
- Deployment: not performed; the master handoff explicitly requires PR-only delivery before visual acceptance

## Implemented scope

### BBDCD home

- Replaced the old dashboard/KPI/sidebar/large-panel home with the requested hierarchy: full-screen local photography → one featured CET-6 word → Learn/Review cards → three-icon bottom navigation.
- Learn and Review are real routes (`/study`, `/review`) and show values derived from the existing dashboard summary; no FSRS or learning-data schema was changed.
- Featured words are selected from the local 2219-word dictionary and link to the existing word-detail route.
- Desktop and mobile crop positions are independent per scene; the home has no old sidebar, mobile topbar, four-tab mobile bar, dashboard hero, or KPI grid.
- Reduced-motion behavior and keyboard focus remain covered by the existing global accessibility rules; the new home uses no parallax, tilt, shimmer, ripple, or global shortcut.

### Visual Refinement Round 2

- Removed the home kicker/date, phonetic spelling, Chinese meaning, scene label/category, card icons, card subcopy, oversized KPI treatment, card arrows, outer glass capsule, and selected-state capsule.
- Featured Word now uses a modern system Sans stack, semibold/bold weight, restrained tracking and shadow, with the desktop visual center held around 28%–32% of the viewport.
- Learn and Review are now quiet two-column cards containing only the title and number, left-aligned, with a low-reflection dark translucent treatment and warm orange numbers.
- Rebuilt the bottom navigation as three independent low-contrast line icons distributed at approximately 8.5% / 50% / 91.5%; there is no outer container, glass plate, label, or icon background.
- Re-screened the local candidate pool to 14 scenes. Removed `stars-01`, `waterfall-01`, `waterfall-04`, `sheep-01`, `daisy-01`, and `lighthouse-01` for forest density, tourist/ordinary wallpaper feel, visual clutter, or weak subject framing; original source files remain retained for traceability.
- Tightened semantic featured-word matching for `beacon`, `waddle`, `eruption`, `daisy`, and `cascade`; no FSRS, IndexedDB, Today Flow, Study, Review, Dictation, or PWA business behavior was changed.

### Local background pool

- 14 selected scenes from the handoff candidate pool after Round 2 visual review.
- 14 local AVIF files and 14 local WebP files under `public/backgrounds/v1.2/`.
- 20 high-resolution originals retained under `data-source/backgrounds/v1.2/source/` for traceability; maximum individual source file is 13.37 MB.
- Source, author, license, dimensions, crop, semantic tags, and rejection notes are recorded in `BACKGROUND_SOURCES.md`.
- No runtime external image URL; the Pexels candidate was not included after a 403 source check, and the unavailable Unsplash volcano candidate was not included after a 404 source check.

### Stable application behavior

- Random mode remains session-stable and avoids the previous scene when selecting a new one.
- Fixed mode uses the selected local scene and persists across reloads.
- Off mode renders a quiet plain background without an image element.
- Service-worker shell cache advanced from `cet6-focus-shell-v3` to `cet6-focus-shell-v4`; activation removes older shell caches while preserving the existing base/scope behavior.
- Existing Study, Review, Today Flow, Dictation, Vocabulary, Weak Words, Undo, Backup/Restore, and settings flows remain in the route tree and are covered by regression tests.

## Verification evidence

| Gate | Result |
| --- | --- |
| `pnpm vocab:validate` | PASS — 2219 unique CET-6 entries; missingMeaning=0 |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS — 10 files / 23 tests |
| `pnpm test:e2e:serial` | PASS — 18 passed / 16 intentional skips across 34 configured tests |
| `pnpm build` | PASS — Vite production build |
| Production PWA offline preview | PASS — warm service-worker reload and vocabulary cache |
| `pnpm capture:bbdcd` | PASS — 10 screenshots; 0 console errors; 0 page errors |

The BBDCD E2E contract checks the required 375/390/430 iPhone widths, 768/834 iPad widths, and 1366/1440/1920 desktop widths for horizontal and vertical overflow, in addition to verifying local Fixed/Off behavior and real Learn/Review navigation.

The final reproducible E2E gate used the repository's existing serial mode because the default 12-worker run showed transient initialization races in unrelated mobile presentation/settings tests; those same tests passed in targeted and serial reruns. The explicit PWA warm-cache/offline test passed separately in both Chromium and mobile projects.

## Visual audit files

Required screenshots are in `audit/bbdcd-v1.2/` (desktop captures are 1920×1080):

- `home-desktop-aurora.png`
- `home-desktop-plateau.png`
- `home-desktop-lighthouse.png`
- `home-desktop-waterfall.png`
- `home-desktop-animal.png`
- `home-iphone-390.png`
- `home-iphone-430.png`
- `home-ipad.png`
- `home-background-off.png`
- `study-after-home-redesign.png`

`v1.1-baseline-online.png` is retained beside them for before/after comparison only.

## Visual Refinement Round 2 acceptance state

- R2 screenshots regenerated after the final build: 10 files, 0 console errors, 0 page errors.
- Browser DOM/layout review confirmed zero legacy home elements, no horizontal/vertical overflow at required sizes, and a transparent borderless bottom navigation.
- Current state remains **OPEN / NOT MERGED / NO `v1.2.0` TAG / WAITING FOR FINAL VISUAL REVIEW**.

## Explicit handoff boundary

This branch is prepared for visual and code acceptance. PR [#2](https://github.com/justin2001tec-ops/cet6-focus/pull/2) is **OPEN / NOT MERGED / NO `v1.2.0` TAG / WAITING FOR VISUAL REVIEW** until the owner approves the screenshots and behavior. No GitHub Pages deployment was made because that would exceed the master handoff’s PR-only acceptance stage.
