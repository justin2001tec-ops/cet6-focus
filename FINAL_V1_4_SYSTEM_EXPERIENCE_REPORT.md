# CET6 Focus v1.4 — Final System Experience & Motion Report

## Delivery status

**READY FOR REVIEW — PR ONLY**

- Branch: `product/v1.4-system-experience-motion`
- PR title: `feat: introduce system experience and motion design for v1.4`
- Merge: **not performed**
- Deployment: **not performed**
- `v1.4.0` tag: **not created**

This report closes the seven-phase v1.4 implementation requested by the Master Handoff. After the PR is opened, modification stops pending visual and code acceptance.

## What changed

The work builds a system behavior model rather than applying animation everywhere:

- Added a Motion for React foundation with `LazyMotion strict`, user/system reduced-motion handling, real `full`/`reduced` profiles, input-modality detection, route intent IDs, semantic route presets, and shared Vocabulary → Word Detail identity.
- Added `ApplePressable`, `ReadingSurface`, `GlassBar`, and `GlassControl` primitives without replacing the existing product architecture.
- Made route changes immediate and single-node: latest navigation intent wins, no exit queue, no duplicate Study/Review DOM during fast navigation.
- Rebuilt PhysicalSheet interaction around direct geometry updates, pointer capture plus WebKit-safe window listeners, pointercancel/lost-capture/orientation recovery, Escape, browser Back, focus trap/restoration, offset threshold `32%`, and velocity threshold `720 px/s`.
- Reworked background changes as decode-before-crossfade double buffering with a hard maximum of two full-screen layers; Study uses no scale/parallax.
- Applied reading surfaces and material geometry only where they improve comprehension; Study/Review IA and all v1.3 product/data contracts remain frozen.
- Reduced repeated Study queue work by using IndexedDB `due` and ordered `wordId` queries and the active-word ID cache, keeping FSRS outputs unchanged.
- Made restored legacy settings current at the end of backup restore so the reconciliation marker cannot be observed during the reload window.

## Seven-phase completion

| Phase | Result |
| --- | --- |
| 1. Foundation | PASS |
| 2. Micro Interaction | PASS |
| 3. Navigation Continuity | PASS |
| 4. Physical Overlays | PASS |
| 5. Material & Geometry | PASS |
| 6. Background & Study Polish | PASS |
| 7. Performance & Accessibility | PASS |

## Final gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Vocabulary validation | PASS | 2,219 unique entries; 990 quality-approved Context entries; 100% provenance; Round 5 semantic gates remain green. 44.6% coverage is informational under the frozen Round 5 policy. |
| TypeScript | PASS | `pnpm typecheck` |
| Lint | PASS | `pnpm lint` |
| Unit | PASS | `pnpm test` — 14 files, 34 tests |
| Production build | PASS | `pnpm build`; only a non-blocking existing-style >500 kB chunk warning |
| Full serial E2E | PASS | `pnpm test:e2e:serial` — 47 passed, 16 project-conditional skips |
| Motion suite | PASS | Chromium + mobile + WebKit — 15/15 passed |
| WebKit/Safari behavior | PASS | WebKit motion project — 5/5 passed, including PhysicalSheet, reduced motion, focus/zoom, long-task/background budget |
| Long-task budget | PASS | Final successful motion runs recorded zero motion-period tasks over 50 ms |
| Background memory | PASS | Rendered and decoded full-screen background layers capped at 2; Study transform/parallax is `none`/0px |
| Accessibility behavior | PASS | Reduced motion, keyboard focus, coarse/fine modality, 200% effective zoom, dialog semantics, focus trap/restoration, Escape and browser Back covered |

The handoff's INP p75 ≤200 ms remains the product budget. This local evidence package records the interaction/long-task gates and does not claim a statistically valid percentile from a single local run; see `audit/v1.4-motion/performance-summary.json`.

## Audit and screenshots

The complete review package is in [`audit/v1.4-motion/`](audit/v1.4-motion/):

- `motion-system-summary.md`
- `motion-token-dump.json`
- `input-modality-matrix.md`
- `reduced-motion-matrix.md`
- `performance-summary.json`
- `rapid-interaction-results.json`
- `background-memory-report.json`
- `screenshots/motion-home-desktop.png`
- `screenshots/motion-study-recall-desktop.png`
- `screenshots/motion-study-context-desktop.png`
- `screenshots/motion-physical-sheet-mobile.png`
- `screenshots/motion-reduced-study-mobile.png`

## Deliberate non-goals preserved

No new social/backend/AI/dashboard redesign, Context expansion, Study/Review IA rewrite, FSRS change, PWA business change, whole-site animation pass, full-screen blur/zoom/parallax, GSAP, React Canary, or View Transition dependency was introduced.

## Release boundary

The branch is ready for reviewer inspection. The only next external action is opening the PR. Do not merge, deploy, or create `v1.4.0` until visual/code acceptance explicitly authorizes it.
