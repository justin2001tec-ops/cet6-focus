# Deterministic rebuild evidence

`pnpm examples:build` was run twice after the final curation. The following SHA-256 values were identical before and after the second run:

| Artifact | SHA-256 |
| --- | --- |
| `data-source/examples/selected-examples.json` | `F5502B6D1B77464CAB432295737DC82B3416A82CF78D0AD3168A2A407BE22585` |
| `data-source/examples/example-provenance.json` | `6B8C7374DF00A3D494662FC0F036C42F10542F8F52233A6D0C9031F0D9A670AC` |
| `data-source/examples/build-report.json` | `FD658FF51E066A814D459A1CEEBCDC70C14FCD851A3A78B076E81BD66C60A639` |

Both runs selected `1110 / 2219` examples with the same curation counts and provenance output.
