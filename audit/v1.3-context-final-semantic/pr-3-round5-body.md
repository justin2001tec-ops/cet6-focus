## Round 5 history and Final Holdout Validation

**Current status: `HOLDOUT_EXHAUSTED`.** Round 5 semantic work is retained as historical evidence. Its final 100/100 retest used `priorBlindPassPairs`, so it is not an independent unseen holdout.

This update is limited to sentence-by-sentence Context review, durable curation, rebuild, and blind validation. UI, Motion, FSRS, Study/Review behavior, routes, and learning contracts remain frozen.

### Semantic result

- Initial Phase A: 300 reviewed; 214 PASS / 86 real FAIL; severe inappropriate 0.
- Mandatory recheck: 11/11 rejected and durably recorded.
- Final post-curation Phase A: 300/300 PASS; severe inappropriate 0.
- Round 5 final blind retest: 100/100 PASS; severe inappropriate 0; retained as historical retest evidence, not independent holdout evidence.
- Durable curation: 30 global rejects, 877 pair rejects, 350 new R5 pair rejects.
- Source remains the offline Tatoeba English CC0 snapshot; no authored, generated, or replacement example was added.
- Coverage is truthful at 990/2219 = 44.6% quality-approved and 70.4% raw candidate coverage. Round 5 has no minimum coverage blocker.

The first final blind sample exposed four IDs overlapping a regenerated R4 independent artifact. The sample was rebuilt with a new seed and revalidated; decisions were not edited to chase 100%.

### Final Holdout result

- Historical seen sentence IDs: 1542 unique IDs from Round 4 and all Round 5 candidate/review artifacts, including blind attempts 1-15 PASS and FAIL rows.
- Current selected pool: 990/990 sentence IDs were historical-seen.
- Eligible unseen selected examples: 0.
- Path C: **`HOLDOUT_EXHAUSTED`**; holdout sample 0; semantic holdout review did not begin.
- No prior PASS pool, machine-score filter, seed change, resampling, curation, reject, or rebuild was used.
- Selected examples and `context-curation.json` hashes are unchanged before/after; post-holdout data mutation is false.

### Verification

- `vocab:build`, `vocab:validate`, typecheck, lint, unit tests (14 files / 34 tests), production build: PASS.
- Serial E2E: 32 passed, 16 existing project/configuration skips, 0 failures.
- Context screenshots: desktop, iPhone Context, and Meaning fallback captured; console/page/overflow errors all 0.
- Scope freeze: PASS; no `src/` changes and no UI/Motion/FSRS/CSS changes.

Evidence:

- [Final semantic acceptance](audit/v1.3-context-final-semantic/final-semantic-acceptance.json)
- [Final Phase A review](audit/v1.3-context-final-semantic/phase-a-post-curation-final-review.json)
- [Final blind review](audit/v1.3-context-final-semantic/blind-validation.json)
- [Local gate results](audit/v1.3-context-final-semantic/r5-gate-results.json)
- [Scope freeze](audit/v1.3-context-final-semantic/scope-check-r5.json)
- [Desktop screenshot](audit/v1.3-context-quality/context-desktop.png)
- [iPhone Context screenshot](audit/v1.3-context-quality/context-iphone-390.png)
- [Meaning fallback screenshot](audit/v1.3-context-quality/meaning-fallback-iphone-390.png)
- [Final report](FINAL_V1_3_CORE_LEARNING_REPORT.md)
- [Final Holdout acceptance](audit/v1.3-final-holdout/final-holdout-acceptance.json)
- [Seen-set report](audit/v1.3-final-holdout/seen-set-report.json)
- [Holdout integrity](audit/v1.3-final-holdout/holdout-integrity.json)

### Release boundary

PR #3 remains **OPEN** and unmerged. No deployment was performed and no `v1.3.0` tag was created. Waiting for final Merge & Release decision.
