# CET6 Focus v1.3 Final Holdout Validation

Status: **HOLDOUT_EXHAUSTED**

This directory records the one-time unseen holdout eligibility calculation against frozen HEAD 0bf592ccd8888f60094d427da1784cc5d3bcd473. Every sentence ID present in historical candidate/review artifacts was treated as seen, including PASS and FAIL rows from Round 5 blind attempts 1-15. The current selected pool has no eligible unseen sentence, so the handoff requires an immediate exhausted stop.

No semantic review, curation, rebuild, seed change, resampling, or data mutation was performed after the exhaustion result.

See [final-holdout-acceptance.json](final-holdout-acceptance.json) and [holdout-integrity.json](holdout-integrity.json).
