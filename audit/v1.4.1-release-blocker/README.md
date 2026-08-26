# CET6 Focus v1.4.1 Motion Long Task Isolation

This audit isolates the release-blocker report from the product implementation. The triage started from `d81980b8bf547c4fcd5542912b5d6af5f5f3162c` on PR #5 (`fix/v1.4.1-learning-readability`).

## Scope

- Phase A reruns the original failing Motion test without code changes.
- Phase B separates Cold Route from the release-gating Warm Motion measurement.
- Warm Motion measures the second Home -> Study transition after a real return to a stable Home route.
- The strict threshold is `duration > 50ms`, with five clean Warm Motion runs required.
- Long-task records include `name`, `entryType`, `duration`, `startTime`, and attribution/container fields. Missing browser fields are recorded as the literal `NOT_AVAILABLE`.

## Local evidence

- `motion-long-task-reruns.json`: raw Phase A outcomes.
- `cold-route-performance.json`: informational first-route capture.
- `warm-motion-performance.json`: five-run Warm Motion gate.
- `motion-phase-attribution.json`: attribution schema and observed records.
- `github-ci-status.json`: GitHub Actions evidence for the pushed triage head.
- `final-triage-result.json`: the single final triage status.

The complete local serial run (`pnpm test:e2e:serial`) completed with `89 passed`, `25 skipped`, and `0 failed` in approximately 6.8 minutes. The existing Chromium, Mobile, and WebKit Motion cases passed; the new long-task triage tests intentionally run only on Chromium because that is the engine exposing the Long Tasks API used by this release gate.

The triage measurement head `6a65c0588f80d8304723f81f4857bf803af4facf` received two independent GitHub Actions Green runs (`32976173725` and `32976179271`), including successful `quality` and `e2e` jobs. The final result is `BLOCKER_CLEARED`.

The local Phase B gate uses DOM and transition markers (`data-motion-route`, stable computed transform/opacity, visible route content, and `data-background-transition="settled"`) rather than a fixed wait as the completion condition. A 100ms post-settle drain is used only to allow observer delivery.

## Freeze and boundaries

Only `tests/e2e/motion/v1.4-system.spec.ts` and this audit directory are in scope. Motion, Study, CSS, PhysicalSheet, FSRS, Context, database, PWA, and background product code are unchanged. PR #5 must remain OPEN; this triage does not merge, deploy, tag, or release.
