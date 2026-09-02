# CET6 Focus v1.5 Quality Hardening — Final Report

Status: `R1 PASS`

Merge readiness: `READY_FOR_FINAL_REVIEW`

This report records the authorized Scope Approval, Planning Merge, Quality Hardening Implementation, and R1 Settings Import Accessibility Semantic Cleanup phases. The implementation remains PR-only: no implementation merge, deployment, v1.5 tag, or GitHub Release is authorized in this phase.

## 1. Execution boundary

The latest pasted implementation handoff superseded the earlier docs-only Scope Finalization boundary. Work stayed limited to `P2-TYPO-001`, `P2-A11Y-001`, and `P3-COVERAGE-001`; no unrelated product feature, Study/Review behavior, FSRS logic, vocabulary, PWA, Motion, or visual-system redesign was added.

## 2. Planning PR pre-merge state

PR #6 was verified open, mergeable, based on `main`, and pointed at `4d7ec41e72a9cc086cd44577c7c7881570e36f16`. Its two quality and two E2E checks were successful, and its cumulative diff contained planning/audit artifacts only.

## 3. Planning merge

PR #6 was squash-merged into `main` as `e7df353ae7a912f78087634d34ee1253ea240c32`.

## 4. Post-merge main verification

Main quality workflow run `33614000572` was successful. Quality job `100195516050` and E2E job `100195516296` were both successful. The existing Pages workflow run `33614000623` was automatically triggered by the earlier planning merge; this implementation phase did not issue a deployment command.

## 5. Implementation base

Branch: `product/v1.5-quality-hardening`

Base: latest verified main commit `e7df353ae7a912f78087634d34ee1253ea240c32`.

## 6. Approved scope map

| ID | Approved outcome | Implementation evidence |
| --- | --- | --- |
| P2-TYPO-001 | Actionable audio labels are at least 12px | `src/styles/global.css`, `src/styles/learning-experience.css` |
| P2-A11Y-001 | Settings import keeps one visible semantic trigger; hidden input is not independently exposed | `src/features/settings/Settings.tsx`, focused E2E assertion |
| P3-COVERAGE-001 | Weak Words and Dictation have deterministic isolated non-empty fixture coverage | `tests/e2e/readability/quality-hardening-fixtures.ts`, `quality-hardening.spec.ts` |

## 7. P2-TYPO-001 result

The shared audio control and the learning-shell audio control now use `12px`. No passive metadata labels or frozen typography system were changed.

## 8. P2-A11Y-001 result

Before R1, the visible `导入 JSON 备份` button was the sole intended semantic entry, while a post-mount effect removed the native input from the tab sequence and accessibility tree. R1 replaces that imperative setup with a declarative native `hidden` file input; the visible button and the existing click/file-chooser path remain unchanged.

## 9. P3-COVERAGE-001 result

The new test-only fixture helper seeds three active Weak Words with distinct signals (重点、拼写、近期 Again) and three encountered Dictation cards. It writes only into the isolated browser IndexedDB context created by the E2E fixture and never changes runtime defaults or product data.

## 10. Regression coverage

The existing `Backup restore preserves fields and reloads through vocabulary reconciliation` test remained in the full suite and passed. No backup/import runtime code was modified.

## 11. Determinism and isolation

Fixture IDs are stable, fixture ordering is stable, and each project starts with the existing isolated database reset. The fixture data is non-empty by construction and is not used as training or production vocabulary data.

## 12. Screenshot evidence

Nine screenshots were captured across Chromium, Mobile, and WebKit Readability for Weak Words, Dictation, and Settings import accessibility. They are listed in `QUALITY_HARDENING_VALIDATION.json` and stored under `audit/v1.5-quality-hardening/screenshots/`.

## 13. Vocabulary validation

`pnpm vocab:validate` passed. The existing policy reports 2,219 unique entries, 990 quality-approved entries, 100% provenance for approved Context, Round 5 Phase A semantic pass 100%, severe inappropriate 0, and blind validation semantic pass 100%, severe inappropriate 0. Quality-approved coverage is 44.6% versus the informational 55% target; no minimum coverage blocker applies under the repository policy.

## 14. Typecheck and lint

`pnpm typecheck` passed and `pnpm lint` passed.

## 15. Unit tests

`pnpm test` passed: 14 test files and 34 tests.

## 16. Production build

`pnpm build` passed. Vite emitted the existing main-chunk size advisory only; it did not fail the build.

## 17. Browser gates

The focused hardening suite passed 9/9 across Chromium, Mobile, and WebKit Readability. The final full `pnpm test:e2e:serial` run passed 98, skipped 25 by existing project/test selection rules, and failed 0. It covered Chromium, Mobile, WebKit Motion, and WebKit Readability, including the existing Backup/Import regression and the new hardening tests. A first full run had one WebKit click-stability timeout; the isolated retry passed, and a second full run was clean.

## R1 Settings Import Accessibility Semantic Cleanup

- Before: `useEffect` applied `tabIndex=-1` and `aria-hidden=true` after mount.
- After: `Settings.tsx` declares the native file input as `hidden` on first render and removes the `sr-only` class from that input.
- `useEffect` removed: **YES**. No `aria-hidden`, `tabIndex=-1`, or mount-time DOM mutation remains for the file input.
- Visible semantic trigger: exactly **1**, the named `导入 JSON 备份` button; it remains visible and focusable.
- Keyboard trigger: **PASS**; Enter opened a real Playwright filechooser in Chromium, Mobile, and WebKit Readability.
- Pointer/filechooser: **PASS**; pointer activation opened a real Playwright filechooser in all three focused projects.
- Focused E2E: **9/9 PASS** across Chromium, Mobile, and WebKit Readability.
- Backup/Restore regression: **PASS** in the full serial suite; no backup runtime, schema, validation, reload, or database code was changed.
- Final local serial E2E: **98 passed / 25 skipped / 0 failed**. The first R1 run exposed one existing Chromium Motion visibility flake; the isolated retry passed, and the final full rerun was clean. The earlier WebKit transient history remains recorded above.
- GitHub Actions for the R1 implementation Head: both duplicate `quality` and both duplicate `e2e` jobs passed. The final documentation Head was revalidated separately before delivery.

## 18.5. R1 freeze confirmation

Vocabulary remained 2,219 entries; quality-approved Context remained 990 (44.6%); approved provenance remained 100%. Typography remained at the already-passed 12px threshold. Weak/Dictation fixture logic remained unchanged. Motion, Study, Review, FSRS, ReviewLog, Context, vocabulary, database schema, PWA, and unrelated CSS/product files were not modified in R1.

## 19. Delivery boundary

The implementation branch was pushed and Implementation PR #7 was opened for review: https://github.com/justin2001tec-ops/cet6-focus/pull/7. The Implementation PR must remain `OPEN`. This phase ends before merge, deployment, `v1.5.0` tag creation, and GitHub Release creation.

R1 implementation code/test head: `2fd20b5`. The final PR Head is the documentation commit shown by the PR after the final GitHub revalidation. No merge, deployment, `v1.5.0` tag, or GitHub Release was performed.
