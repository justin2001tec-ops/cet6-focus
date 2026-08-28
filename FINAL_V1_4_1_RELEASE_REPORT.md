# CET6 Focus v1.4.1 Final Merge & Release Report

Status: **PASS — final online audit and report-only CI/Pages gates passed; release evidence is ready for tagging**

Date: 2026-08-28

## 1. Merge result

PR #5, `fix/v1.4.1-learning-readability`, was squash-merged to `main` only after the exact-head gate passed.

- PR: [#5](https://github.com/justin2001tec-ops/cet6-focus/pull/5)
- Accepted Readability Head: `3f55bcbcc883b4b198bfbc3383c12907cd492cf9`
- PWA v7 Head: `d81980b8bf547c4fcd5542912b5d6af5f5f3162c`
- Triage Measurement Head: `6a65c0588f80d8304723f81f4857bf803af4facf`
- Final PR Head before merge: `0c54c10eef4b1eeaf17b904e88a8d28bd11050c6`
- Squash Merge SHA: `61207041510271267f99f61f0c80f6db3c85175d`
- Merged at: `2026-08-28T08:44:47Z`

No product code was changed after the accepted PR head. The report/evidence work is isolated from `src/**`, `public/sw.js`, `public/data/**`, CSS, Motion, Study, FSRS, Context, DB, and background assets.

## 2. Main CI and Pages after merge

- [main quality/e2e run 33156561011](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/33156561011): SUCCESS. Quality and e2e jobs passed; WebKit is included in the Playwright e2e matrix.
- [Pages run 33156560994](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/33156560994): SUCCESS. Build, artifact upload, and deploy passed.
- [report-only quality/e2e run 33161059497](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/33161059497): SUCCESS. Quality job `98815359366` and E2E job `98815359273` passed; WebKit is included in the Playwright e2e matrix.
- [report-only Pages run 33161059125](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/33161059125): SUCCESS. Build, artifact upload, and deploy passed for the report/evidence-only commit.

## 3. Online release audit

Deployed site: <https://justin2001tec-ops.github.io/cet6-focus/>

The final independent Chromium audit used a fresh isolated context from `2026-08-28T09:42:11.810Z` to `2026-08-28T09:43:14.851Z`. All 14 online gates passed. HTTP endpoints/assets were 200; the online vocabulary contained 2,219 entries, 990 entries with approved examples, and the data payload hash was `bf9fef2b9e9fa356254186c015bca3366210940058a5ec883fb55d6071e5f96f`. All 28 AVIF/WebP background assets were 200.

## 4. Readability and themes

- Light Context / Meaning / Detail: PASS; real example text rendered: “True friends never abandon each other.”
- Dark Detail and Meaning: PASS.
- System Light / System Dark: PASS.
- Light primary/secondary/accent contrast: `16.052 / 8.471 / 6.627`.
- Dark primary/secondary/accent contrast: `15.522 / 12.654 / 10.614`.
- `data-reading-tone=learning`, natural Detail page scroll, and no horizontal overflow: PASS.
- WebKit automated readability: PASS.

## 5. Layout, accessibility, and responsive evidence

- Background hierarchy: PASS; scrim order `0.26 < 0.42 < 0.54 < 0.64`, one decoded app background layer.
- Safe Area: PASS at 844×390 with independent 44px left/right simulation and zero collisions.
- Long word `characteristic`: PASS at 390×844; heading width 212/212 and CTA visible.
- 200% zoom: automated online layout PASS and true Chromium browser-level zoom PASS; Safari true browser zoom is `NOT_AVAILABLE` on Windows.
- Forced Colors: PASS; 2px surface border and 3px focus outline.
- `prefers-contrast: more`: PASS; primary/secondary/accent contrast `21 / 21 / 13.994`, 2px border, 3px focus outline.
- Required responsive/local coverage, including 390×667 natural scroll, 430×932, 852×393, iPad, and desktop: PASS.

## 6. Learning behavior

- Study: PASS.
- FSRS: PASS; rating created one ReviewLog and advanced the target card to state 1 / reps 1.
- Undo: PASS; restored `abandon` and removed the ReviewLog.
- Dictation: PASS; one wrong attempt, one correction, first-try correct 0, corrected 1, and no FSRS mutation from dictation.
- Local serial E2E reference: `89 passed / 25 skipped / 0 failed`.

## 7. Motion blocker history

The initial local cold-route measurement remains recorded as intermittent 165ms and 100ms long tasks. It was not rewritten as if it never happened. The warm Home → Study isolation gate then completed 5/5 clean with 0 tasks over 50ms and one decoded background layer per run. GitHub quality/e2e were SUCCESS, including WebKit coverage. Classification is `BLOCKER_CLEARED`; no Motion product-code change was required. The complete history remains in `audit/v1.4.1-release-blocker/**` and is referenced by `audit/v1.4.1-release/release-motion-triage-reference.json`.

## 8. PWA and offline

- `/sw.js`: PASS, `cet6-focus-shell-v7`.
- Simulated existing v6 cache: seeded and removed during v7 activation; only v7 remained.
- Warm cache: PASS.
- Offline reload with cached vocabulary: PASS.
- No second PWA bump was made in this release.

## 9. Report/evidence identity

- First report/evidence commit SHA: `b6da99b9b28e63e39f5c51d78855a579b48f592b`.
- Final Release Evidence Commit SHA / v1.4.1 tag target: this final report/evidence commit; the exact 40-character SHA is recorded by the annotated `v1.4.1` tag and GitHub Release receipt after this commit's final Green gates are verified.
- Historic v1.0.0–v1.4.0 tag object and target fingerprints are recorded in `audit/v1.4.1-release/release-identity.json`; no force tag or history rewrite is permitted.

## 10. Limitations and accepted P2

Safari true browser zoom cannot be validated in this Windows release environment; the expected value is `NOT_AVAILABLE`. WebKit automated readability is PASS. Audio-label typography remains slightly small (approximately 11px) as an accepted future v1.5 P2 and does not block release.

## Final decision

All product merge, main, online, and report-only Quality/E2E/Pages gates are PASS. After confirming the final evidence commit SHA and unchanged historic tag fingerprints, create annotated `v1.4.1` at this report/evidence commit and publish GitHub Release **CET6 Focus v1.4.1**. No further product-code change is permitted.
