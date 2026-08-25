# CET6 Focus v1.4 — Final System Experience & Motion Report

## Delivery status

**READY FOR REVIEW — PR ONLY**

- Branch: `product/v1.4-system-experience-motion`
- PR title: `feat: introduce system experience and motion design for v1.4`
- Merge: **not performed**
- Deployment: **not performed**
- `v1.4.0` tag: **not created**

This report closes the seven-phase v1.4 implementation requested by the Master Handoff. After the PR is opened, modification stops pending visual and code acceptance.

## R1 Acceptance Corrections

R1 was limited to acceptance fixes on the existing PR. The initial GitHub E2E attempt failed because the workflow declared `webkit-motion` but installed Chromium only; the workflow now installs both Chromium and WebKit and allows the E2E job 20 minutes. The first WebKit-enabled remote rerun then exposed a Safari CI fixture issue: IndexedDB was initialized from a JSON MIME document. The fixture now seeds from a same-origin HTML document with the app entry blocked and derives the vocabulary URL from the Vite entry script, so the GitHub `/cet6-focus/` base path is respected while the real product WebKit checks remain intact. The final head `2fb96ec0d1d81381d9175e8e629b7a2586106098` completed all four GitHub Actions checks successfully. The following corrections were then independently exercised locally:

- `LazyMotion` now uses `domMax` with `LayoutGroup`, and Vocabulary → Word Detail shared identity is asserted through a real full-profile transition plus a reduced fallback.
- App reduced motion and the OS preference resolve to one effective profile used by MotionConfig, CSS, route, shared layout, press, and sheet behavior.
- Background lifecycle now guards stale generations and settles from a maximum of two layers to one; rapid A → B → C retargeting is covered.
- PhysicalSheet opening, MotionValue drag, release velocity handoff, pointercancel/orientation recovery, browser Back, focus, and completion-gated history cleanup are covered.
- Home Learn/Review use the PressableLink primitive with fine `.99` and coarse `.975` press scales; WebKit verifies real computed transform feedback.
- Rapid Study ratings and Undo during transition are covered without changing FSRS behavior.
- The DB/migration scope decision is Path A: `src/db/db.ts` and `src/lib/migration.ts` optimization changes were reverted; `REVERTED — no exception retained` is recorded in the audit package.

## What changed

The work builds a system behavior model rather than applying animation everywhere:

- Added a Motion for React foundation with `LazyMotion strict` + `domMax`, user/system reduced-motion handling, real `full`/`reduced` profiles, input-modality detection, route intent IDs, semantic route presets, and shared Vocabulary → Word Detail identity.
- Added `ApplePressable`, `PressableLink`, `ReadingSurface`, `GlassBar`, and `GlassControl` primitives without replacing the existing product architecture.
- Made route changes immediate and single-node: latest navigation intent wins, no exit queue, no duplicate Study/Review DOM during fast navigation.
- Rebuilt PhysicalSheet interaction around direct geometry updates, pointer capture plus WebKit-safe window listeners, pointercancel/lost-capture/orientation recovery, Escape, browser Back, focus trap/restoration, offset threshold `32%`, and velocity threshold `720 px/s`.
- Reworked background changes as decode-before-crossfade double buffering with a hard maximum of two full-screen layers; Study uses no scale/parallax.
- Applied reading surfaces and material geometry only where they improve comprehension; Study/Review IA and all v1.3 product/data contracts remain frozen.

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
| Full serial E2E | PASS | `pnpm test:e2e:serial` — 61 passed, 17 project-conditional skips |
| Motion suite | PASS | Chromium + mobile + WebKit — 29 passed, 1 documented mobile conditional skip, 0 failed |
| WebKit/Safari behavior | PASS | WebKit motion project — 10/10 passed, including shared layout, PhysicalSheet, reduced motion, focus/zoom, long-task/background budget |
| GitHub Actions | PASS | Final head `2fb96ec0d1d81381d9175e8e629b7a2586106098`: 4/4 quality and serial E2E checks successful |
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
- `r1-acceptance-summary.md`
- `r1-ci-status.json`
- `r1-shared-layout.json`
- `r1-sheet-physics.json`
- `r1-background-lifecycle.json`
- `r1-reduced-motion.json`
- `r1-rapid-interaction.json`
- `r1-db-performance-exception.md`
- `r1-db-parity.json`
- `screenshots/motion-home-desktop.png`
- `screenshots/motion-study-recall-desktop.png`
- `screenshots/motion-study-context-desktop.png`
- `screenshots/motion-physical-sheet-mobile.png`
- `screenshots/motion-reduced-study-mobile.png`

## Deliberate non-goals preserved

No new social/backend/AI/dashboard redesign, Context expansion, Study/Review IA rewrite, FSRS change, PWA business change, whole-site animation pass, full-screen blur/zoom/parallax, GSAP, React Canary, or View Transition dependency was introduced.

## Release boundary

PR #4 is ready for reviewer inspection and remains open. R1 work stops here. Do not merge, deploy, or create `v1.4.0` until visual/code acceptance explicitly authorizes it.
