# CET-6 example sentence source

The shipped examples are an offline, deterministic subset of the official Tatoeba English CC0 export:

- Source: [Tatoeba English CC0 sentence export](https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences_CC0.tsv.bz2)
- License: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)
- Snapshot: `data-source/examples/tatoeba/eng_sentences_CC0.tsv`
- Retrieved: 2026-08-24
- Attribution: not legally required under CC0; this project credits Tatoeba.org and its contributors.

The compressed download is retained beside the extracted snapshot so the source can be independently rechecked. `scripts/build-examples.ts` implements the R3 selector v2 and selects at most one sentence for each CET-6 headword using an exact whole-word match. Its hard and scored dimensions are:

- 6-18 tokens, with only clear 19-20 token exceptions; 8-14 tokens and 45-120 characters are preferred.
- Simple punctuation: semicolons, colons, brackets, em-dash structures, stacked commas, and excessive quotation are rejected.
- Mid-sentence capitalization and adjacent capitalized tokens are penalized or rejected to reduce names, institutions, brands, and acronyms.
- Non-target vocabulary difficulty is estimated from token frequencies derived from this same CC0 corpus. More than two low-frequency context tokens or more than one unseen context token is rejected.
- Topic neutrality and standalone readability are scored. Severe explicit, violent, adult, self-harm, and terrorism content is rejected; ordinary identity words are not blanket-filtered.
- Target position and sentence simplicity contribute to an explainable 0-100 quality score. A fixed regression blacklist prevents the eleven R2 problem sentences from returning.

The selector writes `selected-examples.json` for runtime, `example-provenance.json` with the Tatoeba sentence ID and quality metrics for every selected example, and `build-report.json` with raw candidate coverage, quality-approved coverage, and rejection counts. `scripts/build-context-audit.ts` writes the fixed-seed 250-example audit under `audit/v1.3-context-quality/`. The selection is deterministic and does not call an online API.

Chinese translations are intentionally not included: the CC0 sentence export supplies English sentences only, and the product keeps the existing sourced Chinese meaning on the Meaning stage.

## Rebuild

```bash
pnpm examples:build
pnpm vocab:build
pnpm vocab:validate
```

The generated intermediate mapping is `data-source/examples/selected-examples.json`; provenance and selector metrics are adjacent to it; the shipped application data is `public/data/cet6-vocab.v1.json`. `r2-regression-baseline.json` is the committed 11-word comparison snapshot used by the audit, so CI does not depend on Git history depth. `pnpm examples:build` also regenerates the R3 audit package.
