# CET6 Focus v1.1.0 Final Release Report

**Release date:** 2026-08-23  
**Release status:** SHIPPED  
**Release focus:** iOS 26-inspired Liquid Glass presentation-layer redesign

## Final delivery

- Repository: [justin2001tec-ops/cet6-focus](https://github.com/justin2001tec-ops/cet6-focus)
- Pull request: [#1 — UI: iOS 26 Liquid Glass](https://github.com/justin2001tec-ops/cet6-focus/pull/1) — **MERGED**
- Squash merge commit on `main`: `7aa93ea1caf67f6621878ea5f8737407c6d16070`
- Immutable annotated tag: [`v1.1.0`](https://github.com/justin2001tec-ops/cet6-focus/releases/tag/v1.1.0)
- Production site: [https://justin2001tec-ops.github.io/cet6-focus/](https://justin2001tec-ops.github.io/cet6-focus/)
- Online evidence script: [`scripts/verify-online-v1.1.mjs`](https://github.com/justin2001tec-ops/cet6-focus/blob/main/scripts/verify-online-v1.1.mjs)
- Online screenshot: [`audit/screenshots/online-v1.1-smoke.png`](https://github.com/justin2001tec-ops/cet6-focus/blob/main/audit/screenshots/online-v1.1-smoke.png)

## CI and deployment evidence

| Gate | Result | Evidence |
|---|---|---|
| Main quality | PASS | [GitHub Actions run 32636280767](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/32636280767) · job 97186430035 |
| Main E2E | PASS | [E2E job 97186429895](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/32636280767/job/97186429895) · 28 tests: 15 passed, 13 skipped, 0 failed |
| GitHub Pages build | PASS | [Build job 97186430203](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/32636280787/job/97186430203) |
| GitHub Pages deploy | PASS | [Deploy job 97186506534](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/32636280787/job/97186506534) |

GitHub Pages deployment ID `6047386387` reported `state: success`, and its deployed SHA is exactly `7aa93ea1caf67f6621878ea5f8737407c6d16070`. The Pages environment is configured for `main`, workflow deployment, HTTPS, and the `/cet6-focus/` subpath.

## Production online smoke

The final run used a fresh Playwright Chromium context against the real Pages URL. It exited with code 0.

- First load returned HTTP 200.
- Manifest, service worker, vocabulary JSON, local background and icon all returned HTTP 200 under `/cet6-focus/`.
- Onboarding and Dashboard rendered.
- Direct Study wrote `ReviewLog` and `StudySession` records.
- Same-origin IndexedDB records survived a new production page reload.
- Undo restored the same word and removed the most recent `ReviewLog`.
- Dictation incremented the spelling signal while leaving the FSRS card and due date unchanged; it did not create a `ReviewLog`.
- Settings persisted daily new words, daily minutes, target retention and `en-GB` pronunciation.
- Light, dark and system themes applied; reduced-motion could be enabled and disabled.
- Backup export started successfully; fixed background persisted and survived reload.
- Full Today Flow completed in the required order: **Review → New Study → Dictation → Completion**.
- Full Today Flow wrote review, study and dictation sessions; dictation recorded `attempted: 2`, `correct: 0`, `wrong: 2`, `corrected: 2`; three `ReviewLog` records were present.
- `/mistakes`, `/stats`, `/settings`, desktop Word Detail and the `/words/:id` alias rendered.
- Mobile Vocabulary Bottom Sheet opened, kept the `#/words` URL and restored focus on close.
- CSS viewport checks passed at 375×812, 390×844 and 430×932 with no horizontal overflow and in-viewport top/bottom navigation.
- Service Worker controlled the reload, used scope `https://justin2001tec-ops.github.io/cet6-focus/`, and cached `cet6-focus-shell-v3` plus the vocabulary resource.
- Warm-cache offline reload rendered the Dashboard.
- Console errors: 0. Page errors: 0. Failed network requests: 0.

Screenshot evidence: [`audit/screenshots/online-v1.1-smoke.png`](./audit/screenshots/online-v1.1-smoke.png)

## Compatibility and protected behavior

The release keeps the protected learning contracts unchanged. The diff from `v1.0.0` to the tested runtime commit had no changes under `src/db`, `src/lib/fsrs`, `src/types` or `public/sw.js`. `v1.0.0` remains preserved and was not moved.

An actual pre-existing v1.0 browser profile was not available in this environment, so a direct old-profile upgrade was not reproduced. Same-origin production IndexedDB persistence was verified, and the unchanged database, FSRS, type and service-worker contracts mean no v1.1 data migration is required.

## Known limits / P2 notes

- Safe-area validation was performed with headless Chromium viewport and CSS geometry checks; physical iPhone Safari was not available for a device-level test.
- Offline validation was a warm-cache reload after the online shell and vocabulary had been cached; it was not a cold-start disconnected install.
- Web Speech pronunciation remains dependent on the browser and available voice implementation.
- The in-app Browser runtime was unavailable in this desktop environment, so the final online evidence used the project’s Playwright Chromium runner against the same production URL.

## Release verdict

```text
PR #1: MERGED
main: 7aa93ea1caf67f6621878ea5f8737407c6d16070
GitHub Actions quality: PASS
GitHub Actions E2E: PASS (15 passed / 13 skipped / 0 failed)
GitHub Pages: DEPLOYED
Online smoke: PASS
v1.0.0: preserved
v1.1.0: created
P0: 0
P1: 0
```

No unresolved P0/P1 issue was found. The release is ready for formal acceptance.
