# CET6 Focus v1.5.0 Release Evidence

Status: **PASS**

This directory is the report/evidence package for the v1.5.0 Final Merge & Release. It was collected after PR #7 was merged and before the annotated tag was created. The release evidence is intentionally separate from `audit/v1.5-quality-hardening/`.

The product scope is frozen at the accepted v1.5 implementation plus the single release-prep PWA shell-v8 bump. No source, CSS, Settings, Motion, FSRS, Context, DB, vocabulary, or background asset was changed for this evidence commit.

## Evidence sources

- Repository: `https://github.com/justin2001tec-ops/cet6-focus`
- PR #7: `https://github.com/justin2001tec-ops/cet6-focus/pull/7`
- Production: `https://justin2001tec-ops.github.io/cet6-focus/`
- Local final serial gate: `98 passed / 25 skipped / 0 failed`
- Final PR GitHub CI: quality and E2E Green; the first pull-request E2E timeout was rerun in isolation and passed.
- Post-merge main quality and Pages workflows: Green.

## Browser and data boundary

Online runtime smoke used a fresh agent-created audit tab with no production fixture injection. A current-state backup was exported before import testing. The valid backup, malformed JSON, and schema-invalid JSON were temporary local files and are not committed here. The valid backup contained schema 1, 2,219 cards, 16 review logs, and 27 sessions.

The deterministic non-empty Weak Words and Dictation checks remain test-only E2E evidence; production was checked only with its existing runtime state.

## Screenshot index

- `screenshots/study-audio-mobile.png`
- `screenshots/word-detail-audio-mobile.png`
- `screenshots/settings-import-mobile.png`
- `screenshots/settings-import-desktop.png`
- `screenshots/weak-words-runtime.png`
- `screenshots/dictation-runtime.png`
- `screenshots/settings-light.png`
- `screenshots/settings-dark.png`

