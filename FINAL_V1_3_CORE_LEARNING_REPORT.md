# CET6 Focus v1.3 — Round 5 Final Semantic Acceptance Report

## Final status

**PASS — Round 5 stop conditions met.** This round is limited to sentence-by-sentence Context review, durable curation, rebuild, and blind validation. UI, Motion, and FSRS were frozen throughout.

- Branch: `product/v1.3-core-learning-redesign`
- Pull request: [#3](https://github.com/justin2001tec-ops/cet6-focus/pull/3)
- PR state: OPEN and unmerged
- Deployment: not performed
- `v1.3.0` tag: not created
- Source: offline Tatoeba English CC0 snapshot
- Vocabulary: 2,219 words, frozen
- Replacement authored examples: none
- Coverage policy: truthful reporting only; Round 5 has no minimum coverage blocker

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

## Stop boundary

Round 5 is complete and work stops here. PR #3 remains OPEN for final acceptance. No merge, deployment, or `v1.3.0` tag was performed.
