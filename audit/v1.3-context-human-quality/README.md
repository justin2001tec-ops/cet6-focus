# Context Human Quality Audit & Curation — Round 4

This directory records the sentence-read semantic audit for the v1.3 Context pool. The selector supplies ranked Tatoeba English CC0 candidates and machine flags; it does not create semantic PASS decisions. Every audit row carries a separate sentence-read decision, structured categories when rejected, and a rationale.

## Method

- Source: offline Tatoeba English CC0 export only; runtime does not call Tatoeba.
- Durable decisions: `data-source/examples/context-curation.json` stores rejects only. Rejected candidates are skipped and the next ranked CC0 candidate is attempted; no replacement sentences are authored.
- Targeted audit: every R3 baseline risk candidate plus every final selected example meeting the Round 4 metric/text risk rules.
- Pass 1: fixed seed `216481793`, 350 records.
- Independent validation: fixed seed `216481794`, 250 records, non-overlapping with pass 1.
- Semantic basis: the seven-dimension default-learning-context rubric in the Round 4 handoff. Machine metrics remain triage metadata only.

## Required artifacts

- `risk-targeted-review.json` / `.csv`
- `random-semantic-review-pass1.json` / `.csv`
- `independent-validation.json` / `.csv`
- `curation-summary.md`
- `rejected-regression.md`
- `final-context-quality-report.json`

## Gate interpretation

The final quality gate is the independent semantic sample: at least 200 rows, at least 98% semantic PASS, and zero severe inappropriate rows. Provenance must remain 100%, the targeted review must be complete, and rebuild outputs must be deterministic. Strict curation produced `1110 / 2219 = 50.0%` Context coverage, which is in the documented `50% <= coverage < 55%` exception range: **QUALITY PASS / COVERAGE BELOW TARGET**. This is reported rather than padded with rejected content.

UI, Motion, learning state, and business logic are frozen for Round 4. This audit does not authorize merge, deployment, or creation of the `v1.3.0` tag.
