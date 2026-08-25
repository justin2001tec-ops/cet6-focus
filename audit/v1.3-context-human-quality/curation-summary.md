# Context Human Quality Audit & Curation — Round 4

## Method

- The selector provides candidate ranking and machine risk flags only. It does not generate semantic PASS decisions.
- Every record in the targeted review and both fixed-seed samples is retained with an explicit sentence-read decision and rationale.
- Source remains offline Tatoeba English CC0; no replacement sentence is authored.

## Results

| Gate | Result |
| --- | --- |
| Risk-targeted reviewed | 1056 records; 100% retained in artifact |
| Random semantic pass 1 | 350 records; 350/350 (100%) |
| Independent validation | 250 records; 250/250 (100%) |
| Severe inappropriate | 0 |
| Provenance | 100.0% |
| Final coverage | 990/2219 (44.6%); QUALITY PASS / COVERAGE BELOW TARGET |

## Rejected categories

- archaic: 6
- context-dependent: 30
- context-too-hard: 157
- death-heavy: 8
- extremism: 12
- fantastical-context: 9
- hate: 23
- medical-heavy: 57
- obscure-background: 37
- other: 2
- political-heavy: 115
- proper-noun-heavy: 19
- public-controversy: 7
- rare-sense: 1
- religious-heavy: 33
- sexual: 12
- specialist-background: 14
- syntax-too-complex: 1
- unnatural-English: 50
- violence: 55
- weak-teaching-value: 48

## Durable curation

- data-source/examples/context-curation.json contains only reject decisions and keeps sentence IDs traceable to Tatoeba CC0.
- A rejected top candidate is skipped and the next ranked candidate is attempted; words with no acceptable candidate have no Context.
- R3 metric-only audit limitations and the known regression examples are preserved in rejected-regression.md.
