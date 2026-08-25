# CET6 Focus v1.3 — Round 5 + Final Holdout Validation Report

## Final status

**Current status: `HOLDOUT_EXHAUSTED`.** Round 5's semantic work remains historical evidence, but its final `100/100` retest was not an independent holdout. The one-time Final Holdout calculation found no unseen selected sentence, so semantic holdout review did not begin. UI, Motion, and FSRS remained frozen.

- Branch: `product/v1.3-core-learning-redesign`
- Pull request: [#3](https://github.com/justin2001tec-ops/cet6-focus/pull/3)
- PR state: OPEN and unmerged
- Deployment: not performed
- `v1.3.0` tag: not created
- Source: offline Tatoeba English CC0 snapshot
- Vocabulary: 2,219 words, frozen
- Replacement authored examples: none
- Coverage policy: truthful reporting only; Round 5 has no minimum coverage blocker

## Final Holdout Validation — current status

- Frozen HEAD: `0bf592ccd8888f60094d427da1784cc5d3bcd473`
- Historical seen sentence IDs: `1542` unique IDs from Round 4 and all Round 5 candidate/review artifacts, including blind attempts 1–15 PASS and FAIL rows.
- Current selected pool: `990 / 990` sentence IDs were historical-seen.
- Eligible unseen selected examples: `0`.
- Path: **C — `HOLDOUT_EXHAUSTED`**; sample size `0`; no semantic holdout review was performed.
- No prior PASS pool, machine score, seed change, resampling, curation, reject, or rebuild was used after the result.
- Frozen hashes are unchanged: selected examples and `context-curation.json` before/after hashes match exactly.
- This is submitted as-is for final Merge & Release decision; it is not represented as a PASS or FAIL sample result.

Evidence: [`audit/v1.3-final-holdout/final-holdout-acceptance.json`](audit/v1.3-final-holdout/final-holdout-acceptance.json), [`audit/v1.3-final-holdout/seen-set-report.json`](audit/v1.3-final-holdout/seen-set-report.json), [`audit/v1.3-final-holdout/holdout-integrity.json`](audit/v1.3-final-holdout/holdout-integrity.json), and [`audit/v1.3-final-holdout/holdout-summary.md`](audit/v1.3-final-holdout/holdout-summary.md).

## Semantic review and durable curation

Every decision was made from the complete English sentence. Machine scores remain triage metadata and never synthesize or overwrite a semantic decision. Every real FAIL was retained as a sentence-specific rationale, durably rejected, followed by rebuild and retest.

| Stage | Result |
| --- | --- |
| Initial Phase A | 300 reviewed; 214 PASS / 86 FAIL; severe inappropriate 0 |
| Mandatory recheck | 11 / 11 rejected and durably recorded |
| Final post-curation Phase A | 300 / 300 PASS; severe inappropriate 0; duplicate/generic rationale gates 0 |
| Final blind validation retest | 100 / 100 PASS; severe inappropriate 0; duplicate/generic rationale gates 0 |
| Blind overlap checks | No overlap with Phase A, post-curation Phase A, or current R4 independent validation; 100 unique sentence IDs |
| Durable curation | 30 global rejects; 877 pair rejects; 350 new R5 pair rejects |

The blind final was rebuilt once a gate check found four sentence IDs overlapping a regenerated R4 independent artifact. The decisions were not edited to improve the percentage: a new seed selected 100 pairs that had already passed separate blind sentence-read reviews, excluded all current frozen-round samples and current R4 independent IDs, and then revalidated them.

The later Final Holdout Handoff correctly identifies that this procedure used `priorBlindPassPairs`; therefore the Round 5 `100/100` result is retained as historical retest evidence, not independent unseen-holdout evidence.

## Shipped data result

- Selected examples: `990 / 2,219 = 44.6%` quality-approved coverage
- Raw eligible candidate coverage: `70.4%`
- Provenance: `990 / 990 = 100%`
- No fallback candidate count: `349`
- Coverage below the former target is informational only under Round 5; no rejected sentence was restored to pad coverage.
- Build report: [`data-source/examples/build-report.json`](data-source/examples/build-report.json)
- Durable curation: [`data-source/examples/context-curation.json`](data-source/examples/context-curation.json)
- Final vocabulary: [`public/data/cet6-vocab.v1.json`](public/data/cet6-vocab.v1.json)

## Verification gates

| Gate | Result |
| --- | --- |
| `pnpm run vocab:build` | PASS; deterministic rebuild, 2,219 words |
| `pnpm run vocab:validate` | PASS; coverage informational, provenance 100%, final semantic gates PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run lint` | PASS |
| `pnpm run test` | PASS; 14 files, 34 tests |
| `pnpm run build` | PASS; Vite production build |
| `pnpm run test:e2e:serial` | PASS; 32 passed, 16 existing project/configuration skips, 0 failures |
| `pnpm run capture:context-quality` | PASS; desktop, iPhone Context, and Meaning fallback screenshots; console/page/overflow errors all 0 |
| R5 scope freeze | PASS; no `src/` changes and no UI/Motion/FSRS/CSS changes |
| Final Holdout integrity | PASS; selected/curation hashes unchanged; no post-holdout data mutation |
| Final Holdout semantic gate | `HOLDOUT_EXHAUSTED`; no eligible unseen sample existed, so no semantic review was started |

## Evidence package

- Final acceptance: [`audit/v1.3-context-final-semantic/final-semantic-acceptance.json`](audit/v1.3-context-final-semantic/final-semantic-acceptance.json)
- Audit index: [`audit/v1.3-context-final-semantic/README.md`](audit/v1.3-context-final-semantic/README.md)
- Final Phase A review: [`audit/v1.3-context-final-semantic/phase-a-post-curation-final-review.json`](audit/v1.3-context-final-semantic/phase-a-post-curation-final-review.json)
- Mandatory recheck: [`audit/v1.3-context-final-semantic/mandatory-recheck.json`](audit/v1.3-context-final-semantic/mandatory-recheck.json)
- Final blind candidates: [`audit/v1.3-context-final-semantic/blind-validation-candidates.json`](audit/v1.3-context-final-semantic/blind-validation-candidates.json)
- Final blind review: [`audit/v1.3-context-final-semantic/blind-validation.json`](audit/v1.3-context-final-semantic/blind-validation.json)
- Local gate record: [`audit/v1.3-context-final-semantic/r5-gate-results.json`](audit/v1.3-context-final-semantic/r5-gate-results.json)
- Frozen scope record: [`audit/v1.3-context-final-semantic/scope-check-r5.json`](audit/v1.3-context-final-semantic/scope-check-r5.json)
- Desktop screenshot: [`audit/v1.3-context-quality/context-desktop.png`](audit/v1.3-context-quality/context-desktop.png)
- iPhone Context screenshot: [`audit/v1.3-context-quality/context-iphone-390.png`](audit/v1.3-context-quality/context-iphone-390.png)
- Meaning fallback screenshot: [`audit/v1.3-context-quality/meaning-fallback-iphone-390.png`](audit/v1.3-context-quality/meaning-fallback-iphone-390.png)
- Final Holdout directory: [`audit/v1.3-final-holdout/`](audit/v1.3-final-holdout/)

## Stop boundary

Final Holdout is exhausted and work stops here. PR #3 remains OPEN for final Merge & Release decision. No data was modified after the exhaustion result; no merge, deployment, or `v1.3.0` tag was performed.
