# CET-6 example sentence source

The shipped examples are an offline, deterministic subset of the official Tatoeba English CC0 export:

- Source: [Tatoeba English CC0 sentence export](https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences_CC0.tsv.bz2)
- License: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)
- Snapshot: `data-source/examples/tatoeba/eng_sentences_CC0.tsv`
- Retrieved: 2026-08-24
- Attribution: not legally required under CC0; this project credits Tatoeba.org and its contributors.

The compressed download is retained beside the extracted snapshot so the source can be independently rechecked. `scripts/build-examples.ts` selects at most one sentence for each CET-6 headword using an exact whole-word match. It rejects URLs, digits, markup, non-ASCII text after normalization, repeated target words, sentences outside the 7-24 token range, and a conservative list of explicit profanity/adult/sensitive-content terms, including current political and culture-war references. The selection is deterministic and does not call an online API.

Chinese translations are intentionally not included: the CC0 sentence export supplies English sentences only, and the product keeps the existing sourced Chinese meaning on the Meaning stage.

## Rebuild

```bash
pnpm examples:build
pnpm vocab:build
pnpm vocab:validate
```

The generated intermediate mapping is `data-source/examples/selected-examples.json`; the shipped application data is `public/data/cet6-vocab.v1.json`.
