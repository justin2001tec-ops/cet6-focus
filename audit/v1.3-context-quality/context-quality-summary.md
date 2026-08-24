# Context Quality Refinement — Round 3 Sample Audit

## Method

- Source remains the offline Tatoeba English CC0 snapshot; no runtime API, AI generation, or imported Chinese translation is used.
- Fixed seed: `216489987`.
- Sample size: 250 selected examples (target minimum: 200).
- Review mode: Lula agent-assisted audit using the five handoff dimensions, with every sampled record retained in JSON/CSV for follow-up.
- A dimension is PASS only when the shipped provenance metrics satisfy the documented selector policy. Topic neutrality is intentionally strict (topicPenalty = 0); a downgraded topic is visible as a failure rather than silently counted as neutral.

## Results

| Gate | Result |
| --- | --- |
| Sample size >= 200 | PASS (250) |
| Sample quality pass rate >= 90% | PASS (98.0%, 245/250) |
| Severe inappropriate sample count = 0 | PASS (0) |
| Provenance coverage = 100% | PASS (100.0%) |
| Quality-approved coverage >= 60% | FAIL (50%) |

## Five-dimension rubric

1. The sentence is independently understandable.
2. Non-target context vocabulary is not disproportionately difficult.
3. The topic is neutral for a default learning context.
4. Syntax is short and readable, without stacked punctuation or long clauses.
5. The target word is used once, in a natural position, with useful context.

The complete per-example decisions are in [context-quality-sample.json](context-quality-sample.json) and [context-quality-sample.csv](context-quality-sample.csv). Build-level rejection counts are in [context-quality-build-report.json](context-quality-build-report.json).
