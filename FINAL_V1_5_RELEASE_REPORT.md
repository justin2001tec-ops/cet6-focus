# CET6 Focus v1.5.0 Final Merge & Release Report

Status: **PASS — release gates satisfied**

Date: 2026-09-02

## Release identity

- Repository: [justin2001tec-ops/cet6-focus](https://github.com/justin2001tec-ops/cet6-focus)
- Production: [CET6 Focus v1.5.0](https://justin2001tec-ops.github.io/cet6-focus/)
- Implementation PR: [#7](https://github.com/justin2001tec-ops/cet6-focus/pull/7), merged by squash
- Accepted implementation Head: `a7d10c671221bd5dba3c281e190fedf756ebcbaf`
- Final PR Head after the shell-v8 release-prep bump: `98576f311e1ca43e094984065ad0047a399867ea`
- Shell-v8 release-prep commit: `98576f311e1ca43e094984065ad0047a399867ea`
- Squash merge SHA: `31c5506f8df172c11f947090f89eca5d3edd1524`
- Release evidence commit SHA: recorded in `audit/v1.5-release/release-identity.json` and the final delivery response after commit creation.
- Annotated `v1.5.0` tag object SHA and target commit SHA: recorded after tag creation in the final delivery response; the target is the final report/evidence commit, not the accepted Head, PR Head, or squash SHA.

## Scope and decisions

- Approved P1: **0**.
- Product P2: `P2-TYPO-001`, `P2-A11Y-001`.
- QA P2: `P3-COVERAGE-001`.
- Rejected: `P1-CAND-001`.
- Backlog limitations retained: Safari true browser/page zoom and Windows hash normalization.
- The only product change after accepted Head was the release-prep PWA shell cache-name bump from `cet6-focus-shell-v7` to `cet6-focus-shell-v8`. No feature scope was added.

## Gate results

| Gate | Result | Evidence |
| --- | --- | --- |
| Final PR local quality | PASS | `vocab:validate`, typecheck, lint, unit tests, build |
| Final PR focused hardening | PASS | 9/9 across Chromium, Mobile Chromium, WebKit |
| Final PR full serial E2E | PASS | 98 passed / 25 skipped / 0 failed |
| PR #7 GitHub CI | PASS | quality and E2E Green; isolated retry after transient timeout also Green |
| Squash merge | PASS | `31c5506f8df172c11f947090f89eca5d3edd1524` |
| Main CI | PASS | [run 33643448708](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/33643448708) |
| Pages deployment | PASS | [run 33643448810](https://github.com/justin2001tec-ops/cet6-focus/actions/runs/33643448810) |
| Audio typography | PASS | Study and Word Detail actionable labels are 12px, readable and in bounds |
| Settings import | PASS | One visible named button; hidden native input; pointer chooser; local keyboard E2E |
| Import rejection | PASS | malformed JSON and schema-invalid JSON show notices without changing data |
| Backup/restore | PASS | export, auto-backup, confirmation, restore, reload and vocabulary reconciliation |
| Weak Words / Dictation | PASS | deterministic non-empty local fixtures plus non-empty production runtime smoke |
| Theme/readability | PASS | Light, Dark, System, responsive and screenshot evidence |
| Motion/Study/FSRS/Undo | PASS | rating 1/2/3, stage transition, Undo, PhysicalSheet, Reduced Motion, rapid navigation |
| Vocabulary/data freeze | PASS | 2,219 words; 990 approved Context records; provenance 100%; canonical online records identical |
| PWA/offline | PASS | shell-v8, generic old-cache cleanup, warm-cache offline reload |
| Background assets | PASS | 14 AVIF + 14 WebP = 28/28 HTTP 200 |
| Critical console/network | PASS | online captured errors/warnings 0; no persistent critical 5xx |

## Online Settings import evidence

A current state export was completed before import testing. Three temporary files were used only in the browser audit tab and were not added to the repository:

1. Valid current-state CET6 Focus backup: schema 1, 2,219 cards, 16 review records, 27 sessions.
2. Malformed JSON: rejected with `无法读取这个 JSON 文件。现有数据没有改变。`.
3. Syntax-valid schema-invalid JSON (`schemaVersion: 999`): rejected with `不支持的备份版本：999`.

The valid file opened the confirmation summary, Cancel closed it with unchanged state, Confirm Restore completed, the page reloaded, and subsequent Weak Words/Dictation routes reconciled normally. Local full E2E supplies the authoritative keyboard chooser evidence across Chromium, Mobile Chromium, and WebKit; the online audit supplied the pointer chooser evidence and confirmed the single accessible entry point.

## Historical transient handling

The earlier WebKit visibility transient and the R1 Chromium Motion visibility transient are preserved in the prior hardening report. The final run history is explicit: the first PR pull-request E2E job timed out, the failed job was rerun in isolation and passed, and the final local serial suite remained 98 passed / 25 skipped / 0 failed. No transient was hidden or reclassified as a product failure.

## Release-only boundary

The report/evidence commit contains only `FINAL_V1_5_RELEASE_REPORT.md` and `audit/v1.5-release/**`. It does not modify `src/**`, `public/sw.js`, `public/data/**`, CSS, Settings, Motion, FSRS, Context, DB, vocabulary, or background assets. The three temporary JSON files are outside the commit and can be removed after audit retention is no longer needed.

## Tag and GitHub Release

The annotated `v1.5.0` tag is created only after this report/evidence commit and the report-only main CI/Pages checks are Green. Historical tags `v1.0.0` through `v1.4.1` are verified unchanged. The final annotated tag object SHA, peeled target SHA, and published GitHub Release URL are recorded in the final delivery response and in the release identity evidence after the tag gate.

