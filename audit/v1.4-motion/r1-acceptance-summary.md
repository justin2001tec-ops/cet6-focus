# v1.4 R1 Acceptance Fix Summary

## Scope

R1 is an acceptance-fix pass on PR #4, not a new design or feature round. The v1.3 Home IA, Study/Review learning flow, FSRS behavior, Context corpus, PWA behavior, and route contracts remain frozen.

- Branch: `product/v1.4-system-experience-motion`
- Pull request: `#4`
- DB decision: Path A — the non-Motion DB/migration optimization was reverted; no performance exception is retained.
- Release boundary: PR remains open; no merge, deployment, or `v1.4.0` tag.

## Acceptance corrections

- CI now installs both Chromium and WebKit for the actual Playwright projects; the E2E job timeout is 20 minutes.
- `domMax` is used by `LazyMotion` so shared `layoutId` behavior is supported by the configured feature bundle.
- App setting and OS preference resolve to one effective reduced profile across MotionConfig, CSS, route, shared-layout, press, and sheet behavior.
- Background transitions use decode-before-add, generation guards, a two-layer maximum, and explicit settled cleanup.
- PhysicalSheet uses MotionValue geometry, true release velocity handoff, completion-gated close/history cleanup, pointercancel, lost-capture, and orientation recovery.
- Home Learn/Review use the bounded press primitive; fine/coarse press scales are `.99`/`.975`.
- Rapid navigation, shared layout, reduced toggle, background retargeting, Study fast ratings, Undo during transition, pointercancel, orientation, sheet velocity, Back, focus, zoom, and long-task checks are covered by real E2E assertions.

## Local verification

Final independent motion command:

```text
pnpm run test:e2e tests/e2e/motion/v1.4-system.spec.ts --project=chromium --project=mobile --project=webkit-motion --workers=1 --timeout=90000 --reporter=line
```

Result: **29 passed, 1 conditional skip, 0 failed**. The one skip is the documented mobile shared-layout case because mobile vocabulary presents the PhysicalSheet; the full shared-layout route is exercised on Chromium and WebKit.

The complete local command set is now recorded in `r1-ci-status.json`: vocabulary validation, typecheck, lint, unit, build, and serial E2E all passed; the only non-test result is the documented informational vocabulary coverage note.
