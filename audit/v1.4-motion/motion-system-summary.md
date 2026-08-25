# CET6 Focus v1.4 — System Experience & Motion Summary

## Scope

This release establishes an Apple-like interaction model across the existing CET6 Focus product surface. It is intentionally not a whole-site animation pass and does not replace the v1.3 visual language with a Liquid Glass skin.

Frozen v1.3 contracts remain intact: Home information architecture, Study/Review Recall → Context → Meaning → Detail → Complete, FSRS and IndexedDB behavior, Context content and curation, PWA behavior, and all existing routes.

## Behavior model

| Principle | Implementation evidence |
| --- | --- |
| Immediate | Route intent is marked before navigation; old route content unmounts immediately and the new semantic surface begins its entry state. Press feedback uses a bounded transform and never queues. |
| Continuous | PhysicalSheet writes `--sheet-offset` directly during pointer movement; it does not call React state from the pointermove loop. Backgrounds use a two-layer decoded crossfade. |
| Interruptible | PhysicalSheet handles pointercancel, lostpointercapture, orientation changes, Escape, backdrop close, and browser Back. |
| Velocity-aware | Sheet dismissal occurs at offset >32% of sheet height or downward velocity >720 px/s; otherwise it snaps back. |
| Quiet | Learning routes use opacity-only entry; Study background scale and parallax are frozen at 0px/none; full-screen blur/zoom/parallax was not introduced. |

## Architecture delivered

- `AppMotionProvider`, `LazyMotion strict`, and an effective `MotionConfig` policy: app setting `always`, OS-only `user`.
- `MotionRoute`, `useNavigationMotion`, `useInputModality`, and `useMotionProfile`.
- `MotionProfile` is an actual `full` / `reduced` profile driven by user and system settings.
- Semantic route motion plus Vocabulary row → Word Detail shared entity identity.
- `ReadingSurface`, `GlassBar`, `GlassControl`, and `ApplePressable` primitives.
- `PhysicalSheet` with focus trap/restoration, history integration, pointer capture, and direct geometry updates.
- Double-buffered local background layers with decode-before-crossfade and a hard two-layer cap.

## Seven phases

1. Foundation — complete.
2. Micro Interaction — complete.
3. Navigation Continuity — complete.
4. Physical Overlays — complete.
5. Material & Geometry — complete.
6. Background & Study Polish — complete.
7. Performance & Accessibility — complete after the final gates below.

## Evidence package

- `motion-token-dump.json`
- `input-modality-matrix.md`
- `reduced-motion-matrix.md`
- `performance-summary.json`
- `rapid-interaction-results.json`
- `background-memory-report.json`
- `screenshots/`

## R1 acceptance correction evidence

- `r1-acceptance-summary.md` records the bounded R1 scope and correction decisions.
- `r1-shared-layout.json` records real full/reduced Vocabulary → Word Detail checks with `domMax`.
- `r1-sheet-physics.json` records MotionValue drag, velocity handoff, completion-gated history cleanup, and interruption checks.
- `r1-background-lifecycle.json` records idle/crossfade/rapid-retarget layer bounds.
- `r1-reduced-motion.json` records the unified app/system effective profile.
- `r1-rapid-interaction.json` records rapid route, Study/Undo, press, and interruption checks.
- `r1-db-performance-exception.md` records Path A: `REVERTED — no exception retained`.

The first R1 GitHub E2E attempt exposed that the workflow installed Chromium while declaring WebKit. The workflow now installs both browser dependencies; final remote status is recorded only after the updated PR checks complete.

## Explicit limits

The WebKit motion suite uses a warmed IndexedDB fixture so it measures interaction behavior rather than the separate v1.3 static vocabulary bootstrap. The normal Chromium/mobile business suite still covers the production cold onboarding path. No production deployment or tag was created in this task.
