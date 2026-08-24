# Context Human Quality Audit & Curation — Round 4

## Method

- The selector provides candidate ranking and machine risk flags only. It does not generate semantic PASS decisions.
- Every record in the targeted review and both fixed-seed samples is retained with an explicit sentence-read decision and rationale.
- Source remains offline Tatoeba English CC0; no replacement sentence is authored.

## Results

| Gate | Result |
| --- | --- |
| Risk-targeted reviewed | 1002 records; 100% retained in artifact |
| Random semantic pass 1 | 350 records; 350/350 (100%) |
| Independent validation | 250 records; 250/250 (100%) |
| Severe inappropriate | 0 |
| Provenance | 100.0% |
| Final coverage | 1110/2219 (50.0%); QUALITY PASS / COVERAGE BELOW TARGET |

## Rejected categories

- context-dependent: 16
- context-too-hard: 120
- extremism: 12
- hate: 20
- medical-heavy: 45
- obscure-background: 37
- political-heavy: 105
- proper-noun-heavy: 15
- public-controversy: 4
- religious-heavy: 32
- sexual: 12
- unnatural-English: 41
- violence: 46
- weak-teaching-value: 27

## Durable curation

- data-source/examples/context-curation.json contains only reject decisions and keeps sentence IDs traceable to Tatoeba CC0.
- A rejected top candidate is skipped and the next ranked candidate is attempted; words with no acceptable candidate have no Context.
- R3 metric-only audit limitations and the known regression examples are preserved in rejected-regression.md.
